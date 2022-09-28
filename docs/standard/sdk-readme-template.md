# 项目名（Project Name）

> 项目描述（Project Description）

## 关于项目（About This Project）

若有需要，项目详细描述可单独罗列

### 构建于（Built With）

Vue 3 + TS + Webpack

## 使用（Usage）

如何使用一个项目的有用示例。代码示例、屏幕截图和演示。

```shell
pnpm install npm-package
```

配置

```js
import { xxx } from 'npm-package'

xxx()
```

### QA？

#### 当前 SDK 上报逻辑？

- 若在端外，SDK 则通过 `Axios` 直接发起 HTTP 请求将日志上报


## 开始（Getting Started）

说明可以在本地设置项目的要求。要使本地项目启动和运行，请按照这些简单的例子步骤。

### 条件（Prerequisites）

列出当前项目所依赖的软件、环境以及如何安装它们

- Node.js >= 14.17.0
- 包管理工具：[pnpm](https://pnpm.io/)

### 安装（Installation）

说明指导用户如何安装以及配置项目。

1. Clone the repo

    ```shell
    git clone git@git.corp.shiqiao.com:bigfrontend/infrastructure/xxx.git
    ```

2. 安装依赖

    ```shell
    pnpm install
    ```

3. 本地开发

    ```shell
    pnpm run dev
    ```

### 项目目录说明（Structure）

工程项目的文件夹结构选项和命名约定

```shell
# TODO: 增加目录结构
```

### 测试（Test）

1. 测试相关用例

    ```shell
    .
    └── __tests__
        ├── minapp
        │   ├── developer_options.js
        │   ├── developer_options.json
        │   ├── developer_options.wxml
        │   ├── developer_options.wxss
        │   └── index.wxs
        ├── react
        │   └── component.spec.jsx
        └── vue
            ├── component.spec.vue
            ├── main.js
            ├── main.ts
            ├── main.tsx
            ├── sfc-tsx.vue
            ├── sfc.vue
            ├── shims-tsx.d.ts
            ├── shims-vue.d.ts
            └── tsconfig.json
    ```

2. 测试命令

    ```shell
    pnpm run test
    ```

### 构建部署（Deploy）

1. 构建部署命令

    ```shell
    pnpm run release

    # 以下示例均基于 1.0.0 版本操作

    # 发布预发布版本：1.0.1-0
    pnpm run release -- --prerelease

    # 发布alpha版本：1.0.1-alpha.0
    pnpm run release -- --prerelease alpha

    # 指定版本：
    pnpm run release -- --release-as 1.1.0

    # 自动升级版本：major, minor 或 patch
    # 主版本：2.0.0
    pnpm run release -- --release-as major
    # 次版本：1.1.0
    pnpm run release -- --release-as minor
    # 补丁版本：1.0.1
    pnpm run release -- --release-as patch
    ```
