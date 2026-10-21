// RANJAU.JS: logika halaman Kisah Ranjau. Butuh aaa.js.
var U = (window.UMKM_DATA && window.UMKM_DATA.usaha) || {};
try { var s = JSON.parse(localStorage.getItem('umkm_cakyat_usaha') || 'null'); if (s) U = Object.assign({}, U, s); } catch (e) {}
var $ = function (i) { return document.getElementById(i); };
function wa(t) { return 'https://wa.me/' + String(U.nomorWa || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(t); }
var T = { merahpedas: ['#8B0000', '#E63946', '#FFF9F5', '#FF8A1F'], krem: ['#7A4A12', '#B7791F', '#FAEDCD', '#E9A23B'], abu: ['#2D3748', '#4A5568', '#EDF2F7', '#F6AD55'], kuning: ['#92400E', '#D97706', '#FEF3C7', '#F59E0B'], hijausejuk: ['#065F46', '#059669', '#ECFDF5', '#FBBF24'], ungu: ['#4C1D95', '#7C3AED', '#F5F3FF', '#FB923C'] };
var tn = null; try { tn = localStorage.getItem('umkm_cakyat_tema'); } catch (e) {}
var c = T[tn || U.temaWarna] || T.merahpedas, r = document.documentElement.style;
r.setProperty('--warna-utama', c[0]); r.setProperty('--warna-aksen', c[1]); r.setProperty('--warna-latar', c[2]); r.setProperty('--warna-api', c[3]);

if (U.namaUsaha) { $('nm').textContent = U.namaUsaha; $('nm2').textContent = U.namaUsaha; }
if (U.berdiri) { $('thn').textContent = U.berdiri; $('tl1').textContent = U.berdiri; }
if (U.keteranganProduk) $('tl3').textContent = U.keteranganProduk;
$('yr').textContent = new Date().getFullYear();
$('waTop').href = $('waBawah').href = wa('Halo Cak Yat, saya mau pesan bakso.');

var B = [
  ['fa-circle', 'Bakso besar', 'Bakso sapi berukuran besar dengan tekstur kenyal sebagai wadah kejutannya.'],
  ['fa-pepper-hot', 'Isi cabai pedas', 'Inilah "ranjau"-nya. Cabai pedas tersembunyi di dalam bakso dan baru terasa saat digigit.'],
  ['fa-bowl-food', 'Kuah kaldu sapi', 'Kuah kaldu sapi kaya rempah yang hangat, pas untuk meredakan pedasnya.'],
  ['fa-fire', 'Sambal pilihan', 'Pada Bakso Beranak Pedas, bakso jumbo berisi bakso kecil dan sambal pilihan di dalamnya.']
];
$('bagian').innerHTML = B.map(function (b, i) { return '<button data-i="' + i + '"><i class="fa-solid ' + b[0] + '"></i>' + b[1] + '</button>'; }).join('');
$('bagian').addEventListener('click', function (e) {
  var bt = e.target.closest('button'); if (!bt) return;
  document.querySelectorAll('#bagian button').forEach(function (x) { x.classList.remove('on'); });
  bt.classList.add('on');
  var p = $('penjelasan'); p.style.animation = 'none'; p.offsetHeight; p.style.animation = '';
  p.textContent = B[bt.dataset.i][2];
});

var L = [
  ['Level 1: Santai', 'Bakso Isi Daging'],
  ['Level 2: Mulai Berani', 'Bakso Campur'],
  ['Level 3: Pedas Mantap', 'Bakso Ranjau Kasar'],
  ['Level 4: Siap Ketagihan', 'Bakso Ranjau Beranak & Bakso Ranjau Kasar'],
  ['Level 5: Tantangan Cak Yat', 'Bakso Ranjau Beranak']
];
function level() {
  var n = Number($('slider').value), l = L[n - 1];
  $('cabai').innerHTML = new Array(n + 1).join('<i class="fa-solid fa-pepper-hot"></i>');
  $('lvlNama').textContent = l[0];
  $('lvlMenu').textContent = 'Menu yang cocok: ' + l[1];
  $('lvlWa').href = wa('Halo Cak Yat, saya mau pesan ' + l[1] + '.');
}
$('slider').addEventListener('input', level); level();

var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });