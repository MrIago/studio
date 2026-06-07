// Abre o Remotion Studio (preview ao vivo no navegador) pra ajustar o vídeo
// ANTES de renderizar. Hot-reload: edite src/ e o preview atualiza sozinho.
// Rode da pasta do vídeo:  node <skill>/video/scripts/preview.mjs [porta]
//
// ABRE O NAVEGADOR AUTOMATICAMENTE no link (multi-OS). O Studio dá: scrub na
// timeline frame a frame, play, troca de composição, edição de props, e render
// pela própria UI. Pra parar: Ctrl+C. (Render headless direto: render.mjs.)

import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// confirma que está numa pasta de projeto Remotion
const entry = ['src/index.ts', 'src/index.tsx', 'src/index.js', 'src/index.jsx']
  .find((p) => fs.existsSync(path.resolve(p)));
if (!entry) {
  console.error('✗ Não parece um projeto Remotion (sem src/index.*). Rode da pasta do vídeo.');
  process.exit(1);
}

// porta 3007 por padrão (evita conflito com 3000 dos projetos); passe outra como arg
const port = process.argv[2] || '3007';
const url = `http://localhost:${port}`;
console.log(`▸ abrindo Remotion Studio em ${url} … (Ctrl+C pra parar)`);

// abre o navegador no link (multi-OS). Damos um tempinho pro server subir.
function openBrowser() {
  const opener = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'explorer'
    : 'xdg-open';
  execFile(opener, [url], () => {}); // best-effort
}
const openTimer = setTimeout(openBrowser, 4000);

// --no-open: o próprio Remotion não tenta abrir (evita abrir 2x); abrimos nós.
const child = spawn('npx', ['remotion', 'studio', entry, '--port', port, '--no-open'], {
  stdio: 'inherit',
  shell: false,
});
child.on('exit', (code) => { clearTimeout(openTimer); process.exit(code ?? 0); });
