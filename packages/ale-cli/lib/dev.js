const getUserConfig = require('../config/getUserConfig');
const {unwatchConfigs, watchConfigs} = require('../config/watch');
const addEntries = require('../utils/addEntries');
const choosePort = require('../utils/choosePort');
const clearConsole = require('../utils/clearConsole');
const log = require('../utils/log');
const prepareUrls = require('../utils/prepareUrls');
const aleWebpack = require('ale-webpack');
const chalk = require('chalk');
const openBrowser = require('react-dev-utils/openBrowser');

const WebpackDevServer = aleWebpack.WebpackDevServer;

const defaultServerOptions = {
  clientLogLevel: 'none',
  compress: true,
  disableHostCheck: true,
  headers: { 'access-control-allow-origin': '*' },
  host: '0.0.0.0',
  hot: true,
  open: false,
  overlay: true,
  port: 3000,
  quiet: true,
  watchOptions: { ignored: /node_modules/ },
};

const isInteractive = process.stdout.isTTY;

let isRestart = false;

module.exports = function dev (media, opts){

  if(opts.print){
    process.env.CLEAR_CONSOLE = 'none';
  }else{
    process.env.CLEAR_CONSOLE = 'dev server';
  }

  const options = getUserConfig(opts.file, media);

  options.devServer = Object.assign({}, defaultServerOptions, options.devServer);

  const PROTOCOL = options.devServer.https ? 'https': 'http';

  //默认mode: development
  if(options.mode === undefined){
    options.mode = 'development';
  }

  if(options.devServer.hot){
    addEntries(options, options.devServer);
  }

  const compiler = aleWebpack(options);

  const webpackDevServerConfig = options.devServer;
  const { port, host } = webpackDevServerConfig;

  choosePort(port).then(innerPort=>{
    if (innerPort === null) {
      return;
    }

    const urls = prepareUrls(PROTOCOL, host, innerPort);
    let isFirstCompile = true;

    compiler.hooks.watchRun.tap('dev-server', ()=>{
      if(isInteractive){ clearConsole() }

      if(isRestart){
        log.info(`Configuration changes, restart server...\n`);
      }else if(isFirstCompile){
        log.info('Starting the development server...\n');
      }
    });

    compiler.hooks.done.tap('dev-server', stats => {

      if (stats.hasErrors()) {
        return;
      }

      // if (isFirstCompile && !isRestart) {
      if (!isRestart) {
          console.log(
            [
              `  Dev server:`,
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

    function clearRequireCache() {
      Object.keys(require.cache).forEach(key=>{
        delete require.cache[key];
      })
    }
  });
}
