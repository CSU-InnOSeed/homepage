import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import useScrolled from '../hooks/useScrolled';

/**
 * Mini Camp nav items — the main site nav now exists primarily as a
 * Mini Camp jump board (sidebar on the left). Each link points to the
 * dedicated `minicamp.innoseed.club` subdomain so visitors land directly
 * on the activity surface instead of the lab overview.
 *
 * Kept here (not in `content/site.ts`) because the sidebar's mini-camp
 * focus is a deliberate departure from NAV_LINKS, which still feeds
 * the Footer nav block (see FOOTER.navLinks).
 */
const MINICAMP_NAV_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: 'https://minicamp.innoseed.club/', label: 'Mini Camp 主页' },
  { href: 'https://minicamp.innoseed.club/#minicamp-story', label: '故事' },
  { href: 'https://minicamp.innoseed.club/#minicamp-tracks', label: '四路分头' },
  { href: 'https://minicamp.innoseed.club/#minicamp-recap', label: '上届现场' },
  { href: '/apply', label: '报名申请' },
];

/**
 * Nav — sidebar fixed to the left edge of the viewport.
 *
 * Layout change vs v4 (Aug 2025): the top horizontal nav was repurposed
 * as a vertical sidebar so the existing site structure ("关于 / 方向 /
 * 成果 / 代表 / 活动 / 招新" anchor links) becomes a Mini Camp jump
 * board — every entry points visitors at minicamp.innoseed.club,
 * where the standalone activity page lives.
 *
 * Desktop (≥721px): sidebar pinned left, full-height column.
 * Mobile (≤720px): the sidebar collapses behind a hamburger that opens
 * a slide-down panel — same UX as the previous top nav.
 *
 * `useSmoothAnchorScroll` is intentionally NOT wired up here: every
 * link is an absolute URL to another origin (or a /apply route), so
 * the in-page scroll interception is a no-op.
 */
export default function Nav() {
  const [scrolled, scrollSentinelRef] = useScrolled(60);
  const navRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Mark <html> with `has-sidebar` for as long as this component is
  // mounted — globals.css uses that class to apply the 240px left
  // offset to <body> on desktop. When Nav unmounts (e.g. /apply route,
  // or /minicamp served from minicamp.innoseed.club which uses the
  // SubdomainHeader instead), the class is removed and the layout
  // returns to full-width. This means routes that don't render Nav
  // don't have to opt out of the sidebar — they just don't get the
  // class in the first place.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.documentElement.classList.add('has-sidebar');
    return () => {
      document.documentElement.classList.remove('has-sidebar');
    };
  }, []);

  // Auto-close when viewport widens past the breakpoint so we never land in
  // a state where the desktop sidebar stays hidden behind the mobile panel.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 721px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Esc closes the mobile panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll while the mobile panel is open.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close mobile panel on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const closeMenu = useCallback(() => setOpen(false), []);

  const handleLinkClick = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  return (
    <>
      <div
        ref={scrollSentinelRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      />
      <header
        className={`nav nav-sidebar${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}
        id="nav"
        ref={navRef}
      >
        <div className="container nav-inner">
          <a href="https://minicamp.innoseed.club/" className="brand">
            <span className="brand-mark">
              <img src="/imgs/favicon.png" alt="InnOSeed" />
            </span>
            <span>
              <div>InnOSeed</div>
              <div className="brand-sub">CSU · 中南大学</div>
            </span>
          </a>

          <span className="nav-sidebar-eyebrow" aria-hidden="true">
            Mini Camp
          </span>

          <nav
            id="nav-links"
            className="nav-links"
            aria-label="Mini Camp 跳转"
            aria-hidden={open ? false : undefined}
          >
            {MINICAMP_NAV_LINKS.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                onClick={handleLinkClick}
                {...(l.external || l.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}
              >
                {l.label}
                {l.href.startsWith('http') && (
                  <span className="arrow" aria-hidden="true">↗</span>
                )}
              </a>
            ))}
          </nav>

          <a
            className="nav-sidebar-cta"
            href="/apply"
            onClick={handleLinkClick}
          >
            <span>报名申请</span>
            <span className="arrow" aria-hidden="true">→</span>
          </a>
        </div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </header>
    </>
  );
}
