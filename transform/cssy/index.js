'use strict';
var path = require("path");
var through = require('through2');
var assign = Object.assign;
var less = require('./less');

var _ = fis.util;

const wrapCss = require('./wrapCss');

const isLocal = (file) => /\.cssm$|\.lessm$/.test(file);
const isStyle = (file) => !/\.css$|\.less$|\.cssm$|\.lessm$/.test(file);

var currentWorkingDir = process.cwd();

module.exports = function(file, transformOptions) {
  var pathInfo = path.parse(file);

  if (isStyle(file)) { return through() }

  const $file = fis.file.wrap(file);

  // set the curTransformOptions using the given plugin options
  var curTransformOptions = assign({}, transformOptions || {});
  curTransformOptions._flags = undefined; // clear out the _flag property


  const chunks = [],
    myDirName = path.dirname(file);

  return through(write, end);

  function write(chunk, enc, next) {
    chunks.push(chunk)
    next();
  }

  function end(done) {
    var self = this;

    var buffer = _.readBuffer2(chunks);

    var cssname = {};

    function fisRes(content , filepath){
      var cssfile = fis.file.wrap(filepath);
      cssfile.setContent(content);
      fis.compile.process(cssfile);
      return cssfile.getContent();
    }

    less.render(buffer, {
      filename: file,
      module: isLocal(file),
      minify: curTransformOptions.minify,
      sourceMap: {
        sourceMapBasepath: path.dirname(file)
      },
      getJSON(names){
        cssname = names
      }
    }).then(function(result, extra) {
      result.imports.forEach(function(f) {
        self.emit('file', f);
      });

      var compiled = fisRes(result.css, file);

      compiled = wrapCss(compiled, $file.id, cssname);

      self.push(compiled);

      done();

    }, function(err){
      self.emit('error', err.stack);
    });

  }
};
