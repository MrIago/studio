// or-video — CAIXA GENÉRICA de vídeo IA: QUALQUER modelo de /videos da OpenRouter.
// 30 modelos em out/2026 (Seedance 2.5, Kling 3.0, Veo 3.1 fast/lite, Hailuo 3,
// Wan 3.0, Runway Gen-4.5, FLUX.3 Video, Grok Imagine 1.5…). As caixas veo31 e
// grokImagineVideo continuam; esta cobre o resto sem uma caixa por modelo.
// Antes de usar um modelo: `node scripts/catalog.mjs video <id>` mostra
// resoluções, durações, frames aceitos (first/last), se gera áudio e o preço.
//
// Uso típico em EDIÇÃO: B-roll em movimento (metáfora concreta) ou i2v a partir
// de um still da studio. Regras que custaram caro a quem edita com IA:
//   • vídeo bate imagem: B-roll parado com zoom é tell de IA;
//   • modelos tendem a "trocar de câmera" por volta de 2,5–3s → use os primeiros
//     segundos contínuos;
//   • texto em tela gerado por IA vira rabisco → nada de UI/letreiro no prompt;
//   • mesma pessoa em shots seguidos: passe o último frame como first_frame.

import { runVideo, bytesToDataUri } from '../lib/video.mjs';

/**
 * @param {object} o
 * @param {string} o.model                 id OR (ex 'bytedance/seedance-2.0-fast')
 * @param {string} o.prompt
 * @param {number} [o.duration]            s (ver supported_durations)
 * @param {string} [o.resolution]          '480p' | '720p' | '1080p' | …
 * @param {string} [o.aspectRatio]         '9:16' | '16:9' | '1:1' …
 * @param {boolean} [o.generateAudio]      só modelos com generate_audio
 * @param {{bytes, mimeType}} [o.firstFrame]
 * @param {{bytes, mimeType}} [o.lastFrame]
 * @param {object} [o.extra]               campos crus do modelo (allowed_passthrough_parameters)
 */
export async function orVideo(o, key) {
  if (!o?.model || !o?.prompt) throw new Error('orVideo: model + prompt obrigatórios');
  const body = { model: o.model, prompt: o.prompt };
  if (o.duration) body.duration = o.duration;
  if (o.resolution) body.resolution = o.resolution;
  if (o.aspectRatio) body.aspect_ratio = o.aspectRatio;
  if (o.generateAudio != null) body.generate_audio = o.generateAudio;
  const frames = [];
  const frame = (r, frame_type) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) }, frame_type });
  if (o.firstFrame) frames.push(frame(o.firstFrame, 'first_frame'));
  if (o.lastFrame) frames.push(frame(o.lastFrame, 'last_frame'));
  if (frames.length) body.frame_images = frames;
  Object.assign(body, o.extra || {});
  return runVideo(body, key);
}
