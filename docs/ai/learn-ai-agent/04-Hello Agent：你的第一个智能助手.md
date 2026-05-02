# 04-Hello Agent：你的第一个智能助手

> 从零开始，用 LangChain 搭建你的第一个 AI Agent，理解 Tool Calling 的核心机制。

---

## 学习目标

- 掌握 LangChain Agent 的基本架构和使用方法
- 深入理解 Tool Calling（函数调用）机制
- 学习 Prompt Engineering 的基础技巧
- 实战开发一个「前端代码审查助手」

---

## 1. 什么是 Agent？

### 1.1 Agent 的定义

Agent（智能体）是一个能够**感知环境、做出决策并执行动作**的 AI 系统。与单纯的聊天机器人不同，Agent 可以：

- **调用外部工具**（搜索、计算、数据库查询等）
- **自主规划任务**（分解复杂问题，逐步执行）
- **记忆上下文**（维护对话历史和状态）

```
┌─────────────────────────────────────────┐
│              Agent Core                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  LLM    │  │ Memory  │  │ Planner │ │
│  │ (大脑)   │  │ (记忆)   │  │ (规划)   │ │
│  └────┬────┘  └─────────┘  └─────────┘ │
│       │                                 │
│       ▼                                 │
│  ┌─────────────────────────────────┐    │
│  │         Tool Calling            │    │
│  │    ┌─────┐ ┌─────┐ ┌─────┐    │    │
│  │    │Tool1│ │Tool2│ │Tool3│    │    │
│  │    └─────┘ └─────┘ └─────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 1.2 Agent vs Chain

| 特性 | Chain | Agent |
|------|-------|-------|
| 执行流程 | 固定、线性 | 动态、决策驱动 |
| 工具调用 | 预定义顺序 | 根据输入自主选择 |
| 灵活性 | 低 | 高 |
| 适用场景 | 确定性任务 | 开放式、复杂任务 |

---

## 2. 使用 LangChain 搭建第一个 Agent

### 2.1 环境准备

```bash
# 安装依赖
pip install langchain langchain-openai python-dotenv

# 设置环境变量
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # 可选，用于自定义端点
```

### 2.2 第一个 Agent 示例

```python
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool

# ========== 1. 定义工具 ==========
@tool
def calculate(expression: str) -> str:
    """执行数学计算，输入应为有效的数学表达式，如：2 + 3 * 4"""
    try:
        # 使用 ast 模块安全地计算数学表达式
        import ast
        import operator
        
        # 定义允许的操作符
        allowed_operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Pow: operator.pow,
            ast.USub: operator.neg,
        }
        
        def eval_node(node):
            if isinstance(node, ast.Num):  # Python 3.7
                return node.n
            elif isinstance(node, ast.Constant):  # Python 3.8+
                return node.value
            elif isinstance(node, ast.BinOp):
                op_type = type(node.op)
                if op_type not in allowed_operators:
                    raise ValueError(f"不支持的操作符: {op_type.__name__}")
                left = eval_node(node.left)
                right = eval_node(node.right)
                return allowed_operators[op_type](left, right)
            elif isinstance(node, ast.UnaryOp):
                if type(node.op) not in allowed_operators:
                    raise ValueError(f"不支持的一元操作符: {type(node.op).__name__}")
                operand = eval_node(node.operand)
                return allowed_operators[type(node.op)](operand)
            else:
                raise ValueError(f"不支持的表达式类型: {type(node).__name__}")
        
        # 解析表达式
        parsed = ast.parse(expression.strip(), mode='eval')
        result = eval_node(parsed.body)
        
        return f"计算结果: {result}"
    except Exception as e:
        return f"计算错误: {str(e)}。请提供有效的数学表达式，如：2 + 3 * 4"

@tool
def search_code(query: str) -> str:
    """搜索代码相关的文档和示例"""
    # 模拟搜索结果
    return f"找到关于 '{query}' 的 5 个相关代码示例..."

