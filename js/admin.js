'use strict';

/* ══════════════ ADMIN ══════════════ */
const D = () => S.A.d;
const NAV = [['dash', 'Dashboard', 'speedometer2'], ['orders', 'Orders', 'bag'], ['products', 'Products', 'box-seam'], ['cust', 'Customers & Broadcast', 'megaphone'], ['reports', 'Reports', 'bar-chart'], ['settings', 'Settings', 'gear']];
const NAVOF = { dash: 'dash', orders: 'orders', order: 'orders', products: 'products', pform: 'products', cust: 'cust', reports: 'reports', settings: 'settings' };
const TITLE = { dash: 'Dashboard', orders: 'Pengurusan Tempahan', order: 'Butiran Tempahan', products: 'Pengurusan Produk', pform: 'Produk', cust: 'Pelanggan & Hebahan', reports: 'Laporan Jualan', settings: 'Tetapan & Jenama' };
const ARV = {};
const idleMs = () => Math.max(5, Number((D() && D().settings.sesi_minit)) || 30) * 60000;

function showLogin(err) {
  mode('login'); const s = S.set, u = store.get('bz_user', '');
  $('#login').innerHTML = '<div class="login-card"><div class="logo-ring">' + (s.logo_url ? '<img src="' + esc(imgUrl(s.logo_url, 200)) + '" alt="" referrerpolicy="no-referrer">' : '<i class="bi bi-flower1"></i>') + '</div>' +
    '<div class="tc"><span class="pill tint" style="height:30px;font-size:12px;letter-spacing:.12em">ATELIER HANDMADE</span><div class="h-s mt8">' + esc(s.nama_perniagaan) + '</div><h1 class="h-m mt16">Log Masuk Admin</h1><p class="t2 mt8" style="font-size:14px">Akses sistem pengurusan &amp; pesanan ' + esc(s.nama_perniagaan) + '</p></div>' +
    '<div class="banner err mt16" id="lErr" ' + (err ? '' : 'hidden') + '><i class="bi bi-exclamation-triangle"></i><span class="grow">' + esc(err || '') + '</span></div>' +
    '<form id="loginForm" class="mt16" autocomplete="on"><div class="field"><label for="l_u">Emel atau Nama Pengguna</label><div class="in-wrap"><input class="in" id="l_u" name="username" autocomplete="username" value="' + esc(u) + '" required style="padding-left:14px"></div></div>' +
    '<div class="field"><label for="l_p">Kata Laluan</label><div class="in-wrap"><input class="in" id="l_p" name="password" type="password" autocomplete="current-password" required><button type="button" data-act="eye" class="muted" style="position:absolute;right:12px;top:50%;transform:translateY(-50%)" aria-label="Papar kata laluan"><i class="bi bi-eye"></i></button></div></div>' +
    '<div class="flex jb ac mb16"><label class="check ac"><input type="checkbox" id="l_r"' + (u ? ' checked' : '') + '><span style="font-size:14px">Ingat saya</span></label><button type="button" class="fw7 pri" data-act="forgot">Lupa kata laluan?</button></div>' +
    '<button class="btn btn-p btn-l" type="submit" id="lBtn">Log Masuk Admin <i class="bi bi-arrow-right"></i></button></form>' +
    '<div class="flex ac g12 mt16 muted" style="font-size:12px;font-weight:700"><hr style="flex:1;border:0;border-top:1px solid var(--border)">ATAU<hr style="flex:1;border:0;border-top:1px solid var(--border)"></div>' +
    '<button class="btn btn-t btn-l mt16" data-act="toShop"><i class="bi bi-shop"></i> Kembali ke Kedai / Back to Storefront</button>' +
    '<p class="tc muted mt16" style="font-size:12px">© ' + new Date().getFullYear() + ' ' + esc(s.nama_perniagaan) + '</p></div>';
}
function doLogin() {
  const u = $('#l_u').value.trim(), p = $('#l_p').value, btn = $('#lBtn');
  if (!u || !p) return;
  busy(btn, true, 'Memeriksa…');
  pub('login', { user: u, pass: p }).then(r => {
    S.A.tok = r.token; sess.set('bz_tok', r.token); S.A.d = r.boot;
    if ($('#l_r').checked) store.set('bz_user', u); else store.del('bz_user');
    enterAdmin(true);
  }).catch(e => { busy(btn, false); const b = $('#lErr'); b.hidden = false; b.querySelector('span').textContent = e.message; $('#l_p').value = ''; });
}
function adminEntry() {
  if (S.A.d && S.A.tok) { enterAdmin(); return; }
  if (S.A.tok) { toast('Memulihkan sesi…'); adm('bootstrap').then(d => { S.A.d = d; enterAdmin(); }).catch(() => showLogin()); return; }
  showLogin();
}
function adminLogout(expired) {
  if (S.A.tok && !expired) { callApi('logout', {}, S.A.tok).catch(() => { }); }
  S.A.tok = null; S.A.d = null; sess.del('bz_tok'); clearInterval(S.A.timer);
  Object.keys(CH).forEach(k => { try { CH[k].destroy(); } catch (e) { } delete CH[k]; });
  if (expired) showLogin('Sesi tamat kerana tidak aktif. Sila log masuk semula.'); else go('home');
}
function enterAdmin(first) {
  mode('adm'); syncPublic(); renderShell();
  aGo(S.A.view || 'dash'); startIdle();
  if (first && D().mustChange) modal('<div class="mh"><h3 class="h-m"><i class="bi bi-shield-lock pri"></i> Tukar kata laluan awal</h3></div><p class="t2">Kata laluan awal anda dijana oleh sistem dan tercatat dalam log setup. Sila tukar kepada kata laluan baharu sekarang.</p><div class="mf"><button class="btn btn-w" data-act="modalClose">Nanti</button><button class="btn btn-p" data-act="toSecurity">Tukar Sekarang</button></div>');
}
function syncPublic() {   // cermin produk aktif admin → katalog pelanggan (tanpa panggilan server)
  const old = {}; S.prods.forEach(p => { old[p.id] = p.terjual; });
  S.prods = D().products.filter(p => p.status === 'Aktif').map(p => Object.assign({}, p, { terjual: old[p.id] || 0 }));
  const st = D().settings; S.set = Object.assign({}, S.set, st);
}
function startIdle() {
  clearInterval(S.A.timer); S.A.last = nowMs(); S.A.pinged = nowMs();
  if (!S.A.wired) { S.A.wired = true; ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { S.A.last = nowMs(); }, { passive: true })); }
  S.A.timer = setInterval(() => {
    if (!S.A.tok) return;
    if (nowMs() - S.A.last > idleMs()) { adminLogout(true); return; }
    if (S.A.last > S.A.pinged && nowMs() - S.A.pinged > 240000) { S.A.pinged = nowMs(); callApi('ping', {}, S.A.tok).catch(() => { }); }
  }, 20000);
}
function renderShell() {
  const d = D(), s = d.settings, pend = d.orders.filter(o => o.status === 'Menunggu Bayaran').length;
  $('#aSide').innerHTML = '<div class="flex ac g12 pad-s mb8"><div class="logo-ring" style="width:44px;height:44px;margin:0;font-size:20px;border-width:2px">' + (s.logo_url ? '<img src="' + esc(imgUrl(s.logo_url, 100)) + '" alt="" referrerpolicy="no-referrer">' : '<i class="bi bi-archive"></i>') + '</div><div><div class="h-s ell" style="max-width:150px">' + esc(s.nama_perniagaan) + '</div><div class="eyebrow pri">ADMIN ATELIER</div></div></div>' +
    NAV.map(n => '<button class="a-nav" data-act="aGo" data-v="' + n[0] + '" data-nv="' + n[0] + '"><i class="bi bi-' + n[2] + '"></i><span>' + n[1] + '</span>' + (n[0] === 'orders' && pend ? '<span class="cnt2">' + pend + ' Baru</span>' : '') + '</button>').join('') +
    '<div style="flex:1"></div><button class="btn btn-t btn-l" data-act="toShop"><i class="bi bi-shop"></i> View Storefront</button><button class="btn btn-l" style="color:#c0262d" data-act="logout"><i class="bi bi-box-arrow-left"></i> Logout</button>';
  $('#aTop').innerHTML = '<button class="ib sm menu" data-act="sideOpen" aria-label="Menu"><i class="bi bi-list"></i></button><div class="grow muted" id="crumb"></div>' +
    '<button class="ib sm" data-act="dark" aria-label="Tema"><i class="bi bi-moon-stars"></i></button><button class="ib sm" data-act="aGo" data-v="orders" aria-label="Notifikasi"><i class="bi bi-bell"></i>' + (pend ? '<b class="cnt" style="width:10px;min-width:10px;height:10px;padding:0"></b>' : '') + '</button>' +
    '<div class="card flex ac g8" style="padding:4px 12px 4px 4px;border-radius:999px"><span class="avatar" style="width:32px;height:32px;box-shadow:none;background:var(--primary);color:#fff"><i class="bi bi-person"></i></span><span class="hide-s" style="line-height:14px"><b style="font-size:13px">Bigz (Admin)</b><br><span class="muted" style="font-size:11px">Atelier Lead</span></span></div>';
}
function aGo(v, arg) {
  if (!D()) { showLogin(); return; }
  S.A.view = v; const f = ARV[v]; if (f) f(arg);
  Object.keys(NAVOF).forEach(k => { const e = $('#a-' + k); if (e) e.classList.toggle('active', k === v); });
  $$('#aSide .a-nav').forEach(b => b.classList.toggle('on', b.dataset.nv === NAVOF[v]));
  $('#crumb').innerHTML = 'Admin &rsaquo; <b class="pri">' + esc(TITLE[v]) + '</b>';
  $('#aSide').classList.remove('open'); $('.a-scrim').classList.remove('on'); window.scrollTo(0, 0);
}
const aRender = () => { if (D()) { renderShell(); const v = S.A.view; ARV[v] && ARV[v](S.A.keep); $('#aSide').classList.remove('open'); $$('#aSide .a-nav').forEach(b => b.classList.toggle('on', b.dataset.nv === NAVOF[v])); $('#crumb').innerHTML = 'Admin &rsaquo; <b class="pri">' + esc(TITLE[v]) + '</b>'; } };
function aRefresh(btn) {
  busy(btn, true, ''); adm('bootstrap').then(d => { S.A.d = d; syncPublic(); aRender(); toast('Data dikemas kini'); }).catch(e => { busy(btn, false); toast(e.message, 'err'); });
}

