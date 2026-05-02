---
title: 05-给 Agent 装上「手脚」：工具开发
description: 深入讲解 AI Agent 工具开发的核心原则，包括 Schema 定义、常用工具实现、错误处理机制，并通过实战开发 Git 仓库分析工具，掌握工具集成的最佳实践。
---

# 05-给 Agent 装上「手脚」：工具开发

> 如果把 Agent 比作一个人，LLM 是"大脑"，那工具（Tool）就是它的"手脚"。没有工具，Agent 只能"纸上谈兵"；有了工具，Agent 才能真正"动手做事"。

## 岗位能力对标

| 岗位方向 | 能力要求 | 掌握程度 |
|---------|---------|---------|
| AI 应用开发工程师 | 工具封装与集成 | ⭐⭐⭐⭐⭐ |
| Agent 平台开发 | 工具生态建设 | ⭐⭐⭐⭐ |
| 全栈工程师 | 前后端工具链打通 | ⭐⭐⭐⭐ |

**薪资参考**：掌握 Agent 工具开发的工程师，年薪普遍在 40-80W（大厂/AI 公司）。

## 学习目标

学完本章节，你将能够：

1. ✅ 理解 Tool 的设计原则，掌握输入输出 Schema 定义方法
2. ✅ 开发常用工具：文件操作、HTTP 请求、数据库查询
3. ✅ 实现完善的错误处理、重试机制和超时控制
4. ✅ 独立完成「Git 仓库分析工具」的开发与 Agent 集成
5. ✅ 掌握工具设计的最佳实践和面试常考知识点

## 前置知识

在开始之前，请确保你已掌握：

- Python 基础（类、装饰器、异常处理）
- Pydantic 数据验证（或 TypeScript 类型系统）
- LangChain 基础概念（Agent、Chain）
- Git 基本操作
- HTTP 协议基础

## 核心概念

### 1. 什么是 Tool？为什么要用 Tool？

**类比理解**：

想象你是一个指挥官（Agent），你的参谋（LLM）很聪明，能分析问题、制定策略，但无法直接执行具体任务。你需要给参谋配备各种"工具"：

- 📞 **电话** = HTTP 请求工具（调用外部 API）
- 📁 **文件柜** = 文件操作工具（读写本地文件）
- 🗄️ **数据库** = 数据库查询工具（查询业务数据）
- 🔍 **望远镜** = 搜索工具（检索网络信息）

**Tool 的核心价值**：

1. **扩展能力边界**：LLM 只能生成文本，Tool 让 Agent 能操作真实世界
2. **保证准确性**：数学计算、实时数据等通过工具获取，避免 LLM 幻觉
3. **实现自动化**：工具链串联，完成复杂工作流

### 2. Tool 设计原则

#### 2.1 单一职责原则（SRP）

一个 Tool 只做一件事，做好一件事。

```python
# ❌ 不好的设计：一个工具做太多事
class UniversalTool:
    def execute(self, action, **kwargs):
        if action == "read_file": ...
        elif action == "call_api": ...
        elif action == "query_db": ...

# ✅ 好的设计：每个工具职责单一
class FileReaderTool:
    def execute(self, file_path: str) -> str: ...

class APICallerTool:
    def execute(self, url: str, method: str) -> dict: ...

class DatabaseQueryTool:
    def execute(self, sql: str) -> list: ...
```

#### 2.2 输入输出 Schema 定义

Tool 的输入输出必须明确定义，就像函数签名一样。

```python
from pydantic import BaseModel, Field
from typing import Optional

# 输入 Schema
class FileReadInput(BaseModel):
    file_path: str = Field(
        description="要读取的文件路径",
        examples=["/path/to/file.txt"]
    )
    encoding: Optional[str] = Field(
        default="utf-8",
        description="文件编码格式"
    )
    limit: Optional[int] = Field(
        default=None,
        description="读取的最大行数，None 表示全部"
    )

# 输出 Schema
class FileReadOutput(BaseModel):
    content: str = Field(description="文件内容")
    line_count: int = Field(description="实际读取的行数")
    file_size: int = Field(description="文件大小（字节）")
    success: bool = Field(description="是否读取成功")
    error: Optional[str] = Field(default=None, description="错误信息")

class FileReaderTool:
    """文件读取工具 - 安全地读取本地文件内容"""
    
    name = "file_reader"
    description = "读取本地文件内容，支持指定编码和行数限制"
    input_schema = FileReadInput
    output_schema = FileReadOutput
    
    def execute(self, input_data: FileReadInput) -> FileReadOutput:
        try:
            with open(input_data.file_path, 'r', encoding=input_data.encoding) as f:
                lines = f.readlines()
                if input_data.limit:
                    lines = lines[:input_data.limit]
                content = ''.join(lines)
                
            return FileReadOutput(
                content=content,
                line_count=len(lines),
                file_size=len(content.encode(input_data.encoding)),
                success=True
            )
        except Exception as e:
            return FileReadOutput(
                content="",
                line_count=0,
                file_size=0,
                success=False,
                error=str(e)
            )
```

#### 2.3 自描述性

Tool 必须能清楚地描述自己的功能，让 LLM 知道什么时候该用它。

```python
class CalculatorTool:
    """
    计算器工具 - 执行精确的数学计算
    
    使用场景：
    - 需要精确计算数学表达式时
    - LLM 可能算错的大数运算
    - 科学计算、财务计算等需要高精度的场景
    
    示例：
    - "计算 123456789 * 987654321"
    - "求 sqrt(2) 的精确值"
    """
    
    name = "calculator"
    description = "执行精确的数学计算，支持基本运算和数学函数"
```

### 3. 常用工具开发实战

#### 3.1 文件操作工具

