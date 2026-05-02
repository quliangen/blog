---
title: 18-Agent 性能优化
description: Token 消耗优化，响应延迟优化，并发控制，缓存策略，完整实战代码，面试考点
---

# 18-Agent 性能优化

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级开发能力 | ✅ 性能/安全/成本 |
| 工程化能力 | ✅ 监控/测试/部署 |
| 项目交付能力 | ✅ 完整项目实战 |
| 成本控制意识 | ✅ Token 优化策略 |
| 高并发设计 | ✅ 并发控制与限流 |

## 学习目标

学完本节，你将能够：
- 掌握 Token 消耗优化的核心策略，降低 30%-50% API 成本
- 优化 Agent 响应延迟，实现秒级响应
- 设计合理的并发控制机制，避免服务过载
- 实现多级缓存策略，提升响应速度
- 构建生产级性能监控体系

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 了解异步编程基础（async/await）
- 熟悉 Redis 或内存缓存

## 核心概念

### 1. Token 消耗优化

#### 1.1 Token 消耗构成分析

```
总 Token = 系统提示词 Token + 历史消息 Token + 输入 Token + 输出 Token
```

| 组件 | 占比 | 优化潜力 |
|-----|------|---------|
| 系统提示词 | 10-20% | 精简提示词 |
| 历史消息 | 30-50% | 消息截断/摘要 |
| 输入内容 | 20-30% | 预处理/压缩 |
| 输出内容 | 20-40% | 限制 max_tokens |

#### 1.2 提示词压缩技术

```python
# 优化前：冗长的系统提示词
SYSTEM_PROMPT_LONG = """
你是一个专业的客服助手，你的职责是帮助用户解决各种问题。
你需要保持礼貌、专业、耐心的态度。
你需要理解用户的需求并提供准确的回答。
如果不知道答案，请诚实告知。
...（500+ tokens）
"""

# 优化后：精简的系统提示词
SYSTEM_PROMPT_SHORT = "专业客服助手：礼貌、准确、诚实。不确定时告知用户。"
# Token 节省：约 80%
```

#### 1.3 动态上下文管理

```python
class TokenBudgetManager:
    """Token 预算管理器"""
    
    def __init__(self, max_tokens: int = 4000):
        self.max_tokens = max_tokens
        self.system_tokens = 0
        self.history_tokens = 0
        self.input_tokens = 0
        self.reserved_output = 500  # 预留输出空间
    
    def calculate_available(self) -> int:
        """计算可用的上下文空间"""
        return self.max_tokens - self.system_tokens - self.reserved_output
    
    def trim_history(self, messages: List[Dict], max_history: int = 10) -> List[Dict]:
        """智能截断历史消息"""
        if len(messages) <= max_history:
            return messages
        
        # 保留系统消息和最近的 N 条消息
        system_msgs = [m for m in messages if m.get("role") == "system"]
        other_msgs = [m for m in messages if m.get("role") != "system"]
        
        # 保留最近的 max_history 条
        recent_msgs = other_msgs[-max_history:]
        
        # 如果消息过多，对旧消息进行摘要
        if len(other_msgs) > max_history:
            old_msgs = other_msgs[:-max_history]
            summary = self._summarize_messages(old_msgs)
            if summary:
                system_msgs.append({
                    "role": "system",
                    "content": f"历史对话摘要：{summary}"
                })
        
        return system_msgs + recent_msgs
    
    def _summarize_messages(self, messages: List[Dict]) -> str:
        """对历史消息进行摘要"""
        # 实际实现中调用轻量级模型进行摘要
        content = " | ".join([m.get("content", "")[:50] for m in messages])
        return content[:200]  # 限制摘要长度
```

#### 1.4 响应 Token 控制

```python
class ResponseOptimizer:
    """响应优化器"""
    
    def __init__(self):
        self.token_estimator = TokenEstimator()
    
    def optimize_max_tokens(self, query_complexity: str) -> int:
        """根据查询复杂度动态调整 max_tokens"""
        complexity_map = {
            "simple": 150,      # 简单问答
            "normal": 500,      # 标准对话
            "complex": 1500,    # 复杂分析
            "creative": 2000,   # 创意生成
        }
        return complexity_map.get(query_complexity, 500)
    
    def add_token_limit_hint(self, prompt: str, max_tokens: int) -> str:
        """在提示词中添加 Token 限制提示"""
        return f"{prompt}\n\n[请控制在 {max_tokens} tokens 以内回答]"
```

### 2. 响应延迟优化

#### 2.1 延迟来源分析

```
总延迟 = 网络延迟 + 排队延迟 + 处理延迟 + 生成延迟

网络延迟：50-200ms（取决于地理位置）
排队延迟：0-5000ms（取决于服务负载）
处理延迟：100-500ms（输入处理）
生成延迟：1000-10000ms（模型生成，与输出长度成正比）
```

#### 2.2 流式响应优化

```python
import asyncio
from typing import AsyncIterator, Callable

class StreamingOptimizer:
    """流式响应优化器"""
    
    def __init__(self):
        self.chunk_buffer = []
        self.buffer_size = 10  # 字符缓冲大小
        self.min_chunk_delay = 0.01  # 最小块延迟（秒）
    
    async def optimize_stream(
        self, 
        raw_stream: AsyncIterator[str],
        on_token: Callable[[str], None]
    ) -> str:
        """优化流式输出，减少卡顿感"""
        full_content = []
        buffer = ""
        last_send_time = asyncio.get_event_loop().time()
        
        async for chunk in raw_stream:
            buffer += chunk
            current_time = asyncio.get_event_loop().time()
            
            # 缓冲策略：积累一定字符或超过时间阈值
            should_send = (
                len(buffer) >= self.buffer_size or
                (current_time - last_send_time) > self.min_chunk_delay or
                chunk.endswith((".", "!", "?", "\n"))  # 句子结束
            )
            
            if should_send:
                on_token(buffer)
                full_content.append(buffer)
                buffer = ""
                last_send_time = current_time
        
        # 发送剩余缓冲
        if buffer:
            on_token(buffer)
            full_content.append(buffer)
        
        return "".join(full_content)
    
    async def smart_debounce_stream(
        self,
        raw_stream: AsyncIterator[str],
        debounce_ms: int = 50
    ) -> AsyncIterator[str]:
        """智能防抖流式输出"""
        buffer = ""
        last_yield = asyncio.get_event_loop().time()
        
        async for chunk in raw_stream:
            buffer += chunk
            current_time = asyncio.get_event_loop().time()
            
            if (current_time - last_yield) * 1000 >= debounce_ms:
                yield buffer
                buffer = ""
                last_yield = current_time
        
        if buffer:
            yield buffer
```

