import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useScrolled from '../hooks/useScrolled';
import useSmoothAnchorScroll from '../hooks/useSmoothAnchorScroll';
import { NAV_LINKS } from '../content/site';

/**
 * Nav — fixed header with brand mark + link row.
 *
 * On ≤720px the link row collapses behind a hamburger button. State is local
 * (`open`) and self-clears on: link click, Esc key, viewport widening past the
 * breakpoint, or route change. `aria-expanded` / `aria-controls` for AT.
 *
 * Anchor links (`#xxx`) behave differently depending on the current route:
 *   - On `/`               — native anchor scroll (CSS `scroll-behavior: smooth`
 *                            + useSmoothAnchorScroll's 60px offset).
 *   - On `/events` / `/recruit` — navigate to `/<hash>` instead, so the user
 *                            lands on the home page with the right section
 *                            scrolled into view (after React paints the section).
 *                            This keeps shareable URLs working AND keeps
 *                            intra-site nav from reloading the page.
 */
export default function Nav() {
  const scrolled = useScrolled(60);
  const navRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth-scroll delegation (works for both desktop link row and mobile panel).
  useSmoothAnchorScroll(navRef);

  // Auto-close when viewport widens past the breakpoint so we never land in
  // a state where the desktop link row stays hidden behind the panel.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('min-width: 721px');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
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

  // Close panel on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const closeMenu = useCallback(() => setOpen(false), []);

  /**
   * Click handler for anchor links (#xxx).
   * - On `/`: do nothing — browser native anchor + scroll-behavior:smooth.
   * - On sub-routes: navigate to `/<hash>` and scroll into the target after
   *   the next paint (50ms is plenty for React 18 to mount and measure).
   */
  const handleAnchorClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, hash: string) => {
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate('/' + hash);
        setTimeout(() => {
          const el = document.querySelector(hash);
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
    <header
      className={`nav${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}
      id="nav"
      ref={navRef}
    >
      <div className="container nav-inner">
        <a href="#top" className="brand" onClick={(e) => handleAnchorClick(e, '#top')}>
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
              onClick={(e) => handleAnchorClick(e, l.href)}
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
