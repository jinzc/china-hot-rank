# Gitee Pages 部署说明

## 方案 A：手动部署

1. 在 Gitee 新建仓库
2. 上传本项目所有文件
3. 本地执行：

```bash
npm install
npm run update
```

4. 把 `public` 目录提交到 Gitee
5. 在 Gitee Pages 中选择 `public` 目录作为静态页面目录

## 方案 B：GitHub 自动更新，Gitee 展示

推荐用 GitHub Actions 负责定时抓取和生成静态文件，再把结果同步到 Gitee。

你可以在 `.github/workflows/update.yml` 的最后增加同步步骤，例如使用 SSH 推送到 Gitee。

需要设置 GitHub Secrets：

```txt
GITEE_REPO=git@gitee.com:你的用户名/你的仓库.git
GITEE_SSH_KEY=你的私钥
```

然后增加类似步骤：

```yaml
- name: Push to Gitee
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.GITEE_SSH_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan gitee.com >> ~/.ssh/known_hosts
    git remote add gitee ${{ secrets.GITEE_REPO }} || true
    git push gitee HEAD:master --force
```

注意：不同 Gitee 仓库默认分支可能是 `master` 或 `main`，按你的仓库调整。
