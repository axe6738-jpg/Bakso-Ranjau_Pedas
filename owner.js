// OWNER.JS: panel kelola website. Dimuat setelah app.js.
function bukaOwner() {
    if (typeof D === 'undefined') { alert('app.js belum termuat. Cek file app.js di folder website.'); return false; }
    $('inputPassOwner').value = ''; $('errorPass').style.display = 'none';
    openModal('modalPassword'); setTimeout(function () { $('inputPassOwner').focus(); }, 50);
    return false;
}
(function () { var p = $('inputPassOwner'); if (p) p.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkOwnerPass(); }); })();

/* ---------- OWNER ---------- */
function checkOwnerPass() {
    var pw = $('inputPassOwner').value;
    var asli = (D.usaha.ownerPass != null && D.usaha.ownerPass !== '') ? D.usaha.ownerPass : BASE.usaha.ownerPass;
    if (pw === String(asli)) { closeModal('modalPassword'); bukaDashboard(); }
    else $('errorPass').style.display = 'block';
}
function bukaDashboard() {
    var u = D.usaha;
    $('editNoWa').value = u.nomorWa || ''; $('editNoWaTeks').value = u.nomorWaTeks || ''; $('editAlamat').value = u.alamat || '';
    $('editJamWeekday').value = u.jamWeekday || ''; $('editJamWeekend').value = u.jamWeekend || '';
    $('editMedsos').value = u.medsos || ''; $('editLinkMaps').value = u.linkMaps || ''; $('editOwnerPass').value = '';
    $('editLogoToko').value = u.logoToko || ''; $('previewLogoToko').src = u.logoToko || '';
    $('editFotoUtama').value = u.fotoUtama || ''; $('previewFotoUtama').src = u.fotoUtama || '';
    renderAdmin(); openModal('modalDashboard');
}
function saveInfoUsaha(e) {
    e.preventDefault(); var u = D.usaha;
    u.nomorWa = $('editNoWa').value.trim(); u.nomorWaTeks = $('editNoWaTeks').value.trim(); u.alamat = $('editAlamat').value.trim();
    u.jamWeekday = $('editJamWeekday').value.trim(); u.jamWeekend = $('editJamWeekend').value.trim();
    u.medsos = $('editMedsos').value.trim(); u.linkMaps = $('editLinkMaps').value.trim();
    u.logoToko = $('editLogoToko').value; u.fotoUtama = $('editFotoUtama').value;
    var pw = $('editOwnerPass').value.trim(); if (pw) u.ownerPass = pw;
    if (persist()) { render(); $('editOwnerPass').value = ''; toast(pw ? 'Password diganti. Unduh aaa.js baru agar berlaku di semua perangkat.' : 'Tersimpan'); }
}

/* kompres foto agar muat di penyimpanan browser */
function kompres(input, maxPx, cb) {
    var f = input.files && input.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
        var im = new Image();
        im.onload = function () {
            var s = Math.min(1, maxPx / Math.max(im.width, im.height)), c = document.createElement('canvas');
            c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .82));
        };
        im.src = r.result;
    };
    r.readAsDataURL(f);
}
function previewLogoPhoto(i) { kompres(i, 300, function (d) { $('editLogoToko').value = d; $('previewLogoToko').src = d; }); }
function previewMainPhoto(i) { kompres(i, 900, function (d) { $('editFotoUtama').value = d; $('previewFotoUtama').src = d; }); }
function previewProductPhoto(i) { kompres(i, 600, function (d) { $('prodFoto').value = d; $('previewFotoProduk').src = d; }); }

/* produk */
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
    var p = { nama: $('prodNama').value.trim(), berat: $('prodBerat').value.trim(), harga: $('prodHarga').value.trim(), deskripsi: $('prodDesc').value.trim(), foto: $('prodFoto').value, zoom: Number($('prodZoom').value) };
    var i = $('editProdukIndex').value;
    if (i === '') D.produk.push(p); else D.produk[Number(i)] = p;
    if (persist()) { render(); renderAdmin(); closeModal('modalFormProduk'); toast('Produk tersimpan'); }
}
function hapusProduk(i) {
    if (!confirm('Hapus produk "' + D.produk[i].nama + '"?')) return;
    D.produk.splice(i, 1); if (persist()) { render(); renderAdmin(); }
}

/* publikasi: unduh aaa.js agar bisa diunggah ke GitHub */
function downloadAaa() {
    var isi = '// ISI WEBSITE (dibaca semua pengunjung). Ubah lewat Menu Owner.\nwindow.UMKM_DATA = ' + JSON.stringify(D, null, 2) + ';\n';
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([isi], { type: 'text/javascript' })); a.download = 'aaa.js';
    document.body.appendChild(a); a.click(); a.remove();
}
function resetData() {
    if (!confirm('Kembalikan semua isi ke data asli di aaa.js? Perubahan di browser ini akan hilang.')) return;
    function selesai() { try { localStorage.removeItem(KEY); localStorage.removeItem('umkm_cakyat_usaha'); } catch (e) {} location.reload(); }
    idb('readwrite', function (s) { return s.delete(KEY); }, selesai);
}