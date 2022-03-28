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
        // const query = {
        //     datatype,
        //     timeframe,
        //     data_at: { $gte: readFrom },
        //     _sort: 'symbol:asc, data_at:desc',
        // }
        // const entities = await strapi.services['api::realtime.realtime'].find(query);
        
        const result = await strapi.entityService.findMany('api::realtime.realtime', {
            filters: {
                $and: [ 
                    { datatype: datatype }, 
                    { timeframe: timeframe },
                    {
                        data_at: { $gt: readFrom.toISOString() },
                    },
                ],
            },
            sort: [{ symbol: 'asc' }, { createdAt: 'desc' }],
        });
        const entities = result.filter(entity => entity.data.vsa > 0)
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
                    "timeframe": entity.timeframe,
                    "symbol": entity.symbol,
                    "data": { "vsa": entity.vsa },
                    "data_at": new Date()
                }
            });
        }
        const sanitizedEntity = await this.sanitizeOutput(entity2, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async delete(ctx) {
        const { id } = ctx.state.user;
        const { datatype } = ctx.query;
        // some logic here
        if (ctx.state.user.role.type !== 'sysops') {
            return ctx.unauthorized();
        };
        const entity2 = await strapi.db.query('api::realtime.realtime').deleteMany({
            where: {
                datatype: datatype,
            },
        });
        const sanitizedEntity = await this.sanitizeOutput(entity2, ctx);
        return this.transformResponse(sanitizedEntity);
    }

}));
