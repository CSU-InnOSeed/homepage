import { MARQUEE_ITEMS } from '../content/site.js';

/**
 * Marquee — infinitely scrolling strip.
 *
 * Track is duplicated so the keyframe can translate -50% seamlessly.
 * `aria-hidden` because the strip is decorative; the same info is in the
 * Manifesto body for screen readers.
 */
export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((dup) => (
          <span key={dup}>
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={`${dup}-${i}`}>
                <span>{item}</span>
                <span className="dot" />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
