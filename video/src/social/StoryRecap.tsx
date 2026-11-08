import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { base, hat, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, font, ring, Spr, Sunburst, Title } from "../brand";

// The recap in story mode: the rig's logbook on a desk, one page per update since launch. Each page has a
// photo of the real game on the left (always the whole picture, so the HUD stays in view), and on the right
// the log entry typing out under its chapter title, with a SHIPPED stamp. Pages turn between chapters, and
// the last page is left blank: to be continued.

export const STORY_RECAP_SECONDS = 38;
const s2f = (s: number) => Math.round(s * 60);

type Photo = { video: string; from: number; rate?: number; phone?: boolean } | { still: string };
type Entry = { title: string; text: string; photo: Photo };

const ENTRIES: Entry[] = [
  { title: "The rig opens", text: "$ROYAL goes live on Robinhood Chain and holders row out to their rigs. Drill, refine, sell.", photo: { video: "play", from: 0.5 } },
  { title: "Paint's dry", text: "$ROYAL is DEX Paid. The profile is up, logo and links in place.", photo: { still: "stills/dex-paid.png" } },
  { title: "Rig in your pocket", text: "Open the game in your wallet app. A stick to walk, a tap to drill.", photo: { video: "mplay", from: 8.5, phone: true } },
  { title: "Bigger tanks", text: "Rig levels 6, 7 and 8. Storage climbs to 540 bbl, and every level takes planning.", photo: { video: "levels", from: 6.0 } },
  { title: "One tap", text: "Collect from every well. Sell everything. One tap each.", photo: { video: "qol", from: 4.6 } },
  { title: "Royal Harbor", text: "A village for every rig. Walk the boardwalk, chat by the fire.", photo: { video: "village", from: 7.0 } },
  { title: "Daily Shift", text: "Five tasks a day, a bonus for all five, and a streak worth up to +100%.", photo: { video: "shiftfull", from: 4.0 } },
  { title: "Rig Foreman", text: "A crew boss who runs the rig on rounds, even while the game is closed.", photo: { video: "foremanback", from: 2.6 } },
];

const INTRO = 3.2;
const PAGE = 3.8;
const OUTRO = INTRO + ENTRIES.length * PAGE;
const END = OUTRO + 3.0;

const BOOK = { x: 150, y: 140, w: 1620, h: 820 };
const LEFT = { x: BOOK.x + 50, y: BOOK.y + 60, w: BOOK.w / 2 - 90 };
const RIGHT = { x: BOOK.x + BOOK.w / 2 + 50, y: BOOK.y + 70, w: BOOK.w / 2 - 110 };
const PHOTO = { w: LEFT.w - 40, h: Math.round(((LEFT.w - 40) * 9) / 16) };

/** The paper of one page: cream, ruled, with a stitched spine shadow. */
function Paper({ side }: { side: "left" | "right" }) {
  const x = side === "left" ? BOOK.x + 20 : BOOK.x + BOOK.w / 2;
  return (
    <div style={{ position: "absolute", left: x, top: BOOK.y + 20, width: BOOK.w / 2 - 20, height: BOOK.h - 40, background: "#fff7e3", boxShadow: `inset ${side === "left" ? "-" : ""}24px 0 30px -18px rgba(90,58,28,0.45)` }}>
      {Array.from({ length: 15 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 36, right: 36, top: 120 + i * 44, height: 2, background: "rgba(26,115,217,0.14)" }} />
      ))}
    </div>
  );
}

/** The photo pinned to the left page: the real game, whole, or a still. */
function Polaroid({ photo, start, frame, tilt }: { photo: Photo; start: number; frame: number; tilt: number }) {
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - s2f(start), fps, config: { damping: 12, stiffness: 160 } });
  const phone = "video" in photo && photo.phone;
  const ph = PHOTO.h + 10;
  const pw = phone ? Math.round((ph * 780) / 1688) : PHOTO.w;
  return (
    <div style={{ position: "absolute", left: LEFT.x + (LEFT.w - pw) / 2 - 18, top: LEFT.y + 40, padding: "18px 18px 70px", background: C.white, boxShadow: `${ring(5)}, 10px 14px 0 rgba(30,42,74,0.25)`, rotate: `${tilt}deg`, translate: `0 ${(1 - drop) * -500}px` }}>
      <div style={{ position: "relative", width: pw, height: ph, overflow: "hidden", background: C.ink }}>
        {"still" in photo ? (
          <Img src={staticFile(photo.still)} style={{ width: pw, height: ph, objectFit: "contain", background: C.ink }} />
        ) : (
          <Sequence from={s2f(start)} durationInFrames={s2f(PAGE + 0.2)} layout="none">
            <OffthreadVideo src={staticFile(`footage/${photo.video}.mp4`)} muted trimBefore={s2f(photo.from)} playbackRate={photo.rate ?? 1} style={{ width: pw, height: ph, display: "block" }} />
          </Sequence>
        )}
      </div>
      {/* tape on top */}
      <div style={{ position: "absolute", left: pw / 2 - 50, top: -16, width: 120, height: 34, background: "rgba(255,213,74,0.75)", rotate: "-3deg" }} />
    </div>
  );
}

