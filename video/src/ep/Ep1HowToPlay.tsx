import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, drop, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { Burst, C, font, Pointer, Spr, ring, snap } from "../brand";
import { Bar, bumpAt, Counter, Dissolve, dissolved, EpEnd, Key, Popup, Prompt, Shutter } from "./kit";

// EP 1 · Your first shift in 15 seconds. A tutorial with a quest log: the deck
// seen from above, a D-pad and key prompts on screen, and every step ticked off
// as the roughneck connects, walks to a pad, drills, collects and sells.

export const EP1_SECONDS = 15;
const END = 780;

const Q = { connect: 80, walk: 190, drill: 330, collect: 460, sell: 590 };
const QUESTS = ["Connect wallet", "Walk to a pad", "Press E to drill", "Collect barrels", "Sell at the market"];
const DONE = [175, 320, 445, 575, 720];

const PAD = { x: 760, y: 420 };
const MARKET = { x: 1170, y: 420 };

/** The roughneck's spot on the deck, by frame. */
function player(frame: number) {
  const path: [number, number, number][] = [
    [Q.walk, 300, 760],
    [Q.walk + 60, 640, 760],
    [Q.walk + 120, 640, 470],
    [Q.walk + 130, 700, 470],
    [Q.sell, 700, 470],
    [Q.sell + 50, 1110, 470],
  ];
  if (frame <= path[0][0]) return { x: path[0][1], y: path[0][2], dir: "" };
  for (let i = 1; i < path.length; i++) {
    const [t1, x1, y1] = path[i];
    const [t0, x0, y0] = path[i - 1];
    if (frame <= t1) {
      const p = (frame - t0) / Math.max(1, t1 - t0);
      const dir = x1 > x0 ? "D" : x1 < x0 ? "A" : y1 < y0 ? "W" : y1 > y0 ? "S" : "";
      return { x: snap(x0 + (x1 - x0) * p, 6), y: snap(y0 + (y1 - y0) * p, 6), dir };
    }
  }
  const last = path[path.length - 1];
  return { x: last[1], y: last[2], dir: "" };
}

export function Ep1HowToPlay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Deck frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={1} line="Your first shift" color={C.sun} />}
      <Shutter frame={frame} fps={fps} ep={1} title={["Your first shift", "in 15 seconds"]} color={C.sun} />
      <Dissolve frame={frame} start={END} color={C.sun} />
    </AbsoluteFill>
  );
}

