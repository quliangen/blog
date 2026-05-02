---
title: 09-MCP 协议与工具生态
description: 深入讲解 Model Context Protocol (MCP) 协议的原理与实现，包括 MCP Server 开发、工具生态接入，以及将 Git 分析工具封装为 MCP Server 的完整实战。
---

# 09-MCP 协议与工具生态

> 如果说 Function Calling 是 LLM 与工具的"私人对话"，那 MCP 就是 LLM 与工具世界的"通用语言"。掌握 MCP，让你的 Agent 接入整个工具生态。

## 岗位能力对标

| 岗位方向 | 能力要求 | 掌握程度 |
|---------|---------|---------|
| AI 应用开发工程师 | MCP Server 开发与集成 | ⭐⭐⭐⭐⭐ |
| Agent 平台开发 | 协议设计与生态建设 | ⭐⭐⭐⭐ |
| 全栈工程师 | 工具生态接入与封装 | ⭐⭐⭐⭐ |

**薪资参考**：掌握 MCP 协议开发的工程师，年薪普遍在 45-90W（大厂/AI 公司）。

## 学习目标

学完本章节，你将能够：

1. ✅ 理解 MCP 协议的核心概念与架构设计
2. ✅ 独立开发符合 MCP 规范的 Server
3. ✅ 将现有工具封装为 MCP Server
4. ✅ 掌握 MCP 与 Function Calling 的本质区别
5. ✅ 在企业级项目中选择合适的技术方案

## 前置知识

在开始之前，请确保你已掌握：

- Python 基础（类、异步编程、类型注解）
- JSON-RPC 2.0 协议基础
- LangChain 工具开发（第 05 篇内容）
- Git 基本操作
- 了解 Function Calling 机制

---

## 核心概念

### 1. 什么是 MCP？

**MCP (Model Context Protocol)** 是由 Anthropic 于 2024 年推出的开放协议，旨在标准化 LLM 与外部工具、数据源的集成方式。

**类比理解**：

想象你是一位厨师（LLM），以前每道菜都要自己准备食材（工具），而且每家供应商（工具开发者）的接口都不一样。MCP 就像是"食材标准化配送协议"：

- 📦 **统一包装**：所有食材都用标准包装盒（协议格式）
- 🏪 **中央仓库**：有一个大仓库（MCP Hub）存放各种食材
- 🚚 **标准配送**：配送流程完全一致（通信协议）
- 📋 **标准清单**：每种食材都有标准说明书（Schema）

**MCP 的核心价值**：

1. **一次开发，处处可用**：开发一次 MCP Server，所有支持 MCP 的客户端都能使用
2. **生态互通**：打破工具孤岛，构建统一的工具生态
3. **降低门槛**：开发者只需关注业务逻辑，无需适配各种 LLM 平台
4. **安全可控**：标准化的权限管理和安全边界

### 2. MCP 架构全景

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP 架构全景图                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐          ┌──────────────────────────┐   │
│   │   Client     │◄────────►│       MCP Server         │   │
│   │  (Claude/    │   JSON   │  ┌────────────────────┐  │   │
│   │   Cursor/    │   RPC    │  │   Tool Registry    │  │   │
│   │   自定义)    │          │  ├────────────────────┤  │   │
│   └──────────────┘          │  │   Resource Manager │  │   │
│                             │  ├────────────────────┤  │   │
│   ┌──────────────┐          │  │   Prompt Provider  │  │   │
│   │   MCP Hub    │◄────────►│  └────────────────────┘  │   │
│   │  (工具市场)   │          │                          │   │
│   └──────────────┘          └──────────────────────────┘   │
│                                                             │
│   ┌────────────────────────────────────────────────────┐   │
│   │              能力层 (Capabilities)                  │   │
│   │  • Tools: 可执行函数（查询天气、操作文件等）         │   │
│   │  • Resources: 可读资源（文档、数据库记录等）         │   │
│   │  • Prompts: 可复用提示模板                          │   │
│   └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**核心组件**：

| 组件 | 说明 | 类比 |
|-----|------|------|
| **Client** | 发起请求的 LLM 应用 | 餐厅 |
| **Server** | 提供能力的后端服务 | 食材供应商 |
| **Hub** | 工具注册与发现中心 | 食材市场 |
| **Transport** | 通信传输层 (stdio/sse) | 配送方式 |

### 3. MCP vs Function Calling

这是面试中最常问的问题，理解它们的区别至关重要。

#### 3.1 对比表格

| 维度 | Function Calling | MCP |
|-----|------------------|-----|
| **本质** | LLM 原生能力 | 标准化协议 |
| **范围** | 单个 LLM 平台 | 跨平台通用 |
| **工具定义** | 每次请求携带 | Server 端注册 |
| **发现机制** | 静态配置 | 动态发现 |
| **生态** | 平台绑定 | 开放生态 |
| **复杂度** | 简单直接 | 需要开发 Server |
| **适用场景** | 快速原型、单一应用 | 产品化、多客户端 |

#### 3.2 架构对比

```
Function Calling 模式:
┌─────────────┐     携带 tools 定义     ┌─────────────┐
│   Client    │ ──────────────────────► │     LLM     │
│  (你的应用)  │ ◄────────────────────── │  (OpenAI/   │
└─────────────┘   返回 function_call    │   Claude)   │
       │                                └─────────────┘
       │                                       │
       │ 直接调用                               │
       ▼                                       ▼
┌─────────────┐                          ┌─────────────┐
│    Tool     │                          │   无状态    │
│  (本地函数)  │                          │  每次需定义  │
└─────────────┘                          └─────────────┘

MCP 模式:
┌─────────────┐     发现可用工具      ┌─────────────┐
│   Client    │ ◄──────────────────► │  MCP Server │
│  (Claude/   │    (JSON-RPC)        │  ┌─────────┐│
│   Cursor)   │                      │  │  Tools  ││
└─────────────┘                      │  │Resources││
       │                             │  │ Prompts ││
       │ 调用工具                     │  └─────────┘│
       ▼                             └─────────────┘
┌─────────────┐                             │
│  MCP Server │◄────────────────────────────┘
│  (远程服务)  │
└─────────────┘
```

