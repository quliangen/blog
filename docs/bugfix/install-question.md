# 前端项目部署常见问题

## sentry-cli

项目拉取依赖 `sentry-cli` 特别久

项目内依赖 `@sentry/webpack-plugin`

### 解决方案

```yaml
# .npmrc
sentrycli_cdnurl=https://npmmirror.com/mirrors/sentry-cli
```

## node-sas

项目拉取依赖 `node-sass` binary 失败

### 解决方案

```yaml
# .npmrc
sass_binary_site=https://npmmirror.com/mirrors/node-sass
```

## pnpm install 失败提示 `frozen-lockfile`

```shell
Lockfile is up-to-date, resolution step is skipped
 ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up-to-date with package.json
Note that in CI environments this setting is true by default. If you still need to run install in such cases, use "pnpm install --no-frozen-lockfile"
ERROR: Job failed: command terminated with exit code 1
```

### 解决方案

依次执行一下命令：

1. `rm -rf pnpm-lock.yaml node_modules`
2. `pnpm install`
3. `git add pnpm-lock.yaml`
4. `git commmit -m 'build: update pnpm-lock.yaml'`
5. `git push`

## install 失败提示 `node-pre-gyp ERR`

```shell
> fsevents@1.2.2 install /Users/qle/Desktop/work/project/credit-rule-engine/ReactWebCode/approveLine/node_modules/fsevents
> node install

node-pre-gyp ERR! Tried to download(403): https://fsevents-binaries.s3-us-west-2.amazonaws.com/v1.2.2/fse-v1.2.2-node-v83-darwin-arm64.tar.gz 
node-pre-gyp ERR! Pre-built binaries not found for fsevents@1.2.2 and node@14.18.1 (node-v83 ABI, unknown) (falling back to source compile with node-gyp) 
  SOLINK_MODULE(target) Release/.node
  CXX(target) Release/obj.target/fse/fsevents.o
In file included from ../fsevents.cc:6:
In file included from ../../nan/nan.h:202:
In file included from ../../nan/nan_converters.h:67:
../../nan/nan_converters_43_inl.h:22:1: error: no viable conversion from 'Local<v8::Context>' to 'v8::Isolate *'
X(Boolean)
^~~~~~~~~~
../../nan/nan_converters_43_inl.h:18:23: note: expanded from macro 'X'
...
```

### 解决方案

依次执行一下命令：

1. 删除 lock 文件
2. 重新 install
