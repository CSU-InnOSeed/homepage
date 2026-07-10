/**
 * 阿里云函数计算 custom runtime + Express (Node.js 12 兼容).
 *
 * 避免用 Node 18+ 才有的语法和 API:
 *   - 不使用 fetch (用 https 模块)
 *   - 不使用 ?? (用 || 或显式 null check)
 *   - 不使用 Object.getOwnPropertyNames
 */

const express = require('express');
const https = require('https');
const crypto = require('crypto');

const FEISHU_BASE = 'open.feishu.cn';

// ── tagcode helpers ──────────────────────────────────────────────

const APPLY_CATEGORIES = [
  { key: 'lane', options: [
    { name: '产品创意' }, { name: '项目展示' }, { name: '交互设计' }, { name: '技术达人' },
  ]},
  { key: 'tech', options: [
    { name: '智能体' }, { name: '前端' }, { name: '后端' }, { name: '算法' },
    { name: '深度学习' }, { name: '大模型' }, { name: '计算机视觉' }, { name: '数据优化' },
    { name: '逆向' }, { name: '科研' }, { name: '创业' }, { name: 'System' },
    { name: '项目' }, { name: '交互设计' }, { name: '流量管理' }, { name: 'Web3D' },
    { name: '医学图像' }, { name: '测试' }, { name: '密码学' }, { name: '可视化' },
    { name: '嵌入式' }, { name: '数据库' },
  ]},
  { key: 'play', options: [
    { name: '开源' }, { name: '台球' }, { name: '番剧' }, { name: '文学' },
    { name: 'ESPorts' }, { name: '旅游' }, { name: '剧本杀' }, { name: '综艺' }, { name: '咖啡' },
    { name: '干饭' }, { name: '羽毛球' }, { name: '篮球' }, { name: '游泳' },
    { name: '唱歌' }, { name: '美术' }, { name: '舞蹈' }, { name: '桌游' }, { name: '睡觉' },
    { name: '撸猫' }, { name: '撸狗' }, { name: '轻小说' }, { name: '乒乓球' },
    { name: '麻将' }, { name: '西洋棋' }, { name: '魔术' }, { name: '摄影' },
  ]},
  { key: 'future', options: [
    { name: '留学' }, { name: '保研' }, { name: '考研' }, { name: '就业' }, { name: '迷茫' },
  ]},
];

const INTERVIEWERS = [
  { code: 'Mr.Y', tags: ['智能体', '创业', '算法', '台球', '撸猫', '剧本杀', '综艺', '干饭', '羽毛球', '摄影', '唱歌', '美术', '舞蹈', '撸狗', '桌游', '睡觉'] },
  { code: 'Zency', tags: ['前端', '逆向', '番剧', '轻小说', '就业'] },
  { code: 'DKK', tags: ['前端', '交互设计', 'ESPorts', '麻将', '就业', '睡觉'] },
  { code: 'MciG', tags: ['开源', 'System', '西洋棋', '魔术', '后端'] },
  { code: '007', tags: ['深度学习', '大模型', '麻将', '保研'] },
  { code: 'Jing', tags: ['计算机视觉', '深度学习', '文学'] },
  { code: 'HH', tags: ['数据优化', '旅游'] },
  { code: 'TT', tags: ['流量管理', '乒乓球'] },
  { code: 'BarRaiser', tags: ['迷茫'] },
];