function Entry({ entry, i, frame }: { entry: Entry; i: number; frame: number }) {
  const { fps } = useVideoConfig();
  const start = INTRO + i * PAGE;
  if (frame < s2f(start) || frame >= s2f(start + PAGE)) return null;
  const local = frame - s2f(start);
  const chars = Math.floor(Math.max(0, local - 26) * 1.35);
  const typed = entry.text.slice(0, chars);
  const stamp = spring({ frame: local - s2f(2.4), fps, config: { damping: 8, stiffness: 260 } });
  const head = spring({ frame: local - 8, fps, config: { damping: 12, stiffness: 200 } });
  // the page turns away at the end: the right half folds over the spine
  const turn = interpolate(local, [s2f(PAGE) - 16, s2f(PAGE)], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Polaroid photo={entry.photo} start={start} frame={frame} tilt={i % 2 ? 2.2 : -2.4} />
      <div style={{ position: "absolute", left: BOOK.x + BOOK.w / 2, top: BOOK.y + 20, width: BOOK.w / 2 - 20, height: BOOK.h - 40, transformOrigin: "0 50%", transform: `perspective(2400px) rotateY(${-turn}deg)`, backfaceVisibility: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "#fff7e3" }}>
          {Array.from({ length: 15 }, (_, k) => (
            <div key={k} style={{ position: "absolute", left: 36, right: 36, top: 120 + k * 44, height: 2, background: "rgba(26,115,217,0.14)" }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 50, top: 50, right: 60 }}>
          <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 24, color: C.red, letterSpacing: 3 }}>Chapter {i + 1}</div>
          <div style={{ marginTop: 14, scale: String(head), transformOrigin: "0 50%" }}>
            <Title size={54} color={C.ink} style={{ textShadow: "none", whiteSpace: "normal", lineHeight: 1.1 }}>
              {entry.title}
            </Title>
          </div>
          <div style={{ marginTop: 34, fontFamily: font.display, fontWeight: 700, fontSize: 38, lineHeight: 1.55, color: C.ink2, minHeight: 240 }}>
            {typed}
            {chars < entry.text.length && <span style={{ display: "inline-block", width: 16, height: 36, background: C.ink, marginLeft: 4, verticalAlign: "-6px", opacity: Math.floor(local / 15) % 2 ? 1 : 0.2 }} />}
          </div>
        </div>
        {local > s2f(2.4) && (
          <div style={{ position: "absolute", right: 70, bottom: 70, rotate: "-10deg", scale: String(interpolate(stamp, [0, 1], [2.4, 1], { extrapolateRight: "clamp" })), opacity: Math.min(1, stamp * 2) }}>
            <div style={{ padding: "10px 24px", border: `6px solid ${C.leaf}`, fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.leaf, letterSpacing: 6, background: "rgba(216,243,230,0.6)" }}>SHIPPED</div>
          </div>
        )}
        <div style={{ position: "absolute", left: 50, bottom: 60, fontFamily: font.logo, fontSize: 20, color: C.steelDeep, letterSpacing: 2 }}>
          {i + 1} / {ENTRIES.length}
        </div>
      </div>
    </>
  );
}

