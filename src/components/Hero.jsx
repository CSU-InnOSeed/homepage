import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';
import useHeroParallax from '../hooks/useHeroParallax.js';
import { HERO } from '../content/site.js';

/**
 * Hero — first viewport.
 *
 * Three fixed headline rows (CSS animates each .row span with stagger).
 * The h1 + tag + sub + CTA each have their own useReveal so the entry
 * transition fires once they're in viewport.
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
        <picture>
          <source
            type="image/webp"
            srcSet="/imgs/banner-480.webp 480w, /imgs/banner-960.webp 960w, /imgs/banner-1440.webp 1440w"
            sizes="100vw"
          />
          <img
            ref={imgRef}
            src="/imgs/banner-1440.jpg"
            srcSet="/imgs/banner-480.jpg 480w, /imgs/banner-960.jpg 960w, /imgs/banner-1440.jpg 1440w"
            sizes="100vw"
            alt="InnOSeed Lab"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </picture>
      </div>
      <div className="container hero-inner">
        <div ref={tagRef} className="hero-tag reveal">
          {HERO.tag}
        </div>
        <h1 ref={h1Ref} className="reveal" data-delay="1">
          {HERO.lead}
        </h1>
        <div className="hero-headline">
          {HERO.headlineRows.map((row, i) => (
            <div className="row" key={i}>
              <span>
                {row.text !== undefined ? (
                  row.text
                ) : (
                  <>
                    <span className="accent">{row.lead}</span>
                    {row.trail}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        <p ref={subRef} className="hero-sub reveal" data-delay="4">
          {HERO.sub}
        </p>
        <div ref={ctaRef} className="hero-cta reveal" data-delay="5">
          <a className="btn btn-primary" href={HERO.primaryCta.href}>
            <span>{HERO.primaryCta.label}</span>
            <span className="arrow">{HERO.primaryCta.arrow}</span>
          </a>
          <a className="btn btn-ghost" href={HERO.secondaryCta.href}>
            <span>{HERO.secondaryCta.label}</span>
            <span className="arrow">{HERO.secondaryCta.arrow}</span>
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
