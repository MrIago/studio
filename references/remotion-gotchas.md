---
name: gotchas
description: Armadilhas reais que custaram tempo ao criar vídeos com Remotion + OpenRouter + publicar no GitHub
---

# Gotchas (aprendidos na marra)

## GitHub README: player de vídeo

**O player de vídeo inline no README só funciona com URL `user-attachments`** — `https://github.com/user-attachments/assets/<uuid>`.

- ❌ `.mp4` **commitado no repo** (`raw/main/demo/demo.mp4`) → só baixa, não toca.
- ❌ `.mp4` como **release asset** (`releases/download/...`) → também só baixa numa linha solta.
- ✅ URL `user-attachments/assets/...` → **vira player**.

Essa URL **só é gerada arrastando o arquivo na interface web** do GitHub (editar README na web → arrastar o vídeo). **NÃO dá pra gerar via token de API** (o endpoint `github.com/upload/policies/assets` exige sessão web/cookie, retorna login com token). 

Fluxo: o agente prepara tudo, pede pro usuário arrastar o vídeo no editor web do README, o usuário cola a URL `user-attachments` gerada, o agente coloca no README (numa linha sozinha, sem markdown de imagem) e dá push.

Fallback 100% por código: **GIF clicável** (`<img>` dentro de `<a href=mp4>`). GIF aparece (é imagem), mas perde áudio. Gere GIF leve: `ffmpeg -i v.mp4 -vf "fps=10,scale=360:-1:flags=lanczos,palettegen=max_colors=128" pal.png && ffmpeg -i v.mp4 -i pal.png -lavfi "fps=10,scale=360:-1[x];[x][1:v]paletteuse" demo.gif` (~1.3MB).

## Remotion

- **`<svg width={0} height={0}>` não desenha nada**, nem com `overflow: visible` (a
  spec desliga o render com dimensão zero). Pra SVG "âncora" (seta, brilho, onda) use
  `width={1} height={1}` + `overflow: visible`. Só `<defs>` funciona num SVG 0×0.
- **Mão apontando (dedo de papel/ícone)**: desenhe no formato de cursor de mãozinha:
  indicador na BORDA da mão, polegar à mostra e os três dedos dobrados ao lado. Um dedo
  só, no meio do punho, lê como dedo do meio (reprovado pelo Iago, 22/10/2026).
- **Momento de foto/scan pede som de câmera**: clique de obturador (`shutter-modern` de
  `https://remotion.media/shutter-modern.wav`) + flash curto. Outros SFX úteis do mesmo
  CDN: page-turn, whoosh, whip, ding, mouse-click, shutter-old.
- **CSS transition/animation e `animate-*`/`transition-*` do Tailwind NÃO renderizam.** Tudo por `useCurrentFrame()`. Erro silencioso: parece animar no preview do navegador mas sai parado/quebrado no render.
- **`useCurrentFrame()` dentro de `<Sequence>` retorna frame LOCAL** (começa em 0), não o absoluto. Cuidado ao calcular animações.
- **`<TransitionSeries.Transition>` encurta o total** pela duração da transição. `TOTAL = soma(durações) - soma(transições)`. Se o vídeo cortar cedo ou áudios dessincronizarem, é isso.
- Renderizar o vídeo todo é lento; **valide com `remotion still` (1 frame)** antes. O agente pode `Read` o PNG.
- Fontes Google: importe com pesos/subsets específicos (`loadFont('normal',{weights:['400','700'],subsets:['latin']})`) — senão gera warning de "21 network requests".
- `import cairo` etc.: ao desenhar formas, use `<div>`/SVG/CSS — não há canvas API direto a menos que use `<HtmlInCanvas>` (Chrome 149+ com flag).

## Vídeo narrado (aprendido nos tutoriais de vendedores, 15/10/2026)

- **Legenda usa o TEXTO DO ROTEIRO, não o da transcrição.** A transcrição só dá o
  tempo; o texto dela erra ("anexe" virou "anesse" na tela). Troque palavra a palavra
  quando a contagem bate; onde não bate (voz diz "vinte por cento", STT escreve
  "20%"), fique com a transcrição.
- **`<Sequence>` zera o `useCurrentFrame()`**: cena que calcula por tempo absoluto
  (âncora em palavra) não pode estar dentro de Sequence — renderize solta com fade
  por intervalo.
- **Âncora de palavra quebra calado com número**: a fala "vinte" vem transcrita "20".
  Faça o lookup jogar erro com a frase inteira (`palavra X não achada em …`).
