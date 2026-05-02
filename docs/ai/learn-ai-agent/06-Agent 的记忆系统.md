# 06-Agent 的记忆系统

记忆系统是 Agent 实现个性化交互和持续学习的关键组件。本章深入探讨短期记忆与长期记忆的设计原理、实现方式以及向量数据库的选型策略。

---

## 1. 记忆系统概述

### 1.1 为什么 Agent 需要记忆？

| 场景 | 无记忆的问题 | 有记忆的优势 |
|------|-------------|-------------|
| 多轮对话 | 每次提问都要重复背景 | 自动理解上下文 |
| 用户偏好 | 反复询问相同设置 | 记住用户习惯 |
| 任务执行 | 无法追踪执行历史 | 基于历史决策优化 |
| 知识积累 | 每次从零开始 | 持续学习进化 |

### 1.2 记忆的分类

```
┌─────────────────────────────────────────┐
│           Agent 记忆系统                │
├─────────────────┬───────────────────────┤
│    短期记忆     │       长期记忆        │
│  (Working Mem)  │    (Long-term Mem)    │
├─────────────────┼───────────────────────┤
│ • Buffer Memory │ • Vector Store        │
│ • 滑动窗口      │ • 知识图谱            │
│ • Token 限制    │ • 外部数据库          │
│ • 会话级        │ • 持久化存储          │
└─────────────────┴───────────────────────┘
```

---

## 2. 短期记忆实现

### 2.1 Buffer Memory（缓冲区记忆）

最简单的短期记忆实现，直接存储对话历史。

```python
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class Message:
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: float

class BufferMemory:
    """基础缓冲区记忆"""
    
    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        self.messages: List[Message] = []
    
    def add_message(self, role: str, content: str):
        """添加新消息，自动淘汰旧消息"""
        import time
        msg = Message(role, content, time.time())
        self.messages.append(msg)
        
        # FIFO 淘汰
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
    
    def get_context(self) -> List[Dict]:
        """获取当前记忆内容"""
        return [
            {"role": msg.role, "content": msg.content}
            for msg in self.messages
        ]
    
    def clear(self):
        """清空记忆"""
        self.messages = []

# 使用示例
memory = BufferMemory(max_messages=5)
memory.add_message("user", "你好，我是张三")
memory.add_message("assistant", "你好张三，有什么可以帮你的？")
memory.add_message("user", "我喜欢Python编程")

print(memory.get_context())
```

### 2.2 滑动窗口记忆

更智能的短期记忆，支持按 Token 数量或时间窗口管理。

```python
import tiktoken
from typing import List, Optional

class SlidingWindowMemory:
    """滑动窗口记忆 - 基于 Token 数量管理"""
    
    def __init__(self, 
                 max_tokens: int = 4000,
                 model: str = "gpt-3.5-turbo"):
        self.max_tokens = max_tokens
        self.encoder = tiktoken.encoding_for_model(model)
        self.messages: List[Message] = []
    
    def count_tokens(self, text: str) -> int:
        """计算文本的 Token 数量"""
        return len(self.encoder.encode(text))
    
    def add_message(self, role: str, content: str):
        """添加消息，自动滑动窗口"""
        import time
        msg = Message(role, content, time.time())
        self.messages.append(msg)
        
        # 滑动窗口：移除超出 Token 限制的旧消息
        self._slide_window()
    
    def _slide_window(self):
        """滑动窗口核心逻辑"""
        total_tokens = 0
        cutoff_index = 0
        
        # 从后往前计算，找到需要保留的消息起始位置
        for i in range(len(self.messages) - 1, -1, -1):
            msg = self.messages[i]
            msg_tokens = self.count_tokens(msg.content)
            total_tokens += msg_tokens
            
            if total_tokens > self.max_tokens:
                cutoff_index = i + 1
                break
        
        # 移除超出限制的消息
        if cutoff_index > 0:
            self.messages = self.messages[cutoff_index:]
    
    def get_context(self, system_prompt: Optional[str] = None) -> List[Dict]:
        """获取带系统提示的上下文"""
        context = []
        if system_prompt:
            context.append({"role": "system", "content": system_prompt})
        
        context.extend([
            {"role": msg.role, "content": msg.content}
            for msg in self.messages
        ])
        return context

# 使用示例
memory = SlidingWindowMemory(max_tokens=1000)
memory.add_message("user", "请帮我写一个Python函数...")
memory.add_message("assistant", "当然可以，请告诉我具体需求...")
```

