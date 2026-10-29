import type { Metadata } from "next";
import { site } from "@/lib/site";
import { VAULT } from "@/lib/vault";
import { PixelIcon } from "@/components/pixel/sprite";
import { barrel, base, crownBarrel, icons } from "@/components/pixel/sprites";
import { DocPage } from "@/components/doc/doc";

export const metadata: Metadata = {
  title: `Roadmap · ${site.name}`,
  description: `${site.name} roadmap: launch, treasury, the on-chain game, Season 1 and the first ${site.reward} claims, each behind a public checkpoint.`,
};

type Status = "done" | "now" | "next" | "later";

const phases: { when: string; status: Status; title: string; icon: readonly string[]; items: { text: string; ok?: boolean }[]; gate?: string }[] = [
  {
    when: "Before launch",
    status: "done",
    title: "Foundation",
    icon: icons.hardHat,
    items: [
      { text: `Game loop and ${site.reward} reward model`, ok: true },
      { text: "Website, docs and litepaper", ok: true },
      { text: "Playable browser prototype", ok: true },
      { text: "Treasury and reward vault rules published", ok: true },
    ],
  },
  {
    when: "Phase 1",
    status: "done",
    title: "Whitelist and community",
    icon: icons.hardHat,
    items: [
      { text: "Whitelist open, with referral ranks and three tiers", ok: true },
      { text: "Browser game built: pressure and choke, refinery, Dispatch contracts, storm brace", ok: true },
      { text: `Export terminal for ${site.reward} in the browser game`, ok: true },
      { text: "X account open at @barrelroyale", ok: true },
    ],
  },
  {
    when: "Phase 2",
    status: "now",
    title: `${site.name} goes live`,
    icon: crownBarrel,
    items: [
      { text: `${site.reward} vault, rig NFT and treasury contracts live on Robinhood Chain, owned by the treasury Safe`, ok: true },
      { text: `${site.reward} vault running with its ${VAULT.timelockDays}-day timelock and withdrawal limits`, ok: true },
      { text: "Contract addresses published in the docs", ok: true },
      { text: "Whitelist snapshot taken and tiers published" },
      { text: `${site.token} live on Robinhood Chain`, ok: true },
      { text: `Browser game open to ${site.token} holders, with a live chart in the game`, ok: true },
      { text: "Play from your phone: open the game in your wallet app, with touch controls", ok: true },
      { text: "Rig levels 6 to 8, with storage up to 540 bbl", ok: true },
      { text: "Royal Harbor: a shared village where roughnecks meet and chat", ok: true },
      { text: "Rig Foreman: runs your rig on rounds, even while the game is closed", ok: true },
      { text: "Tanker Day: a tanker every few hours buys in bulk at a premium", ok: true },
      { text: "Gushers: a well that strikes a pocket and gushes for a minute and a half", ok: true },
      { text: "Medals: long-term goals in four tiers, with coin rewards", ok: true },
      { text: "Rig mint: OG Roughnecks first, then Crew, then public; class seed hash posted before the first mint" },
    ],
    gate: `rig mint open and ${site.token} trading live`,
  },
  {
    when: "Weeks 1–2",
    status: "next",
    title: "Treasury on-chain",
    icon: icons.coin,
    items: [
      { text: "Rig class reveal" },
      { text: "First treasury report with links to every transaction" },
      { text: `First ${site.reward} purchases, held in the vault until claims open` },
    ],
    gate: `the first ${site.reward} purchases land in the vault`,
  },
  {
    when: "Weeks 3–6",
    status: "later",
    title: "On-chain game on testnet",
    icon: icons.derrick,
    items: [
      { text: "Wallet connect; your rig NFT becomes your in-game rig" },
      { text: "Game server with shifts, crews and raids" },
      { text: `${site.reward} vault and weekly Merkle claims on testnet` },
      { text: "Contract source published with its test suite" },
    ],
    gate: `a full test week runs from drilling to ${site.reward} claim with no critical bugs`,
  },
  {
    when: "Weeks 7–10",
    status: "later",
    title: `Season 1 and first ${site.reward} claims`,
    icon: barrel,
    items: [
      { text: "Treasury report for the first full month" },
      { text: `${site.reward} claim page in the app` },
      { text: "On-chain game on mainnet; Season 1 and crew wars start" },
      { text: `First ${site.reward} claims, including ${site.reward} bought since launch` },
    ],
    gate: "the first round checked against the published export ledger",
  },
  {
    when: "After Season 1",
    status: "later",
    title: "Growing the platform",
    icon: icons.storm,
    items: [
      { text: "Crew projects, like the first undersea pipeline" },
      { text: "Cosmetics marketplace and more events" },
      { text: "A second rig site with new products" },
      { text: "Community votes on the next season's rules" },
    ],
  },
];

