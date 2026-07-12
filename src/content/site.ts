/**
 * Site content — single source of truth for all on-page copy.
 *
 * Why this lives here:
 *   - Editing copy should not require touching component JSX
 *   - Localizing (i18n) one day means swapping the import, not grepping strings
 *   - Reviewers / non-engineers can review copy as a data diff
 *
 * Conventions:
 *   - `*_en` fields are English brand / category labels (always present)
 *   - Hero headline is a string (single sentence)
 *   - Manifesto body is an array of paragraphs (preserves stagger)
 *   - Pillar / Member / Stat objects stay grouped so the rendering site
 *     can pick the shape once and map it.
 */

// ─── Types ─────────────────────────────────────────────────────────────

export type PillarKey = 'compete' | 'research' | 'startup' | 'bonds';

export interface Pillar {
  key: PillarKey;
  en: string;
  name: string;
  desc: string;
}

export interface Stat {
  key: string;
  label: string;
  target: number;
  suffix: string;
  unit: string;
  meta: string[];
  period: string;
}

export interface Member {
  tag: string;
  name: string;
  title: string;
  items: string[];
}

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface FooterLink {
  href?: string;
  label: string;
  external?: boolean;
  plain?: boolean;
}

export interface ManifestoBody {
  html: string;
}

export interface Headline {
  text?: string;
  lead?: string;
  trail?: string;
}

export interface ManifestoData {
  eyebrow: string;
  headline: string[];
  body: ManifestoBody[];
}

export interface HeroCta {
  label: string;
  arrow: string;
  href: string;
}

export interface HeroData {
  tag: string;
  lead: string;
  headlineRows: Headline[];
  sub: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}

export interface RecruitData {
  eyebrow: string;
  headline: { lead: string; accent: string };
  body: string;
  meta: string;
  cta: HeroCta;
}

/** 单条 FAQ。answer 支持 innerHTML(用 .map 后渲染时 dangerouslySetInnerHTML) */
export interface RecruitFaq {
  q: string;
  a: string;
}

/** 招新时间线节点。phase 决定卡片左侧的色条颜色。 */
export interface RecruitTimelineStep {
  phase: 'compete' | 'research' | 'startup' | 'bonds';
  /** 序号,1-based */
  index: number;
  /** 时间窗口(展示用) */
  when: string;
  /** 节点标题 */
  title: string;
  /** 节点描述 */
  desc: string;
}

/** 单条活动。type 决定色条/徽章配色 (复用 4 pillar accent)。 */
export interface EventItem {
  /** 唯一 key */
  key: string;
  /** 状态:'upcoming' 展示 '即将开始' 徽章;'past' 灰底展示。 */
  status: 'upcoming' | 'past';
  /** 活动类型 — 决定配色 + 图标 */
  type: 'camp' | 'talk' | 'demo' | 'visit' | 'open';
  /** 活动类型中文名(显示) */
  typeLabel: string;
  /** 活动日期,自由格式(展示用) */
  date: string;
  /** 活动标题 */
  title: string;
  /** 活动副标题/一句概括 */
  subtitle: string;
  /** 详细描述 (1-2 段) */
  body: string;
  /** 地点/形式 (线上/线下/具体地址) */
  where: string;
  /** 是否开放报名 — 仅 upcoming + open=true 时显示按钮 */
  open?: boolean;
}

export interface EventsData {
  eyebrow: string;
  headline: { lead: string; accent: string };
  intro: string;
  /** 最新 upcoming 最多展示几张 (其他折叠/滑动) */
  items: EventItem[];
}

export interface RecruitExtras {
  /** 招新时间线 — 4 步 */
  timeline: RecruitTimelineStep[];
  /** FAQ — 常见问题 */
  faqs: RecruitFaq[];
}

export interface InsideLink {
  href: string;
  label: string;
}

export interface InsideData {
  eyebrow: string;
  headline: string[];
  paragraphs: string[];
  links: InsideLink[];
}

export interface NumbersHead {
  eyebrow: string;
  headline: string[];
  footerLabel: string;
  footerText: string;
}

export interface FooterData {
  brand: string;
  tagline: string[];
  copyright: string;
  navHeading: string;
  navLinks: NavLink[];
  contactHeading: string;
  contactLinks: FooterLink[];
  bottomLinks: NavLink[];
}

