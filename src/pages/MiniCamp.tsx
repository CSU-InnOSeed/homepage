import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import usePageMeta from '../hooks/usePageMeta';
import { MINICAMP, EVENTS, RECRUIT_EXTRAS, BRAND, CONTACT_EMAIL } from '../content/site';
import './MiniCamp.css';

/**
 * MiniCamp — `minicamp.innoseed.club` 子域名页(同 SPA)。
 *
 * 设计思路:
 *   - 同一个 Vite 部署包,同一份 vercel.json,只是 Vercel 在 Domains 里
 *     多绑一个域名。当 hostname 以 `minicamp.` 开头时,根路径 /
 *     由 App.tsx 的路由层重定向到 /minicamp,这样:
 *       · minicamp.innoseed.club/         → 落到本页
 *       · minicamp.innoseed.club/apply    → 落到 Apply 页(招新表单)
 *       · innoseed.club/minicamp          → 主站也能直接分享这个 URL
 *   - Chrome 自适应:子域名下用极简头(品牌 + 回主站);主站下用全 Nav,
 *     保持一致导航体验。
 *   - 内容沿用 PILLARS 的 4 色 accent 给 4 个分路上色,复用 EVENTS 中
 *     上一届 Mini Camp 条目,以及 RECRUIT_EXTRAS.timeline 的 4 步招新
 *     时间线 — 数据单源在 site.ts。
 */

function isMiniCampHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('minicamp.');
}

export default function MiniCamp() {
  const headRef = useRef<HTMLElement | null>(null);
  useReveal(headRef);

  // Scroll to top on mount — arriving from another route shouldn't keep
  // the user mid-page from wherever they were before.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Per-route SEO. Description 专为 Mini Camp 写,跟首页的简短描述区分。
  usePageMeta({
    title: 'Mini Camp · InnOSeed 招新',
    description:
      'InnOSeed 招新不做宣讲——一个白天的 Mini Camp,4 路分头(产品/技术/设计/创业)产出原型 + 现场 Demo + 当场反馈。这是 InnOSeed 招新流程的核心环节。',
    canonical: '/minicamp',
  });

  const onSubdomain = isMiniCampHost();
  const pastCamp = EVENTS.items.find((e) => e.key === 'mini-camp-fall-2025');

  return (
    <>
      {onSubdomain ? <SubdomainHeader /> : <Nav />}
      <main id="main" tabIndex={-1} className="minicamp-page">
        <header ref={headRef} className="page-header reveal">
          <div className="container">
            <nav className="breadcrumb" aria-label="面包屑">
              {onSubdomain ? (
                <a href="https://innoseed.club">{BRAND} 主站</a>
              ) : (
                <Link to="/">首页</Link>
              )}
              <span aria-hidden="true">/</span>
              <span aria-current="page">Mini Camp</span>
            </nav>
            <span className="eyebrow">{MINICAMP.eyebrow}</span>
            <h1>
              {MINICAMP.headline.lead} <em>{MINICAMP.headline.accent}</em>
            </h1>
            <p className="page-header-desc">{MINICAMP.lead}</p>
            <div className="minicamp-hero-cta">
              <Link to={MINICAMP.cta.href} className="btn btn-primary">
                <span>{MINICAMP.cta.label}</span>
                <span className="arrow">{MINICAMP.cta.arrow}</span>
              </Link>
            </div>
          </div>
        </header>

        <section className="minicamp-section">
          <div className="container">
            <div className="minicamp-paragraphs">
              {MINICAMP.paragraphs.map((html, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>
          </div>
        </section>

        <section className="minicamp-tracks">
          <div className="container">
            <span className="eyebrow">四路分头</span>
            <h2>
              按你的<em>擅长</em>选一条路。
            </h2>
            <div className="minicamp-track-grid">
              {MINICAMP.tracks.map((t) => (
                <article
                  key={t.pillarKey}
                  className={`minicamp-track pillar-${t.pillarKey}`}
                >
                  <header className="minicamp-track-head">
                    <span className="minicamp-track-num">
                      0{t.index}
                    </span>
                    <span className="minicamp-track-name">{t.name}</span>
                  </header>
                  <p className="minicamp-track-one">{t.one}</p>
                  <p className="minicamp-track-desc">{t.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {pastCamp && (
          <section className="minicamp-past">
            <div className="container">
              <span className="eyebrow">上一届</span>
              <h2>
                <em>{pastCamp.date}</em> · {pastCamp.title}
              </h2>
              <p className="minicamp-past-subtitle">{pastCamp.subtitle}</p>
              <p className="minicamp-past-body">{pastCamp.body}</p>
              <p className="minicamp-past-where">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {pastCamp.where}
              </p>
            </div>
          </section>
        )}

        <section className="minicamp-timeline">
          <div className="container">
            <span className="eyebrow">招新流程</span>
            <h2>
              走到 Mini Camp 之前的<em>三步</em>。
            </h2>
            <ol className="minicamp-timeline-list">
              {RECRUIT_EXTRAS.timeline.map((step) => (
                <li
                  key={step.index}
                  className={`minicamp-timeline-step pillar-${step.phase}`}
                >
                  <span className="minicamp-timeline-when">{step.when}</span>
                  <h3 className="minicamp-timeline-title">{step.title}</h3>
                  <p className="minicamp-timeline-desc">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="minicamp-cta">
          <div className="container">
            <h2>准备好来 Mini Camp 了?</h2>
            <p>
              填一份申请(几分钟),生成你的个性标签代码,
              再到飞书表单提交简历 + 标签。我们 3 天内回复是否进入 Mini Camp。
            </p>
            <div className="minicamp-cta-row">
              <Link to={MINICAMP.cta.href} className="btn btn-primary">
                <span>{MINICAMP.cta.label}</span>
                <span className="arrow">{MINICAMP.cta.arrow}</span>
              </Link>
              <a className="btn btn-ghost" href={`mailto:${CONTACT_EMAIL}`}>
                联系我们: {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>
      {onSubdomain ? <SubdomainFooter /> : <Footer />}
    </>
  );
}

/**
 * SubdomainHeader — 子域名下的极简头
 *
 * 只显示品牌 + 回主站入口。不放 Nav,因为这是 Mini Camp 专用页,
 * 让访客不被其他章节噪音干扰。
 */
function SubdomainHeader() {
  return (
    <header className="minicamp-subdomain-head">
      <div className="container">
        <a
          className="minicamp-subdomain-brand"
          href={typeof window !== 'undefined' ? window.location.href : '/'}
        >
          <span className="minicamp-subdomain-mark" aria-hidden="true">
            ◉
          </span>
          <span className="minicamp-subdomain-name">Mini Camp</span>
          <span className="minicamp-subdomain-of">of {BRAND}</span>
        </a>
        <a
          className="minicamp-subdomain-back"
          href={`https://${BRAND === 'InnOSeed' ? 'innoseed.club' : 'innoseed.club'}`}
          aria-label={`返回 ${BRAND} 主站`}
        >
          ← 主站
        </a>
      </div>
    </header>
  );
}

function SubdomainFooter() {
  return (
    <footer className="minicamp-subdomain-foot">
      <div className="container">
        <span>
          © {BRAND} Lab · Mini Camp 招新专用页
        </span>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
    </footer>
  );
}