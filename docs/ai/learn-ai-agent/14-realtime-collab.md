---
title: 14-实时协作 Agent 应用
description: WebSocket 实时通信，多用户会话管理，协作编辑，团队智能助手开发实战
---

# 14-实时协作 Agent 应用

想象一下，你和团队成员正在同时编辑一份文档——每个人的光标在屏幕上跳动，AI 助手实时响应所有人的提问，这就是实时协作 Agent 的魅力。本章将带你从零构建一个支持多人同时对话的团队智能助手。

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 实时通信开发 | ✅ WebSocket/Socket.io 全栈实现 |
| 多用户会话管理 | ✅ Room 隔离、广播机制 |
| 协作场景开发 | ✅ 光标同步、冲突处理 |
| 高并发架构设计 | ✅ 连接池、负载均衡策略 |

**薪资参考**：具备实时协作开发经验的工程师，薪资溢价 15-25%

## 学习目标

学完本节，你将能够：

1. **掌握 WebSocket 核心原理** —— 理解全双工通信的工作机制
2. **实现多用户会话隔离** —— 使用 Room 机制管理不同团队空间
3. **开发协作编辑功能** —— 光标同步、操作冲突解决
4. **构建团队智能助手** —— 支持多人同时与 AI 对话的完整应用
5. **应对实时系统面试** —— WebSocket vs SSE、协作算法、性能优化

## 前置知识

- 已完成前面章节的学习（特别是 Agent 基础、LLM 集成）
- 熟悉 React Hooks 和 Node.js/Express 基础
- 了解事件驱动编程概念
- 有使用过在线协作工具（如腾讯文档、Notion）的经验

## 核心概念

### 1. WebSocket：从"轮询"到"实时"的进化

#### 传统轮询 vs WebSocket

想象你在等快递：

- **HTTP 轮询**：每分钟打电话给快递公司问"到了吗"——浪费双方时间
- **长轮询**：打电话后保持通话，但快递员到了还要重新打——效率仍不高
- **WebSocket**：和快递员建立专线电话，双方随时说话——真正的实时

```
HTTP 轮询：  客户端 → 请求 → 服务端 → 响应 → 客户端（循环）
WebSocket：  客户端 ←→ 持久连接 ←→ 服务端（双向随时通信）
```

#### WebSocket 握手过程

```
客户端                    服务端
  │    HTTP Upgrade 请求    │
  │ ─────────────────────> │
  │    101 Switching       │
  │    Protocols           │
  │ <───────────────────── │
  │                        │
  │    WebSocket 连接建立   │
  │ <════════════════════> │
  │    （全双工通信开始）    │
```

**代码示例：原生 WebSocket**

```javascript
// 服务端 (Node.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('新客户端连接');
  
  ws.on('message', (message) => {
    console.log('收到:', message.toString());
    // 广播给所有客户端
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('客户端断开');
  });
});

// 客户端 (浏览器)
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('连接成功');
  ws.send('Hello Server!');
};

ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

ws.onerror = (error) => {
  console.error('连接错误:', error);
};

ws.onclose = () => {
  console.log('连接关闭');
};
```

### 2. Socket.io：WebSocket 的"升级版"

Socket.io 在 WebSocket 基础上提供了更多实用功能：

| 特性 | WebSocket | Socket.io |
|-----|-----------|-----------|
| 自动重连 | ❌ 手动实现 | ✅ 内置支持 |
| 房间管理 | ❌ 手动实现 | ✅ 原生支持 |
| 广播机制 | ❌ 手动实现 | ✅ io.emit() |
| 降级兼容 | ❌ 仅 WebSocket | ✅ 自动降级到长轮询 |
| 心跳检测 | ❌ 手动实现 | ✅ 自动 ping/pong |

#### Socket.io 核心概念

```
┌─────────────────────────────────────────────────┐
│                    Namespace                     │
│  (默认 "/", 可创建多个如 "/chat", "/game")        │
├─────────────────────────────────────────────────┤
│                      Room                        │
│  (房间，用户分组，如 "team-123", "project-456")   │
├─────────────────────────────────────────────────┤
│                    Socket                        │
│  (单个客户端连接，每个用户一个 Socket 实例)        │
└─────────────────────────────────────────────────┘
```

