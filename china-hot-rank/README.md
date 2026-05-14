# 中国国内实时热点榜单

一个可直接部署到 GitHub Pages / Gitee Pages 的静态热点榜单项目。

支持：

- 微博、抖音、百度、B站、知乎等平台热榜
- 综合榜、平台榜、分类榜
- 综合热度统一排序
- 每条数据标注更新时间
- GitHub Actions 自动定时更新
- 微信/社交平台分享用 Open Graph 信息和分享图

## 1. 快速使用

### 上传到 GitHub

1. 新建 GitHub 仓库，例如 `china-hot-rank`
2. 把本项目所有文件上传到仓库根目录
3. 进入仓库 `Settings` → `Pages`
4. Source 选择 `GitHub Actions`
5. 进入 `Actions`，手动运行一次 `Update hot rank data and deploy`
6. 之后会自动定时更新

### 本地运行

```bash
npm install
npm run update
npm run serve
```

浏览器打开：

```txt
http://localhost:8080
```

## 2. 数据源配置

默认使用 DailyHotApi 公共示例地址：

```txt
https://api-hot.imsyy.top
```

建议长期使用时自己部署 DailyHotApi，然后在 GitHub 仓库设置 Secret：

```txt
HOT_API_BASE=https://你的接口域名
```

如果接口临时不可用，项目会自动生成兜底示例数据，保证页面不空白。

## 3. 更新规则

- 北京时间 07:00 - 23:00：每小时更新
- 北京时间 23:00 - 次日 06:00：合并为夜间更新
- 每次更新会写入：
  - `public/data/latest.json`
  - `public/data/history/YYYY-MM-DD/HH.json`

GitHub Actions 使用 UTC cron，当前配置覆盖北京时间 7-23 点对应的 UTC 时间。

## 4. 综合热度算法

不同平台的热度口径不统一，所以做三步处理：

1. 平台内排名分：排名越靠前分数越高
2. 平台热度归一分：把各平台 raw hot 值归一到 0-100
3. 跨平台合并加成：同一热点出现在多个平台时加权提升

公式简化版：

```txt
综合热度 = 平台内排名分 × 平台权重 + 热度归一分 × 0.4 + 跨平台加成 - 时间衰减
```

平台权重在 `scripts/config.js` 中修改。

## 5. Gitee Pages 部署

Gitee Pages 通常可以直接选择仓库根目录或 `public` 目录作为静态页面目录。

推荐做法：

1. 把同一份代码推送到 Gitee
2. 在 Gitee Pages 中选择 `public` 目录
3. 访问 Gitee Pages 地址
4. 如需自动同步，可以在 GitHub Actions 里增加推送到 Gitee 的步骤

## 6. 微信分享优化

页面内已包含：

```html
<meta property="og:title">
<meta property="og:description">
<meta property="og:image">
```

每次更新会生成：

```txt
public/share.png
```

用于微信、企业微信、飞书等社交平台预览。

更好的分享体验建议绑定自己的域名，例如：

```txt
https://hot.yourdomain.com
```

然后把 `public/CNAME` 改成你的域名。
