---
title: Hermes Agent 安装配置
description: Hermes Agent 完整安装配置指南，包括环境准备、多种安装方式、模型配置和高级用法
---

# Hermes Agent 安装配置

Hermes Agent 是一个多模型 AI Agent 框架，支持 Claude、OpenAI、Gemini 等多种大模型，提供工具调用、技能管理、持久化记忆等能力。

---

## 一、环境准备

### 1.1 系统要求

| 组件 | 要求 |
|------|------|
| Python | >= 3.10 |
| 内存 | 4GB+ |
| 磁盘 | 2GB+ 可用空间 |

### 1.2 检查 Python 版本

```bash
python --version
# 或
python3 --version
```

若版本低于 3.10，建议安装新版本。

---

## 二、安装方式

### 方式一：pip 安装（推荐）

```bash
pip install hermes-agent
```

### 方式二：源码安装

适用于需要自定义修改或体验最新功能：

```bash
git clone https://github.com/your-org/hermes-agent.git
cd hermes-agent
pip install -e .
```

### 方式三：Docker 安装

```bash
docker pull hermes/agent:latest
docker run -it hermes/agent:latest
```

---

## 三、初始化配置

### 3.1 首次运行

安装完成后，执行初始化命令：

```bash
hermes init
```

该命令会：
- 创建配置目录 `~/.hermes/`
- 生成默认配置文件
- 提示配置模型 API Key

### 3.2 配置文件结构

```
~/.hermes/
├── config.yaml          # 主配置文件
├── skills/              # 技能目录
├── memory/              # 持久化记忆
└── logs/                # 运行日志
```

---

## 四、模型配置

### 4.1 配置 Anthropic Claude

编辑 `~/.hermes/config.yaml`：

```yaml
models:
  anthropic:
    api_key: "sk-ant-api03-你的密钥"
    model: "claude-sonnet-4-20250514"
    base_url: "https://api.anthropic.com"
```

### 4.2 配置 OpenAI

```yaml
models:
  openai:
    api_key: "sk-你的密钥"
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
```

### 4.3 配置国内模型（阿里云百炼）

```yaml
models:
  openrouter:
    api_key: "你的百炼 API Key"
    model: "qwen3-coder-plus"
    base_url: "https://dashscope.aliyuncs.com/apps/anthropic"
```

### 4.4 多模型配置示例

```yaml
models:
  default: "anthropic"
  
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
    model: "claude-sonnet-4"
    
  openai:
    api_key: "${OPENAI_API_KEY}"
    model: "gpt-4o"
    
  gemini:
    api_key: "${GEMINI_API_KEY}"
    model: "gemini-2.5-pro"
```

> 💡 **提示**: 支持环境变量引用，格式为 `${VAR_NAME}`

---

## 五、启动使用

### 5.1 交互模式

```bash
hermes
# 或
hermes chat
```

### 5.2 单条命令模式

```bash
hermes -p "分析这个项目的代码结构"
```

### 5.3 指定模型

```bash
hermes --model openai "用 Python 写个快速排序"
```

---

## 六、技能管理

### 6.1 查看已安装技能

```bash
hermes skills list
```

### 6.2 安装技能

```bash
hermes skills install github
hermes skills install web-search
```

### 6.3 创建自定义技能

```bash
hermes skills create my-custom-skill
```

---

## 七、常用命令速查

| 命令 | 说明 |
|------|------|
| `hermes` | 启动交互模式 |
| `hermes -p "prompt"` | 执行单条命令 |
| `hermes --version` | 查看版本 |
| `hermes doctor` | 诊断环境 |
| `hermes config` | 编辑配置 |
| `hermes skills list` | 列出技能 |
| `hermes skills install <name>` | 安装技能 |

---

## 八、代理配置（国内网络）

若需要代理访问 API：

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
hermes
```

或在配置文件中设置：

```yaml
proxy:
  http: "http://127.0.0.1:7890"
  https: "http://127.0.0.1:7890"
```

---

## 九、故障排查

### 9.1 无法连接模型 API

- 检查 API Key 是否正确
- 确认网络/代理设置
- 查看 `~/.hermes/logs/` 中的错误日志

### 9.2 技能加载失败

```bash
hermes doctor
# 检查技能目录权限和格式
```

### 9.3 重置配置

```bash
rm -rf ~/.hermes/
hermes init
```

---

## 十、进阶配置

### 10.1 自定义系统提示词

在 `~/.hermes/config.yaml` 中添加：

```yaml
system_prompt: |
  你是一个专业的软件工程师，擅长代码审查和架构设计。
  回答要简洁，代码要符合 PEP8 规范。
```

### 10.2 启用记忆功能

```yaml
memory:
  enabled: true
  max_tokens: 4000
```

### 10.3 工具白名单

```yaml
tools:
  enabled:
    - terminal
    - file
    - web
    - browser
```
