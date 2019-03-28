const getHtmlOpts = require('./config/getHtmlOpts');
const addTokens = require('./utils/addTokens');
const chalk = require('chalk');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const _ = require('lodash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const {DefinePlugin, WebpackOptionsApply} = require('webpack');
const ZipPlugin = require('zip-webpack-plugin');

/**
 * 增加plugin
 */
class AleOptionsApply extends WebpackOptionsApply {
  constructor(){
    super();
  }

  process(options, compiler){
    options = super.process(options, compiler);
    const { ale, mode } = options;
    const isEnvProduction = (mode === 'production');
    const cssOpts = _.pick(ale.css, ['filename', 'chunkFilename']);
    const apply = (Plugin, config) => new Plugin(config).apply(compiler);
    const barOpts = {
      format: chalk.cyanBright('Build: ') + chalk.greenBright.bold('[:bar]') + chalk.greenBright(' :percent :elapseds '),
      clear: true
    };

    apply(CleanWebpackPlugin);
    apply(ProgressBarPlugin, barOpts);
    apply(MiniCssExtractPlugin, cssOpts);
    !_.isEmpty(ale.define) && apply(DefinePlugin, ale.define);
    !_.isEmpty(ale.zip) && apply(ZipPlugin, addTokens(ale.zip));
    !_.isEmpty(ale.html) && apply(HtmlWebpackPlugin, getHtmlOpts(ale.html, isEnvProduction));

    return options;
  }
}



module.exports = AleOptionsApply;
