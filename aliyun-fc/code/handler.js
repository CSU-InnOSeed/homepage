const nodeCrypto = require('crypto');

const FEISHU_BASE = 'https://open.feishu.cn';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const APPLY_CATEGORIES = [
  {
    key: 'lane',
    options: [
      { name: '产品创意' },
      { name: '项目展示' },
      { name: '交互设计' },
      { name: '技术达人' },
    ],
  },
  {
    key: 'tech',
    options: [
      { name: '智能体' },
      { name: '前端' },
      { name: '后端' },
      { name: '算法' },
      { name: '深度学习' },
      { name: '大模型' },
      { name: '计算机视觉' },
      { name: '数据优化' },
      { name: '逆向' },
      { name: '科研' },
      { name: '创业' },
      { name: 'System' },
      { name: '项目' },
      { name: '交互设计' },
      { name: '流量管理' },
      { name: 'Web3D' },
      { name: '医学图像' },
      { name: '测试' },
      { name: '密码学' },
      { name: '可视化' },
      { name: '嵌入式' },
      { name: '数据库' },
    ],
  },
  {
    key: 'play',
    options: [
      { name: '开源' },
      { name: '台球' },
      { name: '番剧' },
      { name: '文学' },
      { name: 'ESports' },
      { name: '旅游' },
      { name: '剧本杀' },
      { name: '综艺' },
      { name: '咖啡' },
      { name: '干饭' },
      { name: '羽毛球' },
      { name: '篮球' },
      { name: '游泳' },
      { name: '唱歌' },
      { name: '美术' },
      { name: '舞蹈' },
      { name: '桌游' },
      { name: '睡觉' },
      { name: '撸猫' },
      { name: '撸狗' },
      { name: '轻小说' },
      { name: '乒乓球' },
      { name: '麻将' },
      { name: '西洋棋' },
      { name: '魔术' },
      { name: '摄影' },
    ],
  },
  {
    key: 'future',
    options: [
      { name: '留学' },
      { name: '保研' },
      { name: '考研' },
      { name: '就业' },
      { name: '迷茫' },
    ],
  },
];

const INTERVIEWERS = [
  'Mr.Y',
  'Zency',
  'DKK',
  'Leslie',
  '007',
  'Jing',
  'HH',
  'TT',
  'BarRaiser',
];

let cachedToken = null;
const personCache = new Map();

function log(stage, extra = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), stage, ...extra }));
}

function b64decode(value) {
  if (value === '') return '';
  return Buffer.from(value, 'base64').toString('utf-8');
}

function decodeTagCode(code) {
  if (typeof code !== 'string') return null;
  if (code === '') return APPLY_CATEGORIES.map(() => []);

  let plain;
  try {
    plain = b64decode(code);
  } catch {
    return null;
  }

  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;

  const result = APPLY_CATEGORIES.map(() => []);
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

function decodeApplyCode(code) {
  if (typeof code !== 'string' || code.length === 0) return null;

  const sepIdx = code.indexOf('|');
  if (sepIdx <= 0) return null;

  const ivToken = code.slice(0, sepIdx);
  const tagIndices = decodeTagCode(code.slice(sepIdx + 1));
  if (tagIndices === null) return null;

  const tagNames = { lane: [], tech: [], play: [], future: [] };
  APPLY_CATEGORIES.forEach((cat, catIdx) => {
    for (const tagIdx of tagIndices[catIdx]) {
      const opt = cat.options[tagIdx];
      if (opt) tagNames[cat.key].push(opt.name);
    }
  });

  const interviewerCode = ivToken === '_' ? null : ivToken;
  if (interviewerCode !== null && !INTERVIEWERS.includes(interviewerCode)) return null;

  return { interviewerCode, tagIndices, tagNames };
}

class FeishuApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'FeishuApiError';
    this.status = status;
  }
}

