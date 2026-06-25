// Marquee track is duplicated so the keyframe can translate -50% seamlessly.
// Items are repeated twice; CSS handles the loop.
const ITEMS = ['Different Thinkers', '竞赛 · 科研 · 创业 · 志合者', '中南大学 · 计算机学院'];

export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((dup) => (
          <span key={dup}>
            {ITEMS.map((item, i) => (
              <span key={`${dup}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 56 }}>
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
