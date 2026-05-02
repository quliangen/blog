---
title: 25-项目三：私有化部署方案
description: 开源模型选型，全链路私有化架构设计与实施
---

# 25-项目三：私有化部署方案

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级开发能力 | ✅ 性能/安全/成本 |
| 工程化能力 | ✅ 监控/测试/部署 |
| 项目交付能力 | ✅ 完整项目实战 |
| 私有化部署经验 | ✅ 全链路架构设计 |
| 成本控制能力 | ✅ 硬件选型与成本分析 |

## 学习目标

学完本节，你将能够：
1. 根据业务需求选择合适的开源大模型
2. 掌握主流部署方案（Ollama/vLLM/TGI）的选型与使用
3. 设计全链路私有化架构（模型+向量库+应用）
4. 进行硬件需求评估与成本分析
5. 完成生产级私有化部署

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 了解 Docker 和 Linux 基础操作
- 具备基础的 GPU 知识

---

## 一、开源模型选型：Llama、Qwen、ChatGLM 对比

### 1.1 主流开源模型概览

| 模型系列 | 开发团队 | 最新版本 | 参数规模 | 许可证 |
|---------|---------|---------|---------|--------|
| **Llama** | Meta | Llama 3.3 | 8B/70B/405B | 商业友好 |
| **Qwen** | 阿里云 | Qwen2.5 | 0.5B-72B | Apache 2.0 |
| **ChatGLM** | 智谱AI | GLM-4 | 9B/32B | 商业友好 |
| **DeepSeek** | DeepSeek | V3 | 671B(MoE) | MIT |
| **Baichuan** | 百川智能 | Baichuan2 | 7B/13B | 商业友好 |

### 1.2 详细对比分析

#### Llama 系列 (Meta)

**优势：**
- 生态最完善，社区支持最强
- 英文能力顶尖，多语言支持良好
- 工具调用能力优秀
- 量化方案成熟

**劣势：**
- 中文能力相对较弱
- 405B 版本硬件要求极高

**适用场景：**
- 国际化业务
- 英文为主的 RAG 应用
- 需要丰富生态支持的项目

```bash
# 推荐模型
llama3.3:70b          # 平衡性能与效果
llama3.1:8b           # 轻量级部署
llama3.3:latest       # 最新版本
```

#### Qwen 系列 (阿里云)

**优势：**
- 中文能力业界领先
- 长文本支持优秀（128K+）
- 代码能力强
- 多模态支持完善
- 开源协议最宽松（Apache 2.0）

**劣势：**
- 英文场景略逊于 Llama
- 72B 版本资源消耗大

**适用场景：**
- 中文为主的业务场景
- 长文档处理
- 代码生成与审查

```bash
# 推荐模型
qwen2.5:72b           # 顶级中文能力
qwen2.5:32b           # 性价比之选
qwen2.5:14b           # 轻量级高性能
qwen2.5-coder:14b     # 代码专用
```

#### ChatGLM 系列 (智谱AI)

**优势：**
- 中文理解和生成能力强
- 工具调用支持好
- 国产合规优势明显
- 长文本推理优化

**劣势：**
- 开源版本参数规模有限
- 生态相对封闭

**适用场景：**
- 国内合规要求严格的场景
- 中文对话应用
- 工具调用密集型应用

```bash
# 推荐模型
glm-4:9b              # 轻量高效
glm-4:32b             # 高性能版本
```

### 1.3 选型决策矩阵

| 评估维度 | Llama 3.3 | Qwen2.5 | ChatGLM-4 |
|---------|-----------|---------|-----------|
| 中文能力 | ★★★☆☆ | ★★★★★ | ★★★★☆ |
| 英文能力 | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| 代码能力 | ★★★★☆ | ★★★★★ | ★★★★☆ |
| 长文本 | ★★★★☆ | ★★★★★ | ★★★★☆ |
| 推理速度 | ★★★★☆ | ★★★★☆ | ★★★★☆ |
| 生态支持 | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| 许可证友好度 | ★★★★☆ | ★★★★★ | ★★★★☆ |

### 1.4 选型建议

```
场景决策树：

中文业务占比 > 70%?
├── 是 → 需要代码能力?
│   ├── 是 → Qwen2.5-Coder
│   └── 否 → Qwen2.5-72B/32B
└── 否 → 国际化业务?
    ├── 是 → Llama 3.3-70B
    └── 否 → 合规要求严格?
        ├── 是 → ChatGLM-4
        └── 否 → Qwen2.5 (综合最优)
```

---

## 二、模型部署方案：Ollama、vLLM、TGI 对比与选择

### 2.1 部署方案概览

| 方案 | 定位 | 性能 | 易用性 | 适用规模 |
|-----|------|-----|--------|---------|
| **Ollama** | 本地开发/轻量部署 | 中等 | ★★★★★ | 单机/小团队 |
| **vLLM** | 生产级高性能推理 | 极高 | ★★★★☆ | 企业级/高并发 |
| **TGI** | HuggingFace 生态 | 高 | ★★★☆☆ | 企业级/标准化 |
| **llama.cpp** | 边缘/CPU 部署 | 低 | ★★★★☆ | 资源受限环境 |

### 2.2 Ollama 详解

**定位：** 本地大模型运行工具，极简部署

**优势：**
- 一键安装，开箱即用
- 模型管理方便
- REST API 支持
- 跨平台支持（Win/Mac/Linux）