function b64d(s) {
  if (s === '') return '';
  return Buffer.from(s, 'base64').toString('utf-8');
}
function decodeTagCode(code) {
  if (typeof code !== 'string' || code.length === 0) return null;
  let plain;
  try { plain = b64d(code); } catch (e) { return null; }
  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;
  const result = APPLY_CATEGORIES.map(() => []);
  for (const seg of plain.split(';')) {
    const parts = seg.split(':');
    const catStr = parts[0];
    const indicesStr = parts[1] || '';
    const catIdx = Number(catStr);
    if (!Number.isInteger(catIdx) || catIdx < 0 || catIdx >= APPLY_CATEGORIES.length) return null;
    const maxTag = APPLY_CATEGORIES[catIdx].options.length;
    const indices = indicesStr.split(',').map(Number)
      .filter(function(n) { return Number.isInteger(n) && n >= 0 && n < maxTag; });
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
  for (let ci = 0; ci < APPLY_CATEGORIES.length; ci++) {
    const cat = APPLY_CATEGORIES[ci];
    for (const ti of tagIndices[ci]) {
      const opt = cat.options[ti];
      if (opt) tagNames[cat.key].push(opt.name);
    }
  }
  const interviewerCode = ivToken === '_' ? null : ivToken;
  let interviewer = null;
  if (interviewerCode !== null) {
    for (let i = 0; i < INTERVIEWERS.length; i++) {
      if (INTERVIEWERS[i].code === interviewerCode) { interviewer = INTERVIEWERS[i]; break; }
    }
    if (interviewer === null) return null;
  }
  return { interviewerCode: interviewerCode, tagIndices: tagIndices, tagNames: tagNames, interviewer: interviewer };
}

// ── 配置 / env ────────────────────────────────────────────────────

function readConfig() {
  const get = function(k) { return (process.env[k] || '').trim(); };
  const required = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_BITABLE_TOKEN', 'FEISHU_TABLE_ID', 'DECODE_TAG_TOKEN'];
  const missing = [];
  for (const k of required) {
    if (!get(k)) missing.push(k);
  }
  if (missing.length > 0) return { ok: false, missing: missing };

  let interviewerMap = {};
  const rawMap = get('INTERVIEWER_MAP');
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        for (const k of Object.keys(parsed)) {
          const v = parsed[k];
          if (typeof v === 'object' && v !== null && 'name' in v && typeof v.name === 'string') {
            interviewerMap[k] = { name: v.name, openId: v.openId || undefined };
          }
        }
      }
    } catch (e) { console.log(JSON.stringify({ stage: 'config', reason: 'INTERVIEWER_MAP parse failed: ' + e.message })); }
  }
  const autoLookup = get('LOOKUP_BY_NAME').toLowerCase() !== 'false';
  return {
    ok: true,
    cfg: {
      appId: get('FEISHU_APP_ID'),
      appSecret: get('FEISHU_APP_SECRET'),
      appToken: get('FEISHU_BITABLE_TOKEN'),
      tableId: get('FEISHU_TABLE_ID'),
      interviewerMap: interviewerMap, autoLookup: autoLookup,
      fieldCode: get('BITABLE_FIELD_CODE') || '个性标签',
      fieldLane: get('BITABLE_FIELD_LANE') || 'Mini Camp选路',
      fieldTech: get('BITABLE_FIELD_TECH') || '技术特长',
      fieldPlay: get('BITABLE_FIELD_PLAY') || '兴趣爱好',
      fieldFuture: get('BITABLE_FIELD_FUTURE') || '未来道路',
      fieldTa: get('BITABLE_FIELD_TA') || 'interviewer',
      decodeToken: get('DECODE_TAG_TOKEN'),
    },
  };
}

// ── 飞书 API helpers (Node 12 兼容: 用 https 模块) ─────────────────

let cachedToken = null;

