
const path = require('path');
const fs = require('fs');
const log =  require('../util/log');

const cwd = process.cwd();


module.exports = function getConfig(configfile = 'ale.config.js', media){
  configfile = path.join(cwd, configfile);
  if(!fs.existsSync(configfile)){
    return log.error('can not find config file.');
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
    return Object.assign({}, conf.default, conf[env])
  }else{
    return conf.default || conf;
  }
}


/**
 * getRequireDeps - 获取依赖
 *
 * @param  {type} filename description
 * @return {type}          description
 */
function getRequireDeps (filename, incldueSelf) {
  var result = [];
  if(incldueSelf){
    var cache = require.cache[filename];
    result.push(cache.filename);
  }
  getchildren(filename);

  return result;

  function getchildren (filename){
   var cache = require.cache[filename];
   cache.children.forEach(function(dep1){
     result.push(dep1.filename);
     return getchildren(dep1.filename);
   })
 }
}

/**
 * 删除缓存
 */

 function delRequireCache (files) {
   files.forEach(function(file){
     delete require.cache[file];
   })
 }
