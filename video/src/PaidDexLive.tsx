import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { base, boat, crate, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { HORIZON } from "@/components/scenes/hero-scene";
import { Burst, C, Chip, ease, font, SeaScene, Spr, Sunburst, Title, ring, snap } from "./brand";

// The sequel to the "Paid DEX is coming" card (PaidDex.tsx): the loading bar fills,
// "Coming soon" is struck out for "Live now", the wet paint sign drops, the
// billboard gets its PAID stamp and the tanker brings the DEX crate in to the rig.
// The PNG is frame STILL_FRAME, scaled to 1600x900.

export const PAID_DEX_LIVE_SECONDS = 10;
export const PAID_DEX_LIVE_STILL = 420;
const SHIFT = 420;

const s2f = (s: number) => Math.round(s * 60);
const FILL = { from: s2f(0.8), to: s2f(2.2) };
const STRIKE = s2f(2.4);
const SIGN = s2f(2.6);
const STAMP = s2f(3.3);
const DOCK = { from: s2f(3.6), to: s2f(6.2) };

export function PaidDexLive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wave = Math.round((frame * 480) / 420);
  const horizon = 480 + HORIZON * 4;
  const bob = Math.round(Math.sin(frame / 22) * 6);

  const fill = interpolate(frame, [FILL.from, FILL.to], [0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const loaded = frame >= FILL.to;
  const dots = ".".repeat((Math.floor(frame / 20) % 3) + 1);
  const strike = interpolate(frame, [STRIKE, STRIKE + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const live = spring({ frame: frame - STRIKE - 10, fps, config: { damping: 9, stiffness: 220 } });

  // the painter finishes a last stroke, then steps back along the plank and waves
  const painter = interpolate(frame, [0, s2f(2.4), s2f(3.4)], [1460, 1460, 1096], { extrapolateRight: "clamp", easing: ease });
  const painting = frame < s2f(2.4);
  const stroke = painting ? Math.floor(frame / 6) % 2 : 0;
  const waving = frame > s2f(3.6) && Math.floor(frame / 14) % 2;

  // the wet paint sign drops into the sea
  const fall = interpolate(frame, [SIGN, SIGN + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (v) => v * v });
  const stamp = spring({ frame: frame - STAMP, fps, config: { damping: 8, stiffness: 260 } });

  // the tanker comes in from the horizon to the rig
  const dock = interpolate(frame, [DOCK.from, DOCK.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const shipX = interpolate(dock, [0, 1], [1680, 1560]);
  const shipY = interpolate(dock, [0, 1], [horizon - 90, horizon + 30]);
  const shipScale = interpolate(dock, [0, 1], [1, 1.3]);

  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cx={0.72} cy={0.42} rays={28} turn={0.06} />

      {/* the rig, pushed to the right half */}
      <div style={{ position: "absolute", left: SHIFT, top: 0, width: 1920, height: 1080 }}>
        <SeaScene frame={wave} y={480} boatX={-60} />
      </div>
      <div style={{ position: "absolute", left: 0, top: horizon + 40, width: SHIFT + 20, height: 1080, background: C.seaDeep }} />

      {/* the billboard on its posts */}
      {[1120, 1640].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 380, width: 28, height: 392, background: C.ink }} />
      ))}
      <div style={{ position: "absolute", left: 1060, top: 104, width: 660, height: 300, background: C.white, boxShadow: ring(10), display: "grid", placeItems: "center" }}>
        <Title size={210} color={C.red} style={{ letterSpacing: 24 }}>
          DEX
        </Title>
      </div>
      {frame < SIGN + 30 && (
        <div style={{ position: "absolute", left: 1600, top: 70 + fall * 700, rotate: `${8 + fall * 120}deg`, opacity: 1 - fall * 0.3 }}>
          <Chip bg={C.sun} color={C.ink} size={24}>
            <span style={{ fontFamily: font.logo }}>Wet paint</span>
          </Chip>
        </div>
      )}
      {/* drips, only while the paint is wet */}
      {[1190, 1330, 1470, 1560].map((x, i) => {
        const d = (frame + i * 97) % 140;
        return frame < SIGN && <div key={x} style={{ position: "absolute", left: x, top: 330 + snap(d * 0.5, 6), width: 12, height: 18, background: C.red, opacity: d < 120 ? 1 : 0 }} />;
      })}
      {/* the PAID stamp */}
      {frame >= STAMP && (
        <div style={{ position: "absolute", left: 1290, top: 196, rotate: "-12deg", scale: String(interpolate(stamp, [0, 1], [2.6, 1], { extrapolateRight: "clamp" })), opacity: Math.min(1, stamp * 2) }}>
          <div style={{ padding: "10px 30px", background: C.leaf, boxShadow: `${ring(7)}, 0 0 0 14px ${C.white}, 0 0 0 19px ${C.ink}`, fontFamily: font.logo, fontWeight: 700, fontSize: 84, color: C.white, letterSpacing: 8 }}>PAID</div>
        </div>
      )}
      <Burst frame={frame} start={STAMP + 4} x={1390} y={250} count={18} rows={icons.coin} scale={5} speed={16} seed="paid" />

      {/* the scaffold, the painter and the bucket */}
      {[1080, 1700].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 96, width: 6, height: 316, background: C.woodDark }} />
      ))}
      <div style={{ position: "absolute", left: 1066, top: 404, width: 660, height: 20, background: C.wood, boxShadow: ring(5) }} />
      <div style={{ position: "absolute", left: 1650, top: 364, width: 40, height: 40, background: C.red, boxShadow: `0 0 0 5px ${C.ink}, inset 0 8px 0 ${C.redLight}` }} />
      <Spr rows={roughneck} palette={base} scale={6} x={snap(painter, 6)} y={404 - 114} />
      {painting ? (
        <>
          <div style={{ position: "absolute", left: snap(painter, 6) + 84, top: 250 + stroke * 30, width: 12, height: 60, background: C.woodDark }} />
          <div style={{ position: "absolute", left: snap(painter, 6) + 78, top: 226 + stroke * 30, width: 24, height: 28, background: C.red, boxShadow: `0 0 0 4px ${C.ink}` }} />
        </>
      ) : (
        <div style={{ position: "absolute", left: snap(painter, 6) + 84, top: waving ? 236 : 252, width: 18, height: 40, background: C.skin, boxShadow: `0 0 0 4px ${C.ink}`, rotate: waving ? "-20deg" : "10deg" }} />
      )}

      {/* the tanker with the DEX crate, coming in to the rig */}
      <div style={{ position: "absolute", left: shipX, top: shipY + bob, scale: String(shipScale), transformOrigin: "0 100%" }}>
        <Spr rows={crate} palette={base} scale={5} x={56} y={0} />
        <Spr rows={boat} palette={base} scale={6} x={0} y={48} />
        <div style={{ position: "absolute", left: 30, top: -56 }}>
          <Chip bg={dock >= 1 ? C.leaf : C.red} color={C.white} size={22}>
            <span style={{ fontFamily: font.logo }}>{dock >= 1 ? "DEX ✓" : "DEX"}</span>
          </Chip>
        </div>
      </div>

      {/* the text column */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 880, height: 1080, background: C.ink }} />
      {Array.from({ length: 27 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 880, top: i * 40, width: i % 2 ? 40 : 20, height: 40, background: C.ink }} />
      ))}
      <div style={{ position: "absolute", left: 96, top: 70, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4, C.sun) }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sun }}>Barrel Royale</span>
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "#0f2a20", boxShadow: ring(4, C.leaf) }}>
          <div style={{ width: 16, height: 16, background: loaded ? "#3dff9a" : frame % 40 < 26 ? "#3dff9a" : C.leaf }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: "#7dffb0", letterSpacing: 3 }}>{loaded ? "Live" : "Loading"}</span>
        </div>
        <Title size={150} style={{ marginTop: 26 }}>
          DEX
        </Title>
        <Title size={150} color={C.sun}>
          Paid
        </Title>
        <div style={{ position: "relative", marginTop: 14, height: 70 }}>
          <Title size={60} color={C.sunPale} style={{ opacity: 1 - strike * 0.55 }}>
            Coming soon
          </Title>
          <div style={{ position: "absolute", left: -8, top: 30, width: 560 * strike, height: 10, background: C.red, boxShadow: `0 0 0 3px ${C.ink}` }} />
          {frame >= STRIKE + 10 && (
            <div style={{ position: "absolute", left: 470, top: -18, rotate: "-8deg", scale: String(live), transformOrigin: "0 50%" }}>
              <Chip bg={C.leaf} color={C.white} size={34}>
                <span style={{ fontFamily: font.logo }}>Live now</span>
              </Chip>
            </div>
          )}
        </div>

        {/* the loading bar, now full */}
        <div style={{ marginTop: 34, width: 660, height: 64, background: C.stormSky, boxShadow: ring(6, loaded ? C.leaf : C.sunPale), display: "flex", gap: 4, padding: 8, boxSizing: "border-box" }}>
          {Array.from({ length: 20 }, (_, i) => {
            const on = i < Math.round(fill * 20);
            return <div key={i} style={{ flex: 1, background: on ? (loaded ? (i % 2 ? C.leaf : "#3dff9a") : i % 2 ? C.sunDeep : C.sun) : "transparent" }} />;
          })}
        </div>
        <span style={{ marginTop: 14, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: loaded ? "#7dffb0" : C.sunPale, letterSpacing: 4 }}>{loaded ? "Loaded · 100%" : `Loading${dots}`}</span>
      </div>
      <div style={{ position: "absolute", left: 96, bottom: 60, fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.sun, letterSpacing: 2 }}>
        $ROYAL · barrelroyale.io · @barrelroyale
      </div>
    </AbsoluteFill>
  );
}
