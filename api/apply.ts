/**
 * /api/apply — receives the recruitment form payload and persists it.
 *
 * Vercel auto-discovers anything under `api/` as a serverless function.
 * Built artifact: `.vercel/output/functions/api/apply.func/index.js`.
 *
 * Current state: STUB.
 *   - Validates the request body shape.
 *   - Re-derives the per-category tag indices from the flat `selections`
 *     (so the returned code is guaranteed to round-trip — the frontend
 *     sends both, but the server is the trust boundary).
 *   - Composes a portable "apply code" containing BOTH the picked
 *     interviewer and the tag selection — the same string the candidate
 *     pastes into the 飞书 Bitable's "个性标签代码" field, which
 *     /api/decode-tag then splits back into structured values.
 *   - Generates a separate short 10-char base32 `lookupCode` for the
 *     Bitable to use as a human-typable internal id.
 *   - Logs the full payload to stdout (visible in `vercel logs`).
 *   - Returns 200 + `{ code, lookupCode }`.
 *
 * To wire this to a real store, fill in one of the destinations below
 * and remove the dev-only "stub" branch. The signature
 * `applyHandle(request): Promise<Response>` is intentionally
 * destination-agnostic so you can swap without touching the frontend.
 *
 * Real destinations, ranked by "least yak-shaving":
 *
 *  1. Feishu Bitable (飞书多维表格) — you said "飞书 webhook", so this
 *     is the natural choice. Requires a tenant_access_token (app
 *     credentials in Vercel env) and an app_token for the Bitable.
 *     See `_persistToFeishuBitable` below.
 *
 *  2. Airtable — same shape, simpler auth (just a PAT). Good fallback
 *     if 飞书 credentials aren't ready.
 *
 *  3. Vercel KV / Postgres — fully self-hosted, but adds provisioning
 *     to your Vercel project.
 *
 *  4. Notion API — similar to Airtable.
 *
 * The frontend doesn't care which destination is wired — it just POSTs
 * the payload and reads back `{ code }`.
 */


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

interface ApplyPayload {
  /** Base64 tag-code produced by the client (matches the SvelteKit format). */
  tagCode: string;
  /** Picked interviewer code, or null. */
  interviewer: string | null;
  /** Per-category tag selections, denormalized. */
  selections: Array<{
    category: 'lane' | 'tech' | 'play' | 'future';
    tag: string;
  }>;
}

/**
 * Fold the flat `selections` array back into the per-category
 * `number[][]` shape that `encodeApplyCode` expects.
 *
 * Order is preserved within each bucket (frontend appends in click
 * order), and unknown category / tag names are silently dropped —
 * `validateApplyPayload` already bounded the inputs but a malicious
 * client could still smuggle extras; we re-resolve against the
 * canonical APPLY_CATEGORIES table so the server's encode is
 * authoritative.
 */
function selectionsToIndices(selections: ApplyPayload['selections']): number[][] {
  const indices: number[][] = APPLY_CATEGORIES.map(() => []);
  for (const sel of selections) {
    const catIdx = APPLY_CATEGORIES.findIndex((c) => c.key === sel.category);
    if (catIdx < 0) continue;
    const tagIdx = APPLY_CATEGORIES[catIdx].options.findIndex((o) => o.name === sel.tag);
    if (tagIdx < 0) continue;
    if (!indices[catIdx].includes(tagIdx)) indices[catIdx].push(tagIdx);
  }
  return indices;
}

/**
 * Generate a short request-id (10 chars, Crockford base32).
 * Used in structured logs so `vercel logs --filter reqId=<id>` finds
 * the entire lifecycle of one POST in one shot.
 */
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

/**
 * Pull a request id from the inbound headers (so a retry / page reload
 * keeps continuity in the logs), otherwise mint a fresh one.
 */
function resolveRequestId(request: VercelRequest): string {
  const incoming = request.headers['x-vercel-id'] || request.headers['x-request-id'];
  if (typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 80) {
    return incoming.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 32);
  }
  return newRequestId();
}

