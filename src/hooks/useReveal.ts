import { useEffect } from 'react';

/**
 * useReveal — drives the .reveal / .in scroll-in animation.
 *
 * Mounts an IntersectionObserver on the ref. When the element crosses the
 * threshold, .in is added so the CSS transition fires; then we unobserve.
 * Falls back to immediate .in on browsers without IntersectionObserver
 * (and respects prefers-reduced-motion via the CSS rule).
 *
 * @param {React.RefObject} ref — attach to the element you want to reveal.
 * @param {object} [opts]
 * @param {number} [opts.threshold=0.15]
 * @param {string} [opts.rootMargin='0px 0px -60px 0px']
 */
export default function useReveal(ref, opts = {}) {
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
