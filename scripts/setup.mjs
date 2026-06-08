// Setup / primeiro uso da skill studio. Roda SEM argumentos pra ver o status,
// ou com KEY=valor pra configurar. Multi-OS, idempotente.
//
//   node scripts/setup.mjs                          → mostra o que falta
//   node scripts/setup.mjs OPENROUTER_KEY=sk-or-... → salva a chave
//   node scripts/setup.mjs OPENROUTER_KEY=... GEMINI_API_KEY=... GROQ_API_KEY=...
//
// Keys ficam em ~/.config/studio/.env (privado). Status mostra o que está OK e
// o que cada chave habilita. A skill chama isto no 1º uso pra orientar o usuário.

import { get, setValues } from './lib/config.mjs';

const KEYS = [
  { name: 'OPENROUTER_KEY', req: true,  hab: 'imagem, música, transcrição (fallback)', get: 'openrouter.ai/keys' },
  { name: 'GEMINI_API_KEY', req: false, hab: 'voz/narração (gemini-tts) + diálogo multi-personagem', get: 'aistudio.google.com/apikey' },
  { name: 'GROQ_API_KEY',   req: false, hab: 'transcrição p/ sincronizar narração com vídeo (grátis)', get: 'console.groq.com/keys' },
];

// 1. salva o que veio como KEY=valor
const pairs = {};
for (const arg of process.argv.slice(2)) {
  const i = arg.indexOf('=');
  if (i > 0) pairs[arg.slice(0, i).trim()] = arg.slice(i + 1).trim();
}
if (Object.keys(pairs).length) {
  setValues(pairs);
  console.log(`✓ salvo em ~/.config/studio/.env: ${Object.keys(pairs).join(', ')}\n`);
}

// 2. status
console.log('── studio · status de configuração ──\n');
let missingRequired = false;
for (const k of KEYS) {
  const has = !!get(k.name);
  const tag = has ? '✅' : (k.req ? '❌ OBRIGATÓRIA' : '⚪ opcional');
  console.log(`${tag}  ${k.name}`);
  console.log(`     habilita: ${k.hab}`);
  if (!has) console.log(`     pegue em: ${k.get}  →  node scripts/setup.mjs ${k.name}=...`);
  console.log('');
  if (!has && k.req) missingRequired = true;
}

if (missingRequired) {
  console.log('⚠️  Configure a OPENROUTER_KEY pra usar a skill (imagem/música).');
} else {
  console.log('✓ Pronto pra usar! Geração → ~/studio/<projeto>/. Vídeo precisa de 1 setup extra:');
  console.log('  node video/scripts/setup.mjs   (instala a engine Remotion 1x — só na 1ª vez que for fazer vídeo)');
}
