import { useEffect, type RefObject } from 'react';

/**
 * useHeroSweep — drive a vertical "light bar" that follows the cursor
 * inside an element. Writes the cursor's local Y position (relative to
 * the element's bounding rect) to a `--sweep-y` CSS variable on the
 * element; the companion CSS in globals.css uses that variable to
 * split a two-color `background-image` on the element into top/bottom
 * halves (see the `.hero h1.hero-headline` rule under
 * `@media (hover: hover) and (pointer: fine)`).
 *
 * Implementation notes:
 *   - rAF-throttled mousemove so we never write to the DOM faster than
 *     the browser can paint.
 *   - Listeners are attached to `window`, not the element itself, so a
 *     sibling element scrolling under the cursor doesn't drop the move
 *     event.
 *   - On `mouseleave` (over `window` — i.e. cursor left the page) we
 *     snap `--sweep-y` back to `0` so the headline settles to its
 *     default single-color state. We don't reset on every in-page move
 *     because the cursor naturally traverses the element.
 *   - Disabled entirely on coarse pointers (touch devices) and when
 *     `prefers-reduced-motion: reduce` is set. The hook returns nothing
 *     in those cases; the headline falls back to its static colors.
 */
export default function useHeroSweep<T extends HTMLElement>(
  ref: RefObject<T>
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof window === 'undefined') return undefined;
    const finePointer = window
      .matchMedia('(hover: hover) and (pointer: fine)')
      .matches;
    if (!finePointer) return undefined;
    const reduceMotion = window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .matches;
    if (reduceMotion) return undefined;

    let rafId = 0;
    let pendingY: number | null = null;

    const flush = () => {
      rafId = 0;
      if (pendingY === null) return;
      el.style.setProperty('--sweep-y', `${pendingY}px`);
      pendingY = null;
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top;
      // Clamp so the gradient still resolves when the cursor is just
      // above or just below the element (still in viewport but outside
      // the h1 box). Otherwise the gradient would render with a "void"
      // in the middle on the very first frame.
      const clamped = Math.max(0, Math.min(rect.height, y));
      pendingY = clamped;
      if (rafId === 0) rafId = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      pendingY = 0;
      if (rafId === 0) rafId = requestAnimationFrame(flush);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      if (rafId !== 0) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      // Reset so HMR / route changes don't leave a stale sweep line.
      el.style.removeProperty('--sweep-y');
    };
  }, [ref]);
}
