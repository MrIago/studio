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
edita imagem, voz e música via OpenRouter — cada modelo numa **caixa selada**
(`scripts/models/`) com opções completas, escolhido por um mapa "qual usar"
testado na prática. Também **CRIA vídeo** (Remotion, programático) montando os
assets gerados. (Gerar vídeo por IA — veo/seedance — entra em versão futura.)

## CRIAR vídeo (Remotion) vs GERAR vídeo (IA)

Quando o usuário pedir um **vídeo**, distinga:
- **CRIAR** = Remotion (vídeo programático em React) — você escreve o código do
  vídeo **sob medida** e monta os assets da studio (imagem/voz/música) num MP4.
  Qualquer tipo de vídeo. **É o que a skill faz hoje.** → leia `references/criar-video.md`.
- **GERAR** = IA (prompt→vídeo via veo/seedance) — ainda NÃO implementado aqui.
  Se pedirem isso, avise que é versão futura (ou use a skill `openrouter-video`).

## Configuração (chave OpenRouter)

Precisa de uma chave OpenRouter. O usuário fornece. Leia `references/secrets.md`.
Resumo: `node ${CLAUDE_SKILL_DIR}/scripts/lib/config.mjs OPENROUTER_KEY=sk-or-...`
(salva em `~/.config/studio/.env`), ou exporte `OPENROUTER_KEY` no ambiente.
Nunca commite a chave. Custo: `usage.cost × 100` = créditos (1cr = 1¢ USD).

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
| SVG vetorial real (escala favicon→outdoor) | recraft-v4.1-pro-vector | `recraftV41ProVector` |
| Fundo c/ paleta da marca + 65 styles | recraft-v3 | `recraftV3` |
| Narração / voz | gemini-tts (30 vozes + tags de emoção inline) | `geminiTts` |
| Diálogo / história com personagens | gemini-tts multi-voz | `geminiDialog` / `manyVoices` |
| Música instrumental | lyria-3 (clip ~31s loop / pro ~2,6min trilha) | `lyria3` |
| Transcrição (timestamps) | Groq whisper (grátis, sem GPU) | `transcribe` |

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
         geminiTts, geminiDialog, manyVoices, lyria3 } from './scripts/models/index.mjs';
import { save } from './scripts/lib/or.mjs';
import { saveAudio } from './scripts/lib/audio.mjs';

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

- `references/qual-usar.md` — mapa completo de qual modelo por caso (qualidade/custo/velocidade)
- `references/velocidade.md` — ranking de velocidade de geração
- `references/recraft-estilos.md` — 65 estilos do recraft-v3 + capacidades de paleta
- `references/secrets.md` — configurar a chave OpenRouter
- `references/criar-video.md` — **CRIAR vídeo (Remotion)**: fluxo, regras de ouro, integração com os assets
- `references/motion-design.md` — vocabulário de motion design PRO (técnicas dos 21 prompts oficiais)
- `references/remotion-official/` — doc oficial completa do Remotion (37 regras; comece pelo `SKILL.md`)
- `references/remotion-gotchas.md` — armadilhas do Remotion que custaram tempo
- `video/examples/showcase/` — 21 prompts oficiais por categoria (inspiração, NÃO template)

## Scripts

- `scripts/models/*.mjs` — 9 caixas seladas (7 imagem + voz + música)
- `scripts/models/index.mjs` — reexporta tudo + tabela `QUAL_USAR` programática
- `scripts/lib/or.mjs` — plumbing OR (getKey, generateImage, save)
- `scripts/lib/audio.mjs` — plumbing TTS/música (tts, pcmToWav, saveAudio)
- `scripts/lib/config.mjs` — config da chave (`node config.mjs OPENROUTER_KEY=...`)
- `video/scripts/render.mjs` — render headless de vídeo Remotion (abre o MP4 ao fim)
- `video/examples/` — vídeos prontos de inspiração (não template — construa sob medida)
