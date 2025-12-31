# iquest-home

官网主页

## 部署到 GitHub Pages（gh-pages 分支）

本项目构建产物在 `dist/`，并已内置适配 Pages 的配置（资源使用相对路径、路由使用 HashRouter）。

### 1）本地构建并发布到 gh-pages 分支

```bash
cd /Users/ycai/project/iquest-home
npm run build
npm run deploy
```

其中 `npm run deploy` 会把 `dist/` 发布到仓库的 `gh-pages` 分支。

### 2）在 GitHub 仓库里设置 Pages 来源

进入仓库页面：

- Settings → Pages
- Build and deployment → Source 选择 **Deploy from a branch**
- Branch 选择 **`gh-pages`**，目录选择 **`/ (root)`**，保存

稍等片刻即可通过 Pages 地址访问。
