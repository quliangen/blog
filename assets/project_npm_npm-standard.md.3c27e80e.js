import{_ as s,c as a,o as n,a as p}from"./app.e23272e0.js";const A=JSON.parse('{"title":"NPM \u5305","description":"","frontmatter":{},"headers":[],"relativePath":"project/npm/npm-standard.md"}'),l={name:"project/npm/npm-standard.md"},o=p(`<h1 id="npm-\u5305" tabindex="-1">NPM \u5305 <a class="header-anchor" href="#npm-\u5305" aria-hidden="true">#</a></h1><h2 id="git-tag-\u89C4\u8303" tabindex="-1">Git Tag \u89C4\u8303 <a class="header-anchor" href="#git-tag-\u89C4\u8303" aria-hidden="true">#</a></h2><p>Tag \u9700\u9075\u5FAA <a href="https://semver.org/lang/zh-CN/" target="_blank" rel="noreferrer">\u8BED\u4E49\u5316\u7248\u672C semver</a> \u89C4\u8303</p><p>\u547D\u540D\u89C4\u5219\uFF1A<strong>[\u7C7B\u578B][release\u7248\u672C]-[stages\u7248\u672C]</strong></p><p>\u4F8B\u5982\uFF1A</p><div class="language-js"><button class="copy"></button><span class="lang">js</span><pre><code><span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.1</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">rc</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">3</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">rc</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">2</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">rc</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">1</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">2.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">beta</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">3</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">2.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">beta</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">2</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">beta</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">1</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">alpha</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">2</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">alpha</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">1</span></span>
<span class="line"><span style="color:#A6ACCD;">v3</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0.0</span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;">alpha</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">0</span></span>
<span class="line"><span style="color:#A6ACCD;">v2</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">7.8</span></span>
<span class="line"></span></code></pre></div><h2 id="npm-\u5305\u7248\u672C\u7BA1\u7406" tabindex="-1">NPM \u5305\u7248\u672C\u7BA1\u7406 <a class="header-anchor" href="#npm-\u5305\u7248\u672C\u7BA1\u7406" aria-hidden="true">#</a></h2><p>\u63A8\u8350\u4F7F\u7528 <a href="https://www.npmjs.com/package/standard-version" target="_blank" rel="noreferrer">standard-version</a> \u8FDB\u884C\u7BA1\u7406\uFF0C\u5C06\u4F1A\u81EA\u52A8\u8FDB\u884C\u4EE5\u4E0B\u6B65\u9AA4\uFF1A</p><ul><li>\u4FEE\u6539 <code>package.json</code> \u4E2D\u7684 <code>version</code></li><li>\u751F\u6210 <code>CHANGELOG.md</code> \u6587\u4EF6</li><li>\u751F\u6210 Git Commit</li><li>\u6253 Git Tag</li></ul><div class="language-json"><button class="copy"></button><span class="lang">json</span><pre><code><span class="line"><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C792EA;">scripts</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">release</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">standard-version</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">postrelease</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">git push --follow-tags</span><span style="color:#89DDFF;">&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span>
<span class="line"></span></code></pre></div><p>\u6CE8\u610F\uFF1A\u82E5\u4F7F\u7528 pnpm \u5219\u9700\u8981\u5728 <code>.npmrc</code> \u4E0A\u65B0\u589E\u4E00\u4E2A\u914D\u7F6E\uFF08\u56E0\u4E3A pnpm \u9ED8\u8BA4\u4E0D\u81EA\u52A8\u6267\u884C <code>pre</code>\u3001<code>post</code> \u7B49 hook\uFF09</p><div class="language-yaml"><button class="copy"></button><span class="lang">yaml</span><pre><code><span class="line"><span style="color:#C3E88D;">enable-pre-post-scripts=true</span></span>
<span class="line"></span></code></pre></div><p><strong>\u76F8\u5173\u547D\u4EE4</strong></p><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#A6ACCD;">pnpm run release</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u4EE5\u4E0B\u793A\u4F8B\u5747\u57FA\u4E8E 1.0.0 \u7248\u672C\u64CD\u4F5C</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u53D1\u5E03\u9884\u53D1\u5E03\u7248\u672C\uFF1A1.0.1-0</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm run release -- --prerelease</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u53D1\u5E03alpha\u7248\u672C\uFF1A1.0.1-alpha.0</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm run release -- --prerelease alpha</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u6307\u5B9A\u7248\u672C\uFF1A</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm run release -- --release-as 1.1.0</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u81EA\u52A8\u5347\u7EA7\u7248\u672C\uFF1Amajor, minor \u6216 patch</span></span>
<span class="line"><span style="color:#676E95;"># \u4E3B\u7248\u672C\uFF1A2.0.0</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm run release -- --release-as major</span></span>
<span class="line"><span style="color:#676E95;"># \u6B21\u7248\u672C\uFF1A1.1.0</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm run release -- --release-as minor</span></span>
<span class="line"><span style="color:#676E95;"># \u8865\u4E01\u7248\u672C\uFF1A1.0.1</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm run release -- --release-as patch</span></span>
<span class="line"></span></code></pre></div>`,14),e=[o];function c(r,t,D,y,C,F){return n(),a("div",null,e)}const d=s(l,[["render",c]]);export{A as __pageData,d as default};
