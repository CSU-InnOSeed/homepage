import { useEffect } from 'react';

/**
 * useSmoothAnchorScroll — intercept clicks on <a href="#…"> and scroll smoothly
 * with a 60px top offset so the section clears the fixed nav.
 *
 * Attaches a delegated listener on `containerRef` (defaults to document).
 * Skips links that:
 *   - have no/empty hash
 *   - are external (target=_blank etc.)
 *   - are modified (cmd/ctrl/middle-click) — let the browser handle them.
 */
export default function useSmoothAnchorScroll(containerRef = { current: document }) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // not a primary click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: y, behavior: 'smooth' });
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [containerRef]);
}
