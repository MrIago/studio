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
- Vídeo NOVO = **pasta NOVA** (`src/videos/<novo>/` + `public/<novo>/`). O
  `src/Root.tsx` acha o `Video.tsx` sozinho: não edite o Root. NUNCA reuse a pasta/assets de um vídeo
  existente — senão sobrescreve. Editar um vídeo antigo = abrir o preview e mexer
  no `.tsx` dele (os assets já estão lá, nada se perde).
- Antes de criar assets pra um vídeo novo, confira se a pasta `public/<nome>/` já
  existe (projeto anterior) e escolha outro nome se for um vídeo diferente.

### Blocos de componentes (estilo shadcn) — NÃO uma lib fechada

`~/.studio-engine/src/components/` tem blocos por categoria (backgrounds, text,
hud, audio, ui, lottie, 3d, hooks) — **cada componente num arquivo**. Importe só os
que a cena precisa. **Se falta um, CRIE um novo arquivo.** Nunca pense "só dá pra
fazer o que está aqui". Leia `src/components/README.md`.

⚠️ A engine é um espelho descartável (o setup a regenera do template a cada rodada).
Um bloco que você queira manter no repertório PERMANENTE deve ser criado na fonte
versionada da skill — `video/workspace-template/src/components/<categoria>/` — não só
na engine (lá é efêmero, some no próximo setup).

### shadcn/ui (vídeos que recriam UI)

Pra vídeos de produto/demo que recriam interface (terminal, cards, chat), o shadcn
está disponível. Use a ESTRUTURA dos componentes; anime com `spring`/`interpolate`
(as CSS animations do shadcn NÃO renderizam no Remotion). `npx shadcn@latest add card`.

## A base que torna isso possível

- **Conhecimento Remotion** → `references/remotion-official/` (doc oficial completa,
  37 regras). Comece pelo `SKILL.md` dela; carregue a regra específica quando precisar.
- **Motion design pro** → `references/motion-design.md`: vocabulário de técnicas. Leia
  antes de um vídeo que precisa impressionar — pra não cair em "slide com fade".
- **Profundidade a partir de imagem parada** → `references/animacao-em-camadas.md`
  (camadas, paralaxe, personagem articulado, transições; serve para papel recortado).
- **Série para redes sociais** → `references/serie-redes-sociais.md` (kit, roteiro de
  short, formatos por plataforma, produção em lote, esteira de produção). O que postar, a
  chamada de cada plataforma, publicar por API e medir ficam na skill `growth`.
- **Explicativo desenhado à mão** → `references/quadro-desenhado.md` (traço do Excalidraw
  que se desenha com a voz, câmera num mundo só, telas reais do app dentro do quadro; código
  em `video/examples/quadro-desenhado/`).
- **Gravar as telas de um app** → `references/gravar-telas.md` (Chrome headless por CDP,
  cursor desenhado, marcas nos eventos, conversa com agente, limpeza).
- **Blocos prontos** → `~/.studio-engine/src/components/` (importe/crie).
- **Armadilhas** → `references/remotion-gotchas.md`.
- **Assets pela studio** → as caixas de `scripts/models/` geram imagem/voz/música.
- **Render/preview** → `video/scripts/render.mjs` · `video/scripts/preview.mjs`.
- **Inspiração (NÃO template)** → `video/examples/showcase/` (21 prompts oficiais).
  ⚠️ Cada vídeo é ÚNICO — analise paleta, comunicação, conteúdo, formato. Os exemplos
  são pra descobrir o possível e pegar técnicas, nunca clonar.

## Antes do código: brief → roteiro → beat table → prancha

O que separa vídeo bom de "slide com fade" se decide antes de abrir o editor
(leia `motion-design.md`, a parte de ofício):

1. **Brief** (pergunte o que faltar, em texto): para quê e para quem, formato e
   duração, marca (cores hex, fontes, logo OFICIAL), referência de *movimento*,
   tom, voz, música, CTA. Escreva `BRIEF.md` no projeto.
2. **Roteiro com gancho**: os 3 primeiros segundos convencem a assistir até o fim
   e funcionam sem som; corpo; pagamento que fecha o gancho; CTA. Nada de número
   inventado.
3. **Beat table** (`STORYBOARD.md`): por beat — tempo, fala, a ideia única, o que
   aparece (o maior = o ponto), o movimento e eases, a transição de saída, o som.
4. **Prancha**: renderize 1 still por beat (`npx remotion still … --frame=N`),
   junte numa imagem e LEIA antes de construir o resto. Mostre ao usuário se o
   estilo ainda não foi aprovado.
