# vue-cli 迁移 4.5.17 指南
> 目标：升级vue-service 及相关开发依赖到 4.5.17 版本，提升开发体验。

重要提示：
+ 本文档适用于 vue-cli 3+ 4+ 2+(待验证)
+ 如果项目已经迁移 pnpm :
  1. 删除node_modules、pnpm-lock.yaml
  2. 使用 yarn 或 npm 安装依赖
  3. 迁移版本成功后删除lock文件，重新迁移 pnpm。

## 一 升级全局 vue-cli 版本到 4.5.17
```sh
# 查看全局安装的 cli 版本
vue --version

# 升级至 4.5.17
npm update -g @vue/cli@4.5.17
# 或者
yarn global upgrade @vue/cli@4.5.17
```

## 二 使用 vue-cli 指令检测当前项目
```sh
vue upgrade
# 如果出现以下 警告：输入 y
#  WARN  There are uncommitted changes in the current repository, it's recommended to commit or stash them first.
# ? Still proceed? (y/N)

```
 运行结果如下
✔  Gathering package information...
|  Name      |              Installed   |    Wanted     |     Latest     |     Command to upgrade |
| ----- | --------- | ----------- | ------- | ------- |
|  @vue/cli-service    |    4.5.17     |     4.5.17     |     5.0.4      |     vue upgrade @vue/cli-service |
|  @vue/cli-plugin-babel |  4.5.17      |    4.5.17     |     5.0.4       |    vue upgrade @vue/cli-plugin-babel |
|  @vue/cli-plugin-eslint | 4.5.17      |    4.5.17     |     5.0.4       |    vue upgrade @vue/cli-plugin-eslint |
```sh
? Continue to upgrade these plugins? (Y/n) 输入 n
```

## 三 手动升级上面结果中可升级的包到指定版本
```sh

vue upgrade @vue/cli-service --to 4.5.17
# 其他依次
vue upgrade @vue/cli-plugin-babel --to 4.5.17

# 出现以下警告
#WARN  There are uncommitted changes in the current repository, it's recommended to commit or stash them first.
# ? Still proceed? (y/N) 输入 y
```
## 四 验证
1. 删除 node_modules 重装依赖
2. 运行 dev server，处理异常
3. 注意 eslint prettier 等工具报错信息及处理。
4. 运行 build

## 五 验证无误迁移成功
