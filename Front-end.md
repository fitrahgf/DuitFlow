## Frontend Spec — **DuitFlow**

Versi ini dibuat **siap tempel ke PRD / AI coding agent**, fokus ke implementasi frontend yang clean, modern, mobile-first, dan kuat di fitur transaksi + pencarian pola pengeluaran.

---

# 1. Frontend Objective

Frontend **DuitFlow** harus memenuhi 5 tujuan utama:

1. **Input transaksi secepat mungkin**
2. **Membuat saldo dan arus uang mudah dipahami**
3. **Memudahkan pencarian histori dan pola pengeluaran**
4. **Nyaman dipakai di mobile, tablet, desktop**
5. **Terasa modern, ringan, dan tidak melelahkan**

---

# 2. Global UI Direction

## Visual tone

* clean
* modern
* premium sederhana
* minim noise
* fokus ke konten dan angka

## Design keywords

* soft card
* spacious
* rounded
* fast
* calm
* financial clarity

## UI principles

* angka uang harus dominan
* action penting harus dekat dengan jempol di mobile
* search dan filter tidak boleh tersembunyi terlalu dalam
* 1 halaman fokus pada 1 tujuan utama
* data kompleks diringkas dulu, detail muncul saat dibutuhkan

---

# 3. Global Layout Spec

## 3.1 Mobile App Shell

### Header mobile

Komponen:

* logo / text app name: **DuitFlow**
* tanggal ringkas
* tombol notif
* avatar / menu kecil

### Main content

* padding horizontal: 16px
* spacing section: 16–24px
* safe area bottom diperhatikan

### Bottom navigation

Menu utama:

* Home
* Transactions
* Quick Add
* Wishlist
* Reports

### Floating action

* tombol Quick Add boleh dibuat floating menonjol di tengah bawah atau sticky input bar di dashboard
* aksi ini harus selalu mudah dijangkau

---

## 3.2 Tablet/Desktop App Shell

### Sidebar kiri

Menu:

* Dashboard
* Transactions
* Wallets
* Transfer
* Wishlist
* Budget
* Reports
* Notifications
* Settings

### Topbar desktop

Isi:

* global search ringan
* quick add button
* theme toggle
* notif
* profile dropdown

### Content width

* max-width utama: 1280px–1440px
* page padding desktop: 24px–32px

---

# 4. Design System Spec

## 4.1 Typography

Gunakan hierarchy yang jelas:

### Level

* Page Title
* Section Title
* Summary Number
* Card Title
* Metadata
* Caption

### Rules

* nominal uang: bold, besar, konsisten
* label dan metadata: muted
* body text: jangan terlalu kecil
* gunakan tabular number untuk angka jika memungkinkan

---

## 4.2 Radius

* card: `rounded-2xl`
* button/input: `rounded-xl`
* small chip: `rounded-full`
* mobile sheet: `rounded-t-3xl`

---

## 4.3 Border & shadow

* border tipis halus
* shadow sangat ringan
* hindari box shadow berat
* depth dibuat dari contrast surface, bukan efek berlebihan

---

## 4.4 Icon system

Pakai **Lucide React**.

### Rule

* icon harus konsisten ukuran
* gunakan outline clean
* icon punya peran bantu scan, bukan dekorasi

Contoh mapping:

* wallet = Wallet / Landmark / CreditCard
* expense = ArrowUpRight / Receipt
* income = ArrowDownLeft
* transfer = Repeat / ArrowLeftRight
* wishlist = Heart / Clock3
* report = BarChart3 / PieChart
* notification = Bell
* settings = Settings

---

## 4.5 Color roles

### Semantic colors

* primary
* success
* warning
* danger
* info
* muted

### Transaction colors

* income: hijau lembut
* expense: merah lembut
* transfer: biru/slate
* archived: abu muted

### Status wishlist

* pending_review: amber
* approved_to_buy: blue/green
* cancelled: muted red
* postponed: slate
* purchased: emerald

---

# 5. Core Shared Components

Komponen ini harus reusable lintas halaman.

## 5.1 `AppShell`

Tugas:

* wrapper layout global
* render mobile nav / desktop sidebar
* topbar
* content container

