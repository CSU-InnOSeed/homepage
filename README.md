# CSU InnOSeed Lab — 官网 v4 (React)

v4 把 v3 单文件 HTML 拆成了 React + Vite 项目，**视觉与 v3 完全一致**，只是结构换了。
Awwwards editorial 的设计语言、Fraunces 大字、numbered eyebrow、marquee、reveal 动画、4-pillar 卡片、manifesto、inside split、recruit CTA、multi-column footer —— 全部保留。

## Stack

- **React 18** — 组件化，每个 section 一个文件
- **Vite 5** — dev server + 生产打包
- **CSS** — 平移自 v3，design tokens / 关键帧 / 媒体查询一字不改
- **Hooks 复用行为** — `useReveal` / `useCountUp` / `useScrolled` / `useSmoothAnchorScroll` / `useHeroParallax`
- **图片** — `public/imgs/`（Vite 原生静态资源），运行时走 `/imgs/...`

## 结构

```
innoseed-landing/
├── index.html              ← Vite 入口（meta + Google Fonts + favicon）
├── package.json
├── vite.config.js
├── vercel.json             ← 指定 outputDirectory: dist
├── pnpm-workspace.yaml     ← pnpm 11 onlyBuiltDependencies: esbuild
├── public/
│   └── imgs/               ← 全部原站素材（banner / favicon / group-photo / 4 个 SVG icon）
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/globals.css  ← 平移自 v3 内联样式
│   ├── hooks/
│   │   ├── useReveal.js
│   │   ├── useCountUp.js
│   │   ├── useScrolled.js
│   │   ├── useSmoothAnchorScroll.js
│   │   └── useHeroParallax.js
│   └── components/
│       ├── Nav.jsx
│       ├── Hero.jsx
│       ├── Marquee.jsx
│       ├── Manifesto.jsx
│       ├── Pillars.jsx
│       ├── Numbers.jsx
│       ├── Members.jsx
│       ├── Inside.jsx
│       ├── Recruit.jsx
│       └── Footer.jsx
└── dist/                   ← pnpm build 产物
```

## 命令

```bash
pnpm install
pnpm dev          # http://127.0.0.1:8765
pnpm build        # 输出到 dist/
pnpm preview      # 本地预览 dist/
```

> pnpm 11 引入了 ignored-builds 强校验；`pnpm-workspace.yaml` 已经声明允许 `esbuild` postinstall。

## 部署

Vercel 已绑定本项目（`prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb`）。`vercel.json` 指明 `outputDirectory: dist`。
直接 `git push` 后 Vercel 会跑 `pnpm build` 并把 `dist/` 当静态站发布。

## v1 → v2 → v3 → v4

| 版本 | 形态 |
|------|------|
| v1   | 暖红+米黄单文件，Awwwards 风格，但全 AI 自绘图（无原站素材） |
| v2   | 完全照搬原站结构（错的，被打回） |
| v3   | v1 设计语言 + 原站素材和配色 ✓ |
| v4   | **v3 视觉 + React 18 + Vite 5** ✓ |
