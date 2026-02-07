# create-blog-post

创建新的博客文章，自动生成 frontmatter 并保存到正确目录

## 使用场景

当需要撰写新的技术文章时，使用此 Skill 创建符合项目规范的 Markdown 文件

## 执行步骤

1. **确认文章信息**
   - 询问用户文章标题
   - 询问文章所属分类（ai/project/standard/bugfix/tool/harmony-os）
   - 询问文章描述/摘要

2. **生成文件名**
   - 将标题转换为短横线连接的 kebab-case 格式
   - 示例: "构建项目 AI 基建" → `build-project-ai-infrastructure.md`

3. **创建文章文件**
   - 在 `docs/{category}/` 目录下创建文件
   - 添加标准 frontmatter:
     ```yaml
     ---
     title: 文章标题
     description: 文章描述
     ---
     ```
   - 添加一级标题和基础结构

4. **提示后续操作**
   - 告知用户文件创建位置
   - 提醒如需添加侧边栏导航，使用 `add-sidebar-nav` Skill

## 示例

用户: "我想写一篇关于 Docker 部署的文章"

AI 执行:
1. 询问分类 → project/cicd
2. 生成文件名 → `docker-deployment-guide.md`
3. 创建文件于 `docs/project/cicd/docker-deployment-guide.md`
4. 内容包含 frontmatter 和基础结构
