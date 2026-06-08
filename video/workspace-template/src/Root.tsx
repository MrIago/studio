// Registra TODAS as composições. Cada vídeo vive em src/videos/<nome>/Video.tsx
// e exporta { Video, ID, FPS, DURATION, WIDTH, HEIGHT }. Adicione o seu abaixo.
import { Composition } from "remotion";

// 👇 importe seus vídeos aqui (1 linha por vídeo)
import * as hello from "./videos/hello/Video";

const VIDEOS = [hello];

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
      />
    ))}
  </>
);