5. Construa **uma seção, renderize, confira**; o sistema visual provado nela vale
   para as outras. Cenas independentes podem ir para subagentes em paralelo.

**Remotion ou HyperFrames?** A engine da studio é Remotion (React, frame-a-frame,
já instalada). HyperFrames (HeyGen, HTML+GSAP, `npx hyperframes`) é a outra opção
forte: lint/validate com checagem de contraste e mapa de animação; quem compara
costuma achar o "liquid glass" dela mais bonito. Use Remotion por padrão; HyperFrames
quando o usuário pedir ou quando o vídeo for overlay sobre filmagem editada
(ver `editar-video.md`).

## Fluxo ao receber um pedido de vídeo

1. **Entenda o vídeo** — formato (16:9 / 9:16 / 1:1), duração aproximada, estilo,
   se tem narração/música. Faça o brief e a beat table acima.
2. **Garanta o workspace**: `node video/scripts/setup.mjs` (rápido se já existe).
   Crie a pasta do vídeo: `~/.studio-engine/src/videos/<nome>/Video.tsx`, exportando
   `Video`, `ID`, `FPS`, `DURATION` (e `WIDTH`/`HEIGHT` se não for 1920×1080). O
   `src/Root.tsx` acha o arquivo sozinho. NÃO crie projeto novo.
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
- **Dimensão/fps/duração** nos exports do `Video.tsx` (`WIDTH`, `HEIGHT`, `FPS`,
  `DURATION`); duração dinâmica por áudio exportando `calculateMetadata` (ver regra oficial).
- Easing de entrada: `Easing.bezier(0.16, 1, 0.3, 1)`. Overshoot: `(0.34, 1.56, 0.64, 1)`.
- Separe **timing** (quando/quão rápido) de **mapping** (quais valores): faça um
  `progress` 0→1 e derive props dele.

## Construa leve desde o primeiro componente (render rápido)

O render roda pelo processador: cada quadro é a página inteira pintada de novo. O que custa
caro numa página web parada custa caro vezes milhares de quadros. Estas regras vêm de medições
(detalhe e números em `remotion-gotchas.md`) e valem para TODO vídeo novo:

1. **Textura pequena e repetida, nunca grande por peça.** Grão, papel, ruído: ladrilho de
   256-512 px em `<pattern>`/`background-repeat`. Uma textura de 2048 px pintada em cada peça
   deixava o quadro 4× mais lento, e o ladrilho de 512 px saiu idêntico a olho.
2. **Gravações e vídeos com `<Video>` do `@remotion/media`**, nunca `OffthreadVideo`, e no
   tamanho em que aparecem: tela que aparece pequena ou média vai em 720p
   (`scale_cuda` pela NVIDIA, comando em `remotion-gotchas.md`).
3. **Filtro caro só onde aparece:** `drop-shadow`, `blur`, `feTurbulence`/`feDisplacementMap`
   e `mix-blend-mode` em dezenas de elementos somam. Prefira sombra pronta em PNG ou
   `box-shadow` em forma retangular, e ruído pronto em imagem no lugar de `feTurbulence`.
4. **Imagem no tamanho de uso:** foto que aparece com 400 px de largura não precisa de 4000 px.
5. **Meça cedo, não no fim:** assim que a primeira cena existir, renderize 3 segundos dela com
   `--log=verbose` e leia `capture => N ms`. Acima de ~300 ms por quadro em 1080p, ache o culpado
   antes de fazer as outras cenas: renderize o mesmo trecho desligando uma coisa por vez.
6. **Render final:** Remotion atualizado, `--gl=angle-egl --concurrency=4
   --hardware-acceleration=if-possible --video-bitrate=8M`, e prancha procurando pedaço repetido.

## Escolha da voz

- **Narração sem emoção é reprovada** (Iago, 22/10/2026, vídeo explicativo fofo:
  OpenAI marin soou "extremamente desanimada"). Padrão para explicativo animado:
  **Gemini 3.8 Flash TTS via OpenRouter** (`google/gemini-3.8-flash-tts`) com **tags
  de emoção no texto** (`[excited]`, `[happy]`) + `instructions` de narradora animada.
  Vozes femininas com energia: Laomedeia (upbeat), Zephyr, Autonoe, Leda.
- Sem poder ouvir, escolha entre opções pela **variação de entonação**: desvio-padrão
  do F0 em semitons (a mais animada tem o maior) + transcrição limpa. Laomedeia deu
  sd ~4 st contra ~3 st das outras.
