const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const applyWebpackOptionsDefaults = require('./config/applyWebpackOptionsDefaults');
const printBuildError = require('react-dev-utils/printBuildError');

exports.webpack = webpack;
exports.WebpackDevServer = WebpackDevServer;

exports.aleWebpack = function aleWebpack(options, callback) {
  if (Array.isArray(options)) {
    options.forEach((_options) => {
      applyWebpackOptionsDefaults(_options);
    });
  } else {
    applyWebpackOptionsDefaults(options);
  }

  const compiler = webpack(options, callback);

  compiler.hooks.done.tap('done', (stats) => {
    const statsData = stats.toJson({
      all: false,
      warnings: true,
      errors: true,
    });

    if (statsData.warnings.length) {
      if (statsData.warnings) {
        statsData.warnings.forEach((e) => printBuildError(e));
      }
    }

    if (statsData.errors.length) {
      // make sound
      // ref: https://github.com/JannesMeyer/system-bell-webpack-plugin/blob/bb35caf/SystemBellPlugin.js#L14
      if (process.env.SYSTEM_BELL !== 'none') {
        process.stdout.write('\x07');
      }

      if (statsData.errors) {
        statsData.errors.forEach((e) => printBuildError(e));
      }
    }
  });

  return compiler;
};
