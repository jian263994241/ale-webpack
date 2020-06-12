'use strict';

const path = require('path');
const webpack = require('webpack');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

const NODE_MODULES_REGEXP = /[\\/]node_modules[\\/]/i;
const CSS_REGEXP = /\.css$/;
const CSS_MODULES_REGEXP = /\.module\.css$/;
const LESS_REGEXP = /\.less$/;
const LESS_MODULES_REGEXP = /\.module\.less$/;

/**
 * Sets a constant default value when undefined
 * @template T
 * @template {keyof T} P
 * @param {T} obj an object
 * @param {P} prop a property of this object
 * @param {T[P]} value a default value of the property
 * @returns {void}
 */
const D = (obj, prop, value) => {
  if (obj[prop] === undefined) {
    obj[prop] = value;
  }
};

/**
 * Sets a dynamic default value when undefined, by calling the factory function
 * @template T
 * @template {keyof T} P
 * @param {T} obj an object
 * @param {P} prop a property of this object
 * @param {function(): T[P]} factory a default value factory for the property
 * @returns {void}
 */
const F = (obj, prop, factory) => {
  if (obj[prop] === undefined) {
    obj[prop] = factory();
  }
};

/**
 * Sets a dynamic default value, by calling the factory function
 * @template T
 * @template {keyof T} P
 * @param {T} obj an object
 * @param {P} prop a property of this object
 * @param {function(): T[P]} factory a default value factory for the property
 * @returns {void}
 */
const FF = (obj, prop, factory) => {
  obj[prop] = factory(obj[prop]);
};

/**
 *
 * @param {Array} plugins
 * @param {WebpackPlugin} Plugin
 * @param {object} pluginOpts
 * @returns {void}
 */
const applyPlugin = (plugins, Plugin, pluginOpts) => {
  if (!plugins.find((plugin) => plugin.constructor === Plugin)) {
    plugins.push(new Plugin(pluginOpts));
  }
};

/**
 * Prepend webpackHotDevClient files to entry
 * @param {*} entry opitions.entry
 */
const prependEntry = (entry) => {
  const entries = [require.resolve('react-dev-utils/webpackHotDevClient')];

  if (typeof entry === 'function') {
    return () => Promise.resolve(entry()).then(prependEntry);
  }

  if (typeof entry === 'object' && !Array.isArray(entry)) {
    const clone = {};

    Object.keys(entry).forEach((key) => {
      clone[key] = entries.concat(entry[key]);
    });
    return clone;
  }
  return entries.concat(entry);
};

/**
 * @param {WebpackOptions} options options to be modified
 * @returns {void}
 */
const applyWebpackOptionsDefaults = (options = {}) => {
  F(options, 'context', () => process.cwd());
  D(options, 'target', 'web');
  D(options, 'mode', 'development');

  const { mode } = options;

  const development = mode === 'development';
  const production = mode === 'production' || !mode;
  const ale = options.ale || {};

  delete options.ale;

  D(options, 'output', {});

  const publicPath = options.output.publicPath;

  F(options, 'devtool', () =>
    development ? 'cheap-module-source-map' : false,
  );

  applyAleDefaults(ale, { development, publicPath });

  D(options, 'resolve', {});
  applyWebpackResolveDefaults(options.resolve);

  D(options, 'devServer', {});
  applyWebpackDevServerDefaults(options.devServer);

  const hotReplacementEnabled =
    development && options.devServer.hot && options.devServer.inline !== false;

  if (hotReplacementEnabled) {
    prependEntry(options.entry);
  }

  D(options, 'optimization', {});
  applyOptimizationDefaults(options.optimization, { development, production });

  D(options, 'module', {});
  applyModuleDefaults(options.module, {
    babelEnv: ale.babelEnv,
    babelPlugins: ale.babelPlugins,
    css: ale.css,
    development,
    fileOptions: ale.fileOptions,
    hotReplacementEnabled,
    html: ale.html,
    postcssPlugins: ale.postcssPlugins,
    production,
  });

  D(options, 'plugins', []);
  FF(options, 'plugins', (userPlugins) => {
    const { CleanWebpackPlugin } = require('clean-webpack-plugin');
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    const WebpackBar = require('webpackbar');
    const ZipPlugin = require('zip-webpack-plugin');

    const plugins = [...userPlugins];

    applyPlugin(plugins, WebpackBar);

    if (hotReplacementEnabled) {
      applyPlugin(plugins, webpack.HotModuleReplacementPlugin);
    }

    if (ale.html) {
      const htmlTemplateOpts = {
        inject: true,
        title: '\u200E',
        template: path.join(__dirname, '../templates/app.ejs'),
      };

      if (Array.isArray(ale.html)) {
        ale.html.forEach((htmlOpts) => {
          plugins.push(
            new HtmlWebpackPlugin({
              ...htmlTemplateOpts,
              ...htmlOpts,
            }),
          );
        });
      } else {
        plugins.push(
          new HtmlWebpackPlugin({
            ...htmlTemplateOpts,
            ...ale.html,
          }),
        );
      }
    }

    if (ale.define) {
      plugins.push(new webpack.DefinePlugin(ale.define));
    }

    if (production) {
      plugins.push(new CleanWebpackPlugin());
    }

    if (!ale.css.inline) {
      applyPlugin(plugins, ExtractCssChunks, {
        filename: ale.css.filename,
        chunkFilename: ale.css.chunkFilename,
        ignoreOrder: true,
      });
    }

    if (ale.zip) {
      applyPlugin(plugins, ZipPlugin, ale.zip);
    }

    return plugins;
  });
};