### 2.3 对话摘要记忆

当对话过长时，自动摘要历史内容。

```python
from transformers import pipeline

class SummaryMemory:
    """摘要记忆 - 自动压缩长对话"""
    
    def __init__(self, 
                 buffer_size: int = 6,
                 summary_threshold: int = 10):
        self.buffer_size = buffer_size
        self.summary_threshold = summary_threshold
        self.recent_messages: List[Message] = []
        self.summary: str = ""
        # self.summarizer = pipeline("summarization")  # 可选
    
    def add_message(self, role: str, content: str):
        import time
        self.recent_messages.append(
            Message(role, content, time.time())
        )
        
        # 触发摘要
        if len(self.recent_messages) >= self.summary_threshold:
            self._summarize()
    
    def _summarize(self):
        """生成摘要"""
        # 将旧消息转为摘要
        old_messages = self.recent_messages[:-self.buffer_size]
        self.recent_messages = self.recent_messages[-self.buffer_size:]
        
        # 简单拼接作为摘要（生产环境使用 LLM 生成）
        conversation = "\n".join([
            f"{msg.role}: {msg.content}" 
            for msg in old_messages
        ])
        
        self.summary += f"\n[历史摘要] {conversation[:200]}..."
    
    def get_context(self) -> List[Dict]:
        """获取上下文：摘要 + 近期消息"""
        context = []
        
        if self.summary:
            context.append({
                "role": "system", 
                "content": f"历史对话摘要：{self.summary}"
            })
        
        context.extend([
            {"role": msg.role, "content": msg.content}
            for msg in self.recent_messages
        ])
        
        return context
```

---

## 3. 长期记忆：Vector Store 集成

### 3.1 向量数据库原理

```
文本 → Embedding 模型 → 向量 (1536/768/1024 维)
                            ↓
                    向量相似度搜索 (Cosine/Manhattan)
                            ↓
                    召回最相关的记忆片段
```

### 3.2 Pinecone 集成

```python
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI
import numpy as np

class PineconeMemory:
    """基于 Pinecone 的长期记忆"""
    
    def __init__(self, 
                 api_key: str,
                 index_name: str = "agent-memory",
                 dimension: int = 1536):
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.dimension = dimension
        self.openai = OpenAI()
        
        # 创建索引
        self._ensure_index()
        self.index = self.pc.Index(index_name)
    
    def _ensure_index(self):
        """确保索引存在"""
        if self.index_name not in self.pc.list_indexes().names():
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
    
    def _get_embedding(self, text: str) -> List[float]:
        """获取文本的 Embedding"""
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    def add_memory(self, 
                   text: str, 
                   metadata: Dict = None,
                   namespace: str = "default"):
        """添加记忆"""
        import uuid
        
        embedding = self._get_embedding(text)
        
        self.index.upsert(
            vectors=[{
                "id": str(uuid.uuid4()),
                "values": embedding,
                "metadata": metadata or {"text": text}
            }],
            namespace=namespace
        )
    
    def search_memory(self, 
                      query: str, 
                      top_k: int = 5,
                      namespace: str = "default") -> List[Dict]:
        """搜索相关记忆"""
        embedding = self._get_embedding(query)
        
        results = self.index.query(
            vector=embedding,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True
        )
        
        return [
            {
                "id": match.id,
                "score": match.score,
                "text": match.metadata.get("text", "")
            }
            for match in results.matches
        ]

# 使用示例
memory = PineconeMemory(api_key="your-pinecone-key")

# 存储用户偏好
memory.add_memory(
    "用户张三喜欢Python编程，偏好简洁的代码风格",
    metadata={"user_id": "zhangsan", "type": "preference"},
    namespace="user_preferences"
)

# 检索相关记忆
results = memory.search_memory(
    "张三喜欢什么编程语言？",
    namespace="user_preferences"
)
print(results)
```

