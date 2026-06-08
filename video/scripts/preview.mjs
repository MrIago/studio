// Abre o Remotion Studio (preview ao vivo) do WORKSPACE único da studio.
// Roda em ~/studio/_workspace (1 npm install, todos os vídeos vivem lá).
// ABRE O NAVEGADOR sozinho. Faz o setup antes (idempotente) se preciso.
//
//   node video/scripts/preview.mjs [porta]

import { spawn, execFileSync, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WS = process.env.STUDIO_ENGINE || path.join(os.homedir(), '.studio-engine');

// garante o workspace (cria/atualiza; instala só se preciso)
if (!fs.existsSync(path.join(WS, 'node_modules'))) {
  console.log('▸ workspace ainda não existe — rodando setup…');
  execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'setup.mjs')], { stdio: 'inherit' });
}

const port = process.argv[2] || '3007';
const url = `http://localhost:${port}`;
console.log(`▸ Remotion Studio em ${url} (workspace: ${WS}) … Ctrl+C pra parar`);

const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
const openTimer = setTimeout(() => execFile(opener, [url], () => {}), 4000);

const child = spawn('npx', ['remotion', 'studio', 'src/index.ts', '--port', port, '--no-open'], {
  cwd: WS, stdio: 'inherit', shell: false,
});
child.on('exit', (code) => { clearTimeout(openTimer); process.exit(code ?? 0); });