```python
import os
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, List, Literal

# ============ 输入输出 Schema ============

class FileReadInput(BaseModel):
    file_path: str = Field(description="文件路径")
    encoding: str = Field(default="utf-8", description="文件编码")

class FileReadOutput(BaseModel):
    content: str = Field(description="文件内容")
    success: bool = Field(description="是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")

class FileWriteInput(BaseModel):
    file_path: str = Field(description="文件路径")
    content: str = Field(description="要写入的内容")
    encoding: str = Field(default="utf-8", description="文件编码")
    append: bool = Field(default=False, description="是否追加模式")

class FileWriteOutput(BaseModel):
    bytes_written: int = Field(description="写入字节数")
    success: bool = Field(description="是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")

class FileListInput(BaseModel):
    directory: str = Field(description="目录路径")
    pattern: Optional[str] = Field(default="*", description="文件匹配模式")
    recursive: bool = Field(default=False, description="是否递归")

class FileListOutput(BaseModel):
    files: List[str] = Field(description="文件列表")
    count: int = Field(description="文件数量")
    success: bool = Field(description="是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")

# ============ 工具实现 ============

class FileOperationTool:
    """
    文件操作工具 - 安全地进行文件读写和目录操作
    
    安全特性：
    - 路径验证，防止目录遍历攻击
    - 文件大小限制，防止内存溢出
    - 敏感文件保护（如 .env、私钥等）
    """
    
    name = "file_operation"
    description = "执行安全的文件读写和目录操作"
    
    # 安全配置
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    BLOCKED_EXTENSIONS = {'.env', '.pem', '.key', '.p12'}
    ALLOWED_BASE_PATHS = ['/home/user/workspace', '/tmp']  # 白名单
    
    def __init__(self, allowed_paths: Optional[List[str]] = None):
        if allowed_paths:
            self.ALLOWED_BASE_PATHS = allowed_paths
    
    def _validate_path(self, file_path: str) -> tuple[bool, str]:
        """验证文件路径是否安全"""
        path = Path(file_path).resolve()
        
        # 检查是否在允许的路径下
        for allowed in self.ALLOWED_BASE_PATHS:
            if str(path).startswith(str(Path(allowed).resolve())):
                break
        else:
            return False, f"路径不在允许的范围内: {self.ALLOWED_BASE_PATHS}"
        
        # 检查文件扩展名
        if path.suffix in self.BLOCKED_EXTENSIONS:
            return False, f"不允许访问的文件类型: {path.suffix}"
        
        return True, str(path)
    
    def read(self, input_data: FileReadInput) -> FileReadOutput:
        """读取文件内容"""
        is_valid, result = self._validate_path(input_data.file_path)
        if not is_valid:
            return FileReadOutput(content="", success=False, error=result)
        
        try:
            path = Path(result)
            if not path.exists():
                return FileReadOutput(content="", success=False, error="文件不存在")
            
            if path.stat().st_size > self.MAX_FILE_SIZE:
                return FileReadOutput(content="", success=False, error="文件超过大小限制")
            
            content = path.read_text(encoding=input_data.encoding)
            return FileReadOutput(content=content, success=True)
            
        except Exception as e:
            return FileReadOutput(content="", success=False, error=str(e))
    
    def write(self, input_data: FileWriteInput) -> FileWriteOutput:
        """写入文件内容"""
        is_valid, result = self._validate_path(input_data.file_path)
        if not is_valid:
            return FileWriteOutput(bytes_written=0, success=False, error=result)
        
        try:
            path = Path(result)
            mode = 'a' if input_data.append else 'w'
            
            # 确保目录存在
            path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(path, mode, encoding=input_data.encoding) as f:
                f.write(input_data.content)
            
            return FileWriteOutput(
                bytes_written=len(input_data.content.encode(input_data.encoding)),
                success=True
            )
            
        except Exception as e:
            return FileWriteOutput(bytes_written=0, success=False, error=str(e))
    
    def list_files(self, input_data: FileListInput) -> FileListOutput:
        """列出目录中的文件"""
        is_valid, result = self._validate_path(input_data.directory)
        if not is_valid:
            return FileListOutput(files=[], count=0, success=False, error=result)
        
        try:
            path = Path(result)
            if not path.is_dir():
                return FileListOutput(files=[], count=0, success=False, error="不是有效的目录")
            
            if input_data.recursive:
                files = [str(f) for f in path.rglob(input_data.pattern) if f.is_file()]
            else:
                files = [str(f) for f in path.glob(input_data.pattern) if f.is_file()]
            
            return FileListOutput(files=files, count=len(files), success=True)
            
        except Exception as e:
            return FileListOutput(files=[], count=0, success=False, error=str(e))


# ============ 使用示例 ============

if __name__ == "__main__":
    tool = FileOperationTool(allowed_paths=["/tmp/test"])
    
    # 写入文件
    write_result = tool.write(FileWriteInput(
        file_path="/tmp/test/demo.txt",
        content="Hello, Agent!\n这是测试内容。"
    ))
    print(f"写入结果: {write_result}")
    
    # 读取文件
    read_result = tool.read(FileReadInput(
        file_path="/tmp/test/demo.txt"
    ))
    print(f"读取结果: {read_result}")
    
    # 列出文件
    list_result = tool.list_files(FileListInput(
        directory="/tmp/test",
        pattern="*.txt"
    ))
    print(f"文件列表: {list_result}")
```

#### 3.2 HTTP 请求工具