**劣势：**
- 高并发性能有限
- 缺乏高级调度功能
- 生产级监控不足

**适用场景：**
- 开发测试环境
- 个人/小团队使用
- 快速原型验证
- 轻量级生产部署（低并发）

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 启动服务
ollama serve

# 拉取模型
ollama pull qwen2.5:14b

# 运行模型
ollama run qwen2.5:14b
```

### 2.3 vLLM 详解

**定位：** 高吞吐量、低延迟的生产级推理引擎

**核心特性：**
- **PagedAttention**：突破性的注意力优化
- **Continuous Batching**：动态批处理
- **Tensor Parallelism**：张量并行支持
- **Pipeline Parallelism**：流水线并行支持

**优势：**
- 吞吐量比传统方案高 10-20 倍
- 支持多种量化方案
- 完善的 OpenAI API 兼容
- 灵活的调度策略

**劣势：**
- 配置相对复杂
- 需要 GPU 环境
- 学习曲线较陡

**适用场景：**
- 高并发生产环境
- API 服务部署
- 成本敏感的大规模部署

```bash
# 安装 vLLM
pip install vllm

# 启动服务
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-14B-Instruct \
    --tensor-parallel-size 2 \
    --max-num-seqs 256 \
    --max-model-len 8192
```

### 2.4 TGI (Text Generation Inference) 详解

**定位：** HuggingFace 推出的生产级推理服务

**核心特性：**
- 与 HuggingFace 生态深度集成
- 支持 Flash Attention 2
- 支持 Safetensors 格式
- 完善的量化支持

**优势：**
- 生态集成度高
- 支持多种模型架构
- Docker 部署便捷
- 内置监控指标

**劣势：**
- 性能略逊于 vLLM
- 社区活跃度不如 vLLM

**适用场景：**
- HuggingFace 生态重度用户
- 需要标准化部署流程
- 多模型统一管理

```bash
# Docker 部署
docker run --gpus all \
    -p 8080:80 \
    -v $PWD/data:/data \
    ghcr.io/huggingface/text-generation-inference:2.0 \
    --model-id Qwen/Qwen2.5-14B-Instruct \
    --num-shard 2
```

### 2.5 方案选型建议

| 场景 | 推荐方案 | 理由 |
|-----|---------|------|
| 开发/测试 | Ollama | 快速启动，零配置 |
| 生产高并发 | vLLM | 极致性能，成本最优 |
| HF 生态集成 | TGI | 生态兼容，标准化 |
| CPU/边缘部署 | llama.cpp | 低资源占用 |
| 快速原型 | Ollama | 分钟级部署 |

---

## 三、全链路私有化架构

### 3.1 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Web App  │  │  API GW  │  │  Agent   │  │  Admin   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                      服务层 │                               │
│  ┌─────────────────────────┼──────────────────────────┐   │
│  │                    LLM Service                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │  vLLM    │  │  Ollama  │  │   TGI    │         │   │
│  │  │ (主服务)  │  │ (备用)   │  │ (扩展)   │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │                Embedding Service                    │   │
│  │         (BGE/ text2vec / OpenAI API)               │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────┴────────┐  ┌────────┴────────┐  ┌───────┴────────┐
│    向量数据库    │  │    缓存层        │  │    存储层       │
│  ┌──────────┐  │  │  ┌──────────┐   │  │  ┌──────────┐  │
│  │ Milvus   │  │  │  │  Redis   │   │  │  │   MinIO  │  │
│  │(大规模)   │  │  │  │ (缓存)   │   │  │  │ (对象存储)│  │
│  └──────────┘  │  │  └──────────┘   │  │  └──────────┘  │
│  ┌──────────┐  │  │                 │  │                 │
│  │PgVector  │  │  │                 │  │                 │
│  │(中小规模) │  │  │                 │  │                 │
│  └──────────┘  │  │                 │  │                 │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3.2 组件选型

#### 向量数据库对比

| 特性 | Milvus | pgvector | Chroma | Qdrant |
|-----|--------|----------|--------|--------|
| 规模 | 百亿级 | 百万级 | 十万级 | 亿级 |
| 性能 | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ |
| 功能 | 丰富 | 基础 | 简单 | 中等 |
| 运维 | 复杂 | 简单 | 极简 | 中等 |
| 推荐场景 | 大规模生产 | PG 生态 | 快速原型 | 中等规模 |

#### Embedding 模型选型

```python
# 中文场景推荐
embedding_models = {
    "bge-large-zh-v1.5": {
        "维度": 1024,
        "性能": "★★★★★",
        "适用": "通用中文",
        "大小": "1.3GB"
    },
    "bge-m3": {
        "维度": 1024,
        "性能": "★★★★★",
        "适用": "多语言/长文本",
        "大小": "2.2GB"
    },
    "text2vec-large-chinese": {
        "维度": 1024,
        "性能": "★★★★☆",
        "适用": "语义搜索",
        "大小": "1.2GB"
    }
}
```

---

## 四、硬件需求与成本分析

### 4.1 GPU 显存需求计算

```python
def calculate_gpu_memory(
    model_params: int,      # 参数量（B）
    precision: str,         # 精度: fp16/int8/int4
    batch_size: int = 1,    # 批大小
    max_seq_len: int = 4096, # 最大序列长度
    kv_cache_factor: float = 0.2  # KV Cache 系数
) -> float:
    """
    计算 GPU 显存需求（GB）
    """
    # 基础模型权重显存
    bytes_per_param = {
        "fp32": 4,
        "fp16": 2,
        "bf16": 2,
        "int8": 1,
        "int4": 0.5
    }
    
    model_memory = model_params * bytes_per_param[precision]
    
    # KV Cache 显存
    kv_memory = model_params * kv_cache_factor * batch_size * (max_seq_len / 4096)
    
    # 激活值显存（约 10-20%）
    activation_memory = model_memory * 0.15 * batch_size
    
    # 总显存 + 20% 余量
    total = (model_memory + kv_memory + activation_memory) * 1.2
    
    return round(total, 2)


