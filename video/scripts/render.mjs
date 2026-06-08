// Render headless de um vídeo. Renderiza na ENGINE (~/.studio-engine, oculta) e
// COPIA o MP4 final pro projeto em ~/studio/<projeto>/ (onde você acha tudo).
// Abre o MP4 ao terminar. Faz setup antes se preciso.
//
//   node video/scripts/render.mjs <CompositionId> [projeto]
//   (projeto: nome da subpasta em ~/studio/; default = STUDIO_PROJECT ou o id)

import { execFileSync, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = process.env.STUDIO_ENGINE || path.join(os.homedir(), '.studio-engine');
const STUDIO_HOME = process.env.STUDIO_HOME || path.join(os.homedir(), 'studio');

const ID = process.argv[2];
if (!ID) { console.error('uso: node render.mjs <CompositionId> [projeto]'); process.exit(1); }
const project = (process.argv[3] || process.env.STUDIO_PROJECT || ID).replace(/[^a-zA-Z0-9._-]/g, '-');

// garante a engine
if (!fs.existsSync(path.join(ENGINE, 'node_modules'))) {
  console.log('▸ engine ainda não existe — rodando setup…');
  execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'setup.mjs')], { stdio: 'inherit' });
}

// 1. renderiza dentro da engine (temporário)
const tmp = path.join(ENGINE, 'out', `${ID}.mp4`);
console.log(`▸ renderizando ${ID}…`);
execFileSync('npx', ['remotion', 'render', ID, tmp], { cwd: ENGINE, stdio: 'inherit' });

// 2. copia o MP4 final pro projeto em ~/studio/<projeto>/ (o lugar que você vê)
const projDir = path.join(STUDIO_HOME, project);
fs.mkdirSync(projDir, { recursive: true });
const finalMp4 = path.join(projDir, `${ID}.mp4`);
fs.copyFileSync(tmp, finalMp4);

// 3. abre o MP4 do projeto
const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
execFile(opener, [finalMp4], () => {});
console.log(`✓ ${finalMp4}`);
