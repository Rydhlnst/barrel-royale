import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { drop, icons, roughneck, valve, base } from "@/components/pixel/sprites";
import { BLOWOUT_AT, CAP_COST, WARN_AT } from "@/lib/game/content";
import { Burst, C, Chip, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { Dissolve, dissolved, EpEnd, Popup, Shutter } from "../ep/kit";

// How 03 · Blowout. A comic page in three panels. One: the needle passes the
// red line, BLOWOUT!, the well stops. Two: two ways to cap it, pay the coins or
// run the capping drill for free; the cursor picks the drill. Three: the
// valves go in, in the order shown, and the well is capped for free, with the
// coins it would have cost crossed out.

export const HOW03_SECONDS = 15;
const END = 790;

const A = 100;
const BLOW = 196;
const B = 290;
const PICK = 380;
const D = 420;
const ORDER = [2, 1, 3, 0];
const PRESSES = [470, 510, 550, 590];
const CAPPED = 612;
const SAVED = 660;
const LETTERS = ["A", "B", "C", "D"];

export function How03() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!dissolved(frame, END) ? <Page frame={frame} fps={fps} /> : <EpEnd frame={frame - END - 20} fps={fps} ep={3} tag="How it works" line="Blew it? Cap it free" color={C.red} />}
      <Shutter frame={frame} fps={fps} ep={3} tag="How 03" title="Blowout!" color={C.red} />
      <Dissolve frame={frame} start={END} color={C.red} />
    </AbsoluteFill>
  );
}

/** A comic panel that drops in with a little tilt. */
function Panel({ frame, fps, at, x, y, w, h, tilt, bg, children }: { frame: number; fps: number; at: number; x: number; y: number; w: number; h: number; tilt: number; bg: string; children: React.ReactNode }) {
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: bg, boxShadow: `${ring(9)}, 12px 12px 0 9px ${C.ink}`, overflow: "hidden", rotate: `${tilt}deg`, scale: String(0.6 + 0.4 * Math.min(1, s)), opacity: Math.min(1, s * 2) }}>
      {children}
    </div>
  );
}

