import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { flameA, flamePalette, icons } from "@/components/pixel/sprites";
import { BLOWOUT_AT, CHOKES, WARN_AT, WELLS, type Choke } from "@/lib/game/content";
import { C, Chip, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Prompt, Shutter } from "../ep/kit";

// How 02 · The choke. An oscilloscope race: the same well on Safe, Normal and
// Overdrive, three pressure traces side by side against the red line. Then one
// big scope: F opens the well's panel, the cursor pushes it to Overdrive, the
// trace climbs toward the line and the player eases back to Normal just in
// time. "Pro move."

export const HOW02_SECONDS = 15;
const END = 790;

const ORDER: Choke[] = ["safe", "normal", "overdrive"];
const MAX = 110;
const SCOPE = "#3dff9a";
const GRID = "#1f6b45";

// the race: 1 frame is 0.09 s of game time, every well starts at 25
const RACE = [110, 330];
const RACE_DT = 0.09;
// the live switch: Normal, Overdrive on the click, back to Normal before the line
const LIVE = 340;
const LIVE_END = 760;
const LIVE_DT = 0.06;
const F_PRESS = 384;
const PUSH = 420;
const EASE = 530;
const PRO = 560;

/** Pressure drifts toward the setting's target at its speed, as in the game. */
function trace(start: number, from: number, to: number, dt: number, chokeAt: (f: number) => Choke) {
  const out: number[] = [];
  let p = start;
  for (let f = from; f <= to; f++) {
    out.push(p);
    const c = CHOKES[chokeAt(f)];
    const step = c.speed * dt;
    p = p < c.target ? Math.min(c.target, p + step) : Math.max(c.target, p - step);
  }
  return out;
}

const RACES = ORDER.map((c) => trace(25, RACE[0], RACE[1], RACE_DT, () => c));
const liveChoke = (f: number): Choke => (f >= PUSH && f < EASE ? "overdrive" : "normal");
const LIVE_TRACE = trace(60, LIVE, LIVE_END, LIVE_DT, liveChoke);

export function How02() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? (
        <EpEnd frame={frame - END - 20} fps={fps} ep={2} tag="How it works" line="Push it, then ease off" color={C.leaf} />
      ) : frame < LIVE ? (
        <Race frame={frame} fps={fps} />
      ) : (
        <Live frame={frame} fps={fps} />
      )}
      {frame >= LIVE - 6 && frame < LIVE + 6 && <AbsoluteFill style={{ background: SCOPE, opacity: 1 - Math.abs(frame - LIVE) / 6, zIndex: 120 }} />}
      <Shutter frame={frame} fps={fps} ep={2} tag="How 02" title="The choke" color={C.leaf} />
      <Dissolve frame={frame} start={END} color={C.leaf} />
    </AbsoluteFill>
  );
}

/** A scope screen: grid, the warning and blowout lines, and the trace drawn so far. */
function Scope({ w, h, points, total }: { w: number; h: number; points: number[]; total: number }) {
  const y = (v: number) => h - (Math.min(MAX, v) / MAX) * h;
  const step = Math.max(1, Math.round(total / 120));
  const pts: string[] = [];
  for (let i = 0; i < points.length; i += step) pts.push(`${snap((i / total) * w, 4)},${snap(y(points[i]), 4)}`);
  if (points.length) pts.push(`${snap(((points.length - 1) / total) * w, 4)},${snap(y(points[points.length - 1]), 4)}`);
  const last = points[points.length - 1] ?? 0;
  return (
    <svg width={w} height={h} style={{ display: "block", background: "#07140f" }} shapeRendering="crispEdges">
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={(i * w) / 10} y1={0} x2={(i * w) / 10} y2={h} stroke={GRID} strokeWidth={2} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={(i * h) / 5} x2={w} y2={(i * h) / 5} stroke={GRID} strokeWidth={2} />
      ))}
      <rect x={0} y={0} width={w} height={y(WARN_AT)} fill={C.red} opacity={0.18} />
      <line x1={0} y1={y(WARN_AT)} x2={w} y2={y(WARN_AT)} stroke={C.sunDeep} strokeWidth={4} strokeDasharray="16 10" />
      <line x1={0} y1={y(BLOWOUT_AT)} x2={w} y2={y(BLOWOUT_AT)} stroke={C.red} strokeWidth={8} />
      <polyline points={pts.join(" ")} fill="none" stroke={last >= WARN_AT ? C.red : SCOPE} strokeWidth={8} />
      {points.length > 0 && <rect x={snap(((points.length - 1) / total) * w, 4) - 8} y={snap(y(last), 4) - 8} width={16} height={16} fill={C.white} />}
    </svg>
  );
}

