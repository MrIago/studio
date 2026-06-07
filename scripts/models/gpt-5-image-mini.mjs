// gpt-5-image-mini — CAIXA SELADA. O melhor pra TRANSPARENTE (overlay PNG RGBA
// real, ~4cr). background:'transparent' funciona de verdade. ~44s. Mesmos params
// do gpt-5.4 (quality/transparent/moderation/refs com PDF). modalities [image,text].
import { generateImage, bytesToDataUri } from '../lib/or.mjs';
export const MODEL = 'openai/gpt-5-image-mini';
export const SPEED = '~44s'; export const COST = '~4cr'; export const OUTPUT = 'png';
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];
export const IMAGE_SIZES = ['1K','2K','4K']; export const QUALITIES = ['low','medium','high'];

function refToContentPart(r, i) {
  const u = bytesToDataUri(r.bytes, r.mimeType);
  if (r.mimeType.startsWith('image/')) return { type: 'image_url', image_url: { url: u } };
  const ext = r.mimeType.includes('pdf') ? 'pdf' : 'bin';
  return { type: 'file', file: { filename: `ref-${i}.${ext}`, file_data: u } };
}
/** @param {{prompt, aspectRatio?, imageSize?, quality?, transparent?, moderation?, refs?}} o */
export async function gpt5ImageMini(o, key) {
  if (!o?.prompt) throw new Error('gpt5ImageMini: prompt obrigatório');
  const refs = o.refs ?? [];
  const content = refs.length
    ? [{ type: 'text', text: o.prompt }, ...refs.map((r, i) => refToContentPart(r, i))]
    : o.prompt;
  const image_config = {
    aspect_ratio: o.aspectRatio ?? '1:1', image_size: o.imageSize ?? '1K',
    quality: o.quality ?? 'high', moderation: o.moderation ?? 'auto',
  };
  if (o.transparent) image_config.background = 'transparent';
  return generateImage({ model: MODEL, messages: [{ role: 'user', content }], modalities: ['image','text'], image_config }, key);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const p = process.argv[2] || 'a glowing blue microphone icon, transparent background';
  console.log(`▸ gpt-5-image-mini (transparente) | "${p}"`);
  save(await gpt5ImageMini({ prompt: p, transparent: true }), 'gptmini-out', { open: true });
}