```python
import httpx
import asyncio
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from tenacity import retry, stop_after_attempt, wait_exponential

# ============ 输入输出 Schema ============

class HTTPRequestInput(BaseModel):
    url: str = Field(description="请求 URL")
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"] = Field(
        default="GET", 
        description="HTTP 方法"
    )
    headers: Optional[Dict[str, str]] = Field(
        default=None, 
        description="请求头"
    )
    params: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="URL 参数"
    )
    json_data: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="JSON 请求体"
    )
    timeout: Optional[float] = Field(
        default=30.0, 
        description="超时时间（秒）"
    )

class HTTPRequestOutput(BaseModel):
    status_code: int = Field(description="HTTP 状态码")
    headers: Dict[str, str] = Field(description="响应头")
    content: str = Field(description="响应内容")
    json_data: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="解析后的 JSON 数据"
    )
    success: bool = Field(description="请求是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")
    duration_ms: float = Field(description="请求耗时（毫秒）")

# ============ 工具实现 ============

class HTTPRequestTool:
    """
    HTTP 请求工具 - 发起 HTTP 请求并处理响应
    
    特性：
    - 支持 GET/POST/PUT/DELETE/PATCH
    - 自动重试机制
    - 超时控制
    - 响应自动解析（JSON）
    """
    
    name = "http_request"
    description = "发起 HTTP 请求，支持各种方法和自动重试"
    
    def __init__(
        self,
        max_retries: int = 3,
        default_timeout: float = 30.0
    ):
        self.max_retries = max_retries
        self.default_timeout = default_timeout
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(default_timeout),
            follow_redirects=True
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def execute(self, input_data: HTTPRequestInput) -> HTTPRequestOutput:
        """执行 HTTP 请求"""
        import time
        start_time = time.time()
        
        try:
            method = input_data.method.upper()
            
            request_kwargs = {
                "url": input_data.url,
                "headers": input_data.headers or {},
            }
            
            if input_data.params:
                request_kwargs["params"] = input_data.params
            
            if input_data.json_data and method in ["POST", "PUT", "PATCH"]:
                request_kwargs["json"] = input_data.json_data
            
            response = await self.client.request(method, **request_kwargs)
            
            duration_ms = (time.time() - start_time) * 1000
            
            # 尝试解析 JSON
            json_data = None
            try:
                json_data = response.json()
            except:
                pass
            
            return HTTPRequestOutput(
                status_code=response.status_code,
                headers=dict(response.headers),
                content=response.text,
                json_data=json_data,
                success=200 <= response.status_code < 300,
                error=None if 200 <= response.status_code < 300 else f"HTTP {response.status_code}",
                duration_ms=duration_ms
            )
            
        except httpx.TimeoutException as e:
            duration_ms = (time.time() - start_time) * 1000
            return HTTPRequestOutput(
                status_code=0,
                headers={},
                content="",
                success=False,
                error=f"请求超时: {str(e)}",
                duration_ms=duration_ms
            )
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return HTTPRequestOutput(
                status_code=0,
                headers={},
                content="",
                success=False,
                error=f"请求失败: {str(e)}",
                duration_ms=duration_ms
            )
    
    async def close(self):
        """关闭 HTTP 客户端"""
        await self.client.aclose()


# ============ 使用示例 ============

async def main():
    tool = HTTPRequestTool()
    
    # GET 请求示例
    result = await tool.execute(HTTPRequestInput(
        url="https://api.github.com/users/github",
        method="GET",
        headers={"Accept": "application/vnd.github.v3+json"}
    ))
    
    print(f"状态码: {result.status_code}")
    print(f"成功: {result.success}")
    print(f"耗时: {result.duration_ms:.2f}ms")
    if result.json_data:
        print(f"用户名: {result.json_data.get('login')}")
        print(f"公开仓库数: {result.json_data.get('public_repos')}")
    
    await tool.close()

if __name__ == "__main__":
    asyncio.run(main())
```

#### 3.3 数据库查询工具

```python
import sqlite3
import asyncio
from contextlib import contextmanager
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from tenacity import retry, stop_after_attempt, wait_exponential

# ============ 输入输出 Schema ============

class DatabaseQueryInput(BaseModel):
    query: str = Field(description="SQL 查询语句")
    params: Optional[tuple] = Field(
        default=None, 
        description="查询参数（防止 SQL 注入）"
    )
    max_rows: Optional[int] = Field(
        default=1000, 
        description="最大返回行数"
    )
    timeout: Optional[float] = Field(
        default=30.0, 
        description="查询超时时间（秒）"
    )

class DatabaseQueryOutput(BaseModel):
    columns: List[str] = Field(description="列名列表")
    rows: List[Dict[str, Any]] = Field(description="查询结果")
    row_count: int = Field(description="返回行数")
    success: bool = Field(description="查询是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")
    duration_ms: float = Field(description="查询耗时（毫秒）")

class DatabaseExecuteInput(BaseModel):
    statement: str = Field(description="SQL 执行语句（INSERT/UPDATE/DELETE）")
    params: Optional[tuple] = Field(default=None, description="执行参数")

class DatabaseExecuteOutput(BaseModel):
    affected_rows: int = Field(description="影响的行数")
    last_insert_id: Optional[int] = Field(default=None, description="最后插入的 ID")
    success: bool = Field(description="执行是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")

# ============ 工具实现 ============

class DatabaseQueryTool:
    """
    数据库查询工具 - 安全地执行 SQL 查询
    
    安全特性：
    - 参数化查询，防止 SQL 注入
    - 只读模式可选（禁止修改操作）
    - 查询超时控制
    - 敏感操作白名单
    """
    
    name = "database_query"
    description = "执行安全的 SQL 查询和操作"
    
    # 允许的只读操作
    READONLY_KEYWORDS = ['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'DESCRIBE']
    # 危险的 DDL 操作
    DANGEROUS_KEYWORDS = ['DROP', 'TRUNCATE', 'DELETE']
    
    def __init__(
        self,
        db_path: str = ":memory:",
        readonly: bool = False,
        max_rows: int = 1000
    ):
        self.db_path = db_path
        self.readonly = readonly
        self.max_rows = max_rows
    
    @contextmanager
    def _get_connection(self):
        """获取数据库连接（上下文管理器）"""
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
        try:
            yield conn
        finally:
            conn.close()
    
    def _validate_query(self, query: str) -> tuple[bool, str]:
        """验证 SQL 查询是否安全"""
        upper_query = query.strip().upper()
        
        # 检查是否为只读模式下的修改操作
        if self.readonly:
            is_readonly = any(
                upper_query.startswith(kw) 
                for kw in self.READONLY_KEYWORDS
            )
            if not is_readonly:
                return False, "只读模式下不允许执行修改操作"
        
        # 警告危险操作
        for keyword in self.DANGEROUS_KEYWORDS:
            if keyword in upper_query:
                return False, f"检测到危险操作: {keyword}"
        
        return True, ""
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5)
    )
    def query(self, input_data: DatabaseQueryInput) -> DatabaseQueryOutput:
        """执行查询语句"""
        import time
        start_time = time.time()
        
        # 验证查询
        is_valid, error_msg = self._validate_query(input_data.query)
        if not is_valid:
            return DatabaseQueryOutput(
                columns=[], rows=[], row_count=0,
                success=False, error=error_msg,
                duration_ms=(time.time() - start_time) * 1000
            )
        
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                if input_data.params:
                    cursor.execute(input_data.query, input_data.params)
                else:
                    cursor.execute(input_data.query)
                
                # 获取列名
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                
                # 获取结果（限制行数）
                rows = []
                for i, row in enumerate(cursor.fetchall()):
                    if i >= input_data.max_rows:
                        break
                    rows.append(dict(row))
                
                duration_ms = (time.time() - start_time) * 1000
                
                return DatabaseQueryOutput(
                    columns=columns,
                    rows=rows,
                    row_count=len(rows),
                    success=True,
                    duration_ms=duration_ms
                )
                
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return DatabaseQueryOutput(
                columns=[], rows=[], row_count=0,
                success=False, error=str(e),
                duration_ms=duration_ms
            )
    
    def execute(self, input_data: DatabaseExecuteInput) -> DatabaseExecuteOutput:
        """执行修改语句"""
        if self.readonly:
            return DatabaseExecuteOutput(
                affected_rows=0,
                success=False,
                error="只读模式下不允许执行修改操作"
            )
        
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                if input_data.params:
                    cursor.execute(input_data.statement, input_data.params)
                else:
                    cursor.execute(input_data.statement)
                
                conn.commit()
                
                return DatabaseExecuteOutput(
                    affected_rows=cursor.rowcount,
                    last_insert_id=cursor.lastrowid,
                    success=True
                )
                
        except Exception as e:
            return DatabaseExecuteOutput(
                affected_rows=0,
                success=False,
                error=str(e)
            )


# ============ 使用示例 ============

if __name__ == "__main__":
    # 创建内存数据库并初始化
    tool = DatabaseQueryTool(db_path=":memory:")
    
    # 创建表
    tool.execute(DatabaseExecuteInput(
        statement="""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                age INTEGER
            )
        """
    ))
    
    # 插入数据
    tool.execute(DatabaseExecuteInput(
        statement="INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        params=("Alice", "alice@example.com", 28)
    ))
    tool.execute(DatabaseExecuteInput(
        statement="INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        params=("Bob", "bob@example.com", 32)
    ))
    
    # 查询数据
    result = tool.query(DatabaseQueryInput(
        query="SELECT * FROM users WHERE age > ?",
        params=(25,)
    ))
    
    print(f"查询成功: {result.success}")
    print(f"列名: {result.columns}")
    print(f"行数: {result.row_count}")
    print(f"耗时: {result.duration_ms:.2f}ms")
    for row in result.rows:
        print(f"  {row}")
```

