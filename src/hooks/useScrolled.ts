import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * useScrolled — true once the user has scrolled past `threshold` px.
 *
 * Uses IntersectionObserver: caller renders a 1px sentinel div (use the
 * returned `sentinelRef`), the hook watches it with `rootMargin` shrunk
 * from the top by `threshold` pixels. When the sentinel crosses that
 * virtual line going up (the user scrolls past it), isIntersecting
 * flips to false and `scrolled` becomes true. No scroll listener.
 *
 * Why IO instead of a scroll handler:
 *   - A scroll handler fires on every wheel tick; IO fires once per
 *     threshold crossing. For a sticky-nav toggle that's the only
 *     state change we actually care about, the handler was ~99 % of
 *     its work wasted.
 *   - IO is composable with any other observer in the page (we already
 *     have several) — it's the right primitive for "did this element
 *     cross this line".
 *
 * Caller responsibility:
 *   - Render the sentinel in the document flow at a position such
 *     that "sentinel crossed out the top" maps to "user scrolled
 *     past threshold". Easiest placement: a 1px div with `position:
 *     absolute; top: 0; left: 0; right: 0; pointer-events: none`
 *     right after the fixed nav header.
 *   - Mark the sentinel aria-hidden (pure layout device, no semantic
 *     meaning).
 *
 * The hook also handles SSR / no-IO environments by falling back to
 * a passive scroll listener so the feature still works on ancient
 * browsers (we drop coverage, not correctness).
 *
 * Return shape mirrors `useState`: a `[scrolled, sentinelRef]` tuple
 * so the caller can destructure both in one line.
 */
export default function useScrolled(
  threshold = 60
): readonly [boolean, RefObject<HTMLDivElement>] {
  const [scrolled, setScrolled] = useState(false);
  // useRef<T>(null!) makes TS infer RefObject<T> (not RefObject<T | null>),
  // which is what <div ref={…}> expects in React 18's types.
  const sentinelRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      // No IO available — degrade to the old scroll listener. We still
      // get the right answer; we just lose the perf win.
      const onScroll = () => setScrolled(window.scrollY > threshold);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    // Shrink the IO root's top by `threshold` px so the "is intersecting"
    // band sits below the nav. When the sentinel crosses that band going
    // up, we flip to scrolled.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setScrolled(!entry.isIntersecting);
        }
      },
      { rootMargin: `-${threshold}px 0px 0px 0px`, threshold: [0, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [scrolled, sentinelRef] as const;
}