/* ── Pengiraan ── */
const inM = (o, y, m) => { const d = pd(o.tarikh); return d && d.getFullYear() === y && d.getMonth() === m; };
const paidSum = a => a.filter(o => PAID.indexOf(o.status) >= 0).reduce((s, o) => s + o.jumlah, 0);
const pctTxt = (a, b) => b > 0 ? ((a - b) / b * 100) : null;
const arrow = p => p === null ? '' : '<span class="pill ' + (p >= 0 ? 'st-dibayar' : 'st-batal') + '"><i class="bi bi-arrow-' + (p >= 0 ? 'up' : 'down') + '"></i> ' + (p >= 0 ? '+' : '') + p.toFixed(1) + '%</span>';
const kpi = (lbl, ico, bg, fg, val, sub) => '<div class="card kpi"><div class="flex jb ac"><span class="muted">' + lbl + '</span><span class="ic" style="background:' + bg + ';color:' + fg + '"><i class="bi bi-' + ico + '"></i></span></div><div class="v">' + val + '</div>' + sub + '</div>';
const pageHead = (eye, title, sub, btns) => '<div class="page-h"><div><div class="eyebrow pri"><i class="bi bi-dot"></i>' + eye + '</div><h1 class="h-d">' + title + '</h1><p class="muted mt8">' + sub + '</p></div><div class="flex g8 wrap">' + (btns || '') + '</div></div>';

