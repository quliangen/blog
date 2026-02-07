# 全局代码风格规则

description: 适用于所有文件的全局代码风格约束，确保项目代码一致性
globs: []
alwaysApply: true
---

## 代码格式规范

### 缩进与空格

- 使用 2 个空格缩进（不使用 Tab）
- 文件使用 UTF-8 编码
- 使用 LF 换行符
- 文件末尾保留空行

### Prettier 配置

项目使用以下 Prettier 配置：

```json
{
  "printWidth": 80,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none"
}
```

### 通用规则

1. **行宽限制**: 单行代码不超过 80 字符
2. **分号**: JavaScript/TypeScript 代码不使用分号结尾
3. **引号**: 使用单引号（字符串中包含单引号时除外）
4. **尾随逗号**: 不使用尾随逗号
5. **命名规范**:
   - 文件/目录名: 短横线连接（kebab-case），如 `my-file.md`
   - JavaScript 变量/函数: 驼峰命名（camelCase）
   - 常量: 全大写下划线（UPPER_SNAKE_CASE）
   - 类名: 大驼峰（PascalCase）

### Markdown 特殊规则

- Markdown 文件**保留**行尾空格（用于换行）
- 代码块指定语言标签
- 使用 ATX 风格标题（# 符号）

## 禁止事项

- 不要提交包含敏感信息的代码（密钥、密码等）
- 不要提交调试代码（console.log 等）
- 不要提交未使用的导入或变量
