import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {execFile} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Render headless de um vídeo Remotion da studio. Rode da pasta do vídeo:
//   node <skill>/video/scripts/render.mjs [CompositionId]
// Acha o entry automaticamente (src/index.ts|tsx|js|jsx). Abre o MP4 ao terminar.

const ID = process.argv[2] ?? 'Main';
const OUT = path.resolve(`out/${ID}.mp4`);

const entry = ['src/index.ts', 'src/index.tsx', 'src/index.js', 'src/index.jsx']
  .map((p) => path.resolve(p))
  .find((p) => fs.existsSync(p));
if (!entry) {
  console.error('✗ entry não encontrado (src/index.ts|tsx|js|jsx). Rode da pasta do vídeo.');
  process.exit(1);
}

console.log('▸ bundling…');
const serveUrl = await bundle({entryPoint: entry, webpackOverride: (c) => c});

console.log('▸ selecting composition…');
const composition = await selectComposition({serveUrl, id: ID});

console.log(`▸ rendering ${composition.durationInFrames} frames…`);
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: OUT,
  onProgress: ({progress}) => {
    process.stdout.write(`\r  ${Math.round(progress * 100)}%   `);
  },
});

console.log(`\n✓ rendered → ${OUT}`);

// abre o vídeo automaticamente (multi-OS: open/explorer/xdg-open)
const opener = process.platform === 'darwin' ? 'open'
  : process.platform === 'win32' ? 'explorer'
  : 'xdg-open';
execFile(opener, [OUT], (err) => {
  if (err) console.log('(abra manualmente:', OUT, ')');
});
