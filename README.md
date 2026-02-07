# 曲董的研发手册

> 基于 VitePress 构建的个人技术博客，记录前端工程化、AI 工具、开发规范等技术沉淀。

## 关于项目

本项目是一个静态文档站点，用于整理和分享前端开发相关的技术文章、最佳实践和踩坑记录。内容涵盖：

- **AI 编程工具**: Claude Code、Cursor、Trae 等 AI 辅助编程工具的使用指南
- **开发规范**: Git 规范、代码审查、README 模板等团队协作标准
- **工程化实践**: NPM 包开发、CI/CD 部署、Vue 项目升级等
- **爬坑指北**: 前端项目常见问题及解决方案

### 技术栈

- [VitePress](https://vitepress.dev/) - 基于 Vite 的静态站点生成器
- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) - 高效的包管理器

## 开始

### 环境要求

- Node.js >= 20
- pnpm >= 8

### 安装

1. 克隆仓库

   ```shell
   git clone https://github.com/your-username/blog.git
   cd blog
   ```

2. 安装依赖

   ```shell
   pnpm install
   ```

3. 本地开发

   ```shell
   pnpm dev
   ```

   访问 http://localhost:5173/blog/ 预览

### 构建

```shell
pnpm build
```

构建输出位于 `docs/.vitepress/dist/` 目录。

### 预览生产构建

```shell
pnpm serve
```

## 项目目录结构

```
.
├── docs/                       # 文档内容目录
│   ├── .vitepress/            # VitePress 配置
│   │   ├── config.js          # 站点配置文件
│   │   └── standard.js        # 规范侧边栏配置
│   ├── ai/                    # AI 工具相关文章
│   ├── bugfix/                # 问题排查与解决方案
│   ├── harmony-os/            # 鸿蒙开发相关
│   ├── project/               # 工程化实践
│   │   ├── cicd/              # CI/CD 部署
│   │   ├── npm/               # NPM 包开发
│   │   └── vue/               # Vue 项目相关
│   ├── standard/              # 开发规范
│   ├── tool/                  # 开发工具
│   └── index.md               # 首页
├── .github/                   # GitHub 配置
│   └── workflows/             # GitHub Actions
├── README.md                  # 项目说明
├── package.json               # 项目依赖
├── pnpm-lock.yaml             # 锁定文件
├── .prettierrc                # Prettier 配置
├── .editorconfig              # EditorConfig 配置
└── deploy.sh                  # 部署脚本
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产站点 |
| `pnpm serve` | 预览生产构建 |

## 写作规范

### 创建新文章

1. 根据文章主题选择对应分类目录（`ai/`, `project/`, `standard/` 等）
2. 创建 Markdown 文件，使用短横线命名（如 `my-article.md`）
3. 添加必要的 frontmatter：

   ```yaml
   ---
   title: 文章标题
   description: 文章描述
   ---
   ```

4. 如需添加侧边栏导航，更新 `docs/.vitepress/config.js`

### 代码风格

- 使用 2 个空格缩进
- 单行宽度 80 字符
- 不使用分号
- 使用单引号
- Markdown 文件保留行尾空格

## 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages：

- 推送代码到 `main` 分支触发自动构建
- 部署配置位于 `.github/workflows/deploy.yml`

## 许可证

[MIT](LICENSE)

Copyright © 2026-present LiangEn Qu