#### 3.3 如何选择？

**使用 Function Calling 的场景**：
- 快速原型验证
- 内部工具，不需要对外暴露
- 工具数量少，变化不频繁
- 单一 LLM 平台（如只用 OpenAI）

**使用 MCP 的场景**：
- 产品化开发，需要支持多客户端
- 构建可复用的工具生态
- 工具需要动态更新和发现
- 跨团队协作，共享工具能力

---

## MCP Server 开发实战

### 1. 环境准备

```bash
# 安装 MCP SDK
pip install mcp

# 安装开发依赖
pip install mcp[dev]

# 验证安装
python -c "import mcp; print(mcp.__version__)"
```

### 2. 第一个 MCP Server

```python
#!/usr/bin/env python3
"""
Hello MCP Server
最简 MCP Server 示例（使用 fastmcp）
"""

from fastmcp import FastMCP
import asyncio

# 创建 FastMCP 实例（推荐方式）
mcp = FastMCP("hello-mcp")

# 定义工具 - 使用装饰器方式
@mcp.tool()
async def hello(name: str) -> str:
    """向用户打招呼
    
    Args:
        name: 用户名称
    """
    return f"你好，{name}！欢迎使用 MCP。"

@mcp.tool()
async def calculate(expression: str) -> str:
    """执行数学计算
    
    Args:
        expression: 数学表达式，如 '1 + 2 * 3'
    """
    try:
        # 安全计算（使用 ast）
        import ast
        import operator
        
        allowed_operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
        }
        
        def eval_node(node):
            if isinstance(node, ast.Constant):
                return node.value
            elif isinstance(node, ast.BinOp):
                left = eval_node(node.left)
                right = eval_node(node.right)
                return allowed_operators[type(node.op)](left, right)
            else:
                raise ValueError(f"不支持的节点类型: {type(node)}")
        
        parsed = ast.parse(expression.strip(), mode='eval')
        result = eval_node(parsed.body)
        return f"计算结果: {result}"
    except Exception as e:
        return f"计算错误: {str(e)}"

if __name__ == "__main__":
    # 启动 Server（stdio 模式）
    mcp.run()
```

### 3. 配置 Claude Desktop

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "hello": {
      "command": "python",
      "args": ["/path/to/hello_mcp_server.py"]
    }
  }
}
```

### 4. 完整工具 Server 示例

```python
#!/usr/bin/env python3
"""
实用工具 MCP Server
包含文件操作、HTTP 请求、数据处理等常用工具
"""

from fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import Optional
import asyncio
import json
import httpx
from pathlib import Path
import hashlib
from datetime import datetime

# 创建 FastMCP 实例
mcp = FastMCP("utility-tools")

# ============ 输入输出 Schema ============

class FileReadInput(BaseModel):
    path: str = Field(description="文件路径")
    encoding: str = Field(default="utf-8", description="文件编码")
    limit: Optional[int] = Field(default=None, description="最大读取行数")

class FileWriteInput(BaseModel):
    path: str = Field(description="文件路径")
    content: str = Field(description="文件内容")
    encoding: str = Field(default="utf-8", description="文件编码")
    append: bool = Field(default=False, description="是否追加")

class HTTPRequestInput(BaseModel):
    url: str = Field(description="请求 URL")
    method: str = Field(default="GET", description="HTTP 方法")
    headers: Optional[dict] = Field(default=None, description="请求头")
    body: Optional[dict] = Field(default=None, description="请求体")
    timeout: int = Field(default=30, description="超时时间(秒)")

class DataTransformInput(BaseModel):
    data: str = Field(description="输入数据(JSON 格式)")
    operation: str = Field(description="操作类型: filter/sort/group/aggregate")
    params: Optional[dict] = Field(default=None, description="操作参数")

# ============ 工具实现 ============

