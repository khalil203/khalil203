/* Shop POS — free, open POS + stock web app.  Data: Supabase.  Hosting: GitHub Pages. */
'use strict';
const VERSION = '5.6.0';
const sb = supabase.createClient(window.POS_CONFIG.url, window.POS_CONFIG.key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });

/* ================= i18n ================= */
const TH = {
  'Sell':'ขาย','Bills':'บิลขาย','Products':'สินค้า','Stock':'สต็อก','Members':'สมาชิก','Suppliers':'ผู้จำหน่าย',
  'Expenses':'ค่าใช้จ่าย','Promotions':'โปรโมชั่น','Reports':'รายงาน','Shifts':'กะ/ลิ้นชักเงิน','Staff':'พนักงาน','Settings':'ตั้งค่า',
  'Search or scan barcode…':'ค้นหาหรือสแกนบาร์โค้ด…','All':'ทั้งหมด','Cart':'ตะกร้า','Clear':'ล้าง','Hold':'พักบิล','Held bills':'บิลที่พัก',
  'Subtotal':'ยอดรวม','Discount':'ส่วนลด','VAT':'ภาษีมูลค่าเพิ่ม','Total':'ยอดสุทธิ','Pay':'ชำระเงิน','Cash':'เงินสด','Transfer':'โอน',
  'Card':'บัตร','Received':'รับเงิน','Change':'เงินทอน','Confirm payment':'ยืนยันชำระเงิน','Exact':'พอดี','Member':'สมาชิก',
  'Add member':'เพิ่มสมาชิก','Points':'แต้ม','Use points':'ใช้แต้ม','Print':'พิมพ์','New sale':'ขายต่อ','Receipt':'ใบเสร็จ',
  'Cart is empty':'ยังไม่มีสินค้า','Name':'ชื่อ','Barcode':'บาร์โค้ด','Price':'ราคาขาย','Cost':'ต้นทุน','Category':'หมวดหมู่',
  'Unit':'หน่วย','Low stock alert':'แจ้งเตือนสต็อกต่ำ','Image URL':'ลิงก์รูปภาพ','Track stock':'ตัดสต็อก','Active':'เปิดขาย',
  'Save':'บันทึก','Cancel':'ยกเลิก','Delete':'ลบ','Edit':'แก้ไข','Add':'เพิ่ม','Add product':'เพิ่มสินค้า','Categories':'หมวดหมู่',
  'Import CSV':'นำเข้า CSV','Export CSV':'ส่งออก CSV','Phone':'เบอร์โทร','Note':'หมายเหตุ','Amount':'จำนวนเงิน','Date':'วันที่',
  'Receive':'รับเข้า','Remove':'เบิกออก','Count':'ตรวจนับ','History':'ประวัติ','Low stock':'สต็อกต่ำ','Qty':'จำนวน',
  'Stock value (cost)':'มูลค่าสต็อก (ทุน)','Retail value':'มูลค่าขาย','Items':'รายการ','Sales':'ยอดขาย','Profit':'กำไร',
  'Gross profit':'กำไรขั้นต้น','Net profit':'กำไรสุทธิ','Avg / bill':'เฉลี่ย/บิล','Top products':'สินค้าขายดี',
  'Low-margin products':'สินค้ากำไรต่ำ','By payment':'แยกตามการชำระ','By hour':'ยอดขายรายชั่วโมง','By day':'ยอดขายรายวัน',
  'By cashier':'แยกตามพนักงาน','Today':'วันนี้','Yesterday':'เมื่อวาน','7 days':'7 วัน','This month':'เดือนนี้','Last month':'เดือนก่อน',
  'Void':'ยกเลิกบิล','Voided':'ยกเลิกแล้ว','Reprint':'พิมพ์ซ้ำ','Bill':'บิล','Cashier':'แคชเชียร์','Open shift':'เปิดกะ',
  'Close shift':'ปิดกะ','Opening cash':'เงินทอนตั้งต้น','Counted cash':'เงินสดที่นับได้','Expected cash':'เงินสดที่ควรมี',
  'Difference':'ส่วนต่าง','Role':'ตำแหน่ง','Invite staff':'เชิญพนักงาน','Pending invites':'คำเชิญที่รอ','Email':'อีเมล',
  'Password':'รหัสผ่าน','Login':'เข้าสู่ระบบ','Register':'สมัครใช้งาน','Logout':'ออกจากระบบ','Your name':'ชื่อของคุณ',
  'Create your shop':'สร้างร้านค้าของคุณ','Shop name':'ชื่อร้าน','Create shop':'สร้างร้าน','Address':'ที่อยู่','Tax ID':'เลขประจำตัวผู้เสียภาษี',
  'VAT mode':'รูปแบบ VAT','No VAT':'ไม่มี VAT','VAT included':'รวม VAT ในราคา','VAT excluded':'บวก VAT เพิ่ม','VAT rate %':'อัตรา VAT %',
  'PromptPay ID (phone / tax ID)':'พร้อมเพย์ (เบอร์โทร / เลขผู้เสียภาษี)','Receipt header':'หัวใบเสร็จ','Receipt footer':'ท้ายใบเสร็จ',
  'Points per 1 baht':'แต้มต่อ 1 บาท','Baht per point':'มูลค่าแต้มละ (บาท)','Paper width (mm)':'ความกว้างกระดาษ (มม.)',
  'Language':'ภาษา','Shops / branches':'ร้าน / สาขา','New branch':'เพิ่มสาขา','Switch':'สลับ','Backup data':'สำรองข้อมูล',
  'Supplier':'ผู้จำหน่าย','Contact':'ผู้ติดต่อ','Type':'ประเภท','Value':'มูลค่า','Min. total':'ยอดขั้นต่ำ','Members only':'เฉพาะสมาชิก',
  'Start':'เริ่ม','End':'สิ้นสุด','Percent %':'เปอร์เซ็นต์ %','Baht':'บาท','Promotion':'โปรโมชั่น','None':'ไม่มี',
  'Total spent':'ยอดซื้อสะสม','Visits':'จำนวนครั้ง','Saved':'บันทึกแล้ว','Deleted':'ลบแล้ว','Are you sure?':'แน่ใจหรือไม่?',
  'Scan':'สแกน','Customer display':'จอลูกค้า','Bill discount':'ส่วนลดท้ายบิล','Item discount':'ส่วนลดสินค้า','Reason':'เหตุผล',
  'Not enough money':'รับเงินไม่พอ','Out of stock':'สินค้าหมด','Owner':'เจ้าของ','Manager':'ผู้จัดการ','Stock keeper':'ฝ่ายสต็อก',
  'Shift open':'กะเปิดอยู่','No open shift':'ยังไม่เปิดกะ','Cash sales':'ขายเงินสด','Bills count':'จำนวนบิล','Tax invoice (ABB)':'ใบกำกับภาษีอย่างย่อ',
  'Scan PromptPay QR to pay':'สแกน QR พร้อมเพย์เพื่อชำระ','Set PromptPay ID in Settings first':'กรุณาตั้งค่าพร้อมเพย์ในหน้าตั้งค่าก่อน',
  'Staff will join automatically when they register/login with this email.':'พนักงานจะเข้าร้านอัตโนมัติเมื่อสมัคร/เข้าสู่ระบบด้วยอีเมลนี้',
  'Check your email to confirm, then login.':'กรุณายืนยันอีเมล แล้วเข้าสู่ระบบ','From':'จาก','To':'ถึง','Product':'สินค้า','Margin':'กำไร %',
  'Payment':'การชำระ','Time':'เวลา','Status':'สถานะ','Refresh':'รีเฟรช','Install app':'ติดตั้งแอป','Required':'จำเป็น',
  'Account':'บัญชี','Version':'เวอร์ชัน','Points earned':'แต้มที่ได้','Points used':'แต้มที่ใช้','Inventory':'คลังสินค้า',
  'CSV columns: name, barcode, sku, category, price, cost, stock, unit':'คอลัมน์ CSV: name, barcode, sku, category, price, cost, stock, unit',
  'Choose file':'เลือกไฟล์','Imported':'นำเข้าแล้ว','Open':'เปิด','Closed':'ปิดแล้ว','Search':'ค้นหา','Color':'สี','Others':'อื่นๆ',
  'Sales report':'รายงานยอดขาย','Discounts':'ส่วนลด','Product cost':'ต้นทุนสินค้า','QR PromptPay':'QR พร้อมเพย์','Remember to print':'พิมพ์ใบเสร็จ',
};
let LANG = localStorage.getItem('pos_lang') || 'th';
const t = k => (LANG === 'th' && TH[k]) || k;

/* ================= utils ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
/* Thai formatting: Baht with configurable decimals, Thai/Arabic digits, พ.ศ./ค.ศ., Asia/Bangkok */
const numLoc = () => 'th-TH' + (S?.shop?.thai_digits ? '-u-nu-thai' : '');
const dateLoc = () => (LANG === 'th' ? 'th-TH' : 'en-GB') + '-u-ca-' + (S?.shop?.era === 'CE' ? 'gregory' : (LANG === 'th' ? 'buddhist' : 'gregory')) + (S?.shop?.thai_digits && LANG === 'th' ? '-nu-thai' : '');
const decs = () => S?.shop?.decimals ?? 2;
const money = n => num(n).toLocaleString(numLoc(), {minimumFractionDigits: decs(), maximumFractionDigits: decs()});
const baht = n => '฿' + money(n);
const qtyf = n => num(n).toLocaleString(numLoc(), {maximumFractionDigits: 3});
const TZ = 'Asia/Bangkok';
const dt = d => new Date(d).toLocaleString(dateLoc(), {day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: TZ});
const dOnly = d => new Date(d).toLocaleDateString(dateLoc(), {day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ});
const dLong = d => new Date(d).toLocaleDateString(dateLoc(), {day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ});
const ymd = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
function toast(msg, kind = '') {
  const el = document.createElement('div'); el.className = 'toast ' + kind;
  el.innerHTML = `<span class="ti">${kind === 'ok' ? '✓' : kind === 'bad' ? '!' : 'i'}</span><span></span>`; el.lastChild.textContent = msg;
  $('#toast').appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 2600);
}
function fail(e) { console.error(e); toast(e?.message || String(e), 'bad'); }
async function q(p) { const { data, error } = await p; if (error) throw error; return data; }
async function fetchAll(build) { // pages past Supabase's 1000-row limit
  let out = [], from = 0;
  for (;;) { const rows = await q(build().range(from, from + 999)); out = out.concat(rows); if (rows.length < 1000) break; from += 1000; }
  return out;
}
function download(name, text, type = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + text], {type: type + ';charset=utf-8'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000);
}
function toCSV(rows, cols) {
  const e = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return [cols.join(','), ...rows.map(r => cols.map(c => e(r[c])).join(','))].join('\n');
}
function parseCSV(text) {
  const rows = []; let row = [], cell = '', inQ = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"' && text[i+1] === '"') { cell += '"'; i++; } else if (c === '"') inQ = false; else cell += c; }
    else if (c === '"') inQ = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i+1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
const ROLE_LABEL = {owner: ['เจ้าของร้าน', 'Owner'], admin: ['ผู้ดูแลระบบ', 'Administrator'], manager: ['ผู้จัดการร้าน', 'Store manager'], cashier: ['พนักงานขาย', 'Cashier'], stock: ['พนักงานสต็อก', 'Stock staff'], accountant: ['พนักงานบัญชี', 'Accountant']};
const ROLE_NAME = r => (ROLE_LABEL[r] || [r, r])[LANG === 'th' ? 0 : 1];

/* ================= state ================= */
const S = {
  user: null, shops: [], shop: null, role: null, page: 'pos',
  products: [], categories: [], customers: [], promotions: [], suppliers: [],
  cart: [], customer: null, promo: null, billDisc: 0, billDiscPct: false, pointsUse: 0, cat: 'all', search: '',
  shift: null, held: JSON.parse(localStorage.getItem('pos_held') || '[]'),
};
const can = (...roles) => roles.includes(S.role) || (S.role === 'admin' && (roles.includes('owner') || roles.includes('manager')));
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('pos-display') : null;

const PAGES = [
  {id:'dashboard', ic:'🏠', name:'Dashboard', perm:'dashboard', roles:[]},
  {id:'pos', ic:'🛒', name:'Sell', roles:['owner','manager','cashier','stock']},
  {id:'sales', ic:'🧾', name:'Bills', roles:['owner','manager','cashier']},
  {id:'products', ic:'📦', name:'Products', roles:['owner','manager','stock']},
  {id:'stock', ic:'🏬', name:'Stock', roles:['owner','manager','stock']},
  {id:'members', ic:'⭐', name:'Members', roles:['owner','manager','cashier']},
  {id:'promotions', ic:'🏷️', name:'Promotions', roles:['owner','manager']},
  {id:'purchases', ic:'📥', name:'Purchasing', perm:'purchasing', roles:[]},
  {id:'suppliers', ic:'🚚', name:'Suppliers', roles:['owner','manager','stock']},
  {id:'expenses', ic:'💸', name:'Expenses', roles:['owner','manager']},
  {id:'reports', ic:'📊', name:'Reports', roles:['owner','manager']},
  {id:'shifts', ic:'💰', name:'Shifts', roles:['owner','manager','cashier']},
  {id:'staff', ic:'👥', name:'Staff', roles:['owner']},
  {id:'audit', ic:'🛡️', name:'Audit log', perm:'audit', roles:[]},
  {id:'settings', ic:'⚙️', name:'Settings', roles:['owner','manager','cashier','stock']},
];

/* ================= modal ================= */
function modal(title, body, {wide = false, foot = '', sheet = false} = {}) {
  const bg = document.createElement('div'); bg.className = 'mbg' + (sheet ? ' sheet' : '');
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><div class="mh"><h3>${esc(title)}</h3><button class="x">×</button></div>
    <div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`;
  document.body.appendChild(bg);
  const close = () => { if (bg.classList.contains('closing')) return; bg.classList.add('closing'); setTimeout(() => bg.remove(), 180); };
  $('.x', bg).onclick = close;
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  bg.close = close;
  return bg;
}
const confirmBox = msg => new Promise(res => {
  const m = modal(t('Are you sure?'), `<p>${esc(msg)}</p>`, {foot: `<button class="btn" data-n>${t('Cancel')}</button><button class="btn bad" data-y>OK</button>`});
  $('[data-n]', m).onclick = () => { m.close(); res(false); };
  $('[data-y]', m).onclick = () => { m.close(); res(true); };
});

/* generic form: fields = [{k,label,type,opts,req,step}] */
function formModal(title, fields, values = {}, onSave, {extraFoot = ''} = {}) {
  const inp = f => {
    const v = f.type === 'color' ? (values[f.k] || f.def || '#6366f1') : (values[f.k] ?? f.def ?? '');
    if (f.type === 'select') return `<select class="in" name="${f.k}">${f.opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    if (f.type === 'check') return `<label class="row"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}> ${esc(f.label)}</label>`;
    if (f.type === 'textarea') return `<textarea class="in" name="${f.k}" rows="3">${esc(v)}</textarea>`;
    return `<input class="in" name="${f.k}" type="${f.type || 'text'}" ${f.step ? `step="${f.step}"` : f.type === 'number' ? 'step="any"' : ''} value="${esc(v)}" ${f.req ? 'required' : ''} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>`;
  };
  const body = `<form id="fm"><div class="grid2">${fields.map(f => `<div class="fg" ${f.full ? 'style="grid-column:1/-1"' : ''}>${f.type === 'check' ? '' : `<label class="f">${esc(f.label)}${f.req ? ' *' : ''}</label>`}${inp(f)}${f.after || ''}</div>`).join('')}</div></form>`;
  const m = modal(title, body, {foot: `${extraFoot}<span class="sp" style="flex:1"></span><button class="btn" data-c>${t('Cancel')}</button><button class="btn p" data-s>${t('Save')}</button>`});
  $('[data-c]', m).onclick = m.close;
  const submit = async () => {
    const fm = $('#fm', m); if (!fm.reportValidity()) return;
    const out = {};
    for (const f of fields) {
      const el = fm.elements[f.k];
      out[f.k] = f.type === 'check' ? el.checked : f.type === 'number' ? (el.value === '' ? (f.def ?? null) : num(el.value)) : el.value.trim();
      if (f.type === 'date' && !out[f.k]) out[f.k] = null;
    }
    const b = $('[data-s]', m); b.disabled = true;
    try { await onSave(out); m.close(); toast(t('Saved'), 'ok'); } catch (e) { fail(e); b.disabled = false; }
  };
  $('[data-s]', m).onclick = submit;
  $('#fm', m).onsubmit = e => { e.preventDefault(); submit(); };
  setTimeout(() => $('#fm input, #fm select', m)?.focus(), 50);
  return m;
}

/* ================= AUTH ================= */
const GOOGLE_SVG = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function renderAuth() {
  const th = LANG === 'th', last = localStorage.getItem('pos_last_user') || '';
  $('#root').innerHTML = `<div class="auth"><div class="card">
    <div class="row"><div class="brandmark">🛒</div><span style="flex:1"></span><button class="tab" id="lng" style="align-self:flex-start">${th ? 'EN' : 'ไทย'}</button></div>
    <h2>Yanisa Shop</h2><p class="muted" style="margin-top:0">${th ? 'เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแลร้าน' : 'Sign in with the username and password from your shop admin'}</p>
    <form id="af">
      <div class="fg"><label class="f" for="au">${th ? 'ชื่อผู้ใช้' : 'Username'}</label><input class="in" id="au" name="user" required autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(last)}"></div>
      <div class="fg"><label class="f" for="ap">${th ? 'รหัสผ่าน' : 'Password'}</label><div class="sbox" style="padding-left:0"><input class="in" id="ap" name="pw" type="password" required autocomplete="current-password"><button type="button" class="clr" id="eye" title="show">👁</button></div></div>
      <button class="btn p lg" style="width:100%">${th ? 'เข้าสู่ระบบ' : 'Sign in'}</button>
    </form>
    <p class="muted" style="font-size:13px;text-align:center;margin-bottom:0">${th ? 'ลืมรหัสผ่าน? ติดต่อเจ้าของร้านหรือผู้ดูแลระบบเพื่อตั้งรหัสใหม่' : 'Forgot your password? Ask the shop owner or admin to reset it.'}</p>
  </div></div>`;
  $('#lng').onclick = () => { LANG = th ? 'en' : 'th'; localStorage.setItem('pos_lang', LANG); renderAuth(); };
  $('#eye').onclick = () => { const p = $('#ap'); p.type = p.type === 'password' ? 'text' : 'password'; };
  setTimeout(() => (last ? $('#ap') : $('#au')).focus(), 50);
  $('#af').onsubmit = async e => {
    e.preventDefault(); const f = e.target; const btn = $('button.p', f); btn.disabled = true;
    const u = f.user.value.trim().toLowerCase().replace(/\s+/g, '.');
    const email = u.includes('@') ? u : `${u}@shoppos.test`;
    const { error } = await sb.auth.signInWithPassword({ email, password: f.pw.value });
    if (error) { btn.disabled = false; sfx?.('error');
      return toast(/banned/i.test(error.message) ? (th ? 'บัญชีนี้ถูกระงับ — ติดต่อผู้ดูแลร้าน' : 'This account is suspended') : (th ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : 'Wrong username or password'), 'bad'); }
    localStorage.setItem('pos_last_user', u);
    boot().catch(fail);
  };
}

function renderCreateShop(first = true) {
  const html = `<form id="sf">
      <div class="fg"><label class="f">${t('Shop name')} *</label><input class="in" name="name" required></div>
      <div class="fg"><label class="f">${t('Phone')}</label><input class="in" name="phone"></div>
      <div class="fg"><label class="f">${t('Address')}</label><input class="in" name="address"></div>
      <button class="btn p lg" style="width:100%">${t('Create shop')}</button></form>`;
  if (first) {
    $('#root').innerHTML = `<div class="auth"><div class="card"><div class="brandmark">🏪</div><h2>${t('Create your shop')}</h2><br>${html}
      <p class="muted" style="font-size:13px">${esc(S.user.email)} · <a href="#" id="lo">${t('Logout')}</a></p></div></div>`;
    $('#lo').onclick = e => { e.preventDefault(); logout(); };
  } else modal(t('New branch'), html);
  $('#sf').onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    try {
      const shop = await q(sb.from('shops').insert({ name: f.name.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim(), owner_id: S.user.id }).select().single());
      localStorage.setItem('pos_shop', shop.id);
      $('.mbg')?.remove();
      await boot();
    } catch (err) { fail(err); }
  };
}

