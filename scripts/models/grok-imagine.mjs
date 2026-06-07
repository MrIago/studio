// grok-imagine-image-quality — CAIXA SELADA. O MAIS RÁPIDO (~3.4s, ~5cr).
// Use p/ rápido+barato quando o estilo NÃO está na lista do recraft.
// ⚠️ RECUSA copyright (Pikachu/etc → "Provider returned error").
// aspectRatio + imageSize (1K/2K APENAS — 4K rejeitado). modalities ['image'].
import { generateImage, bytesToDataUri } from '../lib/or.mjs';
export const MODEL = 'x-ai/grok-imagine-image-quality';
export const SPEED = '~3.4s'; export const COST = '~5cr'; export const OUTPUT = 'jpg';
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];
export const IMAGE_SIZES = ['1K','2K']; // SEM 4K (OR rejeita)

/** @param {{prompt:string, aspectRatio?:string, imageSize?:string, refs?:{bytes,mimeType}[]}} o */
export async function grokImagine(o, key) {
  if (!o?.prompt) throw new Error('grokImagine: prompt obrigatório');
  const refs = o.refs ?? [];
  const content = refs.length
    ? [{ type: 'text', text: o.prompt }, ...refs.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } }))]
    : o.prompt;
  return generateImage(
    { model: MODEL, messages: [{ role: 'user', content }], modalities: ['image'],
      image_config: { aspect_ratio: o.aspectRatio ?? '1:1', image_size: o.imageSize ?? '1K' } },
    key,
  );
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const p = process.argv[2] || 'a red apple on a white table';
  console.log(`▸ grok-imagine | "${p}"`);
  save(await grokImagine({ prompt: p }), '/tmp/grok-out');
}
