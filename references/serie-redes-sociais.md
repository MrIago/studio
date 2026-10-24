# Vídeos em série para redes sociais (a fábrica)

Quando o pedido é alimentar um perfil (dezenas de reels, carrosséis e stories com identidade fixa),
não um vídeo avulso. Junta o que deu certo no Instagram de papel do casei.me (100 posts planejados em
23/10/2026; notas em `~/Documentos/Projetos/Pessoal/casei-me-videos/notes/PAPER.md` e
`instagram/plano-100-posts.md`) com o que 14 vídeos sobre canais de shorts e esteiras de conteúdo
ensinaram (out/2026).

Aqui fica a CRIAÇÃO da série: identidade, kit, roteiro, formatos, produção em lote e conferência. A
ESTRATÉGIA (o que postar e pra quem, pilares, ritmo, chamada no fim por plataforma, comentário que
vira direct, achar virais pra adaptar, publicar por API, medir e ajustar) está na skill `growth`
(`~/.claude/skills/growth/references/conteudo-organico.md`).

## 1 · Identidade e kit antes do primeiro post

- **Identidade visual própria e personagens fixos**, assumidamente fictícios, diferenciam no primeiro
  segundo do feed, sobretudo em nicho onde todo mundo posta vídeo real ou imagem do Pinterest.
  Personagem simples e com personalidade segura mais que IA genérica e "perfeita" (canais de bonequinho
  de palito com 50 mil inscritos em 16 vídeos; o perfil de IA que estoura é o esquisito, não o modelo).
- **Kit de peças num projeto da engine**, reaproveitado por todos os posts: textura, molde de pessoa
  com poses e objetos, elenco, cenários, peças de layout. Caso real: `~/.studio-engine/src/videos/`
  `casei-paper` (lib/paper, lib/people, lib/cast, lib/scenes) + `casei-ig/kit.tsx`.
- **A mesma voz de narrador na série inteira**; um personagem fala com a voz dele quando a fala é dele.
  Quando a fala fica mais longa que a cena, estique o tempo das cenas até caber cada fala (o `warp.ts`
  do casei-reels) em vez de cortar a fala.
- **Ensinar um estilo novo ao Claude**: 2-3 vídeos ou prints de referência → pedir que desmonte (fundo,
  legendas, imagens, tempo, por que prende) → recriar um como teste → aprovado, vira kit ou skill → só
  então produzir em lote. Sem referência, o Claude não sabe o que é bom (LABS: 60 vídeos em 30 min
  depois de ensinado).

## 2 · Roteiro de short que segura

- **Gancho escrito na tela no primeiro segundo**, entendível sem som.
- **Tema que dá dopamina** (curiosidade, humor, ideia que dá vontade de copiar). Tema que deprime
  perde: o short é a pausa de alguém.
