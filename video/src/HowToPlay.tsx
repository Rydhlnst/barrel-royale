import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAP_COST, CHOKES, EXPORT_BBL, EXPORT_DAILY_BBL, EXPORT_USD, PRODUCTS, UNITS, WELLS, type Product, type Raw } from "@/lib/game/content";
import { barrel, base, crownBarrel, drop, icons, logo, logoPalette, roughneck, roughneckHead, valve } from "@/components/pixel/sprites";
import { Burst, C, Chip, Embers, font, PixelWipe, SeaScene, Spr, Sunburst, Title, Window, ramp, ring, snap, wiped } from "./brand";
import marks from "../public/footage/play.json";

// 5 · How to Play. A game manual: seven stages down the left, the real game
// (filmed on barrelroyale.io/play) in a window, the camera pushing in on what
// matters, and stickers with the numbers. Every number comes from the game's
// own content file, so the video and the game agree.

const M = marks.marks;
const n = (v: number) => v.toLocaleString("en-US");
const barrelOf = (p: Product) => ({ ...base, R: PRODUCTS[p].color, r: C.ink, W: PRODUCTS[p].shine });

// window geometry: the 1920 × 1080 footage drawn at 1480 px wide
const WIN = { x: 392, y: 172, w: 1480, h: 833 };
const BASE = WIN.w / 1920;

type Cam = { t: number; x: number; y: number; z: number };
type Clip = { from: number; to: number; rate: number };

/** Stages, in frames at 60 fps. Clips are cut from the recording by its marks. */
const STAGES: { title: string; start: number; end: number; clips: Clip[]; cams: Cam[] }[] = [
  { title: "Walk the deck", start: 170, end: 400, clips: [{ from: M.deck, to: M["open-pad"] - 0.05, rate: 1 }], cams: [{ t: 0, x: 980, y: 560, z: 1.0 }, { t: 200, x: 980, y: 520, z: 1.35 }] },
  { title: "Drill a well", start: 400, end: 640, clips: [{ from: M["open-pad"] - 0.05, to: M["walk-well"] - 0.4, rate: 1.15 }], cams: [{ t: 0, x: 1100, y: 420, z: 1.2 }, { t: 60, x: 1560, y: 330, z: 1.75 }] },
  {
    title: "Mind the pressure",
    start: 640,
    end: 1200,
    clips: [
      { from: M.manage + 0.1, to: M.overdrive + 0.2, rate: 1.2 },
      { from: M.overdrive + 0.2, to: M.blowout, rate: 5 },
      { from: M.blowout, to: M.capped + 0.9, rate: 1.3 },
    ],
    cams: [{ t: 0, x: 1500, y: 300, z: 1.5 }, { t: 60, x: 1600, y: 300, z: 1.8 }, { t: 470, x: 1600, y: 330, z: 1.8 }, { t: 560, x: 1300, y: 420, z: 1.3 }],
  },
  { title: "Refine", start: 1200, end: 1500, clips: [{ from: M.refinery - 0.2, to: M["walk-dispatch"], rate: 1.2 }], cams: [{ t: 0, x: 1200, y: 500, z: 1.3 }, { t: 50, x: 1580, y: 320, z: 1.75 }] },
  {
    title: "Sell or fill contracts",
    start: 1500,
    end: 1910,
    clips: [
      { from: M.market - 0.2, to: M.sold + 1.0, rate: 1.5 },
      { from: M.dispatch - 0.3, to: M.filled + 1.6, rate: 1.4 },
    ],
    cams: [{ t: 0, x: 1650, y: 420, z: 1.5 }, { t: 185, x: 1660, y: 520, z: 1.5 }, { t: 200, x: 1580, y: 250, z: 1.7 }, { t: 410, x: 1560, y: 250, z: 1.75 }],
  },
  { title: "Export for XOM", start: 1910, end: 2240, clips: [{ from: M.sold + 1.2, to: M["walk-unit"], rate: 0.85 }], cams: [{ t: 0, x: 1680, y: 420, z: 1.5 }, { t: 110, x: 1700, y: 380, z: 1.7 }, { t: 165, x: 1150, y: 200, z: 1.6 }, { t: 330, x: 1150, y: 210, z: 1.65 }] },
  { title: "Claim weekly", start: 2240, end: 2480, clips: [], cams: [] },
];

export const HOW_TO_PLAY_SECONDS = 45;

