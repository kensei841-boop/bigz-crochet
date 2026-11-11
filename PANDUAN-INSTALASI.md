# PANDUAN INSTALASI — The Bigz Crochet (Backend GAS + Frontend GitHub Pages)

## A. Backend (Google Apps Script) — lakukan DULU
1. Buka projek Apps Script anda. **Padam** fail HTML lama: `Index`, `Stylesheet`, `JavaScript` (tidak dipakai lagi).
2. Ganti seluruh isi fail `Kode` dengan `Kode.gs` versi 2.0 (REST). Buka *Project Settings* → centang **Show "appsscript.json"** → tampal isi `appsscript.json` yang baharu.
3. Belum pernah setup? Jalankan **`setupAppEnvironment`** SEKALI dan catat kata laluan admin dari Execution log. Sudah pernah? Jangan ulang (data & rahsia sedia ada kekal).
4. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**
   (Execute as: **Me** · Who has access: **Anyone**). Salin URL `/exec`.
5. Uji: buka `URL_EXEC?action=boot` di browser → mesti keluar JSON `{"success":true,...}`.
6. (Pilihan) Pasang Trigger *Time-driven* setiap 5 minit untuk fungsi `warmCache` supaya katalog sentiasa pantas.

## B. Frontend (GitHub Pages)
**Folder kerja = folder hasil ekstrak ZIP (`bigz-crochet`). Folder inilah yang di-`git init`.**
Ia mesti mengandungi `index.html`, `css\`, `js\` di barisan teratas.

1. Ekstrak ZIP. Buka `js\config.js`, ganti `GANTI_DENGAN_URL_EXEC_APPS_SCRIPT` dengan URL `/exec` dari langkah A4. Simpan.
2. Pasang Git (https://git-scm.com/download/win) → buka PowerShell → `git --version`.
3. Buat akun GitHub, kemudian setup identiti (sekali sahaja):
   ```
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github.com"
   ```
4. GitHub → **+ → New repository** → nama `bigz-crochet` → **Public** → JANGAN centang README/.gitignore/license.
5. Buka folder `bigz-crochet` di File Explorer → klik address bar → taip `powershell` → Enter. Semak:
   ```
   dir
   ```
   Wajib nampak `index.html`, `css`, `js`. Jika nampak folder `bigz-crochet` lagi, `cd bigz-crochet` dahulu.
6. Satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/bigz-crochet.git
   git push -u origin main
   ```
   Username = GitHub username; password = **Personal Access Token** (https://github.com/settings/tokens → Generate new token (classic) → centang **repo**). Semasa paste token, skrin kelihatan kosong — itu normal.
7. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch **main** / **(root)** → Save → centang **Enforce HTTPS**. Tunggu 1–2 minit: `https://USERNAME.github.io/bigz-crochet/`.
8. Log masuk admin (ikon avatar kanan atas) → **Settings → Maklumat Perniagaan → Pautan Katalog Awam** → isi URL GitHub Pages anda → Simpan.

## C. Kemas kini kemudian
```
git add .
git commit -m "Huraian ringkas"
git push
```
Tekan Ctrl+Shift+R jika masih nampak versi lama. Jika menukar fail JS/CSS, naikkan `?v=1.0.0` dalam `index.html`.
Perubahan backend: *New version* pada deployment yang sama (URL kekal).

## D. Ujian
- [ ] Katalog tampil di GitHub Pages; Console (F12) tiada ralat CORS
- [ ] Hantar tempahan ujian → masuk Sheets, emel diterima
- [ ] Log masuk admin → dashboard, tukar status, jana invois PDF
- [ ] Muat semula halaman: katalog tampil serta-merta (cache) lalu dikemas kini di latar

## E. Masalah lazim
| Gejala | Punca | Penyelesaian |
|---|---|---|
| "Konfigurasi belum lengkap" | `GAS_URL` belum diisi / format salah | Edit `js/config.js`, push semula |
| 404 GitHub Pages | `index.html` tidak di root repo | Lihat repo di browser; push semula dari folder `bigz-crochet` (`git push -u origin main --force`) |
| Halaman tanpa gaya | Folder `css/` `js/` tidak ada di repo | Jangan guna "Upload files" di web; guna terminal |
| `Password authentication is not supported` | Perlu token | Buat Personal Access Token (langkah B6) |
| "Tidak dapat menghubungi pelayan" | Deployment bukan "Anyone" / belum New version | Ulang langkah A4 |
| JSON ralat "Aplikasi belum disediakan" | `setupAppEnvironment` belum dijalankan | Langkah A3 |
