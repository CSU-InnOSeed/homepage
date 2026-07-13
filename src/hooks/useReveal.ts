import { useEffect, type RefObject } from 'react';
import { observe } from '../lib/intersectionController';

export interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * useReveal — drives the .reveal / .in scroll-in animation.
 *
 * Delegates to a module-level IntersectionObserver (see
 * `lib/intersectionController.ts`) so the page runs a single shared
 * observer for every reveal target instead of one per component.
 *
 * When the element crosses the threshold, .in is added so the CSS
 * transition fires; then we unobserve. Falls back to immediate .in
 * on browsers without IntersectionObserver (and respects
 * prefers-reduced-motion via the CSS rule).
 */
export default function useReveal(
  ref: RefObject<Element | null>,
  opts: RevealOptions = {}
): void {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // The shared controller uses page-wide defaults (threshold 0.15 /
    // rootMargin 0 0 -60px 0) for the common case. If a caller passes
    // custom opts that diverge, fall back to a one-shot local observer
    // so we don't break the existing API.
    if (threshold !== 0.15 || rootMargin !== '0px 0px -60px 0px') {
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
    }
    const teardown = observe('reveal', el, (entry) => {
      entry.target.classList.add('in');
    });
    return teardown;
  }, [ref, threshold, rootMargin]);
}
