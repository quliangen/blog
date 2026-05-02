---
title: 08-RAG 系统（下）：检索与生成
description: 深入讲解 RAG 系统的检索策略（相似度、MMR、混合检索）和回答生成优化，通过实战构建技术文档问答系统
---

# 08-RAG 系统（下）：检索与生成

在上一篇文章中，我们完成了 RAG 系统的"原材料准备"——文档加载、切分和向量化存储。本文将聚焦于 RAG 的"核心大脑"：如何精准检索相关信息，并让 LLM 生成高质量回答。

---

## 一、岗位能力对标

| 能力维度 | 初级工程师 | 中级工程师 | 高级工程师 |
|---------|-----------|-----------|-----------|
| 检索策略 | 能使用基础相似度检索 | 掌握 MMR、混合检索等高级策略 | 能设计多路召回架构，优化检索效果 |
| 生成优化 | 能拼接 Prompt 调用 LLM | 掌握上下文压缩、重排序等技巧 | 能设计完整的生成优化 pipeline |
| 系统架构 | 能搭建基础 RAG Demo | 能构建生产级 RAG 系统 | 能设计可扩展的 RAG 平台 |
| 问题诊断 | 能识别明显的检索问题 | 能分析召回率和精确率问题 | 能系统性优化端到端效果 |

---

## 二、学习目标

完成本文学习后，你将能够：

1. **掌握多种检索策略**：相似度检索、MMR 多样性检索、混合检索的原理和应用场景
2. **优化回答生成**：上下文压缩、重排序、Prompt 工程技巧
3. **构建完整系统**：从零搭建技术文档问答系统
4. **诊断系统问题**：识别和解决检索-生成链路中的常见问题

---

## 三、前置知识

学习本文前，请确保你已掌握：

- **RAG 基础概念**：理解索引和检索的基本流程（参考上一篇文章）
- **向量数据库**：了解 Chroma、Milvus 等向量数据库的基本使用
- **LangChain 基础**：熟悉 Document、Retriever、Chain 等核心概念
- **Python 异步编程**：了解 async/await 基本用法

---

## 四、核心概念

### 4.1 检索策略全景

```
┌─────────────────────────────────────────────────────────────────┐
│                        检索策略全景图                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   相似度检索     │  │   MMR 检索      │  │   混合检索      │ │
│  │  (Similarity)   │  │  (Diversity)    │  │  (Hybrid)       │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • 余弦相似度     │  │ • 相关性 vs     │  │ • 向量 + 关键词  │ │
│  │ • 欧氏距离       │  │   多样性平衡    │  │ • 多路召回融合   │ │
│  │ • 点积相似度     │  │ • 避免结果重复   │  │ • RRF 排序融合   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   重排序优化     │  │   上下文压缩     │  │   查询改写      │ │
│  │  (Reranking)    │  │  (Compression)  │  │  (Rewrite)      │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • Cross-Encoder │  │ • 文本摘要      │  │ • 扩展查询      │ │
│  │ • 精排模型      │  │ • 关键句提取    │  │ • 伪相关反馈    │ │
│  │ • 多阶段检索    │  │ • Token 控制    │  │ • 查询理解      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 相似度检索（Similarity Search）

相似度检索是最基础的向量检索方式，通过计算查询向量与文档向量的相似度，返回最相似的 Top-K 结果。

#### 4.2.1 相似度计算方法

```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def similarity_metrics_demo():
    """
    三种常用的相似度计算方法
    """
    # 示例向量
    query_vec = np.array([[1.0, 2.0, 3.0]])
    doc_vecs = np.array([
        [1.0, 2.0, 3.0],   # 完全相同
        [2.0, 3.0, 4.0],   # 较相似
        [10.0, -5.0, 0.0]  # 不相似
    ])
    
    # 1. 余弦相似度（最常用）
    # 特点：只考虑方向，不考虑长度；范围 [-1, 1]
    cos_sim = cosine_similarity(query_vec, doc_vecs)
    print(f"余弦相似度: {cos_sim[0]}")
    # 输出: [1.0, 0.992, -0.192]
    
    # 2. 欧氏距离
    # 特点：考虑向量空间中的绝对距离；越小越相似
    euclidean_dist = np.linalg.norm(doc_vecs - query_vec, axis=1)
    print(f"欧氏距离: {euclidean_dist}")
    # 输出: [0.0, 1.732, 12.083]
    
    # 3. 点积相似度
    # 特点：考虑长度和方向；值越大越相似
    dot_product = np.dot(doc_vecs, query_vec.T).flatten()
    print(f"点积相似度: {dot_product}")
    # 输出: [14.0, 20.0, 0.0]

similarity_metrics_demo()
```

**选择建议**：
- **余弦相似度**：最常用，适合语义相似度计算
- **欧氏距离**：适合需要考虑向量绝对大小的场景
- **点积相似度**：计算效率高，但受向量长度影响大

#### 4.2.2 LangChain 相似度检索

```python
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# 初始化
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-m3")
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

# 基础相似度检索
results = vectorstore.similarity_search(
    query="什么是机器学习？",
    k=5  # 返回前 5 个结果
)

# 带分数的相似度检索（返回相似度分数）
results_with_score = vectorstore.similarity_search_with_score(
    query="什么是机器学习？",
    k=5
)

for doc, score in results_with_score:
    print(f"相似度分数: {score:.4f}")
    print(f"内容: {doc.page_content[:100]}...")
    print("-" * 50)
```

### 4.3 MMR 检索（Maximal Marginal Relevance）

MMR 检索在相关性和多样性之间取得平衡，避免返回内容高度重复的结果。

#### 4.3.1 MMR 原理

```
MMR = argmax[λ * Relevance(Di) - (1-λ) * max Similarity(Di, Dj)]

