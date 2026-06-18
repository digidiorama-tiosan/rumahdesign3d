# RumahDesign3D — Floor Planner

Aplikasi web (statis) untuk desain rumah: denah 2D, Smart Wall, multi-lantai, Site Plan,
RAB + Struktur + Take-Off, MEP, 3D realistis + Tur Jalan, Gambar Kerja PDF, DXF, dan
**AI Studio** (Auto Layout, Regulation Checker, Design Assistant, RAB Optimizer,
Sun & Feng Shui, Interior Generator, Developer Mode, Renovation, Scan, Marketplace Template).

## Menjalankan di PC (lokal)

File utama: **`index.html`** (otomatis membuka `Floor Planner 2.0.html`).

Aplikasi memuat beberapa library (Three.js, jsPDF, Google Fonts) dari internet,
jadi **PC perlu koneksi internet** saat dipakai. Penyimpanan proyek memakai
`localStorage` browser (otomatis tersimpan per-browser).

Cara paling andal — jalankan server statis lalu buka `http://localhost:8000`:

### Opsi A — Python (sudah ada di kebanyakan Mac/Linux)
```bash
cd rumah3d
python3 -m http.server 8000
# buka http://localhost:8000 di browser
```

### Opsi B — Node.js
```bash
cd rumah3d
npx serve .        # atau: npx http-server -p 8000
```

### Opsi C — VS Code
Pasang ekstensi **Live Server**, klik kanan `index.html` → **Open with Live Server**.

### Opsi D — buka langsung (paling cepat)
Dobel-klik `index.html`. Sebagian besar fitur jalan via `file://`,
tetapi server lokal (Opsi A–C) lebih disarankan agar `localStorage`,
upload foto (Scan), dan ekspor berjalan konsisten.

## Struktur

```
rumah3d/
├── index.html              ← entry point (redirect)
├── Floor Planner 2.0.html  ← aplikasi utama
├── styles.css
└── js/
    ├── state.js        render.js     interact.js   rooms.js
    ├── site.js         roof.js       furniture.js  walls2.js
    ├── roomdetect.js   mep.js        construction.js  structure.js
    ├── prices.js       rab.js        three3d.js    drawings.js
    ├── dxf.js          ailayout.js   reg.js        devmode.js
    ├── ai.js           export.js     app.js
```

## Catatan untuk pengembangan lanjut (User Plan)

Arsitektur sudah modular & berbasis fungsi global, sehingga gating fitur per-paket
(mis. Free / Pro / Developer) bisa ditambahkan di lapisan UI tanpa membongkar engine —
misalnya membungkus tombol AI Studio / DXF / Developer Mode dengan pengecekan `userPlan`.
