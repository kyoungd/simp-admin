module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'd2f4cf5f3370479e6b39afc7d6d5b355'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', '300b259aaafffb3eecad39a49db4a7c7'),
  }
});
