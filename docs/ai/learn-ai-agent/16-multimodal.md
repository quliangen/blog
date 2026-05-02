---
title: 16-多模态 Agent：图像与语音集成
description: 图像理解，语音转文本，多模态应用场景
---

# 16-多模态 Agent：图像与语音集成

## 岗位能力对标

| 招聘要求 | 本节覆盖 |
|---------|---------|
| 多模态模型集成 | ✅ GPT-4V/Claude 3 Vision API |
| 图像理解与生成 | ✅ 图像描述、OCR、视觉问答 |
| 语音处理能力 | ✅ Whisper STT / TTS 集成 |
| 多模态应用场景设计 | ✅ 智能客服、内容创作、辅助决策 |
| 成本优化能力 | ✅ 模型选型、缓存策略、降本方案 |

## 学习目标

学完本节，你将能够：

1. **掌握图像理解技术**：使用多模态大模型进行图像描述、OCR、视觉问答
2. **实现语音交互**：集成语音识别(STT)和语音合成(TTS)能力
3. **设计多模态架构**：构建支持图文音视频的Agent系统
4. **优化成本与性能**：选择合适的模型、设计缓存策略
5. **开发实战项目**：构建「能看图说话的Agent」

## 前置知识

- 已完成前面章节的学习
- 熟悉 Python/Node.js 基础
- 了解 RESTful API 和 WebSocket
- 具备基本的图像/音频处理概念

## 核心概念

### 1. 多模态模型概述

多模态模型能够同时处理和理解多种类型的数据（文本、图像、音频、视频）。

```
┌─────────────────────────────────────────────────────────┐
│                    多模态大模型                          │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   文本输入   │   图像输入   │   音频输入   │    视频输入    │
│  (Text)     │  (Image)    │  (Audio)    │   (Video)     │
├─────────────┴─────────────┴─────────────┴───────────────┤
│              统一编码器 (Unified Encoder)                 │
├─────────────────────────────────────────────────────────┤
│              多模态理解与生成功能                         │
│  • 图像描述  • 视觉问答  • 语音转文本  • 视频理解        │
│  • 图像生成  • 图文检索  • 文本转语音  • 跨模态检索      │
└─────────────────────────────────────────────────────────┘
```

**主流多模态模型对比：**

| 模型 | 厂商 | 图像理解 | 语音处理 | 视频理解 | 特点 |
|-----|------|---------|---------|---------|------|
| GPT-4V | OpenAI | ✅ | ❌ | ❌ | 最强图像理解，支持复杂推理 |
| Claude 3 | Anthropic | ✅ | ❌ | ❌ | 视觉能力强，安全性高 |
| Gemini Pro Vision | Google | ✅ | ✅ | ✅ | 原生多模态，支持视频 |
| Qwen-VL | 阿里 | ✅ | ❌ | ❌ | 中文优化，开源 |
| LLaVA | 开源 | ✅ | ❌ | ❌ | 开源可部署，成本低 |

### 2. 图像理解技术栈

#### 2.1 图像描述 (Image Captioning)

```python
import openai
import base64

# 将图像转为 base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# 使用 GPT-4V 进行图像描述
def describe_image(image_path):
    base64_image = encode_image(image_path)
    
    response = openai.ChatCompletion.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请详细描述这张图片的内容"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=500
    )
    
    return response.choices[0].message.content
```

#### 2.2 OCR 文字识别

```python
def extract_text_from_image(image_path):
    """从图片中提取文字"""
    base64_image = encode_image(image_path)
    
    response = openai.ChatCompletion.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请提取图片中的所有文字，保持原有格式"},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    }
                ]
            }
        ]
    )
    
    return response.choices[0].message.content
```

#### 2.3 视觉问答 (Visual Question Answering)

