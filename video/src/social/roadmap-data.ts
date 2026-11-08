import { barrel, crownBarrel, icons } from "@/components/pixel/sprites";
import { site } from "@/lib/site";
import { VAULT } from "@/lib/vault";

// The roadmap, mirrored from apps/web/app/roadmap/page.tsx for the roadmap
// visuals. When an item ships or a phase moves on, update both: flip `ok` on
// the item and `status` on the phase, then re-render with `npm run roadmap`.

export type Status = "done" | "now" | "next" | "later";

export type Phase = { when: string; status: Status; title: string; icon: readonly string[]; items: { text: string; ok?: boolean }[]; gate?: string };

export const PHASES: Phase[] = [
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

export const STATUS_LABEL: Record<Status, string> = { done: "Done", now: "Now", next: "Next", later: "Planned" };

/** The phase that is running now (or the first one not done). */
export const currentPhase = () => Math.max(0, PHASES.findIndex((p) => p.status === "now" || p.status === "next"));
