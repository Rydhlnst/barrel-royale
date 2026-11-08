import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Pixels, line, rect } from "@/components/pixel/sprite";
import { base, crownBarrel, flameA, flameB, flamePalette, icons, logo, logoPalette, xMark } from "@/components/pixel/sprites";
import { Bands, Burst, C, Chip, Embers, font, PixelWipe, SeaScene, Spr, Stars, Sunburst, Title, Window, ramp, ring, snap, wiped } from "./brand";

// 2 · Launching Soon. Night on the rig: a pressure gauge counts down 3, 2, 1,
// the crown barrel lifts off the derrick on a flare, the sun comes up behind it,
// and the $ROYAL card follows with the whitelist playing beside it.

export const LAUNCHING_SOON_SECONDS = 15;

// where the derrick's crown sits on screen when the sea scene is at y = 480
const DERRICK = { x: 992, y: 480 + 28 };

export function LaunchingSoon() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = 1.4 * fps;
  const liftAt = count + 3 * fps;
  const wipeAt = 8.2 * fps;
  const card = wiped(frame, wipeAt);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {!card ? <Countdown frame={frame} fps={fps} count={count} liftAt={liftAt} /> : <SoonCard frame={frame - (wipeAt + 22)} fps={fps} at={wipeAt + 22} />}
      <PixelWipe frame={frame} start={wipeAt} color={C.sun} />
    </AbsoluteFill>
  );
}

/** The gauge's needle, a pixel line from the centre, at `t` of the way from empty to the red. */
function Gauge({ t, scale }: { t: number; scale: number }) {
  // the dial sweeps from lower left (225°) clockwise to upper right (-45°)
  const a = ((225 - t * 270) * Math.PI) / 180;
  const x1 = Math.round(7.5 + Math.cos(a) * 5);
  const y1 = Math.round(7.5 - Math.sin(a) * 5);
  return (
    <svg viewBox="0 0 16 16" width={16 * scale} height={16 * scale} shapeRendering="crispEdges" style={{ display: "block" }}>
      <Spr16 rows={icons.gauge} />
      <Pixels items={[...line(7, 7, x1, y1, t > 0.8 ? C.red : C.ink), rect(7, 7, 2, 2, C.ink)]} />
    </svg>
  );
}

function Spr16({ rows }: { rows: readonly string[] }) {
  const items = rows.flatMap((row, y) => row.split("").map((ch, x) => (base[ch] ? rect(x, y, 1, 1, base[ch]) : null)).filter(Boolean)) as ReturnType<typeof rect>[];
  return <Pixels items={items} />;
}

