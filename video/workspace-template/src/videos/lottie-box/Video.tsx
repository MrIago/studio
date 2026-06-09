// Composição de render ISOLADO de um Lottie (modalidade A): .json → MP4/transparente.
// calculateMetadata DERIVA fps/dims/duração do PRÓPRIO Lottie (não de constantes) —
// assim qualquer Lottie (60fps, dims/duração quaisquer) renderiza certo sem flags na mão.
//   node video/scripts/render.mjs lottie-box <projeto> --props='{"file":"<proj>/x.json"}'
// (o render.mjs copia o .json de ~/studio/<proj>/ pro public da engine automaticamente.)
import { AbsoluteFill, staticFile } from "remotion";
import { getLottieMetadata } from "@remotion/lottie";
import { LottieLayer } from "../../components/lottie/LottieLayer";

export const ID = "lottie-box";
// FPS/WIDTH/HEIGHT/DURATION = fallback estático (Root usa pra registrar; calculateMetadata sobrepõe no render).
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1080;
export const DURATION = 150;
export const defaultProps = { file: "" }; // props nunca chega null no calculateMetadata

// deriva fps/dims/duração reais do Lottie apontado por props.file.
// Totalmente defensivo: sem file / fetch falho / metadata nula → mantém os valores
// estáticos (FPS/WIDTH/...). SEMPRE retorna um objeto de metadata (nunca null —
// o Remotion lê .props/.durationInFrames do retorno; null quebra `compositions`).
export const calculateMetadata = async (ctx: any) => {
  const base = { durationInFrames: DURATION, fps: FPS, width: WIDTH, height: HEIGHT, props: ctx?.props ?? {} };
  try {
    const file = ctx?.props?.file;
    if (!file) return base;
    const data = await fetch(staticFile(file)).then((r) => r.json());
    const m = getLottieMetadata(data); // {durationInFrames, fps, width, height} | null
    if (!m) return base;
    return { durationInFrames: m.durationInFrames, fps: m.fps, width: m.width, height: m.height, props: ctx?.props ?? {} };
  } catch {
    return base;
  }
};

export const Video: React.FC<{ file?: string }> = ({ file }) => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    {file ? <LottieLayer src={file} loop={false} /> : null}
  </AbsoluteFill>
);
