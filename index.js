const AleOptionsDefaulter = require('./lib/AleOptionsDefaulter');
const AlePlugin = require('./plugins/AlePlugin');
const WebpackDevServer = require('webpack-dev-server');
const _ = require('lodash');
const {
  MultiCompiler,
  NodeEnvironmentPlugin,
  WebpackOptionsApply,
  WebpackOptionsDefaulter,
  WebpackOptionsValidationError,
  validateSchema,
  Compiler,
  HotModuleReplacementPlugin
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

    if(options.devServer.contentBase){
      new HotModuleReplacementPlugin().apply(compiler);
      WebpackDevServer.addDevServerEntrypoints(options, options.devServer);
      compiler.run = ()=>{
        let server = new WebpackDevServer(compiler, Object.assign(options.devServer, {stats: { colors: true }}));
        server.listen(options.devServer.port, '127.0.0.1', () => {
          // console.log('Starting server on http://localhost:8080');
        });
      }
    }
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