其中：
- Relevance(Di): 文档 Di 与查询的相关性
- Similarity(Di, Dj): 文档 Di 与已选文档 Dj 的相似度
- λ (lambda): 相关性 vs 多样性的权衡参数（0-1）
```

**类比理解**：
想象你在餐厅点菜：
- **纯相似度检索**：只点最辣的菜，结果全是麻辣火锅、辣子鸡、水煮鱼
- **MMR 检索**：在保证口味相关的前提下，兼顾菜品多样性，最终点了麻辣火锅（主菜）、蒜蓉青菜（配菜）、酸辣汤（汤品）

#### 4.3.2 MMR 实战代码

```python
from langchain_community.vectorstores import Chroma

# MMR 检索
results = vectorstore.max_marginal_relevance_search(
    query="Python 异步编程",
    k=5,           # 返回 5 个结果
    fetch_k=20,    # 先召回 20 个候选
    lambda_mult=0.5  # 相关性 vs 多样性平衡参数
)

# lambda_mult 参数说明：
# - 0.0: 完全追求多样性
# - 0.5: 平衡相关性和多样性（推荐）
# - 1.0: 完全追求相关性（等同于普通相似度检索）

for i, doc in enumerate(results, 1):
    print(f"\n结果 {i}:")
    print(f"来源: {doc.metadata.get('source', 'unknown')}")
    print(f"内容: {doc.page_content[:150]}...")
```

#### 4.3.3 MMR vs 相似度检索对比

```python
def compare_search_methods(vectorstore, query):
    """
    对比不同检索方法的效果
    """
    print(f"查询: {query}\n")
    
    # 方法 1: 普通相似度检索
    print("=" * 60)
    print("【方法 1】普通相似度检索")
    print("=" * 60)
    similarity_results = vectorstore.similarity_search(query, k=3)
    for i, doc in enumerate(similarity_results, 1):
        print(f"\n结果 {i}: {doc.page_content[:80]}...")
    
    # 方法 2: MMR 检索（高相关性）
    print("\n" + "=" * 60)
    print("【方法 2】MMR 检索 (lambda=0.8, 偏重相关性)")
    print("=" * 60)
    mmr_high_rel = vectorstore.max_marginal_relevance_search(
        query, k=3, lambda_mult=0.8
    )
    for i, doc in enumerate(mmr_high_rel, 1):
        print(f"\n结果 {i}: {doc.page_content[:80]}...")
    
    # 方法 3: MMR 检索（高多样性）
    print("\n" + "=" * 60)
    print("【方法 3】MMR 检索 (lambda=0.3, 偏重多样性)")
    print("=" * 60)
    mmr_high_div = vectorstore.max_marginal_relevance_search(
        query, k=3, lambda_mult=0.3
    )
    for i, doc in enumerate(mmr_high_div, 1):
        print(f"\n结果 {i}: {doc.page_content[:80]}...")

# 使用示例
# compare_search_methods(vectorstore, "React Hooks 最佳实践")
```

**适用场景**：
- **普通相似度检索**：答案明确、需要最精准匹配的场景
- **MMR 高相关性**：需要一定多样性，但准确性优先
- **MMR 高多样性**：需要全面了解某个主题，避免信息单一

### 4.4 混合检索（Hybrid Search）

混合检索结合向量检索（语义匹配）和关键词检索（精确匹配），取长补短。

#### 4.4.1 为什么需要混合检索？

| 检索方式 | 优势 | 劣势 |
|---------|------|------|
| 向量检索 | 理解语义，容错性强 | 对专有名词、ID、代码等精确匹配差 |
| 关键词检索 | 精确匹配，可解释性强 | 无法理解同义词、语义变体 |

**混合检索 = 向量检索的语义理解 + 关键词检索的精确匹配**

#### 4.4.2 混合检索实现

```python
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain_community.vectorstores import Chroma

# 方法 1: 使用 EnsembleRetriever（推荐）
def create_hybrid_retriever(documents, vectorstore):
    """
    创建混合检索器：向量检索 + BM25 关键词检索
    """
    # 1. 创建 BM25 检索器（基于关键词）
    bm25_retriever = BM25Retriever.from_documents(documents)
    bm25_retriever.k = 5  # 返回 5 个结果
    
    # 2. 创建向量检索器
    vector_retriever = vectorstore.as_retriever(
        search_kwargs={"k": 5}
    )
    
    # 3. 组合成混合检索器
    # weights: 向量检索权重 0.7，BM25 权重 0.3
    hybrid_retriever = EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[0.7, 0.3]
    )
    
    return hybrid_retriever

# 使用混合检索
# hybrid_retriever = create_hybrid_retriever(documents, vectorstore)
# results = hybrid_retriever.get_relevant_documents("React useEffect")
```

#### 4.4.3 RRF 融合排序（Reciprocal Rank Fusion）

```python
from collections import defaultdict

def reciprocal_rank_fusion(results_list, k=60):
    """
    RRF 融合排序算法
    
    公式: score = Σ(1 / (k + rank))
    
    Args:
        results_list: 多个检索器的结果列表，每个元素是 (doc_id, document) 列表
        k: 常数，通常取 60
    """
    scores = defaultdict(float)
    documents = {}
    
    for results in results_list:
        for rank, (doc_id, doc) in enumerate(results, 1):
            scores[doc_id] += 1 / (k + rank)
            documents[doc_id] = doc
    
    # 按分数排序
    ranked_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    return [(documents[doc_id], score) for doc_id, score in ranked_results]

# 使用示例
def hybrid_search_with_rrf(vectorstore, bm25_retriever, query, k=60, top_n=5):
    """
    使用 RRF 融合的混合检索
    """
    # 向量检索结果
    vector_results = vectorstore.similarity_search_with_score(query, k=10)
    vector_ranked = [(hash(doc.page_content), doc) for doc, _ in vector_results]
    
    # BM25 检索结果
    bm25_results = bm25_retriever.get_relevant_documents(query)
    bm25_ranked = [(hash(doc.page_content), doc) for doc in bm25_results]
    
    # RRF 融合
    fused_results = reciprocal_rank_fusion([vector_ranked, bm25_ranked], k=k)
    
    return fused_results[:top_n]