### 4. 错误处理、重试机制与超时控制

#### 4.1 错误处理策略

```python
from enum import Enum
from typing import Optional, Callable
from dataclasses import dataclass

class ErrorSeverity(Enum):
    """错误严重程度"""
    WARNING = "warning"      # 警告，可继续
    ERROR = "error"          # 错误，需处理
    CRITICAL = "critical"    # 严重错误，终止

@dataclass
class ToolError:
    """工具错误信息"""
    code: str                    # 错误代码
    message: str                 # 错误信息
    severity: ErrorSeverity      # 严重程度
    recoverable: bool           # 是否可恢复
    suggestion: Optional[str]   # 修复建议

class ErrorHandler:
    """错误处理器"""
    
    def __init__(self):
        self.error_callbacks: Dict[str, Callable] = {}
        self.error_log: List[ToolError] = []
    
    def register_handler(self, error_code: str, callback: Callable):
        """注册错误处理器"""
        self.error_callbacks[error_code] = callback
    
    def handle(self, error: ToolError) -> bool:
        """处理错误，返回是否已处理"""
        self.error_log.append(error)
        
        # 严重错误直接抛出
        if error.severity == ErrorSeverity.CRITICAL:
            raise Exception(f"[{error.code}] {error.message}")
        
        # 调用注册的处理器
        if error.code in self.error_callbacks:
            self.error_callbacks[error.code](error)
            return True
        
        return False

# 使用示例
def on_timeout_error(error: ToolError):
    print(f"超时错误处理: {error.message}")
    # 可以在这里发送告警、记录日志等

error_handler = ErrorHandler()
error_handler.register_handler("TIMEOUT", on_timeout_error)
```

#### 4.2 重试机制实现

```python
import time
import random
from functools import wraps
from typing import TypeVar, Callable, Optional

T = TypeVar('T')

class RetryConfig:
    """重试配置"""
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: tuple = (Exception,)
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions

def with_retry(config: Optional[RetryConfig] = None):
    """重试装饰器"""
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None
            
            for attempt in range(1, config.max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt == config.max_attempts:
                        break
                    
                    # 计算延迟时间（指数退避 + 抖动）
                    delay = min(
                        config.base_delay * (config.exponential_base ** (attempt - 1)),
                        config.max_delay
                    )
                    
                    if config.jitter:
                        delay = delay * (0.5 + random.random() * 0.5)
                    
                    print(f"尝试 {attempt} 失败: {e}，{delay:.2f}秒后重试...")
                    time.sleep(delay)
            
            raise last_exception
        
        return wrapper
    return decorator

# 使用示例
class APIClient:
    @with_retry(config=RetryConfig(
        max_attempts=3,
        base_delay=1.0,
        retryable_exceptions=(ConnectionError, TimeoutError)
    ))
    def call_api(self, url: str) -> dict:
        """调用 API，失败自动重试"""
        import requests
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
```

#### 4.3 超时控制

```python
import signal
import asyncio
from contextlib import contextmanager
from typing import Optional

class TimeoutError(Exception):
    """自定义超时异常"""
    pass

# ============ 同步代码超时 ============

@contextmanager
def timeout_context(seconds: float):
    """同步代码超时上下文管理器（Unix only）"""
    def handler(signum, frame):
        raise TimeoutError(f"操作超时（{seconds}秒）")
    
    # 设置信号处理器
    old_handler = signal.signal(signal.SIGALRM, handler)
    signal.alarm(int(seconds))
    
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)

# ============ 异步代码超时 ============

async def with_timeout(
    coroutine,
    timeout_seconds: float,
    timeout_message: Optional[str] = None
):
    """异步代码超时包装器"""
    try:
        return await asyncio.wait_for(
            coroutine,
            timeout=timeout_seconds
        )
    except asyncio.TimeoutError:
        raise TimeoutError(
            timeout_message or f"操作超时（{timeout_seconds}秒）"
        )

# ============ 使用示例 ============

# 同步示例
def long_running_task():
    import time
    time.sleep(10)
    return "完成"

try:
    with timeout_context(5.0):
        result = long_running_task()
        print(result)
except TimeoutError as e:
    print(f"捕获超时: {e}")

# 异步示例
async def async_long_task():
    await asyncio.sleep(10)
    return "完成"

async def main():
    try:
        result = await with_timeout(
            async_long_task(),
            timeout_seconds=5.0
        )
        print(result)
    except TimeoutError as e:
        print(f"捕获超时: {e}")

# asyncio.run(main())
```

