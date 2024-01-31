import{_ as s,c as n,o as a,a as p}from"./app.e23272e0.js";const u=JSON.parse('{"title":"\u6781\u7B80 Pnpm Monorepo \u5355\u4F53\u4ED3\u5E93","description":"","frontmatter":{},"headers":[],"relativePath":"project/npm/pnpm-monorepo.md"}'),l={name:"project/npm/pnpm-monorepo.md"},o=p(`<h1 id="\u6781\u7B80-pnpm-monorepo-\u5355\u4F53\u4ED3\u5E93" tabindex="-1">\u6781\u7B80 Pnpm Monorepo \u5355\u4F53\u4ED3\u5E93 <a class="header-anchor" href="#\u6781\u7B80-pnpm-monorepo-\u5355\u4F53\u4ED3\u5E93" aria-hidden="true">#</a></h1><blockquote><p>\u5199\u5728\u5F00\u59CB\uFF0C\u70B9\u51FB\u4F20\u9001\u95E8\u4E86\u89E3 <a href="https://www.pnpm.cn/" target="_blank" rel="noreferrer">pnpm</a> monorepo <a href="https://xie.infoq.cn/article/4f870ba6a7c8e0fd825295c92" target="_blank" rel="noreferrer">5 \u5206\u949F\u641E\u61C2 Monorepo</a></p></blockquote><blockquote><p>\u5982\u679C\u4E0D\u786E\u5B9A\u9879\u76EE\u662F\u5426\u8BE5\u4F7F\u7528 monorepo\uFF0C\u90A3\u5927\u6982\u662F\u4E0D\u9700\u8981\u3002</p></blockquote><blockquote><p>\u9002\u7528\u4E8E\u591A\u5305\u9879\u76EE\uFF0C\u6EE1\u8DB3\u591A\u5305\u516C\u5171\u4F9D\u8D56\u914D\u7F6E\u62BD\u79BB\uFF0C\u591A\u5305\u5206\u522B\u7BA1\u7406\u5F00\u53D1\u3001\u53D1\u5E03\uFF0C\u89E3\u51B3\u5F00\u53D1\u8FC7\u7A0B\u4E2D\u5305\u4E4B\u95F4\u8C03\u8BD5\u548C\u7248\u672C\u66F4\u65B0\u95EE\u9898\u3002</p></blockquote><h2 id="_1-\u5B89\u88C5-pnpm-\u53C2\u8003\u5B98\u7F51" tabindex="-1">1. \u5B89\u88C5 pnpm <a href="https://www.pnpm.cn/installation" target="_blank" rel="noreferrer">\u53C2\u8003\u5B98\u7F51</a> <a class="header-anchor" href="#_1-\u5B89\u88C5-pnpm-\u53C2\u8003\u5B98\u7F51" aria-hidden="true">#</a></h2><div class="language-sh"><button class="copy"></button><span class="lang">sh</span><pre><code><span class="line"><span style="color:#676E95;"># \u67E5\u770B pnpm \u7248\u672C</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm -v</span></span>
<span class="line"></span>
<span class="line"></span></code></pre></div><h2 id="_2-\u521B\u5EFA\u6839\u9879\u76EE" tabindex="-1">2. \u521B\u5EFA\u6839\u9879\u76EE <a class="header-anchor" href="#_2-\u521B\u5EFA\u6839\u9879\u76EE" aria-hidden="true">#</a></h2><div class="language-sh"><button class="copy"></button><span class="lang">sh</span><pre><code><span class="line"><span style="color:#676E95;"># \u521B\u5EFA\u9879\u76EE\u76EE\u5F55</span></span>
<span class="line"><span style="color:#A6ACCD;">mkdir fe-infra</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u8FDB\u5165\u9879\u76EE</span></span>
<span class="line"><span style="color:#82AAFF;">cd</span><span style="color:#A6ACCD;"> fe-infra</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u521D\u59CB\u5316\u9879\u76EE</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm init</span></span>
<span class="line"></span></code></pre></div><h2 id="_3-\u6DFB\u52A0-pnpm-workspace-yaml" tabindex="-1">3. \u6DFB\u52A0 pnpm-workspace.yaml <a class="header-anchor" href="#_3-\u6DFB\u52A0-pnpm-workspace-yaml" aria-hidden="true">#</a></h2><div class="language-sh"><button class="copy"></button><span class="lang">sh</span><pre><code><span class="line"><span style="color:#676E95;"># \u521B\u5EFA yaml \u6587\u4EF6</span></span>
<span class="line"><span style="color:#A6ACCD;">touch pnpm-workspace.yaml</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># yaml \u6587\u4EF6 \u589E\u52A0</span></span>
<span class="line"><span style="color:#A6ACCD;">packages:</span></span>
<span class="line"><span style="color:#A6ACCD;">    - </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">packages/*</span><span style="color:#89DDFF;">&#39;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre></div><h2 id="_4-\u521B\u5EFA\u5B50\u9879\u76EE" tabindex="-1">4. \u521B\u5EFA\u5B50\u9879\u76EE <a class="header-anchor" href="#_4-\u521B\u5EFA\u5B50\u9879\u76EE" aria-hidden="true">#</a></h2><div class="language-sh"><button class="copy"></button><span class="lang">sh</span><pre><code><span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u521B\u5EFA\u5B50\u9879\u76EE</span></span>
<span class="line"><span style="color:#A6ACCD;">mkdir packages</span></span>
<span class="line"></span>
<span class="line"><span style="color:#82AAFF;">cd</span><span style="color:#A6ACCD;"> packages</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u521B\u5EFA\u793A\u4F8B\u9879\u76EE</span></span>
<span class="line"><span style="color:#A6ACCD;">mkdir tools</span></span>
<span class="line"></span>
<span class="line"><span style="color:#82AAFF;">cd</span><span style="color:#A6ACCD;"> tools</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u521D\u59CB\u5316\u793A\u4F8B\u9879\u76EE</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm init</span></span>
<span class="line"><span style="color:#676E95;"># \u975E\u5FC5\u987B \u4F7F\u7528 @scope/name \u91CD\u547D\u540D pkg name \u4E3A @infra/tools\u3002</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u91CD\u590D\u4EE5\u4E0A\u6B65\u9AA4 \u521B\u5EFA web \u5B50\u9879\u76EE</span></span>
<span class="line"></span>
<span class="line"></span></code></pre></div><h2 id="_5-\u6DFB\u52A0\u4F9D\u8D56" tabindex="-1">5. \u6DFB\u52A0\u4F9D\u8D56 <a class="header-anchor" href="#_5-\u6DFB\u52A0\u4F9D\u8D56" aria-hidden="true">#</a></h2><div class="language-sh"><button class="copy"></button><span class="lang">sh</span><pre><code><span class="line"><span style="color:#676E95;"># \u6839\u76EE\u5F55\u6DFB\u52A0 prettier \u5230\u5F00\u53D1\u4F9D\u8D56</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm add prettier -w -D</span></span>
<span class="line"></span>
<span class="line"></span></code></pre></div><div class="language-sh"><button class="copy"></button><span class="lang">sh</span><pre><code><span class="line"><span style="color:#676E95;"># \u793A\u4F8B\uFF1A\u5B89\u88C5\u5F00\u6E90 @infra/tools \u5B89\u88C5 lodash \u4F9D\u8D56\u3002\u5220\u9664 remove</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm -F @infra/tools add lodash</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u793A\u4F8B\uFF1A\u5B89\u88C5\u9879\u76EE\u95F4\u4F9D\u8D56\uFF0C @infra/qui-antd \u5B89\u88C5 @infra/tools \u4F9D\u8D56\u3002</span></span>
<span class="line"><span style="color:#A6ACCD;">pnpm -F @infra/web  add @infra/tools  </span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;"># \u81EA\u52A8\u4F9D\u8D56 workspace \u6700\u65B0\u7248\u672C\uFF1A</span></span>
<span class="line"><span style="color:#676E95;"># \u67E5\u770B web -- pkg.json \u5C06  &quot;@infra/tools&quot;: &quot;workspace:^1.0.0&quot; \u4FEE\u6539\u4E3A &quot;@infra/tools&quot;: &quot;workspace:*&quot;\u3002</span></span>
<span class="line"></span>
<span class="line"></span></code></pre></div><h2 id="_6-\u6839\u76EE\u5F55\u589E\u52A0-npm-\u6307\u4EE4" tabindex="-1">6. \u6839\u76EE\u5F55\u589E\u52A0 npm \u6307\u4EE4 <a class="header-anchor" href="#_6-\u6839\u76EE\u5F55\u589E\u52A0-npm-\u6307\u4EE4" aria-hidden="true">#</a></h2><div class="language-json"><button class="copy"></button><span class="lang">json</span><pre><code><span class="line"><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">scripts</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;">: </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C792EA;">tools:dev</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">pnpm --dir ./packages/tools dev</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span><span style="color:#A6ACCD;"> </span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C792EA;">tools:build</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">pnpm --dir ./packages/tools build</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span><span style="color:#A6ACCD;"> </span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C792EA;">test</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">echo </span><span style="color:#A6ACCD;">\\&quot;</span><span style="color:#C3E88D;">Error: no test specified</span><span style="color:#A6ACCD;">\\&quot;</span><span style="color:#C3E88D;"> &amp;&amp; exit 1</span><span style="color:#89DDFF;">&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">,</span></span>
<span class="line"></span></code></pre></div><h2 id="_7-\u4E1A\u52A1\u9879\u76EE\u5F00\u53D1\uFF0C\u5C06\u5B50\u9879\u76EE\u6362\u6210\u4E1A\u52A1\u9879\u76EE\u5373\u53EF\u3002" tabindex="-1">7. \u4E1A\u52A1\u9879\u76EE\u5F00\u53D1\uFF0C\u5C06\u5B50\u9879\u76EE\u6362\u6210\u4E1A\u52A1\u9879\u76EE\u5373\u53EF\u3002 <a class="header-anchor" href="#_7-\u4E1A\u52A1\u9879\u76EE\u5F00\u53D1\uFF0C\u5C06\u5B50\u9879\u76EE\u6362\u6210\u4E1A\u52A1\u9879\u76EE\u5373\u53EF\u3002" aria-hidden="true">#</a></h2><p>\u793A\u4F8B\u4E0D\u5305\u542B\u516C\u5171\u914D\u7F6E\u62BD\u79BB\uFF0C\u53EF\u53C2\u8003 <a href="https://github.com/youzan/vant" target="_blank" rel="noreferrer">Vant Monorepo \u914D\u7F6E</a>\u3002</p>`,19),e=[o];function c(t,r,i,d,y,D){return a(),n("div",null,e)}const A=s(l,[["render",c]]);export{u as __pageData,A as default};