#### 2.3 首字节时间（TTFB）优化

```python
class TTFBOptimizer:
    """首字节时间优化器"""
    
    def __init__(self):
        self.warm_pool = ModelWarmPool()
        self.connection_pool = ConnectionPool()
    
    async def prewarm_model(self, model: str):
        """模型预热，减少冷启动延迟"""
        # 发送一个轻量级请求保持连接活跃
        await self.warm_pool.send_heartbeat(model)
    
    async def optimize_request(self, request: Dict) -> Dict:
        """优化请求以减少 TTFB"""
        optimized = request.copy()
        
        # 1. 使用更小的 max_tokens 先获取首字节
        optimized["max_tokens"] = min(request.get("max_tokens", 500), 100)
        
        # 2. 启用流式输出
        optimized["stream"] = True
        
        # 3. 设置超时
        optimized["timeout"] = 30
        
        return optimized
    
    def get_connection_hint(self, region: str) -> Dict:
        """获取最优连接配置"""
        region_endpoints = {
            "cn": "https://api.cn.openai.com",
            "us-west": "https://api.openai.com",
            "us-east": "https://api-east.openai.com",
        }
        return {
            "base_url": region_endpoints.get(region, region_endpoints["us-west"]),
            "keep_alive": True,
        }
```

#### 2.4 预加载与预测

```python
class PredictiveLoader:
    """预测性加载器"""
    
    def __init__(self):
        self.user_patterns = {}  # 用户行为模式
        self.preload_cache = {}
    
    def predict_next_query(self, user_id: str, current_query: str) -> List[str]:
        """预测用户下一个可能的问题"""
        # 基于历史行为模式预测
        patterns = self.user_patterns.get(user_id, [])
        
        # 简单的相似度匹配
        predictions = []
        for pattern in patterns:
            if self._similarity(current_query, pattern["trigger"]) > 0.7:
                predictions.extend(pattern["follow_ups"])
        
        return predictions[:3]  # 返回 Top 3 预测
    
    async def preload_context(self, user_id: str, query: str):
        """预加载可能的上下文"""
        predictions = self.predict_next_query(user_id, query)
        
        for prediction in predictions:
            # 异步预加载可能的回答
            asyncio.create_task(self._preload_response(prediction))
    
    async def _preload_response(self, query: str):
        """后台预加载响应"""
        # 实际实现中调用 LLM 预生成响应
        pass
```

### 3. 并发控制

#### 3.1 限流策略

```python
import asyncio
from dataclasses import dataclass
from typing import Dict, Optional
import time

@dataclass
class RateLimitConfig:
    """限流配置"""
    requests_per_minute: int = 60
    requests_per_second: float = 1.0
    tokens_per_minute: int = 100000
    concurrent_requests: int = 10

class TokenBucket:
    """令牌桶限流器"""
    
    def __init__(self, rate: float, capacity: float):
        self.rate = rate  # 每秒产生令牌数
        self.capacity = capacity  # 桶容量
        self.tokens = capacity  # 当前令牌数
        self.last_update = time.time()
        self._lock = asyncio.Lock()
    
    async def acquire(self, tokens: float = 1.0) -> bool:
        """尝试获取令牌"""
        async with self._lock:
            now = time.time()
            elapsed = now - self.last_update
            
            # 添加新产生的令牌
            self.tokens = min(
                self.capacity,
                self.tokens + elapsed * self.rate
            )
            self.last_update = now
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
    
    async def wait_and_acquire(self, tokens: float = 1.0, timeout: float = 60.0) -> bool:
        """等待并获取令牌"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if await self.acquire(tokens):
                return True
            await asyncio.sleep(0.1)
        return False

class AdaptiveRateLimiter:
    """自适应限流器"""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.request_bucket = TokenBucket(
            rate=config.requests_per_second,
            capacity=config.concurrent_requests
        )
        self.token_bucket = TokenBucket(
            rate=config.tokens_per_minute / 60,
            capacity=config.tokens_per_minute
        )
        self.error_count = 0
        self.success_count = 0
    
    async def acquire(self, estimated_tokens: int = 1000) -> bool:
        """获取执行许可"""
        # 根据错误率动态调整
        if self.error_count > 5:
            # 增加等待时间
            await asyncio.sleep(1)
        
        req_ok = await self.request_bucket.wait_and_acquire()
        token_ok = await self.token_bucket.wait_and_acquire(estimated_tokens / 1000)
        
        return req_ok and token_ok
    
    def report_success(self):
        """报告成功"""
        self.success_count += 1
        if self.success_count > 10:
            self.error_count = max(0, self.error_count - 1)
    
    def report_error(self):
        """报告错误"""
        self.error_count += 1
```

#### 3.2 并发执行控制

