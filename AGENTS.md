# AGENTS.md — 仓库操作约束

> 给在这个仓库里干活的 agent 看的。人类 README 见 [README.md](./README.md);品牌 / 设计 / 演进史见 [spec.md](./spec.md)。本文件只写**仓库级操作契约**,不写历史叙事。可执行长流程见下方 skill,skill 可引用本文件,但**不复制**长段契约。

## 1. 项目一句话

中南大学 InnOSeed Lab 品牌站。**v4 是 React 18 + TS 5.6 + Vite 5 + react-router-dom 7** 的纯静态 SPA,Vercel 部署。`api/apply.ts` 是唯一的 serverless function,`aliyun-fc/` 是配套的飞书 Bitable webhook。**所有"如何构建/部署/接入第三方"的事实源都在 README.md + spec.md,改之前先读**。

### Agent skills

源只在 `.agents/skills/<name>/`;`.pi/skills/<name>` **仅**为指向该目录的 symlink,不要在 `.pi` 维护唯一版本。

| Skill | 何时加载 | 路径 |
| --- | --- | --- |
| `innoseed-deploy` | 推 main / 加子域名 / DNS / `verify:subdomain` / 清分支 | `.agents/skills/innoseed-deploy/` |
| `innoseed-content` | 改文案 / SEO / NAV / section 锚点 / `MINICAMP` 内容块 | `.agents/skills/innoseed-content/` |
| `innoseed-apply` | 改 `/apply` 字段、encode/decode、面试官、tagcode 镜像 | `.agents/skills/innoseed-apply/` |
| `innoseed-visual` | 改 design token / `globals.css` / `spec.md` 视觉契约 / 品牌图脚本 | `.agents/skills/innoseed-visual/` |

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
| `api/apply.ts` 的 `// mirror of src/content/apply.ts#...` 注释链 | 改 encode/decode 后必须同步镜像 —— 走 `innoseed-apply` |
| `.github/workflows/ci.yml` 的 Node 22 / pnpm 10 | 镜像 Vercel 生产环境,改 CI 时本地必跑通再 push |
| `.omx/` | 运行时状态,agent 应当写入而非删除 |

## 3. 改之前必读

| 任务 | 去哪 |
| --- | --- |
| 改文案 / SEO / 导航 / 锚点 / Mini Camp 文案 | 加载 `innoseed-content`(`site.ts` 是唯一文案源) |
| 改视觉 / 排版 / pillar 配色 / 品牌图 | 加载 `innoseed-visual`(`spec.md` §5–§8 是契约) |
| 改 `/apply` 字段 / encode/decode / 面试官 | 加载 `innoseed-apply`(三处镜像必须对齐) |
| 改 Vercel 路由 / 缓存 | `vercel.json`;改完用 `vercel dev` 验一遍 |
| 接飞书 Bitable | 先看 `api/apply.ts` 顶部注释列出的 4 个目标;Bitable 首选;签名 `applyHandle(request)` 不动;解码 webhook 细节见 `innoseed-apply` |
| 上线 / 子域名 / DNS | 加载 `innoseed-deploy` |

## 4. 工作流 (执行 / 验证 / 提交)

### 4.1 本地验证顺序(权威清单)

```bash
pnpm install
pnpm typecheck                    # 严格 TS,必过
pnpm exec tsc -p tsconfig.node.json   # vite.config.ts 的 Node 类型
pnpm build                        # tsc --noEmit && vite build
pnpm test:tag-codes               # 招新 tagcode 镜像测试
pnpm test:e2e                     # 烟雾测试 (~12s)
```

> 改文案 / 视觉 → 至少 `pnpm typecheck && pnpm build && pnpm test:e2e`。
> 改表单 / API → 上面全套 + `pnpm test:tag-codes`。
> 各 skill 只写本任务的验证子集,不另维护完整命令表。

### 4.2 提交 / 分支

- 分支前缀 `codex/`(或与现有 `MciG-ggg/` 风格一致)
- commit 风格:简短动词开头 (例: `fix(nav): 修移动端 hamburger 收起时机`)
- 不需要 lore trailer;若 PR 涉及 spec 改动,描述里点出 spec.md 改了哪节

