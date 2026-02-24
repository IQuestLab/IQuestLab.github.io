# iquest-home

官网主页

## 部署到 GitHub Pages（gh-pages 分支）

本项目构建产物在 `dist/`，并已内置适配 Pages 的配置（资源使用相对路径、路由使用 HashRouter）。

### 1）推送代码后自动构建并发布（推荐）

已新增 GitHub Actions 工作流：当代码 push 到 `main` 分支后，会自动执行构建并将 `dist/` 发布到 `gh-pages` 分支。
工作流文件：`.github/workflows/deploy-gh-pages.yml`

### 2）在 GitHub 仓库里设置 Pages 来源（首次配置）

- Settings → Pages
- Build and deployment → Source 选择 **Deploy from a branch**
- Branch 选择 **`gh-pages`**，目录选择 **`/ (root)`**，保存

稍等片刻即可通过 Pages 地址访问。

### 3）手动发布（可选备用）

```bash
npm run build
npm run deploy
```
