// Fundo de IMAGEM com Ken Burns sutil (só zoom leve, sem deslize) + escurecido.
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const ImageBg: React.FC<{ src: string; durSec: number; dim?: number }> = ({ src, durSec, dim = 0.82 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const scale = interpolate(frame, [0, durSec * fps], [1.05, 1.12], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(8,12,10,.35), rgba(8,12,10,${dim}))` }} />
    </AbsoluteFill>
  );
};
