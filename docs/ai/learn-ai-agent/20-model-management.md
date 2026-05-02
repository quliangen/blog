---
title: 20-模型管理与 A/B 测试
description: 多模型路由，Prompt 版本管理，效果评估，灰度发布
---

# 20-模型管理与 A/B 测试

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级开发能力 | ✅ 性能/安全/成本 |
| 工程化能力 | ✅ 监控/测试/部署 |
| 项目交付能力 | ✅ 完整项目实战 |
| 模型管理能力 | ✅ 多模型路由/Prompt版本/A-B测试 |

## 学习目标

学完本节，你将能够：
- 设计并实现多模型路由策略
- 管理 Prompt 版本与迭代
- 建立效果评估指标体系
- 实施灰度发布机制
- 搭建完整的 A/B 测试框架

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 了解 LLM API 调用方式

---

## 核心概念

### 1. 多模型路由策略

多模型路由是指根据任务特性、成本、延迟等因素，智能选择最合适的模型处理请求。

#### 1.1 路由策略类型

| 策略 | 适用场景 | 优点 |
|-----|---------|-----|
| 成本优先 | 预算敏感场景 | 降低运营成本 |
| 质量优先 | 关键业务场景 | 确保输出质量 |
| 延迟优先 | 实时交互场景 | 提升用户体验 |
| 混合路由 | 复杂业务场景 | 平衡成本与质量 |

#### 1.2 路由决策因素

```
路由决策 = f(任务类型, 复杂度, 成本预算, 延迟要求, 模型可用性)
```

### 2. Prompt 版本管理

Prompt 版本管理是追踪、对比和回滚 Prompt 变更的关键能力。

#### 2.1 版本管理要素

- **版本号**: 语义化版本 (v1.0.0)
- **变更记录**: 修改内容、原因、时间
- **效果数据**: 各版本性能指标
- **回滚机制**: 快速切换历史版本

#### 2.2 Prompt 迭代流程

```
需求分析 → Prompt设计 → 版本记录 → A/B测试 → 效果评估 → 正式发布
```

### 3. 效果评估指标

#### 3.1 客观指标

| 指标 | 说明 | 计算方式 |
|-----|-----|---------|
| 准确率 | 输出正确比例 | 正确数/总数 |
| 延迟 | 响应时间 | P50/P95/P99 |
| Token消耗 | 成本指标 | 输入+输出Token |
| 成功率 | API调用成功比例 | 成功数/总调用数 |

#### 3.2 主观指标

| 指标 | 说明 | 评估方式 |
|-----|-----|---------|
| 相关性 | 输出与问题相关度 | 人工评分1-5 |
| 连贯性 | 逻辑流畅程度 | 人工评分1-5 |
| 有用性 | 实际帮助程度 | 用户反馈 |

### 4. 灰度发布机制

灰度发布是逐步将新版本推向全量用户的风险控制手段。

#### 4.1 灰度阶段

```
1% → 5% → 10% → 25% → 50% → 100%
```

#### 4.2 灰度监控指标

- 错误率变化
- 延迟变化
- 用户反馈评分
- 业务指标波动

---

## 动手实战

### 实战1: 多模型路由器

```python
"""
多模型路由系统 - 根据任务智能选择最优模型
"""
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, List, Callable
import time
import random


class ModelTier(Enum):
    """模型等级"""
    ECONOMY = "economy"      # 低成本模型
    STANDARD = "standard"    # 标准模型
    PREMIUM = "premium"      # 高质量模型


@dataclass
class ModelConfig:
    """模型配置"""
    name: str
    tier: ModelTier
    max_tokens: int
    cost_per_1k_tokens: float
    avg_latency_ms: int
    strengths: List[str]  # 擅长任务类型


@dataclass
class RoutingRequest:
    """路由请求"""
    task_type: str
    complexity: int  # 1-10
    max_cost: Optional[float] = None
    max_latency_ms: Optional[int] = None
    require_quality: bool = False


class ModelRouter:
    """模型路由器"""
    
    def __init__(self):
        self.models: Dict[str, ModelConfig] = {}
        self.metrics: Dict[str, Dict] = {}
        
    def register_model(self, config: ModelConfig):
        """注册模型"""
        self.models[config.name] = config
        self.metrics[config.name] = {
            "calls": 0,
            "errors": 0,
            "total_latency": 0
        }
        
    def route(self, request: RoutingRequest) -> str:
        """
        智能路由决策
        
        策略优先级:
        1. 质量优先: 选择最高等级模型
        2. 成本优先: 选择满足需求的最低成本模型
        3. 延迟优先: 选择满足需求的最快模型
        """
        candidates = []
        
        for name, config in self.models.items():
            # 检查约束条件
            if request.max_cost and config.cost_per_1k_tokens > request.max_cost:
                continue
            if request.max_latency_ms and config.avg_latency_ms > request.max_latency_ms:
                continue
            if request.task_type not in config.strengths:
                continue
                
            # 计算匹配分数
            score = self._calculate_score(config, request)
            candidates.append((name, score))
        
        if not candidates:
            raise ValueError("没有满足约束的模型")
            
        # 按分数排序，返回最优模型
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]
    
    def _calculate_score(self, config: ModelConfig, request: RoutingRequest) -> float:
        """计算模型匹配分数"""
        score = 0.0
        
        # 复杂度匹配
        tier_scores = {
            ModelTier.ECONOMY: 3,
            ModelTier.STANDARD: 6,
            ModelTier.PREMIUM: 10
        }
        complexity_match = 1 - abs(tier_scores[config.tier] - request.complexity) / 10
        score += complexity_match * 0.4
        
        # 成本效率 (越低越好)
        max_cost = max(m.cost_per_1k_tokens for m in self.models.values())
        cost_efficiency = 1 - (config.cost_per_1k_tokens / max_cost)
        score += cost_efficiency * 0.3
        
        # 延迟效率 (越低越好)
        max_latency = max(m.avg_latency_ms for m in self.models.values())
        latency_efficiency = 1 - (config.avg_latency_ms / max_latency)
        score += latency_efficiency * 0.3
        
        # 质量要求加成
        if request.require_quality and config.tier == ModelTier.PREMIUM:
            score += 0.2
            
        return score


# ============ 使用示例 ============

def demo_router():
    """演示多模型路由"""
    router = ModelRouter()
    
    # 注册模型
    router.register_model(ModelConfig(
        name="gpt-3.5-turbo",
        tier=ModelTier.ECONOMY,
        max_tokens=4096,
        cost_per_1k_tokens=0.0015,
        avg_latency_ms=500,
        strengths=["简单问答", "文本生成", "翻译"]
    ))
    
    router.register_model(ModelConfig(
        name="gpt-4",
        tier=ModelTier.PREMIUM,
        max_tokens=8192,
        cost_per_1k_tokens=0.03,
        avg_latency_ms=1500,
        strengths=["复杂推理", "代码生成", "创意写作", "分析任务"]
    ))
    
    router.register_model(ModelConfig(
        name="claude-3-sonnet",
        tier=ModelTier.STANDARD,
        max_tokens=4096,
        cost_per_1k_tokens=0.008,
        avg_latency_ms=800,
        strengths=["长文本", "分析任务", "代码生成"]
    ))
    
    # 测试不同场景的路由决策
    test_cases = [
        RoutingRequest(task_type="简单问答", complexity=2, max_cost=0.005),
        RoutingRequest(task_type="复杂推理", complexity=8, require_quality=True),
        RoutingRequest(task_type="代码生成", complexity=6, max_latency_ms=1000),
        RoutingRequest(task_type="长文本", complexity=5),
    ]
    
    print("=== 多模型路由演示 ===\n")
    for req in test_cases:
        selected = router.route(req)
        print(f"任务: {req.task_type} (复杂度: {req.complexity})")
        print(f"选中模型: {selected}")
        print(f"约束: 成本≤{req.max_cost}, 延迟≤{req.max_latency_ms}ms, 高质量={req.require_quality}")
        print("-" * 50)


if __name__ == "__main__":
    demo_router()
```

