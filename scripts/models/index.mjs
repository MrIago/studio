// Índice de todas as caixas seladas + tabela de decisão "qual usar".
// Cada modelo é uma caixa selada própria (1 arquivo, opções completas).
// Padrão: gpt-5.4 é o no-brainer; outros são fallback por caso. Ver QUAL-USAR.md.

export { gpt54Image2 } from './gpt-5-4-image-2.mjs';
export { gpt5ImageMini } from './gpt-5-image-mini.mjs';
export { seedream45 } from './seedream-4-5.mjs';
export { gemini25Flash } from './gemini-2-5-flash.mjs';
export { grokImagine } from './grok-imagine.mjs';
export { recraftV3 } from './recraft-v3.mjs';
export { recraftV41ProVector } from './recraft-v4-1-pro-vector.mjs';
// áudio
export { maiVoice2 } from './mai-voice-2.mjs';
export { lyria3 } from './lyria-3.mjs';

// Tabela de decisão (caso → função recomendada). Espelha QUAL-USAR.md.
export const QUAL_USAR = {
  qualidade:            { fn: 'gpt54Image2',          nota: 'precisão/física/texto/detalhe — o padrão' },
  realismoPessoas:      { fn: 'gpt54Image2',          nota: 'poses/expressões variadas; baratos clonam' },
  barataGenerica:       { fn: 'seedream45',           nota: 'detalhe não importa (paisagem, cena)' },
  rapidoComEstilo:      { fn: 'recraftV3',            nota: 'estilo NA lista (Pixel art/Clay/...) + paleta' },
  rapidoSemEstilo:      { fn: 'grokImagine',          nota: 'estilo fora da lista — o mais rápido' },
  editarDetalhe:        { fn: 'gpt54Image2',          nota: 'identidade/detalhe — mandar refs' },
  editarRostoReal:      { fn: 'gpt54Image2',          nota: 'mandar as FOTOS REAIS da pessoa junto' },
  editarSimples:        { fn: 'gemini25Flash',        nota: 'retoque rápido (fallback: seedream45)' },
  compor:               { fn: 'gpt54Image2',          nota: 'juntar pessoas/objetos fiéis a N refs' },
  personagemFiel:       { fn: 'gpt54Image2',          nota: 'ref real → gpt compõe (recusa gerar do zero)' },
  copyrightDoZero:      { fn: 'seedream45',           nota: 'gpt recusa Mickey/Bart; fallback: recraftV3' },
  transparente:         { fn: 'gpt5ImageMini',        nota: 'overlay PNG RGBA real' },
  svg:                  { fn: 'recraftV41ProVector',  nota: 'ícone/logo vetorial — sem fallback' },
  paleta:               { fn: 'recraftV3',            nota: 'rgb_colors forçado (todos recraft têm)' },
  // áudio
  narracaoTTS:          { fn: 'maiVoice2',            nota: '46 vozes/18 idiomas, PT-BR + estilos + speed' },
  musica:               { fn: 'lyria3',               nota: 'clip ~31s/~4cr · pro ~2,6min/~8cr (único de música)' },
};
