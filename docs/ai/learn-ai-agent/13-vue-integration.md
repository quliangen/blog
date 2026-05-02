---
title: 13-进阶：Vue 版本与框架对比
description: Vue 3 Composition API 实现，React vs Vue 在 AI 应用中的差异对比
---

# 13-进阶：Vue 版本与框架对比

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 前端框架选型能力 | ✅ React vs Vue 对比分析 |
| 跨框架开发能力 | ✅ Composition API + Hooks 双框架实现 |
| 可复用架构设计 | ✅ 通用 Composable/Hook 封装 |
| AI 应用开发经验 | ✅ 双框架 AI Chat 组件实战 |

## 学习目标

学完本节，你将能够：

1. 使用 Vue 3 Composition API 实现与 React Hooks 相同的功能
2. 理解 React 与 Vue 在 AI 应用开发中的核心差异
3. 封装可跨框架使用的通用逻辑（Hook/Composable）
4. 根据项目需求做出合理的框架选型决策
5. 应对面试中关于框架对比和选型的高频问题

## 前置知识

- 已完成第 12 章 React 版本学习
- 熟悉 Vue 3 Composition API 基础语法
- 了解响应式编程基本概念

## 核心概念

### 1. React Hooks vs Vue Composition API

| 特性 | React Hooks | Vue 3 Composition API |
|------|-------------|----------------------|
| **状态管理** | `useState()` | `ref()` / `reactive()` |
| **副作用** | `useEffect()` | `watch()` / `watchEffect()` |
| **计算属性** | `useMemo()` | `computed()` |
| **生命周期** | `useEffect` 依赖数组 | `onMounted()` / `onUnmounted()` |
| **引用** | `useRef()` | `ref()` (模板引用) |
| **上下文** | `useContext()` | `provide()` / `inject()` |

### 2. AI 应用中的关键差异

#### 2.1 响应式系统对比

```javascript
// React: 需要手动管理依赖，容易出现闭包陷阱
function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useCallback(async (content) => {
    // 必须将 messages 加入依赖数组，否则拿到的是旧值
    setMessages(prev => [...prev, { role: 'user', content }]);
    setIsLoading(true);
    // ...
  }, []); // 依赖数组管理复杂
}
```

```javascript
// Vue: 自动追踪依赖，无需手动声明
function useAIChat() {
  const messages = ref([]);
  const isLoading = ref(false);
  
  const sendMessage = async (content) => {
    // 直接访问，自动响应式
    messages.value.push({ role: 'user', content });
    isLoading.value = true;
    // ...
  };
  // 无需 useCallback，函数天然稳定
}
```

#### 2.2 流式数据处理

```javascript
// React: useEffect + ReadableStream
useEffect(() => {
  const reader = stream.getReader();
  const read = async () => {
    const { done, value } = await reader.read();
    if (done) return;
    setResponse(prev => prev + value);
    read();
  };
  read();
  
  return () => reader.cancel(); // 清理
}, [stream]); // 依赖变化时重新订阅
```

```javascript
// Vue: watch + 自动清理
watch(() => props.stream, (newStream) => {
  if (!newStream) return;
  
  const reader = newStream.getReader();
  const read = async () => {
    const { done, value } = await reader.read();
    if (done) return;
    response.value += value;
    read();
  };
  read();
  
  // 组件卸载或 stream 变化时自动清理
  onCleanup(() => reader.cancel());
});
```

### 3. 通用 Hook/Composable 封装原则

#### 3.1 抽象层设计

```typescript
// types.ts - 框架无关的类型定义
export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatOptions {
  apiUrl: string;
  model?: string;
  temperature?: number;
  onError?: (error: Error) => void;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
}

export interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  stopGeneration: () => void;
}
```

#### 3.2 核心逻辑抽象

