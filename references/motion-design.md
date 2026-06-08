# Motion design profissional com Remotion (vocabulário de técnicas)

Este é o **leque de possibilidades** — NÃO uma receita. ⚠️ **Cada vídeo é único:**
analise a **paleta**, a **comunicação** (público/mensagem/tom), o **conteúdo** e o
**formato** do caso à frente, e então escolha/combine as técnicas que servem. Nunca
hardcode o estilo de um exemplo no próximo. Os 21 prompts em `video/examples/showcase/`
são inspiração pra descobrir o que dá pra fazer — não pra clonar.

O Remotion é **React** — cada frame é um componente; animação = função do frame
(`useCurrentFrame` + `interpolate`/`spring`). NÃO use CSS animation/transition nem GSAP
por tempo-real (não renderizam); o `spring`/`interpolate` nativo faz tudo de forma
determinística. **Vídeo bom não é slide com fade — é camadas + física + ritmo.** Abaixo
o vocabulário pra subir o nível.

## Aceita (libs/recursos)
- **React/JSX/CSS/SVG** (base) · **Tailwind** (`@remotion/tailwind`)
- **Ícones**: lucide-react, react-icons — importa como componente e anima
- **3D**: `@remotion/three` (React Three Fiber) — SVG/objeto 3D, material metálico, luz
- **Lottie**: `@remotion/lottie` — animações de designer (After Effects)
- **Transições**: `@remotion/transitions` — slide, wipe, clock, iris, fade
- **Effects** (37 nativos): glow, blur, chromaticAberration, lightLeak, noise, vignette,
  halftone, duotone, scanlines, dropShadow, hue, grayscale, dotGrid, shine, wave…
- **rough.js** (highlighter/marca desenhada à mão) · **tesseract** (OCR p/ achar texto numa imagem)
- **Fontes**: `@remotion/google-fonts` (Knewave, Poppins Black, etc.) ou locais

## Técnicas que fazem parecer profissional (do showcase oficial)

**Tipografia cinética**
- Pop-in dramático: texto escala de 3x→1x com spring (impacto)
- Typewriter: ~1 char/frame, segura 3s depois de digitar
- Word-by-word: palavras "crasham" e empurram as existentes (layout smoothing elástico)
- Highlight: marca-texto cresce da esquerda→direita sobre palavras-chave (rough.js, atrás do texto)

**Profundidade & câmera**
- Parallax: camadas em velocidades diferentes; depth-of-field blur no fundo
- Zoom contínuo com easing (Ken Burns forte, ou zoom-in 125% num canto)
- Perspectiva 3D: `rotateX(20deg)` + leve oscilação de `rotateY` (terminal/card flutuando)
- Blur→unblur de entrada (1s) pra foco

**Elementos tech/HUD**
- Glassmorphism: painel semi-transparente + `clip-path` de canto cortado, desliza de -600px
- Rings/anéis tracejados girando, pulse circles, brackets de canto animados
- Scanner line vertical, partículas geométricas flutuando (triângulos/hexágonos)
- Matrix data streams caindo, glitch ocasional (skew + hue-rotate)
- Mac terminal (traffic lights) digitando comando char a char + output progressivo

**Ritmo & transições**
- Casar o corte com a batida (ex: 140 BPM) — cortes no beat
- Stagger: itens entram em cascata (title→tagline→input→controls, com delays)
- Saída: elementos rotacionam -15° e encolhem a zero; iris wipes, ring tunnels entre cenas
- Spring physics em TUDO (entradas, flutuação contínua, overshoot)

**Cor & textura**
- Paleta restrita: 1 accent forte (ex: NVIDIA green #76B900, azure #0b84f3, amber #fbbf24) sobre dark/black
- Fundo: gradiente radial "respirando" (anima devagar), ruído sutil, vignette
- Grão de filme + light leak = sensação cinematográfica

## Estrutura de um vídeo pro (não slides)
1. **Cenas** (`<Sequence>` por cena), cada uma com várias **camadas** (fundo, elementos, texto, overlay).
2. Cada camada anima por conta própria (entrada com spring + vida contínua: flutuação/rotação/brilho).
3. **Ritmo**: sincronize cortes/entradas com a narração (timestamps via `transcribe()`) e/ou a batida da música.
4. **Continuidade**: transições entre cenas (wipe/iris), não corte seco; elementos que persistem dão coesão.
5. **Detalhe constante**: sempre tem algo se movendo sutilmente (partículas, scanner, gradiente) — tela nunca "morta".

## Mais padrões (do showcase completo, 21 prompts)

**Áudio-reativo** (audio-spectrum): N barras de frequência que pulsam no bass/mid/high
de um mp3, gradiente magenta→ciano, glow, topo arredondado, reflexo no chão glossy.
Use `@remotion/media-utils` (`useAudioData`/`visualizeAudio`) — combina com a música da skill.

**Counter animado** (cd-store): número sobe até X com "+" (ease), label embaixo. Bom p/ stats.

**Data viz** (bar-line-chart): barras crescem da base em sequência (overlap leve) + linha
que se desenha progressiva com glow + dot pulsante na ponta + eixos. Spring timing.

**Cards deslizando** (cd-store/launch): N cards (gradiente/feature) entram um a um em fila,
stagger. Base de "grid de features" de produto.

**Lower-third / overlay transparente** (CTA): faixa que desliza de baixo com avatar+nome+texto;
botão (ex: subscribe) com press ease-out + release spring bounce. Render `prores` p/ transparência.

**Morph de formas → letras** (shape-to-words): formas geométricas com "breathing" idle →
pulam, giram 180°, **morfam (flubber)** em letras, com ghost-trail. damping 14 (pulo) vs 300 (wipe lento).

**Pixel-building** (3d-retro-pixel-font): cursores voam, se posicionam e "constroem" texto
em blocos de pixel que acendem um a um (como editar código a várias mãos).

**3D data tower** (threejs-games): boxes 3D com altura = valor; câmera viaja de baixo→cima
parando em cada rank. React Three Fiber, 60fps.

**Mapa + rota** (travel/strava): mapa, zoom, linha animada entre pontos, câmera segue a rota,
landmark 3D. `@remotion/maps`/maplibre. Bom p/ storytelling geográfico.

**Apple-presentation style** (vvterm): minimal, muito respiro, fundo escuro, fonte Inter/nerd,
texto entra limpo e centrado, ritmo calmo e elegante (menos é mais).

**Recriar UI do produto** (pres053cut/launch): replicar a tela do app em componentes React
(terminal Mac com traffic lights digitando, janelas, sidebars, chat streaming) — demo sem screencast.

**Transições entre seções importam**: interpolar a COR de fundo de uma seção pra outra
(ex: black→orange) deixa o corte suave; cru fica "duro". Sempre suavize a passagem.

## Workflow
Itere com `still` (1 frame) pra conferir composição; **preview** (Studio 3007) pro usuário
ver o movimento e aprovar; **render** só no fim. Comece simples e ADICIONE camadas
(fundo animado → texto cinético → elementos HUD → effects → transições) — testando a cada passo.

Referência viva: os 21 prompts em remotion.dev/prompts (categorias: motion-graphics-and-3d,
product-and-marketing, content-and-social, maps-and-data, audio). Leia o prompt da
categoria mais próxima do pedido pra pegar técnicas concretas.
