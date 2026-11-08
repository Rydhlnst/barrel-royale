import { AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, PixelWipe, ring, Spr, Sunburst, Title } from "../brand";

// How to play on a phone: the real game filmed at phone size (public/footage/mplay.mp4,
// from `node scripts/record.mjs mplay`) plays in a phone on the right while the steps
// tick off on the left, with hints pointing at the stick and the action button.

export const MOBILE_HOW_SECONDS = 40;

/** Cuts of the phone footage: footage start, playback rate, and where each sits in the video. */
const CUTS = [
  { from: 0, rate: 1, start: 0, end: 7 },
  { from: 7.6, rate: 1.2, start: 7, end: 14 },
  { from: 17.3, rate: 1.3, start: 14, end: 23.8 },
  { from: 30.8, rate: 1.4, start: 23.8, end: 35.7 },
];
const END = 35.7;

const STEPS = [
  { at: 0, title: "Connect your wallet", tip: "Tap your wallet app. Free, no transaction" },
  { at: 7, title: "Walk with the stick", tip: "Drag the stick at the bottom left" },
  { at: 9.2, title: "Drill a well", tip: "Tap Drill or build, then pick a crude" },
  { at: 14, title: "Collect your barrels", tip: "Walk up to a well and tap Collect" },
  { at: 18.8, title: "Set the choke", tip: "Overdrive pumps 1.5x. Ease off before the red line" },
  { at: 23.8, title: "Sell at the market", tip: "Tap Sell for coins at the live price" },
];

/** Hints that point at the phone's controls: [from, until, text, the spot on screen it points to]. */
const HINTS: { at: number; until: number; text: string; x: number; y: number }[] = [
  { at: 7.4, until: 9.4, text: "Drag to walk", x: 1388, y: 922 },
  { at: 9.4, until: 10.6, text: "Tap to use", x: 1466, y: 820 },
  { at: 14.4, until: 16.9, text: "Drag to walk", x: 1388, y: 922 },
  { at: 16.9, until: 18.6, text: "Tap to collect", x: 1466, y: 820 },
  { at: 24, until: 28.4, text: "Drag to walk", x: 1388, y: 922 },
];

const PHONE = { x: 1286, y: 56, h: 960 };
const PHONE_W = Math.round((PHONE.h * 780) / 1688);

function Phone({ frame, fps }: { frame: number; fps: number }) {
  const up = spring({ frame: frame - 10, fps, config: { damping: 13, stiffness: 150 } });
  return (
    <div style={{ position: "absolute", left: PHONE.x - 22, top: PHONE.y - 22, padding: 22, background: C.ink, boxShadow: `${ring(8)}, 0 0 0 16px ${C.sunPale}, 0 0 0 22px ${C.ink}`, borderRadius: 6, translate: `0 ${(1 - up) * 1150}px`, rotate: `${(1 - up) * 8}deg` }}>
      <div style={{ position: "relative", width: PHONE_W, height: PHONE.h, overflow: "hidden", background: C.white }}>
        {CUTS.map((c) => (
          <Sequence key={c.start} from={Math.round(c.start * fps)} durationInFrames={Math.round((c.end - c.start) * fps)} layout="none">
            <OffthreadVideo src={staticFile("footage/mplay.mp4")} muted trimBefore={Math.round(c.from * fps)} playbackRate={c.rate} style={{ width: PHONE_W, height: PHONE.h, display: "block" }} />
          </Sequence>
        ))}
      </div>
    </div>
  );
}

function Hint({ hint, frame, fps }: { hint: (typeof HINTS)[number]; frame: number; fps: number }) {
  const IN = Math.round(hint.at * fps);
  const OUT = Math.round(hint.until * fps);
  if (frame < IN || frame > OUT) return null;
  const pop = spring({ frame: frame - IN, fps, config: { damping: 10, stiffness: 220 } });
  const bob = Math.round(Math.sin((frame - IN) / 6) * 6);
  // the chip sits to the left of the spot, with a pixel arrow pointing right at it
  return (
    <div style={{ position: "absolute", right: 1920 - hint.x + 18 + bob, top: hint.y - 30, display: "flex", alignItems: "center", scale: String(pop), transformOrigin: "100% 50%" }}>
      <Chip bg={C.red} color={C.white} size={30}>
        <span style={{ fontFamily: font.logo }}>{hint.text}</span>
      </Chip>
      <div style={{ width: 0, height: 0, borderTop: "18px solid transparent", borderBottom: "18px solid transparent", borderLeft: `26px solid ${C.ink}`, marginLeft: 6 }} />
    </div>
  );
}

