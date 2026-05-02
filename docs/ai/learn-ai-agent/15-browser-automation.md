---
title: 15-Agent + 浏览器自动化
description: Playwright 集成，网页分析，数据采集，测试生成
---

# 15-Agent + 浏览器自动化

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 浏览器自动化能力 | ✅ Playwright/Puppeteer 实战 |
| 网页数据采集能力 | ✅ 智能内容提取与解析 |
| 自动化测试架构 | ✅ 测试用例自动生成 |
| 反爬虫策略应对 | ✅ 反检测与绕过技术 |

## 学习目标

学完本节，你将能够：
- 掌握 Playwright 核心 API，实现 Agent 对网页的「视觉理解」
- 开发自动化操作 Agent：点击、输入、截图、PDF 生成
- 构建网页内容提取与总结 Agent，实现智能数据采集
- 理解 Playwright vs Puppeteer 的差异，选型有依据
- 掌握自动化测试架构设计与反爬虫策略应对

## 前置知识

- 已完成前面章节的学习
- 熟悉 Python/Node.js 基础
- 了解 HTML/CSS/DOM 结构
- 有基本的网络请求知识

## 核心概念

### 1. Playwright 集成：让 Agent 能「看懂」网页

#### 1.1 为什么选择 Playwright？

```python
# Playwright 核心优势
"""
1. 多浏览器支持：Chromium、Firefox、WebKit
2. 自动等待：智能等待元素加载，减少 flaky tests
3. 强大的选择器：CSS、XPath、文本、角色等
4. 移动端模拟：模拟各种设备
5. 录制与调试：内置 codegen 和 trace viewer
"""

from playwright.async_api import async_playwright
import asyncio

async def agent_sees_webpage():
    """Agent 首次「看见」网页"""
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        # Agent 访问网页
        await page.goto('https://example.com')
        
        # 获取页面信息供 Agent 分析
        page_info = {
            'title': await page.title(),
            'url': page.url,
            'content': await page.content(),  # HTML 内容
            'text_content': await page.evaluate(
                '() => document.body.innerText'
            ),  # 纯文本内容
            'screenshot': await page.screenshot(full_page=True)
        }
        
        await browser.close()
        return page_info
```

#### 1.2 Agent 网页理解流程

```python
class WebUnderstandingAgent:
    """能理解网页内容的 Agent"""
    
    def __init__(self, llm_client):
        self.llm = llm_client
        
    async def understand_page(self, page):
        """Agent 分析网页结构"""
        # 1. 提取结构化信息
        structured_data = await page.evaluate('''() => {
            return {
                headings: Array.from(document.querySelectorAll('h1, h2, h3'))
                    .map(h => ({level: h.tagName, text: h.innerText})),
                links: Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({text: a.innerText, href: a.href})),
                forms: Array.from(document.querySelectorAll('form'))
                    .map(f => ({
                        id: f.id,
                        inputs: Array.from(f.querySelectorAll('input, select, textarea'))
                            .map(i => ({
                                type: i.type || i.tagName.toLowerCase(),
                                name: i.name,
                                required: i.required
                            }))
                    })),
                images: Array.from(document.querySelectorAll('img'))
                    .map(img => ({src: img.src, alt: img.alt})),
                buttons: Array.from(document.querySelectorAll('button, [role="button"]'))
                    .map(b => b.innerText.trim())
            };
        }''')
        
        # 2. Agent 分析并生成理解
        understanding_prompt = f"""
        分析以下网页结构信息，总结页面用途和关键交互点：
        
        页面标题: {await page.title()}
        页面 URL: {page.url}
        
        结构数据:
        {json.dumps(structured_data, indent=2, ensure_ascii=False)}
        
        请提供：
        1. 页面主要功能
        2. 关键交互元素
        3. 可能的用户流程
        4. 数据提取建议
        """
        
        return await self.llm.analyze(understanding_prompt)
```

### 2. 自动化操作：点击、输入、截图、PDF 生成

#### 2.1 基础操作封装