export function HowToPlay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outroAt = 2470;
  const stage = STAGES.findIndex((s) => frame >= s.start && frame < s.end);
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      {frame < 170 && <Intro frame={frame} fps={fps} />}
      {frame >= 148 && !wiped(frame, outroAt) && (
        <>
          <Sunburst cx={0.6} cy={0.55} turn={0.05} />
          <StageList frame={frame} stage={stage} />
          {stage >= 0 && stage < 6 && <StageWindow frame={frame} fps={fps} stage={stage} />}
          {stage === 6 && <Claim frame={frame - STAGES[6].start} fps={fps} />}
          <Callouts frame={frame} fps={fps} />
        </>
      )}
      {wiped(frame, outroAt) && <Outro frame={frame - (outroAt + 22)} fps={fps} />}
      <PixelWipe frame={frame} start={148} color={C.ink} />
      <PixelWipe frame={frame} start={outroAt} color={C.red} />
    </AbsoluteFill>
  );
}

function Intro({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <Sunburst cy={0.62} turn={0.12} />
      <SeaScene frame={frame} y={560} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 110, gap: 26 }}>
        <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6), scale: String(s(0)) }} />
        <Title size={150} style={{ scale: String(s(8)) }}>
          How to play
        </Title>
        <Chip size={44} style={{ scale: String(s(18)) }}>
          Seven steps from the wellhead to your wallet
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function StageList({ frame, stage }: { frame: number; stage: number }) {
  return (
    <div style={{ position: "absolute", left: 36, top: 172, width: 316, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: 1, marginBottom: 4 }}>Stages</div>
      {STAGES.map((s, i) => {
        const on = i === stage;
        const done = i < stage;
        return (
          <div
            key={s.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              background: on ? C.red : done ? C.sunPale : C.white,
              color: on ? C.white : C.ink,
              boxShadow: ring(5),
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: 27,
              translate: on ? `${snap(Math.sin(frame / 10) * 4 + 12, 2)}px 0` : undefined,
            }}
          >
            <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, background: on ? C.white : done ? C.leaf : C.ink, color: on ? C.red : C.white, fontFamily: font.logo, fontSize: 24, flexShrink: 0 }}>{done ? "✓" : i + 1}</span>
            <span style={{ lineHeight: 1.05 }}>{s.title}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Camera over the footage: eased between keyframes, kept inside the frame. */
function camAt(cams: Cam[], t: number) {
  if (!cams.length) return { x: 960, y: 540, z: 1 };
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

function StageWindow({ frame, fps, stage }: { frame: number; fps: number; stage: number }) {
  const s = STAGES[stage];
  const t = frame - s.start;
  const cam = camAt(s.cams, t);
  const scale = BASE * cam.z;
  const left = Math.min(0, Math.max(WIN.w - 1920 * scale, WIN.w / 2 - cam.x * scale));
  const top = Math.min(0, Math.max(WIN.h - 1080 * scale, WIN.h / 2 - cam.y * scale));
  const winIn = spring({ frame: frame - 170, fps, config: { damping: 13, stiffness: 140 } });
  let at = 0;
  return (
    <>
      <Window width={WIN.w} height={WIN.h} url="barrelroyale.io/play" style={{ left: WIN.x, top: WIN.y - 64, scale: String(winIn) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", translate: `${left}px ${top}px`, scale: String(scale) }}>
          {s.clips.map((c, i) => {
            const len = Math.round(((c.to - c.from) / c.rate) * fps);
            const from = at;
            at += len;
            return (
              <Sequence key={i} from={s.start + from} durationInFrames={i === s.clips.length - 1 ? s.end - s.start - from : len} layout="none">
                <OffthreadVideo src={staticFile("footage/play.mp4")} muted trimBefore={Math.round(c.from * fps)} playbackRate={c.rate} style={{ width: 1920, height: 1080, display: "block", position: "absolute" }} />
              </Sequence>
            );
          })}
        </div>
        {/* fast-forward badge while the pressure climbs */}
        {stage === 2 && frame - s.start > 150 && frame - s.start < 290 && (
          <div style={{ position: "absolute", left: 24, top: 24 }}>
            <Chip bg={C.ink} color={C.sun} size={30}>
              ▶▶ 5×
            </Chip>
          </div>
        )}
      </Window>
      <div key={stage} style={{ position: "absolute", left: WIN.x, top: 22, scale: String(spring({ frame: t, fps, config: { damping: 11, stiffness: 170 } })), transformOrigin: "0 50%" }}>
        <Title size={64} family={font.display}>
          <span style={{ color: C.red }}>Stage {stage + 1}</span> · {s.title}
        </Title>
      </div>
    </>
  );
}

/** A sticker: pops in at `at` (frames into the video) and stays until `until`. */
function Sticker({ frame, fps, at, until, x, y, children, tilt = 0 }: { frame: number; fps: number; at: number; until: number; x: number; y: number; children: React.ReactNode; tilt?: number }) {
  if (frame < at || frame >= until) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 190 } });
  const out = ramp(frame, until - 10, 10);
  return <div style={{ position: "absolute", left: x, top: y, scale: String(s * (1 - out)), rotate: `${tilt}deg`, transformOrigin: "0 50%", zIndex: 30 }}>{children}</div>;
}

function Key({ k }: { k: string }) {
  return <span style={{ display: "inline-grid", placeItems: "center", minWidth: 58, height: 58, padding: "0 10px", background: C.white, color: C.ink, boxShadow: `${ring(5)}`, fontFamily: font.logo, fontWeight: 700, fontSize: 30 }}>{k}</span>;
}

function Callouts({ frame, fps }: { frame: number; fps: number }) {
  const raws: Raw[] = ["light", "gas", "heavy"];
  const x = WIN.x + 34;
  const S = STAGES;
  return (
    <>
      {/* 1 · walking */}
      <Sticker frame={frame} fps={fps} at={S[0].start + 40} until={S[0].end} x={x} y={760}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, background: C.sunPale, padding: "18px 24px", boxShadow: ring(6) }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 58px)", gap: 10 }}>
            <span />
            <Key k="W" />
            <span />
            <Key k="A" />
            <Key k="S" />
            <Key k="D" />
          </div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.ink, lineHeight: 1.3 }}>
            Walk with WASD or arrows
            <br />
            <Key k="E" /> use &nbsp; <Key k="F" /> manage
          </div>
        </div>
      </Sticker>

      {/* 2 · the three wells */}
      {raws.map((p, i) => (
        <Sticker key={p} frame={frame} fps={fps} at={S[1].start + 70 + i * 10} until={S[1].end} x={x} y={560 + i * 128} tilt={-1}>
          <Chip size={40}>
            <Spr rows={barrel} palette={barrelOf(p)} scale={5} />
            {PRODUCTS[p].name}
            <span style={{ color: C.red }}>{WELLS[p].cost} coins</span>
          </Chip>
        </Sticker>
      ))}

      {/* 3 · the choke and the blowout */}
      {(["safe", "normal", "overdrive"] as const).map((c, i) => (
        <Sticker key={c} frame={frame} fps={fps} at={S[2].start + 40 + i * 10} until={S[2].start + 330} x={x} y={560 + i * 128}>
          <Chip size={42} bg={c === "overdrive" ? C.red : c === "normal" ? C.sun : C.white} color={c === "overdrive" ? C.white : C.ink}>
            {CHOKES[c].label} · {CHOKES[c].output.toFixed(1)}× output
          </Chip>
        </Sticker>
      ))}
      <Sticker frame={frame} fps={fps} at={S[2].start + 335} until={S[2].end} x={x} y={600}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, background: C.white, padding: "20px 26px", boxShadow: ring(6) }}>
          <Spr rows={valve} scale={7} />
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.ink, lineHeight: 1.25 }}>
            <span style={{ color: C.red }}>Blowout?</span> Run the capping drill:
            <br />
            close the valves in order, free.
            <br />
            <span style={{ fontSize: 28, color: C.ink2 }}>Or cap it for {CAP_COST} coins.</span>
          </div>
        </div>
      </Sticker>

      {/* 4 · the refinery */}
      {[
        { unit: "distillation", text: `Light crude → diesel or jet fuel`, p: "jet" as Product },
        { unit: "cracker", text: "Heavy crude → diesel", p: "diesel" as Product },
        { unit: "liquefier", text: "Natural gas → LNG", p: "lng" as Product },
      ].map((r, i) => (
        <Sticker key={r.unit} frame={frame} fps={fps} at={S[3].start + 50 + i * 12} until={S[3].end} x={x} y={560 + i * 128} tilt={-1}>
          <Chip size={38}>
            <Spr rows={barrel} palette={barrelOf(r.p)} scale={5} />
            <span style={{ color: C.red }}>{UNITS[r.unit as keyof typeof UNITS].name}</span> {r.text}
          </Chip>
        </Sticker>
      ))}

      {/* 5 · selling and contracts */}
      <Sticker frame={frame} fps={fps} at={S[4].start + 40} until={S[4].start + 198} x={x} y={820}>
        <Chip size={42} bg={C.sun}>
          <Spr rows={icons.coin} scale={4} />
          Sell at the market for coins
        </Chip>
      </Sticker>
      <Sticker frame={frame} fps={fps} at={S[4].start + 205} until={S[4].end} x={x} y={820}>
        <Chip size={42} bg={C.red} color={C.white}>
          Dispatch contracts pay 10–30% over base
        </Chip>
      </Sticker>

      {/* 6 · exporting */}
      <Sticker frame={frame} fps={fps} at={S[5].start + 120} until={S[5].end} x={x} y={600}>
        <div style={{ background: C.ink, padding: "22px 30px", boxShadow: ring(6, C.white), display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 54, color: C.sun, lineHeight: 1 }}>
            {EXPORT_BBL} bbl = ${EXPORT_USD} of XOM
          </div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 32, color: C.white }}>Up to {n(EXPORT_DAILY_BBL)} bbl per rig, every day</div>
        </div>
      </Sticker>
    </>
  );
}

