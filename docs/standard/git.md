# Git 规范<Badge text="WIP" />

## Git 分支管理

**1. 命名规范**

分支命名规则：**[类型]-([描述]｜[需求地址])-[开发者]**

1. **类型**：`feat`、`hotfix`等
2. **开发者**：开发者姓名简拼，若有冲突可后缀添加工号。
3. **描述**：简要描述开发任务，使用英文字母/数字/连接符，禁止中文。
4. **需求地址**：可根据情况命名
    - 有 JIRA 地址的使用 [JIRA_ID]，例如：`hotfix-fe-14`、`feat-fe-14`
    - 有根据线上 Tag 版本的使用 [TAG_ID]，把`.`替换为``，例如：`hotfix-v1-2-3`

**2. 分支规范**

我们遵循 `主干（master）集成、release上线分支、feat需求分支、dev开发分支`。

- 使用 `master` 主分支。
- 使用 `release` 上线分支。
- 使用 `hotfix` 作为紧急Bug修复分支。
- 使用 `feat` 而非 `feature`。
- 使用 `dev` 开发环境分支。
- 使用 `test` 测试环境分支。
- 使用 `uat`  生产验证分支。
- 分支连接符使用 `-` 例：`feat-` `hotfix-20220808`。
- 分支全部采用小写。

**3. Tag 规范**

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
