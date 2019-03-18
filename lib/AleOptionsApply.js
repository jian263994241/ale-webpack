const path = require('path');
const { WebpackOptionsApply } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ZipPlugin = require('zip-webpack-plugin');
const _ = require('lodash');
const moment = require('moment');
/**
 * 增加plugin
 */
class AleOptionsApply extends WebpackOptionsApply {
  constructor(){
    super();
    this._process = super.process;
  }

  process(options, compiler){
    options = super.process(options, compiler);
    const { ale, mode } = options;
    const isEnvProduction = (mode === 'production');

    new CleanWebpackPlugin().apply(compiler);
    new ProgressBarPlugin({ clear: true }).apply(compiler);

    const cssOpts = _.pick(ale.css, ['filename', 'chunkFilename']);

    if(cssOpts.filename) {
      new MiniCssExtractPlugin(cssOpts).apply(compiler);
    }

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
          ale.html
      )
    ).apply(compiler);

    if(ale.zip.filename){
      let filename = ale.zip.filename.replace('[time]', moment().format('YYYY-MM-DD_HHmm'))
      new ZipPlugin(Object.assign({}, ale.zip, {filename})).apply(compiler);
    }

    return options;
  }
}



module.exports = AleOptionsApply;
