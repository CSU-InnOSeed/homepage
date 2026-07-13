# InnOSeed Lab · 官网 (v4)

中南大学计算机学院 InnOSeed 创新实验室品牌站 — React + Vite 重构版,纯静态 + Vercel Functions。

> 品牌叙事 / 设计稿 / 字体断点 / 演进史详见 [`spec.md`](./spec.md);招新协作流程见 [`.github/PROJECT_SETUP.md`](./.github/PROJECT_SETUP.md)。

## 站点地图

| 路由 | 渲染 | 备注 |
| --- | --- | --- |
| `/` | `Nav → Hero → Marquee → Manifesto → Pillars → Numbers → Members → Inside → Events → Recruit → Footer` | 首页 9 section 装配 |
| `/apply` | `Apply` (4 步: Guide → Pick Interviewer → Application → Done) | 招新表单 → POST `/api/apply` |
| `/events` | `Nav + EventsPage + Footer` | 复刻首页 `#events` section |
| `/recruit` | `Nav + RecruitPage + Footer` | 复刻首页 `#recruit` section + 时间线 + FAQ |
| `*` | `NotFound` | 服务端由 Vercel `dist/404.html` 先返回 404 |

## 技术栈

- **React 18.3** + **TypeScript 5.6** (`strict` 模式,已 `.js → .ts` 全量迁移)
- **Vite 5.4** — dev server + 生产打包,`dist/` 纯静态
- **react-router-dom 7** — `/apply` `/events` `/recruit` 路由
- **CSS** — `src/styles/globals.css` 单文件(1843 行,含 design tokens + 全部断点)
- **Hooks** — `useReveal` / `useCountUp` / `useScrolled` / `useSmoothAnchorScroll` / `useHeroParallax`
- **可观测性** — `src/lib/observability.ts` 自写 Web Vitals + 错误 + 业务事件上报 (无 npm 依赖)
- **测试** — Playwright 烟雾测试,desktop / mobile / iPhone SE 三档 viewport

## 目录速查

```
innoseed-landing/
├── index.html                 ← Vite 入口 (OG / preload / Google Fonts)
├── vite.config.ts             ← React + inject-build-info + inject-analytics
├── vercel.json                ← 路由 + 安全 headers + 缓存策略 + functions
├── playwright.config.js       ← 跑 vite preview,三档 viewport
├── spec.md                    ← v4 设计稿 / 决策记录 / roadmap
│
├── src/
│   ├── main.tsx               ← createRoot + initObservability()
│   ├── App.tsx                ← 路由装配 + skip-link + main landmark
│   ├── styles/globals.css     ← design tokens + 全部 section 样式 + 媒体查询
│   ├── hooks/                 ← 5 个交互 hook (含 TS 严格签名)
│   ├── lib/
│   │   ├── observability.ts   ← LCP/CLS/INP + window.onerror + beacon/keepalive
│   │   └── buildInfo.ts       ← window.__BUILD__ 类型
│   ├── content/
│   │   ├── site.ts            ← 全部文案 + interface (HERO / PILLARS / EVENTS / RECRUIT_EXTRAS / FOOTER / META)
│   │   └── apply.ts           ← 4 类标签 + 9 位面试官 + encode/decode tagcode
│   ├── components/            ← Nav / Hero / Marquee / Manifesto / Pillars /
│   │                            Numbers / Members / Inside / Events / Recruit / Footer
│   └── pages/                 ← Apply / Events / Recruit / NotFound
│
├── api/apply.ts               ← Vercel Function: 招新表单 server-side stub
├── aliyun-fc/                 ← 飞书 Bitable tag decode webhook (Aliyun FC,custom runtime)
├── e2e/                       ← Playwright specs (desktop / mobile / iphone-se + apply)
├── scripts/
│   ├── build-og-cover.py      ← 1200×630 OG 图生成
│   ├── optimize-images.py     ← WebP + 多宽度 JPEG
│   ├── setup-github-project.sh← gh CLI 一次性建 labels + milestones
│   └── test-tag-codes.mjs     ← 招新 tagcode encode/decode 镜像测试
├── public/
│   ├── 404.html
│   └── imgs/                  ← banner / favicon / group-photo (WebP + JPEG srcset)
└── .github/
    ├── workflows/ci.yml       ← typecheck + build + Playwright (Node 22 / pnpm 10)
    ├── ISSUE_TEMPLATE/        ← 招新/网站/文案/Bug 模板
    └── PROJECT_SETUP.md       ← 招新项目板 + Labels + Milestones 文档
```

## 常用命令

```bash
# 安装 (pnpm 11 需要 pnpm-workspace.yaml 白名单 esbuild)
pnpm install

# 开发
pnpm dev                       # http://127.0.0.1:8765

# 静态检查 + 构建
pnpm typecheck                 # tsc --noEmit (strict)
pnpm exec tsc -p tsconfig.node.json   # vite.config.ts 的 Node 类型
pnpm build                     # tsc --noEmit && vite build → dist/
pnpm preview                   # 预览 dist/  (port 4173)

# 端到端测试
pnpm test:e2e:install          # 一次性装 chromium
pnpm test:e2e                  # 29 个烟雾测试 (~12s)
pnpm test:e2e:headed           # 可见浏览器跑 (debug)
pnpm test:e2e:ui               # Playwright 自带 UI

# 招新 tagcode 单元测试
pnpm test:tag-codes            # 镜像 src/content/apply.ts 的 encode/decode
```

