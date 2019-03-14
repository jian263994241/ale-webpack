const path = require('path');
const preset = require('babel-preset');

const LessPluginNpmImportPlugin = require('less-plugin-npm-import');
const lessPluginGlob = require('less-plugin-glob');
const npmImport = new LessPluginNpmImportPlugin({ prefix: '~' });

module.exports = function(options){
  const isEnvProduction = options.mode === 'production';
  const sourceMap = !isEnvProduction;
  const ale = options.ale;

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
              [ preset, {
                  targets: {
                    browsers : ale.browserslist
                  },
                  exclude: ['transform-typeof-symbol'],
                }
              ]
            ]
          })
        }
      ]
    },
    {
      test: /\.(less|css)$/,
      use: [
        { loader: require.resolve('style-loader') },
        {
          loader: require.resolve('css-loader'),
          options: { sourceMap: true }
        },
        {
          loader: require.resolve('postcss-loader'),
          options: {
            ident: 'postcss',
            sourceMap,
            plugins: [
              require('autoprefixer')({browsers: ["last 2 versions"]})
            ]
          }
        },
        {
          loader: require.resolve('less-loader'),
          options: {
            sourceMap,
            javascriptEnabled: true,
            plugins: [ npmImport, lessPluginGlob ]
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
          options: { sourceMap, modules: true }
        },
        {
          loader: require.resolve('postcss-loader'),
          options: {
            ident: 'postcss',
            sourceMap,
            plugins: [
              require('autoprefixer')({browsers: ["last 2 versions"]})
            ]
          }
        },
        {
          loader: require.resolve('less-loader'),
          options: {
            sourceMap,
            javascriptEnabled: true,
            plugins: [ npmImport, lessPluginGlob ]
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

  return core.concat(ale.loader(list));
}
