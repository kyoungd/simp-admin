'use strict';

/**
 *  newsstock controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const fetchSummary = (entities) => {
    const results = []
    for (let news of entities) {
        try {
            const news_on = news.news_on;
            const url = news.newsitem.data.url;
            const author = news.newsitem.data.author;
            const source = news.newsitem.data.source;
            const summary = news.newsitem.data.summary;
            const headline = news.newsitem.data.headline;
            const sentiment = news.newsitem.data.sentiment;
            results.push({ news_on, url, author, source, summary, headline, sentiment });
        }
        catch (e) {
            console.log(e);
        }
    }
    return results;
}

module.exports = createCoreController('api::newsstock.newsstock', ({ strapi }) => ({

    async find(ctx) {
        const { query } = ctx;

        // some logic here
        const entity = await strapi.db.query('api::newsstock.newsstock').findMany({
            where: {
                symbol: query['symbol']
            },
            orderBy: [{ news_on: 'desc' }],
            populate: true,
            limit: 10,
        });
//         const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        const santiizedEntity = fetchSummary(entity);
        return this.transformResponse(santiizedEntity);
    },
    
}));
