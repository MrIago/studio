// Config da skill studio: lê chaves de env OU de ~/.config/studio/.env.
// Permite que quem instala configure a OPENROUTER_KEY sem editar o shell.
// Salvar:  node scripts/lib/config.mjs OPENROUTER_KEY=sk-or-...
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CONFIG_FILE = path.join(os.homedir(), '.config', 'studio', '.env');

function readFile() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  const out = {};
  for (const raw of fs.readFileSync(CONFIG_FILE, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.length >= 2 && (val[0] === '"' || val[0] === "'") && val[val.length - 1] === val[0]) {
      val = val.slice(1, -1);
    }
    out[k] = val;
  }
  return out;
}

export function get(name, def = null) {
  const env = process.env[name];
  if (env && env.trim()) return env.trim();
  const v = readFile()[name];
  return v && v.trim() ? v.trim() : def;
}

export function setValues(pairs) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  const cur = readFile();
  for (const [k, v] of Object.entries(pairs)) if (v) cur[k] = v;
  const body =
    '# studio config — secrets, keep private\n' +
    Object.entries(cur).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  fs.writeFileSync(CONFIG_FILE, body, 'utf8');
}

// CLI: node config.mjs OPENROUTER_KEY=sk-or-...
if (import.meta.url === `file://${process.argv[1]}`) {
  const pairs = {};
  for (const arg of process.argv.slice(2)) {
    const i = arg.indexOf('=');
    if (i > 0) pairs[arg.slice(0, i)] = arg.slice(i + 1);
  }
  if (Object.keys(pairs).length) {
    setValues(pairs);
    console.log(`✓ salvo em ${CONFIG_FILE}: ${Object.keys(pairs).join(', ')}`);
  } else {
    console.log('uso: node config.mjs OPENROUTER_KEY=sk-or-...');
  }
}
