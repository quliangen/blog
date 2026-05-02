---
title: 23-项目一：企业智能客服系统
description: 完整项目实战，RAG + Function Calling + 多轮对话管理
---

# 23-项目一：企业智能客服系统

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级开发能力 | ✅ 性能/安全/成本 |
| 工程化能力 | ✅ 监控/测试/部署 |
| 项目交付能力 | ✅ 完整项目实战 |
| RAG 系统设计 | ✅ 向量检索+重排序 |
| Function Calling | ✅ 工单创建/查询 |
| 会话管理 | ✅ 多轮对话状态 |

## 学习目标

学完本节，你将能够：
1. 设计企业级智能客服系统架构
2. 实现 RAG 检索增强生成 pipeline
3. 掌握 Function Calling 工具调用机制
4. 构建多轮对话管理系统
5. 完成前后端分离的完整项目开发
6. 部署生产级 AI 应用

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 熟悉 FastAPI 和 React 基础
- 了解向量数据库基本概念

---

## 一、需求分析与技术方案

### 1.1 业务需求分析

#### 1.1.1 用户场景

```
场景一：产品咨询
用户："你们的企业版套餐包含哪些功能？"
客服：需要从知识库检索产品信息，准确回答

场景二：故障报修  
用户："我的账户无法登录，提示密码错误"
客服：需要理解问题 -> 检索解决方案 -> 如未解决则创建工单

场景三：订单查询
用户："我昨天提交的工单处理进度如何？"
客服：需要调用工单查询接口，返回实时状态

场景四：多轮对话
用户："我想退款"
客服："请问您的订单号是多少？"
用户："ORD-2024-001"
客服："已为您查询到订单，退款原因是什么呢？"
```

#### 1.1.2 功能需求

| 功能模块 | 需求描述 | 优先级 |
|---------|---------|--------|
| 意图识别 | 识别用户咨询/投诉/查询等意图 | P0 |
| 知识检索 | 基于 RAG 从知识库检索答案 | P0 |
| 工单创建 | 复杂问题自动创建工单 | P0 |
| 工单查询 | 查询工单状态和详情 | P0 |
| 多轮对话 | 支持上下文理解和追问 | P1 |
| 会话管理 | 会话状态保持和历史记录 | P1 |
| 人工转接 | 复杂场景转人工客服 | P2 |

#### 1.1.3 非功能需求

| 指标 | 目标值 | 说明 |
|-----|--------|------|
| 响应时间 | < 2s | 95% 请求 |
| 并发支持 | 1000+ | 同时在线会话 |
| 准确率 | > 85% | 意图识别准确率 |
| 可用性 | 99.9% | 年度可用性 |

### 1.2 技术方案选型

#### 1.2.1 技术栈

```
┌─────────────────────────────────────────────────────────┐
│                      技术架构                            │
├─────────────────────────────────────────────────────────┤
│  前端层    │  React 18 + TypeScript + Ant Design        │
├─────────────────────────────────────────────────────────┤
│  接入层    │  Nginx (反向代理 + 负载均衡)               │
├─────────────────────────────────────────────────────────┤
│  服务层    │  FastAPI + Python 3.11                     │
├─────────────────────────────────────────────────────────┤
│  AI 层     │  LangChain + OpenAI/Claude API             │
├─────────────────────────────────────────────────────────┤
│  数据层    │  PostgreSQL + Redis + ChromaDB/Qdrant      │
├─────────────────────────────────────────────────────────┤
│  运维层    │  Docker + Docker Compose + Prometheus      │
└─────────────────────────────────────────────────────────┘
```

#### 1.2.2 核心依赖

```toml
# 后端核心依赖
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = "^0.27.0"
langchain = "^0.1.0"
langchain-openai = "^0.0.5"
chromadb = "^0.4.0"
qdrant-client = "^1.7.0"
sqlalchemy = "^2.0.0"
alembic = "^1.13.0"
redis = "^5.0.0"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
python-jose = "^3.3.0"
httpx = "^0.26.0"
```

---

## 二、系统架构设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                              客户端层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Web 端     │  │   移动端     │  │   小程序     │               │
│  │  (React)     │  │   (H5)       │  │   (微信)     │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            接入网关层                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Nginx (SSL/负载均衡/限流)                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            业务服务层                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    FastAPI 服务                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐   │   │
│  │  │  Chat API   │ │ Ticket API  │ │   Knowledge API       │   │   │
│  │  │  (对话)     │ │  (工单)     │ │    (知识库)           │   │   │
│  │  └─────────────┘ └─────────────┘ └───────────────────────┘   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐   │   │
│  │  │ Session API │ │  User API   │ │   Analytics API       │   │   │
│  │  │  (会话管理) │ │  (用户)     │ │    (统计分析)         │   │   │
│  │  └─────────────┘ └─────────────┘ └───────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                             AI 引擎层                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      LangChain Agent                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐   │   │
│  │  │   Intent    │ │    RAG      │ │  Function Calling     │   │   │
│  │  │  Classifier │ │   Engine    │ │     Tools             │   │   │
│  │  │  (意图识别) │ │ (检索增强)  │ │   (工具调用)          │   │   │
│  │  └─────────────┘ └─────────────┘ └───────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                             数据存储层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │      ChromaDB/Qdrant     │   │
│  │  (业务数据)  │  │  (缓存/会话) │  │      (向量数据库)        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 RAG Pipeline 设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RAG Pipeline                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 文档预处理                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ 文档加载 │ -> │ 文本拆分 │ -> │ 向量化   │ -> │ 索引存储 │      │
│  │          │    │(Chunking)│    │(Embedding)│    │          │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                     │
│  2. 检索流程                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ 查询理解 │ -> │ 向量检索 │ -> │ 重排序   │ -> │ 上下文   │      │
│  │          │    │(Top-K)   │    │(Rerank)  │    │ 组装     │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                     │
│  3. 生成回答                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │ Prompt   │ -> │  LLM     │ -> │ 回答输出 │                      │
│  │ 构建     │    │ 生成     │    │          │                      │
│  └──────────┘    └──────────┘    └──────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Function Calling 设计

```python
# 工具定义 schema
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_ticket",
            "description": "创建客服工单，用于处理用户反馈的问题或投诉",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "工单标题，简要描述问题"
                    },
                    "description": {
                        "type": "string",
                        "description": "工单详细描述"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "工单优先级"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["technical", "billing", "product", "other"],
                        "description": "工单分类"
                    }
                },
                "required": ["title", "description", "category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_ticket",
            "description": "查询工单状态和详情",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticket_id": {
                        "type": "string",
                        "description": "工单编号"
                    }
                },
                "required": ["ticket_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_knowledge",
            "description": "从知识库搜索相关信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "category": {
                        "type": "string",
                        "description": "知识库分类，可选"
                    }
                },
                "required": ["query"]
            }
        }
    }
]
```

### 2.4 会话状态管理

```
┌─────────────────────────────────────────────────────────────────────┐
│                      会话状态机                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│     ┌──────────┐                                                    │
│     │   开始   │                                                    │
│     └────┬─────┘                                                    │
│          │                                                          │
│          ▼                                                          │
│     ┌──────────┐     需要澄清        ┌──────────┐                  │
│     │ 意图识别 │ ──────────────────> │ 等待输入 │                  │
│     └────┬─────┘                    └──────────┘                  │
│          │                                                          │
│     ┌────┴────┬────────────┬────────────┐                          │
│     │         │            │            │                          │
│     ▼         ▼            ▼            ▼                          │
│ ┌───────┐ ┌───────┐   ┌───────┐   ┌───────┐                       │
│ │ 咨询  │ │ 查询  │   │ 投诉  │   │ 其他  │                       │
│ └───┬───┘ └───┬───┘   └───┬───┘   └───┬───┘                       │
│     │         │            │            │                          │
│     ▼         ▼            ▼            ▼                          │
│ ┌───────┐ ┌───────┐   ┌───────┐   ┌───────┐                       │
│ │ RAG   │ │Function│   │Function│   │ 人工  │                       │
│ │检索   │ │Calling │   │Calling │   │ 转接  │                       │
│ └───┬───┘ └───┬───┘   └───┬───┘   └───────┘                       │
│     │         │            │                                       │
│     └─────────┴────────────┘                                       │
│                    │                                                │
│                    ▼                                                │
│              ┌──────────┐                                          │
│              │ 生成回复 │                                          │
│              └────┬─────┘                                          │
│                   │                                                │
│                   ▼                                                │
│              ┌──────────┐                                          │
│              │ 等待输入 │ <──────────────────────────────          │
│              └──────────┘         用户新消息                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 三、核心功能实现

### 3.1 项目结构

```
customer-service-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI 入口
│   │   ├── config.py               # 配置管理
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py             # 对话 API
│   │   │   ├── tickets.py          # 工单 API
│   │   │   ├── knowledge.py        # 知识库 API
│   │   │   └── sessions.py         # 会话 API
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py         # 认证授权
│   │   │   └── exceptions.py       # 异常处理
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── database.py         # ORM 模型
│   │   │   └── schemas.py          # Pydantic 模型
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── chat_service.py     # 对话服务
│   │   │   ├── rag_service.py      # RAG 服务
│   │   │   ├── ticket_service.py   # 工单服务
│   │   │   └── session_service.py  # 会话服务
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── customer_agent.py   # 客服 Agent
│   │   │   └── tools.py            # 工具定义
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   ├── alembic/                    # 数据库迁移
│   ├── tests/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   └── Common/
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

### 3.2 后端完整代码

#### 3.2.1 配置管理 (app/config.py)

