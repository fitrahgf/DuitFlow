# Referensi UI/UX Finance SaaS

Dokumen ini merangkum pelajaran UI/UX dari kumpulan referensi dashboard dan mobile finance app yang diberikan. Tujuannya bukan meniru layout competitor, tetapi menangkap pattern yang konsisten, hierarchy visual yang efektif, dan keputusan density yang membuat produk finance terasa modern, rapi, dan mudah dipindai.

## Cara membaca referensi ini

- Gunakan ini sebagai acuan prinsip, bukan template visual.
- Ambil struktur, ritme, hierarchy, dan density.
- Jangan copy warna, bentuk card, atau chart style secara literal.
- Prioritaskan clarity, scanability, dan efisiensi layar.

## Kesimpulan utama

Dari semua referensi, pattern yang paling konsisten adalah:

1. Shell ringan dan tidak banyak bicara.
2. Satu angka utama jadi anchor dalam viewport.
3. Card modular dengan peran yang jelas, bukan semua card sama penting.
4. Search, filter, dan action row dibuat pendek dan utilitarian.
5. Sidebar atau nav dibuat tipis, tenang, dan tidak mengambil spotlight dari data.
6. Data sekunder dipadatkan ke list, table, atau small cards yang mudah dipindai.
7. Mobile finance flow dibuat sangat fokus per tugas: lihat saldo, kirim uang, cek hasil.

## Pattern desktop yang berulang

### 1. Shell dashboard selalu low-noise

Hampir semua referensi desktop memakai struktur:

- sidebar kiri tipis
- area konten utama di tengah
- kadang ada right rail atau secondary column
- top action/search row pendek

Yang dipelajari:

- shell tidak boleh lebih dominan dari isi
- sidebar tidak boleh seperti kartu besar yang berat
- top bar hanya memuat utilitas: search, avatar, notifications, context controls
- konten utama harus mulai cepat, jangan kebanyakan jarak kosong sebelum insight pertama

### 2. Ada satu focal metric yang sangat kuat

Semua dashboard finance yang bagus punya satu angka utama yang langsung terbaca:

- total balance
- my balance
- total savings
- monthly overview

Pattern-nya:

- label kecil
- angka besar dan dominan
- delta atau subtext kecil di bawah
- action terkait ditempatkan dekat, tapi tidak merusak fokus angka

Pelajaran:

- jangan kasih 4 angka besar dengan bobot yang sama
- satu angka utama harus jadi anchor
- angka lain turun jadi secondary summary cards

### 3. Summary cards dibuat compact, bukan gemuk

Card-card kecil di referensi punya karakter yang sama:

- tinggi relatif pendek
- padding hemat
- label kecil
- angka cukup besar tapi tetap proporsional
- sering 2x2, 3x1, atau 4-up grid

Pelajaran:

- summary cards harus cepat dipindai dalam 2-3 detik
- card kecil tidak perlu subtitle panjang
- jangan membuat tiap card seperti mini page

### 4. Card modular dengan fungsi tunggal

Setiap card di referensi biasanya hanya mengerjakan satu hal:

- balance overview
- expense trend
- recent transactions
- wallet/card info
- health score
- budget progress

Pelajaran:

- satu card = satu tujuan utama
- jangan gabungkan terlalu banyak konteks dalam satu card
- chart, note, quick action, dan list item tidak perlu dipaksa ada di card yang sama

### 5. Chart bukan dekorasi, tapi penjelas konteks

Chart yang efektif di referensi punya ciri:

- label terbatas
- axis dan grid halus
- warna data sedikit
- card chart diberi ruang lebih besar hanya jika memang insight utama

Pelajaran:

- chart besar hanya dipakai untuk data primer
- chart sekunder harus lebih pendek dan lebih sederhana
- jangan biarkan chart mengambil area besar tanpa insight yang jelas

### 6. List transaksi dibuat seperti scanning surface

Recent transactions / recent sales / transaction history di referensi hampir selalu:

- row pendek
- icon/avatar kecil di kiri
- nama + meta di tengah
- amount di kanan
- kadang status kecil

Pelajaran:

- row harus bisa dipindai vertikal dengan cepat
- amount selalu berada di sisi kanan
- meta text lebih redup dari title
- badge/status jangan terlalu ramai

### 7. Search dan filter bar dibuat sangat utilitarian

Pattern umum:

- search field tunggal
- action buttons kecil
- date range / wallet / category filter ringkas
- tidak ada copy tambahan yang tidak perlu