```python
class BrowserAutomationAgent:
    """浏览器自动化操作 Agent"""
    
    def __init__(self):
        self.browser = None
        self.page = None
        self.action_history = []
        
    async def initialize(self, headless=True):
        """初始化浏览器"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        self.page = await self.context.new_page()
        
    async def click(self, selector, description=""):
        """智能点击操作"""
        try:
            # 等待元素可见并可点击
            await self.page.wait_for_selector(selector, state='visible')
            element = await self.page.query_selector(selector)
            
            # 滚动到元素
            await element.scroll_into_view_if_needed()
            
            # 截图记录操作前状态
            before_screenshot = await self.page.screenshot()
            
            # 执行点击
            await element.click()
            
            # 等待页面稳定
            await self.page.wait_for_load_state('networkidle')
            
            self.action_history.append({
                'action': 'click',
                'selector': selector,
                'description': description,
                'success': True
            })
            
            return {'success': True, 'before': before_screenshot}
            
        except Exception as e:
            self.action_history.append({
                'action': 'click',
                'selector': selector,
                'error': str(e),
                'success': False
            })
            return {'success': False, 'error': str(e)}
    
    async def type_text(self, selector, text, clear_first=True):
        """智能输入操作"""
        try:
            await self.page.wait_for_selector(selector, state='visible')
            
            if clear_first:
                await self.page.fill(selector, '')  # 清空
            
            # 模拟人类输入（带随机延迟）
            await self.page.type(selector, text, delay=50)
            
            self.action_history.append({
                'action': 'type',
                'selector': selector,
                'text': text[:20] + '...' if len(text) > 20 else text,
                'success': True
            })
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def extract_text(self, selector=None):
        """提取文本内容"""
        if selector:
            elements = await self.page.query_selector_all(selector)
            texts = []
            for el in elements:
                text = await el.inner_text()
                texts.append(text.strip())
            return texts
        else:
            return await self.page.inner_text('body')
    
    async def capture_screenshot(self, path=None, full_page=True, selector=None):
        """截图功能"""
        screenshot_options = {
            'full_page': full_page,
            'type': 'png'
        }
        
        if path:
            screenshot_options['path'] = path
            
        if selector:
            element = await self.page.query_selector(selector)
            if element:
                screenshot = await element.screenshot(**screenshot_options)
            else:
                raise Exception(f"Element not found: {selector}")
        else:
            screenshot = await self.page.screenshot(**screenshot_options)
            
        return screenshot
    
    async def generate_pdf(self, path, options=None):
        """生成 PDF"""
        default_options = {
            'path': path,
            'format': 'A4',
            'print_background': True,
            'margin': {
                'top': '20mm',
                'bottom': '20mm',
                'left': '20mm',
                'right': '20mm'
            }
        }
        
        if options:
            default_options.update(options)
            
        await self.page.pdf(**default_options)
        return path
    
    async def scroll_page(self, direction='down', amount=1000):
        """页面滚动"""
        if direction == 'down':
            await self.page.evaluate(f'window.scrollBy(0, {amount})')
        elif direction == 'up':
            await self.page.evaluate(f'window.scrollBy(0, -{amount})')
        elif direction == 'bottom':
            await self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        elif direction == 'top':
            await self.page.evaluate('window.scrollTo(0, 0)')
            
        # 等待滚动完成
        await self.page.wait_for_timeout(500)
```

#### 2.2 高级操作：表单自动填充

