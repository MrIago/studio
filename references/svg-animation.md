# Animar SVG / logo — qual ferramenta (descobertas testadas)

Mapa de decisão pra **animar uma logo/SVG** (ex: logo se montando, loader, reveal de marca).
Testado na prática — inclui as armadilhas que custaram tempo.

## Decisão rápida

| Quero… | Ferramenta | Por quê |
|---|---|---|
| **traço se desenhando** (line-art, contorno) | **`svgToLottie`** (Lottie) | `stroke`+`trim` desenha o comprimento do traço — é o que o Lottie faz nativo (o "hello" prova). `.json` portável. |
| **preenchido se montando** (estilo original, sólido) | **`svgToGsap`** (GSAP) | filled draw-on = `clip-path` wipe, 1 linha. Roda no browser/app. |
| **vídeo realista / com áudio** (prompt→vídeo, i2v) | **`veo31`** / **`grokImagineVideo`** | geração por IA (mp4). Caro. |
| **vídeo programático multi-shot** (montar assets num MP4) | **Remotion** (`criar-video.md`) | controle total, código. |

## ⚠️ A armadilha do Lottie: "desenhar" só funciona em TRAÇO, não em PREENCHIDO

```
DESENHAR (Lottie) = trim path num STROKE → revela o COMPRIMENTO do traço aos poucos
PREENCHIDO        = uma ÁREA cheia. Não tem "comprimento" pra trimar.
```

- O `svgToLottie` faz **stroke+trim** → desenha lindo o **contorno** (line-art). É o caso do exemplo "hello".
- Pra um logo **preenchido** aparecer aos poucos, o Lottie precisa de **track-matte** (camada-máscara `td`/`tt` que varre e revela o fill por baixo).
- **Track-matte é FRÁGIL**: (1) nenhum helper na skill (`lottie-build.mjs` só tem `path/fill/stroke/trim/group/transform`) → tem que escrever o matte na mão; (2) renderiza inconsistente em `lottie-web`/SVG. **Testado 3×, quebrou** (só aparecia uma parte). Não vale a briga.
- **Lição:** Lottie = ouro pra **traço/loader/micro-anim/data-viz**. Pra **filled choreography** → use GSAP.

## GSAP — filled draw-on em 1 linha (`svgToGsap`)

GSAP anima o **SVG real ao vivo** (cores/fills originais intactos). "Desenhar o preenchido" = `clip-path` wipe.

```js
import { svgToGsap, saveGsap } from './scripts/lib/svg-gsap.mjs';
const svg = fs.readFileSync('logo.svg', 'utf8');   // de preferência um SVG real (recraftV41ProVector)
// agrupa os <path> por ÍNDICE em partes e dá uma entrada pra cada, no tempo certo:
const { html } = svgToGsap(svg, {
  bg: '#0a0a0a',
  parts: [
    { name: 'truck', paths: [1,2,3,10,11,12,13], in: 'slide-left', at: 0,    dur: 0.9 }, // entra L→R e freia
    { name: 'e',     paths: [0],                  in: 'wipe-down',  at: 0.85, dur: 1.1 }, // PREENCHIDO desenha de cima→ponta
    { name: 'moto',  paths: [4,5,6,7,8,9,14,15],  in: 'pop',        at: 2.0,  dur: 0.55 },// surge
  ],
});
saveGsap({ html }, 'logo-anim', { open: true });   // → ~/studio/<projeto>/logo-anim.html
```

Entradas (`in`): `slide-left/right/up/down` (transform, ease power4.out = freia), `wipe-down/up` (clip-path = filled draw-on), `pop` (scale back.out), `fade`, `draw` (traço — precisa plugin pago DrawSVG; fallback fade).

**Como achar os índices dos `<path>`:** os paths entram na ordem do SVG. Pra classificar (caminhão/letra/moto), analise a **bbox** de cada path (`grep` os `d=` e compute min/max x,y) e agrupe por região (topo = caminhão, etc).

## GSAP funciona no Remotion? Não nativamente — precisa de shim

GSAP usa **relógio próprio** (`requestAnimationFrame`); o Remotion renderiza **frame-a-frame** com `useCurrentFrame()` (determinístico, headless). Timeline GSAP em tempo real **não sincroniza** com o render do Remotion.

