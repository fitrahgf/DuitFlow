# PRD Final — DuitFlow

## Aplikasi Pencatatan Keuangan Personal Berbasis Web (Cloud, Free Stack, AI-Coding Ready)

---

## 1. Ringkasan Produk

**DuitFlow** adalah aplikasi web pencatatan keuangan personal yang dirancang untuk:

* input transaksi super cepat,
* menjaga akurasi saldo wallet,
* memudahkan kontrol cashflow harian,
* membantu mengurangi belanja impulsif melalui sistem wishlist dengan masa tahan,
* dan memberikan insight keuangan yang simpel namun berguna.

Versi ini **langsung berbasis cloud**, bukan local-first, agar:

* data aman tersimpan online,
* bisa diakses lintas perangkat,
* arsitektur lebih siap production sejak awal,
* alur autentikasi lebih konsisten,
* dan integrasi sistem lebih rapi untuk pengembangan jangka panjang.

PRD ini disusun agar dapat dipahami dan dieksekusi oleh **AI coding agent** secara modular, terstruktur, dan minim ambiguitas.

---

## 2. Tujuan Produk

### Tujuan utama

Membuat aplikasi keuangan personal yang terasa:

* cepat saat dipakai,
* akurat untuk saldo,
* tidak ribet,
* dan berguna untuk keputusan belanja sehari-hari.

### Outcome yang diinginkan

* User bisa mencatat transaksi kurang dari 5 detik.
* User bisa memantau saldo tiap wallet dengan jelas.
* User bisa memindahkan saldo antar wallet tanpa membuat data kacau.
* User bisa menahan keinginan belanja impulsif dengan wishlist cooling-off.
* User bisa melihat pengeluaran utama dan tren sederhana tanpa dashboard rumit.

---

## 3. Positioning Produk

DuitFlow **bukan sekadar expense tracker biasa**.

Diferensiasi utamanya:

1. **Quick capture** untuk pencatatan super cepat.
2. **Wallet-based finance tracking** dengan saldo yang akurat.
3. **Internal transfer flow** antar wallet yang rapi.
4. **Wishlist cooling period** untuk menahan pembelian impulsif.
5. **UI ringan dan responsif** untuk mobile, tablet, dan desktop.

Fokus utama produk:
**personal finance user yang ingin mencatat uang masuk/keluar dengan cepat, menjaga saldo tetap akurat, dan lebih disiplin dalam keputusan belanja.**

---

## 4. Target User

### Primary user

Individu yang:

* punya beberapa sumber/wadah uang (cash, bank, e-wallet),
* sering belanja kecil-besar harian,
* ingin tahu uang lari ke mana,
* ingin pencatatan yang cepat,
* tidak mau ribet pakai spreadsheet manual.

### Secondary user

* freelancer,
* pekerja remote,
* penjual online skala kecil untuk keuangan pribadi,
* pengguna yang sedang membangun kebiasaan finansial sehat.

---

## 5. Prinsip Produk

1. **Speed first** — input harus sangat cepat.
2. **Ledger accuracy** — saldo tidak boleh dihitung secara rawan.
3. **Clarity over complexity** — insight cukup sederhana tapi berguna.
4. **Cloud-native free stack** — seluruh stack harus bisa dipakai gratis.
5. **Integrated system** — semua modul memakai data model yang konsisten.
6. **Mobile-first UX** — nyaman di HP terlebih dahulu.
7. **Safe defaults** — transaksi sensitif harus melewati flow yang aman.

---

## 6. Scope Produk Final

## In scope (fase inti)

* account registration & login
* dashboard ringkas
* multi-wallet / rekening / dompet
* transaksi pemasukan
* transaksi pengeluaran
* transfer antar wallet
* kategori transaksi
* subkategori opsional
* quick add transaction
* full form transaction
* riwayat transaksi
* filter & pencarian transaksi
* edit & soft delete transaksi
* wishlist pembelian
* cooling period wishlist 3–7 hari
* reminder wishlist jatuh tempo
* budget bulanan sederhana
* laporan & analitik dasar
* notifikasi dalam aplikasi
* pengaturan profil
* dark mode / light mode
* responsive UI

## Out of scope untuk versi ini

* OCR struk
* Telegram bot
* AI auto-categorization
* multi-user collaboration
* shared wallets
* recurring advanced automation kompleks
* PDF export kompleks
* koneksi bank otomatis
* investasi / hutang piutang / pajak / invoice system

