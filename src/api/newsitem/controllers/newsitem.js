'use strict';

/**
 *  newsitem controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const moment = require('moment');
const _ = require('lodash');
const { create } = require('lodash');

const timefrom = () => {
    let workday = moment();
    let day = workday.day();
    let diff = 1;  // returns yesterday
    if (day == 0 || day == 1) {  // is Sunday or Monday
        diff = day + 2;  // returns Friday
    }
    let midnight = workday.subtract(diff, 'days');
    return midnight.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
}

const filterTop5Entities = (entities) => {
    const rows = []
    const createdOn = timefrom();
    for (let row of entities) {
        if (row.created_at >= createdOn) rows.append(row)
    }
    return rows;
}

const filterTop5 = (entities) => {
    const rows = _.map(entities, 'data');
    const sorted = _.orderBy(rows, ['sentiment'], ['asc']);
    const top5 = sorted.splice(0, 5);
    const bottom5 = sorted.splice(sorted.length-5, 5);
    const result10 = top5.concat(bottom5).reverse();
    const result = _.uniqBy(result10, 'id');
    return result;
}

module.exports = createCoreController('api::newsitem.newsitem', ({ strapi }) => ({

    async find(ctx) {
        const { query } = ctx;

        // some logic here
        const entities = await strapi.db.query('api::newsitem.newsitem').findMany({
            where: {
                created_at: { $gte: timefrom().toISOString() },
            }
        });
        const entity = filterTop5(entities);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async create(ctx) {
        const { body } = ctx.request;

        const { id, symbols, created_at } = body;
        const nid = id;

        const entity = await strapi.db.query('api::newsstock.newsstock').findOne({
            where: {
                nid
            }
        });
        // it has to be new data.  If nid exists, ignore it.
        if (entity === null) {
            const entity1 = await strapi.db.query('api::newsitem.newsitem').create({
                data: {
                    nid,
                    data: body,
                },
            });
            const eid = entity1.id;
            for (let symbol of symbols) {
                const entity2 = await strapi.db.query('api::newsstock.newsstock').create({
                    data: {
                        symbol,
                        news_on: created_at,
                        newsitem: eid,
                        nid,
                    }
                });
            }
            const sanitizedEntity = await this.sanitizeOutput(entity1, ctx);
            return this.transformResponse(sanitizedEntity);
        }
        else {
            const sanitizedEntity = await this.sanitizeOutput([], ctx);
            return this.transformResponse(sanitizedEntity);
        }
    },

    async delete(ctx) {
        try {
            await strapi.db.query('api::newsstock.newsstock').deleteMany({});
            await strapi.db.query('api::newsitem.newsitem').deleteMany({});
        }
        catch(err) {}
        return 'ok';
    },

}));
