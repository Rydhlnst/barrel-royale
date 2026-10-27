import { C } from "@/lib/palette";
import { site } from "@/lib/site";
import { PixelIcon, Pixels, Sprite, disc } from "@/components/pixel/sprite";
import { barrel, base, crownBarrel, hat, icons, roughneck, roughneckHead } from "@/components/pixel/sprites";
import { HeroScene } from "@/components/scenes/hero-scene";
import { CrewScene, PressureScene, RefineScene, RigClassScene, StormScene, type RigClass } from "@/components/scenes/small-scenes";
import { Button, Dither, Ticker } from "@/components/ui";
import { Footer, Logo, StickyCta, XButton } from "@/components/chrome";
import { CopyCa } from "@/components/copy-ca";
import { tiers } from "@/lib/whitelist-rules";

const nav = [
  { label: "How it works", href: "#how" },
  { label: "Gameplay", href: "#gameplay" },
  { label: "XOM", href: "#xom" },
  { label: "Fleet", href: "#fleet" },
  { label: "Whitelist", href: site.links.whitelist },
  { label: "Docs", href: site.links.docs },
  { label: "Litepaper", href: site.links.litepaper },
];

const steps = [
  { icon: crownBarrel, title: "Mint a rig", body: "Each rig is an NFT with its own class and production multiplier. Its well slots are where you drill." },
  { icon: icons.derrick, title: "Drill and pump", body: "Strike crude or gas, then ride the pressure. Push a well harder for a bigger haul, if you can keep it from blowing." },
  { icon: barrel, title: "Refine and sell", body: "Turn crude into diesel and jet fuel, then sell at the market index or fill a tanker contract for a premium." },
  { icon: icons.coin, title: `Claim ${site.reward} weekly`, body: `Rig holders claim their share of the week's ${site.reward} pool, weighted by the barrels their rig produced.` },
];

const features = [
  {
    scene: <PressureScene />,
    eyebrow: "Wells",
    title: "Ride the pressure",
    body: "Every well builds pressure while it pumps. Open the choke and it pays out faster, but past the red line it blows and the well is down until you cap it. Steady hands out-earn greedy ones.",
    hat: [C.hat, C.hatLight],
  },
  {
    scene: <RefineScene />,
    eyebrow: "Refinery",
    title: "Refine for the margin",
    body: "Crude and gas come out of the ground; diesel, jet fuel and LNG come out of your refinery. Chain the units, watch six markets, and sell whichever product pays best today.",
    hat: [C.red, C.redLight],
  },
  {
    scene: <StormScene />,
    eyebrow: "Incidents",
    title: "Brace for the storm",
    body: "Storms and sabotage hit on a clock. When the alarm sounds you get a few seconds to shut valves and lash down the cargo. Hold the rig and earn a bonus; miss it and oil goes overboard.",
    hat: [C.white, C.sky],
  },
  {
    scene: <CrewScene />,
    eyebrow: "Crews",
    title: "Win the crew war",
    body: "Crews of up to 20 rigs share a leaderboard each season, send saboteurs at their rivals and cover each other's decks. The top three crews split the season's bonus pool.",
    hat: [C.sea, C.foam],
  },
];

const flow = [
  { label: "Revenue", body: `Creator fees from ${site.token} and rig trading` },
  { label: "Treasury", body: `Pays running costs, then buys ${site.reward} with 40% of the rest` },
  { label: `${site.reward} vault`, body: "Holds the week's pool on-chain", key: true },
  { label: "Rig holders", body: `Claim ${site.reward} by production points` },
];

const classes: { kind: RigClass; name: string; rarity: string; body: string; mult: string }[] = [
  { kind: "jackup", name: "Jack-up", rarity: "Common · 60%", body: "Shallow-water workhorse. 6 well slots at launch.", mult: "1.00×" },
  { kind: "semisub", name: "Semi-sub", rarity: "Uncommon · 28%", body: "Floats over deeper fields. Produces a quarter more.", mult: "1.25×" },
  { kind: "drillship", name: "Drillship", rarity: "Rare · 10%", body: "Moves between fields. Half again the output.", mult: "1.50×" },
  { kind: "ultra", name: "Ultra-deepwater", rarity: "Legendary · 2%", body: "Reaches the richest reserves. Double output.", mult: "2.00×" },
];

