import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BLOWOUT_AT, CHOKES } from "@/lib/game/content";
import { base, crownBarrel, flameA, flamePalette, icons, roughneck, valve } from "@/components/pixel/sprites";
import { Bands, Burst, C, Chip, Embers, font, PixelWipe, SeaScene, Spr, Sunburst, Title, Window, ramp, ring, snap, wiped } from "./brand";
import marks from "../public/footage/play.json";

// 7 · Overdrive. The greedy setting: the choke goes to Overdrive, pressure
// climbs, the well blows out, and the capping drill shuts it in. Filmed on
// barrelroyale.io/play, cut hard with a gauge, flashes and a shake.

const M = marks.marks;

export const OVERDRIVE_SECONDS = 15;

const WIN = { x: 160, y: 170, w: 1600, h: 900 };
const BASE = WIN.w / 1920;

// the cut, in frames at 60 fps
const INTRO = 110;
const CLIPS = [
  { from: M.manage + 0.1, to: M.overdrive + 0.2, rate: 1.2 },
  { from: M.overdrive + 0.2, to: M.blowout, rate: 5 },
  { from: M.blowout, to: M.capped + 0.9, rate: 1.3 },
];
const LENS = CLIPS.map((c) => Math.round(((c.to - c.from) / c.rate) * 60));
const STARTS = LENS.map((_, i) => INTRO + LENS.slice(0, i).reduce((a, b) => a + b, 0));
const BLOW = STARTS[2];
const CAPPED = STARTS[2] + Math.round(((M.capped - M.blowout) / 1.3) * 60);
const END = STARTS[2] + LENS[2];

export function Overdrive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame < INTRO + 4 && <Intro frame={frame} fps={fps} />}
      {frame >= INTRO - 20 && !wiped(frame, END) && <Play frame={frame} fps={fps} />}
      {wiped(frame, END) && <Outro frame={frame - (END + 22)} fps={fps} />}
      <PixelWipe frame={frame} start={INTRO - 22} color={C.red} />
      <PixelWipe frame={frame} start={END} color={C.sun} />
      {/* the blowout flash */}
      {frame >= BLOW && frame < BLOW + 14 && <AbsoluteFill style={{ background: C.white, opacity: 1 - (frame - BLOW) / 14, zIndex: 90 }} />}
    </AbsoluteFill>
  );
}

function Intro({ frame, fps }: { frame: number; fps: number }) {
  const slam = spring({ frame: frame - 6, fps, config: { damping: 7, stiffness: 240 } });
  const shake = frame > 10 && frame < 40 ? snap(Math.sin(frame * 2.3) * 10, 2) : 0;
  return (
    <AbsoluteFill style={{ translate: `${shake}px ${-shake / 2}px` }}>
      <Bands colors={[C.redDeep, "#a32b25", C.red]} heights={[360, 360, 360]} />
      <Embers frame={frame} count={40} colors={[C.flameCore, C.flame, C.white]} size={10} seed="od" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title size={200} style={{ scale: String(interpolate(slam, [0, 1], [3, 1])), opacity: Math.min(1, slam * 2) }}>
          Overdrive
        </Title>
        <Chip bg={C.ink} color={C.sun} size={54} style={{ scale: String(spring({ frame: frame - 26, fps, config: { damping: 10 } })) }}>
          {CHOKES.overdrive.output}× output. Mind the pressure.
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** The camera over the footage, by frame. */
function camera(frame: number) {
  const keys = [
    { t: INTRO, x: 1500, y: 320, z: 1.5 },
    { t: INTRO + 50, x: 1600, y: 300, z: 1.85 },
    { t: BLOW - 10, x: 1600, y: 300, z: 1.95 },
    { t: BLOW + 10, x: 1600, y: 320, z: 2.2 },
    { t: BLOW + 70, x: 1560, y: 340, z: 1.7 },
    { t: END, x: 1400, y: 420, z: 1.45 },
  ];
  const t = Math.max(keys[0].t, Math.min(frame, keys[keys.length - 1].t));
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t <= b.t) {
      const p = Easing.bezier(0.65, 0, 0.35, 1)((t - a.t) / Math.max(1, b.t - a.t));
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p };
    }
  }
  return keys[keys.length - 1];
}

