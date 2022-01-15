module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'd2f4cf5f3370479e6b39afc7d6d5b355'),
  },
});
