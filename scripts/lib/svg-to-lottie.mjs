// SVG → Lottie. "Aterrar o modelo com SVG real" é a regra nº1 do prompt guide:
// converter um SVG concreto (Figma export, logo, ícone) dá resultado MUITO melhor
// que inventar pontos. Pega TODOS os <path> do SVG (erro comum: pegar só o 1º).
//
// Zero dependência — parser de path `d=` embutido (M/L/H/V/C/S/Q/T/Z, abs+rel).
// Arco (A/a) → emite WARNING ALTO (não suportado bem); falhar alto > geometria torta.
//
// API:
//   svgToLottieShapes(svgText) → { shapes:[{ty:'sh',...}], box:{w,h}, warnings }
//   svgToLottie(svgText, opts) → doc Lottie completo (reveal por trim + gradient opcional)

import { path as pathShape, drawGroup, gradStroke, stroke, lottieDoc, backgroundLayer, transform, k, rgba } from './lottie-build.mjs';

// ── parser de path SVG → LISTA de subpaths, cada um {verts,inT,outT,closed} ──
// Tokeniza separando flags empacotadas (ex.: "001" do arco vira 0,0,1). Cada M
// inicia um subpath novo (o "salto" não vira linha reta). Z fecha o subpath.
// Guarda de finitude: nunca empurra vértice NaN/Infinity (falha alta, não silêncio).
function parsePathD(d, warnings) {
  // tokenizer: letras OU números (com sinal/expoente). Flags do arco são lidas à parte.
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = '', pcx = 0, pcy = 0;
  let cur = null; const subpaths = [];
  const num = () => parseFloat(toks[i++]);
  function startSub() { cur = { verts: [], inT: [], outT: [], closed: false }; subpaths.push(cur); }
  function push(px, py, ci = [px, py], co = [px, py]) {
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      warnings.push('vértice não-finito no path (parse falhou) — ponto descartado'); return;
    }
    cur.verts.push([px, py]); cur.inT.push([ci[0] - px, ci[1] - py]); cur.outT.push([co[0] - px, co[1] - py]);
  }
  function setOut(cx, cy) { if (cur && cur.outT.length) cur.outT[cur.outT.length - 1] = [cx - x, cy - y]; }
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') {
      x = num() + (rel ? x : 0); y = num() + (rel ? y : 0); sx = x; sy = y;
      startSub(); push(x, y); cmd = rel ? 'l' : 'L'; // coords seguintes do M = lineto
    } else if (C === 'L') {
      x = num() + (rel ? x : 0); y = num() + (rel ? y : 0); push(x, y);
    } else if (C === 'H') { x = num() + (rel ? x : 0); push(x, y); }
    else if (C === 'V') { y = num() + (rel ? y : 0); push(x, y); }
    else if (C === 'C') {
      const c1x = num() + (rel ? x : 0), c1y = num() + (rel ? y : 0),
            c2x = num() + (rel ? x : 0), c2y = num() + (rel ? y : 0),
            ex = num() + (rel ? x : 0), ey = num() + (rel ? y : 0);
      setOut(c1x, c1y); pcx = c2x; pcy = c2y; x = ex; y = ey; push(x, y, [c2x, c2y]);
    } else if (C === 'S') {
      const rc1x = 2 * x - pcx, rc1y = 2 * y - pcy;
      const c2x = num() + (rel ? x : 0), c2y = num() + (rel ? y : 0),
            ex = num() + (rel ? x : 0), ey = num() + (rel ? y : 0);
      setOut(rc1x, rc1y); pcx = c2x; pcy = c2y; x = ex; y = ey; push(x, y, [c2x, c2y]);
    } else if (C === 'Q') {
      const qx = num() + (rel ? x : 0), qy = num() + (rel ? y : 0),
            ex = num() + (rel ? x : 0), ey = num() + (rel ? y : 0);
      const c1x = x + 2 / 3 * (qx - x), c1y = y + 2 / 3 * (qy - y),
            c2x = ex + 2 / 3 * (qx - ex), c2y = ey + 2 / 3 * (qy - ey);
      setOut(c1x, c1y); pcx = qx; pcy = qy; x = ex; y = ey; push(x, y, [c2x, c2y]);
    } else if (C === 'T') {
      const qx = 2 * x - pcx, qy = 2 * y - pcy;
      const ex = num() + (rel ? x : 0), ey = num() + (rel ? y : 0);
      const c1x = x + 2 / 3 * (qx - x), c1y = y + 2 / 3 * (qy - y),
            c2x = ex + 2 / 3 * (qx - ex), c2y = ey + 2 / 3 * (qy - ey);
      setOut(c1x, c1y); pcx = qx; pcy = qy; x = ex; y = ey; push(x, y, [c2x, c2y]);
    } else if (C === 'A') {
      // arco não é convertido (vira reta até o endpoint). Lê os 7 params de forma
      // DEFENSIVA — flags large/sweep podem vir empacotadas (ex.: "001"); consome
      // todos os números até a próxima letra e usa os 2 últimos como x,y.
      warnings.push('arco (A/a) no path — desenhado como reta; converta arcos em curvas no editor p/ precisão');
      const nums = [];
      while (i < toks.length && !/[a-zA-Z]/.test(toks[i])) nums.push(num());
      if (nums.length >= 2) {
        const nx = nums[nums.length - 2] + (rel ? x : 0), ny = nums[nums.length - 1] + (rel ? y : 0);
        if (Number.isFinite(nx) && Number.isFinite(ny)) { x = nx; y = ny; push(x, y); }
      }
    } else if (C === 'Z') { if (cur) cur.closed = true; x = sx; y = sy; }
    else { i++; }
  }
  return subpaths.filter((s) => s.verts.length > 0);
}

