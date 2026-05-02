---
title: "02-Agent 架构解剖与框架选型"
description: "深入解析 AI Agent 四大核心组件，对比主流框架 LangChain/LlamaIndex/AutoGen/Dify，提供技术选型决策树和实战 Demo"
---

# 02-Agent 架构解剖与框架选型

> 🎯 **岗位能力对标**：能够独立设计 Agent 架构，根据业务场景选择合适的开发框架

---

## 一、学习目标

学完本章，你将能够：

1. **理解 Agent 四大组件**的工作原理和协作方式
2. **对比主流框架**的优缺点和适用场景
3. **建立技术选型决策树**，快速判断项目该用什么框架
4. **搭建开发环境**，跑通各框架的入门 Demo
5. **应对面试**关于框架选型的常见问题

---

## 二、前置知识

在开始之前，请确保你已掌握：

- Python 基础语法和异步编程 (`async/await`)
- OpenAI API 或类似 LLM API 的基本调用
- 简单的 REST API 开发（FastAPI/Flask）
- 前端基础（React/Vue 组件概念）

---

## 三、核心概念：Agent 四大组件

### 3.1 类比理解：Agent = 前端工程师

想象 Agent 是一个**全能前端工程师**：

| 组件 | 前端工程师类比 | 核心职责 |
|------|---------------|----------|
| **LLM** | 大脑 | 理解需求、做决策、生成代码 |
| **Tools** | 工具链 | npm、webpack、Chrome DevTools |
| **Memory** | 工作笔记 | 记录需求变更、记住项目上下文 |
| **Planning** | 项目管理 | 拆解任务、排优先级、执行计划 |

### 3.2 LLM（大脑）

```python
# 最简单的 LLM 调用 - 就像调用一个 API
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "你是一个专业的前端开发助手"},
        {"role": "user", "content": "写一个 React 计数器组件"}
    ]
)

print(response.choices[0].message.content)
```

**关键概念**：
- **System Prompt**：设定角色和能力边界（像给工程师定 KPI）
- **Temperature**：控制创意程度（0=保守，1=放飞自我）
- **Max Tokens**：输出长度限制（像代码 review 的字数限制）

### 3.3 Tools（工具）

```python
# Tool = 可调用的函数，Agent 根据需求决定用哪个
import json

def search_npm(package_name: str) -> str:
    """搜索 npm 包信息"""
    # 模拟调用 npm API
    return json.dumps({
        "name": package_name,
        "version": "1.2.3",
        "downloads": "1M/week"
    })

def run_linter(code: str) -> str:
    """运行 ESLint 检查代码"""
    # 模拟 lint 结果
    return "✅ 没有发现问题"

# Tools 列表 - 像工程师的工具箱
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_npm",
            "description": "搜索 npm 包的信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "package_name": {"type": "string"}
                },
                "required": ["package_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_linter",
            "description": "运行代码检查工具",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string"}
                },
                "required": ["code"]
            }
        }
    }
]
```

### 3.4 Memory（记忆）

```python
# Memory = 会话历史 + 长期知识
class AgentMemory:
    def __init__(self):
        # 短期记忆：当前对话上下文
        self.short_term = []
        # 长期记忆：关键信息摘要
        self.long_term = {}
    
    def add_message(self, role: str, content: str):
        """添加对话记录"""
        self.short_term.append({"role": role, "content": content})
        # 保持最近 10 轮对话
        if len(self.short_term) > 20:
            self.short_term = self.short_term[-20:]
    
    def save_fact(self, key: str, value: str):
        """保存长期记忆"""
        self.long_term[key] = value
    
    def get_context(self) -> list:
        """获取完整上下文"""
        system_msg = {
            "role": "system", 
            "content": f"已知信息：{self.long_term}"
        }
        return [system_msg] + self.short_term

# 使用示例
memory = AgentMemory()
memory.add_message("user", "我叫张三，做前端 5 年了")
memory.save_fact("user_name", "张三")
memory.save_fact("user_experience", "5 年前端")
```