```python
def visual_qa(image_path, question):
    """视觉问答 - 根据图片回答问题"""
    base64_image = encode_image(image_path)
    
    response = openai.ChatCompletion.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    }
                ]
            }
        ]
    )
    
    return response.choices[0].message.content

# 使用示例
answer = visual_qa("chart.png", "这张图表显示的趋势是什么？最大值是多少？")
```

### 3. 语音处理技术栈

#### 3.1 语音转文本 (STT - Speech to Text)

```python
import openai

def speech_to_text(audio_file_path, language="zh"):
    """使用 Whisper 进行语音识别"""
    with open(audio_file_path, "rb") as audio_file:
        transcript = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            language=language,
            response_format="text"
        )
    return transcript

# 带时间戳的版本
def speech_to_text_with_timestamps(audio_file_path):
    """获取带时间戳的转录结果"""
    with open(audio_file_path, "rb") as audio_file:
        transcript = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            response_format="srt"  # 或 "vtt" 用于字幕格式
        )
    return transcript
```

#### 3.2 文本转语音 (TTS - Text to Speech)

```python
def text_to_speech(text, output_path="output.mp3", voice="alloy"):
    """使用 OpenAI TTS 合成语音"""
    # 可选声音: alloy, echo, fable, onyx, nova, shimmer
    response = openai.Audio.speech.create(
        model="tts-1",  # 或 tts-1-hd 用于更高质量
        voice=voice,
        input=text
    )
    
    response.stream_to_file(output_path)
    return output_path

# 中文优化版本
def text_to_speech_chinese(text, output_path="output.mp3"):
    """针对中文优化的语音合成"""
    response = openai.Audio.speech.create(
        model="tts-1",
        voice="nova",  # nova 对中文支持较好
        input=text,
        speed=1.0  # 语速调节
    )
    response.stream_to_file(output_path)
    return output_path
```

### 4. 多模态 Agent 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      用户交互层                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  文本输入 │  │  图片上传 │  │  语音输入 │  │    视频输入      │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
└───────┼────────────┼────────────┼────────────────┼──────────┘
        │            │            │                │
        └────────────┴────────────┴────────────────┘
                           │
                    ┌──────▼──────┐
                    │  输入处理器  │
                    │  Input Proc │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ 图像理解 │       │ 语音识别 │       │ 文本理解 │
   │ Vision  │       │  STT    │       │  Text   │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  多模态融合  │
                    │  Fusion     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  大模型推理  │
                    │  LLM Core   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ 文本输出 │       │ 图像生成 │       │ 语音合成 │
   │  Text   │       │  Image  │       │   TTS   │
   └─────────┘       └─────────┘       └─────────┘
```

## 动手实战

### 实战：开发「能看图说话的 Agent」

我们将开发一个多模态 Agent，能够：
1. 接收用户上传的图片
2. 理解图片内容
3. 用语音回答用户关于图片的问题

#### 项目结构

```
multimodal-agent/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 主应用
│   ├── models.py            # 数据模型
│   ├── services/
│   │   ├── __init__.py
│   │   ├── vision.py        # 图像理解服务
│   │   ├── speech.py        # 语音处理服务
│   │   └── agent.py         # Agent 核心逻辑
│   └── utils/
│       ├── __init__.py
│       └── file_handler.py  # 文件处理工具
├── static/
│   └── uploads/             # 上传文件存储
├── requirements.txt
└── README.md
```

#### 核心代码实现

**1. 图像理解服务 (services/vision.py)**

```python
import base64
import httpx
from typing import Optional, List
from dataclasses import dataclass

@dataclass
class VisionResult:
    description: str
    objects: List[str]
    text_content: Optional[str] = None

