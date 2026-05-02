# 03-Python 快速入门（前端工程师版）

> 目标读者：熟悉 JavaScript/TypeScript 的前端工程师，希望快速掌握 Python 基础并理解核心差异。

---

## 1. 为什么前端工程师要学 Python？

| 场景 | Python 优势 |
|------|-------------|
| AI/ML 开发 | 几乎所有 AI 框架（PyTorch、TensorFlow）首选 Python |
| 后端开发 | Django、FastAPI 等框架生态成熟 |
| 数据处理 | Pandas、NumPy 是数据科学标配 |
| 自动化脚本 | 语法简洁，适合写各种工具脚本 |
| Agent 开发 | LangChain、AutoGPT 等框架基于 Python |

---

## 2. JS vs Python 语法对照速查表

### 2.1 基础语法对比

| 特性 | JavaScript | Python |
|------|------------|--------|
| **语句结束** | `;` 可选 | 换行即结束，无分号 |
| **代码块** | `{}` | 缩进（4空格推荐） |
| **变量声明** | `let`, `const`, `var` | 直接赋值，无关键字 |
| **常量** | `const PI = 3.14` | `PI = 3.14`（约定大写） |
| **注释** | `//` 单行，`/* */` 多行 | `#` 单行，`"""` 多行 |

```javascript
// JavaScript
const name = "Alice";
let age = 25;
const isActive = true;

function greet(user) {
    return `Hello, ${user}!`;
}

const add = (a, b) => a + b;
```

```python
# Python
name = "Alice"
age = 25
is_active = True  # Python 命名用 snake_case

def greet(user):
    return f"Hello, {user}!"  # f-string 类似模板字符串

add = lambda a, b: a + b  # lambda 表达式
```

### 2.2 数据类型对比

| 类型 | JavaScript | Python |
|------|------------|--------|
| **字符串** | `"text"` / `'text'` | `"text"` / `'text'` / `'''多行'''` |
| **数字** | `number`（无区分） | `int`, `float`, `complex` |
| **布尔** | `true` / `false` | `True` / `False`（首字母大写） |
| **空值** | `null` / `undefined` | `None` |
| **数组/列表** | `[]` | `[]`（列表，可变） |
| **对象/字典** | `{}` | `{}`（字典） |
| **元组** | 无原生 | `()`（不可变序列） |
| **集合** | `Set` | `set()` |

```javascript
// JavaScript 数组和对象
const arr = [1, 2, 3];
arr.push(4);  // [1, 2, 3, 4]

const obj = { name: "Alice", age: 25 };
console.log(obj.name);  // "Alice"

// 解构
const [first, ...rest] = arr;
const { name, age } = obj;
```

```python
# Python 列表和字典
arr = [1, 2, 3]
arr.append(4)  # [1, 2, 3, 4]

obj = {"name": "Alice", "age": 25}
print(obj["name"])  # "Alice"

# 解包
first, *rest = arr
name = obj["name"]  # Python 无对象解构语法，需逐个获取

# 元组（不可变）
t = (1, 2, 3)

# 集合
s = {1, 2, 3}
```

### 2.3 条件与循环

```javascript
// JavaScript
if (age >= 18) {
    console.log("Adult");
} else if (age >= 13) {
    console.log("Teenager");
} else {
    console.log("Child");
}

// 三元运算符
const status = age >= 18 ? "Adult" : "Minor";

// 循环
for (let i = 0; i < 5; i++) {
    console.log(i);
}

arr.forEach(item => console.log(item));
for (const item of arr) {
    console.log(item);
}
```

```python
# Python
if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")

# 三元表达式（注意顺序相反）
status = "Adult" if age >= 18 else "Minor"

# 循环
for i in range(5):  # 0, 1, 2, 3, 4
    print(i)

for item in arr:
    print(item)

# 带索引的循环
for index, item in enumerate(arr):
    print(f"{index}: {item}")

# while 循环
while condition:
    pass

# 列表推导式（类似 map/filter）
squares = [x**2 for x in range(10) if x % 2 == 0]
```

### 2.4 函数定义

```javascript
// JavaScript
function add(a, b) {
    return a + b;
}

// 默认参数
function greet(name = "World") {
    return `Hello, ${name}!`;
}

// 剩余参数
function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}

// 箭头函数
const multiply = (a, b) => a * b;
```

```python
# Python
def add(a, b):
    return a + b

# 默认参数
def greet(name="World"):
    return f"Hello, {name}!"

# 可变参数 (*args 类似 ...args)
def sum_all(*numbers):
    return sum(numbers)

# 关键字参数 (**kwargs 类似对象参数)
def create_user(**kwargs):
    return kwargs

# 类型注解（Python 3.5+）
def add_typed(a: int, b: int) -> int:
    return a + b
```

