const passOpts = opts => opts ;

module.exports = {
  html: { /*HtmlWebpackPlugin options*/ },
  css: { /*MiniCssExtractPlugin options*/ },
  image: { /*file-loader options*/ },
  zip: { /*zip-webpack-plugin options*/ },
  define: {/*webpack.DefinePlugin options*/},
  babel: passOpts,
  postcssPlugins: [],
  loader: passOpts,
  browserslist: [ '> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9' ],
};
