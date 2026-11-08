import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Chip, font, ramp, ring, Title } from "../brand";
import { EndCard, Footage } from "./Next01";

// next03: the daily swap. A slot machine holds a task that isn't moving; the lever comes down, the reel
// spins through the task pool and lands on a new one, and the swap lamp goes out: one swap a day.
// An iris opens on the real panel doing the same swap.

export const NEXT03_SECONDS = 14;

/** Shift tasks at rig level 5; the reel starts on the first and lands on the last. */
const REEL = [
  "Pump on Overdrive for 135 seconds",
  "Collect 170 bbl from your wells",
  "Hold the rig through 2 storms",
  "Refine 19 bbl of diesel, jet fuel or LNG",
  "Cap a blowout with the capping drill",
  "Sell 85 bbl of heavy crude",
  "Fill 3 Dispatch contracts",
  "Earn 1,500 coins from sales and contracts",
  "Sell 170 bbl on the market",
  "Build or upgrade a refinery unit, or the rig",
];
const ROW = 260;
const SPIN = { pull: 110, start: 126, end: 330 };
const STOP = 2 * REEL.length + REEL.length - 1;
const IRIS = 400;
const NIGHT = "#141a33";

const BOX = { x: 260, y: 300, w: 1400, h: 380 };

function Bulbs({ frame, fast }: { frame: number; fast: boolean }) {
  const n = 22;
  const step = Math.floor(frame / (fast ? 4 : 10));
  const per = { top: n, side: 6 };
  const bulbs: { x: number; y: number }[] = [];
  for (let i = 0; i < per.top; i++) bulbs.push({ x: 150 + i * (1620 / (per.top - 1)), y: 190 });
  for (let i = 1; i < per.side; i++) bulbs.push({ x: 1770, y: 190 + i * 130 });
  for (let i = per.top - 1; i >= 0; i--) bulbs.push({ x: 150 + i * (1620 / (per.top - 1)), y: 840 });
  for (let i = per.side - 1; i > 0; i--) bulbs.push({ x: 150, y: 190 + i * 130 });
  return (
    <>
      {bulbs.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x - 13, top: b.y - 13, width: 26, height: 26, background: (i + step) % 3 === 0 ? "#fff6c8" : C.sunDeep, boxShadow: `0 0 0 4px ${C.ink}` }} />
      ))}
    </>
  );
}

