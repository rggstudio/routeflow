const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      mapboxKey: process.env.MAPBOX_PUBLIC_KEY ?? '',
    },
  },
};
