import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';
import { RECRUIT } from '../content/site.js';

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
        <span ref={eyebrowRef} className="eyebrow reveal">{RECRUIT.eyebrow}</span>
        <h2 ref={headRef} className="reveal" data-delay="1">
          {RECRUIT.headline.lead}{' '}
          <em>{RECRUIT.headline.accent}</em>
        </h2>
        <p ref={pRef} className="reveal" data-delay="2">
          {RECRUIT.body}
        </p>
        <p ref={metaRef} className="meta reveal" data-delay="3">
          {RECRUIT.meta}
        </p>
        <a
          ref={ctaRef}
          className="recruit-cta reveal"
          data-delay="4"
          href={RECRUIT.cta.href}
        >
          <span>{RECRUIT.cta.label}</span>
          <span className="arrow">{RECRUIT.cta.arrow}</span>
        </a>
      </div>
    </section>
  );
}
