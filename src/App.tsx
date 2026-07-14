import { lazy, Suspense, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Hero from './components/Hero';
const Marquee = lazy(() => import('./components/Marquee'));
const Manifesto = lazy(() => import('./components/Manifesto'));
const Pillars = lazy(() => import('./components/Pillars'));
const Numbers = lazy(() => import('./components/Numbers'));
const Members = lazy(() => import('./components/Members'));
const Inside = lazy(() => import('./components/Inside'));
const Events = lazy(() => import('./components/Events'));
const Recruit = lazy(() => import('./components/Recruit'));
const Footer = lazy(() => import('./components/Footer'));

/**
 * App — composes the landing page sections in order, with an extra
 * `/apply` route for the recruitment flow and a 404 catch-all.
 *
 * Sections on `/`:
 *   Nav → Hero → Marquee → Manifesto → Pillars
 *   → Numbers → Members → Inside → Events → Recruit → Footer
 *
 * Sections on `/apply`:
 *   Apply (4-step flow: Guide → PickInterviewer → Application → Done)
 *
 * Sections on `/events`, `/recruit`:
 *   Page header (breadcrumb + title + intro) followed by the matching
 *   section component. The in-section hero/head is suppressed via prop
 *   so the page only shows the title once.
 *
 * 404:
 *   `path="*"` renders the NotFound page. At the Vercel level, unknown
 *   top-level paths serve dist/404.html (404 status) before the SPA
 *   bundle even loads; the React NotFound catches the same case for
 *   client-side navigation and unknown nested paths.
 *
 * Code splitting:
 *   `/apply`, `/events`, `/recruit`, and the 404 page are React.lazy'd
 *   into their own chunks. The Apply chunk also pulls in its own CSS
 *   (Apply.css imported by Apply.tsx). This keeps the landing-page
 *   bundle free of the recruitment-flow code (~14KB + 9KB Apply +
 *   Apply.css that visitors who never enter /apply will never need to
 *   download).
 *
 * Accessibility:
 *   - <a className="skip-link" href="#main"> is the first focusable element;
 *     it jumps keyboard users past the nav to the main content.
 *   - <main id="main" tabIndex={-1}> is the skip target; tabIndex=-1 makes
 *     it programmatically focusable but not in the tab order.
 */

// `pages/Apply` is the biggest split candidate (~14KB JS + 9KB CSS that
// never runs unless the user enters /apply).
const Apply = lazy(() => import('./pages/Apply'));
const EventsPage = lazy(() => import('./pages/Events'));
const RecruitPage = lazy(() => import('./pages/Recruit'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * PageFallback — shown while a lazy route chunk is loading. Keeps the
 * page layout stable (Nav + Footer chrome + a centred placeholder) so
 * the perceived load is "the section materialises" rather than "the
 * whole page redraws".
 */
function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--ff-sans)',
        color: 'var(--ink-muted)',
        fontSize: 14,
        letterSpacing: '0.1em',
      }}
    >
      LOADING…
    </div>
  );
}

export default function App() {
  const mainRef = useRef<HTMLElement | null>(null);

  const handleSkip = () => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  };

  return (
    <BrowserRouter>
      <a className="skip-link" href="#main" onClick={handleSkip}>
        跳到主要内容
      </a>
      <Routes>
        <Route
          path="/apply"
          element={
            <Suspense fallback={<PageFallback />}>
              <main id="main" ref={mainRef} tabIndex={-1}>
                <Apply />
              </main>
            </Suspense>
          }
        />
        <Route
          path="/events"
          element={
            <Suspense fallback={<PageFallback />}>
              <Nav />
              <EventsPage />
              <Footer />
            </Suspense>
          }
        />
        <Route
          path="/recruit"
          element={
            <Suspense fallback={<PageFallback />}>
              <Nav />
              <RecruitPage />
              <Footer />
            </Suspense>
          }
        />
        <Route
          path="/"
          element={
            <>
              <Nav />
              <main id="main" ref={mainRef} tabIndex={-1}>
                <Hero />
                <Suspense fallback={null}>
                  <Marquee />
                  <Manifesto />
                  <Pillars />
                  <Numbers />
                  <Members />
                  <Inside />
                  <Events />
                  <Recruit />
                  <Footer />
                </Suspense>
              </main>
            </>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
