// Fundo VIVO que "respira" — gradiente radial que pulsa e se move devagar.
// Use pra cenas sem imagem (nunca deixe preto morto).
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const LiveBg: React.FC<{ a?: string; b?: string }> = ({ a = "#28e0c8", b = "#9acd32" }) => {
  const frame = useCurrentFrame();
  const breath = 0.5 + Math.sin(frame / 40) * 0.5;
  const cx = 50 + Math.sin(frame / 70) * 12, cy = 42 + Math.cos(frame / 90) * 8;
  return <AbsoluteFill style={{
    background: `radial-gradient(ellipse at ${cx}% ${cy}%, ${a}22, #0b140e 55%), radial-gradient(ellipse at ${100 - cx}% 80%, ${b}18, transparent 50%)`,
    opacity: 0.85 + breath * 0.15,
  }} />;
};
