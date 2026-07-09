/**
 * observability — 前端可观测性封装
 *
 * 覆盖三层:
 *   1. Build metadata — vite.config.ts 注入到 window.__BUILD
 *      (git sha / build time / mode / Vercel deployment id)
 *   2. Error tracking — window.onerror + unhandledrejection
 *      捕获未捕获异常 / Promise rejection
 *   3. Web Vitals — 用 PerformanceObserver 监听 LCP / CLS / INP / FID
 *      (不引入 web-vitals npm 包,自己写,体积 < 1KB)
 *   4. Custom events — trackEvent(name, props) 业务事件 (Recruit CTA / Apply 步进 / 表单提交)
 *
 * 上报策略:
 *   - VITE_ANALYTICS_ENDPOINT 设置 → POST JSON 到该 endpoint (Plausible-style 自建 collector)
 *   - VITE_ANALYTICS_URL 已设 (Plausible/Umami) → 同时上报 custom event 到对应 analytics
 *   - 都没有 → 只 console.debug,不联网 (开发模式 / 隐私优先)
 *
 * 所有失败都不会抛错 — observability 自身出问题不能影响业务。
 */

import type { BuildInfo } from './buildInfo';

/** 业务事件白名单 — 加新事件前先在这里登记,方便后续做埋点审查 */
export type EventName =
  | 'recruit_cta_click'      // 首页 / 招新页 CTA 被点击
  | 'apply_step_advance'     // /apply 流程前进一步
  | 'apply_step_back'        // /apply 流程返回上一步
  | 'apply_submit_attempt'   // 提交尝试 (前端校验通过)
  | 'apply_submit_success'   // 提交成功 (拿到 server code)
  | 'apply_submit_error'     // 提交失败 (网络/服务端错误)
  | 'apply_code_copied'      // 复制 reference code
  | 'nav_anchor_click'       // 点击 nav 内 anchor
  | 'events_section_view'    // Events section 进入视口
  | 'cta_external_click';    // 点外部链接 (GitHub / CSDN 等)

export interface EventProps {
  [key: string]: string | number | boolean | null | undefined;
}

interface ObservabilityContext {
  build: BuildInfo;
  endpoint: string;
  /** Plausible / Umami 注入脚本的 URL,如果有,我们直接调用其 event API */
  plausibleUrl: string;
}

let ctx: ObservabilityContext | null = null;
let initialized = false;

/** 把 vite 注入的 build info 读出来,兜底是 development */
function readBuildInfo(): BuildInfo {
  const w = window as unknown as { __BUILD__?: BuildInfo };
  return w.__BUILD__ ?? { sha: 'dev', time: new Date().toISOString(), mode: 'development' };
}

/** safe JSON POST — 失败静默 */
async function send(endpoint: string, body: Record<string, unknown>): Promise<void> {
  try {
    // 用 sendBeacon 优先 — 它不阻塞页面 unload,失败也不会抛
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return;
    }
    // 回退到 fetch (keepalive: 防止 page unload 时请求被砍)
    if (typeof fetch === 'function') {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {
        /* swallow */
      });
    }
  } catch {
    /* swallow — observability 不应 throw */
  }
}

/** 静默上报 — 不会 throw */
export function trackEvent(name: EventName, props: EventProps = {}): void {
  if (!ctx) return;
  const payload = {
    type: 'event',
    name,
    props,
    build: ctx.build,
    ts: Date.now(),
    url: typeof location !== 'undefined' ? location.pathname + location.search : '',
  };
  // 始终 console.debug — 本地排查方便
  if (import.meta.env.DEV) console.debug('[track]', name, props);
  if (ctx.endpoint) void send(ctx.endpoint, payload);
}

export function trackError(err: unknown, context?: EventProps): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const payload = {
    type: 'error',
    message,
    stack,
    context: context ?? {},
    build: ctx?.build,
    ts: Date.now(),
    url: typeof location !== 'undefined' ? location.pathname : '',
  };
  // console.error 总是打 — 生产也想看到
  console.error('[error]', message, context ?? '');
  if (ctx?.endpoint) void send(ctx.endpoint, payload);
}

