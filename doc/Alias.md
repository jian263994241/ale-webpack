# 设置alias

方案1: package.json 添加 `alias` 字段

```json
{
  "alias": {
    "react-dom": "react-dom/profiling"
  }
}

```

方案2:  添加webpack.config.js

```js
module.exports = {
  resolve: {
    alias: {
      'react-dom': 'react-dom/profiling'
    }
  }
}

```
