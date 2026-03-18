# 1. EXECUTIVE SUMMARY

- Frontend sudah punya fondasi design system (token warna, radius, komponen shared), tapi eksekusinya **belum konsisten sebagai satu produk finance yang matang**.
- Secara visual, auth screens terasa rapi dan kalem, namun pada layer aplikasi (berdasarkan struktur komponen/page code) UI cenderung **over-engineered**, terlalu banyak panel kecil, dan typography terlalu kecil di banyak titik.
- Problem terbesar bukan di warna; problem terbesar ada di **hierarchy visual + densitas panel + skala typography**.
- Dashboard/transactions/reports/wishlist/budgets terlihat diarahkan jadi “compact data-rich UI”, tapi saat ini banyak area berisiko jadi terasa seperti template admin yang dipoles, bukan finance SaaS premium yang intentional.
- Konsistensi desktop-mobile secara arsitektur ada, namun pola mobile banyak memakai collapse/disclosure + komponen mini sehingga berisiko terasa “desktop dikecilkan”, bukan mobile-first yang elegan.

Skor keseluruhan (1–10):
- design cohesion: **6.8**
- dashboard quality: **6.4**
- typography: **5.9**
- layout clarity: **6.3**
- modern minimalist feel: **6.1**
- overall frontend maturity: **6.5**

Catatan verifikasi visual:
- Sudah diaudit via screenshot nyata auth desktop/mobile (`audit-artifacts/screenshots/*.png`).
- Sudah diaudit via screenshot nyata semua halaman app utama (`audit-artifacts/screenshots-auth/*.png`), termasuk: dashboard, transactions, wallets, transfer, categories, budgets, reports, wishlist, projects, subscriptions, notifications, settings.
- Sudah diaudit screenshot modal dan state penting: `transactions-add-modal-desktop.png`, `dashboard-quick-add-modal-mobile.png`, `transactions-empty-state-desktop.png`, `transactions-empty-state-mobile.png`.

# 2. AUDIT GLOBAL FRONTEND

## 2.1 Apakah elemen UI sudah sesuai?
- Masalah: sebagian besar elemen sudah sesuai fungsi, tapi banyak elemen “status/meta/chip kecil” berlapis yang menurunkan fokus.
- Dampak: user scanning lambat, CTA utama kalah oleh noise sekunder.
- Tindakan: hapus elemen meta yang tidak memengaruhi keputusan; jadikan 1 panel = 1 tujuan; batasi badge informatif ke status kritikal saja.

## 2.2 Card terlalu banyak?
- Masalah: ya, berlebihan. Banyak nested card: card di dalam surface card, ditambah border/strip internal.
- Dampak: UI terasa berat, formal, dan “admin template”.
- Tindakan: gabung panel yang berurutan; ubah sebagian card menjadi list-row polos; pakai card besar hanya untuk hero summary + modal penting.

## 2.3 Wrapper terlalu banyak?
- Masalah: ya, wrapper visual (border + background + radius + divider) dipakai hampir di semua level.
- Dampak: hierarchy blur karena semua container terlihat sama penting.
- Tindakan: pisah layer struktur vs dekorasi; minimalisasi wrapper sekunder; simpan border tegas hanya di section pemisah utama.

## 2.4 Layout masih berantakan?
- Masalah: tidak berantakan total, tapi terlalu fragmentatif; banyak section kecil berdiri sendiri.
- Dampak: page flow terputus-putus, user harus re-scan setiap blok.
- Tindakan: gabung section yang satu konteks (mis. summary + insight singkat), kurangi pergantian pola layout per section.

## 2.5 Font size sudah pas?
- Masalah: terlalu banyak teks di 0.62rem–0.78rem.
- Dampak: keterbacaan turun, terutama mobile, memberi kesan “UI rapuh”.
- Tindakan: perkecil jumlah micro-text; naikkan base metadata ke 0.78–0.82rem minimum; hindari label 0.62rem kecuali chip super-sekunder.

## 2.6 Hierarchy desain sudah jelas?
- Masalah: sebagian jelas di hero angka, tetapi hilang di area list/filters karena semua elemen diberi treatment setara.
- Dampak: user sulit membedakan primary vs tertiary.
- Tindakan: perkuat kontras ukuran/berat tipografi; kurangi badge; jadikan CTA tunggal per section.

## 2.7 Warna terlalu datar/aman?
- Masalah: palette aman (hijau-slate) cukup baik, tapi terlalu sering dipakai tipis/transparan sehingga depth kurang tegas.
- Dampak: antarmuka terasa “muted terus”, kurang titik fokus.
- Tindakan: pertahankan palette, tapi naikkan contrast di heading/angka/aksi primer; kurangi overlay translucent bertumpuk.

