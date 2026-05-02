---
title: 24-项目二：AI 编程助手（CLI + Web）
description: 代码分析，CLI 工具，Web 界面
---

# 24-项目二：AI 编程助手（CLI + Web）

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 企业级开发能力 | ✅ 性能/安全/成本 |
| 工程化能力 | ✅ 监控/测试/部署 |
| 项目交付能力 | ✅ 完整项目实战 |
| 代码分析能力 | ✅ AST解析/静态分析 |
| Agent设计能力 | ✅ 多轮对话/上下文感知 |

## 学习目标

学完本节，你将能够：

1. **理解代码分析原理**：掌握AST解析、静态分析等核心技术
2. **开发CLI工具**：构建命令行AI编程助手
3. **构建Web界面**：使用React+Monaco Editor实现代码编辑器
4. **集成AI Agent**：实现代码解释、重构、Bug检测功能
5. **实现上下文感知**：支持多轮对话和代码上下文理解
6. **掌握性能优化**：Token优化、缓存策略、并发控制

## 前置知识

- 已完成前面章节的学习
- 具备基础 Agent 开发能力
- 熟悉JavaScript/Python基础语法
- 了解React前端开发

---

## 一、需求分析

### 1.1 功能需求

```
┌─────────────────────────────────────────────────────────┐
│                    AI 编程助手功能架构                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 代码解释  │  │ 重构建议  │  │ Bug检测  │  │ 文档生成 │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 测试生成  │  │ 代码补全  │  │ 性能分析  │  │ 安全扫描 │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 1.2 核心功能详解

#### 1.2.1 代码解释

```typescript
// 输入：复杂代码片段
async function processUserData(users: User[]): Promise<Result> {
  const validUsers = users
    .filter(u => u.age >= 18)
    .map(u => ({ ...u, status: 'active' }));
  
  return await batchUpdate(validUsers);
}

// AI输出：
/**
 * 功能说明：
 * 1. 筛选成年用户（age >= 18）
 * 2. 将用户状态设置为 'active'
 * 3. 批量更新到数据库
 * 
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
```

#### 1.2.2 重构建议

```typescript
// 原始代码（问题：嵌套过深，可读性差）
function getData() {
  fetch('/api/data')
    .then(res => {
      if (res.ok) {
        res.json().then(data => {
          if (data.success) {
            processData(data);
          }
        });
      }
    });
}

// AI重构建议：
async function getData() {
  const res = await fetch('/api/data');
  if (!res.ok) return;
  
  const data = await res.json();
  if (data.success) {
    processData(data);
  }
}
```

#### 1.2.3 Bug检测

```typescript
// 输入代码
function calculateDiscount(price, discount) {
  return price - (price * discount / 100);
}

// AI检测到的Bug：
/**
 * ⚠️ 潜在问题：
 * 1. 缺少参数类型检查（price/discount可能为负数）
 * 2. 缺少边界检查（discount > 100会导致负价格）
 * 3. 浮点数精度问题
 * 
 * 修复建议：
 */
function calculateDiscount(price: number, discount: number): number {
  if (price < 0 || discount < 0) {
    throw new Error('Price and discount must be positive');
  }
  if (discount > 100) {
    throw new Error('Discount cannot exceed 100%');
  }
  return Math.round((price - (price * discount / 100)) * 100) / 100;
}
```

---

## 二、技术方案

### 2.1 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│                      AI 编程助手架构                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   CLI 层    │    │   Web 层    │    │  VS Code    │      │
│  │  (Node.js)  │    │  (React)    │    │   插件      │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                 API Gateway                         │     │
│  │           (统一接口/认证/限流)                       │     │
│  └─────────────────────────┬───────────────────────────┘     │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                 Core Service                        │     │
│  ├─────────────────────────────────────────────────────┤     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │     │
│  │  │ AST解析器 │  │ 代码分析器 │  │ Agent引擎 │          │     │
│  │  └──────────┘  └──────────┘  └──────────┘          │     │
│  └─────────────────────────┬───────────────────────────┘     │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              LLM Provider (OpenAI/Claude)           │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 AST解析技术

#### 2.2.1 JavaScript/TypeScript AST解析

```typescript
// 使用 @babel/parser 解析代码
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

interface CodeAnalysis {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  complexity: number;
}

class ASTAnalyzer {
  private parserOptions = {
    sourceType: 'module' as const,
    plugins: ['typescript', 'jsx', 'decorators-legacy'],
  };

  analyze(code: string): CodeAnalysis {
    const ast = parse(code, this.parserOptions);
    const analysis: CodeAnalysis = {
      functions: [],
      classes: [],
      imports: [],
      complexity: 0,
    };

    traverse(ast, {
      // 提取函数信息
      FunctionDeclaration(path) {
        analysis.functions.push({
          name: path.node.id?.name || 'anonymous',
          params: path.node.params.map(p => (p as any).name),
          loc: path.node.loc,
        });
      },
      // 计算圈复杂度
      'IfStatement|SwitchCase|ConditionalExpression|LogicalExpression'(path) {
        analysis.complexity++;
      },
    });

    return analysis;
  }

  // 提取代码结构用于LLM上下文
  extractContext(code: string, line: number): string {
    const ast = parse(code, this.parserOptions);
    let context = '';

    traverse(ast, {
      FunctionDeclaration(path) {
        const { start, end } = path.node.loc || {};
        if (start && end && start.line <= line && end.line >= line) {
          context = code.slice(
            (path.node as any).start,
            (path.node as any).end
          );
        }
      },
    });

    return context;
  }
}
```

#### 2.2.2 Python AST解析

```python
import ast
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class FunctionInfo:
    name: str
    args: List[str]
    line_start: int
    line_end: int
    docstring: Optional[str]

class PythonAnalyzer:
    def analyze(self, code: str) -> dict:
        tree = ast.parse(code)
        analysis = {
            'functions': [],
            'classes': [],
            'imports': [],
            'complexity': 0
        }
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                analysis['functions'].append(FunctionInfo(
                    name=node.name,
                    args=[arg.arg for arg in node.args.args],
                    line_start=node.lineno,
                    line_end=node.end_lineno or node.lineno,
                    docstring=ast.get_docstring(node)
                ))
            elif isinstance(node, (ast.If, ast.While, ast.For)):
                analysis['complexity'] += 1
                
        return analysis
    
    def extract_function_at_line(self, code: str, line: int) -> Optional[str]:
        """提取指定行所在的函数代码"""
        tree = ast.parse(code)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                if node.lineno <= line <= (node.end_lineno or node.lineno):
                    lines = code.split('\n')
                    return '\n'.join(lines[node.lineno-1:node.end_lineno])
        return None
```

### 2.3 Agent设计

#### 2.3.1 Agent架构

```typescript
interface AgentContext {
  sessionId: string;
  messages: Message[];
  codeContext?: CodeContext;
  projectContext?: ProjectContext;
}

interface CodeContext {
  currentFile: string;
  selectedCode: string;
  cursorPosition: Position;
  fileStructure: FileNode[];
}

class CodeAssistantAgent {
  private llm: LLMProvider;
  private astAnalyzer: ASTAnalyzer;
  private contextManager: ContextManager;

  constructor(config: AgentConfig) {
    this.llm = new OpenAIProvider(config.apiKey);
    this.astAnalyzer = new ASTAnalyzer();
    this.contextManager = new ContextManager();
  }

