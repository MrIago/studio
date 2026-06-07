// Plumbing compartilhado — chamada base da OpenRouter (equivale ao callOrImageUtil da Lasy).
// BURRO: não conhece modelo nenhum. fetch → parse → extrai bytes/mime/cost.
// Cada caixa selada (models/<modelo>.mjs) monta o body e chama generateImage().
//
// Key: lê de env OPENROUTER_KEY OU de ~/.config/studio/.env (config.mjs).
// Quem instala a skill fornece a própria chave OpenRouter — NUNCA hardcode.
// Se a chave for uma PROVISIONING/management key (raro), seta
// OPENROUTER_PROVISIONING_KEY e a skill cria uma sub-key de inferência.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { get } from './config.mjs';
import { resolveOut, open as openDir, dirOf } from './output.mjs';

const OR = 'https://openrouter.ai/api/v1';
const KEY_CACHE = path.join(os.tmpdir(), 'studio-subkey.txt');

// Resolve a chave de inferência da OpenRouter.
//   1. OPENROUTER_KEY (env ou ~/.config/studio/.env) → uso direto.
//   2. OPENROUTER_PROVISIONING_KEY → cria uma sub-key de inferência (cacheia).
export async function getKey() {
  const direct = get('OPENROUTER_KEY');
  if (direct) return direct;

  const prov = get('OPENROUTER_PROVISIONING_KEY');
  if (!prov) {
    throw new Error(
      'Falta a chave OpenRouter. Defina OPENROUTER_KEY no ambiente, ou salve com:\n' +
      `  node ${path.join(path.dirname(new URL(import.meta.url).pathname), 'config.mjs')} OPENROUTER_KEY=sk-or-...`,
    );
  }
  // provisioning key não gera direto (401) — criar sub-key de inferência.
  if (fs.existsSync(KEY_CACHE)) {
    const k = fs.readFileSync(KEY_CACHE, 'utf8').trim();
    if (k) return k;
  }
  const res = await fetch(`${OR}/keys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${prov}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'studio', limit: 20 }),
  });
  const d = await res.json();
  if (!d.key) throw new Error(`Não consegui criar sub-key: ${JSON.stringify(d.error || d)}`);
  fs.writeFileSync(KEY_CACHE, d.key);
  return d.key;
}

// data URI a partir de bytes + mime (pra refs i2i).
export function bytesToDataUri(bytes, mimeType) {
  const b64 = Buffer.from(bytes).toString('base64');
  return `data:${mimeType};base64,${b64}`;
}

function extFor(mime) {
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  return 'bin';
}

// Chamada base. body = { model, messages, modalities, image_config }.
// Retorna { ok, bytes, mime, ext, cost } | { ok:false, status, reason, detail }.
export async function generateImage(body, key) {
  key = key || (await getKey());
  let res, d;
  try {
    res = await fetch(`${OR}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    d = await res.json();
  } catch (e) {
    return { ok: false, status: 0, reason: 'NETWORK', detail: String(e) };
  }
  if (d.error) {
    const msg = d.error.message || '';
    // classifica recusa/erro (espelha classifyOrImageErrorUtil da Lasy)
    const low = msg.toLowerCase();
    let reason = 'PROVIDER_ERROR';
    if (/content|safety|nsfw|flagged|moderation|cannot|can.?t help|sorry/.test(low)) reason = 'MODERATION';
    if (res.status === 429) reason = 'RATE_LIMITED';
    if (res.status === 402) reason = 'NO_CREDITS';
    return { ok: false, status: res.status, reason, detail: msg };
  }
  const msg = d.choices?.[0]?.message;
  const url = msg?.images?.[0]?.image_url?.url;
  if (!url) {
    // resposta de texto = recusa silenciosa
    return { ok: false, status: res.status, reason: 'NO_OUTPUT', detail: (msg?.content || '').slice(0, 120) };
  }
  const mime = url.slice(5, url.indexOf(';'));
  const bytes = Buffer.from(url.split(',', 2)[1], 'base64');
  return { ok: true, bytes, mime, ext: extFor(mime), cost: d.usage?.cost ?? null };
}

// Salva o resultado. `name` sem caminho → ~/studio-output/<data>/; caminho
// explícito (public/, absoluto, /tmp) → respeitado. Retorna o path salvo.
// Passe { open: true } pra abrir a pasta ao salvar (1 arquivo). Pra LOTES,
// não use open aqui — chame openOutput(dir) uma vez no fim (evita N janelas).
export function save(result, name, opts = {}) {
  if (!result.ok) {
    console.error(`  ✗ ${result.reason}: ${result.detail}`);
    return null;
  }
  const base = resolveOut(name);
  const out = `${base}.${result.ext}`;
  fs.writeFileSync(out, result.bytes);
  const cr = result.cost != null ? `~${Math.round(result.cost * 100)}cr` : '';
  console.log(`  ✓ ${out} (${(result.bytes.length / 1024) | 0}KB) ${cr}`);
  if (opts.open) openDir(dirOf(out));
  return out;
}

// abre a pasta do output no gerenciador de arquivos (chame 1x por lote).
export function openOutput(dirOrFile) {
  openDir(dirOrFile);
}