## 2.8 Masih terasa dashboard admin/template?
- Masalah: masih terasa, terutama karena card overuse + micro badges + control panels bertumpuk.
- Dampak: brand feel kurang distinctive.
- Tindakan: ubah presentasi area data utama ke list-ledger yang lebih editorial; hilangkan panel “ceremony” yang hanya mengulang angka.

## 2.9 Sudah modern/simple/minimalist?
- Masalah: modern iya, simple sebagian, minimalist belum.
- Dampak: cognitive load naik walau visualnya “clean”.
- Tindakan: hapus 20–30% elemen sekunder per halaman; satukan komponen repetitif; naikkan white-space strategis di area utama, bukan tambah box.

# 3. AUDIT PER HALAMAN

## Dashboard

### Yang sudah benar
- Struktur KPI inti (saldo/income/expense/net) sudah ada dan relevan.
- Ada usaha pisah desktop vs mobile layout.

### Yang masih salah / jelek / belum matang
- Terlalu banyak panel mikro (focus, wallet mini, insight toggle, recent list) dalam satu viewport.
- Banyak teks helper yang terlalu kecil.
- Area chart `Insights` di dashboard desktop terlihat kosong/blank pada data nyata, jadi section ini terasa seperti ruang mati.

### Masalah kosmetik
- Badge/label kecil berlebihan.
- Border/radius berulang di setiap sub-blok.

### Masalah struktural
- Hero + planner + wallet + insights belum punya urutan prioritas yang tegas.

### Elemen yang harus dihapus
- Helper sentence yang mengulang fungsi obvious.

### Elemen yang harus diperkecil
- Jumlah badge status dan dot indicators.

### Elemen yang harus digabung
- Budget focus + wishlist focus jadi satu decision module ringkas.

### Elemen yang harus dipisah
- Insight chart dan recent transactions tetap dipisah, tapi kurangi dekorasi internal masing-masing.

### Elemen yang harus diubah bentuk presentasinya
- Dari banyak mini-card wallet menjadi 1 featured wallet + compact list-row.

### Nilai halaman ini (1–10)
- compactness: 5.8
- hierarchy: 6.1
- scanability: 6.3
- typography: 5.8
- layout clarity: 6.2
- modern minimalist feel: 6.0

### Kesimpulan halaman
- butuh refactor layout

## Transaksi

### Yang sudah benar
- Search + filter + insights + results sudah lengkap dan kuat fungsional.
- URL state filter bagus untuk persistence.

### Yang masih salah / jelek / belum matang
- Layer filter terlalu banyak (quick chips + advanced + insight cards + badges).
- Row text terlalu kecil untuk ledger utama.

### Masalah kosmetik
- Badge source kecil dan padat.
- Divider + border pada list terlalu ramai.

### Masalah struktural
- Halaman mencoba jadi search engine + analytics + ledger sekaligus.

### Elemen yang harus dihapus
- Chip aktif yang redundan saat summary filter sudah jelas.

### Elemen yang harus diperkecil
- Jumlah metric cards insight di mobile.

### Elemen yang harus digabung
- Quick filters dan active filter summary jadi satu bar adaptif.

### Elemen yang harus dipisah
- Insight analytics dipisah sebagai expandable panel opsional, bukan selalu dominan.

### Elemen yang harus diubah bentuk presentasinya
- Dari cards insight 4 kotak menjadi 2-row inline stats + 1 latest line.

### Nilai halaman ini (1–10)
- compactness: 6.0
- hierarchy: 6.2
- scanability: 6.5
- typography: 5.7
- layout clarity: 6.1
- modern minimalist feel: 5.9

### Kesimpulan halaman
- butuh refactor layout

## Modal Tambah Transaksi

### Yang sudah benar
- Modal shell sudah ada dan reused lintas halaman.

### Yang masih salah / jelek / belum matang
- Risiko form terlalu panjang dengan density tinggi di layar kecil.

### Masalah kosmetik
- Potensi label uppercase kecil berlebihan.

### Masalah struktural
- Quick add, full form, edit form berpotensi overlap mental model.

### Elemen yang harus dihapus
- Info helper non-esensial di atas field.

### Elemen yang harus diperkecil
- Jumlah field yang ditampilkan default.

### Elemen yang harus digabung
- Field yang jarang dipakai ke “Advanced details” collapsible.

### Elemen yang harus dipisah
- Quick add parser preview dipisah jelas dari full-form mode.

### Elemen yang harus diubah bentuk presentasinya
- Dari form penuh default menjadi progressive disclosure (core fields dulu).

### Nilai halaman ini (1–10)
- compactness: 6.2
- hierarchy: 6.1
- scanability: 6.0
- typography: 5.8
- layout clarity: 6.0
- modern minimalist feel: 6.0

### Kesimpulan halaman
- butuh refactor layout

## Dompet

