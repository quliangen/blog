---
title: 22-容器化与云部署
description: Docker 化 Agent 服务、Docker Compose 编排、云平台部署（Vercel/Railway/阿里云）、CI/CD 流程
---

# 22-容器化与云部署

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 容器化部署能力 | ✅ Docker/Docker Compose |
| 云平台部署经验 | ✅ Vercel/Railway/阿里云 |
| CI/CD 工程化 | ✅ GitHub Actions 自动化 |
| 生产环境运维 | ✅ 监控/日志/健康检查 |

## 学习目标

学完本节，你将能够：

1. 将 AI Agent 服务 Docker 化，实现环境一致性
2. 使用 Docker Compose 编排多服务架构
3. 在主流云平台（Vercel/Railway/阿里云）部署 Agent 服务
4. 搭建完整的 CI/CD 自动化流程
5. 掌握生产环境的监控与运维技巧

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 了解基本的 Linux 命令
- 有 Git 版本控制基础

---

## 1. Docker 化 Agent 服务

### 1.1 为什么需要 Docker？

```
┌─────────────────────────────────────────────────────────┐
│  传统部署的问题                                          │
├─────────────────────────────────────────────────────────┤
│  ❌ "在我机器上能跑" - 环境不一致                        │
│  ❌ 依赖冲突 - Python 版本、系统库差异                    │
│  ❌ 配置混乱 - 环境变量散落在各处                         │
│  ❌ 扩展困难 - 难以快速复制部署环境                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Docker 解决方案                                         │
├─────────────────────────────────────────────────────────┤
│  ✅ 一次构建，到处运行 - 镜像包含完整环境                   │
│  ✅ 隔离依赖 - 每个服务独立容器                            │
│  ✅ 配置标准化 - Dockerfile 即文档                        │
│  ✅ 快速扩展 - 秒级启动新实例                              │
└─────────────────────────────────────────────────────────┘
```

### 1.2 编写 Dockerfile

```dockerfile
# ============================================
# AI Agent Service Dockerfile
# ============================================

# 阶段 1: 构建依赖
FROM python:3.11-slim as builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# 阶段 2: 运行环境
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH=/root/.local/bin:$PATH

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 从构建阶段复制依赖
COPY --from=builder /root/.local /root/.local

# 复制应用代码
COPY ./src ./src
COPY ./config ./config

# 非 root 用户运行（安全最佳实践）
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["python", "-m", "src.main"]
```

### 1.3 多阶段构建优化

```dockerfile
# 生产优化版本 - 更小的镜像体积
FROM python:3.11-alpine as builder

WORKDIR /app
RUN apk add --no-cache gcc musl-dev libffi-dev

COPY requirements.txt .
RUN pip install --user -r requirements.txt

# 最终镜像
FROM python:3.11-alpine

ENV PATH=/root/.local/bin:$PATH
WORKDIR /app

# 只复制必要的依赖
COPY --from=builder /root/.local /root/.local
COPY src/ ./src/

EXPOSE 8000
CMD ["python", "-m", "src.main"]
```

### 1.4 构建与运行

```bash
# 构建镜像
docker build -t ai-agent-service:latest .

# 查看镜像大小
docker images ai-agent-service

# 运行容器
docker run -d \
  --name agent-service \
  -p 8000:8000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e REDIS_URL=redis://redis:6379 \
  ai-agent-service:latest

# 查看日志
docker logs -f agent-service

# 进入容器调试
docker exec -it agent-service /bin/sh

# 停止并删除
docker stop agent-service && docker rm agent-service
```

---

## 2. Docker Compose 编排

### 2.1 多服务架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose 网络                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   Nginx      │──────▶│  Agent API   │──────▶│  Redis   │  │
│  │  (反向代理)   │      │   (FastAPI)  │      │ (缓存)   │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│         │                       │                           │
│         │              ┌────────┴────────┐                  │
│         │              ▼                 ▼                  │
│         │       ┌──────────┐      ┌──────────┐             │
│         │       │ Worker 1 │      │ Worker 2 │             │
│         │       │(Celery)  │      │(Celery)  │             │
│         │       └──────────┘      └──────────┘             │
│         │              │                 │                  │
│         └──────────────┴─────────────────┘                  │
│                        │                                    │
│                   ┌────┴────┐                               │
│                   │PostgreSQL│                               │
│                   │(主数据)  │                               │
│                   └─────────┘                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 docker-compose.yml 完整配置