```python
class FormAutomationAgent(BrowserAutomationAgent):
    """表单自动填充 Agent"""
    
    async def analyze_form(self, form_selector='form'):
        """分析表单结构"""
        form_info = await self.page.evaluate(f'''() => {{
            const form = document.querySelector('{form_selector}');
            if (!form) return null;
            
            const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
            return inputs.map(input => ({{
                type: input.type || input.tagName.toLowerCase(),
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                required: input.required,
                label: input.labels?.[0]?.innerText || 
                       input.previousElementSibling?.innerText ||
                       input.parentElement?.querySelector('label')?.innerText
            }}));
        }}''')
        
        return form_info
    
    async def fill_form(self, data, form_selector='form'):
        """自动填充表单"""
        results = []
        
        for field_name, value in data.items():
            # 尝试多种选择器策略
            selectors = [
                f'input[name="{field_name}"]',
                f'input[id="{field_name}"]',
                f'#{field_name}',
                f'[placeholder*="{field_name}"]',
                f'input[aria-label*="{field_name}"]'
            ]
            
            filled = False
            for selector in selectors:
                try:
                    await self.type_text(selector, str(value))
                    results.append({'field': field_name, 'status': 'success'})
                    filled = True
                    break
                except:
                    continue
            
            if not filled:
                results.append({'field': field_name, 'status': 'failed'})
                
        return results
    
    async def submit_form(self, form_selector='form', button_selector=None):
        """提交表单"""
        if button_selector:
            await self.click(button_selector, "提交表单")
        else:
            await self.page.press(f'{form_selector} [type="submit"]', 'Enter')
```

### 3. 与 Agent 结合：网页分析、数据采集、测试用例生成

#### 3.1 智能网页分析 Agent

```python
class WebAnalysisAgent:
    """网页分析 Agent：提取结构化数据"""
    
    def __init__(self, llm_client, browser_agent):
        self.llm = llm_client
        self.browser = browser_agent
        
    async def analyze_page_structure(self, url):
        """分析页面结构"""
        await self.browser.page.goto(url)
        await self.browser.page.wait_for_load_state('networkidle')
        
        # 提取页面所有元素信息
        elements = await self.browser.page.evaluate('''() => {
            const data = {
                navigation: [],
                content: [],
                interactive: [],
                media: []
            };
            
            // 导航元素
            document.querySelectorAll('nav a, header a, .nav, .menu a').forEach(el => {
                data.navigation.push({
                    text: el.innerText.trim(),
                    href: el.href
                });
            });
            
            // 内容元素
            document.querySelectorAll('article, .content, main, section').forEach(el => {
                data.content.push({
                    tag: el.tagName,
                    text: el.innerText.trim().substring(0, 200)
                });
            });
            
            // 交互元素
            document.querySelectorAll('button, a, input, select').forEach(el => {
                data.interactive.push({
                    tag: el.tagName,
                    type: el.type,
                    text: el.innerText?.trim() || el.placeholder,
                    action: el.onclick ? 'click' : 'other'
                });
            });
            
            return data;
        }''')
        
        # 使用 LLM 分析
        analysis = await self.llm.complete(f"""
        分析以下网页结构，提取关键信息：
        
        {json.dumps(elements, indent=2, ensure_ascii=False)}
        
        请提供：
        1. 网站类型（电商/博客/企业官网等）
        2. 主要功能模块
        3. 用户核心流程
        4. 数据提取建议（适合爬取的内容）
        """)
        
        return analysis
```

#### 3.2 数据采集 Agent

