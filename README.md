# RyMD

CLI **zero-dependency** untuk memindai sebuah direktori secara rekursif dan menghasilkan **satu file Markdown** berisi struktur pohon direktori beserta isi lengkap setiap file teks. Cocok untuk dokumentasi cepat, review kode, atau menyuapkan seluruh proyek ke AI.

## Fitur

- Hanya memakai modul bawaan Node.js (`fs/promises`, `path`), tanpa `npm install`.
- Struktur pohon direktori di bagian awal dokumen.
- Isi file dalam blok kode dengan label bahasa sesuai ekstensi.
- Mencegah rekursi: file output tidak pernah memindai dirinya sendiri.
- Mengabaikan `node_modules`, `.git`, `dist`, `build`, `.next`, dan file biner (`.png`, `.jpg`, `.zip`, `.exe`, `.lock`, dll.).
- File `.env` dan `.env.*` dilewati agar secret tidak bocor (`.env.example` tetap disertakan).
- Mendukung path Windows (`\`) maupun Unix (`/`).

## Persyaratan

- [Node.js](https://nodejs.org) versi 16 atau lebih baru.
- Git (untuk clone).

Cek versi:

```bash
node -v
```

## Instalasi

```bash
git clone https://github.com/Ryhandd/RyMD.git
cd RyMD
npm link
```

`npm link` mendaftarkan perintah `rymd` secara global, sehingga bisa dipanggil dari folder mana pun. Alternatifnya:

```bash
npm install -g .
```

Verifikasi:

```bash
rymd --help
```

### Perintah `rymd` tidak dikenali (Windows)

Folder global npm belum masuk `PATH`. Cek lokasinya:

```bat
npm prefix -g
```

Biasanya `C:\Users\<nama>\AppData\Roaming\npm`. Tambahkan folder itu ke **Environment Variables → Path**, lalu **tutup dan buka ulang terminal**.

Tanpa mengubah `PATH`, tool tetap bisa dijalankan langsung:

```bat
node D:\path\ke\RyMD\index.js <path-direktori>
```

## Penggunaan

```bash
rymd <path-direktori>
```

Contoh:

```bash
rymd .                          # folder saat ini
rymd ./proyek-saya              # path relatif
rymd /home/user/proyek          # Linux / macOS
rymd "D:\Rayhand\RyCode"        # Windows (beri tanda kutip bila ada spasi)
```

Hasilnya ditulis ke **`<path-direktori>/<nama-folder>.md`**. Contoh: `rymd D:\Rayhand\RyCode` menghasilkan `D:\Rayhand\RyCode\RyCode.md`.

### Contoh output

````markdown
# demo

## Struktur Direktori

```text
demo/
├── src/
│   └── app.js
└── README.md
```

## Isi File

### `src/app.js`

```javascript
console.log("hi")
```
````

Menjalankan `rymd` berulang kali aman: file `.md` hasil sebelumnya akan ditimpa dan tidak ikut terpindai.

## Daftar yang diabaikan

| Jenis | Isi |
|---|---|
| Folder | `node_modules`, `.git`, `dist`, `build`, `.next` |
| Gambar | `.png .jpg .jpeg .gif .bmp .ico .webp .avif` |
| Arsip | `.zip .rar .7z .tar .gz` |
| Executable / library | `.exe .dll .so .dylib .bin .class .jar .apk` |
| Lockfile | `.lock`, `package-lock.json`, `pnpm-lock.yaml` |
| Media & dokumen | `.mp3 .wav .mp4 .mkv .pdf .doc(x) .xls(x) .ppt(x)` |
| Font & lainnya | `.woff(2) .ttf .otf .sqlite .db .pyc .map` |
| Secret | `.env`, `.env.*` (kecuali `.env.example` / `.env.sample`) |

File di atas 1 MB atau yang terdeteksi biner tetap muncul di pohon, tetapi isinya dilewati dengan catatan.

## Struktur proyek

```
RyMD/
├── index.js          # entry point CLI & validasi argumen
├── package.json      # properti "bin" untuk registrasi perintah rymd
└── src/
    ├── config.js     # ignore list, label bahasa, batas ukuran
    ├── crawler.js    # file crawler: memindai direktori
    └── generator.js  # markdown generator: tree + isi file
```

## Menghapus

```bash
npm unlink -g rymd
```

## Lisensi

MIT
