# Riset: teknologi Pixels dan stack untuk game oil rig

Diriset 25 Okt 2026. Teknologi Pixels diketahui dari bundle JS publik di play.pixels.xyz (dicari nama library-nya) ditambah sumber resmi. Integrasi Web3 menargetkan **Robinhood Chain**.

**Label:** **[C]** = terkonfirmasi dari bundle atau sumber primer · **[I]** = disimpulkan · **[?]** = tidak diketahui.

## Ringkasan

- Pixels memakai **Next.js + React (UI) + Phaser 3.90 (game) + Colyseus (multiplayer)**. Gameplay-nya off-chain, sedangkan token dan NFT hanya dipakai untuk withdraw. Colyseus pernah melayani puncak sekitar 82 ribu pengguna bersamaan.
- **Rekomendasi:** stack yang sama, versi 2026.
  - Phaser 4.2 (atau 3.90 kalau plugin v3 dibutuhkan).
  - Colyseus 0.18 dan Next.js.
  - Postgres (Neon) dengan Drizzle dan ledger append-only.
  - Tiled untuk peta, Aseprite untuk art.
  - Privy atau Dynamic untuk login dan embedded wallet, ditambah paymaster ERC-4337.
- **Robinhood Chain** adalah L2 Arbitrum dengan gas dalam ETH (sekitar 0,02 gwei, kurang dari satu sen per tx). OpenZeppelin dan Foundry jalan tanpa perubahan, dan NFT-nya didukung OpenSea.
  - **Kekurangannya:** belum ada wallet khusus game, belum ada marketplace game, dan audiensnya trader dan memecoin, jadi tekanan bot cenderung lebih berat.
  - **Pesaing tematik:** Yield Fields, game farming yang sudah mengumumkan rilis di chain ini.

---

## 1. How Pixels is built

