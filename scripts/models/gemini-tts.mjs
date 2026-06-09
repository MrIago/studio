// gemini-tts — CAIXA SELADA (TTS). Google Gemini Flash TTS. O PADRÃO de voz.
// (backend nativo: gemini-2.5-flash-preview-tts; via OpenRouter: modelo TTS do Gemini.)
// 30 vozes, multilíngue (PT-BR bom), e o diferencial: TAGS DE EMOÇÃO INLINE
// ([excited]/[whispers]/[laughs]/...) que mudam o tom no meio do texto — e
// MULTI-PERSONAGEM (várias vozes num diálogo). ~1cr.
//
// 2 backends, escolhidos automaticamente:
//   • GEMINI_API_KEY setada → API NATIVA do Google. Suporta MULTI-SPEAKER real
//     (até 2 vozes/request via multiSpeakerVoiceConfig). PREFERIDO.
//   • só OPENROUTER_KEY → via OpenRouter /audio/speech. 1 voz/request (sem
//     multi-speaker nativo — a OR não roteia). Pra múltiplas vozes, FALLBACK:
//     gera N áudios (um por personagem) e o chamador encadeia.
//
// Saída sempre PCM 24kHz mono → a caixa wrappa em WAV.
// Config: node scripts/lib/config.mjs GEMINI_API_KEY=...  (ou OPENROUTER_KEY)

import { get, } from '../lib/config.mjs';
import { getKey } from '../lib/or.mjs';
import { pcmToWav } from '../lib/audio.mjs';
import { GEMINI_VOICES, GEMINI_VOICE_IDS, GEMINI_DEFAULT_VOICE, GEMINI_EMOTION_TAGS } from '../lib/gemini-voices.mjs';

export const VOICES = GEMINI_VOICES;
export const VOICE_IDS = GEMINI_VOICE_IDS;
export const EMOTION_TAGS = GEMINI_EMOTION_TAGS;
export const OUTPUT = 'wav';
export const COST = '~1cr';

const OR_MODEL = 'google/gemini-3.1-flash-tts-preview';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-tts'; // API nativa
const GEMINI_URL = (m, k) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`;

function wrap(pcmBuf) { return pcmToWav(pcmBuf); }

// ── modo 1: narração de UMA voz (tags de emoção inline ok) ──────────────────
/**
 * @param {object} o
 * @param {string} o.input    texto (pode ter tags: "[excited] Olá! [whispers] segredo.")
 * @param {string} [o.voice]  uma das 30 (default Sulafat)
 * @returns {{ok, bytes, ext}}
 */
export async function geminiTts(o, key) {
  if (!o?.input) throw new Error('geminiTts: input obrigatório');
  const voice = o.voice ?? GEMINI_DEFAULT_VOICE;
  if (!GEMINI_VOICES[voice]) throw new Error(`voz inválida "${voice}". 30 em VOICE_IDS.`);

  const gkey = get('GEMINI_API_KEY');
  if (gkey) return geminiNativeSingle(o.input, voice, gkey);
  return geminiViaOR(o.input, voice, key);
}

// ── modo 2: DIÁLOGO multi-personagem (até 2 vozes num request) ──────────────
// Só com GEMINI_API_KEY. Sem ela, lança erro orientando o fallback manyVoices().
/**
 * @param {object} o
 * @param {{speaker:string, voice:string}[]} o.speakers  até 2 (nome + voz das 30)
 * @param {string} o.script  diálogo "Nome: [tag] fala\nOutro: fala" (nomes batem c/ speakers)
 */
export async function geminiDialog(o, _key) {
  if (!o?.script || !o?.speakers?.length) throw new Error('geminiDialog: script + speakers obrigatórios');
  const gkey = get('GEMINI_API_KEY');
  if (!gkey) {
    throw new Error('Diálogo multi-voz num request exige GEMINI_API_KEY (a OR não roteia multi-speaker). ' +
      'Sem ela, use manyVoices() pra gerar 1 áudio por personagem e encadear.');
  }
  if (o.speakers.length > 2) throw new Error('multi-speaker nativo do Gemini aceita no máx 2 vozes. Pra 3+, use manyVoices().');
  for (const s of o.speakers) if (!GEMINI_VOICES[s.voice]) throw new Error(`voz inválida "${s.voice}"`);

  const body = {
    contents: [{ parts: [{ text: `TTS o seguinte diálogo:\n${o.script}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: o.speakers.map((s) => ({
            speaker: s.speaker,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } },
          })),
        },
      },
    },
  };
  return geminiExtract(await geminiPost(GEMINI_MODEL, gkey, body));
}

// ── fallback: N personagens → 1 áudio por fala (encadeia depois) ────────────
// Funciona com qualquer backend. Retorna um array de resultados {ok,bytes,ext}
// na ordem das falas. O chamador (vídeo) sequencia/encadeia com respiro.
/**
 * @param {{voice:string, text:string}[]} lines  cada fala: voz + texto (c/ tags)
 */
export async function manyVoices(lines, key) {
  if (!Array.isArray(lines) || !lines.length) throw new Error('manyVoices: lines[] obrigatório');
  return Promise.all(lines.map((l) => geminiTts({ input: l.text, voice: l.voice }, key)));
}

// ── backends ────────────────────────────────────────────────────────────────
async function geminiNativeSingle(text, voice, gkey) {
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };
  return geminiExtract(await geminiPost(GEMINI_MODEL, gkey, body));
}

async function geminiPost(model, gkey, body) {
  const res = await fetch(GEMINI_URL(model, gkey), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json();
  if (d.error) return { ok: false, status: res.status, detail: (d.error.message || '').slice(0, 160) };
  return { ok: true, data: d };
}

function geminiExtract(r) {
  if (!r.ok) return r;
  const parts = r.data.candidates?.[0]?.content?.parts || [];
  const audio = parts.find((p) => p.inlineData);
  if (!audio) return { ok: false, status: 0, detail: 'sem áudio na resposta Gemini' };
  const pcm = Buffer.from(audio.inlineData.data, 'base64');
  return { ok: true, bytes: wrap(pcm), ext: 'wav' };
}

async function geminiViaOR(text, voice, key) {
  key = key || (await getKey());
  const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OR_MODEL, input: text, voice, response_format: 'pcm' }),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf[0] === 0x7b) return { ok: false, status: res.status, detail: buf.toString('utf8').slice(0, 160) };
  return { ok: true, bytes: wrap(buf), ext: 'wav' };
}

// CLI: node gemini-tts.mjs "texto [excited] com tags" [voz]
if (import.meta.url === `file://${process.argv[1]}`) {
  const { saveAudio } = await import('../lib/audio.mjs');
  const text = process.argv[2] || 'Olá! [excited] Esse é um teste de voz em português. [whispers] com tags de emoção.';
  const voice = process.argv[3] || GEMINI_DEFAULT_VOICE;
  const via = get('GEMINI_API_KEY') ? 'Gemini nativo' : 'OpenRouter';
  console.log(`▸ gemini-tts (${via}) | voz=${voice}`);
  saveAudio(await geminiTts({ input: text, voice }), 'gemini-tts-out', { open: true });
}
