// APP.JS: tampilan, tema, peta, animasi. Butuh aaa.js (data).
var KEY = 'umkm_cakyat_data_v1', KEY_TEMA = 'umkm_cakyat_tema';
var BASE = JSON.parse(JSON.stringify(window.UMKM_DATA || { usaha: {}, produk: [] }));
var D = BASE;
function $(id) { return document.getElementById(id); }
function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
/* PENYIMPANAN: IndexedDB (kapasitas besar, cocok untuk foto). */
function idb(mode, fn, done) {
    try {
        var r = indexedDB.open('umkm_cakyat', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onerror = function () { done(null, false); };
        r.onsuccess = function () {
            var db = r.result, tx = db.transaction('kv', mode), req = fn(tx.objectStore('kv'));
            tx.oncomplete = function () { db.close(); done(req && req.result, true); };
            tx.onerror = tx.onabort = function () { db.close(); done(null, false); };
        };
    } catch (e) { done(null, false); }
}
function persist() {
    idb('readwrite', function (s) { return s.put(D, KEY); }, function (_, ok) {
        if (ok) { try { localStorage.removeItem(KEY); } catch (e) {} }
        else { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { alert('Gagal menyimpan: penyimpanan browser penuh atau diblokir. Coba foto yang lebih kecil.'); } }
    });
    try { var u = JSON.parse(JSON.stringify(D.usaha)); delete u.fotoUtama; delete u.logoToko; localStorage.setItem('umkm_cakyat_usaha', JSON.stringify(u)); } catch (e) {}
    return true;
}
function waLink(teks) { return 'https://wa.me/' + String(D.usaha.nomorWa || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(teks || 'Halo Cak Yat, saya mau pesan bakso.'); }

/* ---------- TEMA ---------- */
var TEMA = {
    merahpedas: { u: '#8B0000', a: '#E63946', l: '#FFF9F5', api: '#FF8A1F' },
    krem: { u: '#7A4A12', a: '#B7791F', l: '#FAEDCD', api: '#E9A23B' },
    abu: { u: '#2D3748', a: '#4A5568', l: '#EDF2F7', api: '#F6AD55' },
    kuning: { u: '#92400E', a: '#D97706', l: '#FEF3C7', api: '#F59E0B' },
    hijausejuk: { u: '#065F46', a: '#059669', l: '#ECFDF5', api: '#FBBF24' },
    ungu: { u: '#4C1D95', a: '#7C3AED', l: '#F5F3FF', api: '#FB923C' }
};
function applyTema(n) {
    var t = TEMA[n] || TEMA.merahpedas, r = document.documentElement.style;
    var h = t.u.replace('#', ''), rgb = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }).join(',');
    r.setProperty('--warna-utama', t.u); r.setProperty('--warna-utama-rgb', rgb);
    r.setProperty('--warna-aksen', t.a); r.setProperty('--warna-latar', t.l); r.setProperty('--warna-api', t.api);
}
function toggleThemeDropdown(e) { e.stopPropagation(); $('themeDropdownMenu').classList.toggle('show'); }
function pilihTemaMenu(n) { applyTema(n); try { localStorage.setItem(KEY_TEMA, n); } catch (e) {} $('themeDropdownMenu').classList.remove('show'); }
document.addEventListener('click', function () { var m = $('themeDropdownMenu'); if (m) m.classList.remove('show'); });

