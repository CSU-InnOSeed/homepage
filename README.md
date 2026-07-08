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
├── vercel.json                   ← outputDirectory: dist
├── vite.config.ts                ← React + 条件注入 analytics 脚本
├── public/
│   ├── 404.html                  ← 自定义 404
│   └── imgs/                     ← banner / favicon / group-photo (WebP + JPEG variants)
├── scripts/
│   ├── build-og-cover.py         ← 用 PIL 生成 1200×630 OG 图
│   └── optimize-images.py        ← 批量生成 WebP + 多宽度 JPEG
├── src/
│   ├── main.tsx
│   ├── App.tsx                   ← 装配 + skip-link + main landmark
│   ├── styles/globals.css        ← design tokens + 全套移动端媒体查询
│   ├── hooks/                    ← 5 个交互 hook（带 TS 类型签名）
│   ├── content/site.ts           ← 全部文案 / 数据 + 导出 interface
│   ├── components/               ← Nav / Hero / Marquee / Manifesto / Pillars / Numbers / Members / Inside / Recruit / Footer (全 .tsx)
│   └── vite-env.d.ts             ← Vite client types + fetchpriority 增强
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

**个性标签代码**：`encodeTagCode` / `decodeTagCode` 用 base64 编码选中的 tag 索引，跟 SvelteKit 旧版 `innoseed.club/apply25` 的格式完全一致 —— 用户粘贴旧代码可自动恢复选择。

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