# 工具列表
tools = [calculate, search_code]

# ========== 2. 创建 LLM ==========
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0
)

# ========== 3. 创建 Prompt ==========
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个 helpful 的 AI 助手，可以使用工具来帮助用户解决问题。"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# ========== 4. 创建 Agent ==========
agent = create_openai_functions_agent(llm, tools, prompt)

# ========== 5. 创建执行器 ==========
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True  # 打印执行过程
)

# ========== 6. 运行 Agent ==========
response = agent_executor.invoke({
    "input": "计算 123 * 456，然后搜索 Python 列表推导式的用法",
    "chat_history": []
})

print(response["output"])
```

### 2.3 运行结果解析

```
> Entering new AgentExecutor chain...

# 第一步：Agent 决定调用 calculate 工具
Invoking: `calculate` with `{'expression': '123 * 456'}`

# 工具返回结果
计算结果: 56088

# 第二步：Agent 决定调用 search_code 工具
Invoking: `search_code` with `{'query': 'Python 列表推导式'}`

# 工具返回结果
找到关于 'Python 列表推导式' 的 5 个相关代码示例...

# Agent 整合结果并输出
123 * 456 = 56088

关于 Python 列表推导式，我找到了以下相关信息：
...

> Finished chain.
```

---

## 3. Tool Calling 机制详解

### 3.1 什么是 Tool Calling？

Tool Calling（工具调用/函数调用）是 LLM 与外部世界交互的核心机制。它允许模型：

1. **识别**需要调用工具的场景
2. **生成**符合规范的函数调用请求
3. **解析**工具返回的结果
4. **整合**结果到最终回答

### 3.2 函数调用协议

```python
# OpenAI Function Calling 格式
{
    "model": "gpt-4",
    "messages": [...],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "calculate",
                "description": "执行数学计算",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "数学表达式"
                        }
                    },
                    "required": ["expression"]
                }
            }
        }
    ]
}
```

### 3.3 调用流程详解

```
┌──────────────┐
│   用户输入    │
└──────┬───────┘
       ▼
┌──────────────┐     ┌──────────────────┐
│   LLM 判断    │────▶│ 是否需要调用工具？ │
└──────┬───────┘     └──────────────────┘
       │
       ├─ 否 ──▶ 直接生成文本回答
       │
       ▼ 是
┌──────────────┐
│ 生成工具调用  │
│  name: xxx   │
│  args: {...} │
└──────┬───────┘
       ▼
┌──────────────┐
│  执行工具函数  │
└──────┬───────┘
       ▼
┌──────────────┐
│  返回执行结果  │
└──────┬───────┘
       ▼
┌──────────────┐
│  LLM 整合结果 │
└──────┬───────┘
       ▼
┌──────────────┐
│   最终输出    │
└──────────────┘
```

### 3.4 LangChain 中的 Tool 定义

```python
from langchain.tools import tool
from typing import Optional

# 方式 1：使用装饰器（推荐）
@tool
def get_weather(location: str, unit: str = "celsius") -> str:
    """获取指定城市的天气信息
    
    Args:
        location: 城市名称，如"北京"、"上海"
        unit: 温度单位，"celsius" 或 "fahrenheit"
    """
    # 实现逻辑
    return f"{location} 今天晴天，25{unit[0].upper()}"

# 方式 2：继承 BaseTool
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    location: str = Field(description="城市名称")
    unit: str = Field(default="celsius", description="温度单位")

class WeatherTool(BaseTool):
    name = "get_weather"
    description = "获取指定城市的天气信息"
    args_schema = WeatherInput
    
    def _run(self, location: str, unit: str = "celsius") -> str:
        return f"{location} 今天晴天，25{unit[0].upper()}"
    
    async def _arun(self, location: str, unit: str = "celsius") -> str:
        raise NotImplementedError("不支持异步")
