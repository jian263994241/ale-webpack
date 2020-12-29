# 添加一个webpack plugin

请参考 [webpack plugin](https://webpack.js.org/plugins/)

```js
module.exports = {
  resolve: {
    alias: {
      'react-dom': 'react-dom/profiling'
    }
  },
  plugins: [
    //...参考webpack plugin
  ]
}

```
