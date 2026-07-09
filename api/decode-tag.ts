/**
 * /api/decode-tag — 飞书 Bitable 自动化 webhook 入口.
 *
 * 流程:
 *   1. 飞书 Bitable 自动化 "记录被创建/更新 + 个性标签代码字段变化" 时
 *      POST { record_id } 到本端点
 *   2. 本端点拿飞书 tenant_access_token → 读 Bitable 这一行
 *   3. 从 Bitable 行的 "个性标签代码" 字段拿到 code 字符串
 *   4. 调 decodeApplyCode(code) → 拿到 4 个分类的标签名 + 面试官 code
 *   5. 查 INTERVIEWER_MAP (env) 把面试官 code → 飞书 Person open_id
 *   6. PUT Bitable 这一行: 4 个分类多选字段 + TA Person 字段
 *
 * 防循环:
 *   飞书 Bitable 自动化配 "仅当 个性标签代码 字段变化时触发" + 本端点
 *   写回时不修改 个性标签代码 字段 → 写回不会再次触发自动化.
 *
 * 鉴权:
 *   飞书 Bitable 自动化发 HTTP 不带签名, 用 query `?token=<...>` 鉴权,
 *   共享密钥配在 Vercel env `DECODE_TAG_TOKEN`. URL 在飞书自动化里只配一次.
 *
 * 字段名:
 *   Bitable 字段名 (5 个 + 1 个 code 字段) 通过 env 配置, 默认是 README
 *   截图里那套中文名.
 *
 * GET 模式 (调试用):
 *   `GET /api/decode-tag?code=<code>` 直接返回反解结果, 不调飞书 API.
 *   给 admin 在浏览器里快速看一个 code 解析成什么标签.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── inlined tagcode helpers (Vercel doesn't bundle cross-file imports inside api/) ──
export interface PillarKeyMap {
  compete: 'compete'; research: 'research'; startup: 'startup'; bonds: 'bonds';
}
export interface ApplyTag { name: string; pillarKey?: keyof PillarKeyMap; glyph: string; }
export interface ApplyCategory {
  key: 'lane' | 'tech' | 'play' | 'future';
  title: string; describe: string; options: ApplyTag[];
}
export interface Interviewer {
  code: string; avatar: string; intros: string[];
  tags: { name: string }[]; signal?: boolean;
}
export const APPLY_CATEGORIES: ApplyCategory[] = [
  { key: 'lane', title: '选择你的 Mini Camp 分路', describe: '先定一条主路，再补充其他偏好',
    options: [
      { name: '产品创意', pillarKey: 'compete', glyph: '💡' },
      { name: '项目展示', pillarKey: 'startup', glyph: '🚀' },
      { name: '交互设计', pillarKey: 'bonds', glyph: '🎨' },
      { name: '技术达人', pillarKey: 'research', glyph: '⌨' },
    ]},
  { key: 'tech', title: '技术特长', describe: '按熟练度从高到低多选',
    options: [
      { name: '智能体', glyph: '🤖' }, { name: '前端', glyph: '🖥' }, { name: '后端', glyph: '🗄' },
      { name: '算法', glyph: '∑' }, { name: '深度学习', glyph: '◐' }, { name: '大模型', glyph: '✦' },
      { name: '计算机视觉', glyph: '◉' }, { name: '数据优化', glyph: '◇' }, { name: '逆向', glyph: '⇄' },
      { name: '科研', glyph: '✎' }, { name: '创业', glyph: '✦' }, { name: 'System', glyph: '⌥' },
      { name: '项目', glyph: '⬡' }, { name: '交互设计', glyph: '◈' }, { name: '流量管理', glyph: '⇆' },
      { name: 'Web3D', glyph: '◬' }, { name: '医学图像', glyph: '✚' }, { name: '测试', glyph: '◧' },
      { name: '密码学', glyph: '⚿' }, { name: '可视化', glyph: '◫' }, { name: '嵌入式', glyph: '⊞' },
      { name: '数据库', glyph: '⊟' },
    ]},
  { key: 'play', title: '兴趣爱好', describe: '挑点能一起玩的',
    options: [
      { name: '开源', glyph: '✪' }, { name: '台球', glyph: '◉' }, { name: '番剧', glyph: '◐' },
      { name: '文学', glyph: '✎' }, { name: 'ESports', glyph: '◎' }, { name: '旅游', glyph: '✈' },
      { name: '剧本杀', glyph: '⚇' }, { name: '综艺', glyph: '◊' }, { name: '咖啡', glyph: '☕' },
      { name: '干饭', glyph: '☖' }, { name: '羽毛球', glyph: '⬭' }, { name: '篮球', glyph: '◯' },
      { name: '游泳', glyph: '≈' }, { name: '唱歌', glyph: '♪' }, { name: '美术', glyph: '✎' },
      { name: '舞蹈', glyph: '✧' }, { name: '桌游', glyph: '⬡' }, { name: '睡觉', glyph: '☾' },
      { name: '撸猫', glyph: '🐱' }, { name: '撸狗', glyph: '🐶' }, { name: '轻小说', glyph: '✎' },
      { name: '乒乓球', glyph: '◯' }, { name: '麻将', glyph: '⬢' }, { name: '西洋棋', glyph: '♛' },
      { name: '魔术', glyph: '✦' }, { name: '摄影', glyph: '◉' },
    ]},
  { key: 'future', title: '未来道路', describe: '半年到一年内的打算',
    options: [
      { name: '留学', glyph: '✈' }, { name: '保研', glyph: '✓' }, { name: '考研', glyph: '✎' },
      { name: '就业', glyph: '◇' }, { name: '迷茫', glyph: '?' },
    ]},
];
export const INTERVIEWERS: Interviewer[] = [
  { code: 'Mr.Y', avatar: '', intros: ['我可以和你聊聊智能体、创业、算法、台球和撸猫', '我的 MBTI 为 : ENFJ'],
    tags: [{ name: '智能体' }, { name: '创业' }, { name: '算法' }, { name: '台球' },
      { name: '撸猫' }, { name: '剧本杀' }, { name: '综艺' }, { name: '干饭' },
      { name: '羽毛球' }, { name: '摄影' }, { name: '唱歌' }, { name: '美术' },
      { name: '舞蹈' }, { name: '撸狗' }, { name: '桌游' }, { name: '睡觉' }] },
  { code: 'Zency', avatar: '', intros: ['我可以和你聊聊前端、逆向、项目、就业、番剧与轻小说', '我的 MBTI 为 : INTJ'],
    tags: [{ name: '前端' }, { name: '逆向' }, { name: '番剧' }, { name: '轻小说' }, { name: '就业' }] },
  { code: 'DKK', avatar: '', intros: ['我可以和你聊聊前端、交互设计、项目、就业与 MOBA 游戏', '我的 MBTI 为 : INFJ'],
    tags: [{ name: '前端' }, { name: '交互设计' }, { name: 'ESports' }, { name: '麻将' }, { name: '就业' }, { name: '睡觉' }] },
  { code: 'Leslie', avatar: '', intros: ['我可以和你聊聊后端、System、开源、西洋棋与魔术', '我的 MBTI 为 : INTP'],
    tags: [{ name: '开源' }, { name: 'System' }, { name: '西洋棋' }, { name: '魔术' }, { name: '后端' }] },
  { code: '007', avatar: '', intros: ['我可以和你聊聊深度学习、大模型、保研、科研与麻将', '我的 MBTI 为 : ISTJ'],
    tags: [{ name: '深度学习' }, { name: '大模型' }, { name: '麻将' }, { name: '保研' }] },
  { code: 'Jing', avatar: '', intros: ['我可以和你聊聊计算机视觉、深度强化学习、历史与时政', '我的 MBTI 为 : ISTJ'],
    tags: [{ name: '计算机视觉' }, { name: '深度学习' }, { name: '文学' }] },
  { code: 'HH', avatar: '', intros: ['我可以和你聊聊数据优化、旅游', '我的 MBTI 为 : ESFJ'],
    tags: [{ name: '数据优化' }, { name: '旅游' }] },
  { code: 'TT', avatar: '', intros: ['我可以和你聊聊流量管理、乒乓球', '我的 MBTI 为 : INTJ'],
    tags: [{ name: '流量管理' }, { name: '乒乓球' }] },
  { code: 'BarRaiser', avatar: '', intros: ['Catch Me If You Can'],
    tags: [{ name: '迷茫' }], signal: true },
];

function b64e(s: string): string {
  return typeof btoa === 'undefined' ? Buffer.from(s, 'utf-8').toString('base64') : btoa(s);
}
function b64d(s: string): string {
  if (s === '') return '';
  return typeof atob === 'undefined' ? Buffer.from(s, 'base64').toString('utf-8') : atob(s);
}
export function encodeTagCode(selectedByCategory: number[][]): string {
  const s = selectedByCategory
    .map((indices, idx) => (indices.length > 0 ? `${idx}:${indices.join(',')}` : ''))
    .filter(Boolean).join(';');
  return b64e(s);
}
export function decodeTagCode(code: string): number[][] | null {
  if (typeof code !== 'string' || code.length === 0) return null;
  if (code === '') return APPLY_CATEGORIES.map(() => []);
  let plain: string;
  try { plain = b64d(code); } catch { return null; }
  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;
  const result: number[][] = APPLY_CATEGORIES.map(() => []);
  for (const seg of plain.split(';')) {
    const [catStr, indicesStr] = seg.split(':');
    const catIdx = Number(catStr);
    if (!Number.isInteger(catIdx) || catIdx < 0 || catIdx >= APPLY_CATEGORIES.length) return null;
    const maxTag = APPLY_CATEGORIES[catIdx].options.length;
    const indices = indicesStr.split(',').map(Number)
      .filter((n) => Number.isInteger(n) && n >= 0 && n < maxTag);
    result[catIdx] = indices;
  }
  return result;
}
export function encodeApplyCode(selectedByCategory: number[][], interviewerCode: string | null): string {
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
  const tagIndices = decodeTagCode(code.slice(sepIdx + 1));
  if (tagIndices === null) return null;
  const tagNames: DecodedApplyCode['tagNames'] = { lane: [], tech: [], play: [], future: [] };
  APPLY_CATEGORIES.forEach((cat, ci) => {
    for (const ti of tagIndices[ci]) {
      const opt = cat.options[ti];
      if (opt) tagNames[cat.key].push(opt.name);
    }
  });
  const interviewerCode = ivToken === '_' ? null : ivToken;
  const interviewer = interviewerCode === null
    ? null : INTERVIEWERS.find((iv) => iv.code === interviewerCode) ?? null;
  if (interviewerCode !== null && interviewer === null) return null;
  return { interviewerCode, tagIndices, tagNames, interviewer };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── 配置 / env ────────────────────────────────────────────────────────

interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string; // Bitable app_token
  tableId: string;
  /**
   * interviewer code → { name, openId? }.
   * - `name` 必填, 用于 contact API 按名字查 open_id
   * - `openId` 可选, 写了就直接用; 留空则运行时 contact API 查
   * - 整项可以不存在 (空 {}), 完全靠 contact API
   */
  interviewerMap: Record<string, { name: string; openId?: string }>;
  /** true → 走飞书 contact API 按 name 查 open_id (需要 contact:user.id:readonly 权限) */
  autoLookup: boolean;
  fieldCode: string; // Bitable 字段: 个性标签
  fieldLane: string; // Bitable 字段: Mini Camp 选路
  fieldTech: string; // Bitable 字段: 技术特长
  fieldPlay: string; // Bitable 字段: 兴趣爱好
  fieldFuture: string; // Bitable 字段: 未来道路
  fieldTa: string; // Bitable 字段: TA
  decodeToken: string; // 共享密钥
}