### 实战2: Prompt 版本管理系统

```python
"""
Prompt 版本管理系统 - 追踪、对比和回滚 Prompt 变更
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import json


@dataclass
class PromptVersion:
    """Prompt 版本记录"""
    version_id: str
    version_number: str  # 语义化版本
    template: str
    variables: List[str]
    description: str
    created_at: datetime
    created_by: str
    change_log: str
    performance_metrics: Dict = field(default_factory=dict)
    is_active: bool = False
    
    def get_hash(self) -> str:
        """计算 Prompt 内容的哈希值"""
        content = f"{self.template}:{json.dumps(self.variables, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]


class PromptVersionManager:
    """Prompt 版本管理器"""
    
    def __init__(self, prompt_name: str):
        self.prompt_name = prompt_name
        self.versions: Dict[str, PromptVersion] = {}
        self.active_version_id: Optional[str] = None
        self.version_counter = 0
        
    def create_version(
        self,
        template: str,
        variables: List[str],
        description: str,
        created_by: str,
        change_log: str,
        bump_type: str = "patch"  # major/minor/patch
    ) -> PromptVersion:
        """创建新版本"""
        self.version_counter += 1
        
        # 生成语义化版本号
        if self.versions:
            current_version = self._get_latest_version_number()
            new_version = self._bump_version(current_version, bump_type)
        else:
            new_version = "1.0.0"
            
        version_id = f"{self.prompt_name}_v{new_version}_{self.version_counter}"
        
        version = PromptVersion(
            version_id=version_id,
            version_number=new_version,
            template=template,
            variables=variables,
            description=description,
            created_at=datetime.now(),
            created_by=created_by,
            change_log=change_log
        )
        
        self.versions[version_id] = version
        return version
    
    def _get_latest_version_number(self) -> str:
        """获取最新版本号"""
        versions = sorted(self.versions.values(), key=lambda v: v.created_at)
        return versions[-1].version_number if versions else "0.0.0"
    
    def _bump_version(self, current: str, bump_type: str) -> str:
        """版本号递增"""
        major, minor, patch = map(int, current.split("."))
        
        if bump_type == "major":
            return f"{major + 1}.0.0"
        elif bump_type == "minor":
            return f"{major}.{minor + 1}.0"
        else:  # patch
            return f"{major}.{minor}.{patch + 1}"
    
    def activate_version(self, version_id: str):
        """激活指定版本"""
        if version_id not in self.versions:
            raise ValueError(f"版本 {version_id} 不存在")
            
        # 取消当前激活版本
        if self.active_version_id:
            self.versions[self.active_version_id].is_active = False
            
        # 激活新版本
        self.versions[version_id].is_active = True
        self.active_version_id = version_id
        
    def rollback(self, version_id: str) -> PromptVersion:
        """回滚到指定版本"""
        if version_id not in self.versions:
            raise ValueError(f"版本 {version_id} 不存在")
            
        self.activate_version(version_id)
        return self.versions[version_id]
    
    def compare_versions(self, v1_id: str, v2_id: str) -> Dict:
        """对比两个版本"""
        if v1_id not in self.versions or v2_id not in self.versions:
            raise ValueError("版本不存在")
            
        v1, v2 = self.versions[v1_id], self.versions[v2_id]
        
        return {
            "version_1": v1.version_number,
            "version_2": v2.version_number,
            "template_diff": self._diff_text(v1.template, v2.template),
            "variables_added": list(set(v2.variables) - set(v1.variables)),
            "variables_removed": list(set(v1.variables) - set(v2.variables)),
            "performance_delta": self._calc_performance_delta(v1, v2)
        }
    
    def _diff_text(self, text1: str, text2: str) -> str:
        """简单文本差异对比"""
        if text1 == text2:
            return "无变化"
        return "存在差异"
    
    def _calc_performance_delta(self, v1: PromptVersion, v2: PromptVersion) -> Dict:
        """计算性能差异"""
        delta = {}
        for metric in set(v1.performance_metrics.keys()) | set(v2.performance_metrics.keys()):
            m1 = v1.performance_metrics.get(metric, 0)
            m2 = v2.performance_metrics.get(metric, 0)
            if m1 > 0:
                delta[metric] = f"{((m2 - m1) / m1 * 100):+.1f}%"
            else:
                delta[metric] = "N/A"
        return delta
    
    def update_metrics(self, version_id: str, metrics: Dict):
        """更新版本性能指标"""
        if version_id in self.versions:
            self.versions[version_id].performance_metrics.update(metrics)
    
    def get_version_history(self) -> List[Dict]:
        """获取版本历史"""
        versions = sorted(self.versions.values(), key=lambda v: v.created_at)
        return [
            {
                "version_id": v.version_id,
                "version_number": v.version_number,
                "description": v.description,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat(),
                "is_active": v.is_active,
                "hash": v.get_hash()[:8]
            }
            for v in versions
        ]
    
    def render(self, **kwargs) -> str:
        """渲染当前激活版本的 Prompt"""
        if not self.active_version_id:
            raise ValueError("没有激活的 Prompt 版本")
            
        version = self.versions[self.active_version_id]
        
        # 检查必需变量
        missing = set(version.variables) - set(kwargs.keys())
        if missing:
            raise ValueError(f"缺少必需变量: {missing}")
            
        return version.template.format(**kwargs)


# ============ 使用示例 ============

def demo_version_manager():
    """演示 Prompt 版本管理"""
    
    # 初始化管理器
    manager = PromptVersionManager("customer_service_prompt")
    
    # 创建 v1.0.0
    v1 = manager.create_version(
        template="你是一个客服助手。用户问题: {question}",
        variables=["question"],
        description="基础客服 Prompt",
        created_by="张三",
        change_log="初始版本",
        bump_type="minor"
    )
    print(f"创建版本: {v1.version_number} (ID: {v1.version_id})")
    
    # 创建 v1.1.0 - 添加角色设定
    v2 = manager.create_version(
        template="""你是一个专业的客服助手。
角色设定: {role}
用户问题: {question}
请以友好、专业的态度回答。""",
        variables=["role", "question"],
        description="添加角色设定",
        created_by="李四",
        change_log="增加角色变量，提升个性化",
        bump_type="minor"
    )
    print(f"创建版本: {v2.version_number} (ID: {v2.version_id})")
    
    # 创建 v1.1.1 - 优化语气
    v3 = manager.create_version(
        template="""你是一个专业的客服助手。
角色设定: {role}
用户问题: {question}
请以热情、耐心、专业的态度回答，确保用户满意。""",
        variables=["role", "question"],
        description="优化回答语气",
        created_by="王五",
        change_log="优化语气描述，提升用户体验",
        bump_type="patch"
    )
    print(f"创建版本: {v3.version_number} (ID: {v3.version_id})")
    
    # 激活 v1.1.0
    manager.activate_version(v2.version_id)
    print(f"\n激活版本: {v2.version_number}")
    
    # 模拟性能数据
    manager.update_metrics(v2.version_id, {
        "accuracy": 0.85,
        "user_satisfaction": 4.2,
        "avg_response_time": 1.5
    })
    
    manager.update_metrics(v3.version_id, {
        "accuracy": 0.88,
        "user_satisfaction": 4.5,
        "avg_response_time": 1.6
    })
    
    # 版本对比
    print("\n=== 版本对比 ===")
    comparison = manager.compare_versions(v2.version_id, v3.version_id)
    print(f"版本 {comparison['version_1']} vs {comparison['version_2']}")
    print(f"变量变化: +{comparison['variables_added']}, -{comparison['variables_removed']}")
    print(f"性能变化: {comparison['performance_delta']}")
    
    # 版本历史
    print("\n=== 版本历史 ===")
    for history in manager.get_version_history():
        active_mark = " [ACTIVE]" if history['is_active'] else ""
        print(f"{history['version_number']} ({history['hash']}) - {history['description']}{active_mark}")
    
    # 渲染 Prompt
    print("\n=== 渲染 Prompt ===")
    rendered = manager.render(role="技术支持", question="如何重置密码？")
    print(rendered)


if __name__ == "__main__":
    demo_version_manager()
```

