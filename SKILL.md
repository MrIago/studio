---
name: studio
description: Estúdio de geração de mídia por IA via OpenRouter — gera e edita IMAGENS (qualidade premium, realismo com pessoas, ícones transparentes, logos SVG, paleta de marca, 65 estilos artísticos), compõe cenas fiéis com personagens/famosos a partir de fotos de referência, narração de VOZ (30 vozes com emoção inline e diálogo multi-personagem), MÚSICA instrumental, e CRIA VÍDEO programático com Remotion (montando os assets gerados num MP4 — qualquer tipo, escrito sob medida). Cada modelo é uma caixa selada com opções completas e há um guia "qual modelo usar" por caso (qualidade vs rápido/barato, custo, velocidade). Use sempre que o usuário quiser gerar/editar imagem, criar ícone/logo/asset, fazer um post, compor uma cena com pessoa específica, gerar narração/trilha sonora, contar uma história com vozes, ou criar/montar um vídeo (demo, reels, carrossel animado, intro pra README) — mesmo que não diga "OpenRouter" ou "Remotion".
license: MIT
metadata:
  author: mriago
  version: 0.2.0
---

# studio

Estúdio de **geração de mídia por IA** operado por linguagem natural. Gera e
edita imagem, voz, música **e vídeo** via OpenRouter — cada modelo numa **caixa
selada** (`scripts/models/`) com opções completas, escolhido por um mapa "qual
usar" testado na prática. Também **anima SVG** (Lottie traço / GSAP preenchido),
**CRIA vídeo** (Remotion, programático) montando os assets, e tem utilitários
locais sem custo (ex: tirar fundo de logo).

## CRIAR vídeo (Remotion) vs GERAR vídeo (IA)

Quando o usuário pedir um **vídeo**, distinga:
- **CRIAR** = Remotion (vídeo programático em React) — você escreve o código do
  vídeo **sob medida** e monta os assets da studio (imagem/voz/música) num MP4.
  Qualquer tipo de vídeo. → leia `references/criar-video.md`.
- **GERAR** = IA (prompt→vídeo, ou imagem→vídeo via first_frame). Implementado:
  `veo31` (qualidade + ÁUDIO nativo, caro, first+last frame) e `grokImagineVideo`
  (rápido/barato, sem áudio, só first_frame). Protocolo ASSÍNCRONO
  (submit→poll→download) em `scripts/lib/video.mjs` — a chamada bloqueia até o
  vídeo ficar pronto (minutos). i2v: passe `refs` (1ª imagem = first_frame).

## Animar logo/SVG (Lottie traço vs GSAP preenchido)

Pedido de **logo se montando / reveal animado**? Decisão testada (detalhe em
`references/svg-animation.md`):
- **traço se desenhando** (line-art) → `svgToLottie` (Lottie `stroke`+`trim`). `.json` portável.
- **preenchido, estilo original** (sólido se montando) → `svgToGsap` (GSAP `clip-path` wipe).
  ⚠️ Lottie NÃO faz filled draw-on bem (trim só desenha traço; preenchido exige
  track-matte frágil que quebra no renderer). Pra preenchido use GSAP.
- base ideal pros dois: um SVG real de `recraftV41ProVector`.

## Configuração / primeiro uso

**ANTES de gerar qualquer coisa, garanta que a chave existe.** Se o usuário acabou
de instalar, ou se uma geração falhar por falta de key, rode o setup (mostra o que
falta e como resolver):

```bash
node ${CLAUDE_SKILL_DIR}/scripts/setup.mjs                          # vê o status
node ${CLAUDE_SKILL_DIR}/scripts/setup.mjs OPENROUTER_KEY=sk-or-... # salva a chave
```

Chaves (em `~/.config/studio/.env`, privado):
- **`OPENROUTER_KEY`** (obrigatória) — imagem, música. Pegue em openrouter.ai/keys.
- **`GEMINI_API_KEY`** (voz) — narração + diálogo multi-personagem. aistudio.google.com/apikey.
- **`GROQ_API_KEY`** (vídeo) — transcrição p/ sincronizar narração. console.groq.com/keys (grátis).

