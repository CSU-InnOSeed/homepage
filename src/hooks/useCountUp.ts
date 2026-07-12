import { useEffect, type RefObject } from 'react';

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

export interface CountUpConfig {
  /** Final integer value. */
  target: number;
  /**
   * Visual suffix appended to the final value (e.g. '+'). Rendered as a
   * separate DOM element by the caller (see Numbers.tsx → .num-suffix),
   * so this hook no longer writes the suffix into the counter element —
   * doing so would double-print it during the animation. Kept on the
   * config so the public API doesn't change for callers that still
   * inline the suffix.
   */
  suffix?: string;
  /** ms. */
  duration?: number;
  threshold?: number;
}

/**
 * useCountUp — count from 0 to a target value with an ease-out curve.
 *
 * Animates textContent on the ref'd element using requestAnimationFrame.
 * Fires once when the element enters the viewport, then disconnects.
 *
 * The suffix is intentionally NOT written into the counter element; the
 * caller is expected to render it as a sibling <span class="num-suffix">.
 * (See Numbers.tsx for the layout.)
 */
export default function useCountUp(
  ref: RefObject<HTMLElement | null>,
  { target, duration = 2200, threshold = 0.4 }: CountUpConfig
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const animate = () => {
      el.textContent = '0';
      const startTs = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - startTs) / duration, 1);
        const v = Math.round(target * easeOutQuart(t));
        el.textContent = String(v);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = String(target);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === 'undefined') {
      animate();
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate();
            io.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, target, duration, threshold]);
}
