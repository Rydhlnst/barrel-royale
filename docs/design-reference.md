# Design reference: pixels.xyz

Patokan visual untuk situs dan UI game oil rig. Diambil 25 Okt 2026 dari https://pixels.xyz/ dengan Firecrawl (branding, markdown, raw HTML, screenshot full page) lalu dicek ulang di browser untuk nilai CSS yang sebenarnya.

Bahan mentah ada di `research/pixels-site/`:

| File | Isi |
| --- | --- |
| `home-full.png` | Screenshot full page 1920 × 11107 |
| `home.md` / `home.html` | Teks halaman dan HTML mentah (Webflow) |
| `branding.json` | Hasil ekstraksi brand dari Firecrawl |
| `images.txt` / `links.txt` | Daftar aset dan link di halaman |

Yang ditiru adalah **bahasa visualnya**: struktur, font bergaya pixel, sudut tangga, bayangan keras, ticker, awan yang bergerak. Logo, karakter, art map, dan GIF milik Pixels **tidak boleh** dipakai. Semua art untuk oil rig harus dibuat sendiri.

## Token Pixels (nilai asli)

```css
:root {
  --green-00:  #e3ff37; /* lime, aksen utama: tombol, h2, ticker */
  --green-01:  #8ad22e;
  --green-02:  #169f00; /* section bawah (investor, footer) */
  --purple-02: #622aff; /* langit, section utama */
  --purple-03: #28248c; /* background body, teks tombol */
  --purple-04: #222044; /* panel/card gelap */
  --deep-pink: #ed47a4; /* aksen kedua */
  --white:     #ffffff;
}
```

## Tipografi

| Peran | Font | Ukuran | Detail |
| --- | --- | --- | --- |
| H1 | Kemco Pixel Bold | 60px / 80px | putih, `text-shadow: 0 8px 0 #28248c` (bayangan keras, tanpa blur) |
| H2 | Kemco Pixel Bold | 32px / 36px | lime, `text-shadow: 0 4px 0 #222044` |
| Body | DePixel Klein | 24px / 35px | putih |
| Tombol | DePixel Klein / Kemco | 18px | huruf kapital |
| Ticker | Kemco Pixel | 20px | kapital, warna `--purple-04` di atas lime |

Di mobile (≤479px) heading turun ke 20px / 40px.

Lisensi font perlu dicek sebelum dipakai. Kemco Pixel dan DePixel beredar sebagai font gratis, tapi syaratnya harus dipastikan. Alternatif yang aman (OFL, ada di Google Fonts): **Silkscreen** atau **Press Start 2P** untuk heading, **Pixelify Sans** atau **VT323** untuk body.

## Komponen kunci

### Tombol pixel

Sudut "tangga" dibuat dengan `clip-path`, bukan border-radius. Kesan 3D datang dari dua inset shadow, ditambah drop shadow keras di luar.

```css
.pixel-button {
  text-transform: uppercase;
  text-decoration: none;
  filter: drop-shadow(4px 4px 0 rgba(0,0,0,.25));
}
.pixel-button > strong {
  display: inline-block;
  padding: 16px 24px;
  background: var(--green-00);
  color: var(--purple-03);
  box-shadow:
    inset -4px -4px 0 rgba(0,0,0,.2),
    inset  4px  4px 0 rgba(255,255,255,.2);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px));
}
```

Tombol "Play for free" juga **fixed di pojok kanan atas** dan ikut sepanjang scroll.

### Pixel box dan pixel frame

Polygon yang sama dengan langkah 16px untuk panel besar (`.pixel-box`). `.pixel-frame` menambah border putih 8px untuk bingkai screenshot game yang sedikit dimiringkan.

### Card

`.feature-card-d`: background `#222044`, radius 8px, padding 24px, min-height 360px. Saat hover muncul `box-shadow: 0 24px 64px rgba(224,224,224,.48)`. Ilustrasi pixel berada di atas card, label kapital di bawahnya.

### Ticker / marquee

Strip lime setinggi 80px dengan teks kapital berjalan (`@keyframes ticker`, `translate3d(-100%)`, 40s linear infinite). Strip ini dipakai sebagai pemisah antar section.

### Awan

Tiga ukuran PNG awan yang melintas horizontal dengan durasi 180s, 240s, dan 300s. Animasi ini hanya aktif di ≥768px.

## Struktur halaman (urutan section)

1. **Hero**: langit ungu, awan bergerak, logo pixel di tengah atas, nav kecil di kiri (Post, White Paper, Help Center), H1 tiga baris, satu kalimat, tiga tombol lime. Di bawahnya ada potongan peta game yang lebar sebagai "tanah".
2. **Ticker** lime: "Welcome to a new adventure · Chapter 2 is here".
3. **Communities**: tepi bawah bergaya dither pixel, maskot besar di kanan, empat card gelap (Guilds, Avatars, …).
4. **Fitur zig-zag**: screenshot game miring dalam pixel frame, avatar bulat kuning, judul lime, paragraf pendek. Kiri dan kanan bergantian (Play with friends, Earn rewards, Build your own world).
5. **Pemisah pola greek-key pixel**.
6. **Own your world**: pulau peta melayang dan tombol ke marketplace land.
7. **Ekonomi token**: wordmark `$PIXEL` besar di kiri, teks dan tombol staking di kanan.
8. **Ticker** lagi, lalu transisi dither dari ungu ke hijau.
9. **Investor**: section hijau, logo partner.
10. **Bento stats**: "Over 10 million players", "Pets have arrived", "Updates every two weeks". Panel berwarna dengan sudut pixel.
11. **Kontak dan footer**: maskot dalam lingkaran kuning, email besar, dither ke ungu.

Karakter umumnya: ceria, energi tinggi, untuk gamer. Hampir semuanya bersudut kotak (radius 0, kecuali card 8px). Bayangan selalu keras tanpa blur, dan transisi antar section memakai dither pixel, bukan gradien halus.

## Terjemahan ke oil rig (usulan awal)

Strukturnya sama, temanya diganti dari pertanian di langit ungu menjadi anjungan minyak di laut lepas.

| Pixels | Oil rig |
| --- | --- |
| Langit ungu `#622aff` | Laut dalam / langit senja di atas laut, misalnya `#1b3a8c` → `#0f1f4d` |
| Body `#28248c` | Navy laut `#0f1f4d` |
| Panel `#222044` | Baja gelap `#1a1f2e` |
| Lime `#e3ff37` | **Tetap lime**: sudah dekat dengan warna aksen Robinhood Chain dan kontrasnya kuat di atas navy |
| Deep pink `#ed47a4` | Jingga api flare `#ff7a1a` sebagai aksen kedua (api suar, peringatan) |
| Hijau rumput `#169f00` (section bawah) | Hitam minyak / dek baja `#111318`, dengan garis kuning-hitam hazard |
| Awan melintas | Awan dan burung camar melintas, ombak pixel bergerak di bawah hero |
| Peta kebun di bawah hero | Potongan peta rig: dek, derrick, pipa, kapal suplai |
| Ticker lime | Ticker "harga minyak" in-game (nama resource dan angka berjalan) |
| Dither ungu → hijau | Dither langit → laut (garis air) |
| Wordmark `$PIXEL` | Wordmark token game, misalnya `$CRUDE` (nama final belum diputuskan) |

Semua art (tile, karakter, rig, maskot) harus dibuat sendiri, misalnya di Aseprite, dengan grid yang konsisten (16px atau 32px). `image-rendering: pixelated` dipakai di semua `<img>` dan canvas.
