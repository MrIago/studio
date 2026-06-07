// gemini-2.5-flash-image (Nano Banana) — CAIXA SELADA. Rápido (~8s, ~4cr), bom
// genérico. Fallback p/ retoque simples (1ª opção barata na edição). ⚠️ recusa
// copyright por NOME (mas gera por descrição genérica). aspectRatio + imageSize.
// modalities [image,text]. Saída png/jpg.
import { generateImage, bytesToDataUri } from '../lib/or.mjs';
export const MODEL = 'google/gemini-2.5-flash-image';
export const SPEED = '~8s'; export const COST = '~4cr'; export const OUTPUT = 'png';
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];
export const IMAGE_SIZES = ['1K','2K','4K'];
/** @param {{prompt, aspectRatio?, imageSize?, refs?}} o */
export async function gemini25Flash(o, key) {
  if (!o?.prompt) throw new Error('gemini25Flash: prompt obrigatório');
  const refs = o.refs ?? [];
  const content = refs.length
    ? [{ type: 'text', text: o.prompt }, ...refs.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } }))]
    : o.prompt;
  return generateImage({ model: MODEL, messages: [{ role: 'user', content }], modalities: ['image','text'],
    image_config: { aspect_ratio: o.aspectRatio ?? '1:1', image_size: o.imageSize ?? '1K' } }, key);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const p = process.argv[2] || 'a red apple on a white table';
  console.log(`▸ gemini-2.5-flash (Nano Banana) | "${p}"`);
  save(await gemini25Flash({ prompt: p }), '/tmp/gemini-out');
}
