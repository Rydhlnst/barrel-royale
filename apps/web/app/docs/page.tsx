import type { Metadata } from "next";
import { site } from "@/lib/site";
import { ROYAL_DAILY_CAP, ROYAL_PER_BARREL } from "@/lib/game/content";
import { DocPage, Formula, Note, Section, Table } from "@/components/doc/doc";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: `Docs · ${site.name}`,
  description: `How ${site.name} works: rigs, wells and pressure, the refinery, contracts, storms, crews, the whitelist and weekly ${site.reward} rewards.`,
};

const toc = [
  { id: "start", label: "Getting started" },
  { id: "rigs", label: "Rigs" },
  { id: "wells", label: "Wells and pressure" },
  { id: "refinery", label: "Refinery and products" },
  { id: "selling", label: "Selling and contracts" },
  { id: "incidents", label: "Storms and sabotage" },
  { id: "progress", label: "Upgrades, fleet and shifts" },
  { id: "crews", label: "Crews and seasons" },
  { id: "free", label: "Playing without a rig" },
  { id: "whitelist", label: "Whitelist" },
  { id: "xom", label: `${site.reward} rewards` },
  { id: "fees", label: "Where the money goes" },
  { id: "trust", label: "Safety and transparency" },
  { id: "eligibility", label: `Who can claim ${site.reward}` },
  { id: "contracts", label: "Contracts" },
  { id: "faq", label: "FAQ" },
];

