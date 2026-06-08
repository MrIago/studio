// "Pílula" de player: botão play + waveform reativa ao áudio. Mostra que está
// tocando uma amostra. Passe o src (em public/) e from (frame que começa a tocar).
import { staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";

export const PlayPill: React.FC<{ src: string; label: string; from: number; accent?: string }> = ({ src, label, from, accent = "#9acd32" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const { audioData } = useWindowedAudioData({ src: staticFile(src), frame: Math.max(0, frame - from), fps, windowInSeconds: 10 });
  const bars = audioData ? visualizeAudio({ fps, frame: Math.max(0, frame - from), audioData, numberOfSamples: 16 }) : new Array(16).fill(0.02);
  const playing = frame >= from;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderRadius: 50, background: "rgba(20,28,22,.85)", border: `1px solid ${accent}44` }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 0, height: 0, borderLeft: "16px solid #0b140e", borderTop: "10px solid transparent", borderBottom: "10px solid transparent", marginLeft: 4 }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: "#f2fff6", minWidth: 180 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 44 }}>
        {bars.map((v, i) => <div key={i} style={{ width: 5, height: Math.max(4, (playing ? v : 0.02) * 300), background: accent, borderRadius: 3 }} />)}
      </div>
    </div>
  );
};