function Steps({ frame, fps }: { frame: number; fps: number }) {
  const t = frame / fps;
  const now = STEPS.reduce((k, s, i) => (t >= s.at ? i : k), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {STEPS.map((s, i) => {
        const done = t >= END || i < now;
        const on = i === now && t < END;
        return (
          <div key={s.title} style={{ display: "flex", alignItems: "flex-start", gap: 20, padding: on ? "16px 22px" : "8px 22px", background: on ? C.sun : "transparent", boxShadow: on ? ring(5) : undefined, width: 860, boxSizing: "border-box" }}>
            <div style={{ flex: "none", width: 50, height: 50, display: "grid", placeItems: "center", background: done ? C.leaf : on ? C.ink : C.ink2, boxShadow: ring(4, on ? C.ink : C.white, "transparent"), fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: on ? C.sun : C.white }}>
              {done ? "✓" : i + 1}
            </div>
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: on ? 44 : 34, lineHeight: 1.15, color: on ? C.ink : done ? C.sunPale : C.white, opacity: on || done ? 1 : 0.75 }}>{s.title}</div>
              {on && <div style={{ marginTop: 6, fontFamily: font.body, fontWeight: 800, fontSize: 26, color: C.ink2 }}>{s.tip}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EndCard({ frame, fps }: { frame: number; fps: number }) {
  const s = (at: number) => spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 10, stiffness: 190 } });
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst turn={0.08} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 30, scale: String(s(END + 0.2)) }}>
          <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
          <Spr rows={roughneck} palette={base} scale={12} />
        </div>
        <div style={{ scale: String(s(END + 0.4)) }}>
          <Title size={120}>Play on</Title>
        </div>
        <div style={{ scale: String(s(END + 0.55)) }}>
          <Title size={120} color={C.red}>
            your phone
          </Title>
        </div>
        <div style={{ marginTop: 10, scale: String(s(END + 0.8)) }}>
          <Chip bg={C.white} size={44}>
            <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
          </Chip>
        </div>
        <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.ink, letterSpacing: 3, opacity: s(END + 1) }}>$ROYAL · @barrelroyale</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function MobileHowToPlay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 6, fps, config: { damping: 11, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <Sunburst cx={0.78} cy={0.5} turn={0.05} />
      {/* the steps column, stepping off to the right */}
      {[
        [0, 1040, 1],
        [1040, 28, 0.7],
        [1068, 28, 0.4],
      ].map(([x, w, o]) => (
        <div key={x} style={{ position: "absolute", left: x, top: 0, width: w, height: 1080, background: C.ink, opacity: o }} />
      ))}

      <div style={{ position: "absolute", left: 90, top: 60, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sun }}>Barrel Royale</span>
        </div>
        <div style={{ marginTop: 30, scale: String(head), transformOrigin: "0 50%" }}>
          <Title size={84}>How to play</Title>
          <Title size={84} color={C.sun}>
            on your phone
          </Title>
        </div>
        <div style={{ marginTop: 36 }}>
          <Steps frame={frame} fps={fps} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, bottom: 44, fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.sun, letterSpacing: 2 }}>barrelroyale.io/play · @barrelroyale</div>

      <Phone frame={frame} fps={fps} />
      {HINTS.map((h) => (
        <Hint key={h.at} hint={h} frame={frame} fps={fps} />
      ))}

      <PixelWipe frame={frame} start={Math.round(END * fps) - 22} />
      {frame >= Math.round(END * fps) && <EndCard frame={frame} fps={fps} />}
    </AbsoluteFill>
  );
}