const PANEL = { w: 580, gap: 30, left: 45, top: 150, scope: 520 };
const CAPTIONS: Record<Choke, string> = { safe: "Barely moves", normal: "Rises, then settles", overdrive: "Climbs fast" };

function Race({ frame, fps }: { frame: number; fps: number }) {
  const n = Math.max(0, Math.min(RACES[0].length, frame - RACE[0] + 1));
  const total = RACE[1] - RACE[0];
  return (
    <AbsoluteFill style={{ background: C.stormShade }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center" }}>
        <Title size={64}>Same well, three settings</Title>
      </div>
      {ORDER.map((c, i) => {
        const pts = RACES[i].slice(0, n);
        const p = pts[pts.length - 1] ?? 25;
        const haul = WELLS.light.rate * CHOKES[c].output * RACE_DT * pts.length;
        const color = c === "safe" ? C.leaf : c === "normal" ? C.sunDeep : C.red;
        const hot = p >= WARN_AT;
        return (
          <div key={c} style={{ position: "absolute", left: PANEL.left + i * (PANEL.w + PANEL.gap), top: PANEL.top, width: PANEL.w, background: C.ink, boxShadow: ring(7, hot && frame % 16 < 8 ? C.red : C.steelDeep) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: color }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: C.white }}>{CHOKES[c].label}</span>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white, display: "flex", alignItems: "center", gap: 8 }}>
                {c === "overdrive" && <Spr rows={flameA} palette={flamePalette} scale={3} />}x{CHOKES[c].output.toFixed(1)}
              </span>
            </div>
            <Scope w={PANEL.w} h={PANEL.scope} points={pts} total={total} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px" }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: hot ? C.red : SCOPE }}>Pressure {Math.round(p)}</span>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sun }}>{haul.toFixed(1)} bbl</span>
            </div>
          </div>
        );
      })}
      {ORDER.map((c, i) => {
        const at = RACE[0] + 70 + i * 40;
        if (frame < at) return null;
        return (
          <div key={c} style={{ position: "absolute", left: PANEL.left + i * (PANEL.w + PANEL.gap), width: PANEL.w, top: 850, display: "flex", justifyContent: "center", scale: String(spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 220 } })) }}>
            <Chip bg={C.white} color={C.ink} size={36}>
              <span style={{ fontFamily: font.logo }}>{CAPTIONS[c]}</span>
            </Chip>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 966, display: "flex", justifyContent: "center", gap: 40 }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.sunDeep }}>- - Warning {WARN_AT}</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.red }}>— Blowout {BLOWOUT_AT}</span>
      </div>
    </AbsoluteFill>
  );
}

const BIG = { left: 60, top: 150, w: 1260, h: 640 };
const BTNS = { left: 1420, top: 330, w: 420 };
const btnY = (c: Choke) => BTNS.top + 90 + ORDER.indexOf(c) * 110;

