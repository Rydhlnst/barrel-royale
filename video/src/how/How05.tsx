import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base } from "@/components/pixel/sprites";
import { PRODUCTS, PRODUCT_ORDER, type Product } from "@/lib/game/content";
import { C, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Shutter } from "../ep/kit";

// How 05 · Benchmarks. A split-flap board in the exchange hall: six rows flap
// into place, each product beside the real-world benchmark it follows, then
// the prices tick up and down. The cursor hovers light crude and a card shows
// it moving with WTI.

export const HOW05_SECONDS = 14;
const END = 730;

const ROWS: Product[] = PRODUCT_ORDER;
const SETTLE = 110;
const TICK = 300;
const HOVER = [380, 520];
const OUTRO = 540;

const CELL = { w: 36, h: 54, gap: 4 };
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const barrelOf = (p: Product) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });

/** The benchmark's drift, shared by the board and the hover card. */
const drift = (p: Product, f: number) => 1 + 0.035 * Math.sin(f / 37 + ROWS.indexOf(p) * 1.7) + 0.02 * Math.sin(f / 13 + ROWS.indexOf(p));
const priceAt = (p: Product, f: number) => PRODUCTS[p].base * drift(p, Math.floor(Math.max(0, f - TICK) / 30) * 30);

export function How05() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Hall frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={5} tag="How it works" line="Real prices, real moves" color={C.sea} />}
      <Shutter frame={frame} fps={fps} ep={5} tag="How 05" title="Benchmarks" color={C.sea} />
      <Dissolve frame={frame} start={END} color={C.sea} />
    </AbsoluteFill>
  );
}

/** A row of split-flap cells that spin until `settle`, then show `text`. */
function Flaps({ text, frame, settle, seed, color = C.white, len }: { text: string; frame: number; settle: number; seed: string; color?: string; len: number }) {
  const chars = text.toUpperCase().padEnd(len, " ").split("");
  return (
    <div style={{ display: "flex", gap: CELL.gap }}>
      {chars.map((ch, i) => {
        const at = settle + i * 2;
        const spinning = frame < at;
        const shown = spinning ? CHARS[Math.floor(random(`${seed}-${i}-${Math.floor(frame / 3)}`) * CHARS.length)] : ch;
        const half = spinning && frame % 3 === 0;
        return (
          <div key={i} style={{ position: "relative", width: CELL.w, height: CELL.h, background: "#121a30", boxShadow: `0 0 0 3px ${C.ink}`, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: spinning ? C.steel : color, overflow: "hidden" }}>
            <span style={{ scale: half ? "1 0.4" : undefined }}>{shown === " " ? "" : shown}</span>
            <div style={{ position: "absolute", left: 0, right: 0, top: CELL.h / 2 - 1, height: 3, background: C.ink }} />
          </div>
        );
      })}
    </div>
  );
}

const COLS = { barrel: 70, name: 160, link: 620, ref: 690, price: 1110, move: 1330 };
const BOARD = { left: 110, top: 190, w: 1700, row: 92 };

