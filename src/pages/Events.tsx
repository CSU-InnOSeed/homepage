import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Events from '../components/Events';
import { EVENTS } from '../content/site';
import useReveal from '../hooks/useReveal';
import usePageMeta from '../hooks/usePageMeta';

/**
 * /events — 独立"活动"页面
 *
 * 站外访问 innoseed.club/events 直接落地的页面。
 * 顶部 page-header 给一个明确标题 + 面包屑回首页,跟首页 #events
 * anchor 体验区分开。下面复用 Events 组件本身,内容零重复。
 */
export default function EventsPage() {
  const headRef = useRef<HTMLElement | null>(null);
  useReveal(headRef);

  // Scroll to top on mount — arriving from another route shouldn't keep
  // the user mid-page from wherever they were before.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Per-route SEO (stage-2 D1): title + description + canonical. Description
  // is hand-tuned for /events — the home page description is shorter.
  usePageMeta({
    title: '活动 · InnOSeed Lab',
    description:
      'InnOSeed 的活动:招新季 Mini Camp、tech talk、企业参访。了解上一届招新是怎么跑的。',
    canonical: '/events',
  });

  return (
    <main id="main" tabIndex={-1}>
      <header ref={headRef} className="page-header reveal">
        <div className="container">
          <nav className="breadcrumb" aria-label="面包屑">
            <Link to="/">首页</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">活动</span>
          </nav>
          <span className="eyebrow">{EVENTS.eyebrow}</span>
          <h1>
            {EVENTS.headline.lead} <em>{EVENTS.headline.accent}</em>
          </h1>
          <p className="page-header-desc">{EVENTS.intro}</p>
        </div>
      </header>
      <Events showHead={false} />
    </main>
  );
}