# 常见配置计算
configs = [
    ("Qwen2.5-14B", 14, "fp16", 1, 4096),
    ("Qwen2.5-14B", 14, "int8", 4, 8192),
    ("Qwen2.5-32B", 32, "int8", 1, 4096),
    ("Qwen2.5-72B", 72, "int4", 1, 4096),
    ("Llama3.3-70B", 70, "int4", 2, 8192),
]

for name, params, prec, bs, seq in configs:
    mem = calculate_gpu_memory(params, prec, bs, seq)
    print(f"{name} ({prec}, bs={bs}, seq={seq}): {mem} GB")
```

**输出结果：**

| 配置 | 显存需求 | 推荐 GPU |
|-----|---------|---------|
| Qwen2.5-14B FP16 bs=1 | ~34 GB | A100 40GB / A10 |
| Qwen2.5-14B INT8 bs=4 | ~38 GB | A100 40GB |
| Qwen2.5-32B INT8 bs=1 | ~50 GB | A100 80GB |
| Qwen2.5-72B INT4 bs=1 | ~55 GB | 2x A100 40GB |
| Llama3.3-70B INT4 bs=2 | ~62 GB | 2x A100 40GB |

### 4.2 硬件配置方案

#### 方案一：轻量级（开发/测试）

```yaml
用途: 开发测试、个人使用
配置:
  GPU: RTX 4090 (24GB)
  CPU: 16核+
  内存: 64GB
  存储: 1TB NVMe
支持模型:
  - Qwen2.5-14B INT8
  - Llama3.3-8B FP16
  - ChatGLM-4-9B FP16
预估成本: ¥15,000-20,000
```

#### 方案二：中型生产（中小团队）

```yaml
用途: 中小规模生产环境
配置:
  GPU: A100 40GB x 2
  CPU: 32核+
  内存: 128GB
  存储: 2TB NVMe SSD
支持模型:
  - Qwen2.5-32B INT8
  - Qwen2.5-72B INT4
  - Llama3.3-70B INT4
预估成本: ¥150,000-200,000
```

#### 方案三：大型生产（企业级）

```yaml
用途: 高并发企业级部署
配置:
  GPU: A100 80GB x 8
  CPU: 64核+
  内存: 512GB
  存储: 10TB NVMe SSD + 对象存储
支持模型:
  - Qwen2.5-72B FP16 (张量并行)
  - Llama3.3-70B FP16
  - 多模型并发服务
预估成本: ¥800,000-1,200,000
```

### 4.3 云厂商成本对比（月度）

| 云厂商 | A100 40GB x2 | A100 80GB x8 | 备注 |
|-------|-------------|-------------|------|
| 阿里云 | ¥12,000 | ¥80,000 | 包年包月优惠 |
| 腾讯云 | ¥11,500 | ¥75,000 | 新用户折扣 |
| 华为云 | ¥13,000 | ¥85,000 | 昇腾替代方案 |
| AWS | $4,500 | $30,000 | 按需计费 |
| 自建 | ¥3,000 | ¥12,000 | 仅电费+折旧 |

---

## 五、完整部署脚本和配置

### 5.1 Docker Compose 全链路部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # LLM 推理服务 (vLLM)
  vllm:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=0,1
      - CUDA_VISIBLE_DEVICES=0,1
    volumes:
      - ./models:/models
      - ~/.cache/huggingface:/root/.cache/huggingface
    command: >
      --model /models/Qwen2.5-14B-Instruct
      --tensor-parallel-size 2
      --max-num-seqs 256
      --max-model-len 8192
      --dtype half
      --quantization fp8
      --port 8000
      --api-key ${API_KEY:-your-api-key}
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ai-network

  # Embedding 服务
  embedding:
    image: huggingface/transformers-pytorch-gpu:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=0
      - MODEL_NAME=BAAI/bge-large-zh-v1.5
    volumes:
      - ./models:/models
      - ./embedding_server.py:/app/server.py
    working_dir: /app
    command: python server.py
    ports:
      - "8080:8080"
    networks:
      - ai-network

  # 向量数据库 (Milvus)
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
    volumes:
      - ./volumes/etcd:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    networks:
      - ai-network

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - ./volumes/minio:/minio_data
    command: minio server /minio_data
    ports:
      - "9001:9001"
    networks:
      - ai-network

  milvus:
    container_name: milvus-standalone
    image: milvusdb/milvus:v2.3.3
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ./volumes/milvus:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - etcd
      - minio
    networks:
      - ai-network

  # 应用服务
  api:
    build:
      context: ./app
      dockerfile: Dockerfile
    environment:
      - LLM_BASE_URL=http://vllm:8000/v1
      - LLM_API_KEY=${API_KEY:-your-api-key}
      - EMBEDDING_BASE_URL=http://embedding:8080
      - MILVUS_HOST=milvus
      - MILVUS_PORT=19530
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - vllm
      - embedding
      - milvus
      - redis
    networks:
      - ai-network

  redis:
    image: redis:7-alpine
    volumes:
      - ./volumes/redis:/data
    networks:
      - ai-network

  # 监控
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - ai-network

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./volumes/grafana:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    networks:
      - ai-network

networks:
  ai-network:
    driver: bridge
```

