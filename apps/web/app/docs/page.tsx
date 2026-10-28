import type { Metadata } from "next";
import { site } from "@/lib/site";
import {
  BRACE_SECONDS,
  CAP_COST,
  LEVELS,
  OFFLINE_CAP,
  PRODUCTS,
  RAWS,
  STORM_WARNING,
  UNIT_UPGRADE_COST,
  UNITS,
  WELLS,
} from "@/lib/game/content";
import { CLASS_COSTS } from "@/lib/tokenomics";
import { VAULT } from "@/lib/vault";
import { CONTRACTS } from "@/lib/contracts";
import { DocPage, Formula, Note, Section, Table } from "@/components/doc/doc";

const fmt = (n: number) => n.toLocaleString("en-US");
const addr = (a: string) => (
  <a href={`${site.explorer}/address/${a}`} target="_blank" rel="noopener" className="break-all font-mono text-[13px]">
    {a}
  </a>
);

export const metadata: Metadata = {
  title: `Docs · ${site.name}`,
  description: `How ${site.name} works: rigs, wells and pressure, the refinery, contracts, the ${site.reward} export terminal, storms, the whitelist, the reward vault and its admin rights.`,
};

const toc = [
  { id: "status", label: "What's live today" },
  { id: "start", label: "Getting started" },
  { id: "rigs", label: "Rigs" },
  { id: "wells", label: "Wells and pressure" },
  { id: "refinery", label: "Refinery and products" },
  { id: "selling", label: "Selling and export" },
  { id: "incidents", label: "Storms and sabotage" },
  { id: "progress", label: "Upgrades, fleet and shifts" },
  { id: "village", label: "Royal Harbor" },
  { id: "crews", label: "Crews and seasons" },
  { id: "free", label: "Playing without a rig" },
  { id: "whitelist", label: "Whitelist" },
  { id: "tokenomics", label: "Tokenomics" },
  { id: "xom", label: `${site.reward} rewards` },
  { id: "vault", label: "The reward vault" },
  { id: "trust", label: "Safety and transparency" },
  { id: "contracts", label: "Contracts and admin rights" },
  { id: "faq", label: "FAQ" },
];