### 实战3: A/B 测试框架

```python
"""
A/B 测试框架 - 对比不同模型/Prompt版本的效果
"""
from dataclasses import dataclass, field
from typing import Dict, List, Callable, Any, Optional
from datetime import datetime
from enum import Enum
import random
import json
import hashlib


class ExperimentStatus(Enum):
    """实验状态"""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass
class Variant:
    """实验变体"""
    variant_id: str
    name: str
    config: Dict[str, Any]  # 模型配置/Prompt版本等
    traffic_percentage: float  # 流量占比 0-1
    metrics: Dict[str, List[float]] = field(default_factory=dict)
    
    def record_metric(self, metric_name: str, value: float):
        """记录指标"""
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        self.metrics[metric_name].append(value)
    
    def get_stats(self, metric_name: str) -> Dict:
        """获取指标统计"""
        values = self.metrics.get(metric_name, [])
        if not values:
            return {"count": 0, "mean": 0, "min": 0, "max": 0}
        return {
            "count": len(values),
            "mean": sum(values) / len(values),
            "min": min(values),
            "max": max(values)
        }


@dataclass
class Experiment:
    """实验定义"""
    experiment_id: str
    name: str
    description: str
    hypothesis: str  # 实验假设
    primary_metric: str  # 主要评估指标
    secondary_metrics: List[str]  # 次要指标
    variants: Dict[str, Variant]
    status: ExperimentStatus
    created_at: datetime
    min_sample_size: int  # 最小样本量
    significance_level: float = 0.05
    
    def assign_variant(self, user_id: str) -> str:
        """为用户分配变体 (基于哈希的一致性分配)"""
        hash_input = f"{self.experiment_id}:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        
        # 计算累积概率
        cumulative = 0
        bucket = (hash_value % 1000) / 1000
        
        for variant_id, variant in self.variants.items():
            cumulative += variant.traffic_percentage
            if bucket <= cumulative:
                return variant_id
        
        # 默认返回第一个
        return list(self.variants.keys())[0]


class ABTestFramework:
    """A/B 测试框架"""
    
    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}
        self.user_assignments: Dict[str, Dict[str, str]] = {}  # user_id -> {exp_id: variant_id}
        
    def create_experiment(
        self,
        name: str,
        description: str,
        hypothesis: str,
        primary_metric: str,
        secondary_metrics: List[str],
        min_sample_size: int = 1000
    ) -> Experiment:
        """创建新实验"""
        exp_id = f"exp_{name.lower().replace(' ', '_')}_{int(datetime.now().timestamp())}"
        
        experiment = Experiment(
            experiment_id=exp_id,
            name=name,
            description=description,
            hypothesis=hypothesis,
            primary_metric=primary_metric,
            secondary_metrics=secondary_metrics,
            variants={},
            status=ExperimentStatus.DRAFT,
            created_at=datetime.now(),
            min_sample_size=min_sample_size
        )
        
        self.experiments[exp_id] = experiment
        return experiment
    
    def add_variant(
        self,
        experiment_id: str,
        name: str,
        config: Dict,
        traffic_percentage: float
    ) -> Variant:
        """添加实验变体"""
        if experiment_id not in self.experiments:
            raise ValueError(f"实验 {experiment_id} 不存在")
            
        exp = self.experiments[experiment_id]
        
        # 检查流量总和
        current_total = sum(v.traffic_percentage for v in exp.variants.values())
        if current_total + traffic_percentage > 1.0:
            raise ValueError(f"流量总和超过100%: {current_total + traffic_percentage}")
        
        variant_id = f"{experiment_id}_variant_{len(exp.variants)}"
        variant = Variant(
            variant_id=variant_id,
            name=name,
            config=config,
            traffic_percentage=traffic_percentage
        )
        
        exp.variants[variant_id] = variant
        return variant
    
    def start_experiment(self, experiment_id: str):
        """启动实验"""
        if experiment_id not in self.experiments:
            raise ValueError(f"实验不存在")
            
        exp = self.experiments[experiment_id]
        
        if len(exp.variants) < 2:
            raise ValueError("至少需要2个变体")
            
        # 检查流量分配
        total = sum(v.traffic_percentage for v in exp.variants.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"流量分配不等于100%: {total}")
        
        exp.status = ExperimentStatus.RUNNING
        print(f"实验 '{exp.name}' 已启动")
    
    def get_variant_for_user(self, experiment_id: str, user_id: str) -> Optional[Variant]:
        """获取用户分配的变体"""
        if experiment_id not in self.experiments:
            return None
            
        exp = self.experiments[experiment_id]
        
        if exp.status != ExperimentStatus.RUNNING:
            return None
        
        # 检查已有分配
        if user_id in self.user_assignments and experiment_id in self.user_assignments[user_id]:
            variant_id = self.user_assignments[user_id][experiment_id]
        else:
            # 新分配
            variant_id = exp.assign_variant(user_id)
            if user_id not in self.user_assignments:
                self.user_assignments[user_id] = {}
            self.user_assignments[user_id][experiment_id] = variant_id
        
        return exp.variants.get(variant_id)
    
    def record_event(
        self,
        experiment_id: str,
        user_id: str,
        metric_name: str,
        value: float
    ):
        """记录实验事件"""
        variant = self.get_variant_for_user(experiment_id, user_id)
        if variant:
            variant.record_metric(metric_name, value)
    
    def get_results(self, experiment_id: str) -> Dict:
        """获取实验结果"""
        if experiment_id not in self.experiments:
            raise ValueError(f"实验不存在")
            
        exp = self.experiments[experiment_id]
        
        results = {
            "experiment_info": {
                "name": exp.name,
                "hypothesis": exp.hypothesis,
                "primary_metric": exp.primary_metric,
                "status": exp.status.value,
                "created_at": exp.created_at.isoformat()
            },
            "variants": {}
        }
        
        # 计算各变体统计
        for variant_id, variant in exp.variants.items():
            variant_result = {
                "name": variant.name,
                "traffic_percentage": variant.traffic_percentage,
                "config": variant.config,
                "metrics": {}
            }
            
            # 主要指标
            primary_stats = variant.get_stats(exp.primary_metric)
            variant_result["metrics"][exp.primary_metric] = primary_stats
            
            # 次要指标
            for metric in exp.secondary_metrics:
                variant_result["metrics"][metric] = variant.get_stats(metric)
            
            results["variants"][variant_id] = variant_result
        
        # 计算提升率 (相对于对照组)
        if len(exp.variants) >= 2:
            control_id = list(exp.variants.keys())[0]  # 第一个作为对照组
            control_mean = results["variants"][control_id]["metrics"][exp.primary_metric]["mean"]
            
            for variant_id in results["variants"]:
                if variant_id != control_id:
                    variant_mean = results["variants"][variant_id]["metrics"][exp.primary_metric]["mean"]
                    if control_mean > 0:
                        lift = (variant_mean - control_mean) / control_mean * 100
                        results["variants"][variant_id]["lift"] = f"{lift:+.2f}%"
        
        return results
    
    def recommend_winner(self, experiment_id: str) -> Optional[str]:
        """推荐获胜变体"""
        results = self.get_results(experiment_id)
        
        variants = results["variants"]
        if len(variants) < 2:
            return None
        
        # 找到表现最好的变体
        best_variant = None
        best_metric = -float('inf')
        
        for variant_id, data in variants.items():
            metric_value = data["metrics"][results["experiment_info"]["primary_metric"]]["mean"]
            if metric_value > best_metric:
                best_metric = metric_value
                best_variant = variant_id
        
        return best_variant


# ============ 使用示例 ============

def demo_ab_test():
    """演示 A/B 测试框架"""
    
    framework = ABTestFramework()
    
    # 创建实验: 对比两个 Prompt 版本
    exp = framework.create_experiment(
        name="Prompt优化实验",
        description="对比简洁版 vs 详细版 Prompt 的效果",
        hypothesis="详细版 Prompt 能提升回答质量",
        primary_metric="quality_score",
        secondary_metrics=["response_time", "token_count"],
        min_sample_size=500
    )
    
    # 添加对照组 (简洁版)
    control = framework.add_variant(
        experiment_id=exp.experiment_id,
        name="简洁版",
        config={
            "prompt_version": "v1.0",
            "template": "回答问题: {question}",
            "model": "gpt-3.5-turbo"
        },
        traffic_percentage=0.5
    )
    
    # 添加实验组 (详细版)
    treatment = framework.add_variant(
        experiment_id=exp.experiment_id,
        name="详细版",
        config={
            "prompt_version": "v2.0",
            "template": "你是一个专业助手。请详细、准确地回答: {question}",
            "model": "gpt-3.5-turbo"
        },
        traffic_percentage=0.5
    )
    
    # 启动实验
    framework.start_experiment(exp.experiment_id)
    
    # 模拟用户请求和数据收集
    print("=== 模拟实验数据收集 ===\n")
    
    for i in range(100):
        user_id = f"user_{i}"
        
        # 获取分配的变体
        variant = framework.get_variant_for_user(exp.experiment_id, user_id)
        
        # 模拟指标数据
        if variant.name == "简洁版":
            quality = random.gauss(3.5, 0.5)  # 平均3.5分
            response_time = random.gauss(0.8, 0.1)
        else:
            quality = random.gauss(4.2, 0.4)  # 平均4.2分 (更好)
            response_time = random.gauss(1.2, 0.15)
        
        # 记录事件
        framework.record_event(exp.experiment_id, user_id, "quality_score", max(1, min(5, quality)))
        framework.record_event(exp.experiment_id, user_id, "response_time", response_time)
        framework.record_event(exp.experiment_id, user_id, "token_count", random.randint(100, 500))
        
        if i < 5:
            print(f"用户 {user_id} -> {variant.name}: quality={quality:.2f}")
    
    # 查看实验结果
    print("\n=== 实验结果 ===")
    results = framework.get_results(exp.experiment_id)
    
    print(f"\n实验: {results['experiment_info']['name']}")
    print(f"假设: {results['experiment_info']['hypothesis']}")
    
    for variant_id, data in results["variants"].items():
        print(f"\n变体: {data['name']} (流量: {data['traffic_percentage']*100}%)")
        print(f"  配置: {data['config']}")
        
        for metric, stats in data["metrics"].items():
            print(f"  {metric}: count={stats['count']}, mean={stats['mean']:.3f}")
        
        if "lift" in data:
            print(f"  提升率: {data['lift']}")
    
    # 推荐获胜者
    winner = framework.recommend_winner(exp.experiment_id)
    if winner:
        winner_name = results["variants"][winner]["name"]
        print(f"\n🏆 推荐获胜变体: {winner_name}")


if __name__ == "__main__":
    demo_ab_test()
```

