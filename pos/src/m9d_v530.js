/* v5.3.0 — hardware barcode scanner (Bluetooth / USB "keyboard mode") works on every page, no need to tap a box first */
const SCAN_LOG = [];
const scanFind = c => { const v = String(c).trim(); if (!v) return null;
  return S.products.find(p => p.barcode === v || p.sku === v) || S.products.find(p => (p.units || []).some(u => u.barcode === v)) || null; };

let handleScan = function (code, src) {
  code = String(code).trim().replace(/[\r\n\t]/g, ''); if (code.length < 3) return;
  let qty = 1; const mm = code.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qty = num(mm[1]); code = mm[2]; }
  const hit = scanFind(code);
  SCAN_LOG.unshift({ code, at: Date.now(), hit: hit?.name || '' }); SCAN_LOG.length = Math.min(SCAN_LOG.length, 5);
  document.dispatchEvent(new CustomEvent('pos-scan', { detail: { code, hit } }));
  if ($('#scanLive')) return; // settings test box shows the result itself
  // an open dialog that already knows how to scan (stock count, picker, quick receive…) gets the code
  const box = $('.mbg:last-of-type #scq, .mbg:last-of-type #pp, .mbg:last-of-type #puq, .mbg:last-of-type #cq0');
  if (box) { box.value = (qty !== 1 ? qty + '*' : '') + code; box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return; }
  if ($('.mbg')) { if (!hit) { sfx('error'); toast(`บาร์โค้ด ${code} — ไม่พบสินค้า`, 'bad'); } return; }
  const pg = S.page;
  if (pg === 'receive' && $('#radd')) { const a = $('#radd'); a.value = code; a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return; }
  if (['stock', 'products', 'count'].includes(pg)) return stockLookup(code, () => go(pg));
  // cashier (and any other page): sell it
  if (!hit) return unknownBarcode(code);
  if (pg !== 'pos') go('pos');
  sfx('scan'); addToCart(hit, qty);
};

(() => {
  const TYPING = 'input:not([data-scan]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]):not([type=file]),textarea,select,[contenteditable=true]';
  let buf = '', last = 0, fast = 0, idle = 0;
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target, inField = t && t.matches?.(TYPING);
    const now = Date.now(), gap = now - last; last = now;
    if (gap > 120) { buf = ''; fast = 0; }
    if (e.key === 'Enter' || e.key === 'Tab') {
      clearTimeout(idle); const cv = t && t.dataset?.scan !== undefined ? t.value.trim() : ''; if (cv) t.value = ''; const code = buf.length >= 3 ? buf : cv; if (cv && code === cv) fast = 99; const wasFast = fast >= Math.max(2, code.length - 2); buf = ''; fast = 0;
      if (code.length >= 3 && (!inField || wasFast)) {
        // typed by a scanner: take it over (also when a non-scan field like the search box has focus)
        if (inField && t.id !== 'scanLive') {
          const isScanBox = ['ps', 'psearch', 'radd', 'scq', 'pp', 'puq', 'cq0', 'scanTest', 'gq'].includes(t.id);
          const strip = () => { t.value = t.value.slice(0, Math.max(0, t.value.length - code.length)); };
          if (!isScanBox) { // e.g. the barcode box in the product form: just make sure it holds the real code
            if (/barcode|sku|code/i.test((t.name || '') + (t.id || '') + (t.placeholder || '')) && t.value.slice(-code.length) !== code) { strip(); t.value += code; t.dispatchEvent(new Event('input', { bubbles: true })); }
            return;
          }
          strip(); t.dispatchEvent(new Event('input', { bubbles: true }));
        }
        e.preventDefault(); e.stopPropagation(); handleScan(code, 'kbd'); return;
      }
      return;
    }
    if (e.key && e.key.length === 1) {
      if (gap < 60) fast++;
      // physical key code → same digits/letters whatever keyboard language (Thai layout turns 8 into ค)
      const c = e.code || '', d = c.match(/^(?:Digit|Numpad)(\d)$/), k = c.match(/^Key([A-Z])$/);
      buf += (c === 'Digit8' && e.shiftKey) ? '*' : d ? d[1] : k ? (e.shiftKey ? k[1] : k[1].toLowerCase()) : ({ Minus: '-', Period: '.', Slash: '/', NumpadDecimal: '.', NumpadMultiply: '*' }[c] || e.key);
      clearTimeout(idle); idle = setTimeout(() => { if (buf.length >= 6 && fast >= buf.length - 2 && !document.activeElement?.matches?.(TYPING)) { const code = buf; buf = ''; fast = 0; handleScan(code, 'idle'); } }, 160);
      if (!inField) e.preventDefault(); // keep stray characters from scrolling / triggering shortcuts
    }
  }, true);
})();

