import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';

export default function Manifesto() {
  const eyebrowRef = useRef(null);
  const headRef = useRef(null);
  const p1Ref = useRef(null);
  const p2Ref = useRef(null);
  const p3Ref = useRef(null);

  // Each reveal target needs its own observer; useReveal attaches to one ref.
  useReveal(eyebrowRef);
  useReveal(headRef, { threshold: 0.15 });
  useReveal(p1Ref, { threshold: 0.15 });
  useReveal(p2Ref, { threshold: 0.15 });
  useReveal(p3Ref, { threshold: 0.15 });

  return (
    <section className="manifesto" id="manifesto">
      <div className="container manifesto-inner">
        <div className="manifesto-label">
          <span ref={eyebrowRef} className="eyebrow reveal">01 — Manifesto</span>
          <h2 ref={headRef} className="reveal" style={{ marginTop: 24 }}>
            一 所<br />不 太 一 样<br />的 实 验 室。
          </h2>
        </div>
        <div className="manifesto-body">
          <p ref={p1Ref} className="reveal" data-delay="1">
            InnOSeed 不是另一个学生组织，<span className="hl">而是一个"实验室"</span>
            ——小而精，每届只收 8–9 个人，面向全校。
          </p>
          <p ref={p2Ref} className="reveal" data-delay="2">
            我们没有硬性的招生标准，没有强制打卡，没有 KPI 表格。我们相信一件事：
            让有不同想法的人相遇，他们自己会知道接下来要做什么。
          </p>
          <p ref={p3Ref} className="reveal" data-delay="3">
            在竞赛里被逼出过极限，在科研里求证过细微的真相，在创业里把想法第一次推到市场前；
            也在某个傍晚的露台上，和一群同路人喝完一整壶咖啡。
            <br /><br />
            这四件事都叫 <span className="hl">"做你想做的"</span>。只是我们一起做。
          </p>
        </div>
      </div>
    </section>
  );
}
