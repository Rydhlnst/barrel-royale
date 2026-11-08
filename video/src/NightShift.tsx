import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { icons, logo, logoPalette } from "@/components/pixel/sprites";
import { C, Chip, Spr, Stars, Title, font, pop, ramp, ring, snap, typed } from "./brand";

// Halloween night on the rig, for the last day of the Double Pay weekend: the moon
// comes up over a dark sea, pumpkin barrels roll onto the deck, a friendly ghost
// roughneck floats by, a sale pays and then doubles under a 2x stamp, and the card
// says when Double Pay ends.

export const NIGHT_SHIFT_SECONDS = 14;
export const NIGHT_SHIFT_STILL = 780;

const DECK = 760;
const PUMPKIN = "#ff8a1f";
const PUMPKIN_DARK = "#d9620a";
const STEM = "#3f8f3a";
const NIGHT = ["#120f2b", "#1c1740", "#2a2058", "#3b2a6e"];

export function NightShift() {
  const frame = useCurrentFrame();
  const sky = ramp(frame, 0, 60);
  const moonY = interpolate(ramp(frame, 10, 110), [0, 1], [520, 150]);
  const dim = ramp(frame, 610, 24);
  return (
    <AbsoluteFill style={{ background: NIGHT[0], overflow: "hidden" }}>
      {NIGHT.map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 0, top: i * 170, width: 1920, height: 170, background: c, opacity: sky }} />
      ))}
      <Stars frame={frame} count={70} h={620} seed="night" />
      <Moon x={1420} y={snap(moonY, 6)} />

      {/* the rig as a silhouette against the moon */}
      <RigSilhouette frame={frame} />

      {/* sea and deck */}
      <div style={{ position: "absolute", left: 0, top: DECK + 40, width: 1920, height: 300, background: "#0d1f4a" }} />
      {Array.from({ length: 18 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: ((i * 197 + frame * 2) % 2000) - 60, top: DECK + 80 + (i % 4) * 52, width: 80, height: 6, background: "#3a5aa0", opacity: 0.7 }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: DECK, width: 1920, height: 40, background: "#3a3150", boxShadow: `0 -6px 0 0 ${C.ink}, 0 6px 0 0 ${C.ink}` }} />

      {/* pumpkin barrels rolling in */}
      {[0, 1, 2, 3].map((i) => {
        const k = ramp(frame, 140 + i * 22, 50);
        const x = interpolate(k, [0, 1], [-160, 140 + i * 150]);
        return <Pumpkin key={i} x={snap(x, 6)} y={DECK - 96} frame={frame} lit={frame > 200 + i * 22} seed={i} />;
      })}

      <Ghost x={snap(interpolate(ramp(frame, 230, 260, (v) => v), [0, 1], [380, 1040]), 6)} y={snap(470 + Math.sin(frame / 14) * 18, 6)} frame={frame} show={frame > 220} />
      <Bats frame={frame} />

      {/* the payout: +120, then 2x, then +240 */}
      <Payout frame={frame} />

      {/* title cards */}
      <div style={{ position: "absolute", left: 96, top: 90, opacity: 1 - ramp(frame, 270, 20) }}>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: PUMPKIN, letterSpacing: 6 }}>{typed("Halloween on the rig", frame, 30, 22)}</div>
        <Title size={120} color={C.white} style={{ marginTop: 14, opacity: ramp(frame, 70, 20) }}>
          Night shift
        </Title>
      </div>

      <div style={{ position: "absolute", inset: 0, background: "#0b0a1c", opacity: dim * 0.6 }} />
      {frame >= 610 && <Closing frame={frame} />}
    </AbsoluteFill>
  );
}

const SIL = "#0b0a1c";

