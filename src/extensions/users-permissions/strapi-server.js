'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require('crypto');
const _ = require('lodash');
const utils = require('@strapi/utils');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// const { getService } = require('../utils');
const { getService } = require('../../../node_modules/@strapi/plugin-users-permissions/server/utils');
const {
    validateCallbackBody,
    validateRegisterBody,
} = require('../../../node_modules/@strapi/plugin-users-permissions/server/controllers/validation/auth');
const account = require('../../api/account/services/account');
// } = require('./validation/auth');

const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const sanitizeUser = (user, ctx) => {
    const { auth } = ctx.state;
    const userSchema = strapi.getModel('plugin::users-permissions.user');

    return sanitize.contentAPI.output(user, userSchema, { auth });
};

module.exports = async (plugin) => {
    plugin.controllers.auth.callback = async(ctx) => {
        const provider = ctx.params.provider || 'local';
        const params = ctx.request.body;

        const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
        const grantSettings = await store.get({ key: 'grant' });

        const grantProvider = provider === 'local' ? 'email' : provider;

        if (!_.get(grantSettings, [grantProvider, 'enabled'])) {
            throw new ApplicationError('This provider is disabled');
        }

        if (provider === 'local') {
            await validateCallbackBody(params);

            const { identifier } = params;

            // Check if the user exists.
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: {
                    provider,
                    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
                },
            });

            if (!user) {
                throw new ValidationError('Invalid identifier or password');
            }

            if (!user.password) {
                throw new ValidationError('Invalid identifier or password');
            }

            const validPassword = await getService('user').validatePassword(
                params.password,
                user.password
            );

            if (!validPassword) {
                throw new ValidationError('Invalid identifier or password');
            }

            const advancedSettings = await store.get({ key: 'advanced' });
            const requiresConfirmation = _.get(advancedSettings, 'email_confirmation');

            if (requiresConfirmation && user.confirmed !== true) {
                throw new ApplicationError('Your account email is not confirmed');
            }

            if (user.blocked === true) {
                throw new ApplicationError('Your account has been blocked by an administrator');
            }

            // Import the account service to fetch account details
            let account = await strapi.service('api::account.account').getUserAccount(user.id);
            // 
            // keep the account id in the user object
            if (!account) {
                // get stripe_id from email address
                const stripe_customer = await stripe.customers.create({
                    email: user.email,
                });
                account = await strapi.service('api::account.account').newUser(user.id, stripe_customer.id, '');
            }

            return ctx.send({
                jwt: getService('jwt').issue({ id: user.id }),
                user: { 
                    ...await sanitizeUser(user, ctx),
                    stripeId: account.stripeId, discordId: account.discordId,
                },
            });
        }

        // Connect the user with the third-party provider.
        try {
            const user = await getService('providers').connect(provider, ctx.query);

            // Import the account service to fetch account details
            let account = await strapi.service('api::account.account').getUserAccount(user.id);
            if (!account) {
                // get stripe_id from email address
                const stripe_customer = await stripe.customers.create({
                    email: user.email,
                });
                account = await strapi.service('api::account.account').newUser(user.id, stripe_customer.id, '');
            }
            // 
            return ctx.send({
                jwt: getService('jwt').issue({ id: user.id }),
                user: {
                    ...await sanitizeUser(user, ctx),
                    stripeId: account.stripeId, discordId: account.discordId,
                },
            });
        } catch (error) {
            throw new ApplicationError(error.message);
        }
    };

    plugin.controllers.auth.register = async (ctx) => {
        const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });

        const settings = await pluginStore.get({ key: 'advanced' });

        if (!settings.allow_register) {
            throw new ApplicationError('Register action is currently disabled');
        }

        const params = {
            ..._.omit(ctx.request.body, [
                'confirmed',
                'blocked',
                'confirmationToken',
                'resetPasswordToken',
                'provider',
            ]),
            provider: 'local',
        };

        await validateRegisterBody(params);

        const role = await strapi
            .query('plugin::users-permissions.role')
            .findOne({ where: { type: settings.default_role } });

        if (!role) {
            throw new ApplicationError('Impossible to find the default role');
        }

        const { email, username, provider } = params;

        const identifierFilter = {
            $or: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase() },
                { username },
                { email: username },
            ],
        };

        const conflictingUserCount = await strapi.query('plugin::users-permissions.user').count({
            where: { ...identifierFilter, provider },
        });

        if (conflictingUserCount > 0) {
            throw new ApplicationError('Email or Username are already taken');
        }

        if (settings.unique_email) {
            const conflictingUserCount = await strapi.query('plugin::users-permissions.user').count({
                where: { ...identifierFilter },
            });

            if (conflictingUserCount > 0) {
                throw new ApplicationError('Email or Username are already taken');
            }
        }

        const newUser = {
            ...params,
            role: role.id,
            email: email.toLowerCase(),
            username,
            confirmed: !settings.email_confirmation,
        };

        const user = await getService('user').add(newUser);
        const sanitizedUser = await sanitizeUser(user, ctx);
        // get stripe_id from email address
        const stripe_customer = await stripe.customers.create({
            email,
        });

        // keep the account id in the user object
        const account = await strapi.service('api::account.account').newUser(user.id, stripe_customer.id, '');
        //
        if (settings.email_confirmation) {
            try {
                await getService('user').sendConfirmationEmail(sanitizedUser);
            } catch (err) {
                throw new ApplicationError(err.message);
            }

            return ctx.send({ user: sanitizedUser });
        }

        const jwt = getService('jwt').issue(_.pick(user, ['id']));

        return ctx.send({
            jwt,
            user: sanitizedUser,
            stripeId: account.stripeId, 
            discordId: account.discordId,
        });
    };

    return plugin;
};
