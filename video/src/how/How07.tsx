import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons } from "@/components/pixel/sprites";
import { CONTRACT_EVERY, CONTRACT_SLOTS, PRODUCTS } from "@/lib/game/content";
import { Burst, C, Chip, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Shutter } from "../ep/kit";

// How 07 · The Dispatch board. A dispatch office: the wall clock counts down
// the 45 seconds to the next contract, the ticket printer chatters out a
// contract (Diesel, 5 bbl, 40 coins against a base of 33, a deadline ticking
// from 5:00), the cursor stamps it ACCEPTED, five barrels fill the order, and
// COLLECT pays the premium, with base and premium side by side.

export const HOW07_SECONDS = 14;
const END = 730;

const QTY = 5;
const BASE = Math.round(QTY * PRODUCTS.diesel.base); // 33
const REWARD = Math.round(QTY * PRODUCTS.diesel.base * 1.2); // 40

const CLOCK = [94, 250];
const PRINT = [256, 350];
const MOVE = [360, 392];
const STAMP = 412;
const FILLS = [446, 466, 486, 506, 526];
const COLLECT = 572;
const SUMMARY = 650;

export function How07() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={7} tag="How it works" line="Dispatch board" color={C.sunDeep} /> : <Office frame={frame} fps={fps} />}
      <Shutter frame={frame} fps={fps} ep={7} tag="How 07" title="The Dispatch board" color={C.sunDeep} />
      <Dissolve frame={frame} start={END} color={C.sunDeep} />
    </AbsoluteFill>
  );
}

