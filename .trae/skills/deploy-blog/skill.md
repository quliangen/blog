# deploy-blog

构建并部署博客站点

## 使用场景

文章撰写完成，需要将最新内容部署到线上环境时使用

## 执行步骤

1. **前置检查**
   - 确认当前工作目录干净（无未提交更改）
   - 确认在正确的分支（main）

2. **本地构建验证**
   - 执行 `pnpm build` 进行生产构建
   - 检查构建输出是否成功
   - 如有构建错误，优先修复

3. **提交更改**
   - 添加所有变更: `git add .`
   - 提交并附带描述性消息: `git commit -m "docs: 添加 xxx 文章"`

4. **推送触发部署**
   - 推送到远程仓库: `git push origin main`
   - 告知用户 GitHub Actions 将自动执行部署

5. **部署验证**
   - 提供 GitHub Actions 运行链接
   - 部署完成后提供访问地址

## 提交消息规范

使用以下前缀:
- `docs:` - 新增或修改文档
- `fix:` - 修复错误
- `chore:` - 构建/配置变更

示例:
```
docs: 添加 Docker 部署指南文章
fix: 修复侧边栏链接错误
chore: 更新 VitePress 配置
```

## 部署流程说明

项目使用 GitHub Actions 自动部署:

1. 代码推送到 `main` 分支
2. GitHub Actions 触发构建工作流 (`.github/workflows/deploy.yml`)
3. 执行 `pnpm build` 生成静态文件
4. 部署到 GitHub Pages
5. 访问地址: https://your-username.github.io/blog/
