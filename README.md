# ale-webpack

为了更容易的使用webpack, ale-webpack在webpack的基础上增加了一些默认配置和快捷配置ale, 配置的对象格式和webpack保持一致.

## 安装

```
## 安装命令
npm install -g ale-cli

```

## ale 默认参数

[aleOptions.js](https://github.com/jian263994241/ale-webpack/blob/master/lib/aleOptions.js)

## 配置例子:

```javascript

const path = require('path');
const webpack = require('webpack');

exports.default = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: require.resolve('string-replace-loader'),
          options: {
            multiple: [
              { search: '__uri', replace: 'require', flags: 'g' }
            ]
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      APIURL: JSON.stringify('/api'),
    })
  ],
  ale: {
    html: {
      title: 'Hello Word',
      appMountId: 'root',
      mobile: true
    },
    babel(options) {
      options.plugins = [
        ['styled-components', { displayName: false }],
        ['import', { libraryName: 'antd-mobile', style: true }, 'antd-mobile'],
        ['import', { libraryName: 'lodash', camel2DashComponentName: false, libraryDirectory: '' }, 'lodash']
      ];
      return options;
    }
  }
}

exports.prod = {
  output: {
    filename: 'res/j/app.[hash].js',
    chunkFilename: 'res/j/[id][chunkhash].js',
    publicPath: 'https://img.99bill.com',
  },
  mode: 'production',
  ale: {
    html: {
      filename: 'seashell/webapp/xxxxx/default.html'
    },
    css: {
      filename: 'res/c/[hash].css',
      chunkFilename: 'res/c/[name].chunk.css',
    },
    image: {
      outputPath: 'res/i'
    },
    zip: {
      filename: 'merchant-loan-jsd@[time].zip',
    },
  }
}

```


## typescript

### type-check

add `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "esnext",
    "moduleResolution": "node",
    "allowJs": true,
    "noEmit": true,
    "strict": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react"
  },
  "include": [
    "src"
  ]
}
```

>> and just run `tsc` and that’s it! tsc will type-check your `.ts` and `.tsx` files. [[post](https://devblogs.microsoft.com/typescript/typescript-and-babel-7/)]