## 环境变量

| 变量 | 用途 | 默认 |
| --- | --- | --- |
| `VITE_ANALYTICS_URL` | Plausible/Umami script 注入 | 不设 → 不发请求 |
| `VITE_ANALYTICS_DOMAIN` | `data-domain` | `VERCEL_PROJECT_PRODUCTION_URL` → `innoseed-landing.vercel.app` |
| `VITE_ANALYTICS_ENDPOINT` | 自建 collector 端点 (POST JSON) | 不设 → 只 console.debug |
| `VERCEL_GIT_COMMIT_SHA` | build info 注入 (生产) | Vercel 自动注入 |
| `VERCEL_DEPLOYMENT_ID` | 部署 ID 注入 (preview) | Vercel 自动注入 |
| `VERCEL_ENV` | `production` / `preview` | 本地为空 |

build 时由 `vite.config.ts` 的两个内联插件处理:
- `inject-build-info` — 把 `{ sha, time, mode, deploymentId, url }` 写到 `window.__BUILD__`
- `inject-analytics` — 生产构建时往 `</head>` 前塞 script tag

## Vercel 部署

- **Project**: `prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb` (org `team_1xz4tPQJ42juH64TJBSSYfac`)
- **Build command**: `pnpm build`
- **Output directory**: `dist/`
- **framework**: `null` (Vite 已被自动识别,vercel.json 显式声明更稳)
- **Functions**: `api/*.ts` → `maxDuration: 10s / memory: 256MB`

`vercel.json` 关键策略:
- rewrites: `/`, `/apply`, `/events`, `/recruit` → `/index.html` (SPA)
- 全站安全 headers: `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` / `Permissions-Policy` / `HSTS`
- 资源缓存: `imgs/` `assets/` `*.js` `*.css` `*.woff2` → `max-age=31536000, immutable`
- 入口文件: `/index.html` → `no-cache, must-revalidate`
- API: `/api/*` → `no-store, no-cache, must-revalidate`

## 域名恢复 (innoseed.club → Vercel)

`innoseed.club` 当前 404,需把 DNS 指到 Vercel:

1. Vercel dashboard → `innoseed-landing` → Settings → Domains → 添加 `innoseed.club` + `www.innoseed.club`
2. 在 DNS provider 加 Vercel 给出的 A / CNAME:
   - **Cloudflare** → 选 `DNS only` (关掉 orange-cloud proxy)
   - **阿里云 / 腾讯云** → 按 Vercel 给的值填
3. 等 DNS 传播 + Vercel 颁 SSL (5–30 分钟)
4. 旧 SvelteKit 链接自动兼容: `mailto:contact@innoseed.club` / `innoseed.club/events` / `innoseed.club/recruit` 落到 v4 对应路由

## 飞书 Bitable 接入 (招新表单持久化)

`/api/apply` 当前是 **stub** — 校验 + 编码 + 日志齐了,真实持久化待配 env 后接飞书 Bitable。

相关 env (在 Vercel + Aliyun FC 都需配):

| 变量 | 来源 |
| --- | --- |
| `FEISHU_APP_ID` / `FEISHU_APP_SECRET` | 飞书开放平台 → 应用凭证 |
| `FEISHU_BITABLE_TOKEN` | Bitable URL 中的 `bitableXXXXXX` 段 |
| `FEISHU_TABLE_ID` | Bitable 数据表 ID (tblXXXXXX) |
| `DECODE_TAG_TOKEN` | 自定义共享密钥 (与 Vercel Function 协商) |
| `INTERVIEWER_MAP` | 面试官 code ↔ Bitable 字段映射 (JSON 字符串) |

部署 Aliyun FC webhook (用于 Bitable 端反向解码):

```bash
cd aliyun-fc
./deploy.sh     # 会先检查 env,缺则拒绝 deploy
```

## 协作流程

- **Issue 模板**: 招新待办 / 网站修改 / 文案想法 / Bug 报告
- **Label 体系**: 类型 (`招新` / `website` / `content` / `bug` / `docs` / `interview`) + 优先级 (`P0` / `P1` / `P2`) + 状态 (`blocked`)
- **Milestone**: 招新启动 / 招新截止 / 一面 / 录取公布
- **初始化**: `gh auth login && ./scripts/setup-github-project.sh`

详细见 [`.github/PROJECT_SETUP.md`](./.github/PROJECT_SETUP.md)。

## 已知遗留

`spec.md` §12 Roadmap 详细列表。简版:
- 字体内联 / 子集化 (Google Fonts 仍 external,但已降级到 system-first)
- Hero video-led 方案重评
- CMS 化 (Sanity / Contentful) — 等 2026 招新数据沉淀
- i18n 中英切换 / Dark mode
- 飞书 Bitable 真实接入 (`/api/apply` env 待配)
- 2025 招新面试官 roster 刷新 (当前是 2024)
- `mailto:` 在某些旧分享链接场景仍存在
- e2e 补 #events + #recruit 新区块视觉回归
