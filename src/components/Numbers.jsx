import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';
import useCountUp from '../hooks/useCountUp.js';

const STATS = [
  {
    key: 'c-purple',
    label: 'National / Intl. 1st Prize',
    target: 10,
    suffix: '',
    unit: '人次',
    meta: '国家 / 国际级一等奖\n含金量最高的那一档',
    period: '2019 — 2025',
  },
  {
    key: 'c-amber',
    label: 'National Scholarship',
    target: 13,
    suffix: '',
    unit: '人次',
    meta: '国家奖学金\n学业与综合素质的双重肯定',
    period: '累计',
  },
  {
    key: 'c-green',
    label: 'National Honors',
    target: 64,
    suffix: '',
    unit: '项',
    meta: '国家级荣誉\n含竞赛、科研、创业多个赛道',
    period: '累计',
  },
  {
    key: 'c-cyan',
    label: 'Awards In Total',
    target: 140,
    suffix: '+',
    unit: '',
    meta: '校级以上荣誉\n每一份都不该被忽略',
    period: '2019 — 2025',
  },
];

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
            <span ref={eyebrowRef} className="eyebrow reveal">03 — By The Numbers</span>
            <h2 ref={headRef} className="reveal" data-delay="1">
              不靠口号，<br /><em>靠这组数字。</em>
            </h2>
          </div>
        </div>
        <div className="numbers-grid">
          {STATS.map((s, i) => (
            <NumCard key={s.key} stat={s} idx={i + 1} />
          ))}
        </div>
        <div className="numbers-mix">
          <span>04 — Grad School / Exchange</span>
          <span>5 清华 · 2 北大 · 1 斯坦福 · 3 QS 前 100 交换</span>
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
        {stat.meta.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < stat.meta.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
      <span className="num-period">{stat.period}</span>
    </div>
  );
}
