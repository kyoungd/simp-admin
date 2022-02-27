module.exports = ({ env }) => ({
    // ...
    email: {
        provider: 'sendgrid',
        providerOptions: {
            apiKey: env('SENDGRID_API_KEY'),
        },
        settings: {
            defaultFrom: env('SENDGRID_EMAIL_FROM', 'young@ecom-live.com'),
            defaultReplyTo: env('SENDGRID_REPLY_TO', 'young@ecom-live.com'),
        },
    },
    // ...
});