module.exports = {
    /**
     * Simple example.
     * Every monday at 1am.
     */

    '0 0 0 * * 0': async ({ strapi }) => {
        // Add your own logic here (e.g. send a queue of email, create a database backup, etc.).
        try {
            const account = await strapi.service('api::account.account');
            account.setWeeklySchedule();
        } catch (err) {
            console.log(err);
        }
    },
};
