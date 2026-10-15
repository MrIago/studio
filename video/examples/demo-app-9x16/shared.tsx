// Kit compartilhado dos dois vídeos do programa de vendedores (Meu Serralheiro Pro).
// Princípios (references/motion-design.md da studio): um celular PERSISTENTE (o mundo
// não reseta; só a tela navega), a câmera aproxima o que está sendo falado, holofote
// com um elemento aceso por vez, toque com som no quadro, barra de capítulos como
// loop aberto visível, legenda presa à palavra falada. Tudo dirigido por frame.
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadStencil } from "@remotion/google-fonts/SairaStencil";
import TIMING from "./timing.json";
import META from "./meta.json";

export const { fontFamily: SANS } = loadArchivo("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
export const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "600"], subsets: ["latin"] });
export const { fontFamily: STENCIL } = loadStencil("normal", { weights: ["700"], subsets: ["latin"] });

export const C = { bg: "#f8f6f4", ink: "#1a1511", orange: "#d55c13", orange2: "#ed7940", muted: "#5e534a", line: "#e6e0d9", dark: "#100c0a", white: "#fffdfb" };
export const FPS = 30;
const GAP = 0.35;          // respiro entre falas (s)
const LEAD = 0.4;          // silêncio antes da 1ª fala

type Box = { x: number; y: number; w: number; h: number };
type Timing = Record<string, { dur: number; text: string; words: { text: string; start: number; end: number }[] }>;
const T = TIMING as unknown as Timing;
const M = META as unknown as Record<string, Record<string, Box>>;

// ── linha do tempo ────────────────────────────────────────────────────────────
export type Ev =
  | { w: string; n?: number; do: "shot"; shot: string }
  | { w: string; n?: number; do: "focus"; box: string | Box | null; shot?: string }
  | { w: string; n?: number; do: "tap"; box: string | Box; shot?: string; sfx?: string };
export type Beat = { id: string; scene: string; chapter?: number; shot?: string; focus?: string | Box; events?: Ev[]; tail?: number };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");

export function buildTimeline(beats: Beat[], outroHold = 2.6) {
  let t = LEAD;
  const out = beats.map((b) => {
    const tm = T[b.id];
    const start = t;
    t += tm.dur + (b.tail ?? 0) + GAP;
    return { ...b, start, dur: tm.dur + (b.tail ?? 0), words: tm.words };
  });
  const total = t - GAP + outroHold;
  // tempo absoluto (s) da n-ésima ocorrência de uma palavra numa fala
  const wordAt = (beatId: string, w: string, n = 1) => {
    const b = out.find((x) => x.id === beatId)!;
    const target = norm(w);
    let k = 0;
    for (const x of b.words) if (norm(x.text).startsWith(target) && ++k === n) return b.start + x.start;
    throw new Error(`palavra "${w}" não achada em ${beatId}: ${b.words.map((x) => x.text).join(" ")}`);
  };
  return { beats: out, total, wordAt };
}
export type TL = ReturnType<typeof buildTimeline>;

// estado do celular no tempo s: tela atual, foco atual (+ anterior p/ câmera), toques
type PhoneEvent = { t: number; kind: "shot" | "focus" | "tap"; shot?: string; box?: Box | null; sfx?: string };
export function phoneEvents(tl: TL): PhoneEvent[] {
  const ev: PhoneEvent[] = [];
  for (const b of tl.beats) {
    if (b.scene !== "phone") continue;
    const resolve = (box: string | Box | null | undefined, shot: string): Box | null =>
      box == null ? null : typeof box === "string" ? M[shot]?.[box] ?? null : box;
    let cur = b.shot!;
    ev.push({ t: b.start - 0.25, kind: "shot", shot: cur });
    ev.push({ t: b.start, kind: "focus", box: resolve(b.focus, cur) });
    for (const e of b.events ?? []) {
      const t = tl.wordAt(b.id, e.w, e.n) - 0.2; // pousa 0,2s antes da palavra
      if (e.do === "shot") { cur = e.shot; ev.push({ t, kind: "shot", shot: cur }); }
      else if (e.do === "focus") { if (e.shot) { cur = e.shot; ev.push({ t: t - 0.05, kind: "shot", shot: cur }); } ev.push({ t, kind: "focus", box: resolve(e.box, cur) }); }
      else if (e.do === "tap") { if (e.shot) { cur = e.shot; ev.push({ t: t - 0.05, kind: "shot", shot: cur }); } const bx = resolve(e.box, cur); ev.push({ t, kind: "focus", box: bx }); ev.push({ t: t + 0.25, kind: "tap", box: bx, sfx: e.sfx }); }
    }
  }
  return ev.sort((a, b) => a.t - b.t);
}

