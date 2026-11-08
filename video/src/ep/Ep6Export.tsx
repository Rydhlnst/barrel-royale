import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons } from "@/components/pixel/sprites";
import { Burst, C, font, Pointer, Spr, Title, ring, snap } from "../brand";
import { bumpAt, Dissolve, dissolved, EpEnd, Popup, Shutter } from "./kit";

// EP 6 · Barrels to XOM. At sunset the cursor hits EXPORT, barrels roll down
// the rails into the terminal's portal and come out the far side as XOM coins
// that fly into the wallet. Blinds close and open on the week: the calendar's
// days flip to "New XOM", and the pulsing CLAIM button gets clicked.

export const EP6_SECONDS = 12;
const END = 610;
const BLINDS = 330;
const CAL = BLINDS + 22;
const CLAIM_CLICK = 540;

const BARRELS = Array.from({ length: 8 }, (_, i) => 118 + i * 20);
const TRAVEL = 50;

export function Ep6Export() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {dissolved(frame, END) ? <EpEnd frame={frame - END - 20} fps={fps} ep={6} line="Barrels to XOM" color={C.sunDeep} /> : frame < CAL ? <Terminal frame={frame} fps={fps} /> : <Calendar frame={frame - CAL} fps={fps} />}
      <Blinds frame={frame} start={BLINDS} />
      <Shutter frame={frame} fps={fps} ep={6} title="Barrels → $XOM" color={C.sunDeep} />
      <Dissolve frame={frame} start={END} color={C.sunDeep} />
    </AbsoluteFill>
  );
}

/** Twelve vertical slats close across the frame, then open again. */
function Blinds({ frame, start }: { frame: number; start: number }) {
  const t = frame - start;
  if (t < 0 || t > 46) return null;
  const k = t < 22 ? t / 22 : t < 26 ? 1 : 1 - (t - 26) / 20;
  const w = 160;
  return (
    <AbsoluteFill style={{ zIndex: 150 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: i * w + (w * (1 - k)) / 2, top: 0, width: snap(w * k, 8), height: 1080, background: i % 2 ? C.sunDeep : C.ink }} />
      ))}
    </AbsoluteFill>
  );
}

function Wallet({ frame, xom, bumpFrom }: { frame: number; xom: number; bumpFrom: number }) {
  return (
    <div style={{ position: "absolute", right: 40, top: 30, width: 380, padding: "16px 22px", background: C.white, boxShadow: ring(7), scale: String(1 + bumpAt(frame, bumpFrom) * 0.12), zIndex: 50 }}>
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.ink2 }}>Wallet</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, minHeight: 56 }}>
        {Array.from({ length: xom }, (_, i) => (
          <Spr key={i} rows={icons.coin} scale={3} />
        ))}
        {xom === 0 && <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: C.steelDeep }}>Waiting for XOM</span>}
      </div>
    </div>
  );
}