/* ── Carta (Chart.js dimuat malas selepas log masuk) ── */
let _chartP = null; const CH = {};
function loadChart() {
  if (window.Chart) return Promise.resolve(); if (_chartP) return _chartP;
  _chartP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'; s.onload = res; s.onerror = () => { _chartP = null; rej(new Error('chart')); }; document.head.appendChild(s); });
  return _chartP;
}
function mkChart(id, cfg) {
  loadChart().then(() => { const c = document.getElementById(id); if (!c) return; if (CH[id]) CH[id].destroy(); CH[id] = new Chart(c, cfg); })
    .catch(() => { const c = document.getElementById(id); if (c && c.parentNode) c.parentNode.innerHTML = '<p class="muted tc" style="padding:40px 0">Carta tidak dapat dimuat. Semak sambungan internet.</p>'; });
}
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ── Dashboard ── */
ARV.dash = function () {
  const d = D(), O = d.orders, now = new Date(), Y = now.getFullYear(), M = now.getMonth();
  const mo = O.filter(o => inM(o, Y, M)), pm = O.filter(o => inM(o, M ? Y : Y - 1, M ? M - 1 : 11));
  const sales = paidSum(mo), psales = paidSum(pm), target = Number(d.settings.sasaran_bulanan) || 0;
  const yr = O.filter(o => { const x = pd(o.tarikh); return x && x.getFullYear() === Y; }), pyr = O.filter(o => { const x = pd(o.tarikh); return x && x.getFullYear() === Y - 1; });
  const pend = O.filter(o => o.status === 'Menunggu Bayaran').length, made = O.filter(o => o.status === 'Sedang Dibuat').length, ready = O.filter(o => o.status === 'Sudah Dibayar').length;
  const cnt = {}; STS.forEach(s => { cnt[s] = O.filter(o => o.status === s).length; });
  const rec = O.slice(0, 4);
  $('#a-dash').innerHTML = pageHead('GAMBARAN KESELURUHAN', 'Dashboard', 'Ringkasan prestasi perniagaan dan pesanan kraf terkini.',
    '<button class="btn btn-w" data-act="pNew"><i class="bi bi-plus-circle"></i> Tambah Produk Baharu</button><button class="btn btn-p" data-act="bNew"><i class="bi bi-megaphone"></i> Hebah Produk Baharu</button>') +
    '<div class="kpis">' +
    kpi('Jualan Bulan Ini', 'cash-stack', 'var(--primary-tint)', 'var(--primary)', rm(sales), '<div>' + arrow(pctTxt(sales, psales)) + '</div>' + (target ? '<div class="bar"><i style="width:' + Math.min(100, sales / target * 100) + '%"></i></div><div class="muted" style="font-size:12px">Sasaran: ' + rm(target) + ' (' + Math.round(sales / target * 100) + '%)</div>' : '')) +
    kpi('Tempahan Baharu', 'bag', 'var(--accent-tint)', 'var(--accent-ink)', mo.length + ' Pesanan', '<div><span class="pill st-menunggu">' + pend + ' Menunggu Bayaran</span></div><div class="muted" style="font-size:12px"><i class="bi bi-dot" style="color:var(--accent)"></i>' + ready + ' sedia untuk diproses</div>') +
    kpi('Kraf Sedang Dibuat', 'palette', '#EDE9FE', '#5B21B6', made + ' Item', '<div><span class="pill st-dibuat">' + made + ' tempahan aktif</span></div><div class="muted" style="font-size:12px"><i class="bi bi-clock"></i> Purata siap 3-4 hari</div>') +
    kpi('Jualan Tahunan', 'graph-up-arrow', '#FEF3C7', '#92400E', rm(paidSum(yr)), '<div>' + arrow(pctTxt(paidSum(yr), paidSum(pyr))) + '</div><div class="muted" style="font-size:12px"><i class="bi bi-calendar3"></i> Tahun ' + Y + '</div>') + '</div>' +
    '<div class="cols c21 mt16"><div class="card pad"><div class="flex jb ac wrap g8 mb12"><div><h3 class="h-m">Jualan Bulanan (' + Y + ')</h3><div class="muted" style="font-size:13px">Prestasi pendapatan kasar bengkel kraf</div></div><div class="seg" style="min-width:230px"><button class="' + (S.A.dsh === 'six' ? 'on' : '') + '" data-act="dsh" data-k="six">6 Bulan Terakhir</button><button class="' + (S.A.dsh === 'year' ? 'on' : '') + '" data-act="dsh" data-k="year">Sepanjang Tahun</button></div></div><div class="chart-box"><canvas id="chSales" aria-label="Carta jualan bulanan"></canvas></div></div>' +
    '<div class="card pad"><div class="flex jb ac mb12"><div><h3 class="h-m">Pecahan Status Tempahan</h3><div class="muted" style="font-size:13px">Semua tempahan</div></div></div><div class="chart-box" style="height:190px"><canvas id="chStat" aria-label="Pecahan status"></canvas></div><div class="legend mt12">' + STS.slice(0, 4).map((s, i) => '<div><i style="background:' + ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'][i] + '"></i><span class="grow">' + esc(s) + '</span><b>' + cnt[s] + '</b></div>').join('') + '</div></div></div>' +
    '<div class="cols c21 mt16"><div class="card"><div class="flex jb ac wrap g8 pad"><div class="flex ac g12"><span class="ib tint"><i class="bi bi-bag-check"></i></span><div><h3 class="h-m">Tempahan Terkini</h3><div class="muted" style="font-size:13px">Senarai aliran pesanan kraf buatan tangan terkini</div></div></div></div><div class="tbl-wrap">' + ordTable(rec, false) + '</div><div class="pager"><span>Menunjukkan ' + rec.length + ' daripada ' + O.length + ' pesanan keseluruhan</span><button class="fw7 pri" data-act="aGo" data-v="orders">Lihat Semua Tempahan (' + O.length + ') <i class="bi bi-arrow-right"></i></button></div></div>' +
    '<div class="insight"><h3 class="h-m"><i class="bi bi-lightbulb"></i> Analisis Pintar</h3><ul>' + insights().map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div></div>';
  drawDash();
};
function drawDash() {
  const O = D().orders, now = new Date(), Y = now.getFullYear(), M = now.getMonth(); const labels = [], vals = [];
  if (S.A.dsh === 'six') { for (let i = 5; i >= 0; i--) { const dt = new Date(Y, M - i, 1); labels.push(MON[dt.getMonth()]); vals.push(paidSum(O.filter(o => inM(o, dt.getFullYear(), dt.getMonth())))); } }
  else { for (let m = 0; m < 12; m++) { labels.push(MON[m]); vals.push(paidSum(O.filter(o => inM(o, Y, m)))); } }
  const tx = cssv('--text3'), pr = cssv('--primary'), bd = cssv('--border');
  mkChart('chSales', { type: 'bar', data: { labels: labels, datasets: [{ label: 'Jualan (RM)', data: vals, backgroundColor: vals.map((_, i) => i === vals.length - 1 || (S.A.dsh === 'year' && i === M) ? pr : pr + '66'), borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => rm(c.parsed.y) } } }, scales: { x: { ticks: { color: tx }, grid: { display: false } }, y: { ticks: { color: tx, callback: v => 'RM ' + v }, grid: { color: bd }, beginAtZero: true } } } });
  const cnt = STS.map(s => O.filter(o => o.status === s).length);
  mkChart('chStat', { type: 'doughnut', data: { labels: STS, datasets: [{ data: cnt, backgroundColor: ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } } });
}
function insights() {
  const d = D(), O = d.orders, now = new Date(), t = [], mo = O.filter(o => inM(o, now.getFullYear(), now.getMonth()));
  const sold = {}; O.filter(o => o.status !== 'Dibatalkan').forEach(o => o.items.forEach(i => { sold[i.nama] = (sold[i.nama] || 0) + i.qty; }));
  const top = Object.keys(sold).sort((a, b) => sold[b] - sold[a])[0];
  if (top) t.push('Produk terlaris: "' + top + '" (' + sold[top] + ' unit).');
  const pend = O.filter(o => o.status === 'Menunggu Bayaran').length; if (pend) t.push(pend + ' tempahan masih menunggu bayaran. Semak resit WhatsApp dan kemas kini status.');
  const tg = Number(d.settings.sasaran_bulanan) || 0, s = paidSum(mo); if (tg) t.push('Jualan bulan ini ' + rm(s) + ' (' + Math.round(s / tg * 100) + '% daripada sasaran).');
  const cons = d.customers.filter(c => c.setuju).length; t.push(cons + ' daripada ' + d.customers.length + ' pelanggan bersetuju menerima hebahan.');
  const hid = d.products.filter(p => p.status !== 'Aktif').length; if (hid) t.push(hid + ' produk disembunyikan daripada storefront.');
  if (!O.length) t.push('Belum ada tempahan. Kongsi pautan kedai anda di Instagram dan WhatsApp.');
  return t;
}

/* ── Jadual tempahan (dikongsi) ── */
function ordTable(L, full) {
  return '<table class="tbl"><thead><tr>' + (full ? '<th><input type="checkbox" data-in="oselAll" aria-label="Pilih semua"></th>' : '') + '<th>ID Tempahan</th>' + (full ? '<th>Tarikh</th>' : '') + '<th>Pelanggan' + (full ? ' &amp; Telefon' : '') + '</th><th>Barangan</th><th>Jumlah &amp; Kaedah</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>' +
    (L.length ? L.map(o => '<tr>' + (full ? '<td><input type="checkbox" data-in="osel" data-id="' + o.id + '"' + (S.A.of.sel[o.id] ? ' checked' : '') + ' aria-label="Pilih ' + o.id + '"></td>' : '') + '<td class="id" style="' + (o.status === 'Dibatalkan' ? 'text-decoration:line-through' : '') + '">#' + esc(o.id) + '</td>' + (full ? '<td>' + fD(o.tarikh) + '<small>' + fT(o.tarikh) + '</small></td>' : '') + '<td><b>' + esc(o.nama) + '</b><small>' + esc(o.tel) + '</small></td><td>' + o.items.length + ' barangan<small>' + esc(o.items.map(i => i.nama).join(', ')).slice(0, 50) + '</small></td><td><b>' + rm(o.jumlah) + '</b><small>' + esc(o.kaedah) + '</small></td><td>' + (full ? '<select class="in" style="min-height:34px;width:auto;border-radius:999px;padding:0 10px;font-size:12px;font-weight:600" data-in="ostat" data-id="' + o.id + '" aria-label="Status">' + STS.map(s => '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' : chipSt(o.status)) + '</td><td><button class="btn btn-w btn-s" data-act="oView" data-id="' + o.id + '">Lihat Detail</button></td></tr>').join('') : '<tr><td colspan="9" class="tc muted" style="padding:32px">Tiada tempahan dijumpai.</td></tr>') + '</tbody></table>';
}

/* ── Tempahan ── */
const PG = 8;
function ordFilter() {
  const f = S.A.of, q = f.q.trim().toLowerCase(), lim = f.range === 'all' ? 0 : nowMs() - Number(f.range) * 864e5;
  return D().orders.filter(o => (f.st === 'Semua' || o.status === f.st) && (!lim || (pd(o.tarikh) && pd(o.tarikh).getTime() >= lim)) && (!q || (o.id + ' ' + o.nama + ' ' + o.tel).toLowerCase().indexOf(q) >= 0));
}
ARV.orders = function () {
  const O = D().orders, c = s => O.filter(o => o.status === s).length, n = O.length || 1;
  $('#a-orders').innerHTML = pageHead('PENGURUSAN TEMPAHAN', 'Tempahan', 'Pantau, kemaskini status dan jana invois pelanggan.',
    '<button class="btn btn-w" data-act="oCSV"><i class="bi bi-download"></i> Eksport CSV / Excel</button><button class="btn btn-p" data-act="oManual"><i class="bi bi-plus-lg"></i> Tempahan Manual</button>') +
    '<div class="kpis">' + kpi('JUMLAH KESELURUHAN', 'archive', 'var(--primary-tint)', 'var(--primary)', O.length + ' pesanan', '') +
    kpi('MENUNGGU BAYARAN', 'hourglass-split', 'var(--accent-tint)', 'var(--accent-ink)', c('Menunggu Bayaran'), '<div class="muted" style="font-size:12px">' + (c('Menunggu Bayaran') / n * 100).toFixed(1) + '% perlukan semakan resit</div>') +
    kpi('SEDANG DIBUAT', 'palette', '#EDE9FE', '#5B21B6', c('Sedang Dibuat'), '<div class="muted" style="font-size:12px">dalam atelier</div>') +
    kpi('SELESAI & DIHANTAR', 'truck', 'var(--primary-tint)', 'var(--primary)', c('Sudah Dihantar'), '<div class="muted" style="font-size:12px">' + (c('Sudah Dihantar') / n * 100).toFixed(1) + '% kadar penyiapan</div>') + '</div>' +
    '<div class="card mt16"><div class="pad"><div class="tabs" id="oTabs"></div></div><div class="pad" style="padding-top:0"><div class="toolbar"><div class="search"><i class="bi bi-search muted"></i><input data-in="oq" placeholder="Cari ID tempahan, nama, atau no telefon…" value="' + esc(S.A.of.q) + '"></div><select class="in" data-in="orange" aria-label="Tempoh"><option value="7">7 Hari Terakhir</option><option value="30">30 Hari Terakhir</option><option value="90">90 Hari Terakhir</option><option value="all">Semua Tempoh</option></select><button class="ib" data-act="oRefresh" aria-label="Muat semula"><i class="bi bi-arrow-clockwise"></i></button></div></div>' +
    '<div class="flex jb ac wrap g8 pad" style="padding-top:0"><span id="oSelCnt" class="muted"></span><div class="flex g8 wrap"><button class="btn btn-w btn-s" data-act="oLabels"><i class="bi bi-printer"></i> Cetak Nota Penghantaran</button><button class="btn btn-w btn-s" data-act="oBulk"><i class="bi bi-arrow-left-right"></i> Kemas Kini Status Berkelompok</button></div></div>' +
    '<div class="tbl-wrap" id="oTbl"></div><div class="pager" id="oPager"></div></div>' +
    '<div class="card pad mt16 flex ac g12 wrap"><span class="ib tint"><i class="bi bi-lightbulb"></i></span><div class="grow"><div class="h-s">Petua Operasi Atelier</div><div class="t2" style="font-size:13px">Terdapat ' + c('Menunggu Bayaran') + ' tempahan belum disemak bukti pembayaran bank. Sahkan segera bagi memulakan susunan giliran mengait benang.</div></div><button class="btn btn-a btn-s" data-act="oFilt" data-k="Menunggu Bayaran">Tapis Menunggu Bayaran (' + c('Menunggu Bayaran') + ')</button></div>';
  $('[data-in=orange]').value = S.A.of.range; updOrders();
};
function updOrders() {
  const f = S.A.of, L = ordFilter(), pages = Math.max(1, Math.ceil(L.length / PG)); if (f.page > pages) f.page = pages;
  const v = L.slice((f.page - 1) * PG, f.page * PG), O = D().orders;
  $('#oTabs').innerHTML = ['Semua'].concat(STS).map(s => { const n = s === 'Semua' ? O.length : O.filter(o => o.status === s).length; return '<button class="chip ' + (f.st === s ? 'on' : '') + '" data-act="oFilt" data-k="' + s + '">' + s + ' <small>' + n + '</small></button>'; }).join('');
  $('#oTbl').innerHTML = ordTable(v, true);
  const nSel = Object.keys(f.sel).length; $('#oSelCnt').textContent = 'Pilih Semua (' + nSel + ' dipilih)';
  $('#oPager').innerHTML = '<span>Menunjukkan ' + (L.length ? (f.page - 1) * PG + 1 : 0) + ' - ' + Math.min(f.page * PG, L.length) + ' daripada ' + L.length + ' tempahan</span><div class="pg">' + pagerBtns(f.page, pages, 'oPage') + '</div>';
}
function pagerBtns(cur, pages, act) {
  let h = '<button data-act="' + act + '" data-p="' + Math.max(1, cur - 1) + '" aria-label="Sebelum"><i class="bi bi-chevron-left"></i></button>';
  for (let i = 1; i <= pages; i++) { if (pages > 7 && i > 3 && i < pages - 1 && Math.abs(i - cur) > 1) { if (i === 4) h += '<button disabled>…</button>'; continue; } h += '<button class="' + (i === cur ? 'on' : '') + '" data-act="' + act + '" data-p="' + i + '">' + i + '</button>'; }
  return h + '<button data-act="' + act + '" data-p="' + Math.min(pages, cur + 1) + '" aria-label="Seterusnya"><i class="bi bi-chevron-right"></i></button>';
}
/* Tukar status: UI serta-merta, sinkron latar belakang, rollback jika gagal */
function setStatus(ids, status) {
  const prev = {}; ids.forEach(id => { const o = D().orders.find(x => x.id === id); if (o) { prev[id] = o.status; o.status = status; } });
  aRender(); toast(ids.length > 1 ? ids.length + ' tempahan → ' + status : 'Status → ' + status);
  adm('setStatus', { ids: ids, status: status }).catch(e => { ids.forEach(id => { const o = D().orders.find(x => x.id === id); if (o && prev[id]) o.status = prev[id]; }); aRender(); toast(e.message, 'err'); });
}
const selIds = () => Object.keys(S.A.of.sel);

/* ── Invois (pratonton klien; PDF dijana pelayan) ── */
function invHtml(o) {
  const s = D().settings;
  return '<div class="paper" id="invPaper"><div class="flex jb g12 wrap"><div><h2>' + esc(s.nama_perniagaan) + '</h2><div>' + esc(s.alamat_perniagaan) + (s.no_pendaftaran ? '<br>Daftar: ' + esc(s.no_pendaftaran) : '') + '<br>' + esc(s.emel_admin) + ' | ' + esc(s.telefon_paparan) + '</div></div><div class="tr"><b style="font-size:20px;color:var(--primary)">INVOIS</b><div>No: <b>' + esc(o.invois || '(Draf)') + '</b><br>Tarikh: ' + fD(o.tarikh) + '<br>Rujukan: ' + esc(o.id) + '<div class="mt8">' + chipSt(o.status) + '</div></div></div></div>' +
    '<div class="box mt16 flex jb g12 wrap"><div><b>KEPADA:</b><br><b>' + esc(o.nama) + '</b><br>Tel: ' + esc(o.tel) + '<br>' + esc(o.alamat) + '</div><div class="tr"><b>MAKLUMAT TRANSAKSI:</b><br>Kaedah: ' + esc(o.kaedah) + '<br>Masa: ' + fT(o.tarikh) + '</div></div>' +
    '<table class="inv-t mt16"><thead><tr><th>No.</th><th>Penerangan Barangan</th><th>Kuantiti</th><th>Harga Seunit</th><th>Jumlah</th></tr></thead><tbody>' + o.items.map((i, n) => '<tr><td>' + pad2(n + 1) + '</td><td><b>' + esc(i.nama) + '</b>' + (i.nota ? '<br><span style="color:#667972">' + esc(i.nota) + '</span>' : '') + '</td><td>' + i.qty + ' unit</td><td>' + rm(i.harga) + '</td><td>' + rm(i.harga * i.qty) + '</td></tr>').join('') + '</tbody></table>' +
    '<div class="flex jb g12 mt16 wrap"><div>' + (o.nota ? '<div class="box" style="background:#FFE9DF"><b>ARAHAN PESANAN:</b><br><i>' + esc(o.nota) + '</i></div>' : '') + '</div><div class="tr">Subtotal: <b>' + rm(o.subtotal) + '</b><br>Kos Penghantaran: <b>' + rm(o.caj) + '</b><div class="box mt8"><b>Jumlah Perlu Dibayar: <span style="font-size:16px;color:var(--primary)">' + rm(o.jumlah) + '</span></b></div></div></div>' +
    '<div class="box mt16"><b>MAKLUMAT PINDAHAN AKAUN</b><br>' + esc(s.bank_nama) + ' | ' + esc(s.bank_akaun_nama) + '<br><b style="font-size:15px;letter-spacing:.05em">' + esc(s.bank_no_akaun) + '</b></div>' +
    '<p class="tc mt16" style="color:var(--primary)"><b>Terima kasih kerana menyokong seni kraf buatan tangan Bigz!</b><br><span style="color:#667972;font-size:11px">Invois ini dijana secara berkomputer dan sah tanpa tandatangan manual fizikal.</span></p></div>';
}
const pad2 = n => String(n).padStart(2, '0');
ARV.order = function (id) {
  if (id) S.A.oid = id; const o = D().orders.find(x => x.id === S.A.oid); if (!o) { aGo('orders'); return; }
  const idx = STS.indexOf(o.status), steps = [['Tempahan Dihantar', fD(o.tarikh) + ', ' + fT(o.tarikh) + ' — Pelanggan telah memilih barang dan melengkapkan borang pesanan.', 0], ['Menunggu Bayaran', 'Resit pembayaran belum disahkan oleh admin.', 0], ['Sedang Dibuat (Kait Tangan)', 'Anggaran siap: 2 - 3 hari waktu bekerja.', 2], ['Selesai & Dihantar ke Kurier', 'Nombor penjejakan akan dijana.', 3]];
  const done = i => o.status === 'Dibatalkan' ? i === 0 : (i === 0 || (i === 1 && idx >= 1) || (i === 2 && idx >= 3) || (i === 3 && idx >= 3));
  const now = i => o.status !== 'Dibatalkan' && ((i === 1 && idx === 0) || (i === 2 && (idx === 1 || idx === 2)));
  $('#a-order').innerHTML = '<button class="btn btn-t btn-s mb12" data-act="aGo" data-v="orders"><i class="bi bi-arrow-left"></i> Kembali ke Senarai Tempahan</button>' +
    '<div class="card pad flex ac g12 wrap"><span class="ib tint"><i class="bi bi-receipt"></i></span><div class="grow"><div class="flex ac g8 wrap"><h1 class="h-m">Tempahan #' + esc(o.id) + '</h1>' + chipSt(o.status) + '</div><div class="muted" style="font-size:13px"><i class="bi bi-calendar3"></i> ' + fD(o.tarikh) + ', ' + fT(o.tarikh) + '</div></div><select class="in" style="width:auto" id="oStSel" aria-label="Tukar status">' + STS.map(s => '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select><button class="btn btn-p" data-act="oSetSt" data-id="' + o.id + '"><i class="bi bi-arrow-repeat"></i> Kemaskini Status</button></div>' +
    '<div class="cols cside mt16"><div class="flex col g16">' +
    '<div class="card pad"><div class="flex jb ac mb12"><h3 class="h-s"><i class="bi bi-person pri"></i> Maklumat Pelanggan</h3><span class="pill tint">Terverifikasi</span></div><div class="flex ac g12"><span class="avatar" style="background:var(--accent-tint);color:var(--accent-ink)">' + esc(o.nama.slice(0, 2).toUpperCase()) + '</span><div><b>' + esc(o.nama) + '</b><div class="muted">' + esc(o.emel || '—') + '</div></div></div><a class="btn btn-t btn-s mt12" target="_blank" rel="noopener" href="' + esc(waLink('6' + o.tel.replace(/^0/, ''), 'Hai ' + o.nama + ', mengenai tempahan ' + o.id)) + '"><i class="bi bi-whatsapp"></i> Hubungi WhatsApp (' + esc(o.tel) + ')</a><div class="card pad-s mt12" style="background:var(--accent-tint);box-shadow:none"><div class="flex jb"><span class="eyebrow" style="color:var(--accent-ink)">ALAMAT PENGHANTARAN</span><button class="eyebrow pri" data-act="copy" data-t="' + esc(o.alamat) + '"><i class="bi bi-copy"></i> Salin Alamat</button></div><p class="mt8">' + esc(o.alamat) + '</p></div></div>' +
    '<div class="card pad"><div class="flex jb ac mb12"><h3 class="h-s"><i class="bi bi-bag pri"></i> Senarai Barangan Pesanan</h3><span class="pill tint">' + o.items.length + ' Item</span></div>' + o.items.map(i => '<div class="flex jb g12 pad-s solid mb8" style="border-radius:14px"><div><b>' + esc(i.nama) + '</b><div class="muted" style="font-size:12px">' + i.qty + ' unit x ' + rm(i.harga) + (i.nota ? ' · ' + esc(i.nota) : '') + '</div></div><b class="pri">' + rm(i.harga * i.qty) + '</b></div>').join('') + '<div class="sum-row"><span>Jumlah Kecil (Subtotal)</span><b>' + rm(o.subtotal) + '</b></div><div class="sum-row"><span>Kos Penghantaran</span><b>' + rm(o.caj) + '</b></div><div class="flex jb ac pad-s" style="background:var(--primary-tint);border-radius:14px"><b>JUMLAH KESELURUHAN</b><b class="pri" style="font-size:18px">' + rm(o.jumlah) + '</b></div></div>' +
    (o.nota ? '<div class="card pad" style="background:var(--accent-tint)"><h3 class="h-s" style="color:var(--accent-ink)"><i class="bi bi-chat-quote"></i> Nota Khas Pelanggan</h3><p class="mt8"><i>"' + esc(o.nota) + '"</i></p></div>' : '') +
    '<div class="card pad"><h3 class="h-s mb12"><i class="bi bi-clock-history pri"></i> Garis Masa Status Tempahan</h3><div class="tl">' + steps.map((s, i) => '<div class="' + (done(i) ? 'done' : (now(i) ? 'now' : '')) + '"><b>' + esc(s[0]) + '</b><div class="muted" style="font-size:12px">' + esc(s[1]) + '</div></div>').join('') + '</div></div>' +
    '<button class="btn btn-d" data-act="oDel" data-id="' + o.id + '"><i class="bi bi-trash"></i> Padam Tempahan Ini</button></div>' +
    '<div><div class="flex jb ac mb12"><h3 class="h-s"><i class="bi bi-file-earmark-text pri"></i> Pratonton Invois Rasmi</h3><span class="pill tint">Format Cetak A4</span></div><div class="paper-wrap">' + invHtml(o) + '</div>' +
    '<div class="flex g8 wrap mt16"><button class="btn btn-w" data-act="invPrint" data-id="' + o.id + '"><i class="bi bi-printer"></i> Cetak Invois</button><button class="btn btn-p" data-act="invPdf" data-id="' + o.id + '"><i class="bi bi-download"></i> Muat Turun PDF</button><button class="btn btn-t" data-act="invPdf" data-id="' + o.id + '" data-regen="1"><i class="bi bi-arrow-repeat"></i> Jana Semula Invois</button>' + (o.pdf ? '<a class="btn btn-w" target="_blank" rel="noopener" href="' + esc(o.pdf) + '"><i class="bi bi-google"></i> Buka di Drive</a>' : '') + '</div></div></div>';
};
function invPdf(id, btn) {
  busy(btn, true, 'Menjana PDF…');
  adm('invoice', { id: id }).then(r => {
    const o = D().orders.find(x => x.id === id); if (o) { o.invois = r.invois; o.pdf = r.pdf; }
    download(r.name, 'application/pdf', [b64Bytes(r.base64)]); toast('Invois ' + r.invois + ' dijana & disimpan di Drive'); aRender();
  }).catch(e => { busy(btn, false); toast(e.message, 'err'); });
}
function printHtml(inner, title) {
  modal('<div class="mh noprint"><h3 class="h-m">' + esc(title) + '</h3><div class="flex g8"><button class="btn btn-p btn-s" data-act="doPrint"><i class="bi bi-printer"></i> Cetak</button><button class="btn btn-w btn-s" data-act="modalClose"><i class="bi bi-x-lg"></i> Tutup</button></div></div><div class="paper-wrap">' + inner + '</div>', true);
}

/* ── Produk ── */
const prodFilter = () => { const f = S.A.pf, q = f.q.trim().toLowerCase(); return D().products.filter(p => (!f.kat || p.kat === f.kat) && (!f.st || p.status === f.st) && (!q || (p.nama + ' ' + p.sku).toLowerCase().indexOf(q) >= 0)).sort((a, b) => a.tarikh < b.tarikh ? 1 : -1); };
ARV.products = function () {
  const P2 = D().products, act = P2.filter(p => p.status === 'Aktif').length, O = D().orders.filter(o => o.status !== 'Dibatalkan'), sel = O.length ? O.filter(o => o.status === 'Sudah Dihantar').length / O.length * 100 : 0;
  const kats = Array.from(new Set(P2.map(p => p.kat)));
  $('#a-products').innerHTML = pageHead('ATELIER STOCK & INVENTORY', 'Pengurusan Katalog Produk', 'Urus produk kaitan tangan, muat naik gambar dan pantau status paparan storefront secara langsung.',
    '<button class="btn btn-w" data-act="pCSV"><i class="bi bi-download"></i> Eksport CSV</button><button class="btn btn-p" data-act="pNew"><i class="bi bi-plus-lg"></i> Tambah Produk Baharu</button>') +
    '<div class="kpis">' + kpi('JUMLAH SKU', 'boxes', 'var(--primary-tint)', 'var(--primary)', P2.length + ' Unit', '') + kpi('AKTIF DI STOREFRONT', 'eye', 'var(--primary-tint)', 'var(--primary)', '<span class="pri">' + act + ' Item</span>', '') + kpi('TERSEMBUNYI', 'eye-slash', '#F1F5F9', '#475569', (P2.length - act) + ' Item', '') + kpi('KADAR PENGHANTARAN', 'graph-up-arrow', 'var(--accent-tint)', 'var(--accent-ink)', '<span style="color:var(--accent-ink)">' + sel.toFixed(1) + '%</span>', '') + '</div>' +
    '<div class="card mt16"><div class="pad"><div class="toolbar"><div class="search"><i class="bi bi-search muted"></i><input data-in="pq" placeholder="Cari nama produk, SKU…" value="' + esc(S.A.pf.q) + '"></div><select class="in" data-in="pkat"><option value="">Semua Kategori</option>' + kats.map(k => '<option' + (S.A.pf.kat === k ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select><select class="in" data-in="pst"><option value="">Semua Status</option><option value="Aktif"' + (S.A.pf.st === 'Aktif' ? ' selected' : '') + '>Aktif</option><option value="Sembunyi"' + (S.A.pf.st === 'Sembunyi' ? ' selected' : '') + '>Tersembunyi</option></select><span class="pill tint" style="height:36px" id="pCnt"></span></div></div><div class="tbl-wrap" id="pTbl"></div><div class="pager" id="pPager"></div></div>';
  updProducts();
};
function updProducts() {
  const L = prodFilter(), f = S.A.pf, pages = Math.max(1, Math.ceil(L.length / PG)); if (f.page > pages) f.page = pages;
  const v = L.slice((f.page - 1) * PG, f.page * PG), act = D().products.filter(p => p.status === 'Aktif').length;
  $('#pCnt').innerHTML = '<i class="bi bi-dot"></i>' + act + ' Produk Aktif / ' + D().products.length + ' Keseluruhan';
  $('#pTbl').innerHTML = '<table class="tbl"><thead><tr><th>Gambar</th><th>Nama Produk &amp; SKU</th><th>Kategori</th><th>Harga (RM)</th><th>Status Jualan</th><th>Tarikh Ditambah</th><th>Tindakan</th></tr></thead><tbody>' +
    (v.length ? v.map(p => '<tr><td><div class="thumb">' + pic(p, 120) + '</div></td><td><b>' + esc(p.nama) + '</b><small>SKU: ' + esc(p.sku) + '</small></td><td><span class="pill tint" style="height:auto;padding:4px 12px;font-size:12px">' + esc(p.kat) + '</span></td><td><b>' + rm(p.harga) + '</b></td><td><div class="flex ac g8"><button class="toggle ' + (p.status === 'Aktif' ? 'on' : '') + '" data-act="pTog" data-id="' + p.id + '" aria-label="Tukar status paparan"></button><span class="' + (p.status === 'Aktif' ? 'pri fw6' : 'muted') + '">' + (p.status === 'Aktif' ? 'Aktif' : 'Tersembunyi') + '</span></div></td><td>' + fD(p.tarikh) + '</td><td><div class="flex g8"><button class="ib sm" data-act="pEdit" data-id="' + p.id + '" aria-label="Ubah"><i class="bi bi-pencil"></i></button><button class="ib sm" style="color:#c0262d" data-act="pDel" data-id="' + p.id + '" aria-label="Padam"><i class="bi bi-trash"></i></button></div></td></tr>').join('') : '<tr><td colspan="7" class="tc muted" style="padding:32px">Tiada produk. Tekan "Tambah Produk Baharu".</td></tr>') + '</tbody></table>';
  $('#pPager').innerHTML = '<span>Menunjukkan ' + (L.length ? (f.page - 1) * PG + 1 : 0) + ' - ' + Math.min(f.page * PG, L.length) + ' daripada ' + L.length + ' produk</span><div class="pg">' + pagerBtns(f.page, pages, 'pPage') + '</div>';
}
function saveProductRemote(p, tmp) {      // optimistic: baris sudah ada di UI; sahkan di latar belakang
  const payload = { id: tmp ? '' : p.id, tarikh: p.tarikh, nama: p.nama, kat: p.kat, harga: p.harga, asal: p.asal, sku: p.sku, desc: p.desc, saiz: p.saiz, bahan: p.bahan, jaga: p.jaga, masa: p.masa, status: p.status, kustom: p.kustom, unggul: p.unggul, img: p.img };
  return adm('saveProduct', payload);
}
function toggleProduct(id) {
  const p = D().products.find(x => x.id === id); if (!p) return; const prev = p.status;
  p.status = prev === 'Aktif' ? 'Sembunyi' : 'Aktif'; syncPublic(); aRender();
  saveProductRemote(p, false).catch(e => { p.status = prev; syncPublic(); aRender(); toast(e.message, 'err'); });
}

/* ── Borang produk ── */
const blankP = () => ({ id: '', nama: '', kat: '', harga: '', asal: '', sku: '', desc: '', saiz: '', bahan: '100% Milk Cotton Lembut', jaga: 'Basuh tangan sejuk, jemur rata', masa: '3-5 hari', status: 'Aktif', kustom: true, unggul: false, img: [] });
ARV.pform = function (arg) {
  if (arg === 'new') { const dr = store.get('bz_pdraft', null); S.A.pfm = dr ? Object.assign(blankP(), dr, { img: (dr.img || []).filter(u => /^https:/.test(u)) }) : blankP(); S.A.pfm.imgs = S.A.pfm.img.map(u => ({ url: u })); }
  else if (arg && arg.id) { const p = arg; S.A.pfm = Object.assign({}, p, { imgs: p.img.map(u => ({ url: u })) }); }
  if (!S.A.pfm) { aGo('products'); return; } S.A.keep = undefined;
  const f = S.A.pfm, kats = Array.from(new Set(D().products.map(p => p.kat)));
  const fld = (k, lbl, ph2, type, req) => '<div class="field"><label>' + lbl + (req ? ' <span class="pri">*</span>' : '') + '</label><input class="in" data-in="pf_' + k + '" type="' + (type || 'text') + '"' + (type === 'number' ? ' step="0.01" min="0" inputmode="decimal"' : '') + ' placeholder="' + esc(ph2 || '') + '" value="' + esc(f[k]) + '"></div>';
  $('#a-pform').innerHTML = '<button class="btn btn-t btn-s mb12" data-act="pBack"><i class="bi bi-arrow-left"></i> Kembali ke Katalog Produk</button>' +
    '<div class="page-h"><div><h1 class="h-d">' + (f.id ? 'Ubah Produk' : 'Tambah Produk Baharu') + '</h1><p class="muted mt8">Masukkan butiran kraf kait dan muat naik gambar untuk dipaparkan di katalog pelanggan.</p></div><span class="pill tint"><i class="bi bi-dot"></i> Borang Draf Aktif</span></div>' +
    '<div class="cols c12"><div class="card pad"><div class="flex jb ac mb16"><div class="flex ac g12"><span class="ib tint"><i class="bi bi-card-text"></i></span><div><h3 class="h-m">Maklumat Produk &amp; Spesifikasi</h3><div class="muted" style="font-size:12px">Butiran asas yang dilihat oleh pembeli atelier</div></div></div></div>' +
    fld('nama', 'Nama Produk', 'cth: Beg Bahu Granny Square Daisy', 'text', 1) + '<div class="form2"><div class="field"><label>Kategori <span class="pri">*</span></label><input class="in" list="katList" data-in="pf_kat" placeholder="cth: Beg Crochet" value="' + esc(f.kat) + '"><datalist id="katList">' + kats.map(k => '<option value="' + esc(k) + '">').join('') + '</datalist></div>' + fld('harga', 'Harga Jualan (RM)', '65.00', 'number', 1) + '</div>' +
    '<div class="form2">' + fld('asal', 'Harga Asal (RM) — pilihan, untuk harga dicoret', '78.00', 'number') + '<div class="field"><label>Kod SKU <button class="eyebrow pri" style="float:right" data-act="pSku">Jana Semula SKU</button></label><input class="in" data-in="pf_sku" value="' + esc(f.sku) + '" placeholder="Auto jika kosong"></div></div>' +
    '<div class="field"><label>Penerangan Kraf <span class="pri">*</span> <span class="opt" id="dCnt">' + String(f.desc).length + ' aksara</span></label><textarea class="in" data-in="pf_desc" maxlength="800" style="min-height:130px">' + esc(f.desc) + '</textarea></div>' +
    '<div class="form2">' + fld('saiz', 'Saiz & Dimensi', '28cm x 30cm') + fld('bahan', 'Bahan Benang', '100% Milk Cotton') + fld('jaga', 'Penjagaan', 'Basuh tangan sejuk') + fld('masa', 'Masa Siap', '3-5 hari') + '</div>' +
    '<div class="flex ac g12 pad-s mb12" style="background:var(--primary-tint);border-radius:16px"><i class="bi bi-eye pri" style="font-size:20px"></i><div class="grow"><b>Status Paparan Storefront</b><div class="muted" style="font-size:12px">Apabila aktif, item ini akan terus dipamerkan dalam katalog tempahan pelanggan.</div></div><button class="toggle ' + (f.status === 'Aktif' ? 'on' : '') + '" id="pfTog" data-act="pfTog" aria-label="Status paparan"></button></div>' +
    '<label class="check pad-s mb8" style="background:var(--accent-tint);border-radius:16px;font-size:13px"><input type="checkbox" data-in="pf_kustom"' + (f.kustom ? ' checked' : '') + '><span><b style="color:var(--accent-ink)">Terima Pesanan Kustom (Custom Request)</b><br>Benarkan pelanggan membuat pesanan warna khas atau sulaman inisial nama untuk item kait ini.</span></label>' +
    '<label class="check pad-s" style="background:var(--input);border-radius:16px;font-size:13px"><input type="checkbox" data-in="pf_unggul"' + (f.unggul ? ' checked' : '') + '><span><b>Produk Pilihan / Unggulan</b><br>Diutamakan dalam seksyen "Paling Laris" di laman utama.</span></label></div>' +
    '<div class="card pad"><div class="flex jb ac mb16"><div class="flex ac g12"><span class="ib tint" style="background:var(--accent-tint);color:var(--accent-ink)"><i class="bi bi-images"></i></span><div><h3 class="h-m">Gambar Produk &amp; Media</h3><div class="muted" style="font-size:12px" id="imgCnt"></div></div></div></div>' +
    '<div class="drop" id="drop" data-act="pPick"><i class="bi bi-cloud-arrow-up pri" style="font-size:34px"></i><div class="h-s mt8">Seret gambar ke sini atau klik untuk muat naik</div><div class="muted" style="font-size:12px">PNG, JPG atau WEBP — dimampatkan automatik sebelum dimuat naik</div></div><input type="file" id="pFile" accept="image/png,image/jpeg,image/webp" multiple hidden>' +
    '<div class="flex jb mt16 mb8"><b>Galeri Pratonton Terpilih</b><span class="muted" style="font-size:12px">Klik gambar untuk jadikan utama</span></div><div class="gal-edit" id="pfGal"></div>' +
    '<div class="banner mt16"><i class="bi bi-lightbulb"></i><span><b>Tip Foto Pengkraf</b><br>Gambar bernisbah 1:1 (segi empat sama) dengan pencahayaan lembut semulajadi mencatat kadar tempahan lebih tinggi.</span></div></div></div>' +
    '<div class="sticky-act"><span class="muted"><i class="bi bi-cloud-check pri"></i> <span id="draftTxt">' + (f.id ? 'Mengubah produk sedia ada' : 'Draf disimpan secara automatik di peranti ini') + '</span></span><div class="flex g8"><button class="btn btn-w" data-act="pBack">Batal</button><button class="btn btn-p" data-act="pSave" id="pSaveBtn"><i class="bi bi-check-lg"></i> Simpan &amp; Terbitkan Produk</button></div></div>';
  drawGal();
};
function drawGal() {
  const f = S.A.pfm; if (!f) return; const g = $('#pfGal'); if (!g) return;
  g.innerHTML = f.imgs.map((m, i) => '<div data-act="pMain" data-i="' + i + '"><img src="' + esc(m.url.indexOf('blob:') === 0 ? m.url : imgUrl(m.url, 300)) + '" alt="" referrerpolicy="no-referrer">' + (i === 0 ? '<span class="main pill tint"><i class="bi bi-star-fill"></i> UTAMA</span>' : '') + (m.up ? '<div style="position:absolute;inset:0;background:rgba(255,255,255,.6);display:grid;place-items:center"><span class="spin"></span></div>' : '') + '<button class="x" data-act="pImgDel" data-i="' + i + '" aria-label="Buang"><i class="bi bi-x"></i></button></div>').join('') +
    (f.imgs.length < 5 ? '<div data-act="pPick" style="display:grid;place-items:center;text-align:center;border:2px dashed var(--border);cursor:pointer"><div><i class="bi bi-plus-lg pri" style="font-size:22px"></i><div style="font-size:12px">Tambah Slot Gambar</div></div></div>' : '');
  const c = $('#imgCnt'); if (c) c.textContent = f.imgs.length + ' daripada maksimum 5 imej';
  const b = $('#pSaveBtn'); if (b) b.disabled = f.imgs.some(m => m.up);
}
function compress(file, max) {
  return new Promise((res, rej) => {
    const im = new Image(), u = URL.createObjectURL(file);
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b => { if (!b) return rej(new Error('Gagal memampat imej')); const r = new FileReader(); r.onload = () => res({ data: String(r.result).split(',')[1], blob: b }); r.readAsDataURL(b); }, 'image/jpeg', .82);
    };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Fail bukan imej yang sah.')); }; im.src = u;
  });
}
function addImages(files, kind, target) {   // target: 'pfm' | callback(url)
  const list = Array.prototype.slice.call(files);
  list.forEach(file => {
    if (!/^image\//.test(file.type)) { toast('Hanya fail imej dibenarkan.', 'err'); return; }
    const f = S.A.pfm; if (target === 'pfm' && f.imgs.length >= 5) { toast('Maksimum 5 imej.', 'err'); return; }
    compress(file, kind === 'aset' ? 600 : 1000).then(c => {
      let m = null; if (target === 'pfm') { m = { url: URL.createObjectURL(c.blob), up: true }; f.imgs.push(m); drawGal(); }
      return adm('upload', { data: c.data, mime: 'image/jpeg', name: file.name.replace(/\.\w+$/, '') + '.jpg', kind: kind }).then(r => {
        if (target === 'pfm') { m.url = r.url; m.up = false; drawGal(); persistDraft(); } else target(r.url);
      }).catch(e => { if (m) { f.imgs.splice(f.imgs.indexOf(m), 1); drawGal(); } toast(e.message, 'err'); });
    }).catch(e => toast(e.message, 'err'));
  });
}
const persistDraft = debounce(() => { const f = S.A.pfm; if (f && !f.id) { store.set('bz_pdraft', Object.assign({}, f, { img: f.imgs.filter(m => !m.up && /^https:/.test(m.url)).map(m => m.url), imgs: undefined })); const t = $('#draftTxt'); if (t) t.textContent = 'Draf disimpan secara automatik sebentar tadi'; } }, 600);
function saveProductForm() {
  const f = S.A.pfm; f.img = f.imgs.filter(m => !m.up).map(m => m.url);
  if (String(f.nama).trim().length < 2) { toast('Nama produk wajib diisi.', 'err'); return; }
  if (!String(f.kat).trim()) { toast('Kategori wajib diisi.', 'err'); return; }
  if (!(Number(f.harga) >= 0) || f.harga === '') { toast('Harga tidak sah.', 'err'); return; }
  const isNewP = !f.id, tmp = Object.assign({}, f, { harga: Number(f.harga), asal: Number(f.asal) || 0, tarikh: f.tarikh || new Date().toISOString().slice(0, 19), terjual: 0, sku: f.sku || 'BZ-NEW', id: f.id || ('tmp_' + nowMs()) });
  delete tmp.imgs;
  const list = D().products; let ref;
  if (isNewP) { list.unshift(tmp); ref = tmp; } else { ref = list.find(x => x.id === f.id); const prev = Object.assign({}, ref); Object.assign(ref, tmp); ref._prev = prev; }
  S.A.pfm = null; store.del('bz_pdraft'); syncPublic(); aGo('products'); toast('Menyimpan produk…');
  saveProductRemote(ref, isNewP).then(r => { const i = list.indexOf(ref); if (i >= 0) { list[i] = r; } syncPublic(); aRender(); toast('Produk "' + r.nama + '" disimpan'); })
    .catch(e => { if (isNewP) list.splice(list.indexOf(ref), 1); else Object.assign(ref, ref._prev); syncPublic(); aRender(); toast('Gagal simpan: ' + e.message, 'err'); });
}