  // 代码解释
  async explainCode(
    code: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // 1. AST分析提取关键信息
    const analysis = this.astAnalyzer.analyze(code);
    
    // 2. 构建Prompt
    const prompt = this.buildExplainPrompt(code, analysis);
    
    // 3. 调用LLM
    const response = await this.llm.chat({
      messages: [
        ...this.contextManager.getHistory(context.sessionId),
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    // 4. 保存上下文
    this.contextManager.addMessage(context.sessionId, {
      role: 'assistant',
      content: response.content,
    });

    return {
      content: response.content,
      suggestions: this.parseSuggestions(response.content),
    };
  }

  // 重构建议
  async suggestRefactoring(
    code: string,
    context: AgentContext
  ): Promise<RefactoringSuggestion[]> {
    const analysis = this.astAnalyzer.analyze(code);
    
    const prompt = `Analyze the following code and suggest refactoring improvements.
    
Code:
\`\`\`${context.codeContext?.currentFile?.endsWith('.ts') ? 'typescript' : 'javascript'}
${code}
\`\`\`

Code Metrics:
- Cyclomatic Complexity: ${analysis.complexity}
- Function Count: ${analysis.functions.length}

Provide refactoring suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "extract-function|rename-variable|simplify-condition",
      "description": "...",
      "originalCode": "...",
      "refactoredCode": "...",
      "benefits": ["..."]
    }
  ]
}`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    return this.parseRefactoringSuggestions(response.content);
  }

  // Bug检测
  async detectBugs(
    code: string,
    context: AgentContext
  ): Promise<BugReport[]> {
    const prompt = `Review the following code for potential bugs and issues.

Code:
\`\`\`
${code}
\`\`\`

Check for:
1. Null/undefined references
2. Type mismatches
3. Logic errors
4. Performance issues
5. Security vulnerabilities

Report issues in JSON format:
{
  "issues": [
    {
      "severity": "high|medium|low",
      "type": "null-reference|type-error|logic-error",
      "line": 5,
      "description": "...",
      "fix": "..."
    }
  ]
}`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    return this.parseBugReports(response.content);
  }

  private buildExplainPrompt(code: string, analysis: CodeAnalysis): string {
    return `Explain the following code in detail:

Code:
\`\`\`
${code}
\`\`\`

Analysis:
- Functions: ${analysis.functions.map(f => f.name).join(', ')}
- Complexity: ${analysis.complexity}

Please explain:
1. What this code does
2. Key functions and their purposes
3. Data flow
4. Time/space complexity
5. Potential edge cases`;
  }
}
```

#### 2.3.2 上下文管理

```typescript
class ContextManager {
  private sessions: Map<string, SessionContext> = new Map();
  private maxHistoryLength = 10;
  private maxTokensPerSession = 4000;

  createSession(sessionId: string): void {
    this.sessions.set(sessionId, {
      messages: [],
      codeSnapshots: new Map(),
      tokenCount: 0,
    });
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 管理历史长度
    if (session.messages.length >= this.maxHistoryLength) {
      session.messages.shift();
    }

    session.messages.push(message);
    session.tokenCount += this.estimateTokens(message.content);

    // Token超限处理
    if (session.tokenCount > this.maxTokensPerSession) {
      this.compressHistory(sessionId);
    }
  }

  // 智能上下文压缩
  private compressHistory(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 保留关键消息（系统提示、代码上下文）
    const criticalIndices = [0]; // 系统消息
    
    // 压缩旧的用户-助手对话
    const compressedMessages: Message[] = [];
    for (let i = 1; i < session.messages.length; i++) {
      if (criticalIndices.includes(i) || i > session.messages.length - 4) {
        compressedMessages.push(session.messages[i]);
      }
    }

    // 添加摘要
    const summary = this.summarizeMessages(
      session.messages.slice(1, -3)
    );
    compressedMessages.splice(1, 0, {
      role: 'system',
      content: `[Conversation Summary]: ${summary}`,
    });

    session.messages = compressedMessages;
    session.tokenCount = this.calculateTotalTokens(compressedMessages);
  }

  private summarizeMessages(messages: Message[]): string {
    // 使用LLM或启发式方法生成摘要
    const topics = new Set<string>();
    messages.forEach(m => {
      if (m.content.includes('explain')) topics.add('code explanation');
      if (m.content.includes('refactor')) topics.add('refactoring');
      if (m.content.includes('bug')) topics.add('bug detection');
    });
    return `Discussed: ${Array.from(topics).join(', ')}`;
  }

  getHistory(sessionId: string): Message[] {
    return this.sessions.get(sessionId)?.messages || [];
  }

  private estimateTokens(text: string): number {
    // 粗略估计：1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
```

---

## 三、CLI工具实现（Node.js）

### 3.1 项目结构

```
ai-code-assistant-cli/
├── src/
│   ├── commands/
│   │   ├── explain.ts      # 代码解释命令
│   │   ├── refactor.ts     # 重构建议命令
│   │   ├── detect.ts       # Bug检测命令
│   │   └── chat.ts         # 交互式对话
│   ├── core/
│   │   ├── analyzer.ts     # AST分析器
│   │   ├── agent.ts        # Agent核心
│   │   └── context.ts      # 上下文管理
│   ├── utils/
│   │   ├── file.ts         # 文件操作
│   │   └── prompt.ts       # Prompt构建
│   └── index.ts            # CLI入口
├── bin/
│   └── aica                # 可执行文件
├── package.json
└── tsconfig.json
```

### 3.2 核心代码实现

```typescript
// src/index.ts
#!/usr/bin/env node
import { Command } from 'commander';
import { explainCommand } from './commands/explain';
import { refactorCommand } from './commands/refactor';
import { detectCommand } from './commands/detect';
import { chatCommand } from './commands/chat';

const program = new Command();

program
  .name('aica')
  .description('AI Code Assistant - Your intelligent programming companion')
  .version('1.0.0');

// 代码解释命令
program
  .command('explain')
  .description('Explain code in a file or from stdin')
  .argument('[file]', 'file to analyze')
  .option('-l, --line <number>', 'specific line number')
  .option('-f, --function <name>', 'specific function name')
  .action(explainCommand);

// 重构建议命令
program
  .command('refactor')
  .description('Get refactoring suggestions')
  .argument('<file>', 'file to refactor')
  .option('-s, --strategy <type>', 'refactoring strategy', 'all')
  .action(refactorCommand);

// Bug检测命令
program
  .command('detect')
  .description('Detect bugs and issues')
  .argument('<file>', 'file to analyze')
  .option('-o, --output <format>', 'output format', 'table')
  .action(detectCommand);

// 交互式对话
program
  .command('chat')
  .description('Start interactive chat session')
  .option('-p, --project <path>', 'project context path')
  .action(chatCommand);

program.parse();
```

```typescript
// src/commands/explain.ts
import fs from 'fs/promises';
import chalk from 'chalk';
import { CodeAssistantAgent } from '../core/agent';
import { ASTAnalyzer } from '../core/analyzer';
import { loadConfig } from '../utils/config';

interface ExplainOptions {
  line?: string;
  function?: string;
}

export async function explainCommand(
  file: string | undefined,
  options: ExplainOptions
): Promise<void> {
  try {
    // 读取代码
    let code: string;
    if (file) {
      code = await fs.readFile(file, 'utf-8');
    } else {
      // 从stdin读取
      code = await readStdin();
    }

    // 提取特定范围代码
    if (options.line) {
      const lineNum = parseInt(options.line);
      const analyzer = new ASTAnalyzer();
      code = analyzer.extractContext(code, lineNum) || code;
    }

    // 初始化Agent
    const config = await loadConfig();
    const agent = new CodeAssistantAgent(config);

    console.log(chalk.blue('🔍 Analyzing code...\n'));

    // 调用Agent解释
    const response = await agent.explainCode(code, {
      sessionId: generateSessionId(),
      messages: [],
      codeContext: {
        currentFile: file || 'stdin',
        selectedCode: code,
      },
    });

    // 输出结果
    console.log(chalk.green('📖 Explanation:\n'));
    console.log(response.content);

    if (response.suggestions?.length > 0) {
      console.log(chalk.yellow('\n💡 Suggestions:'));
      response.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function generateSessionId(): string {
  return `cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

```typescript
// src/commands/detect.ts
import fs from 'fs/promises';
import chalk from 'chalk';
import Table from 'cli-table3';
import { CodeAssistantAgent } from '../core/agent';
import { loadConfig } from '../utils/config';

interface DetectOptions {
  output: string;
}

export async function detectCommand(
  file: string,
  options: DetectOptions
): Promise<void> {
  const code = await fs.readFile(file, 'utf-8');
  const config = await loadConfig();
  const agent = new CodeAssistantAgent(config);

  console.log(chalk.blue('🔍 Scanning for bugs and issues...\n'));

  const bugs = await agent.detectBugs(code, {
    sessionId: generateSessionId(),
    messages: [],
    codeContext: { currentFile: file, selectedCode: code },
  });

  if (bugs.length === 0) {
    console.log(chalk.green('✅ No issues found!'));
    return;
  }

  // 按严重程度分组
  const grouped = bugs.reduce((acc, bug) => {
    acc[bug.severity] = acc[bug.severity] || [];
    acc[bug.severity].push(bug);
    return acc;
  }, {} as Record<string, BugReport[]>);

  // 输出结果
  if (options.output === 'table') {
    const table = new Table({
      head: ['Severity', 'Type', 'Line', 'Description', 'Fix'],
      colWidths: [10, 15, 8, 40, 30],
    });

    bugs.forEach(bug => {
      table.push([
        colorSeverity(bug.severity),
        bug.type,
        bug.line,
        bug.description.substring(0, 37) + '...',
        bug.fix?.substring(0, 27) + '...' || 'N/A',
      ]);
    });

    console.log(table.toString());
  } else {
    console.log(JSON.stringify(bugs, null, 2));
  }

  // 统计
  const high = grouped['high']?.length || 0;
  const medium = grouped['medium']?.length || 0;
  const low = grouped['low']?.length || 0;

  console.log(chalk.red(`\n⚠️  Found ${bugs.length} issues:`));
  console.log(`  High: ${high} | Medium: ${medium} | Low: ${low}`);
}

function colorSeverity(severity: string): string {
  switch (severity) {
    case 'high': return chalk.red('HIGH');
    case 'medium': return chalk.yellow('MEDIUM');
    case 'low': return chalk.blue('LOW');
    default: return severity;
  }
}
```

```typescript
// src/commands/chat.ts
import readline from 'readline';
import chalk from 'chalk';
import { CodeAssistantAgent } from '../core/agent';
import { loadConfig } from '../utils/config';
import { scanProject } from '../utils/file';

interface ChatOptions {
  project?: string;
}

export async function chatCommand(options: ChatOptions): Promise<void> {
  const config = await loadConfig();
  const agent = new CodeAssistantAgent(config);
  const sessionId = `chat-${Date.now()}`;

  let projectContext: ProjectContext | undefined;
  if (options.project) {
    console.log(chalk.blue('📁 Scanning project...'));
    projectContext = await scanProject(options.project);
    console.log(chalk.green(`Found ${projectContext.files.length} files\n`));
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('aica> '),
  });

  console.log(chalk.green('🤖 AI Code Assistant Chat'));
  console.log(chalk.gray('Type "/help" for commands, "/quit" to exit\n'));

  rl.prompt();

  rl.on('line', async (input) => {
    const command = input.trim();

    if (command === '/quit') {
      console.log(chalk.yellow('Goodbye!'));
      rl.close();
      return;
    }

    if (command === '/help') {
      showHelp();
      rl.prompt();
      return;
    }

    if (command.startsWith('/explain ')) {
      const file = command.slice(9);
      await handleExplain(file, agent, sessionId, projectContext);
    } else if (command.startsWith('/file ')) {
      const file = command.slice(6);
      await handleFileContext(file, sessionId, projectContext);
    } else {
      // 普通对话
      await handleChat(command, agent, sessionId, projectContext);
    }

    rl.prompt();
  });
}

async function handleChat(
  input: string,
  agent: CodeAssistantAgent,
  sessionId: string,
  projectContext?: ProjectContext
): Promise<void> {
  const spinner = startSpinner('Thinking...');
  
  try {
    const response = await agent.chat(input, {
      sessionId,
      messages: [],
      projectContext,
    });
    
    stopSpinner(spinner);
    console.log(chalk.green('\n🤖:'), response.content);
  } catch (error) {
    stopSpinner(spinner);
    console.error(chalk.red('Error:'), error.message);
  }
}

function showHelp(): void {
  console.log(chalk.yellow('\nAvailable commands:'));
  console.log('  /explain <file>  - Explain a file');
  console.log('  /file <file>     - Load file context');
  console.log('  /clear           - Clear conversation');
  console.log('  /help            - Show this help');
  console.log('  /quit            - Exit\n');
}
```

### 3.3 package.json

```json
{
  "name": "ai-code-assistant-cli",
  "version": "1.0.0",
  "description": "AI-powered code assistant CLI",
  "main": "dist/index.js",
  "bin": {
    "aica": "./bin/aica"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "lint": "eslint src/**/*.ts",
    "test": "jest"
  },
  "dependencies": {
    "@babel/parser": "^7.23.0",
    "@babel/traverse": "^7.23.0",
    "commander": "^11.0.0",
    "chalk": "^4.1.2",
    "cli-table3": "^0.6.3",
    "openai": "^4.0.0",
    "ora": "^5.4.1"
  },
  "devDependencies": {
    "@types/babel__traverse": "^7.20.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

---

## 四、Web界面实现（React + Monaco Editor）

### 4.1 项目结构

```
ai-code-assistant-web/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── MonacoEditor.tsx    # Monaco编辑器封装
│   │   │   └── CodeHighlight.tsx   # 代码高亮
│   │   ├── Chat/
│   │   │   ├── ChatPanel.tsx       # 聊天面板
│   │   │   ├── MessageList.tsx     # 消息列表
│   │   │   └── CodeBlock.tsx       # 代码块渲染
│   │   ├── Sidebar/
│   │   │   ├── FileTree.tsx        # 文件树
│   │   │   └── ProjectOverview.tsx # 项目概览
│   │   └── Toolbar/
│   │       ├── ActionButtons.tsx   # 操作按钮
│   │       └── ModelSelector.tsx   # 模型选择
│   ├── hooks/
│   │   ├── useAgent.ts             # Agent交互Hook
│   │   ├── useCodeAnalysis.ts      # 代码分析Hook
│   │   └── useWebSocket.ts         # WebSocket连接
│   ├── services/
│   │   ├── agent.service.ts        # Agent服务
│   │   ├── file.service.ts         # 文件服务
│   │   └── websocket.service.ts    # WebSocket服务
│   ├── store/
│   │   ├── editor.store.ts         # 编辑器状态
│   │   ├── chat.store.ts           # 聊天状态
│   │   └── project.store.ts        # 项目状态
│   ├── types/
│   │   └── index.ts                # 类型定义
│   ├── utils/
│   │   ├── ast.ts                  # AST工具
│   │   └── prompt.ts               # Prompt工具
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 4.2 核心组件实现

```typescript
// src/components/Editor/MonacoEditor.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../../store/editor.store';

interface MonacoEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  onSelect?: (selection: Selection) => void;
}

interface Selection {
  text: string;
  startLine: number;
  endLine: number;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language = 'typescript',
  onChange,
  onSelect,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { setEditor, addDecoration } = useEditorStore();

  // 编辑器挂载
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditor(editor);

    // 配置TypeScript
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution:
        monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    // 添加右键菜单
    editor.addAction({
      id: 'explain-code',
      label: '🤖 Explain Code',
      contextMenuGroupId: '9_cutcopypaste',
      run: () => {
        const selection = editor.getSelection();
        if (selection) {
          const model = editor.getModel();
          if (model) {
            const text = model.getValueInRange(selection);
            onSelect?.({
              text,
              startLine: selection.startLineNumber,
              endLine: selection.endLineNumber,
            });
          }
        }
      },
    });

    // 快捷键
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE,
      () => {
        const selection = editor.getSelection();
        if (selection && onSelect) {
          const model = editor.getModel();
          if (model) {
            const text = model.getValueInRange(selection);
            onSelect({
              text,
              startLine: selection.startLineNumber,
              endLine: selection.endLineNumber,
            });
          }
        }
      }
    );
  };

  // 高亮代码行
  const highlightLines = useCallback(
    (lines: number[], type: 'error' | 'warning' | 'info') => {
      if (!editorRef.current) return;

      const decorations = lines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: `line-highlight-${type}`,
          glyphMarginClassName: `glyph-${type}`,
        },
      }));

      addDecoration(decorations);
    },
    [addDecoration]
  );

  return (
    <div className="editor-container h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          glyphMargin: true,
          folding: true,
          renderWhitespace: 'selection',
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
};
```

```typescript
// src/components/Chat/ChatPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { useAgent } from '../../hooks/useAgent';
import { useChatStore } from '../../store/chat.store';
import { Message } from '../../types';

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, addMessage } = useChatStore();
  const { sendMessage, explainSelection, refactorSelection, detectIssues } =
    useAgent();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');

    try {
      const response = await sendMessage(input);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
      });
    } catch (error) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date(),
      });
    }
  };

  const handleQuickAction = async (action: string, code: string) => {
    let response;
    switch (action) {
      case 'explain':
        response = await explainSelection(code);
        break;
      case 'refactor':
        response = await refactorSelection(code);
        break;
      case 'detect':
        response = await detectIssues(code);
        break;
      default:
        return;
    }

    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      codeBlocks: response.codeBlocks,
    });
  };

  return (
    <div className="chat-panel flex flex-col h-full bg-gray-50">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList
          messages={messages}
          onQuickAction={handleQuickAction}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷操作 */}
      <div className="quick-actions px-4 py-2 border-t bg-white">
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickAction('explain', getSelectedCode())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Explain
          </button>
          <button
            onClick={() => handleQuickAction('refactor', getSelectedCode())}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Refactor
          </button>
          <button
            onClick={() => handleQuickAction('detect', getSelectedCode())}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Detect Bugs
          </button>
        </div>
      </div>

      {/* 输入框 */}
      <div className="input-area p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your code... (Shift+Enter for new line)"
            className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

