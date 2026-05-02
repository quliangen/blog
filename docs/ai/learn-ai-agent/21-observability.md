---
title: 21-AI 应用可观测性
description: 日志设计（Chain-of-Thought 追踪）、链路追踪（OpenTelemetry）、用户行为分析、监控告警体系
---

# 21-AI 应用可观测性

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级开发能力 | ✅ 性能/安全/成本 |
| 工程化能力 | ✅ 监控/测试/部署 |
| 项目交付能力 | ✅ 完整项目实战 |
| 可观测性设计 | ✅ 日志/追踪/监控 |

## 学习目标

学完本节，你将能够：

1. 设计 AI Agent 的 Chain-of-Thought 日志追踪系统
2. 集成 OpenTelemetry 实现分布式链路追踪
3. 构建用户行为分析体系
4. 搭建监控告警体系
5. 编写生产级可观测性代码

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 了解 Python 日志系统
- 熟悉 Docker 基础操作

---

## 一、核心概念

### 1.1 AI 应用可观测性的特殊性

传统应用 vs AI 应用的可观测性：

| 维度 | 传统应用 | AI 应用 |
|-----|---------|---------|
| 日志内容 | 请求/响应/错误 | + Prompt/Completion/Token |
| 追踪对象 | 服务调用链 | + LLM 调用/工具执行/推理步骤 |
| 监控指标 | QPS/延迟/错误率 | + Token 消耗/成本/质量评分 |
| 用户行为 | 点击/转化 | + 对话轮次/满意度/留存 |

### 1.2 可观测性三大支柱

```
┌─────────────────────────────────────────────────────────┐
│                    可观测性体系                          │
├─────────────┬─────────────┬─────────────────────────────┤
│   日志 Logs  │  指标 Metrics │      链路追踪 Traces       │
├─────────────┼─────────────┼─────────────────────────────┤
│ 结构化记录   │  数值化度量   │    请求全生命周期追踪        │
│ 事件详情    │  趋势分析     │    跨服务调用关系           │
│ 故障诊断    │  容量规划     │    性能瓶颈定位             │
└─────────────┴─────────────┴─────────────────────────────┘
```

---

## 二、日志设计 - Chain-of-Thought 追踪

### 2.1 为什么需要 CoT 日志

AI Agent 的决策过程是黑盒，需要记录：
- 用户输入和上下文
- LLM 的推理步骤
- 工具调用决策
- 执行结果和反思

### 2.2 结构化日志设计

```python
# observability/logger.py
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar

# 上下文变量，用于跨函数传递 trace_id
trace_id_var: ContextVar[str] = ContextVar('trace_id', default='')

class StructuredLogFormatter(logging.Formatter):
    """结构化日志格式化器"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'trace_id': getattr(record, 'trace_id', trace_id_var.get()),
            'span_id': getattr(record, 'span_id', ''),
            'source': {
                'file': record.filename,
                'line': record.lineno,
                'function': record.funcName
            }
        }
        
        # 添加额外字段
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data
            
        return json.dumps(log_data, ensure_ascii=False)

class CoTLogger:
    """Chain-of-Thought 日志记录器"""
    
    def __init__(self, name: str = "ai_agent"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(StructuredLogFormatter())
        self.logger.addHandler(console_handler)
        
        # 文件处理器（按天轮转）
        from logging.handlers import TimedRotatingFileHandler
        file_handler = TimedRotatingFileHandler(
            'logs/agent.log',
            when='midnight',
            interval=1,
            backupCount=7
        )
        file_handler.setFormatter(StructuredLogFormatter())
        self.logger.addHandler(file_handler)
    
    def _log(self, level: int, event_type: str, message: str, **kwargs):
        """内部日志方法"""
        extra = {
            'trace_id': trace_id_var.get(),
            'extra_data': {
                'event_type': event_type,
                **kwargs
            }
        }
        self.logger.log(level, message, extra=extra)
    
    def log_user_input(self, user_id: str, query: str, 
                       session_id: Optional[str] = None,
                       metadata: Optional[Dict] = None):
        """记录用户输入"""
        self._log(
            logging.INFO,
            'user_input',
            f"User {user_id} input received",
            user_id=user_id,
            query=query,
            session_id=session_id,
            query_length=len(query),
            metadata=metadata or {}
        )
    
    def log_llm_request(self, model: str, messages: list,
                        temperature: float = 0.7,
                        max_tokens: Optional[int] = None):
        """记录 LLM 请求"""
        self._log(
            logging.INFO,
            'llm_request',
            f"LLM request to {model}",
            model=model,
            message_count=len(messages),
            temperature=temperature,
            max_tokens=max_tokens,
            estimated_tokens=sum(len(m.get('content', '')) for m in messages) // 4
        )
    
    def log_llm_response(self, model: str, response: str,
                         prompt_tokens: int, completion_tokens: int,
                         latency_ms: float):
        """记录 LLM 响应"""
        self._log(
            logging.INFO,
            'llm_response',
            f"LLM response from {model}",
            model=model,
            response_length=len(response),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            latency_ms=latency_ms,
            tokens_per_second=completion_tokens / (latency_ms / 1000)
        )
    
    def log_tool_decision(self, agent_step: int, thought: str,
                          tool_name: str, tool_input: Dict):
        """记录工具决策过程"""
        self._log(
            logging.INFO,
            'tool_decision',
            f"Step {agent_step}: Decided to use {tool_name}",
            agent_step=agent_step,
            thought=thought,
            tool_name=tool_name,
            tool_input=tool_input
        )
    
    def log_tool_execution(self, tool_name: str, 
                           input_data: Dict,
                           output_data: Any,
                           execution_time_ms: float,
                           success: bool = True,
                           error: Optional[str] = None):
        """记录工具执行"""
        self._log(
            logging.INFO if success else logging.ERROR,
            'tool_execution',
            f"Tool {tool_name} execution {'succeeded' if success else 'failed'}",
            tool_name=tool_name,
            input=input_data,
            output=output_data if success else None,
            execution_time_ms=execution_time_ms,
            success=success,
            error=error
        )
    
    def log_agent_reflection(self, agent_step: int, 
                             observation: str,
                             reflection: str,
                             should_continue: bool):
        """记录 Agent 反思过程"""
        self._log(
            logging.INFO,
            'agent_reflection',
            f"Step {agent_step}: Agent reflection",
            agent_step=agent_step,
            observation=observation,
            reflection=reflection,
            should_continue=should_continue
        )
    
    def log_final_answer(self, answer: str, 
                         total_steps: int,
                         total_tokens: int,
                         total_latency_ms: float):
        """记录最终答案"""
        self._log(
            logging.INFO,
            'final_answer',
            "Agent completed with final answer",
            answer=answer,
            answer_length=len(answer),
            total_steps=total_steps,
            total_tokens=total_tokens,
            total_latency_ms=total_latency_ms
        )
    
    def log_error(self, error: Exception, context: Dict):
        """记录错误"""
        self._log(
            logging.ERROR,
            'error',
            f"Error occurred: {str(error)}",
            error_type=type(error).__name__,
            error_message=str(error),
            context=context
        )

# 全局日志实例
cot_logger = CoTLogger()


def set_trace_id(trace_id: Optional[str] = None) -> str:
    """设置或生成 trace_id"""
    tid = trace_id or str(uuid.uuid4())
    trace_id_var.set(tid)
    return tid


def get_trace_id() -> str:
    """获取当前 trace_id"""
    return trace_id_var.get()
```

