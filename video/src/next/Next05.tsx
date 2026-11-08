import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons, roughneck } from "@/components/pixel/sprites";
import { Burst, C, Chip, ease, font, ramp, ring, Spr, Title } from "../brand";
import { EndCard, Footage } from "./Next01";

// next05: one tap each. A split screen counts the taps: eighteen the old way (every well, every
// product) against two buttons now. Then the real game with rolling odometers: Collect from every
// well takes storage from 42 to 210 bbl, Sell everything adds 704 coins.

export const NEXT05_SECONDS = 15;

const GREY = "#3b4560";
const TAP_EVERY = 15;
const OLD = [...Array.from({ length: 12 }, (_, i) => ({ x: 130 + (i % 4) * 190, y: 200 + Math.floor(i / 4) * 150, kind: "well" as const })), ...Array.from({ length: 6 }, (_, i) => ({ x: 120 + i * 128, y: 690, kind: "sell" as const }))];
const oldTap = (k: number) => 30 + k * TAP_EVERY;
const NEW = [
  { at: 70, y: 330, label: "Collect from every well · 168 bbl", rows: barrel },
  { at: 150, y: 560, label: "Sell everything · 704", rows: icons.coin },
];
const SPLIT = 330;
const C1 = 362;
const C2 = 575;
const ROLL = [
  { at: 450, from: 42, to: 210 },
  { at: 662, from: 3880, to: 4584 },
];

/** Rolling digits, like a pump's counter. */
function Odometer({ value, digits }: { value: number; digits: number }) {
  const H = 150;
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {Array.from({ length: digits }, (_, i) => {
        const place = 10 ** (digits - 1 - i);
        // the units wheel turns smoothly; the others click over a digit at a time
        const v = i === digits - 1 ? value % 10 : Math.floor(value / place) % 10;
        return (
          <div key={i} style={{ width: 112, height: H, background: C.ink, boxShadow: ring(6), overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: -v * H }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
                <div key={j} style={{ height: H, display: "grid", placeItems: "center" }}>
                  <Title size={110} color={C.sun}>
                    {d}
                  </Title>
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 2, height: 4, background: "rgba(0,0,0,0.35)" }} />
          </div>
        );
      })}
    </div>
  );
}

