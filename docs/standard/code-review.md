# Code Review

Code Review 不仅仅保证代码质量，更重要的是： **通过代码** **交流学习**

## 工具与角色

Code Review 所依赖的工具是 **GitLab**。

整个 Code Review 流程在 GitLab 项目中有两个点比较关键：

- `Merge Request`（简称：***MR***）
- `Discussion`（简称：***Diss***）

同时需要针对 GitLab 的项目进行配置：

- GitLab 和 钉钉 打通，每次有 MR 时会推送到钉钉
- 项目进行配置合并检查，所有的 Diss 都必须解决才能合并（Settings - General - Merge requests - Merge checks - All discussions must be resolved）

在 Code Review 过程中几个角色：

- ***Owner***（MR 发起者，需求负责人，代码改动提交者）
- ***Reviewers***（负责 Review 代码，MR 参与者，前端团队的同事，可能不止一个人）
- ***Disser***（某个 Reviewer，对某个 MR 发起 Discussion 的人）

## 原则

1. Owner 发起 MR 之前的代码需要进行充分自测
2. 如果版本改动较大，应提前在测试介入时就进行 Code Review（可通过 Repository - Compare）
3. 尽快响应 Code Review 请求，不阻塞他人的工作
4. 如果某个 MR 紧急，可以告知 Reviewers
5. 除有必要，Owner 不要在测试、验收阶段删除分支，应等待分支合入 Master 分支后移除
6. 定期回顾和总结 Code Review 执行情况

## 流程

1. Owner 在本地某分支开发完成，充分自测之后将代码推送到 GitLab。
2. 在 GitLab 发起 MR 之前，需保证当前分支代码已合并远端 Master 分支最新的代码****无冲突****并做 ****git rebase****。
3. Owner 成功发起 MR 后，会自动通过钉钉告知到群里，告知 Reviewers 有 MR 需要进行 Code Review，Owner 可告知 Reviewers 紧急程度。
4. Reviewers 基于 MR 进行进行 Code Review。如果对 MR 有任何问题，在 GitLab 上针对具体代码进行发起 Discussion，Review 完成后通知 Owner 结果（本次 MR 通过 / 本次 MR 有多少个 Diss）。如果有 Diss，Owner 需要对每一个 Diss 进行回复，直至所有 Diss 的状态变更为 Resolved。
5. Reviewers 对 MR 进行 Merge 操作，Owner 在测试环境发布代码，通知相关 QA 同学回归测试。
6. 如果测试或者验收环节发现问题，Owner 需要对代码进行修改，然后发起新一轮的 MR，直至测试环境代码通过验收。
7. 和 QA 同学确认代码可以发布至生产环境，并进行代码发布。

## 边界

1. 线上出现紧急 bug 时（Hotfix 分支）可不进行 Code Review。
2. 某个需求（项目）留给开发时间非常紧张时可不进行 Code Review，优先保证按时上线。
3. Code Review 后改动的影响面太大，可考虑暂不优化。