```yaml
# ============================================
# AI Agent 服务 - Docker Compose 配置
# ============================================
version: '3.8'

services:
  # -----------------
  # Agent API 服务
  # -----------------
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agent-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://agent:password@postgres:5432/agent_db
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - LOG_LEVEL=INFO
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - agent-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  # -----------------
  # Celery Worker
  # -----------------
  worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agent-worker
    restart: unless-stopped
    command: celery -A src.celery_app worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=postgresql://agent:password@postgres:5432/agent_db
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis
      - postgres
    networks:
      - agent-network
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  # -----------------
  # Celery Beat (定时任务)
  # -----------------
  beat:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agent-beat
    restart: unless-stopped
    command: celery -A src.celery_app beat --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    networks:
      - agent-network

  # -----------------
  # PostgreSQL 数据库
  # -----------------
  postgres:
    image: postgres:15-alpine
    container_name: agent-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=agent
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agent_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - agent-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agent -d agent_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # -----------------
  # Redis 缓存
  # -----------------
  redis:
    image: redis:7-alpine
    container_name: agent-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - agent-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # -----------------
  # Nginx 反向代理
  # -----------------
  nginx:
    image: nginx:alpine
    container_name: agent-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - agent-network

  # -----------------
  # 监控 - Prometheus
  # -----------------
  prometheus:
    image: prom/prometheus:latest
    container_name: agent-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - agent-network

  # -----------------
  # 监控 - Grafana
  # -----------------
  grafana:
    image: grafana/grafana:latest
    container_name: agent-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    networks:
      - agent-network

# -----------------
# 数据卷
# -----------------
volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

# -----------------
# 网络配置
# -----------------
networks:
  agent-network:
    driver: bridge
```

### 2.3 Nginx 配置

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

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
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 上游服务
    upstream api_backend {
        least_conn;
        server api:8000 max_fails=3 fail_timeout=30s;
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS 服务
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        # SSL 证书
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API 代理
        location / {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查
        location /nginx-health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 2.4 常用 Compose 命令

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
docker-compose logs -f --tail=100 worker

# 重启服务
docker-compose restart api
docker-compose up -d --no-deps --build api

# 扩展 worker 数量
docker-compose up -d --scale worker=3

# 停止并清理
docker-compose down
docker-compose down -v  # 同时删除数据卷

# 执行数据库迁移
docker-compose exec api python -m src.migrations upgrade

# 备份数据库
docker-compose exec postgres pg_dump -U agent agent_db > backup.sql
```

---

## 3. 云平台部署

### 3.1 Vercel 部署（Serverless）

适合：快速原型、前端 + 轻量级 API

```javascript
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "15mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "ENVIRONMENT": "production"
  },
  "functions": {
    "api/index.py": {
      "maxDuration": 60
    }
  }
}
```

```python
# api/index.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "AI Agent API on Vercel"}