export function Next05() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const oldCount = OLD.filter((_, k) => frame >= oldTap(k)).length;
  const newCount = NEW.filter((b) => frame >= b.at).length;
  const k = Math.min(OLD.length - 1, Math.max(0, Math.floor((frame - 30) / TAP_EVERY)));
  const prev = OLD[Math.max(0, k - 1)];
  const cur = OLD[k];
  const hop = ramp(frame, oldTap(k) - TAP_EVERY + 4, TAP_EVERY - 6);
  const dot = frame < 30 ? OLD[0] : { x: interpolate(hop, [0, 1], [prev.x, cur.x]), y: interpolate(hop, [0, 1], [prev.y, cur.y]) };
  const sweep = interpolate(frame, [SPLIT, SPLIT + 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const swapC = interpolate(frame, [C2, C2 + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const roll = (r: (typeof ROLL)[number]) => interpolate(frame, [r.at, r.at + 40], [r.from, r.to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      {/* C: the real game with the odometers */}
      {frame >= C1 - 40 && (
        <AbsoluteFill style={{ background: C.sun }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 30px, rgba(255,255,255,0.18) 30px 60px)" }} />
          {[
            { start: C1 - 40, dur: C2 - C1 + 70, from: 4.2, y: -swapC * 1100, label: "Storage, bbl", chip: "+168 in one tap", r: ROLL[0], digits: 3, after: "/240" },
            { start: C2, dur: 260, from: 16.4, y: (1 - swapC) * 1100, label: "Coins", chip: "+704 in one tap", r: ROLL[1], digits: 4, after: "" },
          ].map((s) => (
            <div key={s.start} style={{ position: "absolute", inset: 0, translate: `0 ${s.y}px` }}>
              <Footage src="qol" from={s.from} start={s.start} dur={s.dur} box={{ x: 660, y: 202, w: 1200, h: 675 }} view={{ x: 0, y: 0, w: 1920 }} style={{ boxShadow: `${ring(9)}, 18px 22px 0 rgba(30,42,74,0.3)` }} />
              <div style={{ position: "absolute", left: 80, top: 300, display: "flex", flexDirection: "column", gap: 24 }}>
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink, letterSpacing: 4 }}>{s.label}</span>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
                  <Odometer value={roll(s.r)} digits={s.digits} />
                  {s.after && <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 60, color: C.ink2 }}>{s.after}</span>}
                </div>
                <div style={{ scale: String(spring({ frame: frame - s.r.at - 30, fps, config: { damping: 9 } })), transformOrigin: "0 50%" }}>
                  <Chip bg={C.red} color={C.white} size={44}>
                    <span style={{ fontFamily: font.logo }}>{s.chip}</span>
                  </Chip>
                </div>
              </div>
            </div>
          ))}
        </AbsoluteFill>
      )}

      {/* A: before and now */}
      {frame < SPLIT + 34 && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: 1080, background: GREY, translate: `${-sweep * 960}px 0`, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center" }}>
              <Title size={64} color={C.steelLight}>
                Before
              </Title>
            </div>
            {OLD.map((o, i) => {
              const done = frame >= oldTap(i);
              return (
                <div key={i} style={{ position: "absolute", left: o.x - 45, top: o.y - 45, width: 90, height: 90, display: "grid", placeItems: "center", background: done ? "#2c3550" : "transparent" }}>
                  <Spr rows={o.kind === "well" ? icons.derrick : barrel} palette={base} scale={o.kind === "well" ? 4 : 5} style={{ opacity: done ? 0.45 : 1 }} />
                  {done && <div style={{ position: "absolute", right: -6, top: -6, width: 30, height: 30, background: C.leaf, boxShadow: ring(3), display: "grid", placeItems: "center", fontFamily: font.logo, fontSize: 18, color: C.white }}>✓</div>}
                </div>
              );
            })}
            <div style={{ position: "absolute", left: dot.x - 22, top: dot.y - 22, width: 44, height: 44, borderRadius: 22, border: `5px solid ${C.white}`, background: frame - oldTap(k) < 6 && frame >= oldTap(k) ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", boxShadow: `0 0 0 4px ${C.ink}` }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18 }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.steelLight, letterSpacing: 3 }}>Taps</span>
              <Title size={120} color={C.white}>
                {oldCount}
              </Title>
            </div>
          </div>
          <div style={{ position: "absolute", left: 960 - sweep * 960, top: 0, width: 960 + sweep * 960, height: 1080, background: C.sun, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 60, width: 960, display: "flex", justifyContent: "center", opacity: 1 - sweep }}>
              <Title size={64}>Now</Title>
            </div>
            {NEW.map((b, i) => {
              const press = frame >= b.at && frame < b.at + 8;
              const done = frame >= b.at;
              return (
                <div key={i} style={{ position: "absolute", left: 120, top: b.y + (press ? 8 : 0), width: 720, padding: "30px 0", textAlign: "center", background: done ? C.redLight : C.red, boxShadow: press ? ring(6) : `${ring(6)}, 0 10px 0 6px #b8322a`, fontFamily: font.display, fontWeight: 700, fontSize: 44, color: C.white, opacity: 1 - sweep }}>
                  {b.label}
                </div>
              );
            })}
            {NEW.map((b, i) => (
              <Burst key={i} frame={frame} start={b.at + 2} x={480} y={b.y + 40} count={16} rows={b.rows} scale={5} speed={16} seed={`n5${i}`} />
            ))}
            {frame >= NEW[0].at - 30 && frame < NEW[1].at + 30 && (
              <div
                style={{
                  position: "absolute",
                  left: 480 - 22,
                  top: interpolate(frame, [NEW[0].at - 30, NEW[0].at, NEW[1].at - 30, NEW[1].at], [520, NEW[0].y + 40, NEW[0].y + 40, NEW[1].y + 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) - 22,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  border: `5px solid ${C.white}`,
                  background: NEW.some((b) => frame >= b.at && frame < b.at + 6) ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                  boxShadow: `0 0 0 4px ${C.ink}`,
                }}
              />
            )}
            {frame >= 190 && (
              <div style={{ position: "absolute", left: 640, top: 700, opacity: 1 - sweep, scale: String(spring({ frame: frame - 190, fps, config: { damping: 10 } })), transformOrigin: "50% 100%" }}>
                <Spr rows={roughneck} palette={base} scale={7} />
              </div>
            )}
            <div style={{ position: "absolute", left: 0, top: 830, width: 960, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18, opacity: 1 - sweep }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink, letterSpacing: 3 }}>Taps</span>
              <Title size={120} color={C.red}>
                {newCount}
              </Title>
            </div>
          </div>
          {frame >= 296 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", scale: String(spring({ frame: frame - 296, fps, config: { damping: 9 } })), opacity: 1 - sweep }}>
              <Chip bg={C.white} size={64}>
                <span style={{ fontFamily: font.logo }}>18 taps → 2</span>
              </Chip>
            </div>
          )}
        </>
      )}

      <EndCard frame={frame} start={790} line={["Two taps.", "Done."]} bg={C.sun} ink={C.ink} accent={C.red} text={C.ink} />
    </AbsoluteFill>
  );
}
