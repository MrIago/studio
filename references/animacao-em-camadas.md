# Animação em camadas (2.5D): pintura, foto ou papel recortado com profundidade

Dá vida a uma imagem parada: cada plano vira uma camada a uma distância da câmera, a câmera anda e
a paralaxe aparece; o personagem respira, pisca, mexe a mão; o vento mexe a capa; a cena passa para
a próxima por dentro de um objeto. É a linguagem de documentário animado e serve igual para um mundo
de papel recortado (cada recorte já é uma camada).

Fonte: breakdown de 4 h do Mohit G. ("Napoleon Project", out/2026, After Effects). Aqui está o
método traduzido para Remotion; onde o tutorial usa um plugin, vai o equivalente em código.

## 1 · Preparar a imagem

- **Decida o formato final antes de tudo.** O tutorial trabalha em 3840×2160. Para a câmera poder
  aproximar sem borrar, a imagem de origem precisa de folga: ~2× o quadro final na região onde a
  câmera chega mais perto.
- **Estender e aumentar com IA**: nenhum modelo é o melhor sempre; teste uns 2-3 (aqui:
  `gpt54Image2` edit, `gemini25Flash`, `seedream45`), rode 5-6 versões e **componha as melhores
  partes** (o céu de uma, o chão de outra). A IA dá opções; quem escolhe é o olho.
- **Gere o plano que falta**: quando a câmera recua, os pés do personagem flutuam se não houver chão.
  Gere um chão visto de cima com a imagem estendida como referência e use como piso (seção 5).
- Pesquise a história por trás das imagens e faça a beat table (câmera presa à narração) antes de
  separar: o roteiro diz quais planos precisam existir.

## 2 · Separar em camadas

- **Planos**: frente, meio(s) e fundo. Se há distância real dentro do fundo (castelo lá atrás, árvore
  mais perto), separe em dois: cada plano a mais é profundidade de verdade na paralaxe.
- **Por IA** (decomposição em camadas do Higgsfield; o Canva tem algo parecido): rápido, mas você não
  escolhe onde corta, a imagem inteira é regerada (perde qualidade e muda detalhes) e vai só até 2K.
  Bom para rascunho e para muitas imagens de baixo valor.
- **À mão** (qualidade): seleciona o objeto → máscara → duplica a camada → na de baixo, apaga o objeto
  com preenchimento generativo → junta. Repete do plano mais próximo para o fundo.
- **Todo buraco precisa de fundo pintado.** Quando a câmera anda, o que estava atrás do objeto aparece;
  área vazia denuncia o truque. O preenchimento não precisa ser perfeito onde fica escondido, só
  coerente de longe.
- Em código (papel recortado): cada peça já é uma camada; o trabalho é dar a cada uma a sua distância.
- Guarde o arquivo de camadas e uma cópia antes de mexer: refazer a separação custa caro.

## 3 · Textura dentro de cada camada, não por cima

O erro comum: uma textura por cima de tudo (overlay). Quando a câmera anda, ela fica parada como se
fosse a tela do aparelho. Textura de verdade está na imagem e anda com ela: aplique o grão/pincelada
**em cada camada** (no Remotion, dentro do componente de cada plano). Deixe o personagem limpo se ele
tiver que se destacar. Ajuste a força (contraste da textura, opacidade) e mantenha sutil.

⚠️ `mix-blend-mode: multiply` dentro de um grupo com filtro SVG falha em peça girada na resolução
cheia (aparece o grão branco cru). Use grão em PNG com transparência em vez de multiply.

## 4 · Personagem articulado

- **Separe** cabeça, braço, antebraço e mão em camadas; pinte o que fica escondido atrás de cada peça
  (pescoço, o corpo debaixo do braço, a capa atrás da cabeça). Mão de outra imagem serve se a original
  não presta: ajuste escala e giro até casar.
- **Ponto de giro na articulação** (pescoço, ombro, cotovelo, punho) e **encadeamento**: mão filha do
  antebraço, antebraço filho do braço. Dê nome a tudo. No Remotion: `<div>`s aninhadas com
  `transform-origin` na articulação e `rotate` por junta.
- **Piscar**: pálpebras recortadas de uma imagem de olhos fechados, mascaradas sobre o olho; fecha em
  ~10 quadros e abre; de vez em quando uma piscada dupla rápida; o ciclo repete a cada ~7 s.
