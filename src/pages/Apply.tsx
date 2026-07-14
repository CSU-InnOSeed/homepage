import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  APPLY_CATEGORIES,
  INTERVIEWERS,
  encodeTagCode,
  type Interviewer,
} from '../content/apply';
import usePageMeta from '../hooks/usePageMeta';
import './Apply.css';

type StepKey = 'guide' | 'pick' | 'apply' | 'done';

const STEPS: { key: StepKey; idx: number; title: string }[] = [
  { key: 'guide', idx: 0, title: '01 — Guide' },
  { key: 'pick', idx: 1, title: '02 — Pick Interviewer' },
  { key: 'apply', idx: 2, title: '03 — Application' },
  { key: 'done', idx: 3, title: '04 — Done' },
];

export default function Apply() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>('guide');

  // Per-category selected tag indices. Length always === APPLY_CATEGORIES.length.
  const [selected, setSelected] = useState<number[][]>(() =>
    APPLY_CATEGORIES.map(() => [])
  );
  const [pickedInterviewer, setPickedInterviewer] = useState<Interviewer | null>(null);
  // After the form is submitted (POST /api/apply succeeded), we capture
  // the server-assigned code so the Done step can show it.
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const tagCode = useMemo(() => encodeTagCode(selected), [selected]);

  const toggleTag = useCallback((catIdx: number, tagIdx: number) => {
    setSelected((prev) => {
      const next = prev.map((arr) => arr.slice());
      const i = next[catIdx].indexOf(tagIdx);
      if (i >= 0) next[catIdx].splice(i, 1);
      else next[catIdx].push(tagIdx);
      return next;
    });
  }, []);

  const stepIdx = STEPS.find((s) => s.key === step)?.idx ?? 0;

  // Per-route title + description + canonical + noindex (stage-2 D1).
  // /apply is intentionally noindexed: it's an interactive flow that
  // shouldn't appear in search results, and there's nothing for a
  // searcher to land on directly (the form needs JS). The title
  // advances with each step so screen readers / tab strips reflect
  // progress.
  usePageMeta({
    title: `招新 · 第 ${stepIdx + 1} 步 · InnOSeed Lab`,
    description:
      '加入 InnOSeed 的申请流程:挑一位最想面聊的学长 / 学姐,选几行个性标签,生成你的"个性标签代码"。',
    canonical: '/apply',
    noindex: true,
  });

  return (
    <div className="apply-page">
      <header className="apply-header">
        <button
          type="button"
          className="apply-back"
          onClick={() => (step === 'guide' ? navigate('/') : setStep(STEPS[stepIdx - 1].key))}
          aria-label="返回"
        >
          ← 返回
        </button>
        <div className="apply-progress" role="tablist" aria-label="招新进度">
          {STEPS.map((s) => (
            <div
              key={s.key}
              className={`apply-step-pill ${s.idx === stepIdx ? 'is-current' : ''} ${s.idx < stepIdx ? 'is-done' : ''}`}
              role="tab"
              aria-selected={s.idx === stepIdx}
            >
              <span className="num">{String(s.idx + 1).padStart(2, '0')}</span>
              <span className="title">{s.title.replace(/^\d+\s—\s/, '')}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="apply-main">
        {step === 'guide' && (
          <GuideStep onNext={() => setStep('pick')} />
        )}
        {step === 'pick' && (
          <PickInterviewerStep
            selectedTags={selected}
            picked={pickedInterviewer}
            onPick={setPickedInterviewer}
            onBack={() => setStep('guide')}
            onNext={() => setStep('apply')}
          />
        )}
        {step === 'apply' && (
          <ApplicationStep
            selected={selected}
            onToggle={toggleTag}
            pickedInterviewer={pickedInterviewer}
            tagCode={tagCode}
            onBack={() => setStep('pick')}
            onSubmitted={(serverCode) => {
              setSubmittedCode(serverCode);
              setStep('done');
            }}
          />
        )}
        {step === 'done' && (
          <DoneStep
            tagCode={submittedCode ?? tagCode}
            interviewer={pickedInterviewer}
            onRestart={() => {
              setSelected(APPLY_CATEGORIES.map(() => []));
              setPickedInterviewer(null);
              setSubmittedCode(null);
              setStep('guide');
            }}
            onHome={() => navigate('/')}
          />
        )}
      </main>
    </div>
  );
}

// ─── Step 1: Guide ────────────────────────────────────────────────────

function GuideStep({ onNext }: { onNext: () => void }) {
  return (
    <section className="apply-section">
      <span className="eyebrow">01 — Guide</span>
      <h1>欢迎加入 InnOSeed。</h1>
      <p className="apply-lead">
        招新流程分四步：先看指引，然后选一位最想面聊的学长 / 学姐，
        再填几行标签（Mini Camp 分路 / 技术 / 兴趣 / 未来），最后把生成的"个性标签"复制保存，作为后续匹配的引用。
      </p>

      <div className="apply-cta-row">
        <button type="button" className="btn btn-primary" onClick={onNext}>
          开始 →
        </button>
      </div>
    </section>
  );
}

// ─── Step 2: Pick Interviewer ─────────────────────────────────────────

interface PickProps {
  selectedTags: number[][];
  picked: Interviewer | null;
  onPick: (i: Interviewer) => void;
  onBack: () => void;
  onNext: () => void;
}

function PickInterviewerStep({ selectedTags, picked, onPick, onBack, onNext }: PickProps) {
  const ranked = useMemo(() => {
    // match score = |picked tags ∩ interviewer tags|
    const flat = new Set(
      selectedTags.flatMap((catIdxArr, catIdx) =>
        catIdxArr.map((i) => APPLY_CATEGORIES[catIdx].options[i].name)
      )
    );
    return INTERVIEWERS
      .filter((iv) => !iv.signal)
      .map((iv) => ({
        iv,
        score: iv.tags.reduce((acc, t) => acc + (flat.has(t.name) ? 1 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score);
  }, [selectedTags]);

  return (
    <section className="apply-section">
      <span className="eyebrow">02 — Pick Interviewer</span>
      <h1>挑一位你最想面聊的。</h1>
      <p className="apply-lead">
        上面排在前面的，是跟你现有标签契合度更高的。还没选标签？没关系，先看他们的介绍，找到让你好奇的那位。
      </p>

      <div className="apply-interviewer-grid">
        {ranked.map(({ iv, score }) => (
          <button
            key={iv.code}
            type="button"
            className={`apply-interviewer-card ${picked?.code === iv.code ? 'is-picked' : ''}`}
            onClick={() => onPick(iv)}
            aria-pressed={picked?.code === iv.code}
          >
            <div className="apply-interviewer-avatar" aria-hidden="true">
              {iv.code.slice(0, 2).toUpperCase()}
            </div>
            <div className="apply-interviewer-body">
              <div className="apply-interviewer-head">
                <span className="apply-interviewer-code">{iv.code}</span>
                {score > 0 && <span className="apply-interviewer-score">契合度 {score}</span>}
              </div>
              {iv.intros.map((line, i) => (
                <p key={i} className="apply-interviewer-intro">{line}</p>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="apply-cta-row">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← 上一步
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!picked}
          aria-disabled={!picked}
        >
          下一步：填申请 →
        </button>
      </div>
    </section>
  );
}

// ─── Step 3: Application ──────────────────────────────────────────────

interface ApplyProps {
  selected: number[][];
  onToggle: (catIdx: number, tagIdx: number) => void;
  pickedInterviewer: Interviewer | null;
  tagCode: string;
  onBack: () => void;
  onSubmitted: (serverCode: string) => void;
}

function ApplicationStep({
  selected,
  onToggle,
  pickedInterviewer,
  tagCode,
  onBack,
  onSubmitted,
}: ApplyProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tagCode,
          interviewer: pickedInterviewer?.code ?? null,
          // Flatten per-category arrays into a single list of {category, tag}
          // records — the API contract is one item per picked tag, not a
          // nested array. flatMap drops empty per-category arrays naturally.
          selections: selected.flatMap((arr, catIdx) =>
            arr.map((i) => ({
              category: APPLY_CATEGORIES[catIdx].key,
              tag: APPLY_CATEGORIES[catIdx].options[i].name,
            }))
          ),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { code: string };
      onSubmitted(data.code);
    } catch (e) {
      setSubmitError((e as Error).message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [tagCode, pickedInterviewer, selected, onSubmitted]);

  return (
    <form
      className="apply-section"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span className="eyebrow">03 — Application</span>
      <h1>选你的标签。</h1>
      <p className="apply-lead">
        Mini Camp 分路必选一项；技术 / 兴趣 / 未来可多选，按熟练度从高到低排。
      </p>

      {APPLY_CATEGORIES.map((cat, catIdx) => (
        <fieldset key={cat.key} className="apply-category">
          <legend>
            <span className="num">{String(catIdx + 1).padStart(2, '0')}</span>
            <span>
              <strong>{cat.title}</strong>
              <em className="apply-category-describe"> — {cat.describe}</em>
            </span>
          </legend>
          <div className="apply-tag-grid">
            {cat.options.map((tag, tagIdx) => {
              const isOn = selected[catIdx].includes(tagIdx);
              return (
                <button
                  key={tag.name}
                  type="button"
                  className={`apply-tag ${isOn ? 'is-on' : ''} ${tag.pillarKey ? `pillar-${tag.pillarKey}` : ''}`}
                  onClick={() => onToggle(catIdx, tagIdx)}
                  aria-pressed={isOn}
                >
                  <span className="glyph" aria-hidden="true">{tag.glyph}</span>
                  <span className="label">{tag.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {submitError && <p className="apply-error" role="alert">{submitError}</p>}

      <div className="apply-cta-row">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={submitting}>
          ← 上一步
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={submit}
          disabled={submitting || selected[0].length === 0}
          aria-disabled={submitting || selected[0].length === 0}
        >
          {submitting ? '提交中…' : '生成个性标签代码 →'}
        </button>
      </div>
    </form>
  );
}

// ─── Step 4: Done ─────────────────────────────────────────────────────

function DoneStep({
  tagCode,
  interviewer,
  onRestart,
  onHome,
}: {
  tagCode: string;
  interviewer: Interviewer | null;
  onRestart: () => void;
  onHome: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(tagCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [tagCode]);

  return (
    <section className="apply-section apply-done">
      <span className="eyebrow">04 — Done</span>
      <h1>你的个性标签已生成。</h1>
      <p className="apply-lead">
        复制下面的代码保存下来，作为后续 InnOSeed 联系 / 群组匹配的引用 ID
        {interviewer && <>。你选的面聊官是 <strong>{interviewer.code}</strong>。</>}
      </p>

      <div className="apply-code-card" onClick={copy} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && copy()}>
        <code>{tagCode || '（未选任何标签）'}</code>
        <span className="apply-code-hint">{copied ? '✓ 已复制' : '点击复制'}</span>
      </div>

      <p className="apply-small">
        我们会通过飞书 / 邮件 / 群组联系你；期间不需要重复填这个表单。
      </p>

      <div className="apply-cta-row">
        <button type="button" className="btn btn-ghost" onClick={onRestart}>
          再填一份（不同邮箱）
        </button>
        <button type="button" className="btn btn-primary" onClick={onHome}>
          回到首页
        </button>
      </div>

      <div className="apply-callout">
        <h2>下一步 — 投递简历</h2>
        <p>
          个性标签生成完成，接下来请把简历投到飞书表单（必填，InnOSeed 通过简历 + 标签做综合评估）。
          飞书表单提交后我们会尽快与你联系。
        </p>
        <a
          className="btn btn-primary"
          href="https://innoseed.feishu.cn/share/base/form/shrcniLVwjL5Q2Ce4zchI6L3KFf"
          target="_blank"
          rel="noopener"
        >
          投递简历 (飞书表单) ↗
        </a>
      </div>
    </section>
  );
}