---

## 5.2 `PageHeader`

Props:

* title
* description
* primaryAction
* secondaryAction
* optional chips / tabs

Dipakai di semua halaman utama.

---

## 5.3 `MoneySummaryCard`

Isi:

* label
* nominal
* trend opsional
* subtitle kecil
* icon opsional

Dipakai untuk:

* total saldo
* income bulan ini
* expense bulan ini
* net flow
* budget used

---

## 5.4 `QuickAddBar`

Komponen inti.

### Elemen

* input command style
* placeholder transaksi contoh
* parser preview
* confirm button
* fallback ke full form

### Contoh placeholder

* `contoh: kopi 18000 dana`
* `contoh: gaji 3500000 bca`

---

## 5.5 `WalletCard`

Isi:

* icon wallet
* nama wallet
* type
* saldo
* optional mini indicator kontribusi

Dipakai di dashboard dan wallets page.

---

## 5.6 `TransactionCard`

Untuk mobile.

Isi:

* icon kategori / type
* title
* metadata: wallet + tanggal
* kategori kecil
* nominal kanan
* badge source/type opsional

---

## 5.7 `TransactionTable`

Untuk desktop.

Kolom minimal:

* tanggal
* judul
* kategori
* wallet
* type
* nominal
* action

---

## 5.8 `SearchInput`

Reusable untuk transactions, wallets, reports bila perlu.

Fitur:

* clear button
* leading icon search
* keyboard-friendly
* debounce ringan

---

## 5.9 `FilterChipGroup`

Untuk quick filters.

Contoh:

* 7 hari
* 30 hari
* bulan ini
* expense
* income
* transfer
* semua wallet

---

## 5.10 `EmptyState`

Isi:

* icon
* title
* desc
* CTA utama

---

## 5.11 `LoadingSkeleton`

Gunakan skeleton untuk:

* cards
* list item
* table row
* chart placeholder

---

## 5.12 `InsightCard`

Untuk menampilkan hasil kalkulasi penting.

Contoh:

* pengeluaran kopi
* top spending category
* budget hampir habis
* wishlist due

---

# 6. Halaman — **Dashboard**

## 6.1 Tujuan

Menjadi pusat ringkasan cepat dan titik masuk ke aksi paling sering.

## 6.2 Struktur layout

Urutan section:

### Section A — Summary Hero

Isi:

* total saldo semua wallet
* net flow bulan ini
* tombol quick add
* shortcut transfer

### Section B — Quick Add

Quick add bar harus tampil jelas di atas fold.

### Section C — Wallet Snapshot

* list horizontal wallet
* saldo masing-masing
* tombol “lihat semua wallet”

### Section D — Cashflow Summary

* income bulan ini
* expense bulan ini
* net flow
* mini trend opsional

### Section E — Budget & Wishlist

* progress budget bulan ini
* wishlist yang due
* CTA review

### Section F — Recent Transactions

* 5–10 transaksi terbaru
* tombol menuju Transactions

---

## 6.3 Dashboard behavior

* setelah save transaksi, summary update cepat
* recent transactions auto refresh
* wallet balances ikut refresh
* jika belum ada wallet, tampil onboarding state

---

## 6.4 Empty state dashboard

Jika user baru:

* tampil welcome card
* CTA tambah wallet pertama
* tampil edukasi quick add
* tampil contoh transaksi

---

# 7. Halaman — **Transactions**

Ini halaman paling kritikal.

## 7.1 Tujuan

* melihat histori transaksi
* mencari transaksi tertentu
* memfilter transaksi dengan cepat
* memahami total pengeluaran/pemasukan berdasarkan kata kunci, kategori, wallet, dan waktu

---

## 7.2 Struktur layout

Urutan ideal:

### Header

* title: Transactions
* description: ringkasan jumlah transaksi / period aktif
* CTA: tambah transaksi

### Search section

* search input besar selalu terlihat
* placeholder:
  `Cari transaksi, kategori, wallet, atau catatan`

### Quick filter chips

* Semua waktu
* 30 hari
* 7 hari
* Bulan ini
* Expense
* Income
* Transfer

### Advanced filters

Buka via button/filter sheet:

