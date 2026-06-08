// Brackets de canto (moldura HUD tech).
import { AbsoluteFill } from "remotion";

export const Corners: React.FC<{ color?: string }> = ({ color = "#9acd32" }) => {
  const len = 42, t = 3, m = 50;
  const C = (s: React.CSSProperties) => (
    <div style={{ position: "absolute", width: len, height: len, ...s }}>
      <div style={{ position: "absolute", background: color, opacity: 0.5, top: s.top !== undefined ? 0 : undefined, bottom: s.bottom !== undefined ? 0 : undefined, left: s.left !== undefined ? 0 : undefined, right: s.right !== undefined ? 0 : undefined, width: len, height: t }} />
      <div style={{ position: "absolute", background: color, opacity: 0.5, top: s.top !== undefined ? 0 : undefined, bottom: s.bottom !== undefined ? 0 : undefined, left: s.left !== undefined ? 0 : undefined, right: s.right !== undefined ? 0 : undefined, width: t, height: len }} />
    </div>
  );
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{C({ top: m, left: m })}{C({ top: m, right: m })}{C({ bottom: m, left: m })}{C({ bottom: m, right: m })}</AbsoluteFill>;
};
