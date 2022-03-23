'use strict';

/**
 * realtime router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::realtime.realtime');
