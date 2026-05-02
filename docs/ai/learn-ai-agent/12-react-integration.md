---
title: 12-前端接入 Agent：React 实战
description: React 聊天界面开发，流式消息处理，状态管理
---

# 12-前端接入 Agent：React 实战

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 前端集成能力 | ✅ React 组件设计、状态管理 |
| 实时通信能力 | ✅ SSE/EventSource、流式渲染 |
| 性能优化能力 | ✅ 虚拟列表、防抖节流 |

## 学习目标

学完本节，你将能够：

- 设计可复用的聊天界面组件架构
- 实现流式消息的实时渲染（SSE + ReadableStream）
- 管理复杂对话状态（历史记录、会话切换、中断重试）
- 开发 ChatGPT 风格的完整聊天界面
- 掌握前端性能优化技巧

## 前置知识

- React Hooks（useState、useEffect、useRef、useCallback）
- TypeScript 基础类型定义
- HTTP 协议与 Fetch API
- 已完成第 11 章后端 SSE 接口开发

---

## 一、聊天界面组件设计

### 1.1 组件架构图

```
ChatContainer (容器)
├── ChatHeader (头部：标题、设置、新对话)
├── ChatMessageList (消息列表)
│   ├── ChatMessage (单条消息)
│   │   ├── Avatar (头像)
│   │   ├── MessageContent (内容)
│   │   └── MessageActions (复制、重新生成)
│   └── TypingIndicator (输入指示器)
├── ChatInput (输入区域)
│   ├── Textarea (多行输入)
│   ├── SendButton (发送按钮)
│   └── StopButton (停止生成)
└── ChatSidebar (侧边栏：历史会话)
    └── SessionItem (会话项)
```

### 1.2 核心组件实现

#### MessageList 组件

```tsx
// components/ChatMessageList.tsx
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  isLoading: boolean;
  streamingMessage?: string;
}

export const ChatMessageList: React.FC<Props> = ({
  messages,
  isLoading,
  streamingMessage
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  return (
    <div ref={scrollRef} className="message-list">
      {messages.map((msg, index) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          isLast={index === messages.length - 1}
        />
      ))}
      
      {/* 流式消息预览 */}
      {streamingMessage && (
        <ChatMessage
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingMessage,
            timestamp: Date.now()
          }}
          isStreaming
        />
      )}
      
      {isLoading && !streamingMessage && <TypingIndicator />}
    </div>
  );
};
```

#### ChatInput 组件

```tsx
// components/ChatInput.tsx
import React, { useState, useCallback, useRef } from 'react';

interface Props {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<Props> = ({
  onSend,
  onStop,
  isLoading,
  disabled
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    
    onSend(trimmed);
    setInput('');
    
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          disabled={disabled}
          rows={1}
        />
        
        {isLoading ? (
          <button onClick={onStop} className="stop-btn">
            ⏹ 停止
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="send-btn"
          >
            ➤
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 二、流式消息处理

### 2.1 SSE (Server-Sent Events) 实现

```tsx
// hooks/useSSE.ts
import { useCallback, useRef, useState } from 'react';

interface SSEOptions {
  url: string;
  body: object;
  onMessage: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export const useSSE = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (options: SSEOptions) => {
    const { url, body, onMessage, onError, onComplete } = options;
    
    // 取消之前的请求
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    abortRef.current = new AbortController();
    setIsStreaming(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.();
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                onMessage(content);
              }
            } catch (e) {
              // 非 JSON 数据直接输出
              onMessage(data);
            }
          }
        }
      }

      onComplete?.();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  return { startStream, stopStream, isStreaming };
};
```

### 2.2 EventSource 方案（备选）

```tsx
// hooks/useEventSource.ts
import { useEffect, useRef, useCallback, useState } from 'react';

export const useEventSource = (url: string | null) => {
  const [data, setData] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    // 关闭旧连接
    esRef.current?.close();

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        es.close();
        setIsConnected(false);
        return;
      }
      setData((prev) => prev + event.data);
    };

    es.onerror = (err) => {
      setError(new Error('EventSource error'));
      setIsConnected(false);
      es.close();
    };

    return () => es.close();
  }, [url]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    setIsConnected(false);
  }, []);

  const reset = useCallback(() => {
    setData('');
    setError(null);
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      disconnect();
    };
  }, [connect, disconnect]);

  return { data, error, isConnected, disconnect, reset };
};
```

### 2.3 流式消息渲染优化

```tsx
// components/StreamingMessage.tsx
import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface Props {
  content: string;
}