class FileTool:
    """文件操作工具"""
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_PATHS = []  # 可配置允许的路径
    
    @classmethod
    def validate_path(cls, path: str) -> tuple[bool, str]:
        """验证路径安全性"""
        try:
            p = Path(path).resolve()
            
            # 检查路径遍历
            if '..' in path:
                return False, "路径包含非法字符 '..'"
            
            # 检查文件大小
            if p.exists() and p.stat().st_size > cls.MAX_FILE_SIZE:
                return False, f"文件超过大小限制 {cls.MAX_FILE_SIZE}"
            
            return True, str(p)
        except Exception as e:
            return False, str(e)
    
    @classmethod
    def read(cls, input_data: FileReadInput) -> str:
        """读取文件"""
        is_valid, result = cls.validate_path(input_data.path)
        if not is_valid:
            return json.dumps({"error": result})
        
        try:
            path = Path(result)
            if not path.exists():
                return json.dumps({"error": "文件不存在"})
            
            with open(path, 'r', encoding=input_data.encoding) as f:
                if input_data.limit:
                    lines = []
                    for i, line in enumerate(f):
                        if i >= input_data.limit:
                            break
                        lines.append(line)
                    content = ''.join(lines)
                else:
                    content = f.read()
            
            return json.dumps({
                "content": content,
                "path": str(path),
                "size": len(content),
                "success": True
            })
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    @classmethod
    def write(cls, input_data: FileWriteInput) -> str:
        """写入文件"""
        is_valid, result = cls.validate_path(input_data.path)
        if not is_valid:
            return json.dumps({"error": result})
        
        try:
            path = Path(result)
            mode = 'a' if input_data.append else 'w'
            
            # 确保目录存在
            path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(path, mode, encoding=input_data.encoding) as f:
                f.write(input_data.content)
            
            return json.dumps({
                "path": str(path),
                "bytes_written": len(input_data.content.encode(input_data.encoding)),
                "success": True
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

class HTTPTool:
    """HTTP 请求工具"""
    
    client = httpx.AsyncClient(timeout=30.0)
    
    @classmethod
    async def request(cls, input_data: HTTPRequestInput) -> str:
        """发起 HTTP 请求"""
        try:
            method = input_data.method.upper()
            kwargs = {
                "url": input_data.url,
                "headers": input_data.headers or {},
                "timeout": input_data.timeout
            }
            
            if input_data.body and method in ["POST", "PUT", "PATCH"]:
                kwargs["json"] = input_data.body
            
            response = await cls.client.request(method, **kwargs)
            
            # 尝试解析 JSON
            try:
                body = response.json()
            except:
                body = response.text
            
            return json.dumps({
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": body,
                "success": response.status_code < 400
            }, ensure_ascii=False)
            
        except httpx.TimeoutException:
            return json.dumps({"error": "请求超时", "success": False})
        except Exception as e:
            return json.dumps({"error": str(e), "success": False})
    
    @classmethod
    async def close(cls):
        await cls.client.aclose()

class DataTransformTool:
    """数据转换工具"""
    
    @classmethod
    def transform(cls, input_data: DataTransformInput) -> str:
        """执行数据转换"""
        try:
            data = json.loads(input_data.data)
            operation = input_data.operation
            params = input_data.params or {}
            
            if operation == "filter":
                # 过滤数据
                key = params.get("key")
                value = params.get("value")
                if isinstance(data, list):
                    result = [item for item in data if item.get(key) == value]
                else:
                    result = data if data.get(key) == value else {}
                    
            elif operation == "sort":
                # 排序数据
                key = params.get("key")
                reverse = params.get("reverse", False)
                if isinstance(data, list):
                    result = sorted(data, key=lambda x: x.get(key), reverse=reverse)
                else:
                    result = data
                    
            elif operation == "group":
                # 分组数据
                key = params.get("key")
                from collections import defaultdict
                result = defaultdict(list)
                if isinstance(data, list):
                    for item in data:
                        group_key = item.get(key)
                        result[group_key].append(item)
                result = dict(result)
                
            elif operation == "aggregate":
                # 聚合数据
                op = params.get("op", "count")  # count/sum/avg/max/min
                key = params.get("key")
                
                if op == "count":
                    result = len(data) if isinstance(data, list) else 1
                elif op == "sum":
                    result = sum(item.get(key, 0) for item in data if isinstance(data, list))
                elif op == "avg":
                    values = [item.get(key, 0) for item in data if isinstance(data, list)]
                    result = sum(values) / len(values) if values else 0
                elif op == "max":
                    result = max(item.get(key, 0) for item in data if isinstance(data, list))
                elif op == "min":
                    result = min(item.get(key, 0) for item in data if isinstance(data, list))
                else:
                    result = data
            else:
                result = {"error": f"未知操作: {operation}"}
            
            return json.dumps({
                "result": result,
                "operation": operation,
                "success": True
            }, ensure_ascii=False)
            
        except Exception as e:
            return json.dumps({"error": str(e), "success": False})

# ============ 工具定义 ============

@mcp.tool()
async def file_read(path: str, encoding: str = "utf-8", limit: Optional[int] = None) -> str:
    """读取文件内容，支持指定编码和行数限制
    
    Args:
        path: 文件路径
        encoding: 文件编码，默认 utf-8
        limit: 最大读取行数
    """
    is_valid, result = FileTool.validate_path(path)
    if not is_valid:
        return json.dumps({"error": result})
    
    try:
        file_path = Path(result)
        if not file_path.exists():
            return json.dumps({"error": "文件不存在"})
        
        with open(file_path, 'r', encoding=encoding) as f:
            if limit:
                lines = []
                for i, line in enumerate(f):
                    if i >= limit:
                        break
                    lines.append(line)
                content = ''.join(lines)
            else:
                content = f.read()
        
        return json.dumps({
            "content": content,
            "path": str(file_path),
            "size": len(content),
            "success": True
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

@mcp.tool()
async def file_write(path: str, content: str, encoding: str = "utf-8", append: bool = False) -> str:
    """写入文件内容，支持追加模式
    
    Args:
        path: 文件路径
        content: 文件内容
        encoding: 文件编码，默认 utf-8
        append: 是否追加模式
    """
    is_valid, result = FileTool.validate_path(path)
    if not is_valid:
        return json.dumps({"error": result})
    
    try:
        file_path = Path(result)
        mode = 'a' if append else 'w'
        
        # 确保目录存在
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, mode, encoding=encoding) as f:
            f.write(content)
        
        return json.dumps({
            "path": str(file_path),
            "bytes_written": len(content.encode(encoding)),
            "success": True
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

@mcp.tool()
async def http_request(url: str, method: str = "GET", headers: Optional[dict] = None, 
                       body: Optional[dict] = None, timeout: int = 30) -> str:
    """发起 HTTP 请求，支持 GET/POST/PUT/DELETE
    
    Args:
        url: 请求 URL
        method: HTTP 方法，默认 GET
        headers: 请求头
        body: 请求体
        timeout: 超时时间(秒)
    """
    try:
        method = method.upper()
        kwargs = {
            "url": url,
            "headers": headers or {},
            "timeout": timeout
        }
        
        if body and method in ["POST", "PUT", "PATCH"]:
            kwargs["json"] = body
        
        response = await HTTPTool.client.request(method, **kwargs)
        
        # 尝试解析 JSON
        try:
            resp_body = response.json()
        except:
            resp_body = response.text
        
        return json.dumps({
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": resp_body,
            "success": response.status_code < 400
        }, ensure_ascii=False)
        
    except httpx.TimeoutException:
        return json.dumps({"error": "请求超时", "success": False})
    except Exception as e:
        return json.dumps({"error": str(e), "success": False})

@mcp.tool()
async def data_transform(data: str, operation: str, params: Optional[dict] = None) -> str:
    """数据转换：过滤、排序、分组、聚合
    
    Args:
        data: 输入数据(JSON 格式)
        operation: 操作类型: filter/sort/group/aggregate
        params: 操作参数
    """
    try:
        data_obj = json.loads(data)
        params = params or {}
        
        if operation == "filter":
            # 过滤数据
            key = params.get("key")
            value = params.get("value")
            if isinstance(data_obj, list):
                result = [item for item in data_obj if item.get(key) == value]
            else:
                result = data_obj if data_obj.get(key) == value else {}
                
        elif operation == "sort":
            # 排序数据
            key = params.get("key")
            reverse = params.get("reverse", False)
            if isinstance(data_obj, list):
                result = sorted(data_obj, key=lambda x: x.get(key), reverse=reverse)
            else:
                result = data_obj
                
        elif operation == "group":
            # 分组数据
            key = params.get("key")
            from collections import defaultdict
            result = defaultdict(list)
            if isinstance(data_obj, list):
                for item in data_obj:
                    group_key = item.get(key)
                    result[group_key].append(item)
            result = dict(result)
            
        elif operation == "aggregate":
            # 聚合数据
            op = params.get("op", "count")  # count/sum/avg/max/min
            key = params.get("key")
            
            if op == "count":
                result = len(data_obj) if isinstance(data_obj, list) else 1
            elif op == "sum":
                result = sum(item.get(key, 0) for item in data_obj if isinstance(data_obj, list))
            elif op == "avg":
                values = [item.get(key, 0) for item in data_obj if isinstance(data_obj, list)]
                result = sum(values) / len(values) if values else 0
            elif op == "max":
                result = max(item.get(key, 0) for item in data_obj if isinstance(data_obj, list))
            elif op == "min":
                result = min(item.get(key, 0) for item in data_obj if isinstance(data_obj, list))
            else:
                result = data_obj
        else:
            result = {"error": f"未知操作: {operation}"}
        
        return json.dumps({
            "result": result,
            "operation": operation,
            "success": True
        }, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({"error": str(e), "success": False})

@mcp.tool()
async def hash_string(text: str, algorithm: str = "sha256") -> str:
    """计算字符串哈希值 (MD5/SHA256)
    
    Args:
        text: 输入文本
        algorithm: 哈希算法，可选 md5/sha256，默认 sha256
    """
    if algorithm == "md5":
        hash_value = hashlib.md5(text.encode()).hexdigest()
    else:
        hash_value = hashlib.sha256(text.encode()).hexdigest()
    return json.dumps({
        "hash": hash_value,
        "algorithm": algorithm
    })

@mcp.tool()
async def datetime_now(format: str = "%Y-%m-%d %H:%M:%S", timezone: str = "local") -> str:
    """获取当前日期时间
    
    Args:
        format: 时间格式，默认 %Y-%m-%d %H:%M:%S
        timezone: 时区，可选 local/utc，默认 local
    """
    if timezone == "utc":
        now = datetime.utcnow()
    else:
        now = datetime.now()
    return json.dumps({
        "datetime": now.strftime(format),
        "timezone": timezone
    })

# ============ 启动 Server ============

if __name__ == "__main__":
    try:
        mcp.run()
    finally:
        asyncio.run(HTTPTool.close())
```

---

## 实战：将 Git 分析工具封装为 MCP Server

基于第 05 篇开发的 Git 仓库分析工具，我们将其封装为 MCP Server。

### 1. 代码实现

```python
#!/usr/bin/env python3
"""
Git 分析 MCP Server
基于第 05 篇的 Git 工具，封装为 MCP Server
"""

from fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import Optional, List
import subprocess
import json
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import asyncio

# 创建 FastMCP 实例
mcp = FastMCP("git-analyzer")

# ============ 输入输出 Schema ============

class GitRepoInput(BaseModel):
    repo_path: str = Field(description="Git 仓库路径")
    analysis_type: str = Field(
        default="full",
        description="分析类型: basic/stats/contributors/commits/full"
    )
    since: Optional[str] = Field(default=None, description="起始日期 (YYYY-MM-DD)")
    until: Optional[str] = Field(default=None, description="结束日期 (YYYY-MM-DD)")
    limit: int = Field(default=20, description="返回结果数量限制")

class GitFileHistoryInput(BaseModel):
    repo_path: str = Field(description="Git 仓库路径")
    file_path: str = Field(description="文件路径")
    limit: int = Field(default=10, description="返回提交数量")

class GitDiffInput(BaseModel):
    repo_path: str = Field(description="Git 仓库路径")
    from_ref: str = Field(description="起始引用 (commit/branch/tag)")
    to_ref: str = Field(description="目标引用 (commit/branch/tag)")
    stat_only: bool = Field(default=True, description="仅返回统计信息")

# ============ Git 分析核心类 ============

class GitAnalyzer:
    """Git 仓库分析器"""
    
    def __init__(self, timeout: int = 60):
        self.timeout = timeout
    
    def _run_git(self, repo_path: str, command: List[str]) -> tuple[bool, str]:
        """执行 Git 命令"""
        try:
            result = subprocess.run(
                ['git', '-C', repo_path] + command,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            if result.returncode != 0:
                return False, result.stderr
            return True, result.stdout
        except subprocess.TimeoutExpired:
            return False, f"命令超时 ({self.timeout}s)"
        except Exception as e:
            return False, str(e)
    
    def validate_repo(self, repo_path: str) -> tuple[bool, str]:
        """验证 Git 仓库"""
        path = Path(repo_path)
        if not path.exists():
            return False, f"路径不存在: {repo_path}"
        if not (path / '.git').exists():
            return False, f"不是有效的 Git 仓库: {repo_path}"
        return True, ""
    
    def get_basic_info(self, repo_path: str) -> dict:
        """获取仓库基础信息"""
        info = {}
        
        # 仓库名称
        info['name'] = Path(repo_path).name
        
        # 远程地址
        success, remote = self._run_git(repo_path, ['remote', 'get-url', 'origin'])
        info['remote_url'] = remote.strip() if success else None
        
        # 当前分支
        success, branch = self._run_git(repo_path, ['branch', '--show-current'])
        info['current_branch'] = branch.strip() if success else None
        
        # 提交数量
        success, commits = self._run_git(repo_path, ['rev-list', '--count', 'HEAD'])
        info['total_commits'] = int(commits.strip()) if success else 0
        
        # 分支数量
        success, branches = self._run_git(repo_path, ['branch', '-a'])
        info['branch_count'] = len([b for b in branches.split('\n') if b.strip()])
        
        # 标签数量
        success, tags = self._run_git(repo_path, ['tag', '-l'])
        info['tag_count'] = len([t for t in tags.split('\n') if t.strip()])
        
        # 最后提交
        success, last = self._run_git(repo_path, ['log', '-1', '--format=%ci|%s|%an'])
        if success and '|' in last:
            parts = last.strip().split('|')
            info['last_commit'] = {
                'date': parts[0],
                'message': parts[1],
                'author': parts[2]
            }
        
        return info
    
    def get_stats(self, repo_path: str) -> dict:
        """获取代码统计"""
        stats = {}
        
        # 文件列表
        success, files = self._run_git(repo_path, ['ls-files'])
        file_list = [f for f in files.split('\n') if f.strip()]
        stats['total_files'] = len(file_list)
        
        # 代码行数
        if file_list:
            success, lines = self._run_git(repo_path, ['wc', '-l'] + file_list)
            if success:
                try:
                    total = lines.strip().split('\n')[-1].split()[0]
                    stats['total_lines'] = int(total)
                except:
                    stats['total_lines'] = 0
        
        # 语言分布
        lang_stats = defaultdict(int)
        lang_map = {
            '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
            '.jsx': 'React', '.tsx': 'React', '.vue': 'Vue',
            '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
            '.cpp': 'C++', '.c': 'C', '.h': 'C/C++',
            '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS',
            '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
            '.md': 'Markdown', '.sql': 'SQL', '.sh': 'Shell'
        }
        
        for f in file_list:
            ext = Path(f).suffix.lower()
            if ext:
                lang = lang_map.get(ext, 'Other')
                lang_stats[lang] += 1
        
        stats['languages'] = dict(sorted(lang_stats.items(), key=lambda x: x[1], reverse=True))
        
        return stats
    
    def get_contributors(self, repo_path: str, limit: int = 20) -> List[dict]:
        """获取贡献者信息"""
        success, log = self._run_git(
            repo_path,
            ['log', '--format=%an|%ae', '--shortstat']
        )
        
        if not success:
            return []
        
        contributors = defaultdict(lambda: {'commits': 0, 'added': 0, 'deleted': 0})
        current = None
        
        for line in log.split('\n'):
            if '|' in line:
                name, email = line.split('|', 1)
                current = (name, email)
                contributors[current]['commits'] += 1
            elif 'insertion' in line or 'deletion' in line:
                added = re.search(r'(\d+) insertion', line)
                deleted = re.search(r'(\d+) deletion', line)
                if current:
                    if added:
                        contributors[current]['added'] += int(added.group(1))
                    if deleted:
                        contributors[current]['deleted'] += int(deleted.group(1))
        
        result = []
        for (name, email), stats in sorted(
            contributors.items(),
            key=lambda x: x[1]['commits'],
            reverse=True
        )[:limit]:
            result.append({
                'name': name,
                'email': email,
                'commits': stats['commits'],
                'lines_added': stats['added'],
                'lines_deleted': stats['deleted']
            })
        
        return result
    
    def get_commits(
        self,
        repo_path: str,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: int = 20
    ) -> List[dict]:
        """获取提交历史"""
        cmd = ['log', '--format=%H|%an|%ae|%ci|%s', f'-{limit}']
        
        if since:
            cmd.extend(['--since', since])
        if until:
            cmd.extend(['--until', until])
        
        success, log = self._run_git(repo_path, cmd)
        
        if not success:
            return []
        
        commits = []
        for line in log.split('\n'):
            if '|' in line:
                parts = line.split('|', 4)
                if len(parts) >= 5:
                    commits.append({
                        'hash': parts[0][:8],
                        'author': parts[1],
                        'email': parts[2],
                        'date': parts[3],
                        'message': parts[4]
                    })
        
        return commits
    
    def get_file_history(
        self,
        repo_path: str,
        file_path: str,
        limit: int = 10
    ) -> List[dict]:
        """获取文件历史"""
        cmd = [
            'log', '--follow', '--format=%H|%an|%ci|%s',
            f'-{limit}', '--', file_path
        ]
        
        success, log = self._run_git(repo_path, cmd)
        
        if not success:
            return []
        
        history = []
        for line in log.split('\n'):
            if '|' in line:
                parts = line.split('|', 3)
                if len(parts) >= 4:
                    history.append({
                        'hash': parts[0][:8],
                        'author': parts[1],
                        'date': parts[2],
                        'message': parts[3]
                    })
        
        return history
    
    def get_diff(
        self,
        repo_path: str,
        from_ref: str,
        to_ref: str,
        stat_only: bool = True
    ) -> dict:
        """获取差异信息"""
        if stat_only:
            cmd = ['diff', '--stat', f'{from_ref}..{to_ref}']
        else:
            cmd = ['diff', f'{from_ref}..{to_ref}']
        
        success, output = self._run_git(repo_path, cmd)
        
        if not success:
            return {'error': output}
        
        if stat_only:
            # 解析统计信息
            lines = output.strip().split('\n')
            files = []
            for line in lines[:-1] if lines else []:
                match = re.match(r'(.+?)\s*\|\s*(\d+)\s*([+-]+)?', line)
                if match:
                    files.append({
                        'file': match.group(1).strip(),
                        'changes': int(match.group(2)),
                        'diff': match.group(3) or ''
                    })
            
            # 总行数
            total_match = re.search(r'(\d+) insertions.*?(\d+) deletions', output)
            return {
                'files_changed': len(files),
                'insertions': int(total_match.group(1)) if total_match else 0,
                'deletions': int(total_match.group(2)) if total_match else 0,
                'files': files
            }
        else:
            return {'diff': output}
    
    def analyze(self, input_data: GitRepoInput) -> dict:
        """执行完整分析"""
        is_valid, error = self.validate_repo(input_data.repo_path)
        if not is_valid:
            return {'success': False, 'error': error}
        
        result = {'success': True, 'repo_path': input_data.repo_path}
        analysis_type = input_data.analysis_type
        
        if analysis_type in ['basic', 'full']:
            result['basic_info'] = self.get_basic_info(input_data.repo_path)
        
        if analysis_type in ['stats', 'full']:
            result['stats'] = self.get_stats(input_data.repo_path)
        
        if analysis_type in ['contributors', 'full']:
            result['contributors'] = self.get_contributors(
                input_data.repo_path,
                input_data.limit
            )
        
        if analysis_type in ['commits', 'full']:
            result['commits'] = self.get_commits(
                input_data.repo_path,
                input_data.since,
                input_data.until,
                input_data.limit
            )
        
        return result

# ============ 工具定义 ============

analyzer = GitAnalyzer()

@mcp.tool()
async def git_analyze(
    repo_path: str,
    analysis_type: str = "full",
    since: Optional[str] = None,
    until: Optional[str] = None,
    limit: int = 20
) -> str:
    """分析 Git 仓库信息，包括基础信息、代码统计、贡献者、提交历史等
    
    Args:
        repo_path: Git 仓库路径，可以是绝对路径或相对路径
        analysis_type: 分析类型: basic(基础信息), stats(代码统计), contributors(贡献者), commits(提交历史), full(完整)
        since: 起始日期，格式 YYYY-MM-DD，用于过滤提交历史
        until: 结束日期，格式 YYYY-MM-DD，用于过滤提交历史
        limit: 返回结果数量限制
    """
    input_data = GitRepoInput(
        repo_path=repo_path,
        analysis_type=analysis_type,
        since=since,
        until=until,
        limit=limit
    )
    result = analyzer.analyze(input_data)
    return json.dumps(result, indent=2, ensure_ascii=False)

@mcp.tool()
async def git_file_history(repo_path: str, file_path: str, limit: int = 10) -> str:
    """获取指定文件的提交历史
    
    Args:
        repo_path: Git 仓库路径
        file_path: 文件路径（相对于仓库根目录）
        limit: 返回提交数量
    """
    input_data = GitFileHistoryInput(
        repo_path=repo_path,
        file_path=file_path,
        limit=limit
    )
    history = analyzer.get_file_history(
        input_data.repo_path,
        input_data.file_path,
        input_data.limit
    )
    return json.dumps({
        'file': input_data.file_path,
        'history': history,
        'count': len(history)
    }, indent=2, ensure_ascii=False)

@mcp.tool()
async def git_diff(repo_path: str, from_ref: str, to_ref: str, stat_only: bool = True) -> str:
    """比较两个引用（commit/branch/tag）之间的差异
    
    Args:
        repo_path: Git 仓库路径
        from_ref: 起始引用，如 commit hash、branch 名、tag 名
        to_ref: 目标引用，如 commit hash、branch 名、tag 名
        stat_only: 是否只返回统计信息
    """
    input_data = GitDiffInput(
        repo_path=repo_path,
        from_ref=from_ref,
        to_ref=to_ref,
        stat_only=stat_only
    )
    diff = analyzer.get_diff(
        input_data.repo_path,
        input_data.from_ref,
        input_data.to_ref,
        input_data.stat_only
    )
    return json.dumps(diff, indent=2, ensure_ascii=False)

@mcp.tool()
async def git_validate(repo_path: str) -> str:
    """验证路径是否为有效的 Git 仓库
    
    Args:
        repo_path: 要验证的路径
    """
    is_valid, error = analyzer.validate_repo(repo_path)
    return json.dumps({
        'is_valid': is_valid,
        'path': repo_path,
        'error': error if not is_valid else None
    })

# ============ 启动 Server ============

if __name__ == "__main__":
    mcp.run()
```

### 2. 配置与测试

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "git-analyzer": {
      "command": "python",
      "args": ["/path/to/git_mcp_server.py"]
    }
  }
}
```

**测试对话示例**：

```
User: 分析我当前项目的 Git 仓库

Claude: 我来帮您分析 Git 仓库。请提供仓库路径，或者我使用当前工作目录。

[调用 git_analyze 工具]
参数: {"repo_path": ".", "analysis_type": "full"}

Claude: 分析完成！以下是您的仓库概况：

📦 基础信息:
• 仓库名称: my-project
• 当前分支: main
• 总提交数: 1,234
• 分支数: 8
• 标签数: 12

📊 代码统计:
• 文件总数: 156
• 代码行数: 45,678
• 主要语言: Python (89), JavaScript (45), Markdown (22)

👥 贡献者 TOP 5:
1. Alice: 456 提交
2. Bob: 312 提交
3. Carol: 234 提交
...
```

---

## 工具生态接入

### 1. MCP Hub 生态

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP 工具生态                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  官方工具    │  │  社区工具    │  │  企业工具    │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │• Filesystem │  │• Git        │  │• Jira       │         │
│  │• Fetch      │  │• Database   │  │• Confluence │         │
│  │• Brave      │  │• Docker     │  │• Slack      │         │
│  │• Postgres   │  │• Kubernetes │  │• Salesforce │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 接入方式                             │   │
│  │  1. 官方 Registry: https://registry.mcp.io          │   │
│  │  2. GitHub 搜索: topic:mcp-server                   │   │
│  │  3. 社区 Awesome 列表                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 常用 MCP Server 推荐

| 类别 | Server | 功能 | 安装 |
|-----|--------|------|------|
| **文件** | filesystem | 文件读写操作 | `npx -y @modelcontextprotocol/server-filesystem` |
| **搜索** | brave-search | Brave 搜索引擎 | `npx -y @modelcontextprotocol/server-brave-search` |
| **数据库** | postgres | PostgreSQL 查询 | `npx -y @modelcontextprotocol/server-postgres` |
| **浏览器** | fetch | 网页获取 | `npx -y @modelcontextprotocol/server-fetch` |
| **版本控制** | github | GitHub API | `npx -y @modelcontextprotocol/server-github` |
| **开发** | sqlite | SQLite 数据库 | `npx -y @modelcontextprotocol/server-sqlite` |

### 3. 多 Server 配置示例

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/workspace"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    },
    "git-analyzer": {
      "command": "python",
      "args": ["/path/to/git_mcp_server.py"]
    }
  }
}
```

### 4. 开发自定义 Server 的最佳实践

```python
# 1. 结构化项目
git-analyzer-mcp/
├── src/
│   ├── __init__.py
│   ├── server.py          # MCP Server 主文件
│   ├── analyzer.py        # 业务逻辑
│   └── models.py          # 数据模型
├── tests/
│   └── test_analyzer.py
├── pyproject.toml
├── README.md
└── Dockerfile

# 2. 使用类型注解
from typing import Optional, List, Dict, Any

async def analyze(
    repo_path: str,
    analysis_type: str = "full",
    since: Optional[str] = None
) -> Dict[str, Any]:
    ...

# 3. 完善的错误处理
class GitAnalyzerError(Exception):
    """Git 分析错误"""
    pass

class InvalidRepoError(GitAnalyzerError):
    """无效仓库错误"""
    pass

# 4. 配置化
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    timeout: int = 60
    max_file_size: int = 10 * 1024 * 1024
    allowed_paths: List[str] = []
    
    class Config:
        env_prefix = "GIT_MCP_"

settings = Settings()

# 5. 日志记录
import logging

logger = logging.getLogger("git-analyzer-mcp")
logger.setLevel(logging.INFO)

@mcp.tool()
async def git_analyze_logged(
    repo_path: str,
    analysis_type: str = "full",
    since: Optional[str] = None,
    until: Optional[str] = None,
    limit: int = 20
) -> str:
    """分析 Git 仓库信息（带日志记录）"""
    logger.info(f"调用 git_analyze, 参数: repo_path={repo_path}, analysis_type={analysis_type}")
    try:
        input_data = GitRepoInput(
            repo_path=repo_path,
            analysis_type=analysis_type,
            since=since,
            until=until,
            limit=limit
        )
        result = analyzer.analyze(input_data)
        logger.info(f"git_analyze 执行成功")
        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"git_analyze 执行失败: {e}")
        raise
```

---

## 面试考点：MCP 与 Function Calling 的区别

### 高频面试题

**Q1: MCP 和 Function Calling 的本质区别是什么？**

> **答案要点**：
> 1. **Function Calling** 是 LLM 的原生能力，工具定义随请求发送，适合快速开发
> 2. **MCP** 是标准化协议，工具在 Server 端注册，支持动态发现和跨平台复用
> 3. **关键差异**：Function Calling 是"能力"，MCP 是"协议"
> 4. **选择依据**：快速原型用 Function Calling，产品化/生态建设用 MCP

**Q2: 什么时候应该选择 MCP 而不是 Function Calling？**

> **答案要点**：
> 1. 需要支持多客户端（Claude Desktop、Cursor、自定义应用）
> 2. 工具需要被多个团队/项目复用
> 3. 需要动态工具发现和更新
> 4. 构建工具生态或平台
> 5. 需要标准化的权限和安全管理

**Q3: MCP Server 的核心组件有哪些？**

> **答案要点**：
> 1. **Tools**: 可执行函数，如查询天气、操作文件
> 2. **Resources**: 可读资源，如文档、配置文件
> 3. **Prompts**: 可复用提示模板
> 4. **Transport**: 通信层，支持 stdio 和 SSE
> 5. **Capability Discovery**: 能力发现机制

**Q4: 如何确保 MCP Server 的安全性？**

> **答案要点**：
> 1. **输入验证**: 使用 Pydantic 严格验证参数
> 2. **路径安全**: 解析并验证文件路径，防止目录遍历
> 3. **资源限制**: 限制文件大小、超时时间、返回数据量
> 4. **权限控制**: 配置允许的操作路径和范围
> 5. **审计日志**: 记录所有工具调用

**Q5: MCP 的通信机制是怎样的？**

> **答案要点**：
> 1. 基于 **JSON-RPC 2.0** 协议
> 2. 支持两种传输方式：
>    - **stdio**: 标准输入输出，适合本地进程
>    - **SSE**: Server-Sent Events，适合远程服务
> 3. 通信流程：
>    - Client 发起初始化握手
>    - Server 返回能力列表
>    - Client 调用 tools/list 获取工具
>    - Client 调用 tools/call 执行工具

### 实战编程题

**题目：实现一个支持缓存的 MCP Server**

要求：
1. 实现一个计算斐波那契数列的 MCP Server
2. 添加内存缓存，避免重复计算
3. 实现缓存统计接口
4. 支持缓存清理

**参考答案**：

```python
from fastmcp import FastMCP
import json
import asyncio
import time
from functools import lru_cache
from typing import Dict, Any

# 创建 FastMCP 实例
mcp = FastMCP("fibonacci-server")

# 缓存存储
cache: Dict[int, int] = {}
cache_stats = {
    "hits": 0,
    "misses": 0,
    "computations": 0
}

def fibonacci(n: int) -> int:
    """计算斐波那契数（带缓存）"""
    if n in cache:
        cache_stats["hits"] += 1
        return cache[n]
    
    cache_stats["misses"] += 1
    cache_stats["computations"] += 1
    
    if n <= 1:
        result = n
    else:
        result = fibonacci(n - 1) + fibonacci(n - 2)
    
    cache[n] = result
    return result

@mcp.tool()
async def fibonacci(n: int, use_cache: bool = True) -> str:
    """计算斐波那契数列
    
    Args:
        n: 第 n 个斐波那契数
        use_cache: 是否使用缓存，默认 True
    """
    if n < 0:
        return json.dumps({"error": "n must be >= 0"})
    
    if n > 1000:
        return json.dumps({"error": "n too large (max 1000)"})
    
    start = time.time()
    if use_cache:
        result = fibonacci(n)
    else:
        # 不使用缓存，直接计算
        result = fibonacci.__wrapped__(n) if hasattr(fibonacci, '__wrapped__') else fibonacci(n)
    duration = time.time() - start
    
    return json.dumps({
        "n": n,
        "result": result,
        "duration_ms": round(duration * 1000, 2),
        "from_cache": n in cache and use_cache
    })

@mcp.tool()
async def cache_stats() -> str:
    """获取缓存统计信息"""
    return json.dumps({
        "cache_size": len(cache),
        "hits": cache_stats["hits"],
        "misses": cache_stats["misses"],
        "hit_rate": cache_stats["hits"] / (cache_stats["hits"] + cache_stats["misses"]) if cache_stats["hits"] + cache_stats["misses"] > 0 else 0,
        "computations": cache_stats["computations"]
    })

@mcp.tool()
async def clear_cache() -> str:
    """清理缓存"""
    old_size = len(cache)
    cache.clear()
    cache_stats["hits"] = 0
    cache_stats["misses"] = 0
    return json.dumps({
        "cleared": True,
        "old_size": old_size
    })

if __name__ == "__main__":
    mcp.run()
```

---

## 避坑指南

### ❌ 常见错误

| 错误类型 | 问题描述 | 解决方案 |
|---------|---------|---------|
| Schema 不匹配 | 工具定义的 inputSchema 与实际参数不符 | 使用 Pydantic 模型严格定义 |
| 同步阻塞 | 在 async 函数中使用同步 IO | 使用 asyncio 或线程池 |
| 资源泄漏 | HTTP 客户端未正确关闭 | 使用上下文管理器或生命周期钩子 |
| 超时失控 | 长时间运行任务无超时 | 设置合理的 timeout 参数 |
| 路径注入 | 未验证用户输入的文件路径 | 解析路径并验证白名单 |

### ⚠️ 安全注意事项

1. **永远不要信任用户输入**：所有参数都要验证
2. **限制资源使用**：文件大小、递归深度、返回数据量
3. **敏感信息保护**：不要在错误信息中暴露内部路径或实现细节
4. **沙箱执行**：危险操作在隔离环境中执行
5. **审计日志**：记录所有工具调用和参数

### 🔧 调试技巧

```python
# 1. 本地测试工具
async def test_tool():
    result = await call_tool("git_analyze", {"repo_path": "."})
    print(result)

# 2. 使用 MCP Inspector
# npx -y @modelcontextprotocol/inspector python server.py

# 3. 日志调试
import logging
logging.basicConfig(level=logging.DEBUG)

# 4. 单元测试
import pytest

@pytest.mark.asyncio
async def test_git_analyze():
    result = await git_analyze(repo_path=".")
    data = json.loads(result)
    assert data["success"] is True
```

---

## 扩展阅读

### 推荐资源

1. **官方文档**
   - [MCP 官方文档](https://modelcontextprotocol.io/)
   - [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
   - [MCP 规范](https://spec.modelcontextprotocol.io/)

2. **开源项目**
   - [MCP Servers](https://github.com/modelcontextprotocol/servers) - 官方 Server 集合
   - [Awesome MCP](https://github.com/appcypher/awesome-mcp) - 社区资源汇总
   - [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - 调试工具

3. **技术文章**
   - [Introducing MCP](https://www.anthropic.com/news/model-context-protocol) - Anthropic 官方介绍
   - [Building MCP Servers](https://modelcontextprotocol.io/tutorials/building-mcp-servers) - 官方教程

### MCP 生态工具

| 工具 | 用途 |
|-----|------|
| MCP Inspector | 交互式调试 MCP Server |
| MCP CLI | 命令行工具管理 Server |
| MCP Registry | 官方工具注册中心 |

---

## 课后练习

### 练习 1：文件搜索 MCP Server

实现一个支持以下功能的 MCP Server：
- 按文件名模式搜索（支持通配符）
- 按文件内容搜索（支持正则表达式）
- 按文件大小、修改时间过滤
- 返回匹配文件列表和摘要

### 练习 2：数据库查询 MCP Server

开发一个支持多种数据库的 MCP Server：
- 支持 SQLite、PostgreSQL、MySQL
- 安全的查询执行（只读模式可选）
- 结果格式化输出
- 连接池管理

### 练习 3：API 聚合 MCP Server

创建一个可以同时调用多个 API 的 MCP Server：
- 支持并行请求
- 统一的错误处理
- 结果合并和去重
- 部分失败容错

### 练习 4：自定义 MCP Server 发布

选择你常用的一个 API（如天气、股票、翻译等）：
- 封装成 MCP Server
- 编写完整的 Schema 定义
- 实现错误处理和重试
- 发布到 GitHub 并撰写 README

---

> 💡 **学习建议**：MCP 是 AI 应用开发的重要趋势。建议从改造现有工具开始，逐步掌握 Server 开发的最佳实践。多阅读官方示例代码，理解协议设计的精髓。

> 📚 **下节预告**：[10-多 Agent 协作与工作流编排](./10-多-Agent-协作与工作流编排.md)
