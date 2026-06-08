// Ícones (PNG transparentes em public/) entrando em stagger + flutuação contínua.
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const FloatingIcons: React.FC<{ srcs: string[]; size?: number; title?: string }> = ({ srcs, size = 180, title }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {title && <div style={{ position: "absolute", top: 80, fontSize: 30, color: "#28e0c8", letterSpacing: 5, textTransform: "uppercase" }}>{title}</div>}
      <div style={{ display: "flex", gap: 70 }}>
        {srcs.map((src, i) => {
          const s = spring({ frame: frame - (6 + i * 6), fps, config: { damping: 200 }, durationInFrames: 16 });
          const floatY = Math.sin((frame + i * 20) / 18) * 14;
          return <div key={i} style={{ transform: `translateY(${interpolate(s, [0, 1], [50, floatY])}px) scale(${s})`, opacity: s, width: size, height: size, filter: "drop-shadow(0 0 24px #28e0c866)" }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>;
        })}
      </div>
    </AbsoluteFill>
  );
};
