import { useRef } from 'react';
import useSmoothAnchorScroll from '../hooks/useSmoothAnchorScroll.js';
import { FOOTER } from '../content/site.js';

export default function Footer() {
  const containerRef = useRef(null);
  useSmoothAnchorScroll(containerRef);

  return (
    <footer className="footer" id="footer">
      <div className="container" ref={containerRef}>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="/imgs/favicon.png" alt="InnOSeed" />
              <div className="footer-brand-text">
                {FOOTER.brand}<em>.</em>
              </div>
            </div>
            <p className="footer-tagline">
              {FOOTER.tagline.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < FOOTER.tagline.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
          <div>
            <h4>{FOOTER.navHeading}</h4>
            <ul>
              {FOOTER.navLinks.map((l) => (
                <li key={l.href + l.label}>
                  <a
                    href={l.href}
                    {...(l.external ? { target: '_blank', rel: 'noopener' } : {})}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{FOOTER.contactHeading}</h4>
            <ul>
              {FOOTER.contactLinks.map((l, i) => (
                <li key={(l.href || 'plain') + l.label + i}>
                  {l.plain ? (
                    <span>{l.label}</span>
                  ) : (
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener' } : {})}
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{FOOTER.copyright}</span>
          <div className="links">
            {FOOTER.bottomLinks.map((l) => (
              <a key={l.href + l.label} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