### 实战4: 灰度发布系统

```python
"""
灰度发布系统 - 逐步发布新版本，控制风险
"""
from dataclasses import dataclass, field
from typing import Dict, List, Callable, Optional
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import threading
import time


class RolloutStage(Enum):
    """灰度阶段"""
    CANARY_1 = 0.01    # 1%
    CANARY_5 = 0.05    # 5%
    CANARY_10 = 0.10   # 10%
    CANARY_25 = 0.25   # 25%
    CANARY_50 = 0.50   # 50%
    FULL = 1.0         # 100%


class RolloutStatus(Enum):
    """发布状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    ROLLED_BACK = "rolled_back"
    COMPLETED = "completed"


@dataclass
class RolloutConfig:
    """灰度发布配置"""
    stages: List[RolloutStage] = field(default_factory=lambda: [
        RolloutStage.CANARY_1,
        RolloutStage.CANARY_5,
        RolloutStage.CANARY_10,
        RolloutStage.CANARY_25,
        RolloutStage.CANARY_50,
        RolloutStage.FULL
    ])
    stage_duration_minutes: int = 30  # 每阶段持续时间
    auto_promote: bool = False  # 是否自动推进
    
    # 健康检查阈值
    error_rate_threshold: float = 0.05  # 错误率阈值
    latency_p95_threshold_ms: int = 2000  # P95延迟阈值
    
    # 回滚条件
    rollback_on_error_spike: bool = True
    rollback_on_latency_spike: bool = True


@dataclass
class RolloutMetrics:
    """发布阶段指标"""
    stage: RolloutStage
    started_at: datetime
    requests_count: int = 0
    error_count: int = 0
    latencies: List[float] = field(default_factory=list)
    
    @property
    def error_rate(self) -> float:
        if self.requests_count == 0:
            return 0.0
        return self.error_count / self.requests_count
    
    @property
    def p95_latency(self) -> float:
        if not self.latencies:
            return 0.0
        sorted_latencies = sorted(self.latencies)
        idx = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[min(idx, len(sorted_latencies) - 1)]


class CanaryRollout:
    """灰度发布管理器"""
    
    def __init__(
        self,
        rollout_id: str,
        new_version_config: Dict,
        old_version_config: Dict,
        config: RolloutConfig
    ):
        self.rollout_id = rollout_id
        self.new_version = new_version_config
        self.old_version = old_version_config
        self.config = config
        
        self.status = RolloutStatus.PENDING
        self.current_stage_idx = -1
        self.stage_metrics: Dict[RolloutStage, RolloutMetrics] = {}
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        
        self._lock = threading.Lock()
        self._callbacks: List[Callable] = []
        
    def start(self):
        """开始灰度发布"""
        with self._lock:
            if self.status != RolloutStatus.PENDING:
                raise ValueError("发布已开始或已完成")
            
            self.status = RolloutStatus.IN_PROGRESS
            self.started_at = datetime.now()
            self._advance_stage()
    
    def _advance_stage(self):
        """推进到下一阶段"""
        self.current_stage_idx += 1
        
        if self.current_stage_idx >= len(self.config.stages):
            self._complete()
            return
        
        stage = self.config.stages[self.current_stage_idx]
        self.stage_metrics[stage] = RolloutMetrics(
            stage=stage,
            started_at=datetime.now()
        )
        
        print(f"[{self.rollout_id}] 进入灰度阶段: {stage.name} ({stage.value*100}%)")
    
    def should_use_new_version(self, user_id: str) -> bool:
        """判断用户是否使用新版本"""
        with self._lock:
            if self.status not in [RolloutStatus.IN_PROGRESS, RolloutStatus.COMPLETED]:
                return False
            
            if self.current_stage_idx < 0:
                return False
            
            current_stage = self.config.stages[self.current_stage_idx]
            
            # 一致性哈希分配
            hash_input = f"{self.rollout_id}:{user_id}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            bucket = (hash_value % 10000) / 10000
            
            return bucket < current_stage.value
    
    def record_request(self, user_id: str, latency_ms: float, is_error: bool = False):
        """记录请求指标"""
        with self._lock:
            if self.status != RolloutStatus.IN_PROGRESS:
                return
            
            current_stage = self.config.stages[self.current_stage_idx]
            metrics = self.stage_metrics[current_stage]
            
            metrics.requests_count += 1
            metrics.latencies.append(latency_ms)
            if is_error:
                metrics.error_count += 1
            
            # 检查是否需要回滚
            self._check_health(metrics)
    
    def _check_health(self, metrics: RolloutMetrics):
        """健康检查"""
        # 样本量不足时不判断
        if metrics.requests_count < 10:
            return
        
        # 检查错误率
        if self.config.rollback_on_error_spike:
            if metrics.error_rate > self.config.error_rate_threshold:
                print(f"⚠️ 错误率超标: {metrics.error_rate:.2%} > {self.config.error_rate_threshold:.2%}")
                self.rollback("错误率超标")
                return
        
        # 检查延迟
        if self.config.rollback_on_latency_spike:
            if metrics.p95_latency > self.config.latency_p95_threshold_ms:
                print(f"⚠️ 延迟超标: P95={metrics.p95_latency:.0f}ms > {self.config.latency_p95_threshold_ms}ms")
                self.rollback("延迟超标")
                return
    
    def promote(self):
        """手动推进到下一阶段"""
        with self._lock:
            if self.status != RolloutStatus.IN_PROGRESS:
                raise ValueError("发布未在进行中")
            
            self._advance_stage()
    
    def rollback(self, reason: str = "手动回滚"):
        """回滚发布"""
        with self._lock:
            if self.status in [RolloutStatus.COMPLETED, RolloutStatus.ROLLED_BACK]:
                return
            
            self.status = RolloutStatus.ROLLED_BACK
            print(f"[{self.rollout_id}] 已回滚: {reason}")
            
            # 触发回调
            for callback in self._callbacks:
                callback("rollback", self)
    
    def _complete(self):
        """完成发布"""
        self.status = RolloutStatus.COMPLETED
        self.completed_at = datetime.now()
        print(f"[{self.rollout_id}] 灰度发布完成")
        
        for callback in self._callbacks:
            callback("complete", self)
    
    def get_status(self) -> Dict:
        """获取发布状态"""
        with self._lock:
            current_stage = None
            if 0 <= self.current_stage_idx < len(self.config.stages):
                current_stage = self.config.stages[self.current_stage_idx]
            
            return {
                "rollout_id": self.rollout_id,
                "status": self.status.value,
                "current_stage": current_stage.name if current_stage else None,
                "traffic_percentage": current_stage.value * 100 if current_stage else 0,
                "started_at": self.started_at.isoformat() if self.started_at else None,
                "stage_metrics": {
                    stage.name: {
                        "requests": m.requests_count,
                        "error_rate": f"{m.error_rate:.2%}",
                        "p95_latency_ms": f"{m.p95_latency:.0f}"
                    }
                    for stage, m in self.stage_metrics.items()
                }
            }
    
    def on_event(self, callback: Callable):
        """注册事件回调"""
        self._callbacks.append(callback)


# ============ 使用示例 ============

def demo_canary_rollout():
    """演示灰度发布"""
    
    # 配置灰度发布
    config = RolloutConfig(
        stages=[
            RolloutStage.CANARY_5,
            RolloutStage.CANARY_25,
            RolloutStage.FULL
        ],
        stage_duration_minutes=10,
        auto_promote=False,
        error_rate_threshold=0.10,
        latency_p95_threshold_ms=1000
    )
    
    # 创建灰度发布
    rollout = CanaryRollout(
        rollout_id="prompt-v2-rollout",
        new_version_config={
            "version": "v2.0",
            "model": "gpt-4",
            "prompt_template": "优化版Prompt"
        },
        old_version_config={
            "version": "v1.0",
            "model": "gpt-3.5-turbo",
            "prompt_template": "旧版Prompt"
        },
        config=config
    )
    
    # 注册事件回调
    def on_event(event_type, rollout):
        if event_type == "rollback":
            print(f"📢 收到回滚通知: {rollout.rollout_id}")
        elif event_type == "complete":
            print(f"📢 收到完成通知: {rollout.rollout_id}")
    
    rollout.on_event(on_event)
    
    # 启动发布
    print("=== 启动灰度发布 ===\n")
    rollout.start()
    
    # 模拟用户请求
    print("\n=== 模拟用户请求 ===\n")
    
    import random
    
    for i in range(200):
        user_id = f"user_{i}"
        
        # 判断使用哪个版本
        use_new = rollout.should_use_new_version(user_id)
        version = "v2.0" if use_new else "v1.0"
        
        # 模拟延迟和错误
        if use_new:
            # 新版本可能有更高延迟
            latency = random.gauss(800, 200)
            is_error = random.random() < 0.02  # 2%错误率
        else:
            latency = random.gauss(500, 100)
            is_error = random.random() < 0.01  # 1%错误率
        
        latency = max(100, latency)
        
        # 记录指标
        rollout.record_request(user_id, latency, is_error)
        
        if i < 10:
            print(f"用户 {user_id} -> {version}: 延迟={latency:.0f}ms, 错误={is_error}")
    
    # 查看状态
    print("\n=== 发布状态 ===")
    status = rollout.get_status()
    print(f"状态: {status['status']}")
    print(f"当前阶段: {status['current_stage']}")
    print(f"流量占比: {status['traffic_percentage']}%")
    print(f"阶段指标: {status['stage_metrics']}")
    
    # 手动推进 (演示)
    print("\n=== 手动推进到下一阶段 ===")
    try:
        rollout.promote()
        status = rollout.get_status()
        print(f"新阶段: {status['current_stage']}, 流量: {status['traffic_percentage']}%")
    except Exception as e:
        print(f"推进失败: {e}")


if __name__ == "__main__":
    demo_canary_rollout()
```

