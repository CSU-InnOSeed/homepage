/**
 * /api/apply — receives the recruitment form payload and persists it.
 *
 * Vercel auto-discovers anything under `api/` as a serverless function.
 * Built artifact: `.vercel/output/functions/api/apply.func/index.js`.
 *
 * Current state: STUB.
 *   - Validates the request body shape.
 *   - Generates a server-side reference code (base32 of random bytes).
 *   - Logs the full payload to stdout (visible in `vercel logs`).
 *   - Returns 200 + `{ code }`.
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

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

const TAG_CODE_RE = /^[A-Za-z0-9+/=_-]{4,}$/;
const INTERVIEWER_CODE_RE = /^[A-Za-z0-9._-]{1,40}$/;

function isApplyPayload(v: unknown): v is ApplyPayload {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  if (typeof p.tagCode !== 'string' || !TAG_CODE_RE.test(p.tagCode)) return false;
  if (p.interviewer !== null && (typeof p.interviewer !== 'string' || !INTERVIEWER_CODE_RE.test(p.interviewer))) return false;
  if (!Array.isArray(p.selections)) return false;
  for (const sel of p.selections) {
    if (typeof sel !== 'object' || sel === null) return false;
    const s = sel as Record<string, unknown>;
    if (typeof s.tag !== 'string' || s.tag.length === 0 || s.tag.length > 60) return false;
    if (s.category !== 'lane' && s.category !== 'tech' && s.category !== 'play' && s.category !== 'future') {
      return false;
    }
  }
  return true;
}

/**
 * Generate a 10-character server-side reference code. Base32 (Crockford
 * alphabet — no I/L/O/U to avoid visual ambiguity). 50 bits of entropy is
 * enough that collisions won't happen in any realistic 招新 volume.
 */
function generateServerCode(): string {
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
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body: unknown = request.body;
  if (!isApplyPayload(body)) {
    response.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const serverCode = generateServerCode();

  // TODO(real-destination): swap this for the chosen store.
  // The stub branch logs the structured payload + the new server code so
  // you can confirm the shape end-to-end before wiring a real store.
  console.log('[apply] received', {
    code: serverCode,
    interviewer: body.interviewer,
    tagCode: body.tagCode,
    selections: body.selections,
    submittedAt: new Date().toISOString(),
  });

  response.status(200).json({ code: serverCode });
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
