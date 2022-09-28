// 规范
export function sidebarStandard() {
  return [
    {
      text: 'Code 规范',
      collapsible: true,
      items: [
        { text: '注释规范', link: '/standard/code-comment' },
        { text: 'Code Review 规范', link: '/standard/code-review' }
      ]
    },
    {
      text: 'Git 规范',
      collapsible: true,
      items: [
        { text: '分支管理规范', link: '/standard/git' },
        { text: 'Commit 规范', link: '/standard/git-commit-msg' }
      ]
    },
    {
      text: '常用规范模板',
      collapsible: true,
      items: [
        { text: '业务项目 Readme 模板', link: '/standard/readme-template' },
        { text: 'SDK Readme 模板', link: '/standard/sdk-readme-template' },
        { text: '设计文档模板', link: '/standard/design-template' }
      ]
    }
  ]
}
