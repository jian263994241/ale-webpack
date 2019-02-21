

module.exports = function wrapCss (compiled, id, cssname = {}) {
  // var func_start = `(function() { var head = document.getElementsByTagName('head')[0]; var style = document.createElement('style'); style.type = 'text/css'; style.id = '${id}'; `,
  //   func_end = "if (style.styleSheet){ style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); } head.appendChild(style);}())";
  //
  // if(cssname){
  //   compiled = func_start + "var css = " + JSON.stringify(compiled) + ";" + "module.exports = " + JSON.stringify(cssname) + ";" + func_end;
  // }else{
  //   compiled = func_start + "var css = " + JSON.stringify(compiled) + ";" + func_end;
  // }

  compiled = `require('insert_css')(${JSON.stringify(compiled)});`;

  if(cssname){
    compiled += `module.exports = ${JSON.stringify(cssname)};`
  }

  return compiled;
}
