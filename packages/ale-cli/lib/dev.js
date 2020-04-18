const {unwatchConfigs, watchConfigs} = require('../config/watch');
const { throttle, debounce } = require('throttle-debounce');
const addEntries = require('../utils/addEntries');
const aleWebpack = require('ale-webpack');
const chalk = require('chalk');
const choosePort = require('../utils/choosePort');
const clearConsole = require('../utils/clearConsole');
const getUserConfig = require('../config/getUserConfig');
const log = require('../utils/log');
const openBrowser = require('react-dev-utils/openBrowser');
const prepareUrls = require('../utils/prepareUrls');
const WebpackDevServer = require('webpack-dev-server');

const defaultServerOptions = {
  clientLogLevel: 'debug',
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

const devStatus = {
  isRestart: false,
  isFirstCompile: true,
  configFailed: false,
  innerPort: '',
  compiling: false,
};

function clearRequireCache() {
  Object.keys(require.cache).forEach(key=>{
    delete require.cache[key];
  })
}

const restart = debounce(300, (callback)=>{
  if(devStatus.compiling) return ;
  unwatchConfigs();
  clearRequireCache();
  callback();
});

function wrapChoosePort(port) {
  return new Promise(resolve=>{
    if(devStatus.isRestart && devStatus.innerPort){
      resolve(devStatus.innerPort);
    }else{
      choosePort(port).then(innerPort=>{
        resolve(innerPort);
      })
    }
  })
}


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

  const { port, host } = options.devServer;

  wrapChoosePort(port).then(innerPort=>{
    if (innerPort === null) {
      return;
    }

    devStatus.innerPort = innerPort;

    const urls = prepareUrls(PROTOCOL, host, innerPort);

    compiler.hooks.watchRun.tap('dev-server', ()=>{
      if(isInteractive && devStatus.isFirstCompile && !devStatus.isRestart ){
        clearConsole()
      }

      if(devStatus.isRestart){
        log.info(`Configuration changes, restart server...\n`);
      }else if(devStatus.isFirstCompile){
        log.info('Starting the development server...\n');
      }
    });

    compiler.hooks.done.tap('dev-server', stats => {

      if (stats.hasErrors()) {
        return;
      }

      if (devStatus.isFirstCompile && !devStatus.isRestart) {
          console.log(
            [
              `  Dev server:`,
              `  - Local:   ${chalk.cyan(urls.localUrlForTerminal)}`,
              `  - Network: ${chalk.cyan(urls.lanUrlForTerminal)}`,
            ].join('\n'),
          );
          console.log();
      }

      if (devStatus.isFirstCompile) {
        devStatus.isFirstCompile = false;
        openBrowser(urls.localUrlForBrowser);
      }

      if(devStatus.isRestart){
        devStatus.isRestart = false;
      }

      if (devStatus.isFirstCompile) {
        devStatus.isFirstCompile = false;
      }

    });

    const server = new WebpackDevServer(compiler, { ...options.devServer, port: innerPort});

    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        server.close(() => {
          process.exit(0);
        });
      });
    });

    let configFailed = false;

    devStatus.compiling = true;

    server.listen(innerPort, host, err => {
      if (err) {
        console.log(err);
        return;
      }
      afterServer();
    });

    function afterServer(){
      devStatus.compiling = false;

      const watcher = watchConfigs();
      if(watcher){
        watcher.on('all', () => {
          try {
            if(!devStatus.isRestart){
              devStatus.isRestart = true;
            }
            // 从失败中恢复过来，需要 reload 一次
            if (configFailed) {
              configFailed = false;
              server.sockWrite(server.sockets, 'content-changed');
            }else{   
              restart(()=>{
                server.close();
                dev(media, opts);
              });
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
