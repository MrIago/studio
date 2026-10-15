// catalog — o catálogo VIVO de modelos de mídia da OpenRouter (imagem, vídeo, voz,
// música), com data e preço. Os modelos mudam todo mês; a tabela "qual usar" é
// um retrato testado, este script é a verdade de hoje. Sem chave (endpoint público).
//
//   node scripts/catalog.mjs                  → resumo das 4 categorias (mais novos primeiro)
//   node scripts/catalog.mjs video            → todos os de vídeo + preço/resolução/duração
//   node scripts/catalog.mjs speech           → todos os de voz + preço
//   node scripts/catalog.mjs speech <id>      → vozes desse modelo
//   node scripts/catalog.mjs video <id>       → ficha completa do modelo (JSON)

const OR = 'https://openrouter.ai/api/v1';
const [, , kind, id] = process.argv;

const get = async (url) => (await (await fetch(url)).json()).data || [];
const date = (t) => new Date((t || 0) * 1000).toISOString().slice(0, 10);
const price = (p) => Object.entries(p || {}).filter(([, v]) => v && v !== '0' && v !== '-1')
  .map(([k, v]) => `${k}=${v}`).join(' ');

async function list(k) {
  if (k === 'video') return get(`${OR}/videos/models`);
  return get(`${OR}/models?output_modalities=${k}`);
}

const kinds = kind ? [kind] : ['image', 'video', 'speech', 'audio'];
for (const k of kinds) {
  const ms = (await list(k)).sort((a, b) => (b.created || 0) - (a.created || 0));
  if (id) {
    const m = ms.find((x) => x.id === id);
    if (!m) { console.log(`${id} não está em ${k}`); process.exit(1); }
    if (k === 'speech') console.log((m.supported_voices || ['(vozes livres / não listadas)']).join('\n'));
    else console.log(JSON.stringify(m, null, 2));
    process.exit(0);
  }
  console.log(`\n== ${k} (${ms.length})`);
  for (const m of kind ? ms : ms.slice(0, 12)) {
    const extra = k === 'video'
      ? ` res=${(m.supported_resolutions || []).join('/')} dur=${(m.supported_durations || []).slice(0, 1)}-${(m.supported_durations || []).slice(-1)}s frames=${(m.supported_frame_images || []).join('+') || '-'} audio=${m.generate_audio ? 'sim' : 'não'} ${price(m.pricing_skus)}`
      : ` ${price(m.pricing)}`;
    console.log(`  ${date(m.created)}  ${m.id}${kind ? extra : ''}`);
  }
}