```python
"""应用配置管理"""
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用信息
    APP_NAME: str = "Customer Service AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # API 配置
    API_V1_PREFIX: str = "/api/v1"
    
    # 数据库配置
    DATABASE_URL: str = Field(default="postgresql://user:***@localhost/cs_ai", env="DATABASE_URL")
    
    # 数据库连接池配置
    DB_POOL_SIZE: int = Field(default=10, env="DB_POOL_SIZE")  # 连接池大小
    DB_MAX_OVERFLOW: int = Field(default=20, env="DB_MAX_OVERFLOW")  # 超出连接池大小时的最大连接数
    DB_POOL_TIMEOUT: int = Field(default=30, env="DB_POOL_TIMEOUT")  # 获取连接的超时时间（秒）
    DB_POOL_RECYCLE: int = Field(default=3600, env="DB_POOL_RECYCLE")  # 连接回收时间（秒）
    DB_POOL_PRE_PING: bool = Field(default=True, env="DB_POOL_PRE_PING")  # 连接前健康检查
    
    # Redis 配置
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # 向量数据库配置
    VECTOR_DB_TYPE: str = Field(default="chromadb", env="VECTOR_DB_TYPE")  # chromadb 或 qdrant
    CHROMADB_PATH: str = Field(default="./chroma_db", env="CHROMADB_PATH")
    QDRANT_URL: str = Field(default="http://localhost:6333", env="QDRANT_URL")
    QDRANT_API_KEY: Optional[str] = Field(default=None, env="QDRANT_API_KEY")
    
    # LLM 配置
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    OPENAI_BASE_URL: Optional[str] = Field(default=None, env="OPENAI_BASE_URL")
    LLM_MODEL: str = Field(default="gpt-4o-mini", env="LLM_MODEL")
    EMBEDDING_MODEL: str = Field(default="text-embedding-3-small", env="EMBEDDING_MODEL")
    
    # 会话配置
    SESSION_TIMEOUT: int = Field(default=1800, env="SESSION_TIMEOUT")  # 30分钟
    MAX_HISTORY_MESSAGES: int = Field(default=10, env="MAX_HISTORY_MESSAGES")
    
    # RAG 配置
    RAG_TOP_K: int = Field(default=5, env="RAG_TOP_K")
    RAG_SIMILARITY_THRESHOLD: float = Field(default=0.7, env="RAG_SIMILARITY_THRESHOLD")
    CHUNK_SIZE: int = Field(default=500, env="CHUNK_SIZE")
    CHUNK_OVERLAP: int = Field(default=50, env="CHUNK_OVERLAP")
    
    # 安全配置
    SECRET_KEY: str = Field(default="your-secret-key", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS 配置
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
```

#### 3.2.2 数据模型 (app/models/schemas.py)

```python
"""Pydantic 数据模型"""
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from uuid import UUID

from pydantic import BaseModel, Field


# ==================== 通用模型 ====================

class ResponseBase(BaseModel):
    """通用响应模型"""
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None


class PaginationParams(BaseModel):
    """分页参数"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(ResponseBase):
    """分页响应"""
    total: int = 0
    page: int = 1
    page_size: int = 20


# ==================== 会话模型 ====================

class SessionCreate(BaseModel):
    """创建会话请求"""
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SessionResponse(BaseModel):
    """会话响应"""
    id: str
    user_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatMessage(BaseModel):
    """聊天消息"""
    role: str = Field(..., description="消息角色: user/assistant/system")
    content: str = Field(..., description="消息内容")
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """聊天请求"""
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)
    stream: bool = Field(default=False, description="是否流式响应")


class ChatResponse(BaseModel):
    """聊天响应"""
    session_id: str
    message: ChatMessage
    intent: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None


# ==================== 工单模型 ====================

class TicketPriority(str, Enum):
    """工单优先级"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(str, Enum):
    """工单状态"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketCategory(str, Enum):
    """工单分类"""
    TECHNICAL = "technical"
    BILLING = "billing"
    PRODUCT = "product"
    OTHER = "other"


class TicketCreate(BaseModel):
    """创建工单请求"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    priority: TicketPriority = TicketPriority.MEDIUM
    category: TicketCategory
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    session_id: Optional[str] = None


class TicketUpdate(BaseModel):
    """更新工单请求"""
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None


class TicketResponse(BaseModel):
    """工单响应"""
    id: str
    ticket_number: str
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    customer_email: Optional[str]
    customer_phone: Optional[str]
    assigned_to: Optional[str]
    resolution: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]


class TicketQuery(BaseModel):
    """查询工单请求"""
    ticket_id: str = Field(..., description="工单编号或ID")


# ==================== 知识库模型 ====================

class DocumentUpload(BaseModel):
    """文档上传"""
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentResponse(BaseModel):
    """文档响应"""
    id: str
    title: str
    category: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime


class SearchRequest(BaseModel):
    """搜索请求"""
    query: str = Field(..., min_length=1, max_length=500)
    category: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    """搜索结果"""
    document_id: str
    title: str
    content: str
    score: float
    category: Optional[str]


class SearchResponse(ResponseBase):
    """搜索响应"""
    data: List[SearchResult]
    total: int


# ==================== Agent 模型 ====================

class IntentType(str, Enum):
    """意图类型"""
    GREETING = "greeting"           # 问候
    PRODUCT_INQUIRY = "product_inquiry"  # 产品咨询
    TECHNICAL_SUPPORT = "technical_support"  # 技术支持
    BILLING = "billing"             # 账单问题
    TICKET_QUERY = "ticket_query"   # 工单查询
    TICKET_CREATE = "ticket_create" # 创建工单
    COMPLAINT = "complaint"         # 投诉
    FEEDBACK = "feedback"           # 反馈
    CHITCHAT = "chitchat"           # 闲聊
    UNKNOWN = "unknown"             # 未知


class IntentClassification(BaseModel):
    """意图识别结果"""
    intent: IntentType
    confidence: float = Field(..., ge=0, le=1)
    entities: Dict[str, Any] = Field(default_factory=dict)
    requires_clarification: bool = False


class AgentAction(BaseModel):
    """Agent 动作"""
    action_type: str  # tool_use, respond, clarify, escalate
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    response: Optional[str] = None
```

#### 3.2.3 数据库模型 (app/models/database.py)

```python
"""SQLAlchemy 数据库模型"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, String, Text, DateTime, Enum as SQLEnum,
    Integer, Float, ForeignKey, JSON, Index, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.config import settings

Base = declarative_base()


# ==================== 会话模型 ====================

class SessionModel(Base):
    """会话表"""
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=True, index=True)
    status = Column(String(20), default="active")  # active, closed, expired
    context = Column(JSON, default=dict)  # 会话上下文
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expired_at = Column(DateTime, nullable=True)
    
    # 关系
    messages = relationship("MessageModel", back_populates="session", cascade="all, delete-orphan")
    tickets = relationship("TicketModel", back_populates="session")
    
    __table_args__ = (
        Index('idx_session_user_status', 'user_id', 'status'),
        Index('idx_session_updated', 'updated_at'),
    )


class MessageModel(Base):
    """消息表"""
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)
    metadata = Column(JSON, default=dict)  # 消息元数据（检索来源、工具调用等）
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    session = relationship("SessionModel", back_populates="messages")
    
    __table_args__ = (
        Index('idx_message_session', 'session_id'),
        Index('idx_message_created', 'created_at'),
    )


# ==================== 工单模型 ====================

class TicketModel(Base):
    """工单表"""
    __tablename__ = "tickets"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = Column(String(50), unique=True, nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=True)
    
    # 工单内容
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # technical, billing, product, other
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    status = Column(String(20), default="open")  # open, in_progress, waiting, resolved, closed
    
    # 客户信息
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    
    # 处理信息
    assigned_to = Column(String(100), nullable=True)
    resolution = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # 关系
    session = relationship("SessionModel", back_populates="tickets")
    
    __table_args__ = (
        Index('idx_ticket_status', 'status'),
        Index('idx_ticket_priority', 'priority'),
        Index('idx_ticket_category', 'category'),
        Index('idx_ticket_created', 'created_at'),
    )


# ==================== 知识库模型 ====================

class DocumentModel(Base):
    """文档表"""
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)  # 内容哈希，用于去重
    category = Column(String(100), nullable=True)
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)
    
    # 向量化状态
    is_indexed = Column(Integer, default=0)  # 0: 未索引, 1: 已索引
    indexed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_doc_category', 'category'),
        Index('idx_doc_indexed', 'is_indexed'),
    )


class DocumentChunkModel(Base):
    """文档分块表"""
    __tablename__ = "document_chunks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    vector_id = Column(String(100), nullable=True)  # 向量数据库中的ID
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_chunk_document', 'document_id'),
    )


# ==================== 数据库连接 ====================

# 创建数据库引擎，配置连接池参数
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,                    # 连接池大小
    max_overflow=settings.DB_MAX_OVERFLOW,              # 超出连接池大小时的最大连接数
    pool_timeout=settings.DB_POOL_TIMEOUT,              # 获取连接的超时时间（秒）
    pool_recycle=settings.DB_POOL_RECYCLE,              # 连接回收时间（秒）
    pool_pre_ping=settings.DB_POOL_PRE_PING,            # 连接前健康检查，自动检测失效连接
    echo=settings.DEBUG                                 # 调试模式下打印SQL语句
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def check_db_connection() -> bool:
    """检查数据库连接健康状态"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"数据库连接检查失败: {e}")
        return False


def get_db():
    """获取数据库会话（带健康检查）"""
    db = SessionLocal()
    try:
        # 可选：在获取会话时进行健康检查
        # db.execute("SELECT 1")
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db():
    """初始化数据库"""
    # 先检查数据库连接
    if not check_db_connection():
        raise ConnectionError("无法连接到数据库，请检查数据库配置")
    Base.metadata.create_all(bind=engine)
```

#### 3.2.4 RAG 服务 (app/services/rag_service.py)

