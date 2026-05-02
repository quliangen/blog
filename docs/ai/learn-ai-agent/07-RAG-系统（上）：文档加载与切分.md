# 07-RAG 系统（上）：文档加载与切分

RAG（Retrieval-Augmented Generation，检索增强生成）是 AI Agent 系统的核心技术之一。它通过将外部知识库与 LLM 结合，让模型能够回答训练数据之外的问题。本篇文章将深入讲解 RAG 架构、文档处理流程以及 Embedding 模型选型。

---

## 一、RAG 架构全景

### 1.1 为什么需要 RAG？

大语言模型存在三个核心局限：

| 局限 | 说明 | RAG 解决方案 |
|------|------|-------------|
| 知识截止 | 模型知识有截止日期，不了解最新信息 | 实时检索外部知识库 |
| 幻觉问题 | 可能生成看似合理但错误的内容 | 基于检索的事实约束 |
| 领域知识 | 对专业领域理解有限 | 注入领域专属文档 |

### 1.2 RAG 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                         RAG 系统架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  文档加载器  │───▶│  文本切分器  │───▶│  Embedding模型  │ │
│  │  (Loaders)  │    │ (Splitters) │    │                 │ │
│  └─────────────┘    └─────────────┘    └────────┬────────┘ │
│                                                  │          │
│  ┌───────────────────────────────────────────────┘          │
│  │                                                          │
│  ▼                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  向量数据库  │◀───│  向量检索器  │◀───│    用户查询      │ │
│  │ (Vector DB) │    │  (Retriever)│    │                 │ │
│  └──────┬──────┘    └─────────────┘    └─────────────────┘ │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  检索结果    │───▶│   Prompt    │───▶│      LLM        │ │
│  │  (Context)  │    │   构建      │    │                 │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│                                                  │          │
│                                                  ▼          │
│                                         ┌─────────────────┐ │
│                                         │    最终回答      │ │
│                                         └─────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 RAG 工作流程

**索引阶段（离线）**：
1. 加载原始文档（PDF、Markdown、网页等）
2. 将文档切分为适当大小的文本块
3. 使用 Embedding 模型将文本转换为向量
4. 存储到向量数据库中

**检索阶段（在线）**：
1. 接收用户查询
2. 将查询转换为向量
3. 在向量数据库中检索相似文本块
4. 将检索结果作为上下文输入 LLM
5. 生成最终回答

---

## 二、文档加载器与切分策略

### 2.1 文档加载器（Document Loaders）

LangChain 提供了丰富的文档加载器，支持多种数据源：

```python
from langchain_community.document_loaders import (
    PyPDFLoader,           # PDF 文件
    UnstructuredMarkdownLoader,  # Markdown 文件
    TextLoader,            # 纯文本文件
    WebBaseLoader,         # 网页
    CSVLoader,             # CSV 文件
    JSONLoader,            # JSON 文件
    DirectoryLoader        # 整个目录
)

# 加载 PDF
pdf_loader = PyPDFLoader("document.pdf")
pdf_docs = pdf_loader.load()

# 加载 Markdown
md_loader = UnstructuredMarkdownLoader("readme.md")
md_docs = md_loader.load()

# 加载网页
web_loader = WebBaseLoader("https://docs.python.org/3/")
web_docs = web_loader.load()

# 批量加载目录
dir_loader = DirectoryLoader(
    "./docs",
    glob="**/*.md",
    loader_cls=UnstructuredMarkdownLoader
)
dir_docs = dir_loader.load()
```

### 2.2 文档切分策略

切分是 RAG 中最关键的步骤之一，直接影响检索质量。

#### 2.2.1 切分方式对比

| 切分方式 | 特点 | 适用场景 |
|---------|------|---------|
| 字符切分 | 按固定字符数切分 | 简单文本 |
| 递归字符切分 | 优先按段落、句子切分 | 通用场景 |
| Token 切分 | 按 Token 数量切分 | 控制上下文长度 |
| 语义切分 | 按语义边界切分 | 高质量需求 |
| 结构化切分 | 按文档结构切分 | Markdown/HTML |

#### 2.2.2 核心参数说明

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    # 每个文本块的目标大小（字符数）
    chunk_size=1000,
    
    # 相邻文本块之间的重叠字符数
    chunk_overlap=200,
    
    # 用于切分的分隔符列表，按优先级尝试
    separators=["\n\n", "\n", "。", "，", " ", ""],
    
    # 是否保留分隔符
    keep_separator=True,
    
    # 是否按 Token 长度计算（需要 tiktoken）
    length_function=len,
)

