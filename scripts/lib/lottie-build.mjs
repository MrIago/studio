// Builders Skottie/Bodymovin — montam shapes/keyframes/slots programaticamente,
// pro caso DATA-DRIVEN (350 candles, MRUV físico, etc). Zero dependência.
//
// O gotcha nº1 do Skottie: todo shape vive num GRUPO ty:"gr" cujo `it[]` termina
// num transform "tr". group()/drawGroup() forçam isso — você não esquece o `tr`.
// Cores são RGBA 0-1 (rgba() normaliza de 0-255). Keyframes têm `s` array + easing i/o.
//
// Conhecimento Skottie condensado de diffusionstudio/lottie (MIT) — ver references/lottie.md.

// ── cor: aceita [r,g,b]/[r,g,b,a]. RGB em 0-1 OU 0-255 (autodetecta); ALPHA sempre 0-1
// (convenção Lottie: 1=opaco). Só normaliza alpha se vier >1 (engano comum). Devolve 0-1 RGBA.
export function rgba(c) {
  const big = c.slice(0, 3).some((v) => v > 1); // escala decidida só pelos canais RGB
  const n = big ? 255 : 1;
  const a = c.length >= 4 ? Math.min(c[3] > 1 ? c[3] / 255 : c[3], 1) : 1;
  return [c[0] / n, c[1] / n, c[2] / n, a];
}

