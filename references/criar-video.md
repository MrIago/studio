# CRIAR vídeo (Remotion) — escrever cada vídeo sob medida

**CRIAR ≠ GERAR.** *Gerar* vídeo = IA (veo/seedance, prompt→vídeo). *Criar* vídeo
= **Remotion**: vídeo programático em React, onde você (Claude) **escreve o código
de cada vídeo sob medida**. Não há template fixo — qualquer vídeo é possível porque
o componente é escrito na hora pro caso. A studio gera os assets (imagem/voz/música)
e o Remotion os monta num MP4.

## Workspace ÚNICO (1 npm install, fora da skill)

Não se cria um projeto Remotion por vídeo. Há **um workspace só**, em
**`~/.studio-engine/`** (permanente — fica fora da skill pra sobreviver a
`/plugin update`). Todos os vídeos vivem em `src/videos/<nome>/Video.tsx` lá dentro.

- **Setup (1ª vez ou após update da skill)**: `node video/scripts/setup.mjs` —
  idempotente: cria o workspace, sincroniza os componentes/config da skill, e roda
  `npm install` SÓ se o package.json mudou. Não apaga seus vídeos nem node_modules.
- `preview.mjs` e `render.mjs` já chamam o setup sozinhos se preciso e rodam no workspace.

### 🔒 Cada vídeo é ISOLADO e PERMANENTE — nunca sobrescreva outro projeto

- **Código** → `src/videos/<nome>/` (uma pasta por vídeo). **Assets** →
  `public/<nome>/` (isolados — sempre prefixe os assets com a pasta do projeto,
  ex: `staticFile("<nome>/bg.jpg")`). **MP4 final** → `~/studio/<nome>/<nome>.mp4`.
- Vídeo NOVO = **pasta NOVA** (`src/videos/<novo>/` + `public/<novo>/`) + 1 linha no
  `src/Root.tsx` (import + entrada no array). NUNCA reuse a pasta/assets de um vídeo
  existente — senão sobrescreve. Editar um vídeo antigo = abrir o preview e mexer
  no `.tsx` dele (os assets já estão lá, nada se perde).
- Antes de criar assets pra um vídeo novo, confira se a pasta `public/<nome>/` já
  existe (projeto anterior) e escolha outro nome se for um vídeo diferente.

### Blocos de componentes (estilo shadcn) — NÃO uma lib fechada

`~/.studio-engine/src/components/` tem blocos por categoria (backgrounds, text,
hud, audio, 3d, hooks) — **cada componente num arquivo**. Importe só os que a cena
precisa. **Se falta um, CRIE um novo arquivo** — o repertório cresce a cada vídeo.
Nunca pense "só dá pra fazer o que está aqui". Leia `src/components/README.md`.
(O template versionado vive em `video/workspace-template/` na skill; o setup o
espelha pro workspace.)

### shadcn/ui (vídeos que recriam UI)

Pra vídeos de produto/demo que recriam interface (terminal, cards, chat), o shadcn
está disponível. Use a ESTRUTURA dos componentes; anime com `spring`/`interpolate`
(as CSS animations do shadcn NÃO renderizam no Remotion). `npx shadcn@latest add card`.

## A base que torna isso possível

- **Conhecimento Remotion** → `references/remotion-official/` (doc oficial completa,
  37 regras). Comece pelo `SKILL.md` dela; carregue a regra específica quando precisar.
- **Motion design pro** → `references/motion-design.md`: vocabulário de técnicas. Leia
  antes de um vídeo que precisa impressionar — pra não cair em "slide com fade".
- **Blocos prontos** → `~/.studio-engine/src/components/` (importe/crie).
- **Armadilhas** → `references/remotion-gotchas.md`.
- **Assets pela studio** → as caixas de `scripts/models/` geram imagem/voz/música.
- **Render/preview** → `video/scripts/render.mjs` · `video/scripts/preview.mjs`.
- **Inspiração (NÃO template)** → `video/examples/showcase/` (21 prompts oficiais).
  ⚠️ Cada vídeo é ÚNICO — analise paleta, comunicação, conteúdo, formato. Os exemplos
  são pra descobrir o possível e pegar técnicas, nunca clonar.

## Fluxo ao receber um pedido de vídeo

1. **Entenda o vídeo** — formato (16:9 / 9:16 / 1:1), duração aproximada, estilo,
   se tem narração/música. Se vago, proponha um roteiro curto e confirme.
2. **Garanta o workspace**: `node video/scripts/setup.mjs` (rápido se já existe).
   Crie a pasta do vídeo: `~/.studio-engine/src/videos/<nome>/Video.tsx` e
   registre no `src/Root.tsx` (1 import + entrada no array). NÃO crie projeto novo.