**代码示例：Socket.io 基础**

```javascript
// 服务端 (server.js)
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`用户 ${socket.id} 已连接`);
  
  // 加入房间
  socket.on('join-room', (roomId, userName) => {
    socket.join(roomId);
    socket.userName = userName;
    socket.roomId = roomId;
    
    // 通知房间内其他人
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: userName,
      message: `${userName} 加入了房间`
    });
    
    // 发送房间当前用户列表
    const roomUsers = [];
    io.sockets.adapter.rooms.get(roomId)?.forEach(socketId => {
      const userSocket = io.sockets.sockets.get(socketId);
      if (userSocket) {
        roomUsers.push({
          id: socketId,
          name: userSocket.userName
        });
      }
    });
    
    socket.emit('room-users', roomUsers);
  });
  
  // 处理消息
  socket.on('send-message', (data) => {
    const { roomId, message, type = 'user' } = data;
    
    // 广播给房间内所有人（包括自己）
    io.to(roomId).emit('new-message', {
      id: Date.now(),
      userId: socket.id,
      userName: socket.userName,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-left', {
        userId: socket.id,
        userName: socket.userName,
        message: `${socket.userName} 离开了房间`
      });
    }
    console.log(`用户 ${socket.id} 断开连接`);
  });
});

httpServer.listen(3001, () => {
  console.log('Socket.io 服务器运行在 http://localhost:3001');
});
```

```javascript
// 客户端 (React)
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function ChatRoom({ roomId, userName }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  useEffect(() => {
    // 建立连接
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    
    // 加入房间
    newSocket.emit('join-room', roomId, userName);
    
    // 监听事件
    newSocket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    newSocket.on('room-users', (roomUsers) => {
      setUsers(roomUsers);
    });
    
    newSocket.on('user-joined', (data) => {
      console.log(data.message);
    });
    
    newSocket.on('user-left', (data) => {
      console.log(data.message);
    });
    
    return () => {
      newSocket.close();
    };
  }, [roomId, userName]);
  
  const sendMessage = () => {
    if (inputMessage.trim() && socket) {
      socket.emit('send-message', {
        roomId,
        message: inputMessage
      });
      setInputMessage('');
    }
  };
  
  return (
    <div className="chat-room">
      <div className="users-list">
        <h3>在线用户 ({users.length})</h3>
        {users.map(user => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.userId === socket?.id ? 'mine' : ''}>
            <strong>{msg.userName}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>发送</button>
    </div>
  );
}
```

### 3. 多用户会话管理：隔离与广播

#### Room 机制详解

Room 是 Socket.io 提供的逻辑分组机制，用于实现会话隔离：

```javascript
// Room 操作 API
socket.join('room-123');           // 加入房间
socket.leave('room-123');          // 离开房间
socket.to('room-123').emit(...);   // 发给房间其他人（不包括自己）
io.to('room-123').emit(...);       // 发给房间所有人（包括自己）
io.in('room-123').emit(...);       // 同上

// 获取房间信息
const rooms = io.sockets.adapter.rooms;
const room = rooms.get('room-123'); // Set of socket ids
const roomSize = room?.size;         // 房间内人数
```

#### 广播策略对比

```javascript
// 1. 全局广播 - 所有连接的客户端
io.emit('announcement', '系统维护通知');

// 2. 命名空间广播 - 特定命名空间下的所有客户端
io.of('/chat').emit('update', '聊天室更新');

// 3. 房间广播 - 特定房间内的所有客户端
io.to('team-123').emit('message', '团队消息');

// 4. 排除发送者 - 房间内除自己外的所有人
socket.to('team-123').emit('typing', '有人正在输入...');

// 5. 多房间广播 - 同时发给多个房间
io.to('room-1').to('room-2').emit('event', 'data');

// 6. 单个客户端 - 特定 socket
io.to(socketId).emit('private', '私信');
socket.emit('direct', '直接发送'); // 等同于 socket.to(socket.id)
```

