import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Pixels, Sprite, rect } from "@/components/pixel/sprite";
import { base, crate, crownBarrel, icons, logo, logoPalette, xMark } from "@/components/pixel/sprites";
import { HORIZON } from "@/components/scenes/hero-scene";
import { craneBoom } from "./art";
import { Burst, C, Chip, Embers, font, mono, PixelWipe, SeaScene, Spr, Sunburst, Title, ramp, ring, snap, typed, wiped } from "./brand";

// 3 · CA Live. The supply boat brings a crate to the rig, the crane hoists it,
// it bursts open, and the site's CA box announces $ROYAL live on Robinhood Chain.
// No address is shown unless the `ca` prop is set, so the post carries the address.

export const CA_LIVE_SECONDS = 14;

export type CaLiveProps = { ca: string };
export const caLiveDefaults: CaLiveProps = { ca: "0xca5cca2dff82c66c451181aa289ef614d826ea3a" };

// crane tip in art px (see art.ts), and where the boat stops so its crate hangs under it
const TIP = { x: 317, y: 23 };
const BOAT_STOP = 303;
const CRATE_ON_BOAT = HORIZON - 1; // the boat's deck is 3 rows down its sprite, the crate is 10 tall

export function CaLive({ ca }: CaLiveProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipeAt = 4.6 * fps;
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      {!wiped(frame, wipeAt) ? <Delivery frame={frame} fps={fps} /> : <Reveal frame={frame - (wipeAt + 22)} fps={fps} ca={ca} />}
      <PixelWipe frame={frame} start={wipeAt} color={C.white} />
    </AbsoluteFill>
  );
}

