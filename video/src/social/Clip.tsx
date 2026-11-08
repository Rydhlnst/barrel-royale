import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, icons, logo, logoPalette } from "@/components/pixel/sprites";
import { C, Chip, Embers, font, PixelWipe, ring, snap, Spr, Sunburst, Title } from "../brand";

// Feature clips for posts on X: real footage of the site or the game, always
// shown whole in a frame on the right so the game's HUD is never cut off or
// covered, with the callout for each beat in the column on the left. Each clip
// is a set of shots and beats (CLIPS below); the footage comes from
// scripts/record.mjs and its marks in the .json. A phone shot plays in a
// phone inside the frame.

type Shot = {
  src: string;
  from: number;
  rate?: number;
  start: number;
  end: number;
  /** Plays the (portrait) footage in a phone at this spot and height (frame pixels) instead. */
  phone?: { x: number; y: number; h: number };
};

type Beat = { at: number; until: number; kicker: string; big: string; label?: string; sub: string };

export type Clip = {
  /** The chip under the logo; leave it out for gameplay tips. */
  status?: "shipped" | "building";
  seconds: number;
  shots: Shot[];
  beats: Beat[];
  link: string;
  /** A rig class card over the game, stepping up a class at each of these seconds. */
  classes?: number[];
};

export const CLIPS: Record<string, Clip> = {
  ClipVillage: {
    status: "shipped",
    seconds: 19,
    link: "barrelroyale.io/play",
    shots: [
      {
        src: "village",
        from: 0.6,
        start: 0,
        end: 19,
      },
    ],
    beats: [
      { at: 0.5, until: 3.6, kicker: "New on the rig", big: "Village", sub: "Tap Village, or take the boat at your dock" },
      { at: 4.6, until: 8.4, kicker: "Royal Harbor", big: "Live", label: "players", sub: "Every roughneck on the boardwalk, in real time" },
      { at: 8.8, until: 12.6, kicker: "Harbor chat", big: "Chat", sub: "What they say pops up over their heads" },
      { at: 13.0, until: 16.0, kicker: "By the fire", big: "Meet", label: "the crew", sub: "Your rig keeps pumping while you hang out" },
      { at: 16.4, until: 18.8, kicker: "Open now", big: "Royal Harbor", sub: "For $ROYAL holders at barrelroyale.io/play" },
    ],
  },
  ClipCollectSell: {
    status: "shipped",
    seconds: 20,
    link: "barrelroyale.io/play",
    shots: [
      {
        src: "qol",
        from: 1.0,
        start: 0,
        end: 20,
      },
    ],
    beats: [
      { at: 0.5, until: 6.6, kicker: "New on the rig", big: "Collect all", sub: "Every well's barrels in one tap at the tanks" },
      { at: 7.1, until: 9.3, kicker: "Storage tanks", big: "+168", label: "bbl", sub: "From all 12 wells in one tap" },
      { at: 10.0, until: 14.4, kicker: "Next stop", big: "Market", sub: "Walk over to the market terminal" },
      { at: 15.0, until: 17.2, kicker: "Market terminal", big: "Sell all", sub: "Everything in storage at the current prices" },
      { at: 17.6, until: 19.7, kicker: "Sold", big: "+704", label: "coins", sub: "The button shows the payout before you tap" },
    ],
  },
  ClipStorageLevels: {
    status: "shipped",
    seconds: 20,
    link: "barrelroyale.io/play",
    shots: [
      {
        src: "levels",
        from: 0.8,
        start: 0,
        end: 20,
      },
    ],
    beats: [
      { at: 0.5, until: 8.9, kicker: "Rig update", big: "Levels 6-8", sub: "Three new rig levels, live now" },
      { at: 9.6, until: 12.3, kicker: "Level 6", big: "320", label: "bbl", sub: "Up from 240 at level 5" },
      { at: 12.9, until: 16.2, kicker: "Level 7", big: "420", label: "bbl", sub: "Same 12 deck slots, more room in the tanks" },
      { at: 16.9, until: 19.7, kicker: "Level 8", big: "540", label: "bbl", sub: "More than double the old cap" },
    ],
  },
  ClipPhonePlay: {
    status: "shipped",
    seconds: 13,
    link: "barrelroyale.io/play",
    shots: [
      { src: "phone", from: 0, start: 0.3, end: 13, phone: { x: 757, y: 100, h: 880 } },
    ],
    beats: [
      { at: 0.5, until: 3.7, kicker: "barrelroyale.io", big: "Mobile", label: "ready", sub: "The whole site works on your phone" },
      { at: 4.0, until: 6.7, kicker: "Tap Enter the rig", big: "Connect", sub: "Free, and it sends no transaction" },
      { at: 7.0, until: 12.6, kicker: "Open it in your", big: "Wallet", label: "app", sub: "MetaMask, Coinbase Wallet or Trust Wallet" },
    ],
  },
  ClipGetRoyal: {
    status: "shipped",
    seconds: 14,
    link: "barrelroyale.io",
    shots: [
      {
        src: "getroyal",
        from: 0.4,
        start: 0,
        end: 14,
      },
    ],
    beats: [
      { at: 0.5, until: 4.3, kicker: "Live on barrelroyale.io", big: "Get $ROYAL", sub: "Right at the top of the homepage" },
      { at: 4.6, until: 7.8, kicker: "Contract address", big: "Copy", label: "in one tap", sub: "The official address, ready to paste" },
      { at: 8.2, until: 13.6, kicker: "Then", big: "Enter", label: "the rig", sub: "Open it in your wallet app and play" },
    ],
  },
  ClipWhatsLive: {
    status: "shipped",
    seconds: 14,
    link: "barrelroyale.io/docs",
    shots: [
      {
        src: "live",
        from: 1.0,
        start: 0,
        end: 14,
      },
    ],
    beats: [
      { at: 0.5, until: 4.5, kicker: "In the docs", big: "What's live", sub: "Every feature and its status, in one table" },
      { at: 4.8, until: 9.3, kicker: "Live today", big: "12", label: "features", sub: "From wells to the export terminal" },
      { at: 9.7, until: 13.6, kicker: "Coming next", big: "On-chain", label: "game", sub: "Rig NFTs, class upgrades and XOM claims" },
    ],
  },
  ClipRigClasses: {
    status: "building",
    seconds: 12,
    link: "barrelroyale.io/docs",
    classes: [1.6, 2.8, 4.0],
    shots: [
      { src: "play", from: 0.5, start: 0, end: 5.6 },
      {
        src: "rigs",
        from: 3.0,
        start: 5.6,
        end: 12,
      },
    ],
    beats: [
      { at: 0.5, until: 5.1, kicker: "Now building", big: "Rig classes", sub: "Your class multiplies every barrel" },
      { at: 6.1, until: 11.6, kicker: "On-chain game", big: "Up to 2.00x", sub: "Raise your class with $ROYAL, which is burned" },
    ],
  },
};

