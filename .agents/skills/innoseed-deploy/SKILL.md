---
name: innoseed-deploy
description: Deploy workflow for the InnOSeed Lab landing (innoseed.club) — local subdomain verification with chromium --host-resolver-rules, commit + PR + CI, Vercel domain attachment, DNS CNAME setup, and branch cleanup. Use when shipping a change to main, adding a new subdomain (e.g. minicamp.innoseed.club), or pruning stale branches.
---

# InnOSeed Deploy

End-to-end workflow for shipping changes to the InnOSeed landing site. Three
phases — verify locally, push for review, finish the deploy by hand in
Vercel + DNS.

## Repository invariants (do not violate)

From `AGENTS.md`:

- **Don't `vercel deploy` manually.** CI is the authoritative deploy
  path. Push to a branch, open a PR, CI builds + Vercel deploys the
  preview, then merge → production.
- **`framework: null` in `vercel.json`** is intentional, do not let
  Vercel infer.
- **Branch prefix `codex/`** (or `MciG-ggg/` matching existing style —
  see `git for-each-ref`).
- **Conventional commits**: `feat / fix / perf / refactor / chore / docs`.
- **TypeScript strict**: don't loosen `tsconfig.json`.
- **Don't bypass `pnpm-workspace.yaml`**: pnpm 11 needs it for esbuild.

## Phase 1 — verify locally

```bash
# 1. Static checks + build + tests. Must all be green.
pnpm typecheck
pnpm exec tsc -p tsconfig.node.json
pnpm build
pnpm test:e2e
pnpm test:tag-codes

# 2. Subdomain behavior check (only if the change touches hostname
# routing or adds a new route / subdomain). Self-contained: starts vite
# preview, runs 4 browser assertions, kills the server. Exit code 0
# means OK.
pnpm verify:subdomain
```

`pnpm verify:subdomain` exercises what `e2e/minicamp.spec.js` cannot:
the host-aware `<Navigate>` at `/`. It uses Chromium's
`--host-resolver-rules` to map `minicamp.innoseed.club` → `127.0.0.1`
without touching `/etc/hosts` (no sudo needed). The full flag set it
needs (already wired in the script):

```
--host-resolver-rules=MAP minicamp.innoseed.club 127.0.0.1
--no-proxy-server
--proxy-server=direct://   # Chromium needs both flags; --no-proxy-server
                           # alone doesn't always clear its detected proxy.
```

If you change the hostname list (e.g. adding a new subdomain), edit
`SUBDOMAIN` near the top of `scripts/verify-subdomain.mjs`. The script
asserts 4 things:

1. `minicamp.innoseed.club/` redirects to `/minicamp` + renders
   subdomain chrome (4 tracks, no recruitment timeline).
2. `minicamp.innoseed.club/apply` still lands on Apply (not hijacked).
3. `127.0.0.1:8765/` lands on the main landing page (no redirect).
4. `127.0.0.1:8765/minicamp` renders the page with full Nav (NOT
   subdomain chrome).

## Phase 2 — commit, push, open PR

```bash
# Branch off main. Use codex/<slug> or MciG-ggg/<slug>.
git checkout main && git pull
git checkout -b codex/<short-slug>

# Stage deliberately — never `git add .`. Composite-emitted .d.ts/.js
# are gitignored, but verify with `git status --short` before commit.
git add <specific paths>

git commit -F- <<'EOF'
<type>(<scope>): <subject>

<body explaining what + why, not how>
EOF

git push -u origin HEAD

# Open the PR. Body in a file (backticks in inline strings get
# interpolated by bash).
gh pr create --title "<same as commit subject>" --body-file /tmp/pr-body.md
gh pr checks <num>          # wait for Vercel + CI to go green
```

**Do not push directly to main.** Always PR so CI runs and someone can
review. Vercel auto-deploys production on merge.

### Commit message conventions

```
feat(minicamp): add minicamp.innoseed.club subdomain
fix(apply): stack CTA buttons on tablet
perf(images): serve AVIF variants
chore(site): update copyright
docs(ag): document deploy workflow
```

## Phase 3 — make the subdomain reachable (one-time per new domain)

`vercel.json` rewrites `/`, `/apply`, `/events`, `/recruit`, `/minicamp`
to `/index.html` — same SPA serves every host. To bind a new subdomain:

```bash
# A. Vercel side (browser or CLI):
#    1. Vercel dashboard → innoseed-landing → Settings → Domains, or:
#       vercel domains add <subdomain> innoseed-landing
#    2. Run `vercel domains verify <subdomain>` to get the exact target.
#       The current minicamp target is:
#       CNAME  minicamp  →  9293a6f6fcfa0256.vercel-dns-017.com
#    3. Wait for Vercel to issue the SSL cert after DNS resolves.

# B. DNS side (provider-specific, e.g. Cloudflare):
#    Use the exact CNAME target from `vercel domains verify`.
#    Proxy: DNS only (off the orange cloud) — Cloudflare's proxy breaks
#    Vercel's SSL issuance. Do not blindly use the generic
#    cname.vercel-dns.com when Vercel returns a project-specific target.

# C. Verify:
curl -I https://minicamp.innoseed.club/      # 200 from Vercel
open https://minicamp.innoseed.club/         # browser lands on Mini Camp
```

`vercel.json` does **not** need editing for new subdomains — same SPA
rewrite rules cover every host. Only `package.json`, `vite.config.ts`,
and `src/App.tsx` (hostname detection) need code changes when adding a
subdomain.

## Branch cleanup

Before cleanup, check what's safe to delete:

```bash
git for-each-ref --format='%(refname:short)' refs/heads/ refs/remotes/

# '+' marker on local branches = checked out in another worktree.
# Don't `git branch -D` those.

# Remote branches: only safe to delete if merged into main.
for b in $(git branch -r | grep -v HEAD); do
  git merge-base --is-ancestor $b origin/main \
    && echo "DELETE OK: $b" \
    || echo "KEEP (not merged): $b"
done

# Confirm before deleting — output is dry-run only.
```

`git fetch --prune` cleans up stale remote-tracking branches after
deletions on origin.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `vite preview` returns 502 / 403 on `minicamp.innoseed.club` from curl | Vite 5 Host header check. Either use `vite.verify-subdomain.config.ts` (sets `preview.allowedHosts: true`) or set Host header to `127.0.0.1:8765` in curl. |
| `pnpm verify:subdomain` reports `subdomain_root.ok: false` but `pnpm preview` works | Missing `--proxy-server=direct://` flag. Both `--no-proxy-server` and `--proxy-server=direct://` are required. |
| `vite preview` says `Port 8765 in use` | A previous run didn't clean up. `pkill -9 -f vite` then retry. |
| `git push` rejected — non-fast-forward | `git fetch origin && git rebase origin/main`. |
| `gh pr create` fails with `No default branch` | `gh repo set-default` or pass `--base main`. |
| `pnpm exec tsc -p tsconfig.node.json` emits `src/content/site.d.ts` + `site.js` | Composite-mode cross-project ref artifact from `tsconfig.node.json`. Already in `.gitignore` — verify `git status` is clean before commit. |
