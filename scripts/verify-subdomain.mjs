#!/usr/bin/env node
/**
 * scripts/verify-subdomain.mjs — 在本地验证子域路由(host-aware redirect)
 *
 * 背景:
 *   - 子域名(如 `minicamp.innoseed.club`)走的是同一份 Vite SPA
 *   - 根路径 / 上有 hostname 检测,匹配子域名前缀就 `<Navigate>` 到
 *     `/minicamp`,避免 landing 闪烁
 *   - `e2e/minicamp.spec.js` 只能验页面结构 / 渲染,验不了 host 检测
 *     (浏览器永远只能去一个真实 hostname,而真域名要 DNS)
 *
 * 这个脚本绕过 DNS:用 Chromium 的 `--host-resolver-rules` 把
 * `minicamp.innoseed.club` 映射到 127.0.0.1,然后启动 `vite preview`
 * 服务同一份 dist/,在浏览器里检查:
 *
 *   1.  子域根 /            → 重定向到 /minicamp,渲染活动页和子域 chrome
 *   2.  子域 /apply          → 仍然落到招新表单
 *   3.  主域根 /             → 渲染落地页(没重定向)
 *   4.  主域 /minicamp       → 渲染 Mini Camp 页(完整 Nav,不子域 chrome)
 *
 * Prereq:
 *   pnpm build                            # 生成 dist/
 *
 * Usage:
 *   node scripts/verify-subdomain.mjs              # 自动启停 vite preview
 *   VITE_PREVIEW_URL=http://host:8765 node ...     # 复用已起的服务器
 *
 * Exit codes:
 *   0  — 全部通过
 *   1  — 任一断言失败
 *   2  — 启动 / 连接错误
 */

// ── 配置 ────────────────────────────────────────────────────────────

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const SUBDOMAIN = 'minicamp.innoseed.club';
const PORT = Number(process.env.PORT ?? 8765);
const EXTERNAL_URL = process.env.VITE_PREVIEW_URL; // 跳过自启服务器

// ── 检查 dist/ ─────────────────────────────────────────────────────

if (!EXTERNAL_URL && !existsSync(resolve(ROOT, 'dist/index.html'))) {
  console.error('✘ dist/index.html 不存在。先跑 pnpm build。');
  process.exit(2);
}

// ── 解析 playwright-core ──────────────────────────────────────────
//
// 项目只装了 @playwright/test(测试运行时),没用 playwright / playwright-core
// 作为顶层 dep。这里通过 pnpm 的真实 node_modules 路径拿到,
// 不引新 dep。

function resolvePlaywright() {
  const pnpmPath = resolve(
    ROOT,
    'node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js',
  );
  if (existsSync(pnpmPath)) {
    return import(pnpmPath);
  }
  throw new Error('找不到 playwright-core。先跑 pnpm install。');
}

// ── 启动 vite preview ─────────────────────────────────────────────

function startVitePreview() {
  // 用一个临时的"允许所有 host"配置,绕开 vite 5 默认的 Host header 校验。
  // 生产里 Vercel 是这一层的正确边界,本地验证为了方便直接放行。
  const cfgPath = resolve(ROOT, 'vite.verify-subdomain.config.ts');
  if (!existsSync(cfgPath)) {
    console.error(`✘ 缺少 ${cfgPath}。`);
    process.exit(2);
  }
  const proc = spawn(
    'npx',
    [
      'vite',
      'preview',
      '--config', cfgPath,
      '--port', String(PORT),
      '--host', '127.0.0.1',
    ],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    },
  );
  return proc;
}

