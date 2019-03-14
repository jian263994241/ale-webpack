const log = require('../util/log');

module.exports = function build (media, opts){
  const config = getConfig(opts.file, media);

  //默认mode: development
  if(config.mode === undefined){
    config.mode = 'production';
  }

  const compiler = aleWebpack(config);

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
