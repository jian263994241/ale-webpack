const fs = require('fs');
// const apiMocker = require('mocker-api');
const path = require('path');
const {DefinePlugin} = require('webpack');

exports.default = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src')
    }
  },
  devServer: {
    proxy: {
     // '/cmb-itmp' : 'http://10.13.116.30:8080'
    },
    // before(app) {
    //  apiMocker(app, require.resolve('./mocker/index.js'), {
    //    // changeHost: true
    //  })
    // }
  },
  plugins: [
    // webpack plugins
  ],
  //
  // ale: {
  //   html: { /*HtmlWebpackPlugin options*/ },
  //   css: { /*MiniCssExtractPlugin options*/ },
  //   image: { /*file-loader options*/ },
  //   zip: { /*zip-webpack-plugin options*/ },
  //   replace: [ /** string-replace-loader **/ ],
  //   babel: passOpts,
  //   postcssPlugins: [],
  //   loader: passOpts,
  //   browserslist: [ '> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9' ],
  // }
  ale: {
    html: {
      title: '标题',
      appMountId: 'root',
    },
    babel(options) {
      // options.plugins = [
      //   ['import', { libraryName: 'antd', style: true }, 'antd'],
      //   ['import', { libraryName: 'lodash', camel2DashComponentName: false, libraryDirectory: '' }, 'lodash']
      // ];
      return options;
    }
  }
};

exports.prod = {
  output: {
    filename: 'res/j/[hash].js',
    publicPath: "https://xxx.com",
  },
  ale: {
    html: {
      filename: 'seashell/webapp/index.html'
    },
    css: {
      filename: 'res/c/[hash].css'
    },
    image: {
      outputPath: 'res/i'
    },
    zip: {
      filename: 'joint-receipt@[time].zip',
    },
  }
}

exports.mock = {
  output: {
    filename: 'res/j/[hash].js',
    publicPath: "/",
  },
  mode: 'development',
  ale: {
    html: {
      filename: 'seashell/webapp/index.html'
    },
    css: {
      filename: 'res/c/[hash].css'
    },
    image: {
      outputPath: 'res/i'
    }
  }
}
