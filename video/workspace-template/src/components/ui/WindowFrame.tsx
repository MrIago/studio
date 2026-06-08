// Janela estilo macOS (traffic lights + barra de título) que envolve conteúdo.
// Entra com leve perspectiva 3D. Use pra simular terminal/navegador/app na tela.
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const WindowFrame: React.FC<{ title?: string; accent?: string; children: React.ReactNode; w?: number; h?: number }> = ({ title = "", accent = "#28e0c8", children, w = 1300, h = 720 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 22, mass: 1 }, durationInFrames: 26 });
  const y = interpolate(s, [0, 1], [80, 0]);
  const rx = interpolate(s, [0, 1], [16, 0]);
  return (
    <div style={{ width: w, height: h, transform: `perspective(1600px) rotateX(${rx}deg) translateY(${y}px)`, opacity: s,
      borderRadius: 16, overflow: "hidden", background: "#0d1117", border: "1px solid #1f2630",
      boxShadow: `0 40px 120px rgba(0,0,0,.6), 0 0 60px ${accent}22` }}>
      <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 18px", gap: 9, background: "#161b22", borderBottom: "1px solid #1f2630" }}>
        <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, textAlign: "center", color: "#8b98a5", fontSize: 18, fontFamily: "ui-monospace, monospace", marginRight: 50 }}>{title}</div>
      </div>
      <div style={{ height: h - 46, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
