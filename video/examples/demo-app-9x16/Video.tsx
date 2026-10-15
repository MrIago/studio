// Vídeo para os VENDEDORES PARCEIROS (9:16): como ganhar 20% indicando serralheiros,
// onde ver os indicados e como pedir o Pix. Narração MAI-Voice pt-BR (Rafael).
import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, Audio, useCurrentFrame } from "remotion";
import { Backdrop, Captions, Chapters, C, FPS as F, MONO, Phone, PhoneSfx, SANS, Soundtrack, Wordmark, buildTimeline, fadeRange, useIn, type Beat } from "../vendedores-shared/shared";

export const ID = "vendedores-parceiros";
export const FPS = F;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const CHAPTERS = ["Cadastro", "Link", "Ganhos", "Saque"];
const BEATS: Beat[] = [
  { id: "v1", scene: "hook" },
  { id: "v2", scene: "brand" },
  { id: "v3", scene: "percent" },
  { id: "v4", scene: "phone", chapter: 0, shot: "v1-cadastro", focus: "form", events: [
    { w: "cadastrar", do: "tap", shot: "v2-cadastro-preenchido", box: "submit" },
  ] },
  { id: "v5", scene: "phone", chapter: 1, shot: "v3-painel-link", focus: null as any, events: [
    { w: "link", do: "focus", box: { x: 40, y: 490, w: 1000, h: 440 } },
    { w: "copiar", do: "tap", box: "copy" },
  ] },
  { id: "v6", scene: "phone", chapter: 1, shot: "s1-cadastro-codigo", focus: "form", events: [
    { w: "codigo", do: "focus", box: "code" },
  ] },
  { id: "v7", scene: "phone", chapter: 2, shot: "v4-saldo", focus: null as any, events: [
    { w: "comissao", do: "focus", box: { x: 40, y: 788, w: 1000, h: 345 } },
    { w: "pix", do: "focus", box: "disponivel" },
    { w: "cartao", do: "focus", box: "liberar" },
  ] },
  { id: "v8", scene: "phone", chapter: 2, shot: "v5-indicados", focus: "indicados", events: [
    { w: "historico", do: "focus", shot: "v6-historico", box: { x: 40, y: 1060, w: 1000, h: 520 } },
  ] },
  { id: "v9", scene: "phone", chapter: 3, shot: "v7-saque", focus: "receber", events: [
    { w: "pix", do: "focus", box: "pix" },
    { w: "valor", do: "focus", box: "valor" },
    { w: "solicitar", do: "tap", box: "pedir" },
    { w: "dinheiro", do: "focus", shot: "v8-saque-pedido", box: { x: 18, y: 12, w: 1044, h: 110 } },
  ] },
  { id: "v10", scene: "outro", tail: 0.4 },
];
const TL = buildTimeline(BEATS, 2.8);
export const DURATION = Math.ceil(TL.total * FPS);

const beat = (id: string) => TL.beats.find((b) => b.id === id)!;
const fr = (s: number) => Math.round(s * FPS);
const W = (id: string, w: string, n = 1) => TL.wordAt(id, w, n);