```

### 4.5 重排序优化（Reranking）

重排序是在初步检索后，使用更精确的模型对结果进行精排。

#### 4.5.1 为什么需要重排序？

```
┌─────────────────────────────────────────────────────────────┐
│                    两阶段检索架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  阶段 1: 召回（Recall）                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   用户查询   │───▶│  快速检索    │───▶│  Top-100 候选   │ │
│  └─────────────┘    │ (向量/BM25) │    └─────────────────┘ │
│                     └─────────────┘                         │
│                          │                                  │
│                          ▼                                  │
│  阶段 2: 精排（Rerank）                                      │
│                     ┌─────────────┐                         │
│                     │  Cross-Encoder│                       │
│                     │   重排序模型  │                       │
│                     │  (精确打分)   │                       │
│                     └──────┬──────┘                         │
│                            │                                │
│                            ▼                                │
│                     ┌─────────────┐                         │
│                     │  Top-5 结果  │  ← 最终返回给用户       │
│                     └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Bi-Encoder vs Cross-Encoder**：
- **Bi-Encoder（双编码器）**：查询和文档分别编码，计算速度快，适合召回阶段
- **Cross-Encoder（交叉编码器）**：查询和文档一起输入模型，精度高但慢，适合精排阶段

#### 4.5.2 重排序实战

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain.retrievers.document_compressors import LLMChainExtractor

# 方法 1: 使用专门的重排序模型（推荐）
def rerank_with_cross_encoder(retriever, query, documents, top_n=5):
    """
    使用 Cross-Encoder 进行重排序
    """
    from sentence_transformers import CrossEncoder
    
    # 加载重排序模型
    reranker = CrossEncoder('BAAI/bge-reranker-large')
    
    # 构建 query-document 对
    pairs = [[query, doc.page_content] for doc in documents]
    
    # 计算相关性分数
    scores = reranker.predict(pairs)
    
    # 按分数排序
    scored_docs = list(zip(documents, scores))
    scored_docs.sort(key=lambda x: x[1], reverse=True)
    
    return scored_docs[:top_n]

# 方法 2: 使用 LangChain 的 ContextualCompressionRetriever
def create_compression_retriever(base_retriever, llm):
    """
    创建上下文压缩检索器
    """
    from langchain.retrievers.document_compressors import LLMChainExtractor
    
    # 创建压缩器
    compressor = LLMChainExtractor.from_llm(llm)
    
    # 创建压缩检索器
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever
    )
    
    return compression_retriever

# 使用示例
# from langchain_openai import ChatOpenAI
# llm = ChatOpenAI(model="gpt-3.5-turbo")
# base_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
# compression_retriever = create_compression_retriever(base_retriever, llm)
# compressed_results = compression_retriever.get_relevant_documents("查询内容")
```

### 4.6 上下文压缩（Context Compression）

当检索到的文档块过大时，需要进行上下文压缩，只保留与查询最相关的部分。

```python
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers.document_compressors import EmbeddingsFilter

# 方法 1: LLM 驱动的上下文压缩
def llm_based_compression():
    """
    使用 LLM 提取文档中与查询相关的部分
    """
    from langchain_openai import ChatOpenAI
    
    llm = ChatOpenAI(model="gpt-3.5-turbo")
    compressor = LLMChainExtractor.from_llm(llm)
    
    # 压缩检索结果
    compressed_docs = compressor.compress_documents(
        documents=retrieved_docs,
        query=user_query
    )
    
    return compressed_docs

# 方法 2: 基于 Embedding 的过滤
def embedding_based_filter(vectorstore, query, documents, threshold=0.7):
    """
    使用 Embedding 相似度过滤不相关的文档
    """
    from langchain.retrievers.document_compressors import EmbeddingsFilter
    
    embeddings_filter = EmbeddingsFilter(
        embeddings=vectorstore.embeddings,
        similarity_threshold=threshold
    )
    
    filtered_docs = embeddings_filter.compress_documents(
        documents=documents,
        query=query
    )
    
    return filtered_docs

# 方法 3: 自定义压缩：提取关键句子
def extract_key_sentences(document, query, top_k=3):
    """
    从文档中提取与查询最相关的关键句子
    """
    import re
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    
    # 分句
    sentences = re.split(r'[。！？.!?]', document.page_content)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if len(sentences) <= top_k:
        return sentences
    
    # 计算每句话与查询的相似度
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(sentences + [query])
    
    query_vec = tfidf_matrix[-1]
    sentence_vecs = tfidf_matrix[:-1]
    
    similarities = cosine_similarity(sentence_vecs, query_vec).flatten()
    
    # 返回最相关的 top_k 句子
    top_indices = similarities.argsort()[-top_k:][::-1]
    return [sentences[i] for i in top_indices]
```

---

## 五、回答生成优化

### 5.1 Prompt 工程技巧

#### 5.1.1 RAG Prompt 模板设计

```python
from langchain.prompts import PromptTemplate

# 基础 RAG Prompt
BASIC_RAG_TEMPLATE = """基于以下上下文信息回答问题。如果上下文中没有相关信息，请明确说明"根据提供的资料，我无法回答这个问题"。

上下文：
{context}

问题：{question}

请提供详细且准确的回答："""

# 带引用来源的 Prompt
CITATION_RAG_TEMPLATE = """你是一个专业的技术文档助手。请基于提供的参考资料回答问题，并在回答中标注信息来源。

参考资料：
{context}

用户问题：{question}

请按以下格式回答：
1. 直接回答用户的问题
2. 提供相关的技术细节
3. 在关键信息后用 [来源: X] 标注出处

如果参考资料不足以回答问题，请说明"资料不足"。

回答："""