```typescript
// core/chat-logic.ts - 纯逻辑，无框架依赖
export class ChatCore {
  private options: ChatOptions;
  private abortController: AbortController | null = null;
  
  constructor(options: ChatOptions) {
    this.options = options;
  }
  
  async *sendMessageStream(content: string, history: Message[]): AsyncGenerator<string> {
    this.abortController = new AbortController();
    
    const response = await fetch(this.options.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...history, { role: 'user', content }],
        stream: true
      }),
      signal: this.abortController.signal
    });
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  }
  
  stop() {
    this.abortController?.abort();
  }
}
```

## 动手实战

### 实战 1: React 版本 AI Chat Hook

```typescript
// hooks/useAIChat.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatCore } from '../core/chat-logic';
import type { Message, ChatOptions, ChatState, ChatActions } from '../types';

export function useAIChat(options: ChatOptions): ChatState & ChatActions {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 使用 ref 保存 ChatCore 实例，避免重复创建
  const coreRef = useRef<ChatCore>(new ChatCore(options));
  
  // 更新配置
  useEffect(() => {
    coreRef.current = new ChatCore(options);
  }, [options.apiUrl, options.model]);
  
  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // 添加 AI 占位消息
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }]);
    
    try {
      const stream = coreRef.current.sendMessageStream(content, messages);
      let fullContent = '';
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullContent }
            : msg
        ));
      }
    } catch (err) {
      setError(err as Error);
      options.onError?.(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, options]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  
  const stopGeneration = useCallback(() => {
    coreRef.current.stop();
    setIsLoading(false);
  }, []);
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    stopGeneration
  };
}
```

```tsx
// components/AIChat.tsx
import React from 'react';
import { useAIChat } from '../hooks/useAIChat';

export const AIChat: React.FC = () => {
  const { messages, isLoading, sendMessage, clearMessages, stopGeneration } = useAIChat({
    apiUrl: '/api/chat',
    model: 'gpt-4'
  });
  const [input, setInput] = React.useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '生成中...' : '发送'}
        </button>
        {isLoading && <button type="button" onClick={stopGeneration}>停止</button>}
      </form>
    </div>
  );
};
```

### 实战 2: Vue 3 Composition API 版本

```typescript
// composables/useAIChat.ts
import { ref, computed } from 'vue';
import { ChatCore } from '../core/chat-logic';
import type { Message, ChatOptions } from '../types';

export function useAIChat(options: ChatOptions) {
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  
  // 创建 ChatCore 实例
  const core = new ChatCore(options);
  
  // 计算属性：最后一条消息
  const lastMessage = computed(() => messages.value[messages.value.length - 1]);
  
  // 发送消息
  async function sendMessage(content: string) {
    isLoading.value = true;
    error.value = null;
    
    // 添加用户消息
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    });
    
    // 添加 AI 占位消息
    const aiMessageId = (Date.now() + 1).toString();
    messages.value.push({
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    });
    
    try {
      const stream = core.sendMessageStream(content, messages.value.slice(0, -1));
      let fullContent = '';
      
      for await (const chunk of stream) {
        fullContent += chunk;
        const aiMessage = messages.value.find(m => m.id === aiMessageId);
        if (aiMessage) {
          aiMessage.content = fullContent;
        }
      }
    } catch (err) {
      error.value = err as Error;
      options.onError?.(err as Error);
    } finally {
      isLoading.value = false;
    }
  }
  
  function clearMessages() {
    messages.value = [];
    error.value = null;
  }
  
  function stopGeneration() {
    core.stop();
    isLoading.value = false;
  }
  
  return {
    // 状态
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastMessage,
    // 方法
    sendMessage,
    clearMessages,
    stopGeneration
  };
}
```

