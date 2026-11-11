# The Bigz Crochet — Frontend (GitHub Pages)

Katalog & tempahan kraf crochet buatan tangan. Frontend statik (HTML/CSS/JS vanilla) yang
berkomunikasi dengan **Google Apps Script** (REST API JSON) melalui `fetch()`.

```
index.html          ← halaman utama (wajib di root repo)
css/style.css       ← semua gaya (token reka bentuk Warm Artisanal Botanical)
js/config.js        ← SATU-SATUNYA fail yang perlu diedit: isi GAS_URL
js/api.js           ← lapisan fetch ke GAS
js/core.js          ← state, router & skrin pelanggan
js/admin.js         ← log masuk, dashboard, tempahan, invois, produk
js/admin-extra.js   ← pelanggan & hebahan, laporan, tetapan
js/main.js          ← pengendali acara & inisialisasi
```

Backend (`Kode.gs`) **tidak** ada dalam repo ini — ia dipasang di Google Apps Script.
Rujuk `PANDUAN-INSTALASI.md`.