```

### 3.5 工具描述的重要性

工具描述（docstring）直接影响 Agent 选择工具的准确性：

```python
# ❌ 不好的描述
@tool
def func(a: str, b: int) -> str:
    """这是一个工具函数"""
    pass

# ✅ 好的描述
@tool
def calculate_compound_interest(
    principal: float, 
    rate: float, 
    years: int
) -> str:
    """计算复利收益
    
    用于计算投资在指定年限后的本息总额。
    适用场景：理财规划、投资收益估算。
    
    Args:
        principal: 本金金额（元）
        rate: 年利率，如 0.05 表示 5%
        years: 投资年限
        
    Returns:
        包含最终金额和总收益的字符串
        
    Example:
        principal=10000, rate=0.05, years=10
        返回：本息合计 16288.95 元，收益 6288.95 元
    """
    final = principal * (1 + rate) ** years
    profit = final - principal
    return f"本息合计 {final:.2f} 元，收益 {profit:.2f} 元"
```

---

## 4. Prompt Engineering 基础

### 4.1 角色定义（System Prompt）

```python
system_prompt = """你是一位专业的前端代码审查专家，具备以下特质：

【角色定位】
- 拥有 10 年前端开发经验
- 精通 React、Vue、TypeScript
- 注重代码质量和最佳实践

【审查原则】
1. 安全性：检查 XSS、注入等安全风险
2. 性能：关注不必要的重渲染、内存泄漏
3. 可维护性：代码结构、命名规范、注释
4. 可访问性：ARIA 标签、键盘导航

【输出格式】
- 使用 Markdown 格式
- 按严重程度分级：🔴 严重 / 🟡 警告 / 🟢 建议
- 每个问题提供：位置、描述、修复建议、参考链接

【交互风格】
- 专业但友善
- 解释"为什么"而不仅是"是什么"
- 提供具体的代码示例
"""
```

### 4.2 输出格式控制

```python
from langchain.output_parsers import StructuredOutputParser, ResponseSchema

# 定义输出结构
response_schemas = [
    ResponseSchema(name="severity", description="问题严重程度: critical/warning/info"),
    ResponseSchema(name="category", description="问题类别: security/performance/maintainability/accessibility"),
    ResponseSchema(name="location", description="代码位置，如文件名和行号"),
    ResponseSchema(name="description", description="问题描述"),
    ResponseSchema(name="suggestion", description="修复建议，包含代码示例"),
    ResponseSchema(name="reference", description="参考文档链接"),
]

output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
format_instructions = output_parser.get_format_instructions()

# 在 Prompt 中使用
prompt = f"""
审查以下代码并提供反馈。

{format_instructions}

代码：
```jsx
{code}
```
"""
```

### 4.3 Few-Shot Prompting

```python
from langchain_core.prompts import FewShotChatMessagePromptTemplate

examples = [
    {
        "input": "```jsx\nconst App = () => {\n  const [user, setUser] = useState(null);\n  return <div>{user.name}</div>;\n};\n```",
        "output": """🔴 严重：空值访问风险
- **位置**：第 4 行
- **问题**：`user.name` 可能在 `user` 为 null 时导致运行时错误
- **修复**：
  ```jsx
  return <div>{user?.name || 'Guest'}</div>;
  ```
"""
    },
    {
        "input": "```jsx\nuseEffect(() => {\n  fetch('/api/data').then(r => r.json()).then(setData);\n}, []);\n```",
        "output": """🟡 警告：缺少错误处理
- **位置**：useEffect 钩子
- **问题**：API 请求失败时未处理错误
- **修复**：
  ```jsx
  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('Failed to fetch:', err));
  }, []);
  ```
"""
    }
]

example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
])

few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
)
```

---

## 5. 实战：前端代码审查助手

### 5.1 完整代码实现

```python
import os
from typing import List, Dict
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage

# ========== 定义工具 ==========

