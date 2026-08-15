---
name: innoseed-deploy
description: Deploy workflow for the InnOSeed Lab landing (innoseed.club) — local subdomain verification with chromium --host-resolver-rules, merge-to-main + push deploy model, Vercel domain attachment, DNS CNAME setup, and branch cleanup. Use when shipping a change to main, adding a new subdomain (e.g. minicamp.innoseed.club), or pruning stale branches.
---

# InnOSeed Deploy

上线 / 子域名 / DNS / 分支清理的可执行流程。仓库级禁区与验证权威清单见 `AGENTS.md`，本 skill **不复述**长段契约。

## 何时触发

- 要把改动推上 `main`（Production）
- 新增或验证子域名（如 `minicamp.innoseed.club`）
- 配置 Vercel Domains / DNS CNAME
- 清理已合并的本地/远程分支

## 必读文件

| 文件 | 为何 |
| --- | --- |
| `AGENTS.md` §2 / §4.1 / §4.3 | 禁区、验证权威清单、部署摘要 |
| `vercel.json` | SPA rewrite；新子域名通常**不用**改此文件 |
| `scripts/verify-subdomain.mjs` | 子域名 host 行为断言；改 hostname 列表改顶部 `SUBDOMAIN` |
| `src/App.tsx` | hostname → `<Navigate>` / chrome 分支 |
| `package.json` → `verify:subdomain` | 一键本地验证入口 |

## 提醒（详见 AGENTS.md）

- **不要**手动 `vercel deploy`；推 `main` 才是权威上线路径。
- `vercel.json` 的 `framework: null` 不要让 Vercel 推断掉。
- 分支前缀 `codex/`（或现有 `MciG-ggg/` 风格）；验证命令以 `AGENTS.md` §4.1 为准。

## 分步流程

### Phase 1 — 本地验证

```bash
# 权威清单见 AGENTS.md §4.1；上线前至少跑通：
pnpm typecheck
pnpm exec tsc -p tsconfig.node.json
pnpm build
pnpm test:e2e
pnpm test:tag-codes   # 若改动触及 apply / tagcode，必跑

# 仅当改动触及 hostname 路由或新增子域名时：
pnpm verify:subdomain
```

`pnpm verify:subdomain` 会启动 vite preview，用 Chromium `--host-resolver-rules` 把子域名指到 `127.0.0.1`（无需改 `/etc/hosts`），断言 4 件事后退出。Chromium 需要同时带：

```
--host-resolver-rules=MAP minicamp.innoseed.club 127.0.0.1
--no-proxy-server
--proxy-server=direct://
```

脚本已写好上述 flag。若改 hostname 列表，编辑 `scripts/verify-subdomain.mjs` 顶部的 `SUBDOMAIN`。四条断言：

1. `minicamp.innoseed.club/` → 重定向到 `/minicamp` + 子域名 chrome（4 tracks，无招新时间线）
2. `minicamp.innoseed.club/apply` 仍落在 Apply（不被劫持）
3. `127.0.0.1:8765/` 落在主站 landing（无重定向）
4. `127.0.0.1:8765/minicamp` 用完整 Nav（**不是**子域名 chrome）

### Phase 2 — 分支提交，合并到 main 并推送

Vercel 在每次推 `main` 时自动部署 Production。**常规上线路径：branch → commit → 本地 ff-only merge 到 main → push main。** 例行修复不必强制 `gh pr create`；需要外部 review（spec/设计大改、高风险重构）再用 PR。

```bash
git checkout main && git pull
git checkout -b codex/<short-slug>

# 刻意 stage —— 禁止 git add .
# composite 冒出的 .d.ts/.js 已 gitignore，提交前仍用 git status --short 确认干净。
git add <specific paths>

git commit -F- <<'EOF'
<type>(<scope>): <subject>

<body explaining what + why, not how>
EOF

git checkout main
git merge --ff-only codex/<short-slug>
git push origin main

git branch -d codex/<short-slug>
```

**推 `main` = 部署。** 若 `git push` 非快进：`git fetch origin && git rebase origin/main` 后再试。

#### 可选：PR review

```bash
git push -u origin HEAD
gh pr create --title "<same as commit subject>" --body-file /tmp/pr-body.md
gh pr checks <num>
gh pr merge --squash --delete-branch
git pull && git fetch --prune
```

Commit 类型示例：`feat` / `fix` / `perf` / `refactor` / `chore` / `docs`。

### Phase 3 — 让新子域名可达（每个新域名一次）

同一套 SPA rewrite 服务所有 host。绑定新子域名：

```bash
# A. Vercel
#    vercel domains add <subdomain> innoseed-landing
#    vercel domains verify <subdomain>  → 拿精确 CNAME target
#    当前 minicamp 示例：
#    CNAME  minicamp  →  9293a6f6fcfa0256.vercel-dns-017.com

# B. DNS（如 Cloudflare）
#    用 verify 返回的精确 target；Proxy = DNS only（关掉橙云），
#    否则会打断 Vercel 签 SSL。不要盲用通用 cname.vercel-dns.com。

# C. 验证
curl -I https://minicamp.innoseed.club/
open https://minicamp.innoseed.club/
```

**不必**为新子域名改 `vercel.json`。代码侧通常改 `package.json` / `vite.config.ts` / `src/App.tsx`（hostname 检测）；页面文案走 `innoseed-content`。

### 分支清理

```bash
git for-each-ref --format='%(refname:short)' refs/heads/ refs/remotes/

# 本地分支带 '+' = 在别的 worktree 里 checkout，不要 git branch -D。
# 远程：仅当已是 origin/main 祖先才可删（先 dry-run）。
for b in $(git branch -r | grep -v HEAD); do
  git merge-base --is-ancestor $b origin/main \
    && echo "DELETE OK: $b" \
    || echo "KEEP (not merged): $b"
done
```

删完后 `git fetch --prune`。

## 本任务验证子集

- 必跑：`AGENTS.md` §4.1 全套（至少 typecheck + build + e2e）
- 触及 hostname / 新子域名 → 追加 `pnpm verify:subdomain`
- 触及 apply → 追加 `pnpm test:tag-codes`
- 上线后：Vercel dashboard → `innoseed-landing` → Deployments

## Troubleshooting

| 症状 | 原因 |
| --- | --- |
| curl 子域名 502/403 | Vite 5 Host 检查；用 `vite.verify-subdomain.config.ts`（`preview.allowedHosts: true`）或把 Host 设成 `127.0.0.1:8765` |
| `verify:subdomain` 失败但 preview 正常 | 缺 `--proxy-server=direct://`（两个 proxy flag 都要） |
| Port 8765 in use | `pkill -9 -f vite` 后重试 |
| push 非快进 | `git fetch origin && git rebase origin/main` |
| `gh pr create` 无 default branch | `gh repo set-default` 或 `--base main` |
| `tsc -p tsconfig.node.json` 冒出 `site.d.ts` / `site.js` | composite 产物，已在 `.gitignore`；commit 前确认 `git status` 干净 |