| Layer | What it uses | Status / evidence |
|---|---|---|
| Web shell | **Next.js (Pages Router)**, built with webpack, in a container. `__env.js` says it is "overwritten at container boot by server-launcher.js". | [C] bundle |
| Game engine | **Phaser 3.90.0**. The bundle contains `VERSION:"3.90.0"` and sets `pixelArt` and `roundPixels`. The ~1.2 MB Phaser chunk is lazy-loaded only when the game starts. | [C] bundle |
| Maps | Phaser Tilemap layers with named tilesets and per-tile "surface type" lookups. There is an **in-game placement editor** for land (`placeableCursor`, `editingWithoutPermissions`). | [C] bundle |
| Map authoring tool | No `tiledversion`, LDtk or TexturePacker strings in the client. Maps probably come from the server in their own format, built with internal tools (routes `/__visual/[scene]`, `/snap/[mapId]`, `/[tenant]/share/[mapId]`). Tiled may still be used upstream. | [I] |
| UI | **React + Redux, plus jotai**. Text is translated with **i18next + Locize**. | [C] bundle |
| Multiplayer | **Colyseus**: `colyseus.js` client, `@colyseus/schema` state sync, `joinOrCreate`/`joinById` rooms. Phaser's showcase credits Colyseus for a peak of **82,000 concurrent users** — https://phaser.io/news/2024/03/pixels | [C] |
| Discord | The client detects the Discord Embedded SDK and routes through `/.proxy/colyseus`, so Pixels also runs as a **Discord Activity**. | [C] bundle |
| Game servers | Colyseus is a Node.js framework, so the servers are almost certainly Node/TypeScript. | [I] |
| Database, cloud, backend language | No public job posts, engineering blog or talk discloses these. | [?] |
| Auth | **Stytch** (`elements.stytch.com/telemetry.js`) and **reCAPTCHA Enterprise** served via `auth.pixels.xyz`. An "OtterAuth" client (`api.otterauth.com`) sends an **`x-fingerprint-id` device-fingerprint header** on requests. Email or wallet sign-up. | [C] bundle |
| Wallets | wagmi / WalletConnect plus injected wallets: Ronin, MetaMask, Coinbase, OKX, Trust. Supported networks: `ethereum, matic, bsc, base, ronin, saigon` (Saigon is Ronin's testnet). | [C] bundle |
| Assets | Served from the `pixelscdn.xyz` CDN, some as WebP. Pixel fonts (Press Start 2P, a "kemco" font). | [C] |
| Multi-tenant | `/[tenant]/[Map]` routes. Pixels has become a platform for several games (Pixels Pals, the "Stacked" reward platform), so tenants are probably those games. | [I] |
| On-chain vs off-chain | **Coins are off-chain.** BERRY was retired in 2024 and $PIXEL is now the only on-chain token. Land and pets are NFTs. **$vPIXEL** (ERC20c) is spend/stake-only, backed 1:1 by PIXEL, and has no withdrawal fee. Withdrawing $PIXEL costs a **"Farmer Fee" of 20–50%**. Daily tasks and withdrawals are gated behind **VIP**. | [C] litepaper |
| Anti-bot | A **reputation score** combining in-game actions, on-chain holdings and on-chain activity; ML to segment players (reinvestors, traders, sybil farmers); reward targeting instead of KYC. Mass bans, including **750k accounts in one week**. The CEO has estimated that about 40% of players were bots. | [C], press |

Pixels is built by Luke Barwikowski's own team. Sky Mavis only runs the Ronin chain.

Since **July 2026 the Pixels game client has been open source** (the server is to follow). Check the license before studying or reusing any of it.

## 2. Recommended stack (1–3 TypeScript/Next.js devs)

Latest npm versions as of 2026-10-25: `phaser` 4.2.1, `colyseus` 0.18.10, `@colyseus/sdk` 0.18.6 (the old `colyseus.js` package stopped at 0.16), `pixi.js` 8.22, `excalibur` 0.32 (still pre-1.0), `kaplay` 3001.0.19.

| Option | Fit for a 2D top-down MMO | Maturity in 2026 | Multiplayer | Verdict |
|---|---|---|---|---|
| **Phaser 4 (or 3.90) + Colyseus** | Built-in Tiled loader, Aseprite animation import, cameras, tilemaps, arcade physics. Embeds cleanly in Next.js. | v3 is very mature. v4.0 shipped April 2026 and is now at 4.2.1. | Colyseus is its de-facto partner, with an official tutorial (github.com/colyseus/tutorial-phaser). | **Pick this** |
| PixiJS 8 | Rendering only. You build tilemaps, input, scenes and animation yourself. | Very mature. | Bring your own. | Only if you want full control |
| Excalibur | TypeScript-first, nice API. | 0.32, still pre-1.0, small ecosystem. | Bring your own. | Viable, riskier |
| KAPLAY | Fast to prototype. | Fine for jams. | Weaker at MMO scale. | No |
| Godot 4 web export | Great editor. | Large WASM download, slower first load, rough edges on iOS Safari, awkward bridge to React UI and wallet JS. | Godot's high-level multiplayer API, or Colyseus via a community SDK. | No, for a browser-first wallet game |

**Phaser 4 or 3.90?** Start on Phaser 4.2 unless you depend on community plugins (e.g. rexrainbow), many of which target v3. If you hit plugin gaps, 3.90 is a safe final v3 (it is what Pixels runs). Check plugin compatibility on day one.

### Rest of the stack

- **Monorepo:** pnpm + Turborepo.
  - `apps/web`: Next.js App Router. Mount Phaser in a `"use client"` component via dynamic import with `ssr: false`, as Pixels lazy-loads it.
  - `apps/game-server`: Colyseus 0.18.
  - `packages/shared`: schemas, item and recipe tables, validation logic.
- **UI:** React for inventory, shops and menus, overlaid on the canvas. Use a small event bus or Zustand/jotai store between Phaser and React.
- **Maps:** **Tiled.** Phaser loads Tiled JSON natively. Use object layers for spawn points, rig slots and interaction zones. LDtk is a nicer editor but needs a custom parser in Phaser. Plan a simple in-game "place rig/building" editor later, as Pixels did.
- **Art:** **Aseprite.** Export sprite sheet + JSON; Phaser has `anims.createFromAseprite`. Pack atlases with free-tex-packer or TexturePacker. Use a 16px or 32px grid and keep `pixelArt: true`.
- **Hosting:**
  - Next.js on Vercel or similar.
  - **Colyseus on long-running VMs** (Fly.io, Hetzner, Railway), never on serverless. Colyseus Cloud is the managed option.
  - When you go multi-process, add Redis for Colyseus presence/driver.
  - Assets on Cloudflare R2 + CDN.
- **Database:** **Postgres** (Neon or Supabase) via Drizzle.
  - Store the economy as an **append-only ledger table** (double-entry style) rather than mutable balance columns. This makes auditing, rollbacks and bot forensics possible.
  - Use Redis for hot session state and rate limits.
- **Auth:** **Privy** (or Dynamic) handles email/social login, embedded wallet and external wallet in one, and both are listed by Robinhood Chain's account-abstraction docs. Issue a JWT and verify it in the Colyseus room's `onAuth`. Add Cloudflare Turnstile or reCAPTCHA at sign-up and withdrawal.
- **Comparable open source:**
  - **WorkAdventure** (Phaser + Tiled, TypeScript): https://github.com/workadventure/workadventure
  - **Reldens** (Phaser + Colyseus + Tiled MMORPG platform): https://github.com/damian-pastorini/reldens

## 3. Web3: Robinhood Chain

### Facts

Primary docs: https://docs.robinhood.com/chain

- **Architecture:** a permissionless Ethereum L2 on "Arbitrum Dedicated Blockchains" (Arbitrum Orbit-style). **Gas is paid in ETH.**
- **Mainnet launch:** July 1, 2026.
- **Network IDs:**

| | Mainnet | Testnet |
|---|---|---|
| Chain ID | 4663 | 46630 |
| RPC | `https://rpc.mainnet.chain.robinhood.com` | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | `https://robinhoodchain.blockscout.com` | `https://explorer.testnet.chain.robinhood.com` |

  The mainnet values have already been verified in the zhieldcash project (`lib/chain.ts`).
- **Gas costs:** The docs give no numbers. A live RPC reading on 2026-10-25 showed a **base fee of 0.02 gwei**.
  - An ERC-20 transfer (~55k gas) is about 1.1e-6 ETH. An ERC-721 mint (~100–150k gas) is about 2–3e-6 ETH.
  - Both are plus an L1 data fee that depends on Ethereum congestion.
  - In practice that is fractions of a cent per transaction. This is an estimate, so verify with `eth_estimateGas`.
- **Deploying contracts** (docs.robinhood.com/chain/deploy-smart-contracts):
  - Foundry: `forge create`, then `forge verify-contract --verifier blockscout --verifier-url https://robinhoodchain.blockscout.com/api/`.
  - Hardhat: `customChains` entry pointing at the Blockscout API.
  - Standard OpenZeppelin ERC-20/721 deploy unmodified. Max contract size is 96 KB.
- **Differences that matter for games** (docs.robinhood.com/chain/differences-from-ethereum):
  - `block.prevrandao` is constant, so it is useless for randomness. Do RNG off-chain on your server, or use Chainlink VRF (not confirmed live on this chain).
  - `block.number` is an L1 estimate. Use timestamps or `ArbSys.arbBlockNumber()`.
  - The sequencer is first-come-first-served and **screens out sanctioned addresses**.
- **Wallets and account abstraction:**
  - Robinhood Wallet, MetaMask and any EVM wallet.
  - **ERC-4337** with EntryPoint v0.6, v0.7 and v0.8, gas sponsorship and session keys.
  - Listed providers: **Alchemy, ZeroDev, Privy, Dynamic**. thirdweb is not listed (unverified).
- **NFT marketplace:** **OpenSea** supports Robinhood Chain NFTs since July 2026.
- **Games:**
  - Nothing confirmed live yet.
  - **Yield Fields** (a farming game with Deed NFTs) and **Gigaverse Online** have announced launches, as of late September 2026.
- **Launchpads:**
  - **Pons**: fixed-supply bonding curve that graduates to Uniswap pools, 1% fee. Contract details are contradictory between sources.
  - Uniswap's zero-fee **Pools.trade** took about half of launchpad volume from August.
  - Early chain activity is memecoin-heavy.
- **Funding:** Arbitrum Open House buildathons. There is no standalone games grant program.

### Gaps vs Ronin, and how to fill them

| Ronin has | Robinhood Chain gap | Fill with |
|---|---|---|
| Ronin Waypoint, a keyless email-login game wallet | No game-specific wallet | **Privy or Dynamic** embedded wallets plus an ERC-4337 paymaster (Alchemy, ZeroDev) to sponsor gas, so players never touch ETH |
| Mavis Market, a curated NFT market for games | Only general marketplaces | OpenSea plus your own **in-game marketplace**: off-chain order book with on-chain settlement |
| A gamer audience and curated publishing | Audience is traders and memecoin users | Your own community and Discord. Expect **more bot and sybil pressure** |

**Brand caution:** follow docs.robinhood.com/chain/brand-guidelines. Say "on Robinhood Chain", never imply that Robinhood endorses the game.

### Off-chain gameplay, on-chain withdrawals (the Pixels pattern)

- **Everything gameplay is in Postgres:** crude, refined goods and a soft currency like Pixels' "Coins".
- **On-chain is only:**
  - an ERC-20 premium/reward token;
  - ERC-721 rigs or plots, which grant in-game bonuses;
  - optionally a non-transferable "spend-only" wrapper like $vPIXEL.
- **Withdrawals:** the server signs an EIP-712 voucher `(user, amount, nonce, expiry)`. The user (or a paymaster) submits it to a claim contract that checks the signature, the nonce and a daily cap.
  - Add a withdrawal fee or burn.
  - Gate withdrawals on reputation and account age.
  - Add delay windows so fraud can be caught before payout.
- **Deposits / NFT ownership:** an indexer (Ponder, Envio, or a viem log watcher) credits the in-game balance or NFT ownership after confirmation. Re-check NFT ownership whenever you grant a bonus.
- **Get legal advice before launch.** A withdrawable token raises securities and money-transmission questions.

## 4. Anti-bot and anti-cheat basics

1. **Server-authoritative everything.**
   - The client sends *intents* ("move dir", "interact tile 12,7", "craft X"). The server checks distance, cooldowns, energy, inventory and recipe rules, and decides the result.
   - Never trust client timers or timestamps.
   - Keep the rules in `packages/shared` so the client predicts and the server validates.
2. **Movement:** server-side speed and teleport checks against the collision map; authoritative position with client interpolation.
3. **Rate limits** per message type in Colyseus `onMessage`, per connection and per account. Allow one active session per account (kick the old one).
4. **Friction where money moves:**
   - CAPTCHA (Turnstile or reCAPTCHA) at sign-up and at withdrawal, not during play.
   - Device fingerprint at login.
   - Email or social verification.
5. **Economic throttles:**
   - An energy system caps daily output.
   - Per-account daily withdrawal caps.
   - Diminishing returns.
   - A new-account probation period.
   - Make valuable rewards need varied, non-scriptable activity (quests, social, events) rather than repeated clicks.
6. **Detection:**
   - Log every action to the ledger.
   - Flag inhumanly regular action timing, 24/7 sessions, identical paths, and many accounts sharing devices/IPs or funding wallets.
   - Start with a simple reputation score (age, playtime variety, purchases, linked socials, wallet history). Add ML later.
7. **Ban and claw back off-chain** before anything reaches the chain. This is the main reason gameplay stays off-chain.
8. Client obfuscation is cosmetic. Don't rely on it.

## Uncertain or possibly outdated

- Pixels' backend language, database and cloud are not public.
- Whether Pixels uses Tiled is unconfirmed.
- The bundle findings are a 2026-10-25 snapshot.
- Robinhood Chain gas figures are estimates from one RPC reading.
- Chainlink VRF availability on Robinhood Chain is unconfirmed.
- thirdweb support for Robinhood Chain is unconfirmed.
- Game launches on the chain are announced, not live.
- Pons contract details are contradictory between sources.
- Phaser 4 plugin compatibility needs a day-one check.