### 3.3 Milvus 集成（开源替代）

```python
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection

class MilvusMemory:
    """基于 Milvus 的长期记忆（开源免费）"""
    
    def __init__(self, 
                 host: str = "localhost",
                 port: str = "19530",
                 collection_name: str = "agent_memory"):
        connections.connect(host=host, port=port)
        self.collection_name = collection_name
        self._ensure_collection()
        self.collection = Collection(collection_name)
    
    def _ensure_collection(self):
        """确保集合存在"""
        from pymilvus import utility
        
        if utility.has_collection(self.collection_name):
            return
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=36, is_primary=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=4096),
            FieldSchema(name="user_id", dtype=DataType.VARCHAR, max_length=64),
        ]
        
        schema = CollectionSchema(fields, "Agent Memory Collection")
        collection = Collection(self.collection_name, schema)
        
        # 创建索引
        index_params = {
            "metric_type": "COSINE",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
    
    def add_memory(self, text: str, user_id: str = "default"):
        """添加记忆"""
        import uuid
        from openai import OpenAI
        
        openai = OpenAI()
        embedding = openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        ).data[0].embedding
        
        entities = [
            [str(uuid.uuid4())],  # id
            [embedding],          # embedding
            [text],               # text
            [user_id]             # user_id
        ]
        
        self.collection.insert(entities)
        self.collection.flush()
    
    def search(self, query: str, user_id: str = None, top_k: int = 5):
        """搜索记忆"""
        from openai import OpenAI
        
        openai = OpenAI()
        embedding = openai.embeddings.create(
            model="text-embedding-3-small",
            input=query
        ).data[0].embedding
        
        self.collection.load()
        
        search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
        
        expr = f'user_id == "{user_id}"' if user_id else None
        
        results = self.collection.search(
            data=[embedding],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=expr,
            output_fields=["text"]
        )
        
        return [
            {"text": hit.entity.get("text"), "score": hit.score}
            for hit in results[0]
        ]
```

### 3.4 向量数据库选型对比

| 特性 | Pinecone | Milvus | Chroma | Weaviate |
|------|----------|--------|--------|----------|
| **托管方式** | 全托管 SaaS | 自托管/云服务 | 本地/嵌入式 | 自托管/云服务 |
| **开源** | ❌ 商业 | ✅ Apache 2.0 | ✅ Apache 2.0 | ✅ BSD |
| **成本** | 按量付费 | 免费/企业版 | 免费 | 免费/企业版 |
| **扩展性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **适用场景** | 生产环境快速上线 | 大规模企业应用 | 原型开发/本地 | 多模态应用 |

---

## 4. 记忆压缩与摘要技术

### 4.1 分层记忆架构

```python
class HierarchicalMemory:
    """分层记忆系统"""
    
    def __init__(self):
        # L1: 即时记忆（当前对话轮次）
        self.immediate = BufferMemory(max_messages=3)
        
        # L2: 短期记忆（当前会话）
        self.short_term = SlidingWindowMemory(max_tokens=4000)
        
        # L3: 工作记忆（会话摘要）
        self.working = SummaryMemory()
        
        # L4: 长期记忆（向量数据库）
        self.long_term = None  # Pinecone/Milvus
    
    def process_input(self, user_input: str) -> List[Dict]:
        """处理输入，构建完整上下文"""
        context = []
        
        # 1. 系统提示
        context.append({
            "role": "system",
            "content": self._build_system_prompt()
        })
        
        # 2. 长期记忆（相关历史）
        if self.long_term:
            relevant = self.long_term.search_memory(user_input)
            if relevant:
                context.append({
                    "role": "system",
                    "content": f"相关历史记忆：{relevant}"
                })
        
        # 3. 工作记忆（会话摘要）
        context.extend(self.working.get_context())
        
        # 4. 短期记忆（近期对话）
        context.extend(self.short_term.get_context())
        
        # 5. 即时记忆（当前轮次）
        context.extend(self.immediate.get_context())
        
        # 6. 当前输入
        context.append({"role": "user", "content": user_input})
        
        return context
```

### 4.2 智能摘要策略

