const webpack = require('webpack');
const chalk = require('chalk');
const addTokens = require('../utils/addTokens');
const clearConsole = require('../utils/clearConsole');
const { version } = require('../package.json');
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

    apply(WebpackBar, { 
      // color: '#3BFC34',
      reporter: {
        start(context){
          // clearConsole();
          compiler.hooks.done.tap('afterCompile', stats => {
            if (stats.hasErrors()) { 
              // make sound
              // ref: https://github.com/JannesMeyer/system-bell-webpack-plugin/blob/bb35caf/SystemBellPlugin.js#L14
              if (process.env.SYSTEM_BELL !== 'none') {
                process.stdout.write('\x07');
              }
              if(stats.compilation && stats.compilation.errors && stats.compilation.errors.length > 0){
                const info = stats.toString({ chunks: false, colors: true });
                console.log(info);
              }
            }
          })
        },
        allDone(context){
          clearConsole(()=>{
            console.log(
              chalk.gray(context.state.message)
            );
          });
        },
        beforeAllDone(){ },
        afterAllDone(context){
          if(context.state.hasErrors){
            return false;
          } 
          console.log(
            [
              `  Ale Webpack Info:`,
              `  - Version: ${chalk.cyan(version)}`,
              `  - Core: ${chalk.cyan('webpack@' + webpack.version)}`,
              `  - Context: ${chalk.cyan(compiler.context)}`,
              `  - Mode: ${chalk.cyan(options.mode)}`,
              `  - Path: ${chalk.cyan(path.dirname(__dirname).replace(compiler.context, '.'))}`,
            ].join('\n'),
          );
          console.log(); 
        }
      } 
    });

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