```python
class ConcurrentController:
    """并发控制器"""
    
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.task_queue = asyncio.Queue()
        self.results = {}
    
    async def execute_with_control(
        self,
        task_id: str,
        coro,
        priority: int = 5
    ) -> Any:
        """受控执行协程"""
        async with self.semaphore:
            try:
                self.active_tasks[task_id] = asyncio.current_task()
                result = await coro
                self.results[task_id] = {"status": "success", "result": result}
                return result
            except Exception as e:
                self.results[task_id] = {"status": "error", "error": str(e)}
                raise
            finally:
                if task_id in self.active_tasks:
                    del self.active_tasks[task_id]
    
    async def batch_execute(
        self,
        tasks: Dict[str, Any],
        max_concurrent: int = 5
    ) -> Dict[str, Any]:
        """批量执行任务"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def wrapped_task(task_id: str, coro):
            async with semaphore:
                try:
                    result = await coro
                    return task_id, {"status": "success", "result": result}
                except Exception as e:
                    return task_id, {"status": "error", "error": str(e)}
        
        # 创建所有任务
        task_list = [
            wrapped_task(tid, coro) 
            for tid, coro in tasks.items()
        ]
        
        # 等待所有完成
        results = await asyncio.gather(*task_list, return_exceptions=True)
        
        return {tid: result for tid, result in results}
    
    def get_status(self) -> Dict:
        """获取当前状态"""
        return {
            "active_count": len(self.active_tasks),
            "queue_size": self.task_queue.qsize(),
            "active_tasks": list(self.active_tasks.keys()),
        }
```

#### 3.3 熔断与降级

```python
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"      # 正常
    OPEN = "open"          # 熔断
    HALF_OPEN = "half_open"  # 半开

class CircuitBreaker:
    """熔断器"""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self._lock = asyncio.Lock()
    
    async def call(self, coro, fallback=None):
        """带熔断保护的调用"""
        async with self._lock:
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                else:
                    if fallback:
                        return await fallback
                    raise Exception("Circuit breaker is OPEN")
            
            if self.state == CircuitState.HALF_OPEN:
                if self.success_count >= self.half_open_max_calls:
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
        
        try:
            result = await coro
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure()
            raise
    
    async def _on_success(self):
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
            else:
                self.failure_count = 0
    
    async def _on_failure(self):
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
            elif self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
    
    def _should_attempt_reset(self) -> bool:
        if self.last_failure_time is None:
            return True
        return (time.time() - self.last_failure_time) >= self.recovery_timeout

class FallbackManager:
    """降级管理器"""
    
    def __init__(self):
        self.fallback_strategies = {
            "cache": self._cache_fallback,
            "simple_model": self._simple_model_fallback,
            "static_response": self._static_response_fallback,
        }
    
    async def get_fallback(self, strategy: str, query: str, context: Dict = None):
        """获取降级响应"""
        handler = self.fallback_strategies.get(strategy)
        if handler:
            return await handler(query, context)
        return "服务暂时不可用，请稍后重试"
    
    async def _cache_fallback(self, query: str, context: Dict):
        """从缓存获取"""
        # 实现缓存查询逻辑
        return "[缓存响应] " + query
    
    async def _simple_model_fallback(self, query: str, context: Dict):
        """使用轻量级模型"""
        # 调用轻量级模型（如本地小模型）
        return "[简化响应] " + query
    
    async def _static_response_fallback(self, query: str, context: Dict):
        """返回静态响应"""
        return "感谢您的提问，我们的服务正在维护中，请稍后再试。"
```

### 4. 缓存策略

#### 4.1 多级缓存架构

```
┌─────────────────────────────────────────┐
│           客户端缓存 (Browser)           │
│         LocalStorage / IndexedDB        │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│           CDN 边缘缓存                   │
│         静态响应 / 常见查询               │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│           应用层缓存 (Redis)             │
│      语义缓存 / 会话缓存 / 结果缓存        │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│           本地内存缓存                   │
│      LRU Cache / 热点数据缓存            │
└─────────────────────────────────────────┘
```

#### 4.2 语义缓存实现

```python
import hashlib
import json
from typing import Optional, List
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    EMBEDDING_AVAILABLE = True
except ImportError:
    EMBEDDING_AVAILABLE = False

class SemanticCache:
    """语义缓存 - 基于向量相似度的缓存"""
    
    def __init__(
        self,
        similarity_threshold: float = 0.95,
        embedding_model: str = "all-MiniLM-L6-v2"
    ):
        self.similarity_threshold = similarity_threshold
        self.cache = {}  # query_hash -> {embedding, response, timestamp}
        self.access_count = {}
        
        if EMBEDDING_AVAILABLE:
            self.embedding_model = SentenceTransformer(embedding_model)
        else:
            self.embedding_model = None
    
    def _get_embedding(self, text: str) -> Optional[np.ndarray]:
        """获取文本嵌入向量"""
        if self.embedding_model is None:
            return None
        return self.embedding_model.encode(text)
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """计算余弦相似度"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    async def get(self, query: str) -> Optional[str]:
        """获取缓存响应"""
        if self.embedding_model is None:
            return None
        
        query_embedding = self._get_embedding(query)
        
        # 查找最相似的缓存
        best_match = None
        best_similarity = 0
        
        for cache_key, cache_entry in self.cache.items():
            similarity = self._cosine_similarity(
                query_embedding,
                cache_entry["embedding"]
            )
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = cache_entry
        
        if best_similarity >= self.similarity_threshold:
            # 更新访问计数
            self.access_count[best_match.get("key")] = \
                self.access_count.get(best_match.get("key"), 0) + 1
            return best_match["response"]
        
        return None
    
    async def set(self, query: str, response: str, ttl: int = 3600):
        """设置缓存"""
        if self.embedding_model is None:
            return
        
        query_hash = hashlib.md5(query.encode()).hexdigest()
        embedding = self._get_embedding(query)
        
        self.cache[query_hash] = {
            "key": query_hash,
            "query": query,
            "embedding": embedding,
            "response": response,
            "timestamp": time.time(),
            "ttl": ttl
        }
    
    def cleanup_expired(self):
        """清理过期缓存"""
        current_time = time.time()
        expired_keys = [
            k for k, v in self.cache.items()
            if current_time - v["timestamp"] > v["ttl"]
        ]
        for key in expired_keys:
            del self.cache[key]
            self.access_count.pop(key, None)
    
    def get_stats(self) -> Dict:
        """获取缓存统计"""
        total_entries = len(self.cache)
        total_accesses = sum(self.access_count.values())
        
        return {
            "total_entries": total_entries,
            "total_accesses": total_accesses,
            "hit_rate": total_accesses / max(total_entries, 1),
        }

class SimpleHashCache:
    """简单哈希缓存 - 精确匹配"""
    
    def __init__(self, max_size: int = 10000):
        self.max_size = max_size
        self.cache = {}
        self.access_order = []
    
    def _normalize_query(self, query: str) -> str:
        """标准化查询"""
        return query.lower().strip()
    
    def _get_key(self, query: str) -> str:
        """生成缓存键"""
        normalized = self._normalize_query(query)
        return hashlib.md5(normalized.encode()).hexdigest()
    
    async def get(self, query: str) -> Optional[str]:
        """获取缓存"""
        key = self._get_key(query)
        if key in self.cache:
            # 更新访问顺序（LRU）
            self.access_order.remove(key)
            self.access_order.append(key)
            return self.cache[key]["response"]
        return None
    
    async def set(self, query: str, response: str, ttl: int = 3600):
        """设置缓存"""
        key = self._get_key(query)
        
        # 淘汰旧缓存
        if len(self.cache) >= self.max_size:
            oldest_key = self.access_order.pop(0)
            del self.cache[oldest_key]
        
        self.cache[key] = {
            "response": response,
            "timestamp": time.time(),
            "ttl": ttl
        }
        self.access_order.append(key)
```