@tool
def analyze_imports(code: str) -> str:
    """分析代码中的导入语句，检查未使用的导入和循环依赖"""
    # 简化的实现示例
    lines = code.split('\n')
    imports = [line for line in lines if line.strip().startswith('import') or line.strip().startswith('from')]
    return f"发现 {len(imports)} 个导入语句:\n" + '\n'.join(imports[:5])

@tool
def check_security_issues(code: str) -> str:
    """检查常见的安全漏洞，如 XSS、eval、innerHTML 等"""
    issues = []
    
    dangerous_patterns = [
        ('innerHTML', '可能引发 XSS 攻击'),
        ('eval(', '危险的代码执行'),
        ('dangerouslySetInnerHTML', 'React XSS 风险'),
        ('document.write', '不推荐的做法'),
    ]
    
    for pattern, risk in dangerous_patterns:
        if pattern in code:
            issues.append(f"发现 '{pattern}' - {risk}")
    
    return '\n'.join(issues) if issues else "未发现明显的安全问题"

@tool
def check_performance_issues(code: str) -> str:
    """检查性能问题，如不必要的重渲染、内存泄漏等"""
    suggestions = []
    
    if 'useState' in code and 'useCallback' not in code:
        suggestions.append("考虑使用 useCallback 缓存事件处理函数")
    
    if 'useEffect' in code:
        suggestions.append("检查 useEffect 依赖数组是否完整")
    
    return '\n'.join(suggestions) if suggestions else "暂无性能建议"

# ========== 创建 Agent ==========

def create_code_review_agent():
    """创建前端代码审查 Agent"""
    
    # 工具列表
    tools = [analyze_imports, check_security_issues, check_performance_issues]
    
    # LLM
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    # System Prompt
    system_prompt = """你是一位专业的前端代码审查专家。

你的任务：
1. 使用可用工具分析代码
2. 识别潜在问题和改进点
3. 提供清晰、可操作的反馈

审查维度：
- 安全性：XSS、注入攻击等
- 性能：渲染优化、内存管理
- 代码质量：可读性、可维护性
- 最佳实践：遵循框架推荐模式

输出要求：
- 按严重程度分类（严重/警告/建议）
- 提供具体的代码修复示例
- 解释问题的原因和影响
"""
    
    # Prompt 模板
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "请审查以下代码:\n\n```{language}\n{code}\n```"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # 创建 Agent
    agent = create_openai_functions_agent(llm, tools, prompt)
    
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=5
    )

# ========== 使用示例 ==========

def review_code(code: str, language: str = "jsx"):
    """审查代码入口"""
    agent = create_code_review_agent()
    
    result = agent.invoke({
        "code": code,
        "language": language,
        "chat_history": []
    })
    
    return result["output"]

# 测试代码
sample_code = '''
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
    </div>
  );
};

export default UserProfile;
'''

if __name__ == "__main__":
    review = review_code(sample_code, "jsx")
    print("\n" + "="*50)
    print("代码审查报告")
    print("="*50)
    print(review)
```

### 5.2 预期输出示例

```markdown
## 代码审查报告

### 🔴 严重问题

**1. XSS 安全风险**
- **位置**：第 20 行
- **问题**：使用 `dangerouslySetInnerHTML` 渲染用户输入内容
- **风险**：用户 bio 可能包含恶意脚本
- **修复建议**：
  ```jsx
  // 使用安全的文本渲染
  <div>{user.bio}</div>
  
  // 如果需要富文本，使用 DOMPurify 等库
  import DOMPurify from 'dompurify';
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
  ```

**2. 空值访问风险**
- **位置**：第 19 行
- **问题**：`user.name` 可能在 user 为 null 时报错
- **修复**：
  ```jsx
  <h1>{user?.name || 'Anonymous'}</h1>
  ```

### 🟡 警告

**3. useEffect 依赖不完整**
- **位置**：第 8-14 行
- **问题**：依赖数组为空，但使用了 userId
- **修复**：
  ```jsx
  useEffect(() => {
    // ...
  }, [userId]);  // 添加 userId 依赖
  ```

