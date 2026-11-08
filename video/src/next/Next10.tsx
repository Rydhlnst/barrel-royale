import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, crate, crownBarrel, icons, logo, logoPalette, roughneck, valve } from "@/components/pixel/sprites";
import { C, Chip, ease, font, ring, Spr, Stars, Title } from "../brand";

// next10, what's next: a roughneck raises a spyglass from the rig at dawn. Through the round lens the
// horizon pans island by island, each one a milestone from the roadmap with its flag; the near ones come
// into focus, the far ones stay hazy. No dates: just the order things come in.

export const NEXT10_SECONDS = 15;

const s2f = (s: number) => Math.round(s * 60);
const LENS = { cx: 1130, cy: 520, r: 400 };
const GAP = 620;

const ISLANDS = [
  { title: "Whitelist snapshot", note: "Tiers published", icon: icons.hardHat, near: true },
  { title: "Rig mint", note: "OG Roughnecks first", icon: icons.derrick, near: true },
  { title: "Rig class reveal", note: "Four classes", icon: crownBarrel, near: false },
  { title: "Treasury report", note: "Every transaction linked", icon: crate, near: false },
  { title: "XOM into the vault", note: "The first purchases", icon: icons.coin, near: false },
  { title: "On-chain game", note: "On testnet first", icon: valve, near: false },
  { title: "Season 1", note: "Crews and crew wars", icon: roughneck, near: false },
  { title: "Growing the platform", note: "Projects, events, a second site", icon: barrel, near: false },
];

const OPEN = { from: s2f(0.4), to: s2f(1.3) };
// the lens rests on each island in turn
const STOPS = ISLANDS.map((_, i) => s2f(1.6 + i * 1.32));
const END = s2f(12.6);

function panX(frame: number) {
  const ts = STOPS.flatMap((t) => [t, t + 50]);
  const xs = ISLANDS.flatMap((_, i) => [i * GAP, i * GAP]);
  return interpolate(frame, [0, ...ts], [-GAP * 0.8, ...xs], { extrapolateRight: "clamp", easing: ease });
}

function Island({ i, frame, fps, focus }: { i: number; frame: number; fps: number; focus: number }) {
  const it = ISLANDS[i];
  const flag = spring({ frame: frame - STOPS[i] - 10, fps, config: { damping: 10 } });
  const wave = Math.round(Math.sin(frame / 12 + i) * 3);
  return (
    <div style={{ position: "absolute", left: i * GAP - 230, top: 0, width: 460, height: 1080, filter: `blur(${(1 - focus) * (it.near ? 3 : 6)}px)`, opacity: it.near ? 1 : 0.85 }}>
      {/* the island */}
      <div style={{ position: "absolute", left: 40, top: 610, width: 380, height: 70, background: "#e8cf8a", boxShadow: `0 0 0 6px ${C.ink}`, borderRadius: "120px 120px 0 0" }} />
      <div style={{ position: "absolute", left: 90, top: 586, width: 280, height: 40, background: C.leaf, boxShadow: `0 0 0 6px ${C.ink}`, borderRadius: "90px 90px 0 0" }} />
      <div style={{ position: "absolute", left: 180, top: 470 }}>
        <Spr rows={it.icon} palette={base} scale={7} />
      </div>
      {/* the flag on its pole */}
      <div style={{ position: "absolute", left: 340, top: 400, width: 8, height: 200, background: C.ink }} />
      <div style={{ position: "absolute", left: 348, top: 404 + wave, width: 70 * flag, height: 44, background: it.near ? C.red : C.sun, boxShadow: `0 0 0 5px ${C.ink}` }} />
      {/* the sign */}
      <div style={{ position: "absolute", left: 0, width: 460, top: 260, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, scale: String(0.6 + 0.4 * focus) }}>
        <Chip bg={it.near ? C.red : C.ink} color={it.near ? C.white : C.sun} size={20}>
          <span style={{ fontFamily: font.logo }}>{it.near ? "Up next" : "On the horizon"}</span>
        </Chip>
        <div style={{ padding: "10px 18px", background: C.white, boxShadow: ring(5), fontFamily: font.display, fontWeight: 700, fontSize: 36, color: C.ink, textAlign: "center", whiteSpace: "nowrap" }}>{it.title}</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.ink, opacity: focus }}>{it.note}</div>
      </div>
    </div>
  );
}

