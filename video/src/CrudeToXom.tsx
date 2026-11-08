import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PRODUCTS, UNITS, type Product } from "@/lib/game/content";
import { barrel, base, crate, crownBarrel, icons, roughneck } from "@/components/pixel/sprites";
import { Bands, Burst, C, Chip, Embers, font, PixelWipe, SeaScene, Spr, Sunburst, Title, Window, ramp, ring, snap, wiped } from "./brand";
import marks from "../public/footage/play.json";

// 8 · Crude to XOM. The value chain in one go: raw barrels become refined
// ones, the refinery runs in the real game, the export terminal pays in XOM,
// and the reward vault pays out to wallets every week.

const M = marks.marks;

export const CRUDE_TO_XOM_SECONDS = 16;

const barrelOf = (p: Product) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });
const WIN = { x: 160, y: 170, w: 1600, h: 900 };
const BASE = WIN.w / 1920;

type Cam = { t: number; x: number; y: number; z: number };
const SCENES = [
  { title: "Refine it", start: 170, end: 430, clip: { from: M.refinery - 0.2, to: M["walk-dispatch"], rate: 1.2 }, cams: [{ t: 0, x: 1200, y: 500, z: 1.3 }, { t: 50, x: 1580, y: 320, z: 1.8 }, { t: 260, x: 1580, y: 320, z: 1.9 }] },
  { title: "Export it", start: 430, end: 720, clip: { from: M.sold + 1.2, to: M["walk-unit"], rate: 0.85 }, cams: [{ t: 0, x: 1680, y: 420, z: 1.5 }, { t: 110, x: 1700, y: 380, z: 1.75 }, { t: 165, x: 1150, y: 200, z: 1.7 }, { t: 290, x: 1150, y: 210, z: 1.8 }] },
];
const VAULT_AT = 700;

const CHAIN: { from: Product; to: Product[]; unit: keyof typeof UNITS }[] = [
  { from: "light", to: ["diesel", "jet"], unit: "distillation" },
  { from: "heavy", to: ["diesel"], unit: "cracker" },
  { from: "gas", to: ["lng"], unit: "liquefier" },
];

export function CrudeToXom() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = SCENES.findIndex((s) => frame >= s.start && frame < s.end);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame < 172 && <Chain frame={frame} fps={fps} />}
      {frame >= 170 && !wiped(frame, VAULT_AT) && (
        <>
          <Bands colors={[C.stormShade, C.storm, C.stormSky]} heights={[360, 360, 360]} />
          {scene >= 0 && <Footage frame={frame} fps={fps} i={scene} />}
        </>
      )}
      {wiped(frame, VAULT_AT) && <Vault frame={frame - (VAULT_AT + 22)} fps={fps} />}
      <PixelWipe frame={frame} start={148} color={C.ink} />
      <PixelWipe frame={frame} start={VAULT_AT} color={C.sun} />
    </AbsoluteFill>
  );
}

function Chain({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Sunburst cy={0.6} turn={0.14} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 60 }}>
        <Title size={124} style={{ scale: String(s(0)) }}>
          Crude to <span style={{ color: C.red }}>XOM</span>
        </Title>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
        {CHAIN.map((r, i) => {
          const at = 14 + i * 14;
          const flow = ramp(frame, at + 16, 30);
          return (
            <div key={r.from} style={{ display: "flex", alignItems: "center", gap: 30, scale: String(s(at)), transformOrigin: "0 50%" }}>
              <Chip size={46} style={{ width: 420 }}>
                <Spr rows={barrel} palette={barrelOf(r.from)} scale={5} />
                {PRODUCTS[r.from].name}
              </Chip>
              {/* the pipe, filling */}
              <div style={{ width: 300, height: 26, background: C.white, boxShadow: ring(5), position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: `${flow * 100}%`, background: PRODUCTS[r.to[0]].color }} />
                <span style={{ position: "absolute", left: 0, right: 0, top: -54, textAlign: "center", fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.ink }}>{UNITS[r.unit].name}</span>
              </div>
              {r.to.map((p) => (
                <Chip key={p} size={46} bg={flow >= 1 ? C.sun : C.white} style={{ scale: String(spring({ frame: frame - (at + 46), fps, config: { damping: 8, stiffness: 220 } })) }}>
                  <Spr rows={barrel} palette={barrelOf(p)} scale={5} />
                  {PRODUCTS[p].name}
                </Chip>
              ))}
            </div>
          );
        })}
      </div>
      </div>
      <Spr rows={roughneck} palette={base} scale={7} x={1680} y={860 - snap(Math.abs(Math.sin(frame / 9)) * 21, 7)} />
    </AbsoluteFill>
  );
}