- Saldo: se a OR responder 402, avise o Iago na hora (ele recarrega); não troque por
  uma voz pior em silêncio.
- **PT-BR com sotaque nativo** → `speech({ input, pick: 'ptbr' })` = MAI-Voice 2.1
  (Microsoft) com voz `pt-BR-Rafael` (ou Caio/Pedro/Luana/Harper). São as únicas
  vozes nativas pt-BR do catálogo da OR.
- **Mais expressiva / tags de entrega** → `pick: 'expressiva'` (ElevenLabs v4).
- **Emoção inline barata / personagens** → gemini (seção abaixo).
- Gere 2-3 amostras da 1ª fala e deixe o usuário escolher: naturalidade você não
  mede. Escreva números por extenso quando a leitura importar ("vinte por cento").
- Nivele a loudness de cada fala igual (não escale a fala inteira pelo pico).
- Re-transcreva a narração gerada e compare com o roteiro antes de montar.

## Sincronia com a narração (palavra, não frase)

`transcribeWords(arquivo, { language: 'pt' })` → `{ words:[{text,start,end}] }`.
Pouse cada elemento na palavra que ele ilustra, entrando **0,15-0,25s antes** do
início da palavra (o quadro de pouso coincide com a fala). Nunca divida uma seção
em beats iguais. Revelação que leva `d` segundos começa em `palavra.start − d`.
Tela parada por mais de ~1,5s sem nada acontecer = tela morta (audite).

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

## Som e mix

- Música: cama 14-20 dB sob a voz (ducking sob a fala), sai antes do CTA. Em
  Remotion: `volume` da música baixo (~0,12-0,18) e confira medindo.
- Efeitos: poucos, cada um preso a algo visível (tap macio quando algo pousa,
  click seco em UI, ar em movimento real). Nada de laser/zap/whoosh em todo corte.
  Comece o arquivo antes do quadro de contato pelo tempo de ataque dele.
- Master final: −14 a −16 LUFS, true peak ≤ −1 dBTP. Meça o MP4:
  `node video/scripts/qa.mjs loud out.mp4`. Se baixo, normalize com
  `ffmpeg -i in.mp4 -c:v copy -af loudnorm=I=-15:TP=-1.5:LRA=11 out.mp4`.

## Checagem do render (obrigatória antes de mostrar)

`node video/scripts/qa.mjs sheet|strip|at|loud <mp4>` e **Read** nos PNGs: prancha
geral, tiras contíguas em toda transição (pulo, parada morta, pisca), os 3
primeiros segundos, e a loudness. Até 3 passes; o que sobrar, diga com honestidade.

## Integração com as caixas seladas (assets)

As mesmas caixas de `scripts/models/` (ver SKILL.md). Gere os assets pra `public/`:

```js
import { gpt54Image2, gpt5ImageMini, recraftV41ProVector,
         geminiTts, lyria3 } from '../scripts/models/index.mjs';
import { save } from '../scripts/lib/or.mjs';
import { saveAudio } from '../scripts/lib/audio.mjs';

// slide/hero (qualidade) → public/
save(await gpt54Image2({ prompt: '...', aspectRatio: '9:16' }), 'public/slide-1');
// ícone transparente de overlay → public/
save(await gpt5ImageMini({ prompt: 'bell icon, flat vector, like SVG', transparent: true }), 'public/icon');
// narração por trecho → public/ (sincroniza legenda com isso)
saveAudio(await geminiTts({ input: 'Bem-vindo...', voice: 'Sulafat' }), 'public/vo-1');
// música de fundo (pro = início/meio/fim; clip = loop) → public/
const m = await lyria3({ prompt: 'upbeat lofi, instrumental, no vocals', version: 'pro' });
```

Duração do vídeo segue a narração: pegue a duração do áudio (ver
`remotion-official/rules/get-audio-duration.md`) e dirija `durationInFrames`.

## Stack mínima de um projeto

`src/Root.tsx` (acha e registra cada `src/videos/<nome>/Video.tsx`, não se edita) ·
`src/videos/<nome>/Video.tsx` (a composição que você escreve) · `public/<nome>/`
(assets) · `package.json` (remotion + @remotion/media).
O `render.mjs` faz bundle + render headless + abre o MP4.

## Quando aprofundar

Carregue a regra oficial específica conforme o vídeo pede — não leia todas de
uma vez. Índice em `references/remotion-official/SKILL.md`. As mais usadas:
`video-layout.md` (layout/tamanho de texto), `transitions.md`, `text-animations.md`,
`audio.md`, `subtitles.md`/`display-captions.md`, `effects.md`, `calculate-metadata.md`.
