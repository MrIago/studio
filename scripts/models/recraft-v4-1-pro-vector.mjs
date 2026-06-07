// recraft-v4.1-pro-vector — CAIXA SELADA. SVG VETORIAL nativo (escala ∞, ~30cr,
// ~14s). O melhor pra ícone/logo vetorial — sem fallback. aspectRatio +
// rgbColors (paleta) + backgroundColor. Sem style, sem strength. modalities
// ['image']. Saída image/svg+xml.
//
// 2 melhorias da nossa pesquisa (gotchas que a OR NÃO resolve sozinha):
//  1. A OR NÃO repassa o `no_text` do Recraft → ícone vira logotipo c/ texto.
//     Solução = PROMPT: o helper injeta "no text, no words" (iconOnly, default).
//  2. Recraft sempre põe FUNDO branco (1º <path> retângulo do canvas). A OR não
//     tem fundo transparente p/ SVG. Como é SVG, removemos esse path (stripBg,
//     default) → ícone transparente.

import { generateImage, bytesToDataUri } from '../lib/or.mjs';

export const MODEL = 'recraft/recraft-v4.1-pro-vector';
export const SPEED = '~14s'; export const COST = '~30cr'; export const OUTPUT = 'svg';
export const ASPECT_RATIOS = ['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];

const rgbObj = (c) => ({ rgb: c });

// Remove o <path> de fundo do SVG do Recraft (retângulo cobrindo o canvas).
function stripSvgBg(svgText) {
  const vb = svgText.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!vb) return svgText;
  const [W, H] = [vb[1], vb[2]];
  const re = new RegExp(`<path d="M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} L 0 0 z"[^>]*></path>\\s*`);
  return svgText.replace(re, '');
}

/**
 * @param {object} o
 * @param {string} o.prompt
 * @param {string} [o.aspectRatio]      default '1:1'
 * @param {number[][]} [o.rgbColors]    paleta forçada, máx 5
 * @param {number[]} [o.backgroundColor] cor de fundo [r,g,b] (raro p/ vetor)
 * @param {boolean} [o.iconOnly]        default true — injeta "no text, no words"
 * @param {boolean} [o.keepBg]          default false — mantém o fundo branco do SVG
 * @param {{bytes,mimeType}[]} [o.refs] i2i
 */
export async function recraftV41ProVector(o, key) {
  if (!o?.prompt) throw new Error('recraftV41ProVector: prompt obrigatório');

  const prompt = o.iconOnly === false
    ? o.prompt
    : `${o.prompt}, flat vector symbol, no text, no words, no lettering, centered on plain background`;

  const refs = o.refs ?? [];
  const content = refs.length
    ? [{ type: 'text', text: prompt }, ...refs.map((r) => ({ type: 'image_url', image_url: { url: bytesToDataUri(r.bytes, r.mimeType) } }))]
    : prompt;

  const image_config = { aspect_ratio: o.aspectRatio ?? '1:1' };
  if (o.rgbColors?.length) image_config.rgb_colors = o.rgbColors.map(rgbObj);
  if (o.backgroundColor) image_config.background_rgb_color = rgbObj(o.backgroundColor);

  const r = await generateImage(
    { model: MODEL, messages: [{ role: 'user', content }], modalities: ['image'], image_config },
    key,
  );
  // remove fundo branco do SVG (default), salvo keepBg
  if (r.ok && o.keepBg !== true && r.mime.includes('svg')) {
    r.bytes = Buffer.from(stripSvgBg(r.bytes.toString('utf8')), 'utf8');
  }
  return r;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const p = process.argv[2] || 'a single rocket icon, geometric, cyan and dark blue';
  console.log(`▸ recraft-v4.1-pro-vector (SVG, sem texto, sem fundo) | "${p}"`);
  save(await recraftV41ProVector({ prompt: p }), '/tmp/vector-out');
}