function httpsRequest(method, path, headers, body) {
  return new Promise(function(resolve, reject) {
    const opts = {
      hostname: FEISHU_BASE,
      port: 443,
      path: path,
      method: method,
      headers: Object.assign({ 'content-type': 'application/json' }, headers || {}),
    };
    const req = https.request(opts, function(res) {
      const chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        const text = Buffer.concat(chunks).toString('utf-8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* ignore */ }
        resolve({ status: res.statusCode, json: json, text: text });
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function getTenantToken(cfg) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.token;
  const r = await httpsRequest('POST', '/open-apis/auth/v3/tenant_access_token/internal', null, {
    app_id: cfg.appId, app_secret: cfg.appSecret,
  });
  if (r.status !== 200 || !r.json || !r.json.tenant_access_token) {
    throw new Error('token error: ' + (r.json && r.json.msg || r.status));
  }
  const ttl = (r.json.expire || 7200) * 1000;
  cachedToken = { token: r.json.tenant_access_token, expiresAt: Date.now() + ttl - 5 * 60000 };
  return r.json.tenant_access_token;
}

async function readBitableRecord(cfg, token, recordId) {
  const path = '/open-apis/bitable/v1/apps/' + cfg.appToken + '/tables/' + cfg.tableId + '/records/' + recordId + '?text_field_as_array=true&user_id_type=open_id';
  const r = await httpsRequest('GET', path, { authorization: 'Bearer ' + token });
  if (r.status !== 200 || !r.json || r.json.code !== 0) {
    throw new Error('read feishu: ' + (r.json && r.json.msg) + ' (' + r.status + ')');
  }
  return r.json.data.record.fields;
}

async function writeBitableRecord(cfg, token, recordId, fields) {
  const path = '/open-apis/bitable/v1/apps/' + cfg.appToken + '/tables/' + cfg.tableId + '/records/' + recordId + '?user_id_type=open_id';
  const r = await httpsRequest('PUT', path, { authorization: 'Bearer ' + token }, { fields: fields });
  if (r.status !== 200 || !r.json || r.json.code !== 0) {
    throw new Error('write feishu: ' + (r.json && r.json.msg) + ' (' + r.status + ')');
  }
}

const personCache = new Map();
async function lookupOpenIdByName(token, name) {
  const cached = personCache.get(name);
  if (cached && cached.expiresAt > Date.now()) return cached.openId;
  const path = '/open-apis/search/v1/user?query=' + encodeURIComponent(name) + '&page_size=5';
  const r = await httpsRequest('GET', path, { authorization: 'Bearer ' + token });
  if (r.status !== 200 || !r.json || r.json.code !== 0) return null;
  const users = (r.json.data && r.json.data.users) || [];
  let match = null;
  for (let i = 0; i < users.length; i++) {
    if (users[i].name === name && users[i].user_id) { match = users[i]; break; }
  }
  if (!match) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].user_id) { match = users[i]; break; }
    }
  }
  if (!match || !match.user_id) return null;
  personCache.set(name, { openId: match.user_id, expiresAt: Date.now() + 86400000 });
  return match.user_id;
}

async function composeBitableFields(decoded, cfg, token) {
  const fields = {};
  fields[cfg.fieldLane] = decoded.tagNames.lane.slice();
  fields[cfg.fieldTech] = decoded.tagNames.tech.slice();
  fields[cfg.fieldPlay] = decoded.tagNames.play.slice();
  fields[cfg.fieldFuture] = decoded.tagNames.future.slice();
  let taSource = 'none', taDetail = 'no interviewer picked';
  if (decoded.interviewerCode !== null) {
    const entry = cfg.interviewerMap[decoded.interviewerCode];
    if (entry && entry.openId) {
      fields[cfg.fieldTa] = [{ id: entry.openId }];
      taSource = 'map';
      taDetail = decoded.interviewerCode + ' → ' + entry.name + ' (cached open_id)';
    } else if (entry && entry.name && cfg.autoLookup && token !== null) {
      const openId = await lookupOpenIdByName(token, entry.name);
      if (openId) {
        fields[cfg.fieldTa] = [{ id: openId }];
        taSource = 'auto';
        taDetail = decoded.interviewerCode + ' → ' + entry.name + ' → ' + openId + ' (auto-looked-up)';
      } else {
        taDetail = decoded.interviewerCode + ' → contact API found no match for "' + entry.name + '"';
      }
    } else if (token === null) {
      taDetail = decoded.interviewerCode + ' → GET mode skips contact API; TA not filled';
    } else if (!entry) {
      taDetail = decoded.interviewerCode + ' → not in INTERVIEWER_MAP; TA not filled';
    } else if (!entry.name) {
      taDetail = decoded.interviewerCode + ' → INTERVIEWER_MAP entry has no name; TA not filled';
    } else {
      taDetail = decoded.interviewerCode + ' → LOOKUP_BY_NAME=false; TA not filled';
    }
  }
  return { fields: fields, taSource: taSource, taDetail: taDetail };
}

function newRequestId() {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = crypto.randomBytes(6);
  let out = '', buffer = 0, bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(buffer >> bits) & 0x1f];
    }
  }
  return out.slice(0, 10);
}

// ── Express app ──────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '64kb' }));

