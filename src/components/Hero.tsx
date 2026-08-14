import { useRef } from 'react';
import useReveal from '../hooks/useReveal';
import useHeroParallax from '../hooks/useHeroParallax';
import useHeroSweep from '../hooks/useHeroSweep';
import { HERO } from '../content/site';
import styles from './Hero.module.css';

/**
 * Hero — first viewport.
 *
 * The h1 wraps the dominant headline rows (the visual anchor of the
 * page) and HERO.lead becomes a <p className="hero-lede"> subhead
 * directly underneath. This matches the visual hierarchy visitors
 * actually see — the big accent text is the headline, the thinner
 * sentence is the lede. Each animatable element has its own
 * useReveal so the entry transition fires once it enters viewport.
 *
 * The h1 paints its rows twice as two stacked layers
 * (`.base` + `.overlay`) so the hover sweep can reveal an amber
 * copy over a base ink-dark copy via clip-path, without relying on
 * `background-clip: text` (which renders inconsistently across some
 * Chromium variants — including the Playwright headless shell that
 * runs our e2e suite). The base layer is always visible, so the
 * headline is never blank.
 *
 * All headline-related styles live in `Hero.module.css`, not in
 * `globals.css`. The reveal / fade-up observer (`useReveal`) is a
 * project-wide concern, so its `.reveal` / `.reveal.in` classes
 * stay in globals.css; we compose them here via the bare `reveal`
 * string literal.
 */
function renderHeadlineRows() {
  return HERO.headlineRows.map((row, i) => (
    <span className={styles.row} key={i}>
      <span>
        {row.text !== undefined ? (
          row.text
        ) : (
          <>
            <span className={styles.accent}>{row.lead}</span>
            {row.trail}
          </>
        )}
      </span>
    </span>
  ));
}

/**
 * SVG-flavored variant of `renderHeadlineRows`, used by the overlay
 * layer so each glyph can carry a dashed `stroke` (via SVG's
 * `stroke-dasharray`, which CSS Modules / `-webkit-text-stroke`
 * cannot replicate). `fill: transparent` on the overlay means the
 * base layer's ink-dark text shows through the SVG glyphs — only
 * the dashed amber outline is visible, which is the "速写本 dashed
 * edge" effect the user asked for.
 *
 * Baseline alignment note: SVG `<text y="1em">` puts the first
 * baseline at 1em from the SVG top (matching the .row's
 * line-height: 1.0 layout in HTML). Each `<tspan dy="1em">` then
 * drops the next baseline by exactly 1em, so the two rows line up
 * pixel-for-pixel with the base layer's HTML glyphs.
 */
function renderSvgHeadlineRows() {
  return HERO.headlineRows.map((row, i) => {
    const inner =
      row.text !== undefined ? (
        row.text
      ) : (
        <>
          <tspan className={styles.svgAccent}>{row.lead}</tspan>
          {row.trail}
        </>
      );
    return (
      // dy="1em" on every row including the first — the SVG <text>
      // baseline at y="1em" is the first baseline, and dy is the
      // spacing between consecutive baselines (== line-height).
      <tspan key={i} x="0" dy="1em">
        {inner}
      </tspan>
    );
  });
}
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
  // Reuse the same h1Ref — useReveal only adds an `.in` class via
  // IntersectionObserver; useHeroSweep only writes a CSS variable via
  // mousemove. They never conflict on the same node.
  useHeroSweep(h1Ref);

  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <picture>
          <source
            type="image/avif"
            srcSet="/imgs/banner-480.avif 480w, /imgs/banner-960.avif 960w, /imgs/banner-1440.avif 1440w"
            sizes="100vw"
          />
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
            width={1828}
            height={1010}
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
        <h1 ref={h1Ref} className={`${styles.headline} reveal`} data-delay="1">
          <span className={styles.layer}>{renderHeadlineRows()}</span>
          <svg
            className={`${styles.layer} ${styles.overlay}`}
            aria-hidden="true"
            preserveAspectRatio="xMinYMin meet"
          >
            <text className={styles.svgText} y="-0.15em">
              {renderSvgHeadlineRows()}
            </text>
          </svg>
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
