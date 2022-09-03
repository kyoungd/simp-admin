'use strict';

/**
 *  technique controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::technique.technique', ({ strapi }) => ({

    async find(ctx) {
        // const { id } = ctx.state.user;
        // const entity = await strapi.db.query('api::technique.technique').findMany();
        // const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        // return this.transformResponse(sanitizedEntity);

        // const { data, meta } = await super.find(ctx);
        // return { data, meta };

        const entity = await strapi.db.query('api::technique.technique').findMany({
            populate: {
                photo: true,
                technique_details: {
                    populate: ['photo']
                },
                techPhoto: true
            }
        });
        const subscriptions = await strapi.db.query('api::technique-user.technique-user').findMany({
            populate: true,
            where: { user: ctx.state.user.id }
        });
        const techniques = [];
        subscriptions.forEach(subscription => {
            techniques.push(subscription.technique.id);
        });
        const results = [];
        entity.forEach(technique => {
            const tech = {...technique, status: (techniques.includes(technique.id) ? 'active' : '')};
            results.push(tech);
        });
        const sanitizedEntity = await this.sanitizeOutput(results, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    // // Method 1: Creating an entirely custom action
    // async exampleAction(ctx) {
    //     try {
    //         ctx.body = 'ok';
    //     } catch (err) {
    //         ctx.body = err;
    //     }
    // },

    async findOne(ctx) {
        const { id } = ctx.params;
        const { query } = ctx;

        const entity = await strapi.service('api::technique.technique').findOne(id, query);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

        return this.transformResponse(sanitizedEntity);
    }


}));