Fitur out-of-scope boleh dipersiapkan struktur datanya bila ringan, tetapi **tidak dikembangkan sekarang**.

---

## 7. Stack Gratis yang Digunakan

Seluruh pilihan di bawah dipilih karena tersedia free tier / open-source / gratis untuk tahap pengembangan dan penggunaan awal.

### Frontend

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui**
* **Lucide React** (ikon SVG)
* **React Hook Form**
* **Zod**
* **TanStack Query**
* **Recharts** untuk grafik
* **next-themes** untuk dark/light mode

### Backend / Database / Auth / Storage

* **Supabase**

  * PostgreSQL database
  * Supabase Auth
  * Row Level Security
  * Realtime bila dibutuhkan ringan

### Utility / Validation / Date

* **date-fns**
* **clsx**
* **tailwind-merge**
* **nanoid** atau gunakan UUID bawaan database jika diperlukan di client

### Deployment

* **Vercel** free tier

### Version Control

* **GitHub** free

### Optional dev library yang masih gratis

* **Sonner** untuk toast notification
* **cmdk** untuk command / quick input experience
* **Framer Motion** untuk animasi ringan yang elegan

### Jangan gunakan

* library UI premium berbayar
* chart berbayar
* auth service berbayar lain
* database terpisah berbayar
* OCR berbayar
* automation tool berbayar

---

## 8. Arsitektur Sistem

Aplikasi menggunakan pola:

* Next.js frontend
* Supabase sebagai backend service
* Auth dan database terpusat
* semua data user terisolasi dengan RLS

### Prinsip arsitektur

* database adalah **single source of truth**
* saldo wallet **tidak boleh** menjadi sumber kebenaran utama jika rawan mismatch
* semua perubahan finansial harus tercermin dari ledger / transaksi
* integrasi antar modul harus melalui entity yang konsisten

---

## 9. Modul Sistem

### 9.1 Auth Module

Fungsi:

* daftar akun via email + password
* login
* logout
* reset password
* session persistence

Aturan:

* email unik
* password minimal 8 karakter
* validasi form wajib jelas
* redirect user non-login ke halaman auth
* semua data user scoped ke user_id masing-masing

### 9.2 Profile & Settings Module

Fungsi:

* edit nama
* edit timezone (default Asia/Jakarta)
* pilih tema light/dark/system
* pengaturan preferensi notifikasi
* mata uang default (default IDR)

### 9.3 Wallet Module

Wallet adalah wadah uang user.
Contoh:

* Cash
* BCA
* Dana
* OVO
* GoPay
* Mandiri

Atribut wallet:

* id
* user_id
* name
* type
* icon / icon_key
* color
* initial_balance
* is_archived
* created_at
* updated_at

Jenis wallet minimal:

* cash
* bank
* ewallet
* other

Aturan:

* user bisa membuat banyak wallet
* wallet bisa diarsipkan, bukan dihapus keras bila punya histori
* wallet archived tidak muncul di quick picker default
* setiap wallet harus bisa dihitung saldonya dari transaksi

### 9.4 Transaction Module

Jenis transaksi:

* income
* expense
* transfer

Atribut inti transaksi:

* id
* user_id
* wallet_id
* type
* amount
* title
* note
* category_id
* subcategory_id (nullable)
* transaction_date
* created_at
* updated_at
* deleted_at (soft delete)
* source = manual | quick_add | system_transfer | wishlist_conversion
* transfer_group_id (nullable)

Aturan umum:

* amount selalu positif di data input
* interpretasi plus/minus berdasarkan type
* transaksi tidak boleh tanpa wallet
* expense dan income wajib tepat satu wallet
* transfer tidak boleh hanya satu record mentah tanpa keterkaitan logis

### 9.5 Transfer Module

Transfer antar wallet harus sangat jelas.

#### Desain bisnis

Satu aksi transfer user menghasilkan **2 transaksi sistem**:

1. transaksi keluar dari wallet asal
2. transaksi masuk ke wallet tujuan

Keduanya dihubungkan oleh:

* transfer_group_id yang sama
* source = system_transfer

Atribut tambahan transfer:

* from_wallet_id
* to_wallet_id
* transfer_fee (opsional, default 0)

