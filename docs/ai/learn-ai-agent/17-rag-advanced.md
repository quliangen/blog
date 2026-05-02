---
title: 17-RAG 系统进阶优化
description: 检索质量优化（Query改写、重排序、多路召回）、回答质量优化（引用溯源、幻觉检测）、混合检索策略、完整实战代码
---

# 17-RAG 系统进阶优化

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级 RAG 系统开发 | ✅ 检索质量优化、回答质量优化 |
| 混合检索策略设计 | ✅ 稠密+稀疏向量混合检索 |
| 大模型幻觉控制 | ✅ 幻觉检测与引用溯源 |
| 工程化能力 | ✅ 完整可运行代码 |

## 学习目标

学完本节，你将能够：

1. **掌握检索质量优化技术**：Query改写、重排序、多路召回
2. **实现回答质量优化**：引用溯源、幻觉检测机制
3. **设计混合检索策略**：稠密向量 + 稀疏向量 + 关键词检索
4. **构建企业级 RAG 系统**：完整可运行的代码实现
5. **应对高级面试**：掌握 RAG 系统优化的核心考点

## 前置知识

- 已完成 RAG 基础章节的学习
- 具备向量数据库（如 Chroma、Milvus）使用经验
- 了解 Embedding 模型和 LLM 基础调用

---

## 一、核心概念

### 1.1 RAG 系统架构演进

```
┌─────────────────────────────────────────────────────────────┐
│                      Advanced RAG System                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ Query 改写   │───▶│ 多路召回     │───▶│   重排序(Rerank) │  │
│  │ (HyDE/扩展)  │    │ (向量+关键词) │    │  (Cross-Encoder)│  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│                                               │              │
│                                               ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  引用溯源    │◀───│  LLM 生成   │◀───│   上下文构建     │  │
│  │ (Source Map)│    │             │    │                 │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │  幻觉检测    │                                             │
│  │(Self-Check) │                                             │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 为什么需要进阶优化？

| 问题 | 影响 | 解决方案 |
|-----|------|---------|
| Query 表述不清 | 检索不到相关文档 | Query 改写、HyDE |
| 向量检索语义偏差 | 漏检相关文档 | 多路召回、混合检索 |
| 检索结果排序不准 | 优质文档被淹没 | 重排序(Rerank) |
| LLM 编造内容 | 幻觉问题 | 引用溯源、幻觉检测 |
| 无法验证答案 | 可信度低 | Source Map、置信度评分 |

---

## 二、检索质量优化

### 2.1 Query 改写（Query Transformation）

#### 2.1.1 问题背景

用户原始 Query 往往存在以下问题：
- 表述模糊、口语化
- 缺少专业术语
- 包含歧义词汇

#### 2.1.2 HyDE（Hypothetical Document Embeddings）

**原理**：让 LLM 先生成一个假设的答案文档，然后用这个文档的 Embedding 去检索。

```python
from typing import List
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import PromptTemplate

class HydeQueryTransformer:
    """HyDE 查询改写器"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
        self.embeddings = OpenAIEmbeddings()
        
        self.hyde_prompt = PromptTemplate(
            input_variables=["query"],
            template="""请根据以下问题，生成一段可能包含答案的假设文档。
这段文档应该看起来像是从知识库中检索到的真实内容。

问题：{query}

