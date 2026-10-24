# Motion design profissional (ofício + vocabulário)

Leia antes de qualquer vídeo que precisa impressionar. A primeira metade é o
**ofício**: as regras que separam motion de verdade de "slide com fade" e de "AI
slop". A segunda é o **vocabulário**: técnicas e receitas. Nada aqui é estilo
fixo: cada vídeo tem paleta, público, mensagem e formato próprios. Fontes: Envato
(princípios), MOTION_PHILOSOPHY e video-storytelling do herk-edit-kit, a skill
oficial do HyperFrames, motion-principles, 20 vídeos de quem faz motion com Claude
e os TikToks de "saas motion design" mais curtidos (out/2026).

## 1 · As leis

1. **Uma ideia por beat.** Se a cena diz duas coisas, divida. Beat de anúncio
   ~1,5s; de explicação narrada 3-7s (8-14s para diagrama complexo). Nunca revele
   duas coisas novas ao mesmo tempo: o olho não segue. Uma, pausa, a próxima.
2. **Cada cena prova a sua fala.** O que se vê é o exemplo, a relação, a
   consequência; não a mesma frase escrita de novo. Se não ganha palavra na
   narração, não é desenhado (~20 palavras na tela por seção, rótulos de 1-2 palavras).
3. **O ponto maior é a maior coisa da tela.** Hierarquia por escala, cor e ordem.
   Texto herói ocupa 60-80% da largura. Elementos pequenos flutuando no vazio são o
   tell número um de vídeo feito por IA. Ao mesmo tempo, iniciantes exageram
   ícone e forma: reduza 25% e veja melhorar.
4. **Holofote.** Um elemento aceso por vez; o resto do que já foi desenhado fica
   quieto mas legível (ativo opacidade 1,0 · contexto ~0,56 · já usado ~0,33 ou some).
   Hierarquia vem da RAZÃO entre ativo e quieto, nunca de escurecer tudo. Rótulo
   herda o estado do seu elemento.
5. **Mundo persistente (vídeo explicativo longo).** Um espaço que nunca reseta: o
   que já apareceu continua onde estava, o novo é acrescentado. A **câmera é a
   edição**: aproximar = "olhe de perto o que você já entendeu"; afastar = o
   pagamento. Três altitudes (mundo / região / detalhe), movendo entre vizinhas.
   Defina a gramática espacial e mantenha (ex.: esquerda→direita = rumo ao
   resultado); quebre-a uma única vez, de propósito.
6. **Loop aberto visível.** Não diga "já voltamos nisso": deixe algo visivelmente
   incompleto (slots vazios, barra de capítulos, pipeline com um elo faltando),
   re-mostre em toda fronteira de seção, avance à vista e feche na imagem de
   abertura. Contador sempre com NOME junto do número.
7. **Paleta simbólica.** ≤5 cores ativas, cada uma com um significado nomeável
   (problema, solução, humano…). Se não sabe dizer o que a cor significa, ela não
   ganhou o lugar. Cores "dull" parecem caras; preto, branco e vermelho puros
   parecem amadores. Texto nunca branco puro sobre escuro (estoura): use off-white.
8. **Tipo é personagem.** Palavra a palavra (não letra a letra); a primeira
   palavra carrega o impulso e as seguintes decaem. Escala dramática. No punchline,
   o visual chega 0,15-0,2s ANTES do áudio: lê como inevitável.
9. **Segure o herói.** Logo ~2s, CTA/outro 4-6s (em reel curto, menos). Depois de
   ~7-8s de densidade, 1s de respiro. Caos cinético → calma = catarse.
10. **Uma textura unificadora** (grain leve, vinheta, grid, papel): a mesma em todas
    as cenas. Fundo nunca vazio: preto chapado parece "não carregou".
11. **Movimento só onde prova a fala.** "Motion em tudo é ruído." A câmera pode
    respirar (drift lento), mas cada cena tem UMA ambiente, não todas.
12. **Sem crossfade entre camadas cheias.** A transição tem significado: corte seco
    = acorda/ruptura; dissolve lento = deriva; whip com motion blur esconde o corte
    e dá energia. Câmera e wipe em sequência, nunca sobrepostos.
13. **Nunca linear.** `.out` para entrar (rápido e assenta), `.in` para sair (acelera
    e vai), `.inOut` para deslocar. Saída mais rápida que entrada (0,4s entra,
    0,25s sai). Varie eases (≥3 por cena), velocidades (a cena mais lenta 3× a mais
    rápida), direções e staggers. Overshoot (`back.out`) uma vez por seção, no beat
    que merece. Comece 0,1-0,3s depois do 0 (no 0 parece corte seco).