/**
 * @param {AleOptions} ale options
 * @returns {void}
 */
const applyAleDefaults = (ale, { development, publicPath }) => {
  D(ale, 'html', false);
  FF(ale, 'css', (cssOpts) => ({
    filename: '[name].css',
    chunkFilename: '[id].chunk.css',
    publicPath,
    inline: false,
    ...cssOpts,
  }));
  F(ale, 'postcssPlugins', () => {
    const flexbugsFixes = require('postcss-flexbugs-fixes');
    const presetEnv = require('postcss-preset-env');
    return [
      flexbugsFixes,
      presetEnv({
        autoprefixer: { flexbox: 'no-2009' },
        stage: 3,
      }),
    ];
  });
  FF(ale, 'babelEnv', (env) => {
    return {
      ...env,
    };
  });
  D(ale, 'babelPlugins', []);
  FF(ale, 'fileOptions', (opts) => {
    return {
      esModule: false,
      ...opts,
    };
  });
  FF(ale, 'define', (defineValues) => {
    const defaultDefined = development
      ? {
          'process.env': JSON.stringify(process.env),
          ...defineValues,
        }
      : defineValues;
    return defaultDefined;
  });
  D(ale, 'zip', false);
};

/**
 *
 * @param {WebpackOptions} resolve options.resolve
 * @returns {void}
 */
const applyWebpackResolveDefaults = (resolve) => {
  FF(resolve, 'alias', (alias) => ({
    '@babel/runtime': path.dirname(
      require.resolve('@babel/runtime/package.json'),
    ),
    '~': path.join(process.cwd(), 'src'),
    ...alias,
  }));
  D(resolve, 'extensions', [
    '.wasm',
    '.mjs',
    '.js',
    '.jsx',
    '.json',
    '.ts',
    '.tsx',
  ]);
};

/**
 *
 * @param {WebpackOptions} devServer options.devServer
 * @returns {void}
 */
const applyWebpackDevServerDefaults = (devServer) => {
  D(devServer, 'clientLogLevel', 'debug');
  D(devServer, 'compress', true);
  D(devServer, 'disableHostCheck', true);
  FF(devServer, 'headers', (headers) => ({
    'access-control-allow-origin': '*',
    ...headers,
  }));
  D(devServer, 'host', '0.0.0.0');
  D(devServer, 'hot', true);
  D(devServer, 'open', false);
  D(devServer, 'openPage', '');
  D(devServer, 'overlay', true);
  D(devServer, 'port', 3000);
  D(devServer, 'quiet', true);
  D(devServer, 'watchOptions', { ignored: NODE_MODULES_REGEXP });
};

/**
 * @param {Optimization} optimization options
 * @param {Object} options options
 * @param {boolean} options.production is production
 * @param {boolean} options.development is development
 * @param {boolean} options.records using records
 * @returns {void}
 */
const applyOptimizationDefaults = (optimization, { production }) => {
  F(optimization, 'minimizer', () => [
    (compiler) => {
      const TerserPlugin = require('terser-webpack-plugin');
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
        terserOptions: {
          compress: {
            drop_console: true,
            keep_fnames: true,
          },
        },
      }).apply(compiler);
    },
    (compiler) => {
      const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: [
            'default',
            {
              svgo: { exclude: true },
            },
          ],
        },
      }).apply(compiler);
    },
  ]);
};