/* settings → scanner card: plain explanation + live test that works without tapping anything */
const _settings530 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings530(pg);
  const old = $('#scanTest', pg); if (old) old.closest('.fg')?.remove();
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('afterbegin', `<div class="card scan-card" id="scanCard"><h3 style="margin-top:0">🔫 เครื่องสแกนบาร์โค้ด</h3>
    <ol class="scan-steps">
      <li>เปิดเครื่องสแกน แล้วจับคู่ใน <b>ตั้งค่า Bluetooth ของโทรศัพท์/แท็บเล็ต</b> (เครื่องจะขึ้นเป็นคีย์บอร์ด) — <b>ไม่ต้องเลือกอุปกรณ์ในแอป</b></li>
      <li>เครื่องสแกนต้องอยู่ในโหมด <b>HID / Keyboard</b> และส่ง <b>Enter</b> หลังรหัส (ค่าเริ่มต้นของเครื่องส่วนใหญ่)</li>
      <li>สแกนได้ทุกหน้า ไม่ต้องแตะช่องค้นหา: หน้าขาย = ใส่ตะกร้า · รับสินค้าเข้า = เพิ่มรายการ · สต๊อก = เปิดการ์ดสินค้า</li></ol>
    <div class="scan-live" id="scanLive" tabindex="0"><div class="sl-ic">📡</div><div><b>ทดสอบ: สแกนบาร์โค้ดได้เลยตอนนี้</b><div class="muted" id="scanRes">รอสแกน…</div></div></div>
    <p class="muted" style="font-size:12px;margin:8px 0 0">ถ้าสแกนแล้วไม่มีอะไรขึ้นเลย: ปิด-เปิดเครื่องสแกน / ลบการจับคู่แล้วจับคู่ใหม่ / เช็กว่าแบตเตอรี่เครื่องสแกนไม่หมด · ถ้าตัวอักษรเพี้ยน ให้ตั้งภาษาคีย์บอร์ดเป็นอังกฤษ (EN)</p></div>`);
  const onScan = e => { const r = $('#scanRes'); if (!r) return document.removeEventListener('pos-scan', onScan);
    const { code, hit } = e.detail; sfx(hit ? 'scan' : 'error');
    r.innerHTML = hit ? `<span class="chip ok">✓ เชื่อมต่อแล้ว</span> <code>${esc(code)}</code> → <b>${esc(hit.name)}</b> (คงเหลือ ${qtyf(hit.stock)})`
      : `<span class="chip ok">✓ เครื่องสแกนทำงาน</span> <code>${esc(code)}</code> <span class="chip warn">ยังไม่มีสินค้าที่ใช้บาร์โค้ดนี้</span>${canDo('edit_products') ? ` <button class="btn sm p" id="scanNew">＋ ผูก/เพิ่มสินค้า</button>` : ''}`;
    const b = $('#scanNew'); if (b) b.onclick = () => unknownBarcode(code);
    $('#scanLive')?.classList.add('got'); setTimeout(() => $('#scanLive')?.classList.remove('got'), 600); };
  document.addEventListener('pos-scan', onScan);
};

