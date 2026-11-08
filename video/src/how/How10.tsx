import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cloudBig, icons } from "@/components/pixel/sprites";
import { CHOKES, OFFLINE_CAP } from "@/lib/game/content";
import { Burst, C, Chip, font, Pointer, SeaScene, Spr, Stars, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Shutter } from "../ep/kit";

// How 10 · While you're away. The cursor closes the game's tab, night falls
// over the rig and a clock runs: the wells keep pumping on Safe, storage ticks
// up, the "away" bar fills to its 2 hour mark, and a storm cloud bounces off
// the shield (no storms while offline). Morning: the tab comes back, Collect
// and Sell are clicked, and the save sits under your wallet address.

export const HOW10_SECONDS = 14;
const END = 730;

const CLOSE = 176;
const DUSK = 214;
const NIGHT = 262;
const AWAY = [262, 470];
const STORM = [350, 384, 440];
const DAWN = 540;
const DAY = 580;
const BACK = 600;
const COLLECT = 640;
const SELL = 676;

const HOURS = OFFLINE_CAP / 3600; // 2
const START_BBL = 12;
const END_BBL = 58;

export function How10() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={10} tag="How it works" line="Pumps while you're away" color={C.rain} /> : <Scene frame={frame} fps={fps} />}
      <Shutter frame={frame} fps={fps} ep={10} tag="How 10" title="While you're away" color={C.storm} />
      <Dissolve frame={frame} start={END} color={C.stormSky} />
    </AbsoluteFill>
  );
}

function sky(frame: number): [string, string, string] {
  if (frame < DUSK) return [C.sky, "#cfe9ff", C.foam];
  if (frame < NIGHT) return [C.redDeep, C.hat, C.sunDeep];
  if (frame < DAWN) return [C.stormShade, C.stormSky, C.storm];
  if (frame < DAY) return [C.storm, C.redLight, C.sunPale];
  return [C.sky, "#cfe9ff", C.foam];
}

