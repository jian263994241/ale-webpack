const webpack = require('webpack');


module.exports = {
  entry: './app.js',
  devServer: {
    port: 8000,
  },
  ale: {
    html: {
      title: 'Example',
    }
  }
}