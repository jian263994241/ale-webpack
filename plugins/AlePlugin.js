const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = class AlePlugin {

  apply(compiler) {
    const { options } = compiler;
    const isEnvProduction = options.mode === 'production';

    compiler.hooks.afterEnvironment.tap('AlePlugin', ()=>{

      new ProgressBarPlugin({ clear: true }).apply(compiler);
      new ManifestPlugin().apply(compiler);

      new HtmlWebpackPlugin(
        Object.assign(
            {
              inject: true,
              template: path.join(__dirname, '../templates/app.ejs')
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
            options.ale.html
        )
      ).apply(compiler);
    })
  }
}