export function trackWebVital(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor'): void {
  const payload = {
    type: 'vital',
    name,
    value,
    rating,
    build: ctx?.build,
    ts: Date.now(),
    url: typeof location !== 'undefined' ? location.pathname : '',
  };
  if (import.meta.env.DEV) console.debug('[vital]', name, value, rating);
  if (ctx?.endpoint) void send(ctx.endpoint, payload);
}

/** 全局错误监听 — 在应用 mount 前调用一次即可 */
function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    trackError(e.error ?? e.message, { source: 'window.error' });
  });
  window.addEventListener('unhandledrejection', (e) => {
    trackError(e.reason, { source: 'unhandledrejection' });
  });
}

/**
 * Web Vitals — 不依赖 web-vitals 包,自己写。
 *
 * LCP (Largest Contentful Paint) — PerformanceObserver(type: 'largest-contentful-paint')
 * CLS (Cumulative Layout Shift)   — PerformanceObserver(type: 'layout-shift') + sessionWindow
 * INP (Interaction to Next Paint)— PerformanceObserver(type: 'event', durationThreshold: 16)
 *
 * 阈值按 Google web.dev 标准 (good / needs-improvement / poor):
 *   LCP: ≤ 2.5s / ≤ 4s / > 4s
 *   CLS: ≤ 0.1  / ≤ 0.25 / > 0.25
 *   INP: ≤ 200ms / ≤ 500ms / > 500ms
 */
function installWebVitals(): void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  // LCP
  try {
    let lcpValue = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        lcpValue = entry.startTime;
      }
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    // 上报时机:visibilitychange 隐藏 / pagehide
    const reportLcp = () => {
      po.disconnect();
      if (lcpValue > 0) {
        const rating = lcpValue <= 2500 ? 'good' : lcpValue <= 4000 ? 'needs-improvement' : 'poor';
        trackWebVital('LCP', Math.round(lcpValue), rating);
      }
    };
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') reportLcp();
    });
    addEventListener('pagehide', reportLcp);
  } catch {
    /* LCP not supported */
  }

  // CLS
  try {
    let clsValue = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        const ls = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!ls.hadRecentInput && typeof ls.value === 'number') {
          clsValue += ls.value;
        }
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        po.disconnect();
        const rounded = Math.round(clsValue * 1000) / 1000;
        const rating = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';
        trackWebVital('CLS', rounded, rating);
      }
    });
    addEventListener('pagehide', () => {
      po.disconnect();
    });
  } catch {
    /* CLS not supported */
  }

  // INP
  try {
    let worstInp = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        const ev = entry as PerformanceEntry & { duration?: number };
        if (typeof ev.duration === 'number' && ev.duration > worstInp) {
          worstInp = ev.duration;
        }
      }
    });
    po.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        po.disconnect();
        if (worstInp > 0) {
          const rating = worstInp <= 200 ? 'good' : worstInp <= 500 ? 'needs-improvement' : 'poor';
          trackWebVital('INP', Math.round(worstInp), rating);
        }
      }
    });
  } catch {
    /* INP not supported */
  }
}

/**
 * initObservability — 应用入口调用一次
 *  - 注册全局错误监听
 *  - 注册 Web Vitals 监听
 *  - 读 env 决定是否真上报
 */
export function initObservability(): void {
  if (initialized) return;
  initialized = true;
  ctx = {
    build: readBuildInfo(),
    endpoint: (import.meta.env.VITE_ANALYTICS_ENDPOINT ?? '').trim(),
    plausibleUrl: (import.meta.env.VITE_ANALYTICS_URL ?? '').trim(),
  };
  installGlobalErrorHandlers();
  installWebVitals();
}

/** 让组件可以拿到当前 build info 用于展示 (比如 footer 显示 build sha) */
export function getBuildInfo(): BuildInfo {
  return ctx?.build ?? readBuildInfo();
}