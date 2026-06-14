// grok-imagine-video (xAI) — CAIXA SELADA de VÍDEO. Async (submit→poll→download).
// Rápido e BARATO. Caps OR: ratio 16:9/9:16/1:1/4:3/3:4/3:2/2:3, res 480p/720p,
// duração 1-15s, SEM áudio, SEM seed, i2v SÓ first_frame. Passthrough VAZIO.
// Saída mp4. Pricing: 480p ~$0.05/s · 720p ~$0.07/s (+$0.002/imagem de ref).
// 720p 5s ≈ $0.35 (~35cr) — bem mais barato que veo.
//
// imagens (refs = [{bytes, mimeType}]): refs[0] → first_frame; refs[1..] → estilo (até 7).
import { runVideo, bytesToDataUri } from '../lib/video.mjs';

export const MODEL = 'x-ai/grok-imagine-video';
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3'];
export const RESOLUTIONS = ['480p', '720p'];
// duração: qualquer inteiro 1..15

/** @param {{prompt, aspectRatio?, resolution?, duration?, refs?}} o */
export async function grokImagineVideo(o, key) {
  if (!o?.prompt) throw new Error('grokImagineVideo: prompt obrigatório');
  const refs = o.refs ?? [];

  const body = {
    model: MODEL,
    prompt: o.prompt,
    aspect_ratio: o.aspectRatio ?? '16:9',
    resolution: o.resolution ?? '720p',
    duration: o.duration ?? 5,
  };

  // só first_frame: refs[0] vira frame inicial; resto vira estilo.
  if (refs[0]) {
    body.frame_images = [{ type: 'image_url', image_url: { url: bytesToDataUri(refs[0].bytes, refs[0].mimeType) }, frame_type: 'first_frame' }];
    const style = refs.slice(1);
    if (style.length) body.input_references = style.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } }));
  }

  return runVideo(body, key);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { saveVideo } = await import('../lib/video.mjs');
  const p = process.argv[2] || 'a neon sign flickering to life in a dark alley, cinematic';
  console.log(`▸ grok-imagine-video (vídeo, ~$0.07/s) | "${p}"`);
  saveVideo(await grokImagineVideo({ prompt: p, duration: 5 }), 'grok-video-out', { open: true });
}
