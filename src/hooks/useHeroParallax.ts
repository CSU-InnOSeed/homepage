import { useEffect, useRef, type RefObject } from 'react';

/**
 * useHeroParallax — subtle parallax + scale on the hero media while the
 * user is still inside the hero (first viewport).
 *
 * Mirrors the original vanilla effect; uses rAF + a passive scroll
 * listener. Disabled below 720px width to spare mobile.
 *
 * Self-disconnects once scrollY passes `window.innerHeight`: the user
 * has left the first viewport, the parallax effect is no longer
 * visible, and the listener + rAF are no longer needed. Cancels any
 * pending rAF and snaps the image to its end-state transform
 * (translateY: 25 % of innerHeight, scale: 1.05) so the final frame
 * isn't a half-applied transform from the last scroll tick.
 */
export default function useHeroParallax(): RefObject<HTMLImageElement> {
  // useRef<T>(null!) makes TS infer RefObject<T> (not RefObject<T | null>),
  // which is what the <img ref={…}> prop expects in React 18's types.
  const imgRef = useRef<HTMLImageElement>(null!);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return undefined;
    if (typeof window === 'undefined') return undefined;
    if (!window.matchMedia('(min-width: 720px)').matches) return undefined;

    let ticking = false;
    let rafId = 0;
    let disconnected = false;

    const snapToEnd = () => {
      // Match the math in onScroll's transform so the final state is
      // visually consistent with what a frame at scrollY === innerHeight
      // would have produced.
      img.style.transform = `translateY(${window.innerHeight * 0.25}px) scale(1.05)`;
    };

    const onScroll = () => {
      if (disconnected) return;
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        ticking = false;
        if (disconnected) return;
        const y = window.scrollY;
        if (y < window.innerHeight) {
          img.style.transform = `translateY(${y * 0.25}px) scale(${1 + (y / window.innerHeight) * 0.05})`;
        } else {
          // Past the first viewport — the parallax is no longer visible.
          // Disconnect everything and snap to the end-state so the image
          // doesn't freeze mid-tween.
          disconnected = true;
          snapToEnd();
          window.removeEventListener('scroll', onScroll);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      disconnected = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return imgRef;
}