# 结构化输出 Prompt
STRUCTURED_RAG_TEMPLATE = """基于以下上下文回答问题，并以 JSON 格式输出。

上下文：
{context}

问题：{question}

请按以下 JSON 格式输出：
{{
    "answer": "直接回答",
    "reasoning": "推理过程",
    "confidence": "高/中/低",
    "sources": ["来源1", "来源2"]
}}

输出："""

# 创建 PromptTemplate
basic_rag_prompt = PromptTemplate(
    template=BASIC_RAG_TEMPLATE,
    input_variables=["context", "question"]
)

citation_rag_prompt = PromptTemplate(
    template=CITATION_RAG_TEMPLATE,
    input_variables=["context", "question"]
)
```

#### 5.1.2 上下文组织策略

```python
def format_context_with_metadata(documents, include_source=True):
    """
    格式化上下文，包含元数据信息
    """
    formatted_chunks = []
    
    for i, doc in enumerate(documents, 1):
        chunk_text = f"【文档片段 {i}】\n"
        
        if include_source:
            source = doc.metadata.get('source', 'unknown')
            chunk_text += f"来源: {source}\n"
        
        chunk_text += f"内容: {doc.page_content}\n"
        formatted_chunks.append(chunk_text)
    
    return "\n---\n".join(formatted_chunks)

def format_context_with_relevance(documents, scores=None):
    """
    按相关性排序并格式化上下文
    """
    if scores:
        # 如果有分数，按分数排序
        doc_score_pairs = list(zip(documents, scores))
        doc_score_pairs.sort(key=lambda x: x[1], reverse=True)
        documents = [doc for doc, _ in doc_score_pairs]
    
    # 只取前 N 个最相关的文档
    top_docs = documents[:5]
    
    return format_context_with_metadata(top_docs)

def format_context_hierarchical(documents):
    """
    按文档来源分组组织上下文
    """
    from collections import defaultdict
    
    # 按来源分组
    docs_by_source = defaultdict(list)
    for doc in documents:
        source = doc.metadata.get('source', 'unknown')
        docs_by_source[source].append(doc)
    
    # 格式化输出
    formatted = []
    for source, docs in docs_by_source.items():
        formatted.append(f"\n=== 来源: {source} ===")
        for i, doc in enumerate(docs, 1):
            formatted.append(f"片段 {i}: {doc.page_content[:300]}...")
    
    return "\n".join(formatted)
```

### 5.2 生成参数调优

```python
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

# 配置 LLM 生成参数
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.3,      # 降低随机性，提高确定性
    max_tokens=2000,      # 限制生成长度
    top_p=0.9,           # 核采样
    frequency_penalty=0.5,  # 降低重复
    presence_penalty=0.3    # 鼓励新内容
)

# 创建 RAG Chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 将所有文档放入一个 Prompt
    retriever=vectorstore.as_retriever(
        search_kwargs={"k": 5}
    ),
    return_source_documents=True,
    verbose=True
)

# 参数调优建议
generation_params_guide = {
    "temperature": {
        "描述": "控制生成文本的随机性",
        "建议值": {
            "0.0-0.3": "技术问答、代码生成（高确定性）",
            "0.3-0.7": "一般问答、内容创作（平衡）",
            "0.7-1.0": "创意写作、头脑风暴（高创造性）"
        }
    },
    "max_tokens": {
        "描述": "限制生成文本的最大长度",
        "建议值": "根据预期回答长度设置，通常 500-2000"
    },
    "frequency_penalty": {
        "描述": "降低重复词的概率",
        "建议值": "0.3-0.7，避免回答过于重复"
    }
}
```

### 5.3 多轮对话 RAG

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

# 创建带记忆的 RAG Chain
def create_conversational_rag(vectorstore, llm):
    """
    创建支持多轮对话的 RAG 系统
    """
    # 对话记忆
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )
    
    # 创建 ConversationalRetrievalChain
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(
            search_kwargs={"k": 5}
        ),
        memory=memory,
        return_source_documents=True,
        verbose=True
    )
    
    return qa_chain

# 使用示例
# qa_chain = create_conversational_rag(vectorstore, llm)
# 
# # 第一轮
# result1 = qa_chain({"question": "什么是 React Hooks？"})
# print(result1["answer"])
# 
# # 第二轮（自动携带历史上下文）
# result2 = qa_chain({"question": "useEffect 和 useLayoutEffect 有什么区别？"})
# print(result2["answer"])

# 自定义对话历史管理
class RAGConversationManager:
    """
    RAG 对话管理器
    """
    def __init__(self, vectorstore, llm, max_history=5):
        self.vectorstore = vectorstore
        self.llm = llm
        self.max_history = max_history
        self.chat_history = []
    
    def add_message(self, role, content):
        """添加消息到历史"""
        self.chat_history.append({"role": role, "content": content})
        # 保持历史长度
        if len(self.chat_history) > self.max_history * 2:
            self.chat_history = self.chat_history[-self.max_history * 2:]
    
    def get_contextual_query(self, query):
        """
        将查询与历史上下文结合
        """
        if not self.chat_history:
            return query
        
        # 构建上下文
        history_text = "\n".join([
            f"{'用户' if msg['role'] == 'user' else '助手'}: {msg['content']}" 
            for msg in self.chat_history[-4:]  # 最近 2 轮对话
        ])
        
        contextual_query = f"""基于以下对话历史：
{history_text}

用户新问题：{query}

请理解上下文后回答新问题。"""
        
        return contextual_query
    
    def chat(self, query):
        """进行对话"""
        # 获取上下文查询
        contextual_query = self.get_contextual_query(query)
        
        # 检索相关文档
        docs = self.vectorstore.similarity_search(contextual_query, k=5)
        
        # 构建 Prompt
        context = format_context_with_metadata(docs)
        prompt = f"""基于以下参考资料回答问题：

{context}

问题：{contextual_query}

请提供准确、详细的回答："""
        
        # 调用 LLM
        response = self.llm.predict(prompt)
        
        # 更新历史
        self.add_message("user", query)
        self.add_message("assistant", response)
        
        return response
```

---

## 六、实战：技术文档问答系统