## 动手实战：Git 仓库分析工具

### 实战目标

开发一个「Git 仓库分析工具」，集成到 Agent 中，实现以下功能：

1. 获取仓库基本信息（提交数、分支数、贡献者）
2. 分析代码统计（语言分布、代码行数）
3. 生成提交历史报告
4. 检测代码质量指标

### 完整代码实现

```python
#!/usr/bin/env python3
"""
Git 仓库分析工具
集成到 Agent 中，提供仓库分析能力
"""

import subprocess
import json
import re
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# ============ 输入输出 Schema ============

class GitRepoInput(BaseModel):
    repo_path: str = Field(
        description="Git 仓库路径",
        examples=["/path/to/repo"]
    )
    analysis_type: str = Field(
        default="full",
        description="分析类型: basic(基础), stats(统计), contributors(贡献者), full(完整)"
    )
    since: Optional[str] = Field(
        default=None,
        description="起始日期 (YYYY-MM-DD)"
    )
    until: Optional[str] = Field(
        default=None,
        description="结束日期 (YYYY-MM-DD)"
    )

class GitBasicInfo(BaseModel):
    repo_name: str = Field(description="仓库名称")
    remote_url: Optional[str] = Field(description="远程仓库地址")
    branch_count: int = Field(description="分支数量")
    tag_count: int = Field(description="标签数量")
    commit_count: int = Field(description="提交数量")
    last_commit_date: Optional[str] = Field(description="最后提交日期")

class GitStats(BaseModel):
    total_files: int = Field(description="文件总数")
    total_lines: int = Field(description="代码总行数")
    language_stats: Dict[str, int] = Field(description="语言分布")
    file_type_stats: Dict[str, int] = Field(description="文件类型分布")

class GitContributor(BaseModel):
    name: str = Field(description="贡献者名称")
    email: str = Field(description="贡献者邮箱")
    commit_count: int = Field(description="提交数量")
    line_added: int = Field(description="添加行数")
    line_deleted: int = Field(description="删除行数")

class GitAnalysisOutput(BaseModel):
    basic_info: Optional[GitBasicInfo] = Field(default=None)
    stats: Optional[GitStats] = Field(default=None)
    contributors: Optional[List[GitContributor]] = Field(default=None)
    recent_commits: Optional[List[Dict[str, Any]]] = Field(default=None)
    success: bool = Field(description="分析是否成功")
    error: Optional[str] = Field(default=None, description="错误信息")
    analysis_time: str = Field(description="分析时间")

# ============ 工具实现 ============

class GitRepositoryTool:
    """
    Git 仓库分析工具
    
    功能：
    - 获取仓库基础信息
    - 统计代码量和语言分布
    - 分析贡献者数据
    - 生成提交历史报告
    
    使用示例：
        tool = GitRepositoryTool()
        result = tool.analyze(GitRepoInput(
            repo_path="/path/to/repo",
            analysis_type="full"
        ))
    """
    
    name = "git_repository_analyzer"
    description = """
    分析 Git 仓库的各种指标，包括提交历史、代码统计、贡献者信息等。
    适用于：代码审查、项目健康度检查、团队贡献分析等场景。
    """
    
    def __init__(self, timeout: int = 60):
        self.timeout = timeout
    
    def _run_git_command(
        self,
        repo_path: str,
        command: List[str],
        check: bool = True
    ) -> tuple[bool, str]:
        """执行 Git 命令"""
        try:
            result = subprocess.run(
                ['git', '-C', repo_path] + command,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            if check and result.returncode != 0:
                return False, result.stderr
            
            return True, result.stdout
        except subprocess.TimeoutExpired:
            return False, f"命令超时（{self.timeout}秒）"
        except Exception as e:
            return False, str(e)
    
    def _validate_repo(self, repo_path: str) -> tuple[bool, str]:
        """验证是否为有效的 Git 仓库"""
        path = Path(repo_path)
        if not path.exists():
            return False, f"路径不存在: {repo_path}"
        
        if not (path / '.git').exists():
            return False, f"不是有效的 Git 仓库: {repo_path}"
        
        return True, ""
    
    def _get_basic_info(self, repo_path: str) -> GitBasicInfo:
        """获取仓库基础信息"""
        # 仓库名称
        repo_name = Path(repo_path).name
        
        # 远程地址
        success, remote = self._run_git_command(
            repo_path, ['remote', 'get-url', 'origin'], check=False
        )
        remote_url = remote.strip() if success else None
        
        # 分支数量
        success, branches = self._run_git_command(
            repo_path, ['branch', '-a']
        )
        branch_count = len([b for b in branches.split('\n') if b.strip()])
        
        # 标签数量
        success, tags = self._run_git_command(
            repo_path, ['tag', '-l'], check=False
        )
        tag_count = len([t for t in tags.split('\n') if t.strip()])
        
        # 提交数量
        success, commits = self._run_git_command(
            repo_path, ['rev-list', '--count', 'HEAD']
        )
        commit_count = int(commits.strip()) if success else 0
        
        # 最后提交日期
        success, last_date = self._run_git_command(
            repo_path, ['log', '-1', '--format=%ci']
        )
        last_commit_date = last_date.strip() if success else None
        
        return GitBasicInfo(
            repo_name=repo_name,
            remote_url=remote_url,
            branch_count=branch_count,
            tag_count=tag_count,
            commit_count=commit_count,
            last_commit_date=last_commit_date
        )
    
    def _get_stats(self, repo_path: str) -> GitStats:
        """获取代码统计信息"""
        # 文件统计
        success, files = self._run_git_command(
            repo_path, ['ls-files'], check=False
        )
        file_list = [f for f in files.split('\n') if f.strip()]
        total_files = len(file_list)
        
        # 代码行数统计
        success, line_count = self._run_git_command(
            repo_path, ['wc', '-l'] + file_list, check=False
        )
        total_lines = 0
        if success:
            try:
                # 取最后一行的总计数
                total_lines = int(line_count.strip().split('\n')[-1].split()[0])
            except:
                pass
        
        # 语言分布统计
        language_stats = defaultdict(int)
        file_type_stats = defaultdict(int)
        
        for file_path in file_list:
            ext = Path(file_path).suffix.lower()
            if ext:
                file_type_stats[ext] += 1
                # 简单的语言映射
                lang_map = {
                    '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
                    '.jsx': 'React', '.tsx': 'React', '.vue': 'Vue',
                    '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
                    '.cpp': 'C++', '.c': 'C', '.h': 'C/C++',
                    '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS',
                    '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
                    '.md': 'Markdown', '.sql': 'SQL', '.sh': 'Shell'
                }
                language_stats[lang_map.get(ext, 'Other')] += 1
        
        return GitStats(
            total_files=total_files,
            total_lines=total_lines,
            language_stats=dict(language_stats),
            file_type_stats=dict(file_type_stats)
        )
    
    def _get_contributors(self, repo_path: str) -> List[GitContributor]:
        """获取贡献者信息"""
        # 获取提交统计
        success, log = self._run_git_command(
            repo_path,
            ['log', '--format=%an|%ae', '--shortstat']
        )
        
        if not success:
            return []
        
        contributors = defaultdict(lambda: {
            'commits': 0,
            'added': 0,
            'deleted': 0
        })
        
        current_author = None
        for line in log.split('\n'):
            if '|' in line:
                name, email = line.split('|', 1)
                current_author = (name, email)
                contributors[current_author]['commits'] += 1
            elif 'insertion' in line or 'deletion' in line:
                # 解析插入/删除行数
                added_match = re.search(r'(\d+) insertion', line)
                deleted_match = re.search(r'(\d+) deletion', line)
                
                if current_author:
                    if added_match:
                        contributors[current_author]['added'] += int(added_match.group(1))
                    if deleted_match:
                        contributors[current_author]['deleted'] += int(deleted_match.group(1))
        
        # 转换为列表
        result = []
        for (name, email), stats in sorted(
            contributors.items(),
            key=lambda x: x[1]['commits'],
            reverse=True
        ):
            result.append(GitContributor(
                name=name,
                email=email,
                commit_count=stats['commits'],
                line_added=stats['added'],
                line_deleted=stats['deleted']
            ))
        
        return result[:20]  # 只返回前 20 名
    
    def _get_recent_commits(
        self,
        repo_path: str,
        since: Optional[str] = None,
        until: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """获取最近的提交历史"""
        command = ['log', '--format=%H|%an|%ae|%ci|%s', '-20']
        
        if since:
            command.extend(['--since', since])
        if until:
            command.extend(['--until', until])
        
        success, log = self._run_git_command(repo_path, command)
        
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
    
    def analyze(self, input_data: GitRepoInput) -> GitAnalysisOutput:
        """执行仓库分析"""
        analysis_time = datetime.now().isoformat()
        
        # 验证仓库
        is_valid, error = self._validate_repo(input_data.repo_path)
        if not is_valid:
            return GitAnalysisOutput(
                success=False,
                error=error,
                analysis_time=analysis_time
            )
        
        try:
            result = GitAnalysisOutput(
                success=True,
                analysis_time=analysis_time
            )
            
            analysis_type = input_data.analysis_type
            
            # 基础信息
            if analysis_type in ['basic', 'full']:
                result.basic_info = self._get_basic_info(input_data.repo_path)
            
            # 代码统计
            if analysis_type in ['stats', 'full']:
                result.stats = self._get_stats(input_data.repo_path)
            
            # 贡献者信息
            if analysis_type in ['contributors', 'full']:
                result.contributors = self._get_contributors(input_data.repo_path)
            
            # 最近提交
            if analysis_type == 'full':
                result.recent_commits = self._get_recent_commits(
                    input_data.repo_path,
                    input_data.since,
                    input_data.until
                )
            
            return result
            
        except Exception as e:
            return GitAnalysisOutput(
                success=False,
                error=str(e),
                analysis_time=analysis_time
            )


# ============ 集成到 LangChain Agent ============

from langchain.tools import BaseTool
from langchain.agents import AgentType, initialize_agent
from langchain_openai import ChatOpenAI

class LangChainGitTool(BaseTool):
    """LangChain 集成的 Git 分析工具"""
    
    name = "git_analyzer"
    description = """
    分析 Git 仓库的各种指标。
    输入应该是一个 JSON 对象，包含：
    - repo_path: 仓库路径（必需）
    - analysis_type: 分析类型，可选值：basic(基础), stats(统计), contributors(贡献者), full(完整)
    - since: 起始日期（可选）
    - until: 结束日期（可选）
    """
    
    def __init__(self):
        super().__init__()
        self._tool = GitRepositoryTool()
    
    def _run(self, query: str) -> str:
        """执行工具"""
        try:
            # 解析输入
            params = json.loads(query)
            input_data = GitRepoInput(**params)
            
            # 执行分析
            result = self._tool.analyze(input_data)
            
            # 返回格式化结果
            return json.dumps(result.dict(), indent=2, ensure_ascii=False)
            
        except json.JSONDecodeError:
            return "错误：输入必须是有效的 JSON 格式"
        except Exception as e:
            return f"分析失败: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """异步执行（可选实现）"""
        return self._run(query)


# ============ 使用示例 ============

def demo():
    """演示如何使用 Git 分析工具"""
    
    # 创建工具实例
    tool = GitRepositoryTool()
    
    # 分析当前目录（如果是 Git 仓库）
    import os
    repo_path = os.getcwd()
    
    print(f"正在分析仓库: {repo_path}\n")
    
    # 完整分析
    result = tool.analyze(GitRepoInput(
        repo_path=repo_path,
        analysis_type="full"
    ))
    
    if result.success:
        print("✅ 分析成功！\n")
        
        if result.basic_info:
            print("📦 基础信息:")
            print(f"  仓库名称: {result.basic_info.repo_name}")
            print(f"  远程地址: {result.basic_info.remote_url or 'N/A'}")
            print(f"  分支数量: {result.basic_info.branch_count}")
            print(f"  提交数量: {result.basic_info.commit_count}")
            print(f"  最后提交: {result.basic_info.last_commit_date}")
            print()
        
        if result.stats:
            print("📊 代码统计:")
            print(f"  文件总数: {result.stats.total_files}")
            print(f"  代码行数: {result.stats.total_lines:,}")
            print("  语言分布:")
            for lang, count in sorted(
                result.stats.language_stats.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]:
                print(f"    - {lang}: {count} 文件")
            print()
        
        if result.contributors:
            print("👥 主要贡献者:")
            for i, c in enumerate(result.contributors[:5], 1):
                print(f"  {i}. {c.name}: {c.commit_count} 提交")
            print()
        
        if result.recent_commits:
            print("📝 最近提交:")
            for commit in result.recent_commits[:5]:
                print(f"  [{commit['hash']}] {commit['message'][:50]}")
    else:
        print(f"❌ 分析失败: {result.error}")


def demo_with_agent():
    """演示如何在 Agent 中使用"""
    
    # 需要设置 OPENAI_API_KEY
    import os
    if not os.getenv("OPENAI_API_KEY"):
        print("请设置 OPENAI_API_KEY 环境变量")
        return
    
    # 初始化 LLM
    llm = ChatOpenAI(temperature=0)
    
    # 创建工具
    tools = [LangChainGitTool()]
    
    # 初始化 Agent
    agent = initialize_agent(
        tools,
        llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )
    
    # 运行 Agent
    response = agent.run(
        f"请分析当前目录的 Git 仓库，告诉我项目的基本信息和代码统计。"
        f'输入: {{"repo_path": ".", "analysis_type": "full"}}'
    )
    
    print(response)


if __name__ == "__main__":
    demo()
    # demo_with_agent()  # 取消注释以测试 Agent 集成
```