/** Stage 7: a week of exports adds up, then the claim drops XOM into the wallet. */
function Claim({ frame, fps }: { frame: number; fps: number }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const claimAt = 7 * 12 + 40;
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 11, stiffness: 160 } });
  const pressed = frame >= claimAt && frame < claimAt + 8;
  return (
    <>
      <div style={{ position: "absolute", left: WIN.x, top: 22, scale: String(s(0)), transformOrigin: "0 50%" }}>
        <Title size={64} family={font.display}>
          <span style={{ color: C.red }}>Stage 7</span> · Claim weekly
        </Title>
      </div>
      <div style={{ position: "absolute", left: WIN.x, top: WIN.y - 64, width: WIN.w, height: WIN.h + 64, background: C.sunPale, boxShadow: ring(8, C.ink, "rgba(30,42,74,0.35)"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 50 }}>
        <div style={{ display: "flex", gap: 22 }}>
          {days.map((d, i) => {
            const fill = s(i * 12);
            return (
              <div key={d} style={{ width: 150, height: 190, background: C.white, boxShadow: ring(6), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.ink }}>{d}</span>
                <div style={{ display: "flex", gap: 4, scale: String(fill) }}>
                  <Spr rows={barrel} scale={4} />
                  <Spr rows={drop} scale={4} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <div style={{ padding: "22px 48px", background: C.red, color: C.white, boxShadow: ring(7), fontFamily: font.logo, fontWeight: 700, fontSize: 60, scale: String(s(claimAt - 20)), translate: pressed ? "0 6px" : undefined }}>Claim XOM</div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 46, color: C.ink, lineHeight: 1.2, opacity: ramp(frame, claimAt + 6, 14) }}>
            Every week, the XOM your
            <br />
            exports earned goes to your wallet
          </div>
        </div>
      </div>
      <Burst frame={frame} start={claimAt + 4} x={WIN.x + 300} y={700} rows={icons.coin} scale={6} count={12} speed={16} spread={1.6} seed="claim" />
    </>
  );
}

function Outro({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 150 } });
  const walk = snap(interpolate(frame, [0, 3.2 * fps], [200, 1600]), 6);
  return (
    <AbsoluteFill>
      <Sunburst cy={0.62} turn={0.16} />
      <SeaScene frame={frame} y={560} />
      <Embers frame={frame} count={26} colors={[C.white, C.sunPale]} size={8} seed="outro" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90, gap: 26 }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center", scale: String(s(0)) }}>
          <Spr rows={crownBarrel} scale={6} />
          <Title size={96}>Your rig is waiting</Title>
        </div>
        <Chip size={56} bg={C.red} color={C.white} style={{ scale: String(s(10)) }}>
          Play at barrelroyale.io/play
        </Chip>
        <Chip size={38} style={{ scale: String(s(20)) }}>
          <Spr rows={roughneckHead} scale={3} />
          Connect a wallet and hold $ROYAL to play
        </Chip>
      </AbsoluteFill>
      <Spr rows={roughneck} palette={base} scale={6} x={walk} y={980 - (Math.floor(frame / 8) % 2) * 6} />
    </AbsoluteFill>
  );
}