function Delivery({ frame, fps }: { frame: number; fps: number }) {
  // the boat sails in from the right and stops under the crane
  const sail = ramp(frame, 0, 1.6 * fps);
  const boatX = interpolate(sail, [0, 1], [500, BOAT_STOP]);
  // the hook comes down, picks the crate up and hauls it to the tip
  const down = ramp(frame, 1.5 * fps, 0.6 * fps);
  const up = ramp(frame, 2.3 * fps, 1.0 * fps);
  const crateY = up > 0 ? interpolate(up, [0, 1], [CRATE_ON_BOAT, TIP.y + 4]) : CRATE_ON_BOAT;
  const hookY = up > 0 ? crateY : interpolate(down, [0, 1], [TIP.y + 4, CRATE_ON_BOAT]);
  const crateX = up > 0 ? TIP.x - 5 : Math.round(boatX) + 10;
  const swing = up > 0 ? Math.round(Math.sin(frame / 7) * (1 - up) * 2) : 0;
  // then the camera pushes in on the crate
  const push = ramp(frame, 3.4 * fps, 1.2 * fps);
  const zoom = interpolate(push, [0, 1], [1, 3.2]);
  const cx = (TIP.x - 5 + 5) * 4;
  const cy = 480 + (TIP.y + 4 + 5) * 4;
  const shake = push > 0.4 ? snap(Math.sin(frame * 2.3) * 8 * push, 4) : 0;
  return (
    <AbsoluteFill style={{ scale: String(zoom), transformOrigin: `${cx}px ${cy}px`, translate: `${shake}px 0` }}>
      <Sunburst cy={0.62} turn={0.08} />
      <SeaScene frame={frame} boatX={boatX} crane={false}>
        <Pixels items={craneBoom()} />
        <Pixels items={[rect(TIP.x, TIP.y, 1, Math.round(hookY) - TIP.y, C.ink), rect(TIP.x - 3 + swing, Math.round(hookY) - 1, 7, 2, C.ink)]} />
        <Sprite rows={crate} palette={base} x={crateX + swing} y={Math.round(crateY)} />
      </SeaScene>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90, opacity: 1 - push }}>
        <Title size={84} family={font.display} style={{ scale: String(spring({ frame: frame - 10, fps, config: { damping: 12 } })) }}>
          Special delivery for the rig
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Reveal({ frame, fps, ca }: { frame: number; fps: number; ca: string }) {
  const s = (d: number, damping = 11) => spring({ frame: frame - d, fps, config: { damping, stiffness: 150 } });
  // the box types its line, then the LIVE stamp lands on its end
  const line = ca || "Live on Robinhood Chain";
  const typeAt = 34;
  const shown = typed(line, frame, typeAt, ca ? 34 : 22);
  const doneAt = typeAt + Math.ceil((line.length / (ca ? 34 : 22)) * fps);
  const stampAt = doneAt + 20;
  const stamp = spring({ frame: frame - stampAt, fps, config: { damping: 8, stiffness: 200, mass: 0.8 } });
  const blink = Math.floor((frame - stampAt) / 24) % 2 === 0;
  return (
    <AbsoluteFill>
      <Sunburst cy={0.55} turn={0.1} />
      {/* the crate's planks, flung out from the middle */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = random(`plank${i}`) * Math.PI * 2;
        const v = 14 + random(`plankv${i}`) * 16;
        const t = frame;
        const x = 960 + Math.cos(a) * v * t;
        const y = 560 + Math.sin(a) * v * t + 0.4 * t * t;
        const w = 20 + Math.round(random(`plankw${i}`) * 3) * 10;
        return t < 70 ? <div key={i} style={{ position: "absolute", left: snap(x, 10), top: snap(y, 10), width: w, height: 20, background: i % 3 ? C.sunDeep : C.ink }} /> : null;
      })}
      <Embers frame={frame} count={26} colors={[C.white, C.sunPale]} size={8} seed="ca" />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 110, gap: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40, scale: String(s(0, 9)) }}>
          <Spr rows={crownBarrel} scale={9} style={{ translate: `0 ${snap(Math.sin(frame / 12) * 8, 4)}px` }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
            <Title size={140}>
              $ROYAL <span style={{ color: C.red }}>CA</span>
            </Title>
            <Chip bg={C.red} color={C.white} size={64} style={{ scale: String(s(8)), transformOrigin: "0 50%" }}>
              <span style={{ fontFamily: font.logo }}>is live</span>
            </Chip>
          </div>
        </div>

        {/* the site's CA box, with a LIVE stamp where the Copy button sits */}
        <div style={{ display: "flex", alignItems: "stretch", background: C.white, boxShadow: ring(8), marginTop: 40, scale: String(s(12)) }}>
          <div style={{ display: "flex", alignItems: "center", background: C.ink, color: C.sun, fontFamily: font.display, fontWeight: 700, fontSize: 48, padding: "0 30px" }}>CA</div>
          <div style={{ display: "flex", alignItems: "center", width: ca ? 1180 : 900, padding: "26px 28px", fontFamily: ca ? mono : font.display, fontWeight: 700, fontSize: ca ? 46 : 60, color: C.ink, letterSpacing: 0.5 }}>
            {shown}
            {shown.length < line.length && <span style={{ display: "inline-block", width: 24, height: 50, background: C.ink, opacity: frame % 20 < 11 ? 1 : 0 }} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, borderLeft: `8px solid ${C.ink}`, background: frame >= stampAt ? C.red : C.sunPale, color: C.white, padding: "0 36px", minWidth: 220, justifyContent: "center" }}>
            {frame >= stampAt && (
              <div style={{ display: "flex", alignItems: "center", gap: 18, scale: String(interpolate(stamp, [0, 1], [2.6, 1])) }}>
                <div style={{ width: 24, height: 24, background: blink ? C.white : C.redLight, boxShadow: `0 0 0 5px ${C.ink}` }} />
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 60, lineHeight: 1, letterSpacing: 3, textShadow: `0 5px 0 ${C.redDeep}` }}>LIVE</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 30, marginTop: 50 }}>
          {[
            { t: "Fair launch", icon: icons.coin },
            { t: "No presale, no private round", icon: icons.derrick },
            { t: "Official CA on @barrelroyale", icon: xMark },
          ].map((c, i) => (
            <Chip key={c.t} size={38} style={{ scale: String(s(doneAt - 10 + i * 8)) }}>
              <Spr rows={c.icon} scale={3} />
              {c.t}
            </Chip>
          ))}
        </div>
      </AbsoluteFill>

      <Burst frame={frame} start={stampAt + 2} x={ca ? 1680 : 1500} y={560} rows={icons.coin} scale={5} count={18} speed={17} seed="copy" />

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, scale: String(s(stampAt + 30)) }}>
        <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4) }} />
        <Title size={56} family={font.display}>
          barrelroyale.io
        </Title>
      </div>
    </AbsoluteFill>
  );
}