- **loudnorm sozinho pode passar de 0 dBTP** (deu +0,9). Encadeie
  `loudnorm=I=-15.5:TP=-2:LRA=11,alimiter=limit=0.8:level=false` e meça de novo.
- **Duas cenas entrando juntas**: confira a tira contígua da passagem; a cena que sai
  tem que terminar antes da próxima entrar.
- Demo de app em 9:16: telas reais capturadas em 1080×1920 (Playwright, DPR 2,5) +
  bbox de cada elemento → celular persistente, câmera que aproxima o elemento falado
  (zoom ≤1,45, largura mínima de contexto 660px), holofote 0,3 + anel na cor da
  marca, toque com click, barra de capítulos. Implementação de referência:
  `video/examples/demo-app-9x16/` (shared.tsx + Video.tsx; inspiração, não template).

## OpenRouter áudio

- Modelos de áudio **não aparecem por busca de keyword** em `/v1/models`. Filtre por `output_modalities`.
- **TTS (`gemini-tts`)**: PADRÃO da skill. Tags de emoção inline (`[excited]`/`[whispers]`) num request; multi-voz (`geminiDialog`) só com `GEMINI_API_KEY` (a OR não roteia multi-speaker → 404). Texto com travessão/reticência/frase curta à toa cria SILÊNCIO (picota). Saída PCM → WAV.
- **Música (`lyria-3`)**: `stream:true` é OBRIGATÓRIO (senão 400). Áudio nos chunks SSE como `delta.audio.data` base64. **O stream tem linhas keep-alive `: OPENROUTER PROCESSING`** antes do áudio — ignore (não começam com `data:`). **Às vezes a 1ª tentativa volta vazia (0KB)** → SEMPRE valide `buf.length` e dê retry (até 3×). O `generate-audio.mjs` já faz isso.
- **SFX (whoosh/ding) precisam existir em `public/`** antes do render, senão `<Audio src="whoosh.wav">` quebra. O `generate-audio.mjs` baixa-os de `remotion.media`. Se gerar áudio à parte, baixe os SFX também.
- Chave: nunca commitar em repo público; passar via env / `~/.config/studio/.env`.

## Áudio faltante quebra o render

`<Audio src={staticFile('x.mp3')} />` **lança erro no render se o arquivo não existir** em `public/`. Defesas:
1. Garanta que `generate-audio.mjs` rodou e produziu TODOS os assets (vo-*, music, whoosh, ding) antes de `render.mjs`.
2. Pra tolerar ausência, condicione o `<Audio>` a uma flag de props (`defaultProps={{hasMusic:true}}` + `{props.hasMusic && <Audio .../>}`).

## Publicação / git

- Mantenha o projeto Remotion (node_modules, áudios, stills) numa pasta **gitignored**; versione só o MP4/GIF final.
- Pra `git push` com token sem salvá-lo: `git push "https://USER:TOKEN@github.com/..." main` e configure o remote SEM o token (`git remote set-url origin https://github.com/...`).
- Tokens colados no chat devem ser **revogados** depois (GitHub: settings/tokens; OpenRouter: /keys).

## Debug criativo

Pra checar o que um TTS realmente falou (pausas, repetições), transcreva o MP3 com faster-whisper local — útil quando um áudio sai mais longo que o esperado.
- **Áudio NÃO respeita Sequence?** Use `<Audio>` do core `remotion`, NÃO do `@remotion/media`. O do @remotion/media IGNORA o `from` do `<Sequence>` pai e toca desde o frame 0 (causa narrações/áudios todos empilhados no início). O core respeita o Sequence e desloca certo.

## Tour de app real dentro de celular de papel (vídeo casei.me V&K, 22/10/2026)

- **Telas logadas sem digitar senha** (Claude Code): conta de teste do seed + rota de
  recuperação do próprio app (ex. e-mail + telefone) chamada por `fetch` dentro da
  página no Playwright headless → `storageState` salvo → todas as capturas usam ele.
  Criar conta ou digitar senha em produção continua proibido; telas de senha viram
  "pontinhos" desenhados por cima (efeito, não digitação real).
- **Capture + caixas**: cada screenshot 390×844 @3 grava as caixas (px @3) dos
  elementos que serão tocados/focados num JSON; o roteiro do tour referencia caixa por
  nome e joga erro se faltar (nada de coordenada chutada). Teste o roteiro fora do
  Remotion com esbuild + stubs antes de renderizar.
