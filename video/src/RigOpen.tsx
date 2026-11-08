import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sprite } from "@/components/pixel/sprite";
import { barrel, base, crownBarrel, drop, icons, logo, logoPalette, roughneck, xMark } from "@/components/pixel/sprites";
import { Bands, C, Chip, font, mono, Pointer, SeaScene, Spr, Stars, Title, ring, snap } from "./brand";

// 10 · Rig Open, as an "all hands on deck" broadcast. Everything plays on a
// pixel CRT in the radio room: it powers on, the whitelist gate shuts and gets
// stamped, a shift bulletin lights the rig up lamp by lamp from night to dawn,
// an odometer rolls to the holding line, three quick channels show connect,
// drill and stack, an iris opens on the end card, and the set powers off so the
// clip loops back into its own power-on.

export const RIG_OPEN_SECONDS = 14;
export const RIG_OPEN_END_FRAME = 790;

const CA = "0xca5cca2dff82c66c451181aa289ef614d826ea3a";

// the timeline, in frames at 60 fps
const T = {
  on: 26,
  bulletin: 186,
  hold: 424,
  connect: 580,
  drill: 620,
  stack: 660,
  iris: 694,
  end: 708,
  off: 800,
};
const STATIC: [number, number][] = [
  [170, 186],
  [410, 424],
  [566, 580],
  [614, 620],
  [654, 660],
];

// the set, and its screen; scenes are drawn at 1920 × 1080 and scaled in
const SCREEN = { x: 250, y: 92, w: 1420, h: 799 };
const K = SCREEN.w / 1920;

const TICKER = "All hands on deck  ·  Whitelist closed  ·  The rig is open to everyone  ·  Hold 1,000,000 $ROYAL to play  ·  barrelroyale.io/play  ·  ";

/** A small deterministic generator, so the static is the same on every render thread. */
function rng(seed: number) {
  let s = seed * 2654435761;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
}

/** TV static: grey pixels redrawn every frame on a tiny canvas, scaled up hard. */
function Static({ frame }: { frame: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = 160;
  const h = 90;
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    const r = rng(frame + 7);
    for (let i = 0; i < w * h; i++) {
      const v = r() > 0.5 ? 40 + Math.floor(r() * 215) : 20;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    // a bright rolling band
    const band = (frame * 7) % h;
    for (let y = band; y < Math.min(h, band + 6); y++) for (let x = 0; x < w; x++) img.data[(y * w + x) * 4 + 3] = 120;
    ctx.putImageData(img, 0, 0);
  }, [frame]);
  return <canvas ref={ref} width={w} height={h} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", imageRendering: "pixelated", zIndex: 40 }} />;
}