async function logout() { await sb.auth.signOut(); S.user = null; renderAuth(); }

/* ================= BOOT ================= */
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return renderAuth();
  S.user = session.user;
  if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + location.hash);
  const startPage = () => location.hash.slice(1) || (canDo('dashboard') && matchMedia('(min-width:861px)').matches ? 'dashboard' : 'pos');
  // FAST START: this device already has this user's shop data → show it at once, refresh from the server in the background
  try {
    const cs = localStorage.getItem('pos_cache_uid') === S.user.id ? JSON.parse(localStorage.getItem('pos_shops_cache') || '[]') : [];
    const want = localStorage.getItem('pos_shop'), shop = cs.find(s => s.id === want) || cs[0];
    const master = shop && JSON.parse(localStorage.getItem('pos_cache_' + shop.id) || 'null');
    if (shop && master && master.products) {
      S.shops = cs; S.shop = shop; S.role = shop._role; Object.assign(S, master);
      renderShell(); go(startPage());
      bootRefresh().catch(() => {});
      return;
    }
  } catch (e) { /* bad cache → normal start */ }
  await loadMembership();
  if (!S.shops.length) { await sb.auth.signOut(); renderAuth(); return toast(LANG === 'th' ? 'บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าร้าน — ติดต่อผู้ดูแลร้าน' : 'This account has no shop access yet — ask the shop admin', 'bad'); }
  const want = localStorage.getItem('pos_shop');
  S.shop = S.shops.find(s => s.id === want) || S.shops[0];
  S.role = S.shop._role;
  localStorage.setItem('pos_shop', S.shop.id);
  await loadMaster();
  renderShell();
  go(startPage());
}
async function loadMembership() {
  const memQ = () => q(sb.from('shop_members').select('role, permissions, active, display_name, username, shop:shops(*)').eq('user_id', S.user.id));
  try {
    // invites and membership are asked at the same time; ask again only if an invite just added a shop
    const [, first] = await Promise.all([sb.rpc('accept_invites').then(r => r, () => null), memQ()]);
    let mems = first; if (!mems.some(m => m.shop && m.active !== false)) mems = await memQ();
    S.shops = mems.filter(m => m.shop && m.active !== false).map(m => ({ ...m.shop, _role: m.role, _perms: m.permissions, _name: m.display_name, _username: m.username }));
    localStorage.setItem('pos_shops_cache', JSON.stringify(S.shops)); localStorage.setItem('pos_cache_uid', S.user.id);
  } catch (e) {
    S.shops = localStorage.getItem('pos_cache_uid') === S.user.id ? JSON.parse(localStorage.getItem('pos_shops_cache') || '[]') : [];
    if (!S.shops.length) throw e;
    setTimeout(() => toast(LANG === 'th' ? 'ออฟไลน์ — ใช้ข้อมูลที่บันทึกไว้ในเครื่อง' : 'Offline — using data saved on this device', 'bad'), 500);
  }
}
/* after a fast start: check access + fresh data, then quietly redraw */
async function bootRefresh() {
  if (!navigator.onLine) return;
  const oldRole = S.role, shopId = S.shop.id;
  await loadMembership();
  const fresh = S.shops.find(s => s.id === shopId);
  if (!fresh) { if (!S.shops.length) { await sb.auth.signOut(); return renderAuth(); } localStorage.removeItem('pos_shop'); return boot(); }
  S.shop = fresh; S.role = fresh._role;
  await loadMaster();
  const busy = $('.mbg') || (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.value);
  if (S.role !== oldRole) { renderShell(); go(S.page || 'pos'); return; }
  if (busy) return;
  if (S.page === 'pos') { try { if (!S.cart.length) drawGrid(); loadPosStats?.(); } catch {} }
  else if (['stock', 'products', 'barcodes'].includes(S.page)) go(S.page);
}

async function loadMaster() {
  const id = S.shop.id, ck = 'pos_cache_' + id;
  try { await loadMasterOnline(id); localStorage.setItem(ck, JSON.stringify({products: S.products, categories: S.categories, customers: S.customers, promotions: S.promotions, suppliers: S.suppliers, shift: S.shift}));
  } catch (e) { const c = JSON.parse(localStorage.getItem(ck) || 'null'); if (!c) throw e; Object.assign(S, c); }
}
async function loadMasterOnline(id) {
  const [p, c, cu, pr, su, sh] = await Promise.all([
    fetchAll(() => sb.from('products').select('*').eq('shop_id', id).order('name')),
    q(sb.from('categories').select('*').eq('shop_id', id).order('sort').order('name')),
    fetchAll(() => sb.from('customers').select('*').eq('shop_id', id).order('name')),
    q(sb.from('promotions').select('*').eq('shop_id', id).order('name')),
    q(sb.from('suppliers').select('*').eq('shop_id', id).order('name')),
    q(sb.from('shifts').select('*').eq('shop_id', id).eq('user_id', S.user.id).is('closed_at', null).order('opened_at', {ascending: false}).limit(1)),
  ]);
  Object.assign(S, { products: p, categories: c, customers: cu, promotions: pr, suppliers: su, shift: sh[0] || null });
}

const MAIN_TABS = ['pos', 'sales', 'products', 'reports', 'stock', 'members'];
function renderShell() {
  const pages = PAGES.filter(p => pageOK(p));
  const tabs = pages.filter(p => MAIN_TABS.includes(p.id)).slice(0, 4);
  const initials = (S.user.user_metadata?.full_name || S.user.user_metadata?.name || S.user.email || '?').trim().slice(0, 1).toUpperCase();
  $('#root').innerHTML = `<div id="app" class="${localStorage.getItem('pos_side') === 'mini' ? 'mini' : ''}">
    <nav class="side">
      <div class="logo"><i>🛒</i><div class="lt">Yanisa Shop<div class="shopname">${esc(S.shop.name)}</div></div></div>
      <div class="navs">${pages.map((p, i) => `<button class="nav" data-p="${p.id}" style="--i:${i}" title="${t(p.name)}"><span class="ic">${p.ic}</span><span class="lb">${t(p.name)}</span></button>`).join('')}</div>
      <div class="grow"></div>
      <button class="nav install hidden" data-install><span class="ic">📲</span><span class="lb">${t('Install app')}</span></button>
      <button class="nav" id="themeBtn"><span class="ic">${document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'}</span><span class="lb">${LANG === 'th' ? 'โหมดสี' : 'Theme'}</span></button>
      <button class="nav" id="miniBtn"><span class="ic">⇆</span><span class="lb">${LANG === 'th' ? 'ย่อเมนู' : 'Collapse'}</span></button>
      <div class="me"><span class="av">${esc(initials)}</span><div class="lb"><b>${esc(S.user.user_metadata?.full_name || S.user.user_metadata?.name || S.user.email)}</b><small>${ROLE_NAME(S.role)} · v${VERSION}</small></div></div>
    </nav>
    <div class="main">
      <header class="top"><button class="iconbtn mob" id="shopBtn" title="${t('Shops / branches')}">🏪</button>
        <div class="tt"><h1 id="ttl"></h1><small class="mob">${esc(S.shop.name)}</small></div><div id="tact" class="row"></div></header>
      <div class="page" id="pg"></div>
    </div>
    <nav class="tabbar">${(() => {
      const items = [...tabs.map(p => `<button class="tb" data-p="${p.id}"><span class="ic">${p.ic}</span><span>${t(p.name)}</span></button>`),
        `<button class="tb" id="moreBtn"><span class="ic">☰</span><span>${LANG === 'th' ? 'เพิ่มเติม' : 'More'}</span></button>`];
      const half = Math.ceil(items.length / 2);
      return items.slice(0, half).join('') + `<button class="fab" id="quickFab" title="${LANG === 'th' ? 'ทางลัด' : 'Quick'}" aria-label="quick"><span>＋</span></button>` + items.slice(half).join('');
    })()}</nav>
  </div>`;
  $$('[data-p]').forEach(b => b.onclick = () => go(b.dataset.p));
  $('#miniBtn').onclick = () => { $('#app').classList.toggle('mini'); localStorage.setItem('pos_side', $('#app').classList.contains('mini') ? 'mini' : ''); };
  $('#themeBtn').onclick = () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); $('#themeBtn .ic').textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'; };
  $('#shopBtn').onclick = () => go('settings');
  $('#moreBtn').onclick = () => {
    const m = modal(LANG === 'th' ? 'เมนูทั้งหมด' : 'All menus', `<div class="moregrid">${pages.map((p, i) => `<button data-go="${p.id}" style="--i:${i}" class="${S.page === p.id ? 'on' : ''}"><span>${p.ic}</span>${t(p.name)}</button>`).join('')}
      <button data-go="__install" class="install hidden" style="--i:${pages.length}"><span>📲</span>${t('Install app')}</button>
      <button data-go="__theme" style="--i:${pages.length + 1}"><span>${document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'}</span>${LANG === 'th' ? 'โหมดสี' : 'Theme'}</button></div>`, {sheet: true});
    $$('[data-go]', m).forEach(b => b.onclick = () => { m.close(); const g = b.dataset.go;
      if (g === '__install') installApp(); else if (g === '__theme') setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); else go(g); });
    updateInstallUI();
  };
  $$('[data-install]').forEach(b => b.onclick = installApp);
  $('#quickFab') && ($('#quickFab').onclick = quickActions);
  updateInstallUI();
}

function quickActions() {
  const acts = [];
  if (pageOK(PAGES.find(p => p.id === 'pos'))) acts.push(['🛒', LANG === 'th' ? 'ขายสินค้า' : 'Sell', () => go('pos')]);
  acts.push(['📷', LANG === 'th' ? 'สแกนหาสินค้า' : 'Scan product', () => scanBarcode(code => { go('products'); setTimeout(() => { const i = $('#ps'); if (i) { i.value = code; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); } }, 250); })]);
  if (canDo('manage_inventory')) acts.push(['📥', LANG === 'th' ? 'รับสินค้าเข้า' : 'Receive', () => go('stock')]);
  if (canDo('edit_products')) acts.push(['➕', LANG === 'th' ? 'เพิ่มสินค้า' : 'Add product', () => productForm({ unit: 'ชิ้น', track_stock: true, active: true }, () => go('products'))]);
  const m = modal(LANG === 'th' ? 'ทางลัด' : 'Quick actions', `<div class="qacts">${acts.map((a, i) => `<button data-q="${i}" style="--i:${i}"><span>${a[0]}</span>${a[1]}</button>`).join('')}</div>`, { sheet: true });
  $$('[data-q]', m).forEach(b => b.onclick = () => { m.close(); acts[+b.dataset.q][2](); });
}

function go(page) {
  const p = PAGES.find(x => x.id === page && pageOK(x)) || PAGES.find(pageOK) || PAGES[1];
  S.page = p.id; if (location.hash.slice(1) !== p.id) history.replaceState(null, '', '#' + p.id);
  $$('[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p.id));
  $('#moreBtn')?.classList.toggle('on', !$(`.tabbar [data-p="${p.id}"]`));
  $('#ttl').textContent = t(p.name);
  $('#tact').innerHTML = '';
  const pg = $('#pg'); pg.classList.toggle('flush', p.id === 'pos');
  pg.innerHTML = p.id === 'pos' ? '' : `<div class="skel"><i></i><i></i><i></i><i></i></div>`;
  pg.classList.remove('enter'); void pg.offsetWidth; pg.classList.add('enter');
  pg.scrollTop = 0;
  Promise.resolve().then(() => VIEWS[p.id](pg)).catch(fail);
}

/* theme */
function setTheme(th) { document.documentElement.dataset.theme = th; localStorage.setItem('pos_theme', th); $('meta[name=theme-color]')?.setAttribute('content', th === 'dark' ? '#0b0d1a' : '#4f46e5'); }
setTheme(localStorage.getItem('pos_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

/* install as an app (Android, Windows, Mac, iPhone) */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function updateInstallUI() { $$('.install').forEach(b => b.classList.toggle('hidden', isStandalone())); }
async function installApp() {
  if (window._installEvt) { window._installEvt.prompt(); const r = await window._installEvt.userChoice; if (r.outcome === 'accepted') { window._installEvt = null; toast(t('Saved'), 'ok'); } return; }
  const ua = navigator.userAgent, th = LANG === 'th';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safariMac = /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Edg/.test(ua);
  const steps = ios ? (th ? ['เปิดลิงก์นี้ใน Safari', 'แตะปุ่ม แชร์ ⬆️ ด้านล่าง', 'เลือก "เพิ่มไปยังหน้าจอโฮม"', 'แตะ "เพิ่ม"'] : ['Open this link in Safari', 'Tap the Share ⬆️ button', 'Choose "Add to Home Screen"', 'Tap "Add"'])
    : safariMac ? (th ? ['ในเมนู Safari เลือก ไฟล์ (File)', 'เลือก "เพิ่มไปยัง Dock" (Add to Dock)', 'แอปจะอยู่ใน Dock และ Launchpad'] : ['In Safari open the File menu', 'Choose "Add to Dock"', 'The app appears in your Dock and Launchpad'])
    : /Android/.test(ua) ? (th ? ['เปิดลิงก์นี้ใน Chrome', 'แตะเมนู ⋮ มุมขวาบน', 'เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"'] : ['Open this link in Chrome', 'Tap the ⋮ menu (top right)', 'Choose "Install app" / "Add to Home screen"'])
    : (th ? ['เปิดลิงก์นี้ใน Chrome หรือ Edge (Windows / Mac)', 'คลิกไอคอน ติดตั้ง ⊕ ในแถบที่อยู่ (มุมขวา)', 'คลิก "ติดตั้ง" — แอปจะอยู่ใน Start menu / Launchpad'] : ['Open this link in Chrome or Edge (Windows / Mac)', 'Click the Install ⊕ icon in the address bar', 'Click "Install" — it appears in the Start menu / Launchpad']);
  modal(t('Install app'), `<div class="install-hero"><img src="icon-192.png" alt=""><div><b>Yanisa Shop</b><small>${esc(location.origin + location.pathname)}</small></div></div>
    <ol class="steps">${steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <p class="muted" style="font-size:13px">${th ? 'ใช้ได้ทั้ง Android, iPhone, Windows และ Mac — อัปเดตอัตโนมัติทุกครั้งที่เปิด' : 'Works on Android, iPhone, Windows and Mac — updates automatically every time it opens.'}</p>`);
}
window.addEventListener('appinstalled', () => { window._installEvt = null; updateInstallUI(); });

/* button ripple + press animation for every button */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn, .nav, .tb, .tab, .moregrid button, .paym button'); if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
  const w = document.createElement('span'); w.className = 'ripple';
  w.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(w); setTimeout(() => w.remove(), 600);
});

/* animated number (totals) */
function countTo(el, to, fmt = v => money(v)) {
  if (!el) return; const from = num(el.dataset.v || 0); el.dataset.v = to;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 380;
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* fly-to-cart animation */
function flyToCart(card) {
  if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = matchMedia('(max-width:860px)').matches ? $('#cartfab') : $('#cart .hd');
  const img = $('.img', card); if (!target || !img) return;
  const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
  const g = img.cloneNode(true); g.className = 'img flyer'; g.innerHTML = '';
  g.style.cssText += `;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
  document.body.appendChild(g);
  requestAnimationFrame(() => { g.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.12)`; g.style.opacity = '.4'; });
  setTimeout(() => { g.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); }, 520);
}

/* ================= POS ================= */
function catColor(id) { return S.categories.find(c => c.id === id)?.color || '#6366f1'; }
/* display preferences (per device) */
const VIEW_DEF = { size: 170, fit: 'cover', ratio: '1', showStock: true, overlay: false, layout: 'grid', sort: 'name', stats: true, radius: 16, sound: true, voice: false, vol: 0.6 };
let VIEWP = { ...VIEW_DEF, ...JSON.parse(localStorage.getItem('pos_view') || '{}') };
const saveView = () => { localStorage.setItem('pos_view', JSON.stringify(VIEWP)); applyView(); drawGrid(); };
function applyView() {
  const g = $('#pgrid'); if (!g) return;
  g.style.setProperty('--tile', VIEWP.size + 'px'); g.style.setProperty('--fit', VIEWP.fit);
  g.style.setProperty('--ratio', VIEWP.ratio === '1' ? '1 / 1' : VIEWP.ratio === '43' ? '4 / 3' : '3 / 4');
  g.style.setProperty('--rad', VIEWP.radius + 'px');
  g.className = 'pgrid ' + (VIEWP.layout === 'list' ? 'list' : '') + (VIEWP.overlay ? ' overlay' : '');
  $('#posStats')?.classList.toggle('hidden', !VIEWP.stats);
}
const isImg = p => !!p.image_url;
function productCard(p) {
  const out = p.track_stock && p.stock <= 0, low = p.track_stock && !out && p.stock <= p.low_stock;
  const inCart = S.cart.find(l => l.product_id === p.id)?.qty || 0;
  const bg = p.tile_color || catColor(p.category_id);
  const img = isImg(p) ? `style="background-image:url('${esc(p.image_url)}');background-color:${esc(bg)}22"` : `style="background:linear-gradient(135deg,${esc(bg)},${esc(bg)}bb)"`;
  return `<div class="pcard ${out ? 'out' : ''}" data-id="${p.id}">
    <div class="img ${isImg(p) ? 'has' : ''}" ${img}>${isImg(p) ? '' : `<span>${esc([...p.name].slice(0, 2).join(''))}</span>`}
      ${p.favorite ? '<i class="fav">★</i>' : ''}${inCart ? `<i class="incart">${qtyf(inCart)}</i>` : ''}
      ${out ? `<i class="badge bad">${t('Out of stock')}</i>` : low ? `<i class="badge warn">${t('Low stock')}</i>` : ''}
      <button class="more" data-more="${p.id}" title="⋯">⋯</button></div>
    <div class="nm">${esc(p.name)}</div>
    <div class="pr"><b>฿${money(p.price)}</b>${VIEWP.showStock && p.track_stock ? `<span class="st">${qtyf(p.stock)} ${esc(p.unit)}</span>` : ''}</div></div>`;
}

