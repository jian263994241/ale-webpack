const chalk = require('chalk');

const print = (msg, color)=> console.log(chalk[color](msg));

exports.error = (msg)=> print(msg, 'redBright');
exports.warn = (msg)=> print(msg, 'yellowBright');
exports.info = (msg)=> print(msg, 'cyanBright');
exports.success = (msg)=> print(msg, 'greenBright');