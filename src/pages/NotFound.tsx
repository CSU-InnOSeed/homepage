import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import usePageMeta from '../hooks/usePageMeta';
import { BRAND, CONTACT_EMAIL } from '../content/site';

/**
 * NotFound — 404 page rendered by React Router's path="*" route.
 *
 * Two ways the user can land here:
 *
 *   1. Vercel-level 404 (server returns 404 + dist/404.html): only happens
 *      for unknown top-level paths when the server doesn't catch the
 *      rewrite. The static 404.html is the *first* line of defense and is
 *      styled independently in /public/404.html so the user sees
 *      something coherent even before the JS bundle loads.
 *
 *   2. Client-side navigation to a path React Router doesn't know
 *      (e.g. user types a bad URL in the SPA, or a stale internal link).
 *      In that case Vercel already returned 200 + index.html (because of
 *      the SPA rewrite), and this component renders instead of the home
 *      page. usePageMeta sets noindex + the title so crawlers don't
 *      index the 404 (Vercel's 200 makes the SPA URL indexable by
 *      default — the meta is the only signal we have).
 *
 * The visual treatment mirrors the static 404.html — same "页面走丢了 /
 * 种子还在土里" copy — so the two surfaces feel like one product.
 */
export default function NotFound() {
  const headRef = useRef<HTMLElement | null>(null);
  useReveal(headRef);

  // SPA-rendered 404: set a real title + noindex meta + canonical
  // pointing at the home page (so any inbound link gets consolidated).
  // On unmount usePageMeta flips the robots meta back to index,follow
  // so a subsequent SPA navigation to a real route doesn't leak the
  // noindex directive.
  usePageMeta({
    title: '页面走丢了 · InnOSeed Lab',
    description:
      '页面走丢了,但种子还在土里。回主页看看 InnOSeed 在做什么。',
    canonical: '/',
    noindex: true,
  });

  return (
    <>
      <Nav />
      <main id="main" tabIndex={-1} className="not-found">
        <section className="not-found-inner">
          <header ref={headRef} className="reveal">
            <div className="not-found-code">404</div>
            <h1>
              页面走丢了，<br />
              但种子还在 <em>土里。</em>
            </h1>
            <p>
              你找的页面可能搬家了、被收走了、或者根本没存在过。
              <br />
              回主页看看 InnOSeed 在做什么 — 比迷路的地方有意思得多。
            </p>
            <Link to="/" className="btn btn-primary not-found-cta">
              <span>回到首页</span>
              <span className="arrow">→</span>
            </Link>
          </header>
          <footer className="not-found-foot">
            © 2025 {BRAND} Lab ·{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </footer>
        </section>
      </main>
      <Footer />
    </>
  );
}
