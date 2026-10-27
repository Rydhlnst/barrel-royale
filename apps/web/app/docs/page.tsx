import type { Metadata } from "next";
import { site } from "@/lib/site";
import { BRACE_SECONDS, CAP_COST, EXPORT_BBL, EXPORT_DAILY_BBL, EXPORT_USD, LEVELS, OFFLINE_CAP, STORM_WARNING } from "@/lib/game/content";
import { VAULT } from "@/lib/vault";
import { DocPage, Formula, Note, Section, Table } from "@/components/doc/doc";

const fmt = (n: number) => n.toLocaleString("en-US");

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
  { id: "crews", label: "Crews and seasons" },
  { id: "free", label: "Playing without a rig" },
  { id: "whitelist", label: "Whitelist" },
  { id: "xom", label: `${site.reward} rewards` },
  { id: "vault", label: "The reward vault" },
  { id: "fees", label: "Where the money goes" },
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
      <Note title="Play it today.">
        The browser game is live at <a href={site.links.play}>Play</a>, no wallet needed. On-chain play rolls out in stages along the{" "}
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
            ["Dispatch board contracts", "Live"],
            ["Storms and the brace drill", "Live"],
            ["Rig levels 1 to 5", "Live"],
            [`Export terminal and ${site.reward} balance`, `Live, as a preview balance until claims open`],
            ["Whitelist with referral ranks", "Live"],
            ["Wallet login, rig NFTs and rig classes", "On-chain game"],
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
            Open <a href={site.links.play}>Play</a>. Your rig saves in your browser.
          </li>
          <li>Walk with WASD or the arrow keys (the joystick on a phone). Step up to an empty pad and press E to drill; light crude is the quickest start.</li>
          <li>Keep the choke on Normal for your first wells and watch the pressure gauge. Press F at a well to change its choke.</li>
          <li>Collect your barrels, run some through the refinery, then sell at the market kiosk or fill a contract on the Dispatch board.</li>
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
            <b>Dispatch board.</b> Contracts at a fixed price, 10 to 30% above base, with a deadline. In the browser game a new one arrives every 45
            seconds and lasts a few minutes; on-chain, contracts run for hours.
          </li>
          <li>
            <b>Export terminal.</b> Ship barrels out for {site.reward}: every {fmt(EXPORT_BBL)} bbl of any product earns ${EXPORT_USD} worth of{" "}
            {site.reward}, up to {fmt(EXPORT_DAILY_BBL)} bbl per rig per day.
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
          The browser game is free for everyone today. In the on-chain game, free players start on a starter platform with 3 slots and earn season
          points, while {site.reward} exports need a rig NFT. From Season 1 they can also <b>work shifts on a rig holder&apos;s rig</b>, using its
          refinery and contracts, and the rig owner keeps 5 to 10% of what they make. Busy rigs grow fastest, so owners recruit.
        </p>
      </Section>

      <Section id="whitelist" title="Whitelist">
        <p>
          Before launch, {site.name} is building its crew with a whitelist. Join on the <a href={site.links.whitelist}>whitelist page</a> with a wallet
          and an X handle. It is free and needs no transaction.
        </p>
        <ul>
          <li>Joining is +10 points. Every friend who joins with your referral link is +5.</li>
          <li>
            Two quests earn +5 bonus points each: follow <a href={site.links.x}>@barrelroyale</a> on X and post your referral link, and post a screenshot of your rig at level 3. The team
            checks both before the snapshot.
          </li>
          <li>One spot per wallet and per X account keeps the list fair. Duplicate and bot entries are removed before the snapshot.</li>
        </ul>
        <Table
          head={["Tier", "Rank at snapshot", "What you get"]}
          rows={[
            ["OG Roughneck", "Top 500", "Guaranteed rig mint, closed alpha access, OG badge in the game"],
            ["Crew", "501 to 2,500", "Whitelist mint window before public, alpha waitlist"],
            ["Deckhand", "Everyone else", "First in line for the public mint"],
          ]}
        />
        <p>
          The snapshot date is announced on <a href={site.links.x}>@barrelroyale</a> at least a week ahead.
        </p>
      </Section>

      <Section id="xom" title={`${site.reward} rewards`}>
        <p>
          The export terminal turns barrels straight into {site.reward}. Every rig&apos;s exports add up through the week, and the treasury fills the
          reward vault with {site.reward} bought from revenue.
        </p>
        <Formula>
          your {site.reward} = barrels exported ÷ {fmt(EXPORT_BBL)} × ${EXPORT_USD} ÷ {site.reward} price
        </Formula>
        <ul>
          <li>Each rig can export up to {fmt(EXPORT_DAILY_BBL)} bbl a day. The quota resets at 00:00 UTC.</li>
          <li>
            The {site.reward} price comes from the Chainlink feed on Robinhood Chain at the moment of export. The browser game uses a fixed reference
            price, so its {site.reward} balance is a preview.
          </li>
          <li>
            Claim any time after the week closes. Unclaimed rewards go back to the vault&apos;s free balance after {VAULT.claimWeeks} weeks.
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
            Withdrawals cover running costs in quiet months, move funds to a new vault version, or rebalance the treasury. Each one is listed with its
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
          <li>Every admin role sits with the treasury multisig. Its address and signers are published at launch.</li>
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
            ["1", "Running costs: servers, RPC, gas", "Filled first, up to an ETH cap set to about $500 a month"],
            ["2", "Reserve for quiet months", "Filled until it holds 3 months of costs"],
            ["3", "Everything after that", "Split as below"],
          ]}
        />
        <Table
          head={["Use", "Share"]}
          rows={[
            [`${site.reward} for the reward vault`, "40%"],
            ["Game development and operations", "35%"],
            [`${site.token} buyback and burn`, "20%"],
            ["Crew war prizes", "5%"],
          ]}
        />
        <p>
          The {site.reward} vault grows with the game: the more people play and trade, the bigger it gets. Rewards come from real revenue, never from new
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
              "Set the price, lists and class seed before the first mint; move the mint phase forward; reveal the seed; set the metadata URL",
              "Change the price or seed after the first mint, move the phase back, change a class after the reveal, or mint past 3,333",
              "Published at launch",
            ],
            [
              `${site.reward}RewardVault`,
              "Reward vault",
              `Post one weekly round of at most ${VAULT.roundPct}% of the free balance; withdraw up to ${VAULT.withdrawPct}% of the free balance per ${VAULT.withdrawWindowDays} days after a ${VAULT.timelockDays}-day timelock; change the export rate and quota after the same timelock; pause claims up to ${VAULT.pauseDays} days`,
              "Touch rewards owed to players, renounce ownership, or withdraw XOM any other way",
              "Published at launch",
            ],
            ["FeeSplitter", "Fee waterfall", "Update the payout addresses, the cost cap and the reserve target, behind the timelock", "Change the split shares", "Published at launch"],
            ["Treasury", "Multisig", "Holds every admin role above", "Act with a single signer", "Published at launch"],
          ]}
        />
      </Section>

      <Section id="faq" title="FAQ">
        <h3>Do I need a rig to play?</h3>
        <p>
          No. The browser game is free for everyone. In the on-chain game a rig NFT is needed to export for {site.reward}, and from Season 1 free players
          can work shifts on other rigs.
        </p>
        <h3>Is the {site.reward} in the browser game real?</h3>
        <p>
          Not yet. It shows what your exports would earn at a reference price. Real {site.reward} is claimed from the vault once the on-chain game is
          live.
        </p>
        <h3>Can the team take the {site.reward} in the vault?</h3>
        <p>
          Not the {site.reward} owed to players. The treasury can withdraw only from the free balance, at most {VAULT.withdrawPct}% per{" "}
          {VAULT.withdrawWindowDays} days, and every withdrawal waits {VAULT.timelockDays} days on-chain and is listed in the treasury report. See{" "}
          <a href="#vault">the reward vault</a>.
        </p>
        <h3>Is {site.reward} a share in Exxon Mobil?</h3>
        <p>It is a token on Robinhood Chain that tracks the Exxon Mobil share price.</p>
        <h3>Is {site.name} affiliated with Exxon Mobil or Robinhood?</h3>
        <p>No. {site.name} is an independent game built on Robinhood Chain.</p>
        <h3>What if the price feed pauses?</h3>
        <p>Spot sales wait for a fresh price. Contracts keep running and your stored barrels stay safe.</p>
      </Section>
    </DocPage>
  );
}