### Arah desain wajib (non-negotiable)
- Wallet card harus terasa seperti kartu debit sungguhan (komposisi visual, ritme informasi, dan focal point balance), bukan card statistik generik.
- Style harus tetap menyatu dengan bahasa visual DuitFlow (token warna, radius, typography, elevasi), jadi tidak boleh terasa seperti komponen dari produk lain.
- Prioritas: premium, bersih, tenang, dan cepat dipindai; dekorasi hanya yang mendukung hierarchy.

### Yang sudah benar
- Ada featured wallet, detail dialog, dan tindakan jelas.

### Yang masih salah / jelek / belum matang
- Terlalu banyak variasi panel dan stat mini; terasa crowded.

### Masalah kosmetik
- Banyak angka dan metadata kecil dalam satu card.

### Masalah struktural
- Wallet gallery mencoba jadi dashboard kedua.

### Elemen yang harus dihapus
- Copy deskriptif panjang di hero wallet.

### Elemen yang harus diperkecil
- Inline stats di setiap card wallet.

### Elemen yang harus digabung
- Tab active/archived + mode info jadi satu control strip.

### Elemen yang harus dipisah
- Detail analytics wallet tetap di dialog, jangan bocor ke card list utama.

### Elemen yang harus diubah bentuk presentasinya
- Dari card-heavy generik menjadi card-based presentation yang premium, lebih bersih, dan lebih visual (bukan list utilitarian penuh).

### Nilai halaman ini (1–10)
- compactness: 5.9
- hierarchy: 6.2
- scanability: 6.0
- typography: 5.8
- layout clarity: 6.1
- modern minimalist feel: 6.0

### Kesimpulan halaman
- butuh redesign presentasi

## Transfer

### Yang sudah benar
- Konsep transfer sebagai entitas tunggal sudah benar.
- Form modal dan history list sudah terpisah.

### Yang masih salah / jelek / belum matang
- Hero summary masih terlalu “panel formal”.

### Masalah kosmetik
- Metadata fee/total tersebar di banyak titik kecil.

### Masalah struktural
- Overview dan list belum cukup fokus pada aksi utama “buat transfer”.

### Elemen yang harus dihapus
- Teks naratif berulang di summary cards.

### Elemen yang harus diperkecil
- Jumlah blok statistik atas.

### Elemen yang harus digabung
- Fee + total deducted jadi satu line ringkas per row.

### Elemen yang harus dipisah
- Insight aggregate dipisah dari history list saat mobile.

### Elemen yang harus diubah bentuk presentasinya
- Dari card-heavy summary menjadi 1 summary strip + 1 list utama.

### Nilai halaman ini (1–10)
- compactness: 6.5
- hierarchy: 6.6
- scanability: 6.8
- typography: 6.0
- layout clarity: 6.7
- modern minimalist feel: 6.3

### Kesimpulan halaman
- hanya butuh polish

## Kategori

### Yang sudah benar
- List sederhana dan action edit/delete jelas.

### Yang masih salah / jelek / belum matang
- Header stats + list + dialog icon grid cukup padat untuk value kecil.

### Masalah kosmetik
- Label kecil berulang.

### Masalah struktural
- Kategori default dan custom belum diprioritaskan visualnya.

### Elemen yang harus dihapus
- Stat total/sistem/custom bila tidak dipakai untuk keputusan.

### Elemen yang harus diperkecil
- Icon picker grid density.

### Elemen yang harus digabung
- Color preview + color input ke satu field kompak.

### Elemen yang harus dipisah
- Daftar default vs custom section terpisah jelas.

### Elemen yang harus diubah bentuk presentasinya
- Dari satu list campur menjadi grouped list (Default, Custom).

### Nilai halaman ini (1–10)
- compactness: 6.6
- hierarchy: 6.4
- scanability: 6.7
- typography: 6.0
- layout clarity: 6.6
- modern minimalist feel: 6.2

### Kesimpulan halaman
- hanya butuh polish

## Budget

### Yang sudah benar
- Struktur logic budget kuat (overall + category + untracked).

### Yang masih salah / jelek / belum matang
- Halaman terlalu panjang dan terlalu banyak panel informatif.

### Masalah kosmetik
- Banyak mini label, badge, progress, strip dalam satu layar.

### Masalah struktural
- Sticky summary + dua kolom + cards kategori membuat beban scan tinggi.

### Elemen yang harus dihapus
- Narasi panjang di kartu kondisi bulan.

### Elemen yang harus diperkecil
- Utility stats dan badges status.

### Elemen yang harus digabung
- Overall summary + month navigation jadi satu top strip.

### Elemen yang harus dipisah
- Untracked spending pindah ke panel collapsible tersendiri.

### Elemen yang harus diubah bentuk presentasinya
- Dari grid cards kategori ke list-row progress kategori.

### Nilai halaman ini (1–10)
- compactness: 5.6
- hierarchy: 6.0
- scanability: 5.9
- typography: 5.7
- layout clarity: 5.8
- modern minimalist feel: 5.8

### Kesimpulan halaman
- butuh redesign struktural (prioritas tinggi, perlu definisi ulang identitas halaman)

