const preset = require('babel-preset');
const lessPluginGlob = require('less-plugin-glob');
const _ = require('lodash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

module.exports = function(options){
  const isEnvProduction = options.mode === 'production';
  const ale = options.ale;
  const { plugins: imgPlugins, ...imgOpt } = ale.image;

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
          ].concat(ale.css.plugins),
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
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /(node_modules|bower_components)/,
      enforce: 'post',
      use: {
        loader: require.resolve('hmr-accept-loader')
      }
    }
  ]

  /**
   * user customs
   */
  const list = [
    {
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /(node_modules|bower_components)/,
      include: options.context,
      enforce: 'pre',
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: ale.babel({
            presets: [ preset ],
            plugins: []
          }, preset)
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
        javascriptEnabled: true, plugins: [ lessPluginGlob ]
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
        javascriptEnabled: true, plugins: [ lessPluginGlob ]
      })
    },
    {
      test: /\.(jpe?g|png|gif|svg|eot|ttf|woff)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: imgOpt
        },
        {
          loader: require.resolve('img-loader'),
          options: { plugins: imgPlugins }
        },
      ],
    }
  ];

  return core.concat(list);
}
