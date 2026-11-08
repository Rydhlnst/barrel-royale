import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { barrel, base, crownBarrel, drop, hat, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, font, Spr, Title, ring } from "../brand";

// The announcement card for posts on X: a still frame of the real game behind
// a dark column with a status chip, a two-tone headline, the key facts, a call
// to action and a footer; on the right, a tilted collage of crew cards. Each
// announcement is a set of props (ANNOUNCEMENTS below); render the 1920x1080
// still and scale it to 1600x900 with `npm run cards`.

export type Announcement = {
  /** "live" shows a green dot, "soon" an amber one. */
  tone: "live" | "soon";
  kicker: string;
  lines: [string, string];
  /** The facts line; wrap a phrase in [brackets] to set it in the accent colour. */
  facts: string;
  cta: [string, string];
  note?: string;
  /** Seconds into the play footage for the background frame. */
  at: number;
};

export const ANNOUNCEMENTS: Record<string, Announcement> = {
  GameLive: {
    tone: "live",
    kicker: "Live now",
    lines: ["The rig", "is open"],
    facts: "[$ROYAL holders] play now · Drill, refine and export for [XOM]",
    cta: ["Play on", "barrelroyale.io/play"],
    note: "Your rig is saved under your wallet address.",
    at: 10.2,
  },
  RigMintSoon: {
    tone: "soon",
    kicker: "Coming soon",
    lines: ["Rig mint", "loading"],
    facts: "[OG Roughnecks] first, then [Crew], then public",
    cta: ["Follow", "@barrelroyale"],
    note: "The class seed hash is posted before the first mint.",
    at: 47.8,
  },
};

/** "a [b] c" → spans with the bracketed parts in the accent colour. */
function rich(text: string, accent: string) {
  return text.split(/(\[[^\]]+\])/).map((part, i) =>
    part.startsWith("[") ? (
      <span key={i} style={{ color: accent }}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const CARDS = [
  { x: 1150, y: 90, w: 300, rot: -6, bg: C.sun, rows: roughneck, pal: hat(C.leaf, "#4fd08f"), prop: barrel },
  { x: 1520, y: 70, w: 300, rot: 5, bg: C.sunDeep, rows: roughneck, pal: hat(C.sea, C.foam), prop: icons.coin },
  { x: 1180, y: 690, w: 300, rot: 4, bg: C.redLight, rows: roughneck, pal: hat(C.red, C.redLight), prop: drop },
  { x: 1540, y: 680, w: 300, rot: -5, bg: "#b9a3e8", rows: roughneck, pal: hat("#7a4fc0", "#b9a3e8"), prop: icons.derrick },
];

function Card({ x, y, w, rot, bg, children }: { x: number; y: number; w: number; rot: number; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: w, background: bg, boxShadow: `${ring(8)}, 0 0 0 16px ${C.sunPale}, 0 0 0 22px ${C.ink}`, rotate: `${rot}deg`, overflow: "hidden", display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(135deg, transparent 0 24px, rgba(255,255,255,0.18) 24px 48px)` }} />
      {children}
    </div>
  );
}

export function Announce({ id = "GameLive" }: { id?: string }) {
  const a = ANNOUNCEMENTS[id];
  const dot = a.tone === "live" ? "#3dff9a" : C.sun;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {/* the game itself, behind everything */}
      <OffthreadVideo src={staticFile("footage/play.mp4")} muted trimBefore={Math.round(a.at * 60)} style={{ width: 1920, height: 1080, position: "absolute" }} />
      {/* the dark column, stepping off to the right */}
      {[
        [0, 980, 0.93],
        [980, 120, 0.75],
        [1100, 120, 0.55],
        [1220, 700, 0.35],
      ].map(([x, w, o]) => (
        <div key={x} style={{ position: "absolute", left: x, top: 0, width: w, height: 1080, background: C.ink, opacity: o }} />
      ))}

      {/* the collage */}
      {CARDS.map((c, i) => (
        <Card key={i} {...c}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <Spr rows={c.rows} palette={c.pal} scale={9} />
            <Spr rows={c.prop} palette={base} scale={6} />
          </div>
        </Card>
      ))}
      <div style={{ position: "absolute", left: 1300, top: 330, width: 420, height: 420, background: C.stormSky, boxShadow: `${ring(9)}, 0 0 0 18px ${C.sun}, 0 0 0 25px ${C.ink}`, rotate: "-2deg", display: "grid", placeItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 110, background: C.seaDeep }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, height: 14, background: C.steel, boxShadow: `0 0 0 4px ${C.ink}` }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 40 }}>
          <Spr rows={crownBarrel} palette={base} scale={10} />
          <Spr rows={roughneck} palette={base} scale={12} />
        </div>
      </div>

      {/* the text column */}
      <div style={{ position: "absolute", left: 110, top: 86, width: 860, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4, C.sun) }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 32, color: C.sun }}>Barrel Royale</span>
        </div>
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 14, padding: "10px 20px", background: a.tone === "live" ? "#0f2a20" : "#3a2a0c", boxShadow: ring(4, a.tone === "live" ? C.leaf : C.sunDeep) }}>
          <div style={{ width: 18, height: 18, background: dot }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: a.tone === "live" ? "#7dffb0" : C.sunPale, letterSpacing: 3 }}>{a.kicker}</span>
        </div>
        <Title size={140} style={{ marginTop: 30 }}>
          {a.lines[0]}
        </Title>
        <Title size={140} color={C.sun}>
          {a.lines[1]}
        </Title>
        <div style={{ marginTop: 30, fontFamily: font.display, fontWeight: 800, fontSize: 38, color: C.white, lineHeight: 1.3 }}>{rich(a.facts, C.sun)}</div>
        <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 18, padding: "18px 28px", background: C.sun, boxShadow: `${ring(6)}, 0 10px 0 6px ${C.sunDeep}` }}>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.ink2 }}>{a.cta[0]}</span>
          <span style={{ fontFamily: font.display, fontWeight: 900, fontSize: 40, color: C.ink }}>{a.cta[1]}</span>
        </div>
        {a.note && <div style={{ marginTop: 34, fontFamily: font.display, fontWeight: 700, fontSize: 28, color: C.sunPale }}>{a.note}</div>}
      </div>
      <div style={{ position: "absolute", left: 110, bottom: 60, fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.sun, letterSpacing: 3 }}>$ROYAL · barrelroyale.io · @barrelroyale</div>
    </AbsoluteFill>
  );
}
