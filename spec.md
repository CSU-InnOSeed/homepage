# InnOSeed Lab — Landing Page 设计稿 (v4)

> 中南大学计算机学院 InnOSeed 创新实验室品牌展示页
> 风格：温暖、有机、年轻、不像传统学院派的"冷"，但保留学术严谨的秩序感

---

## 1. Brand & Audience

- **品牌**：CSU InnOSeed Lab（中南大学 InnOSeed 实验室）
- **性质**：学生创新实验室 / 创业俱乐部 — "different thinkers 的俱乐部"
- **四大方向**：竞赛 / 科研 / 创业 / 志合者
- **核心受众**：中南大学（尤其计算机学院）学生、招新候选人、合作伙伴、企业方、升学/留学方向的学弟学妹
- **页面目的**：品牌展示 + 招新引流 + 合作邀约
- **关键数据点**：10 国/国际一等奖 / 13 国奖 / 64 国家级荣誉 / 140+ 校级以上；5 清华 / 2 北大 / 1 斯坦福 / 3 QS 前 100 交换
- **代表人物**：苗子阳（保研中南）、常佳宇（斯坦福）、颜思宇（竞赛大满贯）

---

## 2. Stack (v4)

| 层 | 选型 | 理由 |
|----|------|------|
| Framework | React 18.3 (JS, no TS) | 组件化 + hooks 复用行为；JS 而非 TS 减少心智负担 |
| Build | Vite 5.4 | 出 `dist/` 纯静态，Vercel 直接吃 |
| Styling | 原生 CSS in `src/styles/globals.css` | design token / 关键帧集中维护；不上 Tailwind 是为了保留手写节奏感 |
| Behavior | 5 个 custom hooks | `useReveal` / `useCountUp` / `useScrolled` / `useSmoothAnchorScroll` / `useHeroParallax` |
| 字体 | Google Fonts CDN (Fraunces / Inter / Noto Serif SC / Noto Sans SC) | 同 v3 |
| 图标 | inline SVG (JSX 里) 或 public SVG | 4 个 pillar icon 已 inline 进 `Pillars.jsx` |
| 部署 | Vercel (`prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb`) | `pnpm build` → `dist/` |

**为什么从单文件 HTML 迁过来：**
- 9 个 section 各自组件，迭代时影响面更小
- hooks 抽象可复用行为（`useReveal` 不再是脚本最后的 querySelectorAll）
- 内容文案抽到 `src/content/*.js`，改 copy 不动组件
- 一份 bundle、build 输出静态、保留 Vercel zero-config 部署体验

---

## 3. Hero — Video-First (deferred to v3)

v3 阶段放弃了原 spec 里的 video-led hero（macro time-lapse 种子萌芽），改用 banner.jpg 静态图。理由：原站 innoseed.club 的水彩 arch banner 视觉足够强，且 video 自托管的带宽/编码成本不值得这个单页。**v4 保留 v3 决定**——video 重新引入是 v5+ 的事。

**Hero 排版**：

```
顶部：Mini Logo 文字  [InnOSeed × CSU]                [活动预告] [招新] [联系]
中心（占据视觉中心）：
   ┌─────────────────────────────────────┐
   │   我们更像俱乐部，属于                │
   │   DIFFERENT THINKERS 的俱乐部。       │
   │                                       │
   │   在 InnOSeed，                      │
   │   做 你 想 做 的。                    │
   └─────────────────────────────────────┘

左下角垂直：SCROLL TO EXPLORE
右下角：1 / 04   ←  section 计数
```

- 文字颜色：温暖米白 `#F5EFE6`（暗背景段）/ 深棕黑 `#1A1612`（亮背景段）
- 中心文字：超大字号，headline 字重 800，行高 0.95
- "different thinkers" 单独成行，italic + serif + 蓝色高光下划线
- 副标语使用全角中文 + 半角英文混排，体现双语俱乐部的国际化

---

## 4. Layout Structure

