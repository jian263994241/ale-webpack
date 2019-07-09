'use strict';

const webpack = require('webpack');

module.exports = function addEntries(config, options, server) {
  if (options.inline !== false) {
    // we're stubbing the app in this method as it's static and doesn't require
    // a server to be supplied. createDomain requires an app with the
    // address() signature.
    const app = server || {
      address() {
        return { port: options.port };
      },
    };

    const sockPath = options.sockPath ? `&sockPath=${options.sockPath}` : '';

    const entries = [
      require.resolve('react-dev-utils/webpackHotDevClient')
    ];

    const prependEntry = (entry) => {
      if (typeof entry === 'function') {
        return () => Promise.resolve(entry()).then(prependEntry);
      }

      if (typeof entry === 'object' && !Array.isArray(entry)) {
        const clone = {};

        Object.keys(entry).forEach((key) => {
          clone[key] = entries.concat(entry[key]);
        });

        return clone;
      }

      return entries.concat(entry);
    };

    // eslint-disable-next-line no-shadow
    [].concat(config).forEach((config) => {
      config.entry = prependEntry(config.entry || './src');

      if (options.hot || options.hotOnly) {
        config.plugins = config.plugins || [];
        if (
          !config.plugins.find(
            (plugin) =>
              plugin.constructor === webpack.HotModuleReplacementPlugin
          )
        ) {
          config.plugins.push(new webpack.HotModuleReplacementPlugin());
        }
      }
    });
  }
}