## Laporan

### Yang sudah benar
- Filter period/wallet/category cukup lengkap.
- Insight keyword ada nilai produk.

### Yang masih salah / jelek / belum matang
- Ini halaman paling “dashboard template”: chart + insight + card + keyword panel bertumpuk.
- Pada screenshot, area chart utama juga terlihat blank, sehingga value visual laporan turun drastis.

### Masalah kosmetik
- Micro text terlalu banyak untuk area chart.

### Masalah struktural
- Tiga tujuan dicampur: analytics global, chart, keyword insight.

### Elemen yang harus dihapus
- Deskripsi copy yang menjelaskan hal obvious di tiap chart block.

### Elemen yang harus diperkecil
- Jumlah insight card dalam satu section.

### Elemen yang harus digabung
- Top summary + primary insight jadi satu hero analytics.

### Elemen yang harus dipisah
- Keyword insight dipisah ke sub-page/expandable mode.

### Elemen yang harus diubah bentuk presentasinya
- Dari banyak card analytics jadi 1 narrative dashboard + 1 chart area + 1 insights rail.

### Nilai halaman ini (1–10)
- compactness: 5.5
- hierarchy: 5.9
- scanability: 5.8
- typography: 5.7
- layout clarity: 5.9
- modern minimalist feel: 5.6

### Kesimpulan halaman
- butuh redesign struktural

## Wishlist

### Yang sudah benar
- Alur due/review/convert sudah kuat dan product-centric.

### Yang masih salah / jelek / belum matang
- Card item wishlist terlalu penuh (status, progress, meta, reason, note, action).

### Masalah kosmetik
- Banyak elemen decorative badge.

### Masalah struktural
- Board section terlalu kompleks untuk list keputusan.

### Elemen yang harus dihapus
- Badge yang redundant (status + due + priority muncul bersamaan tanpa prioritas).

### Elemen yang harus diperkecil
- Panel meta 3 kolom pada tiap item.

### Elemen yang harus digabung
- Reason dan note jadi satu expandable “Notes”.

### Elemen yang harus dipisah
- Purchased/cancelled history dipisah dari active board.

### Elemen yang harus diubah bentuk presentasinya
- Dari card berat menjadi list decision row + detail expand on demand.

### Nilai halaman ini (1–10)
- compactness: 5.9
- hierarchy: 6.2
- scanability: 6.1
- typography: 5.8
- layout clarity: 6.1
- modern minimalist feel: 6.0

### Kesimpulan halaman
- butuh refactor layout ringan (compression + de-noising, hindari over-redesign)

## Proyek

### Yang sudah benar
- Purpose jelas, empty state cukup informatif.

### Yang masih salah / jelek / belum matang
- Terasa modul tambahan, belum integrated kuat dengan finance core.

### Masalah kosmetik
- Banyak badge dan block kecil.

### Masalah struktural
- Summary + list + template hints belum punya ritme visual yang hemat.

### Elemen yang harus dihapus
- Badge kategori count jika tidak actionable.

### Elemen yang harus diperkecil
- Template aside di empty state.

### Elemen yang harus digabung
- Total budget + category count ke satu line per project.

### Elemen yang harus dipisah
- State active/completed dipisah menjadi tab sederhana.

### Elemen yang harus diubah bentuk presentasinya
- Dari project cards ke list-row proyek dengan progress/budget ringkas.

### Nilai halaman ini (1–10)
- compactness: 6.1
- hierarchy: 6.0
- scanability: 6.2
- typography: 5.9
- layout clarity: 6.1
- modern minimalist feel: 6.0

### Kesimpulan halaman
- butuh refactor layout

## Langganan

### Yang sudah benar
- Data recurring expense disajikan jelas, ada status active/paused.

### Yang masih salah / jelek / belum matang
- Overview panel masih terlalu formal dan berlapis.

### Masalah kosmetik
- Banyak stat kecil sebelum list inti.

### Masalah struktural
- Fokus list langganan sedikit tertahan oleh summary rail.

### Elemen yang harus dihapus
- Meta stat yang tidak dipakai harian.

### Elemen yang harus diperkecil
- Jumlah statistik overview di top.

### Elemen yang harus digabung
- Upcoming + next billing jadi satu compact module.

### Elemen yang harus dipisah
- Active dan paused dipisah visual lebih tegas.

### Elemen yang harus diubah bentuk presentasinya
- Dari multi-card overview menjadi single summary strip + segmented list.

### Nilai halaman ini (1–10)
- compactness: 6.3
- hierarchy: 6.4
- scanability: 6.6
- typography: 6.0
- layout clarity: 6.5
- modern minimalist feel: 6.3

### Kesimpulan halaman
- hanya butuh polish

## Notifikasi

### Yang sudah benar
- Scope + type filter cukup jelas.
- Row notification punya struktur yang benar.

