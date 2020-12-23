// const { aleWebpack } = require('ale-webpack');
const getUserConfig = require('../utils/getUserConfig');
const log = require('../utils/log');
const setEnv = require('../utils/setEnv');

module.exports = function build(media, opts) {
  // setEnv(opts.env);

  // const userWebpackConfig = getUserConfig(opts.file, media);

  require('ale-webpack/scripts/build')();
};
