# CSU InnOSeed Lab — 官网 v3

## 思路
- **设计语言**：v1 的 Awwwards editorial（Fraunces 大字、numbered eyebrow、marquee、reveal animations、4-pillar 卡片、manifesto、inside split、recruit CTA、multi-column footer）
- **品牌资产**：完全用 innoseed.club 真实素材
  - 绿色点阵 favicon（取自原站 `/favicon.png`）
  - 水彩 Hero banner（取自原站 `/component/Banner/banner.jpg`）
  - 4 个 pillar SVG icon（取自原站，紫/绿/蓝/红各自配色）
  - 实验室真实合影（取自原站 `/index/hezhao.jpeg`）
- **配色**：白底 + 蓝主色 #1C64F2 + 4 pillar 颜色（紫/绿/蓝/红），与原站 100% 一致
  - 主色：#1C64F2（亮蓝）
  - 竞赛：#6B21A8（紫）
  - 科研：#166534（深绿，品牌主色）
  - 创业：#1E40AF（蓝）
  - 志合者：#991B1B（红）

## 文件
- `index.html` — 单文件，25K，内联 CSS/JS
- `imgs/` — 7 个原站资源

## 预览
- 本地：http://localhost:8765/
- 隧道：https://elderly-golf-turtle-submitting.trycloudflare.com
- Vercel（v1）：https://innoseed-landing.vercel.app（v3 待 token 覆盖）

## v1 → v2 → v3 区别
- v1：暖红+米黄，Awwwards 风格，但全 AI 自绘图（无原站素材）
- v2：完全照搬原站结构（错的，被你打回）
- v3：v1 设计语言 + 原站素材和配色（这次对了）
