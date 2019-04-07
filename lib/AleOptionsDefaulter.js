const aleLoaders = require('./aleLoaders');
const aleOptions = require('./aleOptions');
const _ = require('lodash');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const path = require('path');
const webpack = require('webpack');

const { WebpackOptionsDefaulter } = webpack;

/**
 * 增加默认参数
 */
class AleOptionsDefaulter extends WebpackOptionsDefaulter {
  constructor(){
    super();
    this.set("resolve", "call", value => Object.assign({}, value));
    this.set('resolve.alias', 'call', (value, options) => {
      return Object.assign({
        '@babel/runtime': path.dirname(require.resolve('@babel/runtime/package.json'))
      }, value)
    });
    this.set('devtool', 'call', (value, options) => {
      if(options.mode === 'development' && options.devtool === undefined){
        return 'cheap-module-source-map'
      }
      return options.devtool;
    })
    this.set('ale', 'call', (value, options) => Object.assign({}, aleOptions, value));
    this.set('module.rules', 'call', (value, options) => {
      options.ale = Object.assign({}, aleOptions, options.ale);
      if(_.isArray(value)){
        value = value.concat( aleLoaders(options) )
      }else{
        value = aleLoaders(options);
      }
      return value;
    });
    this.set("optimization.minimizer", "make", options => [
			{
				apply: compiler => {
					// Lazy load the Terser plugin
					const TerserPlugin = require("terser-webpack-plugin");
					new TerserPlugin({
						cache: true,
						parallel: true,
						sourceMap:
							(options.devtool && /source-?map/.test(options.devtool)) ||
							(options.plugins &&
								options.plugins.some(p => p instanceof webpack.SourceMapDevToolPlugin))
					}).apply(compiler);
				}
			},
      new OptimizeCSSAssetsPlugin()
		]);
  }
}

module.exports = AleOptionsDefaulter;
