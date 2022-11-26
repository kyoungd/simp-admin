module.exports = ({env}) => ({ // ...
    email: {
        config: {
            provider: 'sendgrid',
            providerOptions: {
                apiKey: env('SENDGRID_API_KEY')
            },
            settings: {
                defaultFrom: env('SENDGRID_EMAIL_FROM', 'young@ecom-live.com'),
                defaultReplyTo: env('SENDGRID_REPLY_TO', 'young@ecom-live.com'),
                testAddress: 'kyoungd@hotmail.com'
            }
        }
    },
    upload: {
        config: {
            provider: 'cloudinary',
            providerOptions: {
                cloud_name: env('CLOUDINARY_NAME'),
                api_key: env('CLOUDINARY_KEY'),
                api_secret: env('CLOUDINARY_SECRET')
            },
            actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {}
            }
        }
    },
    // ...
});
