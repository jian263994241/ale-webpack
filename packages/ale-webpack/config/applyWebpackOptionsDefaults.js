'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const typescriptFormatter = require('react-dev-utils/typescriptFormatter');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const paths = require('./paths');
const modules = require('./modules');
const getClientEnvironment = require('./env');
const postcssNormalize = require('postcss-normalize');
const safePostCssParser = require('postcss-safe-parser');

const appPackageJson = require(paths.appPackageJson);

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const webpackDevClientEntry = require.resolve('../utils/webpackHotDevClient');
const reactRefreshOverlayEntry = require.resolve(
  'react-dev-utils/refreshOverlayInterop',
);

// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000',
);

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig);
// Get the path to the uncompiled service worker (if it exists).
const swSrc = paths.swSrc;

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const NODE_MODULES_REGEXP = /[\\/]node_modules[\\/]/i;

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }

  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

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
  const entries = [webpackDevClientEntry];

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
  const isEnvDevelopment = process.env.NODE_ENV === 'development';
  const isEnvProduction = process.env.NODE_ENV === 'production';

  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile =
    isEnvProduction && process.argv.includes('--profile');

  // We will provide `paths.publicUrlOrPath` to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const shouldUseReactRefresh = env.raw.FAST_REFRESH;

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use '../../' to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        options: paths.publicUrlOrPath.startsWith('.')
          ? { publicPath: '../../' }
          : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebook/create-react-app/issues/2677
          postcssOptions: {
            ident: 'postcss',
            parser: safePostCssParser,
            plugins: () => [
              require('postcss-flexbugs-fixes'),
              require('postcss-preset-env')({
                autoprefixer: {
                  flexbox: 'no-2009',
                },
                stage: 3,
              }),
              // Adds PostCSS Normalize as the reset css with default options,
              // so that it honors browserslist config in package.json
              // which in turn let's users customize the target behavior as per their needs.
              postcssNormalize(),
            ],
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        },
      );
    }
    return loaders;
  };

  D(
    options,
    'mode',
    isEnvProduction ? 'production' : isEnvDevelopment && 'development',
  );

  D(options, 'bail', isEnvProduction);

  D(
    options,
    'devtool',
    isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',
  );
  FF(options, 'entry', () => {
    //ignore user entry
    return isEnvDevelopment && !shouldUseReactRefresh
      ? [webpackDevClientEntry, paths.appIndexJs]
      : paths.appIndexJs;
  });

  FF(options, 'output', () => {
    //ignore user output
    return {
      // The build folder.
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/[name].bundle.js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: paths.publicUrlOrPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, '/')
        : isEnvDevelopment &&
          ((info) =>
            path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
      // Prevents conflicts when multiple webpack runtimes (from different apps)
      // are used on the same page.
      uniqueName: `webpackJsonp${appPackageJson.name}`,
      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      globalObject: 'this',
    };
  });

  D(options, 'optimization', {});
  D(options.optimization, 'minimize', isEnvProduction);
  D(options.optimization, 'minimizer', [
    // This is only used in production mode
    new TerserPlugin({
      terserOptions: {
        parse: {
          // We want terser to parse ecma 8 code. However, we don't want it
          // to apply any minification steps that turns valid ecma 5 code
          // into invalid ecma 5 code. This is why the 'compress' and 'output'
          // sections only apply transformations that are ecma 5 safe
          // https://github.com/facebook/create-react-app/pull/4234
          ecma: 8,
        },
        compress: {
          ecma: 5,
          warnings: false,
          // Disabled because of an issue with Uglify breaking seemingly valid code:
          // https://github.com/facebook/create-react-app/issues/2376
          // Pending further investigation:
          // https://github.com/mishoo/UglifyJS2/issues/2011
          comparisons: false,
          // Disabled because of an issue with Terser breaking valid code:
          // https://github.com/facebook/create-react-app/issues/5250
          // Pending further investigation:
          // https://github.com/terser-js/terser/issues/120
          inline: 2,
          drop_console: true,
        },
        mangle: {
          safari10: true,
        },
        // Added for profiling in devtools
        keep_classnames: isEnvProductionProfile,
        keep_fnames: isEnvProductionProfile,
        output: {
          ecma: 5,
          comments: false,
          // Turned on because emoji and regex is not minified properly using default
          // https://github.com/facebook/create-react-app/issues/2488
          ascii_only: true,
        },
      },
    }),
    // This is only used in production mode
    new CssMinimizerPlugin({
      sourceMap: shouldUseSourceMap,
      minimizerOptions: {
        preset: ['default', { minifyFontValues: { removeQuotes: false } }],
      },
    }),
  ]);
  D(options.optimization, 'splitChunks', {
    chunks: 'all',
    name: false,
  });
  D(options.optimization, 'runtimeChunk', {
    name: (entrypoint) => `runtime-${entrypoint.name}`,
  });

  D(options, 'resolve', {});
  FF(options.resolve, 'alias', (alias) => ({
    // Support React Native Web
    // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
    'react-native': 'react-native-web',
    // Allows for better profiling with ReactDevTools
    ...(isEnvProductionProfile && {
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    }),
    ...(modules.webpackAliases || {}),
    ...alias,
  }));
  D(
    options.resolve,
    'modules',
    ['node_modules', paths.appNodeModules].concat(
      modules.additionalModulePaths || [],
    ),
  );
  D(
    options.resolve,
    'extensions',
    paths.moduleFileExtensions
      .map((ext) => `.${ext}`)
      .filter((ext) => useTypeScript || !ext.includes('ts')),
  );

  FF(options.resolve, 'plugins', (userResolvePlugins = []) => {
    return [
      // Adds support for installing with Plug'n'Play, leading to faster installs and adding
      // guards against forgotten dependencies and such.
      PnpWebpackPlugin,
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.

      // new ModuleScopePlugin(paths.appSrc, [
      //   paths.appPackageJson,
      //   reactRefreshOverlayEntry,
      // ]),
      ...userResolvePlugins,
    ];
  });

  D(options, 'resolveLoader', {});
  FF(options.resolveLoader, 'plugins', (userResolveLoader = []) => {
    return [
      // Also related to Plug'n'Play, but this time it tells webpack to load its loaders
      // from the current package.
      PnpWebpackPlugin.moduleLoader(module),
      ...userResolveLoader,
    ];
  });

  D(options, 'module', {});
  D(options.module, 'strictExportPresence', true);
  FF(options.module, 'rules', (userRules = []) => {
    return [
      // Disable require.ensure as it's not a standard language feature.
      { parser: { requireEnsure: false } },
      // TODO: Merge this config once `image/avif` is in the mime-db
      // https://github.com/jshttp/mime-db
      {
        test: [/\.avif$/],
        use: {
          loader: require.resolve('url-loader'),
          options: {
            limit: imageInlineSizeLimit,
            mimetype: 'image/avif',
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      },
      // "url" loader works like "file" loader except that it embeds assets
      // smaller than specified limit in bytes as data URLs to avoid requests.
      // A missing `test` is equivalent to a match.
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        use: {
          loader: require.resolve('url-loader'),
          options: {
            limit: imageInlineSizeLimit,
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      },
      // Process application JS with Babel.
      // The preset includes JSX, Flow, TypeScript, and some ESnext features.
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        include: paths.appSrc,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            customize: require.resolve(
              'babel-preset-react-app/webpack-overrides',
            ),
            presets: [
              [
                require.resolve('babel-preset-react-app'),
                {
                  runtime: hasJsxRuntime ? 'automatic' : 'classic',
                },
              ],
            ],
            plugins: [
              [
                require.resolve('babel-plugin-named-asset-import'),
                {
                  loaderMap: {
                    svg: {
                      ReactComponent:
                        '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                    },
                  },
                },
              ],
              isEnvDevelopment &&
                shouldUseReactRefresh &&
                require.resolve('react-refresh/babel'),
            ].filter(Boolean),
            // This is a feature of `babel-loader` for webpack (not Babel itself).
            // It enables caching results in ./node_modules/.cache/babel-loader/
            // directory for faster rebuilds.
            cacheDirectory: true,
            // See #6846 for context on why cacheCompression is disabled
            cacheCompression: false,
            compact: isEnvProduction,
          },
        },
      },
      // Process any JS outside of the app with Babel.
      // Unlike the application JS, we only compile the standard ES features.
      {
        test: /\.(js|mjs)$/,
        exclude: /@babel(?:\/|\\{1,2})runtime/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            compact: false,
            presets: [
              [
                require.resolve('babel-preset-react-app/dependencies'),
                { helpers: true },
              ],
            ],
            cacheDirectory: true,
            // See #6846 for context on why cacheCompression is disabled
            cacheCompression: false,

            // Babel sourcemaps are needed for debugging into node_modules
            // code.  Without the options below, debuggers like VSCode
            // show incorrect code and set breakpoints on the wrong lines.
            sourceMaps: shouldUseSourceMap,
            inputSourceMap: shouldUseSourceMap,
          },
        },
      },
      // "postcss" loader applies autoprefixer to our CSS.
      // "css" loader resolves paths in CSS and adds assets as dependencies.
      // "style" loader turns CSS into JS modules that inject <style> tags.
      // In production, we use MiniCSSExtractPlugin to extract that CSS
      // to a file, but in development "style" loader enables hot editing
      // of CSS.
      // By default we support CSS Modules with the extension .module.css
      {
        test: cssRegex,
        exclude: cssModuleRegex,
        use: getStyleLoaders({
          importLoaders: 1,
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        }),
        // Don't consider CSS imports dead code even if the
        // containing package claims to have no side effects.
        // Remove this when webpack adds a warning or an error for this.
        // See https://github.com/webpack/webpack/issues/6571
        sideEffects: true,
      },
      // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
      // using the extension .module.css
      {
        test: cssModuleRegex,
        use: getStyleLoaders({
          importLoaders: 1,
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
          modules: {
            getLocalIdent: getCSSModuleLocalIdent,
          },
        }),
      },
      // Opt-in support for SASS (using .scss or .sass extensions).
      // By default we support SASS Modules with the
      // extensions .module.scss or .module.sass
      {
        test: sassRegex,
        exclude: sassModuleRegex,
        use: getStyleLoaders(
          {
            importLoaders: 3,
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
          },
          'sass-loader',
        ),
        // Don't consider CSS imports dead code even if the
        // containing package claims to have no side effects.
        // Remove this when webpack adds a warning or an error for this.
        // See https://github.com/webpack/webpack/issues/6571
        sideEffects: true,
      },
      // Adds support for CSS Modules, but using SASS
      // using the extension .module.scss or .module.sass
      {
        test: sassModuleRegex,
        use: getStyleLoaders(
          {
            importLoaders: 3,
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            modules: {
              getLocalIdent: getCSSModuleLocalIdent,
            },
          },
          'sass-loader',
        ),
      },
      // "file" loader makes sure those assets get served by WebpackDevServer.
      // When you `import` an asset, you get its (virtual) filename.
      // In production, they would get copied to the `build` folder.
      // This loader doesn't use a "test" so it will catch all modules
      // that fall through the other loaders.
      {
        loader: require.resolve('file-loader'),
        // Exclude `js` files to keep "css" loader working as it injects
        // its runtime that would otherwise be processed through "file" loader.
        // Also exclude `html` and `json` extensions so they get processed
        // by webpacks internal loaders.
        exclude: [
          /\.(js|mjs|jsx|ts|tsx)$/,
          /\.html$/,
          /\.json$/,
          /\.(less|sass|scss|config|variables|overrides)$/,
        ],
        options: {
          name: 'static/media/[name].[hash:8].[ext]',
        },
      },
      ...userRules,
    ];
  });

  FF(options, 'plugins', (userPlugins = []) => {
    return [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml,
          },
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
              }
            : undefined,
        ),
      ),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      isEnvProduction &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // It will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // This is necessary to emit hot updates (CSS and Fast Refresh):
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      // Experimental hot reloading for React .
      // https://github.com/facebook/react/tree/master/packages/react-refresh
      isEnvDevelopment &&
        shouldUseReactRefresh &&
        new ReactRefreshWebpackPlugin({
          overlay: {
            entry: webpackDevClientEntry,
            // The expected exports are slightly different from what the overlay exports,
            // so an interop is included here to enable feedback on module-level errors.
            module: reactRefreshOverlayEntry,
            // Since we ship a custom dev client and overlay integration,
            // the bundled socket handling logic can be eliminated.
            sockIntegration: false,
          },
        }),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebook/create-react-app/issues/186
      isEnvDevelopment &&
        new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
          ignoreOrder: true,
        }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            (fileName) => !fileName.endsWith('.map'),
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the webpack build.
      isEnvProduction &&
        fs.existsSync(swSrc) &&
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc,
          dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
          exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
          // Bump up the default maximum size (2mb) that's precached,
          // to make lazy-loading failure scenarios less likely.
          // See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        }),
      // TypeScript type checking
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync('typescript', {
            basedir: paths.appNodeModules,
          }),
          async: isEnvDevelopment,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          tsconfig: paths.appTsConfig,
          reportFiles: [
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            // otherwise.
            '../**/src/**/*.{ts,tsx}',
            '**/src/**/*.{ts,tsx}',
            '!**/src/**/__tests__/**',
            '!**/src/**/?(*.)(spec|test).*',
            '!**/src/setupProxy.*',
            '!**/src/setupTests.*',
          ],
          silent: true,
          // The formatter is invoked directly in WebpackDevServerUtils during development
          formatter: isEnvProduction ? typescriptFormatter : undefined,
        }),
      new ESLintPlugin({
        // Plugin options
        extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
        formatter: require.resolve('react-dev-utils/eslintFormatter'),
        eslintPath: require.resolve('eslint'),
        context: paths.appSrc,
        cache: true,
        // ESLint class options
        cwd: paths.appPath,
        resolvePluginsRelativeTo: __dirname,
        baseConfig: {
          extends: [require.resolve('eslint-config-react-app/base')],
          rules: {
            ...(!hasJsxRuntime && {
              'react/react-in-jsx-scope': 'error',
            }),
          },
        },
      }),

      isEnvProduction &&
        new FileManagerPlugin({
          events: {
            onEnd: {
              archive: [
                {
                  source: options.output.path,
                  destination: path.join(
                    options.output.path,
                    typeof ale.zip.filename == 'string'
                      ? ale.zip.filename
                      : path.basename(process.cwd()) +
                          '_' +
                          Date.now() +
                          '.zip',
                  ),
                },
              ],
            },
          },
        }),
      ...userPlugins,
    ].filter(Boolean);
  });

  D(options, 'performance', false);

  return options;

  // const development = isEnvDevelopment;
  // const production = isEnvProduction;

  // const ale = options.ale || {};

  // delete options.ale;

  // const publicPath = options.output.publicPath;

  // applyAleDefaults(ale, { development, publicPath });

  // D(options, 'resolve', {});
  // applyWebpackResolveDefaults(options.resolve);

  // D(options, 'devServer', {});
  // applyWebpackDevServerDefaults(options.devServer);

  // const hotReplacementEnabled =
  //   development && options.devServer.hot && options.devServer.inline !== false;

  // if (hotReplacementEnabled) {
  //   prependEntry(options.entry);
  // }

  // applyOptimizationDefaults(options.optimization, { development, production });

  // D(options, 'module', {});
  // applyModuleDefaults(options.module, {
  //   babelEnv: ale.babelEnv,
  //   babelPlugins: ale.babelPlugins,
  //   css: ale.css,
  //   development,
  //   fileOptions: ale.fileOptions,
  //   hotReplacementEnabled,
  //   html: ale.html,
  //   postcssPlugins: ale.postcssPlugins,
  //   production,
  // });

  // D(options, 'plugins', []);
  // FF(options, 'plugins', (userPlugins) => {
  //   const plugins = [...userPlugins];

  //   applyPlugin(plugins, WebpackBar);
  //   applyPlugin(
  //     plugins,
  //     WatchMissingNodeModulesPlugin,
  //     path.resolve('node_modules'),
  //   );
  //   applyPlugin(plugins, webpack.EnvironmentPlugin, {
  //     NODE_ENV: 'development',
  //     DEBUG: false,
  //     SERVICE_ENV: 'none',
  //   });

  //   if (hotReplacementEnabled) {
  //     applyPlugin(plugins, webpack.HotModuleReplacementPlugin);
  //   }

  //   if (ale.html) {
  //     const htmlTemplateOpts = {
  //       inject: true,
  //       title: '\u200E',
  //       template: path.join(__dirname, '../templates/app.ejs'),
  //     };

  //     if (Array.isArray(ale.html)) {
  //       ale.html.forEach((htmlOpts) => {
  //         plugins.push(
  //           new HtmlWebpackPlugin({
  //             ...htmlTemplateOpts,
  //             ...htmlOpts,
  //           }),
  //         );
  //       });
  //     } else {
  //       plugins.push(
  //         new HtmlWebpackPlugin({
  //           ...htmlTemplateOpts,
  //           ...ale.html,
  //         }),
  //       );
  //     }
  //   }

  //   if (ale.define) {
  //     plugins.push(new webpack.DefinePlugin(ale.define));
  //   }

  //   if (production) {
  //     plugins.push(new CleanWebpackPlugin());
  //   }

  //   if (!ale.css.inline) {
  //     applyPlugin(plugins, MiniCssExtractPlugin, {
  //       filename: ale.css.filename,
  //       chunkFilename: ale.css.chunkFilename,
  //       ignoreOrder: true,
  //     });
  //   }

  //   if (ale.zip && options.output.path) {
  //     applyPlugin(plugins, FileManagerPlugin, {
  //       events: {
  //         onEnd: {
  //           archive: [
  //             {
  //               source: options.output.path,
  //               destination: path.join(
  //                 options.output.path,
  //                 typeof ale.zip.filename == 'string'
  //                   ? ale.zip.filename
  //                   : path.basename(process.cwd()) + '_' + Date.now() + '.zip',
  //               ),
  //             },
  //           ],
  //         },
  //       },
  //     });
  //   }

  //   return plugins;
  // });
};