@app.post("/chat")
async def chat(message: str):
    # 调用 LLM API
    return {"response": f"Echo: {message}"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# Vercel 入口点
from mangum import Mangum
handler = Mangum(app)
```

```bash
# 部署到 Vercel
npm i -g vercel
vercel login
vercel --prod
```

### 3.2 Railway 部署（全栈应用）

适合：完整应用、数据库托管、自动部署

```yaml
# railway.yml
version: 2

build:
  builder: DOCKERFILE
  dockerfilePath: Dockerfile

deploy:
  startCommand: python -m src.main
  healthcheckPath: /health
  healthcheckTimeout: 100
  restartPolicyType: ON_FAILURE
  restartPolicyMaxRetries: 3

# 环境变量在 Railway Dashboard 中配置
```

```dockerfile
# Railway 优化版 Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

ENV PORT=8000
EXPOSE $PORT

CMD python -m src.main --port $PORT
```

```bash
# Railway CLI 部署
npm i -g @railway/cli
railway login
railway init
railway link
railway up
```

### 3.3 阿里云部署（企业级）

适合：生产环境、合规要求、国内访问

#### 3.3.1 阿里云容器服务（ACK）

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-agent-api
  template:
    metadata:
      labels:
        app: ai-agent-api
    spec:
      containers:
      - name: api
        image: registry.cn-hangzhou.aliyuncs.com/your-repo/ai-agent:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: openai-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-agent-service
  namespace: production
spec:
  selector:
    app: ai-agent-api
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-agent-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: ai-agent-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-agent-service
            port:
              number: 80
```

#### 3.3.2 阿里云函数计算（FC）

```yaml
# template.yaml - Serverless Devs 配置
edition: 3.0.0
name: ai-agent-fc
access: default

vars:
  region: cn-hangzhou
  service:
    name: ai-agent-service
    description: AI Agent 服务

resources:
  agent_api:
    component: fc3
    props:
      region: ${vars.region}
      name: agent-api
      runtime: python3.11
      handler: index.handler
      code: ./src
      memorySize: 2048
      timeout: 60
      environmentVariables:
        OPENAI_API_KEY: ${env.OPENAI_API_KEY}
      triggers:
        - type: http
          name: defaultTrigger
          config:
            authType: anonymous
            methods:
              - GET
              - POST
```

```bash
# Serverless Devs 部署
npm install -g @serverless-devs/s
s config add --AccessKeyID your-id --AccessKeySecret your-secret --AccountID your-account

s deploy
```

---

## 4. CI/CD 流程

### 4.1 GitHub Actions 完整工作流

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # -----------------
  # 测试阶段
  # -----------------
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Cache pip dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt

    - name: Lint with ruff
      run: |
        ruff check src/
        ruff format --check src/

    - name: Type check with mypy
      run: mypy src/

    - name: Run tests
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0
      run: |
        pytest tests/ -v --cov=src --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  # -----------------
  # 构建镜像
  # -----------------
  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64,linux/arm64

  # -----------------
  # 部署到开发环境
  # -----------------
  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: development

    steps:
    - uses: actions/checkout@v4

    - name: Deploy to dev server
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.DEV_HOST }}
        username: ${{ secrets.DEV_USER }}
        key: ${{ secrets.DEV_SSH_KEY }}
        script: |
          cd /opt/ai-agent
          docker-compose pull
          docker-compose up -d
          docker-compose exec -T api python -m src.migrations upgrade

  # -----------------
  # 部署到生产环境
  # -----------------
  deploy-prod:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - uses: actions/checkout@v4

    - name: Configure kubectl
      uses: azure/setup-kubectl@v3

    - name: Set up Helm
      uses: azure/setup-helm@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2

    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name production-cluster

    - name: Deploy with Helm
      run: |
        helm upgrade --install ai-agent ./helm \
          --namespace production \
          --set image.tag=${{ github.sha }} \
          --set replicaCount=3 \
          --wait --timeout 5m

    - name: Verify deployment
      run: |
        kubectl rollout status deployment/ai-agent-api -n production
        kubectl get pods -n production
```

### 4.2 自动化版本发布

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Generate changelog
      id: changelog
      uses: mikepenz/release-changelog-builder-action@v4
      with:
        configuration: .github/changelog-config.json
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        body: ${{ steps.changelog.outputs.changelog }}
        draft: false
        prerelease: false
```

---

## 5. 生产环境运维

### 5.1 健康检查端点

```python
# src/health.py
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import os

router = APIRouter()

async def get_db():
    # 返回数据库连接
    pass

async def get_redis():
    return redis.from_url(os.getenv("REDIS_URL"))

@router.get("/health")
async def health_check():
    """基础健康检查"""
    return {
        "status": "healthy",
        "version": os.getenv("APP_VERSION", "unknown"),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@router.get("/ready")
async def readiness_check(
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """就绪检查 - 验证依赖服务"""
    checks = {}
    
    # 检查数据库
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
    
    # 检查 Redis
    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
    
    # 检查外部 API
    try:
        # 检查 OpenAI API 可用性
        checks["openai"] = "ok"
    except Exception as e:
        checks["openai"] = f"error: {str(e)}"
    
    all_ok = all(v == "ok" for v in checks.values())
    
    return {
        "status": "ready" if all_ok else "not_ready",
        "checks": checks
    }

@router.get("/metrics")
async def metrics():
    """Prometheus 指标"""
    # 返回应用指标
    return {
        "requests_total": 1000,
        "requests_duration_seconds": 0.5,
        "active_connections": 10
    }
```

### 5.2 日志管理

```python
# src/logger.py
import logging
import sys
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['timestamp'] = self.formatTime(record)

def setup_logging(log_level: str = "INFO"):
    """配置结构化日志"""
    
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # 清除现有处理器
    logger.handlers = []
    
    # JSON 格式（生产环境）
    if os.getenv("ENVIRONMENT") == "production":
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        # 开发环境：可读格式
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件输出（生产环境）
    if os.getenv("ENVIRONMENT") == "production":
        file_handler = logging.handlers.RotatingFileHandler(
            '/app/logs/app.log',
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

# 使用示例
logger = logging.getLogger(__name__)
logger.info("Agent started", extra={"agent_id": "agent-001", "task": "process"})
```

