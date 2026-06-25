import { useRef } from 'react';
import useReveal from '../hooks/useReveal.js';

export default function Inside() {
  const imageRef = useRef(null);
  const textRef = useRef(null);
  useReveal(imageRef);
  useReveal(textRef);

  return (
    <section className="inside">
      <div className="container inside-grid">
        <div ref={imageRef} className="inside-image reveal">
          <img
            src="/imgs/group-photo.jpeg"
            alt="在 InnOSeed 做你想做的"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div ref={textRef} className="inside-text reveal" data-delay="1">
          <span className="eyebrow">05 — Inside The Lab</span>
          <h2 style={{ marginTop: 24 }}>
            在 InnOSeed<br /><em>做你想做的。</em>
          </h2>
          <p>
            InnOSeed 有许多与企业合作，为中南大学尤其是计算机学院的同学提供有意思的活动沙龙。
          </p>
          <p>
            我们联络<strong>优秀的业界前辈</strong>举行 tech talk，为同学们答疑解惑、指点迷津；
            成员们也在各项活动与学术学习中大放异彩。
          </p>
          <p>欢迎到我们各平台的账号了解我们的最新成果。</p>
          <div className="links">
            <a
              className="icon-link"
              href="https://blog.csdn.net/cyl_csdn_1"
              target="_blank"
              rel="noopener"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4h16v16H4z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
              <span>CSDN 博客</span>
            </a>
            <a
              className="icon-link"
              href="https://github.com/CSU-InnOSeed"
              target="_blank"
              rel="noopener"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.87-1.37-3.87-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