Pelajaran:

- filter bar harus terasa seperti tool, bukan hero section
- tinggi control perlu seragam
- jumlah action primer dalam satu row harus dibatasi

### 8. Sidebar modern itu tenang

Pattern competitor yang konsisten:

- logo kecil, bukan header berat
- item rapat
- icon + label ringan
- section label kecil
- active state jelas tapi tipis
- footer profile tidak terlalu dominan

Pelajaran:

- sidebar harus menjadi orientasi, bukan pusat perhatian
- grouping cukup jelas, tapi jangan boros ruang
- CTA tambahan di sidebar sebaiknya dibatasi

## Pattern mobile yang berulang

### 1. Hero mobile selalu task-first

Di mobile, layar pertama finance app biasanya fokus pada:

- balance card
- send / request / transfer
- ringkasan income / expense
- overview sederhana

Pelajaran:

- mobile harus menjawab kebutuhan utama secepat mungkin
- jangan terlalu banyak card kecil dalam layar pertama
- satu gesture scroll harus memberi konteks lengkap

### 2. Flow transaksi dibuat satu tugas per layar

Contoh transfer flow di referensi mobile menunjukkan:

- halaman transfer fokus ke satu tujuan
- keypad besar dan sederhana
- status sukses dibuat sangat bersih
- informasi penting ditampilkan sebagai summary sheet

Pelajaran:

- task flow finance harus fokus
- success state tidak perlu ramai
- confirmation screen harus informatif tapi ringan

### 3. Bottom navigation sederhana

Pattern umum:

- 4-5 item maksimum
- icon sederhana
- active state jelas
- action utama sering ditempatkan di tengah atau dekat hero

Pelajaran:

- jangan terlalu banyak route utama di mobile
- nav harus mendukung flow harian, bukan seluruh sitemap

## Hierarchy visual yang efektif

## Tier 1: Anchor

Yang masuk tier ini:

- page title utama
- total balance / angka utama
- primary chart atau primary card

Ciri:

- ukuran paling besar
- kontras paling kuat
- ditempatkan paling awal di viewport

## Tier 2: Supporting insight

Yang masuk tier ini:

- summary cards
- budget progress
- cashflow highlights
- wallet overview

Ciri:

- lebih kecil dari anchor
- tetap mudah dipindai
- biasanya grid 2-4 item

## Tier 3: Operational detail

Yang masuk tier ini:

- list transaksi
- notes
- small widgets
- secondary stats
- status chips

Ciri:

- lebih halus
- spacing lebih rapat
- teks lebih kecil
- tidak boleh mengalahkan anchor

## Layout pattern yang paling berguna untuk DuitFlow

### Pattern A: Main anchor + summary rail

Struktur:

- kiri/utama: total balance + chart atau overview
- kanan: recent transaction / wallet / note / budget health

Kapan dipakai:

- dashboard utama
- overview page

Manfaat:

- hierarchy langsung terbaca
- first viewport lebih informatif

### Pattern B: Summary grid + operational table

Struktur:

- atas: 3-4 compact metric cards
- bawah: table/list besar

Kapan dipakai:

- transactions
- reports
- budgets
- subscriptions

Manfaat:

- page terasa rapi
- data besar tetap punya context ringkas

### Pattern C: Left navigation + centered work area

Struktur:

- sidebar tipis
- content width terkendali
- top toolbar pendek

Kapan dipakai:

- seluruh shell desktop aplikasi

Manfaat:

- konsisten
- tenang
- tidak buang ruang horizontal

## Rules visual yang bisa diambil

### 1. Whitespace harus intentional

Whitespace di competitor yang bagus tidak terasa kosong. Alasannya:

- section spacing konsisten
- card padding tidak berlebihan
- satu area kosong selalu memberi jeda untuk hierarchy

Yang harus dihindari:

- gap besar tanpa fungsi
- top spacing yang terlalu tinggi
- empty area yang muncul karena wrapper kebesaran

### 2. Border lebih penting dari shadow

Di referensi modern finance SaaS:

- border halus dipakai hampir di semua panel
- shadow sangat tipis
- depth datang dari layout dan spacing, bukan efek visual berat

Pelajaran:

- subtle border > heavy shadow
- elevation cukup satu dua level saja

### 3. Radius konsisten dan tidak berlebihan

Pattern umum:

- card radius konsisten
- control radius sedikit lebih kecil
- modal/sheet radius sedikit lebih besar

Pelajaran:

- beda radius harus punya alasan hierarchy
- jangan campur banyak karakter radius dalam satu page