class VisionService:
    """图像理解服务 - 封装 GPT-4V API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openai.com/v1"
    
    def _encode_image(self, image_path: str) -> str:
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    
    async def analyze_image(
        self, 
        image_path: str, 
        prompt: str = "请详细描述这张图片"
    ) -> str:
        """分析单张图片"""
        base64_image = self._encode_image(image_path)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": "gpt-4-vision-preview",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 1000
                },
                timeout=60.0
            )
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def extract_objects(self, image_path: str) -> List[str]:
        """提取图片中的主要对象"""
        prompt = """请列出图片中的所有主要对象，以JSON数组格式返回。
        例如：["猫", "沙发", "窗户"]"""
        
        result = await self.analyze_image(image_path, prompt)
        # 解析 JSON 结果
        import json
        try:
            return json.loads(result)
        except:
            return result.split(", ")
    
    async def ocr(self, image_path: str) -> str:
        """OCR 文字识别"""
        prompt = "请提取图片中的所有文字，保持原有排版格式。如果没有文字请返回'无文字'。"
        return await self.analyze_image(image_path, prompt)
```

**2. 语音处理服务 (services/speech.py)**

```python
import openai
from pathlib import Path
from typing import Literal

VoiceType = Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

class SpeechService:
    """语音处理服务 - STT & TTS"""
    
    def __init__(self, api_key: str):
        openai.api_key = api_key
        self.client = openai.OpenAI(api_key=api_key)
    
    async def speech_to_text(
        self, 
        audio_path: str, 
        language: str = "zh"
    ) -> str:
        """语音转文本"""
        with open(audio_path, "rb") as audio_file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="text"
            )
        return transcript
    
    async def text_to_speech(
        self,
        text: str,
        output_path: str,
        voice: VoiceType = "nova",
        speed: float = 1.0
    ) -> str:
        """文本转语音"""
        response = self.client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            speed=speed
        )
        
        response.stream_to_file(output_path)
        return output_path
    
    async def transcribe_with_timestamps(
        self,
        audio_path: str,
        format_type: Literal["srt", "vtt", "json"] = "json"
    ) -> str:
        """带时间戳的转录"""
        with open(audio_path, "rb") as audio_file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format=format_type
            )
        return transcript
```

**3. Agent 核心逻辑 (services/agent.py)**

```python
from typing import Optional, AsyncGenerator
import asyncio
from dataclasses import dataclass
from .vision import VisionService
from .speech import SpeechService

@dataclass
class MultimodalRequest:
    text: Optional[str] = None
    image_path: Optional[str] = None
    audio_path: Optional[str] = None
    session_id: str = ""

@dataclass
class MultimodalResponse:
    text: str
    audio_path: Optional[str] = None
    image_description: Optional[str] = None

class MultimodalAgent:
    """能看图说话的多模态 Agent"""
    
    def __init__(self, api_key: str, openai_key: str):
        self.vision = VisionService(api_key)
        self.speech = SpeechService(openai_key)
        self.sessions = {}  # 会话历史存储
    
    async def process(
        self, 
        request: MultimodalRequest
    ) -> MultimodalResponse:
        """处理多模态请求"""
        
        # 1. 处理语音输入
        user_text = request.text
        if request.audio_path:
            user_text = await self.speech.speech_to_text(request.audio_path)
        
        # 2. 处理图像输入
        image_desc = None
        if request.image_path:
            image_desc = await self.vision.analyze_image(
                request.image_path,
                prompt=f"用户问：{user_text or '请描述这张图片'}。请详细回答。"
            )
        
        # 3. 构建上下文
        context = self._build_context(request.session_id, user_text, image_desc)
        
        # 4. 生成回复
        response_text = await self._generate_response(context)
        
        # 5. 合成语音回复
        audio_output = None
        if response_text:
            audio_output = f"static/uploads/response_{request.session_id}.mp3"
            await self.speech.text_to_speech(response_text, audio_output)
        
        return MultimodalResponse(
            text=response_text,
            audio_path=audio_output,
            image_description=image_desc
        )
    
    def _build_context(
        self, 
        session_id: str, 
        user_text: Optional[str],
        image_desc: Optional[str]
    ) -> str:
        """构建对话上下文"""
        context_parts = []
        
        if image_desc:
            context_parts.append(f"[图片内容] {image_desc}")
        
        if user_text:
            context_parts.append(f"[用户提问] {user_text}")
        
        return "\n".join(context_parts)
    
    async def _generate_response(self, context: str) -> str:
        """调用 LLM 生成回复"""
        from openai import AsyncOpenAI
        client = AsyncOpenAI()
        
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "你是一个 helpful 的多模态助手。根据提供的图片内容和用户问题给出详细回答。"
                },
                {"role": "user", "content": context}
            ]
        )
        
        return response.choices[0].message.content
    
    async def stream_process(
        self,
        request: MultimodalRequest
    ) -> AsyncGenerator[str, None]:
        """流式处理 - 用于实时响应"""
        # 先处理图像
        if request.image_path:
            image_desc = await self.vision.analyze_image(request.image_path)
            yield f"[IMAGE_DESC]{image_desc}"
        
        # 流式生成文本回复
        # ... 实现流式 LLM 调用
```

**4. FastAPI 主应用 (main.py)**

```python
from fastapi import FastAPI, File, UploadFile, Form, WebSocket
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional
import uuid
import os

from app.services.agent import MultimodalAgent, MultimodalRequest

app = FastAPI(title="多模态 Agent 服务")

# 静态文件服务
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 初始化 Agent
agent = MultimodalAgent(
    api_key=os.getenv("OPENAI_API_KEY"),
    openai_key=os.getenv("OPENAI_API_KEY")
)

@app.post("/api/chat")
async def multimodal_chat(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    session_id: str = Form(default_factory=lambda: str(uuid.uuid4()))
):
    """多模态对话接口"""
    
    image_path = None
    audio_path = None
    
    # 保存上传的文件
    if image:
        image_path = f"static/uploads/{session_id}_image.jpg"
        with open(image_path, "wb") as f:
            content = await image.read()
            f.write(content)
    
    if audio:
        audio_path = f"static/uploads/{session_id}_audio.mp3"
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
    
    # 构建请求
    request = MultimodalRequest(
        text=text,
        image_path=image_path,
        audio_path=audio_path,
        session_id=session_id
    )
    
    # 处理请求
    response = await agent.process(request)
    
    return {
        "text": response.text,
        "image_description": response.image_description,
        "audio_url": f"/static/uploads/response_{session_id}.mp3" 
                      if response.audio_path else None
    }

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    """获取语音文件"""
    file_path = f"static/uploads/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return {"error": "File not found"}

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket 实时对话"""
    await websocket.accept()
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_json()
            
            request = MultimodalRequest(
                text=data.get("text"),
                image_path=data.get("image_path"),
                session_id=data.get("session_id", str(uuid.uuid4()))
            )
            
            # 流式返回结果
            async for chunk in agent.stream_process(request):
                await websocket.send_text(chunk)
                
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**5. 前端示例 (React)**

