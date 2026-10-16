// or-speech — CAIXA GENÉRICA de voz: QUALQUER modelo /audio/speech da OpenRouter.
// O catálogo de TTS cresce todo mês (35 modelos em out/2026: ElevenLabs v4,
// MAI-Voice 2.1, Gemini 3.8, MiniMax, Fish…). Em vez de uma caixa por modelo,
// esta recebe o id e resolve o formato: Google só sai em PCM (vira WAV), o resto MP3.
// Lista viva + preço: `node scripts/catalog.mjs speech`. Vozes de um modelo:
// `node scripts/catalog.mjs speech <id>`.
//
// VOZES ESCOLHIDAS — audição às cegas do Iago (15/10/2026): os 27 modelos da OR que
// falam pt-BR, 5 rodadas votadas, nota de naturalidade e de precisão por áudio. Estudo em
// ~/Documentos/Projetos/Dr/.docs/vozes-openrouter-2026.md (lab: .docs/lab/vozes-openrouter/).
//   • modelo: google/gemini-3.8-flash-lite-tts (~4 s por áudio, ~R$ 0,006 por áudio de 8 s)
//   • pick 'mulher'        → Vindemiatrix (gentil)
//   • pick 'homem'         → Charon (informativa)
//   • pick 'personagemGay' → Pulcherrima. O Google a lista como feminina, mas neste modelo
//     ela sai grave, na faixa de voz de homem (130–160 Hz em 5 gravações, com ou sem
//     instrução), e foi a escolhida para personagem gay.
//   • pick 'locutora'      → Despina (macia)
//   • pick 'locutor'       → Iapetus (clara)
//     As duas foram escolhidas de ouvido para locução; no placar, que media conversa com
//     uma amiga, ficaram em 6º e 9º.
//   As cinco usam INSTRUCAO_AUDICAO (a mesma da audição); passe `instructions` para trocar.
//
// Escolha por caso (testado 15/10/2026, mesma frase PT-BR, transcrita de volta):
//   • narração PT-BR nativa  → microsoft/mai-voice-2.1 + 'pt-BR-Rafael|Caio|Pedro|Luana|Harper:MAI-Voice-2.1'
//                              (únicas vozes NATIVAS pt-BR do catálogo; ~0,3cr/150 chars)
//   • mais expressiva (tags) → elevenlabs/eleven-v4 (+ voz 'brian'/'sarah'…; 90+ línguas; ~0,6cr/150 chars)
//   • emoção inline barata   → google/gemini-3.8-flash-tts (30 vozes, tags [excited]…; PCM)
// As 3 pronunciaram "Meu Serralheiro Pro", "20%" e "mensalidade" certo. Naturalidade
// não dá pra medir por código: gere 2-3 amostras e deixe o usuário ouvir.
//
// Parâmetros: a OR repassa `instructions` só para Gemini TTS, gpt-4o-mini-tts e Fish
// (doc da OR, out/2026); no Gemini vira speech_metadata.style e não é lida em voz alta.
// Nos outros modelos é ignorada. speed, stability e afins não chegam: o tom do resto
// vive no texto.
//
// CONTROLE DE EMOÇÃO PELO TEXTO (testado 15/10/2026, transcrito de volta):
//   • MAI-Voice: NADA de marcação. [tags] CORTAM a fala na 1ª frase; SSML é lido
//     em voz alta ("speak version 1.0…"); "(animada)" é lido. Só pontuação e
//     escrita falada ("cê", "tá", "pra", "ó") — o sotaque nativo faz o resto.
//   • ElevenLabs v4: [curious] [excited] [warm] [happy] [laughs] funcionam em PT-BR
//     e não são lidos. Melhor para variar emoção por cena.
//   • Gemini 3.8: tags idem (ver gemini-tts.mjs); sai PCM.
// Fala natural: escreva como se fala, não como se escreve ("tô", "pra", "cê",
// "né", "ó", frases curtas com vírgula). Número por extenso quando a leitura importa.

import { tts } from '../lib/audio.mjs';

// A instrução de estilo usada na audição: as vozes escolhidas soaram assim com ela.
export const INSTRUCAO_AUDICAO = 'Pessoa mandando um áudio de WhatsApp para uma amiga: pergunta curiosa e '
  + 'descontraída, português do Brasil sem sotaque marcado, ritmo natural de conversa.';

export const PICKS = {
  // escolhidas na audição às cegas (15/10/2026)
  mulher:        { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Vindemiatrix', instructions: INSTRUCAO_AUDICAO },
  homem:         { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Charon',       instructions: INSTRUCAO_AUDICAO },
  personagemGay: { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Pulcherrima',  instructions: INSTRUCAO_AUDICAO },
  locutora:      { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Despina',      instructions: INSTRUCAO_AUDICAO },
  locutor:       { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Iapetus',      instructions: INSTRUCAO_AUDICAO },
  // por caso
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
 * @param {string} [o.pick]          atalho: 'mulher' | 'homem' | 'personagemGay' | 'locutora' | 'locutor'
 *                                   | 'ptbr' | 'ptbrFem' | 'expressiva' | 'emocao'
 * @param {string} [o.instructions]  direção de estilo (só Gemini, gpt-4o-mini-tts e Fish usam);
 *                                   sem ela, vale a do pick
 * @returns {{ok, bytes, ext}}
 */
export async function speech(o, key) {
  if (!o?.input) throw new Error('speech: input obrigatório');
  const base = PICKS[o.pick ?? 'ptbr'];
  if (!base) throw new Error(`speech: pick "${o.pick}" não existe (${Object.keys(PICKS).join(', ')})`);
  const model = o.model ?? base.model;
  const voice = o.voice ?? (o.model ? undefined : base.voice);
  if (!voice) throw new Error(`speech: diga a voz de ${model} (node scripts/catalog.mjs speech ${model})`);
  const instructions = o.instructions ?? (o.model ? undefined : base.instructions);
  const format = model.startsWith('google/') ? 'pcm' : 'mp3';
  return tts({ model, input: o.input, voice, format, instructions }, key);
}

// CLI: node or-speech.mjs "texto" [model|pick] [voice]
if (import.meta.url === `file://${process.argv[1]}`) {
  const { saveAudio } = await import('../lib/audio.mjs');
  const [, , input, modelOuPick, voice] = process.argv;
  if (!input) { console.log('uso: node or-speech.mjs "texto" [model|mulher|homem|personagemGay|locutora|locutor|…] [voice]'); process.exit(1); }
  const o = PICKS[modelOuPick] ? { input, pick: modelOuPick } : { input, model: modelOuPick, voice };
  saveAudio(await speech(o), 'voz', { open: true });
}
