import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { TAGLINE } from './src/content/site';

/**
 * Vite config for InnOSeed landing.
 * Output is plain static assets (dist/) — Vercel serves them as-is.
 *
 * Three runtime injections, all on production build only:
 *
 *   1. inject-build-info  → window.__BUILD = { sha, time, mode, deploymentId, url }
 *      Used by observability + footer to surface the deployed commit.
 *
 *   2. inject-analytics    → Plausible/Umami script tag in <head>
 *      Set VITE_ANALYTICS_URL=https://plausible.io/js/script.js and a
 *      1x1 script tag is injected into the prod HTML.
 *      VITE_ANALYTICS_DOMAIN overrides the default data-domain.
 *      unset → no bytes shipped.
 *
 *   3. inject-tagline     → <meta name="description"> /
 *                           <meta property="og:description"> /
 *                           <meta name="twitter:description">
 *                           Pulled from src/content/site.ts TAGLINE so
 *                           the static initial-paint meta agrees with
 *                           the SPA's per-route meta (item 6).
 *
 *   4. (none)              → VITE_ANALYTICS_ENDPOINT (used by observability
 *      at runtime, not injected into HTML) routes custom event POSTs to
 *      your own collector when you want Plausible/Umami in addition.
 */

function readGitShortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .slice(0, 7);
  } catch {
    return 'unknown';
  }
}

export default defineConfig(({ mode }) => {
  // loadEnv('', process.cwd(), '') so we can read both VITE_* and non-prefixed.
  const env = loadEnv(mode, process.cwd(), '');
  const analyticsUrl = (env.VITE_ANALYTICS_URL || '').trim();
  const analyticsDomain = (
    env.VITE_ANALYTICS_DOMAIN
    || env.VERCEL_PROJECT_PRODUCTION_URL
    || 'innoseed-landing.vercel.app'
  ).trim();

  // Vercel 在 build 时注入的变量。VERCEL_ENV: 'production' | 'preview' | 'development'
  const vercelEnv = (env.VERCEL_ENV || '').trim();
  const isVercelBuild = vercelEnv === 'production' || vercelEnv === 'preview';

  const buildInfo = {
    sha: isVercelBuild ? (env.VERCEL_GIT_COMMIT_SHA || readGitShortSha()).slice(0, 7) : readGitShortSha(),
    time: new Date().toISOString(),
    mode: isVercelBuild ? vercelEnv : (mode === 'production' ? 'production' : 'development'),
    deploymentId: (env.VERCEL_DEPLOYMENT_ID || '').trim() || undefined,
    url: (env.VERCEL_PROJECT_PRODUCTION_URL || '').trim() || undefined,
  };

  return {
    plugins: [
      react(),
      {
        name: 'inject-build-info',
        // Run on JS bundles — emit the build info constant so the app
        // can read it without an extra fetch. Order 'pre' so it's
        // available to all transforms.
        transform(_code, id) {
          if (!id.includes('src/main.tsx') && !id.includes('/lib/observability')) return null;
          // No-op transform — we just need the plugin to register. The
          // real injection happens in transformIndexHtml below.
          return null;
        },
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            if (mode === 'development') return html;
            const json = JSON.stringify(buildInfo);
            const tag = `<script>window.__BUILD__=${json};</script>`;
            return html.replace('<head>', `<head>\n    ${tag}`);
          },
        },
      },
      {
        name: 'inject-analytics',
        // Run after HTML is processed so we land our tag inside <head>.
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            if (!analyticsUrl || mode !== 'production') return html;
            // Localhost never phones home — also: Vercel preview deployments
            // use a different domain, so the data-domain here is the prod
            // canonical. Adjust via VITE_ANALYTICS_DOMAIN if you proxy the
            // primary domain to Vercel.
            const tag = `<script defer data-domain="${analyticsDomain}" src="${analyticsUrl}"></script>`;
            return html.replace('</head>', `    ${tag}\n  </head>`);
          },
        },
      },
      {
        // Single source of truth for the tagline: src/content/site.ts
        // exports TAGLINE; we rewrite the three initial-paint meta
        // descriptions in index.html to match it. Without this the
        // initial HTML payload would disagree with the SPA's per-route
        // description (set via usePageMeta) and crawlers / link
        // unshorteners that scrape the static HTML would index the
        // old wording.
        name: 'inject-tagline',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            // Match each meta tag whose content the hook should own,
            // then replace the quoted content with the TAGLINE-derived
            // value. Anchoring on the attribute name keeps the
            // replacement narrow so we never accidentally touch any
            // other meta description that the page might add later.
            const rewrite = (input: string, attr: 'name' | 'property', key: string): string =>
              input.replace(
                new RegExp(`(<meta\\s+${attr}="${key}"[^>]*content=")[^"]*(")`),
                (_, prefix, suffix) => `${prefix}${TAGLINE}${suffix}`
              );
            let out = html;
            out = rewrite(out, 'name', 'description');
            out = rewrite(out, 'property', 'og:description');
            out = rewrite(out, 'name', 'twitter:description');
            return out;
          },
        },
      },
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Keep chunks small; landing has no router / no heavy deps.
      target: 'es2020',
      // Inline small assets into the HTML to avoid one extra request for
      // tiny resources. CSS is loaded as an external link (style.css is
      // bigger than 4KB), but a small logo / favicon etc. would inline.
      assetsInlineLimit: 4096,
    },
    server: {
      port: 8765,
      host: '127.0.0.1',
    },
  };
});
