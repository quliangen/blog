# VitePress 文档写作规则

description: 适用于 VitePress 文档站点的 Markdown 文件写作规范
globs: ["docs/**/*.md"]
alwaysApply: false
---

## Frontmatter 规范

每篇文档必须包含以下 frontmatter：

```yaml
---
title: 文章标题
description: 文章简短描述（用于 SEO 和预览）
---
```

可选字段：
- `outline`: 目录显示级别（如 `outline: [2, 3]`）

## 文档结构

### 标题层级

- 使用 `#` 作为页面主标题（每个文件一个）
- 使用 `##` 作为章节标题
- 使用 `###` 作为小节标题
- 标题前后保留空行

### 文件命名

- 使用短横线连接的小写命名（kebab-case）
- 中文文章可使用拼音或英文命名
- 示例: `git-commit-msg.md`, `existing-project-ai-setup.md`

### 目录组织

- 按主题分类存放（`ai/`, `project/`, `standard/` 等）
- 相关图片存放在同级 `images/` 目录
- 配置文件存放在 `docs/.vitepress/` 目录

## 内容规范

### 链接格式

- 内部链接使用相对路径: `[链接文本](../other/file.md)`
- 外部链接使用完整 URL: `[链接文本](https://example.com)`
- 锚点链接使用 `#`: `[跳转到标题](#标题名)`

### 代码块

- 必须指定语言: ```js, ```ts, ```shell, ```yaml
- 行内代码使用单个反引号: `code`

### 图片

- 使用相对路径引用同级 images 目录: `./images/screenshot.png`
- 添加 alt 文本: `![描述文本](./images/file.png)`

### 表格

- 表头使用 `|` 分隔
- 对齐分隔行使用 `|------|`
- 示例:

```markdown
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 名称 |
```

## 侧边栏配置

新增分类或文章时，需要更新 `docs/.vitepress/config.js`：

1. 找到对应的 sidebar 函数（如 `sidebarProject()`）
2. 在合适位置添加 `{ text: '显示文本', link: '/path/to/file' }`
3. 保持分类结构清晰，使用 `collapsible: true` 控制折叠

## 中文写作规范

- 中文与英文/数字之间保留空格
- 使用全角标点符号
- 技术术语可保留英文（如 VitePress、Markdown）
