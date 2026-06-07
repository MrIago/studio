// mai-voice-2 — CAIXA SELADA (TTS). Microsoft Azure AI Speech, POLIGLOTA.
// 46 vozes em 18 idiomas (PT-BR: Luana/Caio/Pedro/Rafael). ESTILOS expressivos
// POR voz (happy/sad/excited/regretful/whispering/shouting/...) + speed 0.5-2.0.
// MP3 direto, ~1cr. Voz ID = `<locale>-<Name>:MAI-Voice-2`.
//
// 🔑 ESTILO via provider.options.azure (NÃO campo `style` solto — esse a OR IGNORA,
//    confirmado no OpenAPI: SpeechRequest só tem input/model/voice/response_format/speed).
//    style + STYLEDEGREE (intensidade, ex 2) = o que faz o estilo pegar com exatidão.
//    SSML no input NÃO funciona (lê as tags XML em voz alta). speed = campo do body.

import { getKey } from '../lib/or.mjs';
import { pcmToWav } from '../lib/audio.mjs';
import { MAI_LANGUAGES, MAI_VOICE_IDS, MAI_VOICE_BY_ID, MAI_DEFAULT_VOICE } from '../lib/mai-voices.mjs';

export const MODEL = 'microsoft/mai-voice-2';
export const OUTPUT = 'mp3';
export const COST = '~1cr';
export const LANGUAGES = MAI_LANGUAGES;   // 18 idiomas com vozes + estilos
export const VOICE_IDS = MAI_VOICE_IDS;   // 46 vozes
export const SPEED_RANGE = [0.5, 2.0];
export const STYLE_DEGREE_RANGE = [0.01, 2]; // intensidade do estilo

/**
 * @param {object} o
 * @param {string} o.input          texto
 * @param {string} [o.voice]        ID completo, default pt-BR-Luana (ver VOICE_IDS / LANGUAGES)
 * @param {string} [o.style]        estilo expressivo (válido por voz — ver vc.styles)
 * @param {number} [o.styleDegree]  intensidade do estilo 0.01–2 (default 2 quando há style) ⭐
 * @param {number} [o.speed]        0.5–2.0, default 1.0
 * @param {string} [o.format]       'mp3' | 'pcm', default 'mp3'
 */
export async function maiVoice2(o, key) {
  if (!o?.input) throw new Error('maiVoice2: input obrigatório');
  const voice = o.voice ?? MAI_DEFAULT_VOICE;
  const vc = MAI_VOICE_BY_ID[voice];
  if (!vc) throw new Error(`maiVoice2: voz inválida "${voice}". Ver VOICE_IDS (46).`);
  if (o.style && !vc.styles.includes(o.style)) {
    console.warn(`  ⚠️ style "${o.style}" não é válido p/ ${vc.name}. Válidos: ${vc.styles.join(', ') || '(nenhum)'}`);
  }

  const format = o.format ?? 'mp3';
  const body = { model: MODEL, input: o.input, voice, response_format: format };
  if (o.speed != null) body.speed = o.speed; // speed = campo oficial do body

  // estilo SÓ funciona via provider.options.azure + styledegree (intensidade).
  if (o.style) {
    body.provider = {
      options: { azure: { style: o.style, styledegree: o.styleDegree ?? 2 } },
    };
  }

  key = key || (await getKey());
  const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf[0] === 0x7b) return { ok: false, status: res.status, detail: buf.toString('utf8').slice(0, 150) };
  if (format === 'pcm') return { ok: true, bytes: pcmToWav(buf), ext: 'wav' };
  return { ok: true, bytes: buf, ext: 'mp3' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { saveAudio } = await import('../lib/audio.mjs');
  const text = process.argv[2] || 'Olá! Esse é um teste de voz em português brasileiro.';
  const voice = process.argv[3] || 'pt-BR-Luana:MAI-Voice-2';
  const style = process.argv[4];
  console.log(`▸ mai-voice-2 | voz=${voice}${style ? ` | estilo=${style} (degree 2)` : ''} | "${text}"`);
  saveAudio(await maiVoice2({ input: text, voice, style }), '/tmp/mai-out');
}