// ── fundo ─────────────────────────────────────────────────────────────────────
export const Backdrop: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 90) * 40;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.ink}14 1.6px, transparent 1.8px)`, backgroundSize: "34px 34px", backgroundPosition: `${drift * 0.2}px ${f * 0.15}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at ${540 + drift}px -120px, ${C.orange}${Math.round(glow * 0x26).toString(16).padStart(2, "0")}, transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(26,21,17,0.07) 100%)" }} />
    </AbsoluteFill>
  );
};

// ── celular persistente ───────────────────────────────────────────────────────
const SW = 800, SH = (SW * 1920) / 1080, K = SW / 1080, BEZEL = 16;
const PHONE_X = (1080 - SW) / 2 - BEZEL, PHONE_Y = 205;
const ease = Easing.bezier(0.45, 0, 0.2, 1); // inOut suave (deslocamento)
const enterEase = Easing.bezier(0.16, 1, 0.3, 1);

function camFor(box: Box | null) {
  if (!box) return { z: 1, tx: 0, ty: 0 };
  const z = Math.min(1.45, Math.max(1, (0.9 * 1080) / Math.max(box.w, 660)));
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  let tx = SW / 2 - cx * K * z, ty = SH * 0.46 - cy * K * z;
  tx = Math.min(0, Math.max(SW - 1080 * K * z, tx));
  ty = Math.min(0, Math.max(SH - 1920 * K * z, ty));
  return { z, tx, ty };
}