/* ---------- RENDER HALAMAN ---------- */
function render() {
    var u = D.usaha;
    document.title = u.namaUsaha || document.title;
    setText('navLogo', u.namaUsaha); setText('dispNamaUsaha', u.namaUsaha); setText('dispNamaUsahaFooter', u.namaUsaha);
    var lk = $('dispLabelKecil'); if (lk) lk.innerHTML = '<i class="fa-solid fa-fire"></i> ' + esc(u.labelKecil);
    setText('dispSlogan', u.slogan); setText('dispCerita', u.cerita); setText('dispPemilik', u.pemilik);
    setText('dispBerdiri', u.berdiri); setText('dispKaryawan', u.karyawan);
    setText('dispFakta1Teks', u.fakta1); setText('dispFakta2Teks', u.fakta2); setText('dispFakta3Teks', u.fakta3);
    setText('dispKeunggulan1Teks', u.keunggulan1); setText('dispKeunggulan2Teks', u.keunggulan2); setText('dispKeunggulan3Teks', u.keunggulan3);
    setText('dispKeteranganProduk', u.keteranganProduk);
    setText('dispAlamat', u.alamat); setText('dispNoWaTeks', u.nomorWaTeks); setText('dispMedsos', u.medsos);
    setText('dispJamWeekday', u.jamWeekday); setText('dispJamWeekend', u.jamWeekend);
    setText('dispTahunFooter', new Date().getFullYear());
    if (u.fotoUtama) { $('dispFotoUtama').src = u.fotoUtama; $('dispFotoTentang').src = u.fotoUtama; }
    if (u.logoToko) $('navLogoImg').src = u.logoToko;
    ['btnPesanWaHero', 'btnChatKontak', 'waFloat'].forEach(function (id) { var el = $(id); if (el) el.href = waLink('Halo Cak Yat, saya mau pesan bakso.'); });
    var gm = $('dispGoogleMaps'); if (gm) gm.href = u.linkMaps || ('https://maps.google.com/?q=' + encodeURIComponent(u.alamat || ''));
    renderPeta(); renderProduk(); renderTambahan();
    var rs = document.documentElement.style;
    rs.setProperty('--produk-img-object-fit', u.photoFit || 'cover'); rs.setProperty('--produk-img-height', u.photoHeight || '200px');
}

function renderPeta() {
    var box = $('mapContainer'); if (!box) return;
    var q = encodeURIComponent(D.usaha.alamat || D.usaha.namaUsaha || 'Singosari Malang');
    var src = 'https://maps.google.com/maps?q=' + q + '&z=16&output=embed';
    if (box.getAttribute('data-src') === src) return;
    box.setAttribute('data-src', src);
    box.innerHTML = '<iframe src="' + src + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Peta lokasi"></iframe>';
}

