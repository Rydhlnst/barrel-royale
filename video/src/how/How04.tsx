import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons } from "@/components/pixel/sprites";
import { PRODUCTS, UNITS, type Product, type UnitKind } from "@/lib/game/content";
import { Burst, C, Chip, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Shutter } from "../ep/kit";

// How 04 · Refinery recipes. A cookbook open on the workbench: each spread is
// one recipe, ingredients and cook time on the left, the unit on the right
// with the barrels dropping in and the product popping out. The cursor turns
// the pages; the last one is the level 2 distillation recipe for jet fuel.

export const HOW04_SECONDS = 15;
const END = 790;

const RECIPES: { unit: UnitKind; idx: number }[] = [
  { unit: "distillation", idx: 0 },
  { unit: "cracker", idx: 0 },
  { unit: "liquefier", idx: 0 },
  { unit: "distillation", idx: 1 },
];
const STARTS = [100, 275, 445, 615];
const FLIP = 20;
const DROP = 16;

const BOOK = { left: 140, top: 150, w: 1640, h: 860 };
const SPINE = BOOK.left + BOOK.w / 2;
const barrelOf = (p: Product) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });

export function How04() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Book frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={4} tag="How it works" line="Refine to earn more" color={C.leaf} />}
      <Shutter frame={frame} fps={fps} ep={4} tag="How 04" title="Refinery recipes" color={C.leaf} />
      <Dissolve frame={frame} start={END} color={C.leaf} />
    </AbsoluteFill>
  );
}

function Book({ frame, fps }: { frame: number; fps: number }) {
  // the page in view switches halfway through each flip
  const r = STARTS.reduce((acc, s, i) => (i > 0 && frame >= s - FLIP / 2 ? i : acc), 0);
  const lf = frame - STARTS[r];
  const flipAt = STARTS.slice(1).map((s) => s - FLIP);
  const flipping = flipAt.findIndex((s) => frame >= s && frame < s + FLIP);

  // the cursor goes to the page corner and turns it
  const next = flipAt.find((s) => frame < s + 6);
  const ptr = next !== undefined && frame >= next - 50 ? { x: interpolate(frame, [next - 50, next - 8], [1500, BOOK.left + BOOK.w - 90], { extrapolateRight: "clamp" }), y: interpolate(frame, [next - 50, next - 8], [1060, BOOK.top + BOOK.h - 60], { extrapolateRight: "clamp" }), down: frame >= next - 4 && frame < next + 4 } : null;

  return (
    <AbsoluteFill style={{ background: C.wood }}>
      {/* the workbench planks */}
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: i * 120, width: 1920, height: 8, background: C.woodDark }} />
      ))}
      <div style={{ position: "absolute", left: 60, top: 40 }}>
        <Title size={56}>Refinery recipes</Title>
      </div>

      {/* the open book */}
      <div style={{ position: "absolute", left: BOOK.left - 20, top: BOOK.top - 10, width: BOOK.w + 40, height: BOOK.h + 30, background: C.redDeep, boxShadow: ring(8) }} />
      <div style={{ position: "absolute", left: BOOK.left, top: BOOK.top, width: BOOK.w, height: BOOK.h, background: C.sunPale, boxShadow: ring(6) }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 40, top: 150 + i * 56, width: BOOK.w / 2 - 80, height: 3, background: "#f1dfa6" }} />
        ))}
        <div style={{ position: "absolute", left: BOOK.w / 2 - 6, top: 0, width: 12, height: BOOK.h, background: "#d9c07a" }} />
      </div>

      <LeftPage frame={lf} fps={fps} r={r} />
      <RightPage frame={lf} fps={fps} r={r} />

      {/* the corner to turn, and the page swinging over */}
      {r < RECIPES.length - 1 && (
        <div style={{ position: "absolute", left: BOOK.left + BOOK.w - 200, top: BOOK.top + BOOK.h - 90, padding: "10px 18px", background: C.leaf, boxShadow: ring(5), fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.white, translate: ptr?.down ? "0 4px" : undefined }}>Next {">"}</div>
      )}
      {flipping >= 0 && (() => {
        const t = (frame - flipAt[flipping]) / FLIP;
        const w = snap(Math.abs(Math.cos(t * Math.PI)) * (BOOK.w / 2), 8);
        const right = t < 0.5;
        return <div style={{ position: "absolute", left: right ? SPINE : SPINE - w, top: BOOK.top, width: w, height: BOOK.h, background: "#fff7da", boxShadow: ring(5), zIndex: 60 }} />;
      })()}
      <div style={{ position: "absolute", right: 60, top: 50, zIndex: 40 }}>
        <Chip bg={C.ink} color={C.sun} size={32}>
          <span style={{ fontFamily: font.logo }}>
            Page {r + 1}/{RECIPES.length}
          </span>
        </Chip>
      </div>
      {ptr && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x} y={ptr.y} down={ptr.down} scale={7} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

