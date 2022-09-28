# Commit Message 规范

参考 [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)

## 格式

每次提交，Commit message 都由 **header、body** 和 **footer** 三个部分组成。

**header** 是必需的，**body** 和 **footer** 可以省略。

任何一行提交信息都不能超过 100 个字符。这是为了避免自动换行影响阅读。

## Header

**header** 有一种特殊的格式只有一行，包括 **type**（类型），**scope**（范围）和 **subject**（主题）。

```shell
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

**type**、**subject** 是必需的，**scope** 是可选的。

### Type

docs：文档（documentation）
style： 格式（不影响代码运行的变动）
refactor：重构（即不是新增功能，也不是修改bug的代码变动）
test：增加测试
chore：构建过程或辅助工具的变动

type 用于说明 commit 的类别，必须为下列之一：

- **build**：影响构建系统或外部依赖项的更改。例如：gulp、npm、broccoli。
- **ci**: 对 CI 配置文件和脚本的更改。例如：Circle、BrowserStack、SauceLabs。
- **docs**：仅仅文档更改。
- **feat**：新功能（feature）。
- **fix**：修复bug。
- **perf**：提高性能的代码更改。
- **refactor**：重构，既不是修复 bug 也不是添加新功能的代码更改。
- **style**：格式，不会影响代码含义的更改（空白、格式、缺少分号）。
- **test**：添加缺失的测试或更正现有的测试。
- **chore**：构建过程或辅助工具的变动。

如果 type 为 feat、fix，则该 commit 将会出现在 Change log 中。其它的则由自己决定要不要放入 Change log 中，建议是不要。

例子：

```shell
chore: update yarn.lock

build(deps-dev): bump serialize-javascript from 1.3.0 to 2.1.2 (#10914)
```

#### Revert

还有一种特殊情况。如果当前提交是撤销之前的提交，那么应该以 `revert:`  开头，后面跟撤销的 commit SHA-1值。在主体中应该说：`This reverts commit <hash>.`，其中的 `<hash>` 是撤销提交的 SHA-1 值。

### Scope

scope 用于说明 commit 影响的范围，比如数据层、控制层、视图层等等，视项目不同而不同。

以下是受支持范围的列表：

- **animations**
- **common**
- **compiler**
- **compiler-cli**
- **core**
- **elements**
- **forms**
- **http**
- **language-service**
- **platform-browser**
- **platform-browser-dynamic**
- **platform-server**
- **platform-webworker**
- **platform-webworker-dynamic**
- **router**
- **service-worker**
- **upgrade**
- **zone.js**

当然也有一些例外：

- **packaging**：用来更改 packages 里 npm 包的更改。例如：公共路径更改、对所有 packages 的 package.json 的更改、d.ts 文件/格式的更改、对 bundles 的更改。
- **changelog**：用于更新发行说明的 CHANGELOG.md 更改。
- **docs-infra**：用于仓库的 /aio 目录中与 docs-app（[angular.io]）相关的更改。
- **ivy**：用于渲染器的更改。
- **ngcc**：用于 Angular Compatibility Compiler 的更改。
- none/empty string：对于所有 packages 的 `style`, `test` 和 `refactor` 更改（例如： `style: add missing semicolons`）以及与特定 package 无关的文档更改 （例如： `docs: fix typo in tutorial`)。

### Subject

subject 是对 commit 目的的**简洁**描述。

- 以动词开头，使用第一人称现在时。使用 change，而不是 changed 或 changes。
- 第一个字母小写
- 结尾不加句号（`.`）

## Body

body 是对 commit 目的的**详细**描述，可以分成多行。

- 跟 **subject** 一样使用动词开头、第一人称现在时。
- body 应该说明代码改变的动机，并将其与之前的行为进行比较。

## Footer

footer 部分只用于两种情况。

- 重大更改。重大更改应以 **Breaking Changes** 开头。一个简短的摘要，说明重大更改的内容，以及对其重大更改的详细说明，以及从旧功能到新功能的迁移路径。
- 关闭 issue。如果当前 commit 针对某个 issue，可以在 footer 部分包含对[问题的结尾引用]关闭这个 issue。

例子：

```shell
fix: correct the twinkle

The twinkle was not previously astronomically correct;
this fix corrects to a precision of six decimal places.

Fixes #14
```