export function StoryRecap() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const open = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 120 } });
  const introOut = interpolate(t, [INTRO - 0.5, INTRO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outro = t >= OUTRO && t < END;
  const outroIn = spring({ frame: frame - s2f(OUTRO), fps, config: { damping: 12, stiffness: 180 } });
  const endIn = spring({ frame: frame - s2f(END), fps, config: { damping: 11, stiffness: 180 } });
  // the roughneck reading along at the bottom right, hat changing colour with each chapter
  const chapter = Math.max(0, Math.min(ENTRIES.length - 1, Math.floor((t - INTRO) / PAGE)));
  const hats: [string, string][] = [[C.sun, C.sunPale], [C.red, C.redLight], [C.sea, C.foam], [C.sunDeep, C.sunPale], [C.red, C.redLight], ["#7a4fc0", "#b9a3e8"], [C.sun, C.sunPale], [C.leaf, "#4fd08f"]];

  return (
    <AbsoluteFill style={{ background: "#5c3a1a", overflow: "hidden" }}>
      {/* the desk */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, #6b4520 0 120px, #5c3a1a 120px 124px, #7a4f27 124px 260px, #5c3a1a 260px 264px)" }} />
      <div style={{ position: "absolute", left: 60, top: 40, display: "flex", alignItems: "center", gap: 16 }}>
        <Spr rows={logo} palette={logoPalette} scale={2} style={{ boxShadow: ring(4, C.sun) }} />
        <Chip bg={C.ink} color={C.sun} size={24}>
          <span style={{ fontFamily: font.logo }}>Story mode · The rig so far</span>
        </Chip>
      </div>

      {/* the open logbook */}
      <div style={{ position: "absolute", left: BOOK.x, top: BOOK.y, width: BOOK.w, height: BOOK.h, background: "#7a2a22", boxShadow: `${ring(8)}, 0 20px 0 6px rgba(20,12,4,0.45)`, scale: String(interpolate(open, [0, 1], [0.86, 1], { extrapolateRight: "clamp" })) }} />
      <Paper side="left" />
      <Paper side="right" />
      <div style={{ position: "absolute", left: BOOK.x + BOOK.w / 2 - 6, top: BOOK.y + 20, width: 12, height: BOOK.h - 40, background: "rgba(90,58,28,0.35)" }} />

      {/* the cover page */}
      {t < INTRO && (
        <div style={{ position: "absolute", left: BOOK.x + BOOK.w / 2, top: BOOK.y + 20, width: BOOK.w / 2 - 20, height: BOOK.h - 40, background: "#8f3127", boxShadow: ring(6), opacity: introOut, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(6, C.sun) }} />
          <Title size={70} color={C.sun}>
            Rig logbook
          </Title>
          <div style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sunPale, letterSpacing: 3 }}>The story so far</div>
        </div>
      )}
      {t < INTRO && (
        <div style={{ position: "absolute", left: LEFT.x + 40, top: LEFT.y + 140, width: LEFT.w - 80, opacity: introOut }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 40, lineHeight: 1.5, color: C.ink2 }}>Every update since launch, one page at a time.</div>
        </div>
      )}

      {ENTRIES.map((e, i) => (
        <Entry key={e.title} entry={e} i={i} frame={frame} />
      ))}

      {/* the last page: blank, to be continued */}
      {outro && (
        <>
          <div style={{ position: "absolute", left: LEFT.x + 40, top: LEFT.y + 120, width: LEFT.w - 80, opacity: outroIn }}>
            <Title size={60} color={C.ink} style={{ textShadow: "none", whiteSpace: "normal" }}>
              Chapter 9
            </Title>
            <div style={{ marginTop: 24, fontFamily: font.display, fontWeight: 700, fontSize: 38, lineHeight: 1.5, color: C.ink2 }}>Next up on the roadmap: the rig mint.</div>
          </div>
          <div style={{ position: "absolute", left: RIGHT.x, top: RIGHT.y + 260, width: RIGHT.w, textAlign: "center", scale: String(outroIn) }}>
            <Title size={56} color={C.red} style={{ textShadow: "none", whiteSpace: "normal", lineHeight: 1.15 }}>
              To be continued
            </Title>
          </div>
        </>
      )}

      {/* the reader */}
      {t < END && (
        <div style={{ position: "absolute", right: 22, bottom: 24 }}>
          <Spr rows={roughneck} palette={hat(...hats[chapter])} scale={7} />
        </div>
      )}

      {t >= END && (
        <AbsoluteFill style={{ background: C.sun }}>
          <Sunburst turn={0.08} />
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, scale: String(endIn) }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
              <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
              <Spr rows={roughneck} palette={base} scale={12} />
            </div>
            <Title size={100}>Write the</Title>
            <Title size={100} color={C.red}>
              next chapter
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
      )}
    </AbsoluteFill>
  );
}