### 工具集成到 Agent

```python
# agent_with_tools.py

from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain import hub
import os

# 导入我们开发的工具
from git_analyzer import GitRepositoryTool, GitRepoInput
from file_operation import FileOperationTool, FileReadInput
from http_request import HTTPRequestTool, HTTPRequestInput

def create_agent_with_tools():
    """创建带有自定义工具的 Agent"""
    
    # 初始化 LLM
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # 初始化工具
    git_tool = GitRepositoryTool()
    file_tool = FileOperationTool(allowed_paths=[os.getcwd()])
    http_tool = HTTPRequestTool()
    
    # 包装成 LangChain Tool
    tools = [
        Tool(
            name="git_analyze",
            func=lambda x: git_tool.analyze(GitRepoInput(**eval(x))).json(),
            description="""
            分析 Git 仓库信息。输入格式: {"repo_path": "路径", "analysis_type": "full"}
            analysis_type 可选: basic(基础), stats(统计), contributors(贡献者), full(完整)
            """
        ),
        Tool(
            name="file_read",
            func=lambda x: file_tool.read(FileReadInput(**eval(x))).json(),
            description="读取文件内容。输入格式: {"file_path": "路径"}"
        ),
        Tool(
            name="http_request",
            func=lambda x: asyncio.run(http_tool.execute(HTTPRequestInput(**eval(x)))).json(),
            description="""
            发起 HTTP 请求。输入格式: {"url": "地址", "method": "GET"}
            支持 GET/POST/PUT/DELETE 方法
            """
        )
    ]
    
    # 获取 ReAct prompt
    prompt = hub.pull("hwchase17/react")
    
    # 创建 Agent
    agent = create_react_agent(llm, tools, prompt)
    
    # 创建执行器
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True
    )
    
    return agent_executor


# 使用示例
if __name__ == "__main__":
    agent = create_agent_with_tools()
    
    # 测试 Agent
    result = agent.invoke({
        "input": "分析当前目录的 Git 仓库，告诉我项目的基本信息和主要贡献者"
    })
    
    print("\n最终结果:")
    print(result['output'])
```

