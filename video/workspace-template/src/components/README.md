# components/ — blocos de motion design (estilo shadcn)

⚠️ **Estes são BLOCOS, não uma biblioteca fechada.** Cada componente é um arquivo
próprio que você **copia/importa quando precisa** — e se o que você precisa **não
existe, CRIE um novo arquivo aqui**. O repertório cresce a cada vídeo.

**Nunca pense "só dá pra fazer o que está aqui".** Estes são pontos de partida
testados. O Remotion é React — você pode criar qualquer efeito novo (shader,
animação, layout) e salvar como um bloco pro futuro.

## Como usar

Importe só o bloco que a cena precisa (progressive disclosure — não puxe tudo):

```tsx
import { LiveBg } from "../../components/backgrounds/LiveBg";
import { BigTitle } from "../../components/text/BigTitle";
import { useFade } from "../../components/hooks/motion";
```

## Categorias (cresça à vontade)

- **backgrounds/** — `LiveBg` (gradiente respirando), `ImageBg` (Ken Burns), `Particles`,
  `FloatingIcons` (PNGs em stagger + flutuação contínua), `Gallery` (grid de imagens)
- **text/** — `BigTitle` (pop-in + glow), `GlitchText` (RGB glitch), `FeatureSolo` (destaque de 1 feature)
- **hud/** — `Corners` (brackets), `Scanner` (linha varrendo), `CinematicOverlay` (vignette+scanlines)
- **audio/** — `AudioBars` (espectro reativo à música), `PlayPill` (botão play + waveform reativa)
- **ui/** — `WindowFrame` (janela macOS), `Typewriter` (texto digitando), `CodeLine` (linha de código)
- **3d/** — `MetalKnot` (torus knot metálico + órbitas; requer WebGL no render)
- **lottie/** — `LottieLayer` (toca um `.json` Lottie como camada de vídeo). Pra
  GERAR o Lottie use a caixa `lottie`/`svgToLottie` (ver `references/lottie.md`); pra
  render isolado .json→MP4 use a composição `src/videos/lottie-box/`. Lottie =
  single-scene curto/vetorial; vídeo multi-shot = Remotion normal.
- **hooks/** — `motion.ts` (`useEnter`, `useFade`), `palette.ts`

## Criando um bloco novo

1. Crie `components/<categoria>/<Nome>.tsx` (ou nova categoria).
2. Anime SEMPRE por `useCurrentFrame()` — nunca CSS animation/transition nem
   `useFrame` do fiber (não renderizam / dão flicker).
3. Aceite props pra cor/tamanho/timing (reutilizável). Comente o que faz no topo.
4. Documente 1 linha aqui.

> ⚠️ **Onde criar pra ser PERMANENTE:** esta engine (`~/.studio-engine/src/components/`)
> é um espelho descartável — o `setup.mjs` a regenera do template da skill a cada
> rodada (é assim que correções de blocos chegam via `/plugin update`). Um bloco
> reutilizável que você queira manter deve ser criado na FONTE versionada da skill:
> `video/workspace-template/src/components/<categoria>/`. Bloco criado só aqui na
> engine é efêmero (vale pro vídeo atual, some no próximo setup).

## shadcn/ui (UI em vídeos de produto/demo)

Pra vídeos que RECRIAM interface (terminal, cards, chat, botões — ex: "demo de
produto"), o shadcn está disponível (`components/ui/`). Use a ESTRUTURA visual dos
componentes, mas a ANIMAÇÃO vem do `spring`/`interpolate` (as CSS animations do
shadcn não renderizam no Remotion). Adicione um componente: `npx shadcn@latest add card`.
