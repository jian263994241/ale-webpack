# ale-webpack

为了更容易的使用 webpack, ale-webpack 在 webpack 的基础上增加了一些默认配置和快捷配置 ale, 配置的对象格式和 webpack 保持一致.

## 安装

```
## 安装命令
npm install ale-cli -D

## default
npm run dev

## prod
npm run build

```

package.json

```json
{
  "scripts": {
    "dev": "ale dev",
    "build": "ale build prod"
  }
}
```

## 配置例子:

创建一个配置文件`.alerc.js`

```javascript
import path from 'path';
import { version } from './package.json';

export default {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          name: 'vendor',
          priority: -10,
          enforce: true,
        },
      },
    },
  },
  // ...webpack config

  ale: {
    html: {
      // object || array
      title: '\u200E',
      appMountId: 'root',
      mobile: true,
      stylesheets: [], // css
      scripts: [], //pre scripts
      chunks: ['vendor', 'main'],
    },
    postcssPlugins: [],
    babelEnv: {},
    babelPlugins: [
      ['styled-components', { displayName: false }],
      ['import', { libraryName: 'antd-mobile', style: true }, 'antd-mobile'],
      [
        'import',
        {
          libraryName: 'lodash',
          camel2DashComponentName: false,
          libraryDirectory: '',
        },
        'lodash',
      ],
    ],
    define: {
      baseURL: JSON.stringify('https://www.github.com'),
    },
    fileOptions: {
      //jpg, svg, img ... res  file-loader options
      esModule: true,
    },
  },
};

export const prod = {
  output: {
    filename: 'res/j/app.[hash].js',
    chunkFilename: 'res/j/[id][chunkhash].js',
    publicPath: 'https://img.99bill.com/',
  },
  mode: 'production',
  ale: {
    html: {
      filename: 'seashell/webapp/xxxxx/default.html',
    },
    css: {
      filename: 'res/c/[hash].css',
      chunkFilename: 'res/c/[chunkhash].chunk.css',
    },
    fileOptions: {
      outputPath: 'res/i',
    },
    zip: {
      filename: `pkg@${version}.zip`,
    },
  },
};
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
    "experimentalDecorators": true,
    "jsx": "react",
    "baseUrl": "./",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src/*"]
}
```

> > and just run `tsc` and that’s it! tsc will type-check your `.ts` and `.tsx` files.
> > Feel free to add the `--watch` flag to either tool to get immediate feedback when anything changes. [[post](https://devblogs.microsoft.com/typescript/typescript-and-babel-7/)]
