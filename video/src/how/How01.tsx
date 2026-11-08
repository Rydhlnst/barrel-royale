import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, drop, icons, roughneck } from "@/components/pixel/sprites";
import { LEVELS, PRODUCTS, START_COINS, WELLS, type Raw } from "@/lib/game/content";
import { C, Chip, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Bar, Dissolve, dissolved, EpEnd, Popup, Prompt, Shutter } from "../ep/kit";

// How 01 · Drilling. A side view of the rig deck over a cut-away seabed with
// crude and gas pockets in the rock. The roughneck walks to an empty pad and
// presses E; a picker of three wells pops up (cost, speed, worth), the cursor
// takes light crude and the bit drills down into its pocket. Then a time-lapse
// fills the rest of the deck until all six pads pump.

export const HOW01_SECONDS = 14;
const END = 730;

const SLOTS = LEVELS[0].slots;
const DECK_Y = 340;
const padX = (i: number) => 250 + i * 284;

// what each pad drills into, how deep the pocket sits, and when it gets drilled
const PADS: { raw: Raw; depth: number; at: number }[] = [
  { raw: "gas", depth: 700, at: 486 },
  { raw: "heavy", depth: 900, at: 526 },
  { raw: "light", depth: 640, at: 352 },
  { raw: "light", depth: 760, at: 566 },
  { raw: "gas", depth: 860, at: 606 },
  { raw: "heavy", depth: 720, at: 646 },
];
const FIRST = 2;

const WALK = [100, 176];
const PRESS = 200;
const PICKER = [212, 340];
const CLICK = 300;
const LAPSE = 470;
const FULL = 690;
const DRILL = 40;

const barrelOf = (p: Raw) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });
const fastest = Math.max(...Object.values(WELLS).map((w) => w.rate));
const richest = Math.max(PRODUCTS.light.base, PRODUCTS.gas.base, PRODUCTS.heavy.base);

export function How01() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Rig frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={1} tag="How it works" line="Pick a pad. Drill." color={C.hat} />}
      <Shutter frame={frame} fps={fps} ep={1} tag="How 01" title="Drill a well" color={C.hat} />
      <Dissolve frame={frame} start={END} color={C.hat} />
    </AbsoluteFill>
  );
}