#### Aturan transfer

* wallet asal dan tujuan tidak boleh sama
* nominal transfer wajib > 0
* jika ada fee, fee dicatat sebagai expense terpisah dari wallet asal
* edit transfer harus mengupdate satu grup transfer secara atomik
* delete transfer harus soft delete semua transaksi terkait dalam satu grup
* transfer **tidak boleh** dihitung sebagai income/expense normal dalam analitik pengeluaran utama, kecuali fee

### 9.6 Category Module

Kategori default minimal:

* Makanan & Minuman
* Transportasi
* Belanja
* Tagihan
* Hiburan
* Kesehatan
* Pendidikan
* Gaji
* Bonus
* Hadiah
* Lainnya

Subkategori opsional, bukan wajib untuk MVP keras.

Aturan:

* kategori bisa system default + custom user
* kategori income dan expense dibedakan
* transfer tidak memakai kategori biasa, kecuali fee jika dibutuhkan

### 9.7 Quick Add Module

Quick add adalah fitur pembeda utama.

Tujuan:

* user bisa input cepat dari satu field / command-style form

Contoh input:

* makan 25000 dana
* gaji 3500000 bca
* kopi susu 18000 cash

Flow MVP aman:

* quick add tetap melewati parser lokal di frontend
* hasil parse ditampilkan sebagai preview singkat
* user bisa confirm simpan

Parsing minimal yang wajib didukung:

* title
* amount
* wallet

Parsing opsional:

* category auto suggestion

Jika parsing gagal:

* user diarahkan ke full form dengan field terisi sebagian

### 9.8 Full Transaction Form Module

Field minimal:

* type
* amount
* title
* wallet
* category
* date
* note

Tujuan:

* untuk pencatatan yang lebih akurat saat quick add tidak cukup

### 9.9 Transaction History Module

Fungsi:

* lihat semua transaksi
* filter berdasarkan tanggal
* filter berdasarkan wallet
* filter berdasarkan type
* filter kategori
* search berdasarkan title/note
* sort terbaru/terlama/nominal

Tampilan:

* mobile list card
* desktop table/list hybrid

### 9.10 Wishlist Module

Ini fitur diferensiasi utama kedua.

Tujuan:

* menahan pembelian impulsif
* memberi jeda berpikir sebelum checkout

Atribut wishlist:

* id
* user_id
* name
* target_price
* url (nullable)
* note (nullable)
* priority (low, medium, high)
* reason (nullable)
* cooling_days (3/5/7)
* start_date
* review_date
* status
* selected_wallet_id (nullable)
* created_at
* updated_at

Status wishlist:

* pending_review
* approved_to_buy
* cancelled
* postponed
* purchased

Aturan:

* default cooling period = 3 hari
* user boleh pilih 3, 5, atau 7 hari
* saat review_date tiba, item masuk notifikasi
* item wishlist tidak langsung jadi transaksi
* jika user memutuskan beli, sistem bisa bantu prefill jadi expense form
* conversion ke transaksi dilakukan manual-confirmed, bukan otomatis diam-diam

### 9.11 Budget Module

Scope budget dibuat sederhana.

Fitur:

* user set budget bulanan total
* optional: budget per kategori expense utama
* progress penggunaan budget
* warning saat mendekati limit

Aturan:

* budget hanya menghitung expense
* transfer antar wallet tidak dihitung sebagai expense budget
* fee transfer dihitung sebagai expense bila ada

### 9.12 Reports & Analytics Module

Analitik dasar yang wajib:

* total pemasukan bulan ini
* total pengeluaran bulan ini
* selisih net flow bulan ini
* total saldo semua wallet
* breakdown pengeluaran per kategori
* tren bulanan sederhana
* top spending category

Yang tidak boleh salah:

* transfer internal tidak boleh mendistorsi income vs expense
* fee transfer tetap boleh masuk pengeluaran
* soft-deleted transaction harus diabaikan

### 9.13 Notification Module

Notifikasi hanya dalam aplikasi untuk versi ini.

Jenis notif:

* wishlist review due
* budget hampir habis
* budget terlampaui
* transaksi belum lengkap (opsional ringan)

Tingkat prioritas:

* critical
* important
* info

Aturan:

* jangan spam user
* ada halaman notification center
* notif bisa ditandai read
* user bisa mematikan jenis notif tertentu