### 4. 协作编辑：光标同步与冲突处理

#### 光标同步实现

```javascript
// 服务端：转发光标位置
socket.on('cursor-move', (data) => {
  const { roomId, position, selection } = data;
  
  // 广播给房间内其他人
  socket.to(roomId).emit('cursor-update', {
    userId: socket.id,
    userName: socket.userName,
    userColor: socket.userColor, // 每个用户分配不同颜色
    position,    // { line: 5, ch: 10 }
    selection    // 选中的文本范围
  });
});

// 客户端：渲染远程光标
function RemoteCursors({ cursors }) {
  return (
    <div className="remote-cursors">
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="remote-cursor"
          style={{
            left: cursor.position.x,
            top: cursor.position.y,
            borderLeft: `2px solid ${cursor.userColor}`
          }}
        >
          <div 
            className="cursor-label"
            style={{ backgroundColor: cursor.userColor }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 冲突处理：OT 与 CRDT 算法

**操作转换（Operational Transformation, OT）**

想象两个人同时编辑文档：
- 用户 A 在第 1 行插入 "Hello"
- 用户 B 同时删除第 1 行

OT 算法会转换操作顺序，确保最终一致性：

```javascript
// 简化的 OT 实现
class OTEditor {
  constructor() {
    this.document = '';
    this.revision = 0;
    this.pendingOps = [];
  }
  
  // 本地操作
  applyLocal(operation) {
    this.document = this.transform(this.document, operation);
    this.revision++;
    return { ...operation, revision: this.revision };
  }
  
  // 远程操作 - 需要转换
  applyRemote(operation) {
    // 转换冲突的操作
    const transformedOp = this.transformOperation(operation, this.pendingOps);
    this.document = this.transform(this.document, transformedOp);
    this.revision++;
  }
  
  // 操作转换逻辑
  transformOperation(op1, op2) {
    // 插入 vs 插入：根据位置调整
    // 插入 vs 删除：调整索引
    // 删除 vs 删除：处理重叠
    // ... 复杂的转换规则
  }
}
```

**无冲突复制数据类型（CRDT）**

CRDT 是另一种思路，每个操作都是可交换、可结合的：

```javascript
// Yjs 库使用示例（工业级 CRDT 实现）
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 创建文档
const ydoc = new Y.Doc();

// 连接 WebSocket 同步
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'room-name',
  ydoc
);

// 共享文本
const ytext = ydoc.getText('content');

// 监听变化
ytext.observe(() => {
  console.log('文档更新:', ytext.toString());
});

// 本地编辑
ytext.insert(0, 'Hello ');
ytext.insert(6, 'World');

// 自动同步到所有连接的客户端
```

## 动手实战：开发「团队智能助手」

### 项目架构

```
team-ai-assistant/
├── server/
│   ├── package.json
│   ├── server.js          # Socket.io 服务器
│   ├── ai-service.js      # AI 服务集成
│   └── room-manager.js    # 房间管理
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── UserList.jsx
│   │   │   └── AIResponse.jsx
│   │   └── hooks/
│   │       └── useSocket.js
│   └── index.html
└── README.md
```

### 服务端完整代码

```javascript
// server/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  // 心跳配置
  pingTimeout: 60000,
  pingInterval: 25000
});

// 房间状态存储
const rooms = new Map();

// AI 服务模拟（实际项目中替换为真实 LLM API）
class AIService {
  async generateResponse(messages, roomContext) {
    // 模拟 AI 思考延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单的上下文感知回复
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    const responses = [
      `我注意到团队讨论了"${lastMessage.substring(0, 20)}..."，让我来分析一下...`,
      `基于当前对话上下文，我建议团队考虑以下几点...`,
      `这是一个很好的问题！从专业角度来看...`,
      `我可以帮你们整理一下思路。首先...`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  async streamResponse(messages, onChunk) {
    const response = await this.generateResponse(messages);
    const chunks = response.split(' ');
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100));
      onChunk(chunk + ' ');
    }
  }
}