```jsx
import React, { useState, useRef } from 'react';

function MultimodalChat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // 发送消息
  const sendMessage = async () => {
    const formData = new FormData();
    if (inputText) formData.append('text', inputText);
    if (image) formData.append('image', image);

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    setMessages(prev => [...prev, 
      { type: 'user', content: inputText, image: image && URL.createObjectURL(image) },
      { type: 'bot', content: data.text, audio: data.audio_url }
    ]);

    setInputText('');
    setImage(null);
  };

  // 语音录制
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    
    const chunks = [];
    mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/mp3' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.mp3');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      // 处理响应...
    };
    
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            {msg.image && <img src={msg.image} alt="uploaded" />}
            <p>{msg.content}</p>
            {msg.audio && <audio controls src={msg.audio} />}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => setImage(e.target.files[0])}
          style={{ display: 'none' }}
        />
        
        <button onClick={() => fileInputRef.current?.click()}>
          📷 上传图片
        </button>
        
        <button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? '⏹️ 停止' : '🎤 语音'}
        </button>
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入问题..."
        />
        
        <button onClick={sendMessage}>发送</button>
      </div>
    </div>
  );
}

export default MultimodalChat;
```

### 多模态应用场景实战

#### 场景1：智能客服 Agent

```python
class CustomerServiceAgent:
    """电商智能客服 - 支持图片问答"""
    
    async def handle_product_inquiry(
        self, 
        product_image: str, 
        user_question: str
    ) -> dict:
        """处理商品咨询"""
        
        # 1. 识别商品
        vision_result = await self.vision.analyze_image(
            product_image,
            prompt="识别商品类别、品牌、主要特征，以JSON格式返回"
        )
        
        # 2. 查询商品信息
        product_info = await self.search_product(vision_result)
        
        # 3. 回答用户问题
        answer = await self.generate_answer(
            product_info=product_info,
            question=user_question
        )
        
        # 4. 生成语音回复
        audio = await self.speech.text_to_speech(answer)
        
        return {
            "answer": answer,
            "audio": audio,
            "product_info": product_info
        }
```

