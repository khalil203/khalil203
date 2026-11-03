/* Shop POS — free, open POS + stock web app.  Data: Supabase.  Hosting: GitHub Pages. */
'use strict';
const VERSION = '1.2.0';
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
const money = n => num(n).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const qtyf = n => num(n).toLocaleString('th-TH', {maximumFractionDigits: 3});
const dt = d => new Date(d).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-GB', {dateStyle: 'short', timeStyle: 'short'});
const dOnly = d => new Date(d).toLocaleDateString(LANG === 'th' ? 'th-TH' : 'en-GB');
const ymd = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
function toast(msg, kind = '') {
  const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg;
  $('#toast').appendChild(el); setTimeout(() => el.remove(), 2600);
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
  a.href = URL.createObjectURL(new Blob(['﻿' + text], {type: type + ';charset=utf-8'})); a.download = name; a.click();
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
const ROLE_NAME = r => t({owner:'Owner', manager:'Manager', cashier:'Cashier', stock:'Stock keeper'}[r] || r);

/* ================= state ================= */
const S = {
  user: null, shops: [], shop: null, role: null, page: 'pos',
  products: [], categories: [], customers: [], promotions: [], suppliers: [],
  cart: [], customer: null, promo: null, billDisc: 0, billDiscPct: false, pointsUse: 0, cat: 'all', search: '',
  shift: null, held: JSON.parse(localStorage.getItem('pos_held') || '[]'),
};
const can = (...roles) => roles.includes(S.role);
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('pos-display') : null;

const PAGES = [
  {id:'pos', ic:'🛒', name:'Sell', roles:['owner','manager','cashier','stock']},
  {id:'sales', ic:'🧾', name:'Bills', roles:['owner','manager','cashier']},
  {id:'products', ic:'📦', name:'Products', roles:['owner','manager','stock']},
  {id:'stock', ic:'🏬', name:'Stock', roles:['owner','manager','stock']},
  {id:'members', ic:'⭐', name:'Members', roles:['owner','manager','cashier']},
  {id:'promotions', ic:'🏷️', name:'Promotions', roles:['owner','manager']},
  {id:'suppliers', ic:'🚚', name:'Suppliers', roles:['owner','manager','stock']},
  {id:'expenses', ic:'💸', name:'Expenses', roles:['owner','manager']},
  {id:'reports', ic:'📊', name:'Reports', roles:['owner','manager']},
  {id:'shifts', ic:'💰', name:'Shifts', roles:['owner','manager','cashier']},
  {id:'staff', ic:'👥', name:'Staff', roles:['owner']},
  {id:'settings', ic:'⚙️', name:'Settings', roles:['owner','manager','cashier','stock']},
];

/* ================= modal ================= */
function modal(title, body, {wide = false, foot = ''} = {}) {
  const bg = document.createElement('div'); bg.className = 'mbg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><div class="mh"><h3>${esc(title)}</h3><button class="x">×</button></div>
    <div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
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
    const v = values[f.k] ?? f.def ?? '';
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
  $('#root').innerHTML = `<div class="auth"><div class="card">
    <div class="row"><div class="brandmark">🛒</div><span style="flex:1"></span><button class="tab" id="lng" style="align-self:flex-start">${LANG === 'th' ? 'EN' : 'ไทย'}</button></div>
    <h2>Shop POS</h2><p class="muted" style="margin-top:0">${LANG === 'th' ? 'ระบบขายหน้าร้าน + สต็อก ฟรีทุกฟีเจอร์' : 'Free POS + stock, every feature unlocked'}</p>
    <button class="btn lg" id="gbtn" style="width:100%;background:#fff;border:1px solid var(--line);margin-top:10px">${GOOGLE_SVG} ${LANG === 'th' ? 'เข้าสู่ระบบด้วย Google' : 'Continue with Google'}</button>
    <p class="muted" style="font-size:13px;text-align:center">${LANG === 'th' ? 'พนักงานใช้บัญชี Google ของอีเมลที่ได้รับเชิญ' : 'Staff sign in with the Google account of their invited email'}</p>
    <div class="row" style="margin:14px 0"><hr style="flex:1;border:0;border-top:1px solid var(--line)"><span class="muted" style="font-size:13px">${LANG === 'th' ? 'หรือ ผู้ดูแลระบบ' : 'or admin login'}</span><hr style="flex:1;border:0;border-top:1px solid var(--line)"></div>
    <form id="af">
      <div class="fg"><label class="f">${LANG === 'th' ? 'ชื่อผู้ใช้' : 'Username'}</label><input class="in" name="user" required autocomplete="username" autocapitalize="off" placeholder="admin"></div>
      <div class="fg"><label class="f">${t('Password')}</label><input class="in" name="pw" type="password" required autocomplete="current-password"></div>
      <button class="btn p lg" style="width:100%">${t('Login')}</button>
    </form>
  </div></div>`;
  $('#af').onsubmit = async e => {
    e.preventDefault(); const f = e.target; const btn = $('button.p', f); btn.disabled = true;
    const u = f.user.value.trim().toLowerCase();
    const email = u.includes('@') ? u : `${u}@shoppos.test`;
    const { error } = await sb.auth.signInWithPassword({ email, password: f.pw.value });
    if (error) { btn.disabled = false; return toast(LANG === 'th' ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : 'Wrong username or password', 'bad'); }
    boot().catch(fail);
  };
  $('#lng').onclick = () => { LANG = LANG === 'th' ? 'en' : 'th'; localStorage.setItem('pos_lang', LANG); renderAuth(); };
  $('#gbtn').onclick = async () => {
    $('#gbtn').disabled = true;
    try {
      const st = await (await fetch(window.POS_CONFIG.url + '/auth/v1/settings', { headers: { apikey: window.POS_CONFIG.key } })).json();
      if (!st.external?.google) { $('#gbtn').disabled = false; return toast(LANG === 'th' ? 'ยังไม่ได้เปิด Google Login ใน Supabase' : 'Google login is not enabled in Supabase yet', 'bad'); }
    } catch (e) { /* offline check failed: try anyway */ }
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google',
      options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } });
    if (error) { $('#gbtn').disabled = false; fail(/not enabled|unsupported provider/i.test(error.message)
      ? (LANG === 'th' ? 'ยังไม่ได้เปิด Google Login ใน Supabase' : 'Google login is not enabled in Supabase yet') : error); }
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
  try { await sb.rpc('accept_invites'); } catch (e) { /* ignore */ }
  const mems = await q(sb.from('shop_members').select('role, shop:shops(*)').eq('user_id', S.user.id));
  S.shops = mems.filter(m => m.shop).map(m => ({ ...m.shop, _role: m.role }));
  if (!S.shops.length) return renderCreateShop(true);
  const want = localStorage.getItem('pos_shop');
  S.shop = S.shops.find(s => s.id === want) || S.shops[0];
  S.role = S.shop._role;
  localStorage.setItem('pos_shop', S.shop.id);
  await loadMaster();
  renderShell();
  go(location.hash.slice(1) || 'pos');
}