const aiService = new AIService();

io.on('connection', (socket) => {
  console.log(`[连接] 用户 ${socket.id} 已连接`);
  
  // 用户加入房间
  socket.on('join-room', async ({ roomId, userName, userColor }) => {
    try {
      // 离开之前的房间
      if (socket.roomId) {
        socket.leave(socket.roomId);
      }
      
      // 加入新房间
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userName = userName;
      socket.userColor = userColor || generateUserColor();
      
      // 初始化房间
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          messages: [],
          aiContext: [],
          typingUsers: new Set()
        });
      }
      
      const room = rooms.get(roomId);
      
      // 发送历史消息
      socket.emit('room-joined', {
        roomId,
        messages: room.messages,
        yourSocketId: socket.id
      });
      
      // 通知其他人
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName: socket.userName,
        userColor: socket.userColor,
        timestamp: new Date().toISOString()
      });
      
      // 发送在线用户列表
      broadcastUserList(roomId);
      
      console.log(`[房间] ${userName} 加入房间 ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: '加入房间失败', details: error.message });
    }
  });
  
  // 发送消息
  socket.on('send-message', async ({ content, mentions = [] }) => {
    try {
      const roomId = socket.roomId;
      if (!roomId) {
        socket.emit('error', { message: '未加入房间' });
        return;
      }
      
      const room = rooms.get(roomId);
      const message = {
        id: `msg_${Date.now()}_${socket.id}`,
        userId: socket.id,
        userName: socket.userName,
        userColor: socket.userColor,
        content,
        mentions,
        timestamp: new Date().toISOString(),
        type: 'user'
      };
      
      // 保存消息
      room.messages.push(message);
      
      // 广播给房间所有人
      io.to(roomId).emit('new-message', message);
      
      // 更新 AI 上下文
      room.aiContext.push({
        role: 'user',
        content: `${socket.userName}: ${content}`
      });
      
      // 检查是否需要 AI 响应（@AI 或消息包含 AI 关键词）
      if (mentions.includes('AI') || content.includes('@AI')) {
        await handleAIResponse(roomId, room);
      }
      
    } catch (error) {
      socket.emit('error', { message: '发送消息失败', details: error.message });
    }
  });
  
  // 正在输入
  socket.on('typing', ({ isTyping }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (isTyping) {
      room.typingUsers.add(socket.userName);
    } else {
      room.typingUsers.delete(socket.userName);
    }
    
    // 广播输入状态
    socket.to(roomId).emit('typing-update', {
      users: Array.from(room.typingUsers)
    });
  });
  
  // 光标位置同步
  socket.on('cursor-move', ({ position, selection }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    socket.to(roomId).emit('cursor-update', {
      userId: socket.id,
      userName: socket.userName,
      userColor: socket.userColor,
      position,
      selection,
      timestamp: new Date().toISOString()
    });
  });
  
  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`[断开] 用户 ${socket.id} 断开连接，原因: ${reason}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.typingUsers.delete(socket.userName);
      }
      
      socket.to(socket.roomId).emit('user-left', {
        userId: socket.id,
        userName: socket.userName,
        timestamp: new Date().toISOString()
      });
      
      broadcastUserList(socket.roomId);
    }
  });
  
  // AI 响应处理
  async function handleAIResponse(roomId, room) {
    const aiMessageId = `ai_${Date.now()}`;
    
    // 发送 AI "正在输入" 状态
    io.to(roomId).emit('ai-typing', { isTyping: true, messageId: aiMessageId });
    
    try {
      // 流式生成回复
      let fullResponse = '';
      
      await aiService.streamResponse(room.aiContext, (chunk) => {
        fullResponse += chunk;
        
        // 实时发送流式内容
        io.to(roomId).emit('ai-stream', {
          messageId: aiMessageId,
          chunk,
          content: fullResponse
        });
      });
      
      // 完成 AI 消息
      const aiMessage = {
        id: aiMessageId,
        userId: 'AI',
        userName: 'AI 助手',
        userColor: '#10B981',
        content: fullResponse,
        timestamp: new Date().toISOString(),
        type: 'ai'
      };
      
      room.messages.push(aiMessage);
      room.aiContext.push({
        role: 'assistant',
        content: fullResponse
      });
      
      io.to(roomId).emit('ai-complete', {
        message: aiMessage
      });
      
    } catch (error) {
      console.error('AI 响应错误:', error);
      io.to(roomId).emit('ai-error', {
        messageId: aiMessageId,
        error: 'AI 响应失败，请稍后重试'
      });
    } finally {
      io.to(roomId).emit('ai-typing', { isTyping: false });
    }
  }
  
  // 广播用户列表
  function broadcastUserList(roomId) {
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const users = [];
    
    if (roomSockets) {
      roomSockets.forEach(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket) {
          users.push({
            id: socketId,
            name: userSocket.userName,
            color: userSocket.userColor
          });
        }
      });
    }
    
    io.to(roomId).emit('users-update', users);
  }
  
  // 生成用户颜色
  function generateUserColor() {
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
      '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
});

