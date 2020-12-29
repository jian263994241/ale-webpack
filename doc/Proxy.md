# Proxy

设置代理

方案1: package.json 添加 `proxy`

```json
{
  "proxy": "http://localhost:4000"
}
```

方案2: webpack.config.js

```js
module.exports = {
  devServer: {
    proxy: {
      "/cpd-agent-gateway/apiH5": {
        target : "https://localhost:4000",
        changeOrigin : true,
      },
    }
  }
}
```

方案3:  create `src/setupProxy.js`

```js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
};
```