function readConfig() {
  const get = (key) => (process.env[key] || '').trim();
  const required = [
    ['FEISHU_APP_ID', '飞书 app_id'],
    ['FEISHU_APP_SECRET', '飞书 app_secret'],
    ['FEISHU_BITABLE_TOKEN', 'Bitable app_token'],
    ['FEISHU_TABLE_ID', 'Bitable table_id'],
    ['DECODE_TAG_TOKEN', 'webhook 共享密钥'],
  ];
  const missing = [];

  for (const [env, label] of required) {
    if (!get(env)) missing.push(`${env} (${label})`);
  }

  if (missing.length > 0) return { ok: false, missing };

  let interviewerMap = {};
  const rawMap = get('INTERVIEWER_MAP');
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        interviewerMap = Object.fromEntries(
          Object.entries(parsed)
            .filter(([, value]) => value && typeof value === 'object' && typeof value.name === 'string')
            .map(([key, value]) => [
              key,
              {
                name: value.name,
                openId: typeof value.openId === 'string' && value.openId ? value.openId : undefined,
              },
            ])
        );
      }
    } catch (err) {
      log('config_warn', { reason: `INTERVIEWER_MAP JSON parse failed: ${err.message}` });
    }
  }

  return {
    ok: true,
    cfg: {
      appId: get('FEISHU_APP_ID'),
      appSecret: get('FEISHU_APP_SECRET'),
      appToken: get('FEISHU_BITABLE_TOKEN'),
      tableId: get('FEISHU_TABLE_ID'),
      interviewerMap,
      autoLookup: get('LOOKUP_BY_NAME').toLowerCase() !== 'false',
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

function newRequestId() {
  return nodeCrypto.randomBytes(6).toString('base64url').slice(0, 10);
}

async function getTenantToken(cfg) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const res = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app_id: cfg.appId, app_secret: cfg.appSecret }),
  });
  if (!res.ok) throw new FeishuApiError(`token HTTP ${res.status}`, res.status);

  const json = await res.json();
  if (!json.tenant_access_token) {
    throw new FeishuApiError(`token error ${json.code}: ${json.msg}`, 500);
  }

  const ttl = (json.expire || 7200) * 1000;
  cachedToken = {
    token: json.tenant_access_token,
    expiresAt: Date.now() + ttl - 5 * 60_000,
  };
  return json.tenant_access_token;
}

async function readBitableRecord(cfg, token, recordId) {
  const url =
    `${FEISHU_BASE}/open-apis/bitable/v1/apps/${cfg.appToken}` +
    `/tables/${cfg.tableId}/records/${recordId}` +
    `?text_field_as_array=true&user_id_type=open_id`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new FeishuApiError(`read record HTTP ${res.status}: invalid JSON response`, res.status || 500);
  }
  if (!res.ok) {
    throw new FeishuApiError(`read record HTTP ${res.status}: ${json.code || 'unknown'} ${json.msg || 'unknown'}`, res.status);
  }
  if (json.code !== 0 || !json.data?.record?.fields) {
    throw new FeishuApiError(`read record feishu error ${json.code}: ${json.msg}`, 500);
  }
  return json.data.record.fields;
}

async function writeBitableRecord(cfg, token, recordId, fields) {
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

  const json = await res.json();
  if (json.code !== 0) {
    throw new FeishuApiError(`write record feishu error ${json.code}: ${json.msg}`, 500);
  }
}

async function lookupOpenIdByName(token, name) {
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

  const json = await res.json();
  if (json.code !== 0) {
    log('contact_lookup_api_fail', { code: json.code, msg: json.msg, name });
    return null;
  }

  const users = json.data?.users || [];
  const match = users.find((u) => u.name === name && u.user_id) || users.find((u) => u.user_id);
  if (!match?.user_id) return null;

  personCache.set(name, { openId: match.user_id, expiresAt: Date.now() + CACHE_TTL_MS });
  return match.user_id;
}

async function composeBitableFields(decoded, cfg, token) {
  const fields = {};
  fields[cfg.fieldLane] = decoded.tagNames.lane.slice();
  fields[cfg.fieldTech] = decoded.tagNames.tech.slice();
  fields[cfg.fieldPlay] = decoded.tagNames.play.slice();
  fields[cfg.fieldFuture] = decoded.tagNames.future.slice();

  let taSource = 'none';
  let taDetail = 'no interviewer picked';
  if (decoded.interviewerCode !== null) {
    const entry = cfg.interviewerMap[decoded.interviewerCode];
    if (entry?.openId) {
      fields[cfg.fieldTa] = [{ id: entry.openId }];
      taSource = 'map';
      taDetail = `${decoded.interviewerCode} -> ${entry.name} (configured open_id)`;
    } else if (entry?.name && cfg.autoLookup && token !== null) {
      const openId = await lookupOpenIdByName(token, entry.name);
      if (openId) {
        fields[cfg.fieldTa] = [{ id: openId }];
        taSource = 'auto';
        taDetail = `${decoded.interviewerCode} -> ${entry.name} -> ${openId}`;
      } else {
        taDetail = `${decoded.interviewerCode} -> no contact match for ${entry.name}`;
      }
    } else if (token === null) {
      taDetail = `${decoded.interviewerCode} -> GET mode skips contact lookup`;
    } else if (!entry) {
      taDetail = `${decoded.interviewerCode} -> not in INTERVIEWER_MAP`;
    } else {
      taDetail = `${decoded.interviewerCode} -> TA lookup disabled or missing name`;
    }
  }

  return { fields, taSource, taDetail };
}

