export default {
  entry: './app.js',
  output: {
    publicPath: '/',
  },
  devServer: {
    port: 8000,
  },
  ale: {
    html: {
      title: 'Example',
    },
  },
};