### 实战5: 完整集成示例

```python
"""
模型管理与 A/B 测试完整集成示例
"""
from typing import Dict, Optional
import json


class ModelManagementSystem:
    """
    模型管理系统 - 整合路由、版本管理、A/B测试、灰度发布
    """
    
    def __init__(self):
        self.router = None  # ModelRouter
        self.version_managers: Dict[str, 'PromptVersionManager'] = {}
        self.ab_framework = None  # ABTestFramework
        self.active_rollouts: Dict[str, 'CanaryRollout'] = {}
        
    def initialize(self):
        """初始化系统"""
        # 初始化各个组件
        from model_router import ModelRouter, ModelConfig, ModelTier
        from ab_test_framework import ABTestFramework
        
        self.router = ModelRouter()
        self.ab_framework = ABTestFramework()
        
        # 注册默认模型
        self.router.register_model(ModelConfig(
            name="gpt-3.5-turbo",
            tier=ModelTier.ECONOMY,
            max_tokens=4096,
            cost_per_1k_tokens=0.0015,
            avg_latency_ms=500,
            strengths=["简单问答", "文本生成"]
        ))
        
        self.router.register_model(ModelConfig(
            name="gpt-4",
            tier=ModelTier.PREMIUM,
            max_tokens=8192,
            cost_per_1k_tokens=0.03,
            avg_latency_ms=1500,
            strengths=["复杂推理", "代码生成", "分析任务"]
        ))
    
    def create_prompt_with_ab_test(
        self,
        prompt_name: str,
        control_template: str,
        treatment_template: str,
        variables: list,
        experiment_config: dict
    ) -> str:
        """
        创建带 A/B 测试的 Prompt
        
        Returns:
            experiment_id: 实验ID
        """
        # 创建版本管理器
        from prompt_version_manager import PromptVersionManager
        
        vm = PromptVersionManager(prompt_name)
        
        # 创建对照组版本
        control_version = vm.create_version(
            template=control_template,
            variables=variables,
            description="A/B测试对照组",
            created_by="system",
            change_log="A/B测试基线版本",
            bump_type="minor"
        )
        
        # 创建实验组版本
        treatment_version = vm.create_version(
            template=treatment_template,
            variables=variables,
            description="A/B测试实验组",
            created_by="system",
            change_log="A/B测试优化版本",
            bump_type="minor"
        )
        
        self.version_managers[prompt_name] = vm
        
        # 创建 A/B 测试实验
        exp = self.ab_framework.create_experiment(
            name=f"{prompt_name}_ab_test",
            description=f"{prompt_name} 的 A/B 测试",
            hypothesis=experiment_config.get("hypothesis", "优化版本效果更好"),
            primary_metric=experiment_config.get("primary_metric", "quality_score"),
            secondary_metrics=experiment_config.get("secondary_metrics", ["latency"]),
            min_sample_size=experiment_config.get("min_sample_size", 1000)
        )
        
        # 添加变体
        self.ab_framework.add_variant(
            experiment_id=exp.experiment_id,
            name="control",
            config={
                "prompt_name": prompt_name,
                "version_id": control_version.version_id,
                "template": control_template
            },
            traffic_percentage=0.5
        )
        
        self.ab_framework.add_variant(
            experiment_id=exp.experiment_id,
            name="treatment",
            config={
                "prompt_name": prompt_name,
                "version_id": treatment_version.version_id,
                "template": treatment_template
            },
            traffic_percentage=0.5
        )
        
        # 启动实验
        self.ab_framework.start_experiment(exp.experiment_id)
        
        return exp.experiment_id
    
    def process_request(
        self,
        user_id: str,
        query: str,
        prompt_name: str,
        experiment_id: Optional[str] = None,
        **kwargs
    ) -> Dict:
        """
        处理用户请求 - 完整的决策流程
        """
        result = {
            "user_id": user_id,
            "query": query,
            "decisions": {}
        }
        
        # 1. 检查是否有灰度发布
        rollout = self.active_rollouts.get(prompt_name)
        if rollout and rollout.should_use_new_version(user_id):
            result["decisions"]["rollout"] = "new_version"
            # 使用新版本配置
            config = rollout.new_version
        else:
            result["decisions"]["rollout"] = "old_version"
            config = {"prompt_name": prompt_name}
        
        # 2. 检查 A/B 测试分配
        if experiment_id:
            variant = self.ab_framework.get_variant_for_user(experiment_id, user_id)
            if variant:
                result["decisions"]["ab_test_variant"] = variant.name
                result["decisions"]["prompt_version"] = variant.config.get("version_id")
                template = variant.config.get("template")
            else:
                # 使用默认版本
                vm = self.version_managers.get(prompt_name)
                if vm:
                    template = vm.versions[vm.active_version_id].template if vm.active_version_id else None
                else:
                    template = None
        else:
            # 使用激活的版本
            vm = self.version_managers.get(prompt_name)
            if vm and vm.active_version_id:
                template = vm.versions[vm.active_version_id].template
            else:
                template = None
        
        # 3. 模型路由决策
        from model_router import RoutingRequest
        
        route_req = RoutingRequest(
            task_type=kwargs.get("task_type", "问答"),
            complexity=kwargs.get("complexity", 5),
            max_cost=kwargs.get("max_cost"),
            max_latency_ms=kwargs.get("max_latency_ms"),
            require_quality=kwargs.get("require_quality", False)
        )
        
        selected_model = self.router.route(route_req)
        result["decisions"]["model"] = selected_model
        
        # 4. 渲染 Prompt
        if template:
            try:
                prompt = template.format(question=query, **kwargs)
            except:
                prompt = template
        else:
            prompt = query
        
        result["final_prompt"] = prompt
        result["selected_model"] = selected_model
        
        # 模拟调用 (实际项目中调用 LLM API)
        result["mock_response"] = f"[{selected_model}] 处理结果"
        
        return result
    
    def get_experiment_report(self, experiment_id: str) -> Dict:
        """获取实验报告"""
        return self.ab_framework.get_results(experiment_id)


# ============ 使用示例 ============

def demo_full_system():
    """演示完整系统"""
    
    system = ModelManagementSystem()
    system.initialize()
    
    print("=== 创建带 A/B 测试的 Prompt ===\n")
    
    # 创建 A/B 测试
    exp_id = system.create_prompt_with_ab_test(
        prompt_name="customer_support",
        control_template="回答用户问题: {question}",
        treatment_template="""你是一个专业客服助手。
请用友好、专业的语气回答用户问题。
用户问题: {question}""",
        variables=["question"],
        experiment_config={
            "hypothesis": "添加角色设定能提升用户满意度",
            "primary_metric": "satisfaction_score",
            "secondary_metrics": ["response_time", "clarity_score"],
            "min_sample_size": 200
        }
    )
    
    print(f"实验已创建: {exp_id}")
    
    # 模拟处理请求
    print("\n=== 处理用户请求 ===\n")
    
    for i in range(20):
        user_id = f"user_{i}"
        
        result = system.process_request(
            user_id=user_id,
            query=f"问题 {i}: 如何退款？",
            prompt_name="customer_support",
            experiment_id=exp_id,
            task_type="客服问答",
            complexity=4,
            require_quality=True
        )
        
        # 记录模拟指标
        satisfaction = 3.5 + (0.5 if result["decisions"].get("ab_test_variant") == "treatment" else 0)
        system.ab_framework.record_event(exp_id, user_id, "satisfaction_score", satisfaction)
        system.ab_framework.record_event(exp_id, user_id, "response_time", 1.2)
        
        if i < 5:
            print(f"用户 {user_id}:")
            print(f"  决策: {result['decisions']}")
            print(f"  模型: {result['selected_model']}")
            print(f"  Prompt: {result['final_prompt'][:50]}...")
            print()
    
    # 查看实验报告
    print("=== 实验报告 ===\n")
    report = system.get_experiment_report(exp_id)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    demo_full_system()
```