/** The footage frame: the full 1920×1080 picture scaled down, on the right. */
const FRAME = { k: 0.76, x: 431, y: 118 };
const FRAME_W = Math.round(1920 * FRAME.k);
const FRAME_H = Math.round(1080 * FRAME.k);
const SIDE = { x: 36, w: FRAME.x - 36 - 54 };

/** The callout for the beat on screen, in the column left of the frame. */
function CalloutBox({ beat, frame, fps }: { beat: Beat; frame: number; fps: number }) {
  const IN = Math.round(beat.at * fps);
  const OUT = Math.round(beat.until * fps);
  if (frame < IN || frame > OUT) return null;
  const box = spring({ frame: frame - IN, fps, config: { damping: 13, stiffness: 180 } });
  const big = spring({ frame: frame - IN - 12, fps, config: { damping: 8, stiffness: 220 } });
  const sub = spring({ frame: frame - IN - 28, fps, config: { damping: 11, stiffness: 200 } });
  // a stepped wipe in from the left, and back out
  const reveal = snap(Math.min(1, (frame - IN) / 14, (OUT - frame) / 10) * 100, 10);
  return (
    <div style={{ position: "absolute", left: SIDE.x, top: 330, width: SIDE.w, clipPath: `inset(-40px ${100 - reveal}% -40px -40px)` }}>
      <div style={{ position: "relative", padding: "44px 26px 28px", background: C.stormSky, boxShadow: `${ring(7)}, 0 0 0 12px ${C.sun}`, scale: String(interpolate(box, [0, 1], [0.9, 1], { extrapolateRight: "clamp" })), transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: 22, top: -24 }}>
          <Chip bg={C.red} color={C.white} size={20}>
            <span style={{ fontFamily: font.logo }}>{beat.kicker}</span>
          </Chip>
        </div>
        <div style={{ scale: String(interpolate(big, [0, 1], [1.4, 1], { extrapolateRight: "clamp" })), transformOrigin: "0 50%" }}>
          <Title size={52} color={C.sun} style={{ whiteSpace: "normal", lineHeight: 1.1 }}>
            {beat.big}
          </Title>
          {beat.label && (
            <Title size={34} style={{ whiteSpace: "normal", marginTop: 6 }}>
              {beat.label}
            </Title>
          )}
        </div>
        <div style={{ marginTop: 20, padding: "10px 14px", background: C.white, boxShadow: ring(4), fontFamily: font.display, fontWeight: 700, fontSize: 25, lineHeight: 1.25, color: C.ink, scale: String(sub), transformOrigin: "0 50%" }}>{beat.sub}</div>
      </div>
    </div>
  );
}