#### 4.3 会话缓存

```python
class SessionCache:
    """会话级缓存"""
    
    def __init__(self, session_ttl: int = 1800):
        self.sessions: Dict[str, Dict] = {}
        self.session_ttl = session_ttl
    
    def _get_session_key(self, user_id: str, session_id: str) -> str:
        """生成会话键"""
        return f"{user_id}:{session_id}"
    
    def get_session(self, user_id: str, session_id: str) -> Optional[Dict]:
        """获取会话数据"""
        key = self._get_session_key(user_id, session_id)
        session = self.sessions.get(key)
        
        if session:
            # 检查是否过期
            if time.time() - session["last_access"] > self.session_ttl:
                del self.sessions[key]
                return None
            
            session["last_access"] = time.time()
            return session
        
        return None
    
    def create_session(self, user_id: str, session_id: str) -> Dict:
        """创建新会话"""
        key = self._get_session_key(user_id, session_id)
        session = {
            "user_id": user_id,
            "session_id": session_id,
            "created_at": time.time(),
            "last_access": time.time(),
            "context": {},
            "message_history": [],
            "cache": {}
        }
        self.sessions[key] = session
        return session
    
    def add_to_history(self, user_id: str, session_id: str, message: Dict):
        """添加消息到历史"""
        session = self.get_session(user_id, session_id)
        if session is None:
            session = self.create_session(user_id, session_id)
        
        session["message_history"].append({
            **message,
            "timestamp": time.time()
        })
        
        # 限制历史长度
        max_history = 50
        if len(session["message_history"]) > max_history:
            session["message_history"] = session["message_history"][-max_history:]
    
    def get_context_for_prompt(self, user_id: str, session_id: str) -> List[Dict]:
        """获取用于提示词的上下文"""
        session = self.get_session(user_id, session_id)
        if session:
            return session["message_history"][-10:]  # 最近10条
        return []
```

#### 4.4 缓存一致性管理

```python
class CacheManager:
    """缓存管理器 - 统一管理多级缓存"""
    
    def __init__(self):
        self.l1_cache = SimpleHashCache(max_size=1000)  # 内存
        self.l2_cache = SemanticCache()  # 语义缓存
        self.l3_cache = None  # Redis（可选）
        self.session_cache = SessionCache()
    
    async def get(self, query: str, user_id: str = None, session_id: str = None) -> Optional[str]:
        """多级缓存查询"""
        
        # L1: 精确匹配
        result = await self.l1_cache.get(query)
        if result:
            return result
        
        # L2: 语义匹配
        result = await self.l2_cache.get(query)
        if result:
            # 回填 L1
            await self.l1_cache.set(query, result)
            return result
        
        # L3: Redis（如果配置）
        if self.l3_cache:
            result = await self._get_from_redis(query)
            if result:
                await self.l1_cache.set(query, result)
                return result
        
        return None
    
    async def set(
        self, 
        query: str, 
        response: str, 
        cache_level: str = "all",
        ttl: int = 3600
    ):
        """设置多级缓存"""
        
        if cache_level in ("all", "l1"):
            await self.l1_cache.set(query, response, ttl)
        
        if cache_level in ("all", "l2"):
            await self.l2_cache.set(query, response, ttl)
        
        if cache_level in ("all", "l3") and self.l3_cache:
            await self._set_to_redis(query, response, ttl)
    
    async def invalidate(self, pattern: str = None):
        """使缓存失效"""
        if pattern is None:
            # 清空所有缓存
            self.l1_cache.cache.clear()
            self.l2_cache.cache.clear()
        else:
            # 按模式清除
            keys_to_remove = [
                k for k in self.l1_cache.cache.keys()
                if pattern in k
            ]
            for key in keys_to_remove:
                del self.l1_cache.cache[key]
    
    def get_stats(self) -> Dict:
        """获取缓存统计"""
        return {
            "l1_memory": len(self.l1_cache.cache),
            "l2_semantic": len(self.l2_cache.cache),
            "sessions": len(self.session_cache.sessions),
        }
```

## 动手实战

### 完整实战代码：高性能 Agent 服务