---

## 10. Aturan Bisnis Inti

Bagian ini wajib sangat jelas karena akan dipakai AI coding agent.

### 10.1 Source of truth saldo

Saldo wallet dihitung dari:

* initial_balance
* total income ke wallet
* total expense dari wallet
* total transfer masuk
* total transfer keluar
* dikurangi/ditambah sesuai transaksi aktif non-soft-delete

Saldo **jangan** dijadikan angka statis yang diupdate tanpa jejak ledger.

Boleh menambahkan cached balance / materialized calculation nanti untuk performa, tetapi:

* sumber kebenaran tetap transaksi ledger

### 10.2 Soft delete

Transaksi tidak dihapus keras secara default.
Gunakan:

* deleted_at nullable timestamp

Efek:

* transaksi soft delete tidak dihitung ke saldo, laporan, budget
* histori audit internal tetap terjaga

### 10.3 Edit transaksi

Edit transaksi harus:

* mengubah data transaksi lama
* memperbarui updated_at
* memicu refresh semua kalkulasi terkait

Jika transaksi adalah bagian dari transfer:

* edit dilakukan di level transfer group
* kedua sisi transfer wajib tetap sinkron

### 10.4 Date handling

* simpan timestamp standar database
* gunakan timezone user untuk tampilan
* laporan bulanan mengikuti timezone user
* default timezone user: Asia/Jakarta

### 10.5 Currency

* default IDR
* format rupiah konsisten
* belum mendukung multi-currency

### 10.6 Validation rules

* amount > 0
* nama wallet wajib
* title transaksi wajib
* review_date wishlist harus valid
* transfer source wallet dan destination wallet harus beda
* email wajib valid
* password minimal 8 karakter

### 10.7 Archiving rules

* wallet yang punya histori tidak boleh hard delete
* kategori default system tidak boleh hard delete
* kategori custom boleh diarsipkan

---

## 11. Database Design (Konseptual)

### 11.1 users

Gunakan auth bawaan Supabase.
Tambahkan profile table bila perlu.

### 11.2 profiles

* id
* full_name
* timezone
* currency_code
* theme_preference
* created_at
* updated_at

### 11.3 wallets

* id
* user_id
* name
* type
* icon_key
* color
* initial_balance
* is_archived
* created_at
* updated_at

### 11.4 categories

* id
* user_id nullable untuk system category
* name
* type (income / expense)
* is_default
* is_archived
* created_at
* updated_at

### 11.5 transactions

* id
* user_id
* wallet_id
* type
* amount
* title
* note
* category_id nullable
* subcategory_id nullable
* transaction_date
* source
* transfer_group_id nullable
* created_at
* updated_at
* deleted_at nullable

### 11.6 transfer_groups

* id
* user_id
* from_wallet_id
* to_wallet_id
* amount
* fee_amount
* transfer_date
* created_at
* updated_at
* deleted_at nullable

### 11.7 wishlists

* id
* user_id
* name
* target_price
* url
* note
* priority
* reason
* cooling_days
* start_date
* review_date
* status
* selected_wallet_id nullable
* created_at
* updated_at

### 11.8 budgets

* id
* user_id
* month_key
* total_limit
* category_id nullable
* amount_limit
* created_at
* updated_at

### 11.9 notifications

* id
* user_id
* type
* title
* body
* priority
* is_read
* action_url nullable
* created_at

---

## 12. Row Level Security

Semua tabel user data wajib menggunakan RLS.

Aturan dasar:

* user hanya bisa select data miliknya sendiri
* user hanya bisa insert data dengan user_id miliknya sendiri
* user hanya bisa update data miliknya sendiri
* user hanya bisa soft delete data miliknya sendiri

System category boleh dibaca semua user, tapi tidak boleh diubah user biasa.

---

## 13. Halaman Aplikasi

### 13.1 Auth Pages

* Login
* Register
* Forgot Password / Reset Password

### 13.2 Dashboard

Komponen utama:

* total saldo semua wallet
* quick add bar
* ringkasan income vs expense bulan ini
* budget progress singkat
* wishlist due reminder
* transaksi terbaru

Dashboard **jangan terlalu padat**.

### 13.3 Wallets Page

* list wallet
* saldo per wallet
* tambah wallet
* edit wallet
* archive wallet

### 13.4 Transactions Page