### 5.2 Embedding 服务代码

```python
# embedding_server.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

app = FastAPI(title="Embedding Service")

# 模型配置
MODEL_NAME = "BAAI/bge-large-zh-v1.5"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# 加载模型
print(f"Loading model {MODEL_NAME} on {DEVICE}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

class EmbeddingRequest(BaseModel):
    texts: List[str]
    normalize: bool = True

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int
    model: str

def get_embedding(texts: List[str], normalize: bool = True) -> np.ndarray:
    """生成文本嵌入"""
    # BGE 模型需要添加指令前缀
    instruction = "为这个句子生成表示以用于检索相关文章："
    texts = [instruction + t for t in texts]
    
    # Tokenize
    encoded = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=512,
        return_tensors="pt"
    ).to(DEVICE)
    
    # 推理
    with torch.no_grad():
        model_output = model(**encoded)
        # 使用 [CLS] token 的 embedding
        embeddings = model_output.last_hidden_state[:, 0]
    
    # 归一化
    if normalize:
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
    
    return embeddings.cpu().numpy()

@app.post("/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    embeddings = get_embedding(request.texts, request.normalize)
    return EmbeddingResponse(
        embeddings=embeddings.tolist(),
        dimensions=embeddings.shape[1],
        model=MODEL_NAME
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_NAME, "device": DEVICE}

@app.get("/")
async def root():
    return {
        "service": "Embedding Service",
        "model": MODEL_NAME,
        "dimensions": 1024,
        "device": DEVICE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

### 5.3 应用服务代码

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import openai
from pymilvus import connections, Collection
import redis
import json
import hashlib

app = FastAPI(title="Private AI Agent API")

# 配置
LLM_BASE_URL = "http://vllm:8000/v1"
LLM_API_KEY = "your-api-key"
EMBEDDING_BASE_URL = "http://embedding:8080"

# 初始化客户端
llm_client = openai.OpenAI(
    base_url=LLM_BASE_URL,
    api_key=LLM_API_KEY
)

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

# 连接 Milvus
connections.connect(host='milvus', port='19530')
collection = Collection("documents")

class ChatRequest(BaseModel):
    messages: List[dict]
    temperature: float = 0.7
    max_tokens: int = 2048
    use_rag: bool = True
    stream: bool = False

class RAGRequest(BaseModel):
    query: str
    top_k: int = 5
    collection: str = "documents"

@app.post("/chat/completions")
async def chat_completion(request: ChatRequest):
    """聊天补全接口（支持 RAG）"""
    try:
        messages = request.messages
        
        # 如果启用 RAG，检索相关文档
        if request.use_rag and messages:
            last_message = messages[-1].get("content", "")
            context = await retrieve_context(last_message)
            if context:
                system_msg = {
                    "role": "system",
                    "content": f"基于以下上下文回答问题：\n\n{context}"
                }
                messages = [system_msg] + messages
        
        # 调用 LLM
        response = llm_client.chat.completions.create(
            model="Qwen2.5-14B-Instruct",
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream
        )
        
        if request.stream:
            return response
        
        return {
            "id": response.id,
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": response.choices[0].message.content
                    },
                    "finish_reason": response.choices[0].finish_reason
                }
            ],
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def retrieve_context(query: str, top_k: int = 5) -> str:
    """检索相关文档上下文"""
    # 生成查询 embedding
    import requests
    
    # 检查缓存
    cache_key = f"embedding:{hashlib.md5(query.encode()).hexdigest()}"
    cached = redis_client.get(cache_key)
    
    if cached:
        query_embedding = json.loads(cached)
    else:
        resp = requests.post(
            f"{EMBEDDING_BASE_URL}/embeddings",
            json={"texts": [query], "normalize": True}
        )
        query_embedding = resp.json()["embeddings"][0]
        # 缓存 1 小时
        redis_client.setex(cache_key, 3600, json.dumps(query_embedding))
    
    # 向量搜索
    search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
    results = collection.search(
        data=[query_embedding],
        anns_field="embedding",
        param=search_params,
        limit=top_k,
        output_fields=["content", "source"]
    )
    
    # 组装上下文
    contexts = []
    for hits in results:
        for hit in hits:
            contexts.append(f"[来源: {hit.entity.get('source')}]\n{hit.entity.get('content')}")
    
    return "\n\n---\n\n".join(contexts)

@app.post("/rag/search")
async def rag_search(request: RAGRequest):
    """RAG 检索接口"""
    context = await retrieve_context(request.query, request.top_k)
    return {
        "query": request.query,
        "contexts": context.split("\n\n---\n\n") if context else [],
        "count": len(context.split("\n\n---\n\n")) if context else 0
    }

@app.post("/documents")
async def add_document(content: str, source: str, doc_id: Optional[str] = None):
    """添加文档到向量库"""
    import requests
    
    # 生成 embedding
    resp = requests.post(
        f"{EMBEDDING_BASE_URL}/embeddings",
        json={"texts": [content], "normalize": True}
    )
    embedding = resp.json()["embeddings"][0]
    
    # 插入 Milvus
    doc_id = doc_id or hashlib.md5(content.encode()).hexdigest()
    mr = collection.insert([
        [doc_id],
        [content],
        [source],
        [embedding]
    ])
    
    return {"doc_id": doc_id, "insert_count": mr.insert_count}

@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "healthy",
        "llm_service": "connected",
        "vector_db": "connected",
        "cache": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
```

