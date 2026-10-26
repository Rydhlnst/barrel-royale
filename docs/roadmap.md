# Roadmap pembangunan

Estimasi ini untuk 2 developer. Untuk 1 developer kalikan sekitar 1,5, untuk 3 developer kalikan sekitar 0,7. Totalnya sekitar **4–6 bulan** sampai MVP on-chain publik.

Fase 1–3 sebenarnya game web biasa. Setelah fase 3 game bisa dirilis tanpa Web3 dulu untuk menguji apakah memang seru.

## Fase 0: Fondasi (1–2 minggu)

- Monorepo pnpm + Turborepo dengan tiga bagian:
  - `apps/web`: Next.js
  - `apps/game-server`: Colyseus 0.18
  - `packages/shared`: tabel item dan resep, aturan, dan tipe
- Phaser 4.2 dipasang di Next.js lewat dynamic import dengan `ssr: false`. Hari pertama: cek kompatibilitas plugin Phaser 4.
- Pipeline art: Aseprite → sprite sheet + JSON → atlas. Tentukan grid (16 atau 32px) dan palet sejak awal.
- Peta uji di Tiled dengan object layer untuk spawn, slot sumur, dan zona interaksi.
- Landing page mengikuti [design-reference.md](design-reference.md): hero laut, ticker, section zig-zag.
- CI: lint, typecheck, test.

**Selesai jika:** karakter bisa berjalan di peta Tiled di browser, dan halaman depan sudah tampil.

## Fase 1: Loop single-player (3–5 minggu)

- Berjalan di dek, memasang pumpjack di slot, ekstraksi crude dengan timer.
- Gudang, separator, kilang, dan jual ke kapal suplai.
- Energi, makanan dari galley, dan tidur di crew quarters.
- Karat dan perbaikan alat (sink pertama).
- Inventory, toko, dan Dispatch Board versi awal di React di atas canvas.
- Progres tersimpan ke Postgres (Neon) lewat API.

**Selesai jika:** satu sesi bermain 20–30 menit terasa seru tanpa reward apa pun.

## Fase 2: Multiplayer (4–6 minggu)

- Room Colyseus per zona: pulau hub bersama, plus platform pribadi yang diinstance.
- Server-authoritative: klien hanya mengirim niat, server yang memvalidasi jarak, energi, cooldown, dan resep.
- Interpolasi gerak, chat, presence, mengunjungi rig pemain lain, dan reconnect.
- Load test memakai bot buatan sendiri.

**Selesai jika:** 100+ pemain simulasi berjalan stabil dalam satu zona.

## Fase 3: Ekonomi dan live-ops (4–6 minggu)

- **Ledger append-only** untuk semua perubahan saldo dan item.
- Tier T1–T2 lengkap, skill dan XP, Dispatch Board penuh, quest.
- Trading dan market antar pemain (off-chain).
- Crew (guild) versi awal.
- Panel admin: grant, ban, rollback, dan melihat ledger.
- Analytics: retensi D1/D7, inflasi Coins, sink terhadap faucet.
- Anti-bot v1:
  - rate limit per pesan
  - satu sesi per akun
  - Turnstile saat daftar
  - fingerprint perangkat
  - reputasi v0

**Selesai jika:** closed alpha tanpa Web3 dengan 50–200 pemain asli, dengan retensi diukur. Ini **gerbang go/no-go**. Kalau D1 jauh di bawah sekitar 35%, perbaiki gameplay dulu sebelum memasang token.

## Fase 4: On-chain (3–5 minggu, plus audit)

- Login Privy atau Dynamic dengan embedded wallet, dan paymaster ERC-4337 (Alchemy atau ZeroDev).
- Kontrak dengan OpenZeppelin dan Foundry, lengkap dengan test:
  - `CrudeToken` (ERC-20)
  - `Rig` (ERC-721) dengan metadata untuk OpenSea
  - `Claim` (voucher EIP-712, nonce, batas harian, fee)
- Indexer untuk deposit dan kepemilikan rig.
- Fitur rig NFT: zona Deepwater/Arctic, sharecropping, dan rig crew.
- Gerbang reputasi untuk withdraw.
- Deploy ke **testnet 46630**, uji end-to-end, baru kemudian ke **mainnet 4663**. Konfigurasi chain bisa disalin dari `zhieldcash/lib/chain.ts`.
- **Audit eksternal** (anggarkan waktu dan biayanya) dan **konsultasi hukum** soal token.

**Selesai jika:** withdraw dan claim berjalan di testnet dengan batas dan fee, dan hasil audit sudah ditindaklanjuti.

## Fase 5: Beta tertutup → launch (3–4 minggu)

- Tuning balance dan latihan menghadapi gelombang bot.
- Skala Colyseus: driver Redis dan multi-proses di VM (Fly.io atau Hetzner).
- Aset lewat CDN (Cloudflare R2) dan optimasi load awal.
- Strategi launch token (Pons, Pools.trade, atau likuiditas sendiri) dan penjualan pertama rig NFT.
- Komunitas: Discord dan X. Ikuti brand guideline Robinhood Chain: tulis "on Robinhood Chain", jangan pernah "by Robinhood".

## Setelah launch: konten per musim

| Musim | Isi |
| --- | --- |
| Musim 1 | Konsorsium dan Mega Project pertama, event badai |
| Musim 2 | Tier T3 dan Diving, sumur laut dalam |
| Musim 3 | Tier T4 Arctic, maskot (pets), avatar dari koleksi NFT lain di Robinhood Chain |

Roadmap publik harus dijaga tetap aktual. Halaman Pixels masih menulis "Chapter 2 is here" padahal mereka sudah di Chapter 3, dan itu merusak kepercayaan pemain.

## Risiko utama

| Risiko | Mitigasi |
| --- | --- |
| Bot dan multi-akun (audiens Robinhood Chain banyak trader) | Server-authoritative, reputasi, batas withdraw, ban off-chain sebelum on-chain |
| Token dijual terus-menerus | Float kecil, reward ditargetkan, RORS ≥ 1, sink yang tematis |
| Game tidak seru | Gerbang go/no-go di akhir fase 3, sebelum ada token |
| Art menjadi bottleneck | Kunci grid dan palet di fase 0, pakai aset sementara berlisensi |
| Hukum (token yang bisa ditarik, tema minyak) | Konsultasi sebelum fase 4, jangan kaitkan nilai ke minyak sungguhan |
| Pesaing di chain yang sama (Yield Fields) | Pembeda: tema rig, event badai, dan kerja sama crew |
