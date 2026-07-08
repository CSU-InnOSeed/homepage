import { useRef } from 'react';
import useReveal from '../hooks/useReveal';
import { MANIFESTO } from '../content/site';

export default function Manifesto() {
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  // Static number of paragraphs — declare refs explicitly (Rules of Hooks).
  const p1Ref = useRef<HTMLParagraphElement | null>(null);
  const p2Ref = useRef<HTMLParagraphElement | null>(null);
  const p3Ref = useRef<HTMLParagraphElement | null>(null);

  useReveal(eyebrowRef);
  useReveal(headRef, { threshold: 0.15 });
  useReveal(p1Ref, { threshold: 0.15 });
  useReveal(p2Ref, { threshold: 0.15 });
  useReveal(p3Ref, { threshold: 0.15 });

  const paragraphRefs = [p1Ref, p2Ref, p3Ref];

  return (
    <section className="manifesto" id="manifesto">
      <div className="container manifesto-inner">
        <div className="manifesto-label">
          <span ref={eyebrowRef} className="eyebrow reveal">
            {MANIFESTO.eyebrow}
          </span>
          <h2 ref={headRef} className="reveal" style={{ marginTop: 24 }}>
            {MANIFESTO.headline.map((line, i) => (
              <span key={i}>
                {line}
                {i < MANIFESTO.headline.length - 1 && <br />}
              </span>
            ))}
          </h2>
        </div>
        <div className="manifesto-body">
          {MANIFESTO.body.map((p, i) => (
            <p
              key={i}
              ref={paragraphRefs[i]}
              className="reveal"
              data-delay={String(i + 1)}
              dangerouslySetInnerHTML={{ __html: p.html }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