---

## 避坑指南

### 1. 多模型路由常见错误

| 错误 | 原因 | 解决方案 |
|-----|-----|---------|
| 路由决策过于简单 | 只考虑单一因素 | 综合成本、质量、延迟等多维度 |
| 模型配置硬编码 | 难以动态调整 | 使用配置中心或数据库管理 |
| 忽略模型可用性 | 调用失败模型 | 实现健康检查和故障转移 |
| 流量分配不均 | 哈希算法不当 | 使用一致性哈希确保均匀分布 |

### 2. Prompt 版本管理陷阱

- **版本混乱**: 没有规范的版本号体系 → 采用语义化版本
- **变更不可追溯**: 缺少变更记录 → 强制填写 change_log
- **回滚困难**: 没有版本快照 → 保存完整 Prompt 内容
- **性能数据缺失**: 未记录各版本指标 → 建立指标追踪

### 3. A/B 测试注意事项

- **样本量不足**: 过早下结论 → 设定最小样本量阈值
- **多重测试问题**: 同时进行多个实验 → 控制实验数量，避免干扰
- **指标选择不当**: 关注虚荣指标 → 选择核心业务指标
- **实验周期过短**: 未覆盖完整周期 → 确保至少一个完整业务周期

### 4. 灰度发布风险

- **监控缺失**: 无法及时发现问题 → 建立实时监控和告警
- **回滚缓慢**: 故障恢复时间长 → 实现一键回滚机制
- **阶段划分不合理**: 灰度过快或过慢 → 根据业务特点设计阶段
- **用户感知不一致**: 新旧版本差异过大 → 控制变更粒度