### 3.5 Planning（规划）

```python
# Planning = 把复杂任务拆成可执行的步骤
class TaskPlanner:
    def plan(self, goal: str) -> list:
        """根据目标生成执行计划"""
        # 实际项目中，这里会让 LLM 生成计划
        if "开发" in goal and "组件" in goal:
            return [
                {"step": 1, "action": "分析需求", "tool": None},
                {"step": 2, "action": "搜索相关 npm 包", "tool": "search_npm"},
                {"step": 3, "action": "编写组件代码", "tool": None},
                {"step": 4, "action": "运行代码检查", "tool": "run_linter"},
                {"step": 5, "action": "生成测试用例", "tool": None}
            ]
        return [{"step": 1, "action": goal, "tool": None}]
    
    def execute(self, plan: list, memory: AgentMemory):
        """执行计划"""
        for task in plan:
            print(f"执行步骤 {task['step']}: {task['action']}")
            if task['tool']:
                print(f"  -> 调用工具: {task['tool']}")
            memory.add_message("assistant", f"完成: {task['action']}")

# 使用示例
planner = TaskPlanner()
plan = planner.plan("开发一个 React 表单组件")
planner.execute(plan, memory)
```

---

## 四、主流框架对比

### 4.1 框架概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent 框架生态全景                        │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   LangChain  │  LlamaIndex  │   AutoGen    │     Dify       │
├──────────────┼──────────────┼──────────────┼────────────────┤
│  瑞士军刀型  │  知识库专家  │  多 Agent    │   低代码平台   │
│  功能全面    │  RAG 强项    │  协作框架    │   快速搭建     │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### 4.2 详细对比表

| 维度 | LangChain | LlamaIndex | AutoGen | Dify |
|------|-----------|------------|---------|------|
| **定位** | 通用框架 | 数据检索增强 | 多 Agent 协作 | 可视化搭建 |
| **学习曲线** | 中等 | 较低 | 较高 | 低 |
| **RAG 能力** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Multi-Agent** | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **生态丰富度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **企业级支持** | 有 (LCSE) | 有 | 较弱 | 有 (商业版) |
| **部署方式** | 代码集成 | 代码集成 | 代码集成 | Docker/云 |

### 4.3 各框架详解

#### LangChain - "瑞士军刀"

```python
# LangChain 核心概念：Chain = 流水线
from langchain import OpenAI, LLMChain, PromptTemplate
from langchain.agents import Tool, AgentExecutor, initialize_agent
from langchain.memory import ConversationBufferMemory

# 1. 定义 Tool（工具）
tools = [
    Tool(
        name="搜索",
        func=lambda x: "搜索结果是：...",
        description="用于搜索信息"
    ),
    Tool(
        name="计算",
        func=lambda x: str(eval(x)),
        description="用于数学计算"
    )
]

# 2. 初始化 Memory（记忆）
memory = ConversationBufferMemory(memory_key="chat_history")

# 3. 创建 Agent（大脑 + 规划）
llm = OpenAI(temperature=0)
agent = initialize_agent(
    tools, 
    llm, 
    agent="conversational-react-description",
    memory=memory,
    verbose=True
)

# 4. 运行
response = agent.run("搜索 React 最新版本，然后计算 23+19")
```

**优点**：
- 生态最丰富，集成 1000+ 工具
- 文档完善，社区活跃
- LCEL (LangChain Expression Language) 语法简洁

**缺点**：
- 版本迭代快，API 经常变动
- 抽象层较厚，调试困难
- 性能开销较大

#### LlamaIndex - "知识库专家"

```python
# LlamaIndex 核心概念：Index = 数据索引
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from llama_index.query_engine import RetrieverQueryEngine

# 1. 加载文档（像把设计稿导入项目）
documents = SimpleDirectoryReader("./docs").load_data()

# 2. 构建索引（像建立组件库）
index = VectorStoreIndex.from_documents(documents)

# 3. 创建查询引擎
query_engine = index.as_query_engine()

# 4. 查询（RAG 检索增强生成）
response = query_engine.query("项目的技术栈是什么？")
print(response)
```