假设文档："""
        )
    
    async def transform(self, query: str) -> dict:
        """改写 Query 并返回原始和改写后的 Embedding"""
        # 生成假设文档
        hypothetical_doc = await self.llm.ainvoke(
            self.hyde_prompt.format(query=query)
        )
        
        # 获取两种 Embedding
        original_embedding = await self.embeddings.aembed_query(query)
        hyde_embedding = await self.embeddings.aembed_query(hypothetical_doc.content)
        
        return {
            "original_query": query,
            "hypothetical_document": hypothetical_doc.content,
            "original_embedding": original_embedding,
            "hyde_embedding": hyde_embedding
        }
```

#### 2.1.3 Query 扩展（Query Expansion）

```python
class QueryExpander:
    """查询扩展器 - 生成多个相关查询"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)
        
        self.expansion_prompt = PromptTemplate(
            input_variables=["query", "num_expansions"],
            template="""请为以下问题生成 {num_expansions} 个语义相同但表述不同的查询。
这些查询应该从不同角度表达相同的信息需求。

原始问题：{query}

请直接列出改写后的查询，每行一个："""
        )
    
    async def expand(self, query: str, num_expansions: int = 3) -> List[str]:
        """扩展查询"""
        response = await self.llm.ainvoke(
            self.expansion_prompt.format(
                query=query, 
                num_expansions=num_expansions
            )
        )
        
        # 解析生成的查询
        expanded_queries = [
            line.strip() for line in response.content.split('\n')
            if line.strip() and not line.strip().startswith('```')
        ]
        
        # 添加原始查询
        return [query] + expanded_queries[:num_expansions]
```

#### 2.1.4 子查询分解（Sub-query Decomposition）

```python
class SubQueryDecomposer:
    """子查询分解器 - 将复杂查询拆分为简单子查询"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.3)
        
        self.decomposition_prompt = PromptTemplate(
            input_variables=["query"],
            template="""请将以下复杂问题分解为多个简单的子问题。
每个子问题应该可以独立回答，且回答所有子问题后能够回答原问题。

复杂问题：{query}