export function RigOpen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inStatic = STATIC.some(([a, b]) => frame >= a && frame < b);
  const channel = frame < T.bulletin ? 1 : frame < T.hold ? 2 : frame < T.connect ? 3 : frame < T.drill ? 4 : frame < T.stack ? 5 : frame < T.end ? 6 : 7;

  // power on: a line grows across, then opens up; power off is the reverse into a dot
  const onX = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const onY = interpolate(frame, [10, 24], [0.006, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const offY = interpolate(frame, [T.off, T.off + 12], [1, 0.006], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const offX = interpolate(frame, [T.off + 12, T.off + 22], [1, 0.01], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sx = frame < T.off ? onX : offX;
  const sy = frame < T.off ? onY : offY;
  const flash = frame < 30 ? interpolate(frame, [0, 24, 30], [1, 0.8, 0]) : frame >= T.off ? interpolate(frame, [T.off, T.off + 12], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const dark = frame >= T.off + 22;

  // the iris: a stepped circle closes on the montage and opens on the end card
  const irisR = frame < T.iris ? 1 : frame < T.iris + 12 ? 1 - (frame - T.iris) / 12 : frame < T.end ? 0 : Math.min(1, (frame - T.end) / 14);
  const r = Math.round((irisR * 1200) / 60) * 60;

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <Room frame={frame} />
      <Set frame={frame} channel={channel} />
      <div style={{ position: "absolute", left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, background: "#05070d", overflow: "hidden", borderRadius: 26 }}>
        {!dark && (
          <div style={{ position: "absolute", inset: 0, scale: `${sx} ${sy}`, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r}px at 50% 50%)` }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, scale: String(K), transformOrigin: "0 0" }}>
                {frame < 170 && <Gate frame={frame} fps={fps} />}
                {frame >= T.bulletin && frame < 410 && <Bulletin frame={frame - T.bulletin} fps={fps} />}
                {frame >= T.hold && frame < 566 && <Hold frame={frame - T.hold} fps={fps} />}
                {frame >= T.connect && frame < 614 && <Connect frame={frame - T.connect} fps={fps} />}
                {frame >= T.drill && frame < 654 && <Drill frame={frame - T.drill} />}
                {frame >= T.stack && frame < T.end && <Stack frame={frame - T.stack} fps={fps} />}
                {frame >= T.end && <End frame={frame - T.end} fps={fps} />}
                {!inStatic && frame >= T.on && frame < T.off && <Osd frame={frame} channel={channel} />}
                {frame >= T.on && frame < T.off && <Ticker frame={frame} />}
              </div>
            </div>
            {inStatic && <Static frame={frame} />}
            <div style={{ position: "absolute", inset: 0, background: C.white, opacity: flash, zIndex: 50 }} />
          </div>
        )}
        {/* the glass: scanlines and a dark edge */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, transparent 2px 5px)", zIndex: 60 }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.65)", zIndex: 61 }} />
        {frame >= T.off + 22 && frame < T.off + 34 && <div style={{ position: "absolute", left: SCREEN.w / 2 - 6, top: SCREEN.h / 2 - 6, width: 12, height: 12, background: C.white, opacity: 1 - (frame - T.off - 22) / 12, zIndex: 62 }} />}
      </div>
    </AbsoluteFill>
  );
}

/** The radio room behind the set: plank wall and a desk. */
function Room({ frame }: { frame: number }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: i * 90, width: 1920, height: 90, background: i % 2 ? C.stormShade : "#27305a", borderBottom: `6px solid ${C.ink}` }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 1010, width: 1920, height: 70, background: C.wood, borderTop: `8px solid ${C.woodDark}` }} />
      {/* the shift lamp on the wall blinks red while the broadcast runs */}
      <div style={{ position: "absolute", left: 66, top: 120, width: 64, height: 64, background: frame % 40 < 20 && frame < T.off ? C.red : C.redDeep, boxShadow: ring(6) }} />
      <div style={{ position: "absolute", left: 1790, top: 120, width: 64, height: 64, background: frame % 40 >= 20 && frame < T.off ? C.red : C.redDeep, boxShadow: ring(6) }} />
    </>
  );
}

/** The CRT's body: steel case, the channel readout, the LED and two knobs. */
function Set({ frame, channel }: { frame: number; channel: number }) {
  const on = frame < T.off + 22;
  return (
    <>
      <div style={{ position: "absolute", left: 200, top: 46, width: 1520, height: 960, background: C.steel, boxShadow: ring(10, C.ink, "rgba(0,0,0,0.4)") }}>
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 12, background: C.steelLight }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, right: 0, height: 12, background: C.steelDeep }} />
      </div>
      <div style={{ position: "absolute", left: SCREEN.x - 14, top: SCREEN.y - 14, width: SCREEN.w + 28, height: SCREEN.h + 28, background: C.ink, borderRadius: 34 }} />
      {/* the control strip */}
      <div style={{ position: "absolute", left: 250, top: 912, width: 1420, height: 74, display: "flex", alignItems: "center", gap: 30 }}>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 30, color: C.ink }}>Barrel Royale TV</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: font.logo, fontSize: 22, color: C.ink }}>CH</span>
          <div style={{ width: 86, height: 50, background: C.ink, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: on ? C.leaf : "#2a3a2a" }}>{on ? String(channel).padStart(2, "0") : "--"}</div>
        </div>
        {[0, 1].map((k) => {
          const notch = (channel + k * 2) % 4;
          const pos = [
            [21, 4],
            [38, 21],
            [21, 38],
            [4, 21],
          ][notch];
          return (
            <div key={k} style={{ position: "relative", width: 54, height: 54, background: C.steelDeep, boxShadow: ring(5) }}>
              <div style={{ position: "absolute", left: pos[0], top: pos[1], width: 12, height: 12, background: C.ink }} />
            </div>
          );
        })}
        <div style={{ width: 22, height: 22, background: on ? C.red : C.redDeep, boxShadow: `0 0 0 4px ${C.ink}${on && frame % 30 < 20 ? `, 0 0 18px ${C.red}` : ""}` }} />
      </div>
    </>
  );
}

/** On-screen display: LIVE and the channel's name. */
function Osd({ frame, channel }: { frame: number; channel: number }) {
  const names = ["", "Gate cam", "Shift bulletin", "Holder check", "Step 1", "Step 2", "Step 3", "Signing off"];
  return (
    <div style={{ position: "absolute", left: 50, top: 40, right: 50, display: "flex", justifyContent: "space-between", fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white, textShadow: `4px 4px 0 ${C.ink}`, zIndex: 30 }}>
      <span>
        <span style={{ color: C.red, opacity: frame % 50 < 30 ? 1 : 0.2 }}>■</span> Live
      </span>
      <span>
        CH {String(channel).padStart(2, "0")} · {names[channel]}
      </span>
    </div>
  );
}

/** The news ticker along the bottom of the screen. */
function Ticker({ frame }: { frame: number }) {
  const text = TICKER.repeat(4);
  const x = -((frame * 6) % 2600);
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width: 1920, height: 86, background: C.red, borderTop: `8px solid ${C.ink}`, overflow: "hidden", zIndex: 30 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 250, background: C.ink, color: C.sun, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 34, zIndex: 2 }}>Bulletin</div>
      <div style={{ position: "absolute", left: 270 + x, top: 18, whiteSpace: "nowrap", fontFamily: font.logo, fontWeight: 700, fontSize: 40, color: C.white }}>{text}</div>
    </div>
  );
}

/** CH 01 · the whitelist gate swings shut and the stamp slams. */
function Gate({ frame, fps }: { frame: number; fps: number }) {
  const shut = interpolate(frame, [40, 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t });
  const stampAt = 96;
  const stamp = spring({ frame: frame - stampAt, fps, config: { damping: 7, stiffness: 260 } });
  const clank = frame >= 76 && frame < 90 ? snap(Math.sin((frame - 76) * 3) * 10, 2) : 0;
  const slam = frame >= stampAt && frame < stampAt + 14 ? snap(Math.sin((frame - stampAt) * 3) * 14, 2) : 0;
  const bars = (side: -1 | 1) => (
    <div style={{ position: "absolute", top: 180, height: 760, width: 960, left: side < 0 ? -960 + shut * 960 : 1920 - shut * 960, display: "flex", justifyContent: "space-evenly", alignItems: "stretch" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 26, background: C.steelDeep, boxShadow: ring(6) }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, height: 26, background: C.steelDeep, boxShadow: ring(6) }} />
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} style={{ width: 30, background: C.steel, boxShadow: ring(6) }} />
      ))}
    </div>
  );
  return (
    <AbsoluteFill style={{ translate: `${clank + slam}px ${slam / 2}px` }}>
      <Bands colors={[C.stormSky, C.stormShade, C.storm]} heights={[400, 380, 300]} />
      <Stars frame={frame} count={40} h={500} />
      {/* the sign behind the gate */}
      <div style={{ position: "absolute", left: 560, top: 330, width: 800, height: 260, background: C.sunPale, boxShadow: ring(10), display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Spr rows={crownBarrel} scale={7} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 96, color: C.ink }}>Whitelist</span>
      </div>
      <div style={{ position: "absolute", left: 600, top: 590, width: 30, height: 420, background: C.woodDark }} />
      <div style={{ position: "absolute", left: 1290, top: 590, width: 30, height: 420, background: C.woodDark }} />
      {bars(-1)}
      {bars(1)}
      {frame >= stampAt && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", zIndex: 10 }}>
          <div style={{ scale: String(interpolate(stamp, [0, 1], [3.4, 1])), opacity: Math.min(1, stamp * 3), rotate: "-10deg", padding: "16px 54px", border: `16px solid ${C.red}`, background: C.white, boxShadow: ring(6) }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 150, color: C.red, letterSpacing: 6 }}>Closed</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// lamps on the rig, in the sea scene's art px; they switch on one by one
const LAMPS: [number, number][] = [
  [248, 5],
  [237, 24],
  [258, 24],
  [235, 35],
  [260, 35],
  [233, 47],
  [262, 47],
  [160, 66],
  [184, 66],
  [208, 66],
  [284, 66],
  [306, 66],
  [326, 66],
  [152, 22],
];

/** CH 02 · the shift whistle, then night to dawn as the rig's lamps come on and the crew walks on. */
function Bulletin({ frame, fps }: { frame: number; fps: number }) {
  if (frame < 50) {
    const on = Math.floor(frame / 6) % 2 === 0;
    return (
      <AbsoluteFill style={{ background: on ? C.red : C.ink, alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title size={190} color={on ? C.white : C.sun}>
          All hands
        </Title>
        <Title size={190} color={on ? C.white : C.sun}>
          on deck
        </Title>
      </AbsoluteFill>
    );
  }
  const t = frame - 50;
  const lit = Math.floor(t / 5);
  // dawn comes in three hard steps
  const step = t < 80 ? 0 : t < 100 ? 1 : 2;
  const sky = [
    [C.stormSky, C.stormShade, C.storm],
    [C.stormShade, C.redDeep, C.hat],
    [C.foam, "#bfe0ff", C.sky],
  ][step];
  const bright = [0.45, 0.72, 1][step];
  const crew = [0, 20, 40].map((d, i) => {
    const w = Math.max(0, t - 70 - d);
    const x = Math.min(196 + i * 24, 120 + w * 1.1);
    return { x: Math.round(x), y: 52 - (w > 0 && x < 196 + i * 24 ? Math.floor(w / 6) % 2 : 0), on: t >= 70 + d };
  });
  const words = "The rig is open".split("");
  const titleAt = 104;
  return (
    <AbsoluteFill>
      <Bands colors={sky} heights={[300, 260, 340]} />
      {step === 0 && <Stars frame={frame} count={50} h={560} />}
      <div style={{ position: "absolute", inset: 0, filter: `brightness(${bright})` }}>
        <SeaScene frame={frame} y={500} crane>
          {crew.map((c, i) => (c.on ? <Sprite key={i} rows={roughneck} palette={base} x={c.x} y={c.y} /> : null))}
        </SeaScene>
      </div>
      {/* the lamps, undimmed, over the scene */}
      <svg viewBox="0 0 480 150" width={1920} height={600} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 500, overflow: "visible" }}>
        {LAMPS.map(([x, y], i) =>
          i < lit ? (
            <g key={i}>
              <rect x={x - 3} y={y - 3} width={7} height={7} fill={C.flameCore} opacity={step === 2 ? 0.15 : 0.35} />
              <rect x={x - 1} y={y - 1} width={3} height={3} fill={i === 0 ? C.red : C.flameCore} />
            </g>
          ) : null,
        )}
      </svg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <div style={{ display: "flex" }}>
          {words.map((ch, i) => {
            const d = titleAt + i * 3;
            const y = t < d ? -400 : snap(interpolate(spring({ frame: t - d, fps, config: { damping: 9, stiffness: 220 } }), [0, 1], [-400, 0]), 6);
            return (
              <span key={i} style={{ display: "inline-block", translate: `0 ${y}px`, width: ch === " " ? 60 : undefined }}>
                <Title size={150} color={i >= 11 ? C.red : C.white}>
                  {ch === " " ? " " : ch}
                </Title>
              </span>
            );
          })}
        </div>
        {t > titleAt + 60 && (
          <Chip size={48} style={{ marginTop: 26, scale: String(spring({ frame: t - titleAt - 60, fps, config: { damping: 10 } })) }}>
            Open to everyone, right now
          </Chip>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** One odometer wheel that spins `turns` times and lands on `digit` at `stop`. */
function Wheel({ frame, digit, stop, turns }: { frame: number; digit: number; stop: number; turns: number }) {
  const h = 200;
  const p = interpolate(frame, [0, stop], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const pos = (turns * 10 + digit) * p;
  const off = Math.round(((pos % 10) * h) / 10) * 10;
  return (
    <div style={{ width: 130, height: h, overflow: "hidden", background: C.ink, boxShadow: ring(6, C.steelDeep), position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: -off, width: "100%" }}>
        {[...Array(11).keys()].map((n) => (
          <div key={n} style={{ height: h, display: "grid", placeItems: "center", fontFamily: font.logo, fontWeight: 700, fontSize: 150, color: frame >= stop ? C.sun : C.white }}>
            {n % 10}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: h / 2 - 3, height: 6, background: "rgba(0,0,0,0.3)" }} />
    </div>
  );
}

/** CH 03 · the holder check: an odometer rolls to 1,000,000 and ten barrels fill. */
function Hold({ frame, fps }: { frame: number; fps: number }) {
  const digits = [1, 0, 0, 0, 0, 0, 0];
  const lastStop = 30 + 6 * 9;
  const done = frame >= lastStop;
  const pass = spring({ frame: frame - lastStop - 4, fps, config: { damping: 7, stiffness: 240 } });
  return (
    <AbsoluteFill style={{ background: C.stormShade }}>
      <Bands colors={[C.stormShade, C.stormSky]} heights={[540, 540]} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150, gap: 40 }}>
        <Title size={100}>
          Hold <span style={{ color: C.sun }}>$ROYAL</span>
        </Title>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, padding: 26, background: C.steel, boxShadow: ring(10) }}>
          {digits.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
              <Wheel frame={frame} digit={d} stop={30 + i * 9} turns={3 + i} />
              {(i === 0 || i === 3) && <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 90, color: C.ink, lineHeight: 1 }}>,</span>}
            </div>
          ))}
        </div>
        {/* ten barrels, a hundred thousand each */}
        <div style={{ display: "flex", gap: 22 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const on = frame >= 30 + i * 6;
            return <Spr key={i} rows={barrel} palette={on ? base : { ...base, R: C.steelDeep, r: C.ink, W: C.steel }} scale={7} style={{ translate: on && frame < 36 + i * 6 ? "0 -12px" : undefined }} />;
          })}
        </div>
      </AbsoluteFill>
      {done && (
        <div style={{ position: "absolute", right: 150, top: 300, rotate: "8deg", scale: String(interpolate(pass, [0, 1], [3, 1])), opacity: Math.min(1, pass * 3) }}>
          <Chip bg={C.leaf} color={C.white} size={58}>
            <span style={{ fontFamily: font.logo }}>Rig unlocked</span>
          </Chip>
        </div>
      )}
    </AbsoluteFill>
  );
}

/** A quick channel: one big picture and its step name. */
function Channel({ n, name, color, children }: { n: number; name: string; color: string; children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ background: color }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>{children}</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
        {[1, 2, 3].map((k) => (
          <div key={k} style={{ width: 70, height: 70, display: "grid", placeItems: "center", background: k === n ? C.white : "rgba(255,255,255,0.25)", color: C.ink, fontFamily: font.logo, fontWeight: 700, fontSize: 40, boxShadow: k === n ? ring(5) : undefined }}>
            {k}
          </div>
        ))}
        <Title size={110} style={{ marginLeft: 20 }}>
          {name}
        </Title>
      </div>
    </AbsoluteFill>
  );
}

function Connect({ frame, fps }: { frame: number; fps: number }) {
  const pressed = frame >= 14;
  const pop = spring({ frame: frame - 14, fps, config: { damping: 8, stiffness: 240 } });
  return (
    <Channel n={1} name="Connect" color={C.sea}>
      <div style={{ display: "flex", alignItems: "center", gap: 50, padding: "40px 60px", background: C.white, boxShadow: ring(10) }}>
        <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
        <div style={{ padding: "26px 44px", background: pressed ? C.leaf : C.red, color: C.white, fontFamily: font.logo, fontWeight: 700, fontSize: 64, boxShadow: ring(7), scale: pressed ? String(0.9 + pop * 0.1) : undefined }}>{pressed ? "Connected" : "Connect"}</div>
      </div>
      <Pointer x={1180 - Math.min(frame, 12) * 6} y={560 - Math.min(frame, 12) * 4} down={frame >= 12 && frame < 18} scale={8} />
    </Channel>
  );
}

function Drill({ frame }: { frame: number }) {
  const pump = Math.floor(frame / 5) % 2;
  return (
    <Channel n={2} name="Drill" color={C.sunDeep}>
      <div style={{ position: "relative", width: 900, height: 520 }}>
        <Spr rows={icons.derrick} scale={26} x={142} y={20 + pump * 10} />
        {[0, 1, 2, 3].map((k) => {
          const t = (frame + k * 9) % 34;
          return <Spr key={k} rows={drop} scale={8} x={640 + (k % 2) * 90} y={420 - t * 12} />;
        })}
      </div>
    </Channel>
  );
}

function Stack({ frame, fps }: { frame: number; fps: number }) {
  const n = Math.min(9, Math.floor(frame / 3));
  return (
    <Channel n={3} name="Stack $XOM" color={C.leaf}>
      <div style={{ position: "relative", width: 600, height: 600 }}>
        {Array.from({ length: n }, (_, k) => (
          <Spr key={k} rows={icons.coin} scale={14} x={190 + (k % 2) * 16} y={460 - k * 56} style={{ scale: k === n - 1 ? String(spring({ frame: frame - k * 3, fps, config: { damping: 8 } })) : undefined }} />
        ))}
      </div>
    </Channel>
  );
}

/** CH 07 · signing off with the end card. */
function End({ frame, fps }: { frame: number; fps: number }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Bands colors={[C.ink, C.stormShade, C.stormSky]} heights={[360, 360, 360]} />
      <Stars frame={frame} count={60} h={1080} seed="endstars" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150, gap: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34, scale: String(s(6)) }}>
          <Spr rows={logo} palette={logoPalette} scale={6} style={{ boxShadow: ring(6) }} />
          <Title size={120} color={C.sun}>
            Barrel Royale
          </Title>
        </div>
        <Chip bg={C.red} color={C.white} size={66} style={{ scale: String(s(14)) }}>
          <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
        </Chip>
        <div style={{ display: "flex", alignItems: "stretch", boxShadow: ring(7), scale: String(s(22)) }}>
          <div style={{ background: C.sun, color: C.ink, fontFamily: font.logo, fontWeight: 700, fontSize: 40, padding: "0 26px", display: "flex", alignItems: "center" }}>CA</div>
          <div style={{ background: C.white, color: C.ink, fontFamily: mono, fontWeight: 700, fontSize: 42, padding: "18px 28px" }}>{CA}</div>
        </div>
        <Chip size={46} style={{ scale: String(s(30)) }}>
          <Spr rows={xMark} scale={4} />
          @barrelroyale
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
