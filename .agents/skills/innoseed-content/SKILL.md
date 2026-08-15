---
name: innoseed-content
description: Edit InnOSeed landing copy, SEO meta, NAV_LINKS, section anchors, and MINICAMP content in site.ts / index.html. Use when changing Chinese site copy, Hero/Footer/Recruit text, navigation entries, og tags, or Mini Camp page content (not host/DNS — that is innoseed-deploy).
---

# InnOSeed Content

文案 / SEO / 导航 / section 锚点 / Mini Camp **内容块**的可执行流程。视觉 token 走 `innoseed-visual`；子域名 host 走 `innoseed-deploy`。

## 何时触发

- 改 `src/content/site.ts` 里的文案常量（Hero / Manifesto / Pillars / Members / Events / Recruit / Footer / MINICAMP 等）
- 改 `NAV_LINKS` 或新增/重命名 section 锚点
- 改 SEO：`META`、`index.html` head、`og:*` / `meta description`
- 改 Mini Camp **页面文案/结构数据**（不是 DNS / hostname）

## 必读文件

| 文件 | 为何 |
| --- | --- |
| `src/content/site.ts` | **唯一文案源**（`TAGLINE` / `META` / `NAV_LINKS` / 各 section / `MINICAMP`） |
| `index.html` | 静态 head：`og:description` / `meta description` / preload；改 Hero 文案时常要同步 |
| `AGENTS.md` §5 | 路由表与现有锚点列表 |
| `e2e/_shared.js` + 对应 viewport spec | 锚点 / 「渲染存在」回归 |
| `src/hooks/usePageMeta.ts`（若存在） | 路由级 meta 注入 |

## 提醒（详见 AGENTS.md）

- 文案只改 `site.ts`，不要在组件里散落硬编码中文（已有 `TAGLINE` 等提取约定）。
- 新锚点必须：组件 `id` + `NAV_LINKS` + e2e 仍过。
- 涉及 `spec.md` 视觉契约的改动转 `innoseed-visual`；PR 标题加 `[spec]`。

## 分步流程

### 改普通文案

1. 在 `site.ts` 找到对应导出（`HERO` / `RECRUIT` / `FOOTER` / `EVENTS` / `MINICAMP` …）。
2. 若改的是 Hero / 品牌一句话：同步 `index.html` 的 `og:description` / `meta description`，并核对 `META`。
3. 若改 Recruit 时间线 / FAQ：确认只在 `site.ts`（及 Recruit 组件读取处），不要复制第二份。
4. 跑本任务验证子集。

### 改导航 / 新增 section 锚点

1. 在目标 section 组件根节点加稳定 `id`（与现有风格一致）。
2. 更新 `NAV_LINKS`（label + href，如 `#pillars`）。
3. 确认首页实际渲染该 section（`App.tsx` 组装顺序）。
4. 跑 `pnpm test:e2e`，确认 `checkNavSmoothScroll` 与各 viewport「渲染存在」断言仍绿。
5. 现有锚点：`#top` `#manifesto` `#pillars` `#members` `#events` `#recruit`。

### 改 SEO meta

1. `site.ts` 的 `META`（及路由用到的 title/description 字段）。
2. `index.html` head 静态标签（首屏 / 无 JS 爬虫可见部分）。
3. 若某路由用 `usePageMeta` / JSON-LD，核对该路由的 `og:url` / `og:title` / `og:description`。
4. 不要引入新的第三方 SEO CDN。

### 改 Mini Camp 内容

1. 改 `site.ts` 的 `MINICAMP` 块与 `pages/MiniCamp.tsx` / 相关 CSS。
2. **不要**在本 skill 里改 DNS、`verify-subdomain`、hostname 分支 —— 那是 `innoseed-deploy`。
3. 主站 chrome vs 子域名 chrome 的行为回归：若只改文案，e2e 即可；若改了 host 分支，转 deploy skill 跑 `pnpm verify:subdomain`。

## 本任务验证子集

```bash
pnpm typecheck && pnpm build && pnpm test:e2e
```

- 改了锚点 / 新 section → 确认对应 viewport spec 有「渲染存在」覆盖。
- 不要删 `e2e/_shared.js` 断言来「跳过」。
