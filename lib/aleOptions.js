const passOpts = opts => opts ;

module.exports = {
  html: { /*HtmlWebpackPlugin options*/ },
  css: {
    /*MiniCssExtractPlugin options*/
    // filename: '[name].css',
    chunkFilename: '[name].chunk.css'
  },
  image: { /*file-loader options*/ },
  zip: { /*zip-webpack-plugin options*/ },
  replace: [
    /** string-replace-loader **/
  ],
  babel: passOpts,
  postcssPlugins: [],
  loader: passOpts,
  browserslist: [ '> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9' ],
};
