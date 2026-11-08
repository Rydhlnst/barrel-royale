import { AbsoluteFill, interpolate, random, spring } from "remotion";
import { crownBarrel, logo, logoPalette, xMark } from "@/components/pixel/sprites";
import { C, Chip, font, Spr, Title, ring, snap } from "../brand";

// The shared kit for the six gameplay episodes: key caps, HUD popups and
// counters, the level-start shutter that opens each one, the random pixel
// dissolve into the end card, and the end card itself.

export const EP_FPS = 60;

/** A keyboard key, pushed down while `down`. */
export function Key({ k, down = false, size = 64 }: { k: string; down?: boolean; size?: number }) {
  return (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: size,
        height: size,
        padding: "0 12px",
        background: down ? C.sun : C.white,
        color: C.ink,
        fontFamily: font.logo,
        fontWeight: 700,
        fontSize: size * 0.52,
        boxShadow: down ? `0 0 0 5px ${C.ink}, 0 3px 0 5px ${C.ink}` : `0 0 0 5px ${C.ink}, 0 10px 0 5px ${C.ink}`,
        translate: down ? "0 7px" : undefined,
        boxSizing: "border-box",
      }}
    >
      {k}
    </span>
  );
}

/** A prompt bubble: a key and what it does, with a tail pointing down. */
export function Prompt({ k, text, down = false, x, y, pop = 1 }: { k: string; text: string; down?: boolean; x: number; y: number; pop?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% -100%", scale: String(pop), transformOrigin: "50% 100%", zIndex: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 22px 20px", background: C.ink, boxShadow: ring(5, C.white) }}>
        <Key k={k} down={down} size={56} />
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.white, whiteSpace: "nowrap" }}>{text}</span>
      </div>
      <div style={{ width: 24, height: 18, background: C.ink, margin: "0 auto" }} />
    </div>
  );
}

/** "+12 bbl" style popup that rises and fades from `at`. */
export function Popup({ frame, at, x, y, children, color = C.sun, size = 48, life = 60 }: { frame: number; at: number; x: number; y: number; children: React.ReactNode; color?: string; size?: number; life?: number }) {
  const t = frame - at;
  if (t < 0 || t > life) return null;
  const rise = snap(interpolate(t, [0, life], [0, -120]), 4);
  const pop = interpolate(t, [0, 6, 12], [0.4, 1.25, 1], { extrapolateRight: "clamp" });
  const fade = interpolate(t, [life - 14, life], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y + rise, translate: "-50% -50%", scale: String(pop), opacity: fade, zIndex: 60, fontFamily: font.logo, fontWeight: 700, fontSize: size, color, textShadow: `4px 4px 0 ${C.ink}, -4px 4px 0 ${C.ink}, 4px -4px 0 ${C.ink}, -4px -4px 0 ${C.ink}, 0 9px 0 ${C.ink}`, whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

/** A HUD counter box: label on top, value below. */
export function Counter({ label, value, icon, bump = 0, color = C.ink }: { label: string; value: React.ReactNode; icon?: React.ReactNode; bump?: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 20px", background: C.white, boxShadow: ring(6), scale: String(1 + bump * 0.18) }}>
      {icon}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.ink2, lineHeight: 1 }}>{label}</span>
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 40, color, lineHeight: 1.1 }}>{value}</span>
      </div>
    </div>
  );
}

/** How much a counter should bump `frame` frames after a change at `at`. */
export const bumpAt = (frame: number, at: number) => (frame >= at && frame < at + 12 ? 1 - (frame - at) / 12 : 0);

/** A horizontal progress bar in pixel steps. */
export function Bar({ p, w = 400, h = 30, color = C.leaf, bg = C.white }: { p: number; w?: number; h?: number; color?: string; bg?: string }) {
  const steps = 20;
  const on = Math.round(Math.max(0, Math.min(1, p)) * steps);
  return (
    <div style={{ width: w, height: h, background: bg, boxShadow: ring(5), display: "flex", gap: 3, padding: 4, boxSizing: "border-box" }}>
      {Array.from({ length: steps }, (_, i) => (
        <div key={i} style={{ flex: 1, background: i < on ? color : "transparent" }} />
      ))}
    </div>
  );
}

