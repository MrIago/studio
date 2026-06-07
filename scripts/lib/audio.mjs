// Plumbing de áudio TTS — chamada base /audio/speech (retorna bytes brutos, NÃO json).
// gemini só sai em PCM → wrappa em WAV (24kHz mono 16-bit). mai sai em MP3.

import { getKey } from './or.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OR = 'https://openrouter.ai/api/v1';

// Wrappa PCM cru (s16le 24kHz mono) num container WAV tocável.
export function pcmToWav(pcmBytes, sampleRate = 24000, channels = 1, bits = 16) {
  const dataLen = pcmBytes.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);                       // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bits / 8, 28);
  header.writeUInt16LE(channels * bits / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  return Buffer.concat([header, pcmBytes]);
}

/**
 * TTS base. Retorna { ok, bytes, ext } | { ok:false, status, detail }.
 * @param {object} o
 * @param {string} o.model
 * @param {string} o.input        texto
 * @param {string} o.voice
 * @param {string} o.format       'mp3' | 'pcm' (default por modelo)
 * @param {string} [o.instructions]  steer de tom (alguns modelos)
 */
export async function tts(o, key) {
  key = key || (await getKey());
  const body = { model: o.model, input: o.input, voice: o.voice, response_format: o.format };
  if (o.instructions) body.instructions = o.instructions;
  let res;
  try {
    res = await fetch(`${OR}/audio/speech`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, status: 0, detail: String(e) };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  // erro vem como JSON (começa com '{')
  if (buf[0] === 0x7b) {
    return { ok: false, status: res.status, detail: buf.toString('utf8').slice(0, 150) };
  }
  // PCM → WAV pra ficar tocável
  if (o.format === 'pcm') {
    return { ok: true, bytes: pcmToWav(buf), ext: 'wav' };
  }
  return { ok: true, bytes: buf, ext: o.format === 'mp3' ? 'mp3' : o.format };
}

export function saveAudio(result, outPathNoExt) {
  if (!result.ok) { console.error(`  ✗ ${result.status}: ${result.detail}`); return null; }
  const out = `${outPathNoExt}.${result.ext}`;
  fs.writeFileSync(out, result.bytes);
  console.log(`  ✓ ${path.basename(out)} (${(result.bytes.length / 1024) | 0}KB)`);
  return out;
}
