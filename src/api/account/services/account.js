'use strict';

/**
 * account service
 */

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
        })
    },
}));

// const { createCoreService } = require('@strapi/strapi').factories;
// module.exports = createCoreService('api::account.account');