- **Rolagem de feed**: capture com viewport alto (390×2700) e role a imagem; cabeçalho
  fixo e tabbar vêm recortados de uma captura normal e ficam parados por cima. Corte
  seco pra captura normal enquadrada no mesmo ponto (mesmo topo do post) = invisível.
- **"Digitando"**: uma tarja da cor do campo recua da esquerda pra direita sobre o
  texto já capturado (wipe); botão habilitado = recorte de outra captura colado.
- **Render pesado por filtro SVG** (feTurbulence/displacement em recortes de papel):
  cena que fica escondida atrás de um papel opaco NÃO deve ser desenhada. Esconder a
  festa durante o tour derrubou o render de ~0,35 s para ~0,14 s por quadro.
- **Celular de papel**: ilha e brilho por cima do app cobrem o cabeçalho (as capturas
  não têm barra de status). Ilha fina colada no topo, brilho fraco no canto.
- **Dedo do tour**: movimentos seguidos precisam de ≥0,45 s entre si (ele chega 0,32 s
  antes do toque); alvos iguais em sequência não mexem o dedo. Tire o dedo da tela
  (`point null`) durante rolagens e trocas de assunto.
- **Captura alta de feed tem que cobrir até o fim da rolagem**: se a rolagem passa do fim da
  imagem, metade do celular fica branca. Some a altura do último alvo + uma tela inteira.

## Render pesado e memória (Instagram de papel do casei.me, 23/10/2026)

Máquina de 16 GB com o desktop e o Chrome do usuário abertos: o render de um reel com dezenas
de recortes com filtro SVG passou de 3-4,5 GB por aba e, com `concurrency: 6`, derrubou a sessão.

- **Renderize em pedaços com retomada**: pedaços de ~150 quadros, cada um com navegador novo (a
  memória volta ao zero), salvos no disco; o ffmpeg junta sem reencodar. Rodar de novo continua
  do pedaço que faltava. 2 abas só com folga (≥ 8,5 GB livres), senão 1. Trecho onde a memória
  sobe quadro a quadro: pedaços menores só ali (50 ou 10). Mudou o código: apague os pedaços.
  Implementação: `~/.studio-engine/work/render-chunks.mjs` (ainda com a lista de vídeos do
  casei.me fixa no topo) + `work/sampler.sh` (vigia que mata o render abaixo de 1,5 GB livres).
- **Áudio à parte, com o vídeo escondido**: uma prop `audioOnly` que põe o conteúdo em
  `display: none`. Senão o Remotion desenha cada quadro de novo só para colher os sons (13 min
  contra 13 s, áudio idêntico).
- **Refazer um trecho de um vídeo pronto**: `npx remotion render … --frames=900-1049 --muted` e
  emendar com uma recodificação só (`trim` + `concat`, áudio com `-c:a copy`, saída `yuvj420p`, o
  formato do Remotion).
- **Render longo nunca dentro do Monitor** (ele expira em 30 min e mata o que roda dentro):
  `run_in_background` e o Monitor só no `tail -F` do log.
- **`pkill -f`/`pgrep -f` casam com a própria linha do Bash**: use colchete no padrão
  (`"headless-shel[l]"`), senão o comando mata a si mesmo (saída 144).
- `awk` lendo número com ponto num sistema pt_BR: `LC_ALL=C`. `ffprobe … csv=p=0` imprime "1018,"
  (use `parseInt`).
- **`mix-blend-mode: multiply` dentro de grupo com filtro falha em peça girada na resolução
  cheia** (aparece o grão branco cru): use textura em PNG com transparência.

## Render longo com telas gravadas (quadro desenhado da AdzHub, 24/10/2026)

Vídeo de 11,6 min (20.905 quadros): quadro desenhado em SVG e até 6 gravações de tela à vista ao
mesmo tempo, numa máquina de 8 núcleos e 16 GB. Estilo e montagem em `quadro-desenhado.md`.

### A receita rápida (medida em 24/10/2026, mesmo trecho de 30 s com 6 gravações à vista)

| Configuração | Tempo |
|---|---|
| Remotion 4.0.474, `OffthreadVideo`, gravações 1080p | 522 s |
| Remotion 4.0.538, mesmo componente | 242 s (2,2×) |
| 4.0.538 + `<Video>` do `@remotion/media`, 1080p | 160 s (3,3×) |
| + gravações em 720p + codificação na NVIDIA | **100 s (5,2×)** |

