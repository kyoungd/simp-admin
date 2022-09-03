'use strict';

/**
 *  technique-detail controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::technique-detail.technique-detail', ({ strapi }) => ({

    async findOne(ctx) {
        const { id } = ctx.params;
        const { query } = ctx;

        const entity = await strapi.db.query('api::technique-detail.technique-detail').findOne({
            where : { technique: id },
            populate: true,
        });
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

        return this.transformResponse(sanitizedEntity);
    }

}));
