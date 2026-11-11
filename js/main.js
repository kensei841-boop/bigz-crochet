'use strict';
/* ══════════ Penyalur acara (delegation — satu pendengar untuk semua) ══════════ */
const ACT = {
  go: t => go(t.dataset.v), back: () => goBack(),
  goSearch: () => { go('catalog'); setTimeout(() => { const i = $('#catQ'); if (i) i.focus(); }, 30); },
  adminEntry: () => adminEntry(),
  open: t => go('product', { id: t.dataset.id }),
  wish: t => {
    const id = t.dataset.id, i = S.wish.indexOf(id); if (i >= 0) S.wish.splice(i, 1); else S.wish.push(id); store.set('bz_wish', S.wish);
    const on = S.wish.indexOf(id) >= 0; $$('[data-act=wish][data-id="' + id + '"]').forEach(b => { b.classList.toggle('on', on); const ic = b.querySelector('i'); if (ic) { ic.className = 'bi bi-heart' + (on ? '-fill' : ''); ic.style.color = on && b.classList.contains('ib') ? '#e5484d' : ''; } });
    toast(on ? 'Ditambah ke kegemaran' : 'Dibuang daripada kegemaran');
  },
  quick: t => { const p = P(t.dataset.id); if (!p) return; addCart(p.id, 1, ''); toast(p.nama + ' ditambah ke troli'); renderSticky(); },
  cat: t => { S.cat = t.dataset.k; S.shown = 8; if (S.view !== 'catalog') go('catalog'); else updCatalog(); },
  more: () => { S.shown += 8; updCatalog(); },
  custom: () => openExt(waLink(S.set.no_whatsapp, 'Hai ' + S.set.nama_perniagaan + ', saya berminat membuat tempahan kustom (warna / saiz / reka bentuk khas).')),
  gal: t => { const g = $('#galT'); g.scrollBy({ left: g.clientWidth * Number(t.dataset.d), behavior: 'smooth' }); },
  pq: t => { S.qty = Math.max(1, Math.min(5, S.qty + Number(t.dataset.d))); $('#pqty').textContent = S.qty; const p = P(S.pid); if (p) $('#pTot').textContent = rm(p.harga * S.qty); },
  addDetail: () => { addCart(S.pid, S.qty, S.note.trim()); toast('Ditambah ke pesanan'); go('cart'); },
  cdel: t => { S.cart.splice(Number(t.dataset.i), 1); saveCart(); updCart(); },
  cq: t => { const l = S.cart[Number(t.dataset.i)]; if (!l) return; l.qty = Math.max(1, Math.min(5, l.qty + Number(t.dataset.d))); saveCart(); updCart(); },
  submit: () => submitOrder(),
  copy: t => copyText(t.dataset.t),
  payTab: t => { S.payTab = t.dataset.k; R.status(); },
  track: t => {
    const id = $('#t_id').value.trim(), tel = $('#t_tel').value.trim(); if (!id || !tel) { toast('Isi ID tempahan dan nombor telefon.', 'err'); return; }
    busy(t, true, 'Menyemak…'); pub('trackOrder', { id: id, telefon: tel }).then(r => { S.last = r; store.set('bz_last', r); go('status'); }).catch(e => { busy(t, false); toast(e.message, 'err'); });
  },
  acc: t => t.parentNode.classList.toggle('open'),
  dark: t => { const on = document.documentElement.dataset.theme !== 'dark'; setDark(on); t.classList && t.classList.contains('toggle') && t.classList.toggle('on', on); if (D() && !$('#adm').hidden && (S.A.view === 'dash' || S.A.view === 'reports')) aRender(); },
  modalClose: () => modalClose(), confirmYes: () => { const f = _cb; modalClose(); if (f) f(); },
  eye: t => { const i = $('#l_p'); i.type = i.type === 'password' ? 'text' : 'password'; t.querySelector('i').className = 'bi bi-eye' + (i.type === 'text' ? '-slash' : ''); },
  forgot: () => modal('<div class="mh"><h3 class="h-m">Lupa kata laluan?</h3></div><p class="t2">Demi keselamatan, kata laluan tidak boleh ditetapkan semula melalui emel. Buka projek Apps Script anda, pilih fungsi <b>resetKataLaluanAdmin</b> dan tekan Run. Kata laluan baharu akan dipaparkan sekali dalam Execution Log.</p><div class="mf"><button class="btn btn-p" data-act="modalClose">Faham</button></div>'),
  toShop: () => { if (D()) syncPublic(); S.stack = []; go('home'); },
  logout: () => adminLogout(false),
  toSecurity: () => { modalClose(); S.A.stab = 'sec'; aGo('settings'); },
  sideOpen: () => { $('#aSide').classList.add('open'); $('.a-scrim').classList.add('on'); },
  sideClose: () => { $('#aSide').classList.remove('open'); $('.a-scrim').classList.remove('on'); },
  aGo: t => aGo(t.dataset.v),
  dsh: t => { S.A.dsh = t.dataset.k; ARV.dash(); },
  pNew: () => aGo('pform', 'new'),
  bNew: () => { S.A.cu.tab = 'hantar'; aGo('cust'); },
  oView: t => aGo('order', t.dataset.id),
  oPage: t => { S.A.of.page = Number(t.dataset.p); updOrders(); },
  oFilt: t => { S.A.of.st = t.dataset.k; S.A.of.page = 1; if (S.A.view !== 'orders') aGo('orders'); else updOrders(); },
  oRefresh: t => aRefresh(t),
  oCSV: () => { const rows = [['ID Tempahan', 'Tarikh', 'Pelanggan', 'Telefon', 'Alamat', 'Barangan', 'Subtotal', 'Penghantaran', 'Jumlah', 'Kaedah', 'Status', 'No Invois']].concat(ordFilter().map(o => [o.id, o.tarikh, o.nama, o.tel, o.alamat, o.items.map(i => i.nama + ' x' + i.qty).join('; '), o.subtotal, o.caj, o.jumlah, o.kaedah, o.status, o.invois])); download('tempahan.csv', 'text/csv;charset=utf-8', [toCSV(rows)]); },
  oManual: () => { S.A.mo = null; manualModal(); },
  mAdd: () => { S.A.mo.rows.push({ id: '', qty: 1 }); const keep = ['m_nama', 'm_tel', 'm_alamat', 'm_emel', 'm_nota'].map(i => $('#' + i).value); manualModal(); ['m_nama', 'm_tel', 'm_alamat', 'm_emel', 'm_nota'].forEach((i, k) => { $('#' + i).value = keep[k]; }); },
  mSave: t => {
    const items = S.A.mo.rows.filter(r => r.id).map(r => ({ id: r.id, qty: r.qty })); busy(t, true, 'Mencipta…');
    adm('createOrder', { nama: $('#m_nama').value, telefon: $('#m_tel').value, alamat: $('#m_alamat').value, emel: $('#m_emel').value, nota: $('#m_nota').value, items: items, kaedah: 'Manual' })
      .then(r => { D().orders.unshift(r.order); modalClose(); aRender(); toast('Tempahan ' + r.order.id + ' dicipta'); adm('bootstrap').then(d => { S.A.d = d; }).catch(() => { }); }).catch(e => { busy(t, false); toast(e.message, 'err'); });
  },
  oBulk: () => { if (!selIds().length) { toast('Pilih sekurang-kurangnya satu tempahan.', 'err'); return; } modal('<div class="mh"><h3 class="h-m">Kemas Kini Status Berkelompok</h3></div><p class="t2 mb12">' + selIds().length + ' tempahan dipilih.</p><select class="in" id="bulkSt">' + STS.map(s => '<option>' + s + '</option>').join('') + '</select><div class="mf"><button class="btn btn-w" data-act="modalClose">Batal</button><button class="btn btn-p" data-act="bulkGo">Kemas Kini</button></div>'); },
  bulkGo: () => { const s = $('#bulkSt').value, ids = selIds(); modalClose(); S.A.of.sel = {}; setStatus(ids, s); },
  oLabels: () => { const ids = selIds(); if (!ids.length) { toast('Pilih sekurang-kurangnya satu tempahan.', 'err'); return; } printHtml('<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' + ids.map(id => D().orders.find(o => o.id === id)).filter(Boolean).map(o => '<div class="paper" style="min-width:0;border:2px dashed #999;border-top:2px dashed #999;box-shadow:none"><b>KEPADA:</b><br><b style="font-size:15px">' + esc(o.nama) + '</b><br>' + esc(o.tel) + '<br>' + esc(o.alamat) + '<hr><small>Rujukan ' + esc(o.id) + ' · ' + o.items.reduce((a, i) => a + i.qty, 0) + ' unit<br>Dari: ' + esc(D().settings.nama_perniagaan) + ' ' + esc(D().settings.telefon_paparan) + '</small></div>').join('') + '</div>', 'Nota Penghantaran'); },
  oSetSt: t => setStatus([t.dataset.id], $('#oStSel').value),
  oDel: t => confirmBox('Padam tempahan?', 'Tempahan ' + t.dataset.id + ' akan dipadam kekal. Pertimbangkan status Dibatalkan sebagai ganti.', 'Padam', () => { const id = t.dataset.id, i = D().orders.findIndex(o => o.id === id), bak = D().orders[i]; D().orders.splice(i, 1); aGo('orders'); adm('deleteOrder', { id: id }).catch(e => { D().orders.splice(i, 0, bak); aRender(); toast(e.message, 'err'); }); }, true),
  invPrint: t => { const id = t.dataset.id; busy(t, true, 'Menyediakan…'); ensureInvoice(id).then(o => { busy(t, false); printHtml(invHtml(o), 'Invois ' + o.invois); aRender(); }).catch(e => { busy(t, false); toast(e.message, 'err'); }); },
  invPdf: t => invPdf(t.dataset.id, t),
  doPrint: () => window.print(),
  pTog: t => toggleProduct(t.dataset.id),
  pEdit: t => aGo('pform', D().products.find(p => p.id === t.dataset.id)),
  pDel: t => confirmBox('Padam produk?', 'Produk akan dipadam kekal daripada katalog. Gunakan "Tersembunyi" jika mahu simpan.', 'Padam', () => { const id = t.dataset.id, L = D().products, i = L.findIndex(p => p.id === id), bak = L[i]; L.splice(i, 1); syncPublic(); aRender(); adm('deleteProduct', { id: id }).catch(e => { L.splice(i, 0, bak); syncPublic(); aRender(); toast(e.message, 'err'); }); }, true),
  pPage: t => { S.A.pf.page = Number(t.dataset.p); updProducts(); },
  pCSV: () => download('produk.csv', 'text/csv;charset=utf-8', [toCSV([['SKU', 'Nama', 'Kategori', 'Harga', 'Status', 'Tarikh']].concat(D().products.map(p => [p.sku, p.nama, p.kat, p.harga, p.status, p.tarikh])))]),
  pSku: () => { const f = S.A.pfm, k = String(f.kat || 'XX').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'XX'; f.sku = 'BZ-' + k + '-' + pad2(Math.floor(Math.random() * 100)) + Math.floor(Math.random() * 10); $('[data-in=pf_sku]').value = f.sku; persistDraft(); },
  pfTog: t => { const f = S.A.pfm; f.status = f.status === 'Aktif' ? 'Sembunyi' : 'Aktif'; t.classList.toggle('on', f.status === 'Aktif'); persistDraft(); },
  pPick: () => $('#pFile').click(),
  pMain: t => { const i = Number(t.dataset.i), f = S.A.pfm; if (i > 0) { f.imgs.unshift(f.imgs.splice(i, 1)[0]); drawGal(); persistDraft(); } },
  pImgDel: t => { S.A.pfm.imgs.splice(Number(t.dataset.i), 1); drawGal(); persistDraft(); },
  pBack: () => { S.A.pfm = null; aGo('products'); },
  pSave: () => saveProductForm(),
  cTab: t => { S.A.cu.tab = t.dataset.k; S.A.cu.page = 1; ARV.cust(); },
  cPage: t => { S.A.cu.page = Number(t.dataset.p); rCust(); },
  cProd: t => { const u = S.A.cu.prods; u[t.dataset.id] = !u[t.dataset.id]; rCust(); },
  cTok: t => { const a = $('#bMsg'), s = a.selectionStart || a.value.length; a.value = a.value.slice(0, s) + t.dataset.t + a.value.slice(a.selectionEnd || s); S.A.cu.msg = a.value; a.focus(); updBprev(); },
  cReset: () => { S.A.cu.subj = ''; S.A.cu.msg = ''; ARV.cust(); },
  cSendMail: t => {
    const u = S.A.cu, names = D().products.filter(p => u.prods[p.id]).map(p => p.nama); if (!names.length) { toast('Pilih sekurang-kurangnya satu produk.', 'err'); return; }
    const n = Math.min(optedIn().filter(mailOk).length, D().quota); if (!n) { toast('Tiada penerima beremel yang bersetuju, atau kuota habis.', 'err'); return; }
    confirmBox('Hantar hebahan emel?', 'Hebahan akan dihantar kepada ' + n + ' pelanggan yang bersetuju. Tindakan ini tidak boleh dibatalkan.', 'Hantar Sekarang', () => { busy(t, true, 'Menghantar…'); adm('broadcast', { subjek: u.subj, mesej: u.msg, produk: names }).then(r => { D().broadcasts.unshift(r.rec); D().quota = r.quota; ARV.cust(); toast('Hebahan dihantar kepada ' + r.sent + ' pelanggan' + (r.skipped ? ' (' + r.skipped + ' dilangkau — kuota)' : '')); }).catch(e => { busy(t, false); toast(e.message, 'err'); }); });
  },
  cWA: () => { const u = S.A.cu, names = bNames(), url = D().catalogUrl; if (!names) { toast('Pilih sekurang-kurangnya satu produk.', 'err'); return; } modal('<div class="mh"><h3 class="h-m">Senarai Pautan WhatsApp</h3><button class="ib sm" data-act="modalClose" aria-label="Tutup"><i class="bi bi-x-lg"></i></button></div><p class="muted mb12" style="font-size:13px">Klik satu demi satu. Setiap pautan membuka WhatsApp dengan mesej siap diisi.</p>' + (optedIn().map(c => '<div class="flex jb ac g12 pad-s solid mb8" style="border-radius:14px"><div><b>' + esc(c.nama) + '</b><div class="muted" style="font-size:12px">' + esc(c.tel) + '</div></div><a class="btn btn-t btn-s" target="_blank" rel="noopener" href="' + esc(waLink('6' + c.tel.replace(/^0/, ''), tok(u.msg, c, names, url))) + '"><i class="bi bi-whatsapp"></i> Buka</a></div>').join('') || '<p class="muted">Tiada pelanggan yang bersetuju.</p>')); },
  rRange: t => { S.A.rep.range = t.dataset.k; S.A.rep.page = 1; ARV.reports(); },
  rApply: () => { S.A.rep.range = 'custom'; S.A.rep.from = $('#rFrom').value; S.A.rep.to = $('#rTo').value; S.A.rep.page = 1; ARV.reports(); },
  rPage: t => { S.A.rep.page = Number(t.dataset.p); rReport(); },
  rCSV: () => { const x = repData(); download('laporan-jualan.csv', 'text/csv;charset=utf-8', [toCSV([['Tarikh', 'ID Tempahan', 'Pelanggan', 'Barangan', 'Kaedah', 'Status', 'Jumlah (RM)']].concat(x.all.map(o => [o.tarikh, o.id, o.nama, o.items.map(i => i.nama + ' x' + i.qty).join('; '), o.kaedah, o.status, o.jumlah])).concat([['', '', '', '', '', 'JUMLAH', x.rev]]))]); },
  rPrint: () => { const x = repData(); printHtml('<div class="paper"><h2>Laporan Jualan — ' + esc(D().settings.nama_perniagaan) + '</h2><p>Tempoh: ' + fD(x.rg[0].toISOString()) + ' – ' + (x.rg[1].getFullYear() > 2090 ? 'Kini' : fD(x.rg[1].toISOString())) + '</p><p>Jumlah pendapatan: <b>' + rm(x.rev) + '</b> · ' + x.n + ' tempahan · AOV ' + rm(x.n ? x.rev / x.n : 0) + '</p><table class="inv-t mt16"><thead><tr><th>Tarikh</th><th>ID</th><th>Pelanggan</th><th>Status</th><th>Jumlah</th></tr></thead><tbody>' + x.all.map(o => '<tr><td>' + fD(o.tarikh) + '</td><td>' + esc(o.id) + '</td><td>' + esc(o.nama) + '</td><td>' + esc(o.status) + '</td><td>' + rm(o.jumlah) + '</td></tr>').join('') + '</tbody></table></div>', 'Laporan Jualan'); },
  sTab: t => { S.A.stab = t.dataset.k; ARV.settings(); },
  sPick: t => $(t.dataset.k === 'logo' ? '#logoFile' : '#qrFile').click(),
  sClr: t => { S.A.sf[t.dataset.k] = ''; ARV.settings(); },
  sSave: () => saveSettings(),
  sReset: () => { S.A.sf = {}; applyTheme(D().settings); ARV.settings(); toast('Dikembalikan kepada nilai tersimpan'); },
  pwSave: t => {
    const o = $('#p_old').value, n = $('#p_new').value; if (n !== $('#p_new2').value) { toast('Pengesahan kata laluan tidak sepadan.', 'err'); return; }
    busy(t, true, 'Menyimpan…'); adm('changePassword', { old: o, nw: n }).then(() => { D().mustChange = false; toast('Kata laluan berjaya ditukar'); ARV.settings(); }).catch(e => { busy(t, false); toast(e.message, 'err'); });
  }
};
function updBprev() { const u = S.A.cu, op = optedIn(), p = $('#bPrev'), c = $('#bCnt'); if (p) p.textContent = tok(u.msg, op[0] || { nama: 'Pelanggan' }, bNames() || '(pilih produk)', D().catalogUrl); if (c) c.textContent = u.msg.length + ' / 1500 patah perkataan'; }

