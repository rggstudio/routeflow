const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const excludedDirs = ['artifacts', 'attached_assets', '.local', 'docs'];
const excludedPatterns = excludedDirs.map(
  (dir) => new RegExp(`^${escapeRegex(path.join(__dirname, dir))}`)
);

config.resolver = {
  ...config.resolver,
  blockList: excludedPatterns,
};

module.exports = withNativeWind(config, {
  input: './global.css',
});