export default function Docs() {
  return (
    <DocPage
      current={site.links.docs}
      eyebrow="Documentation"
      title="Barrel Royale docs"
      lede={`Everything a roughneck needs: how rigs work, how to run a well hard without blowing it, what the refinery makes, and how weekly ${site.reward} rewards reach the people pumping.`}
      toc={{ title: "Docs", items: toc }}
    >
      <Note title="Play it today.">
        The browser game is live at <a href={site.links.play}>Play</a>, no wallet needed. On-chain play rolls out in stages along the{" "}
        <a href={site.links.roadmap}>roadmap</a>, and the numbers below are tuned with every community playtest.
      </Note>

      <Section id="start" title="Getting started">
        <ol>
          <li>
            Open <a href={site.links.play}>Play</a>. Your rig saves in your browser.
          </li>
          <li>Tap an empty deck slot and strike light crude, the quickest well to start with.</li>
          <li>Keep the choke on Normal for your first wells and watch the pressure gauge.</li>
          <li>Collect your barrels, run some through the refinery, then sell or fill a contract on the Dispatch board.</li>
          <li>When the storm alarm sounds, brace the rig: shut the valves in order before the timer runs out.</li>
          <li>Reinvest in rig levels, refinery units and a fleet.</li>
        </ol>
        <p>On mainnet you connect a wallet on Robinhood Chain (chain ID 4663) and your rig NFT becomes your in-game rig.</p>
      </Section>

      <Section id="rigs" title="Rigs">
        <p>
          A rig is an ERC-721 NFT. Its class sets a production multiplier on every barrel it produces. Classes are fixed by a seed committed on-chain
          before the mint and revealed afterwards, so the draw is fair for everyone, the team included.
        </p>
        <Table
          head={["Class", "Share of supply", "Multiplier"]}
          rows={[
            ["Jack-up", "60%", "1.00×"],
            ["Semi-sub", "28%", "1.25×"],
            ["Drillship", "10%", "1.50×"],
            ["Ultra-deepwater", "2%", "2.00×"],
          ]}
        />
        <p>Every rig starts with 6 deck slots and grows to 12. Wells and refinery units share the deck, so every rig is built a little differently.</p>
      </Section>

      <Section id="wells" title="Wells and pressure">
        <p>Wells bring up three raw products: light crude, heavy crude and natural gas. Each well has a pressure gauge and a choke with three settings.</p>
        <Table
          head={["Choke", "Output", "Pressure"]}
          rows={[
            ["Safe", "0.8×", "Barely rises"],
            ["Normal", "1.0×", "Rises slowly and settles"],
            ["Overdrive", "1.5×", "Climbs fast"],
          ]}
        />
        <p>
          Push past the red line and the well <b>blows out</b>: it stops and loses the barrels still in it until you cap it. Capping costs a few coins, or nothing at all if you close the valves in order during the capping drill. Good roughnecks run Overdrive and back off just in
          time.
        </p>
      </Section>

      <Section id="refinery" title="Refinery and products">
        <p>Refinery units turn raw products into refined ones worth several times more. Each product follows its own price index.</p>
        <Table
          head={["Product", "Comes from", "Benchmark", "Base value per bbl"]}
          rows={[
            ["Light crude", "Well", "WTI", "1.67"],
            ["Natural gas", "Well", "Henry Hub", "2.83"],
            ["Heavy crude", "Well", "WCS", "4.33"],
            ["Diesel", "Distillation or cracker", "ULSD", "6.67"],
            ["Jet fuel", "Distillation level 2", "Jet A", "11.67"],
            ["LNG", "Liquefier", "JKM", "15.83"],
          ]}
        />
      </Section>

      <Section id="selling" title="Selling, contracts and export">
        <p>Barrels leave the rig three ways, and the best crews use all of them.</p>
        <ul>
          <li>
            <b>Spot market.</b> Sell any time at the product&apos;s index.
          </li>
          <li>
            <b>Dispatch board.</b> Tanker contracts at a fixed price, 10 to 30% above base, with a deadline, such as 40 bbl of diesel within 2 hours.
          </li>
          <li>
            <b>Export terminal.</b> Ship barrels out for {site.token}: {fmt(10 / ROYAL_PER_BARREL)} bbl of any product earns 10 {site.token}, up to{" "}
            {ROYAL_DAILY_CAP} {site.token} per rig per day.
          </li>
        </ul>
        <p>
          The market and contracts pay in-game coins, which buy wells, refinery units and upgrades and never leave the game. Exports are the only way
          play turns into {site.token}, so every barrel is a choice: grow the rig now, or bank {site.token}.
        </p>
        <Formula>spot sale = base value × index × rig multiplier</Formula>
        <p>
          The index is the benchmark&apos;s price now divided by its price at the start of the season, kept between 0.5× and 2× so the economy stays
          steady. Storage is limited, so timing your sales is part of the game.
        </p>
      </Section>

      <Section id="incidents" title="Storms and sabotage">
        <p>
          Storms roll in on a timer. Online, you get a 60-second alarm and then a 10-second <b>brace</b>: shut the valves, lash down the cargo, pull the
          boats in. Your result is your defense multiplied by how well you braced.
        </p>
        <ul>
          <li>Hold the rig and you earn a bonus.</li>
          <li>Miss it and part of your storage goes overboard, and some gear needs repairs.</li>
          <li>While you are offline your rig is covered by its base defense.</li>
        </ul>
        <p>Sabotage comes from rival crews, not dice. See crews and seasons.</p>
      </Section>

      <Section id="progress" title="Upgrades, fleet and shifts">
        <ul>
          <li>
            <b>Rig level</b> (1 to 5): more deck slots, dock berths, storage and defense, for 100, 260, 600 and 1,200 {site.token}.
          </li>
          <li>
            <b>Refinery units</b>: distillation, cracker and liquefier, each with 3 levels.
          </li>
          <li>
            <b>Supply boat</b>: spare parts for cheaper repairs, and extra defense.
          </li>
          <li>
            <b>Tanker</b>: ships Dispatch contracts; a bigger tanker takes more at once.
          </li>
          <li>
            <b>Crew quarters</b>: more shifts per day.
          </li>
        </ul>
        <p>
          Each rig has 8 <b>shifts</b> a day for active moves like bracing, capping a blowout and running Overdrive. Base production keeps running without
          them, so a short session still moves your rig forward.
        </p>
      </Section>

      <Section id="crews" title="Crews and seasons">
        <p>A crew is up to 20 rigs and a season lasts 4 weeks. Crew score comes from contracts filled, production and crew projects.</p>
        <ul>
          <li>
            <b>Crew projects</b>: build something together, like an undersea pipeline, and every member gets a lasting buff.
          </li>
          <li>
            <b>Raids</b>: send saboteurs at a rival rig. It defends with security, upgrades and crewmates online. A raid takes at most 10% of storage and
            never destroys a rig.
          </li>
          <li>
            <b>Prizes</b>: the top 3 crews split the season prize pool. Scores reset each season; rigs and levels carry over.
          </li>
        </ul>
      </Section>

      <Section id="free" title="Playing without a rig">
        <p>
          Everyone can play. Free players start on a starter platform with 3 slots and earn season points. They can also <b>work shifts on a rig
          holder&apos;s rig</b>, using its refinery and contracts, and the rig owner keeps 5 to 10% of what they make. Busy rigs grow fastest, so owners
          recruit.
        </p>
      </Section>

      <Section id="whitelist" title="Whitelist">
        <p>
          Before launch, {site.name} is building its crew with a whitelist. Join on the <a href={site.links.whitelist}>whitelist page</a> with a wallet
          and an X handle. It is free and needs no transaction.
        </p>
        <ul>
          <li>Joining is +10 points. Every friend who joins with your referral link is +5.</li>
          <li>Quests such as following on X and reaching rig level 3 in the game earn +5 bonus points each, checked before the snapshot.</li>
          <li>One spot per wallet and per X account keeps the list fair. Duplicate and bot entries are removed before the snapshot.</li>
        </ul>
        <Table
          head={["Tier", "Rank at snapshot", "What you get"]}
          rows={[
            ["OG Roughneck", "Top 500", "Guaranteed rig mint, closed alpha access, OG role"],
            ["Crew", "501 to 2,500", "Whitelist mint window before public, alpha waitlist"],
            ["Deckhand", "Everyone else", "First in line for the public mint"],
          ]}
        />
        <p>The snapshot date is announced on X at least a week ahead.</p>
      </Section>

      <Section id="xom" title={`${site.reward} rewards`}>
        <p>
          Every week the treasury buys {site.reward} stock tokens and deposits them in the reward vault. The pool is shared across eligible rigs by{" "}
          <b>production points</b>: barrels after the rig multiplier, plus contracts filled, plus storms held.
        </p>
        <Formula>your {site.reward} = weekly pool × your points ÷ points from all eligible rigs</Formula>
        <ul>
          <li>Points past a weekly cap per rig count for less, so the pool goes to real players rather than scripts.</li>
          <li>A rig qualifies with at least 3 active shifts and 1 filled contract in the week.</li>
          <li>Claim any time after the week closes. Unclaimed rewards roll into the pool after 12 weeks.</li>
          <li>The vault, every purchase and every claim are public on the Robinhood Chain explorer.</li>
        </ul>
      </Section>

      <Section id="fees" title="Where the money goes">
        <p>
          {site.name} runs on creator fees from {site.token} trading and rig sales. Every fee follows the same three steps, enforced by the FeeSplitter
          contract.
        </p>
        <Table
          head={["Step", "Where it goes", "Rule"]}
          rows={[
            ["1", "Running costs: servers, RPC, oracle keeper, gas", "Filled first, up to $500 a month"],
            ["2", "Reserve for quiet months", "Filled until it holds 3 months of costs"],
            ["3", "Everything after that", "Split as below"],
          ]}
        />
        <Table
          head={["Use", "Share"]}
          rows={[
            [`${site.reward} for the weekly pool`, "40%"],
            ["Game development and operations", "35%"],
            [`${site.token} buybacks for the game rewards pool`, "20%"],
            ["Crew war prizes", "5%"],
          ]}
        />
        <p>
          The {site.reward} pool grows with the game: the more people play and trade, the bigger it gets. Rewards come from real revenue, never from new
          deposits.
        </p>
      </Section>

      <Section id="trust" title="Safety and transparency">
        <ul>
          <li>
            <b>Fair launch.</b> {site.token} launches with no presale and no private round.
          </li>
          <li>
            <b>Verified contracts.</b> Every contract is published with its source verified on the Robinhood Chain explorer.
          </li>
          <li>
            <b>Audited.</b> An external audit is completed and published before the game goes on-chain, followed by a public bug bounty.
          </li>
          <li>
            <b>No single key.</b> The treasury and every admin role sit behind a multisig.
          </li>
          <li>
            <b>Open books.</b> A monthly treasury report links every fee, split and {site.reward} purchase.
          </li>
          <li>
            <b>Fair draw.</b> Rig classes come from a seed committed before the mint.
          </li>
          <li>
            <b>Honest rewards.</b> {site.name} never promises a fixed return, APY or price. Rewards follow revenue and play.
          </li>
        </ul>
      </Section>

      <Section id="eligibility" title={`Who can claim ${site.reward}`}>
        <Note title="Good to know.">
          {site.reward} claims run through a quick eligibility check, since stock tokens are not offered in every region. Every rig plays the full game and
          earns {site.token}.
        </Note>
      </Section>

      <Section id="contracts" title="Contracts">
        <p>Official addresses appear here and on the official X account. Always double-check an address before you use it.</p>
        <Table
          head={["Contract", "Standard", "Address"]}
          rows={[
            [`RoyalToken (${site.token})`, "ERC-20", site.ca ?? "Published at launch"],
            ["RigNFT", "ERC-721", "Published at launch"],
            ["EnergyOracle", "Chainlink adapter", "Published at launch"],
            ["Platform", "Game logic", "Published at launch"],
            [`${site.reward}RewardVault`, "Reward vault", "Published at launch"],
            ["FeeSplitter", "Fee waterfall", "Published at launch"],
            ["Treasury", "Multisig", "Published at launch"],
          ]}
        />
      </Section>

      <Section id="faq" title="FAQ">
        <h3>Do I need a rig to play?</h3>
        <p>No. Everyone can play for free, and free players can work shifts on other rigs.</p>
        <h3>Is {site.reward} a share in Exxon Mobil?</h3>
        <p>It is a token that tracks the Exxon Mobil share price on Robinhood Chain, without voting or shareholder rights.</p>
        <h3>Is {site.name} affiliated with Exxon Mobil or Robinhood?</h3>
        <p>No. {site.name} is an independent game built on Robinhood Chain.</p>
        <h3>What if the price feed pauses?</h3>
        <p>Spot sales wait for a fresh price. Contracts keep running and your stored barrels stay safe.</p>
      </Section>
    </DocPage>
  );
}