### 5.4 部署脚本

```bash
#!/bin/bash
# deploy.sh - 私有化部署脚本

set -e

echo "=== AI Agent 私有化部署脚本 ==="

# 检查环境
check_environment() {
    echo "[1/6] 检查环境..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "安装 Docker..."
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "安装 Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # 检查 NVIDIA Docker
    if ! docker info | grep -q "nvidia"; then
        echo "安装 NVIDIA Container Toolkit..."
        distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
        curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
        curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
        sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
        sudo systemctl restart docker
    fi
    
    echo "环境检查完成 ✓"
}

# 下载模型
download_models() {
    echo "[2/6] 下载模型..."
    
    mkdir -p models
    
    # 使用 huggingface-cli 或 modelscope
    if command -v huggingface-cli &> /dev/null; then
        echo "从 HuggingFace 下载..."
        huggingface-cli download Qwen/Qwen2.5-14B-Instruct --local-dir ./models/Qwen2.5-14B-Instruct
    else
        echo "从 ModelScope 下载（国内推荐）..."
        pip install modelscope
        python3 -c "
from modelscope import snapshot_download
snapshot_download('qwen/Qwen2.5-14B-Instruct', cache_dir='./models')
"
    fi
    
    echo "模型下载完成 ✓"
}

# 初始化配置
init_config() {
    echo "[3/6] 初始化配置..."
    
    # 创建目录
    mkdir -p volumes/{etcd,minio,milvus,redis,grafana}
    
    # 生成环境变量文件
    cat > .env << EOF
API_KEY=$(openssl rand -hex 32)
LLM_MODEL_PATH=./models/Qwen2.5-14B-Instruct
EMBEDDING_MODEL=BAAI/bge-large-zh-v1.5
MILVUS_COLLECTION=documents
LOG_LEVEL=INFO
EOF
    
    # 创建 Milvus 集合初始化脚本
    cat > init_milvus.py << 'PYEOF'
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection

connections.connect(host='localhost', port='19530')

fields = [
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=512),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1024)
]

schema = CollectionSchema(fields, "Document collection for RAG")
collection = Collection("documents", schema)

# 创建索引
index_params = {
    "metric_type": "COSINE",
    "index_type": "IVF_FLAT",
    "params": {"nlist": 1024}
}
collection.create_index("embedding", index_params)
collection.load()
print("Milvus collection initialized")
PYEOF
    
    echo "配置初始化完成 ✓"
}

# 启动服务
start_services() {
    echo "[4/6] 启动服务..."
    
    # 加载环境变量
    export $(cat .env | xargs)
    
    # 启动基础服务
    docker-compose up -d etcd minio redis milvus
    
    # 等待 Milvus 就绪
    echo "等待 Milvus 就绪..."
    sleep 10
    
    # 初始化 Milvus
    python3 init_milvus.py
    
    # 启动 Embedding 服务
    docker-compose up -d embedding
    
    # 等待 Embedding 就绪
    echo "等待 Embedding 服务就绪..."
    sleep 5
    
    # 启动 LLM 服务
    docker-compose up -d vllm
    
    # 等待 LLM 就绪
    echo "等待 LLM 服务就绪（可能需要几分钟加载模型）..."
    until curl -s http://localhost:8000/health > /dev/null; do
        sleep 5
    done
    
    # 启动应用服务
    docker-compose up -d api
    
    echo "所有服务启动完成 ✓"
}

# 验证部署
verify_deployment() {
    echo "[5/6] 验证部署..."
    
    # 健康检查
    services=("vllm:8000" "embedding:8080" "api:3000")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -s "http://localhost:$port/health" > /dev/null; then
            echo "  $name: 健康 ✓"
        else
            echo "  $name: 异常 ✗"
        fi
    done
    
    # 测试 LLM 推理
    echo "测试 LLM 推理..."
    curl -s -X POST http://localhost:8000/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d '{
            "model": "Qwen2.5-14B-Instruct",
            "messages": [{"role": "user", "content": "你好"}],
            "max_tokens": 100
        }' | head -c 200
    
    echo -e "\n部署验证完成 ✓"
}

# 显示信息
show_info() {
    echo "[6/6] 部署信息"
    echo "=============="
    echo "API 地址: http://localhost:3000"
    echo "LLM 服务: http://localhost:8000"
    echo "监控面板: http://localhost:3001 (admin/admin)"
    echo "API Key: $(grep API_KEY .env | cut -d= -f2)"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker-compose logs -f [service]"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "=============="
}

# 主流程
main() {
    check_environment
    download_models
    init_config
    start_services
    verify_deployment
    show_info
}

# 根据参数执行
if [ "$1" == "clean" ]; then
    echo "清理部署..."
    docker-compose down -v
    rm -rf volumes/
    echo "清理完成"
elif [ "$1" == "update" ]; then
    echo "更新服务..."
    docker-compose pull
    docker-compose up -d
    echo "更新完成"
else
    main
fi
```

