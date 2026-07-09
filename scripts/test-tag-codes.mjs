#!/usr/bin/env node
/**
 * Mirror test for the tag-code encode/decode + Bitable field shaping.
 *
 * Why a mirror and not a real import of `src/content/apply.ts`?
 *   The project has no test runner installed (no vitest/jest) and the
 *   mjs runtime here can't directly import .ts. The actual functions
 *   live in `src/content/apply.ts` (encode/decodeApplyCode) and
 *   `api/decode-tag.ts` (composeBitableFields). Whenever you change
 *   any of those, you must mirror the change here.
 *
 *   To keep that in check, both files contain a `// mirror of
 *   src/content/apply.ts#decodeApplyCode` style comment block at the
 *   top, and the runbook says: "if you changed one, run this script
 *   and update the mirror." For full coverage add Playwright spec
 *   once the Feishu env is in place.
 *
 * Exits 0 on all pass, 1 on any fail.
 *
 * Run: `pnpm test:tag-codes`
 */

const APPLY_CATEGORIES = [
  { key: 'lane', options: [
    { name: '产品创意' }, { name: '项目展示' }, { name: '交互设计' }, { name: '技术达人' },
  ]},
  { key: 'tech', options: [
    { name: '智能体' }, { name: '前端' }, { name: '后端' }, { name: '算法' },
  ]},
  { key: 'play', options: [{ name: '台球' }, { name: '摄影' }]},
  { key: 'future', options: [{ name: '保研' }, { name: '留学' }]},
];

// ── mirror of src/content/apply.ts#encodeTagCode ──────────────────────
function encodeTagCode(selected) {
  const s = selected.map((idxs, i) => idxs.length > 0 ? `${i}:${idxs.join(',')}` : '').filter(Boolean).join(';');
  return Buffer.from(s, 'utf-8').toString('base64');
}

// ── mirror of src/content/apply.ts#decodeTagCode ──────────────────────
function decodeTagCode(code) {
  if (code === '') return APPLY_CATEGORIES.map(() => []);
  const plain = Buffer.from(code, 'base64').toString('utf-8');
  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;
  const result = APPLY_CATEGORIES.map(() => []);
  for (const seg of plain.split(';')) {
    const [catStr, indicesStr] = seg.split(':');
    const catIdx = Number(catStr);
    const indices = indicesStr.split(',').map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < APPLY_CATEGORIES[catIdx].options.length);
    result[catIdx] = indices;
  }
  return result;
}

// ── mirror of src/content/apply.ts#encodeApplyCode ────────────────────
function encodeApplyCode(selected, ivCode) {
  return `${ivCode || '_'}|${encodeTagCode(selected)}`;
}

// ── mirror of src/content/apply.ts#decodeApplyCode ────────────────────
function decodeApplyCode(code, knownIvs) {
  const i = code.indexOf('|');
  if (i <= 0) return null;
  const ivToken = code.slice(0, i);
  if (code.slice(i + 1) === '') {
    return {
      interviewerCode: ivToken === '_' ? null : ivToken,
      tagNames: { lane: [], tech: [], play: [], future: [] },
    };
  }
  const plain = Buffer.from(code.slice(i + 1), 'base64').toString('utf-8');
  if (!/^[0-3](:[0-9,]+)?(;[0-3](:[0-9,]+)?)*$/.test(plain)) return null;
  const idx = APPLY_CATEGORIES.map(() => []);
  for (const seg of plain.split(';')) {
    const [catStr, indicesStr] = seg.split(':');
    const ci = Number(catStr);
    const max = APPLY_CATEGORIES[ci]?.options.length ?? 0;
    idx[ci] = indicesStr.split(',').map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < max);
  }
  const names = { lane: [], tech: [], play: [], future: [] };
  APPLY_CATEGORIES.forEach((cat, ci) => {
    for (const t of idx[ci]) names[cat.key].push(cat.options[t].name);
  });
  const interviewerCode = ivToken === '_' ? null : ivToken;
  if (interviewerCode !== null && !knownIvs.has(interviewerCode)) return null;
  return { interviewerCode, tagNames: names };
}

// ── mirror of api/decode-tag.ts#composeBitableFields ──────────────────
const FIELD = {
  fieldLane: 'Mini Camp选路',
  fieldTech: '技术特长',
  fieldPlay: '兴趣爱好',
  fieldFuture: '未来道路',
  fieldTa: 'TA',
};
const INTERVIEWER_MAP = {
  'Mr.Y':   { name: '刘美琴', openId: 'ou_aaa' },
  'Zency':  { name: '王 Zency', openId: 'ou_bbb' },
  'DKK':    { name: 'DKK',   openId: 'ou_ccc' },
  'Leslie': { name: 'Leslie', openId: 'ou_ddd' },
  '007':    { name: '007',   openId: 'ou_eee' },
  'Jing':   { name: 'Jing',  openId: 'ou_fff' },
  'HH':     { name: 'HH',    openId: 'ou_ggg' },
  'TT':     { name: 'TT',    openId: 'ou_hhh' },
};