// ── cenas fora do celular ───────────────────────────────────────────────────
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const b = beat("v1");
  const a = useIn(W("v1", "voce") - 0.15), q = useIn(W("v1", "serralheiro") - 0.18, 12);
  const flash = W("v1", "ganhar") - 0.2;
  const fl = interpolate(f, [fr(flash), fr(flash) + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const g = useIn(flash + 0.05, 14), m = useIn(W("v1", "mes") - 0.15, 11);
  const out = fadeRange(f, fr(b.start - 0.3), fr(b.start + b.dur + 0.3));
  return (
    <AbsoluteFill style={{ opacity: out, fontFamily: SANS }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", opacity: 1 - fl }}>
        <div style={{ fontSize: 76, fontWeight: 600, color: C.muted, transform: `translateY(${(1 - a) * 40}px)`, opacity: a }}>Você conhece</div>
        <div style={{ fontSize: 150, fontWeight: 900, color: C.ink, letterSpacing: -5, transform: `scale(${0.7 + 0.3 * q})`, opacity: q }}>serralheiro?</div>
        <div style={{ height: 14, width: 560 * q, background: C.orange, borderRadius: 8, marginTop: 6 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.orange, clipPath: `circle(${fl * 160}% at 50% 55%)`, justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 96, fontWeight: 800, color: C.white, opacity: g, transform: `translateY(${(1 - g) * 60}px)` }}>ganhe dinheiro</div>
        <div style={{ fontSize: 170, fontWeight: 900, color: C.white, letterSpacing: -6, transform: `scale(${0.5 + 0.5 * m})`, opacity: m }}>todo mês.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => {
  const f = useCurrentFrame(); const b = beat("v2");
  const lg = useIn(b.start - 0.1, 18);
  const items = [["orcamento", "Orçamento"], ["contrato", "Contrato"], ["financeiro", "Financeiro"]] as const;
  const out = fadeRange(f, fr(b.start - 0.2), fr(b.start + b.dur + 0.3));
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 70, fontFamily: SANS }}>
      <div style={{ transform: `scale(${0.85 + 0.15 * lg})`, opacity: lg }}><Wordmark size={96} /></div>
      <div style={{ fontSize: 44, fontWeight: 600, color: C.muted, opacity: useIn(W("v2", "aplicativo") - 0.2) }}>o app do serralheiro</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {items.map(([w, label], i) => {
          const p = useIn(W("v2", w) - 0.2, 14);
          return (
            <div key={w} style={{ width: 620, height: 128, borderRadius: 32, background: C.white, border: `2px solid ${C.line}`, boxShadow: "0 18px 40px rgba(26,21,17,0.10)",
              display: "flex", alignItems: "center", gap: 30, padding: "0 40px", transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px)`, opacity: p }}>
              <div style={{ width: 62, height: 62, borderRadius: 18, background: C.orange, color: C.white, fontFamily: MONO, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div style={{ fontSize: 54, fontWeight: 800, color: C.ink }}>{label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Percent: React.FC = () => {
  const f = useCurrentFrame(); const b = beat("v3");
  const big = useIn(W("v3", "20") - 0.2, 10);
  const lab = useIn(W("v3", "mensalidade") - 0.2);
  const monthsAt = W("v3", "todo") - 0.2;
  const months = ["OUT", "NOV", "DEZ", "JAN", "FEV", "MAR"];
  const out = fadeRange(f, fr(b.start - 0.2), fr(b.start + b.dur + 0.1));
  const link = useIn(b.start, 16);
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: "center", alignItems: "center", flexDirection: "column", fontFamily: SANS }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: C.muted, opacity: link, marginBottom: 10 }}>cada serralheiro pelo seu link</div>
      <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 330, color: C.orange, letterSpacing: -14, lineHeight: 1, transform: `scale(${0.4 + 0.6 * big})`, opacity: big, textShadow: `0 20px 60px ${C.orange}44` }}>20%</div>
      <div style={{ fontSize: 62, fontWeight: 800, color: C.ink, opacity: lab, transform: `translateY(${(1 - lab) * 30}px)` }}>de cada mensalidade</div>
      <div style={{ display: "flex", gap: 14, marginTop: 70 }}>
        {months.map((m, i) => {
          const p = useIn(monthsAt + i * 0.22, 13);
          return (
            <div key={m} style={{ width: 132, height: 150, borderRadius: 26, background: p > 0.5 ? C.ink : C.white, border: `2px solid ${C.line}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transform: `translateY(${(1 - p) * 50}px)`, opacity: 0.25 + 0.75 * p }}>
              <div style={{ fontFamily: MONO, fontSize: 26, color: p > 0.5 ? "#d9cfc6" : C.muted }}>{m}</div>
              <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: C.orange2 }}>+20%</div>
            </div>
          );
        })}
      </div>
      {months.map((_, i) => <Sequence key={i} from={fr(monthsAt + i * 0.22)} durationInFrames={10}><Audio src={staticFile("vendedores/sfx/switch.wav")} volume={0.16} /></Sequence>)}
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame(); const b = beat("v10");
  const lines = [["link", "Seu link."], ["serralheiros", "Seus serralheiros."], ["comissao", "Sua comissão."]] as const;
  const tm = useIn(W("v10", "todo") - 0.2, 11);
  const wm = useIn(b.start + b.dur + 0.1, 18);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 10, fontFamily: SANS, opacity: interpolate(f, [fr(b.start - 0.3), fr(b.start)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      {lines.map(([w, t]) => { const p = useIn(W("v10", w) - 0.2, 14); return <div key={w} style={{ fontSize: 96, fontWeight: 900, color: C.ink, letterSpacing: -3, opacity: p, transform: `translateX(${(1 - p) * -120}px)` }}>{t}</div>; })}
      <div style={{ fontSize: 140, fontWeight: 900, color: C.orange, letterSpacing: -5, transform: `scale(${0.6 + 0.4 * tm})`, opacity: tm, marginTop: 20 }}>Todo mês.</div>
      <div style={{ position: "absolute", bottom: 210, opacity: wm, transform: `translateY(${(1 - wm) * 40}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Wordmark size={64} />
        <div style={{ fontFamily: MONO, fontSize: 34, color: C.muted }}>meuserralheiropro.com/afiliado</div>
      </div>
      <Sequence from={fr(W("v10", "todo") - 0.05)} durationInFrames={45}><Audio src={staticFile("vendedores/sfx/ding.wav")} volume={0.22} /></Sequence>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const firstPhone = TL.beats.find((b) => b.scene === "phone")!;
  const lastPhone = [...TL.beats].reverse().find((b) => b.scene === "phone")!;
  const pFrom = fr(firstPhone.start - 0.1), pTo = fr(lastPhone.start + lastPhone.dur + 0.2);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Backdrop />
      <Hook />
      <Brand />
      <Percent />
      <Chapters tl={TL} names={CHAPTERS} from={pFrom} to={pTo} />
      <Phone tl={TL} visibleFrom={pFrom} visibleTo={pTo} />
      <Captions tl={TL} only={(s) => s === "phone"} emph={["link", "copiar", "codigo", "comissao", "pix", "liberar", "saque", "indicados", "historico", "cadastrar"]} />
      <Outro />
      <PhoneSfx tl={TL} />
      <Soundtrack tl={TL} total={DURATION} />
    </AbsoluteFill>
  );
};
