const download = require('download-git-repo');
const inquirer = require('inquirer');
const shell = require('shelljs');
const which = require('which');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const log = require('../utils/log');
const changeJsonfile = require('../utils/changeJsonfile');

const githubRepo = 'github:jian263994241/default';
const scaffoldList = [
  {
    name: 'simple',
    description: 'Basic, simple and general.',
    repo: '#master'
  },
]


const cwd = process.cwd();

module.exports = function init (repo = 'master', options){

  const appPath = path.resolve(cwd, './');

  // 如果不存在该目录，则新建一个
  if(!fs.existsSync(appPath)){
    fs.mkdirSync(appPath);
  }

  // 如果该目录不是空目录，提示
  if(!isEmptyDirectory(appPath)){
    log.error('The folder must be empty.');
    return;
  }

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'scaffoldDesc',
        message: 'Please choose one to start with Ale.',
        choices: scaffoldList.map(sca=>sca.description)
      }
    ])
    .then(answers => {
      const { repo } = scaffoldList.find(sca=>sca.description===answers.scaffoldDesc);
      download(githubRepo + repo, './', (err) => {
        if(err){
          return log.error(err);
        }
        let appName = path.basename(appPath);
        changePackageJsonName(appPath, appName).then(()=>{
          const npm = findNpm();
          const spinnerInstall = ora(`${npm} installing...`);
          spinnerInstall.start();
          shell.exec(`cd ${appPath} && ${npm} install`, function () {
            log.info(npm + ' install end');
            spinnerInstall.stop();

            console.log();
            console.log(`Success!`);
            console.log('Inside that directory, you can run several commands:');
            console.log();
            console.log(chalk.cyan(`  ale dev`));
            console.log('    Starts the development server.');
            console.log();
            console.log(chalk.cyan(`  ale build`));
            console.log('    Bundles the app into output files "dist" for production.');
            console.log();
          });
        })
      })

    });
}


function findNpm() {
  const npms = ['tnpm', 'cnpm', 'npm'];
  for (let i = 0; i < npms.length; i++) {
    try {
      which.sync(npms[i]);
      // console.log('use npm: ' + npms[i]);
      return npms[i];
    } catch (e) {

    }
  }
  throw new Error('Please install npm');
}

function isDirectory(directoryName) {
  const stat = fs.statSync(directoryName);
  return stat.isDirectory();
}

function isEmptyDirectory(directoryName) {
  if(!isDirectory(directoryName)){
    log.error(`Folder does not exist.`);
    return;
  }

  const dirList = fs.readdirSync(directoryName);

  if(dirList.length === 0){
    return true;
  }else if(dirList.length === 1 && dirList[0].toLowerCase() === '.ds_store'){
    return true;
  }else{
    return false;
  }
}

function changePackageJsonName(appPath, appName) {
  return new Promise(resolve=>{
    const pkgFile = `${appPath}/package.json`;
    if(fs.existsSync(pkgFile) && appName){
      changeJsonfile(pkgFile, {
        name: appName
      });
    }
    resolve();
  });
}