// HTTP API 端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

app.get('/api/rooms/:roomId/info', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  res.json({
    messageCount: room.messages.length,
    userCount: io.sockets.adapter.rooms.get(req.params.roomId)?.size || 0
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 团队智能助手服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
});
```

### 客户端完整代码

```javascript
// client/src/hooks/useSocket.js
import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(serverUrl) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'], // 自动降级
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket 连接成功:', socket.id);
      setIsConnected(true);
      setError(null);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket 断开:', reason);
      setIsConnected(false);
    });
    
    socket.on('connect_error', (err) => {
      console.error('连接错误:', err);
      setError(err.message);
    });
    
    socket.on('error', (err) => {
      console.error('服务器错误:', err);
      setError(err.message);
    });
    
    return () => {
      socket.close();
    };
  }, [serverUrl]);
  
  const joinRoom = useCallback((roomId, userName) => {
    const userColor = generateUserColor();
    socketRef.current?.emit('join-room', { roomId, userName, userColor });
  }, []);
  
  const sendMessage = useCallback((content, mentions = []) => {
    socketRef.current?.emit('send-message', { content, mentions });
  }, []);
  
  const sendTyping = useCallback((isTyping) => {
    socketRef.current?.emit('typing', { isTyping });
  }, []);
  
  const sendCursorMove = useCallback((position, selection) => {
    socketRef.current?.emit('cursor-move', { position, selection });
  }, []);
  
  const onEvent = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);
  
  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinRoom,
    sendMessage,
    sendTyping,
    sendCursorMove,
    onEvent
  };
}