/** The rig against the moon: legs into the sea, the deck, a lattice derrick, a crane and a flare. */
function RigSilhouette({ frame }: { frame: number }) {
  const top = DECK - 230;
  const flame = Math.floor(frame / 6) % 2;
  return (
    <>
      {[1250, 1350, 1520, 1620].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: top + 30, width: 30, height: DECK - top + 40, background: SIL }} />
      ))}
      <div style={{ position: "absolute", left: 1220, top: top + 60, width: 440, height: 18, background: SIL }} />
      <div style={{ position: "absolute", left: 1190, top: top, width: 500, height: 40, background: SIL }} />
      <div style={{ position: "absolute", left: 1230, top: top - 60, width: 140, height: 60, background: SIL }} />
      {/* the derrick, a stepped lattice tower */}
      {Array.from({ length: 10 }, (_, i) => {
        const w = 150 - i * 12;
        return (
          <div key={i} style={{ position: "absolute", left: 1460 - w / 2, top: top - (i + 1) * 30, width: w, height: 30, boxShadow: `inset 0 0 0 8px ${SIL}` }}>
            <div style={{ position: "absolute", left: 0, top: 11, width: w, height: 8, background: SIL }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 1448, top: top - 330, width: 24, height: 30, background: SIL }} />
      <div style={{ position: "absolute", left: 1452, top: top - 344, width: 16, height: 14, background: C.red, opacity: frame % 60 < 30 ? 1 : 0.25 }} />
      {/* crane boom */}
      <div style={{ position: "absolute", left: 1600, top: top - 110, width: 20, height: 110, background: SIL }} />
      <div style={{ position: "absolute", left: 1600, top: top - 110, width: 220, height: 14, background: SIL, rotate: "-12deg", transformOrigin: "0 50%" }} />
      {/* flare stack */}
      <div style={{ position: "absolute", left: 1206, top: top - 150, width: 14, height: 150, background: SIL, rotate: "-20deg", transformOrigin: "50% 100%" }} />
      <div style={{ position: "absolute", left: 1150, top: top - 186 + flame * 4, width: 28, height: 34 - flame * 6, background: "#ff8a1f", boxShadow: "0 0 30px 10px rgba(255, 138, 31, 0.5)" }} />
      <div style={{ position: "absolute", left: 1158, top: top - 172 + flame * 4, width: 12, height: 18, background: C.sunPale }} />
    </>
  );
}

function Moon({ x, y }: { x: number; y: number }) {
  const rows = [80, 120, 144, 156, 160, 160, 156, 144, 120, 80];
  return (
    <div style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 0 60px rgba(255, 241, 194, 0.55))" }}>
      {rows.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: (160 - w) / 2, top: i * 16, width: w, height: 16, background: C.sunPale }} />
      ))}
      {[
        [40, 40, 24],
        [96, 72, 32],
        [56, 108, 16],
      ].map(([cx, cy, s]) => (
        <div key={`${cx}`} style={{ position: "absolute", left: cx, top: cy, width: s, height: s, background: "#f1dc9a" }} />
      ))}
    </div>
  );
}

/** A barrel carved like a jack-o'-lantern, glowing once lit. */
function Pumpkin({ x, y, frame, lit, seed }: { x: number; y: number; frame: number; lit: boolean; seed: number }) {
  const flick = lit && (frame + seed * 17) % 50 < 4 ? 0.6 : 1;
  const glow = lit ? C.sun : "#3a2a10";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 96, height: 96 }}>
      <div style={{ position: "absolute", left: 40, top: -18, width: 16, height: 20, background: STEM, boxShadow: `0 0 0 4px ${C.ink}` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 96, height: 96, background: PUMPKIN, boxShadow: `0 0 0 6px ${C.ink}${lit ? ", 0 0 40px 8px rgba(255, 138, 31, 0.45)" : ""}` }} />
      {[24, 48, 72].map((l) => (
        <div key={l} style={{ position: "absolute", left: l - 3, top: 0, width: 6, height: 96, background: PUMPKIN_DARK }} />
      ))}
      <div style={{ position: "absolute", left: 16, top: 24, width: 20, height: 18, background: glow, opacity: flick }} />
      <div style={{ position: "absolute", left: 60, top: 24, width: 20, height: 18, background: glow, opacity: flick }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: "absolute", left: 18 + i * 12, top: 58 + (i % 2) * 8, width: 12, height: 14, background: glow, opacity: flick }} />
      ))}
    </div>
  );
}

/** A friendly ghost roughneck in a hard hat, floating across the deck. */
function Ghost({ x, y, frame, show }: { x: number; y: number; frame: number; show: boolean }) {
  if (!show) return null;
  const wave = Math.floor(frame / 10) % 2;
  const rows = [56, 88, 104, 112, 112, 112, 112, 112];
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: 0.92 }}>
      {/* hard hat */}
      <div style={{ position: "absolute", left: 18, top: -30, width: 76, height: 26, background: C.hat, boxShadow: `0 0 0 5px ${C.ink}` }} />
      <div style={{ position: "absolute", left: 6, top: -8, width: 100, height: 10, background: C.hatShade, boxShadow: `0 0 0 5px ${C.ink}` }} />
      {rows.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: (112 - w) / 2, top: i * 16, width: w, height: 16, background: C.white }} />
      ))}
      {/* the wavy hem */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: i * 28, top: 128, width: 28, height: (i + wave) % 2 ? 22 : 10, background: C.white }} />
      ))}
      <div style={{ position: "absolute", left: 30, top: 40, width: 14, height: 20, background: C.ink }} />
      <div style={{ position: "absolute", left: 68, top: 40, width: 14, height: 20, background: C.ink }} />
      <div style={{ position: "absolute", left: 46, top: 72, width: 20, height: 12, background: C.ink }} />
    </div>
  );
}