Pra usar GSAP DENTRO do Remotion: timeline **pausada** + `seek` por frame.

```tsx
// componente Remotion
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';

export const LogoGsap = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const ref = useRef(null); const tl = useRef(null);
  useLayoutEffect(() => {
    tl.current = gsap.timeline({ paused: true });
    tl.current.from(ref.current.querySelector('#truck'), { x: -1100, ease: 'power4.out', duration: 0.9 });
    // ...resto da timeline...
  }, []);
  tl.current?.seek(frame / fps);   // dirige a timeline pelo frame do Remotion
  return <svg ref={ref}>{/* ... */}</svg>;
};
```

Resumo: **GSAP é pra WEB/app** (o `svgToGsap` emite HTML standalone — ideal pra logo de entrada num site/React, ex. um `Overlay.tsx`). No Remotion, ou faz o shim `seek`, ou usa `interpolate`/`spring` nativos (mais idiomático).

### `svgToRemotion` — a MESMA coreografia em VÍDEO MP4 (pronto)

Não precisa escrever o componente na mão: `svgToRemotion(svg, { parts })` gera o
`Video.tsx` (dirigido por `useCurrentFrame` + `interpolate`/`spring`), `installRemotionVideo`
joga na engine, e `video/scripts/render.mjs <id> <projeto>` renderiza o MP4. O
"desenhar preenchido" usa `clip-path` setado POR FRAME (não CSS @keyframes — esses
não sincronizam). **Provado**: caminhão slide → "e" preenchido wipe cima→baixo → moto pop, termina na logo exata.

```js
import { svgToRemotion, installRemotionVideo } from './scripts/lib/svg-remotion.mjs';
const { tsx } = svgToRemotion(svg, { id:'logo-anim', fps:60, width:1080, height:1080, parts:[
  { name:'e',     paths:[0],             in:'wipe-down',  at:0.85, dur:1.1 },
  { name:'truck', paths:[1,2,3],         in:'slide-left', at:0,    dur:0.9 },
  { name:'moto',  paths:[4,5,6],         in:'pop',        at:2.0,  dur:0.55 },
]});
installRemotionVideo('logo-anim', tsx);
// depois: node video/scripts/render.mjs logo-anim <projeto>  → ~/studio/<projeto>/logo-anim.mp4
```

Mesmas entradas (`in`) do `svgToGsap`. **3 destinos, 1 coreografia:** `svgToGsap` (web/app HTML),
`svgToRemotion` (MP4 portável), `svgToLottie` (traço/.json).

### O que NÃO funciona no Remotion (resumão)

| | sincroniza no render headless? |
|---|---|
| CSS `@keyframes` / `animation:` | ❌ relógio real |
| GSAP timeline tempo real | ❌ relógio próprio (precisa `tl.seek(frame/fps)`) |
| **CSS `clip-path`/`transform`/`opacity` por frame via `interpolate`** | ✅ (é o que `svgToRemotion` faz) |

## Vídeo IA — frames inicial/final (i2v)

Pra "terminar exatamente numa imagem" (ex: a logo completa):

| Modelo | first_frame | last_frame | áudio | custo |
|---|---|---|---|---|
| **veo31** | ✅ (`imageMode:'frames'`, `refs[0]`) | ✅ (`refs[1]`) | ✅ nativo | CARO ~$0.40/s |
| **grokImagineVideo** | ✅ (`refs[0]`) | ❌ **não tem last** | ❌ | barato ~$0.07/s |

- Só o **veo** fixa o frame final → use a logo como `refs[1]` e um frame inicial editado como `refs[0]`.
- veo só aceita ratio **16:9 / 9:16** (1:1 dá 400) → emoldure frames quadrados num canvas 16:9 preto antes.
- Frame inicial "reduzido" (ex: só o caminhão) → edite a logo com `gemini25Flash` (i2i, remove o resto).

## Pegando um SVG limpo pra animar

`recraftV41ProVector` (i2i com a logo PNG/ref) → SVG real com `<path>` de verdade, escala ∞. É a melhor base pro `svgToGsap`/`svgToLottie` (aterrar com SVG concreto > inventar pontos).
