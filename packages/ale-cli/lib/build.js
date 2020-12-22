// const { aleWebpack } = require('ale-webpack');
const getUserConfig = require('../utils/getUserConfig');
const log = require('../utils/log');
const setEnv = require('../utils/setEnv');

module.exports = function build(media, opts) {
  // setEnv(opts.env);

  const userWebpackConfig = getUserConfig(opts.file, media);

  require('ale-webpack/scripts/build')(userWebpackConfig);

  // //默认mode: development
  // if (options.mode === undefined) {
  //   options.mode = 'production';
  // }

  // const compiler = aleWebpack(options);

  // compiler.run((err, stats) => {
  //   if (err) {
  //     log.error(err.stack || err);
  //     if (err.details) {
  //       log.error(err.details);
  //     }
  //     return;
  //   }
  // });
};
