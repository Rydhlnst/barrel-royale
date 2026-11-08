import { AbsoluteFill, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { logo, logoPalette } from "@/components/pixel/sprites";
import { C, Chip, ease, font, Pointer, ring, Spr, Title } from "../brand";

// next08, live chart: the real rig plays behind a $ROYAL chart panel that unfolds like an accordion out of
// its corner button, candles drawn by a scanning beam (a stylised chart, no prices). Tap the fold and it
// pleats back into the button, which keeps that choice on the device; tap again and it's back.

export const NEXT08_SECONDS = 15;

const s2f = (s: number) => Math.round(s * 60);
/** The rig recording, whole and scaled down, so its HUD stays in view; the chart lives on its deck. */
const W = { x: 620, y: 170, w: 1240, h: 698 };
const PANEL = { x: W.x + 690, y: W.y + 110, w: 500, h: 470 };
const BUTTON = { x: W.x + W.w - 250, y: W.y + W.h - 64, w: 230, h: 46 };
const STRIPS = 10;
const OPEN1 = { at: s2f(1.3), dur: 60 };
const FOLD = { at: s2f(7.1), dur: 48 };
const OPEN2 = { at: s2f(10.8), dur: 42 };
const SCAN = { from: s2f(2.3), to: s2f(6.4) };
const END = s2f(12.6);

const CANDLES = Array.from({ length: 34 }, (_, i) => i).reduce<{ o: number; c: number; h: number; l: number }[]>((acc, i) => {
  const o = acc.length ? acc[acc.length - 1].c : 50;
  const c = Math.max(12, Math.min(92, o + (random(`n8c${i}`) - 0.4) * 14));
  acc.push({ o, c, h: Math.max(o, c) + random(`n8h${i}`) * 6, l: Math.min(o, c) - random(`n8l${i}`) * 6 });
  return acc;
}, []);

/** How open each pleat is (0 folded, 1 open) for the current frame. */
function pleats(frame: number) {
  const k = (start: number, dur: number, i: number, reverse: boolean) => {
    // strips open from the right edge leftward, and fold back from the left edge rightward
    const order = reverse ? i : STRIPS - 1 - i;
    const each = dur / (STRIPS + 2);
    return interpolate(frame, [start + order * each, start + (order + 3) * each], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  };
  return Array.from({ length: STRIPS }, (_, i) => {
    if (frame < OPEN1.at) return 0;
    if (frame < FOLD.at) return k(OPEN1.at, OPEN1.dur, i, false);
    if (frame < OPEN2.at) return 1 - k(FOLD.at, FOLD.dur, i, true);
    return k(OPEN2.at, OPEN2.dur, i, false);
  });
}

function Chart({ frame, width, height }: { frame: number; width: number; height: number }) {
  const shown = frame >= OPEN2.at ? 1 : interpolate(frame, [SCAN.from, SCAN.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const H = height;
  const lo = Math.min(...CANDLES.map((c) => c.l));
  const hi = Math.max(...CANDLES.map((c) => c.h));
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const step = (width - 60) / CANDLES.length;
  const n = Math.floor(shown * CANDLES.length);
  const scanX = 30 + shown * (width - 60);
  return (
    <div style={{ position: "absolute", left: 0, top: 90, width, height: H + 40 }}>
      {[0.2, 0.4, 0.6, 0.8].map((g) => (
        <div key={g} style={{ position: "absolute", left: 30, right: 30, top: H * g, height: 3, background: "rgba(255,255,255,0.07)" }} />
      ))}
      {CANDLES.slice(0, n).map((k, i) => {
        const up = k.c >= k.o;
        const col = up ? "#3dff9a" : C.redLight;
        const x = 30 + i * step;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x + step / 2 - 3, top: y(k.h), width: 6, height: Math.max(6, y(k.l) - y(k.h)), background: col }} />
            <div style={{ position: "absolute", left: x + 4, top: y(Math.max(k.o, k.c)), width: step - 8, height: Math.max(8, Math.abs(y(k.o) - y(k.c))), background: col }} />
          </div>
        );
      })}
      {shown < 1 && shown > 0 && <div style={{ position: "absolute", left: scanX, top: -10, width: 6, height: H + 30, background: C.sun, boxShadow: `0 0 24px 8px rgba(255,213,74,0.45)` }} />}
    </div>
  );
}

function Panel({ frame }: { frame: number }) {
  const p = pleats(frame);
  const open = p.reduce((a, b) => a + b, 0) / STRIPS;
  if (open <= 0.001) return null;
  const sw = PANEL.w / STRIPS;
  const live = Math.floor(frame / 30) % 2;
  return (
    <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h }}>
      {p.map((k, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * sw,
            top: 0,
            width: sw + 1,
            height: PANEL.h,
            overflow: "hidden",
            transformOrigin: i % 2 ? "0 50%" : "100% 50%",
            transform: `scaleX(${k})`,
            filter: `brightness(${0.75 + 0.25 * k})`,
          }}
        >
          {/* each pleat shows its own slice of the whole panel */}
          <div style={{ position: "absolute", left: -i * sw, top: 0, width: PANEL.w, height: PANEL.h, background: C.ink, boxShadow: `inset 0 0 0 8px ${C.sun}` }}>
            <div style={{ position: "absolute", left: 30, top: 26, display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sun }}>$ROYAL</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px", background: "#0f2a20", boxShadow: ring(3, C.leaf), fontFamily: font.logo, fontSize: 22, color: "#7dffb0" }}>
                <span style={{ width: 14, height: 14, background: live ? "#3dff9a" : "#1d7a4c" }} />
                Live chart
              </span>
            </div>
            <div style={{ position: "absolute", right: 24, top: 22, width: 46, height: 46, background: C.sun, boxShadow: ring(4), display: "grid", placeItems: "center", fontFamily: font.logo, fontSize: 40, color: C.ink }}>–</div>
            <Chart frame={frame} width={PANEL.w} height={PANEL.h - 140} />
          </div>
        </div>
      ))}
    </div>
  );
}