const INP = {
  catQ: debounce(el => { S.q = el.value; S.shown = 8; updCatalog(); }, 200),
  sort: el => { S.sort = el.value; updCatalog(); },
  pnote: el => { S.note = el.value; },
  f_hp: el => { S.form.hp = el.value; },
  f_nama: el => { S.form.nama = el.value; saveForm(); }, f_alamat: el => { S.form.alamat = el.value; saveForm(); }, f_emel: el => { S.form.emel = el.value; saveForm(); }, f_nota: el => { S.form.nota = el.value; saveForm(); },
  f_telefon: el => { S.form.telefon = el.value; saveForm(); const ok = /^(\+?60|0)1\d{8,9}$/.test(el.value.replace(/[\s-]/g, '')), c = $('#telOk'); if (c) c.hidden = !ok; },
  f_setuju: el => { S.form.setuju = el.checked; saveForm(); },
  oselAll: el => { const f = S.A.of, v = ordFilter().slice((f.page - 1) * PG, f.page * PG); v.forEach(o => { if (el.checked) f.sel[o.id] = 1; else delete f.sel[o.id]; }); updOrders(); },
  osel: el => { if (el.checked) S.A.of.sel[el.dataset.id] = 1; else delete S.A.of.sel[el.dataset.id]; $('#oSelCnt').textContent = 'Pilih Semua (' + selIds().length + ' dipilih)'; },
  ostat: el => setStatus([el.dataset.id], el.value),
  oq: debounce(el => { S.A.of.q = el.value; S.A.of.page = 1; updOrders(); }, 200),
  orange: el => { S.A.of.range = el.value; S.A.of.page = 1; updOrders(); },
  pq: debounce(el => { S.A.pf.q = el.value; S.A.pf.page = 1; updProducts(); }, 200),
  pkat: el => { S.A.pf.kat = el.value; S.A.pf.page = 1; updProducts(); }, pst: el => { S.A.pf.st = el.value; S.A.pf.page = 1; updProducts(); },
  cq: debounce(el => { S.A.cu.q = el.value; S.A.cu.page = 1; rCust(); const i = $('[data-in=cq]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250),
  ccons: el => { S.A.cu.cons = el.value; S.A.cu.page = 1; rCust(); },
  bSubj: el => { S.A.cu.subj = el.value; }, bMsg: el => { S.A.cu.msg = el.value; updBprev(); },
  rq: debounce(el => { S.A.rep.q = el.value; S.A.rep.page = 1; rReport(); const i = $('[data-in=rq]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250),
  mrow_id: el => { S.A.mo.rows[Number(el.dataset.i)].id = el.value; }, mrow_qty: el => { S.A.mo.rows[Number(el.dataset.i)].qty = Math.max(1, Math.min(5, parseInt(el.value, 10) || 1)); }
};
function inpGeneric(el) {
  const n = el.dataset.in;
  if (n.indexOf('pf_') === 0 && S.A.pfm) { const k = n.slice(3); S.A.pfm[k] = el.type === 'checkbox' ? el.checked : el.value; if (k === 'desc') { const c = $('#dCnt'); if (c) c.textContent = el.value.length + ' aksara'; } persistDraft(); return true; }
  if (n.indexOf('s_') === 0 && D()) {
    const k = n.slice(2); let v = el.value;
    if (k.indexOf('warna_') === 0) { if (/^#?[0-9a-fA-F]{6}$/.test(v)) { v = (v[0] === '#' ? v : '#' + v).toLowerCase(); S.A.sf[k] = v; applyTheme(Object.assign({}, D().settings, S.A.sf)); $$('[data-in=s_' + k + ']').forEach(e => { if (e !== el) e.value = e.type === 'color' ? v : v.toUpperCase(); }); updPrev(); } return true; }
    S.A.sf[k] = v; if (k === 'invois_prefix' || k === 'invois_seterusnya') { const p = $('#invPrev'); if (p) p.textContent = sv('invois_prefix') + pad4(sv('invois_seterusnya')); } else if (k === 'nama_perniagaan' || k === 'hero_tajuk') updPrev(); return true;
  }
  return false;
}
function wire() {
  document.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (!t) return; const f = ACT[t.dataset.act]; if (f) { if (t.tagName === 'A' && !t.target) e.preventDefault(); f(t, e); } });
  const onIn = e => {
    const el = e.target; if (el.id === 'pFile' || el.id === 'logoFile' || el.id === 'qrFile') return;
    const n = el.dataset && el.dataset.in; if (!n) return;
    if (INP[n]) INP[n](el, e); else inpGeneric(el);
  };
  document.addEventListener('input', e => { const el = e.target; if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date') return; onIn(e); }); document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'pFile') { addImages(el.files, 'produk', 'pfm'); el.value = ''; return; }
    if (el.id === 'logoFile' || el.id === 'qrFile') { const key = el.id === 'logoFile' ? 'logo_url' : 'qr_url'; addImages(el.files, 'aset', u => { S.A.sf[key] = u; ARV.settings(); toast('Imej dimuat naik. Tekan Simpan untuk menerapkan.'); }); el.value = ''; return; }
    if (el.type !== 'checkbox' && el.tagName !== 'SELECT' && el.type !== 'date') return; onIn(e);
  });
  document.addEventListener('submit', e => { if (e.target.id === 'loginForm') { e.preventDefault(); doLogin(); } });
  document.addEventListener('dragover', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  document.addEventListener('dragleave', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) d.classList.remove('over'); });
  document.addEventListener('drop', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.remove('over'); addImages(e.dataTransfer.files, 'produk', 'pfm'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) modalClose(); });
}

/* ══════════ Mula (frontend statik: data dimuat dari API GAS) ══════════ */
function startApp(b) {
  S.prods = b.products || []; S.set = b.settings || {};
  S.cart = S.cart.filter(l => l && l.id && l.qty > 0);
  applyTheme(S.set); renderHead(); go('home');
  const sp = $('#splash'); sp.classList.add('off'); setTimeout(() => { sp.hidden = true; }, 260);
}
function refreshPublic(b) {            // data segar tiba selepas paparan dari cache
  S.prods = b.products || []; S.set = b.settings || {}; applyTheme(S.set); renderHead();
  if (!$('#pub').hidden && (S.view === 'home' || S.view === 'catalog')) R[S.view]({ back: true });
  if (S.view === 'cart') updCart();
}
function bootError(msg) {
  const sp = $('#splash'); sp.classList.remove('off'); sp.hidden = false;
  sp.innerHTML = '<div class="card pad tc" style="max-width:420px;margin:16px"><h3 class="h-m">Tidak dapat memuat katalog</h3><p class="t2 mt8">' + esc(msg) + '</p><button class="btn btn-p mt12" onclick="location.reload()">Cuba Lagi</button></div>';
}
(async function init() {
  if (store.get('bz_dark', 0)) setDark(true);
  wire();
  if (!apiReady()) { bootError('Konfigurasi belum lengkap: isi GAS_URL dalam js/config.js.'); return; }
  const cached = store.get('bz_boot', null);
  if (cached && cached.products) startApp(cached);                       // paparan serta-merta dari cache
  let res = null;
  try { res = await (window.__BOOT_P || fetchBoot()); } catch (e) { res = null; }
  if (res && res.success && res.data) {
    store.set('bz_boot', res.data);
    if (!cached) startApp(res.data); else if (cached.ts !== res.data.ts) refreshPublic(res.data);
  } else if (!cached) {
    bootError((res && res.message) || 'Pelayan tidak dapat dihubungi. Semak sambungan internet anda.');
  }
})();
