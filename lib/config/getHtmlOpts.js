const path = require('path');

module.exports = function(userOpts, isEnvProduction){

  return Object.assign(
      {},
      {
        inject: true,
        template: path.join(__dirname, '../../templates/app.ejs')
      },
      isEnvProduction
      ? {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        }
      : undefined,
      userOpts
  )
}