```python
"""RAG 检索服务"""
import hashlib
from typing import List, Dict, Any, Optional, Tuple

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from app.config import settings
from app.models.schemas import SearchResult


class RAGService:
    """RAG 服务"""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            openai_api_base=settings.OPENAI_BASE_URL
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", "。", "；", " ", ""]
        )
        self._init_vector_store()
    
    def _init_vector_store(self):
        """初始化向量数据库"""
        if settings.VECTOR_DB_TYPE == "chromadb":
            self.vector_store = Chroma(
                persist_directory=settings.CHROMADB_PATH,
                embedding_function=self.embeddings,
                collection_name="knowledge_base"
            )
        elif settings.VECTOR_DB_TYPE == "qdrant":
            self.qdrant_client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            # 确保集合存在
            try:
                self.qdrant_client.get_collection("knowledge_base")
            except Exception:
                self.qdrant_client.create_collection(
                    collection_name="knowledge_base",
                    vectors_config=VectorParams(
                        size=1536,  # text-embedding-3-small 维度
                        distance=Distance.COSINE
                    )
                )
    
    def add_document(
        self,
        doc_id: str,
        title: str,
        content: str,
        category: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> List[str]:
        """
        添加文档到知识库
        
        Args:
            doc_id: 文档ID
            title: 文档标题
            content: 文档内容
            category: 分类
            metadata: 元数据
            
        Returns:
            分块ID列表
        """
        # 文本分块
        chunks = self.text_splitter.split_text(content)
        
        # 构建元数据
        base_metadata = {
            "doc_id": doc_id,
            "title": title,
            "category": category or "general",
            **(metadata or {})
        }
        
        chunk_ids = []
        if settings.VECTOR_DB_TYPE == "chromadb":
            # 添加文档到 ChromaDB
            texts = []
            metadatas = []
            ids = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc_id}_{i}"
                texts.append(chunk)
                metadatas.append({
                    **base_metadata,
                    "chunk_index": i,
                    "content": chunk[:200]  # 存储摘要
                })
                ids.append(chunk_id)
                chunk_ids.append(chunk_id)
            
            self.vector_store.add_texts(
                texts=texts,
                metadatas=metadatas,
                ids=ids
            )
            self.vector_store.persist()
            
        elif settings.VECTOR_DB_TYPE == "qdrant":
            # 生成向量
            vectors = self.embeddings.embed_documents(chunks)
            
            points = []
            for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
                chunk_id = f"{doc_id}_{i}"
                points.append(PointStruct(
                    id=chunk_id,
                    vector=vector,
                    payload={
                        **base_metadata,
                        "chunk_index": i,
                        "content": chunk
                    }
                ))
                chunk_ids.append(chunk_id)
            
            self.qdrant_client.upsert(
                collection_name="knowledge_base",
                points=points
            )
        
        return chunk_ids
    
    def search(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = None,
        threshold: float = None
    ) -> List[SearchResult]:
        """
        搜索知识库
        
        Args:
            query: 查询文本
            category: 分类过滤
            top_k: 返回数量
            threshold: 相似度阈值
            
        Returns:
            搜索结果列表
        """
        top_k = top_k or settings.RAG_TOP_K
        threshold = threshold or settings.RAG_SIMILARITY_THRESHOLD
        
        results = []
        
        if settings.VECTOR_DB_TYPE == "chromadb":
            # 构建过滤条件
            filter_dict = {}
            if category:
                filter_dict["category"] = category
            
            # 搜索
            docs = self.vector_store.similarity_search_with_score(
                query=query,
                k=top_k * 2,  # 多取一些用于重排序
                filter=filter_dict if filter_dict else None
            )
            
            for doc, score in docs:
                # ChromaDB 返回的是距离，转换为相似度
                similarity = 1 - score
                if similarity >= threshold:
                    results.append(SearchResult(
                        document_id=doc.metadata.get("doc_id", ""),
                        title=doc.metadata.get("title", ""),
                        content=doc.metadata.get("content", doc.page_content[:200]),
                        score=similarity,
                        category=doc.metadata.get("category")
                    ))
        
        elif settings.VECTOR_DB_TYPE == "qdrant":
            # 生成查询向量
            query_vector = self.embeddings.embed_query(query)
            
            # 构建过滤条件
            query_filter = None
            if category:
                from qdrant_client.models import FieldCondition, MatchValue, Filter
                query_filter = Filter(
                    must=[FieldCondition(
                        key="category",
                        match=MatchValue(value=category)
                    )]
                )
            
            # 搜索
            search_results = self.qdrant_client.search(
                collection_name="knowledge_base",
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k * 2,
                score_threshold=threshold
            )
            
            for result in search_results:
                results.append(SearchResult(
                    document_id=result.payload.get("doc_id", ""),
                    title=result.payload.get("title", ""),
                    content=result.payload.get("content", "")[:200],
                    score=result.score,
                    category=result.payload.get("category")
                ))
        
        # 按相似度排序并截取 top_k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]
    
    def delete_document(self, doc_id: str) -> bool:
        """删除文档及其所有分块"""
        try:
            if settings.VECTOR_DB_TYPE == "chromadb":
                # 获取所有分块ID
                results = self.vector_store.get(
                    where={"doc_id": doc_id}
                )
                if results and results["ids"]:
                    self.vector_store.delete(ids=results["ids"])
                    self.vector_store.persist()
                    
            elif settings.VECTOR_DB_TYPE == "qdrant":
                from qdrant_client.models import Filter, FieldCondition, MatchValue
                self.qdrant_client.delete(
                    collection_name="knowledge_base",
                    points_filter=Filter(
                        must=[FieldCondition(
                            key="doc_id",
                            match=MatchValue(value=doc_id)
                        )]
                    )
                )
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    def rerank_results(
        self,
        query: str,
        results: List[SearchResult],
        top_k: int = None
    ) -> List[SearchResult]:
        """
        重排序结果（使用更精确的相似度计算）
        
        可以使用：
        1. Cross-Encoder 模型
        2. LLM 重排序
        3. 混合评分
        """
        # 简单实现：按原有分数排序
        # 实际项目中可以使用 cross-encoder 模型
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k] if top_k else results


# 全局 RAG 服务实例
rag_service = RAGService()
```

#### 3.2.5 意图识别服务 (app/services/intent_service.py)

```python
"""意图识别服务"""
import json
from typing import Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.config import settings
from app.models.schemas import IntentClassification, IntentType


class IntentService:
    """意图识别服务"""
    
    INTENT_PROMPT = """你是一个客服意图识别专家。请分析用户的输入，识别其意图和提取关键实体。

可选意图类型：
- greeting: 问候语（如"你好"、"早上好"）
- product_inquiry: 产品咨询（询问产品功能、价格、套餐等）
- technical_support: 技术支持（系统故障、使用问题等）
- billing: 账单问题（付费、发票、退款等）
- ticket_query: 工单查询（查询工单状态）
- ticket_create: 创建工单（需要人工处理的问题）
- complaint: 投诉（表达不满、投诉服务）
- feedback: 反馈（建议、评价）
- chitchat: 闲聊（与客服无关的对话）
- unknown: 未知意图

会话历史：
{history}

用户输入：{message}

请输出JSON格式：
{{
    "intent": "意图类型",
    "confidence": 0.95,
    "entities": {{
        "key": "value"
    }},
    "requires_clarification": false,
    "clarification_question": ""
}}

要求：
1. confidence 在 0-1 之间
2. 如意图不明确，requires_clarification 设为 true
3. 需要澄清时，提供 clarification_question
"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=settings.OPENAI_API_KEY,
            openai_api_base=settings.OPENAI_BASE_URL
        )
        self.prompt = ChatPromptTemplate.from_template(self.INTENT_PROMPT)
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    async def classify(
        self,
        message: str,
        history: list = None
    ) -> IntentClassification:
        """
        识别用户意图
        
        Args:
            message: 用户消息
            history: 历史消息列表
            
        Returns:
            意图分类结果
        """
        # 格式化历史记录
        history_text = ""
        if history:
            history_text = "\n".join([
                f"{'用户' if msg['role'] == 'user' else '助手'}: {msg['content'][:100]}"
                for msg in history[-5:]  # 最近5轮
            ])
        
        try:
            result = await self.chain.ainvoke({
                "message": message,
                "history": history_text or "无"
            })
            
            # 映射意图类型
            intent_str = result.get("intent", "unknown")
            try:
                intent = IntentType(intent_str)
            except ValueError:
                intent = IntentType.UNKNOWN
            
            return IntentClassification(
                intent=intent,
                confidence=result.get("confidence", 0.5),
                entities=result.get("entities", {}),
                requires_clarification=result.get("requires_clarification", False)
            )
            
        except Exception as e:
            print(f"Intent classification error: {e}")
            # 降级处理：返回未知意图
            return IntentClassification(
                intent=IntentType.UNKNOWN,
                confidence=0.0,
                entities={},
                requires_clarification=True
            )
    
    def should_use_rag(self, intent: IntentType) -> bool:
        """判断是否需要使用 RAG"""
        rag_intents = [
            IntentType.PRODUCT_INQUIRY,
            IntentType.TECHNICAL_SUPPORT,
            IntentType.BILLING
        ]
        return intent in rag_intents
    
    def should_create_ticket(self, intent: IntentType, confidence: float) -> bool:
        """判断是否需要创建工单"""
        ticket_intents = [
            IntentType.COMPLAINT,
            IntentType.TICKET_CREATE
        ]
        return intent in ticket_intents and confidence > 0.7


# 全局意图服务实例
intent_service = IntentService()
```

#### 3.2.6 会话服务 (app/services/session_service.py)

```python
"""会话管理服务"""
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

import redis
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import SessionModel, MessageModel, get_db
from app.models.schemas import ChatMessage


class SessionService:
    """会话服务"""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
    
    def create_session(
        self,
        db: Session,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> SessionModel:
        """创建新会话"""
        session = SessionModel(
            user_id=user_id,
            status="active",
            context=metadata or {},
            expired_at=datetime.utcnow() + timedelta(seconds=settings.SESSION_TIMEOUT)
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    def get_session(self, db: Session, session_id: str) -> Optional[SessionModel]:
        """获取会话"""
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        
        if session and session.status == "active":
            # 检查是否过期
            if session.expired_at and session.expired_at < datetime.utcnow():
                session.status = "expired"
                db.commit()
                return None
            
            # 更新过期时间
            session.expired_at = datetime.utcnow() + timedelta(
                seconds=settings.SESSION_TIMEOUT
            )
            db.commit()
        
        return session
    
    def add_message(
        self,
        db: Session,
        session_id: str,
        role: str,
        content: str,
        intent: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> MessageModel:
        """添加消息"""
        message = MessageModel(
            session_id=session_id,
            role=role,
            content=content,
            intent=intent,
            metadata=metadata or {}
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # 更新会话时间
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        if session:
            session.updated_at = datetime.utcnow()
            db.commit()
        
        # 更新 Redis 缓存
        self._cache_message(session_id, {
            "role": role,
            "content": content,
            "timestamp": message.created_at.isoformat()
        })
        
        return message
    
    def get_messages(
        self,
        db: Session,
        session_id: str,
        limit: int = None
    ) -> List[MessageModel]:
        """获取会话消息历史"""
        limit = limit or settings.MAX_HISTORY_MESSAGES
        
        messages = db.query(MessageModel).filter(
            MessageModel.session_id == session_id
        ).order_by(
            MessageModel.created_at.desc()
        ).limit(limit).all()
        
        return list(reversed(messages))
    
    def get_recent_history(
        self,
        db: Session,
        session_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """获取最近的消息历史（用于 LLM 上下文）"""
        messages = self.get_messages(db, session_id, limit)
        
        return [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in messages
        ]
    
    def update_context(
        self,
        db: Session,
        session_id: str,
        context_updates: Dict[str, Any]
    ) -> bool:
        """更新会话上下文"""
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        
        if not session:
            return False
        
        session.context.update(context_updates)
        db.commit()
        
        # 同步到 Redis
        self.redis_client.setex(
            f"session:{session_id}:context",
            settings.SESSION_TIMEOUT,
            json.dumps(session.context)
        )
        
        return True
    
    def get_context(
        self,
        db: Session,
        session_id: str
    ) -> Dict[str, Any]:
        """获取会话上下文"""
        # 先尝试从 Redis 获取
        cached = self.redis_client.get(f"session:{session_id}:context")
        if cached:
            return json.loads(cached)
        
        # 从数据库获取
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        
        return session.context if session else {}
    
    def close_session(self, db: Session, session_id: str) -> bool:
        """关闭会话"""
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        
        if session:
            session.status = "closed"
            db.commit()
            
            # 清理 Redis
            self.redis_client.delete(f"session:{session_id}:context")
            self.redis_client.delete(f"session:{session_id}:messages")
            
            return True
        return False
    
    def _cache_message(self, session_id: str, message: Dict):
        """缓存消息到 Redis"""
        key = f"session:{session_id}:messages"
        self.redis_client.lpush(key, json.dumps(message))
        self.redis_client.ltrim(key, 0, settings.MAX_HISTORY_MESSAGES - 1)
        self.redis_client.expire(key, settings.SESSION_TIMEOUT)


# 全局会话服务实例
session_service = SessionService()
```