function Play({ frame, fps }: { frame: number; fps: number }) {
  const cam = camera(frame);
  const scale = BASE * cam.z;
  const left = Math.min(0, Math.max(WIN.w - 1920 * scale, WIN.w / 2 - cam.x * scale));
  const top = Math.min(0, Math.max(WIN.h - 1080 * scale, WIN.h / 2 - cam.y * scale));
  const shake = frame >= BLOW && frame < BLOW + 50 ? snap(Math.sin(frame * 2.1) * (12 - (frame - BLOW) / 5), 2) : 0;
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 9, stiffness: 200 } });

  // the pressure bar: normal, then the long climb, pinned at the top through the blowout
  const pressure =
    frame < STARTS[1] ? interpolate(frame, [INTRO, STARTS[1]], [58, 64]) : frame < BLOW ? interpolate(frame, [STARTS[1], BLOW], [64, BLOWOUT_AT], { easing: Easing.in(Easing.quad) }) : frame < CAPPED ? BLOWOUT_AT : interpolate(frame, [CAPPED, CAPPED + 30], [BLOWOUT_AT, 0], { extrapolateRight: "clamp" });
  const hot = pressure > 85;
  const label = frame < STARTS[1] ? "Normal" : frame < BLOW ? "Overdrive" : frame < CAPPED ? "Blowout" : "Capped";

  return (
    <AbsoluteFill style={{ translate: `${shake}px ${shake / 2}px` }}>
      <Bands colors={[C.stormShade, C.storm, C.stormSky]} heights={[360, 360, 360]} />
      {frame >= BLOW && frame < CAPPED && <Embers frame={frame} count={40} colors={[C.flameCore, C.flame, C.flameEdge]} size={10} seed="blow" />}
      <Window width={WIN.w} height={WIN.h} url="barrelroyale.io/play" style={{ left: WIN.x, top: WIN.y - 64 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", translate: `${left}px ${top}px`, scale: String(scale) }}>
          {CLIPS.map((c, i) => (
            <Sequence key={i} from={STARTS[i]} durationInFrames={i === CLIPS.length - 1 ? 9999 : LENS[i]} layout="none">
              <OffthreadVideo src={staticFile("footage/play.mp4")} muted trimBefore={Math.round(c.from * fps)} playbackRate={c.rate} style={{ width: 1920, height: 1080, display: "block", position: "absolute" }} />
            </Sequence>
          ))}
        </div>
        {frame >= STARTS[1] && frame < BLOW && (
          <div style={{ position: "absolute", left: 24, top: 24 }}>
            <Chip bg={C.ink} color={C.sun} size={30}>
              ▶▶ 5×
            </Chip>
          </div>
        )}
      </Window>

      {/* the choke, then the pressure, top left */}
      <div style={{ position: "absolute", left: WIN.x, top: 30, display: "flex", alignItems: "center", gap: 26 }}>
        <Chip bg={label === "Normal" ? C.sun : label === "Capped" ? C.leaf : C.red} color={label === "Normal" ? C.ink : C.white} size={40}>
          <span style={{ fontFamily: font.logo }}>{label}</span>
        </Chip>
        <div style={{ width: 640, height: 44, background: C.white, boxShadow: ring(5), position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, pressure)}%`, background: hot ? C.red : C.sunDeep }} />
          <div style={{ position: "absolute", left: "85%", top: -8, bottom: -8, width: 5, background: C.ink }} />
        </div>
      </div>

      {/* stickers */}
      {frame >= STARTS[1] + 10 && frame < BLOW && (
        <div style={{ position: "absolute", left: WIN.x + 40, top: 760, scale: String(s(STARTS[1] + 10)), transformOrigin: "0 50%", zIndex: 30 }}>
          <Chip bg={C.red} color={C.white} size={44}>
            <Spr rows={flameA} palette={flamePalette} scale={3} />
            Pumping {CHOKES.overdrive.output}× faster
          </Chip>
        </div>
      )}
      {frame >= BLOW && frame < CAPPED + 10 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", zIndex: 40 }}>
          <div style={{ scale: String(interpolate(s(BLOW), [0, 1], [2.6, 1])), rotate: "-6deg" }}>
            <Title size={170} color={C.red}>
              Blowout!
            </Title>
          </div>
        </div>
      )}
      {frame >= BLOW + 60 && frame < CAPPED && (
        <div style={{ position: "absolute", left: WIN.x + 40, top: 730, scale: String(s(BLOW + 60)), transformOrigin: "0 50%", zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, background: C.white, padding: "16px 24px", boxShadow: ring(6) }}>
            <Spr rows={valve} scale={6} />
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, color: C.ink, lineHeight: 1.2 }}>
              Capping drill: close the valves in order
            </span>
          </div>
        </div>
      )}
      {frame >= CAPPED && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", zIndex: 40 }}>
          <div style={{ scale: String(interpolate(s(CAPPED), [0, 1], [2.2, 1])), rotate: "4deg" }}>
            <Chip bg={C.leaf} color={C.white} size={96}>
              <span style={{ fontFamily: font.logo }}>Capped</span>
            </Chip>
          </div>
        </div>
      )}
      <Burst frame={frame} start={CAPPED} x={960} y={480} rows={icons.coin} scale={5} count={18} speed={17} seed="cap" />
    </AbsoluteFill>
  );
}

function Outro({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <Sunburst cy={0.62} turn={0.16} />
      <SeaScene frame={frame} y={560} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90, gap: 26 }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center", scale: String(s(0)) }}>
          <Spr rows={crownBarrel} scale={6} />
          <Title size={104}>Greedy or steady?</Title>
        </div>
        <div style={{ display: "flex", gap: 24, scale: String(s(10)) }}>
          {(["safe", "normal", "overdrive"] as const).map((c) => (
            <Chip key={c} size={40} bg={c === "overdrive" ? C.red : c === "normal" ? C.sun : C.white} color={c === "overdrive" ? C.white : C.ink}>
              {CHOKES[c].label} {CHOKES[c].output.toFixed(1)}×
            </Chip>
          ))}
        </div>
        <Chip size={50} bg={C.ink} color={C.sun} style={{ scale: String(s(20)) }}>
          Your rig, your call · barrelroyale.io/play
        </Chip>
      </AbsoluteFill>
      <Spr rows={roughneck} palette={base} scale={6} x={snap(interpolate(frame, [0, 200], [300, 1500]), 6)} y={980 - (Math.floor(frame / 8) % 2) * 6} />
    </AbsoluteFill>
  );
}
