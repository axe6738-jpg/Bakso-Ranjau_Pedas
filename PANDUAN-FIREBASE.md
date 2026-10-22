# Panduan Menghubungkan Website ke Firebase (gratis, tanpa kartu kredit)

Setelah ini selesai, produk/foto/kontak yang diubah lewat menu Owner langsung tampil di SEMUA perangkat.
Tidak perlu lagi mengunduh aaa.js dan upload ke GitHub setiap ada perubahan.

## 1. Buat project
1. Buka https://console.firebase.google.com lalu login dengan akun Google.
2. Klik **Create a project** / **Add project**, beri nama (misal `cakyat`). Google Analytics boleh dimatikan.

## 2. Buat database (Firestore)
1. Menu kiri: **Build > Firestore Database > Create database**.
2. Lokasi: **asia-southeast2 (Jakarta)**. Lokasi tidak bisa diganti nanti.
3. Pilih **Production mode** (BUKAN test mode, karena test mode kedaluwarsa dan terbuka untuk umum).

## 3. Buat akun pemilik
1. Menu kiri: **Build > Authentication > Get started**.
2. Tab **Sign-in method** > **Email/Password** > Enable > Save.
3. Tab **Users** > **Add user**: isi email dan password pemilik (min. 6 karakter, jangan "1").
4. Salin **User UID** akun itu (kolom paling kanan di daftar Users).

## 4. Pasang aturan keamanan (INI YANG MELINDUNGI DATA)
Firestore > tab **Rules**, hapus isinya, tempel ini, ganti `UID_PEMILIK` dengan UID tadi, klik **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /situs/{dok} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid in ['UID_PEMILIK'];
    }
    match /produk/{dok} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid in ['UID_PEMILIK'];
    }
  }
}
```
Kalau ada lebih dari satu pemilik/admin: `['UID_1', 'UID_2']`.
Artinya: semua orang boleh MELIHAT, hanya akun pemilik yang boleh MENGUBAH.

## 5. Ambil 2 nilai untuk website
1. Klik ikon roda gigi > **Project settings > General**.
2. Bagian **Your apps** > ikon web **</>** > beri nama bebas > Register app (Hosting tidak perlu).
3. Dari `firebaseConfig`, salin **apiKey** dan **projectId**.
4. Buka `firebase-config.js`, ganti `ISI_API_KEY` dan `ISI_PROJECT_ID` dengan nilai itu.

(Nilai ini memang boleh terlihat publik. Keamanan ada di Rules langkah 4.)

## 6. Upload dan isi data awal
1. Upload semua file di zip ini ke GitHub (timpa file lama, folder `img/` jangan dihapus).
2. Buka website > tombol gembok **Owner** > masuk dengan email + password langkah 3.
3. Tab **Publikasi** > **Unggah Data Awal ke Cloud** (SEKALI SAJA).
4. Selesai. Coba tambah produk lewat Owner, lalu buka website dari HP lain: produknya muncul.

## Catatan
- Foto produk yang ditambah lewat Owner dikompres lalu disimpan sebagai teks di database (batas 1 MB per dokumen), jadi tidak butuh Firebase Storage.
- Pilihan tambahan: Authentication > Settings > User actions, matikan **Enable create (sign-up)** supaya orang asing tidak bisa membuat akun. Mereka tetap tidak bisa mengubah data karena Rules.
- Kalau lupa password pemilik: Authentication > Users > titik tiga > Reset password.
- Kalau Firebase tidak bisa dijangkau, website tetap tampil memakai data terakhir yang tersimpan / aaa.js.
