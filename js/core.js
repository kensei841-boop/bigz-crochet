/* ══════════════════════════════════════════════════════════════
   The Bigz Crochet — Frontend (SPA tunggal, UX instan)
   Prinsip: navigasi 0ms (show/hide) · render dari state lokal ·
   optimistic UI + localStorage · sinkron latar belakang · debounce ·
   data awam sudah disuntik oleh doGet (tiada RTT untuk paparan pertama)
   ══════════════════════════════════════════════════════════════ */
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rm = n => 'RM ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
const pd = iso => { const d = new Date(String(iso || '').replace(' ', 'T')); return isNaN(d) ? null : d; };
const fD = iso => { const d = pd(iso); return d ? d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() : '-'; };
const fT = iso => { const d = pd(iso); if (!d) return ''; let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return String(h).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap; };
const debounce = (f, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => f.apply(c, a), ms); }; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const sess = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) { } }
};
const STC = { 'Menunggu Bayaran': 'st-menunggu', 'Sudah Dibayar': 'st-dibayar', 'Sedang Dibuat': 'st-dibuat', 'Sudah Dihantar': 'st-dihantar', 'Dibatalkan': 'st-batal', 'Sembunyi': 'st-sembunyi', 'Aktif': 'st-dibayar' };
const STS = ['Menunggu Bayaran', 'Sudah Dibayar', 'Sedang Dibuat', 'Sudah Dihantar', 'Dibatalkan'];
const PAID = ['Sudah Dibayar', 'Sedang Dibuat', 'Sudah Dihantar'];
const chipSt = s => '<span class="pill ' + (STC[s] || '') + '">' + esc(s) + '</span>';
const icoCat = k => { k = String(k || '').toLowerCase(); return /beg|dompet/.test(k) ? 'handbag' : /amigurumi|patung/.test(k) ? 'balloon-heart' : /kunci/.test(k) ? 'key' : /bunga|tulip|tanam/.test(k) ? 'flower2' : /topi|pakaian/.test(k) ? 'stars' : /hiasan|alas/.test(k) ? 'cup-hot' : 'flower1'; };
const hue = s => { let h = 0; String(s).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 360; }); return 90 + (h % 90); };
const ph = p => '<div class="ph" style="--h:' + hue(p.kat || p.nama) + '"><i class="bi bi-' + icoCat(p.kat) + '"></i></div>';
const imgUrl = (u, w) => (u && u.indexOf('lh3.googleusercontent.com/d/') > 0 && u.indexOf('=') < 0) ? u + '=w' + w : (u || '');
const pic = (p, w) => (p.img && p.img[0]) ? '<img src="' + esc(imgUrl(p.img[0], w || 500)) + '" alt="' + esc(p.nama) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : ph(p);
const waLink = (no, txt) => 'https://wa.me/' + String(no || '').replace(/\D/g, '') + (txt ? '?text=' + encodeURIComponent(txt) : '');
const nowMs = () => Date.now();

/* ── State ── */
const S = {
  prods: [], set: {}, view: 'home', stack: [],
  cart: store.get('bz_cart', []), wish: store.get('bz_wish', []),
  cat: 'Semua', q: '', sort: 'baharu', shown: 8, pid: null, qty: 1, note: '',
  form: store.get('bz_form', { nama: '', telefon: '', alamat: '', emel: '', nota: '', setuju: true }),
  last: store.get('bz_last', null), payTab: 'bank', busy: false,
  A: { tok: sess.get('bz_tok'), d: null, view: 'dash', last: 0, idleMs: 1800000, of: { q: '', st: 'Semua', range: '30', page: 1, sel: {} }, pf: { q: '', kat: '', st: '', page: 1 }, cu: { tab: 'senarai', q: '', cons: '', page: 1, sel: {}, prods: {}, subj: '', msg: '' }, rep: { range: 'bulan', from: '', to: '', q: '', page: 1 }, sf: {}, stab: 'brand', dsh: 'six', oid: null, pfm: null }
};

