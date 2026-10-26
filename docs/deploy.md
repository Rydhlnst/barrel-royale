# Deploy ke VPS dengan Docker Compose dan Coolify

File yang dipakai ada di `apps/web/`:

| File | Isi |
| --- | --- |
| `Dockerfile` | Build Next.js dalam mode `standalone`, lalu menjalankannya sebagai user non-root di port 3000 dengan health check ke `/api/health` |
| `docker-compose.yml` | Dua layanan: `web` (situs + game + API whitelist) dan `db` (Postgres 17 dengan volume `pgdata`) |
| `docker-compose.local.yml` | Tambahan untuk menjalankan tanpa Coolify: membuka port 3000 di host |
| `.env.example` | Variabel yang bisa diisi |

## Vercel atau VPS?

| | Vercel | VPS + Coolify |
| --- | --- | --- |
| Situs, docs, game single-player | Bisa, paling mudah | Bisa |
| Whitelist | Bisa, dengan Postgres terkelola (Neon) | Bisa, dengan Postgres di container sendiri |
| Multiplayer (Colyseus, WebSocket lama) | **Tidak bisa** di Vercel; server game harus di tempat lain (VPS, Fly.io, Railway) | Bisa, di compose yang sama |
| Biaya | Hobby gratis tapi tidak untuk komersial; Pro sekitar $20 per bulan | Harga VPS saja |

Untuk tahap sekarang (situs, whitelist, game single-player) Vercel cukup dan paling cepat. Saat multiplayer dibangun, situs boleh tetap di Vercel, sementara server game ditaruh di VPS.

## Lewat Vercel

1. Push folder `oilrig` ke GitHub.
2. Di Vercel, pilih **Add New → Project**, lalu import repo-nya. Isi **Root Directory** `apps/web`. Framework (Next.js) dan pnpm terdeteksi otomatis.
3. Database whitelist: dari tab **Storage**, pasang **Neon**. Integrasinya mengisi `DATABASE_URL` sendiri. Kalau membuat Neon secara manual, pakai connection string *pooled* (host berakhiran `-pooler`) dengan `?sslmode=require`.
4. Opsional, setelah launch: isi `NEXT_PUBLIC_ROYAL_CA` di **Settings → Environment Variables**, lalu redeploy.
5. Klik **Deploy**, lalu sambungkan domain di **Settings → Domains**.

Kode sudah siap untuk Vercel: koneksi database otomatis dibatasi satu per instance saat berjalan di Vercel. Pengaturan `output: "standalone"` hanya dipakai Docker, dan tidak mengganggu di Vercel.

Catatan: pembatas spam di API whitelist (5 kali per menit per IP) disimpan di memori tiap instance. Di Vercel, batas ini kurang ketat karena request bisa jatuh ke instance yang berbeda. Kalau spam mulai jadi masalah, gunakan **Vercel Firewall** (rate limiting) atau simpan hitungannya di database.

## Lewat Coolify

1. Jadikan folder `oilrig` repo git lalu push ke GitHub. Repo boleh privat; Coolify bisa membaca repo privat lewat GitHub App.
2. Di Coolify, buka **Project → New Resource → Public/Private Repository**, lalu pilih repo-nya.
3. Pilih **Build Pack: Docker Compose**, isi **Base Directory** `/apps/web`, dan biarkan file compose tetap `docker-compose.yml`.
4. Di bagian layanan `web`, isi **Domain**, misalnya `https://barrelroyale.xyz`. Coolify mengisi `SERVICE_FQDN_WEB_3000`, mengarahkan domain ke port 3000, dan memasang HTTPS otomatis.
5. `SERVICE_PASSWORD_POSTGRES` dibuat Coolify secara otomatis. `DATABASE_URL` di layanan `web` sudah merakit koneksinya ke container `db`, jadi tidak perlu diisi manual.
6. Opsional, setelah launch: isi `NEXT_PUBLIC_ROYAL_CA` di Environment Variables, lalu **Redeploy**. Nilai ini dibaca saat build, jadi wajib redeploy, bukan sekadar restart.
7. Klik **Deploy**. Pastikan `https://domainmu/api/health` membalas `{"ok":true}`.

Tabel whitelist dibuat otomatis saat pendaftaran pertama. Datanya tersimpan di volume `pgdata`, jadi tetap ada meskipun container dibuat ulang.

## Tanpa Coolify (Docker Compose biasa)

```bash
cd apps/web
echo "POSTGRES_PASSWORD=ganti-dengan-password-kuat" > .env
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Situs berjalan di `http://IP-VPS:3000`. Untuk domain dan HTTPS, pasang reverse proxy (Caddy atau Nginx) di depannya.

## Backup database

```bash
docker compose exec db pg_dump -U royale royale > whitelist-$(date +%F).sql
```

Di Coolify, backup terjadwal bisa diatur dari halaman layanan database.

## Spesifikasi VPS

- **Untuk situs, game single-player, dan whitelist:** 2 vCPU, 2–4 GB RAM sudah cukup.
- **Saat multiplayer (Colyseus) ditambahkan:** server game masuk sebagai layanan ketiga di compose yang sama. Saat itu perlu RAM lebih, dan VPS-nya sebaiknya dekat dengan pemain (misalnya Singapura).