function generateUserColor() {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

```jsx
// client/src/components/ChatRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

export function ChatRoom({ roomId, userName }) {
  const {
    isConnected,
    error,
    joinRoom,
    sendMessage,
    sendTyping,
    onEvent
  } = useSocket('http://localhost:3001');
  
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // 加入房间
  useEffect(() => {
    if (isConnected && roomId && userName) {
      joinRoom(roomId, userName);
    }
  }, [isConnected, roomId, userName, joinRoom]);
  
  // 监听事件
  useEffect(() => {
    const unsubscribers = [];
    
    // 房间加入成功
    unsubscribers.push(onEvent('room-joined', ({ messages: historyMessages }) => {
      setMessages(historyMessages);
    }));
    
    // 新消息
    unsubscribers.push(onEvent('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    }));
    
    // 用户列表更新
    unsubscribers.push(onEvent('users-update', (users) => {
      setUsers(users);
    }));
    
    // 输入状态
    unsubscribers.push(onEvent('typing-update', ({ users }) => {
      setTypingUsers(users.filter(u => u !== userName));
    }));
    
    // AI 输入状态
    unsubscribers.push(onEvent('ai-typing', ({ isTyping }) => {
      setAiTyping(isTyping);
    }));
    
    // AI 流式响应
    unsubscribers.push(onEvent('ai-stream', ({ messageId, content }) => {
      setStreamingContent(prev => ({
        ...prev,
        [messageId]: content
      }));
    }));
    
    // AI 完成
    unsubscribers.push(onEvent('ai-complete', ({ message }) => {
      setStreamingContent(prev => {
        const newState = { ...prev };
        delete newState[message.id];
        return newState;
      });
      setMessages(prev => [...prev, message]);
    }));
    
    return () => {
      unsubscribers.forEach(unsub => unsub?.());
    };
  }, [onEvent, userName]);
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);
  
  // 处理输入
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // 发送输入状态
    sendTyping(true);
    
    // 3秒后清除输入状态
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 3000);
  };
  
  // 发送消息
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    
    // 检测 @AI
    const mentions = inputValue.includes('@AI') ? ['AI'] : [];
    
    sendMessage(inputValue, mentions);
    setInputValue('');
    sendTyping(false);
    clearTimeout(typingTimeoutRef.current);
  }, [inputValue, sendMessage, sendTyping]);
  
  // 按 Enter 发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // 渲染消息
  const renderMessage = (msg) => {
    const isAI = msg.type === 'ai';
    const isMe = msg.userName === userName;
    const streamingText = streamingContent[msg.id];
    
    return (
      <div
        key={msg.id}
        className={`message ${isMe ? 'message-mine' : ''} ${isAI ? 'message-ai' : ''}`}
      >
        <div className="message-header">
          <span 
            className="message-avatar"
            style={{ backgroundColor: msg.userColor }}
          >
            {msg.userName[0].toUpperCase()}
          </span>
          <span className="message-author">{msg.userName}</span>
          <span className="message-time">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="message-content">
          {streamingText || msg.content}
          {streamingText && <span className="cursor-blink">▋</span>}
        </div>
      </div>
    );
  };
  
  return (
    <div className="chat-room">
      {/* 头部 */}
      <div className="chat-header">
        <h2>房间: {roomId}</h2>
        <div className="connection-status">
          {isConnected ? '🟢 已连接' : '🔴 未连接'}
          {error && <span className="error">({error})</span>}
        </div>
      </div>
      
      {/* 主区域 */}
      <div className="chat-main">
        {/* 用户列表 */}
        <div className="users-sidebar">
          <h3>在线用户 ({users.length})</h3>
          <ul>
            {users.map(user => (
              <li key={user.id} className={user.name === userName ? 'me' : ''}>
                <span 
                  className="user-dot"
                  style={{ backgroundColor: user.color }}
                />
                {user.name} {user.name === userName && '(我)'}
              </li>
            ))}
          </ul>
        </div>
        
        {/* 消息区域 */}
        <div className="messages-container">
          <div className="messages-list">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 输入区域 */}
          <div className="input-area">
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.join(', ')} 正在输入...
              </div>
            )}
            {aiTyping && (
              <div className="ai-typing">
                🤖 AI 正在思考...
              </div>
            )}
            <div className="input-row">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="输入消息... 使用 @AI 召唤智能助手"
                disabled={!isConnected}
              />
              <button 
                onClick={handleSend}
                disabled={!isConnected || !inputValue.trim()}
              >
                发送
              </button>
            </div>
            <div className="input-hint">
              提示: 输入 @AI 让智能助手参与讨论
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

```css
/* client/src/styles/chat.css */
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1a1a2e;
  color: white;
  border-bottom: 1px solid #333;
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
}

.connection-status {
  font-size: 14px;
}

.connection-status .error {
  color: #ff6b6b;
  margin-left: 8px;
}

.chat-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.users-sidebar {
  width: 200px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 16px;
}

.users-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.users-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.users-sidebar li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.users-sidebar li.me {
  font-weight: 600;
  color: #3b82f6;
}

.user-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  max-width: 80%;
}

.message-mine {
  margin-left: auto;
  text-align: right;
}