## 避坑指南

### ❌ 常见错误

| 错误类型 | 问题描述 | 解决方案 |
|---------|---------|---------|
| Schema 不匹配 | 输入/输出类型定义不清晰 | 使用 Pydantic 严格定义 Schema |
| 工具描述模糊 | LLM 不知道何时使用该工具 | 编写详细的使用场景和示例 |
| 缺乏错误处理 | 工具崩溃导致 Agent 失败 | 完善的异常捕获和错误返回 |
| 无超时控制 | 长时间运行阻塞 Agent | 实现超时机制和异步支持 |
| 安全问题 | 路径遍历、SQL 注入等 | 输入验证、参数化查询、白名单 |

### ⚠️ 安全注意事项

1. **路径安全**：始终验证文件路径，防止目录遍历攻击
2. **命令注入**：避免直接拼接用户输入到系统命令
3. **资源限制**：限制文件大小、查询行数、递归深度
4. **敏感信息**：避免工具暴露密码、密钥等敏感数据
5. **权限控制**：根据场景设置只读或读写权限

### 🔧 调试技巧

```python
# 1. 开启详细日志
import logging
logging.basicConfig(level=logging.DEBUG)

# 2. 工具单元测试
import unittest

class TestGitTool(unittest.TestCase):
    def setUp(self):
        self.tool = GitRepositoryTool()
    
    def test_basic_info(self):
        result = self.tool.analyze(GitRepoInput(
            repo_path=".",
            analysis_type="basic"
        ))
        self.assertTrue(result.success)
        self.assertIsNotNone(result.basic_info)

# 3. Mock 外部依赖
from unittest.mock import patch, MagicMock

@patch('subprocess.run')
def test_with_mock(mock_run):
    mock_run.return_value = MagicMock(
        returncode=0,
        stdout="mocked output"
    )
    # 测试代码...
```

## 面试考点

### 高频面试题

**Q1: Tool 设计的核心原则是什么？**

