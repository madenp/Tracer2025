# SAKTI "Sistem Alumni Akuntansi Terintegrasi"

**SAKTI "Sistem Alumni Akuntansi Terintegrasi"** adalah sebuah aplikasi web (Single Page Application) berbasis React.js (via CDN) yang menggunakan Google Sheets sebagai database (melalui Google Apps Script). Aplikasi ini dirancang untuk mempermudah manajemen data alumni, pelacakan jejaring studi (Tracer Study), serta pemantauan dan evaluasi (Monev) pengisian data.

---

## 🚀 Fitur Utama

1. **Dashboard Data Alumni (`js/app.js`)**
   - Menampilkan tabel data alumni secara lengkap.
   - Fitur **CRUD (Create, Read, Update, Delete)** data alumni.
   - Terdapat **Stat Cards** untuk melihat ringkasan singkat (Total Lulusan, Rasio Gender, Jumlah Lulusan Cum Laude, dan Rata-rata Skor TOEFL).
   - Fitur pencarian, pengurutan (sorting), dan paginasi (pagination) otomatis.
2. **Tracer Study (`js/tracerStudy.js`)**
   - Mencocokkan data alumni umum dengan data alumni yang telah mengisi form *Tracer Study*.
   - Menyajikan **Card View** yang interaktif tentang status pengisian Tracer Study masing-masing alumni.
   - Menampilkan **Tingkat Respon** dari form Tracer Study, dan pelaporan masalah kontak / WhatsApp aktif.
   - Tombol klik-cepat untuk menghubungi alumni via WhatsApp atau menyalin link kontak.
   - Fitur untuk **Report Masalah** (misal: "No WA Salah", "Belum Ada No", "Belum Bekerja") yang otomatis disinkronasikan ke Sheet khusus (`Report`).
3. **Monev (Monitoring & Evaluasi) (`js/monev.js`)**
   - Menampilkan total target lulusan vs alumni yang sudah mengisi Tracer Study per periode waktu.
   - **Progress Bar** dinamis untuk memantau kelengkapan pendataan alumni secara visual.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini menggunakan pendekatan **Serverless** dan **No-Build Tool**, yang membuatnya sangat ringan dan mudah dimodifikasi serta dionst di platform statis seperti Vercel, Netlify, atau GitHub Pages.

- **Frontend**: HTML5, CSS3, ES6 JavaScript.
- **Framework**: [React 18](https://react.dev/) & [React-DOM](https://react.dev/) (via CDN umd).
- **Icons & UI Alerts**: [Font Awesome 6](https://fontawesome.com/) dan [SweetAlert2](https://sweetalert2.github.io/).
- **Backend/API**: Google Apps Script (GAS) dengan tipe keluaran JSON (`Content-Type: JSON`).
- **Database**: Google Sheets (Membaca nama sheet secara dinamis dan melakukan manipulasi Rows).

---

## 📂 Struktur File

```text
├── Code.gs             # Backend Google Apps Script (API Layer ke Google Sheets)
├── index.html          # File Utama Frontend (Aplikasi)
├── css/
│   └── style.css       # File Desain UI dan Responsivitas (Custom CSS)
└── js/
    ├── config.js       # File Konfigurasi sistem (Link API GAS, Definisi Kolom & Tabel)
    ├── app.js          # Logic halaman utama (SAKTI & Data Tabel)
    ├── tracerStudy.js  # Logic halaman Tracer Study (Manajemen Feedback WA)
    └── monev.js        # Logic halaman Monitoring dan Evaluasi (Progress Bar Tracer)
```

---

## ⚙️ Cara Instalasi / Deployment

### 1. Setup Database (Google Sheets) & Backend (Apps Script)
1. Buat **Google Sheets** baru sebagai database, sesuaikan judul dan urutan kolom dengan yang ada di `js/config.js`.
2. Buka sheet yang baru dibuat, klik menu **Extensions > Apps Script**.
3. Buat file baru (atau ganti isi `Code.gs`) dan **Paste seluruh isi file `Code.gs` dari repositori ini**.
4. Klik tombol **Deploy** > **New Deployment** (Pilih tipe *Web App*).
5. Pada bagian **Execute as**, pilih **Me** (akun Google Anda sendiri).
6. Pada bagian **Who has access**, pilih **Anyone** (Dapat diakses siapapun agar bisa difetch oleh frontend).
7. Simpan (Deploy) dan **Copy URL API** (`https://script.google.com/macros/s/.../exec`).

### 2. Setup Frontend Config
Buka file `js/config.js` menggunakan text editor lokal Anda:

```javascript
const CONFIG = {
  // GANTI URL INI dengan URL Apps Script Anda
  APPS_SCRIPT_URL: 'GANTI_DENGAN_URL_YANG_DI_COPY_DARI_LANGKAH_SEBELUMNYA',
  DEFAULT_SHEET: '3 Januari 2025',
  ...
}
```

### 3. Menjalankan Aplikasi Lokal
Anda tidak perlu melakukan operasi *npm install* atau *build*. Cukup buka file `index.html` pada browser Anda (Google Chrome, Firefox, dll), atau jika Anda menggunakan VSCode, Anda bisa menggunakan ekstensi [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

### 4. Hosting Publik
Upload keseluruhan folder ke penyedia layanan hosting gratis manapun dengan konfigurasi static site, seperti **GitHub Pages**, **Vercel**, atau **Netlify**, semuanya akan langsung bekerja secara otomatis.

---

## 📝 Catatan Sheet Names
Pastikan Anda memiliki konfigurasi nama sheet di file Google Sheets Anda:
- `Report` - *Digunakan untuk menyimpan log reporting bila ada No WA error / kendala lainnya.*
- `Tracer 2025` - *Digunakan sebagai target sheet Tracer Study.*
- `Depan` - *Untuk menampilkan target periode di tab khusus Monev.*

## ©️ Copyright
Aplikasi ini dikembangkan untuk kebutuhan operasional monitoring Alumni Akuntansi - 2025.
Made with ❤️ by [@madenp_](https://instagram.com/madenp_)