```python
class DataCollectionAgent:
    """智能数据采集 Agent"""
    
    def __init__(self, browser_agent, llm_client):
        self.browser = browser_agent
        self.llm = llm_client
        
    async def extract_article_content(self, url):
        """提取文章内容（自动识别正文）"""
        await self.browser.page.goto(url)
        
        # 使用 Readability 算法提取正文
        article_data = await self.browser.page.evaluate('''() => {
            // 简单的正文提取算法
            const paragraphs = Array.from(document.querySelectorAll('p'));
            const textBlocks = paragraphs.map(p => ({
                text: p.innerText.trim(),
                length: p.innerText.trim().length,
                parentTag: p.parentElement.tagName
            }));
            
            // 过滤短文本
            const validBlocks = textBlocks.filter(b => b.length > 50);
            
            // 查找最大文本块
            const maxBlock = validBlocks.reduce((max, curr) => 
                curr.length > max.length ? curr : max, validBlocks[0] || {});
            
            // 提取标题
            const title = document.querySelector('h1, .title, [property="og:title"]')?.innerText 
                         || document.title;
            
            // 提取作者和日期
            const author = document.querySelector('.author, [rel="author"], .byline')?.innerText;
            const date = document.querySelector('time, .date, [property="article:published_time"]')?.innerText;
            
            return {
                title: title,
                author: author,
                publishDate: date,
                content: validBlocks.map(b => b.text).join('\\n\\n'),
                wordCount: validBlocks.reduce((sum, b) => sum + b.length, 0)
            };
        }''')
        
        return article_data
    
    async def extract_product_info(self, url):
        """提取商品信息"""
        await self.browser.page.goto(url)
        
        # 常见电商网站选择器
        selectors = {
            'title': ['h1', '.product-title', '[data-testid="product-title"]', '.item-title'],
            'price': ['.price', '.product-price', '[data-testid="price"]', '.current-price'],
            'image': ['.product-image img', '.main-image', '[data-testid="product-image"]'],
            'description': ['.description', '.product-description', '#description'],
            'rating': ['.rating', '.stars', '[data-testid="rating"]']
        }
        
        product = {}
        for field, field_selectors in selectors.items():
            for selector in field_selectors:
                try:
                    element = await self.browser.page.query_selector(selector)
                    if element:
                        if field == 'image':
                            product[field] = await element.get_attribute('src')
                        else:
                            product[field] = await element.inner_text()
                        break
                except:
                    continue
        
        return product
    
    async def crawl_listing(self, list_url, item_selector, next_button=None, max_pages=5):
        """爬取列表页"""
        all_items = []
        current_page = 1
        
        await self.browser.page.goto(list_url)
        
        while current_page <= max_pages:
            # 提取当前页数据
            items = await self.browser.page.query_selector_all(item_selector)
            
            for item in items:
                item_data = await item.evaluate('''el => ({
                    text: el.innerText,
                    html: el.innerHTML,
                    links: Array.from(el.querySelectorAll('a')).map(a => ({
                        text: a.innerText,
                        href: a.href
                    }))
                })''')
                all_items.append(item_data)
            
            # 下一页
            if next_button:
                has_next = await self.browser.page.query_selector(next_button)
                if has_next:
                    await self.browser.click(next_button, "下一页")
                    await self.browser.page.wait_for_load_state('networkidle')
                    current_page += 1
                else:
                    break
            else:
                break
        
        return all_items
```

#### 3.3 测试用例生成 Agent

```python
class TestCaseGenerationAgent:
    """自动化测试用例生成 Agent"""
    
    def __init__(self, llm_client, browser_agent):
        self.llm = llm_client
        self.browser = browser_agent
        
    async def analyze_for_testing(self, url):
        """分析页面生成测试用例"""
        await self.browser.page.goto(url)
        
        # 提取可测试元素
        testable_elements = await self.browser.page.evaluate('''() => {
            return {
                forms: Array.from(document.querySelectorAll('form')).map(f => ({
                    id: f.id,
                    action: f.action,
                    method: f.method,
                    inputs: Array.from(f.querySelectorAll('input, select, textarea'))
                        .map(i => ({
                            type: i.type || i.tagName.toLowerCase(),
                            name: i.name,
                            required: i.required,
                            validation: i.pattern || i.min || i.max
                        }))
                })),
                buttons: Array.from(document.querySelectorAll('button, [role="button"], [onclick]'))
                    .map(b => ({
                        text: b.innerText.trim(),
                        id: b.id,
                        type: b.type
                    })),
                links: Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({
                        text: a.innerText.trim(),
                        href: a.href
                    })),
                navigation: Array.from(document.querySelectorAll('nav a'))
                    .map(n => n.innerText.trim())
            };
        }''')
        
        # 使用 LLM 生成测试用例
        test_cases = await self.llm.complete(f"""
        基于以下网页元素信息，生成 Playwright 测试用例：
        
        {json.dumps(testable_elements, indent=2, ensure_ascii=False)}
        
        请生成：
        1. 功能测试用例（用户交互流程）
        2. 边界测试用例（异常输入处理）
        3. 导航测试用例（页面跳转）
        4. 可访问性测试建议
        
        输出格式为 Python pytest 代码。
        """)
        
        return test_cases
    
    def generate_test_code(self, test_cases_description):
        """将描述转换为可执行测试代码"""
        test_template = '''
import pytest
from playwright.async_api import Page, expect

class Test{FeatureName}:
    """{Description}"""
    
    async def test_{test_name}(self, page: Page):
        """{test_description}"""
        await page.goto("{url}")
        
        # {action_description}
        {test_code}
        
        # 断言
        {assertions}
'''
        # 这里可以使用 LLM 或模板引擎生成具体代码
        return test_template
```

