// qa — conferir um vídeo RENDERIZADO antes de mostrar (você não assiste; você lê quadros).
// Os três checks que pegam o que lint/preview não pegam:
//
//   node qa.mjs sheet  <video.mp4> [n=12]        → prancha com n quadros espaçados (visão geral, 1 Read)
//   node qa.mjs strip  <video.mp4> <t> [janela=0.8] → quadros CONTÍGUOS em volta de t (transição/corte)
//   node qa.mjs at     <video.mp4> <t1,t2,…>      → um PNG por instante (hero frame de cada beat)
//   node qa.mjs loud   <video.mp4>                → LUFS integrado + true peak (+ por trecho com --every 5)
//   node qa.mjs scan   <video.mp4> [parado=0.6]   → segundos de tela PARADA, quadros pretos e quadro que pisca
//
// `scan` mede o que o olho do usuário sente e o quadro solto não mostra: trechos onde nada se
// mexe (≥ 0,6 s por padrão) são "slide", não motion. Régua do Guney Topcu (out/2026): na versão
// que ele achou viva, 18 s parados em 8 min; na que parecia slide, 54 s. Mire < 5% do vídeo.
//
// Por quê: um quadro por beat prova composição, mas todo defeito de MOVIMENTO
// (pulo, parada morta antes do 2º movimento, um quadro piscando) vive ENTRE os
// beats. Leia as tiras de toda transição. Loudness você não ouve: meça.
// Alvos: fala ~ -14 a -16 LUFS integrado, true peak ≤ -1 dBTP; música 11-20 dB sob a voz.
// Saída em <pasta do vídeo>/qa/. Depois: Read nos PNGs.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , cmd, file, a, b] = process.argv;
if (!cmd || !file) { console.log('uso: qa.mjs sheet|strip|at|loud <video> …'); process.exit(1); }
const out = path.join(path.dirname(path.resolve(file)), 'qa');
fs.mkdirSync(out, { recursive: true });
const base = path.basename(file, path.extname(file));
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
const dur = +execFileSync('ffprobe', ['-v', '0', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString();
const fps = (() => {
  const r = execFileSync('ffprobe', ['-v', '0', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', file]).toString().trim();
  const [n, d] = r.split('/').map(Number); return d ? n / d : n;
})();

if (cmd === 'sheet') {
  const n = +a || 12, cols = Math.min(6, n), rows = Math.ceil(n / cols);
  const p = path.join(out, `${base}-sheet.png`);
  ff(['-i', file, '-vf', `fps=${n}/${dur},scale=320:-1,tile=${cols}x${rows}:padding=4:color=gray`, '-frames:v', '1', p]);
  console.log(p);
} else if (cmd === 'strip') {
  const t = +a, w = +(b || 0.8);
  const n0 = Math.max(0, Math.round((t - w / 2) * fps)), n1 = Math.round((t + w / 2) * fps);
  const count = n1 - n0 + 1, cols = Math.min(8, count), rows = Math.ceil(count / cols);
  const p = path.join(out, `${base}-strip-${t.toFixed(2)}.png`);
  ff(['-i', file, '-vf', `select='between(n,${n0},${n1})',scale=240:-1,tile=${cols}x${rows}:padding=2`, '-frames:v', '1', '-vsync', 'vfr', p]);
  console.log(`${p}  (quadros ${n0}-${n1}, ${count} contíguos a ${fps.toFixed(2)}fps)`);
} else if (cmd === 'at') {
  for (const t of String(a).split(',').map(Number)) {
    const p = path.join(out, `${base}-t${t.toFixed(2)}.png`);
    ff(['-ss', String(t), '-i', file, '-frames:v', '1', p]);
    console.log(p);
  }
} else if (cmd === 'loud') {
  // ebur128 escreve o resumo no STDERR
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const sum = r.stderr.split('Summary:')[1] || '';
  const I = sum.match(/I:\s+(-?[\d.]+) LUFS/)?.[1], TP = sum.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1];
  console.log(`integrado ${I} LUFS · true peak ${TP} dBTP · duração ${dur.toFixed(2)}s`);
} else if (cmd === 'scan') {
  // quadros em cinza 160×90: diferença média entre vizinhos (0-255)
  const W = 160, H = 90, still = +(a || 0.6);
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
  const n = Math.floor(raw.length / (W * H)), px = W * H;
  const f = (i) => raw.subarray(i * px, (i + 1) * px);
  const diff = (x, y) => { const A = f(x), B = f(y); let s = 0; for (let k = 0; k < px; k++) s += Math.abs(A[k] - B[k]); return s / px; };
  const mean = (i) => { const A = f(i); let s = 0; for (let k = 0; k < px; k++) s += A[k]; return s / px; };
  const d = Array.from({ length: n - 1 }, (_, i) => diff(i, i + 1));
  // parado: diferença < 0,35 (só ruído de compressão) por ≥ `still` segundos
  const runs = []; let s0 = -1;
  d.forEach((v, i) => { if (v < 0.35) { if (s0 < 0) s0 = i; } else { if (s0 >= 0 && (i - s0) / fps >= still) runs.push([s0 / fps, i / fps]); s0 = -1; } });
  if (s0 >= 0 && (n - 1 - s0) / fps >= still) runs.push([s0 / fps, (n - 1) / fps]);
  const parado = runs.reduce((acc, [x, y]) => acc + y - x, 0);
  const pretos = []; for (let i = 0; i < n; i++) if (mean(i) < 8) pretos.push(+(i / fps).toFixed(2));
  // pisca: um quadro diferente dos dois vizinhos, que concordam entre si
  const pisca = []; for (let i = 1; i < n - 1; i++) if (d[i - 1] > 12 && d[i] > 12 && diff(i - 1, i + 1) < 6) pisca.push(+(i / fps).toFixed(2));
  console.log(`parado ${parado.toFixed(1)}s de ${dur.toFixed(1)}s (${(100 * parado / dur).toFixed(1)}%) · ${runs.length} trechos`);
  runs.slice(0, 30).forEach(([x, y]) => console.log(`  parado ${x.toFixed(2)}–${y.toFixed(2)}s`));
  console.log(`quadros pretos: ${pretos.length ? pretos.slice(0, 20).join(', ') : 'nenhum'}`);
  console.log(`quadro que pisca: ${pisca.length ? pisca.slice(0, 20).join(', ') : 'nenhum'}`);
} else {
  console.log('comando desconhecido'); process.exit(1);
}
