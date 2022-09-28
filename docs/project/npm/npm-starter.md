# 开发调试发布 NPM 包流程

## 初始化项目
## 开发功能
## 调试

1. sdk项目根目录执行
   
```shell

# 开发环境并开启热更 
pnpm dev

# 连接 sdk 到全局
pnpm link --global
# 无输出

# 或
yarn link
# 输出
# success Registered "pkg".
# info You can now run `yarn link "pkg"` in the projects where you want to use this package and it will be used instead.
# ✨  Done in 0.03s.
```
2. 使用 sdk 的项目中
```shell
yarn link pkg
# 或
pnpm link --global pkg
```
3. 修改 sdk 源码，验证步骤 2 的项目是否更新。未更新重启 2 项目。

## 发布
1. 构建产物
```shell
# 打版本标签
npm version v1.0.0
# 构建
pnpm build
```
2. 登录npm
```shell
npm login
```
3. 登录npm
```shell
# 发布正式版本
npm publish
# 发布测试版本
npm publish  --tag=beta
```
