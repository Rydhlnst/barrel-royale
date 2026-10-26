# Brand: Barrel Royale

Diambil dari banner, ikon, dan prototipe Barrel Royale. Semua nilai ini sudah dipakai di `apps/web` (`lib/palette.ts` dan `app/globals.css`).

## Logo

- **Mark:** barel merah bermahkota emas, pixel art 16×16 (`crownBarrel` di `components/pixel/sprites.ts`). Ini juga dipakai sebagai favicon (`app/icon.svg`).
- **Wordmark:** "BARREL ROYALE" dalam font Silkscreen Bold, huruf putih dengan outline ink 3px dan bayangan keras 8px ke bawah. Di header, kata "Royale" berwarna merah.
- **Maskot:** roughneck berhelm oranye, berkumis, berbaju putih, dan bertali-overall biru (`roughneck`).

## Warna

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| sun | `#ffd54a` | Sinar terang sunburst, tombol, kotak penting |
| sun-deep | `#ffb22e` | Sinar gelap sunburst, emas mahkota |
| sun-pale | `#fff1c2` | Latar section terang |
| sky | `#eaf7ff` | Latar halaman |
| red | `#e8453c` | Barel, derrick, tombol Play, aksen teks |
| sea | `#1a73d9` | Laut, section XOM |
| sea-deep | `#0f55b0` | Bayangan laut |
| ink | `#1e2a4a` | Outline, teks, bayangan keras, footer |
| ink-2 | `#4a5878` | Teks sekunder |
| steel | `#9aa6b5` / `#78849a` | Dek |
| hat | `#ff8a1f` | Helm maskot |
| overall | `#2b6fd6` | Baju maskot |
| leaf | `#15905f` | Status selesai, harga naik |

## Tipografi

- **Logo dan judul besar:** Silkscreen Bold, huruf kapital dengan outline.
- **Heading dan tombol:** Pixelify Sans 700.
- **Teks bacaan:** Nunito 500–800.

Ketiganya OFL dari Google Fonts.

## Komponen

- **Kotak:** sudut siku, border ink 3px, bayangan keras `0 6px 0 ink`, tanpa blur.
- **Tombol:** tinggi minimal 52px, border ink 3px, bayangan `0 5px 0 ink`. Saat hover naik 2px, saat ditekan turun 4px. Variannya sun, white, dan red.
- **Hero:** sunburst pixel (`public/sunburst.png`, dibuat oleh `scripts/sunburst.mjs`) di belakang judul, lalu strip dek baja dan laut dengan tiang kuning pucat dan perahu merah.
- **Pemisah section:** strip dither kotak 8px.
- **Ticker:** pita ink dengan teks kuning dan ikon barel.

## Struktur halaman (dari Pixels)

Pola Pixels tetap dipakai, tapi dengan warna dan isi Barrel Royale:

- tombol CTA yang menempel di pojok kanan atas;
- ticker berjalan;
- adegan game dalam bingkai foto miring dengan lencana bulat;
- transisi dither antar section;
- penutup bergambar maskot.

## Aturan teks hukum

- Tulis "on Robinhood Chain", jangan pernah "by Robinhood".
- Footer wajib memuat disclaimer XOM (sekuritas, tidak untuk warga AS) dan pernyataan tidak berafiliasi dengan Exxon Mobil maupun Robinhood.
