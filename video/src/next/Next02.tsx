import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { base, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, ramp, ring, Spr, Title } from "../brand";
import { EndCard, Footage } from "./Next01";

// next02: the shift streak. A wall calendar where a rubber stamp slams FULL SHIFT on seven days in a
// row while the bonus meter climbs +10% a day toward +100%; a missed day lets it settle back gently;
// then the calendar page flips up on the real full-shift bonus being claimed.

export const NEXT02_SECONDS = 15;

const DAYS = 7;
const TILE = 200;
const GAP = 20;
const X0 = 960 - (DAYS * TILE + (DAYS - 1) * GAP) / 2;
const Y0 = 300;
const stampAt = (i: number) => 80 + i * 40;
const EXTRA = [372, 396, 420];
const MISS = { start: 520, drain: 545, refill: 618 };
const FLIP = 660;

function Stamp({ frame, i }: { frame: number; i: number }) {
  const t = frame - stampAt(i);
  if (t < -12 || t > 18) return null;
  // drops in, presses, lifts away
  const y = t < 0 ? interpolate(t, [-12, 0], [-260, 0]) : t < 6 ? 0 : interpolate(t, [6, 18], [0, -260]);
  const x = X0 + i * (TILE + GAP) + TILE / 2 - 80;
  return (
    <div style={{ position: "absolute", left: x, top: Y0 + 40 + y - 130, width: 160, zIndex: 5 }}>
      <div style={{ margin: "0 auto", width: 54, height: 90, background: C.wood, boxShadow: ring(5) }} />
      <div style={{ width: 160, height: 26, background: C.woodDark, boxShadow: ring(5) }} />
      <div style={{ width: 160, height: 22, background: C.red, boxShadow: ring(5) }} />
    </div>
  );
}

