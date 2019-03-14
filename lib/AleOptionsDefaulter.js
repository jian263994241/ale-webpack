const { WebpackOptionsDefaulter } = require('webpack');
const loaders = require('./loaders');
const _ = require('lodash');
const path = require('path');

module.exports = class AleOptionsDefaulter extends WebpackOptionsDefaulter {
  constructor(){
    super();
    this.set("resolve", "call", value => Object.assign({}, value));
    this.set('resolve.alias', 'call', (value, options) => {
      return Object.assign({
        '~': options.context,
        '@babel/runtime': path.dirname(require.resolve('@babel/runtime/package.json'))
      }, value)
    });

    this.set('resolveLoader.moduleExtensions', 'call', (value, options) => {
      if(_.isArray(value)){
        value = ['-loader'].concat(value)
      }else{
        value = ['-loader'];
      }
      return value;
    });

    this.set('resolveLoader.modules', 'call', (value, options) => {
      if(_.isArray(value)){
        value = [ path.resolve(require.resolve('webpack'), '../../../') ].concat(value)
      }else{
        value = [ path.resolve(require.resolve('webpack'), '../../../') ];
      }
      return value;
    });

    this.set('devtool', 'call', (value, options) => {
      if(options.mode === 'development' && options.devtool === undefined){
        return 'cheap-module-source-map'
      }
      return options.devtool;
    })

    this.set("devServer", "call", (value, options) => Object.assign(
      {},
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

    this.set('module.rules', 'call', (value, options) => {
      if(_.isArray(value)){
        value = value.concat(
          loaders(options)
        )
      }else{
        value = loaders(options);
      }
      return value
    })

    this.set("ale", "call", value => Object.assign({}, value));
  	this.set("ale.loader", true);
    this.set("ale.babel", "call", value => Object.assign({}, value));

  }
}
