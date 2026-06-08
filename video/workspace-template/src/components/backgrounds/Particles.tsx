// Partículas geométricas (triângulos/círculos) flutuando — dá vida ao fundo.
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";

export const Particles: React.FC<{ n?: number; a?: string; b?: string }> = ({ n = 24, a = "#28e0c8", b = "#9acd32" }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(n).fill(0).map((_, i) => {
        const s = i + 1;
        const x = random(`x${s}`) * width;
        const y = ((random(`y${s}`) * height) + frame * (0.4 + random(`v${s}`))) % height;
        const sz = 3 + random(`z${s}`) * 5; const tri = random(`t${s}`) > 0.5;
        return <div key={i} style={{
          position: "absolute", left: x, top: y, width: sz, height: sz,
          opacity: 0.1 + random(`o${s}`) * 0.2, background: tri ? "transparent" : a,
          borderLeft: tri ? `${sz}px solid transparent` : undefined,
          borderRight: tri ? `${sz}px solid transparent` : undefined,
          borderBottom: tri ? `${sz * 1.6}px solid ${b}` : undefined,
          borderRadius: tri ? 0 : "50%", transform: `rotate(${frame * 0.8}deg)`,
        }} />;
      })}
    </AbsoluteFill>
  );
};