```typescript
// src/hooks/useAgent.ts
import { useCallback } from 'react';
import { AgentService } from '../services/agent.service';
import { useEditorStore } from '../store/editor.store';
import { useChatStore } from '../store/chat.store';

const agentService = new AgentService();

export const useAgent = () => {
  const { currentFile, selectedCode } = useEditorStore();
  const { sessionId } = useChatStore();

  const sendMessage = useCallback(
    async (message: string) => {
      return agentService.chat({
        sessionId,
        message,
        codeContext: selectedCode
          ? {
              code: selectedCode.text,
              fileName: currentFile?.name,
              language: currentFile?.language,
            }
          : undefined,
      });
    },
    [sessionId, selectedCode, currentFile]
  );

  const explainSelection = useCallback(
    async (code: string) => {
      return agentService.explain({
        sessionId,
        code,
        fileName: currentFile?.name,
      });
    },
    [sessionId, currentFile]
  );

  const refactorSelection = useCallback(
    async (code: string) => {
      return agentService.refactor({
        sessionId,
        code,
        strategy: 'all',
      });
    },
    [sessionId]
  );

  const detectIssues = useCallback(
    async (code: string) => {
      return agentService.detect({
        sessionId,
        code,
      });
    },
    [sessionId]
  );

  return {
    sendMessage,
    explainSelection,
    refactorSelection,
    detectIssues,
  };
};
```