### Yang masih salah / jelek / belum matang
- Header stats + filters + feed membuat area atas terlalu tebal.

### Masalah kosmetik
- Pill/tabs/filter chip terlalu banyak variasi style.

### Masalah struktural
- Notification feed seharusnya list-first, bukan summary-first.

### Elemen yang harus dihapus
- Summary card bila unread count kecil dan feed sudah jadi sumber utama.

### Elemen yang harus diperkecil
- Tinggi area filter stack.

### Elemen yang harus digabung
- Scope tabs + type filter dalam satu control bar compact.

### Elemen yang harus dipisah
- Empty state signals aside dipisah sebagai helper kecil, bukan panel tambahan.

### Elemen yang harus diubah bentuk presentasinya
- Dari summary-heavy ke feed-centric page.

### Nilai halaman ini (1–10)
- compactness: 6.2
- hierarchy: 6.3
- scanability: 6.5
- typography: 5.9
- layout clarity: 6.3
- modern minimalist feel: 6.1

### Kesimpulan halaman
- butuh refactor layout

## Pengaturan

### Yang sudah benar
- Struktur tab dan konten setting lengkap, fungsional, reusable.

### Yang masih salah / jelek / belum matang
- Halaman panjang, dense, dan banyak micro-copy.

### Masalah kosmetik
- Banyak label kecil/section divider membuat UI terasa berat.

### Masalah struktural
- Sidebar tabs + context panel + sticky save bar = 3 lapis hierarchy sekaligus.

### Elemen yang harus dihapus
- Deskripsi teks yang mengulang label field.

### Elemen yang harus diperkecil
- Jumlah info rows di context panel.

### Elemen yang harus digabung
- Summary context digabung jadi compact summary di header tab.

### Elemen yang harus dipisah
- Integrations dipisah dari settings personal (bisa sub-route).

### Elemen yang harus diubah bentuk presentasinya
- Dari panel-berlapis ke simple two-column form + sticky save kecil.

### Nilai halaman ini (1–10)
- compactness: 5.8
- hierarchy: 6.1
- scanability: 6.0
- typography: 5.8
- layout clarity: 6.0
- modern minimalist feel: 6.0

### Kesimpulan halaman
- butuh refactor layout

## Mobile dashboard

### Yang sudah benar
- Ada penyesuaian section khusus mobile.
- Bottom navigation hadir.

### Yang masih salah / jelek / belum matang
- Terlalu banyak disclosure/mini-cards dan teks kecil.

### Masalah kosmetik
- Label nav mobile terlalu kecil (sekitar 0.53–0.55rem).

### Masalah struktural
- Mobile masih mewarisi kompleksitas desktop, belum cukup disederhanakan.

### Elemen yang harus dihapus
- Panel insight sekunder dari first viewport.

### Elemen yang harus diperkecil
- Jumlah metric blok di atas fold.

### Elemen yang harus digabung
- Focus section + CTA utama jadi satu card actionable.

### Elemen yang harus dipisah
- Insight chart dipisah ke halaman/detail, bukan default di dashboard mobile.

### Elemen yang harus diubah bentuk presentasinya
- Dari stack panel ke feed “Today summary + quick action + recent”.

### Nilai halaman ini (1–10)
- compactness: 5.7
- hierarchy: 5.9
- scanability: 6.0
- typography: 5.4
- layout clarity: 5.9
- modern minimalist feel: 5.8

### Kesimpulan halaman
- butuh redesign struktural

## Mobile transaksi

### Yang sudah benar
- Search/filter dan aksi utama tetap tersedia.

### Yang masih salah / jelek / belum matang
- Filter stack di mobile berpotensi terlalu tebal sebelum list muncul.

### Masalah kosmetik
- Banyak chip dan mini text.

### Masalah struktural
- Ledger list belum langsung dominan pada first viewport.

### Elemen yang harus dihapus
- Insight card default saat user tidak butuh analisis.

### Elemen yang harus diperkecil
- Chip count + badge metadata.

### Elemen yang harus digabung
- Search + quick filter jadi satu sticky compact toolbar.

### Elemen yang harus dipisah
- Advanced filter tetap di sheet terpisah.

### Elemen yang harus diubah bentuk presentasinya
- Dari insight-first ke list-first untuk mobile.

### Nilai halaman ini (1–10)
- compactness: 5.9
- hierarchy: 6.0
- scanability: 6.2
- typography: 5.5
- layout clarity: 6.0
- modern minimalist feel: 5.9

### Kesimpulan halaman
- butuh refactor layout

## Empty states secara umum

### Yang sudah benar
- Empty states sudah tersedia di hampir semua halaman.

### Yang masih salah / jelek / belum matang
- Kadang terlalu “besar” dan ceremonial untuk konteks inline.

### Masalah kosmetik
- Icon + wrapper berulang membuat empty state tampak sama semua.