function composeBitableFields(decoded, interviewerMap, fieldNames) {
  const fields = {};
  const ms = (names) => names.map((text) => ({ text, type: 'text' }));
  fields[fieldNames.fieldLane] = ms(decoded.tagNames.lane);
  fields[fieldNames.fieldTech] = ms(decoded.tagNames.tech);
  fields[fieldNames.fieldPlay] = ms(decoded.tagNames.play);
  fields[fieldNames.fieldFuture] = ms(decoded.tagNames.future);
  if (decoded.interviewerCode !== null) {
    const person = interviewerMap[decoded.interviewerCode];
    if (person?.openId) {
      fields[fieldNames.fieldTa] = [{ id: person.openId }];
    }
  }
  return fields;
}

// ── test runner ───────────────────────────────────────────────────────
let ok = 0, fail = 0;
function check(name, got, want) {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a === b) { console.log(`  OK  ${name}`); ok++; }
  else { console.log(`  FAIL ${name}\n    got:  ${a}\n    want: ${b}`); fail++; }
}

const knownIvs = new Set(Object.keys(INTERVIEWER_MAP));
console.log('── encodeApplyCode / decodeApplyCode round-trip ──');
{
  const cases = [
    { selected: [[0], [1, 3], [0, 1], [0]], iv: 'Mr.Y' },
    { selected: [[3], [], [1], [1]], iv: null },
    { selected: [[], [], [], []], iv: 'Zency' },
    { selected: [[1, 2], [0, 1, 2, 3], [], []], iv: '007' },
  ];
  for (const [i, c] of cases.entries()) {
    const code = encodeApplyCode(c.selected, c.iv);
    const dec = decodeApplyCode(code, knownIvs);
    if (!dec) { check(`case ${i} decode`, false, true); continue; }
    check(`case ${i} iv round-trip`, dec.interviewerCode, c.iv);
    // Spot-check at least one tag name made it through.
    const expectedNames = { lane: [], tech: [], play: [], future: [] };
    APPLY_CATEGORIES.forEach((cat, ci) => {
      for (const t of c.selected[ci]) expectedNames[cat.key].push(cat.options[t].name);
    });
    check(`case ${i} tags round-trip`, dec.tagNames, expectedNames);
  }
}
console.log('\n── malformed code rejection ──');
for (const bad of ['', 'no-pipe', '|', 'foo|notbase64', 'Mr.Y|!!!', 'Mr.Y|xyz']) {
  check(`malformed "${bad}"`, decodeApplyCode(bad, knownIvs), null);
}
{
  const dec = decodeApplyCode('_|', knownIvs);
  check('legit "_|" (no iv + empty tags)', dec !== null && dec.interviewerCode === null, true);
}
{
  const dec = decodeApplyCode('GhostX|MDowOzE6MQ==', knownIvs);
  check('unknown iv → null', dec, null);
}

console.log('\n── composeBitableFields (4 multi-select + TA person) ──');
{
  const dec = decodeApplyCode('Mr.Y|MDowOzE6MSwzOzI6MCwxOzM6MA==', knownIvs);
  const fields = composeBitableFields(dec, INTERVIEWER_MAP, FIELD);
  check('full pick: lane', fields['Mini Camp选路'], [{ text: '产品创意', type: 'text' }]);
  check('full pick: tech', fields['技术特长'], [{ text: '前端', type: 'text' }, { text: '算法', type: 'text' }]);
  check('full pick: play', fields['兴趣爱好'], [{ text: '台球', type: 'text' }, { text: '摄影', type: 'text' }]);
  check('full pick: future', fields['未来道路'], [{ text: '保研', type: 'text' }]);
  check('full pick: TA', fields['TA'], [{ id: 'ou_aaa' }]);
}
{
  const dec = decodeApplyCode('_|MDoxOzI6MTszOjE=', knownIvs);
  const fields = composeBitableFields(dec, INTERVIEWER_MAP, FIELD);
  check('no iv: TA absent', fields['TA'], undefined);
  check('no iv: lane filled', fields['Mini Camp选路'], [{ text: '项目展示', type: 'text' }]);
}
{
  const dec = decodeApplyCode('Zency|', knownIvs);
  const fields = composeBitableFields(dec, INTERVIEWER_MAP, FIELD);
  check('empty tags + iv: all multi-selects empty', fields['Mini Camp选路'], []);
  check('empty tags + iv: TA still set', fields['TA'], [{ id: 'ou_bbb' }]);
}

console.log(`\n${ok} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
