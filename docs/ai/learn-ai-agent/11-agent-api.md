---
title: 11-Agent 服务化：构建生产级 API
description: 使用 FastAPI 封装 Agent 为 RESTful API，实现流式响应、文件上传与会话管理
---

# 11-Agent 服务化：构建生产级 API

> 把 Agent 变成"即插即用"的 API 服务，让前端同学像调用普通接口一样使用 AI 能力

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| API 开发能力 | ✅ FastAPI 框架深度使用 |
| 实时通信能力 | ✅ SSE 流式响应实现 |
| 系统设计能力 | ✅ RESTful API 设计规范 |
| 工程化能力 | ✅ 错误处理、接口文档、版本管理 |

**薪资参考**：具备 Agent API 服务化能力的工程师，市场薪资溢价 20-35%

---

## 学习目标

学完本节，你将能够：

1. **像写 Express 一样写 FastAPI** —— 掌握 Python 世界最前端友好的 Web 框架
2. **设计规范的 RESTful API** —— 对话接口、文件上传、会话管理一网打尽
3. **实现"打字机效果"** —— 用 SSE 让 AI 回复像 ChatGPT 一样逐字显示
4. **写出生产级代码** —— 完善的错误处理、自动生成的 API 文档
5. **封装可复用的 Agent 服务** —— 一行代码启动，多端共享 AI 能力

---

## 前置知识

- ✅ 已完成第 10 章（LangChain Agent 基础）
- ✅ 熟悉 HTTP 协议和 RESTful 概念
- ✅ 了解 React/Vue 前端框架（用于理解接口调用场景）
- ✅ 有 Python 基础语法知识

---

## 核心概念

### 1. FastAPI：Python 世界的"Express + TypeScript"

**类比理解**：

| 前端技术 | FastAPI 对应 |
|---------|-------------|
| Express.js | FastAPI 的路由系统 |
| TypeScript | Pydantic 的类型校验 |
| Swagger UI | 自动生成的交互式文档 |
| async/await | 原生异步支持 |

**核心优势**：

```python
# 三行代码创建一个带类型校验的 API
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    message: str  # 自动校验：必须是字符串
    session_id: str | None = None  # 可选参数

@app.post("/chat")
async def chat(req: ChatRequest):
    return {"reply": f"收到: {req.message}"}
```

**启动服务**：

```bash
# 安装依赖
pip install fastapi uvicorn

# 启动（带热重载，像 npm run dev）
uvicorn main:app --reload --port 8000
```

访问 `http://localhost:8000/docs` 即可看到自动生成的 Swagger 文档！

---

### 2. RESTful API 设计：Agent 服务的接口规范

**对话接口设计**：

```
POST /api/v1/chat           # 普通对话
POST /api/v1/chat/stream    # 流式对话
GET  /api/v1/sessions/{id}  # 获取会话历史
DELETE /api/v1/sessions/{id} # 删除会话
POST /api/v1/upload         # 文件上传（供 Agent 分析）
```

**接口版本管理**：

```python
# 像管理 npm 包版本一样管理 API
from fastapi import APIRouter

# v1 版本
v1_router = APIRouter(prefix="/api/v1")

# v2 版本（未来升级时兼容旧客户端）
v2_router = APIRouter(prefix="/api/v2")

app.include_router(v1_router)
app.include_router(v2_router)
```

---

### 3. SSE（Server-Sent Events）：实现打字机效果

**原理类比**：

想象你在看直播，主播不是等全部内容准备好才开播，而是边准备边说。SSE 就是服务器向客户端"直播"数据的方式。

**SSE vs WebSocket**：

| 特性 | SSE | WebSocket |
|-----|-----|-----------|
| 通信方向 | 服务器→客户端（单向） | 双向 |
| 协议 | HTTP（简单） | ws/wss（需升级） |
| 重连 | 浏览器自动处理 | 需手动实现 |
| 适用场景 | AI 流式回复、股票推送 | 聊天室、游戏 |

