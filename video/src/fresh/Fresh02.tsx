import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { logo, logoPalette } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Stars, Title } from "../brand";
import { EndCard, FH, FRAME, Framed, s2f } from "./Fresh01";

// A day on the rig, on a 24-hour clock: the sky behind everything runs from dawn to night while a dial in
// the left column turns through five stops, each one a few seconds of the real game in the frame (shown
// whole so the HUD stays in view): the Daily Shift, a gusher, the tanker, Royal Harbor and the foreman.

export const FRESH02_SECONDS = 18;
const INTRO = 2.2;
const STOP = 2.6;
const STOPS = [
  { hour: 6, short: "Shift", label: "Clock in", what: "Daily Shift", src: "shiftfull", from: 9.0, rate: 1.6, sky: "#f58a80" },
  { hour: 10, short: "Gusher", label: "Catch it", what: "A gusher", src: "gusher", from: 15.9, rate: 1, sky: "#7fb8f5" },
  { hour: 12, short: "Tanker", label: "Load it", what: "The tanker", src: "tanker", from: 10.6, rate: 1, sky: "#5ca6f2" },
  { hour: 19, short: "Harbor", label: "Hang out", what: "Royal Harbor", src: "village", from: 12.6, rate: 1.4, sky: "#e8743c" },
  { hour: 23, short: "Foreman", label: "Log off", what: "Foreman's shift", src: "foremanback", from: 2.4, rate: 1, sky: "#141a33" },
];
const END = INTRO + STOPS.length * STOP;

const hhmm = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.floor((h % 1) * 60 / 15) * 15).padStart(2, "0")}`;

function Dial({ hour, night }: { hour: number; night: boolean }) {
  const R = 150;
  const a = ((hour / 24) * 360 - 90) * (Math.PI / 180);
  const tipX = R + Math.cos(a) * (R - 34);
  const tipY = R + Math.sin(a) * (R - 34);
  return (
    <div style={{ position: "relative", width: R * 2, height: R * 2 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.ink, boxShadow: `0 0 0 8px ${C.sun}, 0 0 0 14px ${C.ink}` }} />
      {Array.from({ length: 24 }, (_, i) => {
        const b = ((i / 24) * 360 - 90) * (Math.PI / 180);
        const big = i % 6 === 0;
        return <div key={i} style={{ position: "absolute", left: R + Math.cos(b) * (R - 16) - (big ? 5 : 3), top: R + Math.sin(b) * (R - 16) - (big ? 5 : 3), width: big ? 10 : 6, height: big ? 10 : 6, background: big ? C.sun : "#4b5468" }} />;
      })}
      {[0, 6, 12, 18].map((h) => {
        const b = ((h / 24) * 360 - 90) * (Math.PI / 180);
        return (
          <div key={h} style={{ position: "absolute", left: R + Math.cos(b) * (R - 48) - 20, top: R + Math.sin(b) * (R - 48) - 12, width: 40, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 18, color: C.steelLight }}>
            {h}
          </div>
        );
      })}
      {/* the hand, with a sun or a moon at its tip */}
      <div style={{ position: "absolute", left: R - 4, top: R - 4, width: R - 34, height: 8, background: C.white, transformOrigin: "4px 4px", rotate: `${(hour / 24) * 360 - 90}deg` }} />
      <div style={{ position: "absolute", left: tipX - 20, top: tipY - 20, width: 40, height: 40, background: night ? C.sunPale : C.sun, borderRadius: night ? "50%" : 0, boxShadow: `0 0 0 4px ${C.ink}, 0 0 24px ${night ? "#fff1c2" : C.sun}` }} />
      <div style={{ position: "absolute", left: R - 10, top: R - 10, width: 20, height: 20, background: C.red, boxShadow: `0 0 0 4px ${C.ink}` }} />
    </div>
  );
}

export function Fresh02() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const i = Math.max(0, Math.min(STOPS.length - 1, Math.floor((t - INTRO) / STOP)));
  const stop = STOPS[i];
  const prev = STOPS[Math.max(0, i - 1)];
  const into = t < INTRO ? 0 : Math.min(1, (t - INTRO - i * STOP) / 0.6);
  // the hand sweeps to each stop's hour; before the first stop it rises from midnight to dawn
  const hour = t < INTRO ? interpolate(t, [0.4, INTRO], [3, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : i === 0 ? 6 : prev.hour + (stop.hour - prev.hour) * Math.min(1, into * 1.4);
  const night = hour >= 21 || hour < 5;
  const sky = t < INTRO ? "#24305a" : stop.sky;
  const label = spring({ frame: frame - s2f(INTRO + i * STOP), fps, config: { damping: 11, stiffness: 220 } });
  const head = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: sky, overflow: "hidden" }}>
      {night || t < INTRO ? <Stars frame={frame} count={50} h={1080} seed="day" /> : null}
      {t < INTRO && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
          <Dial hour={hour} night={hour < 5} />
          <div style={{ scale: String(head), transformOrigin: "0 50%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sun, letterSpacing: 3 }}>Barrel Royale</span>
            </div>
            <Title size={110} style={{ marginTop: 24 }}>
              A day
            </Title>
            <Title size={110} color={C.sun}>
              on the rig
            </Title>
          </div>
        </AbsoluteFill>
      )}
      {t >= INTRO && t < END && (
        <>
          <Framed src={stop.src} shots={[[INTRO + i * STOP, stop.from, STOP, stop.rate]]} border={night ? C.sunPale : C.sun} />
          <div style={{ position: "absolute", left: 50, top: 150, width: 400, padding: "26px 22px", background: "rgba(30,42,74,0.92)", boxShadow: ring(6), display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div style={{ scale: "0.9" }}>
              <Dial hour={hour} night={night} />
            </div>
            <Title size={68} color={C.sun}>
              {hhmm(hour)}
            </Title>
            <div style={{ textAlign: "center", scale: String(label) }}>
              <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.red, letterSpacing: 3 }}>{stop.label}</div>
              <div style={{ marginTop: 8, fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.white }}>{stop.what}</div>
            </div>
          </div>
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 12 }}>
            {STOPS.map((s, k) => (
              <Chip key={s.what} bg={k === i ? C.sun : k < i ? C.white : "rgba(255,255,255,0.35)"} size={20}>
                <span style={{ fontFamily: font.logo }}>
                  {hhmm(s.hour)} {s.short}
                </span>
              </Chip>
            ))}
          </div>
        </>
      )}
      {STOPS.map((_, k) => (k > 0 ? <PixelWipe key={k} frame={frame} start={s2f(INTRO + k * STOP) - 22} dur={18} size={160} /> : null))}
      <PixelWipe frame={frame} start={s2f(INTRO) - 22} />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      <EndCard start={END} top="Your rig" bottom="your routine" />
    </AbsoluteFill>
  );
}