```python
class SmartSummarizer:
    """智能摘要器 - 使用 LLM 生成高质量摘要"""
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    def summarize(self, messages: List[Message], 
                  focus: str = "general") -> str:
        """
        生成对话摘要
        focus: general(通用) | preferences(偏好) | tasks(任务)
        """
        conversation = self._format_messages(messages)
        
        prompts = {
            "general": "总结以下对话的关键信息：",
            "preferences": "提取用户的偏好和习惯：",
            "tasks": "总结已完成的任务和待办事项："
        }
        
        prompt = f"""{prompts.get(focus, prompts['general'])}

对话内容：
{conversation}

请生成简洁的摘要，保留关键信息："""
        
        response = self.llm.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content
    
    def extract_facts(self, text: str) -> List[str]:
        """提取结构化事实"""
        prompt = f"""从以下文本中提取关键事实，每行一个：

{text}

事实列表："""
        
        response = self.llm.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        
        facts = response.choices[0].message.content.strip().split("\n")
        return [f.strip("- ") for f in facts if f.strip()]

# 使用示例
summarizer = SmartSummarizer(openai_client)

# 定期摘要
if len(memory.messages) > 10:
    summary = summarizer.summarize(
        memory.messages,
        focus="preferences"
    )
    long_term_memory.add_memory(summary)
```

---

## 5. 实战：个性化 Agent 实现

### 5.1 完整代码实现

