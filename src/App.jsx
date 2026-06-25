import { useRef } from 'react';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import Manifesto from './components/Manifesto.jsx';
import Pillars from './components/Pillars.jsx';
import Numbers from './components/Numbers.jsx';
import Members from './components/Members.jsx';
import Inside from './components/Inside.jsx';
import Recruit from './components/Recruit.jsx';
import Footer from './components/Footer.jsx';

/**
 * App — composes the landing page sections in order.
 *
 * Sections mirror the original single-file layout:
 *   Nav → Hero → Marquee → Manifesto → Pillars
 *   → Numbers → Members → Inside → Recruit → Footer
 *
 * Accessibility:
 *   - <a className="skip-link" href="#main"> is the first focusable element;
 *     it jumps keyboard users past the nav to the main content.
 *   - <main id="main" tabIndex={-1}> is the skip target; tabIndex=-1 makes
 *     it programmatically focusable but not in the tab order.
 */
export default function App() {
  const mainRef = useRef(null);

  const handleSkip = (e) => {
    // Move focus to main for screen readers; smooth-scroll is handled by
    // useSmoothAnchorScroll on the document.
    if (mainRef.current) mainRef.current.focus({ preventScroll: true });
  };

  return (
    <>
      <a className="skip-link" href="#main" onClick={handleSkip}>
        跳到主要内容
      </a>
      <Nav />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Hero />
        <Marquee />
        <Manifesto />
        <Pillars />
        <Numbers />
        <Members />
        <Inside />
        <Recruit />
      </main>
      <Footer />
    </>
  );
}
