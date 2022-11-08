'use strict';

/**
 * account controller
 */
const _ = require('lodash');

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createCoreController } = require('@strapi/strapi').factories;

function createDiscordRoomJson(accounts, prices, techniques, subscriptions) {
    const subscription1 = [];
    for (const row of subscriptions.data) {
        const { customer, status } = row;
        const { price } = row.items.data[0];
        subscription1.push({ customer, priceId: price.id, status });
    }

    const priceList = [];
    for (const row of prices.data) {
        priceList.push({ priceId: row.id, name: row.product.name, livemode: row.livemode });
    }

    const subscription2 = [];
    for (const row of subscription1) {
        const channel = techniques.find(tech => tech.stripePriceId === row.priceId);
        const { email, displayName, id } = channel.owner;
        if (channel) {
            subscription2.push({ ...row, name: channel.name, email, displayName, channelLeaderId: id });
        }
    }

    const subscription3 = [];
    for (const row of subscription2) {
        const account = accounts.find(acc => acc.stripeId === row.customer);
        if (account) {
            const { discordId } = account;
            if (discordId)
                subscription3.push({ ...row, discordId });
        }
    }

    const subscription4 = [];
    for (const row of subscription3) {
        const account = accounts.find(acc => acc.user.id === row.channelLeaderId);
        if (account) {
            const { discordId } = account;
            if (discordId)
                subscription4.push({ ...row, leaderDiscordId: discordId });
        }
    }

    const subscription5 = _.groupBy(subscription4, 'priceId');
    const discordRooms = [];
    for (const [priceId, rows] of Object.entries(subscription5)) {
        const leaderDiscordId = rows[0].leaderDiscordId;
        const channelName = rows[0].name;
        const students = [];
        for (const row of rows) {
            students.push(row.discordId);
        }
        discordRooms.push({ priceId, leaderDiscordId, channelName, students });
    }
    return discordRooms;
}

function mergeChannelResult(accounts, channel, subscriptions, techniques) {
    const result = {
        channelId: channel.id,
        room: channel.name,
        summary: channel.summary,
        stripePriceId: channel.stripePriceId,
    };
    const customers = _.map(subscriptions.data, 'customer');
    const students = accounts.map(account => {
        if (customers.includes(account.stripeId)) {
            return { username: account.user.username, email: account.user.email, displayName: account.user.displayName };
        }
    });
    result.students = students;
    console.log(result);
    return result;
}

module.exports = createCoreController('api::account.account', ({ strapi }) => ({

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

            const status = ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'all', 'ended'];
            const validStatus = (stat) => {
                if (status.includes(stat.toLowerCase())) {
                    return stat.toLowerCase();
                } else {
                    return 'all';
                }
            }
            const subscriptionStatus = query['status'] ? validStatus(query['status']) : 'all';
            const subscriptions = await stripe.subscriptions.list({
                customer: account.stripeId,
                status: subscriptionStatus,
                expand: ["data.default_payment_method"],
            });

            // res.json(subscriptions);
            const entity = subscriptions;
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

    async getDailyDiscordRooms (cts) {
        const data = {
            discord_token: "NzYyNDI4NTQ1MjIxMjYzMzkw.GTA6ao.vbJBA-uxl0W_3TecL1FQOAlKUn8KPBJDV9ikXM",
            prefix: "!",
            debug_guilds: [
                123456789
            ],
            owner_id: 9876543221,
            main_guild_id: 1033463361750450297,
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
