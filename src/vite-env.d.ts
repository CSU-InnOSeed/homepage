/// <reference types="vite/client" />

// React 18's JSX types don't yet include `fetchpriority` (added in React 19).
// We use it on the Hero <img> to hint the LCP candidate to the browser.
// Module augmentation must follow an `import 'react'` so TypeScript treats
// the declare as an augmentation (merging into React.ImgHTMLAttributes)
// rather than redeclaring the entire `react` module — which would
// silently delete every named export like useState/useRef.
import 'react';

declare module 'react' {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
