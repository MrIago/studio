// Barras de espectro áudio-reativas (pulsam na música). Passe o src do áudio.
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";

export const AudioBars: React.FC<{ src: string; n?: number; a?: string; b?: string }> = ({ src, n = 56, a = "#28e0c8", b = "#9acd32" }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig();
  const { audioData } = useWindowedAudioData({ src: staticFile(src), frame, fps, windowInSeconds: 30 });
  if (!audioData) return null;
  const freqs = visualizeAudio({ fps, frame, audioData, numberOfSamples: 64 }).slice(0, n);
  const bw = width / n;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", flexDirection: "row", alignItems: "flex-end", opacity: 0.42, pointerEvents: "none" }}>
      {freqs.map((v, i) => <div key={i} style={{ width: bw * 0.5, marginRight: bw * 0.5, height: Math.max(3, v * 850), background: `linear-gradient(${a},${b})`, borderRadius: 3 }} />)}
    </AbsoluteFill>
  );
};