function Office({ frame, fps }: { frame: number; fps: number }) {
  // time-lapse to the first contract, then the next one counts down in real time
  const secs = frame < CLOCK[1] ? Math.max(0, Math.ceil(interpolate(frame, CLOCK, [CONTRACT_EVERY, 0], { extrapolateLeft: "clamp" }))) : frame < CLOCK[1] + 30 ? 0 : CONTRACT_EVERY - Math.floor((frame - CLOCK[1] - 30) / 60);
  const ding = frame >= CLOCK[1] && frame < CLOCK[1] + 30;
  const printing = frame >= PRINT[0] && frame < PRINT[1];
  const jit = printing ? snap(Math.sin(frame * 3) * 3, 1) : 0;

  const filled = FILLS.filter((f) => frame >= f + 10).length;

  // the cursor: to the stamp, then to COLLECT
  const ptr = (() => {
    if (frame < STAMP - 50 || frame > COLLECT + 30) return null;
    if (frame < STAMP + 10) {
      const m = interpolate(frame, [STAMP - 50, STAMP - 4], [0, 1], { extrapolateRight: "clamp" });
      return { x: 1500 + (1360 - 1500) * m, y: 1040 + (520 - 1040) * m, down: frame >= STAMP && frame < STAMP + 8 };
    }
    const m = interpolate(frame, [COLLECT - 40, COLLECT - 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { x: 1360 + (1700 - 1360) * m, y: 520 + (870 - 520) * m, down: frame >= COLLECT && frame < COLLECT + 8 };
  })();

  return (
    <AbsoluteFill>
      {/* wallpaper, skirting and the desk */}
      <div style={{ position: "absolute", inset: 0, background: C.sunPale, backgroundImage: `linear-gradient(90deg, ${C.sun} 10px, transparent 10px)`, backgroundSize: "80px 80px", opacity: 1 }} />
      <div style={{ position: "absolute", left: 0, top: 740, width: 1920, height: 340, background: C.wood, borderTop: `14px solid ${C.woodDark}` }} />
      <div style={{ position: "absolute", left: 0, top: 790, width: 1920, height: 8, background: C.woodDark, opacity: 0.5 }} />

      {/* the wall clock: 45 seconds to the next contract */}
      <div style={{ position: "absolute", left: 120, top: 120, width: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <WallClock frame={frame} secs={secs} ding={ding} />
        <Chip bg={C.ink} color={C.sunPale} size={30}>
          <span style={{ fontFamily: font.logo }}>Next contract in {secs}s</span>
        </Chip>
      </div>
      {ding && (
        <div style={{ position: "absolute", left: 420, top: 100, rotate: "10deg", zIndex: 30, scale: String(spring({ frame: frame - CLOCK[1], fps, config: { damping: 7, stiffness: 260 } })) }}>
          <Chip bg={C.red} color={C.white} size={40}>
            <span style={{ fontFamily: font.logo }}>Ding!</span>
          </Chip>
        </div>
      )}

      {/* the ticket printer */}
      <div style={{ position: "absolute", left: 560, top: 560 + jit, width: 480, height: 200, background: C.steelLight, boxShadow: ring(8) }}>
        <div style={{ position: "absolute", left: 40, top: 18, width: 400, height: 22, background: C.ink }} />
        <div style={{ position: "absolute", left: 30, top: 80, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink }}>Dispatch</div>
        <div style={{ position: "absolute", right: 30, top: 80, width: 28, height: 28, background: printing && frame % 10 < 5 ? C.leaf : C.redDeep, boxShadow: `0 0 0 4px ${C.ink}` }} />
        <div style={{ position: "absolute", left: 30, top: 140, right: 30, height: 18, background: C.steel }} />
      </div>
      <Ticket frame={frame} fps={fps} />

      {/* the order tray: five barrels fill it */}
      {frame >= STAMP + 20 && (
        <div style={{ position: "absolute", left: 1080, top: 800, width: 520, padding: "18px 22px", background: C.woodDark, boxShadow: ring(7), display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", scale: String(spring({ frame: frame - STAMP - 20, fps, config: { damping: 11, stiffness: 220 } })) }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale }}>Fill the order</span>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: filled === QTY ? "#7dffb0" : C.sun }}>
              {filled}/{QTY} bbl
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, height: 84 }}>
            {Array.from({ length: QTY }, (_, i) => {
              const t = frame - FILLS[i];
              const y = t < 0 ? -200 : t < 10 ? snap(interpolate(t, [0, 10], [-140, 0]), 6) : 0;
              return (
                <div key={i} style={{ width: 84, height: 84, background: C.ink, position: "relative" }}>
                  {t >= 0 && <Spr rows={barrel} palette={{ ...base, R: PRODUCTS.diesel.color, W: PRODUCTS.diesel.shine }} scale={6} x={3} y={y} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {FILLS.map((f, i) => (
        <Popup key={i} frame={frame} at={f + 10} x={1130 + i * 98} y={780} size={30} life={30} color={C.leaf}>
          +1
        </Popup>
      ))}

      {/* COLLECT */}
      {frame >= FILLS[4] + 10 && (
        <div style={{ position: "absolute", left: 1630, top: 840, width: 240, padding: "20px 0", background: frame >= COLLECT + 4 ? C.leaf : C.red, boxShadow: ring(7), textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.white, translate: frame >= COLLECT && frame < COLLECT + 8 ? "0 6px" : undefined, scale: frame < COLLECT ? String(1 + (Math.floor(frame / 8) % 2) * 0.06) : undefined, zIndex: 40 }}>
          {frame >= COLLECT + 4 ? "Paid!" : "Collect"}
        </div>
      )}
      <Burst frame={frame} start={COLLECT + 4} x={1750} y={860} rows={icons.coin} scale={5} count={18} speed={17} seed="collect" />
      {frame >= COLLECT + 10 && frame < SUMMARY && <Compare frame={frame - COLLECT - 10} fps={fps} />}

      {ptr && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x} y={ptr.y} down={ptr.down} scale={7} />
        </AbsoluteFill>
      )}

      {frame >= SUMMARY && <Summary frame={frame - SUMMARY} fps={fps} />}
    </AbsoluteFill>
  );
}

function WallClock({ frame, secs, ding }: { frame: number; secs: number; ding: boolean }) {
  const a = ((CONTRACT_EVERY - secs) / CONTRACT_EVERY) * Math.PI * 2 - Math.PI / 2;
  const segs = 24;
  return (
    <div style={{ position: "relative", width: 300, height: 300, scale: ding ? String(1 + Math.max(0, 1 - (frame - CLOCK[1]) / 12) * 0.1) : undefined }}>
      <svg width={300} height={300} viewBox="0 0 300 300" shapeRendering="crispEdges">
        <circle cx={150} cy={150} r={146} fill={C.ink} />
        <circle cx={150} cy={150} r={128} fill={C.white} />
        {Array.from({ length: segs }, (_, i) => {
          const t = (i + 0.5) / segs;
          const ang = t * Math.PI * 2 - Math.PI / 2;
          const left = i / segs < secs / CONTRACT_EVERY;
          return <rect key={i} x={snap(150 + Math.cos(ang) * 104 - 10, 4)} y={snap(150 + Math.sin(ang) * 104 - 10, 4)} width={20} height={20} fill={left ? C.sunDeep : C.steelLight} />;
        })}
        <line x1={150} y1={150} x2={150 + Math.cos(a) * 86} y2={150 + Math.sin(a) * 86} stroke={C.red} strokeWidth={12} strokeLinecap="square" />
        <rect x={136} y={136} width={28} height={28} fill={C.ink} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", paddingTop: 110, fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink }}>{secs}</div>
    </div>
  );
}

/** The contract ticket: it prints up out of the slot, moves to the right and gets stamped. */
function Ticket({ frame, fps }: { frame: number; fps: number }) {
  if (frame < PRINT[0]) return null;
  const H = 520;
  const shown = snap(interpolate(frame, PRINT, [0, H], { extrapolateRight: "clamp" }), 26);
  const m = interpolate(frame, MOVE, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (k) => 1 - (1 - k) ** 3 });
  const x = 610 + (1120 - 610) * m;
  const bottom = 560 + (700 - 560) * m;
  const sc = 1 + m * 0.12;
  const deadline = Math.max(0, 300 - Math.max(0, Math.floor((frame - PRINT[1]) / 3)));
  const mm = Math.floor(deadline / 60);
  const ss = String(deadline % 60).padStart(2, "0");
  const rows: [string, React.ReactNode][] = [
    ["Product", "Diesel"],
    ["Amount", `${QTY} bbl`],
    ["Base", `${BASE}`],
    ["Reward", <span style={{ color: C.leaf }}>{REWARD}</span>],
  ];
  return (
    <div style={{ position: "absolute", left: x, top: bottom - shown, width: 380, height: shown, overflow: "hidden", scale: String(sc), transformOrigin: "50% 100%", zIndex: 20 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 380, height: H, background: C.white, boxShadow: `inset 0 0 0 6px ${C.ink}`, padding: "22px 26px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Spr rows={barrel} palette={{ ...base, R: PRODUCTS.diesel.color, W: PRODUCTS.diesel.shine }} scale={4} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: C.ink }}>Contract</span>
        </div>
        <div style={{ height: 6, background: `repeating-linear-gradient(90deg, ${C.ink} 0 12px, transparent 12px 20px)` }} />
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink }}>
            <span style={{ color: C.ink2 }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
        <div style={{ alignSelf: "flex-end" }}>
          <Chip bg={C.leaf} color={C.white} size={26}>
            <span style={{ fontFamily: font.logo }}>+20% premium</span>
          </Chip>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.ink }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sunPale }}>Deadline</span>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: C.sun }}>
            {mm}:{ss}
          </span>
        </div>
      </div>
      {frame >= STAMP && (
        <div style={{ position: "absolute", left: 96, top: 10, rotate: "-10deg", scale: String(interpolate(spring({ frame: frame - STAMP, fps, config: { damping: 12, stiffness: 260 } }), [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), padding: "8px 18px", border: `6px solid ${C.red}`, background: C.white, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.red }}>
          Accepted
        </div>
      )}
    </div>
  );
}

/** Base against premium, as two bars. */
function Compare({ frame, fps }: { frame: number; fps: number }) {
  const grow = interpolate(frame, [4, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (k) => 1 - (1 - k) ** 3 });
  const max = 560;
  const bars: [string, number, string][] = [
    ["Base", BASE, C.steelDeep],
    ["Contract", REWARD, C.leaf],
  ];
  return (
    <div style={{ position: "absolute", left: 100, top: 320, width: 900, padding: "26px 32px", background: C.white, boxShadow: `${ring(8)}, 0 0 0 14px ${C.sunDeep}`, display: "flex", flexDirection: "column", gap: 18, boxSizing: "border-box", zIndex: 60, scale: String(spring({ frame, fps, config: { damping: 11, stiffness: 220 } })) }}>
      <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.ink }}>Same 5 barrels</span>
      {bars.map(([k, v, c]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 170, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.ink2 }}>{k}</span>
          <div style={{ width: snap((max * v * grow) / REWARD, 8), height: 44, background: c, boxShadow: `0 0 0 4px ${C.ink}` }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: c }}>{Math.round(v * grow)}</span>
        </div>
      ))}
      {frame >= 34 && (
        <div style={{ alignSelf: "flex-end", scale: String(spring({ frame: frame - 34, fps, config: { damping: 8, stiffness: 240 } })) }}>
          <Chip bg={C.leaf} color={C.white} size={32}>
            <span style={{ fontFamily: font.logo }}>+{REWARD - BASE} coins premium</span>
          </Chip>
        </div>
      )}
    </div>
  );
}

function Summary({ frame, fps }: { frame: number; fps: number }) {
  const lines = [`A new contract every ${CONTRACT_EVERY}s`, `Up to ${CONTRACT_SLOTS} on the board`, "10–30% above base", "Fill it before the deadline"];
  return (
    <AbsoluteFill style={{ zIndex: 70 }}>
      <AbsoluteFill style={{ background: C.ink, opacity: Math.min(0.75, frame / 10) }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title size={80} color={C.sun}>
          Dispatch board
        </Title>
        {lines.map((l, i) => (
          <div key={l} style={{ scale: String(spring({ frame: frame - 6 - i * 6, fps, config: { damping: 10, stiffness: 220 } })) }}>
            <Chip bg={C.white} color={C.ink} size={38}>
              <span style={{ fontFamily: font.logo }}>{l}</span>
            </Chip>
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
