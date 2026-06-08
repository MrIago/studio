// Output organizado por PROJETO. TUDO que a studio gera (imagem, ícone, post,
// áudio, vídeo…) vai pra ~/studio/<projeto>/. Um lugar só, por projeto.
//
//   ~/studio/
//   ├── carrossel-vasco/   ← imagens do carrossel
//   ├── icones-app/        ← ícones
//   └── intro-skill/       ← assets + o MP4 final do vídeo
//
// O PROJETO é nomeado pelo pedido: a skill seta STUDIO_PROJECT="carrossel-vasco"
// no começo de uma geração (mesma conversa reusa; pedido novo = pasta nova).
//
// (A engine de vídeo Remotion vive separada em ~/.studio-engine/ — técnica,
//  oculta. O render copia o MP4 final pra cá, ~/studio/<projeto>/.)
//
// save(name):
//  - caminho ABSOLUTO / ./ / ../ / /tmp  → respeitado
//  - "projeto/arquivo"  → ~/studio/projeto/arquivo
//  - só "arquivo"       → ~/studio/<STUDIO_PROJECT ou 'avulsos'>/arquivo

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

// raiz dos OUTPUTS (permanente). Override: env STUDIO_HOME.
export const STUDIO_HOME = process.env.STUDIO_HOME || path.join(os.homedir(), 'studio');

// projeto "atual" — a skill define via env STUDIO_PROJECT (nome do pedido).
function currentProject() {
  return (process.env.STUDIO_PROJECT || 'avulsos').replace(/[^a-zA-Z0-9._-]/g, '-');
}

// resolve onde salvar (sem extensão).
export function resolveOut(nameOrPath) {
  const p = String(nameOrPath);
  if (path.isAbsolute(p) || p.startsWith('./') || p.startsWith('../') || p.startsWith('/tmp')) {
    return p;
  }
  const rel = p.includes('/') ? p : path.join(currentProject(), p);
  const full = path.join(STUDIO_HOME, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  return full;
}

// pasta de um projeto (cria se não existe).
export function projectDir(name) {
  const dir = path.join(STUDIO_HOME, String(name).replace(/[^a-zA-Z0-9._-]/g, '-'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// abre arquivo/pasta no app padrão do SO (multi-OS). Chame 1x ao fim de um lote.
export function open(target) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  execFile(cmd, [target], () => {});
}

export function dirOf(filePath) {
  return path.dirname(path.resolve(filePath));
}
