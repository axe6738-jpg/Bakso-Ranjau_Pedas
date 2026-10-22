// CLOUD.JS: sambungan ke Firebase (Firestore + Authentication) lewat REST, tanpa library berat.
// Pengunjung hanya MEMBACA data. Menulis hanya bisa setelah login sebagai pemilik (dijaga Rules Firestore).
(function () {
    var C = window.FIREBASE_CONFIG || {};
    var aktif = !!(C.apiKey && C.projectId && !/^ISI/i.test(C.apiKey) && !/^ISI/i.test(C.projectId));
    var DB = 'https://firestore.googleapis.com/v1/projects/' + C.projectId + '/databases/(default)/documents';
    var KEY = encodeURIComponent(C.apiKey || '');
    var tok = null;
    try { tok = JSON.parse(sessionStorage.getItem('umkm_sesi') || 'null'); } catch (e) {}

    var PESAN = {
        INVALID_LOGIN_CREDENTIALS: 'Email atau password salah.', EMAIL_NOT_FOUND: 'Email atau password salah.', INVALID_PASSWORD: 'Email atau password salah.',
        USER_DISABLED: 'Akun ini dinonaktifkan.', TOO_MANY_ATTEMPTS_TRY_LATER: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
        INVALID_EMAIL: 'Format email salah.', MISSING_PASSWORD: 'Password belum diisi.', WEAK_PASSWORD: 'Password minimal 6 karakter.',
        CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'Masuk ulang dulu, lalu ganti password.', TOKEN_EXPIRED: 'Sesi habis. Masuk lagi.',
        OPERATION_NOT_ALLOWED: 'Login Email/Password belum diaktifkan di Firebase.', API_KEY_INVALID: 'API key salah. Cek firebase-config.js.'
    };
    function terjemah(m) { m = String(m || ''); for (var k in PESAN) { if (m.indexOf(k) > -1) return PESAN[k]; } return m; }

    function http(method, u, body, bearer, form) {
        var h = {};
        if (body) h['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json';
        var tahap = bearer ? idToken() : Promise.resolve(null);
        return tahap.then(function (t) {
            if (t) h.Authorization = 'Bearer ' + t;
            return fetch(u, { method: method, headers: h, body: body ? (form ? body : JSON.stringify(body)) : undefined });
        }).then(function (r) {
            return r.text().then(function (txt) {
                var j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
                if (!r.ok) {
                    var er = new Error(terjemah((j && j.error && j.error.message) || ('Gagal (' + r.status + ')')));
                    er.status = r.status; throw er;
                }
                return j;
            });
        });
    }
    function url(path) { return DB + path + (path.indexOf('?') > -1 ? '&' : '?') + 'key=' + KEY; }

    function simpanSesi(j) {
        tok = {
            idToken: j.idToken || j.id_token, refreshToken: j.refreshToken || j.refresh_token,
            exp: Date.now() + (Number(j.expiresIn || j.expires_in || 3600) - 60) * 1000,
            uid: j.localId || j.user_id || (tok && tok.uid), email: j.email || (tok && tok.email)
        };
        try { sessionStorage.setItem('umkm_sesi', JSON.stringify(tok)); } catch (e) {}
        return tok;
    }
    function keluar() { tok = null; try { sessionStorage.removeItem('umkm_sesi'); } catch (e) {} }
    function idToken() {
        if (!tok) return Promise.reject(new Error('Belum login'));
        if (Date.now() < tok.exp) return Promise.resolve(tok.idToken);
        return http('POST', 'https://securetoken.googleapis.com/v1/token?key=' + KEY, 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(tok.refreshToken), false, true)
            .then(function (j) { simpanSesi(j); return tok.idToken; })
            .catch(function () { keluar(); throw new Error('Sesi habis. Masuk lagi.'); });
    }

    /* konversi objek biasa <-> format dokumen Firestore */
    function keFS(o) {
        var f = {};
        Object.keys(o).forEach(function (k) {
            var v = o[k]; if (v === undefined || v === null) return;
            if (typeof v === 'number') f[k] = { doubleValue: v };
            else if (typeof v === 'boolean') f[k] = { booleanValue: v };
            else f[k] = { stringValue: String(v) };
        });
        return { fields: f };
    }
    function dariFS(d) {
        var o = {}, f = (d && d.fields) || {};
        Object.keys(f).forEach(function (k) {
            var v = f[k];
            if ('stringValue' in v) o[k] = v.stringValue;
            else if ('doubleValue' in v) o[k] = v.doubleValue;
            else if ('integerValue' in v) o[k] = Number(v.integerValue);
            else if ('booleanValue' in v) o[k] = v.booleanValue;
        });
        return o;
    }
    function cekUkuran(o) {
        if (JSON.stringify(o).length > 950000) throw new Error('Datanya terlalu besar (batas 1 MB per dokumen). Pakai foto yang lebih kecil.');
    }

    var CLOUD = window.CLOUD = {
        aktif: aktif,
        sudahMasuk: function () { return !!tok; },
        email: function () { return tok && tok.email; },
        masuk: function (email, pass) {
            return http('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY, { email: email, password: pass, returnSecureToken: true })
                .then(function (j) { return simpanSesi(j).email; });
        },
        keluar: keluar,
        gantiPassword: function (pw) {
            return idToken().then(function (t) {
                return http('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + KEY, { idToken: t, password: pw, returnSecureToken: true });
            }).then(simpanSesi);
        },
        /* ---- baca (publik) ---- */
        ambilUsaha: function () {
            return http('GET', url('/situs/usaha')).then(dariFS, function (e) { if (e.status === 404) return null; throw e; });
        },
        ambilProduk: function () {
            return http('GET', url('/produk?pageSize=200')).then(function (j) {
                var arr = ((j && j.documents) || []).map(function (d) { var o = dariFS(d); o.id = d.name.split('/').pop(); return o; });
                arr.sort(function (a, b) { return (a.urutan || 0) - (b.urutan || 0); });
                return arr;
            });
        },
       muat: function () {
            return Promise.all([CLOUD.ambilUsaha(), CLOUD.ambilProduk()]).then(function (r) { 
                return { usaha: r[0] || {}, produk: r[1] || [] }; 
            });
        /* ---- tulis (khusus pemilik yang sudah login) ---- */
        simpanUsaha: function (u) {
            var b = {}; Object.keys(u).forEach(function (k) { if (k !== 'ownerPass') b[k] = u[k]; });
            try { cekUkuran(b); } catch (e) { return Promise.reject(e); }
            return http('PATCH', url('/situs/usaha'), keFS(b), true);
        },
        simpanProduk: function (p) {
            var id = p.id || ('p' + Date.now().toString(36));
            var b = { nama: p.nama, berat: p.berat, harga: p.harga, deskripsi: p.deskripsi, foto: p.foto, zoom: Number(p.zoom) || 1, urutan: Number(p.urutan) || Date.now() };
            try { cekUkuran(b); } catch (e) { return Promise.reject(e); }
            return http('PATCH', url('/produk/' + encodeURIComponent(id)), keFS(b), true).then(function () { return id; });
        },
        hapusProduk: function (id) { return http('DELETE', url('/produk/' + encodeURIComponent(id)), null, true); },
        seed: function (data) {
            var hasil = [], p = CLOUD.simpanUsaha(data.usaha);
            data.produk.forEach(function (x, i) {
                p = p.then(function () {
                    var o = {}; Object.keys(x).forEach(function (k) { o[k] = x[k]; });
                    o.urutan = i + 1; o.id = x.id || ('p' + (i + 1));
                    return CLOUD.simpanProduk(o).then(function (id) { o.id = id; hasil.push(o); });
                });
            });
            return p.then(function () { return hasil; });
        }
    };
})();
