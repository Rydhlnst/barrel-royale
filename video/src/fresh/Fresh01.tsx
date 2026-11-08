import { AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// The gusher-tanker combo, as an arcade move list: the "special move" card shows the inputs (catch a gusher,
// hold the barrels, sell to the tanker), then the real game plays each hit (footage/gusher.mp4 then
// footage/tanker.mp4, both light crude, shown whole so the HUD stays in view) while a combo meter beside the
// frame counts the hits. Fresh02 and Fresh03 reuse the frame and the end card from here.

export const FRESH01_SECONDS = 17;
export const s2f = (s: number) => Math.round(s * 60);

export const FRAME = { k: 0.72, x: 500, y: 150 };
export const FW = Math.round(1920 * FRAME.k);
export const FH = Math.round(1080 * FRAME.k);

/** Real footage, whole, scaled into the frame on the right. Shots are [start, footage from, length, rate?]. */
export function Framed({ src, shots, border = C.sun }: { src: string; shots: [number, number, number, number?][]; border?: string }) {
  return (
    <>
      <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FW + 12, height: FH + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${border}, 0 0 0 18px ${C.ink}` }} />
      <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
        {shots.map(([at, from, len, rate]) => (
          <Sequence key={`${src}${at}`} from={s2f(at)} durationInFrames={s2f(len)} layout="none">
            <OffthreadVideo src={staticFile(`footage/${src}.mp4`)} muted trimBefore={s2f(from)} playbackRate={rate ?? 1} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
          </Sequence>
        ))}
      </div>
    </>
  );
}

/** The closing card: sunburst, logo, roughneck, a two-line title (second line red) and the two links. */
export function EndCard({ start, top, bottom }: { start: number; top: string; bottom: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < s2f(start)) return null;
  const s = spring({ frame: frame - s2f(start), fps, config: { damping: 11, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: C.sun }}>
      <Sunburst turn={0.08} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(s) }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
          <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
          <Spr rows={roughneck} palette={base} scale={12} />
        </div>
        <Title size={104}>{top}</Title>
        <Title size={104} color={C.red}>
          {bottom}
        </Title>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <Chip bg={C.white} size={34}>
            <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
          </Chip>
          <Chip bg={C.ink} color={C.sun} size={34}>
            <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
          </Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

const MOVE = 3.6;
// hit 1: the gusher collected (+41 at footage 18.15); hit 2: the tanker filled (footage 12.63)
const G = { at: MOVE, len: 5.2, from: 15.2 };
const T = { at: MOVE + 5.2, len: 5.6, from: 9.8 };
const HIT1 = G.at + (18.25 - G.from);
const HIT2 = T.at + (12.7 - T.from);
const END = T.at + T.len;

/** An arcade input key. */
function Key({ label, lit }: { label: string; lit: boolean }) {
  return (
    <div style={{ minWidth: 70, height: 70, padding: "0 18px", display: "grid", placeItems: "center", background: lit ? C.sun : "#2b3a63", boxShadow: `${ring(5)}, inset 0 -8px 0 rgba(0,0,0,0.25)`, fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: lit ? C.ink : C.white }}>
      {label}
    </div>
  );
}

function MoveList({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame >= s2f(MOVE)) return null;
  const t = frame / fps;
  const card = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 170 } });
  const step = Math.floor((t - 0.9) / 0.45);
  const plus = { fontFamily: font.logo, fontSize: 40, color: C.white };
  return (
    <AbsoluteFill style={{ background: "#120b2a" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px)" }} />
      <div style={{ position: "absolute", left: 70, top: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sun, letterSpacing: 3 }}>Move list</span>
      </div>
      <div style={{ position: "absolute", left: 230, top: 210, width: 1460, padding: "50px 60px", background: "#1e2a4a", boxShadow: `${ring(8)}, 0 0 0 14px ${C.red}`, scale: String(card) }}>
        <Chip bg={C.red} color={C.white} size={26}>
          <span style={{ fontFamily: font.logo }}>Pro move</span>
        </Chip>
        <Title size={92} color={C.sun} style={{ marginTop: 26 }}>
          Gusher to tanker
        </Title>
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 22 }}>
          <Key label="Gusher" lit={step >= 0} />
          <span style={plus}>+</span>
          <Key label="Hold" lit={step >= 1} />
          <span style={plus}>+</span>
          <Key label="Tanker" lit={step >= 2} />
          <span style={plus}>=</span>
          <Key label="2x to 2.5x" lit={step >= 3} />
        </div>
        <div style={{ marginTop: 44, fontFamily: font.display, fontWeight: 700, fontSize: 34, color: C.sunPale }}>Catch the gusher. Hold the barrels. Sell them to the tanker.</div>
      </div>
    </AbsoluteFill>
  );
}

/** The combo meter beside the frame. */
function Combo({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  if (frame < s2f(MOVE) || frame >= s2f(END)) return null;
  const t = frame / fps;
  const hits = (t >= HIT1 ? 1 : 0) + (t >= HIT2 ? 1 : 0);
  const last = t >= HIT2 ? HIT2 : t >= HIT1 ? HIT1 : -9;
  const pop = spring({ frame: frame - s2f(last), fps, config: { damping: 7, stiffness: 280 } });
  const come = spring({ frame: frame - s2f(MOVE), fps, config: { damping: 13, stiffness: 180 } });
  const rows: [string, string, boolean][] = [
    ["Hit 1 · Gusher", "+41 bbl light crude", t >= HIT1],
    ["Hit 2 · Tanker", "190 bbl at 2.19x", t >= HIT2],
    ["Bonus", "+25% full order", t >= HIT2 + 0.5],
  ];
  return (
    <div style={{ position: "absolute", left: 40, top: 150, width: 420, translate: `${(1 - come) * -500}px 0` }}>
      <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.steelLight, letterSpacing: 3 }}>{t < T.at ? "Step 1: catch it" : "Step 2: sell it"}</div>
      <div style={{ marginTop: 10, scale: String(hits ? 1 + (1 - pop) * 0.4 : 1), transformOrigin: "0 60%" }}>
        <Title size={120} color={hits ? C.sun : "#4b5468"}>
          {hits}
        </Title>
        <Title size={44} color={hits ? C.red : "#4b5468"}>
          hit combo
        </Title>
      </div>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map(([k, v, on]) => (
          <div key={k} style={{ padding: "12px 16px", background: on ? C.white : "#2b3a63", boxShadow: ring(4), opacity: on ? 1 : 0.55 }}>
            <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 18, color: on ? C.red : C.steelLight, letterSpacing: 2 }}>{k}</div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: on ? C.ink : C.steelLight, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hit sparks bursting from the combo meter, toward the frame. */
function Sparks({ t, at }: { t: number; at: number }) {
  const d = (t - at) / 0.5;
  if (d < 0 || d > 1) return null;
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r = 30 + d * 120;
        return <div key={i} style={{ position: "absolute", left: 200 + Math.cos(a) * r, top: 260 + Math.sin(a) * r, width: 14, height: 14, background: i % 2 ? C.sun : C.red, opacity: 1 - d }} />;
      })}
    </>
  );
}

export function Fresh01() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {frame >= s2f(MOVE) && frame < s2f(END) && (
        <>
          {t < T.at ? <Framed src="gusher" shots={[[G.at, G.from, G.len]]} /> : <Framed src="tanker" shots={[[T.at, T.from, T.len]]} border={C.red} />}
          <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y + FH + 34, display: "flex", gap: 14 }}>
            <Chip bg={C.sun} size={24}>
              <span style={{ fontFamily: font.logo }}>Gusher: up to 150 bbl in 90 s</span>
            </Chip>
            <Chip bg={C.white} size={24}>
              <span style={{ fontFamily: font.logo }}>Tanker every 4 hours</span>
            </Chip>
          </div>
        </>
      )}
      <Combo frame={frame} />
      <Sparks t={t} at={HIT1} />
      <Sparks t={t} at={HIT2} />
      <MoveList frame={frame} />
      <PixelWipe frame={frame} start={s2f(MOVE) - 22} color="#120b2a" />
      <PixelWipe frame={frame} start={s2f(END) - 22} />
      <EndCard start={END} top="Combo" bottom="unlocked" />
    </AbsoluteFill>
  );
}