#### 场景2：教育辅助 Agent

```python
class EducationAgent:
    """教育助手 - 拍照解题、语音讲解"""
    
    async def solve_problem(self, problem_image: str) -> dict:
        """拍照解题"""
        
        # 1. OCR 识别题目
        problem_text = await self.vision.ocr(problem_image)
        
        # 2. 理解题目类型
        analysis = await self.vision.analyze_image(
            problem_image,
            prompt="这是什么类型的题目？涉及哪些知识点？"
        )
        
        # 3. 生成解答
        solution = await self.llm.generate_solution(
            problem=problem_text,
            analysis=analysis
        )
        
        # 4. 语音讲解
        explanation = await self.speech.text_to_speech(
            solution,
            voice="fable",  # 教育场景适合 fable 声音
            speed=0.9  # 稍慢语速便于理解
        )
        
        return {
            "problem": problem_text,
            "solution": solution,
            "explanation": explanation
        }
```

#### 场景3：医疗影像辅助 Agent

```python
class MedicalVisionAgent:
    """医疗影像辅助诊断 Agent"""
    
    async def analyze_medical_image(
        self, 
        image_path: str,
        image_type: str  # "xray", "ct", "mri", "dermatology"
    ) -> dict:
        """分析医疗影像"""
        
        prompts = {
            "xray": "分析这张X光片，描述可见的解剖结构和任何异常",
            "ct": "分析这张CT扫描，描述发现的任何异常",
            "dermatology": "分析这张皮肤病变图片，描述形态特征"
        }
        
        analysis = await self.vision.analyze_image(
            image_path,
            prompt=prompts.get(image_type, "分析这张医学影像")
        )
        
        # 生成结构化报告
        report = await self.generate_medical_report(analysis)
        
        return {
            "analysis": analysis,
            "report": report,
            "disclaimer": "本分析仅供参考，不能替代专业医疗诊断"
        }
```

## 避坑指南

### 常见错误 1：图像过大导致 API 失败

```python
# ❌ 错误：直接上传大图片
with open("huge_image.jpg", "rb") as f:
    image_data = f.read()  # 可能几十MB

# ✅ 正确：压缩图片后再上传
from PIL import Image
import io

def compress_image(image_path, max_size=(1024, 1024), quality=85):
    """压缩图片以适应 API 限制"""
    img = Image.open(image_path)
    
    # 调整尺寸
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # 转换为 RGB（去除透明度）
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    
    # 保存为字节流
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=quality)
    buffer.seek(0)
    
    return buffer

# 使用压缩后的图片
compressed = compress_image("huge_image.jpg")
base64_image = base64.b64encode(compressed.read()).decode()
```

### 常见错误 2：语音文件格式不支持

