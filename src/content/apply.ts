/**
 * Apply (招新) data — migrated from the SvelteKit home2022 (`test` branch
 * of CSU-InnOSeed/homepage). All copy in Chinese; emoji + Lucide-style
 * inline symbols stand in for the old PNG icon kit so we don't ship 60+
 * small image files.
 *
 * Mental model:
 *   - 4 tag categories, 1 'Mini Camp 分路' + '技术' + '兴趣' + '未来'
 *   - Each candidate picks tags; the system encodes their selection as
 *     a base64 string ("个性标签 code") that they can save and reference
 *     later.
 *   - 9 interviewers; each has tags. Match score = intersection of the
 *     candidate's picks with the interviewer's tags.
 *
 * NOTE: interviewer data below is the 2024 set. 2025 招新 season will
 * likely want a fresh list — that's a content edit in this file only.
 */

export type PillarKey = 'compete' | 'research' | 'startup' | 'bonds';

export interface ApplyTag {
  /** Display label, e.g. '智能体' / '算法' / '台球'. */
  name: string;
  /** Used for the 'Mini Camp 分路' category — picks a 4-direction colour. */
  pillarKey?: PillarKey;
  /** Single character or short label used as an icon stand-in. */
  glyph: string;
}

export interface ApplyCategory {
  /** Category key, used in the encoded code string. */
  key: 'lane' | 'tech' | 'play' | 'future';
  /** Section heading, e.g. '选择你的 Mini Camp 分路'. */
  title: string;
  /** Short subtitle shown next to the heading. */
  describe: string;
  /** Tag pool the candidate picks from. */
  options: ApplyTag[];
}

export interface Interviewer {
  /** Short handle / display name shown in the picker card. */
  code: string;
  /** Optional avatar image path under /imgs/. Empty string = initials. */
  avatar: string;
  /** One or two short intro lines, e.g. "我可以和你聊聊智能体、创业". */
  intros: string[];
  /** Tags this interviewer matches. Used to compute match score. */
  tags: { name: string }[];
  /** Hidden test interviewer (SvelteKit parity — 兼容旧 e2e). */
  signal?: boolean;
}

export const APPLY_CATEGORIES: ApplyCategory[] = [
  {
    key: 'lane',
    title: '选择你的 Mini Camp 分路',
    describe: '先定一条主路，再补充其他偏好',
    options: [
      { name: '产品创意', pillarKey: 'compete', glyph: '💡' },
      { name: '项目展示', pillarKey: 'startup', glyph: '🚀' },
      { name: '交互设计', pillarKey: 'bonds', glyph: '🎨' },
      { name: '技术达人', pillarKey: 'research', glyph: '⌨' },
    ],
  },
  {
    key: 'tech',
    title: '技术特长',
    describe: '按熟练度从高到低多选',
    options: [
      { name: '智能体', glyph: '🤖' },
      { name: '前端', glyph: '🖥' },
      { name: '后端', glyph: '🗄' },
      { name: '算法', glyph: '∑' },
      { name: '深度学习', glyph: '◐' },
      { name: '大模型', glyph: '✦' },
      { name: '计算机视觉', glyph: '◉' },
      { name: '数据优化', glyph: '◇' },
      { name: '逆向', glyph: '⇄' },
      { name: '科研', glyph: '✎' },
      { name: '创业', glyph: '✦' },
      { name: 'System', glyph: '⌥' },
      { name: '项目', glyph: '⬡' },
      { name: '交互设计', glyph: '◈' },
      { name: '流量管理', glyph: '⇆' },
      { name: 'Web3D', glyph: '◬' },
      { name: '医学图像', glyph: '✚' },
      { name: '测试', glyph: '◧' },
      { name: '密码学', glyph: '⚿' },
      { name: '可视化', glyph: '◫' },
      { name: '嵌入式', glyph: '⊞' },
      { name: '数据库', glyph: '⊟' },
    ],
  },
  {
    key: 'play',
    title: '兴趣爱好',
    describe: '挑点能一起玩的',
    options: [
      { name: '开源', glyph: '✪' },
      { name: '台球', glyph: '◉' },
      { name: '番剧', glyph: '◐' },
      { name: '文学', glyph: '✎' },
      { name: 'ESports', glyph: '◎' },
      { name: '旅游', glyph: '✈' },
      { name: '剧本杀', glyph: '⚇' },
      { name: '综艺', glyph: '◊' },
      { name: '咖啡', glyph: '☕' },
      { name: '干饭', glyph: '☖' },
      { name: '羽毛球', glyph: '⬭' },
      { name: '篮球', glyph: '◯' },
      { name: '游泳', glyph: '≈' },
      { name: '唱歌', glyph: '♪' },
      { name: '美术', glyph: '✎' },
      { name: '舞蹈', glyph: '✧' },
      { name: '桌游', glyph: '⬡' },
      { name: '睡觉', glyph: '☾' },
      { name: '撸猫', glyph: '🐱' },
      { name: '撸狗', glyph: '🐶' },
      { name: '轻小说', glyph: '✎' },
      { name: '乒乓球', glyph: '◯' },
      { name: '麻将', glyph: '⬢' },
      { name: '西洋棋', glyph: '♛' },
      { name: '魔术', glyph: '✦' },
      { name: '摄影', glyph: '◉' },
    ],
  },
  {
    key: 'future',
    title: '未来道路',
    describe: '半年到一年内的打算',
    options: [
      { name: '留学', glyph: '✈' },
      { name: '保研', glyph: '✓' },
      { name: '考研', glyph: '✎' },
      { name: '就业', glyph: '◇' },
      { name: '迷茫', glyph: '?' },
    ],
  },
];