function Scene({ frame, fps }: { frame: number; fps: number }) {
  const night = frame >= NIGHT && frame < DAWN;
  const dim = frame < DUSK ? 1 : frame < NIGHT ? 0.8 : frame < DAWN ? 0.55 : frame < DAY ? 0.8 : 1;
  const bands = sky(frame);
  const away = interpolate(frame, AWAY, [0, OFFLINE_CAP], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hh = Math.floor(away / 3600);
  const mm = String(Math.floor((away % 3600) / 60)).padStart(2, "0");
  const bbl = frame < AWAY[0] ? START_BBL : Math.round(interpolate(frame, AWAY, [START_BBL, END_BBL], { extrapolateRight: "clamp" }));
  const stored = frame >= SELL + 4 ? 0 : frame >= COLLECT + 4 ? 60 : bbl;
  const pumping = frame >= AWAY[0] && frame < AWAY[1];
  const pops = Array.from({ length: 6 }, (_, i) => AWAY[0] + 12 + i * 32);

  return (
    <AbsoluteFill>
      {bands.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: i * 200, width: 1920, height: 200, background: c }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 600, width: 1920, height: 480, background: bands[2] }} />
      {night && (
        <>
          <Stars frame={frame} count={70} h={520} seed="away" />
          <Moon frame={frame} />
        </>
      )}
      {frame >= DAWN && <SunUp frame={frame - DAWN} fps={fps} />}
      <div style={{ position: "absolute", inset: 0, filter: dim < 1 ? `brightness(${dim}) saturate(${0.6 + dim * 0.4})` : undefined }}>
        <SeaScene frame={frame} y={480} />
      </div>
      {/* lit windows on the rig at night */}
      {night && [0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 818 + i * 36, top: 712, width: 20, height: 16, background: C.sun, opacity: (frame + i * 9) % 50 < 40 ? 1 : 0.4 }} />)}
      {pumping && pops.map((at) => <Popup key={at} frame={frame} at={at} x={980} y={500} size={36} life={36} color={C.sun}>+bbl</Popup>)}

      {/* the shield and the storm that bounces off it */}
      {frame >= STORM[0] - 30 && frame < STORM[2] + 40 && <Shield frame={frame} />}
      {frame >= STORM[0] - 30 && frame < STORM[2] && (
        <Spr
          rows={cloudBig}
          palette={{ W: "#8c97bd", w: "#5d6890" }}
          scale={12}
          x={snap(frame < STORM[1] ? interpolate(frame, [STORM[0] - 30, STORM[1]], [1920, 1200]) : interpolate(frame, [STORM[1], STORM[2]], [1200, 1960], { easing: (k) => k * k }), 12)}
          y={snap(frame < STORM[1] ? 470 : 470 - Math.sin(((frame - STORM[1]) / (STORM[2] - STORM[1])) * Math.PI) * 40, 12)}
        />
      )}
      <Popup frame={frame} at={STORM[1]} x={1210} y={440} size={48} life={40} color={C.white}>
        Bonk!
      </Popup>
      {frame >= STORM[1] && frame < STORM[2] + 40 && (
        <div style={{ position: "absolute", left: 1180, top: 650, rotate: "-6deg", zIndex: 30, scale: String(Math.min(1.08, spring({ frame: frame - STORM[1], fps, config: { damping: 10, stiffness: 240 } }))) }}>
          <Chip bg={C.leaf} color={C.white} size={32}>
            <span style={{ fontFamily: font.logo }}>No storms while offline</span>
          </Chip>
        </div>
      )}

      {/* the HUD: away clock and its 2 hour bar, Safe gauge, storage */}
      {frame >= CLOSE + 20 && frame < BACK && (
        <>
          <div style={{ position: "absolute", left: 50, top: 40, width: 520, padding: "18px 24px", background: C.ink, boxShadow: ring(6, C.storm), display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale }}>Away</span>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 56, color: C.sun }}>
                {hh}h {mm}m
              </span>
            </div>
            <div style={{ position: "relative", height: 26, background: C.stormSky, boxShadow: `0 0 0 4px ${C.steelDeep}` }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(away / OFFLINE_CAP) * 100}%`, background: away >= OFFLINE_CAP ? C.leaf : C.sunDeep }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.steelLight }}>
              <span>0h</span>
              <span style={{ color: away >= OFFLINE_CAP ? "#7dffb0" : C.steelLight }}>{HOURS} hours of pumping</span>
            </div>
          </div>
          <SafeGauge />
          <div style={{ position: "absolute", right: 50, top: 300, width: 300, padding: "16px 22px", background: C.ink, boxShadow: ring(6, C.storm), display: "flex", flexDirection: "column", gap: 6, boxSizing: "border-box" }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sunPale }}>Storage</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 64, color: C.sun, lineHeight: 1 }}>{stored}</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.white }}>bbl</span>
          </div>
        </>
      )}

      <BrowserWindow frame={frame} fps={fps} />
      {frame >= BACK && <WelcomeBack frame={frame} fps={fps} bbl={END_BBL - START_BBL} />}
      <Cursor frame={frame} />
    </AbsoluteFill>
  );
}

function Moon({ frame }: { frame: number }) {
  const t = interpolate(frame, [NIGHT, DAWN], [0, 1], { extrapolateRight: "clamp" });
  const x = 200 + t * 1200;
  const y = 260 - Math.sin(t * Math.PI) * 140;
  return (
    <div style={{ position: "absolute", left: snap(x, 8), top: snap(y, 8), width: 110, height: 110, background: C.sunPale, clipPath: "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)" }}>
      <div style={{ position: "absolute", left: 24, top: 30, width: 20, height: 20, background: "#e9dcaa" }} />
      <div style={{ position: "absolute", left: 60, top: 64, width: 16, height: 16, background: "#e9dcaa" }} />
    </div>
  );
}

function SunUp({ frame, fps }: { frame: number; fps: number }) {
  const r = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  return <div style={{ position: "absolute", left: 1420, top: snap(interpolate(r, [0, 1], [460, 120]), 8), width: 160, height: 160, background: C.sun, boxShadow: `0 0 0 10px ${C.sunDeep}`, clipPath: "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)" }} />;
}

/** A dome of pixel blocks over the rig; it flashes when the storm hits. */
function Shield({ frame }: { frame: number }) {
  const hit = frame >= STORM[1] && frame < STORM[1] + 16;
  const fade = Math.min(1, (frame - STORM[0] + 30) / 14) * (frame > STORM[2] ? Math.max(0, 1 - (frame - STORM[2]) / 40) : 1);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade, zIndex: 10 }}>
      {Array.from({ length: 30 }, (_, i) => {
        const a = Math.PI + (i / 29) * Math.PI;
        return <div key={i} style={{ position: "absolute", left: snap(900 + Math.cos(a) * 470 - 14, 4), top: snap(860 + Math.sin(a) * 470 - 14, 4), width: 28, height: 28, background: hit && frame % 4 < 2 ? C.white : C.foam, opacity: 0.85 }} />;
      })}
    </div>
  );
}

function SafeGauge() {
  const p = 30;
  const a = Math.PI * (1 - p / 100);
  return (
    <div style={{ position: "absolute", right: 50, top: 40, width: 300, padding: "14px 18px", background: C.ink, boxShadow: ring(6, C.storm), display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxSizing: "border-box" }}>
      <svg width={220} height={120} viewBox="0 0 220 120" shapeRendering="crispEdges">
        <path d="M 10 110 A 100 100 0 0 1 210 110 Z" fill={C.sunPale} />
        {Array.from({ length: 10 }, (_, i) => {
          const t = (i + 0.5) / 10;
          const ang = Math.PI * (1 - t);
          const v = t * 100;
          return <rect key={i} x={snap(110 + Math.cos(ang) * 80 - 9, 2)} y={snap(110 - Math.sin(ang) * 80 - 9, 2)} width={18} height={18} fill={v <= p + 5 ? C.leaf : C.steelLight} stroke={C.ink} strokeWidth={3} />;
        })}
        <line x1={110} y1={110} x2={110 + Math.cos(a) * 70} y2={110 - Math.sin(a) * 70} stroke={C.ink} strokeWidth={8} />
      </svg>
      <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: "#7dffb0", whiteSpace: "nowrap" }}>
        Safe x{CHOKES.safe.output}
      </span>
    </div>
  );
}

/** The game's tab: open at first, closed by the cursor, opened again in the morning. */
function BrowserWindow({ frame, fps }: { frame: number; fps: number }) {
  const closing = interpolate(frame, [CLOSE + 4, CLOSE + 20], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const reopening = frame >= BACK ? spring({ frame: frame - BACK, fps, config: { damping: 12, stiffness: 200 } }) : 0;
  const k = frame < BACK ? closing : Math.min(1, reopening);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 160, top: 80, width: 1600, height: 900, scale: String(0.5 + k * 0.5), opacity: k, zIndex: 40, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1600, height: 70, background: C.steelLight, boxShadow: ring(7) }}>
        <div style={{ position: "absolute", left: 30, top: 14, width: 420, height: 56, background: C.white, boxShadow: `0 0 0 5px ${C.ink}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", boxSizing: "border-box" }}>
          <Spr rows={icons.derrick} scale={2} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.ink, whiteSpace: "nowrap" }}>Barrel Royale</span>
          <span style={{ marginLeft: "auto", fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: frame >= CLOSE - 10 && frame < CLOSE + 4 ? C.red : C.ink }}>x</span>
        </div>
        <div style={{ position: "absolute", left: 500, top: 16, width: 640, height: 40, background: C.white, boxShadow: `0 0 0 4px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.ink2, display: "flex", alignItems: "center", paddingLeft: 16, boxSizing: "border-box" }}>barrelroyale.io/play</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 70, width: 1600, height: 830, boxShadow: `inset 0 0 0 8px ${C.steelLight}, 0 0 0 7px ${C.ink}` }} />
    </div>
  );
}

function WelcomeBack({ frame, fps, bbl }: { frame: number; fps: number; bbl: number }) {
  const s = spring({ frame: frame - BACK - 10, fps, config: { damping: 11, stiffness: 220 } });
  const btn = (label: string, done: string, at: number, color: string) => (
    <div style={{ flex: 1, padding: "16px 0", background: frame >= at + 4 ? C.leaf : color, boxShadow: ring(6), textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.white, translate: frame >= at && frame < at + 8 ? "0 6px" : undefined }}>{frame >= at + 4 ? done : label}</div>
  );
  return (
    <>
      <div style={{ position: "absolute", left: 560, top: 260, width: 800, padding: "30px 40px", background: C.white, boxShadow: `${ring(8)}, 0 0 0 16px ${C.sun}`, display: "flex", flexDirection: "column", gap: 20, boxSizing: "border-box", scale: String(s), zIndex: 50 }}>
        <Title size={64} color={C.sunDeep}>
          Good morning!
        </Title>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.ink }}>
          Your wells pumped <span style={{ fontFamily: font.logo, color: C.leaf }}>+{bbl} bbl</span> on Safe
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {btn("Collect", "Collected", COLLECT, C.sea)}
          {btn("Sell", "Sold!", SELL, C.red)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, alignSelf: "center", padding: "10px 20px", background: C.ink, scale: String(spring({ frame: frame - SELL - 14, fps, config: { damping: 9, stiffness: 220 } })) }}>
          <Lock />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sunPale, whiteSpace: "nowrap" }}>Saved under your wallet address</span>
        </div>
      </div>
      <Burst frame={frame} start={SELL + 4} x={1150} y={560} rows={icons.coin} scale={5} count={18} speed={16} seed="morning" />
      <Popup frame={frame} at={SELL + 6} x={1150} y={210} size={44} life={46}>
        +coins
      </Popup>
    </>
  );
}

function Lock() {
  return (
    <div style={{ position: "relative", width: 30, height: 34 }}>
      <div style={{ position: "absolute", left: 6, top: 0, width: 18, height: 16, boxShadow: `inset 0 0 0 5px ${C.sun}` }} />
      <div style={{ position: "absolute", left: 0, top: 14, width: 30, height: 20, background: C.sun }} />
    </div>
  );
}

function Cursor({ frame }: { frame: number }) {
  let p: { x: number; y: number; down: boolean } | null = null;
  if (frame >= CLOSE - 50 && frame < CLOSE + 20) {
    const m = interpolate(frame, [CLOSE - 50, CLOSE - 4], [0, 1], { extrapolateRight: "clamp" });
    p = { x: 900 + (572 - 900) * m, y: 700 + (118 - 700) * m, down: frame >= CLOSE && frame < CLOSE + 8 };
  } else if (frame >= COLLECT - 30 && frame < SELL + 24) {
    const a = interpolate(frame, [COLLECT - 30, COLLECT - 4], [0, 1], { extrapolateRight: "clamp" });
    const b = interpolate(frame, [COLLECT + 10, SELL - 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    p = { x: 1300 - (1300 - 800) * a + (1160 - 800) * b, y: 900 - (900 - 560) * a, down: (frame >= COLLECT && frame < COLLECT + 8) || (frame >= SELL && frame < SELL + 8) };
  }
  if (!p) return null;
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      <Pointer x={p.x} y={p.y} down={p.down} scale={7} />
    </AbsoluteFill>
  );
}
