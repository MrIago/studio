// Índice de todas as caixas seladas + tabela de decisão "qual usar".
// Cada modelo é uma caixa selada própria (1 arquivo, opções completas).
// Padrão: gpt-5.4 é o no-brainer; outros são fallback por caso. Ver references/qual-usar.md.

export { gpt54Image2 } from './gpt-5-4-image-2.mjs';
export { gpt5ImageMini } from './gpt-5-image-mini.mjs';
export { seedream45 } from './seedream-4-5.mjs';
export { gemini25Flash } from './gemini-2-5-flash.mjs';
export { grokImagine } from './grok-imagine.mjs';
export { recraftV3 } from './recraft-v3.mjs';
export { recraftV41ProVector } from './recraft-v4-1-pro-vector.mjs';
// áudio — TTS: gemini-tts é o PADRÃO (tags de emoção inline + multi-personagem).
export { geminiTts, geminiDialog, manyVoices } from './gemini-tts.mjs';
export { lyria3 } from './lyria-3.mjs';
// transcrição (timestamps p/ sincronizar narração com vídeo)
export { transcribe, formatTranscript } from '../lib/transcribe.mjs';
// lottie — animação vetorial leve; Claude ESCREVE o JSON Skottie, caixa só valida+salva (offline, NÃO é API)
export { lottie, validateLottie, applyDefaults, saveLottie } from '../lib/lottie.mjs';
export { svgToLottie, svgToLottieShapes } from '../lib/svg-to-lottie.mjs';
// GERAR vídeo por IA (async submit→poll→download). veo3.1 = qualidade+áudio caro;
// grok = rápido/barato sem áudio. i2v via refs. ≠ CRIAR vídeo (Remotion). plumbing em ../lib/video.mjs
export { veo31 } from './veo-3-1.mjs';
export { grokImagineVideo } from './grok-imagine-video.mjs';
// GSAP — animar SVG no browser/app (filled draw-on via clip-path). Emite HTML/React standalone.
// ≠ Lottie (Skottie): GSAP é pra WEB; em Remotion precisa de shim (timeline.seek por frame). Ver references/svg-animation.md
export { svgToGsap } from '../lib/svg-gsap.mjs';
// SVG → Remotion (Video.tsx animado por useCurrentFrame) → MP4. Mesma coreografia do GSAP,
// mas dirigida por frame (clip-path/transform via interpolate). Renderiza vídeo portável.
export { svgToRemotion, installRemotionVideo } from '../lib/svg-remotion.mjs';
// utilitário LOCAL (sem IA/API/custo) — tirar fundo sólido de logo/ícone por flood fill
export { bgRemove } from './bg-remove.mjs';

// Tabela de decisão (caso → função recomendada). Espelha references/qual-usar.md.
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
  narracaoTTS:          { fn: 'geminiTts',            nota: '30 vozes + tags emoção inline ([excited]/[whispers]); auto adapta tom' },
  dialogoPersonagens:   { fn: 'geminiDialog',         nota: '2 vozes num request (precisa GEMINI_API_KEY); 3+ → manyVoices' },
  musica:               { fn: 'lyria3',               nota: 'clip ~31s/~4cr · pro ~2,6min/~8cr (único de música)' },
  // lottie (animação vetorial leve — escrita à mão, validada no render Remotion)
  lottieVetorial:       { fn: 'lottie',               nota: 'logo/loader/data-viz animado — .json p/ site/app OU camada <Lottie> no vídeo; Claude ESCREVE o JSON, NÃO é API' },
  svgAnimado:           { fn: 'svgToLottie',          nota: 'SVG→Lottie .json TRAÇO (stroke+trim/draw-on) — pega TODOS os <path>. Filled NÃO (trim só desenha traço)' },
  // animar SVG preenchido (estilo original, não line-art) → GSAP, não Lottie
  svgAnimadoFilled:     { fn: 'svgToGsap',            nota: 'SVG PREENCHIDO se desenhando (clip-path wipe) no browser/app. Lottie filled exige track-matte frágil; GSAP faz em 1 linha. Ver references/svg-animation.md' },
  svgAnimadoVideo:      { fn: 'svgToRemotion',        nota: 'mesma coreografia em VÍDEO MP4 (Remotion, dirigido por useCurrentFrame+interpolate). Portável, preenchido. Renderiza com video/scripts/render.mjs' },
  // vídeo IA (GERAR, não CRIAR/Remotion) — async submit→poll→download, i2v via refs
  videoQualidade:       { fn: 'veo31',                nota: 'qualidade + ÁUDIO nativo; first+last frame (imageMode:frames); CARO ~$0.40/s (8s≈320cr)' },
  videoRapido:          { fn: 'grokImagineVideo',     nota: 'rápido/barato, SEM áudio, só first_frame; 720p 5s≈35cr' },
  // utilitário local (sem IA/custo)
  tirarFundoLogo:       { fn: 'bgRemove',             nota: 'LOCAL, instantâneo, sem custo: fundo sólido de logo/ícone (flood fill, preserva cores enclausuradas)' },
};
