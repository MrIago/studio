# Lottie — animação vetorial leve (escrita à mão)

Lottie (Bodymovin JSON) é animação **vetorial**: leve (KB), escala ∞, roda em
web/app/qualquer player Lottie. Na studio o **gerador é o próprio Claude** — você
ESCREVE o JSON (ou usa os builders/conversor). A caixa `lottie` só valida + salva.

**2 usos:** (A) o `.json` é o entregável pra site/app; (B) vira camada `<Lottie>`
num vídeo Remotion (bloco `components/lottie/LottieLayer.tsx`).

**Crédito:** regras Skottie e prompt guide **condensados de**
[diffusionstudio/lottie](https://github.com/diffusionstudio/lottie) (MIT,
`npx skills add diffusionstudio/lottie`) + a
[motion-design-skill da LottieFiles](https://github.com/lottiefiles/motion-design-skill)
(craft de timing/easing — guidance em ms; converta `frames = ms/1000*fr`).

## Quando usar (vs SVG estático vs vídeo)

- **anima?** não → SVG estático (`recraftV41ProVector`) ou PNG (`gpt5ImageMini`).
- sim, **single-scene curto** p/ web/app, ou **camada** de vídeo → **Lottie**.
- sim, **vídeo multi-shot com áudio** → **Remotion** (`criar-video.md`).
- Lottie é SOTA pra: logo/loader animado, micro-animação de UI, **data-viz** animada
  (gráficos, candles), e **animar um SVG** (logo Figma).

## Prompt guide (o que faz um bom Lottie)

1. **Aterre com SVG/dados reais** — converter um SVG concreto ou data-driven dá
   resultado MUITO melhor que inventar pontos (provado: "hello" do SVG real ✓ vs
   path inventado = rabisco). Use `svgToLottie()` p/ SVG; builders p/ dados.
2. **Linguagem de motion design** — ease-in/out (os builders têm `ease.inOut/out/in`).
3. **Pense como câmera** — pan/zoom via group transform (anima `p`/`s` de um layer pai).
4. **Peça os controles** — declare `slots` (sid) pra cor/tamanho editáveis ao vivo.
5. **Especifique FPS e duração** (`fps`/`seconds` no opts, ou `fr`/`op` no doc).

## Anatomia Skottie (o essencial)

Doc top-level: `{ v, fr (fps), ip:0, op (frame final), w, h, assets:[], layers:[] }`.
`applyDefaults()` preenche o ausente; **`op>0` é obrigatório** (senão o render
quebra — `getLottieMetadata→null`).

**Layers** (ordem After Effects — 1º do array = topo; background **por último**).
Cada layer: `{ ty:4 (shape), nm, ip, op, st:0, ks (transform), shapes:[] }`.
Transform `ks`: `o` opacidade(0-100), `r` rotação(°), `p` posição[x,y,z], `a`
anchor, `s` escala(%). Cada prop é `{a:0,k:val}` (estática) ou `{a:1,k:[kf...]}`.

**Gotcha nº1:** todo shape vive num **grupo `ty:"gr"`** cujo `it[]` termina num
**transform `"tr"`**. Lista plana de shapes renderiza BRANCO. `group()`/`drawGroup()`
forçam o `tr` — não esqueça. Primitivos no `it`: `el` ellipse, `rc` rect, `sh`
path (`ks.k`={c,v,i,o} bezier), `fl` fill, `st` stroke, `gs` gradient stroke,
`tm` trim-path (desenha o path).

**Cores são RGBA 0-1** (não 0-255). `rgba()` normaliza. `[1,0,0,1]` = vermelho.

**Keyframes:** `s` é sempre array (mesmo escalar: `[360]`); `i`/`o` são os handles
de ease (x/y em 0-1); o último kf sem handles. Loop = último valor = primeiro.

**Slots (controles ao vivo):** `doc.slots = {meuId:{p:{a:0,k:valor}}}` + a prop usa
`{sid:"meuId"}`. Vira slider/color-picker (no player deles).

## Builders (data-driven) — `scripts/lib/lottie-build.mjs`

```js
import { lottieDoc, shapeLayer, transform, group, drawGroup, rect, ellipse, path,
         fill, stroke, gradStroke, trim, anim, k, ease, rgba, slot, useSlot,
         backgroundLayer } from './scripts/lib/lottie-build.mjs';

const doc = lottieDoc({ fr:60, op:120, w:512, h:512,
  layers: [
    shapeLayer({ nm:'ball', op:120, ks: transform({ p: anim([{t:0,s:[100,256]},{t:60,s:[400,256]}]) }),
      shapes: [ group([ ellipse([0,0],[80,80]), fill(rgba([40,224,200])) ], 'ball') ] }),
    backgroundLayer(512, 512, rgba([8,12,10])),   // SEMPRE por último
  ],
});
```

## Conversor SVG — `scripts/lib/svg-to-lottie.mjs`

```js
import { svgToLottie } from './scripts/lib/svg-to-lottie.mjs';
const doc = svgToLottie(svgText, { gradient:[0,0,0.48,1, 0.5,0.55,0.35,0.96, 1,1,0.45,0.75],
                                   reveal:true, fps:60, seconds:2.5 });
```
⚠️ Pega **TODOS os `<path>`** do SVG (não só o 1º — erro comum). Arco `A` emite
WARNING (não suportado bem — simplifique no editor). Sempre **renderize pra validar
geometria** (o validador não confere o desenho do path).

## Gerar e salvar

```js
import { lottie, saveLottie, validateLottie } from './scripts/models/index.mjs';
saveLottie(doc, 'meu-projeto/logo', { open: true });   // → ~/studio/meu-projeto/logo.json
```
`validateLottie(doc)` → `{ok, errors, warnings}`: ERROR = o que o render quebra;
WARNING = regra Skottie tolerável (lottie-web aceita). O `.json` é o entregável web.

## Render pra MP4/transparente, ou camada de vídeo

- **Standalone (.json → vídeo)**: salve o `.json` com `saveLottie(doc,'<proj>/x')`
  (vai pra `~/studio/<proj>/`) e renderize a composição `lottie-box`:
  ```
  node video/scripts/render.mjs lottie-box <proj> --props='{"file":"<proj>/x.json"}'
  ```
  O render.mjs **copia o `.json` pro public da engine automaticamente** (você não
  toca na engine oculta) e `calculateMetadata` **deriva fps/dims/duração do próprio
  Lottie** — sem `--width/--height/--frames` na mão. → copia o vídeo pro `~/studio/<proj>/`.

  Transparente (overlay): adicione `--image-format=png --pixel-format=yuva444p10le
  --codec=prores --prores-profile=4444` (saída .mov). **Não inclua `backgroundLayer`**
  no Lottie — o retângulo de fundo tampa a transparência. (lottie-box já é transparente.)
- **Camada num vídeo**: importe o bloco numa cena —
  `<LottieLayer src="<proj>/x.json" loop />`.
- **Preview ao vivo**: ponha o `.json` em `~/.studio-engine/public/<proj>/`, abra o
  Remotion Studio (`node video/scripts/preview.mjs`, :3007) e selecione `lottie-box`
  com o inputProp `file` apontando pro seu `.json`.

## ⚠️ Validar SEMPRE no render do Remotion (lottie-web), NÃO no Skottie

Nosso runtime de entrega/render é o **lottie-web** (motor dominante na web). O
player Skottie deles às vezes NÃO renderiza um JSON que o lottie-web renderiza bem
(runtimes divergem). Conformidade Skottie estrita é garantida na ESCRITA (os
builders forçam `gr→tr` e cores 0-1), não por um runtime Skottie — que a engine
não tem e não adicionamos (furaria "1 install"). **Sempre confira o render do
Remotion, não um still do player deles.**
