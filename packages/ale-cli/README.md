# 快速开始

ale-webpack 是一个基于webpack的打包方案, 默认配置方案参考create-react-app, 同时兼容`webpack.config.js`扩展和零配置两种方案.

## 安装

```bash
npm install ale-cli -D

# or

yarn add ale-cli --dev

```


## 创建项目

创建必要文件 `index.tsx` 和 `index.html`

目录结构

```
myApp
├─package.json
├─src
|  ├─index.jsx
├─public
|   └index.html
```


## 脚本

package.json 添加 scripts

```json

{
  "scripts": {
    "start": "ale start",
    "build": "ale build",
  }
}

```

`npm start` or `yarn start`

启动dev-server开始预览项目


`npm build` or `yarn build`

打包项目文件到 `/build` 文件夹, 默认会创建一个  `{packageName}_{packageVersion}.zip` 的压缩包

`npm test` or `yarn test`

执行项目下所有测试文件,  更多[参考](https://create-react-app.dev/docs/running-tests/)