/* ── UI asas: toast, modal ── */
function toast(msg, type) {
  const el = document.createElement('div'); el.className = 'toast ' + (type || 'ok');
  el.innerHTML = '<i class="bi bi-' + (type === 'err' ? 'exclamation-circle-fill' : 'check-circle-fill') + '"></i><span>' + esc(msg) + '</span>';
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, type === 'err' ? 4800 : 2400);
}
function modal(html, wide) { const b = $('#modalBox'); b.className = 'modal-box' + (wide ? ' wide' : ''); b.innerHTML = html; $('#modal').hidden = false; document.body.style.overflow = 'hidden'; }
function modalClose() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; document.body.style.overflow = ''; }
let _cb = null;
function confirmBox(title, msg, label, fn, danger) {
  _cb = fn;
  modal('<div class="mh"><h3 class="h-m">' + esc(title) + '</h3></div><p class="t2">' + esc(msg) + '</p><div class="mf"><button class="btn btn-w" data-act="modalClose">Batal</button><button class="btn ' + (danger ? 'btn-d' : 'btn-p') + '" data-act="confirmYes">' + esc(label) + '</button></div>');
}
function copyText(t) {
  const done = () => toast('Disalin ke papan klip');
  const fb = () => { const x = document.createElement('textarea'); x.value = t; x.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(x); x.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Tidak dapat menyalin', 'err'); } x.remove(); };
  try { navigator.clipboard.writeText(t).then(done, fb); } catch (e) { fb(); }
}
function openExt(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); a.remove(); }
function download(name, mime, parts) {
  const url = URL.createObjectURL(new Blob(parts, { type: mime })); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function b64Bytes(b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function toCSV(rows) {
  return '\ufeff' + rows.map(r => r.map(v => { let s = String(v == null ? '' : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
}
function busy(btn, on, label) {
  if (!btn) return; if (on) { btn._h = btn.innerHTML; btn.innerHTML = '<span class="spin sm"></span> ' + (label || 'Memproses…'); btn.disabled = true; }
  else { btn.innerHTML = btn._h || btn.innerHTML; btn.disabled = false; }
}

/* ── Tema (pembolehubah CSS dari Tetapan) ── */
function applyTheme(set) {
  const r = document.documentElement.style;
  [['warna_utama', '--primary'], ['warna_aksen', '--accent'], ['warna_canvas', '--canvas']].forEach(p => { if (set[p[0]] && /^#[0-9a-fA-F]{6}$/.test(set[p[0]])) r.setProperty(p[1], set[p[0]]); });
  document.title = (set.nama_perniagaan || 'The Bigz Crochet');
}
function setDark(on) { document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light'); store.set('bz_dark', on ? 1 : 0); }

/* ── Mod paparan: pelanggan / log masuk / admin ── */
function mode(m) {
  $('#pub').hidden = m !== 'pub'; $('#login').hidden = m !== 'login'; $('#adm').hidden = m !== 'adm';
  window.scrollTo(0, 0);
}

/* ══════════════ PELANGGAN: router ══════════════ */
const VIEWS = ['home', 'catalog', 'product', 'cart', 'status', 'help'];
const NAVMAP = { home: 'home', catalog: 'catalog', product: 'catalog', cart: 'cart', status: 'cart', help: 'help' };
function go(v, o) {
  o = o || {};
  if (!o.back && S.view !== v) S.stack.push(S.view);
  if (S.stack.length > 30) S.stack.shift();
  S.view = v; mode('pub');
  const f = R[v]; if (f) f(o);
  VIEWS.forEach(x => $('#v-' + x).classList.toggle('active', x === v));
  $$('#bnav button').forEach(b => b.classList.toggle('on', b.dataset.n === NAVMAP[v]));
  renderSticky(); window.scrollTo(0, 0);
}
function goBack() { const v = S.stack.pop() || 'home'; go(v, { back: true }); }

function renderHead() {
  const s = S.set, n = S.cart.reduce((a, l) => a + l.qty, 0);
  $('#pHead').innerHTML = '<div class="in-h"><button class="brand" data-act="go" data-v="home" aria-label="Laman utama">' +
    (s.logo_url ? '<img src="' + esc(imgUrl(s.logo_url, 200)) + '" alt="' + esc(s.nama_perniagaan) + '" referrerpolicy="no-referrer">' : '') +
    '<span><span class="bn">' + esc(s.nama_perniagaan || 'The Bigz Crochet') + '</span><br><span class="bt">' + esc(s.tagline || '') + '</span></span></button>' +
    '<button class="ib sm" data-act="goSearch" aria-label="Cari"><i class="bi bi-search"></i></button>' +
    '<button class="ib sm" data-act="go" data-v="cart" aria-label="Troli"><i class="bi bi-bag"></i><b class="cnt" id="hCnt"' + (n ? '' : ' hidden') + '>' + n + '</b></button>' +
    '<button class="avatar" data-act="adminEntry" aria-label="Admin"><i class="bi bi-person"></i></button></div>';
  updBadge();
}
function updBadge() {
  const n = S.cart.reduce((a, l) => a + l.qty, 0);
  const b = $('#navBadge'), h = $('#hCnt');
  if (b) { b.textContent = n; b.hidden = !n; } if (h) { h.textContent = n; h.hidden = !n; }
}
const saveCart = () => store.set('bz_cart', S.cart);
const P = id => S.prods.find(p => p.id === id);
const isNew = p => { const d = pd(p.tarikh); return d && (nowMs() - d.getTime()) < 30 * 864e5; };
const cats = () => { const m = {}; S.prods.forEach(p => { m[p.kat] = (m[p.kat] || 0) + 1; }); return Object.keys(m).sort((a, b) => m[b] - m[a]).map(k => [k, m[k]]); };

/* ── Troli (optimistic: UI + localStorage serta-merta, tiada panggilan server) ── */
function addCart(id, qty, note) {
  const l = S.cart.find(x => x.id === id && (x.note || '') === (note || ''));
  if (l) l.qty = Math.min(5, l.qty + qty); else S.cart.push({ id: id, qty: Math.min(5, qty), note: note || '' });
  saveCart(); updBadge();
}
function cartLines() { return S.cart.map(l => ({ l: l, p: P(l.id) })).filter(x => x.p); }
function cartTotals() {
  const sub = cartLines().reduce((a, x) => a + x.p.harga * x.l.qty, 0), free = Number(S.set.hantar_percuma_atas) || 0;
  const caj = !sub ? 0 : (free > 0 && sub >= free) ? 0 : (Number(S.set.caj_hantar) || 0);
  return { sub: sub, caj: caj, tot: sub + caj };
}

/* ── Kad produk ── */
function pcard(p, tag) {
  const w = S.wish.indexOf(p.id) >= 0;
  return '<article class="card pcard" data-act="open" data-id="' + p.id + '"><div class="pimg">' + pic(p, 420) +
    (tag ? '<span class="tag pill ' + (tag === 'Baru' ? 'new' : 'tint') + '">' + esc(tag) + '</span>' : '') +
    '<button class="wish ' + (w ? 'on' : '') + '" data-act="wish" data-id="' + p.id + '" aria-label="Kegemaran"><i class="bi bi-heart' + (w ? '-fill' : '') + '"></i></button></div>' +
    '<div><div class="cat">' + esc(p.kat) + '</div><div class="nm clamp2">' + esc(p.nama) + '</div></div>' +
    '<div class="flex jb ac"><div><div class="pr">' + rm(p.harga) + '</div>' + (p.asal > p.harga ? '<div class="old">' + rm(p.asal) + '</div>' : '') + '</div>' +
    '<button class="padd" data-act="quick" data-id="' + p.id + '" aria-label="Tambah ke troli"><i class="bi bi-plus"></i></button></div></article>';
}
const chipsHtml = cur => ['Semua'].concat(cats().map(c => c[0])).map(k => {
  const n = k === 'Semua' ? S.prods.length : (cats().find(c => c[0] === k) || [0, 0])[1];
  return '<button class="chip ' + (cur === k ? 'on' : '') + '" data-act="cat" data-k="' + esc(k) + '">' + esc(k) + (k === 'Semua' ? ' <small>' + n + '</small>' : ' <small>(' + n + ')</small>') + '</button>';
}).join('');

const R = {};   // penyalur render per paparan

/* ── Laman Utama ── */
R.home = function () {
  const s = S.set, all = S.prods;
  const baru = all.filter(isNew).sort((a, b) => a.tarikh < b.tarikh ? 1 : -1).slice(0, 6);
  const laris = all.slice().sort((a, b) => (b.terjual + (b.unggul ? 3 : 0)) - (a.terjual + (a.unggul ? 3 : 0))).slice(0, 4);
  const art = all.slice().sort((a, b) => a.tarikh < b.tarikh ? 1 : -1)[0];
  const soc = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['facebook', 'Facebook']].filter(x => s[x[0]]).map(x => '<a href="' + esc(s[x[0]]) + '" target="_blank" rel="noopener">' + x[1] + '</a>').join('');
  $('#v-home').innerHTML =
    '<div class="flex g8 ac mb16"><button class="search grow" data-act="goSearch"><i class="bi bi-search muted"></i><span class="muted">Cari karya kait idaman…</span></button><button class="ib" data-act="goSearch" aria-label="Penapis"><i class="bi bi-sliders"></i></button></div>' +
    '<div class="hero"><div class="grow flex col jc g8"><span class="pill tint" style="align-self:flex-start;background:var(--surface)"><i class="bi bi-stars"></i> EDISI TERHAD</span><h1>' + esc(s.hero_tajuk || 'Koleksi Crochet Terbaharu') + '</h1><p class="t2">' + esc(s.hero_sub || '') + '</p><button class="btn btn-p mt8" style="align-self:flex-start" data-act="go" data-v="catalog">Tempah Sekarang <i class="bi bi-arrow-right"></i></button></div>' +
    '<div class="art">' + (art ? pic(art, 400) : '') + '</div></div>' +
    '<div class="hscroll mt16">' + chipsHtml('Semua') + '</div>' +
    (baru.length ? '<div class="sec"><h2 class="h-m">Koleksi Baharu <span class="pill tint" style="margin-left:6px">' + baru.length + ' item</span></h2><button data-act="go" data-v="catalog">Lihat Semua <i class="bi bi-arrow-right"></i></button></div><div class="grid">' + baru.map(p => pcard(p, 'Baru')).join('') + '</div>' : '') +
    '<div class="sec"><h2 class="h-m">Paling Laris <i class="bi bi-fire" style="color:var(--accent)"></i></h2><button data-act="go" data-v="catalog">Semua Paling Laris <i class="bi bi-arrow-right"></i></button></div>' +
    (laris.length ? '<div class="grid">' + laris.map(p => pcard(p)).join('') + '</div>' : '<div class="card pad tc muted">Belum ada produk dipaparkan.</div>') +
    '<div class="card note-card mt24"><div class="ico"><i class="bi bi-hand-index-thumb"></i></div><div><div class="h-s">100% Buatan Tangan</div><p class="t2" style="font-size:13px">Setiap benang disulam rapi dan teliti untuk kualiti berkekalan.</p></div></div>' +
    '<div class="card pad mt16"><div class="flex jb ac"><div><div class="h-s">' + esc(s.nama_perniagaan) + '</div><div class="muted" style="font-size:12px">' + esc(s.alamat_perniagaan) + '</div></div><button class="pill tint" data-act="go" data-v="cart">Buka Tempahan</button></div>' +
    '<div class="kv" style="background:var(--input);border-radius:14px;padding:12px 14px;margin-top:12px"><span><i class="bi bi-chat-square-text pri"></i> ' + esc(s.telefon_paparan) + '</span><a class="eyebrow pri" href="' + esc(waLink(s.no_whatsapp)) + '" target="_blank" rel="noopener">WHATSAPP</a></div>' +
    (s.emel_admin ? '<div class="kv" style="background:var(--input);border-radius:14px;padding:12px 14px;margin-top:8px"><span><i class="bi bi-envelope pri"></i> ' + esc(s.emel_admin) + '</span><span class="eyebrow">EMEL</span></div>' : '') +
    (soc ? '<div class="social flex g8 jc wrap mt12">' + soc + '</div>' : '') +
    '<p class="tc muted mt16" style="font-size:12px">© ' + new Date().getFullYear() + ' ' + esc(s.nama_perniagaan) + '. Seni Kait Buatan Tangan Penuh Kasih.</p></div>';
};

/* ── Katalog (penapis/carian/susunan semuanya lokal) ── */
const SORTS = { baharu: 'Terbaharu', laris: 'Paling Laris', murah: 'Harga: Rendah ke Tinggi', mahal: 'Harga: Tinggi ke Rendah', nama: 'Nama A–Z' };
R.catalog = function (o) {
  if (o && o.q !== undefined) { S.q = o.q; }
  $('#v-catalog').innerHTML =
    '<div class="flex g12 ac mb12"><button class="ib" data-act="back" aria-label="Kembali"><i class="bi bi-arrow-left"></i></button><div class="grow"><h1 class="h-l">Katalog Produk</h1><div class="muted" id="catCount" style="font-size:13px"></div></div><span class="pill tint" style="height:32px"><i class="bi bi-flower1"></i> 100% Buatan Tangan</span></div>' +
    '<div class="search mb12"><i class="bi bi-search muted"></i><input id="catQ" type="search" placeholder="Cari beg, amigurumi, bunga…" value="' + esc(S.q) + '" data-in="catQ" autocomplete="off"></div>' +
    '<div class="flex jb ac g8 mb12"><select class="in" style="width:auto;min-height:40px;border-radius:999px;background:var(--surface)" data-in="sort" aria-label="Susunan">' + Object.keys(SORTS).map(k => '<option value="' + k + '"' + (S.sort === k ? ' selected' : '') + '>Susunan: ' + SORTS[k] + '</option>').join('') + '</select></div>' +
    '<div class="hscroll mb16" id="catChips"></div><div class="grid" id="catGrid"></div><div id="catMore" class="tc mt16"></div>' +
    '<div class="card note-card mt24"><div class="ico"><i class="bi bi-palette"></i></div><div class="grow"><div class="h-s">Mahu tempahan khas?</div><p class="t2" style="font-size:13px">Kustom benang, warna atau saiz anda.</p></div><button class="btn btn-a btn-s" data-act="custom">Kustom</button></div>';
  updCatalog();
};
function filtered() {
  const q = S.q.trim().toLowerCase();
  let L = S.prods.filter(p => (S.cat === 'Semua' || p.kat === S.cat) && (!q || (p.nama + ' ' + p.kat + ' ' + p.desc + ' ' + p.sku).toLowerCase().indexOf(q) >= 0));
  const by = { baharu: (a, b) => a.tarikh < b.tarikh ? 1 : -1, laris: (a, b) => b.terjual - a.terjual, murah: (a, b) => a.harga - b.harga, mahal: (a, b) => b.harga - a.harga, nama: (a, b) => a.nama.localeCompare(b.nama) };
  return L.sort(by[S.sort] || by.baharu);
}
function updCatalog() {
  const L = filtered(), v = L.slice(0, S.shown);
  $('#catChips').innerHTML = chipsHtml(S.cat);
  $('#catCount').textContent = L.length + ' daripada ' + S.prods.length + ' kraf tersedia';
  $('#catGrid').innerHTML = v.length ? v.map(p => pcard(p, isNew(p) ? 'Baru' : (p.unggul ? 'Kraf Tangan' : ''))).join('') : '<div class="card pad tc muted" style="grid-column:1/-1">Tiada produk dijumpai. Cuba kata kunci lain.</div>';
  $('#catMore').innerHTML = L.length > v.length ? '<button class="btn btn-w" data-act="more"><i class="bi bi-plus"></i> Muat Lebih Banyak Produk</button><p class="muted mt8" style="font-size:12px">Menunjukkan ' + v.length + ' daripada ' + L.length + ' item</p>' : '';
}

/* ── Butiran produk ── */
R.product = function (o) {
  if (o && o.id) { S.pid = o.id; S.qty = 1; S.note = ''; }
  const p = P(S.pid); if (!p) { go('catalog'); return; }
  const imgs = p.img.length ? p.img : [null], w = S.wish.indexOf(p.id) >= 0;
  const rel = S.prods.filter(x => x.id !== p.id).sort((a, b) => (b.kat === p.kat) - (a.kat === p.kat)).slice(0, 6);
  $('#v-product').innerHTML =
    '<div class="flex jb ac mb12"><button class="ib" data-act="back" aria-label="Kembali"><i class="bi bi-arrow-left"></i></button><h2 class="h-s">Perincian Produk</h2><button class="ib" data-act="wish" data-id="' + p.id + '" aria-label="Kegemaran"><i class="bi bi-heart' + (w ? '-fill' : '') + '" style="' + (w ? 'color:#e5484d' : '') + '"></i></button></div>' +
    '<div class="gallery"><div class="gal-track" id="galT">' + imgs.map(u => '<div>' + (u ? '<img src="' + esc(imgUrl(u, 900)) + '" alt="' + esc(p.nama) + '" decoding="async" referrerpolicy="no-referrer">' : ph(p)) + '</div>').join('') + '</div>' +
    (imgs.length > 1 ? '<button class="gal-nav" style="left:16px" data-act="gal" data-d="-1" aria-label="Sebelum"><i class="bi bi-chevron-left"></i></button><button class="gal-nav" style="right:16px" data-act="gal" data-d="1" aria-label="Seterusnya"><i class="bi bi-chevron-right"></i></button><div class="dots" id="galD">' + imgs.map((_, i) => '<i class="' + (i ? '' : 'on') + '"></i>').join('') + '</div>' : '') +
    '<span class="pill" style="position:absolute;left:20px;top:20px;background:rgba(255,255,255,.92);color:var(--primary-dark)">100% Buatan Tangan</span></div>' +
    '<div class="flex jb ac mt16"><span class="eyebrow pri">' + esc(p.kat) + '</span><span class="eyebrow">SKU: <b style="color:var(--text)">' + esc(p.sku) + '</b></span></div>' +
    '<h1 class="h-l mt8">' + esc(p.nama) + '</h1>' +
    '<div class="flex ac g12 mt8"><span style="font:800 32px/36px var(--f-head);color:var(--primary)">' + rm(p.harga) + '</span>' + (p.asal > p.harga ? '<span class="muted" style="text-decoration:line-through">' + rm(p.asal) + '</span>' : '') + (p.terjual ? '<span class="pill tint" style="margin-left:auto">' + p.terjual + ' terjual</span>' : '') + '</div>' +
    '<div class="stock mt12"><i class="bi bi-check-circle"></i> Ada Stok • Buatan Khas / Made to Order (' + esc(p.masa || '3-5 hari') + ')</div>' +
    '<div class="card pad mt16"><div class="flex jb ac mb8"><h3 class="h-s"><i class="bi bi-stars pri"></i> Gambaran Keseluruhan Produk</h3><span class="eyebrow pri">Kraftangan Asli</span></div><p class="t2" style="font-size:15px;line-height:24px">' + esc(p.desc || 'Dihasilkan dengan penuh kasih sayang.') + '</p>' +
    (p.saiz ? '<div class="spec"><span><i class="bi bi-rulers"></i> Saiz</span><b>' + esc(p.saiz) + '</b></div>' : '') + (p.bahan ? '<div class="spec"><span><i class="bi bi-layers"></i> Bahan</span><b>' + esc(p.bahan) + '</b></div>' : '') + (p.jaga ? '<div class="spec"><span><i class="bi bi-droplet"></i> Penjagaan</span><b>' + esc(p.jaga) + '</b></div>' : '') + '</div>' +
    '<div class="card pad mt16 flex jb ac"><div><div class="h-s">Kuantiti</div><div class="muted" style="font-size:12px">Maksimum 5 unit per pesanan</div></div><div class="stepper"><button data-act="pq" data-d="-1" aria-label="Kurang"><i class="bi bi-dash"></i></button><b id="pqty">1</b><button class="add" data-act="pq" data-d="1" aria-label="Tambah"><i class="bi bi-plus"></i></button></div></div>' +
    (p.kustom ? '<div class="card pad mt16"><div class="flex jb ac mb8"><h3 class="h-s">Pilihan Warna / Permintaan Khas <span class="muted fw6">(Pilihan)</span></h3><i class="bi bi-palette pri"></i></div><p class="muted mb8" style="font-size:12px">Ingin warna kustom, kelopak bunga atau sulaman inisial nama? Nyatakan di bawah.</p><textarea class="in" data-in="pnote" maxlength="200" placeholder="Contoh: Mahu tona warna kelopak kuning pastel atau sulaman nama \'Aisyah\'…"></textarea></div>' : '') +
    (rel.length ? '<div class="sec"><h2 class="h-m">Anda Mungkin Juga Suka</h2><button data-act="go" data-v="catalog">Lihat Semua <i class="bi bi-chevron-right"></i></button></div><div class="hscroll">' + rel.map(x => '<div style="flex:0 0 160px">' + pcard(x) + '</div>').join('') + '</div>' : '');
  const t = $('#galT'); if (t) { t.addEventListener('scroll', () => { const i = Math.round(t.scrollLeft / t.clientWidth); $$('#galD i').forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true }); }
};

/* ── Bar melekit (CTA) ikut paparan ── */
function renderSticky() {
  const b = $('#stickyBar'); let h = '';
  if (S.view === 'product' && P(S.pid)) h = '<button class="btn btn-p btn-l" data-act="addDetail"><i class="bi bi-bag-plus"></i><span class="grow tc" style="text-align:left">Tambah ke Pesanan</span><span id="pTot">' + rm(P(S.pid).harga * S.qty) + '</span> <i class="bi bi-arrow-right"></i></button>';
  else if (S.view === 'cart' && cartLines().length) h = '<button class="btn btn-p btn-l" data-act="submit" id="subBtn">Hantar Tempahan • <span id="subTot">' + rm(cartTotals().tot) + '</span> <i class="bi bi-arrow-right"></i></button>';
  b.innerHTML = h; b.hidden = !h;
}

/* ── Troli & borang tempahan ── */
R.cart = function () {
  const f = S.form, ok = /^(\+?60|0)1\d{8,9}$/.test(String(f.telefon).replace(/[\s-]/g, ''));
  $('#v-cart').innerHTML =
    '<div class="flex jb ac mb8"><div><h1 class="h-d" style="font-size:30px">Pesanan Saya <span class="pill tint" id="cCount" style="vertical-align:middle"></span></h1><p class="muted" style="font-size:13px">Sahkan barang kaitan tangan &amp; isi maklumat penghantaran.</p></div></div>' +
    '<div id="cartItems"></div>' +
    '<div class="banner mt16"><i class="bi bi-leaf"></i><span>Setiap barangan disulam kemas dengan benang susu berkualiti tinggi dan dibungkus rapi bersama kad terima kasih khas.</span></div>' +
    '<div class="card pad mt16" id="cartForm"><h3 class="h-m mb8"><i class="bi bi-truck pri"></i> Maklumat Penghantaran &amp; Pembeli</h3><p class="muted mb12" style="font-size:13px">Tempahan pantas tanpa perlu daftar akaun</p>' +
    '<input type="text" data-in="f_hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">' +
    '<div class="field"><label for="f_nama">Nama Penuh <span class="pri">*</span></label><input class="in" id="f_nama" data-in="f_nama" autocomplete="name" placeholder="cth: Siti Nurhaliza" value="' + esc(f.nama) + '" maxlength="80"><div class="err" id="e_nama"></div></div>' +
    '<div class="field"><label for="f_tel">Nombor Telefon <span class="pri">*</span></label><div class="in-wrap"><input class="in" id="f_tel" data-in="f_telefon" type="tel" inputmode="tel" autocomplete="tel" placeholder="012-3456789" value="' + esc(f.telefon) + '"><i class="bi bi-check-circle" id="telOk"' + (ok ? '' : ' hidden') + '></i></div><div class="hint">Digunakan oleh kurier dan resit status WhatsApp</div><div class="err" id="e_telefon"></div></div>' +
    '<div class="field"><label for="f_alamat">Alamat Lengkap Penghantaran <span class="pri">*</span></label><textarea class="in" id="f_alamat" data-in="f_alamat" autocomplete="street-address" placeholder="Alamat lengkap penghantaran (Pos Laju / J&amp;T)" maxlength="300">' + esc(f.alamat) + '</textarea><div class="err" id="e_alamat"></div></div>' +
    '<div class="field"><label for="f_emel">Emel <span class="opt">Pilihan</span></label><input class="in" id="f_emel" data-in="f_emel" type="email" autocomplete="email" placeholder="siti@gmail.com (untuk salinan invois)" value="' + esc(f.emel) + '"><div class="err" id="e_emel"></div></div>' +
    '<div class="field"><label for="f_nota">Nota Khas untuk Bigz <span class="opt">Pilihan</span></label><textarea class="in" id="f_nota" data-in="f_nota" maxlength="300" placeholder="Cth: Tolong letak wish card ucapan Selamat Hari Lahir untuk Ain!">' + esc(f.nota) + '</textarea></div>' +
    '<label class="check"><input type="checkbox" data-in="f_setuju"' + (f.setuju ? ' checked' : '') + '><span>Saya bersetuju menerima hebahan produk &amp; diskaun baharu melalui WhatsApp/Emel.</span></label></div>' +
    '<div class="card pad mt16" id="cartSum"></div>' +
    '<p class="muted tc mt12" style="font-size:12px"><i class="bi bi-shield-check"></i> Maklumat anda dilindungi &amp; dihantar terus ke sistem ' + esc(S.set.nama_perniagaan) + '</p>';
  updCart();
};
function updCart() {
  const L = cartLines(), t = cartTotals();
  const n = L.reduce((a, x) => a + x.l.qty, 0);
  const cc = $('#cCount'); if (cc) cc.textContent = L.length + ' item';
  const ci = $('#cartItems'); if (!ci) return;
  ci.innerHTML = L.length ? L.map((x, i) => '<div class="card citem mb12"><div class="th">' + pic(x.p, 200) + '</div><div class="grow flex col jb"><div class="flex jb g8"><div class="h-s clamp2">' + esc(x.p.nama) + '</div><button data-act="cdel" data-i="' + S.cart.indexOf(x.l) + '" aria-label="Buang" class="muted"><i class="bi bi-trash"></i></button></div>' + (x.l.note ? '<span class="pill new" style="align-self:flex-start;height:auto;padding:3px 10px;white-space:normal">' + esc(x.l.note).slice(0, 60) + '</span>' : '') + '<div class="flex jb ac"><b style="font:800 18px var(--f-head);color:var(--primary-dark)">' + rm(x.p.harga) + '</b><div class="stepper"><button data-act="cq" data-i="' + S.cart.indexOf(x.l) + '" data-d="-1" aria-label="Kurang"><i class="bi bi-dash"></i></button><b>' + x.l.qty + '</b><button data-act="cq" data-i="' + S.cart.indexOf(x.l) + '" data-d="1" aria-label="Tambah"><i class="bi bi-plus"></i></button></div></div></div></div>').join('') :
    '<div class="card pad tc mt16"><div class="ok-ring" style="background:var(--input)"><i class="bi bi-bag" style="background:var(--text3)"></i></div><h3 class="h-m">Troli anda masih kosong</h3><p class="muted mb12">Pilih kraf kaitan tangan kegemaran anda.</p><button class="btn btn-p" data-act="go" data-v="catalog">Layari Katalog</button></div>';
  const sm = $('#cartSum'); if (sm) sm.innerHTML = '<h3 class="h-m mb8"><i class="bi bi-receipt pri"></i> Ringkasan Tempahan</h3><div class="sum-row"><span>Subtotal (' + L.length + ' produk)</span><b>' + rm(t.sub) + '</b></div><div class="sum-row"><span>Caj Penghantaran <span class="pill tint" style="margin-left:6px">Semenanjung</span></span><b>' + (t.caj ? rm(t.caj) : 'PERCUMA') + '</b></div><hr style="border:0;border-top:1px solid var(--border);margin:8px 0"><div class="sum-row"><div><div class="h-s">Jumlah Keseluruhan</div><div class="muted" style="font-size:12px">Termasuk caj kurier berdaftar</div></div><span class="sum-tot">' + rm(t.tot) + '</span></div>';
  const st = $('#subTot'); if (st) st.textContent = rm(t.tot);
  updBadge(); renderSticky();
}
const saveForm = debounce(() => store.set('bz_form', S.form), 400);   // autosave draf borang

function validateForm() {
  const f = S.form, e = {};
  if (String(f.nama).trim().length < 2) e.nama = 'Sila isi nama penuh.';
  if (!/^(\+?60|0)1\d{8,9}$/.test(String(f.telefon).replace(/[\s-]/g, ''))) e.telefon = 'Format telefon tidak sah (cth: 012-3456789).';
  if (String(f.alamat).trim().length < 10) e.alamat = 'Sila isi alamat lengkap penghantaran.';
  if (f.emel && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.emel)) e.emel = 'Format emel tidak sah.';
  ['nama', 'telefon', 'alamat', 'emel'].forEach(k => { const el = $('#e_' + k); if (el) el.textContent = e[k] || ''; const i = $(k === 'telefon' ? '#f_tel' : '#f_' + k); if (i) i.classList.toggle('bad', !!e[k]); });
  return e;
}
function submitOrder() {
  if (S.busy) return;
  if (!cartLines().length) { toast('Sila tambah sekurang-kurangnya satu item.', 'err'); return; }
  const e = validateForm(), k = Object.keys(e);
  if (k.length) { toast(e[k[0]], 'err'); const el = $(k[0] === 'telefon' ? '#f_tel' : '#f_' + k[0]); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus(); } return; }
  S.busy = true; const btn = $('#subBtn'); busy(btn, true, 'Menghantar tempahan…');
  const f = S.form, items = cartLines().map(x => ({ id: x.p.id, qty: x.l.qty, nota: x.l.note }));
  pub('submitOrder', { nama: f.nama, telefon: f.telefon, alamat: f.alamat, emel: f.emel, nota: f.nota, setuju: !!f.setuju, items: items, kaedah: 'FPX / Pindahan Bank', hp: f.hp || '' }).then(r => {
    S.busy = false; S.last = r; store.set('bz_last', r);
    S.cart = []; saveCart(); store.set('bz_form', Object.assign({}, S.form, { nota: '' })); S.form.nota = '';
    S.payTab = 'bank'; go('status', { fresh: true });
    toast('Tempahan ' + r.order.id + ' berjaya diterima!');
    if (r.pay && r.pay.wa) { try { openExt(waLink(r.pay.wa, waOrderMsg(r.order, false))); } catch (x) { } }   // PRD F-04 (boleh disekat pelayar — butang tersedia di skrin)
  }).catch(err => { S.busy = false; busy($('#subBtn'), false); toast(err.message, 'err'); });
}
function waOrderMsg(o, proof) {
  const lines = o.items.map(i => '• ' + i.nama + ' x' + i.qty + (i.nota ? ' (' + i.nota + ')' : '')).join('\n');
  return proof ? 'Hai ' + (S.set.nama_perniagaan || 'Bigz') + ', saya ' + o.nama + '. Ini bukti bayaran untuk tempahan ' + o.id + ' (' + rm(o.jumlah) + '). Terima kasih!' :
    'Hai ' + (S.set.nama_perniagaan || 'Bigz') + ', saya ' + o.nama + '. Saya baru membuat tempahan ' + o.id + ':\n' + lines + '\nJumlah: ' + rm(o.jumlah) + '\nTelefon: ' + o.tel;
}

/* ── Status & pembayaran ── */
R.status = function () {
  const L = S.last; if (!L) { $('#v-status').innerHTML = '<div class="card pad tc mt16"><h3 class="h-m">Tiada tempahan terkini</h3><p class="muted mb12">Semak tempahan melalui menu Bantuan.</p><button class="btn btn-p" data-act="go" data-v="catalog">Layari Katalog</button></div>'; return; }
  const o = L.order, p = L.pay || {};
  const bank = '<div class="kv"><span class="k">BANK PENERIMA</span><span class="pill st-menunggu">' + esc(p.bank) + '</span></div><div class="kv"><span class="k">NAMA AKAUN</span><b>' + esc(p.akaunNama) + '</b></div><div class="card pad-s" style="background:var(--primary-tint);box-shadow:none"><div class="k eyebrow">NOMBOR AKAUN BANK</div><div class="flex jb ac mt8"><b style="font:800 24px var(--f-head);letter-spacing:.02em">' + esc(p.noAkaun || '—') + '</b><button class="btn btn-t btn-s" data-act="copy" data-t="' + esc(String(p.noAkaun || '').replace(/\s/g, '')) + '"><i class="bi bi-copy"></i> Salin No Akaun</button></div></div>' +
    '<div class="banner info mt12"><i class="bi bi-info-circle"></i><span><b>Rujukan Wajib:</b> Masukkan rujukan <b>' + esc(o.id) + '</b> semasa transaksi pindahan bank.</span></div>';
  const qr = p.qr ? '<div class="tc pad"><img src="' + esc(imgUrl(p.qr, 600)) + '" alt="Kod QR DuitNow" style="max-width:260px;margin:auto;border-radius:16px" referrerpolicy="no-referrer"><p class="muted mt8">Imbas dengan aplikasi bank anda dan masukkan rujukan <b>' + esc(o.id) + '</b>.</p></div>' : '<div class="banner warn mt12"><i class="bi bi-qr-code"></i><span>Kod QR belum ditetapkan. Sila guna pindahan bank atau hubungi kami di WhatsApp.</span></div>';
  $('#v-status').innerHTML =
    '<div class="tc"><div class="ok-ring"><i class="bi bi-check-lg"></i></div><h1 class="h-l">Tempahan Berjaya Diterima!</h1><p class="t2 mt8">Terima kasih kerana menyokong seni kait tangan eksklusif ' + esc(S.set.nama_perniagaan) + '.</p>' +
    '<div class="flex g8 jc wrap mt12"><button class="chip" data-act="copy" data-t="' + esc(o.id) + '">' + esc(o.id) + ' <i class="bi bi-copy"></i></button><span class="chip"><i class="bi bi-calendar3"></i> ' + fD(o.tarikh) + '</span></div><div class="mt12">' + chipSt(o.status) + '</div></div>' +
    '<div class="card pad mt16"><div class="flex jb ac mb12"><h3 class="h-m"><i class="bi bi-bag-check pri"></i> Ringkasan Pesanan</h3><span class="muted">' + o.items.length + ' Barangan</span></div>' +
    o.items.map(i => '<div class="flex jb g12 pad-s solid mb8" style="border-radius:16px"><div class="grow"><div class="h-s">' + esc(i.nama) + '</div><div class="muted" style="font-size:12px">Kuantiti: ' + i.qty + (i.nota ? ' · ' + esc(i.nota) : '') + '</div></div><b>' + rm(i.harga * i.qty) + '</b></div>').join('') +
    '<div class="flex jb ac pad-s mt8" style="background:var(--primary-tint);border-radius:16px"><div><div class="eyebrow pri">JUMLAH PERLU DIBAYAR</div><div class="muted" style="font-size:12px">' + (o.caj ? 'Termasuk penghantaran ' + rm(o.caj) : 'Penghantaran percuma') + '</div></div><span class="sum-tot">' + rm(o.jumlah) + '</span></div></div>' +
    '<div class="card pad mt16"><h3 class="h-m mb12"><i class="bi bi-wallet2" style="color:var(--accent)"></i> Arahan Pembayaran</h3><div class="seg mb12"><button class="' + (S.payTab === 'bank' ? 'on' : '') + '" data-act="payTab" data-k="bank">FPX / Pindahan Bank</button><button class="' + (S.payTab === 'qr' ? 'on' : '') + '" data-act="payTab" data-k="qr">DuitNow QR</button></div>' + (S.payTab === 'bank' ? bank : qr) + '</div>' +
    '<div class="banner warn mt16"><i class="bi bi-stopwatch"></i><span>Sila buat bayaran dalam tempoh <b>' + esc(p.jam || 24) + ' jam</b> untuk memastikan tempahan anda mula diproses dan dikait oleh ' + esc(S.set.nama_perniagaan) + '.</span></div>' +
    '<a class="btn btn-p btn-l mt16" target="_blank" rel="noopener" href="' + esc(waLink(p.wa, waOrderMsg(o, true))) + '"><i class="bi bi-whatsapp"></i> Hantar Bukti Bayaran ke WhatsApp <i class="bi bi-arrow-right"></i></a>' +
    '<a class="btn btn-t btn-l mt8" target="_blank" rel="noopener" href="' + esc(waLink(p.wa, waOrderMsg(o, false))) + '"><i class="bi bi-chat-dots"></i> Hantar Butiran Tempahan ke WhatsApp</a>' +
    '<button class="btn btn-w btn-l mt8" data-act="go" data-v="catalog"><i class="bi bi-shop"></i> Kembali ke Katalog</button>';
};

/* ── Bantuan: FAQ, hubungi, semak tempahan ── */
R.help = function () {
  const s = S.set, faq = [
    ['Bagaimana cara membuat tempahan?', 'Pilih produk, tambah ke troli, isi nama, telefon dan alamat, kemudian tekan Hantar Tempahan. Tiada akaun diperlukan.'],
    ['Bagaimana cara membayar?', 'Selepas tempahan dihantar, anda akan melihat arahan pindahan bank (FPX) atau kod QR DuitNow. Hantar bukti bayaran melalui WhatsApp.'],
    ['Berapa lama tempoh siap?', 'Setiap kraf dibuat khas. Tempoh biasa 3–5 hari bekerja selepas bayaran disahkan, bergantung kepada produk.'],
    ['Boleh tempah warna atau saiz khas?', 'Boleh. Nyatakan permintaan anda dalam ruangan "Pilihan Warna / Permintaan Khas" pada halaman produk atau hubungi kami melalui WhatsApp.'],
    ['Bagaimana penghantaran dibuat?', 'Kami menghantar melalui Pos Laju / J&T Express. Nombor penjejakan akan dihantar melalui WhatsApp.']];
  $('#v-help').innerHTML =
    '<h1 class="h-l mb12">Bantuan</h1>' +
    '<div class="card pad"><h3 class="h-m mb8"><i class="bi bi-search pri"></i> Semak Status Tempahan</h3><div class="field"><label for="t_id">ID Tempahan</label><input class="in" id="t_id" placeholder="cth: BZ-ORD-0012" style="text-transform:uppercase"></div><div class="field"><label for="t_tel">Nombor Telefon</label><input class="in" id="t_tel" type="tel" placeholder="012-3456789"></div><button class="btn btn-p btn-l" data-act="track">Semak Tempahan</button></div>' +
    '<div class="card pad mt16"><h3 class="h-m mb8">Soalan Lazim</h3>' + faq.map(f => '<div class="acc"><button data-act="acc">' + esc(f[0]) + '<i class="bi bi-chevron-down"></i></button><div class="ans">' + esc(f[1]) + '</div></div>').join('') + '</div>' +
    '<div class="card pad mt16"><h3 class="h-m mb12">Hubungi Kami</h3><a class="btn btn-p btn-l" target="_blank" rel="noopener" href="' + esc(waLink(s.no_whatsapp, 'Hai, saya ada pertanyaan.')) + '"><i class="bi bi-whatsapp"></i> WhatsApp ' + esc(s.telefon_paparan) + '</a>' + (s.emel_admin ? '<a class="btn btn-w btn-l mt8" href="mailto:' + esc(s.emel_admin) + '"><i class="bi bi-envelope"></i> ' + esc(s.emel_admin) + '</a>' : '') + '</div>' +
    '<div class="card pad mt16 flex jb ac"><div><div class="h-s">Mod Gelap</div><div class="muted" style="font-size:12px">Selesa untuk mata pada waktu malam</div></div><button class="toggle ' + (document.documentElement.dataset.theme === 'dark' ? 'on' : '') + '" data-act="dark" aria-label="Mod gelap"></button></div>';
};
