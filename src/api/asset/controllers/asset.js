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

    async updateDb(symbol, timeframe, body) {
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
            return true;
        } else {
            const entity2 = await strapi.db.query('api::asset.asset').create({
                data: {
                    data: body,
                    symbol: symbol,
                    timeframe: timeframe
                },
            });
            return true;
        }
        return false;
    },

    async create(ctx) {
        const { body } = ctx.request;

        let failCount = 0;
        for (const entry of body) {
            const { symbol, timeframe, data } = entry;
            const isUpdateOk = await this.updateDb(symbol, timeframe, data);
            if (!isUpdateOk)
                ++failCount;
        }
        const result = { failure: failCount, success: body.length - failCount };
        const sanitizedEntity = await this.sanitizeOutput(result, ctx);
        return this.transformResponse(sanitizedEntity);
        // const entry = await strapi.db.query('api::asset.asset').findOne({
        //     where: {
        //         symbol: symbol,
        //         timeframe: timeframe
        //     },
        // });
        // if (entry) {
        //     const entity = await strapi.entityService.update('api::asset.asset', entry.id, {
        //         data: {
        //             data: body,
        //         },
        //     });
        //     const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        //     return this.transformResponse(sanitizedEntity);
        // } else {
        //     const entity2 = await strapi.db.query('api::asset.asset').create({
        //         data: {
        //             data: body,
        //             symbol: symbol,
        //             timeframe: timeframe
        //         },
        //     });
        //     const sanitizedEntity = await this.sanitizeOutput(entity2, ctx);
        //     return this.transformResponse(sanitizedEntity);
        // }
    },

}));
