'use strict';

/**
 *  technique-user controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const cleanData = (subscriptions) => {
    const cleaned = subscriptions.map((subscription) => {
        const t = subscription.technique;
        const u = subscription.user;
        return { technique: t.name, id: u.id, user: u.username, display: u.displayName };
    });
    return {
        "data": cleaned.sort((a, b) => a.technique.localeCompare(b.technique))
            || a.user.localeCompare(b.user), "meta" : {}};
}

module.exports = createCoreController('api::technique-user.technique-user', ({ strapi }) => ({

    async find(ctx) {
        const { query } = ctx;
        const { id } = ctx.state.user;
        const subscriptions = await strapi.db.query('api::technique-user.technique-user').findMany({
            populate: {
                technique: true,
                user: true,
            },
            where: {
                technique: {
                    owner: id
                },
            }
        });
        const cleaned = cleanData(subscriptions);
        return cleaned;
    },

}));
