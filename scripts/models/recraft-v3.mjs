// recraft-v3 — CAIXA SELADA (rápido ~6.5s, barato ~4cr, raster WEBP).
// Todas as opções do Recraft V3 via OpenRouter, testadas param a param:
//   style (65 raster) · aspectRatio · rgbColors (paleta máx 5) ·
//   backgroundColor · strength (i2i) · textLayout (posicionar texto) · refs (i2i)
//
// Recraft só aceita modalities ['image'] (rejeita 'text'). Saída WEBP raster.
// Use quando: o estilo pedido ESTÁ na lista (Pixel art, Clay, ...) OU precisa de
// paleta forçada/texto posicionado, rápido e barato. Gera copyright (Mickey/Bart).
// Pra outros estilos genéricos rápidos → grok-imagine. Pra qualidade → gpt-5.4.
//
// NÃO há remoção de fundo via OR (o /removeBackground é endpoint nativo Recraft,
// a OR não expõe). Pra transparência: gpt-5-image-mini. Pra SVG: -vector.

import { generateImage, bytesToDataUri } from '../lib/or.mjs';
import { RECRAFT_V3_STYLES, RECRAFT_V3_STYLE_IDS } from '../lib/recraft-v3-styles.mjs';

export const MODEL = 'recraft/recraft-v3';
export const SPEED = '~6.5s';
export const COST = '~4cr';
export const OUTPUT = 'webp';
export const STYLES = RECRAFT_V3_STYLE_IDS; // 65

// Aspect ratios globais da OR (todos os modelos de imagem aceitam).
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];

// rgb wrapper que a OR espera: { rgb: [r,g,b] }.
const rgbObj = (c) => ({ rgb: c });

/**
 * Gera imagem com recraft-v3.
 * @param {object} o
 * @param {string} o.prompt               (obrigatório)
 * @param {string} [o.style]              um dos RECRAFT_V3_STYLES (default 'Photorealism')
 * @param {string} [o.aspectRatio]        default '1:1'
 * @param {number[][]} [o.rgbColors]      paleta forçada, máx 5, ex [[255,0,0],[10,15,40]]
 * @param {number[]} [o.backgroundColor]  cor de fundo [r,g,b]
 * @param {number} [o.strength]           i2i 0.0-1.0 (0=mantém input, default 0.2)
 * @param {{text:string,bbox:number[][]}[]} [o.textLayout]  posicionar texto
 * @param {{bytes:ArrayBuffer,mimeType:string}[]} [o.refs]  imagens de referência (i2i)
 * @param {string} [key]                  sub-key (opcional; auto se omitido)
 */
export async function recraftV3(o, key) {
  if (!o?.prompt) throw new Error('recraftV3: prompt obrigatório');
  const style = o.style ?? 'Photorealism';
  if (style && !RECRAFT_V3_STYLES[style]) {
    throw new Error(`recraftV3: style inválido "${style}". Veja STYLES (${STYLES.length} opções).`);
  }

  const refs = o.refs ?? [];
  const content = refs.length
    ? [
        { type: 'text', text: o.prompt },
        ...refs.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } })),
      ]
    : o.prompt;

  const image_config = {
    style,
    aspect_ratio: o.aspectRatio ?? '1:1',
  };
  if (o.rgbColors?.length) image_config.rgb_colors = o.rgbColors.map(rgbObj);
  if (o.backgroundColor) image_config.background_rgb_color = rgbObj(o.backgroundColor);
  if (o.strength != null) image_config.strength = o.strength;
  if (o.textLayout?.length) image_config.text_layout = o.textLayout.map((t) => ({ text: t.text, bbox: t.bbox }));

  return generateImage(
    { model: MODEL, messages: [{ role: 'user', content }], modalities: ['image'], image_config },
    key,
  );
}

// CLI rápido: node models/recraft-v3.mjs "prompt" [style]
if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const prompt = process.argv[2] || 'a cute fox sitting in a forest';
  const style = process.argv[3] || 'Photorealism';
  console.log(`▸ recraft-v3 | style="${style}" | "${prompt}"`);
  const r = await recraftV3({ prompt, style });
  save(r, `/tmp/recraft-v3-out`);
}