const statusLabel: Record<Status, string> = { done: "Done", now: "Now", next: "Next", later: "Planned" };
const statusStyle: Record<Status, string> = {
  done: "bg-[#cff3e0]",
  now: "bg-brand-sun",
  next: "bg-white",
  later: "bg-brand-sky",
};
const lineStyle: Record<Status, string> = {
  done: "border-solid border-brand-leaf",
  now: "border-solid border-brand-red",
  next: "border-dashed border-brand-ink/40",
  later: "border-dashed border-brand-ink/40",
};

export default function Roadmap() {
  return (
    <DocPage
      current={site.links.roadmap}
      eyebrow="Roadmap"
      title="Launch first, then build in the open"
      lede={`${site.token} is live, the browser game is open to holders, and the ${site.name} contracts are on Robinhood Chain. Next comes the rig mint, then on-chain gameplay and ${site.reward} claims in stages, each behind a public checkpoint.`}
    >
      <ol className="mx-auto w-full max-w-4xl" style={{ listStyle: "none", paddingLeft: 0, gap: 0 }}>
        {phases.map((p) => (
          <li key={p.title} className="grid gap-x-8 sm:grid-cols-[150px_minmax(0,1fr)]">
            <p className="pt-7 font-display text-lg font-bold text-brand-ink-2">{p.when}</p>
            <div className={`relative border-l-[5px] pb-10 pl-8 pt-5 ${lineStyle[p.status]}`}>
              <span
                aria-hidden
                className={`absolute -left-[16px] top-7 h-[27px] w-[27px] pixel ${p.status === "done" ? "bg-brand-leaf" : p.status === "now" ? "bg-brand-red" : "bg-white"}`}
              />
              <div className={`box flex flex-col gap-3 p-5 sm:p-6 ${p.status === "now" ? "bg-brand-sun-pale" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <span className={`self-start pixel-sm px-2.5 text-xs font-extrabold uppercase tracking-wide ${statusStyle[p.status]}`}>
                      {statusLabel[p.status]}
                    </span>
                    <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{p.title}</h2>
                  </div>
                  <PixelIcon rows={p.icon} palette={base} scale={4} className="shrink-0" />
                </div>
                <ul className="flex flex-col gap-2" style={{ listStyle: "none", paddingLeft: 0 }}>
                  {p.items.map((it) => (
                    <li key={it.text} className="flex gap-3">
                      <span aria-hidden className={`mt-1.5 h-4 w-4 shrink-0 pixel ${it.ok ? "bg-brand-leaf" : "bg-white"}`} />
                      <span>{it.text}</span>
                    </li>
                  ))}
                </ul>
                {p.gate && (
                  <p className="flex items-center gap-3 pixel bg-white px-4 py-2.5 text-[15px]">
                    <span aria-hidden className="h-3.5 w-3.5 shrink-0 rotate-45 pixel-sm bg-brand-sun" />
                    <span>
                      <b className="text-brand-red">Checkpoint:</b> {p.gate}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </DocPage>
  );
}
