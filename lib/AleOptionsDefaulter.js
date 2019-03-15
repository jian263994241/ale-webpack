const webpack = require('webpack');
const { WebpackOptionsDefaulter } = webpack;
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const aleOptions = require('./aleOptions');
const aleLoaders = require('./aleLoaders');
const _ = require('lodash');
const path = require('path');

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
    this.set('ale', 'call', (value, options) => Object.assign(aleOptions, value));
    this.set('module.rules', 'call', (value, options) => {
      options.ale = Object.assign(aleOptions, options.ale);
      if(_.isArray(value)){
        value = value.concat( aleLoaders(options) )
      }else{
        value = aleLoaders(options);
      }
      return value;
    })
    this.set("devServer", "call", (value, options) => Object.assign(
      {
        clientLogLevel: 'none',
        compress: true,
        disableHostCheck: true,
        headers: { 'access-control-allow-origin': '*' },
        host: '0.0.0.0',
        hot: true,
        open: true,
        overlay: true,
        port: 3000,
        quiet: true,
        watchOptions: { ignored: /node_modules/ },
      },
      value
    ));

    this.set("optimization.minimizer", "make", options => [
			{
				apply: compiler => {
					// Lazy load the Terser plugin
					const TerserPlugin = require("terser-webpack-plugin");
					const SourceMapDevToolPlugin = new webpack.SourceMapDevToolPlugin();
					new TerserPlugin({
						cache: true,
						parallel: true,
						sourceMap:
							(options.devtool && /source-?map/.test(options.devtool)) ||
							(options.plugins &&
								options.plugins.some(p => p instanceof SourceMapDevToolPlugin))
					}).apply(compiler);
				}
			},
      new OptimizeCSSAssetsPlugin()
		]);
    // this.set('resolveLoader.moduleExtensions', 'call', (value, options) => {
    //   if(_.isArray(value)){
    //     value = ['-loader'].concat(value)
    //   }else{
    //     value = ['-loader'];
    //   }
    //   return value;
    // });
    //
    // this.set('resolveLoader.modules', 'call', (value, options) => {
    //   if(_.isArray(value)){
    //     value = [ path.resolve(require.resolve('webpack'), '../../../') ].concat(value)
    //   }else{
    //     value = [ path.resolve(require.resolve('webpack'), '../../../') ];
    //   }
    //   return value;
    // });
  }
}

module.exports = AleOptionsDefaulter;
