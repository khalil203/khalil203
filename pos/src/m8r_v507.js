/* ================= v5.0.7 — fly-out sidebar, discreet fullscreen exit, Thai UI with English option ================= */

/* ---------- sidebar: icon rail that pops out with names ---------- */
const _renderShell507 = renderShell;
renderShell = function () {
  _renderShell507();
  const app = $('#app'), side = $('.side'); if (!app || !side) return;
  if (matchMedia('(min-width:861px)').matches) app.classList.add('mini', 'flyout');
  $('#miniBtn')?.remove();
  if (!$('.fly-pin', side)) {
    side.insertAdjacentHTML('afterbegin', '<button type="button" class="fly-pin" title="แสดงชื่อเมนู">☰</button>');
    $('.fly-pin', side).onclick = e => { e.stopPropagation(); side.classList.toggle('open'); };
  }
  side.addEventListener('click', e => { if (e.target.closest('.nav[data-p]')) side.classList.remove('open'); });
  // tooltips with names for the icons
  $$('.side .nav', side).forEach(n => { const l = $('.lb', n)?.textContent; if (l) n.title = l; });
};
document.addEventListener('pointerdown', e => { const s = $('.side.open'); if (s && !s.contains(e.target)) s.classList.remove('open'); }, true);
matchMedia('(min-width:861px)').addEventListener?.('change', ev => $('#app')?.classList.toggle('flyout', ev.matches));

/* ---------- fullscreen exit: tiny, hides itself, comes back at the top edge ---------- */
syncFsBtn = function () {
  let b = $('#fsExit');
  if (!fsOn()) { b?.remove(); $('#fsZone')?.remove(); return; }
  if (b) return;
  document.body.insertAdjacentHTML('beforeend', '<div id="fsZone"></div><button type="button" id="fsExit" title="ออกจากเต็มจอ" aria-label="ออกจากเต็มจอ"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4"/></svg><span>ออกจากเต็มจอ</span></button>');
  b = $('#fsExit'); b.onclick = toggleFullscreen;
  let t; const peek = () => { b.classList.add('show'); clearTimeout(t); t = setTimeout(() => b.classList.remove('show'), 2500); };
  $('#fsZone').addEventListener('pointerenter', peek); $('#fsZone').addEventListener('pointerdown', peek);
  b.addEventListener('pointerenter', () => clearTimeout(t)); b.addEventListener('pointerleave', peek);
  peek();
};
if (isNativeApp()) window.Capacitor?.Plugins?.App?.addListener?.('backButton', () => { if (fsOn()) toggleFullscreen(); });