function Bats({ frame }: { frame: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const start = 120 + i * 40;
        const t = frame - start;
        if (t < 0 || t > 360) return null;
        const x = -80 + t * (5 + random(`bx${i}`) * 3);
        const y = 120 + random(`by${i}`) * 300 + Math.sin((frame + i * 20) / 9) * 24;
        const up = Math.floor((frame + i * 3) / 6) % 2;
        return (
          <div key={i} style={{ position: "absolute", left: snap(x, 4), top: snap(y, 4) }}>
            <div style={{ position: "absolute", left: 20, top: 8, width: 16, height: 16, background: "#0b0a1c" }} />
            <div style={{ position: "absolute", left: 0, top: up ? 0 : 12, width: 20, height: 8, background: "#0b0a1c" }} />
            <div style={{ position: "absolute", left: 36, top: up ? 0 : 12, width: 20, height: 8, background: "#0b0a1c" }} />
          </div>
        );
      })}
    </>
  );
}

function Payout({ frame }: { frame: number }) {
  if (frame < 300 || frame > 640) return null;
  const inK = ramp(frame, 300, 16, pop);
  const stamp = ramp(frame, 380, 12, pop);
  const doubled = frame >= 392;
  const count = doubled ? Math.round(interpolate(ramp(frame, 392, 40), [0, 1], [120, 240])) : 120;
  return (
    <div style={{ position: "absolute", left: 600, top: 150, scale: String(inK) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 34px", background: C.white, boxShadow: ring(8) }}>
        <Spr rows={icons.coin} scale={8} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.ink2, letterSpacing: 3 }}>Tanker sale</span>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 84, color: doubled ? C.leaf : C.ink, lineHeight: 1 }}>+{count}</span>
        </div>
      </div>
      {frame >= 380 && (
        <div
          style={{
            position: "absolute",
            left: 440,
            top: -76,
            rotate: "-10deg",
            scale: String(interpolate(stamp, [0, 1], [2.6, 1])),
            padding: "6px 22px",
            border: `8px solid ${PUMPKIN}`,
            background: "#1c1740",
            color: PUMPKIN,
            fontFamily: font.logo,
            fontWeight: 700,
            fontSize: 70,
          }}
        >
          2x
        </div>
      )}
    </div>
  );
}

function Padlock() {
  return (
    <div style={{ position: "relative", width: 40, height: 46 }}>
      <div style={{ position: "absolute", left: 8, top: 0, width: 24, height: 22, boxShadow: `inset 0 0 0 6px ${C.ink}` }} />
      <div style={{ position: "absolute", left: 0, top: 18, width: 40, height: 28, background: C.sun, boxShadow: `0 0 0 5px ${C.ink}` }} />
      <div style={{ position: "absolute", left: 16, top: 26, width: 8, height: 12, background: C.ink }} />
    </div>
  );
}

function Closing({ frame }: { frame: number }) {
  const k = ramp(frame, 610, 24, pop);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 110, width: 1920, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, scale: String(interpolate(k, [0, 1], [0.6, 1])), opacity: Math.min(1, k * 1.5) }}>
        <Title size={86} color={PUMPKIN} family={font.display}>
          Spooky weekend, double pay
        </Title>
        <Title size={200} color={C.sun}>
          Double Pay
        </Title>
        <Title size={46} color={C.white} family={font.display}>
          Sales, contracts, tankers and exports pay 2x
        </Title>
        <div style={{ marginTop: 10, opacity: ramp(frame, 660, 16) }}>
          <Chip bg={C.red} color={C.white} size={40}>
            Ends Sun 1 Nov · 13:00 UTC
          </Chip>
        </div>
        {/* the reward vault, as it stands on-chain: nothing has ever been withdrawn */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 18, padding: "14px 26px", background: C.white, boxShadow: ring(6, C.sun), opacity: ramp(frame, 700, 16), scale: String(interpolate(ramp(frame, 700, 16, pop), [0, 1], [0.8, 1])) }}>
          <Padlock />
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.ink, whiteSpace: "nowrap" }}>
            XOM reward vault: 0 withdrawals · 7-day public timelock
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 54, width: 1920, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: ramp(frame, 680, 20) }}>
        <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4, C.sun) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.sun, letterSpacing: 3, textShadow: `0 4px 0 ${C.ink}` }}>barrelroyale.io/play · @barrelroyale</span>
      </div>
    </>
  );
}
