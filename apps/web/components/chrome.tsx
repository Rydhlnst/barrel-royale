import Link from "next/link";
import { site } from "@/lib/site";
import { PixelIcon } from "@/components/pixel/sprite";
import { base, crownBarrel, xMark } from "@/components/pixel/sprites";
import { Button } from "@/components/ui";
import { FinaleScene } from "@/components/scenes/finale-scene";

// Site chrome shared by the landing page and the docs pages: logo, X button,
// pinned call to action, top bar for inner pages, and the footer.

export const pages = [
  { label: "Whitelist", href: site.links.whitelist },
  { label: "Docs", href: site.links.docs },
  { label: "Litepaper", href: site.links.litepaper },
  { label: "Roadmap", href: site.links.roadmap },
];

export function Logo({ className = "", outlined = true }: { className?: string; outlined?: boolean }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-3 ${className}`} aria-label={`${site.name} home`}>
      <PixelIcon rows={crownBarrel} palette={base} scale={3} />
      <span className={`font-logo text-base font-bold uppercase sm:text-2xl ${outlined ? "outlined-sm" : "text-brand-ink"}`}>
        Barrel <span className="text-brand-red">Royale</span>
      </span>
    </Link>
  );
}

/** A square button with the X mark, linking to the project's X account. */
export function XButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={site.links.x}
      aria-label={`${site.name} on X`}
      className={`pixel pixel-drop m-1 grid h-[52px] w-[52px] place-items-center bg-white transition-transform hover:-translate-y-0.5 max-sm:h-[46px] max-sm:w-[46px] ${className}`}
    >
      <PixelIcon rows={xMark} palette={base} scale={2} />
    </a>
  );
}

/** X and the whitelist, pinned top right on every page. On phones the X button moves into the page so it doesn't cover the logo. */
export function StickyCta() {
  return (
    <div className="fixed right-3 top-3 z-40 flex gap-2 sm:right-6 sm:top-4 sm:gap-3">
      <XButton className="max-sm:hidden" />
      <Button href={site.links.whitelist} variant="red">
        <span className="sm:hidden">Join</span>
        <span className="hidden sm:inline">Whitelist</span>
      </Button>
    </div>
  );
}

const navLink =
  "font-display font-bold text-brand-ink border-b-[3px] border-transparent hover:text-brand-red aria-[current=page]:text-brand-red aria-[current=page]:border-brand-red";

/**
 * Header for the inner pages, the same as the landing page's: transparent over
 * the page's sunburst, with the outlined logo and plain text links. The page
 * leaves room for it at the top.
 */
export function TopBar({ current }: { current: string }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-4 sm:px-8">
        <Logo />
        <nav aria-label="Pages" className="hidden gap-5 lg:flex">
          {pages.map((p) => (
            <a key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined} className={`text-base ${navLink}`}>
              {p.label}
            </a>
          ))}
        </nav>
      </div>
      <nav aria-label="Pages" className="flex gap-5 overflow-x-auto px-4 sm:px-8 lg:hidden">
        {pages.map((p) => (
          <a key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined} className={`shrink-0 text-sm ${navLink}`}>
            {p.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

/**
 * The closing scene (sunburst, sea, pier, the rig on the horizon) and the footer
 * below it. Anything passed in sits over the sky, like the hero's headline.
 */
export function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <section className="relative overflow-hidden border-t-[3px] border-brand-ink bg-brand-sun">
        <div aria-hidden className="finale-scene pointer-events-none absolute inset-x-0 bottom-0">
          <div className="finale-rays" />
        </div>
        <div className={`relative z-10 ${children ? "px-4 pt-16 sm:px-8 sm:pt-20" : "pt-10"}`}>{children}</div>
        <FinaleScene className="finale-scene relative block w-full" />
      </section>
      <footer className="bg-brand-ink px-4 py-12 text-[#c9d3e6] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <Logo />
            <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 font-display font-bold">
              {[...pages, { label: "Discord", href: site.links.discord }].map((n) => (
                <a key={n.label} href={n.href} className="text-brand-sun hover:text-white">
                  {n.label}
                </a>
              ))}
              <XButton className="h-11! w-11!" />
            </nav>
          </div>
          <p className="max-w-4xl text-sm leading-relaxed">
            {site.name} is an independent game on Robinhood Chain, not affiliated with Exxon Mobil or Robinhood. {site.reward} stock tokens are tokenized
            debt securities issued by Robinhood Assets (Jersey) Limited that track the Exxon Mobil share price without shareholder rights, available
            outside the US, Canada, the UK and Switzerland. Nothing on this site is financial advice.
          </p>
        </div>
      </footer>
    </>
  );
}