3. **Planeje os assets ANTES** (mesma regra de imagem): liste tudo que o vídeo
   precisa — imagens (slides/hero/ícones), narração (por trecho), música. Colete
   referências externas ANTES (peça links ao usuário, um por vez). Gere os assets
   pra `~/.studio-engine/public/` (ou uma subpasta do projeto). Veja SKILL.md.
4. **Gere os assets em paralelo** via as caixas da studio → salve em `public/`.
5. **Escreva as composições** em `src/` (sob medida) usando `useCurrentFrame()` +
   `interpolate()`/`spring()`. Sincronize legendas/cortes com a narração.
6. **Valide com 1 still** (1 frame) que compila e o layout está ok — você lê o PNG:
   `npx remotion still <Comp> --scale=0.5 --frame=30`.
7. **PADRÃO: abra o PREVIEW automaticamente e espere o usuário aprovar.** Assim que
   o vídeo compila, rode `node ${CLAUDE_SKILL_DIR}/video/scripts/preview.mjs` — ele
   abre o **Remotion Studio** em `localhost:3007` E **abre o navegador sozinho** no
   link (multi-OS). O usuário vê o vídeo animado (com áudio), ajusta pedindo
   mudanças; você edita `src/` e o preview faz **hot-reload** (atualiza sozinho, sem
   reabrir). Roda em foreground → o usuário deve rodar com `! …/preview.mjs` na
   sessão dele (pra abrir na máquina dele e não bloquear você).
8. **NÃO renderize até o usuário CONFIRMAR.** O render (MP4) é o último passo, só
   depois do "tá bom, pode renderizar". Aí:
   `node ${CLAUDE_SKILL_DIR}/video/scripts/render.mjs <CompId>` (abre o MP4 ao fim).

**Still vs preview vs render:** *still* = você (Claude) confere que compila/layout;
*preview* (Studio, abre sozinho) = o usuário aprova/ajusta ao vivo — é o gate;
*render* = MP4 final, **só após o OK explícito do usuário**. Nunca pule direto pro
render: o preview é onde o usuário decide.

## Regras de ouro do Remotion (não violar — e por quê)

- **Animação = função do frame** (`useCurrentFrame()` + `interpolate`/`spring`).
  CSS transitions/animations e classes `animate-*`/`transition-*` do Tailwind
  **NÃO renderizam** — cada frame é isolado no servidor; animação por tempo de CSS
  sai parada/quebrada.
- **Assets em `public/`**, referenciados com `staticFile()`. `<Img>` (remotion),
  `<Video>`/`<Audio>` (@remotion/media).
- **Atrasar/limitar** conteúdo: `<Sequence from=… durationInFrames=…>`
  (`layout="none"` pra conteúdo inline).
- **Dimensão/fps/duração** no `src/Root.tsx` (`<Composition>`); duração dinâmica
  por áudio via `calculateMetadata` (ver regra oficial).
- Easing de entrada: `Easing.bezier(0.16, 1, 0.3, 1)`. Overshoot: `(0.34, 1.56, 0.64, 1)`.
- Separe **timing** (quando/quão rápido) de **mapping** (quais valores): faça um
  `progress` 0→1 e derive props dele.

## Narração (gemini-tts) — voz fluida, emoção e personagens

1. **PADRÃO = automático.** Mande o texto fluido numa faixa só (vírgulas leves,
   ponto final só onde o assunto vira; sem travessões (—), reticências (…) ou
   frases curtas separadas à toa — criam silêncio e picotam). A voz adapta o tom
   sozinha. Simples e natural.
2. **Emoção por trecho = TAGS INLINE** no meio do texto: `[excited]`, `[whispers]`,
   `[laughs]`, `[serious]`, `[amazed]`... Funciona numa chamada só (não precisa
   fatiar em blocos como antigamente). Ex: `"[serious] Era uma vez. [excited] Que
   incrível! [whispers] mas era segredo."`
3. **História / diálogo com PERSONAGENS.** Cada personagem = sua voz (das 30) +
   suas tags. `geminiDialog` faz 2 vozes num request (precisa GEMINI_API_KEY);
   `manyVoices` faz 3+ (1 áudio por fala). Escolha vozes contrastantes (ex: vilão
   = Algenib gravelly, herói = Fenrir excitable).
4. **Encadear faixas com RESPIRO — use a duração REAL do arquivo, não o fim da fala.**
   `transcribe()` dá o fim da última FALA (há cauda de silêncio depois); usar isso
   pra posicionar a próxima faixa faz elas se ATROPELAREM. Pegue a duração real do
   áudio (ffprobe / `get-audio-duration`) e some um **gap de ~0.4-0.5s**:
   `from(N+1) = from(N) + duracaoReal(N) + GAP`. Senão o fim de uma come o início da outra.