请按 JSON 格式输出子问题列表：
{{
    "sub_queries": [
        "子问题1",
        "子问题2",
        ...
    ]
}}"""
        )
    
    async def decompose(self, query: str) -> List[str]:
        """分解查询"""
        response = await self.llm.ainvoke(
            self.decomposition_prompt.format(query=query)
        )
        
        # 解析 JSON 响应
        import json
        try:
            result = json.loads(response.content)
            return result.get("sub_queries", [query])
        except:
            return [query]
```

### 2.2 多路召回（Multi-Channel Retrieval）

#### 2.2.1 召回策略对比

| 召回方式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| 稠密向量检索 | 语义理解强 | 对关键词敏感 | 概念性问题 |
| 稀疏向量检索 | 关键词匹配准 | 语义泛化弱 | 精确匹配 |
| 关键词检索 | 简单快速 | 语义缺失 | 实体名称 |
| 图检索 | 关系推理强 | 构建成本高 | 知识图谱 |

#### 2.2.2 多路召回实现

```python
from typing import List, Dict, Any
import numpy as np
from rank_bm25 import BM25Okapi

class MultiChannelRetriever:
    """多路召回检索器"""
    
    def __init__(self, vector_store, documents: List[str]):
        self.vector_store = vector_store
        self.documents = documents
        
        # 初始化 BM25（稀疏检索）
        tokenized_docs = [doc.lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized_docs)
    
    async def retrieve_dense(self, query: str, top_k: int = 10) -> List[Dict]:
        """稠密向量检索"""
        results = await self.vector_store.asimilarity_search_with_score(
            query, k=top_k
        )
        return [
            {
                "doc": doc.page_content,
                "score": score,
                "source": "dense",
                "index": i
            }
            for i, (doc, score) in enumerate(results)
        ]
    
    def retrieve_sparse(self, query: str, top_k: int = 10) -> List[Dict]:
        """稀疏向量检索（BM25）"""
        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)
        
        # 获取 top_k 索引
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        return [
            {
                "doc": self.documents[idx],
                "score": float(scores[idx]),
                "source": "sparse",
                "index": int(idx)
            }
            for idx in top_indices if scores[idx] > 0
        ]
    
    def retrieve_keyword(self, query: str, top_k: int = 10) -> List[Dict]:
        """关键词匹配检索"""
        keywords = set(query.lower().split())
        results = []
        
        for i, doc in enumerate(self.documents):
            doc_words = set(doc.lower().split())
            match_count = len(keywords & doc_words)
            if match_count > 0:
                results.append({
                    "doc": doc,
                    "score": match_count / len(keywords),
                    "source": "keyword",
                    "index": i
                })
        
        # 排序并返回 top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
    
    async def retrieve_multi_channel(
        self, 
        query: str, 
        top_k_per_channel: int = 10,
        weights: Dict[str, float] = None
    ) -> List[Dict]:
        """多路召回融合"""
        if weights is None:
            weights = {"dense": 0.5, "sparse": 0.3, "keyword": 0.2}
        
        # 并行执行多种检索
        dense_results = await self.retrieve_dense(query, top_k_per_channel)
        sparse_results = self.retrieve_sparse(query, top_k_per_channel)
        keyword_results = self.retrieve_keyword(query, top_k_per_channel)
        
        # 融合结果（RRF - Reciprocal Rank Fusion）
        fused_results = self._reciprocal_rank_fusion(
            [dense_results, sparse_results, keyword_results],
            weights
        )
        
        return fused_results
    
    def _reciprocal_rank_fusion(
        self, 
        result_lists: List[List[Dict]], 
        weights: Dict[str, float],
        k: int = 60
    ) -> List[Dict]:
        """RRF 融合算法"""
        scores = {}
        
        for results in result_lists:
            for rank, item in enumerate(results):
                doc_id = item["index"]
                source = item["source"]
                
                if doc_id not in scores:
                    scores[doc_id] = {
                        "doc": item["doc"],
                        "score": 0,
                        "sources": []
                    }
                
                # RRF 公式: score = weight * 1/(k + rank)
                rrf_score = weights.get(source, 0.33) * (1.0 / (k + rank + 1))
                scores[doc_id]["score"] += rrf_score
                scores[doc_id]["sources"].append(source)
        
        # 转换为列表并排序
        fused = [
            {
                "doc": v["doc"],
                "score": v["score"],
                "sources": list(set(v["sources"])),
                "index": k
            }
            for k, v in scores.items()
        ]
        
        fused.sort(key=lambda x: x["score"], reverse=True)
        return fused
```

### 2.3 重排序（Reranking）

#### 2.3.1 为什么需要重排序？

- 向量检索基于 Embedding 相似度，可能忽略细粒度语义
- 重排序使用 Cross-Encoder 进行精确的 Query-Doc 匹配
- 可以显著提升检索结果的相关性

#### 2.3.2 Cross-Encoder 重排序实现

```python
from sentence_transformers import CrossEncoder

class Reranker:
    """重排序器 - 使用 Cross-Encoder 精排"""
    
    def __init__(self, model_name: str = "BAAI/bge-reranker-base"):
        # 使用开源重排序模型
        self.model = CrossEncoder(model_name)
    
    def rerank(self, query: str, documents: List[str], top_k: int = 5) -> List[Dict]:
        """对文档进行重排序"""
        if not documents:
            return []
        
        # 构建 query-doc 对
        pairs = [[query, doc] for doc in documents]
        
        # 预测相关性分数
        scores = self.model.predict(pairs)
        
        # 构建结果
        results = [
            {
                "doc": doc,
                "score": float(score),
                "rank": i
            }
            for i, (doc, score) in enumerate(zip(documents, scores))
        ]
        
        # 按分数排序
        results.sort(key=lambda x: x["score"], reverse=True)
        
        return results[:top_k]
    
    async def rerank_async(
        self, 
        query: str, 
        documents: List[str], 
        top_k: int = 5
    ) -> List[Dict]:
        """异步重排序（包装同步方法）"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.rerank, query, documents, top_k)


class LLMReranker:
    """基于 LLM 的重排序器"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        
        self.rerank_prompt = PromptTemplate(
            input_variables=["query", "doc"],
            template="""请评估以下文档与查询的相关性。

查询：{query}

文档：{doc}