### 4. Accent color dipakai untuk penekanan, bukan banjir

Walaupun beberapa referensi memakai hijau, biru, atau lime yang kuat, pattern-nya tetap sama:

- accent dipakai untuk action utama
- accent dipakai untuk delta positif / highlight penting
- surface tetap netral

Pelajaran:

- base harus netral dan terang
- brand color hanya muncul saat memang perlu guiding attention

## Pattern card yang layak diadaptasi

### Card formula yang paling sehat

Susunan ideal:

- label kecil
- value utama
- meta kecil
- optional action kecil di pojok

Untuk card operasional:

- title pendek
- action kecil
- body sederhana

Untuk card list:

- header ringkas
- item row rapat

### Yang tidak perlu ditiru

- terlalu banyak gradient dekoratif
- card promosi besar yang mengganggu data utama
- widget gimmick tanpa fungsi
- chart warna-warni berlebihan
- layout yang terlalu editorial untuk dashboard operasional

## Pattern sidebar yang layak diadaptasi

Pelajaran paling penting:

- branding hanya sebagai context, bukan hero
- active nav harus jelas tapi tidak bulky
- labels group kecil dan ringan
- item lebih banyak terlihat tanpa scroll
- footer profile cukup utilitarian

Sidebar yang baik:

- cepat dibaca
- tidak terasa berat
- tidak bersaing dengan konten utama

## Pattern header halaman yang layak diadaptasi

Header terbaik dari referensi punya sifat:

- judul pendek
- subtitle hanya jika benar-benar menambah context
- row action sejajar, bukan menyebar
- filter/search tampil seperti tool, bukan banner

Pelajaran:

- page title harus kuat
- subtitle harus opsional
- header tidak boleh seperti area kosong besar

## Pattern empty state yang layak diadaptasi

Referensi yang elegan memperlakukan empty state dengan cara:

- icon kecil
- title singkat
- description satu-dua baris
- satu CTA jelas
- tinggi tidak berlebihan

Pelajaran:

- empty state harus terasa “rapi”, bukan “kosong”
- jangan buat empty state setinggi satu layar penuh jika kontennya sedikit

## Pattern dashboard yang paling relevan untuk DuitFlow

Untuk DuitFlow, pattern yang paling cocok bukan dashboard yang terlalu dekoratif, tetapi:

- bright neutral shell
- slim sidebar
- strong balance hierarchy
- compact summary cards
- one primary chart area
- recent activity sebagai scanable list
- right rail opsional untuk wallet/budget/note/wishlist

Ini paling sejalan dengan tujuan:

- clean
- calm
- professional
- compact but breathable
- high screen efficiency

## Pola yang perlu dihindari untuk DuitFlow

- terlalu banyak panel dengan bobot sama
- card tinggi untuk isi yang sedikit
- subtitle dan helper text berlebihan
- footer/sidebar yang terlalu dominan
- CTA ganda di tempat yang sama
- filter bar besar seperti hero
- too many colors for status and chart
- decorative gradients yang tidak membantu hierarchy

## Aturan implementasi yang bisa dipakai nanti

### Shell

- sidebar tipis dan tenang
- content width terkendali
- top utility row pendek

### Header

- title kuat
- subtitle opsional
- action row rapat

### Cards

- satu fungsi per card
- compact padding
- strong numeric hierarchy

### Lists

- row pendek
- amount kanan
- meta kiri/tengah

### Filters

- control height seragam
- tidak ada copy yang tidak perlu
- action penting paling kanan atau paling dekat context

### Mobile

- hero balance
- CTA utama langsung terlihat
- bottom nav sederhana
- flow transfer/pay fokus satu tugas per layar

## Arah desain final yang bisa dipegang

Kalau diringkas menjadi satu kalimat:

> Finance UI yang terasa premium bukan karena dekoratif, tetapi karena hierarchy yang kuat, density yang disiplin, dan modul yang tenang.

## Prioritas adaptasi untuk DuitFlow

1. Shell dan sidebar
2. Dashboard hierarchy
3. Filter bar + toolbar system
4. Summary cards
5. List/table transaction pattern
6. Empty state system
7. Mobile task flow

## Penutup

Referensi competitor menunjukkan bahwa UI finance yang terasa modern hampir selalu menang di tiga hal:

- cepat dipindai
- tidak banyak noise
- jelas mana yang utama, mana yang sekunder

Itu yang harus dijaga saat melanjutkan redesign DuitFlow.
