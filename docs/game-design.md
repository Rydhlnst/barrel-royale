# Desain game: Barrel Royale (draft 2)

Draft 2 menggantikan konsep "Oilrig" dari draft 1. Dasarnya adalah prototipe Barrel Royale (https://claude.ai/artifact/BPZuaEAKGAPX7yeatkHJCV): rig NFT, enam produk energi yang harganya mengikuti indeks pasar, token game $ROYAL, pool XOM mingguan, crew wars, serta badai dan sabotase. Gameplay-nya saya perdalam supaya lebih seru dan lebih tahan terhadap bot.

Angka dalam [kurung] masih usulan.

## 1. Evaluasi prototipe saat ini

**Yang sudah bagus:**
- Tema dan tampilannya kuat.
- Aliran reward XOM jelas dan bisa diverifikasi on-chain.
- Fee waterfall yang jujur: tidak ada janji APY.
- Kelas rig dikunci dengan commit-reveal.
- Indeks harga dibatasi 0,5×–2× per musim.

**Yang perlu diperbaiki:**

| Masalah | Dampak |
| --- | --- |
| Loop-nya idle: pilih produk, tunggu timer, klik, jual | Satu-satunya keputusan adalah kapan menjual, jadi cepat membosankan |
| Diesel, jet fuel, dan LNG "dibor" langsung dari sumur | Tidak logis, karena diesel dan jet fuel adalah hasil kilang. Rantai produksinya juga hilang |
| Badai dan sabotase murni dadu (defense vs threat) | Pemain tidak berbuat apa-apa, dan insiden terasa seperti hukuman acak |
| Crew war hanya simulasi skor | Tidak ada interaksi antar pemain |
| XOM dibagi murni per barel | Insentif terbesar jatuh ke bot dan rig idle yang diklik skrip |
| Untung-rugi bergantung penuh pada indeks harga riil | Terasa seperti trading komoditas: berat untuk pemain biasa dan berisiko secara hukum |

## 2. Core loop baru

```
Bor sumur → atur tekanan → olah di kilang → jual (pasar atau kontrak)
     ↑                                                 ↓
 upgrade rig, kilang, armada  ←  $ROYAL  ←  tahan badai & sabotase
                                      ↓
                    poin produksi mingguan → bagian pool XOM
```

Satu sesi (shift) sebaiknya 5–10 menit dengan beberapa keputusan nyata, bukan sekadar menunggu timer.

## 3. Mekanik

### 3.1 Sumur dan tekanan (inti skill)

- Sumur hanya menghasilkan **light crude, heavy crude, atau natural gas**.
- Setiap sumur punya **gauge tekanan** yang naik selama memompa, dan **choke** tiga posisi:

| Choke | Laju | Risiko |
| --- | --- | --- |
| Safe | 0,8× | Tekanan hampir tidak naik |
| Normal | 1,0× | Tekanan naik pelan dan turun sendiri |
| Overdrive | 1,5× | Tekanan naik cepat |

- Lewat garis merah, sumur **blowout**: produksinya berhenti dan sebagian barel di sumur hilang.
- Sumur harus di-cap. Pilihannya bayar $ROYAL, atau main minigame singkat 10 detik untuk menutup katup secara berurutan dengan gratis.
- Hasilnya, pemain yang aktif bisa memeras lebih banyak dengan Overdrive, sedangkan bot dan pemain AFK aman di Safe tapi hasilnya lebih kecil.

### 3.2 Rantai produksi (kilang)

| Sumber | Unit kilang | Produk | Catatan |
| --- | --- | --- | --- |
| Light crude | Distillation | Diesel, Jet fuel | Jet fuel butuh unit level 2 |
| Heavy crude | Cracker | Diesel (lebih lambat, lebih murah) | Untuk minyak berat yang harganya murah |
| Natural gas | Liquefier | LNG | Produk paling mahal, prosesnya paling lama |

- Unit kilang memakan slot dek, jadi pemain harus memilih antara sumur dan kilang.
- Unit kilang juga butuh **bahan bakar**, yaitu sebagian diesel. Ini sink alami.
- Enam produk dan enam pasar dari prototipe tetap ada. Hanya urutannya yang kini masuk akal: tiga produk mentah dan tiga produk olahan.

### 3.3 Menjual: pasar atau kontrak

- **Spot market:** harga = base × indeks × multiplier rig, sama seperti prototipe.
- **Dispatch board:** kontrak tanker dengan harga tetap, premium [+10–30%], dan tenggat waktu. Contohnya "40 bbl diesel dalam 2 jam".
- **Gudang terbatas,** jadi stok tidak bisa ditimbun selamanya sambil menunggu harga tinggi.
- Pemain yang tidak mau membaca grafik cukup mengisi kontrak. Pemain yang suka pasar bisa bermain di spot. Ketergantungan pada indeks harga riil jadi berkurang.

### 3.4 Insiden yang interaktif

- **Badai:**
  - Alarm berbunyi 60 detik sebelumnya, jika pemain online.
  - Saat badai datang ada fase **brace** 10 detik: tutup katup, ikat kargo, dan tarik kapal ke dok, berupa beberapa tap berurutan.
  - Hasilnya dinilai dari defense dikali skor brace.
  - Sukses memberi bonus. Gagal membuat sebagian stok hilang dan peralatan rusak, sehingga perlu perbaikan.
- **Pemain offline** hanya dilindungi defense dasar, tanpa bonus. Bermain aktif selalu lebih untung, tapi pemain offline tidak dihukum berat.
- **Sabotase** adalah aksi asinkron antar crew (lihat 3.6), bukan dadu.

### 3.5 Armada

- **Supply boat:** membawa suku cadang (diskon perbaikan) dan menambah defense.
- **Tanker:** wajib untuk mengirim kontrak Dispatch. Kapasitasnya membatasi berapa kontrak yang bisa diambil sekaligus.

### 3.6 Crew war yang nyata

- **Crew:** maksimal 20 rig.
- **Skor musim:** kontrak yang selesai, ditambah produksi, ditambah proyek crew.
- **Proyek crew:** misalnya membangun pipa bawah laut bersama dengan menyetor material. Selesai, proyek itu memberi buff untuk semua anggota.
- **Raid:**
  - Crew mengeluarkan $ROYAL untuk mengirim saboteur ke rig crew lain.
  - Rig target bertahan dengan petugas keamanan, upgrade, dan anggota crew yang sedang online dan membantu.
  - Hasil raid tidak boleh menghancurkan rig, paling banyak mengambil [10%] stok gudang. Ini supaya pemain kecil tidak terusir.
- **Hadiah musim:** tiga crew teratas membagi pool bonus, yang tetap 5% dari fee waterfall.

### 3.7 Shift dan energi kru

- Setiap rig punya [8] shift per hari. Aksi aktif seperti brace, cap blowout, dan Overdrive menghabiskan shift.
- Produksi dasar tetap berjalan tanpa shift, jadi pemain kasual tidak tertinggal jauh.
- Shift membatasi output harian bot, dan bisa diperpanjang lewat upgrade crew quarters.

### 3.8 Pemain gratis dan bagi hasil (pelajaran dari Pixels)

- Pemain tanpa rig mulai di **starter platform** dengan 3 slot dan mengumpulkan poin musim.
- Mereka bisa **bekerja satu shift di rig NFT orang lain** dengan memakai kilang dan kontraknya.
- Pemilik rig mendapat [5–10%] hasil kerja itu. Rig yang ramai pekerja tumbuh lebih cepat.
- Dengan begitu pemain gratis punya peran yang berguna, dan pemilik rig punya alasan merekrut pemain.

## 4. Progres

| Lapisan | Isi |
| --- | --- |
| Rig level 1–5 | Slot dek 6 → 12, tambatan dok, defense, kapasitas gudang |
| Unit kilang | Distillation, Cracker, Liquefier; level 1–3 |
| Armada | Supply boat, tanker |
| Crew quarters | Shift per hari |
| Kosmetik | Warna helm, cat rig, bendera crew. Murni gaya, dibayar dengan $ROYAL yang dibakar |

## 5. Reward XOM yang lebih tahan bot

- **Basis pembagian:** poin produksi mingguan, bukan barel mentah. Poinnya datang dari produksi setelah multiplier, ditambah kontrak yang selesai, ditambah brace yang sukses.
- **Diminishing returns** per rig di atas [batas mingguan], supaya satu rig yang dijalankan skrip 24 jam tidak menguasai pool.
- **Syarat kelayakan mingguan:**
  - minimal [3] shift aktif;
  - minimal [1] kontrak selesai;
  - lolos cek kelayakan wilayah, karena XOM tidak boleh untuk warga AS dan dibatasi di Kanada, Inggris, dan Swiss.
- **Formula:** `XOM kamu = pool mingguan × poin kamu ÷ poin semua rig yang layak`

## 6. Ekonomi

- **Fee waterfall dan pembagian treasury** tetap mengikuti whitepaper: biaya operasional, cadangan, lalu [45%] XOM, [40%] tim, [10%] likuiditas, [5%] crew war.
- **Dua mata uang (masukan Oktober 2026).** Jual di market dan kontrak dibayar **coins**, yang hanya berlaku di dalam game untuk drill, kilang, dan upgrade. $ROYAL hanya didapat lewat **terminal ekspor**: 1.000 bbl produk apa pun = 10 $ROYAL, kuota [50] $ROYAL per rig per hari. Aturannya ada di `ROYAL_PER_BARREL` dan `ROYAL_DAILY_CAP` di `apps/web/lib/game/content.ts`.
- **Cek boncos:** nilai $ROYAL yang keluar lewat ekspor harus lebih kecil dari buyback (20% sisa fee) ditambah $ROYAL yang dibelanjakan lagi. Kalkulatornya: https://claude.ai/artifact/RRcguBppETvvpaz5cokhF6
- **Sink $ROYAL:** upgrade kelas rig, raid, dan kosmetik. Cap blowout, perbaikan, dan bahan bakar kilang sekarang dibayar coins.
- **Dashboard publik:** target minimal [70%] $ROYAL yang dibayar pool kembali lewat sink.

## 7. Risiko yang perlu diputuskan pemilik

1. **XOM adalah sekuritas** (surat utang tokenisasi dari Robinhood Assets (Jersey) Ltd). Membagikannya ke pemain bisa jadi aktivitas yang diatur. Perlu pendapat hukum tertulis sebelum klaim dibuka. Whitepaper sudah mencatat ini.
2. **Tagline "Earn Exxon" memakai nama dagang Exxon.** Meski ada disclaimer "not affiliated", nama merek di tagline utama bisa memancing klaim merek. Alternatif yang lebih aman: "Pump crude. Earn XOM." atau "Pump crude. Earn stock."
3. **Indeks harga dari benchmark energi riil** membuat game mirip produk derivatif komoditas. Clamp 0,5×–2× dan opsi kontrak harga tetap (3.3) mengurangi kesan itu, tapi tetap perlu masuk review hukum.
4. **Likuiditas XOM tipis** (sekitar 228 token beredar menurut whitepaper), sehingga pool mingguan harus kecil dan dibeli bertahap.

## 8. Urutan pengerjaan yang disarankan

1. Perbarui prototipe di artifact dengan tekanan dan choke, rantai kilang, kontrak Dispatch, dan brace badai, lalu uji apakah memang lebih seru.
2. Bangun client game sungguhan dengan stack di [research-tech.md](research-tech.md) (Phaser + Colyseus).
3. Selesaikan kontrak dan audit sesuai roadmap di landing page.
