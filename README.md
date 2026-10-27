# Barrel Royale

Game pengeboran lepas pantai di Robinhood Chain. Pemain mengebor, mengatur tekanan sumur, mengolah minyak di kilang, dan menjual hasilnya. Setiap minggu, pemegang rig NFT mengklaim XOM (stock token Exxon Mobil) sesuai produksi rignya. Struktur landing page-nya mengikuti [Pixels](https://pixels.xyz), sedangkan brand dan konsepnya dari prototipe [Barrel Royale](https://claude.ai/artifact/BPZuaEAKGAPX7yeatkHJCV).

Status: **landing page sudah jadi.** Prototipe game-nya ada di artifact, sedangkan client game sungguhan belum dibuat.

## Landing page (`apps/web`)

Next.js 16 dan Tailwind 4. Semua art pixel digambar sendiri dari kode SVG di `components/pixel/` dan `components/scenes/`. Latar sunburst dibuat oleh `scripts/sunburst.mjs`.

```bash
cd apps/web
pnpm install
pnpm dev
```

- **Game (`/play`):** dunia top-down yang bisa dijelajahi seperti Harvest Moon dan Pixels.
  - Roughneck berjalan di dek rig di tengah laut, dengan WASD atau panah di desktop dan joystick di HP.
  - Pemain mendekati pad sumur atau kilang, kiosk pasar (NPC pedagang), papan Dispatch (NPC dispatcher), tangki penyimpanan untuk upgrade, dan crew quarters untuk log.
  - E untuk memakai, F untuk mengelola.
  - Isi permainannya: sumur dengan tekanan dan choke, blowout dan capping drill, kilang, pasar spot, kontrak, badai dengan brace (layar menggelap dan hujan), level rig, dan poin.
  - Dunianya dibangun dengan Phaser 3.90 (`components/game/world/`). Semua art digambar dari kode (`art.ts`), dan peta, tabrakan, serta titik interaksi ada di `map.ts`.
  - Aturan game tetap fungsi murni di `lib/game/engine.ts`, dengan angka di `lib/game/content.ts`. Keduanya dipakai bersama oleh React dan Phaser lewat `lib/game/store.ts`, jadi nanti bisa dipindah ke server multiplayer.
  - Panel interaksi ada di `components/game/panels.tsx`.
  - Progres tersimpan di localStorage. Selama tab ditutup, produksi jalan di setting Safe paling lama 2 jam.
- Halaman: `/` (landing), `/play`, `/whitelist`, `/docs`, `/litepaper`, `/roadmap`. Docs, litepaper, dan roadmap memakai layout bersama di `components/doc/doc.tsx`.
- **Whitelist** (`/whitelist`, API di `app/api/whitelist/route.ts`):
  - Pendaftaran pakai wallet dan X handle, dengan email opsional. Satu spot per wallet dan per X handle.
  - Setiap pendaftar dapat kode referral: +10 poin saat bergabung, +5 poin untuk setiap teman yang bergabung lewat linknya.
  - Ada tiga tier berdasarkan peringkat saat snapshot.
  - Data disimpan di Postgres (Neon) lewat `DATABASE_URL`. Tabelnya dibuat otomatis saat request pertama.
  - Selama `DATABASE_URL` belum diisi, formulir menjawab "The whitelist opens soon".
  - Aturan poin dan tier ada di `lib/whitelist-rules.ts`.
- Gaya pixel: tombol dan kotak memakai bingkai pixel bersudut takik (`--pixel-ring` di `app/globals.css`, utility `pixel`, `pixel-sm`, dan `pixel-drop`).
- Tailwind berjalan lewat `postcss.config.mjs`. Loader `@tailwindcss/turbopack` sudah dibuang karena di dev sering menyajikan CSS lama.
- Nama, tagline, token, dan link ada di `apps/web/lib/site.ts`. Tombol Play mengarah ke prototipe di artifact. Link X masih `#`.
- Contract address $ROYAL diambil dari env `NEXT_PUBLIC_ROYAL_CA`. Sebelum diisi, chip CA menampilkan "posted at launch". Setelah diisi, muncul tombol Copy dan link ke explorer. Variabel ini dibaca saat build, jadi perlu redeploy setelah mengisinya.
- Warna art ada di `apps/web/lib/palette.ts`, sedangkan token UI ada di `apps/web/app/globals.css`. Nilai keduanya sama.
- Font yang dipakai adalah Silkscreen, Pixelify Sans, dan Nunito dari Google Fonts (lisensi OFL).

## Dokumen

Catatan riset, desain game, brand, dan panduan deploy disimpan di luar repo ini.

## Stack yang direncanakan

Next.js · Phaser 4 · Colyseus 0.18 · Postgres (Neon) + Drizzle · Tiled · Aseprite · Privy/Dynamic · Foundry + OpenZeppelin · Robinhood Chain (testnet 46630, mainnet 4663)