14. **Cena = construir / respirar / resolver**: 0-30% entram (stagger por ordem de
    importância, total <500ms), 30-70% vive com uma ambiente, 70-100% sai ou fecha.
15. **Duas jogadas seguidas no mesmo objeto parecem bug.** Zoom que termina e
    DEPOIS wipe que começa = "travou". Junte num gesto só, mesmo ease simétrico.
16. **Fontes falham calado.** Webfont que não carregou vira "quase Arial" sem erro.
    Confirme que carregou antes de renderizar (`document.fonts.check(...)`).
17. **Nada para de vez.** Agrupe o que anda junto num pai e mova o grupo; atrase cada filho
    2-3 quadros; comece o próximo movimento antes do anterior assentar. Movimentos sobrepostos
    viram um gesto contínuo; é a diferença entre "parece um site" e "parece um filme". Câmera
    idem: cada movimento num suporte próprio, encadeado, começando antes do anterior terminar.
18. **Gesto de mão humana.** Cursor anda em arco, nunca em linha reta; todo clique tem uma
    pressãozinha; o cursor hesita entre uma coisa e outra quando a história pede. Contador sobe
    em ~1s (legível, sem arrastar). Cards entram um de cada vez e o ✓ só aparece depois que o
    card pousou.
19. **Vetor no zoom, não print.** UI exportada como SVG fica nítida quando a câmera aproxima;
    screenshot borra. Telas desenhadas em outra largura (1440 num vídeo 1920): trave o canvas no
    tamanho do vídeo e posicione tudo a partir do centro.
20. **60 fps para câmera lenta.** Movimento lento a 24/30 fps treme. Para documentário e paralaxe,
    60 fps (o render dobra, vale).

Fontes de 17-20: Sanji Nai-Chien (vídeo de lançamento de SaaS feito com Claude, comparado lado
a lado com um motion designer, out/2026) e o breakdown do Mohit G. (`animacao-em-camadas.md`).

### Composição do quadro

- Dois pontos focais e três camadas (fundo tratado · conteúdo · acentos como
  linhas, rótulos, barras). Ancore nas bordas e use zonas (painel à esquerda,
  conteúdo à direita) em vez de pilha centralizada de página web.
- Regra dos três objetos (cena de objeto): principal no centro, apoio nas bordas,
  elementos de profundidade em volta.
- Monte o **quadro herói estático primeiro** (o momento com mais coisa visível),
  confira sobreposição, e só então anime as entradas *a partir* dele.
- Tokens fixos por vídeo: poucos tamanhos de tipo, poucas espessuras de traço,
  poucos raios. "Cada decisão local estava certa; nenhuma foi global" é como 18
  espessuras de traço viram ruído.
- 9:16 social: texto entre x 90-930 e y 200-1600; nada a <60px da borda.

### Antes de animar: estrutura

- **Bloqueie o tempo primeiro** (storyboard → keyframes dos momentos principais →
  só então o meio). O tempo de cada cena conta a história: dê tempo para o "hã?"
  antes da revelação.
- Atos: gancho ~20% · corpo ~55% · pagamento + fechamento ~25%. Regra de três
  (3 benefícios, 3 exemplos) ancora.
- **Os 3 primeiros segundos são uma edição à parte**: alguém tem que se convencer
  a ver até o fim, e tem que funcionar sem som (tema ou tensão no 1º quadro, outro
  estado revelado até o 3º segundo).
- Callback: um objeto plantado no começo volta transformado no fim.
- Linguagens visuais prontas para "roubar": Vox (narrador único, cutouts PB em
  meio-tom com traço de marcador, mapas e setas, legendas que socam no beat, fundo
  fixo de papel), Apple (ícone 3D com sombra macia, muito respiro, uma frase por
  tela), luxo/fashion (textural, lento), startup (sans moderna, branco/bege),
  documentário (movimento lento + callouts), 3Blue1Brown (matemática que se desenha).
  Documentário em camadas (pintura ou papel recortado com paralaxe, personagem que respira,
  transição por dentro de um objeto): `animacao-em-camadas.md`.

## 2 · Receitas (Remotion: `useCurrentFrame` + `interpolate`/`spring`; HyperFrames: GSAP pausado)

