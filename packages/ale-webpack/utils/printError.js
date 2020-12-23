const PrettyError = require('pretty-error');
const pe = new PrettyError();

module.exports = function printErrors(error) {
  console.log(pe.render(error));
};