```vue
<!-- components/AIChat.vue -->
<template>
  <div class="chat-container">
    <div class="messages">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        :class="['message', msg.role]"
      >
        {{ msg.content }}
      </div>
    </div>
    <form @submit.prevent="handleSubmit">
      <input 
        v-model="input" 
        placeholder="输入消息..."
        :disabled="isLoading"
      />
      <button type="submit" :disabled="isLoading || !input.trim()">
        {{ isLoading ? '生成中...' : '发送' }}
      </button>
      <button v-if="isLoading" type="button" @click="stopGeneration">
        停止
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAIChat } from '../composables/useAIChat';

const { messages, isLoading, sendMessage, stopGeneration } = useAIChat({
  apiUrl: '/api/chat',
  model: 'gpt-4'
});

const input = ref('');

async function handleSubmit() {
  if (!input.value.trim() || isLoading.value) return;
  await sendMessage(input.value);
  input.value = '';
}
</script>
```

### 实战 3: 框架差异对比示例

```typescript
// 对比：状态批量更新

// React: 需要 useState 函数式更新保证正确性
const addMessages = (newMsgs) => {
  setMessages(prev => [...prev, ...newMsgs]);
};

// Vue: 直接赋值，响应式自动处理
const addMessages = (newMsgs) => {
  messages.value.push(...newMsgs);
};
```

```typescript
// 对比：监听副作用

// React useEffect
useEffect(() => {
  console.log('Messages changed:', messages);
  saveToLocalStorage(messages);
}, [messages]); // 必须声明依赖

// Vue watch
watch(messages, (newVal) => {
  console.log('Messages changed:', newVal);
  saveToLocalStorage(newVal);
}, { deep: true }); // 自动追踪，可选深度监听
```

```typescript
// 对比：计算派生状态

// React useMemo
const messageCount = useMemo(() => messages.length, [messages]);
const userMessages = useMemo(
  () => messages.filter(m => m.role === 'user'), 
  [messages]
);

// Vue computed
const messageCount = computed(() => messages.value.length);
const userMessages = computed(() => 
  messages.value.filter(m => m.role === 'user')
);
```

## 避坑指南

### 1. React 开发常见陷阱

```typescript
// ❌ 错误：闭包陷阱
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 永远输出初始值！
  }, 1000);
}, []); // count 未加入依赖数组

// ✅ 正确：使用 ref 或更新函数
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1); // 使用函数式更新
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

```typescript
// ❌ 错误：异步函数直接使用
useEffect(async () => {
  const data = await fetchData(); // 返回 Promise，无法正确清理
}, []);

// ✅ 正确：内部定义异步函数
useEffect(() => {
  const fetchData = async () => {
    const data = await fetchData();
  };
  fetchData();
}, []);
```

### 2. Vue 开发常见陷阱

```typescript
// ❌ 错误：解构 reactive 对象失去响应性
const state = reactive({ count: 0, message: '' });
const { count } = state; // count 是普通数字

// ✅ 正确：使用 toRefs 或保持属性访问
const { count } = toRefs(state); // count 是 Ref
// 或者直接使用 state.count
```

```typescript
// ❌ 错误：直接修改数组索引
const arr = ref([1, 2, 3]);
arr.value[0] = 10; // 不会触发更新

