# Quadro desenhado à mão (estilo Excalidraw): o explicativo que se desenha com a voz

Um quadro branco que se desenha sozinho enquanto o narrador fala: caixas, setas, bilhetes e letra
de mão no traço do Excalidraw, uma câmera passeando por um mundo só e, quando a fala cita uma tela,
a gravação real do app dentro de uma janela desenhada. No fim a câmera se afasta e mostra o quadro
inteiro. Serve para explicar sistema, arquitetura, decisão de produto ou fluxo com o porquê de cada
passo (5 a 15 min, 16:9).

Feito pela primeira vez no vídeo da arquitetura da AdzHub v2 (24/10/2026: 11,6 min, 21 trechos de
narração, 16 gravações de tela). O Iago aprovou o estilo: "ficou muito top esse estilo de vídeo", e
depois de ver pronto: "ficou espetacular", com destaque para o afastamento final. A referência que
ele citou é o vídeo de resumo de livro desenhado em quadro: use este estilo quando o pedido for
explicar, resumir ou ensinar algo com começo, meio e fim, e quiser que a pessoa saia com o mapa
inteiro na cabeça.

**O que faz o estilo funcionar (não corte nenhum destes):**
- Tudo se desenha na hora em que a voz fala daquilo (seção 8); nada aparece pronto.
- Um quadro só: a câmera passeia e o que foi explicado continua no lugar (seção 5).
- O afastamento final mostra o quadro inteiro e vira o resumo visual do vídeo. Ele só funciona se o
  mapa do mundo for planejado ANTES de desenhar (passo 5 da tabela): cada parte do vídeo ocupa uma
  área, e as áreas ganham rótulos grandes que só se leem de longe ("a base", "o agente", "os
  dashboards"), ligados por setas. Sem esse planejamento, o afastamento final é só uma colagem.
- Telas reais dentro do quadro provam o que o desenho afirma.
Código em `video/examples/quadro-desenhado/` (inspiração; cada vídeo desenha o próprio quadro).
Como gravar as telas: `gravar-telas.md`.

## 1 · A ordem de produção

| # | Passo | Sai |
|---|---|---|
| 1 | Roteiro em trechos curtos (`**s01**` + parágrafo), um assunto por trecho, todo número com fonte | `notes/ROTEIRO.md` |
| 2 | 2-3 amostras da primeira fala com vozes diferentes; o usuário escolhe | voz + instrução |
| 3 | Um áudio por trecho, nivelado, e a transcrição palavra por palavra | `audio/sNN.wav` + `data/narracao.json` |
| 4 | Sondar o app e gravar as tomadas, com marcas nos eventos (`gravar-telas.md`) | `takes/*.mp4` + `*.json` |
| 5 | Mapa do mundo: uma região por trecho, em linhas e colunas por parte do vídeo | constantes `R_*` |
| 6 | Uma região por vez: desenhar, ancorar nas palavras, conferir num still | `scenes/*.tsx` |
| 7 | Câmera (uma chave por trecho e por detalhe) e o fechamento (o quadro inteiro) | `Video.tsx` |
| 8 | Studio para o usuário aprovar; pranchas de stills para você (seção 11) | ok do usuário |
| 9 | Render com `--gl=angle-egl`, loudness, prancha do MP4 procurando pedaço repetido, entrega, limpar os dados de teste | MP4 |

## 2 · O traço: rough.js vendorizado

rough.js é o traço do Excalidraw (MIT). Baixe o bundle ESM para a pasta do vídeo, sem mexer no
`package.json` da engine (o setup regenera a engine; um pacote novo para um vídeo só não compensa):

```bash
curl -sL https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.esm.js -o src/videos/<nome>/lib/rough.js
```

```tsx
// @ts-expect-error rough.js vem em ESM sem tipos
import rough from './rough.js'
const gen = rough.generator()
const paths = gen.toPaths(gen.rectangle(x, y, w, h, { seed, roughness: 1.1, bowing: 1, strokeWidth: 2.4, preserveVertices: true }))
// → [{ d, stroke, strokeWidth, fill }]: cada um vira <path d=…> num <svg width={1} height={1} overflow="visible">
```

- **Semente fixa por forma** (hash dos argumentos). Sem `seed`, o rough sorteia a cada quadro e o
  traço treme.
- `useMemo` nos paths: gerar é caro e o resultado não muda de um quadro para o outro.
- `disableMultiStroke` (traço único) em seta, linha fina, ✓ e ✗; o traço duplo fica para caixa e elipse.
- O card do Excalidraw é um retângulo de cantos arredondados escrito como path com `Q` nos cantos.
- Preenchimento `solid` (pastel chapado) ou `hachure` (listrado: barras, a "base" de um diagrama).

## 3 · Se desenhar: `pathLength={1}` e dashoffset

Toda peça recebe `draw = { at, dur, out?, outDur? }` em segundos GLOBAIS do vídeo (seção 8).

```tsx
<path d={o.d} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
```

- `pathLength={1}` normaliza o comprimento: não precisa medir path nenhum.
- O rough gera vários contornos por forma; eles se desenham em sequência: `p_i = clamp(p * n - i)`.
- O preenchimento entra depois do contorno: chapado sobe a opacidade a partir de 55% do desenho;
  hachura se desenha com o mesmo dashoffset.
- Linha tracejada não aceita o truque (o dasharray já é o tracejado): ela entra por opacidade.
- Seta: o corpo usa 78% do tempo e a ponta em V começa aos 72%.
- Eases: desenhar `bezier(0.45, 0.05, 0.25, 1)`; sumir `bezier(0.55, 0, 0.75, 0.2)` em 0,35 s.
- Texto à mão se escreve da esquerda para a direita, linha por linha, com
  `clip-path: inset(-30% ${(1 - lp) * 100}% -30% -2%)`; cada linha leva o tempo proporcional ao
  tamanho dela; o padrão é 0,25 s + 0,035 s por letra, até 2,2 s.
- Largura de texto na Virgil ≈ letras × tamanho × 0,56: dimensiona etiqueta e posiciona a vizinha.

Peças da lib do exemplo (`lib/sketch.tsx` e `lib/bits.tsx`), todas com `draw`:

| Peça | Uso |
|---|---|
| `Box`, `Ellipse`, `Line`, `Arrow` (curva com 3 pontos ou mais; `both` = duas pontas) | o vocabulário básico |
| `Hand` | texto à mão (ou em mono, para código, arquivo e endereço) |
| `Note` | bilhete torto (post-it) com texto: regra, decisão, aviso |
| `Card`, `Chip`, `Count` | caixa com título e subtítulo; etiqueta do tamanho do texto; número grande com legenda |
| `Marker` | marca-texto passando atrás de uma palavra |
| `Check`, `Cross`, `Strike` | ✓, ✗ e o X em cima de uma alternativa recusada |
| `Person`, `Lock`, `Key`, `Folder`, `Chat`, `Db`, `Browser`, `Doc`, `Container`, `Moon`, `Clock`, `Eye`, `Envelope`, `Terminal` | ícones feitos com as mesmas primitivas |
| `Pop` | entrada com escala para o que não se desenha (logo, imagem) |
| `Fade` | holofote: opacidade por chaves `[t, valor]` |
| `Screen`, `Footage`, `Picture` | gravação ou imagem dentro de uma janela desenhada (seção 9) |

## 4 · Letra, papel e cor

- **Virgil**, a letra do Excalidraw (OFL):

```bash
curl -sL https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw-assets/Virgil.woff2 -o public/<nome>/fonts/Virgil.woff2
```

  Carregue com `FontFace` dentro de um `delayRender`, uma vez por aba, e libere também no `catch`
  (senão o render espera para sempre):

```tsx
const handle = delayRender('Virgil')
const face = new FontFace('Virgil', `url(${staticFile('<nome>/fonts/Virgil.woff2')}) format('woff2')`)
face.load().then((f) => { document.fonts.add(f); return document.fonts.ready })
    .then(() => continueRender(handle)).catch(() => continueRender(handle))
```

  Confira num still que saiu a Virgil: fonte que não carregou vira uma cursiva qualquer, sem erro.
- Mono (`@remotion/google-fonts/JetBrainsMono`) para rótulo de janela, nome de arquivo e comando.
- Papel `#FBFAF6`, tinta `#2B2B2B`, tinta suave `#6B6B6B`.
- Pastéis do Excalidraw, **cada um com um significado fixo no vídeo inteiro**: azul (plataforma,
  agência), verde (liberado, certo), amarelo (regra, nota), rosa (risco, problema), lilás (módulo,
  IA), pêssego (cliente), turquesa (unidade), cinza (neutro). Tinta forte (azul `#1971C2`, verde
  `#2F9E44`, vermelho `#E03131`, laranja `#F08C00`) só no traço de destaque: anel em volta de algo na
  tela, ✓, ✗, seta de fluxo. A marca do produto fica no logo e no cartão final.

## 5 · Um mundo só, e a câmera passeia por ele

- O quadro é UM espaço. Cada trecho da narração ganha uma **região** com origem fixa
  (`R_X = { x, y }`), do tamanho de uma tela (1920×1080) e com folga entre elas (no exemplo, colunas
  a cada 2150 e linhas a cada 1300-1600). Organize por parte do vídeo: a base numa grade à esquerda,
  o agente numa coluna no meio, os dashboards à direita. No afastamento final, cada parte vira uma área.
- O que já apareceu continua no lugar (mundo persistente, lei 5 do `motion-design.md`).
- Câmera por chaves `{ t, x, y, z, d }`:
  - `t` = quando começa a andar, `d` = quanto leva (1,2-2,4 s), ease `bezier(0.65, 0, 0.35, 1)`.
  - Chegada numa região: `S('s05') - 1` (a câmera chega antes de a voz começar o trecho).
  - Detalhe: chave numa palavra (`A('s05', 'Na matriz') - 0.1`), zoom 1,18-1,3 no ponto citado.
  - Região mais larga que a tela: zoom 0,88-0,92.
  - O zoom é interpolado em escala logarítmica (afastar muito fica natural).
  - Respiração constante de 0,4% (`1 + 0.004 * sin(t * 0.55)`): a imagem nunca para de todo.
- Fechamento: a câmera vai até a caixa do mundo inteiro em 3,6 s, com zoom
  `min(1920 / (W + 300), 1080 / (H + 240))` (~0,14 no exemplo). Lá de longe, texto precisa de
  210-300 px e traço de 20-26 px para ser lido.
- Fixos na tela, fora da câmera: a barra de capítulos e o cartão final.
- Holofote: o que já foi explicado vai para ~0,45 de opacidade (`Fade`), sem sumir.

## 6 · A grade de pontos fica no espaço da TELA

O fundo pontilhado não pode ser um `div` do tamanho do mundo (13.600×7.160 px no exemplo): o Chrome
pinta em ladrilhos e, em tamanho real, alguns saem num estado diferente dos outros (pedaços repetidos
e deslocados). A grade é uma camada do tamanho da tela, e o padrão anda com a câmera:

```tsx
const g = gap * z
const ox = (((1920 / 2 - c.x * z) % g) + g) % g      // idem oy com 1080 e c.y
backgroundImage: `radial-gradient(rgba(0,0,0,${alpha}) ${dot}px, transparent ${dot + 0.3}px)`,
backgroundSize: `${g}px ${g}px`, backgroundPosition: `${ox - g / 2}px ${oy - g / 2}px`,
```

Ajuste a cor medindo o MP4, não o Studio: o gradiente de 1-2 px sai bem mais escuro que o alfa
pedido. Alfa 0,028 deu pontos em 235 sobre o papel em 251, sutil como no Excalidraw. Ponto de
`max(0.6, 1.3 * min(1, z * 1.4))` px e alfa que some quando a câmera se afasta.

## 7 · Só monta o que a câmera vê (`At` com w/h)

Cada região fica dentro de `<At x y w h>`, que só monta quando a caixa dela encosta no enquadramento
(com 15% de folga de cada lado).

- `w`/`h` precisam cobrir tudo o que a região desenha. O padrão é 2000×1150; região larga (o cofre
  com 4000, a fileira de conversas com 4300×1300) declara a sua, senão metade dela some quando a câmera
  centraliza além da caixa.
- Medido: não acelerou o render deste vídeo (o custo eram as gravações), mas mantém a página leve.

## 8 · A linha do tempo mora nas palavras da narração

Tudo se ancora numa palavra dita, nunca em segundos chutados.

1. Um áudio por trecho: TTS, corte do silêncio do começo, `loudnorm` a −18 LUFS e `transcribeWords`.
   Sai `data/narracao.json` com `{ dur, text, words: [{ w, s, e }] }` por trecho. Transcreva **um
   trecho por vez**: em paralelo, a Groq grátis devolveu 429 e o lote travou.
2. `SECTIONS` diz como os trechos se encadeiam: `lead` (silêncio antes), `pad` (silêncio depois) e
   `breaks` (pausa inserida depois de uma frase, para uma tela gravada ter tempo de mostrar o que a
   voz acabou de dizer). O áudio é cortado no meio do intervalo entre duas palavras e as partes tocam
   com o buraco no meio: `AUDIO = [{ id, from, to, at }]` vira
   `<Sequence from={at}><Audio trimBefore={from} /></Sequence>` (o `Audio` do core).
3. `A('s05', 'dois clientes')` = segundo global em que a frase começa, já contando as pausas.
   `E` = fim da frase, `S`/`Z` = início e fim do trecho, `NEXT` = início do próximo.
   `A(id, frase, 2)` pega a segunda vez que a frase aparece.
4. A busca normaliza (minúscula, sem acento, sem pontuação) e, se não acha, joga erro com o trecho
   inteiro.
5. **A âncora usa a grafia da TRANSCRIÇÃO.** A voz disse "Claude Code" e o STT escreveu "Cloud
   Code"; "OpenCode" veio "Open Code", "OpenRouter" veio "Open Router", e o nome de um cliente veio
   grafado como uma palavra comum.
   Escreva a âncora como está no JSON (o erro mostra o trecho).
6. Peça entra 0,1-0,3 s antes da palavra (`A(...) - 0.2`); título de região em `S(id) - 0.3`.
7. Trocar a voz = gerar e transcrever de novo: os desenhos ressincronizam sozinhos.
   `DURATION = Math.ceil(TOTAL * FPS)`.

## 9 · Telas reais dentro do quadro

`Screen` = janela desenhada (moldura branca à mão, três bolinhas, rótulo em mono) com a gravação
dentro; a imagem entra com fade e escala a partir de 0,985 depois de 55% da moldura.

- **Trechos (`clips`)**: `{ at, from, to?, rate? }` começa a tocar em `at` (segundo global) a partir
  do segundo `from` da gravação. Com `to`, a velocidade se ajusta (0,4× a 4×) para chegar em `to`
  quando o próximo trecho começa; se sobrar tempo, segura o último quadro. A gravação acompanha a
  fala sem regravar.
- **Componente: `<Video>` do `@remotion/media`**, não o `OffthreadVideo` (a lib do exemplo já
  importa o novo). Medido: 3,3× mais rápido no trecho das conversas do agente.
- **Gravações em 720p** (`scale_cuda` pela NVIDIA, `remotion-gotchas.md`): neste estilo a tela
  aparece pequena ou média e o texto continua legível. O layout não muda: a caixa é calculada para
  1920×1080 e o navegador escala.
- **Congelar um quadro**: `trimBefore` no quadro e `playbackRate={0.0001}`. É o que mostra o
  primeiro quadro antes do primeiro trecho e segura o último depois.
- `trimBefore` substituiu o `startFrom`.
- **Recorte (`crop`)**: um retângulo da gravação 1920×1080 vira a janela inteira (a coluna do chat
  `{ x: 1296, y: 0, w: 624, h: 1080 }`, uma tabela, dois botões); a janela assume a proporção dele.
- **Marcas no lugar de segundos**: a gravação traz `{ marks: [{ label, t }] }` (`enviou`, `fim`,
  `confirmou`); o trecho usa `mark(take, 'fim') - 4`, não um número lido no olho. Regravou, continua certo.
- **Anel em volta de um elemento da tela**: `onShot(sx, sy, w)` converte um ponto da gravação (px de
  1920×1080) para o quadro; com os dois cantos sai uma elipse à mão em volta do botão ou do rótulo
  que a voz cita. Leia as coordenadas num quadro da gravação.
- **Trocar de página na mesma janela**: um segundo `Screen` no mesmo lugar, com `Fade` de 0 a 1 em
  0,05 s e moldura instantânea (`dur: 0.01`); parece a página mudando.
- E-mail e outras imagens: renderize o HTML num PNG (com horário fixo, sem data real) e mostre com
  `Picture`.
- Bilhete que explica a tela fica ao lado ou embaixo da janela, nunca por cima do que a voz está
  mostrando, e sai (`out`) quando o próximo chega.

## 10 · Conversas com um agente, lado a lado

Uma conversa por papel (admin, sócio, equipe, cliente...), cada uma gravada com marcas
(`gravar-telas.md`, seção 4). No vídeo, uma fileira de colunas do chat recortadas, cada uma com o
nome escrito à mão e uma etiqueta com o papel. A câmera para em cada uma (chave em
`A('s17', <nome>) - 0.9`, zoom 0,92) e no fim se afasta (zoom ~0,43) para mostrar a fileira toda:
a mesma pergunta, respostas diferentes, e a permissão aparece funcionando.

- Por conversa, dois trechos: o envio (`enviou - 1.6` até `enviou + 0.6`) e a resposta
  (`fim - 4` até `fim + 1.5`). A que pede confirmação ganha mais dois (`confirmou` e o segundo `fim`).
- Pausas (`breaks`) de 2,2 a 3 s depois de cada frase que apresenta uma conversa.

## 11 · O que só a prancha de quadros mostrou

O Studio em tamanho pequeno esconde sobreposição. Antes do render, gere o bundle uma vez
(`npx remotion bundle src/index.ts --out-dir <dir>`) e tire stills nos instantes de cada região
(`npx remotion still <dir> <ID> f.png --frame=N --scale=0.4 --gl=angle-egl`), juntos numa prancha.
Depois do render, `qa.mjs sheet` e `qa.mjs at`, procurando de propósito pedaço repetido: o primeiro
render deste vídeo saiu com o diagrama em dobro em quase todo quadro, a prancha de 24 quadros já
mostrava e passou batido, e quem achou foi o Iago assistindo. Still isolado não prova o render
inteiro (seção 12). Achados deste vídeo, nenhum visível no código:

| Defeito | Correção |
|---|---|
| Barra de capítulos no canto esquerdo cobria o título de cada região | canto superior direito |
| `Pop` crescia a partir da origem da região: a imagem "vinha do canto" | `ox`/`oy` no centro do elemento (`transform-origin`) |
| Marca-texto recortado no lugar errado (recorte calculado no espaço do mundo) | wrapper posicionado no texto, recorte nele, retângulo em coordenada local |
| Etiqueta encavalada no nome de cada conversa | largura calculada do nome (letras × tamanho × 0,56) + 26 px |
| Etiquetas e ✓ de listas colados no texto vizinho | posição explícita por item, ✓ numa coluna fixa |
| Bilhete cobrindo o assunto da tela gravada | ao lado da janela, com `out` |
| Rótulos ilegíveis no afastamento final | texto 210-300 px, traço 20-26 px |
| Grade de pontos escura no MP4 | alfa 0,028 medido no MP4 (seção 6) |
| Ladrilhos embaralhados em tamanho real | grade no espaço da tela |
| Diagrama duplicado e deslocado em quase todo quadro do render inteiro | `--gl=angle-egl` (com `angle`, `swangle` ou sem flag, duplica) |

## 12 · Render e entrega

- `--gl=angle-egl` sempre na linha de comando (`render.mjs <ID> <projeto> --gl=angle-egl`). Antes
  do render inteiro, 10 s com gravações e 10 s sem, olhando a prancha: o defeito de duplicar só
  aparece no render sequencial, não em still isolado (`remotion-gotchas.md`).
- Receita rápida (Remotion atualizado, `<Video>` do `@remotion/media`, gravações 720p, NVENC):
  `remotion-gotchas.md`, "A receita rápida". Com ela o mesmo trecho caiu de 522 s para 100 s; sem
  ela, os 11,6 min deste vídeo levaram ~1 h por render.
- Narração nivelada por trecho em −18 LUFS; master final em −15
  (`loudnorm=I=-15.5:TP=-2:LRA=11,alimiter`, e meça de novo). Música, se vier, entra depois por
  ffmpeg, sem renderizar o vídeo de novo.
- Limpe o que as gravações criaram no app (convites, cadastros, conversas, variáveis): a lista sai
  dos `takes/*.trace.json`.
