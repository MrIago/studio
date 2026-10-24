# Gravar as telas de um app web para vídeo (16:9, logado, com marcas)

Receita para gravar tomadas nítidas de um app web rodando local, como uma pessoa usando: cursor
visível, digitação no ritmo humano, nenhuma tela de carregamento no filme e uma marca em cada
acontecimento que a edição vai usar. Usada nas 16 tomadas do vídeo da arquitetura da AdzHub
(24/10/2026); código em `video/examples/quadro-desenhado/capture/`. Para montar as tomadas dentro
de um quadro desenhado: `quadro-desenhado.md`, seção 9. Celular em 9:16 com caixas por elemento:
`remotion-gotchas.md` (tour de app) e `references/recording.md` da skill `surf`.

## 1 · A bancada

- Chrome headless (o `chrome-headless-shell` do Playwright) em 1280×720 com `deviceScaleFactor: 1.5`:
  a interface tem o tamanho de um notebook e o quadro sai com 1920×1080. `--hide-scrollbars`.
- Um contexto por pessoa, com `locale`, `timezoneId`, `colorScheme: 'light'` e o cookie de tema do
  app, se houver.
- Um navegador por tomada, fechado no fim (a máquina estava com pouca memória).
- **Sessão logada por API, sem filmar o login**: `ctx.request.post(<rota de login>, { data })` grava o
  cookie no contexto. Use as contas de teste do projeto; senha só por variável de ambiente, nunca no
  código. Filmar o login só quando ele é o assunto, num app local ou de teste e com o ok do dono (o
  campo de senha já sai mascarado).
- Sonde antes de escrever a tomada: `probe.mjs` abre os caminhos como a pessoa e lista menu, títulos e
  botões (os nomes reais para os seletores); `shots.mjs` salva um JPEG por caminho para ver o layout.

## 2 · A câmera é um laço de capturas por CDP

```js
const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, optimizeForSpeed: true })
frames.push({ file, t: Date.now() - t0 })   // o tempo REAL de cada quadro
```

- No fim, o ffmpeg monta pelo tempo real: concat com a `duration` de cada quadro,
  `-vf fps=30,format=yuv420p`, x264 crf 18. A tomada dura o que durou de verdade.
- Saiu ~13 quadros por segundo capturados: movimento de interface fica natural; rolagem rápida fica
  um pouco dura.
- Os JPEGs soltos são apagados depois do MP4 (disco).
- Cada tomada grava `takes/<nome>.json` com `{ seconds, capturedFps, marks: [{ label, t }] }`.

## 3 · O que fez cada tomada sair limpa

| Problema | O que resolve |
|---|---|
| Capturar enquanto um documento novo carrega derruba a aba | pausa sozinha: `Page.frameStartedLoading` do frame principal pausa; `frameStoppedLoading` + 250 ms retoma. Navegação do Next (pushState) segue filmando. `page.goto` sempre com a câmera pausada |
| O headless não desenha o mouse | `addInitScript` com um cursor SVG fixo que segue o `mousemove` e encolhe no `mousedown`; o mesmo CSS esconde o selo do dev do Next (`nextjs-portal`) |
| Clique caindo na cortina de carregamento (ela só monta depois de hidratar) | esperar a cortina APARECER e depois sumir, mais 0,9 s |
| Clique antes de o elemento aceitar clique | `locator.click({ trial: true })` espera sem clicar; depois o mouse anda até o centro em 22 passos, pausa 250 ms, desce e sobe em 70 ms |
| Datas de trabalho na tela ("em 22/10/2026, 23:17") num vídeo sem datas | `TreeWalker` + `MutationObserver` apagando o padrão; período de dado (filtro de datas) fica |
| Tomada cortada antes do fim (a tela do código ainda não tinha aparecido) | esperar o texto final (`getByText('Confirme seu e-mail').waitFor()`) antes de parar |
| `waitForURL` instável com a captura rodando | laço que confere `new URL(page.url()).pathname` a cada 150 ms |
| A tomada abrindo na tela de carregamento | `boot()` navega e espera a cortina FORA do filme; só então `film(page)` e `start()` |

- Digitação com `keyboard.type(texto, { delay: 38 a 75 })`. `pointAt` leva o cursor até um elemento
  sem clicar, para a voz falar dele.
- Segure 1,5 a 3 s depois de cada acontecimento: a edição precisa de folga para os trechos.
- Marque tudo que o vídeo vai usar (`t.mark('enviou')`): a edição se ancora nas marcas, não em
  segundos lidos no olho.

## 4 · Gravar uma conversa com um agente

1. Abre a bolha do chat, expande para a coluna, digita, envia: marca `enviou`.
2. Espera o botão "Parar" aparecer (`rodando`) e sumir (`fim`, prazo de 5 min); lê por 5 s.
3. Pedido que pede confirmação: espera o botão "Confirmar", segura 1,5 s, clica (`confirmou`) e
   espera o turno de novo.
4. Depois da tomada: acha o id da conversa no banco, anota no trace e **desliga o container** da
   conversa (o dev só aceita poucos ao mesmo tempo, e o ocioso segura memória).

Uma conversa por papel, com perguntas no mesmo estilo: lado a lado no vídeo, mostram a permissão
funcionando (`quadro-desenhado.md`, seção 10).

## 5 · A gravação cria dado de verdade: anote para limpar

Convite enviado, cadastro em espera, conversa, variável no cofre: gravar mexe no app. Cada tomada
anota o que criou em `takes/<nome>.trace.json`, e a limpeza do fim percorre essa lista. Com o app
local apontando para o banco de produção (caso da AdzHub), nada pode ficar para trás.

## 6 · Depois de gravar

- Uma prancha de cada tomada (alguns quadros espaçados) antes de montar: cortina, cursor, datas e o
  último quadro.
- Recodificar com GOP 15 (`-g 15 -keyint_min 15 -sc_threshold 0`) para o `OffthreadVideo` buscar mais
  rápido: medido, não mudou o tempo de render. Não precisa.
- As tomadas vão para `public/<nome>/takes/` da engine. O bundle copia a `public/` inteira (1 GB
  neste vídeo): gere o bundle uma vez e reuse em todos os stills.