/**
 * ale default
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
 * resolve defauilt
 * @param {WebpackOptions} resolve options.resolve
 * @returns {void}
 */
const applyWebpackResolveDefaults = (resolve) => {
  FF(resolve, 'alias', (alias) => ({
    // Support React Native Web
    // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
    'react-native': 'react-native-web',
    // Allows for better profiling with ReactDevTools
    ...(isEnvProductionProfile && {
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    }),
    ...(modules.webpackAliases || {}),
    ...alias,
  }));

  FF(resolve, 'fallback', (fallback) => ({
    url: require.resolve('url/'),
    ...fallback,
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
 * devServer default
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

// const applyOptimizationDefaults = (optimization, { production }) => {
//   F(optimization, 'minimizer', () => [
//     (compiler) => {
//       new TerserPlugin({
//         parallel: true,
//         terserOptions: {
//           compress: {
//             drop_console: true,
//             keep_fnames: true,
//           },
//         },
//       }).apply(compiler);
//     },
//     (compiler) => {
//       new CssMinimizerPlugin().apply(compiler);
//     },
//   ]);
// };

/**
 * module default
 * @param {WebpackModule} module options
 * @param {Object} options options
 * @param {boolean} options.cache is caching enabled
 * @param {boolean} options.mjs is mjs enabled
 * @param {boolean} options.syncWebAssembly is syncWebAssembly enabled
 * @param {boolean} options.asyncWebAssembly is asyncWebAssembly enabled
 * @param {boolean} options.webTarget is web target
 * @returns {void}
 */
// const applyModuleDefaults = (
//   module,
//   { development, babelEnv, babelPlugins, css, fileOptions, postcssPlugins },
// ) => {
//   D(module, 'rules', []);
//   FF(module, 'rules', (rules) => {
//     const preset = require('babel-preset');
//     const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

//     const getStyleLoaders = (cssOptions, preProcessor, preProcessorOptions) => {
//       const cssSourceMap = css.inline != undefined ? !css.inline : development;

//       const loaders = [
//         development && {
//           loader: require.resolve('css-hot-loader'),
//           options: {
//             cssModule: !!cssOptions.modules,
//           },
//         },
//         css.inline
//           ? {
//               loader: require.resolve('style-loader'),
//               options: { injectType: 'singletonStyleTag' },
//             }
//           : {
//               loader: MiniCssExtractPlugin.loader,
//               options: {
//                 publicPath: css.publicPath,
//               },
//             },
//         {
//           loader: require.resolve('css-loader'),
//           options: { sourceMap: cssSourceMap, ...cssOptions },
//         },
//         {
//           loader: require.resolve('postcss-loader'),
//           options: {
//             postcssOptions: {
//               ident: 'postcss',
//               plugins: [
//                 require('postcss-flexbugs-fixes'),
//                 require('postcss-preset-env')({
//                   autoprefixer: { flexbox: 'no-2009' },
//                   stage: 3,
//                 }),
//                 ...postcssPlugins,
//               ],
//             },
//             sourceMap: cssSourceMap,
//           },
//         },
//       ].filter(Boolean);

//       if (preProcessor) {
//         loaders.push({
//           loader: require.resolve(preProcessor),
//           options: Object.assign({}, preProcessorOptions, {
//             sourceMap: cssSourceMap,
//           }),
//         });
//       }

//       return loaders;
//     };

//     const core = [
//       {
//         test: /\.(js|jsx|ts|tsx)$/,
//         exclude: NODE_MODULES_REGEXP,
//         // include: options.context,
//         enforce: 'pre',
//         use: [
//           {
//             loader: require.resolve('babel-loader'),
//             options: {
//               presets: [[preset, babelEnv]],
//               plugins: babelPlugins,
//               sourceType: 'unambiguous',
//             },
//           },
//           {
//             loader: require.resolve('hmr-accept-loader'),
//           },
//         ],
//       },
//       {
//         test: /\.(jpe?g|png|gif|svg|eot|ttf|woff)$/i,
//         use: [
//           {
//             loader: require.resolve('file-loader'),
//             options: fileOptions,
//           },
//         ],
//       },
//     ];

//     const cssRules = [
//       {
//         test: cssRegex,
//         exclude: cssModuleRegex,
//         use: getStyleLoaders({
//           importLoaders: 1,
//         }),
//         sideEffects: true,
//       },
//       {
//         test: cssModuleRegex,
//         use: getStyleLoaders({
//           importLoaders: 1,
//           modules: {
//             getLocalIdent: getCSSModuleLocalIdent,
//             exportLocalsConvention: 'camelCase',
//           },
//         }),
//       },
//       {
//         test: lessRegex,
//         exclude: lessModuleRegex,
//         use: getStyleLoaders(
//           {
//             importLoaders: 2,
//           },
//           'less-loader',
//           {
//             lessOptions: {
//               javascriptEnabled: true,
//               // plugins: [],
//             },
//           },
//         ),
//         sideEffects: true,
//       },
//       {
//         test: lessModuleRegex,
//         use: getStyleLoaders(
//           {
//             importLoaders: 2,
//             modules: {
//               getLocalIdent: getCSSModuleLocalIdent,
//               exportLocalsConvention: 'camelCase',
//             },
//           },
//           'less-loader',
//           {
//             lessOptions: {
//               javascriptEnabled: true,
//               // plugins: [],
//             },
//           },
//         ),
//       },
//     ];

//     return [...core, ...cssRules, ...rules];
//   });
// };

module.exports = applyWebpackOptionsDefaults;