### 4. 实战：开发「网页内容提取与总结 Agent」

#### 4.1 完整项目代码

```python
# web_content_agent.py
import asyncio
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from playwright.async_api import async_playwright
import openai

@dataclass
class ExtractedContent:
    """提取的内容数据结构"""
    url: str
    title: str
    author: Optional[str]
    publish_date: Optional[str]
    summary: str
    key_points: List[str]
    full_text: str
    images: List[Dict]
    links: List[Dict]
    metadata: Dict

class WebContentExtractionAgent:
    """网页内容提取与总结 Agent"""
    
    def __init__(self, openai_api_key: str):
        self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
        self.browser = None
        self.page = None
        
    async def initialize(self):
        """初始化浏览器"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        self.page = await self.context.new_page()
        
    async def extract(self, url: str, generate_summary: bool = True) -> ExtractedContent:
        """提取并总结网页内容"""
        # 访问页面
        await self.page.goto(url, wait_until='networkidle')
        
        # 等待动态内容加载
        await self.page.wait_for_timeout(2000)
        
        # 提取基础信息
        basic_info = await self._extract_basic_info()
        
        # 提取正文内容
        content = await self._extract_content()
        
        # 提取媒体资源
        images = await self._extract_images()
        links = await self._extract_links()
        
        # 生成总结
        summary = ""
        key_points = []
        if generate_summary and content:
            summary, key_points = await self._generate_summary(content)
        
        return ExtractedContent(
            url=url,
            title=basic_info.get('title', ''),
            author=basic_info.get('author'),
            publish_date=basic_info.get('publish_date'),
            summary=summary,
            key_points=key_points,
            full_text=content,
            images=images,
            links=links,
            metadata=basic_info.get('metadata', {})
        )
    
    async def _extract_basic_info(self) -> Dict:
        """提取基础信息"""
        return await self.page.evaluate('''() => {
            const getMeta = (name) => {
                const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                return meta?.content;
            };
            
            return {
                title: document.title,
                author: getMeta('author') || getMeta('article:author'),
                publish_date: getMeta('article:published_time') || 
                             getMeta('publish_date'),
                description: getMeta('description') || getMeta('og:description'),
                keywords: getMeta('keywords'),
                metadata: {
                    canonical: document.querySelector('link[rel="canonical"]')?.href,
                    og_title: getMeta('og:title'),
                    og_image: getMeta('og:image')
                }
            };
        }''')
    
    async def _extract_content(self) -> str:
        """提取正文内容（使用智能算法）"""
        return await self.page.evaluate('''() => {
            // 移除不需要的元素
            const toRemove = document.querySelectorAll(
                'script, style, nav, header, footer, aside, .advertisement, .sidebar'
            );
            toRemove.forEach(el => el.remove());
            
            // 查找主要内容区域
            const contentSelectors = [
                'article', '[role="main"]', 'main', '.content', '.post-content',
                '.entry-content', '#content', '.article-body'
            ];
            
            let mainContent = null;
            for (const selector of contentSelectors) {
                const el = document.querySelector(selector);
                if (el && el.innerText.trim().length > 200) {
                    mainContent = el;
                    break;
                }
            }
            
            // 如果没找到，使用 body
            if (!mainContent) {
                mainContent = document.body;
            }
            
            // 提取文本
            const paragraphs = mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
            const texts = [];
            paragraphs.forEach(p => {
                const text = p.innerText.trim();
                if (text.length > 20) {
                    texts.push(text);
                }
            });
            
            return texts.join('\\n\\n');
        }''')
    
    async def _extract_images(self) -> List[Dict]:
        """提取图片信息"""
        return await self.page.evaluate('''() => {
            return Array.from(document.querySelectorAll('img'))
                .filter(img => img.width > 100 && img.height > 100)
                .map(img => ({
                    src: img.src,
                    alt: img.alt,
                    width: img.width,
                    height: img.height
                }));
        }''')
    
    async def _extract_links(self) -> List[Dict]:
        """提取链接信息"""
        return await self.page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]'))
                .filter(a => a.href.startsWith('http'))
                .map(a => ({
                    text: a.innerText.trim().substring(0, 100),
                    href: a.href
                }));
        }''')
    
    async def _generate_summary(self, content: str) -> tuple:
        """使用 LLM 生成总结"""
        # 截断内容以适应 token 限制
        max_chars = 4000
        truncated_content = content[:max_chars]
        
        prompt = f"""
        请对以下文章内容进行总结：
        
        文章内容：
        {truncated_content}
        
        请提供：
        1. 一句话总结（50字以内）
        2. 3-5 个关键要点
        
        输出格式：
        总结：[总结内容]
        要点：
        - [要点1]
        - [要点2]
        ...
        """
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个专业的内容分析师，擅长提取文章核心观点。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result = response.choices[0].message.content
        
        # 解析结果
        summary = ""
        key_points = []
        
        lines = result.split('\n')
        for line in lines:
            if line.startswith('总结：'):
                summary = line.replace('总结：', '').strip()
            elif line.startswith('- ') or line.startswith('• '):
                key_points.append(line[2:].strip())
        
        return summary, key_points
    
    async def batch_extract(self, urls: List[str]) -> List[ExtractedContent]:
        """批量提取多个网页"""
        results = []
        for url in urls:
            try:
                content = await self.extract(url)
                results.append(content)
                print(f"✅ 成功提取: {url}")
            except Exception as e:
                print(f"❌ 提取失败 {url}: {str(e)}")
        return results
    
    async def close(self):
        """关闭浏览器"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()


# 使用示例
async def main():
    agent = WebContentExtractionAgent(openai_api_key="your-api-key")
    await agent.initialize()
    
    try:
        # 单页面提取
        result = await agent.extract("https://example.com/article")
        print(f"标题: {result.title}")
        print(f"总结: {result.summary}")
        print(f"关键要点: {result.key_points}")
        
        # 批量提取
        urls = [
            "https://example.com/article1",
            "https://example.com/article2",
        ]
        results = await agent.batch_extract(urls)
        
    finally:
        await agent.close()

if __name__ == "__main__":
    asyncio.run(main())
```