---

## 六、性能与成本权衡分析

### 6.1 性能优化策略

#### 量化策略对比

| 量化方案 | 精度损失 | 速度提升 | 显存节省 | 适用场景 |
|---------|---------|---------|---------|---------|
| FP16 | 基准 | 1x | 1x | 精度敏感 |
| FP8 | <1% | 1.5x | 50% | 推荐方案 |
| INT8 | 2-3% | 2x | 50% | 平衡方案 |
| INT4 | 5-10% | 3x | 75% | 资源受限 |
| GPTQ | 3-5% | 2.5x | 75% | 大模型部署 |
| AWQ | 2-4% | 2.5x | 75% | 推荐量化 |

#### 批处理优化

```python
# 动态批处理配置示例
vllm_config = {
    # 最大并发序列数
    "max_num_seqs": 256,
    
    # 最大批处理 token 数
    "max_num_batched_tokens": 4096,
    
    # 连续批处理（关键优化）
    "enable_chunked_prefill": True,
    
    # 前缀缓存
    "enable_prefix_caching": True,
    
    # 调度策略
    "scheduling_policy": "fcfs"  # 或 "priority"
}
```

### 6.2 成本优化方案

#### 分层部署架构

```
用户请求
    │
    ▼
┌─────────────┐
│  负载均衡器  │
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │ 热数据 │  │ 温数据 │  │ 冷数据 │  │ 缓存层 │
   │14B模型│  │32B模型│  │72B模型│  │ Redis│
   │GPU x2│  │GPU x4│  │GPU x8│  │      │
   └──────┘  └──────┘  └──────┘  └──────┘
   80%请求    15%请求    5%请求    命中时
   低成本     中成本     高成本    零成本
```

#### 动态扩缩容策略

```yaml
# 自动扩缩容规则
scaling_rules:
  - name: scale_up
    condition: "gpu_utilization > 80% for 5m"
    action: "add_replica"
    cooldown: 300s
    
  - name: scale_down
    condition: "gpu_utilization < 30% for 10m"
    action: "remove_replica"
    cooldown: 600s
    
  - name: emergency_scale
    condition: "queue_length > 100"
    action: "add_replica_immediate"
    max_replicas: 10
```

### 6.3 成本对比分析

| 部署模式 | 月成本 | QPS | 成本/千次请求 | 适用场景 |
|---------|-------|-----|--------------|---------|
| 单卡 14B INT8 | ¥3,000 | 50 | ¥0.08 | 小团队 |
| 双卡 32B INT8 | ¥12,000 | 100 | ¥0.08 | 中等规模 |
| 八卡 72B INT4 | ¥80,000 | 300 | ¥0.10 | 企业级 |
| 混合部署 | ¥25,000 | 500 | ¥0.03 | 推荐方案 |
| 公有云 API | - | - | ¥0.50-2.00 | 对比基准 |

---

## 七、安全与合规考虑

### 7.1 安全架构

```
┌─────────────────────────────────────────────────────────┐
│                      安全边界                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │                 WAF / 防火墙                      │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────┼──────────────────────────┐   │
│  │                 API 网关                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │   │
│  │  │ 限流    │  │ 认证    │  │ 审计日志        │  │   │
│  │  │ 熔断    │  │ 鉴权    │  │ 敏感词过滤      │  │   │
│  │  └─────────┘  └─────────┘  └─────────────────┘  │   │
│  └──────────────────────┼──────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────┼──────────────────────────┐   │
│  │              服务网格 (mTLS)                      │   │
│  └──────────────────────┼──────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────┼──────────────────────────┐   │
│  │                 模型服务                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │   │
│  │  │ 输入过滤│  │ 输出过滤│  │ 内容安全检测    │  │   │
│  │  └─────────┘  └─────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 7.2 关键安全措施

#### 1. 模型安全

```python
# 输入过滤
FORBIDDEN_PATTERNS = [
    r"(密码|密码|token|secret)\s*[=:]\s*\S+",  # 敏感信息
    r"(rm\s+-rf|drop\s+table|delete\s+from)",   # 危险命令
    r"<script[^>]*>.*</script>",                # XSS
]

def sanitize_input(text: str) -> tuple[bool, str]:
    """输入安全检查"""
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, text, re.I):
            return False, "输入包含敏感内容"
    return True, text

# 输出过滤
def check_output_safety(text: str) -> tuple[bool, str]:
    """输出生成物安全检查"""
    # 使用内容安全 API 或本地模型
    risk_score = content_safety_check(text)
    if risk_score > 0.8:
        return False, "输出内容风险较高"
    return True, text
```

#### 2. 数据安全

```yaml
# 数据加密配置
data_security:
  # 传输加密
  tls:
    min_version: "1.3"
    cipher_suites: ["TLS_AES_256_GCM_SHA384"]
    
  # 存储加密
  encryption_at_rest:
    algorithm: "AES-256-GCM"
    key_rotation: "90d"
    
  # 敏感数据脱敏
  pii_protection:
    enabled: true
    patterns:
      - type: "phone"
        mask: "***-****-****"
      - type: "id_card"
        mask: "**************"
      - type: "email"
        mask: "***@***.com"