#### 3.2.7 工单服务 (app/services/ticket_service.py)

```python
"""工单服务"""
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.database import TicketModel
from app.models.schemas import (
    TicketCreate, TicketUpdate, TicketResponse,
    TicketStatus, TicketPriority, TicketCategory
)


class TicketService:
    """工单服务"""
    
    def generate_ticket_number(self) -> str:
        """生成工单编号"""
        date_str = datetime.utcnow().strftime("%Y%m%d")
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"TK-{date_str}-{random_suffix}"
    
    def create_ticket(
        self,
        db: Session,
        ticket_data: TicketCreate
    ) -> TicketModel:
        """创建工单"""
        ticket = TicketModel(
            ticket_number=self.generate_ticket_number(),
            session_id=ticket_data.session_id,
            title=ticket_data.title,
            description=ticket_data.description,
            category=ticket_data.category.value,
            priority=ticket_data.priority.value,
            status=TicketStatus.OPEN.value,
            customer_email=ticket_data.customer_email,
            customer_phone=ticket_data.customer_phone
        )
        
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        
        return ticket
    
    def get_ticket_by_number(
        self,
        db: Session,
        ticket_number: str
    ) -> Optional[TicketModel]:
        """根据编号获取工单"""
        return db.query(TicketModel).filter(
            TicketModel.ticket_number == ticket_number
        ).first()
    
    def get_ticket(self, db: Session, ticket_id: str) -> Optional[TicketModel]:
        """获取工单"""
        return db.query(TicketModel).filter(
            TicketModel.id == ticket_id
        ).first()
    
    def update_ticket(
        self,
        db: Session,
        ticket_id: str,
        update_data: TicketUpdate
    ) -> Optional[TicketModel]:
        """更新工单"""
        ticket = self.get_ticket(db, ticket_id)
        if not ticket:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            if value is not None:
                setattr(ticket, field, value.value if hasattr(value, 'value') else value)
        
        # 如果状态变为已解决，记录解决时间
        if update_data.status == TicketStatus.RESOLVED and not ticket.resolved_at:
            ticket.resolved_at = datetime.utcnow()
        
        ticket.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(ticket)
        
        return ticket
    
    def list_tickets(
        self,
        db: Session,
        status: Optional[TicketStatus] = None,
        priority: Optional[TicketPriority] = None,
        category: Optional[TicketCategory] = None,
        assigned_to: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[TicketModel], int]:
        """列取工单列表"""
        query = db.query(TicketModel)
        
        if status:
            query = query.filter(TicketModel.status == status.value)
        if priority:
            query = query.filter(TicketModel.priority == priority.value)
        if category:
            query = query.filter(TicketModel.category == category.value)
        if assigned_to:
            query = query.filter(TicketModel.assigned_to == assigned_to)
        
        total = query.count()
        tickets = query.order_by(desc(TicketModel.created_at)).offset(skip).limit(limit).all()
        
        return tickets, total
    
    def to_response(self, ticket: TicketModel) -> TicketResponse:
        """转换为响应模型"""
        return TicketResponse(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            title=ticket.title,
            description=ticket.description,
            status=TicketStatus(ticket.status),
            priority=TicketPriority(ticket.priority),
            category=TicketCategory(ticket.category),
            customer_email=ticket.customer_email,
            customer_phone=ticket.customer_phone,
            assigned_to=ticket.assigned_to,
            resolution=ticket.resolution,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            resolved_at=ticket.resolved_at
        )


# 全局工单服务实例
ticket_service = TicketService()
```

#### 3.2.8 Agent 工具定义 (app/agents/tools.py)

```python
"""Agent 工具定义"""
from typing import Dict, Any, Optional
from functools import wraps

from app.models.database import SessionLocal
from app.models.schemas import TicketCreate, TicketCategory, TicketPriority
from app.services.ticket_service import ticket_service
from app.services.rag_service import rag_service


def get_db_session():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CustomerServiceTools:
    """客服工具集"""
    
    @staticmethod
    def search_knowledge(query: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        搜索知识库
        
        Args:
            query: 搜索查询
            category: 可选的分类过滤
            
        Returns:
            搜索结果
        """
        try:
            results = rag_service.search(query=query, category=category, top_k=3)
            
            if not results:
                return {
                    "success": True,
                    "found": False,
                    "message": "未找到相关知识",
                    "results": []
                }
            
            return {
                "success": True,
                "found": True,
                "message": f"找到 {len(results)} 条相关知识",
                "results": [
                    {
                        "title": r.title,
                        "content": r.content,
                        "score": r.score,
                        "category": r.category
                    }
                    for r in results
                ]
            }
        except Exception as e:
            return {
                "success": False,
                "found": False,
                "message": f"搜索失败: {str(e)}",
                "results": []
            }
    
    @staticmethod
    def create_ticket(
        title: str,
        description: str,
        category: str,
        priority: str = "medium",
        customer_email: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        创建工单
        
        Args:
            title: 工单标题
            description: 工单描述
            category: 分类 (technical, billing, product, other)
            priority: 优先级 (low, medium, high, urgent)
            customer_email: 客户邮箱
            session_id: 会话ID
            
        Returns:
            创建结果
        """
        db = SessionLocal()
        try:
            # 映射分类和优先级
            category_map = {
                "technical": TicketCategory.TECHNICAL,
                "billing": TicketCategory.BILLING,
                "product": TicketCategory.PRODUCT,
                "other": TicketCategory.OTHER
            }
            
            priority_map = {
                "low": TicketPriority.LOW,
                "medium": TicketPriority.MEDIUM,
                "high": TicketPriority.HIGH,
                "urgent": TicketPriority.URGENT
            }
            
            ticket_data = TicketCreate(
                title=title,
                description=description,
                category=category_map.get(category, TicketCategory.OTHER),
                priority=priority_map.get(priority, TicketPriority.MEDIUM),
                customer_email=customer_email,
                session_id=session_id
            )
            
            ticket = ticket_service.create_ticket(db, ticket_data)
            
            return {
                "success": True,
                "ticket_id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "message": f"工单已创建，编号：{ticket.ticket_number}"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"创建工单失败: {str(e)}"
            }
        finally:
            db.close()
    
    @staticmethod
    def query_ticket(ticket_id: str) -> Dict[str, Any]:
        """
        查询工单
        
        Args:
            ticket_id: 工单编号或ID
            
        Returns:
            工单信息
        """
        db = SessionLocal()
        try:
            # 尝试按编号查询
            ticket = ticket_service.get_ticket_by_number(db, ticket_id)
            if not ticket:
                # 尝试按ID查询
                ticket = ticket_service.get_ticket(db, ticket_id)
            
            if not ticket:
                return {
                    "success": False,
                    "found": False,
                    "message": f"未找到工单: {ticket_id}"
                }
            
            return {
                "success": True,
                "found": True,
                "ticket": {
                    "ticket_number": ticket.ticket_number,
                    "title": ticket.title,
                    "status": ticket.status,
                    "priority": ticket.priority,
                    "category": ticket.category,
                    "created_at": ticket.created_at.isoformat(),
                    "updated_at": ticket.updated_at.isoformat(),
                    "assigned_to": ticket.assigned_to,
                    "resolution": ticket.resolution
                }
            }
        except Exception as e:
            return {
                "success": False,
                "found": False,
                "message": f"查询失败: {str(e)}"
            }
        finally:
            db.close()
    
    @staticmethod
    def escalate_to_human(reason: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        转接人工客服
        
        Args:
            reason: 转接原因
            session_id: 会话ID
            
        Returns:
            转接结果
        """
        return {
            "success": True,
            "action": "escalate",
            "message": "正在为您转接人工客服，请稍候...",
            "reason": reason,
            "estimated_wait": "预计等待时间：2分钟"
        }


# 工具函数映射（用于 Function Calling）
TOOLS_MAP = {
    "search_knowledge": CustomerServiceTools.search_knowledge,
    "create_ticket": CustomerServiceTools.create_ticket,
    "query_ticket": CustomerServiceTools.query_ticket,
    "escalate_to_human": CustomerServiceTools.escalate_to_human
}

# OpenAI Function Calling Schema
OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge",
            "description": "从企业知识库搜索产品文档、FAQ、技术支持等信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索查询，应该是对用户问题的关键词提取"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["product", "technical", "billing", "general"],
                        "description": "可选的知识库分类过滤"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_ticket",
            "description": "创建客服工单，用于处理用户反馈的问题、投诉或需要人工跟进的事项",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "工单标题，简要概括问题"
                    },
                    "description": {
                        "type": "string",
                        "description": "工单详细描述，包含问题的完整信息"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["technical", "billing", "product", "other"],
                        "description": "工单分类"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "工单优先级，默认 medium"
                    },
                    "customer_email": {
                        "type": "string",
                        "description": "客户邮箱，如果有的话"
                    }
                },
                "required": ["title", "description", "category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_ticket",
            "description": "查询工单的状态和详情",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticket_id": {
                        "type": "string",
                        "description": "工单编号（如 TK-20240115-ABC123）或工单ID"
                    }
                },
                "required": ["ticket_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": "当问题无法自动解决或用户明确要求时，转接人工客服",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "转接人工的原因"
                    }
                },
                "required": ["reason"]
            }
        }
    }
]
```

#### 3.2.9 客服 Agent (app/agents/customer_agent.py)

