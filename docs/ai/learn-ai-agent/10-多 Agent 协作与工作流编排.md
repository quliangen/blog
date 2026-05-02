# 10. 多 Agent 协作与工作流编排

多 Agent 系统（Multi-Agent System, MAS）是 AI Agent 的高级形态，通过多个专业化 Agent 的协作，能够解决单一 Agent 难以应对的复杂问题。本章将深入探讨多 Agent 的设计模式、协作机制和工作流编排方法。

---

## 10.1 多 Agent 设计模式

### 10.1.1 Manager-Worker 模式

Manager-Worker 是最经典的多 Agent 协作模式，类似于传统软件架构中的主从架构。

```
┌─────────────────────────────────────────┐
│              Manager Agent               │
│  - 任务分解与分配                        │
│  - 进度监控与协调                        │
│  - 结果汇总与验证                        │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│Worker1│ │Worker2│ │Worker3│
│Research│ │Code   │ │Test   │
└───────┘ └───────┘ └───────┘
```

**核心特点：**
- **集中式控制**：Manager 负责全局决策
- **专业化分工**：每个 Worker 专注特定领域
- **动态调度**：根据任务需求分配资源

**代码示例：**

```python
from typing import List, Dict, Any
from dataclasses import dataclass
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Task:
    id: str
    description: str
    assigned_to: str = None
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    dependencies: List[str] = None

class ManagerAgent:
    """管理 Agent：负责任务分解与协调"""
    
    def __init__(self, workers: Dict[str, 'WorkerAgent']):
        self.workers = workers
        self.task_queue: List[Task] = []
        self.completed_tasks: Dict[str, Task] = {}
    
    def decompose_task(self, complex_task: str) -> List[Task]:
        """将复杂任务分解为子任务"""
        # 使用 LLM 进行任务分解
        prompt = f"""
        将以下复杂任务分解为可并行执行的子任务：
        {complex_task}
        
        要求：
        1. 每个子任务应该是原子性的
        2. 明确子任务之间的依赖关系
        3. 为每个子任务分配合适的执行者类型
        
        输出格式：JSON 列表
        """
        # 调用 LLM 获取分解结果
        subtasks = self._call_llm(prompt)
        return [Task(**t) for t in subtasks]
    
    def assign_task(self, task: Task) -> bool:
        """根据任务类型分配给合适的 Worker"""
        worker_type = self._determine_worker_type(task)
        if worker_type in self.workers:
            worker = self.workers[worker_type]
            task.assigned_to = worker_type
            task.status = TaskStatus.IN_PROGRESS
            worker.execute(task)
            return True
        return False
    
    def collect_results(self) -> Dict[str, Any]:
        """收集所有 Worker 的结果并整合"""
        results = {}
        for task_id, task in self.completed_tasks.items():
            results[task_id] = task.result
        
        # 使用 LLM 整合结果
        synthesis_prompt = f"""
        整合以下子任务结果，生成最终输出：
        {results}
        """
        final_result = self._call_llm(synthesis_prompt)
        return final_result
    
    def _determine_worker_type(self, task: Task) -> str:
        """根据任务描述确定 Worker 类型"""
        # 简单的规则匹配，实际可使用更复杂的分类器
        if "research" in task.description.lower():
            return "researcher"
        elif "code" in task.description.lower():
            return "coder"
        elif "test" in task.description.lower():
            return "tester"
        return "general"

class WorkerAgent:
    """工作 Agent：执行具体任务"""
    
    def __init__(self, name: str, capabilities: List[str]):
        self.name = name
        self.capabilities = capabilities
        self.current_task: Task = None
    
    def execute(self, task: Task) -> Any:
        """执行任务并返回结果"""
        self.current_task = task
        
        # 根据能力选择执行策略
        if "coding" in self.capabilities:
            result = self._execute_coding_task(task)
        elif "research" in self.capabilities:
            result = self._execute_research_task(task)
        else:
            result = self._execute_general_task(task)
        
        task.result = result
        task.status = TaskStatus.COMPLETED
        return result
    
    def _execute_coding_task(self, task: Task) -> str:
        """执行编程任务"""
        # 实现代码生成逻辑
        pass
    
    def _execute_research_task(self, task: Task) -> str:
        """执行研究任务"""
        # 实现信息检索和分析逻辑
        pass
```

### 10.1.2 并行模式

并行模式允许多个 Agent 同时处理独立子任务，显著提升效率。

```
┌─────────────────────────────────────────┐
│           Parallel Executor              │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Agent A│ │Agent B│ │Agent C│ │Agent D│
│(Chunk1)│ │(Chunk2)│ │(Chunk3)│ │(Chunk4)│
└───────┘ └───────┘ └───────┘ └───────┘
    │         │         │         │
    └─────────┴────┬────┴─────────┘
                   ▼
            ┌───────────┐
            │  Merger   │
            │ (Reduce)  │
            └───────────┘
```

**适用场景：**
- 大规模数据处理（Map-Reduce 模式）
- 独立子任务并行执行
- 多维度分析任务

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, List, Any

