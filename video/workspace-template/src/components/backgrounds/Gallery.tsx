// Galeria de imagens que entram em cascata (stagger) com leve rotação.
// Bom pra mostrar exemplos/portfólio. Passe os src (em public/).
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Gallery: React.FC<{ srcs: string[]; size?: number; title?: string }> = ({ srcs, size = 300, title }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {title && <div style={{ position: "absolute", top: 80, fontSize: 30, color: "#28e0c8", letterSpacing: 5, textTransform: "uppercase" }}>{title}</div>}
      <div style={{ display: "flex", gap: 26 }}>
        {srcs.map((src, i) => {
          const s = spring({ frame: frame - (6 + i * 7), fps, config: { damping: 14 }, durationInFrames: 20 });
          const rot = interpolate(s, [0, 1], [i % 2 ? 12 : -12, i % 2 ? 3 : -3]);
          return <div key={i} style={{ transform: `scale(${s}) rotate(${rot}deg)`, opacity: s, width: size, height: size, borderRadius: 22, overflow: "hidden", border: "2px solid #9acd3244", boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
