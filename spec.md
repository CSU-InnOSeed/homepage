# InnOSeed Lab — Landing Page 设计稿

> 中南大学计算机学院 InnOSeed 创新实验室品牌展示页
> 风格：温暖、有机、年轻、不像传统学院派的"冷"，但保留学术严谨的秩序感

---

## 1. Expanded Prompt

### 1.1 Project Context

- **品牌**：CSU InnOSeed Lab（中南大学 InnOSeed 实验室）
- **性质**：学生创新实验室 / 创业俱乐部 — "different thinkers 的俱乐部"
- **四大方向**：竞赛 / 科研 / 创业 / 志合者
- **核心受众**：中南大学（尤其计算机学院）学生、招新候选人、合作伙伴、企业方、升学/留学方向的学弟学妹
- **页面目的**：品牌展示 + 招新引流 + 合作邀约
- **关键数据点**：10 国/国际一等奖 / 13 国奖 / 64 国家级荣誉 / 140+ 校级以上；5 清华 / 2 北大 / 1 斯坦福 / 3 QS 前 100 交换
- **代表人物**：苗子阳（保研中南）、常佳宇（斯坦福）、颜思宇（竞赛大满贯）

### 1.2 Hero Section — Video-First

**Strategy**：Video-Led Hero（首选），mature 自然的微距延时摄影 / 有机材质特写

**Cinematic prompt**（用于视频生成）：

> Macro time-lapse of a seed germinating through rich dark soil, slow push-in, golden morning light, shallow depth of field, fine soil particles drifting, roots splitting earth, a tender green shoot rising into warm sunlight, organic textures, soft bokeh. Shot on Arri Alexa, 100mm macro lens, f/2.8, 8K hyper-realistic, warm color palette, terracotta and forest green tones, 24fps cinematic.

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

- 文字颜色：温暖米白 `#F5EFE6`，加细微 letter-spacing
- 中心文字：超大字号，headline 字重 800，行高 0.95
- "different thinkers" 单独成行，italic + serif 字体处理，加深品牌记忆
- 副标语使用全角中文 + 半角英文混排，体现双语俱乐部的国际化

### 1.3 Typography Plan

| 用途 | 字体 | 字重 | 字号 | 备注 |
|------|------|------|------|------|
| Display Headline（巨型标题） | Fraunces (serif) | 800 | clamp(64px, 10vw, 200px) | 用于 hero 与章节大数字 |
| Brand Word（品牌字 "InnOSeed"） | Fraunces | 700 italic | 动态 | 视觉签名 |
| Section Title | "Noto Serif SC" | 700 | clamp(40px, 5vw, 72px) | 中文标题 |
| Body | "Inter" + "Noto Sans SC" | 400/500 | 16-18px | 段落正文 |
| Eyebrow / Tag | Inter | 600 caps | 12-13px | 段落顶部小标 |
| Numbers | Fraunces (tabular) | 800 | clamp(80px, 12vw, 200px) | 关键数据展示 |

**字体来源**：Google Fonts（CDN），preload 关键字重

### 1.4 Layout Structure

| 区块 | 内容 | 视觉特征 |
|------|------|----------|
| 1. Navbar | 透明 + 滚动后变实底 | 滚动时 backdrop-blur |
| 2. Hero | 视频背景 + 大字 + 标语 | 100vh |
| 3. Manifesto | 一段宣言式文字 + 滚动视差 | 大字"在这里，我们……" |
| 4. Four Pillars | 竞赛 / 科研 / 创业 / 志合者 | 4 张大卡片，hover 视差 |
| 5. Numbers | 4 个超大数据 + 注解 | 错落排版，进入视口时数字 count-up |
| 6. Members | 三位代表人物 | 横向滚动 / 卡片 |
| 7. Inside Lab | 沙龙 / 业界交流 / 链接到 CSDN、GitHub | 大图 + 文字 |
| 8. Recruit | 招新 CTA | 巨型"加入我们"按钮 |
| 9. Footer | 邮箱 / 微信 / 版权 | 简洁 |

### 1.5 Motion / Animation Plan

