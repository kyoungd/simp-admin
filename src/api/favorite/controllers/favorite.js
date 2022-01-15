'use strict';

/**
 *  favorite controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::favorite.favorite', ({ strapi }) => ({
    // Method 3: Replacing a core action
    async findOne(ctx) {
        const { id } = ctx.state.user;
        const { query } = ctx;

        const entity = await strapi.service('api::favorite.favorite').findOne(id, query);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

        return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        // some logic here
        const response = await super.create(ctx);
        // some more logic

        return response;
    },

    async update(ctx) {
        const { id } = ctx.state.user;
        const { body } = ctx.request;

        const entity = await strapi.entityService.update('api::favorite.favorite', id, {
                data: {
                    data: body,
                },
            });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    }

}));