**优点**：
- RAG 场景最强，索引方式多样
- 与 LangChain 可以无缝集成
- 数据连接器丰富（PDF、DB、API）

**缺点**：
- 非 RAG 场景功能较弱
- 多 Agent 支持有限

#### AutoGen - "多 Agent 协作"

```python
# AutoGen 核心概念：多 Agent 对话
from autogen import AssistantAgent, UserProxyAgent, GroupChat

# 1. 创建角色（像组建开发团队）
code_assistant = AssistantAgent(
    name="coder",
    system_message="你是资深前端工程师，擅长 React 和 Vue",
    llm_config={"config_list": [{"model": "gpt-4", "api_key": "..."}]}
)

reviewer = AssistantAgent(
    name="reviewer", 
    system_message="你是代码审查专家，检查代码质量和规范",
    llm_config={"config_list": [{"model": "gpt-4", "api_key": "..."}]}
)

user_proxy = UserProxyAgent(
    name="user",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10
)

# 2. 创建群聊（像站会）
groupchat = GroupChat(
    agents=[user_proxy, code_assistant, reviewer],
    messages=[],
    max_round=12
)

# 3. 启动对话
user_proxy.initiate_chat(
    code_assistant,
    message="帮我写一个登录表单组件"
)
```

**优点**：
- 多 Agent 协作模式创新
- 适合复杂任务分解
- 代码执行环境内置

**缺点**：
- 学习曲线陡峭
- 调试复杂对话困难
- 文档相对不足

#### Dify - "低代码平台"

```yaml
# Dify 配置示例（可视化界面配置后导出）
app:
  name: "前端助手"
  mode: "chat"
  
model:
  provider: "openai"
  name: "gpt-4"
  temperature: 0.7

tools:
  - name: "npm_search"
    type: "api"
    config:
      endpoint: "https://registry.npmjs.org/"
  
  - name: "code_linter"
    type: "custom"
    code: |
      def lint(code):
          # 自定义 lint 逻辑
          return {"status": "ok"}

prompt:
  system: |
    你是专业前端开发助手，帮助用户：
    1. 搜索 npm 包
    2. 审查代码
    3. 生成组件
```

**优点**：
- 可视化界面，无需代码
- 快速原型验证
- 内置运营分析

**缺点**：
- 灵活性受限
- 复杂逻辑难以实现
- 私有化部署成本高

---

## 五、技术选型决策树

### 5.1 决策流程图

```
                    开始选型
                       │
            ┌─────────┴─────────┐
            ▼                   ▼
       需要多 Agent？        单 Agent？
            │                   │
       是 ──┼── 否          是 ──┼── 否
            ▼                   ▼
      ┌──────────┐        ┌──────────┐
      │  AutoGen │        │ 需要 RAG？│
      └──────────┘        └────┬─────┘
                                 │
                            是 ──┼── 否
                                 ▼
                          ┌──────────┐
                          │ 需要快速 │
                          │ 上线？   │
                          └────┬─────┘
                               │
                          是 ──┼── 否
                               ▼
                    ┌──────────────────┐
                    │ 团队技术栈？      │
                    └────┬──────┬──────┘
                         │      │
                    Python   可视化/低代码
                         │      │
                         ▼      ▼
                   ┌────────┐ ┌──────┐
                   │LangChain│ │ Dify │
                   │LlamaIndex│      │
                   └────────┘ └──────┘
```

### 5.2 场景匹配表

| 场景 | 推荐框架 | 理由 |
|------|----------|------|
| 快速搭建客服机器人 | Dify | 可视化配置，1 天上線 |
| 企业知识库问答 | LlamaIndex | RAG 能力最强 |
| 复杂任务自动化 | LangChain | 工具链丰富，生态成熟 |
| 多角色协作系统 | AutoGen | 原生支持多 Agent |
| 既有项目集成 | LangChain | 中间件设计，侵入性低 |
| 原型验证/MVP | Dify | 无需开发，配置即上线 |

