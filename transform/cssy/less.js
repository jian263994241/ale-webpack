const _ = fis.util;

const less = require('less'),
      LessPluginNpmImportPlugin = require('less-plugin-npm-import'),
      LessPluginAutoPrefix = require('less-plugin-autoprefix'),
      lessPluginGlob = require('less-plugin-glob')
      LessPluginCSSModules = require('less-plugin-css-modules2'),
      LessPluginCleanCSS = require('less-plugin-clean-css');

const autoprefixer = new LessPluginAutoPrefix({browsers: ["last 2 versions"]});
const npmImport = new LessPluginNpmImportPlugin({ prefix: '~' });
const cleanCSSPlugin = new LessPluginCleanCSS();


exports.render = function render(input, options = {}, callback){

  const defaultsOpt = {
    filename: null,
    javascriptEnabled: true,
    plugins: [],
    sourceMap: {
      outputSourceFiles: true,
      sourceMapFileInline: true,
    },
    minify: false,
    mode: 'global'
  };

  options = _.defaultsDeep(options, defaultsOpt);

  const cssModuels = new LessPluginCSSModules({ getJSON: options.getJSON });

  options.plugins = [npmImport, lessPluginGlob, autoprefixer];

  if(options.module){
    options.plugins.push(cssModuels);
  }

  if(options.minify){
    options.sourceMap = false;
    options.plugins.push(cleanCSSPlugin);
  }

  delete options.module;
  delete options.minify;
  delete options.getJSON;

  return less.render(input, options, callback);
}