const CLASSES = [
  { name: "Jack-up", mult: "1.00x", tint: C.steel },
  { name: "Semi-sub", mult: "1.25x", tint: C.sea },
  { name: "Drillship", mult: "1.50x", tint: C.red },
  { name: "Ultra-deepwater", mult: "2.00x", tint: "#7a4fc0" },
];

/** A rig class card over the game, stepping up a class at each of `ups` seconds. */
function ClassCard({ frame, fps, ups, end }: { frame: number; fps: number; ups: number[]; end: number }) {
  if (frame > end * fps) return null;
  const t = frame / fps;
  const at = ups.filter((u) => t >= u).length;
  const last = at ? ups[at - 1] : 0;
  const pop = at ? spring({ frame: frame - Math.round(last * fps), fps, config: { damping: 8, stiffness: 240 } }) : spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const c = CLASSES[at];
  return (
    <div style={{ position: "absolute", left: 60, bottom: 90, width: 470, padding: "26px 30px", background: "rgba(30,42,74,0.92)", boxShadow: `${ring(7)}, 0 0 0 12px ${C.sun}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sunPale, letterSpacing: 2 }}>Rig class</span>
        <span style={{ fontFamily: font.logo, fontSize: 18, color: C.steelLight }}>Preview</span>
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ position: "relative", width: 110, height: 110, background: C.sunPale, boxShadow: ring(5), display: "grid", placeItems: "center" }}>
          <Spr rows={icons.derrick} palette={{ ...base, G: c.tint }} scale={5} />
        </div>
        <div style={{ scale: String(interpolate(pop, [0, 1], [1.4, 1], { extrapolateRight: "clamp" })), transformOrigin: "0 50%" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: c.name.length > 10 ? 32 : 40, color: C.white }}>{c.name}</div>
          <Title size={74} color={C.sun}>
            {c.mult}
          </Title>
        </div>
      </div>
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        {CLASSES.map((k, i) => (
          <div key={k.name} style={{ flex: 1, height: 18, background: i <= at ? C.sun : C.ink2, boxShadow: ring(3) }} />
        ))}
      </div>
      {at > 0 && frame - last * fps < 60 && <Embers frame={frame - Math.round(last * fps)} count={24} area={{ x: 30, y: 70, w: 120, h: 120 }} size={8} rise={3} seed={`cls${at}`} />}
    </div>
  );
}

/** Portrait footage in a phone frame that springs up into place. */
function PhoneShot({ shot, frame, fps }: { shot: Shot; frame: number; fps: number }) {
  const { x, y, h } = shot.phone!;
  const w = Math.round((h * 780) / 1688);
  const up = spring({ frame: frame - Math.round(shot.start * fps), fps, config: { damping: 13, stiffness: 150 } });
  return (
    <div style={{ position: "absolute", left: x - 22, top: y - 22, padding: 22, background: C.ink, boxShadow: `${ring(8)}, 0 0 0 16px ${C.sunPale}, 0 0 0 22px ${C.ink}`, borderRadius: 6, translate: `0 ${(1 - up) * 1100}px`, rotate: `${(1 - up) * 8 + 1.5}deg` }}>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: C.white }}>
        <Sequence from={Math.round(shot.start * fps)} durationInFrames={Math.round((shot.end - shot.start) * fps)} layout="none">
          <OffthreadVideo src={staticFile(`footage/${shot.src}.mp4`)} muted trimBefore={Math.round(shot.from * fps)} playbackRate={shot.rate ?? 1} style={{ width: w, height: h, display: "block" }} />
        </Sequence>
      </div>
    </div>
  );
}

export function FeatureClip({ id = "ClipGetRoyal" }: { id?: string }) {
  return <ClipView clip={CLIPS[id]} />;
}

/** The layout every clip and gameplay callout shares. */
export function ClipView({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shipped = clip.status === "shipped";
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {/* the footage, whole, scaled into its frame */}
      <div style={{ position: "absolute", left: FRAME.x - 6, top: FRAME.y - 6, width: FRAME_W + 12, height: FRAME_H + 12, background: C.ink, boxShadow: `${ring(6)}, 0 0 0 12px ${C.sun}, 0 0 0 18px ${C.ink}` }} />
      <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920, height: 1080, overflow: "hidden", transformOrigin: "0 0", transform: `scale(${FRAME.k})` }}>
        <Sunburst turn={0.05} />
        {clip.shots.map((shot) =>
          shot.phone ? (
            <PhoneShot key={shot.start} shot={shot} frame={frame} fps={fps} />
          ) : (
            <Sequence key={shot.start} from={Math.round(shot.start * fps)} durationInFrames={Math.round((shot.end - shot.start) * fps)}>
              <OffthreadVideo src={staticFile(`footage/${shot.src}.mp4`)} muted trimBefore={Math.round(shot.from * fps)} playbackRate={shot.rate ?? 1} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
            </Sequence>
          ),
        )}
        {clip.shots
          .filter((shot) => shot.start > 0 && !shot.phone)
          .map((shot) => (
            <PixelWipe key={shot.start} frame={frame} start={Math.round(shot.start * fps) - 22} />
          ))}
        {clip.classes && <ClassCard frame={frame} fps={fps} ups={clip.classes} end={clip.shots[0].end - 0.4} />}
      </div>

      {/* the column: logo, status and the callouts */}
      <div style={{ position: "absolute", left: SIDE.x, top: FRAME.y, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.ink, boxShadow: ring(5, C.sun) }}>
          <Spr rows={logo} palette={logoPalette} scale={2} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: C.sun }}>Barrel Royale</span>
        </div>
        {clip.status && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: shipped ? "#0f2a20" : "#3a2a0c", boxShadow: ring(4, shipped ? C.leaf : C.sunDeep) }}>
            <div style={{ width: 14, height: 14, background: shipped ? "#3dff9a" : Math.floor(frame / 24) % 2 ? C.sun : C.sunDeep }} />
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 20, color: shipped ? "#7dffb0" : C.sunPale, letterSpacing: 2 }}>{shipped ? "Shipped" : "Now building"}</span>
          </div>
        )}
      </div>
      {clip.beats.map((b) => (
        <CalloutBox key={b.at} beat={b} frame={frame} fps={fps} />
      ))}

      {/* the link, under the frame */}
      <div style={{ position: "absolute", right: 1920 - FRAME.x - FRAME_W, top: FRAME.y + FRAME_H + 30, scale: String(spring({ frame: frame - 70, fps, config: { damping: 11 } })), transformOrigin: "100% 0" }}>
        <Chip bg={C.sun} color={C.ink} size={26}>
          <span style={{ fontFamily: font.logo }}>{clip.link}</span>
        </Chip>
      </div>
    </AbsoluteFill>
  );
}
