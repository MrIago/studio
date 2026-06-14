// veo-3.1 (Google Vertex) — CAIXA SELADA de VÍDEO. Async (submit→poll→download).
// Caps OR: ratio 16:9/9:16, res 720p/1080p/4K, duração 4/6/8s, ÁUDIO nativo
// sincronizado, seed sim, i2v first+last frame. Passthrough google-vertex:
// negativePrompt + enhancePrompt (a OR só repassa esses). personGeneration FIXO
// 'allow_adult'. Saída mp4. ⚠️ MAIS CARO: ~$0.40/s c/áudio (8s = ~320cr), 4K ~$0.60/s.
//
// imagens (refs = [{bytes, mimeType}], ordem = papel):
//   imageMode 'frames':    refs[0]→first_frame, refs[1]→last_frame, refs[2..]→estilo
//   imageMode 'reference' (default): refs[todas]→input_references (estilo)
import { runVideo, bytesToDataUri } from '../lib/video.mjs';

export const MODEL = 'google/veo-3.1';
export const ASPECT_RATIOS = ['16:9', '9:16'];
export const RESOLUTIONS = ['720p', '1080p', '4K'];
export const DURATIONS = [4, 6, 8];
export const IMAGE_MODES = ['reference', 'frames'];

/** @param {{prompt, aspectRatio?, resolution?, duration?, generateAudio?, imageMode?, negativePrompt?, enhancePrompt?, seed?, refs?}} o */
export async function veo31(o, key) {
  if (!o?.prompt) throw new Error('veo31: prompt obrigatório');
  const refs = o.refs ?? [];
  const imageMode = o.imageMode ?? 'reference';

  const body = {
    model: MODEL,
    prompt: o.prompt,
    aspect_ratio: o.aspectRatio ?? '16:9',
    resolution: o.resolution ?? '720p',
    duration: o.duration ?? 8,
    generate_audio: o.generateAudio ?? true,
  };
  if (o.seed != null) body.seed = o.seed;

  if (imageMode === 'frames' && refs.length > 0) {
    const frames = [];
    if (refs[0]) frames.push({ type: 'image_url', image_url: { url: bytesToDataUri(refs[0].bytes, refs[0].mimeType) }, frame_type: 'first_frame' });
    if (refs[1]) frames.push({ type: 'image_url', image_url: { url: bytesToDataUri(refs[1].bytes, refs[1].mimeType) }, frame_type: 'last_frame' });
    body.frame_images = frames;
    const style = refs.slice(2);
    if (style.length) body.input_references = style.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } }));
  } else if (refs.length > 0) {
    body.input_references = refs.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } }));
  }

  // passthrough google-vertex (OR só repassa negativePrompt + enhancePrompt).
  const parameters = { personGeneration: 'allow_adult' };
  if (o.negativePrompt) parameters.negativePrompt = o.negativePrompt;
  if (o.enhancePrompt != null) parameters.enhancePrompt = o.enhancePrompt;
  body.provider = { options: { 'google-vertex': { parameters } } };

  return runVideo(body, key);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { saveVideo } = await import('../lib/video.mjs');
  const p = process.argv[2] || 'a cinematic slow dolly shot of a coffee cup, steam rising, warm light';
  console.log(`▸ veo-3.1 (vídeo, ~$0.40/s) | "${p}"`);
  saveVideo(await veo31({ prompt: p, duration: 4 }), 'veo-out', { open: true });
}
