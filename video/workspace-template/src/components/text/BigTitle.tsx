// Título grande com pop-in (escala 2.4x→1x), glow e linha de destaque crescente.
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";
import { useEnter } from "../hooks/motion";

export const BigTitle: React.FC<{ text: string; sub?: string; color?: string; glow?: string }> = ({ text, sub, color = "#f2fff6", glow = "#9acd32" }) => {
  const frame = useCurrentFrame();
  const s = useEnter(0, 22, 12);
  const scale = interpolate(s, [0, 1], [2.4, 1]);
  const lineW = interpolate(frame, [10, 34], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const subO = interpolate(frame, [16, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 168, fontWeight: 800, letterSpacing: -4, color, transform: `scale(${scale})`, textShadow: `0 0 60px ${glow}99` }}>{text}</div>
        <div style={{ height: 6, width: lineW * 360, margin: "18px auto 0", background: `linear-gradient(90deg,#9acd32,#28e0c8)`, borderRadius: 4, boxShadow: "0 0 28px #28e0c8" }} />
        {sub && <div style={{ fontSize: 34, color: "#bfe9d6", marginTop: 22, opacity: subO }}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};
