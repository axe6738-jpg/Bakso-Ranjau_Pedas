// OWNER.JS: panel kelola website. Dimuat setelah app.js dan cloud.js.
// Mode CLOUD (firebase-config.js terisi): login email+password, semua perubahan tersimpan di Firebase dan terlihat di semua perangkat.
// Mode LOKAL (belum diisi): perilaku lama, perubahan hanya di browser ini.
function cloudOn() { return !!(window.CLOUD && CLOUD.aktif); }
function pesanGalat(e) {
    var m = (e && e.message) || '';
    if (e && (e.status === 401 || e.status === 403 || /insufficient permissions|Belum login/i.test(m))) return 'Tidak punya izin atau sesi habis. Keluar lalu masuk lagi.';
    if (e instanceof TypeError) return 'Tidak ada koneksi internet.';
    return m || 'Gagal. Coba lagi.';
}
function bukaOwner() {
    if (typeof D === 'undefined') { alert('app.js belum termuat. Cek file app.js di folder website.'); return false; }
    if (cloudOn() && CLOUD.sudahMasuk()) { bukaDashboard(); return false; }
    var em = $('inputEmailOwner'), ket = $('ketLogin');
    if (em) { em.style.display = cloudOn() ? '' : 'none'; em.value = ''; }
    if (ket) ket.textContent = cloudOn() ? 'Masuk dengan email dan password pemilik:' : 'Masukkan password pemilik untuk mengedit:';
    $('inputPassOwner').value = ''; $('errorPass').style.display = 'none';
    openModal('modalPassword'); setTimeout(function () { (cloudOn() && em ? em : $('inputPassOwner')).focus(); }, 50);
    return false;
}
['inputPassOwner', 'inputEmailOwner'].forEach(function (id) { var p = $(id); if (p) p.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkOwnerPass(); }); });

/* ---------- LOGIN ---------- */
function galatLogin(t) { var e = $('errorPass'); e.textContent = t; e.style.display = 'block'; }
function checkOwnerPass() {
    var pw = $('inputPassOwner').value;
    if (!cloudOn()) {
        var asli = (D.usaha.ownerPass != null && D.usaha.ownerPass !== '') ? D.usaha.ownerPass : BASE.usaha.ownerPass;
        if (pw === String(asli)) { closeModal('modalPassword'); bukaDashboard(); } else galatLogin('Password salah!');
        return;
    }
    var em = $('inputEmailOwner').value.trim(), btn = $('btnMasukOwner');
    if (!em || !pw) { galatLogin('Isi email dan password.'); return; }
    btn.disabled = true; btn.textContent = 'Memeriksa...'; $('errorPass').style.display = 'none';
    CLOUD.masuk(em, pw).then(function () { closeModal('modalPassword'); bukaDashboard(); })
        .catch(function (e) { galatLogin(pesanGalat(e)); })
        .then(function () { btn.disabled = false; btn.textContent = 'Masuk Panel'; });
}
function keluarOwner() { if (cloudOn()) CLOUD.keluar(); closeModal('modalDashboard'); toast('Sudah keluar dari panel'); }

function bukaDashboard() {
    var u = D.usaha;
    $('editNoWa').value = u.nomorWa || ''; $('editNoWaTeks').value = u.nomorWaTeks || ''; $('editAlamat').value = u.alamat || '';
    $('editJamWeekday').value = u.jamWeekday || ''; $('editJamWeekend').value = u.jamWeekend || '';
    $('editMedsos').value = u.medsos || ''; $('editLinkMaps').value = u.linkMaps || ''; $('editOwnerPass').value = '';
    $('editLogoToko').value = u.logoToko || ''; $('previewLogoToko').src = u.logoToko || '';
    $('editFotoUtama').value = u.fotoUtama || ''; $('previewFotoUtama').src = u.fotoUtama || '';
    var on = cloudOn();
    $('statusCloud').textContent = on ? ('Terhubung ke cloud (Firebase). Masuk sebagai ' + (CLOUD.email() || 'pemilik') + '.') : 'Cloud belum dihubungkan. Perubahan hanya tersimpan di browser ini.';
    $('ketPublikasi').textContent = on ? 'Semua perubahan langsung tersimpan di cloud dan muncul di semua perangkat. Kalau cloud masih kosong, klik tombol unggah di bawah satu kali saja.' : 'Isi firebase-config.js agar perubahan bisa dilihat semua pengunjung. Sementara ini, unduh aaa.js lalu ganti file aaa.js di GitHub.';
    $('btnSeed').style.display = on ? '' : 'none';
    renderAdmin(); openModal('modalDashboard');
}

/* ---------- INFO USAHA ---------- */
function saveInfoUsaha(e) {
    e.preventDefault(); var u = D.usaha;
    u.nomorWa = $('editNoWa').value.trim(); u.nomorWaTeks = $('editNoWaTeks').value.trim(); u.alamat = $('editAlamat').value.trim();
    u.jamWeekday = $('editJamWeekday').value.trim(); u.jamWeekend = $('editJamWeekend').value.trim();
    u.medsos = $('editMedsos').value.trim(); u.linkMaps = $('editLinkMaps').value.trim();
    u.logoToko = $('editLogoToko').value; u.fotoUtama = $('editFotoUtama').value;
    if (!cloudOn()) { persist(); render(); toast('Tersimpan (hanya di browser ini)'); return; }
    toast('Menyimpan ke cloud...');
    CLOUD.simpanUsaha(u).then(function () { persist(); render(); toast('Tersimpan di cloud'); })
        .catch(function (er) { toast(pesanGalat(er)); });
}
function gantiPassword(e) {
    e.preventDefault(); var pw = $('editOwnerPass').value.trim();
    if (!pw) { toast('Isi password baru dulu'); return; }
    if (cloudOn()) {
        if (pw.length < 6) { toast('Password minimal 6 karakter'); return; }
        CLOUD.gantiPassword(pw).then(function () { $('editOwnerPass').value = ''; toast('Password login diganti'); })
            .catch(function (er) { toast(pesanGalat(er)); });
    } else { D.usaha.ownerPass = pw; persist(); $('editOwnerPass').value = ''; toast('Password diganti (hanya di browser ini)'); }
}