---

## 六、动手实战

### 6.1 环境搭建

```bash
# 创建项目目录
mkdir ai-agent-demos && cd ai-agent-demos

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install langchain langchain-openai llama-index pyautogen

# 设置环境变量
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # 如需代理
```

### 6.2 LangChain Demo

```python
# demo_langchain.py
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory

# 1. 定义工具
@tool
def multiply(a: int, b: int) -> int:
    """计算两个数的乘积"""
    return a * b

@tool
def search_frontend_lib(query: str) -> str:
    """搜索前端库信息"""
    libs = {
        "react": "React 18 - 最流行的 UI 库",
        "vue": "Vue 3 - 渐进式框架",
        "angular": "Angular 17 - 企业级框架"
    }
    return libs.get(query.lower(), f"未找到 {query} 的信息")

tools = [multiply, search_frontend_lib]

# 2. 创建 Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是专业前端助手，可以搜索库信息和进行计算"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# 3. 初始化
llm = ChatOpenAI(model="gpt-4", temperature=0)
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 4. 运行
memory = ConversationBufferMemory(return_messages=True, memory_key="chat_history")

response = agent_executor.invoke({
    "input": "React 和 Vue 哪个更好？先搜索一下它们的信息",
    "chat_history": memory.chat_memory.messages
})

print("回答:", response["output"])
```

运行：
```bash
python demo_langchain.py
```

### 6.3 LlamaIndex Demo

```python
# demo_llamaindex.py
from llama_index.core import VectorStoreIndex, Document
from llama_index.llms.openai import OpenAI

# 1. 准备文档（模拟前端知识库）
docs = [
    Document(text="""
    React 18 新特性：
    1. Concurrent Rendering 并发渲染
    2. Automatic Batching 自动批处理
    3. Suspense 改进
    4. 新的 Hooks：useId, useDeferredValue
    """),
    Document(text="""
    Vue 3 Composition API：
    1. setup() 函数
    2. ref() 和 reactive()
    3. computed 和 watch
    4. 生命周期钩子
    """),
    Document(text="""
    TypeScript 最佳实践：
    1. 启用 strict 模式
    2. 使用 interface 定义类型
    3. 避免使用 any
    4. 合理使用泛型
    """)
]

# 2. 构建索引
index = VectorStoreIndex.from_documents(docs)

# 3. 创建查询引擎
query_engine = index.as_query_engine(
    llm=OpenAI(model="gpt-4")
)

# 4. 查询
questions = [
    "React 18 有什么新特性？",
    "Vue 3 的 Composition API 怎么用？",
    "TypeScript 严格模式有什么好处？"
]

for q in questions:
    print(f"\n❓ {q}")
    response = query_engine.query(q)
    print(f"💡 {response}")
```

### 6.4 AutoGen Demo

```python
# demo_autogen.py
import autogen

# 配置 LLM
config_list = [{
    "model": "gpt-4",
    "api_key": "your-api-key"
}]

# 创建 Agent
assistant = autogen.AssistantAgent(
    name="frontend_expert",
    system_message="""你是资深前端架构师，擅长：
    1. 技术选型分析
    2. 组件设计
    3. 性能优化
    请提供详细的技术方案。""",
    llm_config={"config_list": config_list}
)

user_proxy = autogen.UserProxyAgent(
    name="user",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=5,
    code_execution_config={"work_dir": "coding", "use_docker": False}
)

# 开始对话
task = """
我需要开发一个电商后台管理系统，包含：
1. 商品管理（CRUD）
2. 订单管理
3. 数据可视化仪表盘

请帮我：
1. 推荐技术栈
2. 设计项目结构
3. 给出核心组件示例
"""

user_proxy.initiate_chat(assistant, message=task)
```