export default function Docs() {
  return (
    <DocPage
      current={site.links.docs}
      eyebrow="Documentation"
      title="Barrel Royale docs"
      lede={`Everything a roughneck needs: how rigs work, how to run a well hard without blowing it, what the refinery makes, and how barrels turn into ${site.reward}.`}
      toc={{ title: "Docs", items: toc }}
    >
      <Note title="The rig is open.">
        The browser game is live at <a href={site.links.play}>Play</a> for wallets holding {fmt(site.minHold)} {site.token} or more. Connect your wallet
        and start drilling. On-chain play rolls out in stages along the{" "}
        <a href={site.links.roadmap}>roadmap</a>, and the numbers below are tuned with every community playtest.
      </Note>

      <Section id="status" title="What's live today">
        <p>
          The browser game is the first stage of {site.name}. Everything marked <b>Live</b> can be played right now; the rest arrives with the on-chain
          game and is listed on the <a href={site.links.roadmap}>roadmap</a>.
        </p>
        <Table
          head={["Feature", "Status"]}
          rows={[
            ["Wells, pressure and choke settings", "Live"],
            ["Blowouts and the capping drill", "Live"],
            ["Refinery: distillation, cracker and liquefier", "Live"],
            ["Spot market with six price indexes", "Live"],
            ["Dispatch board delivery contracts", "Live"],
            ["Storms and the brace drill", "Live"],
            [`Rig levels 1 to ${LEVELS.length}`, "Live"],
            [`Export terminal and ${site.reward} balance`, "Live"],
            ["Wallet connect on Robinhood Chain", "Live"],
            ["Reward vault, rig NFT and treasury contracts on Robinhood Chain", "Live"],
            ["Whitelist with referral ranks", "Live"],
            [`Rig access for ${site.token} holders`, "Live"],
            ["Royal Harbor: the shared village with live chat", "Live"],
            ["Wallet login, rig NFTs and rig classes", "On-chain game"],
            [`Rig class upgrades with ${site.token}`, "On-chain game"],
            [`${site.reward} claims from the reward vault`, "On-chain game"],
            ["Shifts, supply boats, tankers and crew quarters", "On-chain game"],
            ["Crews, seasons, raids and crew projects", "Season 1"],
            ["Free players working shifts on other rigs", "Season 1"],
          ]}
        />
      </Section>

      <Section id="start" title="Getting started">
        <ol>
          <li>
            Open <a href={site.links.play}>Play</a> and connect your wallet on Robinhood Chain. Hold {fmt(site.minHold)} {site.token} or more in that wallet to step on deck. Your rig is saved to your address.
          </li>
          <li>Walk with WASD or the arrow keys (the joystick on a phone). Step up to an empty pad and press E to drill; light crude is the quickest start.</li>
          <li>Keep the choke on Normal for your first wells and watch the pressure gauge. Press F at a well to change its choke.</li>
          <li>
            Collect your barrels at each well, or from every well at once at the storage tanks. Run some through the refinery, then sell at the market
            kiosk (one product at a time, or everything at once) or fill a contract on the Dispatch board.
          </li>
          <li>When the storm alarm sounds, brace the rig: shut the valves in order before the timer runs out.</li>
          <li>Reinvest in rig levels and refinery units at the storage tanks, and export barrels for {site.reward} at the market kiosk.</li>
        </ol>
        <p>
          While the tab is closed your wells keep pumping on Safe for up to {OFFLINE_CAP / 3600} hours. In the on-chain game you connect a wallet on
          Robinhood Chain (chain ID 4663) and your rig NFT becomes your in-game rig.
        </p>
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
        <p>
          Every rig starts with {LEVELS[0].slots} deck slots and grows to {LEVELS[LEVELS.length - 1].slots}. Wells and refinery units share the deck, so
          every rig is built a little differently. In the browser game every rig produces at 1.00×; classes apply once rigs move on-chain.
        </p>
      </Section>

      <Section id="wells" title="Wells and pressure">
        <p>Wells bring up three raw products: light crude, heavy crude and natural gas. Each well has a pressure gauge and a choke with three settings.</p>
        <h3>What a well needs</h3>
        <p>
          An empty pad on your deck and a few coins. Every rig starts with {LEVELS[0].slots} pads, and each rig level adds more. Walk up to an empty pad,
          press E and pick a product.
        </p>
        <Table
          head={["Well", "Drill cost", "Pumps at Normal", "Wellhead holds"]}
          rows={RAWS.map((p) => [
            PRODUCTS[p].name,
            `${WELLS[p].cost} coins`,
            `${Math.round(WELLS[p].rate * 60 * 10) / 10} bbl a minute`,
            `${WELLS[p].holds} bbl`,
          ])}
        />
        <Table
          head={["Choke", "Output", "Pressure"]}
          rows={[
            ["Safe", "0.8×", "Barely rises"],
            ["Normal", "1.0×", "Rises slowly and settles"],
            ["Overdrive", "1.5×", "Climbs fast"],
          ]}
        />
        <p>
          Push past the red line and the well <b>blows out</b>: it stops and loses the barrels still in it until you cap it. Capping costs {CAP_COST} coins, or nothing at all if you close the valves in
          order during the capping drill. Good roughnecks run Overdrive and back off just in time.
        </p>
      </Section>

      <Section id="refinery" title="Refinery and products">
        <p>Refinery units turn raw products into refined ones worth several times more. Each product follows its own price index.</p>
        <Table
          head={["Unit", "Build cost", "Makes", "Upgrades"]}
          rows={(Object.keys(UNITS) as (keyof typeof UNITS)[]).map((u) => [
            UNITS[u].name,
            `${UNITS[u].cost} coins`,
            UNITS[u].recipes.map((r) => `${r.inQty} ${PRODUCTS[r.input].name.toLowerCase()} → 1 ${PRODUCTS[r.output].name.toLowerCase()}`).join("; "),
            `Level 2 for ${UNIT_UPGRADE_COST[2]}, level 3 for ${UNIT_UPGRADE_COST[3]} coins`,
          ])}
        />
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
            <b>Dispatch board.</b> Delivery contracts at a fixed price, 10 to 30% above base, with a deadline. In the browser game a new one arrives every 45
            seconds and lasts a few minutes; on-chain, delivery contracts run for hours.
          </li>
          <li>
            <b>Export terminal.</b> Ship barrels of any product out for {site.reward}, up to a daily export quota per rig.
          </li>
        </ul>
        <p>
          The market and contracts pay in-game coins, which buy wells, refinery units and upgrades and never leave the game. Exports are the only way
          play turns into {site.reward}, so every barrel is a choice: grow the rig now, or bank {site.reward}.
        </p>
        <Formula>spot sale = base value × index × rig class multiplier</Formula>
        <p>
          The index is the benchmark&apos;s price now divided by its price at the start of the season, kept between 0.5× and 2× so the economy stays
          steady. Storage is limited, so timing your sales is part of the game.
        </p>
      </Section>

      <Section id="incidents" title="Storms and sabotage">
        <p>
          Storms roll in on a timer. You get a {STORM_WARNING}-second alarm, then {BRACE_SECONDS} seconds to <b>brace</b>: close the four valves in the
          order shown. A wrong valve costs a second.
        </p>
        <ul>
          <li>Close every valve in time and the rig holds: you earn a coin bonus that grows with your rig level.</li>
          <li>Miss some and up to 30% of each product in storage washes overboard, less for every valve you closed.</li>
          <li>Storms never hit while you are offline. Sell often: oil in storage is what a storm can take.</li>
        </ul>
        <p>
          Sabotage arrives with crews in Season 1, as raids between rival rigs. See <a href="#crews">crews and seasons</a>.
        </p>
      </Section>

      <Section id="progress" title="Upgrades, fleet and shifts">
        <h3>In the browser game</h3>
        <Table
          head={["Rig level", "Upgrade cost", "Deck slots", "Storage"]}
          rows={LEVELS.map((l, i) => [String(i + 1), i === 0 ? "Start" : `${fmt(l.cost)} coins`, String(l.slots), `${fmt(l.storage)} bbl`])}
        />
        <p>
          <b>Refinery units</b> (distillation, cracker and liquefier) each upgrade to level 3. Every level runs a quarter faster, and a level 2
          distillation unit can make jet fuel.
        </p>
        <h3>In the on-chain game</h3>
        <ul>
          <li>
            <b>Supply boat</b>: spare parts for cheaper repairs, and extra defense.
          </li>
          <li>
            <b>Tanker</b>: ships Dispatch contracts; a bigger tanker takes more at once.
          </li>
          <li>
            <b>Crew quarters</b>: more shifts per day.
          </li>
          <li>
            <b>Shifts</b>: each rig has 8 a day for active moves like bracing, capping a blowout and running Overdrive. Base production keeps running
            without them, so a short session still moves your rig forward.
          </li>
        </ul>
      </Section>

      <Section id="village" title="Royal Harbor">
        <p>
          Royal Harbor is the village every rig shares: a boardwalk with a saloon, a lighthouse and a fire pit where roughnecks meet. Take the boat at
          the end of your dock, or tap Village at the top of the screen. Your rig keeps pumping while you&apos;re away.
        </p>
        <ul>
          <li>
            The first time, your wallet asks you to sign a short message. It proves the wallet is yours, costs nothing and sends no transaction. The pass
            lasts a day.
          </li>
          <li>Everyone in the harbor shows up with their wallet tag and rig level, and what they say pops up over their head.</li>
          <li>
            The chat is open to {site.token} holders. Links and wallet or contract addresses are blocked, the worst words are starred out, and you can post
            once every few seconds. Be kind: the team can hide messages and take a wallet out of the chat.
          </li>
          <li>Step away for a few minutes and you&apos;re taken off the square until you come back.</li>
        </ul>
      </Section>

      <Section id="crews" title="Crews and seasons">
        <p>
          Crews open with Season 1 of the on-chain game. A crew is up to 20 rigs and a season lasts 4 weeks. Crew score comes from contracts filled,
          production and crew projects.
        </p>
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
          The browser game is open to {site.token} holders. In the on-chain game, players without a rig start on a starter platform with 3 slots and earn season
          points, while {site.reward} exports need a rig NFT. From Season 1 they can also <b>work shifts on a rig holder&apos;s rig</b>, using its
          refinery and contracts, and the rig owner keeps 5 to 10% of what they make. Busy rigs grow fastest, so owners recruit.
        </p>
      </Section>

      <Section id="whitelist" title="Whitelist">
        <p>
          {site.name} is building its crew for the rig mint with a whitelist. Join on the <a href={site.links.whitelist}>whitelist page</a> with a wallet
          and an X handle. It is free and needs no transaction.
        </p>
        <ul>
          <li>Joining is +10 points. Every friend who joins with your referral link is +5.</li>
          <li>
            Two quests earn +5 bonus points each: follow <a href={site.links.x}>@barrelroyale</a> on X and post your referral link, and repost the launch post from @barrelroyale. The team
            checks both before the snapshot.
          </li>
          <li>One spot per wallet and per X account keeps the list fair. Duplicate and bot entries are removed before the snapshot.</li>
        </ul>
        <Table
          head={["Tier", "Rank at snapshot", "What you get"]}
          rows={[
            ["OG Roughneck", "Top 500", "A guaranteed spot in the rig mint, closed alpha access, OG badge in the game"],
            ["Crew", "501 to 2,500", "Whitelist mint window before public, alpha waitlist"],
            ["Deckhand", "Everyone else", "First in line for the public mint"],
          ]}
        />
        <p>
          The snapshot date is announced on <a href={site.links.x}>@barrelroyale</a> at least a week ahead.
        </p>
      </Section>

      <Section id="tokenomics" title="Tokenomics">
        <p>{site.name} runs on three assets, and each one has a single job.</p>
        <Table
          head={["Asset", "Where it lives", "How you get it", "What it does"]}
          rows={[
            ["Coins", "In the game", "Selling barrels, Dispatch contracts, storm bonuses", "Drilling, capping, refinery units and rig levels"],
            [
              site.token,
              "Robinhood Chain, ERC-20",
              "Trading on the launchpad",
              "Rig class upgrades and cosmetics, both burned",
            ],
            [site.reward, `${site.reward}RewardVault`, "Exporting barrels", "The reward: new XOM every week, claimed to your wallet any time"],
          ]}
        />
        <h3>{site.token}</h3>
        <ul>
          <li>Fixed supply, minted once at launch. Fair launch: no presale and no private round.</li>
          <li>
            <b>Class upgrades</b> burn {site.token} through the RigUpgrader contract. Costs count from Jack-up, so a holder only pays the difference to the
            next class.
          </li>
          <li>
            <b>Buyback and burn</b>: the treasury buys {site.token} back on the market and burns it.
          </li>
          <li>
            <b>Rig access</b>: holding {fmt(site.minHold)} {site.token} or more opens the game at <a href={site.links.play}>Play</a>.
          </li>
          <li>
            <b>Cosmetics</b> arrive with Season 1 and are paid in {site.token}, which is burned too.
          </li>
        </ul>
        <Table
          head={["Class", "Production", `Total ${site.token} from Jack-up`]}
          rows={CLASS_COSTS.map((c) => [c.name, c.mult, c.cost ? `${fmt(c.cost)} ${site.token}` : "Starting class"])}
        />
        <h3>How value flows</h3>
        <ol>
          <li>Players trade {site.token} and mint rigs, which funds the treasury.</li>
          <li>
            The treasury buys {site.reward} for the reward vault and buys back and burns {site.token}.
          </li>
          <li>Players pump, refine and export barrels. New {site.reward} lands every week, and they claim it whenever they like.</li>
          <li>Holders burn {site.token} to raise their rig&apos;s class, which lifts every barrel the rig produces.</li>
        </ol>
      </Section>

      <Section id="xom" title={`${site.reward} rewards`}>
        <p>
          The export terminal turns barrels straight into {site.reward}. Every rig&apos;s exports add up through the week, and the treasury fills the
          reward vault with {site.reward} bought from revenue.
        </p>
        <ul>
          <li>Each rig has a daily export quota. It resets at 00:00 UTC.</li>
          <li>
            The {site.reward} price comes from the Chainlink feed on Robinhood Chain at the moment of export. The browser game uses a fixed reference
            price, so its {site.reward} balance is a preview.
          </li>
          <li>
            Claim whenever you like: each week&apos;s rewards stay open for {VAULT.claimWeeks} weeks, so you can let a few weeks build up and claim them together.
          </li>
          <li>The vault, every purchase and every claim are public on the Robinhood Chain explorer.</li>
        </ul>
      </Section>

      <Section id="vault" title="The reward vault">
        <p>
          The {site.name} {site.reward}RewardVault keeps two balances apart, and the rules for each are written into the contract.
        </p>
        <Table
          head={["Balance", "What it is", "Who can move it"]}
          rows={[
            [
              "Owed to players",
              `${site.reward} from every week whose rewards are posted and not yet claimed`,
              `Only the players it belongs to, by claiming. The team cannot withdraw it.`,
            ],
            [
              "Free balance",
              `${site.reward} bought by the treasury that no player has earned yet`,
              `The treasury multisig, within the limits below`,
            ],
          ]}
        />
        <h3>Treasury withdrawals from the free balance</h3>
        <ul>
          <li>
            Every withdrawal is scheduled on-chain first and can only be executed {VAULT.timelockDays} days later, so anyone can see it coming.
          </li>
          <li>
            At most {VAULT.withdrawPct}% of the free balance can leave in any {VAULT.withdrawWindowDays} days.
          </li>
          <li>
            Withdrawals move funds to a new vault version or rebalance the treasury. Each one is listed with its
            reason in the monthly treasury report.
          </li>
        </ul>
        <h3>Weekly rounds</h3>
        <ul>
          <li>
            The multisig posts one Merkle root per week, at least {VAULT.roundSpacingDays} days apart, built from the game&apos;s export ledger. The
            full list of wallets and amounts is published with it.
          </li>
          <li>
            Claims open {VAULT.claimDelayDays} days after posting, so anyone can check the list against the ledger first. A round can never take more
            than {VAULT.roundPct}% of the free balance.
          </li>
        </ul>
        <h3>Other admin actions</h3>
        <ul>
          <li>
            The export rate and the daily quota can change only through the same {VAULT.timelockDays}-day timelock, announced on X and in these docs
            first.
          </li>
          <li>
            Claims can be paused for at most {VAULT.pauseDays} days to deal with a security issue. Paused time is added to every claim window, so no
            reward expires because of a pause.
          </li>
          <li>Every admin role sits with the treasury multisig. Its address is listed in the contracts table below.</li>
        </ul>
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
            <b>Tested rules.</b> Every limit on this page, from the timelock to the 20% cap and the round limits, is covered by the contracts&apos; automated tests, published with their source.
          </li>
          <li>
            <b>No single key.</b> The treasury and every admin role sit behind a multisig.
          </li>
          <li>
            <b>Timelocked admin.</b> Vault withdrawals and changes to the export rules wait {VAULT.timelockDays} days on-chain before they apply, and
            players&apos; earned {site.reward} cannot be withdrawn by anyone but them.
          </li>
          <li>
            <b>Open books.</b> A monthly treasury report links every {site.reward} purchase and every {site.token} burn.
          </li>
          <li>
            <b>Fair draw.</b> Rig classes come from a seed committed before the mint.
          </li>
          <li>
            <b>Rewards from real play.</b> Rewards follow revenue and play, and every number is public.
          </li>
        </ul>
      </Section>

      <Section id="contracts" title="Contracts and admin rights">
        <p>
          Official addresses appear here and on <a href={site.links.x}>@barrelroyale</a> on X. Always double-check an address before you use it. The table also lists what the
          admin of each contract can and cannot do.
        </p>
        <Table
          head={["Contract", "Standard", "Admin can", "Admin cannot", "Address"]}
          rows={[
            [`RoyalToken (${site.token})`, "ERC-20", "Nothing: no owner after launch", "Mint more, pause transfers or blacklist", site.ca ?? "Published at launch"],
            [
              "RigNFT",
              "ERC-721",
              "Set the price, lists and class seed before the first mint; move the mint phase forward; reveal the seed; set the metadata URL; set the upgrader once",
              "Change the price or seed after the first mint, move the phase back, change a class after the reveal, or mint past 3,333",
              addr(CONTRACTS.rig),
            ],
            [
              `${site.reward}RewardVault`,
              "Reward vault",
              `Post one weekly round of at most ${VAULT.roundPct}% of the free balance; withdraw up to ${VAULT.withdrawPct}% of the free balance per ${VAULT.withdrawWindowDays} days after a ${VAULT.timelockDays}-day timelock; change the export rate and quota after the same timelock; pause claims up to ${VAULT.pauseDays} days`,
              "Touch rewards owed to players, renounce ownership, or withdraw XOM any other way",
              addr(CONTRACTS.vault),
            ],
            ["RigUpgrader", "Class upgrades", "Nothing: no owner", "Change the costs or lower a class", `Deployed when ${site.token} is live`],
            ["Treasury", "Safe", "Holds every admin role above", "Act without its signers approving", addr(CONTRACTS.safe)],
            [`${site.reward} token`, "Robinhood Chain stock token", "—", "—", addr(CONTRACTS.xom)],
          ]}
        />
      </Section>

      <Section id="faq" title="FAQ">
        <h3>What do I need to play?</h3>
        <p>
          A wallet on Robinhood Chain with {fmt(site.minHold)} {site.token} or more in it. In the on-chain game a rig NFT is needed to export for{" "}
          {site.reward}, and from Season 1 players without a rig can work shifts on other rigs.
        </p>
        <h3>What is the {site.reward} balance in the browser game?</h3>
        <p>
          A preview of what your exports earn, at a reference {site.reward} price. Claims of {site.reward} to your wallet open with the on-chain game.
        </p>
        <h3>Can the team take the {site.reward} in the vault?</h3>
        <p>
          Not the {site.reward} owed to players. The treasury can withdraw only from the free balance, at most {VAULT.withdrawPct}% per{" "}
          {VAULT.withdrawWindowDays} days, and every withdrawal waits {VAULT.timelockDays} days on-chain and is listed in the treasury report. See{" "}
          <a href="#vault">the reward vault</a>.
        </p>
        <h3>Is {site.reward} a share in Exxon Mobil?</h3>
        <p>It is a token on Robinhood Chain that tracks the Exxon Mobil share price.</p>
        <h3>What if the price feed pauses?</h3>
        <p>Spot sales wait for a fresh price. Contracts keep running and your stored barrels stay safe.</p>
      </Section>
    </DocPage>
  );
}