```

#### 3. 访问控制

```python
# RBAC 权限模型
ROLES = {
    "admin": {
        "permissions": ["*"],
        "rate_limit": "unlimited"
    },
    "developer": {
        "permissions": ["chat", "embeddings", "documents:read"],
        "rate_limit": "1000/hour"
    },
    "user": {
        "permissions": ["chat:limited", "documents:search"],
        "rate_limit": "100/hour"
    }
}

# API Key 管理
def validate_api_key(key: str) -> dict:
    """验证 API Key 并返回权限信息"""
    # 从 Redis 获取 Key 信息
    key_info = redis.get(f"apikey:{key}")
    if not key_info:
        raise AuthenticationError("Invalid API key")
    
    info = json.loads(key_info)
    
    # 检查是否过期
    if info["expires_at"] < time.time():
        raise AuthenticationError("API key expired")
    
    # 检查是否被禁用
    if info["status"] != "active":
        raise AuthenticationError("API key disabled")
    
    return info
```

### 7.3 合规要求

#### 国内合规

| 要求 | 实施方案 |
|-----|---------|
| 算法备案 | 使用已备案模型（ChatGLM/文心等） |
| 内容审核 | 接入官方审核 API |
| 数据本地化 | 数据不出境，本地存储 |
| 日志留存 | 6 个月以上操作日志 |
| 用户授权 | 明确告知 AI 生成内容 |

#### 数据隐私

```python
# 数据保留策略
DATA_RETENTION = {
    "chat_history": "30d",      # 对话历史保留 30 天
    "embeddings": "90d",        # 向量数据保留 90 天
    "audit_logs": "365d",       # 审计日志保留 1 年
    "temp_files": "1d"          # 临时文件 1 天
}

# 用户数据删除
def delete_user_data(user_id: str):
    """完全删除用户数据（GDPR/CCPA 合规）"""
    # 删除对话历史
    db.execute("DELETE FROM chats WHERE user_id = ?", user_id)
    
    # 删除向量数据
    collection.delete(f"user_id == '{user_id}'")
    
    # 删除缓存
    redis.delete(f"user:{user_id}:*")
    
    # 记录删除操作
    audit_log.record("data_deletion", user_id=user_id)
```

---

## 八、面试考点

### Q1: 私有化部署相比公有云 API 有什么优势和劣势？

**参考答案：**

**优势：**
1. **数据安全**：敏感数据不出境，满足合规要求
2. **成本控制**：高频场景下长期使用成本更低
3. **定制化**：可针对业务微调模型、优化推理
4. **稳定性**：不受第三方服务影响，SLA 自主可控
5. **延迟优化**：本地部署网络延迟更低

**劣势：**
1. **初期投入**：硬件采购成本高
2. **运维复杂**：需要专业团队维护
3. **技术门槛**：需要掌握模型部署优化
4. **弹性不足**：扩容需要采购硬件
5. **模型更新**：需要自行跟进新版本

**适用场景：**
- 金融、医疗等敏感数据处理
- 高频调用场景（日调用 > 10 万次）
- 需要模型微调的场景
- 合规要求严格的行业

---

### Q2: 如何选择合适的开源模型？

**参考答案：**

**选型维度：**

1. **语言能力**
   - 中文业务为主 → Qwen/ChatGLM
   - 多语言/英文为主 → Llama

2. **任务类型**
   - 代码生成 → Qwen-Coder / CodeLlama
   - 长文本处理 → Qwen2.5 (128K)
   - 工具调用 → Llama 3.3 / Qwen2.5

3. **资源约束**
   - 显存 < 24GB → 选择 7B-14B 模型
   - 显存 40-80GB → 可选 32B-70B 量化版
   - 多卡环境 → 支持张量并行的模型

4. **生态支持**
   - 需要丰富工具链 → Llama
   - 需要国产支持 → ChatGLM
   - 需要宽松协议 → Qwen (Apache 2.0)

**决策流程：**
```
业务语言 → 任务类型 → 性能要求 → 合规要求 → 最终选型
```

---

### Q3: vLLM 的 PagedAttention 是什么原理？为什么能提升吞吐量？

**参考答案：**

**传统 Attention 的问题：**
- 每个请求的 KV Cache 需要连续内存
- 内存碎片严重，利用率低
- 预分配策略导致内存浪费

**PagedAttention 原理：**

借鉴操作系统虚拟内存的页式管理：

1. **分页存储**
   - 将 KV Cache 分成固定大小的块（Block）
   - 块大小通常为 16-32 tokens
   - 块不需要连续存储

2. **动态分配**
   - 按需分配块，避免预分配浪费
   - 支持块共享（Copy-on-Write）
   - 减少内存碎片

3. **内存复用**
   - 解码阶段复用前缀块
   - 并行请求的共享前缀只存一份

**性能提升：**
- 内存利用率提升 2-4 倍
- 支持更高并发（吞吐量提升 10-20 倍）
- 减少 GPU 内存碎片

---

### Q4: 如何评估私有化部署的硬件需求？

**参考答案：**

**计算步骤：**

1. **模型权重显存**
   ```
   显存 = 参数量 × 精度字节数
   FP16: 2 bytes, INT8: 1 byte, INT4: 0.5 byte
   ```

2. **KV Cache 显存**
   ```
   KV Cache = 2 × 层数 × 隐藏维度 × 序列长度 × 精度 × batch_size
   ```

3. **激活值显存**
   ```
   约模型权重的 10-20% × batch_size
   ```

4. **预留余量**
   ```
   总显存 = (权重 + KV + 激活) × 1.2
   ```

**示例计算（Qwen2.5-14B）：**
```
权重: 14B × 2 = 28 GB (FP16)
KV Cache: ~4 GB (bs=4, seq=4096)
激活: ~4 GB
余量: 20%
总计: ~43 GB → 推荐 A100 40GB (INT8) 或 80GB (FP16)
```

**其他考虑：**
- 并发量 → batch_size
- 最大输入长度 → max_seq_len
- 是否多卡并行 → tensor_parallel_size

---

### Q5: 私有化部署如何进行成本控制？

**参考答案：**

**硬件成本优化：**

1. **模型量化**
   - INT8 可减少 50% 显存
   - INT4/GPTQ 可减少 75% 显存
   - 精度损失通常在可接受范围

2. **动态批处理**
   - vLLM 的 Continuous Batching
   - 提升 GPU 利用率，降低单请求成本

3. **分层架构**
   - 小模型处理简单请求（80%）
   - 大模型处理复杂请求（20%）
   - 缓存层减少重复计算

**运营成本优化：**

1. **自动扩缩容**
   - 高峰期自动扩容
   - 低谷期缩容节省资源

2. **冷热分离**
   - 热数据 GPU 处理
   - 冷数据 CPU/离线处理

3. **模型蒸馏**
   - 用大模型生成训练数据
   - 训练小模型替代，降低推理成本

**成本监控指标：**
- 每千次请求成本（Cost Per 1K Requests）
- GPU 利用率
- 缓存命中率
- 平均响应时间

---

### Q6: 私有化部署有哪些安全风险？如何防范？

**参考答案：**

**主要风险：**

1. **提示注入（Prompt Injection）**
   - 用户输入恶意指令覆盖系统提示
   - 防范：输入过滤、提示隔离

2. **数据泄露**
   - 模型输出训练数据中的敏感信息
   - 防范：输出过滤、差分隐私训练

3. **越狱攻击（Jailbreak）**
   - 诱导模型输出违规内容
   - 防范：内容安全检测、输出审核

4. **模型窃取**
   - 通过大量查询复制模型能力
   - 防范：查询限流、水印检测

**防范措施：**

```
输入层: 敏感词过滤、格式校验、长度限制
处理层: 权限控制、沙箱隔离、审计日志
输出层: 内容安全检测、敏感信息脱敏、输出缓存
```

**合规措施：**
- 算法备案（国内）
- 内容审核接入
- 用户协议明确 AI 生成内容
- 数据本地化存储

---

## 避坑指南

### 常见错误 1：忽视显存碎片问题

**问题：** 频繁加载/卸载模型导致显存碎片，最终 OOM

**解决：**
```python
# 使用固定内存池
import torch
torch.cuda.set_per_process_memory_fraction(0.95)  # 预留 5%