**4. 缺少错误处理**
- **位置**：fetch 调用
- **问题**：API 失败时无错误处理
- **修复**：
  ```jsx
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [userId]);
  ```

### 🟢 建议

**5. 添加 TypeScript 类型**
- 为组件 props 和 user 数据添加类型定义

**6. 提取 API 调用**
- 将 fetch 逻辑提取到单独的 service 文件

---
**总体评价**：代码存在安全风险，建议优先修复 XSS 和空值访问问题。
```

---

## 6. 面试考点

### 6.1 Tool Calling 原理

**Q: 请解释 LLM Tool Calling 的工作原理**

**A:**

```
Tool Calling 的核心流程：

1. 工具注册
   - 将工具定义（名称、描述、参数 Schema）传递给 LLM
   - LLM 理解每个工具的功能和用法

2. 意图识别
   - LLM 分析用户输入
   - 判断是否需要调用工具
   - 选择最合适的工具

3. 参数生成
   - LLM 根据工具 Schema 生成参数
   - 参数必须符合 JSON Schema 规范

4. 执行与反馈
   - 外部系统执行工具函数
   - 将结果返回给 LLM

5. 结果整合
   - LLM 基于工具结果生成最终回答
```

**关键点：**
- Tool Calling 不是真正的"函数执行"，而是"函数调用请求生成"
- LLM 只生成调用指令，实际执行由外部系统完成
- 这是 LLM 与外部世界交互的标准化接口

### 6.2 Prompt 设计原则

**Q: 设计 Agent Prompt 时有哪些最佳实践？**

**A:**

| 原则 | 说明 | 示例 |
|------|------|------|
| **角色清晰** | 明确定义 AI 的身份和能力 | "你是一位资深前端工程师..." |
| **任务具体** | 描述明确的输入输出 | "接收代码字符串，返回问题列表" |
| **格式规范** | 定义输出结构和样式 | "使用 Markdown，按严重程度分级" |
| **Few-Shot** | 提供示例帮助理解 | 给出输入输出样例 |
| **边界限定** | 说明能做什么和不能做什么 | "不要修改代码，只提供建议" |
| **迭代优化** | 根据实际效果调整 Prompt | 持续测试和改进 |

**常见错误：**
- ❌ Prompt 过于笼统
- ❌ 没有定义输出格式
- ❌ 工具描述不清晰
- ❌ 缺少边界限制

### 6.3 Agent 设计模式

**Q: ReAct 模式是什么？**

**A:**

ReAct（Reasoning + Acting）是 Agent 的核心设计模式：

```
循环：思考(Thought) → 行动(Action) → 观察(Observation)

示例流程：

🤔 Thought: 用户问的是天气，我需要调用天气工具
🛠️ Action: 调用 get_weather(location="北京")
👁️ Observation: 工具返回"晴天，25度"
🤔 Thought: 已获得天气信息，可以回答用户
💬 Final Answer: 北京今天晴天，25度，适合出行
```

**优势：**
- 可解释性强（能看到思考过程）
- 错误可追踪（知道哪一步出错）
- 支持复杂任务（多轮工具调用）

---

## 7. 总结

### 核心知识点

1. **Agent 架构**：LLM + Memory + Tools + Planner
2. **Tool Calling**：函数调用协议是 LLM 与外部交互的桥梁
3. **Prompt Engineering**：角色定义、输出格式、Few-Shot 是关键
4. **LangChain 使用**：create_openai_functions_agent 快速搭建 Agent

### 下一步学习

- 第 05 课：Agent 的记忆机制（Memory）
- 第 06 课：Agent 的规划与推理（Planning）
- 第 07 课：多 Agent 协作系统

---

## 参考资源

- [LangChain Agent 文档](https://python.langchain.com/docs/modules/agents/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [ReAct 论文](https://arxiv.org/abs/2210.03629)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
