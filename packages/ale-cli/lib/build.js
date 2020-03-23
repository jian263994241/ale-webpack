const getUserConfig = require('../config/getUserConfig');
const aleWebpack = require('ale-webpack');
const log = require('../utils/log')

module.exports = function build (media, opts){
  const options = getUserConfig(opts.file, media);

  //默认mode: development
  if(options.mode === undefined){
    options.mode = 'production';
  }

  const compiler = aleWebpack(options);

  compiler.run((err, stats)=>{
    if (err) {
      log.error(err.stack || err);
      if (err.details) {
        log.error(err.details);
      }
      return;
    }
  });
}
