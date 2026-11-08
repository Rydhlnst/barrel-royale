import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { barrel, base, icons, logo, logoPalette, roughneck } from "@/components/pixel/sprites";
import { C, Chip, Embers, font, Pointer, ramp, ring, Spr, Sunburst, Title, Window } from "../brand";

// The feature update for posts on X: a status chip ("Shipped" or "Now building"),
// a two-line title and three facts on the left, and the feature itself playing
// in a window or a phone on the right; site features scroll a screenshot of
// the live page (public/shots, from scripts/shots.mjs). Each update is a set of props (FEATURES
// below) plus a demo; `npm run features` renders the 1600x900 card at `still`
// and the 10 s video.

export const FEATURE_SECONDS = 10;

export type Feature = {
  status: "shipped" | "building";
  lines: [string, string];
  /** Wrap a phrase in [brackets] to set it in the accent colour. */
  facts: [string, string, string];
  demo: "chart" | "wallet" | "classes" | "home" | "docs";
  /** The frame the 1600x900 card is cut from. */
  still: number;
};

export const FEATURES: Record<string, Feature> = {
  FeatureLiveChart: {
    status: "shipped",
    lines: ["Live chart", "on the rig"],
    facts: ["A live [$ROYAL] chart, right in the rig's HUD", "Folds down to a small button when you need the deck", "Remembers your choice on this device"],
    demo: "chart",
    still: 560,
  },
  FeaturePhonePlay: {
    status: "shipped",
    lines: ["Play from", "your phone"],
    facts: ["Opens in [MetaMask], [Coinbase Wallet] or [Trust Wallet]", "Connecting is free and sends no transaction", "Your rig is saved to your wallet address"],
    demo: "wallet",
    still: 215,
  },
  FeatureRigClasses: {
    status: "building",
    lines: ["Rig class", "upgrades"],
    facts: ["Four classes, from [1.00x] up to [2.00x] output", "Raise your rig's class with [$ROYAL], which is burned", "Arrives with the on-chain game"],
    demo: "classes",
    still: 560,
  },
  FeatureGetRoyal: {
    status: "shipped",
    lines: ["Get $ROYAL", "on the site"],
    facts: ["[Enter the rig] and [Get $ROYAL], right on the homepage", "The contract address, with a one-tap [Copy]", "Official addresses are listed in the docs too"],
    demo: "home",
    still: 360,
  },
  FeatureWhatsLive: {
    status: "shipped",
    lines: ["What's live", "in the docs"],
    facts: ["Every feature and its status, in one table", "[12] features live today, from wells to the export terminal", "What comes next is marked [On-chain game] or [Season 1]"],
    demo: "docs",
    still: 230,
  },
};

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

/** A click at `at`: the pointer is pressed for a few frames. */
const pressed = (f: number, at: number) => f >= at && f < at + 8;

// ── the live chart in the rig's HUD ────────────────────────────────────────────

const CANDLES = Array.from({ length: 22 }, (_, i) => i).reduce<{ o: number; c: number; h: number; l: number }[]>((acc, i) => {
  const o = acc.length ? acc[acc.length - 1].c : 40;
  const c = o + (random(`c${i}`) - 0.32) * 16;
  acc.push({ o, c, h: Math.max(o, c) + random(`h${i}`) * 7, l: Math.min(o, c) - random(`l${i}`) * 7 });
  return acc;
}, []);

