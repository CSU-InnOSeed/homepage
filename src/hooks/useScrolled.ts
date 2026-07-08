import { useEffect, useState } from 'react';

/**
 * useScrolled — true when window.scrollY > threshold.
 *
 * @param {number} [threshold=60]
 * @returns {boolean}
 */
export default function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
