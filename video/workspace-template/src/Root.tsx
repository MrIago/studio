// Registra TODAS as composições — AUTO-DESCOBERTA via webpack require.context.
// Cada vídeo vive em src/videos/<nome>/Video.tsx e exporta { Video, ID, FPS,
// DURATION, WIDTH?, HEIGHT? } e, opcionalmente, { calculateMetadata, defaultProps }.
// NÃO precisa editar este arquivo ao criar um vídeo: o require.context acha sozinho.
// (Por isso o setup pode sobrescrever sem apagar nada.)
import { Composition } from "remotion";

// webpack (Remotion usa webpack, não Vite): require.context varre src/videos/*/Video.tsx
// @ts-expect-error require.context é do webpack
const ctx = require.context("./videos", true, /\/Video\.tsx$/);
const VIDEOS = ctx.keys().map((k: string) => ctx(k)).filter((m: any) => m && m.ID && m.Video);

export const RemotionRoot: React.FC = () => (
  <>
    {VIDEOS.map((v: any) => (
      <Composition
        key={v.ID}
        id={v.ID}
        component={v.Video}
        durationInFrames={v.DURATION}
        fps={v.FPS}
        width={v.WIDTH ?? 1920}
        height={v.HEIGHT ?? 1080}
        // opcionais: vídeo pode derivar fps/dims/duração dinamicamente (ex.: lottie-box)
        {...(v.calculateMetadata ? { calculateMetadata: v.calculateMetadata } : {})}
        {...(v.defaultProps ? { defaultProps: v.defaultProps } : {})}
      />
    ))}
  </>
);
