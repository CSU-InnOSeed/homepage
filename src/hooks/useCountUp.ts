import { useEffect, type RefObject } from 'react';

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

export interface CountUpConfig {
  /** Final integer value. */
  target: number;
  /** e.g. '+'. */
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
 */
export default function useCountUp(
  ref: RefObject<HTMLElement | null>,
  { target, suffix = '', duration = 2200, threshold = 0.4 }: CountUpConfig
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
        el.textContent = `${v}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = `${target}${suffix}`;
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
  }, [ref, target, suffix, duration, threshold]);
}