* list transaksi
* filter
* search
* add transaction
* edit transaction
* soft delete transaction

### 13.5 Transfer Page / Modal

* pilih wallet asal
* pilih wallet tujuan
* nominal
* fee opsional
* tanggal
* catatan opsional

### 13.6 Wishlist Page

* list item wishlist
* add wishlist
* status tracking
* due review section
* convert to purchase flow

### 13.7 Budget Page

* set monthly budget
* category budget optional
* progress & alert

### 13.8 Reports Page

* summary cards
* pie/bar/category chart
* monthly trend chart

### 13.9 Notifications Page

* daftar notif
* mark as read
* filter read/unread

### 13.10 Settings Page

* profile
* theme
* timezone
* notification preference

---

## 14. UX/UI Guidelines

### Prinsip UI

* modern, clean, ringan
* iOS-like icon feeling dengan SVG rapi
* input cepat lebih diprioritaskan daripada ornamen berat
* mobile-first
* spacing lega
* warna status konsisten
* dark mode dan light mode sama-sama nyaman

### Komponen wajib

* sticky mobile bottom nav
* floating / prominent quick add access
* wallet picker yang mudah disentuh
* modal / sheet yang nyaman di mobile
* chart sederhana, tidak ramai

### UX rules

* action penting maksimal 2–3 langkah
* destructive action harus ada konfirmasi
* feedback sukses/gagal jelas via toast atau inline state
* loading state harus halus
* empty state harus informatif

---

## 15. User Flow Inti

### 15.1 Registrasi

Register → verifikasi/login → masuk dashboard → onboarding ringan → tambah wallet pertama

### 15.2 Input transaksi cepat

Dashboard → quick add → parser preview → confirm → transaksi tersimpan → dashboard & saldo update

### 15.3 Input transaksi full form

Transactions → add → isi form → save → histori update

### 15.4 Transfer wallet

Transfer → pilih asal & tujuan → isi nominal → confirm → sistem buat transfer group + 2 transaksi sinkron → saldo update

### 15.5 Wishlist hold

Wishlist → tambah item → pilih cooling days → simpan → tunggu review date → notif muncul → user pilih beli / batal / tunda

### 15.6 Convert wishlist to purchase

Wishlist due → klik buy now → prefill form expense → pilih/fix wallet & category → save → status wishlist jadi purchased

---

## 16. Integrasi Antar Sistem

Semua sistem harus saling terhubung secara konsisten.

### Integrasi 1 — Wallet ↔ Transactions

* saldo wallet selalu bergantung ke transaksi aktif

### Integrasi 2 — Transfer ↔ Wallet

* transfer mengubah dua wallet sekaligus melalui ledger yang terhubung

### Integrasi 3 — Transactions ↔ Reports

* laporan membaca data transaksi aktif yang sudah dibersihkan dari transfer distortion

### Integrasi 4 — Wishlist ↔ Notifications

* review_date otomatis memunculkan notifikasi

### Integrasi 5 — Wishlist ↔ Transactions

* pembelian wishlist dapat diprefill menjadi transaksi expense

### Integrasi 6 — Budget ↔ Transactions

* setiap expense aktif memengaruhi progres budget

### Integrasi 7 — Settings ↔ Entire App

* timezone, theme, notification preference dipakai lintas halaman

---

## 17. Non-Functional Requirements

### Performance

* dashboard initial load cepat
* input transaksi terasa instan
* query transaksi harus tetap nyaman untuk data ratusan hingga ribuan record ringan

### Responsiveness

* wajib optimal di mobile
* tablet dan desktop tetap rapi

### Accessibility

* label form jelas
* color contrast aman
* button state jelas
* keyboard accessible di desktop

### Reliability

* tidak boleh ada mismatch saldo karena bug logika transfer/edit/delete
* action finansial penting harus aman dari double submit

---

## 18. Security Requirements

* Supabase Auth untuk login aman
* password dikelola auth service, bukan manual custom sendiri
* RLS wajib aktif di semua tabel sensitif
* validasi input di frontend dan backend boundary
* cegah double submit pada transaksi/transfer
* sanitasi input teks sederhana
* jangan expose service role key di client
* environment variable aman

---

## 19. Error Handling

Setiap operasi penting harus punya handling jelas:

* save transaction gagal
* transfer gagal
* login gagal
* budget save gagal
* wishlist update gagal