### 4.3 部署(摘要)

- 推 `main` → Vercel 自动部署 Production;**不要**手动 `vercel deploy`;CI 是权威
- 完整 ship / 子域名 / DNS / 分支清理 → `innoseed-deploy`

## 5. 路由 / 组件契约

| 入口 | 组件 / 渲染 | 关键依赖 |
| --- | --- | --- |
| `/` | `App.tsx` 默认分支 | 9 个 section 组件 + `Nav` + `Footer` |
| `/apply` | `pages/Apply.tsx` | 4 步表单,自身管 step state,**不**渲染 `Nav` / `Footer` |
| `/events` `/recruit` | `pages/Events.tsx` / `pages/Recruit.tsx` | `Nav` + 复用 section 组件(`showHead={false}`) + `Footer` |
| `/minicamp` | `pages/MiniCamp.tsx` | 子域名用 `SubdomainHeader` / `SubdomainFooter`;主站用完整 chrome;内容在 `site.ts` 的 `MINICAMP` |
| `*` | `pages/NotFound.tsx` | Vercel 404 兜底 + 客户端 NotFound |

**section 锚点**:`#top` `#manifesto` `#pillars` `#members` `#events` `#recruit`。新增步骤见 `innoseed-content`。子域名 host 行为见 `innoseed-deploy`。

## 6. 可观测性 / Analytics

- `src/lib/observability.ts` 三层:全局错误 / Web Vitals (LCP CLS INP) / 业务事件白名单
- 新业务事件名先在 `EventName` union 登记
- `VITE_ANALYTICS_ENDPOINT` → POST JSON;`VITE_ANALYTICS_URL` → 注入 script;都不设 → 只 `console.debug`
- `window.__BUILD__` 由 vite `inject-build-info` 注入;observability **不得**自己抛错

## 7. e2e 测试约定

- 三档 viewport 分文件:`desktop.spec.js`(1440×900) / `mobile.spec.js`(375×812) / `iphone-se.spec.js`(320×568)
- `apply.spec.js` mock `/api/apply`;共享断言在 `e2e/_shared.js`(**禁删**为跳过)
- 新 section / 路由 → 加对应 viewport「渲染存在」断言;锚点回归由 `checkNavSmoothScroll` 覆盖

## 8. 安全护栏

- **不发任何 secret 到前端**:`.env*` 已 gitignore;勿提交 `dist/`
- `vercel.json` 的 `Permissions-Policy` 禁了 `camera` / `microphone` / `geolocation` / `interest-cohort`
- 飞书 `INTERVIEWER_MAP` 等 env 只在 Vercel dashboard 配
- `apply.ts` payload 不可信,server-side 必须 re-derive tag indices
- 第三方 CDN 仅限 Google Fonts

## 9. 不要做的常见错

- ❌ 在 `globals.css` 用 Tailwind / Sass / CSS-in-JS — 原生 CSS + design token
- ❌ 把图片放 `src/` 而不是 `public/imgs/`
- ❌ 新建 `components/SectionName/index.tsx` — 统一扁平 `components/SectionName.tsx`
- ❌ 改 e2e viewport 不走 `test.use({ viewport })`
- ❌ 删 `e2e/_shared.js` 断言就为跳过
- ❌ 改 `vercel.json` 后不跑 `vercel dev`
- ❌ PR 描述写 "AI generated" 类元信息

## 10. 边界与外部依赖

- **Vercel** — 唯一正式部署目标
- **Aliyun FC** — 飞书 Bitable 反向解码 webhook,**只**在 `aliyun-fc/` 维护
- **Google Fonts** — 唯一外链字体,system-first 兜底
- **GitHub** — 协作 + CI + Project 看板,见 `.github/PROJECT_SETUP.md`
- **Sentry / DataDog / 第三方 APM** — 未引入,不要主动加

## 11. 求助 / 上报

- Bug / 网站修改 → `.github/ISSUE_TEMPLATE/`
- 招新相关 → 「招新待办」模板
- 涉及 spec.md → PR 标题加 `[spec]`,review 时同步 owner
