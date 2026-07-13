# AGENTS.md — 仓库操作约束

> 给在这个仓库里干活的 agent 看的。人类 README 见 [README.md](./README.md);品牌 / 设计 / 演进史见 [spec.md](./spec.md)。本文件只写**仓库级操作契约**,不写历史叙事。

## 1. 项目一句话

中南大学 InnOSeed Lab 品牌站。**v4 是 React 18 + TS 5.6 + Vite 5 + react-router-dom 7** 的纯静态 SPA,Vercel 部署。`api/apply.ts` 是唯一的 serverless function,`aliyun-fc/` 是配套的飞书 Bitable webhook。**所有"如何构建/部署/接入第三方"的事实源都在 README.md + spec.md,改之前先读**。

## 2. 不要碰的东西

| 路径 / 文件 | 原因 |
| --- | --- |
| `public/imgs/banner-*` `group-photo-*` `og-cover.png` `favicon.png` | 实验室品牌素材,需走 `scripts/optimize-images.py` 或 `build-og-cover.py` 重新生成,不要直接编辑 |
| `dist/` `.vercel/` `.wrangler/` `aliyun-fc/.s/` | 构建产物 / 部署状态,gitignore 之外也不要清(留着便于复现) |
| `pnpm-lock.yaml` | pnpm 锁文件,只随 `pnpm install` 更新 |
| `vercel.json` 的 `framework: null` | 显式声明以保稳定,不要让 Vercel 推断 |
| `tsconfig.json` 的 `strict: true` | 全量迁移已完成,不要再放回宽松 |
| `src/styles/globals.css` 顶部的 design token 块 | 颜色 / 字号 / 断点是 spec.md 锁定的;改前先同步更新 spec.md |
| `index.html` 的 `<link rel=preload imagesrcset>` 列表 | 与 `public/imgs/` 的 srcset 强绑定,改一处要改另一处 |
| `api/apply.ts` 的 `// mirror of src/content/apply.ts#...` 注释链 | 改 `src/content/apply.ts` 的 encode/decode 后必须同步 `scripts/test-tag-codes.mjs` 镜像 |
| `.github/workflows/ci.yml` 的 Node 22 / pnpm 10 | 镜像 Vercel 生产环境,改 CI 时本地必跑通再 push |
| `.omx/` | 运行时状态,agent 应当写入而非删除 |

## 3. 改之前必读

| 任务 | 必读 |
| --- | --- |
| 改文案 | `src/content/site.ts` 是唯一文案源;Footer / Recruit 时间线 / 招新 FAQ 都在那里。改 Hero 同步看 `index.html` 的 `og:description` / `meta description` |
| 改视觉 / 排版 | `spec.md` §5–§8 是字号 / 颜色 / 断点 / 动效的契约;改完同步 spec.md |
| 改 4 个 pillar 配色 | `--c-compete` / `--c-research` / `--c-startup` / `--c-bonds` 在 `globals.css` 顶部;Pillar icons 在 `Pillars.tsx` 顶部 `PILLAR_ICONS`;`ApplyTag.pillarKey` 在 `site.ts` / `apply.ts` 共享 |
| 改 `/apply` 表单字段 | 同时改 `src/content/apply.ts` + `src/pages/Apply.tsx` + `api/apply.ts` 的 `ApplyRequest` 类型 + `scripts/test-tag-codes.mjs` 镜像 |
| 改招聘面试官 | `src/content/apply.ts` 的 `INTERVIEWERS` 数组;roster 改了同步 `INTERVIEWER_MAP` env |
| 改导航条目 | `src/content/site.ts` 的 `NAV_LINKS`;新加 anchor 必须对应 `<section id=...>` 存在于某个组件 |
| 改 SEO meta | `index.html` (head) + `src/content/site.ts` 的 `META` 字段 |
| 改 Vercel 路由 / 缓存 | `vercel.json`;改完用 `vercel dev` 验一遍 (本地有 `.vercel/` 状态) |
| 接飞书 Bitable | 先看 `api/apply.ts` 顶部注释列出的 4 个目标 (Bitable / Airtable / Vercel KV / Notion),Bitable 是首选,签名 `applyHandle(request)` 不动 |

## 4. 工作流 (执行 / 验证 / 提交)

### 4.1 本地验证顺序

```bash
pnpm install
pnpm typecheck                    # 严格 TS,必过
pnpm exec tsc -p tsconfig.node.json   # vite.config.ts 的 Node 类型
pnpm build                        # tsc --noEmit && vite build
pnpm test:tag-codes               # 招新 tagcode 镜像测试
pnpm test:e2e                     # 29 个烟雾测试 (~12s)
```

> 改文案 / 视觉 → 至少跑 `pnpm typecheck && pnpm build && pnpm test:e2e` 三件套。
> 改表单 / API → 上面全套 + `pnpm test:tag-codes`。

### 4.2 改 `src/content/apply.ts` 的 encode/decode

这两个函数是**单源**,被三处消费:

1. `src/content/apply.ts` (浏览器跑)
2. `api/apply.ts` (Vercel Function 跑,Vercel 不支持跨文件 import,所以部分是 inlined 副本)
3. `scripts/test-tag-codes.mjs` (Node 跑,无 TS,所以是手写镜像)

改一处 → 同步另两处。改后跑 `pnpm test:tag-codes` 验镜像对齐。

### 4.3 提交 / 分支