### 6.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    技术文档问答系统架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐      ┌─────────────────────────────────────┐  │
│  │   前端界面   │      │            后端服务                  │  │
│  │  (React)    │◀────▶│  ┌─────────┐    ┌───────────────┐  │  │
│  └─────────────┘      │  │ FastAPI │    │   RAG Engine  │  │  │
│                       │  │  网关   │◀──▶│  ┌─────────┐  │  │  │
│                       │  └─────────┘    │  │ 检索器   │  │  │  │
│                       │                 │  │  ├─向量  │  │  │  │
│                       │                 │  │  ├─BM25 │  │  │  │
│                       │                 │  │  └─MMR  │  │  │  │
│                       │                 │  └────┬────┘  │  │  │
│                       │                 │       │       │  │  │
│                       │                 │  ┌────┴────┐  │  │  │
│                       │                 │  │ 重排序  │  │  │  │
│                       │                 │  └────┬────┘  │  │  │
│                       │                 │       │       │  │  │
│                       │                 │  ┌────┴────┐  │  │  │
│                       │                 │  │ LLM生成 │  │  │  │
│                       │                 │  └─────────┘  │  │  │
│                       │                 └───────────────┘  │  │
│                       │                   │                │  │
│                       │                   ▼                │  │
│                       │  ┌─────────────────────────────┐   │  │
│                       │  │      向量数据库 (Chroma)     │   │  │
│                       │  └─────────────────────────────┘   │  │
│                       └─────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 后端实现（FastAPI + LangChain）

```python
# rag_backend.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

app = FastAPI(title="技术文档问答系统", version="1.0.0")

# ========== 数据模型 ==========

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    search_type: str = "hybrid"  # similarity, mmr, hybrid
    include_sources: bool = True

class QueryResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = None
    search_time_ms: float

# ========== 全局组件 ==========

class RAGSystem:
    def __init__(self):
        self.embeddings = None
        self.vectorstore = None
        self.bm25_retriever = None
        self.llm = None
        self.qa_chain = None
        self.initialized = False
    
    def initialize(self):
        """初始化 RAG 系统"""
        print("正在初始化 RAG 系统...")
        
        # 1. 初始化 Embedding 模型
        self.embeddings = HuggingFaceEmbeddings(
            model_name="BAAI/bge-m3",
            model_kwargs={'device': 'cpu'},  # 生产环境可用 GPU
            encode_kwargs={'normalize_embeddings': True}
        )
        
        # 2. 加载向量数据库
        self.vectorstore = Chroma(
            persist_directory="./chroma_db",
            embedding_function=self.embeddings
        )
        
        # 3. 初始化 LLM
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.3,
            max_tokens=1500
        )
        
        # 4. 初始化 BM25（需要原始文档）
        # 注意：实际生产环境应该持久化 BM25 索引
        # self.bm25_retriever = BM25Retriever.from_documents(documents)
        
        self.initialized = True
        print("RAG 系统初始化完成！")
    
    def get_retriever(self, search_type: str = "similarity"):
        """获取指定类型的检索器"""
        if search_type == "similarity":
            return self.vectorstore.as_retriever(
                search_kwargs={"k": 10}
            )
        elif search_type == "mmr":
            return self.vectorstore.as_retriever(
                search_type="mmr",
                search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.5}
            )
        elif search_type == "hybrid":
            # 简化的混合检索实现
            return self.vectorstore.as_retriever(
                search_kwargs={"k": 10}
            )
        else:
            raise ValueError(f"不支持的检索类型: {search_type}")
    
    def query(self, question: str, search_type: str = "similarity", 
              top_k: int = 5) -> dict:
        """执行 RAG 查询"""
        import time
        start_time = time.time()
        
        # 1. 检索相关文档
        retriever = self.get_retriever(search_type)
        documents = retriever.get_relevant_documents(question)
        
        # 2. 限制返回数量
        documents = documents[:top_k]
        
        # 3. 构建 Prompt
        context = self._format_context(documents)
        prompt = self._build_prompt(context, question)
        
        # 4. 生成回答
        response = self.llm.predict(prompt)
        
        # 5. 准备返回结果
        search_time = (time.time() - start_time) * 1000
        
        sources = [
            {
                "content": doc.page_content[:200],
                "source": doc.metadata.get("source", "unknown"),
                "score": doc.metadata.get("score", 0)
            }
            for doc in documents
        ]
        
        return {
            "answer": response,
            "sources": sources,
            "search_time_ms": search_time
        }
    
    def _format_context(self, documents: List) -> str:
        """格式化上下文"""
        context_parts = []
        for i, doc in enumerate(documents, 1):
            context_parts.append(
                f"【文档 {i}】来源: {doc.metadata.get('source', 'unknown')}\n"
                f"内容: {doc.page_content}\n"
            )
        return "\n---\n".join(context_parts)
    
    def _build_prompt(self, context: str, question: str) -> str:
        """构建 Prompt"""
        return f"""你是一个专业的技术文档助手。请基于以下参考资料回答问题。
如果资料不足以回答问题，请明确说明。

参考资料：
{context}

用户问题：{question}

请提供准确、详细的回答，并在关键信息处标注来源（如【文档 1】）："""

# 全局 RAG 系统实例
rag_system = RAGSystem()

# ========== API 端点 ==========

@app.on_event("startup")
async def startup_event():
    """服务启动时初始化"""
    rag_system.initialize()

@app.get("/")
async def root():
    return {"message": "技术文档问答系统 API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "rag_initialized": rag_system.initialized
    }

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """问答端点"""
    if not rag_system.initialized:
        raise HTTPException(status_code=503, detail="RAG 系统尚未初始化")
    
    try:
        result = rag_system.query(
            question=request.question,
            search_type=request.search_type,
            top_k=request.top_k
        )
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"] if request.include_sources else None,
            search_time_ms=result["search_time_ms"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_only(query: str, search_type: str = "similarity", k: int = 5):
    """仅检索，不生成回答"""
    if not rag_system.initialized:
        raise HTTPException(status_code=503, detail="RAG 系统尚未初始化")
    
    try:
        retriever = rag_system.get_retriever(search_type)
        documents = retriever.get_relevant_documents(query)[:k]
        
        return {
            "query": query,
            "search_type": search_type,
            "results": [
                {
                    "content": doc.page_content[:300],
                    "source": doc.metadata.get("source", "unknown"),
                    "metadata": doc.metadata
                }
                for doc in documents
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 6.3 前端实现（React）

```tsx
// TechDocQA.tsx
import React, { useState, useRef, useEffect } from 'react';
import './TechDocQA.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  searchTime?: number;
  timestamp: Date;
}

