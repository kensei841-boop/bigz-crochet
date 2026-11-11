/* Lapisan API: fetch() ke Google Apps Script (REST). POST wajib text/plain supaya tiada CORS preflight. */
'use strict';
const apiReady = () => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test((window.APP_CONFIG || {}).GAS_URL || '');
const fetchBoot = () => fetch(APP_CONFIG.GAS_URL + '?action=boot').then(r => r.json());

async function callApi(action, data, token) {
  if (!apiReady()) throw new Error('GAS_URL belum diisi dalam js/config.js');
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(APP_CONFIG.GAS_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, token: token || '', data: data || {} }), signal: ctrl.signal
    });
    return await res.json();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Pelayan terlalu lambat membalas. Cuba lagi.' : 'Tidak dapat menghubungi pelayan. Semak sambungan internet.');
  } finally { clearTimeout(t); }
}
const unwrap = r => { if (!r || !r.success) throw new Error((r && r.message) || 'Ralat tidak diketahui'); return r.data; };
const pub = (a, d) => callApi(a, d).then(unwrap);
const adm = (a, d) => callApi(a, d, S.A.tok).then(unwrap).catch(e => {
  if (e.message === 'SESI_TAMAT') { adminLogout(true); throw new Error('Sesi tamat. Sila log masuk semula.'); }
  throw e;
});
