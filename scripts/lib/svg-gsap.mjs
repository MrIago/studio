// SVG → animação GSAP (browser/app). Pra logo/ícone PREENCHIDO se animando —
// onde o Lottie falha: "desenhar" no Lottie é stroke+trim (vira TRAÇO); preenchido
// exige track-matte frágil. GSAP anima o SVG REAL ao vivo: filled draw-on = um
// `clip-path` wipe (1 linha), fundo/cores originais intactos. Ver references/svg-animation.md.
//
// Zero dependência (emite HTML standalone com GSAP via CDN). Agrupa os <path> do SVG
// por índice em partes nomeadas e aplica uma animação de entrada por parte, no tempo certo.
//
// ⚠️ Remotion: GSAP usa relógio próprio (requestAnimationFrame) — NÃO sincroniza com o
// render frame-a-frame do Remotion. Pra usar no Remotion: timeline PAUSADA + `tl.seek(frame/fps)`
// dirigido por useCurrentFrame (shim em emitRemotionNote()), OU prefira `interpolate` nativo.
//
// API:
//   svgToGsap(svgText, { parts, width, height, bg, loop }) → { html }
//   saveGsap(result, name, { open }) → caminho .html salvo

import fs from 'node:fs';
import { resolveOut, open as openDir, dirOf } from './output.mjs';

// animações de entrada suportadas (CSS/GSAP no SVG ao vivo)
export const GSAP_INS = ['slide-left', 'slide-right', 'slide-up', 'slide-down', 'wipe-down', 'wipe-up', 'fade', 'pop', 'draw'];

// gera o trecho de timeline GSAP pra uma parte (#id), conforme o tipo de entrada.
function tween(id, kind, dur, slide = 1100) {
  switch (kind) {
    case 'slide-left':  return `tl.from('#${id}',{x:-${slide},opacity:0,duration:${dur},ease:'power4.out'}`;   // entra da esquerda e freia
    case 'slide-right': return `tl.from('#${id}',{x:${slide},opacity:0,duration:${dur},ease:'power4.out'}`;
    case 'slide-up':    return `tl.from('#${id}',{y:${slide},opacity:0,duration:${dur},ease:'power4.out'}`;
    case 'slide-down':  return `tl.from('#${id}',{y:-${slide},opacity:0,duration:${dur},ease:'power4.out'}`;
    case 'wipe-down':   return `tl.fromTo('#${id}',{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:${dur},ease:'power2.inOut'}`; // desenha de cima→baixo (filled)
    case 'wipe-up':     return `tl.fromTo('#${id}',{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)',duration:${dur},ease:'power2.inOut'}`;
    case 'pop':         return `tl.from('#${id}',{scale:0.4,opacity:0,transformOrigin:'center',duration:${dur},ease:'back.out(2.2)'}`;
    case 'fade':        return `tl.from('#${id}',{opacity:0,duration:${dur},ease:'power2.out'}`;
    case 'draw':        return `tl.from('#${id}',{opacity:0,duration:${dur},ease:'power2.out'}`; // draw-on real = DrawSVG (plugin pago); aqui fallback fade — p/ traço use svgToLottie
    default:            return `tl.from('#${id}',{opacity:0,duration:${dur},ease:'power2.out'}`;
  }
}

/**
 * @param {string} svgText
 * @param {object} o
 *   parts: [{ name, paths:number[], in:GSAP_INS, at:seconds, dur:seconds }]  — ordem dos <path> = índice
 *   width/height: tamanho do palco (default lê viewBox)  · bg: cor da página (default '#0a0a0a')
 *   loop: repete (default true)
 * @returns {{ html:string }}
 */
export function svgToGsap(svgText, o = {}) {
  const tags = [...svgText.matchAll(/<path\b[^>]*?><\/path>|<path\b[^>]*?\/?>/g)].map((m) => m[0]);
  const vb = (svgText.match(/viewBox="([^"]+)"/) || [])[1] || `0 0 ${o.width || 1024} ${o.height || 1024}`;
  const bg = o.bg ?? '#0a0a0a';
  const loop = o.loop !== false;
  const parts = o.parts && o.parts.length ? o.parts : [{ name: 'all', paths: tags.map((_, i) => i), in: 'wipe-down', at: 0, dur: 1.2 }];

  // monta <g id> por parte (cada path entra na 1ª parte que o lista; resto fica solto)
  const used = new Set();
  const groups = parts.map((p) => {
    const inner = (p.paths || []).map((i) => { used.add(i); return tags[i]; }).filter(Boolean).join('');
    return `<g id="${p.name}">${inner}</g>`;
  });
  const leftover = tags.filter((_, i) => !used.has(i)).join('');
  const svgInner = groups.join('') + (leftover ? `<g id="_rest">${leftover}</g>` : '');

  // CSS: cada parte com clip-path precisa de transform-box pra scale/origin previsível
  const css = parts.map((p) => `#${p.name}{transform-box:fill-box}`).join('');
  // timeline: cada parte no seu tempo `at`
  const tl = parts.map((p) => {
    const dur = p.dur ?? 0.8;
    const at = p.at ?? 0;
    return `  ${tween(p.name, p.in || 'fade', dur)},${at});`;
  }).join('\n');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>svg-gsap</title>
<style>html,body{margin:0;height:100%;background:${bg};display:flex;align-items:center;justify-content:center;overflow:hidden}
svg{width:80vmin;height:80vmin}${css}
.bar{position:fixed;top:12px;left:12px;font:13px system-ui,sans-serif;color:#888}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script></head>
<body><div class="bar">GSAP · clique p/ repetir</div>
<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>
<script>
function run(){
  const tl=gsap.timeline();
${tl}
  ${loop ? `tl.to({},{duration:0.9}).eventCallback('onComplete',()=>tl.restart());` : ''}
}
run(); document.body.onclick=run;
</script></body></html>`;
  return { html };
}

// salva o .html (mesmo padrão de save/saveAudio/saveVideo). { open:true } abre.
export function saveGsap(result, name, opts = {}) {
  const out = `${resolveOut(name)}.html`;
  fs.writeFileSync(out, result.html);
  console.log(`  ✓ ${out} (${(result.html.length / 1024) | 0}KB)`);
  if (opts.open) openDir(dirOf(out));
  return out;
}

// CLI: node svg-gsap.mjs <arquivo.svg> [saida]  (anima tudo com wipe-down)
if (import.meta.url === `file://${process.argv[1]}`) {
  const f = process.argv[2];
  if (!f) { console.log('uso: node svg-gsap.mjs <arquivo.svg> [saida]'); process.exit(1); }
  const svg = fs.readFileSync(f, 'utf8');
  saveGsap(svgToGsap(svg), process.argv[3] || 'svg-gsap', { open: true });
}
