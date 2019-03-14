const chokidar = require('chokidar');
const { resolve } = require('path');
const { realpathSync } = require('fs');

// 按 key 存，值为数组
const watchers = {};

function watch(key, files) {
  if (process.env.WATCH_FILES === 'none') return;
  if (!watchers[key]) {
    watchers[key] = [];
  }
  const watcher = chokidar.watch(files, {
    ignoreInitial: true,
  });
  watchers[key].push(watcher);
  return watcher;
}

function unwatch(key) {
  if (!key) {
    return Object.keys(watchers).forEach(unwatch);
  }
  if (watchers[key]) {
    watchers[key].forEach(watcher => {
      watcher.close();
    });
    delete watchers[key];
  }
}

const cwd = process.cwd();
const appDirectory = realpathSync(cwd);
const resolveApp = relativePath => resolve(appDirectory, relativePath);

const { CONFIGFILE, USER_CONFIGS } = require('./contants');

function watchConfigs(opts = {}) {
  const { configFile = CONFIGFILE } = opts;

  // 配置文件
  const rcFile = resolveApp(configFile);

  return watch(USER_CONFIGS, [rcFile]);
}

function unwatchConfigs() {
  unwatch(USER_CONFIGS);
}


module.exports = {
  watch,
  unwatch,
  watchConfigs,
  unwatchConfigs
}