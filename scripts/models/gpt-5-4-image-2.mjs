// gpt-5.4-image-2 — CAIXA SELADA. O PADRÃO no-brainer do Studio.
// Melhor qualidade/precisão/realismo-com-pessoas, melhor pra COMPOR refs fiéis
// (personagem/famoso) e editar rosto de pessoa real. MAS lento (~150s, 2,5min)
// e ~17-24cr. Recusa gerar personagem copyright DO ZERO (mas compõe com ref).
//
// Opções: aspectRatio · imageSize (1K/2K/4K) · quality (low/medium/high) ·
// transparent (→background) · moderation (auto/low) · refs (i2i, aceita PDF).
// modalities [image,text]. Saída PNG.

import { generateImage, bytesToDataUri } from '../lib/or.mjs';

export const MODEL = 'openai/gpt-5.4-image-2';
export const SPEED = '~150s';
export const COST = '~17-24cr';
export const OUTPUT = 'png';
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];
export const IMAGE_SIZES = ['1K','2K','4K'];
export const QUALITIES = ['low','medium','high'];

// Ref → content part: image/* vira image_url; PDF/doc vira file part
// (gpt-image aceita input_modalities 'file' — único que faz isso).
function refToContentPart(r, i) {
  const dataUri = bytesToDataUri(r.bytes, r.mimeType);
  if (r.mimeType.startsWith('image/')) return { type: 'image_url', image_url: { url: dataUri } };
  const ext = r.mimeType.includes('pdf') ? 'pdf' : 'bin';
  return { type: 'file', file: { filename: `ref-${i}.${ext}`, file_data: dataUri } };
}

/**
 * @param {object} o
 * @param {string} o.prompt
 * @param {string} [o.aspectRatio]   default '1:1'
 * @param {string} [o.imageSize]     1K|2K|4K, default '1K'
 * @param {string} [o.quality]       low|medium|high, default 'high'
 * @param {boolean} [o.transparent]  fundo transparente (PNG RGBA)
 * @param {string} [o.moderation]    auto|low, default 'auto'
 * @param {{bytes,mimeType}[]} [o.refs]  i2i / compor (aceita imagem E PDF)
 */
export async function gpt54Image2(o, key) {
  if (!o?.prompt) throw new Error('gpt54Image2: prompt obrigatório');
  const refs = o.refs ?? [];
  const content = refs.length
    ? [{ type: 'text', text: o.prompt }, ...refs.map((r, i) => refToContentPart(r, i))]
    : o.prompt;

  const image_config = {
    aspect_ratio: o.aspectRatio ?? '1:1',
    image_size: o.imageSize ?? '1K',
    quality: o.quality ?? 'high',
    moderation: o.moderation ?? 'auto',
  };
  if (o.transparent) image_config.background = 'transparent';

  return generateImage(
    { model: MODEL, messages: [{ role: 'user', content }], modalities: ['image', 'text'], image_config },
    key,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const prompt = process.argv[2] || 'a red apple on a white table';
  console.log(`▸ gpt-5.4-image-2 | "${prompt}" (pode levar ~2,5min)`);
  save(await gpt54Image2({ prompt }), `/tmp/gpt54-out`);
}
