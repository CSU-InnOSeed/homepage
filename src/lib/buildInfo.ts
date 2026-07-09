/**
 * BuildInfo — 编译期元信息
 *
 * 由 vite.config.ts 的 inject-build-info 插件写到 window.__BUILD__,
 * runtime 通过 getBuildInfo() / observability 读取。
 *
 * 为什么放独立文件:observability.ts 和其他模块都可能用到,
 * 单文件避免循环依赖;同时让 BuildInfo 类型可以被非组件代码消费。
 */

export interface BuildInfo {
  /** git commit SHA (短 7 位) */
  sha: string;
  /** ISO-8601 build time */
  time: string;
  /** 'production' | 'development' | 'preview' (Vercel preview deployments) */
  mode: string;
  /** Vercel 部署 ID,preview 部署尤其有用 (--prod 才有) */
  deploymentId?: string;
  /** 当前 production URL,Vercel 自动注入 VERCEL_PROJECT_PRODUCTION_URL */
  url?: string;
}

/** window 全局声明 (供 TS 严格模式) */
declare global {
  interface Window {
    __BUILD__?: BuildInfo;
  }
}

export {};