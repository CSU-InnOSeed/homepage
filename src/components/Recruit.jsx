import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';

export default function Recruit() {
  const eyebrowRef = useRef(null);
  const headRef = useRef(null);
  const pRef = useRef(null);
  const metaRef = useRef(null);
  const ctaRef = useRef(null);
  useReveal(eyebrowRef);
  useReveal(headRef);
  useReveal(pRef);
  useReveal(metaRef);
  useReveal(ctaRef);

  return (
    <section className="recruit" id="recruit">
      <div className="recruit-bg" />
      <div className="container recruit-inner">
        <span ref={eyebrowRef} className="eyebrow reveal">06 — Join Us</span>
        <h2 ref={headRef} className="reveal" data-delay="1">
          加 入 <em>InnOSeed</em>
        </h2>
        <p ref={pRef} className="reveal" data-delay="2">
          坚持小而精的发展路线，每届只固定招收 8 — 9 人，<br />
          招生对象面向全校。我们没有硬性的招生标准。
        </p>
        <p ref={metaRef} className="meta reveal" data-delay="3">
          — 只希望能够和有着不同想法的你相遇。
        </p>
        <a
          ref={ctaRef}
          className="recruit-cta reveal"
          data-delay="4"
          href="mailto:contact@innoseed.club"
        >
          <span>立即申请 · Apply Now</span>
          <span className="arrow">→</span>
        </a>
      </div>
    </section>
  );
}
