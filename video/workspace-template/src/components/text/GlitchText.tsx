// Texto com glitch RGB (camadas ciano/magenta com offset ocasional).
import { random, useCurrentFrame } from "remotion";

export const GlitchText: React.FC<{ text: string; size?: number; color?: string }> = ({ text, size = 180, color = "#f2fff6" }) => {
  const frame = useCurrentFrame();
  const g = random(`g${Math.floor(frame / 4)}`);
  const off = g > 0.82 ? (random(`gx${frame}`) - 0.5) * 14 : 0;
  const L = ({ c, dx }: { c: string; dx: number }) => (
    <div style={{ position: "absolute", inset: 0, color: c, transform: `translateX(${dx}px)`, mixBlendMode: "screen", fontSize: size, fontWeight: 800, letterSpacing: -5, display: "flex", justifyContent: "center", alignItems: "center" }}>{text}</div>
  );
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minWidth: size * 3, minHeight: size }}>
      {off !== 0 && <L c="#28e0c8" dx={-off} />}
      {off !== 0 && <L c="#ff3b6b" dx={off} />}
      <div style={{ position: "relative", fontSize: size, fontWeight: 800, letterSpacing: -5, color, textShadow: "0 0 70px #9acd3299" }}>{text}</div>
    </div>
  );
};
