import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { flameA, flamePalette, icons, valve } from "@/components/pixel/sprites";
import { CHOKES } from "@/lib/game/content";
import { Burst, C, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Bar, Dissolve, dissolved, EpEnd, Key, Popup, Shutter } from "./kit";

// EP 2 · Push it. Don't blow it. The well's control panel, close up: the cursor
// drags the choke from Normal to Overdrive, the gauge climbs into the red while
// the haul counter races, the alarm goes, and the capping drill (four valves,
// in order) brings it back for the save.

export const EP2_SECONDS = 12;
const END = 610;

const DRAG = [200, 230];
const ALARM = 430;
const CAP = 450;
const PRESSES = [470, 494, 518, 542];
const SAVED = 560;

function pressure(f: number) {
  if (f < DRAG[1]) return interpolate(f, [90, DRAG[1]], [52, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < ALARM) return interpolate(f, [DRAG[1], ALARM], [60, 97], { easing: (t) => t * t });
  if (f < PRESSES[0]) return 97 + Math.abs(Math.sin(f / 3)) * 2.4;
  const done = PRESSES.filter((p) => f >= p).length;
  const target = 99 - done * 17;
  return f >= SAVED ? interpolate(f, [SAVED, SAVED + 20], [target, 32], { extrapolateRight: "clamp" }) : target;
}

/** Barrels hauled so far: Normal is steady, Overdrive races; the counter holds while capping. */
function haul(f: number) {
  const normal = Math.max(0, Math.min(f, DRAG[1]) - 90) * 0.06;
  const over = Math.max(0, Math.min(f, CAP) - DRAG[1]) * 0.06 * CHOKES.overdrive.output * 1.6;
  return normal + over;
}

export function Ep2Pressure() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Panel frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={2} line="Push it. Don't blow it." color={C.red} />}
      <Shutter frame={frame} fps={fps} ep={2} title={["Push it.", "Don't blow it."]} color={C.red} />
      <Dissolve frame={frame} start={END} color={C.red} />
    </AbsoluteFill>
  );
}

/** The dial: twenty pixel segments over a half circle and a needle. */
function Gauge({ p }: { p: number }) {
  const segs = 20;
  const cx = 400;
  const cy = 400;
  const a = Math.PI * (1 - p / 100);
  return (
    <svg width={800} height={460} viewBox="0 0 800 460" shapeRendering="crispEdges">
      <path d={`M 20 ${cy} A 380 380 0 0 1 780 ${cy} Z`} fill={C.ink} />
      <path d={`M 44 ${cy} A 356 356 0 0 1 756 ${cy} Z`} fill={C.sunPale} />
      {Array.from({ length: segs }, (_, i) => {
        const t = (i + 0.5) / segs;
        const ang = Math.PI * (1 - t);
        const x = cx + Math.cos(ang) * 300;
        const y = cy - Math.sin(ang) * 300;
        const v = t * 100;
        const color = v > 85 ? C.red : v > 60 ? C.sunDeep : C.leaf;
        const lit = v <= p + 2.5;
        return <rect key={i} x={snap(x - 22, 4)} y={snap(y - 22, 4)} width={44} height={44} fill={lit ? color : C.steelLight} stroke={C.ink} strokeWidth={5} />;
      })}
      <line x1={cx} y1={cy} x2={cx + Math.cos(a) * 250} y2={cy - Math.sin(a) * 250} stroke={C.ink} strokeWidth={22} strokeLinecap="square" />
      <line x1={cx} y1={cy} x2={cx + Math.cos(a) * 240} y2={cy - Math.sin(a) * 240} stroke={p > 85 ? C.red : C.hat} strokeWidth={10} strokeLinecap="square" />
      <rect x={cx - 34} y={cy - 34} width={68} height={68} fill={C.ink} />
      <rect x={cx - 18} y={cy - 18} width={36} height={36} fill={C.steel} />
    </svg>
  );
}

