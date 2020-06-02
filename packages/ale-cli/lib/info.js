const alePkg = require('ale-webpack/package.json');
const address = require('address');
const chalk = require('chalk');

module.exports = function dev(media, opts) {
  console.log(
    [
      ` Info: `,
      `  - ale-webpack: ${chalk.cyan(alePkg.version)}`,
      `  - ip: ${chalk.cyan(address.ip())}`,
    ].join('\n'),
  );
};