const roadmap = [
  { when: "Done", status: "Done", title: "Foundation", items: ["Game loop and XOM reward model", "Website, docs and litepaper", "Playable browser prototype"] },
  { when: "Now", status: "Now", title: "Whitelist and community", items: ["Whitelist with referral ranks", "Browser game live at /play", "X account open"] },
  { when: "Launch day", status: "Launch", title: "Barrel Royale goes live", items: [`${site.token} on Robinhood Chain`, "Rig mint opens, class seed hash posted first", "Contracts and treasury multisig published"] },
  { when: "Weeks 1–2", status: "Next", title: "Treasury on-chain", items: ["Rig class reveal", "FeeSplitter live, first treasury report", `First ${site.reward} purchases into the vault`] },
  { when: "Weeks 3–6", status: "Planned", title: "On-chain game, testnet", items: ["Your rig NFT becomes your in-game rig", "Pressure, refinery and storm drills", "Audit starts"] },
];

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-4 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden gap-5 xl:flex">
          {nav.map((n) => (
            <a key={n.label} href={n.href} className="font-display text-base font-bold text-brand-ink hover:text-brand-red">
              {n.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Eyebrow({ children, className = "text-brand-red" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-display text-lg font-bold tracking-wide ${className}`}>{children}</p>;
}

/** The hero: headline on the sunburst, then the rig at sea, with the rays centred on the rig. */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-brand-sun">
      <div aria-hidden className="hero-scene pointer-events-none absolute inset-x-0 bottom-0">
        <div className="hero-rays" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 pt-28 text-center sm:pt-36">
        <span className="pixel bg-white px-3 py-1 font-display text-sm font-bold">Offshore drilling game · Robinhood Chain</span>
        <h1 className="outlined font-logo text-[44px] font-bold uppercase leading-[1.05] sm:text-7xl lg:text-[96px]">Barrel Royale</h1>
        <p className="outlined-sm font-logo text-xl font-bold uppercase sm:text-3xl">{site.tagline}</p>
        <p className="max-w-2xl pixel bg-white/90 px-4 py-3 text-base leading-relaxed sm:text-lg">
          <span className="sm:hidden">Run an offshore rig, sell barrels at market prices and claim {site.reward} every week.</span>
          <span className="hidden sm:inline">
            Run an offshore rig, drill wells, refine what comes up and sell it at prices that track the energy market. Every week, part of the
            project&apos;s revenue buys {site.reward} stock tokens for rig holders, split by how much oil each rig produced.
          </span>
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button href={site.links.whitelist} variant="red">
            Join the whitelist
          </Button>
          <Button href={site.links.play} variant="white">
            Play the game
          </Button>
        </div>
        <div className="mt-2 flex max-w-full items-stretch gap-2">
          <CopyCa className="min-w-0" />
          <XButton className="sm:hidden" />
        </div>
      </div>
      <HeroScene className="hero-scene relative mt-6 block w-full" />
    </section>
  );
}

function SectionHead({ eyebrow, title, children, dark = false }: { eyebrow: string; title: string; children?: React.ReactNode; dark?: boolean }) {
  return (
    <div className="grid items-end gap-5 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-3">
        <Eyebrow className={dark ? "text-brand-sun" : "text-brand-red"}>{eyebrow}</Eyebrow>
        <h2 className={`font-display text-4xl font-bold leading-[1.05] sm:text-5xl ${dark ? "text-white" : ""}`}>{title}</h2>
      </div>
      {children && <p className={`text-lg leading-relaxed ${dark ? "text-brand-foam" : "text-brand-ink-2"}`}>{children}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-4 bg-brand-sky px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="How it works" title="From the wellhead to your wallet in four steps" />
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="box flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center pixel bg-brand-sun font-display text-2xl font-bold">
                  0{i + 1}
                </span>
                <PixelIcon rows={s.icon} palette={base} scale={4} />
              </div>
              <h3 className="font-display text-2xl font-bold">{s.title}</h3>
              <p className="text-brand-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Badge({ colors }: { colors: readonly string[] }) {
  return (
    <svg viewBox="0 0 27 27" shapeRendering="crispEdges" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden>
      <Pixels items={disc(13, 13, 13, () => C.ink)} />
      <Pixels items={disc(13, 13, 12, () => C.sun)} />
      <Sprite rows={roughneckHead} palette={hat(colors[0], colors[1])} x={5} y={9} />
    </svg>
  );
}

function Gameplay() {
  return (
    <section id="gameplay" className="scroll-mt-4 bg-brand-sun-pale px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Gameplay" title="A game first, with a market underneath it">
          Short shifts with real decisions: how hard to push a well, what to refine, when to sell and how to hold the rig together when the weather
          turns.
        </SectionHead>
        <div className="mt-16 flex flex-col gap-20 sm:gap-24">
          {features.map((f, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={f.title} className={`flex flex-col items-center gap-10 md:gap-16 ${flip ? "md:flex-row-reverse" : "md:flex-row"}`}>
                <div className="relative w-full max-w-xl flex-1">
                  <div className={`frame absolute inset-0 ${flip ? "rotate-3" : "-rotate-3"}`} aria-hidden />
                  <div className={`frame relative ${flip ? "-rotate-2" : "rotate-2"}`}>{f.scene}</div>
                  <div className={`absolute -top-10 ${flip ? "-left-3" : "-right-3"}`}>
                    <Badge colors={f.hat} />
                  </div>
                </div>
                <div className="flex max-w-md flex-1 flex-col gap-3">
                  <Eyebrow>{f.eyebrow}</Eyebrow>
                  <h3 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{f.title}</h3>
                  <p className="text-lg leading-relaxed text-brand-ink-2">{f.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Xom() {
  return (
    <section id="xom" className="scroll-mt-4 bg-brand-sea px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow={`${site.reward} rewards`} title="Exxon Mobil stock tokens, paid to the people pumping" dark>
          {site.reward} on Robinhood Chain is an ERC-20 stock token that tracks Exxon Mobil shares. The treasury buys it in small weekly batches, so every
          purchase and every payout can be checked on-chain.
        </SectionHead>
        <ol className="mt-12 grid gap-4 md:grid-cols-4">
          {flow.map((n, i) => (
            <li key={n.label} className="relative">
              <div className={`box flex h-full flex-col gap-2 p-5 [--pxd:var(--color-brand-sea-deep)] ${n.key ? "bg-brand-sun" : ""}`}>
                <span className="font-display text-base font-bold uppercase tracking-wide text-brand-red">{n.label}</span>
                <strong className="text-lg leading-snug">{n.body}</strong>
              </div>
              {i < flow.length - 1 && (
                <span aria-hidden className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 font-display text-4xl font-bold text-brand-sun md:block">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="box mt-10 overflow-x-auto bg-white p-4 font-mono text-sm font-bold sm:text-base">
          your {site.reward} = weekly pool × your barrels ÷ barrels from all eligible rigs
        </p>
      </div>
    </section>
  );
}

function Fleet() {
  return (
    <section id="fleet" className="scroll-mt-4 bg-brand-sky px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="The fleet" title="Four rig classes, one sealed draw">
          Rig classes are locked by a seed committed on-chain before the mint and revealed after it. Nobody, including the team, can choose which rig
          gets which class.
        </SectionHead>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((c, i) => {
            const legend = i === classes.length - 1;
            return (
              <article key={c.kind} className={`box flex flex-col gap-3 p-5 ${legend ? "bg-brand-sun" : ""}`}>
                <div className="pixel">
                  <RigClassScene kind={c.kind} label={`A ${c.name} rig`} />
                </div>
                <Eyebrow className="text-base text-brand-red">{c.rarity}</Eyebrow>
                <h3 className="font-display text-3xl font-bold">{c.name}</h3>
                <p className={legend ? "" : "text-brand-ink-2"}>{c.body}</p>
                <span
                  className={`mt-auto self-start pixel px-3 font-display text-2xl font-bold ${legend ? "bg-brand-red text-white" : "bg-brand-sky"}`}
                >
                  {c.mult}
                </span>
              </article>
            );
          })}
        </div>
        <div className="box mt-10 flex flex-col items-start gap-4 bg-brand-sun-pale p-6 sm:flex-row sm:items-center">
          <PixelIcon rows={roughneck} palette={base} scale={4} />
          <p className="text-lg">
            <b>No rig? Play free.</b> Free players start on a starter platform with 3 well slots and earn season points. A rig is needed for {site.token} and{" "}
            {site.reward}.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhitelistBand() {
  return (
    <section id="whitelist" className="sunburst relative scroll-mt-4 overflow-hidden px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_minmax(0,560px)]">
        <div className="flex flex-col gap-5">
          <span className="pixel-sm self-start bg-white px-3 py-1 font-display text-sm font-bold">Whitelist · pre-launch</span>
          <h2 className="outlined font-logo text-4xl font-bold uppercase leading-tight sm:text-6xl">Claim your spot on the rig</h2>
          <p className="pixel max-w-xl bg-white/90 px-4 py-3 text-lg leading-relaxed">
            We&apos;re building the crew before launch. Join with your wallet and X handle, bring friends with your referral link, and climb the list.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href={site.links.whitelist} variant="red">
              Join the whitelist
            </Button>
            <Button href={`${site.links.whitelist}#tiers`} variant="white">
              See the tiers
            </Button>
          </div>
        </div>
        <ol className="flex flex-col gap-4">
          {tiers.map((t, i) => (
            <li key={t.name} className={`box flex items-center gap-4 p-4 sm:p-5 ${i === 0 ? "bg-brand-sun-pale" : ""}`}>
              <PixelIcon rows={[crownBarrel, icons.hardHat, barrel][i]} palette={base} scale={3} className="shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-extrabold uppercase tracking-wide text-brand-ink-2">
                  {i === 0 ? `Top ${t.upTo}` : t.upTo === Infinity ? "Everyone else" : `Next ${t.upTo - tiers[i - 1].upTo}`}
                </span>
                <h3 className="font-display text-2xl font-bold">{t.name}</h3>
                <p className="text-brand-ink-2">{t.perks.join(" · ")}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section id="roadmap-preview" className="scroll-mt-4 bg-brand-sun-pale px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHead eyebrow="Roadmap" title="Launch first, then build in the open">
          On-chain gameplay and {site.reward} claims follow in stages, each behind a public checkpoint. Timing after launch is an estimate.
        </SectionHead>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {roadmap.map((r) => {
            const done = r.status === "Done";
            const now = r.status === "Now";
            return (
              <li key={r.title} className={`box flex flex-col gap-3 p-5 ${now ? "bg-brand-sun" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-brand-ink-2">{r.when}</span>
                  <span
                    className={`pixel-sm px-2 text-xs font-extrabold uppercase tracking-wide ${done ? "bg-[#cff3e0]" : now ? "bg-white" : "bg-brand-sky"}`}
                  >
                    {r.status}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold leading-tight">{r.title}</h3>
                <ul className="flex flex-col gap-2 text-[15px]">
                  {r.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span aria-hidden className={`mt-1.5 h-3 w-3 shrink-0 pixel-sm ${done ? "bg-brand-leaf" : "bg-white"}`} />
                      {it}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <div className="mt-10">
          <Button href={site.links.roadmap}>See the full roadmap</Button>
        </div>
      </div>
    </section>
  );
}

/** The closing call to play, set over the sky of the closing scene. */
function PlayCopy() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
      <h2 className="outlined font-logo text-4xl font-bold uppercase leading-tight sm:text-6xl">The rig is open</h2>
      <p className="pixel max-w-xl bg-white/90 px-4 py-3 text-lg">
        No wallet needed. Drill your first wells, ride the pressure and fill a contract in a few minutes, right in your browser.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href={site.links.play} variant="red">
          Play now
        </Button>
        <Button href={site.links.docs} variant="white">
          Read the docs
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <StickyCta />
      <main>
        <Hero />
        <Ticker />
        <HowItWorks />
        <Dither from={C.sky} to={C.sunPale} />
        <Gameplay />
        <Dither from={C.sunPale} to={C.sea} />
        <Xom />
        <Dither from={C.sea} to={C.sky} />
        <Fleet />
        <Dither from={C.sky} to={C.sunDeep} />
        <WhitelistBand />
        <Dither from={C.sunDeep} to={C.sunPale} />
        <Roadmap />
      </main>
      <Footer>
        <PlayCopy />
      </Footer>
    </>
  );
}