function readConfig(): { ok: true; cfg: FeishuConfig } | { ok: false; missing: string[] } {
  const get = (k: string) => process.env[k]?.trim() || '';
  const required: Array<[string, string]> = [
    ['FEISHU_APP_ID', '飞书 app_id'],
    ['FEISHU_APP_SECRET', '飞书 app_secret'],
    ['FEISHU_BITABLE_TOKEN', 'Bitable app_token'],
    ['FEISHU_TABLE_ID', 'Bitable table_id'],
    ['DECODE_TAG_TOKEN', 'webhook 共享密钥'],
  ];
  const missing: string[] = [];
  for (const [env, label] of required) {
    if (!get(env)) missing.push(`${env} (${label})`);
  }
  if (missing.length > 0) return { ok: false, missing };
  // INTERVIEWER_MAP 可选; 留空 / 解析失败都当 {} 处理
  let interviewerMap: FeishuConfig['interviewerMap'] = {};
  const rawMap = get('INTERVIEWER_MAP');
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'object' && v !== null && 'name' in v && typeof (v as { name: unknown }).name === 'string') {
            const entry = v as { name: string; openId?: unknown };
            interviewerMap[k] = {
              name: entry.name,
              openId: typeof entry.openId === 'string' && entry.openId.length > 0 ? entry.openId : undefined,
            };
          }
        }
      }
    } catch (e) {
      log('warn', { stage: 'config', reason: `INTERVIEWER_MAP JSON parse failed: ${(e as Error).message}` });
    }
  }
  const autoLookup = get('LOOKUP_BY_NAME').toLowerCase() !== 'false';
  return {
    ok: true,
    cfg: {
      appId: get('FEISHU_APP_ID'),
      appSecret: get('FEISHU_APP_SECRET'),
      appToken: get('FEISHU_BITABLE_TOKEN'),
      tableId: get('FEISHU_TABLE_ID'),
      interviewerMap,
      autoLookup,
      fieldCode: get('BITABLE_FIELD_CODE') || '个性标签',
      fieldLane: get('BITABLE_FIELD_LANE') || 'Mini Camp选路',
      fieldTech: get('BITABLE_FIELD_TECH') || '技术特长',
      fieldPlay: get('BITABLE_FIELD_PLAY') || '兴趣爱好',
      fieldFuture: get('BITABLE_FIELD_FUTURE') || '未来道路',
      fieldTa: get('BITABLE_FIELD_TA') || 'TA',
      decodeToken: get('DECODE_TAG_TOKEN'),
    },
  };
}