### 2.3 在 Agent 中集成日志

```python
# observability/agent_with_logging.py
from typing import List, Dict, Any, Optional
import time
from observability.logger import cot_logger, set_trace_id, get_trace_id

class ObservableAgent:
    """带可观测性的 AI Agent"""
    
    def __init__(self, llm_client, tools: List[Dict]):
        self.llm_client = llm_client
        self.tools = {t['name']: t for t in tools}
        self.max_steps = 10
    
    def run(self, user_query: str, user_id: str = "anonymous",
            session_id: Optional[str] = None) -> Dict[str, Any]:
        """执行 Agent 并记录完整链路"""
        # 生成 trace_id
        trace_id = set_trace_id()
        start_time = time.time()
        
        # 记录用户输入
        cot_logger.log_user_input(
            user_id=user_id,
            query=user_query,
            session_id=session_id,
            metadata={'trace_id': trace_id}
        )
        
        try:
            # Agent 执行循环
            messages = [{'role': 'user', 'content': user_query}]
            total_tokens = 0
            
            for step in range(self.max_steps):
                # 1. 调用 LLM
                llm_start = time.time()
                cot_logger.log_llm_request(
                    model='gpt-4',
                    messages=messages,
                    temperature=0.7
                )
                
                response = self.llm_client.chat.completions.create(
                    model='gpt-4',
                    messages=messages,
                    tools=list(self.tools.values()),
                    temperature=0.7
                )
                
                llm_latency = (time.time() - llm_start) * 1000
                message = response.choices[0].message
                usage = response.usage
                
                cot_logger.log_llm_response(
                    model='gpt-4',
                    response=message.content or '',
                    prompt_tokens=usage.prompt_tokens,
                    completion_tokens=usage.completion_tokens,
                    latency_ms=llm_latency
                )
                total_tokens += usage.total_tokens
                
                # 2. 检查是否需要调用工具
                if message.tool_calls:
                    for tool_call in message.tool_calls:
                        tool_name = tool_call.function.name
                        tool_input = json.loads(tool_call.function.arguments)
                        
                        # 记录决策
                        cot_logger.log_tool_decision(
                            agent_step=step,
                            thought=message.content or "",
                            tool_name=tool_name,
                            tool_input=tool_input
                        )
                        
                        # 执行工具
                        tool_start = time.time()
                        try:
                            result = self._execute_tool(tool_name, tool_input)
                            tool_success = True
                            tool_error = None
                        except Exception as e:
                            result = None
                            tool_success = False
                            tool_error = str(e)
                        
                        tool_latency = (time.time() - tool_start) * 1000
                        
                        cot_logger.log_tool_execution(
                            tool_name=tool_name,
                            input_data=tool_input,
                            output_data=result,
                            execution_time_ms=tool_latency,
                            success=tool_success,
                            error=tool_error
                        )
                        
                        # 添加工具结果到消息
                        messages.append({
                            'role': 'tool',
                            'tool_call_id': tool_call.id,
                            'content': json.dumps(result) if result else ''
                        })
                else:
                    # 3. 最终答案
                    total_latency = (time.time() - start_time) * 1000
                    
                    cot_logger.log_final_answer(
                        answer=message.content,
                        total_steps=step + 1,
                        total_tokens=total_tokens,
                        total_latency_ms=total_latency
                    )
                    
                    return {
                        'answer': message.content,
                        'trace_id': trace_id,
                        'total_steps': step + 1,
                        'total_tokens': total_tokens,
                        'total_latency_ms': total_latency
                    }
            
            # 达到最大步数
            raise Exception("Max steps reached without final answer")
            
        except Exception as e:
            cot_logger.log_error(e, {
                'trace_id': trace_id,
                'user_query': user_query,
                'step': step if 'step' in locals() else 0
            })
            raise
    
    def _execute_tool(self, tool_name: str, tool_input: Dict) -> Any:
        """执行工具"""
        # 工具执行逻辑
        pass
```

---

## 三、链路追踪 - OpenTelemetry

### 3.1 OpenTelemetry 简介

```
┌─────────────────────────────────────────────────────────────┐
│                   OpenTelemetry 架构                         │
├─────────────────────────────────────────────────────────────┤
│  API → SDK → Collector → Backend (Jaeger/Zipkin/Prometheus) │
├─────────────────────────────────────────────────────────────┤
│  • Traces: 分布式链路追踪                                    │
│  • Metrics: 指标收集                                        │
│  • Logs: 日志关联                                           │
│  • Baggage: 上下文传递                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 基础配置

```python
# observability/telemetry.py
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from functools import wraps
import time

# 资源配置
resource = Resource.create({
    SERVICE_NAME: "ai-agent-service",
    SERVICE_VERSION: "1.0.0",
    "deployment.environment": "production"
})

# 初始化 Tracer Provider
trace_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(trace_provider)

# 配置 OTLP Exporter（发送到 Collector）
otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4317", insecure=True)
span_processor = BatchSpanProcessor(otlp_exporter)
trace_provider.add_span_processor(span_processor)

# 初始化 Metrics Provider
metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(endpoint="http://localhost:4317", insecure=True)
)
metrics_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
metrics.set_meter_provider(metrics_provider)

# 获取 tracer 和 meter
tracer = trace.get_tracer(__name__)
meter = metrics.get_meter(__name__)

# 自动埋点
LoggingInstrumentor().instrument()
RequestsInstrumentor().instrument()


