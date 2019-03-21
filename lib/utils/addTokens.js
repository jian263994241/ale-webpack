const moment = require('moment');

module.exports = function (opts = {}){
  if(opts.filename){
    opts.filename = opts.filename.replace('[time]', moment().format('YYYY-MM-DD_HHmm'))
  }
  return opts;
}
