# CSU InnOSeed Lab — 官网 v4 (React)

v4 把 v3 单文件 HTML 拆成了 React + Vite 项目，**视觉与 v3 完全一致**，结构换了。
Awwwards editorial 的设计语言、Fraunces 大字、numbered eyebrow、marquee、reveal 动画、4-pillar 卡片、manifesto、inside split、recruit CTA、multi-column footer —— 全部保留。

## Stack

- **React 18** + **TypeScript 5.6** — 组件化，每个 section 一个文件，全 `strict` 模式
- **Vite 5** — dev server + 生产打包，配置文件也是 `vite.config.ts`
- **CSS** — `src/styles/globals.css`（design tokens / 关键帧 / 媒体查询）
- **Hooks** — `useReveal` / `useCountUp` / `useScrolled` / `useSmoothAnchorScroll` / `useHeroParallax`（全 `RefObject<T | null>` 签名）
- **图片** — `public/imgs/`（Vite 原生静态资源），运行时走 `/imgs/...`
- **Playwright** — 29 个 e2e 烟雾测试（desktop + mobile + iPhone SE 1）

## 结构

```
innoseed-landing/
├── .github/workflows/ci.yml      ← GitHub Actions: typecheck + build + Playwright
├── index.html                    ← Vite 入口（meta + Google Fonts + favicon + OG + preload）
├── package.json
├── pnpm-workspace.yaml           ← pnpm 11 allowBuilds: esbuild
├── playwright.config.js          ← Playwright 配置（spec-internal viewport）
├── spec.md                       ← v4 设计稿 + 决策记录 + roadmap
├── tsconfig.json                 ← 主项目 strict TS（src/）
├── tsconfig.node.json            ← vite.config.ts 专用（Node types）
├── vercel.json                   ← outputDirectory: dist + 安全 headers + 缓存策略 + 函数配置
├── vite.config.ts                ← React + inject-build-info + 条件注入 analytics 脚本
├── public/
│   ├── 404.html                  ← 自定义 404
│   └── imgs/                     ← banner / favicon / group-photo (WebP + JPEG variants)
├── scripts/
│   ├── build-og-cover.py         ← 用 PIL 生成 1200×630 OG 图
│   └── optimize-images.py        ← 批量生成 WebP + 多宽度 JPEG
├── src/
│   ├── main.tsx                  ← initObservability() 在 mount 前调用
│   ├── App.tsx                   ← 装配 + skip-link + main landmark
│   ├── styles/globals.css        ← design tokens + 全套移动端媒体查询
│   ├── hooks/                    ← 5 个交互 hook（带 TS 类型签名）
│   ├── lib/
│   │   ├── observability.ts      ← Web Vitals + 错误 + 业务事件 + endpoint 上报
│   │   └── buildInfo.ts          ← window.__BUILD__ 类型声明
│   ├── content/
│   │   ├── site.ts               ← 全部文案 / 数据 + 导出 interface (新增 EVENTS / RECRUIT_EXTRAS)
│   │   └── apply.ts              ← /apply 表单 4 类标签 + 面试官 roster
│   ├── components/               ← Nav / Hero / Marquee / Manifesto / Pillars / Numbers / Members / Inside / Events / Recruit / Footer (全 .tsx)
│   └── vite-env.d.ts             ← Vite client types + fetchpriority 增强
├── api/
│   └── apply.ts                  ← /api/apply Vercel Function (结构化日志 + request id)
├── e2e/
│   ├── _shared.js                ← 跨断点共享断言
│   ├── desktop.spec.js           ← 1440×900 viewport
│   ├── mobile.spec.js            ← 375×812 viewport (iPhone 14)
│   └── iphone-se.spec.js         ← 320×568 viewport (iPhone SE 1) — 9 个回归测试
└── dist/                         ← pnpm build 产物
```

## 命令

