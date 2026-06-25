import { useRef } from 'react';
import useSmoothAnchorScroll from '../hooks/useSmoothAnchorScroll.js';

const NAV_LINKS = [
  { href: '#manifesto', label: '关于实验室' },
  { href: '#pillars', label: '四大方向' },
  { href: '#members', label: '代表人物' },
  { href: 'https://innoseed.club/events', label: '活动预告', external: true },
  { href: 'https://innoseed.club/recruit', label: '招新', external: true },
];

const CONTACT_LINKS = [
  { href: 'mailto:contact@innoseed.club', label: 'contact@innoseed.club', external: false },
  { label: '微信号: wpcwzy1' },
  { href: 'https://github.com/CSU-InnOSeed', label: 'GitHub · CSU-InnOSeed', external: true },
  { href: 'https://blog.csdn.net/cyl_csdn_1', label: 'CSDN · cyl_csdn_1', external: true },
];

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
                InnOSeed<em>.</em>
              </div>
            </div>
            <p className="footer-tagline">
              中南大学计算机学院 · 一个以种子为名的实验室。<br />
              different thinkers 的俱乐部。
            </p>
          </div>
          <div>
            <h4>导航</h4>
            <ul>
              {NAV_LINKS.map((l) => (
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
            <h4>联系我们</h4>
            <ul>
              {CONTACT_LINKS.map((l, i) => (
                <li key={(l.href || 'plain') + l.label + i}>
                  {l.href ? (
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener' } : {})}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <span>{l.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 InnOSeed Lab. 保留所有权利.</span>
          <div className="links">
            <a href="#top">回到顶部 ↑</a>
            <a href="mailto:contact@innoseed.club">contact@innoseed.club</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
