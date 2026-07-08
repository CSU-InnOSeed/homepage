import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';
import useCountUp from '../hooks/useCountUp.js';
import { NUMBERS_HEAD, STATS } from '../content/site.js';

export default function Numbers() {
  const eyebrowRef = useRef(null);
  const headRef = useRef(null);
  useReveal(eyebrowRef);
  useReveal(headRef);

  return (
    <section className="numbers" id="numbers">
      <div className="container numbers-inner">
        <div className="numbers-head">
          <div>
            <span ref={eyebrowRef} className="eyebrow reveal">{NUMBERS_HEAD.eyebrow}</span>
            <h2 ref={headRef} className="reveal" data-delay="1">
              {NUMBERS_HEAD.headline[0]}<br /><em>{NUMBERS_HEAD.headline[1]}</em>
            </h2>
          </div>
        </div>
        <div className="numbers-grid">
          {STATS.map((s, i) => (
            <NumCard key={s.key} stat={s} idx={i + 1} />
          ))}
        </div>
        <div className="numbers-mix">
          <span>{NUMBERS_HEAD.footerLabel}</span>
          <span>{NUMBERS_HEAD.footerText}</span>
        </div>
      </div>
    </section>
  );
}

function NumCard({ stat, idx }) {
  const cardRef = useRef(null);
  const counterRef = useRef(null);
  useReveal(cardRef);
  useCountUp(counterRef, { target: stat.target, suffix: stat.suffix });
  return (
    <div ref={cardRef} className={`num-card ${stat.key} reveal`} data-delay={String(idx)}>
      <span className="num-label">{stat.label}</span>
      <div className="num-value">
        <span ref={counterRef} className="num-counter" data-target={stat.target}>
          {stat.target}
          {stat.suffix}
        </span>
        {stat.unit && <span className="unit">{stat.unit}</span>}
      </div>
      <p className="num-meta">
        {stat.meta.map((line, i) => (
          <span key={i}>
            {line}
            {i < stat.meta.length - 1 && <br />}
          </span>
        ))}
      </p>
      <span className="num-period">{stat.period}</span>
    </div>
  );
}
