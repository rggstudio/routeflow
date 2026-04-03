const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.resolver = {
  ...config.resolver,
  blockList: [
    /\.local\/.*/,
  ],
};

module.exports = withNativeWind(config, {
  input: './global.css',
});