/* v5.3.1 — every scan pops a big product card (picture, name, price, stock, qty in cart) */
function scanPop(p) {
  $('#scanPop')?.remove(); clearTimeout(scanPop._t);
  const inCart = S.cart.filter(l => l.product_id === p.id).reduce((a, l) => a + num(l.qty), 0);
  const bg = p.tile_color || catColor(p.category_id);
  const pic = isImg(p) ? `<div class="spp-img" style="background-image:url('${esc(p.image_url)}')"></div>` : `<div class="spp-img ph" style="background:${esc(bg)}">${esc((p.name || '?').trim().charAt(0))}</div>`;
  const low = p.track_stock && num(p.stock) - inCart <= num(p.low_stock || 0);
  document.body.insertAdjacentHTML('beforeend', `<div id="scanPop" class="spp"><div class="spp-card">${pic}
    <div class="spp-tx"><small>📡 ${esc(p.barcode || p.sku || '')}</small><b>${esc(p.name)}</b>
      <div class="spp-pr">฿${money(p.price)}<span>/ ${esc(p.unit || 'ชิ้น')}</span></div>
      <div class="spp-row"><span class="chip ok">✓ ในตะกร้า ${qtyf(inCart)}</span>${p.track_stock ? `<span class="chip ${low ? 'warn' : ''}">เหลือ ${qtyf(num(p.stock) - inCart)}</span>` : ''}</div></div></div></div>`);
  const el = $('#scanPop'); el.onclick = () => el.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  scanPop._t = setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); }, 2200);
}
const _handleScan531 = handleScan;
handleScan = function (code, src) {
  const before = S.cart.reduce((a, l) => a + num(l.qty), 0);
  const r = _handleScan531(code, src);
  const c = String(code).trim().replace(/^\d+(?:\.\d+)?\*/, ''), hit = scanFind(c);
  if (hit && S.page === 'pos' && !$('.mbg') && S.cart.reduce((a, l) => a + num(l.qty), 0) > before) scanPop(hit);
  return r;
};
/* the camera button on the cashier uses the same flow */
const _posView531 = VIEWS.pos;
VIEWS.pos = pg => { _posView531(pg); const b = $('#scanBtn'); if (b) b.onclick = () => scanBarcode(code => handleScan(code, 'cam')); };

/* v5.3.2 — invisible "scan catcher": a box that silently keeps focus so the Bluetooth scanner always has somewhere to type
   (inputmode=none → the phone keyboard does NOT pop up) */
(() => {
  const SCAN_PAGES = ['pos', 'receive', 'stock', 'products', 'count'];
  const c = document.createElement('input');
  Object.assign(c, { type: 'text', autocomplete: 'off', spellcheck: false, tabIndex: -1 });
  c.setAttribute('inputmode', 'none'); c.setAttribute('data-scan', ''); c.setAttribute('aria-hidden', 'true'); c.id = 'scanCatch';
  c.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;z-index:-1;pointer-events:none';
  const pill = document.createElement('div'); pill.id = 'scanReady'; pill.innerHTML = '<i></i>พร้อมสแกน';
  document.addEventListener('DOMContentLoaded', () => { document.body.append(c, pill); });
  if (document.body) document.body.append(c, pill);
  const want = () => S.shop && SCAN_PAGES.includes(S.page) && !$('.mbg') && !document.hidden && localStorage.getItem('pos_scan_catch') !== '0';
  const idleEl = el => !el || el === document.body || el === document.documentElement || el === c || !el.matches?.('input,textarea,select,[contenteditable=true]');
  const grab = () => { if (want() && idleEl(document.activeElement) && document.activeElement !== c) try { c.focus({ preventScroll: true }); } catch {} paint(); };
  const paint = () => pill.classList.toggle('on', want() && document.activeElement === c);
  // value typed while key events were "Unidentified": finish after a short pause even without Enter
  let t0; c.addEventListener('input', () => { clearTimeout(t0); t0 = setTimeout(() => { const v = c.value.trim(); if (v.length >= 4) { c.value = ''; handleScan(v, 'catch'); } }, 220); });
  ['focusin', 'focusout', 'pointerup', 'visibilitychange'].forEach(ev => addEventListener(ev, () => setTimeout(grab, 60), true));
  setInterval(grab, 1500);
  const _go532 = go; go = function (...a) { const r = _go532.apply(this, a); setTimeout(grab, 300); return r; };
})();