/**
 * Interviewer roster (2024 set). Each interviewer's `tags` are matched
 * against the candidate's selected tag set; the top 3 (or all, if fewer)
 * appear in the '契合度匹配' step.
 */
export const INTERVIEWERS: Interviewer[] = [
  {
    code: 'Mr.Y',
    avatar: '',
    intros: ['我可以和你聊聊智能体、创业、算法、台球和撸猫', '我的 MBTI 为 : ENFJ'],
    tags: [
      { name: '智能体' }, { name: '创业' }, { name: '算法' }, { name: '台球' },
      { name: '撸猫' }, { name: '剧本杀' }, { name: '综艺' }, { name: '干饭' },
      { name: '羽毛球' }, { name: '摄影' }, { name: '唱歌' }, { name: '美术' },
      { name: '舞蹈' }, { name: '撸狗' }, { name: '桌游' }, { name: '睡觉' },
    ],
  },
  {
    code: 'Zency',
    avatar: '',
    intros: ['我可以和你聊聊前端、逆向、项目、就业、番剧与轻小说', '我的 MBTI 为 : INTJ'],
    tags: [
      { name: '前端' }, { name: '逆向' }, { name: '番剧' }, { name: '轻小说' }, { name: '就业' },
    ],
  },
  {
    code: 'DKK',
    avatar: '',
    intros: ['我可以和你聊聊前端、交互设计、项目、就业与 MOBA 游戏', '我的 MBTI 为 : INFJ'],
    tags: [
      { name: '前端' }, { name: '交互设计' }, { name: 'ESports' }, { name: '麻将' },
      { name: '就业' }, { name: '睡觉' },
    ],
  },
  {
    code: 'Leslie',
    avatar: '',
    intros: ['我可以和你聊聊后端、System、开源、西洋棋与魔术', '我的 MBTI 为 : INTP'],
    tags: [
      { name: '开源' }, { name: 'System' }, { name: '西洋棋' }, { name: '魔术' }, { name: '后端' },
    ],
  },
  {
    code: '007',
    avatar: '',
    intros: ['我可以和你聊聊深度学习、大模型、保研、科研与麻将', '我的 MBTI 为 : ISTJ'],
    tags: [
      { name: '深度学习' }, { name: '大模型' }, { name: '麻将' }, { name: '保研' },
    ],
  },
  {
    code: 'Jing',
    avatar: '',
    intros: ['我可以和你聊聊计算机视觉、深度强化学习、历史与时政', '我的 MBTI 为 : ISTJ'],
    tags: [
      { name: '计算机视觉' }, { name: '深度学习' }, { name: '文学' },
    ],
  },
  {
    code: 'HH',
    avatar: '',
    intros: ['我可以和你聊聊数据优化、旅游', '我的 MBTI 为 : ESFJ'],
    tags: [
      { name: '数据优化' }, { name: '旅游' },
    ],
  },
  {
    code: 'TT',
    avatar: '',
    intros: ['我可以和你聊聊流量管理、乒乓球', '我的 MBTI 为 : INTJ'],
    tags: [
      { name: '流量管理' }, { name: '乒乓球' },
    ],
  },
  {
    code: 'BarRaiser',
    avatar: '',
    intros: ['Catch Me If You Can'],
    tags: [{ name: '迷茫' }],
    signal: true,
  },
];

/**
 * Encode the candidate's selected tag indices into a base64 string.
 * Mirrors the SvelteKit `home2022` encoder so that v4 + legacy codes
 * are interoperable.
 *
 * Format: "0:1,2;1:3;2:5;3:1" (categoryIndex:tagIndices...)
 *   → base64
 */
export function encodeTagCode(selectedByCategory: number[][]): string {
  const codeString = selectedByCategory
    .map((indices, idx) => (indices.length > 0 ? `${idx}:${indices.join(',')}` : ''))
    .filter(Boolean)
    .join(';');
  // btoa is browser-only. In SSR (Vite build), it's also available in Node 16+.
  if (typeof btoa === 'undefined') {
    return Buffer.from(codeString, 'utf-8').toString('base64');
  }
  return btoa(codeString);
}

/**
 * Decode a base64 tag-code back into the per-category tag-index list.
 * Inverse of `encodeTagCode`. Returns null on malformed input.
 *
 * Used by:
 *   - /api/decode-tag (Vercel serverless) when a 飞书 Bitable row
 *     arrives with the candidate's code — we recover the structured
 *     selection so we can write it back into the Bitable's multi-select
 *     fields ("Mini Camp 选路" / "技术特长" / "兴趣爱好" / "未来道路").
 *   - any admin tool that wants to render a code as readable tags
 *     without re-implementing the format.
 */