const VIEWS = {};
let BEST = {};      // product_id -> qty sold (30 days)
let RECENT = {};    // product_id -> last sold time
let TODAY = null;   // today's stats
async function loadPosStats() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  let qb = sb.from('sales').select('total, cost_total, payment_method, cashier_id, created_at').eq('shop_id', S.shop.id).eq('status', 'paid').gte('created_at', start.toISOString());
  const rows = await q(qb);
  const mine = rows.filter(r => r.cashier_id === S.user.id);
  const sum = a => a.reduce((x, r) => x + num(r.total), 0);
  TODAY = { total: sum(rows), bills: rows.length, mine: sum(mine), mineBills: mine.length, cash: sum(rows.filter(r => r.payment_method === 'cash')),
    profit: rows.reduce((x, r) => x + num(r.total) - num(r.cost_total), 0), last: rows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] };
  drawStats();
}
async function loadBest() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  try {
    const it = await fetchAll(() => sb.from('sale_items').select('product_id, qty, sales!inner(created_at,status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('sales.created_at', since));
    BEST = {}; RECENT = {}; it.forEach(i => { if (i.product_id) { BEST[i.product_id] = (BEST[i.product_id] || 0) + num(i.qty); if ((RECENT[i.product_id] || '') < i.sales.created_at) RECENT[i.product_id] = i.sales.created_at; } });
  } catch (e) { BEST = {}; }
}
function drawStats() {
  const el = $('#posStats'); if (!el || !TODAY) return;
  const lowN = S.products.filter(p => p.active && p.track_stock && p.stock <= p.low_stock).length;
  const tiles = [
    ['💰', t('Today'), '฿' + money(TODAY.total)], ['🧾', t('Bills count'), TODAY.bills],
    ['👤', LANG === 'th' ? 'ยอดของฉัน' : 'My sales', '฿' + money(TODAY.mine)],
    ...(can('owner', 'manager') ? [['📈', t('Gross profit'), '฿' + money(TODAY.profit)]] : []),
    ['💵', t('Cash sales'), '฿' + money(TODAY.cash)],
    ['⚠️', t('Low stock'), lowN],
  ];
  el.innerHTML = tiles.map(([i, k, v], n) => `<div class="ps" style="--i:${n}"><span>${i}</span><div><small>${k}</small><b>${v}</b></div></div>`).join('') +
    `<div class="ps clock"><span>🕒</span><div><small>${new Date().toLocaleDateString(LANG === 'th' ? 'th-TH' : 'en-GB', {weekday: 'short', day: 'numeric', month: 'short'})}</small><b id="clk">${new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})}</b></div></div>`;
}
setInterval(() => { const c = $('#clk'); if (c) c.textContent = new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'}); }, 15000);

VIEWS.pos = pg => {
  $('#tact').innerHTML = `<span class="chip ${S.shift ? 'ok' : 'warn'}">${S.shift ? t('Shift open') : t('No open shift')}</span>
    <button class="btn sm" id="lastBtn" title="${t('Reprint')}">🧾 <span class="hide-sm">${LANG === 'th' ? 'บิลล่าสุด' : 'Last bill'}</span></button>
    <button class="btn sm" id="dispBtn" title="${t('Customer display')}">🖥️ <span class="hide-sm">${t('Customer display')}</span></button>
    <button class="btn sm" id="fsBtn" title="Fullscreen">⛶</button>`;
  $('#dispBtn').onclick = () => window.open('display.html', 'posdisplay', 'width=900,height=600');
  $('#fsBtn').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  $('#lastBtn').onclick = async () => {
    const r = await q(sb.from('sales').select('*').eq('shop_id', S.shop.id).order('created_at', {ascending: false}).limit(1));
    if (r[0]) billDetail(r[0], () => {}); else toast('—');
  };
  pg.innerHTML = `<div class="pos">
    <div class="left">
      <div class="posstats" id="posStats"></div>
      <div class="row toolbar">
        <div class="sbox"><span>🔍</span><input class="in" id="psearch" placeholder="${t('Search or scan barcode…')}  (F2)" value="${esc(S.search)}" autocomplete="off"><button class="clr" id="sclr">×</button></div>
        <button class="btn" id="scanBtn">📷 <span class="hide-sm">${t('Scan')}</span></button>
        <select class="in" id="psort" style="width:auto">${[['name', LANG === 'th' ? 'เรียง: ชื่อ' : 'Sort: Name'], ['best', LANG === 'th' ? 'ขายดี' : 'Best selling'], ['price', LANG === 'th' ? 'ราคาต่ำ→สูง' : 'Price ↑'], ['price_d', LANG === 'th' ? 'ราคาสูง→ต่ำ' : 'Price ↓'], ['stock', LANG === 'th' ? 'สต็อกน้อย' : 'Low stock first'], ['new', LANG === 'th' ? 'ใหม่ล่าสุด' : 'Newest']].map(([k, l]) => `<option value="${k}" ${VIEWP.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn" id="viewBtn" title="${LANG === 'th' ? 'ปรับการแสดงผล' : 'Display settings'}">🎨 <span class="hide-sm">${LANG === 'th' ? 'ปรับหน้าจอ' : 'Display'}</span></button>
      </div>
      <div class="cats" id="cats"></div>
      <div class="pgrid" id="pgrid"></div>
    </div>
    <aside class="cart" id="cart"></aside>
    <button class="btn p lg cartfab" id="cartfab"></button>
  </div>`;
  const drawCats = () => {
    const cats = [{id: 'all', name: '🏠 ' + t('All')}, {id: 'fav', name: '★ ' + (LANG === 'th' ? 'รายการโปรด' : 'Favorites')}, {id: 'best', name: '🔥 ' + (LANG === 'th' ? 'ขายดี' : 'Best sellers')}, {id: 'recent', name: '🕘 ' + (LANG === 'th' ? 'ขายล่าสุด' : 'Recently sold')}, ...S.categories];
    if (!$('#cats')) return;
    $('#cats').innerHTML = cats.map(c => `<button class="tab ${S.cat === c.id ? 'on' : ''}" data-c="${c.id}" ${c.color ? `style="--cc:${esc(c.color)}"` : ''}>${c.icon ? esc(c.icon) + ' ' : c.color ? '<i class="dot"></i>' : ''}${esc(c.name)} <small>${countIn(c.id)}</small></button>`).join('');
    $$('#cats .tab').forEach(b => b.onclick = () => { S.cat = b.dataset.c; drawCats(); drawGrid(); });
  };
  const s = $('#psearch');
  s.oninput = () => { S.search = s.value; drawGrid(); };
  $('#sclr').onclick = () => { s.value = ''; S.search = ''; drawGrid(); s.focus(); };
  s.onkeydown = e => {
    if (e.key !== 'Enter') return;
    const v = s.value.trim(); if (!v) return;
    let qty = 1, code = v; const mm = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qty = num(mm[1]); code = mm[2]; } // 3*barcode
    const hit = S.products.find(p => p.active && (p.barcode === code || p.sku === code));
    const list = filtered();
    if (hit) addToCart(hit, qty); else if (list.length === 1) addToCart(list[0], qty); else return;
    s.value = ''; S.search = ''; drawGrid();
  };
  $('#psort').onchange = e => { VIEWP.sort = e.target.value; saveView(); };
  $('#viewBtn').onclick = viewSettings;
  $('#scanBtn').onclick = () => scanBarcode(code => {
    const hit = S.products.find(p => p.barcode === code || p.sku === code);
    if (hit) { sfx('scan'); addToCart(hit); } else { sfx('error'); toast(`${t('Barcode')} ${code} ?`, 'bad'); }
  });
  $('#cartfab').onclick = () => $('#cart').classList.add('open');
  S._drawCats = drawCats;
  drawCats(); applyView(); drawGrid(); drawCart();
  loadPosStats().catch(() => {}); loadBest().then(() => { if (S.cat === 'best' || VIEWP.sort === 'best') drawGrid(); drawCats(); });
  if (matchMedia('(min-width:861px)').matches) s.focus();
};
function countIn(id) {
  const a = S.products.filter(p => p.active);
  if (id === 'all') return a.length; if (id === 'fav') return a.filter(p => p.favorite).length; if (id === 'best') return a.filter(p => BEST[p.id]).length; if (id === 'recent') return a.filter(p => RECENT[p.id]).length;
  return a.filter(p => p.category_id === id).length;
}
function filtered() {
  const qs = S.search.toLowerCase();
  let list = S.products.filter(p => p.active &&
    (S.cat === 'all' || (S.cat === 'fav' ? p.favorite : S.cat === 'best' ? BEST[p.id] : S.cat === 'recent' ? RECENT[p.id] : p.category_id === S.cat)) &&
    (!qs || p.name.toLowerCase().includes(qs) || (p.barcode || '').includes(qs) || (p.sku || '').toLowerCase().includes(qs)));
  const srt = S.cat === 'best' ? 'best' : S.cat === 'recent' ? 'recent' : VIEWP.sort;
  const by = { name: (a, b) => a.name.localeCompare(b.name, 'th'), price: (a, b) => a.price - b.price, price_d: (a, b) => b.price - a.price,
    stock: (a, b) => (a.track_stock ? a.stock : 1e9) - (b.track_stock ? b.stock : 1e9), best: (a, b) => (BEST[b.id] || 0) - (BEST[a.id] || 0),
    new: (a, b) => (b.created_at || '').localeCompare(a.created_at || ''), recent: (a, b) => (RECENT[b.id] || '').localeCompare(RECENT[a.id] || '') }[srt];
  list.sort((a, b) => (b.favorite - a.favorite) * (srt === 'name' ? 1 : 0) || by(a, b));
  return list;
}
const BATCH = 40;
function drawGrid() {
  const g = $('#pgrid'); if (!g) return;
  const list = filtered();
  g._list = list; g._shown = 0; g.scrollTop = 0;
  g.innerHTML = list.length ? '' : `<div class="empty" style="grid-column:1/-1">${S.products.length ? '—' : (LANG === 'th' ? 'ยังไม่มีสินค้า ไปที่หน้า "สินค้า" เพื่อเพิ่ม' : 'No products yet — add some in Products')}</div>`;
  moreTiles(g);
  wireGrid(g);
}
/* render tiles in batches as the user scrolls (keeps phones fast with hundreds of products) */
function moreTiles(g) {
  const list = g._list || [], from = g._shown || 0; if (from >= list.length) return;
  const to = Math.min(list.length, from + BATCH);
  g.querySelector('.sentinel')?.remove();
  g.insertAdjacentHTML('beforeend', list.slice(from, to).map((p, i) => productCard(p).replace('class="pcard', `style="--i:${Math.min(i, 16)}" class="pcard ${from === 0 && i < 16 ? 'anim' : ''}`)).join('') +
    (to < list.length ? '<div class="sentinel" style="grid-column:1/-1;height:1px"></div>' : ''));
  g._shown = to;
  const sen = g.querySelector('.sentinel');
  if (sen) { g._io?.disconnect(); g._io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) moreTiles(g); }, {root: g, rootMargin: '600px'}); g._io.observe(sen); }
}
/* one set of listeners for the whole grid (tap = add, long-press / ⋯ / right-click = quick menu) */
function wireGrid(g) {
  if (g._wired) return; g._wired = true;
  let timer = null, long = false, sx = 0, sy = 0, card = null;
  const cancel = () => { clearTimeout(timer); timer = null; };
  g.addEventListener('pointerdown', e => {
    card = e.target.closest('.pcard'); long = false; if (!card || e.target.closest('.more')) return;
    sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => { long = true; navigator.vibrate?.(30); quickMenu(card.dataset.id); }, 550);
  }, {passive: true});
  g.addEventListener('pointermove', e => { if (timer && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) cancel(); }, {passive: true});
  ['pointerup', 'pointercancel', 'scroll'].forEach(ev => g.addEventListener(ev, cancel, {passive: true}));
  g.addEventListener('contextmenu', e => { const c = e.target.closest('.pcard'); if (!c) return; e.preventDefault(); cancel(); quickMenu(c.dataset.id); });
  g.addEventListener('click', e => {
    const c = e.target.closest('.pcard'); if (!c) return;
    if (e.target.closest('.more')) { e.stopPropagation(); return quickMenu(c.dataset.id); }
    if (long) { long = false; return; }
    flyToCart(c); addToCart(S.products.find(p => p.id === c.dataset.id));
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  });
}
function addToCart(p, qty = 1, u = null) {
  if (!p) return;
  if (!u && Array.isArray(p.units) && p.units.length) return unitPicker(p, qty);
  const unit = u?.unit || '', factor = num(u?.factor) || 1;
  const basePrice = u ? num(u.price) : (num(p.promo_price) > 0 ? num(p.promo_price) : num(p.price));
  const line = S.cart.find(l => l.product_id === p.id && (l.unit || '') === unit);
  const want = ((line?.qty || 0) + qty) * factor;
  if (p.track_stock && want > p.stock) { toast(`${t('Out of stock')}: ${p.name} (${qtyf(p.stock)})`, 'bad'); sfx('error'); } else sfx('add');
  if (line) line.qty += qty; else S.cart.push({product_id: p.id, name: p.name + (unit ? ` (${unit})` : ''), price: basePrice, qty, discount: 0, unit, factor});
  S._lastAdded = p.id; drawCart(); refreshBadges();
}
function refreshBadges() {
  $$('#pgrid .pcard').forEach(c => {
    const n = S.cart.find(l => l.product_id === c.dataset.id)?.qty || 0;
    let b = $('.incart', c);
    if (n && !b) { b = document.createElement('i'); b.className = 'incart'; $('.img', c).appendChild(b); }
    if (b) { if (n) b.textContent = qtyf(n); else b.remove(); }
  });
}

