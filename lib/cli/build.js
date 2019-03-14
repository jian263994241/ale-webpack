

module.exports = function build (media, opts){
  const config = getConfig(opts.file, media);
  const compiler = aleWebpack(config);

  compiler.run((err, stats)=>{
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
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
