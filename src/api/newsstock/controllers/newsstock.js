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

    async getSentiment(ctx) {
        const { query } = ctx;

        try {
            // some logic here
            // date string 2 weeks ago
            const timefrom = new Date();
            timefrom.setDate(timefrom.getDate() - (query['timefrom'] || 21)); // 21 days ago
            const entity = await strapi.db.query('api::newsstock.newsstock').findMany({
                where: {
                    $and: [
                        { symbol: query['symbol'] },
                        { news_on: { $gte: timefrom } },
                    ]
                },
                orderBy: [{ news_on: 'desc' }],
                // populate: true,
                limit: query['limit'] || 5,
            });
            const avgSenti = entity.length <= 0 ? 0 :
                // array reduce and get average
                entity.reduce((acc, cur) => {
                    acc += cur.sentiment;
                    return acc;
                    }, 0) / entity.length;
            return { data: { sentiment: avgSenti }, status_code: 200 };
        }
        catch (e) {
            console.log(e);
            return { data: { sentiment: 0 }, status_code: 500 };
        }
    },
    
    async getNews(ctx) {
        const { query } = ctx;

        // some logic here
        // date string 2 weeks ago
        const timefrom = new Date();
        timefrom.setDate(timefrom.getDate() - (query['timefrom'] || 21)); // 21 days ago
        const entity = await strapi.db.query('api::newsstock.newsstock').findMany({
            where: {
                $and: [
                    { symbol: query['symbol'] },
                    { news_on: { $gte: timefrom } },
                ]
            },
            orderBy: [{ news_on: 'desc' }],
            populate: true,
            limit: query['limit'] || 5,
        });
        const news = entity.map(item => ({
            news_on: item.news_on,
            author: item.newsitem.data.author,
            headline: item.newsitem.data.headline,
            source: item.newsitem.data.source,
            summary: item.newsitem.data.summary,
            url: item.newsitem.data.url,
        }));
        return { data: { news }, status_code: 200 };
    },
    
    async fixSentiment(ctx) {
        const { query } = ctx;

        // date string 2 weeks ago
        const timefrom = new Date();
        timefrom.setDate(timefrom.getDate() - (query['timefrom'] || 21)); // 21 days ago
        const entity = await strapi.db.query('api::newsstock.newsstock').findMany({
            where: {
                $and: [
                    { sentiment: null },
                    { news_on: { $gte: timefrom } },
                ]
            },
            orderBy: [{ news_on: 'desc' }],
            populate: true,
            limit: 10,
        });
        for (const news of entity) {
            try {
                if (!news.newsitem.data || !news.newsitem.data.sentiment) {
                    continue;
                }
                await strapi.entityService.update('api::newsstock.newsstock', news.id, {
                    data: {
                        sentiment: news.newsitem.data.sentiment || 0
                    }
                });    
            }
            catch (e) {
                console.log(e);
            }
        }
        return { status_code: 200, data: { count: entity.length} };
    }

}));
