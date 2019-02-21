const path = require('path');
const preset = require('babel-preset');

module.exports = function(options){

  const list = [
    {
      test: /\.(js|jsx|es)$/,
      exclude: /(node_modules|bower_components)/,
      include: options.context,
      enforce: 'pre',
      use: {
        loader: require.resolve('babel-loader'),
        options: { presets: [preset] }
      }
    },
    {
      test: /\.css$/,
      use: [
       { loader: require.resolve('style-loader') },
       { loader: require.resolve('css-loader') }
      ]
    }
  ];
  
  return list;
}