export function decodeTagCode(code: string): number[][] | null {
  if (typeof code !== 'string' || code.length === 0) return null;
  // Special-case the "all-empty selection" encoding: encodeTagCode
  // produces an empty string when every category is empty, so the
  // resulting base64 is also empty. Treat that as a valid empty
  // selection rather than a malformed payload.
  if (code === '') {
    return APPLY_CATEGORIES.map(() => []);
  }
  let plain: string;
  try {
    // atob is browser; Buffer is Node. Mirror encodeTagCode's runtime check.
    if (typeof atob === 'undefined') {
      plain = Buffer.from(code, 'base64').toString('utf-8');
    } else {
      plain = atob(code);
    }
  } catch {
    return null;
  }
  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;
  // Pre-fill one empty bucket per known category so the result always
  // has length === APPLY_CATEGORIES.length even when the encoded form
  // omits empty categories (which encodeTagCode does).
  const result: number[][] = APPLY_CATEGORIES.map(() => []);
  for (const segment of plain.split(';')) {
    const [catStr, indicesStr] = segment.split(':');
    const catIdx = Number(catStr);
    if (!Number.isInteger(catIdx) || catIdx < 0 || catIdx >= APPLY_CATEGORIES.length) {
      return null;
    }
    const maxTag = APPLY_CATEGORIES[catIdx].options.length;
    const indices = indicesStr
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < maxTag);
    result[catIdx] = indices;
  }
  return result;
}

/**
 * Composed "apply code" — wraps the per-category tag selection AND
 * the picked interviewer handle into a single portable string.
 *
 * Format:  "{ivCode}|{base64TagCode}"
 *          ^^^^^^^^^  ^^^^^^^^^^^^^^
 *          optional   same encoding as encodeTagCode()
 *
 * The `|` separator is safe against the `;` and `:` already used inside
 * the base64 payload. When no interviewer was picked we use the literal
 * placeholder "_" so the pipe is always present and the parser doesn't
 * have to special-case the leading-token shape.
 *
 * This string is what the candidate copies from the Done step into the
 * 飞书 Bitable's "个性标签代码" field. /api/decode-tag then splits it
 * back into the two halves and writes structured values into the
 * Bitable's 4 multi-select fields + the "TA" Person field.
 */
export function encodeApplyCode(
  selectedByCategory: number[][],
  interviewerCode: string | null
): string {
  const iv = interviewerCode && interviewerCode.length > 0 ? interviewerCode : '_';
  return `${iv}|${encodeTagCode(selectedByCategory)}`;
}

/** Decoded shape of an apply code. */
export interface DecodedApplyCode {
  /** Interviewer code (e.g. "Mr.Y"), or null if the candidate skipped the pick. */
  interviewerCode: string | null;
  /** Per-category tag indices, length === APPLY_CATEGORIES.length. */
  tagIndices: number[][];
  /** Per-category human-readable tag names, length === APPLY_CATEGORIES.length. */
  tagNames: { lane: string[]; tech: string[]; play: string[]; future: string[] };
  /** Resolved interviewer record (from INTERVIEWERS), or null. */
  interviewer: Interviewer | null;
}

/**
 * Inverse of `encodeApplyCode`. Returns null on any structural error
 * (missing pipe, bad base64, out-of-range index, unknown interviewer).
 *
 * NOTE: the returned `tagNames` object uses the fixed category keys
 * `lane / tech / play / future` — these are the APPLY_CATEGORIES keys
 * and the keys the Bitable "multi-select" fields are conceptually
 * mapped onto. The mapping to the actual Bitable *field names*
 * (e.g. "Mini Camp 选路") is the caller's responsibility, since those
 * labels are 飞书-side UI choices that may change without touching
 * the encoding format.
 */
export function decodeApplyCode(code: string): DecodedApplyCode | null {
  if (typeof code !== 'string' || code.length === 0) return null;
  const sepIdx = code.indexOf('|');
  if (sepIdx <= 0) return null;
  const ivToken = code.slice(0, sepIdx);
  const b64 = code.slice(sepIdx + 1);
  const tagIndices = decodeTagCode(b64);
  if (tagIndices === null) return null;
  // Build per-category name lists, keyed by the APPLY_CATEGORIES key.
  const tagNames: DecodedApplyCode['tagNames'] = { lane: [], tech: [], play: [], future: [] };
  APPLY_CATEGORIES.forEach((cat, catIdx) => {
    const key = cat.key;
    for (const tagIdx of tagIndices[catIdx]) {
      const opt = cat.options[tagIdx];
      if (opt) tagNames[key].push(opt.name);
    }
  });
  const interviewerCode = ivToken === '_' ? null : ivToken;
  const interviewer =
    interviewerCode === null
      ? null
      : INTERVIEWERS.find((iv) => iv.code === interviewerCode) ?? null;
  // If the ivToken was non-empty but didn't match any interviewer, treat
  // as a structural error — the candidate was sent a corrupted code.
  if (interviewerCode !== null && interviewer === null) return null;
  return { interviewerCode, tagIndices, tagNames, interviewer };
}
