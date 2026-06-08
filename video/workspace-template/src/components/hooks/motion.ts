// Hooks de animação base. Todo movimento no Remotion é função do frame.
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// spring de entrada (delay em frames, dur, damping). Retorna 0→1.
export const useEnter = (delay = 0, dur = 16, damping = 200) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping }, durationInFrames: dur });
};

// fade in/out de uma cena inteira. durSec em SEGUNDOS. Retorna a opacidade.
export const useFade = (durSec: number) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const d = durSec * fps; const edge = Math.min(10, d / 2 - 1);
  return interpolate(frame, [0, edge, d - edge, d], [0, 1, 1, 0], { extrapolateRight: "clamp" });
};
