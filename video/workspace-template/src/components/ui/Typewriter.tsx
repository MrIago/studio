// Texto que digita caractere a caractere (~cps chars/seg) + cursor piscando.
// Comece em `from` (frame). Bom pra terminal/prompt sendo escrito.
import { useCurrentFrame, useVideoConfig } from "remotion";

export const Typewriter: React.FC<{ text: string; from?: number; cps?: number; style?: React.CSSProperties; cursor?: boolean }> = ({ text, from = 0, cps = 28, style, cursor = true }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const elapsed = Math.max(0, (frame - from) / fps);
  const n = Math.min(text.length, Math.floor(elapsed * cps));
  const done = n >= text.length;
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={style}>{text.slice(0, n)}{cursor && (!done || blink) && <span style={{ opacity: done && !blink ? 0 : 1, color: "#9acd32" }}>▌</span>}</span>
  );
};