```bash
pnpm install                      # 装依赖（esbuild postinstall 走 pnpm-workspace.yaml 白名单）
pnpm dev                          # http://127.0.0.1:8765
pnpm typecheck                    # tsc --noEmit（strict）
pnpm build                        # tsc --noEmit && vite build → dist/
pnpm preview                      # 本地预览 dist/

# Playwright
pnpm test:e2e:install             # 一次性装 chromium
pnpm test:e2e                     # 29 个烟雾测试，~12s
pnpm test:e2e:headed              # 可见浏览器跑（debug 用）
pnpm test:e2e:ui                  ← Playwright 自带 UI 调试
```

## Analytics（Plausible / Umami 接入）

`vite.config.js` 里有个内联插件 `inject-analytics`：build 时读两个 env var，
有就往 `dist/index.html` 的 `</head>` 前塞一段 1x1 的 script tag；没有就完全不动。

```bash
# Plausible（最简）
VITE_ANALYTICS_URL=https://plausible.io/js/script.js \
VITE_ANALYTICS_DOMAIN=innoseed-landing.vercel.app \
pnpm build
```

`VITE_ANALYTICS_DOMAIN` 不填会回退到 `VERCEL_PROJECT_PRODUCTION_URL`（Vercel 自动注入），
再回退到 `innoseed-landing.vercel.app`。要换 Umami 把 URL 换成你自部署的 script
就行，data-domain 行为 Plausible / Umami 都吃。

dev 模式（`pnpm dev`）永远不会注入 —— analytics 只在 production build 里。

Vercel 端：在项目 Settings → Environment Variables 里设 `VITE_ANALYTICS_URL` 和
（可选的）`VITE_ANALYTICS_DOMAIN`，之后每次部署都自动带。

## 可观测性（Observability）

`src/lib/observability.ts` 是端到端的可观测性封装，集成在 `main.tsx` 应用 mount
前自动启用，零配置运行时不联网。

### 覆盖能力

| 维度 | 怎么采 | 怎么上报 |
|------|--------|---------|
| Build metadata | vite 注入 `window.__BUILD__ = {sha,time,mode,deploymentId,url}` | console / endpoint |
| Web Vitals (LCP / CLS / INP) | 自实现 `PerformanceObserver`，不引入 web-vitals 包 | console / endpoint |
| 业务事件 | `trackEvent(name, props)` 白名单 API (recruit_cta_click / apply_step_advance / apply_submit_success / ...) | console / endpoint |
| JS 错误 | `window.addEventListener('error' / 'unhandledrejection')` | console.error / endpoint |
| 函数请求 | `/api/apply` 内单行 JSON 日志 (reqId + stage + durationMs + ua + region) | Vercel runtime logs |

### 上报策略

- **VITE_ANALYTICS_URL 设了** → 第三方脚本（Plausible / Umami）正常加载，看 PV/UV/页面浏览；
- **VITE_ANALYTICS_ENDPOINT 设了** → 自建 collector 接所有 `trackEvent` / `trackError` /
  `trackWebVital` 的 POST（JSON 体，`navigator.sendBeacon` 优先，`fetch keepalive` 回退）；
- **都没设** → 只 `console.debug` / `console.error`，不联网，隐私优先。

### 在 Vercel 端接自定义 endpoint

最快路径：在 Vercel project → Settings → Environment Variables 加

```
VITE_ANALYTICS_ENDPOINT=https://your-collector.example.com/ingest
```

重新部署即可。endpoint 期望的 body shape：

```json
{
  "type": "event | error | vital",
  "ts": 1700000000000,
  "url": "/apply",
  "build": { "sha": "...", "mode": "production" },
  "name": "apply_submit_success",
  "props": { "stepCount": 4 }
}
```

### 加新业务事件

编辑 `src/lib/observability.ts` 顶部的 `EventName` 类型（白名单），然后在组件里 `import { trackEvent }`。

### 看 Vercel 运行时日志

```
vercel logs innoseed-landing.vercel.app --follow
# 或在 Dashboard → Logs / Observability → Functions → api/apply
```

结构化日志每行一条 JSON，可以用 `jq` 现场过滤：

```bash
vercel logs --output=json | jq 'select(.payload.stage == "error")'
```

## 部署