* wallet
* kategori
* subkategori
* custom date
* nominal min/max
* source
* sort

### Search insight summary

Muncul saat search/filter aktif.

### Transaction result list

* mobile card list
* desktop table/list hybrid

---

## 7.3 Search & spending insight spec

Ini fitur wajib yang kamu minta.

### User stories

* user ingin tahu total pengeluaran untuk “kopi”
* user ingin tahu total “kopi” selama ini, sebulan, seminggu
* user ingin membatasi hanya wallet tertentu
* user ingin kombinasikan keyword dan kategori

### Search scope

Search harus bisa membaca:

* `title`
* `note`
* `category name`
* `subcategory name`
* `wallet name`

### Search result summary

Saat keyword aktif, tampil panel atas:

#### Contoh

**Hasil pencarian: “kopi”**

* total sepanjang waktu
* total 30 hari terakhir
* total 7 hari terakhir
* jumlah transaksi
* rata-rata nominal
* transaksi terakhir

### Aturan kalkulasi

* jika mode yang dibaca adalah **expense insight**, hanya hitung transaksi `type=expense`
* transfer tidak ikut
* income tidak ikut, kecuali user ubah mode

### Quick tabs di search mode

* Semua
* 30 Hari
* 7 Hari
* Bulan Ini
* Custom

### Optional visual

* mini bar trend per minggu
* sparkline pengeluaran keyword
* tidak perlu chart besar

---

## 7.4 Kategori filter behavior

User bisa:

* pilih satu kategori
* multi-select kategori opsional
* gabungkan kategori + keyword

### Contoh

Keyword: `kopi`
Kategori: `Makanan & Minuman`
Wallet: `Dana`
Range: `30 hari`

Hasil:

* summary total
* list transaksi relevan
* insight wallet / frekuensi

---

## 7.5 Transaction row/card spec

## Mobile card

Isi:

* icon kategori/type
* title
* subline: wallet • tanggal
* kategori kecil
* nominal kanan
* badge jika transfer / quick add / wishlist_conversion

### Action

Tap card:

* buka detail/edit sheet

Swipe optional:

* edit
* delete

---

## Desktop table

Kolom:

* tanggal
* judul
* kategori
* wallet
* tipe
* nominal
* action

### Row action

* edit
* soft delete
* duplicate opsional nanti

---

## 7.6 Transaction detail/edit

### Mobile

* full screen sheet / bottom sheet tinggi

### Desktop

* dialog modal sedang

### Field

* type
* amount
* title
* wallet
* category
* date
* note

### Footer action

* save
* save & add another
* soft delete

---

## 7.7 Filter sheet mobile

Isi:

* type
* wallet
* kategori
* periode
* nominal
* sort

Action:

* apply
* reset all

Filter sheet harus cepat dibuka/tutup dan state filter mudah dibaca setelah diterapkan.

---

## 7.8 Empty states transactions

### Tidak ada transaksi

* icon receipt
* text: Belum ada transaksi
* CTA: Tambah transaksi

### Search tidak ketemu

* text: Tidak ada hasil
* desc: Coba kata lain atau ubah filter

---

# 8. Halaman — **Wallets**

## 8.1 Tujuan

Menampilkan semua wadah uang user dengan saldo yang jelas dan mudah dikelola.

## 8.2 Struktur

### Header

* title Wallets
* total semua wallet
* CTA tambah wallet

### Wallet list

* card grid di desktop
* list card di mobile

### Archived filter

* tab active / archived

---

## 8.3 Wallet card spec

Isi:

* icon
* wallet name
* wallet type
* current balance
* created/updated info kecil opsional
* dropdown action

Action:

* edit
* archive
* view transactions
* create transaction
* transfer from/to

---

## 8.4 Wallet detail page/sheet

Isi:

* nama wallet
* saldo sekarang
* histori transaksi wallet
* transfer in/out summary
* action cepat

---

## 8.5 Add/edit wallet form

Field:

* name
* type
* icon
* color
* initial balance

UX:

* preview wallet appearance
* validasi nama wajib
* archived wallet tidak bisa dipakai untuk transaksi baru

---

