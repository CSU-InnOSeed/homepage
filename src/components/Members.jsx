import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';

const PEOPLE = [
  {
    tag: '升学代表',
    name: '苗子阳',
    title: '中南大学年度人物 · 优秀学生标兵',
    items: ['中南大学年度人物', '优秀学生标兵', '保研至中南大学'],
  },
  {
    tag: '留学代表',
    name: '常佳宇',
    title: 'RoboCup 世界一等奖 · 斯坦福大学深造',
    items: ['RoboCup 世界一等奖', '前往斯坦福大学深造'],
  },
  {
    tag: '竞赛代表',
    name: '颜思宇',
    title: '国家级竞赛奖项 12 项 · 省级 20 余项',
    items: ['国家级竞赛奖项 12 项', '省级奖项 20 余项', '获省级竞赛最高荣誉'],
  },
];

export default function Members() {
  const eyebrowRef = useRef(null);
  const headRef = useRef(null);
  const descRef = useRef(null);
  useReveal(eyebrowRef);
  useReveal(headRef);
  useReveal(descRef);

  return (
    <section className="members" id="members">
      <div className="container">
        <div className="members-head">
          <div>
            <span ref={eyebrowRef} className="eyebrow reveal">04 — People</span>
            <h2 ref={headRef} className="reveal" data-delay="1">
              他们从这里<br /><em>继续往前走了。</em>
            </h2>
          </div>
          <p ref={descRef} className="desc reveal" data-delay="2">
            三位代表人物，三条不同的路。共同点是：都曾在 InnOSeed 认真做过一段事情。
          </p>
        </div>
        <div className="members-grid">
          {PEOPLE.map((p, i) => (
            <MemberCard key={p.name} person={p} idx={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberCard({ person, idx }) {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <article ref={ref} className="member reveal" data-delay={String(idx)}>
      <span className="member-tag">{person.tag}</span>
      <h3 className="member-name">{person.name}</h3>
      <p className="member-title">{person.title}</p>
      <div className="member-divider" />
      <ul className="member-list">
        {person.items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </article>
  );
}
