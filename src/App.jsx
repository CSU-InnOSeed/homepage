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
 */
export default function App() {
  return (
    <>
      <Nav />
      <main>
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
