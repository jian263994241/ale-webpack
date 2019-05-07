const addTokens = require('./utils/addTokens');
const chalk = require('chalk');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const _ = require('lodash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const {WebpackOptionsApply} = require('webpack');
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
    const apply = (Plugin, config) => {
      if(Array.isArray(config)){
        return config.map(conf => apply(Plugin, conf));
      }
      return new Plugin(config).apply(compiler);
    };
    const barOpts = {
      format: chalk.greenBright.bold('Processing [:bar]') + chalk.greenBright(' :percent :elapseds '),
      clear: true
    };
    isEnvProduction && apply(CleanWebpackPlugin);
    apply(ProgressBarPlugin, barOpts);
    apply(MiniCssExtractPlugin, cssOpts);
    !_.isEmpty(ale.html) && apply(HtmlWebpackPlugin, defaulHtmlTemplate(ale.html));
    !_.isEmpty(ale.zip) && apply(ZipPlugin, addTokens(ale.zip));
    return options;
  }
}

function defaulHtmlTemplate(opt){
  const defaultsOpt = { inject: true, template: path.join(__dirname, '../templates/app.ejs') }
  if(Array.isArray(opt)){
    return opt.map(o => _.defaults(o, defaultsOpt))
  }
  return  _.defaults(opt, defaultsOpt)
}


module.exports = AleOptionsApply;