.message-ai {
  background: #f0fdf4;
  border-left: 3px solid #10b981;
  padding: 12px;
  border-radius: 8px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-mine .message-header {
  justify-content: flex-end;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.message-author {
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin-left: 36px;
}

.message-mine .message-content {
  margin-left: 0;
  margin-right: 36px;
}

.cursor-blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.input-area {
  border-top: 1px solid #e9ecef;
  padding: 16px;
  background: white;
}

.typing-indicator,
.ai-typing {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-style: italic;
}

.ai-typing {
  color: #10b981;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input-row input:focus {
  border-color: #3b82f6;
}

.input-row button {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.input-row button:hover:not(:disabled) {
  background: #2563eb;
}

.input-row button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}
```

### 运行项目

```bash
# 服务端
cd server
npm init -y
npm install express socket.io cors
node server.js

# 客户端
cd client
npm create vite@latest . -- --template react
npm install
npm install socket.io-client
# 将上述代码复制到对应文件
npm run dev
```

## 避坑指南

### 1. WebSocket 连接失败

**问题**：生产环境 WebSocket 连接失败，开发环境正常

**原因**：
- 防火墙/代理阻止 WebSocket
- Nginx 未配置 WebSocket 支持
- SSL/TLS 证书问题

**解决**：
```nginx
# Nginx 配置
location /socket.io/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 关键：WebSocket 超时设置
    proxy_read_timeout 86400;
}
```

### 2. 消息丢失

**问题**：用户发送的消息对方收不到

**原因**：
- 客户端在消息发送时断开连接
- 没有实现消息确认机制

**解决**：
```javascript
// 实现消息确认
socket.emit('send-message', data, (ack) => {
  if (ack.success) {
    console.log('消息已送达');
  } else {
    console.error('消息发送失败，重试...');
    // 实现重试逻辑
  }
});

// 服务端
socket.on('send-message', (data, callback) => {
  try {
    // 处理消息
    io.to(roomId).emit('new-message', message);
    callback({ success: true });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});
```

### 3. 内存泄漏

**问题**：服务器运行一段时间后内存暴涨

**原因**：
- 未清理断开的 socket 引用
- 房间消息无限增长
- 事件监听器未移除

**解决**：
```javascript
// 限制房间消息数量
const MAX_MESSAGES = 1000;

if (room.messages.length > MAX_MESSAGES) {
  room.messages = room.messages.slice(-MAX_MESSAGES);
}

// 定期清理空房间
setInterval(() => {
  rooms.forEach((room, roomId) => {
    const socketCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    if (socketCount === 0) {
      rooms.delete(roomId);
      console.log(`清理空房间: ${roomId}`);
    }
  });
}, 60000); // 每分钟检查
```

### 4. 并发冲突

**问题**：多人同时编辑时出现内容覆盖

**解决**：使用 Yjs 等 CRDT 库
```javascript
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const ytext = ydoc.getText('content');

// 所有操作自动合并，无需锁机制
ytext.insert(0, 'A');
ytext.insert(1, 'B'); // 自动处理并发插入
```

## 面试考点

### Q1: WebSocket vs SSE，如何选择？

**答案要点**：

| 特性 | WebSocket | SSE (Server-Sent Events) |
|-----|-----------|--------------------------|
| 通信方向 | 全双工（双向） | 单工（服务器→客户端） |
| 协议基础 | TCP 独立协议 | HTTP 长连接 |
| 浏览器支持 | 现代浏览器 | 更好的兼容性 |
| 自动重连 | 需手动实现 | 浏览器自动处理 |
| 适用场景 | 聊天、游戏、协作编辑 | 股票行情、日志推送 |

**选择建议**：
- 需要双向通信 → WebSocket
- 仅需服务器推送 → SSE（更简单）
- 需要高兼容性 → SSE

### Q2: 如何处理协作编辑的冲突？

**答案要点**：

1. **OT（操作转换）**：
   - 维护操作历史队列
   - 对并发操作进行转换
   - 需要中央服务器协调
   - 代表：Google Docs

2. **CRDT（无冲突复制数据类型）**：
   - 数学上保证最终一致性
   - 无需中央服务器
   - 支持点对点同步
   - 代表：Yjs, Automerge

3. **快照+合并**：
   - 定期保存文档快照
   - 冲突时展示差异让用户选择
   - 代表：Git

### Q3: 实时系统如何设计才能支持万级并发？

**答案要点**：

1. **水平扩展**：
   - 使用 Redis Adapter 实现多服务器 Socket.io
   - 负载均衡器支持 WebSocket（ip_hash  sticky session）

2. **连接优化**：
   - 使用 uWebSockets（C++ 实现，性能提升 10 倍）
   - 连接池管理
   - 心跳优化

3. **消息优化**：
   - 消息队列（Redis/RabbitMQ）削峰
   - 批量发送消息
   - 二进制协议（MessagePack）

4. **架构分层**：
   ```
   客户端 → CDN → LB → Socket 服务器 → 消息队列 → 业务服务
                ↓
             Redis (状态同步)
   ```

### Q4: Socket.io 的 Room 和 Namespace 有什么区别？

**答案要点**：

- **Namespace**：逻辑上的协议分隔，不同 Namespace 完全隔离，需要单独建立连接
- **Room**：同一个 Namespace 内的分组，一个 Socket 可以同时加入多个 Room

```javascript
// Namespace - 完全隔离
const chatIO = io.of('/chat');
const gameIO = io.of('/game');

// Room - 灵活分组
socket.join('room-1');
socket.join('room-2');
```

### Q5: 如何保证消息的有序性？

**答案要点**：

1. **服务端序列号**：每条消息附带全局递增序列号
2. **客户端缓冲排序**：收到乱序消息时缓冲，按序号排序后处理
3. **向量时钟**：分布式场景下使用向量时钟确定因果关系

```javascript
// 简单实现
let messageSequence = 0;

function sendOrderedMessage(roomId, content) {
  const message = {
    id: ++messageSequence,
    content,
    timestamp: Date.now()
  };
  io.to(roomId).emit('message', message);
}

// 客户端处理
const messageBuffer = new Map();
let lastProcessedId = 0;

socket.on('message', (msg) => {
  if (msg.id === lastProcessedId + 1) {
    processMessage(msg);
    lastProcessedId = msg.id;
    
    // 处理缓冲中的连续消息
    while (messageBuffer.has(lastProcessedId + 1)) {
      const nextMsg = messageBuffer.get(lastProcessedId + 1);
      processMessage(nextMsg);
      messageBuffer.delete(lastProcessedId + 1);
      lastProcessedId++;
    }
  } else {
    // 乱序，放入缓冲
    messageBuffer.set(msg.id, msg);
  }
});
```

## 扩展阅读

- [Socket.io 官方文档](https://socket.io/docs/v4/)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Yjs CRDT 文档](https://docs.yjs.dev/)
- [Operational Transformation 算法](https://operational-transformation.github.io/)
- [Socket.io Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [Scaling WebSocket 最佳实践](https://medium.com/@socketio_/socket-io-scale-up-5b4bfe2de2e5)

## 课后练习

1. **基础练习**：在团队智能助手中添加"消息编辑"功能，支持用户在发送后 2 分钟内编辑自己的消息，并实时同步给所有房间成员。

2. **进阶练习**：实现"在线状态"功能，显示用户"在线/离开/忙碌"三种状态，支持用户手动切换状态。

3. **综合练习**：使用 Yjs 替换现有的消息系统，实现真正的协作编辑功能，支持多人同时编辑同一条消息。

4. **性能优化**：为当前项目添加 Redis Adapter，实现多服务器部署时的状态同步。

5. **安全加固**：实现 JWT 身份验证，确保只有授权用户才能加入房间；添加消息内容过滤，防止 XSS 攻击。

---

恭喜完成第 14 章学习！现在你已经掌握了构建实时协作 Agent 应用的核心技能。下一章我们将探索 Agent 的部署与运维，学习如何将你的应用部署到生产环境。