async function waitForServer(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok || r.status === 405) return; // 405 = server alive, method not allowed
    } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server at ${url} did not respond within ${timeoutMs}ms`);
}

// ── 主测试 ────────────────────────────────────────────────────────

async function runChecks() {
  // playwright-core 用 CJS,import 拿到的是 default = 全模块 namespace
  const pwModule = await resolvePlaywright();
  const { chromium } = pwModule.default ?? pwModule;
  const browser = await chromium.launch({
    args: [
      // 把子域名映射到本机。这样 URL 仍是 `minicamp.innoseed.club`,
      // 但流量落到 127.0.0.1,window.location.hostname 也是前者。
      '--host-resolver-rules=MAP ' + SUBDOMAIN + ' 127.0.0.1',
      // 关掉 Chromium 的内置代理 — 它会干扰 vite preview 的 Host 校验,
      // 返回莫名其妙的 502(空 body)。两个 flag 一起才生效。
      '--no-proxy-server',
      '--proxy-server=direct://',
    ],
  });

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const results = {};

  // 1) 子域根 / → 重定向到 /minicamp
  await page.goto(`http://${SUBDOMAIN}:${PORT}/`, { waitUntil: 'networkidle' });
  // React Router 的同步 <Navigate> 会立刻跳到 /minicamp,但 chunk 是 lazy
  // 加载的。等 .minicamp-track 出现再断言 H1 / chrome。
  await page.locator('.minicamp-track').first().waitFor({ timeout: 5000 }).catch(() => {});
  results.subdomain_root = {
    finalUrl: page.url(),
    h1Visible: await page.locator('.minicamp-page .page-header h1').isVisible(),
    subdomainHeader: (await page.locator('.minicamp-subdomain-head').count()) === 1,
    tracks: await page.locator('.minicamp-track').count(),
    timelineSteps: await page.locator('.minicamp-timeline-step').count(),
    ok: false,
  };
  results.subdomain_root.ok =
    results.subdomain_root.finalUrl.endsWith('/minicamp') &&
    results.subdomain_root.h1Visible &&
    results.subdomain_root.subdomainHeader &&
    results.subdomain_root.tracks === 4 &&
    results.subdomain_root.timelineSteps === 0;

  // 2) 子域 /apply → 仍然落到招新表单(不被重定向劫持)
  await page.goto(`http://${SUBDOMAIN}:${PORT}/apply`, { waitUntil: 'networkidle' });
  await page.getByText('欢迎加入 InnOSeed。').waitFor({ timeout: 5000 }).catch(() => {});
  results.subdomain_apply = {
    finalUrl: page.url(),
    guideVisible: await page.getByText('欢迎加入 InnOSeed。').isVisible(),
    ok: page.url().endsWith('/apply'),
  };

  // 3) 主域根 / → 落地页(没重定向)
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.locator('.hero h1').waitFor({ timeout: 5000 }).catch(() => {});
  results.main_root = {
    finalUrl: page.url(),
    landingHeroVisible: await page.locator('.hero h1').isVisible(),
    ok: page.url().endsWith('/') && (await page.locator('.hero h1').isVisible()),
  };

  // 4) 主域 /minicamp → 渲染 + 完整 Nav(不是子域 chrome)
  await page.goto(`http://127.0.0.1:${PORT}/minicamp`, { waitUntil: 'networkidle' });
  await page.locator('.minicamp-track').first().waitFor({ timeout: 5000 }).catch(() => {});
  results.main_minicamp = {
    finalUrl: page.url(),
    fullNav: (await page.locator('header nav a[href="#pillars"]').count()) === 1,
    noSubdomainChrome: (await page.locator('.minicamp-subdomain-head').count()) === 0,
    ok: false,
  };
  results.main_minicamp.ok =
    results.main_minicamp.fullNav && results.main_minicamp.noSubdomainChrome;

  await browser.close();
  return results;
}

// ── 输出 + 退出码 ──────────────────────────────────────────────────

function fmt(ok) { return ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✘\x1b[0m'; }

async function main() {
  let viteProc = null;
  if (!EXTERNAL_URL) {
    console.log(`▸ 启动 vite preview on 127.0.0.1:${PORT}`);
    viteProc = startVitePreview();
    viteProc.stderr.on('data', (d) => {
      const msg = d.toString();
      // vite 启动失败时 stderr 会有用
      if (/error|EADDRINUSE/i.test(msg)) process.stderr.write(`[vite] ${msg}`);
    });
    await waitForServer(`http://127.0.0.1:${PORT}/`);
  } else {
    console.log(`▸ 复用外部服务器 ${EXTERNAL_URL}`);
  }

  let results;
  try {
    results = await runChecks();
  } catch (e) {
    console.error('✘ 测试运行失败:', e.message);
    if (viteProc) viteProc.kill('SIGKILL');
    process.exit(2);
  }

  if (viteProc) viteProc.kill('SIGKILL');

  console.log('');
  for (const [name, r] of Object.entries(results)) {
    console.log(`${fmt(r.ok)} ${name}`);
    if (!r.ok || process.env.VERBOSE) {
      for (const [k, v] of Object.entries(r)) {
        if (k === 'ok') continue;
        console.log(`    ${k}: ${JSON.stringify(v)}`);
      }
    }
  }

  const allOk = Object.values(results).every((r) => r.ok);
  console.log('');
  console.log(allOk ? '✓ subdomain 路由验证通过' : '✘ 有断言失败');
  process.exit(allOk ? 0 : 1);
}

main();