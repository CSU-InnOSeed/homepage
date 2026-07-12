import { useRef } from 'react';
import useReveal from '../hooks/useReveal';
import { trackEvent } from '../lib/observability';
import { EVENTS, type EventItem } from '../content/site';

interface EventsProps {
  /**
   * On the standalone /events page the page-header (in pages/Events.tsx)
   * already provides the eyebrow + headline + intro. Setting this to false
   * drops the duplicate in-section head so the page only shows one of them.
   * On the home page (where the section sits between #members and #recruit)
   * keep the default — there's no page-header above it.
   */
  showHead?: boolean;
}

/**
 * Events section — 时间倒序展示 InnOSeed 的活动 (upcoming 在前,past 在后)
 *
 * 视觉沿用 Pillars/Members:
 *   - 4 色 pillar accent (camp=research/talk=bonds/demo=startup/visit=compete)
 *   - hover: translateY(-6px) + box-shadow
 *   - reveal 动画 + data-delay
 *
 * Upcoming 卡片展示日期 + 地点 + (open) 报名按钮;
 * Past 卡片灰底处理,不展示 CTA。
 */
export default function Events({ showHead = true }: EventsProps = {}) {
  const headRef = useRef<HTMLDivElement | null>(null);
  useReveal(headRef);

  const upcoming = EVENTS.items.filter((e) => e.status === 'upcoming');
  const past = EVENTS.items.filter((e) => e.status === 'past');

  return (
    <section className="events" id="events">
      <div className="container">
        {showHead && (
          <div ref={headRef} className="events-head reveal">
            <span className="eyebrow">{EVENTS.eyebrow}</span>
            <h2>
              {EVENTS.headline.lead} <em>{EVENTS.headline.accent}</em>
            </h2>
            <p className="events-intro">{EVENTS.intro}</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="events-grid">
            {upcoming.map((ev, i) => (
              <EventCard key={ev.key} ev={ev} idx={i + 1} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <div className="events-divider">
              <span>往期回顾</span>
            </div>
            <div className="events-grid events-grid-past">
              {past.map((ev, i) => (
                <EventCard key={ev.key} ev={ev} idx={upcoming.length + i + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

interface EventCardProps {
  ev: EventItem;
  idx: number;
}

function EventCard({ ev, idx }: EventCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  useReveal(ref);

  const isUpcoming = ev.status === 'upcoming';

  return (
    <article
      ref={ref}
      className={`event-card reveal event-${ev.type}${isUpcoming ? '' : ' event-past'}`}
      data-delay={String(Math.min(idx, 6))}
    >
      <header className="event-head">
        <span className="event-type">
          <span className="event-type-dot" aria-hidden="true" />
          {ev.typeLabel}
        </span>
        {isUpcoming && ev.open && <span className="event-badge">开放报名</span>}
        {isUpcoming && !ev.open && <span className="event-badge event-badge-soon">即将开始</span>}
        {!isUpcoming && <span className="event-badge event-badge-past">已结束</span>}
      </header>

      <div className="event-date">{ev.date}</div>
      <h3 className="event-title">{ev.title}</h3>
      <p className="event-subtitle">{ev.subtitle}</p>
      <p className="event-body">{ev.body}</p>

      <footer className="event-foot">
        <span className="event-where">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
            className="event-pin"
          >
            <path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {ev.where}
        </span>
        {isUpcoming && ev.open && (
          <a
            className="event-cta"
            href="/apply"
            onClick={() => trackEvent('cta_external_click', { to: '/apply', from: ev.key })}
          >
            立即报名 <span className="arrow">→</span>
          </a>
        )}
      </footer>
    </article>
  );
}