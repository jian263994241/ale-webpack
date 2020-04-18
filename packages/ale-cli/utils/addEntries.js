'use strict';

const webpack = require('webpack');

function addEntries(config, options, server) {
  if (options.inline !== false) {

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
              plugin.constructor === webpack.NamedModulesPlugin
          )
        ) {
          config.plugins.push(new webpack.NamedModulesPlugin());
        }
        
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

module.exports = addEntries;