Quando o usuário pedir algo e faltar a chave, NÃO falhe silenciosamente — rode
`setup.mjs` e mostre a ele o que configurar. Nunca commite chave. Custo:
`usage.cost × 100` = créditos (1cr = 1¢ USD). Detalhe em `references/secrets.md`.

## Regra de PROMPT (importante)

1. **Enriqueça por padrão quando o pedido for vago.** "Uma música lofi" / "um
   ícone de engrenagem" → expanda num prompt rico e descritivo, e **mostre o
   prompt final** que vai usar.
2. **Respeite quando o usuário já detalhou.** Prompt completo → use quase como veio.
3. **Confirme antes em casos críticos** (regra de ouro): rosto de pessoa real,
   marca, ou estilo específico → peça as fotos de referência / confirme o estilo.
4. **Sempre mostre o resultado + ofereça "refaz mudando X".** Imagem é barata
   (~4cr) e rápida — iterar é o fluxo natural. Padrão: gera no modelo recomendado,
   mostra, ajusta se o usuário pedir.

### Fluxo para MÚLTIPLAS imagens (carrossel/lote) — planejar antes, gerar em paralelo

Nunca gere → descubra que falta uma ref → regere (cada gpt-5.4 leva ~150-190s;
rodadas repetidas desperdiçam minutos). Ordem certa:
1. **Planeje** todas as imagens (quantas, o que cada uma mostra, a narrativa).
2. **Colete TODAS as referências ANTES** (peça os links ao usuário — um por vez,
   regra de ouro 3 — e baixe todas as fotos).
3. **Monte o prompt completo de cada imagem** + defina quais refs entram em cada.
4. **Só então gere — TODAS em paralelo numa única rodada** (`Promise.all` no script).
   O paralelismo funciona: N imagens via Promise.all levam ≈ o tempo da mais lenta,
   não a soma. Uma rodada planejada >> várias rodadas de tentativa-e-erro.

## Qual modelo usar (resumo — detalhe em `references/qual-usar.md`)

**Filosofia: gpt-5.4-image-2 é o padrão no-brainer.** Mais confiável em qualidade.
Os outros são fallback (mais baratos/rápidos) quando o caso permite ou o gpt recusa.
⚠️ Trade-off: gpt-5.4 é o MAIS LENTO (~150s); rápidos (~3-9s) = recraft-v3/grok/
seedream/gemini. Veja velocidade em `references/velocidade.md`.

| Caso | Modelo | Helper |
|---|---|---|
| Imagem que importa (qualidade/precisão/pessoas) | gpt-5.4-image-2 | `gpt54Image2` |
| Imagem barata (detalhe não importa) | seedream-4.5 | `seedream45` |
| Rápido+barato com estilo da lista (Pixel art/Clay) | recraft-v3 | `recraftV3` |
| Rápido+barato sem estilo específico | grok-imagine | `grokImagine` |
| Editar (detalhe/rosto real) | gpt-5.4 + fotos reais | `gpt54Image2` |
| Editar rápido/simples (bokeh/cor/fundo) | gemini-2.5 / seedream | `gemini25Flash` |
| Compor / personagem/famoso FIEL | ref real → gpt-5.4 compõe | `gpt54Image2` |
| Gerar personagem copyright do zero (gpt recusa) | seedream / recraft-v3 | `seedream45` |
| Ícone transparente pra asset/slide | gpt-5-image-mini ("flat vector style") | `gpt5ImageMini` |
| Transformar imagem/PNG em SVG (vetorizar) · SVG real escala ∞ | recraft-v4.1-pro-vector (i2i; recipe+theme em `references/svg-animation.md`) | `recraftV41ProVector` |
| Animar SVG em TRAÇO (logo/loader/data-viz line-art) | Lottie (escrito à mão) | `lottie` / `svgToLottie` |
| Animar SVG PREENCHIDO (logo estilo original se montando) | GSAP (clip-path wipe, browser/app) | `svgToGsap` |
| Tirar fundo sólido de logo/ícone (LOCAL, sem IA/custo) | bg-remove (flood fill) | `bgRemove` |
| Fundo c/ paleta da marca + 65 styles | recraft-v3 | `recraftV3` |
| Narração / voz | gemini-tts (30 vozes + tags de emoção inline) | `geminiTts` |
| Diálogo / história com personagens | gemini-tts multi-voz | `geminiDialog` / `manyVoices` |
| Música instrumental | lyria-3 (clip ~31s loop / pro ~2,6min trilha) | `lyria3` |
| GERAR vídeo c/ qualidade + áudio (caro) | veo-3.1 (~$0.40/s; first+last frame) | `veo31` |
| GERAR vídeo rápido/barato (sem áudio) | grok-imagine-video (720p 5s≈35cr) | `grokImagineVideo` |
| Transcrição (timestamps) | Groq whisper (grátis, sem GPU) | `transcribe` |

