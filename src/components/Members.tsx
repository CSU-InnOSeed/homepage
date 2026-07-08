import { useRef } from 'react';
import useReveal from '../hooks/useReveal';
import { MEMBERS, type Member } from '../content/site';

export default function Members() {
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
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
          {MEMBERS.map((p, i) => (
            <MemberCard key={p.name} person={p} idx={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface MemberCardProps {
  person: Member;
  idx: number;
}

function MemberCard({ person, idx }: MemberCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  useReveal(ref);
  return (
    <article ref={ref} className="member reveal" data-delay={String(idx)}>
      <span className="member-tag">{person.tag}</span>
      <h3 className="member-name">{person.name}</h3>
      <p className="member-title">{person.title}</p>
      <div className="member-divider" />
      <ul className="member-list">
        {person.items.map((it: string) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </article>
  );
}