1. **Remotion atualizado** (a engine foi para 4.0.538 nesse dia). Sozinho cortou pela metade:
   corrigiu a lentidão progressiva em render longo (4.0.533), trouxe a captura por memória
   compartilhada, sem JPEG no meio (4.0.534, confira no `--log=verbose`: "shared-memory capture
   uses"), o NVENC no ffmpeg embutido (4.0.484) e a correção das faixas duplicadas da rasterização
   por GPU (4.0.527, só no Lambda). Antes de um vídeo grande, veja as notas de versão
   (`gh api repos/remotion-dev/remotion/releases`) e atualize todos os `@remotion/*` na mesma versão.
2. **`<Video>` do `@remotion/media`** no lugar do `OffthreadVideo` para gravações (a doc chama o
   `OffthreadVideo` de "não otimizado"). Mesmas props (`trimBefore`, `playbackRate`, `muted`,
   `style`); congelar quadro com `playbackRate={0.0001}` funciona igual.
3. **Gravações no tamanho em que aparecem.** Em vídeo animado, tela gravada aparece pequena ou
   média: 720p não perde leitura (conferido lado a lado nas conversas do agente) e corta a
   decodificação. Reduza pela NVIDIA, em segundos:
   `ffmpeg -hwaccel cuda -hwaccel_output_format cuda -i in.mp4 -vf scale_cuda=1280:720 -c:v h264_nvenc -preset p5 -cq 21 -g 15 -bf 0 -an out.mp4`.
   Só mantenha 1080p se a tela ocupar a tela inteira com texto miúdo.
4. **Render:** `--gl=angle-egl --concurrency=4 --hardware-acceleration=if-possible --video-bitrate=8M`
   (com NVENC não existe crf; 8 Mbps dá ~0,9 MB/s, baixe se o tamanho importar). Confira
   `Encoder: h264_nvenc, hardware accelerated: true` no log verbose.
5. Antes do render inteiro: 10 s com gravações e 10 s sem, prancha procurando pedaço repetido.

A placa de vídeo NÃO desenha os quadros neste notebook (Wayland, Intel + NVIDIA): nem o Chrome for
Testing (`--chrome-mode=chrome-for-testing`, receita da doc para GPU no Linux) saiu de "Software
only" em `npx remotion gpu`, com nenhum `--gl`. O único caminho pela NVIDIA (`--gl=angle`) duplica.
A NVIDIA entra na codificação (NVENC) e na redução das gravações.

Também testado, 10 s com as conversas do agente (Remotion 4.0.538), e nada bateu o `angle-egl` puro
(71 s, NVIDIA em 0%):

| Tentativa | Tempo | NVIDIA |
|---|---|---|
| `angle-egl` + variáveis de placa dedicada (`__NV_PRIME_RENDER_OFFLOAD=1`, `__EGL_VENDOR_LIBRARY_FILENAMES=.../10_nvidia.json`) | 80 s | 1% |
| `angle` + `--disable-gpu-rasterization` (Chrome embrulhado num script via `--browser-executable`) | 91 s | 2% |
| as duas juntas | 96 s | 2% |
| `angle-egl` com concorrência 6 / 8 | 100 s / 112 s | 0% |

Motivo: o trabalho pesado aqui é rasterizar SVG, decodificar as gravações e copiar quadros, e o
Chrome sem janela não manda isso para a placa neste sistema; ligar o caminho da GPU só acrescenta o
custo de ida e volta. Concorrência 4 é o ponto certo em 8 núcleos. Para ir além: render na nuvem
(Remotion Lambda divide o vídeo entre muitas máquinas).

### Achar o gargalo de um vídeo com efeitos de papel (reel do casei.me, 24/10)

O reel "genial" (1080×1920, 35 s, personagens de papel) levava 6min21s mesmo com a receita acima. O
gargalo não era vídeo nem sombra: era o **grão pintado em cada peça** (`fill="url(#grainA)"`, um
`<pattern>` com textura de 2048 px aplicado a dezenas de peças por quadro). Medido no trecho mais
pesado, captura por quadro (`--log=verbose`, linha `capture => N ms`):

| Mudança | Captura |
|---|---|
| original | 1.551-1.893 ms |
| sem `drop-shadow` | -12 a 23% |
| sem o filtro de recorte (`feTurbulence` + `feDisplacementMap`) | -18% |
| **grão num ladrilho de 512 px repetido** (o resto igual) | **362 ms (4,3×)** |

Reel inteiro: 381 s → **132 s**, com imagem idêntica a olho (PSNR 43 dB). Fundo de papel "assado"
numa imagem pronta não ganhou nada. Método: `--frames` de 90 quadros no trecho mais lento,
desligando uma coisa por vez, e só então trocar pelo equivalente barato; conferir com
`ffmpeg -lavfi psnr` e um recorte lado a lado. Textura grande em `pattern`, `mask` ou
`background-image` por peça é suspeita número 1 em render por CPU.

### O que aprendemos no caminho

- **`--gl=angle-egl` nesta máquina, nunca `--gl=angle`.** Com `angle` (e também com `swangle` e
  sem flag) o render sequencial saiu com pedaços do quadro DUPLICADOS e deslocados em praticamente
  todo quadro: o mesmo diagrama duas vezes, uma cópia uns 150 a 500 px abaixo da outra. Um still
  isolado pode sair limpo e o render inteiro não; foi entregue assim e o Iago achou no vídeo. Com
  `angle-egl` (e `vulkan`) os mesmos trechos saíram limpos. O teste que decide em 1 minuto: renderize
  10 s com cada modo (`--frames=14100-14399 --gl=<modo>`) e olhe uma prancha
  (`select=not(mod(n\,15)),scale=480:-1,tile=5x4`): a duplicação aparece em todos os quadros.
- **Camada do tamanho do mundo quebra a pintura**: um `div` de 13.600×7.160 px com fundo
  pontilhado, escalado pela câmera, saiu em ladrilhos trocados. Fundo repetido vai numa camada do
  tamanho da tela, com o padrão andando junto com a câmera.
- **Tempos medidos** (concorrência 4): quadro só de desenho ~0,06 s; com gravações (`OffthreadVideo`)
  0,19 a 0,27 s. O gargalo é tirar os quadros das gravações, na CPU. Meça num pedaço antes
  (`--frames=3600-3779`, um trecho com gravações e outro sem).
- **Não ganharam nada**: montar só o que a câmera vê; recodificar as gravações com GOP 15
  (`-g 15 -keyint_min 15 -sc_threshold 0`); concorrência 6 no lugar de 4.
- **Flags do CLI 4.0.474**: existem `--offthreadvideo-cache-size-in-bytes` (limite o cache das
  gravações; 1,5 GB aqui) e `--x264-preset` (`veryfast` deixa a codificação mais leve, ela usava ~0,6
  núcleo). `--offthreadvideo-threads` não existe nesta versão.
- **Placa de vídeo**: com `--gl=angle` o Chrome do render roda na NVIDIA (`nvidia-smi` durante o
  render: ~600 MB na placa, 18% de uso), mas é justamente o modo que duplica. Com `--gl=angle-egl` o
  processo de GPU do Chrome não abre nenhum `/dev/dri` e a NVIDIA fica em 0%: desenha por software,
  e sai certo. Ficam na CPU também a extração dos quadros das gravações e a codificação. O Remotion
  tem NVENC no Linux desde a 4.0.236 (`--hardware-acceleration if-possible`, com `--video-bitrate`,
  que substitui o crf), mas aqui o log de render (`--log=verbose`) disse
  `Encoder: libx264, hardware accelerated: false`: o ffmpeg embutido da 4.0.474 não tinha NVENC
  (entrou na 4.0.484; na 4.0.538 funciona, receita acima). "0% de GPU" medido com nada
  renderizando não prova nada: meça com o render rodando.
- **Olhe a máquina antes de estimar**: `top` e `free -m`. Outra sessão compilando (`next build`, ~2
  núcleos e 1,8 GB), um app residente gastando 76% de um núcleo e 5 GB de swap levaram a estimativa de
  ~1 h para ~1h20.
- **O "time remaining" do Remotion oscila**: o começo só com desenho anda rápido (previa 15 min) e a
  conta despenca quando entram as gravações (1h21). Estime pela taxa do trecho mais pesado.
- **Bundle uma vez, stills e testes a partir dele**: `npx remotion bundle src/index.ts --out-dir <dir>`
  e depois `npx remotion still|render <dir> <ID> …`. O bundle copia a `public/` inteira (1 GB com as
  gravações), então não repita a cada still.
- **`pkill -f "remotion render"` matou o próprio shell de novo** (saída 144): o colchete da seção
  anterior vale para qualquer padrão (`"[r]emotion render"`).
- **Progresso no Monitor sem enxurrada**: `tr '\r' '\n'`, tirar a cor e um `awk` que deixa passar a
  linha `Rendered N/T` só a cada 5% (e qualquer outra linha sempre, para os erros chegarem).