// ── easing presets (handles bezier i/o) ──
// Genéricos + os 7 "motion anchors" do upgrade (text-to-lottie/motion-taste.md),
// escolhidos por COMPORTAMENTO (entrando/assentando/viajando/saindo/loop/corte),
// não por tipo de layer. São DEFAULTS pra derivar, não preset fechado: comece no
// anchor mais próximo e ajuste UMA qualidade (aceleração, coast, pouso, overshoot).
// Hierarquia: só o elemento focal ganha a personalidade mais forte (expressivePop);
// suporte usa anchors mais quietos (settleSoft, travelBalanced).
// cubic-bezier(x1,y1,x2,y2) → o:{x:x1,y:y1}, i:{x:x2,y:y2}.
const bez = (x1, y1, x2, y2) => ({ o: { x: [x1], y: [y1] }, i: { x: [x2], y: [y2] } });
export const ease = {
  inOut: { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
  out:   { i: { x: [0.16], y: [1] }, o: { x: [0.3],  y: [0] } },
  in:    { i: { x: [0.7],  y: [1] }, o: { x: [0.5],  y: [0] } },
  linear:{ i: { x: [1],    y: [1] }, o: { x: [0],    y: [0] } },
  // motion anchors (comportamento → feel):
  entranceSharp: bez(0.20, 0.75, 0.34, 0.94), // entrando / mask-wipe: rápido in, pouso macio
  settleSoft:    bez(0.00, 0.65, 0.51, 0.99), // assentando / count-up / logo lockup: ease-out fundo, sem bounce
  kineticUi:     bez(0.85, 0.46, 0.14, 0.53), // state move pequeno e vivo (toggle/accent) — não todo UI
  expressivePop: bez(0.94, 0.75, 0.34, 0.94), // palavra kinética / brand flourish: fast-out + settle macio
  travelBalanced:bez(1.00, 0.49, 0.00, 0.55), // viagem de objeto/câmera/state-to-state: S-curve ease-in-out
  exitAccelerate:bez(1.00, 0.02, 0.54, 0.42), // saindo / companheiro de hard-cut: começa devagar, termina rápido
  travelCut:     bez(0.15, 0.85, 0.95, 0.05), // só p/ movimento interrompido/mascarado/cortado antes de assentar
};
// versão multi-eixo (pra escala/posição vec) — repete o handle por eixo
function easeN(e, dims) {
  return { i: { x: Array(dims).fill(e.i.x[0]), y: Array(dims).fill(e.i.y[0]) },
           o: { x: Array(dims).fill(e.o.x[0]), y: Array(dims).fill(e.o.y[0]) } };
}

// ── propriedade estática ──
export const k = (v) => ({ a: 0, k: v });

// ── propriedade ANIMADA por keyframes: anim([{t, s, e?}, ...]) ──
// cada kf: { t:frame, s:valor(array), e?:easing(default inOut) }. O último kf sem easing.
export function anim(kfs) {
  const dims = Array.isArray(kfs[0]?.s) ? kfs[0].s.length : 1;
  const out = kfs.map((kf, i) => {
    const base = { t: kf.t, s: Array.isArray(kf.s) ? kf.s : [kf.s] };
    if (i === kfs.length - 1) return base;             // último: sem handles
    const e = kf.e || ease.inOut;
    return { ...base, ...(dims > 1 ? easeN(e, dims) : e) };
  });
  return { a: 1, k: out };
}

// ── slots (controles editáveis ao vivo) ──
export const slot = (defaultProp) => ({ p: defaultProp });        // valor p/ doc.slots[id]
export const useSlot = (sid) => ({ sid });                        // referência numa propriedade

// ── transform de layer (ks) ──
export function transform({ o = k(100), r = k(0), p = k([960, 540, 0]), a = k([0, 0, 0]), s = k([100, 100, 100]) } = {}) {
  return { o, r, p, a, s };
}

// ── shapes primitivos (vão dentro do it[] de um grupo) ──
export const ellipse = (center = [0, 0], size = [100, 100]) => ({ ty: "el", p: k(center), s: k(size) });
export const rect = (center = [0, 0], size = [100, 100], radius = 0) => ({ ty: "rc", p: k(center), s: k(size), r: k(radius) });
// path: verts/inT/outT bezier (ou um objeto {v,i,o}). closed default false.
export function path(shape, closed = false) {
  const sh = shape.v ? shape : { v: shape, i: shape.map(() => [0, 0]), o: shape.map(() => [0, 0]) };
  return { ty: "sh", ks: k({ c: closed, v: sh.v, i: sh.i, o: sh.o }) };
}
export const fill = (color) => ({ ty: "fl", c: color.sid ? color : k(color), o: k(100) });
export const stroke = (color, width = 4) => ({ ty: "st", c: color.sid ? color : k(color), w: width.sid ? width : k(width), o: k(100), lc: 2, lj: 2 });
// gradient stroke linear: stops = [pos,r,g,b, pos,r,g,b, ...] (0-1)
export const gradStroke = (stops, from, to, width = 16) => ({
  ty: "gs", t: 1, s: k(from), e: k(to),
  g: { p: stops.length / 4, k: k(stops) }, w: k(width), lc: 2, lj: 2, o: k(100),
});
// trim-path (desenha o path): {from?, to, t0, t1} — reveal de [from→to] entre t0 e t1.
// `start` fixo em `from`; `end` cresce de `from` (frame vazio em t0) até `to`.
export function trim({ to = 100, t0 = 0, t1 = 30, from = 0 } = {}) {
  return { ty: "tm", s: k(from), e: anim([{ t: t0, s: [from], e: ease.inOut }, { t: t1, s: [to] }]), o: k(0), m: 1 };
}

// ── GRUPO: garante o `tr` final (o gotcha nº1). it = shapes/paints/trim ── ──
export function group(items, nm) {
  const hasTr = items.some((i) => i.ty === "tr");
  const it = hasTr ? items : [...items, { ty: "tr", p: k([0, 0]), a: k([0, 0]), s: k([100, 100]), r: k(0), o: k(100) }];
  return { ty: "gr", nm, it };
}
// drawGroup: ordem PROVADA [sh, tm, paint, tr] (de spotify.json/mruv.json)
export function drawGroup(shape, paint, trimOpts, nm) {
  const it = [shape];
  if (trimOpts) it.push(trim(trimOpts));
  it.push(paint);
  return group(it, nm);
}

// ── layer de shape (ty:4) ──
export function shapeLayer({ nm, ip = 0, op = 150, ks, shapes }) {
  return { ty: 4, nm, ip, op, st: 0, ks, shapes };
}

// ── background layer (vai POR ÚLTIMO no array de layers) ──
// ⚠️ Pra exportar TRANSPARENTE (overlay .mov/.webm), NÃO use backgroundLayer —
// o retângulo de fundo tampa a transparência. Use só pra .json/.mp4 com fundo sólido.
export function backgroundLayer(w, h, color, op = 150) {
  return shapeLayer({
    nm: "background", op,
    ks: transform({ p: k([w / 2, h / 2, 0]) }),
    shapes: [group([rect([w / 2, h / 2], [w, h], 0), fill(color)], "bg")],
  });
}

// ── documento Lottie completo ──
export function lottieDoc({ fr = 30, op = 150, w = 1080, h = 1080, layers = [], slots, v = "5.12.2" }) {
  const doc = { v, fr, ip: 0, op, w, h, assets: [], layers };
  if (slots) doc.slots = slots;
  return doc;
}