class TelemetryDecorator:
    """追踪装饰器"""
    
    @staticmethod
    def trace_span(span_name: str = None, attributes: dict = None):
        """函数级追踪装饰器"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                name = span_name or func.__name__
                with tracer.start_as_current_span(name) as span:
                    # 添加属性
                    if attributes:
                        for key, value in attributes.items():
                            span.set_attribute(key, value)
                    
                    # 添加函数参数
                    span.set_attribute("function.args_count", len(args))
                    span.set_attribute("function.kwargs_keys", list(kwargs.keys()))
                    
                    try:
                        result = func(*args, **kwargs)
                        span.set_attribute("function.success", True)
                        return result
                    except Exception as e:
                        span.set_attribute("function.success", False)
                        span.set_attribute("error.type", type(e).__name__)
                        span.set_attribute("error.message", str(e))
                        span.record_exception(e)
                        raise
            return wrapper
        return decorator
    
    @staticmethod
    def measure_latency(metric_name: str, description: str = None):
        """延迟度量装饰器"""
        histogram = meter.create_histogram(
            name=metric_name,
            description=description or f"Latency of {metric_name}",
            unit="ms"
        )
        
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    status = "success"
                    return result
                except Exception as e:
                    status = "error"
                    raise
                finally:
                    latency = (time.time() - start_time) * 1000
                    histogram.record(
                        latency,
                        attributes={"function": func.__name__, "status": status}
                    )
            return wrapper
        return decorator


# 创建计数器
token_counter = meter.create_counter(
    name="llm.tokens.used",
    description="Total LLM tokens used",
    unit="1"
)

request_counter = meter.create_counter(
    name="agent.requests.total",
    description="Total agent requests",
    unit="1"
)

# 创建仪表盘（Gauge）
active_sessions = meter.create_up_down_counter(
    name="agent.sessions.active",
    description="Number of active sessions"
)

# 创建直方图
llm_latency_histogram = meter.create_histogram(
    name="llm.latency",
    description="LLM API latency",
    unit="ms"
)
```

### 3.3 在 Agent 中集成链路追踪

```python
# observability/traced_agent.py
from observability.telemetry import tracer, TelemetryDecorator, token_counter, request_counter
from opentelemetry.trace import Status, StatusCode
import json

class TracedAgent:
    """带链路追踪的 Agent"""
    
    def __init__(self, llm_client, tools: list):
        self.llm_client = llm_client
        self.tools = tools
        self.max_steps = 10
    
    def run(self, user_query: str, user_id: str = "anonymous") -> dict:
        """执行 Agent，完整链路追踪"""
        with tracer.start_as_current_span("agent.run") as root_span:
            # 设置根 span 属性
            root_span.set_attribute("user.id", user_id)
            root_span.set_attribute("query.length", len(user_query))
            root_span.set_attribute("query.first_50_chars", user_query[:50])
            
            # 记录请求计数
            request_counter.add(1, {"user_type": "authenticated" if user_id != "anonymous" else "guest"})
            
            try:
                messages = [{'role': 'user', 'content': user_query}]
                total_tokens = 0
                
                for step in range(self.max_steps):
                    with tracer.start_as_current_span(f"agent.step.{step}") as step_span:
                        step_span.set_attribute("step.number", step)
                        
                        # LLM 调用
                        with tracer.start_as_current_span("llm.call") as llm_span:
                            llm_span.set_attribute("llm.model", "gpt-4")
                            llm_span.set_attribute("llm.temperature", 0.7)
                            
                            response = self.llm_client.chat.completions.create(
                                model='gpt-4',
                                messages=messages,
                                tools=self.tools
                            )
                            
                            message = response.choices[0].message
                            usage = response.usage
                            
                            # 记录 LLM 属性
                            llm_span.set_attribute("llm.prompt_tokens", usage.prompt_tokens)
                            llm_span.set_attribute("llm.completion_tokens", usage.completion_tokens)
                            llm_span.set_attribute("llm.total_tokens", usage.total_tokens)
                            
                            # 记录指标
                            token_counter.add(
                                usage.total_tokens,
                                {"model": "gpt-4", "type": "total"}
                            )
                        
                        # 工具调用
                        if message.tool_calls:
                            for idx, tool_call in enumerate(message.tool_calls):
                                with tracer.start_as_current_span(f"tool.call.{idx}") as tool_span:
                                    tool_name = tool_call.function.name
                                    tool_input = json.loads(tool_call.function.arguments)
                                    
                                    tool_span.set_attribute("tool.name", tool_name)
                                    tool_span.set_attribute("tool.input", json.dumps(tool_input))
                                    
                                    try:
                                        result = self._execute_tool(tool_name, tool_input)
                                        tool_span.set_attribute("tool.success", True)
                                        tool_span.set_attribute("tool.result_size", len(str(result)))
                                    except Exception as e:
                                        tool_span.set_attribute("tool.success", False)
                                        tool_span.record_exception(e)
                                        raise
                        else:
                            # 最终答案
                            root_span.set_attribute("agent.total_steps", step + 1)
                            root_span.set_attribute("agent.total_tokens", total_tokens)
                            root_span.set_attribute("agent.completed", True)
                            
                            return {
                                'answer': message.content,
                                'steps': step + 1,
                                'tokens': total_tokens
                            }
                
                # 达到最大步数
                root_span.set_attribute("agent.max_steps_reached", True)
                raise Exception("Max steps reached")
                
            except Exception as e:
                root_span.set_status(Status(StatusCode.ERROR, str(e)))
                root_span.record_exception(e)
                raise
    
    @TelemetryDecorator.trace_span("tool.execution")
    @TelemetryDecorator.measure_latency("tool.execution.latency")
    def _execute_tool(self, tool_name: str, tool_input: dict):
        """执行工具（带追踪）"""
        # 获取当前 span 并添加属性
        from opentelemetry import trace
        current_span = trace.get_current_span()
        current_span.set_attribute("tool.name", tool_name)
        
        # 工具执行逻辑
        pass
```

### 3.4 Docker Compose 配置

```yaml
# docker-compose.observability.yml
version: '3.8'

services:
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
      - "8888:8888"    # Prometheus metrics
      - "8889:8889"    # Prometheus exporter
    networks:
      - observability

  # Jaeger - 链路追踪可视化
  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"  # UI
      - "14250:14250"
    networks:
      - observability

  # Prometheus - 指标存储
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - observability

  # Grafana - 可视化面板
  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana-datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - observability

  # Loki - 日志聚合
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
    networks:
      - observability

  # Promtail - 日志收集
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./logs:/var/log/agent
      - ./promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    networks:
      - observability

networks:
  observability:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

### 3.5 Collector 配置

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  
  resource:
    attributes:
      - key: environment
        value: production
        action: upsert
  
  # 尾部采样 - 只保留错误和慢请求
  tail_sampling:
    decision_wait: 10s
    num_traces: 100
    expected_new_traces_per_sec: 10
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: slow_requests
        type: latency
        latency: {threshold_ms: 5000}

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: ai_agent
  
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
  
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource, tail_sampling]
      exporters: [jaeger, logging]
    
    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [prometheus, logging]
    
    logs:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [loki, logging]
```

---

## 四、用户行为分析

### 4.1 数据模型设计

```python
# observability/analytics.py
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, List, Any
from enum import Enum

class ConversationStatus(Enum):
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    ESCALATED = "escalated"
    ERROR = "error"

class UserFeedback(Enum):
    THUMBS_UP = 1
    THUMBS_DOWN = -1
    NEUTRAL = 0

@dataclass
class ConversationEvent:
    """对话事件"""
    event_id: str
    session_id: str
    user_id: str
    event_type: str  # message_sent, message_received, tool_used, error_occurred
    timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class ConversationSession:
    """对话会话"""
    session_id: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime]
    message_count: int
    turn_count: int  # 对话轮次
    total_tokens: int
    total_latency_ms: float
    tools_used: List[str]
    status: ConversationStatus
    user_feedback: Optional[UserFeedback]
    satisfaction_score: Optional[float]  # 0-10
    
    def to_dict(self) -> Dict:
        return {
            **asdict(self),
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status.value,
            'user_feedback': self.user_feedback.value if self.user_feedback else None
        }

@dataclass
class UserProfile:
    """用户画像"""
    user_id: str
    first_seen: datetime
    last_seen: datetime
    total_sessions: int
    total_messages: int
    avg_session_duration_ms: float
    avg_turns_per_session: float
    preferred_topics: List[str]
    satisfaction_history: List[float]
    retention_score: float  # 留存评分
```

### 4.2 行为分析服务

```python
# observability/analytics_service.py
import json
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from collections import defaultdict
from observability.analytics import ConversationSession, UserProfile, ConversationStatus, UserFeedback

class AnalyticsService:
    """用户行为分析服务"""
    
    def __init__(self, db_path: str = "analytics.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """初始化数据库"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    message_count INTEGER,
                    turn_count INTEGER,
                    total_tokens INTEGER,
                    total_latency_ms REAL,
                    tools_used TEXT,
                    status TEXT,
                    user_feedback INTEGER,
                    satisfaction_score REAL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    session_id TEXT,
                    user_id TEXT,
                    event_type TEXT,
                    timestamp TIMESTAMP,
                    metadata TEXT
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_sessions_user 
                ON sessions(user_id)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_session 
                ON events(session_id)
            """)
    
    def record_session(self, session: ConversationSession):
        """记录会话"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session.session_id,
                session.user_id,
                session.start_time,
                session.end_time,
                session.message_count,
                session.turn_count,
                session.total_tokens,
                session.total_latency_ms,
                json.dumps(session.tools_used),
                session.status.value,
                session.user_feedback.value if session.user_feedback else None,
                session.satisfaction_score
            ))
    
    def record_event(self, event):
        """记录事件"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO events VALUES (?, ?, ?, ?, ?, ?)
            """, (
                event.event_id,
                event.session_id,
                event.user_id,
                event.event_type,
                event.timestamp,
                json.dumps(event.metadata)
            ))
    
    def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """获取用户画像"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(message_count) as total_messages,
                    AVG(
                        CASE 
                            WHEN end_time IS NOT NULL 
                            THEN (julianday(end_time) - julianday(start_time)) * 86400000 
                            ELSE 0 
                        END
                    ) as avg_duration,
                    AVG(turn_count) as avg_turns,
                    AVG(satisfaction_score) as avg_satisfaction,
                    MIN(start_time) as first_seen,
                    MAX(start_time) as last_seen
                FROM sessions
                WHERE user_id = ?
            """, (user_id,))
            
            row = cursor.fetchone()
            if not row or row[0] == 0:
                return None
            
            return UserProfile(
                user_id=user_id,
                first_seen=datetime.fromisoformat(row[5]),
                last_seen=datetime.fromisoformat(row[6]),
                total_sessions=row[0],
                total_messages=row[1] or 0,
                avg_session_duration_ms=row[2] or 0,
                avg_turns_per_session=row[3] or 0,
                preferred_topics=[],  # 需要额外分析
                satisfaction_history=[],  # 需要额外查询
                retention_score=self._calculate_retention(user_id)
            )
    
    def _calculate_retention(self, user_id: str) -> float:
        """计算用户留存评分"""
        with sqlite3.connect(self.db_path) as conn:
            # 获取用户的会话时间分布
            cursor = conn.execute("""
                SELECT DISTINCT date(start_time) as session_date
                FROM sessions
                WHERE user_id = ?
                ORDER BY session_date
            """, (user_id,))
            
            dates = [row[0] for row in cursor.fetchall()]
            if len(dates) < 2:
                return 0.5
            
            # 计算回访间隔
            intervals = []
            for i in range(1, len(dates)):
                d1 = datetime.strptime(dates[i-1], '%Y-%m-%d')
                d2 = datetime.strptime(dates[i], '%Y-%m-%d')
                intervals.append((d2 - d1).days)
            
            avg_interval = sum(intervals) / len(intervals)
            
            # 评分逻辑：间隔越短，留存越高
            if avg_interval <= 1:
                return 1.0
            elif avg_interval <= 3:
                return 0.8
            elif avg_interval <= 7:
                return 0.6
            elif avg_interval <= 14:
                return 0.4
            else:
                return 0.2
    
    def get_dashboard_metrics(self, days: int = 7) -> Dict:
        """获取仪表盘指标"""
        since = datetime.now() - timedelta(days=days)
        
        with sqlite3.connect(self.db_path) as conn:
            # 总会话数
            total_sessions = conn.execute(
                "SELECT COUNT(*) FROM sessions WHERE start_time > ?",
                (since,)
            ).fetchone()[0]
            
            # 活跃用户
            active_users = conn.execute(
                "SELECT COUNT(DISTINCT user_id) FROM sessions WHERE start_time > ?",
                (since,)
            ).fetchone()[0]
            
            # 平均满意度
            avg_satisfaction = conn.execute(
                "SELECT AVG(satisfaction_score) FROM sessions WHERE start_time > ? AND satisfaction_score IS NOT NULL",
                (since,)
            ).fetchone()[0] or 0
            
            # 平均对话轮次
            avg_turns = conn.execute(
                "SELECT AVG(turn_count) FROM sessions WHERE start_time > ?",
                (since,)
            ).fetchone()[0] or 0
            
            # 完成率
            completion_rate = conn.execute(
                """SELECT 
                    CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)
                FROM sessions WHERE start_time > ?""",
                (since,)
            ).fetchone()[0] or 0
            
            # 工具使用统计
            tools_usage = conn.execute(
                "SELECT tools_used FROM sessions WHERE start_time > ?",
                (since,)
            ).fetchall()
            
            tool_counts = defaultdict(int)
            for row in tools_usage:
                tools = json.loads(row[0] or '[]')
                for tool in tools:
                    tool_counts[tool] += 1
            
            return {
                'period_days': days,
                'total_sessions': total_sessions,
                'active_users': active_users,
                'avg_satisfaction': round(avg_satisfaction, 2),
                'avg_turns_per_session': round(avg_turns, 2),
                'completion_rate': round(completion_rate * 100, 2),
                'tool_usage': dict(tool_counts),
                'calculated_at': datetime.now().isoformat()
            }
