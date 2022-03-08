'use strict';

/**
 *  favorite controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::favorite.favorite', ({ strapi }) => ({

    async find(ctx) {
        const { id } = ctx.state.user;
        // some logic here
        const entity = await strapi.db.query('api::favorite.favorite').findOne({
            where: { user: id },
        });
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

    async update(ctx) {
        const { id } = ctx.state.user;
        const { body } = ctx.request;

        const entry = await strapi.db.query('api::favorite.favorite').findOne({
            where: { user: id },
        });
        if (entry) {
            const entity = await strapi.entityService.update('api::favorite.favorite', id, {
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
    }

}));
