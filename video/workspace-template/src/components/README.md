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

- **backgrounds/** — `LiveBg` (gradiente respirando), `ImageBg` (Ken Burns), `Particles`
- **text/** — `BigTitle` (pop-in + glow), `GlitchText` (RGB glitch)
- **hud/** — `Corners` (brackets), `Scanner` (linha varrendo), `CinematicOverlay` (vignette+scanlines)
- **audio/** — `AudioBars` (espectro reativo à música)
- **3d/** — `MetalKnot` (torus knot metálico + órbitas; requer WebGL no render)
- **hooks/** — `motion.ts` (`useEnter`, `useFade`), `palette.ts`

## Criando um bloco novo

1. Crie `components/<categoria>/<Nome>.tsx` (ou nova categoria).
2. Anime SEMPRE por `useCurrentFrame()` — nunca CSS animation/transition nem
   `useFrame` do fiber (não renderizam / dão flicker).
3. Aceite props pra cor/tamanho/timing (reutilizável). Comente o que faz no topo.
4. Documente 1 linha aqui. Pronto — virou repertório permanente.

## shadcn/ui (UI em vídeos de produto/demo)

Pra vídeos que RECRIAM interface (terminal, cards, chat, botões — ex: "demo de
produto"), o shadcn está disponível (`components/ui/`). Use a ESTRUTURA visual dos
componentes, mas a ANIMAÇÃO vem do `spring`/`interpolate` (as CSS animations do
shadcn não renderizam no Remotion). Adicione um componente: `npx shadcn@latest add card`.