```python
#!/usr/bin/env python3
"""
高性能 Agent 服务
集成：Token优化、延迟优化、并发控制、缓存策略
"""

import asyncio
import time
import json
from typing import Dict, List, Optional, AsyncIterator, Any
from dataclasses import dataclass
from enum import Enum
import hashlib
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """Agent 配置"""
    # Token 优化
    max_context_tokens: int = 4000
    system_prompt_tokens: int = 200
    max_history_messages: int = 10
    
    # 延迟优化
    enable_streaming: bool = True
    prewarm_enabled: bool = True
    
    # 并发控制
    max_concurrent_requests: int = 10
    requests_per_minute: int = 60
    
    # 缓存
    cache_enabled: bool = True
    semantic_cache_threshold: float = 0.95
    cache_ttl: int = 3600


class PerformanceAgent:
    """高性能 Agent 实现"""
    
    def __init__(self, config: AgentConfig = None):
        self.config = config or AgentConfig()
        
        # 初始化各组件
        self.token_manager = TokenBudgetManager(self.config.max_context_tokens)
        self.rate_limiter = AdaptiveRateLimiter(
            RateLimitConfig(
                concurrent_requests=self.config.max_concurrent_requests,
                requests_per_minute=self.config.requests_per_minute
            )
        )
        self.cache_manager = CacheManager() if self.config.cache_enabled else None
        self.concurrent_controller = ConcurrentController(
            self.config.max_concurrent_requests
        )
        self.circuit_breaker = CircuitBreaker()
        
        # 性能指标
        self.metrics = {
            "total_requests": 0,
            "cache_hits": 0,
            "total_latency": 0,
            "total_tokens": 0,
        }
    
    async def chat(
        self,
        query: str,
        user_id: str = "anonymous",
        session_id: str = None,
        stream: bool = None
    ) -> Dict[str, Any]:
        """
        高性能对话接口
        
        Args:
            query: 用户查询
            user_id: 用户ID
            session_id: 会话ID
            stream: 是否流式输出
        
        Returns:
            包含响应和性能指标的字典
        """
        start_time = time.time()
        self.metrics["total_requests"] += 1
        
        request_id = hashlib.md5(
            f"{user_id}:{time.time()}".encode()
        ).hexdigest()[:8]
        
        logger.info(f"[{request_id}] 收到请求: {query[:50]}...")
        
        try:
            # 1. 检查缓存
            if self.cache_manager:
                cached_response = await self.cache_manager.get(
                    query, user_id, session_id
                )
                if cached_response:
                    self.metrics["cache_hits"] += 1
                    logger.info(f"[{request_id}] 缓存命中")
                    return {
                        "response": cached_response,
                        "cached": True,
                        "latency_ms": int((time.time() - start_time) * 1000),
                        "request_id": request_id,
                    }
            
            # 2. 限流检查
            estimated_tokens = len(query) * 2  # 粗略估计
            if not await self.rate_limiter.acquire(estimated_tokens):
                return {
                    "error": "Rate limit exceeded",
                    "request_id": request_id,
                }
            
            # 3. 熔断保护执行
            response = await self.circuit_breaker.call(
                coro=self._execute_query(query, user_id, session_id, stream),
                fallback=self._fallback_response(query)
            )
            
            # 4. 更新缓存
            if self.cache_manager and not isinstance(response, dict) or "error" not in response:
                await self.cache_manager.set(query, response)
            
            # 5. 记录指标
            latency = time.time() - start_time
            self.metrics["total_latency"] += latency
            
            result = {
                "response": response,
                "cached": False,
                "latency_ms": int(latency * 1000),
                "request_id": request_id,
            }
            
            logger.info(f"[{request_id}] 请求完成，延迟: {result['latency_ms']}ms")
            return result
            
        except Exception as e:
            logger.error(f"[{request_id}] 请求失败: {str(e)}")
            return {
                "error": str(e),
                "request_id": request_id,
            }
    
    async def _execute_query(
        self,
        query: str,
        user_id: str,
        session_id: str,
        stream: bool
    ) -> str:
        """执行查询（实际调用 LLM）"""
        # 这里应该调用实际的 LLM API
        # 示例实现：
        
        # 1. 准备上下文
        context = self._prepare_context(query, user_id, session_id)
        
        # 2. 优化提示词
        optimized_prompt = self._optimize_prompt(context)
        
        # 3. 调用 LLM（模拟）
        await asyncio.sleep(0.5)  # 模拟网络延迟
        
        response = f"这是优化后的响应：基于 '{query[:30]}...' 的处理结果"
        
        # 4. 更新会话
        if session_id:
            self.cache_manager.session_cache.add_to_history(
                user_id, session_id,
                {"role": "user", "content": query}
            )
            self.cache_manager.session_cache.add_to_history(
                user_id, session_id,
                {"role": "assistant", "content": response}
            )
        
        return response
    
    def _prepare_context(
        self,
        query: str,
        user_id: str,
        session_id: str
    ) -> Dict:
        """准备上下文"""
        context = {
            "query": query,
            "system_prompt": "你是一个高效的AI助手。",
            "history": []
        }
        
        # 获取会话历史
        if session_id and self.cache_manager:
            history = self.cache_manager.session_cache.get_context_for_prompt(
                user_id, session_id
            )
            # 截断历史
            context["history"] = self.token_manager.trim_history(
                history, self.config.max_history_messages
            )
        
        return context
    
    def _optimize_prompt(self, context: Dict) -> str:
        """优化提示词"""
        # 精简系统提示词
        system = context["system_prompt"]
        
        # 构建消息列表
        messages = [{"role": "system", "content": system}]
        messages.extend(context["history"])
        messages.append({"role": "user", "content": context["query"]})
        
        return json.dumps(messages)
    
    async def _fallback_response(self, query: str) -> str:
        """降级响应"""
        return f"[降级响应] 当前服务繁忙，这是简化回答：{query[:20]}..."
    
    async def chat_stream(
        self,
        query: str,
        user_id: str = "anonymous",
        session_id: str = None
    ) -> AsyncIterator[str]:
        """流式对话接口"""
        # 模拟流式输出
        response = await self._execute_query(query, user_id, session_id, True)
        
        # 分块输出
        chunk_size = 5
        for i in range(0, len(response), chunk_size):
            chunk = response[i:i+chunk_size]
            yield chunk
            await asyncio.sleep(0.05)  # 模拟流式延迟
    
    def get_metrics(self) -> Dict:
        """获取性能指标"""
        total = self.metrics["total_requests"]
        return {
            "total_requests": total,
            "cache_hit_rate": (
                self.metrics["cache_hits"] / max(total, 1) * 100
            ),
            "avg_latency_ms": (
                self.metrics["total_latency"] / max(total, 1) * 1000
            ),
            "cache_stats": self.cache_manager.get_stats() if self.cache_manager else {},
        }
    
    async def health_check(self) -> Dict:
        """健康检查"""
        return {
            "status": "healthy",
            "components": {
                "cache": self.cache_manager is not None,
                "rate_limiter": True,
                "circuit_breaker": self.circuit_breaker.state.value,
            },
            "metrics": self.get_metrics(),
        }


# ============ 使用示例 ============

async def main():
    """主函数 - 演示高性能 Agent 使用"""
    
    # 创建配置
    config = AgentConfig(
        max_context_tokens=4000,
        max_concurrent_requests=5,
        cache_enabled=True,
    )
    
    # 初始化 Agent
    agent = PerformanceAgent(config)
    
    print("=" * 50)
    print("高性能 Agent 演示")
    print("=" * 50)
    
    # 示例 1: 普通查询
    print("\n[示例 1] 普通查询")
    result = await agent.chat(
        query="什么是机器学习？",
        user_id="user_001",
        session_id="session_001"
    )
    print(f"响应: {result['response']}")
    print(f"延迟: {result['latency_ms']}ms")
    print(f"缓存: {'命中' if result['cached'] else '未命中'}")
    
    # 示例 2: 相同查询（测试缓存）
    print("\n[示例 2] 相同查询（缓存测试）")
    result = await agent.chat(
        query="什么是机器学习？",
        user_id="user_001",
        session_id="session_001"
    )
    print(f"响应: {result['response']}")
    print(f"延迟: {result['latency_ms']}ms")
    print(f"缓存: {'命中' if result['cached'] else '未命中'}")
    
    # 示例 3: 流式输出
    print("\n[示例 3] 流式输出")
    print("流式响应: ", end="", flush=True)
    async for chunk in agent.chat_stream(
        query="解释深度学习",
        user_id="user_001"
    ):
        print(chunk, end="", flush=True)
    print()
    
    # 示例 4: 并发测试
    print("\n[示例 4] 并发测试")
    queries = [
        "问题 1：什么是AI？",
        "问题 2：什么是ML？",
        "问题 3：什么是DL？",
        "问题 4：什么是NLP？",
        "问题 5：什么是CV？",
    ]
    
    async def run_query(q: str, idx: int):
        result = await agent.chat(q, user_id="user_002")
        return idx, result['latency_ms']
    
    tasks = [run_query(q, i) for i, q in enumerate(queries)]
    results = await asyncio.gather(*tasks)
    
    for idx, latency in results:
        print(f"  查询 {idx+1}: {latency}ms")
    
    # 性能指标
    print("\n" + "=" * 50)
    print("性能指标")
    print("=" * 50)
    metrics = agent.get_metrics()
    print(f"总请求数: {metrics['total_requests']}")
    print(f"缓存命中率: {metrics['cache_hit_rate']:.1f}%")
    print(f"平均延迟: {metrics['avg_latency_ms']:.1f}ms")
    
    # 健康检查
    print("\n" + "=" * 50)
    print("健康检查")
    print("=" * 50)
    health = await agent.health_check()
    print(json.dumps(health, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
```