# 9. Halaman — **Transfer**

## 9.1 Tujuan

Membuat perpindahan saldo antar wallet aman, jelas, dan tidak membingungkan.

## 9.2 Struktur

### Header

* title Transfer
* desc singkat:
  “Pindahkan saldo antar wallet tanpa memengaruhi income/expense normal.”

### Form card

Field:

* from wallet
* to wallet
* amount
* fee optional
* date
* note optional

### Preview summary

Sebelum submit tampil:

* keluar dari wallet A
* masuk ke wallet B
* fee jika ada
* total pengurang dari wallet asal

---

## 9.3 UX rules

* from dan to tidak boleh sama
* jika wallet asal archived, tampil disabled
* submit harus anti double click
* setelah sukses, tampil toast dan update saldo kedua wallet

---

## 9.4 Transfer history

Boleh ada section list transfer terakhir:

* route transfer
* amount
* fee
* date
* action edit/delete

Di UI, transfer tampil sebagai **1 item logis**, bukan 2 item sistem terpisah.

---

# 10. Halaman — **Wishlist**

## 10.1 Tujuan

Membantu user menahan pembelian impulsif dan meninjau keputusan belanja lebih sadar.

## 10.2 Struktur

### Header

* title Wishlist
* subtitle edukatif kecil
* CTA tambah wishlist

### Quick tabs

* Semua
* Due Review
* Pending
* Postponed
* Purchased
* Cancelled

### Sections

* due today / due soon
* active wishlist
* completed history

---

## 10.3 Wishlist card spec

Isi:

* item name
* target price
* review date
* cooling days
* priority
* wallet pilihan opsional
* status badge

Action:

* review now
* postpone
* mark buy
* cancel

---

## 10.4 Wishlist form

Field:

* name
* target price
* url
* note
* priority
* reason
* cooling days
* selected wallet optional

UX:

* review date dihitung otomatis
* tampil info:
  “Item ini bisa direview kembali pada [tanggal]”

---

## 10.5 Due review experience

Saat item due:

* tampil highlight card di atas
* CTA besar:

  * beli sekarang
  * tunda lagi
  * batalkan

Jika user pilih beli:

* buka prefilled expense form
* setelah save transaksi, status wishlist jadi purchased

---

# 11. Halaman — **Budget**

## 11.1 Tujuan

Memberikan kontrol ringan terhadap batas pengeluaran bulanan.

## 11.2 Struktur

### Header

* title Budget
* subtitle progress bulan berjalan
* CTA set/edit budget

### Summary

* budget total
* used amount
* remaining
* percentage bar

### Category budgets

Opsional:

* list kategori
* progress per kategori

### Alerts

* hampir habis
* terlampaui

---

## 11.3 Visual direction

* progress bar tebal dan jelas
* threshold warna:

  * aman
  * warning
  * over limit

---

## 11.4 Budget behavior

* hanya menghitung expense
* transfer tidak ikut
* fee transfer ikut bila expense aktif

---

# 12. Halaman — **Reports**

## 12.1 Tujuan

Menampilkan insight sederhana, bukan dashboard analitik yang berat.

## 12.2 Struktur

### Summary cards

* total income
* total expense
* net flow
* total saldo

### Filters

* 7 hari
* 30 hari
* bulan ini
* custom
* wallet
* kategori

### Charts

* expense by category
* monthly trend
* top spending category

### Insight cards

* kategori paling boros
* wallet paling aktif
* rata-rata pengeluaran harian

### Search spending insight

Modul khusus untuk keyword spending.

---

## 12.3 Search spending insight spec

Input:

* keyword
* date range
* wallet opsional
* kategori opsional

Output:

* total nominal keyword
* frekuensi transaksi
* avg nominal
* peak week/month
* transaksi terakhir

Contoh:
**Insight “kopi”**

* total 30 hari: Rp210.000
* frekuensi: 11 transaksi
* rata-rata: Rp19.091
* minggu paling boros: minggu ke-2

Ini sangat kuat sebagai fitur “smart insight” tanpa AI kompleks.

---

## 12.4 Chart direction

Gunakan Recharts dengan rule:

