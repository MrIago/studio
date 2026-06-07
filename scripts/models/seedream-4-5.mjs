// seedream-4.5 — CAIXA SELADA. Melhor BARATO (~4cr, ~9s). Vence em imagem
// genérica e gerar personagem copyright do zero (Bart/Mickey). Edita OK (sem
// identidade crítica). aspectRatio + imageSize (1K=2048²/4K=4096²). i2i: refs
// como image_url. modalities ['image']. Saída jpeg.
import { generateImage, bytesToDataUri } from '../lib/or.mjs';
export const MODEL = 'bytedance-seed/seedream-4.5';
export const SPEED = '~9s'; export const COST = '~4cr'; export const OUTPUT = 'jpg';
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];
export const IMAGE_SIZES = ['1K','2K','4K']; // CUIDADO: 1K=2048², 4K=4096²

/** @param {{prompt:string, aspectRatio?:string, imageSize?:string, refs?:{bytes,mimeType}[]}} o */
export async function seedream45(o, key) {
  if (!o?.prompt) throw new Error('seedream45: prompt obrigatório');
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
  console.log(`▸ seedream-4.5 | "${p}"`);
  save(await seedream45({ prompt: p }), 'seedream-out', { open: true });
}
