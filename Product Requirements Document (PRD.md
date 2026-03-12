## 📄 Product Requirements Document (PRD): Aplikasi Keuangan Pintar

### 1. Ringkasan Proyek

* **Nama Proyek:** (Bisa kamu tentukan nanti, misal: *DuitFlow* atau *Nge-Track*)
* **Platform:** Web Application (Responsive/Mobile-First)
* **Tech Stack:** * Frontend: React / Next.js / Vue (Di-hosting di **Vercel**)
* Backend & Database: **Supabase** (PostgreSQL, Auth, API)


* **Tujuan Utama:** Membangun aplikasi pencatat keuangan yang minim klik, sangat terotomatisasi, dan bisa diakses dari perangkat mana pun dengan sinkronisasi *real-time*.

### 2. Fitur Inti (MVP - Minimum Viable Product)

Sebelum masuk ke fitur "manis", ini adalah pondasi wajib yang harus beres pertama kali:

* **Sistem Autentikasi:** Login/Register menggunakan email atau Google Auth (Bawaan Supabase).
* **Dashboard Utama:** Menampilkan sisa saldo bulan ini, total pemasukan, dan total pengeluaran dalam bentuk grafik sederhana.
* **CRUD Transaksi:** Fitur standar untuk menambah, membaca, mengedit, dan menghapus data pemasukan/pengeluaran.
* **Manajemen Kategori:** Pembuatan kategori pengeluaran (Makanan, Transportasi, Tagihan, dll).

### 3. Fitur "Manis" (Unique Selling Propositions)

Ini adalah daftar fitur unik yang membuat aplikasimu berbeda dari aplikasi di pasaran, dieksekusi secara bertahap:

* **Smart Input (CLI-Style):** Kolom teks tunggal di halaman depan. Ketik `Bensin Pertamax 35k`, sistem otomatis memecahnya menjadi Kategori: Transportasi, Catatan: Bensin Pertamax, Nominal: 35.000.
* **Project-Based Budgeting:** Tombol "Buat Proyek" yang otomatis men-generate struktur folder/sub-kategori khusus (mirip fitur aplikasi *note* buatanmu). Contoh: Proyek "Liburan" otomatis membuat sub-kategori Tiket, Hotel, dan Makan.
* **Cooling-Off Wishlist:** Halaman khusus untuk menempelkan *link* barang incaran. Terdapat *timer* mundur (misal 7 hari) sebelum tombol "Beli" atau "Batalkan" aktif.
* **Subscription Kill-Switch:** *Reminder* otomatis (di *dashboard* atau via email) H-3 sebelum tagihan langganan bulanan jatuh tempo.
* **Telegram/WhatsApp Bot Sync:** Bot sederhana untuk mencatat pengeluaran via *chat* saat sedang di luar, yang otomatis terkirim ke *database* Supabase.

---

### 4. Struktur Database Awal (Supabase PostgreSQL)

Agar ada gambaran teknis, ini struktur tabel (*schema*) yang perlu kamu siapkan di Supabase nanti:

* **Tabel `users**` (Disediakan otomatis oleh Supabase Auth)
* **Tabel `transactions**`
* `id` (UUID)
* `user_id` (Relasi ke tabel users)
* `amount` (Angka/Integer)
* `type` (Pemasukan / Pengeluaran)
* `category` (Teks)
* `note` (Teks)
* `created_at` (Timestamp)


* **Tabel `projects**` (Untuk fitur auto-generate)
* `id` (UUID)
* `name` (Teks, misal: Liburan Bali)
* `budget_target` (Angka)


* **Tabel `wishlist**` (Untuk fitur Cooling-off)
* `item_name` (Teks)
* `url` (Teks)
* `price` (Angka)
* `unlock_date` (Timestamp - tanggal kapan barang boleh dibeli)



---

### 5. Alur Kerja Deployment (Workflow)

Ini adalah alur kerjamu sehari-hari saat men-develop aplikasi ini:

1. Kamu menulis kode (*coding* UI dan logika fitur) di laptop (Localhost).
2. Kamu menyimpan perubahan ke repositori **GitHub**.
3. **Vercel** mendeteksi perubahan di GitHub dan langsung melakukan *build* & *deploy* otomatis.
4. Aplikasi versi terbaru langsung *live* dan bisa kamu tes di HP saat itu juga.
5. Data tersimpan aman di *cloud* **Supabase**.