// Linha de output/log que aparece (fade + slide) num delay. Pra simular terminal
// cuspindo resultado linha a linha.
import { interpolate, useCurrentFrame } from "remotion";

export const CodeLine: React.FC<{ from: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ from, children, style }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(frame, [from, from + 8], [-12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity: o, transform: `translateX(${x}px)`, fontFamily: "ui-monospace, monospace", ...style }}>{children}</div>;
};
