const through = require('through2');
const util = fis.util;
const path = require('path');
const copy = require('copy');

module.exports = function uri (file, opts) {

  const fileDir = util.pathinfo(file).dirname;

  const chunks = [];

  return through(write, end);

  function write (chunk, enc, cb){
    chunks.push(chunk);
    cb();
  }

  function end (cb){
    let content = util.readBuffer2(chunks);

    // content = content.replace(/require\s*\((\s*['"]\b[\w\/-]+\b['"])([\s\+\w\[\]\'\"\|]+)\)/ig, (m, p, v, l, s)=>{
    //   return '_require(' + p + v + ')';
    // })

    // content = replaceJSImg(content);

    let fileObj = new fis.file(file);
    fileObj.setContent(content);

    fis.compile.process(fileObj);

    content = fileObj.getContent();

    this.push(content);
    cb(null);
  }
}

// function replaceJSImg (content){
//   return content.replace(reg, (m, comment, type, value) => {
//     if (type) {
//       switch (type) {
//         case '__inline':
//           // m = map.jsEmbed.wrap(value);
//           break;
//         case '__uri':
//           m = wrap(value);
//           let realPath = path.resolve(fileDir, m.url);
//           let relativeProjectRootPath = path.relative(projectRoot, realPath);
//           let targetPath = path.join(outpath, relativeProjectRootPath);
//
//           if(relativePath){
//             m = m.quote + path.relative(relativePath, targetPath) + m.quote
//           }else{
//             m = m.quote + '/' + relativeProjectRootPath + m.quote
//           }
//
//           copy.one(realPath, outpath, {srcBase: projectRoot}, function(err, files) {
//             if (err) return log.error(err);
//             // console.log(files.dest);
//             // `files` is an array of the files that were copied
//           })
//
//           break;
//       }
//     }
//     return m;
//   });
// }

// const reg = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]*?(?:\*\/|$))|\b(__inline|__uri|__hash)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*')\s*\)/g;
//
// function wrap (value){
//   var result = value.match(/^(["'])((?:[^\\"\r\n\f]|\\[\s\S])*)(["'])$/);
//
//   return {
//     quote: result[1],
//     url: result[2]
//   }
// }
//
// function isImg (file) {
//   return (/\.((lit)?gif|png|jpg|jpeg|svg)$/).exec(file);
// }