```python
"""客服 Agent 实现"""
import json
from typing import List, Dict, Any, Optional, AsyncGenerator

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.config import settings
from app.models.schemas import IntentClassification, IntentType, ChatMessage
from app.agents.tools import OPENAI_TOOLS, TOOLS_MAP


class CustomerServiceAgent:
    """企业智能客服 Agent"""
    
    SYSTEM_PROMPT = """你是「智云科技」的智能客服助手，专业、友好、高效地为客户提供服务。

【你的职责】
1. 准确理解客户问题，提供专业解答
2. 善用工具查询信息，不要凭空编造
3. 复杂问题主动创建工单跟进
4. 保持礼貌、耐心的服务态度

【服务准则】
- 首次响应问候客户，了解需求
- 回答简洁明了，避免冗长
- 不确定时主动查询知识库
- 技术问题提供分步指导
- 投诉问题表达同理心并记录

【工具使用】
- search_knowledge: 查询产品、技术、账单等知识
- create_ticket: 创建工单跟进复杂问题
- query_ticket: 查询工单状态
- escalate_to_human: 转接人工客服

【重要】
- 不要编造产品信息，务必使用 search_knowledge 查询
- 涉及账户安全的问题必须创建工单
- 客户情绪激动时优先安抚并记录
"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY,
            openai_api_base=settings.OPENAI_BASE_URL
        )
        
        # 绑定工具的 LLM
        self.llm_with_tools = self.llm.bind_tools(OPENAI_TOOLS)
    
    async def chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        session_id: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        处理对话请求
        
        Args:
            message: 用户消息
            history: 历史消息
            session_id: 会话ID
            stream: 是否流式响应
            
        Returns:
            响应结果
        """
        # 构建消息列表
        messages = [SystemMessage(content=self.SYSTEM_PROMPT)]
        
        # 添加历史消息
        if history:
            for msg in history[-settings.MAX_HISTORY_MESSAGES:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # 添加当前消息
        messages.append(HumanMessage(content=message))
        
        # 调用 LLM
        response = await self.llm_with_tools.ainvoke(messages)
        
        # 处理工具调用
        tool_calls = response.tool_calls if hasattr(response, 'tool_calls') else []
        
        if tool_calls:
            # 执行工具
            tool_results = []
            for tool_call in tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                # 添加 session_id
                if session_id and tool_name in ["create_ticket"]:
                    tool_args["session_id"] = session_id
                
                # 执行工具
                if tool_name in TOOLS_MAP:
                    result = TOOLS_MAP[tool_name](**tool_args)
                    tool_results.append({
                        "tool": tool_name,
                        "args": tool_args,
                        "result": result
                    })
            
            # 将工具结果添加到消息
            messages.append(response)
            for tool_result in tool_results:
                messages.append(
                    HumanMessage(content=f"工具 {tool_result['tool']} 返回结果：\n{json.dumps(tool_result['result'], ensure_ascii=False)}")
                )
            
            # 再次调用获取最终回复
            final_response = await self.llm.ainvoke(messages)
            
            return {
                "message": final_response.content,
                "tool_calls": tool_results,
                "session_id": session_id
            }
        
        return {
            "message": response.content,
            "tool_calls": [],
            "session_id": session_id
        }
    
    async def chat_stream(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        流式对话
        
        Args:
            message: 用户消息
            history: 历史消息
            session_id: 会话ID
            
        Yields:
            流式响应片段
        """
        # 构建消息列表
        messages = [SystemMessage(content=self.SYSTEM_PROMPT)]
        
        if history:
            for msg in history[-settings.MAX_HISTORY_MESSAGES:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=message))
        
        # 先检查是否需要工具
        response = await self.llm_with_tools.ainvoke(messages)
        
        tool_calls = response.tool_calls if hasattr(response, 'tool_calls') else []
        
        if tool_calls:
            # 执行工具
            tool_results = []
            for tool_call in tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                if session_id and tool_name in ["create_ticket"]:
                    tool_args["session_id"] = session_id
                
                if tool_name in TOOLS_MAP:
                    result = TOOLS_MAP[tool_name](**tool_args)
                    tool_results.append({
                        "tool": tool_name,
                        "result": result
                    })
            
            # 发送工具调用信息
            yield json.dumps({
                "type": "tool_calls",
                "data": tool_results
            }) + "\n"
            
            # 构建最终消息
            messages.append(response)
            for tool_result in tool_results:
                messages.append(
                    HumanMessage(content=f"工具返回：{json.dumps(tool_result['result'], ensure_ascii=False)}")
                )
            
            # 流式生成回复
            async for chunk in self.llm.astream(messages):
                yield json.dumps({
                    "type": "content",
                    "data": chunk.content
                }) + "\n"
        else:
            # 直接流式生成
            async for chunk in self.llm.astream(messages):
                yield json.dumps({
                    "type": "content",
                    "data": chunk.content
                }) + "\n"
        
        # 发送结束标记
        yield json.dumps({"type": "done"}) + "\n"


# 全局 Agent 实例
customer_agent = CustomerServiceAgent()
```

#### 3.2.10 对话服务 (app/services/chat_service.py)

```python
"""对话服务"""
from typing import Dict, Any, Optional, AsyncGenerator

from sqlalchemy.orm import Session

from app.models.schemas import ChatRequest, ChatResponse, ChatMessage
from app.models.database import SessionModel
from app.services.session_service import session_service
from app.services.intent_service import intent_service
from app.agents.customer_agent import customer_agent


class ChatService:
    """对话服务"""
    
    async def process_message(
        self,
        db: Session,
        request: ChatRequest,
        user_id: Optional[str] = None
    ) -> ChatResponse:
        """
        处理用户消息
        
        Args:
            db: 数据库会话
            request: 聊天请求
            user_id: 用户ID
            
        Returns:
            聊天响应
        """
        # 获取或创建会话
        if request.session_id:
            session = session_service.get_session(db, request.session_id)
            if not session:
                session = session_service.create_session(db, user_id)
        else:
            session = session_service.create_session(db, user_id)
        
        # 获取历史消息
        history = session_service.get_recent_history(db, session.id)
        
        # 识别意图
        intent_result = await intent_service.classify(
            message=request.message,
            history=history
        )
        
        # 需要澄清
        if intent_result.requires_clarification:
            assistant_msg = "抱歉，我没有完全理解您的问题。能否请您再详细描述一下您的需求？"
            
            # 保存消息
            session_service.add_message(db, session.id, "user", request.message, intent_result.intent.value)
            session_service.add_message(db, session.id, "assistant", assistant_msg)
            
            return ChatResponse(
                session_id=session.id,
                message=ChatMessage(role="assistant", content=assistant_msg),
                intent=intent_result.intent.value
            )
        
        # 调用 Agent
        if request.stream:
            # 流式响应在 API 层处理
            pass
        
        result = await customer_agent.chat(
            message=request.message,
            history=history,
            session_id=session.id
        )
        
        # 保存用户消息
        session_service.add_message(
            db, session.id, "user", request.message,
            intent=intent_result.intent.value
        )
        
        # 保存助手消息
        metadata = {}
        if result.get("tool_calls"):
            metadata["tool_calls"] = result["tool_calls"]
        
        session_service.add_message(
            db, session.id, "assistant", result["message"],
            metadata=metadata
        )
        
        # 提取来源
        sources = []
        for tool_call in result.get("tool_calls", []):
            if tool_call["tool"] == "search_knowledge" and tool_call["result"].get("found"):
                sources = tool_call["result"].get("results", [])
                break
        
        return ChatResponse(
            session_id=session.id,
            message=ChatMessage(role="assistant", content=result["message"]),
            intent=intent_result.intent.value,
            sources=sources,
            actions=result.get("tool_calls", [])
        )
    
    async def process_message_stream(
        self,
        db: Session,
        request: ChatRequest,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        流式处理用户消息
        
        Args:
            db: 数据库会话
            request: 聊天请求
            user_id: 用户ID
            
        Yields:
            流式响应
        """
        # 获取或创建会话
        if request.session_id:
            session = session_service.get_session(db, request.session_id)
            if not session:
                session = session_service.create_session(db, user_id)
        else:
            session = session_service.create_session(db, user_id)
        
        # 获取历史消息
        history = session_service.get_recent_history(db, session.id)
        
        # 保存用户消息
        session_service.add_message(db, session.id, "user", request.message)
        
        # 流式生成
        full_response = ""
        async for chunk in customer_agent.chat_stream(
            message=request.message,
            history=history,
            session_id=session.id
        ):
            yield chunk
            
            # 收集完整响应
            try:
                data = json.loads(chunk)
                if data.get("type") == "content":
                    full_response += data.get("data", "")
            except:
                pass
        
        # 保存助手消息
        if full_response:
            session_service.add_message(db, session.id, "assistant", full_response)


# 全局对话服务实例
chat_service = ChatService()
```

#### 3.2.11 API 路由 (app/api/chat.py)

```python
"""对话 API"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import (
    ChatRequest, ChatResponse, ResponseBase,
    SessionCreate, SessionResponse
)
from app.services.chat_service import chat_service
from app.services.session_service import session_service

router = APIRouter(prefix="/chat", tags=["对话"])


@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = None
):
    """发送消息（非流式）"""
    try:
        response = await chat_service.process_message(db, request, user_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send/stream")
async def send_message_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = None
):
    """发送消息（流式）"""
    async def generate():
        async for chunk in chat_service.process_message_stream(db, request, user_id):
            yield chunk
    
    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson"
    )


@router.post("/sessions", response_model=SessionResponse)
def create_session(
    request: SessionCreate,
    db: Session = Depends(get_db)
):
    """创建新会话"""
    session = session_service.create_session(
        db,
        user_id=request.user_id,
        metadata=request.metadata
    )
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """获取会话信息"""
    session = session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在或已过期")
    
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages)
    )


@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: str,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    """获取会话消息历史"""
    session = session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在或已过期")
    
    messages = session_service.get_messages(db, session_id, limit)
    return ResponseBase(data=[
        {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "intent": msg.intent,
            "created_at": msg.created_at.isoformat()
        }
        for msg in messages
    ])


@router.post("/sessions/{session_id}/close")
def close_session(session_id: str, db: Session = Depends(get_db)):
    """关闭会话"""
    success = session_service.close_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="会话不存在")
    return ResponseBase(message="会话已关闭")
```

#### 3.2.12 工单 API (app/api/tickets.py)

```python
"""工单 API"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import (
    TicketCreate, TicketUpdate, TicketResponse,
    TicketStatus, TicketPriority, TicketCategory,
    ResponseBase, PaginatedResponse
)
from app.services.ticket_service import ticket_service

router = APIRouter(prefix="/tickets", tags=["工单"])


@router.post("", response_model=TicketResponse)
def create_ticket(
    request: TicketCreate,
    db: Session = Depends(get_db)
):
    """创建工单"""
    ticket = ticket_service.create_ticket(db, request)
    return ticket_service.to_response(ticket)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """获取工单详情"""
    # 尝试按编号查询
    ticket = ticket_service.get_ticket_by_number(db, ticket_id)
    if not ticket:
        ticket = ticket_service.get_ticket(db, ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    return ticket_service.to_response(ticket)


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    request: TicketUpdate,
    db: Session = Depends(get_db)
):
    """更新工单"""
    ticket = ticket_service.update_ticket(db, ticket_id, request)
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")
    
    return ticket_service.to_response(ticket)


@router.get("", response_model=PaginatedResponse)
def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    category: Optional[TicketCategory] = None,
    assigned_to: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取工单列表"""
    skip = (page - 1) * page_size
    tickets, total = ticket_service.list_tickets(
        db, status, priority, category, assigned_to, skip, page_size
    )
    
    return PaginatedResponse(
        data=[ticket_service.to_response(t) for t in tickets],
        total=total,
        page=page,
        page_size=page_size
    )
```

