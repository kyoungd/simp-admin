'use strict';

/**
 *  daily controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::daily.daily', ({ strapi }) => ({

    async find(ctx) {
        const { query } = ctx;
        const { date } = query;

        let entites;
        if (date === undefined) {
            entities = await strapi.entityService.findMany('api::daily.daily', {
                sort: [{ post_date: 'desc' }],
                limit: 1
            });
        } else {
            entities = await strapi.db.query('api::daily.daily').findOne({
                where: {
                    post_date: date
                },
            });
        }
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        const { id } = ctx.state.user;
        const { body } = ctx.request;

        const entry = await strapi.db.query('api::favorite.favorite').findOne({
            where: { user: id },
        });
        if (entry) {
            const entity = await strapi.entityService.update('api::favorite.favorite', entry.id, {
                data: {
                    data: body,
                },
            });
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } else {
            const entity2 = await strapi.db.query('api::favorite.favorite').create({
                data: {
                    data: body,
                    user: id
                },
            });
            const sanitizedEntity = await this.sanitizeOutput(entity2, ctx);
            return this.transformResponse(sanitizedEntity);
        }
    },

}));