---

## 面试考点

### Q1: 多模型路由有哪些策略？如何选择？

**参考答案**:

多模型路由策略主要包括：

1. **成本优先策略**: 在满足基本质量要求下选择成本最低的模型，适合预算敏感场景
2. **质量优先策略**: 选择最高质量模型，适合关键业务场景
3. **延迟优先策略**: 选择响应最快的模型，适合实时交互场景
4. **混合策略**: 综合多个因素动态决策

选择策略时需要考虑：
- 业务场景特点（是否容忍延迟、质量要求）
- 成本预算约束
- 用户体验要求
- 模型能力差异

实际实现通常采用评分机制，为每个模型计算匹配分数，选择最高分模型。

### Q2: 如何设计 Prompt 版本管理系统？

**参考答案**:

Prompt 版本管理系统应包含以下核心组件：

1. **版本控制**: 使用语义化版本号（major.minor.patch），记录每次变更
2. **变更追踪**: 保存变更原因、时间、负责人，支持 diff 对比
3. **效果评估**: 记录各版本的性能指标（准确率、延迟、用户满意度）
4. **回滚机制**: 支持快速切换到历史版本
5. **审批流程**: 重要变更需要审核才能发布

技术实现要点：
- 使用数据库存储版本信息
- Prompt 内容使用哈希校验完整性
- 支持灰度发布和 A/B 测试集成
- 提供版本对比和性能分析工具