/** Lightweight in-file logger used during config parsing (before requestId exists). */
function log(stage: string, extra: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), stage, ...extra }));
}

// ── 飞书 API helpers ──────────────────────────────────────────────────

const FEISHU_BASE = 'https://open.feishu.cn';

interface TokenCache {
  token: string;
  expiresAt: number; // ms epoch
}
let cachedToken: TokenCache | null = null;

async function getTenantToken(cfg: FeishuConfig): Promise<string> {
  // Module-level cache: Vercel Function warm 时 module 单例, 2 小时内复用.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app_id: cfg.appId, app_secret: cfg.appSecret }),
  });
  if (!res.ok) throw new FeishuApiError(`token HTTP ${res.status}`, res.status);
  const json = (await res.json()) as {
    tenant_access_token?: string;
    expire?: number;
    code?: number;
    msg?: string;
  };
  if (!json.tenant_access_token) {
    throw new FeishuApiError(`token error ${json.code}: ${json.msg}`, 500);
  }
  // 飞书 expire 单位是秒, 默认 7200 (2h). 留 5 min 缓冲.
  const ttl = (json.expire ?? 7200) * 1000;
  cachedToken = {
    token: json.tenant_access_token,
    expiresAt: Date.now() + ttl - 5 * 60_000,
  };
  return json.tenant_access_token;
}

class FeishuApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'FeishuApiError';
  }
}

async function readBitableRecord(
  cfg: FeishuConfig,
  token: string,
  recordId: string
): Promise<Record<string, any>> {
  const url =
    `${FEISHU_BASE}/open-apis/bitable/v1/apps/${cfg.appToken}` +
    `/tables/${cfg.tableId}/records/${recordId}` +
    `?text_field_as_array=true&user_id_type=open_id`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new FeishuApiError(`read record HTTP ${res.status}`, res.status);
  const json = (await res.json()) as {
    code?: number;
    msg?: string;
    data?: { record?: { fields?: Record<string, any> } };
  };
  if (json.code !== 0 || !json.data?.record?.fields) {
    throw new FeishuApiError(`read record feishu error ${json.code}: ${json.msg}`, 500);
  }
  return json.data.record.fields;
}

async function writeBitableRecord(
  cfg: FeishuConfig,
  token: string,
  recordId: string,
  fields: Record<string, any>
): Promise<void> {
  const url =
    `${FEISHU_BASE}/open-apis/bitable/v1/apps/${cfg.appToken}` +
    `/tables/${cfg.tableId}/records/${recordId}` +
    `?user_id_type=open_id`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new FeishuApiError(`write record HTTP ${res.status}`, res.status);
  const json = (await res.json()) as { code?: number; msg?: string };
  if (json.code !== 0) {
    throw new FeishuApiError(`write record feishu error ${json.code}: ${json.msg}`, 500);
  }
}

// ── 业务逻辑 ──────────────────────────────────────────────────────────