* sederhana
* label terbaca
* tidak terlalu penuh
* tooltips jelas
* mobile tetap usable

Chart disarankan:

* bar chart kategori
* line chart tren bulanan
* donut chart hanya jika tetap terbaca

---

# 13. Halaman — **Notifications**

## 13.1 Tujuan

Menjadi pusat pengingat penting, tidak spam.

## 13.2 Struktur

* tabs: All / Unread / Read
* filter by type
* notification list

## 13.3 Notification card

Isi:

* icon priority/type
* title
* body
* timestamp
* action CTA jika ada

Contoh:

* Wishlist siap direview
* Budget hampir habis
* Budget terlampaui

---

## 13.4 Behavior

* mark as read
* mark all as read
* click notification buka target page

---

# 14. Halaman — **Settings**

## 14.1 Struktur

Section:

* Profile
* Theme
* Timezone
* Currency
* Notification Preferences
* Account actions

## 14.2 UI direction

Gunakan grouped settings card, sederhana seperti app utility modern.

---

# 15. Auth Pages

## 15.1 Login

Elemen:

* logo
* heading singkat
* email
* password
* forgot password
* submit
* link ke register

## 15.2 Register

Elemen:

* full name
* email
* password
* confirm password
* submit

## 15.3 Forgot password

Elemen:

* email
* submit
* state sukses/gagal jelas

## Style auth

* centered card
* clean
* fokus form
* tanpa visual berat

---

# 16. Responsive Behavior Rules

## Mobile

* default card/list
* filter via sheet
* bottom nav aktif
* quick actions besar

## Tablet

* 2-column card layout mulai muncul
* lebih banyak data dalam 1 layar

## Desktop

* sidebar aktif
* table/list hybrid
* modal/dialog lebih nyaman
* chart lebih lebar

---

# 17. Interaction Rules

## 17.1 Feedback

Gunakan:

* toast sukses/gagal
* inline validation
* button loading
* skeleton loading

## 17.2 Confirmation

Wajib untuk:

* soft delete transaksi
* archive wallet
* delete transfer
* cancel wishlist bila diperlukan

## 17.3 Prevent duplicate submit

* disable button saat submit
* tampil spinner
* idempotent UI state

---

# 18. State Rules

## State wajib tiap halaman

* loading
* empty
* success
* error
* partial result
* filtered/search mode

---

# 19. Search Rules Detail untuk AI Coding Agent

Bagian ini bisa langsung masuk ke PRD.

## Search transactions behavior

1. Search input selalu visible di halaman Transactions.
2. Search melakukan query terhadap:

   * transaction title
   * transaction note
   * category name
   * subcategory name
   * wallet name
3. Search dapat digabung dengan:

   * type
   * category
   * wallet
   * date range
4. Saat search aktif, frontend menampilkan `TransactionSearchSummary`.
5. `TransactionSearchSummary` wajib menampilkan:

   * total nominal sepanjang waktu
   * total 30 hari terakhir
   * total 7 hari terakhir
   * jumlah transaksi
6. Jika mode insight adalah expense, hanya transaksi `type=expense` yang dihitung.
7. Transfer internal tidak boleh ikut dalam expense insight.
8. Search result harus tetap menampilkan daftar transaksi yang relevan di bawah summary.
9. Summary dan result harus ikut berubah saat filter/wallet/date range berubah.
10. Search bar harus punya clear state yang mudah.

---

# 20. Component Tree yang Disarankan

## Shared

* `AppShell`
* `PageHeader`
* `MoneySummaryCard`
* `InsightCard`
* `SearchInput`
* `FilterChipGroup`
* `EmptyState`
* `LoadingSkeleton`
* `ConfirmDialog`

## Dashboard

* `DashboardSummarySection`
* `QuickAddBar`
* `WalletSnapshotSection`
* `CashflowMiniSection`
* `BudgetOverviewCard`
* `WishlistDueCard`
* `RecentTransactionList`

## Transactions

* `TransactionSearchInput`
* `TransactionQuickFilters`
* `TransactionFilterSheet`
* `TransactionSearchSummary`
* `TransactionList`
* `TransactionCard`
* `TransactionTable`
* `TransactionFormSheet`

## Wallets