**🎬 Lottie vs SVG vs vídeo (como decidir)**: *anima?* não → SVG estático
(`recraftV41ProVector`) ou PNG (`gpt5ImageMini`). sim, **single-scene curto** p/
web/app ou **camada** de vídeo → **Lottie** (`lottie`, ou `svgToLottie` p/ animar um
SVG). sim, **vídeo multi-shot com áudio** → **Remotion** (`criar-video.md`). O Lottie
você ESCREVE (não é API) — ver `references/lottie.md`.

**🎙️ Narração (gemini-tts)**: (1) **PADRÃO = automático** — mande o texto fluido
(vírgulas leves, ponto final só onde o assunto vira; sem travessões/frases curtas à
toa) e a voz adapta o tom sozinha. (2) **emoção por trecho = tags inline** no meio
do texto: `[excited]`/`[whispers]`/`[laughs]`/`[serious]`/... — funciona num request
só (diferente do SSML, que não dá). (3) **história/diálogo com personagens** →
`geminiDialog` (2 vozes num request, precisa `GEMINI_API_KEY`) ou `manyVoices`
(3+ personagens → 1 áudio por fala, encadeia). Cada personagem sua voz (das 30) +
suas tags. Pra sincronizar com vídeo, transcreva com `transcribe()` → `[{start,end,text}]`.

## 3 padrões de ouro

1. **Personagem/pessoa FIEL** → baixar/pedir as fotos reais → **gpt-5.4 compõe**.
   O gpt RECUSA "gere o Mickey/Pikachu/famoso do zero", mas ACEITA compor a partir
   de imagens fornecidas — e é o mais fiel.
2. **Editar identidade de pessoa real** → SEMPRE mandar as fotos reais dela junto
   (a imagem a editar + N refs do rosto). Nunca editar só a imagem gerada.
3. **Foto externa real (pessoa/personagem/time/lugar/documento)** → NUNCA busque
   você mesmo nem pergunte "quer que eu busque" (é lento e traz foto errada).
   Mande ao usuário o **link do Google Imagens já com o termo pesquisado**:
   `https://www.google.com/search?udm=2&q=<termo+url+encoded>` (`udm=2` = aba Imagens).
   - **Peça UMA referência por vez** (time → depois carta → depois estádio), não tudo junto.
   - **Aceite MÚLTIPLAS fotos da mesma coisa** (vários ângulos). O usuário não escolhe
     "a melhor" — manda quantas quiser; você passa TODAS como `refs` pro gpt-5.4. Com
     vários ângulos a IA entende melhor o objeto/pessoa e **compõe a imagem nova que
     você quer** (pose/estilo/layout específico — ex: foto antiga num slide brutalista)
     **mantendo a consistência das pessoas/coisa reais**, mesmo que essa foto exata não exista.

## Como chamar (caixas seladas)

Cada modelo é um `.mjs` em `scripts/models/` com opções completas. Importe do
`index.mjs` ou rode via CLI. Exemplos:

