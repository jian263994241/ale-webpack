
const WebpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const aleWebpack = require('../../index');
const getConfig = require('../config/getConfig');
const { watchConfigs, unwatchConfigs } = require('../config/watch');
const openBrowser = require('react-dev-utils/openBrowser');
const clearConsole = require('../util/clearConsole');
const choosePort = require('../util/choosePort');
const prepareUrls = require('../util/prepareUrls');
const log = require('../util/log');


const isInteractive = process.stdout.isTTY;
const PROTOCOL = 'http';

let isRestart = false;

module.exports = function dev (media, opts){
  const config = getConfig(opts.file, media);

  const compiler = aleWebpack({ addDevServerEntrypoints: true, ...config });

  const webpackDevServerConfig = compiler.options.devServer;
  const { port, host } = webpackDevServerConfig;

  choosePort(port).then(innerPort=>{
    if (innerPort === null) {
      return;
    }

    const urls = prepareUrls(PROTOCOL, host, innerPort);
    let isFirstCompile = true;

    compiler.hooks.watchRun.tap('dev-server', ()=>{
      clearConsole();
      if(isRestart){
        log.info(`Configuration changes, restart server...\n`);
      }else if(isFirstCompile){
        log.info('Starting the development server...\n');
      }
    });

    compiler.hooks.done.tap('dev-server', stats => {

      const info = stats.toString({ chunks: false, colors: true });

      if (stats.hasErrors()) {
        // make sound
        // ref: https://github.com/JannesMeyer/system-bell-webpack-plugin/blob/bb35caf/SystemBellPlugin.js#L14
        if (process.env.SYSTEM_BELL !== 'none') {
          process.stdout.write('\x07');
        }

        if(stats.compilation && stats.compilation.errors && stats.compilation.errors.length > 0){
          log.error(stats.compilation.errors[0]);
        }

        return;
      }

      if (isFirstCompile && !isRestart) {
          console.log(
            [
              `  App running at:`,
              `  - Local:   ${chalk.cyan(urls.localUrlForTerminal)}`,
              `  - Network: ${chalk.cyan(urls.lanUrlForTerminal)}`,
            ].join('\n'),
          );
          console.log();
      }

      if (isFirstCompile) {
        isFirstCompile = false;
        openBrowser(urls.localUrlForBrowser);
      }
    });



    const server = new WebpackDevServer(compiler, webpackDevServerConfig);

    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        server.close(() => {
          process.exit(0);
        });
      });
    });

    let configFailed = false;

    server.listen(innerPort, host, err => {
      if (err) {
        console.log(err);
        return;
      }
      afterServer();
    });

    function clearRequireCache() {
      Object.keys(require.cache).forEach(key=>{
        delete require.cache[key];
      })
    }

    function afterServer(){
      const watcher = watchConfigs({ configFile: opts.file });

      if(watcher){
        watcher.on('all', () => {
          try {
            if(!isRestart){
              isRestart = true;
            }

            // 从失败中恢复过来，需要 reload 一次
            if (configFailed) {
              configFailed = false;
              server.sockWrite(server.sockets, 'content-changed');
            }else{
              server.close();
              unwatchConfigs();
              clearRequireCache();
              dev(media, opts);
            }
          } catch (e) {
            configFailed = true;
            console.error(chalk.red(`Watch handler failed, since ${e.message}`));
            console.error(e);
          }
        })
      }
    }
  });
}
