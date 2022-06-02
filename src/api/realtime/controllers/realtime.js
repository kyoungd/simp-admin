'use strict';

/**
 *  realtime controller
 */

const moment = require('moment');
require('moment-timezone');
const { createCoreController } = require('@strapi/strapi').factories;

const tf2 = '2Min'
const tf5 = '5Min'
const tf15 = '15Min'

const timefrom = (timeframe, enddate = null) => {
    const onedate = enddate === null ? moment() : moment.tz(enddate, 'Etc/GMT');
    switch(timeframe) {
        case tf2:
            return onedate.subtract(2, 'minutes');
        case tf5:
            return onedate.subtract(5, 'minutes');
        case tf15:
            return onedate.subtract(15, 'minutes');
        default:
            return onedate.subtract(5, 'minutes');
    }
}

const timeto = (enddate = null) => {
    const onedate = enddate === null ? moment() : moment.tz(enddate, 'Etc/GMT');
    return onedate;
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
        
        const entities = await strapi.entityService.findMany('api::realtime.realtime', {
            filters: {
                $or: [
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf15 },
                            {
                                data_at: { $gt: timefrom(tf15).toISOString() },
                            },
                        ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf5 },
                            {
                                data_at: { $gt: timefrom(tf5).toISOString() },
                            },
                        ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf2 },
                            {
                                data_at: { $gt: timefrom(tf2).toISOString() },
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

    async findOne(ctx) {
        const { id } = ctx.params;
        const datatype = 'VSA';
        const enddate = id;
        const readFrom = timefrom(tf5, enddate);
        const entities = await strapi.entityService.findMany('api::realtime.realtime', {
            filters: {
                $or: [
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf15 },
                            {
                                $and: [
                                    { data_at: { $gt: timefrom(tf15, enddate).toISOString() } },
                                    { data_at: { $lte: timeto(enddate).toISOString() } }
                                ]
                            },
                        ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf5 },
                            {
                                $and: [
                                    { data_at: { $gt: timefrom(tf5, enddate).toISOString() } },
                                    { data_at: { $lte: timeto(enddate).toISOString() } }
                                ]
                            },
                        ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf2 },
                            {
                                $and: [
                                    { data_at: { $gt: timefrom(tf2, enddate).toISOString() } },
                                    { data_at: { $lte: timeto(enddate).toISOString() } }
                                ]
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