export function Next02() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const landed = Array.from({ length: DAYS }, (_, i) => frame >= stampAt(i)).filter(Boolean).length;
  const extra = EXTRA.filter((e) => frame >= e).length;
  // the meter, in tenths: up with each stamp and the three days past the week, down gently on a missed day, then one again
  const full = landed + extra;
  const drained = interpolate(frame, [MISS.drain, MISS.drain + 60], [full, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cells = frame < MISS.drain ? full : frame < MISS.refill ? drained : 1;
  const pct = Math.round(cells) * 10;
  const lastStamp = [...Array(DAYS).keys()].map(stampAt).filter((s) => frame >= s).pop() ?? -100;
  const shake = frame - lastStamp < 8 ? Math.round(Math.sin((frame - lastStamp) * 2.4) * 7) : 0;
  const flip = interpolate(frame, [FLIP, FLIP + 22], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const big = spring({ frame: frame - lastStamp, fps, config: { damping: 8, stiffness: 260 } });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {/* the real bonus, under the calendar page */}
      {frame >= FLIP - 4 && (
        <AbsoluteFill style={{ background: C.sunPale }}>
          <Footage src="shiftfull" from={13.3} start={FLIP - 4} dur={150} box={{ x: 200, y: 140, w: 1520, h: 855 }} view={{ x: 0, y: 0, w: 1920 }} style={{ boxShadow: `${ring(9)}, 0 0 0 20px ${C.white}, 0 0 0 26px ${C.ink}` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 26, display: "flex", justifyContent: "center", scale: String(spring({ frame: frame - FLIP - 30, fps, config: { damping: 10 } })) }}>
            <Chip bg={C.red} color={C.white} size={40}>
              <span style={{ fontFamily: font.logo }}>Full shift · 5-day streak · +50%</span>
            </Chip>
          </div>
        </AbsoluteFill>
      )}

      {/* the wall and the calendar */}
      {frame < FLIP + 24 && (
        <AbsoluteFill style={{ background: C.sunPale, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 60px, rgba(30,42,74,0.05) 60px 120px)`, transformOrigin: "50% 0", scale: `1 ${flip}` }}>
          <div style={{ position: "absolute", left: 120, top: 70, width: 1680, height: 960, translate: `${shake}px ${Math.abs(shake) / 2}px`, background: C.white, boxShadow: `${ring(8)}, 16px 20px 0 rgba(30,42,74,0.25)` }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ position: "absolute", left: 120 + i * 160, top: -26, width: 26, height: 52, background: C.steel, boxShadow: ring(4) }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Title size={84} color={C.red}>
                Shift streak
              </Title>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.ink2 }}>Finish all five tasks, day after day</span>
            </div>
          </div>
          {Array.from({ length: DAYS }, (_, i) => {
            const on = frame >= stampAt(i);
            const s = on ? spring({ frame: frame - stampAt(i), fps, config: { damping: 8, stiffness: 260 } }) : 0;
            return (
              <div key={i} style={{ position: "absolute", left: X0 + i * (TILE + GAP) + shake, top: Y0, width: TILE, height: TILE, background: C.white, boxShadow: ring(5), overflow: "hidden" }}>
                <div style={{ height: 44, background: on ? C.sun : C.sunPale, borderBottom: `5px solid ${C.ink}`, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink }}>Day {i + 1}</div>
                {on && (
                  <div style={{ position: "absolute", left: 18, top: 76, width: 164, padding: "8px 0", rotate: "-11deg", border: `6px solid ${C.red}`, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 27, lineHeight: 1.1, color: C.red, scale: String(interpolate(s, [0, 1], [1.7, 1], { extrapolateRight: "clamp" })), opacity: Math.min(1, s * 2) }}>
                    Full
                    <br />
                    shift
                  </div>
                )}
              </div>
            );
          })}
          {Array.from({ length: DAYS }, (_, i) => (
            <Stamp key={i} frame={frame} i={i} />
          ))}

          {/* the bonus meter */}
          <div style={{ position: "absolute", left: 265, top: 600, width: 1390 }}>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: 3, marginBottom: 14 }}>Full-shift bonus</div>
            <div style={{ display: "flex", gap: 10, padding: 10, background: C.ink }}>
              {Array.from({ length: 10 }, (_, i) => {
                const lit = i < Math.round(cells);
                const ghost = lit && i >= DAYS && frame < MISS.drain;
                return (
                  <div key={i} style={{ flex: 1, height: 64, background: lit ? (ghost ? C.sunDeep : i % 2 ? C.sun : "#ffe98a") : "#2b3a62", backgroundImage: ghost ? "repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.35) 8px 16px)" : undefined, display: "grid", placeItems: "center", fontFamily: font.logo, fontSize: 18, color: C.ink }}>
                    {lit ? `+${(i + 1) * 10}` : ""}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ scale: String(frame < MISS.start ? interpolate(big, [0, 1], [1.25, 1], { extrapolateRight: "clamp" }) : 1) }}>
              <Title size={120} color={frame >= MISS.start && frame < MISS.refill ? C.steelLight : C.sun}>
                +{pct}%
              </Title>
            </div>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.ink2 }}>on top of the 3× full-shift bonus</span>
          </div>
          {frame >= EXTRA[2] && frame < MISS.start && (
            <div style={{ position: "absolute", right: 250, top: 540, rotate: "4deg", scale: String(spring({ frame: frame - EXTRA[2], fps, config: { damping: 9 } })) }}>
              <Chip bg={C.red} color={C.white} size={32}>
                <span style={{ fontFamily: font.logo }}>Up to +100% at 10 days</span>
              </Chip>
            </div>
          )}

          {/* a missed day, taken easy */}
          {frame >= MISS.start && frame < FLIP && (
            <div style={{ position: "absolute", left: 400, top: 420, width: 1120, height: 150, display: "flex", alignItems: "center", gap: 30, padding: "0 34px", background: C.sky, boxShadow: ring(6), scale: String(spring({ frame: frame - MISS.start, fps, config: { damping: 12 } })), zIndex: 6 }}>
              <div style={{ position: "relative" }}>
                <Spr rows={roughneck} palette={base} scale={6} style={{ rotate: "-90deg" }} />
                <span style={{ position: "absolute", left: 90, top: -30 - (Math.floor(frame / 20) % 3) * 8, fontFamily: font.logo, fontSize: 30, color: C.ink2 }}>z</span>
              </div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, lineHeight: 1.2, color: C.ink }}>
                {frame < MISS.refill ? "Missed a day? The streak starts fresh." : "Clock back in, and it climbs again."}
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      <EndCard frame={frame} start={790} line={["Keep the", "streak alive"]} bg={C.red} ink={C.ink} accent={C.sun} text={C.white} />
    </AbsoluteFill>
  );
}
