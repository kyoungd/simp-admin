module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true,
  url: env('HOST_URL', "https://simp-admin.herokuapp.com"),
  app: {
    keys: env.array("APP_KEYS"),
  },
});