```python
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class UserProfile:
    """用户画像"""
    user_id: str
    preferences: Dict = None
    habits: List[str] = None
    expertise: List[str] = None
    communication_style: str = "neutral"
    
    def __post_init__(self):
        if self.preferences is None:
            self.preferences = {}
        if self.habits is None:
            self.habits = []
        if self.expertise is None:
            self.expertise = []

class PersonalizedAgent:
    """记得用户偏好的个性化 Agent"""
    
    def __init__(self, 
                 vector_store,
                 llm_client,
                 user_id: str = "default"):
        self.vector_store = vector_store
        self.llm = llm_client
        self.user_id = user_id
        self.profile: Optional[UserProfile] = None
        
        # 记忆组件
        self.short_memory = SlidingWindowMemory(max_tokens=3000)
        self.summarizer = SmartSummarizer(llm_client)
        
        # 加载用户画像
        self._load_profile()
    
    def _load_profile(self):
        """从长期记忆加载用户画像"""
        results = self.vector_store.search(
            query="user_profile",
            user_id=self.user_id,
            top_k=1
        )
        
        if results:
            profile_data = json.loads(results[0]["text"])
            self.profile = UserProfile(**profile_data)
        else:
            self.profile = UserProfile(user_id=self.user_id)
    
    def _save_profile(self):
        """保存用户画像到长期记忆"""
        profile_text = json.dumps({
            "user_id": self.profile.user_id,
            "preferences": self.profile.preferences,
            "habits": self.profile.habits,
            "expertise": self.profile.expertise,
            "communication_style": self.profile.communication_style
        })
        
        self.vector_store.add_memory(
            text=profile_text,
            metadata={
                "user_id": self.user_id,
                "type": "profile"
            }
        )
    
    def _extract_preferences(self, message: str) -> Dict:
        """从消息中提取用户偏好"""
        prompt = f"""分析用户消息，提取显性或隐性的偏好：

用户消息：{message}

请提取以下信息（JSON格式）：
{{
    "preferences": {{"键": "值"}},
    "habits": ["习惯1", "习惯2"],
    "expertise": ["领域1", "领域2"],
    "communication_style": "formal/casual/technical"
}}

如果无法提取某项，返回空值。"""
        
        response = self.llm.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _build_personalized_prompt(self) -> str:
        """构建个性化系统提示"""
        profile_info = []
        
        if self.profile.preferences:
            prefs = ", ".join([f"{k}={v}" for k, v in self.profile.preferences.items()])
            profile_info.append(f"用户偏好：{prefs}")
        
        if self.profile.habits:
            profile_info.append(f"用户习惯：{', '.join(self.profile.habits)}")
        
        if self.profile.expertise:
            profile_info.append(f"专业领域：{', '.join(self.profile.expertise)}")
        
        style_guide = {
            "formal": "使用正式、礼貌的语言",
            "casual": "使用轻松、友好的语气",
            "technical": "可以使用专业术语和详细解释"
        }
        
        base_prompt = f"""你是一个智能助手，正在为用户 {self.user_id} 提供服务。

{"\n".join(profile_info)}

沟通风格：{style_guide.get(self.profile.communication_style, "保持自然友好")}

请记住用户的偏好，提供个性化服务。"""
        
        return base_prompt
    
    def chat(self, user_message: str) -> str:
        """处理用户消息并返回回复"""
        # 1. 提取并更新用户偏好
        extracted = self._extract_preferences(user_message)
        self._update_profile(extracted)
        
        # 2. 检索相关历史记忆
        relevant_memories = self.vector_store.search(
            query=user_message,
            user_id=self.user_id,
            top_k=3
        )
        
        # 3. 构建上下文
        messages = [
            {"role": "system", "content": self._build_personalized_prompt()}
        ]
        
        if relevant_memories:
            memory_context = "\n".join([m["text"] for m in relevant_memories])
            messages.append({
                "role": "system",
                "content": f"相关历史记忆：{memory_context}"
            })
        
        messages.extend(self.short_memory.get_context())
        messages.append({"role": "user", "content": user_message})
        
        # 4. 调用 LLM
        response = self.llm.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        
        assistant_message = response.choices[0].message.content
        
        # 5. 更新短期记忆
        self.short_memory.add_message("user", user_message)
        self.short_memory.add_message("assistant", assistant_message)
        
        # 6. 定期保存到长期记忆
        if len(self.short_memory.messages) % 5 == 0:
            self._persist_memories()
        
        return assistant_message
    
    def _update_profile(self, extracted: Dict):
        """更新用户画像"""
        if extracted.get("preferences"):
            self.profile.preferences.update(extracted["preferences"])
        
        if extracted.get("habits"):
            self.profile.habits.extend(extracted["habits"])
            self.profile.habits = list(set(self.profile.habits))
        
        if extracted.get("expertise"):
            self.profile.expertise.extend(extracted["expertise"])
            self.profile.expertise = list(set(self.profile.expertise))
        
        if extracted.get("communication_style"):
            self.profile.communication_style = extracted["communication_style"]
    
    def _persist_memories(self):
        """持久化记忆"""
        # 保存用户画像
        self._save_profile()
        
        # 摘要并保存对话
        if len(self.short_memory.messages) > 5:
            summary = self.summarizer.summarize(
                self.short_memory.messages,
                focus="preferences"
            )
            self.vector_store.add_memory(
                text=summary,
                metadata={
                    "user_id": self.user_id,
                    "type": "conversation_summary",
                    "timestamp": datetime.now().isoformat()
                }
            )

# 使用示例
"""
# 初始化
agent = PersonalizedAgent(
    vector_store=milvus_memory,
    llm_client=openai_client,
    user_id="zhangsan"
)

# 多轮对话
print(agent.chat("你好，我喜欢简洁的回答，不喜欢太啰嗦"))
print(agent.chat("请介绍一下Python的装饰器"))
print(agent.chat("我上周问过类似的问题，还记得吗？"))
"""
```

### 5.2 记忆可视化

