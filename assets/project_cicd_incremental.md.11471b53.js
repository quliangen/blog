import{_ as s,c as a,o as n,a as l}from"./app.e23272e0.js";const _=JSON.parse('{"title":"\u524D\u7AEF\u589E\u91CF\u90E8\u7F72","description":"","frontmatter":{},"headers":[],"relativePath":"project/cicd/incremental.md"}'),e={name:"project/cicd/incremental.md"},p=l(`<h1 id="\u524D\u7AEF\u589E\u91CF\u90E8\u7F72" tabindex="-1">\u524D\u7AEF\u589E\u91CF\u90E8\u7F72 <a class="header-anchor" href="#\u524D\u7AEF\u589E\u91CF\u90E8\u7F72" aria-hidden="true">#</a></h1><h2 id="\u65B9\u6848\u4E00\uFF1A\u4F7F\u7528-rsync-\u914D\u7F6E\u6307\u5357" tabindex="-1">\u65B9\u6848\u4E00\uFF1A\u4F7F\u7528 rsync \u914D\u7F6E\u6307\u5357 <a class="header-anchor" href="#\u65B9\u6848\u4E00\uFF1A\u4F7F\u7528-rsync-\u914D\u7F6E\u6307\u5357" aria-hidden="true">#</a></h2><div class="language-bash"><button class="copy"></button><span class="lang">bash</span><pre><code><span class="line"><span style="color:#82AAFF;">cd</span><span style="color:#A6ACCD;"> /data/opt/nginx/html</span></span>
<span class="line"><span style="color:#A6ACCD;">tar xf dist.tar.gz</span></span>
<span class="line"><span style="color:#A6ACCD;">rsync -avr dist/PROJECT_NAME/</span></span>
<span class="line"><span style="color:#A6ACCD;">\\rm -rf dist dist.tar.gz</span></span>
<span class="line"></span></code></pre></div><h2 id="\u793A\u4F8B" tabindex="-1">\u793A\u4F8B <a class="header-anchor" href="#\u793A\u4F8B" aria-hidden="true">#</a></h2><p>\u5386\u53F2</p><div class="language-bash"><button class="copy"></button><span class="lang">bash</span><pre><code><span class="line"><span style="color:#82AAFF;">cd</span><span style="color:#A6ACCD;"> /data/opt/nginx/html</span></span>
<span class="line"><span style="color:#A6ACCD;">tar xf dist.tar.gz</span></span>
<span class="line"><span style="color:#A6ACCD;">\\rm -rf  ./blog</span></span>
<span class="line"><span style="color:#A6ACCD;">mkdir ./blog</span></span>
<span class="line"><span style="color:#A6ACCD;">mv ./dist/</span><span style="color:#89DDFF;">*</span><span style="color:#A6ACCD;"> ./blog</span></span>
<span class="line"><span style="color:#A6ACCD;">\\rm -rf ./dist.tar.gz</span></span>
<span class="line"></span></code></pre></div><p>\u4FEE\u6539\u540E</p><div class="language-bash"><button class="copy"></button><span class="lang">bash</span><pre><code><span class="line"><span style="color:#82AAFF;">cd</span><span style="color:#A6ACCD;"> /data/opt/nginx/html</span></span>
<span class="line"><span style="color:#A6ACCD;">tar xf dist.tar.gz</span></span>
<span class="line"><span style="color:#A6ACCD;">rsync -avr dist/blog/</span></span>
<span class="line"><span style="color:#A6ACCD;">\\rm -rf dist dist.tar.gz</span></span>
<span class="line"></span></code></pre></div>`,8),t=[p];function c(r,o,i,d,A,C){return n(),a("div",null,t)}const y=s(e,[["render",c]]);export{_ as __pageData,y as default};
