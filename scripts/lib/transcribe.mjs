// Transcrição com TIMESTAMPS (STT) — standalone, não depende de outra skill.
// Padrão espelhado da skill consume: Groq preferido (grátis ~8h/dia, rápido,
// devolve timestamps), fallback OpenAI whisper-1, ambos via verbose_json.
//
// Pra quê na studio: gerar a narração numa LEVADA SÓ (fluida, não picada), depois
// transcrever pra saber start/end de cada frase e SINCRONIZAR os beats do vídeo.
//
// Key: GROQ_API_KEY (recomendado) ou OPENAI_API_KEY — em env ou ~/.config/studio/.env.
//   node scripts/lib/config.mjs GROQ_API_KEY=gsk_...
// Sem GPU? sem problema — Groq roda na nuvem. (faster-whisper local não é usado
// aqui de propósito: a skill tem que funcionar em qualquer máquina.)
//
// Retorna: [{ start, end, text }, ...] em segundos absolutos.

import fs from 'node:fs';
import path from 'node:path';
import { get } from './config.mjs';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL = get('STUDIO_GROQ_MODEL', 'whisper-large-v3-turbo');
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const OPENAI_MODEL = 'whisper-1'; // único da OpenAI que devolve timestamps

function pickBackend() {
  const pref = (get('STUDIO_TRANSCRIBE', 'auto') || 'auto').toLowerCase();
  if (pref === 'groq' || pref === 'openai') return pref;
  if (get('GROQ_API_KEY')) return 'groq';
  if (get('OPENAI_API_KEY')) return 'openai';
  return null; // sem key → não dá pra transcrever na nuvem
}

// monta multipart/form-data com o arquivo de áudio + campos.
function multipart(fields, filePath) {
  const boundary = '----studio' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  const eol = '\r\n';
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}${eol}Content-Disposition: form-data; name="${k}"${eol}${eol}${v}${eol}`));
  }
  const name = path.basename(filePath);
  const mime = name.endsWith('.wav') ? 'audio/wav' : name.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';
  parts.push(Buffer.from(`--${boundary}${eol}Content-Disposition: form-data; name="file"; filename="${name}"${eol}Content-Type: ${mime}${eol}${eol}`));
  parts.push(fs.readFileSync(filePath));
  parts.push(Buffer.from(`${eol}--${boundary}--${eol}`));
  return { body: Buffer.concat(parts), boundary };
}

function segsFromVerbose(data) {
  const out = [];
  for (const s of data.segments || []) {
    const t = (s.text || '').trim();
    if (t) out.push({ start: +(+s.start).toFixed(2), end: +(+s.end).toFixed(2), text: t });
  }
  if (!out.length && (data.text || '').trim()) out.push({ start: 0, end: 0, text: data.text.trim() });
  return out;
}

/**
 * Transcreve um áudio → segmentos com timestamps absolutos (segundos).
 * @param {string} audioPath  caminho do arquivo (mp3/wav/m4a)
 * @returns {Promise<Array<{start:number,end:number,text:string}>>}
 */
export async function transcribe(audioPath) {
  const backend = pickBackend();
  if (!backend) {
    throw new Error(
      'Transcrição precisa de uma key. Configure (Groq é grátis ~8h/dia):\n' +
      '  node scripts/lib/config.mjs GROQ_API_KEY=gsk_...  (pegue em console.groq.com/keys)',
    );
  }
  const [endpoint, key, model] = backend === 'groq'
    ? [GROQ_ENDPOINT, get('GROQ_API_KEY'), GROQ_MODEL]
    : [OPENAI_ENDPOINT, get('OPENAI_API_KEY'), OPENAI_MODEL];

  const { body, boundary } = multipart(
    { model, response_format: 'verbose_json', temperature: '0' },
    audioPath,
  );
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    throw new Error(`STT ${backend} HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }
  return segsFromVerbose(await res.json());
}

// formata pra leitura: [MM:SS] texto
export function formatTranscript(segs) {
  return segs.map((s) => {
    const m = String(Math.floor(s.start / 60)).padStart(2, '0');
    const sec = String(Math.floor(s.start % 60)).padStart(2, '0');
    return `[${m}:${sec}] ${s.text}`;
  }).join('\n');
}

// CLI: node transcribe.mjs <audio.mp3>  → imprime os segmentos com timestamps
if (import.meta.url === `file://${process.argv[1]}`) {
  const f = process.argv[2];
  if (!f) { console.log('uso: node transcribe.mjs <audio.mp3>'); process.exit(1); }
  const segs = await transcribe(f);
  console.log(JSON.stringify(segs, null, 2));
  console.log('\n' + formatTranscript(segs));
}