/** The yellow caption box in a panel's corner. */
function Caption({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "absolute", left: 0, top: 0, padding: "10px 20px", background: C.sun, boxShadow: `0 0 0 6px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.ink, zIndex: 5, whiteSpace: "nowrap" }}>{children}</div>;
}

/** A speech bubble with a tail pointing down-left. */
function Bubble({ frame, fps, at, x, y, children }: { frame: number; fps: number; at: number; x: number; y: number; children: React.ReactNode }) {
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 8, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, scale: String(s), transformOrigin: "0 100%", zIndex: 6 }}>
      <div style={{ padding: "14px 22px", background: C.white, boxShadow: `0 0 0 6px ${C.ink}`, fontFamily: font.display, fontWeight: 800, fontSize: 28, color: C.ink, whiteSpace: "nowrap" }}>{children}</div>
      <div style={{ marginLeft: 30, width: 0, height: 0, borderLeft: `0 solid transparent`, borderRight: `30px solid transparent`, borderTop: `30px solid ${C.ink}` }} />
    </div>
  );
}

/** A small dial: pixel segments and a needle that can go past the red. */
function Dial({ p }: { p: number }) {
  const cx = 180;
  const cy = 180;
  const a = Math.PI * (1 - Math.min(108, p) / 108);
  return (
    <svg width={360} height={200} viewBox="0 0 360 200" shapeRendering="crispEdges">
      <path d={`M 10 ${cy} A 170 170 0 0 1 350 ${cy} Z`} fill={C.ink} />
      <path d={`M 24 ${cy} A 156 156 0 0 1 336 ${cy} Z`} fill={C.sunPale} />
      {Array.from({ length: 12 }, (_, i) => {
        const t = (i + 0.5) / 12;
        const ang = Math.PI * (1 - t);
        const v = t * 108;
        return <rect key={i} x={snap(cx + Math.cos(ang) * 128 - 12, 2)} y={snap(cy - Math.sin(ang) * 128 - 12, 2)} width={24} height={24} fill={v >= BLOWOUT_AT ? C.red : v >= WARN_AT ? C.sunDeep : C.leaf} stroke={C.ink} strokeWidth={4} />;
      })}
      <line x1={cx} y1={cy} x2={cx + Math.cos(a) * 120} y2={cy - Math.sin(a) * 120} stroke={C.ink} strokeWidth={14} />
      <line x1={cx} y1={cy} x2={cx + Math.cos(a) * 112} y2={cy - Math.sin(a) * 112} stroke={p >= BLOWOUT_AT ? C.red : C.hat} strokeWidth={6} />
      <rect x={cx - 18} y={cy - 18} width={36} height={36} fill={C.ink} />
    </svg>
  );
}

const STAR = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const r = i % 2 ? 34 : 50;
  return `${50 + Math.cos(a) * r}% ${50 + Math.sin(a) * r}%`;
}).join(", ");

const BTN = { x0: 120, w: 270, gap: 30, y: 330 };
const btnX = (v: number) => BTN.x0 + BTN.w / 2 + v * (BTN.w + BTN.gap);

function Page({ frame, fps }: { frame: number; fps: number }) {
  const p = frame < BLOW ? interpolate(frame, [A + 10, BLOW], [74, BLOWOUT_AT], { extrapolateLeft: "clamp", easing: (t) => t * t }) : BLOWOUT_AT + 4 + Math.sin(frame / 3) * 2;
  const blown = frame >= BLOW;
  const shake = blown && frame < BLOW + 30 ? snap(Math.sin(frame * 3) * 10 * (1 - (frame - BLOW) / 30), 2) : 0;
  const done = PRESSES.filter((x) => frame >= x).length;

  // the cursor: hovers the pay card, moves on to the drill and clicks; then the valves
  const payX = 980 + 70 + 190;
  const drillX = 980 + 70 + 380 + 50 + 190;
  const ptr = (() => {
    if (frame >= B + 20 && frame < PICK + 14) {
      const x = interpolate(frame, [B + 20, B + 50, PICK - 30, PICK - 4], [1700, payX, payX, drillX], { extrapolateRight: "clamp" });
      const y = interpolate(frame, [B + 20, B + 50], [600, 380], { extrapolateRight: "clamp" });
      return { x, y, down: frame >= PICK && frame < PICK + 8 };
    }
    if (frame >= D + 20 && frame < CAPPED + 20) {
      const i = PRESSES.findIndex((t) => frame < t + 8);
      const k = i === -1 ? 3 : i;
      const fx = k === 0 ? 1600 : 40 + btnX(ORDER[k - 1]);
      const t0 = k === 0 ? D + 20 : PRESSES[k - 1] + 8;
      const m = Math.min(1, Math.max(0, (frame - t0) / Math.max(1, PRESSES[k] - 4 - t0)));
      return { x: fx + (40 + btnX(ORDER[k]) - fx) * (1 - (1 - m) * (1 - m)), y: 580 + BTN.y + 40 - (k === 0 ? (1 - m) * 100 : 0), down: frame >= PRESSES[k] && frame < PRESSES[k] + 8 };
    }
    return null;
  })();

  return (
    <AbsoluteFill style={{ background: C.sunPale }}>
      {/* halftone dots */}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.hatLight} 4px, transparent 5px)`, backgroundSize: "22px 22px", opacity: 0.6 }} />

      {/* panel one: past the red line */}
      <Panel frame={frame} fps={fps} at={A} x={40} y={40} w={900} h={480} tilt={-1.2} bg={blown && frame < BLOW + 8 ? C.white : C.sky}>
        <Caption>Past the red line...</Caption>
        <div style={{ position: "absolute", inset: 0, translate: `${shake}px 0` }}>
          <div style={{ position: "absolute", left: 0, top: 380, width: 900, height: 100, background: C.steel, borderTop: `8px solid ${C.ink}` }} />
          <Spr rows={icons.derrick} scale={12} x={50} y={380 - 204} />
          {blown && <Spr rows={roughneck} palette={base} scale={6} x={290} y={380 - 114} style={{ rotate: frame % 12 < 6 ? "-6deg" : "6deg" }} />}
          <div style={{ position: "absolute", left: 520, top: 170 }}>
            <Dial p={p} />
          </div>
          {blown && (
            <div style={{ position: "absolute", left: 130, top: 0, width: 32, height: 180, background: C.oil, boxShadow: `0 0 0 5px ${C.ink}` }} />
          )}
          <Burst frame={frame} start={BLOW} x={146} y={140} rows={drop} scale={6} count={22} speed={18} seed="gush" />
        </div>
        {blown && (
          <div style={{ position: "absolute", left: 470, top: 40, width: 400, height: 150, background: C.red, clipPath: `polygon(${STAR})`, display: "grid", placeItems: "center", scale: String(interpolate(spring({ frame: frame - BLOW, fps, config: { damping: 10, stiffness: 260 } }), [0, 1], [2.4, 1], { extrapolateRight: "clamp" })) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 46, color: C.sun }}>Blowout!</span>
          </div>
        )}
        <Bubble frame={frame} fps={fps} at={BLOW + 30} x={200} y={170}>
          The well stops!
        </Bubble>
      </Panel>

      {/* panel two: two ways to cap it */}
      <Panel frame={frame} fps={fps} at={B} x={980} y={40} w={900} h={480} tilt={1} bg={C.white}>
        <Caption>Two ways to cap it</Caption>
        <div style={{ position: "absolute", left: 70, top: 110, display: "flex", gap: 50 }}>
          {[
            { label: "Pay", main: String(CAP_COST), sub: "coins", color: C.steelLight, ink: C.ink },
            { label: "Capping drill", main: "FREE", sub: "valves in order", color: frame >= PICK ? C.leaf : C.sunPale, ink: frame >= PICK ? C.white : C.ink },
          ].map((c, i) => (
            <div key={c.label} style={{ width: 380, height: 300, background: c.color, boxShadow: ring(7), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, translate: i === 1 && frame >= PICK && frame < PICK + 8 ? "0 6px" : undefined, opacity: i === 0 && frame >= PICK ? 0.5 : 1 }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: c.ink }}>{c.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {i === 0 ? <Spr rows={icons.coin} scale={6} /> : <Spr rows={valve} scale={6} />}
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 80, color: c.ink }}>{c.main}</span>
              </div>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: c.ink }}>{c.sub}</span>
            </div>
          ))}
        </div>
        <Bubble frame={frame} fps={fps} at={PICK + 10} x={480} y={40}>
          Free? Drill it!
        </Bubble>
      </Panel>

      {/* panel three: the capping drill */}
      <Panel frame={frame} fps={fps} at={D} x={40} y={580} w={1840} h={460} tilt={-0.5} bg={C.steel}>
        <Caption>Close the valves in order</Caption>
        <div style={{ position: "absolute", left: 120, top: 110, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.ink, marginRight: 10 }}>Order</span>
          {ORDER.map((v, i) => (
            <div key={i} style={{ width: 80, height: 80, display: "grid", placeItems: "center", background: i < done ? C.leaf : i === done ? C.sun : C.white, boxShadow: `0 0 0 6px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 48, color: i < done ? C.white : C.ink }}>
              {LETTERS[v]}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: BTN.x0, top: BTN.y - 80, display: "flex", gap: BTN.gap }}>
          {LETTERS.map((l, v) => {
            const at = PRESSES[ORDER.indexOf(v)];
            const closed = frame >= at + 4;
            return (
              <div key={l} style={{ width: BTN.w, height: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, background: closed ? C.leaf : C.white, boxShadow: ring(7), translate: frame >= at && frame < at + 8 ? "0 6px" : undefined }}>
                <Spr rows={valve} scale={7} style={{ rotate: closed ? "90deg" : undefined }} />
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 60, color: closed ? C.white : C.ink }}>{l}</span>
              </div>
            );
          })}
        </div>
        {frame >= CAPPED && (
          <div style={{ position: "absolute", right: 70, top: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 8 }}>
            <div style={{ padding: "18px 40px", background: C.leaf, boxShadow: `${ring(8)}, 0 0 0 16px ${C.sun}`, rotate: "-6deg", scale: String(interpolate(spring({ frame: frame - CAPPED, fps, config: { damping: 12, stiffness: 240 } }), [0, 1], [3, 1], { extrapolateRight: "clamp" })) }}>
              <Title size={64}>Capped! Free</Title>
            </div>
          </div>
        )}
        {frame >= SAVED && (
          <div style={{ position: "absolute", right: 40, top: 240, display: "flex", alignItems: "center", gap: 18, padding: "14px 26px", background: C.white, boxShadow: ring(7), rotate: "3deg", scale: String(spring({ frame: frame - SAVED, fps, config: { damping: 8, stiffness: 240 } })), zIndex: 8 }}>
            <Spr rows={icons.coin} scale={5} />
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink }}>Coins saved</span>
            <span style={{ position: "relative", fontFamily: font.logo, fontWeight: 700, fontSize: 56, color: C.leaf }}>
              {CAP_COST}
            </span>
          </div>
        )}
        {frame >= SAVED + 20 && (
          <div style={{ position: "absolute", right: 140, top: 370, zIndex: 8 }}>
            <Chip bg={C.ink} color={C.white} size={30}>
              <span style={{ fontFamily: font.logo }}>Well back online</span>
            </Chip>
          </div>
        )}
      </Panel>
      {PRESSES.map((at, i) => (
        <Popup key={i} frame={frame} at={at} x={40 + btnX(ORDER[i])} y={1010} size={40} life={36} color={C.leaf}>
          Shut!
        </Popup>
      ))}
      <Burst frame={frame} start={CAPPED} x={1500} y={700} rows={icons.coin} scale={6} count={20} speed={18} seed="capfree" />

      {ptr && (
        <AbsoluteFill style={{ zIndex: 100 }}>
          <Pointer x={ptr.x} y={ptr.y} down={ptr.down} scale={7} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
