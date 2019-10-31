const addTokens = require('../utils/addTokens');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const _ = require('lodash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');
const WebpackBar = require('webpackbar');
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

    apply(WebpackBar, { color: '#3BFC34' });

    isEnvProduction && apply(CleanWebpackPlugin);
    apply(MiniCssExtractPlugin, cssOpts);
    !_.isEmpty(ale.html) && apply(HtmlWebpackPlugin, defaulHtmlTemplate(ale.html));
    !_.isEmpty(ale.zip) && apply(ZipPlugin, addTokens(ale.zip));
    return options;
  }
}

function defaulHtmlTemplate(opt){
  const defaultsOpt = { inject: true, title: '\u200E', template: path.join(__dirname, '../templates/app.ejs') }
  if(Array.isArray(opt)){
    return opt.map(o => _.defaults(o, defaultsOpt))
  }
  return  _.defaults(opt, defaultsOpt)
}


module.exports = AleOptionsApply;