* `WalletGrid`
* `WalletCard`
* `WalletFormDialog`
* `WalletDetailSheet`

## Transfer

* `TransferForm`
* `TransferPreviewCard`
* `TransferHistoryList`

## Wishlist

* `WishlistTabs`
* `WishlistCard`
* `WishlistFormDialog`
* `WishlistReviewSheet`

## Budget

* `BudgetSummaryCard`
* `BudgetProgressBar`
* `CategoryBudgetList`

## Reports

* `ReportFilters`
* `CashflowSummaryRow`
* `CategoryExpenseChart`
* `TrendChart`
* `KeywordSpendingInsight`

## Notifications

* `NotificationTabs`
* `NotificationList`
* `NotificationCard`

## Settings

* `ProfileSettingsForm`
* `ThemeSettings`
* `NotificationSettings`
* `TimezoneSettings`

---

# 21. Microcopy Direction

Gunakan copy pendek, jelas, tidak kaku.

## Contoh

* Tambah transaksi
* Cari transaksi atau kategori
* Pengeluaran “kopi”
* Belum ada hasil
* Transfer berhasil disimpan
* Wallet berhasil diperbarui
* Wishlist siap direview
* Budget hampir habis
* Coba ubah filter

---

# 22. Frontend Acceptance Criteria

## Dashboard

* user bisa melihat total saldo, income, expense, net flow
* quick add terlihat jelas
* recent transaction tampil rapi
* dashboard tidak padat

## Transactions

* search selalu terlihat
* filter mudah diakses
* hasil “kopi” bisa menampilkan total selama ini, 30 hari, 7 hari
* transaksi bisa diedit dan soft delete
* mobile dan desktop sama-sama nyaman

## Wallets

* saldo tiap wallet jelas
* archived wallet terpisah
* wallet archived tidak muncul di picker transaksi default

## Transfer

* from/to wallet jelas
* preview transfer jelas
* transfer tampil sebagai 1 entitas logis di UI

## Wishlist

* cooling period terlihat jelas
* due review mudah ditemukan
* convert ke purchase flow mulus

## Reports

* chart sederhana dan terbaca
* keyword spending insight berfungsi
* transfer tidak merusak laporan

---

# 23. Rekomendasi Final untuk PRD

Tambahan teks ini bisa langsung kamu tempel ke PRD sebagai bagian **Frontend Experience Requirements**:

## Frontend Experience Requirements

* UI harus clean, modern, ringan, dan mobile-first.
* Halaman Transactions wajib memiliki search bar yang selalu terlihat.
* Search transaksi harus mendukung pencarian berdasarkan title, note, kategori, subkategori, dan wallet.
* Saat user mencari keyword seperti “kopi”, frontend harus menampilkan insight summary berupa total pengeluaran:

  * sepanjang waktu
  * 30 hari terakhir
  * 7 hari terakhir
  * bulan ini / custom range
* Search insight harus dapat dikombinasikan dengan filter wallet, kategori, type, dan date range.
* Hasil pencarian harus ditampilkan dalam dua layer:

  * summary insight card
  * daftar transaksi relevan
* Mobile menggunakan card list + bottom sheet filter.
* Desktop menggunakan sidebar + table/list hybrid.
* Semua aksi penting harus punya loading state, success/error feedback, dan anti double submit.
* Quick Add harus menjadi elemen utama pada dashboard dan mudah diakses di seluruh aplikasi.

---

# 24. Versi paling praktis

Kalau mau implementasi yang paling efisien, urutan desain frontend-nya begini:

1. **App shell**
2. **Dashboard**
3. **Transactions + search insight “kopi”**
4. **Wallets**
5. **Transfer**
6. **Wishlist**
7. **Budget**
8. **Reports**
9. **Notifications**
10. **Settings**

Karena value terbesar DuitFlow ada di:

* input cepat
* histori yang rapi
* pencarian pengeluaran yang insightful
* saldo wallet yang jelas

Kalau mau, langkah berikutnya paling pas adalah saya buatkan **UI sitemap + struktur route Next.js App Router + daftar komponen per folder** supaya langsung siap dieksekusi developer atau AI coding agent.
