---
name: innoseed-visual
description: Change InnOSeed design tokens, globals.css typography/color/breakpoints, spec.md visual contract, pillar colors/icons, and brand image rebuild scripts. Use when editing visual design, motion, responsive tokens, public/imgs generation via optimize-images.py / build-og-cover.py, or syncing spec.md sections 5–8.
---

# InnOSeed Visual

design token / `globals.css` / `spec.md` 视觉契约 / pillar 配色与图标 / 品牌图脚本的可执行流程。纯文案走 `innoseed-content`；上线走 `innoseed-deploy`。

## 何时触发

- 改颜色、字号、断点、动效（`globals.css` 与 `spec.md` §5–§8）
- 改 4 个 pillar：`--c-compete` / `--c-research` / `--c-startup` / `--c-bonds` 或 `PILLAR_ICONS`
- 重建 `banner-*` / `group-photo-*` / `og-cover.png` / favicon（**禁止手改导出图**）
- 改 `index.html` 的 preload `imagesrcset`（与 `public/imgs/` 强绑定）

## 必读文件

| 文件 | 为何 |
| --- | --- |
| `spec.md` §5–§8 | 字号 / 颜色 / 断点 / 动效的**权威契约**；改视觉必须同步 |
| `src/styles/globals.css` | design token + 分区样式 + 移动断点（原生 CSS，无 Tailwind） |
| `src/components/Pillars.tsx` | 顶部 `PILLAR_ICONS` |
| `src/content/site.ts` / `apply.ts` | `pillarKey` 共享枚举 `compete | research | startup | bonds` |
| `scripts/optimize-images.py` / `scripts/build-og-cover.py` | 品牌图唯一合法生成路径 |
| `index.html` preload 列表 | 与 `public/imgs/` srcset 同步 |

## 提醒（详见 AGENTS.md）

- 不上 Tailwind / Sass / CSS-in-JS。
- 图片进 `public/imgs/`，不要放 `src/`。
- token 块与 `spec.md` 必须同 PR 对齐；标题加 `[spec]` 并让 owner 确认。
- 主色约定：不要把蓝/紫当作 primary（见 `spec.md` §6）。

## 分步流程

### 改 typography / color / breakpoint / motion

1. 先读 `spec.md` 对应节，写下目标值。
2. 改 `globals.css` 顶部 token 与相关规则（保持三档移动断点语义，见 spec §7）。
3. **立刻**回写 `spec.md` §5–§8，避免契约漂移。
4. 必要时更新依赖这些 token 的组件 class（仍用扁平 `components/SectionName.tsx`）。
5. 跑视觉相关验证子集；涉及 layout 脆点时盯 iPhone SE viewport。

### 改 pillar 配色 / 图标

1. `globals.css`：`--c-compete` / `--c-research` / `--c-startup` / `--c-bonds`。
2. `Pillars.tsx`：`PILLAR_ICONS`。
3. 确认 `site.ts` / `apply.ts` 的 `pillarKey` 仍是同一四元组；Apply 选项上的 `pillarKey` 颜色语义不要 silently 换义。
4. 同步 `spec.md` 色板叙述。

### 重建品牌图

1. **不要**直接编辑 `public/imgs/banner-*` / `group-photo-*` / `og-cover.png` / `favicon.png`。
2. 源图就位后跑：
   - `scripts/optimize-images.py` — banner / group-photo 的 web 变体（含 AVIF 等）
   - `scripts/build-og-cover.py` — `public/imgs/og-cover.png`（1200×630）
3. 若 srcset 文件名或宽度档变了：同步 `index.html` 的 `<link rel=preload imagesrcset>`。
4. 提交前确认没有把巨大原图误加进仓库。

### 改 preload / 缓存相关图片引用

1. `public/imgs/` 与 `index.html` preload **成对改**。
2. 若动到 `vercel.json` 静态缓存头，用 `vercel dev` 验，并考虑转 `innoseed-deploy` 做上线检查。

## 本任务验证子集

```bash
pnpm typecheck && pnpm build && pnpm test:e2e
```

- 改了 spec → PR 标题 `[spec]`，描述写明改了哪节。
- 重点看 `iphone-se.spec.js`：该档最脆，禁止删 `_shared` 断言蒙混。