function Hall({ frame, fps }: { frame: number; fps: number }) {
  const hovering = frame >= HOVER[0] && frame < HOVER[1];
  const ptr = frame >= HOVER[0] - 40 && frame < HOVER[1] + 10 ? { x: interpolate(frame, [HOVER[0] - 40, HOVER[0]], [1600, BOARD.left + COLS.name + 200], { extrapolateRight: "clamp" }), y: interpolate(frame, [HOVER[0] - 40, HOVER[0]], [1000, BOARD.top + 90 + 40], { extrapolateRight: "clamp" }) } : null;
  return (
    <AbsoluteFill style={{ background: C.stormShade }}>
      {/* the hall: columns and a floor */}
      {[40, 1840].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 0, width: 40, height: 1080, background: C.storm, boxShadow: ring(4) }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 960, width: 1920, height: 120, background: C.steelDeep, borderTop: `8px solid ${C.ink}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center" }}>
        <Title size={64}>Exchange board</Title>
      </div>

      {/* the board */}
      <div style={{ position: "absolute", left: BOARD.left, top: BOARD.top, width: BOARD.w, height: 90 + ROWS.length * BOARD.row + 30, background: C.ink, boxShadow: ring(10, C.steelDeep) }}>
        {[
          ["Product", COLS.name],
          ["Follows", COLS.ref],
          ["Price", COLS.price],
        ].map(([label, x]) => (
          <span key={label as string} style={{ position: "absolute", left: x as number, top: 28, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sun }}>
            {label}
          </span>
        ))}
        {ROWS.map((p, i) => {
          const y = 90 + i * BOARD.row;
          const settle = SETTLE + i * 22;
          const price = priceAt(p, frame + i * 5);
          const prev = priceAt(p, frame + i * 5 - 30);
          const up = price >= prev;
          const ticking = frame >= TICK;
          const flip = ticking && (frame - TICK + i * 5) % 30 < 6;
          const lit = hovering && i === 0;
          return (
            <div key={p} style={{ position: "absolute", left: 0, top: y, width: BOARD.w, height: BOARD.row - 10, background: lit ? "#2c3c6a" : undefined }}>
              <div style={{ position: "absolute", left: COLS.barrel - 8, top: 2, width: 81, height: 76, background: C.steelLight, boxShadow: `0 0 0 4px ${C.steelDeep}` }} />
              <Spr rows={barrel} palette={barrelOf(p)} scale={5} x={COLS.barrel} y={10} />
              <div style={{ position: "absolute", left: COLS.name, top: 14 }}>
                <Flaps text={PRODUCTS[p].name} frame={frame} settle={settle} seed={`n${p}`} len={11} />
              </div>
              <div style={{ position: "absolute", left: COLS.link, top: 22, fontFamily: font.logo, fontWeight: 700, fontSize: 36, color: frame >= settle + 30 ? C.sun : C.steelDeep }}>{">"}</div>
              <div style={{ position: "absolute", left: COLS.ref, top: 14 }}>
                <Flaps text={PRODUCTS[p].ref} frame={frame} settle={settle + 14} seed={`r${p}`} color={C.sunPale} len={9} />
              </div>
              <div style={{ position: "absolute", left: COLS.price, top: 14 }}>
                <Flaps text={ticking ? price.toFixed(2) : PRODUCTS[p].base.toFixed(2)} frame={flip ? frame - 10 : frame} settle={flip ? frame - 4 : settle + 24} seed={`p${p}${Math.floor(frame / 30)}`} color={C.white} len={5} />
              </div>
              {ticking && (
                <div style={{ position: "absolute", left: COLS.move, top: 16, width: 120, height: 52, display: "grid", placeItems: "center", background: up ? C.leaf : C.red, fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.white }}>{up ? "▲" : "▼"}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* the hover card: light crude moves with WTI */}
      {frame >= HOVER[0] && frame < HOVER[1] + 10 && <Follows frame={frame} fps={fps} />}

      {frame >= OUTRO && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center", zIndex: 90 }}>
          <div style={{ padding: "18px 40px", background: C.sun, boxShadow: ring(8), rotate: "-2deg", scale: String(interpolate(spring({ frame: frame - OUTRO, fps, config: { damping: 12, stiffness: 240 } }), [0, 1], [2.4, 1], { extrapolateRight: "clamp" })) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 44, color: C.ink, whiteSpace: "nowrap" }}>Real-world benchmarks move your in-game prices</span>
          </div>
        </div>
      )}
      {ptr && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x} y={ptr.y} scale={7} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

/** A card with two sparklines that move together: the benchmark and the product. */
function Follows({ frame, fps }: { frame: number; fps: number }) {
  const s = frame < HOVER[1] ? spring({ frame: frame - HOVER[0], fps, config: { damping: 11, stiffness: 220 } }) : 1 - (frame - HOVER[1]) / 10;
  const w = 600;
  const h = 170;
  const n = 40;
  const line = (offset: number) =>
    Array.from({ length: n }, (_, i) => {
      const f = frame - (n - i) * 6;
      const v = drift("light", f) - 1;
      return `${snap((i / (n - 1)) * w, 4)},${snap(h / 2 - v * 1400 + offset, 4)}`;
    }).join(" ");
  return (
    <div style={{ position: "absolute", left: BOARD.left + COLS.name + 120, top: BOARD.top + 200, width: w + 60, padding: "22px 30px 26px", background: C.white, boxShadow: ring(8), boxSizing: "border-box", zIndex: 80, scale: String(Math.max(0, s)), transformOrigin: "0 0" }}>
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.ink, whiteSpace: "nowrap" }}>Light crude follows WTI</div>
      <svg width={w} height={h} style={{ display: "block", marginTop: 14, background: "#121a30" }} shapeRendering="crispEdges">
        <polyline points={line(-6)} fill="none" stroke={C.sunPale} strokeWidth={6} />
        <polyline points={line(6)} fill="none" stroke={PRODUCTS.light.shine} strokeWidth={6} />
      </svg>
      <div style={{ display: "flex", gap: 30, marginTop: 12 }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.ink2 }}>— WTI</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: PRODUCTS.light.shine, textShadow: `2px 2px 0 ${C.ink}` }}>— Light crude</span>
      </div>
    </div>
  );
}