const TAG_CODE_RE = /^[A-Za-z0-9+/=_-]{4,}$/;
const INTERVIEWER_CODE_RE = /^[A-Za-z0-9._-]{1,40}$/;
const ALLOWED_CATEGORIES = new Set(['lane', 'tech', 'play', 'future']);

/**
 * Validate the request body. Returns null if valid, or a short string
 * identifying the first field that failed — included in the structured
 * log so the failure mode is greppable from the reqId alone.
 *
 * Contract: selections is a FLAT array of `{category, tag}` records,
 * one per picked tag. Empty per-category buckets are simply absent.
 * (Frontend uses flatMap() — see Apply.tsx submit().)
 */
function validateApplyPayload(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return 'body is not an object';
  const p = v as Record<string, unknown>;
  if (typeof p.tagCode !== 'string') return 'tagCode missing or not string';
  if (!TAG_CODE_RE.test(p.tagCode)) return 'tagCode failed regex';
  if (p.interviewer !== null && (typeof p.interviewer !== 'string' || !INTERVIEWER_CODE_RE.test(p.interviewer))) {
    return 'interviewer not null and not a valid code';
  }
  if (!Array.isArray(p.selections)) return 'selections is not an array';
  // Reject nested arrays — front-end regression: previously used
  // .map((arr) => arr.map(...)) which produced [[…], [], […]] and
  // passed the loose Array.isArray check but failed the per-item
  // shape check below, surfacing as a confusing "Invalid payload".
  if (p.selections.some((s) => Array.isArray(s))) {
    return 'selections contains nested array (must be flat)';
  }
  for (let i = 0; i < p.selections.length; i++) {
    const sel = p.selections[i];
    if (typeof sel !== 'object' || sel === null) return `selections[${i}] not an object`;
    const s = sel as Record<string, unknown>;
    if (typeof s.category !== 'string' || !ALLOWED_CATEGORIES.has(s.category)) {
      return `selections[${i}].category invalid: ${String(s.category)}`;
    }
    if (typeof s.tag !== 'string' || s.tag.length === 0 || s.tag.length > 60) {
      return `selections[${i}].tag invalid: ${JSON.stringify(s.tag)}`;
    }
  }
  return null;
}

/**
 * Generate a 10-character server-side reference code. Base32 (Crockford
 * alphabet — no I/L/O/U to avoid visual ambiguity). 50 bits of entropy is
 * enough that collisions won't happen in any realistic 招新 volume.
 *
 * NOTE: the user's *portable* code is `encodeApplyCode(...)` — it
 * carries the interviewer pick + tag selection. This base32 string is
 * only a short human-typable handle, useful as the 飞书 Bitable's
 * "primary key" column for admin eyes. The two are returned side by
 * side: `code` (portable, decodeable) and `lookupCode` (short, opaque).
 */
