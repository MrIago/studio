// EXEMPLO de vídeo — mostra como montar uma cena com os BLOCOS.
// Copie esta pasta pra criar um vídeo novo, ou peça pra skill criar sob medida.
import { AbsoluteFill } from "remotion";
import { LiveBg } from "../../components/backgrounds/LiveBg";
import { Particles } from "../../components/backgrounds/Particles";
import { Corners } from "../../components/hud/Corners";
import { Scanner } from "../../components/hud/Scanner";
import { BigTitle } from "../../components/text/BigTitle";

export const ID = "hello";
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = FPS * 5;

export const Video: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#080c0a", fontFamily: "system-ui, sans-serif" }}>
    <LiveBg />
    <Particles />
    <Scanner />
    <BigTitle text="studio" sub="seu workspace de vídeo está pronto" />
    <Corners />
  </AbsoluteFill>
);
