'use strict';

/**
 * newsstock service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::newsstock.newsstock');
