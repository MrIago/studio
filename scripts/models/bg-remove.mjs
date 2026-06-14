// bg-remove — CAIXA SELADA LOCAL (sem IA/API, sem custo, instantâneo). Remove o
// fundo de cor sólida de uma imagem PNG por FLOOD FILL a partir das bordas:
// só o fundo CONECTADO às bordas vira transparente; cores iguais ENCLAUSURADAS
// (ex: rodas pretas dentro de um logo branco) são preservadas. É a forma FIEL de
// tirar fundo de logo/ícone — não regenera nada (ao contrário da edição por IA).
//
// ⚠️ Quando NÃO usar: foto real / fundo gradiente ou texturizado / quando o sujeito
// encosta numa borda com a mesma cor do fundo. Nesses casos use edição por IA
// (gemini25Flash p/ retoque rápido, ou gpt54Image2). Aqui o fundo precisa ser
// razoavelmente UNIFORME e tocar as bordas da imagem.
//
// Codec PNG próprio (zlib nativo): decodifica 8-bit RGB/RGBA, escreve RGBA.
import zlib from 'node:zlib';
import fs from 'node:fs';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

// --- decode: PNG bytes → { width, height, data:RGBA } (8-bit, color type 2 ou 6) ---
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('bg-remove: não é um PNG válido');
  let p = 8, width = 0, height = 0, depth = 0, color = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; color = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || (color !== 2 && color !== 6))
    throw new Error(`bg-remove: só suporto PNG 8-bit RGB/RGBA (depth=${depth}, colorType=${color}). Converta antes ou use edição por IA.`);
  const ch = color === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const out = Buffer.alloc(width * height * 4);
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  let q = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[q++];
    for (let x = 0; x < stride; x++) {
      const rawv = raw[q++];
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev[x];
      const c = x >= ch ? prev[x - ch] : 0;
      let v;
      if (filter === 0) v = rawv;
      else if (filter === 1) v = rawv + a;
      else if (filter === 2) v = rawv + b;
      else if (filter === 3) v = rawv + ((a + b) >> 1);
      else if (filter === 4) v = rawv + paeth(a, b, c);
      else throw new Error(`bg-remove: filtro PNG ${filter} desconhecido`);
      cur[x] = v & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const s = x * ch, d = (y * width + x) * 4;
      out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2];
      out[d + 3] = ch === 4 ? cur[s + 3] : 255;
    }
    cur.copy(prev);
  }
  return { width, height, data: out };
}

// --- encode: RGBA → PNG bytes (filtro 0, color type 6) ---
function encodePng(width, height, data) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const chunk = (type, body) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(type, 4, 'ascii');
    body.copy(out, 8);
    out.writeUInt32BE(zlib.crc32(out.subarray(4, 8 + body.length)) >>> 0, 8 + body.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/**
 * Remove o fundo de cor sólida conectado às bordas, deixando transparente.
 * @param {{ input: string|Buffer, bg?: [number,number,number], tolerance?: number }} o
 *   input     caminho do PNG ou Buffer dos bytes.
 *   bg        cor do fundo [r,g,b]. Default: amostra os 4 cantos (a cor mais comum).
 *   tolerance distância máx. por canal pra contar como fundo (0-255). Default 60.
 * @returns {{ ok:true, bytes:Buffer, ext:'png', mime, width, height, cleared, total }}
 */
export function bgRemove(o) {
  const buf = Buffer.isBuffer(o?.input) ? o.input
    : (typeof o?.input === 'string' ? fs.readFileSync(o.input) : null);
  if (!buf) throw new Error('bg-remove: input obrigatório (caminho do PNG ou Buffer)');
  const tol = o.tolerance ?? 60;
  const { width: w, height: h, data } = decodePng(buf);

  // cor de fundo: informada, ou a moda dos 4 cantos.
  let bg = o.bg;
  if (!bg) {
    const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => {
      const i = (y * w + x) * 4; return `${data[i]},${data[i + 1]},${data[i + 2]}`;
    });
    const count = {};
    let best = corners[0];
    for (const c of corners) { count[c] = (count[c] || 0) + 1; if (count[c] > (count[best] || 0)) best = c; }
    bg = best.split(',').map(Number);
  }
  const matches = (i) =>
    Math.abs(data[i] - bg[0]) <= tol && Math.abs(data[i + 1] - bg[1]) <= tol && Math.abs(data[i + 2] - bg[2]) <= tol;

  // flood fill iterativo a partir de todas as bordas.
  const visited = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, x + (h - 1) * w); }
  for (let y = 0; y < h; y++) { stack.push(y * w, w - 1 + y * w); }
  let cleared = 0;
  while (stack.length) {
    const px = stack.pop();
    if (visited[px]) continue;
    if (!matches(px * 4)) continue;
    visited[px] = 1;
    data[px * 4 + 3] = 0; cleared++;
    const x = px % w, y = (px / w) | 0;
    if (x + 1 < w) stack.push(px + 1);
    if (x - 1 >= 0) stack.push(px - 1);
    if (y + 1 < h) stack.push(px + w);
    if (y - 1 >= 0) stack.push(px - w);
  }
  return { ok: true, bytes: encodePng(w, h, data), ext: 'png', mime: 'image/png',
    width: w, height: h, cleared, total: w * h, bg };
}

// CLI: node bg-remove.mjs <input.png> [saida] [--tol N] [--bg r,g,b]
if (import.meta.url === `file://${process.argv[1]}`) {
  const { save } = await import('../lib/or.mjs');
  const args = process.argv.slice(2);
  const flags = {};
  const pos = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tol') flags.tol = Number(args[++i]);
    else if (args[i] === '--bg') flags.bg = args[++i].split(',').map(Number);
    else pos.push(args[i]);
  }
  const input = pos[0];
  if (!input) { console.error('uso: node bg-remove.mjs <input.png> [saida] [--tol 60] [--bg r,g,b]'); process.exit(1); }
  const name = pos[1] || 'sem-fundo';
  console.log(`▸ bg-remove (local, sem custo) | "${input}"`);
  const r = bgRemove({ input, tolerance: flags.tol, bg: flags.bg });
  console.log(`  fundo=${r.bg.join(',')} · ${r.cleared}/${r.total}px transparentes`);
  save(r, name, { open: true });
}