| Movimento | Receita |
|---|---|
| Entrada padrão | `cubic-bezier(0.16,1,0.3,1)` (Remotion `Easing.bezier(0.16,1,0.3,1)`), 0,3-0,6s |
| Pop com peso | spring damping ~12-14, scale 0.85→1; overshoot `(0.34,1.56,0.64,1)` |
| Palavra a palavra | y 30→0 + opacity, stagger 0,06-0,10s (abertura cinética) ou nas palavras da narração |
| Dolly através do texto | scale 1→8 + opacity→0, 1,5s, ease-in |
| Whip com rastro | faixa clara borrada atravessa em 0,3-0,4s; o corte cai no pico de brilho |
| Corte "cut-the-curve" | sai y −150 + blur 30px em 0,33s ease-in; entra de +150 com blur→0 em ~1s ease-out |
| Recolor sem corte | anima variáveis CSS (`--accent`) em 0,6s: mesma cena, significado novo |
| Pulso no caminho | SVG `stroke-dashoffset` 1→0 + brilho no nó ao chegar |
| Câmera entre paradas | `power2.inOut`, 1,2-2,3s, duração proporcional à distância |
| Contador | número sobe com ease + rótulo; termina em `tabular-nums` |
| Barra/linha de dados | barras crescem da base com overlap leve; linha se desenha com ponto na ponta |
| Liquid glass | gradiente diagonal rgba(255,255,255,.075→.025→.01→.055) + `backdrop-filter: blur(14px) saturate(1.12)` + highlight interno `inset 0 1px 0 rgba(255,255,255,.22)` + borda 1px; cantos 22px (card) / 34px (painel) |
| Luz que orbita | 2 elipses em `screen` (núcleo branco blur ~38px + halo 2×), cor caminhando |
| Respiro de fundo | gradiente radial que muda devagar + grain + vinheta |
| Flash de marca | tela inteira na cor da marca por um beat, objeto herói entra no flash |

Durações (dicionário GSAP medido): revelar palavra `expo.out` 0,20-0,33s · entrar
`power2.out` 0,2-0,5s · sair `power2.in` 0,2-0,33s · assentar card `back.out(1.2-1.5)`
0,3-0,5s · overshoot de UI `elastic.out(1,0.3)` 0,2s · deriva `sine.inOut` 2-4s.
Velocidade = peso: 0,15-0,3s urgência · 0,3-0,5s profissional · 0,5-0,8s luxo ·
0,8-2s cinematográfico.

## 3 · Vocabulário de técnicas (o que dá pra fazer)

**Libs aceitas no Remotion**: React/JSX/CSS/SVG · Tailwind (`@remotion/tailwind`) ·
ícones lucide-react/react-icons · 3D `@remotion/three` · Lottie `@remotion/lottie` ·
`@remotion/transitions` (slide, wipe, clock, iris, fade) · 37 effects (glow, blur,
chromaticAberration, lightLeak, noise, vignette, halftone, duotone, scanlines,
dropShadow, shine, wave…) · rough.js (marca-texto à mão) · `@remotion/google-fonts`.
Por motor: GSAP = coreografia de timeline precisa · D3 = dado vira animação (o dado
é o conteúdo) · Three.js vanilla = 3D simples · Lottie = micro-animação leve.

**Tipografia cinética**: pop-in 3×→1× com spring · typewriter (~1 char/quadro,
segura 3s) · palavras que empurram as outras · marca-texto crescendo atrás da
palavra-chave · highlight/círculo/rabisco desenhado na palavra.

**Profundidade e câmera**: parallax em camadas · blur de profundidade · Ken Burns ·
perspectiva 3D (`rotateX(20deg)` + leve oscilação) · blur→nítido de entrada.

**Tech/HUD**: glassmorphism com canto cortado · anéis tracejados girando · linha de
scanner · terminal Mac digitando · glitch ocasional (skew + hue-rotate).

**Produto/SaaS**: recriar a UI real em componentes (estrutura do shadcn, animada
por frame) · celular herói sobe da base · cartões de UI espalhados em profundidade ·
cursor clicando em chips · barra de capítulos com o ativo aceso · ícone 3D com
sombra de contato.

**Dados e mapas**: barras/linhas com glow · torre 3D por ranking · mapa com rota
desenhando e câmera seguindo (maplibre, sem Mapbox).

**Áudio-reativo**: barras de frequência (`@remotion/media-utils`) pulsando na música.

**Transição entre seções**: interpole a cor de fundo de uma seção para a outra
(preto→laranja); corte cru fica duro.

## 4 · Fluxo de trabalho

Estrutura e tempo primeiro → quadro herói estático → entradas → uma ambiente por
cena → transições → efeitos. Confira com `still` (1 quadro) durante; no fim,
`video/scripts/qa.mjs` (prancha + tiras de toda transição). Comece simples e
adicione camadas testando a cada passo. Itere na MESMA conversa (o contexto do
estilo se acumula) e mude uma coisa por vez, "mantendo todo o resto".