export function Next03() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [SPIN.start, SPIN.end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.15, 0.6, 0.25, 1) });
  const p = t * STOP;
  const speed = frame > SPIN.start && frame < SPIN.end ? Math.abs(interpolate(frame + 1, [SPIN.start, SPIN.end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.15, 0.6, 0.25, 1) }) - t) * STOP : 0;
  const landed = frame >= SPIN.end;
  const lever = frame < SPIN.pull ? 0 : frame < SPIN.pull + 14 ? ramp(frame, SPIN.pull, 14) : 1 - ramp(frame, SPIN.pull + 22, 20);
  const iris = frame < IRIS ? 1 : interpolate(frame, [IRIS, IRIS + 22], [1, 0], { extrapolateRight: "clamp" });
  const open = interpolate(frame, [IRIS + 22, IRIS + 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enter = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 140 } });
  const win = landed ? spring({ frame: frame - SPIN.end, fps, config: { damping: 8, stiffness: 240 } }) : 0;

  return (
    <AbsoluteFill style={{ background: NIGHT, overflow: "hidden" }}>
      {/* the real swap, behind the iris */}
      {frame >= IRIS + 18 && (
        <AbsoluteFill style={{ background: C.sun, clipPath: `circle(${open * 1200}px at 50% 50%)` }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-conic-gradient(rgba(255,255,255,0.12) 0 25%, transparent 0 50%)", backgroundSize: "40px 40px" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center" }}>
            <Title size={84}>Tap Swap on a task</Title>
          </div>
          <Footage src="shift" from={12.9} start={IRIS + 18} dur={300} box={{ x: 280, y: 200, w: 1360, h: 765 }} view={{ x: 0, y: 0, w: 1920 }} style={{ boxShadow: `${ring(9)}, 18px 22px 0 rgba(30,42,74,0.3)` }} />
          {frame >= 560 && (
            <div style={{ position: "absolute", left: 280, top: 985, scale: String(spring({ frame: frame - 560, fps, config: { damping: 9 } })) }}>
              <Chip bg={C.red} color={C.white} size={40}>
                <span style={{ fontFamily: font.logo }}>New task dealt</span>
              </Chip>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* the slot machine */}
      {iris > 0 && (
        <AbsoluteFill style={{ clipPath: frame < IRIS ? undefined : `circle(${iris * 1200}px at 50% 50%)`, background: NIGHT, scale: String(interpolate(enter, [0, 1], [0.9, 1])) }}>
          <div style={{ position: "absolute", left: 150, top: 190, width: 1620, height: 650, background: C.red, boxShadow: `${ring(10)}, inset 0 -40px 0 #b8322a` }} />
          <Bulbs frame={frame} fast={landed && frame < SPIN.end + 80} />
          {/* marquee */}
          <div style={{ position: "absolute", left: 560, top: 70, width: 800, height: 110, background: C.sun, boxShadow: ring(8), display: "grid", placeItems: "center" }}>
            <Title size={72} color={C.red}>
              Task swap
            </Title>
          </div>
          {/* the reel window */}
          <div style={{ position: "absolute", left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, background: C.white, boxShadow: `${ring(8)}, inset 0 30px 30px -20px rgba(30,42,74,0.4), inset 0 -30px 30px -20px rgba(30,42,74,0.4)`, overflow: "hidden" }}>
            {[-1, 0, 1, 2].map((d) => {
              const r = Math.floor(p) + d;
              const y = BOX.h / 2 - ROW / 2 + (r - p) * ROW;
              const label = REEL[((r % REEL.length) + REEL.length) % REEL.length];
              const isEnd = landed && r === STOP;
              return (
                <div key={r} style={{ position: "absolute", left: 0, right: 0, top: y, height: ROW, display: "grid", placeItems: "center", padding: "0 60px", textAlign: "center", fontFamily: font.display, fontWeight: 700, fontSize: 58, lineHeight: 1.1, color: isEnd ? C.leaf : C.ink, opacity: speed > 0.12 ? 0.55 : 1, filter: speed > 0.2 ? "blur(2px)" : undefined }}>
                  {label}
                </div>
              );
            })}
            {/* centre line marks */}
            <div style={{ position: "absolute", left: 0, top: BOX.h / 2 - 8, width: 30, height: 16, background: C.red }} />
            <div style={{ position: "absolute", right: 0, top: BOX.h / 2 - 8, width: 30, height: 16, background: C.red }} />
            {frame < SPIN.start && (
              <div style={{ position: "absolute", left: 420, right: 420, bottom: 46, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, height: 22, background: C.ink, padding: 4 }}>
                  <div style={{ width: "30%", height: "100%", background: C.sea }} />
                </div>
                <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: C.ink2 }}>40/135</span>
              </div>
            )}
          </div>
          {/* lever */}
          <div style={{ position: "absolute", left: 1790, top: 520, width: 40, height: 120, background: C.steel, boxShadow: ring(5) }} />
          <div style={{ position: "absolute", left: 1800, top: 520, width: 20, height: 300, transformOrigin: "50% 0", rotate: `${180 - 160 * (1 - lever) - 20 * lever}deg`, background: C.steelLight, boxShadow: ring(4) }}>
            <div style={{ position: "absolute", left: -20, bottom: -40, width: 60, height: 60, background: C.red, boxShadow: `${ring(5)}, inset -10px -10px 0 #b8322a` }} />
          </div>
          {/* the swap lamp and the line under it */}
          <div style={{ position: "absolute", left: 260, top: 720, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 44, height: 44, background: landed ? "#3a2a0c" : Math.floor(frame / 12) % 2 ? C.sun : "#ffe98a", boxShadow: ring(5) }} />
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.white, letterSpacing: 2 }}>Swaps left today: {landed ? 0 : 1}</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 900, display: "flex", justifyContent: "center" }}>
            {landed ? (
              <div style={{ scale: String(win) }}>
                <Chip bg={C.sun} size={48}>
                  <span style={{ fontFamily: font.logo }}>One swap a day</span>
                </Chip>
              </div>
            ) : (
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 52, color: C.sunPale, opacity: ramp(frame, 20, 20) }}>Stuck on a task? Pull the lever.</span>
            )}
          </div>
        </AbsoluteFill>
      )}

      <EndCard frame={frame} start={710} line={["One swap", "every day"]} bg={NIGHT} ink={C.red} accent={C.sun} text={C.sunPale} />
    </AbsoluteFill>
  );
}