// 使用 memo 避免不必要的重渲染
export const StreamingMessage: React.FC<Props> = memo(({ content }) => {
  // 防抖渲染：每 50ms 更新一次 DOM
  const debouncedContent = useDebounce(content, 50);

  return (
    <div className="streaming-message">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {debouncedContent}
      </ReactMarkdown>
      
      {/* 光标闪烁效果 */}
      <span className="cursor-blink">▊</span>
    </div>
  );
});

// 自定义防抖 Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

---

## 三、状态管理

### 3.1 Zustand Store 设计

```tsx
// store/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, Session } from '../types';

interface ChatState {
  // 会话列表
  sessions: Session[];
  currentSessionId: string | null;
  
  // 消息状态
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  
  // Actions
  createSession: () => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreaming: () => void;
  
  setIsLoading: (loading: boolean) => void;
  retryLastMessage: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
      streamingContent: '',

      createSession: () => {
        const newSession: Session = {
          id: Date.now().toString(),
          title: '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
          messages: []
        }));
        
        return newSession.id;
      },

      switchSession: (id) => {
        const session = get().sessions.find((s) => s.id === id);
        if (session) {
          set({
            currentSessionId: id,
            messages: session.messages || []
          });
        }
      },

      deleteSession: (id) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: newSessions,
            currentSessionId: state.currentSessionId === id
              ? newSessions[0]?.id || null
              : state.currentSessionId,
            messages: state.currentSessionId === id ? [] : state.messages
          };
        });
      },

      addMessage: (message) => {
        set((state) => {
          const newMessages = [...state.messages, message];
          
          // 更新会话标题（第一条用户消息）
          const updatedSessions = state.sessions.map((s) =>
            s.id === state.currentSessionId
              ? {
                  ...s,
                  title: s.title === '新对话' && message.role === 'user'
                    ? message.content.slice(0, 20) + '...'
                    : s.title,
                  updatedAt: Date.now(),
                  messages: newMessages
                }
              : s
          );
          
          return { messages: newMessages, sessions: updatedSessions };
        });
      },

      updateLastMessage: (content) => {
        set((state) => {
          const newMessages = [...state.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = content;
          }
          return { messages: newMessages };
        });
      },

      setStreamingContent: (content) => set({ streamingContent: content }),
      
      appendStreamingContent: (chunk) =>
        set((state) => ({
          streamingContent: state.streamingContent + chunk
        })),
      
      clearStreaming: () => set({ streamingContent: '' }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      retryLastMessage: () => {
        const { messages, addMessage, createSession } = get();
        
        // 找到最后一条用户消息
        const lastUserMsgIndex = [...messages]
          .reverse()
          .findIndex((m) => m.role === 'user');
        
        if (lastUserMsgIndex === -1) return;
        
        const actualIndex = messages.length - 1 - lastUserMsgIndex;
        const userMessage = messages[actualIndex];
        
        // 删除该消息之后的所有消息（包括失败的 AI 回复）
        const newMessages = messages.slice(0, actualIndex + 1);
        
        set({ messages: newMessages, isLoading: true });
        
        // 重新发送请求...
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ sessions: state.sessions })
    }
  )
);
```

### 3.2 对话流程 Hook

```tsx
// hooks/useChat.ts
import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useSSE } from './useSSE';
import type { Message } from '../types';

export const useChat = () => {
  const {
    messages,
    isLoading,
    streamingContent,
    currentSessionId,
    addMessage,
    setIsLoading,
    appendStreamingContent,
    clearStreaming,
    createSession
  } = useChatStore();

  const { startStream, stopStream, isStreaming } = useSSE();

  const sendMessage = useCallback(async (content: string) => {
    // 确保有当前会话
    if (!currentSessionId) {
      createSession();
    }

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    addMessage(userMessage);

    setIsLoading(true);
    clearStreaming();

    // 构建消息历史
    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content
    }));

    // 启动流式请求
    await startStream({
      url: '/api/chat/stream',
      body: { messages: history },
      
      onMessage: (chunk) => {
        appendStreamingContent(chunk);
      },
      
      onError: (error) => {
        console.error('Stream error:', error);
        setIsLoading(false);
        
        // 添加错误消息
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: '抱歉，发生了错误，请稍后重试。',
          timestamp: Date.now(),
          isError: true
        });
      },
      
      onComplete: () => {
        // 将流式内容转为正式消息
        const finalContent = useChatStore.getState().streamingContent;
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: finalContent,
          timestamp: Date.now()
        });
        
        clearStreaming();
        setIsLoading(false);
      }
    });
  }, [
    messages,
    currentSessionId,
    addMessage,
    setIsLoading,
    clearStreaming,
    appendStreamingContent,
    startStream,
    createSession
  ]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStream
  };
};
```

