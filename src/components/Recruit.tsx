import { useRef, useState, useEffect } from 'react';
import useReveal from '../hooks/useReveal';
import { trackEvent } from '../lib/observability';
import { RECRUIT, RECRUIT_EXTRAS } from '../content/site';

/**
 * Recruit — 招新 CTA + 时间线 + FAQ
 *
 * 视觉层次:
 *   1. 顶部:背景图 + 大标题 + body + meta + CTA 按钮 (原有)
 *   2. 中段:招新时间线 (4 步,4 色 pillar accent)
 *   3. 底段:FAQ accordion (展开/收起)
 */
export default function Recruit() {
  return (
    <>
      <RecruitHero />
      <RecruitTimeline />
      <RecruitFaqs />
    </>
  );
}

function RecruitHero() {
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const pRef = useRef<HTMLParagraphElement | null>(null);
  const metaRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  useReveal(eyebrowRef);
  useReveal(headRef);
  useReveal(pRef);
  useReveal(metaRef);
  useReveal(ctaRef);

  return (
    <section className="recruit" id="recruit">
      <picture className="recruit-bg" aria-hidden="true">
        <source
          type="image/webp"
          srcSet="/imgs/group-photo-480.webp 480w, /imgs/group-photo-800.webp 800w, /imgs/group-photo-1200.webp 1200w"
          sizes="100vw"
        />
        <img
          src="/imgs/group-photo-1200.jpg"
          srcSet="/imgs/group-photo-480.jpg 480w, /imgs/group-photo-800.jpg 800w, /imgs/group-photo-1200.jpg 1200w"
          sizes="100vw"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className="container recruit-inner">
        <span ref={eyebrowRef} className="eyebrow reveal">{RECRUIT.eyebrow}</span>
        <h2 ref={headRef} className="reveal" data-delay="1">
          {RECRUIT.headline.lead}{' '}
          <em>{RECRUIT.headline.accent}</em>
        </h2>
        <p ref={pRef} className="reveal" data-delay="2">
          {RECRUIT.body}
        </p>
        <p ref={metaRef} className="meta reveal" data-delay="3">
          {RECRUIT.meta}
        </p>
        <a
          ref={ctaRef}
          className="recruit-cta reveal"
          data-delay="4"
          href={RECRUIT.cta.href}
          onClick={() => trackEvent('recruit_cta_click', { from: 'recruit-hero' })}
        >
          <span>{RECRUIT.cta.label}</span>
          <span className="arrow">{RECRUIT.cta.arrow}</span>
        </a>
      </div>
    </section>
  );
}

/** 招新时间线 — 4 步,横向 4 列(移动端纵向) */
function RecruitTimeline() {
  const headRef = useRef<HTMLDivElement | null>(null);
  useReveal(headRef);

  return (
    <section className="recruit-timeline">
      <div className="container">
        <div ref={headRef} className="rt-head reveal">
          <span className="eyebrow">07 — Timeline</span>
          <h2>
            招新流程,<em>是怎样的?</em>
          </h2>
        </div>
        <ol className="rt-grid">
          {RECRUIT_EXTRAS.timeline.map((step) => (
            <TimelineStep key={step.index} step={step} />
          ))}
        </ol>
      </div>
    </section>
  );
}

interface TimelineStepProps {
  step: typeof RECRUIT_EXTRAS.timeline[number];
}

function TimelineStep({ step }: TimelineStepProps) {
  const ref = useRef<HTMLLIElement | null>(null);
  useReveal(ref);
  return (
    <li ref={ref} className={`rt-step reveal rt-${step.phase}`} data-delay={String(step.index)}>
      <div className="rt-when">{step.when}</div>
      <div className="rt-num">0{step.index}</div>
      <h3 className="rt-title">{step.title}</h3>
      <p className="rt-desc">{step.desc}</p>
    </li>
  );
}

/** FAQ accordion — 第一条默认展开 */
function RecruitFaqs() {
  const [openIdx, setOpenIdx] = useState<number>(0);
  const headRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  useReveal(headRef);

  // Reveal each <li> as it enters the viewport. Each item gets a staggered
  // delay so the list fades in like the other sections.
  useEffect(() => {
    const root = listRef.current;
    if (!root) return undefined;
    const items = root.querySelectorAll<HTMLElement>('.rf-item.reveal');
    if (items.length === 0) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="recruit-faqs">
      <div className="container">
        <div ref={headRef} className="rf-head reveal">
          <span className="eyebrow">08 — FAQ</span>
          <h2>
            常见问题,<em>一次说清楚。</em>
          </h2>
        </div>
        <ul ref={listRef} className="rf-list">
          {RECRUIT_EXTRAS.faqs.map((faq, i) => {
            const open = openIdx === i;
            return (
              <li
                key={faq.q}
                className={`rf-item reveal${open ? ' rf-open' : ''}`}
                data-delay={String(Math.min(i + 1, 6))}
              >
                <button
                  type="button"
                  className="rf-q"
                  aria-expanded={open}
                  onClick={() => setOpenIdx(open ? -1 : i)}
                >
                  <span>{faq.q}</span>
                  <span className="rf-toggle" aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open && (
                  <div
                    className="rf-a"
                    dangerouslySetInnerHTML={{ __html: faq.a }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}