# Vue 与 JavaScript 代码规则

description: 适用于 Vue 单文件组件和 JavaScript/TypeScript 代码的规范
globs: ["docs/.vitepress/**/*.js", "docs/.vitepress/**/*.ts", "**/*.vue"]
alwaysApply: false
---

## JavaScript 规范

### 模块导入

- 使用 ES Module 语法 (`import`/`export`)
- 外部库导入在前，内部模块导入在后
- 按导入路径长度排序（短的在前）

```javascript
// Good
import { defineConfig } from 'vitepress'
import { sidebarStandard } from './standard'
```

### 函数定义

- 优先使用函数声明而非函数表达式
- 箭头函数用于回调和简单函数
- 函数名使用驼峰命名

```javascript
// Good
function nav() {
  return [...]
}

// Good for callbacks
const items = list.map(item => item.name)
```

### 对象与数组

- 对象属性简短时可单行，复杂时多行
- 数组元素多时每个元素一行
- 不使用尾随逗号

```javascript
// Good - 简单对象
const config = { title: '标题', base: '/blog/' }

// Good - 复杂对象
const sidebar = {
  '/path/': [
    { text: 'Item 1', link: '/path/1' },
    { text: 'Item 2', link: '/path/2' }
  ]
}
```

## Vue 组件规范

### 组件结构

单文件组件按以下顺序组织：

```vue
<script setup>
// 组合式 API 代码
</script>

<template>
<!-- 模板 -->
</template>

<style scoped>
/* 样式 */
</style>
```

### 组件命名

- 文件名使用大驼峰（PascalCase）或短横线（kebab-case）
- 组件名应具有描述性
- 示例: `SidebarNav.vue` 或 `sidebar-nav.vue`

### Props 定义

- 使用类型定义
- 提供默认值
- 添加必要注释

```javascript
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})
```

## VitePress 配置规范

### 配置文件结构

`docs/.vitepress/config.js` 结构：

```javascript
import { defineConfig } from 'vitepress'

export default defineConfig({
  // 基础配置
  title: '站点标题',
  description: '站点描述',
  base: '/blog/',
  
  // Markdown 配置
  markdown: { ... },
  
  // 主题配置
  themeConfig: {
    nav: nav(),
    sidebar: { ... },
    footer: { ... }
  }
})

// 辅助函数定义在底部
function nav() { ... }
function sidebarXxx() { ... }
```

### 导航配置

- `nav()` 函数返回顶部导航
- `activeMatch` 用于高亮当前导航
- 保持导航顺序与侧边栏分类一致

### 侧边栏配置

- 每个分类使用独立的 sidebar 函数
- 使用 `collapsible: true` 启用折叠
- `text` 使用简洁的描述性文字

```javascript
function sidebarCategory() {
  return [
    {
      text: '分类名称',
      collapsible: true,
      items: [
        { text: '文章标题', link: '/category/article' }
      ]
    }
  ]
}
```

## 注释规范

- 使用 `//` 进行单行注释
- 注释位于代码上方，而非行尾
- 复杂逻辑添加说明性注释

```javascript
// 加载规范侧边栏配置
import { sidebarStandard } from './standard'

// 定义站点导航
function nav() {
  return [...]
}
```
