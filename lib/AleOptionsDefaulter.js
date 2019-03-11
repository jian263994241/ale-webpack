const { WebpackOptionsDefaulter } = require('webpack');
const loaders = require('../loaders');
const _ = require('lodash');
const path = require('path');

const aleDefaultOpts = {

};

module.exports = class AleOptionsDefaulter extends WebpackOptionsDefaulter {
  constructor(){
    super();
    this.set("resolve", "call", value => Object.assign({}, value));
    this.set('resolve.alias', 'call', (value, options) => Object.assign({ '~': path.join(process.cwd(), 'src') }, value));

    this.set("ale", "call", value => Object.assign({}, value));
  	this.set("ale.loader", true);
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
  }
}