---

## 四、实战：ChatGPT 风格聊天界面

### 4.1 完整页面组件

```tsx
// pages/ChatPage.tsx
import React from 'react';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatInput } from '../components/ChatInput';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatHeader } from '../components/ChatHeader';
import { useChat } from '../hooks/useChat';
import { useChatStore } from '../store/chatStore';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStream
  } = useChat();

  const { sessions, currentSessionId, createSession, switchSession } = useChatStore();

  return (
    <div className="chat-page">
      <ChatSidebar
        sessions={sessions}
        currentId={currentSessionId}
        onSelect={switchSession}
        onNewChat={createSession}
      />
      
      <div className="chat-main">
        <ChatHeader
          title={sessions.find((s) => s.id === currentSessionId)?.title || '新对话'}
          onNewChat={createSession}
        />
        
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          streamingMessage={streamingContent}
        />
        
        <ChatInput
          onSend={sendMessage}
          onStop={stopStream}
          isLoading={isStreaming}
        />
      </div>
    </div>
  );
};
```

### 4.2 样式文件

```css
/* ChatPage.css */
.chat-page {
  display: flex;
  height: 100vh;
  background: #343541;
  color: #ececf1;
}

.chat-sidebar {
  width: 260px;
  background: #202123;
  border-right: 1px solid #4d4d4f;
  display: flex;
  flex-direction: column;
}

.new-chat-btn {
  margin: 12px;
  padding: 12px;
  background: transparent;
  border: 1px solid #4d4d4f;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: #2d2d2d;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.message {
  display: flex;
  padding: 20px;
  gap: 16px;
}

.message.user {
  background: #343541;
}

.message.assistant {
  background: #444654;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.message.user .message-avatar {
  background: #5436da;
}

.message.assistant .message-avatar {
  background: #19c37d;
}

.message-content {
  flex: 1;
  max-width: 800px;
  line-height: 1.6;
}

.chat-input-container {
  padding: 20px;
  border-top: 1px solid #4d4d4f;
  background: #343541;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #40414f;
  border-radius: 12px;
  padding: 12px 16px;
}

.input-wrapper textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  resize: none;
  outline: none;
  max-height: 200px;
}

.send-btn, .stop-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.send-btn {
  background: #19c37d;
  color: white;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-btn {
  background: #ef4444;
  color: white;
}

/* 流式消息光标 */
.cursor-blink {
  animation: blink 1s infinite;
  color: #19c37d;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 代码块样式 */
pre {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', monospace;
  font-size: 14px;
}
```

---

## 五、性能优化

### 5.1 虚拟列表（大量消息时）

```tsx
// components/VirtualMessageList.tsx
import React, { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  estimateSize?: number;
}

export const VirtualMessageList: React.FC<Props> = ({
  messages,
  estimateSize = 100
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5 // 预渲染 5 条
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="virtual-list-container">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <ChatMessage message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 5.2 防抖节流优化

```tsx
// hooks/useOptimizedScroll.ts
import { useEffect, useRef, useCallback } from 'react';

export const useOptimizedScroll = (
  callback: () => void,
  delay: number = 100
) => {
  const frameRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      callback();
      frameRef.current = undefined;
    });
  }, [callback]);

  const debouncedCallback = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return { throttledCallback, debouncedCallback };
};
```

---

## 六、避坑指南

### 6.1 常见错误

| 错误 | 原因 | 解决方案 |
|-----|------|---------|
| 消息闪烁/抖动 | 流式更新过于频繁 | 使用防抖（50-100ms）或 requestAnimationFrame |
| 滚动位置乱跳 | 新消息插入时未保持滚动 | 记录滚动位置，更新后恢复 |
| 内存泄漏 | EventSource 未关闭 | 组件卸载时调用 close() |
| 重复消息 | 快速点击发送按钮 | 添加 isLoading 状态锁 |
| 特殊字符渲染错误 | Markdown 解析问题 | 使用 react-markdown + 转义处理 |

### 6.2 最佳实践

```tsx
// 1. 使用 useCallback 缓存回调
const handleSend = useCallback((msg: string) => {
  // ...
}, [deps]);

