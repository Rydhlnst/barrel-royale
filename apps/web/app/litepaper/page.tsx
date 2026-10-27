import type { Metadata } from "next";
import { site } from "@/lib/site";
import { EXPORT_BBL, EXPORT_DAILY_BBL, EXPORT_USD } from "@/lib/game/content";
import { DocPage, Formula, Note, Section, Table } from "@/components/doc/doc";
import { VAULT } from "@/lib/vault";
import { CLASS_COSTS } from "@/lib/tokenomics";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: `Litepaper · ${site.name}`,
  description: `${site.name} litepaper: the game, the energy price index, the ${site.token} economy, ${site.reward} rewards and the reward vault, fair play, architecture and safety.`,
};

const toc = [
  { id: "summary", label: "1. Summary" },
  { id: "why", label: "2. Why this game" },
  { id: "design", label: "3. Game design" },
  { id: "index", label: "4. Energy price index" },
  { id: "economy", label: "5. Economy" },
  { id: "rewards", label: `6. ${site.reward} rewards` },
  { id: "vault", label: "7. The reward vault" },
  { id: "bots", label: "8. Fair play" },
  { id: "architecture", label: "9. Architecture" },
  { id: "security", label: "10. Safety and transparency" },
  { id: "status", label: "11. Status" },
  { id: "sources", label: "12. Sources" },
];

