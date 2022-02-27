module.exports = ({ env }) => ({
    // ...
    email: {
        config: {
            provider: 'sendgrid',
            providerOptions: {
                apiKey: env('SENDGRID_API_KEY'),
            },
            settings: {
                defaultFrom: 'young@ecom-live.com',
                defaultReplyTo: 'young@ecom-live.com',
                testAddress: 'kyoungd@hotmail.com',
            },
        },
    },
    // ...
});