function Rig({ frame, fps }: { frame: number; fps: number }) {
  const drilled = PADS.filter((p) => frame >= p.at).length;
  const walking = frame >= WALK[0] && frame < WALK[1];
  const ax = interpolate(frame, WALK, [1260, padX(FIRST) - 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const coins = frame >= CLICK + 4 ? START_COINS - WELLS.light.cost : START_COINS;
  const lapse = frame >= LAPSE;
  return (
    <AbsoluteFill>
      {/* sky, sea and the cut-away seabed */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 400, background: C.sky }} />
      <div style={{ position: "absolute", left: 0, top: 400, width: 1920, height: 90, background: C.sea }} />
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: snap(((i * 110 + frame * 2) % 2200) - 140, 6), top: 410 + (i % 3) * 22, width: 60, height: 8, background: C.foam }} />
      ))}
      {[
        [490, 90, "#e9c98a"],
        [580, 160, C.wood],
        [740, 180, C.woodDark],
        [920, 160, "#3e2a17"],
      ].map(([y, h, c]) => (
        <div key={y as number} style={{ position: "absolute", left: 0, top: y as number, width: 1920, height: h as number, background: c as string, borderTop: `6px solid ${C.ink}` }} />
      ))}
      {/* the pockets */}
      {PADS.map((p, i) => {
        const hit = frame >= p.at + DRILL;
        const pulse = hit ? (Math.floor(frame / 10) % 2) * 6 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: padX(i) - 90 - pulse / 2, top: p.depth - pulse / 2, width: 180 + pulse, height: 90 + pulse, background: PRODUCTS[p.raw].color, boxShadow: `0 0 0 6px ${hit ? C.sun : C.ink}`, clipPath: "polygon(16% 0, 84% 0, 100% 30%, 100% 70%, 84% 100%, 16% 100%, 0 70%, 0 30%)" }}>
            <div style={{ position: "absolute", left: 30, top: 18, width: 14, height: 14, background: PRODUCTS[p.raw].shine }} />
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.white, whiteSpace: "nowrap" }}>{PRODUCTS[p.raw].name}</div>
          </div>
        );
      })}

      {/* the drill pipes, and crude rising up them */}
      {PADS.map((p, i) => {
        if (frame < p.at) return null;
        const len = (p.depth - DECK_Y - 40) * Math.min(1, (frame - p.at) / DRILL);
        const x = padX(i) - 8;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: DECK_Y + 40, width: 16, height: snap(len, 4), background: `repeating-linear-gradient(${C.steelDeep} 0 20px, ${C.ink} 20px 28px)` }} />
            {frame < p.at + DRILL && <div style={{ position: "absolute", left: x - 8, top: DECK_Y + 40 + len - 10, width: 32, height: 24, background: C.steel, boxShadow: `0 0 0 4px ${C.ink}`, rotate: `${(frame % 4) * 8}deg` }} />}
            {frame >= p.at + DRILL &&
              [0, 1, 2].map((k) => {
                const t = ((frame - p.at - DRILL) * 4 + k * 60) % 180;
                return <Spr key={k} rows={drop} palette={{ ...base, K: C.ink }} scale={2} x={x - 1} y={snap(p.depth - (t / 180) * (p.depth - DECK_Y - 40), 2)} />;
              })}
          </div>
        );
      })}

      {/* the deck and its six pads */}
      {[180, 760, 1340, 1760].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: DECK_Y + 40, width: 36, height: 130, background: C.steelDeep, boxShadow: ring(4) }} />
      ))}
      <div style={{ position: "absolute", left: 60, top: DECK_Y, width: 1800, height: 40, background: C.steel, boxShadow: ring(6) }} />
      {PADS.map((p, i) => {
        const on = frame >= p.at;
        const pop = on ? spring({ frame: frame - p.at, fps, config: { damping: 8, stiffness: 240 } }) : 1;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: padX(i) - 80, top: DECK_Y - 14, width: 160, height: 14, background: on ? C.leaf : C.sunDeep, boxShadow: `0 0 0 4px ${C.ink}` }} />
            {on ? (
              <Spr rows={icons.derrick} scale={8} x={padX(i) - 64} y={DECK_Y - 14 - 136} style={{ scale: `1 ${pop}`, transformOrigin: "50% 100%" }} />
            ) : (
              <div style={{ position: "absolute", left: padX(i) - 60, top: DECK_Y - 52, width: 120, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.ink2 }}>Pad {i + 1}</div>
            )}
          </div>
        );
      })}
      {PADS.map((p, i) => (
        <Popup key={i} frame={frame} at={p.at + DRILL} x={padX(i)} y={150} size={34} life={44} color={C.leaf}>
          Pumping!
        </Popup>
      ))}

      {/* the roughneck walks to pad 3 */}
      {!lapse && <Spr rows={roughneck} palette={base} scale={7} x={snap(ax, 7)} y={DECK_Y - 14 - 133 - (walking ? (Math.floor(frame / 6) % 2) * 7 : 0)} style={{ scale: walking ? "-1 1" : undefined }} />}
      {frame >= WALK[1] + 4 && frame < PICKER[0] + 4 && <Prompt k="E" text="Drill" down={frame >= PRESS && frame < PRESS + 8} x={ax + 56} y={DECK_Y - 170} pop={spring({ frame: frame - WALK[1] - 4, fps, config: { damping: 9, stiffness: 240 } })} />}

      {/* HUD: coins and the pad counter */}
      <div style={{ position: "absolute", left: 40, top: 30, display: "flex", gap: 20, zIndex: 40 }}>
        <div style={{ display: lapse ? "none" : "flex", alignItems: "center", gap: 14, padding: "10px 20px", background: C.white, boxShadow: ring(6) }}>
          <Spr rows={icons.coin} scale={4} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink }}>{coins}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 20px", background: drilled === SLOTS ? C.leaf : C.white, boxShadow: ring(6) }}>
          <Spr rows={icons.derrick} scale={3} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: drilled === SLOTS ? C.white : C.ink }}>
            {drilled}/{SLOTS}
          </span>
        </div>
      </div>
      <Popup frame={frame} at={CLICK + 4} x={150} y={140} size={40} life={50} color={C.red}>
        -{WELLS.light.cost}
      </Popup>
      {lapse && frame < FULL && (
        <div style={{ position: "absolute", right: 40, top: 30, zIndex: 40 }}>
          <Chip bg={C.ink} color={C.sun} size={34}>
            <span style={{ fontFamily: font.logo }}>Time-lapse {">>"}</span>
          </Chip>
        </div>
      )}
      {frame >= PICKER[1] && frame < LAPSE && (
        <div style={{ position: "absolute", right: 40, top: 30, zIndex: 40, scale: String(spring({ frame: frame - PICKER[1], fps, config: { damping: 9, stiffness: 220 } })) }}>
          <Chip bg={C.ink} color={C.sunPale} size={34}>
            <span style={{ fontFamily: font.logo }}>Drilling to the pocket...</span>
          </Chip>
        </div>
      )}

      {frame >= PICKER[0] && frame < PICKER[1] && <Picker frame={frame - PICKER[0]} fps={fps} />}

      {frame >= FULL && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center", zIndex: 95 }}>
          <div style={{ padding: "22px 60px", background: C.leaf, boxShadow: ring(10), rotate: "-4deg", scale: String(interpolate(spring({ frame: frame - FULL, fps, config: { damping: 12, stiffness: 240 } }), [0, 1], [3, 1], { extrapolateRight: "clamp" })) }}>
            <Title size={92}>All {SLOTS} pads pumping!</Title>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

const CARDS: { raw: Raw; tag?: string }[] = [{ raw: "light", tag: "Fastest" }, { raw: "gas" }, { raw: "heavy", tag: "Slow, worth more" }];
const CARD = { left: 500, top: 380, w: 290, gap: 30 };

/** The well picker: cost, how fast it pumps and what a barrel is worth. */
function Picker({ frame, fps }: { frame: number; fps: number }) {
  const close = PICKER[1] - PICKER[0] - 14;
  const s = frame < close ? spring({ frame, fps, config: { damping: 11, stiffness: 220 } }) : 1 - (frame - close) / 14;
  const click = CLICK - PICKER[0];
  const tx = CARD.left + CARD.w / 2;
  const ptr = { x: interpolate(frame, [20, click - 4], [1500, tx], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), y: interpolate(frame, [20, click - 4], [1040, 660], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) };
  return (
    <AbsoluteFill style={{ zIndex: 80 }}>
      <AbsoluteFill style={{ background: C.ink, opacity: 0.55 * Math.max(0, s) }} />
      <div style={{ position: "absolute", left: CARD.left - 40, top: CARD.top - 110, width: 3 * CARD.w + 2 * CARD.gap + 80, padding: "22px 40px 40px", background: C.sunPale, boxShadow: ring(9), boxSizing: "border-box", scale: String(Math.max(0, s)) }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.ink, marginBottom: 26 }}>Strike a well</div>
        <div style={{ display: "flex", gap: CARD.gap }}>
          {CARDS.map(({ raw, tag }, i) => {
            const picked = i === 0 && frame >= click;
            return (
              <div key={raw} style={{ position: "relative", width: CARD.w, padding: "0 0 20px", background: picked ? C.sun : C.white, boxShadow: ring(6), display: "flex", flexDirection: "column", alignItems: "center", gap: 14, scale: picked && frame < click + 10 ? "1.06" : undefined, translate: picked && frame < click + 8 ? "0 6px" : undefined }}>
                <div style={{ width: "100%", padding: "10px 0", background: PRODUCTS[raw].color, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.white }}>{PRODUCTS[raw].name}</div>
                <Spr rows={barrel} palette={barrelOf(raw)} scale={7} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Spr rows={icons.coin} scale={4} />
                  <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.ink }}>{WELLS[raw].cost}</span>
                </div>
                {[
                  ["Speed", WELLS[raw].rate / fastest, C.leaf],
                  ["Worth", PRODUCTS[raw].base / richest, C.sunDeep],
                ].map(([label, p, color]) => (
                  <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 80, fontFamily: font.logo, fontWeight: 700, fontSize: 18, color: C.ink2 }}>{label}</span>
                    <Bar p={(p as number) * Math.min(1, Math.max(0, (frame - 16 - i * 6) / 24))} w={160} h={24} color={color as string} />
                  </div>
                ))}
                {tag && (
                  <div style={{ position: "absolute", top: -26, right: -18, rotate: "6deg" }}>
                    <Chip bg={i === 0 ? C.leaf : C.red} color={C.white} size={22}>
                      <span style={{ fontFamily: font.logo, whiteSpace: "nowrap" }}>{tag}</span>
                    </Chip>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {frame >= 20 && frame < close + 10 && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x} y={ptr.y} down={frame >= click && frame < click + 8} scale={7} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