/* quick menu on a product tile (long-press / right-click / ⋯) */
function quickMenu(id) {
  const p = S.products.find(x => x.id === id); if (!p) return;
  const edit = can('owner', 'manager', 'stock');
  const m = modal(p.name, `
    <div class="qm-head"><div class="qm-img" style="${isImg(p) ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(p.tile_color || catColor(p.category_id))}`}"></div>
      <div><div class="b" style="font-size:20px">฿${money(p.price)}</div><div class="muted">${p.track_stock ? `${t('Stock')}: ${qtyf(p.stock)} ${esc(p.unit)}` : ''}</div>
      <div class="muted">${esc(p.barcode)}</div>${BEST[p.id] ? `<div class="chip">🔥 ${qtyf(BEST[p.id])} / 30d</div>` : ''}</div></div>
    <div class="qm-qty"><button class="btn lg" data-q="-1">−</button><input class="in" id="qmq" type="number" step="any" value="1" inputmode="decimal"><button class="btn lg" data-q="1">+</button>
      <button class="btn p lg" id="qmAdd">🛒 ${t('Add')}</button></div>
    <div class="qm-grid">
      <button class="btn" id="qmFav">${p.favorite ? '☆ ' + (LANG === 'th' ? 'เอาออกจากโปรด' : 'Unfavorite') : '★ ' + (LANG === 'th' ? 'เพิ่มในโปรด' : 'Favorite')}</button>
      ${edit ? `<button class="btn" id="qmPic">🖼️ ${LANG === 'th' ? 'รูป / ค้นหาจากเว็บ' : 'Picture / web search'}</button>
      <button class="btn" id="qmCam">📸 ${LANG === 'th' ? 'ถ่ายรูป' : 'Take photo'}</button>
      <button class="btn" id="qmColor">🎨 ${LANG === 'th' ? 'สีไทล์' : 'Tile colour'}</button>
      <button class="btn" id="qmEdit">✏️ ${t('Edit')}</button>
      <button class="btn" id="qmStock">📦 ${t('Receive')}</button>` : ''}
    </div>`);
  $$('[data-q]', m).forEach(b => b.onclick = () => { const i = $('#qmq', m); i.value = Math.max(1, num(i.value) + num(b.dataset.q)); });
  $('#qmAdd', m).onclick = () => { addToCart(p, Math.max(0.001, num($('#qmq', m).value))); m.close(); };
  $('#qmFav', m).onclick = async () => { try { await q(sb.from('products').update({favorite: !p.favorite}).eq('id', p.id)); p.favorite = !p.favorite; m.close(); S._drawCats?.(); drawGrid(); } catch (e) { fail(e); } };
  if (!edit) return;
  const pick = capture => { m.close(); pickImage(capture).then(f => f && uploadProductImage(p, f)); };
  $('#qmPic', m).onclick = () => { m.close(); pictureMenu(p); };
  $('#qmCam', m).onclick = () => pick(true);
  $('#qmColor', m).onclick = () => { m.close(); colorPicker(p); };
  $('#qmEdit', m).onclick = () => { m.close(); productForm(p, () => { S._drawCats?.(); drawGrid(); }); };
  $('#qmStock', m).onclick = () => { m.close(); stockForm(p, 'in', () => drawGrid()); };
}
const SWATCHES = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c', '#334155', '#111827'];
function colorPicker(p) {
  const m = modal(LANG === 'th' ? 'สีไทล์' : 'Tile colour', `<div class="swatches">${SWATCHES.map(c => `<button data-c="${c}" style="background:${c}" class="${p.tile_color === c ? 'on' : ''}"></button>`).join('')}</div>
    <div class="row" style="margin-top:12px"><input type="color" id="cc2" value="${esc(p.tile_color || catColor(p.category_id))}" style="width:56px;height:44px;border:0;background:none"><span class="sp"></span>
    <button class="btn" id="ccReset">${LANG === 'th' ? 'ใช้สีหมวดหมู่' : 'Use category colour'}</button></div>`);
  const set = async c => { try { await q(sb.from('products').update({tile_color: c}).eq('id', p.id)); p.tile_color = c; m.close(); drawGrid(); } catch (e) { fail(e); } };
  $$('[data-c]', m).forEach(b => b.onclick = () => set(b.dataset.c));
  $('#cc2', m).onchange = e => set(e.target.value);
  $('#ccReset', m).onclick = () => set('');
}

/* image upload: pick → resize to 800px WebP → Supabase Storage */
function pickImage(capture) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if (capture) i.capture = 'environment';
    i.onchange = () => res(i.files[0] || null); i.click();
  });
}
async function resizeImage(file, max = 640) {
  const bmp = await createImageBitmap(file);
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return await new Promise(r => cv.toBlob(b => r(b), 'image/webp', 0.85)) || await new Promise(r => cv.toBlob(b => r(b), 'image/jpeg', 0.85));
}
async function uploadImageFile(file) {
  const blob = await resizeImage(file);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${S.shop.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
async function uploadProductImage(p, file) {
  toast(LANG === 'th' ? 'กำลังอัปโหลดรูป…' : 'Uploading picture…');
  try {
    const url = await uploadImageFile(file);
    await q(sb.from('products').update({image_url: url}).eq('id', p.id)); p.image_url = url;
    toast(t('Saved'), 'ok'); drawGrid();
  } catch (e) { fail(e); }
}

/* ================= PICTURES: web search by exact name → PNG → storage ================= */
async function fnCall(body) {
  const { data: { session } } = await sb.auth.getSession();
  return fetch(window.POS_CONFIG.url + '/functions/v1/find-image', { method: 'POST',
    headers: { apikey: window.POS_CONFIG.key, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
async function webImageSearch(q, barcode = '') {
  const r = await fnCall({ q, barcode }); const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'search failed');
  return d.images || [];
}
async function webImageBlob(url) {
  const r = await fnCall({ fetch: url });
  if (!r.ok) throw new Error('download failed');
  return await r.blob();
}
/* convert any picture to a square-fit PNG (max 600px) */
async function toPng(blob, max = 520) {
  const bmp = await createImageBitmap(blob);
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  // WebP keeps transparency but is ~10× smaller than PNG for photos
  return await new Promise(r => cv.toBlob(b => r(b && b.type === 'image/webp' ? b : null), 'image/webp', 0.82)) || await new Promise(r => cv.toBlob(b => r(b), 'image/png'));
}
async function savePng(p, png) {
  const ext = png.type === 'image/webp' ? 'webp' : 'png';
  const path = `${S.shop.id}/${p.id}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('product-images').upload(path, png, { contentType: png.type || 'image/png', upsert: true });
  if (error) throw error;
  const url = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  await q(sb.from('products').update({ image_url: url }).eq('id', p.id)); p.image_url = url;
  return url;
}
async function setPictureFromWeb(p, img) {
  let blob;
  try { blob = await webImageBlob(img.url); } catch (e) { blob = await webImageBlob(img.thumb); }
  return savePng(p, await toPng(blob));
}
/* picture menu: web results for the exact product name + upload / camera / remove */
function pictureMenu(p, after) {
  const th = LANG === 'th';
  const m = modal(`🖼️ ${p.name}`, `
    <div class="pic-now"><div class="qm-img" id="pmNow" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}"></div>
      <div class="pic-btns"><button class="btn" id="pmUp">📁 ${th ? 'อัปโหลด' : 'Upload'}</button><button class="btn" id="pmCam">📸 ${th ? 'ถ่ายรูป' : 'Camera'}</button>
      ${p.image_url ? `<button class="btn bad" id="pmDel">🗑 ${th ? 'ลบรูป' : 'Remove'}</button>` : ''}</div></div>
    <div class="sbox" style="margin:12px 0"><span>🔎</span><input class="in" id="pmQ" value="${esc(p.name)}"><button class="btn sm p" id="pmGo">${t('Search')}</button></div>
    <p class="muted" style="font-size:13px;margin:0 0 8px">${th ? 'แตะรูปที่ต้องการ — ระบบจะบันทึกเป็น PNG ให้อัตโนมัติ' : 'Tap a picture — it is saved as PNG automatically'}</p>
    <div class="picgrid" id="pmRes"></div>`, {wide: true});
  const done = () => { m.close(); after?.(); drawGrid(); };
  const run = async () => {
    const res = $('#pmRes', m); res.innerHTML = Array(8).fill('<i class="sk"></i>').join('');
    try {
      const imgs = await webImageSearch($('#pmQ', m).value.trim(), p.barcode);
      res.innerHTML = imgs.length ? imgs.map((x, i) => `<button data-i="${i}" title="${esc(x.title)}"><img src="${esc(x.thumb)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></button>`).join('') : `<div class="empty" style="grid-column:1/-1">—</div>`;
      $$('[data-i]', res).forEach(b => b.onclick = async () => {
        b.classList.add('busy'); try { await setPictureFromWeb(p, imgs[+b.dataset.i]); sfx('ok'); toast(t('Saved'), 'ok'); done(); } catch (e) { b.classList.remove('busy'); fail(e); }
      });
    } catch (e) { res.innerHTML = ''; fail(e); }
  };
  $('#pmGo', m).onclick = run; $('#pmQ', m).onkeydown = e => { if (e.key === 'Enter') run(); };
  const up = async cap => { const f = await pickImage(cap); if (!f) return; try { await savePng(p, await toPng(f)); toast(t('Saved'), 'ok'); done(); } catch (e) { fail(e); } };
  $('#pmUp', m).onclick = () => up(false); $('#pmCam', m).onclick = () => up(true);
  if ($('#pmDel', m)) $('#pmDel', m).onclick = async () => { try { await q(sb.from('products').update({ image_url: '' }).eq('id', p.id)); p.image_url = ''; done(); } catch (e) { fail(e); } };
  run();
}
/* fill pictures for every product that has none */
async function autoPictures(after) {
  const th = LANG === 'th';
  const todo = S.products.filter(p => !p.image_url);
  if (!todo.length) return toast(th ? 'สินค้าทุกชิ้นมีรูปแล้ว' : 'Every product already has a picture', 'ok');
  let stop = false, ok = 0, bad = 0, i = 0;
  const m = modal(th ? 'ใส่รูปอัตโนมัติจากเว็บ' : 'Auto pictures from the web', `
    <p>${th ? `ค้นหารูปจากชื่อสินค้าแบบตรงตัว แล้วบันทึกเป็น PNG — ${todo.length} รายการที่ยังไม่มีรูป` : `Searching the exact product name and saving PNG — ${todo.length} products without a picture`}</p>
    <div class="progress"><i id="apBar"></i></div><p id="apTxt" class="muted"></p><div class="picgrid small" id="apLast"></div>`,
    { foot: `<button class="btn bad" id="apStop">${th ? 'หยุด' : 'Stop'}</button>` });
  $('#apStop', m).onclick = () => { stop = true; m.close(); };
  const upd = () => { $('#apBar', m).style.width = ((ok + bad) / todo.length * 100) + '%'; $('#apTxt', m).textContent = `✅ ${ok}   ❌ ${bad}   / ${todo.length}`; };
  const worker = async () => {
    while (!stop && i < todo.length) {
      const p = todo[i++];
      try {
        const imgs = await webImageSearch(p.name, p.barcode);
        let saved = false;
        for (const img of imgs.slice(0, 4)) { try { await setPictureFromWeb(p, img); saved = true; break; } catch (e) { /* try next */ } }
        if (saved) { ok++; const box = $('#apLast', m); box?.insertAdjacentHTML('afterbegin', `<button><img src="${esc(p.image_url)}" title="${esc(p.name)}"></button>`); if (box && box.children.length > 8) box.lastChild.remove(); } else bad++;
      } catch (e) { bad++; }
      upd();
    }
  };
  upd(); await Promise.all([worker(), worker(), worker()]);
  if (!stop) { $('#apStop', m).textContent = 'OK'; $('#apStop', m).className = 'btn p'; sfx('pay'); }
  after?.(); drawGrid();
}

/* ================= SOUNDS (cashier) ================= */
let AC = null;
function sfx(kind) {
  if (!VIEWP.sound) return;
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const v = VIEWP.vol ?? 0.6, t0 = AC.currentTime;
    const tone = (f, s, d, type = 'sine', g = 0.25) => { const o = AC.createOscillator(), a = AC.createGain(); o.type = type; o.frequency.value = f;
      a.gain.setValueAtTime(0, t0 + s); a.gain.linearRampToValueAtTime(g * v, t0 + s + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d); o.connect(a).connect(AC.destination); o.start(t0 + s); o.stop(t0 + s + d + 0.05); };
    if (kind === 'add') tone(1046, 0, 0.09, 'triangle');
    else if (kind === 'scan') { tone(1568, 0, 0.12, 'square', 0.12); }
    else if (kind === 'remove') tone(523, 0, 0.1, 'triangle');
    else if (kind === 'error') { tone(220, 0, 0.18, 'sawtooth', 0.15); tone(180, 0.16, 0.25, 'sawtooth', 0.15); }
    else if (kind === 'ok') { tone(880, 0, 0.1); tone(1318, 0.08, 0.18); }
    else if (kind === 'pay') { // cash register: bell + coins
      tone(2093, 0, 0.5, 'sine', 0.3); tone(2637, 0.06, 0.6, 'sine', 0.22); tone(3136, 0.12, 0.7, 'sine', 0.15);
      for (let k = 0; k < 5; k++) tone(4000 + Math.random() * 2000, 0.25 + k * 0.05, 0.05, 'square', 0.04);
    }
  } catch (e) { /* audio not available */ }
}
function say(text) {
  if (!VIEWP.voice || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = LANG === 'th' ? 'th-TH' : 'en-US'; u.rate = 1; u.volume = VIEWP.vol ?? 0.6;
    const vv = speechSynthesis.getVoices().find(x => x.lang.startsWith(LANG === 'th' ? 'th' : 'en')); if (vv) u.voice = vv; speechSynthesis.speak(u); } catch (e) { /* no voice */ }
}
const bahtWords = n => LANG === 'th' ? `${Number.isInteger(+n) ? n : (+n).toFixed(2)} บาท` : `${n} baht`;

/* display settings */
function viewSettings() {
  const th = LANG === 'th';
  const m = modal(th ? 'ปรับการแสดงผลหน้าขาย' : 'Sell screen display', `
    <div class="fg"><label class="f">${th ? 'ขนาดรูป/ไทล์' : 'Picture / tile size'}: <b id="szv">${VIEWP.size}px</b></label>
      <input type="range" id="vsz" min="100" max="320" step="10" value="${VIEWP.size}" style="width:100%">
      <div class="row">${[[120, 'S'], [170, 'M'], [220, 'L'], [280, 'XL']].map(([v, l]) => `<button class="btn sm" data-sz="${v}">${l}</button>`).join('')}</div></div>
    <div class="grid2">
      <div class="fg"><label class="f">${th ? 'รูปแบบ' : 'Layout'}</label><select class="in" id="vlay"><option value="grid">${th ? 'ตาราง (ไทล์)' : 'Grid tiles'}</option><option value="list">${th ? 'รายการ' : 'List'}</option></select></div>
      <div class="fg"><label class="f">${th ? 'สัดส่วนรูป' : 'Picture shape'}</label><select class="in" id="vrat"><option value="1">${th ? 'สี่เหลี่ยมจัตุรัส' : 'Square'} 1:1</option><option value="43">${th ? 'แนวนอน' : 'Landscape'} 4:3</option><option value="34">${th ? 'แนวตั้ง' : 'Portrait'} 3:4</option></select></div>
      <div class="fg"><label class="f">${th ? 'การแสดงรูป' : 'Picture fit'}</label><select class="in" id="vfit"><option value="cover">${th ? 'เต็มกรอบ (ครอป)' : 'Fill (crop)'}</option><option value="contain">${th ? 'แสดงทั้งรูป' : 'Whole picture'}</option></select></div>
      <div class="fg"><label class="f">${th ? 'ความโค้งมุม' : 'Corner radius'}: <b id="rdv">${VIEWP.radius}</b></label><input type="range" id="vrad" min="0" max="28" value="${VIEWP.radius}" style="width:100%"></div>
    </div>
    <label class="row fg"><input type="checkbox" id="vov" ${VIEWP.overlay ? 'checked' : ''}> ${th ? 'ชื่อและราคาทับบนรูป' : 'Name & price on top of picture'}</label>
    <label class="row fg"><input type="checkbox" id="vst" ${VIEWP.showStock ? 'checked' : ''}> ${th ? 'แสดงจำนวนสต็อก' : 'Show stock'}</label>
    <label class="row fg"><input type="checkbox" id="vstat" ${VIEWP.stats ? 'checked' : ''}> ${th ? 'แสดงแถบยอดขายวันนี้' : 'Show today\'s stats bar'}</label>
    <div class="card" style="padding:12px;margin-bottom:12px"><b>🔊 ${th ? 'เสียงแคชเชียร์' : 'Cashier sounds'}</b>
      <label class="row fg" style="margin-top:8px"><input type="checkbox" id="vsnd" ${VIEWP.sound ? 'checked' : ''}> ${th ? 'เสียงบี๊บ / เสียงลิ้นชักเก็บเงิน' : 'Beeps & cash register sound'}</label>
      <label class="row fg"><input type="checkbox" id="vvoice" ${VIEWP.voice ? 'checked' : ''}> 🗣️ ${th ? 'พูดยอดชำระและเงินทอน' : 'Speak total and change'}</label>
      <label class="f">${th ? 'ความดัง' : 'Volume'}</label><input type="range" id="vvol" min="0" max="1" step="0.05" value="${VIEWP.vol ?? 0.6}" style="width:100%">
      <div class="row"><button class="btn sm" id="vtest">▶ ${th ? 'ทดสอบเสียง' : 'Test sound'}</button></div></div>
    <p class="muted" style="font-size:13px">💡 ${th ? 'กดค้างที่สินค้า (หรือปุ่ม ⋯) เพื่อเปลี่ยนรูป ถ่ายรูป เปลี่ยนสี หรือเพิ่มในรายการโปรด' : 'Long-press a product (or ⋯) to change its picture, take a photo, set a colour or favorite it.'}<br>⌨️ F2 ${th ? 'ค้นหา' : 'search'} · F4 ${t('Hold')} · F9 ${t('Pay')} · 3*barcode = ${t('Qty')} 3</p>`,
    {foot: `<button class="btn" id="vreset">${th ? 'ค่าเริ่มต้น' : 'Reset'}</button><span style="flex:1"></span><button class="btn p" data-ok>OK</button>`});
  $('#vlay', m).value = VIEWP.layout; $('#vrat', m).value = VIEWP.ratio; $('#vfit', m).value = VIEWP.fit;
  const upd = () => { Object.assign(VIEWP, { size: +$('#vsz', m).value, layout: $('#vlay', m).value, ratio: $('#vrat', m).value, fit: $('#vfit', m).value,
    radius: +$('#vrad', m).value, overlay: $('#vov', m).checked, showStock: $('#vst', m).checked, stats: $('#vstat', m).checked,
    sound: $('#vsnd', m).checked, voice: $('#vvoice', m).checked, vol: +$('#vvol', m).value });
    $('#szv', m).textContent = VIEWP.size + 'px'; $('#rdv', m).textContent = VIEWP.radius; saveView(); };
  $$('input,select', m).forEach(el => el.oninput = el.onchange = upd);
  $$('[data-sz]', m).forEach(b => b.onclick = () => { $('#vsz', m).value = b.dataset.sz; upd(); });
  $('#vtest', m).onclick = () => { sfx('add'); setTimeout(() => sfx('pay'), 250); say((LANG === 'th' ? 'เงินทอน ' : 'Change ') + bahtWords(410)); };
  $('#vreset', m).onclick = () => { VIEWP = { ...VIEW_DEF, sort: VIEWP.sort }; saveView(); m.close(); viewSettings(); };
  $('[data-ok]', m).onclick = m.close;
}

/* keyboard shortcuts on the sell screen */
document.addEventListener('keydown', e => {
  if (S.page !== 'pos' || !$('#pgrid')) return;
  if (e.key === 'F2') { e.preventDefault(); $('#psearch')?.focus(); }
  if (e.key === 'F4') { e.preventDefault(); $('#holdBtn')?.click(); }
  if (e.key === 'F9') { e.preventDefault(); if (!$('.mbg')) $('#payBtn')?.click(); }
  if (e.key === 'Escape') { $('.mbg:last-of-type .x')?.click(); }
});

function calc() {
  const sh = S.shop;
  const subtotal = r2(S.cart.reduce((a, l) => a + l.price * l.qty - num(l.discount), 0));
  let promoDisc = 0;
  const pr = S.promo;
  if (pr && subtotal >= num(pr.min_total) && (!pr.members_only || S.customer)) promoDisc = pr.kind === 'percent' ? subtotal * num(pr.value) / 100 : num(pr.value);
  const billDisc = S.billDiscPct ? subtotal * num(S.billDisc) / 100 : num(S.billDisc);
  const maxPts = S.customer ? num(S.customer.points) : 0;
  const pointsUse = Math.min(num(S.pointsUse), maxPts);
  const pointsDisc = pointsUse * num(sh.baht_per_point);
  const discount = r2(Math.min(subtotal, promoDisc + billDisc + pointsDisc));
  const after = r2(subtotal - discount);
  const rate = num(sh.vat_rate);
  let vat = 0, total = after;
  if (sh.vat_mode === 'included') vat = r2(after * rate / (100 + rate));
  if (sh.vat_mode === 'excluded') { vat = r2(after * rate / 100); total = r2(after + vat); }
  const pointsEarned = S.customer ? Math.floor(total * num(sh.points_per_baht)) : 0;
  return { subtotal, promoDisc: r2(promoDisc), billDisc: r2(billDisc), pointsUse, pointsDisc: r2(pointsDisc), discount, vat, total, pointsEarned };
}

