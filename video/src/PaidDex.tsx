import { AbsoluteFill, useCurrentFrame } from "remotion";
import { base, boat, crate, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { HORIZON } from "@/components/scenes/hero-scene";
import { C, Chip, font, SeaScene, Spr, Sunburst, Title, ring, snap } from "./brand";

// The "Paid DEX is coming" reply card: PAID DEX, coming soon, over a pixel
// loading bar on the left; on the right a roughneck on a scaffold paints a big
// DEX billboard on the rig while a tanker with a DEX crate bobs on the horizon.
// The video loops every seven seconds; the reply PNG is frame STILL_FRAME,
// scaled to 1600x900.

export const PAID_DEX_SECONDS = 7;
const LOOP = PAID_DEX_SECONDS * 60;
export const STILL_FRAME = 250;
const SHIFT = 420;

export function PaidDex() {
  return <Scene frame={useCurrentFrame()} />;
}

function Scene({ frame }: { frame: number }) {
  const t = frame % LOOP;
  const wave = Math.round((t * 480) / LOOP);
  // the painter walks the plank and back once per loop
  const k = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / LOOP);
  const painter = 1100 + k * 480;
  const stroke = Math.floor(t / 6) % 2;
  const bob = Math.round(Math.sin((2 * Math.PI * t * 3) / LOOP) * 6);
  const fill = t < 380 ? 0.08 + (t / 380) * 0.8 : 0.88;
  const dots = ".".repeat((Math.floor(t / 20) % 3) + 1);
  const horizon = 480 + HORIZON * 4;

  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cx={0.72} cy={0.42} rays={28} turn={360 / 28 / LOOP} />

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
      <div style={{ position: "absolute", left: 1600, top: 70, rotate: "8deg" }}>
        <Chip bg={C.sun} color={C.ink} size={24}>
          <span style={{ fontFamily: font.logo }}>Wet paint</span>
        </Chip>
      </div>
      {/* paint drips under the letters */}
      {[1190, 1330, 1470, 1560].map((x, i) => {
        const d = (t + i * 97) % 140;
        return <div key={x} style={{ position: "absolute", left: x, top: 330 + snap(d * 0.5, 6), width: 12, height: 18, background: C.red, opacity: d < 120 ? 1 : 0 }} />;
      })}

      {/* the hanging scaffold, the painter and his bucket */}
      {[1080, 1700].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 96, width: 6, height: 316, background: C.woodDark }} />
      ))}
      <div style={{ position: "absolute", left: 1066, top: 404, width: 660, height: 20, background: C.wood, boxShadow: ring(5) }} />
      <div style={{ position: "absolute", left: 1180 + Math.round(k * 120), top: 364, width: 40, height: 40, background: C.red, boxShadow: `0 0 0 5px ${C.ink}, inset 0 8px 0 ${C.redLight}` }} />
      <Spr rows={roughneck} palette={base} scale={6} x={snap(painter, 6)} y={404 - 114} />
      {/* the brush, stroking up and down */}
      <div style={{ position: "absolute", left: snap(painter, 6) + 84, top: 250 + stroke * 30, width: 12, height: 60, background: C.woodDark }} />
      <div style={{ position: "absolute", left: snap(painter, 6) + 78, top: 226 + stroke * 30, width: 24, height: 28, background: C.red, boxShadow: `0 0 0 4px ${C.ink}` }} />

      {/* the tanker on the horizon, bringing a DEX crate */}
      <div style={{ position: "absolute", left: 1680, top: horizon - 90 + bob }}>
        <Spr rows={crate} palette={base} scale={5} x={56} y={0} />
        <Spr rows={boat} palette={base} scale={6} x={0} y={48} />
        <div style={{ position: "absolute", left: 30, top: -56 }}>
          <Chip bg={C.red} color={C.white} size={22}>
            <span style={{ fontFamily: font.logo }}>DEX</span>
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
          <div style={{ width: 16, height: 16, background: t % 40 < 26 ? "#3dff9a" : C.leaf }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: "#7dffb0", letterSpacing: 3 }}>Loading</span>
        </div>
        <Title size={150} style={{ marginTop: 26 }}>
          Paid
        </Title>
        <Title size={150} color={C.sun}>
          DEX
        </Title>
        <Title size={60} color={C.sunPale} style={{ marginTop: 14 }}>
          Coming soon
        </Title>

        {/* the loading bar */}
        <div style={{ marginTop: 40, width: 660, height: 64, background: C.stormSky, boxShadow: ring(6, C.sunPale), display: "flex", gap: 4, padding: 8, boxSizing: "border-box" }}>
          {Array.from({ length: 20 }, (_, i) => {
            const on = i < Math.round(fill * 20);
            const head = on && i === Math.round(fill * 20) - 1 && t % 16 < 8;
            return <div key={i} style={{ flex: 1, background: on ? (head ? C.sunPale : i % 2 ? C.sunDeep : C.sun) : "transparent" }} />;
          })}
        </div>
        <span style={{ marginTop: 14, fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sunPale, letterSpacing: 4 }}>Loading{dots}</span>
      </div>
      <div style={{ position: "absolute", left: 96, bottom: 60, fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.sun, letterSpacing: 2 }}>
        $ROYAL · barrelroyale.io · @barrelroyale
      </div>
    </AbsoluteFill>
  );
}
