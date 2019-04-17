const passOpts = opts => opts ;

module.exports = {
  html: { /*HtmlWebpackPlugin options*/ },
  css: {
    /*MiniCssExtractPlugin options*/
    filename: '[name].css',
    chunkFilename: '[name].chunk.css',
    //postcss extra plugins
    plugins: [],
  },
  image: { /*file-loader options*/ },
  zip: { /*zip-webpack-plugin options*/ },
  babel: passOpts,
};