function drawCart() {
  const el = $('#cart'); if (!el) return;
  const c = calc(); const n = S.cart.reduce((a, l) => a + l.qty, 0);
  const activePromos = S.promotions.filter(p => p.active && (!p.starts_on || p.starts_on <= ymd(new Date())) && (!p.ends_on || p.ends_on >= ymd(new Date())));
  el.innerHTML = `
    <div class="hd"><b style="flex:1">${t('Cart')} (${qtyf(n)})</b>
      <button class="btn sm" id="heldBtn">📂 ${S.held.length}</button>
      <button class="btn sm" id="holdBtn" ${S.cart.length ? '' : 'disabled'}>⏸ ${t('Hold')}</button>
      <button class="btn sm bad" id="clrBtn" ${S.cart.length ? '' : 'disabled'}>${t('Clear')}</button>
      <button class="x" id="cartClose" style="display:${matchMedia('(max-width:860px)').matches ? '' : 'none'}">×</button></div>
    <div class="hd" style="padding:8px 14px">
      <button class="btn sm" id="memBtn" style="flex:1;justify-content:flex-start">⭐ ${S.customer ? esc(S.customer.name) + ` · ${qtyf(S.customer.points)} ${t('Points')}` : t('Member')}</button>
      ${S.customer ? `<button class="btn sm" id="memX">×</button>` : ''}
      <select class="in" id="promoSel" style="width:auto;padding:6px 8px;font-size:13px"><option value="">🏷️ ${t('Promotion')}</option>
        ${activePromos.map(p => `<option value="${p.id}" ${S.promo?.id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
    </div>
    <div class="items">${S.cart.length ? S.cart.map((l, i) => `
      <div class="citem ${l.product_id === S._lastAdded ? 'new' : ''}"><div class="nm" data-i="${i}" style="cursor:pointer"><div>${esc(l.name)}</div>
        <small>฿${money(l.price)}${l.discount ? ` · -${money(l.discount)}` : ''}</small></div>
        <div class="qty"><button data-d="${i}">−</button><span data-q="${i}" style="cursor:pointer">${qtyf(l.qty)}</span><button data-u="${i}">+</button></div>
        <b style="width:76px;text-align:right">${money(l.price * l.qty - l.discount)}</b></div>`).join('') : `<div class="empty">🛒<br>${t('Cart is empty')}</div>`}</div>
    <div class="ft">
      <div class="tline"><span>${t('Subtotal')}</span><span>${money(c.subtotal)}</span></div>
      <div class="tline"><a href="#" id="discBtn">${t('Bill discount')}</a><span>${c.discount ? '-' + money(c.discount) : '0.00'}</span></div>
      ${S.customer && num(S.customer.points) > 0 ? `<div class="tline"><a href="#" id="ptsBtn">${t('Use points')} (${qtyf(c.pointsUse)})</a><span>-${money(c.pointsDisc)}</span></div>` : ''}
      ${S.shop.vat_mode !== 'none' ? `<div class="tline muted"><span>${t('VAT')} ${num(S.shop.vat_rate)}% ${S.shop.vat_mode === 'included' ? '(incl.)' : ''}</span><span>${money(c.vat)}</span></div>` : ''}
      <div class="tline big"><span>${t('Total')}</span><span>฿<span id="cTot" data-v="${S._lastTot || 0}">${money(S._lastTot || 0)}</span></span></div>
      <button class="btn p lg paybtn" id="payBtn" ${S.cart.length ? '' : 'disabled'}><span>💳 ${t('Pay')}</span><b>฿${money(c.total)}</b><kbd>F9</kbd></button>
    </div>`;
  countTo($('#cTot'), c.total); S._lastTot = c.total; S._lastAdded = null;
  const fab = $('#cartfab'); if (fab) { fab.innerHTML = `<span class="fc">${qtyf(n)}</span><span>${t('Cart')}</span><b>฿${money(c.total)}</b><span>›</span>`; fab.classList.toggle('empty', !n); }
  $('#cartClose').onclick = () => el.classList.remove('open');
  $$('[data-u]', el).forEach(b => b.onclick = () => { const l = S.cart[b.dataset.u]; const pr = S.products.find(p => p.id === l.product_id); addToCart(pr || l, 1, (l.unit || pr?.units?.length) ? {unit: l.unit || '', factor: l.factor || 1, price: l.price} : null); });
  $$('[data-d]', el).forEach(b => b.onclick = () => { const l = S.cart[b.dataset.d]; l.qty--; sfx('remove'); if (l.qty <= 0) S.cart.splice(b.dataset.d, 1); drawCart(); refreshBadges(); });
  $$('[data-q],[data-i]', el).forEach(b => b.onclick = () => editLine(+(b.dataset.q ?? b.dataset.i)));
  $('#clrBtn').onclick = () => { resetSale(); };
  $('#holdBtn').onclick = () => { S.held.push({at: Date.now(), cart: S.cart, customer: S.customer}); saveHeld(); resetSale(); toast(t('Hold'), 'ok'); };
  $('#heldBtn').onclick = showHeld;
  $('#memBtn').onclick = pickMember;
  if ($('#memX')) $('#memX').onclick = () => { S.customer = null; S.pointsUse = 0; drawCart(); };
  $('#promoSel').onchange = e => { S.promo = S.promotions.find(p => p.id === e.target.value) || null; drawCart(); };
  $('#discBtn').onclick = e => { e.preventDefault(); formModal(t('Bill discount'), [
    {k:'v', label:t('Discount'), type:'number'}, {k:'pct', label:t('Percent %'), type:'check'}], {v: S.billDisc || '', pct: S.billDiscPct},
    async o => { S.billDisc = num(o.v); S.billDiscPct = o.pct; drawCart(); }); };
  if ($('#ptsBtn')) $('#ptsBtn').onclick = e => { e.preventDefault(); formModal(`${t('Use points')} (max ${qtyf(S.customer.points)})`, [
    {k:'v', label:t('Points'), type:'number'}], {v: S.pointsUse || S.customer.points}, async o => { S.pointsUse = Math.max(0, Math.min(num(o.v), num(S.customer.points))); drawCart(); }); };
  $('#payBtn').onclick = payDialog;
  bc?.postMessage({type: 'cart', shop: S.shop.name, cart: S.cart, calc: c, customer: S.customer?.name || ''});
}
function editLine(i) {
  const l = S.cart[i];
  formModal(l.name, [
    {k:'qty', label:t('Qty'), type:'number', req:true}, {k:'price', label:t('Price'), type:'number', req:true},
    {k:'discount', label:t('Item discount') + ' (฿)', type:'number'}], l,
    async o => { if (o.qty <= 0) S.cart.splice(i, 1); else Object.assign(l, {qty: o.qty, price: o.price, discount: num(o.discount)}); drawCart(); },
    {extraFoot: `<button class="btn bad" id="rmLine">${t('Delete')}</button>`});
  $('#rmLine').onclick = () => { S.cart.splice(i, 1); $('.mbg').remove(); drawCart(); };
}
function saveHeld() { localStorage.setItem('pos_held', JSON.stringify(S.held)); }
function showHeld() {
  const m = modal(t('Held bills'), S.held.length ? `<table class="tbl">${S.held.map((h, i) => `<tr><td>${dt(h.at)}<br><small class="muted">${h.cart.length} ${t('Items')} ${h.customer ? '· ' + esc(h.customer.name) : ''}</small></td>
    <td class="right">${money(h.cart.reduce((a, l) => a + l.price * l.qty - l.discount, 0))}</td><td class="right"><button class="btn sm p" data-o="${i}">${t('Open')}</button> <button class="btn sm bad" data-x="${i}">×</button></td></tr>`).join('')}</table>` : `<div class="empty">—</div>`);
  $$('[data-o]', m).forEach(b => b.onclick = () => {
    if (S.cart.length) { S.held.push({at: Date.now(), cart: S.cart, customer: S.customer}); }
    const h = S.held.splice(+b.dataset.o, 1)[0]; S.cart = h.cart; S.customer = h.customer ? S.customers.find(c => c.id === h.customer.id) || h.customer : null;
    saveHeld(); m.close(); drawCart(); });
  $$('[data-x]', m).forEach(b => b.onclick = () => { S.held.splice(+b.dataset.x, 1); saveHeld(); m.close(); showHeld(); drawCart(); });
}
function resetSale() { S.cart = []; S.customer = null; S.promo = null; S.billDisc = 0; S.billDiscPct = false; S.pointsUse = 0; drawCart(); refreshBadges(); }

function pickMember() {
  const m = modal(t('Member'), `<div class="row" style="margin-bottom:10px"><input class="in" id="ms" placeholder="${t('Search')} ${t('Name')} / ${t('Phone')}" style="flex:1"><button class="btn p" id="mAdd">+ ${t('Add member')}</button></div><div id="ml"></div>`);
  const draw = () => {
    const v = $('#ms', m).value.toLowerCase();
    const list = S.customers.filter(c => !v || c.name.toLowerCase().includes(v) || (c.phone || '').includes(v)).slice(0, 50);
    $('#ml', m).innerHTML = `<table class="tbl">${list.map(c => `<tr class="click" data-id="${c.id}"><td><b>${esc(c.name)}</b><br><small class="muted">${esc(c.phone)}</small></td><td class="right">${qtyf(c.points)} ${t('Points')}</td></tr>`).join('')}</table>`;
    $$('[data-id]', m).forEach(r => r.onclick = () => { S.customer = S.customers.find(c => c.id === r.dataset.id); S.pointsUse = 0; if (num(S.customer.discount_pct) > 0) { S.billDisc = num(S.customer.discount_pct); S.billDiscPct = true; toast(`${LANG === 'th' ? 'ส่วนลดสมาชิก' : 'Member discount'} ${S.customer.discount_pct}%`, 'ok'); } m.close(); drawCart(); });
  };
  $('#ms', m).oninput = draw; draw(); $('#ms', m).focus();
  $('#mAdd', m).onclick = () => { m.close(); memberForm({}, c => { S.customer = c; drawCart(); }); };
}
function memberForm(v, after) {
  formModal(v.id ? t('Edit') : t('Add member'), [
    {k:'name', label:t('Name'), req:true}, {k:'phone', label:t('Phone'), type:'tel'},
    {k:'points', label:t('Points'), type:'number', def:0}, {k:'note', label:t('Note')}], v,
    async o => {
      const row = await q(v.id ? sb.from('customers').update(o).eq('id', v.id).select().single() : sb.from('customers').insert({...o, shop_id: S.shop.id}).select().single());
      const i = S.customers.findIndex(c => c.id === row.id); if (i >= 0) S.customers[i] = row; else S.customers.push(row);
      after?.(row);
    });
}

/* ---------- payment ---------- */
function crc16(s) { let c = 0xFFFF; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; c &= 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
function promptPayPayload(id, amount) {
  const f = (tag, v) => tag + String(v.length).padStart(2, '0') + v;
  id = String(id).replace(/\D/g, '');
  let acc;
  if (id.length >= 15) acc = f('03', id);
  else if (id.length >= 13) acc = f('02', id);
  else acc = f('01', ('0000000000000' + id.replace(/^0/, '66')).slice(-13));
  let p = f('00', '01') + f('01', amount ? '12' : '11') + f('29', f('00', 'A000000677010111') + acc) + f('58', 'TH') + f('53', '764');
  if (amount) p += f('54', amount.toFixed(2));
  p += '6304';
  return p + crc16(p);
}
function qrSvg(text) { const qr = qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createSvgTag({cellSize: 6, margin: 2, scalable: true}); }

function payDialog() {
  const c = calc(); let method = 'cash';
  const m = modal(`${t('Pay')} ฿${money(c.total)}`, `
    <div class="paym">${[['cash', '💵 ' + t('Cash')], ['promptpay', '📱 PromptPay'], ['transfer', '🏦 ' + t('Transfer')], ['card', '💳 ' + t('Card')]].map(([k, l]) => `<button data-m="${k}" class="${k === method ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="pbody"></div>
    <label class="row" style="margin-top:10px"><input type="checkbox" id="autoPrint" ${localStorage.getItem('pos_autoprint') === '1' ? 'checked' : ''}> 🖨️ ${t('Remember to print')}</label>`,
    {foot: `<button class="btn" data-c>${t('Cancel')}</button><button class="btn ok lg" id="cfm">✔ ${t('Confirm payment')}</button>`});
  $('[data-c]', m).onclick = m.close;
  say((LANG === 'th' ? 'ยอดชำระ ' : 'Total ') + bahtWords(c.total));
  const body = () => {
    const pb = $('#pbody', m);
    if (method === 'cash') {
      const notes = [...new Set([c.total, Math.ceil(c.total / 20) * 20, Math.ceil(c.total / 100) * 100, Math.ceil(c.total / 500) * 500, Math.ceil(c.total / 1000) * 1000, 1000])].filter(v => v >= c.total).slice(0, 6);
      pb.innerHTML = `<label class="f">${t('Received')}</label><input class="in" id="recv" type="number" step="any" inputmode="decimal" value="${c.total}" style="font-size:26px;font-weight:800">
        <div class="quick">${notes.map(v => `<button class="btn" data-v="${v}">${v === c.total ? t('Exact') : '฿' + money(v)}</button>`).join('')}</div>
        <div class="tline big"><span>${t('Change')}</span><span id="chg">0.00</span></div>`;
      const upd = () => { const ch = num($('#recv', m).value) - c.total; $('#chg', m).textContent = money(ch); $('#chg', m).style.color = ch < 0 ? 'var(--bad)' : 'var(--ok)'; };
      $('#recv', m).oninput = upd; upd(); $('#recv', m).select();
      $$('[data-v]', m).forEach(b => b.onclick = () => { $('#recv', m).value = b.dataset.v; upd(); });
      $('#recv', m).onkeydown = e => { if (e.key === 'Enter') $('#cfm', m).click(); };
    } else if (method === 'promptpay') {
      if (!S.shop.promptpay_id) { pb.innerHTML = `<p class="chip warn">${t('Set PromptPay ID in Settings first')}</p>`; return; }
      const payload = promptPayPayload(S.shop.promptpay_id, c.total);
      pb.innerHTML = `<div class="qr">${qrSvg(payload)}<b style="font-size:22px">฿${money(c.total)}</b><span class="muted">${t('Scan PromptPay QR to pay')}</span></div>`;
      bc?.postMessage({type: 'qr', svg: qrSvg(payload), total: c.total});
    } else pb.innerHTML = `<div class="empty" style="padding:20px">${method === 'card' ? '💳' : '🏦'} ฿${money(c.total)}</div>`;
  };
  $$('[data-m]', m).forEach(b => b.onclick = () => { method = b.dataset.m; $$('[data-m]', m).forEach(x => x.classList.toggle('on', x === b)); body(); });
  body();
  $('#cfm', m).onclick = async () => {
    const paid = method === 'cash' ? num($('#recv', m).value) : c.total;
    if (paid + 0.001 < c.total) return toast(t('Not enough money'), 'bad');
    localStorage.setItem('pos_autoprint', $('#autoPrint', m).checked ? '1' : '0');
    const btn = $('#cfm', m); btn.disabled = true;
    try {
      const sale = await q(sb.rpc('create_sale', { p_shop: S.shop.id, p: {
        customer_id: S.customer?.id || '', shift_id: S.shift?.id || '', subtotal: c.subtotal, discount: c.discount,
        points_used: c.pointsUse, points_earned: c.pointsEarned, vat: c.vat, total: c.total, paid, change: r2(paid - c.total),
        payment_method: method, note: S.promo ? 'Promo: ' + S.promo.name : '',
        items: S.cart.map(l => ({product_id: l.product_id, name: l.name, qty: l.qty, price: l.price, discount: num(l.discount)})) } }));
      // local stock / points update
      S.cart.forEach(l => { const p = S.products.find(x => x.id === l.product_id); if (p?.track_stock) p.stock -= l.qty; });
      if (S.customer) { S.customer.points = Math.max(0, num(S.customer.points) - c.pointsUse + c.pointsEarned); }
      const items = S.cart.map(l => ({...l}));
      m.close();
      bc?.postMessage({type: 'thanks', total: c.total, change: sale.change});
      sfx('pay'); if (num(sale.change) > 0) say((LANG === 'th' ? 'เงินทอน ' : 'Change ') + bahtWords(num(sale.change))); else say(LANG === 'th' ? 'ขอบคุณค่ะ' : 'Thank you');
      const cust = S.customer;
      resetSale(); drawGrid(); loadPosStats().catch(() => {});
      showReceipt(sale, items, cust, localStorage.getItem('pos_autoprint') === '1');
    } catch (e) { fail(e); btn.disabled = false; }
  };
}

/* ---------- receipt ---------- */
function receiptHTML(sale, items, cust) {
  const sh = S.shop; const pm = {cash: t('Cash'), promptpay: 'PromptPay', transfer: t('Transfer'), card: t('Card')};
  return `<div class="rcpt ${sh.paper_width >= 80 ? 'w80' : ''}">
    <div class="c t">${esc(sh.name)}</div>
    ${sh.receipt_header ? `<div class="c">${esc(sh.receipt_header).replace(/\n/g, '<br>')}</div>` : ''}
    ${sh.address ? `<div class="c">${esc(sh.address)}</div>` : ''}${sh.phone ? `<div class="c">โทร ${esc(sh.phone)}</div>` : ''}
    ${sh.vat_mode !== 'none' ? `<div class="c">TAX ID ${esc(sh.tax_id)}<br><b>${t('Tax invoice (ABB)')}</b></div>` : ''}
    <hr><div>${t('Bill')}: ${esc(sale.bill_no)}<br>${dt(sale.created_at)}<br>${t('Cashier')}: ${esc(sale.cashier_name)}</div>
    ${sale.status === 'void' ? '<div class="c t">*** VOID ***</div>' : ''}<hr>
    <table>${items.map(l => `<tr><td colspan="2">${esc(l.name)}</td></tr><tr><td>&nbsp;${qtyf(l.qty)} x ${money(l.price)}${num(l.discount) ? ` (-${money(l.discount)})` : ''}</td><td class="right">${money(l.qty * l.price - num(l.discount))}</td></tr>`).join('')}</table><hr>
    <table><tr><td>${t('Subtotal')}</td><td class="right">${money(sale.subtotal)}</td></tr>
    ${num(sale.discount) ? `<tr><td>${t('Discount')}</td><td class="right">-${money(sale.discount)}</td></tr>` : ''}
    ${sh.vat_mode !== 'none' ? `<tr><td>${t('VAT')} ${num(sh.vat_rate)}%</td><td class="right">${money(sale.vat)}</td></tr>` : ''}
    <tr><td class="t">${t('Total')}</td><td class="right t">${money(sale.total)}</td></tr>
    <tr><td>${pm[sale.payment_method] || sale.payment_method}</td><td class="right">${money(sale.paid)}</td></tr>
    ${sale.payment_method === 'cash' ? `<tr><td>${t('Change')}</td><td class="right">${money(sale.change)}</td></tr>` : ''}</table>
    ${cust ? `<hr><div>${t('Member')}: ${esc(cust.name)}<br>${t('Points earned')}: ${qtyf(sale.points_earned)} · ${t('Points')}: ${qtyf(cust.points)}</div>` : ''}
    <hr><div class="c">${esc(sh.receipt_footer || '').replace(/\n/g, '<br>')}</div></div>`;
}
function printReceipt(html) { $('#print').innerHTML = html; setTimeout(() => window.print(), 80); }
function showReceipt(sale, items, cust, autoPrint) {
  const html = receiptHTML(sale, items, cust);
  const m = modal(`${t('Receipt')} ${sale.bill_no}`, `${sale.payment_method === 'cash' && sale.status !== 'void' ? `<div class="tline big" style="margin-bottom:10px"><span>${t('Change')}</span><span style="color:var(--ok)">฿${money(sale.change)}</span></div>` : ''}<div class="rcptbox">${html}</div>`,
    {foot: `<button class="btn" id="rp">🖨️ ${t('Print')}</button><button class="btn p" data-c>${t('New sale')}</button>`});
  $('#rp', m).onclick = () => printReceipt(html);
  $('[data-c]', m).onclick = () => { m.close(); $('#psearch')?.focus(); };
  if (autoPrint) printReceipt(html);
}

/* ---------- barcode camera ---------- */
let h5Loaded = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
async function scanBarcode(onCode) {
  const m = modal(t('Scan'), `<div id="reader" style="width:100%;min-height:260px"></div><p class="muted" style="text-align:center">📷 ${t('Barcode')} / QR</p>`);
  try {
    h5Loaded ||= loadScript('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js');
    await h5Loaded;
    const sc = new Html5Qrcode('reader');
    let done = false;
    const stop = () => sc.stop().catch(() => {});
    const oldClose = m.close; m.close = () => { stop(); oldClose(); }; $('.x', m).onclick = m.close;
    await sc.start({facingMode: 'environment'}, {fps: 12, qrbox: {width: 260, height: 160}}, txt => {
      if (done) return; done = true; navigator.vibrate?.(80); stop().then(() => { m.remove(); onCode(txt.trim()); });
    });
  } catch (e) { fail(e); }
}

/* ================= BILLS ================= */
VIEWS.sales = pg => {
  const today = ymd(new Date());
  pg.innerHTML = `<div class="row" style="margin-bottom:12px"><input type="date" class="in" id="d1" value="${today}" style="width:auto"> – <input type="date" class="in" id="d2" value="${today}" style="width:auto">
    <input class="in" id="bs" placeholder="${t('Search')} ${t('Bill')}" style="width:180px"><span class="sp"></span><button class="btn" id="bx">⬇ ${t('Export CSV')}</button></div><div id="bl"></div>`;
  let rows = [];
  const load = async () => {
    const d1 = new Date($('#d1').value + 'T00:00:00'), d2 = new Date($('#d2').value + 'T23:59:59.999');
    let qb = () => sb.from('sales').select('*, customer:customers(name)').eq('shop_id', S.shop.id).gte('created_at', d1.toISOString()).lte('created_at', d2.toISOString()).order('created_at', {ascending: false});
    rows = await fetchAll(qb);
    if (S.role === 'cashier') rows = rows.filter(r => r.cashier_id === S.user.id);
    draw();
  };
  const draw = () => {
    const v = $('#bs').value.trim();
    const list = rows.filter(r => !v || r.bill_no.includes(v));
    const paid = list.filter(r => r.status === 'paid');
    $('#bl').innerHTML = `<div class="stats"><div class="stat"><div class="k">${t('Bills count')}</div><div class="v">${paid.length}</div></div>
      <div class="stat"><div class="k">${t('Sales')}</div><div class="v">฿${money(paid.reduce((a, r) => a + num(r.total), 0))}</div></div></div>
      <div class="tblwrap"><table class="tbl"><tr><th>${t('Bill')}</th><th>${t('Time')}</th><th>${t('Member')}</th><th>${t('Payment')}</th><th>${t('Cashier')}</th><th class="right">${t('Total')}</th><th>${t('Status')}</th></tr>
      ${list.map(r => `<tr class="click" data-id="${r.id}"><td><b>${esc(r.bill_no)}</b></td><td>${dt(r.created_at)}</td><td>${esc(r.customer?.name || '')}</td><td>${esc(r.payment_method)}</td><td>${esc(r.cashier_name)}</td>
        <td class="right b">${money(r.total)}</td><td>${r.status === 'void' ? `<span class="chip bad">${t('Voided')}</span>` : '<span class="chip ok">✓</span>'}</td></tr>`).join('')}</table></div>`;
    $$('[data-id]', pg).forEach(tr => tr.onclick = () => billDetail(rows.find(r => r.id === tr.dataset.id), load));
  };
  $('#d1').onchange = $('#d2').onchange = load; $('#bs').oninput = draw;
  $('#bx').onclick = () => download(`bills_${$('#d1').value}_${$('#d2').value}.csv`, toCSV(rows, ['bill_no', 'created_at', 'cashier_name', 'payment_method', 'subtotal', 'discount', 'vat', 'total', 'cost_total', 'status']));
  load().catch(fail);
};
async function billDetail(sale, reload) {
  const items = await q(sb.from('sale_items').select('*').eq('sale_id', sale.id));
  const cust = sale.customer_id ? S.customers.find(c => c.id === sale.customer_id) : null;
  const html = receiptHTML(sale, items, cust);
  const m = modal(`${t('Bill')} ${sale.bill_no}`, `<div class="rcptbox">${html}</div>`, {foot:
    `${sale.status === 'paid' && can('owner', 'manager') ? `<button class="btn bad" id="vd">${t('Void')}</button>` : ''}<span style="flex:1"></span><button class="btn p" id="rp">🖨️ ${t('Reprint')}</button>`});
  $('#rp', m).onclick = () => printReceipt(html);
  if ($('#vd', m)) $('#vd', m).onclick = () => formModal(t('Void') + ' ' + sale.bill_no, [{k: 'reason', label: t('Reason'), req: true, full: true}], {}, async o => {
    await q(sb.rpc('void_sale', {p_sale: sale.id, p_reason: o.reason})); m.close(); await loadMaster(); reload();
  });
}

/* ================= PRODUCTS ================= */
VIEWS.products = pg => {
  const th = LANG === 'th';
  $('#tact').innerHTML = `<button class="btn p" id="addBtn">+ ${t('Add product')}</button><button class="btn" id="autoPic">🪄 ${th ? 'ใส่รูปอัตโนมัติ' : 'Auto pictures'}</button><button class="btn" id="catBtn">🗂 ${t('Categories')}</button><button class="btn" id="impBtn">⬆ ${t('Import CSV')}</button><button class="btn" id="expBtn">⬇ ${t('Export CSV')}</button>`;
  pg.innerHTML = `<div class="row" style="margin-bottom:12px">
      <div class="sbox" style="max-width:340px"><span>🔍</span><input class="in" id="ps" placeholder="${t('Search')} / ${t('Barcode')}"></div>
      <select class="in" id="pc" style="width:auto"><option value="">${t('All')}</option>${S.categories.map(c => `<option value="${c.id}">${esc((c.icon ? c.icon + ' ' : '') + c.name)}</option>`).join('')}</select>
      <select class="in" id="pf" style="width:auto"><option value="">${th ? 'ทุกสถานะ' : 'Any status'}</option><option value="low">⚠️ ${t('Low stock')}</option><option value="nopic">🖼️ ${th ? 'ยังไม่มีรูป' : 'No picture'}</option><option value="off">⛔ ${th ? 'ปิดขาย' : 'Inactive'}</option></select></div>
    <p class="muted" style="font-size:13px;margin:-4px 0 10px">✏️ ${th ? 'แก้ราคา ต้นทุน สต็อก หรือชื่อได้ทันทีในตาราง — บันทึกอัตโนมัติ · แตะรูปเพื่อเปลี่ยน/ค้นหาจากเว็บ' : 'Edit name, price, cost or stock right in the list — saves automatically · tap a picture to change it or search the web'}</p>
    <div class="elist" id="plist"></div><p class="muted" id="pcount"></p>`;
  let list = [], shown = 0, io = null;
  const rowHTML = p => { const mg = p.price > 0 ? (p.price - p.cost) / p.price * 100 : 0; return `<div class="erow ${p.active ? '' : 'off'}" data-id="${p.id}">
      <button class="eimg" data-pic style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(p.tile_color || catColor(p.category_id))}`}">${p.image_url ? '' : '<span>📷</span>'}</button>
      <div class="ename"><input class="in" data-f="name" value="${esc(p.name)}" title="${esc(p.name)}"><small>${esc(S.categories.find(c => c.id === p.category_id)?.name || '')}${p.barcode ? ' · ' + esc(p.barcode) : ''}</small></div>
      <label class="enum"><small>${t('Price')}</small><input class="in" data-f="price" type="number" step="any" inputmode="decimal" value="${num(p.price)}"></label>
      <label class="enum"><small>${t('Cost')}</small><input class="in" data-f="cost" type="number" step="any" inputmode="decimal" value="${num(p.cost)}"></label>
      <label class="enum stk ${p.track_stock ? (p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : '') : ''}"><small>${t('Stock')} (${esc(p.unit)})</small>${p.track_stock ? `<input class="in" data-f="stock" type="number" step="any" inputmode="decimal" value="${num(p.stock)}">` : '<input class="in" value="∞" disabled>'}</label>
      <span class="emg chip ${mg < 15 ? 'bad' : mg < 30 ? 'warn' : 'ok'}" data-mg>${mg.toFixed(0)}%</span>
      <button class="btn sm" data-edit title="${t('Edit')}">✏️</button></div>`; };
  const more = () => {
    const box = $('#plist'); const to = Math.min(list.length, shown + 50);
    box.querySelector('.sentinel')?.remove();
    box.insertAdjacentHTML('beforeend', list.slice(shown, to).map(rowHTML).join('') + (to < list.length ? '<div class="sentinel"></div>' : ''));
    shown = to;
    const sen = box.querySelector('.sentinel'); io?.disconnect();
    if (sen) { io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, {root: $('#pg'), rootMargin: '500px'}); io.observe(sen); }
  };
  const draw = () => {
    const v = $('#ps').value.toLowerCase(), c = $('#pc').value, f = $('#pf').value;
    list = S.products.filter(p => (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)) && (!c || p.category_id === c) &&
      (!f || (f === 'low' ? p.track_stock && p.stock <= p.low_stock : f === 'nopic' ? !p.image_url : !p.active)));
    shown = 0; $('#plist').innerHTML = list.length ? `<div class="erow head"><span></span><span>${t('Name')}</span><span>${t('Price')}</span><span>${t('Cost')}</span><span>${t('Stock')}</span><span>${t('Margin')}</span><span></span></div>` : `<div class="empty">—</div>`;
    more();
    const nopic = S.products.filter(p => !p.image_url).length;
    $('#pcount').textContent = `${list.length} ${t('Items')} · 🖼️ ${th ? 'ไม่มีรูป' : 'no picture'} ${nopic}`;
  };
  // inline save (delegated)
  const box = $('#plist');
  box.addEventListener('focusin', e => { const i = e.target.closest('input[data-f]'); if (i) i.dataset.old = i.value; });
  box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[data-f]')) { e.preventDefault(); e.target.blur(); } });
  box.addEventListener('change', async e => {
    const i = e.target.closest('input[data-f]'); if (!i) return;
    const row = i.closest('.erow'), p = S.products.find(x => x.id === row.dataset.id), f = i.dataset.f;
    const val = f === 'name' ? i.value.trim() : num(i.value);
    if (f === 'name' && !val) { i.value = p.name; return; }
    i.classList.remove('saved', 'err'); i.classList.add('saving');
    try {
      if (f === 'stock') {
        await q(sb.rpc('stock_move', {p_shop: S.shop.id, p_product: p.id, p_kind: 'adjust', p_qty: val, p_cost: null, p_supplier: null, p_note: th ? 'แก้ไขในรายการสินค้า' : 'edited in product list'}));
        p.stock = val;
        row.querySelector('.stk').className = `enum stk ${p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : ''}`;
      } else {
        await q(sb.from('products').update({[f]: val}).eq('id', p.id)); p[f] = val;
      }
      const mg = p.price > 0 ? (p.price - p.cost) / p.price * 100 : 0; const mc = row.querySelector('[data-mg]');
      mc.textContent = mg.toFixed(0) + '%'; mc.className = `emg chip ${mg < 15 ? 'bad' : mg < 30 ? 'warn' : 'ok'}`;
      i.classList.remove('saving'); i.classList.add('saved'); sfx('ok'); setTimeout(() => i.classList.remove('saved'), 1200);
    } catch (err) { i.classList.remove('saving'); i.classList.add('err'); i.value = i.dataset.old ?? i.value; fail(err); }
  });
  box.addEventListener('click', e => {
    const row = e.target.closest('.erow:not(.head)'); if (!row) return; const p = S.products.find(x => x.id === row.dataset.id);
    if (e.target.closest('[data-pic]')) pictureMenu(p, draw);
    else if (e.target.closest('[data-edit]')) productForm(p, draw);
  });
  $('#ps').oninput = $('#pc').onchange = $('#pf').onchange = draw;
  $('#addBtn').onclick = () => productForm({}, draw);
  $('#autoPic').onclick = () => autoPictures(draw);
  $('#catBtn').onclick = () => categoryManager(() => go('products'));
  $('#expBtn').onclick = () => download('products.csv', toCSV(S.products.map(p => ({...p, category: S.categories.find(c => c.id === p.category_id)?.name || ''})), ['name', 'barcode', 'sku', 'category', 'price', 'cost', 'stock', 'unit', 'low_stock', 'image_url']));
  $('#impBtn').onclick = importProducts;
  draw();
};
function productForm(p, after) {
  const isNew = !p.id;
  const m = formModal(isNew ? t('Add product') : p.name, [
    {k:'name', label:t('Name'), req:true, full:true},
    {k:'barcode', label:t('Barcode'), after:`<button type="button" class="btn sm" id="pscan" style="margin-top:6px">📷 ${t('Scan')}</button>`}, {k:'sku', label:'SKU'},
    {k:'category_id', label:t('Category'), type:'select', opts:[['', '—'], ...S.categories.map(c => [c.id, c.name])]},
    {k:'unit', label:t('Unit'), def:'ชิ้น'},
    {k:'price', label:t('Price'), type:'number', req:true}, {k:'cost', label:t('Cost'), type:'number', def:0},
    ...(isNew ? [{k:'stock', label:t('Stock'), type:'number', def:0}] : []),
    {k:'low_stock', label:t('Low stock alert'), type:'number', def:5},
    {k:'image_url', label:t('Image URL'), full:true, after:`<div class="row" style="margin-top:8px"><div id="pimgPrev" class="qm-img" style="width:72px;height:72px;${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}"></div>
      <button type="button" class="btn sm" id="pimgUp">🖼️ ${LANG === 'th' ? 'อัปโหลดรูป' : 'Upload picture'}</button><button type="button" class="btn sm" id="pimgCam">📸 ${LANG === 'th' ? 'ถ่ายรูป' : 'Take photo'}</button><button type="button" class="btn sm" id="pimgWeb">🔎 ${LANG === 'th' ? 'หาจากเว็บ' : 'Web'}</button><button type="button" class="btn sm" id="pimgX">×</button></div>`},
    {k:'tile_color', label:(LANG === 'th' ? 'สีไทล์' : 'Tile colour'), type:'color', def: catColor(p.category_id)},
    {k:'favorite', label:'★ ' + (LANG === 'th' ? 'รายการโปรด' : 'Favorite'), type:'check'},
    {k:'track_stock', label:t('Track stock'), type:'check', def:true}, {k:'active', label:t('Active'), type:'check', def:true},
  ], isNew ? {track_stock: true, active: true} : p, async o => {
    o.category_id = o.category_id || null; o.cost = num(o.cost); o.low_stock = num(o.low_stock);
    if (isNew) {
      const st = num(o.stock); delete o.stock;
      let row = await q(sb.from('products').insert({...o, shop_id: S.shop.id}).select().single());
      if (st) { await q(sb.rpc('stock_move', {p_shop: S.shop.id, p_product: row.id, p_kind: 'in', p_qty: st, p_cost: o.cost, p_supplier: null, p_note: 'initial'})); row.stock = st; }
      S.products.push(row);
    } else {
      const row = await q(sb.from('products').update(o).eq('id', p.id).select().single());
      Object.assign(p, row);
    }
    S.products.sort((a, b) => a.name.localeCompare(b.name)); after?.();
  }, {extraFoot: isNew ? '' : `<button class="btn bad" id="pdel">${t('Delete')}</button>`});
  $('#pscan', m).onclick = () => scanBarcode(code => { $('[name=barcode]', m).value = code; });
  const setImg = u => { $('[name=image_url]', m).value = u; $('#pimgPrev', m).style.backgroundImage = u ? `url('${u}')` : ''; };
  const up = async cap => { const f = await pickImage(cap); if (!f) return; toast(LANG === 'th' ? 'กำลังอัปโหลดรูป…' : 'Uploading picture…'); try { setImg(await uploadImageFile(f)); toast(t('Saved'), 'ok'); } catch (e) { fail(e); } };
  $('#pimgWeb', m).onclick = async () => {
    const name = $('[name=name]', m).value.trim(); if (!name) return toast(t('Name') + ' ?', 'bad');
    const tmp = {id: p.id || 'new', name, barcode: $('[name=barcode]', m).value.trim()};
    const w = modal('🔎 ' + name, `<div class="picgrid" id="fw">${Array(8).fill('<i class="sk"></i>').join('')}</div>`, {wide: true});
    try {
      const imgs = await webImageSearch(name, tmp.barcode);
      $('#fw', w).innerHTML = imgs.map((x, i) => `<button data-i="${i}"><img src="${esc(x.thumb)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></button>`).join('') || '—';
      $$('[data-i]', w).forEach(b => b.onclick = async () => { b.classList.add('busy');
        try { let blob; try { blob = await webImageBlob(imgs[+b.dataset.i].url); } catch (e) { blob = await webImageBlob(imgs[+b.dataset.i].thumb); }
          const png = await toPng(blob); const path = `${S.shop.id}/${crypto.randomUUID()}.${png.type === 'image/webp' ? 'webp' : 'png'}`;
          const { error } = await sb.storage.from('product-images').upload(path, png, { contentType: png.type || 'image/png' }); if (error) throw error;
          setImg(sb.storage.from('product-images').getPublicUrl(path).data.publicUrl); w.close(); toast(t('Saved'), 'ok'); } catch (e) { b.classList.remove('busy'); fail(e); } });
    } catch (e) { fail(e); }
  };
  $('#pimgUp', m).onclick = () => up(false); $('#pimgCam', m).onclick = () => up(true); $('#pimgX', m).onclick = () => setImg('');
  $('[name=image_url]', m).oninput = e => setImg(e.target.value.trim());
  if (!isNew) $('#pdel', m).onclick = async () => {
    if (!await confirmBox(p.name)) return;
    try { await q(sb.from('products').delete().eq('id', p.id)); S.products = S.products.filter(x => x.id !== p.id); m.close(); toast(t('Deleted')); after?.(); } catch (e) { fail(e); }
  };
}
function categoryManager(after) {
  const m = modal(t('Categories'), `<div id="cl"></div><div class="row" style="margin-top:12px"><input class="in" id="cn" placeholder="${t('Name')}" style="flex:1"><input type="color" id="cc" value="#6366f1" style="width:48px;height:42px;border:0;background:none"><button class="btn p" id="ca">+ ${t('Add')}</button></div>`);
  const draw = () => {
    $('#cl', m).innerHTML = `<table class="tbl">${S.categories.map(c => `<tr><td><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${esc(c.color)}"></span> ${esc(c.name)}</td>
      <td class="right"><button class="btn sm" data-e="${c.id}">${t('Edit')}</button> <button class="btn sm bad" data-x="${c.id}">×</button></td></tr>`).join('')}</table>`;
    $$('[data-x]', m).forEach(b => b.onclick = async () => { try { await q(sb.from('categories').delete().eq('id', b.dataset.x)); S.categories = S.categories.filter(c => c.id !== b.dataset.x); S.products.forEach(p => { if (p.category_id === b.dataset.x) p.category_id = null; }); draw(); } catch (e) { fail(e); } });
    $$('[data-e]', m).forEach(b => b.onclick = () => { const c = S.categories.find(x => x.id === b.dataset.e);
      formModal(t('Edit'), [{k:'name', label:t('Name'), req:true}, {k:'color', label:t('Color'), type:'color'}, {k:'sort', label:'#', type:'number'}], c, async o => {
        Object.assign(c, await q(sb.from('categories').update(o).eq('id', c.id).select().single())); draw(); }); });
  };
  $('#ca', m).onclick = async () => {
    const name = $('#cn', m).value.trim(); if (!name) return;
    try { S.categories.push(await q(sb.from('categories').insert({shop_id: S.shop.id, name, color: $('#cc', m).value, sort: S.categories.length}).select().single())); $('#cn', m).value = ''; draw(); } catch (e) { fail(e); }
  };
  const oc = m.close; m.close = () => { oc(); after?.(); }; $('.x', m).onclick = m.close;
  draw();
}
function importProducts() {
  const m = modal(t('Import CSV'), `<p class="muted">${t('CSV columns: name, barcode, sku, category, price, cost, stock, unit')}</p>
    <input type="file" accept=".csv,text/csv" id="cf" class="in"><p><a href="#" id="tpl">⬇ template.csv</a></p><div id="cpv"></div>`, {foot: `<button class="btn p" id="ci" disabled>${t('Import CSV')}</button>`});
  $('#tpl', m).onclick = e => { e.preventDefault(); download('template.csv', 'name,barcode,sku,category,price,cost,stock,unit\nน้ำดื่ม 600ml,8850999320014,W600,เครื่องดื่ม,10,6,48,ขวด\n'); };
  let rows = [];
  $('#cf', m).onchange = async e => { rows = parseCSV(await e.target.files[0].text()).filter(r => r.name); $('#cpv', m).innerHTML = `<b>${rows.length}</b> ${t('Items')}`; $('#ci', m).disabled = !rows.length; };
  $('#ci', m).onclick = async () => {
    $('#ci', m).disabled = true;
    try {
      for (const name of [...new Set(rows.map(r => r.category).filter(Boolean))]) {
        if (!S.categories.find(c => c.name === name)) S.categories.push(await q(sb.from('categories').insert({shop_id: S.shop.id, name, sort: S.categories.length}).select().single()));
      }
      const recs = rows.map(r => ({shop_id: S.shop.id, name: r.name, barcode: r.barcode || '', sku: r.sku || '', price: num(r.price), cost: num(r.cost), stock: num(r.stock), unit: r.unit || 'ชิ้น',
        category_id: S.categories.find(c => c.name === r.category)?.id || null}));
      for (let i = 0; i < recs.length; i += 500) S.products.push(...await q(sb.from('products').insert(recs.slice(i, i + 500)).select()));
      m.close(); toast(`${t('Imported')} ${recs.length}`, 'ok'); go('products');
    } catch (e) { fail(e); $('#ci', m).disabled = false; }
  };
}

