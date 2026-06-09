// CAIXA LOTTIE — animação vetorial leve (logo/loader/data-viz/SVG animado).
//
// ⚠️ NÃO É UMA CAIXA DE API. As outras caixas chamam OpenRouter/Gemini via fetch.
// Aqui o GERADOR É O PRÓPRIO CLAUDE: você (o agente) ESCREVE o JSON Skottie/Bodymovin
// inline (ou via os builders de lottie-build.mjs). Esta caixa só:
//   1. aplica defaults (versão/fps/dims/op),
//   2. valida o que o NOSSO runtime (lottie-web/Remotion) quebraria,
//   3. serializa em bytes → reusa save() do or.mjs (salva em ~/studio/<projeto>/).
//
// Sem fetch, sem getKey, sem chave. Roda offline, síncrono.
//
// 2 usos: (A) o .json é o entregável leve pra site/app; (B) vira camada <Lottie>
// num vídeo Remotion (bloco components/lottie/LottieLayer.tsx).
//
// Regras Skottie + prompt guide: references/lottie.md (condensado de
// diffusionstudio/lottie, MIT). Validar SEMPRE no render Remotion (lottie-web),
// não no Skottie — runtimes divergem; nosso runtime de entrega é o lottie-web.

import { save } from './or.mjs';

// ── defaults: só preenche o AUSENTE (idempotente, ??=) ──
export function applyDefaults(doc, opts = {}) {
  const d = { ...doc };
  d.v ??= '5.12.2';
  d.fr ??= opts.fps ?? 30;
  d.ip ??= 0;
  d.op ??= opts.durationInFrames ?? Math.round(d.fr * (opts.seconds ?? 5)); // GARANTE op>0
  d.w ??= opts.width ?? 1080;
  d.h ??= opts.height ?? 1080;
  d.nm ??= opts.name ?? 'animation';
  d.ddd ??= 0;
  // cópia defensiva dos arrays (não compartilhar referência com o doc do caller)
  d.assets = Array.isArray(doc.assets) ? [...doc.assets] : [];
  d.layers = Array.isArray(doc.layers) ? [...doc.layers] : [];
  return d;
}

// varre recursivamente um valor procurando número não-finito (NaN/Infinity) ou null
// em posição numérica — rede de segurança contra geometria corrompida por bug de parse.
function hasNonFinite(val) {
  if (val == null) return false;
  if (typeof val === 'number') return !Number.isFinite(val);
  if (Array.isArray(val)) return val.some((v) => v === null || hasNonFinite(v)); // null num array de coords = corrompido
  if (typeof val === 'object') return Object.values(val).some(hasNonFinite);
  return false;
}

// travessia recursiva dos shapes (incl. grupos aninhados it[])
function walkShapes(shapes, fn, path = 'layer') {
  for (const s of shapes || []) {
    fn(s, path);
    if (s.ty === 'gr' && Array.isArray(s.it)) walkShapes(s.it, fn, `${path}>gr`);
  }
}

// ── validação: ERROR = o que lottie-web/Remotion QUEBRA; WARNING = regra Skottie tolerável ──
export function validateLottie(doc) {
  const errors = [], warnings = [];
  // ERRORS (quebram o render)
  for (const f of ['v', 'fr', 'w', 'h']) if (doc[f] == null) errors.push(`falta top-level "${f}"`);
  if (!Array.isArray(doc.layers) || doc.layers.length === 0) errors.push('layers vazio ou ausente');
  if (!(doc.op > 0)) errors.push('op deve ser > 0 (senão getLottieMetadata → null)');
  // geometria corrompida: NaN/Infinity/null em coords (ex.: parse de SVG que falhou) → render quebrado
  (doc.layers || []).forEach((l, i) => {
    walkShapes(l.shapes, (s) => {
      if (s.ty === 'sh' && hasNonFinite(s.ks?.k)) errors.push(`layer ${i}: path com coordenada não-finita (NaN/null) — geometria corrompida`);
    });
  });

  // WARNINGS (Skottie estrito, mas lottie-web tolera — NÃO bloqueiam)
  (doc.layers || []).forEach((l, i) => {
    if (!l.nm) warnings.push(`layer ${i} sem nm`);
    walkShapes(l.shapes, (s) => {
      // grupo sem tr final
      if (s.ty === 'gr' && Array.isArray(s.it) && !s.it.some((x) => x.ty === 'tr'))
        warnings.push(`grupo "${s.nm || '?'}" sem transform "tr" final (gotcha Skottie nº1)`);
      // cor fora de 0-1 — SÓ em chaves de cor (c.k), nunca em transform s/p/a
      if ((s.ty === 'fl' || s.ty === 'st') && s.c && !s.c.sid && Array.isArray(s.c.k)) {
        if (s.c.k.some((v) => v > 1)) warnings.push(`cor fora de 0-1 em "${s.ty}" (use 0-1 RGBA)`);
      }
      // sid referenciado sem doc.slots
      for (const prop of ['c', 'w', 's', 'p']) {
        if (s[prop]?.sid && !doc.slots?.[s[prop].sid])
          warnings.push(`slot "${s[prop].sid}" referenciado mas não declarado em doc.slots`);
      }
    });
  });
  // background deveria ser o último layer
  const bgIdx = (doc.layers || []).findIndex((l) => /background|bg/i.test(l.nm || ''));
  if (bgIdx >= 0 && bgIdx !== doc.layers.length - 1)
    warnings.push('layer de background não é o último (renderiza por cima de algo)');

  return { ok: errors.length === 0, errors, warnings };
}

// ── lottie(doc, opts) → { ok, bytes, ext:'json', warnings } | { ok:false, reason, detail } ──
// NÃO salva. Use saveLottie() ou save(lottie(doc), name) pra gravar.
export function lottie(doc, opts = {}) {
  const full = applyDefaults(doc, opts);
  const { ok, errors, warnings } = validateLottie(full);
  if (!ok) return { ok: false, reason: 'INVALID_LOTTIE', detail: errors.join('; ') };
  if (warnings.length) for (const w of warnings) console.warn(`  ⚠ ${w}`);
  const bytes = Buffer.from(JSON.stringify(full, null, opts.minify ? 0 : 2), 'utf8');
  // alerta de peso (Lottie típico < 20KB; > 250KB é pesado p/ web)
  if (bytes.length > 250 * 1024)
    console.warn(`  ⚠ Lottie ${(bytes.length / 1024) | 0}KB — pesado p/ web (típico <20KB); simplifique ou entregue como vídeo Remotion`);
  return { ok: true, bytes, ext: 'json', cost: null, warnings };
}

// ── saveLottie: gera + salva (~/studio/<projeto>/). Reusa save() do or.mjs ──
export function saveLottie(doc, name, opts = {}) {
  const r = lottie(doc, opts);
  return save(r, name, opts);
}

// CLI: node lottie.mjs <arquivo.json> [nome-saida]  → valida + salva
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const f = process.argv[2];
  if (!f) { console.log('uso: node lottie.mjs <arquivo.json> [nome-saida]'); process.exit(1); }
  const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
  const out = process.argv[3] || 'lottie-out';
  console.log(`▸ validando + salvando ${f} → ${out}`);
  saveLottie(doc, out, { open: true });
}