### Masalah struktural
- Tidak dibedakan jelas antara first-time empty vs filtered-empty vs error-empty.

### Elemen yang harus dihapus
- Empty state besar pada area yang seharusnya inline feedback.

### Elemen yang harus diperkecil
- Padding dan tinggi empty block pada list padat.

### Elemen yang harus digabung
- CTA empty state dengan quick action terdekat (jangan CTA terpisah jauh).

### Elemen yang harus dipisah
- Empty onboarding vs empty karena filter harus beda wording + visual.

### Elemen yang harus diubah bentuk presentasinya
- Dari empty-state besar menjadi inline state untuk tabel/list sections.

### Nilai halaman ini (1–10)
- compactness: 6.0
- hierarchy: 6.1
- scanability: 6.2
- typography: 5.9
- layout clarity: 6.1
- modern minimalist feel: 6.0

### Kesimpulan halaman
- hanya butuh polish

# 4. AUDIT TYPOGRAPHY KHUSUS

Observasi utama:
- Terlalu sering pakai ukuran sub-12px (`0.62rem`–`0.76rem`) untuk label/metadata.
- Banyak uppercase tracking lebar pada label kecil, membuat teks terasa “berteriak tapi kecil”.

Audit per elemen:
- page title: umumnya oke, kuat, konsisten.
- section title: cukup baik, tapi sering kalah oleh terlalu banyak sublabel.
- card title: cenderung kecil saat card padat.
- stat value: hero value bagus; stat sekunder sering terlalu kecil.
- body text: cukup, tapi banyak area turun ke 0.8rem yang padat.
- secondary text: sering terlalu pucat + terlalu kecil.
- metadata text: paling bermasalah, terlalu kecil di banyak list row.
- helper text: kebanyakan, sering tidak perlu dibaca.
- chips/badge text: terlalu kecil di beberapa komponen (0.62rem–0.7rem).
- button text: mayoritas aman, beberapa icon+text button terlalu sempit.
- form label: campur aduk (ada uppercase tiny, ada normal), belum konsisten.

Yang terlalu kecil:
- metadata row transaksi, badge source, beberapa tab/label mobile nav, helper labels.

Yang terlalu besar:
- Tidak ada yang ekstrem terlalu besar; justru banyak terlalu kecil.

Yang terlalu pucat:
- secondary/helper text di surface muted bertingkat.

Yang terlalu berat:
- Uppercase tracking label pada banyak field membuat visual “berat tapi mini”.

Yang tidak konsisten:
- Form labels antar halaman (settings vs categories vs wishlist) berbeda gaya.

Skala typography yang disarankan:
- Display hero number: `clamp(2rem, 1.8rem + 1vw, 3rem)`
- Page title: `1.5rem–2rem`
- Section title: `1rem–1.125rem`
- Body default: `0.875rem–0.95rem`
- Metadata minimum: **`0.78rem`**
- Chip text minimum: **`0.72rem`**
- Hindari `0.62rem` untuk konten yang harus dibaca.

# 5. TOP 15 MASALAH PALING KRITIS

1) Nama masalah: Card overuse dan nested surfaces  
Halaman terdampak: hampir semua app pages  
Severity: Critical  
Kenapa ini penting: mengaburkan hierarchy dan bikin UI terasa template  
Tindakan yang disarankan: hapus 20–30% card sekunder, gabung section berurutan

2) Nama masalah: Chart area tampil kosong pada halaman berdata  
Halaman terdampak: dashboard, laporan  
Severity: Critical  
Kenapa ini penting: section insight kehilangan fungsi utama dan menyisakan ruang kosong besar  
Tindakan yang disarankan: perbaiki rendering chart state (loaded vs empty), tampilkan fallback inline kecil jika data gagal diproses

3) Nama masalah: Typography terlalu kecil di metadata  
Halaman terdampak: dashboard, transaksi, notifikasi, wishlist, wallets  
Severity: Critical  
Kenapa ini penting: keterbacaan rendah, terutama mobile  
Tindakan yang disarankan: naikkan metadata min ke 0.78rem

4) Nama masalah: Terlalu banyak label/badge kecil  
Halaman terdampak: transaksi, wishlist, reports, budgets  
Severity: High  
Kenapa ini penting: text noise tinggi  
Tindakan yang disarankan: hapus badge non-kritis, gabung info jadi 1 line

5) Nama masalah: Dashboard kurang prioritas visual  
Halaman terdampak: dashboard desktop/mobile  
Severity: High  
Kenapa ini penting: user tidak tahu fokus pertama  
Tindakan yang disarankan: tetapkan 3 layer: hero angka, quick action, recent activity

6) Nama masalah: Reports terlalu seperti template analytics  
Halaman terdampak: laporan  
Severity: High  
Kenapa ini penting: terasa generik, bukan insight-driven  
Tindakan yang disarankan: redesign jadi narrative analytics, kurangi panel

