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
  const userWebpackConfig = getUserConfig(opts.file, media);

  require('ale-webpack/scripts/start')(userWebpackConfig);

  // const compiler = aleWebpack(getUserConfig(opts.file, media));
  // const options = compiler.options;
  // const PROTOCOL = options.devServer.https ? 'https' : 'http';
  // const { port, host } = options.devServer;
  // wrapChoosePort(host, port).then((innerPort) => {
  //   if (innerPort === null) {
  //     return;
  //   }
  //   devStatus.innerPort = innerPort;
  //   const urls = prepareUrls(PROTOCOL, host, innerPort);
  //   compiler.hooks.watchRun.tap('dev-server', () => {
  //     if (isInteractive && devStatus.isFirstCompile && !devStatus.isRestart) {
  //       clearConsole();
  //     }
  //     if (devStatus.isRestart) {
  //       log.info(`Configuration changes, restart server...\n`);
  //     } else if (devStatus.isFirstCompile) {
  //       log.info('Starting the development server...\n');
  //     }
  //   });
  //   compiler.hooks.done.tap('dev-server', (stats) => {
  //     if (stats.hasErrors()) {
  //       return;
  //     }
  //     if (devStatus.isFirstCompile && !devStatus.isRestart) {
  //       console.log(
  //         [
  //           `  Dev server:`,
  //           `  - Local:   ${chalk.cyan(urls.localUrlForTerminal)}`,
  //           `  - Network: ${chalk.cyan(urls.lanUrlForTerminal)}`,
  //         ].join('\n'),
  //       );
  //       console.log();
  //     }
  //     if (devStatus.isFirstCompile) {
  //       devStatus.isFirstCompile = false;
  //       openBrowser(urls.localUrlForBrowser + options.devServer.openPage);
  //     }
  //     if (devStatus.isRestart) {
  //       devStatus.isRestart = false;
  //     }
  //     if (devStatus.isFirstCompile) {
  //       devStatus.isFirstCompile = false;
  //     }
  //   });
  //   const server = new WebpackDevServer(compiler, {
  //     ...options.devServer,
  //     port: innerPort,
  //   });
  //   ['SIGINT', 'SIGTERM'].forEach((signal) => {
  //     process.on(signal, () => {
  //       server.close(() => {
  //         process.exit(0);
  //       });
  //     });
  //   });
  //   let configFailed = false;
  //   devStatus.compiling = true;
  //   server.listen(innerPort, host, (err) => {
  //     if (err) {
  //       return printBuildError(err);
  //     }
  //     afterServer();
  //   });
  //   function afterServer() {
  //     devStatus.compiling = false;
  //     const watcher = watchConfigs();
  //     if (watcher) {
  //       watcher.on('all', () => {
  //         try {
  //           if (!devStatus.isRestart) {
  //             devStatus.isRestart = true;
  //           }
  //           // 从失败中恢复过来，需要 reload 一次
  //           if (configFailed) {
  //             configFailed = false;
  //             server.sockWrite(server.sockets, 'content-changed');
  //           } else {
  //             restart(server, () => {
  //               dev(media, opts);
  //             });
  //           }
  //         } catch (e) {
  //           configFailed = true;
  //           console.error(
  //             chalk.red(`Watch handler failed, since ${e.message}`),
  //           );
  //           console.error(e);
  //         }
  //       });
  //     }
  //   }
  // });
};
