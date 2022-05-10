'use strict';

/**
 *  newsitem controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::newsitem.newsitem', ({ strapi }) => ({

    // const data = '{"T":"n","id":24919710,"headline":"Granite Wins $90M Construction Manager/General Contractor Project In Northern California","summary":"Granite (NYSE:GVA) announced today that it has been selected by the California Department of Transportation (Caltrans) as the Construction Manager/General Contractor (CM/GC) for the approximately $90 million State Route","author":"Benzinga Newsdesk","created_at":"2022-01-05T22:30:29Z","updated_at":"2022-01-05T22:30:30Z","url":"https://www.benzinga.com/news/22/01/24919710/granite-wins-90m-construction-managergeneral-contractor-project-in-northern-california","content":"\u003cp\u003eGranite (NYSE:...","symbols":["GVA"],"source":"benzinga"}'

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

}));