### 6.5 Dify 快速体验

```bash
# Docker 一键启动
docker run -it -p 80:80 -p 443:443 dify/dify-all-in-one:latest

# 访问 http://localhost 开始配置
```

配置步骤：
1. 注册账号 → 创建应用
2. 选择 "Chatbot" 类型
3. 配置模型（OpenAI/Anthropic/本地）
4. 编写 System Prompt
5. 添加 Tools（可选）
6. 发布并获取 API

```python
# 调用 Dify API
import requests

API_KEY = "your-dify-api-key"
BASE_URL = "http://localhost/v1"

response = requests.post(
    f"{BASE_URL}/chat-messages",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "inputs": {},
        "query": "写一个 React 按钮组件",
        "response_mode": "blocking",
        "conversation_id": "",
        "user": "demo-user"
    }
)

print(response.json()["answer"])
```

---

## 七、避坑指南

### 7.1 LangChain 避坑

```python
# ❌ 错误：直接传递字符串给 Memory
memory.save_context("用户说你好", "助手回复你好")

# ✅ 正确：传递字典格式
memory.save_context(
    {"input": "用户说你好"}, 
    {"output": "助手回复你好"}
)

# ❌ 错误：混用新旧版本 API
from langchain import OpenAI  # 旧版
from langchain_openai import ChatOpenAI  # 新版

# ✅ 正确：统一使用新版
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")
```

### 7.2 LlamaIndex 避坑

```python
# ❌ 错误：直接查询未索引的文档
index = VectorStoreIndex([])  # 空索引
response = index.query("问题")  # 报错或返回空

# ✅ 正确：确保文档已正确加载
documents = SimpleDirectoryReader("./data").load_data()
if not documents:
    raise ValueError("没有加载到文档，请检查路径")
index = VectorStoreIndex.from_documents(documents)

# ❌ 错误：忽略节点大小限制
# 长文档被截断，丢失信息

# ✅ 正确：设置合适的 chunk 大小
from llama_index.core.node_parser import SentenceSplitter
parser = SentenceSplitter(chunk_size=512, chunk_overlap=50)
nodes = parser.get_nodes_from_documents(documents)
index = VectorStoreIndex(nodes)
```

### 7.3 AutoGen 避坑

```python
# ❌ 错误：Agent 陷入无限循环
# 没有设置 max_consecutive_auto_reply

# ✅ 正确：设置对话轮数限制
user_proxy = UserProxyAgent(
    name="user",
    max_consecutive_auto_reply=10,  # 最多 10 轮
    is_termination_msg=lambda x: "TERMINATE" in x.get("content", "")
)

# ❌ 错误：多个 Agent 使用同一个 LLM 配置对象
config = {"config_list": [...]}
agent1 = AssistantAgent("a1", llm_config=config)
agent2 = AssistantAgent("a2", llm_config=config)  # 共享配置可能导致问题

# ✅ 正确：每个 Agent 独立配置
agent1 = AssistantAgent("a1", llm_config={"config_list": [...]})
agent2 = AssistantAgent("a2", llm_config={"config_list": [...]})
```

### 7.4 通用最佳实践

```python
# 1. 始终处理 API 错误
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def call_llm_with_retry(prompt):
    return llm.invoke(prompt)

# 2. 控制 Token 消耗
def estimate_tokens(text: str) -> int:
    """估算 token 数量（英文 ≈ 字符/4，中文 ≈ 字符/2）"""
    return len(text) // 3

# 3. 敏感信息脱敏
import re

def mask_sensitive_info(text: str) -> str:
    """隐藏敏感信息"""
    # 隐藏 API Key
    text = re.sub(r'sk-[a-zA-Z0-9]{48}', '[API_KEY]', text)
    # 隐藏手机号
    text = re.sub(r'1[3-9]\d{9}', '[PHONE]', text)
    return text

# 4. 超时控制
import asyncio

async def call_with_timeout(coro, timeout=30):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        return {"error": "请求超时"}
```