function camAt(cams: Cam[], t: number) {
  if (t <= cams[0].t) return cams[0];
  for (let i = 1; i < cams.length; i++) {
    const a = cams[i - 1];
    const b = cams[i];
    if (t <= b.t) {
      const p = Easing.bezier(0.65, 0, 0.35, 1)((t - a.t) / Math.max(1, b.t - a.t));
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p };
    }
  }
  return cams[cams.length - 1];
}

function Footage({ frame, fps, i }: { frame: number; fps: number; i: number }) {
  const sc = SCENES[i];
  const t = frame - sc.start;
  const cam = camAt(sc.cams, t);
  const scale = BASE * cam.z;
  const left = Math.min(0, Math.max(WIN.w - 1920 * scale, WIN.w / 2 - cam.x * scale));
  const top = Math.min(0, Math.max(WIN.h - 1080 * scale, WIN.h / 2 - cam.y * scale));
  const s = (d: number) => spring({ frame: t - d, fps, config: { damping: 9, stiffness: 190 } });
  // a quick punch-in on each cut
  const punch = interpolate(t, [0, 10], [1.06, 1], { extrapolateRight: "clamp" });
  return (
    <>
      <Window width={WIN.w} height={WIN.h} url="barrelroyale.io/play" style={{ left: WIN.x, top: WIN.y - 64, scale: String(punch) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", translate: `${left}px ${top}px`, scale: String(scale) }}>
          <Sequence from={sc.start} durationInFrames={sc.end - sc.start} layout="none">
            <OffthreadVideo src={staticFile("footage/play.mp4")} muted trimBefore={Math.round(sc.clip.from * fps)} playbackRate={sc.clip.rate} style={{ width: 1920, height: 1080, display: "block", position: "absolute" }} />
          </Sequence>
        </div>
      </Window>
      <div style={{ position: "absolute", left: WIN.x, top: 24, scale: String(s(0)), transformOrigin: "0 50%" }}>
        <Title size={70} family={font.display}>
          <span style={{ color: C.sun }}>{i + 1}</span> · {sc.title}
        </Title>
      </div>
      {i === 0 && t > 60 && (
        <div style={{ position: "absolute", left: WIN.x + 40, top: 800, scale: String(s(60)), transformOrigin: "0 50%", rotate: "-1deg", zIndex: 30 }}>
          <Chip size={44}>
            <Spr rows={barrel} palette={barrelOf("jet")} scale={5} />
            Light crude in, <span style={{ color: C.red }}>jet fuel</span> out
          </Chip>
        </div>
      )}
      {i === 1 && t > 40 && t < 160 && (
        <div style={{ position: "absolute", left: WIN.x + 40, top: 800, scale: String(s(40)), transformOrigin: "0 50%", rotate: "-1deg", zIndex: 30 }}>
          <Chip size={44}>
            <Spr rows={crate} scale={4} />
            Ship barrels at the export terminal
          </Chip>
        </div>
      )}
      {i === 1 && t >= 170 && (
        <div style={{ position: "absolute", left: WIN.x + 40, top: 780, scale: String(s(170)), transformOrigin: "0 50%", rotate: "-1deg", zIndex: 30 }}>
          <Chip size={54} bg={C.ink} color={C.sun}>
            <Spr rows={icons.coin} scale={5} />
            Paid in real XOM
          </Chip>
        </div>
      )}
      {i === 1 && <Burst frame={t} start={175} x={WIN.x + 220} y={760} rows={icons.coin} scale={5} count={14} speed={15} spread={1.6} seed="xom" />}
    </>
  );
}

function Vault({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 150 } });
  const pressed = frame >= 120 && frame < 128;
  return (
    <AbsoluteFill>
      <Sunburst cy={0.62} turn={0.16} />
      <SeaScene frame={frame} y={560} />
      <Embers frame={frame} count={26} colors={[C.white, C.sunPale]} size={8} seed="vault" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 80, gap: 26 }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center", scale: String(s(0)) }}>
          <Spr rows={crownBarrel} scale={6} />
          <Title size={84}>Pump crude. Earn Exxon.</Title>
        </div>
        <Chip size={46} style={{ scale: String(s(10)) }}>
          <Spr rows={icons.coin} scale={4} />
          The treasury fills the XOM reward vault
        </Chip>
        <div style={{ marginTop: 10, padding: "20px 46px", background: C.red, color: C.white, boxShadow: ring(7), fontFamily: font.logo, fontWeight: 700, fontSize: 56, scale: String(s(24)), translate: pressed ? "0 6px" : undefined }}>
          Claim XOM weekly
        </div>
      </AbsoluteFill>
      <Burst frame={frame} start={124} x={960} y={420} rows={icons.coin} scale={6} count={20} speed={18} seed="claimx" />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", opacity: ramp(frame, 40, 20) }}>
        <Chip size={40} bg={C.sun}>
          barrelroyale.io/play
        </Chip>
      </div>
    </AbsoluteFill>
  );
}
