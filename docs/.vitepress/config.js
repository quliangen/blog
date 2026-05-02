import { defineConfig } from 'vitepress'
// 规范侧边栏
import { sidebarStandard } from './standard'

export default defineConfig({
  title: '曲董的研发手册',
  description: 'Vite & Vue powered static site generator.',
  base: '/blog/',
  cleanUrls: 'without-subfolders',

  markdown: {
    headers: {
      level: [0, 0]
    }
  },

  themeConfig: {
    nav: nav(),

    sidebar: {
      '/ai/': sidebarAi(),
      '/standard/': sidebarStandard(),
      '/project/': sidebarProject(),
      '/bugfix/': sidebarBugfix(),
      '/tool/': sidebarTool(),
      '/harmony-os/': sidebarHarmony(),

    },

    footer: {
      message: '根据 MIT 许可证发布',
      copyright: 'Copyright © 2023-present LiangEn Qu'
    }

  }
})

// 右上侧导航条
function nav() {
  return [
    { text: 'Ai', link: '/ai/claude-code-setup', activeMatch: '/ai/' },
    { text: '规范', link: '/standard/git', activeMatch: '/standard/' },
    { text: '工程化', link: '/project/npm/npm-starter-simple', activeMatch: '/project/' },
    { text: '爬坑指北', link: '/bugfix/install-question', activeMatch: '/bugfix/' },
    { text: '武器库', link: '/tool/vscode-hotkeys', activeMatch: '/tool/' },
    { text: 'Harmony OS', link: '/harmony-os/setup', activeMatch: '/harmony-os/' },
  ]
}

function sidebarProject() {
  return [
    {
      text: '博客项目',
      collapsible: true,
      items: [
        { text: '技术架构评估与升级计划', link: '/project/tech-upgrade-plan' }
      ]
    },
    {
      text: 'NPM 包',
      collapsible: true,
      items: [
        { text: '如何开发 NPM 包 ？', link: '/project/npm/npm-starter-simple' },
        { text: 'NPM 包管理规范', link: '/project/npm/npm-standard' },
        { text: '极简Pnpm Monorepo 单体仓库', link: '/project/npm/pnpm-monorepo' },
      ]
    },
    {
      text: 'CI/CD',
      collapsible: true,
      items: [
        { text: '部署前端到(NG)常用指令', link: '/project/cicd/deploy' },
        { text: '前端增量部署', link: '/project/cicd/incremental' },
        { text: '通过 Docker 学习 Nginx ', link: '/project/cicd/nginx-docker' },

      ]
    },
    {
      text: 'Vue',
      collapsible: true,
      items: [
        { text: '@vue/cli 升级v4并迁移pnpm方案', link: '/project/vue/vue项目升级cli到v4并迁移pnpm方案' }
      ]
    }
  ]
}

function sidebarBugfix() {
  return [
    {
      text: '爬坑指北',
      collapsible: true,
      items: [
        { text: '前端项目 install 常见问题', link: '/bugfix/install-question' },
        { text: 'Mac m1运行 xcode13 常见问题', link: '/bugfix/mac-m1-xcode13' }
        // { text: 'two', link: '/bugfix/two' },
        // { text: 'three', link: '/bugfix/two' }
      ]
    }
  ]
}

function sidebarTool() {
  return [
    {
      text: '',
      collapsible: true,
      items: [
        { text: 'VScode 常用快捷键', link: '/tool/vscode-hotkeys' }
      ]
    },
    {
      text: '我的 Github 开源',
      collapsible: true,
      items: [
        { text: '项目清单', link: '/tool/github' }
      ]
    },
    {
      text: '三方利器',
      collapsible: true,
      items: [
        { text: '实用工具库', link: '/tool/libs' }
      ]
    }
  ]
}

function sidebarHarmony() {
  return [
    {
      text: '',
      collapsible: true,
      items: [
        { text: '前端开箱-Harmony OS', link: '/harmony-os/setup' }
      ]
    },
  ]
}

function sidebarAi() {
  return [
    {
      text: '编程工具',
      collapsible: true,
      items: [
        { text: 'Claude Code 安装配置', link: '/ai/claude-code-setup' },
        { text: 'Hermes Agent 安装配置', link: '/ai/hermes-agent-setup' },
        { text: '构建现有项目 AI 基建指北', link: '/ai/existing-project-ai-setup' }
      ]
    },
    {
      text: '前端工程师，从零开始学 AI',
      collapsible: true,
      items: [
        { text: '00-导读：教程介绍与学习路线', link: '/ai/learn-ai-agent/00-introduction' },
        { text: '01-什么是 AI Agent？', link: '/ai/learn-ai-agent/01-what-is-agent' },
        { text: '02-Agent 架构解剖与框架选型', link: '/ai/learn-ai-agent/02-Agent-架构解剖与框架选型' },
        { text: '03-Python 快速入门', link: '/ai/learn-ai-agent/03-Python 快速入门（前端工程师版）' },
        { text: '04-Hello Agent', link: '/ai/learn-ai-agent/04-Hello Agent：你的第一个智能助手' },
        { text: '05-工具开发', link: '/ai/learn-ai-agent/05-给-Agent-装上「手脚」：工具开发' },
        { text: '06-记忆系统', link: '/ai/learn-ai-agent/06-Agent 的记忆系统' },
        { text: '07-RAG 系统（上）', link: '/ai/learn-ai-agent/07-RAG-系统（上）：文档加载与切分' },
        { text: '08-RAG 系统（下）', link: '/ai/learn-ai-agent/08-RAG 系统（下）：检索与生成' },
        { text: '09-MCP 协议', link: '/ai/learn-ai-agent/09-MCP-协议与工具生态' },
        { text: '10-多 Agent 协作', link: '/ai/learn-ai-agent/10-多 Agent 协作与工作流编排' },
        { text: '11-Agent 服务化', link: '/ai/learn-ai-agent/11-agent-api' },
        { text: '12-React 接入实战', link: '/ai/learn-ai-agent/12-react-integration' },
        { text: '13-Vue 接入实战', link: '/ai/learn-ai-agent/13-vue-integration' },
        { text: '14-实时协作应用', link: '/ai/learn-ai-agent/14-realtime-collab' },
        { text: '15-浏览器自动化', link: '/ai/learn-ai-agent/15-browser-automation' },
        { text: '16-多模态 Agent', link: '/ai/learn-ai-agent/16-multimodal' },
        { text: '17-RAG 进阶优化', link: '/ai/learn-ai-agent/17-rag-advanced' },
        { text: '18-性能优化', link: '/ai/learn-ai-agent/18-performance' },
        { text: '19-安全与成本', link: '/ai/learn-ai-agent/19-security' },
        { text: '20-模型管理', link: '/ai/learn-ai-agent/20-model-management' },
        { text: '21-可观测性', link: '/ai/learn-ai-agent/21-observability' },
        { text: '22-容器化部署', link: '/ai/learn-ai-agent/22-deployment' },
        { text: '23-项目：智能客服', link: '/ai/learn-ai-agent/23-project-customer-service' },
        { text: '24-项目：AI 编程助手', link: '/ai/learn-ai-agent/24-project-code-assistant' },
        { text: '25-项目：私有化部署', link: '/ai/learn-ai-agent/25-project-private-deployment' }
      ]
    }
  ]
}
