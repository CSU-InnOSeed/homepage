import { useState, useRef, useEffect, useCallback } from 'react';
import useScrolled from '../hooks/useScrolled.js';
import useSmoothAnchorScroll from '../hooks/useSmoothAnchorScroll.js';

const NAV_LINKS = [
  { href: '#manifesto', label: '关于' },
  { href: '#pillars', label: '方向' },
  { href: '#numbers', label: '成果' },
  { href: '#members', label: '代表' },
  { href: 'https://innoseed.club/events', label: '活动', external: true },
  { href: 'https://innoseed.club/recruit', label: '招新', external: true },
];

/**
 * Nav — fixed header with brand mark + link row.
 *
 * On ≤720px the link row collapses behind a hamburger button. State is local
 * (`open`) and self-clears on: link click, Esc key, viewport widening past the
 * breakpoint, or route change. `aria-expanded` / `aria-controls` for AT.
 */
export default function Nav() {
  const scrolled = useScrolled(60);
  const navRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Smooth-scroll delegation (works for both desktop link row and mobile panel).
  useSmoothAnchorScroll(navRef);

  // Auto-close when viewport widens past the breakpoint so we never land in
  // a state where the desktop link row stays hidden behind the panel.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 721px)');
    const onChange = (e) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll while panel is open — prevents the page from scrolling
  // behind a translucent overlay.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <header
      className={`nav${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}
      id="nav"
      ref={navRef}
    >
      <div className="container nav-inner">
        <a href="#top" className="brand" onClick={closeMenu}>
          <span className="brand-mark">
            <img src="/imgs/favicon.png" alt="InnOSeed" />
          </span>
          <span>
            <div>InnOSeed</div>
            <div className="brand-sub">CSU · 中南大学</div>
          </span>
        </a>

        <nav
          id="nav-links"
          className="nav-links"
          aria-hidden={open ? 'false' : undefined}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              {...(l.external ? { target: '_blank', rel: 'noopener' } : {})}
            >
              {l.label}
            </a>
          ))}
        </nav>

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
      </div>
    </header>
  );
}
