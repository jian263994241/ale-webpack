const preset = require('babel-preset');
const lessPluginGlob = require('less-plugin-glob');
const LessPluginNpmImportPlugin = require('less-plugin-npm-import');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

const npmImport = new LessPluginNpmImportPlugin({ prefix: '~' });

module.exports = function(options){
  const isEnvProduction = options.mode === 'production';
  const ale = options.ale;

  const cssRegex = /\.css$/;
  const cssModuleRegex = /\.module\.css$/;
  const lessRegex = /\.less$/;
  const lessModuleRegex = /\.module\.less$/;

  const getStyleLoaders =  (cssOptions, preProcessor, preProcessorOptions) => {
    const loaders = [
      !isEnvProduction && {
        loader: require.resolve('css-hot-loader'),
        options: { cssModule: cssOptions.modules }
      },
      // !isEnvProduction && {
      //   loader: require.resolve('style-loader'),
      //   // options: { singleton:true }
      // },
      {
        loader: MiniCssExtractPlugin.loader,
        options: { publicPath: ale.css.publicPath }
      },
      {
        loader: require.resolve('css-loader'),
        options: Object.assign({}, cssOptions, { sourceMap: !isEnvProduction })
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({ autoprefixer: { flexbox: 'no-2009' }, stage: 3 }),
          ].concat(ale.postcssPlugins),
          sourceMap: !isEnvProduction
        }
      }
    ].filter(Boolean);

    if (preProcessor) {
      loaders.push({
        loader: require.resolve(preProcessor),
        options: Object.assign({}, preProcessorOptions, { sourceMap: !isEnvProduction })
      });
    }

    return loaders;
  }

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
              [preset, { 
                targets: { browsers : ale.browserslist },
                useBuiltIns: false,
                exclude: ['transform-typeof-symbol']
              }]
            ]
          })
        }
      ]
    },
    {
      test: cssRegex,
      exclude: cssModuleRegex,
      use: getStyleLoaders({
        importLoaders: 1
      }),
      sideEffects: true,
    },
    {
      test: cssModuleRegex,
      use: getStyleLoaders({
        importLoaders: 1,
        modules: true,
        getLocalIdent: getCSSModuleLocalIdent
      })
    },
    {
      test: lessRegex,
      exclude: lessModuleRegex,
      use: getStyleLoaders({
        importLoaders: 2
      }, 'less-loader', {
        javascriptEnabled: true, plugins: [ npmImport, lessPluginGlob ]
      }),
      sideEffects: true,
    },
    {
      test: lessModuleRegex,
      use: getStyleLoaders({
        importLoaders: 2,
        modules: true,
        getLocalIdent: getCSSModuleLocalIdent,
      }, 'less-loader', {
        javascriptEnabled: true, plugins: [ npmImport, lessPluginGlob ]
      })
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
          attrs: ['img:src', 'link:href', ':data-src']
        }
      }
    }
  ];

  return core.concat(ale.loader(list));
}
