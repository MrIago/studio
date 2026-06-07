// lyria-3 — CAIXA SELADA (MÚSICA). Google Lyria 3, instrumental. ÚNICO gerador
// de música na OR (gpt-audio é conversa-com-voz, não música).
// ⚠️ Chamada DIFERENTE de imagem/TTS: POST /chat/completions com
// modalities:['audio','text'] + stream:true OBRIGATÓRIO (sem stream → 400).
// Áudio vem nos chunks SSE em delta.audio.data (base64) — concatena → MP3.
//
// 2 versões:
//   clip = 'google/lyria-3-clip-preview'  ~31s · ~4cr · gera ~9s   (loop/intro)
//   pro  = 'google/lyria-3-pro-preview'   ~2,6min · ~8cr · gera ~34s (trilha completa)

import { getKey } from '../lib/or.mjs';

export const CLIP = 'google/lyria-3-clip-preview';
export const PRO = 'google/lyria-3-pro-preview';
export const OUTPUT = 'mp3';

/**
 * @param {object} o
 * @param {string} o.prompt              descrição da música (instrumental, no vocals, etc)
 * @param {'clip'|'pro'} [o.version]     default 'clip' (~31s, barato) | 'pro' (~2,6min)
 * @param {number} [o.retries]           tentativas (Lyria às vezes volta vazio) — default 3
 */
export async function lyria3(o, key) {
  if (!o?.prompt) throw new Error('lyria3: prompt obrigatório');
  key = key || (await getKey());
  const max = o.retries ?? 3;
  let last;
  for (let attempt = 1; attempt <= max; attempt++) {
    last = await lyria3Once(o, key);
    if (last.ok) return last;
    // só faz retry no "áudio vazio" (rate-limit/stream incompleto); erro real (4xx) não.
    if (last.status && last.status >= 400 && last.status < 500 && !String(last.detail).includes('vazio')) return last;
  }
  return last;
}

async function lyria3Once(o, key) {
  const model = o.version === 'pro' ? PRO : CLIP;
  let res;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: true, // OBRIGATÓRIO p/ áudio
        modalities: ['audio', 'text'],
        messages: [{ role: 'user', content: o.prompt }],
      }),
    });
  } catch (e) {
    return { ok: false, status: 0, detail: String(e) };
  }

  // lê o SSE inteiro e concatena delta.audio.data (base64)
  const text = await res.text();
  const parts = [];
  let cost = null;
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (!l.startsWith('data:')) continue;
    const p = l.slice(5).trim();
    if (p === '[DONE]') break;
    try {
      const d = JSON.parse(p);
      const a = d.choices?.[0]?.delta?.audio?.data;
      if (a) parts.push(a);
      if (d.usage?.cost) cost = d.usage.cost;
    } catch {}
  }
  const bytes = Buffer.from(parts.join(''), 'base64');
  if (bytes.length < 1024) {
    // stream vazio (keep-alive / rate-limit / incompleto) — Lyria às vezes volta vazio na 1ª
    return { ok: false, status: res.status, detail: `áudio vazio (retry): ${text.slice(0, 150)}` };
  }
  return { ok: true, bytes, ext: 'mp3', cost };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const prompt = process.argv[2] || 'Upbeat electronic tech background music, driving beat, instrumental, no vocals';
  const version = process.argv[3] === 'pro' ? 'pro' : 'clip';
  console.log(`▸ lyria-3 (${version}) | "${prompt}"`);
  // música é mp3 mas usa o `save` do or.mjs (grava bytes + ext)
  const r = await lyria3({ prompt, version });
  if (r.ok) {
    const fs = await import('node:fs');
    fs.writeFileSync('/tmp/lyria-out.mp3', r.bytes);
    console.log(`  ✓ lyria-out.mp3 (${(r.bytes.length/1024)|0}KB) ~${Math.round((r.cost||0)*100)}cr`);
  } else console.error(`  ✗ ${r.detail}`);
}
