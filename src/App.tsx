import { useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Manifesto from './components/Manifesto';
import Pillars from './components/Pillars';
import Numbers from './components/Numbers';
import Members from './components/Members';
import Inside from './components/Inside';
import Events from './components/Events';
import Recruit from './components/Recruit';
import Footer from './components/Footer';
import Apply from './pages/Apply';
import EventsPage from './pages/Events';
import RecruitPage from './pages/Recruit';

/**
 * App — composes the landing page sections in order, with an extra
 * `/apply` route for the recruitment flow.
 *
 * Sections on `/`:
 *   Nav → Hero → Marquee → Manifesto → Pillars
 *   → Numbers → Members → Inside → Events → Recruit → Footer
 *
 * Sections on `/apply`:
 *   Apply (4-step flow: Guide → PickInterviewer → Application → Done)
 *
 * Accessibility:
 *   - <a className="skip-link" href="#main"> is the first focusable element;
 *     it jumps keyboard users past the nav to the main content.
 *   - <main id="main" tabIndex={-1}> is the skip target; tabIndex=-1 makes
 *     it programmatically focusable but not in the tab order.
 */
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
            <main id="main" ref={mainRef} tabIndex={-1}>
              <Apply />
            </main>
          }
        />
        <Route
          path="/events"
          element={
            <>
              <Nav />
              <EventsPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/recruit"
          element={
            <>
              <Nav />
              <RecruitPage />
              <Footer />
            </>
          }
        />
        <Route
          path="*"
          element={
            <>
              <Nav />
              <main id="main" ref={mainRef} tabIndex={-1}>
                <Hero />
                <Marquee />
                <Manifesto />
                <Pillars />
                <Numbers />
                <Members />
                <Inside />
                <Events />
                <Recruit />
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
