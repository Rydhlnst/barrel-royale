import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { Burst, C, Caret, Chip, Embers, font, PixelWipe, Pointer, SeaScene, Spr, Sunburst, Title, Window, ramp, ring, typed, wiped } from "./brand";

// 1 · Web Live. The logo drops in over the sea, the address is typed into a
// pixel address bar, and the bar opens into the live site playing inside it.
// A LIVE stamp lands on the window, then the address fills the closing card.

export const WEB_LIVE_SECONDS = 14;

const URL = "barrelroyale.io";

export function WebLive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // timeline, in frames
  const typeAt = 1.9 * fps;
  const clickAt = 3.9 * fps;
  const openAt = 4.1 * fps;
  const liveAt = 6.6 * fps;
  const wipeAt = 10.7 * fps;
  const endCard = wiped(frame, wipeAt);

  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      {!endCard ? <Opening frame={frame} fps={fps} typeAt={typeAt} clickAt={clickAt} openAt={openAt} liveAt={liveAt} /> : <EndCard frame={frame - (wipeAt + 22)} fps={fps} />}
      <PixelWipe frame={frame} start={wipeAt} color={C.ink} />
    </AbsoluteFill>
  );
}

function Opening({ frame, fps, typeAt, clickAt, openAt, liveAt }: { frame: number; fps: number; typeAt: number; clickAt: number; openAt: number; liveAt: number }) {
  // the logo drops, then everything above the sea makes room for the window
  const drop = spring({ frame: frame - 6, fps, config: { damping: 11, stiffness: 120 } });
  const lift = ramp(frame, openAt - 20, 40);
  const sink = ramp(frame, typeAt - 40, 40);
  const open = ramp(frame, openAt, 34, Easing.bezier(0.65, 0, 0.35, 1));

  // the address bar grows into the browser window
  const w = interpolate(open, [0, 1], [1000, 1440]);
  const h = interpolate(open, [0, 1], [0, 810]);
  const left = (1920 - w) / 2;
  const top = interpolate(open, [0, 1], [560, 96]);
  const barIn = ramp(frame, typeAt - 24, 24, Easing.bezier(0.34, 1.56, 0.64, 1));

  // the pointer glides to the bar and clicks
  const glide = ramp(frame, clickAt - 40, 34);
  const px = interpolate(glide, [0, 1], [1700, 1380]);
  const py = interpolate(glide, [0, 1], [1100, 600]);
  const down = frame >= clickAt && frame < clickAt + 8;
  const pointerOut = ramp(frame, clickAt + 14, 20);

  const text = typed(URL, frame, typeAt, 11);
  const bob = Math.round(Math.sin((frame - openAt) / 40) * 6);

  return (
    <AbsoluteFill>
      <Sunburst cy={0.62} turn={0.08} />
      <div style={{ position: "absolute", inset: 0, translate: `0 ${Math.round(sink * 170 + lift * 120)}px` }}>
        <SeaScene frame={frame} />
      </div>

      {/* logo and name, before the window opens */}
      <AbsoluteFill style={{ alignItems: "center", opacity: 1 - lift, translate: `0 ${Math.round(-lift * 160)}px` }}>
        <Spr rows={logo} palette={logoPalette} scale={8} x={960 - 128} y={Math.round(interpolate(drop, [0, 1], [-300, 70]))} style={{ boxShadow: ring(8) }} />
        <div style={{ position: "absolute", top: 370, width: "100%", display: "flex", justifyContent: "center", gap: 0 }}>
          {"Barrel Royale".split("").map((ch, i) => {
            const s = spring({ frame: frame - 20 - i * 3, fps, config: { damping: 9, stiffness: 180 } });
            return (
              <Title key={i} size={128} style={{ scale: String(s), translate: `0 ${Math.round((1 - s) * 40)}px`, color: i < 6 ? C.white : C.red, width: ch === " " ? 50 : undefined }}>
                {ch}
              </Title>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* the address bar, then the window with the live site inside */}
      {frame >= typeAt - 24 && (
        <Window
          width={Math.round(w)}
          height={Math.round(h)}
          url={
            <>
              <span style={{ color: C.ink2, marginRight: 4 }}>https://</span>
              {text}
              {frame < openAt && <Caret frame={frame} w={14} h={30} />}
            </>
          }
          style={{ left: Math.round(left), top: Math.round(top) + (frame > openAt + 34 ? bob : 0), scale: String(barIn), transformOrigin: "50% 50%" }}
        >
          <Sequence from={openAt} layout="none">
            <OffthreadVideo src={staticFile("footage/home.mp4")} muted playbackRate={1.35} style={{ width: Math.round(w), height: Math.round((w * 9) / 16), display: "block" }} />
          </Sequence>
        </Window>
      )}

      {/* LIVE stamp on the window's corner */}
      {frame >= liveAt && <LiveStamp frame={frame - liveAt} fps={fps} />}
      <Burst frame={frame} start={liveAt + 4} x={1560} y={130} rows={icons.coin} scale={5} count={16} speed={16} seed="live" />

      {/* what the site offers, chips along the bottom edge of the window */}
      <div style={{ position: "absolute", top: 952, width: "100%", display: "flex", justifyContent: "center", gap: 40 }}>
        {[
          { text: "Play in your browser", bg: C.white },
          { text: "Hold $ROYAL to open your rig", bg: C.sun },
          { text: "Join the whitelist", bg: C.red, color: C.white },
        ].map((c, i) => {
          const s = spring({ frame: frame - liveAt - 40 - i * 12, fps, config: { damping: 12, stiffness: 160 } });
          return (
            <Chip key={c.text} bg={c.bg} color={c.color} size={36} style={{ scale: String(s), opacity: s > 0.01 ? 1 : 0 }}>
              {c.text}
            </Chip>
          );
        })}
      </div>

      {frame < clickAt + 40 && (
        <div style={{ opacity: 1 - pointerOut }}>
          <Pointer x={px} y={py} down={down} />
        </div>
      )}
    </AbsoluteFill>
  );
}

function LiveStamp({ frame, fps }: { frame: number; fps: number }) {
  const s = spring({ frame, fps, config: { damping: 8, stiffness: 200, mass: 0.8 } });
  const scale = interpolate(s, [0, 1], [3.2, 1]);
  const blink = Math.floor(frame / 24) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 1500,
        top: 64,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "16px 34px",
        background: C.red,
        boxShadow: ring(8),
        scale: String(scale),
        rotate: "-4deg",
        opacity: Math.min(1, frame / 4),
        zIndex: 20,
      }}
    >
      <div style={{ width: 28, height: 28, background: blink ? C.white : C.redLight, boxShadow: `0 0 0 5px ${C.ink}` }} />
      <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 76, color: C.white, lineHeight: 1, letterSpacing: 4, textShadow: `0 6px 0 ${C.redDeep}` }}>LIVE</span>
    </div>
  );
}