```python
import matplotlib.pyplot as plt
from collections import defaultdict

class MemoryVisualizer:
    """记忆可视化工具"""
    
    def __init__(self, agent: PersonalizedAgent):
        self.agent = agent
    
    def plot_memory_hierarchy(self):
        """可视化记忆层级"""
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        
        # L1: 即时记忆
        ax1 = axes[0, 0]
        immediate = self.agent.short_memory.messages[-3:]
        ax1.barh(range(len(immediate)), [1]*len(immediate))
        ax1.set_yticks(range(len(immediate)))
        ax1.set_yticklabels([m.content[:20] + "..." for m in immediate])
        ax1.set_title("L1: Immediate Memory")
        
        # L2: 短期记忆 Token 分布
        ax2 = axes[0, 1]
        tokens = [self.agent.short_memory.count_tokens(m.content) 
                  for m in self.agent.short_memory.messages]
        ax2.plot(tokens, marker='o')
        ax2.axhline(y=self.agent.short_memory.max_tokens, color='r', linestyle='--')
        ax2.set_title("L2: Short-term Memory (Tokens)")
        ax2.set_xlabel("Message Index")
        ax2.set_ylabel("Token Count")
        
        # L3: 用户画像
        ax3 = axes[1, 0]
        profile = self.agent.profile
        categories = ['Preferences', 'Habits', 'Expertise']
        values = [
            len(profile.preferences),
            len(profile.habits),
            len(profile.expertise)
        ]
        ax3.bar(categories, values)
        ax3.set_title("L3: User Profile")
        
        # L4: 记忆时间线
        ax4 = axes[1, 1]
        ax4.text(0.5, 0.5, f"User: {profile.user_id}\n"
                          f"Style: {profile.communication_style}\n"
                          f"Total Interactions: {len(self.agent.short_memory.messages)}",
                ha='center', va='center', fontsize=12)
        ax4.set_title("L4: Long-term Stats")
        ax4.axis('off')
        
        plt.tight_layout()
        plt.savefig('memory_hierarchy.png')
        plt.show()
```

---

## 6. 面试考点

### 6.1 记忆系统设计

**Q1: 如何设计一个支持百万用户的 Agent 记忆系统？**

```
架构要点：
┌─────────────────────────────────────────┐
│           API Gateway                   │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌─────────┐         ┌──────────┐
│ User A  │         │ User B   │
│ Session │         │ Session  │
│ Memory  │         │ Memory   │
└────┬────┘         └────┬─────┘
     │                   │
     └─────────┬─────────┘
               ▼
    ┌─────────────────────┐
    │   Memory Service    │
    │  ┌───────────────┐  │
    │  │  Cache Layer  │  │  ← Redis
    │  │  (Hot Data)   │  │
    │  └───────┬───────┘  │
    │          ▼           │
    │  ┌───────────────┐  │
    │  │ Vector Store  │  │  ← Milvus/Pinecone
    │  │  (Cold Data)  │  │
    │  └───────────────┘  │
    └─────────────────────┘
```

**关键设计决策：**
1. **分片策略**：按 user_id 哈希分片，确保同一用户数据在同一节点
2. **冷热分离**：近期对话放 Redis（热），历史记忆放向量库（冷）
3. **异步写入**：长期记忆异步批量写入，降低延迟
4. **TTL 机制**：短期记忆设置过期时间，自动清理

**Q2: 如何处理记忆的遗忘与更新？**

```python
class ForgetfulMemory:
    """支持遗忘的记忆系统"""
    
    def __init__(self):
        self.memories = {}
        self.access_count = defaultdict(int)
        self.last_access = {}
    
    def access(self, memory_id: str):
        """访问记忆，更新权重"""
        self.access_count[memory_id] += 1
        self.last_access[memory_id] = time.time()
    
    def should_forget(self, memory_id: str) -> bool:
        """判断是否应该遗忘"""
        # LRU + LFU 结合策略
        time_decay = time.time() - self.last_access.get(memory_id, 0)
        frequency = self.access_count[memory_id]
        
        # 低频且长时间未访问的记忆被遗忘
        return time_decay > 86400 * 30 and frequency < 3  # 30天访问<3次
    
    def consolidate(self):
        """记忆巩固：高频记忆加强，低频记忆弱化"""
        for memory_id in list(self.memories.keys()):
            if self.should_forget(memory_id):
                del self.memories[memory_id]
                del self.access_count[memory_id]
```

### 6.2 向量数据库选型

**Q3: Pinecone vs Milvus 如何选择？**

| 维度 | Pinecone | Milvus |
|------|----------|--------|
| **运维成本** | 低（全托管） | 高（需自建） |
| **数据隐私** | 数据在云端 | 可完全私有部署 |
| **成本控制** | 按量付费，大用量贵 | 固定成本，大用量省 |
| **功能丰富度** | 基础功能完善 | 高级功能更多（GPU索引等） |
| **社区生态** | 商业支持好 | 开源社区活跃 |

**选型建议：**
- **快速上线/小规模**：Pinecone
- **大规模/成本敏感**：Milvus
- **数据敏感/合规要求**：Milvus 私有部署
- **多模态需求**：Weaviate