请只输出一个 0-10 的整数分数，10 表示高度相关，0 表示完全不相关。
只输出数字，不要其他内容。"""
        )
    
    async def rerank(
        self, 
        query: str, 
        documents: List[str], 
        top_k: int = 5
    ) -> List[Dict]:
        """使用 LLM 进行重排序"""
        import asyncio
        
        async def score_document(doc: str) -> float:
            response = await self.llm.ainvoke(
                self.rerank_prompt.format(query=query, doc=doc)
            )
            try:
                return float(response.content.strip()) / 10.0
            except:
                return 0.0
        
        # 并发评分
        scores = await asyncio.gather(*[
            score_document(doc) for doc in documents
        ])
        
        # 构建结果
        results = [
            {
                "doc": doc,
                "score": score,
                "rank": i
            }
            for i, (doc, score) in enumerate(zip(documents, scores))
        ]
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
```

---

## 三、回答质量优化

### 3.1 引用溯源（Citation/Source Mapping）

#### 3.1.1 为什么需要引用溯源？

- **可验证性**：用户可以核实答案的来源
- **可信度**：显示答案不是 LLM 编造的
- ** Debug**：便于追踪错误来源

#### 3.1.2 引用溯源实现

```python
import re
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Source:
    """引用来源"""
    id: str
    content: str
    metadata: Dict[str, Any]
    relevance_score: float

@dataclass
class Citation:
    """引用标记"""
    text: str  # 引用的文本片段
    source_id: str
    start_idx: int  # 在答案中的起始位置
    end_idx: int    # 在答案中的结束位置

class CitationTracker:
    """引用溯源追踪器"""
    
    def __init__(self):
        self.sources: Dict[str, Source] = {}
        self.citation_pattern = re.compile(r'\[(\d+)\]')
    
    def add_source(self, source: Source):
        """添加引用源"""
        self.sources[source.id] = source
    
    def extract_citations(self, text: str) -> List[Citation]:
        """从文本中提取引用标记"""
        citations = []
        for match in self.citation_pattern.finditer(text):
            source_id = match.group(1)
            if source_id in self.sources:
                citations.append(Citation(
                    text=match.group(0),
                    source_id=source_id,
                    start_idx=match.start(),
                    end_idx=match.end()
                ))
        return citations
    
    def format_sources_section(self) -> str:
        """格式化引用来源部分"""
        if not self.sources:
            return ""
        
        lines = ["\n\n**参考来源：**"]
        for source_id, source in sorted(self.sources.items()):
            lines.append(f"\n[{source_id}] {source.content[:200]}...")
            if source.metadata.get('url'):
                lines.append(f"    链接: {source.metadata['url']}")
        
        return "\n".join(lines)


class SourceGroundedGenerator:
    """带引用溯源的生成器"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.3)
        
        self.generation_prompt = PromptTemplate(
            input_variables=["query", "context"],
            template="""请基于以下参考文档回答问题。重要规则：
1. 必须使用 [数字] 格式标注信息来源
2. 每个事实性陈述后都要添加引用
3. 如果参考文档中没有相关信息，请明确说明
4. 不要编造引用，只使用提供的文档

参考文档：
{context}

问题：{query}

请提供带引用的详细回答："""
        )
    
    def _format_context_with_ids(self, documents: List[str]) -> str:
        """为文档添加 ID 标识"""
        formatted = []
        for i, doc in enumerate(documents, 1):
            formatted.append(f"[{i}] {doc}\n")
        return "\n".join(formatted)
    
    async def generate(
        self, 
        query: str, 
        documents: List[str],
        metadata: List[Dict] = None
    ) -> Dict:
        """生成带引用的回答"""
        # 格式化上下文
        context = self._format_context_with_ids(documents)
        
        # 生成回答
        response = await self.llm.ainvoke(
            self.generation_prompt.format(query=query, context=context)
        )
        
        # 构建引用追踪器
        tracker = CitationTracker()
        for i, doc in enumerate(documents, 1):
            tracker.add_source(Source(
                id=str(i),
                content=doc,
                metadata=metadata[i-1] if metadata else {},
                relevance_score=1.0
            ))
        
        # 提取引用
        citations = tracker.extract_citations(response.content)
        
        return {
            "answer": response.content,
            "citations": citations,
            "sources": tracker.sources,
            "source_count": len(citations)
        }
