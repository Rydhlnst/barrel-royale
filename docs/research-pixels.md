# Riset: Pixels (pixels.xyz)

Diriset 25 Okt 2026 dari litepaper (litepaper.pixels.xyz), help center (help.pixels.xyz), The Pixels Post (Substack), dan liputan pers (BlockchainGamer.biz, eGamers, Decrypt). Klaim yang tidak bisa diverifikasi ditandai **[UNVERIFIED]**. Isi laporan di bawah ringkasan ini dibiarkan dalam bahasa Inggris seperti aslinya, lengkap dengan sumbernya.

## Ringkasan

- **Loop inti:** energi → kumpulkan atau tanam → olah di industri → antar ke Task Board → upgrade land dan alat → tier berikutnya.
- **Ekonomi:** Coins off-chain untuk progres harian. $PIXEL on-chain sebagai mata uang premium. $BERRY (token farming on-chain) terpaksa dihapus karena inflasinya terlalu tinggi.
- **NFT land:** 5.000 plot. Pemilik land mendapat bagian dari pemain gratis yang bekerja di land-nya (sharecropping), sehingga pemilik ikut mengawasi bot.
- **Masalah terbesar:**
  - Reward yang dibagikan lebih besar dari revenue.
  - Sekitar 60% wallet adalah bot.
  - Token turun sekitar 99%.
  - Rem yang ditambal belakangan (fee withdraw 20–50%, gerbang VIP) membuat pemain gratis kesal.
  - Retensi D1 sekitar 25%.
- **Kondisi 2026:** Pixels bergeser menjadi perusahaan infrastruktur reward (Stacked). Client game sudah open source, dan roadmap game-nya mandek setelah Chapter 3.
- **Pelajaran untuk kita:**
  - Ekonomi harian tetap off-chain.
  - Anti-bot dan reputasi dibangun sebelum reward hidup.
  - Ukur RORS (revenue ÷ reward) ≥ 1 sejak awal.
  - Float token kecil.
  - Game harus seru tanpa reward dulu.

---

## 1. Core gameplay loop

**The loop:** spend energy → gather or farm raw resources → craft at "industries" (stations) → deliver items to the Task Board for Coins, XP and sometimes $PIXEL → use the proceeds to upgrade land and tools → unlock higher tiers. The litepaper says the 2025 economy work was aimed at closing a "craft → earn → upgrade → craft" loop with sinks that scale.

- **Resources and industries.** Crops on soil plots, trees and stumps (softwood, hardwood), mines (ironite, clay, salt, voitonium), coops (eggs), apiaries (honey), silk slugs, windmills (flour), plus crafting stations: cooking, winemaking, textiles, woodwork, metalwork, stoneshaping, kiln.
  - Land biomes have exclusive resources: water land has watermint and salt, space land has astracactus and voitonium.
  - Crafting stations are single-occupancy: you queue behind other players and pay wood to start.
  - Quicksilver is a paid currency that skips crafting and mining timers and other players' queues (30-second reservation rule).
