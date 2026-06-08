// Overlay cinematográfico: vignette + scanlines sutis.
import { AbsoluteFill } from "remotion";

export const CinematicOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,.55))" }} />
    <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.06) 3px 4px)" }} />
  </AbsoluteFill>
);