```

### 3.2 幻觉检测（Hallucination Detection）

#### 3.2.1 幻觉类型

| 类型 | 描述 | 检测方法 |
|-----|------|---------|
| 事实性幻觉 | 答案与文档不符 | 事实一致性检查 |
| 引用幻觉 | 编造不存在的引用 | 引用验证 |
| 来源幻觉 | 声称有来源但实际没有 | 来源覆盖检查 |

#### 3.2.2 幻觉检测实现

```python
class HallucinationDetector:
    """幻觉检测器"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        
        # 事实一致性检测提示
        self.fact_check_prompt = PromptTemplate(
            input_variables=["claim", "evidence"],
            template="""请判断以下声明是否被证据支持。

声明：{claim}

证据：{evidence}

请判断：
1. 支持（Supported）：证据明确支持声明
2. 矛盾（Contradicted）：证据与声明矛盾
3. 未知（Unknown）：证据不足以判断

只输出判断结果和一个简短的解释。"""
        )
        
        # 自我一致性检测提示
        self.self_check_prompt = PromptTemplate(
            input_variables=["answer", "question"],
            template="""请检查以下回答是否存在幻觉（编造信息）。

问题：{question}

回答：{answer}

请分析：
1. 回答中是否有无法验证的事实？
2. 回答是否超出了问题范围？
3. 回答是否包含可能编造的细节？