- **Respiração**: rotação pequena e lenta na cabeça e nas mãos com ruído (`@remotion/noise`). Valores
  que funcionaram: frequência 0,3-0,5 por segundo e amplitude ~8-16 na cabeça; 0,2 e ~8 na mão. Rápido
  ou grande demais vira tremedeira.
- **Pescoço**: cabeça que gira abre um vão. Ponha atrás dela uma forma com gradiente da cor da pele,
  ou uma cópia da cabeça mais abaixo, mascarada no formato do pescoço, com borda suavizada.
- **Cotovelo que quebra** ao esticar: a articulação está no lugar errado ou falta material; estique o
  braço na imagem e recorte a quina com uma máscara.
- **Vento** (capa, crina, véu, cabelo): deslocamento ondulado só na área mascarada (no Remotion,
  `feTurbulence` + `feDisplacementMap` com a semente andando, ou tiras com seno). Encolha a máscara do
  original alguns pixels para esconder a emenda. É caro no render: use em poucas peças.

## 5 · Câmera e profundidade

- **Afaste a camada e aumente a escala na mesma proporção**: vista da câmera, ela fica igual; a
  paralaxe só aparece quando a câmera anda. No Remotion, um palco com `perspective` e
  `transform-style: preserve-3d`; cada plano com `translateZ(-d)` e `scale(1 + d / perspective)`; a
  câmera é o `transform` do mundo inteiro. Para 3D de verdade, `@remotion/three` com planos texturizados.
- **Lente**: curta (24 mm) = muita paralaxe com pouco movimento; longa (85-100 mm) achata. O tutorial
  ficou em ~44 mm. No CSS, `perspective` menor = lente mais curta.
- **Câmera lisa**: nunca anime a câmera direto. Cada movimento é um "suporte" (no AE, um null; no
  Remotion, um wrapper com seu próprio `progress`) encadeado ao anterior, e **cada movimento começa
  antes do anterior terminar**. Os movimentos sobrepostos viram um só, contínuo. Mexer no primeiro
  suporte move tudo o que vem depois: ajuste sempre o último.
- **60 fps** em câmera lenta: a 24/30 fps o movimento lento treme. Custa render, vale.
- **Curvas**: empurrar rápido no começo e assentar devagar na chegada; caminho do movimento em curva
  (bezier), nunca quinas retas entre paradas.
- **Chão, reflexo e sombra**: piso girado 90° sob os pés, com a perspectiva casada à da imagem e as
  bordas estendidas (repetir a borda); reflexo = cópia da parede/mesa espelhada na base com ~25-28%
  de opacidade; sombra de contato só no chão (máscara para não subir na parede).
- **Dolly zoom**: a câmera avança enquanto o fundo cresce de escala. Vertigem, momento dramático.
- **Elementos vivos**: pássaros, neve, faíscas em sequência de PNG (feitos no Blender ou por código),
  presos ao plano certo da profundidade e tingidos para casar com a cena.

## 6 · Transições com significado

- **Por dentro de um objeto**: o objeto vem até a câmera (no tutorial, a espada sai de trás da mesa
  em arco, girando), a silhueta dele vira a máscara que revela a próxima cena, a câmera atravessa com
  uma leve distorção de lente na borda e a cena nova assume o quadro. O fundo escurece (tinta + leve
  desfoque) e uma faixa de luz corre pelo objeto enquanto ele entra.
- **Luma matte** (fogo, tinta, fumaça): o vídeo da transição vira máscara: onde fica claro, aparece a
  cena nova (a que sai usa a máscara invertida). Ponha a transição no pico de velocidade da câmera.
- **Mesma pessoa, cena nova, mesma escala**: na troca entre duas versões do personagem, ajuste a
  escala para os dois ocuparem o mesmo lugar; a transição conta a história (no tutorial: "ele não
  estava a cavalo, estava numa mula").
- **Caixa de texto do mundo**: retângulo com gradiente radial, contorno, borda irregular, sombra e a
  mesma textura das camadas: parece pertencer à cena.

## 7 · No mundo de papel

Cada recorte é uma camada; o grão vai dentro de cada peça; personagens com poses e articulações viram
marionetes; a câmera do palco faz a paralaxe. Objetos do próprio mundo carregam as transições
(polaroide que voa até a câmera e revela a próxima cena, confete como máscara). O que fica escondido
atrás de um papel opaco não deve ser desenhado: filtro SVG em dezenas de recortes pesa muito no render
(ver `remotion-gotchas.md`, render pesado).