function parseQuery(request) {
  const queries = request.queries || request.query || {};
  const out = {};
  for (const [key, value] of Object.entries(queries)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

async function readRequestBody(request) {
  if (request.body !== undefined && request.body !== null) {
    if (Buffer.isBuffer(request.body)) return request.body.toString('utf8');
    if (typeof request.body === 'string') return request.body;
    if (typeof request.body === 'object') return JSON.stringify(request.body);
  }

  if (typeof request.getBody === 'function') {
    const body = await request.getBody();
    return Buffer.isBuffer(body) ? body.toString('utf8') : String(body || '');
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function sendJson(response, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  const mergedHeaders = {
    'content-type': 'application/json; charset=utf-8',
    ...headers,
  };

  if (typeof response.setStatusCode === 'function') response.setStatusCode(statusCode);
  else response.statusCode = statusCode;

  for (const [key, value] of Object.entries(mergedHeaders)) {
    if (typeof response.setHeader === 'function') response.setHeader(key, value);
    else if (typeof response.set === 'function') response.set(key, value);
  }

  if (typeof response.send === 'function') response.send(body);
  else if (typeof response.end === 'function') response.end(body);
  else throw new Error('Unsupported FC response object');
}

function extractCodeField(raw) {
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (first && typeof first === 'object' && typeof first.text === 'string') return first.text.trim();
    return '';
  }
  return typeof raw === 'string' ? raw.trim() : '';
}

function payloadsMatch(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function isUnresolvedTemplateValue(value) {
  return typeof value === 'string' && /{{|}}/.test(value);
}

function extractRecordId(body) {
  const candidates = [
    body?.record_id,
    body?.recordId,
    body?.record?.record_id,
    body?.record?.recordId,
    body?.data?.record_id,
    body?.data?.recordId,
    body?.event?.record_id,
    body?.event?.recordId,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

async function handle(request, response, context) {
  const reqId = newRequestId();
  const method = request.method || 'GET';
  const query = parseQuery(request);
  const requestLog = (stage, extra = {}) => {
    log(stage, { reqId, method, requestId: context?.requestId, ...extra });
  };

  requestLog('start');

  const cfgRes = readConfig();
  if (!cfgRes.ok) {
    requestLog('reject_env', { status: 503, missing: cfgRes.missing });
    sendJson(response, 503, { error: 'Server not configured', missing: cfgRes.missing, reqId }, { 'x-request-id': reqId });
    return;
  }

  const cfg = cfgRes.cfg;
  if (!cfg.decodeToken || query.token !== cfg.decodeToken) {
    requestLog('reject_auth', { status: 401 });
    sendJson(response, 401, { error: 'Unauthorized', reqId }, { 'x-request-id': reqId });
    return;
  }

  if (method === 'GET') {
    const code = typeof query.code === 'string' ? query.code : '';
    if (!code) {
      sendJson(response, 400, { error: 'Missing ?code=...', reqId }, { 'x-request-id': reqId });
      return;
    }

    const decoded = decodeApplyCode(code);
    if (!decoded) {
      requestLog('get_decode_fail', { status: 400, code });
      sendJson(response, 400, { error: 'Invalid code', code, reqId }, { 'x-request-id': reqId });
      return;
    }

    const composed = await composeBitableFields(decoded, cfg, null);
    requestLog('get_decode_ok', { code, interviewer: decoded.interviewerCode, taSource: composed.taSource });
    sendJson(
      response,
      200,
      {
        ok: true,
        code,
        decoded,
        fields: composed.fields,
        taSource: composed.taSource,
        taDetail: composed.taDetail,
        reqId,
      },
      { 'x-request-id': reqId }
    );
    return;
  }

  if (method !== 'POST') {
    requestLog('reject_method', { status: 405 });
    sendJson(response, 405, { error: 'Method not allowed', reqId }, { Allow: 'GET, POST', 'x-request-id': reqId });
    return;
  }

  let body;
  try {
    const bodyText = await readRequestBody(request);
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch (err) {
    requestLog('reject_body', { status: 400, reason: err.message });
    sendJson(response, 400, { error: 'body must be valid JSON', reqId }, { 'x-request-id': reqId });
    return;
  }

  const recordId = extractRecordId(body);
  if (typeof recordId !== 'string' || recordId.length === 0 || recordId.length > 100) {
    requestLog('reject_body', { status: 400, reason: 'record_id missing/invalid' });
    sendJson(response, 400, { error: 'record_id required', reqId }, { 'x-request-id': reqId });
    return;
  }
  if (isUnresolvedTemplateValue(recordId)) {
    requestLog('reject_body', { status: 400, reason: 'record_id template not resolved', recordId });
    sendJson(
      response,
      400,
      {
        error: 'record_id template was not resolved',
        detail: 'Use Feishu automation variable picker to insert the actual record id, not literal {{record_id}}.',
        record_id: recordId,
        reqId,
      },
      { 'x-request-id': reqId }
    );
    return;
  }

  try {
    const token = await getTenantToken(cfg);
    const fields = await readBitableRecord(cfg, token, recordId);
    const code = extractCodeField(fields[cfg.fieldCode]);

    if (!code) {
      requestLog('no_code', { status: 200, recordId, field: cfg.fieldCode });
      sendJson(response, 200, { ok: true, skipped: 'no code in field', reqId }, { 'x-request-id': reqId });
      return;
    }

    const decoded = decodeApplyCode(code);
    if (!decoded) {
      requestLog('decode_fail', { status: 422, recordId, code });
      sendJson(response, 422, { error: 'Invalid code in record', code, reqId }, { 'x-request-id': reqId });
      return;
    }

    const composed = await composeBitableFields(decoded, cfg, token);
    const fieldsAlreadyMatch =
      payloadsMatch(fields[cfg.fieldLane], composed.fields[cfg.fieldLane]) &&
      payloadsMatch(fields[cfg.fieldTech], composed.fields[cfg.fieldTech]) &&
      payloadsMatch(fields[cfg.fieldPlay], composed.fields[cfg.fieldPlay]) &&
      payloadsMatch(fields[cfg.fieldFuture], composed.fields[cfg.fieldFuture]) &&
      payloadsMatch(fields[cfg.fieldTa], composed.fields[cfg.fieldTa]);

    if (fieldsAlreadyMatch) {
      requestLog('noop_idempotent', {
        status: 200,
        recordId,
        interviewer: decoded.interviewerCode,
        taSource: composed.taSource,
      });
      sendJson(
        response,
        200,
        {
          ok: true,
          record_id: recordId,
          skipped: 'idempotent: all 5 fields already match decoded payload',
          decoded: { interviewer: decoded.interviewerCode, tagNames: decoded.tagNames },
          taSource: composed.taSource,
          reqId,
        },
        { 'x-request-id': reqId }
      );
      return;
    }

    await writeBitableRecord(cfg, token, recordId, composed.fields);
    requestLog('ok', {
      status: 200,
      recordId,
      interviewer: decoded.interviewerCode,
      taSource: composed.taSource,
      laneCount: decoded.tagNames.lane.length,
      techCount: decoded.tagNames.tech.length,
      playCount: decoded.tagNames.play.length,
      futureCount: decoded.tagNames.future.length,
    });
    sendJson(
      response,
      200,
      {
        ok: true,
        record_id: recordId,
        decoded: { interviewer: decoded.interviewerCode, tagNames: decoded.tagNames },
        fields_written: Object.keys(composed.fields),
        taSource: composed.taSource,
        reqId,
      },
      { 'x-request-id': reqId }
    );
  } catch (err) {
    const status = err instanceof FeishuApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    requestLog('error', { status, message });
    sendJson(response, status, { error: message, reqId }, { 'x-request-id': reqId });
  }
}

module.exports.handler = handle;