// Site-wide constants used outside the section data objects (e.g. the 404
// page) so they live in one place. Mirrors the values used in BRAND copy.
export const BRAND = 'InnOSeed';
export const CONTACT_EMAIL = 'contact@innoseed.club';

export interface MetaData {
  title: string;
  description: string;
  themeColor: string;
  ogImage: string;
  ogImageAlt: string;
}

// ─── Data ──────────────────────────────────────────────────────────────

export const META: MetaData = {
  title: 'InnOSeed Lab · 中南大学计算机学院',
  description:
    'InnOSeed Lab — 中南大学计算机学院的创新实验室。我们更像俱乐部，属于 different thinkers 的俱乐部。',
  themeColor: '#1C64F2',
  ogImage: '/imgs/og-cover.png',
  ogImageAlt: 'InnOSeed Lab — Different Thinkers 的俱乐部',
};

export const NAV_LINKS: NavLink[] = [
  { href: '#manifesto', label: '关于' },
  { href: '#pillars', label: '方向' },
  { href: '#numbers', label: '成果' },
  { href: '#members', label: '代表' },
  { href: '#events', label: '活动' },
  { href: '#recruit', label: '招新' },
];

export const HERO: HeroData = {
  tag: 'CSU InnOSeed Lab · est. 2019',
  lead: '我们更像俱乐部，属于 different thinkers 的俱乐部。',
  // 2 fixed rows; the accent em sits on "在 InnOSeed" so the brand
  // name is the visual anchor of the headline. Row 2 is plain text.
  // (Originally 3 rows with "在" alone on row 1 — looked like a typo;
  //  the v3 design also places the brand word in the colored em.)
  headlineRows: [
    { lead: '在 InnOSeed', trail: '，' },
    { text: '你想做的。' },
  ],
  sub:
    '中南大学计算机学院 · 一个以种子为名、靠不同想法长成一片林的实验室。\n竞赛 · 科研 · 创业 · 志合者 — 四个方向，一条共同的路。',
  primaryCta: { label: '了解方向', arrow: '→', href: '#pillars' },
  secondaryCta: { label: '申请加入', arrow: '↗', href: '#recruit' },
};

export const MARQUEE_ITEMS: string[] = [
  'Different Thinkers',
  '竞赛 · 科研 · 创业 · 志合者',
  '中南大学 · 计算机学院',
];

export const MANIFESTO: ManifestoData = {
  eyebrow: '01 — Manifesto',
  headline: ['一 所', '不 太 一 样', '的 实 验 室。'],
  body: [
    {
      html: 'InnOSeed 不是另一个学生组织，<span class="hl">而是一个"实验室"</span>——小而精，每届只收 8–9 个人，面向全校。',
    },
    {
      html:
        '我们没有硬性的招生标准，没有强制打卡，没有 KPI 表格。我们相信一件事：让有不同想法的人相遇，他们自己会知道接下来要做什么。',
    },
    {
      html:
        '在竞赛里被逼出过极限，在科研里求证过细微的真相，在创业里把想法第一次推到市场前；也在某个傍晚的露台上，和一群同路人喝完一整壶咖啡。<br/><br/>这四件事都叫 <span class="hl">"做你想做的"</span>。只是我们一起做。',
    },
  ],
};

export const PILLARS: Pillar[] = [
  {
    key: 'compete',
    en: 'Compete',
    name: '竞赛',
    desc: '参与竞赛，培养综合素质——以赛代练，逼出最好的自己。',
  },
  {
    key: 'research',
    en: 'Research',
    name: '科研',
    desc: '纵深发展，探求真理与奥秘——在某一寸土地上挖到深处。',
  },
  {
    key: 'startup',
    en: 'Startup',
    name: '创业',
    desc: '进入市场，点燃创业理想——把想法第一次推到现实里检验。',
  },
  {
    key: 'bonds',
    en: 'Bonds',
    name: '志合者',
    desc: '莫愁前路无知己——找到一群同路人，比任何奖项都更难得。',
  },
];

export const NUMBERS_HEAD: NumbersHead = {
  eyebrow: '03 — By The Numbers',
  headline: ['不靠口号，', '靠这组数字。'],
  footerLabel: '04 — Grad School / Exchange',
  footerText: '5 清华 · 2 北大 · 1 斯坦福 · 3 QS 前 100 交换',
};