请输出：
- 幻觉风险等级：高/中/低
- 风险说明："""
        )
    
    async def check_factual_consistency(
        self, 
        claim: str, 
        evidence: str
    ) -> Dict:
        """事实一致性检查"""
        response = await self.llm.ainvoke(
            self.fact_check_prompt.format(claim=claim, evidence=evidence)
        )
        
        content = response.content.lower()
        
        if "支持" in content or "supported" in content:
            status = "supported"
            confidence = 0.9
        elif "矛盾" in content or "contradicted" in content:
            status = "contradicted"
            confidence = 0.9
        else:
            status = "unknown"
            confidence = 0.5
        
        return {
            "status": status,
            "confidence": confidence,
            "explanation": response.content
        }
    
    async def check_self_consistency(
        self, 
        question: str, 
        answer: str
    ) -> Dict:
        """自我一致性检查"""
        response = await self.llm.ainvoke(
            self.self_check_prompt.format(question=question, answer=answer)
        )
        
        content = response.content.lower()
        
        if "高" in content:
            risk_level = "high"
            score = 0.3
        elif "中" in content:
            risk_level = "medium"
            score = 0.6
        else:
            risk_level = "low"
            score = 0.9
        
        return {
            "risk_level": risk_level,
            "score": score,
            "analysis": response.content
        }
    
    async def detect_hallucinations(
        self,
        answer: str,
        sources: List[str],
        question: str
    ) -> Dict:
        """综合幻觉检测"""
        # 1. 自我一致性检查
        self_check = await self.check_self_consistency(question, answer)
        
        # 2. 事实一致性检查（对关键声明）
        # 提取关键声明（简化版：按句子分割）
        claims = [s.strip() for s in answer.split('。') if s.strip()]
        
        fact_checks = []
        for claim in claims[:3]:  # 只检查前3个声明
            evidence = "\n".join(sources)
            check = await self.check_factual_consistency(claim, evidence)
            fact_checks.append({
                "claim": claim,
                "check": check
            })
        
        # 计算综合得分
        contradiction_count = sum(
            1 for fc in fact_checks 
            if fc["check"]["status"] == "contradicted"
        )
        
        hallucination_score = (
            self_check["score"] * 0.4 + 
            (1 - contradiction_count / max(len(fact_checks), 1)) * 0.6
        )
        
        return {
            "hallucination_score": hallucination_score,
            "risk_level": "high" if hallucination_score < 0.5 else 
                         "medium" if hallucination_score < 0.8 else "low",
            "self_check": self_check,
            "fact_checks": fact_checks,
            "is_hallucination": hallucination_score < 0.5
        }
```

---

## 四、混合检索策略

### 4.1 完整混合检索流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Retrieval Pipeline                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Query     │────▶│   Query     │────▶│  Multi-     │   │
│  │  Rewrite    │     │  Expansion  │     │   Channel   │   │
│  │  (HyDE)     │     │  (3-5 var)  │     │  Retrieval  │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                   │         │
│                                                   ▼         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Rerank    │◀────│    RRF      │◀────│  Dense +    │   │
│  │ (Cross-Enc) │     │   Fusion    │     │  Sparse +   │   │
│  └─────────────┘     └─────────────┘     │  Keyword    │   │
│         │                                └─────────────┘   │
│         ▼                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Source    │────▶│    LLM      │────▶│Hallucination│   │
│  │   Grounded  │     │   Generate  │     │   Detect    │   │
│  │   Context   │     │             │     │             │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 完整 RAG 系统实现

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import asyncio

class AdvancedRAGSystem:
    """高级 RAG 系统"""
    
    def __init__(self, documents: List[str]):
        self.documents = documents
        
        # 初始化组件
        self.embeddings = OpenAIEmbeddings()
        
        # 创建向量存储
        self.vector_store = Chroma.from_texts(
            documents, 
            self.embeddings
        )
        
        # 初始化检索组件
        self.multi_retriever = MultiChannelRetriever(
            self.vector_store, 
            documents
        )
        
        # 初始化重排序器
        self.reranker = Reranker()
        
        # 初始化 Query 改写器
        self.query_expander = QueryExpander()
        
        # 初始化生成器
        self.generator = SourceGroundedGenerator()
        
        # 初始化幻觉检测器
        self.hallucination_detector = HallucinationDetector()
    
    async def query(
        self, 
        user_query: str,
        enable_expansion: bool = True,
        enable_rerank: bool = True,
        top_k_final: int = 5
    ) -> Dict:
        """执行完整的 RAG 查询流程"""
        
        # Step 1: Query 扩展
        if enable_expansion:
            expanded_queries = await self.query_expander.expand(user_query, 3)
        else:
            expanded_queries = [user_query]
        
        print(f"📝 扩展查询: {expanded_queries}")
        
        # Step 2: 多路召回（对每个扩展查询）
        all_retrieved = []
        for eq in expanded_queries:
            results = await self.multi_retriever.retrieve_multi_channel(eq)
            all_retrieved.extend(results)
        
        # 去重（按文档索引）
        seen_indices = set()
        unique_results = []
        for r in all_retrieved:
            if r["index"] not in seen_indices:
                seen_indices.add(r["index"])
                unique_results.append(r)
        
        print(f"🔍 多路召回: {len(unique_results)} 篇文档")
        
        # Step 3: 重排序
        if enable_rerank and unique_results:
            docs = [r["doc"] for r in unique_results]
            reranked = await self.reranker.rerank_async(
                user_query, 
                docs, 
                top_k_final
            )
            
            # 更新结果
            final_docs = [r["doc"] for r in reranked]
            final_indices = [
                unique_results[docs.index(r["doc"])]["index"] 
                for r in reranked
            ]
        else:
            final_docs = [r["doc"] for r in unique_results[:top_k_final]]
            final_indices = [r["index"] for r in unique_results[:top_k_final]]
        
        print(f"🎯 重排序后: {len(final_docs)} 篇文档")
        
        # Step 4: 生成带引用的回答
        metadata = [
            {"index": idx, "source": "retrieved"} 
            for idx in final_indices
        ]
        generation_result = await self.generator.generate(
            user_query, 
            final_docs, 
            metadata
        )
        
        # Step 5: 幻觉检测
        hallucination_check = await self.hallucination_detector.detect_hallucinations(
            generation_result["answer"],
            final_docs,
            user_query
        )
        
        # 构建最终响应
        return {
            "query": user_query,
            "expanded_queries": expanded_queries,
            "retrieved_count": len(unique_results),
            "used_documents": final_docs,
            "answer": generation_result["answer"],
            "citations": generation_result["citations"],
            "sources": generation_result["sources"],
            "hallucination_check": hallucination_check,
            "is_safe": not hallucination_check["is_hallucination"]
        }


# ==================== 使用示例 ====================

async def main():
    """完整使用示例"""
    
    # 示例文档
    documents = [
        "Python 是一种高级编程语言，由 Guido van Rossum 于 1991 年创建。",
        "Python 的设计哲学强调代码的可读性和简洁性。",
        "Python 支持多种编程范式，包括面向对象、函数式和过程式编程。",
        "机器学习是人工智能的一个分支，专注于让计算机从数据中学习。",
        "深度学习是机器学习的一个子集，使用多层神经网络。",
        "PyTorch 和 TensorFlow 是流行的深度学习框架。",
        "RAG（检索增强生成）是一种结合检索和生成的 AI 技术。",
        "向量数据库用于存储和检索高维向量数据。",
        "Embedding 是将文本转换为向量的技术。",
        "Transformer 是一种基于注意力机制的神经网络架构。"
    ]
    
    # 初始化系统
    print("🚀 初始化 Advanced RAG 系统...")
    rag_system = AdvancedRAGSystem(documents)
    
    # 执行查询
    query = "Python 是什么时候创建的？它有什么特点？"
    print(f"\n❓ 用户查询: {query}\n")
    
    result = await rag_system.query(query)
    
    # 输出结果
    print("=" * 50)
    print("📤 最终回答:")
    print(result["answer"])
    print("=" * 50)
    
    print(f"\n✅ 幻觉检测: {result['hallucination_check']['risk_level']}")
    print(f"   置信度: {result['hallucination_check']['hallucination_score']:.2f}")
    
    print(f"\n📚 引用来源:")
    for cid, source in result["sources"].items():
        print(f"   [{cid}] {source.content[:50]}...")


if __name__ == "__main__":
    # 运行示例
    asyncio.run(main())
```

---

## 五、避坑指南

### 5.1 常见错误

| 错误 | 原因 | 解决方案 |
|-----|------|---------|
| Query 改写过度 | 改写后偏离原意 | 设置语义相似度阈值，保留原始 Query |
| 多路召回冗余 | 各路结果高度重复 | 使用去重机制，限制每路召回数量 |
| 重排序计算慢 | Cross-Encoder 计算量大 | 先粗排再精排，限制重排序文档数 |
| 引用标注混乱 | LLM 不遵循引用格式 | Few-shot 示例，严格格式校验 |
| 幻觉检测误报 | 检测标准过严 | 多维度综合判断，设置合理阈值 |

### 5.2 性能优化建议

```python
# 1. 缓存 Embedding
from functools import lru_cache

class CachedEmbeddings:
    def __init__(self, embeddings):
        self.embeddings = embeddings
        self.cache = {}
    
    async def aembed_query(self, text: str):
        if text not in self.cache:
            self.cache[text] = await self.embeddings.aembed_query(text)
        return self.cache[text]

# 2. 异步并行处理
async def parallel_retrieve(queries: List[str]):
    tasks = [retrieve(q) for q in queries]
    return await asyncio.gather(*tasks)

# 3. 批量重排序
def batch_rerank(query: str, docs: List[str], batch_size: int = 32):
    results = []
    for i in range(0, len(docs), batch_size):
        batch = docs[i:i+batch_size]
        results.extend(reranker.rerank(query, batch))
    return results
```

---

## 六、面试考点

### Q1: 什么是 HyDE？它解决了什么问题？

**参考答案：**

HyDE（Hypothetical Document Embeddings）是一种 Query 改写技术。

**原理**：
1. 使用 LLM 根据用户 Query 生成一个假设的答案文档
2. 用这个假设文档的 Embedding 去检索相似的真实文档
3. 返回真实文档给用户

**解决的问题**：
- Query 与文档的表述差异（词汇鸿沟）
- 用户 Query 过于简短，语义信息不足
- 提高检索的召回率

**优缺点**：
- 优点：提升检索效果，特别是短 Query
- 缺点：增加一次 LLM 调用，成本较高；假设文档质量依赖 LLM 能力

### Q2: 多路召回中的 RRF 融合算法是什么？

**参考答案：**

RRF（Reciprocal Rank Fusion，倒数排序融合）是一种多路召回结果融合算法。

**公式**：
```
RRF_score(d) = Σ(1 / (k + rank_i(d)))
```
其中：
- k 是常数（通常取 60）
- rank_i(d) 是文档 d 在第 i 路召回中的排名

**优点**：
- 不需要归一化不同召回路的分数
- 对排名位置敏感，高排名的文档贡献更大
- 简单高效，无需训练

### Q3: 重排序（Rerank）为什么比向量检索更准？

**参考答案：**

**向量检索（Bi-Encoder）**：
- 独立编码 Query 和 Document
- 使用点积或余弦相似度计算匹配度
- 速度快，适合大规模召回
- 缺点：无法捕捉 Query 和 Document 的细粒度交互

**重排序（Cross-Encoder）**：
- 将 Query 和 Document 拼接后一起编码
- 通过注意力机制捕捉词级别的交互
- 精度高，但计算量大
- 适合小规模的精排

**使用策略**：
- 先用向量检索快速召回 Top-K
- 再用 Cross-Encoder 精排

### Q4: 如何检测和减少 RAG 中的幻觉？

**参考答案：**

**检测方法**：
1. **事实一致性检查**：对比答案与检索文档的事实是否一致
2. **引用验证**：检查答案中的引用是否真实存在
3. **自我一致性**：让 LLM 自我检查答案的合理性
4. **置信度评分**：对答案的每个声明进行可信度评分

**减少方法**：
1. **引用溯源**：强制 LLM 标注信息来源
2. **Source Grounding**：限制 LLM 只能基于检索内容回答
3. **Temperature 控制**：降低生成随机性
4. **多轮验证**：对关键信息进行多次验证

### Q5: 混合检索策略中稠密和稀疏向量的区别？

**参考答案：**

| 维度 | 稠密向量（Dense） | 稀疏向量（Sparse） |
|-----|------------------|-------------------|
| 表示 | 固定维度的连续向量 | 高维稀疏向量（如词袋） |
| 模型 | BERT、Sentence-BERT | BM25、TF-IDF、SPLADE |
| 语义 | 语义理解强 | 关键词匹配准 |
| 训练 | 需要预训练模型 | 无需训练或轻量训练 |
| 存储 | 相对较小 | 可能很大（词汇表大小） |
| 适用 | 概念性、语义性查询 | 精确匹配、实体查询 |

**最佳实践**：
- 稠密向量用于语义匹配
- 稀疏向量用于关键词匹配
- 两者结合使用 RRF 融合

---

## 七、扩展阅读

### 官方文档

- [LangChain RAG 文档](https://python.langchain.com/docs/use_cases/question_answering/)
- [Sentence Transformers](https://www.sbert.net/)
- [Chroma DB 文档](https://docs.trychroma.com/)

### 论文推荐

1. **HyDE**: "Precise Zero-Shot Dense Retrieval without Relevance Labels"
2. **RRF**: "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods"
3. **RAG**: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"

### 开源工具

- **Reranker**: BGE-Reranker, Cohere Rerank
- **向量数据库**: Milvus, Pinecone, Weaviate
- **评估工具**: RAGAS, TruLens

---

## 八、课后练习

1. **实现 HyDE 改写器**
   - 使用 GPT 生成假设文档
   - 对比改写前后的检索效果

2. **搭建多路召回系统**
   - 实现稠密 + 稀疏 + 关键词三路召回
   - 使用 RRF 融合结果

3. **添加引用溯源功能**
   - 修改 Prompt 强制 LLM 添加引用
   - 实现引用验证和格式化输出

4. **幻觉检测实践**
   - 实现事实一致性检查
   - 对生成的答案进行幻觉评分

5. **性能优化**
   - 添加 Embedding 缓存
   - 实现异步并行检索
   - 优化重排序的批处理

---

**总结**：本节介绍了 RAG 系统的进阶优化技术，包括检索质量优化（Query改写、多路召回、重排序）、回答质量优化（引用溯源、幻觉检测）以及混合检索策略。通过这些技术，可以构建更可靠、更准确的 RAG 系统。
