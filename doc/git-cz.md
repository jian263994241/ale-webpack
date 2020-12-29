
# git commit 校验

## 安装

```

npm install -D @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog husky prettier pretty-quick
```

## 配置

添加 `myApp/commitlint.config.js`

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```


package.json 添加字段

```json
{
  "scripts": {
    "commit": "cz"
  },
  "husky": {
    "hooks": {
      "pre-commit": "pretty-quick --staged --pattern \"**/*.*(js|jsx)\"",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
}

```

执行 `npm run commit`