#### 3.2.13 知识库 API (app/api/knowledge.py)

```python
"""知识库 API"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models.database import get_db, DocumentModel
from app.models.schemas import (
    DocumentUpload, DocumentResponse, SearchRequest,
    SearchResponse, SearchResult, ResponseBase
)
from app.services.rag_service import rag_service

router = APIRouter(prefix="/knowledge", tags=["知识库"])


@router.post("/documents", response_model=ResponseBase)
def add_document(
    request: DocumentUpload,
    db: Session = Depends(get_db)
):
    """添加文档到知识库"""
    import hashlib
    
    # 检查重复
    content_hash = hashlib.sha256(request.content.encode()).hexdigest()
    existing = db.query(DocumentModel).filter(
        DocumentModel.content_hash == content_hash
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="文档已存在")
    
    # 创建文档记录
    doc = DocumentModel(
        title=request.title,
        content=request.content,
        content_hash=content_hash,
        category=request.category,
        tags=request.tags or []
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # 添加到向量库
    try:
        chunk_ids = rag_service.add_document(
            doc_id=doc.id,
            title=request.title,
            content=request.content,
            category=request.category,
            metadata={"tags": request.tags}
        )
        
        # 更新索引状态
        doc.is_indexed = 1
        from datetime import datetime
        doc.indexed_at = datetime.utcnow()
        db.commit()
        
        return ResponseBase(data={
            "document_id": doc.id,
            "chunks": len(chunk_ids)
        })
    except Exception as e:
        db.delete(doc)
        db.commit()
        raise HTTPException(status_code=500, detail=f"索引失败: {str(e)}")


@router.post("/search", response_model=SearchResponse)
def search_knowledge(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """搜索知识库"""
    results = rag_service.search(
        query=request.query,
        category=request.category,
        top_k=request.top_k
    )
    
    return SearchResponse(
        data=results,
        total=len(results)
    )


@router.delete("/documents/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """删除文档"""
    doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    # 从向量库删除
    rag_service.delete_document(document_id)
    
    # 从数据库删除
    db.delete(doc)
    db.commit()
    
    return ResponseBase(message="文档已删除")


@router.get("/documents")
def list_documents(
    category: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取文档列表"""
    query = db.query(DocumentModel)
    if category:
        query = query.filter(DocumentModel.category == category)
    
    total = query.count()
    docs = query.order_by(DocumentModel.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return PaginatedResponse(
        data=[
            DocumentResponse(
                id=d.id,
                title=d.title,
                category=d.category,
                tags=d.tags,
                created_at=d.created_at,
                updated_at=d.updated_at
            )
            for d in docs
        ],
        total=total,
        page=page,
        page_size=page_size
    )
```

#### 3.2.14 主应用入口 (app/main.py)

```python
"""FastAPI 主应用"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.database import init_db
from app.api import chat, tickets, knowledge


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    print("Initializing database...")
    init_db()
    print("Database initialized.")
    
    yield
    
    # 关闭时清理
    print("Shutting down...")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="企业智能客服系统 API",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "Please contact support"
        }
    )


# 健康检查
@app.get("/health")
def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": settings.APP_NAME
    }


# 注册路由
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(tickets.router, prefix=settings.API_V1_PREFIX)
app.include_router(knowledge.router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
```

---

## 四、前端完整代码

### 4.1 类型定义 (frontend/src/types/index.ts)

```typescript
// 消息类型
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  intent?: string;
  sources?: KnowledgeSource[];
  isStreaming?: boolean;
}

// 知识来源
export interface KnowledgeSource {
  title: string;
  content: string;
  score: number;
  category?: string;
}

// 会话信息
export interface Session {
  id: string;
  userId?: string;
  status: 'active' | 'closed' | 'expired';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

// 聊天请求
export interface ChatRequest {
  sessionId?: string;
  message: string;
  stream?: boolean;
}

// 聊天响应
export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  intent?: string;
  sources?: KnowledgeSource[];
  actions?: AgentAction[];
}

// Agent 动作
export interface AgentAction {
  tool: string;
  result: {
    success: boolean;
    message: string;
    [key: string]: any;
  };
}

// 工单
export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'product' | 'other';
  customerEmail?: string;
  customerPhone?: string;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 流式响应
export interface StreamChunk {
  type: 'content' | 'tool_calls' | 'done';
  data?: any;
}
```

### 4.2 API 服务 (frontend/src/services/api.ts)

```typescript
import { ChatRequest, ChatResponse, Session, Ticket, ApiResponse, StreamChunk } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// 通用请求封装
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 会话 API
export const sessionApi = {
  // 创建会话
  create: async (userId?: string): Promise<Session> => {
    const res = await request<ApiResponse<Session>>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return res.data;
  },

  // 获取会话
  get: async (sessionId: string): Promise<Session> => {
    const res = await request<ApiResponse<Session>>(`/chat/sessions/${sessionId}`);
    return res.data;
  },

  // 获取消息历史
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await request<ApiResponse<ChatMessage[]>>(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  },

  // 关闭会话
  close: async (sessionId: string): Promise<void> => {
    await request(`/chat/sessions/${sessionId}/close`, { method: 'POST' });
  },
};

// 聊天 API
export const chatApi = {
  // 发送消息（非流式）
  send: async (request: ChatRequest): Promise<ChatResponse> => {
    const res = await request<ApiResponse<ChatResponse>>('/chat/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return res.data;
  },

  // 发送消息（流式）
  sendStream: async (
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/chat/send/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk: StreamChunk = JSON.parse(line);
            onChunk(chunk);
          } catch (e) {
            console.error('Parse chunk error:', e);
          }
        }
      }
    }
  },
};

// 工单 API
export const ticketApi = {
  // 创建工单
  create: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    const res = await request<ApiResponse<Ticket>>('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
    return res.data;
  },

  // 查询工单
  get: async (ticketId: string): Promise<Ticket> => {
    const res = await request<ApiResponse<Ticket>>(`/tickets/${ticketId}`);
    return res.data;
  },

  // 更新工单
  update: async (ticketId: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const res = await request<ApiResponse<Ticket>>(`/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  // 获取工单列表
  list: async (params?: { status?: string; page?: number; pageSize?: number }): Promise<{
    data: Ticket[];
    total: number;
  }> => {
    const query = new URLSearchParams(params as Record<string, string>);
    const res = await request<ApiResponse<{ data: Ticket[]; total: number }>>(
      `/tickets?${query}`
    );
    return res.data;
  },
};

// 知识库 API
export const knowledgeApi = {
  // 搜索知识库
  search: async (query: string, category?: string): Promise<KnowledgeSource[]> => {
    const res = await request<ApiResponse<{ data: KnowledgeSource[] }>>('/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query, category }),
    });
    return res.data.data;
  },
};
```

### 4.3 Chat Hook (frontend/src/hooks/useChat.ts)

```typescript
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, Session, StreamChunk } from '../types';
import { chatApi, sessionApi } from '../services/api';

