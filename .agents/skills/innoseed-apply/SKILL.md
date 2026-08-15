---
name: innoseed-apply
description: Change InnOSeed /apply form fields, tag encode/decode mirrors, interviewers, and Feishu Bitable-related apply payload handling. Use when editing src/content/apply.ts, pages/Apply.tsx, api/apply.ts, scripts/test-tag-codes.mjs, INTERVIEWERS, or tagcode interoperability.
---

# InnOSeed Apply

`/apply` 表单、个性标签 encode/decode、面试官名单、以及三处镜像对齐的可执行流程。上线走 `innoseed-deploy`；招新**文案**若在 `site.ts` 的 Recruit 块，走 `innoseed-content`。

## 何时触发

- 改表单字段 / 步骤 UI（`Apply.tsx` + `apply.ts` 类型与选项）
- 改 `encodeTagCode` / `decodeTagCode` / `encodeApplyCode` / `decodeApplyCode`
- 改 `INTERVIEWERS` 或需要同步 `INTERVIEWER_MAP` env
- 改 `api/apply.ts` 的 `ApplyRequest` / 服务端校验 / Bitable 写入路径
- 改 `scripts/test-tag-codes.mjs` 镜像或 `pnpm test:tag-codes` 失败

## 必读文件

| 文件 | 为何 |
| --- | --- |
| `src/content/apply.ts` | **浏览器侧单源**：categories / tags / INTERVIEWERS / encode·decode |
| `api/apply.ts` | Vercel Function；**不能**跨文件 import 浏览器模块，故含 inlined 副本 + `ApplyRequest` |
| `scripts/test-tag-codes.mjs` | Node 手写镜像；`pnpm test:tag-codes` 验三处对齐 |
| `src/pages/Apply.tsx` (+ CSS) | 4 步 UI / step state |
| `e2e/apply.spec.js` | mock `/api/apply`，勿打真后端 |
| `aliyun-fc/` | 飞书 Bitable 反向解码 webhook（只在此子目录维护） |

## 提醒（详见 AGENTS.md）

- payload 不可信：server-side **必须** re-derive tag indices。
- `INTERVIEWER_MAP` 等 secret 只进 Vercel env，不进前端。
- `applyHandle(request)` 签名不要为「图方便」改掉。
- `api/apply.ts` 顶部的 `// mirror of src/content/apply.ts#...` 注释链保持可读。

## 分步流程

### 改表单字段 / 选项 / 类型

1. 改 `src/content/apply.ts`（`ApplyTag` / `APPLY_CATEGORIES` / 相关类型）。
2. 同步 `src/pages/Apply.tsx` 的 UI 与校验文案。
3. 同步 `api/apply.ts` 的 `ApplyRequest`（及任何 inlined 选项副本）。
4. 若选项下标语义变了，更新 `scripts/test-tag-codes.mjs` 样例与断言。
5. 跑 `pnpm test:tag-codes` + apply e2e。

### 改 encode / decode（最高风险）

这两个（四函数）逻辑是**单源意图**，被三处消费：

1. `src/content/apply.ts` — 浏览器
2. `api/apply.ts` — Vercel Function（inlined 副本）
3. `scripts/test-tag-codes.mjs` — Node 手写镜像

**改一处 → 必须同步另两处。** 格式契约（勿无故破坏旧 code 可读性）：

- Tag code：`categoryIndex:tagIndices...` 段用 `;` 连接 → base64（`btoa` / `Buffer` 双运行时）
- Apply code：`{ivCode}|{base64TagCode}`；无面试官时 iv 占位 `_`

改完：

```bash
pnpm test:tag-codes
```

必要时同步 `aliyun-fc/` 若 webhook 内还有解码副本（先读该目录现有实现，勿假设无副本）。

### 改面试官 roster

1. 只改 `src/content/apply.ts` 的 `INTERVIEWERS`（并同步 `api/apply.ts` 的 inlined 列表）。
2. roster 的 code / 飞书 Person 映射变了 → 更新 Vercel 上的 `INTERVIEWER_MAP` env（**不要**写进仓库）。
3. 跑 `pnpm test:tag-codes`（含 iv 组合样例时）+ `pnpm test:e2e`（apply spec）。

### 接 / 改飞书 Bitable

1. 读 `api/apply.ts` 顶部注释列出的目标（Bitable / Airtable / Vercel KV / Notion）；**Bitable 首选**。
2. 保持 `applyHandle(request)` 入口稳定。
3. 反向解码与多选字段写入优先落在 `aliyun-fc/`，不要把 FC 逻辑塞进前端。

## 本任务验证子集

```bash
pnpm typecheck
pnpm exec tsc -p tsconfig.node.json
pnpm build
pnpm test:tag-codes
pnpm test:e2e
```

- apply 相关 UI 断言以 `e2e/apply.spec.js` 为准（已 mock API）。
