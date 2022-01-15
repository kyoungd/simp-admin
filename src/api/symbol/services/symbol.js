'use strict';

/**
 * symbol service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::symbol.symbol');