function LeftPage({ frame, fps, r }: { frame: number; fps: number; r: number }) {
  const { unit, idx } = RECIPES[r];
  const rec = UNITS[unit].recipes[idx];
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 220 } });
  const ink = { fontFamily: font.logo, fontWeight: 700, color: C.ink } as const;
  return (
    <div style={{ position: "absolute", left: BOOK.left + 70, top: BOOK.top + 50, width: BOOK.w / 2 - 140, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ ...ink, fontSize: 26, color: C.redDeep }}>Recipe {r + 1}</span>
        {rec.minLevel > 1 && (
          <Chip bg={C.sun} color={C.ink} size={24}>
            <span style={{ fontFamily: font.logo }}>Level {rec.minLevel}</span>
          </Chip>
        )}
      </div>
      <span style={{ ...ink, fontSize: 64 }}>{UNITS[unit].name}</span>
      <span style={{ ...ink, fontSize: 28, color: C.ink2, marginTop: 10 }}>Ingredients</span>
      <div style={{ display: "flex", alignItems: "center", gap: 18, scale: String(s(8)), transformOrigin: "0 50%" }}>
        {Array.from({ length: rec.inQty }, (_, i) => (
          <Spr key={i} rows={barrel} palette={barrelOf(rec.input)} scale={6} />
        ))}
        <span style={{ ...ink, fontSize: 34, whiteSpace: "nowrap" }}>
          {rec.inQty} {PRODUCTS[rec.input].name}
        </span>
      </div>
      <span style={{ ...ink, fontSize: 28, color: C.ink2, marginTop: 10 }}>Makes</span>
      <div style={{ display: "flex", alignItems: "center", gap: 18, scale: String(s(18)), transformOrigin: "0 50%" }}>
        <Spr rows={barrel} palette={barrelOf(rec.output)} scale={6} />
        <span style={{ ...ink, fontSize: 40, color: PRODUCTS[rec.output].color }}>1 {PRODUCTS[rec.output].name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, scale: String(s(28)), transformOrigin: "0 50%" }}>
        <span style={{ ...ink, fontSize: 28, color: C.ink2 }}>Cook time</span>
        <span style={{ ...ink, fontSize: 40 }}>{rec.seconds}s</span>
      </div>
    </div>
  );
}