/**
 * The level-start opener: two ink shutters hold the episode's number and title,
 * then split apart (top up, bottom down) to show the scene.
 */
export function Shutter({ frame, fps, ep, title, color, open = 72, tag }: { frame: number; fps: number; ep: number; title: string | string[]; color: string; open?: number; tag?: string }) {
  const lines = Array.isArray(title) ? title : [title];
  if (frame > open + 30) return null;
  const split = interpolate(frame, [open, open + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t });
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 9, stiffness: 220 } });
  const gap = snap(split * 600, 12);
  const stripe = `repeating-linear-gradient(135deg, ${C.ink} 0 40px, ${C.stormShade} 40px 80px)`;
  return (
    <AbsoluteFill style={{ zIndex: 200 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: -gap, height: 540, background: stripe, borderBottom: `12px solid ${color}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 540 + gap, height: 540, background: stripe, borderTop: `12px solid ${color}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: (lines.length > 1 ? 170 : 300) - gap, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <Chip bg={color} color={color === C.sun ? C.ink : C.white} size={54} style={{ scale: String(s(4)) }}>
          <span style={{ fontFamily: font.logo }}>{tag ?? `Ep ${ep}`}</span>
        </Chip>
        {lines.map((l, i) => (
          <Title key={l} size={100} style={{ scale: String(s(12 + i * 6)) }}>
            {l}
          </Title>
        ))}
        <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color: C.sunPale, opacity: frame % 30 < 18 ? 1 : 0.2 }}>Press start</span>
      </div>
    </AbsoluteFill>
  );
}

/** Blocks cover the frame in a random order from `start`, then clear the same way. */
export function Dissolve({ frame, start, color, size = 120, dur = 20 }: { frame: number; start: number; color: string; size?: number; dur?: number }) {
  const t = frame - start;
  if (t < 0 || t > dur * 2 + 4) return null;
  const cols = Math.ceil(1920 / size);
  const rows = Math.ceil(1080 / size);
  const blocks: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = random(`dis${r}-${c}`) * dur;
      const k2 = dur + 4 + random(`dis2${r}-${c}`) * dur;
      if (t >= k && t < k2) blocks.push(<div key={`${r}-${c}`} style={{ position: "absolute", left: c * size, top: r * size, width: size, height: size, background: color }} />);
    }
  }
  return <AbsoluteFill style={{ zIndex: 150 }}>{blocks}</AbsoluteFill>;
}

/** True once the dissolve from `start` has fully covered the frame. */
export const dissolved = (frame: number, start: number, dur = 20) => frame >= start + dur;

/** The end card: diagonal stripes in the episode's colour, the logo, the link and the handle. */
export function EpEnd({ frame, fps, ep, line, color, tag }: { frame: number; fps: number; ep: number; line: string; color: string; tag?: string }) {
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 10, stiffness: 170 } });
  const drift = (frame * 2) % 113;
  return (
    <AbsoluteFill style={{ background: `repeating-linear-gradient(135deg, ${color} 0 40px, ${C.ink} 40px 80px)`, backgroundPosition: `${drift}px 0` }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, padding: "30px 50px", background: C.ink, boxShadow: ring(10, C.white), scale: String(s(0)) }}>
          <Spr rows={logo} palette={logoPalette} scale={5} style={{ boxShadow: ring(5) }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: font.logo, fontWeight: 700, fontSize: 34, color }}>{tag ?? `Ep ${ep}`}</span>
            <Title size={84}>{line}</Title>
          </div>
        </div>
        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          <Chip bg={C.red} color={C.white} size={62} style={{ scale: String(s(10)) }}>
            <span style={{ fontFamily: font.logo }}>barrelroyale.io/play</span>
          </Chip>
          <Chip size={50} style={{ scale: String(s(18)) }}>
            <Spr rows={xMark} scale={4} />
            @barrelroyale
          </Chip>
        </div>
        <Spr rows={crownBarrel} scale={7} style={{ marginTop: 40, translate: `0 ${snap(Math.abs(Math.sin(frame / 10)) * 21, 7)}px`, scale: String(s(26)) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