```

### 4.3 实时分析仪表板

```python
# observability/dashboard.py
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import json
from datetime import datetime

app = FastAPI()

# 简单的 WebSocket 实时仪表板
html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>AI Agent 实时监控</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { font-size: 32px; font-weight: bold; color: #333; }
        .label { color: #666; margin-top: 5px; }
        .chart-container { grid-column: span 2; height: 300px; }
        #logs { grid-column: span 4; height: 400px; overflow-y: auto; background: #1e1e1e; color: #fff; padding: 10px; font-family: monospace; }
        .log-entry { margin: 2px 0; padding: 2px 5px; border-left: 3px solid #666; }
        .log-info { border-left-color: #2196F3; }
        .log-error { border-left-color: #f44336; }
        .log-warn { border-left-color: #ff9800; }
    </style>
</head>
<body>
    <h1>AI Agent 实时监控仪表板</h1>
    <div class="grid">
        <div class="card">
            <div class="metric" id="active-sessions">0</div>
            <div class="label">活跃会话</div>
        </div>
        <div class="card">
            <div class="metric" id="requests-min">0</div>
            <div class="label">请求/分钟</div>
        </div>
        <div class="card">
            <div class="metric" id="avg-latency">0ms</div>
            <div class="label">平均延迟</div>
        </div>
        <div class="card">
            <div class="metric" id="error-rate">0%</div>
            <div class="label">错误率</div>
        </div>
        <div class="card chart-container">
            <canvas id="latency-chart"></canvas>
        </div>
        <div class="card chart-container">
            <canvas id="token-chart"></canvas>
        </div>
        <div id="logs"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8000/ws');
        
        // 延迟图表
        const latencyCtx = document.getElementById('latency-chart').getContext('2d');
        const latencyChart = new Chart(latencyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '延迟 (ms)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        // Token 图表
        const tokenCtx = document.getElementById('token-chart').getContext('2d');
        const tokenChart = new Chart(tokenCtx, {
            type: 'bar',
            data: {
                labels: ['Prompt', 'Completion', 'Total'],
                datasets: [{
                    label: 'Tokens',
                    data: [0, 0, 0],
                    backgroundColor: ['#2196F3', '#4CAF50', '#FF9800']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            
            // 更新指标
            if (data.type === 'metrics') {
                document.getElementById('active-sessions').textContent = data.active_sessions;
                document.getElementById('requests-min').textContent = data.requests_per_min;
                document.getElementById('avg-latency').textContent = data.avg_latency + 'ms';
                document.getElementById('error-rate').textContent = data.error_rate + '%';
                
                // 更新图表
                latencyChart.data.labels.push(new Date().toLocaleTimeString());
                latencyChart.data.datasets[0].data.push(data.avg_latency);
                if (latencyChart.data.labels.length > 20) {
                    latencyChart.data.labels.shift();
                    latencyChart.data.datasets[0].data.shift();
                }
                latencyChart.update();
                
                tokenChart.data.datasets[0].data = [data.prompt_tokens, data.completion_tokens, data.total_tokens];
                tokenChart.update();
            }
            
            // 更新日志
            if (data.type === 'log') {
                const logsDiv = document.getElementById('logs');
                const entry = document.createElement('div');
                entry.className = 'log-entry log-' + data.level.toLowerCase();
                entry.textContent = `[${data.timestamp}] [${data.level}] ${data.message}`;
                logsDiv.insertBefore(entry, logsDiv.firstChild);
                if (logsDiv.children.length > 100) {
                    logsDiv.removeChild(logsDiv.lastChild);
                }
            }
        };
    </script>
</body>
</html>
"""

@app.get("/")
async def get_dashboard():
    return HTMLResponse(content=html_content)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # 模拟实时数据推送
            import asyncio
            import random
            
            metrics = {
                'type': 'metrics',
                'active_sessions': random.randint(10, 100),
                'requests_per_min': random.randint(50, 200),
                'avg_latency': random.randint(100, 500),
                'error_rate': round(random.random() * 5, 2),
                'prompt_tokens': random.randint(1000, 5000),
                'completion_tokens': random.randint(500, 2000),
                'total_tokens': random.randint(1500, 7000)
            }
            
            await websocket.send_json(metrics)
            await asyncio.sleep(2)
    except:
        await websocket.close()
```

---

## 五、监控告警体系

### 5.1 告警规则设计

```yaml
# alerting/rules.yml
groups:
  - name: ai_agent_alerts
    rules:
      # 高延迟告警
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(llm_latency_bucket[5m])) > 5000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "LLM 延迟过高"
          description: "95分位延迟超过 5s，当前值: {{ $value }}ms"
      
      # 错误率告警
      - alert: HighErrorRate
        expr: rate(agent_requests_total{status="error"}[5m]) / rate(agent_requests_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "错误率过高"
          description: "错误率超过 5%，当前值: {{ $value }}"
      
      # Token 消耗告警
      - alert: HighTokenUsage
        expr: rate(llm_tokens_used[1h]) > 1000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Token 消耗异常"
          description: "每小时 Token 消耗超过 1M，当前值: {{ $value }}"
      
      # 用户满意度告警
      - alert: LowSatisfaction
        expr: avg_over_time(agent_satisfaction_score[1h]) < 6
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "用户满意度下降"
          description: "平均满意度低于 6 分，当前值: {{ $value }}"
      
      # 服务不可用告警
      - alert: ServiceDown
        expr: up{job="ai-agent"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "AI Agent 服务不可用"
          description: "服务已宕机超过 30 秒"

  - name: business_alerts
    rules:
      # 活跃用户下降
      - alert: DAUDecline
        expr: (
          sum(increase(agent_sessions_total[1d])) 
          / 
          sum(increase(agent_sessions_total[1d] offset 1d))
        ) < 0.8
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "DAU 下降超过 20%"
      
      # 会话完成率下降
      - alert: LowCompletionRate
        expr: (
          sum(rate(agent_sessions_total{status="completed"}[1h]))
          /
          sum(rate(agent_sessions_total[1h]))
        ) < 0.7
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "会话完成率低于 70%"
```

### 5.2 Alertmanager 配置

```yaml
# alerting/alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'your-password'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'
        subject: 'AI Agent 告警: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          告警: {{ .Annotations.summary }}
          详情: {{ .Annotations.description }}
          时间: {{ .StartsAt }}
          {{ end }}

  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#ai-agent-alerts'
        title: 'AI Agent 告警'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          {{ end }}

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'
        severity: critical
        description: '{{ .GroupLabels.alertname }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

### 5.3 告警处理器（Python）

```python
# observability/alert_handler.py
from fastapi import FastAPI, Request
from typing import Dict, List
import json
import requests
from datetime import datetime

app = FastAPI()

class AlertHandler:
    """告警处理器"""
    
    def __init__(self):
        self.webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK"
        self.alert_history = []
    
    async def handle_alert(self, alert_data: Dict):
        """处理告警"""
        for alert in alert_data.get('alerts', []):
            await self._process_single_alert(alert)
    
    async def _process_single_alert(self, alert: Dict):
        """处理单个告警"""
        status = alert.get('status')  # firing or resolved
        labels = alert.get('labels', {})
        annotations = alert.get('annotations', {})
        
        alert_record = {
            'timestamp': datetime.now().isoformat(),
            'status': status,
            'alertname': labels.get('alertname'),
            'severity': labels.get('severity'),
            'summary': annotations.get('summary'),
            'description': annotations.get('description'),
            'starts_at': alert.get('startsAt'),
            'ends_at': alert.get('endsAt')
        }
        
        self.alert_history.append(alert_record)
        
        # 根据严重程度处理
        severity = labels.get('severity')
        if severity == 'critical':
            await self._send_urgent_notification(alert_record)
        elif severity == 'warning':
            await self._send_standard_notification(alert_record)
        
        # 自动修复尝试
        if status == 'firing':
            await self._attempt_auto_remediation(alert_record)
    
    async def _send_urgent_notification(self, alert: Dict):
        """发送紧急通知"""
        message = f"""
🚨 *CRITICAL ALERT* 🚨

*告警:* {alert['alertname']}
*摘要:* {alert['summary']}
*详情:* {alert['description']}
*时间:* {alert['timestamp']}

请立即处理！
        """
        
        # 发送到 Slack
        requests.post(self.webhook_url, json={
            'text': message,
            'channel': '#critical-alerts'
        })
        
        # 发送短信/电话（集成第三方服务）
        # await self._send_sms(alert)
    
    async def _send_standard_notification(self, alert: Dict):
        """发送标准通知"""
        message = f"""
⚠️ *WARNING* ⚠️

*告警:* {alert['alertname']}
*摘要:* {alert['summary']}
*时间:* {alert['timestamp']}
        """
        
        requests.post(self.webhook_url, json={'text': message})
    
    async def _attempt_auto_remediation(self, alert: Dict):
        """尝试自动修复"""
        alertname = alert['alertname']
        
        if alertname == 'HighLatency':
            # 自动扩容或切换模型
            await self._scale_up_resources()
        
        elif alertname == 'HighErrorRate':
            # 启用熔断或降级
            await self._enable_circuit_breaker()
        
        elif alertname == 'ServiceDown':
            # 重启服务
            await self._restart_service()
    
    async def _scale_up_resources(self):
        """扩容资源"""
        # 调用 K8s API 或云服务 API
        pass
    
    async def _enable_circuit_breaker(self):
        """启用熔断"""
        # 更新配置中心
        pass
    
    async def _restart_service(self):
        """重启服务"""
        # 调用服务管理 API
        pass

alert_handler = AlertHandler()

@app.post("/webhook/alerts")
async def receive_alert(request: Request):
    """接收告警"""
    data = await request.json()
    await alert_handler.handle_alert(data)
    return {"status": "received"}

@app.get("/alerts/history")
async def get_alert_history(limit: int = 100):
    """获取告警历史"""
    return alert_handler.alert_history[-limit:]
```

---

## 六、完整实战代码

### 6.1 项目结构

```
ai-agent-observability/
├── app/
│   ├── __init__.py
│   ├── agent.py              # Agent 核心逻辑
│   ├── main.py               # FastAPI 入口
│   └── config.py             # 配置管理
├── observability/
│   ├── __init__.py
│   ├── logger.py             # CoT 日志
│   ├── telemetry.py          # OpenTelemetry
│   ├── analytics.py          # 分析数据模型
│   ├── analytics_service.py  # 分析服务
│   ├── dashboard.py          # 监控仪表板
│   └── alert_handler.py      # 告警处理
├── docker/
│   ├── docker-compose.yml
│   ├── otel-collector-config.yaml
│   ├── prometheus.yml
│   └── alertmanager.yml
├── logs/                     # 日志目录
├── requirements.txt
└── README.md
```

### 6.2 完整 Agent 实现

```python
# app/agent.py
import json
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from observability.logger import cot_logger, set_trace_id, get_trace_id
from observability.telemetry import tracer, TelemetryDecorator
from observability.analytics import ConversationSession, ConversationStatus
from observability.analytics_service import AnalyticsService
from opentelemetry.trace import Status, StatusCode
from datetime import datetime

@dataclass
class AgentResponse:
    answer: str
    trace_id: str
    total_steps: int
    total_tokens: int
    total_latency_ms: float
    tools_used: List[str]

class Tool:
    """工具基类"""
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    def execute(self, **kwargs) -> Any:
        raise NotImplementedError
    
    def to_openai_format(self) -> Dict:
        return {
            'type': 'function',
            'function': {
                'name': self.name,
                'description': self.description,
                'parameters': self.get_parameters_schema()
            }
        }
    
    def get_parameters_schema(self) -> Dict:
        return {'type': 'object', 'properties': {}}

class SearchTool(Tool):
    """搜索工具示例"""
    def __init__(self):
        super().__init__(
            name='search',
            description='搜索互联网获取信息'
        )
    
    def get_parameters_schema(self) -> Dict:
        return {
            'type': 'object',
            'properties': {
                'query': {'type': 'string', 'description': '搜索关键词'}
            },
            'required': ['query']
        }
    
    def execute(self, query: str) -> str:
        # 模拟搜索
        return f"搜索结果: {query} 的相关信息..."

class CalculatorTool(Tool):
    """计算器工具示例"""
    def __init__(self):
        super().__init__(
            name='calculator',
            description='执行数学计算'
        )
    
    def get_parameters_schema(self) -> Dict:
        return {
            'type': 'object',
            'properties': {
                'expression': {'type': 'string', 'description': '数学表达式'}
            },
            'required': ['expression']
        }
    
    def execute(self, expression: str) -> str:
        try:
            # 安全计算
            result = eval(expression, {"__builtins__": {}}, {})
            return str(result)
        except Exception as e:
            return f"计算错误: {str(e)}"

class ObservableAgent:
    """生产级可观测 Agent"""
    
    def __init__(self, llm_client, tools: List[Tool] = None):
        self.llm_client = llm_client
        self.tools = tools or []
        self.max_steps = 10
        self.analytics = AnalyticsService()
    
    def run(self, user_query: str, user_id: str = "anonymous",
            session_id: Optional[str] = None) -> AgentResponse:
        """
        执行 Agent 任务，完整可观测性
        """
        trace_id = set_trace_id()
        session_start = datetime.now()
        tools_used = []
        
        with tracer.start_as_current_span("agent.run") as root_span:
            root_span.set_attribute("user.id", user_id)
            root_span.set_attribute("query", user_query[:100])
            
            # 记录用户输入
            cot_logger.log_user_input(
                user_id=user_id,
                query=user_query,
                session_id=session_id
            )
            
            start_time = time.time()
            total_tokens = 0
            
            try:
                messages = [
                    {'role': 'system', 'content': self._get_system_prompt()},
                    {'role': 'user', 'content': user_query}
                ]
                
                for step in range(self.max_steps):
                    with tracer.start_as_current_span(f"agent.step.{step}"):
                        # LLM 调用
                        response, tokens, latency = self._call_llm(messages)
                        total_tokens += tokens
                        
                        message = response.choices[0].message
                        
                        # 检查工具调用
                        if message.tool_calls:
                            for tool_call in message.tool_calls:
                                tool_result = self._handle_tool_call(
                                    tool_call, step, tools_used
                                )
                                messages.append({
                                    'role': 'tool',
                                    'tool_call_id': tool_call.id,
                                    'content': json.dumps(tool_result)
                                })
                        else:
                            # 最终答案
                            total_latency = (time.time() - start_time) * 1000
                            
                            cot_logger.log_final_answer(
                                answer=message.content,
                                total_steps=step + 1,
                                total_tokens=total_tokens,
                                total_latency_ms=total_latency
                            )
                            
                            # 记录会话
                            self._record_session(
                                session_id=session_id or trace_id,
                                user_id=user_id,
                                start_time=session_start,
                                message_count=len(messages),
                                turn_count=step + 1,
                                total_tokens=total_tokens,
                                total_latency_ms=total_latency,
                                tools_used=tools_used,
                                status=ConversationStatus.COMPLETED
                            )
                            
                            root_span.set_attribute("agent.success", True)
                            root_span.set_attribute("agent.steps", step + 1)
                            
                            return AgentResponse(
                                answer=message.content,
                                trace_id=trace_id,
                                total_steps=step + 1,
                                total_tokens=total_tokens,
                                total_latency_ms=total_latency,
                                tools_used=tools_used
                            )
                
                # 达到最大步数
                raise Exception("Max steps reached without final answer")
                
            except Exception as e:
                total_latency = (time.time() - start_time) * 1000
                
                cot_logger.log_error(e, {
                    'trace_id': trace_id,
                    'user_query': user_query,
                    'step': step if 'step' in locals() else 0
                })
                
                self._record_session(
                    session_id=session_id or trace_id,
                    user_id=user_id,
                    start_time=session_start,
                    message_count=len(messages) if 'messages' in locals() else 0,
                    turn_count=step if 'step' in locals() else 0,
                    total_tokens=total_tokens,
                    total_latency_ms=total_latency,
                    tools_used=tools_used,
                    status=ConversationStatus.ERROR
                )
                
                root_span.set_status(Status(StatusCode.ERROR, str(e)))
                root_span.record_exception(e)
                raise
    
    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
        tools_desc = '\n'.join([
            f"- {t.name}: {t.description}"
            for t in self.tools
        ])
        
        return f"""你是一个智能助手，可以使用以下工具：

{tools_desc}

请按以下格式思考：
1. 分析用户需求
2. 决定是否需要使用工具
3. 如果需要，选择合适的工具并执行
4. 根据结果给出最终回答

如果不需要工具，直接回答用户问题。"""
    
    @TelemetryDecorator.measure_latency("llm.latency")
    def _call_llm(self, messages: List[Dict]):
        """调用 LLM"""
        tools = [t.to_openai_format() for t in self.tools] if self.tools else None
        
        cot_logger.log_llm_request(
            model='gpt-4',
            messages=messages,
            temperature=0.7
        )
        
        llm_start = time.time()
        response = self.llm_client.chat.completions.create(
            model='gpt-4',
            messages=messages,
            tools=tools,
            temperature=0.7
        )
        latency = (time.time() - llm_start) * 1000
        
        usage = response.usage
        cot_logger.log_llm_response(
            model='gpt-4',
            response=response.choices[0].message.content or '',
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            latency_ms=latency
        )
        
        return response, usage.total_tokens, latency
    
    def _handle_tool_call(self, tool_call, step: int, tools_used: List[str]):
        """处理工具调用"""
        tool_name = tool_call.function.name
        tool_input = json.loads(tool_call.function.arguments)
        
        # 查找工具
        tool = next((t for t in self.tools if t.name == tool_name), None)
        if not tool:
            return {'error': f'Tool {tool_name} not found'}
        
        # 记录决策
        cot_logger.log_tool_decision(
            agent_step=step,
            thought=f"Step {step}: Using {tool_name}",
            tool_name=tool_name,
            tool_input=tool_input
        )
        
        # 执行工具
        tool_start = time.time()
        try:
            result = tool.execute(**tool_input)
            success = True
            error = None
        except Exception as e:
            result = None
            success = False
            error = str(e)
        
        execution_time = (time.time() - tool_start) * 1000
        
        cot_logger.log_tool_execution(
            tool_name=tool_name,
            input_data=tool_input,
            output_data=result,
            execution_time_ms=execution_time,
            success=success,
            error=error
        )
        
        if tool_name not in tools_used:
            tools_used.append(tool_name)
        
        return {'result': result} if success else {'error': error}
    
    def _record_session(self, **kwargs):
        """记录会话数据"""
        session = ConversationSession(
            end_time=datetime.now(),
            user_feedback=None,
            satisfaction_score=None,
            **kwargs
        )
        self.analytics.record_session(session)
```

### 6.3 FastAPI 应用入口

```python
# app/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from openai import OpenAI

from app.agent import ObservableAgent, Tool, SearchTool, CalculatorTool
from observability.analytics_service import AnalyticsService

app = FastAPI(title="AI Agent with Observability")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化
llm_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
tools = [SearchTool(), CalculatorTool()]
agent = ObservableAgent(llm_client, tools)
analytics = AnalyticsService()

class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = "anonymous"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    trace_id: str
    total_steps: int
    total_tokens: int
    total_latency_ms: float
    tools_used: List[str]

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """对话接口"""
    try:
        response = agent.run(
            user_query=request.query,
            user_id=request.user_id,
            session_id=request.session_id
        )
        return ChatResponse(**response.__dict__)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/metrics/dashboard")
async def dashboard_metrics(days: int = 7):
    """仪表盘指标"""
    return analytics.get_dashboard_metrics(days)

@app.get("/metrics/user/{user_id}")
async def user_metrics(user_id: str):
    """用户指标"""
    profile = analytics.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile.to_dict()

@app.post("/feedback")
async def submit_feedback(
    session_id: str,
    feedback: int,  # 1: thumbs up, -1: thumbs down
    satisfaction: Optional[float] = None
):
    """提交反馈"""
    # 更新会话反馈
    # 实际实现需要更新数据库
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 6.4 运行脚本

```bash
#!/bin/bash
# run.sh

# 创建日志目录
mkdir -p logs

# 启动可观测性基础设施
docker-compose -f docker/docker-compose.yml up -d

echo "等待基础设施启动..."
sleep 10

# 启动应用
export OPENAI_API_KEY="your-api-key"
python -m app.main
```

---

## 七、面试考点

### Q1: 为什么 AI 应用需要特殊的可观测性设计？

**参考答案：**

AI 应用与传统应用相比有三大特殊性：

1. **黑盒决策**：LLM 的推理过程不透明，需要通过 CoT 日志记录思考步骤
2. **成本敏感**：Token 消耗直接关联成本，需要精确追踪每个请求的费用
3. **质量波动**：输出质量不稳定，需要用户满意度指标来监控效果

因此需要：
- Prompt/Completion 日志记录
- Token 消耗和成本追踪
- 多轮对话状态追踪
- 用户反馈闭环

### Q2: 如何设计 Chain-of-Thought 日志系统？

**参考答案：**

设计要点：

```python
# 1. 结构化日志格式
{
    "timestamp": "2024-01-15T10:30:00Z",
    "trace_id": "uuid",
    "event_type": "tool_decision",  # user_input/llm_request/tool_execution/...
    "step": 2,
    "thought": "用户需要查询天气",
    "action": "call_weather_api",
    "observation": "北京今天晴",
    "reflection": "获取到天气信息，可以回答用户"
}

# 2. 上下文传递 - 使用 ContextVar
trace_id_var: ContextVar[str] = ContextVar('trace_id')

# 3. 日志级别分层
# DEBUG: 详细推理步骤
# INFO: 关键决策点
# ERROR: 异常和失败
```

### Q3: OpenTelemetry 在 AI 应用中的最佳实践？

**参考答案：**

```python
# 1. 自动埋点 + 手动埋点结合
from opentelemetry.instrumentation.openai import OpenAIInstrumentor
OpenAIInstrumentor().instrument()  # 自动

# 手动补充业务属性
with tracer.start_as_current_span("agent.step") as span:
    span.set_attribute("agent.thought", thought)
    span.set_attribute("tool.selected", tool_name)

# 2. 采样策略 - 尾部采样保留错误
processors:
  tail_sampling:
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}

# 3. 指标设计
# - 业务指标：请求数、满意度、完成率
# - 系统指标：延迟、Token 消耗、错误率
# - 成本指标：单次请求成本、日均成本
```

### Q4: 如何实现用户行为分析？

**参考答案：**

数据模型设计：

```
Event Stream → Session Aggregation → User Profile

关键指标：
- 会话维度：轮次、时长、完成状态、满意度
- 用户维度：留存率、活跃度、偏好主题
- 业务维度：DAU、留存、NPS

技术实现：
1. 实时流处理（Kafka + Flink）
2. 离线数仓分析（Hive/ClickHouse）
3. 实时仪表板（Grafana + WebSocket）
```

### Q5: 监控告警体系如何设计？

**参考答案：**

分层告警策略：

```yaml
# 基础设施层
- 服务可用性、资源使用率

# 应用性能层  
- P99 延迟、错误率、吞吐量

# 业务指标层
- Token 消耗、成本、用户满意度

# 智能告警
- 动态阈值（基于历史数据）
- 异常检测（孤立森林算法）
- 告警收敛（相似告警合并）
```

### Q6: 如何处理敏感数据（Prompt/Completion）的日志记录？

**参考答案：**

```python
# 1. 数据脱敏
def mask_sensitive_data(text: str) -> str:
    # 正则匹配：手机号、身份证号、银行卡
    patterns = [
        (r'\d{11}', '***PHONE***'),
        (r'\d{18}', '***ID***'),
    ]
    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)
    return text

# 2. 分级存储
# - 热存储（7天）：完整数据，加密
# - 冷存储（90天）：脱敏数据
# - 归档：仅保留统计指标

# 3. 访问控制
# - 基于角色的日志访问
# - 审计日志记录查询行为
# - 数据加密（AES-256）
```

---

## 八、避坑指南

1. **日志爆炸**：AI 应用产生大量日志，需要采样和分级存储
2. **上下文丢失**：异步任务中 trace_id 传递容易丢失，使用 ContextVar
3. **性能影响**：追踪埋点带来 5-10% 开销，生产环境需要异步导出
4. **数据隐私**：Prompt 可能包含敏感信息，必须脱敏处理
5. **成本失控**：Token 消耗监控不及时可能导致高额账单

---

## 九、扩展阅读

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [Grafana LGTM Stack](https://grafana.com/go/observabilitycon/2023/lgtm/)
- [AI 应用可观测性最佳实践](https://www.anthropic.com/research)
- [LangSmith 文档](https://docs.smith.langchain.com/)

---

## 十、课后练习

1. 为现有 Agent 项目添加完整的可观测性埋点
2. 搭建本地可观测性环境（Docker Compose）
3. 设计并实现用户满意度收集系统
4. 配置告警规则并测试触发流程
5. 分析一周的真实用户数据，生成优化建议