```js
import { gpt54Image2, seedream45, gpt5ImageMini, recraftV3, recraftV41ProVector,
         geminiTts, geminiDialog, manyVoices, lyria3,
         veo31, grokImagineVideo, svgToGsap, bgRemove } from './scripts/models/index.mjs';
import { save } from './scripts/lib/or.mjs';
import { saveAudio } from './scripts/lib/audio.mjs';
import { saveVideo } from './scripts/lib/video.mjs';
import { saveGsap } from './scripts/lib/svg-gsap.mjs';

// imagem premium
save(await gpt54Image2({ prompt: 'a premium product photo of...', imageSize: '1K' }), 'out');

// ícone transparente pra slide (PNG flat — o padrão de ícone)
save(await gpt5ImageMini({ prompt: 'a gear icon, flat minimal vector style, like an SVG icon', transparent: true }), 'icon');

// editar/compor com refs reais (rosto fiel) — refs = [{bytes, mimeType}]
save(await gpt54Image2({ prompt: 'componha estes no cenário X', refs }), 'cena');

// gerar personagem copyright do zero (gpt recusa)
save(await seedream45({ prompt: 'Bart Simpson giving a thumbs up' }), 'bart');

// narração: automático + tags de emoção inline (PT-BR)
saveAudio(await geminiTts({ input: '[excited] Bem-vindo ao studio! [whispers] o melhor estúdio.', voice: 'Sulafat' }), 'vo');

// diálogo de 2 personagens (vozes distintas + emoção) — precisa GEMINI_API_KEY
saveAudio(await geminiDialog({ speakers: [{ speaker: 'Ana', voice: 'Leda' }, { speaker: 'Rex', voice: 'Algenib' }],
  script: 'Ana: [happy] Viu o que criei?\nRex: [amazed] Ficou incrível!' }), 'dialogo');

// 3+ personagens → 1 áudio por fala (encadear no vídeo)
const falas = await manyVoices([{ voice: 'Fenrir', text: '[shouting] Ao ataque!' }, { voice: 'Sulafat', text: '[warm] Calma.' }]);

// música (pro = início/meio/fim; clip = loop curto)
const m = await lyria3({ prompt: 'upbeat lofi, instrumental, no vocals', version: 'pro' });

// GERAR vídeo por IA — ASYNC (bloqueia até ficar pronto, minutos). refs[0]=first_frame (i2v)
saveVideo(await grokImagineVideo({ prompt: 'logo zooms in, soft glow', duration: 5, refs }), 'video');
saveVideo(await veo31({ prompt: 'cinematic reveal', duration: 8, generateAudio: true,
  imageMode: 'frames', refs: [first, logo] }), 'video-hq'); // first+last frame: termina na logo

// animar SVG PREENCHIDO (browser/app) — clip-path wipe; parts agrupa <path> por índice
saveGsap(svgToGsap(svgText, { parts: [
  { name:'truck', paths:[1,2,3], in:'slide-left', at:0, dur:0.9 },
  { name:'e', paths:[0], in:'wipe-down', at:0.85, dur:1.1 },   // desenha o preenchido de cima→baixo
]}), 'logo-anim', { open: true });

// tirar fundo sólido de logo/ícone — LOCAL, sem custo, instantâneo (flood fill das bordas)
save(bgRemove({ input: '/caminho/logo.png' }), 'logo-sem-fundo');
```

CLI rápido: `node scripts/models/<modelo>.mjs "prompt"` (gera e abre a pasta).

## Onde salva (por PROJETO) + visualizar

Tudo que a studio gera (imagem, ícone, post, áudio, vídeo) vai pra
**`~/studio/<projeto>/`** — um lugar só, organizado por projeto. **No começo de
uma geração, defina o nome do projeto pelo pedido** (descritivo: `carrossel-vasco`,
`icones-app`, `post-natal`) via env `STUDIO_PROJECT`. Mesma conversa reusa o mesmo;
pedido novo/diferente = projeto novo.

```bash
# defina UMA vez por geração (no comando que roda o script .mjs):
STUDIO_PROJECT="carrossel-vasco" node gerar.mjs
```

`save(name)`/`saveAudio(name)` resolvem:
- **só um nome** (`'slide-1'`) → `~/studio/<STUDIO_PROJECT>/slide-1.png`
- **"projeto/arquivo"** (`'icones-app/rocket'`) → `~/studio/icones-app/rocket.png`
- **caminho explícito** (absoluto, `/tmp`) → respeitado

`{ open: true }` abre a pasta ao salvar (multi-OS). Em LOTES, não ponha em cada
save — chame `openOutput(dir)` UMA vez no fim. Override da raiz: env `STUDIO_HOME`.

