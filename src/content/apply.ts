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
