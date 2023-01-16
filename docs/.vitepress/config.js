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
      '/standard/': sidebarStandard(),
      '/project/': sidebarProject(),
      '/bugfix/': sidebarBugfix(),
      '/tool/': sidebarTool()
    },

    footer: {
      message: '根据 MIT 许可证发布',
      copyright: 'Copyright © 2022-present LiangEn Qu'
    }

  }
})

// 右上侧导航条
function nav() {
  return [
    { text: '规范', link: '/standard/git', activeMatch: '/standard/' },
    { text: '工程化', link: '/project/npm/npm-starter-simple', activeMatch: '/project/' },
    { text: '爬坑指北', link: '/bugfix/install-question', activeMatch: '/bugfix/' },
    { text: '武器库', link: '/tool/vscode-hotkeys', activeMatch: '/tool/' },

  ]
}

function sidebarProject() {
  return [
    {
      text: 'NPM 包',
      collapsible: true,
      items: [
        { text: '如何开发 NPM 包 ？', link: '/project/npm/npm-starter-simple' },
        { text: 'NPM 包管理规范', link: '/project/npm/npm-standard' }
      ]
    },
    {
      text: 'CI/CD',
      collapsible: true,
      items: [
        { text: '部署前端到(NG)常用指令', link: '/project/cicd/deploy' },
        { text: '前端增量部署', link: '/project/cicd/incremental' },
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
        { text: '前端项目 install 常见问题', link: '/bugfix/install-question' }
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
