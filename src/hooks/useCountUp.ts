import { useEffect, type RefObject } from 'react';
import { observe } from '../lib/intersectionController';

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
 * Delegates to a module-level IntersectionObserver
 * (see `lib/intersectionController.ts`) so the page runs a single
 * shared observer for all count-up targets. When a custom threshold
 * is passed, a one-shot local observer is created instead — the
 * shared controller only owns the common (0.4) threshold variant.
 *
 * The suffix is intentionally NOT written into the counter element; the
 * caller is expected to render it as a sibling <span class="num-suffix">.
 * (See Numbers.tsx for the layout.)
 *
 * Honors `prefers-reduced-motion: reduce` — if the user (or OS) has
 * asked for reduced motion, the counter skips the rAF tween and writes
 * the final value directly. A `change` listener on the same media
 * query lets us react if the user toggles the system setting while
 * the page is open (the count hasn't started yet → write final value
 * and stop; or already tweening → snap to final).
 */
export default function useCountUp(
  ref: RefObject<HTMLElement | null>,
  { target, duration = 2200, threshold = 0.4 }: CountUpConfig
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Reduced-motion short-circuit. Also subscribe to `change` so
    // users who flip the OS setting while the page is open see the
    // final value without a 2.2-second tween.
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const writeFinal = () => {
        el.textContent = String(target);
      };
      if (mq.matches) {
        writeFinal();
        // Even when reduced-motion is on at mount, listen for changes
        // — if the user disables it, the next IO hit should run the
        // tween, so we just ensure the element holds the final value
        // until that fires.
        mq.addEventListener('change', writeFinal);
        return () => mq.removeEventListener('change', writeFinal);
      }
    }

    const animate = () => {
      el.textContent = '0';
      const startTs = performance.now();
      let rafId = 0;
      const tick = (now: number) => {
        const t = Math.min((now - startTs) / duration, 1);
        const v = Math.round(target * easeOutQuart(t));
        el.textContent = String(v);
        if (t < 1) rafId = requestAnimationFrame(tick);
        else el.textContent = String(target);
      };
      rafId = requestAnimationFrame(tick);
      // If the user flips reduced-motion ON mid-tween, snap to final
      // and cancel the next frame.
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const snap = () => {
        if (mq.matches) {
          el.textContent = String(target);
          cancelAnimationFrame(rafId);
        }
      };
      mq.addEventListener('change', snap);
      // animate() is called once after IO fires; cleanup the snap
      // listener when the tween ends.
      const onEnd = () => mq.removeEventListener('change', snap);
      // Use a tiny extra frame to attach the cleanup after the tween
      // has settled; duration + small margin is fine.
      setTimeout(onEnd, duration + 50);
    };

    if (threshold !== 0.4) {
      // Custom threshold path — keep a local observer so we don't
      // pollute the shared controller with non-default options.
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
    }

    return observe('countUp', el, () => {
      animate();
    });
  }, [ref, target, duration, threshold]);
}