- **首屏**：hero 文字 stagger fade-up（每行间隔 80ms），视频 fade-in
- **滚动**：各 section 进入视口时整体上滑 + 渐显（IntersectionObserver，threshold 0.15）
- **数字**：count-up 动画（0 → 目标值，2.2s，ease-out-quart）
- **卡片**：hover 时上浮 8px，图片缓慢 zoom 1.05
- **navbar**：滚动 80px 后背景从透明 → 半透明深棕，blur(20px)
- **cursor**：自定义 hover 在 link/button 时放大到 1.5x
- **微交互**：CTA 按钮 hover 时背景填充动画（从左到右展开）
- **滚动指示**：hero 右下角有无限下落的小箭头

---

## 2. Tech Strategy

### 2.1 Stack

- **HTML5** 单页（语义化标签）
- **CSS**：原生 CSS + CSS Variables（**禁用蓝色/紫色**），所有样式 inline 在 `<style>` 标签
- **JS**：原生 ES6+，无外部依赖（不引入 jQuery / GSAP / Framer Motion）
  - 使用 IntersectionObserver 做滚动动画
  - 使用 requestAnimationFrame 做数字 count-up
  - 一个轻量 marquee 跑马灯
- **字体**：Google Fonts CDN（Fraunces、Inter、Noto Serif SC、Noto Sans SC）
- **图标**：内联 SVG

### 2.2 Asset Protocol

- **视频**：1080p (1920×1080) 最低，autoplay+muted+loop+playsinline
- **视频格式**：MP4 (H.264) 优先
- **图片**：WebP 优先，JPEG 兜底；每张图同时给 `loading="lazy"` + `onerror` 隐藏
- **路径**：`./videos/hero.mp4`、`./imgs/pillar-1.jpg` 等
- **不允许**：在视频上覆盖 poster 静态图阻挡播放；视频容器必须设置 `background-color` 兜底

---

## 3. Design System

### 3.1 Color Palette（已校验：NO blue / NO purple）

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-base` | `#0F0E0C` | 页面底色，深棕黑（暖黑） |
| `--bg-warm` | `#1A1612` | 卡片底色 |
| `--bg-cream` | `#F5EFE6` | 浅色章节底色（与暗色章节形成对撞） |
| `--ink-primary` | `#F5EFE6` | 暗色背景上的主文字 |
| `--ink-dark` | `#1A1612` | 浅色背景上的主文字 |
| `--ink-muted` | `#8A8378` | 辅助文字 |
| `--accent-clay` | `#C8553D` | 中南红 / 赭石红，主强调色 |
| `--accent-moss` | `#5C7548` | 苔藓绿，代表生长 |
| `--accent-gold` | `#D4A24C` | 暖金，数字 / 强调 |
| `--accent-amber` | `#E8B86D` | 浅金，hover 状态 |
| `--rule` | `#2A2520` | 分隔线 |
| `--grain` | `rgba(245,239,230,0.03)` | 噪点纹理 |

**色温**：全暖色调，红 / 棕 / 米 / 金 / 苔绿——所有颜色都往暖侧偏，呼应"种子在土里"的意象，避开冷色调。

### 3.2 Typography Scale

```
--fs-display:  clamp(72px, 12vw, 200px);
--fs-h1:       clamp(48px, 7vw, 96px);
--fs-h2:       clamp(36px, 4.5vw, 64px);
--fs-h3:       clamp(24px, 2.5vw, 36px);
--fs-body:     17px;
--fs-small:    13px;
--fs-eyebrow:  12px;
```

### 3.3 Layout / Spacing

- **栅格**：12 列，max-width 1320px，gutter 24px
- **垂直节奏**：section padding `clamp(80px, 12vh, 160px) 0`
- **基础间距单位**：8px
- **圆角**：`--radius-sm: 8px` / `--radius-md: 16px` / `--radius-lg: 32px`
- **阴影**（暗底专用）：`0 30px 60px -20px rgba(0,0,0,0.5)`

### 3.4 Effects

- **颗粒纹理**：在 body 上一层 `background-image: url('data:image/svg+xml;...')` 细噪点
- **光晕**：在主视觉上方用 radial-gradient 模拟暖光斑
- **滚动条**：自定义为深棕底 + 米色 thumb
- **选区颜色**：`::selection { background: var(--accent-clay); color: var(--ink-primary); }`
