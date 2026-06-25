import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';
import useHeroParallax from '../hooks/useHeroParallax.js';

/**
 * Hero — first viewport.
 *
 * Every text block carries .reveal so the entry animation fires; we attach
 * useReveal to each ref. CSS `.reveal[data-delay="N"]` staggers the transition.
 */
export default function Hero() {
  const imgRef = useHeroParallax();
  const tagRef = useRef(null);
  const h1Ref = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);

  useReveal(tagRef);
  useReveal(h1Ref);
  useReveal(subRef);
  useReveal(ctaRef);

  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <img
          ref={imgRef}
          src="/imgs/banner.jpg"
          alt="InnOSeed Lab"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div className="container hero-inner">
        <div ref={tagRef} className="hero-tag reveal">
          CSU InnOSeed Lab · est. 2019
        </div>
        <h1 ref={h1Ref} className="reveal" data-delay="1">
          我们更像俱乐部，属于 <em>different thinkers</em> 的俱乐部。
        </h1>
        <div className="hero-headline">
          <div className="row"><span>在</span></div>
          <div className="row"><span><span className="accent">InnOSeed</span>，</span></div>
          <div className="row"><span>做你想做的。</span></div>
        </div>
        <p ref={subRef} className="hero-sub reveal" data-delay="4">
          中南大学计算机学院 · 一个以种子为名、靠不同想法长成一片林的实验室。<br />
          竞赛 · 科研 · 创业 · 志合者 — 四个方向，一条共同的路。
        </p>
        <div ref={ctaRef} className="hero-cta reveal" data-delay="5">
          <a className="btn btn-primary" href="#pillars">
            <span>了解方向</span>
            <span className="arrow">→</span>
          </a>
          <a className="btn btn-ghost" href="#recruit">
            <span>申请加入</span>
            <span className="arrow">↗</span>
          </a>
        </div>
      </div>
      <div className="hero-meta">
        <div className="hero-scroll">Scroll to explore</div>
        <div className="hero-counter">01 / 06</div>
      </div>
    </section>
  );
}