Vercel 项目 `prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb`（`vercel.json` 指明 `outputDirectory: dist` + SPA rewrite）。
当前用 `VERCEL_TOKEN` 直接 `vercel deploy --prod` 推。

要走 git push 自动部署：
1. 在 GitHub 新建 repo（已完成：`CSU-InnOSeed/homepage`，main = v4 React）
2. `git remote add origin https://github.com/CSU-InnOSeed/homepage.git`
3. `git push -u origin main`（第一次可能需要 `--force-with-lease`）
4. Vercel 控制台 `Settings → Git → Connect` 选这个 repo
5. 之后每次 `git push` 自动 build + 部署

`.github/workflows/ci.yml` 会在 PR + main 上跑 `pnpm typecheck`（src + vite.config）+ `pnpm build` + `pnpm test:e2e`，失败时上传 Playwright report 作为 artifact。

### Vercel 运维速查

| 你要做的事 | 怎么做 |
|------------|--------|
| 看线上 runtime 日志 | Dashboard → Logs / `vercel logs --follow` |
| 看单次部署详情 | Dashboard → Deployments → 选 SHA → 展开 |
| 立即回滚到上一个 commit | Dashboard → Deployments → 找上一个 production → `⋯` → Promote to Production |
| 看 serverless function 性能 | Dashboard → Observability → Functions → 选 api/apply → p50 / p95 / cold start |
| 配环境变量 | Dashboard → Settings → Environment Variables（区分 Production / Preview / Development 三档） |
| 手动触发部署 | Dashboard → Deployments → `⋯` → Redeploy |
| 强制 HTTPS + 自定义域 | Dashboard → Settings → Domains，DNS 按 Vercel 给的 A / CNAME 配 |
| 限制 region / 加速冷启动 | `vercel.json` 的 `functions` 块（当前 `api/*.ts` 配 maxDuration=10s / memory=256MB） |
| Preview deploy URL | 每次 PR / push 非 main 分支自动生成 `<branch>-<team>.vercel.app`，可分享给内部 review |

### Vercel 端环境变量清单

| 名称 | 用途 | 必填 |
|------|------|------|
| `VITE_ANALYTICS_URL` | Plausible / Umami script URL | 否（不设则零分析字节） |
| `VITE_ANALYTICS_DOMAIN` | 覆盖默认 data-domain | 否 |
| `VITE_ANALYTICS_ENDPOINT` | 自定义事件采集 endpoint | 否 |
| `FEISHU_APP_ID` | 飞书 Bitable 凭证（/api/apply 真实持久化） | 接入 Bitable 时 |
| `FEISHU_APP_SECRET` | 同上 | 同上 |
| `FEISHU_BITABLE_TOKEN` | Bitable app_token | 同上 |
| `FEISHU_TABLE_ID` | Bitable 目标 table_id | 同上 |

Vercel **自动注入** 给 build 的变量（runtime 也能在函数里 `process.env` 读到）：
`VERCEL` / `VERCEL_ENV` / `VERCEL_REGION` / `VERCEL_DEPLOYMENT_ID` / `VERCEL_GIT_COMMIT_SHA` /
`VERCEL_PROJECT_PRODUCTION_URL`。其中 `VERCEL_GIT_COMMIT_SHA` 被 `vite.config.ts` 读出来写
到 `window.__BUILD__.sha`，排查"线上跑的到底是哪个 commit"一秒定位。

### 安全 / 缓存 / 性能 header

`vercel.json` 已经默认开启：

- `X-Content-Type-Options: nosniff` · `X-Frame-Options: SAMEORIGIN` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` · `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `/imgs/` `/assets/` `/*.js` `/*.css` `/*.woff2` → `Cache-Control: public, max-age=31536000, immutable`
- `/index.html` → `Cache-Control: public, max-age=0, must-revalidate`（永远拉到最新 HTML，避免 hash 资产失效）
- `/api/*` → `no-store, no-cache, must-revalidate`（函数响应绝不缓存）
- `cleanUrls: true` + `trailingSlash: false` — `/apply` 而不是 `/apply/`
- `/recruit` 和 `/events` 旧路径 redirect 到站内 anchor（兼容旧外链）

