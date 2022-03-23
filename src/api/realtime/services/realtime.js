'use strict';

/**
 * realtime service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::realtime.realtime');