#### 4.2 API 服务封装

```python
# api_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from web_content_agent import WebContentExtractionAgent, ExtractedContent

app = FastAPI(title="网页内容提取 Agent API")

# 全局 Agent 实例
agent: Optional[WebContentExtractionAgent] = None

@app.on_event("startup")
async def startup():
    global agent
    agent = WebContentExtractionAgent(openai_api_key="your-api-key")
    await agent.initialize()

@app.on_event("shutdown")
async def shutdown():
    if agent:
        await agent.close()

class ExtractRequest(BaseModel):
    url: str
    generate_summary: bool = True

class BatchExtractRequest(BaseModel):
    urls: List[str]
    generate_summary: bool = True

@app.post("/extract")
async def extract_content(request: ExtractRequest):
    """提取单个网页内容"""
    try:
        result = await agent.extract(request.url, request.generate_summary)
        return {
            "success": True,
            "data": {
                "url": result.url,
                "title": result.title,
                "author": result.author,
                "publish_date": result.publish_date,
                "summary": result.summary,
                "key_points": result.key_points,
                "word_count": len(result.full_text),
                "image_count": len(result.images),
                "link_count": len(result.links)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/batch")
async def batch_extract(request: BatchExtractRequest):
    """批量提取网页内容"""
    results = await agent.batch_extract(request.urls)
    return {
        "success": True,
        "data": [
            {
                "url": r.url,
                "title": r.title,
                "summary": r.summary
            }
            for r in results
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "agent_ready": agent is not None}
```