/* kompres foto agar kecil (disimpan sebagai teks di database) */
function kompres(input, maxPx, cb) {
    var f = input.files && input.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
        var im = new Image();
        im.onload = function () {
            var s = Math.min(1, maxPx / Math.max(im.width, im.height)), c = document.createElement('canvas');
            c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .8));
        };
        im.src = r.result;
    };
    r.readAsDataURL(f);
}
function previewLogoPhoto(i) { kompres(i, 300, function (d) { $('editLogoToko').value = d; $('previewLogoToko').src = d; }); }
function previewMainPhoto(i) { kompres(i, 800, function (d) { $('editFotoUtama').value = d; $('previewFotoUtama').src = d; }); }
function previewProductPhoto(i) { kompres(i, 600, function (d) { $('prodFoto').value = d; $('previewFotoProduk').src = d; }); }

/* ---------- PRODUK ---------- */
function renderAdmin() {
    $('tbodyProdukAdmin').innerHTML = D.produk.map(function (p, i) {
        return '<tr><td><img class="image-preview" src="' + esc(p.foto) + '" alt="" onerror="this.removeAttribute(\'src\')"></td><td>' + esc(p.nama) + '</td><td>' + esc(p.harga) + '</td>' +
            '<td><button class="btn-kecil" style="background:#ED8936" onclick="openFormProduk(' + i + ')">Edit</button><button class="btn-kecil" style="background:#E53E3E" onclick="hapusProduk(' + i + ')">Hapus</button></td></tr>';
    }).join('') || '<tr><td colspan="4">Belum ada produk.</td></tr>';
}
function openFormProduk(i) {
    var p = (i === undefined) ? { nama: '', berat: '', harga: '', deskripsi: '', foto: '', zoom: 1 } : D.produk[i];
    $('judulFormProduk').textContent = (i === undefined) ? 'Tambah Produk' : 'Edit Produk';
    $('editProdukIndex').value = (i === undefined) ? '' : i;
    $('prodNama').value = p.nama; $('prodBerat').value = p.berat; $('prodHarga').value = p.harga; $('prodDesc').value = p.deskripsi;
    $('prodFoto').value = p.foto || ''; $('previewFotoProduk').src = p.foto || ''; $('fileFotoProduk').value = '';
    $('prodZoom').value = String(Number(p.zoom) === 1.15 ? 1.15 : 1);
    openModal('modalFormProduk');
}
function saveFormProduk(e) {
    e.preventDefault();
    var i = $('editProdukIndex').value, lama = (i === '') ? null : D.produk[Number(i)];
    var p = { id: lama && lama.id, urutan: (lama && lama.urutan) || Date.now(), nama: $('prodNama').value.trim(), berat: $('prodBerat').value.trim(), harga: $('prodHarga').value.trim(), deskripsi: $('prodDesc').value.trim(), foto: $('prodFoto').value, zoom: Number($('prodZoom').value) };
    function selesai(pesan) {
        if (i === '') D.produk.push(p); else D.produk[Number(i)] = p;
        persist(); render(); renderAdmin(); closeModal('modalFormProduk'); toast(pesan);
    }
    if (!cloudOn()) { selesai('Produk tersimpan (hanya di browser ini)'); return; }
    toast('Menyimpan ke cloud...');
    CLOUD.simpanProduk(p).then(function (id) { p.id = id; selesai('Produk tersimpan di cloud'); })
        .catch(function (er) { toast(pesanGalat(er)); });
}
function hapusProduk(i) {
    var p = D.produk[i];
    if (!confirm('Hapus produk "' + p.nama + '"?')) return;
    function selesai() { D.produk.splice(i, 1); persist(); render(); renderAdmin(); toast('Produk dihapus'); }
    if (cloudOn() && p.id) CLOUD.hapusProduk(p.id).then(selesai).catch(function (er) { toast(pesanGalat(er)); });
    else selesai();
}

/* ---------- CLOUD & CADANGAN ---------- */
function unggahAwal() {
    if (!cloudOn()) return;
    if (!confirm('Unggah isi website yang tampil sekarang ke cloud? Data produk dan info usaha di cloud akan ditimpa. Cukup dilakukan satu kali di awal.')) return;
    toast('Mengunggah ke cloud...');
    CLOUD.seed(D).then(function (hasil) { D.produk = hasil; persist(); render(); renderAdmin(); toast('Berhasil. Data sudah ada di cloud.'); })
        .catch(function (er) { toast(pesanGalat(er)); });
}
function downloadAaa() {
    var isi = '// ISI WEBSITE (cadangan). Ubah lewat Menu Owner.\nwindow.UMKM_DATA = ' + JSON.stringify(D, null, 2) + ';\n';
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], { type: 'text/javascript' })); a.download = 'aaa.js';
    document.body.appendChild(a); a.click(); a.remove();
}
function resetData() {
    if (!confirm('Hapus data tersimpan di browser ini dan muat ulang? ' + (cloudOn() ? 'Data di cloud tidak terhapus.' : 'Isi akan kembali ke data di aaa.js.'))) return;
    function selesai() { try { localStorage.removeItem(KEY); localStorage.removeItem('umkm_cakyat_usaha'); } catch (e) {} location.reload(); }
    idb('readwrite', function (s) { return s.delete(KEY); }, selesai);
}