---

## 八、面试考点

### 8.1 高频问题

**Q1: LangChain 和 LlamaIndex 有什么区别？什么时候用哪个？**

> **答题思路**：
> - LangChain 是通用框架，侧重工具链和 Agent 编排
> - LlamaIndex 专注数据检索（RAG），索引能力强
> - 需要复杂工具调用 → LangChain
> - 主要做知识库问答 → LlamaIndex
> - 两者可以结合使用

**Q2: AutoGen 的多 Agent 模式有什么优势和局限？**

> **答题思路**：
> - 优势：任务自动分解、角色专业化、自纠错能力
> - 局限：调试困难、成本高（多轮对话）、可能陷入循环
> - 适用：复杂任务、代码生成、需要多角色协作的场景

**Q3: 如何选择 Agent 开发框架？**

> **答题思路（按决策树回答）**：
> 1. 先判断是否需要多 Agent → AutoGen
> 2. 再看是否需要强 RAG → LlamaIndex
> 3. 然后看团队技术栈和上线时间
> 4. 最后考虑生态和维护成本

**Q4: Agent 的四大组件是什么？它们如何协作？**

> **答题思路**：
> - LLM：决策中心，理解意图、生成计划
> - Tools：执行能力，扩展 Agent 边界
> - Memory：上下文管理，短期+长期记忆
> - Planning：任务拆解，多步执行
> - 协作流程：输入 → LLM 理解 → Planning 拆解 → Tools 执行 → Memory 记录 → 循环直到完成

### 8.2 代码题

**题目：实现一个简单的 ReAct Agent**

```python
# 面试代码题：实现 ReAct 循环
import re

class SimpleReActAgent:
    """
    ReAct = Reasoning (思考) + Acting (行动)
    循环：Thought -> Action -> Observation -> ... -> Answer
    """
    
    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = {t.__name__: t for t in tools}
        self.max_iterations = 5
    
    def run(self, query: str) -> str:
        prompt = f"""你是一个助手，可以调用以下工具：
{list(self.tools.keys())}

请按以下格式回复：
Thought: 你的思考过程
Action: 工具名称
Action Input: 工具输入

或者当任务完成时：
Final Answer: 最终答案

问题：{query}
"""
        
        for i in range(self.max_iterations):
            response = self.llm(prompt)
            print(f"\n--- 第 {i+1} 轮 ---")
            print(response)
            
            # 解析 Thought
            thought_match = re.search(r'Thought: (.+)', response)
            if thought_match:
                print(f"思考: {thought_match.group(1)}")
            
            # 解析 Action
            action_match = re.search(r'Action: (\w+)', response)
            action_input_match = re.search(r'Action Input: (.+)', response)
            
            if action_match and action_input_match:
                action = action_match.group(1)
                action_input = action_input_match.group(1)
                
                if action in self.tools:
                    result = self.tools[action](action_input)
                    prompt += f"\nObservation: {result}\n"
                else:
                    prompt += f"\nObservation: 工具 {action} 不存在\n"
            
            # 检查是否完成
            if "Final Answer" in response:
                return response.split("Final Answer:")[1].strip()
        
        return "达到最大迭代次数，未找到答案"

# 使用示例
def search(query: str) -> str:
    return f"搜索 '{query}' 的结果：React 18 发布于 2022 年"

def calculate(expr: str) -> str:
    try:
        return str(eval(expr))
    except:
        return "计算错误"

# 模拟 LLM
class MockLLM:
    def __call__(self, prompt: str) -> str:
        if "React" in prompt and "Thought" not in prompt:
            return """Thought: 用户询问 React 发布时间，我需要搜索
Action: search
Action Input: React 发布时间"""
        elif "2022" in prompt:
            return """Thought: 我已经找到答案
Final Answer: React 18 发布于 2022 年"""
        return "Final Answer: 我不知道"

# 运行
agent = SimpleReActAgent(MockLLM(), [search, calculate])
result = agent.run("React 什么时候发布的？")
print(f"\n最终结果: {result}")
```

