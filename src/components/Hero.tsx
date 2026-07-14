import { useRef } from 'react';
import useReveal from '../hooks/useReveal';
import useHeroParallax from '../hooks/useHeroParallax';
import { HERO } from '../content/site';

/**
 * Hero — first viewport.
 *
 * The h1 wraps the dominant headline rows (the visual anchor of the
 * page) and HERO.lead becomes a <p className="hero-lede"> subhead
 * directly underneath. This matches the visual hierarchy visitors
 * actually see — the big accent text is the headline, the thinner
 * sentence is the lede. Each animatable element has its own
 * useReveal so the entry transition fires once it enters viewport.
 */
export default function Hero() {
  const imgRef = useHeroParallax();
  const tagRef = useRef<HTMLDivElement | null>(null);
  const h1Ref = useRef<HTMLHeadingElement | null>(null);
  const ledeRef = useRef<HTMLParagraphElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useReveal(tagRef);
  useReveal(h1Ref);
  useReveal(ledeRef);
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
            // Matches the <link rel=preload> in index.html — the
            // browser uses the same variant the preloader primed.
            fetchpriority="high"
            decoding="async"
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
        <h1 ref={h1Ref} className="hero-headline reveal" data-delay="1">
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
        </h1>
        <p ref={ledeRef} className="hero-lede reveal" data-delay="2">
          {HERO.lead}
        </p>
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