class ParallelExecutor:
    """并行执行器：管理多个 Agent 的并发执行"""
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def map_reduce(
        self,
        data: List[Any],
        map_func: Callable[[Any], Any],
        reduce_func: Callable[[List[Any]], Any]
    ) -> Any:
        """
        Map-Reduce 并行处理模式
        
        Args:
            data: 待处理的数据列表
            map_func: 映射函数，每个 Agent 执行
            reduce_func: 归约函数，合并结果
        """
        # Map 阶段：并行处理
        futures = []
        for chunk in self._split_data(data, self.max_workers):
            future = self.executor.submit(map_func, chunk)
            futures.append(future)
        
        # 收集所有结果
        results = []
        for future in as_completed(futures):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Task failed: {e}")
        
        # Reduce 阶段：合并结果
        final_result = reduce_func(results)
        return final_result
    
    async def async_parallel(
        self,
        tasks: List[Callable],
        *args
    ) -> List[Any]:
        """异步并行执行多个任务"""
        async_tasks = [
            self._async_execute(task, *args) 
            for task in tasks
        ]
        results = await asyncio.gather(*async_tasks, return_exceptions=True)
        return results
    
    async def _async_execute(self, task: Callable, *args) -> Any:
        """异步包装器"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, task, *args)
    
    def _split_data(self, data: List[Any], n_chunks: int) -> List[List[Any]]:
        """将数据分割为多个块"""
        chunk_size = len(data) // n_chunks + 1
        return [data[i:i+chunk_size] for i in range(0, len(data), chunk_size)]

# 使用示例
def analyze_sentiment(texts: List[str]) -> Dict:
    """情感分析 Worker"""
    # 调用情感分析模型
    results = {"positive": 0, "negative": 0, "neutral": 0}
    for text in texts:
        sentiment = call_sentiment_model(text)
        results[sentiment] += 1
    return results

def merge_sentiment_results(results: List[Dict]) -> Dict:
    """合并情感分析结果"""
    merged = {"positive": 0, "negative": 0, "neutral": 0}
    for r in results:
        for key in merged:
            merged[key] += r.get(key, 0)
    return merged

# 执行并行情感分析
executor = ParallelExecutor(max_workers=4)
texts = load_large_dataset()  # 加载大量文本
final_result = executor.map_reduce(
    data=texts,
    map_func=analyze_sentiment,
    reduce_func=merge_sentiment_results
)
```

### 10.1.3 竞争模式

竞争模式通过多个 Agent 解决同一问题，选择最优结果，提高输出质量。

```
┌─────────────────────────────────────────┐
│            User Query                   │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Agent 1│ │Agent 2│ │Agent 3│ │Agent N│
│(GPT-4)│ │(Claude)│ │(Local)│ │(Other)│
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │         │         │
    └─────────┴────┬────┴─────────┘
                   ▼
            ┌───────────┐
            │  Judge    │
            │  Agent    │
            └─────┬─────┘
                  ▼
            Best Result
```

**核心机制：**
- **多候选生成**：多个 Agent 独立生成答案
- **质量评估**：Judge Agent 评估各答案质量
- **最优选择**：选择得分最高的答案或综合多个答案

```python
from typing import List, Tuple
import random

class CompetitiveSolver:
    """竞争式求解器：多 Agent 竞争生成最优解"""
    
    def __init__(self, agents: List['BaseAgent'], judge_agent: 'JudgeAgent'):
        self.agents = agents
        self.judge = judge_agent
        self.max_attempts = 3
    
    def solve(self, problem: str) -> Tuple[str, float]:
        """
        竞争式求解
        
        Returns:
            (最佳答案, 置信度分数)
        """
        candidates = []
        
        # 1. 多 Agent 并行生成候选答案
        for agent in self.agents:
            for attempt in range(self.max_attempts):
                try:
                    answer = agent.generate(problem, temperature=0.7 + attempt*0.1)
                    candidates.append({
                        "agent": agent.name,
                        "answer": answer,
                        "attempt": attempt
                    })
                except Exception as e:
                    continue
        
        # 2. Judge Agent 评估所有候选
        scored_candidates = []
        for candidate in candidates:
            score = self.judge.evaluate(problem, candidate["answer"])
            scored_candidates.append({
                **candidate,
                "score": score
            })
        
        # 3. 选择最优答案
        best = max(scored_candidates, key=lambda x: x["score"])
        
        # 4. 如果置信度不够高，进行综合
        if best["score"] < 0.8:
            top_candidates = sorted(
                scored_candidates, 
                key=lambda x: x["score"], 
                reverse=True
            )[:3]
            best["answer"] = self._synthesize(problem, top_candidates)
        
        return best["answer"], best["score"]
    
    def _synthesize(self, problem: str, candidates: List[Dict]) -> str:
        """综合多个优质候选答案"""
        synthesis_prompt = f"""
        问题：{problem}
        
        以下是多个候选答案，请综合它们的优点，生成一个更完善的答案：
        
        {chr(10).join([f"候选{i+1}（得分{c['score']:.2f}）：{c['answer']}" 
                       for i, c in enumerate(candidates)])}
        
        要求：
        1. 保留所有候选答案中的正确信息
        2. 消除矛盾和不一致
        3. 补充遗漏的关键点
        """
        return self.judge.generate(synthesis_prompt)

class JudgeAgent:
    """评判 Agent：评估答案质量"""
    
    def evaluate(self, problem: str, answer: str) -> float:
        """
        评估答案质量，返回 0-1 的分数
        """
        evaluation_prompt = f"""
        请评估以下答案的质量：
        
        问题：{problem}
        答案：{answer}
        
        请从以下维度评分（0-10）：
        1. 准确性：信息是否正确
        2. 完整性：是否回答了问题的所有方面
        3. 清晰度：表达是否清晰易懂
        4. 实用性：是否提供了可操作的指导
        
        输出格式：总评分（0-10），然后简要说明理由。
        """
        
        response = self._call_llm(evaluation_prompt)
        # 解析评分
        score = self._parse_score(response)
        return score / 10.0
    
    def _parse_score(self, response: str) -> float:
        """从响应中解析分数"""
        # 简单的分数提取逻辑
        import re
        match = re.search(r'(\d+(?:\.\d+)?)', response)
        if match:
            return float(match.group(1))
        return 5.0  # 默认中等分数
```

---

## 10.2 消息传递与状态共享机制

### 10.2.1 消息总线架构

消息总线是多 Agent 系统的核心通信基础设施，实现松耦合的 Agent 间通信。

```
┌─────────────────────────────────────────────────────┐
│                    Message Bus                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Topic A   │  │   Topic B   │  │   Topic C   │  │
│  │ (Commands)  │  │  (Events)   │  │  (States)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
    ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
    ▼           ▼    ▼           ▼    ▼           ▼
┌───────┐   ┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│Agent 1│   │Agent 2│ │Agent 3│   │Agent 4│ │Agent 5│
└───────┘   └───────┘ └───────┘   └───────┘ └───────┘
```

```python
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import json

class MessageType(Enum):
    COMMAND = "command"      # 指令消息
    EVENT = "event"          # 事件消息
    QUERY = "query"          # 查询消息
    RESPONSE = "response"    # 响应消息
    STATE = "state"          # 状态消息

@dataclass
class Message:
    """消息基类"""
    id: str
    type: MessageType
    topic: str
    sender: str
    payload: Dict
    timestamp: datetime = field(default_factory=datetime.now)
    correlation_id: Optional[str] = None  # 用于关联请求-响应
    priority: int = 0  # 优先级，数值越大优先级越高

class MessageBus:
    """消息总线：Agent 间通信的基础设施"""
    
    def __init__(self) -> None:
        self.subscribers: Dict[str, List[Callable[[Message], None]]] = {}
        self.message_queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.running: bool = False
        self.message_history: List[Message] = []
        self.max_history: int = 1000
    
    def subscribe(self, topic: str, handler: Callable[[Message], None]) -> None:
        """订阅特定主题的消息"""
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(handler)
    
    def unsubscribe(self, topic: str, handler: Callable[[Message], None]) -> None:
        """取消订阅"""
        if topic in self.subscribers:
            self.subscribers[topic].remove(handler)
    
    async def publish(self, message: Message) -> None:
        """发布消息到总线"""
        # 添加到队列（优先级队列）
        await self.message_queue.put((-message.priority, message))
        
        # 记录历史
        self.message_history.append(message)
        if len(self.message_history) > self.max_history:
            self.message_history.pop(0)
    
    async def start(self) -> None:
        """启动消息总线"""
        self.running = True
        while self.running:
            try:
                _, message = await asyncio.wait_for(
                    self.message_queue.get(), 
                    timeout=1.0
                )
                await self._dispatch(message)
            except asyncio.TimeoutError:
                continue
    
    async def _dispatch(self, message: Message) -> None:
        """分发消息到订阅者"""
        handlers = self.subscribers.get(message.topic, [])
        
        # 异步调用所有订阅者
        tasks = []
        for handler in handlers:
            task = asyncio.create_task(self._safe_handler(handler, message))
            tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _safe_handler(self, handler: Callable[[Message], None], message: Message) -> None:
        """安全调用处理器"""
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(message)
            else:
                handler(message)
        except Exception as e:
            print(f"Handler error: {e}")
    
    async def request_response(
        self, 
        request: Message, 
        timeout: float = 30.0
    ) -> Optional[Message]:
        """
        请求-响应模式
        
        发送请求并等待响应
        """
        response_future = asyncio.Future()
        
        def response_handler(msg: Message):
            if msg.correlation_id == request.id:
                if not response_future.done():
                    response_future.set_result(msg)
        
        # 订阅响应主题
        response_topic = f"{request.topic}.response"
        self.subscribe(response_topic, response_handler)
        
        # 发送请求
        await self.publish(request)
        
        try:
            # 等待响应
            response = await asyncio.wait_for(response_future, timeout)
            return response
        except asyncio.TimeoutError:
            return None
        finally:
            self.unsubscribe(response_topic, response_handler)

# 使用示例
async def demo_message_bus():
    bus = MessageBus()
    
    # Agent 1 订阅命令
    def command_handler(msg: Message):
        print(f"Agent 1 received command: {msg.payload}")
    
    bus.subscribe("commands", command_handler)
    
    # Agent 2 发布命令
    cmd = Message(
        id="cmd-001",
        type=MessageType.COMMAND,
        topic="commands",
        sender="agent-2",
        payload={"action": "process_data", "params": {"file": "data.csv"}}
    )
    
    await bus.publish(cmd)
```

### 10.2.2 共享状态管理

共享状态是多 Agent 协作的基础，需要解决并发访问、一致性等问题。

```python
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, field
from threading import Lock
import copy
import json
from datetime import datetime

@dataclass
class StateEntry:
    """状态条目"""
    value: Any
    version: int = 1
    last_modified: datetime = field(default_factory=datetime.now)
    modified_by: str = ""

class SharedState:
    """共享状态管理器"""
    
    def __init__(self):
        self._state: Dict[str, StateEntry] = {}
        self._lock = Lock()
        self._subscribers: Dict[str, List[Callable]] = {}
        self._transaction_log: List[Dict] = []
    
    def get(self, key: str, default=None) -> Any:
        """获取状态值"""
        with self._lock:
            entry = self._state.get(key)
            return copy.deepcopy(entry.value) if entry else default
    
    def set(self, key: str, value: Any, agent_id: str = "") -> bool:
        """设置状态值（乐观并发控制）"""
        with self._lock:
            if key in self._state:
                entry = self._state[key]
                entry.value = copy.deepcopy(value)
                entry.version += 1
                entry.last_modified = datetime.now()
                entry.modified_by = agent_id
            else:
                self._state[key] = StateEntry(
                    value=copy.deepcopy(value),
                    modified_by=agent_id
                )
            
            # 记录事务日志
            self._transaction_log.append({
                "action": "set",
                "key": key,
                "agent": agent_id,
                "timestamp": datetime.now()
            })
            
            # 通知订阅者
            self._notify_subscribers(key, value)
            
            return True
    
    def compare_and_set(
        self, 
        key: str, 
        expected_version: int, 
        new_value: Any,
        agent_id: str = ""
    ) -> bool:
        """
        比较并设置（CAS 操作）
        
        用于实现乐观锁，解决并发冲突
        """
        with self._lock:
            entry = self._state.get(key)
            if not entry:
                return False
            
            if entry.version != expected_version:
                # 版本冲突
                return False
            
            entry.value = copy.deepcopy(new_value)
            entry.version += 1
            entry.last_modified = datetime.now()
            entry.modified_by = agent_id
            
            self._notify_subscribers(key, new_value)
            return True
    
    def subscribe(self, key: str, callback: Callable[[Any], None]):
        """订阅状态变化"""
        with self._lock:
            if key not in self._subscribers:
                self._subscribers[key] = []
            self._subscribers[key].append(callback)
    
    def _notify_subscribers(self, key: str, value: Any):
        """通知订阅者"""
        callbacks = self._subscribers.get(key, [])
        for callback in callbacks:
            try:
                callback(copy.deepcopy(value))
            except Exception as e:
                print(f"Subscriber error: {e}")
    
    def get_snapshot(self) -> Dict[str, Any]:
        """获取状态快照"""
        with self._lock:
            return {
                key: {
                    "value": copy.deepcopy(entry.value),
                    "version": entry.version,
                    "last_modified": entry.last_modified.isoformat(),
                    "modified_by": entry.modified_by
                }
                for key, entry in self._state.items()
            }
    
    def get_namespace(self, prefix: str) -> Dict[str, Any]:
        """获取命名空间下的所有状态"""
        with self._lock:
            return {
                key: copy.deepcopy(entry.value)
                for key, entry in self._state.items()
                if key.startswith(prefix)
            }

# 状态命名空间管理
class StateNamespace:
    """状态命名空间：为 Agent 提供隔离的状态空间"""
    
    def __init__(self, shared_state: SharedState, namespace: str):
        self._state = shared_state
        self._namespace = namespace
    
    def _full_key(self, key: str) -> str:
        """生成完整键名"""
        return f"{self._namespace}:{key}"
    
    def get(self, key: str, default=None) -> Any:
        return self._state.get(self._full_key(key), default)
    
    def set(self, key: str, value: Any, agent_id: str = ""):
        return self._state.set(self._full_key(key), value, agent_id)
    
    def get_all(self) -> Dict[str, Any]:
        """获取命名空间下所有状态"""
        return self._state.get_namespace(self._namespace + ":")
```

### 10.2.3 黑板系统

黑板系统是一种经典的多 Agent 协作架构，适合解决复杂问题。

```
┌─────────────────────────────────────────────────────┐
│                     Blackboard                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Hypothesis │  │   Data      │  │  Solutions  │  │
│  │   Layer     │  │   Layer     │  │   Layer     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Knowledge  │  │  Control    │  │   Agenda    │  │
│  │   Layer     │  │   Layer     │  │   Layer     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
          ▲      ▲      ▲      ▲      ▲
          │      │      │      │      │
    ┌─────┴──────┴──────┴──────┴──────┴─────┐
    │         Knowledge Sources              │
    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
    │  │ KS1 │ │ KS2 │ │ KS3 │ │ KS4 │ ... │
    │  └─────┘ └─────┘ └─────┘ └─────┘     │
    └────────────────────────────────────────┘
```

```python
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import heapq

class LayerType(Enum):
    DATA = "data"
    KNOWLEDGE = "knowledge"
    HYPOTHESIS = "hypothesis"
    SOLUTION = "solution"
    CONTROL = "control"

@dataclass
class BlackboardEntry:
    """黑板条目"""
    id: str
    layer: LayerType
    content: Any
    confidence: float = 1.0
    creator: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    dependencies: List[str] = field(default_factory=list)

class Blackboard:
    """黑板系统：共享问题解决空间"""
    
    def __init__(self):
        self.layers: Dict[LayerType, Dict[str, BlackboardEntry]] = {
            layer: {} for layer in LayerType
        }
        self.knowledge_sources: Dict[str, 'KnowledgeSource'] = {}
        self.agenda: List[tuple] = []  # 优先级队列
        self.control_strategy: Callable = self._default_control
    
    def write(
        self,
        layer: LayerType,
        entry_id: str,
        content: Any,
        creator: str,
        confidence: float = 1.0,
        dependencies: List[str] = None
    ) -> BlackboardEntry:
        """向黑板写入条目"""
        entry = BlackboardEntry(
            id=entry_id,
            layer=layer,
            content=content,
            confidence=confidence,
            creator=creator,
            dependencies=dependencies or []
        )
        
        self.layers[layer][entry_id] = entry
        
        # 触发知识源
        self._trigger_knowledge_sources(entry)
        
        return entry
    
    def read(self, layer: LayerType, entry_id: str) -> Optional[BlackboardEntry]:
        """从黑板读取条目"""
        return self.layers[layer].get(entry_id)
    
    def read_layer(self, layer: LayerType) -> List[BlackboardEntry]:
        """读取整个层的内容"""
        return list(self.layers[layer].values())
    
    def register_knowledge_source(self, ks: 'KnowledgeSource'):
        """注册知识源"""
        self.knowledge_sources[ks.name] = ks
        ks.blackboard = self
    
    def _trigger_knowledge_sources(self, entry: BlackboardEntry):
        """触发相关的知识源"""
        for ks in self.knowledge_sources.values():
            if ks.can_contribute(entry):
                priority = ks.calculate_priority(entry)
                heapq.heappush(self.agenda, (-priority, ks.name, entry.id))
    
    def run(self, max_iterations: int = 100):
        """运行黑板系统"""
        for _ in range(max_iterations):
            if not self.agenda:
                # 检查是否已有解决方案
                if self.layers[LayerType.SOLUTION]:
                    break
                continue
            
            # 选择最高优先级的知识源
            _, ks_name, entry_id = heapq.heappop(self.agenda)
            ks = self.knowledge_sources.get(ks_name)
            
            if ks and ks.is_ready():
                entry = self.read(entry.layer, entry_id)
                if entry:
                    ks.contribute(entry)

class KnowledgeSource:
    """知识源：向黑板贡献知识"""
    
    def __init__(self, name: str):
        self.name = name
        self.blackboard: Optional[Blackboard] = None
        self.preconditions: List[Callable] = []
    
    def can_contribute(self, entry: BlackboardEntry) -> bool:
        """检查是否可以贡献"""
        return all(precond(entry) for precond in self.preconditions)
    
    def calculate_priority(self, entry: BlackboardEntry) -> float:
        """计算贡献优先级"""
        return entry.confidence
    
    def is_ready(self) -> bool:
        """检查是否准备好贡献"""
        return True
    
    def contribute(self, triggering_entry: BlackboardEntry):
        """向黑板贡献知识"""
        raise NotImplementedError

# 示例知识源：假设生成器
class HypothesisGenerator(KnowledgeSource):
    """基于数据生成假设"""
    
    def __init__(self):
        super().__init__("HypothesisGenerator")
        self.preconditions = [
            lambda e: e.layer == LayerType.DATA,
            lambda e: e.confidence > 0.5
        ]
    
    def contribute(self, data_entry: BlackboardEntry):
        """基于数据生成假设"""
        data = data_entry.content
        
        # 生成假设
        hypothesis = self._generate_hypothesis(data)
        
        # 写入黑板
        self.blackboard.write(
            layer=LayerType.HYPOTHESIS,
            entry_id=f"hypo_{data_entry.id}",
            content=hypothesis,
            creator=self.name,
            confidence=0.7,
            dependencies=[data_entry.id]
        )
    
    def _generate_hypothesis(self, data: Any) -> str:
        """生成假设的逻辑"""
        # 实现假设生成
        return f"Based on {data}, we hypothesize..."

# 示例知识源：解决方案生成器
class SolutionGenerator(KnowledgeSource):
    """基于假设生成解决方案"""
    
    def __init__(self):
        super().__init__("SolutionGenerator")
        self.preconditions = [
            lambda e: e.layer == LayerType.HYPOTHESIS,
            lambda e: e.confidence > 0.6
        ]
    
    def contribute(self, hypo_entry: BlackboardEntry):
        """基于假设生成解决方案"""
        hypothesis = hypo_entry.content
        
        # 生成解决方案
        solution = self._generate_solution(hypothesis)
        
        # 写入黑板
        self.blackboard.write(
            layer=LayerType.SOLUTION,
            entry_id=f"sol_{hypo_entry.id}",
            content=solution,
            creator=self.name,
            confidence=0.8,
            dependencies=[hypo_entry.id]
        )
    
    def _generate_solution(self, hypothesis: str) -> str:
        """生成解决方案的逻辑"""
        return f"Solution based on: {hypothesis}"
```

---

## 10.3 工作流编排

### 10.3.1 顺序工作流

顺序工作流是最基础的模式，任务按预定顺序依次执行。

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Task 1 │────▶│  Task 2 │────▶│  Task 3 │────▶│  Task 4 │
│(Parse)  │     │(Analyze)│     │(Process)│     │(Output) │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

```python
from typing import List, Callable, Any, Dict
from dataclasses import dataclass
from enum import Enum
import asyncio

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class Task:
    """工作流任务"""
    id: str
    name: str
    func: Callable
    args: tuple = ()
    kwargs: Dict = None
    dependencies: List[str] = None
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: Exception = None

class SequentialWorkflow:
    """顺序工作流执行器"""
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.execution_order: List[str] = []
        self.context: Dict[str, Any] = {}
    
    def add_task(
        self,
        task_id: str,
        name: str,
        func: Callable,
        *args,
        **kwargs
    ) -> 'SequentialWorkflow':
        """添加任务"""
        task = Task(
            id=task_id,
            name=name,
            func=func,
            args=args,
            kwargs=kwargs
        )
        self.tasks[task_id] = task
        self.execution_order.append(task_id)
        return self
    
    def execute(self, initial_context: Dict = None) -> Dict:
        """顺序执行所有任务"""
        if initial_context:
            self.context.update(initial_context)
        
        for task_id in self.execution_order:
            task = self.tasks[task_id]
            
            try:
                task.status = TaskStatus.RUNNING
                
                # 准备参数（支持从上下文注入）
                args, kwargs = self._prepare_args(task)
                
                # 执行任务
                if asyncio.iscoroutinefunction(task.func):
                    result = asyncio.get_event_loop().run_until_complete(
                        task.func(*args, **kwargs)
                    )
                else:
                    result = task.func(*args, **kwargs)
                
                task.result = result
                task.status = TaskStatus.COMPLETED
                
                # 将结果存入上下文
                self.context[task_id] = result
                
            except Exception as e:
                task.error = e
                task.status = TaskStatus.FAILED
                raise WorkflowError(f"Task {task_id} failed: {e}") from e
        
        return self.context
    
    def _prepare_args(self, task: Task) -> tuple:
        """准备任务参数"""
        args = list(task.args)
        kwargs = dict(task.kwargs) if task.kwargs else {}
        
        # 支持从上下文注入参数
        for i, arg in enumerate(args):
            if isinstance(arg, str) and arg.startswith("$"):
                context_key = arg[1:]
                args[i] = self.context.get(context_key)
        
        for key, value in kwargs.items():
            if isinstance(value, str) and value.startswith("$"):
                context_key = value[1:]
                kwargs[key] = self.context.get(context_key)
        
        return tuple(args), kwargs

class WorkflowError(Exception):
    """工作流错误"""
    pass

# 使用示例
def parse_input(text: str) -> Dict:
    """解析输入"""
    return {"parsed": text.split()}

def analyze_data(data: Dict) -> Dict:
    """分析数据"""
    words = data["parsed"]
    return {"word_count": len(words), "unique_words": len(set(words))}

def generate_report(analysis: Dict) -> str:
    """生成报告"""
    return f"Report: {analysis['word_count']} words, {analysis['unique_words']} unique"

# 构建工作流
workflow = SequentialWorkflow()
workflow.add_task("parse", "Parse Input", parse_input, "Hello world foo bar")
workflow.add_task("analyze", "Analyze Data", analyze_data, "$parse")
workflow.add_task("report", "Generate Report", generate_report, "$analyze")

# 执行
result = workflow.execute()
print(result["report"])  # 输出报告
```

### 10.3.2 条件分支工作流

条件分支允许根据运行时条件动态选择执行路径。

```
                    ┌─────────┐
                    │  Start  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │Condition│
                    │  Check  │
                    └────┬────┘
                         │
           ┌─────────────┼─────────────┐
           │ True        │ False       │
           ▼             │             ▼
    ┌──────────┐         │      ┌──────────┐
    │ Branch A │         │      │ Branch B │
    │(Process1)│         │      │(Process2)│
    └────┬─────┘         │      └────┬─────┘
         │               │           │
         └───────────────┼───────────┘
                         ▼
                    ┌─────────┐
                    │  Merge  │
                    │  Point  │
                    └────┬────┘
                         ▼
                    ┌─────────┐
                    │   End   │
                    └─────────┘
```

```python
from typing import Callable, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

class BranchType(Enum):
    IF = "if"
    ELSE = "else"
    ELIF = "elif"

@dataclass
class Branch:
    """条件分支"""
    condition: Callable[[Dict], bool]
    workflow: 'Workflow'
    branch_type: BranchType = BranchType.IF

class ConditionalWorkflow:
    """条件分支工作流"""
    
    def __init__(self):
        self.branches: List[Branch] = []
        self.default_workflow: Optional['Workflow'] = None
        self.context: Dict[str, Any] = {}
    
    def add_if(
        self,
        condition: Callable[[Dict], bool],
        workflow: 'Workflow'
    ) -> 'ConditionalWorkflow':
        """添加 IF 分支"""
        self.branches.append(Branch(condition, workflow, BranchType.IF))
        return self
    
    def add_elif(
        self,
        condition: Callable[[Dict], bool],
        workflow: 'Workflow'
    ) -> 'ConditionalWorkflow':
        """添加 ELIF 分支"""
        self.branches.append(Branch(condition, workflow, BranchType.ELIF))
        return self
    
    def add_else(self, workflow: 'Workflow') -> 'ConditionalWorkflow':
        """添加 ELSE 分支"""
        self.default_workflow = workflow
        return self
    
    def execute(self, context: Dict = None) -> Dict:
        """执行条件分支"""
        if context:
            self.context.update(context)
        
        # 按顺序评估条件
        if_branch_matched = False
        
        for branch in self.branches:
            if branch.branch_type == BranchType.IF:
                if branch.condition(self.context):
                    if_branch_matched = True
                    return branch.workflow.execute(self.context)
            elif branch.branch_type == BranchType.ELIF:
                if if_branch_matched:
                    continue
                if branch.condition(self.context):
                    return branch.workflow.execute(self.context)
        
        # 执行默认分支
        if self.default_workflow:
            return self.default_workflow.execute(self.context)
        
        return self.context

# 使用示例
def is_high_priority(context: Dict) -> bool:
    return context.get("priority", 0) > 7

def is_medium_priority(context: Dict) -> bool:
    priority = context.get("priority", 0)
    return 4 <= priority <= 7

# 构建分支工作流
high_priority_flow = SequentialWorkflow()
high_priority_flow.add_task("urgent", "Urgent Process", lambda: "Processing urgently")

medium_priority_flow = SequentialWorkflow()
medium_priority_flow.add_task("normal", "Normal Process", lambda: "Processing normally")

low_priority_flow = SequentialWorkflow()
low_priority_flow.add_task("batch", "Batch Process", lambda: "Processing in batch")

conditional = ConditionalWorkflow()
conditional.add_if(is_high_priority, high_priority_flow)
conditional.add_elif(is_medium_priority, medium_priority_flow)
conditional.add_else(low_priority_flow)

# 执行
result = conditional.execute({"priority": 8})  # 走 high_priority_flow
```

### 10.3.3 循环工作流

循环工作流支持重复执行直到满足退出条件。

```
         ┌─────────────────────────────────┐
         │                                 │
         ▼                                 │
    ┌─────────┐     ┌─────────┐     ┌─────┴─────┐
    │  Init   │────▶│  Check  │────▶│ Condition │
    │ (Setup) │     │  Exit?  │     │  Met?     │
    └─────────┘     └────┬────┘     └─────┬─────┘
                         │ True           │ False
                         │                │
                         ▼                ▼
                    ┌─────────┐     ┌─────────┐
                    │   End   │     │  Body   │
                    │         │     │ (Work)  │
                    └─────────┘     └────┬────┘
                                         │
                                         └─────────────┐
                                                       │
                                         ┌─────────────┘
                                         ▼
                                    ┌─────────┐
                                    │ Update  │
                                    │(Modify) │
                                    └─────────┘
```

```python
from typing import Callable, Dict, Any

class LoopWorkflow:
    """循环工作流"""
    
    def __init__(self):
        self.init_func: Callable = None
        self.condition_func: Callable = None
        self.body_func: Callable = None
        self.update_func: Callable = None
        self.max_iterations: int = 100
        self.context: Dict[str, Any] = {}
    
    def set_init(self, func: Callable[[], Dict]) -> 'LoopWorkflow':
        """设置初始化函数"""
        self.init_func = func
        return self
    
    def set_condition(self, func: Callable[[Dict], bool]) -> 'LoopWorkflow':
        """设置循环条件"""
        self.condition_func = func
        return self
    
    def set_body(self, func: Callable[[Dict], Any]) -> 'LoopWorkflow':
        """设置循环体"""
        self.body_func = func
        return self
    
    def set_update(self, func: Callable[[Dict, Any], Dict]) -> 'LoopWorkflow':
        """设置更新函数"""
        self.update_func = func
        return self
    
    def set_max_iterations(self, max_iter: int) -> 'LoopWorkflow':
        """设置最大迭代次数"""
        self.max_iterations = max_iter
        return self
    
    def execute(self, initial_context: Dict = None) -> Dict:
        """执行循环"""
        # 初始化
        if self.init_func:
            init_data = self.init_func()
            self.context.update(init_data)
        
        if initial_context:
            self.context.update(initial_context)
        
        iteration = 0
        results = []
        
        while iteration < self.max_iterations:
            # 检查退出条件
            if not self.condition_func(self.context):
                break
            
            # 执行循环体
            result = self.body_func(self.context)
            results.append(result)
            
            # 更新状态
            if self.update_func:
                self.context = self.update_func(self.context, result)
            
            iteration += 1
        
        self.context["iterations"] = iteration
        self.context["results"] = results
        
        return self.context

# 使用示例：迭代优化
def init_optimizer():
    """初始化优化器"""
    return {
        "x": 10.0,
        "learning_rate": 0.1,
        "gradient": float('inf')
    }

def should_continue(context: Dict) -> bool:
    """检查是否继续优化"""
    return abs(context["gradient"]) > 0.01

def optimization_step(context: Dict) -> Dict:
    """执行优化步骤"""
    x = context["x"]
    # 简单的梯度下降（目标函数 f(x) = (x-2)^2）
    gradient = 2 * (x - 2)
    new_x = x - context["learning_rate"] * gradient
    
    return {
        "old_x": x,
        "new_x": new_x,
        "gradient": gradient,
        "loss": (new_x - 2) ** 2
    }

def update_state(context: Dict, result: Dict) -> Dict:
    """更新状态"""
    context["x"] = result["new_x"]
    context["gradient"] = result["gradient"]
    return context

# 构建循环工作流
optimizer = LoopWorkflow()
optimizer.set_init(init_optimizer)
optimizer.set_condition(should_continue)
optimizer.set_body(optimization_step)
optimizer.set_update(update_state)

# 执行优化
result = optimizer.execute()
print(f"Optimized x: {result['x']:.4f}")
print(f"Iterations: {result['iterations']}")
```

---

## 10.4 实战：搭建「产品经理+架构师+程序员」协作团队

本节将构建一个完整的多 Agent 协作系统，模拟真实的软件开发团队。

### 10.4.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Project Manager                         │
│                    (Orchestrator Agent)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Product     │  │  Architect    │  │   Developer   │
│   Manager     │  │    Agent      │  │    Agent      │
│   (PM Agent)  │  │               │  │               │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        │   ┌──────────────┼──────────────┐   │
        │   │              │              │   │
        ▼   ▼              ▼              ▼   ▼
   ┌────────────┐    ┌────────────┐    ┌────────────┐
   │  PRD Doc   │───▶│ Tech Spec  │───▶│   Code     │
   │  (需求文档) │    │ (技术方案)  │    │  (代码实现) │
   └────────────┘    └────────────┘    └────────────┘
```

### 10.4.2 完整代码实现

```python
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

# ==================== 基础组件 ====================

@dataclass
class Artifact:
    """工作产物"""
    id: str
    type: str
    content: Any
    creator: str
    version: int = 1
    created_at: datetime = field(default_factory=datetime.now)
    dependencies: List[str] = field(default_factory=list)
    reviews: List['Review'] = field(default_factory=list)

@dataclass
class Review:
    """评审意见"""
    reviewer: str
    status: str  # "approved", "rejected", "needs_revision"
    comments: str
    timestamp: datetime = field(default_factory=datetime.now)

class SharedWorkspace:
    """共享工作空间"""
    
    def __init__(self) -> None:
        self.artifacts: Dict[str, Artifact] = {}
        self.messages: List[Dict[str, Any]] = []
        self.status: Dict[str, Any] = {
            "phase": "init",
            "progress": 0,
            "blockers": []
        }
    
    def add_artifact(self, artifact: Artifact) -> None:
        """添加工作产物"""
        self.artifacts[artifact.id] = artifact
    
    def get_artifact(self, artifact_id: str) -> Optional[Artifact]:
        """获取工作产物"""
        return self.artifacts.get(artifact_id)
    
    def add_message(self, sender: str, recipient: str, content: str) -> None:
        """添加消息"""
        self.messages.append({
            "sender": sender,
            "recipient": recipient,
            "content": content,
            "timestamp": datetime.now()
        })
    
    def update_status(self, **kwargs: Any) -> None:
        """更新项目状态"""
        self.status.update(kwargs)

# ==================== Agent 定义 ====================

class BaseAgent:
    """基础 Agent 类"""
    
    def __init__(self, name: str, role: str, workspace: 'SharedWorkspace') -> None:
        self.name: str = name
        self.role: str = role
        self.workspace: 'SharedWorkspace' = workspace
        self.capabilities: List[str] = []
    
    def send_message(self, recipient: str, content: str) -> None:
        """发送消息"""
        self.workspace.add_message(self.name, recipient, content)
        print(f"[{self.name}] → [{recipient}]: {content}")
    
    def receive_message(self, message: Dict[str, Any]) -> str:
        """接收消息并生成响应"""
        raise NotImplementedError
    
    def create_artifact(
        self,
        artifact_id: str,
        artifact_type: str,
        content: Any,
        dependencies: List[str] = None
    ) -> Artifact:
        """创建工作产物"""
        artifact = Artifact(
            id=artifact_id,
            type=artifact_type,
            content=content,
            creator=self.name,
            dependencies=dependencies or []
        )
        self.workspace.add_artifact(artifact)
        print(f"[{self.name}] Created artifact: {artifact_id}")
        return artifact

class ProductManagerAgent(BaseAgent):
    """产品经理 Agent"""
    
    def __init__(self, workspace: 'SharedWorkspace') -> None:
        super().__init__("PM", "Product Manager", workspace)
        self.capabilities = ["requirement_analysis", "prd_writing", "user_story"]
    
    def analyze_requirement(self, user_input: str) -> Dict:
        """分析用户需求"""
        print(f"\n[{self.name}] Analyzing requirement: {user_input}")
        
        # 模拟需求分析
        analysis = {
            "problem": user_input,
            "target_users": ["end_users", "administrators"],
            "key_features": [
                "user_authentication",
                "data_management",
                "reporting"
            ],
            "constraints": {
                "timeline": "2 weeks",
                "budget": "limited"
            }
        }
        
        return analysis
    
    def write_prd(self, analysis: Dict) -> Artifact:
        """编写 PRD 文档"""
        print(f"\n[{self.name}] Writing PRD...")
        
        prd_content = {
            "title": f"PRD: {analysis['problem']}",
            "overview": f"解决 {analysis['problem']} 的产品方案",
            "user_stories": [
                {
                    "as_a": "user",
                    "i_want": "feature A",
                    "so_that": "benefit A"
                },
                {
                    "as_a": "admin",
                    "i_want": "feature B",
                    "so_that": "benefit B"
                }
            ],
            "acceptance_criteria": [
                "用户能够完成核心任务",
                "系统响应时间 < 2s",
                "支持并发访问"
            ],
            "non_functional_requirements": {
                "performance": "p95 < 500ms",
                "availability": "99.9%",
                "security": "OAuth2 + JWT"
            }
        }
        
        prd = self.create_artifact(
            artifact_id="PRD_v1",
            artifact_type="PRD",
            content=prd_content
        )
        
        # 通知架构师
        self.send_message(
            "Architect",
            "PRD is ready for technical review. Please check artifact: PRD_v1"
        )
        
        return prd

class ArchitectAgent(BaseAgent):
    """架构师 Agent"""
    
    def __init__(self, workspace: 'SharedWorkspace') -> None:
        super().__init__("Architect", "System Architect", workspace)
        self.capabilities = ["system_design", "tech_selection", "api_design"]
    
    def review_prd(self, prd_id: str) -> Review:
        """评审 PRD"""
        print(f"\n[{self.name}] Reviewing PRD...")
        
        prd = self.workspace.get_artifact(prd_id)
        if not prd:
            raise ValueError(f"PRD {prd_id} not found")
        
        # 模拟评审
        review = Review(
            reviewer=self.name,
            status="approved",
            comments="PRD is clear and feasible. Proceeding with technical design."
        )
        
        prd.reviews.append(review)
        return review
    
    def design_architecture(self, prd: Artifact) -> Artifact:
        """设计系统架构"""
        print(f"\n[{self.name}] Designing system architecture...")
        
        tech_spec = {
            "architecture_style": "Microservices",
            "tech_stack": {
                "frontend": "React + TypeScript",
                "backend": "Python FastAPI",
                "database": "PostgreSQL",
                "cache": "Redis",
                "message_queue": "RabbitMQ"
            },
            "services": [
                {
                    "name": "auth-service",
                    "responsibility": "用户认证与授权",
                    "endpoints": ["/login", "/logout", "/refresh"]
                },
                {
                    "name": "data-service",
                    "responsibility": "数据管理",
                    "endpoints": ["/api/v1/data", "/api/v1/search"]
                },
                {
                    "name": "report-service",
                    "responsibility": "报表生成",
                    "endpoints": ["/api/v1/reports", "/api/v1/export"]
                }
            ],
            "data_model": {
                "entities": ["User", "Data", "Report"],
                "relationships": [
                    "User has many Data",
                    "Data belongs to Report"
                ]
            },
            "api_spec": {
                "version": "v1",
                "authentication": "JWT Bearer",
                "rate_limiting": "1000 requests/hour"
            }
        }
        
        spec = self.create_artifact(
            artifact_id="TechSpec_v1",
            artifact_type="Technical_Specification",
            content=tech_spec,
            dependencies=[prd.id]
        )
        
        # 通知开发团队
        self.send_message(
            "Developer",
            "Technical specification is ready. Please review and start implementation."
        )
        
        return spec

class DeveloperAgent(BaseAgent):
    """开发工程师 Agent"""
    
    def __init__(self, workspace: 'SharedWorkspace') -> None:
        super().__init__("Developer", "Software Developer", workspace)
        self.capabilities = ["coding", "testing", "debugging"]
    
    def implement(self, tech_spec: Artifact) -> List[Artifact]:
        """根据技术规范实现代码"""
        print(f"\n[{self.name}] Implementing features...")
        
        spec = tech_spec.content
        code_artifacts = []
        
        # 实现各个服务
        for service in spec["services"]:
            service_name = service["name"]
            
            # 生成代码
            code = self._generate_service_code(service)
            
            artifact = self.create_artifact(
                artifact_id=f"Code_{service_name}_v1",
                artifact_type="Source_Code",
                content=code,
                dependencies=[tech_spec.id]
            )
            code_artifacts.append(artifact)
        
        # 更新项目状态
        self.workspace.update_status(
            phase="implementation",
            progress=100,
            completed_services=[s["name"] for s in spec["services"]]
        )
        
        # 通知项目经理
        self.send_message(
            "PM",
            f"Implementation completed. Generated {len(code_artifacts)} service modules."
        )
        
        return code_artifacts
    
    def _generate_service_code(self, service: Dict) -> str:
        """生成服务代码（模拟）"""
        service_name = service["name"]
        endpoints = service["endpoints"]
        
        code = f"""
