const path = require('path');
const preset = require('babel-preset');
const _ = require('lodash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const LessPluginNpmImportPlugin = require('less-plugin-npm-import');
const lessPluginGlob = require('less-plugin-glob');
const npmImport = new LessPluginNpmImportPlugin({ prefix: '~' });

module.exports = function(options){
  const isEnvProduction = options.mode === 'production';
  const sourceMap = !isEnvProduction;
  const ale = options.ale;
  // const assets = assetsDefualter(ale);

  const createStyleloaders =  ({ modules, less, sourceMap }) => [
    ale.css.filename ? {
      loader: MiniCssExtractPlugin.loader,
      options: {
        publicPath: ale.css.publicPath
      }
    }: require.resolve('style-loader'),
    {
      loader: require.resolve('css-loader'),
      options: { sourceMap, modules }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        ident: 'postcss',
        sourceMap,
        plugins: [
          require('autoprefixer')({ browsers: ale.browserslist })
        ].concat(ale.postcssPlugins)
      }
    },
    less ? {
      loader: require.resolve('less-loader'),
      options: {
        sourceMap,
        javascriptEnabled: true,
        plugins: [ npmImport, lessPluginGlob ]
      }
    } : null
  ].filter(n => n);

  const core = [
    {
      test: /\.ext$/,
      use: {
        loader: require.resolve('cache-loader'),
      }
    },
    {
      test: /\.(js|jsx|es)$/,
      exclude: /(node_modules|bower_components)/,
      include: options.context,
      enforce: 'post',
      use: [
        {
          loader: require.resolve('string-replace-loader'),
          options: {
            multiple: [
              { search: '__uri', replace: 'require', flags: 'g' },
            ]
          }
        },
        {
          loader: require.resolve('hmr-accept-loader')
        }
      ]
    }
  ]

  /**
   * user customs
   */
  const list = [
    {
      test: /\.(js|jsx|es)$/,
      exclude: /(node_modules|bower_components)/,
      include: options.context,
      enforce: 'pre',
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: ale.babel({
            presets: [
              [ preset, { targets: { browsers : ale.browserslist }, exclude: ['transform-typeof-symbol'] } ]
            ]
          })
        }
      ]
    },
    {
      test: /\.css$/,
      use: createStyleloaders({ sourceMap })
    },
    {
      test: /\.less$/,
      use: createStyleloaders({ sourceMap, less: true })
    },
    {
      test: /\.module\.css$/,
      use: createStyleloaders({ sourceMap, modules: true })
    },
    {
      test: /\.module\.less$/,
      use: createStyleloaders({ sourceMap, modules: true, less: true })
    },
    {
      test: /\.(jpe?g|png|gif|svg|eot|ttf|woff)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: ale.image
        },
        {
          loader: require.resolve('image-webpack-loader'),
          options: {disable: true}
        },
      ],
    },
    {
      test: /\.(html)$/,
      use: {
        loader: require.resolve('html-loader'),
        options: {
          attrs: [':data-src']
        }
      }
    }
  ];

  return core.concat(ale.loader(list));
}

// function assetsDefualter(ale){
//   let assets = ale.assets;
//   let _assets = {};
//   if(_.isArray(assets)){
//     assets.forEach(([opts, key])=> _assets[key] = opts || {})
//   }else if(_.isObject(assets)){
//     _assets.js = _assets.image = _assets.css = assets;
//   }else {
//     throw 'Assets options must be array or object.'
//   }
//
//   return _assets;
// }