interface Source {
  content: string;
  source: string;
  score?: number;
}

interface QueryRequest {
  question: string;
  top_k: number;
  search_type: 'similarity' | 'mmr' | 'hybrid';
  include_sources: boolean;
}

const API_BASE_URL = 'http://localhost:8000';

export const TechDocQA: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'similarity' | 'mmr' | 'hybrid'>('hybrid');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const request: QueryRequest = {
        question: input,
        top_k: 5,
        search_type: searchType,
        include_sources: true
      };

      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        searchTime: data.search_time_ms,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，查询时出现错误，请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tech-doc-qa">
      <header className="qa-header">
        <h1>技术文档问答系统</h1>
        <div className="search-type-selector">
          <label>检索策略：</label>
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value as any)}
          >
            <option value="similarity">相似度检索</option>
            <option value="mmr">MMR 多样性检索</option>
            <option value="hybrid">混合检索</option>
          </select>
        </div>
      </header>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>欢迎使用技术文档问答系统</h2>
            <p>我可以帮你解答关于技术文档的问题。试着问我：</p>
            <ul>
              <li>"什么是 React Hooks？"</li>
              <li>"Python 的异步编程怎么实现？"</li>
              <li>"Docker 容器和虚拟机有什么区别？"</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="role-badge">
                {message.role === 'user' ? '用户' : 'AI 助手'}
              </span>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="message-content">
              {message.content}
            </div>

            {message.sources && message.sources.length > 0 && (
              <div className="sources-section">
                <h4>参考来源</h4>
                {message.searchTime && (
                  <span className="search-time">
                    检索耗时: {message.searchTime.toFixed(0)}ms
                  </span>
                )}
                <div className="sources-list">
                  {message.sources.map((source, index) => (
                    <div key={index} className="source-item">
                      <div className="source-header">
                        <span className="source-name">{source.source}</span>
                        {source.score && (
                          <span className="source-score">
                            相关度: {source.score.toFixed(3)}
                          </span>
                        )}
                      </div>
                      <div className="source-content">{source.content}...</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '查询中...' : '发送'}
        </button>
      </form>
    </div>
  );
};

export default TechDocQA;
```

```css
/* TechDocQA.css */
.tech-doc-qa {
  max-width: 900px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.qa-header {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qa-header h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.search-type-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-type-selector select {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.welcome-message {
  text-align: center;
  padding: 40px;
  color: #666;
}

.welcome-message h2 {
  margin-bottom: 16px;
  color: #333;
}

.welcome-message ul {
  text-align: left;
  display: inline-block;
  margin-top: 16px;
}

.welcome-message li {
  margin: 8px 0;
  color: #0066cc;
  cursor: pointer;
}

.message {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message.user {
  background: #e3f2fd;
  margin-left: 20%;
}

.message.assistant {
  margin-right: 20%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.role-badge {
  font-weight: bold;
  color: #666;
}

.timestamp {
  color: #999;
}

.message-content {
  line-height: 1.6;
  white-space: pre-wrap;
}

.sources-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.sources-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.search-time {
  font-size: 12px;
  color: #999;
  margin-left: 12px;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #0066cc;
}

.source-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.source-name {
  font-weight: bold;
  color: #0066cc;
}

.source-score {
  color: #28a745;
}

.source-content {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.input-form {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.input-form input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d0d0d0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
}

.input-form input:focus {
  border-color: #0066cc;
}

.input-form button {
  padding: 12px 24px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.input-form button:hover:not(:disabled) {
  background: #0052a3;
}

.input-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Loading animation */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

### 6.4 Docker 部署

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY rag_backend.py .
COPY chroma_db ./chroma_db

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["python", "rag_backend.py"]
```

```txt
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
langchain==0.1.0
langchain-community==0.0.10
langchain-openai==0.0.5
langchain-huggingface==0.0.3
chromadb==0.4.18
sentence-transformers==2.2.2
scikit-learn==1.3.2
numpy==1.24.3
pydantic==2.5.0
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  rag-backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./chroma_db:/app/chroma_db
    restart: unless-stopped

  # 可选：前端服务
  rag-frontend:
    image: node:18-alpine
    working_dir: /app
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    command: sh -c "npm install && npm start"
    depends_on:
      - rag-backend
```

---

## 七、避坑指南

### 7.1 检索阶段常见问题

| 问题 | 现象 | 解决方案 |
|------|------|---------|
| **召回不足** | 相关文档未被检索到 | 增大 fetch_k、使用混合检索、查询改写 |
| **召回过多噪音** | 检索到大量无关文档 | 提高相似度阈值、重排序过滤、上下文压缩 |
| **结果重复** | 多个文档片段内容高度重复 | 使用 MMR 检索、去重过滤 |
| **语义漂移** | 检索结果与查询意图不符 | 使用领域专用 Embedding 模型、查询扩展 |

### 7.2 生成阶段常见问题

| 问题 | 现象 | 解决方案 |
|------|------|---------|
| **上下文过长** | Token 超限，成本增加 | 上下文压缩、关键句提取、分块生成 |
| **幻觉问题** | 生成内容不在检索文档中 | 严格 Prompt 约束、添加"资料不足"判断 |
| **回答不连贯** | 多个文档片段拼接生硬 | 使用 LLM 重新组织语言、添加过渡语句 |
| **来源不明确** | 无法追溯信息出处 | 要求 LLM 标注来源、返回 source_documents |

### 7.3 性能优化建议

```python
# 1. 检索性能优化
def optimize_retrieval():
    """
    检索阶段优化策略
    """
    # 使用近似最近邻索引（如 HNSW）
    vectorstore = Chroma(
        persist_directory="./chroma_db",
        embedding_function=embeddings,
        # Chroma 默认使用 HNSW
    )
    
    # 批量检索
    queries = ["query1", "query2", "query3"]
    # 使用异步或批量接口

# 2. 生成性能优化
def optimize_generation():
    """
    生成阶段优化策略
    """
    # 使用流式输出
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        streaming=True  # 启用流式输出
    )
    
    # 缓存常见查询结果
    from functools import lru_cache
    
    @lru_cache(maxsize=1000)
    def cached_retrieval(query_hash):
        # 缓存检索结果
        pass

# 3. 系统级优化
optimization_tips = {
    "向量数据库": [
        "使用 HNSW 索引加速检索",
        "合理设置 ef_construction 和 ef_search 参数",
        "定期压缩和优化索引"
    ],
    "Embedding 模型": [
        "使用 GPU 加速向量化",
        "批量处理文档",
        "考虑使用量化模型减少内存占用"
    ],
    "LLM 调用": [
        "使用流式输出提升用户体验",
        "实现请求队列和限流",
        "考虑使用本地模型降低延迟"
    ]
}
```

---

## 八、面试考点

### 8.1 检索算法

**Q: 请解释 MMR（Maximal Marginal Relevance）算法的原理和适用场景？**

> **答**：
> MMR 算法通过平衡相关性和多样性来选择文档集合。其核心公式为：
> MMR = argmax[λ * Relevance(Di) - (1-λ) * max Similarity(Di, Dj)]
> 
> 其中 λ 控制相关性和多样性的权衡：
> - λ=1：完全追求相关性
> - λ=0：完全追求多样性
> - λ=0.5：平衡两者
> 
> **适用场景**：
> 1. 需要全面了解某个主题，避免信息单一
> 2. 检索结果容易出现内容重复的情况
> 3. 用户希望获得多角度的信息

**Q: 混合检索相比纯向量检索有什么优势？**

> **答**：
> 混合检索结合了向量检索和关键词检索（如 BM25）的优势：
> 
> | 维度 | 向量检索 | 关键词检索 | 混合检索 |
> |------|---------|-----------|---------|
> | 语义理解 | ✅ 强 | ❌ 弱 | ✅ 强 |
> | 精确匹配 | ❌ 弱 | ✅ 强 | ✅ 强 |
> | 同义词处理 | ✅ 好 | ❌ 差 | ✅ 好 |
> | 专有名词匹配 | ❌ 差 | ✅ 好 | ✅ 好 |
> 
> **融合方法**：
> 1. RRF（Reciprocal Rank Fusion）：对多路召回结果进行加权融合
> 2. 加权分数融合：linear combination of scores
> 3. 级联检索：先用一种方法召回，再用另一种精排

**Q: 两阶段检索（召回+精排）的优势是什么？**

> **答**：
> 两阶段检索将检索过程分为召回和精排两个阶段：
> 
> **阶段 1 - 召回**：使用 Bi-Encoder（双编码器）快速召回候选
> - 查询和文档分别编码，计算速度快
> - 适合大规模候选集初筛
> 
> **阶段 2 - 精排**：使用 Cross-Encoder（交叉编码器）精确排序
> - 查询和文档一起输入模型，精度高
> - 计算慢但准确，只对 Top-K 候选执行
> 
> **优势**：
> 1. 兼顾效率和精度
> 2. 可以用更复杂的模型进行精排
> 3. 支持更精细的相关性判断

### 8.2 生成优化策略

**Q: 如何减少 RAG 系统的幻觉问题？**

> **答**：
> 1. **Prompt 工程**：
>    - 明确要求"基于提供的资料回答"
>    - 添加"资料不足"的判断逻辑
>    - 要求标注信息来源
> 
> 2. **检索优化**：
>    - 提高相似度阈值，过滤低质量结果
>    - 使用重排序模型精排
>    - 上下文压缩，保留最相关信息
> 
> 3. **后处理验证**：
>    - 用另一个 LLM 验证回答是否基于上下文
>    - 提取回答中的事实，与原文对比
> 
> 4. **系统级设计**：
>    - 返回置信度分数
>    - 对不确定的回答给出免责声明

**Q: 上下文压缩有哪些方法？**

> **答**：
> 1. **基于 LLM 的压缩**：
>    - 使用 LLMChainExtractor 提取相关部分
>    - 让 LLM 生成摘要
> 
> 2. **基于 Embedding 的过滤**：
>    - EmbeddingsFilter：过滤与查询相似度低的文档
>    - 设置相似度阈值
> 
> 3. **基于规则的方法**：
>    - 提取关键句子（TF-IDF、TextRank）
>    - 按段落相关性筛选
>    - 滑动窗口提取相关片段
> 
> 4. **分层组织**：
>    - 先检索文档级别，再检索片段级别
>    - 使用摘要索引 + 详细内容索引

**Q: 如何评估 RAG 系统的效果？**

> **答**：
> **检索阶段指标**：
> - Recall@K：相关文档被召回的比例
> - Precision@K：召回结果中相关文档的比例
> - MRR（Mean Reciprocal Rank）：首个相关文档排名的倒数均值
> - NDCG：考虑相关度等级的排序质量
> 
> **生成阶段指标**：
> - 人工评估：回答准确性、完整性、流畅性
> - 自动指标：
>   - BLEU/ROUGE：与参考答案的文本重叠
>   - BERTScore：语义相似度
>   - Faithfulness：回答是否忠实于检索内容
> 
> **端到端指标**：
> - 用户满意度
> - 任务完成率
> - 平均对话轮数

### 8.3 系统设计

**Q: 如何设计一个可扩展的 RAG 系统？**

> **答**：
> **架构层面**：
> 1. **微服务拆分**：
>    - 文档处理服务（加载、切分、向量化）
>    - 检索服务（向量数据库查询）
>    - 生成服务（LLM 调用）
>    - API 网关（路由、限流）
> 
> 2. **数据流设计**：
>    - 离线 Pipeline：文档 → 切分 → Embedding → 向量数据库
>    - 在线服务：查询 → 检索 → 重排 → 生成
> 
> 3. **扩展性考虑**：
>    - 向量数据库分片（按租户、按时间）
>    - 缓存层（热门查询、Embedding 结果）
>    - 异步处理（文档更新、批量索引）
> 
> **技术选型**：
> - 向量数据库：Milvus/Pinecone（云原生）、Chroma（轻量）
> - 消息队列：Kafka/RabbitMQ（异步处理）
> - 缓存：Redis（查询缓存、会话缓存）

---

## 九、扩展阅读

### 9.1 推荐资源

**论文**：
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) - RAG 原始论文
- [Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) - DPR 双编码器检索
- [Precise Zero-Shot Dense Retrieval without Relevance Labels](https://arxiv.org/abs/2212.10496) - HyDE 查询改写

**开源项目**：
- [LangChain](https://github.com/langchain-ai/langchain) - RAG 开发框架
- [LlamaIndex](https://github.com/run-llama/llama_index) - 数据索引和检索
- [RAGFlow](https://github.com/infiniflow/ragflow) - 开源 RAG 引擎
- [QAnything](https://github.com/netease-youdao/QAnything) - 网易有道 RAG 系统

**技术博客**：
- [LangChain RAG 最佳实践](https://blog.langchain.dev/advanced-rag/)
- [RAG 评估指南](https://docs.ragas.io/)
- [向量数据库对比](https://thedataquarry.com/posts/vector-db-1/)

### 9.2 进阶主题

```
RAG 进阶学习路径：

├── 检索优化
│   ├── 查询改写（Query Rewriting）
│   ├── 查询扩展（Query Expansion）
│   ├── 多向量检索（Multi-Vector Retrieval）
│   └── 图检索（Graph RAG）
│
├── 生成优化
│   ├── Chain-of-Thought RAG
│   ├── Self-RAG（自我反思）
│   ├── Corrective RAG（纠错机制）
│   └── 多模态 RAG（图文混合）
│
└── 生产部署
    ├── 多租户架构
    ├── 实时索引更新
    ├── 检索性能调优
    └── 监控和可观测性
```

---

## 十、课后练习

### 练习 1：检索策略对比实验

**目标**：对比不同检索策略在实际查询中的表现

**步骤**：
1. 准备 10 个测试查询，涵盖不同类型（事实性、概念性、比较性）
2. 分别使用相似度检索、MMR 检索（λ=0.3, 0.5, 0.8）进行检索
3. 人工评估每种策略的检索质量
4. 分析不同 λ 值对结果多样性的影响

**输出**：
- 对比表格（查询类型、策略、相关性评分、多样性评分）
- 总结不同策略的适用场景

### 练习 2：混合检索实现

**目标**：实现一个完整的混合检索系统

**要求**：
1. 使用 Chroma 作为向量数据库
2. 使用 BM25 作为关键词检索
3. 实现 RRF 融合排序
4. 添加 Cross-Encoder 重排序

**代码框架**：
```python
class HybridRetriever:
    def __init__(self, vectorstore, documents):
        self.vectorstore = vectorstore
        self.bm25_retriever = BM25Retriever.from_documents(documents)
        self.reranker = CrossEncoder('BAAI/bge-reranker-large')
    
    def retrieve(self, query, k=5):
        # 1. 向量检索
        # 2. BM25 检索
        # 3. RRF 融合
        # 4. Cross-Encoder 重排序
        pass
```

### 练习 3：RAG 系统评估

**目标**：建立 RAG 系统的评估体系

**任务**：
1. 准备 20 个带标准答案的测试问题
2. 实现评估脚本，计算以下指标：
   - 检索指标：Recall@5, MRR
   - 生成指标：BLEU, ROUGE-L
   - 端到端指标：回答准确性（人工标注）
3. 分析系统在不同类型问题上的表现

**评估数据集示例**：
```json
[
  {
    "question": "什么是 React Hooks？",
    "answer": "React Hooks 是 React 16.8 引入的特性，允许在函数组件中使用状态和其他 React 特性...",
    "category": "概念解释",
    "difficulty": "中等"
  }
]
```

### 练习 4：生产级 RAG 部署

**目标**：将 RAG 系统部署到生产环境

**要求**：
1. 使用 Docker 容器化后端服务
2. 实现健康检查和优雅关闭
3. 添加请求限流和错误处理
4. 配置日志和监控
5. 编写部署文档

**交付物**：
- Dockerfile 和 docker-compose.yml
- 部署脚本
- 监控配置（Prometheus/Grafana）
- 运维文档

---

## 总结

本文深入讲解了 RAG 系统的检索和生成阶段：

1. **检索策略**：
   - 相似度检索：最基础的向量检索方式
   - MMR 检索：平衡相关性和多样性
   - 混合检索：结合语义和关键词匹配
   - 重排序：使用 Cross-Encoder 精排

2. **生成优化**：
   - Prompt 工程：设计有效的 RAG Prompt
   - 上下文压缩：减少 Token 消耗
   - 多轮对话：维护对话历史

3. **实战项目**：
   - 完整的 FastAPI 后端
   - React 前端界面
   - Docker 部署方案

掌握这些技术后，你就能构建出生产级的 RAG 系统，为 AI Agent 提供强大的知识检索能力。

---

*本文是《AI Agent 从入门到精通》系列第 8 篇，下一篇我们将探讨 Agent 的规划和推理能力。*
