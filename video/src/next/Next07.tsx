import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, ease, font, ring, SeaScene, Spr, Title } from "../brand";

// next07, mobile: a roughneck's phone, held in hand on the deck of a ferry crossing the sea. A
// notification wakes it, a swipe opens the site, it hops into the wallet app, and then the real phone
// gameplay runs while a thumb works the stick and taps Drill or build. The rig in your pocket.

export const NEXT07_SECONDS = 16;

const s2f = (s: number) => Math.round(s * 60);
const PHONE = { x: 1300, y: 60, w: 392, h: 848 };
const LOCK_END = s2f(1.5);
const SITE = { start: s2f(1.8), end: s2f(7.4), from: 0.3, rate: 1.1 };
const SWITCH = s2f(7.4);
const GAME = { start: s2f(7.9), end: s2f(14), from: 6.0, rate: 1.3 };
const END = s2f(14);

/** Video time (s) of a moment in the phone gameplay footage. */
const atGame = (footage: number) => GAME.start / 60 + (footage - GAME.from) / GAME.rate;

const BEATS = [
  { at: 0, until: 1.8, big: "Your rig", small: "on the go" },
  { at: 1.9, until: 7.4, big: "Open it", small: "in your wallet app" },
  { at: 8.0, until: atGame(10.0), big: "Drag", small: "the stick to walk" },
  { at: atGame(10.0), until: 14, big: "Tap", small: "to drill and collect" },
];