/**
 * Look up an interviewer's open_id by their display name via the 飞书
 * contact search API. Returns null if the user can't be found (e.g.
 * the app isn't installed in the right workspace).
 *
 * Cached in-memory for `CACHE_TTL_MS` (24h). Vercel Function cold
 * starts lose the cache, but that's fine — re-querying is cheap
 * (one HTTP call) and a hit is the common case.
 *
 * Requires one of: `search:user` or `contact:user.id:readonly` scope.
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const personCache = new Map<string, { openId: string; expiresAt: number }>();

async function lookupOpenIdByName(token: string, name: string): Promise<string | null> {
  const cached = personCache.get(name);
  if (cached && cached.expiresAt > Date.now()) return cached.openId;
  const url = `${FEISHU_BASE}/open-apis/search/v1/user?query=${encodeURIComponent(name)}&page_size=5`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    log('contact_lookup_http_fail', { status: res.status, name });
    return null;
  }
  const json = (await res.json()) as {
    code?: number;
    msg?: string;
    data?: { users?: Array<{ user_id?: string; name?: string }> };
  };
  if (json.code !== 0) {
    log('contact_lookup_api_fail', { code: json.code, msg: json.msg, name });
    return null;
  }
  // 飞书 search 是模糊匹配, 取第一个完全匹配 name 的; 没有就取第一个.
  const users = json.data?.users ?? [];
  let match = users.find((u) => u.name === name && u.user_id);
  if (!match) match = users.find((u) => u.user_id);
  if (!match?.user_id) return null;
  personCache.set(name, { openId: match.user_id, expiresAt: Date.now() + CACHE_TTL_MS });
  return match.user_id;
}

interface ComposedFields {
  fields: Record<string, any>;
  taSource: 'map' | 'auto' | 'none';
  taDetail: string;
}

/**
 * Compose the Bitable field payload from a decoded code.
 *
 * Resolution order for the TA Person field:
 *   1. If `cfg.interviewerMap[ivCode].openId` is set → use it directly.
 *   2. Else if `cfg.autoLookup` is true and the interviewer entry has
 *      a `name` → call `lookupOpenIdByName` (cached).
 *   3. Otherwise skip the TA field (admin can fill in manually).
 *
 * Multi-select fields always get the full decoded tag list (even if
 * empty) so 飞书 sees a definite payload rather than "field unchanged".
 */
async function composeBitableFields(
  decoded: ReturnType<typeof decodeApplyCode>,
  cfg: FeishuConfig,
  token: string | null
): Promise<ComposedFields> {
  const fields: Record<string, any> = {};
  const multiSelectOf = (names: string[]) => names.map((text) => ({ text, type: 'text' as const }));
  fields[cfg.fieldLane] = multiSelectOf(decoded.tagNames.lane);
  fields[cfg.fieldTech] = multiSelectOf(decoded.tagNames.tech);
  fields[cfg.fieldPlay] = multiSelectOf(decoded.tagNames.play);
  fields[cfg.fieldFuture] = multiSelectOf(decoded.tagNames.future);

  let taSource: ComposedFields['taSource'] = 'none';
  let taDetail = 'no interviewer picked';
  if (decoded.interviewerCode !== null) {
    const entry = cfg.interviewerMap[decoded.interviewerCode];
    if (entry?.openId) {
      fields[cfg.fieldTa] = [{ id: entry.openId }];
      taSource = 'map';
      taDetail = `${decoded.interviewerCode} → ${entry.name} (cached open_id)`;
    } else if (entry?.name && cfg.autoLookup && token !== null) {
      const openId = await lookupOpenIdByName(token, entry.name);
      if (openId) {
        fields[cfg.fieldTa] = [{ id: openId }];
        taSource = 'auto';
        taDetail = `${decoded.interviewerCode} → ${entry.name} → ${openId} (auto-looked-up)`;
      } else {
        taDetail = `${decoded.interviewerCode} → contact API found no match for "${entry.name}"`;
      }
    } else {
      taDetail = `${decoded.interviewerCode} → no name in map and autoLookup disabled`;
    }
  }
  return { fields, taSource, taDetail };
}

// ── 端点主流程 ─────────────────────────────────────────────────────────

function newRequestId(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const b of bytes) {
    buffer = (buffer << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(buffer >> bits) & 0x1f];
    }
  }
  return out.slice(0, 10);
}

