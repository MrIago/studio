// Output organizado + abrir a pasta automaticamente.
// As caixas geram mídia; este helper decide ONDE salvar e ABRE pra você ver.
//
// Regras de path:
//  - caminho ABSOLUTO ou que começa com ./ ou ../ ou public/  → respeita (ex: assets de vídeo)
//  - só um NOME (ex: "rayan-taca")  → salva em ~/studio-output/<data>/ (permanente, organizado)
// Ao terminar um lote, chame openDir(dir) uma vez pra abrir a pasta no gerenciador.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

export const OUTPUT_ROOT = process.env.STUDIO_OUTPUT_DIR
  || path.join(os.homedir(), 'studio-output');

// resolve onde salvar a partir do que o chamador passou (sem extensão).
export function resolveOut(nameOrPath) {
  const p = String(nameOrPath);
  // já é um caminho explícito → respeita (vídeo usa public/, etc)
  if (path.isAbsolute(p) || p.startsWith('./') || p.startsWith('../')
      || p.startsWith('public/') || p.startsWith('public' + path.sep)
      || p.startsWith('/tmp')) {
    return p;
  }
  // só um nome → pasta organizada por data
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC; suficiente)
  const dir = path.join(OUTPUT_ROOT, day);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, p);
}

// abre um arquivo ou pasta no app padrão do SO. Chame UMA vez ao fim de um lote.
export function open(target) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'explorer'
    : 'xdg-open';
  execFile(cmd, [target], () => {}); // best-effort; ignora erro (headless/sem GUI)
}

// pasta onde um arquivo salvo está (pra abrir o diretório, não o arquivo).
export function dirOf(filePath) {
  return path.dirname(path.resolve(filePath));
}
