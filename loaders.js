const path = require('path');
const preset = require('babel-preset');

const LessPluginNpmImportPlugin = require('less-plugin-npm-import');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const lessPluginGlob = require('less-plugin-glob');
const autoprefixer = new LessPluginAutoPrefix({browsers: ["last 2 versions"]});
const npmImport = new LessPluginNpmImportPlugin({ prefix: '~' });

module.exports = function(options){

  const list = [
    {
      test: /\.(js|jsx|es)$/,
      exclude: /(node_modules|bower_components)/,
      include: options.context,
      enforce: 'pre',
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: { presets: [ preset ] }
        },
        {
          loader: require.resolve('string-replace-loader'),
          options: {
            multiple: [
              { search: '__uri', replace: 'require', flags: 'g' },
            ]
          }
        }
      ]
    },
    {
      test: /\.(less|css)$/,
      use: [
        {
          loader: require.resolve('style-loader')
        },
        {
          loader: require.resolve('css-loader')
        },
        {
          loader: require.resolve('less-loader'),
          options: {
            sourceMap: {
              outputSourceFiles: true,
              sourceMapFileInline: true,
            },
            javascriptEnabled: true,
            plugins: [ npmImport, lessPluginGlob, autoprefixer ]
          }
        }
      ]
    },
    {
      test: /\.(lessm|cssm)$/,
      use: [
        {
          loader: require.resolve('style-loader')
        },
        {
          loader: require.resolve('css-loader'),
          options: {
            modules: true,
            sourceMap: true
          }
        },
        {
          loader: require.resolve('less-loader'),
          options: {
            sourceMap: {
              outputSourceFiles: true,
              sourceMapFileInline: true,
            },
            javascriptEnabled: true,
            plugins: [ npmImport, lessPluginGlob, autoprefixer ]
          }
        }
      ]
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i,
      use: [
        require.resolve('file-loader'),
        {
          loader: require.resolve('image-webpack-loader'),
          options: {
            disable: true, // webpack@2.x and newer
          },
        },
      ],
    }
  ];

  return list;
}
