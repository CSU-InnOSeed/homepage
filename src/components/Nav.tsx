import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useScrolled from '../hooks/useScrolled';
import useSmoothAnchorScroll from '../hooks/useSmoothAnchorScroll';

/**
 * Sidebar pills — the main-site nav was redesigned (Aug 2025) into a
 * two-part layout:
 *
 *   1. Top horizontal bar  — brand mark + ONE Mini Camp entry (the
 *                            single jumping-off point to the activity
 *                            site).
 *   2. Right floating sidebar — a stack of pill-style quick-links into
 *                                 the main-site sections (关于 / 方向 /
 *                                 成果 / 代表 / 活动 / 招新). Each pill
 *                                 is a horizontal rounded rectangle
 *                                 that smooth-scrolls to its anchor on
 *                                 the current page.
 *
 * The pill IDs mirror the `<section id=...>` anchors in App.tsx so each
 * pill is a one-click scroll. One pill is highlighted (方向) as a
 * visual default — IntersectionObserver wiring for a true active
 * state is a future tweak.
 *
 * Mobile (≤720px): the sidebar disappears and the top bar collapses
 * the single Mini Camp entry behind a hamburger panel.
 */
const SIDEBAR_PILLS: { href: string; label: string; key: string }[] = [
  { key: 'manifesto', href: '#manifesto', label: '关于' },
  { key: 'pillars',   href: '#pillars',   label: '方向' },
  { key: 'numbers',   href: '#numbers',   label: '成果' },
  { key: 'members',   href: '#members',   label: '代表' },
  { key: 'events',    href: '#events',    label: '活动' },
  { key: 'recruit',   href: '#recruit',   label: '招新' },
];

export default function Nav() {
  const [scrolled, scrollSentinelRef] = useScrolled(60);
  const [open, setOpen] = useState(false);
  // The sidebar pill that's currently highlighted brand-blue. Driven
  // by which section the user is scrolled into — see the scroll
  // listener below. Starts empty so the user sees no highlight while
  // they're still in the hero.
  const [activeSection, setActiveSection] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth-scroll delegation. The hook listens on the document so it
  // catches anchor clicks from BOTH the top bar (brand → #top) and
  // the sidebar pills (→ #manifesto / #pillars / etc.). The 60px
  // offset built into the hook keeps each section clear of the
  // fixed top bar.
  useSmoothAnchorScroll();

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

  // Scroll-driven pill highlight. On every scroll (throttled to
  // requestAnimationFrame) we walk the section list in document order
  // and pick the last section whose top has scrolled above a trigger
  // line ~120px below the viewport top. That section is what the user
  // is currently reading, so its pill gets the blue highlight.
  // Sections above the trigger line are skipped (they're done with);
  // sections below haven't reached the user yet.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const triggerY = 120;
    const updateActive = () => {
      let active = '';
      for (const p of SIDEBAR_PILLS) {
        const el = document.getElementById(p.key);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY) active = p.key;
        else break; // sections are in document order — once one
                    // is below the trigger, every later one is too.
      }
      setActiveSection(active);
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateActive();
      });
    };
    updateActive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

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

      {/* ── Sidebar (pill-style main-site section quick-nav) ── */}
      <aside className="nav-sidebar" aria-label="主站章节跳转">
        <nav className="nav-sidebar-pills">
          {SIDEBAR_PILLS.map((p) => {
            const isActive = p.key === activeSection;
            return (
              <a
                key={p.key}
                href={p.href}
                className={`pill${isActive ? ' pill-active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span>{p.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