```python
# ❌ 错误：不检查音频格式
with open("audio.wav", "rb") as f:
    transcript = openai.Audio.transcribe("whisper-1", f)

# ✅ 正确：转换为支持的格式
import subprocess

def convert_audio(input_path, output_path="converted.mp3"):
    """转换为 Whisper 支持的 mp3 格式"""
    subprocess.run([
        "ffmpeg", "-i", input_path,
        "-ar", "16000",  # 16kHz 采样率
        "-ac", "1",      # 单声道
        "-b:a", "32k",   # 比特率
        output_path
    ], check=True)
    return output_path

# 支持的格式：mp3, mp4, mpeg, mpga, m4a, wav, webm
```

### 常见错误 3：多模态请求超时

```python
# ❌ 错误：没有设置超时
response = openai.ChatCompletion.create(
    model="gpt-4-vision-preview",
    messages=messages
)

# ✅ 正确：设置合理的超时时间
import httpx

async def vision_request_with_timeout(image_path, prompt, timeout=30.0):
    """带超时的视觉请求"""
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-4-vision-preview",
                    "messages": [...],
                    "max_tokens": 500  # 限制输出长度
                }
            )
            return response.json()
        except httpx.TimeoutException:
            return {"error": "请求超时，请稍后重试或减小图片尺寸"}
```

### 常见错误 4：成本失控

```python
# ❌ 错误：无限制使用高成本模型
response = openai.ChatCompletion.create(
    model="gpt-4-vision-preview",  # 成本高
    messages=messages,
    max_tokens=4000  # 可能产生大量费用
)

# ✅ 正确：成本优化策略
class CostOptimizedVision:
    """成本优化的视觉服务"""
    
    def __init__(self):
        self.cache = {}  # 简单缓存
        self.token_usage = 0
    
    async def analyze_with_fallback(
        self, 
        image_path: str, 
        prompt: str,
        use_cheap_model_first: bool = True
    ):
        """先尝试低成本模型，必要时升级"""
        
        # 检查缓存
        cache_key = f"{image_path}:{hash(prompt)}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        if use_cheap_model_first:
            # 先用 GPT-3.5 处理文本部分
            # 或用开源模型处理简单任务
            try:
                result = await self.try_cheap_model(image_path, prompt)
                if self.is_result_good_enough(result):
                    self.cache[cache_key] = result
                    return result
            except:
                pass
        
        # 降级到 GPT-4V
        result = await self.call_gpt4v(image_path, prompt)
        self.cache[cache_key] = result
        return result
    
    def estimate_cost(self, image_tokens, output_tokens):
        """估算成本"""
        # GPT-4V: $0.01 / 1K input tokens, $0.03 / 1K output tokens
        input_cost = (image_tokens / 1000) * 0.01
        output_cost = (output_tokens / 1000) * 0.03
        return input_cost + output_cost
```

## 面试考点

### Q1: 多模态模型选型要考虑哪些因素？

**参考答案：**

多模态模型选型需要综合考虑以下因素：

1. **任务需求匹配度**
   - 图像理解：GPT-4V、Claude 3 适合复杂推理
   - OCR 场景：专用 OCR 模型可能更准确
   - 视频理解：Gemini Pro Vision 原生支持

2. **成本考量**
   - GPT-4V: $0.01/1K input tokens（图像按尺寸计费）
   - Claude 3: 类似定价，但 token 计算方式不同
   - 开源方案：LLaVA、Qwen-VL 可私有化部署，降低长期成本

3. **延迟要求**
   - 实时场景：需要流式响应，考虑模型推理速度
   - 异步场景：可以使用更强的模型，接受更高延迟

4. **数据隐私**
   - 敏感数据：选择可私有化部署的开源模型
   - 一般数据：可以使用云端 API

5. **语言支持**
   - 中文场景：Qwen-VL、Gemini 中文支持较好
   - 多语言：GPT-4V、Claude 3 支持更广泛

