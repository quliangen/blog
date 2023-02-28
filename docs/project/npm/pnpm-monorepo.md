
# 极简 Pnpm Monorepo 单体仓库


> 写在开始，点击传送门了解 [pnpm](https://www.pnpm.cn/) monorepo  [5 分钟搞懂 Monorepo](https://xie.infoq.cn/article/4f870ba6a7c8e0fd825295c92)

> 如果不确定项目是否该使用 monorepo，那大概是不需要。

> 适用于多包项目，满足多包公共依赖配置抽离，多包分别管理开发、发布，解决开发过程中包之间调试和版本更新问题。

## 1. 安装 pnpm [参考官网](https://www.pnpm.cn/installation)

```sh
# 查看 pnpm 版本
pnpm -v

```

## 2. 创建根项目

```sh
# 创建项目目录
mkdir fe-infra

# 进入项目
cd fe-infra

# 初始化项目
pnpm init
```


## 3. 添加 pnpm-workspace.yaml
```sh
# 创建 yaml 文件
touch pnpm-workspace.yaml

# yaml 文件 增加
packages:
    - 'packages/*'

```


## 4. 创建子项目

```sh

# 创建子项目
mkdir packages

cd packages

# 创建示例项目
mkdir tools

cd tools

# 初始化示例项目
pnpm init
# 非必须 使用 @scope/name 重命名 pkg name 为 @infra/tools。

# 重复以上步骤 创建 web 子项目

```

## 5. 添加依赖

```sh
# 根目录添加 prettier 到开发依赖
pnpm add prettier -w -D

```


```sh
# 示例：安装开源 @infra/tools 安装 lodash 依赖。删除 remove
pnpm -F @infra/tools add lodash

# 示例：安装项目间依赖， @infra/qui-antd 安装 @infra/tools 依赖。
pnpm -F @infra/web  add @infra/tools  

# 自动依赖 workspace 最新版本：
# 查看 web -- pkg.json 将  "@infra/tools": "workspace:^1.0.0" 修改为 "@infra/tools": "workspace:*"。

```

## 6. 根目录增加 npm 指令

```json
"scripts": {
    "tools:dev": "pnpm --dir ./packages/tools dev", 
    "tools:build": "pnpm --dir ./packages/tools build", 
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```

## 7. 业务项目开发，将子项目换成业务项目即可。 
示例不包含公共配置抽离，可参考 [Vant Monorepo 配置](https://github.com/youzan/vant)。