Fluxo: **escreva o texto completo → marque emoções com tags onde fizer sentido →
gere (automático + tags numa faixa; ou multi-voz se tem personagens).**

## 🎯 WORKFLOW OBRIGATÓRIO p/ vídeo com narração (nunca pule isto)

Vídeo com voz over **DESALINHA** se você chutar os tempos das cenas. A regra de
ferro, comprovada na prática:

1. **Gere a narração** (uma faixa por bloco, gemini-tts) e **TRANSCREVA cada uma**
   com `transcribe()` → salve os `segments.json`. Você terá `[{start,end,text}]`.
2. **Cada cena usa o timestamp REAL** da frase que ela ilustra — nunca um número
   inventado. Ex: a narração diz "o GPT usa" em `[12.0→18.2]` → a cena do gpt-5.4
   é `from:12, dur:7`. A cena aparece QUANDO a voz a menciona.
3. **CONSTRUA BLOCO A BLOCO.** Faça SÓ a abertura → renderize → valide (transcreva
   o áudio do bloco e confira que casa) → mostre ao usuário → aprovado, próximo
   bloco. NUNCA tente o vídeo inteiro de uma vez: erros de sync viram um caos
   impossível de depurar. Um bloco certo de cada vez.
4. **Valide o áudio de cada bloco renderizando + transcrevendo** — se a transcrição
   do render bate com o roteiro (sem sobreposição), está certo. O preview pode
   ENGANAR (timeline mostra faixas empilhadas mesmo quando o render está correto);
   a verdade é o MP4 renderizado.
5. **Áudio que não respeita Sequence?** Use `<Audio>` do core `remotion`, NUNCA do
   `@remotion/media` (esse ignora o `from` do Sequence → toca tudo no frame 0).
6. **Amostras de áudio (vozes/idiomas tocando)**: uma por vez, `at` espaçado MAIOR
   que a duração de cada áudio, e `durationInFrames` na Sequence cortando antes do
   próximo. E nunca toque amostra POR CIMA da narração — amostras só depois que a
   narração daquele trecho terminou.

### A caixa de STT

`scripts/lib/transcribe.mjs` → `[{start, end, text}]` (segundos). Usa **Groq**
(grátis ~8h/dia, sem GPU; `GROQ_API_KEY` em console.groq.com/keys). É só pra
TIMESTAMPS; erros de grafia ("Cloud Code") não afetam o áudio.

```js
import { transcribe, formatTranscript } from '../scripts/lib/transcribe.mjs';
const segs = await transcribe('public/<proj>/narr-1.wav'); // [{start,end,text}]
// segs[i].start/end → from/dur de cada <Sequence>
```

## Integração com as caixas seladas (assets)

As mesmas caixas de `scripts/models/` (ver SKILL.md). Gere os assets pra `public/`:

```js
import { gpt54Image2, gpt5ImageMini, recraftV41ProVector,
         maiVoice2, lyria3 } from '../scripts/models/index.mjs';
import { save } from '../scripts/lib/or.mjs';
import { saveAudio } from '../scripts/lib/audio.mjs';

// slide/hero (qualidade) → public/
save(await gpt54Image2({ prompt: '...', aspectRatio: '9:16' }), 'public/slide-1');
// ícone transparente de overlay → public/
save(await gpt5ImageMini({ prompt: 'bell icon, flat vector, like SVG', transparent: true }), 'public/icon');
// narração por trecho → public/ (sincroniza legenda com isso)
saveAudio(await maiVoice2({ input: 'Bem-vindo...', voice: 'pt-BR-Luana:MAI-Voice-2' }), 'public/vo-1');
// música de fundo (pro = início/meio/fim; clip = loop) → public/
const m = await lyria3({ prompt: 'upbeat lofi, instrumental, no vocals', version: 'pro' });
```

Duração do vídeo segue a narração: pegue a duração do áudio (ver
`remotion-official/rules/get-audio-duration.md`) e dirija `durationInFrames`.

## Stack mínima de um projeto

`src/Root.tsx` (registra `<Composition>`) · `src/<Video>.tsx` (a composição que
você escreve) · `public/` (assets) · `package.json` (remotion + @remotion/media).
O `render.mjs` faz bundle + render headless + abre o MP4.

## Quando aprofundar

Carregue a regra oficial específica conforme o vídeo pede — não leia todas de
uma vez. Índice em `references/remotion-official/SKILL.md`. As mais usadas:
`video-layout.md` (layout/tamanho de texto), `transitions.md`, `text-animations.md`,
`audio.md`, `subtitles.md`/`display-captions.md`, `effects.md`, `calculate-metadata.md`.