### 2.5 类与面向对象

```javascript
// JavaScript
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    
    greet() {
        return `Hi, I'm ${this.name}`;
    }
    
    // 静态方法
    static createAnonymous() {
        return new Person("Anonymous", 0);
    }
}

const person = new Person("Alice", 25);
```

```python
# Python
class Person:
    def __init__(self, name, age):  # 构造函数
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hi, I'm {self.name}"
    
    @staticmethod
    def create_anonymous():
        return Person("Anonymous", 0)
    
    @classmethod  # 类方法，接收 cls 参数
    def from_birth_year(cls, name, year):
        return cls(name, 2024 - year)

person = Person("Alice", 25)
```

### 2.6 模块导入

```javascript
// JavaScript
import { useState } from 'react';
import * as utils from './utils.js';
import defaultExport from './module.js';

// CommonJS
const fs = require('fs');
```

```python
# Python
from os import path  # 导入特定函数
import os  # 导入整个模块
from datetime import datetime as dt  # 别名

# 相对导入（同项目内）
from . import utils
from .models import User
```

---

## 3. 异步编程：async/await 对比

### 3.1 核心概念对比

| 概念 | JavaScript | Python |
|------|------------|--------|
| **运行时** | 单线程 + 事件循环 | 单线程（受 GIL 限制）+ 事件循环 |
| **异步关键字** | `async` / `await` | `async` / `await`（Python 3.5+） |
| **Promise** | `Promise` | `asyncio.Future` / `asyncio.Task` |
| **非阻塞 IO** | 原生支持 | `asyncio` 库 |
| **并发执行** | `Promise.all()` | `asyncio.gather()` |

### 3.2 代码对比

```javascript
// JavaScript
async function fetchData() {
    try {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// 并行执行
async function fetchMultiple() {
    const [users, posts] = await Promise.all([
        fetch('/users'),
        fetch('/posts')
    ]);
    return { users, posts };
}

// 延迟执行
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
await delay(1000);
```

```python
import asyncio
import aiohttp  # 异步 HTTP 库

# Python
async def fetch_data():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('https://api.example.com/data') as response:
                data = await response.json()
                return data
    except Exception as error:
        print(f"Error: {error}")
        raise

# 并行执行
async def fetch_multiple():
    async with aiohttp.ClientSession() as session:
        users_task = session.get('http://localhost/users')
        posts_task = session.get('http://localhost/posts')
        
        users_response, posts_response = await asyncio.gather(
            users_task, posts_task
        )
        
        users = await users_response.json()
        posts = await posts_response.json()
        return {"users": users, "posts": posts}

# 延迟执行
await asyncio.sleep(1)  # 注意：不是 time.sleep()

# 运行异步函数
asyncio.run(fetch_data())
```

### 3.3 关键差异

```python
# Python 异步注意事项

# 1. 普通函数不能 await
async def async_func():
    await asyncio.sleep(1)  # ✅ 正确

def sync_func():
    await asyncio.sleep(1)  # ❌ 语法错误！

# 2. 在同步代码中调用异步函数
asyncio.run(async_func())  # Python 3.7+

# 3. 获取当前事件循环
loop = asyncio.get_event_loop()

# 4. 创建任务（类似 JS 的 Promise）
task = asyncio.create_task(async_func())
await task

# 5. 等待多个任务
results = await asyncio.gather(task1, task2, task3)

# 6. 超时处理
try:
    result = await asyncio.wait_for(async_func(), timeout=5.0)
except asyncio.TimeoutError:
    print("Timeout!")
```

---

## 4. 包管理：pip/poetry vs npm/yarn/pnpm

### 4.1 工具对照表

| npm/yarn/pnpm | Python 对应工具 | 说明 |
|---------------|-----------------|------|
| `package.json` | `requirements.txt` / `pyproject.toml` | 依赖清单 |
| `package-lock.json` | `poetry.lock` / `Pipfile.lock` | 锁定版本 |
| `node_modules/` | `venv/lib/python3.x/site-packages/` | 依赖安装目录 |
| `npm install` | `pip install` / `poetry install` | 安装依赖 |
| `npm install <pkg>` | `pip install <pkg>` | 安装单个包 |
| `npm run <script>` | 无直接对应，用 Makefile 或脚本 | 运行脚本 |
| `npx` | `poetry run` / `python -m` | 运行工具 |

### 4.2 pip 基础用法

```bash
# 安装包
pip install requests
pip install requests==2.28.1  # 指定版本
pip install requests>=2.28.0  # 版本范围

# 从 requirements.txt 安装
pip install -r requirements.txt

# 导出当前依赖
pip freeze > requirements.txt

# 卸载
pip uninstall requests

# 列出已安装
pip list

# 显示包信息
pip show requests
```

```txt
# requirements.txt 示例
requests>=2.28.0
numpy==1.24.0
pandas>=1.5.0,<2.0.0
```

### 4.3 Poetry（推荐）

Poetry 类似 npm/yarn，提供完整的项目管理：

```bash
# 安装 Poetry
pip install poetry

# 初始化项目（类似 npm init）
cd my-project
poetry init

# 添加依赖（类似 npm install --save）
poetry add requests
poetry add pytest --group dev  # 开发依赖

# 安装所有依赖（类似 npm install）
poetry install

# 运行命令（类似 npx）
poetry run python script.py
poetry run pytest

# 进入虚拟环境 shell
poetry shell

# 构建和发布
poetry build
poetry publish
```

```toml
# pyproject.toml 示例（Poetry 配置）
[tool.poetry]
name = "my-project"
version = "0.1.0"
description = "A sample project"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"
fastapi = "^0.100.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.0"
black = "^23.0"
```

### 4.4 依赖版本语义

| 符号 | 含义 | 示例 |
|------|------|------|
| `==` | 精确版本 | `numpy==1.24.0` |
| `>=` | 最低版本 | `pandas>=1.5.0` |
| `<=` | 最高版本 | `django<=4.0` |
| `^` | 兼容版本（Poetry） | `^2.28.0` = `>=2.28.0,<3.0.0` |
| `~` | 近似版本（Poetry） | `~2.28.0` = `>=2.28.0,<2.29.0` |

---

## 5. 虚拟环境概念（类比 nvm）

### 5.1 为什么需要虚拟环境？

Python 没有像 `node_modules` 那样的项目级依赖隔离，因此需要虚拟环境：

```
类比：
nvm 管理 Node 版本 → pyenv 管理 Python 版本
node_modules 项目隔离 → venv/poetry 虚拟环境隔离
```

### 5.2 venv（内置工具）

```bash
# 创建虚拟环境（类似 npm 的项目隔离）
python -m venv venv

# 激活（Linux/Mac）
source venv/bin/activate

# 激活（Windows）
venv\Scripts\activate

# 退出
 deactivate

# 删除环境
rm -rf venv/
```

### 5.3 pyenv（版本管理，类似 nvm）

```bash
# 安装 pyenv（Mac）
brew install pyenv

# 安装 Python 版本
pyenv install 3.11.0
pyenv install 3.10.8

# 设置全局版本
pyenv global 3.11.0

# 设置项目本地版本（类似 .nvmrc）
cd my-project
pyenv local 3.10.8

# 查看已安装版本
pyenv versions
```

### 5.4 完整工作流

```bash
# 1. 进入项目目录
cd my-project

# 2. 设置 Python 版本（如有 .python-version）
pyenv local 3.11.0

# 3. 创建虚拟环境
python -m venv venv

# 4. 激活
source venv/bin/activate

# 5. 升级 pip
pip install --upgrade pip

# 6. 安装依赖
pip install -r requirements.txt
# 或使用 Poetry
poetry install

# 7. 开发...

# 8. 退出
deactivate
```

### 5.5 对比总结

| 需求 | Node.js | Python |
|------|---------|--------|
| 版本管理 | `nvm` | `pyenv` |
| 项目依赖隔离 | `node_modules` | `venv` / `poetry` |
| 依赖锁定 | `package-lock.json` | `poetry.lock` / `Pipfile.lock` |
| 运行脚本 | `npm run` | `poetry run` / `make` |

---

## 6. 实战：用 Python 重写一个熟悉的 JS 工具

### 6.1 目标：文件批量重命名工具

**JavaScript 版本（Node.js）：**

```javascript
// rename.js
const fs = require('fs');
const path = require('path');

async function batchRename(dir, pattern, replacement) {
    const files = await fs.promises.readdir(dir);
    
    for (const file of files) {
        if (file.includes(pattern)) {
            const newName = file.replace(pattern, replacement);
            const oldPath = path.join(dir, file);
            const newPath = path.join(dir, newName);
            
            await fs.promises.rename(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newName}`);
        }
    }
}

// 使用
batchRename('./images', 'IMG_', 'vacation_')
    .then(() => console.log('Done!'))
    .catch(err => console.error(err));
```

**Python 版本：**

```python
# rename.py
import os
import re
import asyncio
import aiofiles  # 异步文件操作


def batch_rename_sync(directory: str, pattern: str, replacement: str) -> None:
    """同步版本"""
    for filename in os.listdir(directory):
        if pattern in filename:
            new_name = filename.replace(pattern, replacement)
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_name)
            
            os.rename(old_path, new_path)
            print(f"Renamed: {filename} -> {new_name}")


async def batch_rename_async(directory: str, pattern: str, replacement: str) -> None:
    """异步版本"""
    # 注意：Python 的文件 IO 是阻塞的，需要用线程池或 aiofiles
    loop = asyncio.get_event_loop()
    
    tasks = []
    for filename in os.listdir(directory):
        if pattern in filename:
            new_name = filename.replace(pattern, replacement)
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_name)
            
            # 在线程池中执行阻塞操作
            task = loop.run_in_executor(
                None,  # 使用默认线程池
                os.rename,
                old_path,
                new_path
            )
            tasks.append((task, filename, new_name))
    
    # 等待所有任务完成
    for task, old_name, new_name in tasks:
        await task
        print(f"Renamed: {old_name} -> {new_name}")


class FileRenamer:
    """面向对象版本，带更多功能"""
    
    def __init__(self, directory: str):
        self.directory = directory
        self.renamed_count = 0
    
    def rename_with_regex(self, pattern: str, replacement: str, 
                          dry_run: bool = False) -> list:
        """
        使用正则表达式重命名
        
        Args:
            pattern: 正则表达式
            replacement: 替换字符串
            dry_run: 如果为 True，只预览不执行
        """
        changes = []
        regex = re.compile(pattern)
        
        for filename in os.listdir(self.directory):
            new_name = regex.sub(replacement, filename)
            if new_name != filename:
                old_path = os.path.join(self.directory, filename)
                new_path = os.path.join(self.directory, new_name)
                
                changes.append({
                    'old': filename,
                    'new': new_name,
                    'old_path': old_path,
                    'new_path': new_path
                })
                
                if not dry_run:
                    os.rename(old_path, new_path)
                    self.renamed_count += 1
        
        return changes
    
    def add_prefix(self, prefix: str) -> None:
        """添加前缀"""
        for filename in os.listdir(self.directory):
            new_name = prefix + filename
            os.rename(
                os.path.join(self.directory, filename),
                os.path.join(self.directory, new_name)
            )
            self.renamed_count += 1


# CLI 入口
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Batch file renamer")
    parser.add_argument("directory", help="Target directory")
    parser.add_argument("--pattern", "-p", required=True, help="Pattern to replace")
    parser.add_argument("--replacement", "-r", required=True, help="Replacement string")
    parser.add_argument("--regex", action="store_true", help="Use regex pattern")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes")
    
    args = parser.parse_args()
    
    renamer = FileRenamer(args.directory)
    
    if args.regex:
        changes = renamer.rename_with_regex(
            args.pattern, args.replacement, args.dry_run
        )
    else:
        changes = renamer.rename_with_regex(
            re.escape(args.pattern), args.replacement, args.dry_run
        )
    
    print(f"\n{'='*50}")
    print(f"Changes ({len(changes)} files):")
    for change in changes:
        print(f"  {change['old']} -> {change['new']}")
    
    if args.dry_run:
        print("\n(Dry run - no changes made)")
    else:
        print(f"\nSuccessfully renamed {renamer.renamed_count} files")
```

### 6.2 使用对比

```bash
# JavaScript
node rename.js

# Python
python rename.py ./images -p "IMG_" -r "vacation_"
python rename.py ./images -p "IMG_(\d+)" -r "photo_\1" --regex --dry-run
```

### 6.3 关键差异总结

| 特性 | JavaScript | Python |
|------|------------|--------|
| 文件路径 | `path.join()` | `os.path.join()` |
| 目录遍历 | `fs.readdir()` | `os.listdir()` |
| 异步文件操作 | `fs.promises` | `aiofiles` 或线程池 |
| CLI 参数 | `process.argv` / `yargs` | `argparse`（内置） |
| 正则表达式 | `/pattern/` | `re.compile()` |

---

## 7. 面试考点

### 7.1 Python 异步机制

**核心问题：**

1. **asyncio 的工作原理**
   - 基于事件循环（Event Loop）
   - 使用协程（Coroutine）实现并发
   - 单线程，通过 `await` 挂起释放控制权

2. **async/await 的执行流程**
   ```python
   async def main():
       print("A")
       await asyncio.sleep(1)  # 挂起，让出控制权
       print("B")  # 1秒后恢复执行
   
   # 事件循环调度执行
   asyncio.run(main())
   ```

3. **与 JavaScript 的区别**
   - Python 需要显式启动事件循环 `asyncio.run()`
   - Python 的 `await` 只能在 `async` 函数中使用
   - Python 的异步 IO 需要特定库支持（如 `aiohttp`）

4. **常见陷阱**
   ```python
   # ❌ 错误：在同步代码中调用异步函数
   result = fetch_data()
   
   # ✅ 正确
   result = await fetch_data()  # 在 async 函数中
   # 或
   result = asyncio.run(fetch_data())  # 在同步代码中
   ```

### 7.2 GIL（全局解释器锁）

**什么是 GIL？**

GIL（Global Interpreter Lock）是 CPython 解释器的机制，确保同一时间只有一个线程执行 Python 字节码。

**对并发的影响：**

```
┌─────────────────────────────────────┐
│           Python 进程               │
│  ┌─────────────────────────────┐   │
│  │         GIL（锁）            │   │
│  │  同一时间只有一个线程执行    │   │
│  └─────────────────────────────┘   │
│         │         │         │      │
│      Thread 1  Thread 2  Thread 3   │
│         │         │         │      │
│      切换执行 ← 切换执行 ← 切换    │
└─────────────────────────────────────┘
```

**关键考点：**

1. **GIL 存在的理由**
   - 简化 C 扩展开发
   - 避免多线程内存管理问题
   - 单线程性能更优

2. **GIL 的影响**
   - ❌ 多线程无法并行执行 CPU 密集型任务
   - ✅ IO 密集型任务不受影响（GIL 在等待 IO 时释放）
   - ✅ 多进程可以绕过 GIL

3. **应对策略**

   ```python
   # 1. IO 密集型 - 使用 asyncio（推荐）
   async def io_bound_task():
       await aiohttp.get(url)
   
   # 2. CPU 密集型 - 使用多进程
   from multiprocessing import Pool
   
   def cpu_bound_task(n):
       return sum(range(n))
   
   with Pool(4) as p:
       results = p.map(cpu_bound_task, [1000000, 2000000])
   
   # 3. 使用 C 扩展（如 NumPy）绕过 GIL
   import numpy as np
   arr = np.array([1, 2, 3])
   ```

4. **面试常见问题**

   - **Q: 为什么 Python 多线程不适合 CPU 密集型任务？**
   - A: 因为 GIL 限制，多线程无法真正并行执行，只是交替执行。

   - **Q: 如何提高 CPU 密集型任务的性能？**
   - A: 使用多进程（multiprocessing）或改用 C 扩展。

   - **Q: asyncio 受 GIL 影响吗？**
   - A: 不受，asyncio 是单线程协程，通过事件循环调度，GIL 不成为瓶颈。

### 7.3 其他高频考点

| 考点 | 要点 |
|------|------|
| **深拷贝 vs 浅拷贝** | `copy.copy()` 浅拷贝，`copy.deepcopy()` 深拷贝 |
| **装饰器** | `@decorator` 语法，本质是闭包 |
| **生成器** | `yield` 关键字，惰性求值，节省内存 |
| **上下文管理器** | `with` 语句，`__enter__` / `__exit__` |
| **元类** | `type` 动态创建类，控制类创建行为 |
| **垃圾回收** | 引用计数 + 循环检测（generational GC） |

---

## 8. 快速上手 checklist

```bash
# 1. 安装 Python（推荐 3.10+）
# Mac
brew install python@3.11

# 或使用 pyenv
pyenv install 3.11.0
pyenv global 3.11.0

# 2. 安装 Poetry
pip install poetry

# 3. 创建项目
poetry new my-ai-project
cd my-ai-project

# 4. 添加常用依赖
poetry add fastapi uvicorn pydantic
poetry add openai langchain --group dev

# 5. 开始编码！
poetry run python main.py
```

---

## 9. 推荐资源

- **官方文档**: https://docs.python.org/zh-cn/3/
- **Poetry**: https://python-poetry.org/
- **FastAPI**: https://fastapi.tiangolo.com/
- **LangChain**: https://python.langchain.com/
- **练习**: https://leetcode.cn/（用 Python 刷题）

---

> 💡 **学习建议**: 作为前端工程师，你已经具备编程思维，重点放在语法差异和 Python 特有的概念（如 GIL、装饰器、上下文管理器）上，通过实际项目（如 AI Agent）快速上手。
