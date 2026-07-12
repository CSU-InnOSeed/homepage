import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
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
 *      page. We set <meta name="robots" content="noindex"> + update the
 *      document title so crawlers don't index the 404.
 *
 * The visual treatment mirrors the static 404.html — same "页面走丢了 /
 * 种子还在土里" copy — so the two surfaces feel like one product.
 */
export default function NotFound() {
  const headRef = useRef<HTMLElement | null>(null);
  useReveal(headRef);

  useEffect(() => {
    // SPA-rendered 404 should still look like a 404 to search engines and
    // users' tab strips. We can't change the HTTP status (Vercel's SPA
    // rewrite already returned 200), but we can change the title and
    // inject a noindex meta tag so crawlers don't index this URL.
    document.title = '页面走丢了 · InnOSeed Lab';

    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex';

    return () => {
      // Leaving the 404 (e.g. user clicks "回到首页") — restore the
      // default indexable meta so we don't leak noindex onto real pages
      // if the same SPA session later mounts a route that *should* be
      // indexed.
      if (meta) meta.content = 'index,follow';
    };
  }, []);

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
