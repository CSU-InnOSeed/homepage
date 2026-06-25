import { useEffect } from 'react';

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

/**
 * useCountUp — count from 0 to a target value with an ease-out curve.
 *
 * Animates textContent on the ref'd element using requestAnimationFrame.
 * Fires once when the element enters the viewport, then disconnects.
 *
 * @param {React.RefObject} ref
 * @param {object} cfg
 * @param {number} cfg.target — final integer value.
 * @param {string} [cfg.suffix] — e.g. '+'.
 * @param {number} [cfg.duration=2200] — ms.
 * @param {number} [cfg.threshold=0.4]
 */
export default function useCountUp(ref, { target, suffix = '', duration = 2200, threshold = 0.4 }) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const animate = () => {
      el.textContent = '0';
      const startTs = performance.now();
      const tick = (now) => {
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