export const STATS: Stat[] = [
  {
    key: 'c-purple',
    label: 'National / Intl. 1st Prize',
    target: 10,
    suffix: '',
    unit: '人次',
    meta: ['国家 / 国际级一等奖', '含金量最高的那一档'],
    period: '2019 — 2025',
  },
  {
    key: 'c-amber',
    label: 'National Scholarship',
    target: 13,
    suffix: '',
    unit: '人次',
    meta: ['国家奖学金', '学业与综合素质的双重肯定'],
    period: '累计',
  },
  {
    key: 'c-green',
    label: 'National Honors',
    target: 64,
    suffix: '',
    unit: '项',
    meta: ['国家级荣誉', '含竞赛、科研、创业多个赛道'],
    period: '累计',
  },
  {
    key: 'c-cyan',
    label: 'Awards In Total',
    target: 140,
    suffix: '+',
    unit: '',
    meta: ['校级以上荣誉', '每一份都不该被忽略'],
    period: '2019 — 2025',
  },
];

export const MEMBERS: Member[] = [
  {
    tag: '升学代表',
    name: '苗子阳',
    title: '中南大学年度人物 · 优秀学生标兵',
    items: ['中南大学年度人物', '优秀学生标兵', '保研至中南大学'],
  },
  {
    tag: '留学代表',
    name: '常佳宇',
    title: 'RoboCup 世界一等奖 · 斯坦福大学深造',
    items: ['RoboCup 世界一等奖', '前往斯坦福大学深造'],
  },
  {
    tag: '竞赛代表',
    name: '颜思宇',
    title: '国家级竞赛奖项 12 项 · 省级 20 余项',
    items: ['国家级竞赛奖项 12 项', '省级奖项 20 余项', '获省级竞赛最高荣誉'],
  },
];

export const INSIDE: InsideData = {
  eyebrow: '05 — Inside The Lab',
  headline: ['在 InnOSeed', '做你想做的。'],
  paragraphs: [
    'InnOSeed 有许多与企业合作，为中南大学尤其是计算机学院的同学提供有意思的活动沙龙。',
    '我们联络<strong>优秀的业界前辈</strong>举行 tech talk，为同学们答疑解惑、指点迷津；成员们也在各项活动与学术学习中大放异彩。',
    '欢迎到我们各平台的账号了解我们的最新成果。',
  ],
  links: [
    { href: 'https://blog.csdn.net/cyl_csdn_1', label: 'CSDN 博客' },
    { href: 'https://github.com/CSU-InnOSeed', label: 'GitHub' },
  ],
};

export const RECRUIT: RecruitData = {
  eyebrow: '06 — Join Us',
  headline: { lead: '加 入', accent: 'InnOSeed' },
  body: '坚持小而精的发展路线，每届只固定招收 8 — 9 人，招生对象面向全校。我们没有硬性的招生标准。',
  meta: '— 只希望能够和有着不同想法的你相遇。',
  cta: { label: '立即申请 · Apply Now', arrow: '→', href: '/apply' },
};

export const FOOTER: FooterData = {
  brand: 'InnOSeed',
  tagline: ['中南大学计算机学院 · 一个以种子为名的实验室。', 'different thinkers 的俱乐部。'],
  copyright: '© 2025 InnOSeed Lab. 保留所有权利.',
  navHeading: '导航',
  navLinks: [
    { href: '#manifesto', label: '关于实验室' },
    { href: '#pillars', label: '四大方向' },
    { href: '#members', label: '代表人物' },
    { href: '#events', label: '活动预告' },
    { href: '#recruit', label: '招新' },
  ],
  contactHeading: '联系我们',
  contactLinks: [
    { href: 'mailto:contact@innoseed.club', label: 'contact@innoseed.club' },
    { label: '微信号: wpcwzy1', plain: true },
    { href: 'https://github.com/CSU-InnOSeed', label: 'GitHub · CSU-InnOSeed', external: true },
    { href: 'https://blog.csdn.net/cyl_csdn_1', label: 'CSDN · cyl_csdn_1', external: true },
  ],
  bottomLinks: [
    { href: '#top', label: '回到顶部 ↑' },
    { href: 'mailto:contact@innoseed.club', label: 'contact@innoseed.club' },
  ],
};