function isAuthorized(req: VercelRequest, expected: string): boolean {
  if (!expected) return false;
  const tokenFromQuery = typeof req.query.token === 'string' ? req.query.token : '';
  return tokenFromQuery === expected;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  const reqId = newRequestId();
  response.setHeader('x-request-id', reqId);
  const log = (stage: string, extra: Record<string, unknown> = {}) => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        reqId,
        stage,
        method: request.method,
        ...extra,
      })
    );
  };
  log('start');

  // 1. 鉴权
  const cfgRes = readConfig();
  if (!cfgRes.ok) {
    log('reject_env', { status: 503, missing: cfgRes.missing });
    response.status(503).json({
      error: 'Server not configured',
      missing: cfgRes.missing,
      reqId,
    });
    return;
  }
  const cfg = cfgRes.cfg;
  if (!isAuthorized(request, cfg.decodeToken)) {
    log('reject_auth', { status: 401 });
    response.status(401).json({ error: 'Unauthorized', reqId });
    return;
  }

  // 2. GET 调试模式: ?code=xxx 直接反解
  if (request.method === 'GET') {
    const code = typeof request.query.code === 'string' ? request.query.code : '';
    if (!code) {
      response.status(400).json({ error: 'Missing ?code=...', reqId });
      return;
    }
    const decoded = decodeApplyCode(code);
    if (!decoded) {
      log('get_decode_fail', { status: 400, code });
      response.status(400).json({ error: 'Invalid code', code, reqId });
      return;
    }
    const composed = await composeBitableFields(decoded, cfg, null);
    // GET 调试模式: token=null, 不会查 contact API; TA 字段会留空 (没 openId)
    log('get_decode_ok', { code, interviewer: decoded.interviewerCode, taSource: composed.taSource });
    response.status(200).json({
      ok: true,
      code,
      decoded,
      fields: composed.fields,
      taSource: composed.taSource,
      taDetail: composed.taDetail,
      reqId,
    });
    return;
  }

  // 3. POST webhook 模式
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    log('reject_method', { status: 405 });
    response.status(405).json({ error: 'Method not allowed', reqId });
    return;
  }
  const body: unknown = request.body;
  if (typeof body !== 'object' || body === null) {
    log('reject_body', { status: 400 });
    response.status(400).json({ error: 'body must be object', reqId });
    return;
  }
  const recordId = (body as { record_id?: unknown }).record_id;
  if (typeof recordId !== 'string' || recordId.length === 0 || recordId.length > 100) {
    log('reject_body', { status: 400, reason: 'record_id missing/invalid' });
    response.status(400).json({ error: 'record_id required', reqId });
    return;
  }

  try {
    const token = await getTenantToken(cfg);
    const fields = await readBitableRecord(cfg, token, recordId);
    const codeRaw = fields[cfg.fieldCode];
    // text_field_as_array=true 把 plain text 字段返回为 [{text, type}], 兼容两种形态:
    //   1) 字符串 (旧版 API / 未来可能切换参数)
    //   2) 数组第一项 .text
    //   3) null/undefined/其他 → 空
    let codeExtracted: unknown = codeRaw;
    if (Array.isArray(codeRaw) && codeRaw.length > 0) {
      const first = codeRaw[0];
      if (first && typeof first === 'object' && 'text' in first && typeof (first as { text: unknown }).text === 'string') {
        codeExtracted = (first as { text: string }).text;
      } else {
        codeExtracted = '';
      }
    }
    const code = typeof codeExtracted === 'string' ? codeExtracted.trim() : '';
    if (!code) {
      log('no_code', { status: 200, recordId, field: cfg.fieldCode });
      response.status(200).json({ ok: true, skipped: 'no code in field', reqId });
      return;
    }
    const decoded = decodeApplyCode(code);
    if (!decoded) {
      log('decode_fail', { status: 422, recordId, code });
      response.status(422).json({ error: 'Invalid code in record', code, reqId });
      return;
    }
    const composed = await composeBitableFields(decoded, cfg, token);
    // 写回 — 不动 fieldCode, 不触发自动化循环
    await writeBitableRecord(cfg, token, recordId, composed.fields);
    log('ok', {
      status: 200,
      recordId,
      interviewer: decoded.interviewerCode,
      taSource: composed.taSource,
      taDetail: composed.taDetail,
      laneCount: decoded.tagNames.lane.length,
      techCount: decoded.tagNames.tech.length,
      playCount: decoded.tagNames.play.length,
      futureCount: decoded.tagNames.future.length,
    });
    response.status(200).json({
      ok: true,
      record_id: recordId,
      decoded: {
        interviewer: decoded.interviewerCode,
        tagNames: decoded.tagNames,
      },
      fields_written: Object.keys(composed.fields),
      taSource: composed.taSource,
      reqId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = err instanceof FeishuApiError ? err.status : 500;
    log('error', { status, message });
    response.status(status).json({ error: message, reqId });
  }
}