export function Next10() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = interpolate(frame, [OPEN.from, OPEN.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const r = LENS.r * open;
  const x = panX(frame);
  const which = Math.round(x / GAP);
  const dawn = interpolate(frame, [0, END], [0, 1], { extrapolateRight: "clamp" });
  const zoomOut = interpolate(frame, [END - 30, END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const end = spring({ frame: frame - END, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <Stars frame={frame} count={70} h={1080} seed="n10" />

      {/* the view through the lens */}
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r + zoomOut * 1400}px at ${LENS.cx}px ${LENS.cy}px)` }}>
        <AbsoluteFill style={{ background: `linear-gradient(${interpolate(dawn, [0, 1], [0, 1]) > 0.5 ? C.sunPale : "#f7c98a"}, ${C.foam} 55%)` }} />
        <div style={{ position: "absolute", left: 0, top: 600, width: 1920, height: 480, background: C.sea }} />
        <div style={{ position: "absolute", left: 0, top: 780, width: 1920, height: 300, background: C.seaDeep }} />
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} style={{ position: "absolute", top: 640 + (i % 5) * 60, left: ((i * 230 - x * 0.6 + frame) % 2300 + 2300) % 2300 - 200, width: 90, height: 6, background: C.foam, opacity: 0.7 }} />
        ))}
        <div style={{ position: "absolute", left: LENS.cx - x, top: 0 }}>
          {ISLANDS.map((_, i) => {
            const focus = interpolate(Math.abs(i * GAP - x), [0, GAP * 0.9], [1, 0], { extrapolateRight: "clamp" });
            return <Island key={i} i={i} frame={frame} fps={fps} focus={focus} />;
          })}
        </div>
        {/* crosshair */}
        <div style={{ position: "absolute", left: LENS.cx - 2, top: LENS.cy - r, width: 4, height: r * 2, background: "rgba(30,42,74,0.15)" }} />
        <div style={{ position: "absolute", left: LENS.cx - r, top: LENS.cy - 2, width: r * 2, height: 4, background: "rgba(30,42,74,0.15)" }} />
      </div>

      {/* the brass rim of the spyglass */}
      {r > 4 && zoomOut < 1 && (
        <div style={{ position: "absolute", left: LENS.cx - r - 28, top: LENS.cy - r - 28, width: (r + 28) * 2, height: (r + 28) * 2, borderRadius: "50%", boxShadow: `inset 0 0 0 16px #c9932f, inset 0 0 0 22px #8a5a1c, inset 0 0 0 28px ${C.ink}`, opacity: 1 - zoomOut }} />
      )}

      {/* the roughneck holding it, and the copy */}
      {frame < END && (
        <>
          <div style={{ position: "absolute", left: 80, top: 70 }}>
            <Title size={84} color={C.sun}>
              What&apos;s next
            </Title>
            <Title size={40}>from the rig</Title>
          </div>
          <div style={{ position: "absolute", left: 90, top: 330, display: "flex", flexDirection: "column", gap: 10 }}>
            {ISLANDS.map((it, i) => (
              <div key={it.title} style={{ display: "flex", alignItems: "center", gap: 12, opacity: i <= which ? 1 : 0.3 }}>
                <div style={{ width: 18, height: 18, background: i === which ? C.sun : i < which ? C.white : C.ink2, boxShadow: `0 0 0 3px ${C.ink}` }} />
                <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: i === which ? C.sun : C.white }}>{it.title}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 60, bottom: 30 }}>
            <Spr rows={roughneck} palette={base} scale={9} />
          </div>
          <div style={{ position: "absolute", left: 180, bottom: 120, width: 520, height: 34, rotate: "-12deg", transformOrigin: "0 50%", background: "#c9932f", boxShadow: `${ring(5)}, inset 0 -8px 0 #8a5a1c` }} />
        </>
      )}

      {frame >= END && (
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, background: C.ink }}>
          <Stars frame={frame} count={90} h={1080} seed="n10end" />
          <div style={{ scale: String(end), display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(6, C.sun) }} />
            <Title size={100} color={C.sun}>
              The road ahead
            </Title>
            <Title size={44}>Rig mint is next on the horizon</Title>
            <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
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
