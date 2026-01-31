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
        { text: 'Claude Code 安装配置', link: '/ai/claude-code-setup' }
      ]
    }
  ]
}