---

## 九、扩展阅读

### 9.1 官方文档

- [LangChain 文档](https://python.langchain.com/)
- [LlamaIndex 文档](https://docs.llamaindex.ai/)
- [AutoGen 文档](https://microsoft.github.io/autogen/)
- [Dify 文档](https://docs.dify.ai/)

### 9.2 进阶资源

- [ReAct 论文](https://arxiv.org/abs/2210.03629) - Agent 推理+行动范式
- [LangGraph](https://langchain-ai.github.io/langgraph/) - LangChain 的工作流编排
- [CrewAI](https://docs.crewai.com/) - 另一个多 Agent 框架
- [MetaGPT](https://github.com/geekan/MetaGPT) - 多 Agent 软件开发框架

### 9.3 社区项目

- [LangChain Templates](https://github.com/langchain-ai/langchain/tree/master/templates) - 官方模板库
- [Awesome LangChain](https://github.com/kyrolabs/awesome-langchain) - 资源汇总
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook) - 官方示例

---

## 十、课后练习

### 练习 1：框架对比调研

调研你所在公司或感兴趣的业务场景，完成以下表格：

| 评估维度 | 权重 | LangChain | LlamaIndex | AutoGen | Dify |
|---------|------|-----------|------------|---------|------|
| 功能匹配度 | 30% | ?/10 | ?/10 | ?/10 | ?/10 |
| 学习成本 | 20% | ?/10 | ?/10 | ?/10 | ?/10 |
| 维护成本 | 20% | ?/10 | ?/10 | ?/10 | ?/10 |
| 生态支持 | 15% | ?/10 | ?/10 | ?/10 | ?/10 |
| 性能表现 | 15% | ?/10 | ?/10 | ?/10 | ?/10 |
| **加权总分** | 100% | ? | ? | ? | ? |

### 练习 2：实现工具调用

基于 LangChain 实现一个前端开发助手，包含以下工具：
1. `search_component` - 搜索组件库文档
2. `generate_code` - 生成代码模板
3. `review_code` - 简单代码审查

要求：
- 使用 `@tool` 装饰器定义工具
- 实现 Memory 保持对话上下文
- 处理工具调用错误

### 练习 3：多 Agent 协作

使用 AutoGen 实现一个简单的 "代码评审流程"：

1. **Developer Agent** - 编写代码
2. **Reviewer Agent** - 审查代码并提出修改意见
3. **User Proxy** - 确认最终版本

场景：开发一个 React Todo List 组件

### 练习 4：RAG 知识库

使用 LlamaIndex 搭建个人技术笔记问答系统：

1. 收集你的技术笔记（Markdown 格式）
2. 构建向量索引
3. 实现问答接口（FastAPI）
4. 前端展示页面（React/Vue）

### 练习 5：技术选型报告

假设你要为公司选择一个 Agent 开发框架，撰写一份技术选型报告，包含：

1. 业务背景和需求分析
2. 候选框架对比
3. POC 验证结果
4. 最终推荐和理由
5. 实施计划和风险

---

## 总结

本章我们深入解析了 Agent 的四大核心组件：

- **LLM**：决策大脑，负责理解和生成
- **Tools**：扩展能力，连接外部世界
- **Memory**：记忆系统，维护上下文
- **Planning**：规划执行，拆解复杂任务

对比了四大主流框架：

- **LangChain**：功能全面，生态丰富，适合大多数场景
- **LlamaIndex**：RAG 专家，知识库首选
- **AutoGen**：多 Agent 协作，适合复杂任务
- **Dify**：低代码平台，快速上线

记住：**没有最好的框架，只有最合适的框架**。选型时要结合业务需求、团队能力和时间成本综合考虑。

---

> 📚 **下章预告**：03-LLM 接口与 Prompt 工程 - 深入掌握与 LLM 的交互艺术