function Live({ frame, fps }: { frame: number; fps: number }) {
  const n = Math.max(1, Math.min(LIVE_TRACE.length, frame - LIVE + 1));
  const pts = LIVE_TRACE.slice(0, n);
  const p = pts[pts.length - 1];
  const choke = liveChoke(frame);
  const open = frame >= F_PRESS + 8;
  const haul = pts.reduce((s, _, i) => s + WELLS.light.rate * CHOKES[liveChoke(LIVE + i)].output * LIVE_DT, 0);

  // the cursor: in to Overdrive, then over to Normal
  const ptr = (() => {
    if (frame < F_PRESS + 14 || frame > PRO + 20) return null;
    const ox = BTNS.left + BTNS.w / 2;
    if (frame < PUSH + 10) return { x: interpolate(frame, [F_PRESS + 14, PUSH - 4], [1800, ox], { extrapolateRight: "clamp" }), y: interpolate(frame, [F_PRESS + 14, PUSH - 4], [1040, btnY("overdrive")], { extrapolateRight: "clamp" }), down: frame >= PUSH && frame < PUSH + 8 };
    return { x: ox, y: interpolate(frame, [EASE - 30, EASE - 4], [btnY("overdrive"), btnY("normal")], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), down: frame >= EASE && frame < EASE + 8 };
  })();

  return (
    <AbsoluteFill style={{ background: C.stormShade }}>
      <div style={{ position: "absolute", left: BIG.left, top: 40 }}>
        <Title size={60}>Switch it live</Title>
      </div>
      <div style={{ position: "absolute", left: BIG.left, top: BIG.top, boxShadow: ring(8, p >= WARN_AT - 4 && frame < EASE + 20 && frame % 16 < 8 ? C.red : C.steelDeep) }}>
        <Scope w={BIG.w} h={BIG.h} points={pts} total={LIVE_END - LIVE} />
      </div>
      <div style={{ position: "absolute", left: BIG.left, top: BIG.top + BIG.h + 30, display: "flex", gap: 30, alignItems: "center" }}>
        <div style={{ padding: "12px 24px", background: C.ink, boxShadow: ring(6), fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: p >= WARN_AT - 4 ? C.red : SCOPE }}>Pressure {Math.round(p)}</div>
        <div style={{ padding: "12px 24px", background: choke === "overdrive" ? C.red : C.sunDeep, boxShadow: ring(6), fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white }}>
          {CHOKES[choke].label} x{CHOKES[choke].output.toFixed(1)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", background: C.white, boxShadow: ring(6) }}>
          <Spr rows={icons.derrick} scale={3} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink }}>{haul.toFixed(1)} bbl</span>
        </div>
      </div>

      {/* F opens the well's panel */}
      {!open && frame >= LIVE + 10 && <Prompt k="F" text="Manage well" down={frame >= F_PRESS && frame < F_PRESS + 8} x={BTNS.left + BTNS.w / 2} y={500} pop={spring({ frame: frame - LIVE - 10, fps, config: { damping: 9, stiffness: 240 } })} />}
      {open && (
        <div style={{ position: "absolute", left: BTNS.left, top: BTNS.top, width: BTNS.w, padding: "20px 24px 26px", background: C.white, boxShadow: ring(8), boxSizing: "border-box", scale: String(spring({ frame: frame - F_PRESS - 8, fps, config: { damping: 10, stiffness: 240 } })) }}>
          <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.ink, marginBottom: 18 }}>Choke</div>
          {ORDER.map((c) => {
            const on = choke === c;
            const pressed = (c === "overdrive" && frame >= PUSH && frame < PUSH + 8) || (c === "normal" && frame >= EASE && frame < EASE + 8);
            return (
              <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 84, marginBottom: 26, padding: "0 20px", background: on ? (c === "overdrive" ? C.red : c === "normal" ? C.sunDeep : C.leaf) : C.steelLight, boxShadow: `0 0 0 5px ${C.ink}`, translate: pressed ? "0 6px" : undefined, boxSizing: "border-box" }}>
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: on ? C.white : C.ink }}>{CHOKES[c].label}</span>
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: on ? C.white : C.ink2 }}>x{CHOKES[c].output.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}
      <Popup frame={frame} at={PUSH + 4} x={BIG.left + 560} y={460} size={50} life={50} color={C.red}>
        Push it!
      </Popup>
      <Popup frame={frame} at={EASE + 4} x={BIG.left + 1000} y={300} size={44} life={50} color={C.leaf}>
        Ease off
      </Popup>

      {frame >= PRO && (
        <div style={{ position: "absolute", left: BIG.left, width: BIG.w, top: 540, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 90 }}>
          <div style={{ padding: "20px 56px", background: C.sun, boxShadow: `${ring(9)}, 0 0 0 18px ${C.red}`, rotate: "-5deg", scale: String(interpolate(spring({ frame: frame - PRO, fps, config: { damping: 12, stiffness: 240 } }), [0, 1], [3, 1], { extrapolateRight: "clamp" })) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 100, color: C.ink }}>Pro move</span>
          </div>
          <Chip bg={C.ink} color={C.white} size={36} style={{ scale: String(spring({ frame: frame - PRO - 16, fps, config: { damping: 9, stiffness: 220 } })) }}>
            <span style={{ fontFamily: font.logo }}>Back off just before the red line</span>
          </Chip>
        </div>
      )}
      {ptr && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x} y={ptr.y} down={ptr.down} scale={7} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
