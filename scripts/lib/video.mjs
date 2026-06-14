// Plumbing de VÍDEO — protocolo ASSÍNCRONO da OpenRouter (≠ imagem/áudio síncronos).
// submit (POST /videos) → poll (GET /videos/{id}) em loop → download dos bytes.
// BURRO: não conhece modelo nenhum. Cada caixa selada (models/<modelo>.mjs) monta
// o body específico (ratio/res/duration/frames) e chama runVideo(). Saída mp4.
//
// Fluxo: submit devolve { id } → poll a cada ~15s até 'completed' → baixa
// unsigned_urls[0] (com Bearer se for URL openrouter.ai) → bytes.

import { getKey } from './or.mjs';
import { resolveOut, open as openDir, dirOf } from './output.mjs';
import fs from 'node:fs';

const OR = 'https://openrouter.ai/api/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// bytes (Buffer/ArrayBuffer) + mime → data URI (pra frame_images / input_references).
export function bytesToDataUri(bytes, mimeType) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

// POST /videos → { ok, id } | { ok:false, reason, detail }.
export async function submitOrVideo(body, key) {
  key = key || (await getKey());
  let res, d;
  try {
    res = await fetch(`${OR}/videos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    d = await res.json();
  } catch (e) {
    return { ok: false, reason: 'NETWORK', detail: String(e) };
  }
  if (d.error || !d.id) {
    const msg = d.error?.message || `HTTP ${res.status}`;
    let reason = 'PROVIDER_ERROR';
    if (res.status === 429) reason = 'RATE_LIMITED';
    if (res.status === 402) reason = 'NO_CREDITS';
    if (/content|safety|nsfw|moderation|cannot|sorry/i.test(msg)) reason = 'MODERATION';
    return { ok: false, reason, detail: msg.slice(0, 200) };
  }
  return { ok: true, id: d.id };
}

// GET /videos/{id} → { status:'pending'|'done'|'failed', downloadUrl?, cost? }.
export async function pollOrVideo(id, key) {
  let res, d;
  try {
    res = await fetch(`${OR}/videos/${id}`, { headers: { Authorization: `Bearer ${key}` } });
    d = await res.json();
  } catch {
    return { status: 'pending' }; // erro de rede no poll não é terminal
  }
  if (d.status === 'completed') {
    const url = d.unsigned_urls?.[0];
    if (!url) return { status: 'failed', detail: 'completed sem unsigned_urls' };
    return { status: 'done', downloadUrl: url, cost: d.usage?.cost ?? null };
  }
  if (d.status === 'failed' || d.status === 'cancelled' || d.status === 'expired') {
    const err = typeof d.error === 'string' ? d.error : d.error?.message ?? d.status;
    return { status: 'failed', detail: `${d.status}: ${String(err).slice(0, 200)}` };
  }
  return { status: 'pending' }; // pending | in_progress | qualquer outro
}

// Baixa os bytes do vídeo pronto. URL openrouter.ai exige Bearer (não é pública).
async function downloadVideo(url, key) {
  const headers = url.includes('openrouter.ai') ? { Authorization: `Bearer ${key}` } : {};
  const res = await fetch(url, { headers });
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Ciclo completo submit→poll→download. Body já montado pela caixa selada.
 * @param {object} body  { model, prompt, aspect_ratio, ... } pronto pra OR
 * @param {object} [o]   { pollMs=15000, timeoutMs=600000, log=true }
 * @returns {{ ok, bytes, ext:'mp4', mime, cost }} | { ok:false, reason, detail }
 */
export async function runVideo(body, key, o = {}) {
  key = key || (await getKey());
  const pollMs = o.pollMs ?? 15000;
  const timeoutMs = o.timeoutMs ?? 600000;
  const log = o.log !== false;

  const sub = await submitOrVideo(body, key);
  if (!sub.ok) return sub;
  if (log) console.log(`  ⏳ submit ok (id ${sub.id}) — pollando a cada ${pollMs / 1000}s...`);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    const p = await pollOrVideo(sub.id, key);
    if (p.status === 'done') {
      const bytes = await downloadVideo(p.downloadUrl, key);
      return { ok: true, bytes, ext: 'mp4', mime: 'video/mp4', cost: p.cost };
    }
    if (p.status === 'failed') return { ok: false, reason: 'PROVIDER_ERROR', detail: p.detail };
    if (log) process.stdout.write('  .');
  }
  return { ok: false, reason: 'TIMEOUT', detail: `não completou em ${timeoutMs / 1000}s` };
}

// Salva o vídeo (mesmo padrão de save/saveAudio). { open:true } abre a pasta.
export function saveVideo(result, name, opts = {}) {
  if (!result.ok) { console.error(`  ✗ ${result.reason}: ${result.detail}`); return null; }
  const out = `${resolveOut(name)}.${result.ext}`;
  fs.writeFileSync(out, result.bytes);
  const cr = result.cost != null ? `~${Math.round(result.cost * 100)}cr` : '';
  console.log(`  ✓ ${out} (${(result.bytes.length / 1024) | 0}KB) ${cr}`);
  if (opts.open) openDir(dirOf(out));
  return out;
}
