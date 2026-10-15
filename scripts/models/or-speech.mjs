// or-speech — CAIXA GENÉRICA de voz: QUALQUER modelo /audio/speech da OpenRouter.
// O catálogo de TTS cresce todo mês (35 modelos em out/2026: ElevenLabs v4,
// MAI-Voice 2.1, Gemini 3.8, MiniMax, Fish…). Em vez de uma caixa por modelo,
// esta recebe o id e resolve o formato: Google só sai em PCM (vira WAV), o resto MP3.
// Lista viva + preço: `node scripts/catalog.mjs speech`. Vozes de um modelo:
// `node scripts/catalog.mjs speech <id>`.
//
// Escolha por caso (testado 15/10/2026, mesma frase PT-BR, transcrita de volta):
//   • narração PT-BR nativa  → microsoft/mai-voice-2.1 + 'pt-BR-Rafael|Caio|Pedro|Luana|Harper:MAI-Voice-2.1'
//                              (únicas vozes NATIVAS pt-BR do catálogo; ~0,3cr/150 chars)
//   • mais expressiva (tags) → elevenlabs/eleven-v4 (+ voz 'brian'/'sarah'…; 90+ línguas; ~0,6cr/150 chars)
//   • emoção inline barata   → google/gemini-3.8-flash-tts (30 vozes, tags [excited]…; PCM)
// As 3 pronunciaram "Meu Serralheiro Pro", "20%" e "mensalidade" certo. Naturalidade
// não dá pra medir por código: gere 2-3 amostras e deixe o usuário ouvir.
//
// ⚠️ A OR ignora parâmetros do provedor (speed, stability, instructions…): só
// model/input/voice/response_format chegam. Tom = o que vive no texto.

import { tts } from '../lib/audio.mjs';

export const PICKS = {
  ptbr:       { model: 'microsoft/mai-voice-2.1', voice: 'pt-BR-Rafael:MAI-Voice-2.1' },
  ptbrFem:    { model: 'microsoft/mai-voice-2.1', voice: 'pt-BR-Luana:MAI-Voice-2.1' },
  expressiva: { model: 'elevenlabs/eleven-v4',     voice: 'brian' },
  emocao:     { model: 'google/gemini-3.8-flash-tts', voice: 'Sulafat' },
};

/**
 * @param {object} o
 * @param {string} o.input           texto
 * @param {string} [o.model]         id OR (default PICKS.ptbr)
 * @param {string} [o.voice]         voz do modelo (catalog.mjs speech <id> lista)
 * @param {string} [o.pick]          atalho: 'ptbr' | 'ptbrFem' | 'expressiva' | 'emocao'
 * @returns {{ok, bytes, ext}}
 */
export async function speech(o, key) {
  if (!o?.input) throw new Error('speech: input obrigatório');
  const base = PICKS[o.pick ?? 'ptbr'];
  const model = o.model ?? base.model;
  const voice = o.voice ?? (o.model ? undefined : base.voice);
  if (!voice) throw new Error(`speech: diga a voz de ${model} (node scripts/catalog.mjs speech ${model})`);
  const format = model.startsWith('google/') ? 'pcm' : 'mp3';
  return tts({ model, input: o.input, voice, format }, key);
}

// CLI: node or-speech.mjs "texto" [model] [voice]
if (import.meta.url === `file://${process.argv[1]}`) {
  const { saveAudio } = await import('../lib/audio.mjs');
  const [, , input, model, voice] = process.argv;
  if (!input) { console.log('uso: node or-speech.mjs "texto" [model] [voice]'); process.exit(1); }
  saveAudio(await speech({ input, model, voice }), 'voz', { open: true });
}