/** The unit on the right page: ingredients drop in, it runs, the product pops out. */
function RightPage({ frame, fps, r }: { frame: number; fps: number; r: number }) {
  const { unit, idx } = RECIPES[r];
  const rec = UNITS[unit].recipes[idx];
  const cx = SPINE + BOOK.w / 4 - 60;
  const top = BOOK.top + 330;
  const lastIn = 24 + (rec.inQty - 1) * DROP + 14;
  const runEnd = lastIn + 40;
  const on = frame >= lastIn && frame < runEnd;
  const jolt = on ? snap(Math.sin(frame * 2.4) * 6, 2) : 0;
  const out = frame - runEnd;
  const levelUp = rec.minLevel > 1;
  const color = unit === "distillation" ? C.white : unit === "cracker" ? C.steelLight : C.white;
  return (
    <>
      {/* the unit */}
      <div style={{ position: "absolute", left: cx - 130 + jolt, top, width: 260, height: 380 }}>
        <div style={{ position: "absolute", inset: 0, background: color, boxShadow: ring(7) }} />
        {unit === "distillation" &&
          [C.sunDeep, C.red, C.leaf, C.sea, C.sunDeep].map((c, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 30 + i * 70, height: 24, background: c, opacity: on && Math.floor(frame / 5) % 5 === i ? 0.4 : 1 }} />)}
        {unit === "cracker" && (
          <div style={{ position: "absolute", left: 70, top: 120, width: 120, height: 120, background: C.sunDeep, boxShadow: ring(6), rotate: on && Math.floor(frame / 4) % 2 ? "45deg" : "0deg" }}>
            <div style={{ position: "absolute", left: 40, top: 40, width: 40, height: 40, background: C.ink }} />
          </div>
        )}
        {unit === "liquefier" && (
          <div style={{ position: "absolute", left: 30, top: 40, width: 200, height: 200, background: C.sky, boxShadow: ring(6), clipPath: "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 92, height: 16, background: PRODUCTS.lng.color }} />
          </div>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -50, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink }}>{on ? "Running..." : UNITS[unit].name}</div>
        {on && <div style={{ position: "absolute", left: 100 + (Math.floor(frame / 6) % 2) * 20, top: -60 - (frame % 30), width: 40, height: 30, background: C.steelLight, opacity: 0.8 }} />}
      </div>
      {levelUp && frame >= 6 && (
        <div style={{ position: "absolute", left: cx + 60, top: top - 70, rotate: "8deg", scale: String(interpolate(spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 240 } }), [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), zIndex: 20 }}>
          <Chip bg={C.sun} color={C.ink} size={32}>
            <span style={{ fontFamily: font.logo }}>Lv 1 {">"} Lv 2</span>
          </Chip>
        </div>
      )}

      {/* the ingredients drop in from above */}
      {Array.from({ length: rec.inQty }, (_, i) => {
        const t = frame - (24 + i * DROP);
        if (t < 0 || t >= 14) return null;
        const y = interpolate(t, [0, 14], [BOOK.top + 40, top - 20], { easing: (k) => k * k });
        return <Spr key={i} rows={barrel} palette={barrelOf(rec.input)} scale={7} x={cx - 45} y={snap(y, 7)} style={{ zIndex: 10 }} />;
      })}
      {Array.from({ length: rec.inQty }, (_, i) => (
        <Popup key={i} frame={frame} at={24 + i * DROP + 14} x={cx - 200} y={top + 40} size={34} life={30} color={PRODUCTS[rec.input].shine}>
          +{i + 1}
        </Popup>
      ))}
      {/* and the product pops out to the right */}
      {out >= 0 && (
        <Spr rows={barrel} palette={barrelOf(rec.output)} scale={8} x={snap(interpolate(out, [0, 16], [cx - 52, cx + 190], { extrapolateRight: "clamp" }), 8)} y={snap(top + 260 - Math.sin(Math.min(1, out / 16) * Math.PI) * 120, 8)} style={{ zIndex: 10 }} />
      )}
      <Popup frame={frame} at={runEnd + 10} x={cx + 240} y={top + 160} size={44} life={60} color={PRODUCTS[rec.output].shine}>
        +1 {PRODUCTS[rec.output].name}
      </Popup>
      {levelUp && out >= 20 && (
        <div style={{ position: "absolute", left: SPINE, width: BOOK.w / 2, top: BOOK.top + BOOK.h - 170, display: "flex", justifyContent: "center", zIndex: 30 }}>
          <div style={{ padding: "16px 36px", background: C.leaf, boxShadow: ring(8), rotate: "-4deg", scale: String(interpolate(spring({ frame: out - 20, fps, config: { damping: 12, stiffness: 240 } }), [0, 1], [3, 1], { extrapolateRight: "clamp" })) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 52, color: C.white, whiteSpace: "nowrap" }}>Jet fuel unlocked!</span>
          </div>
        </div>
      )}
      <Burst frame={frame} start={runEnd + 20} x={cx + 100} y={top + 300} rows={icons.coin} scale={5} count={levelUp ? 22 : 0} speed={18} seed="jet" />
    </>
  );
}
