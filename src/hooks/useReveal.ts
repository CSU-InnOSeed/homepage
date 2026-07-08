import { useEffect, type RefObject } from 'react';

export interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * useReveal — drives the .reveal / .in scroll-in animation.
 *
 * Mounts an IntersectionObserver on the ref. When the element crosses the
 * threshold, .in is added so the CSS transition fires; then we unobserve.
 * Falls back to immediate .in on browsers without IntersectionObserver
 * (and respects prefers-reduced-motion via the CSS rule).
 */
export default function useReveal(
  ref: RefObject<Element | null>,
  opts: RevealOptions = {}
): void {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin]);
}