chunks = text_splitter.split_documents(docs)
```

#### 2.2.3 切分策略详解

**递归字符切分（推荐）**：

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 默认配置，适合大多数场景
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "。", "，", " ", ""]
)

# 代码专用配置
code_splitter = RecursiveCharacterTextSplitter.from_language(
    language="python",
    chunk_size=1000,
    chunk_overlap=200
)
```

**Markdown 专用切分**：

```python
from langchain.text_splitter import MarkdownHeaderTextSplitter

# 按 Markdown 标题层级切分
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]

markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on
)

md_chunks = markdown_splitter.split_text(markdown_content)
```

**Token 切分**：

```python
from langchain.text_splitter import TokenTextSplitter

# 按 Token 切分，适合精确控制上下文长度
token_splitter = TokenTextSplitter(
    chunk_size=512,      # 每个块 512 tokens
    chunk_overlap=50     # 重叠 50 tokens
)

token_chunks = token_splitter.split_documents(docs)
```

### 2.3 切分策略选择指南

```
┌─────────────────────────────────────────────────────────────┐
│                    切分策略选择决策树                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  文档类型是什么？                                            │
│       │                                                     │
│       ├─► Markdown/HTML ──▶ MarkdownHeaderTextSplitter      │
│       │                                                     │
│       ├─► 代码文件 ────────▶ Language-aware Splitter        │
│       │                                                     │
│       └─► 普通文本 ────────▶ RecursiveCharacterTextSplitter │
│                              │                              │
│                              ▼                              │
│                    需要语义连贯性？                          │
│                         │                                   │
│                    是 ──┼──► 增大 chunk_overlap (20-30%)    │
│                         │                                   │
│                    否 ──┴──► 标准 overlap (10-15%)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**chunk_size 选择建议**：

| 场景 | chunk_size | chunk_overlap | 说明 |
|------|-----------|---------------|------|
| 问答系统 | 200-500 | 50 | 精确检索短答案 |
| 文档摘要 | 1000-2000 | 200 | 保留完整上下文 |
| 代码检索 | 500-1000 | 100 | 保留函数完整性 |
| 长文档分析 | 2000-4000 | 400 | 减少切分数量 |

---

## 三、Embedding 模型选型

### 3.1 Embedding 模型原理

Embedding 模型将文本转换为高维向量，使得语义相似的文本在向量空间中距离相近。

```
文本 ──▶ Embedding 模型 ──▶ 向量 (如 768 维或 1536 维)

"苹果是一种水果"  ──▶  [0.12, -0.34, 0.56, ...]
"iPhone 是手机"   ──▶  [0.45, 0.12, -0.78, ...]
"香蕉很好吃"      ──▶  [0.15, -0.30, 0.52, ...]  ← 与第一句距离近
```

### 3.2 主流 Embedding 模型对比

| 模型 | 维度 | 语言支持 | 特点 | 适用场景 |
|------|------|---------|------|---------|
| text-embedding-3-small | 1536 | 多语言 | OpenAI 出品，性价比高 | 通用英文场景 |
| text-embedding-3-large | 3072 | 多语言 | 性能更强，价格更高 | 高质量需求 |
| text-embedding-ada-002 | 1536 | 多语言 | 上一代模型 | 兼容性需求 |
| BGE-M3 | 1024 | 中英为主 | 开源，中文效果好 | 中文场景首选 |
| BGE-large-zh | 1024 | 中文 | 开源中文 SOTA | 纯中文场景 |
| GTE-large | 1024 | 多语言 | 阿里开源，效果优秀 | 中英文混合 |
| M3E-base | 768 | 中文 | 开源，轻量 | 资源受限场景 |

### 3.3 模型选型代码示例

**OpenAI Embedding**：

```python
from langchain_openai import OpenAIEmbeddings

# text-embedding-3-small（推荐）
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    dimensions=1536  # 可指定输出维度
)

# text-embedding-3-large
embeddings_large = OpenAIEmbeddings(
    model="text-embedding-3-large"
)
```

**开源 Embedding（HuggingFace）**：

```python
from langchain_huggingface import HuggingFaceEmbeddings

# BGE-M3（中文推荐）
bge_embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-m3",
    model_kwargs={'device': 'cuda'},
    encode_kwargs={'normalize_embeddings': True}
)

# BGE-large-zh
bge_zh_embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5"
)

# GTE-large
gte_embeddings = HuggingFaceEmbeddings(
    model_name="thenlper/gte-large"
)
```

**Ollama 本地 Embedding**：

```python
from langchain_ollama import OllamaEmbeddings

