/**
 * Self-contained tag-code encode/decode, used only by the serverless
 * `api/apply.ts` and `api/decode-tag.ts` functions.
 *
 * Why a copy of the `src/content/apply.ts` logic and not an import?
 *   Vercel Functions compile `api/*.ts` via esbuild with a project-root
 *   `tsconfig.json` whose `include: ["src"]` does NOT cover the api
 *   files. Cross-directory `import "../src/content/apply"` is treated
 *   as outside the module graph and the build either fails to resolve
 *   the symbol or produces a partial CJS wrapper that crashes at
 *   runtime ("FUNCTION_INVOCATION_FAILED"). Keeping the helpers in
 *   `api/` avoids the path trip.
 *
 *   The frontend (Apply.tsx) continues to import the canonical
 *   implementation from `src/content/apply.ts` — when the format
 *   changes, BOTH files must be updated.
 *
 * Format reminder:  "{ivCode}|{base64TagCode}"
 *   ivCode is optional; "_" is the placeholder for "no pick".
 *   base64TagCode is base64("0:1,2;1:3;2:5;3:1") — see the encoder.
 */

export interface PillarKeyMap {
  compete: 'compete';
  research: 'research';
  startup: 'startup';
  bonds: 'bonds';
}

export interface ApplyTag {
  name: string;
  pillarKey?: keyof PillarKeyMap;
  glyph: string;
}

export interface ApplyCategory {
  key: 'lane' | 'tech' | 'play' | 'future';
  title: string;
  describe: string;
  options: ApplyTag[];
}

export interface Interviewer {
  code: string;
  avatar: string;
  intros: string[];
  tags: { name: string }[];
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

export const INTERVIEWERS: Interviewer[] = [
  {
    code: 'Mr.Y', avatar: '',
    intros: ['我可以和你聊聊智能体、创业、算法、台球和撸猫', '我的 MBTI 为 : ENFJ'],
    tags: [
      { name: '智能体' }, { name: '创业' }, { name: '算法' }, { name: '台球' },
      { name: '撸猫' }, { name: '剧本杀' }, { name: '综艺' }, { name: '干饭' },
      { name: '羽毛球' }, { name: '摄影' }, { name: '唱歌' }, { name: '美术' },
      { name: '舞蹈' }, { name: '撸狗' }, { name: '桌游' }, { name: '睡觉' },
    ],
  },
  {
    code: 'Zency', avatar: '',
    intros: ['我可以和你聊聊前端、逆向、项目、就业、番剧与轻小说', '我的 MBTI 为 : INTJ'],
    tags: [
      { name: '前端' }, { name: '逆向' }, { name: '番剧' }, { name: '轻小说' }, { name: '就业' },
    ],
  },
  {
    code: 'DKK', avatar: '',
    intros: ['我可以和你聊聊前端、交互设计、项目、就业与 MOBA 游戏', '我的 MBTI 为 : INFJ'],
    tags: [
      { name: '前端' }, { name: '交互设计' }, { name: 'ESports' }, { name: '麻将' },
      { name: '就业' }, { name: '睡觉' },
    ],
  },
  {
    code: 'Leslie', avatar: '',
    intros: ['我可以和你聊聊后端、System、开源、西洋棋与魔术', '我的 MBTI 为 : INTP'],
    tags: [
      { name: '开源' }, { name: 'System' }, { name: '西洋棋' }, { name: '魔术' }, { name: '后端' },
    ],
  },
  {
    code: '007', avatar: '',
    intros: ['我可以和你聊聊深度学习、大模型、保研、科研与麻将', '我的 MBTI 为 : ISTJ'],
    tags: [
      { name: '深度学习' }, { name: '大模型' }, { name: '麻将' }, { name: '保研' },
    ],
  },
  {
    code: 'Jing', avatar: '',
    intros: ['我可以和你聊聊计算机视觉、深度强化学习、历史与时政', '我的 MBTI 为 : ISTJ'],
    tags: [
      { name: '计算机视觉' }, { name: '深度学习' }, { name: '文学' },
    ],
  },
  {
    code: 'HH', avatar: '',
    intros: ['我可以和你聊聊数据优化、旅游', '我的 MBTI 为 : ESFJ'],
    tags: [
      { name: '数据优化' }, { name: '旅游' },
    ],
  },
  {
    code: 'TT', avatar: '',
    intros: ['我可以和你聊聊流量管理、乒乓球', '我的 MBTI 为 : INTJ'],
    tags: [
      { name: '流量管理' }, { name: '乒乓球' },
    ],
  },
  {
    code: 'BarRaiser', avatar: '',
    intros: ['Catch Me If You Can'],
    tags: [{ name: '迷茫' }],
    signal: true,
  },
];

/** Base64-encode (browser-compatible btoa, Node 18+ global). */
function b64encode(s: string): string {
  if (typeof btoa === 'undefined') {
    return Buffer.from(s, 'utf-8').toString('base64');
  }
  return btoa(s);
}

function b64decode(s: string): string {
  if (s === '') return '';
  if (typeof atob === 'undefined') {
    return Buffer.from(s, 'base64').toString('utf-8');
  }
  return atob(s);
}

export function encodeTagCode(selectedByCategory: number[][]): string {
  const codeString = selectedByCategory
    .map((indices, idx) => (indices.length > 0 ? `${idx}:${indices.join(',')}` : ''))
    .filter(Boolean)
    .join(';');
  return b64encode(codeString);
}

export function decodeTagCode(code: string): number[][] | null {
  if (typeof code !== 'string' || code.length === 0) return null;
  if (code === '') return APPLY_CATEGORIES.map(() => []);
  let plain: string;
  try {
    plain = b64decode(code);
  } catch {
    return null;
  }
  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;
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

export function encodeApplyCode(
  selectedByCategory: number[][],
  interviewerCode: string | null
): string {
  const iv = interviewerCode && interviewerCode.length > 0 ? interviewerCode : '_';
  return `${iv}|${encodeTagCode(selectedByCategory)}`;
}

export interface DecodedApplyCode {
  interviewerCode: string | null;
  tagIndices: number[][];
  tagNames: { lane: string[]; tech: string[]; play: string[]; future: string[] };
  interviewer: Interviewer | null;
}

export function decodeApplyCode(code: string): DecodedApplyCode | null {
  if (typeof code !== 'string' || code.length === 0) return null;
  const sepIdx = code.indexOf('|');
  if (sepIdx <= 0) return null;
  const ivToken = code.slice(0, sepIdx);
  const b64 = code.slice(sepIdx + 1);
  const tagIndices = decodeTagCode(b64);
  if (tagIndices === null) return null;
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
  if (interviewerCode !== null && interviewer === null) return null;
  return { interviewerCode, tagIndices, tagNames, interviewer };
}
