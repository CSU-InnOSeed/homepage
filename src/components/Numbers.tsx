import { useRef } from 'react';
import useReveal from '../hooks/useReveal';
import useCountUp from '../hooks/useCountUp';
import { NUMBERS_HEAD, STATS, type Stat } from '../content/site';

export default function Numbers() {
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
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

interface NumCardProps {
  stat: Stat;
  idx: number;
}

function NumCard({ stat, idx }: NumCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  useReveal(cardRef);
  // Pass suffix to useCountUp so the final value still reads e.g. "140+",
  // but render it as a separate <span> for typography control — at
  // var(--fs-display) (clamp 56..144px) the "+" glued onto "0" with
  // -0.04em letter-spacing read like "14" + "0+".
  useCountUp(counterRef, { target: stat.target, suffix: stat.suffix });
  return (
    <div ref={cardRef} className={`num-card ${stat.key} reveal`} data-delay={String(idx)}>
      <span className="num-label">{stat.label}</span>
      <div className="num-value">
        <span ref={counterRef} className="num-counter" data-target={stat.target}>
          {stat.target}
        </span>
        {stat.suffix && <span className="num-suffix">{stat.suffix}</span>}
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