// extrai viewBox e detecta transform flip-Y (scale(1,-1) translate)
function svgMeta(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  const box = vb ? vb.split(/[\s,]+/).map(Number) : null; // minX minY w h
  const flip = /scale\(1,\s*-1\)/.test(svg);
  const ty = flip ? parseFloat((svg.match(/translate\(0,?\s*-?([\d.]+)\)/) || [])[1] || 0) : 0;
  return { box, flip, ty };
}

// ── extrai TODOS os <path> → shapes Lottie, normalizados pra um canvas ──
// Cada <path> pode ter vários subpaths (letra com furo) → vira 1 shape Lottie cada.
export function svgToLottieShapes(svgText, { width = 1400, height = 420, pad = 70 } = {}) {
  const warnings = [];
  // só <path>, com d= em aspas simples OU duplas, d em qualquer posição do atributo
  const ds = [...svgText.matchAll(/<path\b[^>]*?\bd=("|')([^"']+)\1/g)].map((m) => m[2]);
  if (!ds.length) return { shapes: [], box: { w: width, h: height }, warnings: ['nenhum <path d="..."> encontrado no SVG'] };
  const { flip, ty } = svgMeta(svgText);
  // achata: cada <path> → seus subpaths
  let subs = ds.flatMap((d) => parsePathD(d, warnings));
  // flip-Y se o SVG usa scale(1,-1)+translate
  if (flip) subs = subs.map((p) => ({
    verts: p.verts.map(([x, y]) => [x, ty - y]),
    inT: p.inT.map(([x, y]) => [x, -y]),
    outT: p.outT.map(([x, y]) => [x, -y]),
    closed: p.closed,
  }));
  // normaliza GLOBAL (todos os subpaths juntos) pro canvas com padding
  const all = subs.flatMap((p) => p.verts);
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  const sc = Math.min((width - pad * 2) / (bx1 - bx0 || 1), (height - pad * 2) / (by1 - by0 || 1));
  const ox = (width - (bx1 - bx0) * sc) / 2 - bx0 * sc, oy = (height - (by1 - by0) * sc) / 2 - by0 * sc;
  const shapes = subs.map((p) => pathShape({
    v: p.verts.map(([x, y]) => [x * sc + ox, y * sc + oy]),
    i: p.inT.map(([x, y]) => [x * sc, y * sc]),
    o: p.outT.map(([x, y]) => [x * sc, y * sc]),
  }, p.closed));
  return { shapes, box: { w: width, h: height, pad }, warnings };
}

// ── doc completo: SVG → Lottie com reveal (trim) + gradient/cor + transparente ──
// opts: { width,height,fps,seconds, gradient:[stops], color:[r,g,b], strokeWidth, reveal:true, bg:[r,g,b] }
export function svgToLottie(svgText, opts = {}) {
  const { width = 1400, height = 420, fps = 60, seconds = 2.5, strokeWidth = 22, reveal = true } = opts;
  const op = Math.round(fps * seconds);
  const { shapes, box, warnings } = svgToLottieShapes(svgText, { width, height, pad: opts.pad ?? 70 });
  if (warnings.length) for (const w of warnings) console.warn(`  ⚠ ${w}`);
  // paint: gradient se passado, senão cor sólida (default branco)
  const paint = opts.gradient
    ? gradStroke(opts.gradient, [box.pad, height / 2], [width - box.pad, height / 2], strokeWidth)
    : stroke(opts.color ? rgba(opts.color) : [1, 1, 1, 1], strokeWidth);
  // 1 grupo com todos os paths + 1 trim compartilhado + o paint
  const it = [...shapes];
  if (reveal) it.push({ ty: 'tm', s: k(0), e: { a: 1, k: [{ t: 0, s: [0], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } }, { t: op - 12, s: [100] }] }, o: k(0), m: 1 });
  it.push(paint);
  const layers = [{ ty: 4, nm: 'svg', ip: 0, op, st: 0, ks: transform({ p: k([0, 0, 0]) }), shapes: [{ ty: 'gr', nm: 'svg', it: [...it, { ty: 'tr', p: k([0, 0]), a: k([0, 0]), s: k([100, 100]), r: k(0), o: k(100) }] }] }];
  if (opts.bg) layers.push(backgroundLayer(width, height, rgba(opts.bg), op));
  return lottieDoc({ fr: fps, op, w: width, h: height, layers });
}

// CLI: node svg-to-lottie.mjs <arquivo.svg> [saida]
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const { saveLottie } = await import('./lottie.mjs');
  const f = process.argv[2];
  if (!f) { console.log('uso: node svg-to-lottie.mjs <arquivo.svg> [saida]'); process.exit(1); }
  const svg = fs.readFileSync(f, 'utf8');
  const doc = svgToLottie(svg, { gradient: [0, 0.0, 0.48, 1.0, 0.5, 0.55, 0.35, 0.96, 1.0, 1.0, 0.45, 0.75] });
  saveLottie(doc, process.argv[3] || 'svg-lottie', { open: true });
}
