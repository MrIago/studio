import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.overrideWebpackConfig((c) => c);
// WebGL (Three.js) — necessário pra renderizar componentes 3D
Config.setChromiumOpenGlRenderer("angle");