```typescript
// src/services/agent.service.ts
import { API_BASE_URL } from '../config';

interface ChatRequest {
  sessionId: string;
  message: string;
  codeContext?: {
    code: string;
    fileName?: string;
    language?: string;
  };
}

interface ExplainRequest {
  sessionId: string;
  code: string;
  fileName?: string;
}

interface RefactorRequest {
  sessionId: string;
  code: string;
  strategy: string;
}

interface DetectRequest {
  sessionId: string;
  code: string;
}

export class AgentService {
  private baseUrl = API_BASE_URL;

  async chat(request: ChatRequest) {
    const response = await fetch(`${this.baseUrl}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  async explain(request: ExplainRequest) {
    const response = await fetch(`${this.baseUrl}/agent/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  async refactor(request: RefactorRequest) {
    const response = await fetch(`${this.baseUrl}/agent/refactor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  async detect(request: DetectRequest) {
    const response = await fetch(`${this.baseUrl}/agent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }
}
```

### 4.3 主应用组件

```typescript
// src/App.tsx
import React, { useState } from 'react';
import { MonacoEditor } from './components/Editor/MonacoEditor';
import { ChatPanel } from './components/Chat/ChatPanel';
import { FileTree } from './components/Sidebar/FileTree';
import { Toolbar } from './components/Toolbar/ActionButtons';
import { useEditorStore } from './store/editor.store';
import './App.css';

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [chatWidth, setChatWidth] = useState(400);
  const { currentFile, setCurrentFile, selectedCode, setSelectedCode } =
    useEditorStore();

  const handleFileSelect = (file: FileNode) => {
    setCurrentFile(file);
  };

  const handleCodeSelect = (selection: Selection) => {
    setSelectedCode(selection);
  };

  return (
    <div className="app h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <Toolbar />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文件树 */}
        <div
          className="sidebar bg-gray-900 text-white overflow-auto"
          style={{ width: sidebarWidth }}
        >
          <FileTree onSelect={handleFileSelect} />
        </div>

        {/* 拖拽调整条 */}
        <div
          className="resize-bar w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500"
          onMouseDown={(e) => handleResize(e, setSidebarWidth)}
        />

        {/* 中间编辑器 */}
        <div className="editor flex-1">
          {currentFile ? (
            <MonacoEditor
              value={currentFile.content}
              language={currentFile.language}
              onChange={(value) => {
                setCurrentFile({ ...currentFile, content: value || '' });
              }}
              onSelect={handleCodeSelect}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a file to start
            </div>
          )}
        </div>

        {/* 拖拽调整条 */}
        <div
          className="resize-bar w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500"
          onMouseDown={(e) => handleResize(e, setChatWidth)}
        />

        {/* 右侧聊天面板 */}
        <div
          className="chat-panel border-l"
          style={{ width: chatWidth }}
        >
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

function handleResize(
  e: React.MouseEvent,
  setWidth: (width: number) => void
) {
  const startX = e.clientX;
  const startWidth = (e.target as HTMLElement).parentElement?.clientWidth || 0;

  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX;
    setWidth(Math.max(200, Math.min(500, startWidth + diff)));
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

export default App;
```

### 4.4 package.json

```json
{
  "name": "ai-code-assistant-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.44.0",
    "zustand": "^4.4.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "lucide-react": "^0.292.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
}
```

---

## 五、VS Code 插件基础

### 5.1 插件结构

```
ai-code-assistant-vscode/
├── src/
│   ├── extension.ts          # 插件入口
│   ├── commands/
│   │   ├── explain.ts        # 解释命令
│   │   ├── refactor.ts       # 重构命令
│   │   └── detect.ts         # 检测命令
│   ├── providers/
│   │   ├── inlineCompletion.ts  # 内联补全
│   │   └── codeAction.ts        # 代码操作
│   ├── services/
│   │   └── agent.service.ts  # Agent服务
│   └── utils/
│       └── editor.ts         # 编辑器工具
├── package.json              # 插件配置
└── tsconfig.json
```

### 5.2 核心实现

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { ExplainCommand } from './commands/explain';
import { RefactorCommand } from './commands/refactor';
import { DetectCommand } from './commands/detect';
import { InlineCompletionProvider } from './providers/inlineCompletion';
import { CodeActionProvider } from './providers/codeAction';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Code Assistant is now active!');

  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'aica.explain',
      () => ExplainCommand.run()
    ),
    vscode.commands.registerCommand(
      'aica.refactor',
      () => RefactorCommand.run()
    ),
    vscode.commands.registerCommand(
      'aica.detect',
      () => DetectCommand.run()
    )
  );

  // 注册内联补全
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      new InlineCompletionProvider()
    )
  );

  // 注册代码操作
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: '**' },
      new CodeActionProvider(),
      {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.Refactor,
        ],
      }
    )
  );

  // 注册侧边栏
  const treeDataProvider = new ChatTreeDataProvider();
  vscode.window.registerTreeDataProvider('aicaChat', treeDataProvider);
}