> **答案要点**：
> 1. 单一职责：一个 Tool 只做一件事
> 2. Schema 明确：输入输出类型清晰定义
> 3. 自描述性：详细描述功能和使用场景
> 4. 错误处理：完善的异常处理和错误返回
> 5. 安全性：输入验证、权限控制

**Q2: 如何实现 Tool 的错误处理和重试机制？**

> **答案要点**：
> 1. 使用 try-except 捕获各类异常
> 2. 返回统一的错误格式（success + error）
> 3. 使用 tenacity 等库实现自动重试
> 4. 指数退避策略避免频繁重试
> 5. 区分可恢复错误和不可恢复错误

**Q3: Tool 的输入输出为什么要用 Schema 定义？**

> **答案要点**：
> 1. **类型安全**：编译时/运行时类型检查
> 2. **自文档**：Schema 本身就是接口文档
> 3. **LLM 理解**：帮助 LLM 理解参数格式
> 4. **验证转换**：自动验证和类型转换
> 5. **IDE 支持**：代码补全和类型提示

**Q4: 如何防止 Tool 被滥用（安全问题）？**

> **答案要点**：
> 1. 输入验证：白名单、正则表达式
> 2. 路径安全：解析后验证、禁止相对路径跳转
> 3. 资源限制：文件大小、超时时间、递归深度
> 4. 权限控制：只读模式、操作白名单
> 5. 审计日志：记录所有工具调用

**Q5: 如何评估一个 Tool 设计的好坏？**

> **答案要点**：
> 1. **易用性**：调用简单，参数直观
> 2. **可靠性**：错误处理完善，不会意外崩溃
> 3. **性能**：响应快速，资源占用合理
> 4. **安全性**：无安全漏洞，权限控制得当
> 5. **可维护性**：代码清晰，文档完善

### 实战编程题

**题目：实现一个带缓存的 HTTP 请求工具**

要求：
1. 支持 GET/POST 请求
2. 实现本地缓存，避免重复请求
3. 支持缓存过期策略
4. 完善的错误处理

**参考答案**：

```python
import hashlib
import json
import time
from functools import wraps
from typing import Optional, Dict, Any
import httpx

class CachedHTTPClient:
    """带缓存的 HTTP 客户端"""
    
    def __init__(self, cache_ttl: int = 300):
        self.cache = {}
        self.cache_ttl = cache_ttl
        self.client = httpx.Client()
    
    def _get_cache_key(self, url: str, params: Optional[dict]) -> str:
        """生成缓存键"""
        key_data = f"{url}:{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_entry: dict) -> bool:
        """检查缓存是否有效"""
        return time.time() - cache_entry['timestamp'] < self.cache_ttl
    
    def request(
        self,
        method: str,
        url: str,
        params: Optional[dict] = None,
        use_cache: bool = True
    ) -> dict:
        """发起 HTTP 请求（带缓存）"""
        cache_key = self._get_cache_key(url, params)
        
        # 检查缓存
        if use_cache and method == "GET":
            if cache_key in self.cache:
                if self._is_cache_valid(self.cache[cache_key]):
                    return {
                        'data': self.cache[cache_key]['data'],
                        'from_cache': True
                    }
        
        # 发起请求
        try:
            response = self.client.request(method, url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # 写入缓存
            if method == "GET" and use_cache:
                self.cache[cache_key] = {
                    'data': data,
                    'timestamp': time.time()
                }
            
            return {'data': data, 'from_cache': False}
            
        except httpx.HTTPError as e:
            return {'error': str(e), 'status_code': e.response.status_code if hasattr(e, 'response') else None}
        except Exception as e:
            return {'error': str(e)}
    
    def clear_cache(self):
        """清除缓存"""
        self.cache.clear()
```

## 扩展阅读

### 推荐资源

1. **官方文档**
   - [LangChain Tools 文档](https://python.langchain.com/docs/modules/agents/tools/)
   - [Pydantic 文档](https://docs.pydantic.dev/)
   - [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

2. **开源项目**
   - [LangChain Community Tools](https://github.com/langchain-ai/langchain/tree/master/libs/community/langchain_community/tools)
   - [Composio](https://github.com/composiohq/composio) - 丰富的工具生态
   - [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) - 工具使用示例

3. **技术文章**
   - [Building effective agents](https://www.anthropic.com/research/building-effective-agents) - Anthropic
   - [Function Calling Best Practices](https://platform.openai.com/docs/guides/function-calling)

### 工具生态

| 类别 | 推荐工具 | 用途 |
|-----|---------|-----|
| 搜索 | DuckDuckGo, Tavily | 网络搜索 |
| 数据库 | SQLDatabase, MongoDB | 数据查询 |
| 文件 | FileSystem, PDFLoader | 文件操作 |
| API | Requests, OpenAPI | HTTP 调用 |
| 代码 | PythonREPL, Shell | 代码执行 |
| 可视化 | Matplotlib, Plotly | 图表生成 |

## 课后练习

### 练习 1：文件搜索工具

实现一个支持以下功能的文件搜索工具：
- 按文件名模式搜索（支持通配符）
- 按文件内容搜索（支持正则表达式）
- 按文件大小、修改时间过滤
- 返回匹配文件列表和摘要

### 练习 2：API 聚合工具

开发一个可以同时调用多个 API 并聚合结果的工具：
- 支持并行请求
- 统一的错误处理
- 结果合并和去重
- 部分失败容错

### 练习 3：数据库迁移工具

创建一个数据库 Schema 迁移工具：
- 支持版本管理
- 自动迁移和回滚
- 迁移前备份
- 迁移日志记录

### 练习 4：自定义 Tool 集成

选择你常用的一个 API（如天气、股票、翻译等）：
- 封装成 Tool
- 编写完整的 Schema 定义
- 实现错误处理和重试
- 集成到 Agent 中测试

---

> 💡 **学习建议**：工具开发是 Agent 开发的核心技能。建议从简单的文件操作工具开始，逐步增加复杂度。多阅读 LangChain 社区工具源码，学习最佳实践。

> 📚 **下节预告**：[06-多 Agent 协作：从单打独斗到团队协作](./06-多-Agent-协作：从单打独斗到团队协作.md)
