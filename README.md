# Catatan Keuangan — Editorial Mobile Neo-Banking

Aplikasi pencatatan keuangan pribadi modern berbasis web dengan konsep desain **Editorial Mobile Neo-Banking**, terintegrasi penuh secara real-time dengan Supabase (PostgreSQL Database & Authentication), Chart.js, Tailwind CSS, Lucide Icons, serta font editorial Plus Jakarta Sans dan JetBrains Mono.

---

## 🎨 Konsep Desain: Editorial Mobile Neo-Banking

Aplikasi ini menggunakan sistem desain *Editorial Mobile Neo-Banking* yang terinspirasi dari aplikasi neo-banking modern dan publikasi finansial premium:

- **Palet Warna Utama:**
  - **Bordeaux (`#6B1D2F` / `#8E2940` / `#F5E8EB`):** Aksen editorial elegan dan identitas brand.
  - **Linen (`#F7F3EC` / `#FFFDF9` / `#E4DDD0`):** Latar belakang dan kartu Light Mode bernuansa hangat dan tenang.
  - **Obsidian (`#0F0D0C` / `#191614` / `#312B27`):** Latar belakang dan kartu Dark Mode dengan kontras tinggi yang nyaman di mata.
  - **Jade Green (`#15803D` / `#DCFCE7`):** Pemasukan, saldo surplus, dan progres tabungan.
  - **Crimson Red (`#B91C1C` / `#FEE2E2`):** Pengeluaran dan tagihan jatuh tempo mendesak.
  - **Amberwarm (`#D97706` / `#FEF3C7`):** Indikator peringatan dan countdown H-x tagihan.

- **Tipografi Finansial:**
  - **Plus Jakarta Sans:** Teks antarmuka, judul, dan navigasi.
  - **JetBrains Mono (`.font-money`):** Format nominal angka dan data tabular monospaced untuk keterbacaan finansial optimal.

- **Finishing Kartu Bank Dinamis:**
  - Kartu Total Saldo (`.card-all`), BCA (`.card-bca`), SeaBank (`.card-seabank`), Bibit (`.card-bibit`), E-Wallet (`.card-ewallet`), dan Dompet Tunai (`.card-tunai`).

---

## 🚀 Fitur Utama

1. **Autentikasi Aman:** Login dan Registrasi real-time menggunakan Supabase Auth dengan penanganan sesi otomatis.
2. **Interactive Swipeable Wallet Cards Carousel:**
   - Navigasi geser (drag & swipe) kartu perbankan dengan indikator *dots*.
   - Saldo live real-time dari 5 akun terdaftar.
   - Tombol instan "+ Catat" dan "Transfer" langsung di setiap kartu.
3. **Arta Safe-to-Spend Daily Calculator:**
   - Kalkulasi otomatis batas aman belanja per hari berdasarkan sisa budget dan sisa hari pada bulan berjalan.
4. **Fast-Tap Quick Templates (1-Tap):**
   - Pencatatan transaksi rutin instan (Kopi Susu, Makan Siang, Bensin, Parkir) langsung tersimpan ke database.
5. **Thumb-Zone Bottom Navigation Dock & Center Speed Dial:**
   - Dock 5 menu ergonomis: Beranda, Riwayat, Tombol Tambah (+), Analitik, dan Dompet.
   - Speed dial menu dengan animasi rotasi untuk pencatatan cepat Pengeluaran, Pemasukan, Transfer, dan Setor Goals.
6. **Riwayat Transaksi Multi-Filter:**
   - Pencarian real-time dan multi-filter (Jenis, Urutan, Akun, Kategori).
   - Pengelompokan visual berdasarkan tanggal relatif (*Hari Ini*, *Kemarin*, dan tanggal lengkap).
7. **Laporan & Analitik Interaktif:**
   - Segmented control Analisis Pengeluaran vs Analisis Pemasukan.
   - Bar chart mingguan (Minggu 1 s/d 4) interaktif.
   - Donut Chart per kategori berbasis Chart.js dengan label total di tengah donat dan breakdown persentase.
8. **Budgeting Bulanan:** Batas anggaran per kategori dengan indikator visual dan peringatan over-budget.
9. **Goals Tabungan:** Target tabungan impian dengan pelacak progres dan tombol setoran instan.
10. **Gift Tracker:** Perencanaan kado dan hadiah momen spesial beserta countdown hari.
11. **Reminder Tagihan & Cicilan:** Pelacak jatuh tempo dengan countdown status (*H-x*, *Hari Ini*, *Terlambat*), serta pemrosesan otomatis recurring monthly bills.
12. **Arsip Bulanan:** Pengelompokan riwayat per bulan dengan akordeon interaktif dan rekap arus kas.
13. **Mode Privasi & Dark Mode:**
    - Tombol sembunyikan saldo (*Privacy Eye*) mengubah nominal menjadi `Rp •••••••`.
    - Dark mode Obsidian dengan persistensi di `localStorage`.
14. **Desain Responsif:** Tampilan mobile-first yang adaptif untuk Mobile, Tablet, dan Desktop.

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Tailwind CSS (CDN), Lucide Icons
- **Backend / Database:** Supabase (PostgreSQL & Realtime Auth)
- **Visualisasi Data:** Chart.js
- **Typography:** Plus Jakarta Sans & JetBrains Mono

---
© Moammar Zulfikar • Catatan Keuangan — Editorial Mobile Neo-Banking