/**
 * 活动(Events) — 时间倒序排列,upcoming 在前。
 *
 * type 字段使用与 PILLARS 一致的色板:
 *   camp   → research (深绿)
 *
 * 现状(2026 年 7 月):2025 招新季只办了一个 Mini Camp(9 月 · 一个白天),
 * 没有宣讲,没有面试开放日,统一标 'past'。
 *
 * 2026 招新形式还在定,等定了再加新条目,不要凭印象提前占位。
 *
 * 添加新活动:在这里加一条即可,渲染端 (Events.tsx) 会自动渲染。
 * 若需要更多自定义字段(报名链接/海报图),扩展 EventItem 接口。
 */
export const EVENTS: EventsData = {
  eyebrow: '07 — What\'s On',
  headline: { lead: '上一届', accent: 'InnOSeed' },
  intro: '上一届招新季(2025 秋季)只办了一个 Mini Camp。2026 招新正在筹备中,形式待定 —— 关注我们获取最新信息。',
  items: [
    {
      key: 'mini-camp-fall-2025',
      status: 'past',
      type: 'camp',
      typeLabel: 'Mini Camp',
      date: '2025 · 09',
      title: '2025 秋季 Mini Camp',
      subtitle: '一个白天 · 9 月举行',
      body: 'InnOSeed 招新不做宣讲 —— 候选人直接聚到一起,一个白天跑完 Mini Camp。每届固定 8-9 人,4 路分头(产品 / 技术 / 设计 / 创业),每路 2-3 人组队,产出原型 + 现场 Demo + 当场反馈。',
      where: '具体地点见当时通知',
    },
  ],
};

/**
 * 招新增强 — 时间线 + FAQ
 *
 * timeline 沿用 PILLARS 的 4 色 accent 给每个阶段配色。
 * faqs 短小精悍,每条不超过 2 行。
 *
 * 当前显示的是 2025 招新流程(已结束,作为参考)。
 * 2026 招新时间表待定 — 访问者看到的是历史参考,实际时间以当年通知为准。
 */
export const RECRUIT_EXTRAS: RecruitExtras = {
  timeline: [
    {
      phase: 'compete',
      index: 1,
      when: '2025 · 09',
      title: '投递 + 简历初筛',
      desc: '提交个性标签代码,选择 1 位契合度最高的面试官。我们 3 天内回复是否进入下一轮。',
    },
    {
      phase: 'research',
      index: 2,
      when: '2025 · 09',
      title: '1v1 面试 · 30 分钟',
      desc: '与你选的面试官一对一聊聊。问题不背题,重点看你怎么思考和怎么表达。',
    },
    {
      phase: 'startup',
      index: 3,
      when: '2025 · 09',
      title: 'Mini Camp · 一个白天',
      desc: '候选人聚到一起,4 路分头(产品 / 技术 / 设计 / 创业)做一个原型 + 现场 Demo + 当场反馈。这是我们判断"能不能一起做事"的最终环节。',
    },
    {
      phase: 'bonds',
      index: 4,
      when: '2025 · 09',
      title: '正式 offer',
      desc: 'Mini Camp 之后 3 天内发出 offer。从此刻起,InnOSeed 是你的另一个家。',
    },
  ],
  faqs: [
    {
      q: '招新有硬性门槛吗?',
      a: '没有。我们不看出身 / 不看绩点 / 不看你简历上写了几行字,只看你在 4 个方向里有没有一件认真做过的事。',
    },
    {
      q: '我大一 / 非计算机 / 完全没有竞赛经验,可以来吗?',
      a: '面向全校,不限年级、不限学院。我们更看重好奇心与持续做一件事的能力,而不是已经积累了多少成果。',
    },
    {
      q: '每年招多少人?什么时候截止?',
      a: '固定 8 — 9 人。具体时间以当年通知为准。',
    },
    {
      q: '招新期间我可以参加其他社团 / 实验室吗?',
      a: '可以。我们本身鼓励多元尝试 —— InnOSeed 不是一个会消耗你所有时间的组织,前提是你认真。',
    },
    {
      q: 'Mini Camp 是必须的吗?',
      a: '是。它是 InnOSeed 招新流程的核心 —— 我们通过一个白天的 Mini Camp 一起做事判断你适不适合这里。',
    },
  ],
};