- **Tiers.**
  - Chapter 2 (June 2024) introduced T1–T4 items and industries across about seven industries.
  - 2025 added crafting durability (tools and stations wear out, which keeps demand for resources alive), long-timer T3/T4 recipes and inventory caps with paid expansions.
  - **Tier 5 launched April 15, 2026:** 105 recipes, NFT-land-only industries, and rentable 30-day "Slot Deeds" (each unlocks 20% of a parcel's T5 capacity, renewed with a craftable, tradable Preservation Rune).
  - A "Deconstructor" breaks old industries down into T5 materials.
- **Skills.** About 15–17 skills (farming, forestry, mining, cooking, woodwork, metalwork, animal care, exploration, business and others). High levels gate advanced recipes; Chapter 3's reactor ingredients need level 40+.
- **Energy.** Every action costs energy, including walking, planting and crafting.
  - Cap is 1,000. Characters slow down near zero.
  - 2024 figures put regeneration at about 19.8/hour. Refills come from the sauna (VIP sauna: 480 every 8 hours), food and drinks, energy drinks and "Energy Parties" hosted by players.
  - Energy is the primary throttle on output and bots, and a monetization lever.
- **Task Board.**
  - NPC Hazel posts delivery orders. A new task appears 5 minutes after you finish one, and the board resets daily at 00:00 UTC.
  - It is the only in-game source of $PIXEL. $PIXEL tasks are not guaranteed, and VIP and land ownership raise your odds.
  - VIP adds extra tasks. In 2025 more of the reward pool was moved from free players to the VIP pool.
  - **Change in 2026:** $PIXEL from tasks is now claimed on the Stacked website (app.stacked.xyz), not in the game.
- **Land types.**
  - **NFT Farm Land:** 5,000 plots on Ronin, bridged from Ethereum, in Regular, Water and Space biomes. In 2024, large plots held up to 60 soil and 4 industries; small plots held 48 soil and 3 industries.
  - **Specks:** free, non-NFT starter plots, expandable since Chapter 2 with rising Coin costs.
  - **Rented land:** rented via LootRush, an external rental marketplace. VIP is tied to the oldest land in the wallet and needs a 14-day hold.
  - **Guild land:** NFT land opened to guild members.
- **Sharecropping.** Free players work on other people's NFT land, using its industries and the resources it generates. The landowner earns "surplus": a base drop rate of 6–9%, raised by Farm Charm and Discoverability Points from decorating, and T5 adds surplus on crafted items.
  - In late 2023 the CEO said resource generation would move from per-player to per-LAND, so landowners would police bots themselves.
  - **[UNVERIFIED]:** the exact current split between landowner and worker.
- **Guilds.**
  - Membership is "Guild Shards" bought in $PIXEL on a bonding curve, so price rises with demand. That curve is a soft cap on guild size.
  - A 5% fee was split between the guild and Pixels in 2024. Leaders can whitelist who may buy.
  - Creating a guild cost 15 PIXEL plus a reputation threshold (the help center now says 2,205 rep).
  - Roles: Supporter → Member → Worker → Admin. Guilds can use multisig wallets and have their own land.
  - Early coverage said guilds offered "little concrete benefit" at launch.
- **Unions (Chapter 3 "Bountyfall", Oct 30, 2025).** A lighter social layer than guilds.
  - Three factions (Wildgroves, Seedwrights, Reapers), each with a non-tradable "Yieldstone" resource in 5 tiers.
  - Yieldstones come from tasks or from a Yieldstone Press, which only NFT land can host (4 per large plot, 2 per small).
  - Players deposit stones in their own Hearth or sabotage rivals'. Group "Offerings" must be met before a timer or the Hearth loses a level.
  - A season ends when a Hearth reaches 100%. The prize pool (capped at 50k PIXEL in season 1) splits 70% to the winner, 30% to second, and third gets starter stones. Switching union costs 50 PIXEL with a 48-hour cooldown.
- **Events and social.** Energy parties, LiveOps templates (Fishing Frenzy, Harvest Rush), Merchant Ships (March 2025), Leon's Neon Zone arcade with leaderboards (August 2025), mini-games such as Spore Sports, and player-made decorations. Planned social features: proximity chat, emotes, referral and share-to-earn rewards.

Sources: https://www.coingecko.com/learn/definitive-beginners-guide-pixels-web3-game (April 2024) · https://help.pixels.xyz/en/articles/9165794-what-is-the-task-board · https://help.pixels.xyz/en/articles/6685147-energy-in-pixels · https://help.pixels.xyz/en/articles/16311697-taskboard-pixel-rewards · https://help.pixels.xyz/en/articles/10721385-renting-farms · https://help.pixels.xyz/en/articles/6790303-discoverability-points · https://help.pixels.xyz/en/articles/9072814-guilds-lands-and-roles · https://help.pixels.xyz/en/articles/10746851-quick-silver-currency · https://litepaper.pixels.xyz/core-pixels-and-gameplay.md · https://pixelspost.substack.com/p/welcome-to-chapter-3-bountyfall · https://egamers.io/pixels-unveils-tier-5-update-nft-land-slot-deeds-and-deconstructor-overhaul/ · https://games.gg/hi/news/join-player-guilds-with-pixels-new-membership-system/ · https://phaser.io/news/2024/03/pixels · https://pixelspost.substack.com/p/thats-a-wrap-looking-back-on-2025

## 2. Economy and tokenomics

- **Supply.** Hard cap of 5B $PIXEL, vested over 60 months from launch (Feb 19, 2024, via Binance Launchpool) through Magna on-chain, so unlocks run to about 2029.
  - About 771M (15.4%) circulated at listing.
  - **Allocation (Tokenomist):** Ecosystem Rewards 34%, Treasury 17%, Private Sale 14% ($4.8M raised at $0.005–$0.012), Team 12.5%, Advisors 9.5%, Launchpool 7%, Alpha Rewards 5%, Liquidity 1%. Some Binance Research reposts say 24% for ecosystem, which looks like a typo.
  - Trackers disagree on current circulating supply: about 771M versus about 3.5B. An advisor unlock is listed for Nov 19, 2026.
- **Two-currency design.**
  - **Coins:** off-chain, uncapped soft currency managed by the team, used for everyday progression.
  - **$PIXEL:** on-chain premium currency for VIP, guild shards, pet minting, Speck upgrades, Voyage Contracts and union switching.
  - **Where spent $PIXEL goes:** historically 80% to a DAO community treasury and 20% back to Ecosystem Rewards. Going forward, part of the 80% goes to stakers.
- **$BERRY removal (Feb 2024).** BERRY was the original on-chain soft currency, with about 2% daily inflation. Pixels said an on-chain soft currency let farmers grind harder and sell more easily.
  - It was converted at 1,000 BERRY = 7.6175 PIXEL and replaced with off-chain Coins. Ronin delisted it from Katana DEX on Feb 17, 2024.
  - CEO's rationale: take short-term pain for long-run sustainability.
  - **Lesson:** do not put a high-velocity, inflationary farm currency on-chain.
- **Chapter 2.5 (2025).** A rebalance that cut daily Coin inflation by about 84%. **[UNVERIFIED]** exact date.
- **VIP.**
  - Originally a battle pass (about $35) that was also required to withdraw BERRY, as an anti-bot gate. A 2025 guide quotes about $6/month, payable in fiat or PIXEL.
  - Perks: VIP sauna energy, extra tasks, bulk crafting, more bookmarks, and 1,500 starting reputation. All NFT landholders get VIP automatically.
  - Daily tasks and withdrawals are now gated behind VIP.
  - Four VIP tiers were announced in 2025.
- **Reputation.** A score built from account age, linked socials, phone and email, quests, playtime, and land/VIP ownership. It drops for suspicious transfers to low-rep accounts. Current thresholds:

| Reputation | Unlocks |
|---|---|
| 600 | Buy on the marketplace |
| 800 | Unbalanced trades up to 2k coins |
| 1,100 | Sell on the marketplace |
| 2,000 | Withdraw PIXEL; trade coins |
| 2,205 | Create a guild |
| 4,000 | Unlimited trading |

  Players complained when updates dropped everyone by about 1k rep.
- **Anti-bot measures.**
  - Reputation gates, VIP paywalls on withdrawal, and energy limits.
  - Generation tied to land, so owners police their plots.
  - Rewards weighted toward progressed players, which is how Chapter 2 "broke" the bots.
  - Bans, internal checks and captchas.
  - Since 2026, ML sybil detection inside Stacked, trained on Pixels data.
  - In Nov 2023 the CEO estimated only about 40% of roughly 115k daily wallets were real players.
- **Withdrawal fees.**
  - The "Farmer Fee" on withdrawing $PIXEL is 20–50%, adjustable by governance, and went on-chain in June 2025. Fees are redistributed to stakers.
  - A release note says the fee applies only to net withdrawals beyond what you deposited.
  - **$vPIXEL** is an ERC-20c, spend- and stake-only token backed 1:1 by PIXEL. Withdrawing it is fee-free, it cannot be traded on exchanges, and spending it "burns to unlock" the backing PIXEL for the studio's acquisition budget.
- **Staking (live April–June 2025).** "The validator is the game": players stake PIXEL into game pools.
  - **Phase 1:** fixed monthly emissions of 20M PIXEL to Core Pixels, 2M to Pixel Dungeons and 5M to Forgotten Runiverse.
  - **Phase 2:** a 28M/month cap split by stake weight.
  - **Phase 3:** open to any game with return on reward spend ≥ 1 (defined below).
  - **Phase 4:** USDC/fiat.
  - **Mechanics:** 3-day unstake delay, no lock. In-game staking needs 100 PIXEL and a login within 30 days. Land boosts staking power: STAKED + NUM_LANDS × min(10% of STAKED, 100k).
  - **[UNVERIFIED]** whether Phases 2 and 3 shipped on schedule (Q3–Q4 2025).
  - About $90M of PIXEL was staked by June 2025.
- **Publishing flywheel.** The whitepaper repositions Pixels as "a decentralized AppsFlyer or Applovin" for games. Better games bring more player data, which sharpens reward targeting, lowers acquisition cost, and attracts more games.
  - **Return on Reward Spend (RORS):** fee revenue ÷ rewards paid. It is the company's North-Star metric. The litepaper puts it at about 0.8 and the goal above 1.0.
  - RORS passed 1.0 for the first time around Oct 2025. The CEO later claimed about 3:1 for Pixels and Chubkins in Stacked campaigns. These are self-reported.
- **Balancing inflation.** Off-chain Coins, Coin sinks (Speck upgrades, durability, high-tier recipes, storage), the VIP gate on earning and withdrawals, the withdrawal fee, vPIXEL recycling, capped and stake-weighted emissions, and ML-targeted rewards that pay only for verifiable valuable actions.

Sources: https://litepaper.pixels.xyz/staking-ecosystem-and-token-mechanics/usdpixel.md · https://litepaper.pixels.xyz/staking-ecosystem-and-token-mechanics/usdpixel/key-changes.md · https://litepaper.pixels.xyz/staking-ecosystem-and-token-mechanics/usdvpixel-erc20c.md · https://litepaper.pixels.xyz/staking-ecosystem-and-token-mechanics/staking/phased-rollout.md · https://litepaper.pixels.xyz/staking-ecosystem-and-token-mechanics/staking/quick-reference-faqs.md · https://litepaper.pixels.xyz/usdpixel-whitepaper/rors.md · https://litepaper.pixels.xyz/ecosystem-flywheel-and-data-loop/smart-reward-plaform.md · https://www.tokenomist.ai/pixels/updates · https://www.chaincatcher.com/en/article/2113814 · https://roninchain.com/blog/posts/pixels-players-the-berry-sunset-has-begun · https://www.blockchaingamer.biz/?p=30297 · https://intercom.help/pixelsxyz/en/articles/8058321-reputation-limits · https://www.blockchaingamer.biz/?p=28816 · https://pixelspost.substack.com/p/community-article-why-buy-vip-and · https://pixelspost.substack.com/p/release-285 · https://games.gg/news/pixels-90m-worth-of-pixel-staked/

## 3. NFTs

- **Farm Land (5,000).** Gives:
  - a fixed, visitable location;
  - automatic VIP;
  - more NFT-land-only industries (T5 industries, the Yieldstone Press);
  - surplus from other players working the land;
  - access control for guilds;
  - staking-power boosts;
  - better odds of $PIXEL tasks;
  - governance votes (proposed July 2026).

  Land can be rented through LootRush.
- **Pets.** Ronin NFTs minted from capsules (pet minting cost PIXEL in 2024).
  - Stats are strength, speed and luck. A pet adds storage and a wider interaction radius, but must be fed, watered and played with. Daily-care "pet streaks" were promised.
- **Avatars and interoperability.** Outside NFT collections can apply to be integrated as playable avatars; they connect a wallet and must meet art specs. Partners included Mocaverse, CyberKongz (which had its own island) and Kaidro, and in July 2026 all 4,444 Kanstar NFTs got pixel-art animated versions.
  - The homepage also lists "Tastemakerz".
  - This works as user acquisition: other NFT communities bring their holders in.
- **What ownership does not give.** Specks are free and the game needs no NFTs. Land speeds progress but is not required.

Sources: https://help.pixels.xyz/en/collections/4779910-nfts · https://help.pixels.xyz/en/articles/8461803-what-are-pixels-pets · https://help.pixels.xyz/en/articles/6685212-nft-avatars · https://help.pixels.xyz/en/articles/6685259-nft-farms · https://egamers.io/ronin-teases-a-new-pixels-chapter-and-leaves-out-every-detail/ · https://www.pixels.xyz/

## 4. Roadmap and current state

| When | Milestone |
|---|---|
| 2022–23 | Pixels launches on Polygon with Ethereum land NFTs and BERRY |
| Oct–Nov 2023 | Moves to Ronin; daily users jump past 100k |
| Feb 2024 | PIXEL launches through Binance Launchpool; BERRY retired |
| Mar 2024 | Price peaks at about $1.02; the developer claims about 1M daily users |
| Jun 17, 2024 | **Chapter 2**: tiers, upgradeable Specks, rewards weighted toward progressed players. Daily wallets fall from 900k+ to 252k in days (bots), then recover to 428k |
| 2024 overall | About $20M revenue, but rewards paid out exceeded revenue |
| 2025 | **Chapter 2.5** cuts Coin inflation about 84%. Merchant Ships (March), staking (April–June), Farmer Fee and vPIXEL (June), Neon Zone (August), VIP gate, durability |
| Oct 30, 2025 | **Chapter 3 "Bountyfall"**: Unions. RORS passes 1.0 for the first time |
| Mar 2026 | **Stacked** launches: a centralized rewards app, SDK and AI economist, opened to outside studios. Claims: $25M revenue driven, 178% lift in conversion to spending and 131% RORS in a win-back campaign |
| Apr 15, 2026 | Tier 5 |
| May 29, 2026 | "State of Pixels" update (below) |
| Jul 13, 2026 | Game client open-sourced; server to follow |
| Aug 10, 2026 | Ronin teases a "new chapter" for Pixels with no details |

- **Chapter 3 plans.** Exploration Realms (procedural islands reached with Voyage Contracts paid in PIXEL), LiveOps templates and social features. **[UNVERIFIED]** whether Realms shipped.
- **May 2026 State of Pixels.** The game is not shutting down and remains maintained.
  - The "survival" phase is declared done and the economy sustainable, but growth is weak.
  - D1 retention is about 25% against a 40% target.
  - The Pixels Foundation's mandate is to grow rewarded play.
- **July 2026 open-sourcing.** Production databases, anti-cheat and reward access stay closed. Governance votes are weighted by PIXEL, land and staked PIXEL, and Pixels keeps the final say.
- **Strategic pivot.** Pixels is turning from "a game" into a rewards and user-acquisition infrastructure company (Stacked) feeding a portfolio: Pixel Dungeons, Forgotten Runiverse, Sleepagotchi, and Chubkins, a web2-first pets game whose earnings come only through "offers".
  - PIXEL is planned to become stake-only. Player rewards would move to USDC or Stacked points, redeemable for gift cards or PayPal.
- **No dated roadmap.** The homepage still says "Chapter 2 Is Here", claims "10M+ players", and its roadmap link is a placeholder. No Chapter 4 has been announced.
- **Token (Oct 2026).** About $0.005, roughly 99% below the high (low $0.0038 on Jul 30, 2026). Market cap about $18M, fully diluted about $26M (MEXC, Oct 23).
  - It had an unexplained +24% day in early October.
  - **[UNVERIFIED]** Phemex delisted PIXEL markets (reported by one Portuguese outlet).
  - An AI summary on Bybit claims the team dissolved and development halted. I found no primary source for that, and it contradicts the May and July 2026 announcements, so treat it as false or unverified.
- **Player counts.** No reliable 2026 series exists. Estimates range from about 45k–150k daily users. A Portuguese outlet reports Pixels topped DappRadar's gaming volume ranking around Oct 22, 2026 (about $7.5M in 24h).
- **Ronin.** Moved to an OP Stack L2 on May 12, 2026, with about 10 hours of downtime. Pixels is a "Contributor" under Ronin's Proof of Distribution model.

Sources: https://www.blockchaingamer.biz/news/42338/where-does-pixels-go-next/ · https://www.blockchaingamer.biz/news/42645/pixels-open-source-frontend-server-next/ · https://www.blockchaingamer.biz/features/41983/stacked-rewards-app-launched-pixels-play-to-earn-luke-barwikowski/ · https://egamers.io/pixels-launches-stacked-an-ai/ · https://egamers.io/ronin-teases-a-new-pixels-chapter-and-leaves-out-every-detail/ · https://www.blockchaingamer.biz/news/33087/pixels-chapter-2-release-see-dauws-drop-69-as-bots-get-broken/ · https://decrypt.co/236597/pixels-chapter-2-upgrades-ethereum-farming-game · https://www.blockchaingamer.biz/amp/news/40755/pixels-chapter-3-new-social-competition-feature-unions/ · https://www.ruadebaixo.com/pixels-crypto-gaming-analise-2026.html · https://coinmarketcap.com/currencies/pixels/ · https://pixelspost.substack.com/p/ama-recap-jan-14-2026

## 5. Lessons for an oil-rig game

**What worked**
- **Free to play, in the browser, no NFT needed.** Wallet login is optional, so it reached mass audiences, and cozy social farming retains well long-term.
- **Land as a hub that others work on.** NFT owners earn surplus from free players using their land, and generation tied to land turns owners into bot police. For an oil game: rigs as NFTs, and roughnecks working shifts on someone else's rig for a cut.
- **Off-chain soft currency, on-chain premium token.** Killing BERRY was painful but correct.
- **Energy, timers, tiers and durability as throttles and sinks.** Durability and wear are a natural fit for drilling equipment.
- **Social competition with sabotage and capped prize pools.** Unions are cheaper to balance than open-ended emissions.
- **Reputation as a broad gate on extracting value.** It combines identity, account age and spend.
- **Integrating other NFT collections as avatars** for cross-community acquisition.

**What went wrong (the company's own admissions plus critics)**
1. **Rewards exceeded revenue.** In 2024 they "gave out far more in rewards than it brought in". RORS was about 0.8 and only passed 1.0 in late 2025. Design to RORS ≥ 1 from day one.
2. **Bots and multi-accounting.** About 60% of wallets were fake in late 2023. Chapter 2 wiped out about 69% of daily wallets overnight. Vanity daily-user counts misled everyone, including the token market.
3. **Sell pressure and dumping.** Most players extracted and sold. The token fell about 99% amid a 5-year unlock schedule with about 40% still locked. A large 34% ecosystem pool plus investor and advisor unlocks equals constant supply.
4. **Untargeted rewards.** Paying for activity rather than value. Their fix was ML-targeted "offers" for verifiable actions (D7 return, referrals, first purchase).
5. **Bolt-on friction fixes hurt free players.** Withdrawal fees of 20–50%, VIP gates on tasks and withdrawals, rewards moved from free to VIP pools, and reputation resets all drew community backlash. Retention for new players stayed weak (D1 about 25%).
6. **Retrofitted, layered complexity.** Coins, PIXEL, vPIXEL, Quicksilver, Yieldstones, Slot Deeds, shards. The team ended up concluding crypto should be backend infrastructure invisible to players, and is moving payouts to USDC, points and gift cards.
7. **Narrative drift.** "Chapter" branding stalled after Chapter 3, and the homepage and roadmap are stale. The company now behaves more like an infrastructure firm than a game studio.

**Practical takeaways**
- Build the anti-sybil identity and reputation layer before rewards go live.
- Keep the farm economy off-chain.
- Put on-chain value behind land and NFT ownership and capped, competitive seasonal pools.
- Meter payouts by RORS.
- Use a small token float with modest emissions.
- Make it fun without rewards first, the whitepaper's "Fun First" pillar.

## Gaps

- I could not verify the current sharecropping split, current VIP price and tiers, whether staking Phases 2 and 3 or Exploration Realms shipped, or current daily users and revenue.
- The Phemex delisting and Bybit "team dissolved" claims come from secondary or AI-generated sources only.
- 2024 figures from the CoinGecko guide (energy regeneration, plot sizes, costs) are likely outdated.