## 避坑指南

### 常见错误 1：元素未加载完成就操作
```python
# ❌ 错误：直接操作
await page.click('.dynamic-button')

# ✅ 正确：等待元素就绪
await page.wait_for_selector('.dynamic-button', state='visible')
await page.click('.dynamic-button')
```

### 常见错误 2：未处理反爬虫检测
```python
# ❌ 错误：明显的自动化特征
browser = await p.chromium.launch(headless=True)

# ✅ 正确：伪装成正常浏览器
browser = await p.chromium.launch(
    headless=True,
    args=['--disable-blink-features=AutomationControlled']
)
context = await browser.new_context(
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
)
```

### 常见错误 3：未正确关闭资源
```python
# ❌ 错误：资源泄漏
browser = await p.chromium.launch()
# ... 操作 ...
# 忘记关闭

# ✅ 正确：使用上下文管理器
async with async_playwright() as p:
    browser = await p.chromium.launch()
    # ... 操作 ...
    await browser.close()  # 自动清理
```

### 常见错误 4：忽略弹窗和对话框
```python
# ✅ 处理对话框
page.on('dialog', lambda dialog: asyncio.create_task(dialog.dismiss()))

# 或接受对话框
page.on('dialog', lambda dialog: asyncio.create_task(dialog.accept()))
```

## 面试考点

### Q1: Playwright vs Puppeteer 如何选择？

**核心差异对比：**

| 特性 | Playwright | Puppeteer |
|-----|-----------|-----------|
| 浏览器支持 | Chromium/Firefox/WebKit | 仅 Chromium |
| 开发团队 | Microsoft | Google |
| 自动等待 | ✅ 内置智能等待 | ❌ 需手动处理 |
| 多语言 | Python/JS/Java/C# | 仅 Node.js |
| 移动端模拟 | ✅ 完善 | ⚠️ 有限 |
| 社区生态 | 快速增长 | 成熟稳定 |
| 性能 | 优秀 | 优秀 |

**选型建议：**
- **选 Playwright**：需要跨浏览器测试、Python 技术栈、自动等待功能
- **选 Puppeteer**：纯 Node.js 项目、需要 Chrome DevTools 深度集成

```python
# Playwright 自动等待示例
await page.click('.button')  # 自动等待元素可见和可点击

# Puppeteer 需要手动等待
await page.waitForSelector('.button', {visible: true})
await page.click('.button')
```

### Q2: 自动化测试架构如何设计？

**分层架构：**

```
┌─────────────────────────────────────┐
│         Test Cases Layer           │  ← 测试用例（BDD/Gherkin）
├─────────────────────────────────────┤
│         Page Object Layer          │  ← 页面对象封装
├─────────────────────────────────────┤
│       Action Wrapper Layer         │  ← 操作封装（点击、输入等）
├─────────────────────────────────────┤
│      Browser Control Layer         │  ← Playwright/Puppeteer
├─────────────────────────────────────┤
│      Utilities & Helpers           │  ← 截图、日志、报告
└─────────────────────────────────────┘
```

**代码示例：**