**FastAPI 实现 SSE**：

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

async def generate_stream():
    """模拟 AI 逐字生成回复"""
    words = ["你好", "，", "我", "是", "AI", "助手", "。"]
    for word in words:
        # SSE 格式：data: 内容\n\n
        yield f"data: {word}\n\n"
        await asyncio.sleep(0.3)  # 模拟打字延迟
    
    # 结束标记
    yield "data: [DONE]\n\n"

@app.get("/chat/stream")
async def chat_stream():
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

**前端调用（React）**：

```tsx
function ChatComponent() {
  const [message, setMessage] = useState("");

  const handleStreamChat = async () => {
    const response = await fetch("/api/v1/chat/stream");
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // 解析 SSE 格式：data: xxx
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            console.log("流式传输完成");
          } else {
            setMessage((prev) => prev + data); // 逐字追加
          }
        }
      }
    }
  };

  return (
    <div>
      <p>{message}</p>
      <button onClick={handleStreamChat}>开始对话</button>
    </div>
  );
}
```

---

### 4. 错误处理与接口文档

**统一错误响应格式**：

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime
import uuid
import traceback

class ErrorResponse(BaseModel):
    code: str                    # 业务错误码
    message: str                 # 用户友好的错误信息
    detail: Any | None = None    # 调试信息（仅开发环境）
    request_id: str | None = None # 请求ID，用于追踪
    timestamp: datetime = Field(default_factory=datetime.now)

class APIResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: ErrorResponse | None = None
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

# 生成请求ID的中间件
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# 自定义 HTTPException 处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    # 如果 detail 是字典，尝试提取业务错误码
    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", f"HTTP_{exc.status_code}")
        message = exc.detail.get("message", str(exc.detail))
        detail = exc.detail.get("detail")
    else:
        code = f"HTTP_{exc.status_code}"
        message = str(exc.detail)
        detail = None
    
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse(
            success=False,
            data=None,
            error=ErrorResponse(
                code=code,
                message=message,
                detail=detail,
                request_id=request_id
            ),
            request_id=request_id
        ).dict()
    )

# 请求参数验证错误处理器
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    # 格式化验证错误信息
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    
    return JSONResponse(
        status_code=422,
        content=APIResponse(
            success=False,
            data=None,
            error=ErrorResponse(
                code="VALIDATION_ERROR",
                message="请求参数验证失败",
                detail=errors,
                request_id=request_id
            ),
            request_id=request_id
        ).dict()
    )

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    # 记录完整错误堆栈
    error_trace = traceback.format_exc()
    # 这里可以接入日志系统，如 logging 或 sentry
    print(f"[ERROR] Request {request_id}: {error_trace}")
    
    return JSONResponse(
        status_code=500,
        content=APIResponse(
            success=False,
            data=None,
            error=ErrorResponse(
                code="INTERNAL_ERROR",
                message="服务器内部错误，请稍后重试",
                detail=error_trace if DEBUG else None,
                request_id=request_id
            ),
            request_id=request_id
        ).dict()
    )

# 业务异常类定义
class BusinessException(HTTPException):
    """业务异常基类"""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        detail: Any = None
    ):
        self.business_code = code
        super().__init__(
            status_code=status_code,
            detail={
                "code": code,
                "message": message,
                "detail": detail
            }
        )

class SessionNotFoundException(BusinessException):
    """会话不存在异常"""
    def __init__(self, session_id: str):
        super().__init__(
            code="SESSION_NOT_FOUND",
            message=f"会话不存在: {session_id}",
            status_code=404
        )

class LLMServiceException(BusinessException):
    """LLM服务异常"""
    def __init__(self, message: str = "AI服务暂时不可用"):
        super().__init__(
            code="LLM_SERVICE_ERROR",
            message=message,
            status_code=503
        )

class FileUploadException(BusinessException):
    """文件上传异常"""
    def __init__(self, message: str, code: str = "FILE_UPLOAD_ERROR"):
        super().__init__(
            code=code,
            message=message,
            status_code=400
        )

