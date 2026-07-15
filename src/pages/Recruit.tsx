import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Recruit from '../components/Recruit';
import useReveal from '../hooks/useReveal';
import usePageMeta from '../hooks/usePageMeta';

/**
 * /recruit — 独立"招新"页面
 *
 * 站外访问 innoseed.club/recruit 直接落地的页面。
 * 顶部 page-header 给一个明确标题 + 面包屑回首页,下面完整展开 Recruit
 * 组件的 hero / timeline / faqs 三段。
 */
export default function RecruitPage() {
  const headRef = useRef<HTMLElement | null>(null);
  useReveal(headRef);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Per-route SEO (stage-2 D1): title + description + canonical.
  usePageMeta({
    title: '招新 · InnOSeed Lab',
    description:
      '加入 InnOSeed 的招新流程与时间线 — 投递 + 简历初筛 / 1v1 面试 / Mini Camp / Offer。坚持小而精,每届 8 — 9 人。',
    canonical: '/recruit',
  });

  return (
    <main id="main" tabIndex={-1}>
      <header ref={headRef} className="page-header reveal">
        <div className="container">
          <nav className="breadcrumb" aria-label="面包屑">
            <Link to="/">首页</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">招新</span>
          </nav>
          <span className="eyebrow">Join Us · 2026 招新筹备中</span>
          <h1>
            加 入 <em>InnOSeed</em>
          </h1>
          <p className="page-header-desc">
            坚持小而精的发展路线,每届只固定招收 8 — 9 人,招生对象面向全校。
            我们没有硬性的招生标准 ——
            只希望能够和有着不同想法的你相遇。<br />
            <strong style={{ color: 'var(--brand)' }}>2026 招新时间表待定</strong> ——
            下方流程展示的是 2025 招新(已结束),作为参考。
          </p>
        </div>
      </header>
      <Recruit hideHero />
    </main>
  );
}