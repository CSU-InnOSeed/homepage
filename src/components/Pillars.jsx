import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';

const PILLARS = [
  {
    key: 'compete',
    en: 'Compete',
    name: '竞赛',
    icon: '/imgs/icon-compete.svg',
    desc: '参与竞赛，培养综合素质——以赛代练，逼出最好的自己。',
  },
  {
    key: 'research',
    en: 'Research',
    name: '科研',
    icon: '/imgs/icon-research.svg',
    desc: '纵深发展，探求真理与奥秘——在某一寸土地上挖到深处。',
  },
  {
    key: 'startup',
    en: 'Startup',
    name: '创业',
    icon: '/imgs/icon-startup.svg',
    desc: '进入市场，点燃创业理想——把想法第一次推到现实里检验。',
  },
  {
    key: 'bonds',
    en: 'Bonds',
    name: '志合者',
    icon: '/imgs/icon-bonds.svg',
    desc: '莫愁前路无知己——找到一群同路人，比任何奖项都更难得。',
  },
];

export default function Pillars() {
  const eyebrowRef = useRef(null);
  const headRef = useRef(null);
  const descRef = useRef(null);
  useReveal(eyebrowRef);
  useReveal(headRef);
  useReveal(descRef);

  return (
    <section className="pillars" id="pillars">
      <div className="container">
        <div className="pillars-head">
          <div>
            <span ref={eyebrowRef} className="eyebrow reveal">02 — Four Directions</span>
            <h2 ref={headRef} className="reveal" data-delay="1">
              四个方向，<br /><em>一个共同</em>的开始。
            </h2>
          </div>
          <p ref={descRef} className="desc reveal" data-delay="2">
            不强制、不分岗、不打分。哪条路先到、谁先走，都不重要；
            重要的是把每条路都走出自己的形状。
          </p>
        </div>
        <div className="pillars-grid">
          {PILLARS.map((p, idx) => (
            <PillarCard key={p.key} pillar={p} idx={idx + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ pillar, idx }) {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <article
      ref={ref}
      className="reveal"
      data-delay={String(idx)}
      data-c={pillar.key}
    >
      <div className="pillar-num">{String(idx).padStart(2, '0')} / 04</div>
      <div className="pillar-icon">
        <img src={pillar.icon} alt={pillar.name} />
      </div>
      <div className="pillar-bottom">
        <div className="pillar-en">{pillar.en}</div>
        <div className="pillar-name">{pillar.name}</div>
        <div className="pillar-line" />
        <p className="pillar-desc">{pillar.desc}</p>
      </div>
    </article>
  );
}