var LVNAMA = ['', 'Santai', 'Mulai Berani', 'Pedas Mantap', 'Siap Ketagihan', 'Tantangan Cak Yat'];
function pesanProduk(p, lv) {
    var t = 'Halo Cak Yat, saya mau pesan ' + p.nama + ' (' + p.berat + ').';
    if (lv) t += ' Level pedas: ' + lv + ' (' + LVNAMA[lv] + ').';
    return waLink(t);
}
function renderProduk() {
    var g = $('produkGrid'); if (!g) return;
    var ph = 'https://placehold.co/200x320/8B0000/FFFFFF?text=Bakso';
    g.innerHTML = D.produk.map(function (p, i) {
        var cabai = [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="pd" data-l="' + n + '" aria-label="Level pedas ' + n + '"><i class="fa-solid fa-pepper-hot"></i></button>'; }).join('');
        return '<div class="produk-card" data-i="' + i + '" data-lv="0"><div class="produk-img-container"><img src="' + esc(p.foto) + '" alt="' + esc(p.nama) + '" style="transform:scale(' + (Number(p.zoom) || 1) + ')" onerror="this.onerror=null;this.src=\'' + ph + '\'"><span class="produk-tanda" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation"></i></span><span class="produk-badge-porsi">' + esc(p.berat) + '</span></div>' +
            '<div class="produk-body"><h3 class="produk-title">' + esc(p.nama) + '</h3><span class="produk-harga">' + esc(p.harga) + '</span><p class="produk-desc">' + esc(p.deskripsi) + '</p>' +
            '<div class="pedas"><div class="pd-label">Atur pedas (opsional)</div><div class="pd-baris">' + cabai + '</div></div>' +
            '<a class="btn" target="_blank" rel="noopener" href="' + pesanProduk(p, 0) + '"><i class="fa-brands fa-whatsapp"></i> Pesan</a></div></div>';
    }).join('');
    pasangPedas();
}
/* request level pedas: ketuk cabai, ketuk lagi level yang sama untuk batal */
function pasangPedas() {
    var g = $('produkGrid'); if (!g || g.getAttribute('data-pd')) return;
    g.setAttribute('data-pd', '1');
    g.addEventListener('click', function (e) {
        var b = e.target.closest('.pd'); if (!b) return;
        var card = b.closest('.produk-card'), p = D.produk[Number(card.getAttribute('data-i'))]; if (!p) return;
        var lv = Number(b.getAttribute('data-l')), now = Number(card.getAttribute('data-lv')) || 0;
        if (now === lv) lv = 0;
        card.setAttribute('data-lv', lv);
        card.querySelectorAll('.pd').forEach(function (x) { x.classList.toggle('on', Number(x.getAttribute('data-l')) <= lv); });
        card.querySelector('.pd-label').textContent = lv ? ('Level ' + lv + ' · ' + LVNAMA[lv]) : 'Atur pedas (opsional)';
        card.querySelector('.btn').href = pesanProduk(p, lv);
        maskotReaksi(lv);
    });
}

function renderTambahan() {
    var th = new Date().getFullYear() - parseInt(D.usaha.berdiri, 10);
    var a = $('cntTahun'); if (a) a.setAttribute('data-count', isNaN(th) ? 0 : th);
    var b = $('cntMenu'); if (b) b.setAttribute('data-count', D.produk.length);
}

/* ---------- ANIMASI ---------- */
function hitung(el) {
    var to = Number(el.getAttribute('data-count')) || 0, t0 = null;
    function f(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(to * p); if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
}
function pasangAnimasi() {
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            e.target.querySelectorAll('[data-count]').forEach(hitung);
            io.unobserve(e.target);
        });
    }, { threshold: .2 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
}
function ketik() {
    var el = $('welcomeTyping'); if (!el) return;
    var kata = ['Senang Anda mampir ke warung online kami.', 'Siap berani pedas hari ini?', 'Ayo pilih menu, lalu pesan lewat WhatsApp!'], i = 0, j = 0, hapus = false;
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { el.textContent = kata[0]; return; }
    (function tik() {
        el.textContent = kata[i].slice(0, j);
        if (!hapus && j === kata[i].length) { hapus = true; return setTimeout(tik, 1800); }
        if (hapus && j === 0) { hapus = false; i = (i + 1) % kata.length; }
        j += hapus ? -1 : 1; setTimeout(tik, hapus ? 25 : 55);
    })();
}