function Countdown({ frame, fps, count, liftAt }: { frame: number; fps: number; count: number; liftAt: number }) {
  // the camera starts on the derrick's blinking crown and pulls back
  const pull = ramp(frame, 0, 1.4 * fps);
  const zoom = interpolate(pull, [0, 1], [2.4, 1]);
  const dawn = ramp(frame, liftAt + 10, 1.4 * fps);
  const shake = frame > liftAt - 30 && frame < liftAt + 50 ? snap(Math.sin(frame * 2.1) * 6, 3) : 0;

  // the barrel lifts off and climbs out of the top
  const fly = Math.max(0, frame - liftAt);
  const by = DERRICK.y - 170 - Math.round(0.035 * fly * fly + fly);
  const n = Math.min(3, Math.floor((frame - count) / fps));
  const digit = 3 - n;
  const local = (frame - count) % fps;
  const pressure = Math.min(1, Math.max(0, (frame - count) / (3 * fps)));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, scale: String(zoom), transformOrigin: `${DERRICK.x}px ${DERRICK.y}px`, translate: `${shake}px 0` }}>
        <Bands colors={[C.stormShade, C.stormSky, C.storm]} heights={[220, 180, 200]} />
        <Stars frame={frame} count={70} h={560} />
        <div style={{ position: "absolute", inset: 0, opacity: dawn }}>
          <Sunburst cy={0.5} turn={0.2} />
        </div>
        <div style={{ position: "absolute", inset: 0, filter: `brightness(${interpolate(dawn, [0, 1], [0.48, 1])}) saturate(${interpolate(dawn, [0, 1], [0.7, 1])})` }}>
          <SeaScene frame={frame} />
        </div>
        {/* the crown barrel waits on the derrick, then rides its flame up */}
        {by > -400 && (
          <div style={{ position: "absolute", left: DERRICK.x - 80, top: by }}>
            {frame > liftAt - 30 && (
              <Spr
                rows={Math.floor(frame / 4) % 2 ? flameB : flameA}
                palette={flamePalette}
                scale={10}
                x={35}
                y={158}
                style={{ scale: `1 -${interpolate(frame, [liftAt - 30, liftAt], [0.4, 1.3], { extrapolateRight: "clamp" })}`, transformOrigin: "50% 0", translate: "0 110px" }}
              />
            )}
            <Spr rows={crownBarrel} scale={10} />
          </div>
        )}
        {frame > liftAt && <Embers frame={frame} count={30} area={{ x: DERRICK.x - 160, y: DERRICK.y - 260, w: 320, h: 300 }} colors={[C.steelLight, C.white, C.steel]} size={12} seed="smoke" />}
      </div>

      {/* the countdown, read off a pressure gauge */}
      {frame >= count && frame < liftAt + 20 && (
        <div style={{ position: "absolute", left: 150, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: 1 - ramp(frame, liftAt, 20) }}>
          <div style={{ boxShadow: ring(0), scale: String(spring({ frame: frame - count, fps, config: { damping: 12 } })) }}>
            <Gauge t={pressure} scale={20} />
          </div>
          <Chip bg={pressure > 0.8 ? C.red : C.white} color={pressure > 0.8 ? C.white : C.ink} size={38}>
            Pressure {Math.round(pressure * 100)}%
          </Chip>
        </div>
      )}
      {frame >= count && frame < liftAt && (
        <div style={{ position: "absolute", right: 210, top: 140, scale: String(interpolate(local, [0, 10, fps], [2.2, 1, 0.9], { extrapolateRight: "clamp" })), opacity: interpolate(local, [0, 4, fps - 4, fps], [0, 1, 1, 0]) }}>
          <Title size={360} color={digit === 1 ? C.red : C.white}>
            {digit}
          </Title>
        </div>
      )}
      {frame < count + 12 && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 110, opacity: 1 - ramp(frame, count - 6, 18) }}>
          <Title size={96} color={C.sun}>
            $ROYAL
          </Title>
          <Title size={54} family={font.display} style={{ marginTop: 18 }}>
            Pressure is building on the rig
          </Title>
        </AbsoluteFill>
      )}
      {frame >= liftAt && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 120 }}>
          <Title size={130} style={{ scale: String(spring({ frame: frame - liftAt, fps, config: { damping: 8, stiffness: 160 } })) }}>
            Liftoff soon
          </Title>
        </AbsoluteFill>
      )}
      <Burst frame={frame} start={liftAt} x={DERRICK.x - 30} y={DERRICK.y - 120} rows={icons.coin} scale={5} count={18} speed={17} seed="lift" />
    </AbsoluteFill>
  );
}

function SoonCard({ frame, fps, at }: { frame: number; fps: number; at: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 150 } });
  const winIn = s(36);
  return (
    <AbsoluteFill>
      <Sunburst cx={0.3} cy={0.45} turn={0.12} />
      <Embers frame={frame} count={30} colors={[C.white, C.sunPale]} size={8} seed="soon" />
      <div style={{ position: "absolute", left: 120, top: 210, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34, scale: String(s(0)), transformOrigin: "0 50%" }}>
          <Spr rows={crownBarrel} scale={10} style={{ translate: `0 ${snap(Math.sin(frame / 14) * 10, 5)}px` }} />
          <Title size={150} color={C.white}>
            $ROYAL
          </Title>
        </div>
        <Chip bg={C.red} color={C.white} size={76} style={{ scale: String(s(10)), transformOrigin: "0 50%" }}>
          <span style={{ fontFamily: font.logo }}>Launching soon</span>
        </Chip>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 20 }}>
          {["Fair launch on Robinhood Chain", "No presale, no private round", "Burned for rig class upgrades"].map((t, i) => (
            <Chip key={t} size={40} style={{ scale: String(s(20 + i * 8)), transformOrigin: "0 50%" }}>
              <Spr rows={i === 2 ? flameA : icons.coin} palette={i === 2 ? flamePalette : base} scale={3} />
              {t}
            </Chip>
          ))}
        </div>
      </div>

      {/* the whitelist, live, on the right */}
      <Window width={680} height={383} url="barrelroyale.io/whitelist" style={{ left: 1150, top: 410, scale: String(winIn), rotate: "2deg" }}>
        <Sequence from={at + 36} layout="none">
          <OffthreadVideo src={staticFile("footage/whitelist.mp4")} muted playbackRate={1.2} style={{ width: 680, height: 383, display: "block" }} />
        </Sequence>
      </Window>
      <div style={{ position: "absolute", left: 1150, top: 900, width: 680, display: "flex", justifyContent: "center", gap: 24, scale: String(s(50)) }}>
        <Chip bg={C.sun} size={36}>
          Join the whitelist
        </Chip>
        <Chip size={36}>
          <Spr rows={xMark} scale={3} />
          @barrelroyale
        </Chip>
      </div>
      <Spr rows={logo} palette={logoPalette} scale={3} x={1786} y={30} style={{ boxShadow: ring(4) }} />
    </AbsoluteFill>
  );
}