function Panel({ frame, fps }: { frame: number; fps: number }) {
  const p = pressure(frame);
  const hot = p > 85 && frame < SAVED;
  const shake = p > 92 && frame < SAVED ? snap(Math.sin(frame * 2.7) * 6, 2) : 0;
  const over = frame >= DRAG[1] && frame < SAVED + 30;
  const choke = frame < DRAG[0] ? 0 : frame < DRAG[1] ? (frame - DRAG[0]) / (DRAG[1] - DRAG[0]) : frame < SAVED + 10 ? 1 : 1 - Math.min(1, (frame - SAVED - 10) / 20);
  const status = frame >= SAVED ? "Saved" : frame >= CAP ? "Capping" : hot ? "Warning" : over ? "Overdrive" : "Normal";
  const statusBg = status === "Saved" ? C.leaf : status === "Normal" ? C.sun : C.red;
  const h = haul(frame);
  const cap = PRESSES.filter((x) => frame >= x).length;

  // the lever: Normal sits in the middle of the slot, Overdrive at the top
  const slot = { x: 170, y: 300, h: 460 };
  const knobY = slot.y + slot.h / 2 - choke * (slot.h / 2) - 40;

  return (
    <AbsoluteFill style={{ translate: `${shake}px ${-shake / 2}px` }}>
      {/* the riveted panel */}
      <div style={{ position: "absolute", inset: 0, background: C.steel }} />
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: (i % 8) * 260 + 30, top: i < 8 ? 24 : 1036, width: 16, height: 16, background: C.steelDeep }} />
      ))}
      {hot && <AbsoluteFill style={{ boxShadow: `inset 0 0 0 ${frame % 16 < 8 ? 28 : 14}px ${C.red}`, zIndex: 70 }} />}

      {/* warning lamp */}
      <div style={{ position: "absolute", left: 1600, top: 60, width: 120, height: 60, background: hot && frame % 16 < 8 ? C.red : C.redDeep, boxShadow: ring(6) }} />

      {/* choke lever */}
      <div style={{ position: "absolute", left: 60, top: 200, width: 440, height: 640, background: C.steelLight, boxShadow: ring(7) }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.ink, textAlign: "center", marginTop: 26 }}>Choke</div>
      </div>
      <div style={{ position: "absolute", left: slot.x, top: slot.y, width: 34, height: slot.h, background: C.ink }} />
      {[
        ["Overdrive", 0, C.red],
        ["Normal", 0.5, C.sunDeep],
        ["Safe", 1, C.leaf],
      ].map(([label, k, color]) => (
        <div key={label as string} style={{ position: "absolute", left: slot.x + 96, top: slot.y + (k as number) * slot.h - 20, fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: color as string }}>
          {label}
        </div>
      ))}
      <div style={{ position: "absolute", left: slot.x - 33, top: knobY, width: 100, height: 80, background: C.red, boxShadow: ring(7) }} />
      {frame >= DRAG[0] - 50 && frame < DRAG[1] + 40 && <Pointer x={slot.x + 20 + (frame < DRAG[0] ? (DRAG[0] - frame) * 6 : 0)} y={knobY + 30 + (frame < DRAG[0] ? (DRAG[0] - frame) * 3 : 0)} down={frame >= DRAG[0] && frame <= DRAG[1]} scale={7} />}
      {frame >= DRAG[1] && frame < DRAG[1] + 50 && (
        <div style={{ position: "absolute", left: 300, top: slot.y - 90, rotate: "-6deg", scale: String(spring({ frame: frame - DRAG[1], fps, config: { damping: 7, stiffness: 260 } })), zIndex: 60 }}>
          <div style={{ padding: "10px 22px", background: C.red, boxShadow: ring(6), fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.white, display: "flex", alignItems: "center", gap: 12 }}>
            <Spr rows={flameA} palette={flamePalette} scale={3} />x{CHOKES.overdrive.output}!
          </div>
        </div>
      )}

      {/* the gauge */}
      <div style={{ position: "absolute", left: 560, top: 150 }}>
        <Gauge p={p} />
      </div>
      <div style={{ position: "absolute", left: 560, top: 610, width: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ padding: "10px 30px", background: C.ink, fontFamily: font.logo, fontWeight: 700, fontSize: 72, color: hot ? C.red : C.leaf, minWidth: 220, textAlign: "center" }}>{Math.round(p)}</div>
        <div style={{ padding: "16px 30px", background: statusBg, boxShadow: ring(6), fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: status === "Normal" ? C.ink : C.white }}>{status}</div>
      </div>

      {/* the haul counter */}
      <div style={{ position: "absolute", left: 1460, top: 200, width: 400, padding: 26, background: C.ink, boxShadow: ring(7, C.steelDeep), display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sunPale }}>Haul</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 92, color: C.sun, lineHeight: 1 }}>{h.toFixed(1)}</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white }}>bbl</span>
        <div style={{ padding: "10px 16px", background: over ? C.red : C.steelDeep, fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white, textAlign: "center", scale: over && frame < SAVED ? String(1 + (Math.floor(frame / 10) % 2) * 0.06) : undefined }}>
          x{(over && frame < SAVED + 30 ? CHOKES.overdrive.output : CHOKES.normal.output).toFixed(1)}
        </div>
      </div>
      {over && frame < CAP && Array.from({ length: 3 }, (_, i) => <Popup key={i} frame={frame} at={DRAG[1] + 40 + i * 60} x={1660} y={170} size={40} life={50}>+bbl</Popup>)}

      {/* alarm text */}
      {frame >= ALARM && frame < CAP + 30 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 30, display: "flex", justifyContent: "center", zIndex: 80, opacity: frame % 12 < 8 ? 1 : 0.4 }}>
          <Title size={80} color={C.red}>
            Blowout risk!
          </Title>
        </div>
      )}

      {/* the capping drill: four valves, in order */}
      {frame >= CAP && frame < SAVED + 40 && (
        <div style={{ position: "absolute", left: 470, top: 740, width: 980, padding: "22px 30px", background: C.white, boxShadow: ring(8), display: "flex", flexDirection: "column", gap: 16, scale: String(spring({ frame: frame - CAP, fps, config: { damping: 10, stiffness: 220 } })), zIndex: 85 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 38, color: C.ink }}>Capping drill</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 38, color: C.red }}>Combo x{cap}</span>
          </div>
          <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
            {[1, 2, 3, 4].map((k, i) => {
              const closed = frame >= PRESSES[i] + 4;
              const down = frame >= PRESSES[i] && frame < PRESSES[i] + 8;
              const next = !closed && (i === 0 || frame >= PRESSES[i - 1] + 4);
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: closed ? C.leaf : next ? C.sunPale : C.steelLight, boxShadow: `0 0 0 5px ${C.ink}` }}>
                  <Spr rows={valve} scale={5} style={{ rotate: closed ? "90deg" : undefined }} />
                  <Key k={String(k)} down={down} size={54} />
                </div>
              );
            })}
          </div>
          <Bar p={cap / 4} w={920} h={34} color={C.leaf} />
        </div>
      )}
      {PRESSES.map((at, i) => (
        <Popup key={i} frame={frame} at={at} x={600 + i * 230} y={720} size={40} life={36} color={C.leaf}>
          Closed!
        </Popup>
      ))}
      {frame >= SAVED && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", zIndex: 95 }}>
          <div style={{ padding: "24px 70px", background: C.leaf, boxShadow: ring(10), rotate: "-5deg", scale: String(interpolate(spring({ frame: frame - SAVED, fps, config: { damping: 7, stiffness: 240 } }), [0, 1], [3, 1])) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 120, color: C.white }}>Saved!</span>
          </div>
        </div>
      )}
      <Burst frame={frame} start={SAVED} x={960} y={360} rows={icons.coin} scale={6} count={22} speed={19} seed="saved" />
    </AbsoluteFill>
  );
}
