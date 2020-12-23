const { unwatchConfigs, watchConfigs } = require('../utils/watch');
// const { aleWebpack, WebpackDevServer } = require('ale-webpack');
const chalk = require('react-dev-utils/chalk');
const clearConsole = require('react-dev-utils/clearConsole');
const openBrowser = require('react-dev-utils/openBrowser');
const printBuildError = require('react-dev-utils/printBuildError');
const {
  choosePort,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const getUserConfig = require('../utils/getUserConfig');
const log = require('../utils/log');
const setEnv = require('../utils/setEnv');

const isInteractive = process.stdout.isTTY;

const devStatus = {
  isRestart: false,
  isFirstCompile: true,
  configFailed: false,
  innerPort: '',
  compiling: false,
};

const restart = (server, callback) => {
  if (devStatus.compiling) return;
  unwatchConfigs();
  server.close(callback);
};

function wrapChoosePort(host, defaultPort) {
  return new Promise((resolve) => {
    if (devStatus.isRestart && devStatus.innerPort) {
      resolve(devStatus.innerPort);
    } else {
      choosePort(host, defaultPort).then((innerPort) => {
        resolve(innerPort);
      });
    }
  });
}

module.exports = function dev(media, opts) {
  // setEnv(opts.env);
  // const userWebpackConfig = getUserConfig(opts.file, media);

  require('ale-webpack/scripts/start');
};
