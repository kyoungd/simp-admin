'use strict';

/**
 * account service
 */

const GenerateEvents = require('../generateSchedule');
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::account.account', ({ strapi }) => ({
    newUser(user_id, stripe_id, discord_id) {
        return strapi.service('api::account.account').create({
            data: {
                user: user_id,
                stripeId: stripe_id,
                discordId: discord_id,
            }
        });
    },
    getUserAccount(user_id) {
        return strapi.db.query('api::account.account').findOne({
            where: { user: user_id },
        });
    },
    async setWeeklySchedule() {
        const channels = await strapi.db.query('api::technique.technique').findMany({
            populate: {
                owner: true,
            }
        });
        for (const channel of channels) {
            if (channel.scheduleResource && channel.scheduleTemplate) {
                const numWeeks = 9;
                const schedules = !channel.scheduleEvent ? [] : channel.scheduleEvent;
                const app = new GenerateEvents(channel.schduleResource, channel.scheduleTemplate, schedules);
                const events = app.GenerateWeeklyEvents(numWeeks);
                await strapi.entityService.update('api::technique.technique', channel.id, {
                    data: {
                        scheduleEvent: JSON.stringify(events),
                    },
                });
            }
        }
        return true;
    },
}));

// const { createCoreService } = require('@strapi/strapi').factories;
// module.exports = createCoreService('api::account.account');