修改任何一个 header 后直接 commit + push，Vercel 自动重新生成 CDN 配置。

## /apply 招新流程

`/apply` 是独立 React Router 路由，4 步引导候选人完成标签选择 + 提交：

```
01 Guide              → 介绍 + 跳转飞书表单投简历
02 Pick Interviewer   → 按契合度排序的 9 位面试官网格
03 Application        → 4 类标签多选 (Mini Camp 分路 / 技术 / 兴趣 / 未来)
04 Done               → 服务器分配 10 位 reference code（点击复制）
```

**个性标签代码**：`encodeTagCode` 用 base64 编码选中的 tag 索引，跟 SvelteKit 旧版 `innoseed.club/apply25` 的格式完全一致 —— 提交后服务器分配 10 位 reference code 也在同一种 base32 体系里，方便后续把新旧代码映射到同一份 lookup。

**后端**：`/api/apply`（Vercel Function）。当前是 stub —— 校验 payload、生成 10 位 server code、单行 JSON 结构化日志。生产环境要接飞书多维表格作为持久化，参考 `api/apply.ts` 里的 `_persistToFeishuBitable` 实现 + 配 4 个 Vercel env vars（`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_BITABLE_TOKEN` / `FEISHU_TABLE_ID`）。

vite preview 不跑 Vercel Functions，所以 e2e 用 `page.route` mock 掉 `/api/apply`。

## 活动（#events）

首页 `Events` section（`Inside` 之后、`Recruit` 之前）展示 InnOSeed 的 upcoming + past 活动：

- **type** 五种（`camp` / `talk` / `demo` / `visit` / `open`），复用 4 色 pillar accent + 青色作为 open 类
- **status**：`upcoming` 显示 `开放报名` / `即将开始` 徽章；`past` 灰底处理
- 数据集中在 `src/content/site.ts` 的 `EVENTS.items`，加新活动改数据就行，渲染端不动
- 旧外链 `https://innoseed.club/events` 由 `vercel.json` 的 `redirects` 改成 `/#events` 站内跳转

## 招新页（#recruit）

首页 `Recruit` section 拆成三段（共用 `.recruit` / `.recruit-timeline` / `.recruit-faqs` 三个 section）：

- **Hero** — 原 CTA 区（背景图 + 大标题 + `立即申请` 按钮）
- **Timeline** — 4 步招新流程（投递 → 1v1 面试 → Mini Camp → offer），4 色 pillar accent
- **FAQs** — accordion 展开/收起（第一条默认展开）

数据集中在 `src/content/site.ts` 的 `RECRUIT_EXTRAS.timeline` / `.faqs`。

## 性能策略

- **字体降级**：Google Fonts URL 只保留 12 个实际用到的 weight；CSS `font-family` 链把系统中文（PingFang SC / Microsoft YaHei / system-ui）排在 Noto SC 前面。99% 的访客不会下载 Noto SC。
- **首屏图 preload**：`index.html` 里的 hero preload 走 `imagesrcset` + `imagesizes`，手机拿 18 KB 480w WebP，桌面拿 84 KB 1440w WebP；`fetchpriority="high"` 标 LCP 候选。
- **Below-fold 图 lazy**：`Inside` 和 `Recruit` 板块的图片都 `loading="lazy" decoding="async"`。
- **iOS safe-area-inset**：`body` / `nav` / `hero-meta` / `footer` 都尊重 `env(safe-area-inset-*)`。
- **小屏回归**：e2e/iphone-se.spec.js 覆盖 320×568（iPhone SE 1）—— 这个尺寸之前没测，hero h1 / 链接容易横向溢出。

> pnpm 11 引入了 ignored-builds 强校验；`pnpm-workspace.yaml` 已声明允许 `esbuild` postinstall。
> Vercel 端用的是 pnpm 10，所以这个限制只在本地。

## 部署