/**
 * @param {WebpackModule} module options
 * @param {Object} options options
 * @param {boolean} options.cache is caching enabled
 * @param {boolean} options.mjs is mjs enabled
 * @param {boolean} options.syncWebAssembly is syncWebAssembly enabled
 * @param {boolean} options.asyncWebAssembly is asyncWebAssembly enabled
 * @param {boolean} options.webTarget is web target
 * @returns {void}
 */
const applyModuleDefaults = (
  module,
  {
    development,
    babelEnv,
    babelPlugins,
    css,
    fileOptions,
    hotReplacementEnabled,
    postcssPlugins,
  },
) => {
  D(module, 'rules', []);
  FF(module, 'rules', (rules) => {
    const preset = require('babel-preset');
    const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
    const lessPluginGlob = require('less-plugin-glob');

    const getStyleLoaders = (cssOptions, preProcessor, preProcessorOptions) => {
      const cssSourceMap = css.inline != undefined ? !css.inline : development;

      const loaders = [
        development && {
          loader: require.resolve('css-hot-loader'),
          options: {
            cssModule: !!cssOptions.modules,
          },
        },
        css.inline
          ? {
              loader: require.resolve('style-loader'),
              options: { injectType: 'singletonStyleTag' },
            }
          : {
              loader: ExtractCssChunks.loader,
              options: {
                publicPath: css.publicPath,
                hmr: hotReplacementEnabled,
              },
            },
        {
          loader: require.resolve('css-loader'),
          options: { sourceMap: cssSourceMap, ...cssOptions },
        },
        {
          loader: require.resolve('postcss-loader'),
          options: {
            ident: 'postcss',
            plugins: [
              require('postcss-flexbugs-fixes'),
              require('postcss-preset-env')({
                autoprefixer: { flexbox: 'no-2009' },
                stage: 3,
              }),
              ...postcssPlugins,
            ],
            sourceMap: cssSourceMap,
          },
        },
      ].filter(Boolean);

      if (preProcessor) {
        loaders.push({
          loader: require.resolve(preProcessor),
          options: Object.assign({}, preProcessorOptions, {
            sourceMap: cssSourceMap,
          }),
        });
      }

      return loaders;
    };

    const core = [
      {
        test: /\.ext$/,
        use: {
          loader: require.resolve('cache-loader'),
        },
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: NODE_MODULES_REGEXP,
        // include: options.context,
        enforce: 'pre',
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              presets: [[preset, babelEnv]],
              plugins: babelPlugins,
              sourceType: 'unambiguous',
            },
          },
          {
            loader: require.resolve('hmr-accept-loader'),
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg|eot|ttf|woff)$/i,
        use: [
          {
            loader: require.resolve('file-loader'),
            options: fileOptions,
          },
        ],
      },
    ];

    const cssRules = [
      {
        test: CSS_REGEXP,
        exclude: CSS_MODULES_REGEXP,
        use: getStyleLoaders({
          importLoaders: 1,
        }),
        sideEffects: true,
      },
      {
        test: CSS_MODULES_REGEXP,
        use: getStyleLoaders({
          importLoaders: 1,
          modules: {
            getLocalIdent: getCSSModuleLocalIdent,
          },
          localsConvention: 'camelCaseOnly',
        }),
      },
      {
        test: LESS_REGEXP,
        exclude: LESS_MODULES_REGEXP,
        use: getStyleLoaders(
          {
            importLoaders: 2,
          },
          'less-loader',
          {
            javascriptEnabled: true,
            plugins: [lessPluginGlob],
          },
        ),
        sideEffects: true,
      },
      {
        test: LESS_MODULES_REGEXP,
        use: getStyleLoaders(
          {
            importLoaders: 2,
            modules: {
              getLocalIdent: getCSSModuleLocalIdent,
            },
            localsConvention: 'camelCaseOnly',
          },
          'less-loader',
          {
            javascriptEnabled: true,
            plugins: [lessPluginGlob],
          },
        ),
      },
    ];

    return [...core, ...cssRules, ...rules];
  });
};

exports.applyWebpackOptionsDefaults = applyWebpackOptionsDefaults;
