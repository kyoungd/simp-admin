'use strict';

/**
 *  realtime controller
 */

const moment = require('moment');
const { createCoreController } = require('@strapi/strapi').factories;

const timefrom = (timeframe) => {
    return moment().subtract(15, 'minutes');
}

module.exports = createCoreController('api::realtime.realtime', ({ strapi }) => ({

    async find(ctx) {
        const { datatype, timeframe } = ctx.query;

        // some logic here
        const readFrom = timefrom(timeframe);
        const query = {
            datatype,
            timeframe,
            data_at: { $gte: readFrom.toDate() },
            _sort: 'symbol:asc, data_at:desc',
        }
        const entities = await strapi.services['api::realtime.realtime'].find(query);
        const sanitizedEntity = await this.sanitizeOutput(entities, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        const { body } = ctx.request;

        let entity2;
        for (const entity of body) {
            entity2 = await strapi.db.query('api::realtime.realtime').create({
                data: {
                    "datatype": "VSA",
                    "timeframe": "MIN15",
                    "symbol": entity.symbol,
                    "data": { "vsa": entity.vsa }
                }
            });
        }
        const sanitizedEntity = await this.sanitizeOutput(entity2, ctx);
        return this.transformResponse(sanitizedEntity);
    }

}));