# 使用示例
@app.get("/items/{item_id}")
async def get_item(item_id: int, request: Request):
    request_id = request.state.request_id
    try:
        if item_id < 0:
            raise BusinessException(
                code="INVALID_ID",
                message="ID 不能为负数",
                status_code=400,
                detail={"item_id": item_id, "constraint": "must be >= 0"}
            )
        return APIResponse(
            success=True,
            data={"item_id": item_id},
            request_id=request_id
        )
    except BusinessException:
        raise
    except Exception as e:
        # 捕获并包装为业务异常
        raise BusinessException(
            code="UNKNOWN_ERROR",
            message="处理请求时发生错误",
            status_code=500,
            detail=str(e)
        )
```

**自动生成 OpenAPI 文档**：

FastAPI 自动根据类型注解生成 Swagger UI 和 ReDoc：

```bash
# 访问地址
http://localhost:8000/docs    # Swagger UI（交互式）
http://localhost:8000/redoc   # ReDoc（只读文档）
http://localhost:8000/openapi.json  # OpenAPI 规范
```

---

## 动手实战

### 实战项目：Agent API 服务

**项目结构**：

```
agent-api/
├── app/
│   ├── __init__.py
│   ├── main.py           # 应用入口
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── chat.py       # 对话接口
│   │   ├── upload.py     # 文件上传
│   │   └── session.py    # 会话管理
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py    # Pydantic 模型
│   │   └── agent.py      # Agent 封装
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm.py        # LLM 服务
│   │   └── memory.py     # 记忆管理
│   └── utils/
│       ├── __init__.py
|   └── utils/
|       ├── __init__.py
|       └── errors.py     # 错误处理与异常类
```

**完整代码实现**：

```python
# app/utils/errors.py
"""全局错误处理与异常定义"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime
import uuid
import traceback
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 调试模式（生产环境应设为 False）
DEBUG = True


class ErrorResponse(BaseModel):
    """错误响应模型"""
    code: str                    # 业务错误码
    message: str                 # 用户友好的错误信息
    detail: Any | None = None    # 调试信息（仅开发环境）
    request_id: str | None = None # 请求ID，用于追踪
    timestamp: datetime = Field(default_factory=datetime.now)


class APIResponse(BaseModel):
    """统一API响应模型"""
    success: bool
    data: Any | None = None
    error: ErrorResponse | None = None
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.now)


class BusinessException(HTTPException):
    """业务异常基类"""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        detail: Any = None
    ):
        self.business_code = code
        super().__init__(
            status_code=status_code,
            detail={
                "code": code,
                "message": message,
                "detail": detail
            }
        )


class SessionNotFoundException(BusinessException):
    """会话不存在异常"""
    def __init__(self, session_id: str):
        super().__init__(
            code="SESSION_NOT_FOUND",
            message=f"会话不存在: {session_id}",
            status_code=404
        )


class LLMServiceException(BusinessException):
    """LLM服务异常"""
    def __init__(self, message: str = "AI服务暂时不可用"):
        super().__init__(
            code="LLM_SERVICE_ERROR",
            message=message,
            status_code=503
        )


class FileUploadException(BusinessException):
    """文件上传异常"""
    def __init__(self, message: str, code: str = "FILE_UPLOAD_ERROR"):
        super().__init__(
            code=code,
            message=message,
            status_code=400
        )


class ValidationException(BusinessException):
    """参数验证异常"""
    def __init__(self, message: str, detail: Any = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
            detail=detail
        )


def setup_exception_handlers(app):
    """配置全局异常处理器"""
    
    # 自定义 HTTPException 处理器
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        
        # 如果 detail 是字典，尝试提取业务错误码
        if isinstance(exc.detail, dict):
            code = exc.detail.get("code", f"HTTP_{exc.status_code}")
            message = exc.detail.get("message", str(exc.detail))
            detail = exc.detail.get("detail")
        else:
            code = f"HTTP_{exc.status_code}"
            message = str(exc.detail)
            detail = None
        
        return JSONResponse(
            status_code=exc.status_code,
            content=APIResponse(
                success=False,
                data=None,
                error=ErrorResponse(
                    code=code,
                    message=message,
                    detail=detail,
                    request_id=request_id
                ),
                request_id=request_id
            ).dict()
        )
    
    # 请求参数验证错误处理器
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        
        # 格式化验证错误信息
        errors = []
        for error in exc.errors():
            field = ".".join(str(x) for x in error["loc"])
            errors.append(f"{field}: {error['msg']}")
        
        logger.warning(f"[VALIDATION ERROR] Request {request_id}: {errors}")
        
        return JSONResponse(
            status_code=422,
            content=APIResponse(
                success=False,
                data=None,
                error=ErrorResponse(
                    code="VALIDATION_ERROR",
                    message="请求参数验证失败",
                    detail=errors,
                    request_id=request_id
                ),
                request_id=request_id
            ).dict()
        )
    
    # 全局异常处理器
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        
        # 记录完整错误堆栈
        error_trace = traceback.format_exc()
        logger.error(f"[UNHANDLED ERROR] Request {request_id}: {error_trace}")
        
        return JSONResponse(
            status_code=500,
            content=APIResponse(
                success=False,
                data=None,
                error=ErrorResponse(
                    code="INTERNAL_ERROR",
                    message="服务器内部错误，请稍后重试",
                    detail=error_trace if DEBUG else None,
                    request_id=request_id
                ),
                request_id=request_id
            ).dict()
        )


def setup_request_id_middleware(app):
    """配置请求ID中间件"""
    
    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        # 优先从请求头获取（支持链路追踪）
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        request.state.request_id = request_id
        
        # 记录请求日志
        logger.info(f"[REQUEST] {request_id} {request.method} {request.url.path}")
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        # 记录响应日志
        logger.info(f"[RESPONSE] {request_id} {response.status_code}")
        
        return response


# app/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None
    stream: bool = False  # 是否启用流式响应

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    messages: List[Message]
    usage: dict

class SessionInfo(BaseModel):
    session_id: str
    created_at: datetime
    message_count: int
    last_active: datetime

# app/services/llm.py
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
import os

def get_llm():
    """获取 LLM 实例"""
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.7,
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL")
    )

def convert_messages(langchain_messages):
    """转换消息格式"""
    result = []
    for msg in langchain_messages:
        if isinstance(msg, HumanMessage):
            result.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            result.append({"role": "assistant", "content": msg.content})
        elif isinstance(msg, SystemMessage):
            result.append({"role": "system", "content": msg.content})
    return result

# app/services/memory.py
from typing import Dict, List
from langchain.schema import BaseMessage
from datetime import datetime
import uuid

class SessionMemory:
    """简单的内存会话管理（生产环境用 Redis）"""
    
    def __init__(self):
        self._sessions: Dict[str, Dict] = {}
    
    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = {
            "messages": [],
            "created_at": datetime.now(),
            "last_active": datetime.now()
        }
        return session_id
    
    def get_messages(self, session_id: str) -> List[BaseMessage]:
        if session_id not in self._sessions:
            return []
        return self._sessions[session_id]["messages"]
    
    def add_message(self, session_id: str, message: BaseMessage):
        if session_id not in self._sessions:
            session_id = self.create_session()
        self._sessions[session_id]["messages"].append(message)
        self._sessions[session_id]["last_active"] = datetime.now()
    
    def get_session_info(self, session_id: str) -> dict:
        if session_id not in self._sessions:
            return None
        session = self._sessions[session_id]
        return {
            "session_id": session_id,
            "created_at": session["created_at"],
            "message_count": len(session["messages"]),
            "last_active": session["last_active"]
        }
    
    def delete_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

# 全局内存实例（单例）
memory = SessionMemory()

# app/routers/chat.py
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm import get_llm, convert_messages
from app.services.memory import memory
from app.utils.errors import LLMServiceException, APIResponse
from langchain.schema import HumanMessage, AIMessage
import json
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["对话"])

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, req: Request):
    """普通对话接口"""
    request_id = getattr(req.state, "request_id", "unknown")
    
    try:
        # 获取或创建会话
        session_id = request.session_id or memory.create_session()
        logger.info(f"[{request_id}] Chat request, session: {session_id}")
        
        # 获取历史消息
        history = memory.get_messages(session_id)
        
        # 添加用户消息
        user_msg = HumanMessage(content=request.message)
        memory.add_message(session_id, user_msg)
        
        # 调用 LLM
        llm = get_llm()
        messages = history + [user_msg]
        response = await llm.ainvoke(messages)
        
        # 保存 AI 回复
        ai_msg = AIMessage(content=response.content)
        memory.add_message(session_id, ai_msg)
        
        logger.info(f"[{request_id}] Chat completed successfully")
        
        return ChatResponse(
            session_id=session_id,
            reply=response.content,
            messages=convert_messages(memory.get_messages(session_id)),
            usage={
                "prompt_tokens": response.usage_metadata.get("prompt_tokens", 0),
                "completion_tokens": response.usage_metadata.get("completion_tokens", 0)
            } if hasattr(response, 'usage_metadata') else {}
        )
    except Exception as e:
        logger.error(f"[{request_id}] Chat error: {str(e)}")
        # 抛出业务异常，由全局处理器处理
        raise LLMServiceException(message=f"AI对话失败: {str(e)}")

async def stream_generator(session_id: str, message: str, request_id: str):
    """流式响应生成器"""
    try:
        llm = get_llm()
        history = memory.get_messages(session_id)
        user_msg = HumanMessage(content=message)
        memory.add_message(session_id, user_msg)
        
        messages = history + [user_msg]
        full_response = ""
        
        logger.info(f"[{request_id}] Starting stream for session: {session_id}")
        
        # 流式调用
        async for chunk in llm.astream(messages):
            content = chunk.content
            full_response += content
            # SSE 格式
            data = json.dumps({
                "content": content,
                "session_id": session_id,
                "finished": False
            })
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.01)  # 控制流速
        
        # 保存完整回复
        ai_msg = AIMessage(content=full_response)
        memory.add_message(session_id, ai_msg)
        
        logger.info(f"[{request_id}] Stream completed")
        
        # 结束标记
        yield f"data: {json.dumps({'finished': True, 'session_id': session_id})}\n\n"
        
    except Exception as e:
        logger.error(f"[{request_id}] Stream error: {str(e)}")
        error_data = json.dumps({
            "error": str(e),
            "code": "STREAM_ERROR",
            "request_id": request_id
        })
        yield f"data: {error_data}\n\n"

@router.post("/stream")
async def chat_stream(request: ChatRequest, req: Request):
    """流式对话接口（SSE）"""
    request_id = getattr(req.state, "request_id", "unknown")
    session_id = request.session_id or memory.create_session()
    
    logger.info(f"[{request_id}] Stream chat request, session: {session_id}")
    
    return StreamingResponse(
        stream_generator(session_id, request.message, request_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用 Nginx 缓冲
            "X-Request-ID": request_id
        }
    )

# app/routers/session.py
from fastapi import APIRouter, Request
from app.services.memory import memory
from app.models.schemas import SessionInfo
from app.utils.errors import SessionNotFoundException, APIResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["会话管理"])

@router.get("/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str, request: Request):
    """获取会话信息"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    info = memory.get_session_info(session_id)
    if not info:
        logger.warning(f"[{request_id}] Session not found: {session_id}")
        raise SessionNotFoundException(session_id)
    
    logger.info(f"[{request_id}] Retrieved session: {session_id}")
    return APIResponse(
        success=True,
        data=info,
        request_id=request_id
    )

