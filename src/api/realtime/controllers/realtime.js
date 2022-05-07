'use strict';

/**
 *  realtime controller
 */

const moment = require('moment');
const { createCoreController } = require('@strapi/strapi').factories;

const tf5 = 'Min5'
const tf15 = 'Min15'

const timefrom = (timeframe) => {
    if (timeframe === tf5)
        return moment().subtract(5, 'minutes');
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
        
        const entities1 = await strapi.entityService.findMany('api::realtime.realtime', {
            filters: {
                $or: [
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: timefrom(tf15) },
                            {
                                data_at: { $gt: timefrom(tf15) },
                            },
                        ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: timefrom(tf5) },
                            {
                                data_at: { $gt: timefrom(tf5) },
                            },
                        ]
                    }
                ]
            },
            sort: [{ symbol: 'asc' }, { createdAt: 'desc' }],
        });
        const sanitizedEntity = await this.sanitizeOutput(entities, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        const { body } = ctx.request;

        const getData = (row) => {
            try {
                delete row['datatype'];
                delete row['timeframe'];
                delete row['symbol'];
                return row;
            }
            catch (e) {
                console.log(e);
            }
            return row;
        }

        let entity2;
        for (const entity of body) {
            const datatype = entity.datatype;
            const timeframe = entity.timeframe;
            const symbol = entity.symbol;
            const data = getData(entity);
            entity2 = await strapi.db.query('api::realtime.realtime').create({
                data: {
                    "datatype": datatype,
                    "timeframe": timeframe,
                    "symbol": symbol,
                    "data": data,
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