function Screen({ frame, fps }: { frame: number; fps: number }) {
  const { w, h } = PHONE;
  // lock screen slides up and away to reveal the site
  const swipe = interpolate(frame, [LOCK_END, SITE.start], [0, -h], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const note = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  // the app switch: the screen squeezes shut and opens on the game
  const squeeze = frame >= SWITCH - 15 && frame < GAME.start ? Math.abs(interpolate(frame, [SWITCH - 15, SWITCH + 7, GAME.start], [1, 0, 1])) : 1;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: C.ink, scale: `${squeeze} 1` }}>
      {frame < GAME.start && (
        <Sequence from={SITE.start - 6} durationInFrames={SWITCH - SITE.start + 12} layout="none">
          <OffthreadVideo src={staticFile("footage/phone.mp4")} muted trimBefore={s2f(SITE.from)} playbackRate={SITE.rate} style={{ position: "absolute", width: w, height: h }} />
        </Sequence>
      )}
      {frame >= GAME.start - 2 && frame < END && (
        <Sequence from={GAME.start - 2} layout="none">
          <OffthreadVideo src={staticFile("footage/mplay.mp4")} muted trimBefore={s2f(GAME.from)} playbackRate={GAME.rate} style={{ position: "absolute", width: w, height: h }} />
        </Sequence>
      )}
      {frame < SITE.start && (
        <div style={{ position: "absolute", inset: 0, translate: `0 ${swipe}px`, background: `linear-gradient(${C.stormSky}, ${C.seaDeep})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginTop: 120, fontFamily: font.logo, fontWeight: 700, fontSize: 64, color: C.white }}>GM</div>
          <div style={{ marginTop: 40, width: w - 50, padding: "16px 18px", background: "rgba(255,255,255,0.94)", boxShadow: ring(4), display: "flex", gap: 14, alignItems: "center", translate: `0 ${(1 - note) * -160}px` }}>
            <Spr rows={logo} palette={logoPalette} scale={1} style={{ width: 48, height: 48 }} />
            <div>
              <div style={{ fontFamily: font.logo, fontSize: 18, color: C.ink }}>Barrel Royale</div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.ink2 }}>Your wells are full</div>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 26, width: 140, height: 8, background: C.white, opacity: 0.8 }} />
        </div>
      )}
      {frame >= END && (
        <div style={{ position: "absolute", inset: 0, background: C.sun, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(6) }} />
          <Spr rows={roughneck} palette={base} scale={9} />
        </div>
      )}
    </div>
  );
}

/** A thumb whose tip sits at (x, y) on the screen, pressed when `down`. */
function Thumb({ x, y, down }: { x: number; y: number; down: boolean }) {
  return (
    <div style={{ position: "absolute", left: x - 30, top: y - 14 + (down ? 8 : 0), width: 74, height: 170, rotate: "-18deg", transformOrigin: "30px 14px", zIndex: 5 }}>
      <div style={{ position: "absolute", inset: 0, background: C.skin, boxShadow: `0 0 0 6px ${C.ink}`, borderRadius: "36px 36px 8px 8px" }} />
      <div style={{ position: "absolute", left: 16, top: 10, width: 40, height: 34, background: "#ffe0c7", boxShadow: `0 0 0 4px ${C.skinShade}`, borderRadius: "18px 18px 6px 6px" }} />
    </div>
  );
}

export function Next07() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const sway = Math.round(Math.sin(frame / 40) * 6);
  const P = PHONE;
  // thumb targets on the screen, as fractions of the screen
  const rest = { x: P.x + 22 + 0.3 * P.w, y: P.y + 22 + 1.05 * P.h };
  const swipeStart = { x: P.x + 22 + 0.5 * P.w, y: P.y + 22 + 0.95 * P.h };
  let thumb = rest;
  let down = false;
  if (frame < SITE.start) {
    const k = interpolate(frame, [LOCK_END - 20, SITE.start], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    thumb = { x: swipeStart.x, y: swipeStart.y - k * 260 };
    down = k > 0 && k < 1;
  }
  const beat = BEATS.find((b) => t >= b.at && t < b.until);

  return (
    <AbsoluteFill style={{ background: C.foam, overflow: "hidden" }}>
      {/* sky and the sea rolling by: the ferry is moving */}
      <AbsoluteFill style={{ background: `linear-gradient(${C.sky}, ${C.foam} 60%)` }} />
      <div style={{ position: "absolute", left: -(frame * 3) % 1920, top: 0, width: 3840, height: 1080 }}>
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <SeaScene frame={frame * 2} y={430} showRig={false} boatX={-200} crane={false} />
        </div>
        <div style={{ position: "absolute", left: 1920, top: 0 }}>
          <SeaScene frame={frame * 2} y={430} showRig={false} boatX={-200} crane={false} />
        </div>
      </div>
      {/* the ferry's rail in front */}
      <div style={{ position: "absolute", left: 0, top: 900, width: 1920, height: 180, background: C.wood, boxShadow: `0 -8px 0 ${C.ink}` }} />
      <div style={{ position: "absolute", left: 0, top: 860, width: 1920, height: 18, background: C.sun, boxShadow: `0 0 0 6px ${C.ink}` }} />
      {Array.from({ length: 13 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 40 + i * 150, top: 860, width: 14, height: 60, background: C.ink }} />
      ))}

      {/* the copy on the left */}
      <div style={{ position: "absolute", left: 100, top: 90, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4) }} />
        <Chip bg={C.ink} color={C.sun} size={24}>
          <span style={{ fontFamily: font.logo }}>Barrel Royale mobile</span>
        </Chip>
      </div>
      {beat && frame < END && (
        <div key={beat.big} style={{ position: "absolute", left: 100, top: 330, scale: String(spring({ frame: frame - s2f(beat.at), fps, config: { damping: 11 } })), transformOrigin: "0 50%" }}>
          <Title size={140} color={C.sun}>
            {beat.big}
          </Title>
          <Title size={54}>{beat.small}</Title>
          {beat.big === "Open it" && (
            <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
              {["MetaMask", "Coinbase Wallet", "Trust Wallet"].map((w, i) => (
                <Chip key={w} bg={C.white} size={24} style={{ scale: String(spring({ frame: frame - s2f(beat.at) - 12 - i * 6, fps, config: { damping: 11 } })) }}>
                  {w}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}
      {frame >= END && (
        <div style={{ position: "absolute", left: 100, top: 300, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20, scale: String(spring({ frame: frame - END, fps, config: { damping: 11 } })), transformOrigin: "0 50%" }}>
          <Title size={96}>Your rig</Title>
          <Title size={96} color={C.sun}>
            in your pocket
          </Title>
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            <Chip bg={C.white} size={36}>
              <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
            </Chip>
            <Chip bg={C.ink} color={C.sun} size={36}>
              <span style={{ fontFamily: font.logo }}>@barrelroyale</span>
            </Chip>
          </div>
        </div>
      )}

      {/* the phone, held up from below */}
      <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - rise) * 1000 + sway}px` }}>
        <div style={{ position: "absolute", left: P.x - 70, top: P.y + P.h - 180, width: 300, height: 360, background: C.skin, boxShadow: `0 0 0 6px ${C.ink}`, borderRadius: "60px 60px 0 0" }} />
        <div style={{ position: "absolute", left: P.x, top: P.y, padding: 22, background: C.ink, boxShadow: `${ring(8)}, 0 0 0 14px ${C.steelLight}, 0 0 0 20px ${C.ink}`, borderRadius: 10 }}>
          <Screen frame={frame} fps={fps} />
        </div>
        <div style={{ position: "absolute", left: P.x + P.w + 36, top: P.y + P.h - 220, width: 120, height: 280, background: C.skin, boxShadow: `0 0 0 6px ${C.ink}`, borderRadius: "40px 0 0 40px" }} />
        {frame < SITE.start && <Thumb x={thumb.x} y={thumb.y} down={down} />}
        {frame >= SWITCH - 15 && frame < GAME.start - 2 && (
          <div style={{ position: "absolute", left: P.x + P.w / 2 - 170, top: P.y + P.h / 2 - 40, zIndex: 7, scale: String(spring({ frame: frame - SWITCH + 15, fps, config: { damping: 10 } })) }}>
            <Chip bg={C.leaf} color={C.white} size={30}>
              <span style={{ fontFamily: font.logo }}>Opening the rig</span>
            </Chip>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