| 区块 | 内容 | 视觉特征 |
|------|------|----------|
| 1. Nav | 透明 + 滚动后变实底 + backdrop-blur | 滚动时 scroll > 60px 切换 |
| 2. Hero | 视频/大图背景 + 大字 + 标语 | 100vh |
| 3. Marquee | Different Thinkers · 竞赛 · 科研 · 创业 · 志合者 · 中南大学 | 36s 无限循环，CSS transform |
| 4. Manifesto | 一段宣言式文字 + 大字"在这里，我们……" | 1fr/2fr 双列；移动端折叠 |
| 5. Four Pillars | 竞赛 / 科研 / 创业 / 志合者 | 4 张大卡片，hover 上浮 |
| 6. Numbers | 4 个超大数据 + 注解 | count-up 0 → target (2.2s, ease-out-quart) |
| 7. Members | 三位代表人物 | 横向 / 卡片 |
| 8. Inside Lab | 沙龙 / 业界交流 / 链接到 CSDN、GitHub | 大图 + 文字，1fr/1fr，移动端折叠 |
| 9. Recruit | 招新 CTA | 巨型"加入我们"按钮 |
| 10. Footer | 邮箱 / 微信 / 版权 | 3 列 → 移动端 1 列 |

---

## 5. Typography

| 用途 | 字体 | 字重 | 字号 | 备注 |
|------|------|------|------|------|
| Display Headline（巨型标题） | Fraunces (serif) | 800 | `clamp(48px, 13vw, 220px)` (mobile 48px floor) | 用于 hero 与章节大数字 |
| Brand Word（"InnOSeed"） | Fraunces | 700 italic | 动态 | 视觉签名 |
| Section Title | Noto Serif SC | 700 | `clamp(36px, 8vw, 96px)` (mobile 36px floor) | 中文标题 |
| Body | Inter + Noto Sans SC | 400/500 | 16-18px | 段落正文 |
| Eyebrow / Tag | Inter | 600 caps | 12-13px | 段落顶部小标 |
| Numbers | Fraunces (tabular) | 800 | `clamp(56px, 16vw, 144px)` (mobile 56px floor) | 关键数据展示 |

---

## 6. Color Palette (NO blue / NO purple *as primary*)

注：v3/v4 接受了 innoseed.club 真实站点的蓝/紫作为点缀（主色 #1C64F2 蓝），偏离了 spec v1 的"全暖色"原则。tradeoff 成立：与原站视觉一致 > 设计纯净度。

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-base` | `#FFFFFF` | 页面底色 |
| `--bg-soft` | `#F7F5EF` | 暗章节底色（Manifesto、Numbers、Inside） |
| `--bg-cream` | `#F0EAE0` | Manifesto 背景 |
| `--bg-mint` | `#EDF5EC` | Recruit 背景 |
| `--ink-dark` | `#1F2937` | 主文字 |
| `--ink-mid` | `#374151` | 副文字 |
| `--ink-muted` | `#6B7280` | 辅助文字 |
| `--ink-faint` | `#6B7280` | meta 文字 (与 `--ink-muted` 同值,WCAG AA 5.74:1) |
| `--rule` | `#E5E7EB` | 分隔线 |
| `--brand` | `#1C64F2` | 中南蓝，主强调 |
| `--c-compete` | `#6B21A8` | 紫（竞赛 pillar + 国家一等奖数字） |
| `--c-research` | `#166534` | 深绿（科研 pillar + 国家荣誉数字 + Recruit CTA） |
| `--c-startup` | `#1E40AF` | 蓝（创业 pillar） |
| `--c-bonds` | `#991B1B` | 红（志合者 pillar） |

---

## 7. Responsive Breakpoints

v4 引入明确的三档移动端断点（v3 散落在 520/720/760/880/920/980px）。

| Breakpoint | 适用设备 | 主要变化 |
|------------|----------|----------|
| ≥ 981px | 桌面 | 全功能 4 列 / 3 列布局 |
| 721 - 980px | 平板 | Pillars / Numbers 4 → 2 列；Members / Inside 1 列 |
| 481 - 720px | 大手机 | hamburger 菜单；hero CTA 仍水平 |
| ≤ 480px | 手机 | CTA 竖排全宽；section padding 72px；hero 字号 floor 下调 |
| ≤ 360px | 超小屏 | gutter 14px；hero 44px |

---

## 8. Motion Plan