// ✅ 正确：使用 splice 或赋值新数组
arr.value.splice(0, 1, 10);
// 或
arr.value = [10, ...arr.value.slice(1)];
```

### 3. 跨框架注意事项

| 问题 | React | Vue |
|------|-------|-----|
| 状态共享 | Context/Redux | provide/inject/Pinia |
| 性能优化 | memo/useMemo | computed/v-memo |
| 表单处理 | 受控组件 | v-model |
| 条件渲染 | {condition && <A/>} | v-if/v-show |
| 列表渲染 | .map() | v-for |

## 面试考点

### Q1: React Hooks 和 Vue Composition API 的核心设计理念差异？

**参考答案：**

React Hooks 的设计基于**函数式编程**思想：
- 每次渲染都是独立的函数调用
- 通过依赖数组手动控制副作用执行时机
- 状态更新会触发组件重新渲染
- 需要特别注意闭包陷阱和依赖管理

Vue Composition API 基于**响应式编程**：
- 使用 Proxy 自动追踪依赖关系
- 副作用自动与响应式数据关联
- 无需手动声明依赖数组
- 函数定义一次，自动访问最新状态

**核心差异总结：**
- React: "显式优于隐式"，开发者控制一切
- Vue: "约定优于配置"，框架自动优化

### Q2: 在 AI 应用开发中，如何选择 React 还是 Vue？

**参考答案：**

**选择 React 的场景：**
1. 团队已有 React 技术栈积累
2. 需要大量自定义渲染优化（如虚拟列表、复杂图表）
3. 与 React Native 共享代码
4. 偏好函数式编程风格
5. 需要更细粒度的性能控制

**选择 Vue 的场景：**
1. 快速原型开发和中小型项目
2. 团队成员前端经验相对较浅
3. 需要更好的开发体验（单文件组件、更少的样板代码）
4. 渐进式升级现有项目
5. 偏好声明式编程风格

**AI 应用特殊考虑：**
- 流式输出：Vue 的响应式系统处理流式数据更新更自然
- 状态管理：复杂对话历史用 Pinia 比 Redux 更简洁
- 表单处理：AI 参数调优界面 Vue 的 v-model 更便利

### Q3: 如何实现一个可复用的 AI Chat 逻辑层？

**参考答案：**

三层架构设计：

1. **核心层（Core）**：纯 TypeScript，无框架依赖
   - 封装 SSE/WebSocket 连接
   - 消息历史管理
   - 错误重试逻辑

2. **适配层（Adapter）**：框架绑定
   - React: 封装为 Hook，处理 useEffect 生命周期
   - Vue: 封装为 Composable，处理响应式转换

3. **视图层（View）**：框架组件
   - 使用适配层提供的状态和方法
   - 处理 UI 交互和样式

**关键设计原则：**
- 核心层通过事件/回调与适配层通信
- 适配层负责将核心状态映射为框架响应式状态
- 保持核心层可测试、可复用

### Q4: 解释 React 的 useEffect 和 Vue 的 watch 在处理 SSE 流时的差异

**参考答案：**

**React useEffect:**
```typescript
useEffect(() => {
  const eventSource = new EventSource(url);
  eventSource.onmessage = (e) => {
    setData(prev => prev + e.data);
  };
  return () => eventSource.close();
}, [url]); // url 变化时重新订阅
```
- 需要手动管理订阅和取消订阅
- 依赖数组决定何时重新执行
- 清理函数在组件卸载或依赖变化时执行

**Vue watch:**
```typescript
watch(() => props.url, (newUrl) => {
  const eventSource = new EventSource(newUrl);
  eventSource.onmessage = (e) => {
    data.value += e.data;
  };
  onCleanup(() => eventSource.close());
});
```
- 自动追踪响应式依赖
- onCleanup 自动处理资源释放
- 无需担心闭包问题，直接访问最新值

**SSE 流处理差异：**
- React: 需要小心处理依赖，避免重复订阅
- Vue: 响应式自动处理，代码更简洁

## 扩展阅读

- [Vue 3 Composition API 官方文档](https://vuejs.org/guide/extras/composition-api-faq.html)
- [React Hooks 官方文档](https://react.dev/reference/react)
- [VueUse - Vue 组合式函数库](https://vueuse.org/)
- [ahooks - React Hooks 库](https://ahooks.js.org/)
- [框架无关的 AI SDK: Vercel AI SDK](https://sdk.vercel.ai/)

## 课后练习

1. **框架迁移练习**：将本章的 Vue useAIChat 改写为 React 版本，体会两者差异

2. **性能优化挑战**：
   - React：实现消息列表虚拟滚动，使用 useMemo 优化重渲染
   - Vue：使用 v-memo 和 computed 优化大数据量渲染

3. **跨框架封装**：
   - 将 ChatCore 核心逻辑抽离为独立 npm 包
   - 分别创建 React 和 Vue 的适配器包
   - 确保三个包可以独立发布和版本管理

4. **面试准备**：
   - 准备 3 个你参与过的项目，能够说明为什么选择 React/Vue
   - 总结 React 和 Vue 在 AI 应用中的 5 个具体优劣对比点