# 定期清理缓存
if step % 100 == 0:
    torch.cuda.empty_cache()
```

### 常见错误 2：模型路径配置错误

**问题：** Docker 内模型路径与宿主机不一致导致加载失败

**解决：**
```yaml
# 明确挂载路径
volumes:
  - /host/path/to/model:/models/model_name:ro

# 使用绝对路径
command: --model /models/model_name  # 不是相对路径
```

### 常见错误 3：忽略温度参数影响

**问题：** temperature=0 时 GPU 利用率低，吞吐量下降

**解决：**
```python
# 生产环境建议使用 greedy 或低 temperature
# 但注意这会影响输出多样性
# 需要时在多样性和性能间权衡
```

### 常见错误 4：批大小设置不当

**问题：** batch_size 过大导致 OOM，过小导致 GPU 利用率低

**解决：**
```python
# 根据显存动态调整
# 使用 vLLM 的自动调度，手动设置 max_num_seqs
# 监控 GPU 内存使用，找到最优值
```

### 常见错误 5：未做健康检查

**问题：** 模型加载失败但服务仍启动，导致请求失败

**解决：**
```yaml
# Docker Compose 健康检查
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 300s  # 给模型加载足够时间
```

---

## 扩展阅读

- [vLLM 官方文档](https://docs.vllm.ai/)
- [Ollama 官方文档](https://github.com/ollama/ollama)
- [HuggingFace TGI](https://github.com/huggingface/text-generation-inference)
- [Qwen 技术报告](https://qwenlm.github.io/)
- [Llama 3 论文](https://ai.meta.com/research/publications/)
- [Milvus 文档](https://milvus.io/docs)

---

## 课后练习

1. **模型选型练习**
   - 场景：中文客服机器人，日调用 5 万次，预算 20 万
   - 任务：选择合适的模型和部署方案，列出硬件配置清单

2. **成本优化练习**
   - 场景：当前使用 A100 x4 部署 72B 模型，GPU 利用率仅 30%
   - 任务：设计优化方案，目标成本降低 50%

3. **部署实战**
   - 使用本节的 docker-compose.yml 完成私有化部署
   - 使用 locust 进行压力测试，记录性能数据
   - 尝试不同的量化方案，对比性能差异

4. **安全加固**
   - 为部署的系统添加输入/输出过滤
   - 实现 API Key 认证和限流
   - 配置审计日志记录
