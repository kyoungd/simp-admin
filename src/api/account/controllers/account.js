'use strict';

/**
 * account controller
 */
const _ = require('lodash');
const moment = require('moment');
const { createDiscordRoomJson, mergeChannelResult} = require('../generateDiscordConfig'); ;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createCoreController } = require('@strapi/strapi').factories;

const getStripeSubscription = async (stripeCustomerId, stat = null) => {
    const status = ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'all', 'ended'];
    const validStatus = (stat) => {
        if (stat && status.includes(stat.toLowerCase())) {
            return stat.toLowerCase();
        } else {
            return 'all';
        }
    }
    const subscriptionStatus = stat ? stat : 'all';
    const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: subscriptionStatus,
        expand: ["data.default_payment_method"],
    });
    return subscriptions;
}

module.exports = createCoreController('api::account.account', ({ strapi }) => ({

    async find(ctx) {
        const { id } = ctx.state.user;
        const entity = await strapi.db.query('api::account.account').findOne({
            where: { user: id },
            populate: {
                user: true,
                photo: true
            }
        });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async update(ctx) {
        const { id } = ctx.state.user;
        const { body } = ctx.request;

        const entry = await strapi.db.query('api::account.account').findOne({
            where: { user: id },
        });
        const newdata = _.merge(entry, body);
        const entity = await strapi.entityService.update('api::account.account', newdata.id, {
                data: newdata,
            });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async getAvailableServices(ctx) {
        const prices = await stripe.prices.list({
            expand: ['data.product']
        });
        //   console.log("prices", prices);
        // res.json(prices.data.reverse());
        const entity = prices.data.reverse();
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async createSubscription (ctx) {
        // console.log(req.body);
        try {
            const { id } = ctx.state.user;
            const { body } = ctx.request;
            const account = await strapi.service('api::account.account').getUserAccount(id);
            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price: body.priceId,
                        quantity: 1,
                    },
                ],
                customer: account.stripeId,
                success_url: process.env.STRIPE_SUCCESS_URL,
                cancel_url: process.env.STRIPE_CANCEL_URL,
            });
            // console.log("checkout session", session);
            const entity = { url: session.url };
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } catch (err) {
            console.log(err);
        }
    },

    async getSubscriptions (ctx) {
        try {
            const { id } = ctx.state.user;
            const { query } = ctx.request;
            const account = await strapi.service('api::account.account').getUserAccount(id);

            const subscriptions = await getStripeSubscription(account.stripeId, query['status']);
            // const status = ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'all', 'ended'];
            // const validStatus = (stat) => {
            //     if (status.includes(stat.toLowerCase())) {
            //         return stat.toLowerCase();
            //     } else {
            //         return 'all';
            //     }
            // }
            // const subscriptionStatus = query['status'] ? validStatus(query['status']) : 'all';
            // const subscriptions = await stripe.subscriptions.list({
            //     customer: account.stripeId,
            //     status: subscriptionStatus,
            //     expand: ["data.default_payment_method"],
            // });

            // res.json(subscriptions);
            //
            // const entity = subscriptions.data.map((row) => {
            //     row['plan_id'] = row.plan.id;
            //     delete row['automatic_tax'];
            //     delete row['customer'];
            //     delete row['default_payment_method'];
            //     delete row['default_tax_rates'];
            //     delete row['invoice_customer_balance_settings'];
            //     delete row['items'];
            //     delete row['payment_settings'];
            //     delete row['plan'];
            //     return row;
            // });
            //
            const techList = subscriptions.data.map((row) => row.plan.id);
            const techs = await strapi.db.query('api::technique.technique').findMany({
                where: { stripePriceId : { $in: techList } },
                populate: { technique_details : true },
            })
            const entity = techs.map((tech) => {
                const sub = subscriptions.data.find((row) => row.plan.id === tech.stripePriceId);
                tech['last4'] = sub.default_payment_method.card.last4;
                tech['current_period_end'] = sub.current_period_end;
                tech['status'] = sub.status;
                tech['renewal_date'] = moment(sub.current_period_end * 1000)
                    .format('YYYY/MM/DD')
                    .toString();
                tech['currency'] = sub.plan.currency;
                delete tech.scheduleEvent;
                delete tech.stripePriceId;
                return tech;
            })
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } catch (err) {
            console.log(err);
        }
    },

    async getSubscriptionPortal (ctx) {
        try {
            const { id } = ctx.state.user;
            const account = await strapi.service('api::account.account').getUserAccount(id);

            const portalSession = await stripe.billingPortal.sessions.create({
                customer: account.stripeId,
                return_url: process.env.STRIPE_SUCCESS_URL,
            });
            // res.json(portalSession.url);
            const entity = { url: portalSession.url };
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } catch (err) {
            console.log(err);
        }
    },

    async getDiscordRooms (ctx) {
        try {
            const { id } = ctx.state.user;

            // const accounts = await strapi.service('api::account.account').find();
            const accounts = await strapi.db.query('api::account.account').findMany({
                populate: {
                    user: true,
                }
            });
            const prices = await stripe.prices.list({
                expand: ['data.product']
            });
            // const techniques = await strapi.service('api::technique.technique').find();
            const techniques = await strapi.db.query('api::technique.technique').findMany({
                populate: {
                    owner: true,
                }
            });
            const subscriptions = await stripe.subscriptions.list({
                status: 'all',
                expand: ["data.default_payment_method"],
            });
            const result = createDiscordRoomJson( accounts, prices, techniques, subscriptions );
            const entity = { discord: result }
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } catch (err) {
            console.log(err);
        }

    },

    // get channels the user is teaching
    // get start time and end time for today
    // convert stripe-customer-id to user-id and discord-id
    // create a single json object with all the data
    // return json object
    async getExpertSubscriptions (ctx) {
        try {
            const result = [];
            const { id } = ctx.state.user;
            const channels = await strapi.db.query('api::technique.technique').findMany({
                where: { owner: id },
                populate: {
                    owner: true,
                }
            });
            for (const channel of channels) {
                // get students in channels
                const subscriptions = await stripe.subscriptions.list({
                    price: channel.stripePriceId,
                    status: 'active',
                    expand: ["data.default_payment_method"],
                });
                const techniques = await strapi.db.query('api::technique.technique').findMany({
                    where: { stripePriceId: channel.stripePriceId },
                });
                const customers = _.map(subscriptions.data, 'customer');
                const accounts = await strapi.db.query('api::account.account').findMany({
                    where: {
                        stripeId: {
                            $in: customers
                        }
                    },
                    populate: {
                        user: true,
                    }
                });
                const chan = mergeChannelResult(accounts, channel, subscriptions, techniques);
                result.push(chan);
            }
            const entity = { result : result }
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } catch(err) {
            console.log(err);
            return (err);
        }
    },

    async getSchedule(ctx) {
        try {
            const { id } = ctx.state.user;

            const account = await strapi.service('api::account.account').getUserAccount(id);
            const subscriptions = await getStripeSubscription(account.stripeId, 'active');
            const results = await Promise.all(subscriptions.data.map(async (sub) => {
                const technique = await strapi.db.query('api::technique.technique').findMany({
                    select: ['scheduleTemplate'],
                    where: { stripePriceId: sub.plan.id },
                });
                if (technique.length > 0) {
                    return technique[0].scheduleEvent.map((event) => (
                        {id: event.id, date: event.date, start: event.start, end: event.end, title: event.title}
                    ));
                };
            }));
            return results ? results.flat(1) : [];
        } catch(err) {
            console.log(err);
            return (err);
        }
    },
    
    async getDailyDiscordRooms (cts) {
        const ownerId = process.env.DISCORD_OWNER_ID;
        const guildId = process.env.DISCORD_GUILD_ID;
        const data = {
            prefix: "!",
            debug_guilds: [
                123456789
            ],
            classes: [
                {
                    name: "math",
                    notifications: ["09:30-10:45"],
                    voice_channel: null,
                    text_channel: null,
                    category_channel: null,
                    id: null,
                    leader: [
                        762428545221263390
                    ],
                    users: [
                        1038629302608076990,
                        1033486875287093249
                    ]
                },
                {
                    name: "english",
                    notifications: ["09:30-11:00", "15:30-16:30"],
                    voice_channel: null,
                    text_channel: null,
                    category_channel: null,
                    leader: [
                        762428545221263390
                    ],
                    users: [
                        1033486875287093249
                    ]
                }
            ]
        };
        return data;
    },

}));