### 性能测试脚本

```python
#!/usr/bin/env python3
"""
Agent 性能测试脚本
"""

import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
import aiohttp


class AgentPerformanceTester:
    """Agent 性能测试器"""
    
    def __init__(self, agent_endpoint: str = "http://localhost:8000"):
        self.endpoint = agent_endpoint
        self.results = []
    
    async def single_request(self, query: str) -> Dict:
        """发送单个请求"""
        start = time.time()
        
        # 这里替换为实际的 HTTP 请求
        # async with aiohttp.ClientSession() as session:
        #     async with session.post(
        #         f"{self.endpoint}/chat",
        #         json={"query": query}
        #     ) as resp:
        #         data = await resp.json()
        
        # 模拟延迟
        await asyncio.sleep(0.5)
        
        latency = time.time() - start
        return {
            "latency": latency,
            "success": True,
        }
    
    async def load_test(
        self,
        queries: List[str],
        concurrency: int = 10,
        duration: int = 60
    ) -> Dict:
        """负载测试"""
        
        latencies = []
        errors = 0
        start_time = time.time()
        
        semaphore = asyncio.Semaphore(concurrency)
        
        async def bounded_request(query: str):
            async with semaphore:
                try:
                    result = await self.single_request(query)
                    if result["success"]:
                        latencies.append(result["latency"])
                    else:
                        errors += 1
                except Exception as e:
                    errors += 1
        
        # 持续发送请求
        tasks = []
        query_idx = 0
        
        while time.time() - start_time < duration:
            query = queries[query_idx % len(queries)]
            tasks.append(asyncio.create_task(bounded_request(query)))
            query_idx += 1
            
            # 控制生成速度
            await asyncio.sleep(0.1)
        
        # 等待所有完成
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # 计算指标
        total_requests = len(latencies) + errors
        
        return {
            "total_requests": total_requests,
            "successful_requests": len(latencies),
            "failed_requests": errors,
            "success_rate": len(latencies) / max(total_requests, 1) * 100,
            "avg_latency_ms": statistics.mean(latencies) * 1000 if latencies else 0,
            "p50_latency_ms": statistics.median(latencies) * 1000 if latencies else 0,
            "p95_latency_ms": (
                sorted(latencies)[int(len(latencies) * 0.95)] * 1000 
                if latencies else 0
            ),
            "p99_latency_ms": (
                sorted(latencies)[int(len(latencies) * 0.99)] * 1000 
                if latencies else 0
            ),
            "min_latency_ms": min(latencies) * 1000 if latencies else 0,
            "max_latency_ms": max(latencies) * 1000 if latencies else 0,
            "throughput_rps": total_requests / duration,
        }
    
    def print_report(self, results: Dict):
        """打印测试报告"""
        print("\n" + "=" * 60)
        print("性能测试报告")
        print("=" * 60)
        print(f"总请求数: {results['total_requests']}")
        print(f"成功请求: {results['successful_requests']}")
        print(f"失败请求: {results['failed_requests']}")
        print(f"成功率: {results['success_rate']:.2f}%")
        print(f"吞吐量: {results['throughput_rps']:.2f} RPS")
        print("\n延迟指标:")
        print(f"  平均: {results['avg_latency_ms']:.2f}ms")
        print(f"  P50:  {results['p50_latency_ms']:.2f}ms")
        print(f"  P95:  {results['p95_latency_ms']:.2f}ms")
        print(f"  P99:  {results['p99_latency_ms']:.2f}ms")
        print(f"  最小: {results['min_latency_ms']:.2f}ms")
        print(f"  最大: {results['max_latency_ms']:.2f}ms")
        print("=" * 60)


async def run_benchmark():
    """运行基准测试"""
    tester = AgentPerformanceTester()
    
    test_queries = [
        "什么是人工智能？",
        "解释机器学习",
        "深度学习的应用",
        "自然语言处理简介",
        "计算机视觉技术",
    ]
    
    print("开始性能测试...")
    results = await tester.load_test(
        queries=test_queries,
        concurrency=10,
        duration=30
    )
    
    tester.print_report(results)


if __name__ == "__main__":
    asyncio.run(run_benchmark())
```

