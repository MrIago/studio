// Cena de feature focada: ícone (lucide) num card com glow + título + subtítulo.
// Passe o componente de ícone (ex: import { Mic } from "lucide-react").
import { AbsoluteFill, interpolate } from "remotion";
import { useEnter } from "../hooks/motion";

export const FeatureSolo: React.FC<{ Icon: React.ComponentType<any>; title: string; sub: string; color?: string }> = ({ Icon, title, sub, color = "#9acd32" }) => {
  const s = useEnter(0, 16);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`, opacity: s, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ width: 150, height: 150, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}11`, border: `1px solid ${color}33`, boxShadow: `0 0 50px ${color}33` }}>
          <Icon size={84} color={color} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 18px ${color}aa)` }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 92, fontWeight: 800, color: "#f2fff6", letterSpacing: -2, lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 34, color: "#9fbfa8", lineHeight: 1 }}>{sub}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