export const Phone: React.FC<{ tl: TL; visibleFrom: number; visibleTo: number }> = ({ tl, visibleFrom, visibleTo }) => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const evs = React.useMemo(() => phoneEvents(tl), [tl]);
  // tela atual + anterior (para o "push" de navegação)
  const shots = evs.filter((e) => e.kind === "shot");
  let si = -1; for (let i = 0; i < shots.length; i++) if (shots[i].t <= s) si = i;
  const curShot = shots[Math.max(0, si)]?.shot!, prevShot = si > 0 ? shots[si - 1].shot! : null;
  const nav = si > 0 && prevShot !== curShot ? interpolate(s, [shots[si].t, shots[si].t + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) : 1;
  // câmera
  const focs = evs.filter((e) => e.kind === "focus");
  let fi = -1; for (let i = 0; i < focs.length; i++) if (focs[i].t <= s) fi = i;
  const cur = camFor(focs[Math.max(0, fi)]?.box ?? null), prev = camFor(fi > 0 ? focs[fi - 1].box ?? null : null);
  const ct = fi >= 0 ? interpolate(s, [focs[fi].t, focs[fi].t + 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) : 1;
  const z = prev.z + (cur.z - prev.z) * ct, tx = prev.tx + (cur.tx - prev.tx) * ct, ty = prev.ty + (cur.ty - prev.ty) * ct;
  const box = fi >= 0 ? focs[fi].box ?? null : null;
  const spot = box ? interpolate(s, [focs[fi].t + 0.35, focs[fi].t + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  // entrada/saída do celular inteiro
  const inP = spring({ frame: f - visibleFrom, fps: FPS, config: { damping: 18, mass: 0.9 } });
  const outP = interpolate(f, [visibleTo - 10, visibleTo], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  if (f < visibleFrom - 1 || f > visibleTo + 1) return null;
  const y = (1 - inP) * 700 + outP * 900;
  const screen = (shot: string, x: number) => (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${x}px)` }}>
      <div style={{ position: "absolute", left: tx, top: ty, width: 1080 * K * z, height: 1920 * K * z }}>
        <Img src={staticFile(`vendedores/shots/${shot}.png`)} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
  const sb = box ? { x: box.x * K * z + tx - 12, y: box.y * K * z + ty - 12, w: box.w * K * z + 24, h: box.h * K * z + 24 } : null;
  const taps = evs.filter((e) => e.kind === "tap" && s >= e.t && s < e.t + 0.7);
  return (
    <div style={{ position: "absolute", left: PHONE_X, top: PHONE_Y + y, width: SW + BEZEL * 2, height: SH + BEZEL * 2, borderRadius: 74, background: "#1d1916", boxShadow: "0 40px 90px rgba(26,21,17,0.28), 0 12px 24px rgba(26,21,17,0.18), inset 0 0 0 2px #3a332d" }}>
      <div style={{ position: "absolute", left: BEZEL, top: BEZEL, width: SW, height: SH, borderRadius: 60, overflow: "hidden", background: C.bg }}>
        {nav < 1 && prevShot ? screen(prevShot, -SW * 0.3 * nav) : null}
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - nav) * SW}px)`, boxShadow: nav < 1 ? "-20px 0 40px rgba(0,0,0,0.12)" : undefined }}>{screen(curShot, 0)}</div>
        {/* esconde os botões flutuantes do app (sugestão/suporte) */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: `linear-gradient(transparent, ${C.bg} 60%)` }} />
        {sb && spot > 0 ? (
          <div style={{ position: "absolute", left: sb.x, top: sb.y, width: sb.w, height: sb.h, borderRadius: 22, boxShadow: `0 0 0 3000px rgba(16,12,10,${0.3 * spot})`, outline: `${5 * spot}px solid ${C.orange}`, outlineOffset: 0, transform: `scale(${1.06 - 0.06 * spot})` }} />
        ) : null}
        {taps.map((e, i) => {
          const p = (s - e.t) / 0.7, b = e.box!;
          const cx = (b.x + b.w / 2) * K * z + tx, cy = (b.y + b.h / 2) * K * z + ty;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: cx - 90 * p - 10, top: cy - 90 * p - 10, width: 180 * p + 20, height: 180 * p + 20, borderRadius: "50%", border: `4px solid ${C.orange}`, opacity: 1 - p }} />
              <div style={{ position: "absolute", left: cx - 26, top: cy - 26, width: 52, height: 52, borderRadius: "50%", background: "rgba(26,21,17,0.35)", transform: `scale(${p < 0.25 ? 0.8 + p : 1.05 - p * 0.3})`, opacity: p < 0.7 ? 1 : (1 - p) / 0.3 }} />
            </React.Fragment>
          );
        })}
      </div>
      {/* ilha */}
      <div style={{ position: "absolute", left: (SW + BEZEL * 2) / 2 - 62, top: BEZEL + 16, width: 124, height: 34, borderRadius: 20, background: "#0b0908" }} />
    </div>
  );
};

// sons dos toques e das trocas de tela (presos ao quadro do evento)
export const PhoneSfx: React.FC<{ tl: TL }> = ({ tl }) => {
  const evs = phoneEvents(tl);
  let last = "";
  return (
    <>
      {evs.map((e, i) => {
        if (e.kind === "tap") return <Sequence key={i} from={Math.round((e.t - 0.02) * FPS)} durationInFrames={20}><Audio src={staticFile(`vendedores/sfx/${e.sfx ?? "mouse-click"}.wav`)} volume={0.55} /></Sequence>;
        if (e.kind === "shot" && e.shot !== last) { const first = last === ""; last = e.shot!; if (first) return null; return <Sequence key={i} from={Math.round(e.t * FPS)} durationInFrames={12}><Audio src={staticFile("vendedores/sfx/whoosh.wav")} volume={0.18} /></Sequence>; }
        return null;
      })}
    </>
  );
};

