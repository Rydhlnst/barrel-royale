import type { Metadata } from "next";
import { site } from "@/lib/site";
import { DocPage, Formula, Note, Section, Table } from "@/components/doc/doc";

export const metadata: Metadata = {
  title: `Litepaper · ${site.name}`,
  description: `${site.name} litepaper: the game, the energy price index, the ${site.token} economy, weekly ${site.reward} rewards, fair play, architecture and safety.`,
};

const toc = [
  { id: "summary", label: "1. Summary" },
  { id: "why", label: "2. Why this game" },
  { id: "design", label: "3. Game design" },
  { id: "index", label: "4. Energy price index" },
  { id: "economy", label: "5. Economy" },
  { id: "rewards", label: `6. ${site.reward} rewards` },
  { id: "bots", label: "7. Fair play" },
  { id: "architecture", label: "8. Architecture" },
  { id: "security", label: "9. Safety and transparency" },
  { id: "compliance", label: "10. Compliance" },
  { id: "sources", label: "11. Sources" },
];

export default function Litepaper() {
  return (
    <DocPage
      current={site.links.litepaper}
      eyebrow="Litepaper · v1.0"
      title="Litepaper"
      lede={`An offshore drilling game on Robinhood Chain where in-game prices follow real energy benchmarks and rig holders share Exxon Mobil stock tokens bought with project revenue.`}
      meta={["Litepaper v1.0", "October 2026", "Chain · Robinhood Chain (4663)"]}
      toc={{ title: "Litepaper", items: toc }}
    >
      <Note title="Built in the open.">
        Game parameters are tuned with community playtests, and every change is announced on X and reflected here.
      </Note>

      <Section id="summary" title="1. Summary">
        <p>
          Players own rigs (NFTs), drill wells, manage well pressure, refine crude and gas into six energy products and sell them for {site.token}. Each
          product&apos;s price follows a real benchmark through an on-chain oracle. A fixed share of project revenue buys {site.reward}, the Exxon Mobil
          stock token on Robinhood Chain, which is shared every week by the rigs that produce.
        </p>
      </Section>

      <Section id="why" title="2. Why this game">
        <p>
          Robinhood Chain was built for tokenized real-world assets and gives every stock token a Chainlink price feed. Most chain games pay players in
          their own token. {site.name} pays its headline reward in an asset that has value well beyond the game, funded by revenue, and makes the game
          itself worth playing first.
        </p>
      </Section>

      <Section id="design" title="3. Game design">
        <p>The core loop is drill, manage pressure, refine, sell, defend and upgrade. Each shift is 5 to 10 minutes of real decisions.</p>
        <ul>
          <li>
            <b>Wells and pressure:</b> three raw products; a choke trades output against blowout risk.
          </li>
          <li>
            <b>Refinery:</b> distillation, cracker and liquefier turn crude and gas into diesel, jet fuel and LNG.
          </li>
          <li>
            <b>Selling:</b> the spot market at the index, or Dispatch contracts at a fixed premium price.
          </li>
          <li>
            <b>Incidents:</b> storms with an active brace phase; sabotage as raids between crews.
          </li>
          <li>
            <b>Crews and seasons:</b> 20-rig crews, shared projects, raids and a season prize pool.
          </li>
          <li>
            <b>Shifts:</b> a daily budget of active moves that keeps play fair between players and scripts.
          </li>
          <li>
            <b>Free players:</b> a starter platform, plus shifts on other players&apos; rigs that pay both sides.
          </li>
        </ul>
      </Section>

      <Section id="index" title="4. Energy price index">
        <p>For each product, the index is the benchmark price now divided by its reference at the start of the season, held within a steady band.</p>
        <Formula>index(p) = clamp( P_now(p) ÷ P_season_start(p), 0.5, 2.0 )</Formula>
        <p>
          The oracle reads Chainlink feeds on Robinhood Chain through the standard <code>AggregatorV3Interface</code>; benchmarks without a feed are
          published by a set of keepers with multiple signers and a limit on each move. Following Robinhood&apos;s guidance, the oracle:
        </p>
        <ul>
          <li>checks the L2 sequencer uptime feed and waits out a grace period after any outage;</li>
          <li>only accepts fresh prices, comparing <code>updatedAt</code> with the feed heartbeat;</li>
          <li>reads <code>decimals()</code> from each feed and rejects zero or negative values.</li>
        </ul>
        <p>Dispatch contracts pay a fixed price, so players who prefer building to market-watching always have a steady way to earn.</p>
      </Section>

      <Section id="economy" title="5. Economy">
        <h3>{site.token}</h3>
        <p>
          {site.token} is a fixed-supply ERC-20 with a fair launch: no presale and no private round. In-game sales are paid from the game rewards pool
          under a daily cap of 500,000 {site.token}. The pool is refilled by buybacks from revenue and by {site.token} that players spend on drilling,
          capping blowouts, repairs, refinery fuel, upgrades, raids and cosmetics. The goal is for at least 70% of what the pool pays out to come back
          through play, shown on a public dashboard.
        </p>
        <h3>Rig mint</h3>
        <Table
          head={["Item", "Plan"]}
          rows={[
            ["Rig supply", "3,333"],
            ["Mint price", "Announced before the whitelist snapshot"],
            ["Max per transaction", "5"],
            ["Mint order", "OG Roughnecks, then Crew (24 hours), then public"],
            ["Class reveal", "Commit-reveal seed, hash published before the first mint"],
            ["Mint proceeds", "Audit, legal review, art and the first season's prizes"],
          ]}
        />
        <h3>Revenue split</h3>
        <p>
          Creator fees on {site.token} trading and rig sales cover running costs first (up to $500 a month), then fill a 3-month reserve. Everything after
          that is split by the FeeSplitter contract:
        </p>
        <Table
          head={["Use", "Share"]}
          rows={[
            [`${site.reward} for the weekly reward pool`, "40%"],
            ["Game development and operations", "35%"],
            [`${site.token} buybacks for the game rewards pool`, "20%"],
            ["Crew war prizes", "5%"],
          ]}
        />
      </Section>

      <Section id="rewards" title={`6. ${site.reward} rewards`}>
        <p>
          {site.reward} is an ERC-20 stock token on Robinhood Chain that tracks Exxon Mobil. The treasury buys it carefully so every purchase gets a
          fair price:
        </p>
        <ul>
          <li>small batches spread across the week;</li>
          <li>a 1% slippage limit on every trade;</li>
          <li>every purchase listed in the public treasury log.</li>
        </ul>
        <Formula>reward(i, w) = Pool(w) × Points(i, w) ÷ Σ Points(j, w) over eligible rigs j</Formula>
        <p>
          Points combine production after the class multiplier, filled contracts and storms held, with gentler returns past a weekly cap per rig. The vault
          records each week&apos;s pool and a Merkle root of rewards, and holders claim with a proof.
        </p>
      </Section>

      <Section id="bots" title="7. Fair play">
        <p>A reward with real value deserves real players. {site.name} is built for that from day one:</p>
        <ul>
          <li>The game server decides every outcome; the client only sends what the player wants to do.</li>
          <li>Shifts set a daily budget of active play per rig; points past a weekly cap count for less.</li>
          <li>Eligibility asks for varied, active play: shifts, contracts and storms.</li>
          <li>Rate limits, one session per account, and a quick check at sign-up and at claim time.</li>
          <li>Rigs flagged for review are held back from that week&apos;s Merkle root until they are cleared.</li>
        </ul>
      </Section>

      <Section id="architecture" title="8. Architecture">
        <ul>
          <li>
            <b>RoyalToken:</b> ERC-20 with a fixed supply.
          </li>
          <li>
            <b>RigNFT:</b> ERC-721 with commit-reveal class assignment.
          </li>
          <li>
            <b>EnergyOracle:</b> one source per product, Chainlink feed or keeper set, with the checks in section 4.
          </li>
          <li>
            <b>Platform:</b> settles sales and enforces the daily cap.
          </li>
          <li>
            <b>{site.reward}RewardVault:</b> holds {site.reward}, stores weekly Merkle roots and pays claims to eligible wallets.
          </li>
          <li>
            <b>FeeSplitter:</b> runs the revenue split.
          </li>
          <li>
            <b>Game server:</b> wells, refinery, contracts, incidents and crews, plus an indexer that scores each rig&apos;s week and builds the Merkle tree.
          </li>
        </ul>
      </Section>

      <Section id="security" title="9. Safety and transparency">
        <ul>
          <li>OpenZeppelin contracts with reentrancy guards and an emergency pause.</li>
          <li>Every admin role and the treasury held by a multisig, so no single key can move funds.</li>
          <li>An external audit published before mainnet, then a public bug bounty.</li>
          <li>Source code verified on the Robinhood Chain explorer for every contract.</li>
          <li>A monthly treasury report linking every fee, split and {site.reward} purchase.</li>
          <li>No fixed returns, ever: rewards follow revenue and play, and the numbers are public.</li>
        </ul>
      </Section>

      <Section id="compliance" title="10. Compliance">
        <p>
          {site.reward} stock tokens are tokenized debt securities issued by Robinhood Assets (Jersey) Limited. They are available outside the US,
          Canada, the UK and Switzerland, so {site.reward} claims run through an eligibility check, and the reward program is reviewed by counsel before
          claims open. The game itself and {site.token} rewards are open to every player.
        </p>
        <p>Like every digital asset, {site.token} and {site.reward} move with their markets. Nothing here is financial advice.</p>
      </Section>

      <Section id="sources" title="11. Sources">
        <ul>
          <li>
            <a href="https://docs.robinhood.com/chain/oracles-and-price-feeds" target="_blank" rel="noopener">
              Robinhood Chain: Oracles and price feeds
            </a>
          </li>
          <li>
            <a href="https://docs.robinhood.com/chain/stock-tokens" target="_blank" rel="noopener">
              Robinhood Chain: Stock tokens
            </a>
          </li>
          <li>
            <a href="https://app.rwa.xyz/assets/ExxonMobil.Robinhood" target="_blank" rel="noopener">
              rwa.xyz: Exxon Mobil on Robinhood Chain
            </a>
          </li>
        </ul>
      </Section>
    </DocPage>
  );
}
