# 自定义说明

## 修改平台

编辑：

```txt
scripts/config.js
```

例如增加今日头条：

```js
{ key: 'toutiao', name: '今日头条', weight: 1.0, categoryHint: '综合' }
```

前提是你的 API 数据源支持 `/toutiao` 路由。

## 修改分类规则

编辑 `CATEGORY_RULES`：

```js
{ category: '科技', words: ['AI', '人工智能', '大模型'] }
```

## 修改综合热度权重

编辑 `PLATFORMS` 里的 `weight`：

```js
{ key: 'weibo', name: '微博', weight: 1.2 }
```

## 修改页面样式

编辑：

```txt
public/assets/style.css
```

## 修改分享卡片

编辑：

```txt
scripts/update.js
```

搜索 `generateShareImage` 函数。