export function deactivate() {}
```

```typescript
// src/commands/explain.ts
import * as vscode from 'vscode';
import { AgentService } from '../services/agent.service';

export class ExplainCommand {
  static async run() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
      vscode.window.showWarningMessage('Please select some code first');
      return;
    }

    // 显示进度
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing code...',
        cancellable: false,
      },
      async () => {
        try {
          const agent = new AgentService();
          const explanation = await agent.explain({
            code: selectedText,
            language: editor.document.languageId,
          });

          // 显示结果在Webview面板
          const panel = vscode.window.createWebviewPanel(
            'aicaExplanation',
            'Code Explanation',
            vscode.ViewColumn.Beside,
            {}
          );

          panel.webview.html = getExplanationHtml(explanation);
        } catch (error) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      }
    );
  }
}

function getExplanationHtml(explanation: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h2>Code Explanation</h2>
      <div>${explanation}</div>
    </body>
    </html>
  `;
}
```

```typescript
// src/providers/inlineCompletion.ts
import * as vscode from 'vscode';
import { AgentService } from '../services/agent.service';

export class InlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private agent = new AgentService();
  private debounceTimer: NodeJS.Timeout | null = null;

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    // Debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          const linePrefix = document
            .lineAt(position)
            .text.substr(0, position.character);

          // 获取上下文
          const contextCode = this.getContext(document, position);

          const completion = await this.agent.complete({
            prefix: linePrefix,
            context: contextCode,
            language: document.languageId,
          });

          if (completion) {
            resolve([
              new vscode.InlineCompletionItem(
                completion,
                new vscode.Range(position, position)
              ),
            ]);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      }, 300);
    });
  }

  private getContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ): string {
    const startLine = Math.max(0, position.line - 50);
    const endLine = position.line;
    const range = new vscode.Range(startLine, 0, endLine, position.character);
    return document.getText(range);
  }
}
```

```json
// package.json
{
  "name": "ai-code-assistant",
  "displayName": "AI Code Assistant",
  "description": "AI-powered code assistant for VS Code",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Machine Learning", "Snippets", "Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "aica.explain",
        "title": "Explain Code",
        "category": "AICA"
      },
      {
        "command": "aica.refactor",
        "title": "Refactor Code",
        "category": "AICA"
      },
      {
        "command": "aica.detect",
        "title": "Detect Issues",
        "category": "AICA"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "aica.explain",
          "group": "9_cutcopypaste@5",
          "when": "editorHasSelection"
        },
        {
          "command": "aica.refactor",
          "group": "9_cutcopypaste@6",
          "when": "editorHasSelection"
        }
      ]
    },
    "keybindings": [
      {
        "command": "aica.explain",
        "key": "ctrl+shift+e",
        "mac": "cmd+shift+e",
        "when": "editorHasSelection"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "aicaChat",
          "name": "AI Assistant"
        }
      ]
    },
    "configuration": {
      "title": "AI Code Assistant",
      "properties": {
        "aica.apiKey": {
          "type": "string",
          "default": "",
          "description": "API Key for AI service"
        },
        "aica.model": {
          "type": "string",
          "default": "gpt-4",
          "enum": ["gpt-4", "gpt-3.5-turbo", "claude-3"],
          "description": "AI Model to use"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 六、上下文感知与多轮对话

### 6.1 上下文架构

```
┌─────────────────────────────────────────────────────────────┐
│                     上下文层次结构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 4: 项目上下文 (Project Context)                       │
│  ├── 文件结构                                                │
│  ├── 依赖关系                                                │
│  ├── 配置文件                                                │
│  └── 代码规范                                                │
│                                                             │
│  Layer 3: 文件上下文 (File Context)                          │
│  ├── 导入/导出                                               │
│  ├── 类/函数定义                                             │
│  ├── 类型定义                                                │
│  └── 注释文档                                                │
│                                                             │
│  Layer 2: 代码上下文 (Code Context)                          │
│  ├── 当前函数                                                │
│  ├── 相关变量                                                │
│  ├── 调用链                                                  │
│  └── 选中代码                                                │
│                                                             │
│  Layer 1: 对话上下文 (Conversation Context)                  │
│  ├── 历史消息                                                │
│  ├── 用户偏好                                                │
│  └── 会话状态                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 上下文收集实现

```typescript
// src/core/context/ProjectContext.ts
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

interface ProjectContext {
  fileStructure: FileNode[];
  dependencies: DependencyGraph;
  entryPoints: string[];
  configFiles: ConfigFile[];
  codeStats: CodeStatistics;
}

class ProjectContextCollector {
  async collect(projectPath: string): Promise<ProjectContext> {
    const [fileStructure, dependencies, configFiles] = await Promise.all([
      this.scanFileStructure(projectPath),
      this.buildDependencyGraph(projectPath),
      this.readConfigFiles(projectPath),
    ]);

    return {
      fileStructure,
      dependencies,
      entryPoints: this.findEntryPoints(fileStructure),
      configFiles,
      codeStats: await this.calculateStats(projectPath),
    };
  }

  private async scanFileStructure(projectPath: string): Promise<FileNode[]> {
    const files = await glob('**/*.{js,ts,jsx,tsx}', {
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    const tree: FileNode[] = [];
    for (const file of files.slice(0, 100)) {
      // 限制文件数量
      const content = await readFile(`${projectPath}/${file}`, 'utf-8');
      const summary = this.summarizeFile(content);

      tree.push({
        path: file,
        type: 'file',
        summary,
        size: content.length,
      });
    }

    return tree;
  }

  private summarizeFile(content: string): FileSummary {
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      const summary: FileSummary = {
        exports: [],
        imports: [],
        functions: [],
        classes: [],
      };

      traverse(ast, {
        ExportNamedDeclaration(path) {
          const name = path.node.declaration
            ? (path.node.declaration as any).id?.name
            : path.node.source?.value;
          if (name) summary.exports.push(name);
        },
        ImportDeclaration(path) {
          summary.imports.push({
            source: path.node.source.value,
            names: path.node.specifiers.map((s) => s.local.name),
          });
        },
        FunctionDeclaration(path) {
          summary.functions.push({
            name: path.node.id?.name || 'anonymous',
            params: path.node.params.length,
          });
        },
        ClassDeclaration(path) {
          summary.classes.push({
            name: path.node.id?.name,
            methods: path.node.body.body.length,
          });
        },
      });

      return summary;
    } catch {
      return { exports: [], imports: [], functions: [], classes: [] };
    }
  }

  private async buildDependencyGraph(
    projectPath: string
  ): Promise<DependencyGraph> {
    // 构建模块依赖图
    const graph: DependencyGraph = { nodes: [], edges: [] };

    const files = await glob('**/*.{js,ts}', {
      cwd: projectPath,
      ignore: ['node_modules/**'],
    });

    for (const file of files) {
      const content = await readFile(`${projectPath}/${file}`, 'utf-8');
      const imports = this.extractImports(content);

      graph.nodes.push({ id: file, type: 'module' });

      for (const imp of imports) {
        if (!imp.startsWith('.')) continue; // 只处理相对导入

        const resolved = this.resolveImport(file, imp);
        graph.edges.push({ from: file, to: resolved, type: 'import' });
      }
    }

    return graph;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"];?/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  // 生成项目上下文摘要
  generateSummary(context: ProjectContext): string {
    return `
Project Overview:
- Total Files: ${context.fileStructure.length}
- Entry Points: ${context.entryPoints.join(', ')}
- Main Technologies: ${this.detectTechnologies(context.configFiles)}

Key Files:
${context.fileStructure
  .slice(0, 10)
  .map((f) => `  - ${f.path}`)
  .join('\n')}

Dependencies:
${context.dependencies.nodes.length} modules, ${context.dependencies.edges.length} dependencies
    `.trim();
  }
}
```

### 6.3 多轮对话管理

```typescript
// src/core/context/ConversationManager.ts
interface ConversationSession {
  id: string;
  messages: Message[];
  codeSnapshots: Map<string, CodeSnapshot>;
  userPreferences: UserPreferences;
  tokenCount: number;
}

interface CodeSnapshot {
  timestamp: number;
  code: string;
  analysis: CodeAnalysis;
  version: number;
}

class ConversationManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private maxTokens = 4000;
  private maxMessages = 20;

  createSession(id: string): ConversationSession {
    const session: ConversationSession = {
      id,
      messages: [],
      codeSnapshots: new Map(),
      userPreferences: {
        explanationDetail: 'medium',
        preferredLanguage: 'typescript',
      },
      tokenCount: 0,
    };
    this.sessions.set(id, session);
    return session;
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // 添加消息
    session.messages.push({
      ...message,
      timestamp: Date.now(),
    });

    // 更新Token计数
    session.tokenCount += this.estimateTokens(message.content);

    // 检查是否需要压缩
    if (session.tokenCount > this.maxTokens) {
      this.compressSession(sessionId);
    }

    // 限制消息数量
    if (session.messages.length > this.maxMessages) {
      this.archiveOldMessages(sessionId);
    }
  }

  // 保存代码快照（用于追踪变更）
  saveCodeSnapshot(
    sessionId: string,
    filePath: string,
    code: string,
    analysis: CodeAnalysis
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const existing = session.codeSnapshots.get(filePath);
    const snapshot: CodeSnapshot = {
      timestamp: Date.now(),
      code,
      analysis,
      version: existing ? existing.version + 1 : 1,
    };

    session.codeSnapshots.set(filePath, snapshot);
  }

  // 获取代码变更历史
  getCodeHistory(sessionId: string, filePath: string): CodeSnapshot[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const snapshots: CodeSnapshot[] = [];
    session.codeSnapshots.forEach((snapshot, path) => {
      if (path === filePath) {
        snapshots.push(snapshot);
      }
    });

    return snapshots.sort((a, b) => a.timestamp - b.timestamp);
  }

  // 智能会话压缩
  private compressSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 保留最近的对话
    const recentMessages = session.messages.slice(-5);

    // 压缩早期对话
    const oldMessages = session.messages.slice(0, -5);
    const summary = this.summarizeMessages(oldMessages);

    session.messages = [
      {
        role: 'system',
        content: `[Previous conversation summary]: ${summary}`,
        timestamp: Date.now(),
      },
      ...recentMessages,
    ];

    session.tokenCount = this.calculateTotalTokens(session.messages);
  }

  private summarizeMessages(messages: Message[]): string {
    // 提取关键主题
    const topics = new Set<string>();
    const codeFiles = new Set<string>();

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();

      if (content.includes('explain')) topics.add('code explanation');
      if (content.includes('refactor')) topics.add('refactoring');
      if (content.includes('bug') || content.includes('fix'))
        topics.add('bug fixing');
      if (content.includes('test')) topics.add('testing');

      // 提取文件名
      const fileMatches = msg.content.match(/[\w-]+\.(js|ts|jsx|tsx)/g);
      fileMatches?.forEach((f) => codeFiles.add(f));
    });

    return `Topics: ${Array.from(topics).join(', ')}; Files: ${Array.from(
      codeFiles
    ).join(', ')}`;
  }

  // 构建Prompt上下文
  buildPromptContext(sessionId: string, currentCode?: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    const parts: string[] = [];

    // 添加用户偏好
    parts.push(`User prefers ${session.userPreferences.explanationDetail} explanations.`);

    // 添加相关历史
    const relevantHistory = this.findRelevantHistory(session, currentCode);
    if (relevantHistory.length > 0) {
      parts.push('Previous context:');
      relevantHistory.forEach((msg) => {
        parts.push(`${msg.role}: ${msg.content.substring(0, 200)}...`);
      });
    }

    return parts.join('\n');
  }

  private findRelevantHistory(
    session: ConversationSession,
    currentCode?: string
  ): Message[] {
    if (!currentCode) return session.messages.slice(-3);

    // 基于代码相似度找到相关历史
    return session.messages.filter((msg) => {
      // 简单相似度检查
      const msgWords = new Set(msg.content.toLowerCase().split(' '));
      const codeWords = new Set(currentCode.toLowerCase().split(' '));
      const intersection = new Set([...msgWords].filter((x) => codeWords.has(x)));
      return intersection.size > 5; // 至少有5个共同词
    });
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private calculateTotalTokens(messages: Message[]): number {
    return messages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
  }
}
```

---

## 七、完整项目代码和部署

### 7.1 项目完整结构

```
ai-code-assistant/
├── packages/
│   ├── cli/                    # CLI工具
│   │   ├── src/
│   │   ├── bin/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                    # Web界面
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── vscode-extension/       # VS Code插件
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── server/                 # 后端服务
│       ├── src/
│       ├── Dockerfile
│       ├── package.json
│       └── docker-compose.yml
├── shared/                     # 共享代码
│   ├── types/
│   ├── utils/
│   └── package.json
├── docs/
├── scripts/
├── package.json               # Root package.json
├── turbo.json                 # Turborepo配置
└── README.md
```

### 7.2 后端服务实现

```typescript
// packages/server/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { AgentController } from './controllers/agent.controller';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
}));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP 100次请求
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));

// 认证
app.use('/api', authMiddleware);

// 路由
const agentController = new AgentController();

app.post('/api/agent/chat', agentController.chat.bind(agentController));
app.post('/api/agent/explain', agentController.explain.bind(agentController));
app.post('/api/agent/refactor', agentController.refactor.bind(agentController));
app.post('/api/agent/detect', agentController.detect.bind(agentController));

// WebSocket处理
wss.on('connection', (ws) => {
  logger.info('New WebSocket connection');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await agentController.handleWebSocket(ws, message);
    } catch (error) {
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

```typescript
// packages/server/src/controllers/agent.controller.ts
import { Request, Response } from 'express';
import WebSocket from 'ws';
import { CodeAssistantAgent } from '../core/agent';
import { ContextManager } from '../core/context';
import { logger } from '../utils/logger';

export class AgentController {
  private agent: CodeAssistantAgent;
  private contextManager: ContextManager;

  constructor() {
    this.agent = new CodeAssistantAgent({
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.LLM_MODEL || 'gpt-4',
    });
    this.contextManager = new ContextManager();
  }

  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, message, codeContext } = req.body;

      // 获取或创建会话
      let context = this.contextManager.getSession(sessionId);
      if (!context) {
        context = this.contextManager.createSession(sessionId);
      }

      // 添加用户消息
      this.contextManager.addMessage(sessionId, {
        role: 'user',
        content: message,
      });

      // 调用Agent
      const response = await this.agent.chat(message, {
        sessionId,
        messages: context.messages,
        codeContext,
      });

      // 保存助手回复
      this.contextManager.addMessage(sessionId, {
        role: 'assistant',
        content: response.content,
      });

      res.json({
        success: true,
        content: response.content,
        suggestions: response.suggestions,
      });
    } catch (error) {
      logger.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async explain(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, code, fileName } = req.body;

      const response = await this.agent.explainCode(code, {
        sessionId,
        messages: this.contextManager.getHistory(sessionId),
        codeContext: {
          currentFile: fileName,
          selectedCode: code,
        },
      });

      res.json({
        success: true,
        explanation: response.content,
        keyPoints: response.keyPoints,
      });
    } catch (error) {
      logger.error('Explain error:', error);
      res.status(500).json({ error: 'Failed to explain code' });
    }
  }

  async refactor(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, code, strategy } = req.body;

      const suggestions = await this.agent.suggestRefactoring(code, {
        sessionId,
        messages: this.contextManager.getHistory(sessionId),
      });

      res.json({
        success: true,
        suggestions,
      });
    } catch (error) {
      logger.error('Refactor error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  }

  async detect(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, code } = req.body;

      const issues = await this.agent.detectBugs(code, {
        sessionId,
        messages: this.contextManager.getHistory(sessionId),
      });

      res.json({
        success: true,
        issues,
        summary: {
          high: issues.filter((i) => i.severity === 'high').length,
          medium: issues.filter((i) => i.severity === 'medium').length,
          low: issues.filter((i) => i.severity === 'low').length,
        },
      });
    } catch (error) {
      logger.error('Detect error:', error);
      res.status(500).json({ error: 'Failed to detect issues' });
    }
  }

  // WebSocket处理
  async handleWebSocket(ws: WebSocket, message: any): Promise<void> {
    const { type, sessionId, payload } = message;

    switch (type) {
      case 'chat':
        // 流式响应
        await this.handleStreamingChat(ws, sessionId, payload);
        break;
      case 'explain':
      case 'refactor':
      case 'detect':
        // 非流式响应
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  private async handleStreamingChat(
    ws: WebSocket,
    sessionId: string,
    payload: any
  ): Promise<void> {
    try {
      const stream = await this.agent.streamChat(payload.message, {
        sessionId,
        messages: this.contextManager.getHistory(sessionId),
        codeContext: payload.codeContext,
      });

      for await (const chunk of stream) {
        ws.send(
          JSON.stringify({
            type: 'chunk',
            content: chunk.content,
          })
        );
      }

      ws.send(JSON.stringify({ type: 'done' }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  }
}
```

### 7.3 Docker部署

```dockerfile
# packages/server/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# 复制源码
COPY src ./src

# 构建
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 只复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  server:
    build:
      context: ./packages/server
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - PORT=3001
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LLM_MODEL=${LLM_MODEL:-gpt-4}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped

  web:
    build:
      context: ./packages/web
      dockerfile: Dockerfile
    ports:
      - '3000:80'
    environment:
      - VITE_API_URL=http://localhost:3001
    depends_on:
      - server
    restart: unless-stopped

volumes:
  redis_data:
```

### 7.4 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Deploying AI Code Assistant..."

# 检查环境变量
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY is not set"
    exit 1
fi

# 构建所有包
echo "📦 Building packages..."
npm run build

# 构建Docker镜像
echo "🐳 Building Docker images..."
docker-compose build

# 启动服务
echo "▶️  Starting services..."
docker-compose up -d

# 健康检查
echo "🏥 Health check..."
sleep 5
curl -f http://localhost:3001/health || exit 1
curl -f http://localhost:3000 || exit 1

echo "✅ Deployment successful!"
echo "   Web: http://localhost:3000"
echo "   API: http://localhost:3001"
```

---

## 八、面试考点

### 8.1 代码分析相关

**Q1: 什么是AST？在代码分析中有什么作用？**

```
AST（抽象语法树）是源代码的树状表示，它将代码结构化为节点和边。

作用：
1. 代码解析：将文本代码转换为结构化数据
2. 静态分析：检测代码模式、复杂度、潜在问题
3. 代码转换：Babel转译、代码格式化
4. 智能提示：IDE自动补全、跳转定义

示例：
代码: function add(a, b) { return a + b; }
AST: 
FunctionDeclaration
├── id: Identifier (add)
├── params: [Identifier(a), Identifier(b)]
└── body: BlockStatement
    └── ReturnStatement
        └── BinaryExpression (+)
            ├── left: Identifier(a)
            └── right: Identifier(b)
```

**Q2: 如何计算代码的圈复杂度？**

```typescript
// 圈复杂度 = 决策点数量 + 1
// 决策点：if, while, for, case, catch, &&, ||, ?:

function calculateCyclomaticComplexity(code: string): number {
  const ast = parse(code);
  let complexity = 1; // 基础复杂度

  traverse(ast, {
    // 条件语句
    IfStatement() { complexity++; },
    ConditionalExpression() { complexity++; },
    
    // 循环语句
    WhileStatement() { complexity++; },
    ForStatement() { complexity++; },
    ForInStatement() { complexity++; },
    ForOfStatement() { complexity++; },
    DoWhileStatement() { complexity++; },
    
    // Switch
    SwitchCase(path) {
      if (path.node.test) complexity++; // 排除default
    },
    
    // 异常处理
    CatchClause() { complexity++; },
    
    // 逻辑运算符
    LogicalExpression(path) {
      if (path.node.operator === '&&' || path.node.operator === '||') {
        complexity++;
      }
    },
  });

  return complexity;
}

// 复杂度等级：
// 1-10: 低风险
// 11-20: 中等风险
// 21-50: 高风险
// >50: 极高风险，需要重构
```

**Q3: 如何处理大规模代码库的AST分析性能问题？**

```typescript
// 1. 增量分析 - 只分析变更的文件
class IncrementalAnalyzer {
  private cache: Map<string, ASTCacheEntry> = new Map();

  async analyzeFile(filePath: string, content: string): Promise<AST> {
    const hash = this.computeHash(content);
    const cached = this.cache.get(filePath);

    if (cached && cached.hash === hash) {
      return cached.ast; // 使用缓存
    }

    const ast = await this.parse(content);
    this.cache.set(filePath, { hash, ast, timestamp: Date.now() });
    return ast;
  }
}

// 2. Worker线程并行处理
import { Worker } from 'worker_threads';

class ParallelAnalyzer {
  private workers: Worker[] = [];

  async analyzeBatch(files: string[]): Promise<AnalysisResult[]> {
    const chunks = this.chunkArray(files, this.workers.length);
    
    const promises = chunks.map((chunk, i) => 
      this.assignToWorker(this.workers[i], chunk)
    );

    return (await Promise.all(promises)).flat();
  }
}

// 3. 流式解析 - 大文件分块处理
async function* streamParse(filePath: string): AsyncGenerator<ASTNode> {
  const stream = createReadStream(filePath);
  const parser = createParser();

  for await (const chunk of stream) {
    const nodes = parser.feed(chunk);
    for (const node of nodes) {
      yield node;
    }
  }
}

// 4. 索引和预过滤
class CodeIndex {
  private index: MiniSearch;

  buildIndex(files: FileInfo[]) {
    this.index = new MiniSearch({
      fields: ['content', 'exports', 'imports'],
      storeFields: ['path', 'summary'],
    });
    this.index.addAll(files);
  }

  search(query: string): FileInfo[] {
    return this.index.search(query);
  }
}
```

### 8.2 Agent设计相关

**Q4: 如何设计一个支持多轮对话的AI Agent？**

```
核心要素：

1. 会话管理
   - 会话ID标识
   - 消息历史存储
   - 上下文窗口管理

2. 上下文压缩
   - Token限制处理
   - 历史消息摘要
   - 关键信息保留

3. 状态追踪
   - 用户意图识别
   - 对话状态机
   - 槽位填充

4. 记忆机制
   - 短期记忆（当前会话）
   - 长期记忆（用户偏好）
   - 知识库检索

实现架构：
┌─────────────────────────────────────────┐
│           User Input                    │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      Intent Recognition                 │
│  - 分类用户意图                         │
│  - 提取关键实体                         │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      Context Assembly                   │
│  - 加载历史消息                         │
│  - 检索相关知识                         │
│  - 压缩超长上下文                        │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      LLM Processing                     │
│  - 生成回复                             │
│  - 工具调用                             │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      Response & State Update            │
│  - 返回结果                             │
│  - 更新会话状态                         │
│  - 保存记忆                             │
└─────────────────────────────────────────┘
```

**Q5: 如何处理LLM的Token限制问题？**

```typescript
// 策略1: 滑动窗口
class SlidingWindowContext {
  private maxTokens = 4000;
  private reserveTokens = 500; // 预留空间给回复

  buildMessages(history: Message[], currentInput: string): Message[] {
    const systemPrompt = this.getSystemPrompt();
    const availableTokens = this.maxTokens - this.reserveTokens;
    
    let totalTokens = this.estimateTokens(systemPrompt);
    const selectedMessages: Message[] = [];

    // 从最新的消息开始选择
    for (let i = history.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokens(history[i].content);
      
      if (totalTokens + msgTokens > availableTokens) {
        break;
      }
      
      selectedMessages.unshift(history[i]);
      totalTokens += msgTokens;
    }

    return [
      { role: 'system', content: systemPrompt },
      ...selectedMessages,
      { role: 'user', content: currentInput },
    ];
  }
}

// 策略2: 分层摘要
class HierarchicalSummarizer {
  async compressMessages(messages: Message[]): Promise<Message[]> {
    if (messages.length <= 10) return messages;

    // 早期消息摘要
    const oldMessages = messages.slice(0, -10);
    const recentMessages = messages.slice(-10);

    const summary = await this.summarize(oldMessages);

    return [
      { role: 'system', content: `[Summary]: ${summary}` },
      ...recentMessages,
    ];
  }

  private async summarize(messages: Message[]): Promise<string> {
    const prompt = `Summarize the following conversation, keeping key facts and user preferences:\n\n${
      messages.map(m => `${m.role}: ${m.content}`).join('\n')
    }`;

    const response = await this.llm.complete(prompt);
    return response;
  }
}

// 策略3: 向量检索
class VectorContextRetriever {
  private vectorStore: VectorStore;

  async buildContext(query: string, allMessages: Message[]): Promise<Message[]> {
    // 将消息转换为向量
    const embeddings = await Promise.all(
      allMessages.map(m => this.embed(m.content))
    );

    // 存储向量
    await this.vectorStore.upsert(
      allMessages.map((m, i) => ({
        id: m.id,
        vector: embeddings[i],
        metadata: { role: m.role, content: m.content },
      }))
    );

    // 检索相关消息
    const queryEmbedding = await this.embed(query);
    const relevant = await this.vectorStore.query(queryEmbedding, 5);

    return relevant.map(r => ({
      role: r.metadata.role,
      content: r.metadata.content,
    }));
  }
}
```

### 8.3 性能优化相关

**Q6: 如何优化AI编程助手的响应速度？**

```typescript
// 1. 流式响应
async function* streamResponse(prompt: string): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}

// 2. 智能缓存
class SmartCache {
  private cache: LRUCache<string, CacheEntry>;

  async getOrCompute(
    key: string,
    compute: () => Promise<string>,
    ttl: number = 3600000
  ): Promise<string> {
    // 规范化key（去除空格、变量名等）
    const normalizedKey = this.normalize(key);
    
    const cached = this.cache.get(normalizedKey);
    if (cached && !this.isExpired(cached, ttl)) {
      return cached.value;
    }

    const value = await compute();
    this.cache.set(normalizedKey, { value, timestamp: Date.now() });
    return value;
  }

  private normalize(code: string): string {
    return code
      .replace(/\s+/g, ' ')      // 标准化空白
      .replace(/'[^']*'/g, "''") // 规范化字符串
      .replace(/"[^"]*"/g, '""') // 规范化字符串
      .trim();
  }
}

// 3. 预加载和预热
class Preloader {
  async warmup(): Promise<void> {
    // 预热常用Prompt模板
    const templates = [
      this.loadTemplate('explain'),
      this.loadTemplate('refactor'),
      this.loadTemplate('detect'),
    ];

    // 建立常用代码模式索引
    await this.buildPatternIndex();

    // 预连接LLM
    await this.pingLLM();
  }

  private async buildPatternIndex(): Promise<void> {
    const patterns = [
      { pattern: 'for loop', description: 'Iteration pattern' },
      { pattern: 'async/await', description: 'Async pattern' },
      { pattern: 'try/catch', description: 'Error handling' },
    ];

    for (const p of patterns) {
      const embedding = await this.embed(p.pattern);
      await this.index.store(embedding, p);
    }
  }
}

// 4. 并发控制
class ConcurrencyController {
  private semaphore: Semaphore;

  constructor(maxConcurrency: number = 5) {
    this.semaphore = new Semaphore(maxConcurrency);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.semaphore.acquire();
    try {
      return await fn();
    } finally {
      this.semaphore.release();
    }
  }
}

// 5. 代码预处理减少Token
function optimizeCodeForLLM(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
    .replace(/\/\/.*$/gm, '')        // 移除单行注释
    .replace(/^\s*import.*$/gm, '')  // 移除导入语句（可单独提供）
    .replace(/\n\s*\n/g, '\n')       // 移除空行
    .trim();
}
```

**Q7: 如何保证代码分析的安全性？**

```typescript
// 1. 输入验证和过滤
class InputValidator {
  validateCode(code: string): ValidationResult {
    // 检查代码大小
    if (code.length > 100000) {
      return { valid: false, error: 'Code too large' };
    }

    // 检测敏感模式
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /child_process/,
      /fs\s*\.\s*unlink/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return { valid: false, error: 'Potentially dangerous code detected' };
      }
    }

    return { valid: true };
  }
}

// 2. 沙箱执行
import { VM } from 'vm2';

class SandboxExecutor {
  private vm: VM;

  constructor() {
    this.vm = new VM({
      timeout: 1000,
      sandbox: {},
      require: {
        external: false,
        builtin: [],
      },
    });
  }

  safeExecute(code: string): any {
    try {
      return this.vm.run(code);
    } catch (error) {
      return { error: error.message };
    }
  }
}

// 3. 输出过滤
class OutputSanitizer {
  sanitize(text: string): string {
    // 移除潜在的XSS
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// 4. 速率限制和配额
class RateLimiter {
  private limits: Map<string, RateLimit> = new Map();

  checkLimit(userId: string): boolean {
    const now = Date.now();
    const limit = this.limits.get(userId) || {
      count: 0,
      resetTime: now + 3600000, // 1小时
    };

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 3600000;
    }

    if (limit.count >= 100) { // 每小时100次
      return false;
    }

    limit.count++;
    this.limits.set(userId, limit);
    return true;
  }
}
```

---

## 避坑指南

1. **Token超限问题**
   - 始终监控Token使用量
   - 实现智能上下文压缩
   - 预留足够的响应Token空间

2. **AST解析兼容性**
   - 不同语言版本需要不同parser配置
   - 处理语法错误时的降级策略
   - 大文件解析的性能问题

3. **上下文丢失**
   - 会话超时处理
   - 代码变更检测
   - 多文件关联分析

4. **LLM幻觉问题**
   - 结合静态分析验证
   - 提供代码执行环境验证
   - 置信度评分机制

---

## 扩展阅读

- [Babel Parser文档](https://babeljs.io/docs/en/babel-parser)
- [Monaco Editor文档](https://microsoft.github.io/monaco-editor/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [LangChain文档](https://js.langchain.com/)
- [Tree-sitter文档](https://tree-sitter.github.io/tree-sitter/)

---

## 课后练习

1. **基础练习**：实现一个支持Python代码分析的CLI工具
2. **进阶练习**：添加代码相似度检测功能，识别重复代码
3. **挑战练习**：实现一个支持多语言（JS/Python/Java）的统一分析平台
4. **实战项目**：将本项目的CLI工具集成到你的日常开发工作流中
