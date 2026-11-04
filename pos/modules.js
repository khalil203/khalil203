/* ============================================================
   Shop POS v3 — modules (permissions, offline, payments, …)
   Loaded after app.js; overrides / extends its views.
   ============================================================ */
'use strict';
Object.assign(TH, {
  'Dashboard': 'แดชบอร์ด', 'Purchasing': 'สั่งซื้อสินค้า', 'Audit log': 'บันทึกการใช้งาน', 'Members': 'ลูกค้า/สมาชิก',
  'Sell': 'ขายสินค้า', 'Bills': 'ประวัติการขาย', 'Shifts': 'กะ/ลิ้นชักเงิน',
});

/* ---------------- permissions ---------------- */
const PERMS = [
  ['dashboard', 'ดูแดชบอร์ด'], ['sell', 'ขายสินค้า'], ['view_sales', 'ดูประวัติการขาย'], ['apply_discount', 'ให้ส่วนลด'],
  ['cancel_sale', 'ยกเลิกบิล'], ['refund', 'คืนสินค้า / คืนเงิน'], ['edit_products', 'จัดการสินค้า'], ['edit_prices', 'แก้ไขราคา'],
  ['view_profit', 'ดูต้นทุนและกำไร'], ['manage_inventory', 'จัดการสต็อก'], ['purchasing', 'สั่งซื้อ / ผู้จำหน่าย'], ['customers', 'จัดการลูกค้า'],
  ['promotions', 'จัดการโปรโมชั่น'], ['expenses', 'ค่าใช้จ่าย'], ['view_reports', 'ดูรายงาน'], ['shifts', 'กะ / ลิ้นชักเงิน'],
  ['cash_moves', 'นำเงินเข้า-ออกลิ้นชัก'], ['manage_staff', 'จัดการพนักงาน'], ['manage_settings', 'ตั้งค่าร้าน'], ['audit', 'ดูบันทึกการใช้งาน'],
];
const ALL_PERMS = PERMS.map(p => p[0]);
const PERM_DEF = {
  manager: ALL_PERMS.filter(x => x !== 'manage_staff'),
  cashier: ['sell', 'view_sales', 'apply_discount', 'customers', 'shifts'],
  stock: ['sell', 'edit_products', 'manage_inventory', 'purchasing'],
  accountant: ['dashboard', 'view_sales', 'view_profit', 'view_reports', 'expenses', 'purchasing', 'customers', 'shifts', 'audit'],
};
function canDo(perm) {
  if (!perm) return true;
  if (S.role === 'owner' || S.role === 'admin') return true;
  if (Array.isArray(S.shop?._perms)) return S.shop._perms.includes(perm);   // personal permissions set by the admin
  const custom = S.shop?.permissions?.[S.role];
  return (Array.isArray(custom) ? custom : (PERM_DEF[S.role] || [])).includes(perm);
}
const PAGE_PERM = { dashboard: 'dashboard', pos: 'sell', sales: 'view_sales', products: 'edit_products', stock: 'manage_inventory', purchases: 'purchasing',
  members: 'customers', promotions: 'promotions', suppliers: 'purchasing', expenses: 'expenses', reports: 'view_reports', shifts: 'shifts',
  staff: 'manage_staff', audit: 'audit', settings: null };
function pageOK(p) { return canDo(PAGE_PERM[p.id]); }
const PAGE_DESC = {
  dashboard: 'ภาพรวมธุรกิจจากข้อมูลจริง — ยอดขาย กำไร และสินค้า', sales: 'ค้นหาบิล พิมพ์ซ้ำ คืนสินค้า และยกเลิกบิล',
  products: 'เพิ่มและแก้ไขสินค้า ราคา รูปภาพ และหน่วยนับ', stock: 'รับเข้า เบิกออก ตรวจนับ โอนสาขา และประวัติสต็อก',
  purchases: 'ใบสั่งซื้อ การรับสินค้า และการชำระเงินผู้จำหน่าย', members: 'ข้อมูลลูกค้า แต้มสะสม เครดิต และประวัติการซื้อ',
  promotions: 'ส่วนลดและโปรโมชั่นที่ใช้ตอนขาย', suppliers: 'ข้อมูลผู้จำหน่ายและยอดค้างชำระ', expenses: 'บันทึกและอนุมัติค่าใช้จ่ายของร้าน',
  reports: 'รายงานธุรกิจ ส่งออก Excel / CSV และพิมพ์', shifts: 'เปิด-ปิดกะ นับเงินสด และนำเงินเข้า-ออก', staff: 'พนักงาน ตำแหน่ง และสิทธิ์การใช้งาน',
  audit: 'บันทึกการกระทำสำคัญทั้งหมดในร้าน', settings: 'ข้อมูลร้าน ภาษี ใบเสร็จ การชำระเงิน และฮาร์ดแวร์',
};

/* ---------------- payment methods ---------------- */
const PAY = {
  cash: ['💵', 'เงินสด', 'Cash'], transfer: ['🏦', 'โอนเงิน', 'Bank transfer'], promptpay: ['📱', 'สแกนจ่าย', 'Scan to pay'],
  qr: ['🔳', 'QR Payment', 'QR payment'], credit_card: ['💳', 'บัตรเครดิต', 'Credit card'], debit_card: ['💳', 'บัตรเดบิต', 'Debit card'],
  ewallet: ['👛', 'เงินอิเล็กทรอนิกส์', 'E-wallet'], store_credit: ['📒', 'เงินเชื่อ / ชำระภายหลัง', 'Store credit / pay later'],
  card: ['💳', 'บัตร', 'Card'], mixed: ['🔀', 'หลายช่องทาง', 'Mixed'],
};
const payName = m => (PAY[m] || ['', m, m])[LANG === 'th' ? 1 : 2];
const payIcon = m => (PAY[m] || ['💰'])[0];
const PAY_CHOICES = ['cash', 'promptpay', 'transfer', 'credit_card', 'debit_card'];
const shopMethods = () => { const a = Array.isArray(S.shop?.checkout_methods) ? S.shop.checkout_methods.filter(k => PAY_CHOICES.includes(k)) : [];
  return a.length ? a : ['cash', 'promptpay']; };   // set in ตั้งค่า → ช่องทางชำระเงิน (default: เงินสด / สแกนจ่าย)
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

/* ---------------- online / offline + sale queue ---------------- */
const OQ = 'pos_offline_sales';
const oqGet = () => JSON.parse(localStorage.getItem(OQ) || '[]');
const oqSet = a => { localStorage.setItem(OQ, JSON.stringify(a)); updateNet(); };
const isNetErr = e => !navigator.onLine || /fetch|network|load failed|timeout|ECONN/i.test(e?.message || String(e));
function updateNet() {
  const el = $('#net'); if (!el) return;
  const n = oqGet().filter(x => x.shop === S.shop?.id).length, on = navigator.onLine;
  el.innerHTML = `<span class="netdot ${on ? '' : 'off'}"></span> ${on ? 'ออนไลน์' : 'ออฟไลน์'}${n ? ` · รอซิงก์ ${n}` : ''}`;
  el.className = 'chip ' + (on ? (n ? 'warn' : 'ok') : 'bad');
  el.title = n ? 'มีบิลที่บันทึกขณะออฟไลน์ รอส่งขึ้นระบบ' : '';
}
async function submitSale(payload) {
  if (!navigator.onLine) return queueSale(payload);
  try { return { sale: await q(sb.rpc('create_sale', { p_shop: S.shop.id, p: payload })), queued: false }; }
  catch (e) { if (isNetErr(e)) return queueSale(payload); throw e; }
}
function queueSale(payload) {
  if (payload.payments.some(p => p.method !== 'cash'))
    throw new Error('ออฟไลน์อยู่ — รับได้เฉพาะเงินสด (สแกนจ่ายต้องใช้อินเทอร์เน็ต)');
  const a = oqGet(); a.push({ shop: S.shop.id, payload, at: new Date().toISOString() }); oqSet(a);
  return { queued: true, sale: { id: null, bill_no: 'OFF-' + payload.client_id.slice(0, 6).toUpperCase(), created_at: new Date().toISOString(),
    cashier_name: S.user.user_metadata?.full_name || S.user.email, status: 'paid', pay_status: 'paid', ...payload } };
}
let syncing = false;
async function syncQueue() {
  if (syncing || !navigator.onLine || !S.shop) return; syncing = true;
  try {
    let a = oqGet(), done = 0;
    for (const it of [...a]) {
      try { await q(sb.rpc('create_sale', { p_shop: it.shop, p: it.payload })); a = a.filter(x => x.payload.client_id !== it.payload.client_id); oqSet(a); done++; }
      catch (e) { if (isNetErr(e)) break; it.error = e.message; oqSet(a); }
    }
    if (done) { toast(`ซิงก์บิลออฟไลน์แล้ว ${done} บิล`, 'ok'); if (S.page === 'pos') loadPosStats().catch(() => {}); }
  } finally { syncing = false; }
}
window.addEventListener('online', () => { updateNet(); toast('กลับมาออนไลน์แล้ว', 'ok'); syncQueue(); });
window.addEventListener('offline', () => { updateNet(); toast('ออฟไลน์ — ยังขายเงินสดได้ ระบบจะซิงก์ให้อัตโนมัติ', 'bad'); });
setInterval(syncQueue, 30000);

/* ---------------- shell additions ---------------- */
const _renderShell = renderShell;
renderShell = function () {
  _renderShell();
  $('.top .tt')?.insertAdjacentHTML('beforeend', '<small class="pdesc" id="pdesc"></small>');
  $('.top .tt')?.insertAdjacentHTML('afterend', '<span id="net" class="chip"></span>');
  updateNet();
};
const _go = go;
go = function (page) {
  _go(page);
  const el = $('#pdesc'); if (el) el.textContent = S.page === 'pos' ? '' : (PAGE_DESC[S.page] || '');
};

/* ---------------- cart additions: notes, confirm clear, units ---------------- */
const _drawCart = drawCart;
drawCart = function () {
  _drawCart();
  const el = $('#cart'); if (!el) return;
  const ft = $('.ft', el);
  if (ft && !$('#noteBtn', el)) ft.insertAdjacentHTML('afterbegin', `<div class="tline"><a href="#" id="noteBtn">📝 ${S.note ? esc(S.note) : 'หมายเหตุลูกค้า'}</a><span></span></div>`);
  $('#noteBtn', el)?.addEventListener('click', e => { e.preventDefault();
    formModal('หมายเหตุลูกค้า', [{ k: 'note', label: 'หมายเหตุ (พิมพ์บนใบเสร็จ)', type: 'textarea', full: true }], { note: S.note || '' }, async o => { S.note = o.note; drawCart(); }); });
  const clr = $('#clrBtn', el);
  if (clr) clr.onclick = async () => { if (await confirmBox('ต้องการล้างสินค้าทั้งหมดในตะกร้าหรือไม่?')) { S.note = ''; resetSale(); } };
  if (!canDo('apply_discount')) { const d = $('#discBtn', el); if (d) { d.onclick = e => { e.preventDefault(); toast('ไม่มีสิทธิ์ให้ส่วนลด', 'bad'); }; } }
};
function unitPicker(p, qty = 1) {
  const units = [{ unit: p.unit, factor: 1, price: num(p.promo_price) > 0 ? num(p.promo_price) : num(p.price) }, ...p.units];
  const m = modal(p.name, `<p class="muted" style="margin-top:0">เลือกหน่วยขาย</p><div class="pills" style="flex-direction:column">${units.map((u, i) =>
    `<button class="btn lg" data-u="${i}" style="justify-content:space-between;width:100%"><span>${esc(u.unit)}${u.factor > 1 ? ` <small class="muted">(${qtyf(u.factor)} ${esc(p.unit)})</small>` : ''}</span><b>${baht(u.price)}</b></button>`).join('')}</div>`, { sheet: true });
  $$('[data-u]', m).forEach(b => b.onclick = () => { const u = units[+b.dataset.u]; m.close(); addToCart(p, qty, i0(u)); });
  function i0(u) { return { unit: u.factor === 1 && u.unit === p.unit ? '' : u.unit, factor: num(u.factor) || 1, price: num(u.price) }; }
}

/* ---------------- payment (split, all Thai methods, pending QR, idempotent, offline) ---------------- */
payDialog = function () {
  const c = calc(), methods = shopMethods(), clientId = uid();
  const preset = S._payPreset && methods.includes(S._payPreset) ? S._payPreset : (methods[0] || 'cash'); S._payPreset = null;
  let lines = [{ method: preset, amount: c.total, ref: '' }], split = false, received = c.total, busy = false;
  const fullTax = S.shop.vat_mode !== 'none';
  const m = modal(`ชำระเงิน ${baht(c.total)}`, `
    <div id="payTop"></div><div id="pbody"></div>
    <div class="row" style="margin-top:10px;justify-content:space-between">
      <button class="btn sm" id="splitBtn">🔀 แบ่งจ่ายหลายช่องทาง</button>
      <label class="row"><input type="checkbox" id="autoPrint" ${localStorage.getItem('pos_autoprint') === '1' ? 'checked' : ''}> 🖨️ พิมพ์ใบเสร็จอัตโนมัติ</label></div>
    ${fullTax ? `<details id="taxBox" style="margin-top:10px"><summary class="b" style="cursor:pointer">🧾 ออกใบกำกับภาษีเต็มรูป (ระบุข้อมูลผู้ซื้อ)</summary>
      <div class="grid2" style="margin-top:10px"><div class="fg"><label class="f">ชื่อผู้ซื้อ / บริษัท</label><input class="in" id="txName" value="${esc(S.customer?.name || '')}"></div>
      <div class="fg"><label class="f">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label><input class="in" id="txId" inputmode="numeric" maxlength="13" value="${esc(S.customer?.tax_id || '')}"></div>
      <div class="fg" style="grid-column:1/-1"><label class="f">ที่อยู่</label><input class="in" id="txAddr" value="${esc(S.customer?.address || '')}"></div>
      <div class="fg"><label class="f">สาขา (สำนักงานใหญ่ / เลขสาขา)</label><input class="in" id="txBr" value="${esc(S.customer?.tax_branch || 'สำนักงานใหญ่')}"></div></div></details>` : ''}`,
    { foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn ok lg" id="cfm">✔ ยืนยันชำระเงิน</button>` });
  $('[data-c]', m).onclick = m.close;
  say('ยอดชำระ ' + bahtWords(c.total));
  const pending = () => lines.some(l => ['promptpay', 'qr'].includes(l.method) && !l.verified);
  const cashLine = () => lines.find(l => l.method === 'cash');
  const nonCash = () => r2(lines.filter(l => l.method !== 'cash').reduce((a, l) => a + num(l.amount), 0));
  const draw = () => {
    const top = $('#payTop', m), pb = $('#pbody', m);
    if (!split) {
      const L = lines[0];
      top.innerHTML = `<div class="paym" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${methods.map(k => `<button data-m="${k}" class="${k === L.method ? 'on' : ''}">${payIcon(k)} ${payName(k)}</button>`).join('')}</div>`;
      $$('[data-m]', top).forEach(b => b.onclick = () => { L.method = b.dataset.m; L.verified = false; draw(); });
      pb.innerHTML = methodBody(L, c.total);
    } else {
      top.innerHTML = '';
      const rest = r2(c.total - lines.reduce((a, l) => a + num(l.amount), 0));
      pb.innerHTML = lines.map((L, i) => `<div class="split-row"><select class="in" data-sm="${i}">${methods.map(k => `<option value="${k}" ${k === L.method ? 'selected' : ''}>${payIcon(k)} ${payName(k)}</option>`).join('')}</select>
          <input class="in" data-sa="${i}" type="number" step="any" inputmode="decimal" value="${L.amount}"><button class="btn sm bad" data-sx="${i}" ${lines.length < 2 ? 'disabled' : ''}>×</button></div>
          ${['promptpay', 'qr'].includes(L.method) ? verifyBox(L, i) : ''}`).join('') +
        `<button class="btn sm" id="addLine">➕ เพิ่มช่องทาง</button>
        <div class="tline big" style="margin-top:10px"><span>${rest > 0 ? 'คงเหลือ' : rest < 0 ? 'เกิน' : 'ครบแล้ว'}</span><span style="color:${rest === 0 ? 'var(--ok)' : 'var(--bad)'}">${baht(Math.abs(rest))}</span></div>
        ${cashLine() ? `<p class="muted">เงินสดที่ได้รับเกินจะคำนวณเป็นเงินทอน</p>` : ''}`;
      $$('[data-sm]', pb).forEach(s => s.onchange = () => { lines[+s.dataset.sm].method = s.value; lines[+s.dataset.sm].verified = false; draw(); });
      $$('[data-sa]', pb).forEach(s => s.onchange = () => { lines[+s.dataset.sa].amount = num(s.value); draw(); });
      $$('[data-sx]', pb).forEach(b => b.onclick = () => { lines.splice(+b.dataset.sx, 1); draw(); });
      $('#addLine', pb).onclick = () => { const used = lines.map(l => l.method); lines.push({ method: methods.find(k => !used.includes(k)) || 'cash', amount: Math.max(0, rest), ref: '' }); draw(); };
    }
    wireBody();
  };
  const verifyBox = () => '';
  const methodBody = (L, total) => {
    if (L.method === 'cash') {
      const notes = [...new Set([total, Math.ceil(total / 20) * 20, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000, 1000])].filter(v => v >= total).slice(0, 6);
      return `<label class="f">รับเงินมา</label><input class="in" id="recv" type="number" step="any" inputmode="decimal" value="${received}" style="font-size:28px;font-weight:700">
        <div class="quick">${notes.map(v => `<button class="btn" data-v2="${v}">${v === total ? 'พอดี' : baht(v)}</button>`).join('')}</div>
        <div class="tline big"><span>เงินทอน</span><span id="chg">0.00</span></div>`;
    }
    if (L.method === 'promptpay' || L.method === 'qr') {
      if (!S.shop.promptpay_id) return `<p class="chip warn">กรุณาตั้งค่าพร้อมเพย์ในหน้าตั้งค่าก่อน</p>${verifyBox(L)}`;
      const payload = promptPayPayload(S.shop.promptpay_id, total);
      bc?.postMessage({ type: 'qr', svg: qrSvg(payload), total });
      return `<div class="qr">${qrSvg(payload)}<b style="font-size:22px">${baht(total)}</b><span class="muted">ให้ลูกค้าสแกนจ่าย แล้วกด “ยืนยันชำระเงิน”</span></div>`;
    }
    if (L.method === 'store_credit') {
      if (!S.customer) return `<p class="chip bad">การขายเงินเชื่อต้องเลือกลูกค้าก่อน</p>`;
      const cu = S.customer; return `<div class="kv"><span>ลูกค้า</span><b>${esc(cu.name)}</b><span>ยอดค้างเดิม</span><b>${baht(cu.balance)}</b><span>วงเงินเครดิต</span><b>${num(cu.credit_limit) ? baht(cu.credit_limit) : 'ไม่จำกัด'}</b><span>ยอดค้างหลังขาย</span><b style="color:var(--bad)">${baht(num(cu.balance) + total)}</b></div>`;
    }
    return `<div class="fg"><label class="f">เลขอ้างอิง / 4 หลักท้ายบัตร (ถ้ามี)</label><input class="in" id="refIn" value="${esc(L.ref || '')}"></div>`;
  };
  const wireBody = () => {
    const r = $('#recv', m);
    if (r) {
      const upd = () => { received = num(r.value); const ch = r2(received - c.total); $('#chg', m).textContent = money(ch); $('#chg', m).style.color = ch < 0 ? 'var(--bad)' : 'var(--ok)'; };
      r.oninput = upd; upd(); setTimeout(() => r.select(), 50);
      $$('[data-v2]', m).forEach(b => b.onclick = () => { r.value = b.dataset.v2; upd(); });
      r.onkeydown = e => { if (e.key === 'Enter') $('#cfm', m).click(); };
    }
    $$('[data-v]', m).forEach(cb => cb.onchange = () => { lines[+cb.dataset.v].verified = cb.checked; });
    const ref = $('#refIn', m); if (ref) ref.oninput = () => { lines[0].ref = ref.value; };
  };
  $('#splitBtn', m).onclick = () => { split = !split; if (split && lines.length === 1) { lines[0].amount = c.total; } if (!split) lines = [{ ...lines[0], amount: c.total }]; $('#splitBtn', m).textContent = split ? '↩ ชำระช่องทางเดียว' : '🔀 แบ่งจ่ายหลายช่องทาง'; draw(); };
  draw();

  $('#cfm', m).onclick = async () => {
    if (busy) return;
    let payments, paid, change;
    if (!split) {
      const L = lines[0];
      if (L.method === 'cash') { if (received + 0.001 < c.total) return sfx('error'), toast('ยอดเงินที่รับไม่พอ', 'bad'); paid = received; change = r2(received - c.total); }
      else { paid = c.total; change = 0; }
      if (L.method === 'store_credit' && !S.customer) return toast('กรุณาเลือกลูกค้าก่อน', 'bad');
      payments = [{ method: L.method, amount: c.total, ref: L.ref || '', status: 'confirmed' }];
    } else {
      const sum = r2(lines.reduce((a, l) => a + num(l.amount), 0));
      const cash = cashLine();
      if (sum + 0.001 < c.total) return toast('ยอดชำระรวมยังไม่ครบ', 'bad');
      if (sum - c.total > 0.001 && !cash) return toast('ยอดรวมเกินยอดชำระ (เกินได้เฉพาะเงินสดเพื่อทอน)', 'bad');
      if (lines.some(l => l.method === 'store_credit') && !S.customer) return toast('การขายเงินเชื่อต้องเลือกลูกค้า', 'bad');
      change = r2(sum - c.total); paid = sum;
      payments = lines.filter(l => num(l.amount) > 0).map(l => ({ method: l.method, amount: l.method === 'cash' ? r2(num(l.amount) - change) : num(l.amount), ref: l.ref || '',
        status: 'confirmed' })).filter(x => x.amount > 0);
    }
    let tax = {};
    if ($('#taxBox', m)?.open && $('#txName', m).value.trim()) {
      const id = $('#txId', m).value.trim();
      if (!/^\d{13}$/.test(id)) return toast('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก', 'bad');
      tax = { invoice_type: 'full', tax_name: $('#txName', m).value.trim(), tax_id: id, tax_address: $('#txAddr', m).value.trim(), tax_branch: $('#txBr', m).value.trim() };
    }
    localStorage.setItem('pos_autoprint', $('#autoPrint', m).checked ? '1' : '0');
    busy = true; const btn = $('#cfm', m); btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
    const payload = { client_id: clientId, customer_id: S.customer?.id || '', shift_id: S.shift?.id || '', subtotal: c.subtotal, discount: c.discount,
      points_used: c.pointsUse, points_earned: c.pointsEarned, vat: c.vat, total: c.total, paid, change, payments, payment_method: payments.length > 1 ? 'mixed' : payments[0].method,
      note: S.promo ? 'โปรโมชั่น: ' + S.promo.name : '', customer_note: S.note || '', ...tax,
      items: S.cart.map(l => ({ product_id: l.product_id, name: l.name, qty: l.qty, price: l.price, discount: num(l.discount), unit: l.unit || '', factor: l.factor || 1 })) };
    try {
      const { sale, queued } = await submitSale(payload);
      S.cart.forEach(l => { const p = S.products.find(x => x.id === l.product_id); if (p?.track_stock) p.stock -= l.qty * (l.factor || 1); });
      if (S.customer && !queued) { S.customer.points = Math.max(0, num(S.customer.points) - c.pointsUse + c.pointsEarned);
        S.customer.balance = num(S.customer.balance) + payments.filter(p => p.method === 'store_credit').reduce((a, p) => a + p.amount, 0); }
      const items = S.cart.map(l => ({ ...l })), cust = S.customer;
      sale._payments = payments; sale.change = change; sale.paid = paid;
      m.close();
      bc?.postMessage({ type: 'thanks', total: c.total, change });
      sfx('pay'); say(change > 0 ? 'เงินทอน ' + bahtWords(change) : 'ขอบคุณค่ะ');
      S.note = ''; resetSale(); drawGrid(); loadPosStats().catch(() => {});
      if (queued) toast('บันทึกบิลแบบออฟไลน์แล้ว — จะส่งขึ้นระบบอัตโนมัติเมื่อออนไลน์', 'ok');
      else if (sale.pay_status === 'pending') toast('บันทึกแล้ว — สถานะ “รอตรวจสอบการชำระ”', 'bad');
      else toast('ชำระเงินสำเร็จ', 'ok');
      showReceipt(sale, items, cust, localStorage.getItem('pos_autoprint') === '1');
    } catch (e) { busy = false; btn.disabled = false; btn.textContent = '✔ ยืนยันชำระเงิน'; sfx('error'); fail(e); }
  };
};
/* ---------------- helpers ---------------- */
let CHART_P = null;
const loadChart = () => (CHART_P ||= loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'));
const CHARTS = {};
function chart(id, cfg) { CHARTS[id]?.destroy?.(); const el = document.getElementById(id); if (!el || !window.Chart) return; CHARTS[id] = new Chart(el, cfg); }
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function rangeOf(k, a, b) {
  const now = new Date(), d0 = x => { x = new Date(x); x.setHours(0, 0, 0, 0); return x; }, d1 = x => { x = new Date(x); x.setHours(23, 59, 59, 999); return x; };
  const day = 864e5;
  switch (k) {
    case 'today': return [d0(now), d1(now)];
    case 'yest': return [d0(now - day), d1(now - day)];
    case 'd7': return [d0(now - 6 * day), d1(now)];
    case 'd30': return [d0(now - 29 * day), d1(now)];
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1), d1(now)];
    case 'last': return [new Date(now.getFullYear(), now.getMonth() - 1, 1), d1(new Date(now.getFullYear(), now.getMonth(), 0))];
    default: return [d0(a), d1(b)];
  }
}
const RANGES = [['today', 'วันนี้'], ['yest', 'เมื่อวาน'], ['d7', '7 วันล่าสุด'], ['d30', '30 วันล่าสุด'], ['month', 'เดือนนี้'], ['last', 'เดือนก่อน'], ['custom', 'กำหนดเอง']];
function rangeBar(el, onChange, def = 'today') {
  el.innerHTML = `<div class="tabs">${RANGES.map(([k, l]) => `<button class="tab ${k === def ? 'on' : ''}" data-r="${k}">${l}</button>`).join('')}
    <span class="row hidden" id="rcustom"><input type="date" class="in" id="ra" style="width:auto"> – <input type="date" class="in" id="rb" style="width:auto"></span></div>`;
  let cur = def;
  const fire = () => { const [a, b] = rangeOf(cur, $('#ra', el).value, $('#rb', el).value); onChange(a, b, cur); };
  $$('[data-r]', el).forEach(b => b.onclick = () => { cur = b.dataset.r; $$('[data-r]', el).forEach(x => x.classList.toggle('on', x === b));
    $('#rcustom', el).classList.toggle('hidden', cur !== 'custom'); if (cur === 'custom') { $('#ra', el).value ||= ymd(new Date(Date.now() - 6 * 864e5)); $('#rb', el).value ||= ymd(new Date()); } fire(); });
  $('#ra', el).onchange = $('#rb', el).onchange = fire;
  fire();
}
const pct = (a, b) => b ? ((a - b) / Math.abs(b) * 100) : (a ? 100 : 0);
const trend = (a, b) => { const p = pct(a, b); return `<small style="color:${p >= 0 ? 'var(--ok)' : 'var(--bad)'};font-weight:700">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%</small>`; };
async function salesIn(a, b, extra = '') {
  return fetchAll(() => sb.from('sales').select('id,bill_no,total,vat,discount,cost_total,refunded_total,status,pay_status,payment_method,cashier_name,cashier_id,customer_id,items_count,created_at' + extra)
    .eq('shop_id', S.shop.id).in('status', ['paid', 'partial_refund', 'refunded']).gte('created_at', a.toISOString()).lte('created_at', b.toISOString()).order('created_at'));
}

/* ================= DASHBOARD ================= */
VIEWS.dashboard = pg => {
  const prof = canDo('view_profit');
  pg.innerHTML = `<div id="dr"></div><div id="db"><div class="skel"><i></i><i></i><i></i></div></div>`;
  rangeBar($('#dr'), async (a, b) => {
    const len = b - a + 1, pa = new Date(a - len), pb2 = new Date(a - 1);
    const [cur, prev, pays, items, exps, refs, yearS] = await Promise.all([
      salesIn(a, b), salesIn(pa, pb2),
      fetchAll(() => sb.from('sale_payments').select('method,amount,status,sales!inner(status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('created_at', a.toISOString()).lte('created_at', b.toISOString())),
      fetchAll(() => sb.from('sale_items').select('product_id,name,qty,price,discount,cost,refunded_qty,sales!inner(created_at,status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('sales.created_at', a.toISOString()).lte('sales.created_at', b.toISOString())),
      fetchAll(() => sb.from('expenses').select('amount,category,status').eq('shop_id', S.shop.id).gte('spent_on', ymd(a)).lte('spent_on', ymd(b))),
      fetchAll(() => sb.from('refunds').select('amount,method').eq('shop_id', S.shop.id).gte('created_at', a.toISOString()).lte('created_at', b.toISOString())),
      fetchAll(() => sb.from('sales').select('total,refunded_total,created_at').eq('shop_id', S.shop.id).neq('status', 'void').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString())),
    ]);
    const sum = (arr, f) => arr.reduce((x, r) => x + num(typeof f === 'function' ? f(r) : r[f]), 0);
    const gross = sum(cur, 'total'), refund = sum(refs, 'amount'), revenue = gross - refund, vat = sum(cur, 'vat');
    const cogs = sum(cur, 'cost_total') - items.reduce((x, i) => x + num(i.refunded_qty) * num(i.cost), 0);
    const netSales = revenue - vat * (revenue / (gross || 1)), gp = netSales - cogs;
    const exp = sum(exps.filter(e => e.status !== 'pending'), 'amount'), np = gp - exp;
    const prevRev = sum(prev, x => num(x.total) - num(x.refunded_total));
    const by = {}; pays.forEach(p => { by[p.method] = (by[p.method] || 0) + num(p.amount); });
    const pendingAmt = pays.filter(p => p.status === 'pending').reduce((x, p) => x + num(p.amount), 0);
    const qtySold = items.reduce((x, i) => x + num(i.qty) - num(i.refunded_qty), 0);
    const prod = {}; items.forEach(i => { const k = i.product_id || i.name; const o = prod[k] ||= { id: i.product_id, name: i.name, qty: 0, rev: 0 }; o.qty += num(i.qty) - num(i.refunded_qty); o.rev += (num(i.qty) - num(i.refunded_qty)) * num(i.price); });
    const top = Object.values(prod).sort((x, y) => y.rev - x.rev).slice(0, 8);
    const sold = new Set(Object.values(prod).filter(x => x.qty > 0).map(x => x.id));
    const slow = S.products.filter(p => p.active && !sold.has(p.id)).slice(0, 8);
    const low = S.products.filter(p => p.active && p.track_stock && p.stock > 0 && p.stock <= p.low_stock);
    const out = S.products.filter(p => p.active && p.track_stock && p.stock <= 0);
    const days = []; for (let d = new Date(a); d <= b && days.length < 62; d.setDate(d.getDate() + 1)) days.push(ymd(d));
    const dayTot = {}, prevDay = {}; cur.forEach(s => { const k = ymd(s.created_at); dayTot[k] = (dayTot[k] || 0) + num(s.total) - num(s.refunded_total); });
    prev.forEach(s => { const k = Math.floor((new Date(s.created_at) - pa) / 864e5); prevDay[k] = (prevDay[k] || 0) + num(s.total) - num(s.refunded_total); });
    const hours = Array(24).fill(0); cur.forEach(s => { hours[new Date(s.created_at).getHours()] += num(s.total); });
    const months = []; for (let i = 11; i >= 0; i--) { const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1); months.push([d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), d]); }
    const monTot = {}; yearS.forEach(s => { const k = s.created_at.slice(0, 7); monTot[k] = (monTot[k] || 0) + num(s.total) - num(s.refunded_total); });
    const kpi = (ic, k, v, sub = '', col = '') => `<div class="stat"><div class="k">${ic} ${k}</div><div class="v" ${col ? `style="color:${col}"` : ''}>${v}</div>${sub ? `<div class="muted" style="font-size:12px;margin-top:4px">${sub}</div>` : ''}</div>`;
    $('#db').innerHTML = `
      <div class="stats">
        ${kpi('💰', 'ยอดขายสุทธิ (หลังคืนเงิน)', baht(revenue), trend(revenue, prevRev) + ' เทียบช่วงก่อนหน้า')}
        ${kpi('🧾', 'จำนวนบิล', qtyf(cur.length), trend(cur.length, prev.length) + ` · เฉลี่ย ${baht(cur.length ? revenue / cur.length : 0)}/บิล`)}
        ${kpi('📦', 'จำนวนสินค้าที่ขาย', qtyf(qtySold))}
        ${prof ? kpi('📈', 'กำไรขั้นต้น', baht(gp), `ยอดขายก่อน VAT ${baht(netSales)} − ต้นทุน ${baht(cogs)}`, gp >= 0 ? 'var(--ok)' : 'var(--bad)') : ''}
        ${kpi('💸', 'ค่าใช้จ่าย', baht(exp), exps.some(e => e.status === 'pending') ? 'มีรายการรออนุมัติ' : '', 'var(--bad)')}
        ${prof ? kpi('🏁', 'กำไรสุทธิ', baht(np), 'กำไรขั้นต้น − ค่าใช้จ่าย', np >= 0 ? 'var(--ok)' : 'var(--bad)') : ''}
        ${kpi('↩️', 'คืนเงิน', baht(refund), `${refs.length} รายการ`)}
        ${pendingAmt ? kpi('⏳', 'รอตรวจสอบการชำระ', baht(pendingAmt), 'พร้อมเพย์/QR ที่ยังไม่ยืนยัน', 'var(--warn)') : ''}
      </div>
      <div class="stats">${['cash', 'transfer', 'promptpay', 'qr', 'credit_card', 'debit_card', 'ewallet', 'store_credit'].filter(k => by[k]).map(k => kpi(payIcon(k), 'ยอด' + payName(k), baht(by[k]))).join('') || kpi('💳', 'ยอดตามช่องทางชำระ', baht(0))}</div>
      <div class="grid2">
        <div class="card"><div class="row"><b style="flex:1">แนวโน้มยอดขาย</b><span class="muted" style="font-size:12px">— เส้นประ = ช่วงก่อนหน้า</span></div><div class="chartbox"><canvas id="cTrend"></canvas></div></div>
        <div class="card"><b>ยอดขายรายเดือน (12 เดือน)</b><div class="chartbox"><canvas id="cMonth"></canvas></div></div>
      </div><br>
      <div class="grid2">
        <div class="card"><b>ช่องทางการชำระเงิน</b><div class="chartbox"><canvas id="cPay"></canvas></div></div>
        <div class="card"><b>ช่วงเวลาที่ขายดี</b><div class="chartbox"><canvas id="cHour"></canvas></div></div>
      </div><br>
      <div class="grid2">
        <div class="card"><b>🔥 สินค้าขายดี</b><table class="rtable">${top.map((p, i) => `<tr><td>${i + 1}. ${esc(p.name)}</td><td class="right">${qtyf(p.qty)}</td><td class="right b">${baht(p.rev)}</td></tr>`).join('') || '<tr><td class="muted">ยังไม่มีการขาย</td></tr>'}</table></div>
        <div class="card"><b>🐢 สินค้าขายช้า (ไม่มีการขายในช่วงนี้)</b><table class="rtable">${slow.map(p => `<tr><td>${esc(p.name)}</td><td class="right muted">${p.track_stock ? qtyf(p.stock) + ' ' + esc(p.unit) : ''}</td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</table></div>
      </div><br>
      <div class="grid2">
        <div class="card"><b>⚠️ สินค้าใกล้หมด (${low.length})</b><table class="rtable">${low.slice(0, 10).map(p => `<tr><td>${esc(p.name)}</td><td class="right"><span class="chip warn">${qtyf(p.stock)} ${esc(p.unit)}</span></td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</table></div>
        <div class="card"><b>⛔ สินค้าหมดสต็อก (${out.length})</b><table class="rtable">${out.slice(0, 10).map(p => `<tr><td>${esc(p.name)}</td><td class="right"><span class="chip bad">${qtyf(p.stock)}</span></td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</table></div>
      </div>`;
    await loadChart();
    const brand = css('--brand'), muted = css('--muted'), grid = css('--line');
    const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + baht(c.parsed.y ?? c.parsed) } } },
      scales: { x: { grid: { display: false }, ticks: { color: muted } }, y: { grid: { color: grid }, ticks: { color: muted, callback: v => '฿' + Number(v).toLocaleString('th-TH') } } } };
    if (days.length > 1) chart('cTrend', { type: 'line', data: { labels: days.map(d => new Date(d).toLocaleDateString(dateLoc(), { day: 'numeric', month: 'short' })),
      datasets: [{ data: days.map(d => dayTot[d] || 0), borderColor: brand, backgroundColor: brand + '22', fill: true, tension: .3, pointRadius: 2 },
        { data: days.map((d, i) => prevDay[i] || 0), borderColor: muted, borderDash: [5, 5], pointRadius: 0, tension: .3 }] }, options: base });
    else chart('cTrend', { type: 'bar', data: { labels: [...Array(24).keys()].map(h => h + ':00'), datasets: [{ data: hours, backgroundColor: brand, borderRadius: 4 }] }, options: base });
    chart('cMonth', { type: 'bar', data: { labels: months.map(([, d]) => d.toLocaleDateString(dateLoc(), { month: 'short', year: '2-digit' })), datasets: [{ data: months.map(([k]) => monTot[k] || 0), backgroundColor: brand, borderRadius: 6 }] }, options: base });
    const pk = Object.keys(by);
    chart('cPay', { type: 'doughnut', data: { labels: pk.map(payName), datasets: [{ data: pk.map(k => by[k]), backgroundColor: ['#4338ca', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: muted } }, tooltip: { callbacks: { label: c => ` ${c.label}: ${baht(c.parsed)}` } } } } });
    chart('cHour', { type: 'bar', data: { labels: [...Array(24).keys()].map(h => String(h)), datasets: [{ data: hours, backgroundColor: brand + 'cc', borderRadius: 4 }] }, options: base });
  }, 'today');
};

/* ================= SALES HISTORY ================= */
const ST_CHIP = { paid: ['ok', 'ชำระแล้ว'], void: ['bad', 'ยกเลิก'], refunded: ['bad', 'คืนเงินทั้งบิล'], partial_refund: ['warn', 'คืนบางส่วน'] };
const statusChip = s => { const [c, l] = ST_CHIP[s.status] || ['', s.status]; return `<span class="chip ${c}">${l}</span>${s.pay_status === 'pending' && s.status !== 'void' ? ' <span class="chip warn">⏳ รอตรวจสอบ</span>' : ''}`; };
VIEWS.sales = pg => {
  pg.innerHTML = `<div id="sr"></div><div class="row" style="margin-bottom:12px">
      <div class="sbox" style="max-width:320px"><span>🔍</span><input class="in" id="bs" placeholder="เลขบิล / ลูกค้า / พนักงาน"></div>
      <select class="in" id="bst" style="width:auto"><option value="">ทุกสถานะ</option><option value="paid">ชำระแล้ว</option><option value="pending">รอตรวจสอบการชำระ</option><option value="partial_refund">คืนบางส่วน</option><option value="refunded">คืนเงินทั้งบิล</option><option value="void">ยกเลิก</option></select>
      <select class="in" id="bpm" style="width:auto"><option value="">ทุกช่องทาง</option>${Object.keys(PAY).map(k => `<option value="${k}">${payName(k)}</option>`).join('')}</select>
      <span class="sp"></span><button class="btn" id="bx">⬇ CSV</button></div><div id="bl"></div>`;
  let rows = [];
  const draw = () => {
    const v = $('#bs').value.trim().toLowerCase(), st = $('#bst').value, pm = $('#bpm').value;
    const list = rows.filter(r => (!v || r.bill_no.toLowerCase().includes(v) || (r.customer?.name || '').toLowerCase().includes(v) || (r.cashier_name || '').toLowerCase().includes(v))
      && (!st || (st === 'pending' ? r.pay_status === 'pending' && r.status !== 'void' : r.status === st)) && (!pm || r.payment_method === pm));
    const ok = list.filter(r => r.status !== 'void');
    $('#bl').innerHTML = `<div class="stats"><div class="stat"><div class="k">จำนวนบิล</div><div class="v">${ok.length}</div></div>
      <div class="stat"><div class="k">ยอดขาย</div><div class="v">${baht(ok.reduce((a, r) => a + num(r.total), 0))}</div></div>
      <div class="stat"><div class="k">คืนเงิน</div><div class="v">${baht(ok.reduce((a, r) => a + num(r.refunded_total), 0))}</div></div></div>
      ${list.length ? `<div class="tblwrap"><table class="tbl"><tr><th>เลขที่บิล</th><th>วันเวลา</th><th>ลูกค้า</th><th>ชำระโดย</th><th>พนักงาน</th><th class="right">ยอดรวม</th><th>สถานะ</th></tr>
      ${list.map(r => `<tr class="click" data-id="${r.id}"><td><b>${esc(r.bill_no)}</b>${r.invoice_type === 'full' ? ' <span class="chip info">ใบกำกับเต็มรูป</span>' : ''}</td><td>${dt(r.created_at)}</td><td>${esc(r.customer?.name || 'ลูกค้าทั่วไป')}</td>
        <td>${payIcon(r.payment_method)} ${payName(r.payment_method)}</td><td>${esc(r.cashier_name)}</td><td class="right b">${baht(r.total)}</td><td>${statusChip(r)}</td></tr>`).join('')}</table></div>`
      : `<div class="empty">ไม่พบรายการขายในช่วงเวลานี้</div>`}`;
    $$('[data-id]', pg).forEach(tr => tr.onclick = () => billDetail(rows.find(r => r.id === tr.dataset.id), () => load()));
  };
  let A, B;
  const load = async () => {
    rows = await fetchAll(() => sb.from('sales').select('*, customer:customers(name,tax_id,address,tax_branch,points,balance)').eq('shop_id', S.shop.id).gte('created_at', A.toISOString()).lte('created_at', B.toISOString()).order('created_at', { ascending: false }));
    if (S.role === 'cashier') rows = rows.filter(r => r.cashier_id === S.user.id);
    draw();
  };
  $('#bs').oninput = $('#bst').onchange = $('#bpm').onchange = draw;
  $('#bx').onclick = () => download(`sales_${ymd(A)}_${ymd(B)}.csv`, toCSV(rows.map(r => ({ ...r, customer: r.customer?.name || '' })), ['bill_no', 'created_at', 'customer', 'cashier_name', 'payment_method', 'subtotal', 'discount', 'vat', 'total', 'refunded_total', 'status', 'pay_status', 'invoice_type']));
  rangeBar($('#sr'), (a, b) => { A = a; B = b; load().catch(fail); }, 'today');
};

billDetail = async function (sale, reload) {
  const [items, pays, refs] = await Promise.all([
    q(sb.from('sale_items').select('*').eq('sale_id', sale.id)),
    q(sb.from('sale_payments').select('*').eq('sale_id', sale.id)),
    q(sb.from('refunds').select('*').eq('sale_id', sale.id).order('created_at')),
  ]);
  sale._payments = pays;
  const cust = sale.customer_id ? S.customers.find(c => c.id === sale.customer_id) : null;
  const html = receiptHTML(sale, items, cust);
  const open = sale.status === 'paid' || sale.status === 'partial_refund';
  const m = modal(`บิล ${sale.bill_no}`, `
    <div class="row" style="margin-bottom:10px">${statusChip(sale)}<span class="muted">${dLong(sale.created_at)} ${new Date(sale.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: TZ })} · ${esc(sale.cashier_name)}</span></div>
    ${sale.customer_note ? `<p>📝 ${esc(sale.customer_note)}</p>` : ''}
    <div class="kv" style="margin-bottom:12px">${pays.map(p => `<span>${payIcon(p.method)} ${payName(p.method)}${p.status === 'pending' ? ' <span class="chip warn">รอตรวจสอบ</span>' : ''}${p.ref ? ` <small class="muted">${esc(p.ref)}</small>` : ''}</span><b>${baht(p.amount)}</b>`).join('')}</div>
    ${refs.length ? `<div class="card" style="box-shadow:none;background:var(--badsoft);padding:10px;margin-bottom:12px"><b>ประวัติการคืนเงิน</b>${refs.map(r => `<div class="tline"><span>${esc(r.refund_no)} · ${dt(r.created_at)} · ${payName(r.method)}${r.reason ? ' · ' + esc(r.reason) : ''}</span><b>-${baht(r.amount)}</b></div>`).join('')}</div>` : ''}
    <div class="rcptbox">${html}</div>`, { wide: true, foot: `
    ${sale.pay_status === 'pending' && sale.status !== 'void' ? `<button class="btn ok" id="cpay">✔ ยืนยันได้รับเงินแล้ว</button>` : ''}
    ${open && canDo('refund') ? `<button class="btn" id="rfd">↩️ คืนสินค้า / คืนเงิน</button>` : ''}
    ${sale.status === 'paid' && !num(sale.refunded_total) && canDo('cancel_sale') ? `<button class="btn bad" id="vd">ยกเลิกบิล</button>` : ''}
    <span style="flex:1"></span>
    ${S.shop.vat_mode !== 'none' && sale.invoice_type !== 'full' && sale.status !== 'void' ? `<button class="btn" id="ftx">🧾 ออกใบกำกับภาษีเต็มรูป</button>` : ''}
    <button class="btn" id="shr">📤 ใบเสร็จดิจิทัล</button><button class="btn p" id="rp">🖨️ พิมพ์ซ้ำ</button>` });
  $('#rp', m).onclick = () => printReceipt(html);
  $('#shr', m).onclick = () => shareReceipt(sale, items);
  if ($('#cpay', m)) $('#cpay', m).onclick = async () => { if (!await confirmBox('ยืนยันว่าตรวจสอบแล้วว่าเงินเข้าบัญชีจริง?')) return; try { await q(sb.rpc('confirm_payment', { p_sale: sale.id })); toast('ยืนยันการชำระเงินแล้ว', 'ok'); m.close(); reload?.(); } catch (e) { fail(e); } };
  if ($('#vd', m)) $('#vd', m).onclick = () => formModal('ยกเลิกบิล ' + sale.bill_no, [{ k: 'reason', label: 'เหตุผลการยกเลิก', req: true, full: true }], {}, async o => {
    if (!await confirmBox('คุณต้องการยกเลิกรายการขายนี้หรือไม่? สต็อกจะถูกคืนอัตโนมัติ')) throw new Error('ยกเลิกการทำรายการ');
    await q(sb.rpc('void_sale', { p_sale: sale.id, p_reason: o.reason })); m.close(); await loadMaster(); reload?.(); });
  if ($('#rfd', m)) $('#rfd', m).onclick = () => { m.close(); refundDialog(sale, items, reload); };
  if ($('#ftx', m)) $('#ftx', m).onclick = () => formModal('ใบกำกับภาษีเต็มรูป', [
    { k: 'name', label: 'ชื่อผู้ซื้อ / บริษัท', req: true, full: true }, { k: 'tax_id', label: 'เลขประจำตัวผู้เสียภาษี 13 หลัก', req: true },
    { k: 'branch', label: 'สาขา', def: 'สำนักงานใหญ่' }, { k: 'address', label: 'ที่อยู่', full: true }],
    { name: cust?.name || '', tax_id: cust?.tax_id || '', address: cust?.address || '', branch: cust?.tax_branch || 'สำนักงานใหญ่' }, async o => {
      if (!/^\d{13}$/.test(o.tax_id)) throw new Error('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก');
      const s2 = await q(sb.rpc('issue_tax_invoice', { p_sale: sale.id, p_name: o.name, p_tax_id: o.tax_id, p_address: o.address, p_branch: o.branch }));
      m.close(); Object.assign(sale, s2); billDetail(sale, reload); });
};

/* ================= REFUNDS ================= */
function refundDialog(sale, items, reload) {
  const left = items.map(i => ({ ...i, left: num(i.qty) - num(i.refunded_qty), r: 0 })).filter(i => i.left > 0);
  const methods = ['cash', 'promptpay'];
  const m = modal(`คืนสินค้า / คืนเงิน — ${sale.bill_no}`, `
    <p class="muted" style="margin-top:0">เลือกจำนวนที่ลูกค้าคืน ระบบคำนวณยอดคืนตามสัดส่วนส่วนลดของบิล</p>
    <div id="rl">${left.map((i, k) => `<div class="citem"><div class="nm"><div>${esc(i.name)}</div><small>${baht(i.price)} · คืนได้ ${qtyf(i.left)}</small></div>
      <div class="qty"><button data-d="${k}">−</button><span id="rq${k}">0</span><button data-u="${k}">+</button></div><button class="btn sm" data-all="${k}">ทั้งหมด</button></div>`).join('')}</div>
    <div class="grid2" style="margin-top:12px">
      <div class="fg"><label class="f">เหตุผล</label><select class="in" id="rr">${['สินค้าชำรุด', 'สินค้าหมดอายุ', 'ไม่ตรงตามความต้องการ', 'คิดเงินผิด / ทอนผิด', 'เปลี่ยนสินค้า', 'อื่น ๆ'].map(x => `<option>${x}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">คืนเงินผ่าน</label><select class="in" id="rm">${methods.map(x => `<option value="${x}">${payName(x)}</option>`).join('')}</select></div></div>
    <label class="row"><input type="checkbox" id="rs" checked> นำสินค้ากลับเข้าสต็อก (ไม่ต้องเลือกถ้าสินค้าชำรุด/ทิ้ง)</label>
    <div class="tline big" style="margin-top:12px"><span>ยอดคืนโดยประมาณ</span><span id="rt">฿0.00</span></div>`,
    { foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn bad lg" id="rgo">↩️ ยืนยันคืนเงิน</button>` });
  const lines = left.reduce((a, i) => a + num(i.qty) * num(i.price) - num(i.discount), 0) + items.filter(i => num(i.qty) - num(i.refunded_qty) <= 0).reduce((a, i) => a + num(i.qty) * num(i.price) - num(i.discount), 0);
  const ratio = lines ? num(sale.total) / lines : 1;
  const upd = () => { left.forEach((i, k) => $('#rq' + k, m).textContent = qtyf(i.r));
    $('#rt', m).textContent = baht(r2(left.reduce((a, i) => a + i.r * (num(i.price) - num(i.discount) / num(i.qty)) * ratio, 0))); };
  $$('[data-u]', m).forEach(b => b.onclick = () => { const i = left[+b.dataset.u]; i.r = Math.min(i.left, i.r + 1); upd(); });
  $$('[data-d]', m).forEach(b => b.onclick = () => { const i = left[+b.dataset.d]; i.r = Math.max(0, i.r - 1); upd(); });
  $$('[data-all]', m).forEach(b => b.onclick = () => { const i = left[+b.dataset.all]; i.r = i.left; upd(); });
  $('[data-c]', m).onclick = m.close;
  $('#rr', m).onchange = e => { if (['สินค้าชำรุด', 'สินค้าหมดอายุ'].includes(e.target.value)) $('#rs', m).checked = false; };
  $('#rgo', m).onclick = async () => {
    const its = left.filter(i => i.r > 0).map(i => ({ sale_item_id: i.id, qty: i.r }));
    if (!its.length) return toast('กรุณาเลือกสินค้าที่ต้องการคืน', 'bad');
    if (!await confirmBox('ยืนยันการคืนเงิน? รายการนี้จะถูกบันทึกถาวร')) return;
    const b = $('#rgo', m); b.disabled = true;
    try {
      const r = await q(sb.rpc('refund_sale', { p_sale: sale.id, p: { items: its, method: $('#rm', m).value, reason: $('#rr', m).value, restock: $('#rs', m).checked, shift_id: S.shift?.id || '' } }));
      m.close(); sfx('ok'); toast(`คืนเงินแล้ว ${baht(r.amount)} (${r.refund_no})`, 'ok'); await loadMaster(); reload?.();
      printReceipt(creditNoteHTML(sale, r, left.filter(i => i.r > 0)));
    } catch (e) { b.disabled = false; fail(e); }
  };
}
function creditNoteHTML(sale, r, its) {
  const sh = S.shop;
  return `<div class="rcpt ${sh.receipt_size === '80' ? 'w80' : ''}"><div class="c t">${esc(sh.name)}</div><div class="c"><b>ใบรับคืนสินค้า / ใบลดหนี้</b></div><hr>
    <div>เลขที่: ${esc(r.refund_no)}<br>อ้างอิงบิล: ${esc(sale.bill_no)}<br>${dt(r.created_at)}<br>ผู้ทำรายการ: ${esc(r.user_name)}</div><hr>
    <table>${its.map(i => `<tr><td>${esc(i.name)} x ${qtyf(i.r)}</td></tr>`).join('')}</table><hr>
    <table><tr><td class="t">คืนเงิน</td><td class="right t">${money(r.amount)}</td></tr><tr><td>ช่องทาง</td><td class="right">${payName(r.method)}</td></tr></table>
    ${r.reason ? `<div>เหตุผล: ${esc(r.reason)}</div>` : ''}<hr><div class="c">ลงชื่อผู้รับเงิน ............................</div></div>`;
}

/* ================= RECEIPTS ================= */
function bahtText(n) {
  n = Math.round(num(n) * 100) / 100;
  const D = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'], P = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  const rd = (s, ed) => { let out = ''; const L = s.length; for (let i = 0; i < L; i++) { const d = +s[i], p = L - i - 1; if (!d) continue;
    if (p === 1 && d === 1) out += 'สิบ'; else if (p === 1 && d === 2) out += 'ยี่สิบ'; else if (p === 0 && d === 1 && (L > 1 && /[1-9]/.test(s.slice(0, -1)) || ed)) out += 'เอ็ด'; else out += D[d] + P[p]; } return out; };
  const read = (s, ed = false) => { s = s.replace(/^0+/, ''); if (!s) return ''; if (s.length > 6) return read(s.slice(0, -6)) + 'ล้าน' + rd(s.slice(-6).replace(/^0+/, ''), true); return rd(s, ed); };
  const [b, st] = n.toFixed(2).split('.');
  const bt = read(b);
  return (bt ? bt + 'บาท' : (+st ? '' : 'ศูนย์บาท')) + (+st ? read(st) + 'สตางค์' : 'ถ้วน');
}
const branchLine = sh => sh.branch_code && sh.branch_code !== '00000' ? `สาขาที่ ${esc(sh.branch_code)} ${esc(sh.branch_name || '')}` : 'สำนักงานใหญ่';
receiptHTML = function (sale, items, cust) {
  const sh = S.shop, pays = sale._payments || [{ method: sale.payment_method, amount: sale.total }];
  if (sh.receipt_size === 'A4' || sale.invoice_type === 'full') return a4HTML(sale, items, cust, pays);
  const vatOn = sh.vat_mode !== 'none';
  return `<div class="rcpt ${sh.receipt_size === '80' || sh.paper_width >= 80 ? 'w80' : ''}">
    ${sh.logo_url ? `<div class="c"><img src="${esc(sh.logo_url)}" style="max-width:60%;max-height:70px"></div>` : ''}
    <div class="c t">${esc(sh.name)}</div>
    ${sh.receipt_header ? `<div class="c">${esc(sh.receipt_header).replace(/\n/g, '<br>')}</div>` : ''}
    ${sh.address ? `<div class="c">${esc(sh.address)}</div>` : ''}${sh.phone ? `<div class="c">โทร ${esc(sh.phone)}</div>` : ''}
    ${vatOn ? `<div class="c">เลขประจำตัวผู้เสียภาษี ${esc(sh.tax_id)}<br>${branchLine(sh)}<br><b>ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ</b><br>${sh.vat_mode === 'included' ? '(VAT Included)' : ''}</div>` : `<div class="c"><b>ใบเสร็จรับเงิน</b></div>`}
    <hr><div>เลขที่ ${esc(sale.bill_no)}<br>วันที่ ${dt(sale.created_at)}<br>พนักงาน ${esc(sale.cashier_name)}</div>
    ${sale.status === 'void' ? '<div class="c t">*** ยกเลิก ***</div>' : ''}${sale.pay_status === 'pending' ? '<div class="c"><b>*** รอตรวจสอบการชำระเงิน ***</b></div>' : ''}<hr>
    <table>${items.map(l => `<tr><td colspan="2">${esc(l.name)}</td></tr><tr><td>&nbsp;${qtyf(l.qty)} x ${money(l.price)}${num(l.discount) ? ` (ลด ${money(l.discount)})` : ''}</td><td class="right">${money(l.qty * l.price - num(l.discount))}</td></tr>`).join('')}</table><hr>
    <table><tr><td>รวม ${qtyf(items.reduce((a, l) => a + num(l.qty), 0))} ชิ้น</td><td class="right">${money(sale.subtotal)}</td></tr>
    ${num(sale.discount) ? `<tr><td>ส่วนลด</td><td class="right">-${money(sale.discount)}</td></tr>` : ''}
    ${vatOn ? `<tr><td>${sh.vat_mode === 'included' ? 'มูลค่าสินค้าก่อน VAT' : 'มูลค่าสินค้า'}</td><td class="right">${money(sale.total - sale.vat)}</td></tr><tr><td>ภาษีมูลค่าเพิ่ม ${num(sh.vat_rate)}%</td><td class="right">${money(sale.vat)}</td></tr>` : ''}
    <tr><td class="t">ยอดสุทธิ</td><td class="right t">${money(sale.total)}</td></tr>
    ${pays.map(p => `<tr><td>${payName(p.method)}</td><td class="right">${money(p.method === 'cash' && num(sale.change) ? num(p.amount) + num(sale.change) : p.amount)}</td></tr>`).join('')}
    ${num(sale.change) ? `<tr><td>เงินทอน</td><td class="right">${money(sale.change)}</td></tr>` : ''}</table>
    ${cust ? `<hr><div>สมาชิก: ${esc(cust.name)}<br>แต้มที่ได้รับ: ${qtyf(sale.points_earned)} · แต้มสะสม: ${qtyf(cust.points)}${num(cust.balance) ? `<br>ยอดค้างชำระ: ${money(cust.balance)}` : ''}</div>` : ''}
    ${sale.customer_note ? `<hr><div>หมายเหตุ: ${esc(sale.customer_note)}</div>` : ''}
    <hr><div class="c">${esc(sh.receipt_footer || '').replace(/\n/g, '<br>')}</div></div>`;
};
function a4HTML(sale, items, cust, pays) {
  const sh = S.shop, full = sale.invoice_type === 'full', vatOn = sh.vat_mode !== 'none';
  const title = vatOn ? (full ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ') : 'ใบเสร็จรับเงิน';
  return `<div class="a4"><div class="hdr"><div style="display:flex;gap:12px">${sh.logo_url ? `<img src="${esc(sh.logo_url)}" style="height:64px">` : ''}<div>
      <h2>${esc(sh.name)}</h2><div>${esc(sh.address)}</div><div>${sh.phone ? 'โทร ' + esc(sh.phone) : ''}</div>
      ${vatOn ? `<div>เลขประจำตัวผู้เสียภาษี ${esc(sh.tax_id)} · ${branchLine(sh)}</div>` : ''}</div></div>
    <div style="text-align:right"><h2>${title}</h2><div>(ต้นฉบับ)</div><div>เลขที่ <b>${esc(sale.bill_no)}</b></div><div>วันที่ ${dLong(sale.created_at)}</div></div></div>
    <div class="box" style="margin-bottom:12px">${full ? `<b>ผู้ซื้อ:</b> ${esc(sale.tax_name)}<br><b>ที่อยู่:</b> ${esc(sale.tax_address)}<br><b>เลขประจำตัวผู้เสียภาษี:</b> ${esc(sale.tax_id)} · <b>สาขา:</b> ${esc(sale.tax_branch || 'สำนักงานใหญ่')}`
      : `<b>ลูกค้า:</b> ${esc(cust?.name || 'ลูกค้าทั่วไป')}`}</div>
    <table><tr><th style="width:40px">#</th><th>รายการ</th><th class="r">จำนวน</th><th class="r">ราคาต่อหน่วย</th><th class="r">ส่วนลด</th><th class="r">จำนวนเงิน</th></tr>
      ${items.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.name)}</td><td class="r">${qtyf(l.qty)} ${esc(l.unit || '')}</td><td class="r">${money(l.price)}</td><td class="r">${num(l.discount) ? money(l.discount) : '-'}</td><td class="r">${money(l.qty * l.price - num(l.discount))}</td></tr>`).join('')}
      <tr><td colspan="4" rowspan="${vatOn ? 4 : 2}" style="vertical-align:top">(${bahtText(sale.total)})<br><br>ชำระโดย: ${pays.map(p => `${payName(p.method)} ${money(p.amount)}`).join(', ')}</td><td>รวมเป็นเงิน</td><td class="r">${money(sale.subtotal)}</td></tr>
      <tr><td>ส่วนลด</td><td class="r">${money(sale.discount)}</td></tr>
      ${vatOn ? `<tr><td>มูลค่าก่อนภาษี</td><td class="r">${money(sale.total - sale.vat)}</td></tr><tr><td>ภาษีมูลค่าเพิ่ม ${num(sh.vat_rate)}%</td><td class="r">${money(sale.vat)}</td></tr>` : ''}
      <tr><th colspan="5" class="r">จำนวนเงินรวมทั้งสิ้น</th><th class="r">${money(sale.total)}</th></tr></table>
    ${sale.customer_note ? `<p>หมายเหตุ: ${esc(sale.customer_note)}</p>` : ''}
    <div style="display:flex;justify-content:space-between;margin-top:50px;text-align:center"><div>....................................<br>ผู้รับเงิน (${esc(sale.cashier_name)})</div><div>....................................<br>ผู้รับสินค้า</div></div></div>`;
}
const _showReceipt = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceipt(sale, items, cust, autoPrint);
  const mf = $$('.mbg').pop()?.querySelector('.mf');
  if (mf && !$('#shr2', mf)) { mf.insertAdjacentHTML('afterbegin', '<button class="btn" id="shr2">📤 ส่งใบเสร็จดิจิทัล</button>'); $('#shr2', mf).onclick = () => shareReceipt(sale, items); }
};
function shareReceipt(sale, items) {
  const sh = S.shop;
  const txt = `${sh.name}\nใบเสร็จ ${sale.bill_no}\n${dt(sale.created_at)}\n` + items.map(l => `${l.name} x${qtyf(l.qty)}  ${money(l.qty * l.price - num(l.discount))}`).join('\n') +
    `\n------------\nยอดสุทธิ ${baht(sale.total)}\n${sh.receipt_footer || 'ขอบคุณที่ใช้บริการ'}`;
  if (navigator.share) navigator.share({ title: 'ใบเสร็จ ' + sale.bill_no, text: txt }).catch(() => {});
  else { navigator.clipboard?.writeText(txt); toast('คัดลอกใบเสร็จแล้ว — วางใน LINE หรือแชตได้เลย', 'ok'); }
}
/* ================= INVENTORY ================= */
const MOVE = { in: ['⬆', 'รับเข้า'], out: ['⬇', 'เบิกออก'], adjust: ['⚖', 'ตรวจนับ/ปรับยอด'], sale: ['🛒', 'ขาย'], void: ['↩', 'ยกเลิกบิล'], refund: ['↩', 'รับคืนจากลูกค้า'],
  purchase: ['📥', 'รับจากใบสั่งซื้อ'], damaged: ['💔', 'สินค้าชำรุด'], expired: ['⌛', 'สินค้าหมดอายุ'], transfer_in: ['🔁', 'รับโอนจากสาขา'], transfer_out: ['🔁', 'โอนไปสาขา'], return_supplier: ['🚚', 'คืนผู้จำหน่าย'] };
VIEWS.stock = pg => {
  let tab = 'list';
  $('#tact').innerHTML = `<button class="btn p" id="rcv">+ รับสินค้าเข้า</button>${S.shops.length > 1 ? '<button class="btn" id="trf">🔁 โอนระหว่างสาขา</button>' : ''}<button class="btn" id="cnt">📋 ตรวจนับสต็อก</button>`;
  const render = async () => {
    const sp = S.products.filter(p => p.track_stock && p.active);
    const val = sp.reduce((a, p) => a + Math.max(0, p.stock) * p.cost, 0), retail = sp.reduce((a, p) => a + Math.max(0, p.stock) * p.price, 0);
    const low = sp.filter(p => p.stock > 0 && p.stock <= p.low_stock), out = sp.filter(p => p.stock <= 0);
    const soon = S.products.filter(p => p.expiry_date && new Date(p.expiry_date) - Date.now() < 30 * 864e5).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
    const over = sp.filter(p => num(p.max_stock) > 0 && p.stock > p.max_stock);
    const box = pg.querySelector('#stk') || (pg.querySelector('.skel')?.remove(), pg.insertAdjacentHTML('beforeend', '<div id="stk"></div>'), pg.querySelector('#stk'));
    box.innerHTML = `<div class="stats">
        ${canDo('view_profit') ? `<div class="stat"><div class="k">มูลค่าสต็อก (ราคาทุน)</div><div class="v">${baht(val)}</div></div>` : ''}
        <div class="stat"><div class="k">มูลค่าสต็อก (ราคาขาย)</div><div class="v">${baht(retail)}</div></div>
        <div class="stat"><div class="k">สินค้าที่ติดตามสต็อก</div><div class="v">${sp.length}</div></div>
        <div class="stat"><div class="k">ใกล้หมด</div><div class="v" style="color:var(--warn)">${low.length}</div></div>
        <div class="stat"><div class="k">หมดสต็อก</div><div class="v" style="color:var(--bad)">${out.length}</div></div>
        <div class="stat"><div class="k">ใกล้หมดอายุ (30 วัน)</div><div class="v" style="color:var(--warn)">${soon.length}</div></div></div>
      <div class="tabs">${[['list', 'คลังสินค้า'], ['low', `ใกล้หมด/หมด (${low.length + out.length})`], ['exp', `ใกล้หมดอายุ (${soon.length})`], ['over', `เกินสต็อกสูงสุด (${over.length})`], ['hist', 'ประวัติความเคลื่อนไหว']]
        .map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}
        <div class="sbox" style="max-width:260px;margin-left:auto"><span>🔍</span><input class="in" id="ss" placeholder="ค้นหาสินค้า"></div></div><div id="sbody"></div>`;
    $$('[data-t]', box).forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    const draw = async () => {
      const v = $('#ss').value.toLowerCase();
      if (tab === 'hist') {
        const mv = await q(sb.from('stock_moves').select('*, supplier:suppliers(name)').eq('shop_id', S.shop.id).order('created_at', { ascending: false }).limit(400));
        $('#sbody').innerHTML = `<div class="tblwrap"><table class="tbl"><tr><th>วันเวลา</th><th>สินค้า</th><th>ประเภท</th><th class="right">จำนวน</th><th class="right">ต้นทุน</th><th>อ้างอิง / หมายเหตุ</th></tr>
          ${mv.filter(r => !v || r.product_name.toLowerCase().includes(v)).map(r => `<tr><td>${dt(r.created_at)}</td><td>${esc(r.product_name)}</td><td>${(MOVE[r.kind] || ['', r.kind]).join(' ')}</td>
          <td class="right b" style="color:${r.qty < 0 ? 'var(--bad)' : 'var(--ok)'}">${r.qty > 0 ? '+' : ''}${qtyf(r.qty)}</td><td class="right">${money(r.cost)}</td><td>${esc([r.ref, r.supplier?.name, r.note].filter(Boolean).join(' · '))}</td></tr>`).join('')}</table></div>`;
        return;
      }
      const src = tab === 'low' ? [...out, ...low] : tab === 'exp' ? soon : tab === 'over' ? over : sp;
      const list = src.filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v));
      $('#sbody').innerHTML = list.length ? `<div class="tblwrap"><table class="tbl"><tr><th>สินค้า</th><th class="right">คงเหลือ</th><th class="right">ขั้นต่ำ/สูงสุด</th>${tab === 'exp' ? '<th>วันหมดอายุ</th>' : ''}${canDo('view_profit') ? '<th class="right">ต้นทุน</th><th class="right">มูลค่า</th>' : ''}<th></th></tr>
        ${list.slice(0, 400).map(p => `<tr><td><b>${esc(p.name)}</b><br><small class="muted">${esc(p.barcode)}${p.lot_no ? ' · ล็อต ' + esc(p.lot_no) : ''}</small></td>
          <td class="right"><span class="chip ${p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'}">${qtyf(p.stock)} ${esc(p.unit)}</span></td><td class="right muted">${qtyf(p.low_stock)} / ${num(p.max_stock) ? qtyf(p.max_stock) : '-'}</td>
          ${tab === 'exp' ? `<td><span class="chip ${new Date(p.expiry_date) < Date.now() ? 'bad' : 'warn'}">${dOnly(p.expiry_date)}</span></td>` : ''}
          ${canDo('view_profit') ? `<td class="right">${money(p.cost)}</td><td class="right">${money(Math.max(0, p.stock) * p.cost)}</td>` : ''}
          <td class="right" style="white-space:nowrap"><button class="btn sm ok" data-k="in" data-id="${p.id}">+ รับเข้า</button> <button class="btn sm" data-k="out" data-id="${p.id}">− เบิก</button>
            <button class="btn sm" data-k="damaged" data-id="${p.id}">💔 ชำรุด</button> <button class="btn sm" data-k="expired" data-id="${p.id}">⌛ หมดอายุ</button> <button class="btn sm" data-k="adjust" data-id="${p.id}">⚖ นับ</button></td></tr>`).join('')}</table></div>`
        : `<div class="empty">ไม่มีรายการ</div>`;
      $$('[data-k]', box).forEach(b => b.onclick = () => stockForm(S.products.find(p => p.id === b.dataset.id), b.dataset.k, render));
    };
    $('#ss').oninput = draw; await draw();
  };
  $('#rcv').onclick = () => productPicker('รับสินค้าเข้า', p => stockForm(p, 'in', render));
  if ($('#trf')) $('#trf').onclick = () => transferDialog(render);
  $('#cnt').onclick = () => stockCountSheet(render);
  render().catch(fail);
};
function productPicker(title, onPick, filter = p => p.track_stock) {
  const m = modal(title, `<div class="sbox"><span>🔍</span><input class="in" id="pp" placeholder="ค้นหาหรือสแกนบาร์โค้ด…"><button class="btn sm" id="ppScan">📷</button></div><div id="pl" style="margin-top:10px"></div>`);
  const d = () => { const v = $('#pp', m).value.toLowerCase(); const list = S.products.filter(p => filter(p) && (!v || p.name.toLowerCase().includes(v) || p.barcode === v)).slice(0, 50);
    $('#pl', m).innerHTML = `<table class="rtable">${list.map(p => `<tr class="click" data-id="${p.id}" style="cursor:pointer"><td>${esc(p.name)}</td><td class="right muted">${qtyf(p.stock)} ${esc(p.unit)}</td></tr>`).join('')}</table>`;
    $$('[data-id]', m).forEach(r => r.onclick = () => { m.close(); onPick(S.products.find(p => p.id === r.dataset.id)); }); };
  $('#pp', m).oninput = d; d(); setTimeout(() => $('#pp', m).focus(), 60);
  $('#pp', m).onkeydown = e => { if (e.key === 'Enter') { const hit = S.products.find(p => p.barcode === $('#pp', m).value.trim()); if (hit) { m.close(); onPick(hit); } } };
  $('#ppScan', m).onclick = () => scanBarcode(code => { const hit = S.products.find(p => p.barcode === code); if (hit) { m.close(); onPick(hit); } else toast('ไม่พบสินค้าที่ค้นหา', 'bad'); });
}
stockForm = function (p, kind, after) {
  const L = { in: 'รับสินค้าเข้า', out: 'เบิกสินค้าออก', damaged: 'ตัดสต็อก — สินค้าชำรุด', expired: 'ตัดสต็อก — สินค้าหมดอายุ', adjust: 'ตรวจนับ / ปรับยอดสต็อก' }[kind];
  formModal(`${L} · ${p.name}`, [
    { k: 'qty', label: kind === 'adjust' ? `จำนวนที่นับได้จริง (ในระบบ ${qtyf(p.stock)} ${p.unit})` : `จำนวน (${p.unit})`, type: 'number', req: true },
    ...(kind === 'in' ? [{ k: 'cost', label: 'ต้นทุนต่อหน่วย', type: 'number', def: p.cost }, { k: 'supplier', label: 'ผู้จำหน่าย', type: 'select', opts: [['', '—'], ...S.suppliers.map(s => [s.id, s.name])] },
      { k: 'expiry', label: 'วันหมดอายุ (ถ้ามี)', type: 'date' }, { k: 'lot', label: 'เลขล็อต (ถ้ามี)' }] : []),
    { k: 'note', label: 'หมายเหตุ', full: true }], {}, async o => {
      if (!(num(o.qty) > 0) && kind !== 'adjust') throw new Error('กรุณากรอกจำนวนให้ถูกต้อง');
      await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: p.id, p_kind: kind, p_qty: num(o.qty), p_cost: kind === 'in' ? num(o.cost) : null, p_supplier: o.supplier || null, p_note: o.note || '' }));
      if (kind === 'in' && (o.expiry || o.lot)) await q(sb.from('products').update({ ...(o.expiry ? { expiry_date: o.expiry } : {}), ...(o.lot ? { lot_no: o.lot } : {}) }).eq('id', p.id));
      Object.assign(p, await q(sb.from('products').select('*').eq('id', p.id).single()));
      after?.();
    });
};
function stockCountSheet(after) {
  const list = S.products.filter(p => p.track_stock && p.active);
  const m = modal('ตรวจนับสต็อก', `<p class="muted" style="margin-top:0">กรอกเฉพาะรายการที่นับแล้ว — ระบบจะปรับยอดและบันทึกประวัติให้</p>
    <div class="sbox" style="margin-bottom:10px"><span>🔍</span><input class="in" id="cs"></div><div id="cl" style="max-height:55vh;overflow:auto"></div>`,
    { wide: true, foot: `<span class="muted" id="cn"></span><span style="flex:1"></span><button class="btn p" id="csave">บันทึกการตรวจนับ</button>` });
  const counted = {};
  const d = () => { const v = $('#cs', m).value.toLowerCase();
    $('#cl', m).innerHTML = `<table class="rtable"><tr><th>สินค้า</th><th class="right">ในระบบ</th><th class="right">นับได้</th><th class="right">ส่วนต่าง</th></tr>${list.filter(p => !v || p.name.toLowerCase().includes(v) || p.barcode === v).slice(0, 200).map(p =>
      `<tr><td>${esc(p.name)}</td><td class="right">${qtyf(p.stock)}</td><td class="right"><input class="in" style="width:100px;text-align:right" type="number" step="any" inputmode="decimal" data-c="${p.id}" value="${counted[p.id] ?? ''}"></td><td class="right" id="df${p.id}">${counted[p.id] !== undefined ? qtyf(counted[p.id] - p.stock) : ''}</td></tr>`).join('')}</table>`;
    $$('[data-c]', m).forEach(i => i.oninput = () => { if (i.value === '') delete counted[i.dataset.c]; else counted[i.dataset.c] = num(i.value);
      const p = S.products.find(x => x.id === i.dataset.c); $('#df' + p.id, m).textContent = i.value === '' ? '' : qtyf(num(i.value) - p.stock); $('#cn', m).textContent = `นับแล้ว ${Object.keys(counted).length} รายการ`; }); };
  $('#cs', m).oninput = d; d();
  $('#csave', m).onclick = async () => {
    const ids = Object.keys(counted).filter(id => counted[id] !== S.products.find(p => p.id === id).stock);
    if (!ids.length) return toast('ไม่มีรายการที่ต้องปรับยอด', 'ok');
    if (!await confirmBox(`ปรับยอดสต็อก ${ids.length} รายการ?`)) return;
    $('#csave', m).disabled = true;
    try { for (const id of ids) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: id, p_kind: 'adjust', p_qty: counted[id], p_cost: null, p_supplier: null, p_note: 'ตรวจนับสต็อก' })); S.products.find(p => p.id === id).stock = counted[id]; }
      toast('บันทึกข้อมูลเรียบร้อยแล้ว', 'ok'); m.close(); after?.(); } catch (e) { $('#csave', m).disabled = false; fail(e); }
  };
}
function transferDialog(after) {
  const others = S.shops.filter(s => s.id !== S.shop.id); const lines = [];
  const m = modal('โอนสินค้าระหว่างสาขา', `<div class="fg"><label class="f">โอนไปที่สาขา</label><select class="in" id="tto">${others.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
    <div id="tl"></div><button class="btn sm" id="tadd">➕ เพิ่มสินค้า</button><div class="fg" style="margin-top:12px"><label class="f">หมายเหตุ</label><input class="in" id="tnote"></div>`,
    { foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="tgo">🔁 ยืนยันการโอน</button>` });
  const d = () => { $('#tl', m).innerHTML = lines.map((l, i) => `<div class="split-row"><span>${esc(l.p.name)} <small class="muted">(มี ${qtyf(l.p.stock)})</small></span><input class="in" type="number" step="any" data-q="${i}" value="${l.qty}"><button class="btn sm bad" data-x="${i}">×</button></div>`).join('');
    $$('[data-q]', m).forEach(x => x.oninput = () => { lines[+x.dataset.q].qty = num(x.value); }); $$('[data-x]', m).forEach(x => x.onclick = () => { lines.splice(+x.dataset.x, 1); d(); }); };
  $('#tadd', m).onclick = () => productPicker('เลือกสินค้าที่จะโอน', p => { lines.push({ p, qty: 1 }); d(); });
  $('[data-c]', m).onclick = m.close;
  $('#tgo', m).onclick = async () => {
    if (!lines.length) return toast('กรุณาเพิ่มสินค้า', 'bad');
    try { const n = await q(sb.rpc('transfer_stock', { p_from: S.shop.id, p_to: $('#tto', m).value, p_items: lines.map(l => ({ product_id: l.p.id, qty: l.qty })), p_note: $('#tnote', m).value }));
      toast(`โอนสินค้าแล้ว ${n} รายการ`, 'ok'); m.close(); await loadMaster(); after?.(); } catch (e) { fail(e); }
  };
}

/* ================= PURCHASING ================= */
const PO_ST = { draft: ['', 'ร่าง'], ordered: ['info', 'สั่งซื้อแล้ว'], received: ['ok', 'รับสินค้าแล้ว'], cancelled: ['bad', 'ยกเลิก'] };
VIEWS.purchases = async pg => {
  $('#tact').innerHTML = `<button class="btn p" id="poNew">+ สร้างใบสั่งซื้อ</button>`;
  const rows = await q(sb.from('purchases').select('*, supplier:suppliers(name)').eq('shop_id', S.shop.id).order('created_at', { ascending: false }).limit(300));
  const owe = rows.filter(r => r.status === 'received').reduce((a, r) => a + num(r.total) - num(r.paid), 0);
  pg.querySelector('.skel')?.remove(), pg.insertAdjacentHTML('beforeend', `<div class="stats"><div class="stat"><div class="k">ใบสั่งซื้อทั้งหมด</div><div class="v">${rows.length}</div></div>
    <div class="stat"><div class="k">รอรับสินค้า</div><div class="v" style="color:var(--info)">${rows.filter(r => r.status === 'ordered').length}</div></div>
    <div class="stat"><div class="k">ค้างชำระผู้จำหน่าย</div><div class="v" style="color:var(--bad)">${baht(owe)}</div></div></div>
    ${rows.length ? `<div class="tblwrap"><table class="tbl"><tr><th>เลขที่</th><th>วันที่</th><th>ผู้จำหน่าย</th><th>เลขใบแจ้งหนี้</th><th class="right">ยอดรวม</th><th class="right">ชำระแล้ว</th><th>สถานะ</th></tr>
    ${rows.map(r => `<tr class="click" data-id="${r.id}"><td><b>${esc(r.po_no)}</b></td><td>${dOnly(r.created_at)}</td><td>${esc(r.supplier?.name || '-')}</td><td>${esc(r.invoice_no)}</td>
      <td class="right b">${baht(r.total)}</td><td class="right">${baht(r.paid)}</td><td><span class="chip ${PO_ST[r.status][0]}">${PO_ST[r.status][1]}</span></td></tr>`).join('')}</table></div>`
    : `<div class="empty">ยังไม่มีใบสั่งซื้อ — กด “สร้างใบสั่งซื้อ” เพื่อเริ่ม</div>`}`);
  $$('[data-id]', pg).forEach(tr => tr.onclick = () => poDetail(rows.find(r => r.id === tr.dataset.id)));
  $('#poNew').onclick = () => poForm();
};
function poForm() {
  const lines = [];
  const m = modal('สร้างใบสั่งซื้อ', `<div class="grid2"><div class="fg"><label class="f">ผู้จำหน่าย *</label><select class="in" id="poS"><option value="">— เลือก —</option>${S.suppliers.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
    <div class="fg"><label class="f">เลขที่ใบแจ้งหนี้ / ใบส่งของ</label><input class="in" id="poI"></div></div>
    <div id="poL"></div><div class="row"><button class="btn sm" id="poAdd">➕ เพิ่มสินค้า</button><button class="btn sm" id="poLow">⚠️ เพิ่มสินค้าที่ใกล้หมดทั้งหมด</button></div>
    <div class="fg" style="margin-top:12px"><label class="f">หมายเหตุ</label><input class="in" id="poN"></div><div class="tline big"><span>ยอดรวม</span><span id="poT">฿0.00</span></div>`,
    { wide: true, foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn" id="poDraft">บันทึกร่าง</button><button class="btn p" id="poSave">บันทึกและสั่งซื้อ</button>` });
  const d = () => { $('#poL', m).innerHTML = lines.length ? `<table class="rtable"><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ต้นทุน/หน่วย</th><th class="right">รวม</th><th></th></tr>${lines.map((l, i) =>
      `<tr><td>${esc(l.p.name)}<br><small class="muted">คงเหลือ ${qtyf(l.p.stock)}</small></td><td class="right"><input class="in" style="width:90px;text-align:right" type="number" step="any" data-q="${i}" value="${l.qty}"></td>
      <td class="right"><input class="in" style="width:100px;text-align:right" type="number" step="any" data-k="${i}" value="${l.cost}"></td><td class="right">${money(l.qty * l.cost)}</td><td><button class="btn sm bad" data-x="${i}">×</button></td></tr>`).join('')}</table>` : '<p class="muted">ยังไม่มีสินค้า</p>';
    $('#poT', m).textContent = baht(lines.reduce((a, l) => a + l.qty * l.cost, 0));
    $$('[data-q]', m).forEach(x => x.onchange = () => { lines[+x.dataset.q].qty = num(x.value); d(); });
    $$('[data-k]', m).forEach(x => x.onchange = () => { lines[+x.dataset.k].cost = num(x.value); d(); });
    $$('[data-x]', m).forEach(x => x.onclick = () => { lines.splice(+x.dataset.x, 1); d(); }); };
  $('#poAdd', m).onclick = () => productPicker('เพิ่มสินค้าในใบสั่งซื้อ', p => { lines.push({ p, qty: Math.max(1, num(p.max_stock) - p.stock) || 1, cost: num(p.cost) }); d(); }, () => true);
  $('#poLow', m).onclick = () => { S.products.filter(p => p.track_stock && p.active && p.stock <= p.low_stock && !lines.some(l => l.p.id === p.id)).forEach(p => lines.push({ p, qty: Math.max(1, (num(p.max_stock) || num(p.low_stock) * 2) - p.stock), cost: num(p.cost) })); d(); };
  $('[data-c]', m).onclick = m.close;
  const save = async status => {
    if (!$('#poS', m).value) return toast('กรุณาเลือกผู้จำหน่าย', 'bad'); if (!lines.length) return toast('กรุณาเพิ่มสินค้า', 'bad');
    try {
      const no = await q(sb.rpc('doc_no', { p_shop: S.shop.id, p_prefix: 'PO', p_table: 'purchases' }));
      const po = await q(sb.from('purchases').insert({ shop_id: S.shop.id, po_no: no, supplier_id: $('#poS', m).value, invoice_no: $('#poI', m).value, note: $('#poN', m).value, status,
        total: r2(lines.reduce((a, l) => a + l.qty * l.cost, 0)), user_id: S.user.id, user_name: S.user.user_metadata?.full_name || S.user.email }).select().single());
      await q(sb.from('purchase_items').insert(lines.map(l => ({ purchase_id: po.id, shop_id: S.shop.id, product_id: l.p.id, name: l.p.name, qty: l.qty, cost: l.cost }))));
      m.close(); toast('บันทึกข้อมูลเรียบร้อยแล้ว', 'ok'); go('purchases');
    } catch (e) { fail(e); }
  };
  $('#poDraft', m).onclick = () => save('draft'); $('#poSave', m).onclick = () => save('ordered');
  d();
}
async function poDetail(po) {
  const items = await q(sb.from('purchase_items').select('*').eq('purchase_id', po.id));
  const pays = await q(sb.from('supplier_payments').select('*').eq('purchase_id', po.id).order('created_at'));
  const m = modal(`ใบสั่งซื้อ ${po.po_no}`, `<div class="row" style="margin-bottom:10px"><span class="chip ${PO_ST[po.status][0]}">${PO_ST[po.status][1]}</span><span class="muted">${esc(po.supplier?.name || '')} · ${dLong(po.created_at)}${po.invoice_no ? ' · ใบแจ้งหนี้ ' + esc(po.invoice_no) : ''}</span></div>
    <table class="rtable"><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ต้นทุน</th><th class="right">รวม</th></tr>${items.map(i => `<tr><td>${esc(i.name)}</td><td class="right">${qtyf(i.qty)}</td><td class="right">${money(i.cost)}</td><td class="right">${money(i.qty * i.cost)}</td></tr>`).join('')}</table>
    <div class="kv" style="margin-top:12px"><span>ยอดรวม</span><b>${baht(po.total)}</b><span>ชำระแล้ว</span><b>${baht(po.paid)}</b><span>คงค้าง</span><b style="color:var(--bad)">${baht(num(po.total) - num(po.paid))}</b></div>
    ${pays.length ? `<p class="section-title">การชำระเงิน</p>${pays.map(p => `<div class="tline"><span>${dt(p.created_at)} · ${payName(p.method)} ${esc(p.note)}</span><b>${baht(p.amount)}</b></div>`).join('')}` : ''}`,
    { wide: true, foot: `${['draft', 'ordered'].includes(po.status) ? `<button class="btn bad" id="poX">ยกเลิกใบสั่งซื้อ</button><span style="flex:1"></span><button class="btn ok" id="poR">📥 รับสินค้าเข้าสต็อก</button>` : '<span style="flex:1"></span>'}
      ${po.status !== 'cancelled' && num(po.total) - num(po.paid) > 0 ? `<button class="btn" id="poP">💸 ชำระเงิน</button>` : ''}<button class="btn" id="poPr">🖨️ พิมพ์</button>` });
  if ($('#poR', m)) $('#poR', m).onclick = async () => { if (!await confirmBox('รับสินค้าทั้งหมดเข้าสต็อก? ต้นทุนเฉลี่ยจะถูกคำนวณใหม่')) return; try { await q(sb.rpc('receive_purchase', { p_purchase: po.id })); toast('รับสินค้าเข้าสต็อกแล้ว', 'ok'); m.close(); await loadMaster(); go('purchases'); } catch (e) { fail(e); } };
  if ($('#poX', m)) $('#poX', m).onclick = async () => { if (!await confirmBox('ยกเลิกใบสั่งซื้อนี้หรือไม่?')) return; try { await q(sb.from('purchases').update({ status: 'cancelled' }).eq('id', po.id)); m.close(); go('purchases'); } catch (e) { fail(e); } };
  if ($('#poP', m)) $('#poP', m).onclick = () => formModal('ชำระเงินผู้จำหน่าย', [{ k: 'amount', label: 'จำนวนเงิน', type: 'number', req: true, def: r2(num(po.total) - num(po.paid)) },
    { k: 'method', label: 'ช่องทาง', type: 'select', opts: ['transfer', 'cash', 'promptpay', 'credit_card'].map(k => [k, payName(k)]) }, { k: 'note', label: 'หมายเหตุ', full: true }], {}, async o => {
      await q(sb.rpc('pay_supplier', { p_shop: S.shop.id, p_supplier: po.supplier_id, p_purchase: po.id, p_amount: num(o.amount), p_method: o.method, p_note: o.note })); m.close(); go('purchases'); });
  $('#poPr', m).onclick = () => printReceipt(`<div class="a4"><div class="hdr"><div><h2>${esc(S.shop.name)}</h2><div>${esc(S.shop.address)}</div><div>เลขประจำตัวผู้เสียภาษี ${esc(S.shop.tax_id)}</div></div><div style="text-align:right"><h2>ใบสั่งซื้อ</h2><div>เลขที่ ${esc(po.po_no)}</div><div>วันที่ ${dLong(po.created_at)}</div></div></div>
    <div class="box">ผู้จำหน่าย: <b>${esc(po.supplier?.name || '')}</b></div><br><table><tr><th>#</th><th>รายการ</th><th class="r">จำนวน</th><th class="r">ราคาต่อหน่วย</th><th class="r">จำนวนเงิน</th></tr>
    ${items.map((i, k) => `<tr><td>${k + 1}</td><td>${esc(i.name)}</td><td class="r">${qtyf(i.qty)}</td><td class="r">${money(i.cost)}</td><td class="r">${money(i.qty * i.cost)}</td></tr>`).join('')}
    <tr><th colspan="4" class="r">รวมทั้งสิ้น (${bahtText(po.total)})</th><th class="r">${money(po.total)}</th></tr></table><div style="margin-top:50px;text-align:right">....................................<br>ผู้สั่งซื้อ</div></div>`);
}

/* ================= CUSTOMERS (CRM) ================= */
VIEWS.members = pg => {
  const draw = crudPage(pg, { table: 'customers', title: 'ลูกค้า', list: () => S.customers,
    rowExtra: rows => `<div class="stats"><div class="stat"><div class="k">ลูกค้าทั้งหมด</div><div class="v">${rows.length}</div></div>
      <div class="stat"><div class="k">ยอดค้างชำระรวม</div><div class="v" style="color:var(--bad)">${baht(rows.reduce((a, r) => a + Math.max(0, num(r.balance)), 0))}</div></div>
      <div class="stat"><div class="k">แต้มสะสมรวม</div><div class="v">${qtyf(rows.reduce((a, r) => a + num(r.points), 0))}</div></div></div>`,
    cols: [{ l: 'ชื่อ', f: r => `<b>${esc(r.name)}</b>${r.group_name ? ` <span class="chip">${esc(r.group_name)}</span>` : ''}${r.level ? ` <span class="chip info">${esc(r.level)}</span>` : ''}<br><small class="muted">${esc(r.phone)}</small>` },
      { l: 'แต้ม', r: 1, f: r => qtyf(r.points) }, { l: 'ยอดซื้อสะสม', r: 1, f: r => money(r.total_spent) }, { l: 'ค้างชำระ', r: 1, f: r => num(r.balance) > 0 ? `<b style="color:var(--bad)">${money(r.balance)}</b>` : '-' },
      { l: 'ซื้อล่าสุด', f: r => r.last_purchase_at ? dOnly(r.last_purchase_at) : '-' }, { l: '', f: r => `<button class="btn sm" data-h="${r.id}">ประวัติ</button>` }],
    fields: customerFields() });
  pg.addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (b) { e.stopPropagation(); customerDetail(S.customers.find(c => c.id === b.dataset.h), draw); } }, true);
};
function customerFields() {
  return [{ k: 'name', label: 'ชื่อ-นามสกุล / ชื่อบริษัท', req: true, full: true }, { k: 'phone', label: 'เบอร์โทร', type: 'tel' },
    { k: 'ctype', label: 'ประเภทลูกค้า', type: 'select', opts: [['individual', 'บุคคลทั่วไป'], ['company', 'นิติบุคคล / บริษัท'], ['wholesale', 'ลูกค้าขายส่ง']] },
    { k: 'tax_id', label: 'เลขประจำตัวผู้เสียภาษี' }, { k: 'tax_branch', label: 'สาขา (สำหรับใบกำกับภาษี)', def: 'สำนักงานใหญ่' },
    { k: 'address', label: 'ที่อยู่', full: true }, { k: 'group_name', label: 'กลุ่มลูกค้า' }, { k: 'level', label: 'ระดับสมาชิก (เช่น Silver, Gold)' },
    { k: 'discount_pct', label: 'ส่วนลดสมาชิก (%)', type: 'number', def: 0 }, { k: 'credit_limit', label: 'วงเงินเครดิต (0 = ไม่จำกัด)', type: 'number', def: 0 },
    { k: 'points', label: 'แต้มสะสม', type: 'number', def: 0 }, { k: 'note', label: 'หมายเหตุ', full: true }];
}
memberForm = function (v, after) {
  formModal(v.id ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า', customerFields(), v, async o => {
    const row = await q(v.id ? sb.from('customers').update(o).eq('id', v.id).select().single() : sb.from('customers').insert({ ...o, shop_id: S.shop.id }).select().single());
    const i = S.customers.findIndex(c => c.id === row.id); if (i >= 0) S.customers[i] = row; else S.customers.push(row);
    after?.(row);
  });
};
async function customerDetail(c, after) {
  const [sales, pays] = await Promise.all([q(sb.from('sales').select('id,bill_no,total,status,created_at,payment_method').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(100)),
    q(sb.from('customer_payments').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(50))]);
  const m = modal(c.name, `<div class="kv"><span>เบอร์โทร</span><b>${esc(c.phone || '-')}</b><span>เลขผู้เสียภาษี</span><b>${esc(c.tax_id || '-')}</b><span>แต้มสะสม</span><b>${qtyf(c.points)}</b>
      <span>ยอดซื้อสะสม</span><b>${baht(c.total_spent)}</b><span>จำนวนครั้ง</span><b>${c.visits}</b><span>ค้างชำระ</span><b style="color:var(--bad)">${baht(c.balance)}</b></div>
    <p class="section-title">ประวัติการซื้อ</p><table class="rtable">${sales.map(s => `<tr><td>${esc(s.bill_no)}</td><td>${dt(s.created_at)}</td><td>${payName(s.payment_method)}</td><td class="right">${baht(s.total)}</td><td>${statusChip(s)}</td></tr>`).join('') || '<tr><td class="muted">ยังไม่มีการซื้อ</td></tr>'}</table>
    ${pays.length ? `<p class="section-title">การชำระหนี้</p>${pays.map(p => `<div class="tline"><span>${dt(p.created_at)} · ${payName(p.method)}</span><b>${baht(p.amount)}</b></div>`).join('')}` : ''}`,
    { wide: true, foot: num(c.balance) > 0 ? `<button class="btn ok" id="cpay">💵 รับชำระหนี้</button>` : '' });
  if ($('#cpay', m)) $('#cpay', m).onclick = () => formModal('รับชำระหนี้ — ' + c.name, [{ k: 'amount', label: 'จำนวนเงิน', type: 'number', req: true, def: c.balance },
    { k: 'method', label: 'ช่องทาง', type: 'select', opts: ['cash', 'transfer', 'promptpay'].map(k => [k, payName(k)]) }, { k: 'note', label: 'หมายเหตุ' }], {}, async o => {
      await q(sb.rpc('customer_pay', { p_customer: c.id, p_amount: num(o.amount), p_method: o.method, p_note: o.note, p_shift: S.shift?.id || null }));
      c.balance = num(c.balance) - num(o.amount); m.close(); after?.(); });
}

/* ================= SUPPLIERS ================= */
VIEWS.suppliers = pg => crudPage(pg, { table: 'suppliers', title: 'ผู้จำหน่าย', list: () => S.suppliers,
  cols: [{ l: 'ชื่อ', f: r => `<b>${esc(r.name)}</b><br><small class="muted">${esc(r.tax_id || '')}</small>` }, { l: 'ผู้ติดต่อ', k: 'contact' }, { l: 'เบอร์โทร', k: 'phone' },
    { l: 'ยอดค้างชำระ', r: 1, f: r => num(r.balance) > 0 ? `<b style="color:var(--bad)">${money(r.balance)}</b>` : '-' }],
  fields: [{ k: 'name', label: 'ชื่อผู้จำหน่าย / บริษัท', req: true, full: true }, { k: 'contact', label: 'ผู้ติดต่อ' }, { k: 'phone', label: 'เบอร์โทร', type: 'tel' },
    { k: 'tax_id', label: 'เลขประจำตัวผู้เสียภาษี' }, { k: 'address', label: 'ที่อยู่', full: true }, { k: 'note', label: 'หมายเหตุ', full: true }] });

/* ================= EXPENSES ================= */
const EXP_CATS = ['ค่าเช่าร้าน', 'ค่าไฟฟ้า', 'ค่าน้ำ', 'ค่าแรง / เงินเดือน', 'ค่าขนส่ง', 'ค่าวัตถุดิบ', 'ค่าอุปกรณ์', 'ค่าการตลาด', 'ค่าโทรศัพท์ / อินเทอร์เน็ต', 'ค่าใช้จ่ายอื่น ๆ'];
VIEWS.expenses = async pg => {
  S.expenses = await fetchAll(() => sb.from('expenses').select('*').eq('shop_id', S.shop.id).order('spent_on', { ascending: false }));
  const approver = can('owner', 'manager') || S.role === 'accountant';
  $('#tact').innerHTML = `<button class="btn p" id="eAdd">+ เพิ่มค่าใช้จ่าย</button><button class="btn" id="eX">⬇ CSV</button>`;
  const draw = () => {
    const m0 = ymd(new Date()).slice(0, 7), month = S.expenses.filter(r => (r.spent_on || '').startsWith(m0) && r.status !== 'pending');
    const byCat = {}; month.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + num(r.amount); });
    const box = pg.querySelector('#ex') || (pg.querySelector('.skel')?.remove(), pg.insertAdjacentHTML('beforeend', '<div id="ex"></div>'), pg.querySelector('#ex'));
    box.innerHTML = `<div class="stats"><div class="stat"><div class="k">ค่าใช้จ่ายเดือนนี้</div><div class="v" style="color:var(--bad)">${baht(month.reduce((a, r) => a + num(r.amount), 0))}</div></div>
      <div class="stat"><div class="k">รออนุมัติ</div><div class="v" style="color:var(--warn)">${S.expenses.filter(r => r.status === 'pending').length}</div></div></div>
      ${Object.keys(byCat).length ? `<div class="card" style="margin-bottom:14px"><b>สรุปเดือนนี้ตามหมวด</b>${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="tline"><span>${esc(k)}</span><b>${baht(v)}</b></div>`).join('')}</div>` : ''}
      ${S.expenses.length ? `<div class="tblwrap"><table class="tbl"><tr><th>วันที่</th><th>หมวด</th><th>รายละเอียด</th><th>ชำระโดย</th><th>ผู้บันทึก</th><th class="right">จำนวนเงิน</th><th>สถานะ</th></tr>
      ${S.expenses.map(r => `<tr class="click" data-id="${r.id}"><td>${dOnly(r.spent_on)}</td><td>${esc(r.category)}</td><td>${esc(r.note)}${r.receipt_url ? ' 📎' : ''}</td><td>${payName(r.payment_method)}</td><td>${esc(r.user_name)}</td>
        <td class="right b">${money(r.amount)}</td><td>${r.status === 'pending' ? `<span class="chip warn">รออนุมัติ</span>${approver ? ` <button class="btn sm ok" data-ap="${r.id}">อนุมัติ</button>` : ''}` : '<span class="chip ok">อนุมัติแล้ว</span>'}</td></tr>`).join('')}</table></div>`
      : '<div class="empty">ยังไม่มีค่าใช้จ่าย</div>'}`;
    $$('[data-ap]', box).forEach(b => b.onclick = async e => { e.stopPropagation(); try { await q(sb.from('expenses').update({ status: 'approved', approved_by: S.user.id }).eq('id', b.dataset.ap)); S.expenses.find(x => x.id === b.dataset.ap).status = 'approved'; draw(); } catch (er) { fail(er); } });
    $$('[data-id]', box).forEach(tr => tr.onclick = () => expenseForm(S.expenses.find(x => x.id === tr.dataset.id), draw));
  };
  $('#eAdd').onclick = () => expenseForm({}, draw);
  $('#eX').onclick = () => download('expenses.csv', toCSV(S.expenses, ['spent_on', 'category', 'note', 'payment_method', 'amount', 'status', 'user_name', 'receipt_url']));
  draw();
};
function expenseForm(v, after) {
  const approver = can('owner', 'manager') || S.role === 'accountant';
  const m = formModal(v.id ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าใช้จ่าย', [
    { k: 'spent_on', label: 'วันที่', type: 'date', req: true, def: ymd(new Date()) }, { k: 'category', label: 'หมวดค่าใช้จ่าย', type: 'select', opts: EXP_CATS.map(c => [c, c]) },
    { k: 'amount', label: 'จำนวนเงิน (บาท)', type: 'number', req: true }, { k: 'payment_method', label: 'ชำระโดย', type: 'select', opts: ['cash', 'transfer', 'promptpay', 'credit_card'].map(k => [k, payName(k)]) },
    { k: 'note', label: 'รายละเอียด', full: true }, { k: 'receipt_url', label: 'ใบเสร็จ / หลักฐาน', full: true, after: `<button type="button" class="btn sm" id="eUp" style="margin-top:6px">📎 แนบรูปใบเสร็จ</button>` }],
    { category: EXP_CATS[0], payment_method: 'cash', ...v }, async o => {
      if (!(num(o.amount) > 0)) throw new Error('ยอดเงินไม่ถูกต้อง');
      const rec = { ...o, amount: num(o.amount) };
      if (!v.id) Object.assign(rec, { shop_id: S.shop.id, user_id: S.user.id, user_name: S.user.user_metadata?.full_name || S.user.email, status: approver ? 'approved' : 'pending', shift_id: o.payment_method === 'cash' ? S.shift?.id || null : null });
      const row = await q(v.id ? sb.from('expenses').update(rec).eq('id', v.id).select().single() : sb.from('expenses').insert(rec).select().single());
      const i = S.expenses.findIndex(x => x.id === row.id); if (i >= 0) S.expenses[i] = row; else S.expenses.unshift(row);
      after?.();
    }, { extraFoot: v.id && approver ? `<button class="btn bad" id="eDel">ลบ</button>` : '' });
  $('#eUp', m).onclick = async () => { const f = await pickImage(false); if (!f) return; try { const u = await uploadImageFile(f); $('[name=receipt_url]', m).value = u; toast('แนบไฟล์แล้ว', 'ok'); } catch (e) { fail(e); } };
  if ($('#eDel', m)) $('#eDel', m).onclick = async () => { if (!await confirmBox('คุณต้องการยืนยันการลบข้อมูลนี้หรือไม่?')) return; try { await q(sb.from('expenses').delete().eq('id', v.id)); S.expenses = S.expenses.filter(x => x.id !== v.id); m.close(); after?.(); } catch (e) { fail(e); } };
}

/* ================= SHIFTS / CASH REGISTER ================= */
async function shiftSummary(sh) {
  const [pays, refs, moves, exps, cpay] = await Promise.all([
    q(sb.from('sale_payments').select('method,amount,sales!inner(status)').eq('shift_id', sh.id).neq('sales.status', 'void')),
    q(sb.from('refunds').select('amount,method').eq('shift_id', sh.id)),
    q(sb.from('cash_moves').select('*').eq('shift_id', sh.id).order('created_at')),
    q(sb.from('expenses').select('amount,payment_method,status').eq('shift_id', sh.id)),
    q(sb.from('customer_payments').select('amount,method').eq('shift_id', sh.id)),
  ]);
  const sum = (a, f = () => true) => a.filter(f).reduce((x, r) => x + num(r.amount), 0);
  const o = { opening: num(sh.opening_cash), cashSales: sum(pays, p => p.method === 'cash'), otherSales: sum(pays, p => p.method !== 'cash'),
    cashRefunds: sum(refs, r => r.method === 'cash'), cashIn: sum(moves, m => m.kind === 'in'), cashOut: sum(moves, m => m.kind === 'out'),
    cashExp: sum(exps, e => e.payment_method === 'cash' && e.status !== 'pending'), debtCash: sum(cpay, p => p.method === 'cash'), moves, byMethod: {} };
  pays.forEach(p => { o.byMethod[p.method] = (o.byMethod[p.method] || 0) + num(p.amount); });
  o.expected = r2(o.opening + o.cashSales + o.cashIn + o.debtCash - o.cashOut - o.cashRefunds - o.cashExp);
  return o;
}
const summaryHTML = (o, sh) => `<div class="kv"><span>เงินทอนตั้งต้น</span><b>${baht(o.opening)}</b><span>+ ขายเงินสด</span><b>${baht(o.cashSales)}</b><span>+ รับชำระหนี้ (เงินสด)</span><b>${baht(o.debtCash)}</b>
  <span>+ นำเงินเข้า</span><b>${baht(o.cashIn)}</b><span>− นำเงินออก</span><b>${baht(o.cashOut)}</b><span>− คืนเงินสด</span><b>${baht(o.cashRefunds)}</b><span>− ค่าใช้จ่ายเงินสด</span><b>${baht(o.cashExp)}</b>
  <span style="font-size:16px"><b>= เงินสดที่ควรมีในลิ้นชัก</b></span><b style="font-size:18px">${baht(o.expected)}</b></div>
  <p class="section-title">ยอดขายตามช่องทาง</p><div class="kv">${Object.entries(o.byMethod).map(([k, v]) => `<span>${payIcon(k)} ${payName(k)}</span><b>${baht(v)}</b>`).join('') || '<span class="muted">—</span>'}</div>
  ${o.moves.length ? `<p class="section-title">เงินเข้า-ออกลิ้นชัก</p>${o.moves.map(m => `<div class="tline"><span>${dt(m.created_at)} · ${m.kind === 'in' ? 'นำเข้า' : 'นำออก'} · ${esc(m.reason)} (${esc(m.user_name)})</span><b>${m.kind === 'in' ? '+' : '−'}${baht(m.amount)}</b></div>`).join('')}` : ''}`;
VIEWS.shifts = async pg => {
  const rows = await q(sb.from('shifts').select('*').eq('shop_id', S.shop.id).order('opened_at', { ascending: false }).limit(100));
  const mine = S.shift;
  let o = null; if (mine) o = await shiftSummary(mine);
  pg.querySelector('.skel')?.remove(), pg.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px">${mine ? `
      <div class="row"><span class="chip ok">● กะเปิดอยู่</span><span class="muted">เปิดเมื่อ ${dt(mine.opened_at)} · ${esc(mine.user_name)}</span><span class="sp"></span>
        ${canDo('cash_moves') ? `<button class="btn" id="cIn">➕ นำเงินเข้า</button><button class="btn" id="cOut">➖ นำเงินออก</button>` : ''}</div><br>
      ${summaryHTML(o, mine)}<br><div class="row"><button class="btn" id="sPr">🖨️ พิมพ์รายงานกะ (X)</button><span class="sp"></span><button class="btn bad lg" id="cls">ปิดกะ / นับเงิน</button></div>`
    : `<div class="row"><span class="chip warn">ยังไม่เปิดกะ</span><span class="muted">เปิดกะเพื่อบันทึกเงินสดในลิ้นชักของคุณ</span><span class="sp"></span><button class="btn p lg" id="opn">เปิดกะ</button></div>`}</div>
    <p class="section-title">ประวัติกะ</p><div class="tblwrap"><table class="tbl"><tr><th>พนักงาน</th><th>เปิด</th><th>ปิด</th><th class="right">เงินตั้งต้น</th><th class="right">ควรมี</th><th class="right">นับได้</th><th class="right">ส่วนต่าง</th></tr>
    ${rows.map(r => { const d = r.closed_at ? num(r.closing_cash) - num(r.expected_cash) : null; return `<tr class="click" data-s="${r.id}"><td>${esc(r.user_name)}</td><td>${dt(r.opened_at)}</td><td>${r.closed_at ? dt(r.closed_at) : '<span class="chip ok">เปิดอยู่</span>'}</td>
      <td class="right">${money(r.opening_cash)}</td><td class="right">${r.closed_at ? money(r.expected_cash) : ''}</td><td class="right">${r.closed_at ? money(r.closing_cash) : ''}</td>
      <td class="right b" style="color:${d < 0 ? 'var(--bad)' : 'var(--ok)'}">${d === null ? '' : (d > 0 ? '+' : '') + money(d)}</td></tr>`; }).join('')}</table></div>`);
  $$('[data-s]', pg).forEach(tr => tr.onclick = async () => { const sh = rows.find(r => r.id === tr.dataset.s); const so = await shiftSummary(sh);
    const md = modal(`รายงานกะ — ${sh.user_name}`, `<p class="muted">${dt(sh.opened_at)} → ${sh.closed_at ? dt(sh.closed_at) : 'ยังเปิดอยู่'}</p>${summaryHTML(so, sh)}${sh.closed_at ? `<br><div class="kv"><span>นับได้จริง</span><b>${baht(sh.closing_cash)}</b><span>ส่วนต่าง</span><b>${baht(num(sh.closing_cash) - num(sh.expected_cash))}</b></div>${sh.note ? `<p>หมายเหตุ: ${esc(sh.note)}</p>` : ''}` : ''}`, { foot: '<button class="btn p" id="pp">🖨️ พิมพ์</button>' });
    $('#pp', md).onclick = () => printReceipt(`<div class="rcpt"><div class="c t">${esc(S.shop.name)}</div><div class="c">รายงานกะ</div><hr>${summaryHTML(so, sh).replace(/class="kv"/g, '')}</div>`); });
  if ($('#opn')) $('#opn').onclick = () => formModal('เปิดกะ', [{ k: 'opening_cash', label: 'เงินทอนตั้งต้นในลิ้นชัก', type: 'number', req: true, def: 0 }], {}, async v => {
    S.shift = await q(sb.from('shifts').insert({ shop_id: S.shop.id, user_id: S.user.id, user_name: S.user.user_metadata?.full_name || S.user.user_metadata?.name || S.user.email, opening_cash: num(v.opening_cash) }).select().single());
    await sb.rpc('log_action', { p_shop: S.shop.id, p_action: 'shift_open', p_entity: 'shift', p_id: S.shift.id, p_detail: { opening: num(v.opening_cash) } }); go('shifts'); });
  const mv = kind => formModal(kind === 'in' ? 'นำเงินเข้าลิ้นชัก' : 'นำเงินออกจากลิ้นชัก', [{ k: 'amount', label: 'จำนวนเงิน', type: 'number', req: true },
    { k: 'reason', label: 'เหตุผล', req: true, full: true, ph: kind === 'in' ? 'เช่น เติมเงินทอน' : 'เช่น นำส่งเจ้าของ / ฝากธนาคาร' }], {}, async v => {
      if (!(num(v.amount) > 0)) throw new Error('ยอดเงินไม่ถูกต้อง');
      await q(sb.from('cash_moves').insert({ shop_id: S.shop.id, shift_id: mine.id, kind, amount: num(v.amount), reason: v.reason, user_id: S.user.id, user_name: S.user.user_metadata?.full_name || S.user.email }));
      await sb.rpc('log_action', { p_shop: S.shop.id, p_action: 'cash_' + kind, p_entity: 'shift', p_id: mine.id, p_detail: { amount: num(v.amount), reason: v.reason } }); go('shifts'); });
  if ($('#cIn')) $('#cIn').onclick = () => mv('in');
  if ($('#cOut')) $('#cOut').onclick = () => mv('out');
  if ($('#sPr')) $('#sPr').onclick = () => printReceipt(`<div class="rcpt"><div class="c t">${esc(S.shop.name)}</div><div class="c">รายงานกะ (X) — ${dt(new Date())}</div><hr>${summaryHTML(o, mine).replace(/class="kv"/g, '')}</div>`);
  if ($('#cls')) $('#cls').onclick = () => formModal('ปิดกะ', [{ k: 'closing_cash', label: `เงินสดที่นับได้จริง (ควรมี ${baht(o.expected)})`, type: 'number', req: true }, { k: 'note', label: 'หมายเหตุ', full: true }], {}, async v => {
    const diff = r2(num(v.closing_cash) - o.expected);
    if (Math.abs(diff) > 0.009 && !await confirmBox(`เงินสด${diff > 0 ? 'เกิน' : 'ขาด'} ${baht(Math.abs(diff))} — ยืนยันปิดกะ?`)) throw new Error('ยกเลิกการปิดกะ');
    await q(sb.from('shifts').update({ closed_at: new Date().toISOString(), closing_cash: num(v.closing_cash), expected_cash: o.expected, note: v.note }).eq('id', mine.id));
    await sb.rpc('log_action', { p_shop: S.shop.id, p_action: 'shift_close', p_entity: 'shift', p_id: mine.id, p_detail: { expected: o.expected, counted: num(v.closing_cash), diff } });
    S.shift = null; go('shifts'); });
};
/* ================= REPORTS ================= */
let XLSX_P = null;
const loadXLSX = () => (XLSX_P ||= loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'));
const REPORTS = [
  ['sales', 'ยอดขายรายวัน'], ['profit', 'กำไร'], ['product', 'ผลงานสินค้า'], ['category', 'หมวดหมู่'], ['inventory', 'สินค้าคงคลัง'], ['moves', 'ความเคลื่อนไหวสต็อก'],
  ['purchase', 'การสั่งซื้อ'], ['expense', 'ค่าใช้จ่าย'], ['customer', 'ลูกค้า'], ['staff', 'ผลงานพนักงาน'], ['payment', 'ช่องทางชำระเงิน'], ['vat', 'ภาษีขาย (VAT)'],
  ['shift', 'กะ / ลิ้นชักเงิน'], ['refund', 'คืนเงิน'],
];
VIEWS.reports = pg => {
  let rep = 'sales', A, B, cur = null;
  pg.innerHTML = `<div class="pills" id="rk" style="margin-bottom:12px">${REPORTS.filter(r => canDo('view_profit') || !['profit'].includes(r[0])).map(([k, l]) => `<button data-k="${k}" class="${k === rep ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="rr"></div><div class="row" style="margin-bottom:12px"><div class="sbox" style="max-width:280px"><span>🔍</span><input class="in" id="rq" placeholder="ค้นหาในรายงาน"></div><span class="sp"></span>
    <button class="btn" id="rcsv">⬇ CSV</button><button class="btn" id="rxl">📗 Excel</button><button class="btn" id="rpr">🖨️ พิมพ์ / PDF</button></div><div id="rbody"></div>`;
  $$('#rk button').forEach(b => b.onclick = () => { rep = b.dataset.k; $$('#rk button').forEach(x => x.classList.toggle('on', x === b)); run(); });
  let sortK = null, sortD = -1;
  const show = () => {
    if (!cur) return; const v = $('#rq').value.toLowerCase();
    let rows = cur.rows.filter(r => !v || JSON.stringify(r).toLowerCase().includes(v));
    if (sortK) rows = [...rows].sort((a, b) => (typeof a[sortK] === 'number' ? a[sortK] - b[sortK] : String(a[sortK]).localeCompare(String(b[sortK]), 'th')) * sortD);
    const tot = {}; cur.cols.forEach(([k, , t]) => { if (t === 'm' || t === 'n') tot[k] = rows.reduce((a, r) => a + num(r[k]), 0); });
    const fmt = (t, v) => t === 'm' ? money(v) : t === 'n' ? qtyf(v) : t === 'p' ? num(v).toFixed(1) + '%' : t === 'd' ? (v ? dOnly(v) : '') : t === 'dt' ? (v ? dt(v) : '') : esc(v ?? '');
    const page = rows.slice(0, 500);
    $('#rbody').innerHTML = `${cur.summary ? `<div class="stats">${cur.summary.map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>` : ''}
      ${cur.note ? `<p class="muted" style="font-size:13px">${cur.note}</p>` : ''}
      <div class="tblwrap" id="rtbl"><table class="tbl"><tr>${cur.cols.map(([k, l, t]) => `<th class="${['m', 'n', 'p'].includes(t) ? 'right' : ''}" data-s="${k}" style="cursor:pointer">${l}${sortK === k ? (sortD > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>
      ${page.map(r => `<tr>${cur.cols.map(([k, , t]) => `<td class="${['m', 'n', 'p'].includes(t) ? 'right' : ''}">${fmt(t, r[k])}</td>`).join('')}</tr>`).join('')}
      ${Object.keys(tot).length ? `<tr>${cur.cols.map(([k, , t], i) => `<td class="${['m', 'n'].includes(t) ? 'right' : ''} b">${i === 0 ? 'รวม' : k in tot ? fmt(t, tot[k]) : ''}</td>`).join('')}</tr>` : ''}</table></div>
      <p class="muted">${rows.length} รายการ${rows.length > 500 ? ' (แสดง 500 แรก — ส่งออกเพื่อดูทั้งหมด)' : ''}</p>`;
    $$('[data-s]', $('#rbody')).forEach(th => th.onclick = () => { sortD = sortK === th.dataset.s ? -sortD : -1; sortK = th.dataset.s; show(); });
    cur._rows = rows;
  };
  const run = async () => { if (!$('#rbody')) return; $('#rbody').innerHTML = '<div class="skel"><i></i><i></i></div>'; try { sortK = null; cur = await REPORT_FN[rep](A, B); if ($('#rbody')) show(); } catch (e) { if ($('#rbody')) { fail(e); $('#rbody').innerHTML = ''; } } };
  $('#rq').oninput = show;
  const fname = () => `report_${rep}_${ymd(A)}_${ymd(B)}`;
  $('#rcsv').onclick = () => cur && download(fname() + '.csv', toCSV(cur._rows.map(r => Object.fromEntries(cur.cols.map(([k, l]) => [l, r[k]]))), cur.cols.map(c => c[1])));
  $('#rxl').onclick = async () => { if (!cur) return; await loadXLSX(); const ws = XLSX.utils.json_to_sheet(cur._rows.map(r => Object.fromEntries(cur.cols.map(([k, l]) => [l, r[k]]))));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'รายงาน');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = fname().replace(/[\\/:*?"<>|()]/g, '').replace(/\s+/g, '_') + '.xlsx'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000); };
  $('#rpr').onclick = () => cur && printReceipt(`<div class="a4"><h2>${esc(S.shop.name)} — รายงาน${REPORTS.find(r => r[0] === rep)[1]}</h2><p>ช่วงวันที่ ${dLong(A)} – ${dLong(B)} · พิมพ์เมื่อ ${dt(new Date())}</p>${$('#rtbl').innerHTML.replace(/class="tbl"/, '')}</div>`);
  rangeBar($('#rr'), (a, b) => { A = a; B = b; run(); }, 'month');
};
const groupSum = (arr, key, fields) => { const m = {}; arr.forEach(r => { const k = key(r); const o = m[k] ||= { _k: k }; fields.forEach(([f, fn]) => { o[f] = (o[f] || 0) + num(fn(r)); }); }); return Object.values(m); };
const iso = d => d.toISOString();
const REPORT_FN = {
  async sales(a, b) {
    const s = await salesIn(a, b); const rows = groupSum(s, r => ymd(r.created_at), [['bills', () => 1], ['total', r => r.total], ['discount', r => r.discount], ['vat', r => r.vat], ['refund', r => r.refunded_total], ['net', r => num(r.total) - num(r.refunded_total)]]).map(r => ({ ...r, date: r._k })).sort((x, y) => x.date.localeCompare(y.date));
    return { cols: [['date', 'วันที่', 'd'], ['bills', 'จำนวนบิล', 'n'], ['total', 'ยอดขาย', 'm'], ['discount', 'ส่วนลด', 'm'], ['vat', 'VAT', 'm'], ['refund', 'คืนเงิน', 'm'], ['net', 'ยอดสุทธิ', 'm']], rows };
  },
  async profit(a, b) {
    const s = await salesIn(a, b); const ex = await fetchAll(() => sb.from('expenses').select('amount,spent_on,status').eq('shop_id', S.shop.id).gte('spent_on', ymd(a)).lte('spent_on', ymd(b)));
    const exD = {}; ex.filter(e => e.status !== 'pending').forEach(e => { exD[e.spent_on] = (exD[e.spent_on] || 0) + num(e.amount); });
    const rows = groupSum(s, r => ymd(r.created_at), [['rev', r => num(r.total) - num(r.refunded_total)], ['vat', r => r.vat], ['cogs', r => r.cost_total]]).map(r => {
      const net = r.rev - r.vat, gp = net - r.cogs, e = exD[r._k] || 0; return { date: r._k, rev: r.rev, net, cogs: r.cogs, gp, gm: net ? gp / net * 100 : 0, exp: e, np: gp - e }; }).sort((x, y) => x.date.localeCompare(y.date));
    return { note: 'ยอดขายสุทธิ = หลังหักคืนเงิน · กำไรขั้นต้น = ยอดขายก่อน VAT − ต้นทุนสินค้า · กำไรสุทธิ = กำไรขั้นต้น − ค่าใช้จ่ายที่อนุมัติแล้ว',
      cols: [['date', 'วันที่', 'd'], ['rev', 'ยอดขายสุทธิ', 'm'], ['net', 'ก่อน VAT', 'm'], ['cogs', 'ต้นทุนสินค้า', 'm'], ['gp', 'กำไรขั้นต้น', 'm'], ['gm', 'อัตรากำไร', 'p'], ['exp', 'ค่าใช้จ่าย', 'm'], ['np', 'กำไรสุทธิ', 'm']], rows };
  },
  async product(a, b) {
    const it = await fetchAll(() => sb.from('sale_items').select('product_id,name,qty,price,discount,cost,refunded_qty,sales!inner(created_at,status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('sales.created_at', iso(a)).lte('sales.created_at', iso(b)));
    const rows = groupSum(it, r => r.name, [['qty', r => num(r.qty) - num(r.refunded_qty)], ['rev', r => (num(r.qty) - num(r.refunded_qty)) * num(r.price) - num(r.discount)], ['cogs', r => (num(r.qty) - num(r.refunded_qty)) * num(r.cost)]])
      .map(r => ({ name: r._k, qty: r.qty, rev: r.rev, cogs: r.cogs, gp: r.rev - r.cogs, gm: r.rev ? (r.rev - r.cogs) / r.rev * 100 : 0 })).sort((x, y) => y.rev - x.rev);
    return { cols: [['name', 'สินค้า'], ['qty', 'จำนวนขาย', 'n'], ['rev', 'ยอดขาย', 'm'], ...(canDo('view_profit') ? [['cogs', 'ต้นทุน', 'm'], ['gp', 'กำไร', 'm'], ['gm', 'อัตรากำไร', 'p']] : [])], rows };
  },
  async category(a, b) {
    const it = await fetchAll(() => sb.from('sale_items').select('product_id,qty,price,discount,cost,refunded_qty,sales!inner(created_at,status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('sales.created_at', iso(a)).lte('sales.created_at', iso(b)));
    const catOf = id => S.categories.find(c => c.id === S.products.find(p => p.id === id)?.category_id)?.name || 'ไม่มีหมวด';
    const rows = groupSum(it, r => catOf(r.product_id), [['qty', r => num(r.qty) - num(r.refunded_qty)], ['rev', r => (num(r.qty) - num(r.refunded_qty)) * num(r.price) - num(r.discount)], ['cogs', r => (num(r.qty) - num(r.refunded_qty)) * num(r.cost)]])
      .map(r => ({ cat: r._k, qty: r.qty, rev: r.rev, gp: r.rev - r.cogs })).sort((x, y) => y.rev - x.rev);
    return { cols: [['cat', 'หมวดหมู่'], ['qty', 'จำนวนขาย', 'n'], ['rev', 'ยอดขาย', 'm'], ...(canDo('view_profit') ? [['gp', 'กำไรขั้นต้น', 'm']] : [])], rows };
  },
  async inventory() {
    const rows = S.products.filter(p => p.track_stock).map(p => ({ name: p.name, cat: S.categories.find(c => c.id === p.category_id)?.name || '', barcode: p.barcode, stock: p.stock, unit: p.unit, cost: p.cost, value: Math.max(0, p.stock) * p.cost, retail: Math.max(0, p.stock) * p.price,
      st: p.stock <= 0 ? 'หมด' : p.stock <= p.low_stock ? 'ใกล้หมด' : 'ปกติ', exp: p.expiry_date }));
    return { summary: [['มูลค่าทุนรวม', baht(rows.reduce((a, r) => a + r.value, 0))], ['มูลค่าขายรวม', baht(rows.reduce((a, r) => a + r.retail, 0))]],
      cols: [['name', 'สินค้า'], ['cat', 'หมวด'], ['barcode', 'บาร์โค้ด'], ['stock', 'คงเหลือ', 'n'], ['unit', 'หน่วย'], ['cost', 'ต้นทุน', 'm'], ['value', 'มูลค่าทุน', 'm'], ['retail', 'มูลค่าขาย', 'm'], ['st', 'สถานะ'], ['exp', 'วันหมดอายุ', 'd']], rows };
  },
  async moves(a, b) {
    const mv = await fetchAll(() => sb.from('stock_moves').select('*').eq('shop_id', S.shop.id).gte('created_at', iso(a)).lte('created_at', iso(b)).order('created_at', { ascending: false }));
    return { cols: [['created_at', 'วันเวลา', 'dt'], ['product_name', 'สินค้า'], ['kindL', 'ประเภท'], ['qty', 'จำนวน', 'n'], ['cost', 'ต้นทุน', 'm'], ['ref', 'อ้างอิง'], ['note', 'หมายเหตุ']], rows: mv.map(r => ({ ...r, kindL: (MOVE[r.kind] || ['', r.kind])[1] })) };
  },
  async purchase(a, b) {
    const po = await fetchAll(() => sb.from('purchases').select('*, supplier:suppliers(name)').eq('shop_id', S.shop.id).gte('created_at', iso(a)).lte('created_at', iso(b)));
    return { cols: [['po_no', 'เลขที่'], ['created_at', 'วันที่', 'd'], ['sup', 'ผู้จำหน่าย'], ['stL', 'สถานะ'], ['total', 'ยอดรวม', 'm'], ['paid', 'ชำระแล้ว', 'm'], ['owe', 'ค้างชำระ', 'm']],
      rows: po.map(r => ({ ...r, sup: r.supplier?.name || '', stL: PO_ST[r.status][1], owe: r.status === 'received' ? num(r.total) - num(r.paid) : 0 })) };
  },
  async expense(a, b) {
    const ex = await fetchAll(() => sb.from('expenses').select('*').eq('shop_id', S.shop.id).gte('spent_on', ymd(a)).lte('spent_on', ymd(b)).order('spent_on'));
    const byC = groupSum(ex.filter(e => e.status !== 'pending'), r => r.category, [['amount', r => r.amount]]);
    return { summary: byC.sort((x, y) => y.amount - x.amount).slice(0, 4).map(r => [r._k, baht(r.amount)]),
      cols: [['spent_on', 'วันที่', 'd'], ['category', 'หมวด'], ['note', 'รายละเอียด'], ['pm', 'ชำระโดย'], ['user_name', 'ผู้บันทึก'], ['stL', 'สถานะ'], ['amount', 'จำนวนเงิน', 'm']],
      rows: ex.map(r => ({ ...r, pm: payName(r.payment_method), stL: r.status === 'pending' ? 'รออนุมัติ' : 'อนุมัติแล้ว' })) };
  },
  async customer(a, b) {
    const s = await salesIn(a, b); const g = groupSum(s.filter(x => x.customer_id), r => r.customer_id, [['bills', () => 1], ['spent', r => num(r.total) - num(r.refunded_total)]]);
    return { cols: [['name', 'ลูกค้า'], ['phone', 'เบอร์โทร'], ['bills', 'จำนวนบิล', 'n'], ['spent', 'ยอดซื้อในช่วง', 'm'], ['total_spent', 'ยอดซื้อสะสม', 'm'], ['points', 'แต้ม', 'n'], ['balance', 'ค้างชำระ', 'm']],
      rows: S.customers.map(c => { const x = g.find(r => r._k === c.id) || {}; return { ...c, bills: x.bills || 0, spent: x.spent || 0 }; }).sort((x, y) => y.spent - x.spent) };
  },
  async staff(a, b) {
    const s = await salesIn(a, b); const r = await fetchAll(() => sb.from('refunds').select('amount,user_name').eq('shop_id', S.shop.id).gte('created_at', iso(a)).lte('created_at', iso(b)));
    const rows = groupSum(s, x => x.cashier_name || '-', [['bills', () => 1], ['total', x => x.total], ['items', x => x.items_count], ['disc', x => x.discount]]).map(x => ({ name: x._k, bills: x.bills, total: x.total, avg: x.total / x.bills, items: x.items, disc: x.disc, ref: r.filter(y => y.user_name === x._k).reduce((t, y) => t + num(y.amount), 0) }));
    return { cols: [['name', 'พนักงาน'], ['bills', 'จำนวนบิล', 'n'], ['items', 'จำนวนสินค้า', 'n'], ['total', 'ยอดขาย', 'm'], ['avg', 'เฉลี่ย/บิล', 'm'], ['disc', 'ส่วนลดที่ให้', 'm'], ['ref', 'คืนเงินที่ทำ', 'm']], rows };
  },
  async payment(a, b) {
    const p = await fetchAll(() => sb.from('sale_payments').select('method,amount,status,sales!inner(status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('created_at', iso(a)).lte('created_at', iso(b)));
    const rows = groupSum(p, r => r.method, [['cnt', () => 1], ['amount', r => r.amount], ['pending', r => r.status === 'pending' ? r.amount : 0]]).map(r => ({ m: payName(r._k), cnt: r.cnt, amount: r.amount, pending: r.pending }));
    return { cols: [['m', 'ช่องทาง'], ['cnt', 'จำนวนรายการ', 'n'], ['amount', 'ยอดเงิน', 'm'], ['pending', 'รอตรวจสอบ', 'm']], rows };
  },
  async vat(a, b) {
    const s = await salesIn(a, b, ',subtotal,tax_name,tax_id,invoice_type');
    const rate = num(S.shop.vat_rate);
    const rows = s.map(r => { const tot = num(r.total) - num(r.refunded_total), vat = r.refunded_total ? r2(num(r.vat) * tot / num(r.total || 1)) : num(r.vat);
      return { date: r.created_at, no: r.bill_no, type: r.invoice_type === 'full' ? 'เต็มรูป' : 'อย่างย่อ', buyer: r.tax_name || '', tid: r.tax_id || '', base: r2(tot - vat), vat, total: tot }; });
    return { note: S.shop.vat_mode === 'none' ? '⚠️ ร้านตั้งค่าเป็น “ไม่จด VAT” — รายงานนี้ใช้สำหรับร้านที่จดทะเบียนภาษีมูลค่าเพิ่ม' : `รายงานภาษีขาย อัตรา ${rate}% · ตรวจสอบกับผู้ทำบัญชีก่อนยื่นแบบ ภ.พ.30`,
      cols: [['date', 'วันที่', 'd'], ['no', 'เลขที่'], ['type', 'ประเภทใบกำกับ'], ['buyer', 'ชื่อผู้ซื้อ'], ['tid', 'เลขผู้เสียภาษี'], ['base', 'มูลค่าสินค้า', 'm'], ['vat', 'ภาษีมูลค่าเพิ่ม', 'm'], ['total', 'รวม', 'm']], rows };
  },
  async shift(a, b) {
    const sh = await fetchAll(() => sb.from('shifts').select('*').eq('shop_id', S.shop.id).gte('opened_at', iso(a)).lte('opened_at', iso(b)).order('opened_at'));
    return { cols: [['user_name', 'พนักงาน'], ['opened_at', 'เปิดกะ', 'dt'], ['closed_at', 'ปิดกะ', 'dt'], ['opening_cash', 'เงินตั้งต้น', 'm'], ['expected_cash', 'ควรมี', 'm'], ['closing_cash', 'นับได้', 'm'], ['diff', 'ส่วนต่าง', 'm']],
      rows: sh.map(r => ({ ...r, diff: r.closed_at ? num(r.closing_cash) - num(r.expected_cash) : 0 })) };
  },
  async refund(a, b) {
    const r = await fetchAll(() => sb.from('refunds').select('*, sale:sales(bill_no)').eq('shop_id', S.shop.id).gte('created_at', iso(a)).lte('created_at', iso(b)).order('created_at', { ascending: false }));
    return { cols: [['created_at', 'วันเวลา', 'dt'], ['refund_no', 'เลขที่คืน'], ['bill', 'บิลอ้างอิง'], ['reason', 'เหตุผล'], ['mL', 'คืนผ่าน'], ['user_name', 'ผู้ทำรายการ'], ['amount', 'จำนวนเงิน', 'm']],
      rows: r.map(x => ({ ...x, bill: x.sale?.bill_no || '', mL: payName(x.method) })) };
  },
};

/* ================= STAFF (username + password accounts, managed by owner/admin) ================= */
async function staffCall(body) {
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(window.POS_CONFIG.url + '/functions/v1/staff-admin', { method: 'POST',
    headers: { apikey: window.POS_CONFIG.key, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: S.shop.id, ...body }) });
  const d = await r.json().catch(() => ({})); if (!r.ok || d.error) throw new Error(d.error || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); return d;
}
const roleOpts = () => ['admin', 'manager', 'cashier', 'stock', 'accountant'].filter(r => r !== 'admin' || S.role === 'owner').map(r => [r, ROLE_NAME(r)]);
function permBoxes(selected) {
  return `<div class="perm-grid">${PERMS.map(([k, l]) => `<label class="row"><input type="checkbox" data-pk="${k}" ${selected.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div>`;
}
const rolePerms = role => role === 'admin' ? ALL_PERMS : (Array.isArray(S.shop.permissions?.[role]) ? S.shop.permissions[role] : (PERM_DEF[role] || []));
function staffForm(mem, after) {
  const isNew = !mem;
  let custom = !!(mem && Array.isArray(mem.permissions));
  const m = modal(isNew ? 'เพิ่มพนักงาน' : `แก้ไข — ${mem.display_name}`, `
    <div class="grid2">
      <div class="fg"><label class="f">ชื่อพนักงาน *</label><input class="in" id="sfN" value="${esc(mem?.display_name || '')}"></div>
      <div class="fg"><label class="f">ชื่อผู้ใช้ (ใช้เข้าสู่ระบบ) *</label><input class="in" id="sfU" value="${esc(mem?.username || '')}" ${isNew ? '' : 'disabled'} autocapitalize="off" placeholder="เช่น somchai"></div>
      ${isNew ? `<div class="fg"><label class="f">รหัสผ่าน * (อย่างน้อย 6 ตัว)</label><div class="sbox" style="padding-left:0"><input class="in" id="sfP" type="text" value="${Math.random().toString(36).slice(2, 8)}"><button type="button" class="clr" id="sfG" title="สุ่มใหม่">🎲</button></div></div>` : ''}
      <div class="fg"><label class="f">ตำแหน่ง</label><select class="in" id="sfR">${roleOpts().map(([k, l]) => `<option value="${k}" ${(mem?.role || 'cashier') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <label class="row fg"><input type="checkbox" id="sfC" ${custom ? 'checked' : ''}> กำหนดสิทธิ์เฉพาะคนนี้ (ไม่ใช้ค่าตามตำแหน่ง)</label>
    <div id="sfPerm"></div>`, { wide: true, foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="sfS">${isNew ? 'สร้างบัญชี' : 'บันทึก'}</button>` });
  const drawPerm = () => { const role = $('#sfR', m).value; const sel = custom ? (Array.isArray(mem?.permissions) ? mem.permissions : rolePerms(role)) : rolePerms(role);
    $('#sfPerm', m).innerHTML = `<p class="muted" style="font-size:13px;margin:0 0 8px">${custom ? 'เลือกสิทธิ์ที่พนักงานคนนี้ใช้ได้' : `สิทธิ์ตามตำแหน่ง “${ROLE_NAME(role)}” (แก้ค่าเริ่มต้นได้ที่ปุ่ม “สิทธิ์ตามตำแหน่ง”)`}</p>${permBoxes(sel)}`;
    $$('[data-pk]', m).forEach(c => { c.disabled = !custom || role === 'admin'; }); };
  $('#sfR', m).onchange = drawPerm; $('#sfC', m).onchange = e => { custom = e.target.checked; drawPerm(); }; drawPerm();
  if ($('#sfG', m)) $('#sfG', m).onclick = () => { $('#sfP', m).value = Math.random().toString(36).slice(2, 10); };
  $('[data-c]', m).onclick = m.close;
  $('#sfS', m).onclick = async () => {
    const name = $('#sfN', m).value.trim(), role = $('#sfR', m).value;
    const perms = custom && role !== 'admin' ? $$('[data-pk]', m).filter(c => c.checked).map(c => c.dataset.pk) : null;
    if (!name) return toast('กรุณากรอกข้อมูลให้ครบถ้วน', 'bad');
    const b = $('#sfS', m); b.disabled = true;
    try {
      if (isNew) {
        const username = $('#sfU', m).value.trim().toLowerCase(), password = $('#sfP', m).value;
        if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) throw new Error('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ a-z, 0-9, . _ - ยาว 3–30 ตัว');
        if (password.length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัวอักษร');
        await staffCall({ action: 'create', username, password, display_name: name, role, permissions: perms });
        m.close(); after?.();
        modal('สร้างบัญชีพนักงานแล้ว', `<p>ส่งข้อมูลนี้ให้ <b>${esc(name)}</b> เพื่อเข้าสู่ระบบ:</p>
          <div class="card" style="box-shadow:none;background:var(--bg2)"><div class="kv"><span>ลิงก์</span><b style="word-break:break-all">${esc(location.href.split('#')[0])}</b><span>ชื่อผู้ใช้</span><b>${esc(username)}</b><span>รหัสผ่าน</span><b>${esc(password)}</b></div></div>
          <button class="btn" id="cpy" style="margin-top:10px">📋 คัดลอกข้อมูล</button>`).querySelector('#cpy').onclick = () => {
            navigator.clipboard?.writeText(`Yanisa Shop\n${location.href.split('#')[0]}\nชื่อผู้ใช้: ${username}\nรหัสผ่าน: ${password}`); toast('คัดลอกแล้ว', 'ok'); };
      } else {
        await staffCall({ action: 'update', user_id: mem.user_id, display_name: name, role, permissions: perms });
        toast('บันทึกข้อมูลเรียบร้อยแล้ว', 'ok'); m.close(); after?.();
      }
    } catch (e) { b.disabled = false; fail(e); }
  };
}
VIEWS.staff = async pg => {
  const mem = await q(sb.from('shop_members').select('*').eq('shop_id', S.shop.id).order('created_at'));
  const manage = can('owner', 'admin');
  $('#tact').innerHTML = manage ? `<button class="btn p" id="sAdd">+ เพิ่มพนักงาน</button><button class="btn" id="perm">🔐 สิทธิ์ตามตำแหน่ง</button>` : '';
  pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">พนักงานทั้งหมด</div><div class="v">${mem.length}</div></div>
      <div class="stat"><div class="k">ใช้งานอยู่</div><div class="v" style="color:var(--ok)">${mem.filter(m => m.active !== false).length}</div></div>
      <div class="stat"><div class="k">ถูกระงับ</div><div class="v" style="color:var(--bad)">${mem.filter(m => m.active === false).length}</div></div></div>
    <div class="tblwrap"><table class="tbl"><tr><th>พนักงาน</th><th>ชื่อผู้ใช้</th><th>ตำแหน่ง</th><th>สิทธิ์</th><th>สถานะ</th><th></th></tr>
    ${mem.map(m => { const self = m.user_id === S.user.id, owner = m.role === 'owner';
      return `<tr><td><b>${esc(m.display_name || '-')}</b>${self ? ' <span class="chip">คุณ</span>' : ''}</td><td><code>${esc(m.username || (m.email || '').split('@')[0])}</code></td>
      <td><span class="chip ${owner ? 'info' : ''}">${ROLE_NAME(m.role)}</span></td><td>${owner || m.role === 'admin' ? 'ทั้งหมด' : Array.isArray(m.permissions) ? `<span class="chip warn">กำหนดเอง ${m.permissions.length}</span>` : 'ตามตำแหน่ง'}</td>
      <td>${m.active === false ? '<span class="chip bad">ระงับ</span>' : '<span class="chip ok">ใช้งาน</span>'}</td>
      <td class="right" style="white-space:nowrap">${manage && !owner ? `<button class="btn sm" data-e="${m.user_id}">✏️ แก้ไข/สิทธิ์</button> <button class="btn sm" data-p="${m.user_id}">🔑 รหัสผ่าน</button>
        ${self ? '' : `<button class="btn sm" data-t="${m.user_id}">${m.active === false ? '✅ เปิดใช้' : '⛔ ระงับ'}</button> <button class="btn sm bad" data-x="${m.user_id}">ลบ</button>`}` : ''}
        ${owner && self ? `<button class="btn sm" data-p="${m.user_id}">🔑 เปลี่ยนรหัสผ่าน</button>` : ''}</td></tr>`; }).join('')}</table></div>
    <p class="muted" style="font-size:13px">พนักงานเข้าสู่ระบบด้วย <b>ชื่อผู้ใช้</b> และ <b>รหัสผ่าน</b> ที่คุณสร้างให้ ที่ลิงก์: ${esc(location.href.split('#')[0])}<br>ไม่มีการสมัครสมาชิกจากภายนอก — เฉพาะเจ้าของร้านและผู้ดูแลระบบสร้างบัญชีได้</p>`;
  const find = id => mem.find(m => m.user_id === id);
  $$('[data-e]', pg).forEach(b => b.onclick = () => staffForm(find(b.dataset.e), () => go('staff')));
  $$('[data-p]', pg).forEach(b => b.onclick = () => { const m = find(b.dataset.p);
    formModal(`ตั้งรหัสผ่านใหม่ — ${m.display_name}`, [{ k: 'pw', label: 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)', req: true, def: Math.random().toString(36).slice(2, 9) }], {}, async o => {
      if (o.pw.length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัวอักษร');
      if (m.user_id === S.user.id) { const { error } = await sb.auth.updateUser({ password: o.pw }); if (error) throw error; }
      else await staffCall({ action: 'password', user_id: m.user_id, password: o.pw });
      modal('ตั้งรหัสผ่านใหม่แล้ว', `<div class="kv"><span>ชื่อผู้ใช้</span><b>${esc(m.username || m.email.split('@')[0])}</b><span>รหัสผ่านใหม่</span><b>${esc(o.pw)}</b></div>`); }); });
  $$('[data-t]', pg).forEach(b => b.onclick = async () => { const m = find(b.dataset.t), on = m.active === false;
    if (!await confirmBox(on ? `เปิดใช้งานบัญชี ${m.display_name}?` : `ระงับบัญชี ${m.display_name}? พนักงานจะเข้าสู่ระบบไม่ได้ทันที`)) return;
    try { await staffCall({ action: on ? 'enable' : 'disable', user_id: m.user_id }); go('staff'); } catch (e) { fail(e); } });
  $$('[data-x]', pg).forEach(b => b.onclick = async () => { const m = find(b.dataset.x);
    if (!await confirmBox(`ลบ ${m.display_name} ออกจากร้าน? ประวัติการขายของพนักงานจะยังอยู่`)) return;
    try { await staffCall({ action: 'remove', user_id: m.user_id }); go('staff'); } catch (e) { fail(e); } });
  if ($('#sAdd')) $('#sAdd').onclick = () => staffForm(null, () => go('staff'));
  if ($('#perm')) $('#perm').onclick = permEditor;
};
function permEditor() {
  const roles = ['manager', 'cashier', 'stock', 'accountant'];
  const cur = Object.fromEntries(roles.map(r => [r, new Set(Array.isArray(S.shop.permissions?.[r]) ? S.shop.permissions[r] : PERM_DEF[r])]));
  const m = modal('สิทธิ์การใช้งานตามตำแหน่ง', `<p class="muted" style="margin-top:0">เจ้าของร้านและผู้ดูแลระบบมีสิทธิ์ทั้งหมดเสมอ · การยกเลิกบิลและคืนเงินในฐานข้อมูลจำกัดเฉพาะผู้จัดการขึ้นไปเพื่อความปลอดภัย</p>
    <div class="tblwrap"><table class="tbl perm-table"><tr><th>สิทธิ์</th>${roles.map(r => `<th>${ROLE_NAME(r)}</th>`).join('')}</tr>
    ${PERMS.map(([k, l]) => `<tr><td>${l}</td>${roles.map(r => `<td><input type="checkbox" data-r="${r}" data-k="${k}" ${cur[r].has(k) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}</table></div>`,
    { wide: true, foot: `<button class="btn" id="pr">คืนค่าเริ่มต้น</button><span style="flex:1"></span><button class="btn p" id="ps">บันทึก</button>` });
  $('#pr', m).onclick = () => { $$('[data-r]', m).forEach(c => { c.checked = PERM_DEF[c.dataset.r].includes(c.dataset.k); }); };
  $('#ps', m).onclick = async () => {
    const perms = Object.fromEntries(roles.map(r => [r, $$(`[data-r="${r}"]`, m).filter(c => c.checked).map(c => c.dataset.k)]));
    try { const row = await q(sb.from('shops').update({ permissions: perms }).eq('id', S.shop.id).select().single()); Object.assign(S.shop, row); m.close(); toast('บันทึกข้อมูลเรียบร้อยแล้ว', 'ok');
      await sb.rpc('log_action', { p_shop: S.shop.id, p_action: 'permissions', p_entity: 'shop', p_id: S.shop.name, p_detail: perms }); } catch (e) { fail(e); }
  };
}

/* ================= AUDIT LOG ================= */
const AUDIT_L = { sale: 'ขาย', void_sale: 'ยกเลิกบิล', refund: 'คืนเงิน', confirm_payment: 'ยืนยันการชำระ', tax_invoice: 'ออกใบกำกับภาษี', product_edit: 'แก้ไขสินค้า/ราคา',
  stock_adjust: 'ปรับยอดสต็อก', stock_damaged: 'ตัดสินค้าชำรุด', stock_expired: 'ตัดสินค้าหมดอายุ', transfer_stock: 'โอนสินค้า', receive_purchase: 'รับสินค้า (PO)', pay_supplier: 'จ่ายผู้จำหน่าย',
  customer_payment: 'รับชำระหนี้', shift_open: 'เปิดกะ', shift_close: 'ปิดกะ', cash_in: 'นำเงินเข้า', cash_out: 'นำเงินออก', staff_update: 'แก้ไขพนักงาน/สิทธิ์', staff_delete: 'ลบพนักงาน', staff_create: 'สร้างบัญชีพนักงาน', staff_password: 'ตั้งรหัสผ่านใหม่', staff_disable: 'ระงับบัญชี', staff_enable: 'เปิดใช้บัญชี', staff_remove: 'ลบพนักงาน', permissions: 'แก้ไขสิทธิ์', settings: 'แก้ไขตั้งค่า' };
VIEWS.audit = async pg => {
  const rows = await q(sb.from('audit_log').select('*').eq('shop_id', S.shop.id).order('created_at', { ascending: false }).limit(500));
  pg.innerHTML = `<div class="row" style="margin-bottom:12px"><div class="sbox" style="max-width:300px"><span>🔍</span><input class="in" id="aq" placeholder="ค้นหา"></div>
    <select class="in" id="aa" style="width:auto"><option value="">ทุกการกระทำ</option>${[...new Set(rows.map(r => r.action))].map(a => `<option value="${a}">${AUDIT_L[a] || a}</option>`).join('')}</select></div><div id="al"></div>`;
  const draw = () => { const v = $('#aq').value.toLowerCase(), a = $('#aa').value;
    const list = rows.filter(r => (!a || r.action === a) && (!v || JSON.stringify(r).toLowerCase().includes(v)));
    $('#al').innerHTML = list.length ? `<div class="tblwrap"><table class="tbl"><tr><th>วันเวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th><th>รายละเอียด</th></tr>${list.map(r => `<tr><td>${dt(r.created_at)}</td><td>${esc(r.user_name)}</td><td><span class="chip">${AUDIT_L[r.action] || esc(r.action)}</span></td><td>${esc(r.entity_id)}</td>
      <td><small class="muted">${esc(Object.entries(r.detail || {}).map(([k, x]) => `${k}: ${Array.isArray(x) ? x.join(' → ') : typeof x === 'object' ? JSON.stringify(x) : x}`).join(' · ')).slice(0, 200)}</small></td></tr>`).join('')}</table></div>` : '<div class="empty">ยังไม่มีบันทึก</div>'; };
  $('#aq').oninput = $('#aa').onchange = draw; draw();
};

/* ================= SETTINGS ================= */
VIEWS.settings = pg => {
  const sh = S.shop, edit = canDo('manage_settings');
  const sec = (t, inner) => `<div class="card" style="margin-bottom:16px"><h3 style="margin-top:0">${t}</h3>${inner}</div>`;
  const f = (k, l, type = 'text', opts) => `<div class="fg"><label class="f">${l}</label>${type === 'select' ? `<select class="in" name="${k}" ${edit ? '' : 'disabled'}>${opts.map(o => `<option value="${o[0]}" ${String(sh[k]) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`
    : type === 'textarea' ? `<textarea class="in" name="${k}" rows="2" ${edit ? '' : 'disabled'}>${esc(sh[k])}</textarea>` : type === 'check' ? `<label class="row"><input type="checkbox" name="${k}" ${sh[k] ? 'checked' : ''} ${edit ? '' : 'disabled'}> ${l}</label>`
    : `<input class="in" name="${k}" ${type === 'number' ? 'type="number" step="any"' : ''} value="${esc(sh[k] ?? '')}" ${edit ? '' : 'disabled'}>`}</div>`;
  const pm = new Set(shopMethods());
  pg.innerHTML = `<form id="stf"><div class="grid2"><div>
    ${sec('🏪 ข้อมูลร้าน', `<div class="row" style="margin-bottom:12px"><div class="qm-img" id="logoP" style="width:72px;height:72px;${sh.logo_url ? `background-image:url('${esc(sh.logo_url)}');background-size:contain` : ''}"></div>${edit ? '<button type="button" class="btn sm" id="logoU">อัปโหลดโลโก้</button><button type="button" class="btn sm" id="logoX">ลบโลโก้</button>' : ''}<input type="hidden" name="logo_url" value="${esc(sh.logo_url || '')}"></div>
      ${f('name', 'ชื่อร้าน *')}${f('phone', 'เบอร์โทร')}${f('address', 'ที่อยู่', 'textarea')}
      ${f('business_type', 'ประเภทธุรกิจ', 'select', [['retail', 'ร้านค้าปลีกทั่วไป'], ['grocery', 'ร้านขายของชำ / มินิมาร์ท'], ['fruit', 'ร้านผลไม้'], ['food', 'ร้านอาหาร / เครื่องดื่ม'], ['restaurant', 'ภัตตาคาร'], ['clothing', 'ร้านเสื้อผ้า'], ['convenience', 'ร้านสะดวกซื้อ'], ['wholesale', 'ค้าส่งและค้าปลีก']])}`)}
    ${sec('🧾 ภาษีและสาขา (กรมสรรพากร)', `${f('vat_mode', 'การจดทะเบียน VAT', 'select', [['none', 'ไม่จด VAT (ออกใบเสร็จรับเงิน)'], ['included', 'จด VAT — ราคารวม VAT แล้ว'], ['excluded', 'จด VAT — บวก VAT เพิ่มจากราคา']])}
      <div class="grid2">${f('vat_rate', 'อัตรา VAT (%)', 'number')}${f('tax_id', 'เลขประจำตัวผู้เสียภาษี (13 หลัก)')}${f('branch_code', 'รหัสสาขา (00000 = สำนักงานใหญ่)')}${f('branch_name', 'ชื่อสาขา')}</div>`)}
    ${sec('🖨️ ใบเสร็จ', `${f('receipt_size', 'ขนาดใบเสร็จ', 'select', [['58', 'เครื่องพิมพ์ความร้อน 58 มม.'], ['80', 'เครื่องพิมพ์ความร้อน 80 มม.'], ['A4', 'กระดาษ A4']])}${f('receipt_header', 'ข้อความหัวใบเสร็จ', 'textarea')}${f('receipt_footer', 'ข้อความท้ายใบเสร็จ', 'textarea')}
      <button type="button" class="btn sm" id="testPrint">🖨️ ทดสอบพิมพ์</button>`)}
  </div><div>
    ${sec('💳 การชำระเงิน', `<p style="margin-top:0">ช่องทางรับเงิน: <b>💵 เงินสด</b> และ <b>📱 สแกนจ่าย (QR พร้อมเพย์)</b></p>
      ${f('promptpay_id', 'เบอร์พร้อมเพย์ / เลขผู้เสียภาษี สำหรับสร้าง QR')}<p class="muted" style="font-size:13px">QR จะแสดงยอดเงินให้ลูกค้าสแกนอัตโนมัติ — ไม่ต้องเชื่อมต่อธนาคาร</p>`)}
    ${sec('🌐 ภาษาและรูปแบบ', `<div class="tabs"><button type="button" class="tab ${LANG === 'th' ? 'on' : ''}" data-l="th">ไทย</button><button type="button" class="tab ${LANG === 'en' ? 'on' : ''}" data-l="en">English</button></div>
      <div class="grid2">${f('era', 'ปีปฏิทิน', 'select', [['BE', 'พุทธศักราช (พ.ศ.)'], ['CE', 'คริสต์ศักราช (ค.ศ.)']])}${f('decimals', 'ทศนิยมของเงิน', 'select', [['2', '2 ตำแหน่ง (฿1,250.00)'], ['0', 'ไม่มีทศนิยม (฿1,250)']])}</div>${f('thai_digits', 'ใช้เลขไทย (๑๒๓)', 'check')}
      <p class="muted" style="font-size:13px">ตัวอย่าง: ${dLong(new Date())} · ${baht(1250)}</p>`)}
    ${sec('📦 สต็อกและสมาชิก', `${f('allow_negative_stock', 'อนุญาตให้ขายเมื่อสต็อกไม่พอ (ติดลบ)', 'check')}<div class="grid2">${f('points_per_baht', 'แต้มต่อ 1 บาท', 'number')}${f('baht_per_point', 'มูลค่า 1 แต้ม (บาท)', 'number')}</div>`)}
    ${sec('🔌 ฮาร์ดแวร์', `<div class="kv" style="font-size:14px"><span>สแกนเนอร์ USB / Bluetooth</span><b>รองรับ (โหมดคีย์บอร์ด)</b><span>กล้องมือถือสแกนบาร์โค้ด</span><b>รองรับ</b><span>เครื่องพิมพ์ใบเสร็จ</span><b>ผ่านหน้าต่างพิมพ์ของระบบ</b><span>ลิ้นชักเงิน</span><b>เปิดผ่านไดรเวอร์เครื่องพิมพ์</b><span>จอลูกค้า</span><b>รองรับ</b></div>
      <div class="fg" style="margin-top:10px"><label class="f">ทดสอบสแกนเนอร์: คลิกช่องนี้แล้วสแกน</label><input class="in" id="scanTest" placeholder="รอสแกน…"></div><div class="row"><button type="button" class="btn sm" id="dispT">🖥️ เปิดจอลูกค้า</button>${'serial' in navigator ? '<button type="button" class="btn sm" id="scaleT">⚖️ เชื่อมต่อเครื่องชั่ง (Web Serial)</button>' : ''}</div><p id="scaleOut" class="muted"></p>`)}
  </div></div>${edit ? '<div class="row" style="position:sticky;bottom:0;background:var(--bg);padding:10px 0"><span class="sp"></span><button class="btn p lg">💾 บันทึกการตั้งค่า</button></div>' : ''}</form>
  <div class="grid2"><div class="card"><h3 style="margin-top:0">🏬 ร้าน / สาขา</h3><table class="rtable">${S.shops.map(s => `<tr><td>${esc(s.name)}<br><small class="muted">${ROLE_NAME(s._role)}</small></td><td class="right">${s.id === sh.id ? '<span class="chip ok">ใช้งานอยู่</span>' : `<button class="btn sm" data-s="${s.id}">สลับ</button>`}</td></tr>`).join('')}</table><br>${can('owner') ? '<button class="btn" id="nb">+ เพิ่มสาขา</button>' : ''}</div>
  <div class="card"><h3 style="margin-top:0">👤 บัญชีผู้ใช้</h3><p>${esc(S.user.email)} · ${ROLE_NAME(S.role)}</p><div class="row">${canDo('manage_settings') ? '<button class="btn" id="bk">💾 สำรองข้อมูล (JSON)</button>' : ''}<button class="btn install" data-install>📲 ติดตั้งแอป</button>
    ${S.user.app_metadata?.provider === 'email' ? '<button class="btn" id="cpw">🔑 เปลี่ยนรหัสผ่าน</button>' : ''}<button class="btn bad" id="lo">ออกจากระบบ</button></div>
    <p class="muted" style="font-size:12px">เวอร์ชัน ${VERSION} · ข้อมูลส่วนบุคคลจัดเก็บตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA) — เข้าถึงได้เฉพาะพนักงานที่ได้รับสิทธิ์</p></div></div>`;
  $$('[data-pm]', pg).forEach(b => b.onclick = () => b.classList.toggle('on'));
  $$('[data-l]', pg).forEach(b => b.onclick = () => { LANG = b.dataset.l; localStorage.setItem('pos_lang', LANG); renderShell(); go('settings'); });
  $$('[data-s]', pg).forEach(b => b.onclick = () => { localStorage.setItem('pos_shop', b.dataset.s); S.cart = []; boot(); });
  if ($('#nb')) $('#nb').onclick = () => renderCreateShop(false);
  $('#lo').onclick = logout;
  $$('[data-install]', pg).forEach(b => b.onclick = installApp); updateInstallUI();
  $('#dispT').onclick = () => window.open('display.html', 'posdisplay', 'width=900,height=600');
  $('#scanTest').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); const p = S.products.find(x => x.barcode === v); toast(p ? `✓ สแกนได้: ${p.name}` : `สแกนได้: ${v} (ไม่พบสินค้า)`, p ? 'ok' : ''); sfx(p ? 'scan' : 'error'); e.target.value = ''; } };
  $('#testPrint').onclick = () => printReceipt(receiptHTML({ bill_no: 'TEST-0001', created_at: new Date().toISOString(), cashier_name: 'ทดสอบ', subtotal: 100, discount: 0, vat: sh.vat_mode === 'none' ? 0 : r2(100 * sh.vat_rate / (100 + num(sh.vat_rate))), total: 100, change: 0, payment_method: 'cash', _payments: [{ method: 'cash', amount: 100 }] }, [{ name: 'สินค้าทดสอบ', qty: 1, price: 100, discount: 0 }], null));
  if ($('#scaleT')) $('#scaleT').onclick = async () => {
    try { const port = await navigator.serial.requestPort(); await port.open({ baudRate: 9600 }); const rd = port.readable.getReader(); const dec = new TextDecoder(); let buf = '';
      $('#scaleOut').textContent = 'เชื่อมต่อแล้ว — วางสินค้าบนเครื่องชั่ง…';
      for (let i = 0; i < 40; i++) { const { value, done } = await rd.read(); if (done) break; buf += dec.decode(value); const mm = buf.match(/(\d+\.\d+)\s*(kg|g)?/i); if (mm) { $('#scaleOut').textContent = `น้ำหนัก: ${mm[1]} ${mm[2] || 'kg'}`; break; } }
      rd.releaseLock(); await port.close();
    } catch (e) { $('#scaleOut').textContent = 'เชื่อมต่อเครื่องชั่งไม่สำเร็จ: ' + e.message; }
  };
  if ($('#logoU')) $('#logoU').onclick = async () => { const fl = await pickImage(false); if (!fl) return; try { const u = await savePngLogo(fl); $('[name=logo_url]').value = u; $('#logoP').style.backgroundImage = `url('${u}')`; } catch (e) { fail(e); } };
  if ($('#logoX')) $('#logoX').onclick = () => { $('[name=logo_url]').value = ''; $('#logoP').style.backgroundImage = ''; };
  if ($('#cpw')) $('#cpw').onclick = () => formModal('เปลี่ยนรหัสผ่าน', [{ k: 'p1', label: 'รหัสผ่านใหม่', type: 'password', req: true }, { k: 'p2', label: 'ยืนยันรหัสผ่านใหม่', type: 'password', req: true }], {}, async o => {
    if (o.p1.length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัวอักษร'); if (o.p1 !== o.p2) throw new Error('รหัสผ่านไม่ตรงกัน'); const { error } = await sb.auth.updateUser({ password: o.p1 }); if (error) throw error; });
  if ($('#bk')) $('#bk').onclick = async () => { const id = S.shop.id; const out = { shop: sh, exported_at: new Date().toISOString() };
    for (const tb of ['categories', 'products', 'customers', 'suppliers', 'promotions', 'expenses', 'shifts', 'sales', 'sale_items', 'sale_payments', 'refunds', 'refund_items', 'stock_moves', 'purchases', 'purchase_items', 'cash_moves', 'customer_payments'])
      out[tb] = await fetchAll(() => sb.from(tb).select('*').eq('shop_id', id));
    download(`backup_shop_pos_${ymd(new Date())}.json`, JSON.stringify(out, null, 1), 'application/json'); };
  $('#stf').onsubmit = async e => {
    e.preventDefault(); if (!edit) return; const fm = e.target, o = {};
    ['name', 'phone', 'address', 'business_type', 'vat_mode', 'tax_id', 'branch_code', 'branch_name', 'receipt_size', 'receipt_header', 'receipt_footer', 'promptpay_id', 'era', 'logo_url'].forEach(k => { o[k] = fm[k].value.trim(); });
    ['vat_rate', 'points_per_baht', 'baht_per_point', 'decimals'].forEach(k => { o[k] = num(fm[k].value); });
    o.thai_digits = fm.thai_digits.checked; o.allow_negative_stock = fm.allow_negative_stock.checked;
    o.payment_methods = ['cash', 'promptpay'];
    if (!o.name) return toast('กรุณากรอกข้อมูลให้ครบถ้วน', 'bad');
    if (o.vat_mode !== 'none' && !/^\d{13}$/.test(o.tax_id)) return toast('ร้านที่จด VAT ต้องมีเลขประจำตัวผู้เสียภาษี 13 หลัก', 'bad');
    o.paper_width = o.receipt_size === '80' ? 80 : 58;
    try { const row = await q(sb.from('shops').update(o).eq('id', sh.id).select().single()); Object.assign(sh, row); toast('บันทึกข้อมูลเรียบร้อยแล้ว', 'ok');
      await sb.rpc('log_action', { p_shop: sh.id, p_action: 'settings', p_entity: 'shop', p_id: sh.name, p_detail: {} }); renderShell(); go('settings'); } catch (err) { fail(err); }
  };
};
async function savePngLogo(file) {
  const png = await toPng(file, 400); const path = `${S.shop.id}/logo-${Date.now()}.png`;
  const { error } = await sb.storage.from('product-images').upload(path, png, { contentType: 'image/png' }); if (error) throw error;
  return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

/* ================= PRODUCT FORM (extended) ================= */
const UNITS = ['ชิ้น', 'กล่อง', 'แพ็ก', 'กิโลกรัม', 'กรัม', 'ลิตร', 'มิลลิลิตร', 'ขวด', 'ถุง', 'จาน', 'ชุด', 'แก้ว', 'ห่อ', 'โหล', 'ลัง'];
productForm = function (p, after) {
  const isNew = !p.id, units = Array.isArray(p.units) ? p.units.map(u => ({ ...u })) : [];
  const canPrice = canDo('edit_prices') || isNew;
  const m = formModal(isNew ? 'เพิ่มสินค้า' : 'แก้ไขสินค้า', [
    { k: 'name', label: 'ชื่อสินค้า (ไทย)', req: true, full: true }, { k: 'name_en', label: 'ชื่อสินค้า (อังกฤษ)' }, { k: 'brand', label: 'ยี่ห้อ' },
    { k: 'barcode', label: 'บาร์โค้ด', after: `<button type="button" class="btn sm" id="pscan" style="margin-top:6px">📷 สแกน</button>` }, { k: 'sku', label: 'รหัสสินค้า (SKU)' },
    { k: 'category_id', label: 'หมวดหมู่', type: 'select', opts: [['', '—'], ...S.categories.map(c => [c.id, (c.icon ? c.icon + ' ' : '') + c.name])], after: '<button type="button" class="btn sm lnk" id="pcatm">⚙️ จัดการหมวดหมู่</button>' },
    { k: 'supplier_id', label: 'ผู้จำหน่ายหลัก', type: 'select', opts: [['', '—'], ...S.suppliers.map(s => [s.id, s.name])] },
    { k: 'unit', label: 'หน่วยนับหลัก', type: 'select', opts: [...new Set([p.unit || UNITS[0] || 'ชิ้น', ...UNITS])].map(u => [u, u]), after: '<button type="button" class="btn sm lnk" id="punitm">⚙️ จัดการหน่วยนับ</button>' },
    ...(canPrice ? [{ k: 'price', label: 'ราคาขายปลีก', type: 'number', req: true }, { k: 'promo_price', label: 'ราคาโปรโมชั่น (0 = ไม่ใช้)', type: 'number', def: 0 },
      { k: 'wholesale_price', label: 'ราคาขายส่ง', type: 'number', def: 0 }] : []),
    ...(canDo('view_profit') ? [{ k: 'cost', label: 'ราคาทุน', type: 'number', def: 0 }] : []),
    ...(isNew ? [{ k: 'stock', label: 'สต็อกเริ่มต้น', type: 'number', def: 0 }] : []),
    { k: 'low_stock', label: 'สต็อกขั้นต่ำ (แจ้งเตือน)', type: 'number', def: 5 }, { k: 'max_stock', label: 'สต็อกสูงสุด', type: 'number', def: 0 },
    { k: 'expiry_date', label: 'วันหมดอายุ (ถ้ามี)', type: 'date' }, { k: 'lot_no', label: 'เลขล็อต / แบทช์' },
    { k: 'image_url', label: 'รูปสินค้า', full: true, after: `<div class="row" style="margin-top:8px"><div id="pimgPrev" class="qm-img" style="width:72px;height:72px;${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}"></div>
      <button type="button" class="btn sm" id="pimgUp">🖼️ อัปโหลด</button><button type="button" class="btn sm" id="pimgCam">📸 ถ่ายรูป</button><button type="button" class="btn sm" id="pimgWeb">🔎 หาจากเว็บ</button><button type="button" class="btn sm" id="pimgX">×</button></div>` },
    { k: '_units', label: 'หน่วยขายเพิ่มเติม (เช่น แพ็ก 6 = 6 ชิ้น)', full: true, type: 'hidden', after: '<div id="uBox"></div><button type="button" class="btn sm" id="uAdd">➕ เพิ่มหน่วย</button>' },
    { k: 'tile_color', label: 'สีไทล์', type: 'color', def: catColor(p.category_id) }, { k: 'favorite', label: '★ รายการโปรด', type: 'check' },
    { k: 'track_stock', label: 'ตัดสต็อกเมื่อขาย', type: 'check', def: true }, { k: 'active', label: 'เปิดขาย', type: 'check', def: true },
  ], isNew ? { track_stock: true, active: true, unit: 'ชิ้น', ...p } : p, async o => {
    delete o._units; o.units = units.filter(u => u.unit && num(u.factor) > 0).map(u => ({ unit: u.unit, factor: num(u.factor), price: num(u.price) }));
    ['category_id', 'supplier_id', 'expiry_date'].forEach(k => { o[k] = o[k] || null; });
    ['cost', 'low_stock', 'max_stock', 'promo_price', 'wholesale_price'].forEach(k => { if (k in o) o[k] = num(o[k]); });
    if (isNew) {
      const st = num(o.stock); delete o.stock;
      const row = await q(sb.from('products').insert({ ...o, shop_id: S.shop.id }).select().single());
      if (st) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: row.id, p_kind: 'in', p_qty: st, p_cost: num(o.cost), p_supplier: o.supplier_id, p_note: 'สต็อกเริ่มต้น' })); row.stock = st; }
      S.products.push(row); toast('เพิ่มสินค้าเรียบร้อยแล้ว', 'ok');
    } else { const row = await q(sb.from('products').update(o).eq('id', p.id).select().single()); Object.assign(p, row); }
    S.products.sort((a, b) => a.name.localeCompare(b.name, 'th')); after?.();
  }, { extraFoot: isNew ? '' : `<button class="btn bad" id="pdel">ปิดการขาย / ลบ</button>` });
  const uDraw = () => { $('#uBox', m).innerHTML = units.map((u, i) => `<div class="split-row" style="grid-template-columns:1fr 1fr 1fr auto"><input class="in" placeholder="หน่วย" data-uu="${i}" value="${esc(u.unit || '')}" list="unitList">
      <input class="in" type="number" step="any" placeholder="= กี่หน่วยหลัก" data-uf="${i}" value="${u.factor ?? ''}"><input class="in" type="number" step="any" placeholder="ราคาขาย" data-up="${i}" value="${u.price ?? ''}"><button type="button" class="btn sm bad" data-ux="${i}">×</button></div>`).join('') + `<datalist id="unitList">${UNITS.map(u => `<option value="${u}">`).join('')}</datalist>`;
    $$('[data-uu]', m).forEach(x => x.oninput = () => units[+x.dataset.uu].unit = x.value); $$('[data-uf]', m).forEach(x => x.oninput = () => units[+x.dataset.uf].factor = x.value);
    $$('[data-up]', m).forEach(x => x.oninput = () => units[+x.dataset.up].price = x.value); $$('[data-ux]', m).forEach(x => x.onclick = () => { units.splice(+x.dataset.ux, 1); uDraw(); }); };
  $('#uAdd', m).onclick = () => { units.push({ unit: 'แพ็ก', factor: 6, price: '' }); uDraw(); }; uDraw();
  $('#pscan', m).onclick = () => scanBarcode(code => { $('[name=barcode]', m).value = code; });
  const setImg = u => { $('[name=image_url]', m).value = u; $('#pimgPrev', m).style.backgroundImage = u ? `url('${u}')` : ''; };
  const up = async cap => { const fl = await pickImage(cap); if (!fl) return; try { const png = await toPng(fl); const path = `${S.shop.id}/${uid()}.png`; const { error } = await sb.storage.from('product-images').upload(path, png, { contentType: 'image/png' }); if (error) throw error; setImg(sb.storage.from('product-images').getPublicUrl(path).data.publicUrl); } catch (e) { fail(e); } };
  $('#pimgUp', m).onclick = () => up(false); $('#pimgCam', m).onclick = () => up(true); $('#pimgX', m).onclick = () => setImg('');
  $('#pimgWeb', m).onclick = async () => { const name = $('[name=name]', m).value.trim(); if (!name) return toast('กรุณากรอกชื่อสินค้าก่อน', 'bad');
    const w = modal('🔎 ' + name, `<div class="picgrid" id="fw">${Array(8).fill('<i class="sk"></i>').join('')}</div>`, { wide: true });
    try { const imgs = await webImageSearch(name, $('[name=barcode]', m).value.trim());
      $('#fw', w).innerHTML = imgs.map((x, i) => `<button data-i="${i}"><img src="${esc(x.thumb)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></button>`).join('') || '<div class="empty">ไม่พบรูป</div>';
      $$('[data-i]', w).forEach(b => b.onclick = async () => { b.classList.add('busy'); try { let bl; try { bl = await webImageBlob(imgs[+b.dataset.i].url); } catch (e) { bl = await webImageBlob(imgs[+b.dataset.i].thumb); }
        const png = await toPng(bl); const path = `${S.shop.id}/${uid()}.png`; const { error } = await sb.storage.from('product-images').upload(path, png, { contentType: 'image/png' }); if (error) throw error;
        setImg(sb.storage.from('product-images').getPublicUrl(path).data.publicUrl); w.close(); } catch (e) { b.classList.remove('busy'); fail(e); } }); } catch (e) { fail(e); } };
  $('[name=image_url]', m).oninput = e => setImg(e.target.value.trim());
  if (!isNew) $('#pdel', m).onclick = async () => {
    if (!await confirmBox(`ปิดการขาย “${p.name}”? (สินค้าที่เคยขายแล้วจะถูกเก็บไว้ในประวัติ ไม่ถูกลบ)`)) return;
    try { await q(sb.from('products').update({ active: false }).eq('id', p.id)); p.active = false; m.close(); toast('ปิดการขายแล้ว', 'ok'); after?.(); } catch (e) { fail(e); }
  };
};

/* ================= DESIGN OVERRIDE — Option C (premium retail touchscreen) ================= */
const SVG = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  dashboard: SVG('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  pos: SVG('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.2L21 7.5H6"/>'),
  sales: SVG('<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>'),
  products: SVG('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  stock: SVG('<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>'),
  purchases: SVG('<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v3h16v-3"/>'),
  members: SVG('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>'),
  promotions: SVG('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
  suppliers: SVG('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'),
  expenses: SVG('<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h3"/>'),
  reports: SVG('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
  shifts: SVG('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 12h18M8 4h8"/><circle cx="12" cy="16" r="1.2"/>'),
  staff: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  audit: SVG('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  settings: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  more: SVG('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  bell: SVG('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  scan: SVG('<path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M16 8v8"/>'),
  plus: SVG('<path d="M12 5v14M5 12h14"/>'),
  cash: SVG('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
  qr: SVG('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>'),
  card: SVG('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  user: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  store: SVG('<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'),
};

/* ---------- shell: line icons, global search, branch, notifications, profile ---------- */
const _renderShellC = renderShell;
renderShell = function () {
  _renderShellC();
  $$('[data-p]').forEach(b => { const ic = b.querySelector('.ic'); if (ic && ICON[b.dataset.p]) ic.innerHTML = ICON[b.dataset.p]; });
  const mb = $('#moreBtn .ic'); if (mb) mb.innerHTML = ICON.more;
  const logo = $('.side .logo i'); if (logo) logo.innerHTML = ICON.store;
  const sb2 = $('#shopBtn'); if (sb2) sb2.innerHTML = ICON.store;
  const nm = S.shop._name || S.user.user_metadata?.full_name || S.user.user_metadata?.name || S.user.email.split('@')[0];
  $('#net')?.insertAdjacentHTML('beforebegin', `
    <div class="gsearch">${ICON.search}<input id="gq" placeholder="ค้นหาสินค้า หรือสแกนบาร์โค้ด…" autocomplete="off"><kbd>F2</kbd></div>
    <span class="branch" title="สาขา">${ICON.store}<span>${esc(S.shop.name)}<small>${branchLine(S.shop)}</small></span></span>`);
  $('#net')?.insertAdjacentHTML('afterend', `<button class="iconbtn bellbtn" id="bell" title="การแจ้งเตือน">${ICON.bell}<i id="bellN" class="hidden"></i></button>
    <button class="profile" id="prof"><span class="av">${esc(nm.slice(0, 1).toUpperCase())}</span><span class="pn">${esc(nm)}<small>${ROLE_NAME(S.role)}</small></span></button>`);
  const gq = $('#gq');
  gq.oninput = () => { if (S.page === 'pos') { S.search = gq.value; drawGrid(); } };
  gq.onkeydown = e => {
    if (e.key !== 'Enter') return; const v = gq.value.trim(); if (!v) return;
    let qty = 1, code = v; const mm = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qty = num(mm[1]); code = mm[2]; }
    const hit = S.products.find(p => p.active && (p.barcode === code || p.sku === code));
    if (S.page !== 'pos') { go('pos'); setTimeout(() => { if (hit) { sfx('scan'); addToCart(hit, qty); } else { S.search = v; $('#gq').value = v; drawGrid(); } }, 60); if (hit) gq.value = ''; return; }
    const list = filtered();
    if (hit) { sfx('scan'); addToCart(hit, qty); } else if (list.length === 1) addToCart(list[0], qty); else { if (!list.length) { sfx('error'); toast('ไม่พบสินค้าที่ค้นหา', 'bad'); } return; }
    gq.value = ''; S.search = ''; drawGrid();
  };
  $('#bell').onclick = showNotifications;
  $('#prof').onclick = profileMenu;
  refreshBell();
};
async function notifItems() {
  const items = [];
  const out = S.products.filter(p => p.active && p.track_stock && p.stock <= 0), low = S.products.filter(p => p.active && p.track_stock && p.stock > 0 && p.stock <= p.low_stock);
  if (out.length) items.push(['bad', '⛔', `สินค้าหมดสต็อก ${out.length} รายการ`, 'stock']);
  if (low.length) items.push(['warn', '⚠️', `สินค้าใกล้หมด ${low.length} รายการ`, 'stock']);
  const exp = S.products.filter(p => p.expiry_date && new Date(p.expiry_date) - Date.now() < 30 * 864e5);
  if (exp.length) items.push(['warn', '⌛', `สินค้าใกล้หมดอายุ ${exp.length} รายการ`, 'stock']);
  const oq = oqGet().filter(x => x.shop === S.shop.id).length; if (oq) items.push(['warn', '📶', `บิลออฟไลน์รอซิงก์ ${oq} บิล`, 'pos']);
  try { const { count } = await sb.from('sales').select('id', { count: 'exact', head: true }).eq('shop_id', S.shop.id).eq('pay_status', 'pending').neq('status', 'void');
    if (count) items.push(['warn', '⏳', `รอตรวจสอบการชำระเงิน ${count} บิล`, 'sales']); } catch (e) { /* offline */ }
  if (canDo('expenses')) try { const { count } = await sb.from('expenses').select('id', { count: 'exact', head: true }).eq('shop_id', S.shop.id).eq('status', 'pending');
    if (count) items.push(['info', '💸', `ค่าใช้จ่ายรออนุมัติ ${count} รายการ`, 'expenses']); } catch (e) { /* offline */ }
  return items;
}
async function refreshBell() { const n = (await notifItems()).length; const b = $('#bellN'); if (b) { b.textContent = n; b.classList.toggle('hidden', !n); } }
setInterval(() => S.shop && refreshBell(), 60000);
async function showNotifications() {
  const items = await notifItems();
  const m = modal('การแจ้งเตือน', items.length ? items.map(([c, ic, t, pg], i) => `<button class="notif ${c}" data-g="${pg}" style="--i:${i}"><span>${ic}</span><b>${t}</b><span class="muted">›</span></button>`).join('')
    : '<div class="empty">✓ ไม่มีการแจ้งเตือน</div>');
  $$('[data-g]', m).forEach(b => b.onclick = () => { m.close(); go(b.dataset.g); });
}
function profileMenu() {
  const nm = S.shop._name || S.user.user_metadata?.full_name || S.user.email.split('@')[0];
  const m = modal(nm, `<p class="muted" style="margin-top:0">${ROLE_NAME(S.role)} · ${esc(S.shop._username || S.user.email.split('@')[0])} · ${esc(S.shop.name)}</p>
    <div class="moregrid" style="grid-template-columns:repeat(3,1fr)">
      <button data-a="pw"><span>🔑</span>เปลี่ยนรหัสผ่าน</button><button data-a="theme"><span>${document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'}</span>โหมดสี</button>
      ${S.shops.length > 1 ? '<button data-a="shop"><span>🏬</span>สลับสาขา</button>' : ''}<button data-a="out"><span>🚪</span>ออกจากระบบ</button></div>`);
  $$('[data-a]', m).forEach(b => b.onclick = () => { m.close(); const a = b.dataset.a;
    if (a === 'pw') formModal('เปลี่ยนรหัสผ่าน', [{ k: 'p1', label: 'รหัสผ่านใหม่', type: 'password', req: true }, { k: 'p2', label: 'ยืนยันรหัสผ่านใหม่', type: 'password', req: true }], {}, async o => {
      if (o.p1.length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัวอักษร'); if (o.p1 !== o.p2) throw new Error('รหัสผ่านไม่ตรงกัน'); const { error } = await sb.auth.updateUser({ password: o.p1 }); if (error) throw error; });
    if (a === 'theme') setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    if (a === 'shop') go('settings');
    if (a === 'out') logout(); });
}
document.addEventListener('keydown', e => { if (e.key === 'F2' && S.page !== 'pos') { e.preventDefault(); $('#gq')?.focus(); } });

/* ---------- POS screen ---------- */
const _posView = VIEWS.pos;
VIEWS.pos = pg => {
  _posView(pg);
  pg.querySelector('.pos')?.classList.add('optc');
  const gq = $('#gq'); if (gq) { gq.value = S.search || ''; if (matchMedia('(min-width:861px)').matches) setTimeout(() => gq.focus(), 50); }
  const cats = $('#cats'); if (cats) {
    const place = () => { const on = cats.querySelector('.tab.on'); let ind = cats.querySelector('.cat-ind'); if (!ind) { ind = document.createElement('i'); ind.className = 'cat-ind'; cats.prepend(ind); }
      if (on) { ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`; ind.style.height = on.offsetHeight + 'px'; ind.style.top = on.offsetTop + 'px'; on.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' }); } };
    new MutationObserver(place).observe(cats, { childList: true }); requestAnimationFrame(place); window.addEventListener('resize', place);
  }
  if (matchMedia('(min-width:1600px)').matches && !pg.querySelector('.rprev')) pg.querySelector('.pos').insertAdjacentHTML('beforeend', '<aside class="rprev" id="rprev"></aside>');
  drawPreview();
};
const _productCardC = productCard;
productCard = function (p) {
  const h = _productCardC(p);
  const st = p.track_stock ? `<span class="stk ${p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'}">${p.stock <= 0 ? 'หมด' : 'คงเหลือ ' + qtyf(p.stock)}</span>` : '';
  return h.replace(/<div class="pr">([\s\S]*?)<\/div><\/div>$/, `<div class="pr"><b>${baht(num(p.promo_price) > 0 ? p.promo_price : p.price)}</b>${num(p.promo_price) > 0 ? `<s class="muted">${money(p.price)}</s>` : ''}<button class="qadd" title="เพิ่มลงตะกร้า">${ICON.plus}</button></div>${VIEWP.showStock ? `<div class="stkrow">${st}<small class="muted">${esc(p.unit)}</small></div>` : ''}</div>`);
};

/* ---------- cart ---------- */
const _drawCartC = drawCart;
drawCart = function () {
  _drawCartC();
  const el = $('#cart'); if (!el) return;
  const hds = el.querySelectorAll('.hd');
  if (hds[1] && !el.querySelector('.colhead') && S.cart.length) hds[1].insertAdjacentHTML('afterend', '<div class="colhead"><span>สินค้า</span><span>จำนวน</span><span>ราคา</span></div>');
  // customer card instead of small member button
  const mb = $('#memBtn', el);
  if (mb) { mb.classList.add('custbtn'); mb.innerHTML = S.customer ? `<span class="av sm">${esc(S.customer.name.slice(0, 1))}</span><span><b>${esc(S.customer.name)}</b><small>${qtyf(S.customer.points)} แต้ม${num(S.customer.balance) ? ' · ค้าง ' + money(S.customer.balance) : ''}</small></span>`
    : `<span class="av sm">${ICON.user}</span><span><b>ลูกค้าทั่วไป</b><small>แตะเพื่อเลือกสมาชิก</small></span>`; }
  // animated removal
  $$('[data-d]', el).forEach(b => { const old = b.onclick; b.onclick = () => { const l = S.cart[+b.dataset.d]; if (l && l.qty <= 1) { b.closest('.citem')?.classList.add('out'); setTimeout(old, 170); } else old(); }; });
  // payment quick tiles + big total
  const pay = $('#payBtn', el);
  if (pay && !el.querySelector('.paytiles')) {
    const TI = { cash: ICON.cash, promptpay: ICON.qr, transfer: ICON.card, credit_card: ICON.card, debit_card: ICON.card };
    const tiles = shopMethods().map(k => [k, TI[k] || ICON.card, payName(k)]);
    pay.insertAdjacentHTML('beforebegin', `<div class="paytiles">${tiles.map(([k, ic, l]) => `<button data-q="${k}" ${S.cart.length ? '' : 'disabled'}>${ic}<span>${l}</span></button>`).join('')}</div>`);
    $$('.paytiles [data-q]', el).forEach(b => b.onclick = () => { S._payPreset = b.dataset.q; payDialog(); });
  }
  drawPreview();
};
function drawPreview() {
  const box = $('#rprev'); if (!box) return;
  const c = calc(), sh = S.shop;
  box.innerHTML = `<div class="rp-h">ตัวอย่างใบเสร็จ</div><div class="rp-paper">
    <div class="c b">${esc(sh.name)}</div><div class="c muted" style="font-size:11px">${dLong(new Date())} · ${esc(S.shop._name || '')}</div>
    <div class="rp-cust">${S.customer ? `ลูกค้า: <b>${esc(S.customer.name)}</b>` : 'ลูกค้าทั่วไป'}</div>
    ${S.cart.length ? S.cart.map(l => `<div class="rp-l"><span>${esc(l.name)}<small>${qtyf(l.qty)} × ${money(l.price)}</small></span><b>${money(l.qty * l.price - num(l.discount))}</b></div>`).join('') : '<div class="muted c" style="padding:20px 0">ยังไม่มีสินค้า</div>'}
    <div class="rp-t"><span>ยอดรวม</span><span>${money(c.subtotal)}</span></div>${c.discount ? `<div class="rp-t"><span>ส่วนลด</span><span>-${money(c.discount)}</span></div>` : ''}
    ${sh.vat_mode !== 'none' ? `<div class="rp-t"><span>VAT ${num(sh.vat_rate)}%</span><span>${money(c.vat)}</span></div>` : ''}<div class="rp-t big"><span>ยอดสุทธิ</span><span>${baht(c.total)}</span></div>
    <div class="rp-bar"></div></div>`;
}

/* ---------- payment success feedback ---------- */
const _showReceiptC = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceiptC(sale, items, cust, autoPrint);
  const m = $$('.mbg').pop(); const mb = m?.querySelector('.mb'); if (!mb) return;
  mb.insertAdjacentHTML('afterbegin', `<div class="paid-ok"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg>
    <div><b>${sale.pay_status === 'pending' ? 'บันทึกแล้ว — รอตรวจสอบการชำระ' : 'ชำระเงินสำเร็จ'}</b><span>${esc(sale.bill_no)} · ${baht(sale.total)}${num(sale.change) ? ` · ทอน ${baht(sale.change)}` : ''}</span></div></div>`);
  mb.querySelector('.tline.big')?.remove();
};

const _goC = go;
go = function (page) { _goC(page); $('.top')?.classList.toggle('posmode', S.page === 'pos'); };
/* ================= Shop POS v4 — promotions engine, data center, barcodes, personal use,
   activity log, branding, receipt image, cashier upgrades, auto-update ================= */
const APP_VERSION = '5.0.4';
Object.assign(TH, { 'Data center': 'ศูนย์ข้อมูล', 'Barcodes': 'บาร์โค้ด', 'Branches': 'สาขา' });
PAGES.splice(PAGES.findIndex(p => p.id === 'settings'), 0,
  { id: 'barcodes', ic: '🏷', name: 'Barcodes', roles: ['owner', 'manager', 'stock'] },
  { id: 'data', ic: '🗂️', name: 'Data center', roles: ['owner', 'manager', 'stock'] },
  { id: 'branches', ic: '🏬', name: 'Branches', roles: ['owner'] });
Object.assign(PAGE_PERM, { barcodes: 'edit_products', data: 'edit_products', branches: 'manage_settings' });
Object.assign(PAGE_DESC, {
  barcodes: 'สินค้าที่มี / ไม่มีบาร์โค้ด · สร้างบาร์โค้ดอัตโนมัติ · พิมพ์ฉลากติดสินค้า',
  data: 'แม่แบบ Excel ทุกประเภท · นำเข้า / แก้ไขจำนวนมาก · สำรองและกู้คืนข้อมูลทั้งร้าน',
  branches: 'สาขาทั้งหมดของคุณ · เปรียบเทียบยอดขาย กำไร และสต็อกแต่ละสาขา',
  promotions: 'โปรโมชั่นรายสินค้า / หมวด / ทั้งบิล · ซื้อ X แถม Y · ราคาชุด · ช่วงวัน-เวลา',
});
ICON.data = SVG('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>');
ICON.barcodes = SVG('<path d="M3 5v14M6 5v14M10 5v14M13 5v14M17 5v14M21 5v14M8 5v14"/>');
ICON.branches = SVG('<path d="M3 21h18M5 21V10l4-3 4 3v11M13 21V6l3-2 3 2v15"/><path d="M8 13h2M8 17h2M15.5 10h1M15.5 14h1"/>');
MOVE.personal = ['🙋', 'เบิกใช้ส่วนตัว'];
Object.assign(AUDIT_L, {
  login: 'เข้าสู่ระบบ', logout: 'ออกจากระบบ', stock_in: 'รับสินค้าเข้า', stock_out: 'เบิกสินค้าออก', stock_personal: 'เบิกใช้ส่วนตัว',
  insert_products: 'เพิ่มสินค้า', delete_products: 'ลบสินค้า', insert_categories: 'เพิ่มหมวดหมู่', update_categories: 'แก้ไขหมวดหมู่', delete_categories: 'ลบหมวดหมู่',
  insert_customers: 'เพิ่มลูกค้า', update_customers: 'แก้ไขลูกค้า', delete_customers: 'ลบลูกค้า', insert_suppliers: 'เพิ่มผู้จำหน่าย', update_suppliers: 'แก้ไขผู้จำหน่าย', delete_suppliers: 'ลบผู้จำหน่าย',
  insert_promotions: 'สร้างโปรโมชั่น', update_promotions: 'แก้ไขโปรโมชั่น', delete_promotions: 'ลบโปรโมชั่น', insert_expenses: 'บันทึกค่าใช้จ่าย', update_expenses: 'แก้ไขค่าใช้จ่าย', delete_expenses: 'ลบค่าใช้จ่าย',
  import: 'นำเข้าข้อมูล', restore: 'กู้คืนข้อมูล', backup: 'สำรองข้อมูล', barcode_generate: 'สร้างบาร์โค้ด',
});
const ACT_GROUP = { login: 'เข้า/ออกระบบ', logout: 'เข้า/ออกระบบ', stock: 'สต็อก', product: 'สินค้า', sale: 'การขาย', staff: 'พนักงาน', data: 'ข้อมูล/ตั้งค่า', other: 'อื่นๆ' };
const actGroup = a => /^log(in|out)$/.test(a) ? 'login' : /^stock_|transfer|receive_purchase/.test(a) ? 'stock' : /product/.test(a) ? 'product'
  : /sale|refund|payment|tax_invoice|shift|cash_/.test(a) ? 'sale' : /^staff|permissions/.test(a) ? 'staff' : /import|restore|backup|settings|barcode/.test(a) ? 'data' : 'other';
const logAct = (action, entity, id, detail) => sb.rpc('log_action', { p_shop: S.shop.id, p_action: action, p_entity: entity || '', p_id: id || '', p_detail: detail || {} }).then(() => {}, () => {});
let H2C_P = null, JSB_P = null;
const loadH2C = () => (H2C_P ||= loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'));
const loadJsBarcode = () => (JSB_P ||= loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'));
function saveBlob(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
const safeName = s => String(s).replace(/[^\w.\-]+/g, '_');

/* ===================================================================== PROMOTIONS ENGINE */
const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const PKIND = { percent: 'ลด %', amount: 'ลดบาท / ชิ้น', fixed_price: 'ราคาพิเศษ / ชิ้น', bxgy: 'ซื้อ X แถม Y', bundle: 'ซื้อ X ชิ้น ราคาพิเศษ ฿ (เช่น 3 ชิ้น 100)' };
const PSCOPE = { product: 'เฉพาะสินค้าที่เลือก', category: 'ทั้งหมวดหมู่', bill: 'ทั้งบิล' };
const arr = v => Array.isArray(v) ? v : [];
function promoLive(p, now = new Date()) {
  if (!p || !p.active) return false;
  const d = ymd(now);
  if (p.starts_on && p.starts_on > d) return false;
  if (p.ends_on && p.ends_on < d) return false;
  if (arr(p.days).length && !arr(p.days).map(Number).includes(now.getDay())) return false;
  const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  if (p.time_from && hm < p.time_from) return false;
  if (p.time_to && hm > p.time_to) return false;
  if (p.members_only && !S.customer) return false;
  return true;
}
const promoHits = (pr, prod) => prod && (pr.scope === 'product' ? arr(pr.product_ids).includes(prod.id) : pr.scope === 'category' ? arr(pr.category_ids).includes(prod.category_id) : false);
function promoLineDisc(pr, qty, price) {
  const v = num(pr.value), q2 = num(qty), p = num(price);
  switch (pr.kind) {
    case 'percent': return p * q2 * Math.min(100, v) / 100;
    case 'amount': return Math.min(p, v) * q2;
    case 'fixed_price': return Math.max(0, p - v) * q2;
    case 'bxgy': { const b = num(pr.buy_qty) || 1, g = num(pr.get_qty) || 1; return Math.floor(q2 / (b + g)) * g * p; }
    case 'bundle': { const b = num(pr.buy_qty) || 2; return Math.max(0, Math.floor(q2 / b) * (b * p - v)); }
  }
  return 0;
}
const promoLabel = pr => pr.kind === 'percent' ? `ลด ${num(pr.value)}%` : pr.kind === 'amount' ? `ลด ฿${money(pr.value)}` : pr.kind === 'fixed_price' ? `เหลือ ฿${money(pr.value)}`
  : pr.kind === 'bxgy' ? `ซื้อ ${num(pr.buy_qty) || 1} แถม ${num(pr.get_qty) || 1}` : pr.kind === 'bundle' ? `ซื้อ ${num(pr.buy_qty) || 2} ชิ้น ฿${money(pr.value)}${pr.mix ? ' (คละได้)' : ''}` : '';
function itemPromosFor(prod) { return S.promotions.filter(p => (p.scope || 'bill') !== 'bill' && promoLive(p) && promoHits(p, prod)); }
function applyItemPromos() {
  S.cart.forEach(l => {
    l._pd = 0; l._pn = '';
    const prod = S.products.find(x => x.id === l.product_id); if (!prod || l.noPromo) return;
    for (const pr of itemPromosFor(prod)) {
      if (pr.kind === 'bundle' && pr.mix) continue;
      const d = r2(Math.min(promoLineDisc(pr, l.qty, l.price), l.price * l.qty - num(l.discount)));
      if (d > l._pd) { l._pd = d; l._pn = pr.name; }
    }
  });
  // mix & match: "buy X (any items in this promo) for ฿Y" — counted across all matching cart lines
  for (const pr of S.promotions.filter(p => p.kind === 'bundle' && p.mix && (p.scope || 'bill') !== 'bill' && promoLive(p))) {
    const X = num(pr.buy_qty) || 2, Y = num(pr.value);
    const lines = S.cart.filter(l => !l.noPromo && promoHits(pr, S.products.find(x => x.id === l.product_id)));
    const units = []; lines.forEach(l => { for (let i = 0; i < Math.floor(num(l.qty)); i++) units.push(l); });
    const sets = Math.floor(units.length / X); if (!sets) continue;
    units.sort((a, b) => num(b.price) - num(a.price));
    const used = units.slice(0, sets * X), full = used.reduce((a, l) => a + num(l.price), 0), disc = full - sets * Y;
    if (disc <= 0) continue;
    const per = new Map(); used.forEach(l => per.set(l, (per.get(l) || 0) + num(l.price)));
    per.forEach((amt, l) => { const d = r2(Math.min(disc * amt / full, l.price * l.qty - num(l.discount))); if (d > l._pd) { l._pd = d; l._pn = pr.name; } });
  }
}
calc = function () {
  applyItemPromos();
  const sh = S.shop;
  const gross = r2(S.cart.reduce((a, l) => a + l.price * l.qty - num(l.discount), 0));
  const itemPromo = r2(S.cart.reduce((a, l) => a + num(l._pd), 0));
  const subtotal = r2(gross - itemPromo);
  const billDiscOf = p => p.kind === 'percent' ? subtotal * num(p.value) / 100 : num(p.value);
  const okBill = p => p && (p.scope || 'bill') === 'bill' && promoLive(p) && subtotal >= num(p.min_total);
  let pr = S.promo && okBill(S.promo) ? S.promo : null;
  if (!S.promo && !S.promoOff) pr = S.promotions.filter(p => p.auto && okBill(p)).sort((a, b) => billDiscOf(b) - billDiscOf(a))[0] || null;
  const promoDisc = pr ? billDiscOf(pr) : 0;
  S._billPromo = pr && promoDisc > 0 ? pr.name : '';
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
  return { gross, itemPromo, subtotal, promoDisc: r2(promoDisc), billDisc: r2(billDisc), pointsUse, pointsDisc: r2(pointsDisc), discount, vat, total, pointsEarned };
};

/* sale payload: item promo → line discount, custom items, promo names */
const _submitSale4 = submitSale;
submitSale = async function (payload) {
  if (!payload._v4) {
    payload._v4 = 1;
    payload.items = (payload.items || []).map((it, i) => {
      const l = S.cart[i], o = { ...it };
      if (l && num(l._pd)) { o.discount = r2(num(o.discount) + num(l._pd)); o.promo = l._pn; }
      if (String(o.product_id || '').startsWith('c_')) { o.product_id = null; o.cost = num(l?.cost); }
      return o;
    });
    const names = [...new Set(S.cart.map(l => l._pn).filter(Boolean))]; if (S._billPromo) names.push(S._billPromo);
    payload.promo = names.join(', ');
    if (S._billPromo && !payload.note) payload.note = 'โปรโมชั่น: ' + S._billPromo;
  }
  const r = await _submitSale4(payload);
  S.cart.forEach(l => { if (num(l._pd)) { l.discount = r2(num(l.discount) + l._pd); l.promo = l._pn; l._pd = 0; l.noPromo = true; } });
  return r;
};

/* cart: promo tags, wholesale mode, custom item */
const _drawCart4 = drawCart;
drawCart = function () {
  _drawCart4();
  const el = $('#cart'); if (!el) return;
  const c = calc();
  $$('#promoSel option', el).forEach(o => { const p = S.promotions.find(x => x.id === o.value); if (p && (p.scope || 'bill') !== 'bill') o.remove(); });
  if (!S.promo && S._billPromo) { const sel = $('#promoSel', el); if (sel) sel.options[0].textContent = '🏷️ อัตโนมัติ: ' + S._billPromo; }
  $$('.citem', el).forEach(row => {
    const i = +($('[data-i]', row)?.dataset.i ?? -1), l = S.cart[i]; if (!l) return;
    if (num(l._pd)) {
      $('.nm', row).insertAdjacentHTML('beforeend', `<small class="ptag">🏷️ ${esc(l._pn)} −${money(l._pd)}</small>`);
      const b = row.querySelector(':scope > b'); if (b) b.innerHTML = `<s class="muted" style="font-size:11px;font-weight:400">${money(l.price * l.qty - num(l.discount))}</s><br>${money(l.price * l.qty - num(l.discount) - l._pd)}`;
    }
    if (String(l.product_id).startsWith('c_')) $('.nm', row).insertAdjacentHTML('beforeend', '<small class="ptag" style="background:var(--infosoft);color:var(--info)">สินค้านอกระบบ</small>');
  });
  const ft = $('.ft', el);
  if (ft && c.itemPromo > 0) ft.insertAdjacentHTML('afterbegin', `<div class="tline" style="color:var(--ok)"><span>🏷️ ประหยัดจากโปรโมชั่นสินค้า</span><span>−${money(c.itemPromo)}</span></div>`);
  const hd = $('.hd', el);
  if (hd && !$('#wsBtn', el)) {
    hd.insertAdjacentHTML('beforeend', `<button class="btn sm ${S.wholesale ? 'p' : ''}" id="wsBtn" title="ราคาส่ง">${S.wholesale ? '📦 ราคาส่ง' : '📦'}</button>`);
    $('#wsBtn', el).onclick = () => { S.wholesale = !S.wholesale; S.cart.forEach(l => repriceLine(l)); toast(S.wholesale ? 'โหมดราคาส่ง — ใช้ราคาส่งกับสินค้าที่ตั้งไว้' : 'กลับเป็นราคาปลีก', 'ok'); drawCart(); };
  }
  if ($('[data-u]', el)) $$('[data-u]', el).forEach(b => { const l = S.cart[+b.dataset.u]; if (l && String(l.product_id).startsWith('c_')) b.onclick = () => { l.qty++; sfx('add'); drawCart(); }; });
};
function repriceLine(l) {
  const p = S.products.find(x => x.id === l.product_id); if (!p || l.unit) return;
  const retail = num(p.promo_price) > 0 ? num(p.promo_price) : num(p.price);
  l.price = S.wholesale && num(p.wholesale_price) > 0 ? num(p.wholesale_price) : retail;
}
const _addToCart4 = addToCart;
addToCart = function (p, qty = 1, u = null) {
  _addToCart4(p, qty, u);
  if (S.wholesale && p && !u) { const l = S.cart.find(x => x.product_id === p.id && !x.unit); if (l) { repriceLine(l); drawCart(); } }
};
const _resetSale4 = resetSale;
resetSale = function () { S.promoOff = false; _resetSale4(); };
function customItem() {
  formModal('สินค้านอกระบบ / ขายด่วน', [
    { k: 'name', label: 'ชื่อสินค้า', req: true, full: true }, { k: 'price', label: 'ราคาขาย / หน่วย', type: 'number', req: true },
    { k: 'qty', label: 'จำนวน', type: 'number', def: 1 }, { k: 'cost', label: 'ต้นทุน / หน่วย (ถ้าทราบ)', type: 'number', def: 0 }], { qty: 1 }, async o => {
    if (!(num(o.price) >= 0) || !o.name) throw new Error('กรุณากรอกชื่อและราคา');
    const id = 'c_' + uid();
    S.cart.push({ product_id: id, id, name: o.name, price: num(o.price), qty: num(o.qty) || 1, discount: 0, unit: '', factor: 1, cost: num(o.cost) });
    sfx('add'); drawCart();
  });
}

/* product card: promo ribbon */
const _productCard4 = productCard;
productCard = function (p) {
  const h = _productCard4(p);
  const pr = itemPromosFor(p)[0];
  return pr ? h.replace('<button class="more"', `<i class="promo-rb">🏷️ ${esc(promoLabel(pr))}</i><button class="more"`) : h;
};

/* ===================================================================== POS screen upgrades */
const _posView4 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView4(pg);
  const vb = $('#viewBtn'); if (!vb || $('#zctl')) return;
  vb.insertAdjacentHTML('afterend', `<div class="zctl" id="zctl" title="ขนาดรูปสินค้า">
      <button type="button" data-z="-20" aria-label="เล็กลง">−</button>
      <input type="range" id="zr" min="100" max="560" step="10" value="${VIEWP.size}" aria-label="ขนาดรูปสินค้า">
      <button type="button" data-z="20" aria-label="ใหญ่ขึ้น">+</button>
      <button type="button" id="zlay" title="ตาราง / รายการ">${VIEWP.layout === 'list' ? '▦' : '☰'}</button></div>
    <button class="btn" id="custBtn" title="สินค้านอกระบบ">➕ <span class="hide-sm">ขายด่วน</span></button>
    <div class="zpre" id="zpre">${[[110, 'S'], [160, 'M'], [220, 'L'], [300, 'XL'], [400, 'XXL'], [520, 'จัมโบ้']].map(([v, l]) => `<button type="button" data-zs="${v}" class="${VIEWP.size === v ? 'on' : ''}">${l}</button>`).join('')}</div>`);
  const setSize = v => { VIEWP.size = Math.max(100, Math.min(560, v)); $$('#zpre [data-zs]').forEach(b => b.classList.toggle('on', +b.dataset.zs === VIEWP.size)); $('#zr').value = VIEWP.size; localStorage.setItem('pos_view', JSON.stringify(VIEWP)); applyView(); };
  $('#zr').oninput = e => setSize(+e.target.value);
  $$('#zctl [data-z]').forEach(b => b.onclick = () => setSize(VIEWP.size + +b.dataset.z));
  $('#zlay').onclick = () => { VIEWP.layout = VIEWP.layout === 'list' ? 'grid' : 'list'; saveView(); $('#zlay').textContent = VIEWP.layout === 'list' ? '▦' : '☰'; };
  $('#custBtn').onclick = customItem;
  $$('#zpre [data-zs]').forEach(b => b.onclick = () => setSize(+b.dataset.zs));
};
drawPreview = function () {
  const box = $('#rprev'); if (!box) return;
  const c = calc(), sh = S.shop;
  box.innerHTML = `<div class="rp-h">ตัวอย่างใบเสร็จ</div><div class="rp-paper">
    ${sh.logo_url ? `<div class="c"><img src="${esc(sh.logo_url)}" alt="" style="max-height:40px;max-width:120px"></div>` : ''}
    <div class="c b">${esc(sh.name)}</div><div class="c muted" style="font-size:11px">${dLong(new Date())} · ${esc(S.shop._name || '')}</div>
    <div class="rp-cust">${S.customer ? `ลูกค้า: <b>${esc(S.customer.name)}</b>` : 'ลูกค้าทั่วไป'}</div>
    ${S.cart.length ? S.cart.map(l => `<div class="rp-l"><span>${esc(l.name)}<small>${qtyf(l.qty)} × ${money(l.price)}${l._pd ? ` · 🏷️ −${money(l._pd)}` : ''}</small></span><b>${money(l.qty * l.price - num(l.discount) - num(l._pd))}</b></div>`).join('') : '<div class="muted c" style="padding:20px 0">ยังไม่มีสินค้า</div>'}
    <div class="rp-t"><span>ยอดรวม</span><span>${money(c.subtotal)}</span></div>${c.discount ? `<div class="rp-t"><span>ส่วนลด${S._billPromo ? ' (' + esc(S._billPromo) + ')' : ''}</span><span>-${money(c.discount)}</span></div>` : ''}
    ${sh.vat_mode !== 'none' ? `<div class="rp-t"><span>VAT ${num(sh.vat_rate)}%</span><span>${money(c.vat)}</span></div>` : ''}<div class="rp-t big"><span>ยอดสุทธิ</span><span>${baht(c.total)}</span></div>
    <div class="rp-bar"></div></div>`;
};

/* ===================================================================== RECEIPT IMAGE (gallery) */
async function receiptImage(sale, { auto = false } = {}) {
  const box = $$('.mbg').pop()?.querySelector('.rcptbox'); if (!box) return;
  try {
    await loadH2C();
    const node = box.firstElementChild || box;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const name = safeName(`receipt_${sale.bill_no || ymd(new Date())}.png`);
    const file = new File([blob], name, { type: 'image/png' });
    if (!auto && navigator.canShare?.({ files: [file] }) && matchMedia('(pointer:coarse)').matches) {
      try { await navigator.share({ files: [file], title: 'ใบเสร็จ ' + (sale.bill_no || '') }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    saveBlob(name, blob);
    toast(auto ? 'บันทึกรูปใบเสร็จอัตโนมัติแล้ว (โฟลเดอร์ดาวน์โหลด / แกลเลอรี)' : 'บันทึกรูปใบเสร็จแล้ว', 'ok');
  } catch (e) { if (!auto) fail(e); }
}
const _showReceipt4 = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceipt4(sale, items, cust, autoPrint);
  const mf = $$('.mbg').pop()?.querySelector('.mf');
  if (mf && !$('#rimg', mf)) { mf.insertAdjacentHTML('afterbegin', '<button class="btn" id="rimg">🖼️ บันทึกเป็นรูป</button>'); $('#rimg', mf).onclick = () => receiptImage(sale); }
  if (S.shop.auto_save_receipt && sale.created_at && Date.now() - new Date(sale.created_at) < 120000) setTimeout(() => receiptImage(sale, { auto: true }), 500);
};

/* ===================================================================== PROMOTIONS PAGE */
VIEWS.promotions = pg => {
  const edit = canDo('promotions');
  $('#tact').innerHTML = edit ? '<button class="btn p" id="npr">+ สร้างโปรโมชั่น</button>' : '';
  const draw = () => {
    const now = new Date();
    const st = p => !p.active ? ['ปิด', ''] : promoLive({ ...p, members_only: false }, now) ? ['ใช้งานอยู่', 'ok'] : (p.ends_on && p.ends_on < ymd(now)) ? ['หมดอายุ', 'bad'] : ['รอเวลา', 'warn'];
    const target = p => p.scope === 'product' ? arr(p.product_ids).map(id => S.products.find(x => x.id === id)?.name).filter(Boolean).slice(0, 3).join(', ') + (arr(p.product_ids).length > 3 ? ` +${arr(p.product_ids).length - 3}` : '')
      : p.scope === 'category' ? arr(p.category_ids).map(id => S.categories.find(x => x.id === id)?.name).filter(Boolean).join(', ') : `ยอดขั้นต่ำ ฿${money(p.min_total)}`;
    pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">ใช้งานอยู่ตอนนี้</div><div class="v">${S.promotions.filter(p => st(p)[1] === 'ok').length}</div></div>
      <div class="stat"><div class="k">โปรสินค้า / หมวด</div><div class="v">${S.promotions.filter(p => (p.scope || 'bill') !== 'bill').length}</div></div>
      <div class="stat"><div class="k">โปรทั้งบิล</div><div class="v">${S.promotions.filter(p => (p.scope || 'bill') === 'bill').length}</div></div></div>
      <p class="muted" style="font-size:13px">โปรสินค้า/หมวดหมู่ ใช้ให้อัตโนมัติเมื่อสินค้าอยู่ในตะกร้า · โปรทั้งบิลเลือกได้ในตะกร้า หรือเปิด “ใช้อัตโนมัติ” · ดูผลโปรในรายงาน “โปรโมชั่น”</p>
      ${S.promotions.length ? `<div class="tblwrap"><table class="tbl"><tr><th>ชื่อ</th><th>ประเภท</th><th>ใช้กับ</th><th>เงื่อนไข</th><th>ช่วงเวลา</th><th>สถานะ</th><th></th></tr>
      ${S.promotions.map(p => { const s = st(p); return `<tr><td><b>${esc(p.name)}</b>${p.members_only ? ' <span class="chip">⭐ สมาชิก</span>' : ''}${p.auto && (p.scope || 'bill') === 'bill' ? ' <span class="chip">อัตโนมัติ</span>' : ''}</td>
        <td>${esc(PKIND[p.kind] || p.kind)}<br><small class="muted">${esc(promoLabel(p))}</small></td><td>${esc(PSCOPE[p.scope || 'bill'])}<br><small class="muted">${esc(target(p))}</small></td>
        <td><small>${num(p.min_total) ? 'ขั้นต่ำ ฿' + money(p.min_total) : '—'}</small></td>
        <td><small>${p.starts_on || p.ends_on ? `${p.starts_on ? dOnly(p.starts_on) : '…'} – ${p.ends_on ? dOnly(p.ends_on) : '…'}` : 'ไม่จำกัดวัน'}<br>${arr(p.days).length ? arr(p.days).map(d => DAYS_TH[d]).join(' ') : 'ทุกวัน'}${p.time_from || p.time_to ? ` · ${p.time_from || '00:00'}–${p.time_to || '23:59'}` : ''}</small></td>
        <td><span class="chip ${s[1]}">${s[0]}</span></td>
        <td class="right" style="white-space:nowrap">${edit ? `<button class="btn sm" data-e="${p.id}">แก้ไข</button> <button class="btn sm" data-t="${p.id}">${p.active ? 'ปิด' : 'เปิด'}</button> <button class="btn sm bad" data-x="${p.id}">ลบ</button>` : ''}</td></tr>`; }).join('')}</table></div>`
      : '<div class="empty">🏷️<br>ยังไม่มีโปรโมชั่น — กด “สร้างโปรโมชั่น”</div>'}`;
    $$('[data-e]', pg).forEach(b => b.onclick = () => promoForm(S.promotions.find(p => p.id === b.dataset.e), draw));
    $$('[data-t]', pg).forEach(b => b.onclick = async () => { const p = S.promotions.find(x => x.id === b.dataset.t);
      try { Object.assign(p, await q(sb.from('promotions').update({ active: !p.active }).eq('id', p.id).select().single())); draw(); } catch (e) { fail(e); } });
    $$('[data-x]', pg).forEach(b => b.onclick = async () => { const p = S.promotions.find(x => x.id === b.dataset.x);
      if (!await confirmBox(`ลบโปรโมชั่น “${p.name}” ?`)) return;
      try { await q(sb.from('promotions').delete().eq('id', p.id)); S.promotions = S.promotions.filter(x => x.id !== p.id); draw(); } catch (e) { fail(e); } });
  };
  if ($('#npr')) $('#npr').onclick = () => promoForm(null, draw);
  draw();
};
function promoForm(p, after) {
  const o = p ? { ...p } : { name: '', scope: 'product', kind: 'percent', value: 10, buy_qty: 1, get_qty: 1, min_total: 0, members_only: false, active: true, auto: false, days: [], product_ids: [], category_ids: [], time_from: '', time_to: '', starts_on: '', ends_on: '', note: '' };
  const sel = new Set(arr(o.product_ids)), cats = new Set(arr(o.category_ids)), days = new Set(arr(o.days).map(Number));
  const m = modal(p ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่น', `<form id="pf">
    <div class="ptpl"><span class="muted">เริ่มเร็ว:</span><button type="button" data-tp="b3">🛒 ซื้อ 3 ราคา 100</button><button type="button" data-tp="b3mix">🧺 คละ 3 ชิ้น 100</button><button type="button" data-tp="bxgy">🎁 ซื้อ 2 แถม 1</button><button type="button" data-tp="pct">％ ลด 10%</button><button type="button" data-tp="fix">🏷️ ราคาพิเศษ/ชิ้น</button></div>
    <div class="fg"><label class="f">ชื่อโปรโมชั่น *</label><input class="in" name="name" required value="${esc(o.name)}" placeholder="เช่น ซื้อ 2 แถม 1 น้ำดื่ม"></div>
    <div class="grid2"><div class="fg"><label class="f">ใช้กับ</label><select class="in" name="scope">${Object.entries(PSCOPE).map(([k, l]) => `<option value="${k}" ${o.scope === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">รูปแบบ</label><select class="in" name="kind"></select></div></div>
    <div class="grid2"><div class="fg" id="fv"><label class="f" id="lv">ค่า</label><input class="in" name="value" type="number" step="any" value="${num(o.value)}"></div>
      <div class="fg" id="fb"><label class="f" id="lb">ซื้อ (ชิ้น)</label><input class="in" name="buy_qty" type="number" step="1" min="1" value="${num(o.buy_qty) || 1}"></div>
      <div class="fg" id="fg"><label class="f">แถม (ชิ้น)</label><input class="in" name="get_qty" type="number" step="1" min="1" value="${num(o.get_qty) || 1}"></div>
      <label class="row fg" id="fmix" style="grid-column:1/-1"><input type="checkbox" name="mix" ${o.mix ? 'checked' : ''}> 🧺 คละสินค้าได้ — นับรวมทุกสินค้าในโปรนี้ (เช่น น้ำ A 1 + น้ำ B 2 = 3 ชิ้น ได้ราคา 100)</label>
      <div class="fg" id="fm"><label class="f">ยอดซื้อขั้นต่ำ (บาท)</label><input class="in" name="min_total" type="number" step="any" value="${num(o.min_total)}"></div></div>
    <div id="pick"></div>
    <div class="fg"><label class="f">วันที่ใช้ได้ (ไม่เลือก = ทุกวัน)</label><div class="pills" id="pd">${DAYS_TH.map((d, i) => `<button type="button" data-d="${i}" class="${days.has(i) ? 'on' : ''}">${d}</button>`).join('')}</div></div>
    <div class="grid2"><div class="fg"><label class="f">เวลาเริ่ม (ไม่ระบุ = ทั้งวัน)</label><input class="in" type="time" name="time_from" value="${esc(o.time_from)}"></div>
      <div class="fg"><label class="f">เวลาสิ้นสุด</label><input class="in" type="time" name="time_to" value="${esc(o.time_to)}"></div>
      <div class="fg"><label class="f">วันเริ่ม</label><input class="in" type="date" name="starts_on" value="${esc(o.starts_on || '')}"></div>
      <div class="fg"><label class="f">วันสิ้นสุด</label><input class="in" type="date" name="ends_on" value="${esc(o.ends_on || '')}"></div></div>
    <label class="row"><input type="checkbox" name="members_only" ${o.members_only ? 'checked' : ''}> เฉพาะสมาชิก</label>
    <label class="row" id="fa"><input type="checkbox" name="auto" ${o.auto ? 'checked' : ''}> ใช้อัตโนมัติเมื่อยอดถึงขั้นต่ำ (โปรทั้งบิล)</label>
    <label class="row"><input type="checkbox" name="active" ${o.active ? 'checked' : ''}> เปิดใช้งาน</label>
    <div class="fg"><label class="f">หมายเหตุ</label><input class="in" name="note" value="${esc(o.note || '')}"></div>
    <div class="card" id="pprev" style="background:var(--brandsoft);margin-top:8px"></div></form>`,
    { wide: true, foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="psv">💾 บันทึก</button>` });
  const f = $('#pf', m);
  const kinds = () => f.scope.value === 'bill' ? ['percent', 'amount'] : Object.keys(PKIND);
  const fillKinds = () => { const cur = f.kind.value || o.kind; f.kind.innerHTML = kinds().map(k => `<option value="${k}" ${k === cur ? 'selected' : ''}>${f.scope.value === 'bill' && k === 'amount' ? 'ลดเป็นบาท (ทั้งบิล)' : PKIND[k]}</option>`).join(''); };
  const drawPick = () => {
    const sc = f.scope.value, box = $('#pick', m);
    if (sc === 'bill') { box.innerHTML = ''; return; }
    if (sc === 'category') { box.innerHTML = `<div class="fg"><label class="f">เลือกหมวดหมู่ (${cats.size})</label><div class="pills">${S.categories.map(c => `<button type="button" data-cat="${c.id}" class="${cats.has(c.id) ? 'on' : ''}">${esc(c.name)}</button>`).join('') || '<span class="muted">ยังไม่มีหมวดหมู่</span>'}</div></div>`;
      $$('[data-cat]', box).forEach(b => b.onclick = () => { cats.has(b.dataset.cat) ? cats.delete(b.dataset.cat) : cats.add(b.dataset.cat); drawPick(); preview(); }); return; }
    box.innerHTML = `<div class="fg"><label class="f">เลือกสินค้า (${sel.size} รายการ)</label><div class="sbox"><span>🔍</span><input class="in" id="ps" placeholder="ค้นหาชื่อ / บาร์โค้ด"></div>
      <div id="pl" style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:12px;margin-top:6px"></div></div>`;
    const list = () => { const v = $('#ps', box).value.toLowerCase();
      const rows = S.products.filter(p => p.active && (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v))).sort((a, b) => (sel.has(b.id) - sel.has(a.id)) || a.name.localeCompare(b.name, 'th')).slice(0, 150);
      $('#pl', box).innerHTML = rows.map(p => `<label class="row" style="padding:7px 10px;border-bottom:1px solid var(--line);gap:10px"><input type="checkbox" data-pid="${p.id}" ${sel.has(p.id) ? 'checked' : ''}>
        <span style="flex:1">${esc(p.name)}</span><small class="muted">฿${money(p.price)}</small></label>`).join('') || '<div class="muted" style="padding:10px">ไม่พบสินค้า</div>';
      $$('[data-pid]', box).forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.pid) : sel.delete(c.dataset.pid); $('label.f', box).textContent = `เลือกสินค้า (${sel.size} รายการ)`; preview(); }); };
    $('#ps', box).oninput = list; list();
  };
  const preview = () => {
    const k = f.kind.value, sc = f.scope.value;
    $('#fb', m).style.display = ['bxgy', 'bundle'].includes(k) ? '' : 'none';
    $('#fg', m).style.display = k === 'bxgy' ? '' : 'none';
    $('#fv', m).style.display = k === 'bxgy' ? 'none' : '';
    $('#fmix', m).style.display = k === 'bundle' && sc !== 'bill' ? '' : 'none';
    $('#fm', m).style.display = sc === 'bill' ? '' : 'none';
    $('#fa', m).style.display = sc === 'bill' ? '' : 'none';
    $('#lv', m).textContent = { percent: 'ส่วนลด (%)', amount: 'ลด (บาท)', fixed_price: 'ราคาพิเศษ / ชิ้น (บาท)', bundle: 'ราคาพิเศษรวม (บาท) — เช่น 100' }[k] || 'ค่า';
    $('#lb', m).textContent = k === 'bundle' ? 'ซื้อครบ (ชิ้น) — เช่น 3' : 'ซื้อ (ชิ้น)';
    const t0 = { kind: k, value: num(f.value.value), buy_qty: num(f.buy_qty.value), get_qty: num(f.get_qty.value), mix: f.mix.checked };
    const ex = sc === 'bill' ? '' : (() => { const p0 = S.products.find(p => sel.has(p.id)) || S.products.find(p => cats.has(p.category_id)); if (!p0) return '';
      const q0 = k === 'bxgy' ? (t0.buy_qty || 1) + (t0.get_qty || 1) : k === 'bundle' ? (t0.buy_qty || 2) : 1;
      const d = promoLineDisc(t0, q0, num(p0.promo_price) > 0 ? p0.promo_price : p0.price);
      return `<br>ตัวอย่าง: ${esc(p0.name)} × ${q0} = ฿${money(q0 * (num(p0.promo_price) > 0 ? p0.promo_price : p0.price))} → ลด ฿${money(d)} จ่าย <b>฿${money(q0 * (num(p0.promo_price) > 0 ? p0.promo_price : p0.price) - d)}</b>`; })();
    const avg = k === 'bundle' && t0.buy_qty ? `<br>เฉลี่ยชิ้นละ ฿${money(t0.value / t0.buy_qty)} · ซื้อ ${t0.buy_qty * 2} ชิ้น = ฿${money(t0.value * 2)} · ชิ้นที่ไม่ครบชุดคิดราคาปกติ` : '';
    $('#pprev', m).innerHTML = `<b>สรุป:</b> ${esc(promoLabel(t0))} · ${esc(PSCOPE[sc])}${ex}${avg}`;
  };
  f.scope.onchange = () => { fillKinds(); drawPick(); preview(); };
  f.oninput = preview;
  $$('#pd [data-d]', m).forEach(b => b.onclick = () => { const d = +b.dataset.d; days.has(d) ? days.delete(d) : days.add(d); b.classList.toggle('on'); });
  fillKinds(); drawPick(); preview();
  $$('[data-tp]', m).forEach(b => b.onclick = () => {
    const tp = { b3: ['bundle', 100, 3, 1, false, 'ซื้อ 3 ชิ้น 100'], b3mix: ['bundle', 100, 3, 1, true, 'คละ 3 ชิ้น 100'], bxgy: ['bxgy', 0, 2, 1, false, 'ซื้อ 2 แถม 1'], pct: ['percent', 10, 1, 1, false, 'ลด 10%'], fix: ['fixed_price', 0, 1, 1, false, 'ราคาพิเศษ'] }[b.dataset.tp];
    if (f.scope.value === 'bill') { f.scope.value = 'product'; fillKinds(); drawPick(); }
    f.kind.value = tp[0]; if (tp[1]) f.value.value = tp[1]; f.buy_qty.value = tp[2]; f.get_qty.value = tp[3]; f.mix.checked = tp[4];
    if (!f.name.value.trim() || f.dataset.auto) { f.name.value = (f.dataset.pre || '') + tp[5]; f.dataset.auto = tp[0]; }
    $$('[data-tp]', m).forEach(x => x.classList.toggle('on', x === b)); preview(); f.value.focus();
  });
  f.name.addEventListener('input', () => { delete f.dataset.auto; });
  f.addEventListener('input', e => { if (!f.dataset.auto || e.target === f.name || !['value', 'buy_qty', 'get_qty', 'mix'].includes(e.target.name)) return;
    const k = f.kind.value, v = num(f.value.value), b = num(f.buy_qty.value), g = num(f.get_qty.value);
    const nm = k === 'bundle' ? `${f.mix.checked ? 'คละ' : 'ซื้อ'} ${b} ชิ้น ${money(v).replace(/\.00$/, '')}` : k === 'bxgy' ? `ซื้อ ${b} แถม ${g}` : k === 'percent' ? `ลด ${v}%` : k === 'fixed_price' ? `ราคาพิเศษ ${v}` : '';
    if (nm) f.name.value = (f.dataset.pre || '') + nm; });
  $('[data-c]', m).onclick = m.close;
  $('#psv', m).onclick = async () => {
    const sc = f.scope.value, row = { shop_id: S.shop.id, name: f.name.value.trim(), scope: sc, kind: f.kind.value, value: num(f.value.value), buy_qty: num(f.buy_qty.value), get_qty: num(f.get_qty.value),
      min_total: sc === 'bill' ? num(f.min_total.value) : 0, product_ids: sc === 'product' ? [...sel] : [], category_ids: sc === 'category' ? [...cats] : [], days: [...days].sort(),
      time_from: f.time_from.value, time_to: f.time_to.value, starts_on: f.starts_on.value || null, ends_on: f.ends_on.value || null,
      mix: f.kind.value === 'bundle' && sc !== 'bill' && f.mix.checked, members_only: f.members_only.checked, auto: sc === 'bill' && f.auto.checked, active: f.active.checked, note: f.note.value.trim() };
    if (!row.name) return toast('กรุณาตั้งชื่อโปรโมชั่น', 'bad');
    if (sc === 'product' && !sel.size) return toast('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ', 'bad');
    if (sc === 'category' && !cats.size) return toast('กรุณาเลือกหมวดหมู่', 'bad');
    if (row.kind === 'bundle' && (row.buy_qty < 2 || row.value <= 0)) return toast('ใส่จำนวนชิ้น (2 ขึ้นไป) และราคาพิเศษ เช่น ซื้อ 3 ชิ้น ราคา 100', 'bad');
    if (row.kind === 'percent' && (row.value <= 0 || row.value > 100)) return toast('ส่วนลด % ต้องอยู่ระหว่าง 1–100', 'bad');
    try {
      const r = p ? await q(sb.from('promotions').update(row).eq('id', p.id).select().single()) : await q(sb.from('promotions').insert(row).select().single());
      if (p) Object.assign(p, r); else S.promotions.push(r);
      m.close(); toast('บันทึกโปรโมชั่นแล้ว', 'ok'); after?.();
    } catch (e) { fail(e); }
  };
}

/* ===================================================================== PERSONAL USE (stock) */
const _stockForm4 = stockForm;
stockForm = function (p, kind, after) {
  if (kind !== 'personal') return _stockForm4(p, kind, after);
  const me = S.shop._name || S.user.email.split('@')[0];
  formModal(`🙋 เบิกใช้ส่วนตัว · ${p.name}`, [
    { k: 'qty', label: `จำนวน (${p.unit}) — คงเหลือ ${qtyf(p.stock)}`, type: 'number', req: true },
    { k: 'who', label: 'ผู้เบิก', def: me }, { k: 'why', label: 'เหตุผล / ใช้ทำอะไร', full: true }], { who: me }, async o => {
    if (!(num(o.qty) > 0)) throw new Error('กรุณากรอกจำนวนให้ถูกต้อง');
    await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: p.id, p_kind: 'personal', p_qty: num(o.qty), p_cost: null, p_supplier: null, p_note: `ผู้เบิก: ${o.who || me}${o.why ? ' · ' + o.why : ''}` }));
    Object.assign(p, await q(sb.from('products').select('*').eq('id', p.id).single()));
    toast(`บันทึกเบิกใช้ส่วนตัว ${qtyf(o.qty)} ${p.unit} (มูลค่าทุน ฿${money(num(o.qty) * num(p.cost))})`, 'ok');
    after?.();
  });
};
const _stockView4 = VIEWS.stock;
VIEWS.stock = pg => {
  _stockView4(pg);
  /* personal use lives in the cashier screen (🙋 ใช้เอง), not here */
};

/* ===================================================================== BARCODES */
const ean13cd = s => { let t = 0; for (let i = 0; i < 12; i++) t += +s[i] * (i % 2 ? 3 : 1); return (10 - t % 10) % 10; };
const validEAN = s => /^\d{13}$/.test(s) && ean13cd(s) === +s[12];
function nextBarcodes(n) {
  const pre = String(S.shop.barcode_prefix || '200').replace(/\D/g, '').slice(0, 5) || '200', len = 12 - pre.length;
  const used = new Set(S.products.map(p => p.barcode).filter(Boolean));
  let seq = Math.max(0, ...S.products.map(p => p.barcode || '').filter(b => b.length === 13 && b.startsWith(pre)).map(b => +b.slice(pre.length, 12)));
  const out = [];
  while (out.length < n) { seq++; const b12 = pre + String(seq).padStart(len, '0'); const code = b12 + ean13cd(b12); if (!used.has(code)) out.push(code); }
  return out;
}
async function barcodeSVG(code, { h = 40, w = 1.6, text = true } = {}) {
  await loadJsBarcode();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try { JsBarcode(svg, code, { format: validEAN(code) ? 'EAN13' : 'CODE128', height: h, width: w, displayValue: text, fontSize: 13, margin: 2 }); }
  catch { JsBarcode(svg, code, { format: 'CODE128', height: h, width: w, displayValue: text, fontSize: 13, margin: 2 }); }
  return svg.outerHTML;
}
async function printLabels(items) {
  const m = modal('พิมพ์ฉลากบาร์โค้ด', `<div class="grid2">
    <div class="fg"><label class="f">ขนาดฉลาก</label><select class="in" id="ls"><option value="s">สติกเกอร์ 40×30 มม. (เครื่องพิมพ์ฉลาก)</option><option value="m">สติกเกอร์ 50×30 มม.</option><option value="a4">กระดาษ A4 (3 × 8 ดวง)</option></select></div>
    <div class="fg"><label class="f">จำนวนดวงต่อสินค้า</label><input class="in" id="lq" type="number" min="1" value="1"></div></div>
    <label class="row"><input type="checkbox" id="lpn" checked> แสดงชื่อสินค้า</label> <label class="row"><input type="checkbox" id="lpp" checked> แสดงราคา</label>
    <p class="muted">${items.length} สินค้า</p>`, { foot: '<button class="btn p" id="lgo">🖨️ พิมพ์</button>' });
  $('#lgo', m).onclick = async () => {
    const sz = $('#ls', m).value, n = Math.max(1, +$('#lq', m).value || 1), sn = $('#lpn', m).checked, sp = $('#lpp', m).checked;
    const dim = { s: ['40mm', '30mm'], m: ['50mm', '30mm'], a4: ['63mm', '33.9mm'] }[sz];
    const cells = [];
    for (const p of items) { if (!p.barcode) continue; const svg = await barcodeSVG(p.barcode, { h: sz === 'a4' ? 34 : 30, w: 1.4 });
      for (let i = 0; i < n; i++) cells.push(`<div class="lbl">${sn ? `<div class="ln">${esc(p.name)}</div>` : ''}${svg}${sp ? `<div class="lp">฿${money(num(p.promo_price) > 0 ? p.promo_price : p.price)}</div>` : ''}</div>`); }
    if (!cells.length) return toast('สินค้าที่เลือกยังไม่มีบาร์โค้ด', 'bad');
    printReceipt(`<style>@page{size:${sz === 'a4' ? 'A4' : dim.join(' ')};margin:${sz === 'a4' ? '10mm 7mm' : '0'}}
      .lbls{display:flex;flex-wrap:wrap;${sz === 'a4' ? 'gap:0 2.5mm' : ''}} .lbl{width:${dim[0]};height:${dim[1]};box-sizing:border-box;padding:1.5mm;text-align:center;overflow:hidden;page-break-inside:avoid;${sz === 'a4' ? '' : 'page-break-after:always'};font-family:sans-serif}
      .lbl svg{max-width:100%;height:auto;max-height:62%} .ln{font-size:9pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2} .lp{font-size:11pt;font-weight:700;line-height:1.1}</style><div class="lbls">${cells.join('')}</div>`);
    m.close();
  };
}
VIEWS.barcodes = pg => {
  let tab = 'all', v = '', cat = '';
  const chosen = new Set();
  const isPromo = p => num(p.promo_price) > 0 || itemPromosFor(p).length > 0;
  $('#tact').innerHTML = `<button class="btn p" id="bprint">🖨️ พิมพ์ / สร้างฉลาก</button><button class="btn" id="bgen">⚙️ สร้างบาร์โค้ดให้สินค้าที่ไม่มี</button><button class="btn" id="bimp">⬆ นำเข้า</button><button class="btn" id="bxl">📗 ส่งออก Excel</button><input type="file" id="bfile" accept=".xlsx,.xls,.csv" hidden>`;
  const list = () => S.products.filter(p => p.active !== false).filter(p => !cat || p.category_id === cat).filter(p => tab === 'all' || (tab === 'promo' ? isPromo(p) : tab === 'nopromo' ? !isPromo(p) : tab === 'has' ? p.barcode : tab === 'none' ? !p.barcode : tab === 'bad' ? p.barcode && /^\d{13}$/.test(p.barcode) && !validEAN(p.barcode) : tab === 'dup' ? p.barcode && S.products.filter(x => x.barcode === p.barcode).length > 1 : true))
    .filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  const draw = () => {
    const act = S.products.filter(p => p.active !== false), has = act.filter(p => p.barcode).length;
    const dup = act.filter(p => p.barcode && act.filter(x => x.barcode === p.barcode).length > 1).length;
    const rows = list();
    pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">สินค้าทั้งหมด</div><div class="v">${act.length}</div></div><div class="stat"><div class="k">มีบาร์โค้ด</div><div class="v" style="color:var(--ok)">${has}</div></div>
      <div class="stat"><div class="k">ไม่มีบาร์โค้ด</div><div class="v" style="color:var(--warn)">${act.length - has}</div></div><div class="stat"><div class="k">บาร์โค้ดซ้ำ</div><div class="v" style="color:var(--bad)">${dup}</div></div></div>
      <div class="row" style="margin-bottom:10px"><div class="pills" id="bt">${[['all', 'ทั้งหมด'], ['promo', '🏷️ มีโปรโมชั่น'], ['nopromo', 'ราคาปกติ'], ['has', 'มีบาร์โค้ด'], ['none', 'ไม่มีบาร์โค้ด'], ['dup', 'ซ้ำ'], ['bad', 'เลขตรวจสอบผิด']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="sbox" style="max-width:280px"><span>🔍</span><input class="in" id="bq" value="${esc(v)}" placeholder="ชื่อ / บาร์โค้ด / SKU"></div><select class="in" id="bcat" style="width:auto"><option value="">ทุกหมวดหมู่</option>${S.categories.map(c => `<option value="${c.id}" ${cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><span class="muted">เลือกแล้ว ${chosen.size} · ถ้าไม่เลือก จะพิมพ์ทุกรายการในแท็บนี้</span></div>
      <div class="tblwrap"><table class="tbl"><tr><th><input type="checkbox" id="ball"></th><th>สินค้า</th><th>บาร์โค้ด</th><th>SKU</th><th class="right">ราคา</th><th class="right">คงเหลือ</th><th></th></tr>
      ${rows.slice(0, 400).map(p => `<tr><td><input type="checkbox" data-c="${p.id}" ${chosen.has(p.id) ? 'checked' : ''}></td><td><b>${esc(p.name)}</b>${isPromo(p) ? ' <span class="chip bad">🏷️ โปร</span>' : ''}</td>
        <td>${p.barcode ? `<code>${esc(p.barcode)}</code>${/^\d{13}$/.test(p.barcode) && !validEAN(p.barcode) ? ' <span class="chip bad">เลขตรวจผิด</span>' : ''}` : '<span class="chip warn">ไม่มี</span>'}</td><td>${esc(p.sku || '')}</td>
        <td class="right">${money(p.price)}</td><td class="right">${p.track_stock ? qtyf(p.stock) : '—'}</td>
        <td class="right" style="white-space:nowrap"><button class="btn sm" data-ed="${p.id}">✏️</button> <button class="btn sm" data-sc="${p.id}">📷</button> ${p.barcode ? '' : `<button class="btn sm" data-g="${p.id}">สร้าง</button>`}</td></tr>`).join('')}</table></div>
      <p class="muted">${rows.length} รายการ${rows.length > 400 ? ' (แสดง 400 แรก)' : ''}</p>`;
    $$('#bt [data-t]', pg).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $('#bcat', pg).onchange = e => { cat = e.target.value; draw(); };
    $('#bq', pg).oninput = e => { v = e.target.value.toLowerCase(); const pos = e.target.selectionStart; draw(); const n = $('#bq', pg); n.focus(); n.setSelectionRange(pos, pos); };
    $('#ball', pg).onchange = e => { rows.forEach(p => e.target.checked ? chosen.add(p.id) : chosen.delete(p.id)); draw(); };
    $$('[data-c]', pg).forEach(c => c.onchange = () => { c.checked ? chosen.add(c.dataset.c) : chosen.delete(c.dataset.c); });
    const setCode = async (p, code) => {
      if (code && S.products.some(x => x.id !== p.id && x.barcode === code) && !await confirmBox(`บาร์โค้ด ${code} ถูกใช้กับสินค้าอื่นแล้ว ต้องการใช้ซ้ำหรือไม่?`)) return;
      try { Object.assign(p, await q(sb.from('products').update({ barcode: code }).eq('id', p.id).select().single())); toast('บันทึกบาร์โค้ดแล้ว', 'ok'); draw(); } catch (e) { fail(e); } };
    $$('[data-ed]', pg).forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.ed);
      formModal('บาร์โค้ด · ' + p.name, [{ k: 'barcode', label: 'เลขบาร์โค้ด (เว้นว่าง = ลบ)', full: true }], { barcode: p.barcode || '' }, async o => setCode(p, o.barcode.replace(/\s/g, ''))); });
    $$('[data-sc]', pg).forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.sc); scanBarcode(code => setCode(p, code)); });
    $$('[data-g]', pg).forEach(b => b.onclick = () => setCode(S.products.find(x => x.id === b.dataset.g), nextBarcodes(1)[0]));
  };
  $('#bgen').onclick = async () => {
    const targets = (chosen.size ? S.products.filter(p => chosen.has(p.id)) : S.products).filter(p => p.active !== false && !p.barcode);
    if (!targets.length) return toast('ไม่มีสินค้าที่ต้องสร้างบาร์โค้ด', 'ok');
    if (!await confirmBox(`สร้างบาร์โค้ด EAN-13 (ภายในร้าน ขึ้นต้น ${S.shop.barcode_prefix || '200'}) ให้สินค้า ${targets.length} รายการ?`)) return;
    const codes = nextBarcodes(targets.length);
    try { for (let i = 0; i < targets.length; i++) Object.assign(targets[i], await q(sb.from('products').update({ barcode: codes[i] }).eq('id', targets[i].id).select().single()));
      logAct('barcode_generate', 'product', `${targets.length} รายการ`, { count: targets.length });
      toast(`สร้างบาร์โค้ด ${targets.length} รายการแล้ว`, 'ok'); targets.forEach(p => chosen.add(p.id)); tab = 'has'; draw(); } catch (e) { fail(e); draw(); }
  };
  $('#bprint').onclick = () => { const it = chosen.size ? S.products.filter(p => chosen.has(p.id)) : list(); if (!it.length) return toast('ไม่มีสินค้าในรายการ', 'bad'); printLabels(it); };
  $('#bimp').onclick = () => $('#bfile').click();
  $('#bfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importDialog(f); };
  $('#bxl').onclick = () => { toast('แก้บาร์โค้ดในไฟล์ Excel แล้วกด “นำเข้า” เพื่ออัปเดตได้', 'ok'); return xlsxDownload('barcodes', [{ name: 'สินค้า', headers: ['ชื่อสินค้า', 'บาร์โค้ด', 'SKU', 'หมวดหมู่', 'ราคาขาย', 'ราคาโปร', 'ราคาส่ง', 'คงเหลือ', 'โปรโมชั่น'],
    rows: list().map(p => ({ 'ชื่อสินค้า': p.name, 'บาร์โค้ด': p.barcode || '', 'SKU': p.sku || '', 'หมวดหมู่': catName(p.category_id), 'ราคาขาย': num(p.price), 'ราคาโปร': num(p.promo_price) || '', 'ราคาส่ง': num(p.wholesale_price) || '', 'คงเหลือ': num(p.stock), 'โปรโมชั่น': itemPromosFor(p).map(x => x.name + ' (' + promoLabel(x) + ')').join(', ') })) }]); };
  draw();
};

/* ===================================================================== EXCEL helpers */
async function xlsxDownload(base, sheets) {
  await loadXLSX();
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => {
    const ws = s.aoa ? XLSX.utils.aoa_to_sheet(s.aoa) : XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [Object.fromEntries((s.headers || []).map(h => [h, '']))], s.headers ? { header: s.headers } : undefined);
    const hdr = s.headers || (s.rows?.[0] ? Object.keys(s.rows[0]) : []);
    ws['!cols'] = s.widths || hdr.map(h => ({ wch: Math.max(10, Math.min(40, String(h).length + 6)) }));
    XLSX.utils.book_append_sheet(wb, ws, sheetNm(s.name));
  });
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveBlob(safeName(`${base}_${ymd(new Date())}.xlsx`), new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}
const sheetNm = n => String(n).replace(/[:\\/?*\[\]]/g, '-').slice(0, 31);
const yn = v => v === true || /^(y|yes|true|1|ใช่|มี|เปิด|✓|x)$/i.test(String(v ?? '').trim());
const YN = b => b ? 'Y' : 'N';
const catName = id => S.categories.find(c => c.id === id)?.name || '';
const supName = id => S.suppliers.find(s => s.id === id)?.name || '';

/* template definitions: [key, header, example, note, required?] */
const TPL = {
  products: { label: 'สินค้า', icon: '📦', cols: [
    ['barcode', 'บาร์โค้ด', '8851234567890', 'ใช้จับคู่สินค้าเดิม (ถ้าไม่มี ใช้ SKU หรือชื่อ)'], ['sku', 'SKU', 'DRK-001', 'รหัสภายในร้าน'], ['name', 'ชื่อสินค้า', 'น้ำดื่ม 600 มล.', 'จำเป็น', 1],
    ['name_en', 'ชื่ออังกฤษ', 'Drinking water 600ml', ''], ['brand', 'ยี่ห้อ', 'สิงห์', ''], ['category', 'หมวดหมู่', 'เครื่องดื่ม', 'ถ้ายังไม่มีจะสร้างให้อัตโนมัติ'],
    ['unit', 'หน่วย', 'ขวด', 'ชิ้น / ขวด / กก. …'], ['price', 'ราคาขาย', 10, 'จำเป็น', 1], ['promo_price', 'ราคาโปร', '', 'เว้นว่าง = ไม่มี'], ['wholesale_price', 'ราคาส่ง', 8, ''],
    ['cost', 'ต้นทุน', 6.5, ''], ['stock', 'คงเหลือ', 48, 'สินค้าเดิม: ระบบจะบันทึกเป็น “ตรวจนับ/ปรับยอด”'], ['low_stock', 'แจ้งเตือนเมื่อเหลือ', 12, ''], ['max_stock', 'สต็อกสูงสุด', 200, ''],
    ['track_stock', 'ตัดสต็อก (Y/N)', 'Y', ''], ['favorite', 'รายการโปรด (Y/N)', 'N', ''], ['supplier', 'ผู้จำหน่าย', 'บจก. น้ำดื่มไทย', 'ชื่อต้องตรงกับในระบบ'],
    ['expiry_date', 'วันหมดอายุ', '2027-12-31', 'ปปปป-ดด-วว (ค.ศ.)'], ['lot_no', 'เลขล็อต', '', ''], ['image_url', 'ลิงก์รูป', '', 'URL รูปภาพ (ถ้ามี)'], ['active', 'ขายอยู่ (Y/N)', 'Y', 'N = ซ่อน/เลิกขาย']] },
  categories: { label: 'หมวดหมู่', icon: '🗂️', cols: [['name', 'ชื่อหมวดหมู่', 'เครื่องดื่ม', 'จำเป็น', 1], ['color', 'สี', '#2563eb', 'รหัสสี HEX'], ['sort', 'ลำดับ', 1, 'ตัวเลขน้อยแสดงก่อน']] },
  customers: { label: 'ลูกค้า / สมาชิก', icon: '⭐', cols: [['name', 'ชื่อลูกค้า', 'สมชาย ใจดี', 'จำเป็น', 1], ['phone', 'เบอร์โทร', '0812345678', 'ใช้จับคู่ลูกค้าเดิม'], ['points', 'แต้มสะสม', 120, ''],
    ['level', 'ระดับสมาชิก', 'Gold', ''], ['group_name', 'กลุ่ม', 'ขายส่ง', ''], ['discount_pct', 'ส่วนลดสมาชิก %', 5, ''], ['credit_limit', 'วงเงินเครดิต', 5000, ''],
    ['ctype', 'ประเภท (individual/company)', 'individual', ''], ['tax_id', 'เลขผู้เสียภาษี', '', '13 หลัก'], ['tax_branch', 'สาขา', '', ''], ['address', 'ที่อยู่', '', ''], ['note', 'หมายเหตุ', '', '']] },
  suppliers: { label: 'ผู้จำหน่าย', icon: '🚚', cols: [['name', 'ชื่อผู้จำหน่าย', 'บจก. น้ำดื่มไทย', 'จำเป็น', 1], ['contact', 'ผู้ติดต่อ', 'คุณเอ', ''], ['phone', 'เบอร์โทร', '021234567', ''],
    ['tax_id', 'เลขผู้เสียภาษี', '', ''], ['address', 'ที่อยู่', '', ''], ['note', 'หมายเหตุ', '', '']] },
  promotions: { label: 'โปรโมชั่น', icon: '🏷️', cols: [['name', 'ชื่อโปรโมชั่น', 'ซื้อ 2 แถม 1 น้ำดื่ม', 'จำเป็น', 1], ['scope', 'ใช้กับ (product/category/bill)', 'product', 'product=สินค้า category=หมวด bill=ทั้งบิล'],
    ['kind', 'รูปแบบ (percent/amount/fixed_price/bxgy/bundle)', 'bxgy', 'percent=ลด% amount=ลดบาท fixed_price=ราคาพิเศษ bxgy=ซื้อXแถมY bundle=ราคาชุด'], ['value', 'ค่า', 0, '% / บาท / ราคาพิเศษ / ราคาชุด'],
    ['buy_qty', 'ซื้อ (ชิ้น)', 2, 'bxgy / bundle'], ['get_qty', 'แถม (ชิ้น)', 1, 'bxgy'], ['products', 'สินค้า (บาร์โค้ดหรือชื่อ คั่นด้วย ;)', '8851234567890', 'scope=product'],
    ['categories', 'หมวดหมู่ (คั่นด้วย ;)', '', 'scope=category'], ['min_total', 'ยอดขั้นต่ำ', 0, 'scope=bill'], ['days', 'วัน (0=อา … 6=ส คั่นด้วย ,)', '', 'ว่าง = ทุกวัน'],
    ['time_from', 'เวลาเริ่ม', '', 'HH:MM'], ['time_to', 'เวลาสิ้นสุด', '', 'HH:MM'], ['starts_on', 'วันเริ่ม', '', 'ปปปป-ดด-วว'], ['ends_on', 'วันสิ้นสุด', '', 'ปปปป-ดด-วว'],
    ['members_only', 'เฉพาะสมาชิก (Y/N)', 'N', ''], ['auto', 'อัตโนมัติ (Y/N)', 'N', 'เฉพาะโปรทั้งบิล'], ['active', 'เปิดใช้ (Y/N)', 'Y', '']] },
  expenses: { label: 'ค่าใช้จ่าย', icon: '💸', cols: [['spent_on', 'วันที่', '2026-11-01', 'ปปปป-ดด-วว', 1], ['category', 'หมวด', 'ค่าน้ำ/ไฟ', ''], ['amount', 'จำนวนเงิน', 1500, 'จำเป็น', 1],
    ['payment_method', 'จ่ายโดย (cash/transfer)', 'cash', ''], ['note', 'รายละเอียด', 'ค่าไฟเดือน ต.ค.', '']] },
  stockcount: { label: 'ตรวจนับสต็อก', icon: '📋', cols: [['barcode', 'บาร์โค้ด', '8851234567890', 'หรือ SKU / ชื่อ'], ['sku', 'SKU', '', ''], ['name', 'ชื่อสินค้า', 'น้ำดื่ม 600 มล.', ''],
    ['system', 'คงเหลือในระบบ', 48, 'ไม่ต้องแก้ (อ้างอิง)'], ['counted', 'นับได้จริง', 45, 'กรอกเฉพาะที่นับ', 1], ['note', 'หมายเหตุ', '', '']] },
};
function tplRows(type) {
  const T = TPL[type];
  const map = {
    products: () => S.products.map(p => ({ ...p, category: catName(p.category_id), supplier: supName(p.supplier_id), track_stock: YN(p.track_stock), favorite: YN(p.favorite), active: YN(p.active !== false), promo_price: num(p.promo_price) || '' })),
    categories: () => S.categories, customers: () => S.customers, suppliers: () => S.suppliers,
    promotions: () => S.promotions.map(p => ({ ...p, products: arr(p.product_ids).map(id => { const x = S.products.find(y => y.id === id); return x ? (x.barcode || x.name) : ''; }).filter(Boolean).join(';'),
      categories: arr(p.category_ids).map(catName).filter(Boolean).join(';'), days: arr(p.days).join(','), members_only: YN(p.members_only), auto: YN(p.auto), active: YN(p.active) })),
    expenses: () => S.expenses || [],
    stockcount: () => S.products.filter(p => p.track_stock && p.active !== false).map(p => ({ barcode: p.barcode, sku: p.sku, name: p.name, system: num(p.stock), counted: '' })),
  };
  return (map[type]?.() || []).map(r => Object.fromEntries(T.cols.map(([k, h]) => [h, r[k] ?? ''])));
}
function tplSheets(type, withData) {
  const T = TPL[type];
  return [{ name: T.label, headers: T.cols.map(c => c[1]), rows: withData ? tplRows(type) : [Object.fromEntries(T.cols.map(c => [c[1], c[2]]))] }];
}
function guideSheet(types) {
  const aoa = [['คู่มือแม่แบบ Yanisa Shop', '', ''], ['สร้างเมื่อ', dt(new Date()), S.shop.name], [''],
    ['วิธีใช้', '1) กรอก/แก้ไขข้อมูลในแต่ละแผ่นงาน (ห้ามเปลี่ยนชื่อหัวคอลัมน์)  2) บันทึกเป็น .xlsx  3) ไปที่ ศูนย์ข้อมูล → นำเข้า แล้วเลือกไฟล์', ''],
    ['การจับคู่', 'สินค้า: บาร์โค้ด → SKU → ชื่อ · ลูกค้า: เบอร์โทร → ชื่อ · หมวด/ผู้จำหน่าย/โปร: ชื่อ — ถ้าตรงจะ “อัปเดต” ถ้าไม่ตรงจะ “เพิ่มใหม่”', ''], [''],
    ['แผ่นงาน', 'คอลัมน์', 'คำอธิบาย']];
  types.forEach(t => TPL[t].cols.forEach(([, h, , n, req], i) => aoa.push([i ? '' : TPL[t].label, h + (req ? ' *' : ''), n || ''])));
  return { name: 'คู่มือ', aoa, widths: [{ wch: 18 }, { wch: 42 }, { wch: 70 }] };
}

/* ---------- import ---------- */
async function readSheetFile(file) {
  await loadXLSX();
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const out = {};
  wb.SheetNames.forEach(n => { out[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '', raw: true }); });
  return out;
}
const cellDate = v => v instanceof Date ? ymd(v) : String(v || '').trim() ? (/^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : (() => { const d = new Date(v); return isNaN(d) ? null : ymd(d); })()) : null;
function normRow(type, raw) {
  const T = TPL[type], o = {};
  T.cols.forEach(([k, h]) => { const v = raw[h] ?? raw[h + ' *'] ?? raw[k]; if (v !== undefined) o[k] = typeof v === 'string' ? v.trim() : v; });
  return o;
}
function guessType(sheetName, rows) {
  for (const [k, T] of Object.entries(TPL)) if (sheetName === T.label || sheetName === sheetNm(T.label) || sheetName === k) return k;
  const hs = Object.keys(rows[0] || {});
  let best = null, sc = 0;
  for (const [k, T] of Object.entries(TPL)) { const s = T.cols.filter(c => hs.includes(c[1]) || hs.includes(c[0])).length; if (s > sc) { sc = s; best = k; } }
  return sc >= 2 ? best : null;
}
async function planImport(type, rows) {
  const plan = [];
  const findCat = n => S.categories.find(c => c.name.trim().toLowerCase() === String(n).trim().toLowerCase());
  for (const [i, raw] of rows.entries()) {
    const r = normRow(type, raw); const line = i + 2;
    if (Object.values(r).every(v => v === '' || v == null)) continue;
    let match = null, err = '';
    if (type === 'products') {
      if (!r.name && !r.barcode && !r.sku) err = 'ไม่มีชื่อ/บาร์โค้ด';
      match = (r.barcode && S.products.find(p => p.barcode === String(r.barcode))) || (r.sku && S.products.find(p => p.sku && p.sku === String(r.sku))) || (r.name && S.products.find(p => p.name.trim() === String(r.name).trim()));
      if (!match && !r.name) err = 'สินค้าใหม่ต้องมีชื่อ';
      if (!match && r.price === '') err = 'สินค้าใหม่ต้องมีราคา';
    } else if (type === 'stockcount') {
      match = (r.barcode && S.products.find(p => p.barcode === String(r.barcode))) || (r.sku && S.products.find(p => p.sku === String(r.sku))) || (r.name && S.products.find(p => p.name.trim() === String(r.name).trim()));
      if (r.counted === '' || r.counted == null) continue;
      if (!match) err = 'ไม่พบสินค้า';
    } else if (type === 'customers') {
      if (!r.name) err = 'ไม่มีชื่อ';
      match = (r.phone && S.customers.find(c => c.phone && c.phone.replace(/\D/g, '') === String(r.phone).replace(/\D/g, ''))) || S.customers.find(c => c.name === r.name);
    } else if (type === 'expenses') {
      if (!(num(r.amount) > 0)) err = 'จำนวนเงินไม่ถูกต้อง';
    } else {
      if (!r.name) err = 'ไม่มีชื่อ';
      const list = { categories: S.categories, suppliers: S.suppliers, promotions: S.promotions }[type];
      match = list.find(x => x.name.trim() === String(r.name).trim());
    }
    plan.push({ line, r, match, err, act: err ? 'error' : match ? 'update' : 'new' });
  }
  return plan;
}
async function runImport(type, plan, progress) {
  let ok = 0, bad = 0; const errors = [];
  const shop = S.shop.id;
  const ensureCat = async n => { if (!String(n || '').trim()) return null; let c = S.categories.find(x => x.name.trim().toLowerCase() === String(n).trim().toLowerCase());
    if (!c) { c = await q(sb.from('categories').insert({ shop_id: shop, name: String(n).trim(), sort: S.categories.length + 1 }).select().single()); S.categories.push(c); } return c.id; };
  for (const [i, it] of plan.entries()) {
    progress?.(i + 1, plan.length);
    if (it.act === 'error') { bad++; errors.push(`แถว ${it.line}: ${it.err}`); continue; }
    const r = it.r;
    try {
      if (type === 'products') {
        const row = {};
        ['name', 'name_en', 'brand', 'unit', 'lot_no', 'image_url'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = String(r[k]); });
        ['barcode', 'sku'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = String(r[k]).replace(/\.0$/, ''); });
        ['price', 'wholesale_price', 'cost', 'low_stock', 'max_stock'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = num(r[k]); });
        if (r.promo_price !== undefined) row.promo_price = r.promo_price === '' ? 0 : num(r.promo_price);
        ['track_stock', 'favorite', 'active'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = yn(r[k]); });
        if (r.category !== undefined && r.category !== '') row.category_id = await ensureCat(r.category);
        if (r.supplier) { const s = S.suppliers.find(x => x.name.trim() === String(r.supplier).trim()); if (s) row.supplier_id = s.id; }
        if (r.expiry_date !== undefined && r.expiry_date !== '') row.expiry_date = cellDate(r.expiry_date);
        if (it.match) {
          const p = it.match;
          if (Object.keys(row).length) Object.assign(p, await q(sb.from('products').update(row).eq('id', p.id).select().single()));
          if (r.stock !== undefined && r.stock !== '' && p.track_stock && num(r.stock) !== num(p.stock)) {
            await q(sb.rpc('stock_move', { p_shop: shop, p_product: p.id, p_kind: 'adjust', p_qty: num(r.stock), p_cost: null, p_supplier: null, p_note: 'นำเข้าจาก Excel' })); p.stock = num(r.stock); }
        } else {
          row.shop_id = shop; row.stock = num(r.stock); row.unit ||= 'ชิ้น'; if (row.track_stock === undefined) row.track_stock = true;
          S.products.push(await q(sb.from('products').insert(row).select().single()));
        }
      } else if (type === 'stockcount') {
        const p = it.match;
        await q(sb.rpc('stock_move', { p_shop: shop, p_product: p.id, p_kind: 'adjust', p_qty: num(r.counted), p_cost: null, p_supplier: null, p_note: 'ตรวจนับจาก Excel' + (r.note ? ' · ' + r.note : '') }));
        p.stock = num(r.counted);
      } else if (type === 'expenses') {
        await q(sb.from('expenses').insert({ shop_id: shop, spent_on: cellDate(r.spent_on) || ymd(new Date()), category: r.category || 'ทั่วไป', amount: num(r.amount), payment_method: r.payment_method || 'cash', note: r.note || '', user_id: S.user.id, user_name: S.shop._name || '' }));
      } else if (type === 'promotions') {
        const ids = String(r.products || '').split(/[;,\n]/).map(s => s.trim()).filter(Boolean).map(s => (S.products.find(p => p.barcode === s) || S.products.find(p => p.name === s))?.id).filter(Boolean);
        const cids = []; for (const n of String(r.categories || '').split(/[;\n]/).map(s => s.trim()).filter(Boolean)) cids.push(await ensureCat(n));
        const row = { name: r.name, scope: ['product', 'category', 'bill'].includes(r.scope) ? r.scope : 'bill', kind: Object.keys(PKIND).includes(r.kind) ? r.kind : 'percent', value: num(r.value),
          buy_qty: num(r.buy_qty), get_qty: num(r.get_qty), product_ids: ids, category_ids: cids, min_total: num(r.min_total),
          days: String(r.days ?? '').split(/[,; ]/).filter(x => x !== '' && !isNaN(x)).map(Number).filter(d => d >= 0 && d <= 6),
          time_from: r.time_from ? String(r.time_from).slice(0, 5) : '', time_to: r.time_to ? String(r.time_to).slice(0, 5) : '', starts_on: cellDate(r.starts_on), ends_on: cellDate(r.ends_on),
          members_only: yn(r.members_only), auto: yn(r.auto), active: r.active === '' || r.active === undefined ? true : yn(r.active) };
        if (row.scope !== 'bill' && ['amount'].includes(row.kind) === false && row.kind === 'percent' && row.value > 100) row.value = 100;
        if (it.match) Object.assign(it.match, await q(sb.from('promotions').update(row).eq('id', it.match.id).select().single()));
        else S.promotions.push(await q(sb.from('promotions').insert({ ...row, shop_id: shop }).select().single()));
      } else {
        const T = TPL[type], row = {};
        T.cols.forEach(([k]) => { if (r[k] !== undefined && r[k] !== '') row[k] = ['points', 'discount_pct', 'credit_limit', 'sort'].includes(k) ? num(r[k]) : String(r[k]); });
        const list = { categories: S.categories, suppliers: S.suppliers, customers: S.customers }[type];
        if (it.match) Object.assign(it.match, await q(sb.from(type).update(row).eq('id', it.match.id).select().single()));
        else list.push(await q(sb.from(type).insert({ ...row, shop_id: shop }).select().single()));
      }
      ok++;
    } catch (e) { bad++; errors.push(`แถว ${it.line}: ${e.message}`); }
  }
  logAct('import', type, TPL[type].label, { ok, failed: bad });
  return { ok, bad, errors };
}
function importDialog(file) {
  (async () => {
    let sheets;
    try { sheets = await readSheetFile(file); } catch (e) { return fail(new Error('อ่านไฟล์ไม่ได้ — ต้องเป็น .xlsx หรือ .csv')); }
    const jobs = Object.entries(sheets).filter(([n, rows]) => rows.length && n !== 'คู่มือ').map(([n, rows]) => ({ n, rows, type: guessType(n, rows) })).filter(j => j.type);
    if (!jobs.length) return toast('ไม่พบแผ่นงานที่ตรงกับแม่แบบ — ดาวน์โหลดแม่แบบก่อน', 'bad');
    const plans = []; for (const j of jobs) plans.push({ ...j, plan: await planImport(j.type, j.rows) });
    const m = modal('นำเข้าข้อมูล — ตรวจสอบก่อนบันทึก', `<p class="muted" style="margin-top:0">ไฟล์: <b>${esc(file.name)}</b></p>
      <div class="tblwrap"><table class="tbl"><tr><th></th><th>ข้อมูล</th><th class="right">เพิ่มใหม่</th><th class="right">อัปเดต</th><th class="right">ผิดพลาด</th></tr>
      ${plans.map((p, i) => `<tr><td><input type="checkbox" data-j="${i}" checked></td><td>${TPL[p.type].icon} ${TPL[p.type].label}<br><small class="muted">แผ่นงาน “${esc(p.n)}”</small></td>
        <td class="right" style="color:var(--ok)">${p.plan.filter(x => x.act === 'new').length}</td><td class="right">${p.plan.filter(x => x.act === 'update').length}</td>
        <td class="right" style="color:var(--bad)">${p.plan.filter(x => x.act === 'error').length}</td></tr>`).join('')}</table></div>
      ${plans.some(p => p.plan.some(x => x.err)) ? `<details><summary>ดูรายการผิดพลาด</summary><small>${plans.flatMap(p => p.plan.filter(x => x.err).map(x => `${TPL[p.type].label} แถว ${x.line}: ${esc(x.err)}`)).slice(0, 100).join('<br>')}</small></details>` : ''}
      <p class="muted" style="font-size:13px">ระบบจะบันทึกประวัติการนำเข้าไว้ใน “บันทึกการใช้งาน” · สต็อกที่เปลี่ยนจะบันทึกเป็นการตรวจนับ</p>
      <div id="iprog"></div>`, { wide: true, foot: '<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="igo">⬆ นำเข้าเลย</button>' });
    $('[data-c]', m).onclick = m.close;
    $('#igo', m).onclick = async () => {
      $('#igo', m).disabled = true; const res = [];
      const order = ['categories', 'suppliers', 'products', 'customers', 'promotions', 'stockcount', 'expenses'];
      const sel = plans.filter((p, i) => $(`[data-j="${i}"]`, m).checked).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
      for (const p of sel) {
        const r = await runImport(p.type, p.plan, (a, b) => { $('#iprog', m).innerHTML = `<div class="muted">${TPL[p.type].label}: ${a}/${b}</div><div class="bar"><i style="width:${a / b * 100}%"></i></div>`; });
        res.push(`${TPL[p.type].icon} ${TPL[p.type].label}: สำเร็จ ${r.ok}${r.bad ? ` · ผิดพลาด ${r.bad}` : ''}`);
        if (r.errors.length) res.push(`<small class="muted">${r.errors.slice(0, 20).map(esc).join('<br>')}</small>`);
      }
      $('#iprog', m).innerHTML = `<div class="card" style="background:var(--oksoft)">${res.join('<br>')}</div>`;
      $('.mf', m).innerHTML = '<button class="btn p" data-c>เสร็จสิ้น</button>'; $('[data-c]', m).onclick = () => { m.close(); go(S.page); };
      toast('นำเข้าข้อมูลเรียบร้อย', 'ok');
    };
  })();
}

/* ---------- full backup / restore ---------- */
const BK_TABLES = ['categories', 'suppliers', 'products', 'customers', 'promotions', 'expenses', 'shifts', 'sales', 'sale_items', 'sale_payments', 'refunds', 'refund_items', 'stock_moves', 'purchases', 'purchase_items', 'cash_moves', 'customer_payments', 'supplier_payments', 'audit_log'];
async function collectBackup(progress) {
  const id = S.shop.id, out = { app: 'shop-pos', version: APP_VERSION, exported_at: new Date().toISOString(), shop: { ...S.shop }, tables: {} };
  Object.keys(out.shop).filter(k => k.startsWith('_')).forEach(k => delete out.shop[k]);
  for (const [i, tb] of BK_TABLES.entries()) { progress?.(i + 1, BK_TABLES.length, tb);
    try { out.tables[tb] = await fetchAll(() => sb.from(tb).select('*').eq('shop_id', id)); } catch { out.tables[tb] = []; } }
  return out;
}
async function backupJSON(prog) {
  const b = await collectBackup(prog);
  saveBlob(safeName(`backup_${S.shop.name}_${ymd(new Date())}.json`), new Blob([JSON.stringify(b)], { type: 'application/json' }));
  localStorage.setItem('pos_last_backup_' + S.shop.id, new Date().toISOString()); logAct('backup', 'shop', 'JSON', { rows: Object.values(b.tables).reduce((a, x) => a + x.length, 0) });
}
async function backupExcel(prog) {
  const b = await collectBackup(prog);
  const types = ['products', 'categories', 'customers', 'suppliers', 'promotions', 'expenses'];
  S.expenses = b.tables.expenses;
  const sheets = [guideSheet(types), ...types.flatMap(t => tplSheets(t, true))];
  const ex = { sales: 'บิลขาย', sale_items: 'รายการขาย', stock_moves: 'ความเคลื่อนไหวสต็อก', purchases: 'ใบสั่งซื้อ', refunds: 'คืนเงิน', shifts: 'กะ', audit_log: 'บันทึกการใช้งาน' };
  Object.entries(ex).forEach(([tb, nm]) => sheets.push({ name: nm, rows: (b.tables[tb] || []).map(r => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'shop_id').map(([k, v]) => [k, v && typeof v === 'object' ? JSON.stringify(v) : v]))) }));
  await xlsxDownload(`backup_${S.shop.name}`, sheets);
  localStorage.setItem('pos_last_backup_' + S.shop.id, new Date().toISOString()); logAct('backup', 'shop', 'Excel', {});
}
async function restoreJSON(file) {
  let b; try { b = JSON.parse(await file.text()); } catch { return toast('ไฟล์สำรองไม่ถูกต้อง', 'bad'); }
  const T = b.tables || b; // v3 backups stored tables at top level
  if (!T.products && !T.categories) return toast('ไม่พบข้อมูลสินค้าในไฟล์สำรอง', 'bad');
  const same = b.shop?.id === S.shop.id;
  const cnt = k => (T[k] || []).length;
  if (!await confirmBox(`กู้คืนจากไฟล์ “${file.name}”\nสำรองเมื่อ ${b.exported_at ? dt(b.exported_at) : '-'} · ร้าน ${b.shop?.name || '-'}\n\nหมวด ${cnt('categories')} · ผู้จำหน่าย ${cnt('suppliers')} · สินค้า ${cnt('products')} · ลูกค้า ${cnt('customers')} · โปรโมชั่น ${cnt('promotions')}\n\n${same ? 'ข้อมูลเดิมที่ตรงกันจะถูกเขียนทับด้วยค่าจากไฟล์ (ประวัติการขายไม่ถูกลบ)' : 'ไฟล์มาจากร้าน/สาขาอื่น — จะคัดลอกข้อมูลหลักเข้าร้านนี้เป็นรายการใหม่'}\nดำเนินการต่อหรือไม่?`)) return;
  const m = modal('กำลังกู้คืน…', '<div id="rp"></div>');
  const shop = S.shop.id, idMap = {};
  const strip = (r, keep = []) => { const o = { ...r }; ['created_at', 'shop_id'].forEach(k => delete o[k]); if (!same) delete o.id; Object.keys(o).forEach(k => { if (k.startsWith('_') && !keep.includes(k)) delete o[k]; }); return { ...o, shop_id: shop }; };
  const step = async (tb, fix) => {
    const rows = T[tb] || []; let n = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map(r => { const o = strip(r); fix?.(o, r); return o; });
      if (same) await q(sb.from(tb).upsert(chunk, { onConflict: 'id' }));
      else { const ins = await q(sb.from(tb).insert(chunk).select('id')); ins.forEach((x, j) => { idMap[rows[i + j].id] = x.id; }); }
      n += chunk.length; $('#rp', m).innerHTML += `<div>✓ ${tb}: ${n}/${rows.length}</div>`;
    }
  };
  try {
    await step('categories'); await step('suppliers');
    await step('products', (o, r) => { if (!same) { o.category_id = idMap[r.category_id] || null; o.supplier_id = idMap[r.supplier_id] || null; } });
    await step('customers', o => { if (!same) { o.points = num(o.points); o.balance = 0; } });
    await step('promotions', o => { if (!same) { o.product_ids = arr(o.product_ids).map(x => idMap[x]).filter(Boolean); o.category_ids = arr(o.category_ids).map(x => idMap[x]).filter(Boolean); } });
    if (same && b.shop && can('owner')) { const keep = ['name', 'address', 'phone', 'tax_id', 'vat_mode', 'vat_rate', 'promptpay_id', 'receipt_header', 'receipt_footer', 'points_per_baht', 'baht_per_point', 'branch_code', 'branch_name', 'logo_url', 'receipt_size', 'brand_color', 'barcode_prefix'];
      await q(sb.from('shops').update(Object.fromEntries(keep.filter(k => k in b.shop).map(k => [k, b.shop[k]]))).eq('id', shop)); }
    logAct('restore', 'shop', file.name, { same, products: cnt('products') });
    m.close(); toast('กู้คืนข้อมูลเรียบร้อย — กำลังโหลดใหม่', 'ok'); setTimeout(() => location.reload(), 900);
  } catch (e) { fail(e); $('#rp', m).innerHTML += `<div style="color:var(--bad)">หยุดที่: ${esc(e.message)}</div>`; }
}

/* ---------- data center page ---------- */
VIEWS.data = async pg => {
  const admin = can('owner') || S.role === 'admin', allowed = t => t === 'expenses' ? canDo('expenses') : t === 'customers' ? canDo('customers') : t === 'promotions' ? canDo('promotions') : canDo('edit_products');
  if (!S.expenses && canDo('expenses')) S.expenses = await fetchAll(() => sb.from('expenses').select('*').eq('shop_id', S.shop.id)).catch(() => []);
  const types = Object.keys(TPL).filter(allowed);
  const last = localStorage.getItem('pos_last_backup_' + S.shop.id);
  pg.innerHTML = `<div class="grid2">
    <div class="card"><h3 style="margin-top:0">📗 แม่แบบ Excel (Template)</h3>
      <p class="muted" style="margin-top:0">ดาวน์โหลด → แก้ไขใน Excel / Google Sheets → นำเข้ากลับ ระบบจะอัปเดตรายการเดิมและเพิ่มรายการใหม่ให้อัตโนมัติ</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px"><button class="btn p" id="tAll">⬇ แม่แบบทั้งหมด (ว่าง + ตัวอย่าง)</button><button class="btn" id="tAllD">⬇ ข้อมูลปัจจุบันทั้งหมด (แก้ไขแล้วนำเข้าได้)</button></div>
      <div class="tblwrap"><table class="tbl">${types.map(t => `<tr><td>${TPL[t].icon} <b>${TPL[t].label}</b><br><small class="muted">${TPL[t].cols.length} คอลัมน์</small></td>
        <td class="right" style="white-space:nowrap"><button class="btn sm" data-tp="${t}">แม่แบบ</button> <button class="btn sm" data-td="${t}">ข้อมูลปัจจุบัน</button></td></tr>`).join('')}</table></div></div>
    <div class="card"><h3 style="margin-top:0">⬆ นำเข้าข้อมูล (Import)</h3>
      <label class="dropzone" id="dz"><input type="file" id="ifile" accept=".xlsx,.xls,.csv" hidden><b>แตะเพื่อเลือกไฟล์</b> หรือ ลากไฟล์ .xlsx / .csv มาวางที่นี่<br><small class="muted">รองรับไฟล์ที่มีหลายแผ่นงานในครั้งเดียว · ตรวจสอบก่อนบันทึกทุกครั้ง</small></label>
      <h3>💾 สำรองข้อมูลทั้งร้าน (Backup)</h3>
      <p class="muted" style="margin-top:0">สำรองล่าสุดจากเครื่องนี้: <b>${last ? dt(last) : 'ยังไม่เคย'}</b>${last && Date.now() - new Date(last) > 7 * 864e5 ? ' <span class="chip warn">ควรสำรองใหม่</span>' : ''}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn p" id="bkj">💾 สำรองไฟล์ JSON (กู้คืนได้)</button><button class="btn" id="bkx">📗 สำรองเป็น Excel (อ่าน/แก้ไขได้)</button></div>
      <div id="bkp" class="muted" style="margin-top:8px"></div>
      ${admin ? `<h3>♻️ กู้คืนข้อมูล (Restore)</h3><p class="muted" style="margin-top:0">ใช้ไฟล์ JSON ที่สำรองไว้ — กู้คืน สินค้า หมวดหมู่ ลูกค้า ผู้จำหน่าย โปรโมชั่น และตั้งค่าร้าน · ประวัติการขายเก็บไว้ในระบบคลาวด์เสมอ ไม่ถูกลบ</p>
        <label class="btn"><input type="file" id="rfile" accept=".json,application/json" hidden>♻️ เลือกไฟล์สำรองเพื่อกู้คืน</label>` : ''}
    </div></div>`;
  const prog = (a, b, tb) => { $('#bkp').textContent = `กำลังรวบรวม ${tb} (${a}/${b})…`; };
  $('#tAll').onclick = () => xlsxDownload('template_shop_pos', [guideSheet(types), ...types.flatMap(t => tplSheets(t, false))]);
  $('#tAllD').onclick = () => xlsxDownload(`data_${S.shop.name}`, [guideSheet(types), ...types.flatMap(t => tplSheets(t, true))]);
  $$('[data-tp]', pg).forEach(b => b.onclick = () => xlsxDownload('template_' + b.dataset.tp, [guideSheet([b.dataset.tp]), ...tplSheets(b.dataset.tp, false)]));
  $$('[data-td]', pg).forEach(b => b.onclick = () => xlsxDownload(`${b.dataset.td}_${S.shop.name}`, [guideSheet([b.dataset.td]), ...tplSheets(b.dataset.td, true)]));
  $('#ifile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importDialog(f); };
  const dz = $('#dz'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); const f = e.dataTransfer.files[0]; if (f) importDialog(f); };
  $('#bkj').onclick = async () => { try { await backupJSON(prog); $('#bkp').textContent = '✓ สำรองเรียบร้อย'; } catch (e) { fail(e); } };
  $('#bkx').onclick = async () => { try { await backupExcel(prog); $('#bkp').textContent = '✓ สำรองเรียบร้อย'; } catch (e) { fail(e); } };
  if ($('#rfile')) $('#rfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) restoreJSON(f); };
};

/* ===================================================================== ACTIVITY LOG */
VIEWS.audit = async pg => {
  let A, B, rows = [], members = [];
  try { members = await q(sb.from('shop_members').select('user_id, display_name, username, role').eq('shop_id', S.shop.id)); } catch {}
  pg.innerHTML = `<div id="ar"></div>
    <div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px"><div class="sbox" style="max-width:260px"><span>🔍</span><input class="in" id="aq" placeholder="ค้นหา สินค้า / รายละเอียด"></div>
      <select class="in" id="au" style="width:auto"><option value="">พนักงานทุกคน</option>${members.map(m => `<option value="${m.user_id}">${esc(m.display_name || m.username)}</option>`).join('')}</select>
      <select class="in" id="ag" style="width:auto"><option value="">ทุกประเภท</option>${Object.entries(ACT_GROUP).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
      <span class="sp"></span><button class="btn" id="axl">📗 Excel</button></div>
    <div class="pills" id="atab" style="margin-bottom:10px"><button data-v="log" class="on">บันทึกทั้งหมด</button><button data-v="att">เวลาเข้างาน (ล็อกอิน)</button><button data-v="sum">สรุปตามพนักงาน</button></div>
    <div id="al"></div>`;
  let view = 'log';
  const fdet = r => esc(Object.entries(r.detail || {}).map(([k, x]) => `${{ change: 'เปลี่ยน', before: 'ก่อน', after: 'หลัง', note: 'หมายเหตุ', value: 'มูลค่า', changed: 'แก้ไข' }[k] || k}: ${Array.isArray(x) ? x.join(' → ') : x && typeof x === 'object' ? Object.entries(x).map(([a, b]) => `${a}=${typeof b === 'object' ? JSON.stringify(b) : b}`).join(', ') : x}`).join(' · ')).slice(0, 260);
  const filt = () => { const v = $('#aq').value.toLowerCase(), u = $('#au').value, g = $('#ag').value;
    return rows.filter(r => (!u || r.user_id === u) && (!g || actGroup(r.action) === g) && (!v || JSON.stringify(r).toLowerCase().includes(v))); };
  const draw = () => {
    const list = filt();
    if (view === 'log') $('#al').innerHTML = list.length ? `<div class="tblwrap"><table class="tbl"><tr><th>วัน-เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th><th>รายละเอียด</th></tr>${list.slice(0, 1000).map(r => `<tr><td style="white-space:nowrap">${dt(r.created_at)}</td><td>${esc(r.user_name)}</td>
      <td><span class="chip ${/delete|void|personal|remove|disable/.test(r.action) ? 'bad' : /login|insert|in$|create/.test(r.action) ? 'ok' : ''}">${AUDIT_L[r.action] || esc(r.action)}</span></td><td>${esc(r.entity_id)}</td><td><small class="muted">${fdet(r)}</small></td></tr>`).join('')}</table></div>
      <p class="muted">${list.length} รายการ</p>` : '<div class="empty">ไม่มีบันทึกในช่วงนี้</div>';
    if (view === 'att') { const g = {}; list.forEach(r => { const k = r.user_name + '|' + ymd(r.created_at); const o = g[k] ||= { u: r.user_name, d: ymd(r.created_at), first: r.created_at, last: r.created_at, logins: 0, acts: 0, out: '' };
        if (r.created_at < o.first) o.first = r.created_at; if (r.created_at > o.last) o.last = r.created_at; if (r.action === 'login') o.logins++; else o.acts++; if (r.action === 'logout' && r.created_at >= (o.out || '')) o.out = r.created_at; });
      const L = Object.values(g).sort((a, b) => b.d.localeCompare(a.d) || a.u.localeCompare(b.u));
      const tm = x => new Date(x).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
      $('#al').innerHTML = `<div class="tblwrap"><table class="tbl"><tr><th>วันที่</th><th>พนักงาน</th><th>เข้าระบบครั้งแรก</th><th>กิจกรรมล่าสุด</th><th>ออกจากระบบ</th><th class="right">ชั่วโมง (ประมาณ)</th><th class="right">ครั้งที่เข้า</th><th class="right">กิจกรรม</th></tr>
        ${L.map(o => `<tr><td>${dOnly(o.d)}</td><td><b>${esc(o.u)}</b></td><td>${tm(o.first)}</td><td>${tm(o.last)}</td><td>${o.out ? tm(o.out) : '—'}</td><td class="right">${((new Date(o.out || o.last) - new Date(o.first)) / 36e5).toFixed(1)}</td><td class="right">${o.logins}</td><td class="right">${o.acts}</td></tr>`).join('')}</table></div>
        <p class="muted" style="font-size:13px">คำนวณจากเวลาเข้าระบบครั้งแรกถึงกิจกรรม/ออกจากระบบครั้งสุดท้ายของแต่ละวัน</p>`; }
    if (view === 'sum') { const g = {}; list.forEach(r => { const o = g[r.user_name] ||= { u: r.user_name, n: 0, login: 0, stock: 0, product: 0, sale: 0, other: 0, last: r.created_at }; o.n++; const k = actGroup(r.action); o[k in o ? k : 'other']++; if (r.created_at > o.last) o.last = r.created_at; });
      $('#al').innerHTML = `<div class="tblwrap"><table class="tbl"><tr><th>พนักงาน</th><th class="right">เข้าระบบ</th><th class="right">สต็อก</th><th class="right">สินค้า</th><th class="right">ขาย/เงิน</th><th class="right">อื่นๆ</th><th class="right">รวม</th><th>ล่าสุด</th></tr>
        ${Object.values(g).sort((a, b) => b.n - a.n).map(o => `<tr><td><b>${esc(o.u)}</b></td><td class="right">${o.login}</td><td class="right">${o.stock}</td><td class="right">${o.product}</td><td class="right">${o.sale}</td><td class="right">${o.other + (o.staff || 0) + (o.data || 0)}</td><td class="right b">${o.n}</td><td>${dt(o.last)}</td></tr>`).join('')}</table></div>`; }
  };
  const load = async () => { $('#al').innerHTML = '<div class="skel"><i></i><i></i></div>';
    try { rows = await fetchAll(() => sb.from('audit_log').select('*').eq('shop_id', S.shop.id).gte('created_at', iso(A)).lte('created_at', iso(B)).order('created_at', { ascending: false })); rows.forEach(r => { r.user_name ||= 'ระบบ'; }); draw(); } catch (e) { fail(e); } };
  $('#aq').oninput = $('#au').onchange = $('#ag').onchange = draw;
  $$('#atab button').forEach(b => b.onclick = () => { view = b.dataset.v; $$('#atab button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#axl').onclick = () => xlsxDownload('activity_log', [{ name: 'บันทึกการใช้งาน', rows: filt().map(r => ({ 'วันเวลา': dt(r.created_at), 'ผู้ใช้': r.user_name, 'การกระทำ': AUDIT_L[r.action] || r.action, 'ประเภท': ACT_GROUP[actGroup(r.action)], 'รายการ': r.entity_id, 'รายละเอียด': JSON.stringify(r.detail || {}) })) }]);
  rangeBar($('#ar'), (a, b) => { A = a; B = b; load(); }, 'd7');
};
/* login / logout logging */
const _boot4 = boot;
boot = async function () {
  await _boot4();
  if (S.shop && S.user) { const k = 'pos_login_' + S.shop.id + '_' + S.user.id;
    if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); logAct('login', 'user', S.shop._name || S.user.email.split('@')[0], { device: /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS' : /Windows/i.test(navigator.userAgent) ? 'Windows' : /Mac/i.test(navigator.userAgent) ? 'Mac' : 'อื่นๆ', app: matchMedia('(display-mode: standalone)').matches || /Electron|ShopPOSApp/.test(navigator.userAgent) ? 'แอป' : 'เว็บ' }); } }
};
const _logout4 = logout;
logout = async function () {
  if (S.shop) { try { await Promise.race([logAct('logout', 'user', S.shop._name || '', {}), new Promise(r => setTimeout(r, 1500))]); } catch {} sessionStorage.clear(); }
  return _logout4();
};

/* ===================================================================== REPORTS (extra) */
REPORTS.push(['promo', 'โปรโมชั่น'], ['personal', 'เบิกใช้ส่วนตัว'], ['damage', 'ชำรุด / หมดอายุ / เบิก'], ['hourly', 'ยอดขายรายชั่วโมง'], ['weekday', 'ยอดขายตามวัน'],
  ['barcode', 'สินค้าและบาร์โค้ด'], ['custom', 'สินค้านอกระบบ'], ['activity', 'กิจกรรมพนักงาน'], ['branch', 'เปรียบเทียบสาขา']);
async function memberNames() { try { const m = await q(sb.from('shop_members').select('user_id, display_name, username').eq('shop_id', S.shop.id)); return Object.fromEntries(m.map(x => [x.user_id, x.display_name || x.username])); } catch { return {}; } }
const movesIn = (a, b, kinds) => fetchAll(() => sb.from('stock_moves').select('*').eq('shop_id', S.shop.id).in('kind', kinds).gte('created_at', iso(a)).lte('created_at', iso(b)).order('created_at', { ascending: false }));
Object.assign(REPORT_FN, {
  async promo(a, b) {
    const it = await fetchAll(() => sb.from('sale_items').select('name,qty,price,discount,promo,sales!inner(created_at,status,bill_no)').eq('shop_id', S.shop.id).neq('promo', '').neq('sales.status', 'void').gte('sales.created_at', iso(a)).lte('sales.created_at', iso(b)));
    const bills = await fetchAll(() => sb.from('sales').select('promo,discount,total,created_at').eq('shop_id', S.shop.id).neq('promo', '').neq('status', 'void').gte('created_at', iso(a)).lte('created_at', iso(b)));
    const g = {};
    it.forEach(r => { const o = g[r.promo] ||= { promo: r.promo, bills: new Set(), qty: 0, gross: 0, disc: 0 }; o.bills.add(r.sales.bill_no); o.qty += num(r.qty); o.gross += num(r.qty) * num(r.price); o.disc += num(r.discount); });
    const rows = Object.values(g).map(o => ({ promo: o.promo, type: 'สินค้า/หมวด', bills: o.bills.size, qty: o.qty, gross: o.gross, disc: o.disc, net: o.gross - o.disc }));
    const itemNames = new Set(Object.keys(g));
    bills.forEach(s => s.promo.split(', ').filter(n => !itemNames.has(n)).forEach(n => { let o = rows.find(r => r.promo === n && r.type === 'ทั้งบิล'); if (!o) rows.push(o = { promo: n, type: 'ทั้งบิล', bills: 0, qty: 0, gross: 0, disc: 0, net: 0 }); o.bills++; o.gross += num(s.total) + num(s.discount); o.disc += num(s.discount); o.net += num(s.total); }));
    return { summary: [['ส่วนลดโปรรวม', baht(rows.reduce((x, r) => x + r.disc, 0))], ['บิลที่ใช้โปร', bills.length]], note: 'ส่วนลดสินค้า = ส่วนลดรายการทั้งหมดในบรรทัดที่มีโปร (รวมส่วนลดที่ให้เอง)',
      cols: [['promo', 'โปรโมชั่น'], ['type', 'ประเภท'], ['bills', 'จำนวนบิล', 'n'], ['qty', 'ชิ้นที่ขาย', 'n'], ['gross', 'ยอดก่อนลด', 'm'], ['disc', 'ส่วนลด', 'm'], ['net', 'ยอดหลังลด', 'm']], rows };
  },
  async personal(a, b) {
    const mv = await movesIn(a, b, ['personal']), names = await memberNames();
    const rows = mv.map(r => ({ at: r.created_at, product: r.product_name, qty: -num(r.qty), cost: num(r.cost), value: -num(r.qty) * num(r.cost), user: names[r.user_id] || '', note: r.note }));
    return { summary: [['จำนวนครั้ง', rows.length], ['มูลค่าทุนรวม', baht(rows.reduce((x, r) => x + r.value, 0))]],
      cols: [['at', 'วันเวลา', 'dt'], ['product', 'สินค้า'], ['qty', 'จำนวน', 'n'], ['cost', 'ทุน/หน่วย', 'm'], ['value', 'มูลค่าทุน', 'm'], ['user', 'ผู้บันทึก'], ['note', 'ผู้เบิก / เหตุผล']], rows };
  },
  async damage(a, b) {
    const mv = await movesIn(a, b, ['damaged', 'expired', 'out', 'personal']), names = await memberNames();
    const rows = mv.map(r => ({ at: r.created_at, kind: (MOVE[r.kind] || ['', r.kind])[1], product: r.product_name, qty: -num(r.qty), value: -num(r.qty) * num(r.cost), user: names[r.user_id] || '', note: r.note }));
    const by = k => baht(rows.filter(r => r.kind === MOVE[k][1]).reduce((x, r) => x + r.value, 0));
    return { summary: [['ชำรุด', by('damaged')], ['หมดอายุ', by('expired')], ['เบิกออก', by('out')], ['ใช้ส่วนตัว', by('personal')]],
      cols: [['at', 'วันเวลา', 'dt'], ['kind', 'ประเภท'], ['product', 'สินค้า'], ['qty', 'จำนวน', 'n'], ['value', 'มูลค่าทุน', 'm'], ['user', 'ผู้บันทึก'], ['note', 'หมายเหตุ']], rows };
  },
  async hourly(a, b) {
    const s = await salesIn(a, b); const rows = Array.from({ length: 24 }, (_, h) => ({ h: String(h).padStart(2, '0') + ':00', bills: 0, total: 0 }));
    s.forEach(r => { const h = new Date(r.created_at).getHours(); rows[h].bills++; rows[h].total += num(r.total) - num(r.refunded_total); });
    rows.forEach(r => r.avg = r.bills ? r.total / r.bills : 0);
    const top = [...rows].sort((x, y) => y.total - x.total)[0];
    return { summary: [['ชั่วโมงขายดีที่สุด', top.total ? top.h : '—']], cols: [['h', 'ชั่วโมง'], ['bills', 'บิล', 'n'], ['total', 'ยอดขาย', 'm'], ['avg', 'เฉลี่ย/บิล', 'm']], rows: rows.filter(r => r.bills) };
  },
  async weekday(a, b) {
    const s = await salesIn(a, b); const nm = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const rows = nm.map(d => ({ d, bills: 0, total: 0 })); s.forEach(r => { const o = rows[new Date(r.created_at).getDay()]; o.bills++; o.total += num(r.total) - num(r.refunded_total); });
    rows.forEach(r => r.avg = r.bills ? r.total / r.bills : 0);
    return { cols: [['d', 'วัน'], ['bills', 'บิล', 'n'], ['total', 'ยอดขาย', 'm'], ['avg', 'เฉลี่ย/บิล', 'm']], rows };
  },
  async barcode() {
    const rows = S.products.filter(p => p.active !== false).map(p => ({ name: p.name, barcode: p.barcode || '', sku: p.sku || '', cat: catName(p.category_id), price: num(p.price), stock: num(p.stock), st: p.barcode ? 'มี' : 'ไม่มี' }));
    return { summary: [['มีบาร์โค้ด', rows.filter(r => r.barcode).length], ['ไม่มีบาร์โค้ด', rows.filter(r => !r.barcode).length]], note: 'ช่วงวันที่ไม่มีผลกับรายงานนี้ · สร้าง/พิมพ์บาร์โค้ดได้ที่เมนู “บาร์โค้ด”',
      cols: [['name', 'สินค้า'], ['barcode', 'บาร์โค้ด'], ['sku', 'SKU'], ['cat', 'หมวดหมู่'], ['price', 'ราคา', 'm'], ['stock', 'คงเหลือ', 'n'], ['st', 'สถานะ']], rows };
  },
  async custom(a, b) {
    const it = await fetchAll(() => sb.from('sale_items').select('name,qty,price,discount,cost,sales!inner(created_at,status,bill_no,cashier_name)').eq('shop_id', S.shop.id).is('product_id', null).neq('sales.status', 'void').gte('sales.created_at', iso(a)).lte('sales.created_at', iso(b)));
    const rows = it.map(r => ({ at: r.sales.created_at, bill: r.sales.bill_no, name: r.name, qty: num(r.qty), total: num(r.qty) * num(r.price) - num(r.discount), by: r.sales.cashier_name }));
    return { note: 'สินค้าที่ขายผ่านปุ่ม “ขายด่วน” (ไม่มีในระบบ) — ควรเพิ่มเป็นสินค้าจริงถ้าขายบ่อย', cols: [['at', 'วันเวลา', 'dt'], ['bill', 'บิล'], ['name', 'สินค้า'], ['qty', 'จำนวน', 'n'], ['total', 'ยอด', 'm'], ['by', 'แคชเชียร์']], rows };
  },
  async activity(a, b) {
    const rows0 = await fetchAll(() => sb.from('audit_log').select('user_name,action,created_at').eq('shop_id', S.shop.id).gte('created_at', iso(a)).lte('created_at', iso(b)));
    const g = {}; rows0.forEach(r => { const o = g[r.user_name] ||= { u: r.user_name, login: 0, stock: 0, product: 0, sale: 0, other: 0, n: 0, last: r.created_at }; const k = actGroup(r.action); o[k in o ? k : 'other']++; o.n++; if (r.created_at > o.last) o.last = r.created_at; });
    return { cols: [['u', 'พนักงาน'], ['login', 'เข้าระบบ', 'n'], ['stock', 'สต็อก', 'n'], ['product', 'สินค้า', 'n'], ['sale', 'ขาย/เงิน', 'n'], ['other', 'อื่นๆ', 'n'], ['n', 'รวม', 'n'], ['last', 'ล่าสุด', 'dt']], rows: Object.values(g) };
  },
  async branch(a, b) { return { cols: BR_COLS, rows: await branchStats(a, b), note: 'เฉพาะสาขาที่บัญชีนี้มีสิทธิ์ดูรายงาน' }; },
});
const BR_COLS = [['name', 'สาขา'], ['bills', 'บิล', 'n'], ['total', 'ยอดขายสุทธิ', 'm'], ['avg', 'เฉลี่ย/บิล', 'm'], ['gp', 'กำไรขั้นต้น', 'm'], ['exp', 'ค่าใช้จ่าย', 'm'], ['stockv', 'มูลค่าสต็อก (ทุน)', 'm'], ['low', 'สินค้าใกล้หมด', 'n']];
async function branchStats(a, b) {
  const out = [];
  for (const sh of S.shops.filter(s => ['owner', 'admin', 'manager', 'accountant'].includes(s._role))) {
    try {
      const s = await fetchAll(() => sb.from('sales').select('total,cost_total,vat,refunded_total,status').eq('shop_id', sh.id).neq('status', 'void').gte('created_at', iso(a)).lte('created_at', iso(b)));
      const ex = await fetchAll(() => sb.from('expenses').select('amount,status').eq('shop_id', sh.id).gte('spent_on', ymd(a)).lte('spent_on', ymd(b))).catch(() => []);
      const pr = await fetchAll(() => sb.from('products').select('stock,cost,low_stock,track_stock,active').eq('shop_id', sh.id));
      const total = s.reduce((x, r) => x + num(r.total) - num(r.refunded_total), 0);
      out.push({ id: sh.id, name: sh.name + (sh.branch_name ? ' · ' + sh.branch_name : ''), bills: s.length, total, avg: s.length ? total / s.length : 0,
        gp: s.reduce((x, r) => x + num(r.total) - num(r.refunded_total) - num(r.vat) - num(r.cost_total), 0), exp: ex.filter(e => e.status !== 'pending').reduce((x, e) => x + num(e.amount), 0),
        stockv: pr.filter(p => p.track_stock && p.active !== false).reduce((x, p) => x + Math.max(0, num(p.stock)) * num(p.cost), 0), low: pr.filter(p => p.track_stock && p.active !== false && num(p.stock) <= num(p.low_stock)).length });
    } catch (e) { out.push({ name: sh.name + ' (โหลดไม่ได้)', bills: 0, total: 0, avg: 0, gp: 0, exp: 0, stockv: 0, low: 0 }); }
  }
  return out;
}

/* ===================================================================== BRANCHES PAGE */
VIEWS.branches = pg => {
  let A, B;
  $('#tact').innerHTML = can('owner') ? '<button class="btn p" id="nbr">+ เพิ่มสาขา</button>' : '';
  pg.innerHTML = `<div id="brr"></div><div id="brb"><div class="skel"><i></i><i></i></div></div>`;
  const load = async () => {
    const rows = await branchStats(A, B), tot = rows.reduce((x, r) => x + r.total, 0);
    $('#brb').innerHTML = `<div class="stats"><div class="stat"><div class="k">จำนวนสาขา</div><div class="v">${S.shops.length}</div></div><div class="stat"><div class="k">ยอดขายรวมทุกสาขา</div><div class="v">${baht(tot)}</div></div>
      <div class="stat"><div class="k">บิลรวม</div><div class="v">${rows.reduce((x, r) => x + r.bills, 0)}</div></div></div>
      <div class="brgrid">${rows.map(r => `<div class="card brcard ${r.id === S.shop.id ? 'cur' : ''}"><div class="row"><b style="flex:1;font-size:17px">🏬 ${esc(r.name)}</b>${r.id === S.shop.id ? '<span class="chip ok">กำลังใช้งาน</span>' : `<button class="btn sm" data-sw="${r.id}">สลับไปสาขานี้</button>`}</div>
        <div class="bbar"><i style="width:${tot ? r.total / tot * 100 : 0}%"></i></div>
        <div class="grid2" style="gap:6px;margin-top:8px"><div><small class="muted">ยอดขาย</small><div class="b">${baht(r.total)}</div></div><div><small class="muted">บิล</small><div class="b">${r.bills}</div></div>
          <div><small class="muted">กำไรขั้นต้น</small><div class="b">${canDo('view_profit') ? baht(r.gp) : '—'}</div></div><div><small class="muted">ค่าใช้จ่าย</small><div class="b">${baht(r.exp)}</div></div>
          <div><small class="muted">มูลค่าสต็อก</small><div class="b">${canDo('view_profit') ? baht(r.stockv) : '—'}</div></div><div><small class="muted">ใกล้หมด</small><div class="b" style="color:${r.low ? 'var(--warn)' : ''}">${r.low}</div></div></div></div>`).join('')}</div>`;
    $$('[data-sw]', pg).forEach(b => b.onclick = () => { localStorage.setItem('pos_shop', b.dataset.sw); location.hash = 'dashboard'; location.reload(); });
  };
  if ($('#nbr')) $('#nbr').onclick = () => formModal('เพิ่มสาขาใหม่', [{ k: 'name', label: 'ชื่อร้าน / สาขา', req: true, full: true }, { k: 'branch_name', label: 'ชื่อสาขา' }, { k: 'branch_code', label: 'รหัสสาขา', def: '00001' },
    { k: 'copy', label: 'คัดลอกสินค้าและหมวดหมู่จากสาขานี้ (สต็อกเริ่มที่ 0)', type: 'check', def: true }], { name: S.shop.name, branch_code: String(S.shops.length).padStart(5, '0') }, async o => {
    const shop = await q(sb.from('shops').insert({ name: o.name, owner_id: S.user.id }).select().single()); const sid = shop.id;
    const keep = ['address', 'phone', 'tax_id', 'vat_mode', 'vat_rate', 'promptpay_id', 'receipt_header', 'receipt_footer', 'points_per_baht', 'baht_per_point', 'logo_url', 'receipt_size', 'brand_color', 'era', 'decimals', 'business_type'];
    await sb.from('shops').update({ ...Object.fromEntries(keep.map(k => [k, S.shop[k]])), branch_name: o.branch_name || '', branch_code: o.branch_code || '' }).eq('id', sid);
    if (o.copy) { const map = {};
      for (const c of S.categories) { const n = await q(sb.from('categories').insert({ shop_id: sid, name: c.name, color: c.color, sort: c.sort }).select('id').single()); map[c.id] = n.id; }
      const rows = S.products.filter(p => p.active !== false).map(p => { const r = { ...p }; delete r.id; delete r.created_at; return { ...r, shop_id: sid, stock: 0, category_id: map[p.category_id] || null, supplier_id: null }; });
      for (let i = 0; i < rows.length; i += 200) await q(sb.from('products').insert(rows.slice(i, i + 200))); }
    toast('สร้างสาขาแล้ว — กำลังโหลดใหม่', 'ok'); setTimeout(() => location.reload(), 800);
  });
  rangeBar($('#brr'), (a, b) => { A = a; B = b; load().catch(fail); }, 'month');
};

/* ===================================================================== BRANDING */
function applyBrand() {
  const sh = S.shop || {}; const c = sh.brand_color;
  const root = document.documentElement.style;
  if (c && /^#[0-9a-f]{6}$/i.test(c)) { root.setProperty('--brand', c); root.setProperty('--brand2', c); root.setProperty('--grad', c); }
  else ['--brand', '--brand2', '--grad'].forEach(k => root.removeProperty(k));
  if (sh.name) { document.title = sh.name + ' · Yanisa Shop'; localStorage.setItem('pos_brand', JSON.stringify({ name: sh.name, logo: sh.logo_url || '', color: c || '' })); }
  const lg = $('.side .logo'); if (lg) {
    { const i = lg.querySelector('i'); if (i) { i.style.background = 'transparent'; i.style.boxShadow = 'none'; i.innerHTML = `<img src="${esc(sh.logo_url || 'logo-round.png')}" alt="" style="width:100%;height:100%;object-fit:contain">`; } }
    const lt = lg.querySelector('.lt'); if (lt && lt.firstChild?.nodeType === 3) lt.firstChild.textContent = sh.name;
    const sn = lg.querySelector('.shopname'); if (sn) sn.textContent = sh.branch_name || (S.shops.length > 1 ? 'สาขา ' + (sh.branch_code || '') : 'Yanisa Shop');
  }
  const meta = document.querySelector('meta[name=theme-color]'); if (meta && c) meta.content = c;
}
const _renderShell4 = renderShell;
renderShell = function () { _renderShell4(); applyBrand(); };
const _renderAuth4 = renderAuth;
renderAuth = function () {
  _renderAuth4();
  let br = {}; try { br = JSON.parse(localStorage.getItem('pos_brand') || '{}'); } catch {}
  if (br.color) document.documentElement.style.setProperty('--brand', br.color);
  const bm = $('.auth .brandmark'); if (bm) bm.outerHTML = '<span style="flex:1"></span>';
  $('.auth .card .row')?.insertAdjacentHTML('afterend', '<img class="authlogo" src="logo-round.png" alt="Yanisa Shop">');
  document.title = 'Yanisa Shop';
  $('.auth .card')?.insertAdjacentHTML('beforeend', `<p class="muted" style="font-size:11px;text-align:center;margin:10px 0 0">v${APP_VERSION}</p>`);
};

/* settings: brand & receipt-image & barcode card */
const _settings4 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings4(pg);
  const sh = S.shop, edit = canDo('manage_settings');
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('afterbegin', `<div class="card" style="margin-bottom:16px"><h3 style="margin-top:0">🎨 แบรนด์ร้าน · ใบเสร็จรูปภาพ · บาร์โค้ด</h3>
    <div class="grid2"><div class="fg"><label class="f">สีหลักของแอป</label><div class="row"><input type="color" class="in" id="bcol" value="${esc(sh.brand_color || '#1d4ed8')}" style="width:64px;padding:4px" ${edit ? '' : 'disabled'}>
      ${['#1d4ed8', '#0f766e', '#7c3aed', '#be123c', '#c2410c', '#15803d', '#0f172a'].map(c => `<button type="button" class="swatch" data-col="${c}" style="background:${c}" ${edit ? '' : 'disabled'}></button>`).join('')}
      <button type="button" class="btn sm" id="bcolx" ${edit ? '' : 'disabled'}>ค่าเริ่มต้น</button></div></div>
      <div class="fg"><label class="f">เลขนำหน้าบาร์โค้ดภายในร้าน (200–299)</label><input class="in" id="bpre" value="${esc(sh.barcode_prefix || '200')}" maxlength="5" inputmode="numeric" ${edit ? '' : 'disabled'}></div></div>
    <label class="row"><input type="checkbox" id="basr" ${sh.auto_save_receipt ? 'checked' : ''} ${edit ? '' : 'disabled'}> บันทึกรูปใบเสร็จลงเครื่องอัตโนมัติหลังชำระเงินทุกบิล (แกลเลอรี / โฟลเดอร์ดาวน์โหลด)</label>
    <p class="muted" style="font-size:13px">ชื่อร้านและโลโก้ (ตั้งค่าในหัวข้อ “ข้อมูลร้าน”) จะแสดงที่หน้าเข้าสู่ระบบ แถบเมนู ชื่อแท็บ และใบเสร็จ · เวอร์ชันแอป ${APP_VERSION}</p>
    ${edit ? '<button type="button" class="btn p" id="bsave">💾 บันทึกแบรนด์</button>' : ''}</div>`);
  $$('[data-col]', pg).forEach(b => b.onclick = () => { $('#bcol').value = b.dataset.col; document.documentElement.style.setProperty('--brand', b.dataset.col); });
  $('#bcol').oninput = e => document.documentElement.style.setProperty('--brand', e.target.value);
  if ($('#bcolx')) $('#bcolx').onclick = () => { $('#bcol').value = '#1d4ed8'; $('#bcol').dataset.reset = '1'; };
  if ($('#bsave')) $('#bsave').onclick = async () => {
    const pre = $('#bpre').value.replace(/\D/g, '');
    if (!/^2\d{2,4}$/.test(pre)) return toast('เลขนำหน้าควรขึ้นต้นด้วย 2 (สำหรับใช้ภายในร้าน) และยาว 3–5 หลัก', 'bad');
    try { Object.assign(sh, await q(sb.from('shops').update({ brand_color: $('#bcol').dataset.reset ? '' : $('#bcol').value, barcode_prefix: pre, auto_save_receipt: $('#basr').checked }).eq('id', sh.id).select().single()));
      logAct('settings', 'shop', 'แบรนด์', {}); applyBrand(); toast('บันทึกแล้ว', 'ok'); } catch (e) { fail(e); }
  };
};

/* ===================================================================== AUTO UPDATE (silent) */
const canAutoReload = () => { const a = document.activeElement; return !(S.cart && S.cart.length) && !document.querySelector('.mbg, .cmdk') && !(a?.matches?.('input,textarea,select') && a.value); };
let UPD = null;
const updTries = ver => +(sessionStorage.getItem('pos_upd_try_' + ver) || 0);
async function applyUpdate(ver) {
  if (updTries(ver) >= 2) { UPD = null; $('#updchip')?.remove(); return; }   // never loop: at most 2 reloads per new version
  sessionStorage.setItem('pos_upd_try_' + ver, updTries(ver) + 1);
  try { const regs = await navigator.serviceWorker?.getRegistrations?.() || []; await Promise.all(regs.map(x => x.update().catch(() => {})));
    if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch {}
  sessionStorage.setItem('pos_updated_to', ver); location.reload();
}
async function checkUpdate(manual) {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
    const v = await r.json();
    if (v.version && v.version !== APP_VERSION) {
      if (updTries(v.version) >= 2 && !manual) return;
      UPD = v.version;
      if (canAutoReload() || manual) return applyUpdate(v.version);
      if (!$('#updchip')) document.body.insertAdjacentHTML('beforeend', `<div id="updchip" class="updchip">✨ เวอร์ชันใหม่ ${esc(v.version)} — จะอัปเดตเองหลังจบบิลนี้</div>`);
    } else if (manual) toast('ใช้เวอร์ชันล่าสุดแล้ว (' + APP_VERSION + ')', 'ok');
  } catch {}
}
setInterval(() => { if (UPD && canAutoReload()) applyUpdate(UPD); }, 4000);
setTimeout(() => checkUpdate(), 2500); setInterval(() => checkUpdate(), 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
window.addEventListener('online', () => checkUpdate());
{ const u = sessionStorage.getItem('pos_updated_to'); if (u) { sessionStorage.removeItem('pos_updated_to'); if (u === APP_VERSION) setTimeout(() => toast(`อัปเดตเป็นเวอร์ชัน ${u} แล้ว ✨`, 'ok'), 1500); } }

/* ===================================================================== NATIVE APP (Android Capacitor / desktop) */
const isNativeApp = () => !!window.Capacitor?.isNativePlatform?.();
async function nativeSave(name, blob) {
  try {
    const { Filesystem, Share } = window.Capacitor.Plugins;
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
    const { uri } = await Filesystem.writeFile({ path: name, data: b64, directory: 'CACHE' });
    await Share.share({ title: name, url: uri, dialogTitle: 'บันทึก / ส่งไฟล์' });
  } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('บันทึกไฟล์ไม่สำเร็จ: ' + (e?.message || e), 'bad'); }
}
if (isNativeApp()) {
  const _aclick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download && /^(blob|data):/.test(this.href)) { const n = this.download; fetch(this.href).then(r => r.blob()).then(b => nativeSave(n, b)); return; }
    return _aclick.call(this);
  };
}
const APP_DL = 'https://github.com/khalil203/khalil203/releases/latest/download/';
const _settings4b = VIEWS.settings;
VIEWS.settings = pg => {
  _settings4b(pg);
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:16px"><h3 style="margin-top:0">📲 ดาวน์โหลดแอป · อัปเดต</h3>
    <p class="muted" style="margin-top:0">แอปทุกตัวเปิดระบบเดียวกันนี้และอัปเดตอัตโนมัติ — ข้อมูลเหมือนกันทุกเครื่อง · เวอร์ชันปัจจุบัน <b>${APP_VERSION}</b></p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <a class="btn" href="${APP_DL}YanisaShop.apk">🤖 Android (.apk)</a>
      <a class="btn" href="${APP_DL}YanisaShop-Setup.exe">🪟 Windows (ติดตั้ง .exe)</a>
      <a class="btn" href="${APP_DL}YanisaShop-Portable.exe">🪟 Windows (ไม่ต้องติดตั้ง)</a>
      <a class="btn" href="${APP_DL}YanisaShop-mac.dmg">🍎 Mac (.dmg)</a>
      <button type="button" class="btn" id="updChk">🔄 ตรวจหาอัปเดต</button></div>
    <p class="muted" style="font-size:13px">iPhone / iPad: เปิดลิงก์ใน Safari → แชร์ → “เพิ่มไปยังหน้าจอโฮม” · Android: ครั้งแรกให้อนุญาต “ติดตั้งแอปที่ไม่รู้จัก” · Windows: ถ้ามีคำเตือนกด “More info → Run anyway” · Mac: คลิกขวาที่แอป → Open</p></div>`);
  $('#updChk').onclick = () => checkUpdate(true);
};
/* ================= v4.1 — organized reports, label designer ================= */

/* ---------- REPORTS: grouped report center ---------- */
const REPORT_GROUPS = [
  ['sell', '💰', 'ยอดขาย', 'ยอดขาย บิล ช่วงเวลา และช่องทางชำระ', ['sales', 'hourly', 'weekday', 'payment', 'vat', 'refund']],
  ['profit', '📈', 'กำไร & ค่าใช้จ่าย', 'กำไรขั้นต้น กำไรสุทธิ และค่าใช้จ่าย', ['profit', 'expense']],
  ['goods', '📦', 'สินค้า & สต็อก', 'สินค้าขายดี หมวดหมู่ คงคลัง และความเคลื่อนไหว', ['product', 'category', 'inventory', 'moves', 'barcode', 'custom']],
  ['loss', '🙋', 'เบิก / ชำรุด / ใช้เอง', 'ของออกจากสต็อกที่ไม่ได้ขาย', ['personal', 'damage']],
  ['promo', '🏷️', 'โปรโมชั่น', 'ผลของโปรโมชั่นแต่ละรายการ', ['promo']],
  ['people', '👥', 'ลูกค้า & ผู้จำหน่าย', 'ลูกค้า และการสั่งซื้อ', ['customer', 'purchase']],
  ['staff', '🧑‍💼', 'พนักงาน & กะ', 'ผลงานแคชเชียร์ กะ และกิจกรรม', ['staff', 'shift', 'activity']],
  ['branch', '🏬', 'สาขา', 'เปรียบเทียบทุกสาขา', ['branch']],
];
const _reportsView41 = VIEWS.reports;
VIEWS.reports = pg => {
  _reportsView41(pg);
  const rk = $('#rk', pg); if (!rk) return;
  const avail = new Set($$('button', rk).map(b => b.dataset.k));
  const groups = REPORT_GROUPS.map(g => [...g.slice(0, 4), g[4].filter(k => avail.has(k))]).filter(g => g[4].length);
  let G = localStorage.getItem('pos_rep_group') || 'sell'; if (!groups.find(g => g[0] === G)) G = groups[0][0];
  rk.style.display = 'none';
  rk.insertAdjacentHTML('beforebegin', `<div class="rgroups" id="rgs">${groups.map(([k, ic, l, d]) => `<button data-g="${k}"><span class="ri">${ic}</span><b>${l}</b><small>${d}</small></button>`).join('')}</div>
    <div class="rsub" id="rsub"></div>`);
  const label = k => REPORTS.find(r => r[0] === k)?.[1] || k;
  const pick = k => { $(`#rk [data-k="${k}"]`, pg)?.click(); $$('#rsub button', pg).forEach(b => b.classList.toggle('on', b.dataset.r === k)); localStorage.setItem('pos_rep_last', k); };
  const drawG = (first) => {
    $$('#rgs [data-g]', pg).forEach(b => b.classList.toggle('on', b.dataset.g === G));
    const g = groups.find(x => x[0] === G);
    $('#rsub', pg).innerHTML = g[4].map(k => `<button data-r="${k}">${esc(label(k))}</button>`).join('');
    $$('#rsub [data-r]', pg).forEach(b => b.onclick = () => pick(b.dataset.r));
    const last = localStorage.getItem('pos_rep_last');
    pick(first && g[4].includes(last) ? last : g[4][0]);
  };
  $$('#rgs [data-g]', pg).forEach(b => b.onclick = () => { G = b.dataset.g; localStorage.setItem('pos_rep_group', G); drawG(); });
  drawG(true);
};

/* ---------- LABEL DESIGNER: templates × sizes × price modes ---------- */
let JSPDF_P = null;
function a4Layout(z) {
  const cols = z.a4 || 1, gap = cols > 1 ? Math.max(0, Math.min(3, (200 - cols * z.w) / (cols - 1))) : 0;
  const rows = Math.max(1, Math.floor(297 / z.h)), mx = Math.max(0, (210 - cols * z.w - (cols - 1) * gap) / 2), my = Math.max(0, (297 - rows * z.h) / 2);
  return { cols, rows, gap, mx, my };
}
const LBL_SIZES = {
  's30x20': { w: 30, h: 20, n: '30 × 20 มม. (เล็กมาก)' }, 's40x25': { w: 40, h: 25, n: '40 × 25 มม.' }, 's40x30': { w: 40, h: 30, n: '40 × 30 มม. (ยอดนิยม)' },
  's50x30': { w: 50, h: 30, n: '50 × 30 มม.' }, 's50x40': { w: 50, h: 40, n: '50 × 40 มม.' }, 's58x40': { w: 58, h: 40, n: '58 × 40 มม.' },
  's70x50': { w: 70, h: 50, n: '70 × 50 มม. (ป้ายราคา)' }, 's100x50': { w: 100, h: 50, n: '100 × 50 มม. (ป้ายใหญ่)' }, 's100x150': { w: 100, h: 150, n: '100 × 150 มม. (ป้ายโปรตั้งโต๊ะ)' },
  'a4-65': { w: 38.1, h: 21.2, a4: 5, n: 'A4 · 65 ดวง (5 × 13)' }, 'a4-40': { w: 52.5, h: 29.7, a4: 4, n: 'A4 · 40 ดวง (4 × 10)' }, 'a4-24': { w: 70, h: 37, a4: 3, n: 'A4 · 24 ดวง (3 × 8)' },
  'a4-14': { w: 99, h: 38, a4: 2, n: 'A4 · 14 ดวง ป้ายชั้นวาง (2 × 7)' }, 'a4-8': { w: 105, h: 74, a4: 2, n: 'A4 · 8 ดวง ป้ายโปร (2 × 4)' }, 'a4-1': { w: 190, h: 270, a4: 1, n: 'A4 · 1 แผ่น โปสเตอร์โปร' },
};
const LBL_TPL = {
  classic: 'มาตรฐาน — ชื่อ + บาร์โค้ด + ราคา', bigprice: 'ราคาตัวใหญ่', shelf: 'ป้ายชั้นวาง (ชื่อใหญ่ + ราคา)', promo: 'ป้ายโปรโมชั่น — ราคาเดิมขีดฆ่า',
  burst: 'ป้ายโปรสีสด (ลดกี่ %)', mini: 'บาร์โค้ดอย่างเดียว', qr: 'QR โค้ด + ชื่อ + ราคา', dark: 'โทนเข้ม พรีเมียม',
};
const LBL_PRICE = { auto: 'อัตโนมัติ (ใช้ราคาโปรถ้ามี)', retail: 'ราคาขายปกติ', promo: 'ราคาโปร / โปรโมชั่น', wholesale: 'ราคาส่ง', none: 'ไม่แสดงราคา' };
let LBL_OPT = { tpl: 'classic', size: 's40x30', price: 'auto', copies: 1, byStock: false, name: true, code: true, shop: false, unit: false, color: '#1d4ed8', only: false };
try { Object.assign(LBL_OPT, JSON.parse(localStorage.getItem('pos_label_opt') || '{}')); } catch {}
function lblPrices(p, mode) {
  const retail = num(p.price), pp = num(p.promo_price) > 0 ? num(p.promo_price) : 0, ws = num(p.wholesale_price);
  const pr = itemPromosFor(p)[0];
  let promoPrice = pp, tag = '';
  if (pr) { tag = promoLabel(pr);
    if (['percent', 'amount', 'fixed_price'].includes(pr.kind)) promoPrice = r2(Math.max(0, (pp || retail) - promoLineDisc(pr, 1, pp || retail))); }
  const hasPromo = (promoPrice > 0 && promoPrice < retail) || !!tag;
  const now = mode === 'retail' ? retail : mode === 'wholesale' ? (ws || retail) : mode === 'none' ? null : (mode === 'promo' || mode === 'auto') && promoPrice > 0 ? promoPrice : retail;
  const old = (mode === 'auto' || mode === 'promo') && promoPrice > 0 && promoPrice < retail ? retail : null;
  const pct = old ? Math.round((1 - now / old) * 100) : (pr?.kind === 'percent' ? num(pr.value) : 0);
  return { now, old, tag, pct, hasPromo };
}
const BC_CACHE = new Map(), QR_CACHE = new Map();
async function barcodeImg(code) {
  if (BC_CACHE.has(code)) return BC_CACHE.get(code);
  await loadJsBarcode();
  const c = document.createElement('canvas');
  const opt = { height: 80, width: 2, displayValue: false, margin: 2 };
  try { JsBarcode(c, code, { ...opt, format: validEAN(code) ? 'EAN13' : 'CODE128' }); } catch { JsBarcode(c, code, { ...opt, format: 'CODE128' }); }
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob); BC_CACHE.set(code, url); return url;
}
const waitImgs = root => Promise.all([...root.querySelectorAll('img')].map(i => i.decode ? i.decode().catch(() => {}) : null));
/* render many labels fast: one light iframe (html2canvas copies only it), 24 labels per pass, then cut each label out */
async function renderLabelImages(items, o, onProg) {
  const z = LBL_SIZES[o.size], scale = z.w > 90 ? 2.2 : 3, perRow = 6;
  const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-30000px;top:0;width:3000px;height:2000px;border:0';
  document.body.appendChild(fr);
  const d = fr.contentDocument; d.open();
  d.write(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Prompt:wght@500;600;700;800;900&display=swap">
    <style>body{margin:0;background:${o.tpl === 'dark' ? '#0f172a' : '#fff'}}${lblCSS(o).replace(/@page\{[^}]*\}/, '')}#g{display:flex;flex-wrap:wrap;width:${(perRow * z.w).toFixed(2)}mm}#g .lb{page-break-after:auto!important;break-after:auto!important}</style></head><body><div id="g"></div></body></html>`);
  d.close();
  await Promise.race([d.fonts?.ready, new Promise(r => setTimeout(r, 2500))]);
  const out = [], g = d.getElementById('g'), per = perRow * 4;
  try {
    for (let i = 0; i < items.length; i += per) {
      const chunk = items.slice(i, i + per); g.innerHTML = chunk.map(it => it.html).join('');
      await waitImgs(g);
      const cv = await html2canvas(g, { scale, backgroundColor: o.tpl === 'dark' ? '#0f172a' : '#ffffff', logging: false, useCORS: true });
      const gr = g.getBoundingClientRect();
      [...g.querySelectorAll('.lb')].forEach((el, j) => {
        const r = el.getBoundingClientRect(), w = Math.round(r.width * scale), h = Math.round(r.height * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(cv, Math.round((r.left - gr.left) * scale), Math.round((r.top - gr.top) * scale), w, h, 0, 0, w, h);
        out.push({ url: c.toDataURL('image/jpeg', 0.9), k: chunk[j].k, id: 'L' + out.length });
      });
      onProg?.(Math.min(items.length, i + per), items.length); await yieldUI();
    }
  } finally { fr.remove(); }
  return out;
}
function qrImg(text) {
  if (!QR_CACHE.has(text)) QR_CACHE.set(text, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg(text)));
  return QR_CACHE.get(text);
}
const yieldUI = () => new Promise(r => setTimeout(r, 0));
function lblCSS(o) { return lblCSS0(o).replace(/ svg\{/g, ' :is(svg,img){').replace(/\.lb \.bc :is\(svg,img\)\{/, '.lb .bc :is(svg,img){object-fit:fill;display:block;'); }
function lblCSS0(o) {
  const z = LBL_SIZES[o.size], W = z.w, H = z.h, u = Math.min(W, H * 1.6);
  const L = a4Layout(z), pageCSS = z.a4 ? `@page{size:A4;margin:${L.my.toFixed(2)}mm ${L.mx.toFixed(2)}mm}` : `@page{size:${W}mm ${H}mm;margin:0}`;
  return `${pageCSS}
  .lbls{display:${z.a4 ? 'grid' : 'block'};${z.a4 ? `grid-template-columns:repeat(${z.a4},${W}mm);gap:0 ${L.gap.toFixed(2)}mm;` : ''}}
  .lb{width:${W}mm;height:${H}mm;box-sizing:border-box;padding:${(H * .05).toFixed(2)}mm ${(W * .04).toFixed(2)}mm;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
    text-align:center;font-family:'Prompt','IBM Plex Sans Thai',sans-serif;color:#111;background:#fff;page-break-inside:avoid;break-inside:avoid;${z.a4 ? '' : 'page-break-after:always;break-after:page;'}}
  .lb .ln{font-size:${(H * .12).toFixed(2)}mm;font-weight:600;line-height:1.15;width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .lb .bc{width:100%;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .lb .bc svg{width:96%;height:100%;max-height:${(H * .42).toFixed(2)}mm}
  .lb .cd{font-size:${(H * .075).toFixed(2)}mm;letter-spacing:.06em;line-height:1}
  .lb .pp{font-size:${(H * .17).toFixed(2)}mm;font-weight:800;line-height:1.05;color:${o.color}}
  .lb .od{font-size:${(H * .09).toFixed(2)}mm;color:#777;text-decoration:line-through}
  .lb .sh{font-size:${(H * .07).toFixed(2)}mm;color:#666;line-height:1}
  .lb .un{font-size:${(H * .08).toFixed(2)}mm;color:#555}
  .lb .tg{position:absolute;top:0;right:0;background:#e5384f;color:#fff;font-weight:800;font-size:${(H * .085).toFixed(2)}mm;padding:.4mm 1.4mm;border-bottom-left-radius:2mm;max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lb.t-bigprice .pp{font-size:${(H * .3).toFixed(2)}mm}.lb.t-bigprice .bc svg{max-height:${(H * .28).toFixed(2)}mm}
  .lb.t-shelf{align-items:stretch;text-align:left;border-left:${(W * .03).toFixed(2)}mm solid ${o.color}}
  .lb.t-shelf .ln{font-size:${(H * .16).toFixed(2)}mm;font-weight:800}.lb.t-shelf .row2{display:flex;align-items:flex-end;justify-content:space-between;gap:1mm;width:100%}
  .lb.t-shelf .pp{font-size:${(H * .3).toFixed(2)}mm}.lb.t-shelf .bc{flex:0 0 auto;width:45%;align-items:flex-start}.lb.t-shelf .bc svg{max-height:${(H * .3).toFixed(2)}mm}
  .lb.t-promo{border:${(u * .025).toFixed(2)}mm solid #e5384f}.lb.t-promo .pp{color:#e5384f;font-size:${(H * .26).toFixed(2)}mm}
  .lb.t-burst{background:linear-gradient(160deg,#ffe14d,#ffb703);}.lb.t-burst .pct{background:#e5384f;color:#fff;border-radius:50%;width:${(u * .34).toFixed(2)}mm;height:${(u * .34).toFixed(2)}mm;display:grid;place-items:center;
    font-weight:900;font-size:${(u * .1).toFixed(2)}mm;line-height:1;position:absolute;top:${(H * .04).toFixed(2)}mm;right:${(W * .03).toFixed(2)}mm;transform:rotate(-12deg)}
  .lb.t-burst .pp{color:#b00020;font-size:${(H * .28).toFixed(2)}mm}.lb.t-burst .ln{font-weight:800;padding-right:${(u * .3).toFixed(2)}mm}
  .lb.t-mini .bc svg{max-height:${(H * .72).toFixed(2)}mm}
  .lb.t-qr{flex-direction:row;gap:1.5mm;text-align:left}.lb.t-qr .qrb{height:100%;aspect-ratio:1/1;flex:0 0 auto}.lb.t-qr .qrb svg{width:100%;height:100%}
  .lb.t-qr .txt{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.6mm;min-width:0}
  .lb.t-dark{background:#0f172a;color:#fff}.lb.t-dark .pp{color:#facc15}.lb.t-dark .bc{background:#fff;border-radius:1mm;padding:.5mm}.lb.t-dark .sh,.lb.t-dark .un{color:#cbd5e1}`;
}
async function lblHTML(p, o) {
  const pr = lblPrices(p, o.price), money2 = v => '฿' + money(v);
  const code = p.barcode || p.sku || '';
  const svg = code && o.tpl !== 'qr' ? `<img src="${await barcodeImg(code)}" alt="">` : '';
  const nm = o.name ? `<div class="ln">${esc(p.name)}</div>` : '';
  const price = pr.now == null ? '' : `<div>${pr.old ? `<span class="od">${money2(pr.old)}</span> ` : ''}<span class="pp">${money2(pr.now)}</span>${o.unit && p.unit ? `<span class="un"> / ${esc(p.unit)}</span>` : ''}</div>`;
  const bc = code ? `<div class="bc">${svg}${o.code ? `<div class="cd">${esc(code)}</div>` : ''}</div>` : '<div class="bc"><small style="color:#c00">ไม่มีบาร์โค้ด</small></div>';
  const shop = o.shop ? `<div class="sh">${esc(S.shop.name)}</div>` : '';
  const tag = pr.tag && o.price !== 'none' && !['burst', 'mini'].includes(o.tpl) ? `<div class="tg">${esc(pr.tag)}</div>` : '';
  let inner;
  switch (o.tpl) {
    case 'mini': inner = bc; break;
    case 'bigprice': inner = nm + price + bc; break;
    case 'shelf': inner = `${shop}${nm}<div class="row2">${bc}${price}</div>`; break;
    case 'promo': inner = `${tag}${nm}${price}${bc}`; break;
    case 'burst': inner = `${pr.pct || pr.tag ? `<div class="pct">${pr.pct ? '-' + pr.pct + '%' : esc(pr.tag).slice(0, 12)}</div>` : ''}${nm}${price}${bc}`; break;
    case 'qr': inner = `<div class="qrb"><img src="${qrImg(code || p.name)}" alt=""></div><div class="txt">${shop}${nm}${price}${o.code && code ? `<div class="cd">${esc(code)}</div>` : ''}</div>`; break;
    default: inner = `${tag}${shop}${nm}${bc}${price}`;
  }
  return `<div class="lb t-${o.tpl}">${inner}</div>`;
}
printLabels = async function (items) {
  const o = { ...LBL_OPT };
  const m = modal(`🏷️ สร้าง / พิมพ์ฉลาก — ${items.length} สินค้า`, `<div class="lbd">
    <div class="lbd-opt">
      <div class="fg"><label class="f">รูปแบบ (Template)</label><div class="tplgrid">${Object.entries(LBL_TPL).map(([k, l]) => `<button type="button" data-t="${k}" class="${o.tpl === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="fg"><label class="f">ขนาดฉลาก</label><select class="in" id="ls">${Object.entries(LBL_SIZES).map(([k, z]) => `<option value="${k}" ${o.size === k ? 'selected' : ''}>${z.n}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">ราคาที่แสดง</label><select class="in" id="lpr">${Object.entries(LBL_PRICE).map(([k, l]) => `<option value="${k}" ${o.price === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="grid2"><div class="fg"><label class="f">จำนวนดวง / สินค้า</label><input class="in" id="lq" type="number" min="1" value="${o.copies}"></div>
        <div class="fg"><label class="f">สีหลัก</label><input class="in" id="lc" type="color" value="${o.color}" style="padding:3px;height:42px"></div></div>
      <label class="row"><input type="checkbox" id="lbs" ${o.byStock ? 'checked' : ''}> พิมพ์ตามจำนวนสต็อก</label>
      <label class="row"><input type="checkbox" id="lonly" ${o.only ? 'checked' : ''}> เฉพาะสินค้าที่มีโปรโมชั่น</label>
      <label class="row"><input type="checkbox" id="lpn" ${o.name ? 'checked' : ''}> ชื่อสินค้า</label>
      <label class="row"><input type="checkbox" id="lcd" ${o.code ? 'checked' : ''}> ตัวเลขบาร์โค้ด</label>
      <label class="row"><input type="checkbox" id="lun" ${o.unit ? 'checked' : ''}> หน่วย (/ชิ้น)</label>
      <label class="row"><input type="checkbox" id="lsh" ${o.shop ? 'checked' : ''}> ชื่อร้าน</label>
    </div>
    <div class="lbd-prev"><div class="muted" id="lcount"></div><div id="lprev" class="lprev"></div></div></div>`,
    { wide: true, foot: `<button class="btn" id="lpdf">⬇ ดาวน์โหลด PDF</button><button class="btn" id="lxl">📗 ส่งออกรายการ</button><button class="btn p" id="lgo">🖨️ พิมพ์</button>` });
  m.querySelector('.modal')?.classList.add('xwide');
  const read = () => Object.assign(o, { size: $('#ls', m).value, price: $('#lpr', m).value, copies: Math.max(1, +$('#lq', m).value || 1), color: $('#lc', m).value,
    byStock: $('#lbs', m).checked, only: $('#lonly', m).checked, name: $('#lpn', m).checked, code: $('#lcd', m).checked, unit: $('#lun', m).checked, shop: $('#lsh', m).checked });
  const targets = () => items.filter(p => !o.only || lblPrices(p, 'auto').hasPromo);
  const count = () => targets().reduce((a, p) => a + (o.byStock ? Math.max(0, Math.floor(num(p.stock))) : o.copies), 0);
  let tmr;
  const prev2 = async () => {
    read(); localStorage.setItem('pos_label_opt', JSON.stringify(o));
    const z = LBL_SIZES[o.size], tg = targets();
    $('#lcount', m).textContent = `ตัวอย่าง · ${tg.length} สินค้า · รวม ${count()} ดวง · ${z.n}`;
    const scale = Math.min(1.7, 250 / (z.w * 3.78));
    const cells = await Promise.all(tg.slice(0, 8).map(async p => `<div class="lcell" style="width:${(z.w * scale).toFixed(1)}mm;height:${(z.h * scale).toFixed(1)}mm"><div style="transform:scale(${scale});transform-origin:0 0">${await lblHTML(p, o)}</div></div>`));
    $('#lprev', m).innerHTML = `<style>${lblCSS(o).replace(/@page\{[^}]*\}/, '')}</style>${cells.join('') || '<div class="muted">ไม่มีสินค้าตามเงื่อนไข</div>'}`;
  };
  const go2 = () => { clearTimeout(tmr); tmr = setTimeout(() => prev2().catch(fail), 120); };
  $$('[data-t]', m).forEach(b => b.onclick = () => { o.tpl = b.dataset.t; LBL_OPT.tpl = o.tpl; $$('[data-t]', m).forEach(x => x.classList.toggle('on', x === b));
    if (['promo', 'burst'].includes(o.tpl) && o.price === 'retail') $('#lpr', m).value = 'auto'; go2(); });
  $('.lbd-opt', m).addEventListener('input', go2); $('.lbd-opt', m).addEventListener('change', go2);
  const progress = (txt, f) => { let el = $('#lprog', m); if (!el) { $('.lbd-prev', m).insertAdjacentHTML('afterbegin', '<div id="lprog" class="lprog"><span></span><div class="bar"><i></i></div></div>'); el = $('#lprog', m); }
    if (f == null) { el.remove(); return; } el.querySelector('span').textContent = txt; el.querySelector('i').style.width = Math.round(f * 100) + '%'; };
  let busy = false;
  const setBusy = b => { busy = b; $$('.mf .btn', m).forEach(x => x.disabled = b); };
  const plan = async () => {
    read(); const tg = targets(); if (!tg.length) { toast('ไม่มีสินค้าตามเงื่อนไข', 'bad'); return null; }
    const n = count(); if (n > 3000 && !await confirmBox(`จะสร้าง ${n} ดวง ต้องการดำเนินการต่อหรือไม่?`)) return null;
    const items = [];
    for (const [i, p] of tg.entries()) { items.push({ p, html: await lblHTML(p, o), k: o.byStock ? Math.max(0, Math.floor(num(p.stock))) : o.copies });
      if (i % 15 === 0) { progress(`กำลังเตรียมฉลาก ${i + 1}/${tg.length}`, (i + 1) / tg.length * .3); await yieldUI(); } }
    return items;
  };
  const build = async () => {
    const items = await plan(); if (!items) return null;
    const cells = []; items.forEach(it => { for (let i = 0; i < it.k; i++) cells.push(it.html); });
    return `<style>${lblCSS(o)}</style><div class="lbls">${cells.join('')}</div>`;
  };
  /* PDF: each different label is rendered once to an image, then placed as many times as needed */
  const makePDF = async () => {
    const items = await plan(); if (!items) return null;
    await Promise.all([loadH2C(), JSPDF_P ||= loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')]);
    const z = LBL_SIZES[o.size], { jsPDF } = window.jspdf;
    const imgs = await renderLabelImages(items.filter(it => it.k), o, (a, b) => progress(`กำลังสร้าง PDF ${a}/${b}`, .3 + a / b * .6));
    const pdf = z.a4 ? new jsPDF({ unit: 'mm', format: 'a4' }) : new jsPDF({ unit: 'mm', format: [z.w, z.h], orientation: z.w > z.h ? 'l' : 'p' });
    const { mx, my, cols, gap, rows } = a4Layout(z);
    let slot = 0, first = true;
    for (const im of imgs) for (let c = 0; c < im.k; c++) {
      if (z.a4) { if (slot === cols * rows) { pdf.addPage('a4'); slot = 0; } const col = slot % cols, row = Math.floor(slot / cols);
        pdf.addImage(im.url, 'JPEG', mx + col * (z.w + gap), my + row * z.h, z.w, z.h, im.id, 'FAST'); slot++; }
      else { if (!first) pdf.addPage([z.w, z.h], z.w > z.h ? 'l' : 'p'); pdf.addImage(im.url, 'JPEG', 0, 0, z.w, z.h, im.id, 'FAST'); }
      first = false;
    }
    progress('', null);
    return pdf.output('blob');
  };
  const downloadPDF = async () => {
    if (busy) return; setBusy(true);
    try { const blob = await makePDF(); if (!blob) return;
      const name = safeName(`labels_${o.size}_${ymd(new Date())}.pdf`);
      if (isNativeApp()) await nativeSave(name, blob); else saveBlob(name, blob);
      toast('ดาวน์โหลด PDF ฉลากแล้ว — เปิดไฟล์แล้วสั่งพิมพ์ได้เลย', 'ok');
      logAct('labels_print', 'product', `${targets().length} สินค้า (PDF)`, { template: o.tpl, size: o.size, labels: count() });
    } catch (e) { progress('', null); fail(e); } finally { setBusy(false); }
  };
  $('#lgo', m).onclick = async () => {
    if (isNativeApp()) return downloadPDF();
    if (busy) return; setBusy(true);
    try { const h = await build(); if (h) { progress('กำลังเตรียมพิมพ์…', .95); $('#print').innerHTML = h; await waitImgs($('#print')); progress('', null); window.print(); logAct('labels_print', 'product', `${targets().length} สินค้า`, { template: o.tpl, size: o.size, labels: count() }); } }
    catch (e) { progress('', null); fail(e); } finally { setBusy(false); }
  };
  $('#lpdf', m).onclick = downloadPDF;
  $('#lxl', m).onclick = () => xlsxDownload('labels', [{ name: 'ฉลาก', rows: targets().map(p => { const pr = lblPrices(p, o.price); return { 'ชื่อสินค้า': p.name, 'บาร์โค้ด': p.barcode || '', 'SKU': p.sku || '', 'ราคาบนฉลาก': pr.now ?? '', 'ราคาเดิม': pr.old ?? '', 'โปรโมชั่น': pr.tag, 'จำนวนดวง': o.byStock ? Math.max(0, Math.floor(num(p.stock))) : o.copies }; }) }]);
  go2();
};
Object.assign(AUDIT_L, { labels_print: 'พิมพ์ฉลากบาร์โค้ด' });
/* ================= v4.2 — payment confirmation, QR timer, shortcuts, command palette, dashboard strip,
   bulk edit, cash drawer, diagnostics, Android native integration ================= */

/* ---------- payment: confirm money received for non-cash, PromptPay QR countdown ---------- */
const _payDialog42 = payDialog;
payDialog = function () {
  _payDialog42();
  const m = $$('.mbg').pop(); if (!m) return;
  const needConfirm = S.shop.require_pay_confirm !== false;
  const curMethods = () => { const split = $('[data-sm]', m); return split ? $$('[data-sm]', m).map(s => s.value) : [$('.paym button.on', m)?.dataset.m || 'cash']; };
  let confirmed = false, timer = null;
  const decorate = () => {
    const nonCash = curMethods().filter(k => k !== 'cash');
    const pb = $('#pbody', m); if (!pb) return;
    if (needConfirm && nonCash.length && !$('#payok', m)) {
      confirmed = false;
      pb.insertAdjacentHTML('beforeend', `<label class="payok" id="payokw"><input type="checkbox" id="payok"> <span><b>ตรวจสอบแล้ว — ได้รับเงินจริง</b><small>ดูยอดเงินเข้าในแอปธนาคาร / เครื่องรูดบัตร ก่อนกดยืนยัน (${nonCash.map(payName).join(', ')})</small></span></label>`);
      $('#payok', m).onchange = e => { confirmed = e.target.checked; };
    }
    const qr = $('.qr', pb);
    if (qr && !$('.qrtimer', qr)) {
      clearInterval(timer);
      const end = Date.now() + Math.max(1, num(S.shop.qr_timeout_min) || 5) * 60000;
      qr.insertAdjacentHTML('beforeend', '<div class="qrtimer"></div>');
      const tick = () => { const el = $('.qrtimer', qr); if (!el) return clearInterval(timer);
        const left = Math.max(0, end - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
        if (left > 0) el.textContent = `QR ใช้ได้อีก ${mm}:${String(ss).padStart(2, '0')}`;
        else { clearInterval(timer); qr.classList.add('expired'); el.innerHTML = '⌛ QR หมดเวลา <button class="btn sm p" type="button" id="qrnew">สร้าง QR ใหม่</button>';
          $('#qrnew', qr).onclick = () => { const b = $('.paym button.on', m); if (b) b.click(); else { const s = $('[data-sm]', m); s?.dispatchEvent(new Event('change')); } }; } };
      tick(); timer = setInterval(tick, 1000);
    }
  };
  new MutationObserver(decorate).observe(m, { childList: true, subtree: true }); decorate();
  m.addEventListener('click', e => {
    if (e.target.closest('#cfm') && needConfirm && curMethods().some(k => k !== 'cash') && !$('#payok', m)?.checked) {
      e.stopImmediatePropagation(); e.preventDefault(); sfx('error');
      $('#payokw', m)?.classList.add('shake'); setTimeout(() => $('#payokw', m)?.classList.remove('shake'), 500);
      toast('กรุณาตรวจสอบว่าได้รับเงินแล้ว และติ๊ก “ตรวจสอบแล้ว” ก่อนยืนยัน', 'bad');
    }
  }, true);
  const obs = new MutationObserver(() => { if (!document.body.contains(m)) { clearInterval(timer); obs.disconnect(); } }); obs.observe(document.body, { childList: true });
};

/* ---------- keyboard shortcuts: F2 search · F4 pay · F8 hold · F9 resume · Ctrl+K palette ---------- */
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopPropagation(); return commandPalette(); }
  if (!['F2', 'F4', 'F8', 'F9'].includes(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  if ($('.mbg')) return;
  if (e.key === 'F2') { if (S.page !== 'pos') go('pos'); setTimeout(() => ($('#psearch') || $('#gq'))?.focus(), 60); }
  if (S.page !== 'pos') return;
  if (e.key === 'F4') $('#payBtn:not([disabled])')?.click();
  if (e.key === 'F8') $('#holdBtn:not([disabled])')?.click();
  if (e.key === 'F9') showHeld();
}, true);
const _drawCart42 = drawCart;
drawCart = function () { _drawCart42(); const k = $('#payBtn kbd'); if (k) k.textContent = 'F4'; const h = $('#holdBtn'); if (h && !h.title) h.title = 'พักบิล (F8)'; const r = $('#heldBtn'); if (r) r.title = 'บิลที่พักไว้ (F9)'; };

function commandPalette() {
  if ($('#cmdk')) return;
  const acts = [
    ...PAGES.filter(pageOK).map(p => ({ ic: '↪', t: 'ไปที่ ' + t(p.name), k: p.id + ' ' + p.name, run: () => go(p.id) })),
    { ic: '➕', t: 'ขายด่วน (สินค้านอกระบบ)', k: 'custom quick', run: () => { go('pos'); setTimeout(customItem, 200); } },
    { ic: '📂', t: 'บิลที่พักไว้ (F9)', k: 'held resume', run: () => { go('pos'); setTimeout(showHeld, 200); } },
    { ic: '🏷️', t: 'สร้างโปรโมชั่น', k: 'promo', run: () => { go('promotions'); setTimeout(() => promoForm(null, () => go('promotions')), 300); } },
    { ic: '🖨️', t: 'พิมพ์ฉลากบาร์โค้ด', k: 'label barcode', run: () => go('barcodes') },
    { ic: '💾', t: 'สำรองข้อมูล', k: 'backup', run: () => go('data') },
    { ic: '💰', t: 'เปิดลิ้นชักเงิน', k: 'drawer cash', run: () => openDrawer(true) },
    { ic: '📊', t: 'สรุปยอดประจำวัน / บิลรวม', k: 'daily summary z report', run: () => dailySummary() },
    { ic: '🙋', t: 'เบิกใช้ส่วนตัว', k: 'personal use เบิก', run: () => { go('pos'); setTimeout(personalUse, 200); } },
    { ic: '🗂️', t: 'จัดการหมวดหมู่', k: 'category หมวด', run: () => categoryManager() },
    { ic: '📏', t: 'จัดการหน่วยนับ', k: 'unit หน่วย', run: () => unitManager() },
    { ic: '🛒', t: 'สร้างโปร ซื้อ X ราคา ฿ (เช่น 3 ชิ้น 100)', k: 'promo bundle ซื้อ ราคาพิเศษ', run: () => { go('promotions'); setTimeout(() => { promoForm(null, () => go('promotions')); setTimeout(() => $$('.mbg').pop()?.querySelector('[data-tp=b3]')?.click(), 50); }, 300); } },
    { ic: '🔊', t: 'ตั้งค่าเสียง', k: 'sound เสียง voice', run: () => soundSettings() },
    { ic: '🏬', t: 'สลับสาขา', k: 'branch switch สาขา', run: () => { const b = $('#brsw'); b ? branchMenu(b) : go('branches'); } },
    { ic: '🔄', t: 'ตรวจหาอัปเดต', k: 'update', run: () => checkUpdate(true) },
  ];
  document.body.insertAdjacentHTML('beforeend', `<div class="cmdk" id="cmdk"><div class="cmdk-box"><input class="in" id="cmdq" placeholder="พิมพ์คำสั่ง ชื่อหน้า หรือชื่อสินค้า…" autocomplete="off"><div id="cmdl"></div><div class="cmdk-ft">↑↓ เลือก · Enter ทำงาน · Esc ปิด · Ctrl+K เปิด</div></div></div>`);
  const box = $('#cmdk'), inp = $('#cmdq'); let sel = 0, list = [];
  const close = () => box.remove();
  const draw = () => {
    const v = inp.value.trim().toLowerCase();
    const prods = v.length >= 1 ? S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v))).slice(0, 6)
      .map(p => ({ ic: '🛒', t: `${p.name} · ${baht(p.promo_price > 0 ? p.promo_price : p.price)}`, k: '', run: () => { go('pos'); setTimeout(() => addToCart(p, 1), 150); } })) : [];
    list = [...acts.filter(a => !v || (a.t + ' ' + a.k).toLowerCase().includes(v)), ...prods].slice(0, 12); sel = Math.min(sel, Math.max(0, list.length - 1));
    $('#cmdl').innerHTML = list.map((a, i) => `<div class="cmdi ${i === sel ? 'on' : ''}" data-i="${i}"><span>${a.ic}</span>${esc(a.t)}</div>`).join('') || '<div class="muted" style="padding:12px">ไม่พบ</div>';
    $$('#cmdl [data-i]').forEach(d => d.onclick = () => { close(); list[+d.dataset.i].run(); });
  };
  inp.oninput = () => { sel = 0; draw(); };
  inp.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, list.length - 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { const a = list[sel]; close(); a?.run(); } else if (e.key === 'Escape') close(); };
  box.onclick = e => { if (e.target === box) close(); };
  draw(); inp.focus();
}

/* ---------- dashboard: fixed "today / this month" strip + sales by category ---------- */
const _dash42 = VIEWS.dashboard;
VIEWS.dashboard = pg => {
  _dash42(pg);
  pg.insertAdjacentHTML('afterbegin', `<div class="dstrip" id="dstrip"><div class="skel"><i></i></div></div>`);
  (async () => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); const m0 = new Date(d0.getFullYear(), d0.getMonth(), 1);
    const y0 = new Date(d0 - 864e5);
    const [ms, pays, items] = await Promise.all([
      fetchAll(() => sb.from('sales').select('total,refunded_total,cost_total,vat,created_at').eq('shop_id', S.shop.id).neq('status', 'void').gte('created_at', y0 < m0 ? y0.toISOString() : m0.toISOString())),
      fetchAll(() => sb.from('sale_payments').select('method,amount,created_at,sales!inner(status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('created_at', d0.toISOString())),
      fetchAll(() => sb.from('sale_items').select('product_id,qty,price,discount,refunded_qty,sales!inner(created_at,status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('sales.created_at', m0.toISOString())),
    ]);
    const net = r => num(r.total) - num(r.refunded_total);
    const today = ms.filter(r => new Date(r.created_at) >= d0), yest = ms.filter(r => new Date(r.created_at) >= y0 && new Date(r.created_at) < d0), month = ms.filter(r => new Date(r.created_at) >= m0);
    const sum = a => a.reduce((x, r) => x + net(r), 0);
    const cash = pays.filter(p => p.method === 'cash').reduce((x, p) => x + num(p.amount), 0), other = pays.filter(p => p.method !== 'cash').reduce((x, p) => x + num(p.amount), 0);
    const el = $('#dstrip'); if (!el) return;
    const tile = (k, v, sub = '', cls = '') => `<div class="dtile ${cls}"><small>${k}</small><b data-c="${v}">${baht(v)}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
    el.innerHTML = tile('ยอดขายวันนี้', sum(today), `${today.length} บิล · ${trend(sum(today), sum(yest))} จากเมื่อวาน`, 'hero') + tile('ยอดขายเดือนนี้', sum(month), `${month.length} บิล`)
      + tile('รับเงินสดวันนี้', cash, 'ก่อนหักคืนเงิน') + tile('รับโอน / สแกน / บัตร วันนี้', other, 'ก่อนหักคืนเงิน');
    $$('.dtile b', el).forEach(b => countTo(b, +b.dataset.c, baht));
    const byCat = {};
    items.forEach(i => { const p = S.products.find(x => x.id === i.product_id); const k = p ? catName(p.category_id) || 'ไม่มีหมวด' : 'สินค้านอกระบบ';
      byCat[k] = (byCat[k] || 0) + (num(i.qty) - num(i.refunded_qty)) * num(i.price) - num(i.discount); });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (cats.length) {
      el.insertAdjacentHTML('afterend', `<div class="card" id="dcat" style="margin-bottom:14px"><b>ยอดขายตามหมวดหมู่ (เดือนนี้)</b><div class="chartbox" style="height:240px"><canvas id="cCat"></canvas></div></div>`);
      await loadChart();
      chart('cCat', { type: 'bar', data: { labels: cats.map(c => c[0]), datasets: [{ data: cats.map(c => r2(c[1])), backgroundColor: cats.map((_, i) => `hsl(${220 + i * 23},70%,${50 + (i % 3) * 6}%)`), borderRadius: 8 }] },
        options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => baht(c.raw) } } }, scales: { x: { ticks: { callback: v => money(v) } } } } });
    }
  })().catch(e => { const el = $('#dstrip'); if (el) el.innerHTML = ''; console.warn(e); });
};

/* ---------- bulk product editing ---------- */
const _products42 = VIEWS.products;
VIEWS.products = pg => {
  _products42(pg);
  if (canDo('edit_products') && $('#tact') && !$('#bulkBtn')) { $('#tact').insertAdjacentHTML('afterbegin', '<button class="btn" id="bulkBtn">✏️ แก้ไขหลายรายการ</button>'); $('#bulkBtn').onclick = bulkEdit; }
};
function bulkEdit() {
  const sel = new Set(); let v = '', cat = '';
  const prices = canDo('edit_prices');
  const m = modal('แก้ไขสินค้าหลายรายการพร้อมกัน', `<div class="lbd" style="grid-template-columns:1fr 320px">
    <div><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><div class="sbox" style="flex:1;min-width:180px"><span>🔍</span><input class="in" id="bq"></div>
      <select class="in" id="bc" style="width:auto"><option value="">ทุกหมวด</option>${S.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
      <button class="btn sm" id="ball">เลือกทั้งหมดที่เห็น</button><button class="btn sm" id="bnone">ล้าง</button></div>
      <div id="bl" style="max-height:52vh;overflow:auto;border:1px solid var(--line);border-radius:12px"></div></div>
    <div class="card" style="background:var(--card2)"><b id="bcnt">เลือก 0 รายการ</b>
      <div class="fg"><label class="f">ย้ายไปหมวดหมู่</label><select class="in" id="xcat"><option value="">— ไม่เปลี่ยน —</option><option value="__none">ไม่มีหมวด</option>${S.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      ${prices ? `<div class="fg"><label class="f">ปรับราคาขาย</label><div class="row" style="gap:6px"><select class="in" id="xpm" style="width:auto"><option value="">— ไม่เปลี่ยน —</option><option value="pct">± %</option><option value="add">± บาท</option><option value="set">ตั้งเป็น</option></select><input class="in" id="xpv" type="number" step="any" placeholder="เช่น 10 หรือ -5"></div></div>
      <div class="fg"><label class="f">ราคาโปร (0 = ยกเลิก)</label><input class="in" id="xpp" type="number" step="any" placeholder="— ไม่เปลี่ยน —"></div>` : ''}
      <div class="fg"><label class="f">แจ้งเตือนเมื่อเหลือ</label><input class="in" id="xlow" type="number" step="any" placeholder="— ไม่เปลี่ยน —"></div>
      <div class="grid2"><div class="fg"><label class="f">รายการโปรด</label><select class="in" id="xfav"><option value="">—</option><option value="1">เปิด</option><option value="0">ปิด</option></select></div>
        <div class="fg"><label class="f">สถานะขาย</label><select class="in" id="xact"><option value="">—</option><option value="1">ขายอยู่</option><option value="0">ซ่อน/เลิกขาย</option></select></div></div>
      <div id="bprog" class="muted"></div></div></div>`, { wide: true, foot: '<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="bapply">✔ ใช้กับรายการที่เลือก</button>' });
  m.querySelector('.modal')?.classList.add('xwide');
  const vis = () => S.products.filter(p => (!cat || p.category_id === cat) && (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v)));
  const draw = () => {
    $('#bl', m).innerHTML = vis().slice(0, 400).map(p => `<label class="row" style="padding:7px 10px;border-bottom:1px solid var(--line);gap:10px"><input type="checkbox" data-p="${p.id}" ${sel.has(p.id) ? 'checked' : ''}>
      <span style="flex:1">${esc(p.name)} ${p.active === false ? '<span class="chip">ซ่อน</span>' : ''}</span><small class="muted">${esc(catName(p.category_id))}</small><b>${money(p.price)}</b></label>`).join('');
    $$('[data-p]', m).forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.p) : sel.delete(c.dataset.p); $('#bcnt', m).textContent = `เลือก ${sel.size} รายการ`; });
    $('#bcnt', m).textContent = `เลือก ${sel.size} รายการ`;
  };
  $('#bq', m).oninput = e => { v = e.target.value.toLowerCase(); draw(); };
  $('#bc', m).onchange = e => { cat = e.target.value; draw(); };
  $('#ball', m).onclick = () => { vis().forEach(p => sel.add(p.id)); draw(); };
  $('#bnone', m).onclick = () => { sel.clear(); draw(); };
  $('[data-c]', m).onclick = m.close;
  $('#bapply', m).onclick = async () => {
    if (!sel.size) return toast('ยังไม่ได้เลือกสินค้า', 'bad');
    const xc = $('#xcat', m).value, pm = $('#xpm', m)?.value, pv = num($('#xpv', m)?.value), pp = $('#xpp', m)?.value, low = $('#xlow', m).value, fav = $('#xfav', m).value, act = $('#xact', m).value;
    if (!xc && !pm && pp === '' && low === '' && !fav && !act) return toast('ยังไม่ได้เลือกสิ่งที่จะเปลี่ยน', 'bad');
    if (!await confirmBox(`แก้ไขสินค้า ${sel.size} รายการ?`)) return;
    let ok = 0;
    for (const id of sel) {
      const p = S.products.find(x => x.id === id); if (!p) continue; const row = {};
      if (xc) row.category_id = xc === '__none' ? null : xc;
      if (pm && $('#xpv', m).value !== '') row.price = r2(Math.max(0, pm === 'pct' ? p.price * (1 + pv / 100) : pm === 'add' ? p.price + pv : pv));
      if (pp !== undefined && pp !== '') row.promo_price = num(pp);
      if (low !== '') row.low_stock = num(low);
      if (fav) row.favorite = fav === '1'; if (act) row.active = act === '1';
      try { Object.assign(p, await q(sb.from('products').update(row).eq('id', id).select().single())); ok++; } catch (e) { fail(e); break; }
      $('#bprog', m).textContent = `บันทึก ${ok}/${sel.size}`;
    }
    toast(`แก้ไขแล้ว ${ok} รายการ`, 'ok'); m.close(); go(S.page);
  };
  draw();
}

/* ---------- hardware: ESC/POS cash drawer over Web Serial, diagnostics ---------- */
let DRAWER_PORT = null;
async function drawerPort(ask) {
  if (!('serial' in navigator)) return null;
  if (DRAWER_PORT) return DRAWER_PORT;
  const ports = await navigator.serial.getPorts(); if (ports[0] && localStorage.getItem('pos_drawer') === '1') return (DRAWER_PORT = ports[0]);
  if (!ask) return null;
  DRAWER_PORT = await navigator.serial.requestPort(); localStorage.setItem('pos_drawer', '1'); return DRAWER_PORT;
}
async function openDrawer(manual) {
  try {
    if (!('serial' in navigator)) { if (manual) toast('อุปกรณ์นี้ไม่รองรับการสั่งลิ้นชักโดยตรง — ใช้ Chrome/Edge บนคอมพิวเตอร์ หรือเปิดผ่านไดรเวอร์เครื่องพิมพ์', 'bad'); return; }
    const port = await drawerPort(manual); if (!port) return;
    if (!port.readable) await port.open({ baudRate: +(localStorage.getItem('pos_drawer_baud') || 9600) });
    const w = port.writable.getWriter(); await w.write(new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa])); w.releaseLock();
    if (manual) toast('ส่งคำสั่งเปิดลิ้นชักแล้ว', 'ok');
    logAct('drawer_open', 'shop', manual ? 'เปิดเอง' : 'หลังขายเงินสด', {});
  } catch (e) { if (manual && e.name !== 'NotFoundError') fail(e); }
}
Object.assign(AUDIT_L, { drawer_open: 'เปิดลิ้นชักเงิน' });
const _showReceipt42 = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceipt42(sale, items, cust, autoPrint);
  const fresh = sale.created_at && Date.now() - new Date(sale.created_at) < 120000;
  if (fresh && localStorage.getItem('pos_drawer_auto') === '1' && /cash|mixed/.test(sale.payment_method || '')) openDrawer(false);
};
function diagnostics() {
  const ok = b => b ? '<span class="chip ok">รองรับ</span>' : '<span class="chip">ไม่รองรับ</span>';
  return `<div class="kv" style="font-size:14px">
    <span>แอปบนเครื่อง (Android)</span><b>${isNativeApp() ? '<span class="chip ok">ใช่</span>' : 'ไม่ใช่ (เว็บ/เดสก์ท็อป)'}</b>
    <span>สแกนเนอร์ USB / Bluetooth (โหมดคีย์บอร์ด)</span><b>${ok(true)}</b>
    <span>กล้องสแกนบาร์โค้ด</span><b>${ok(!!navigator.mediaDevices?.getUserMedia)}</b>
    <span>พิมพ์ผ่านหน้าต่างพิมพ์ (58/80 มม./A4)</span><b>${isNativeApp() ? 'ส่งเป็นรูปไปแอปเครื่องพิมพ์ (เช่น RawBT)' : ok(typeof print === 'function')}</b>
    <span>Web Serial (ลิ้นชัก/เครื่องชั่ง/เครื่องพิมพ์ ESC/POS)</span><b>${ok('serial' in navigator)}</b>
    <span>WebUSB</span><b>${ok('usb' in navigator)}</b><span>Web Bluetooth</span><b>${ok('bluetooth' in navigator)}</b>
    <span>ทำงานออฟไลน์ (Service Worker)</span><b>${ok('serviceWorker' in navigator)}</b>
    <span>อินเทอร์เน็ต</span><b>${navigator.onLine ? '<span class="chip ok">ออนไลน์</span>' : '<span class="chip bad">ออฟไลน์</span>'}</b>
    <span>บิลออฟไลน์รอส่ง</span><b>${oqGet().length}</b>
    <span>หน้าจอ</span><b>${innerWidth} × ${innerHeight} · ${matchMedia('(pointer:coarse)').matches ? 'จอสัมผัส' : 'เมาส์'}</b>
    <span>เวอร์ชันแอป</span><b>${APP_VERSION}</b></div>
    <p class="muted" style="font-size:12px">ข้อมูลนี้ตรวจจากเบราว์เซอร์จริง — สถานะการเชื่อมต่อเครื่องพิมพ์ผ่านหน้าต่างพิมพ์ของระบบไม่สามารถตรวจจากเว็บได้</p>`;
}
const _settings42 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings42(pg);
  const sh = S.shop, edit = canDo('manage_settings'), host = $('#stf')?.parentElement || pg;
  const cm = new Set(shopMethods());
  host.insertAdjacentHTML('beforeend', `<div class="grid2" style="margin-top:16px"><div class="card"><h3 style="margin-top:0">💳 ช่องทางชำระเงินที่หน้าขาย</h3>
      <div class="pills" id="cmx">${PAY_CHOICES.map(k => `<button type="button" data-k="${k}" class="${cm.has(k) ? 'on' : ''}" ${edit ? '' : 'disabled'}>${payIcon(k)} ${payName(k)}</button>`).join('')}</div>
      <label class="row" style="margin-top:10px"><input type="checkbox" id="rpc" ${sh.require_pay_confirm !== false ? 'checked' : ''} ${edit ? '' : 'disabled'}> บังคับติ๊ก “ตรวจสอบแล้ว ได้รับเงินจริง” ก่อนบันทึก (สแกน/โอน/บัตร)</label>
      <div class="fg" style="margin-top:8px"><label class="f">QR พร้อมเพย์หมดเวลา (นาที)</label><input class="in" id="qrt" type="number" min="1" max="60" value="${num(sh.qr_timeout_min) || 5}" ${edit ? '' : 'disabled'}></div>
      <p class="muted" style="font-size:12px">โอนเงิน / บัตร เป็นการบันทึกยอด — ลูกค้าจ่ายผ่านแอปธนาคารหรือเครื่องรูดบัตรของธนาคาร ระบบไม่ตัดเงินเอง และไม่ยืนยันยอดอัตโนมัติ</p>
      ${edit ? '<button type="button" class="btn p" id="cmsave">💾 บันทึกช่องทางชำระเงิน</button>' : ''}</div>
    <div class="card"><h3 style="margin-top:0">🧰 ลิ้นชักเงิน & ตรวจสอบอุปกรณ์</h3>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="dwc">🔌 เชื่อมต่อเครื่องพิมพ์/ลิ้นชัก (USB-Serial)</button><button type="button" class="btn" id="dwt">💰 ทดสอบเปิดลิ้นชัก</button></div>
      <label class="row" style="margin-top:8px"><input type="checkbox" id="dwa" ${localStorage.getItem('pos_drawer_auto') === '1' ? 'checked' : ''}> เปิดลิ้นชักอัตโนมัติหลังขายเงินสด (เครื่องนี้)</label>
      <div class="fg"><label class="f">Baud rate</label><select class="in" id="dwb">${[9600, 19200, 38400, 115200].map(b => `<option ${String(b) === (localStorage.getItem('pos_drawer_baud') || '9600') ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <details style="margin-top:8px"><summary class="b" style="cursor:pointer">ตรวจสอบอุปกรณ์ (Device diagnostics)</summary>${diagnostics()}</details></div></div>`);
  $$('#cmx [data-k]', pg).forEach(b => b.onclick = () => { if (b.dataset.k === 'cash') return toast('ต้องมีเงินสดเสมอ', 'bad'); b.classList.toggle('on'); });
  if ($('#cmsave')) $('#cmsave').onclick = async () => {
    const list = $$('#cmx [data-k].on', pg).map(b => b.dataset.k); if (!list.includes('cash')) list.unshift('cash');
    try { Object.assign(sh, await q(sb.from('shops').update({ checkout_methods: list, require_pay_confirm: $('#rpc').checked, qr_timeout_min: Math.max(1, Math.min(60, num($('#qrt').value) || 5)) }).eq('id', sh.id).select().single()));
      logAct('settings', 'shop', 'ช่องทางชำระเงิน', { methods: list }); toast('บันทึกแล้ว', 'ok'); } catch (e) { fail(e); }
  };
  $('#dwc').onclick = async () => { try { DRAWER_PORT = null; await drawerPort(true); toast('เชื่อมต่อแล้ว', 'ok'); } catch (e) { if (e.name !== 'NotFoundError') fail(e); } };
  $('#dwt').onclick = () => openDrawer(true);
  $('#dwa').onchange = e => localStorage.setItem('pos_drawer_auto', e.target.checked ? '1' : '0');
  $('#dwb').onchange = e => { localStorage.setItem('pos_drawer_baud', e.target.value); DRAWER_PORT = null; };
};

/* ---------- Android app (Capacitor): back button, status bar, splash, printing ---------- */
if (isNativeApp()) {
  const P = window.Capacitor.Plugins;
  try { P.StatusBar?.setBackgroundColor({ color: '#ffffff' }); P.StatusBar?.setStyle({ style: 'LIGHT' }); } catch {}
  setTimeout(() => { try { P.SplashScreen?.hide(); } catch {} }, 600);
  P.App?.addListener('backButton', async () => {
    const top = $$('.mbg').pop(); if (top) return $('.x', top)?.click();
    if ($('#cmdk')) return $('#cmdk').remove();
    if ($('#cart.open')) return $('#cart').classList.remove('open');
    if (S.page && S.page !== 'pos' && S.page !== 'dashboard' && S.shop) return go(PAGES.find(pageOK)?.id === 'dashboard' ? 'dashboard' : 'pos');
    if (await confirmBox('ปิดแอป Yanisa Shop?')) P.App.exitApp();
  });
  P.App?.addListener('appStateChange', st => { if (st.isActive) { checkUpdate(); syncQueue?.(); } });
  /* Android WebView has no window.print(): render the page to an image and share it to a printer app (RawBT, Bluetooth printer apps, PDF) */
  printReceipt = async function (html) {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;background:#fff;width:' + (/class="lbls"/.test(html) ? '800px' : (S.shop.receipt_size === '58' ? '384px' : '576px'));
    host.innerHTML = html.replace(/@page\{[^}]*\}/g, ''); document.body.appendChild(host);
    try { await loadH2C(); const c = await html2canvas(host, { scale: 2, backgroundColor: '#fff', useCORS: true });
      const blob = await new Promise(r => c.toBlob(r, 'image/png')); await nativeSave(`print_${Date.now()}.png`, blob);
      toast('เลือกแอปเครื่องพิมพ์ (เช่น RawBT) เพื่อพิมพ์', 'ok');
    } catch (e) { fail(e); } finally { host.remove(); }
  };
}
/* ================= v4.3 — unknown-barcode flow, big-picture product manager, logo avatar ================= */
{ const b = PAGES.find(p => p.id === 'barcodes'); if (b) b.ic = '🏷️'; }

/* ---------- account / shop icons show the shop logo ---------- */
const _renderShell43 = renderShell;
renderShell = function () {
  _renderShell43();
  const logo = esc(S.shop?.logo_url || 'logo-round.png');
  const av = $('#prof .av'); if (av) { av.classList.add('logo'); av.innerHTML = `<img src="${logo}" alt="">`; }
  const sb2 = $('#shopBtn'); if (sb2) { sb2.classList.add('logo'); sb2.innerHTML = `<img src="${logo}" alt="">`; }
};

/* ---------- scanning a barcode that is not in the system ---------- */
const looksCode = c => /^\d{6,14}$/.test(c) || (/^[A-Za-z0-9._-]{6,}$/.test(c) && /\d/.test(c));
const findByCode = code => S.products.find(p => p.active !== false && (p.barcode === code || p.sku === code));
async function offLookup(code) {
  if (!/^\d{8,14}$/.test(code)) return null;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_th,product_name_en,brands,image_front_url`, { signal: ctl.signal });
    const j = await r.json(); if (j.status !== 1) return null;
    const p = j.product || {};
    return { name: p.product_name_th || p.product_name || p.product_name_en || '', name_en: p.product_name_en || '', brand: (p.brands || '').split(',')[0].trim(), image: p.image_front_url || '' };
  } catch { return null; }
}
function unknownBarcode(code, qty = 1) {
  sfx('error');
  const edit = canDo('edit_products');
  const off = S.products.find(p => p.active === false && (p.barcode === code || p.sku === code));
  const m = modal('ไม่พบสินค้าบาร์โค้ดนี้', `<div class="ub-code">${ICON.barcodes}<b>${esc(code)}</b></div><div id="ubinfo" class="muted" style="text-align:center;min-height:20px">${/^\d{8,14}$/.test(code) ? 'กำลังค้นหาข้อมูลสินค้าจากฐานข้อมูลสาธารณะ…' : ''}</div>
    <div class="ub-grid">
      ${off ? `<button class="ub" data-a="on"><span>♻️</span><b>เปิดขาย “${esc(off.name)}” อีกครั้ง</b><small>สินค้านี้ถูกปิดการขายไว้</small></button>` : ''}
      ${edit ? `<button class="ub p" data-a="new"><span>➕</span><b>เพิ่มเป็นสินค้าใหม่</b><small>ใช้บาร์โค้ดนี้ ตั้งชื่อ ราคา รูป แล้วขายต่อได้ทันที</small></button>
      <button class="ub" data-a="link"><span>🔗</span><b>ผูกกับสินค้าที่มีอยู่</b><small>สินค้าเดิมที่ยังไม่มีบาร์โค้ด หรือเปลี่ยนบาร์โค้ดใหม่</small></button>` : ''}
      ${S.page === 'pos' ? `<button class="ub" data-a="quick"><span>⚡</span><b>ขายครั้งเดียว</b><small>ขายแบบสินค้านอกระบบ ไม่บันทึกเป็นสินค้า</small></button>` : ''}
    </div>${edit ? '' : '<p class="muted" style="font-size:13px">ให้ผู้จัดการหรือเจ้าของร้านเพิ่มสินค้านี้ในระบบ</p>'}`);
  let info = null;
  offLookup(code).then(r => { info = r; const el = $('#ubinfo', m); if (!el) return;
    el.innerHTML = r && r.name ? `พบข้อมูล: <b>${esc(r.name)}</b>${r.brand ? ' · ' + esc(r.brand) : ''} — จะเติมให้อัตโนมัติ` : (/^\d{8,14}$/.test(code) ? 'ไม่พบข้อมูลสาธารณะ — กรอกเองได้' : ''); });
  const sellAfter = p => { if (S.page === 'pos' && p) { addToCart(p, qty); } };
  $$('[data-a]', m).forEach(b => b.onclick = async () => {
    const a = b.dataset.a; m.close();
    if (a === 'on') { try { Object.assign(off, await q(sb.from('products').update({ active: true }).eq('id', off.id).select().single())); toast('เปิดขายแล้ว', 'ok'); sellAfter(off); } catch (e) { fail(e); } }
    if (a === 'new') {
      const before = new Set(S.products.map(p => p.id));
      productForm({ barcode: code, name: info?.name || '', name_en: info?.name_en || '', brand: info?.brand || '', unit: 'ชิ้น', track_stock: true, active: true }, () => {
        const np = S.products.find(p => !before.has(p.id)) || findByCode(code);
        if (np && info?.image && !np.image_url) savePicFromUrl(np, info.image);
        sellAfter(np); if (S.page === 'products') go('products');
      });
    }
    if (a === 'link') productPicker('ผูกบาร์โค้ด ' + code + ' กับสินค้า', async p => {
      if (p.barcode && p.barcode !== code && !await confirmBox(`“${p.name}” มีบาร์โค้ด ${p.barcode} อยู่แล้ว\nเปลี่ยนเป็น ${code} หรือไม่?`)) return;
      try { Object.assign(p, await q(sb.from('products').update({ barcode: code }).eq('id', p.id).select().single())); toast('ผูกบาร์โค้ดแล้ว', 'ok'); sellAfter(p); } catch (e) { fail(e); }
    }, p => p.active !== false);
    if (a === 'quick') { customItem(); setTimeout(() => { const f = $$('.mbg').pop(); if (f) { const n = f.querySelector('[name=name]'); if (n) n.value = info?.name || ('สินค้า ' + code); f.querySelector('[name=qty]').value = qty; f.querySelector('[name=price]')?.focus(); } }, 80); }
  });
}
async function savePicFromUrl(p, url) {
  try { const r = await fetch(url); if (!r.ok) return; const blob = await r.blob();
    const path = `${S.shop.id}/${p.id}_${Date.now()}.jpg`;
    const { error } = await sb.storage.from('product-images').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' }); if (error) return;
    const pub = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    Object.assign(p, await q(sb.from('products').update({ image_url: pub }).eq('id', p.id).select().single()));
    if (S.page === 'pos') drawGrid();
  } catch {}
}
window.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target || !['psearch', 'gq'].includes(e.target.id)) return;
  const el = e.target, v = el.value.trim(); if (!v) return;
  let qty = 1, code = v; const mm = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qty = num(mm[1]); code = mm[2].trim(); }
  if (!looksCode(code) || findByCode(code)) return;
  if (S.page === 'pos' && typeof filtered === 'function' && filtered().length === 1) return;
  e.preventDefault(); e.stopImmediatePropagation();
  el.value = ''; S.search = ''; if (S.page === 'pos') drawGrid();
  unknownBarcode(code, qty);
}, true);
const _posView43 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView43(pg);
  const sbtn = $('#scanBtn'); if (sbtn) sbtn.onclick = () => scanBarcode(code => { const hit = findByCode(code); if (hit) { sfx('scan'); addToCart(hit); } else unknownBarcode(code); });
};

/* ---------- PRODUCTS: big-picture card manager (default) + table view ---------- */
let PVIEW = { mode: localStorage.getItem('pos_pview') || 'cards', size: +(localStorage.getItem('pos_psize') || (matchMedia('(max-width:860px)').matches ? 160 : 220)) };
const _products43 = VIEWS.products;
VIEWS.products = pg => {
  _products43(pg);
  const bar = $('#ps', pg)?.closest('.row'); if (!bar) return;
  bar.style.flexWrap = 'wrap';
  bar.insertAdjacentHTML('beforeend', `<div class="seg" id="pvm"><button data-m="cards">🖼️ รูปใหญ่</button><button data-m="table">☰ ตาราง</button></div>
    <div class="zctl" id="pzs" title="ขนาดรูป"><button type="button" data-z="-30">−</button><input type="range" min="140" max="420" step="10" value="${PVIEW.size}"><button type="button" data-z="30">+</button></div>`);
  pg.insertAdjacentHTML('beforeend', '<div class="pmgrid" id="pmg"></div>');
  const hint = pg.querySelector('p.muted');
  const draw = () => {
    const cards = PVIEW.mode === 'cards';
    $$('#pvm button', pg).forEach(b => b.classList.toggle('on', b.dataset.m === PVIEW.mode));
    $('#plist', pg).style.display = cards ? 'none' : ''; $('#pzs', pg).style.display = cards ? '' : 'none'; if (hint) hint.style.display = cards ? 'none' : '';
    const g = $('#pmg', pg); g.style.display = cards ? '' : 'none'; if (!cards) return;
    g.style.setProperty('--pm', PVIEW.size + 'px');
    const v = $('#ps', pg).value.toLowerCase(), c = $('#pc', pg).value, f = $('#pf', pg).value;
    const list = S.products.filter(p => (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)) && (!c || p.category_id === c) &&
      (!f || (f === 'low' ? p.track_stock && p.stock <= p.low_stock : f === 'nopic' ? !p.image_url : !p.active))).sort((a, b) => (a.active === false) - (b.active === false) || a.name.localeCompare(b.name, 'th'));
    const card = p => { const st = !p.track_stock ? '' : p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'; const pr = itemPromosFor(p)[0];
      return `<div class="pm ${p.active === false ? 'off' : ''}" data-id="${p.id}">
        <div class="pm-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : `background:linear-gradient(135deg,${esc(p.tile_color || catColor(p.category_id))},${esc(p.tile_color || catColor(p.category_id))}aa)`}">
          ${p.image_url ? '' : `<span>${esc([...p.name].slice(0, 2).join(''))}</span>`}
          ${p.favorite ? '<i class="pm-fav">★</i>' : ''}${pr || num(p.promo_price) > 0 ? `<i class="pm-promo">🏷️ ${esc(pr ? promoLabel(pr) : 'โปร ฿' + money(p.promo_price))}</i>` : ''}${p.active === false ? '<i class="pm-off">ปิดขาย</i>' : ''}
          <div class="pm-acts"><button data-act="pic" title="เปลี่ยนรูป">📷</button><button data-act="stock" title="ปรับสต็อก">📦</button><button data-act="edit" title="แก้ไข">✏️</button></div></div>
        <div class="pm-body"><b class="pm-name">${esc(p.name)}</b>
          <div class="pm-row"><span class="pm-price">${baht(num(p.promo_price) > 0 ? p.promo_price : p.price)}</span>${num(p.promo_price) > 0 ? `<s class="muted">${money(p.price)}</s>` : ''}<span class="sp"></span>${p.track_stock ? `<span class="chip ${st}">${qtyf(p.stock)} ${esc(p.unit)}</span>` : ''}</div>
          <div class="pm-meta">${p.barcode ? `<code>${esc(p.barcode)}</code>` : '<span class="chip warn">ไม่มีบาร์โค้ด</span>'}<span>${esc(catName(p.category_id))}</span></div></div></div>`; };
    g.innerHTML = (canDo('edit_products') ? `<button class="pm pm-add" id="pmAdd"><span>＋</span><b>เพิ่มสินค้า</b><small>หรือสแกนบาร์โค้ดที่ช่องค้นหา</small></button>` : '') + list.slice(0, 600).map(card).join('')
      + (list.length ? '' : '<div class="empty" style="grid-column:1/-1">ไม่พบสินค้า</div>');
    $('#pcount', pg).textContent = `${list.length} รายการ${list.length > 600 ? ' (แสดง 600 แรก)' : ''}`;
  };
  $('#pmg', pg).onclick = e => {
    if (e.target.closest('#pmAdd')) return productForm({ unit: 'ชิ้น', track_stock: true, active: true }, draw);
    const el = e.target.closest('.pm[data-id]'); if (!el) return; const p = S.products.find(x => x.id === el.dataset.id); if (!p) return;
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'pic') return pictureMenu(p, draw);
    if (act === 'stock') { if (!canDo('manage_inventory')) return toast('ไม่มีสิทธิ์ปรับสต็อก', 'bad'); return stockForm(p, 'adjust', draw); }
    productForm(p, draw);
  };
  $$('#pvm button', pg).forEach(b => b.onclick = () => { PVIEW.mode = b.dataset.m; localStorage.setItem('pos_pview', PVIEW.mode); draw(); });
  const setSz = n => { PVIEW.size = Math.max(140, Math.min(420, n)); localStorage.setItem('pos_psize', PVIEW.size); $('#pzs input', pg).value = PVIEW.size; $('#pmg', pg).style.setProperty('--pm', PVIEW.size + 'px'); };
  $('#pzs input', pg).oninput = e => setSz(+e.target.value);
  $$('#pzs [data-z]', pg).forEach(b => b.onclick = () => setSz(PVIEW.size + +b.dataset.z));
  ['#ps', '#pc', '#pf'].forEach(s => $(s, pg)?.addEventListener(s === '#ps' ? 'input' : 'change', draw));
  /* scanning in the product search: open that product, or offer to add it */
  $('#ps', pg)?.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const code = e.target.value.trim(); if (!looksCode(code)) return;
    const hit = S.products.find(p => p.barcode === code || p.sku === code); e.target.value = ''; draw();
    if (hit) productForm(hit, draw); else unknownBarcode(code); });
  draw();
};
/* ================= v4.4 — receive goods (bill OCR, fuzzy product match, cost alerts, price advice), cashier personal use ================= */
PAGES.splice(PAGES.findIndex(p => p.id === 'stock') + 1, 0, { id: 'receive', ic: '📥', name: 'Receive goods', roles: ['owner', 'manager', 'stock'] });
Object.assign(TH, { 'Receive goods': 'รับสินค้าเข้า' });
PAGE_PERM.receive = 'manage_inventory';
PAGE_DESC.receive = 'ถ่ายรูปบิล → ระบบอ่านรายการ จับคู่สินค้า เทียบราคาทุน และแนะนำราคาขาย · หรือเพิ่มรายการเองได้';
ICON.receive = SVG('<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5M12 4v5h4"/>');
Object.assign(AUDIT_L, { cost_increase: 'ราคาทุนเพิ่มขึ้น', price_update: 'ปรับราคาขายตามทุน' });

/* ---------- fuzzy matching ---------- */
const nrm = s => String(s || '').toLowerCase().replace(/[่-์็]/g, '').replace(/[^0-9a-z฀-๿]+/g, '');
const grams = s => { const g = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); g.set(k, (g.get(k) || 0) + 1); } return g; };
function dice(a, b) {
  if (!a || !b) return 0; if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a.includes(b) || b.includes(a) ? .6 : 0;
  const A = grams(a), B = grams(b); let n = 0, ta = 0, tb = 0;
  A.forEach(v => ta += v); B.forEach(v => tb += v); A.forEach((v, k) => { n += Math.min(v, B.get(k) || 0); });
  let s = 2 * n / (ta + tb);
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) s = Math.max(s, .85);
  return s;
}
function matchProducts(name, code) {
  if (code) { const p = S.products.find(x => x.barcode === code || x.sku === code); if (p) return [{ p, score: 1, how: 'barcode' }]; }
  const n = nrm(name); if (n.length < 2) return [];
  return S.products.filter(p => p.active !== false).map(p => ({ p, score: Math.max(dice(n, nrm(p.name)), dice(n, nrm(p.name_en)), p.sku ? dice(n, nrm(p.sku)) : 0), how: 'name' }))
    .filter(x => x.score >= .3).sort((a, b) => b.score - a.score).slice(0, 4);
}

/* ---------- bill OCR (free, runs on the device with Tesseract: Thai + English) ---------- */
let TESS_P = null, TESS_W = null;
async function ocrImage(file, onProg) {
  TESS_P ||= loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  await TESS_P;
  if (!TESS_W) TESS_W = await Tesseract.createWorker(['tha', 'eng'], 1, { logger: m => { if (m.status === 'recognizing text') onProg?.('กำลังอ่านบิล', m.progress); else if (/load|init/.test(m.status)) onProg?.('กำลังเตรียมตัวอ่านภาษาไทย (ครั้งแรกจะช้าสักครู่)', m.progress || 0); } });
  const img = await prepImage(file);
  const { data } = await TESS_W.recognize(img);
  return data.text || '';
}
async function prepImage(file) {   // shrink, greyscale and boost contrast: faster and more accurate OCR
  const bmp = await createImageBitmap(file);
  const sc = Math.min(1, 2200 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * sc), h = Math.round(bmp.height * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.drawImage(bmp, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) { let g = .299 * a[i] + .587 * a[i + 1] + .114 * a[i + 2]; g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 140)); a[i] = a[i + 1] = a[i + 2] = g; }
  x.putImageData(d, 0, 0); return c;
}
const UNIT_RE = /(ชิ้น|ขวด|แพ็ค|แพ็ก|แพค|ลัง|กล่อง|ถุง|ซอง|กระป๋อง|โหล|กก\.?|กิโล|kg|pcs|pc|ea|box|pack|ctn|แผง|หวี|ลูก|ผล|มัด|กำ)/i;
function parseBill(text) {
  const out = { items: [], invoice: '', date: '', total: 0, supplier: '' };
  const lines = text.split(/\n+/).map(l => l.replace(/\u0E4D\u0E32/g, '\u0E33').replace(/[|_]/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l.length > 1);
  const tl = l => l.replace(/[\u0E48-\u0E4C\u0E47]/g, '');   // keyword tests ignore tone marks (OCR often drops them)
  const skip = /(รวม|ยอด|ภาษี|vat|total|sub ?total|สวนลด|discount|เงินสด|เงินทอน|change|cash|เลขที|วันที|date|โทร|tel|fax|tax|ใบกำกับ|ใบเสร็จ|ใบสงของ|invoice|receipt|สาขา|หนา ?\d|page|ลงชือ|ผูรับ|ผูสง|ผูขาย|ลูกคา|ทีอยู|เลขประจำ|ธนาคาร|บัญชี|ชำระ|ลำดับ|รายการ|จำนวนเงิน)/i;
  for (const l of lines.slice(0, 6)) { const s = S.suppliers.map(x => ({ x, sc: dice(nrm(l), nrm(x.name)) })).sort((a, b) => b.sc - a.sc)[0]; if (s && s.sc > .6 && !out.supplier) out.supplier = s.x.id; }
  for (const l of lines) {
    const L0 = tl(l);
    const inv = L0.match(/(?:เลขที|no\.?|invoice|บิล)\s*[:#.]?\s*([A-Z]{0,4}[-/]?\d[\dA-Z\-/]{2,})/i); if (inv && !out.invoice) out.invoice = inv[1];
    const dm = l.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/); if (dm && !out.date) { let y = +dm[3]; if (y < 100) y += 2500; if (y > 2400) y -= 543; const d = new Date(y, +dm[2] - 1, +dm[1]); if (!isNaN(d)) out.date = ymd(d); }
    const tm = L0.match(/(รวมทังสิน|ยอดสุทธิ|ยอดรวม|รวมเงิน|grand ?total|net ?total|total)\D*([\d,]+\.\d{2})/i); if (tm) out.total = Math.max(out.total, num(tm[2].replace(/,/g, '')));
    if (skip.test(L0)) continue;
    const bc = (l.match(/\b\d{8,14}\b/) || [])[0] || '';
    const rest = bc ? l.replace(bc, ' ') : l;
    const toks = [...rest.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g)].map(m => ({ v: num(m[0].replace(/,/g, '')), i: m.index, s: m[0] }));
    if (!toks.length) continue;
    let qty = 1, price = 0, total = 0, used = [];
    const T = toks.slice(-3);
    if (T.length === 3 && Math.abs(T[0].v * T[1].v - T[2].v) <= Math.max(.06, T[2].v * .02)) { [qty, price, total] = [T[0].v, T[1].v, T[2].v]; used = T; }
    else if (T.length >= 2 && Math.abs(T[T.length - 2].v * T[T.length - 1].v) && Number.isInteger(T[T.length - 2].v) && T[T.length - 2].v <= 500 && T[T.length - 1].v > T[T.length - 2].v && /\./.test(T[T.length - 1].s)) {
      qty = T[T.length - 2].v; total = T[T.length - 1].v; price = r2(total / qty); used = T.slice(-2); }
    else { price = total = toks[toks.length - 1].v; used = [toks[toks.length - 1]]; }
    if (!(price > 0) || price > 1e6) continue;
    let name = rest.slice(0, used[0].i).replace(/^\s*\d{1,3}[.)]?\s+/, '').replace(UNIT_RE, m => ' ').replace(/[^฀-๿a-zA-Z0-9 .()%\-/]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/[฀-๿a-zA-Z]{2,}/.test(name) && !bc) continue;
    const um = rest.slice(used[0].i).match(UNIT_RE) || rest.match(UNIT_RE);
    out.items.push({ billName: name || bc, code: bc, qty, price, total, unit: um ? um[0] : '' });
  }
  return out;
}

/* ---------- price advice ---------- */
function suggestPrice(p, newCost) {
  const tgt = num(S.shop.target_margin) || 30;
  let m = p.price > 0 && p.cost > 0 && p.price > p.cost ? (p.price - p.cost) / p.price : tgt / 100;
  m = Math.max(.05, Math.min(.9, m));
  const raw = newCost / (1 - m);
  return raw < 100 ? Math.ceil(raw) : Math.ceil(raw / 5) * 5;
}

/* ---------- RECEIVE GOODS page ---------- */
VIEWS.receive = async pg => {
  const R = { lines: [], supplier: '', invoice: '', date: ymd(new Date()), billFile: null, billPreview: '', ocrTotal: 0, paid: true };
  let tab = 'new';
  $('#tact').innerHTML = `<div class="seg" id="rtab"><button data-t="new" class="on">➕ รับสินค้า</button><button data-t="hist">🗂 ประวัติการรับ</button></div>`;
  $$('#rtab button').forEach(b => b.onclick = () => { tab = b.dataset.t; $$('#rtab button').forEach(x => x.classList.toggle('on', x === b)); tab === 'new' ? draw() : hist(); });
  const unitsOf = p => [{ unit: p.unit || 'ชิ้น', factor: 1 }, ...arr(p.units).map(u => ({ unit: u.unit, factor: num(u.factor) || 1 }))];
  const mkLine = (p, o = {}) => {
    const L = { id: uid(), p, billName: o.billName || '', code: o.code || '', qty: num(o.qty) || 1, cost: num(o.price) || (p ? num(p.cost) : 0), factor: 1, unit: '', skip: false, cands: o.cands || [], score: o.score ?? (p ? 1 : 0), how: o.how || '', setPrice: false, newPrice: 0 };
    if (p && o.unit) { const u = unitsOf(p).find(u => nrm(u.unit) === nrm(o.unit)); if (u) { L.factor = u.factor; L.unit = u.unit; } }
    if (p) L.unit ||= p.unit || 'ชิ้น';
    advise(L); return L;
  };
  const baseCost = L => L.factor ? num(L.cost) / L.factor : num(L.cost);
  const advise = L => { if (!L.p) return; const bc = baseCost(L), up = bc > num(L.p.cost) * 1.0001 && num(L.p.cost) > 0;
    L.newPrice = suggestPrice(L.p, bc); L.setPrice = num(L.p.price) <= bc && L.newPrice > num(L.p.price) && canDo('edit_prices'); L.suggest = (up || num(L.p.price) <= bc) && L.newPrice > num(L.p.price); };
  const draw = () => {
    const tot = R.lines.filter(l => !l.skip).reduce((a, l) => a + num(l.qty) * num(l.cost), 0);
    const ups = R.lines.filter(l => l.p && !l.skip && num(l.p.cost) > 0 && baseCost(l) > num(l.p.cost) * 1.0001);
    pg.innerHTML = `<div class="rcv">
      <div class="card rcv-head">
        <div class="rcv-bill">${R.billPreview ? `<img src="${R.billPreview}" alt="บิล" id="rbimg">` : `<div class="rcv-ph">🧾<small>ยังไม่มีรูปบิล</small></div>`}
          <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center"><label class="btn p">📷 ถ่ายรูปบิล<input type="file" accept="image/*" capture="environment" id="rbcam" hidden></label>
            <label class="btn">🖼️ เลือกรูป<input type="file" accept="image/*" id="rbfile" hidden></label></div>
          <div id="rocr" class="muted" style="font-size:13px;text-align:center"></div></div>
        <div class="rcv-meta">
          <div class="fg"><label class="f">ผู้จำหน่าย</label><select class="in" id="rsup"><option value="">— ไม่ระบุ —</option>${S.suppliers.map(s => `<option value="${s.id}" ${R.supplier === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
          <div class="grid2"><div class="fg"><label class="f">เลขที่บิล</label><input class="in" id="rinv" value="${esc(R.invoice)}"></div><div class="fg"><label class="f">วันที่บิล</label><input class="in" type="date" id="rdate" value="${esc(R.date)}"></div></div>
          <div class="sbox"><span>🔍</span><input class="in" id="radd" placeholder="สแกน / พิมพ์ชื่อสินค้าเพื่อเพิ่มรายการ (ไม่มีบิลก็เพิ่มเองได้)" autocomplete="off"></div><div id="rsug" class="rsug"></div>
          ${ups.length ? `<div class="rcv-alert">⚠️ ราคาทุนเพิ่มขึ้น ${ups.length} รายการ: ${ups.slice(0, 4).map(l => `${esc(l.p.name)} <b>+${((baseCost(l) / num(l.p.cost) - 1) * 100).toFixed(0)}%</b>`).join(' · ')}${ups.length > 4 ? ' …' : ''}</div>` : ''}
        </div></div>
      <div id="rlines" class="rlines">${R.lines.length ? R.lines.map(lineHTML).join('') : '<div class="empty">📦<br>ถ่ายรูปบิลเพื่อให้ระบบอ่านรายการให้ หรือสแกน/ค้นหาสินค้าเพื่อเพิ่มเอง</div>'}</div>
      ${R.lines.length ? `<div class="card rcv-foot"><div><small class="muted">${R.lines.filter(l => !l.skip).length} รายการ</small><div class="b" style="font-size:22px">${baht(tot)}</div>
          ${R.ocrTotal ? `<small style="color:${Math.abs(R.ocrTotal - tot) < 1 ? 'var(--ok)' : 'var(--warn)'}">ยอดในบิล ${baht(R.ocrTotal)}${Math.abs(R.ocrTotal - tot) < 1 ? ' ✓ ตรงกัน' : ' — ตรวจสอบอีกครั้ง'}</small>` : ''}</div>
        <label class="row"><input type="checkbox" id="rpaid" ${R.paid ? 'checked' : ''}> จ่ายเงินผู้จำหน่ายแล้ว</label>
        <button class="btn" id="rclear">ล้าง</button><button class="btn ok lg" id="rsave">✔ รับสินค้าเข้าสต็อก</button></div>` : ''}</div>`;
    wire();
  };
  const lineHTML = (L, i) => {
    const p = L.p, bc = baseCost(L), oc = p ? num(p.cost) : 0, diff = oc > 0 ? (bc / oc - 1) * 100 : 0;
    const chg = !p ? '' : oc <= 0 ? '<span class="chip">ทุนใหม่</span>' : Math.abs(diff) < .05 ? '<span class="chip">ทุนเท่าเดิม</span>' : diff > 0 ? `<span class="chip bad">▲ ทุนขึ้น ${diff.toFixed(1)}%</span>` : `<span class="chip ok">▼ ทุนลง ${Math.abs(diff).toFixed(1)}%</span>`;
    const loss = p && num(p.price) <= bc ? '<span class="chip bad">ขายขาดทุน!</span>' : '';
    return `<div class="rl ${L.skip ? 'skip' : ''} ${!p && !L.skip ? 'nomatch' : ''}" data-i="${i}">
      <div class="rl-img" style="${p?.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}">${p?.image_url ? '' : '📦'}</div>
      <div class="rl-main">
        ${L.billName || L.code ? `<small class="muted">ในบิล: ${esc(L.billName)}${L.code ? ' · ' + esc(L.code) : ''}</small>` : ''}
        <div class="rl-prod">${p ? `<b>${esc(p.name)}</b> ${L.how === 'barcode' ? '<span class="chip ok">✓ บาร์โค้ดตรง</span>' : L.score < .999 ? `<span class="chip ${L.score >= .7 ? 'ok' : 'warn'}">≈ ${Math.round(L.score * 100)}% ตรวจสอบ</span>` : ''}` : '<b style="color:var(--bad)">ยังไม่จับคู่สินค้า</b>'}
          <button class="btn sm" data-a="pick">${p ? 'เปลี่ยน' : 'เลือกสินค้า'}</button>${!p && canDo('edit_products') ? '<button class="btn sm p" data-a="new">＋ สร้างสินค้าใหม่</button>' : ''}</div>
        ${L.cands.some(c => c.p.id !== p?.id) ? `<div class="rl-cands">${p ? '' : '<small class="muted">ใกล้เคียง:</small> '}${L.cands.filter(c => c.p.id !== p?.id).slice(0, 3).map(c => `<button class="chip" data-c="${c.p.id}">${esc(c.p.name)} ${Math.round(c.score * 100)}%</button>`).join('')}</div>` : ''}
        <div class="rl-nums">
          <label><small>จำนวน</small><input class="in" type="number" step="any" inputmode="decimal" data-f="qty" value="${L.qty}"></label>
          <label><small>หน่วย</small><select class="in" data-f="unit" ${p ? '' : 'disabled'}>${p ? unitsOf(p).map(u => `<option value="${u.factor}" ${u.factor === L.factor ? 'selected' : ''}>${esc(u.unit)}${u.factor !== 1 ? ` (${u.factor})` : ''}</option>`).join('') : '<option>—</option>'}</select></label>
          <label><small>ทุน / หน่วย</small><input class="in" type="number" step="any" inputmode="decimal" data-f="cost" value="${num(L.cost)}"></label>
          <div class="rl-tot"><small>รวม</small><b>${money(num(L.qty) * num(L.cost))}</b></div></div>
        ${p ? `<div class="rl-price">${chg}${loss}<span class="muted">ทุนเดิม ${money(oc)} → ${money(bc)} / ${esc(p.unit)} · ขาย ${money(p.price)} · กำไร ${num(p.price) > 0 ? ((num(p.price) - bc) / num(p.price) * 100).toFixed(0) : 0}%</span>
          ${L.suggest ? `<span class="chip warn">💡 แนะนำราคาขาย ฿${money(L.newPrice)} (กำไรเท่าเดิม)</span>` : ''}
          ${canDo('edit_prices') ? `<label class="row rl-set"><input type="checkbox" data-f="setPrice" ${L.setPrice ? 'checked' : ''}> ปรับราคาขายเป็น ฿<input class="in" type="number" step="any" data-f="newPrice" value="${L.newPrice}" style="width:90px"></label>` : ''}</div>` : ''}
      </div>
      <div class="rl-x"><button class="x" data-a="del" title="ลบ">×</button><button class="btn sm" data-a="skip">${L.skip ? 'รวมรายการ' : 'ข้าม'}</button></div></div>`;
  };
  const wire = () => {
    const onFile = async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await readBill(f); };
    $('#rbcam').onchange = onFile; $('#rbfile').onchange = onFile;
    $('#rbimg')?.addEventListener('click', () => modal('รูปบิล', `<img src="${R.billPreview}" style="width:100%;border-radius:12px">`, { wide: true }));
    $('#rsup').onchange = e => R.supplier = e.target.value; $('#rinv').oninput = e => R.invoice = e.target.value; $('#rdate').onchange = e => R.date = e.target.value;
    const add = $('#radd'), sug = $('#rsug');
    add.oninput = () => { const v = add.value.trim(); if (!v) return sug.innerHTML = '';
      const hits = S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v.toLowerCase()) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase() === v.toLowerCase())).slice(0, 8);
      sug.innerHTML = hits.map(p => `<button data-p="${p.id}">${esc(p.name)} <small class="muted">${esc(p.barcode || '')} · ทุน ${money(p.cost)}</small></button>`).join('') || `<div class="muted" style="padding:8px">ไม่พบ — กด Enter เพื่อสร้างสินค้าใหม่</div>`;
      $$('[data-p]', sug).forEach(b => b.onclick = () => { R.lines.unshift(mkLine(S.products.find(x => x.id === b.dataset.p))); sfx('add'); draw(); setTimeout(() => $('#radd')?.focus(), 30); }); };
    add.onkeydown = e => { if (e.key !== 'Enter') return; const v = add.value.trim(); if (!v) return;
      const hit = S.products.find(p => p.barcode === v || p.sku === v) || (S.products.filter(p => p.name.toLowerCase().includes(v.toLowerCase())).length === 1 ? S.products.find(p => p.name.toLowerCase().includes(v.toLowerCase())) : null);
      if (hit) { const ex = R.lines.find(l => l.p?.id === hit.id); if (ex) ex.qty++; else R.lines.unshift(mkLine(hit)); sfx('scan'); draw(); setTimeout(() => $('#radd')?.focus(), 30); }
      else if (canDo('edit_products')) { const before = new Set(S.products.map(p => p.id)); const isCode = looksCode(v);
        productForm({ name: isCode ? '' : v, barcode: isCode ? v : '', unit: 'ชิ้น', track_stock: true, active: true }, () => { const np = S.products.find(p => !before.has(p.id)); if (np) { R.lines.unshift(mkLine(np, { qty: 1, price: np.cost })); draw(); } }); } };
    $$('.rl', pg).forEach(row => {
      const L = R.lines[+row.dataset.i];
      $$('[data-f]', row).forEach(inp => inp.onchange = () => { const f = inp.dataset.f;
        if (f === 'unit') L.factor = num(inp.value) || 1, L.unit = inp.selectedOptions[0].textContent.replace(/\s*\(.*$/, '');
        else if (f === 'setPrice') L.setPrice = inp.checked; else L[f] = num(inp.value);
        if (['qty', 'cost', 'unit'].includes(f)) advise(L); draw(); });
      $$('[data-c]', row).forEach(b => b.onclick = () => { const c = L.cands.find(x => x.p.id === b.dataset.c); L.p = c.p; L.score = c.score; L.how = c.how; L.unit = ''; L.factor = 1; L.unit = c.p.unit; advise(L); draw(); });
      $$('[data-a]', row).forEach(b => b.onclick = () => { const a = b.dataset.a;
        if (a === 'del') { R.lines.splice(+row.dataset.i, 1); draw(); }
        if (a === 'skip') { L.skip = !L.skip; draw(); }
        if (a === 'pick') productPicker('เลือกสินค้าสำหรับ: ' + (L.billName || ''), p => { L.p = p; L.score = 1; L.how = 'manual'; L.factor = 1; L.unit = p.unit; advise(L); draw(); }, p => p.active !== false);
        if (a === 'new') { const before = new Set(S.products.map(p => p.id));
          productForm({ name: L.billName, barcode: L.code, cost: r2(baseCost(L)), unit: L.unit || 'ชิ้น', track_stock: true, active: true }, () => { const np = S.products.find(p => !before.has(p.id)); if (np) { L.p = np; L.score = 1; L.how = 'manual'; L.factor = 1; L.unit = np.unit; advise(L); draw(); } }); } }); });
    $('#rpaid') && ($('#rpaid').onchange = e => R.paid = e.target.checked);
    $('#rclear') && ($('#rclear').onclick = async () => { if (await confirmBox('ล้างรายการทั้งหมด?')) { Object.assign(R, { lines: [], billFile: null, billPreview: '', ocrTotal: 0, invoice: '' }); draw(); } });
    $('#rsave') && ($('#rsave').onclick = save);
  };
  const readBill = async f => {
    R.billFile = f; R.billPreview = URL.createObjectURL(f); draw();
    const st = (t, p) => { const el = $('#rocr'); if (el) el.innerHTML = `${esc(t)}${p != null ? `<div class="bar"><i style="width:${Math.round(p * 100)}%"></i></div>` : ''}`; };
    st('กำลังเตรียมตัวอ่านบิล…', 0);
    try {
      const text = await ocrImage(f, st);
      const b = parseBill(text);
      if (b.supplier) R.supplier = b.supplier; if (b.invoice) R.invoice = b.invoice; if (b.date) R.date = b.date; R.ocrTotal = b.total;
      let n = 0;
      for (const it of b.items) { const c = matchProducts(it.billName, it.code); const top = c[0];
        const good = top && (top.how === 'barcode' || top.score >= .55);
        R.lines.push(mkLine(good ? top.p : null, { ...it, cands: c, score: top?.score || 0, how: top?.how || '' })); n++; }
      draw();
      st(n ? `อ่านได้ ${n} รายการ — ตรวจสอบจำนวนและราคาก่อนบันทึก (ช่องสีส้ม = ไม่แน่ใจ)` : 'อ่านรายการจากบิลไม่ได้ — ลองถ่ายให้ตรงและชัดขึ้น หรือเพิ่มรายการเอง', null);
      if (!n) modal('ข้อความที่อ่านได้จากบิล', `<pre style="white-space:pre-wrap;font-size:12px;max-height:50vh;overflow:auto">${esc(text) || '(ว่าง)'}</pre>`);
    } catch (e) { st('อ่านบิลไม่สำเร็จ: ' + e.message, null); }
  };
  const save = async () => {
    const L = R.lines.filter(l => !l.skip);
    if (!L.length) return toast('ไม่มีรายการ', 'bad');
    if (L.some(l => !l.p)) return toast('ยังมีรายการที่ไม่ได้จับคู่สินค้า — เลือกสินค้า สร้างใหม่ หรือกด “ข้าม”', 'bad');
    if (L.some(l => !(num(l.qty) > 0))) return toast('จำนวนต้องมากกว่า 0', 'bad');
    const b = $('#rsave'); b.disabled = true; b.textContent = 'กำลังบันทึก…';
    try {
      let bill_url = '';
      if (R.billFile) { const path = `${S.shop.id}/bills/${Date.now()}.jpg`; const blob = await new Promise(r => prepImageColor(R.billFile).then(c => c.toBlob(r, 'image/jpeg', .8)));
        const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg' }); if (!error) bill_url = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl; }
      const total = r2(L.reduce((a, l) => a + num(l.qty) * num(l.cost), 0));
      const no = await q(sb.rpc('doc_no', { p_shop: S.shop.id, p_prefix: 'RC', p_table: 'purchases' }));
      const po = await q(sb.from('purchases').insert({ shop_id: S.shop.id, po_no: no, supplier_id: R.supplier || null, invoice_no: R.invoice, status: 'ordered', source: 'receive', bill_url, total, paid: R.paid ? total : 0,
        note: R.date ? 'วันที่บิล ' + R.date : '', user_id: S.user.id, user_name: S.shop._name || '' }).select().single());
      await q(sb.from('purchase_items').insert(L.map(l => ({ purchase_id: po.id, shop_id: S.shop.id, product_id: l.p.id, name: l.p.name, qty: r2(num(l.qty) * l.factor), cost: r2(baseCost(l)),
        bill_name: l.billName, bill_qty: num(l.qty), bill_unit: l.unit, old_cost: num(l.p.cost), old_price: num(l.p.price), new_price: l.setPrice ? num(l.newPrice) : null }))));
      await q(sb.rpc('receive_purchase', { p_purchase: po.id }));
      let changed = 0;
      for (const l of L) {
        if (num(l.p.cost) > 0 && baseCost(l) > num(l.p.cost) * 1.0001) logAct('cost_increase', 'product', l.p.name, { before: num(l.p.cost), after: r2(baseCost(l)), pct: r2((baseCost(l) / num(l.p.cost) - 1) * 100), bill: no });
        if (l.setPrice && num(l.newPrice) > 0 && num(l.newPrice) !== num(l.p.price)) { await q(sb.from('products').update({ price: num(l.newPrice) }).eq('id', l.p.id)); logAct('price_update', 'product', l.p.name, { before: num(l.p.price), after: num(l.newPrice), bill: no }); changed++; }
      }
      const ids = L.map(l => l.p.id); const fresh = await q(sb.from('products').select('*').in('id', ids)); fresh.forEach(f => Object.assign(S.products.find(p => p.id === f.id) || {}, f));
      sfx('pay'); toast(`รับสินค้าแล้ว ${L.length} รายการ (${no})${changed ? ` · ปรับราคาขาย ${changed} รายการ` : ''}`, 'ok');
      Object.assign(R, { lines: [], billFile: null, billPreview: '', ocrTotal: 0, invoice: '' }); draw();
    } catch (e) { fail(e); b.disabled = false; b.textContent = '✔ รับสินค้าเข้าสต็อก'; }
  };
  const hist = async () => {
    pg.innerHTML = '<div class="skel"><i></i><i></i></div>';
    const rows = await q(sb.from('purchases').select('*, supplier:suppliers(name), items:purchase_items(*)').eq('shop_id', S.shop.id).eq('status', 'received').order('received_at', { ascending: false }).limit(100));
    pg.innerHTML = rows.length ? `<div class="rhist">${rows.map(r => { const ups = r.items.filter(i => num(i.old_cost) > 0 && num(i.cost) > num(i.old_cost) * 1.0001);
      return `<div class="card rh" data-id="${r.id}"><div class="row"><b style="flex:1">${esc(r.po_no)} ${r.invoice_no ? `· บิล ${esc(r.invoice_no)}` : ''}</b><b>${baht(r.total)}</b></div>
        <div class="muted" style="font-size:13px">${dt(r.received_at)} · ${esc(r.supplier?.name || 'ไม่ระบุผู้จำหน่าย')} · ${r.items.length} รายการ · โดย ${esc(r.user_name || '')} ${r.bill_url ? '· 🧾 มีรูปบิล' : ''}</div>
        ${ups.length ? `<div style="margin-top:4px"><span class="chip bad">▲ ทุนขึ้น ${ups.length} รายการ</span></div>` : ''}</div>`; }).join('')}</div>` : '<div class="empty">ยังไม่มีประวัติการรับสินค้า</div>';
    $$('.rh', pg).forEach(c => c.onclick = () => { const r = rows.find(x => x.id === c.dataset.id);
      modal(`${r.po_no} — ${baht(r.total)}`, `${r.bill_url ? `<a href="${esc(r.bill_url)}" target="_blank"><img src="${esc(r.bill_url)}" style="max-width:100%;max-height:260px;border-radius:12px;display:block;margin:0 auto 10px"></a>` : ''}
        <div class="tblwrap"><table class="tbl"><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ทุน/หน่วย</th><th class="right">ทุนเดิม</th><th class="right">ราคาขาย</th></tr>
        ${r.items.map(i => { const up = num(i.old_cost) > 0 && num(i.cost) > num(i.old_cost) * 1.0001; return `<tr><td>${esc(i.name)}${i.bill_name && i.bill_name !== i.name ? `<br><small class="muted">ในบิล: ${esc(i.bill_name)}</small>` : ''}</td><td class="right">${qtyf(i.qty)}</td>
          <td class="right" style="color:${up ? 'var(--bad)' : ''}">${money(i.cost)}${up ? ` ▲${((i.cost / i.old_cost - 1) * 100).toFixed(0)}%` : ''}</td><td class="right">${i.old_cost != null ? money(i.old_cost) : '—'}</td>
          <td class="right">${i.new_price ? `${money(i.old_price)} → <b>${money(i.new_price)}</b>` : i.old_price != null ? money(i.old_price) : '—'}</td></tr>`; }).join('')}</table></div>`, { wide: true }); });
  };
  draw();
};
async function prepImageColor(file) { const bmp = await createImageBitmap(file); const sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)); const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c; }
/* stock page: "+ รับสินค้าเข้า" opens the receive screen */
const _stock44 = VIEWS.stock;
VIEWS.stock = pg => { _stock44(pg); const b = $('#rcv'); if (b) b.onclick = () => go('receive'); };

/* ---------- CASHIER: personal use (no price, just take out of stock) ---------- */
function personalUse() {
  const lines = []; let view = 'take';
  const me = S.shop._name || S.user.email.split('@')[0];
  const m = modal('🙋 เบิกใช้ส่วนตัว', `<div class="seg" id="puTab" style="margin-bottom:10px"><button data-v="take" class="on">เบิกสินค้า</button><button data-v="hist">ประวัติการเบิก</button></div><div id="puBody"></div>`, { wide: true });
  const body = () => $('#puBody', m);
  const drawTake = () => {
    body().innerHTML = `<div class="sbox"><span>🔍</span><input class="in" id="puq" placeholder="สแกนบาร์โค้ด หรือพิมพ์ชื่อสินค้า" autocomplete="off"></div><div id="pusug" class="rsug"></div>
      <div class="pulist">${lines.length ? lines.map((l, i) => `<div class="puline"><div class="rl-img" style="${l.p.image_url ? `background-image:url('${esc(l.p.image_url)}')` : ''}">${l.p.image_url ? '' : '📦'}</div>
        <b style="flex:1">${esc(l.p.name)}<br><small class="muted">คงเหลือ ${qtyf(l.p.stock)} ${esc(l.p.unit)}</small></b>
        <div class="qty"><button data-d="${i}">−</button><span>${qtyf(l.qty)}</span><button data-u="${i}">+</button></div><button class="x" data-x="${i}">×</button></div>`).join('') : '<div class="empty" style="padding:18px">ยังไม่มีสินค้า — สแกนหรือค้นหาด้านบน</div>'}</div>
      <div class="grid2"><div class="fg"><label class="f">ผู้เบิก</label><input class="in" id="puwho" value="${esc(me)}"></div><div class="fg"><label class="f">หมายเหตุ</label><input class="in" id="punote" placeholder="เช่น ทำอาหารกลางวัน / ใช้ในร้าน"></div></div>
      <button class="btn ok lg" id="pusave" style="width:100%" ${lines.length ? '' : 'disabled'}>✔ ตัดออกจากสต็อก (${lines.reduce((a, l) => a + l.qty, 0)} ชิ้น)</button>`;
    const q0 = $('#puq', m), sug = $('#pusug', m);
    const add = p => { const ex = lines.find(l => l.p.id === p.id); if (ex) ex.qty++; else lines.push({ p, qty: 1 }); sfx('add'); drawTake(); setTimeout(() => $('#puq', m)?.focus(), 30); };
    q0.oninput = () => { const v = q0.value.trim().toLowerCase(); if (!v) return sug.innerHTML = '';
      sug.innerHTML = S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v))).slice(0, 8).map(p => `<button data-p="${p.id}">${esc(p.name)} <small class="muted">${qtyf(p.stock)} ${esc(p.unit)}</small></button>`).join('');
      $$('[data-p]', sug).forEach(b => b.onclick = () => add(S.products.find(x => x.id === b.dataset.p))); };
    q0.onkeydown = e => { if (e.key !== 'Enter') return; const v = q0.value.trim(); const hit = S.products.find(p => p.barcode === v || p.sku === v); if (hit) add(hit); else { const l = S.products.filter(p => p.name.toLowerCase().includes(v.toLowerCase())); if (l.length === 1) add(l[0]); } };
    $$('[data-u]', m).forEach(b => b.onclick = () => { lines[+b.dataset.u].qty++; drawTake(); });
    $$('[data-d]', m).forEach(b => b.onclick = () => { const l = lines[+b.dataset.d]; l.qty--; if (l.qty <= 0) lines.splice(+b.dataset.d, 1); drawTake(); });
    $$('[data-x]', m).forEach(b => b.onclick = () => { lines.splice(+b.dataset.x, 1); drawTake(); });
    $('#pusave', m).onclick = async () => {
      const who = $('#puwho', m).value.trim() || me, note = $('#punote', m).value.trim(), btn = $('#pusave', m); btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
      try { for (const l of lines) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: l.p.id, p_kind: 'personal', p_qty: l.qty, p_cost: null, p_supplier: null, p_note: `ผู้เบิก: ${who}${note ? ' · ' + note : ''}` })); l.p.stock = num(l.p.stock) - l.qty; }
        toast(`ตัดสต็อกใช้ส่วนตัว ${lines.length} รายการแล้ว`, 'ok'); sfx('pay'); lines.length = 0; if (S.page === 'pos') drawGrid(); view = 'hist'; setTab(); }
      catch (e) { fail(e); btn.disabled = false; btn.textContent = '✔ ตัดออกจากสต็อก'; }
    };
    setTimeout(() => q0.focus(), 50);
  };
  const drawHist = async () => {
    body().innerHTML = '<div class="skel"><i></i></div>';
    const rows = await q(sb.from('stock_moves').select('product_name,qty,cost,note,created_at,user_id').eq('shop_id', S.shop.id).eq('kind', 'personal').order('created_at', { ascending: false }).limit(200));
    const g = []; rows.forEach(r => { const k = r.created_at.slice(0, 16) + '|' + r.note; let o = g.find(x => x.k === k); if (!o) g.push(o = { k, at: r.created_at, note: r.note, items: [] }); o.items.push(r); });
    const val = rows.reduce((a, r) => a + Math.abs(num(r.qty)) * num(r.cost), 0);
    body().innerHTML = rows.length ? `<p class="muted" style="margin-top:0">${g.length} ครั้งล่าสุด · มูลค่าทุนรวม ${baht(val)}</p><div class="puhist">${g.map(o => `<div class="puh"><div class="row"><b style="flex:1">${esc(o.note.replace(/^ผู้เบิก:\s*/, '').split(' · ')[0] || '-')}</b><small class="muted">${dt(o.at)}</small></div>
      ${o.note.includes(' · ') ? `<div class="muted" style="font-size:13px">📝 ${esc(o.note.split(' · ').slice(1).join(' · '))}</div>` : ''}
      <div class="puitems">${o.items.map(i => `<span class="chip">${esc(i.product_name)} × ${qtyf(Math.abs(i.qty))}</span>`).join('')}</div></div>`).join('')}</div>` : '<div class="empty">ยังไม่มีการเบิกใช้ส่วนตัว</div>';
  };
  const setTab = () => { $$('#puTab button', m).forEach(b => b.classList.toggle('on', b.dataset.v === view)); view === 'take' ? drawTake() : drawHist().catch(fail); };
  $$('#puTab button', m).forEach(b => b.onclick = () => { view = b.dataset.v; setTab(); });
  setTab();
}
const _posView44 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView44(pg);
  const anchor = $('#custBtn'); if (anchor && !$('#puBtn')) { anchor.insertAdjacentHTML('afterend', '<button class="btn" id="puBtn" title="เบิกใช้ส่วนตัว">🙋 <span class="hide-sm">ใช้เอง</span></button>'); $('#puBtn').onclick = personalUse; }
};
/* ================= v4.5 — daily summary bill (บิลรวมประจำวัน): cash vs transfer, items sold per day ================= */
async function dailyData(day, cashier) {
  const a = new Date(day + 'T00:00:00'), b = new Date(a.getTime() + 864e5 - 1), A = a.toISOString(), B = b.toISOString(), id = S.shop.id;
  const cf = qb => cashier ? qb.eq('sales.cashier_id', cashier) : qb;
  const [sales, pays, items, refs, moves, cms] = await Promise.all([
    fetchAll(() => { let qb = sb.from('sales').select('id,bill_no,total,discount,vat,status,pay_status,cashier_id,cashier_name,created_at,refunded_total,payment_method').eq('shop_id', id).gte('created_at', A).lte('created_at', B); if (cashier) qb = qb.eq('cashier_id', cashier); return qb.order('created_at'); }),
    fetchAll(() => cf(sb.from('sale_payments').select('method,amount,status,sales!inner(created_at,status,cashier_id)').eq('shop_id', id).neq('sales.status', 'void').gte('sales.created_at', A).lte('sales.created_at', B))),
    fetchAll(() => cf(sb.from('sale_items').select('product_id,name,qty,price,discount,refunded_qty,unit,sales!inner(created_at,status,cashier_id)').eq('shop_id', id).neq('sales.status', 'void').gte('sales.created_at', A).lte('sales.created_at', B))),
    fetchAll(() => sb.from('refunds').select('amount,method,created_at,user_id').eq('shop_id', id).gte('created_at', A).lte('created_at', B)).catch(() => []),
    fetchAll(() => sb.from('stock_moves').select('product_name,qty,cost,note,user_id').eq('shop_id', id).eq('kind', 'personal').gte('created_at', A).lte('created_at', B)).catch(() => []),
    fetchAll(() => sb.from('cash_moves').select('kind,amount,reason,created_at').eq('shop_id', id).gte('created_at', A).lte('created_at', B)).catch(() => []),
  ]);
  const ok = sales.filter(s => s.status !== 'void'), voids = sales.filter(s => s.status === 'void');
  const by = {}; pays.forEach(p => { const k = p.method; const o = by[k] ||= { amount: 0, n: 0, pending: 0 }; o.amount += num(p.amount); o.n++; if (p.status === 'pending') o.pending += num(p.amount); });
  const rf = refs.filter(r => !cashier || r.user_id === cashier), rby = {}; rf.forEach(r => { rby[r.method || 'cash'] = (rby[r.method || 'cash'] || 0) + num(r.amount); });
  const prod = {}; items.forEach(i => { const k = (i.product_id || '') + '|' + i.name; const o = prod[k] ||= { name: i.name, unit: i.unit, qty: 0, amount: 0 }; const q2 = num(i.qty) - num(i.refunded_qty); o.qty += q2; o.amount += q2 * num(i.price) - num(i.discount) * (num(i.qty) ? q2 / num(i.qty) : 1); });
  const list = Object.values(prod).filter(o => o.qty > 0).sort((x, y) => y.amount - x.amount);
  const gross = ok.reduce((x, s) => x + num(s.total), 0), refund = rf.reduce((x, r) => x + num(r.amount), 0);
  const cash = by.cash?.amount || 0, cashRef = rby.cash || 0;
  const cashIn = cms.filter(c => /in/.test(c.kind)).reduce((x, c) => x + num(c.amount), 0), cashOut = cms.filter(c => /out/.test(c.kind)).reduce((x, c) => x + num(c.amount), 0);
  const nonCash = Object.entries(by).filter(([k]) => k !== 'cash').reduce((x, [, o]) => x + o.amount, 0);
  const pers = moves.filter(m => !cashier || m.user_id === cashier);
  return { day, a, ok, voids, by, rby, list, gross, refund, net: gross - refund, cash, cashRef, cashIn, cashOut, nonCash, discount: ok.reduce((x, s) => x + num(s.discount), 0),
    pers, persValue: pers.reduce((x, m) => x + Math.abs(num(m.qty)) * num(m.cost), 0), first: ok[0]?.created_at, last: ok[ok.length - 1]?.created_at, qty: list.reduce((x, o) => x + o.qty, 0) };
}
const tm = d => d ? new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '-';
function dailyBillHTML(D, cashierName) {
  const sh = S.shop, w80 = sh.receipt_size === '80' || sh.paper_width >= 80;
  const row = (l, r, b) => `<tr><td${b ? ' class="t"' : ''}>${l}</td><td class="right${b ? ' t' : ''}">${r}</td></tr>`;
  return `<div class="rcpt ${w80 ? 'w80' : ''}">
    ${sh.logo_url ? `<div class="c"><img src="${esc(sh.logo_url)}" style="max-width:50%;max-height:56px"></div>` : ''}
    <div class="c t">${esc(sh.name)}</div><div class="c"><b>บิลรวมยอดขายประจำวัน</b></div>
    <div class="c">${dLong(D.a)}</div><div class="c">${esc(cashierName || 'พนักงานทุกคน')} · ${tm(D.first)}–${tm(D.last)}</div><hr>
    <table>${row('จำนวนบิล', qtyf(D.ok.length))}${row('สินค้าที่ขาย', qtyf(D.qty) + ' ชิ้น')}${row('ยอดขาย', money(D.gross))}
      ${D.discount ? row('(ส่วนลดรวม', money(D.discount) + ')') : ''}${D.refund ? row('คืนเงิน', '-' + money(D.refund)) : ''}${row('ยอดขายสุทธิ', money(D.net), 1)}</table><hr>
    <div><b>แยกตามช่องทางชำระ</b></div><table>
      ${Object.entries(D.by).map(([k, o]) => row(`${payName(k)} (${o.n})`, money(o.amount))).join('') || row('—', '0.00')}
      ${D.cashRef ? row('คืนเงินสด', '-' + money(D.cashRef)) : ''}
      ${row('เงินสดสุทธิ', money(D.cash - D.cashRef), 1)}${row('โอน / สแกน / อื่นๆ', money(D.nonCash - Object.entries(D.rby).filter(([k]) => k !== 'cash').reduce((x, [, v]) => x + v, 0)), 1)}</table>
    ${D.cashIn || D.cashOut ? `<hr><table>${row('นำเงินเข้าลิ้นชัก', money(D.cashIn))}${row('นำเงินออก', '-' + money(D.cashOut))}${row('เงินสดในลิ้นชัก (ไม่รวมเงินทอนตั้งต้น)', money(D.cash - D.cashRef + D.cashIn - D.cashOut), 1)}</table>` : ''}
    <hr><div><b>สรุปรายการขาย</b></div><table>${D.list.map(o => `<tr><td colspan="2">${esc(o.name)}</td></tr><tr><td>&nbsp;${qtyf(o.qty)} ${esc(o.unit || '')}</td><td class="right">${money(o.amount)}</td></tr>`).join('') || '<tr><td>ไม่มีการขาย</td></tr>'}</table>
    ${D.voids.length ? `<hr><div>บิลยกเลิก ${D.voids.length} บิล (${D.voids.map(v => esc(v.bill_no)).join(', ')})</div>` : ''}
    ${D.pers.length ? `<hr><div><b>เบิกใช้ส่วนตัว</b> (มูลค่าทุน ${money(D.persValue)})</div><table>${D.pers.map(m => row(`${esc(m.product_name)} × ${qtyf(Math.abs(m.qty))}`, '')).join('')}</table>` : ''}
    <hr><div class="c">พิมพ์เมื่อ ${dt(new Date())}</div></div>`;
}
async function dailySummary(day = ymd(new Date())) {
  const all = canDo('view_reports') || canDo('view_sales') && ['owner', 'admin', 'manager', 'accountant'].includes(S.role);
  let cashier = all ? '' : S.user.id, members = [];
  if (all) { try { members = await q(sb.from('shop_members').select('user_id,display_name,username').eq('shop_id', S.shop.id)); } catch {} }
  const m = modal('📊 สรุปยอดประจำวัน', `<div class="row ds-bar"><button class="btn" id="dsPrev">◀</button><input class="in" type="date" id="dsDay" value="${day}" style="width:auto"><button class="btn" id="dsNext">▶</button><button class="btn sm" id="dsToday">วันนี้</button>
      ${all ? `<select class="in" id="dsCash" style="width:auto"><option value="">พนักงานทุกคน</option>${members.map(x => `<option value="${x.user_id}">${esc(x.display_name || x.username)}</option>`).join('')}</select>` : ''}</div><div id="dsBody"><div class="skel"><i></i><i></i></div></div>`,
    { wide: true, foot: `<button class="btn" id="dsXl">📗 Excel</button><button class="btn" id="dsImg">🖼️ บันทึกรูป</button><button class="btn p" id="dsPrint">🖨️ พิมพ์บิลรวม</button>` });
  let D = null;
  const cname = () => cashier ? (members.find(x => x.user_id === cashier)?.display_name || S.shop._name || '') : '';
  const load = async () => {
    const body = $('#dsBody', m); body.innerHTML = '<div class="skel"><i></i><i></i></div>';
    try { D = await dailyData($('#dsDay', m).value, cashier); } catch (e) { body.innerHTML = ''; return fail(e); }
    const tile = (k, v, s = '', cls = '') => `<div class="dtile ${cls}"><small>${k}</small><b>${v}</b>${s ? `<span>${s}</span>` : ''}</div>`;
    const ncRef = Object.entries(D.rby).filter(([k]) => k !== 'cash').reduce((x, [, v]) => x + v, 0);
    body.innerHTML = `<div class="dstrip" style="margin-top:10px">${tile('ยอดขายสุทธิ', baht(D.net), `${D.ok.length} บิล · ${qtyf(D.qty)} ชิ้น`, 'hero')}${tile('💵 เงินสด', baht(D.cash - D.cashRef), D.cashRef ? `คืนเงินสด ${money(D.cashRef)}` : '')}
        ${tile('📱 โอน / สแกน', baht(D.nonCash - ncRef), Object.entries(D.by).filter(([k]) => k !== 'cash').map(([k, o]) => `${payName(k)} ${money(o.amount)}`).join(' · '))}${D.refund ? tile('↩️ คืนเงิน', baht(D.refund)) : ''}${D.persValue ? tile('🙋 ใช้เอง (ทุน)', baht(D.persValue), `${D.pers.length} รายการ`) : ''}</div>
      <div class="grid2" style="align-items:start">
        <div class="card"><b>สรุปรายการขาย (${D.list.length} รายการ)</b><div class="tblwrap dswrap" style="margin-top:6px"><table class="tbl dstbl"><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ยอด</th></tr>
          ${D.list.map(o => `<tr><td>${esc(o.name)}</td><td class="right">${qtyf(o.qty)} ${esc(o.unit || '')}</td><td class="right b">${money(o.amount)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">ยังไม่มีการขาย</td></tr>'}</table></div></div>
        <div><div class="card" style="margin-bottom:12px"><b>ช่องทางชำระเงิน</b><table class="rtable" style="margin-top:6px">${Object.entries(D.by).map(([k, o]) => `<tr><td>${payIcon(k)} ${payName(k)}</td><td class="right muted">${o.n} รายการ</td><td class="right b">${money(o.amount)}</td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}
            ${D.cashIn || D.cashOut ? `<tr><td>นำเงินเข้า / ออกลิ้นชัก</td><td></td><td class="right">+${money(D.cashIn)} / −${money(D.cashOut)}</td></tr><tr><td><b>เงินสดที่ควรอยู่ในลิ้นชัก</b></td><td></td><td class="right b">${money(D.cash - D.cashRef + D.cashIn - D.cashOut)}</td></tr>` : ''}</table>
            <small class="muted">ยอดเงินสดไม่รวมเงินทอนตั้งต้นของกะ · เงินทอนหักให้แล้ว</small></div>
          <div class="card"><b>บิลรวม</b><div class="rcptbox" style="margin-top:6px">${dailyBillHTML(D, cname())}</div></div></div></div>`;
  };
  $('#dsDay', m).onchange = load;
  const shift = n => { const d = new Date($('#dsDay', m).value + 'T00:00:00'); d.setDate(d.getDate() + n); $('#dsDay', m).value = ymd(d); load(); };
  $('#dsPrev', m).onclick = () => shift(-1); $('#dsNext', m).onclick = () => shift(1); $('#dsToday', m).onclick = () => { $('#dsDay', m).value = ymd(new Date()); load(); };
  if ($('#dsCash', m)) $('#dsCash', m).onchange = e => { cashier = e.target.value; load(); };
  $('#dsPrint', m).onclick = () => D && printReceipt(dailyBillHTML(D, cname()));
  $('#dsImg', m).onclick = async () => { if (!D) return; try { await loadH2C(); const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff'; host.innerHTML = dailyBillHTML(D, cname()); document.body.appendChild(host);
    const c = await html2canvas(host.firstElementChild, { scale: 2, backgroundColor: '#fff', useCORS: true }); host.remove(); const blob = await new Promise(r => c.toBlob(r, 'image/png')); const name = safeName(`daily_${D.day}.png`);
    if (isNativeApp()) await nativeSave(name, blob); else saveBlob(name, blob); toast('บันทึกรูปบิลรวมแล้ว', 'ok'); } catch (e) { fail(e); } };
  $('#dsXl', m).onclick = () => D && xlsxDownload(`daily_${D.day}`, [
    { name: 'สรุป', aoa: [['บิลรวมประจำวัน', S.shop.name], ['วันที่', D.day], ['พนักงาน', cname() || 'ทุกคน'], ['จำนวนบิล', D.ok.length], ['ยอดขาย', D.gross], ['คืนเงิน', D.refund], ['ยอดขายสุทธิ', D.net], [],
      ['ช่องทาง', 'จำนวนรายการ', 'ยอด'], ...Object.entries(D.by).map(([k, o]) => [payName(k), o.n, r2(o.amount)]), [], ['เงินสดสุทธิ', '', r2(D.cash - D.cashRef)]], widths: [{ wch: 26 }, { wch: 22 }, { wch: 14 }] },
    { name: 'รายการขาย', rows: D.list.map(o => ({ 'สินค้า': o.name, 'จำนวน': o.qty, 'หน่วย': o.unit || '', 'ยอดขาย': r2(o.amount) })) },
    { name: 'บิล', rows: D.ok.map(s => ({ 'เลขที่บิล': s.bill_no, 'เวลา': tm(s.created_at), 'พนักงาน': s.cashier_name, 'ชำระโดย': payName(s.payment_method), 'ยอด': num(s.total) })) }]);
  load();
}
/* entry points: sell screen, bills page, Ctrl+K */
const _posView45 = VIEWS.pos;
VIEWS.pos = pg => { _posView45(pg); const t = $('#tact'); if (t && !$('#dsBtn')) { t.insertAdjacentHTML('afterbegin', '<button class="btn sm p" id="dsBtn" title="สรุปยอดประจำวัน">📊 <span class="hide-sm">สรุปวันนี้</span></button>'); $('#dsBtn').onclick = () => dailySummary(); } };
const _sales45 = VIEWS.sales;
VIEWS.sales = async pg => { await _sales45(pg); const t = $('#tact'); if (t && !$('#dsBtn2')) { t.insertAdjacentHTML('afterbegin', '<button class="btn p" id="dsBtn2">📊 บิลรวมประจำวัน</button>'); $('#dsBtn2').onclick = () => dailySummary(); } };
/* ================= v4.6 — scan-first stock management: scan → product card (receive / remove / count / edit / history), scan counting ================= */
async function productMoves(p, n = 12) {
  return q(sb.from('stock_moves').select('kind,qty,cost,note,ref,created_at').eq('shop_id', S.shop.id).eq('product_id', p.id).order('created_at', { ascending: false }).limit(n));
}
/* one card for everything about a product's stock */
async function stockQuick(p, after) {
  const can = canDo('manage_inventory'), ed = canDo('edit_products');
  const st = !p.track_stock ? '' : p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok';
  const m = modal(p.name, `<div class="sq-head"><div class="rl-img" style="width:84px;height:84px;${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}">${p.image_url ? '' : '📦'}</div>
      <div><div class="sq-stock ${st}">${p.track_stock ? `${qtyf(p.stock)} <small>${esc(p.unit)}</small>` : 'ไม่ตัดสต็อก'}</div>
        <div class="muted">${p.barcode ? `<code>${esc(p.barcode)}</code>` : '<span class="chip warn">ไม่มีบาร์โค้ด</span>'} · ${esc(catName(p.category_id) || 'ไม่มีหมวด')}</div>
        <div class="muted">ขาย ${baht(p.price)}${canDo('view_profit') ? ` · ทุน ${money(p.cost)}` : ''} · แจ้งเตือนเมื่อเหลือ ${qtyf(p.low_stock)}</div></div></div>
    ${can ? `<div class="sq-acts">
      <button data-k="in" class="ok"><span>➕</span>รับเข้า</button><button data-k="out"><span>➖</span>เบิกออก</button><button data-k="adjust"><span>⚖️</span>ตรวจนับ</button>
      <button data-k="damaged"><span>💔</span>ชำรุด</button><button data-k="expired"><span>⌛</span>หมดอายุ</button>${ed ? '<button data-e="edit"><span>✏️</span>แก้ไขสินค้า</button>' : ''}
      <button data-e="label"><span>🏷️</span>พิมพ์ฉลาก</button>${ed ? '<button data-e="pic"><span>📷</span>เปลี่ยนรูป</button>' : ''}</div>` : '<p class="muted">ไม่มีสิทธิ์ปรับสต็อก</p>'}
    <div class="sq-hist"><b>ความเคลื่อนไหวล่าสุด</b><div id="sqh" class="muted">กำลังโหลด…</div></div>`);
  $$('[data-k]', m).forEach(b => b.onclick = () => { m.close(); stockForm(p, b.dataset.k, () => { after?.(); stockQuick(p, after); }); });
  $$('[data-e]', m).forEach(b => b.onclick = () => { const e = b.dataset.e; m.close();
    if (e === 'edit') productForm(p, () => { after?.(); stockQuick(p, after); });
    if (e === 'label') printLabels([p]);
    if (e === 'pic') pictureMenu(p, () => { after?.(); stockQuick(p, after); }); });
  try { const mv = await productMoves(p);
    const el = $('#sqh', m); if (el) el.innerHTML = mv.length ? `<table class="rtable">${mv.map(r => `<tr><td>${dt(r.created_at)}</td><td>${(MOVE[r.kind] || ['', r.kind]).join(' ')}</td>
      <td class="right b" style="color:${r.qty < 0 ? 'var(--bad)' : 'var(--ok)'}">${r.qty > 0 ? '+' : ''}${qtyf(r.qty)}</td><td><small>${esc([r.ref, r.note].filter(Boolean).join(' · '))}</small></td></tr>`).join('')}</table>` : 'ยังไม่มีความเคลื่อนไหว';
  } catch {}
}
/* scan / search → product card, or add new product */
function stockLookup(code, after) {
  const v = code.trim(); if (!v) return;
  const hit = S.products.find(p => p.barcode === v || p.sku === v) || (() => { const l = S.products.filter(p => p.active !== false && p.name.toLowerCase().includes(v.toLowerCase())); return l.length === 1 ? l[0] : null; })();
  if (hit) { sfx('scan'); return stockQuick(hit, after); }
  if (looksCode(v)) return unknownBarcode(v);
  const l = S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v.toLowerCase())));
  if (l.length) productPicker('เลือกสินค้า: ' + v, p => stockQuick(p, after), p => l.includes(p)); else toast('ไม่พบสินค้า', 'bad');
}
/* scan-to-count: every scan adds 1 (or 5*barcode adds 5); save adjusts stock to the counted numbers */
function scanCount(after) {
  const cnt = new Map();   // product id -> counted
  const m = modal('📋 นับสต็อกด้วยการสแกน', `<p class="muted" style="margin-top:0">สแกนสินค้าทีละชิ้น ระบบนับให้อัตโนมัติ · พิมพ์ <b>12*บาร์โค้ด</b> เพื่อเพิ่ม 12 · แก้ตัวเลขในตารางได้</p>
    <div class="row" style="gap:8px"><div class="sbox" style="flex:1"><span>🔍</span><input class="in" id="scq" placeholder="สแกน / พิมพ์บาร์โค้ด แล้วกด Enter" autocomplete="off"></div><button class="btn" id="sccam">📷</button></div>
    <div id="scl" class="sclist"></div>`, { wide: true, foot: '<span class="muted" id="scn"></span><span style="flex:1"></span><button class="btn" data-c>ยกเลิก</button><button class="btn ok" id="scsave">✔ บันทึกยอดที่นับ</button>' });
  const draw = () => {
    const rows = [...cnt.entries()].map(([id, c]) => ({ p: S.products.find(x => x.id === id), c })).filter(r => r.p);
    $('#scl', m).innerHTML = rows.length ? `<table class="tbl dstbl"><tr><th>สินค้า</th><th class="right">ในระบบ</th><th class="right">นับได้</th><th class="right">ต่าง</th></tr>${rows.map(({ p, c }) => { const d = c - num(p.stock);
      return `<tr><td>${esc(p.name)}</td><td class="right">${qtyf(p.stock)}</td><td class="right"><input class="in" type="number" step="any" data-id="${p.id}" value="${c}" style="width:76px;text-align:right"></td>
        <td class="right b" style="color:${d < 0 ? 'var(--bad)' : d > 0 ? 'var(--ok)' : ''}">${d > 0 ? '+' : ''}${qtyf(d)}</td></tr>`; }).join('')}</table>` : '<div class="empty">เริ่มสแกนสินค้าได้เลย</div>';
    $$('[data-id]', m).forEach(i => i.onchange = () => { cnt.set(i.dataset.id, num(i.value)); draw(); });
    $('#scn', m).textContent = `${rows.length} สินค้า · ${qtyf(rows.reduce((a, r) => a + r.c, 0))} ชิ้น`;
  };
  const add = raw => { let qn = 1, code = raw.trim(); const mm = code.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qn = num(mm[1]); code = mm[2].trim(); } if (!code) return;
    const p = S.products.find(x => x.barcode === code || x.sku === code);
    if (!p) { sfx('error'); return unknownBarcode(code); }
    cnt.set(p.id, (cnt.get(p.id) || 0) + qn); sfx('scan'); draw(); };
  const inp = $('#scq', m); inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); add(inp.value); inp.value = ''; } };
  $('#sccam', m).onclick = () => scanBarcode(c => { add(c); setTimeout(() => $('#sccam', m)?.click(), 600); });
  $('[data-c]', m).onclick = m.close;
  $('#scsave', m).onclick = async () => {
    const rows = [...cnt.entries()].map(([id, c]) => ({ p: S.products.find(x => x.id === id), c })).filter(r => r.p && r.c !== num(r.p.stock));
    if (!rows.length) { m.close(); return toast('ยอดตรงกับในระบบทั้งหมด ไม่มีอะไรต้องปรับ', 'ok'); }
    if (!await confirmBox(`ปรับสต็อก ${rows.length} สินค้าให้ตรงกับที่นับได้?`)) return;
    const b = $('#scsave', m); b.disabled = true;
    try { for (const r of rows) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: r.p.id, p_kind: 'adjust', p_qty: r.c, p_cost: null, p_supplier: null, p_note: 'นับสต็อกด้วยการสแกน' })); r.p.stock = r.c; }
      toast(`ปรับสต็อกแล้ว ${rows.length} สินค้า`, 'ok'); m.close(); after?.(); } catch (e) { fail(e); b.disabled = false; }
  };
  draw(); setTimeout(() => inp.focus(), 60);
}
/* stock page: scan bar on top, tap a product to open its card */
const _stock46 = VIEWS.stock;
VIEWS.stock = pg => {
  _stock46(pg);
  const refresh = () => go('stock');
  pg.insertAdjacentHTML('afterbegin', `<div class="card stk-scan"><div class="row" style="gap:8px;flex-wrap:wrap">
      <div class="sbox" style="flex:1;min-width:220px"><span>${ICON.barcodes}</span><input class="in" id="stkq" placeholder="สแกนบาร์โค้ด หรือพิมพ์ชื่อ → เปิดการ์ดสินค้า (รับเข้า / เบิก / นับ / แก้ไข)" autocomplete="off"></div>
      <button class="btn" id="stkcam">📷 สแกน</button><button class="btn" id="stkcount">📋 นับด้วยการสแกน</button>${canDo('edit_products') ? '<button class="btn p" id="stknew">＋ สินค้าใหม่</button>' : ''}</div>
      <small class="muted">ไม่พบบาร์โค้ด → เพิ่มเป็นสินค้าใหม่ได้ทันที · เบิกใช้ส่วนตัวอยู่ที่หน้าขาย (🙋 ใช้เอง)</small></div>`);
  const q0 = $('#stkq', pg);
  q0.onkeydown = e => { if (e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation(); const v = q0.value; q0.value = ''; stockLookup(v, refresh); };
  $('#stkcam', pg).onclick = () => scanBarcode(c => stockLookup(c, refresh));
  $('#stkcount', pg).onclick = () => scanCount(refresh);
  if ($('#stknew', pg)) $('#stknew', pg).onclick = () => productForm({ unit: 'ชิ้น', track_stock: true, active: true }, refresh);
  /* product names in the stock list open the product card */
  pg.addEventListener('click', e => { const td = e.target.closest('#sbody td:first-child'); if (!td || e.target.closest('button')) return;
    const id = td.parentElement.querySelector('[data-id]')?.dataset.id; const p = id && S.products.find(x => x.id === id); if (p) stockQuick(p, refresh); });
  if (matchMedia('(min-width:861px)').matches) setTimeout(() => q0.focus(), 80);
};
/* products page: scanning an existing barcode opens its stock card instead of the editor (edit is one tap away) */
Object.assign(AUDIT_L, { stock_adjust: 'ตรวจนับ/ปรับยอดสต็อก' });
/* ================= v4.6.1 — cashier tools bar on the sell screen (personal use, daily summary, quick sale, held bills) ================= */
const _posView461 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView461(pg);
  ['#puBtn', '#custBtn'].forEach(s => $(s)?.remove()); $('#dsBtn')?.remove();
  const left = pg.querySelector('.pos .left'); if (!left || $('#cashbar')) return;
  const stats = $('#posStats', left);
  (stats || left.firstElementChild).insertAdjacentHTML('afterend', `<div class="cashbar" id="cashbar">
    <button data-c="pu"><span>🙋</span>เบิกใช้ส่วนตัว</button><button data-c="ds"><span>📊</span>สรุปยอดวันนี้</button>
    <button data-c="quick"><span>➕</span>ขายด่วน</button><button data-c="held"><span>📂</span>บิลที่พัก <b id="cbHeld">${S.held.length || ''}</b></button>
    <button data-c="last"><span>🧾</span>บิลล่าสุด</button></div>`);
  $$('#cashbar [data-c]').forEach(b => b.onclick = () => ({ pu: personalUse, ds: () => dailySummary(), quick: customItem, held: showHeld, last: () => $('#lastBtn')?.click() })[b.dataset.c]());
};
const _drawCart461 = drawCart;
drawCart = function () { _drawCart461(); const h = $('#cbHeld'); if (h) h.textContent = S.held.length || ''; };
/* ================= v4.6.2 — stock count with barcode scanning (keyboard scanner + camera), camera scan in personal use ================= */
stockCountSheet = function (after) {
  const key = 'pos_count_' + S.shop.id;
  let counted = {}; try { counted = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  let filter = Object.keys(counted).length ? 'done' : 'all', lastId = null;
  const list = () => S.products.filter(p => p.track_stock && p.active !== false);
  const m = modal('📋 ตรวจนับสต็อก', `<div class="row" style="gap:8px"><div class="sbox" style="flex:1"><span>${ICON.barcodes}</span><input class="in" id="csq" placeholder="สแกนบาร์โค้ด = +1 · 12*บาร์โค้ด = +12 · หรือพิมพ์ชื่อค้นหา" autocomplete="off"></div>
      <button class="btn p" id="cscam">📷 สแกน</button></div>
      <div class="pills" id="csf" style="margin:10px 0">${[['all', 'ทั้งหมด'], ['done', 'นับแล้ว'], ['todo', 'ยังไม่นับ'], ['diff', 'ยอดไม่ตรง']].map(([k, l]) => `<button data-f="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="cl" class="cslist"></div>
      ${Object.keys(counted).length ? '<p class="muted" style="font-size:12px">มีการนับค้างไว้จากครั้งก่อน — นับต่อได้เลย หรือกด “ล้างยอดนับ”</p>' : ''}`,
    { wide: true, foot: `<span class="muted" id="cn"></span><span style="flex:1"></span><button class="btn" id="csclr">ล้างยอดนับ</button><button class="btn ok" id="csave">✔ บันทึกการตรวจนับ</button>` });
  const save = () => localStorage.setItem(key, JSON.stringify(counted));
  const draw = () => {
    const v = $('#csq', m).value.trim().toLowerCase();
    let L = list().filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v));
    if (filter === 'done') L = L.filter(p => p.id in counted); if (filter === 'todo') L = L.filter(p => !(p.id in counted)); if (filter === 'diff') L = L.filter(p => p.id in counted && counted[p.id] !== num(p.stock));
    if (lastId) L.sort((a, b) => (b.id === lastId) - (a.id === lastId));
    $('#cl', m).innerHTML = L.length ? L.slice(0, 300).map(p => { const c = counted[p.id], d = c === undefined ? null : c - num(p.stock);
      return `<div class="csrow ${p.id === lastId ? 'hit' : ''} ${c !== undefined ? 'done' : ''}"><div class="rl-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}">${p.image_url ? '' : '📦'}</div>
        <div class="csn"><b>${esc(p.name)}</b><small class="muted">${esc(p.barcode || 'ไม่มีบาร์โค้ด')} · ในระบบ ${qtyf(p.stock)} ${esc(p.unit)}</small></div>
        <div class="qty"><button data-m="${p.id}">−</button><input class="in" type="number" step="any" inputmode="decimal" data-c="${p.id}" value="${c ?? ''}" placeholder="—"><button data-p="${p.id}">+</button></div>
        <b class="csd" style="color:${d == null ? 'var(--muted)' : d < 0 ? 'var(--bad)' : d > 0 ? 'var(--ok)' : 'var(--ink)'}">${d == null ? '' : d === 0 ? '✓' : (d > 0 ? '+' : '') + qtyf(d)}</b></div>`; }).join('') : '<div class="empty">ไม่มีรายการ</div>';
    const done = Object.keys(counted).length, diff = Object.keys(counted).filter(id => { const p = S.products.find(x => x.id === id); return p && counted[id] !== num(p.stock); }).length;
    $('#cn', m).textContent = `นับแล้ว ${done}/${list().length} · ยอดไม่ตรง ${diff}`;
    $$('[data-c]', m).forEach(i => i.onchange = () => { if (i.value === '') delete counted[i.dataset.c]; else counted[i.dataset.c] = num(i.value); lastId = i.dataset.c; save(); draw(); });
    $$('[data-p]', m).forEach(b => b.onclick = () => { counted[b.dataset.p] = (counted[b.dataset.p] || 0) + 1; lastId = b.dataset.p; save(); draw(); });
    $$('[data-m]', m).forEach(b => b.onclick = () => { counted[b.dataset.m] = Math.max(0, (counted[b.dataset.m] || 0) - 1); lastId = b.dataset.m; save(); draw(); });
  };
  const scan = raw => { let n = 1, code = String(raw).trim(); const mm = code.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { n = num(mm[1]); code = mm[2].trim(); }
    const p = S.products.find(x => x.barcode === code || x.sku === code);
    if (!p) { if (looksCode(code)) { unknownBarcode(code); } return false; }
    if (!p.track_stock) { toast(`${p.name} ไม่ได้ตัดสต็อก`, 'bad'); return true; }
    counted[p.id] = (counted[p.id] || 0) + n; lastId = p.id; save(); sfx('scan'); if (filter === 'todo') filter = 'all';
    $$('#csf button', m).forEach(b => b.classList.toggle('on', b.dataset.f === filter)); $('#csq', m).value = ''; draw(); return true; };
  const q0 = $('#csq', m);
  q0.oninput = () => draw();
  q0.onkeydown = e => { if (e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation(); if (!scan(q0.value)) { const l = list().filter(p => p.name.toLowerCase().includes(q0.value.trim().toLowerCase())); if (l.length === 1) { q0.value = ''; scan(l[0].barcode || l[0].sku || ''); if (!l[0].barcode && !l[0].sku) { counted[l[0].id] = (counted[l[0].id] || 0) + 1; lastId = l[0].id; save(); draw(); } } } };
  $('#cscam', m).onclick = () => scanBarcode(c => { scan(c); setTimeout(() => { if (document.body.contains(m)) $('#cscam', m)?.click(); }, 700); });
  $$('#csf button', m).forEach(b => b.onclick = () => { filter = b.dataset.f; $$('#csf button', m).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#csclr', m).onclick = async () => { if (await confirmBox('ล้างยอดที่นับไว้ทั้งหมด?')) { counted = {}; lastId = null; save(); draw(); } };
  $('#csave', m).onclick = async () => {
    const ids = Object.keys(counted).filter(id => { const p = S.products.find(x => x.id === id); return p && counted[id] !== num(p.stock); });
    if (!ids.length) { localStorage.removeItem(key); m.close(); return toast('ยอดที่นับตรงกับในระบบทั้งหมด', 'ok'); }
    if (!await confirmBox(`ปรับยอดสต็อก ${ids.length} รายการให้ตรงกับที่นับได้?`)) return;
    const b = $('#csave', m); b.disabled = true;
    try { for (const id of ids) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: id, p_kind: 'adjust', p_qty: counted[id], p_cost: null, p_supplier: null, p_note: 'ตรวจนับสต็อก' })); S.products.find(p => p.id === id).stock = counted[id]; }
      localStorage.removeItem(key); toast(`ปรับยอดแล้ว ${ids.length} รายการ`, 'ok'); m.close(); after?.(); } catch (e) { b.disabled = false; fail(e); }
  };
  draw(); setTimeout(() => q0.focus(), 60);
};
/* one counting screen: the scan-count button opens the same sheet */
scanCount = after => stockCountSheet(after);
const _stock462 = VIEWS.stock;
VIEWS.stock = pg => { _stock462(pg); const b = $('#stkcount', pg); if (b) b.remove(); const c = $('#cnt'); if (c) { c.innerHTML = '📋 ตรวจนับสต็อก (สแกนได้)'; c.onclick = () => stockCountSheet(() => go('stock')); } };
/* personal use: camera scanning button next to the search box */
const _personalUse462 = personalUse;
personalUse = function () {
  _personalUse462();
  const m = $$('.mbg').pop(); if (!m) return;
  const add = () => { const box = $('#puq', m)?.closest('.sbox'); if (!box || $('#pucam', m)) return;
    box.insertAdjacentHTML('afterend', '<button class="btn p pucam" id="pucam">📷 สแกนด้วยกล้อง</button>');
    $('#pucam', m).onclick = () => scanBarcode(c => { const i = $('#puq', m); if (!i) return; i.value = c; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      setTimeout(() => { if (document.body.contains(m) && $('#pucam', m)) $('#pucam', m).click(); }, 700); }); };
  new MutationObserver(add).observe(m, { childList: true, subtree: true }); add();
};
/* ================= v4.6.3 — stock page: big-picture cards, filters, sort, adjustable size (like the cashier) ================= */
let SVIEW = { mode: localStorage.getItem('pos_sview') || 'cards', size: +(localStorage.getItem('pos_ssize') || (matchMedia('(max-width:860px)').matches ? 160 : 210)),
  f: 'all', cat: '', sort: 'name', q: '' };
const _stock463 = VIEWS.stock;
VIEWS.stock = pg => {
  _stock463(pg);
  const scan = $('.stk-scan', pg); if (!scan) return;
  const dayMs = 864e5, now = Date.now();
  const F = {
    all: ['ทั้งหมด', p => true], low: ['⚠️ ใกล้หมด', p => p.track_stock && p.stock > 0 && p.stock <= p.low_stock], out: ['⛔ หมด', p => p.track_stock && p.stock <= 0],
    exp: ['⌛ ใกล้หมดอายุ', p => p.expiry_date && new Date(p.expiry_date) - now < 30 * dayMs], over: ['📈 เกินสูงสุด', p => num(p.max_stock) > 0 && p.stock > p.max_stock],
    nobc: ['🏷️ ไม่มีบาร์โค้ด', p => !p.barcode], fav: ['★ รายการโปรด', p => p.favorite], off: ['🚫 ปิดขาย', p => p.active === false],
  };
  const SORT = { name: ['ชื่อ ก-ฮ', (a, b) => a.name.localeCompare(b.name, 'th')], low: ['สต็อกน้อย → มาก', (a, b) => num(a.stock) - num(b.stock)], high: ['สต็อกมาก → น้อย', (a, b) => num(b.stock) - num(a.stock)],
    value: ['มูลค่าสต็อกสูงสุด', (a, b) => Math.max(0, b.stock) * b.cost - Math.max(0, a.stock) * a.cost], exp: ['หมดอายุก่อน', (a, b) => (a.expiry_date || '9999').localeCompare(b.expiry_date || '9999')] };
  scan.insertAdjacentHTML('afterend', `<div class="card stk-filter" id="stkf">
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <div class="seg" id="svm"><button data-m="cards">🖼️ รูปใหญ่</button><button data-m="table">☰ ตาราง / ประวัติ</button></div>
        <div class="sbox" style="flex:1;min-width:160px"><span>🔍</span><input class="in" id="sfq" placeholder="กรองชื่อ / บาร์โค้ด" value="${esc(SVIEW.q)}"></div>
        <select class="in" id="sfc" style="width:auto"><option value="">ทุกหมวดหมู่</option>${S.categories.map(c => `<option value="${c.id}" ${SVIEW.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <select class="in" id="sfs" style="width:auto">${Object.entries(SORT).map(([k, [l]]) => `<option value="${k}" ${SVIEW.sort === k ? 'selected' : ''}>เรียง: ${l}</option>`).join('')}</select>
        <div class="zctl" id="szs" title="ขนาดรูป"><button type="button" data-z="-30">−</button><input type="range" min="130" max="420" step="10" value="${SVIEW.size}"><button type="button" data-z="30">+</button></div>
        <div class="zpre" id="szp">${[[140, 'S'], [180, 'M'], [230, 'L'], [300, 'XL'], [400, 'XXL']].map(([v, l]) => `<button type="button" data-zs="${v}" class="${SVIEW.size === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="pills" id="sff" style="margin-top:8px"></div></div>
    <div class="pmgrid" id="stkg"></div>`);
  const placeStats = () => { const stk = $('#stk', pg); if (stk && stk.previousElementSibling !== scan) scan.after(stk); };
  placeStats(); new MutationObserver(placeStats).observe(pg, { childList: true });
  const base = () => S.products.filter(p => (!SVIEW.cat || p.category_id === SVIEW.cat) &&
    (!SVIEW.q || p.name.toLowerCase().includes(SVIEW.q.toLowerCase()) || (p.barcode || '').includes(SVIEW.q) || (p.sku || '').toLowerCase().includes(SVIEW.q.toLowerCase())));
  const draw = () => {
    const cards = SVIEW.mode === 'cards';
    pg.classList.toggle('stkcards', cards);
    $$('#svm button', pg).forEach(b => b.classList.toggle('on', b.dataset.m === SVIEW.mode));
    $('#szs', pg).style.display = $('#szp', pg).style.display = cards ? '' : 'none';
    const b0 = base();
    $('#sff', pg).innerHTML = Object.entries(F).map(([k, [l, fn]]) => { const n = b0.filter(p => (k === 'all' ? (p.track_stock && p.active !== false) : k === 'off' ? p.active === false : p.active !== false && fn(p))).length;
      return `<button data-f="${k}" class="${SVIEW.f === k ? 'on' : ''}">${l} <small>${n}</small></button>`; }).join('');
    $$('#sff [data-f]', pg).forEach(b => b.onclick = () => { SVIEW.f = b.dataset.f; draw(); });
    const g = $('#stkg', pg); g.style.display = cards ? '' : 'none'; if (!cards) return;
    g.style.setProperty('--pm', SVIEW.size + 'px');
    const list = b0.filter(p => SVIEW.f === 'all' ? p.track_stock && p.active !== false : SVIEW.f === 'off' ? p.active === false : p.active !== false && F[SVIEW.f][1](p)).sort(SORT[SVIEW.sort][1]);
    const prof = canDo('view_profit');
    g.innerHTML = list.slice(0, 600).map(p => { const st = !p.track_stock ? '' : p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok';
      const exp = p.expiry_date ? Math.ceil((new Date(p.expiry_date) - now) / dayMs) : null;
      return `<div class="pm sk" data-id="${p.id}"><div class="pm-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : `background:linear-gradient(135deg,${esc(p.tile_color || catColor(p.category_id))},${esc(p.tile_color || catColor(p.category_id))}aa)`}">
          ${p.image_url ? '' : `<span>${esc([...p.name].slice(0, 2).join(''))}</span>`}
          <i class="sk-stock ${st}">${p.track_stock ? `${qtyf(p.stock)} <small>${esc(p.unit)}</small>` : 'ไม่ตัดสต็อก'}</i>
          ${exp != null && exp <= 30 ? `<i class="pm-promo" style="background:${exp < 0 ? '#e5384f' : '#e38a06'}">⌛ ${exp < 0 ? 'หมดอายุแล้ว' : 'อีก ' + exp + ' วัน'}</i>` : ''}
          ${canDo('manage_inventory') ? `<div class="pm-acts"><button data-k="in" title="รับเข้า">➕</button><button data-k="out" title="เบิกออก">➖</button><button data-k="adjust" title="ตรวจนับ">⚖️</button></div>` : ''}</div>
        <div class="pm-body"><b class="pm-name">${esc(p.name)}</b>
          <div class="pm-meta">${p.barcode ? `<code>${esc(p.barcode)}</code>` : '<span class="chip warn">ไม่มีบาร์โค้ด</span>'}<span>${esc(catName(p.category_id))}</span></div>
          <div class="pm-meta">${p.track_stock ? `แจ้งเตือน ≤ ${qtyf(p.low_stock)}` : ''}${prof && p.track_stock ? ` · มูลค่า ${money(Math.max(0, p.stock) * p.cost)}` : ''}</div></div></div>`; }).join('')
      || '<div class="empty" style="grid-column:1/-1">ไม่มีสินค้าตามตัวกรองนี้</div>';
  };
  $('#stkg', pg).onclick = e => { const el = e.target.closest('.pm[data-id]'); if (!el) return; const p = S.products.find(x => x.id === el.dataset.id); if (!p) return;
    const k = e.target.closest('[data-k]')?.dataset.k; if (k) return stockForm(p, k, () => go('stock')); stockQuick(p, () => go('stock')); };
  $$('#svm button', pg).forEach(b => b.onclick = () => { SVIEW.mode = b.dataset.m; localStorage.setItem('pos_sview', SVIEW.mode); draw(); });
  $('#sfq', pg).oninput = e => { SVIEW.q = e.target.value; draw(); };
  $('#sfc', pg).onchange = e => { SVIEW.cat = e.target.value; draw(); };
  $('#sfs', pg).onchange = e => { SVIEW.sort = e.target.value; draw(); };
  const setSz = n => { SVIEW.size = Math.max(130, Math.min(420, n)); $$('#szp [data-zs]', pg).forEach(b => b.classList.toggle('on', +b.dataset.zs === SVIEW.size)); localStorage.setItem('pos_ssize', SVIEW.size); $('#szs input', pg).value = SVIEW.size; $('#stkg', pg).style.setProperty('--pm', SVIEW.size + 'px'); };
  $('#szs input', pg).oninput = e => setSz(+e.target.value);
  $$('#szs [data-z]', pg).forEach(b => b.onclick = () => setSz(SVIEW.size + +b.dataset.z));
  $$('#szp [data-zs]', pg).forEach(b => b.onclick = () => setSz(+b.dataset.zs));
  draw();
};
/* ================= v4.7 — custom payment QR (upload your own), header branch switcher, full sound settings ================= */

/* ---------- custom payment QR ---------- */
const qrMode = () => (S.shop?.qr_mode === 'custom' && S.shop?.pay_qr_url) ? 'custom' : 'promptpay';
const customQRBlock = total => `<div class="qr cqr"><img src="${esc(S.shop.pay_qr_url)}" alt="QR ชำระเงิน" crossorigin="anonymous">
  ${S.shop.pay_qr_label ? `<div class="cqr-l">${esc(S.shop.pay_qr_label)}</div>` : ''}
  <b style="font-size:22px">${baht(total)}</b><span class="muted">ให้ลูกค้าสแกน QR ของร้าน โอนตามยอดนี้ แล้วกด “ยืนยันชำระเงิน”</span><div class="qrtimer" hidden></div></div>`;

const _payDialog47 = payDialog;
payDialog = function () {
  _payDialog47();
  const m = $$('.mbg').pop(); if (!m) return;
  let lastQR = null;
  const fix = () => {
    const pb = $('#pbody', m); if (!pb) return;
    const qr = $('.qr:not(.cqr)', pb), warn = [...$$('.chip.warn', pb)].find(c => c.textContent.includes('พร้อมเพย์'));
    if (qrMode() === 'custom' && (qr || warn)) {
      const tot = num(String($('.qr b', pb)?.textContent || '').replace(/[^\d.]/g, '')) || num(S._payTotal) || calc().total;
      (qr || warn).outerHTML = customQRBlock(tot);
      bc?.postMessage({ type: 'qr', label: S.shop.pay_qr_label || 'สแกนจ่าย QR', svg: `<img src="${esc(S.shop.pay_qr_url)}" style="width:280px;height:280px;object-fit:contain">`, total: tot });
    }
    const now = $('.qr', pb); if (now && now !== lastQR) { lastQR = now; sfx('qr'); }
  };
  new MutationObserver(fix).observe(m, { childList: true, subtree: true }); fix();
};

/* receipt: optionally print the shop's payment QR at the bottom */
const _receiptHTML47 = receiptHTML;
receiptHTML = function (sale, items, cust) {
  const h = _receiptHTML47(sale, items, cust), sh = S.shop;
  if (!sh.qr_on_receipt) return h;
  const src = sh.pay_qr_url && sh.qr_mode !== 'promptpay_only' ? sh.pay_qr_url : '';
  let img = '';
  if (src) img = `<img src="${esc(src)}" crossorigin="anonymous" style="width:150px;height:150px;object-fit:contain">`;
  else if (sh.promptpay_id) img = `<div style="width:150px;margin:auto">${qrSvg(promptPayPayload(sh.promptpay_id))}</div>`;
  if (!img) return h;
  const blk = `<hr><div class="c rqr">${img}<div>${esc(sh.pay_qr_label || 'สแกนชำระเงิน / โอนเงิน')}</div></div>`;
  const i = h.lastIndexOf('</div>'); return i > 0 ? h.slice(0, i) + blk + h.slice(i) : h + blk;
};

async function uploadQRFile(file) {
  const raw = file.size < 1500000 && /image\/(png|jpe?g|webp)/.test(file.type);
  const blob = raw ? file : await resizeImage(file);
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const path = `${S.shop.id}/qr/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

const _settings47 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings47(pg);
  const sh = S.shop, edit = canDo('manage_settings'), host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="grid2" style="margin-top:16px"><div class="card" id="qrcard"><h3 style="margin-top:0">📱 QR รับชำระเงินของร้าน</h3>
    <p class="muted" style="font-size:13px;margin-top:0">อัปโหลดรูป QR ของคุณเอง (QR แม่มณี / QR บัญชีธนาคาร / QR ร้านค้า) เพื่อแสดงที่หน้าแคชเชียร์ จอลูกค้า และพิมพ์บนบิล</p>
    <div class="cqr-set"><div class="cqr-pv" id="qrpv">${sh.pay_qr_url ? `<img src="${esc(sh.pay_qr_url)}" alt="">` : '<span class="muted">ยังไม่มี QR</span>'}</div>
      <div style="flex:1;min-width:180px">${edit ? `<label class="btn" style="cursor:pointer">📤 อัปโหลดรูป QR<input type="file" id="qrf" accept="image/*" hidden></label>
        ${sh.pay_qr_url ? '<button type="button" class="btn" id="qrdel">🗑 ลบ QR</button>' : ''}` : ''}
        <div class="fg" style="margin-top:8px"><label class="f">ข้อความใต้ QR (เช่น ชื่อบัญชี / ธนาคาร)</label><input class="in" id="qrl" value="${esc(sh.pay_qr_label || '')}" placeholder="เช่น ร้านหมูคุณยาย · กสิกรไทย" ${edit ? '' : 'disabled'}></div></div></div>
    <div class="fg"><label class="f">QR ที่ใช้ตอนลูกค้าเลือก “พร้อมเพย์ / QR”</label>
      <div class="pills" id="qrm"><button type="button" data-q="custom" class="${qrMode() === 'custom' ? 'on' : ''}" ${edit ? '' : 'disabled'}>📱 QR ของร้าน (ที่อัปโหลด)</button><button type="button" data-q="promptpay" class="${qrMode() === 'custom' ? '' : 'on'}" ${edit ? '' : 'disabled'}>⚡ พร้อมเพย์อัตโนมัติ (ใส่ยอดให้)</button></div></div>
    <label class="row"><input type="checkbox" id="qrr" ${sh.qr_on_receipt ? 'checked' : ''} ${edit ? '' : 'disabled'}> พิมพ์ QR ท้ายใบเสร็จ (ลูกค้าสแกนโอนได้ภายหลัง)</label>
    ${edit ? '<button type="button" class="btn p" id="qrsave" style="margin-top:10px">💾 บันทึก QR</button>' : ''}</div>
    <div class="card"><h3 style="margin-top:0">🔊 เสียงทั้งหมด</h3><p class="muted" style="font-size:13px;margin-top:0">เปิด/ปิด เลือกเสียง หรืออัปโหลดเสียงของคุณเองแยกทุกเหตุการณ์ (เพิ่มสินค้า สแกน ลบ ชำระเงิน แจ้งเตือน ฯลฯ) และเสียงพูดยอดเงิน — ตั้งค่าแยกแต่ละเครื่อง</p>
      <button type="button" class="btn p" id="sndopen">🎚️ ตั้งค่าเสียง</button></div></div>`);
  let newUrl = sh.pay_qr_url || '';
  $('#sndopen').onclick = soundSettings;
  if (!edit) return;
  $$('#qrm [data-q]').forEach(b => b.onclick = () => { $$('#qrm [data-q]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#qrf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { $('#qrpv').innerHTML = '<span class="muted">กำลังอัปโหลด…</span>'; newUrl = await uploadQRFile(f);
      $('#qrpv').innerHTML = `<img src="${esc(newUrl)}" alt="">`; $$('#qrm [data-q]').forEach(x => x.classList.toggle('on', x.dataset.q === 'custom'));
      toast('อัปโหลดแล้ว — กด “บันทึก QR”', 'ok'); } catch (er) { fail(er); }
  };
  if ($('#qrdel')) $('#qrdel').onclick = () => { newUrl = ''; $('#qrpv').innerHTML = '<span class="muted">ยังไม่มี QR</span>'; $$('#qrm [data-q]').forEach(x => x.classList.toggle('on', x.dataset.q === 'promptpay')); };
  $('#qrsave').onclick = async () => {
    const mode = $('#qrm [data-q].on')?.dataset.q || 'promptpay';
    if (mode === 'custom' && !newUrl) return toast('กรุณาอัปโหลดรูป QR ก่อน', 'bad');
    try { Object.assign(sh, await q(sb.from('shops').update({ pay_qr_url: newUrl || null, pay_qr_label: $('#qrl').value.trim() || null, qr_mode: mode, qr_on_receipt: $('#qrr').checked }).eq('id', sh.id).select().single()));
      logAct('settings', 'shop', 'QR รับชำระเงิน', { mode }); toast('บันทึก QR แล้ว', 'ok'); } catch (e) { fail(e); }
  };
};

/* ---------- header: branch / shop switcher (v4.7.1 — keeps the page title, rich switcher sheet) ---------- */
const brLogo = s => esc(s?.logo_url || 'logo-round.png');
const brSub = s => esc(s.branch_name || branchLine(s));
const _renderShell47 = renderShell;
renderShell = function () {
  _renderShell47();
  if (!S.shop) return;
  // wide screens: compact pill in the top bar (hidden on smaller screens so the page title always stays visible)
  const br = $('.branch');
  if (br) br.outerHTML = `<button type="button" class="brsw" id="brsw" data-brsw title="สลับสาขา (Alt+B)"><img src="${brLogo(S.shop)}" alt=""><span><b>${esc(S.shop.name)}</b><small>${brSub(S.shop)} · ${ROLE_NAME(S.role)}</small></span><i>▾</i></button>`;
  // phones/tablets: the shop-name line under the page title becomes the switcher
  const sm = $('.top .tt small.mob');
  if (sm) sm.outerHTML = `<button type="button" class="ttsw mob" data-brsw><span>${esc(S.shop.name)}</span>${S.shops.length > 1 ? `<em>${S.shops.length} สาขา</em>` : ''}<i>▾</i></button>`;
  // desktop sidebar: shop name block
  const lg = $('.side .logo'); if (lg) { lg.setAttribute('data-brsw', ''); lg.classList.add('brside'); lg.title = 'สลับสาขา / โปรไฟล์ร้าน'; if (!$('.brcaret', lg)) lg.insertAdjacentHTML('beforeend', '<i class="brcaret">▾</i>'); }
  const sb2 = $('#shopBtn'); if (sb2) sb2.setAttribute('data-brsw', '');
  $$('[data-brsw]').forEach(el => el.onclick = e => { e.preventDefault(); e.stopPropagation(); branchSwitcher(); });
};
window.addEventListener('keydown', e => { if (e.altKey && e.key.toLowerCase() === 'b' && S.shop && !$('.mbg')) { e.preventDefault(); branchSwitcher(); } });
function branchMenu() { branchSwitcher(); }

const recentShops = () => { try { return JSON.parse(localStorage.getItem('pos_shop_recent') || '[]'); } catch { return []; } };
function branchSwitcher() {
  if ($('.mbg.brsheet')) return;
  const cur = S.shop, rec = recentShops();
  const others = S.shops.filter(s => s.id !== cur.id).sort((a, b) => ((rec.indexOf(a.id) + 1 || 99) - (rec.indexOf(b.id) + 1 || 99)) || a.name.localeCompare(b.name, 'th'));
  const card = (s, isCur) => `<div class="brc ${isCur ? 'cur' : ''}" data-sid="${s.id}" data-k="${esc((s.name + ' ' + (s.branch_name || '') + ' ' + (s.branch_code || '') + ' ' + (s.address || '')).toLowerCase())}">
      <img src="${brLogo(s)}" alt=""><div class="brc-b"><b>${esc(s.name)}</b><small>${brSub(s)}${s.branch_code ? ' · รหัส ' + esc(s.branch_code) : ''}</small>
      <div class="brc-m"><span class="chip">${ROLE_NAME(s._role)}</span>${s.phone ? `<span>☎ ${esc(s.phone)}</span>` : ''}</div>
      <div class="brc-s" data-st="${s.id}"><span class="muted">กำลังโหลดยอดวันนี้…</span></div></div>
      ${isCur ? '<span class="brc-on">✓ ใช้งานอยู่</span>' : `<button type="button" class="btn p sm" data-go="${s.id}">สลับ →</button>`}</div>`;
  const m = modal('🏬 สาขา / โปรไฟล์ร้าน', `
    <div class="brsec">ร้านที่ใช้งานอยู่</div>${card(cur, true)}
    ${others.length ? `<div class="brsec">สลับไปสาขาอื่น <small class="muted">(${others.length})</small></div>
      ${others.length > 3 ? '<input class="in" id="brq" placeholder="🔍 ค้นหาสาขา ชื่อ รหัส หรือที่อยู่…" style="margin-bottom:8px">' : ''}
      <div class="brlist">${others.map(s => card(s, false)).join('')}</div>`
      : `<div class="brempty">มีร้านเดียวในบัญชีนี้${can('owner') ? ' — เพิ่มสาขาใหม่ได้ที่ปุ่มด้านล่าง' : ''}</div>`}
    ${S.cart?.length ? `<p class="chip warn" style="margin-top:10px">🛒 มีสินค้าในตะกร้า ${S.cart.length} รายการ — ขายให้เสร็จหรือพักบิลก่อนสลับสาขา</p>` : ''}`,
    { sheet: innerWidth < 700, foot: `${pageOK(PAGES.find(p => p.id === 'branches') || {}) ? '<button type="button" class="btn" id="brman">📊 ทุกสาขา</button>' : ''}${can('owner') ? '<button type="button" class="btn" id="bradd">＋ เพิ่มสาขา</button>' : ''}<span style="flex:1"></span><button type="button" class="btn" data-x2>ปิด</button>` });
  m.classList.add('brsheet');
  $('[data-x2]', m).onclick = () => m.close();
  if ($('#brman', m)) $('#brman', m).onclick = () => { m.close(); go('branches'); };
  if ($('#bradd', m)) $('#bradd', m).onclick = () => { m.close(); go('branches'); setTimeout(() => $('#nb')?.click(), 600); };
  if ($('#brq', m)) $('#brq', m).oninput = e => { const v = e.target.value.trim().toLowerCase(); $$('.brlist .brc', m).forEach(c => c.classList.toggle('hidden', !!v && !c.dataset.k.includes(v))); };
  $$('[data-go]', m).forEach(b => b.onclick = () => { m.close(); switchShop(b.dataset.go); });
  $$('.brlist .brc', m).forEach(c => c.ondblclick = () => { m.close(); switchShop(c.dataset.sid); });
  // today's numbers per branch (only what this account is allowed to see)
  (async () => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    let rows = [];
    try { rows = await q(sb.from('sales').select('shop_id,total,status').in('shop_id', S.shops.map(s => s.id)).gte('created_at', d0.toISOString()).limit(5000)); } catch { rows = null; }
    S.shops.forEach(s => {
      const el = $(`[data-st="${s.id}"]`, m); if (!el) return;
      if (!rows) { el.innerHTML = ''; return; }
      const mine = rows.filter(r => r.shop_id === s.id && r.status !== 'void');
      el.innerHTML = `<span>วันนี้ <b>${baht(mine.reduce((a, r) => a + num(r.total), 0))}</b></span><span>${mine.length} บิล</span>`;
    });
  })();
}
async function switchShop(id) {
  const to = S.shops.find(s => s.id === id); if (!to || id === S.shop.id) return;
  if (S.cart?.length && !(await confirmBox(`มีสินค้าในตะกร้า ${S.cart.length} รายการ — สลับไป “${to.name}” แล้วตะกร้าจะถูกล้าง ดำเนินการต่อ?`))) return;
  const rec = [id, ...recentShops().filter(x => x !== id)].slice(0, 10); localStorage.setItem('pos_shop_recent', JSON.stringify(rec));
  document.body.insertAdjacentHTML('beforeend', `<div class="brswitching"><div><img src="${brLogo(to)}" alt=""><b>กำลังสลับไป</b><span>${esc(to.name)}</span><small>${brSub(to)}</small><i></i></div></div>`);
  sfx('ok'); localStorage.setItem('pos_shop', id); S.cart = []; S.customer = null;
  const page = S.page;
  try { await boot(); if (page && PAGES.find(p => p.id === page && pageOK(p))) go(page); toast('✓ ใช้งาน ' + to.name, 'ok'); }
  finally { setTimeout(() => $('.brswitching')?.remove(), 350); }
}

/* ---------- sound settings: every event, tone choice, custom sound files, voice ---------- */
const SND_EVENTS = [
  ['add', '➕ เพิ่มสินค้าลงตะกร้า', 'beep'], ['scan', '📷 สแกนบาร์โค้ด', 'scanner'], ['remove', '➖ ลบ / ลดจำนวน', 'low'],
  ['error', '⚠️ ผิดพลาด / ไม่พบสินค้า', 'buzz'], ['ok', '✅ บันทึกสำเร็จ', 'chime'], ['pay', '💰 ชำระเงินเสร็จ', 'register'],
  ['qr', '📱 แสดง QR ให้ลูกค้าสแกน', 'ding'], ['hold', '⏸️ พักบิล', 'pop'], ['notify', '🔔 แจ้งเตือน / ข้อความ', 'bell']];
const SND_TONES = { beep: 'บี๊บ', scanner: 'เครื่องสแกน', low: 'ต่ำสั้น', buzz: 'เตือน (หึ่ง)', chime: 'ติ๊ง-ต่อง', register: 'ลิ้นชักเก็บเงิน + เหรียญ',
  ding: 'ดิ๊ง', pop: 'ป๊อป', bell: 'กระดิ่ง', click: 'คลิก', coin: 'เหรียญ', soft: 'นุ่ม ๆ', double: 'บี๊บคู่', success: 'สำเร็จ (3 โน้ต)', custom: '🎵 ไฟล์เสียงของฉัน' };
const SND_DEF = { events: {}, voice: { total: true, change: true, thanks: true, thanksText: 'ขอบคุณค่ะ', rate: 1, pitch: 1, name: '' } };
let SND = (() => { try { return { ...SND_DEF, ...JSON.parse(localStorage.getItem('pos_sound') || '{}') }; } catch { return { ...SND_DEF }; } })();
SND.voice = { ...SND_DEF.voice, ...(SND.voice || {}) };
const sndEv = k => ({ on: true, tone: SND_EVENTS.find(e => e[0] === k)?.[2] || 'beep', vol: 1, ...(SND.events[k] || {}) });
const saveSnd = () => { try { localStorage.setItem('pos_sound', JSON.stringify(SND)); } catch { toast('ไฟล์เสียงใหญ่เกินไป — ใช้ไฟล์สั้นกว่านี้', 'bad'); } };
const SND_FILES = {}; // event -> data URL (stored separately)
const sndFile = k => SND_FILES[k] ??= localStorage.getItem('pos_sound_file_' + k) || '';

function playTone(name, vol) {
  AC ||= new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
  const t0 = AC.currentTime;
  const tone = (f, s, d, type = 'sine', g = 0.25) => { const o = AC.createOscillator(), a = AC.createGain(); o.type = type; o.frequency.value = f;
    a.gain.setValueAtTime(0, t0 + s); a.gain.linearRampToValueAtTime(g * vol, t0 + s + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d); o.connect(a).connect(AC.destination); o.start(t0 + s); o.stop(t0 + s + d + 0.05); };
  switch (name) {
    case 'beep': tone(1046, 0, 0.09, 'triangle'); break;
    case 'scanner': tone(1568, 0, 0.12, 'square', 0.12); break;
    case 'low': tone(523, 0, 0.1, 'triangle'); break;
    case 'buzz': tone(220, 0, 0.18, 'sawtooth', 0.15); tone(180, 0.16, 0.25, 'sawtooth', 0.15); break;
    case 'chime': tone(880, 0, 0.1); tone(1318, 0.08, 0.18); break;
    case 'register': tone(2093, 0, 0.5, 'sine', 0.3); tone(2637, 0.06, 0.6, 'sine', 0.22); tone(3136, 0.12, 0.7, 'sine', 0.15);
      for (let k = 0; k < 5; k++) tone(4000 + Math.random() * 2000, 0.25 + k * 0.05, 0.05, 'square', 0.04); break;
    case 'ding': tone(1760, 0, 0.5, 'sine', 0.3); break;
    case 'pop': tone(600, 0, 0.06, 'sine', 0.35); tone(900, 0.03, 0.05, 'sine', 0.2); break;
    case 'bell': tone(1318, 0, 0.6, 'sine', 0.25); tone(1976, 0, 0.5, 'sine', 0.12); tone(1318, 0.25, 0.6, 'sine', 0.2); break;
    case 'click': tone(3000, 0, 0.02, 'square', 0.15); break;
    case 'coin': tone(1976, 0, 0.08, 'square', 0.12); tone(2637, 0.08, 0.3, 'square', 0.12); break;
    case 'soft': tone(660, 0, 0.25, 'sine', 0.18); break;
    case 'double': tone(1200, 0, 0.07, 'square', 0.12); tone(1200, 0.12, 0.07, 'square', 0.12); break;
    case 'success': tone(784, 0, 0.12); tone(988, 0.1, 0.12); tone(1318, 0.2, 0.25); break;
  }
}
sfx = function (kind, force) {
  if (!VIEWP.sound && !force) return;
  const ev = sndEv(kind); if (!ev.on && !force) return;
  const vol = (VIEWP.vol ?? 0.6) * (ev.vol ?? 1);
  try {
    if (ev.tone === 'custom' && sndFile(kind)) { const a = new Audio(sndFile(kind)); a.volume = Math.min(1, vol); a.play().catch(() => {}); return; }
    playTone(ev.tone === 'custom' ? 'beep' : ev.tone, vol);
  } catch (e) { /* audio not available */ }
};
say = function (text, force) {
  if ((!VIEWP.voice && !force) || !('speechSynthesis' in window)) return;
  const v = SND.voice, s = String(text);
  const kind = /^(ยอดชำระ|Total)/.test(s) ? 'total' : /^(เงินทอน|Change)/.test(s) ? 'change' : 'thanks';
  if (!force && v[kind] === false) return;
  if (kind === 'thanks' && /^(ขอบคุณค่ะ|Thank you)/.test(s) && v.thanksText) text = v.thanksText;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG === 'th' ? 'th-TH' : 'en-US'; u.rate = v.rate || 1; u.pitch = v.pitch || 1; u.volume = VIEWP.vol ?? 0.6;
    const vs = speechSynthesis.getVoices(); const vv = (v.name && vs.find(x => x.name === v.name)) || vs.find(x => x.lang.startsWith(LANG === 'th' ? 'th' : 'en')); if (vv) u.voice = vv;
    speechSynthesis.speak(u);
    if (kind === 'change' && v.thanks && v.thanksAfterChange) { const u2 = new SpeechSynthesisUtterance(v.thanksText || 'ขอบคุณค่ะ'); Object.assign(u2, { lang: u.lang, rate: u.rate, pitch: u.pitch, volume: u.volume, voice: u.voice }); speechSynthesis.speak(u2); }
  } catch (e) { /* no voice */ }
};
// extra events: hold bill, notifications bell
document.addEventListener('click', e => { if (e.target.closest('#holdBtn:not([disabled])')) sfx('hold'); }, true);
{ const _refreshBell47 = refreshBell; let lastN = null;
  refreshBell = async function () { await _refreshBell47(); const n = num($('#bellN')?.textContent); if (lastN !== null && n > lastN) sfx('notify'); lastN = n; }; }

function soundSettings() {
  const vs = ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter(v => /^(th|en)/.test(v.lang)) : [];
  const v = SND.voice;
  const m = modal('🔊 ตั้งค่าเสียงทั้งหมด', `
    <div class="snd-top"><label class="row"><input type="checkbox" id="sdon" ${VIEWP.sound ? 'checked' : ''}> <b>เปิดเสียงเอฟเฟกต์</b></label>
      <label class="row"><input type="checkbox" id="svon" ${VIEWP.voice ? 'checked' : ''}> <b>🗣️ เปิดเสียงพูด</b></label>
      <div class="snd-vol"><span>🔈</span><input type="range" id="sdvol" min="0" max="1" step="0.05" value="${VIEWP.vol ?? 0.6}"><span>🔊</span><b id="sdvv">${Math.round((VIEWP.vol ?? 0.6) * 100)}%</b></div></div>
    <h4 style="margin:14px 0 6px">เสียงแต่ละเหตุการณ์</h4>
    <div class="snd-list">${SND_EVENTS.map(([k, label]) => { const ev = sndEv(k); return `<div class="snd-row" data-ev="${k}">
      <label class="row snd-n"><input type="checkbox" data-on ${ev.on ? 'checked' : ''}> ${label}</label>
      <select class="in" data-tone>${Object.entries(SND_TONES).map(([t, n]) => `<option value="${t}" ${ev.tone === t ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <input type="range" data-vol min="0" max="1.5" step="0.1" value="${ev.vol ?? 1}" title="ความดังเฉพาะเสียงนี้">
      <label class="btn sm snd-up ${ev.tone === 'custom' ? '' : 'hidden'}" title="อัปโหลดไฟล์เสียง (mp3/wav/ogg ไม่เกิน 300KB)">📤<input type="file" accept="audio/*" data-file hidden></label>
      <button type="button" class="btn sm" data-play>▶</button></div>`; }).join('')}</div>
    <h4 style="margin:16px 0 6px">🗣️ เสียงพูด</h4>
    <div class="snd-voice">
      <label class="row"><input type="checkbox" id="sv_total" ${v.total ? 'checked' : ''}> พูดยอดชำระ</label>
      <label class="row"><input type="checkbox" id="sv_change" ${v.change ? 'checked' : ''}> พูดเงินทอน</label>
      <label class="row"><input type="checkbox" id="sv_thanks" ${v.thanks ? 'checked' : ''}> พูดขอบคุณ</label>
      <label class="row"><input type="checkbox" id="sv_tac" ${v.thanksAfterChange ? 'checked' : ''}> พูดขอบคุณต่อท้ายเงินทอน</label></div>
    <div class="grid2"><div class="fg"><label class="f">คำขอบคุณ</label><input class="in" id="sv_text" value="${esc(v.thanksText || '')}" placeholder="ขอบคุณค่ะ"></div>
      <div class="fg"><label class="f">เสียงผู้พูด</label><select class="in" id="sv_name"><option value="">อัตโนมัติ</option>${vs.map(x => `<option value="${esc(x.name)}" ${x.name === v.name ? 'selected' : ''}>${esc(x.name)} (${x.lang})</option>`).join('')}</select></div>
      <div class="fg"><label class="f">ความเร็วพูด: <b id="svrv">${v.rate}</b></label><input type="range" id="sv_rate" min="0.5" max="1.8" step="0.1" value="${v.rate}" style="width:100%"></div>
      <div class="fg"><label class="f">ระดับเสียง (สูง/ต่ำ): <b id="svpv">${v.pitch}</b></label><input type="range" id="sv_pitch" min="0.5" max="1.8" step="0.1" value="${v.pitch}" style="width:100%"></div></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="svt1">▶ ทดสอบยอดชำระ</button><button type="button" class="btn sm" id="svt2">▶ ทดสอบเงินทอน</button><button type="button" class="btn sm" id="svt3">▶ ทดสอบขอบคุณ</button></div>
    <p class="muted" style="font-size:12px">การตั้งค่าเสียงบันทึกไว้ในเครื่องนี้ (แต่ละเครื่อง/แคชเชียร์ตั้งต่างกันได้)</p>`,
    { foot: `<button type="button" class="btn" id="sdreset">ค่าเริ่มต้น</button><span style="flex:1"></span><button type="button" class="btn p" data-ok>เสร็จ</button>` });
  m.classList?.add('snd-modal');
  const upd = () => {
    VIEWP.sound = $('#sdon', m).checked; VIEWP.voice = $('#svon', m).checked; VIEWP.vol = +$('#sdvol', m).value;
    localStorage.setItem('pos_view', JSON.stringify(VIEWP)); $('#sdvv', m).textContent = Math.round(VIEWP.vol * 100) + '%';
    $$('.snd-row', m).forEach(r => { const k = r.dataset.ev, tone = $('[data-tone]', r).value;
      SND.events[k] = { on: $('[data-on]', r).checked, tone, vol: +$('[data-vol]', r).value }; $('.snd-up', r).classList.toggle('hidden', tone !== 'custom'); });
    Object.assign(SND.voice, { total: $('#sv_total', m).checked, change: $('#sv_change', m).checked, thanks: $('#sv_thanks', m).checked, thanksAfterChange: $('#sv_tac', m).checked,
      thanksText: $('#sv_text', m).value.trim(), name: $('#sv_name', m).value, rate: +$('#sv_rate', m).value, pitch: +$('#sv_pitch', m).value });
    $('#svrv', m).textContent = SND.voice.rate; $('#svpv', m).textContent = SND.voice.pitch; saveSnd();
  };
  $$('input:not([type=file]),select', m).forEach(el => el.oninput = el.onchange = upd);
  $$('.snd-row', m).forEach(r => {
    const k = r.dataset.ev;
    $('[data-play]', r).onclick = () => { upd(); sfx(k, true); };
    $('[data-tone]', r).addEventListener('change', () => { if ($('[data-tone]', r).value !== 'custom') sfx(k, true); else if (!sndFile(k)) $('[data-file]', r).click(); });
    $('[data-file]', r).onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 300000) return toast('ไฟล์เสียงต้องไม่เกิน 300KB (ตัดให้สั้น 1–3 วินาที)', 'bad');
      const rd = new FileReader(); rd.onload = () => {
        try { localStorage.setItem('pos_sound_file_' + k, rd.result); SND_FILES[k] = rd.result; upd(); sfx(k, true); toast('ใช้เสียงของคุณแล้ว', 'ok'); }
        catch { toast('พื้นที่เก็บเสียงเต็ม — ลบเสียงอื่นหรือใช้ไฟล์เล็กลง', 'bad'); } };
      rd.readAsDataURL(f);
    };
  });
  $('#svt1', m).onclick = () => { upd(); say('ยอดชำระ ' + bahtWords(125), true); };
  $('#svt2', m).onclick = () => { upd(); say('เงินทอน ' + bahtWords(75), true); };
  $('#svt3', m).onclick = () => { upd(); say('ขอบคุณค่ะ', true); };
  $('#sdreset', m).onclick = async () => {
    if (!(await confirmBox('คืนค่าเสียงทั้งหมดเป็นค่าเริ่มต้น?'))) return;
    SND = JSON.parse(JSON.stringify(SND_DEF)); SND_EVENTS.forEach(([k]) => { localStorage.removeItem('pos_sound_file_' + k); delete SND_FILES[k]; });
    saveSnd(); m.close(); soundSettings();
  };
  $('[data-ok]', m).onclick = m.close;
}
// voices load asynchronously in some browsers
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

/* the sell-screen display settings get a shortcut to the full sound settings */
const _viewSettings47 = viewSettings;
viewSettings = function () {
  _viewSettings47();
  const t = $('#vtest'); if (t && !$('#vsadv')) t.insertAdjacentHTML('afterend', '<button class="btn sm p" id="vsadv" type="button">🎚️ ตั้งค่าเสียงแบบละเอียด</button>');
  if ($('#vsadv')) $('#vsadv').onclick = () => { $$('.mbg').pop()?.querySelector('[data-ok]')?.click(); soundSettings(); };
};
/* ================= v4.8 — units manager, category manager, quick "buy X for ฿Y" promotion ================= */

const UNITS_DEF = [...UNITS];
const syncUnits = () => { const u = Array.isArray(S.shop?.units) && S.shop.units.length ? S.shop.units : UNITS_DEF; UNITS.splice(0, UNITS.length, ...u); };
const _renderShell48 = renderShell;
renderShell = function () { _renderShell48(); syncUnits(); };
const unitUse = u => S.products.filter(p => p.unit === u || arr(p.units).some(x => x.unit === u)).length;

/* ---------- units ---------- */
function unitManager(after) {
  syncUnits();
  const edit = canDo('edit_products');
  let rows = UNITS.map(u => ({ name: u, orig: u }));
  const m = modal('📏 หน่วยนับ', `
    <p class="muted" style="margin-top:0;font-size:13px">หน่วยที่ใช้เลือกในหน้าเพิ่ม/แก้ไขสินค้า และหน่วยขายแบบแพ็ก/ลัง — เปลี่ยนชื่อหน่วยแล้วสินค้าที่ใช้หน่วยนั้นจะเปลี่ยนตามอัตโนมัติ</p>
    ${edit ? `<div class="um-add"><input class="in" id="unew" placeholder="เพิ่มหน่วยใหม่ เช่น แพ็ก 6, ลัง, ถาด, หวี, กำ…"><button type="button" class="btn p" id="uadd">＋ เพิ่ม</button></div>
      <div class="pills um-sug" id="usug"></div>` : ''}
    <div class="um-list" id="ulist"></div>`,
    { foot: `${edit ? '<button type="button" class="btn" id="usort">ก-ฮ เรียงตามชื่อ</button><button type="button" class="btn" id="udef">ค่าเริ่มต้น</button>' : ''}<span style="flex:1"></span><button type="button" class="btn" data-c>ปิด</button>${edit ? '<button type="button" class="btn p" id="usave">💾 บันทึก</button>' : ''}` });
  const SUG = ['ชิ้น', 'อัน', 'ขวด', 'กระป๋อง', 'แพ็ก', 'กล่อง', 'ลัง', 'ถุง', 'ซอง', 'ห่อ', 'โหล', 'กิโลกรัม', 'ขีด', 'กรัม', 'ลิตร', 'มิลลิลิตร', 'แก้ว', 'จาน', 'ชาม', 'ถ้วย', 'ชุด', 'คู่', 'ม้วน', 'แผ่น', 'ถาด', 'หวี', 'ลูก', 'ผล', 'ตัว', 'ไม้', 'กำ', 'มัด', 'แท่ง', 'หลอด', 'เม็ด'];
  const draw = () => {
    $('#ulist', m).innerHTML = rows.map((r, i) => { const n = unitUse(r.orig || r.name); return `<div class="um-row" data-i="${i}">
      <span class="um-n">${i + 1}</span><input class="in" data-un value="${esc(r.name)}" ${edit ? '' : 'disabled'}>
      <small class="muted um-c">${n ? `${n} สินค้า` : 'ยังไม่ใช้'}</small>
      ${edit ? `<button type="button" class="btn sm" data-up ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn sm" data-dn ${i < rows.length - 1 ? '' : 'disabled'}>↓</button><button type="button" class="btn sm bad" data-del>✕</button>` : ''}</div>`; }).join('') || '<p class="muted">ยังไม่มีหน่วย</p>';
    if ($('#usug', m)) $('#usug', m).innerHTML = SUG.filter(s => !rows.some(r => r.name === s)).slice(0, 14).map(s => `<button type="button" data-sg="${esc(s)}">＋ ${esc(s)}</button>`).join('');
    $$('.um-row', m).forEach(el => { const i = +el.dataset.i;
      $('[data-un]', el).oninput = e => { rows[i].name = e.target.value; };
      if (!edit) return;
      $('[data-up]', el).onclick = () => { [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; draw(); };
      $('[data-dn]', el).onclick = () => { [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; draw(); };
      $('[data-del]', el).onclick = async () => { const n = unitUse(rows[i].orig || rows[i].name);
        if (n && !(await confirmBox(`หน่วย “${rows[i].name}” ใช้อยู่ ${n} สินค้า — ลบออกจากรายการ? (สินค้าเดิมยังใช้หน่วยนี้ได้)`))) return;
        rows.splice(i, 1); draw(); };
    });
    $$('[data-sg]', m).forEach(b => b.onclick = () => { rows.push({ name: b.dataset.sg }); draw(); });
  };
  const add = () => { const v = $('#unew', m).value.trim(); if (!v) return; if (rows.some(r => r.name === v)) return toast('มีหน่วยนี้แล้ว', 'bad'); rows.push({ name: v }); $('#unew', m).value = ''; draw(); $('#unew', m).focus(); };
  if (edit) {
    $('#uadd', m).onclick = add; $('#unew', m).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    $('#usort', m).onclick = () => { rows.sort((a, b) => a.name.localeCompare(b.name, 'th')); draw(); };
    $('#udef', m).onclick = () => { rows = UNITS_DEF.map(u => ({ name: u, orig: rows.find(r => r.orig === u)?.orig })); draw(); };
    $('#usave', m).onclick = async () => {
      const list = rows.map(r => r.name.trim()).filter(Boolean);
      if (new Set(list).size !== list.length) return toast('มีชื่อหน่วยซ้ำกัน', 'bad');
      try {
        for (const r of rows) {
          const nn = r.name.trim(); if (!r.orig || !nn || r.orig === nn) continue;
          const hit = S.products.filter(p => p.unit === r.orig);
          if (hit.length) { await q(sb.from('products').update({ unit: nn }).eq('shop_id', S.shop.id).eq('unit', r.orig)); hit.forEach(p => p.unit = nn); }
          for (const p of S.products.filter(p => arr(p.units).some(x => x.unit === r.orig))) {
            const units = p.units.map(x => x.unit === r.orig ? { ...x, unit: nn } : x);
            await q(sb.from('products').update({ units }).eq('id', p.id)); p.units = units;
          }
        }
        Object.assign(S.shop, await q(sb.from('shops').update({ units: list }).eq('id', S.shop.id).select().single()));
        syncUnits(); logAct('settings', 'shop', 'หน่วยนับ', { units: list }); toast('บันทึกหน่วยนับแล้ว', 'ok'); m.close(); after?.();
      } catch (e) { fail(e); }
    };
  }
  $('[data-c]', m).onclick = () => { m.close(); };
  draw();
}

/* ---------- categories ---------- */
const CAT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#78716c', '#64748b'];
const CAT_ICONS = ['🥩', '🐷', '🍗', '🐟', '🦐', '🥚', '🥬', '🍎', '🍌', '🍉', '🍚', '🍜', '🍞', '🧀', '🥫', '🧂', '🌶️', '🥤', '🧃', '🍺', '☕', '🧊', '🍬', '🍪', '🍦', '🧴', '🧻', '🧼', '🚬', '💊', '🔋', '🛒', '📦', '⭐'];
categoryManager = function (after) {
  const edit = canDo('edit_products');
  let newIcon = '', newColor = CAT_COLORS[S.categories.length % CAT_COLORS.length];
  const m = modal('🗂️ หมวดหมู่สินค้า', `
    ${edit ? `<div class="cm-add"><button type="button" class="cm-ic" id="cnic" title="เลือกไอคอน">＋</button><input class="in" id="cnn" placeholder="ชื่อหมวดใหม่ เช่น หมูสด, เครื่องดื่ม, ผักผลไม้…"><input type="color" id="cnc" value="${newColor}" title="สี"><button type="button" class="btn p" id="cna">＋ เพิ่ม</button></div>` : ''}
    <div class="cm-list" id="cml"></div>`, { wide: true, foot: `${edit ? '<button type="button" class="btn" id="cmsort">ก-ฮ เรียงตามชื่อ</button>' : ''}<span style="flex:1"></span><button type="button" class="btn p" data-c>เสร็จ</button>` });
  const cnt = id => S.products.filter(p => p.category_id === id).length;
  const save = async (c, o) => { try { Object.assign(c, await q(sb.from('categories').update(o).eq('id', c.id).select().single())); } catch (e) { fail(e); } };
  const iconPick = (anchor, cb) => {
    $('.cm-pop')?.remove();
    const r = anchor.getBoundingClientRect();
    m.insertAdjacentHTML('beforeend', `<div class="cm-pop" style="top:${r.bottom + 4}px;left:${Math.max(8, Math.min(r.left, innerWidth - 290))}px">${CAT_ICONS.map(i => `<button type="button" data-ic="${i}">${i}</button>`).join('')}<button type="button" data-ic="" title="ไม่ใช้ไอคอน">✕</button>
      <input class="in" placeholder="หรือพิมพ์อีโมจิ" maxlength="4"></div>`);
    const pop = $('.cm-pop', m);
    $$('[data-ic]', pop).forEach(b => b.onclick = () => { cb(b.dataset.ic); pop.remove(); });
    $('input', pop).onchange = e => { cb(e.target.value.trim()); pop.remove(); };
    setTimeout(() => document.addEventListener('click', function off(ev) { if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', off, true); } }, true), 0);
  };
  const draw = () => {
    const list = [...S.categories].sort((a, b) => num(a.sort) - num(b.sort) || a.name.localeCompare(b.name, 'th'));
    $('#cml', m).innerHTML = list.map((c, i) => `<div class="cm-row" data-id="${c.id}" style="--cc:${esc(c.color || '#6366f1')}">
      <button type="button" class="cm-ic" data-ic2 ${edit ? '' : 'disabled'}>${esc(c.icon || '') || '<span style="opacity:.4">＋</span>'}</button>
      <input class="in" data-nm value="${esc(c.name)}" ${edit ? '' : 'disabled'}>
      <input type="color" data-cl value="${esc(c.color || '#6366f1')}" ${edit ? '' : 'disabled'}>
      <button type="button" class="btn sm cm-cnt" data-see title="ดูสินค้าในหมวด">${cnt(c.id)} สินค้า</button>
      ${edit ? `<button type="button" class="btn sm" data-up ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn sm" data-dn ${i < list.length - 1 ? '' : 'disabled'}>↓</button><button type="button" class="btn sm bad" data-del>✕</button>` : ''}</div>`).join('')
      || '<div class="brempty">ยังไม่มีหมวดหมู่ — เพิ่มด้านบนได้เลย</div>';
    $$('.cm-row', m).forEach(el => {
      const c = S.categories.find(x => x.id === el.dataset.id), i = list.indexOf(c);
      $('[data-see]', el).onclick = () => { m.close(); go('products'); setTimeout(() => { const s = $('#pc'); if (s) { s.value = c.id; s.dispatchEvent(new Event('change')); s.dispatchEvent(new Event('input')); } }, 400); };
      if (!edit) return;
      $('[data-nm]', el).onchange = e => { const v = e.target.value.trim(); if (!v) return draw(); if (S.categories.some(x => x !== c && x.name === v)) { toast('มีชื่อหมวดนี้แล้ว', 'bad'); return draw(); } save(c, { name: v }); };
      $('[data-cl]', el).onchange = e => { el.style.setProperty('--cc', e.target.value); save(c, { color: e.target.value }); };
      $('[data-ic2]', el).onclick = ev => { ev.stopPropagation(); iconPick(ev.currentTarget, async v => { await save(c, { icon: v || null }); draw(); }); };
      const move = async d => { const o = list[i + d]; if (!o) return; list.splice(i, 1); list.splice(i + d, 0, c);
        await Promise.all(list.map((x, k) => num(x.sort) === k ? null : save(x, { sort: k }))); draw(); };
      $('[data-up]', el).onclick = () => move(-1); $('[data-dn]', el).onclick = () => move(1);
      $('[data-del]', el).onclick = async () => {
        const n = cnt(c.id);
        if (!(await confirmBox(n ? `ลบหมวด “${c.name}”? สินค้า ${n} รายการจะเป็น “ไม่มีหมวด”` : `ลบหมวด “${c.name}”?`))) return;
        try { if (n) await q(sb.from('products').update({ category_id: null }).eq('shop_id', S.shop.id).eq('category_id', c.id));
          await q(sb.from('categories').delete().eq('id', c.id));
          S.products.forEach(p => { if (p.category_id === c.id) p.category_id = null; }); S.categories = S.categories.filter(x => x !== c); draw(); toast('ลบแล้ว', 'ok'); } catch (e) { fail(e); }
      };
    });
  };
  if (edit) {
    $('#cnic', m).onclick = ev => { ev.stopPropagation(); iconPick(ev.currentTarget, v => { newIcon = v; $('#cnic', m).textContent = v || '＋'; }); };
    const add = async () => {
      const name = $('#cnn', m).value.trim(); if (!name) return $('#cnn', m).focus();
      if (S.categories.some(x => x.name === name)) return toast('มีชื่อหมวดนี้แล้ว', 'bad');
      try { S.categories.push(await q(sb.from('categories').insert({ shop_id: S.shop.id, name, color: $('#cnc', m).value, icon: newIcon || null, sort: S.categories.length }).select().single()));
        $('#cnn', m).value = ''; newIcon = ''; $('#cnic', m).textContent = '＋'; $('#cnc', m).value = CAT_COLORS[S.categories.length % CAT_COLORS.length]; draw(); toast('เพิ่มหมวดแล้ว', 'ok'); } catch (e) { fail(e); }
    };
    $('#cna', m).onclick = add; $('#cnn', m).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    $('#cmsort', m).onclick = async () => { const l = [...S.categories].sort((a, b) => a.name.localeCompare(b.name, 'th')); await Promise.all(l.map((x, k) => save(x, { sort: k }))); draw(); };
  }
  const oc = m.close; m.close = () => { oc(); after?.(); }; $('.x', m).onclick = m.close; $('[data-c]', m).onclick = m.close;
  draw();
};

/* product form: manage buttons refresh the selects in place */
const _productForm48 = productForm;
productForm = function (p, after) {
  _productForm48(p, after);
  const m = $$('.mbg').pop(); if (!m) return;
  const cs = $('[name=category_id]', m), us = $('[name=unit]', m);
  $('#pcatm', m)?.addEventListener('click', () => categoryManager(() => {
    const v = cs.value; cs.innerHTML = `<option value="">—</option>` + [...S.categories].sort((a, b) => num(a.sort) - num(b.sort)).map(c => `<option value="${c.id}">${esc((c.icon ? c.icon + ' ' : '') + c.name)}</option>`).join(''); cs.value = v; }));
  $('#punitm', m)?.addEventListener('click', () => unitManager(() => {
    const v = us.value; us.innerHTML = [...new Set([v, ...UNITS])].filter(Boolean).map(u => `<option>${esc(u)}</option>`).join(''); us.value = UNITS.includes(v) ? v : v; }));
};

/* products page: units button + quick promo on each card */
const _products48 = VIEWS.products;
VIEWS.products = pg => {
  _products48(pg);
  const cb = $('#catBtn'); if (cb) { cb.innerHTML = '🗂️ หมวดหมู่'; cb.onclick = () => categoryManager(() => go('products')); }
  if (cb && !$('#unitBtn')) cb.insertAdjacentHTML('afterend', '<button class="btn" id="unitBtn">📏 หน่วยนับ</button>');
  if ($('#unitBtn')) $('#unitBtn').onclick = () => unitManager(() => go('products'));
  if (!canDo('promotions')) return;
  const g = $('#pmg', pg); if (!g) return;
  const deco = () => $$('.pm .pm-acts', g).forEach(a => { if (!$('[data-act=promo]', a)) a.insertAdjacentHTML('afterbegin', '<button data-act="promo" title="ตั้งโปร ซื้อ X ราคา ฿">🏷️</button>'); });
  new MutationObserver(deco).observe(g, { childList: true }); deco();
  g.addEventListener('click', e => { const b = e.target.closest('[data-act=promo]'); if (!b) return; e.stopPropagation(); e.preventDefault();
    const p = S.products.find(x => x.id === b.closest('.pm').dataset.id); if (p) quickPromo(p, () => go('products')); }, true);
};

/* open the promotion form preset to "buy 3 for ฿…" for one product */
function quickPromo(p, after) {
  promoForm(null, after);
  const m = $$('.mbg').pop(); if (!m) return;
  const f = $('#pf', m); f.scope.value = 'product'; f.scope.dispatchEvent(new Event('change'));
  const ps = $('#ps', m); ps.value = p.barcode || p.name; ps.dispatchEvent(new Event('input'));
  const cbx = $(`[data-pid="${p.id}"]`, m); if (cbx && !cbx.checked) { cbx.checked = true; cbx.dispatchEvent(new Event('change')); }
  f.dataset.pre = p.name + ' '; f.name.value = '';
  $('[data-tp=b3]', m)?.click();
  f.value.value = Math.max(1, Math.floor(num(p.price) * 3 * 0.9)); f.value.dispatchEvent(new Event('input', { bubbles: true })); f.value.select();
}

/* settings: shortcuts */
const _settings48 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings48(pg);
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:16px"><h3 style="margin-top:0">🗂️ หมวดหมู่ · 📏 หน่วยนับ · 🏷️ โปรโมชั่น</h3>
    <p class="muted" style="font-size:13px;margin-top:0">หมวดหมู่ ${S.categories.length} หมวด · หน่วยนับ ${UNITS.length} หน่วย · โปรโมชั่น ${S.promotions.length} รายการ</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="s_cat">🗂️ จัดการหมวดหมู่</button><button type="button" class="btn" id="s_unit">📏 จัดการหน่วยนับ</button><button type="button" class="btn" id="s_pro">🏷️ สร้างโปร “ซื้อ X ราคา ฿”</button></div></div>`);
  $('#s_cat').onclick = () => categoryManager();
  $('#s_unit').onclick = () => unitManager();
  $('#s_pro').onclick = () => { go('promotions'); setTimeout(() => { promoForm(null, () => go('promotions')); setTimeout(() => $$('.mbg').pop()?.querySelector('[data-tp=b3]')?.click(), 50); }, 300); };
};
/* ================= v4.9 — per-product promotion / unit / category setup inside the product form,
   animated & highlighted cashier menu (promo tiles, deal progress, upsell hints, "โปรวันนี้" tab) ================= */

const prodPromos = p => p?.id ? S.promotions.filter(pr => (pr.scope || 'bill') !== 'bill' && promoHits(pr, p)) : [];
const unitPrice = p => num(p.promo_price) > 0 ? num(p.promo_price) : num(p.price);
const dealText = pr => pr.kind === 'bundle' ? `${num(pr.buy_qty) || 2} ชิ้น ฿${money(pr.value).replace(/\.00$/, '')}` : promoLabel(pr);

/* ---------- product form: units chips, category chips, promotions of this product ---------- */
const _productForm49 = productForm;
productForm = function (p = {}, after) {
  const before = new Set(S.products.map(x => x.id));
  const pending = []; // promos to create after a new product is saved
  let formEl = null;
  const after2 = async (...a) => {
    const prod = p?.id ? S.products.find(x => x.id === p.id) : S.products.find(x => !before.has(x.id));
    if (prod && pending.length) {
      try { for (const t of pending) { const r = await q(sb.from('promotions').insert({ ...promoRow(t, prod), shop_id: S.shop.id }).select().single()); S.promotions.push(r); }
        toast(`ตั้งโปรโมชั่น ${pending.length} รายการให้ ${prod.name} แล้ว`, 'ok'); } catch (e) { fail(e); }
    }
    return after?.(...a);
  };
  _productForm49(p, after2);
  const m = $$('.mbg').pop(); if (!m) return;
  formEl = $('form', m) || m;
  const prod = p?.id ? S.products.find(x => x.id === p.id) || p : null;

  // unit chips
  const us = $('[name=unit]', m);
  if (us && !$('.pf-chips.u', m)) {
    us.closest('.fg, label, div')?.insertAdjacentHTML('beforeend', '<div class="pf-chips u"></div>');
    const drawU = () => { const box = $('.pf-chips.u', m); if (!box) return;
      box.innerHTML = UNITS.slice(0, 10).map(u => `<button type="button" data-u="${esc(u)}" class="${us.value === u ? 'on' : ''}">${esc(u)}</button>`).join('');
      $$('[data-u]', box).forEach(b => b.onclick = () => { if (![...us.options].some(o => o.value === b.dataset.u)) us.insertAdjacentHTML('beforeend', `<option>${esc(b.dataset.u)}</option>`); us.value = b.dataset.u; us.dispatchEvent(new Event('change')); drawU(); preview(); }); };
    us.addEventListener('change', drawU); drawU();
    $('#punitm', m)?.addEventListener('click', () => setTimeout(() => { const mm = $$('.mbg').pop(); const o = mm?.close; if (o) mm.close = () => { o(); drawU(); }; }, 0));
  }
  // category chips
  const cs = $('[name=category_id]', m);
  if (cs && !$('.pf-chips.c', m)) {
    cs.closest('.fg, label, div')?.insertAdjacentHTML('beforeend', '<div class="pf-chips c"></div>');
    const drawC = () => { const box = $('.pf-chips.c', m); if (!box) return;
      box.innerHTML = [...S.categories].sort((a, b) => num(a.sort) - num(b.sort)).map(c => `<button type="button" data-c="${c.id}" class="${cs.value === c.id ? 'on' : ''}" style="--cc:${esc(c.color || '#6366f1')}">${c.icon ? esc(c.icon) + ' ' : '<i></i>'}${esc(c.name)}</button>`).join('')
        + '<button type="button" data-c="+" class="add">＋ หมวดใหม่</button>';
      $$('[data-c]', box).forEach(b => b.onclick = () => {
        if (b.dataset.c === '+') return $('#pcatm', m)?.click();
        cs.value = cs.value === b.dataset.c ? '' : b.dataset.c; cs.dispatchEvent(new Event('change')); drawC(); }); };
    cs.addEventListener('change', drawC); drawC();
    new MutationObserver(drawC).observe(cs, { childList: true });
  }

  // promotions section
  if (!canDo('promotions')) return;
  formEl.insertAdjacentHTML('beforeend', `<div class="pf-promo full" id="pfpro">
    <div class="pf-ph"><b>🏷️ โปรโมชั่นของสินค้านี้</b><small class="muted">ตั้งได้หลายขั้น เช่น 3 ชิ้น 100 · 6 ชิ้น 190 — แคชเชียร์คิดให้อัตโนมัติ</small></div>
    <div id="pfexist"></div>
    <div class="pf-new">
      <div class="seg" id="pfk"><button type="button" data-k="bundle" class="on">🛒 ซื้อ X ราคา ฿</button><button type="button" data-k="bxgy">🎁 ซื้อ X แถม Y</button><button type="button" data-k="percent">％ ลด %</button><button type="button" data-k="fixed_price">🏷️ ราคาพิเศษ/ชิ้น</button></div>
      <div class="pf-row">
        <label class="pf-buy">ซื้อ <input class="in" type="number" min="1" step="1" id="pfb" value="3"> ชิ้น</label>
        <label class="pf-get">แถม <input class="in" type="number" min="1" step="1" id="pfg" value="1"> ชิ้น</label>
        <label class="pf-val"><span id="pfvl">ราคา</span> <input class="in" type="number" min="0" step="any" id="pfv" value=""> <span id="pfvu">บาท</span></label>
        <button type="button" class="btn p" id="pfadd">＋ เพิ่มโปร</button></div>
      <div class="pf-more"><label><input type="checkbox" id="pftime"> จำกัดวัน/เวลา</label><span id="pftw" class="hidden"><input class="in" type="date" id="pfs"> ถึง <input class="in" type="date" id="pfe"> <input class="in" type="time" id="pft1"> – <input class="in" type="time" id="pft2"></span></div>
      <div class="pf-prev" id="pfprev"></div></div>
    <div id="pfpend"></div></div>`);
  let kind = 'bundle';
  const priceNow = () => { const pr = num($('[name=promo_price]', m)?.value) || num($('[name=price]', m)?.value) || unitPrice(prod || {}); return pr; };
  const cur = () => ({ kind, buy_qty: num($('#pfb', m).value) || 1, get_qty: num($('#pfg', m).value) || 1, value: num($('#pfv', m).value),
    starts_on: $('#pftime', m).checked ? $('#pfs', m).value || null : null, ends_on: $('#pftime', m).checked ? $('#pfe', m).value || null : null,
    time_from: $('#pftime', m).checked ? $('#pft1', m).value : '', time_to: $('#pftime', m).checked ? $('#pft2', m).value : '' });
  const nameOf = t => { const n = $('[name=name]', m)?.value.trim() || prod?.name || 'สินค้า';
    return `${n} ${t.kind === 'bundle' ? `ซื้อ ${t.buy_qty} ชิ้น ${money(t.value).replace(/\.00$/, '')}` : t.kind === 'bxgy' ? `ซื้อ ${t.buy_qty} แถม ${t.get_qty}` : t.kind === 'percent' ? `ลด ${t.value}%` : `ราคาพิเศษ ${money(t.value)}`}`; };
  function preview() {
    const t = cur(), pr = priceNow(), el = $('#pfprev', m); if (!el) return;
    $('.pf-buy', m).style.display = ['bundle', 'bxgy'].includes(kind) ? '' : 'none';
    $('.pf-get', m).style.display = kind === 'bxgy' ? '' : 'none';
    $('.pf-val', m).style.display = kind === 'bxgy' ? 'none' : '';
    $('#pfvl', m).textContent = kind === 'bundle' ? 'ราคารวม' : kind === 'percent' ? 'ลด' : 'ราคาพิเศษ';
    $('#pfvu', m).textContent = kind === 'percent' ? '%' : kind === 'bundle' ? 'บาท' : 'บาท/ชิ้น';
    if (!pr) { el.innerHTML = '<span class="muted">ใส่ราคาขายก่อนเพื่อดูตัวอย่าง</span>'; return; }
    const qn = kind === 'bundle' ? t.buy_qty : kind === 'bxgy' ? t.buy_qty + t.get_qty : 1;
    const d = promoLineDisc(t, qn, pr), full = qn * pr;
    el.innerHTML = d > 0 ? `ตัวอย่าง: ${qn} ${esc(us?.value || 'ชิ้น')} ปกติ <s>฿${money(full)}</s> → <b>฿${money(full - d)}</b> <span class="pf-save">ประหยัด ฿${money(d)} (${Math.round(d / full * 100)}%)</span>${kind === 'bundle' ? ` · เฉลี่ย ฿${money((full - d) / qn)}/ชิ้น` : ''}`
      : '<span class="pf-warn">⚠️ ราคาโปรนี้ไม่ได้ถูกกว่าราคาปกติ</span>';
  }
  const drawExist = () => {
    const box = $('#pfexist', m), list = prod ? prodPromos(prod) : [];
    box.innerHTML = list.map(pr => `<div class="pf-it ${pr.active ? '' : 'off'}" data-pid="${pr.id}"><span class="pf-badge">${esc(dealText(pr))}</span><span class="pf-n">${esc(pr.name)}<small>${pr.scope === 'category' ? 'ทั้งหมวด' : arr(pr.product_ids).length > 1 ? `ร่วมกับสินค้าอื่น ${arr(pr.product_ids).length - 1} รายการ${pr.mix ? ' (คละได้)' : ''}` : 'เฉพาะสินค้านี้'}${promoLive(pr) ? ' · <b class="ok">ใช้งานอยู่</b>' : pr.active ? ' · รอช่วงเวลา' : ' · ปิดอยู่'}</small></span>
      <label class="sw" title="เปิด/ปิด"><input type="checkbox" data-on ${pr.active ? 'checked' : ''}><i></i></label><button type="button" class="btn sm" data-ed>แก้ไข</button><button type="button" class="btn sm bad" data-rm title="ลบ">✕</button></div>`).join('');
    $$('.pf-it', box).forEach(row => { const pr = S.promotions.find(x => x.id === row.dataset.pid);
      $('[data-on]', row).onchange = async e => { try { Object.assign(pr, await q(sb.from('promotions').update({ active: e.target.checked }).eq('id', pr.id).select().single())); drawExist(); } catch (er) { fail(er); } };
      $('[data-ed]', row).onclick = () => promoForm(pr, drawExist);
      $('[data-rm]', row).onclick = async () => {
        const solo = pr.scope === 'product' && arr(pr.product_ids).length <= 1;
        if (!(await confirmBox(solo ? `ลบโปร “${pr.name}”?` : pr.scope === 'category' ? `โปรนี้ใช้กับทั้งหมวด — ลบโปร “${pr.name}” ทั้งหมด?` : `เอาสินค้านี้ออกจากโปร “${pr.name}”?`))) return;
        try { if (solo || pr.scope === 'category') { await q(sb.from('promotions').delete().eq('id', pr.id)); S.promotions = S.promotions.filter(x => x !== pr); }
          else Object.assign(pr, await q(sb.from('promotions').update({ product_ids: arr(pr.product_ids).filter(i => i !== prod.id) }).eq('id', pr.id).select().single()));
          drawExist(); toast('ลบแล้ว', 'ok'); } catch (er) { fail(er); } };
    });
  };
  const drawPend = () => { $('#pfpend', m).innerHTML = pending.map((t, i) => `<div class="pf-it pend"><span class="pf-badge">${esc(dealText(t))}</span><span class="pf-n">${esc(t.name)}<small>จะบันทึกพร้อมสินค้า</small></span><button type="button" class="btn sm bad" data-px="${i}">✕</button></div>`).join('');
    $$('[data-px]', m).forEach(b => b.onclick = () => { pending.splice(+b.dataset.px, 1); drawPend(); }); };
  $$('#pfk [data-k]', m).forEach(b => b.onclick = () => { kind = b.dataset.k; $$('#pfk [data-k]', m).forEach(x => x.classList.toggle('on', x === b));
    if (kind === 'bundle') { $('#pfb', m).value = 3; $('#pfv', m).value = Math.floor(priceNow() * 3 * 0.9) || ''; } if (kind === 'bxgy') { $('#pfb', m).value = 2; $('#pfg', m).value = 1; }
    if (kind === 'percent') $('#pfv', m).value = 10; if (kind === 'fixed_price') $('#pfv', m).value = Math.floor(priceNow() * 0.9) || ''; preview(); });
  $('#pftime', m).onchange = e => $('#pftw', m).classList.toggle('hidden', !e.target.checked);
  ['#pfb', '#pfg', '#pfv'].forEach(s => $(s, m).oninput = preview);
  ['[name=price]', '[name=promo_price]', '[name=name]'].forEach(s => $(s, m)?.addEventListener('input', preview));
  $('#pfadd', m).onclick = async () => {
    const t = cur();
    if (kind === 'bundle' && (t.buy_qty < 2 || t.value <= 0)) return toast('ใส่จำนวน (2 ขึ้นไป) และราคารวม เช่น 3 ชิ้น 100 บาท', 'bad');
    if (kind === 'percent' && (t.value <= 0 || t.value > 100)) return toast('ส่วนลด % ต้อง 1–100', 'bad');
    if (kind === 'fixed_price' && t.value <= 0) return toast('ใส่ราคาพิเศษต่อชิ้น', 'bad');
    t.name = nameOf(t);
    if (prod?.id) {
      try { const r = await q(sb.from('promotions').insert({ ...promoRow(t, prod), shop_id: S.shop.id }).select().single()); S.promotions.push(r); drawExist(); sfx('ok'); toast('เพิ่มโปรแล้ว ✓', 'ok');
        $('#pfprev', m).classList.remove('flash'); void $('#pfprev', m).offsetWidth; $('#pfprev', m).classList.add('flash'); } catch (e) { fail(e); }
    } else { pending.push(t); drawPend(); sfx('add'); }
  };
  $('#pfpro', m).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#pfadd', m).click(); } });
  if (!$('#pfv', m).value) $('#pfv', m).value = Math.floor(priceNow() * 3 * 0.9) || '';
  drawExist(); preview();
};
function promoRow(t, prod) {
  return { name: t.name, scope: 'product', kind: t.kind, value: num(t.value), buy_qty: num(t.buy_qty) || 1, get_qty: num(t.get_qty) || 1, mix: false, min_total: 0,
    product_ids: [prod.id], category_ids: [], days: [], time_from: t.time_from || '', time_to: t.time_to || '', starts_on: t.starts_on || null, ends_on: t.ends_on || null,
    members_only: false, auto: false, active: true, note: 'ตั้งจากหน้าสินค้า' };
}

/* ---------- cashier menu: highlighted, animated tiles ---------- */
const bestTop = () => { const ids = Object.entries(BEST || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]); return new Set(ids); };
const _productCard49 = productCard;
productCard = function (p) {
  let h = _productCard49(p).replace(/<i class="promo-rb">[\s\S]*?<\/i>/, '');
  const prs = itemPromosFor(p), pr = prs[0];
  const cls = [];
  let badges = '';
  if (pr) {
    cls.push('deal');
    badges += `<i class="deal-rb"><span>🔥 ${esc(dealText(pr))}</span>${prs.length > 1 ? `<em>+${prs.length - 1}</em>` : ''}</i>`;
  } else if (num(p.promo_price) > 0 && num(p.price) > num(p.promo_price)) {
    cls.push('deal');
    badges += `<i class="deal-rb off"><span>ลด ${Math.round((1 - p.promo_price / p.price) * 100)}%</span></i>`;
  }
  if (bestTop().has(p.id)) { cls.push('hot'); badges += '<i class="hot-b">🔥 ขายดี</i>'; }
  if (p.created_at && Date.now() - new Date(p.created_at) < 7 * 864e5) badges += '<i class="new-b">ใหม่</i>';
  const bp = prs.find(x => x.kind === 'bundle' || x.kind === 'bxgy');
  if (bp) badges += `<i class="deal-prog" data-dp="${p.id}"></i>`;
  h = h.replace('<button class="more"', badges + '<button class="more"');
  return cls.length ? h.replace('class="pcard', `class="pcard ${cls.join(' ')}`) : h;
};

/* live tile state after every cart change: in-cart count bounce + deal progress (e.g. 2/3) */
function dealNeed(pr, qtyIn) {
  const X = pr.kind === 'bxgy' ? (num(pr.buy_qty) || 1) + (num(pr.get_qty) || 1) : (num(pr.buy_qty) || 2);
  const r = qtyIn % X; return { X, have: r, need: r ? X - r : 0, sets: Math.floor(qtyIn / X) };
}
function mixQty(pr) { return S.cart.filter(l => !l.noPromo && promoHits(pr, S.products.find(x => x.id === l.product_id))).reduce((a, l) => a + Math.floor(num(l.qty)), 0); }
function refreshTiles() {
  const g = $('#pgrid'); if (!g) return;
  $$('.pcard', g).forEach(c => {
    const id = c.dataset.id, p = S.products.find(x => x.id === id); if (!p) return;
    const qn = S.cart.filter(l => l.product_id === id).reduce((a, l) => a + num(l.qty) * (num(l.factor) || 1), 0);
    const img = $('.img', c); let ic = $('.incart', c);
    if (qn) { if (!ic) { img?.insertAdjacentHTML('beforeend', '<i class="incart"></i>'); ic = $('.incart', c); }
      if (ic.textContent !== qtyf(qn)) { ic.textContent = qtyf(qn); ic.classList.remove('bump2'); void ic.offsetWidth; ic.classList.add('bump2'); } }
    else ic?.remove();
    c.classList.toggle('picked', !!qn);
    const dp = $('.deal-prog', c); if (!dp) return;
    const pr = itemPromosFor(p).find(x => x.kind === 'bundle' || x.kind === 'bxgy'); if (!pr) { dp.innerHTML = ''; return; }
    const tot = pr.mix ? mixQty(pr) : Math.floor(qn), d = dealNeed(pr, tot);
    dp.classList.toggle('show', tot > 0);
    dp.classList.toggle('done', tot > 0 && !d.need);
    dp.innerHTML = tot > 0 ? (d.need ? `<b style="--p:${d.have / d.X}">${d.have}/${d.X}</b><span>อีก ${d.need} ได้โปร!</span>` : `<b style="--p:1">✓</b><span>ได้โปรแล้ว ${d.sets} ชุด</span>`) : '';
  });
}

/* cart: upsell hint per line ("add 1 more to get 3 for ฿100") + celebrate when a deal kicks in */
const _pdSeen = new WeakMap();
const _drawCart49 = drawCart;
drawCart = function () {
  _drawCart49();
  const el = $('#cart'); if (!el) return refreshTiles();
  $$('.citem', el).forEach(row => {
    const i = +($('[data-i]', row)?.dataset.i ?? -1), l = S.cart[i]; if (!l) return;
    const p = S.products.find(x => x.id === l.product_id); if (!p || l.noPromo) return;
    const pr = itemPromosFor(p).find(x => x.kind === 'bundle' || x.kind === 'bxgy');
    if (pr) {
      const tot = pr.mix ? mixQty(pr) : Math.floor(num(l.qty)), d = dealNeed(pr, tot);
      if (d.need && d.need <= Math.max(2, d.X - 1)) {
        $('.nm', row).insertAdjacentHTML('beforeend', `<button type="button" class="upsell" data-ups="${i}" data-n="${d.need}">🔥 ＋${d.need} ${pr.kind === 'bxgy' ? 'รับของแถม' : `ได้ ${dealText(pr)}`}</button>`);
      }
    }
    const prev = _pdSeen.get(l) || 0;
    if (num(l._pd) > prev + 0.001) { row.classList.add('dealhit'); if (prev === 0) sfx('ok'); setTimeout(() => row.classList.remove('dealhit'), 1200); }
    _pdSeen.set(l, num(l._pd));
  });
  $$('[data-ups]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const l = S.cart[+b.dataset.ups]; if (!l) return;
    const pr = itemPromosFor(S.products.find(x => x.id === l.product_id))?.find(x => x.kind === 'bundle' || x.kind === 'bxgy');
    if (pr?.mix) { addToCart(S.products.find(x => x.id === l.product_id), +b.dataset.n); } else { l.qty = num(l.qty) + (+b.dataset.n); sfx('add'); drawCart(); } });
  refreshTiles();
};

/* "โปรวันนี้" tab on the sell screen */
const _filtered49 = filtered;
filtered = function () {
  if (S.cat !== 'promo') return _filtered49();
  S.cat = 'all'; try { return _filtered49().filter(p => itemPromosFor(p).length || num(p.promo_price) > 0); } finally { S.cat = 'promo'; }
};
const promoCount = () => S.products.filter(p => p.active && (itemPromosFor(p).length || num(p.promo_price) > 0)).length;
let _pcT = 0, _pcN = 0;
new MutationObserver(() => {
  const cats = $('#cats'); if (!cats || $('[data-c=promo]', cats)) return;
  if (Date.now() - _pcT > 3000) { _pcT = Date.now(); _pcN = promoCount(); }
  const n = _pcN; if (!n) return;
  const all = $('[data-c=all]', cats);
  (all || cats.firstChild)?.insertAdjacentHTML(all ? 'afterend' : 'beforebegin', `<button class="tab promo-tab ${S.cat === 'promo' ? 'on' : ''}" data-c="promo">🔥 โปรวันนี้ <small>${n}</small></button>`);
  $('[data-c=promo]', cats).onclick = () => { S.cat = 'promo'; $$('#cats .tab').forEach(t => t.classList.toggle('on', t.dataset.c === 'promo')); drawGrid(); };
}).observe(document.body, { childList: true, subtree: true });

/* grid re-render also refreshes the live tile state */
const _drawGrid49 = drawGrid;
drawGrid = function () { _drawGrid49(); refreshTiles(); };
const _moreTiles49 = moreTiles;
moreTiles = function (g) { _moreTiles49(g); refreshTiles(); };

/* "+1" float on tap */
document.addEventListener('click', e => {
  const c = e.target.closest('#pgrid .pcard'); if (!c || e.target.closest('.more') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = c.getBoundingClientRect(), f = document.createElement('div'); f.className = 'plus1'; f.textContent = '+1';
  f.style.left = (e.clientX || r.left + r.width / 2) + 'px'; f.style.top = (e.clientY || r.top + 30) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 700);
}, true);
/* ================= v5.0 — reliable voice, products + stock in one page, new look (navy sidebar, KPI cards, dock) ================= */

/* ---------- voice: native TTS in the Android app, browser voices, online Thai voice as a fallback ---------- */
if (localStorage.getItem('pos_voice_v5') !== '1') { localStorage.setItem('pos_voice_v5', '1'); if (VIEWP.voice === false) { VIEWP.voice = true; localStorage.setItem('pos_view', JSON.stringify(VIEWP)); } }
let VOICES = [];
const loadVoices = () => new Promise(res => {
  if (!('speechSynthesis' in window)) return res([]);
  const v = speechSynthesis.getVoices(); if (v.length) return res(VOICES = v);
  let done = false; const fin = () => { if (done) return; done = true; res(VOICES = speechSynthesis.getVoices()); };
  speechSynthesis.addEventListener?.('voiceschanged', fin, { once: true }); setTimeout(fin, 1200);
});
loadVoices();
let TTS_AUDIO = null;
async function speakText(text, { rate = 1, pitch = 1, volume = 0.8, name = '' } = {}) {
  const th = LANG === 'th', lang = th ? 'th-TH' : 'en-US';
  // 1) Android app: native text-to-speech (works offline, Thai supported by Google TTS)
  const N = window.Capacitor?.Plugins?.TextToSpeech;
  if (N && isNativeApp()) {
    try { await N.stop().catch(() => {}); await N.speak({ text, lang, rate, pitch, volume, category: 'playback' }); return 'native'; } catch (e) { /* fall through */ }
  }
  // 2) browser voice
  if ('speechSynthesis' in window) {
    const vs = VOICES.length ? VOICES : await loadVoices();
    const v = (name && vs.find(x => x.name === name)) || vs.find(x => x.lang?.replace('_', '-').toLowerCase().startsWith(th ? 'th' : 'en'));
    if (v || !th) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = volume; if (v) u.voice = v;
        await new Promise(r => setTimeout(r, 60)); // Chrome drops speak() right after cancel()
        speechSynthesis.resume(); speechSynthesis.speak(u);
        return 'browser';
      } catch (e) { /* fall through */ }
    }
  }
  // 3) no Thai voice on this device → online voice
  try {
    TTS_AUDIO?.pause();
    TTS_AUDIO = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${th ? 'th' : 'en'}&q=${encodeURIComponent(text.slice(0, 190))}`);
    TTS_AUDIO.volume = Math.min(1, volume); TTS_AUDIO.playbackRate = Math.max(0.5, Math.min(2, rate));
    await TTS_AUDIO.play(); return 'online';
  } catch (e) { return 'none'; }
}
say = function (text, force) {
  if (!VIEWP.voice && !force) return;
  const v = SND.voice, s = String(text);
  const kind = /^(ยอดชำระ|Total)/.test(s) ? 'total' : /^(เงินทอน|Change)/.test(s) ? 'change' : 'thanks';
  if (!force && v[kind] === false) return;
  if (kind === 'thanks' && /^(ขอบคุณค่ะ|Thank you)/.test(s) && v.thanksText) text = v.thanksText;
  if (kind === 'change' && v.thanks && v.thanksAfterChange) text += ' ' + (v.thanksText || 'ขอบคุณค่ะ');
  return speakText(text, { rate: v.rate || 1, pitch: v.pitch || 1, volume: VIEWP.vol ?? 0.8, name: v.name });
};
// unlock audio/speech on the first tap (iOS/Android browsers need a user gesture)
document.addEventListener('pointerdown', function unlock() {
  document.removeEventListener('pointerdown', unlock, true);
  try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch {}
  try { AC ||= new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch {}
}, true);
// show which voice engine is used in the sound settings
const _soundSettings5 = soundSettings;
soundSettings = function () {
  _soundSettings5();
  const m = $$('.mbg').pop(); if (!m) return;
  const box = $('#svt1', m)?.parentElement; if (!box) return;
  const th = VOICES.some(v => v.lang?.toLowerCase().startsWith('th'));
  box.insertAdjacentHTML('afterend', `<p class="vstat">${isNativeApp() && window.Capacitor?.Plugins?.TextToSpeech ? '✅ ใช้เสียงพูดของแอป Android (ไม่ต้องใช้อินเทอร์เน็ต)' : th ? '✅ เครื่องนี้มีเสียงพูดภาษาไทย' : '🌐 เครื่องนี้ไม่มีเสียงไทยในตัว — ใช้เสียงไทยออนไลน์แทน (ต้องต่ออินเทอร์เน็ต)'}</p>`);
  $$('#svt1,#svt2,#svt3', m).forEach(b => b.addEventListener('click', () => { if (!$('#svon', m).checked) { $('#svon', m).checked = true; $('#svon', m).dispatchEvent(new Event('change')); } }));
};

/* ---------- products + stock in one page ---------- */
{ const pp = PAGES.find(p => p.id === 'products'); if (pp) { pp.name = 'สินค้า & สต็อก'; } }
const _vProducts5 = VIEWS.products, _vStock5 = VIEWS.stock;
const pgOK = id => { const p = PAGES.find(x => x.id === id); return !!p && pageOK(p); };
function psShell(pg, tab) {
  const canP = pgOK('products'), canS = pgOK('stock');
  if (tab === 'products' && !canP) tab = 'stock'; if (tab === 'stock' && !canS) tab = 'products';
  localStorage.setItem('pos_pstab', tab);
  const ttl = $('#ttl'); if (ttl) ttl.textContent = 'สินค้า & สต็อก';
  $$('[data-p="products"]').forEach(b => b.classList.add('on')); $$('[data-p="stock"]').forEach(b => b.classList.remove('on'));
  const act = S.products.filter(p => p.active !== false), low = act.filter(p => p.track_stock && p.stock > 0 && p.stock <= p.low_stock).length, out = act.filter(p => p.track_stock && p.stock <= 0).length;
  pg.innerHTML = `<div class="ps-tabs">${canP ? `<button data-pt="products" class="${tab === 'products' ? 'on' : ''}">🛍️ <span>สินค้า</span><em>${act.length}</em></button>` : ''}
      ${canS ? `<button data-pt="stock" class="${tab === 'stock' ? 'on' : ''}">📦 <span>สต็อก</span>${low + out ? `<em class="w">⚠️ ${low + out}</em>` : '<em>✓</em>'}</button>` : ''}
      <span class="ps-sum">${out ? `<b class="bad">หมด ${out}</b>` : ''}${low ? `<b class="warn">ใกล้หมด ${low}</b>` : ''}<b>ติดตามสต็อก ${act.filter(p => p.track_stock).length}</b></span></div><div id="psub"></div>`;
  $$('[data-pt]', pg).forEach(b => b.onclick = () => { if (b.dataset.pt !== tab) go(b.dataset.pt); });
  const sub = $('#psub', pg);
  return (tab === 'stock' ? _vStock5 : _vProducts5)(sub);
}
VIEWS.products = pg => psShell(pg, 'products');
VIEWS.stock = pg => psShell(pg, 'stock');

/* ---------- new look: sidebar, top bar ---------- */
const SVG5 = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3h2.6l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6"/></svg>',
  bill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
const thDate = d => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
const thTime = d => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
const _renderShell5 = renderShell;
renderShell = function () {
  _renderShell5();
  document.documentElement.classList.add('v5');
  if (!S.shop) return;
  const side = $('.side'), navs = $('.side .navs');
  if (side && navs && !$('.sb-head', side)) {
    navs.insertAdjacentHTML('beforebegin', `<div class="sb-head"><div class="sb-brand"><img src="${esc(S.shop.logo_url || 'logo-round.png')}" alt=""><b>Yanisa Shop<span>POS</span></b></div>
      <button type="button" class="sb-branch" data-brsw><i>${ICON.store}</i><span><b>${esc(S.shop.name)}</b><small>${esc(S.shop.branch_name || branchLine(S.shop))}</small></span><em>▾</em></button></div>`);
    $('.sb-branch', side).onclick = e => { e.stopPropagation(); branchSwitcher(); };
    const me = $('.me', side);
    if (me) {
      me.insertAdjacentHTML('beforebegin', `<div class="sb-card"><span>👑</span><div><b>Yanisa Shop v${esc(APP_VERSION)}</b><small>อัปเดตอัตโนมัติ · ใช้งานได้ทุกฟีเจอร์</small></div></div>`);
      const av = $('.av', me); if (av) { av.classList.add('logo'); av.innerHTML = `<img src="${esc(S.shop.logo_url || 'logo-round.png')}" alt="">`; }
      me.insertAdjacentHTML('beforeend', `<button type="button" class="sb-out" title="ออกจากระบบ">${SVG5.out}</button>`);
      $('.sb-out', me).onclick = async () => { if (await confirmBox('ออกจากระบบ?')) logout(); };
    }
  }
  // hide the separate stock entry (it lives inside "สินค้า & สต็อก" now) when both are allowed
  if (pgOK('products') && pgOK('stock')) $$('[data-p="stock"]').forEach(b => b.remove());
  // search box: barcode button
  const gs = $('.gsearch'); if (gs && !$('.gs-scan', gs)) {
    gs.insertAdjacentHTML('beforeend', `<button type="button" class="gs-scan" title="สแกนบาร์โค้ดด้วยกล้อง">${SVG5.scan}</button>`);
    $('.gs-scan', gs).onclick = () => { if (S.page !== 'pos') go('pos'); setTimeout(() => $('#scanBtn')?.click(), S.page === 'pos' ? 0 : 400); };
    const gq = $('#gq'); if (gq) gq.placeholder = 'ค้นหาสินค้า ชื่อสินค้า, รหัสสินค้า หรือบาร์โค้ด…';
  }
  // date / time chip
  const bell = $('#bell'); if (bell && !$('#dtchip')) {
    bell.insertAdjacentHTML('beforebegin', `<div class="dtchip" id="dtchip"><i>${SVG5.cal}</i><span><b></b><small></small></span></div>`);
    const tick = () => { const c = $('#dtchip'); if (!c) return; const d = new Date(); $('b', c).textContent = thDate(d); $('small', c).textContent = thTime(d); };
    tick(); clearInterval(window._dtT); window._dtT = setInterval(tick, 15000);
  }
};
const _go5 = go;
go = function (page) { _go5(page); if (S.page === 'stock') { $$('[data-p="products"]').forEach(b => b.classList.add('on')); } };

/* ---------- KPI cards with trend + sparkline ---------- */
let KPI = null;
const _loadPosStats5 = loadPosStats;
loadPosStats = async function () {
  await _loadPosStats5();
  try {
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const y0 = new Date(t0 - 864e5);
    const rows = await q(sb.from('sales').select('total,cost_total,created_at').eq('shop_id', S.shop.id).eq('status', 'paid').gte('created_at', y0.toISOString()).limit(5000));
    const now = new Date(), cut = new Date(now - 864e5);
    const today = rows.filter(r => new Date(r.created_at) >= t0), yday = rows.filter(r => { const d = new Date(r.created_at); return d < t0 && d <= cut; });
    const hours = Array.from({ length: Math.max(2, now.getHours() + 1) }, () => ({ s: 0, n: 0, p: 0 }));
    today.forEach(r => { const h = hours[new Date(r.created_at).getHours()]; if (h) { h.s += num(r.total); h.n++; h.p += num(r.total) - num(r.cost_total); } });
    const cum = k => { let a = 0; return hours.map(h => (a += h[k])); };
    const sum = (a, f) => a.reduce((x, r) => x + f(r), 0);
    KPI = { sales: cum('s'), bills: cum('n'), profit: cum('p'),
      y: { s: sum(yday, r => num(r.total)), n: yday.length, p: sum(yday, r => num(r.total) - num(r.cost_total)) } };
  } catch { KPI = null; }
  drawStats();
};
const spark = (arr, kind) => {
  if (!arr || arr.length < 2) arr = [0, 0];
  const mx = Math.max(...arr, 1), w = 90, h = 34, st = w / (arr.length - 1);
  if (kind === 'bars') return `<svg class="spk" viewBox="0 0 ${w} ${h}">${arr.slice(-6).map((v, i, a) => `<rect x="${i * (w / a.length) + 3}" y="${h - Math.max(3, v / mx * h)}" width="${w / a.length - 6}" height="${Math.max(3, v / mx * h)}" rx="2"/>`).join('')}</svg>`;
  const pts = arr.map((v, i) => `${(i * st).toFixed(1)},${(h - 2 - v / mx * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg class="spk" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="0,${h} ${pts} ${w},${h}" class="ar"/><polyline points="${pts}"/></svg>`;
};
const trendTag = (now, prev) => { if (!prev) return now ? '<em class="up">▲ ใหม่วันนี้</em>' : '<em>เทียบเมื่อวาน</em>'; const p = (now - prev) / prev * 100; return `<em class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(1)}%</em>`; };
drawStats = function () {
  const el = $('#posStats'); if (!el || !TODAY) return;
  const act = S.products.filter(p => p.active !== false && p.track_stock);
  const units = act.reduce((a, p) => a + Math.max(0, num(p.stock)), 0), low = act.filter(p => p.stock <= p.low_stock).length;
  const prof = can('owner', 'manager');
  const cards = [
    ['blue', SVG5.cart, 'ยอดขายวันนี้', baht(TODAY.total), trendTag(TODAY.total, KPI?.y.s), spark(KPI?.sales)],
    ['green', SVG5.bill, 'จำนวนบิล', qtyf(TODAY.bills), trendTag(TODAY.bills, KPI?.y.n), spark(KPI?.bills, 'bars')],
    prof ? ['purple', SVG5.trend, 'กำไรขั้นต้น', baht(TODAY.profit), trendTag(TODAY.profit, KPI?.y.p), spark(KPI?.profit, 'bars')]
      : ['purple', SVG5.trend, 'ยอดของฉัน', baht(TODAY.mine), `<em>${qtyf(TODAY.mineBills)} บิล</em>`, spark(KPI?.sales)],
    ['orange', SVG5.box, 'สินค้าคงเหลือ', qtyf(units), `<em class="${low ? 'dn' : 'up'}">${low ? `⚠️ ใกล้หมด ${low} รายการ` : `${act.length} รายการ`}</em>`, '<span class="kbox">📦</span>'],
  ];
  el.innerHTML = cards.map(([c, ic, k, v, tr, sp], i) => `<div class="kpi ${c}" style="--i:${i}" ${i === 3 ? 'data-go="products"' : i === 0 ? 'data-ds' : ''}><i class="kic">${ic}</i><div class="kb"><small>${k}</small><b>${v}</b>${tr}</div>${sp}</div>`).join('');
  $('[data-go]', el)?.addEventListener('click', () => go('stock'));
  $('[data-ds]', el)?.addEventListener('click', () => dailySummary());
};

/* ---------- product tiles: stock pill on the picture, red price, "+ เพิ่ม" ---------- */
const _productCard5 = productCard;
productCard = function (p) {
  let h = _productCard5(p);
  const st = p.track_stock ? (p.stock <= 0 ? ['bad', 'หมด'] : p.stock <= p.low_stock ? ['warn', 'เหลือ ' + qtyf(p.stock)] : ['ok', 'เหลือ ' + qtyf(p.stock)]) : null;
  if (st) h = h.replace('<button class="more"', `<i class="stkp ${st[0]}">${st[1]}</i><button class="more"`);
  return h.replace(/<button class="qadd"([^>]*)>([\s\S]*?)<\/button>/, `<button class="qadd"$1>＋ <span>เพิ่ม</span></button>`);
};

/* ---------- cart: blue header, thumbnails, remove ✕, pay button ---------- */
const _drawCart5 = drawCart;
drawCart = function () {
  _drawCart5();
  const el = $('#cart'); if (!el) return;
  const hd = $('.hd', el), n = S.cart.length;
  if (hd) {
    hd.classList.add('ch');
    const t = $(':scope > b', hd); if (t) t.outerHTML = `<b class="ch-t">${SVG5.cart}<span>ตะกร้าสินค้า</span>${n ? `<i class="ch-n">${n}</i>` : ''}</b>`;
    const clr = $('#clrBtn', hd); if (clr) { clr.innerHTML = SVG5.trash; clr.title = 'ล้างตะกร้า'; }
    const hb = $('#holdBtn', hd); if (hb) { hb.textContent = '⏸'; hb.title = 'พักบิล (F8)'; }
  }
  $$('.citem', el).forEach(row => {
    const i = +($('[data-i]', row)?.dataset.i ?? -1), l = S.cart[i]; if (!l) return;
    const p = S.products.find(x => x.id === l.product_id);
    const bg = p?.tile_color || catColor(p?.category_id);
    row.insertAdjacentHTML('afterbegin', `<div class="cthumb" style="${p && isImg(p) ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(bg || '#e0e7ff')}`}">${p && isImg(p) ? '' : esc([...(l.name || '?')].slice(0, 1).join(''))}</div>`);
    row.insertAdjacentHTML('beforeend', `<button type="button" class="cx" data-cx="${i}" title="ลบรายการ">✕</button>`);
  });
  $$('[data-cx]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.cx; const row = b.closest('.citem'); row?.classList.add('gone'); sfx('remove');
    setTimeout(() => { S.cart.splice(i, 1); drawCart(); }, 180); });
  const sum = $$('.ft .tline', el).find(x => x.textContent.trim().startsWith('ยอดรวม'));
  if (sum) $('span', sum).textContent = `รวมสินค้า ${qtyf(S.cart.reduce((a, l) => a + num(l.qty), 0))} ชิ้น (${n} รายการ)`;
  const big = $('.ft .tline.big span', el); if (big) big.textContent = 'ยอดรวมทั้งหมด';
  const pb = $('#payBtn', el); if (pb && !$('.arr', pb)) pb.insertAdjacentHTML('beforeend', `<i class="arr">${SVG5.arrow}</i>`);
};

/* ---------- sell screen: quick-action dock ---------- */
const _posView5 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView5(pg);
  const cb = $('#cashbar', pg); if (!cb || $('[data-c="scan"]', cb)) return;
  cb.classList.add('dock');
  cb.insertAdjacentHTML('afterbegin', `<button data-c="scan" class="pri"><span>${SVG5.scan}</span><div>สแกนบาร์โค้ด<small>(F2)</small></div></button>
    <button data-c="best"><span>⭐</span>สินค้าขายดี</button><button data-c="recent"><span>🕘</span>สินค้าล่าสุด</button><button data-c="promo"><span>🏷️</span>โปรโมชั่น</button>
    <button data-c="cust"><span>👤</span>ลูกค้า</button><button data-c="print"><span>🖨️</span>พิมพ์ใบเสร็จ</button>`);
  $('[data-c="last"]', cb)?.remove();
  const cat = c => { S.cat = c; $$('#cats .tab').forEach(t => t.classList.toggle('on', t.dataset.c === c)); drawGrid(); };
  const acts = { scan: () => { const i = $('#psearch') || $('#gq'); if (matchMedia('(hover:none)').matches) $('#scanBtn')?.click(); else i?.focus(); },
    best: () => cat('best'), recent: () => cat('recent'), promo: () => cat('promo'), cust: () => $('#memBtn')?.click(), print: () => $('#lastBtn')?.click() };
  $$('[data-c]', cb).forEach(b => { if (acts[b.dataset.c]) b.onclick = acts[b.dataset.c]; });
};
/* ================= v5.0.1 — tidy sell screen (view popover, overflow menu, fewer duplicate buttons),
   tablet-friendly layout, branded loading screen ================= */

/* ---------- loading screen ---------- */
document.documentElement.classList.add('v5');
function hideBoot() { const b = document.getElementById('boot'); if (!b || b.classList.contains('out')) return; b.classList.add('out'); setTimeout(() => b.remove(), 450); }
function bootMsg(t) { const m = document.querySelector('#boot .bt-msg'); if (m) m.textContent = t; }
const _renderAuth501 = renderAuth;
renderAuth = function () { _renderAuth501(); hideBoot(); };
const _boot501 = boot;
boot = async function (...a) { bootMsg('กำลังโหลดข้อมูลร้าน…'); try { return await _boot501(...a); } finally { setTimeout(hideBoot, 150); } };
setTimeout(hideBoot, 9000);

/* ---------- sell screen: one tidy control row ---------- */
const _posView501 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView501(pg);
  const left = $('.pos .left', pg), cats = $('#cats', pg); if (!left || !cats) return;
  // category row + compact controls on the right
  if (!$('.catrow', left)) {
    const row = document.createElement('div'); row.className = 'catrow';
    cats.before(row); row.appendChild(cats);
    row.insertAdjacentHTML('beforeend', `<div class="pv-ctl"><button type="button" class="pv-btn" id="pvBtn" title="มุมมอง: เรียง · ขนาดรูป · รูปแบบ">⚙️<span>มุมมอง</span></button></div>`);
    $('#pvBtn', row).onclick = e => { e.stopPropagation(); viewPop(); };
  }
  // the old toolbar keeps only the search box (phones) — sort / size / layout move into the view popover
  const tb = $('.toolbar', left);
  if (tb) {
    tb.classList.add('tb-slim');
    const keep = document.createElement('div'); keep.id = 'pvStore'; keep.hidden = true; left.appendChild(keep);
    ['#psort', '#viewBtn', '#zctl', '#zpre'].forEach(s => { const el = $(s, left); if (el) keep.appendChild(el); });
  }
  // dock: only actions that are not already on screen
  const cb = $('#cashbar', left);
  if (cb) { ['best', 'recent', 'promo', 'cust'].forEach(k => $(`[data-c="${k}"]`, cb)?.remove());
    const ord = ['scan', 'quick', 'held', 'pu', 'ds', 'print']; ord.forEach(k => { const b = $(`[data-c="${k}"]`, cb); if (b) cb.appendChild(b); }); }
  // top-right actions → one ⋯ menu (shift status stays visible)
  const ta = $('#tact');
  if (ta && !$('#moreAct', ta)) {
    ['#lastBtn', '#dispBtn', '#fsBtn', '#dsBtn'].forEach(s => $(s, ta)?.classList.add('in-menu'));
    ta.insertAdjacentHTML('beforeend', '<button class="btn sm" id="moreAct" title="เมนูเพิ่มเติม">⋯</button>');
    $('#moreAct', ta).onclick = e => { e.stopPropagation(); actMenu(e.currentTarget); };
  }
};
function popAt(anchor, html, cls = '') {
  $('.pop5')?.remove();
  const r = anchor.getBoundingClientRect();
  document.body.insertAdjacentHTML('beforeend', `<div class="pop5 ${cls}">${html}</div>`);
  const p = $('.pop5'), w = p.offsetWidth;
  p.style.top = Math.min(r.bottom + 8, innerHeight - p.offsetHeight - 8) + 'px';
  p.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
  setTimeout(() => document.addEventListener('pointerdown', function off(ev) { if (!p.contains(ev.target)) { p.remove(); document.removeEventListener('pointerdown', off, true); } }, true), 0);
  return p;
}
function viewPop() {
  const store = $('#pvStore'); if (!store) return;
  const p = popAt($('#pvBtn'), `<div class="pv-h">มุมมองรายการสินค้า</div>
    <label class="pv-l">เรียงลำดับ</label><div class="pv-slot" data-s="psort"></div>
    <label class="pv-l">ขนาดรูปสินค้า</label><div class="pv-slot" data-s="zctl"></div><div class="pv-slot" data-s="zpre"></div>
    <button type="button" class="btn pv-more">🎨 ปรับหน้าจอเพิ่มเติม (รูปแบบ สี เสียง)</button>`, 'pv-pop');
  ['psort', 'zctl', 'zpre'].forEach(id => { const el = $('#' + id, store); if (el) $(`[data-s="${id}"]`, p).appendChild(el); });
  const back = () => ['psort', 'zctl', 'zpre'].forEach(id => { const el = $('#' + id, p); if (el) store.appendChild(el); });
  new MutationObserver((_, o) => { if (!document.body.contains(p)) { back(); o.disconnect(); } }).observe(document.body, { childList: true });
  $('.pv-more', p).onclick = () => { back(); p.remove(); viewSettings(); };
}
function actMenu(anchor) {
  const items = [['lastBtn', '🧾', 'พิมพ์บิลล่าสุด'], ['dsBtn', '📊', 'สรุปยอดวันนี้'], ['dispBtn', '🖥️', 'เปิดจอลูกค้า'], ['fsBtn', '⛶', 'เต็มจอ / ออกจากเต็มจอ']].filter(([id]) => $('#' + id));
  const p = popAt(anchor, `${items.map(([id, ic, t]) => `<button type="button" data-mi="${id}"><span>${ic}</span>${t}</button>`).join('')}
    <button type="button" data-mx="snd"><span>🔊</span>ตั้งค่าเสียง</button><button type="button" data-mx="view"><span>🎨</span>ปรับหน้าจอขาย</button><button type="button" data-mx="cmd"><span>⌘</span>ค้นหาคำสั่ง (Ctrl+K)</button>`, 'act-pop');
  $$('[data-mi]', p).forEach(b => b.onclick = () => { p.remove(); $('#' + b.dataset.mi)?.click(); });
  $$('[data-mx]', p).forEach(b => b.onclick = () => { p.remove(); ({ snd: soundSettings, view: viewSettings, cmd: commandPalette })[b.dataset.mx](); });
}

/* ---------- auto icon-rail sidebar on tablets ---------- */
const railMQ = matchMedia('(min-width:861px) and (max-width:1366px)');
const applyRail = () => { const a = $('#app'); if (!a) return; if (railMQ.matches) a.classList.toggle('mini', localStorage.getItem('pos_side') !== 'full'); else a.classList.toggle('mini', localStorage.getItem('pos_side') === 'mini'); };
railMQ.addEventListener?.('change', applyRail); applyRail();
const _renderShell501 = renderShell;
renderShell = function () {
  _renderShell501(); applyRail(); hideBoot();
  const mb = $('#miniBtn'); if (mb) mb.onclick = () => {
    if (railMQ.matches) { localStorage.setItem('pos_side', $('#app').classList.contains('mini') ? 'full' : ''); applyRail(); return; }
    $('#app').classList.toggle('mini'); localStorage.setItem('pos_side', $('#app').classList.contains('mini') ? 'mini' : '');
  };
  if (isNativeApp()) { try { window.Capacitor.Plugins.StatusBar?.setBackgroundColor({ color: '#eef4ff' }); window.Capacitor.Plugins.StatusBar?.setStyle({ style: 'LIGHT' }); } catch {} }
};

/* cart header: proper pause icon for "hold" */
const _drawCart501 = drawCart;
drawCart = function () { _drawCart501(); const hb = $('#cart #holdBtn'); if (hb) hb.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>'; };
/* ================= v5.0.2 — phone sizing pass + ignore stale-page DOM errors ================= */
fail = function (e) {
  const msg = e?.message || String(e);
  // a page that was still loading when the user navigated away tries to write into removed elements — harmless
  if (/of null \(|is null|reading 'innerHTML'|setting 'innerHTML'/.test(msg)) { console.warn('stale view update ignored:', msg); return; }
  console.error(e); toast(msg, 'bad');
};
/* ================= v5.0.3 — product stock card shows the product's own barcode ================= */
const _stockQuick503 = stockQuick;
stockQuick = async function (p, after) {
  const run = _stockQuick503(p, after);
  const m = $$('.mbg').pop(); const head = m && $('.sq-head', m);
  if (head) {
    const ed = canDo('edit_products');
    head.insertAdjacentHTML('afterend', p.barcode
      ? `<div class="sq-bc"><div class="bcimg" id="sqbc">กำลังสร้างบาร์โค้ด…</div><div class="bcacts"><button type="button" class="btn sm" data-bc="copy">📋 คัดลอกรหัส</button><button type="button" class="btn sm" data-bc="label">🏷️ พิมพ์ฉลาก</button>${ed ? '<button type="button" class="btn sm" data-bc="change">✏️ เปลี่ยนบาร์โค้ด</button>' : ''}</div></div>`
      : `<div class="sq-bc none"><b>สินค้านี้ยังไม่มีบาร์โค้ด</b>${ed ? '<div class="bcacts"><button type="button" class="btn sm p" data-bc="gen">✨ สร้างบาร์โค้ดของร้านให้อัตโนมัติ</button><button type="button" class="btn sm" data-bc="scan">📷 สแกนบาร์โค้ดจากสินค้า</button></div>' : ''}</div>`);
    if (p.barcode) barcodeSVG(p.barcode, { h: 70, w: 2.2, text: true }).then(svg => { const el = $('#sqbc', m); if (el) el.innerHTML = svg; }).catch(() => { const el = $('#sqbc', m); if (el) el.innerHTML = `<code style="font-size:22px">${esc(p.barcode)}</code>`; });
    const save = async code => {
      if (S.products.some(x => x.id !== p.id && x.barcode === code)) return toast('บาร์โค้ดนี้ใช้กับสินค้าอื่นแล้ว', 'bad');
      try { Object.assign(p, await q(sb.from('products').update({ barcode: code }).eq('id', p.id).select().single())); toast('บันทึกบาร์โค้ดแล้ว', 'ok'); m.close(); after?.(); stockQuick(p, after); } catch (e) { fail(e); }
    };
    $$('[data-bc]', m).forEach(b => b.onclick = async () => {
      const k = b.dataset.bc;
      if (k === 'copy') { try { await navigator.clipboard.writeText(p.barcode); toast('คัดลอกแล้ว: ' + p.barcode, 'ok'); } catch { toast(p.barcode); } }
      if (k === 'label') { m.close(); printLabels([p]); }
      if (k === 'gen') save(nextBarcodes(1)[0]);
      if (k === 'scan') scanBarcode(code => save(String(code).trim()));
      if (k === 'change') { const v = prompt('บาร์โค้ดใหม่ (เว้นว่างเพื่อยกเลิก)', p.barcode || ''); if (v && v.trim() && v.trim() !== p.barcode) save(v.trim()); }
    });
  }
  return run;
};
/* light theme is the default look (dark only when chosen with the theme button) */
if (localStorage.getItem('pos_theme_v5') !== '1') { localStorage.setItem('pos_theme_v5', '1'); setTheme('light'); }
/* ================= start ================= */
updateNet();
boot().then(() => { updateNet(); syncQueue(); }).catch(e => { fail(e); renderAuth(); });