const COPY = [
  { at: 0.3, until: 6.9, big: "$ROYAL chart", small: "right in the rig" },
  { at: 7.1, until: 10.6, big: "Fold it", small: "when you need the deck" },
  { at: 10.7, until: 12.6, big: "Back", small: "in one tap" },
];

export function Next08() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const folded = pleats(frame).every((k) => k < 0.02);
  const fold = { x: PANEL.x + PANEL.w - 47, y: PANEL.y + 45 };
  const btn = { x: BUTTON.x + BUTTON.w / 2, y: BUTTON.y + BUTTON.h / 2 };
  // the pointer: to the button, tap; later to the fold, tap; back to the button, tap
  const px = interpolate(t, [0, 0.9, 1.4, 6.3, 7.0, 7.3, 10.1, 10.7, 11.2, 12], [1300, btn.x, btn.x, btn.x - 200, fold.x, fold.x, btn.x, btn.x, btn.x, 1300], { extrapolateRight: "clamp" });
  const py = interpolate(t, [0, 0.9, 1.4, 6.3, 7.0, 7.3, 10.1, 10.7, 11.2, 12], [700, btn.y, btn.y, 700, fold.y, fold.y, btn.y, btn.y, btn.y, 700], { extrapolateRight: "clamp" });
  const down = (t > 1.1 && t < 1.3) || (t > 6.9 && t < 7.1) || (t > 10.6 && t < 10.8);
  const saved = spring({ frame: frame - s2f(8.0), fps, config: { damping: 9, stiffness: 220 } });
  const beat = COPY.find((c) => t >= c.at && t < c.until);
  const end = spring({ frame: frame - END, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,213,74,0.12) 2px, transparent 2px)", backgroundSize: "36px 36px" }} />
      <div style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, overflow: "hidden", boxShadow: `${ring(8)}, 0 0 0 14px ${C.sun}, 0 0 0 20px ${C.ink}` }}>
        <OffthreadVideo src={staticFile("footage/play.mp4")} muted trimBefore={0} playbackRate={0.2} style={{ position: "absolute", width: W.w, height: W.h }} />
      </div>

      <div style={{ position: "absolute", left: 80, top: 70, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sun }}>Barrel Royale</span>
      </div>
      {beat && (
        <div key={beat.big} style={{ position: "absolute", left: 70, top: 380, scale: String(spring({ frame: frame - s2f(beat.at), fps, config: { damping: 11 } })), transformOrigin: "0 50%" }}>
          <Title size={58} color={C.sun}>
            {beat.big}
          </Title>
          <Title size={32}>{beat.small}</Title>
        </div>
      )}

      <Panel frame={frame} />

      {/* the folded state: the corner button, with a pin once the choice is kept */}
      {folded && frame < END && (
        <div style={{ position: "absolute", left: BUTTON.x, top: BUTTON.y }}>
          <Chip bg={C.sun} size={24} style={{ scale: down ? "0.94" : "1" }}>
            <span style={{ fontFamily: font.logo }}>$ROYAL chart</span>
          </Chip>
          {t >= 8.0 && (
            <div style={{ position: "absolute", right: 0, top: 104, scale: String(saved), transformOrigin: "100% 0", whiteSpace: "nowrap" }}>
              <Chip bg={C.leaf} color={C.white} size={24}>
                <span style={{ fontFamily: font.logo }}>Kept on this device</span>
              </Chip>
            </div>
          )}
        </div>
      )}
      {frame < END && <Pointer x={px} y={py} down={down} scale={6} />}

      {frame >= END && (
        <AbsoluteFill style={{ background: C.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 360, display: "flex", alignItems: "flex-end", gap: 10, padding: "0 40px", opacity: 0.35 }}>
            {CANDLES.map((k, i) => (
              <div key={i} style={{ flex: 1, height: (k.c - 10) * 3.4 * Math.min(1, (frame - END - i) / 12 + 0.01 > 0 ? (frame - END - i) / 12 : 0), background: k.c >= k.o ? "#3dff9a" : C.redLight }} />
            ))}
          </div>
          <div style={{ scale: String(end), display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(6, C.sun) }} />
            <Title size={92} color={C.sun}>
              Live chart on the rig
            </Title>
            <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
              <Chip bg={C.sun} size={38}>
                <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
              </Chip>
              <Chip bg={C.white} size={38}>
                <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
              </Chip>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