// ── barra de capítulos (loop aberto) ─────────────────────────────────────────
export const Chapters: React.FC<{ tl: TL; names: string[]; from: number; to: number }> = ({ tl, names, from, to }) => {
  const f = useCurrentFrame(), s = f / FPS;
  if (f < from - 1 || f > to + 1) return null;
  const active = tl.beats.reduce((a, b) => (b.chapter != null && b.start - 0.25 <= s ? b.chapter : a), 0);
  const inP = spring({ frame: f - from, fps: FPS, config: { damping: 20 } });
  const outP = interpolate(f, [to - 8, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const W = names.length > 4 ? 188 : 226;
  return (
    <div style={{ position: "absolute", top: 92 - (1 - inP) * 160 - outP * 160, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10, fontFamily: SANS }}>
      {names.map((n, i) => {
        const chStart = tl.beats.find((b) => b.chapter === i)?.start ?? 1e9;
        const lit = interpolate(s, [chStart - 0.25, chStart + 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const done = i < active;
        const isActive = i === active;
        return (
          <div key={n} style={{ width: W, height: 74, borderRadius: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 27, fontWeight: 700,
            background: isActive ? C.orange : done ? C.ink : "rgba(255,253,251,0.9)", color: isActive || done ? C.white : C.muted,
            border: `2px solid ${isActive ? C.orange : done ? C.ink : C.line}`, transform: `scale(${isActive ? 1 + 0.06 * lit : 1})`, boxShadow: isActive ? `0 10px 26px ${C.orange}55` : "none" }}>
            <span style={{ fontFamily: MONO, fontSize: 24, opacity: 0.85 }}>{done ? "✓" : i + 1}</span>{n}
          </div>
        );
      })}
    </div>
  );
};

// ── legendas presas à palavra ────────────────────────────────────────────────
export const Captions: React.FC<{ tl: TL; only?: (scene: string) => boolean; emph: string[]; y?: number }> = ({ tl, only, emph, y = 1700 }) => {
  const f = useCurrentFrame(), s = f / FPS;
  const b = tl.beats.find((x) => s >= x.start - 0.1 && s < x.start + x.dur + 0.3);
  if (!b || (only && !only(b.scene))) return null;
  // blocos de até 3 palavras, quebrando em pontuação
  const chunks: { words: typeof b.words; start: number }[] = [];
  let curr: typeof b.words = [];
  b.words.forEach((w, i) => {
    curr.push(w);
    const brk = /[,.?!:;]$/.test(w.text) || curr.length === 3 || i === b.words.length - 1;
    if (brk) { chunks.push({ words: curr, start: b.start + curr[0].start - 2 / FPS }); curr = []; }
  });
  let ci = -1; for (let i = 0; i < chunks.length; i++) if (chunks[i].start <= s) ci = i;
  if (ci < 0) return null;
  const ch = chunks[ci];
  const endT = b.start + ch.words[ch.words.length - 1].end + 0.35;
  const next = chunks[ci + 1]?.start ?? endT;
  if (s > Math.max(endT, next)) return null;
  const isEmph = (t: string) => emph.some((e) => norm(t).startsWith(norm(e)));
  return (
    <div style={{ position: "absolute", top: y, left: 70, right: 70, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1.12, letterSpacing: -1 }}>
      {ch.words.map((w, i) => (
        <span key={i} style={{ color: isEmph(w.text) ? C.orange : C.ink }}>{w.text.replace(/[,.;:]$/, "")}</span>
      ))}
    </div>
  );
};

// ── utilidades de cena ───────────────────────────────────────────────────────
export const useIn = (atSec: number, damping = 16) => {
  const f = useCurrentFrame();
  return spring({ frame: f - Math.round(atSec * FPS), fps: FPS, config: { damping, mass: 0.8 } });
};
export const fadeRange = (f: number, a: number, b: number) => interpolate(f, [a, a + 8, b - 8, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Wordmark: React.FC<{ size?: number; color?: string }> = ({ size = 92, color = C.ink }) => (
  <div style={{ fontFamily: STENCIL, fontWeight: 700, fontSize: size, color, letterSpacing: 1, lineHeight: 1 }}>
    Meu Serralheiro <span style={{ color: C.orange }}>Pro</span>
  </div>
);

// narração + trilha (trilha baixa, entra e sai suave)
export const Soundtrack: React.FC<{ tl: TL; total: number; musicFrom?: number }> = ({ tl, total, musicFrom = 0 }) => (
  <>
    {tl.beats.map((b) => (
      <Sequence key={b.id} from={Math.round(b.start * FPS)} durationInFrames={Math.ceil((b.dur + 0.5) * FPS)}>
        <Audio src={staticFile(`vendedores/vo/${b.id}.mp3`)} volume={1} />
      </Sequence>
    ))}
    <Audio src={staticFile("vendedores/music.mp3")} startFrom={Math.round(musicFrom * FPS)}
      volume={(f) => interpolate(f, [0, 30, total - 75, total], [0, 0.13, 0.13, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
  </>
);
