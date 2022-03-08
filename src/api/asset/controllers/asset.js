'use strict';

/**
 *  asset controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::asset.asset', ({ strapi }) =>({

    async find(ctx) {
        const { query } = ctx;

        // some logic here
        const entity = await strapi.db.query('api::asset.asset').findOne({
            where: { symbol: query['symbol'],
                    timeframe: query['timeframe'] },
        });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        const { query } = ctx;
        const { body } = ctx.request;

        const { symbol, timeframe} = query;
        const entry = await strapi.db.query('api::asset.asset').findOne({
            where: {
                symbol: symbol,
                timeframe: timeframe
            },
        });
        if (entry) {
            const entity = await strapi.entityService.update('api::asset.asset', entry.id, {
                data: {
                    data: body,
                },
            });
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        } else {
            const entity2 = await strapi.db.query('api::asset.asset').create({
                data: {
                    data: body,
                    symbol: symbol,
                    timeframe: timeframe
                },
            });
            const sanitizedEntity = await this.sanitizeOutput(entity2, ctx);
            return this.transformResponse(sanitizedEntity);
        }
    },

}));
