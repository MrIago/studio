// Render headless de um vídeo. Renderiza na ENGINE (~/.studio-engine, oculta) e
// COPIA o arquivo final pro projeto em ~/studio/<projeto>/ (onde você acha tudo).
// Abre o resultado ao terminar. Faz setup antes se preciso.
//
//   node video/scripts/render.mjs <CompositionId> [projeto] [--flags do remotion...]
//   (projeto: subpasta em ~/studio/; default = STUDIO_PROJECT ou o id)
//
// Flags extras (tudo após o projeto) são repassadas ao `npx remotion render`:
//   --props='{"file":"proj/x.json"}'  (lottie-box deriva fps/dims/duração do .json — sem flags na mão)
//   transparência: --image-format=png --pixel-format=yuva444p10le --codec=prores --prores-profile=4444 (saída .mov)
//   (o codec define a extensão de saída — prores→.mov, vp9/webm→.webm, senão .mp4)

import { execFileSync, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = process.env.STUDIO_ENGINE || path.join(os.homedir(), '.studio-engine');
const STUDIO_HOME = process.env.STUDIO_HOME || path.join(os.homedir(), 'studio');

const ID = process.argv[2];
if (!ID) { console.error('uso: node render.mjs <CompositionId> [projeto] [--flags remotion]'); process.exit(1); }
// 3º arg: se começa com "-", é flag (sem projeto explícito); senão é o projeto.
const arg3IsFlag = (process.argv[3] || '').startsWith('-');
const explicitProject = arg3IsFlag ? null : process.argv[3];
const extraFlags = process.argv.slice(arg3IsFlag ? 3 : 4); // flags repassadas

// lottie-box: extrai o `file` do --props (usado p/ copiar o .json e derivar o projeto)
const propsFlag = extraFlags.find((f) => f.startsWith('--props='));
let lottieFile = null;
if (ID === 'lottie-box' && propsFlag) { try { lottieFile = JSON.parse(propsFlag.slice('--props='.length)).file; } catch {} }
// sem projeto explícito num lottie-box → deriva da pasta do file ("proj/x.json" → "proj"),
// senão o MP4 cairia em ~/studio/lottie-box/ (footgun). Fallback: STUDIO_PROJECT ou o ID.
const derivedFromFile = lottieFile && lottieFile.includes('/') ? lottieFile.split('/')[0] : null;
const project = explicitProject || derivedFromFile || process.env.STUDIO_PROJECT || ID;
const projectClean = project.replace(/[^a-zA-Z0-9._-]/g, '-');

// extensão de saída pela flag de codec
const codecFlag = extraFlags.find((f) => f.startsWith('--codec='));
const ext = codecFlag?.includes('prores') ? 'mov' : (codecFlag?.includes('vp8') || codecFlag?.includes('vp9')) ? 'webm' : 'mp4';

// garante a engine
if (!fs.existsSync(path.join(ENGINE, 'node_modules'))) {
  console.log('▸ engine ainda não existe — rodando setup…');
  execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'setup.mjs')], { stdio: 'inherit' });
}

// lottie-box: o .json mora em ~/studio/<proj>/ (onde saveLottie deixou), mas o
// LottieLayer carrega de public/ da engine. Copia o .json pro public AUTOMATICAMENTE
// (o user não toca na engine oculta).
if (ID === 'lottie-box' && lottieFile && !path.isAbsolute(lottieFile)) {
  const srcJson = path.join(STUDIO_HOME, lottieFile);       // ~/studio/<proj>/x.json
  const dstJson = path.join(ENGINE, 'public', lottieFile);  // engine/public/<proj>/x.json
  if (fs.existsSync(srcJson)) {
    fs.mkdirSync(path.dirname(dstJson), { recursive: true });
    fs.copyFileSync(srcJson, dstJson);
  } else if (!fs.existsSync(dstJson)) {
    console.error(`✗ Lottie não encontrado: ${srcJson} — salve com saveLottie antes`); process.exit(1);
  }
}

// 1. renderiza dentro da engine (temporário)
const tmp = path.join(ENGINE, 'out', `${ID}.${ext}`);
console.log(`▸ renderizando ${ID}${extraFlags.length ? ' ' + extraFlags.join(' ') : ''}…`);
execFileSync('npx', ['remotion', 'render', ID, tmp, ...extraFlags], { cwd: ENGINE, stdio: 'inherit' });

// 2. copia o arquivo final pro projeto em ~/studio/<projeto>/
const projDir = path.join(STUDIO_HOME, projectClean);
fs.mkdirSync(projDir, { recursive: true });
const finalOut = path.join(projDir, `${ID}.${ext}`);
fs.copyFileSync(tmp, finalOut);

// 3. abre o resultado
const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
execFile(opener, [finalOut], () => {});
console.log(`✓ ${finalOut}`);