function Deck({ frame, fps }: { frame: number; fps: number }) {
  const p = player(frame);
  const walking = p.dir !== "";
  const drilled = frame >= Q.drill + 90;
  const drillP = interpolate(frame, [Q.drill + 30, Q.drill + 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ready = drilled ? Math.min(5, Math.floor((frame - Q.drill - 90) / 10)) : 0;
  const collected = frame >= Q.collect + 40;
  const bbl = collected ? (frame >= Q.sell + 110 ? 0 : 12) : 0;
  const coinsAt = Q.sell + 110;
  const coins = 60 + (frame >= coinsAt ? Math.round(Math.min(1, (frame - coinsAt) / 30) * 54) : 0);

  return (
    <AbsoluteFill>
      {/* steel deck tiles */}
      <div style={{ position: "absolute", inset: 0, background: C.steel, backgroundImage: `linear-gradient(${C.steelDeep} 4px, transparent 4px), linear-gradient(90deg, ${C.steelDeep} 4px, transparent 4px)`, backgroundSize: "120px 120px" }} />
      {/* hazard walkway */}
      <div style={{ position: "absolute", left: 240, top: 840, width: 1100, height: 30, background: `repeating-linear-gradient(135deg, ${C.sun} 0 24px, ${C.ink} 24px 48px)` }} />
      {/* four drill pads */}
      {[
        [520, 300],
        [PAD.x - 60, PAD.y - 120],
        [520, 560],
        [880, 600],
      ].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 140, height: 140, background: `repeating-linear-gradient(45deg, ${C.sun} 0 16px, ${C.ink} 16px 32px)`, boxShadow: ring(6) }}>
          <div style={{ position: "absolute", inset: 18, background: C.steelDeep }} />
        </div>
      ))}
      {/* the derrick on the chosen pad */}
      {frame >= Q.drill + 30 && (
        <div style={{ position: "absolute", left: PAD.x - 64, top: PAD.y - 210, scale: String(spring({ frame: frame - Q.drill - 30, fps, config: { damping: 8, stiffness: 200 } })), transformOrigin: "50% 100%" }}>
          <Spr rows={icons.derrick} scale={8} style={{ translate: `0 ${drilled ? (Math.floor(frame / 8) % 2) * 4 : 0}px` }} />
        </div>
      )}
      {Array.from({ length: frame < Q.collect + 40 ? ready : 0 }, (_, i) => (
        <Spr key={i} rows={barrel} scale={5} x={PAD.x + 70 + (i % 3) * 46} y={PAD.y - 40 + Math.floor(i / 3) * 56} />
      ))}
      {drilled && frame < Q.collect + 40 && <Spr rows={drop} scale={5} x={PAD.x - 10} y={PAD.y - 250 - (Math.floor(frame / 12) % 3) * 10} />}
      {/* the market kiosk */}
      <div style={{ position: "absolute", left: MARKET.x, top: MARKET.y - 120, width: 220, height: 200, background: C.white, boxShadow: ring(7) }}>
        <div style={{ height: 50, background: `repeating-linear-gradient(90deg, ${C.red} 0 30px, ${C.white} 30px 60px)`, borderBottom: `6px solid ${C.ink}` }} />
        <div style={{ padding: 14, fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.ink, textAlign: "center" }}>Market</div>
        <Spr rows={icons.coin} scale={5} x={78} y={118} />
      </div>
      {/* the roughneck */}
      <Spr rows={roughneck} palette={base} scale={7} x={p.x} y={p.y - (walking ? (Math.floor(frame / 6) % 2) * 7 : 0)} style={{ zIndex: 20 }} />

      {/* prompts */}
      {frame >= Q.drill && frame < Q.drill + 40 && <Prompt k="E" text="Drill" down={frame >= Q.drill + 18 && frame < Q.drill + 28} x={p.x + 40} y={p.y - 20} pop={spring({ frame: frame - Q.drill, fps, config: { damping: 9 } })} />}
      {frame >= Q.drill + 30 && frame < Q.drill + 100 && (
        <div style={{ position: "absolute", left: PAD.x + 110, top: PAD.y - 90, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", zIndex: 30 }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.ink }}>Drilling</span>
          <Bar p={drillP} w={300} />
        </div>
      )}
      {frame >= Q.collect && frame < Q.collect + 50 && <Prompt k="E" text="Collect" down={frame >= Q.collect + 22 && frame < Q.collect + 32} x={p.x + 40} y={p.y - 20} pop={spring({ frame: frame - Q.collect, fps, config: { damping: 9 } })} />}
      {frame >= Q.sell + 60 && frame < Q.sell + 130 && <Prompt k="E" text="Sell 12 bbl" down={frame >= Q.sell + 96 && frame < Q.sell + 106} x={p.x + 40} y={p.y - 20} pop={spring({ frame: frame - Q.sell - 60, fps, config: { damping: 9 } })} />}
      <Popup frame={frame} at={Q.drill + 92} x={PAD.x} y={PAD.y - 260} color={C.leaf}>
        Well online!
      </Popup>
      <Popup frame={frame} at={Q.collect + 40} x={p.x + 40} y={p.y - 60}>
        +12 bbl
      </Popup>
      <Popup frame={frame} at={coinsAt} x={MARKET.x + 110} y={MARKET.y - 170} color={C.sun}>
        +54 coins
      </Popup>
      <Burst frame={frame} start={coinsAt} x={MARKET.x + 100} y={MARKET.y - 60} rows={icons.coin} scale={5} count={16} speed={15} seed="sell" />

      {/* HUD: counters across the top */}
      <div style={{ position: "absolute", left: 40, top: 30, display: "flex", gap: 24, zIndex: 50 }}>
        <Counter label="Coins" value={coins} icon={<Spr rows={icons.coin} scale={4} />} bump={bumpAt(frame, coinsAt)} />
        <Counter label="Storage" value={`${bbl} bbl`} icon={<Spr rows={barrel} scale={4} />} bump={bumpAt(frame, Q.collect + 40)} />
      </div>

      {/* the D-pad, lit in the direction of travel */}
      <div style={{ position: "absolute", left: 60, top: 820, display: "grid", gridTemplateColumns: "repeat(3, 64px)", gap: 10, zIndex: 50 }}>
        <span />
        <Key k="W" down={p.dir === "W"} />
        <span />
        <Key k="A" down={p.dir === "A"} />
        <Key k="S" down={p.dir === "S"} />
        <Key k="D" down={p.dir === "D"} />
      </div>

      <Quests frame={frame} fps={fps} />
      {frame >= Q.connect && frame < Q.connect + 110 && <ConnectModal frame={frame - Q.connect} fps={fps} />}
      {frame >= DONE[4] && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", zIndex: 90 }}>
          <div style={{ padding: "26px 60px", background: C.leaf, boxShadow: ring(9), rotate: "-4deg", scale: String(interpolate(spring({ frame: frame - DONE[4], fps, config: { damping: 7, stiffness: 240 } }), [0, 1], [2.6, 1])) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 96, color: C.white }}>Shift complete!</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

function Quests({ frame, fps }: { frame: number; fps: number }) {
  return (
    <div style={{ position: "absolute", left: 1450, top: 160, width: 430, background: C.sunPale, boxShadow: ring(7), padding: "20px 24px", zIndex: 50 }}>
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.ink, marginBottom: 14 }}>Quest log</div>
      {QUESTS.map((q, i) => {
        const done = frame >= DONE[i];
        const active = !done && (i === 0 || frame >= DONE[i - 1]);
        const pop = done ? spring({ frame: frame - DONE[i], fps, config: { damping: 7, stiffness: 260 } }) : 0;
        return (
          <div key={q} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderTop: i ? `3px dashed ${C.steelLight}` : undefined, translate: active ? `${snap(Math.sin(frame / 6) * 4, 2)}px 0` : undefined }}>
            <div style={{ width: 38, height: 38, background: done ? C.leaf : active ? C.sun : C.white, boxShadow: `0 0 0 4px ${C.ink}`, display: "grid", placeItems: "center", color: C.white, fontFamily: font.logo, fontSize: 26, scale: done ? String(0.7 + pop * 0.3) : undefined, flexShrink: 0 }}>{done ? "✓" : ""}</div>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: done ? C.ink2 : C.ink, textDecoration: done ? "line-through" : undefined }}>{q}</span>
          </div>
        );
      })}
    </div>
  );
}

function ConnectModal({ frame, fps }: { frame: number; fps: number }) {
  const inS = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  const out = interpolate(frame, [96, 110], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clickAt = 52;
  const ok = frame >= clickAt + 6;
  const cx = interpolate(frame, [10, clickAt], [1300, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = interpolate(frame, [10, clickAt], [880, 590], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: `rgba(30,42,74,${0.55 * out})`, zIndex: 80 }}>
      <div style={{ position: "absolute", left: 610, top: 300, width: 700, padding: 40, background: C.white, boxShadow: ring(9), display: "flex", flexDirection: "column", alignItems: "center", gap: 30, scale: String(inS * out) }}>
        <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(5) }} />
        <div style={{ padding: "22px 54px", background: ok ? C.leaf : C.red, color: C.white, fontFamily: font.logo, fontWeight: 700, fontSize: 52, boxShadow: ring(7), translate: frame >= clickAt && frame < clickAt + 6 ? "0 6px" : undefined }}>{ok ? "Connected ✓" : "Connect wallet"}</div>
      </div>
      {out > 0.5 && <Pointer x={cx} y={cy} down={frame >= clickAt && frame < clickAt + 6} scale={7} />}
    </AbsoluteFill>
  );
}