@router.delete("/{session_id}")
async def delete_session(session_id: str, request: Request):
    """删除会话"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    if memory.delete_session(session_id):
        logger.info(f"[{request_id}] Deleted session: {session_id}")
        return APIResponse(
            success=True,
            data={"message": "会话已删除"},
            request_id=request_id
        )
    
    logger.warning(f"[{request_id}] Failed to delete session (not found): {session_id}")
    raise SessionNotFoundException(session_id)

# app/routers/upload.py
from fastapi import APIRouter, UploadFile, File, Request
from app.utils.errors import FileUploadException, APIResponse
import tempfile
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["文件上传"])

ALLOWED_TYPES = {
    "text/plain": ".txt",
    "application/pdf": ".pdf",
    "text/markdown": ".md",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    """上传文件供 Agent 分析"""
    request_id = getattr(request.state, "request_id", "unknown") if request else "unknown"
    
    try:
        # 检查文件类型
        if file.content_type not in ALLOWED_TYPES:
            logger.warning(f"[{request_id}] Unsupported file type: {file.content_type}")
            raise FileUploadException(
                message=f"不支持的文件类型: {file.content_type}",
                code="UNSUPPORTED_FILE_TYPE"
            )
        
        # 读取并检查大小
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            logger.warning(f"[{request_id}] File too large: {len(content)} bytes")
            raise FileUploadException(
                message="文件大小超过 10MB 限制",
                code="FILE_TOO_LARGE"
            )
        
        # 保存临时文件
        suffix = ALLOWED_TYPES[file.content_type]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"[{request_id}] File uploaded successfully: {file.filename}")
        
        # TODO: 这里可以接入文档解析逻辑
        # text = await parse_document(tmp_path)
        
        return APIResponse(
            success=True,
            data={
                "filename": file.filename,
                "size": len(content),
                "type": file.content_type,
                "temp_path": tmp_path
            },
            request_id=request_id
        )
        
    except FileUploadException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Upload error: {str(e)}")
        raise FileUploadException(
            message=f"文件上传失败: {str(e)}",
            code="UPLOAD_FAILED"
        )

# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, session, upload
from app.utils.errors import setup_exception_handlers, setup_request_id_middleware, APIResponse

app = FastAPI(
    title="Agent API Service",
    description="生产级 Agent API 服务，支持流式对话、文件上传、会话管理",
    version="1.0.0"
)

# 配置全局异常处理
setup_exception_handlers(app)

# 配置请求ID中间件
setup_request_id_middleware(app)

# CORS 配置（允许前端跨域调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat.router, prefix="/api/v1")
app.include_router(session.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")

@app.get("/health")
async def health_check(request: Request):
    """健康检查接口"""
    request_id = getattr(request.state, "request_id", "unknown")
    return APIResponse(
        success=True,
        data={"status": "healthy", "version": "1.0.0"},
        request_id=request_id
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**requirements.txt**：

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
langchain==0.1.0
langchain-openai==0.0.2
python-multipart==0.0.6
python-dotenv==1.0.0
```

**启动服务**：

```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 添加 OPENAI_API_KEY

# 4. 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. 访问文档
open http://localhost:8000/docs
```

---

## 避坑指南

### ❌ 坑 1：SSE 被 Nginx 缓冲导致延迟

**现象**：流式响应变成了批量返回

**解决**：在响应头添加 `X-Accel-Buffering: no`

```python
return StreamingResponse(
    generator(),
    headers={"X-Accel-Buffering": "no"}  # 禁用缓冲
)
```

### ❌ 坑 2：跨域问题导致前端调不通

**现象**：浏览器报 CORS 错误

**解决**：正确配置 CORS 中间件

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### ❌ 坑 3：大文件上传导致内存溢出

**现象**：上传大文件时服务崩溃

**解决**：使用流式读取 + 临时文件

```python
# 不要直接读取全部内容
# content = await file.read()  # ❌ 大文件会爆内存

# 使用分块读取
async for chunk in file.stream():
    tmp_file.write(chunk)
```

### ❌ 坑 4：异常处理不当导致信息泄露

**现象**：生产环境返回了堆栈信息给客户端，暴露敏感信息

**解决**：使用统一的错误响应格式，区分开发和生产环境

```python
# app/utils/errors.py
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    error_trace = traceback.format_exc()
    
    # 记录完整错误（用于内部排查）
    logger.error(f"[{request_id}] {error_trace}")
    
    # 返回给客户端（生产环境不暴露细节）
    return JSONResponse(
        status_code=500,
        content=APIResponse(
            success=False,
            error=ErrorResponse(
                code="INTERNAL_ERROR",
                message="服务器内部错误，请稍后重试",
                detail=error_trace if DEBUG else None,  # 生产环境不返回
                request_id=request_id
            ),
            request_id=request_id
        ).dict()
    )
```

**关键要点**：
1. **请求ID追踪**：每个请求生成唯一ID，便于日志关联
2. **业务异常分类**：定义具体的业务异常类（如 `SessionNotFoundException`）
3. **日志分级**：使用 `logger.info/warning/error` 分级记录
4. **错误码规范**：定义统一的错误码体系（如 `SESSION_NOT_FOUND`）

### ❌ 坑 5：会话内存泄漏

**现象**：运行久了内存占用越来越高

**解决**：实现会话过期清理机制

```python
import asyncio
from datetime import datetime, timedelta

async def cleanup_expired_sessions():
    """定期清理过期会话"""
    while True:
        await asyncio.sleep(3600)  # 每小时检查一次
        now = datetime.now()
        expired = [
            sid for sid, sess in memory._sessions.items()
            if now - sess["last_active"] > timedelta(hours=24)
        ]
        for sid in expired:
            memory.delete_session(sid)

# 启动时运行
@app.on_event("startup")
async def startup():
    asyncio.create_task(cleanup_expired_sessions())
```

### ❌ 坑 6：异步代码阻塞事件循环

**现象**：API 响应变慢，并发能力下降

**解决**：确保所有 IO 操作都是异步的

```python
# ❌ 错误：同步调用会阻塞
response = llm.invoke(messages)

# ✅ 正确：异步调用
response = await llm.ainvoke(messages)

# 或者使用同步函数在线程池中运行
from fastapi.concurrency import run_in_threadpool
response = await run_in_threadpool(llm.invoke, messages)
```

---

## 面试考点

### Q1: FastAPI 相比 Flask/Django 有什么优势？

**参考答案**：

1. **性能**：基于 Starlette 和 Pydantic，性能接近 Node.js 和 Go
2. **类型安全**：原生支持类型注解，自动数据校验和序列化
3. **异步优先**：原生支持 async/await，适合高并发场景
4. **自动文档**：基于 OpenAPI 自动生成 Swagger/ReDoc 文档
5. **依赖注入**：强大的依赖注入系统，便于测试和模块化

### Q2: SSE 和 WebSocket 的区别是什么？什么场景选择 SSE？

**参考答案**：

| 维度 | SSE | WebSocket |
|-----|-----|-----------|
| 协议 | HTTP | ws/wss |
| 方向 | 服务器→客户端单向 | 双向通信 |
| 复杂度 | 简单，基于 HTTP | 需要握手升级 |
| 重连 | 浏览器自动处理 | 需手动实现 |
| 场景 | AI 流式输出、股票推送 | 实时聊天、游戏 |

选择 SSE 的场景：
- 主要是服务器推送数据（如 AI 回复）
- 希望利用现有 HTTP 基础设施（负载均衡、CDN）
- 需要自动重连和事件 ID 追踪

### Q3: 如何设计一个支持高并发的 Agent API？

**参考答案**：

1. **异步架构**：使用 FastAPI + async/await 处理并发请求
2. **连接池**：复用 LLM 的 HTTP 连接
3. **流式响应**：用 SSE 减少内存占用，避免等待完整响应
4. **缓存层**：Redis 缓存常见问题的回答
5. **限流熔断**：防止单个用户耗尽资源
6. **水平扩展**：无状态设计，支持多实例部署

```python
# 连接池示例
from aiohttp import ClientSession, TCPConnector

# 全局 session
session: ClientSession | None = None

@app.on_event("startup")
async def startup():
    global session
    connector = TCPConnector(limit=100)  # 限制连接数
    session = ClientSession(connector=connector)

@app.on_event("shutdown")
async def shutdown():
    await session.close()
```

### Q4: RESTful API 设计有哪些最佳实践？

**参考答案**：

1. **资源命名**：使用名词复数 `/users` 而非 `/getUsers`
2. **HTTP 方法**：GET（查询）、POST（创建）、PUT（全量更新）、PATCH（部分更新）、DELETE（删除）
3. **状态码**：200（成功）、201（创建）、400（请求错误）、401（未认证）、404（不存在）、500（服务器错误）
4. **版本控制**：URL 版本 `/api/v1/` 或 Header 版本
5. **分页**：`?page=1&limit=20`
6. **过滤排序**：`?status=active&sort=-created_at`
7. **统一响应格式**：`{success, data, error, meta}`

### Q5: 如何设计 API 的全局异常处理机制？

**参考答案**：

1. **分层处理**：HTTP 异常、验证异常、业务异常、未知异常
2. **统一格式**：所有错误返回统一结构 `{success, error, request_id}`
3. **请求追踪**：每个请求生成唯一 ID，便于日志关联
4. **信息脱敏**：生产环境不返回堆栈信息
5. **日志分级**：info/warning/error 分级记录

```python
# 异常处理层次
HTTPException -> 业务错误（如 404 会话不存在）
RequestValidationError -> 参数校验失败（422）
BusinessException -> 业务逻辑错误（自定义错误码）
Exception -> 未知错误（500，记录堆栈）

# 统一响应示例
{
    "success": false,
    "data": null,
    "error": {
        "code": "SESSION_NOT_FOUND",
        "message": "会话不存在: xxx",
        "detail": null,
        "request_id": "550e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2024-01-15T10:30:00"
    },
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:00"
}
```

---

## 扩展阅读

### 官方文档

- [FastAPI 官方文档](https://fastapi.tiangolo.com/) - 最详细的教程
- [Pydantic 文档](https://docs.pydantic.dev/) - 数据校验库
- [SSE 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html) - 官方标准

### 进阶主题

- **部署**：使用 Docker + Gunicorn + Nginx 部署 FastAPI
- **监控**：集成 Prometheus + Grafana 监控 API 性能
- **测试**：使用 pytest + httpx 编写异步测试
- **认证**：JWT + OAuth2 实现用户认证

### 推荐项目

- [LangServe](https://github.com/langchain-ai/langserve) - LangChain 官方部署方案
- [BentoML](https://github.com/bentoml/BentoML) - 模型服务化框架

---

## 课后练习

### 练习 1：添加限流功能

为 API 添加基于 IP 的限流，每分钟最多 20 次请求。

提示：使用 `slowapi` 库或 Redis 实现滑动窗口限流。

### 练习 2：接入真实数据库

将内存会话管理替换为 Redis 存储，支持分布式部署。

提示：使用 `redis-py` 库，实现会话的过期自动清理。

### 练习 3：实现文件分析 Agent

扩展上传接口，让 Agent 能够读取并分析上传的文档内容。

提示：使用 `pypdf` 解析 PDF，`python-docx` 解析 Word。

### 练习 4：前端集成

使用 React + TypeScript 实现一个聊天界面，调用本节开发的 API。

要求：
- 支持流式显示 AI 回复
- 显示会话历史
- 支持文件上传

---

> 恭喜！完成本节学习后，你已经掌握了将 Agent 封装为生产级 API 的完整技能。下一节我们将学习如何部署和运维 Agent 服务。
