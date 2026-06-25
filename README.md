# CSU InnOSeed Lab — 官网 v4 (React)

v4 把 v3 单文件 HTML 拆成了 React + Vite 项目，**视觉与 v3 完全一致**，结构换了。
Awwwards editorial 的设计语言、Fraunces 大字、numbered eyebrow、marquee、reveal 动画、4-pillar 卡片、manifesto、inside split、recruit CTA、multi-column footer —— 全部保留。

## Stack

- **React 18** — 组件化，每个 section 一个文件
- **Vite 5** — dev server + 生产打包
- **CSS** — `src/styles/globals.css`（design tokens / 关键帧 / 媒体查询）
- **Hooks** — `useReveal` / `useCountUp` / `useScrolled` / `useSmoothAnchorScroll` / `useHeroParallax`
- **图片** — `public/imgs/`（Vite 原生静态资源），运行时走 `/imgs/...`
- **Playwright** — 20 个 e2e 烟雾测试（desktop + mobile）

## 结构

```
innoseed-landing/
├── .github/workflows/ci.yml      ← GitHub Actions: build + Playwright on PR
├── index.html                    ← Vite 入口（meta + Google Fonts + favicon + OG + preload）
├── package.json
├── pnpm-workspace.yaml           ← pnpm 11 onlyBuiltDependencies: esbuild
├── playwright.config.js          ← Playwright 配置（spec-internal viewport）
├── spec.md                       ← v4 设计稿 + 决策记录 + roadmap
├── vercel.json                   ← outputDirectory: dist
├── vite.config.js
├── public/
│   ├── 404.html                  ← 自定义 404
│   └── imgs/                     ← banner / favicon / group-photo (WebP + JPEG variants)
├── scripts/
│   ├── build-og-cover.py         ← 用 PIL 生成 1200×630 OG 图
│   └── optimize-images.py        ← 批量生成 WebP + 多宽度 JPEG
├── src/
│   ├── main.jsx
│   ├── App.jsx                   ← 装配 + skip-link + main landmark
│   ├── styles/globals.css
│   ├── hooks/                    ← 5 个交互 hook
│   ├── content/site.js           ← 全部文案 / 数据集中
│   └── components/               ← Nav / Hero / Marquee / Manifesto / Pillars / Numbers / Members / Inside / Recruit / Footer
├── e2e/
│   ├── _shared.js                ← 跨断点共享断言
│   ├── desktop.spec.js           ← 1440×900 viewport
│   └── mobile.spec.js            ← 375×812 viewport (iPhone 14)
└── dist/                         ← pnpm build 产物
```

## 命令

```bash
pnpm install                      # 装依赖（esbuild postinstall 走 pnpm-workspace.yaml 白名单）
pnpm dev                          # http://127.0.0.1:8765
pnpm build                        # 出 dist/
pnpm preview                      # 本地预览 dist/

# Playwright
pnpm test:e2e:install             # 一次性装 chromium
pnpm test:e2e                     # 20 个烟雾测试，~15s
pnpm test:e2e:headed              # 可见浏览器跑（debug 用）
pnpm test:e2e:ui                  # Playwright 自带 UI 调试
```

> pnpm 11 引入了 ignored-builds 强校验；`pnpm-workspace.yaml` 已声明允许 `esbuild` postinstall。
> Vercel 端用的是 pnpm 10，所以这个限制只在本地。

## 部署

Vercel 项目 `prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb`（`vercel.json` 指明 `outputDirectory: dist`）。
当前用 `VERCEL_TOKEN` 直接 `vercel deploy --prod` 推。

要走 git push 自动部署：
1. 在 GitHub 新建 repo
2. `git remote add origin https://github.com/<user>/innoseed-landing.git`
3. `git push -u origin main`
4. Vercel 控制台 `Settings → Git → Connect` 选这个 repo
5. 之后每次 `git push` 自动 build + 部署

`.github/workflows/ci.yml` 会在 PR + main 上跑 `pnpm install` + `pnpm build` + `pnpm test:e2e`，失败时上传 Playwright report 作为 artifact。

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

## 已知遗留（未做）

详细见 `spec.md` §12 Roadmap。简版：
- 字体内联 / 子集化（Google Fonts 现在拉完整字库）
- Hero 重新评估 video-led 方案
- CMS 化（Sanity / Contentful）
- i18n 中英双语切换
- Dark mode
- Vercel Analytics / Web Analytics
- 真实联络表单（替代 mailto:）