### 5.3 监控告警

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - /etc/prometheus/rules/*.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'agent-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

```yaml
# monitoring/rules/alerts.yml
groups:
  - name: agent-alerts
    rules:
      - alert: AgentAPIDown
        expr: up{job="agent-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Agent API is down"
          description: "Agent API has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 10%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is above 2 seconds"
```

---

## 6. 避坑指南

| 问题 | 原因 | 解决方案 |
|-----|------|---------|
| 镜像体积过大 | 包含开发依赖 | 使用多阶段构建，只复制必要文件 |
| 容器启动失败 | 依赖服务未就绪 | 使用 healthcheck 和 depends_on |
| 环境变量丢失 | 未正确传递 | 使用 .env 文件和 secrets 管理 |
| 数据库连接失败 | 网络隔离 | 确保服务在同一 network |
| 权限问题 | root 运行不安全 | 创建非 root 用户 |
| 日志丢失 | 未配置持久化 | 挂载日志卷或使用日志服务 |
| 内存溢出 | 未设置资源限制 | 配置 memory limits |
| 冷启动慢 | 镜像过大/依赖多 | 使用 slim 镜像，预加载模型 |

---

## 7. 面试考点

### Q1: Docker 多阶段构建的优势是什么？

**参考答案：**
1. **减小镜像体积**：构建阶段包含编译工具，运行阶段只保留必要文件
2. **提高安全性**：运行镜像不包含编译工具，减少攻击面
3. **缓存优化**：依赖安装层可缓存，加速后续构建
4. **清晰分离**：构建和运行环境分离，便于维护

### Q2: 如何实现零停机部署？

**参考答案：**
```
1. 蓝绿部署：准备两套环境，瞬间切换
2. 滚动更新：逐个替换实例，保持服务可用
3. 金丝雀发布：先发布小部分流量验证
4. 健康检查：确保新实例就绪后再切换流量
```

### Q3: CI/CD 和 DevOps 的区别？

**参考答案：**
- **CI/CD**：持续集成/持续部署，是自动化工具链
- **DevOps**：文化理念，强调开发与运维协作
- **关系**：CI/CD 是实现 DevOps 的技术手段之一

### Q4: 容器化 AI Agent 的特殊考虑？

**参考答案：**
1. **模型文件**：大模型需要挂载卷或对象存储
2. **GPU 支持**：使用 nvidia-docker 运行时
3. **内存管理**：LLM 占用内存大，需合理设置 limits
4. **冷启动**：预加载模型或使用 keep-alive
5. **并发处理**：异步架构处理多请求

### Q5: 生产环境必须的安全措施？

**参考答案：**
1. 非 root 运行容器
2. 只读根文件系统
3. 资源限制（CPU/内存）
4. 网络安全（防火墙/网络策略）
5. 密钥管理（Vault/Secrets Manager）
6. 镜像扫描（Trivy/Snyk）
7. 日志审计

---

## 8. 扩展阅读

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [阿里云容器服务 ACK](https://www.aliyun.com/product/kubernetes)
- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app/)

---

## 9. 课后练习

1. **基础练习**：为你的 Agent 项目编写 Dockerfile，实现多阶段构建，镜像体积控制在 500MB 以内

2. **Compose 练习**：搭建包含 API + Redis + PostgreSQL 的完整环境，配置健康检查和自动重启

3. **CI/CD 练习**：在 GitHub 上创建项目，配置 Actions 工作流，实现 push 代码自动测试和构建

4. **云平台部署**：选择 Vercel/Railway/阿里云之一，部署你的 Agent 服务并配置自定义域名

5. **监控练习**：集成 Prometheus + Grafana，创建自定义 Dashboard 监控 Agent 性能指标

---

## 附录：完整项目结构

```
ai-agent-project/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       └── release.yml
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── health.py
│   ├── logger.py
│   └── celery_app.py
├── config/
│   ├── production.yml
│   └── development.yml
├── monitoring/
│   ├── prometheus.yml
│   ├── grafana/
│   │   ├── dashboards/
│   │   └── datasources/
│   └── rules/
│       └── alerts.yml
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── tests/
│   └── test_api.py
├── Dockerfile
├── docker-compose.yml
├── railway.yml
├── vercel.json
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── .dockerignore
└── README.md
```
