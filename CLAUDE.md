# Claude Code 项目配置

## 技术栈

VitePress + Node.js >= 20 + pnpm

## 代码风格（必须遵守）

- 2 空格缩进，无分号，单引号，80字符行宽
- 文件命名：kebab-case
- 变量命名：camelCase
- 常量命名：UPPER_SNAKE_CASE

## 文档规范（必须遵守）

- 所有 .md 文件必须包含 frontmatter：
  ```yaml
  ---
  title: 标题
  description: 描述
  ---
  ```
- 文件放 docs/{ai,project,standard,bugfix,tool,harmony-os}/ 目录
- 创建后需更新 docs/.vitepress/config.js 侧边栏

## 常用命令

```bash
pnpm dev    # 开发
pnpm build  # 构建
pnpm serve  # 预览
```

## 工作流

1. 创建文章 → 2. 更新侧边栏 → 3. 提交推送触发部署

## 提交规范

- `docs:` - 新增或修改文档
- `fix:` - 修复错误
- `chore:` - 构建/配置变更
