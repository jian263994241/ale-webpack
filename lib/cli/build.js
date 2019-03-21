const aleWebpack = require('../../index');
const getUserConfig = require('../config/getUserConfig');
const log = require('../utils/log');

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
    //
    // var info = stats.toString({
    //   chunks: false,  // Makes the build much quieter
    //   colors: true    // Shows colors in the console
    // });
    //
    // if (stats.hasErrors()) {
    //   console.error(info);
    // }
    //
  });
}