7) Nama masalah: Budgets over-structured  
Halaman terdampak: budget  
Severity: High  
Kenapa ini penting: beban kognitif tinggi  
Tindakan yang disarankan: ubah jadi control strip + list kategori progres

8) Nama masalah: Mobile nav label terlalu kecil  
Halaman terdampak: semua mobile app pages  
Severity: High  
Kenapa ini penting: aksesibilitas turun  
Tindakan yang disarankan: naikkan label nav ke min 0.68–0.72rem

9) Nama masalah: Filter stack mobile terlalu tebal  
Halaman terdampak: transaksi, laporan, notifikasi  
Severity: Medium-High  
Kenapa ini penting: konten utama terdorong ke bawah  
Tindakan yang disarankan: collapse/filter sheet by default

10) Nama masalah: Inconsistent form label style  
Halaman terdampak: categories, projects, wishlist, settings  
Severity: Medium  
Kenapa ini penting: cohesion turun  
Tindakan yang disarankan: satu style label sistem-wide

11) Nama masalah: Empty states belum dibedakan konteks  
Halaman terdampak: global  
Severity: Medium  
Kenapa ini penting: user guidance kurang tepat  
Tindakan yang disarankan: split first-empty / no-result / error-empty

12) Nama masalah: Overuse descriptive copy dalam panel  
Halaman terdampak: wallets, budgets, reports  
Severity: Medium  
Kenapa ini penting: menambah noise  
Tindakan yang disarankan: potong copy jadi 1 kalimat max per section

13) Nama masalah: Action visibility tersebar  
Halaman terdampak: transfer, wallet, wishlist  
Severity: Medium  
Kenapa ini penting: discoverability tidak stabil  
Tindakan yang disarankan: konsolidasi CTA primer di posisi konsisten

14) Nama masalah: Too many dividers/borders  
Halaman terdampak: hampir semua list pages  
Severity: Medium  
Kenapa ini penting: visual jadi kaku  
Tindakan yang disarankan: kurangi border internal, pakai spacing untuk pemisah

15) Nama masalah: Settings terlalu padat dan panjang  
Halaman terdampak: settings  
Severity: Medium  
Kenapa ini penting: task completion setting melambat  
Tindakan yang disarankan: ringkas context panel + prioritaskan field utama

# 6. QUICK WINS

- Naikkan ukuran metadata minimum ke 0.78rem di semua list row.
- Hapus helper text berulang di top section (wallets, budgets, reports).
- Gabung chip/filter summary jadi satu compact line pada transactions.
- Kurangi badge non-kritis minimal 40%.
- Turunkan jumlah panel statistik di halaman reports dari 3 blok menjadi 1 blok utama + 1 insight.
- Ubah mobile nav label ke ukuran lebih terbaca.
- Jadikan empty-state list sebagai inline variant default.
- Standardisasi form label style lintas halaman.

# 7. FULL PLAN PERBAIKAN

## Phase 1 — Perbaikan paling mendesak
- tujuan: memperbaiki readability dan mengurangi noise paling terlihat
- halaman yang dikerjakan: global, dashboard, transactions, mobile shell
- masalah utama: text terlalu kecil, badge berlebihan, panel terlalu ramai
- tindakan utama: naikkan typographic floor, hapus badge non-esensial, sederhanakan section top
- hasil yang diharapkan: scanning lebih cepat, UI tidak terasa sesak

## Phase 2 — Rapikan struktur utama
- tujuan: reset hierarchy halaman inti finance
- halaman yang dikerjakan: dashboard, transactions, budgets, reports
- masalah utama: campur tujuan dalam satu layar, card overuse
- tindakan utama: re-layout ke model hero + action + evidence; ubah beberapa card jadi list-row; tetapkan identitas laporan (analytics dashboard vs insight page vs report narrative)
- hasil yang diharapkan: prioritas visual tegas, alur halaman lebih intentional

## Phase 3 — Perkuat visual refinement
- tujuan: hilangkan kesan admin template
- halaman yang dikerjakan: wallets, transfer, wishlist, notifications, projects, subscriptions
- masalah utama: wrapper berlapis, style serba sama
- tindakan utama: kurangi border internal, atur contrast dan spacing, tetapkan signature component style; arahkan wallets ke premium clean card presentation (bukan list utilitarian)
- hasil yang diharapkan: visual lebih premium, khas produk, tidak generik

## Phase 4 — Mobile refinement
- tujuan: jadikan mobile benar-benar dirancang, bukan versi dipersempit
- halaman yang dikerjakan: mobile dashboard, mobile transactions, mobile filters, mobile modals
- masalah utama: top area terlalu tebal, label kecil, disclosure berlebihan
- tindakan utama: list-first viewport, simplifikasi top controls, resize nav text, sheet-first advanced filters
- hasil yang diharapkan: pengalaman mobile lebih ringan dan cepat dipakai