/* ================= STOCK ================= */
VIEWS.stock = pg => {
  let tab = 'list';
  const render = async () => {
    const stockP = S.products.filter(p => p.track_stock);
    const val = stockP.reduce((a, p) => a + Math.max(0, p.stock) * p.cost, 0), retail = stockP.reduce((a, p) => a + Math.max(0, p.stock) * p.price, 0);
    const low = stockP.filter(p => p.stock <= p.low_stock);
    pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">${t('Stock value (cost)')}</div><div class="v">฿${money(val)}</div></div>
      <div class="stat"><div class="k">${t('Retail value')}</div><div class="v">฿${money(retail)}</div></div>
      <div class="stat"><div class="k">${t('Items')}</div><div class="v">${stockP.length}</div></div>
      <div class="stat"><div class="k">${t('Low stock')}</div><div class="v" style="color:var(--warn)">${low.length}</div></div></div>
      <div class="tabs">${[['list', t('Inventory')], ['low', t('Low stock')], ['hist', t('History')]].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}
      <input class="in" id="ss" placeholder="${t('Search')}" style="width:220px;margin-left:auto"></div><div id="sbody" class="tblwrap"></div>`;
    $$('[data-t]', pg).forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    const draw = async () => {
      const v = $('#ss').value.toLowerCase();
      if (tab === 'hist') {
        const mv = await q(sb.from('stock_moves').select('*, supplier:suppliers(name)').eq('shop_id', S.shop.id).order('created_at', {ascending: false}).limit(300));
        const kn = {in: '⬆ ' + t('Receive'), out: '⬇ ' + t('Remove'), adjust: '⚖ ' + t('Count'), sale: '🛒 ' + t('Sell'), void: '↩ ' + t('Void')};
        $('#sbody').innerHTML = `<table class="tbl"><tr><th>${t('Date')}</th><th>${t('Product')}</th><th>${t('Type')}</th><th class="right">${t('Qty')}</th><th class="right">${t('Cost')}</th><th>${t('Supplier')}</th><th>${t('Note')}</th></tr>
          ${mv.filter(r => !v || r.product_name.toLowerCase().includes(v)).map(r => `<tr><td>${dt(r.created_at)}</td><td>${esc(r.product_name)}</td><td>${kn[r.kind] || r.kind}</td><td class="right b" style="color:${r.qty < 0 ? 'var(--bad)' : 'var(--ok)'}">${r.qty > 0 ? '+' : ''}${qtyf(r.qty)}</td><td class="right">${money(r.cost)}</td><td>${esc(r.supplier?.name || '')}</td><td>${esc(r.ref || r.note)}</td></tr>`).join('')}</table>`;
        return;
      }
      const list = (tab === 'low' ? low : stockP).filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v));
      $('#sbody').innerHTML = `<table class="tbl"><tr><th>${t('Product')}</th><th class="right">${t('Stock')}</th><th class="right">${t('Cost')}</th><th class="right">${t('Value')}</th><th></th></tr>
        ${list.map(p => `<tr><td><b>${esc(p.name)}</b><br><small class="muted">${esc(p.barcode)}</small></td><td class="right"><span class="chip ${p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'}">${qtyf(p.stock)} ${esc(p.unit)}</span></td>
          <td class="right">${money(p.cost)}</td><td class="right">${money(Math.max(0, p.stock) * p.cost)}</td>
          <td class="right" style="white-space:nowrap"><button class="btn sm ok" data-k="in" data-id="${p.id}">+ ${t('Receive')}</button> <button class="btn sm" data-k="out" data-id="${p.id}">− ${t('Remove')}</button> <button class="btn sm" data-k="adjust" data-id="${p.id}">⚖ ${t('Count')}</button></td></tr>`).join('')}</table>`;
      $$('[data-k]', pg).forEach(b => b.onclick = () => stockForm(S.products.find(p => p.id === b.dataset.id), b.dataset.k, render));
    };
    $('#ss').oninput = draw; await draw();
  };
  $('#tact').innerHTML = `<button class="btn p" id="rcv">+ ${t('Receive')}</button>`;
  $('#rcv').onclick = () => {
    const m = modal(t('Receive'), `<input class="in" id="rs" placeholder="${t('Search or scan barcode…')}"><div id="rl" style="margin-top:10px"></div>`);
    const d = () => { const v = $('#rs', m).value.toLowerCase(); $('#rl', m).innerHTML = `<table class="tbl">${S.products.filter(p => p.track_stock && (!v || p.name.toLowerCase().includes(v) || p.barcode === v)).slice(0, 40).map(p => `<tr class="click" data-id="${p.id}"><td>${esc(p.name)}</td><td class="right">${qtyf(p.stock)}</td></tr>`).join('')}</table>`;
      $$('[data-id]', m).forEach(r => r.onclick = () => { m.close(); stockForm(S.products.find(p => p.id === r.dataset.id), 'in', render); }); };
    $('#rs', m).oninput = d; d(); $('#rs', m).focus();
  };
  render().catch(fail);
};
function stockForm(p, kind, after) {
  const title = {in: t('Receive'), out: t('Remove'), adjust: t('Count')}[kind] + ' · ' + p.name;
  formModal(title, [
    {k:'qty', label: kind === 'adjust' ? `${LANG === 'th' ? 'จำนวนที่นับได้' : 'Counted qty'} (${t('Stock')}: ${qtyf(p.stock)})` : t('Qty'), type:'number', req:true},
    ...(kind === 'in' ? [{k:'cost', label: t('Cost') + ' / ' + p.unit, type:'number', def: p.cost}, {k:'supplier', label:t('Supplier'), type:'select', opts:[['', '—'], ...S.suppliers.map(s => [s.id, s.name])]}] : []),
    {k:'note', label:t('Note'), full:true}], {}, async o => {
      await q(sb.rpc('stock_move', {p_shop: S.shop.id, p_product: p.id, p_kind: kind, p_qty: num(o.qty), p_cost: kind === 'in' ? num(o.cost) : null, p_supplier: o.supplier || null, p_note: o.note || ''}));
      Object.assign(p, await q(sb.from('products').select('*').eq('id', p.id).single()));
      after?.();
    });
}

/* ================= generic CRUD (members, suppliers, promotions, expenses) ================= */
function crudPage(pg, {table, list, cols, fields, title, after, rowExtra, filter}) {
  $('#tact').innerHTML = `<button class="btn" id="cx">⬇ ${t('Export CSV')}</button><button class="btn p" id="ca">+ ${t('Add')}</button>`;
  pg.innerHTML = `<div class="row" style="margin-bottom:12px"><input class="in" id="cs" placeholder="${t('Search')}" style="max-width:300px"></div><div id="cbody" class="tblwrap"></div>`;
  const edit = v => formModal(v.id ? t('Edit') : t('Add') + ' ' + title, fields, v, async o => {
    const row = await q(v.id ? sb.from(table).update(o).eq('id', v.id).select().single() : sb.from(table).insert({...o, shop_id: S.shop.id, ...(table === 'expenses' ? {user_id: S.user.id} : {})}).select().single());
    const arr = list(); const i = arr.findIndex(x => x.id === row.id); if (i >= 0) arr[i] = row; else arr.unshift(row);
    after?.(); draw();
  }, {extraFoot: v.id ? `<button class="btn bad" id="cdel">${t('Delete')}</button>` : ''});
  const draw = () => {
    const v = $('#cs').value.toLowerCase();
    const rows = list().filter(r => !v || JSON.stringify(r).toLowerCase().includes(v)).filter(filter || (() => true));
    $('#cbody').innerHTML = (rowExtra ? rowExtra(rows) : '') + `<table class="tbl"><tr>${cols.map(c => `<th class="${c.r ? 'right' : ''}">${esc(c.l)}</th>`).join('')}</tr>
      ${rows.map(r => `<tr class="click" data-id="${r.id}">${cols.map(c => `<td class="${c.r ? 'right' : ''}">${c.f ? c.f(r) : esc(r[c.k])}</td>`).join('')}</tr>`).join('')}</table>`;
    $$('[data-id]', pg).forEach(tr => tr.onclick = () => {
      const r = list().find(x => x.id === tr.dataset.id); const m = edit(r);
      $('#cdel', m).onclick = async () => { if (!await confirmBox(r.name || r.note || '')) return;
        try { await q(sb.from(table).delete().eq('id', r.id)); const arr = list(); arr.splice(arr.indexOf(r), 1); m.close(); draw(); } catch (e) { fail(e); } };
    });
  };
  $('#ca').onclick = () => edit({});
  $('#cx').onclick = () => download(table + '.csv', toCSV(list(), fields.map(f => f.k)));
  $('#cs').oninput = draw; draw();
  return draw;
}
VIEWS.members = pg => crudPage(pg, { table: 'customers', title: t('Member'), list: () => S.customers,
  cols: [{l: t('Name'), k: 'name', f: r => `<b>${esc(r.name)}</b>`}, {l: t('Phone'), k: 'phone'}, {l: t('Points'), r: 1, f: r => qtyf(r.points)}, {l: t('Total spent'), r: 1, f: r => money(r.total_spent)}, {l: t('Visits'), r: 1, k: 'visits'}],
  fields: [{k:'name', label:t('Name'), req:true}, {k:'phone', label:t('Phone'), type:'tel'}, {k:'points', label:t('Points'), type:'number', def:0}, {k:'note', label:t('Note')}] });
VIEWS.suppliers = pg => crudPage(pg, { table: 'suppliers', title: t('Supplier'), list: () => S.suppliers,
  cols: [{l: t('Name'), f: r => `<b>${esc(r.name)}</b>`}, {l: t('Contact'), k: 'contact'}, {l: t('Phone'), k: 'phone'}, {l: t('Note'), k: 'note'}],
  fields: [{k:'name', label:t('Name'), req:true}, {k:'contact', label:t('Contact')}, {k:'phone', label:t('Phone'), type:'tel'}, {k:'note', label:t('Note')}] });
VIEWS.promotions = pg => crudPage(pg, { table: 'promotions', title: t('Promotion'), list: () => S.promotions,
  cols: [{l: t('Name'), f: r => `<b>${esc(r.name)}</b>`}, {l: t('Value'), f: r => r.kind === 'percent' ? r.value + '%' : '฿' + money(r.value)}, {l: t('Min. total'), r: 1, f: r => money(r.min_total)},
    {l: t('Members only'), f: r => r.members_only ? '⭐' : ''}, {l: t('Date'), f: r => `${r.starts_on || ''} – ${r.ends_on || ''}`}, {l: t('Active'), f: r => r.active ? '<span class="chip ok">ON</span>' : '<span class="chip">OFF</span>'}],
  fields: [{k:'name', label:t('Name'), req:true, full:true}, {k:'kind', label:t('Type'), type:'select', opts:[['percent', t('Percent %')], ['amount', t('Baht')]]}, {k:'value', label:t('Value'), type:'number', req:true},
    {k:'min_total', label:t('Min. total'), type:'number', def:0}, {k:'starts_on', label:t('Start'), type:'date'}, {k:'ends_on', label:t('End'), type:'date'},
    {k:'members_only', label:t('Members only'), type:'check'}, {k:'active', label:t('Active'), type:'check', def:true}] });
VIEWS.expenses = async pg => {
  S.expenses = await fetchAll(() => sb.from('expenses').select('*').eq('shop_id', S.shop.id).order('spent_on', {ascending: false}));
  const cats = ['ทั่วไป', 'ค่าเช่า', 'ค่าน้ำ/ไฟ', 'เงินเดือน', 'ซื้อของ', 'ขนส่ง', 'การตลาด', 'อื่นๆ'];
  crudPage(pg, { table: 'expenses', title: t('Expenses'), list: () => S.expenses,
    rowExtra: rows => { const m0 = ymd(new Date()).slice(0, 7); return `<div class="stats"><div class="stat"><div class="k">${t('This month')}</div><div class="v">฿${money(rows.filter(r => (r.spent_on || '').startsWith(m0)).reduce((a, r) => a + num(r.amount), 0))}</div></div></div>`; },
    cols: [{l: t('Date'), f: r => dOnly(r.spent_on)}, {l: t('Category'), k: 'category'}, {l: t('Note'), k: 'note'}, {l: t('Amount'), r: 1, f: r => `<b>${money(r.amount)}</b>`}],
    fields: [{k:'spent_on', label:t('Date'), type:'date', def: ymd(new Date()), req:true}, {k:'category', label:t('Category'), type:'select', opts: cats.map(c => [c, c])},
      {k:'amount', label:t('Amount'), type:'number', req:true}, {k:'note', label:t('Note')}] });
};

/* ================= REPORTS ================= */
VIEWS.reports = pg => {
  const now = new Date(); const ranges = {
    today: [now, now], yest: [new Date(Date.now() - 864e5), new Date(Date.now() - 864e5)], d7: [new Date(Date.now() - 6 * 864e5), now],
    month: [new Date(now.getFullYear(), now.getMonth(), 1), now], last: [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)] };
  pg.innerHTML = `<div class="tabs">${[['today', t('Today')], ['yest', t('Yesterday')], ['d7', t('7 days')], ['month', t('This month')], ['last', t('Last month')]].map(([k, l]) => `<button class="tab" data-r="${k}">${l}</button>`).join('')}
    <input type="date" class="in" id="r1" style="width:auto"> – <input type="date" class="in" id="r2" style="width:auto"><button class="btn" id="rx">⬇ CSV</button></div><div id="rb"></div>`;
  const set = k => { $('#r1').value = ymd(ranges[k][0]); $('#r2').value = ymd(ranges[k][1]); $$('[data-r]', pg).forEach(b => b.classList.toggle('on', b.dataset.r === k)); run(); };
  $$('[data-r]', pg).forEach(b => b.onclick = () => set(b.dataset.r));
  $('#r1').onchange = $('#r2').onchange = () => { $$('[data-r]', pg).forEach(b => b.classList.remove('on')); run(); };
  let last = null;
  $('#rx').onclick = () => last && download(`report_${$('#r1').value}_${$('#r2').value}.csv`, toCSV(last, ['name', 'qty', 'revenue', 'cost', 'profit']));
  const run = async () => {
    $('#rb').innerHTML = '<div class="empty">…</div>';
    const a = new Date($('#r1').value + 'T00:00:00').toISOString(), b = new Date($('#r2').value + 'T23:59:59.999').toISOString();
    const [sales, items, exps] = await Promise.all([
      fetchAll(() => sb.from('sales').select('*').eq('shop_id', S.shop.id).eq('status', 'paid').gte('created_at', a).lte('created_at', b)),
      fetchAll(() => sb.from('sale_items').select('name, qty, price, cost, discount, product_id, sales!inner(created_at, status)').eq('shop_id', S.shop.id).eq('sales.status', 'paid').gte('sales.created_at', a).lte('sales.created_at', b)),
      fetchAll(() => sb.from('expenses').select('*').eq('shop_id', S.shop.id).gte('spent_on', $('#r1').value).lte('spent_on', $('#r2').value)),
    ]);
    const sum = (arr, f) => arr.reduce((x, r) => x + num(typeof f === 'function' ? f(r) : r[f]), 0);
    const revenue = sum(sales, 'total'), vat = sum(sales, 'vat'), disc = sum(sales, 'discount'), cost = sum(sales, 'cost_total'), exp = sum(exps, 'amount');
    const net = revenue - vat;
    const gross = net - cost;
    const by = (arr, key, val) => { const m = {}; arr.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + val(r); }); return m; };
    const pay = by(sales, r => r.payment_method, r => num(r.total));
    const cashier = by(sales, r => r.cashier_name || '-', r => num(r.total));
    const hours = by(sales, r => new Date(r.created_at).getHours(), r => num(r.total));
    const days = by(sales, r => ymd(r.created_at), r => num(r.total));
    const prod = {}; items.forEach(i => { const k = i.name; const o = prod[k] ||= {name: k, qty: 0, revenue: 0, cost: 0}; o.qty += num(i.qty); o.revenue += num(i.qty) * num(i.price) - num(i.discount); o.cost += num(i.qty) * num(i.cost); });
    const prods = Object.values(prod).map(p => ({...p, profit: r2(p.revenue - p.cost), revenue: r2(p.revenue), cost: r2(p.cost)})).sort((x, y) => y.revenue - x.revenue);
    last = prods;
    const lowMargin = S.products.filter(p => p.active && p.price > 0 && (p.price - p.cost) / p.price < 0.15).sort((x, y) => (x.price - x.cost) / x.price - (y.price - y.cost) / y.price).slice(0, 15);
    const barChart = (obj, keys, label) => { const mx = Math.max(1, ...keys.map(k => obj[k] || 0)); return `<div class="bars">${keys.map(k => `<div title="${label(k)}: ${money(obj[k] || 0)}" style="height:${(obj[k] || 0) / mx * 100}%"><span>${label(k)}</span></div>`).join('')}</div>`; };
    const dayKeys = []; for (let d = new Date($('#r1').value + 'T00:00:00'); d <= new Date($('#r2').value + 'T00:00:00') && dayKeys.length < 62; d.setDate(d.getDate() + 1)) dayKeys.push(ymd(d));
    const kv = (obj) => Object.entries(obj).sort((x, y) => y[1] - x[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="right b">${money(v)}</td></tr>`).join('');
    $('#rb').innerHTML = `
      <div class="stats">
        <div class="stat"><div class="k">${t('Sales')}</div><div class="v">฿${money(revenue)}</div></div>
        <div class="stat"><div class="k">${t('Bills count')}</div><div class="v">${sales.length}</div></div>
        <div class="stat"><div class="k">${t('Avg / bill')}</div><div class="v">฿${money(sales.length ? revenue / sales.length : 0)}</div></div>
        <div class="stat"><div class="k">${t('Product cost')}</div><div class="v">฿${money(cost)}</div></div>
        <div class="stat"><div class="k">${t('Gross profit')}</div><div class="v" style="color:var(--ok)">฿${money(gross)}</div></div>
        <div class="stat"><div class="k">${t('Expenses')}</div><div class="v" style="color:var(--bad)">฿${money(exp)}</div></div>
        <div class="stat"><div class="k">${t('Net profit')}</div><div class="v" style="color:${gross - exp >= 0 ? 'var(--ok)' : 'var(--bad)'}">฿${money(gross - exp)}</div></div>
        <div class="stat"><div class="k">${t('Discounts')} / ${t('VAT')}</div><div class="v" style="font-size:16px">${money(disc)} / ${money(vat)}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><b>${dayKeys.length > 1 ? t('By day') : t('By hour')}</b>${dayKeys.length > 1 ? barChart(days, dayKeys, k => k.slice(8)) : barChart(hours, [...Array(24).keys()].slice(6), k => k)}<br></div>
        <div class="card"><b>${t('By payment')}</b><table class="tbl" style="box-shadow:none">${kv(pay)}</table><br><b>${t('By cashier')}</b><table class="tbl" style="box-shadow:none">${kv(cashier)}</table></div>
      </div><br>
      <div class="grid2">
        <div class="card"><b>${t('Top products')}</b><div class="tblwrap"><table class="tbl" style="box-shadow:none"><tr><th>${t('Product')}</th><th class="right">${t('Qty')}</th><th class="right">${t('Sales')}</th><th class="right">${t('Profit')}</th></tr>
          ${prods.slice(0, 20).map(p => `<tr><td>${esc(p.name)}</td><td class="right">${qtyf(p.qty)}</td><td class="right">${money(p.revenue)}</td><td class="right">${money(p.profit)}</td></tr>`).join('')}</table></div></div>
        <div class="card"><b>${t('Low-margin products')} (&lt;15%)</b><table class="tbl" style="box-shadow:none"><tr><th>${t('Product')}</th><th class="right">${t('Price')}</th><th class="right">${t('Cost')}</th><th class="right">${t('Margin')}</th></tr>
          ${lowMargin.map(p => `<tr><td>${esc(p.name)}</td><td class="right">${money(p.price)}</td><td class="right">${money(p.cost)}</td><td class="right" style="color:var(--bad)">${((p.price - p.cost) / p.price * 100).toFixed(0)}%</td></tr>`).join('') || '<tr><td>✓</td></tr>'}</table></div>
      </div>`;
  };
  set('today');
};