function EndCard({ frame, fps }: { frame: number; fps: number }) {
  const a = spring({ frame, fps, config: { damping: 10, stiffness: 140 } });
  const b = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 140 } });
  const c = spring({ frame: frame - 22, fps, config: { damping: 12, stiffness: 140 } });
  const walk = Math.round(interpolate(frame, [0, 4 * fps], [-80, 1920 + 80]) / 4) * 4;
  return (
    <AbsoluteFill>
      <Sunburst cy={0.5} turn={0.18} px={8} />
      <Embers frame={frame} count={34} colors={[C.white, C.sunPale]} size={8} seed="end" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26, paddingBottom: 80 }}>
        <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6), scale: String(a) }} />
        <Title size={112} style={{ scale: String(b) }}>
          barrelroyale<span style={{ color: C.red }}>.io</span>
        </Title>
        <div style={{ display: "flex", gap: 30, alignItems: "center", scale: String(c) }}>
          <Chip bg={C.red} color={C.white} size={52}>
            <span style={{ fontFamily: font.logo }}>is live</span>
          </Chip>
          <Chip size={52}>Pump crude. Earn Exxon.</Chip>
        </div>
      </AbsoluteFill>
      <Spr rows={roughneck} palette={base} scale={6} x={walk} y={958 - (Math.floor(frame / 8) % 2) * 6} />
    </AbsoluteFill>
  );
}