- 分支前缀 `codex/`
- commit 风格:简短动词开头 (例: `fix(nav): 修移动端 hamburger 收起时机`)
- 不需要 lore trailer;若 PR 涉及 spec 改动,描述里点出 spec.md 改了哪节

### 4.4 部署

- 推 `main` → Vercel 自动部署 (Production)
- PR → Vercel 自动给 preview URL
- **不要**手动 `vercel deploy`;CI 是权威
- 部署后看构建状态:Vercel dashboard → `innoseed-landing` → Deployments

## 5. 路由 / 组件契约

| 入口 | 组件 / 渲染 | 关键依赖 |
| --- | --- | --- |
| `/` | `App.tsx` 默认分支 | 9 个 section 组件 + `Nav` + `Footer` |
| `/apply` | `pages/Apply.tsx` | 4 步表单,自身管 step state,**不**渲染 `Nav` / `Footer` (用户从 Hero CTA 进入) |
| `/events` `/recruit` | `pages/Events.tsx` / `pages/Recruit.tsx` | 渲染 `Nav` + 复用 `components/Events` / `components/Recruit` (传 `showHead={false}` 避免双 h2) + `Footer` |
| `*` | `pages/NotFound.tsx` | 走 Vercel 404 兜底,前端 NotFound 兜客户端路由 |

**section id 锚点(供 nav 跳转)**:`#top` `#manifesto` `#pillars` `#members` `#events` `#recruit`。新增 section 必须:① 加 id ② 同步 `NAV_LINKS` ③ 跑 `pnpm test:e2e` 验 `checkNavSmoothScroll` 还过。

## 6. 可观测性 / Analytics

- `src/lib/observability.ts` 三层: 全局错误 / Web Vitals (LCP CLS INP) / 业务事件白名单
- 业务事件名 (`EventName` union) 加新事件前先在 union 里登记,便于埋点审查
- 上报策略:
  - `VITE_ANALYTICS_ENDPOINT` 设了 → POST JSON (Plausible-style 自建)
  - `VITE_ANALYTICS_URL` 设了 → 注入 script tag (Plausible / Umami)
  - 都不设 → 只 `console.debug`,不联网
- `vite.config.ts` 的 `inject-build-info` 把 `{ sha, time, mode, deploymentId, url }` 写到 `window.__BUILD__`,所有观测都带这个上下文
- 永远不允许 observability 自己抛错 (`send` / `trackError` 都 swallow)

## 7. e2e 测试约定

- 三档 viewport,各自一个 spec 文件 (避免 projects 配置导致断言跑错断点):
  - `desktop.spec.js` → 1440×900
  - `mobile.spec.js` → 375×812 (iPhone 14)
  - `iphone-se.spec.js` → 320×568 (iPhone SE 1)
- `apply.spec.js` → `/apply` 路由,`page.route` mock `/api/apply` (避免真打后端)
- 共享断言放 `e2e/_shared.js`
- 新加 section / 路由 → 加对应 viewport 的"渲染存在"断言;锚点改了 → `checkNavSmoothScroll` 自动覆盖

## 8. 安全护栏

- **不发任何 secret 到前端**:`.env*` 已被 `.gitignore` 默认;构建产物 `dist/` 也别提交
- `vercel.json` 的 `Permissions-Policy` 显式禁了 `camera` / `microphone` / `geolocation` / `interest-cohort`,新加嵌入功能时检查是否冲突
- 飞书 `INTERVIEWER_MAP` 等 env 不要写进代码;Vercel dashboard 配
- `apply.ts` 接收的 payload 视作不可信,server-side 必须 re-derive tag indices (当前 stub 已做)
- 第三方 CDN 仅限 Google Fonts;不引入新 CDN 依赖

## 9. 不要做的常见错

- ❌ 在 `globals.css` 用 Tailwind / Sass / CSS-in-JS — 仓库坚守原生 CSS + design token
- ❌ 把图片放 `src/` 而不是 `public/imgs/` — `src/` 走打包,`public/imgs/` 才走 srcset + 1 年缓存
- ❌ 新建 `components/SectionName/index.tsx` 这种目录式组件 — 项目统一扁平 `components/SectionName.tsx`
- ❌ 改 `e2e/` viewport 不通过 `test.use({ viewport })` — 改全局 `playwright.config.js` 会让 mobile 断言跑在 1440 上
- ❌ 删 `e2e/_shared.js` 的断言就为跳过 — 那些是回归守护,iPhone SE 1 那组尤其脆
- ❌ 改 `vercel.json` 后不跑 `vercel dev` 验证 — 缓存策略错配要一周后才能在生产看出来
- ❌ 在 PR 描述里写 "AI generated" 类元信息 — 仓库 owner 偏好自然语言 commit / PR 描述

## 10. 边界与外部依赖

- **Vercel** — 唯一正式部署目标
- **Aliyun FC** — 飞书 Bitable 反向解码 webhook,**只**在 `aliyun-fc/` 子目录维护
- **Google Fonts** — 唯一外链字体,font-family 链 system-first 兜底
- **GitHub** — 协作 + CI + Project 看板,见 `.github/PROJECT_SETUP.md`
- **Sentry / DataDog / 第三方 APM** — 未引入,不要主动加

## 11. 求助 / 上报

- 仓库 owner 通过 `.github/ISSUE_TEMPLATE/` 的 Bug 报告 / 网站修改模板接收
- 招新相关走 "招新待办" 模板
- 涉及 spec.md 变更的 → PR 标题加 `[spec]`,review 时同步给 owner 确认