/* ================= SHIFTS ================= */
VIEWS.shifts = async pg => {
  const rows = await q(sb.from('shifts').select('*').eq('shop_id', S.shop.id).order('opened_at', {ascending: false}).limit(100));
  const mine = S.shift;
  let cashNow = 0;
  if (mine) { const s = await q(sb.from('sales').select('total').eq('shift_id', mine.id).eq('status', 'paid').eq('payment_method', 'cash')); cashNow = s.reduce((a, r) => a + num(r.total), 0); }
  pg.innerHTML = `<div class="card" style="margin-bottom:16px">${mine ? `
      <div class="row"><span class="chip ok">${t('Shift open')}</span><span class="muted">${dt(mine.opened_at)}</span></div>
      <div class="stats" style="margin-top:12px"><div class="stat"><div class="k">${t('Opening cash')}</div><div class="v">฿${money(mine.opening_cash)}</div></div>
        <div class="stat"><div class="k">${t('Cash sales')}</div><div class="v">฿${money(cashNow)}</div></div>
        <div class="stat"><div class="k">${t('Expected cash')}</div><div class="v">฿${money(num(mine.opening_cash) + cashNow)}</div></div></div>
      <button class="btn bad lg" id="cls">${t('Close shift')}</button>` : `<div class="row"><span class="chip warn">${t('No open shift')}</span><span class="sp"></span><button class="btn p lg" id="opn">${t('Open shift')}</button></div>`}</div>
    <div class="tblwrap"><table class="tbl"><tr><th>${t('Staff')}</th><th>${t('Open')}</th><th>${t('Closed')}</th><th class="right">${t('Opening cash')}</th><th class="right">${t('Expected cash')}</th><th class="right">${t('Counted cash')}</th><th class="right">${t('Difference')}</th></tr>
    ${rows.map(r => { const d = r.closed_at ? num(r.closing_cash) - num(r.expected_cash) : null; return `<tr><td>${esc(r.user_name)}</td><td>${dt(r.opened_at)}</td><td>${r.closed_at ? dt(r.closed_at) : '<span class="chip ok">●</span>'}</td>
      <td class="right">${money(r.opening_cash)}</td><td class="right">${r.closed_at ? money(r.expected_cash) : ''}</td><td class="right">${r.closed_at ? money(r.closing_cash) : ''}</td>
      <td class="right b" style="color:${d < 0 ? 'var(--bad)' : 'var(--ok)'}">${d === null ? '' : money(d)}</td></tr>`; }).join('')}</table></div>`;
  if ($('#opn')) $('#opn').onclick = () => formModal(t('Open shift'), [{k:'opening_cash', label:t('Opening cash'), type:'number', req:true, def:0}], {}, async o => {
    S.shift = await q(sb.from('shifts').insert({shop_id: S.shop.id, user_id: S.user.id, user_name: S.user.user_metadata?.full_name || S.user.user_metadata?.name || S.user.email, opening_cash: num(o.opening_cash)}).select().single());
    go('shifts'); });
  if ($('#cls')) $('#cls').onclick = () => formModal(t('Close shift'), [{k:'closing_cash', label:t('Counted cash'), type:'number', req:true}, {k:'note', label:t('Note')}], {}, async o => {
    await q(sb.from('shifts').update({closed_at: new Date().toISOString(), closing_cash: num(o.closing_cash), expected_cash: num(mine.opening_cash) + cashNow, note: o.note}).eq('id', mine.id));
    S.shift = null; go('shifts'); });
};

