import{_ as s,c as a,o as n,a as e}from"./app.e23272e0.js";const u=JSON.parse('{"title":"\u9879\u76EE\u540D\uFF08Project Name\uFF09","description":"","frontmatter":{},"headers":[],"relativePath":"standard/readme-template.md"}'),l={name:"standard/readme-template.md"},p=e(`<h1 id="\u9879\u76EE\u540D\uFF08project-name\uFF09" tabindex="-1">\u9879\u76EE\u540D\uFF08Project Name\uFF09 <a class="header-anchor" href="#\u9879\u76EE\u540D\uFF08project-name\uFF09" aria-hidden="true">#</a></h1><blockquote><p>\u9879\u76EE\u63CF\u8FF0\uFF08Project Description\uFF09</p></blockquote><h2 id="\u5173\u4E8E\u9879\u76EE\uFF08about-this-project\uFF09" tabindex="-1">\u5173\u4E8E\u9879\u76EE\uFF08About This Project\uFF09 <a class="header-anchor" href="#\u5173\u4E8E\u9879\u76EE\uFF08about-this-project\uFF09" aria-hidden="true">#</a></h2><p>\u82E5\u6709\u9700\u8981\uFF0C\u9879\u76EE\u8BE6\u7EC6\u63CF\u8FF0\u53EF\u5355\u72EC\u7F57\u5217</p><h3 id="\u6280\u672F\u6808\uFF08built-with\uFF09" tabindex="-1">\u6280\u672F\u6808\uFF08Built With\uFF09 <a class="header-anchor" href="#\u6280\u672F\u6808\uFF08built-with\uFF09" aria-hidden="true">#</a></h3><p>\u793A\u4F8B\uFF1AVue 3 Setup + TS + Vite</p><h2 id="\u5F00\u59CB\uFF08getting-started\uFF09" tabindex="-1">\u5F00\u59CB\uFF08Getting Started\uFF09 <a class="header-anchor" href="#\u5F00\u59CB\uFF08getting-started\uFF09" aria-hidden="true">#</a></h2><p>\u8BF4\u660E\u53EF\u4EE5\u5728\u672C\u5730\u8BBE\u7F6E\u9879\u76EE\u7684\u8981\u6C42\u3002\u8981\u4F7F\u672C\u5730\u9879\u76EE\u542F\u52A8\u548C\u8FD0\u884C\uFF0C\u8BF7\u6309\u7167\u8FD9\u4E9B\u7B80\u5355\u7684\u4F8B\u5B50\u6B65\u9AA4\u3002</p><h3 id="\u6761\u4EF6\uFF08prerequisites\uFF09" tabindex="-1">\u6761\u4EF6\uFF08Prerequisites\uFF09 <a class="header-anchor" href="#\u6761\u4EF6\uFF08prerequisites\uFF09" aria-hidden="true">#</a></h3><p>\u5217\u51FA\u5F53\u524D\u9879\u76EE\u6240\u4F9D\u8D56\u7684\u8F6F\u4EF6\u3001\u73AF\u5883\u4EE5\u53CA\u5982\u4F55\u5B89\u88C5\u5B83\u4EEC</p><ul><li>Node.js &gt;= 14.17.0</li><li>\u5305\u7BA1\u7406\u5DE5\u5177\uFF1A<a href="https://pnpm.io/" target="_blank" rel="noreferrer">pnpm</a></li></ul><h3 id="\u5B89\u88C5\uFF08installation\uFF09" tabindex="-1">\u5B89\u88C5\uFF08Installation\uFF09 <a class="header-anchor" href="#\u5B89\u88C5\uFF08installation\uFF09" aria-hidden="true">#</a></h3><p>\u8BF4\u660E\u6307\u5BFC\u7528\u6237\u5982\u4F55\u5B89\u88C5\u4EE5\u53CA\u914D\u7F6E\u9879\u76EE\u3002</p><ol><li><p>Clone the repo</p><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#A6ACCD;">git clone xxx/xxx.git</span></span>
<span class="line"></span></code></pre></div></li><li><p>\u5B89\u88C5\u4F9D\u8D56</p><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#A6ACCD;">pnpm install</span></span>
<span class="line"></span></code></pre></div></li><li><p>\u672C\u5730\u5F00\u53D1</p><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#A6ACCD;">pnpm dev</span></span>
<span class="line"></span></code></pre></div></li></ol><h3 id="\u9879\u76EE\u76EE\u5F55\u8BF4\u660E\uFF08structure\uFF09" tabindex="-1">\u9879\u76EE\u76EE\u5F55\u8BF4\u660E\uFF08Structure\uFF09 <a class="header-anchor" href="#\u9879\u76EE\u76EE\u5F55\u8BF4\u660E\uFF08structure\uFF09" aria-hidden="true">#</a></h3><p>\u5DE5\u7A0B\u9879\u76EE\u7684\u6587\u4EF6\u5939\u7ED3\u6784\u9009\u9879\u548C\u547D\u540D\u7EA6\u5B9A</p><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#82AAFF;">.</span></span>
<span class="line"><span style="color:#A6ACCD;">\u251C\u2500\u2500 ...</span></span>
<span class="line"><span style="color:#A6ACCD;">\u251C\u2500\u2500 src</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u251C\u2500\u2500 main.ts </span><span style="color:#676E95;"># \u516C\u5171\u6587\u4EF6\uFF0C\u88AB\u6240\u6709\u5E94\u7528\u9875\u9762\u6240\u4F9D\u8D56</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u251C\u2500\u2500 pages</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502   \u2514\u2500\u2500 driver </span><span style="color:#676E95;"># driver \u5E94\u7528(http://localhost:8080/driver)</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u251C\u2500\u2500 App.vue </span><span style="color:#676E95;"># driver \u6839\u9875\u9762</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u251C\u2500\u2500 assets </span><span style="color:#676E95;"># \u9875\u9762\u8D44\u6E90\uFF08\u56FE\u7247\u7B49\uFF09</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u251C\u2500\u2500 components </span><span style="color:#676E95;"># \u7EC4\u4EF6</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2502   \u251C\u2500\u2500 About.vue</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2502   \u251C\u2500\u2500 HelloWorld.vue</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2502   \u251C\u2500\u2500 Home.vue</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2502   \u2514\u2500\u2500 ModuleAPageB.vue</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u251C\u2500\u2500 index.ts </span><span style="color:#676E95;"># driver \u6839\u5165\u53E3\u6587\u4EF6</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u251C\u2500\u2500 router </span><span style="color:#676E95;"># \u8DEF\u7531</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2502   \u2514\u2500\u2500 index.ts</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u251C\u2500\u2500 store </span><span style="color:#676E95;"># \u72B6\u6001\u7BA1\u7406</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2502   \u2514\u2500\u2500 index.ts</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502       \u2514\u2500\u2500 views </span><span style="color:#676E95;"># driver \u9875\u9762</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502           \u251C\u2500\u2500 ModuleA.vue </span><span style="color:#676E95;"># http://localhost:8080/driver/module-a</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502           \u2514\u2500\u2500 ModuleB.vue </span><span style="color:#676E95;"># http://localhost:8080/driver/module-b</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u251C\u2500\u2500 shims-vue.d.ts</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u251C\u2500\u2500 styles </span><span style="color:#676E95;"># \u516C\u5171\u6837\u5F0F\u6587\u4EF6</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502   \u251C\u2500\u2500 index.less</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502   \u251C\u2500\u2500 reset.less</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2502   \u2514\u2500\u2500 variable.less</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502   \u2514\u2500\u2500 utils </span><span style="color:#676E95;"># \u5DE5\u5177\u5E93</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502       \u2514\u2500\u2500 index.ts</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2502       \u2514\u2500\u2500 sentry.ts</span></span>
<span class="line"><span style="color:#A6ACCD;">\u251C\u2500\u2500 docker.yaml </span><span style="color:#676E95;"># docker\u5316\u90E8\u7F72\u76F8\u5173\u914D\u7F6E</span></span>
<span class="line"><span style="color:#A6ACCD;">\u251C\u2500\u2500 index.html </span><span style="color:#676E95;"># \u6A21\u7248html</span></span>
<span class="line"><span style="color:#A6ACCD;">\u251C\u2500\u2500 tsconfig.json</span></span>
<span class="line"><span style="color:#A6ACCD;">\u251C\u2500\u2500 vue.config.js</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2514\u2500\u2500 pnpm-lock.yaml </span><span style="color:#676E95;"># pnpm \u63D0\u4F9B\u7684\u4F9D\u8D56\u7248\u672C\u9501\u5B9A\u6587\u4EF6\uFF0C\u89E3\u51B3\u4F9D\u8D56\u7248\u672C\u4E0D\u4E00\u81F4\u7684\u95EE\u9898</span></span>
<span class="line"></span></code></pre></div><h3 id="\u6784\u5EFA\u90E8\u7F72\u3001\u8D26\u53F7\u4FE1\u606F" tabindex="-1">\u6784\u5EFA\u90E8\u7F72\u3001\u8D26\u53F7\u4FE1\u606F <a class="header-anchor" href="#\u6784\u5EFA\u90E8\u7F72\u3001\u8D26\u53F7\u4FE1\u606F" aria-hidden="true">#</a></h3><ul><li><strong>\u767B\u5F55\u8D26\u53F7</strong></li></ul><blockquote><p>\u4F7F\u7528\u516C\u5171\u8D26\u53F7\u767B\u5F55 admin:test\u3002</p></blockquote><ul><li><strong>\u8D44\u6E90\u73AF\u5883\u4FE1\u606F</strong></li></ul><table><thead><tr><th>\u540E\u53F0url</th><th>\u524D\u7AEF\u8BBF\u95EEurl</th><th>Jenkins</th><th>\u4EE3\u7801\u5206\u652F</th></tr></thead><tbody><tr><td><a href="http://api.dev.xxx.com" target="_blank" rel="noreferrer">api.dev.xxx.com</a></td><td><a href="http://dev.xxx.com" target="_blank" rel="noreferrer">dev.xxx.com</a></td><td>xxx/job/xxx/</td><td>dev</td></tr><tr><td><a href="http://api.test.xxx.com" target="_blank" rel="noreferrer">api.test.xxx.com</a></td><td><a href="http://test.xxx.com" target="_blank" rel="noreferrer">test.xxx.com</a></td><td>xxx/job/xxx/</td><td>test</td></tr></tbody></table>`,22),t=[p];function o(r,c,i,d,h,A){return n(),a("div",null,t)}const y=s(l,[["render",o]]);export{u as __pageData,y as default};