### Q2: 如何优化多模态 Agent 的成本？

**参考答案：**

成本优化策略包括：

1. **模型分级策略**
   ```
   用户请求 → 意图识别 → 简单任务 → GPT-3.5 / 开源模型
                          ↘ 复杂任务 → GPT-4V
   ```

2. **缓存机制**
   - 图像特征缓存：相同图片的分析结果缓存
   - 向量数据库：存储图片 embedding，快速检索相似结果

3. **图像预处理**
   - 压缩图片尺寸：减少 token 消耗
   - 裁剪关键区域：只发送 ROI 区域给模型

4. **批量处理**
   - 合并多个小请求，减少 API 调用次数
   - 使用批处理 API（如果提供商支持）

5. **监控与告警**
   - 实时监控 token 消耗
   - 设置预算上限和告警

### Q3: 设计一个「拍照购物」Agent 的架构

**参考答案：**

```
用户拍照 → 图像上传 → 多模态理解 → 商品识别 → 相似商品检索 → 结果展示
                ↓           ↓              ↓
            图像压缩    特征提取        向量数据库
            格式转换    商品分类        相似度计算
                        属性识别

核心组件：
1. 图像预处理服务：压缩、去噪、增强
2. 视觉理解服务：识别商品类别、品牌、特征
3. 向量检索服务：基于图像特征的相似商品搜索
4. 结果排序服务：综合考虑相似度、销量、评价
5. 语音交互服务：语音播报搜索结果

技术选型：
- 图像理解：GPT-4V / Qwen-VL
- 特征提取：CLIP 模型提取图像 embedding
- 向量数据库：Milvus / Pinecone
- 语音合成：Azure TTS / 阿里云语音合成
```

### Q4: 多模态 Agent 的评估指标有哪些？

**参考答案：**

1. **准确性指标**
   - 图像描述准确率：人工评估或使用 CLIPScore
   - VQA 准确率：标准数据集评估
   - OCR 准确率：字符识别正确率

2. **性能指标**
   - 端到端延迟：用户请求到完整响应的时间
   - 首 token 延迟：流式响应的首字节时间
   - 吞吐量：单位时间处理的请求数

3. **成本指标**
   - 单次请求成本
   - 日均/月总成本
   - 成本 per 有效交互

4. **用户体验指标**
   - 任务完成率
   - 用户满意度评分
   - 多轮对话轮数

## 扩展阅读

- [OpenAI Vision API 文档](https://platform.openai.com/docs/guides/vision)
- [Whisper API 文档](https://platform.openai.com/docs/guides/speech-to-text)
- [TTS API 文档](https://platform.openai.com/docs/guides/text-to-speech)
- [Claude 3 Vision 能力](https://www.anthropic.com/news/claude-3-family)
- [Gemini Pro Vision](https://deepmind.google/technologies/gemini/)
- [LLaVA: Large Language and Vision Assistant](https://llava-vl.github.io/)
- [Qwen-VL 技术报告](https://arxiv.org/abs/2308.12966)
- [CLIP: Connecting text and images](https://openai.com/research/clip)

## 课后练习

1. **基础练习**
   - 实现一个支持图片上传的聊天机器人
   - 集成 Whisper 实现语音输入功能
   - 为回复添加语音合成功能

2. **进阶练习**
   - 实现图像缓存机制，避免重复分析相同图片
   - 设计成本监控面板，实时显示 API 调用费用
   - 实现模型降级策略，根据任务复杂度选择不同模型

3. **项目实战**
   - 开发「智能相册助手」：自动为照片生成描述和标签
   - 开发「语音导览 Agent」：上传景点照片，获得语音讲解
   - 开发「多模态翻译助手」：拍照外文菜单，语音播报中文翻译

4. **面试准备**
   - 整理多模态模型选型对比表
   - 设计一个成本优化方案并计算 ROI
   - 准备 3 个多模态应用场景的架构设计
