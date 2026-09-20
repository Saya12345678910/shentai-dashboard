/**
 * 双端同步 · EdgeOne Pages 边缘函数 · Blob 版
 * 路由：/edge-functions/api/sync.js  →  https://你的域名/api/sync
 *
 * ── 什么时候用这一版 ──
 *   KV 版要在控制台提申请、等腾讯云人工审核才能开通。这一版不用审核，
 *   首次调用 getStore() 时平台自动建命名空间。代价是工程多了一个 npm 依赖，
 *   所以必须走 Git 部署（平台会自动 npm install），不能用拖文件夹直接上传。
 *
 * ── 接口与 KV 版完全一致 ──
 *   前端一个字都不用改。两版可以直接对换。
 *
 * ── 比 KV 版好在哪 ──
 *   1. 不用等审批
 *   2. 强一致读：电脑改完，手机立刻能拉到新的。KV 最长要等 60 秒
 *
 * ── 别误会的一点 ──
 *   Blob 单值上限 25MB，但边缘函数的**请求体**上限是 1MB，先卡住的是这个。
 *   所以能同步的数据量和 KV 版一样，图片类内容照样不参与同步。
 */

import { getStore } from '@edgeone/pages-blob';

const MAX_FAIL = 5;
const LOCK_MS = 5 * 60 * 1000;
const MAX_BYTES = 700 * 1024;    // 受限于请求体 1MB，不是受限于 Blob

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

/* 一律强一致读。同步这件事最怕的就是「我明明改了，另一台还是旧的」，
   为此多花的那几十毫秒完全值得。 */
function store() {
  return getStore({ name: 'dashboard', consistency: 'strong' });
}

/* key 里不放明文用户名——控制台能只读浏览对象列表，hash 一下别人就看不出谁是谁 */
async function hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** 与前端 Store.mergeList 同一套规则：按 id 取修改时间更新的那条 */
function mergeList(a, b) {
  const m = new Map();
  for (const it of [...(a || []), ...(b || [])]) {
    if (!it || !it.id) continue;
    const prev = m.get(it.id);
    if (!prev || (it._u || 0) > (prev._u || 0)) m.set(it.id, it);
  }
  return Array.from(m.values());
}

/** 服务端合并，消除「两端同时 push」的竞态。数组逐条合并，单值保留已有 */
function mergeAll(server, client) {
  const out = Object.assign({}, server || {});
  for (const [k, cv] of Object.entries(client || {})) {
    if (k.startsWith('_')) continue;
    const sv = out[k];
    if (Array.isArray(cv)) out[k] = mergeList(Array.isArray(sv) ? sv : [], cv);
    else if (sv === undefined || sv === null) out[k] = cv;
  }
  return out;
}

export async function onRequestPost(context) {
  const { request } = context;
  const s = store();

  let body;
  try { body = await request.json(); }
  catch { return json({ error: '请求格式不对' }, 400); }

  const user = String(body.user || '').trim().toLowerCase();
  const pass = String(body.pass || '');
  const action = String(body.action || 'pull');

  if (user.length < 3 || user.length > 32) return json({ error: '用户名需要 3-32 个字符' }, 400);
  if (pass.length < 8) return json({ error: '密码至少 8 位' }, 400);

  const uid = await hex('u|' + user);
  const kAuth = `auth/${uid}`;     // Blob 的 key 支持用 / 分目录，控制台里看着清楚
  const kData = `data/${uid}`;
  const kRate = `rate/${uid}`;

  const get = k => s.get(k, { type: 'json' });

  // ── 限流：连续失败太多次就锁一段时间 ──
  const rate = (await get(kRate)) || { n: 0, until: 0 };
  const now = Date.now();
  if (rate.until && now < rate.until) {
    const mins = Math.ceil((rate.until - now) / 60000);
    return json({ error: `密码错误次数过多，请 ${mins} 分钟后再试` }, 429);
  }

  const auth = await get(kAuth);

  // ── 首次使用：把这个用户名注册下来 ──
  if (!auth) {
    if (action !== 'register' && action !== 'push') {
      return json({ error: 'NO_ACCOUNT' }, 404);
    }
    const salt = randSalt();
    await s.setJSON(kAuth, { salt, hash: await hex(pass + '|' + salt), createdAt: now });
    await s.setJSON(kData, body.data || {});
    return json({ ok: true, created: true, data: body.data || {} });
  }

  // ── 验密码 ──
  const h = await hex(pass + '|' + auth.salt);
  if (h !== auth.hash) {
    const n = (rate.n || 0) + 1;
    await s.setJSON(kRate, { n, until: n >= MAX_FAIL ? now + LOCK_MS : 0 });
    const left = MAX_FAIL - n;
    return json({ error: left > 0 ? `密码不对，还能试 ${left} 次` : '密码错误次数过多，已锁定 5 分钟' }, 401);
  }
  if (rate.n) await s.setJSON(kRate, { n: 0, until: 0 });   // 验证通过就清零

  // ── 改密码：只换验证信息，数据一动不动 ──
  if (action === 'chpass') {
    const np = String(body.newPass || '');
    if (np.length < 8) return json({ error: '新密码至少 8 位' }, 400);
    const salt = randSalt();
    await s.setJSON(kAuth, {
      salt, hash: await hex(np + '|' + salt), createdAt: auth.createdAt, changedAt: now
    });
    return json({ ok: true, changed: true });
  }

  // ── 拉 ──
  if (action === 'pull') {
    return json({ ok: true, data: (await get(kData)) || {} });
  }

  // ── 推：服务端合并后写回，并把合并结果返给客户端 ──
  if (action === 'push') {
    const raw = JSON.stringify(body.data || {});
    if (raw.length > MAX_BYTES) {
      return json({ error: '数据太大了（超过 700KB）。图片类内容不要参与同步' }, 413);
    }
    const merged = mergeAll((await get(kData)) || {}, body.data || {});
    await s.setJSON(kData, merged);
    return json({ ok: true, data: merged });
  }

  return json({ error: '未知操作' }, 400);
}

/** 浏览器预检 */
export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' }
  });
}
