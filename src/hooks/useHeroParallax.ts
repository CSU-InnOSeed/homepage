import { useEffect, useRef } from 'react';

/**
 * useHeroParallax — subtle parallax + scale on the hero media while the
 * user is still inside the hero (first viewport).
 *
 * Mirrors the original vanilla effect; uses rAF + a passive scroll listener.
 * Disabled below 720px width to spare mobile.
 */
export default function useHeroParallax() {
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return undefined;
    if (typeof window === 'undefined') return undefined;
    if (!window.matchMedia('(min-width: 720px)').matches) return undefined;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          img.style.transform = `translateY(${y * 0.25}px) scale(${1 + (y / window.innerHeight) * 0.05})`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return imgRef;
}
