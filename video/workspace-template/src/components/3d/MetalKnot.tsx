// Cena 3D: torus knot metálico girando + esferas orbitando (data points) +
// anel tracejado. Câmera "voa" pra dentro na entrada. Tudo via useCurrentFrame
// (obrigatório no Remotion — NUNCA useFrame do fiber, causa flicker no render).
// Requer @remotion/three + three + @react-three/fiber, e WebGL no render
// (Config.setChromiumOpenGlRenderer("angle")).
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";

export const MetalKnot: React.FC<{ a?: string; b?: string }> = ({ a = "#28e0c8", b = "#9acd32" }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, mass: 1.2 }, durationInFrames: 50 });
  const camZ = interpolate(intro, [0, 1], [14, 6]);
  const objScale = interpolate(intro, [0, 1], [0, 1.4]);
  const rotY = frame * 0.018, rotX = Math.sin(frame / 50) * 0.25;

  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, camZ], fov: 50 }} style={{ position: "absolute" }} gl={{ antialias: true }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} />
      <pointLight position={[-6, -2, 4]} intensity={120} color={a} />
      <pointLight position={[6, 4, 2]} intensity={90} color={b} />
      <mesh rotation={[rotX, rotY, 0]} scale={objScale}>
        <torusKnotGeometry args={[1.1, 0.34, 220, 32]} />
        <meshStandardMaterial color={"#16201a"} metalness={0.95} roughness={0.18} emissive={b} emissiveIntensity={0.12} />
      </mesh>
      {new Array(18).fill(0).map((_, i) => {
        const ang = (i / 18) * Math.PI * 2 + frame * 0.01;
        const r = 3.4 + Math.sin(frame / 30 + i) * 0.2;
        const yo = Math.sin(ang * 2 + frame / 20) * 0.6;
        return (
          <mesh key={i} position={[Math.cos(ang) * r, yo, Math.sin(ang) * r]} scale={0.09 * objScale}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={i % 2 ? a : b} emissive={i % 2 ? a : b} emissiveIntensity={0.8} toneMapped={false} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2.2, -rotY * 0.6, 0]} scale={objScale}>
        <torusGeometry args={[3.0, 0.012, 8, 120]} />
        <meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </ThreeCanvas>
  );
};