app.use(async function(req, res) {
  const reqId = newRequestId();
  const method = req.method;
  const query = req.query;
  const log = function(stage, extra) {
    const obj = Object.assign({ ts: new Date().toISOString(), reqId: reqId, stage: stage, method: method, path: req.path }, extra || {});
    console.log(JSON.stringify(obj));
  };
  log('start');

  const cfgRes = readConfig();
  if (!cfgRes.ok) {
    log('reject_env', { status: 503, missing: cfgRes.missing });
    return res.status(503).json({ error: 'Server not configured', missing: cfgRes.missing, reqId: reqId });
  }
  const cfg = cfgRes.cfg;
  if (!cfg.decodeToken || query.token !== cfg.decodeToken) {
    log('reject_auth', { status: 401 });
    return res.status(401).json({ error: 'Unauthorized', reqId: reqId });
  }

  if (method === 'GET') {
    const code = query.code || '';
    if (!code) return res.status(400).json({ error: 'Missing ?code=...', reqId: reqId });
    const decoded = decodeApplyCode(code);
    if (!decoded) {
      log('get_decode_fail', { status: 400, code: code });
      return res.status(400).json({ error: 'Invalid code', code: code, reqId: reqId });
    }
    const composed = await composeBitableFields(decoded, cfg, null);
    log('get_decode_ok', { code: code, interviewer: decoded.interviewerCode, taSource: composed.taSource });
    return res.json({
      ok: true, code: code, decoded: decoded,
      fields: composed.fields,
      taSource: composed.taSource,
      taDetail: composed.taDetail,
      reqId: reqId,
    });
  }

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', reqId: reqId });
  }
  const body = req.body;
  if (typeof body !== 'object' || body === null) {
    return res.status(400).json({ error: 'body must be object', reqId: reqId });
  }
  const recordId = body.record_id;
  if (typeof recordId !== 'string' || recordId.length === 0 || recordId.length > 100) {
    log('reject_body', { status: 400 });
    return res.status(400).json({ error: 'record_id required', reqId: reqId });
  }

  try {
    const token = await getTenantToken(cfg);
    const fields = await readBitableRecord(cfg, token, recordId);
    const codeRaw = fields[cfg.fieldCode];
    let codeExtracted = codeRaw;
    if (Array.isArray(codeRaw) && codeRaw.length > 0) {
      const first = codeRaw[0];
      if (first && typeof first === 'object' && 'text' in first && typeof first.text === 'string') {
        codeExtracted = first.text;
      } else codeExtracted = '';
    }
    const code = typeof codeExtracted === 'string' ? codeExtracted.trim() : '';
    if (!code) {
      log('no_code', { status: 200, recordId: recordId, field: cfg.fieldCode });
      return res.json({ ok: true, skipped: 'no code in field', reqId: reqId });
    }
    const decoded = decodeApplyCode(code);
    if (!decoded) {
      log('decode_fail', { status: 422, recordId: recordId, code: code });
      return res.status(422).json({ error: 'Invalid code in record', code: code, reqId: reqId });
    }
    const composed = await composeBitableFields(decoded, cfg, token);
    const isSamePayload = function(a, b) { return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b); };
    const fieldsAlreadyMatch = (
      isSamePayload(fields[cfg.fieldLane], composed.fields[cfg.fieldLane]) &&
      isSamePayload(fields[cfg.fieldTech], composed.fields[cfg.fieldTech]) &&
      isSamePayload(fields[cfg.fieldPlay], composed.fields[cfg.fieldPlay]) &&
      isSamePayload(fields[cfg.fieldFuture], composed.fields[cfg.fieldFuture]) &&
      isSamePayload(fields[cfg.fieldTa], composed.fields[cfg.fieldTa])
    );
    if (fieldsAlreadyMatch) {
      log('noop_idempotent', { recordId: recordId, interviewer: decoded.interviewerCode, taSource: composed.taSource });
      return res.json({
        ok: true, record_id: recordId,
        skipped: 'idempotent: all 5 fields already match decoded payload',
        decoded: { interviewer: decoded.interviewerCode, tagNames: decoded.tagNames },
        taSource: composed.taSource, reqId: reqId,
      });
    }
    await writeBitableRecord(cfg, token, recordId, composed.fields);
    log('ok', { recordId: recordId, interviewer: decoded.interviewerCode, taSource: composed.taSource });
    return res.json({
      ok: true, record_id: recordId,
      decoded: { interviewer: decoded.interviewerCode, tagNames: decoded.tagNames },
      fields_written: Object.keys(composed.fields),
      taSource: composed.taSource, reqId: reqId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('error', { message: message });
    return res.status(500).json({ error: message, reqId: reqId });
  }
});

const PORT = 9000;
app.listen(PORT, function() {
  console.log(JSON.stringify({ ts: new Date().toISOString(), stage: 'listening', port: PORT }));
});