// 2. 使用 memo 避免不必要渲染
export const Message = memo(({ content }: Props) => {
  // ...
}, (prev, next) => prev.content === next.content);

// 3. 合理使用 useRef 避免闭包问题
const messagesRef = useRef(messages);
messagesRef.current = messages;

// 4. 错误边界处理
class ChatErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>聊天组件出错，请刷新页面</div>;
    }
    return this.props.children;
  }
}
```

---

## 七、面试考点

### Q1: SSE 和 WebSocket 的区别？什么时候选择 SSE？

**参考答案：**

| 特性 | SSE | WebSocket |
|-----|-----|-----------|
| 通信方向 | 单向（服务器→客户端） | 双向 |
| 协议 | HTTP | WebSocket（ws/wss） |
| 重连 | 浏览器自动重连 | 需手动实现 |
| 适用场景 | 服务器推送、流式输出 | 实时双向通信（游戏、协作） |

选择 SSE 的场景：
- AI 流式回复（单向数据流）
- 股票行情推送
- 日志实时展示

### Q2: 如何处理流式消息的性能优化？

**参考答案：**

1. **防抖渲染**：流式数据高频更新，使用防抖（50-100ms）批量更新 DOM
2. **虚拟列表**：消息超过 100 条时使用虚拟滚动
3. **增量渲染**：只更新新增内容，不重新渲染整个列表
4. **使用 requestAnimationFrame**：确保渲染在正确时机执行
5. **Web Worker**：复杂 Markdown 解析可移至 Worker 线程

### Q3: React 状态管理方案对比？为什么选择 Zustand？

**参考答案：**

| 方案 | 优点 | 缺点 | 适用场景 |
|-----|------|------|---------|
| useState | 简单、内置 | 跨组件困难 | 局部状态 |
| Context | 无需额外库 | 性能问题（任意更新都重渲染） | 主题、语言 |
| Redux | 生态完善、DevTools | 样板代码多 | 大型应用 |
| Zustand | 简洁、性能好、TypeScript 友好 | 生态较小 | 中小型应用 |
| Jotai | 原子化、细粒度 | 学习成本 | 复杂状态依赖 |

选择 Zustand 的原因：
- 代码简洁，无样板代码
- 天然支持 TypeScript
- 持久化中间件方便
- 性能优秀（选择器自动优化）

### Q4: 如何实现"停止生成"功能？

**参考答案：**

```tsx
// 使用 AbortController 中断请求
const abortController = useRef<AbortController | null>(null);

const startStream = async () => {
  abortController.current = new AbortController();
  
  const response = await fetch('/api/stream', {
    signal: abortController.current.signal
  });
  
  const reader = response.body?.getReader();
  
  try {
    while (reader) {
      const { done } = await reader.read();
      if (done) break;
      // 处理数据...
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('用户主动中断');
    }
  }
};

const stopStream = () => {
  abortController.current?.abort();
};
```

### Q5: 如何优化首屏加载时间？

**参考答案：**

1. **代码分割**：路由级懒加载
```tsx
const ChatPage = lazy(() => import('./pages/ChatPage'));
```

2. **预加载关键资源**：
```tsx
<link rel="preload" href="/wasm/markdown-parser.wasm" />
```

3. **服务端渲染（SSR）**：改善首屏体验

4. **虚拟列表**：避免一次性渲染大量历史消息

5. **Web Worker**：将 Markdown 解析移至后台线程

---

## 八、扩展阅读

- [MDN - EventSource](https://developer.mozilla.org/zh-CN/docs/Web/API/EventSource)
- [Zustand 官方文档](https://docs.pmnd.rs/zustand)
- [React 虚拟列表实现](https://tanstack.com/virtual/latest)
- [SSE vs WebSocket](https://www.enjoyalgorithms.com/blog/sse-vs-websocket)
- [Streaming Markdown 渲染优化](https://github.com/remarkjs/react-markdown)

---

## 九、课后练习

1. **基础练习**：使用本节课代码，实现一个支持 Markdown 渲染的聊天界面

2. **进阶练习**：
   - 添加消息编辑功能（点击编辑历史消息，重新生成后续对话）
   - 实现消息搜索功能（高亮匹配内容）
   - 添加代码块复制按钮

3. **挑战练习**：
   - 实现多模态输入（支持图片上传）
   - 添加语音输入功能（Web Speech API）
   - 实现消息分支功能（同一问题多个回答版本）

---

## 参考代码仓库

完整示例代码：[github.com/example/react-chat-agent](https://github.com/example/react-chat-agent)
