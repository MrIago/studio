---
name: studio
description: Estúdio de geração de mídia por IA via OpenRouter — gera e edita IMAGENS (qualidade premium, realismo com pessoas, ícones transparentes, logos SVG, paleta de marca, 65 estilos artísticos), compõe cenas fiéis com personagens/famosos a partir de fotos de referência, narração de VOZ (46 vozes em 18 idiomas com estilos expressivos e PT-BR) e MÚSICA instrumental. Cada modelo é uma caixa selada com opções completas e há um guia "qual modelo usar" por caso (qualidade vs rápido/barato, custo, velocidade). Use sempre que o usuário quiser gerar/editar imagem, criar ícone/logo/asset, fazer um post, compor uma cena com pessoa específica, gerar narração ou trilha sonora — mesmo que não diga "OpenRouter".
license: MIT
metadata:
  author: mriago
  version: 0.1.0
---

# studio

Estúdio de **geração de mídia por IA** operado por linguagem natural. Gera e
edita imagem, voz e música via OpenRouter — cada modelo numa **caixa selada**
(`scripts/models/`) com opções completas, escolhido por um mapa "qual usar"
testado na prática. (Vídeo IA e auto-editor entram em versões futuras.)

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
| Narração / voz | mai-voice-2 (46 vozes/18 idiomas + estilos) | `maiVoice2` |
| Música instrumental | lyria-3 (clip ~31s loop / pro ~2,6min trilha) | `lyria3` |

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
import { gpt54Image2, seedream45, gpt5ImageMini, recraftV3,
         recraftV41ProVector, maiVoice2, lyria3 } from './scripts/models/index.mjs';
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

// narração com voz PT-BR + estilo
saveAudio(await maiVoice2({ input: 'Bem-vindo!', voice: 'pt-BR-Luana:MAI-Voice-2', style: 'excited' }), 'vo');

// música (pro = início/meio/fim; clip = loop curto)
const m = await lyria3({ prompt: 'upbeat lofi, instrumental, no vocals', version: 'pro' });
```

CLI rápido: `node scripts/models/<modelo>.mjs "prompt"` (gera em /tmp).

## Refs i2i (imagem de referência)

Pra editar/compor, passe `refs: [{ bytes, mimeType }]` (bytes = ArrayBuffer/Buffer
do arquivo). gpt aceita até PDF como ref. Pra pegar foto de pessoa/personagem da
web, PERGUNTE o link ao usuário (regra de ouro 3).

## Leia a reference do passo

- `references/qual-usar.md` — mapa completo de qual modelo por caso (qualidade/custo/velocidade)
- `references/velocidade.md` — ranking de velocidade de geração
- `references/recraft-estilos.md` — 65 estilos do recraft-v3 + capacidades de paleta
- `references/secrets.md` — configurar a chave OpenRouter

## Scripts

- `scripts/models/*.mjs` — 9 caixas seladas (7 imagem + voz + música)
- `scripts/models/index.mjs` — reexporta tudo + tabela `QUAL_USAR` programática
- `scripts/lib/or.mjs` — plumbing OR (getKey, generateImage, save)
- `scripts/lib/audio.mjs` — plumbing TTS/música (tts, pcmToWav, saveAudio)
- `scripts/lib/config.mjs` — config da chave (`node config.mjs OPENROUTER_KEY=...`)
