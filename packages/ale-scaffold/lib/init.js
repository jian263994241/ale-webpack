const chalk = require('chalk');
const changeJsonfile = require('./changeJsonfile');
const download = require('download-git-repo');
const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora');
const path = require('path');
const shell = require('shelljs');
const which = require('which');
const config = require('./config.json');

const githubRepo = 'github:jian263994241/default';
const scaffoldList = config.scaffold;

const cwd = process.cwd();

module.exports = function init(repo = 'master', options) {
  const appPath = path.resolve(cwd, './');

  // 如果不存在该目录，则新建一个
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath);
  }

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'scaffoldDesc',
        message: 'Please choose one to start:',
        choices: scaffoldList.map((sca) => sca.description),
      },
    ])
    .then((answers) => {
      // 如果该目录不是空目录，提示
      if (!isEmptyDirectory(appPath)) {
        console.error('The folder must be empty.');
        return;
      }

      const { repo } = scaffoldList.find(
        (sca) => sca.description === answers.scaffoldDesc,
      );
      download(githubRepo + repo, './', (err) => {
        if (err) {
          return console.error(err);
        }
        let appName = path.basename(appPath);
        changePackageJsonName(appPath, appName).then(() => {
          const npm = findNpm();
          const spinnerInstall = ora(`${npm} installing...`);
          spinnerInstall.start();
          shell.exec(`cd ${appPath} && ${npm} install`, function () {
            console.log(npm + ' install end');
            spinnerInstall.stop();

            console.log();
            console.log(`Success!`);
          });
        });
      });
    });
};

function findNpm() {
  const npms = ['npm'];
  for (let i = 0; i < npms.length; i++) {
    try {
      which.sync(npms[i]);
      // console.log('use npm: ' + npms[i]);
      return npms[i];
    } catch (e) {}
  }
  throw new Error('Please install npm');
}

function isDirectory(directoryName) {
  const stat = fs.statSync(directoryName);
  return stat.isDirectory();
}

function isEmptyDirectory(directoryName) {
  if (!isDirectory(directoryName)) {
    console.error(`Folder does not exist.`);
    return;
  }

  const dirList = fs.readdirSync(directoryName);

  if (dirList.length === 0) {
    return true;
  } else if (dirList.length === 1 && dirList[0].toLowerCase() === '.ds_store') {
    return true;
  } else {
    return false;
  }
}

function changePackageJsonName(appPath, appName) {
  return new Promise((resolve) => {
    const pkgFile = `${appPath}/package.json`;
    if (fs.existsSync(pkgFile) && appName) {
      changeJsonfile(pkgFile, {
        name: appName,
      });
    }
    resolve();
  });
}