# 使用 Ollama 本地运行 embedding 模型
ollama_embeddings = OllamaEmbeddings(
    model="nomic-embed-text",  # 或 "mxbai-embed-large"
    base_url="http://localhost:11434"
)
```

### 3.4 Embedding 模型评估

```python
# 简单的相似度测试
test_queries = [
    ("机器学习是什么", "什么是机器学习", True),   # 应该相似
    ("机器学习是什么", "深度学习原理", True),     # 应该较相似
    ("机器学习是什么", "今天天气很好", False),    # 应该不相似
]

for q1, q2, should_similar in test_queries:
    vec1 = embeddings.embed_query(q1)
    vec2 = embeddings.embed_query(q2)
    
    # 计算余弦相似度
    similarity = cosine_similarity([vec1], [vec2])[0][0]
    print(f"'{q1}' vs '{q2}': {similarity:.3f}")
```

---

## 四、实战：加载技术文档并切分

### 4.1 完整代码示例

```python
import os
from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredMarkdownLoader,
    DirectoryLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# ========== 1. 加载文档 ==========

def load_documents(docs_path):
    """加载多种格式的文档"""
    documents = []
    
    # 加载 PDF
    if os.path.exists(os.path.join(docs_path, "pdfs")):
        for pdf_file in os.listdir(os.path.join(docs_path, "pdfs")):
            if pdf_file.endswith(".pdf"):
                loader = PyPDFLoader(
                    os.path.join(docs_path, "pdfs", pdf_file)
                )
                documents.extend(loader.load())
    
    # 加载 Markdown
    md_loader = DirectoryLoader(
        docs_path,
        glob="**/*.md",
        loader_cls=UnstructuredMarkdownLoader,
        show_progress=True
    )
    documents.extend(md_loader.load())
    
    print(f"共加载 {len(documents)} 个文档片段")
    return documents

# ========== 2. 切分文档 ==========