```js
import { save, openOutput } from './scripts/lib/or.mjs';
const dir = save(await gpt54Image2({ prompt }), 'slide-1');   // ~/studio/<projeto>/slide-1.png
save(await gpt54Image2({ prompt: p2 }), 'slide-2');
openOutput(dir);                                              // abre a pasta uma vez
```

**Vídeo**: a engine Remotion vive separada em `~/.studio-engine/` (oculta, técnica —
você não mexe). `render.mjs` renderiza lá e **copia o MP4 final pro projeto** em
`~/studio/<projeto>/` (onde está todo o resto). Ver `references/criar-video.md`.

## Refs i2i (imagem de referência)

Pra editar/compor, passe `refs: [{ bytes, mimeType }]` (bytes = ArrayBuffer/Buffer
do arquivo). gpt aceita até PDF como ref. Pra pegar foto de pessoa/personagem da
web, PERGUNTE o link ao usuário (regra de ouro 3).

## Leia a reference do passo

- `references/qual-usar.md` — mapa de qual modelo de IMAGEM por caso (qualidade/custo/velocidade); voz/música/Lottie ver tabela acima
- `references/velocidade.md` — ranking de velocidade de geração
- `references/recraft-estilos.md` — 65 estilos do recraft-v3 + capacidades de paleta
- `references/secrets.md` — configurar a chave OpenRouter
- `references/lottie.md` — **Lottie** (animação vetorial leve): regras Skottie, builders, conversor SVG, render
- `references/svg-animation.md` — **animar logo/SVG**: Lottie traço vs GSAP preenchido, track-matte (por que evitar), GSAP no Remotion (shim), vídeo IA frames (veo/grok)
- `references/criar-video.md` — **CRIAR vídeo (Remotion)**: fluxo, regras de ouro, integração com os assets
- `references/motion-design.md` — vocabulário de motion design PRO (técnicas dos 21 prompts oficiais)
- `references/remotion-official/` — doc oficial completa do Remotion (37 regras; comece pelo `SKILL.md`)
- `references/remotion-gotchas.md` — armadilhas do Remotion que custaram tempo
- `video/examples/showcase/` — 21 prompts oficiais por categoria (inspiração, NÃO template)

## Scripts

- `scripts/models/*.mjs` — caixas seladas: imagem + voz/gemini-tts + música/lyria-3 + **vídeo IA** (`veo-3-1`, `grok-imagine-video`) + `bg-remove` (LOCAL, sem IA); index.mjs também reexporta transcrição, Lottie (`lottie`/`svgToLottie`) e GSAP (`svgToGsap`) de `scripts/lib/`
- `scripts/models/index.mjs` — reexporta tudo + tabela `QUAL_USAR` programática
- `scripts/lib/or.mjs` — plumbing OR (getKey, generateImage, save)
- `scripts/lib/audio.mjs` — plumbing TTS/música (tts, pcmToWav, saveAudio)
- `scripts/lib/video.mjs` — plumbing vídeo IA ASYNC (submitOrVideo, pollOrVideo, runVideo, saveVideo)
- `scripts/lib/svg-gsap.mjs` — SVG→animação GSAP preenchida (svgToGsap, saveGsap); HTML standalone (web/app)
- `scripts/lib/svg-remotion.mjs` — SVG→componente Remotion (svgToRemotion, installRemotionVideo); mesma coreografia em MP4 (dirigido por useCurrentFrame)
- `scripts/lib/lottie.mjs` + `svg-to-lottie.mjs` + `lottie-build.mjs` — Lottie (escrever/validar/salvar + SVG→Lottie traço)
- `scripts/models/bg-remove.mjs` — tira fundo sólido (flood fill, codec PNG próprio, zero dep)
- `scripts/setup.mjs` — **setup / primeiro uso**: status das chaves + configura (`node setup.mjs` ou `setup.mjs OPENROUTER_KEY=...`)
- `scripts/lib/config.mjs` — config raw da chave (usado pelo setup)
- `video/scripts/setup.mjs` — instala a engine Remotion (1x, só p/ vídeo)
- `video/scripts/render.mjs` — render headless de vídeo Remotion (abre o MP4 ao fim)
- `video/examples/` — vídeos prontos de inspiração (não template — construa sob medida)
