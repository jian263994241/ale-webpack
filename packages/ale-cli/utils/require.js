const globalModules = require('global-modules');
const Module = require('module');
const path = require('path');

const cwd = process.cwd();
const _require = Module.prototype.require;

const priorities = [ 'ale-webpack' ];

// const requireGobal = Module.createRequireFromPath(globalModules);
// const requireLocal = Module.createRequireFromPath(cwd);

Module.prototype.require = function(id){
  // this.paths.push(globalModules);

  if(priorities.includes(id)){
    try {
      return _require.call(this, path.join(cwd, 'node_modules', id));
    }catch(e){
      return _require.call(this, path.join(globalModules, id));
    }
  }

  return _require.apply(this, arguments);
};