## 避坑指南

### 常见错误 1: Token 估算不准确

```python
# ❌ 错误：简单按字符数估算
tokens = len(text)  # 严重低估

# ✅ 正确：使用 tiktoken 精确计算
import tiktoken

def count_tokens(text: str, model: str = "gpt-4") -> int:
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))
```

### 常见错误 2: 缓存击穿

```python
# ❌ 错误：缓存失效时大量请求打到后端
if not cache.get(key):
    result = expensive_call()  # 并发时多个请求同时执行
    cache.set(key, result)

# ✅ 正确：使用互斥锁防止缓存击穿
async def get_with_lock(key: str):
    if result := cache.get(key):
        return result
    
    async with cache_locks[key]:  # 每个 key 一个锁
        if result := cache.get(key):  # 双重检查
            return result
        result = await expensive_call()
        cache.set(key, result)
        return result
```

### 常见错误 3: 流式输出缓冲区过小

```python
# ❌ 错误：每个 token 都发送，网络开销大
for token in stream:
    yield token  # 大量小数据包

# ✅ 正确：合理缓冲，平衡延迟和效率
buffer = ""
for token in stream:
    buffer += token
    if len(buffer) >= 10 or token in ".,!?\n":
        yield buffer
        buffer = ""
```

### 常见错误 4: 忽略模型预热

```python
# ❌ 错误：冷启动导致首请求延迟高
@app.on_event("startup")
def startup():
    pass  # 没有预热

# ✅ 正确：启动时预热模型
@app.on_event("startup")
async def startup():
    # 发送轻量级请求预热连接池
    await agent.chat("预热请求", stream=False)
    logger.info("模型预热完成")
```

### 常见错误 5: 限流粒度太粗

```python
# ❌ 错误：全局限流影响所有用户
semaphore = asyncio.Semaphore(10)  # 全局限制

# ✅ 正确：按用户限流 + 全局限流
class MultiLevelLimiter:
    def __init__(self):
        self.global_limiter = TokenBucket(rate=100, capacity=100)
        self.user_limiters = {}  # user_id -> TokenBucket
    
    async def acquire(self, user_id: str):
        # 先检查用户级限流
        user_limiter = self.user_limiters.setdefault(
            user_id, TokenBucket(rate=10, capacity=10)
        )
        if not await user_limiter.acquire():
            raise RateLimitError("User rate limit exceeded")
        
        # 再检查全局限流
        if not await self.global_limiter.acquire():
            raise RateLimitError("Global rate limit exceeded")
```

## 面试考点

### Q1: 如何优化 Agent 的 Token 消耗？

**参考答案：**

Token 优化可以从以下几个层面入手：

1. **提示词优化**：
   - 精简系统提示词，去除冗余描述
   - 使用结构化提示词替代自然语言描述
   - 示例：将 500 token 的提示词压缩到 100 token

2. **上下文管理**：
   - 实现动态上下文截断，只保留最近 N 条消息
   - 对历史消息进行摘要，替代完整历史
   - 使用滑动窗口机制管理对话历史

3. **响应控制**：
   - 根据查询复杂度动态设置 max_tokens
   - 在提示词中明确 Token 限制要求
   - 使用 stop sequences 提前终止生成

4. **缓存策略**：
   - 实现语义缓存，避免重复计算
   - 缓存常见问题的响应
   - 使用近似匹配提高缓存命中率

**实际效果**：通过上述优化，通常可以降低 30%-50% 的 Token 消耗。

### Q2: 如何降低 Agent 的首字节时间（TTFB）？

**参考答案：**

降低 TTFB 的策略：

1. **连接优化**：
   - 使用连接池保持长连接
   - 选择地理位置更近的 API 端点
   - 启用 HTTP/2 减少握手时间

