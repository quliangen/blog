# 构建项目 AI 基建指北

AI 辅助编程工具的普及带来了效率提升，但也伴随着上下文理解不足、生成代码不符合项目规范等问题。其根源在于缺乏系统性的上下文约束机制。

本文提供一套工程化解决方案：通过结构化配置（README + Rules + Skills），让 AI 深度理解项目上下文，从而生成符合团队规范的高质量代码。方案适用于 Cursor、Trae、GitHub Copilot 等主流 AI 编程工具。

---

## 一、维护项目 README

### 1.1 驱动 AI 分析项目

在 AI 编程工具中输入以下 Prompt(提示词)，让 AI 自动分析项目并生成 README

**场景 A：项目没有 README 或需要重写**

```
请分析当前项目的技术栈、目录结构、构建与运行方式、代码风格（如 TS/ESLint/格式化约定）。
根据分析结果，帮我补充或重写项目的 README.md，要求包含：
- 项目简介与技术栈
- 环境与安装、运行步骤
- 目录结构说明
- 开发/构建/测试等常用命令
```

**场景 B：项目已有 README 但需要完善**

```
根据当前代码库，帮我完善现有 README.md：
补全技术栈、目录说明、安装与运行步骤、常用脚本。
```

### 1.2 README 结构规范

若团队已有 README 模板，可直接让 AI 按模板输出（参考本博客的 [README 模板](/standard/readme-template)）。否则建议包含以下核心模块：

| 模块 | 内容要点 |
|------|----------|
| **项目简介** | 一句话描述业务场景 + 技术栈（框架、语言、包管理器） |
| **环境依赖** | Node.js/运行时版本、包管理器及版本约束 |
| **快速开始** | `install` → `dev` 的最小启动路径 |
| **常用脚本** | `build` / `test` / `lint` 等高频命令 |
| **目录结构** | 核心目录职责说明，降低新人上手成本 |

README 是 AI 理解项目的首要上下文，后续 Rules/Skills 的生成质量高度依赖其完整性。

---

## 二、自动生成 Rules 约束规则

Rules 是 AI 编程工具的文件级上下文约束，通过 `globs` 匹配特定文件类型或全局生效（`alwaysApply`），在代码生成阶段注入规范要求。

**常见 Rule 分类：**

| 类型 | 作用范围 | 典型场景 |
|------|----------|----------|
| **代码风格** | 语言级（`*.ts`、`*.vue`） | 命名规范、函数长度、注释要求 |
| **框架约定** | 框架文件（`*.tsx`、`*.vue`） | React Hooks 规则、组件组织方式 |
| **架构约束** | 全局（`alwaysApply: true`） | 目录结构、模块依赖方向、API 调用模式 |
| **安全规范** | 敏感文件（`*auth*`、`*config*`） | 密钥处理、输入校验、SQL 注入防护 |

基于项目 README 和现有代码，AI 可自动生成覆盖上述分类的可执行规则集。

### 2.1 驱动 AI 生成 Rules 的 Prompt

```
分析项目 README 和代码风格，在 <规则目录>/ 下自动生成 Rules。
```

AI 将基于项目上下文生成包含 `description`、`globs`、`alwaysApply` 的规则文件。生成后检查：description 是否明确触发场景、globs 是否精确、约束是否可执行。

### 2.3 Rules 技术规范

不同 AI 工具的规则格式存在差异，核心字段通用：

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 规则用途描述，影响 AI 触发优先级 |
| `globs` | string[] | 文件匹配模式（如 `**/*.ts`） |
| `alwaysApply` | boolean | 是否全局生效（与 globs 互斥） |

**规则分类策略**：
- **Global Rules**: `alwaysApply: true`，定义项目级底线约束
- **Scoped Rules**: `alwaysApply: false` + `globs`，针对特定文件类型的细化规范

---

## 三、自动生成 Skills 工作流

Skills 是可复用的 AI 工作流定义，将高频开发任务（如生成 commit message、代码审查）固化为标准操作程序（SOP）。基于项目 README 和技术栈，AI 可自动生成符合团队规范的 Skills。

### 3.1 存放策略

Skills 支持两级存储，需根据复用范围选择：

| 级别 | 适用场景 | Cursor 路径 | Trae 路径 |
|------|----------|-------------|-----------|
| **项目级** | 团队共享，随仓库版本控制 | `.cursor/skills/` | `.trae/skills/` |
| **用户级** | 个人跨项目复用 | `~/.cursor/skills/` | 参考 Trae 文档 |

> ⚠️ **注意**: Cursor 用户级 Skills 避免使用 `~/.cursor/skills-cursor/`，该目录为 Cursor 内置保留区。

### 3.2 驱动 AI 生成 Skills 的 Prompt

```
分析项目 README 和开发流程，在 <skills 目录>/ 下自动生成 Skills。
```

AI 将基于项目上下文生成包含 `name`、`description`、触发条件和执行步骤的 Skill 目录。生成后检查：`name` 是否规范、`description` 是否明确触发场景、步骤是否可执行。
[参考： 从“能用”到“会用”｜如何写好一个 Skill](https://mp.weixin.qq.com/s/Aa90V25Vtt1WtQ-6RrzcUQ?click_id=2)
### 3.3 Skills 技术规范

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `name` | string | 小写、短横线连接 | 唯一标识，如 `generate-api-client` |
| `description` | string | 第三人称 | 控制 AI 触发优先级，需明确"做什么 + 何时用" |
| `步骤列表` | markdown | 有序列表 | 原子化操作指令，避免模糊描述 |

---

## 四、实施检查清单

### 4.1 交付物验收标准

| 阶段 | 交付物 | 验收要点 |
|------|--------|----------|
| **Phase 1** | `README.md` | 技术栈明确、环境依赖完整、快速开始路径可用、目录结构清晰 |
| **Phase 2** | `<规则目录>/*` | Global Rules ≥ 1 条、Scoped Rules 覆盖主要文件类型、globs 匹配精确 |
| **Phase 3** | `<skills 目录>/*/` | name 符合规范、description 触发条件明确、步骤原子化可执行 |

### 4.2 各工具配置速查

| 工具 | Rules 路径 | Skills 路径（项目级） | Skills 路径（用户级） |
|------|------------|----------------------|----------------------|
| **Cursor** | `.cursor/rules/` | `.cursor/skills/` | `~/.cursor/skills/` |
| **Trae** | `.trae/rules/` | `.trae/skills/` | 参考官方文档 |
| **其他** | 参考官方文档 | 参考官方文档 | 参考官方文档 |

### 4.3 扩展资源

- [README 模板](/standard/readme-template)：可直接作为 Prompt 附件，指导 AI 按规范生成
- Rules 设计原则：约束要具体可验证，避免模糊描述（如"代码要优雅"→"使用函数式组件，hooks 按 useXxx 命名"）
- Skills 设计原则：步骤要原子化，每个步骤只完成一件事，复杂流程拆分为多个 Skill
