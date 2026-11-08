import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Chip, font, ring, Title } from "../brand";
import { EndCard, Footage } from "./Next01";

// next04: Royal Harbor on Harbor TV. An old pixel TV in a cosy room tunes in to the village live: the
// channel flips with static between rowing over, the crew by the fire and the chat, with a news bar
// and a ticker of what the crew is saying. Real footage of the local build with five players.

export const NEXT04_SECONDS = 16;

const SCREEN = { x: 230, y: 100, w: 1240, h: 698 };
const ROOM = "#1b2240";

/** Segments of the village recording, each on its own channel. */
const SEGS = [
  { start: 24, end: 200, from: 0.9, rate: 1.4, ch: 3, tag: "Row over from your rig" },
  { start: 214, end: 560, from: 5.5, rate: 1, ch: 4, tag: "Live players · name tags · rig levels" },
  { start: 574, end: 830, from: 11.0, rate: 1.3, ch: 5, tag: "Chat by the fire" },
];
const STATIC = [200, 560, 830];
const END = 844;

const TICKER = "0x5a1e: GM roughnecks!   ·   0x7c3d: Just hit level 8, storage feels huge   ·   0x2b8e: Anyone running Overdrive on light crude?   ·   You: Meet by the fire, crew   ·   0x91fa: On my way   ·   ";

function Static({ frame }: { frame: number }) {
  const cols = 32;
  const rows = 18;
  const w = SCREEN.w / cols;
  const h = SCREEN.h / rows;
  return (
    <>
      {Array.from({ length: cols * rows }, (_, i) => {
        const v = Math.floor(random(`s${frame}-${i}`) * 4);
        return <div key={i} style={{ position: "absolute", left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w + 1, height: h + 1, background: ["#20263a", "#66718a", "#cbd3de", "#ffffff"][v] }} />;
      })}
    </>
  );
}

export function Next04() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seg = SEGS.find((s) => frame >= s.start && frame < s.end);
  const noisy = STATIC.some((s) => frame >= s && frame < s + 14);
  const ch = seg ? seg.ch : frame >= END ? 1 : (SEGS.find((s) => s.start > frame)?.ch ?? 1);
  // CRT power-on: a bright line that opens up into the picture
  const on = interpolate(frame, [0, 22], [0.004, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tickerX = -((frame * 4) % 2400);
  const enter = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ background: ROOM, overflow: "hidden" }}>
      {/* the room: wallpaper, a lamp's glow, the floor */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 48px, rgba(255,255,255,0.03) 48px 96px)" }} />
      <div style={{ position: "absolute", left: -200, top: -200, width: 900, height: 900, background: "radial-gradient(circle, rgba(255,213,74,0.18), transparent 65%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, bottom: 0, background: C.woodDark, boxShadow: `0 -8px 0 ${C.ink}` }} />

      {/* the TV */}
      <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - enter) * 80}px` }}>
        <div style={{ position: "absolute", left: 160, top: 920, width: 1600, height: 60, background: C.wood, boxShadow: ring(7) }} />
        <div style={{ position: "absolute", left: 170, top: 50, width: 1580, height: 860, background: "#8a5a2b", boxShadow: `${ring(10)}, inset 0 0 0 16px #a8692e`, backgroundImage: "repeating-linear-gradient(0deg, transparent 0 22px, rgba(0,0,0,0.08) 22px 26px)" }} />
        <div style={{ position: "absolute", left: SCREEN.x - 20, top: SCREEN.y - 20, width: SCREEN.w + 40, height: SCREEN.h + 40, background: C.ink, borderRadius: 18 }} />

        {/* the screen */}
        <div style={{ position: "absolute", left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, overflow: "hidden", background: "#05070f", borderRadius: 12 }}>
          <div style={{ position: "absolute", inset: 0, scale: `1 ${on}` }}>
            {SEGS.map((s) => (
              <Footage key={s.start} src="village" from={s.from} rate={s.rate} start={s.start} dur={s.end - s.start} box={{ x: 0, y: 0, w: SCREEN.w, h: SCREEN.h }} view={{ x: 0, y: 0, w: 1920 }} style={{ visibility: seg === s ? "visible" : "hidden" }} />
            ))}
            {frame < 24 && <div style={{ position: "absolute", inset: 0, background: "#e9f4ff" }} />}
            {noisy && <Static frame={frame} />}
            {frame >= END && (
              <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, scale: String(SCREEN.w / 1920), transformOrigin: "0 0" }}>
                <EndCard frame={frame} start={END} line={["See you", "by the fire"]} bg={C.sea} ink={C.ink} accent={C.sun} text={C.white} />
              </div>
            )}
          </div>
          {/* glass: scanlines and a soft vignette */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)", boxShadow: "inset 0 0 90px rgba(0,0,0,0.55)", pointerEvents: "none" }} />
        </div>

        {/* the control panel */}
        <div style={{ position: "absolute", left: 1520, top: 110, width: 190, height: 110, background: C.ink, boxShadow: ring(5, C.steel), display: "grid", placeItems: "center" }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: "#3dff9a" }}>CH {ch}</span>
        </div>
        {[260, 420].map((y, i) => (
          <div key={y} style={{ position: "absolute", left: 1560, top: y, width: 110, height: 110, background: C.steelLight, boxShadow: `${ring(6)}, inset -10px -10px 0 ${C.steel}`, borderRadius: 55, rotate: `${i === 0 ? ch * 40 : 20}deg` }}>
            <div style={{ position: "absolute", left: 50, top: 8, width: 10, height: 36, background: C.ink }} />
          </div>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 1530, top: 580 + i * 26, width: 170, height: 10, background: C.ink }} />
        ))}
        <div style={{ position: "absolute", left: 1528, top: 790 }}>
          <Title size={34} color={C.sunPale}>
            Harbor TV
          </Title>
        </div>

        {/* the news bar and the caption sit on the set, outside the picture, so the game's HUD stays clear */}
        {seg && !noisy && (
          <>
            <div style={{ position: "absolute", left: SCREEN.x + SCREEN.w / 2, top: 18, translate: "-50% 0", scale: String(spring({ frame: frame - seg.start - 6, fps, config: { damping: 10 } })) }}>
              <Chip bg={C.sun} size={28}>
                {seg.tag}
              </Chip>
            </div>
            <div style={{ position: "absolute", left: SCREEN.x - 20, top: SCREEN.y + SCREEN.h + 28, width: SCREEN.w + 40, height: 54, display: "flex", boxShadow: ring(4) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: C.red, whiteSpace: "nowrap" }}>
                <div style={{ width: 16, height: 16, background: Math.floor(frame / 20) % 2 ? C.white : "#ffb0a6" }} />
                <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.white, letterSpacing: 3 }}>Live · Royal Harbor</span>
              </div>
              <div style={{ position: "relative", flex: 1, background: C.white, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: tickerX, top: 10, whiteSpace: "nowrap", fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.ink }}>
                  {TICKER}
                  {TICKER}
                  {TICKER}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
}