2. **模型预热**：
   - 服务启动时发送预热请求
   - 定期发送心跳请求保持连接活跃
   - 使用 keep-alive 连接

3. **流式输出**：
   - 启用 stream=true 让用户更快看到内容
   - 优化首包发送策略
   - 合理设置缓冲区大小

4. **请求优化**：
   - 减少初始请求的 max_tokens
   - 精简提示词长度
   - 使用更轻量级的模型处理首屏内容

**指标参考**：优化前 TTFB 可能 2-5s，优化后可降至 500ms-1s。

### Q3: 如何设计 Agent 的并发控制机制？

**参考答案：**

并发控制的多层设计：

1. **限流层**：
   - 使用令牌桶算法实现平滑限流
   - 区分用户级和全局级限流
   - 根据 API 限制设置合理的 QPS/TPS

2. **资源管理层**：
   - 使用信号量控制并发数
   - 实现任务队列管理待处理请求
   - 设置超时机制防止资源占用

3. **熔断降级层**：
   - 实现熔断器防止级联故障
   - 准备多级降级策略（缓存->简化模型->静态响应）
   - 自动恢复机制

4. **负载均衡层**：
   - 多模型实例轮询
   - 根据响应时间动态路由
   - 故障实例自动剔除

**关键代码**：
```python
async def controlled_execute(task):
    # 1. 限流检查
    if not await rate_limiter.acquire():
        raise RateLimitError()
    
    # 2. 熔断保护
    async with circuit_breaker:
        # 3. 并发控制
        async with semaphore:
            return await execute(task)
```

### Q4: 语义缓存 vs 精确缓存，如何选择？

**参考答案：**

| 维度 | 精确缓存 | 语义缓存 |
|-----|---------|---------|
| 匹配方式 | 哈希值完全匹配 | 向量相似度匹配 |
| 命中率 | 低（10-30%） | 高（30-60%） |
| 计算成本 | 极低 | 中等（需要 embedding） |
| 存储成本 | 低 | 高（需存储向量） |
| 适用场景 | 固定问答、代码 | 开放对话、咨询 |

**推荐方案**：
- L1 精确缓存：内存中，处理高频精确匹配
- L2 语义缓存：向量数据库，处理相似问题
- L3 分布式缓存：Redis，跨实例共享

**实现要点**：
- 相似度阈值通常设置 0.90-0.95
- 需要定期清理过期缓存
- 监控缓存命中率并调优

### Q5: 如何监控和优化 Agent 性能？

**参考答案：**

**监控指标**：

1. **延迟指标**：
   - P50/P95/P99 响应时间
   - 首字节时间（TTFB）
   - 流式输出间隔时间

2. **成本指标**：
   - Token 消耗量
   - 缓存命中率
   - API 调用成本

3. **质量指标**：
   - 错误率
   - 熔断触发次数
   - 降级频率

4. **资源指标**：
   - 并发数
   - 队列长度
   - 内存/CPU 使用率

**优化策略**：

```python
# 性能监控装饰器
def monitor_performance(func):
    async def wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = await func(*args, **kwargs)
            metrics.record_success(time.time() - start)
            return result
        except Exception as e:
            metrics.record_error(type(e).__name__)
            raise
    return wrapper
```

**告警规则**：
- P99 延迟 > 5s
- 错误率 > 1%
- 缓存命中率 < 20%
- 队列积压 > 100

### Q6: 流式输出如何优化用户体验？

**参考答案：**

流式输出优化策略：

1. **缓冲策略**：
   - 按字符数缓冲（如每 10 个字符发送一次）
   - 按标点符号缓冲（句子结束时发送）
   - 按时间缓冲（每 50ms 发送一次）

2. **渲染优化**：
   - 前端使用 requestAnimationFrame 平滑渲染
   - Markdown 增量解析和渲染
   - 代码块特殊处理（延迟渲染直到完整）

3. **感知优化**：
   - 首字节快速响应（即使只是 "思考中..."）
   - 打字机效果模拟
   - 进度指示器

4. **错误处理**：
   - 流式中断恢复机制
   - 部分响应缓存
   - 降级到非流式输出

**关键代码**：
```python
async def optimized_stream(raw_stream):
    buffer = ""
    last_send = time.time()
    
    async for chunk in raw_stream:
        buffer += chunk
        
        # 多条件触发发送
        should_send = (
            len(buffer) >= 10 or
            chunk in ".,!?\n" or
            time.time() - last_send > 0.05
        )
        
        if should_send:
            yield buffer
            buffer = ""
            last_send = time.time()
```

## 扩展阅读

- [OpenAI API 最佳实践](https://platform.openai.com/docs/guides/production-best-practices)
- [LangChain 缓存文档](https://python.langchain.com/docs/modules/model_io/models/chat/caching)
- [Redis 缓存模式](https://redis.io/docs/manual/patterns/)
- [Circuit Breaker 模式](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Token 计数指南](https://github.com/openai/tiktoken)

## 课后练习

1. **Token 优化练习**：
   - 分析现有 Agent 的 Token 消耗分布
   - 实现动态上下文截断，目标降低 30% Token 消耗
   - 对比优化前后的成本差异

2. **缓存实现练习**：
   - 实现一个语义缓存系统
   - 测试不同相似度阈值下的命中率
   - 对比精确缓存和语义缓存的性能差异

3. **并发控制练习**：
   - 实现一个完整的限流系统（用户级 + 全局级）
   - 添加熔断器和降级策略
   - 使用压力测试验证系统稳定性

4. **性能监控练习**：
   - 为 Agent 添加完整的性能监控
   - 实现延迟分布统计（P50/P95/P99）
   - 搭建简单的监控 Dashboard

5. **综合优化项目**：
   - 选择一个开源 Agent 项目
   - 应用本章所有优化技术
   - 撰写优化报告，包含：
     - 优化前后的性能对比
     - Token 成本节省计算
     - 延迟改善数据
     - 架构设计图