/* ================= STAFF ================= */
VIEWS.staff = async pg => {
  const [mem, inv] = await Promise.all([q(sb.from('shop_members').select('*').eq('shop_id', S.shop.id)), q(sb.from('shop_invites').select('*').eq('shop_id', S.shop.id).is('accepted_at', null))]);
  const roles = [['manager', t('Manager')], ['cashier', t('Cashier')], ['stock', t('Stock keeper')]];
  $('#tact').innerHTML = `<button class="btn p" id="inv">+ ${t('Invite staff')}</button>`;
  pg.innerHTML = `<div class="tblwrap"><table class="tbl"><tr><th>${t('Name')}</th><th>${t('Email')}</th><th>${t('Role')}</th><th></th></tr>
    ${mem.map(m => `<tr><td><b>${esc(m.display_name)}</b></td><td>${esc(m.email)}</td><td>${m.role === 'owner' ? `<span class="chip">${ROLE_NAME('owner')}</span>` :
      `<select class="in" data-u="${m.user_id}" style="width:auto">${roles.map(r => `<option value="${r[0]}" ${r[0] === m.role ? 'selected' : ''}>${r[1]}</option>`).join('')}</select>`}</td>
      <td class="right">${m.role === 'owner' ? '' : `<button class="btn sm bad" data-x="${m.user_id}">${t('Delete')}</button>`}</td></tr>`).join('')}</table></div>
    <h3>${t('Pending invites')}</h3><div class="tblwrap"><table class="tbl">${inv.map(i => `<tr><td>${esc(i.display_name)}</td><td>${esc(i.email)}</td><td>${ROLE_NAME(i.role)}</td><td class="right"><button class="btn sm bad" data-i="${i.id}">×</button></td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</table></div>
    <p class="muted">${t('Staff will join automatically when they register/login with this email.')}<br>🔗 ${esc(location.href.split('#')[0])}</p>`;
  $$('[data-u]', pg).forEach(s => s.onchange = async () => { try { await q(sb.from('shop_members').update({role: s.value}).eq('shop_id', S.shop.id).eq('user_id', s.dataset.u)); toast(t('Saved'), 'ok'); } catch (e) { fail(e); } });
  $$('[data-x]', pg).forEach(b => b.onclick = async () => { if (!await confirmBox(t('Delete'))) return; try { await q(sb.from('shop_members').delete().eq('shop_id', S.shop.id).eq('user_id', b.dataset.x)); go('staff'); } catch (e) { fail(e); } });
  $$('[data-i]', pg).forEach(b => b.onclick = async () => { try { await q(sb.from('shop_invites').delete().eq('id', b.dataset.i)); go('staff'); } catch (e) { fail(e); } });
  $('#inv').onclick = () => formModal(t('Invite staff'), [{k:'display_name', label:t('Name'), req:true}, {k:'email', label:t('Email'), type:'email', req:true}, {k:'role', label:t('Role'), type:'select', opts: roles}], {role: 'cashier'},
    async o => { o.email = o.email.toLowerCase(); await q(sb.from('shop_invites').upsert({...o, shop_id: S.shop.id, accepted_at: null}, {onConflict: 'shop_id,email'})); go('staff'); });
};

/* ================= SETTINGS ================= */
VIEWS.settings = pg => {
  const sh = S.shop; const edit = can('owner', 'manager');
  pg.innerHTML = `
    <div class="grid2">
      <div class="card"><h3 style="margin-top:0">🏪 ${esc(sh.name)}</h3><div id="shopForm"></div></div>
      <div>
        <div class="card" style="margin-bottom:16px"><h3 style="margin-top:0">🌐 ${t('Language')}</h3>
          <div class="tabs"><button class="tab ${LANG === 'th' ? 'on' : ''}" data-l="th">ไทย</button><button class="tab ${LANG === 'en' ? 'on' : ''}" data-l="en">English</button></div></div>
        <div class="card" style="margin-bottom:16px"><h3 style="margin-top:0">🏬 ${t('Shops / branches')}</h3>
          <table class="tbl" style="box-shadow:none">${S.shops.map(s => `<tr><td>${esc(s.name)}<br><small class="muted">${ROLE_NAME(s._role)}</small></td><td class="right">${s.id === sh.id ? '<span class="chip ok">●</span>' : `<button class="btn sm" data-s="${s.id}">${t('Switch')}</button>`}</td></tr>`).join('')}</table>
          <br><button class="btn" id="nb">+ ${t('New branch')}</button></div>
        <div class="card"><h3 style="margin-top:0">👤 ${t('Account')}</h3><p>${esc(S.user.email)} · ${ROLE_NAME(S.role)}</p>
          <div class="row">${can('owner', 'manager') ? `<button class="btn" id="bk">💾 ${t('Backup data')}</button>` : ''}<button class="btn install" data-install>📲 ${t('Install app')}</button>${S.user.app_metadata?.provider === 'email' ? `<button class="btn" id="cpw">🔑 ${LANG === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change password'}</button>` : ''}<button class="btn bad" id="lo">${t('Logout')}</button></div>
          <p class="muted" style="font-size:12px">${t('Version')} ${VERSION} · <a href="https://github.com/khalil203/khalil203/tree/main/pos" target="_blank">GitHub</a></p></div>
      </div>
    </div>`;
  const fields = [
    {k:'name', label:t('Shop name'), req:true, full:true}, {k:'phone', label:t('Phone')}, {k:'tax_id', label:t('Tax ID')}, {k:'address', label:t('Address'), full:true},
    {k:'promptpay_id', label:t('PromptPay ID (phone / tax ID)'), full:true},
    {k:'vat_mode', label:t('VAT mode'), type:'select', opts:[['none', t('No VAT')], ['included', t('VAT included')], ['excluded', t('VAT excluded')]]}, {k:'vat_rate', label:t('VAT rate %'), type:'number'},
    {k:'points_per_baht', label:t('Points per 1 baht'), type:'number'}, {k:'baht_per_point', label:t('Baht per point'), type:'number'},
    {k:'receipt_header', label:t('Receipt header'), type:'textarea'}, {k:'receipt_footer', label:t('Receipt footer'), type:'textarea'},
    {k:'paper_width', label:t('Paper width (mm)'), type:'select', opts:[['58', '58 mm'], ['80', '80 mm']]}];
  $('#shopForm').innerHTML = `<form id="stf"><div class="grid2">${fields.map(f => `<div class="fg" ${f.full ? 'style="grid-column:1/-1"' : ''}><label class="f">${esc(f.label)}</label>${
    f.type === 'select' ? `<select class="in" name="${f.k}" ${edit ? '' : 'disabled'}>${f.opts.map(o => `<option value="${o[0]}" ${String(sh[f.k]) === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>` :
    f.type === 'textarea' ? `<textarea class="in" name="${f.k}" rows="2" ${edit ? '' : 'disabled'}>${esc(sh[f.k])}</textarea>` :
    `<input class="in" name="${f.k}" ${f.type === 'number' ? 'type="number" step="any"' : ''} value="${esc(sh[f.k])}" ${f.req ? 'required' : ''} ${edit ? '' : 'disabled'}>`}</div>`).join('')}</div>
    ${edit ? `<button class="btn p">${t('Save')}</button>` : ''}</form>`;
  $('#stf').onsubmit = async e => {
    e.preventDefault(); const f = e.target; const o = {};
    fields.forEach(x => { o[x.k] = x.type === 'number' ? num(f[x.k].value) : f[x.k].value; }); o.paper_width = +o.paper_width;
    try { const row = await q(sb.from('shops').update(o).eq('id', sh.id).select().single()); Object.assign(sh, row); toast(t('Saved'), 'ok'); renderShell(); go('settings'); } catch (err) { fail(err); }
  };
  $$('[data-l]', pg).forEach(b => b.onclick = () => { LANG = b.dataset.l; localStorage.setItem('pos_lang', LANG); renderShell(); go('settings'); });
  $$('[data-s]', pg).forEach(b => b.onclick = () => { localStorage.setItem('pos_shop', b.dataset.s); S.cart = []; boot(); });
  $('#nb').onclick = () => renderCreateShop(false);
  $('#lo').onclick = logout;
  if ($('#cpw')) $('#cpw').onclick = () => formModal(LANG === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change password', [
    {k:'p1', label: LANG === 'th' ? 'รหัสผ่านใหม่' : 'New password', type:'password', req:true},
    {k:'p2', label: LANG === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm new password', type:'password', req:true}], {}, async o => {
      if (o.p1.length < 6) throw new Error(LANG === 'th' ? 'รหัสผ่านอย่างน้อย 6 ตัว' : 'At least 6 characters');
      if (o.p1 !== o.p2) throw new Error(LANG === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      const { error } = await sb.auth.updateUser({ password: o.p1 }); if (error) throw error;
    });
  $$('[data-install]', pg).forEach(b => b.onclick = installApp); updateInstallUI();
  if ($('#bk')) $('#bk').onclick = async () => {
    const id = S.shop.id; const out = {shop: sh, exported_at: new Date().toISOString()};
    for (const tb of ['categories', 'products', 'customers', 'suppliers', 'promotions', 'expenses', 'shifts', 'sales', 'sale_items', 'stock_moves'])
      out[tb] = await fetchAll(() => sb.from(tb).select('*').eq('shop_id', id));
    download(`backup_${sh.name}_${ymd(new Date())}.json`, JSON.stringify(out, null, 1), 'application/json');
  };
};

/* ================= start ================= */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window._installEvt = e; updateInstallUI(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') renderAuth(); });
window.addEventListener('hashchange', () => { if (S.shop && $('#pg') && location.hash.slice(1) !== S.page) go(location.hash.slice(1)); });
{ const u = new URLSearchParams(location.search + '&' + location.hash.slice(1)); const er = u.get('error_description');
  if (er) { history.replaceState(null, '', location.pathname); setTimeout(() => toast(er, 'bad'), 300); } }
/* boot() is started by modules.js after all modules load */