/* ---------- language: Thai by default, English on request ---------- */
const I18N_EN = {
  'สินค้า & สต็อก': 'Products & Stock', 'ขายสินค้า': 'Sell', 'ประวัติการขาย': 'Sales history', 'แดชบอร์ด': 'Dashboard', 'เพิ่มเติม': 'More',
  'รับสินค้าเข้า': 'Receive goods', 'ลูกค้า/สมาชิก': 'Customers / Members', 'โปรโมชั่น': 'Promotions', 'สั่งซื้อสินค้า': 'Purchasing', 'ผู้จำหน่าย': 'Suppliers',
  'ค่าใช้จ่าย': 'Expenses', 'รายงาน': 'Reports', 'กะ/ลิ้นชักเงิน': 'Shifts / Cash drawer', 'พนักงาน': 'Staff', 'บันทึกการใช้งาน': 'Activity log', 'บาร์โค้ด': 'Barcodes',
  'ศูนย์ข้อมูล': 'Data center', 'สาขา': 'Branches', 'ตั้งค่า': 'Settings', 'ตั้งค่าทั้งหมด': 'All settings', 'ตั้งค่าเสียง': 'Sound settings',
  'ยอดขายวันนี้': "Today's sales", 'จำนวนบิล': 'Bills', 'กำไรขั้นต้น': 'Gross profit', 'สินค้าคงเหลือ': 'Items in stock', 'ยอดของฉัน': 'My sales', 'เทียบเมื่อวาน': 'vs yesterday',
  'ตะกร้าสินค้า': 'Cart', 'ลูกค้าทั่วไป': 'Walk-in customer', 'แตะเพื่อเลือกสมาชิก': 'Tap to choose a member', 'ยังไม่มีสินค้า': 'Cart is empty',
  'หมายเหตุลูกค้า': 'Customer note', 'ส่วนลดท้ายบิล': 'Bill discount', 'ยอดรวมทั้งหมด': 'Grand total', 'ยอดสุทธิ': 'Net total', 'ชำระเงิน': 'Pay', 'เงินสด': 'Cash', 'สแกนจ่าย': 'QR pay',
  'โอนเงิน': 'Transfer', 'บัตรเครดิต': 'Credit card', 'บัตรเดบิต': 'Debit card', 'เงินทอน': 'Change', 'รับเงินมา': 'Received', 'พอดี': 'Exact', 'ยืนยันชำระเงิน': 'Confirm payment',
  'ทั้งหมด': 'All', 'รายการโปรด': 'Favorites', 'ขายดี': 'Best sellers', 'ขายล่าสุด': 'Recently sold', 'โปรวันนี้': "Today's deals", 'มุมมอง': 'View', 'ใหม่': 'New',
  'สแกนบาร์โค้ด': 'Scan barcode', 'ขายด่วน': 'Quick sale', 'บิลที่พัก': 'Held bills', 'เบิกใช้ส่วนตัว': 'Personal use', 'สรุปยอดวันนี้': "Today's summary", 'พิมพ์ใบเสร็จ': 'Print receipt',
  'พิมพ์บิลล่าสุด': 'Print last bill', 'เปิดจอลูกค้า': 'Customer display', 'จอลูกค้า': 'Customer display', 'เต็มจอ': 'Full screen', 'ออกจากเต็มจอ': 'Exit full screen', 'ปรับหน้าจอขาย': 'Sell screen display',
  'ค้นหาคำสั่ง (Ctrl+K)': 'Command search (Ctrl+K)', 'เพิ่ม': 'Add', 'เพิ่มสินค้า': 'Add product', 'แก้ไข': 'Edit', 'ลบ': 'Delete', 'บันทึก': 'Save', 'ยกเลิก': 'Cancel', 'ปิด': 'Close', 'เสร็จ': 'Done',
  'ค้นหา': 'Search', 'สแกน': 'Scan', 'สินค้า': 'Products', 'สต็อก': 'Stock', 'หมวดหมู่': 'Categories', 'หน่วยนับ': 'Units', 'นำเข้า CSV': 'Import CSV', 'ส่งออก CSV': 'Export CSV',
  'แก้ไขหลายรายการ': 'Bulk edit', 'ใส่รูปอัตโนมัติ': 'Auto pictures', 'ตรวจนับสต็อก (สแกนได้)': 'Stock count (scan)', 'รูปใหญ่': 'Big pictures', 'ตาราง': 'Table', 'ตาราง / ประวัติ': 'Table / history',
  'มูลค่าสต็อก (ราคาทุน)': 'Stock value (cost)', 'มูลค่าสต็อก (ราคาขาย)': 'Stock value (retail)', 'สินค้าที่ติดตามสต็อก': 'Tracked products', 'ใกล้หมด': 'Low stock', 'หมดสต็อก': 'Out of stock', 'หมด': 'Out',
  'ใกล้หมดอายุ (30 วัน)': 'Expiring (30 days)', 'รับเข้า': 'Stock in', 'เบิกออก': 'Stock out', 'ตรวจนับ': 'Count', 'ชำรุด': 'Damaged', 'หมดอายุ': 'Expired', 'แก้ไขสินค้า': 'Edit product',
  'พิมพ์ฉลาก': 'Print labels', 'เปลี่ยนรูป': 'Change picture', 'ความเคลื่อนไหวล่าสุด': 'Recent movements', 'คัดลอกรหัส': 'Copy code', 'เปลี่ยนบาร์โค้ด': 'Change barcode',
  'วันนี้': 'Today', 'เมื่อวาน': 'Yesterday', '7 วันล่าสุด': 'Last 7 days', '30 วันล่าสุด': 'Last 30 days', 'เดือนนี้': 'This month', 'เดือนก่อน': 'Last month', 'กำหนดเอง': 'Custom',
  'ร้าน & แบรนด์': 'Shop & brand', 'การชำระเงิน': 'Payments', 'ใบเสร็จ & อุปกรณ์': 'Receipts & devices', 'เสียง & หน้าจอ': 'Sound & display', 'บัญชี & แอป': 'Account & app',
  'บันทึกการตั้งค่า': 'Save settings', 'ออกจากระบบ': 'Log out', 'ออกจากระบบ?': 'Log out?', 'เปลี่ยนรหัสผ่าน': 'Change password', 'โหมดสี': 'Theme', 'สลับสาขา': 'Switch branch', 'เสียง': 'Sound',
  'การแจ้งเตือน': 'Notifications', 'ออนไลน์': 'Online', 'ออฟไลน์': 'Offline', 'ยังไม่เปิดกะ': 'No open shift', 'สาขา / โปรไฟล์ร้าน': 'Branches / shop profile', 'ร้านที่ใช้งานอยู่': 'Current shop',
  'ใช้งานอยู่': 'In use', '✓ ใช้งานอยู่': '✓ In use', 'จัดการสาขา': 'Manage branches', 'ทุกสาขา': 'All branches', '＋ เพิ่มสาขา': '＋ Add branch', 'สลับ →': 'Switch →',
  'เข้าสู่ระบบ': 'Log in', 'ชื่อผู้ใช้': 'Username', 'รหัสผ่าน': 'Password', 'กำลังโหลดข้อมูลร้าน…': 'Loading shop data…', 'กำลังเริ่มระบบ…': 'Starting…',
  'ภาษา': 'Language', 'ภาพรวม': 'Overview', 'ขาย': 'Sell', 'บิล': 'Bills', 'สมาชิก': 'Members', 'โปร': 'Deals', 'สั่งซื้อ': 'Purchase', 'ผู้ขาย': 'Suppliers', 'รายจ่าย': 'Expenses', 'กะ': 'Shifts', 'ประวัติ': 'Log', 'ข้อมูล': 'Data', 'เหลือ QX1Q': 'Left QX1Q', 'QX1Q รายการ': 'QX1Q items', 'QX1Q บิล': 'QX1Q bills', '🔥 ขายดี': '🔥 Hot', 'ใกล้หมด QX1Q รายการ': 'Low stock: QX1Q items', 'รวมสินค้า QX1Q ชิ้น (QX2Q รายการ)': 'Items QX1Q pcs (QX2Q lines)', 'ไทย': 'Thai', 'อังกฤษ': 'English', 'ประหยัด': 'Save', 'ได้โปรแล้ว': 'Deal applied', 'ราคาปกติ': 'Regular price', 'เจ้าของร้าน': 'Owner', 'ผู้จัดการ': 'Manager', 'พนักงานขาย': 'Cashier',
};
const TH_RX = /[\u0E01-\u0E3A\u0E40-\u0E5B]/;
const I18N_SKIP = '.dtchip,.pcard .img > span,.pm-img > span,.nm,.pm-name,.rcpt,.a4,.sb-brand,.sb-branch b,.brsw b,.ttsw span,.brc-b b,.brmenu b,.cthumb,code,script,style,textarea,[data-notr],.citem .nm,#cats .tab:not([data-c=all]):not([data-c=fav]):not([data-c=best]):not([data-c=recent]):not([data-c=promo])';
let TRC = {}; try { TRC = JSON.parse(localStorage.getItem('pos_tr_en') || '{}'); } catch {}
const trPending = new Set(); let trTimer = null, trBusy = false;
const numTpl = s => { const nums = []; const tpl = s.replace(/[฿]?\d[\d,.:]*/g, m => { nums.push(m); return 'QX' + nums.length + 'Q'; }); return [tpl, nums]; };
const fillTpl = (tpl, nums) => tpl.replace(/QX\s*(\d+)\s*Q/gi, (_, i) => nums[+i - 1] ?? '');
function trLookup(s) {
  const k = s.trim(); if (!k || !TH_RX.test(k)) return null;
  if (I18N_EN[k]) return s.replace(k, I18N_EN[k]);
  const [tpl, nums] = numTpl(k);
  const hit = I18N_EN[tpl] || TRC[tpl];
  if (hit) return s.replace(k, fillTpl(hit, nums));
  if (tpl.length < 400) trPending.add(tpl);
  return null;
}
function trNode(root) {
  if (LANG !== 'en' || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (!TH_RX.test(n.nodeValue) || n.parentElement?.closest(I18N_SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const list = []; while (w.nextNode()) list.push(w.currentNode);
  list.forEach(n => { const r = trLookup(n.nodeValue); if (r && r !== n.nodeValue) n.nodeValue = r; });
  (root.querySelectorAll ? [root, ...root.querySelectorAll('[placeholder],[title],[aria-label]')] : []).forEach(el => {
    if (!el.getAttribute || el.closest?.(I18N_SKIP)) return;
    ['placeholder', 'title', 'aria-label'].forEach(a => { const v = el.getAttribute(a); if (v && TH_RX.test(v)) { const r = trLookup(v); if (r) el.setAttribute(a, r); } });
  });
  if (trPending.size) { clearTimeout(trTimer); trTimer = setTimeout(trFetch, 250); }
}
async function trFetch() {
  if (trBusy || !trPending.size || !navigator.onLine) return;
  trBusy = true;
  const batch = [...trPending].slice(0, 40); batch.forEach(b => trPending.delete(b));
  try {
    const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t&q=' + encodeURIComponent(batch.join('\n')));
    const j = await r.json();
    const out = (j[0] || []).map(x => x[0]).join('').split('\n');
    if (out.length === batch.length) { batch.forEach((k, i) => { const v = out[i].trim(); if (v) TRC[k] = v; }); try { localStorage.setItem('pos_tr_en', JSON.stringify(TRC)); } catch {} }
    else batch.forEach(k => { TRC[k] = TRC[k] || null; });
  } catch (e) { /* offline or blocked: stay Thai */ }
  trBusy = false;
  trNode(document.body);
  if (trPending.size) setTimeout(trFetch, 300);
}
let trObs = null;
function applyLang() {
  document.documentElement.lang = LANG;
  trObs?.disconnect(); trObs = null;
  if (LANG !== 'en') return;
  trNode(document.body);
  trObs = new MutationObserver(ms => { trObs.disconnect(); ms.forEach(m => { if (m.type === 'characterData') trNode(m.target.parentElement); else m.addedNodes.forEach(n => trNode(n.nodeType === 3 ? n.parentElement : n)); });
    trObs.observe(document.body, { childList: true, subtree: true, characterData: true }); });
  trObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
function setLang(l) { if (l === LANG) return; localStorage.setItem('pos_lang', l); location.reload(); }
applyLang();
// language switch: top bar (desktop), profile menu, settings
const _renderShell507b = renderShell;
renderShell = function () {
  _renderShell507b();
  const bell = $('#bell'); if (bell && !$('#langBtn')) {
    bell.insertAdjacentHTML('beforebegin', `<button class="iconbtn bellbtn langbtn" id="langBtn" data-notr title="ภาษา / Language">${LANG === 'en' ? 'EN' : 'TH'}</button>`);
    $('#langBtn').onclick = () => setLang(LANG === 'en' ? 'th' : 'en');
  }
  applyLang();
};
const _profileMenu507 = profileMenu;
profileMenu = function () {
  _profileMenu507();
  const m = $$('.mbg').pop(), g = m && $('.moregrid', m); if (!g) return;
  g.insertAdjacentHTML('afterbegin', `<button data-a3="lang" data-notr><span>🌐</span>${LANG === 'en' ? 'ภาษาไทย' : 'English'}</button>`);
  $('[data-a3]', g).onclick = () => { m.close(); setLang(LANG === 'en' ? 'th' : 'en'); };
};
const _settings507 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings507(pg);
  const scr = $('.card[data-sec="screen"]', pg);
  scr?.insertAdjacentHTML('beforebegin', `<div class="card" data-sec="screen" data-notr><h3 style="margin-top:0">🌐 ภาษา / Language</h3>
    <div class="seg" id="lngSeg"><button type="button" data-l="th" class="${LANG === 'th' ? 'on' : ''}">🇹🇭 ภาษาไทย</button><button type="button" data-l="en" class="${LANG === 'en' ? 'on' : ''}">🇬🇧 English</button></div>
    <p class="muted" style="font-size:12.5px;margin-bottom:0">ค่าเริ่มต้นเป็นภาษาไทย · English mode translates the screens automatically (needs internet the first time, then remembered). Product and customer names stay as you typed them.</p></div>`);
  $$('#lngSeg [data-l]', pg).forEach(b => b.onclick = () => setLang(b.dataset.l));
  if ($('#setq', pg)?.value === '') $('.set-tabs .on', pg)?.click();
};

// English date/time in the top chip
if (LANG === 'en') setInterval(() => { const c = $('#dtchip'); if (!c) return; const d = new Date(); $('b', c).textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); $('small', c).textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }, 1000);

/* v5.0.8 — short captions under the rail icons */
const RAIL_SHORT = { dashboard: 'ภาพรวม', pos: 'ขาย', sales: 'บิล', products: 'สินค้า', stock: 'สต็อก', receive: 'รับเข้า', members: 'สมาชิก', promotions: 'โปร',
  purchases: 'สั่งซื้อ', suppliers: 'ผู้ขาย', expenses: 'รายจ่าย', reports: 'รายงาน', shifts: 'กะ', staff: 'พนักงาน', audit: 'ประวัติ', barcodes: 'บาร์โค้ด', data: 'ข้อมูล', branches: 'สาขา', settings: 'ตั้งค่า' };
const _renderShell508 = renderShell;
renderShell = function () {
  _renderShell508();
  $$('.side .navs .nav[data-p]').forEach(n => { if (!$('.sl', n)) n.insertAdjacentHTML('beforeend', `<span class="sl">${RAIL_SHORT[n.dataset.p] || $('.lb', n)?.textContent || ''}</span>`); });
};

/* v5.0.9 — settings save bar: floating, never hidden behind the tab bar, shows unsaved changes */
const _settings509 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings509(pg);
  const f = $('#stf', pg), row = f && $(':scope > .row', f); if (!row) return;
  row.removeAttribute('style'); row.classList.add('savebar');
  const btn = $('button', row); if (!btn) return;
  btn.classList.add('savebtn');
  row.insertAdjacentHTML('afterbegin', '<span class="sb-state">ยังไม่มีการแก้ไข</span>');
  const st = $('.sb-state', row);
  const dirty = on => { row.classList.toggle('dirty', on); st.textContent = on ? '● มีการแก้ไขที่ยังไม่บันทึก' : 'ยังไม่มีการแก้ไข'; };
  f.addEventListener('input', () => dirty(true)); f.addEventListener('change', () => dirty(true));
  btn.addEventListener('click', () => { setTimeout(() => { if (!$('.mbg')) { dirty(false); st.textContent = '✓ บันทึกแล้ว'; } }, 1200); });
};

/* v5.0.10 — keep floating bars above the bottom tab bar (its height differs per device) */
const setTabH = () => { const t = $('.tabbar'); const h = t && getComputedStyle(t).display !== 'none' ? t.offsetHeight + (parseFloat(getComputedStyle(t).bottom) || 0) : 0; document.documentElement.style.setProperty('--tabh', h + 'px'); };
addEventListener('resize', setTabH); addEventListener('orientationchange', () => setTimeout(setTabH, 300));
const _renderShell510 = renderShell;
renderShell = function () { _renderShell510(); setTabH(); setTimeout(setTabH, 400); };
const _drawCart510 = drawCart;
drawCart = function () { _drawCart510(); const t = $('#cart .ch-t span'); if (t && t.textContent !== 'ตะกร้า' && matchMedia('(max-width:1366px)').matches) t.textContent = 'ตะกร้า'; };