function ChartDemo({ f }: { f: number }) {
  const W = 830;
  const H = 540;
  const shown = Math.ceil(ramp(f, 110, 190) * CANDLES.length);
  // fold at 350, open again at 420
  const folded = f >= 352 && f < 422;
  const open = folded ? 0 : f < 352 ? 1 : spring({ frame: f - 422, fps: 60, config: { damping: 13 } });
  const lo = Math.min(...CANDLES.map((k) => k.l));
  const hi = Math.max(...CANDLES.map((k) => k.h));
  const PW = 430;
  const PH = 220;
  const y = (v: number) => PH - ((v - lo) / (hi - lo)) * PH;
  const panel = { right: 26, bottom: 26, width: 480, height: 300 };
  const foldBtn = { x: W - panel.right - 50, y: H - panel.bottom - panel.height + 18 };
  const smallBtn = { x: W - 26 - 120, y: H - 26 - 40 };
  const px = interpolate(f, [300, 345, 380, 415, 450, 500], [560, foldBtn.x + 8, foldBtn.x + 8, smallBtn.x + 40, smallBtn.x + 40, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(f, [300, 345, 380, 415, 450, 500], [520, foldBtn.y + 8, foldBtn.y + 8, smallBtn.y + 14, smallBtn.y + 14, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: C.foam }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, bottom: 0, background: C.sea }} />
      <div style={{ position: "absolute", left: 40, top: 150, width: 300, height: 380, background: C.steel, boxShadow: ring(6) }} />
      <div style={{ position: "absolute", left: 40, top: 150, width: 300, height: 40, background: C.steelDeep, boxShadow: `0 6px 0 ${C.ink}` }} />
      {[0, 1, 2].map((i) => (
        <Spr key={i} rows={barrel} palette={base} scale={6} x={70 + i * 88} y={440} />
      ))}
      <Spr rows={roughneck} palette={base} scale={6} x={150} y={300} />

      {open > 0.02 && (
        <div style={{ position: "absolute", ...panel, background: C.ink, boxShadow: ring(6, C.sun), transformOrigin: "100% 100%", scale: String(open) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: C.sun }}>$ROYAL</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "#0f2a20", boxShadow: ring(3, C.leaf), fontFamily: font.logo, fontSize: 16, color: "#7dffb0" }}>
              <span style={{ width: 10, height: 10, background: Math.floor(f / 30) % 2 ? "#3dff9a" : "#1d7a4c" }} />
              Live
            </span>
            <div style={{ marginLeft: "auto", width: 34, height: 34, background: C.sun, boxShadow: ring(3), display: "grid", placeItems: "center", fontFamily: font.logo, fontSize: 24, color: C.ink }}>–</div>
          </div>
          <div style={{ position: "relative", margin: "4px 24px", width: PW, height: PH }}>
            {[0.25, 0.5, 0.75].map((g) => (
              <div key={g} style={{ position: "absolute", left: 0, right: 0, top: PH * g, height: 2, background: "rgba(255,255,255,0.08)" }} />
            ))}
            {CANDLES.slice(0, shown).map((k, i) => {
              const up = k.c >= k.o;
              const col = up ? "#3dff9a" : C.redLight;
              return (
                <div key={i}>
                  <div style={{ position: "absolute", left: i * 19.5 + 6, top: y(k.h), width: 3, height: y(k.l) - y(k.h), background: col }} />
                  <div style={{ position: "absolute", left: i * 19.5, top: y(Math.max(k.o, k.c)), width: 15, height: Math.max(4, Math.abs(y(k.o) - y(k.c))), background: col }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {folded && (
        <div style={{ position: "absolute", right: 26, bottom: 26 }}>
          <Chip bg={C.sun} size={24}>
            <span style={{ fontFamily: font.logo }}>$ROYAL chart</span>
          </Chip>
        </div>
      )}
      {f >= 300 && <Pointer x={px} y={py} down={pressed(f, 345) || pressed(f, 415)} scale={4} />}
    </>
  );
}

// ── opening the game from a wallet app on a phone ─────────────────────────────

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 1180, top: 130, width: 440, height: 820, background: C.ink, boxShadow: `${ring(8)}, 0 0 0 16px ${C.sunPale}, 0 0 0 22px ${C.ink}`, borderRadius: 4 }}>
      <div style={{ position: "absolute", left: 160, top: 16, width: 120, height: 14, background: "#0b1226" }} />
      <div style={{ position: "absolute", left: 22, top: 44, right: 22, bottom: 44, background: C.white, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "36px 26px", boxSizing: "border-box", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

const WALLETS = ["MetaMask", "Coinbase Wallet", "Trust Wallet"];

function WalletDemo({ f }: { f: number }) {
  const step = f < 262 ? 0 : f < 352 ? 1 : 2;
  const body = { fontFamily: font.body, fontWeight: 800, fontSize: 24, color: C.ink2, lineHeight: 1.35 } as const;
  const head = { fontFamily: font.display, fontWeight: 700, fontSize: 38, color: C.ink, lineHeight: 1.1 } as const;
  const btn = (label: string, on = false) => (
    <div key={label} style={{ width: "100%", padding: "16px 0", background: on ? C.sunDeep : C.sun, boxShadow: ring(5), fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.ink }}>
      {label}
    </div>
  );
  // pointer: to MetaMask (tap 232), then to Connect (tap 322), then away
  const px = interpolate(f, [150, 200, 262, 300, 352, 400], [1600, 1420, 1420, 1420, 1420, 1700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(f, [150, 200, 262, 300, 352, 400], [980, 495, 495, 832, 832, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ok = spring({ frame: f - 360, fps: 60, config: { damping: 9, stiffness: 200 } });
  return (
    <>
      <Phone>
        <Spr rows={logo} palette={logoPalette} scale={2} />
        {step === 0 && (
          <>
            <div style={head}>Open Barrel Royale in your wallet app</div>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}>{WALLETS.map((w, i) => btn(w, i === 0 && f >= 236))}</div>
            <div style={{ ...body, fontSize: 20, marginTop: "auto" }}>barrelroyale.io/play</div>
          </>
        )}
        {step === 1 && (
          <>
            <div style={head}>Connect to play</div>
            <div style={body}>Your wallet is your rig&apos;s key. Connecting is free and sends no transaction.</div>
            <Spr rows={roughneck} palette={base} scale={7} />
            <div style={{ width: "100%", marginTop: "auto" }}>{btn("Connect wallet", f >= 326)}</div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ scale: String(ok), display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#0f2a20", boxShadow: ring(4, C.leaf), fontFamily: font.logo, fontSize: 20, color: "#7dffb0" }}>
              <span style={{ width: 12, height: 12, background: "#3dff9a" }} />
              Connected
            </div>
            <div style={{ ...head, fontSize: 34 }}>0x7a3f…c91e</div>
            <Spr rows={roughneck} palette={base} scale={8} />
            <div style={body}>Your rig is saved to this address, ready whenever you come back.</div>
            <div style={{ width: "100%", marginTop: "auto" }}>{btn("Row out to your rig")}</div>
          </>
        )}
      </Phone>
      {f >= 150 && f < 400 && <Pointer x={px} y={py} down={pressed(f, 232) || pressed(f, 322)} scale={5} />}
    </>
  );
}

// ── rig class upgrades ─────────────────────────────────────────────────────────

const CLASSES = [
  { name: "Jack-up", mult: 1, share: "60%", hat: C.steel },
  { name: "Semi-sub", mult: 1.25, share: "28%", hat: C.sea },
  { name: "Drillship", mult: 1.5, share: "10%", hat: C.red },
  { name: "Ultra-deepwater", mult: 2, share: "2%", hat: "#7a4fc0" },
];

function ClassesDemo({ f }: { f: number }) {
  const W = 830;
  // the rig steps up a class on each click: 300 → Semi-sub, 420 → Drillship
  const at = f < 304 ? 0 : f < 424 ? 1 : 2;
  const move = at === 0 ? 0 : spring({ frame: f - (at === 1 ? 304 : 424), fps: 60, config: { damping: 12 } });
  const col = 175;
  const x0 = 50;
  const markerX = x0 + col * (at === 0 ? 0 : at - 1 + move) + 10;
  const grow = ramp(f, 100, 70);
  const btn = { x: 330, y: 24 };
  const px = interpolate(f, [230, 290, 330, 410, 450, 500], [600, btn.x + 90, btn.x + 90, btn.x + 90, btn.x + 90, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(f, [230, 290, 330, 410, 450, 500], [500, btn.y + 22, btn.y + 22, btn.y + 22, btn.y + 22, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: C.sunPale }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(30,42,74,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(30,42,74,0.07) 2px, transparent 2px)`, backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", left: 40, top: 34, fontFamily: font.logo, fontWeight: 700, fontSize: 28, color: C.ink }}>Rig classes</div>
      <div style={{ position: "absolute", left: btn.x, top: btn.y, padding: "10px 22px", background: f >= 300 && f < 308 ? C.sunDeep : C.sun, boxShadow: ring(5), fontFamily: font.display, fontWeight: 700, fontSize: 28, color: C.ink }}>Upgrade</div>
      {CLASSES.map((c, i) => {
        const h = 60 + (c.mult - 1) * 170 * grow + 40 * grow;
        const x = x0 + i * col + 20;
        const mine = i === at;
        return (
          <div key={c.name}>
            <div style={{ position: "absolute", left: x, bottom: 110, width: 135, height: h, background: mine ? C.sun : C.white, boxShadow: ring(5) }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 10, textAlign: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink }}>{c.mult.toFixed(2)}x</div>
            </div>
            <Spr rows={icons.derrick} palette={{ ...base, G: c.hat }} scale={5} x={x + 28} y={540 - 110 - h - 90} />
            {mine && (
              <div style={{ position: "absolute", left: x - 6, top: 540 - 110 - h - 140, scale: String(at === 0 ? 1 : spring({ frame: f - (at === 1 ? 304 : 424), fps: 60, config: { damping: 9 } })) }}>
                <Chip bg={C.red} color={C.white} size={20}>
                  <span style={{ fontFamily: font.logo }}>Your rig</span>
                </Chip>
              </div>
            )}
            <div style={{ position: "absolute", left: x - 20, width: 175, bottom: 56, textAlign: "center", fontFamily: font.display, fontWeight: 700, fontSize: c.name.length > 10 ? 20 : 26, color: C.ink }}>{c.name}</div>
            <div style={{ position: "absolute", left: x - 20, width: 175, bottom: 24, textAlign: "center", fontFamily: font.body, fontWeight: 800, fontSize: 20, color: C.ink2 }}>{c.share} of rigs</div>
          </div>
        );
      })}
      {/* "your rig" marker */}
      <div style={{ position: "absolute", left: markerX, bottom: 10, width: 155, height: 6, background: C.red }} />
      {at > 0 && f - (at === 1 ? 304 : 424) < 70 && (
        <Embers frame={f - (at === 1 ? 304 : 424)} count={26} area={{ x: x0 + at * col + 20, y: 200, w: 135, h: 260 }} size={8} rise={3} seed={`up${at}`} />
      )}
      {f >= 230 && f < 500 && <Pointer x={px} y={py} down={pressed(f, 298) || pressed(f, 418)} scale={4} />}
    </>
  );
}

// ── site features: a screenshot of the live page, scrolling ──────────────────

/** A slice of the page, `w` page px wide from `x0`, fills the 830 px window; `scroll` is in page px. */
function PageDemo({ shot, x0, w, scroll, children }: { shot: string; x0: number; w: number; scroll: number; children?: React.ReactNode }) {
  const k = 830 / w;
  return (
    <>
      <Img src={staticFile(`shots/${shot}.png`)} style={{ position: "absolute", left: -x0 * k, top: -scroll * k, width: 1440 * k }} />
      {children}
    </>
  );
}

function HomeDemo({ f }: { f: number }) {
  const x0 = 220;
  const w = 1000;
  const k = 830 / w;
  const scroll = ramp(f, 100, 110) * 200;
  // page pixels of the Copy button and Get $ROYAL, in the window
  const at = (x: number, y: number) => ({ x: (x - x0) * k, y: (y - scroll) * k });
  const copy = at(914, 702);
  const get = at(822, 630);
  const px = interpolate(f, [220, 290, 330, 390], [700, copy.x - 6, copy.x - 6, get.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(f, [220, 290, 330, 390], [520, copy.y - 4, copy.y - 4, get.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const copied = spring({ frame: f - 300, fps: 60, config: { damping: 10, stiffness: 220 } });
  return (
    <PageDemo shot="home" x0={x0} w={w} scroll={scroll}>
      {f >= 300 && (
        <div style={{ position: "absolute", left: copy.x - 60, top: copy.y + 30, scale: String(copied), transformOrigin: "50% 0" }}>
          <Chip bg={C.leaf} color={C.white} size={20}>
            <span style={{ fontFamily: font.logo }}>Copied</span>
          </Chip>
        </div>
      )}
      {f >= 220 && <Pointer x={px} y={py} down={pressed(f, 296)} scale={4} />}
    </PageDemo>
  );
}

function DocsDemo({ f }: { f: number }) {
  // the "What's live today" table, scrolling from its title to its last row
  const scroll = 100 + ramp(f, 260, 300) * 530;
  const py = interpolate(f, [160, 240, 560], [560, 250, 430], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const px = interpolate(f, [160, 240], [760, 640], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <PageDemo shot="docs" x0={360} w={810} scroll={scroll}>
      {f >= 160 && <Pointer x={px} y={py} scale={4} />}
    </PageDemo>
  );
}

// ── the card ────────────────────────────────────────────────────────────────────

const URLS: Record<Feature["demo"], string> = { chart: "barrelroyale.io/play", wallet: "barrelroyale.io/play", classes: "barrelroyale.io/docs#rigs", home: "barrelroyale.io", docs: "barrelroyale.io/docs#status" };

export function FeatureUpdate({ id = "FeatureLiveChart" }: { id?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ft = FEATURES[id];
  const shipped = ft.status === "shipped";
  const s = (at: number, damping = 12) => spring({ frame: frame - at, fps, config: { damping, stiffness: 190 } });
  const win = s(40, 14);
  return (
    <AbsoluteFill style={{ background: C.sun, overflow: "hidden" }}>
      <Sunburst cx={0.72} cy={0.5} turn={0.05} />
      {/* the text column, on a stepped ink panel */}
      {[
        [0, 940, 1],
        [940, 26, 0.7],
        [966, 26, 0.4],
      ].map(([x, w, o]) => (
        <div key={x} style={{ position: "absolute", left: x, top: 0, width: w, height: 1080, background: C.ink, opacity: o }} />
      ))}

      <div style={{ position: "absolute", left: 100, top: 80, width: 800, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Spr rows={logo} palette={logoPalette} scale={3} style={{ boxShadow: ring(4, C.sun) }} />
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.sun }}>Barrel Royale</span>
        </div>
        <div style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 16, scale: String(s(14, 9)), transformOrigin: "0 50%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 20px", background: shipped ? "#0f2a20" : "#3a2a0c", boxShadow: ring(4, shipped ? C.leaf : C.sunDeep) }}>
            <div style={{ width: 18, height: 18, background: shipped ? "#3dff9a" : Math.floor(frame / 24) % 2 ? C.sun : C.sunDeep }} />
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 26, color: shipped ? "#7dffb0" : C.sunPale, letterSpacing: 3 }}>{shipped ? "Shipped" : "Now building"}</span>
          </div>
          <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 22, color: C.steelLight, letterSpacing: 3 }}>Feature update</span>
        </div>
        <div style={{ marginTop: 34, scale: String(s(26, 10)), transformOrigin: "0 50%" }}>
          <Title size={88}>{ft.lines[0]}</Title>
        </div>
        <div style={{ scale: String(s(36, 10)), transformOrigin: "0 50%" }}>
          <Title size={88} color={C.sun}>
            {ft.lines[1]}
          </Title>
        </div>
        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 30 }}>
          {ft.facts.map((fact, i) => {
            const k = s(90 + i * 22, 13);
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 20, opacity: Math.min(1, k * 1.5), translate: `${(1 - k) * -40}px 0` }}>
                <div style={{ flex: "none", marginTop: 6, width: 34, height: 34, background: shipped ? C.leaf : C.sunDeep, boxShadow: ring(4, C.white, "transparent"), display: "grid", placeItems: "center", fontFamily: font.logo, fontSize: 22, color: C.white }}>
                  {shipped ? "✓" : "+"}
                </div>
                <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 34, lineHeight: 1.3, color: C.white }}>{rich(fact, C.sun)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, bottom: 60, fontFamily: font.logo, fontWeight: 700, fontSize: 21, color: C.sun, letterSpacing: 2 }}>$ROYAL · barrelroyale.io · @barrelroyale</div>

      {/* the feature itself */}
      <div style={{ position: "absolute", inset: 0, translate: `${(1 - win) * 900}px 0` }}>
        {ft.demo === "wallet" ? (
          <WalletDemo f={frame} />
        ) : (
          <Window width={830} height={540} url={URLS[ft.demo]} style={{ left: 1030, top: 220, rotate: "1.5deg" }}>
            {ft.demo === "chart" ? <ChartDemo f={frame} /> : ft.demo === "home" ? <HomeDemo f={frame} /> : ft.demo === "docs" ? <DocsDemo f={frame} /> : <ClassesDemo f={frame} />}
          </Window>
        )}
      </div>
    </AbsoluteFill>
  );
}