Vercel 项目 `prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb`（`vercel.json` 指明 `outputDirectory: dist` + SPA rewrite）。
当前用 `VERCEL_TOKEN` 直接 `vercel deploy --prod` 推。

要走 git push 自动部署：
1. 在 GitHub 新建 repo（已完成：`CSU-InnOSeed/homepage`，main = v4 React）
2. `git remote add origin https://github.com/CSU-InnOSeed/homepage.git`
3. `git push -u origin main`（第一次可能需要 `--force-with-lease`）
4. Vercel 控制台 `Settings → Git → Connect` 选这个 repo
5. 之后每次 `git push` 自动 build + 部署

`.github/workflows/ci.yml` 会在 PR + main 上跑 `pnpm typecheck`（src + vite.config）+ `pnpm build` + `pnpm test:e2e`，失败时上传 Playwright report 作为 artifact。

## /apply 招新流程

`/apply` 是独立 React Router 路由，4 步引导候选人完成标签选择 + 提交：

```
01 Guide              → 介绍 + 跳转飞书表单投简历
02 Pick Interviewer   → 按契合度排序的 9 位面试官网格
03 Application        → 4 类标签多选 (Mini Camp 分路 / 技术 / 兴趣 / 未来)
04 Done               → 服务器分配 10 位 reference code（点击复制）
```

**个性标签代码**：`encodeTagCode` 用 base64 编码选中的 tag 索引，跟 SvelteKit 旧版 `innoseed.club/apply25` 的格式完全一致 —— 提交后服务器分配 10 位 reference code 也在同一种 base32 体系里，方便后续把新旧代码映射到同一份 lookup。

**后端**：`/api/apply`（Vercel Function）。当前是 stub —— 校验 payload、生成 10 位 server code、log 到 stdout。生产环境要接飞书多维表格作为持久化，参考 `api/apply.ts` 里的 `_persistToFeishuBitable` 实现 + 配 4 个 Vercel env vars（`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_BITABLE_TOKEN` / `FEISHU_TABLE_ID`）。

vite preview 不跑 Vercel Functions，所以 e2e 用 `page.route` mock 掉 `/api/apply`。

## 域名恢复（innoseed.club → Vercel）

`innoseed.club` 当前 404。需要把 DNS 指到 Vercel：

**Step 1 — Vercel 加 custom domain**

1. 打开 https://vercel.com/dashboard → `innoseed-landing` project → Settings → Domains
2. 添加 `innoseed.club` 和 `www.innoseed.club`
3. Vercel 会给出要配的 DNS 记录（一般是 A `76.76.21.21` + CNAME `cname.vercel-dns.com`）

**Step 2 — DNS provider 加记录**

根据域名托管商操作：
- **Cloudflare** — 选 `DNS only`（关掉 orange-cloud proxy，Vercel 不喜欢 CF proxy 介入 SSL）
- **阿里云 / 腾讯云** — 按 Vercel 给的 A / CNAME 填

**Step 3 — 等 DNS 传播 + Vercel 颁 SSL**（5–30 分钟）

**Step 4 — 自动结果**

- `innoseed.club` → 展示 v4 React 站点
- `innoseed.club/apply` → React Router 路由的招新流程
- `mailto:contact@innoseed.club` / `innoseed.club/events` / `innoseed.club/recruit` 等旧 SvelteKit 链接 → v4 anchor（#events / #recruit 等）

**Step 5 — 可选：清理 Cloudflare Pages 集成**（之前 404 的 run 85805150382 触发的）

去 Cloudflare dashboard → Pages → `homepage` project → Delete。SvelteKit 时代配的，v4 不再使用。

## v1 → v2 → v3 → v4

| 版本 | 形态 |
|------|------|
| v1   | 暖红+米黄单文件，Awwwards 风格，全 AI 自绘图（无原站素材） |
| v2   | 完全照搬原站结构（错的，被打回） |
| v3   | v1 设计语言 + 原站素材和配色 ✓ |
| v4   | v3 视觉 + React 18 + Vite 5 + 移动适配 + a11y + SEO + 性能优化 + e2e 测试 |

## v4 增量（按 commit）

