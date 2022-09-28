# NPM 包



## Git Tag 规范

Tag 需遵循 [语义化版本 semver](https://semver.org/lang/zh-CN/) 规范

命名规则：**[类型][release版本]-[stages版本]**

例如：

```js
v3.0.1
v3.0.0
v3.0.0-rc.3
v3.0.0-rc.2
v3.0.0-rc.1
v3.2.0-beta.3
v3.2.0-beta.2
v3.0.0-beta.1
v3.0.0-alpha.2
v3.0.0-alpha.1
v3.0.0-alpha.0
v2.7.8
```

## NPM 包版本管理

推荐使用 [standard-version](https://www.npmjs.com/package/standard-version) 进行管理，将会自动进行以下步骤：

- 修改 `package.json` 中的 `version`
- 生成 `CHANGELOG.md` 文件
- 生成 Git Commit
- 打 Git Tag

```json
{
  "scripts": {
    "release": "standard-version",
    "postrelease": "git push --follow-tags"
  }
}
```

注意：若使用 pnpm 则需要在 `.npmrc` 上新增一个配置（因为 pnpm 默认不自动执行 `pre`、`post` 等 hook）

```yaml
enable-pre-post-scripts=true
```

**相关命令**

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
