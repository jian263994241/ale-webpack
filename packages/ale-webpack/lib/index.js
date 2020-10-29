const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { applyWebpackOptionsDefaults } = require('./config/defaults');

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

  compiler.hooks.done.tap('afterCompile', (stats) => {
    if (stats.hasErrors()) {
      // make sound
      // ref: https://github.com/JannesMeyer/system-bell-webpack-plugin/blob/bb35caf/SystemBellPlugin.js#L14
      if (process.env.SYSTEM_BELL !== 'none') {
        process.stdout.write('\x07');
      }

      if (
        stats.compilation &&
        stats.compilation.errors &&
        stats.compilation.errors.length > 0
      ) {
        const errInfo = stats.compilation.errors[0];
        console.error(chalk.redBright(errInfo));
      }
    }
  });

  return compiler;
};