| Commit | 主题 |
|--------|------|
| `d919024` | v4 baseline: React 重构 + 移动端适配 |
| `729db84` | 抽文案到 `src/content/site.js` + 重写 spec.md |
| `f7137a8` | OG / Twitter Card meta + 1200×630 share 图 |
| `6d11e00` | Pillar SVG icon 内联进 JSX（-4 HTTP 请求） |
| `9dde075` | banner / group-photo: WebP + srcset + preload |
| `7208861` | a11y: skip-link / focus-visible / noscript / 对比度修复 |
| `8f7d0e8` | 自定义 404 页 |
| `f696a71` | Playwright e2e 测试（20 / 20 ✓） |
| `b4b97b4` | GitHub Actions workflow |
| `35fbeec` | 清掉 v3 残留 zip + 预览图 |
| `b2a6055` | .gitignore 补 Playwright / 编辑器条目 |
| `040c865` | docs: README reflects v4 stack + commands + commit history |
| `1deb35f` | chore: pnpm 11 `allowBuilds: esbuild` |
| `f125064` | feat(analytics): env-var-driven Plausible/Umami 脚本注入 |
| `4c8e00c` | perf: 字体降级 + hero preload srcset + iOS safe-area + Recruit bg 响应式 |
| `189beaa` | test(mobile): iPhone SE 320×568 视口回归 + opacity threshold 放宽 |
| `5c4f2b0` | chore(deps): typescript + @types/react / react-dom / node |
| `49df623` | feat(ts): jsx→tsx + js→ts 全量迁移（strict types + module augmentation） |
| `d63b68b` | chore(deps): react-router-dom + @vercel/node (招新路由 + function types) |
| `8b804ac` | feat(apply): /apply 路由 + 4 步招新表单 + content 数据迁移 |
| `49c9eb4` | feat(api): /api/apply serverless stub (飞书 Bitable 接入待配 env) |
| `5d9c97e` | test: /apply 路由 e2e (5 specs, 含 page.route mock /api/apply) |
| `4ac653d` | chore: probe vercel auto-deploy |
| *(本批)* | feat(observability): src/lib/observability.ts — Web Vitals (LCP/CLS/INP) + 错误捕获 + 业务事件白名单 + endpoint 上报 + navigator.sendBeacon/keepalive fallback |
| *(本批)* | feat(build): vite inject `window.__BUILD__` (sha/time/mode/deploymentId) from VERCEL_GIT_COMMIT_SHA |
| *(本批)* | feat(api): /api/apply 结构化 JSON 日志 + request id 透传 + 阶段日志 + 耗时统计 |
| *(本批)* | feat(vercel): 安全 headers + 缓存策略 (assets 1y immutable / html no-cache / api no-store) + functions maxDuration/memory + redirects /recruit /events |
| *(本批)* | feat(events): #events section + 5 类型活动卡片 (camp/talk/demo/visit/open) + upcoming/past 分组 |
| *(本批)* | feat(recruit): 招新时间线 (4 步,4 色 pillar) + FAQ accordion (5 条常见问题) |
| *(本批)* | docs: README 新增 Observability / Vercel 运维 / 活动 / 招新 章节 + 结构图更新 |

## 已知遗留（未做）

详细见 `spec.md` §12 Roadmap。简版：
- 字体内联 / 子集化（已降级到 system-first，但 Google Fonts 还是 external）
- Hero 重新评估 video-led 方案
- CMS 化（Sanity / Contentful）—— 等 2026 招新结束、数据沉淀下来后再考虑
- i18n 中英双语切换
- Dark mode
- innoseed.club 域名恢复（**步骤文档已就绪，跑就行**）
- 飞书 Bitable 真实接入 /api/apply（env vars 待配）
- 2025 招新面试官数据更新（当前是 2024 roster）
- Recruit 板块的 `mailto` 在某些旧链接场景仍存在（站点外分享链接）
- e2e 新增 #events + #recruit 新区块的视觉回归
- `vercel.json` 重定向 (`/recruit`, `/events`) 的端到端测试
