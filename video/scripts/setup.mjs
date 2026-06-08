// Bootstrap idempotente do workspace Remotion da studio.
// Cria/atualiza ~/studio/_workspace/ a partir do template da skill, SEM apagar
// node_modules nem os seus vídeos. Roda npm install só se o package.json mudou.
//
//   node video/scripts/setup.mjs
//
// Por que fora da skill: ~/studio/ é permanente; o cache do plugin é sobrescrito
// a cada /plugin update. Aqui só o TEMPLATE (versionado na skill) é sincronizado.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(SKILL_DIR, 'workspace-template');
// engine de vídeo (Remotion + node_modules): pasta OCULTA, separada dos outputs.
const WS = process.env.STUDIO_ENGINE || path.join(os.homedir(), '.studio-engine');

// copia recursiva preservando o que o usuário criou. Sobrescreve componentes/
// config/package (são "da skill"); NÃO toca em src/videos/ do usuário, node_modules, out, public.
const SKILL_OWNED = ['package.json', 'tsconfig.json', 'remotion.config.ts', 'src/index.ts', 'src/Root.tsx', 'src/components'];

function copyInto(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, e.name), d = path.join(dstDir, e.name);
    if (e.isDirectory()) copyInto(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const firstTime = !fs.existsSync(WS);
  fs.mkdirSync(WS, { recursive: true });

  // 1. sincroniza os arquivos "da skill" (componentes, config) — sempre atualizados
  for (const rel of SKILL_OWNED) {
    const src = path.join(TEMPLATE, rel), dst = path.join(WS, rel);
    if (!fs.existsSync(src)) continue;
    if (fs.statSync(src).isDirectory()) {
      fs.rmSync(dst, { recursive: true, force: true }); // componentes são da skill → substitui
      copyInto(src, dst);
    } else {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }

  // 2. na 1ª vez, traz também o exemplo + .gitignore (depois não sobrescreve videos do user)
  if (firstTime) {
    copyInto(path.join(TEMPLATE, 'src', 'videos'), path.join(WS, 'src', 'videos'));
    const gi = path.join(TEMPLATE, '.gitignore');
    if (fs.existsSync(gi)) fs.copyFileSync(gi, path.join(WS, '.gitignore'));
    fs.mkdirSync(path.join(WS, 'public'), { recursive: true });
  }

  // 3. npm install só se necessário (1ª vez, ou package.json mudou desde o último)
  const pkgHashFile = path.join(WS, '.pkg-hash');
  const pkgContent = fs.readFileSync(path.join(WS, 'package.json'), 'utf8');
  const prevHash = fs.existsSync(pkgHashFile) ? fs.readFileSync(pkgHashFile, 'utf8') : '';
  const curHash = String(pkgContent.length) + ':' + pkgContent.slice(0, 200);
  const needInstall = firstTime || !fs.existsSync(path.join(WS, 'node_modules')) || prevHash !== curHash;

  if (needInstall) {
    console.log('▸ npm install no workspace (1ª vez ou deps mudaram)…');
    // --legacy-peer-deps: @react-three/fiber declara peer react<19, mas roda com 19
    execSync('npm install --legacy-peer-deps', { cwd: WS, stdio: 'inherit' });
    fs.writeFileSync(pkgHashFile, curHash);
  } else {
    console.log('▸ deps já instaladas (sem mudança no package.json).');
  }

  console.log(`✓ engine de vídeo pronta em ${WS} (oculta — você não mexe aqui)`);
  console.log(`  • preview: node video/scripts/preview.mjs   (localhost:3007)`);
  console.log(`  • render: node video/scripts/render.mjs <id> → copia o MP4 pro projeto`);
}

main();
