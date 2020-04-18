const {CONFIGFILE} = require('./contants');
const fs = require('fs');
const path = require('path');
const deepmerge = require('../utils/deepmerge');

const cwd = process.cwd();

module.exports = function getUserConfig(configfile = CONFIGFILE, media){
  configfile = path.join(cwd, configfile);
  if(!fs.existsSync(configfile)){
    return console.error('can not find config file.');
  }
  return merge(configfile, media);
}


/**
 * merge - 合并配置
 *
 * @param  {type} configfile description
 * @param  {type} env        description
 * @return {type}            description
 */
function merge(configfile, env){
  var conf = require(configfile);
  if(conf[env] && conf.default){
    return deepmerge(conf.default, conf[env]);
  }else{
    return conf.default || conf;
  }
}


