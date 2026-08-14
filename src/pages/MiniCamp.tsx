import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import usePageMeta from '../hooks/usePageMeta';
import { MINICAMP, EVENTS, BRAND, CONTACT_EMAIL } from '../content/site';
import './MiniCamp.css';

const MINI_CAMP_IMAGES = {
  hero: '/imgs/minicamp/437f51bf12a65eb87ff05deca5eb821a.jpg',
  idea: '/imgs/minicamp/403973cd2a692714f8991fa2caca693d.jpg',
  group: '/imgs/minicamp/6897ed0365db6c38ac2580863835f816.jpg',
};

function isMiniCampHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('minicamp.');
}

export default function MiniCamp() {
  const headRef = useRef<HTMLElement | null>(null);
  useReveal(headRef);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  usePageMeta({
    title: 'Mini Camp · InnOSeed',
    description:
      'InnOSeed Mini Camp: 一个白天,把一个小想法做成原型、跑通 Demo,再当面交换反馈。',
    canonical: '/minicamp',
  });

  const onSubdomain = isMiniCampHost();
  const pastCamp = EVENTS.items.find((e) => e.key === 'mini-camp-fall-2025');

  return (
    <>
      {onSubdomain ? <SubdomainHeader /> : <Nav />}
      <main id="main" tabIndex={-1} className="minicamp-page">
        <header ref={headRef} className="page-header minicamp-hero reveal">
          <img
            className="minicamp-hero-image"
            src={MINI_CAMP_IMAGES.hero}
            alt="Mini Camp 活动现场合照"
          />
          <div className="container minicamp-hero-content">
            <nav className="breadcrumb" aria-label="面包屑">
              {onSubdomain ? (
                <a href="https://innoseed.club">{BRAND} 主站</a>
              ) : (
                <Link to="/">首页</Link>
              )}
              <span aria-hidden="true">/</span>
              <span aria-current="page">Mini Camp</span>
            </nav>
            <div className="minicamp-hero-kicker">
              <span className="eyebrow">{MINICAMP.eyebrow}</span>
              <span className="minicamp-hero-date">ONE DAY / MANY DIRECTIONS</span>
            </div>
            <h1>
              {MINICAMP.headline.lead}
              <br />
              <em>{MINICAMP.headline.accent}</em>
            </h1>
            <p className="page-header-desc">{MINICAMP.lead}</p>
            <div className="minicamp-hero-cta-row">
              <a className="btn btn-primary" href="/apply">
                <span>报名minicamp</span>
                <span className="arrow">↗</span>
              </a>
              <a className="minicamp-scroll-link" href="#minicamp-story">
                <span>向下看现场</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="minicamp-hero-index" aria-hidden="true">
            <span>MC</span>
            <span>01 / 03</span>
          </div>
        </header>

        <section id="minicamp-story" className="minicamp-story">
          <div className="container minicamp-story-grid">
            <div className="minicamp-story-intro">
              <span className="eyebrow">从一个想法开始</span>
              <h2>先有一点<br /><em>不满足。</em></h2>
              <p className="minicamp-story-note">Mini Camp 不是招新流程,而是把不同想法带到一起,一起做点事情。</p>
            </div>
            <figure className="minicamp-idea-figure">
              <img src={MINI_CAMP_IMAGES.idea} alt="关于创新项目从小想法开始的文字海报" />
              <figcaption>每一个创新性的项目,最初都只是一个小小的想法。</figcaption>
            </figure>
          </div>
          <div className="container minicamp-copy-grid">
            {MINICAMP.paragraphs.map((html, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </div>
        </section>

        <section id="minicamp-tracks" className="minicamp-tracks">
          <div className="container">
            <div className="minicamp-section-heading">
              <div>
                <span className="eyebrow">四路分头</span>
                <h2>同一件事,<br /><em>从不同角度</em>开始。</h2>
              </div>
              <p>每路 2–3 人,自由组队。你不必把自己放进一个固定答案里,只要带着一种擅长进场。</p>
            </div>
            <div className="minicamp-track-grid">
              {MINICAMP.tracks.map((t) => (
                <article key={t.pillarKey} className={`minicamp-track pillar-${t.pillarKey}`}>
                  <header className="minicamp-track-head">
                    <span className="minicamp-track-num">0{t.index}</span>
                    <span className="minicamp-track-name">{t.name}</span>
                  </header>
                  <p className="minicamp-track-one">{t.one}</p>
                  <p className="minicamp-track-desc">{t.desc}</p>
                  <span className="minicamp-track-arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="minicamp-recap" className="minicamp-recap">
          <div className="container minicamp-recap-grid">
            <figure className="minicamp-group-figure">
              <img src={MINI_CAMP_IMAGES.group} alt="2025 秋季 Mini Camp 全体合照" loading="lazy" />
              <figcaption>从分头做事,到一起站在这里。</figcaption>
            </figure>
            {pastCamp && (
              <div className="minicamp-recap-copy">
                <span className="eyebrow">上一届现场</span>
                <p className="minicamp-recap-number">2025 <em>秋</em></p>
                <h2>{pastCamp.title}</h2>
                <p className="minicamp-past-subtitle">{pastCamp.subtitle}</p>
                <p className="minicamp-past-body">{pastCamp.body}</p>
                <p className="minicamp-past-where">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {pastCamp.where}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      {onSubdomain ? <SubdomainFooter /> : <Footer />}
    </>
  );
}

function SubdomainHeader() {
  return (
    <header className="minicamp-subdomain-head">
      <div className="container">
        <a className="minicamp-subdomain-brand" href={typeof window !== 'undefined' ? window.location.href : '/'}>
          <span className="minicamp-subdomain-mark" aria-hidden="true">+</span>
          <span className="minicamp-subdomain-name">Mini Camp</span>
          <span className="minicamp-subdomain-of">of {BRAND}</span>
        </a>
        <nav className="minicamp-local-nav" aria-label="Mini Camp 页面导航">
          <a href="#minicamp-story">故事</a>
          <a href="#minicamp-tracks">四路</a>
          <a href="#minicamp-recap">现场</a>
        </nav>
        <a className="minicamp-subdomain-back" href="https://innoseed.club" aria-label={`返回 ${BRAND} 主站`}>
          <span aria-hidden="true">↗</span> 主站
        </a>
      </div>
    </header>
  );
}

function SubdomainFooter() {
  return (
    <footer className="minicamp-subdomain-foot">
      <div className="container">
        <span>© {BRAND} Lab · Mini Camp</span>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
    </footer>
  );
}