interface UseChatOptions {
  userId?: string;
  enableStream?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  session: Session | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  initSession: () => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化会话
  const initSession = useCallback(async () => {
    try {
      const newSession = await sessionApi.create(options.userId);
      setSession(newSession);
      
      // 添加欢迎消息
      setMessages([{
        role: 'assistant',
        content: '您好！我是智云科技智能客服助手，很高兴为您服务。请问有什么可以帮助您的吗？',
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      setError('初始化会话失败');
      console.error(err);
    }
  }, [options.userId]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (options.enableStream) {
        // 流式响应
        setIsStreaming(true);
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        };
        setMessages(prev => [...prev, assistantMessage]);

        await chatApi.sendStream(
          {
            sessionId: session?.id,
            message: content,
            stream: true,
          },
          (chunk: StreamChunk) => {
            if (chunk.type === 'content') {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content += chunk.data || '';
                }
                return newMessages;
              });
            } else if (chunk.type === 'tool_calls') {
              // 处理工具调用通知
              console.log('Tool calls:', chunk.data);
            } else if (chunk.type === 'done') {
              setIsStreaming(false);
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.isStreaming = false;
                }
                return newMessages;
              });
            }
          }
        );
      } else {
        // 非流式响应
        const response = await chatApi.send({
          sessionId: session?.id,
          message: content,
          stream: false,
        });

        // 更新会话ID
        if (response.sessionId && !session) {
          setSession(prev => prev ? { ...prev, id: response.sessionId } : null);
        }

        // 添加助手消息
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message.content,
          timestamp: new Date().toISOString(),
          intent: response.intent,
          sources: response.sources,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setError('发送消息失败，请重试');
      console.error(err);
      
      // 添加错误消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后再试。',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [session, isLoading, options.enableStream]);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setSession(null);
    setError(null);
  }, []);

  return {
    messages,
    session,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    initSession,
  };
}
```

### 4.4 聊天组件

#### ChatWindow.tsx

```typescript
import React, { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '../../hooks/useChat';
import './ChatWindow.css';

interface ChatWindowProps {
  userId?: string;
  title?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  userId,
  title = '智能客服',
}) => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    initSession,
  } = useChat({
    userId,
    enableStream: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化会话
  useEffect(() => {
    initSession();
  }, [initSession]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {/* 头部 */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{title}</h3>
          <span className="status-indicator online">在线</span>
        </div>
        <div className="chat-header-actions">
          <button className="icon-button" title="转人工">
            👤
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="chat-messages">
        <MessageList messages={messages} />
        {isLoading && !isStreaming && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

      {/* 输入框 */}
      <MessageInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="请输入您的问题..."
      />
    </div>
  );
};
```

#### MessageList.tsx

```typescript
import React from 'react';
import { ChatMessage, KnowledgeSource } from '../../types';
import './MessageList.css';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message-item ${message.role}`}
        >
          <div className="message-avatar">
            {message.role === 'user' ? '👤' : '🤖'}
          </div>
          <div className="message-content-wrapper">
            <div className="message-bubble">
              <div className="message-text">
                {message.content}
                {message.isStreaming && <span className="cursor">▊</span>}
              </div>
              
              {/* 知识来源 */}
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <div className="sources-title">参考来源：</div>
                  {message.sources.map((source, idx) => (
                    <SourceItem key={idx} source={source} />
                  ))}
                </div>
              )}
            </div>
            <div className="message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 来源项组件
const SourceItem: React.FC<{ source: KnowledgeSource }> = ({ source }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="source-item">
      <div
        className="source-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="source-title">{source.title}</span>
        <span className="source-score">
          相关度: {(source.score * 100).toFixed(0)}%
        </span>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="source-content">{source.content}</div>
      )}
    </div>
  );
};
```

#### MessageInput.tsx

```typescript
import React, { useState, useRef, useCallback } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = '请输入消息...',
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // 自动调整高度
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="message-textarea"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="send-button"
        >
          {disabled ? '⏳' : '➤'}
        </button>
      </div>
      <div className="input-tips">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  );
};
```

#### TypingIndicator.tsx

```typescript
import React from 'react';
import './TypingIndicator.css';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <div className="message-avatar">🤖</div>
      <div className="typing-bubble">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};
```

### 4.5 样式文件

#### ChatWindow.css

```css
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 800px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-header-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-indicator {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 4px;
}

.status-indicator.online {
  background: rgba(255, 255, 255, 0.2);
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

.icon-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.chat-error {
  padding: 12px 20px;
  background: #fee;
  color: #c33;
  font-size: 14px;
  text-align: center;
}
```

#### MessageList.css

```css
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-item.assistant .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-item.user .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
}

.message-item.assistant .message-bubble {
  background: white;
  border: 1px solid #e8e8e8;
  color: #333;
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-text {
  line-height: 1.6;
  font-size: 14px;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.message-item.user .message-time {
  text-align: right;
}

/* 知识来源样式 */
.message-sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ddd;
}

.sources-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.source-item {
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.source-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
}

.source-title {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.source-score {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.expand-icon {
  font-size: 10px;
  color: #999;
}

.source-content {
  padding: 8px 12px;
  font-size: 12px;
  color: #666;
  background: #fafafa;
  border-top: 1px solid #eee;
  line-height: 1.5;
}
```

#### MessageInput.css

```css
.message-input-container {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e8e8e8;
}

.message-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-textarea {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  max-height: 120px;
  min-height: 44px;
  outline: none;
  transition: border-color 0.2s;
}

.message-textarea:focus {
  border-color: #667eea;
}

.message-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-tips {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
```

#### TypingIndicator.css

```css
.typing-indicator {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 8px 0;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
}

.typing-bubble span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-bubble span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-bubble span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
```

### 4.6 主应用 (frontend/src/App.tsx)

```typescript
import React from 'react';
import { ChatWindow } from './components/Chat/ChatWindow';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="app-container">
        <aside className="app-sidebar">
          <div className="sidebar-header">
            <h1>智云科技</h1>
            <p>智能客服系统</p>
          </div>
          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
              <span className="nav-icon">💬</span>
              在线客服
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">📋</span>
              工单查询
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">📚</span>
              帮助中心
            </a>
          </nav>
        </aside>
        <main className="app-main">
          <ChatWindow userId="guest-001" />
        </main>
      </div>
    </div>
  );
}

export default App;
```

### 4.7 入口文件 (frontend/src/main.tsx)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 4.8 配置文件

#### frontend/package.json

```json
{
  "name": "customer-service-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

#### frontend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### frontend/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## 五、效果评估与优化

### 5.1 评估指标

```python
"""评估指标体系"""
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class EvaluationMetrics:
    """评估指标"""
    
    # 意图识别
    intent_accuracy: float = 0.0  # 意图识别准确率
    intent_confidence: float = 0.0  # 平均置信度
    
    # RAG 检索
    retrieval_precision: float = 0.0  # 检索精确率
    retrieval_recall: float = 0.0  # 检索召回率
    retrieval_mrr: float = 0.0  # 平均倒数排名
    
    # 回答质量
    response_relevance: float = 0.0  # 回答相关性
    response_completeness: float = 0.0  # 回答完整性
    response_correctness: float = 0.0  # 回答正确性
    
    # 用户体验
    avg_response_time: float = 0.0  # 平均响应时间
    user_satisfaction: float = 0.0  # 用户满意度
    conversation_success_rate: float = 0.0  # 对话成功率
    
    # 业务指标
    ticket_creation_rate: float = 0.0  # 工单创建率
    human_escalation_rate: float = 0.0  # 人工转接率
    self_service_resolution_rate: float = 0.0  # 自助解决率


class Evaluator:
    """评估器"""
    
    def __init__(self):
        self.metrics = EvaluationMetrics()
        self.test_cases = []
    
    def add_test_case(self, query: str, expected_intent: str, expected_answer: str = None):
        """添加测试用例"""
        self.test_cases.append({
            "query": query,
            "expected_intent": expected_intent,
            "expected_answer": expected_answer
        })
    
    def evaluate_intent(self, predictions: List[str], labels: List[str]) -> float:
        """评估意图识别准确率"""
        correct = sum(1 for p, l in zip(predictions, labels) if p == l)
        return correct / len(labels) if labels else 0.0
    
    def evaluate_retrieval(self, retrieved: List[List[str]], relevant: List[List[str]]) -> Dict:
        """评估检索质量"""
        # Precision@K
        precisions = []
        for r, rel in zip(retrieved, relevant):
            if not r:
                precisions.append(0.0)
                continue
            hits = len(set(r) & set(rel))
            precisions.append(hits / len(r))
        
        # Recall
        recalls = []
        for r, rel in zip(retrieved, relevant):
            if not rel:
                recalls.append(1.0 if not r else 0.0)
                continue
            hits = len(set(r) & set(rel))
            recalls.append(hits / len(rel))
        
        return {
            "precision": sum(precisions) / len(precisions),
            "recall": sum(recalls) / len(recalls)
        }
    
    def generate_report(self) -> str:
        """生成评估报告"""
        return f"""
# 智能客服系统评估报告

## 意图识别
- 准确率: {self.metrics.intent_accuracy:.2%}
- 平均置信度: {self.metrics.intent_confidence:.2%}

## 检索质量
- 精确率: {self.metrics.retrieval_precision:.2%}
- 召回率: {self.metrics.retrieval_recall:.2%}
- MRR: {self.metrics.retrieval_mrr:.4f}

## 回答质量
- 相关性: {self.metrics.response_relevance:.2%}
- 完整性: {self.metrics.response_completeness:.2%}
- 正确性: {self.metrics.response_correctness:.2%}

## 用户体验
- 平均响应时间: {self.metrics.avg_response_time:.2f}s
- 用户满意度: {self.metrics.user_satisfaction:.2%}
- 对话成功率: {self.metrics.conversation_success_rate:.2%}

## 业务指标
- 自助解决率: {self.metrics.self_service_resolution_rate:.2%}
- 工单创建率: {self.metrics.ticket_creation_rate:.2%}
- 人工转接率: {self.metrics.human_escalation_rate:.2%}
"""
```

### 5.2 优化策略

```python
"""优化策略实现"""

class RAGOptimizer:
    """RAG 优化器"""
    
    def __init__(self, rag_service):
        self.rag_service = rag_service
    
    def optimize_chunk_size(self, documents: List[str], queries: List[str]) -> int:
        """
        优化分块大小
        
        策略：
        1. 测试不同 chunk_size（200, 300, 500, 800, 1000）
        2. 评估每种大小的检索质量
        3. 选择最优大小
        """
        best_size = 500
        best_score = 0
        
        for size in [200, 300, 500, 800, 1000]:
            # 重新分块
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=size,
                chunk_overlap=size // 10
            )
            
            # 评估检索质量
            score = self._evaluate_chunk_size(splitter, documents, queries)
            
            if score > best_score:
                best_score = score
                best_size = size
        
        return best_size
    
    def add_query_expansion(self, query: str) -> List[str]:
        """
        查询扩展
        
        使用 LLM 生成同义查询
        """
        expansion_prompt = f"""为以下查询生成3个同义表达方式：
查询：{query}

请用JSON格式返回：{{"expansions": ["改写1", "改写2", "改写3"]}}"""
        
        # 调用 LLM 生成扩展
        expansions = [query]  # 包含原始查询
        # ... LLM 调用
        
        return expansions
    
    def hybrid_search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """
        混合搜索：向量搜索 + 关键词搜索
        """
        # 向量搜索
        vector_results = self.rag_service.search(query, top_k=top_k * 2)
        
        # 关键词搜索（BM25）
        keyword_results = self._bm25_search(query, top_k=top_k * 2)
        
        # 融合排序（RRF - Reciprocal Rank Fusion）
        fused_results = self._reciprocal_rank_fusion(
            vector_results, keyword_results, top_k
        )
        
        return fused_results
    
    def _reciprocal_rank_fusion(
        self,
        list1: List[SearchResult],
        list2: List[SearchResult],
        top_k: int,
        k: int = 60
    ) -> List[SearchResult]:
        """RRF 融合排序"""
        scores = {}
        
        # 计算 RRF 分数
        for rank, result in enumerate(list1):
            doc_id = result.document_id
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
            scores[f"{doc_id}_obj"] = result
        
        for rank, result in enumerate(list2):
            doc_id = result.document_id
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
            scores[f"{doc_id}_obj"] = result
        
        # 排序并返回
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        return [scores[f"{doc_id}_obj"] for doc_id in sorted_ids[:top_k] if f"{doc_id}_obj" in scores]


class PromptOptimizer:
    """Prompt 优化器"""
    
    def __init__(self):
        self.templates = {}
    
    def optimize_system_prompt(self, eval_results: Dict) -> str:
        """
        基于评估结果优化系统 Prompt
        
        策略：
        1. 分析失败案例
        2. 识别 Prompt 缺陷
        3. 迭代优化
        """
        base_prompt = """你是企业智能客服助手..."""
        
        # 根据评估结果添加优化
        if eval_results.get("hallucination_rate", 0) > 0.1:
            base_prompt += "\n【重要】回答必须基于检索结果，禁止编造信息。"
        
        if eval_results.get("unclear_rate", 0) > 0.1:
            base_prompt += "\n【重要】回答要简洁明了，避免冗长。"
        
        return base_prompt
    
    def few_shot_examples(self, intent: str) -> List[Dict]:
        """
        获取 Few-shot 示例
        """
        examples = {
            "technical_support": [
                {
                    "input": "系统登录失败",
                    "output": "我来帮您排查登录问题。请确认：1. 账号密码是否正确 2. 网络连接是否正常 3. 是否开启了大写锁定"
                }
            ],
            "billing": [
                {
                    "input": "如何申请发票",
                    "output": "您可以在「账户设置」-「发票管理」中申请。需要提供：1. 发票抬头 2. 税号 3. 邮箱地址"
                }
            ]
        }
        return examples.get(intent, [])
```

---

## 六、部署配置

### 6.1 Docker 配置

#### backend/Dockerfile

```dockerfile
# 使用 Python 3.11 官方镜像
FROM python:3.11-slim as builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 生产镜像
FROM python:3.11-slim

WORKDIR /app

# 复制依赖
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用代码
COPY app/ ./app/

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### backend/requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
langchain==0.1.0
langchain-openai==0.0.5
langchain-community==0.0.10
chromadb==0.4.18
qdrant-client==1.7.0
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
httpx==0.26.0
python-multipart==0.0.6
```

#### frontend/Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 6.2 Docker Compose

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: cs_postgres
    environment:
      POSTGRES_USER: cs_user
      POSTGRES_PASSWORD: cs_password
      POSTGRES_DB: customer_service
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cs_user -d customer_service"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: cs_redis
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ChromaDB 向量数据库
  chromadb:
    image: chromadb/chroma:latest
    container_name: cs_chromadb
    volumes:
      - chroma_data:/chroma/chroma
    ports:
      - "8001:8000"
    environment:
      - IS_PERSISTENT=TRUE
      - PERSIST_DIRECTORY=/chroma/chroma

  # Qdrant 向量数据库（可选）
  qdrant:
    image: qdrant/qdrant:latest
    container_name: cs_qdrant
    volumes:
      - qdrant_data:/qdrant/storage
    ports:
      - "6333:6333"
    profiles:
      - qdrant

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cs_backend
    environment:
      - DATABASE_URL=postgresql://cs_user:cs_password@postgres:5432/customer_service
      - REDIS_URL=redis://redis:6379/0
      - CHROMADB_PATH=/app/chroma_db
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LLM_MODEL=${LLM_MODEL:-gpt-4o-mini}
      - DEBUG=false
    volumes:
      - chroma_data:/app/chroma_db
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      chromadb:
        condition: service_started
    restart: unless-stopped

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cs_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: cs_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  chroma_data:
  qdrant_data:
```

### 6.3 Nginx 配置

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=chat:10m rate=5r/s;

    # 上游服务器
    upstream backend {
        server backend:8000;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    # HTTP 服务器
    server {
        listen 80;
        server_name _;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # 前端静态资源
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 缓存
            expires 1h;
            add_header Cache-Control "public, immutable";
        }

        # API 代理
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            # 缓冲区
            proxy_buffering off;
            proxy_cache off;
        }

        # WebSocket 支持（流式响应）
        location /api/v1/chat/send/stream {
            limit_req zone=chat burst=10 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_read_timeout 86400;
        }

        # 健康检查
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }
    }
}
```

### 6.4 部署脚本

#### deploy.sh

```bash
#!/bin/bash

