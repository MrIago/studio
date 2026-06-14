// SVG → componente Remotion (Video.tsx) animado por frame. MESMA coreografia do
// svgToGsap (slide/wipe/pop/fade), mas o TEMPO vem de useCurrentFrame() (não CSS
// @keyframes nem GSAP RAF — esses não sincronizam no render headless do Remotion).
// O "desenhar preenchido" = clip-path setado POR FRAME via interpolate. Renderiza MP4.
//
// Fluxo: svgToRemotion(svg, {parts,...}) → string Video.tsx
//        installRemotionVideo(id, tsx) → escreve em ~/.studio-engine/src/videos/<id>/Video.tsx
//        depois: node video/scripts/render.mjs <id> <projeto>  → MP4 em ~/studio/<projeto>/
//
// parts: [{ name, paths:number[], in, at(s), dur(s) }] — ordem dos <path> = índice.
// in: slide-left/right/up/down · wipe-down/up (filled draw-on) · pop · fade.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const id2 = (s) => 'p_' + String(s).replace(/[^a-zA-Z0-9_]/g, '_');

// gera (declaração de var, expressão de style) pra uma parte, em frames já resolvidos
function partCode(p, fps, slide) {
  const v = id2(p.name);
  const a = Math.round((p.at ?? 0) * fps);
  const b = Math.round(((p.at ?? 0) + (p.dur ?? 0.8)) * fps);
  const ramp = `[${a}, ${b}]`;
  switch (p.in) {
    case 'slide-left':  return [`const ${v} = interpolate(frame, ${ramp}, [-${slide}, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });`, `{ transform: \`translateX(\${${v}}px)\` }`];
    case 'slide-right': return [`const ${v} = interpolate(frame, ${ramp}, [${slide}, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });`, `{ transform: \`translateX(\${${v}}px)\` }`];
    case 'slide-up':    return [`const ${v} = interpolate(frame, ${ramp}, [${slide}, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });`, `{ transform: \`translateY(\${${v}}px)\` }`];
    case 'slide-down':  return [`const ${v} = interpolate(frame, ${ramp}, [-${slide}, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.cubic) });`, `{ transform: \`translateY(\${${v}}px)\` }`];
    case 'wipe-down':   return [`const ${v} = interpolate(frame, ${ramp}, [100, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });`, `{ clipPath: \`inset(0 0 \${${v}}% 0)\` }`];
    case 'wipe-up':     return [`const ${v} = interpolate(frame, ${ramp}, [100, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });`, `{ clipPath: \`inset(\${${v}}% 0 0 0)\` }`];
    case 'pop':         return [`const ${v} = spring({ frame: frame - ${a}, fps, config: { damping: 10, stiffness: 140 } });`, `{ transform: \`scale(\${${v}})\`, transformBox:'fill-box', transformOrigin:'center' }`];
    case 'fade':
    default:            return [`const ${v} = interpolate(frame, ${ramp}, [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });`, `{ opacity: ${v} }`];
  }
}

/** @returns {{ tsx, id, durationFrames }} */
export function svgToRemotion(svgText, o = {}) {
  const fps = o.fps ?? 60;
  const width = o.width ?? 1080, height = o.height ?? 1080;
  const bg = o.bg ?? '#0a0a0a';
  const id = o.id ?? 'logo-anim';
  const slide = o.slide ?? 1100;
  const tags = [...svgText.matchAll(/<path\b[^>]*?><\/path>|<path\b[^>]*?\/?>/g)].map((m) => m[0]);
  const vb = (svgText.match(/viewBox="([^"]+)"/) || [])[1] || `0 0 ${width} ${height}`;
  const parts = (o.parts && o.parts.length) ? o.parts : [{ name: 'all', paths: tags.map((_, i) => i), in: 'wipe-down', at: 0, dur: 1.2 }];

  const used = new Set();
  const decls = [], groups = [];
  for (const p of parts) {
    const [decl, style] = partCode(p, fps, slide);
    decls.push('  ' + decl);
    const inner = (p.paths || []).map((i) => { used.add(i); return tags[i]; }).filter(Boolean).join('');
    groups.push(`        <g style={${style}}>${inner}</g>`);
  }
  const leftover = tags.filter((_, i) => !used.has(i));
  if (leftover.length) groups.push(`        <g>${leftover.join('')}</g>`);

  const totalSec = Math.max(...parts.map((p) => (p.at ?? 0) + (p.dur ?? 0.8)), 0) + (o.holdSec ?? 1.0);
  const durationFrames = Math.round(fps * totalSec);
  const svgSize = Math.round(Math.min(width, height) * 0.82);

  const tsx = `// AUTO-GERADO por svg-remotion.mjs — animação de SVG dirigida por useCurrentFrame.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

export const ID = "${id}";
export const FPS = ${fps};
export const WIDTH = ${width};
export const HEIGHT = ${height};
export const DURATION = ${durationFrames};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
${decls.join('\n')}
  return (
    <AbsoluteFill style={{ backgroundColor: "${bg}", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="${vb}" width={${svgSize}} height={${svgSize}} xmlns="http://www.w3.org/2000/svg">
${groups.join('\n')}
      </svg>
    </AbsoluteFill>
  );
};
`;
  return { tsx, id, durationFrames };
}

// escreve o Video.tsx na engine Remotion (garante a engine via setup se faltar).
export function installRemotionVideo(id, tsx, opts = {}) {
  const SKILL_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  const ENGINE = process.env.STUDIO_ENGINE || path.join(os.homedir(), '.studio-engine');
  if (!fs.existsSync(path.join(ENGINE, 'node_modules'))) {
    console.log('▸ engine ainda não existe — rodando setup (1x)…');
    execFileSync('node', [path.join(SKILL_DIR, 'video', 'scripts', 'setup.mjs')], { stdio: 'inherit' });
  }
  const dir = path.join(ENGINE, 'src', 'videos', id);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'Video.tsx');
  fs.writeFileSync(file, tsx);
  console.log(`  ✓ instalado: ${file}`);
  return file;
}

// CLI: node svg-remotion.mjs <arquivo.svg> <id> [projeto]  (gera + instala + RENDERIZA)
if (import.meta.url === `file://${process.argv[1]}`) {
  const [f, id = 'logo-anim', project] = process.argv.slice(2);
  if (!f) { console.log('uso: node svg-remotion.mjs <arquivo.svg> <id> [projeto]'); process.exit(1); }
  const svg = fs.readFileSync(f, 'utf8');
  const { tsx } = svgToRemotion(svg, { id });
  installRemotionVideo(id, tsx);
  const SKILL_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  execFileSync('node', [path.join(SKILL_DIR, 'video', 'scripts', 'render.mjs'), id, project || id], { stdio: 'inherit' });
}