**Q4: 向量索引类型如何选择？**

```
索引类型对比：

Flat (暴力搜索)
├── 优点：100% 召回，精确
├── 缺点：O(n) 复杂度，慢
└── 适用：数据量 < 10k

IVF (倒排文件)
├── 优点：O(√n) 复杂度，平衡
├── 缺点：可能丢失部分结果
└── 适用：10k - 1M 数据

HNSW (图索引)
├── 优点：O(log n) 复杂度，快
├── 缺点：内存占用大
└── 适用：1M+ 数据，内存充足

量化索引 (PQ/SQ)
├── 优点：内存节省 70%+
├── 缺点：精度略有损失
└── 适用：十亿级数据
```

### 6.3 高频面试题

**Q5: RAG 中的记忆检索如何优化？**

```python
def optimize_retrieval(query: str, vector_store):
    """多策略优化检索"""
    
    # 1. 查询扩展
    expanded_queries = generate_variations(query)
    
    # 2. 混合检索
    results = []
    for q in expanded_queries:
        vec_results = vector_store.similarity_search(q, k=10)
        results.extend(vec_results)
    
    # 3. 重排序 (Rerank)
    from sentence_transformers import CrossEncoder
    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    
    pairs = [[query, r.text] for r in results]
    scores = reranker.predict(pairs)
    
    # 4. 去重 + 取 Top-K
    seen = set()
    final_results = []
    for score, result in sorted(zip(scores, results), reverse=True):
        if result.id not in seen:
            final_results.append(result)
            seen.add(result.id)
        if len(final_results) >= 5:
            break
    
    return final_results
```

**Q6: 如何评估记忆系统的效果？**

```python
class MemoryEvaluator:
    """记忆系统评估"""
    
    def evaluate_retrieval(self, test_queries: List[Dict]):
        """评估检索质量"""
        metrics = {
            "recall@k": [],
            "precision@k": [],
            "mrr": [],  # Mean Reciprocal Rank
            "latency": []
        }
        
        for test in test_queries:
            start = time.time()
            results = self.memory.search(test["query"], top_k=10)
            latency = time.time() - start
            
            # 计算指标
            retrieved_ids = {r.id for r in results}
            relevant_ids = set(test["relevant_ids"])
            
            recall = len(retrieved_ids & relevant_ids) / len(relevant_ids)
            precision = len(retrieved_ids & relevant_ids) / len(retrieved_ids)
            
            metrics["recall@k"].append(recall)
            metrics["precision@k"].append(precision)
            metrics["latency"].append(latency)
        
        return {k: sum(v)/len(v) for k, v in metrics.items()}
    
    def evaluate_personalization(self, user_sessions: List[List[Dict]]):
        """评估个性化效果"""
        # 检查 Agent 是否记住了用户偏好
        consistency_scores = []
        
        for session in user_sessions:
            preferences = self._extract_preferences(session)
            agent_responses = [turn["agent"] for turn in session]
            
            # 检查回复是否符合偏好
            score = self._check_consistency(preferences, agent_responses)
            consistency_scores.append(score)
        
        return sum(consistency_scores) / len(consistency_scores)
```

---

## 7. 总结

### 记忆系统设计 checklist

- [ ] **短期记忆**：Buffer + 滑动窗口，控制 Token 数量
- [ ] **长期记忆**：Vector Store，支持语义检索
- [ ] **记忆压缩**：定期摘要，分层存储
- [ ] **个性化**：用户画像，偏好学习
- [ ] **隐私安全**：数据隔离，访问控制
- [ ] **性能优化**：冷热分离，异步写入

### 最佳实践

1. **渐进式记忆**：新用户从短期记忆开始，逐步建立长期记忆
2. **用户可控**：提供"忘记我"功能，尊重用户隐私
3. **可解释性**：告知用户 Agent 记住了什么
4. **持续学习**：定期更新用户画像，适应变化

---

> 💡 **延伸阅读**
> - LangChain Memory 模块文档
> - MemGPT: Towards LLMs as Operating Systems
> - Vector Database Comparison Guide