export default function Litepaper() {
  return (
    <DocPage
      current={site.links.litepaper}
      eyebrow="Litepaper · v1.0"
      title="Litepaper"
      lede={`An offshore drilling game on Robinhood Chain where in-game prices follow real energy benchmarks and rig holders export their barrels for Exxon Mobil stock tokens bought with project revenue.`}
      meta={["Litepaper v1.0", "October 2026", "Chain · Robinhood Chain (4663)"]}
      toc={{ title: "Litepaper", items: toc }}
    >
      <Note title="Built in the open.">
        Game parameters are tuned with community playtests, and every change is announced on X and reflected here.
      </Note>

      <Section id="summary" title="1. Summary">
        <p>
          Players own rigs (NFTs), drill wells, manage well pressure, refine crude and gas into six energy products, sell them for in-game coins and export them for {site.reward}. Each
          product&apos;s price follows a real benchmark through Chainlink price feeds. A fixed share of project revenue buys {site.reward}, the Exxon Mobil
          stock token on Robinhood Chain, and holds it in a reward vault that pays out what each rig exports.
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
        <p>
          The core loop is drill, manage pressure, refine, sell or export, defend and upgrade. Section 11 lists which parts are live in the browser
          game today.
        </p>
        <ul>
          <li>
            <b>Wells and pressure:</b> three raw products; a choke trades output against blowout risk.
          </li>
          <li>
            <b>Refinery:</b> distillation, cracker and liquefier turn crude and gas into diesel, jet fuel and LNG.
          </li>
          <li>
            <b>Selling:</b> the spot market at the index, or Dispatch contracts at a fixed premium price, both paid in in-game coins.
          </li>
          <li>
            <b>Export:</b> barrels shipped through the export terminal turn into {site.reward}, up to a daily quota per rig.
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
          The game server reads Chainlink feeds on Robinhood Chain through the standard <code>AggregatorV3Interface</code>; benchmarks without a feed
          follow a simulated index until one is available. Following Robinhood&apos;s guidance, the server:
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
          {site.token} is a fixed-supply ERC-20 with a fair launch: no presale and no private round. It is spent on rig class upgrades and cosmetics,
          which burn it, and a share of revenue buys it back and burns it too. In-game sales pay coins, which never leave the game. Barrels become{" "}
          {site.reward} only through the export terminal: every {fmt(EXPORT_BBL)} bbl earns ${EXPORT_USD} worth of {site.reward}, up to{" "}
          {fmt(EXPORT_DAILY_BBL)} bbl per rig per day.
        </p>
        <h3>Rig class upgrades</h3>
        <p>
          The RigUpgrader contract raises a rig&apos;s class by burning {site.token}. Costs count from Jack-up, so a holder pays only the difference, and
          the contract has no owner.
        </p>
        <Table
          head={["Class", "Production", `Total ${site.token} from Jack-up`]}
          rows={CLASS_COSTS.map((c) => [c.name, c.mult, c.cost ? `${fmt(c.cost)} ${site.token}` : "Starting class"])}
        />
        <h3>Rig mint</h3>
        <Table
          head={["Item", "Plan"]}
          rows={[
            ["Rig supply", "3,333"],
            ["Mint price", "Announced before the whitelist snapshot"],
            ["Max per transaction", "5"],
            ["Mint order", "OG Roughnecks, then Crew (24 hours), then public"],
            ["Class reveal", "Commit-reveal seed, hash published before the first mint"],
            ["Mint proceeds", "Art, the game server and the first season's prizes"],
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
        <Formula>
          reward(i, w) = B(i, w) ÷ {fmt(EXPORT_BBL)} × ${EXPORT_USD} ÷ P(w)
        </Formula>
        <p>
          B(i, w) is the barrels rig i exported in week w, at most {fmt(EXPORT_DAILY_BBL)} a day, and P(w) is the {site.reward} price from the
          Chainlink feed. The vault records each week&apos;s Merkle root of rewards and holders claim with a proof. The rate and the daily quota keep
          weekly exports well inside what the vault receives from revenue, and both can change only through the timelock in section 7.
        </p>
      </Section>

      <Section id="vault" title="7. The reward vault">
        <p>
          The {site.reward}RewardVault keeps two balances apart. {site.reward} owed to players, from every posted week that is not yet claimed, can only
          leave through their claims. The free balance, {site.reward} the treasury bought that no player has earned yet, is managed by the treasury
          multisig under fixed limits:
        </p>
        <ul>
          <li>every withdrawal is scheduled on-chain and executes only after a {VAULT.timelockDays}-day timelock;</li>
          <li>
            at most {VAULT.withdrawPct}% of the free balance can leave in any {VAULT.withdrawWindowDays} days;
          </li>
          <li>withdrawals move funds to a new vault version or rebalance the treasury, each listed in the monthly report;</li>
          <li>changes to the export rate and quota use the same timelock;</li>
          <li>
            claims can be paused for at most {VAULT.pauseDays} days for a security issue, and paused time is added to every claim window;
          </li>
          <li>one round per week, at least {VAULT.roundSpacingDays} days apart and at most {VAULT.roundPct}% of the free balance, with claims opening {VAULT.claimDelayDays} days after posting;</li>
          <li>unclaimed rewards return to the free balance after {VAULT.claimWeeks} weeks.</li>
        </ul>
      </Section>

      <Section id="bots" title="8. Fair play">
        <p>A reward with real value deserves real players. {site.name} is built for that from day one:</p>
        <ul>
          <li>The game server decides every outcome; the client only sends what the player wants to do.</li>
          <li>Shifts set a daily budget of active play per rig, and exports stop at a daily quota.</li>
          <li>Exports count only from rigs that show varied, active play: shifts, contracts and storms.</li>
          <li>Rate limits, one session per account, and a quick check at sign-up and at claim time.</li>
          <li>Rigs flagged for review are held back from that week&apos;s Merkle root until they are cleared.</li>
        </ul>
      </Section>

      <Section id="architecture" title="9. Architecture">
        <ul>
          <li>
            <b>RoyalToken:</b> ERC-20 with a fixed supply and no owner after launch: no minting, pausing or blacklisting.
          </li>
          <li>
            <b>RigNFT:</b> ERC-721 with commit-reveal class assignment.
          </li>
          <li>
            <b>RigUpgrader:</b> burns {site.token} to raise a rig&apos;s class, with fixed costs and no owner.
          </li>
          <li>
            <b>{site.reward}RewardVault:</b> holds {site.reward}, stores weekly Merkle roots, pays claims, keeps player rewards apart from the timelocked free balance, and stores the export rate and quota.
          </li>
          <li>
            <b>Game server:</b> wells, refinery, contracts, incidents and crews, plus an indexer that tallies each rig&apos;s exports for the week and builds the Merkle tree.
          </li>
        </ul>
      </Section>

      <Section id="security" title="10. Safety and transparency">
        <ul>
          <li>OpenZeppelin contracts with reentrancy guards and an emergency pause.</li>
          <li>Every admin role and the treasury held by a multisig, so no single key can move funds.</li>
          <li>A {VAULT.timelockDays}-day timelock on vault withdrawals and on changes to the export rules, so every admin action is public before it applies.</li>
          <li>Automated tests for every vault limit, published with the contract source.</li>
          <li>Source code verified on the Robinhood Chain explorer for every contract.</li>
          <li>A monthly treasury report linking every {site.reward} purchase and every {site.token} burn.</li>
          <li>Rewards follow revenue and play, and every number is public.</li>
        </ul>
      </Section>

      <Section id="status" title="11. Status">
        <Table
          head={["Part", "Status"]}
          rows={[
            ["Browser game: wells, pressure, refinery, market, contracts, storms, rig levels", "Live"],
            [`Export terminal with a preview ${site.reward} balance`, "Live"],
            ["Reward vault, rig NFT and treasury contracts on Robinhood Chain", "Live"],
            ["Whitelist with referral ranks", "Live"],
            [`${site.token}, rig mint and class reveal`, "Launch"],
            ["Treasury reports and the first vault purchases", "Weeks 1 to 2 after launch"],
            [`On-chain game and ${site.reward} claims on testnet`, "Weeks 3 to 6"],
            [`Mainnet, Season 1, crews and raids, first ${site.reward} claims`, "Weeks 7 to 10"],
          ]}
        />
      </Section>

      <Section id="sources" title="12. Sources">
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