# {service_name}
# Responsibility: {service['responsibility']}

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI(title="{service_name}")

# Models
class RequestModel(BaseModel):
    pass

class ResponseModel(BaseModel):
    pass

# Endpoints
"""
        for endpoint in endpoints:
            code += f"""
@app.post("{endpoint}")
async def handle_{endpoint.replace('/', '_').strip('_')}(
    request: RequestModel
) -> ResponseModel:
    \"\"\"Handle {endpoint} request\"\"\"
    # TODO: Implementation
    return ResponseModel()
"""
        
        return code

# ==================== 编排器 ====================

class ProjectOrchestrator:
    """项目编排器：协调各 Agent 协作"""
    
    def __init__(self) -> None:
        self.workspace: SharedWorkspace = SharedWorkspace()
        self.pm: ProductManagerAgent = ProductManagerAgent(self.workspace)
        self.architect: ArchitectAgent = ArchitectAgent(self.workspace)
        self.developer: DeveloperAgent = DeveloperAgent(self.workspace)
        
        self.agents: Dict[str, BaseAgent] = {
            "PM": self.pm,
            "Architect": self.architect,
            "Developer": self.developer
        }
    
    def run_project(self, requirement: str) -> Dict:
        """运行完整项目流程"""
        print("=" * 60)
        print("STARTING PROJECT")
        print("=" * 60)
        
        # Phase 1: 需求分析（PM）
        self.workspace.update_status(phase="requirement_analysis")
        analysis = self.pm.analyze_requirement(requirement)
        
        # Phase 2: PRD 编写（PM）
        self.workspace.update_status(phase="prd_writing")
        prd = self.pm.write_prd(analysis)
        
        # Phase 3: 技术评审（Architect）
        self.workspace.update_status(phase="technical_review")
        review = self.architect.review_prd(prd.id)
        
        if review.status != "approved":
            print(f"PRD rejected: {review.comments}")
            return {"status": "failed", "reason": "PRD rejected"}
        
        # Phase 4: 架构设计（Architect）
        self.workspace.update_status(phase="architecture_design")
        tech_spec = self.architect.design_architecture(prd)
        
        # Phase 5: 代码实现（Developer）
        self.workspace.update_status(phase="implementation")
        code_artifacts = self.developer.implement(tech_spec)
        
        # 项目完成
        print("\n" + "=" * 60)
        print("PROJECT COMPLETED")
        print("=" * 60)
        
        return {
            "status": "completed",
            "artifacts": {
                "prd": prd.id,
                "tech_spec": tech_spec.id,
                "code": [a.id for a in code_artifacts]
            },
            "messages": len(self.workspace.messages),
            "final_status": self.workspace.status
        }

# ==================== 运行示例 ====================

if __name__ == "__main__":
    # 创建编排器
    orchestrator = ProjectOrchestrator()
    
    # 启动项目
    result = orchestrator.run_project(
        "开发一个用户数据管理和报表生成系统"
    )
    
    print("\n" + "=" * 60)
    print("PROJECT SUMMARY")
    print("=" * 60)
    print(json.dumps(result, indent=2, default=str))
```

### 10.4.3 运行结果

```
============================================================
STARTING PROJECT
============================================================

[PM] Analyzing requirement: 开发一个用户数据管理和报表生成系统

[PM] Writing PRD...
[PM] Created artifact: PRD_v1
[PM] → [Architect]: PRD is ready for technical review. Please check artifact: PRD_v1

[Architect] Reviewing PRD...

[Architect] Designing system architecture...
[Architect] Created artifact: TechSpec_v1
[Architect] → [Developer]: Technical specification is ready. Please review and start implementation.

[Developer] Implementing features...
[Developer] Created artifact: Code_auth-service_v1
[Developer] Created artifact: Code_data-service_v1
[Developer] Created artifact: Code_report-service_v1
[Developer] → [PM]: Implementation completed. Generated 3 service modules.

============================================================
PROJECT COMPLETED
============================================================

============================================================
PROJECT SUMMARY
============================================================
{
  "status": "completed",
  "artifacts": {
    "prd": "PRD_v1",
    "tech_spec": "TechSpec_v1",
    "code": [
      "Code_auth-service_v1",
      "Code_data-service_v1",
      "Code_report-service_v1"
    ]
  },
  "messages": 2,
  "final_status": {
    "phase": "implementation",
    "progress": 100,
    "completed_services": [
      "auth-service",
      "data-service",
      "report-service"
    ]
  }
}
```

---

## 10.5 面试考点

### 10.5.1 多 Agent 架构设计

**Q1: 什么时候应该使用多 Agent 架构而不是单一 Agent？**

**参考答案：**

| 场景 | 单一 Agent | 多 Agent |
|------|-----------|----------|
| 任务复杂度 | 简单、边界清晰 | 复杂、多维度 |
| 专业领域 | 单一领域 | 跨领域协作 |
| 可靠性要求 | 可接受单点失败 | 需要冗余和竞争 |
| 性能需求 | 低延迟、简单交互 | 可并行处理 |
| 可维护性 | 快速迭代 | 模块化、职责分离 |

**Q2: 如何设计 Agent 间的通信协议？**

**参考答案：**

1. **同步 vs 异步**
   - 同步：请求-响应模式，适合需要即时反馈的场景
   - 异步：消息队列模式，适合解耦和削峰填谷

2. **消息格式**
   ```json
   {
     "message_id": "uuid",
     "type": "command|event|query",
     "sender": "agent_id",
     "recipient": "agent_id|broadcast",
     "payload": {},
     "timestamp": "ISO8601",
     "correlation_id": "uuid",  // 用于关联请求-响应
     "priority": 1-10
   }
   ```

3. **可靠性保障**
   - 消息持久化
   - 重试机制
   - 超时处理
   - 死信队列

### 10.5.2 协作模式选择

**Q3: Manager-Worker 模式和竞争模式各有什么优缺点？**

**参考答案：**

**Manager-Worker 模式：**
- **优点**：
  - 职责清晰，易于理解
  - 集中控制，便于协调
  - 适合任务分解明确的场景
- **缺点**：
  - Manager 可能成为瓶颈
  - 单点故障风险
  - 扩展性受限

**竞争模式：**
- **优点**：
  - 提高输出质量（取最优）
  - 天然容错（部分失败不影响整体）
  - 可比较不同模型的能力
- **缺点**：
  - 成本增加（多倍计算资源）
  - 需要有效的评估机制
  - 延迟增加

**Q4: 如何处理多 Agent 系统中的冲突和一致性问题？**

**参考答案：**

1. **乐观并发控制（OCC）**
   - 使用版本号检测冲突
   - 冲突时重试或合并

2. **两阶段提交（2PC）**
   - 准备阶段：各 Agent 预执行并锁定资源
   - 提交阶段：统一提交或回滚

3. **最终一致性**
   - 允许短暂不一致
   - 通过事件溯源恢复一致性

4. **冲突解决策略**
   - 最后写入者胜（LWW）
   - 自定义合并逻辑
   - 人工介入

### 10.5.3 实战问题

**Q5: 设计一个支持 100+ Agent 的大规模协作系统，你会考虑哪些关键因素？**

**参考答案：**

1. **架构层面**
   - 分层架构：边缘 Agent + 区域协调器 + 全局控制器
   - 服务网格：Agent 间通信通过 sidecar 代理
   - 负载均衡：动态分配任务到空闲 Agent

2. **通信层面**
   - 使用消息队列（Kafka/RabbitMQ）削峰填谷
   - 实现 gossip 协议进行状态传播
   - 压缩消息减少网络开销

3. **状态管理**
   - 分布式缓存（Redis Cluster）
   - 事件溯源 + CQRS 模式
   - 状态分片减少单点压力

4. **可观测性**
   - 分布式追踪（OpenTelemetry）
   - 集中式日志聚合
   - 实时监控和告警

5. **容错设计**
   - Agent 健康检查与自动重启
   - 断路器模式防止级联失败
   - 优雅降级策略

---

## 10.6 小结

本章深入探讨了多 Agent 协作与工作流编排的核心概念：

1. **设计模式**：Manager-Worker 适合集中控制，并行模式提升效率，竞争模式提高质量
2. **通信机制**：消息总线实现松耦合，共享状态管理解决数据一致性，黑板系统适合复杂问题求解
3. **工作流编排**：顺序、条件分支、循环三种基本模式可以组合应对各种业务场景
4. **实战应用**：通过「产品经理+架构师+程序员」案例展示了完整的多 Agent 协作流程

多 Agent 系统的核心挑战在于**协调**与**一致性**，需要在灵活性、性能和可靠性之间找到平衡点。随着 AI Agent 技术的发展，多 Agent 协作将成为解决复杂问题的重要范式。

---

**参考资源：**
- [AutoGen: Multi-Agent Conversation Framework](https://microsoft.github.io/autogen/)
- [CrewAI: Multi-Agent Systems](https://docs.crewai.com/)
- [LangGraph: Building Language Agents as Graphs](https://langchain-ai.github.io/langgraph/)
- [Multi-Agent Reinforcement Learning](https://www.marl-book.com/)