def split_documents(documents):
    """递归切分文档"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,      # 每个块约 1000 字符
        chunk_overlap=200,    # 重叠 200 字符，保持上下文连贯
        separators=["\n\n", "\n", "。", "，", " ", ""],
        length_function=len,
        is_separator_regex=False
    )
    
    chunks = text_splitter.split_documents(documents)
    
    # 添加元数据
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i
        chunk.metadata["chunk_size"] = len(chunk.page_content)
    
    print(f"切分为 {len(chunks)} 个文本块")
    print(f"平均块大小: {sum(len(c.page_content) for c in chunks) / len(chunks):.0f} 字符")
    
    return chunks

# ========== 3. 创建向量数据库 ==========

def create_vectorstore(chunks, persist_dir="./chroma_db"):
    """创建并持久化向量数据库"""
    
    # 初始化 Embedding 模型
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        model_kwargs={'device': 'cuda'},  # 使用 GPU
        encode_kwargs={
            'normalize_embeddings': True,  # 归一化向量
            'batch_size': 32
        }
    )
    
    # 创建向量数据库
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir,
        collection_name="tech_docs"
    )
    
    # 持久化
    vectorstore.persist()
    
    print(f"向量数据库已保存至: {persist_dir}")
    print(f"集合中的文档数: {vectorstore._collection.count()}")
    
    return vectorstore

# ========== 4. 主流程 ==========

def main():
    docs_path = "./technical_docs"
    
    # 1. 加载
    documents = load_documents(docs_path)
    
    # 2. 切分
    chunks = split_documents(documents)
    
    # 3. 存储
    vectorstore = create_vectorstore(chunks)
    
    # 4. 测试检索
    query = "什么是 RAG 系统？"
    results = vectorstore.similarity_search(query, k=3)
    
    print(f"\n查询: {query}")
    print("=" * 50)
    for i, doc in enumerate(results, 1):
        print(f"\n结果 {i}:")
        print(f"来源: {doc.metadata.get('source', 'unknown')}")
        print(f"内容: {doc.page_content[:200]}...")

if __name__ == "__main__":
    main()
```

### 4.2 运行结果示例

```
共加载 15 个文档片段
切分为 127 个文本块
平均块大小: 892 字符
向量数据库已保存至: ./chroma_db
集合中的文档数: 127

查询: 什么是 RAG 系统？
==================================================

结果 1:
来源: ./technical_docs/rag_intro.md
内容: RAG（Retrieval-Augmented Generation）是一种将检索与生成相结合的AI架构。它通过从外部知识库检索相关信息...

结果 2:
来源: ./technical_docs/ai_architecture.md
内容: 检索增强生成系统由三个核心组件构成：文档检索器、向量数据库和大语言模型...

结果 3:
来源: ./technical_docs/rag_intro.md
内容: 在RAG系统中，当用户提出问题时，系统首先将问题转换为向量表示，然后在向量数据库中查找最相似的文档片段...
```

---

## 五、面试考点

### 5.1 RAG 核心流程

**Q: 请描述 RAG 的完整工作流程？**

> **答**：RAG 分为两个阶段：
> 
> **索引阶段**：
> 1. 使用 Document Loader 加载原始文档
> 2. 通过 Text Splitter 将文档切分为适当大小的 chunks
> 3. 使用 Embedding 模型将文本转换为向量
> 4. 存储到向量数据库（如 Chroma、Milvus、Pinecone）
> 
> **检索生成阶段**：
> 1. 接收用户查询，转换为向量
> 2. 在向量数据库中检索 Top-K 相似文本块
> 3. 将检索结果作为上下文，构建 Prompt
> 4. 调用 LLM 生成最终回答

### 5.2 切分策略选择

**Q: 如何选择合适的 chunk_size 和 chunk_overlap？**

> **答**：
> - **chunk_size**：取决于任务类型和 LLM 上下文窗口。问答任务建议 200-500，摘要任务建议 1000-2000。需考虑 Embedding 模型的最大输入长度。
> - **chunk_overlap**：通常为 chunk_size 的 10-20%。重叠可保持上下文连贯性，但过大会增加冗余和存储成本。
> - **选择原则**：在保证语义完整性的前提下，尽量增大 chunk_size 以减少向量数量，提高检索效率。

**Q: 递归字符切分和普通字符切分有什么区别？**

> **答**：
> - **普通字符切分**：按固定长度切分，可能切断句子或段落，破坏语义完整性。
> - **递归字符切分**：按优先级尝试多个分隔符（如段落、句子、标点），优先在语义边界处切分，能更好地保持文本连贯性。

### 5.3 Embedding 模型选型

**Q: 中文场景应该选择哪个 Embedding 模型？**

> **答**：
> - **BGE-M3**：目前中文开源模型的首选，支持多语言，效果优秀
> - **BGE-large-zh**：纯中文场景效果最佳
> - **GTE-large**：阿里开源，中英文混合场景表现好
> - **OpenAI text-embedding-3**：如果预算允许，API 调用方便
> - **M3E-base**：资源受限场景，模型较小

**Q: 如何评估 Embedding 模型的效果？**

> **答**：
> 1. **内在评估**：计算标准数据集（如 C-MTEB）上的指标
> 2. **外在评估**：在下游任务（检索、聚类）中测试实际效果
> 3. **人工评估**：抽样检查相似度计算结果是否符合直觉
> 4. **业务指标**：端到端测试 RAG 系统的回答质量

### 5.4 常见问题

**Q: RAG 和 Fine-tuning 有什么区别？**

| 维度 | RAG | Fine-tuning |
|------|-----|-------------|
| 知识更新 | 实时更新知识库 | 需要重新训练 |
| 幻觉控制 | 基于检索事实，可控 | 依赖模型自身 |
| 成本 | 检索成本低 | 训练成本高 |
| 适用场景 | 频繁更新的知识 | 固定领域知识 |

**Q: 向量检索有哪些优化方法？**

> **答**：
> 1. **索引优化**：使用 HNSW、IVF 等近似最近邻算法
> 2. **重排序（Rerank）**：使用 Cross-Encoder 对初筛结果精排
> 3. **查询重写**：扩展或改写用户查询以提高召回
> 4. **混合检索**：结合向量检索和关键词检索（BM25）
> 5. **元数据过滤**：先按标签过滤再向量检索

---

## 六、小结

本文详细介绍了 RAG 系统的核心组件：

1. **RAG 架构**：理解索引和检索两个阶段的工作流程
2. **文档加载**：掌握多种 Loader 的使用方法
3. **切分策略**：根据场景选择合适的切分方式和参数
4. **Embedding 选型**：中文场景推荐 BGE 系列模型
5. **实战演练**：完整代码演示从加载到存储的全流程

在下一篇文章中，我们将深入讲解向量数据库选型、检索优化策略以及完整的 RAG 应用开发。

---

## 参考资源

- [LangChain 文档 - Document Loaders](https://python.langchain.com/docs/modules/data_connection/document_loaders/)
- [LangChain 文档 - Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers/)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard) - Embedding 模型排行榜
- [BGE 模型 GitHub](https://github.com/FlagOpen/FlagEmbedding)
- [C-MTEB 中文评测](https://github.com/FlagOpen/FlagEmbedding/tree/master/C_MTEB)
