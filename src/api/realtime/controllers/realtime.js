'use strict';

const { default: entityService } = require('@strapi/strapi/lib/services/entity-service');
/**
 *  realtime controller
 */

const moment = require('moment');
require('moment-timezone');
const { createCoreController } = require('@strapi/strapi').factories;

const tf2 = '2Min'
const tf5 = '5Min'
const tf15 = '15Min'
// const timezone = 'Etc/GMT';
const timezone = 'America/Los_Angeles';

const timefrom = (timeframe, enddate = null) => {
    const onedate = enddate === null ? moment() : moment.tz(enddate, timezone);
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
    const onedate = enddate === null ? moment() : moment.tz(enddate, timezone);
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
        const codeFilter = process.env.REALTIME_BITWISE_CODE;
        const { id } = ctx.params;
        const datatype = 'VSA';
        const enddate = id;
        const readFrom = timefrom(tf5, enddate);
        const singleSetup = (entity) => {
            return function(filter) {
                return entity.data[filter.var] & filter.key ? filter.value : '';
            }
        }
        const showSetups = (entities, filters) => {
            const setups = entities.map(entity => {
                const signals = filters.map(singleSetup(entity));
                entity['singals'] = signals;
                return entity;
            })
            return setups;
        }
        const prettyPrint = (entities) => {
            const pretty = entities.map(entity => {
                const row = `${entity.symbol} : ${entity.timeframe} - ${entity.singals.join(',')}`;
                return row;
            })
            return pretty;
        }
        const enddt = timeto(enddate).toISOString();
        const s15 = timefrom(tf15, enddate).toISOString();
        const s5 = timefrom(tf5, enddate).toISOString();
        const s2 = timefrom(tf2, enddate).toISOString();
        const entities = await strapi.entityService.findMany('api::realtime.realtime', {
            filters: {
                $or: [
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf15 },
                            { data_at: { $gt: s15 } },
                            { data_at: { $lte: enddt } }
                        ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf5 },
                            { data_at: { $gt: s5 } },
                            { data_at: { $lte: enddt } }
                       ]
                    },
                    {
                        $and: [
                            { datatype: datatype },
                            { timeframe: tf2 },
                            { data_at: { $gt: s2 } },
                            { data_at: { $lte: enddt } }
                        ]
                    }
                ]
            },
            sort: [{ symbol: 'asc' }, { createdAt: 'desc' }],
        });
        const filters = JSON.parse(codeFilter);
        const data = showSetups(entities, filters);
        const pretty = prettyPrint(data);
        return pretty;
        // const sanitizedEntity = await this.sanitizeOutput(pretty, ctx);
        // return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        const { body } = ctx.request;

        const data_at = ('date' in ctx.query ? ctx.query.date : moment().toISOString());
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
                    "data_at": data_at
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
