import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for InnOSeed landing.
 * Output is plain static assets (dist/) — Vercel serves them as-is.
 *
 * Analytics injection (Plausible-shaped, Umami-compatible):
 *   - Set VITE_ANALYTICS_URL=https://plausible.io/js/script.js at build time
 *     and a 1x1 analytics script gets injected into <head> of the prod HTML.
 *   - Set VITE_ANALYTICS_DOMAIN if you want to override the default
 *     `data-domain` (defaults to the project's current Vercel URL).
 *   - Local `pnpm dev` never loads the script — only `pnpm build` does.
 *   - Unset → zero bytes shipped. Nothing happens at runtime.
 */
export default defineConfig(({ mode }) => {
  // loadEnv('', process.cwd(), '') so we can read both VITE_* and non-prefixed.
  const env = loadEnv(mode, process.cwd(), '');
  const analyticsUrl = (env.VITE_ANALYTICS_URL || '').trim();
  const analyticsDomain = (
    env.VITE_ANALYTICS_DOMAIN
    || env.VERCEL_PROJECT_PRODUCTION_URL
    || 'innoseed-landing.vercel.app'
  ).trim();

  return {
    plugins: [
      react(),
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
