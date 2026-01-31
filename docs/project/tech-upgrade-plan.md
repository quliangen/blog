# 博客项目技术架构评估与升级计划

## 一、当前架构概览

| 维度 | 当前状态（已升级） |
|------|-------------------|
| 静态站点框架 | VitePress `^1.0.0`（实际 1.6.4） |
| 包管理 | pnpm 9 + lockfile |
| 构建/运行 | VitePress 内置 Vite，`"type": "module"` |
| CI/CD | GitHub Actions v4，Node 20，pnpm 9 |
| 部署方式 | 主分支 push 触发 + 本地 deploy.sh 推 gh-pages |

---

## 二、升级后发布流程会变更吗？

**不会。** 发布流程保持不变：

| 方式 | 触发 | 构建 | 产物路径 | 部署目标 |
|------|------|------|----------|----------|
| **CI** | push 到 `main` 或手动运行 workflow | `pnpm install` → `pnpm build` | `docs/.vitepress/dist` | GitHub Pages（deploy-pages） |
| **本地** | 执行 `./deploy.sh` | `pnpm run build` | 同上 | 推送到 `gh-pages` 分支 |

升级只改 **运行环境**（Node 20、pnpm 9、Actions v4），不改步骤和脚本。`deploy.sh` 无需修改；workflow 仅改 action 版本与 Node/pnpm 版本号。

---

## 三、是否需要升级：结论

**建议升级。** 当前技术栈存在以下风险与落后点：

1. **VitePress 版本过旧**  
   使用 `1.0.0-alpha.15`（alpha 阶段），而官方已发布稳定版 1.x（当前约 1.6.x）。alpha 无长期维护保证，且缺少安全与功能更新。

2. **Node 版本已 EOL**  
   CI 中固定使用 Node 16，Node 16 已于 2023-09 结束维护。继续使用存在安全与兼容性风险。

3. **GitHub Actions 使用旧版**  
   `actions/checkout@v3`、`actions/setup-node@v3` 等已有 v4，新版在性能与功能上更优。

4. **缺少工程约束**  
   `package.json` 未声明 `engines`，不利于统一本地与 CI 的 Node 版本，也缺少类型、规范等基础配置。

5. **配置与官方现状可能不完全一致**  
   当前配置虽已使用 `items`、`themeConfig.footer` 等，但与 VitePress 1.x 官方推荐结构可能有小差异，升级时一并对齐更稳妥。

因此，从**安全、可维护性和与社区一致**角度，建议按下面计划做一次有步骤的升级。

---

## 四、升级计划（分阶段）

### 阶段一：基础与环境（低风险，优先做）

| 序号 | 项 | 当前 | 目标 | 说明 |
|------|----|------|------|------|
| 1.1 | Node 版本 | 未约束 / CI 用 16 | 本地与 CI 统一为 **Node 20 LTS** | 在 `package.json` 增加 `engines.node`，CI 改为 `node-version: 20`。 |
| 1.2 | pnpm 版本 | CI 固定 8.6.2 | 使用 **pnpm 9.x** 或当前稳定版 | 与 Node 20 搭配更合适，可先改 CI 再统一团队本地。 |
| 1.3 | GitHub Actions | checkout@v3, setup-node@v3 | **@v4** | 仅改版本号，通常无需改 workflow 逻辑。 |
| 1.4 | package.json 约束 | 无 | 增加 **engines**、可选 **type** | 例如 `"engines": { "node": ">=20" }`，若全面 ESM 可设 `"type": "module"`（视 VitePress 升级后再定）。 |

**产出**：  
- 修改 `package.json`（engines、必要时 type）。  
- 修改 `.github/workflows/deploy.yml`（Node 20、pnpm 版本、actions @v4）。  
- 本地与 CI 均使用 Node 20 验证：`pnpm install`、`pnpm build`、`pnpm serve`。

---

### 阶段二：VitePress 升级到稳定版（核心）