async function loadMaster() {
  const id = S.shop.id;
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

function renderShell() {
  const pages = PAGES.filter(p => p.roles.includes(S.role));
  $('#root').innerHTML = `<div id="app">
    <nav class="side">
      <div class="logo"><i>🛒</i><div>Shop POS<div class="shopname">${esc(S.shop.name)}</div></div></div>
      ${pages.map(p => `<button class="nav" data-p="${p.id}"><span class="ic">${p.ic}</span><span>${t(p.name)}</span></button>`).join('')}
      <div class="grow"></div>
      <div class="muted" style="font-size:11px;padding:8px 12px">${esc(S.user.email)}<br>${ROLE_NAME(S.role)} · v${VERSION}</div>
    </nav>
    <div class="main"><div class="top"><h1 id="ttl"></h1><div id="tact" class="row"></div></div><div class="page" id="pg"></div></div>
  </div>`;
  $$('.nav').forEach(b => b.onclick = () => go(b.dataset.p));
}

function go(page) {
  const p = PAGES.find(x => x.id === page && x.roles.includes(S.role)) || PAGES[0];
  S.page = p.id; location.hash = p.id;
  $$('.nav').forEach(b => b.classList.toggle('on', b.dataset.p === p.id));
  $('#ttl').textContent = t(p.name);
  $('#tact').innerHTML = '';
  const pg = $('#pg'); pg.style.padding = p.id === 'pos' ? '0' : ''; pg.style.overflow = p.id === 'pos' ? 'hidden' : '';
  pg.innerHTML = '';
  Promise.resolve().then(() => VIEWS[p.id](pg)).catch(fail);
}

/* ================= POS ================= */
function catColor(id) { return S.categories.find(c => c.id === id)?.color || '#6366f1'; }
function productCard(p) {
  const out = p.track_stock && p.stock <= 0;
  const img = p.image_url ? `style="background-image:url('${esc(p.image_url)}')"` : `style="background:${catColor(p.category_id)}"`;
  return `<div class="pcard ${out ? 'out' : ''}" data-id="${p.id}"><div class="img" ${img}>${p.image_url ? '' : esc(p.name.slice(0, 2))}</div>
    <div class="nm">${esc(p.name)}</div><div class="pr"><b>฿${money(p.price)}</b><span class="st">${p.track_stock ? qtyf(p.stock) + ' ' + esc(p.unit) : ''}</span></div></div>`;
}

const VIEWS = {};
VIEWS.pos = pg => {
  $('#tact').innerHTML = `<span class="chip ${S.shift ? 'ok' : 'warn'}">${S.shift ? t('Shift open') : t('No open shift')}</span>
    <button class="btn sm" id="dispBtn">🖥️ ${t('Customer display')}</button>`;
  $('#dispBtn').onclick = () => window.open('display.html', 'posdisplay', 'width=900,height=600');
  pg.innerHTML = `<div class="pos">
    <div class="left">
      <div class="row"><input class="in" id="psearch" placeholder="${t('Search or scan barcode…')}" style="flex:1" value="${esc(S.search)}" autocomplete="off">
        <button class="btn" id="scanBtn">📷 ${t('Scan')}</button></div>
      <div class="cats" id="cats"></div>
      <div class="pgrid" id="pgrid"></div>
    </div>
    <aside class="cart" id="cart"></aside>
    <button class="btn p lg cartfab" id="cartfab"></button>
  </div>`;
  const cats = [{id: 'all', name: t('All')}, ...S.categories];
  $('#cats').innerHTML = cats.map(c => `<button class="tab ${S.cat === c.id ? 'on' : ''}" data-c="${c.id}">${esc(c.name)}</button>`).join('');
  $$('#cats .tab').forEach(b => b.onclick = () => { S.cat = b.dataset.c; $$('#cats .tab').forEach(x => x.classList.toggle('on', x === b)); drawGrid(); });
  const s = $('#psearch');
  s.oninput = () => { S.search = s.value; drawGrid(); };
  s.onkeydown = e => {
    if (e.key !== 'Enter') return;
    const v = s.value.trim(); if (!v) return;
    const hit = S.products.find(p => p.active && (p.barcode === v || p.sku === v));
    const list = filtered();
    if (hit) addToCart(hit); else if (list.length === 1) addToCart(list[0]); else return;
    s.value = ''; S.search = ''; drawGrid();
  };
  $('#scanBtn').onclick = () => scanBarcode(code => {
    const hit = S.products.find(p => p.barcode === code || p.sku === code);
    if (hit) addToCart(hit); else toast(`${t('Barcode')} ${code} ?`, 'bad');
  });
  $('#cartfab').onclick = () => $('#cart').classList.add('open');
  drawGrid(); drawCart();
  if (matchMedia('(min-width:861px)').matches) s.focus();
};
function filtered() {
  const qs = S.search.toLowerCase();
  return S.products.filter(p => p.active && (S.cat === 'all' || p.category_id === S.cat) &&
    (!qs || p.name.toLowerCase().includes(qs) || (p.barcode || '').includes(qs) || (p.sku || '').toLowerCase().includes(qs)));
}
function drawGrid() {
  const g = $('#pgrid'); if (!g) return;
  const list = filtered();
  g.innerHTML = list.length ? list.map(productCard).join('') : `<div class="empty" style="grid-column:1/-1">${S.products.length ? '—' : (LANG === 'th' ? 'ยังไม่มีสินค้า ไปที่หน้า "สินค้า" เพื่อเพิ่ม' : 'No products yet — add some in Products')}</div>`;
  $$('.pcard', g).forEach(c => c.onclick = () => addToCart(S.products.find(p => p.id === c.dataset.id)));
}
function addToCart(p, qty = 1) {
  if (!p) return;
  const line = S.cart.find(l => l.product_id === p.id);
  const want = (line?.qty || 0) + qty;
  if (p.track_stock && want > p.stock) toast(`${t('Out of stock')}: ${p.name} (${qtyf(p.stock)})`, 'bad');
  if (line) line.qty = want; else S.cart.push({product_id: p.id, name: p.name, price: num(p.price), qty, discount: 0});
  drawCart();
}

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
      <div class="citem"><div class="nm" data-i="${i}" style="cursor:pointer"><div>${esc(l.name)}</div>
        <small>฿${money(l.price)}${l.discount ? ` · -${money(l.discount)}` : ''}</small></div>
        <div class="qty"><button data-d="${i}">−</button><span data-q="${i}" style="cursor:pointer">${qtyf(l.qty)}</span><button data-u="${i}">+</button></div>
        <b style="width:76px;text-align:right">${money(l.price * l.qty - l.discount)}</b></div>`).join('') : `<div class="empty">🛒<br>${t('Cart is empty')}</div>`}</div>
    <div class="ft">
      <div class="tline"><span>${t('Subtotal')}</span><span>${money(c.subtotal)}</span></div>
      <div class="tline"><a href="#" id="discBtn">${t('Bill discount')}</a><span>${c.discount ? '-' + money(c.discount) : '0.00'}</span></div>
      ${S.customer && num(S.customer.points) > 0 ? `<div class="tline"><a href="#" id="ptsBtn">${t('Use points')} (${qtyf(c.pointsUse)})</a><span>-${money(c.pointsDisc)}</span></div>` : ''}
      ${S.shop.vat_mode !== 'none' ? `<div class="tline muted"><span>${t('VAT')} ${num(S.shop.vat_rate)}% ${S.shop.vat_mode === 'included' ? '(incl.)' : ''}</span><span>${money(c.vat)}</span></div>` : ''}
      <div class="tline big"><span>${t('Total')}</span><span>฿${money(c.total)}</span></div>
      <button class="btn p lg" id="payBtn" ${S.cart.length ? '' : 'disabled'}>💳 ${t('Pay')} ฿${money(c.total)}</button>
    </div>`;
  const fab = $('#cartfab'); if (fab) fab.textContent = `🛒 ${qtyf(n)} · ฿${money(c.total)}`;
  $('#cartClose').onclick = () => el.classList.remove('open');
  $$('[data-u]', el).forEach(b => b.onclick = () => { const l = S.cart[b.dataset.u]; addToCart(S.products.find(p => p.id === l.product_id) || l, 1); });
  $$('[data-d]', el).forEach(b => b.onclick = () => { const l = S.cart[b.dataset.d]; l.qty--; if (l.qty <= 0) S.cart.splice(b.dataset.d, 1); drawCart(); });
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
function resetSale() { S.cart = []; S.customer = null; S.promo = null; S.billDisc = 0; S.billDiscPct = false; S.pointsUse = 0; drawCart(); }

function pickMember() {
  const m = modal(t('Member'), `<div class="row" style="margin-bottom:10px"><input class="in" id="ms" placeholder="${t('Search')} ${t('Name')} / ${t('Phone')}" style="flex:1"><button class="btn p" id="mAdd">+ ${t('Add member')}</button></div><div id="ml"></div>`);
  const draw = () => {
    const v = $('#ms', m).value.toLowerCase();
    const list = S.customers.filter(c => !v || c.name.toLowerCase().includes(v) || (c.phone || '').includes(v)).slice(0, 50);
    $('#ml', m).innerHTML = `<table class="tbl">${list.map(c => `<tr class="click" data-id="${c.id}"><td><b>${esc(c.name)}</b><br><small class="muted">${esc(c.phone)}</small></td><td class="right">${qtyf(c.points)} ${t('Points')}</td></tr>`).join('')}</table>`;
    $$('[data-id]', m).forEach(r => r.onclick = () => { S.customer = S.customers.find(c => c.id === r.dataset.id); S.pointsUse = 0; m.close(); drawCart(); });
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
      const cust = S.customer;
      resetSale(); drawGrid();
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
  $('#tact').innerHTML = `<button class="btn" id="catBtn">🗂 ${t('Categories')}</button><button class="btn" id="impBtn">⬆ ${t('Import CSV')}</button><button class="btn" id="expBtn">⬇ ${t('Export CSV')}</button><button class="btn p" id="addBtn">+ ${t('Add product')}</button>`;
  pg.innerHTML = `<div class="row" style="margin-bottom:12px"><input class="in" id="ps" placeholder="${t('Search')}" style="max-width:300px">
    <select class="in" id="pc" style="width:auto"><option value="">${t('All')}</option>${S.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
    <label class="row"><input type="checkbox" id="pl"> ${t('Low stock')}</label></div><div id="plist" class="tblwrap"></div>`;
  const draw = () => {
    const v = $('#ps').value.toLowerCase(), c = $('#pc').value, low = $('#pl').checked;
    const list = S.products.filter(p => (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)) && (!c || p.category_id === c) && (!low || (p.track_stock && p.stock <= p.low_stock)));
    $('#plist').innerHTML = `<table class="tbl"><tr><th></th><th>${t('Name')}</th><th>${t('Barcode')}</th><th>${t('Category')}</th><th class="right">${t('Price')}</th><th class="right">${t('Cost')}</th><th class="right">${t('Margin')}</th><th class="right">${t('Stock')}</th></tr>
      ${list.map(p => { const mg = p.price > 0 ? (p.price - p.cost) / p.price * 100 : 0; return `<tr class="click" data-id="${p.id}">
        <td><div style="width:36px;height:36px;border-radius:8px;background:${p.image_url ? `url('${esc(p.image_url)}') center/cover` : catColor(p.category_id)}"></div></td>
        <td><b>${esc(p.name)}</b>${p.active ? '' : ' <span class="chip bad">off</span>'}<br><small class="muted">${esc(p.sku)}</small></td><td>${esc(p.barcode)}</td>
        <td>${esc(S.categories.find(c => c.id === p.category_id)?.name || '')}</td><td class="right">${money(p.price)}</td><td class="right">${money(p.cost)}</td>
        <td class="right">${mg.toFixed(0)}%</td><td class="right">${p.track_stock ? `<span class="chip ${p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'}">${qtyf(p.stock)} ${esc(p.unit)}</span>` : '∞'}</td></tr>`; }).join('')}</table>
      <p class="muted">${list.length} ${t('Items')}</p>`;
    $$('[data-id]', pg).forEach(tr => tr.onclick = () => productForm(S.products.find(p => p.id === tr.dataset.id), draw));
  };
  $('#ps').oninput = $('#pc').onchange = $('#pl').onchange = draw;
  $('#addBtn').onclick = () => productForm({}, draw);
  $('#catBtn').onclick = () => categoryManager(() => go('products'));
  $('#expBtn').onclick = () => download('products.csv', toCSV(S.products.map(p => ({...p, category: S.categories.find(c => c.id === p.category_id)?.name || ''})), ['name', 'barcode', 'sku', 'category', 'price', 'cost', 'stock', 'unit', 'low_stock']));
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
    {k:'image_url', label:t('Image URL'), full:true},
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
          <div class="row">${can('owner', 'manager') ? `<button class="btn" id="bk">💾 ${t('Backup data')}</button>` : ''}<button class="btn" id="ins" style="display:${window._installEvt ? '' : 'none'}">📲 ${t('Install app')}</button>${S.user.app_metadata?.provider === 'email' ? `<button class="btn" id="cpw">🔑 ${LANG === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change password'}</button>` : ''}<button class="btn bad" id="lo">${t('Logout')}</button></div>
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
  $('#ins').onclick = () => window._installEvt?.prompt();
  if ($('#bk')) $('#bk').onclick = async () => {
    const id = S.shop.id; const out = {shop: sh, exported_at: new Date().toISOString()};
    for (const tb of ['categories', 'products', 'customers', 'suppliers', 'promotions', 'expenses', 'shifts', 'sales', 'sale_items', 'stock_moves'])
      out[tb] = await fetchAll(() => sb.from(tb).select('*').eq('shop_id', id));
    download(`backup_${sh.name}_${ymd(new Date())}.json`, JSON.stringify(out, null, 1), 'application/json');
  };
};

/* ================= start ================= */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window._installEvt = e; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') renderAuth(); });
window.addEventListener('hashchange', () => { if (S.shop && location.hash.slice(1) !== S.page) go(location.hash.slice(1)); });
{ const u = new URLSearchParams(location.search + '&' + location.hash.slice(1)); const er = u.get('error_description');
  if (er) { history.replaceState(null, '', location.pathname); setTimeout(() => toast(er, 'bad'), 300); } }
boot().catch(e => { fail(e); renderAuth(); });
