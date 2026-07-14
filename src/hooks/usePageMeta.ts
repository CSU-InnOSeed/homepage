import { useEffect } from 'react';

export interface PageMetaInput {
  /** document.title for this route. */
  title: string;
  /** <meta name="description"> for crawlers / link previews. */
  description?: string;
  /**
   * Canonical URL. Can be:
   *   - An absolute URL (https://innoseed.club/foo) — used as-is.
   *   - A path-relative URL (/foo) — joined with window.location.origin.
   *   - Omitted entirely — defaults to window.location.origin + pathname.
   * Path-relative is the recommended form for SPA routes that should
   * canonicalize against whatever host the page is served from
   * (production Vercel, preview deployments, local dev all work).
   */
  canonical?: string;
  /** Set true on routes that shouldn't be indexed (e.g. /apply). */
  noindex?: boolean;
  /**
   * Optional overrides for the Open Graph tags. When omitted, the
   * hook falls back to the per-page title/description so crawlers
   * that ignore `<title>` (Facebook, LinkedIn, Slack previews) still
   * see useful copy.
   */
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
}

/**
 * Resolve a `canonical` value into an absolute URL string.
 * Internal helper exposed for testing.
 */
function resolveCanonical(canonical: string | undefined): string {
  if (typeof window === 'undefined') return canonical ?? '';
  if (!canonical) return window.location.origin + window.location.pathname;
  // Already absolute (has a scheme) — use as-is.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(canonical)) return canonical;
  // Path-relative — join with current origin.
  if (canonical.startsWith('/')) return window.location.origin + canonical;
  return window.location.origin + '/' + canonical;
}

/**
 * setMeta — single-DOM helper used by usePageMeta. Idempotent: if a
 * tag with the same `key` already exists, its content/attribute is
 * updated in place rather than appending a duplicate.
 *
 * Exported for the standalone static 404 page (public/404.html) which
 * doesn't go through React, but can include this logic via a tiny
 * inline script — see the noscript path below.
 */
export function setMeta(key: string, attr: 'name' | 'property', value: string, attrValue: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
  el.dataset['owner'] = attrValue;
}

export function setCanonical(href: string, owner: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  el.dataset['owner'] = owner;
}

/**
 * usePageMeta — per-route SEO/meta contract.
 *
 * Sets document.title, <meta name="description">, <link rel="canonical">,
 * <meta name="robots"> (when noindex), and the og:title/og:description/
 * og:url tags in one shot. On unmount the title is restored to the
 * value the page had before mount (so navigating between routes
 * doesn't leak the previous route's title onto the next page after
 * the SPA re-mounts).
 *
 * Why a hook instead of mutating document.title in each page:
 *   - One source of truth for the meta shape → easy to extend
 *     (e.g. JSON-LD, breadcrumb schema, hreflang).
 *   - Page components stay focused on rendering; SEO is a side
 *     concern that's hard to forget because the hook is the only
 *     public entry.
 *   - Restoration on unmount keeps tab-strip history honest during
 *     back/forward navigation.
 *
 * What this hook does NOT do:
 *   - It does not write the static og: tags set in index.html
 *     (og:type / og:site_name / og:image / og:locale) — those are
 *     site-wide constants baked into the initial HTML and are valid
 *     for every route. Only the *per-route* tags are managed here.
 */
export default function usePageMeta(meta: PageMetaInput): void {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const prevTitle = document.title;

    document.title = meta.title;

    if (meta.description) {
      setMeta('description', 'name', meta.description, meta.title);
    }

    if (meta.canonical !== undefined || true) {
      // Always set canonical on every route. Pass-through lets a
      // noindex page still declare a canonical so crawlers know what
      // the URL *would* be (the master copy) — though they'll
      // respect the noindex meta and not index it.
      setCanonical(resolveCanonical(meta.canonical), meta.title);
    }

    if (meta.noindex) {
      setMeta('robots', 'name', 'noindex', meta.title);
    } else {
      // Indexable route → make sure no leftover noindex from a
      // previous mount (e.g. user visited /apply then navigated to /)
      // is still in the head. We don't *add* an index robots meta —
      // crawlers default to index,follow — but if one was previously
      // injected we reset it to the default.
      const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (existing && existing.content.startsWith('noindex')) {
        existing.content = 'index,follow';
      }
    }

    // Open Graph — optional overrides, fallback to title/description
    // (and the canonical we just resolved) so the og:url is always
    // absolute and matches the link rel="canonical" href exactly.
    const ogTitle = meta.ogTitle ?? meta.title;
    const ogDescription = meta.ogDescription ?? meta.description ?? '';
    const ogUrl = meta.ogUrl ?? resolveCanonical(meta.canonical);
    if (ogTitle) setMeta('og:title', 'property', ogTitle, meta.title);
    if (ogDescription) setMeta('og:description', 'property', ogDescription, meta.title);
    if (ogUrl) setMeta('og:url', 'property', ogUrl, meta.title);

    return () => {
      document.title = prevTitle;
    };
  }, [
    meta.title,
    meta.description,
    meta.canonical,
    meta.noindex,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogUrl,
  ]);
}