function Terminal({ frame, fps }: { frame: number; fps: number }) {
  const portal = { x: 760, y: 470 };
  const made = BARRELS.filter((b) => frame >= b + TRAVEL).length;
  const lastMade = made ? BARRELS[made - 1] + TRAVEL : -100;
  const pressed = frame >= 100 && frame < 108;
  return (
    <AbsoluteFill>
      {/* sunset sky in hard bands */}
      {[C.redDeep, C.red, C.hat, C.sunDeep, C.sun].map((c, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: i * 140, width: 1920, height: 140, background: c }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 700, width: 1920, height: 380, background: C.seaDeep }} />
      {/* the rails */}
      <div style={{ position: "absolute", left: 0, top: 690, width: 800, height: 20, background: C.ink }} />
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: i * 60, top: 706, width: 16, height: 40, background: C.woodDark }} />
      ))}
      {/* the terminal */}
      <div style={{ position: "absolute", left: 760, top: 260, width: 420, height: 450, background: C.steelLight, boxShadow: ring(9) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 90, background: C.ink, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 52, color: C.sun }}>Export</div>
        {/* the portal: a ring of blocks that cycles colours */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const colors = [C.sun, C.flame, C.red, C.sunPale];
          return <div key={i} style={{ position: "absolute", left: 30 + 80 + Math.cos(a) * 90 - 14, top: 160 + 110 + Math.sin(a) * 90 - 14, width: 28, height: 28, background: colors[(i + Math.floor(frame / 4)) % 4] }} />;
        })}
        <div style={{ position: "absolute", left: 60, top: 220, width: 100, height: 100, background: C.ink }} />
        {/* the export button */}
        <div style={{ position: "absolute", left: 230, top: 200, width: 160, padding: "14px 0", background: frame >= 104 ? C.leaf : C.red, boxShadow: ring(6), textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.white, translate: pressed ? "0 6px" : undefined }}>{frame >= 104 ? "On" : "Start"}</div>
        <div style={{ position: "absolute", left: 230, top: 300, width: 160, height: 120, background: C.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.sunPale }}>Shipped</span>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 56, color: C.sun }}>{made}</span>
        </div>
      </div>
      {frame >= 60 && frame < 140 && <Pointer x={interpolate(frame, [60, 98], [1400, 1020], { extrapolateRight: "clamp" })} y={interpolate(frame, [60, 98], [900, 490], { extrapolateRight: "clamp" })} down={pressed} scale={7} />}

      {/* barrels bounce down the rails into the portal */}
      {BARRELS.map((b, i) => {
        const t = frame - b;
        if (t < 0 || t >= TRAVEL) return null;
        const p = t / TRAVEL;
        const x = interpolate(p, [0, 1], [-120, portal.x + 40]);
        const hop = Math.abs(Math.sin(p * Math.PI * 3)) * 40;
        return <Spr key={i} rows={barrel} palette={base} scale={7} x={snap(x, 7)} y={snap(600 - hop, 7)} style={{ opacity: p > 0.9 ? 0 : 1 }} />;
      })}
      {/* and come out as XOM, flying up into the wallet */}
      {BARRELS.map((b, i) => {
        const t = frame - (b + TRAVEL);
        if (t < 0 || t > 40) return null;
        const p = t / 40;
        const x = interpolate(p, [0, 1], [1180, 1640]);
        const y = interpolate(p, [0, 1], [430, 90]) - Math.sin(p * Math.PI) * 160;
        return <Spr key={i} rows={icons.coin} scale={8} x={snap(x, 8)} y={snap(y, 8)} style={{ opacity: p > 0.92 ? 0 : 1 }} />;
      })}
      {BARRELS.map((b, i) => (
        <Popup key={i} frame={frame} at={b + TRAVEL} x={1260} y={400} size={40} life={34}>
          +XOM
        </Popup>
      ))}
      <Wallet frame={frame} xom={BARRELS.filter((b) => frame >= b + TRAVEL + 40).length} bumpFrom={lastMade + 40} />
      <div style={{ position: "absolute", left: 60, top: 60, zIndex: 40 }}>
        <Title size={70}>
          Barrels <span style={{ color: C.sun }}>→</span> XOM
        </Title>
      </div>
    </AbsoluteFill>
  );
}

function Calendar({ frame, fps }: { frame: number; fps: number }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const click = CLAIM_CLICK - CAL;
  const claimed = frame >= click + 4;
  const pulse = claimed ? 1 : 1 + (Math.floor(frame / 10) % 2) * 0.06;
  const btnIn = spring({ frame: frame - 140, fps, config: { damping: 9, stiffness: 200 } });
  const px = interpolate(frame, [150, click - 2], [1500, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(frame, [150, click - 2], [1040, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.sunPale }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.sun} 4px, transparent 4px), linear-gradient(90deg, ${C.sun} 4px, transparent 4px)`, backgroundSize: "80px 80px", opacity: 0.6 }} />
      <AbsoluteFill style={{ alignItems: "flex-start", padding: "60px 0 0 90px" }}>
        <Title size={88}>Your week in XOM</Title>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 280, display: "flex", justifyContent: "center", gap: 22 }}>
        {days.map((d, i) => {
          const at = 16 + i * 16;
          const f = frame - at;
          const sy = f < 0 ? 1 : f < 6 ? 1 - f / 6 : f < 12 ? (f - 6) / 6 : 1;
          const on = f >= 6;
          return (
            <div key={d} style={{ width: 210, height: 290, background: on ? C.white : C.steelLight, boxShadow: ring(7), scale: `1 ${sy}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
              <div style={{ width: "100%", textAlign: "center", padding: "8px 0", background: on ? C.red : C.steelDeep, fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.white, marginTop: -16 }}>{d}</div>
              {on && (
                <>
                  <Spr rows={icons.coin} scale={9} style={{ translate: `0 ${-snap(Math.abs(Math.sin((frame + i * 6) / 10)) * 12, 3)}px` }} />
                  <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.leaf }}>New XOM</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div style={{ padding: "26px 70px", background: claimed ? C.leaf : C.red, boxShadow: ring(9), fontFamily: font.logo, fontWeight: 700, fontSize: 76, color: C.white, scale: String(btnIn * pulse), translate: frame >= click && frame < click + 6 ? "0 8px" : undefined }}>{claimed ? "Claimed!" : "Claim XOM"}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: font.display, fontWeight: 700, fontSize: 40, color: C.ink, opacity: btnIn }}>
        Claims open every week, straight to your wallet
      </div>
      {frame >= 150 && frame < click + 30 && <Pointer x={px} y={py} down={frame >= click && frame < click + 6} scale={8} />}
      <Burst frame={frame} start={click + 4} x={960} y={720} rows={icons.coin} scale={6} count={26} speed={20} seed="claimx" />
      <Wallet frame={frame} xom={claimed ? 8 + Math.min(10, Math.floor((frame - click) / 3)) : 8} bumpFrom={click + 4} />
    </AbsoluteFill>
  );
}