| 元素 | 触发 | 时长 / 缓动 |
|------|------|-------------|
| `.reveal` 入场 | IntersectionObserver (threshold 0.15) | 1.1s `cubic-bezier(0.22, 1, 0.36, 1)` |
| `.reveal[data-delay="N"]` | 同上，stagger 0.1s × N | 叠加 delay |
| Hero headline 上滑 | 自动 on mount | 1.2s ease-out，3 行 stagger 0.25s |
| 数字 count-up | IntersectionObserver (threshold 0.4) | 2.2s ease-out-quart |
| Nav scrolled 切换 | scroll > 60px | 0.4s ease |
| Pillar hover 上浮 | mouseover | 0.5s |
| Hero parallax | scroll (≥720px) | rAF 节流，translateY 0.25× scroll |
| 滚动指示下落 | 无限循环 | 2.2s scaleY 1→0.4 |
| Marquee | 无限循环 | 36s linear translateX |

`@media (prefers-reduced-motion: reduce)` 关闭所有过渡和动画。

---

## 9. Architecture

```
src/
├── main.jsx               ← React root + createRoot
├── App.jsx                ← section 装配（Nav → main → Footer）
├── styles/
│   └── globals.css        ← 全局样式（design tokens + 全部分区样式 + 移动断点）
├── hooks/
│   ├── useReveal.js       ← IntersectionObserver → 加 .in 类
│   ├── useCountUp.js      ← rAF 数字 0 → target
│   ├── useScrolled.js     ← 监听 scroll > threshold
│   ├── useSmoothAnchorScroll.js  ← 委托 # 链接点击
│   └── useHeroParallax.js ← rAF 节流视差
└── components/
    ├── Nav.jsx            ← 桌面 nav links / 移动 hamburger + slide panel
    ├── Hero.jsx           ← banner + tag + h1 + headline + sub + CTA
    ├── Marquee.jsx        ← 跑马灯（ITEMS 数据 + 重复两次无缝循环）
    ├── Manifesto.jsx      ← 1fr/2fr 双列宣言
    ├── Pillars.jsx        ← 4 张大卡片 + hover 视差
    ├── Numbers.jsx        ← 4 张数据卡 + count-up
    ├── Members.jsx        ← 3 张代表人物卡
    ├── Inside.jsx         ← 1fr/1fr 图文
    ├── Recruit.jsx        ← 招新 CTA
    └── Footer.jsx         ← 3 列导航 + 联系

public/
└── imgs/                  ← 原站品牌素材 (banner / favicon / group-photo / 4 个 SVG)

content/                  (v4+ 扩展)
└── site.js                ← 文案集中数据源（见 step "抽文案"）
```

---

## 10. Deployment

- **Vercel project**: `prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb` (org `team_1xz4tPQJ42juH64TJBSSYfac`)
- **Production URL**: https://innoseed-landing.vercel.app
- **Build command**: `pnpm build`
- **Output directory**: `dist/`
- **framework**: null（Vite 已经被 Vercel 自动识别，但 `vercel.json` 显式声明更稳）
- **构建依赖注意**: pnpm 10+ 在 Vercel 端不需要 `onlyBuiltDependencies` 配置；本地 pnpm 11 需要 `pnpm-workspace.yaml` 写明 `onlyBuiltDependencies: [esbuild]`（见 `pnpm-workspace.yaml`）

---

## 11. v1 → v4 历史

| 版本 | 形态 | 状态 |
|------|------|------|
| v1 | 暖红+米黄单文件，Awwwards 风格，但全 AI 自绘图（无原站素材） | 废弃 |
| v2 | 完全照搬原站结构 | 打回 |
| v3 | v1 设计语言 + 原站素材和配色（白底蓝主色） | 已被 v4 替换 |
| **v4** | **v3 视觉 + React 18 + Vite 5 + 移动端适配** | **当前** |
| v5 (plan) | 重新引入 video-led hero + CMS 化内容 | 待启动 |

---

## 12. Roadmap (尚未做)

- [ ] 字体内联 / 子集化（Noto Sans/Serif SC 各只用了 ~50 字，目前拉完整字库）
- [ ] Hero 重新评估 video-led 方案
- [ ] CMS 化（Sanity / Contentful），非工程师可改文案
- [ ] i18n（EN/中 双语切换器）
- [ ] Dark mode（需设计语言扩展）
- [ ] Vercel Web Analytics 接入
- [ ] 真实联络表单（替代 mailto:）

详细未做项见项目 `README.md`。
