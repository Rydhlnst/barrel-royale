import { C } from "@/lib/palette";
import { PixelIcon, Sprite } from "@/components/pixel/sprite";
import { barrel, base, boat } from "@/components/pixel/sprites";

type Variant = "sun" | "white" | "red";

export function Button({
  href,
  children,
  variant = "sun",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <a href={href} className={`btn btn-${variant} ${className}`}>
      {children}
    </a>
  );
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** A strip of chunky dither squares that hands one section colour to the next. */
export function Dither({ from, to }: { from: string; to: string }) {
  // staggered rows, so the squares read as a checker rather than columns
  const rows = ["X...X...", ".X.X.X.X", "XX.XXX.X", "XXXX.XXX"];
  const cells = rows
    .flatMap((row, r) => [...row].map((ch, x) => (ch === "X" ? `<rect x="${x * 8}" y="${r * 8}" width="8" height="8" fill="${to}"/>` : "")))
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" shape-rendering="crispEdges"><rect width="64" height="32" fill="${from}"/>${cells}</svg>`;
  return <div aria-hidden className="h-8 w-full" style={{ backgroundImage: svgUrl(svg), backgroundRepeat: "repeat-x" }} />;
}

/**
 * The deck and sea strip from the banner: steel deck plating, then open water
 * with pale pilings and a red boat bobbing past.
 */
export function SeaStrip() {
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="104" shape-rendering="crispEdges">
    <rect width="400" height="104" fill="${C.sea}"/>
    <rect width="400" height="4" fill="${C.ink}"/><rect y="4" width="400" height="8" fill="${C.steel}"/>
    <rect y="12" width="400" height="4" fill="${C.steelDeep}"/><rect y="16" width="400" height="4" fill="${C.ink}"/>
    <rect x="192" y="20" width="24" height="84" fill="${C.ink}"/><rect x="196" y="20" width="16" height="84" fill="#ffe58a"/>
    <rect x="32" y="46" width="24" height="4" fill="${C.foam}"/><rect x="120" y="46" width="24" height="4" fill="${C.foam}"/>
    <rect x="280" y="46" width="24" height="4" fill="${C.foam}"/><rect x="340" y="70" width="24" height="4" fill="${C.foam}"/>
    <rect x="72" y="70" width="24" height="4" fill="${C.foam}"/><rect x="236" y="88" width="24" height="4" fill="${C.foam}"/>
  </svg>`;
  return (
    <div aria-hidden className="relative h-[104px] w-full overflow-hidden" style={{ backgroundImage: svgUrl(tile), backgroundRepeat: "repeat-x" }}>
      <svg viewBox="0 0 28 7" shapeRendering="crispEdges" className="sail absolute top-[52px] h-[28px] w-[112px]">
        <Sprite rows={boat} palette={base} />
      </svg>
    </div>
  );
}

const tickerItems = [
  "Weekly XOM pool for rig holders",
  "Season 1 crew wars",
  "Storm warning on the Gulf shelf",
  "Six products, six markets",
  "Four rig classes, one sealed draw",
  "On Robinhood Chain",
];

export function Ticker() {
  const copies = [0, 1, 2, 3];
  return (
    <div className="relative z-10 flex h-16 items-center overflow-hidden border-y-[3px] border-brand-ink bg-brand-ink" role="marquee" aria-label={tickerItems.join(". ")}>
      <div className="ticker-track flex w-max" aria-hidden>
        {copies.map((n) => (
          <div key={n} className="flex shrink-0 items-center">
            {tickerItems.map((t) => (
              <span key={t} className="flex items-center gap-4 px-6 font-display text-lg uppercase text-brand-sun sm:px-10 sm:text-xl">
                <PixelIcon rows={barrel} palette={base} scale={3} />
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
