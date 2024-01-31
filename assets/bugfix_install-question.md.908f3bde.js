import{_ as s,c as n,o as a,a as e}from"./app.e23272e0.js";const A=JSON.parse('{"title":"\u524D\u7AEF\u9879\u76EE\u90E8\u7F72\u5E38\u89C1\u95EE\u9898","description":"","frontmatter":{},"headers":[],"relativePath":"bugfix/install-question.md"}'),l={name:"bugfix/install-question.md"},o=e(`<h1 id="\u524D\u7AEF\u9879\u76EE\u90E8\u7F72\u5E38\u89C1\u95EE\u9898" tabindex="-1">\u524D\u7AEF\u9879\u76EE\u90E8\u7F72\u5E38\u89C1\u95EE\u9898 <a class="header-anchor" href="#\u524D\u7AEF\u9879\u76EE\u90E8\u7F72\u5E38\u89C1\u95EE\u9898" aria-hidden="true">#</a></h1><h2 id="sentry-cli" tabindex="-1">sentry-cli <a class="header-anchor" href="#sentry-cli" aria-hidden="true">#</a></h2><p>\u9879\u76EE\u62C9\u53D6\u4F9D\u8D56 <code>sentry-cli</code> \u7279\u522B\u4E45</p><p>\u9879\u76EE\u5185\u4F9D\u8D56 <code>@sentry/webpack-plugin</code></p><h3 id="\u89E3\u51B3\u65B9\u6848" tabindex="-1">\u89E3\u51B3\u65B9\u6848 <a class="header-anchor" href="#\u89E3\u51B3\u65B9\u6848" aria-hidden="true">#</a></h3><div class="language-yaml"><button class="copy"></button><span class="lang">yaml</span><pre><code><span class="line"><span style="color:#676E95;"># .npmrc</span></span>
<span class="line"><span style="color:#C3E88D;">sentrycli_cdnurl=https://npmmirror.com/mirrors/sentry-cli</span></span>
<span class="line"></span></code></pre></div><h2 id="node-sass" tabindex="-1">node-sass <a class="header-anchor" href="#node-sass" aria-hidden="true">#</a></h2><p>\u9879\u76EE\u62C9\u53D6\u4F9D\u8D56 <code>node-sass</code> binary \u5931\u8D25</p><h3 id="\u89E3\u51B3\u65B9\u6848-1" tabindex="-1">\u89E3\u51B3\u65B9\u6848 <a class="header-anchor" href="#\u89E3\u51B3\u65B9\u6848-1" aria-hidden="true">#</a></h3><div class="language-yaml"><button class="copy"></button><span class="lang">yaml</span><pre><code><span class="line"><span style="color:#676E95;"># .npmrc</span></span>
<span class="line"><span style="color:#C3E88D;">sass_binary_site=https://npmmirror.com/mirrors/node-sass</span></span>
<span class="line"></span></code></pre></div><h2 id="pnpm-install-\u5931\u8D25\u63D0\u793A-frozen-lockfile" tabindex="-1">pnpm install \u5931\u8D25\u63D0\u793A <code>frozen-lockfile</code> <a class="header-anchor" href="#pnpm-install-\u5931\u8D25\u63D0\u793A-frozen-lockfile" aria-hidden="true">#</a></h2><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#A6ACCD;">Lockfile is up-to-date, resolution step is skipped</span></span>
<span class="line"><span style="color:#A6ACCD;">\u2009ERR_PNPM_OUTDATED_LOCKFILE\u2009 Cannot install with </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">frozen-lockfile</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> because pnpm-lock.yaml is not up-to-date with package.json</span></span>
<span class="line"><span style="color:#A6ACCD;">Note that </span><span style="color:#89DDFF;">in</span><span style="color:#A6ACCD;"> CI environments this setting is </span><span style="color:#82AAFF;">true</span><span style="color:#A6ACCD;"> by default. If you still need to run install </span><span style="color:#89DDFF;">in</span><span style="color:#A6ACCD;"> such cases, use </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">pnpm install --no-frozen-lockfile</span><span style="color:#89DDFF;">&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">ERROR: Job failed: </span><span style="color:#82AAFF;">command</span><span style="color:#A6ACCD;"> terminated with </span><span style="color:#82AAFF;">exit</span><span style="color:#A6ACCD;"> code 1</span></span>
<span class="line"></span></code></pre></div><h3 id="\u89E3\u51B3\u65B9\u6848-2" tabindex="-1">\u89E3\u51B3\u65B9\u6848 <a class="header-anchor" href="#\u89E3\u51B3\u65B9\u6848-2" aria-hidden="true">#</a></h3><p>\u4F9D\u6B21\u6267\u884C\u4E00\u4E0B\u547D\u4EE4\uFF1A</p><ol><li><code>rm -rf pnpm-lock.yaml node_modules</code></li><li><code>pnpm install</code></li><li><code>git add pnpm-lock.yaml</code></li><li><code>git commmit -m &#39;build: update pnpm-lock.yaml&#39;</code></li><li><code>git push</code></li></ol><h2 id="install-\u5931\u8D25\u63D0\u793A-node-pre-gyp-err" tabindex="-1">install \u5931\u8D25\u63D0\u793A <code>node-pre-gyp ERR</code> <a class="header-anchor" href="#install-\u5931\u8D25\u63D0\u793A-node-pre-gyp-err" aria-hidden="true">#</a></h2><div class="language-shell"><button class="copy"></button><span class="lang">shell</span><pre><code><span class="line"><span style="color:#89DDFF;">&gt;</span><span style="color:#A6ACCD;"> fsevents@1.2.2 install /Users/qle/Desktop/work/project/credit-rule-engine/ReactWebCode/approveLine/node_modules/fsevents</span></span>
<span class="line"><span style="color:#89DDFF;">&gt;</span><span style="color:#A6ACCD;"> node install</span></span>
<span class="line"></span>
<span class="line"><span style="color:#A6ACCD;">node-pre-gyp ERR</span><span style="color:#89DDFF;">!</span><span style="color:#A6ACCD;"> Tried to download</span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">403</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;">: https://fsevents-binaries.s3-us-west-2.amazonaws.com/v1.2.2/fse-v1.2.2-node-v83-darwin-arm64.tar.gz </span></span>
<span class="line"><span style="color:#A6ACCD;">node-pre-gyp ERR</span><span style="color:#89DDFF;">!</span><span style="color:#A6ACCD;"> Pre-built binaries not found </span><span style="color:#89DDFF;">for</span><span style="color:#A6ACCD;"> fsevents@1.2.2 and node@14.18.1 </span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">node-v83 ABI, unknown</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">falling back to </span><span style="color:#82AAFF;">source</span><span style="color:#A6ACCD;"> compile with node-gyp</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> </span></span>
<span class="line"><span style="color:#A6ACCD;">  SOLINK_MODULE</span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">target</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> Release/.node</span></span>
<span class="line"><span style="color:#A6ACCD;">  CXX</span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">target</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> Release/obj.target/fse/fsevents.o</span></span>
<span class="line"><span style="color:#A6ACCD;">In file included from ../fsevents.cc:6:</span></span>
<span class="line"><span style="color:#A6ACCD;">In file included from ../../nan/nan.h:202:</span></span>
<span class="line"><span style="color:#A6ACCD;">In file included from ../../nan/nan_converters.h:67:</span></span>
<span class="line"><span style="color:#A6ACCD;">../../nan/nan_converters_43_inl.h:22:1: error: no viable conversion from </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">Local&lt;v8::Context&gt;</span><span style="color:#89DDFF;">&#39;</span><span style="color:#A6ACCD;"> to </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">v8::Isolate *</span><span style="color:#89DDFF;">&#39;</span></span>
<span class="line"><span style="color:#A6ACCD;">X</span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">Boolean</span><span style="color:#89DDFF;">)</span></span>
<span class="line"><span style="color:#A6ACCD;">^~~~~~~~~~</span></span>
<span class="line"><span style="color:#A6ACCD;">../../nan/nan_converters_43_inl.h:18:23: note: expanded from macro </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">X</span><span style="color:#89DDFF;">&#39;</span></span>
<span class="line"><span style="color:#A6ACCD;">...</span></span>
<span class="line"></span></code></pre></div><h3 id="\u89E3\u51B3\u65B9\u6848-3" tabindex="-1">\u89E3\u51B3\u65B9\u6848 <a class="header-anchor" href="#\u89E3\u51B3\u65B9\u6848-3" aria-hidden="true">#</a></h3><p>\u4F9D\u6B21\u6267\u884C\u4E00\u4E0B\u547D\u4EE4\uFF1A</p><ol><li>\u5220\u9664 lock \u6587\u4EF6</li><li>\u91CD\u65B0 install</li></ol>`,20),p=[o];function t(c,r,i,d,y,D){return a(),n("div",null,p)}const h=s(l,[["render",t]]);export{A as __pageData,h as default};