```python
# page_objects/login_page.py
class LoginPage:
    def __init__(self, page):
        self.page = page
        self.selectors = {
            'username': '#username',
            'password': '#password',
            'login_btn': '#login-button',
            'error_msg': '.error-message'
        }
    
    async def login(self, username, password):
        await self.page.fill(self.selectors['username'], username)
        await self.page.fill(self.selectors['password'], password)
        await self.page.click(self.selectors['login_btn'])
    
    async def get_error_message(self):
        return await self.page.inner_text(self.selectors['error_msg'])

# tests/test_login.py
async def test_successful_login(page):
    login_page = LoginPage(page)
    await login_page.login('valid_user', 'valid_pass')
    await expect(page).to_have_url('/dashboard')

async def test_failed_login(page):
    login_page = LoginPage(page)
    await login_page.login('invalid_user', 'wrong_pass')
    error = await login_page.get_error_message()
    assert 'Invalid credentials' in error
```

### Q3: 反爬虫策略有哪些？如何绕过？

**常见反爬虫策略：**

1. **User-Agent 检测**
```python
# 绕过：使用真实浏览器 UA
context = await browser.new_context(
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
)
```

2. **WebDriver 检测**
```python
# 绕过：禁用自动化特征
browser = await p.chromium.launch(
    args=['--disable-blink-features=AutomationControlled']
)

# 注入脚本覆盖检测
await page.add_init_script('''
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
''')
```

3. **行为检测（鼠标轨迹、点击模式）**
```python
# 绕过：模拟人类行为
await page.mouse.move(x, y, steps=10)  # 平滑移动
await page.click(selector, delay=100)   # 带延迟点击
```

4. **验证码挑战**
```python
# 方案1：使用验证码识别服务
# 方案2：接入打码平台
# 方案3：使用无头浏览器 + 机器学习识别
```

5. **IP 频率限制**
```python
# 绕过：使用代理池
proxies = ['http://proxy1:8080', 'http://proxy2:8080']
context = await browser.new_context(
    proxy={'server': random.choice(proxies)}
)
```

**反爬虫绕过完整示例：**

```python
async def create_stealth_browser():
    """创建反检测浏览器"""
    playwright = await async_playwright().start()
    
    browser = await playwright.chromium.launch(
        headless=True,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
        ]
    )
    
    context = await browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        locale='zh-CN',
        timezone_id='Asia/Shanghai',
    )
    
    # 注入反检测脚本
    await context.add_init_script('''
        // 覆盖 webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        
        // 覆盖 plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        
        // 覆盖 languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['zh-CN', 'zh', 'en']
        });
        
        // 通知权限
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({state: Notification.permission}) :
                originalQuery(parameters)
        );
    ''')
    
    return browser, context, playwright
```

### Q4: 如何处理动态加载内容？

```python
# 策略1：等待网络空闲
await page.wait_for_load_state('networkidle')

# 策略2：等待特定元素
await page.wait_for_selector('.dynamic-content', state='visible')

# 策略3：等待函数返回 true
await page.wait_for_function('() => document.querySelectorAll(".item").length > 10')

# 策略4：滚动加载
async def scroll_to_load_all():
    previous_height = 0
    while True:
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await page.wait_for_timeout(1000)
        
        current_height = await page.evaluate('document.body.scrollHeight')
        if current_height == previous_height:
            break
        previous_height = current_height
```

## 扩展阅读

- [Playwright 官方文档](https://playwright.dev/python/)
- [Puppeteer 官方文档](https://pptr.dev/)
- [自动化测试最佳实践](https://playwright.dev/docs/best-practices)
- [反爬虫技术详解](https://www.zenrows.com/blog/anti-scraping-techniques)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

## 课后练习

1. **基础练习**：使用 Playwright 编写一个脚本，自动登录某网站并截取登录后的页面截图

2. **进阶练习**：开发一个电商商品价格监控 Agent，定时抓取指定商品页面，价格变化时发送通知

3. **综合项目**：基于本节内容，开发一个「智能网页助手」Agent：
   - 接收用户指令（如"帮我预订下周三的会议室"）
   - 自动访问企业内部系统
   - 完成登录、导航、表单填写等操作
   - 返回操作结果和截图

4. **测试练习**：为某个开源项目编写 Playwright 自动化测试套件，包含：
   - 首页功能测试
   - 用户注册/登录流程测试
   - 核心业务流程测试
   - 生成测试报告
