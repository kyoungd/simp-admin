'use strict';

/**
 *  symbol controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::symbol.symbol', ({ strapi }) => ({

    // async findOne(ctx) {
    //     const { id } = ctx.params;  // pass in the name field
    //     const { query } = ctx;

    //     const entity = await strapi.db.query('api::symbol.symbol').findOne({
    //         select: ['data'],
    //         where: { name: id },
    //         populate: { category: true },
    //     });
    //     // const entity = await strapi.service('api::symbol.symbol').findOne(id, query);
    //     const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    //     return this.transformResponse(sanitizedEntity);
    // },

    async update(ctx) {
        const { id } = ctx.params;
        const { body } = ctx.request;

        const entity = await strapi.entityService.update('api::symbol.symbol', id, {
            data: {
                data: body,
            },
        });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    }

}));