# 企业智能客服系统部署脚本

set -e

echo "🚀 开始部署企业智能客服系统..."

# 检查环境
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 错误: 请设置 OPENAI_API_KEY 环境变量"
    exit 1
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data/postgres data/redis data/chroma data/qdrant ssl

# 生成 SSL 证书（生产环境请使用正式证书）
if [ ! -f ssl/cert.pem ]; then
    echo "🔐 生成自签名 SSL 证书..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=Company/CN=localhost"
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 构建并启动服务
echo "🔨 构建 Docker 镜像..."
docker-compose build

echo "🟢 启动服务..."
docker-compose up -d

# 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 10

# 健康检查
echo "🏥 执行健康检查..."
if curl -s http://localhost/health | grep -q "healthy"; then
    echo "✅ 服务部署成功！"
    echo ""
    echo "📋 服务访问地址："
    echo "   - 前端: http://localhost"
    echo "   - API: http://localhost/api"
    echo "   - 健康检查: http://localhost/health"
else
    echo "❌ 服务启动失败，请检查日志"
    docker-compose logs
    exit 1
fi

echo ""
echo "📝 常用命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo "   更新部署: ./deploy.sh"
```

---

## 七、面试考点

### 7.1 系统设计

**Q1: 如何设计一个支持 10k QPS 的智能客服系统？**

```
参考答案：

1. 负载均衡层
   - L4/L7 负载均衡（Nginx/HAProxy）
   - 多地域部署 + DNS 轮询
   - CDN 加速静态资源

2. 服务层扩展
   - 无状态设计，支持水平扩展
   - 容器化部署（K8s），自动扩缩容
   - 服务拆分：对话服务、RAG服务、工单服务独立部署

3. 缓存策略
   - Redis Cluster 缓存会话和热点数据
   - 本地缓存（Caffeine）缓存意图分类结果
   - CDN 缓存知识库文档

4. 数据库优化
   - 读写分离，主从复制
   - 分库分表（按用户ID哈希）
   - 连接池优化

5. 异步处理
   - 消息队列（Kafka/RabbitMQ）处理非实时任务
   - 工单创建、日志记录异步化

6. LLM 优化
   - 模型缓存（相同输入直接返回）
   - 批处理请求
   - 降级策略（模型不可用时返回预设回复）
```

**Q2: 如何保证多轮对话的上下文一致性？**

```
参考答案：

1. 会话状态存储
   - Redis：存储活跃会话，设置TTL
   - PostgreSQL：持久化会话历史
   - 本地缓存：最近访问的会话

2. 上下文管理策略
   - 滑动窗口：保留最近N轮对话
   - Token 限制：控制上下文长度
   - 摘要压缩：长对话生成摘要

3. 并发控制
   - 会话锁：同一会话串行处理
   - 乐观锁：版本号控制
   - 分布式锁：Redis RedLock

4. 容错机制
   - 会话恢复：从数据库重建上下文
   - 降级处理：上下文丢失时主动询问
```

### 7.2 RAG 优化

**Q3: 如何提升 RAG 检索的准确率？**

```
参考答案：

1. 文档预处理优化
   - 语义分块：按主题而非固定长度分块
   - 重叠策略：chunk_overlap 避免信息割裂
   - 元数据丰富：标题、分类、标签

2. 查询优化
   - 查询扩展：生成同义表达
   - 查询重写：将口语化转为标准表述
   - 意图识别：不同意图使用不同检索策略

3. 检索策略
   - 混合检索：向量 + 关键词（BM25）
   - 多路召回：不同策略并行检索
   - 重排序：Cross-Encoder 精排

4. 向量模型优化
   - 领域微调：使用客服数据微调 Embedding
   - 多向量表示：ColBERT 细粒度匹配
   - 量化压缩：降低存储和计算成本

5. 反馈机制
   - 点击反馈：记录用户点击的文档
   - 满意度反馈：根据评分调整权重
   - A/B 测试：对比不同策略效果
```

**Q4: 如何处理 RAG 中的幻觉问题？**

```
参考答案：

1. 检索增强
   - 提高 top_k 数量，提供更多上下文
   - 相似度阈值过滤，排除低质量结果
   - 多源验证，交叉确认信息

2. Prompt 工程
   - 明确指令："仅基于提供的上下文回答"
   - Few-shot 示例：展示正确回答范式
   - 约束输出：要求标注信息来源

3. 后处理验证
   - 事实检查：提取关键事实验证
   - 一致性检查：多轮回答逻辑一致
   - 置信度评分：低置信度时提示用户

4. 兜底策略
   - 检索失败时主动告知
   - 复杂问题转人工
   - 不确定时回答"我不知道"
```

### 7.3 多轮对话

**Q5: 如何实现意图切换的检测和处理？**

```
参考答案：

1. 意图漂移检测
   - 对比当前与历史意图的相似度
   - 使用分类器判断是否为同一话题
   - 设置置信度阈值

2. 话题跟踪
   - 维护话题栈，支持嵌套话题
   - 实体共指消解
   - 上下文继承与重置

3. 处理策略
   - 确认式切换："您是想询问XX问题吗？"
   - 渐进式引导：保留部分上下文
   - 完全切换：清空上下文重新开始

4. 实现代码示例：

class TopicManager:
    def __init__(self):
        self.current_topic = None
        self.topic_stack = []
        self.confidence_threshold = 0.7
    
    def detect_topic_shift(self, current_intent, history):
        if not self.current_topic:
            return False
        
        # 计算意图相似度
        similarity = self._intent_similarity(
            current_intent, 
            self.current_topic
        )
        
        return similarity < self.confidence_threshold
    
    def handle_topic_shift(self, new_intent, entities):
        # 保存当前话题
        self.topic_stack.append({
            "intent": self.current_topic,
            "entities": self.current_entities
        })
        
        # 切换新话题
        self.current_topic = new_intent
        self.current_entities = entities
        
        # 生成确认消息
        return f"好的，我来帮您处理{new_intent}相关问题"
```

**Q6: Function Calling 失败时如何处理？**

```
参考答案：

1. 失败类型识别
   - 参数错误：缺少必填参数或格式错误
   - 调用异常：服务不可用或超时
   - 业务错误：业务规则校验失败

2. 重试策略
   - 指数退避重试
   - 降级到备用服务
   - 异步重试 + 回调通知

3. 用户反馈
   - 参数错误：引导用户补充信息
   - 服务异常：告知用户稍后重试
   - 业务错误：解释原因并提供替代方案

4. 代码示例：

async def execute_with_fallback(tool_name, tool_args, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await execute_tool(tool_name, tool_args)
            if result.get("success"):
                return result
        except ToolParameterError as e:
            # 参数错误，不重试
            return {
                "success": False,
                "error": "parameter_error",
                "message": f"请提供{e.missing_param}"
            }
        except ToolExecutionError as e:
            if attempt == max_retries - 1:
                # 最后一次重试失败
                return {
                    "success": False,
                    "error": "execution_failed",
                    "message": "服务暂时不可用，请稍后重试"
                }
            await asyncio.sleep(2 ** attempt)  # 指数退避
    
    return {"success": False, "error": "max_retries_exceeded"}
```

---

## 八、扩展阅读

### 8.1 相关技术文档

- [LangChain 官方文档](https://python.langchain.com/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [ChromaDB 文档](https://docs.trychroma.com/)
- [Qdrant 文档](https://qdrant.tech/documentation/)

### 8.2 推荐阅读

- 《Building LLM Applications》
- 《Designing Machine Learning Systems》
- RAG Survey Papers (2023-2024)

---

## 九、课后练习

1. **功能扩展**
   - 实现用户满意度评分功能
   - 添加对话导出功能
   - 实现多语言支持

2. **性能优化**
   - 实现对话历史压缩
   - 添加模型响应缓存
   - 优化向量检索速度

3. **工程实践**
   - 添加完整的单元测试
   - 实现 CI/CD 流水线
   - 添加监控和告警

4. **高级功能**
   - 实现语音输入输出
   - 添加图片理解能力
   - 实现知识库自动更新

---

**项目完整代码地址：** [GitHub Repository]

**在线演示：** [Demo Link]

**技术交流：** 欢迎提交 Issue 和 PR