### Q3: A/B 测试的统计显著性如何判断？

**参考答案**:

判断 A/B 测试统计显著性需要：

1. **足够样本量**: 使用样本量计算公式，确保检验功效（power）≥ 80%
   ```
   n = 16 * σ² / δ²  (每组)
   ```
   其中 σ 是标准差，δ 是期望检测的最小差异

2. **显著性水平**: 通常设 α = 0.05，即 95% 置信度

3. **检验方法**: 
   - 连续指标（如转化率）: 双样本 t 检验
   - 比率指标（如点击率）: Z 检验
   - 计数指标: 卡方检验

4. **实际显著性**: 统计显著 ≠ 业务显著，需评估提升幅度是否有业务价值

5. **测试时长**: 至少覆盖一个完整的业务周期，避免时间偏差

### Q4: 灰度发布的最佳实践是什么？

**参考答案**:

灰度发布最佳实践：

1. **阶段设计**: 典型阶段为 1% → 5% → 10% → 25% → 50% → 100%
   - 初期小流量验证核心功能
   - 逐步扩大观察指标变化
   - 全量发布前确保稳定

2. **健康检查**: 实时监控关键指标
   - 错误率 < 阈值（如 1%）
   - P99 延迟 < 阈值（如 2s）
   - 业务指标无异常波动

3. **快速回滚**: 一键回滚机制，确保故障时能秒级恢复

4. **用户分群**: 
   - 内部用户/种子用户优先
   - 按用户属性分群（地域、设备）
   - 一致性哈希确保同一用户始终在同一版本

5. **数据对比**: 新旧版本并行运行时，对比核心指标差异

### Q5: 如何评估 LLM 应用的效果？

**参考答案**:

LLM 应用效果评估应包含多个维度：

**客观指标**:
- 准确率: 输出正确比例（需人工标注或自动验证）
- 延迟: P50/P95/P99 响应时间
- 成本: Token 消耗、API 调用费用
- 可用性: 成功率、错误率

**主观指标**:
- 相关性: 输出与问题的相关程度（人工评分 1-5）
- 连贯性: 逻辑流畅程度
- 有用性: 实际帮助程度（用户反馈）
- 安全性: 有害内容检测通过率

**业务指标**:
- 用户满意度（NPS/CSAT）
- 任务完成率
- 用户留存率
- 业务转化率

评估方法：
- 建立评估数据集和基准测试
- 结合自动评估和人工评估
- 持续监控线上指标
- 定期进行端到端评估

---

## 扩展阅读

- [LangChain Model Management](https://python.langchain.com/docs/modules/model_io/)
- [Weights & Biases Prompts](https://docs.wandb.ai/guides/prompts)
- [Google's A/B Testing Guide](https://developers.google.com/analytics/solutions/ab-testing)
- [Netflix Tech Blog: A/B Testing](https://netflixtechblog.com/tag/a-b-testing/)
- [LLM Evaluation Survey](https://arxiv.org/abs/2307.03109)

---

## 课后练习

1. **练习1**: 扩展 ModelRouter，添加基于用户画像的路由策略
2. **练习2**: 为 PromptVersionManager 添加审批工作流功能
3. **练习3**: 实现 A/B 测试的统计显著性计算模块
4. **练习4**: 设计并实现灰度发布的自动推进策略
5. **练习5**: 搭建完整的模型效果监控 Dashboard