/* ---------- MASKOT CAK YAT ---------- */
var maskotTimer = null, maskotIdx = 0, maskotMati = false, seksiTerakhir = '';
var MASKOT_TIPS = ['Level 5 itu tantangan Cak Yat, lho. Berani?', 'Kuahnya segar, pedasnya bikin ketagihan!', 'Pesan lewat WA, nanti kami antar ke rumahmu.', 'Cabainya sembunyi di dalam bakso. Awas ya!', 'Atur level pedas dulu sebelum pesan, biar pas di lidah.'];
function maskotBicara(teks, ex, lama) {
    var m = $('maskot'); if (!m || maskotMati) return;
    if (ex) m.setAttribute('data-ex', ex);
    $('maskotTeks').textContent = teks; $('maskotBubble').classList.add('show');
    clearTimeout(maskotTimer);
    maskotTimer = setTimeout(function () { $('maskotBubble').classList.remove('show'); m.setAttribute('data-ex', 'senyum'); }, lama || 6500);
}
function maskotSeksi(id) {
    var b = D.usaha.berdiri;
    var S = {
        beranda: ['senyum', 'Sugeng rawuh! Aku Cak Yat. Berani pedas hari ini?'],
        tentang: ['senyum', 'Sejak ' + (b || 'dulu') + ' resepnya kami jaga dengan sepenuh hati.'],
        produk: ['pedas', 'Hati-hati, ada ranjau di dalam bakso! Atur dulu level pedasmu.'],
        kontak: ['nyengir', 'Mampir ke warung, atau pesan antar lewat WA ya!']
    };
    if (S[id]) maskotBicara(S[id][1], S[id][0]);
}
function maskotReaksi(lv) {
    if (lv >= 4) maskotBicara('Waduh, level ' + lv + '! Siapin es teh dulu ya.', 'pedas');
    else if (lv === 3) maskotBicara('Pedas mantap, pilihan Cak Yat!', 'nyengir');
    else if (lv >= 1) maskotBicara('Aman, santai dulu ya. Boleh naik level nanti.', 'senyum');
    else maskotBicara('Oke, tanpa pedas. Aman!', 'senyum');
}
function maskotInit() {
    var m = $('maskot'); if (!m) return;
    m.addEventListener('click', function () { maskotBicara(MASKOT_TIPS[maskotIdx++ % MASKOT_TIPS.length], maskotIdx % 2 ? 'nyengir' : 'senyum', 7000); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.click(); } });
    var x = $('maskotTutup'); if (x) x.addEventListener('click', function (e) { e.stopPropagation(); maskotMati = true; m.style.display = 'none'; });
    setTimeout(function () { if (!seksiTerakhir) { seksiTerakhir = 'beranda'; maskotSeksi('beranda'); } }, 1200);
}

/* ---------- MODAL & TAB ---------- */
function openModal(id) { $(id).classList.add('active'); }
function closeModal(id) { $(id).classList.remove('active'); }
function switchTab(e, id) {
    var m = $('modalDashboard');
    m.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    m.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    e.currentTarget.classList.add('active'); $(id).classList.add('active');
}

/* sinkron dari cloud: data terbaru menggantikan tampilan awal (aaa.js / cache) */
function sinkronCloud() {
    if (!window.CLOUD || !CLOUD.aktif) return;
    CLOUD.muat().then(function (c) {
        if (!c) return;
        var baru = { usaha: Object.assign({}, BASE.usaha, c.usaha), produk: c.produk };
        if (JSON.stringify(baru) === JSON.stringify(D)) return;
        D = baru; render();
        if ($('modalDashboard').classList.contains('active') && typeof renderAdmin === 'function') renderAdmin();
        idb('readwrite', function (s) { return s.put(D, KEY); }, function () {});
    }).catch(function () {});
}

/* ---------- MULAI ---------- */
/* menu aktif mengikuti bagian yang sedang dilihat */
function spy() {
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!links.length || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
            if (!e.isIntersecting) return;
            links.forEach(function (a) { a.classList.toggle('aktif', a.getAttribute('href') === '#' + e.target.id); });
            if (e.target.id !== seksiTerakhir) { seksiTerakhir = e.target.id; maskotSeksi(e.target.id); }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
}
function mulai() {
    var t = null; try { t = localStorage.getItem(KEY_TEMA); } catch (e) {}
    applyTema(t || D.usaha.temaWarna);
    document.querySelectorAll('.modal-overlay').forEach(function (m) { m.addEventListener('mousedown', function (e) { if (e.target === m) m.classList.remove('active'); }); });
    render(); ketik(); pasangAnimasi(); spy(); maskotInit();
}
idb('readonly', function (s) { return s.get(KEY); }, function (v) {
    if (!v) { try { v = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} }
    if (v && v.usaha && Array.isArray(v.produk)) D = v;
    mulai(); sinkronCloud();
});

/* pengecekan otomatis */
if (!window.UMKM_DATA) alert('Masalah website: aaa.js tidak terbaca. Pastikan aaa.js satu folder dengan index.html.');