Tampilkan:

* pesan error manusiawi
* state loading
* retry bila relevan

Jangan tampilkan error teknis mentah ke user.

---

## 20. Seed Data Default

Saat user baru pertama kali masuk:

* optional onboarding create first wallet
* category default income & expense tersedia
* contoh empty state edukatif

Kategori default seed harus otomatis tersedia untuk semua user tanpa perlu input manual.

---

## 21. Analytics / Success Metrics

Metrik produk utama:

* waktu rata-rata input transaksi
* jumlah transaksi per user per minggu
* jumlah wallet per user aktif
* persentase wishlist yang dibatalkan
* persentase wishlist yang dibeli
* retensi user 7 hari
* frekuensi penggunaan quick add vs full form
* error rate transaksi / transfer

Metrik teknis:

* query failure rate
* auth failure rate
* duplicate submit incident
* saldo mismatch incident = target 0

---

## 22. Prioritas Development

## Phase 1 — Foundation (wajib)

* setup Next.js + Tailwind + shadcn/ui + Supabase
* auth
* profiles
* wallets
* categories
* transactions CRUD
* dashboard sederhana
* responsive layout
* dark/light mode

## Phase 2 — Core Finance Integrity

* transfer groups
* transaction filters/search
* reports dasar
* budget sederhana
* notification center basic

## Phase 3 — Differentiator

* wishlist module
* cooling period logic
* due review notifications
* convert wishlist to expense flow
* quick add parser

## Phase 4 — Polish

* empty state
* loading state
* animation ringan
* better charts
* UX refinement
* performance optimization

---

## 23. Definition of Done

Fitur dianggap selesai jika:

* UI berjalan di mobile, tablet, desktop
* validasi utama lengkap
* data tersimpan ke cloud
* RLS aktif
* edge case penting lolos
* tidak ada mismatch saldo pada flow normal
* edit/delete/transfer sudah sinkron ke laporan
* dark mode dan light mode berjalan baik
* no paid dependency required

---

## 24. Edge Cases Wajib Ditangani

### Wallet

* user mengarsipkan wallet yang punya histori
* user mencoba pilih wallet archived di transaksi baru

### Transactions

* nominal nol atau negatif
* tanggal kosong
* category kosong untuk expense/income
* double click submit
* edit transaksi lama bulan lalu
* soft delete transaksi yang memengaruhi budget

### Transfer

* transfer ke wallet yang sama
* edit nominal transfer
* delete salah satu sisi transfer
* fee transfer
* wallet asal archived

### Wishlist

* review date lewat
* user tunda ulang
* user beli tanpa wallet default
* URL invalid

### Auth

* email sudah terdaftar
* reset password invalid token
* session expired

---

## 25. Instruksi Implementasi untuk AI Coding Agent

1. Bangun sistem berbasis modul dan reusable components.
2. Prioritaskan akurasi data finansial daripada gimmick.
3. Gunakan TypeScript types yang ketat.
4. Gunakan schema validation dengan Zod.
5. Gunakan React Hook Form untuk form kompleks.
6. Gunakan TanStack Query untuk fetching/caching client state server data.
7. Semua operasi transaksi/transfer harus mempertimbangkan atomic consistency.
8. Semua query harus scoped by authenticated user.
9. Jangan implement fitur OCR, Telegram bot, atau paid services.
10. Jangan tambahkan dependency yang tidak benar-benar dibutuhkan.
11. Pastikan UI modern, minimal, cepat, dan nyaman di mobile.
12. Gunakan Lucide React untuk ikon SVG gaya rapi modern.
13. Implement dark mode/light mode sejak awal, bukan belakangan.
14. Strukturkan code agar mudah dilanjutkan di fase berikutnya.

---

## 26. Ringkasan Final

**DuitFlow** adalah aplikasi keuangan personal berbasis web cloud dengan fokus pada:

* pencatatan cepat,
* wallet tracking akurat,
* transfer internal yang rapi,
* budget dasar,
* insight sederhana,
* dan wishlist cooling-off untuk menahan belanja impulsif.

* langsung cloud,
* stack gratis,
* tanpa fitur distraksi,
* aturan bisnis lebih tegas,
* integrasi antar sistem jelas,
* dan siap diberikan ke AI coding agent sebagai fondasi implementasi.
