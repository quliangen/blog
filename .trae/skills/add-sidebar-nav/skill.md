# add-sidebar-nav

将新文章添加到 VitePress 侧边栏导航配置

## 使用场景

创建新文章后，需要更新侧边栏导航使其在站点中可访问时使用

## 执行步骤

1. **读取当前配置**
   - 读取 `docs/.vitepress/config.js`
   - 分析现有的 sidebar 结构

2. **确定插入位置**
   - 根据文章路径确定所属分类
   - 找到对应的 sidebar 函数（如 `sidebarProject()`）

3. **更新配置**
   - 在合适的分类下添加导航项:
     ```javascript
     { text: '文章标题', link: '/category/article-name' }
     ```
   - 保持现有格式和缩进（2 空格）
   - 保持分类内文章按逻辑排序

4. **验证修改**
   - 检查 JSON 语法正确性
   - 确认链接路径与文件路径匹配

## 分类映射

| 文章路径 | Sidebar 函数 |
|---------|-------------|
| `docs/ai/*.md` | `sidebarAi()` |
| `docs/project/*.md` | `sidebarProject()` |
| `docs/standard/*.md` | `sidebarStandard()` |
| `docs/bugfix/*.md` | `sidebarBugfix()` |
| `docs/tool/*.md` | `sidebarTool()` |
| `docs/harmony-os/*.md` | `sidebarHarmony()` |

## 示例

添加文章 `docs/project/cicd/docker-guide.md`:

```javascript
function sidebarProject() {
  return [
    {
      text: 'CI/CD',
      collapsible: true,
      items: [
        { text: '部署前端到(NG)常用指令', link: '/project/cicd/deploy' },
        { text: 'Docker 部署指南', link: '/project/cicd/docker-guide' },  // 新增
        { text: '前端增量部署', link: '/project/cicd/incremental' }
      ]
    }
  ]
}
```