## Phase 5 — Final consistency and polish
- tujuan: satukan bahasa visual lintas seluruh produk
- halaman yang dikerjakan: semua halaman
- masalah utama: inkonsistensi label/form/empty state
- tindakan utama: audit token akhir, audit copy, audit component states, QA visual desktop+mobile per halaman
- hasil yang diharapkan: cohesion tinggi, frontend siap scale

# 8. CHECKLIST IMPLEMENTASI

## Global frontend fixes
- [x] Naikkan minimum ukuran metadata text ke 0.78rem
- [ ] Batasi penggunaan badge ke status kritikal saja
- [x] Kurangi nested card/wrapper minimal 20%
- [x] Standardisasi gaya form label lintas halaman
- [x] Kurangi helper text yang tidak action-oriented

## Dashboard fixes
- [x] Jadikan hero summary sebagai fokus tunggal di atas fold
- [x] Gabung budget focus + wishlist focus menjadi satu module
- [x] Sederhanakan wallet snapshot (featured + list ringkas)
- [x] Kurangi panel insight default di first viewport

## Transactions fixes
- [x] Gabung quick filters + active summary menjadi satu compact filter bar
- [x] Sederhanakan insight cards menjadi format inline ringkas
- [x] Naikkan keterbacaan typography pada transaction row
- [x] Kurangi metadata/badge non-esensial di row transaksi

## Wallets fixes
- [x] Ubah layout wallet ke premium clean card presentation (hindari card-heavy generik dan hindari list utilitarian penuh)
- [x] Pastikan wallet card terasa seperti kartu debit nyata tanpa keluar dari design system global
- [x] Ringkas stat mikro pada wallet card
- [x] Pisahkan default view active/archived dengan segment yang lebih jelas
- [x] Sederhanakan copy deskriptif di hero wallets

## Transfer fixes
- [x] Ringkas overview transfer menjadi satu strip utama
- [x] Satukan info fee dan total deducted pada row
- [x] Pertahankan transfer list sebagai fokus utama halaman

## Categories fixes
- [x] Pisahkan kategori default dan custom menjadi dua grup
- [x] Sederhanakan stat header kategori
- [x] Ringkas icon picker agar tidak terlalu padat

## Budget fixes
- [x] Gabung month navigator + overall summary menjadi top strip tunggal
- [x] Ubah category budgets dari card grid menjadi list progress ringkas
- [x] Pindahkan untracked spending ke panel collapsible
- [x] Kurangi narasi panjang pada panel kondisi

## Reports fixes
- [x] Sederhanakan halaman menjadi narrative analytics (bukan banyak card)
- [x] Turunkan kepadatan chart section dan copy pendukung
- [x] Jadikan keyword insight sebagai panel sekunder/collapsible
- [x] Kurangi panel summary yang berulang

## Wishlist fixes
- [x] Ubah wishlist item card menjadi decision row yang lebih ringan
- [x] Gabung reason dan note ke detail expandable
- [x] Kurangi badge status/priority/due yang overlap
- [x] Pisahkan history purchased/cancelled dari active board

## Projects fixes
- [x] Ubah presentasi project menjadi list-row yang lebih padat informasi inti
- [x] Ringkas template hints di empty state
- [x] Kurangi badge dekoratif pada kartu proyek

## Subscriptions fixes
- [x] Sederhanakan overview rail (fokus monthly total + upcoming)
- [x] Pisahkan daftar active vs paused secara visual
- [x] Kurangi stat kecil yang tidak mendukung keputusan harian

## Notifications fixes
- [x] Jadikan feed sebagai fokus utama halaman
- [x] Gabungkan scope tabs dan type filter jadi control bar sederhana
- [x] Ringkas summary card notifikasi
- [x] Perjelas visual unread vs read tanpa over-badge

## Settings fixes
- [x] Ringkas panel ringkasan/context per tab
- [x] Kurangi densitas field labels dan divider
- [x] Pisahkan integration settings bila perlu ke sub-route
- [x] Sederhanakan sticky save bar agar tidak mendominasi

## Typography fixes
- [x] Terapkan skala type global baru (title/body/meta/chip)
- [x] Hapus penggunaan 0.62rem untuk konten baca utama
- [x] Konsolidasi uppercase label kecil agar tidak berlebihan
- [x] Pastikan contrast secondary text tetap terbaca

## Mobile fixes
- [x] Naikkan ukuran label mobile bottom nav
- [x] Jadikan mobile dashboard list-first dan action-first
- [x] Sederhanakan mobile transactions top stack
- [x] Pindahkan advanced controls ke bottom sheet default

## Final polish fixes
- [ ] Lakukan visual QA desktop per halaman inti
- [ ] Lakukan visual QA mobile per halaman inti
- [ ] Audit konsistensi state: loading, empty, error, filtered
- [ ] Audit final spacing, border, radius, dan motion
- [ ] Validasi design cohesion lintas seluruh halaman