| 序号 | 项 | 当前 | 目标 | 说明 |
|------|----|------|------|------|
| 2.1 | VitePress | 1.0.0-alpha.15 | **^1.0.0** 或 **^1.6.x**（按需锁定小版本） | 在 `package.json` 将 `vitepress` 改为稳定版范围，然后 `pnpm update vitepress`。 |
| 2.2 | 配置兼容性 | 现有 config.js | 对照 [VitePress 1.x 迁移说明](https://vitepress.dev/guide/migration-from-vitepress-0) 逐项检查 | 重点：sidebar 用 `items`（你已用）、`themeConfig` 结构、无 0.x 废弃项。 |
| 2.3 | 主题与默认行为 | 默认主题 | 确认 nav、sidebar、footer、socialLinks 等与 1.x 文档一致 | 若有自定义组件或主题扩展，需在 1.x 下再测一遍。 |
| 2.4 | 构建与路由 | base: '/blog/' | 保持不变，仅验证 | 确保 `pnpm build` 后 `docs/.vitepress/dist` 内路径与当前一致。 |

**建议步骤**：  
1. 在单独分支上升级：`pnpm add -D vitepress@^1.0.0`（或 `@^1.6.0`）。  
2. 运行 `pnpm dev`、`pnpm build`，按控制台与迁移文档处理废弃 API。  
3. 检查首页、各 nav、各 sidebar、footer、站内链接与 `base: '/blog/'` 的兼容性。  
4. 确认无问题后合并，并考虑将版本锁定为 `^1.6.x` 以便后续小版本更新。

**产出**：  
- `package.json` 与 `pnpm-lock.yaml` 中 VitePress 为 1.x 稳定版。  
- `docs/.vitepress/config.js`（及可能的 theme 扩展）符合 1.x 规范。  
- 文档中若有 `home: true` 或 0.x 专用 frontmatter，改为 1.x 写法（如 `layout: home`）。

---

### 阶段三：工程化与体验（可选）

| 序号 | 项 | 当前 | 目标 | 说明 |
|------|----|------|------|------|
| 3.1 | 类型与规范 | 仅 JS | 可选：**config 改为 .ts**、启用严格 TS | 若团队希望类型安全，可将 `config.js` 改为 `config.ts` 并配好 tsconfig。 |
| 3.2 | 脚本与校验 | 仅 build/dev/serve | 可选：**lint（ESLint）+ format（Prettier）** | 已有 `.prettierrc`，可加 `lint`/`format` 脚本与 CI 校验。 |
| 3.3 | 部署方式 | workflow + deploy.sh | 保持或逐步收口到 **仅 GitHub Actions** | 若长期只用 Pages，可弱化或移除 deploy.sh，避免两套流程。 |
| 3.4 | 依赖审计 | 无 | 可选：**pnpm audit**、**dependabot** | 定期检查依赖漏洞，仓库可开启 Dependabot 做自动化 PR。 |

此阶段可按时间分批做，不影响主流程。

---

## 五、实施顺序与时间建议

```
阶段一（约 0.5 天）→ 阶段二（约 1 天）→ 阶段三（按需）
```

- **先做阶段一**：改 Node、pnpm、Actions 版本并跑通 CI，风险低、收益明确。  
- **再做阶段二**：VitePress 升级是本次核心，建议在独立分支完成并做一次全站点击验证。  
- **阶段三**：在稳定运行一段时间后，按需加入 TS、lint、仅 Actions 部署等。

---

## 六、回滚策略

- **阶段一**：若 CI 失败，将 `node-version`、`pnpm`、actions 版本改回原值即可。  
- **阶段二**：保留升级前 `package.json` 与 `pnpm-lock.yaml` 的备份或提交，若 1.x 兼容问题较多，可先回退到 alpha.15，再分小步迁移（例如先只升级依赖不改配置，再逐步改配置）。

---

## 七、简要检查清单（升级后自检）

- [ ] 本地 `node -v` 为 20.x，`pnpm install` 与 `pnpm build` 成功。  
- [ ] CI 使用 Node 20 与新版 actions，Deploy 成功。  
- [ ] VitePress 为 1.x 稳定版，无控制台废弃警告。  
- [ ] 站点 `base: '/blog/'` 下首页、导航、侧栏、内链、footer 正常。  
- [ ] （可选）`package.json` 含 `engines`，且与 CI/文档说明一致。

---

---

## 升级执行记录（已完成）

- **执行时间**：按计划执行
- **阶段一**：`package.json` 增加 `name`、`version`、`engines.node: ">=20"`、`type: "module"`，VitePress 升级为 `^1.0.0`；GitHub Actions 升级为 checkout@v4、pnpm/action-setup@v4（pnpm 9）、setup-node@v4（Node 20）。
- **阶段二**：执行 `pnpm install --no-frozen-lockfile` 更新 lockfile，VitePress 解析为 1.6.4；`pnpm build` 通过。因 VitePress 1.x 为纯 ESM，补充 `"type": "module"` 以正确加载 `.vitepress/config.js`。
- **发布流程**：未变更；`deploy.sh` 未修改。

**文档维护**：若后续升级到 VitePress 2.x 或更换部署方式，可在此文档后追加「版本二」升级计划。