function generateLookupCode(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  let out = '';
  // Encode as base32 with 7 input bytes → 11 chars; truncate to 10.
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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  const reqId = resolveRequestId(request);
  const startedAt = Date.now();

  // Echo the request id back so the client (and any proxy logs) can
  // correlate this response with the log line.
  response.setHeader('x-request-id', reqId);

  // Structured access log — single line per request, easy to grep in
  // Vercel runtime logs. Includes the build sha if Vercel injected it.
  const log = (stage: string, extra: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      reqId,
      stage,
      method: request.method,
      ua: request.headers['user-agent'] ?? '',
      ip:
        (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? '',
      deployment: process.env.VERCEL_DEPLOYMENT_ID ?? '',
      region: process.env.VERCEL_REGION ?? '',
      durationMs: Date.now() - startedAt,
      ...extra,
    }));
  };

  log('start');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    log('reject_method', { status: 405 });
    response.status(405).json({ error: 'Method not allowed', reqId });
    return;
  }

  const body: unknown = request.body;
  const validationError = validateApplyPayload(body);
  if (validationError !== null) {
    log('reject_payload', { status: 400, reason: validationError, body });
    response.status(400).json({ error: 'Invalid payload', reason: validationError, reqId });
    return;
  }
  const payload = body as ApplyPayload;

  // The frontend's `interviewer` is a short handle (e.g. "Mr.Y"). We
  // re-validate against the canonical INTERVIEWERS list so a tampered
  // request can't smuggle a code that /api/decode-tag would fail to
  // resolve. Null is fine (candidate skipped the pick step).
  if (
    payload.interviewer !== null &&
    !INTERVIEWERS.some((iv) => iv.code === payload.interviewer)
  ) {
    log('reject_interviewer', {
      status: 400,
      interviewer: payload.interviewer,
    });
    response.status(400).json({ error: 'Unknown interviewer', reqId });
    return;
  }

  const lookupCode = generateLookupCode();
  const indices = selectionsToIndices(payload.selections);
  const portableCode = encodeApplyCode(indices, payload.interviewer);

  try {
    // TODO(real-destination): swap this for the chosen store.
    // The stub branch logs the structured payload + the new server code so
    // you can confirm the shape end-to-end before wiring a real store.
    log('accepted', {
      status: 200,
      code: portableCode,
      lookupCode,
      interviewer: payload.interviewer,
      selectionsCount: payload.selections.length,
      payloadBytes: JSON.stringify(body).length,
    });
    response.status(200).json({ code: portableCode, lookupCode, reqId });
  } catch (err) {
    // We don't expect the stub branch to throw, but the real
    // _persistToFeishuBitable() can (token fetch / record write).
    log('error', {
      status: 500,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    response.status(500).json({ error: 'Internal error', reqId });
  }
}

// ────────────────────────────────────────────────────────────────────
//  Stub for the real Feishu Bitable persistence — drop in when the
//  飞书 app credentials are ready. Returns the Bitable record id.
//
//  Required env vars (Vercel project settings):
//    FEISHU_APP_ID        — from 飞书 open platform → app credentials
//    FEISHU_APP_SECRET    — same
//    FEISHU_BITABLE_TOKEN — Bitable app_token (the `base` part of the URL)
//    FEISHU_TABLE_ID      — the target table within the Bitable
//
//  API docs:
//    Get tenant_access_token: POST /open-apis/auth/v3/tenant_access_token/internal
//    Add record:              POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
// ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _persistToFeishuBitable(payload: ApplyPayload, serverCode: string): Promise<string> {
  const FEISHU_BASE = 'https://open.feishu.cn';
  const tokenRes = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  if (!tokenRes.ok) throw new Error(`feishu token HTTP ${tokenRes.status}`);
  const tokenJson = (await tokenRes.json()) as { tenant_access_token?: string; code?: number; msg?: string };
  if (!tokenJson.tenant_access_token) {
    throw new Error(`feishu token error ${tokenJson.code}: ${tokenJson.msg}`);
  }
  const tenantToken = tokenJson.tenant_access_token;

  const appToken = process.env.FEISHU_BITABLE_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;
  if (!appToken || !tableId) {
    throw new Error('FEISHU_BITABLE_TOKEN / FEISHU_TABLE_ID not configured');
  }

  const fields: Record<string, unknown> = {
    '个性标签代码': serverCode,
    '原代码': payload.tagCode,
    '面试官': payload.interviewer ?? '',
    '提交时间': Date.now(),
  };
  // Fold selections into per-category string fields, e.g.
  //   Mini Camp 分路: "产品创意"
  //   技术: "智能体,前端,算法"
  for (const sel of payload.selections) {
    const label: Record<typeof sel.category, string> = {
      lane: 'Mini Camp 分路',
      tech: '技术',
      play: '兴趣',
      future: '未来',
    }[sel.category];
    const existing = (fields[label] as string | undefined) ?? '';
    fields[label] = existing ? `${existing},${sel.tag}` : sel.tag;
  }

  const recRes = await fetch(
    `${FEISHU_BASE}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!recRes.ok) throw new Error(`feishu record HTTP ${recRes.status}`);
  const recJson = (await recRes.json()) as { data?: { record_id?: string } };
  return recJson.data?.record_id ?? '';
}
