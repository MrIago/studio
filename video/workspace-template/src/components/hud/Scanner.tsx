// Linha de scanner vertical que varre a tela.
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const Scanner: React.FC<{ color?: string; period?: number }> = ({ color = "#28e0c8", period = 80 }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig();
  const x = interpolate(frame % period, [0, period], [0, width]);
  return <div style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 2, background: `linear-gradient(${color},transparent)`, opacity: 0.22, pointerEvents: "none" }} />;
};
