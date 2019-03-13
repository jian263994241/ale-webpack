const AleOptionsDefaulter = require('./lib/AleOptionsDefaulter');
const AlePlugin = require('./plugins/AlePlugin');
const WebpackDevServer = require('webpack-dev-server');
const _ = require('lodash');
const {
  Compiler,
  HotModuleReplacementPlugin,
  MultiCompiler,
  NodeEnvironmentPlugin,
  WebpackOptionsApply,
  WebpackOptionsDefaulter,
  WebpackOptionsValidationError,
  validateSchema,
} = require('webpack');

const webpackOptionsSchema = require('webpack/schemas/WebpackOptions.json');
const optionsSchema = _.defaultsDeep(webpackOptionsSchema, require('./schemas/AleWebpackOptions'));

const aleWebpack = module.exports = (options, callback) => {
  const webpackOptionsValidationErrors = validateSchema(
		optionsSchema,
		options
	);
	if (webpackOptionsValidationErrors.length) {
		throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
	}
	let compiler;
	if (Array.isArray(options)) {
		compiler = new MultiCompiler(options.map(options => aleWebpack(options)));
	} else if (typeof options === "object") {
		options = new AleOptionsDefaulter().process(options);
    WebpackDevServer.addDevServerEntrypoints(options, options.devServer);

		compiler = new Compiler(options.context);
		compiler.options = options;
		new NodeEnvironmentPlugin().apply(compiler);
    new AlePlugin().apply(compiler);
		if (options.plugins && Array.isArray(options.plugins)) {
			for (const plugin of options.plugins) {
				if (typeof plugin === "function") {
					plugin.call(compiler, compiler);
				} else {
					plugin.apply(compiler);
				}
			}
		}
		compiler.hooks.environment.call();
		compiler.hooks.afterEnvironment.call();
		compiler.options = new WebpackOptionsApply().process(options, compiler);

    let server = new WebpackDevServer(compiler, options.devServer);
    server.listen(options.devServer.port, 'localhost', () => {
      // console.log('Starting server on http://localhost:8080');
    });

	} else {
		throw new Error("Invalid argument: options");
	}
	if (callback) {
		if (typeof callback !== "function") {
			throw new Error("Invalid argument: callback");
		}
		if (
			options.watch === true ||
			(Array.isArray(options) && options.some(o => o.watch))
		) {
			const watchOptions = Array.isArray(options)
				? options.map(o => o.watchOptions || {})
				: options.watchOptions || {};
			return compiler.watch(watchOptions, callback);
		}
		compiler.run(callback);
	}

	return compiler;
}
