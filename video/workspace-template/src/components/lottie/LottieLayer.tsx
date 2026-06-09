// Bloco: toca um Lottie (.json em public/) como CAMADA dentro de um vídeo Remotion.
// Modalidade B — Lottie como elemento de uma cena. (Modalidade A = render isolado,
// ver src/videos/lottie-box/.) O .json pode ser escrito à mão (caixa lottie) ou
// convertido de SVG. Requer @remotion/lottie + lottie-web (no package.json do workspace).
import { AbsoluteFill, staticFile, continueRender, delayRender, cancelRender } from "remotion";
import { Lottie } from "@remotion/lottie";
import { useEffect, useState } from "react";

export const LottieLayer: React.FC<{ src: string; loop?: boolean; playbackRate?: number; style?: React.CSSProperties }> = ({ src, loop = false, playbackRate = 1, style }) => {
  const [data, setData] = useState<any>(null);
  const [handle] = useState(() => delayRender(`lottie:${src}`));
  useEffect(() => {
    fetch(staticFile(src))
      .then((r) => r.json())
      .then((j) => { setData(j); continueRender(handle); })
      .catch((e) => cancelRender(e)); // aborta o render com erro se o .json falhar (não pendura no timeout do delayRender)
  }, [handle, src]);
  if (!data) return null;
  return <AbsoluteFill style={style}><Lottie animationData={data} loop={loop} playbackRate={playbackRate} /></AbsoluteFill>;
};
