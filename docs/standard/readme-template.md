# 项目名（Project Name）

> 项目描述（Project Description）

## 关于项目（About This Project）

若有需要，项目详细描述可单独罗列

### 技术栈（Built With）

示例：Vue 3 Setup + TS + Vite



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
    git clone xxx/xxx.git
    ```

2. 安装依赖

    ```shell
    pnpm install
    ```

3. 本地开发

    ```shell
    pnpm dev
    ```

### 项目目录说明（Structure）

工程项目的文件夹结构选项和命名约定

```shell
.
├── ...
├── src
│   ├── main.ts # 公共文件，被所有应用页面所依赖
│   ├── pages
│   │   └── driver # driver 应用(http://localhost:8080/driver)
│   │       ├── App.vue # driver 根页面
│   │       ├── assets # 页面资源（图片等）
│   │       ├── components # 组件
│   │       │   ├── About.vue
│   │       │   ├── HelloWorld.vue
│   │       │   ├── Home.vue
│   │       │   └── ModuleAPageB.vue
│   │       ├── index.ts # driver 根入口文件
│   │       ├── router # 路由
│   │       │   └── index.ts
│   │       ├── store # 状态管理
│   │       │   └── index.ts
│   │       └── views # driver 页面
│   │           ├── ModuleA.vue # http://localhost:8080/driver/module-a
│   │           └── ModuleB.vue # http://localhost:8080/driver/module-b
│   ├── shims-vue.d.ts
│   ├── styles # 公共样式文件
│   │   ├── index.less
│   │   ├── reset.less
│   │   └── variable.less
│   └── utils # 工具库
│       └── index.ts
│       └── sentry.ts
├── docker.yaml # docker化部署相关配置
├── index.html # 模版html
├── tsconfig.json
├── vue.config.js
└── pnpm-lock.yaml # pnpm 提供的依赖版本锁定文件，解决依赖版本不一致的问题
```

### 构建部署、账号信息

- **登录账号**

> 使用公共账号登录 admin:test。


- **资源环境信息**

| 后台url |  前端访问url  | Jenkins | 代码分支 |
| ----- | --------- | ----------- | ------- |
| api.dev.xxx.com   | dev.xxx.com |     xxx/job/xxx/       |     dev    |
| api.test.xxx.com   | test.xxx.com |     xxx/job/xxx/       |     test    |