- **Quem assiste dentro da história, com algo em jogo** ("Você é uma empresa de café e tem um
  problema"), a solução revelada passo a passo e a **recompensa no fim** (quem foi, o que aconteceu).
  Abertura sem nada em jogo e final sem recompensa derrubam a retenção.
- **Copie a estrutura de um viral, nunca o vídeo**: transcreva (skill `/consume`), mantenha a
  estrutura, troque o assunto ou o ângulo. Foi assim que um canal novo saiu de fracasso para 21 mil
  views em 24 h com 80% de "não pulou" e 96% de retenção.
- **O visual segura tanto quanto o roteiro**: imagens paradas e cenas de filme genéricas perdem para
  animação viva com o mesmo roteiro.
- **O produto aparece em uso dentro de uma história**, não explicado: vídeo institucional não dá
  alcance (institucionais de concorrentes: 124 a 900 views; onde a explicação vai: skill growth).

## 3 · Uma versão por plataforma

| Plataforma | Formato |
|---|---|
| Instagram | reel e story 1080×1920 (story de vídeo ≤ 60 s); carrossel e imagem 1080×1350; carrossel ≤ 10 telas pela API (o app aceita 20) |
| Facebook | os mesmos reels na Página |
| TikTok | o mesmo reel; carrossel vira post de fotos |
| YouTube Shorts | o mesmo reel |

O fim do vídeo muda por plataforma ("comenta PALAVRA" no Instagram e no Facebook, "link na bio" no
TikTok, nenhuma chamada no YouTube): a composição recebe o final como parâmetro e sai uma versão
por final. Qual chamada vai em cada plataforma é decisão da skill growth
(`references/conteudo-organico.md`, seção 5).

Área segura em 9:16: texto entre x 90-930 e y 200-1600. Trilha original baixinha embaixo da voz;
áudio em alta, se quiser, entra no app por cima, bem baixo.

## 4 · Produção em lote e conferência

- **Um comando renderiza a fila** (imagens primeiro, depois os vídeos, um por vez). Máquina apertada:
  render em pedaços com retomada (`remotion-gotchas.md`, render pesado).
- **Tela real do produto dentro da peça**: capturas logado numa conta de teste, só leitura
  (`remotion-gotchas.md`, tour de app).
- **Capa feita por modelo de imagem**: as capas anteriores da série vão PRIMEIRO, como modelo, com
  "reproduza o modelo, mude só a foto e o texto". No AdzHub, com os quadros do vídeo na frente, o
  gpt-image-2 fez capa genérica de YouTube; com as capas primeiro, saiu igual à série. Título
  grande sai certo, letreiro pequeno sai com letra inventada. O modelo lê imagem, não vídeo: mande
  3 ou 4 quadros. Produto real só com a FOTO dele como referência (descrito em texto, o modelo
  inventa um parecido); rótulo e logo pequenos deformam, confira.
- **Antes de publicar, cada vídeo**: transcrever o áudio final e comparar com o roteiro, prancha de
  quadros, quadros contínuos nas emendas, −14 LUFS, capa refeita.

## 5 · Esteira automática: a produção (quando o volume pede)

Um perfil feito só por agente chegou a 100 mil views em 3 dias com "avatar reagindo a vídeo viral":
roteiro pronto, avatar lendo, fundo removido e o vídeo viral atrás. A busca do que adaptar (filtros,
triagem pela tela), o ritmo e a publicação espaçada são da skill growth
(`references/conteudo-organico.md`, seções 4, 7 e 8). A produção, a partir do vídeo escolhido:

1. **Roteiro** no jeito de falar do perfil → **voz** com conferência do áudio (a voz é o que mais
   entrega um avatar) → **avatar** (a versão barata segura em escala) → recorte do fundo →
   montagem com o vídeo de origem atrás e o crédito (@) dele → **portões de conferência** → uma
   versão por final de plataforma → diário das execuções.
2. **Travas**: o agente nunca compra créditos sozinho; não rodar renders em paralelo além do que a
   memória aguenta.

## 6 · Personagem animado por IA de vídeo (3D, low-poly, "influencer" de IA)

- **História em planos**: storyboard feito com a cabeça (lista de planos gerada por IA não
  funcionou), descrição de cada cena, imagens num estilo fixo (ex.: low-poly), cada plano animado
  num modelo de vídeo (`orVideo`), montagem com voz, movimento, legenda, trilha e efeitos. Mesmo com
  IA, animar um minuto toma um dia.
- **Personagem próprio dentro das trends** (Higgsfield: cria o personagem e troca o rosto dele num
  vídeo em alta; tem MCP para o Claude gerar). Gerar vídeo é caro (~R$ 20 por 15 s em 720p num
  comentário de quem testou): orçamento antes do lote. Quando vale a pena (personalidade, plano de
  conversão, trend como palco) e a automação que busca trends e posta sozinha: skill growth.
- **2D de bonequinho em código**: Remotion + desenho em canvas a partir de prints do estilo de
  referência, narração em segunda pessoa ("Você está no trânsito… você sai voando pela janela");
  a direção (ritmo, piada, encadeamento) só vem com horas de iteração. Alternativa sem código: o
  StykAnimate (código aberto, sucessor do Pivot, exporta MP4).
- **Gerador de imagem, vídeo e voz dentro do Claude por MCP** (OpenArt): o Claude busca imagem na
  internet antes de gastar crédito e gera só o B-roll que falta.
