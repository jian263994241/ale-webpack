const alePkg = require('ale-webpack/package.json');
const chalk = require('react-dev-utils/chalk');

module.exports = function dev(media, opts) {
  console.log(
    [` Info: `, `  - ale-webpack: ${chalk.cyan(alePkg.version)}`].join('\n'),
  );
};
