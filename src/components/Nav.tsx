import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useScrolled from '../hooks/useScrolled';
import useSmoothAnchorScroll from '../hooks/useSmoothAnchorScroll';

/**
 * Mini Camp sidebar pills — the main site nav was redesigned (Aug 2025)
 * into a two-part layout:
 *
 *   1. Top horizontal bar  — brand mark + ONE Mini Camp entry (the
 *                            single jumping-off point to the activity
 *                            site).
 *   2. Left vertical sidebar — a stack of pill-style quick-links into
 *                              specific Mini Camp sections (主页 /
 *                              故事 / 四路 / 现场). Each pill is a
 *                              horizontal rounded rectangle; one is
 *                              highlighted as the "current" entry.
 *
 * The 4 pills mirror the main directions visitors care about — they
 * match the section ids on minicamp.innoseed.club so each pill is a
 * one-click jump to that anchor on the activity site.
 *
 * Mobile (≤720px): the sidebar disappears and the top bar collapses
 * the single Mini Camp entry behind a hamburger panel — same UX as
 * the previous v4 nav.
 */
const SIDEBAR_PILLS: { href: string; label: string; key: string }[] = [
  { key: 'home',   href: 'https://minicamp.innoseed.club/',                 label: '主页' },
  { key: 'story',  href: 'https://minicamp.innoseed.club/#minicamp-story',   label: '故事' },
  { key: 'tracks', href: 'https://minicamp.innoseed.club/#minicamp-tracks',  label: '四路' },
  { key: 'recap',  href: 'https://minicamp.innoseed.club/#minicamp-recap',   label: '现场' },
];

export default function Nav() {
  const [scrolled, scrollSentinelRef] = useScrolled(60);
  const navRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth-scroll delegation for the brand "回到顶部" anchor link in
  // the top bar. (The sidebar pills are all absolute URLs, so they
  // don't need scroll interception.)
  useSmoothAnchorScroll(navRef);

  // Mark <html> with `has-sidebar` for as long as this component is
  // mounted — globals.css uses that class to apply the sidebar-aware
  // body offset (top + left padding) on desktop. When Nav unmounts
  // (e.g. /apply route, or /minicamp served from minicamp.innoseed.club
  // which uses SubdomainHeader instead), the class is removed and the
  // layout returns to full-width.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.documentElement.classList.add('has-sidebar');
    return () => {
      document.documentElement.classList.remove('has-sidebar');
    };
  }, []);

  // Auto-close when viewport widens past the breakpoint so we never
  // land in a state where the desktop top bar is hidden behind the
  // mobile panel.
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

  /**
   * Click handler for the brand "回到顶部" anchor (#top). On any route
   * other than `/`, navigate home first then scroll to the anchor.
   */
  const handleBrandClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector('#top');
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 60;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 60);
      }
      closeMenu();
    },
    [location.pathname, navigate, closeMenu]
  );

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

      {/* ── Top horizontal bar (brand + the ONE Mini Camp entry) ── */}
      <header
        className={`nav-top${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}
        id="nav"
        ref={navRef}
      >
        <div className="container nav-top-inner">
          <a
            href="#top"
            className="brand"
            onClick={handleBrandClick}
            aria-label="InnOSeed · 回到顶部"
          >
            <span className="brand-mark">
              <img src="/imgs/favicon.png" alt="InnOSeed" />
            </span>
            <span>
              <div>InnOSeed</div>
              <div className="brand-sub">CSU · 中南大学</div>
            </span>
          </a>

          {/* The single Mini Camp entry — clicking this jumps visitors
              straight to the activity site. On desktop the full label
              + arrow are visible; on mobile it collapses behind the
              hamburger and the panel shows it as the only link. */}
          <a
            href="https://minicamp.innoseed.club/"
            className="nav-top-minicamp-entry"
            target="_blank"
            rel="noopener"
            onClick={closeMenu}
          >
            <span>Mini Camp</span>
            <span className="arrow" aria-hidden="true">↗</span>
          </a>

          <button
            type="button"
            className="nav-toggle"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            aria-controls="nav-minicamp-panel"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>

        {/* Mobile panel — only shows when ≤720px AND open. The single
            Mini Camp entry is duplicated here so the hamburger pattern
            stays consistent with the previous v4 nav. */}
        <div
          id="nav-minicamp-panel"
          className="nav-minicamp-panel"
          aria-hidden={!open}
        >
          <a
            href="https://minicamp.innoseed.club/"
            className="nav-minicamp-panel-link"
            target="_blank"
            rel="noopener"
            onClick={closeMenu}
          >
            <span>Mini Camp</span>
            <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      {/* ── Sidebar (pill-style Mini Camp quick-nav) ── */}
      <aside className="nav-sidebar" aria-label="Mini Camp 跳转">
        <span className="nav-sidebar-eyebrow" aria-hidden="true">
          Mini Camp
        </span>
        <nav className="nav-sidebar-pills">
          {SIDEBAR_PILLS.map((p, i) => (
            <a
              key={p.key}
              href={p.href}
              target="_blank"
              rel="noopener"
              className={`pill${i === 1 ? ' pill-active' : ''}`}
              aria-current={i === 1 ? 'true' : undefined}
            >
              <span>{p.label}</span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
