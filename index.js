const AleOptionsApply = require('./lib/AleOptionsApply');
const AleOptionsDefaulter = require('./lib/AleOptionsDefaulter');
const pkg = require('./package.json');
const _ = require('lodash');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackOptionsSchema = require('webpack/schemas/WebpackOptions.json');

const {Compiler, MultiCompiler, NodeEnvironmentPlugin, WebpackOptionsValidationError, validateSchema} = webpack;

const optionsSchema = _.defaultsDeep(webpackOptionsSchema, require('./schemas/AleWebpackOptions'));

const aleWebpack = (options, callback) => {
  const webpackOptionsValidationErrors = validateSchema( optionsSchema, options );
	if (webpackOptionsValidationErrors.length) {
		throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
	}
	let compiler;
	if (Array.isArray(options)) {
		compiler = new MultiCompiler(options.map(options => aleWebpack(options)));
	} else if (typeof options === "object") {
		options = new AleOptionsDefaulter().process(options);

		compiler = new Compiler(options.context);
		compiler.options = options;
		new NodeEnvironmentPlugin().apply(compiler);
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
		compiler.options = new AleOptionsApply().process(options, compiler);
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

exports = module.exports = aleWebpack;
exports.version = pkg.version;
exports.webpack = webpack;
exports.WebpackDevServer = WebpackDevServer;
