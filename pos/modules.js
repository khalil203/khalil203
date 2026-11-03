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
const shopMethods = () => ['cash', 'promptpay'];   // checkout offers only: เงินสด / สแกนจ่าย
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
      <button class="btn sm" id="splitBtn">🔀 เงินสด + สแกน</button>
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
  $('#splitBtn', m).onclick = () => { split = !split; if (split && lines.length === 1) { lines[0].amount = c.total; } if (!split) lines = [{ ...lines[0], amount: c.total }]; $('#splitBtn', m).textContent = split ? '↩ ชำระช่องทางเดียว' : '🔀 เงินสด + สแกน'; draw(); };
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
    <button class="btn" id="rcsv">⬇ CSV</button><button class="btn" id="rxl">📗 Excel</button><button class="btn" id="rpr">🖨️ พิมพ์ / PDF</button></div><div id="rb"></div>`;
  $$('#rk button').forEach(b => b.onclick = () => { rep = b.dataset.k; $$('#rk button').forEach(x => x.classList.toggle('on', x === b)); run(); });
  let sortK = null, sortD = -1;
  const show = () => {
    if (!cur) return; const v = $('#rq').value.toLowerCase();
    let rows = cur.rows.filter(r => !v || JSON.stringify(r).toLowerCase().includes(v));
    if (sortK) rows = [...rows].sort((a, b) => (typeof a[sortK] === 'number' ? a[sortK] - b[sortK] : String(a[sortK]).localeCompare(String(b[sortK]), 'th')) * sortD);
    const tot = {}; cur.cols.forEach(([k, , t]) => { if (t === 'm' || t === 'n') tot[k] = rows.reduce((a, r) => a + num(r[k]), 0); });
    const fmt = (t, v) => t === 'm' ? money(v) : t === 'n' ? qtyf(v) : t === 'p' ? num(v).toFixed(1) + '%' : t === 'd' ? (v ? dOnly(v) : '') : t === 'dt' ? (v ? dt(v) : '') : esc(v ?? '');
    const page = rows.slice(0, 500);
    $('#rb').innerHTML = `${cur.summary ? `<div class="stats">${cur.summary.map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>` : ''}
      ${cur.note ? `<p class="muted" style="font-size:13px">${cur.note}</p>` : ''}
      <div class="tblwrap" id="rtbl"><table class="tbl"><tr>${cur.cols.map(([k, l, t]) => `<th class="${['m', 'n', 'p'].includes(t) ? 'right' : ''}" data-s="${k}" style="cursor:pointer">${l}${sortK === k ? (sortD > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>
      ${page.map(r => `<tr>${cur.cols.map(([k, , t]) => `<td class="${['m', 'n', 'p'].includes(t) ? 'right' : ''}">${fmt(t, r[k])}</td>`).join('')}</tr>`).join('')}
      ${Object.keys(tot).length ? `<tr>${cur.cols.map(([k, , t], i) => `<td class="${['m', 'n'].includes(t) ? 'right' : ''} b">${i === 0 ? 'รวม' : k in tot ? fmt(t, tot[k]) : ''}</td>`).join('')}</tr>` : ''}</table></div>
      <p class="muted">${rows.length} รายการ${rows.length > 500 ? ' (แสดง 500 แรก — ส่งออกเพื่อดูทั้งหมด)' : ''}</p>`;
    $$('[data-s]', $('#rb')).forEach(th => th.onclick = () => { sortD = sortK === th.dataset.s ? -sortD : -1; sortK = th.dataset.s; show(); });
    cur._rows = rows;
  };
  const run = async () => { $('#rb').innerHTML = '<div class="skel"><i></i><i></i></div>'; try { sortK = null; cur = await REPORT_FN[rep](A, B); show(); } catch (e) { fail(e); $('#rb').innerHTML = ''; } };
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
            navigator.clipboard?.writeText(`Shop POS\n${location.href.split('#')[0]}\nชื่อผู้ใช้: ${username}\nรหัสผ่าน: ${password}`); toast('คัดลอกแล้ว', 'ok'); };
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
    { k: 'category_id', label: 'หมวดหมู่', type: 'select', opts: [['', '—'], ...S.categories.map(c => [c.id, c.name])] },
    { k: 'supplier_id', label: 'ผู้จำหน่ายหลัก', type: 'select', opts: [['', '—'], ...S.suppliers.map(s => [s.id, s.name])] },
    { k: 'unit', label: 'หน่วยนับหลัก', type: 'select', opts: [...new Set([p.unit || 'ชิ้น', ...UNITS])].map(u => [u, u]) },
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
  ], isNew ? { track_stock: true, active: true, unit: 'ชิ้น' } : p, async o => {
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
    const tiles = [['cash', ICON.cash, 'เงินสด'], ['promptpay', ICON.qr, 'สแกนจ่าย']];
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
const APP_VERSION = '4.0.0';
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
const PKIND = { percent: 'ลด %', amount: 'ลดบาท / ชิ้น', fixed_price: 'ราคาพิเศษ / ชิ้น', bxgy: 'ซื้อ X แถม Y', bundle: 'ราคาชุด (X ชิ้น = ฿)' };
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
  : pr.kind === 'bxgy' ? `ซื้อ ${num(pr.buy_qty) || 1} แถม ${num(pr.get_qty) || 1}` : pr.kind === 'bundle' ? `${num(pr.buy_qty) || 2} ชิ้น ฿${money(pr.value)}` : '';
function itemPromosFor(prod) { return S.promotions.filter(p => (p.scope || 'bill') !== 'bill' && promoLive(p) && promoHits(p, prod)); }
function applyItemPromos() {
  S.cart.forEach(l => {
    l._pd = 0; l._pn = '';
    const prod = S.products.find(x => x.id === l.product_id); if (!prod || l.noPromo) return;
    for (const pr of itemPromosFor(prod)) {
      const d = r2(Math.min(promoLineDisc(pr, l.qty, l.price), l.price * l.qty - num(l.discount)));
      if (d > l._pd) { l._pd = d; l._pn = pr.name; }
    }
  });
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
      <input type="range" id="zr" min="110" max="360" step="10" value="${VIEWP.size}" aria-label="ขนาดรูปสินค้า">
      <button type="button" data-z="20" aria-label="ใหญ่ขึ้น">+</button>
      <button type="button" id="zlay" title="ตาราง / รายการ">${VIEWP.layout === 'list' ? '▦' : '☰'}</button></div>
    <button class="btn" id="custBtn" title="สินค้านอกระบบ">➕ <span class="hide-sm">ขายด่วน</span></button>`);
  const setSize = v => { VIEWP.size = Math.max(110, Math.min(360, v)); $('#zr').value = VIEWP.size; localStorage.setItem('pos_view', JSON.stringify(VIEWP)); applyView(); };
  $('#zr').oninput = e => setSize(+e.target.value);
  $$('#zctl [data-z]').forEach(b => b.onclick = () => setSize(VIEWP.size + +b.dataset.z));
  $('#zlay').onclick = () => { VIEWP.layout = VIEWP.layout === 'list' ? 'grid' : 'list'; saveView(); $('#zlay').textContent = VIEWP.layout === 'list' ? '▦' : '☰'; };
  $('#custBtn').onclick = customItem;
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
    <div class="fg"><label class="f">ชื่อโปรโมชั่น *</label><input class="in" name="name" required value="${esc(o.name)}" placeholder="เช่น ซื้อ 2 แถม 1 น้ำดื่ม"></div>
    <div class="grid2"><div class="fg"><label class="f">ใช้กับ</label><select class="in" name="scope">${Object.entries(PSCOPE).map(([k, l]) => `<option value="${k}" ${o.scope === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">รูปแบบ</label><select class="in" name="kind"></select></div></div>
    <div class="grid2"><div class="fg" id="fv"><label class="f" id="lv">ค่า</label><input class="in" name="value" type="number" step="any" value="${num(o.value)}"></div>
      <div class="fg" id="fb"><label class="f" id="lb">ซื้อ (ชิ้น)</label><input class="in" name="buy_qty" type="number" step="1" min="1" value="${num(o.buy_qty) || 1}"></div>
      <div class="fg" id="fg"><label class="f">แถม (ชิ้น)</label><input class="in" name="get_qty" type="number" step="1" min="1" value="${num(o.get_qty) || 1}"></div>
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
    $('#fm', m).style.display = sc === 'bill' ? '' : 'none';
    $('#fa', m).style.display = sc === 'bill' ? '' : 'none';
    $('#lv', m).textContent = { percent: 'ส่วนลด (%)', amount: 'ลด (บาท)', fixed_price: 'ราคาพิเศษ / ชิ้น (บาท)', bundle: 'ราคาชุด (บาท)' }[k] || 'ค่า';
    $('#lb', m).textContent = k === 'bundle' ? 'จำนวนชิ้นต่อชุด' : 'ซื้อ (ชิ้น)';
    const t0 = { kind: k, value: num(f.value.value), buy_qty: num(f.buy_qty.value), get_qty: num(f.get_qty.value) };
    const ex = sc === 'bill' ? '' : (() => { const p0 = S.products.find(p => sel.has(p.id)) || S.products.find(p => cats.has(p.category_id)); if (!p0) return '';
      const q0 = k === 'bxgy' ? (t0.buy_qty || 1) + (t0.get_qty || 1) : k === 'bundle' ? (t0.buy_qty || 2) : 1;
      const d = promoLineDisc(t0, q0, num(p0.promo_price) > 0 ? p0.promo_price : p0.price);
      return `<br>ตัวอย่าง: ${esc(p0.name)} × ${q0} = ฿${money(q0 * (num(p0.promo_price) > 0 ? p0.promo_price : p0.price))} → ลด ฿${money(d)} จ่าย <b>฿${money(q0 * (num(p0.promo_price) > 0 ? p0.promo_price : p0.price) - d)}</b>`; })();
    $('#pprev', m).innerHTML = `<b>สรุป:</b> ${esc(promoLabel(t0))} · ${esc(PSCOPE[sc])}${ex}`;
  };
  f.scope.onchange = () => { fillKinds(); drawPick(); preview(); };
  f.oninput = preview;
  $$('#pd [data-d]', m).forEach(b => b.onclick = () => { const d = +b.dataset.d; days.has(d) ? days.delete(d) : days.add(d); b.classList.toggle('on'); });
  fillKinds(); drawPick(); preview();
  $('[data-c]', m).onclick = m.close;
  $('#psv', m).onclick = async () => {
    const sc = f.scope.value, row = { shop_id: S.shop.id, name: f.name.value.trim(), scope: sc, kind: f.kind.value, value: num(f.value.value), buy_qty: num(f.buy_qty.value), get_qty: num(f.get_qty.value),
      min_total: sc === 'bill' ? num(f.min_total.value) : 0, product_ids: sc === 'product' ? [...sel] : [], category_ids: sc === 'category' ? [...cats] : [], days: [...days].sort(),
      time_from: f.time_from.value, time_to: f.time_to.value, starts_on: f.starts_on.value || null, ends_on: f.ends_on.value || null,
      members_only: f.members_only.checked, auto: sc === 'bill' && f.auto.checked, active: f.active.checked, note: f.note.value.trim() };
    if (!row.name) return toast('กรุณาตั้งชื่อโปรโมชั่น', 'bad');
    if (sc === 'product' && !sel.size) return toast('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ', 'bad');
    if (sc === 'category' && !cats.size) return toast('กรุณาเลือกหมวดหมู่', 'bad');
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
  $('#tact')?.insertAdjacentHTML('beforeend', '<button class="btn" id="pers">🙋 เบิกใช้ส่วนตัว</button>');
  $('#pers').onclick = () => productPicker('เบิกใช้ส่วนตัว', p => stockForm(p, 'personal', () => go('stock')));
  const addBtns = () => $$('[data-k="out"]', pg).forEach(b => { if (b.nextElementSibling?.dataset.k === 'personal') return;
    b.insertAdjacentHTML('afterend', ` <button class="btn sm" data-k="personal" data-id="${b.dataset.id}">🙋 ใช้เอง</button>`);
    b.nextElementSibling.onclick = () => stockForm(S.products.find(p => p.id === b.dataset.id), 'personal', () => go('stock')); });
  new MutationObserver(addBtns).observe(pg, { childList: true, subtree: true }); addBtns();
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
  let tab = 'none', v = '';
  const chosen = new Set();
  $('#tact').innerHTML = `<button class="btn" id="bgen">⚙️ สร้างบาร์โค้ดให้สินค้าที่ไม่มี</button><button class="btn" id="bprint">🖨️ พิมพ์ฉลาก</button><button class="btn" id="bxl">📗 Excel</button>`;
  const list = () => S.products.filter(p => p.active !== false).filter(p => tab === 'all' || (tab === 'has' ? p.barcode : tab === 'none' ? !p.barcode : tab === 'bad' ? p.barcode && /^\d{13}$/.test(p.barcode) && !validEAN(p.barcode) : tab === 'dup' ? p.barcode && S.products.filter(x => x.barcode === p.barcode).length > 1 : true))
    .filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  const draw = () => {
    const act = S.products.filter(p => p.active !== false), has = act.filter(p => p.barcode).length;
    const dup = act.filter(p => p.barcode && act.filter(x => x.barcode === p.barcode).length > 1).length;
    const rows = list();
    pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">สินค้าทั้งหมด</div><div class="v">${act.length}</div></div><div class="stat"><div class="k">มีบาร์โค้ด</div><div class="v" style="color:var(--ok)">${has}</div></div>
      <div class="stat"><div class="k">ไม่มีบาร์โค้ด</div><div class="v" style="color:var(--warn)">${act.length - has}</div></div><div class="stat"><div class="k">บาร์โค้ดซ้ำ</div><div class="v" style="color:var(--bad)">${dup}</div></div></div>
      <div class="row" style="margin-bottom:10px"><div class="pills" id="bt">${[['none', 'ไม่มีบาร์โค้ด'], ['has', 'มีบาร์โค้ด'], ['dup', 'ซ้ำ'], ['bad', 'เลขตรวจสอบผิด'], ['all', 'ทั้งหมด']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="sbox" style="max-width:280px"><span>🔍</span><input class="in" id="bq" value="${esc(v)}" placeholder="ชื่อ / บาร์โค้ด / SKU"></div><span class="muted">เลือกแล้ว ${chosen.size}</span></div>
      <div class="tblwrap"><table class="tbl"><tr><th><input type="checkbox" id="ball"></th><th>สินค้า</th><th>บาร์โค้ด</th><th>SKU</th><th class="right">ราคา</th><th class="right">คงเหลือ</th><th></th></tr>
      ${rows.slice(0, 400).map(p => `<tr><td><input type="checkbox" data-c="${p.id}" ${chosen.has(p.id) ? 'checked' : ''}></td><td><b>${esc(p.name)}</b></td>
        <td>${p.barcode ? `<code>${esc(p.barcode)}</code>${/^\d{13}$/.test(p.barcode) && !validEAN(p.barcode) ? ' <span class="chip bad">เลขตรวจผิด</span>' : ''}` : '<span class="chip warn">ไม่มี</span>'}</td><td>${esc(p.sku || '')}</td>
        <td class="right">${money(p.price)}</td><td class="right">${p.track_stock ? qtyf(p.stock) : '—'}</td>
        <td class="right" style="white-space:nowrap"><button class="btn sm" data-ed="${p.id}">✏️</button> <button class="btn sm" data-sc="${p.id}">📷</button> ${p.barcode ? '' : `<button class="btn sm" data-g="${p.id}">สร้าง</button>`}</td></tr>`).join('')}</table></div>
      <p class="muted">${rows.length} รายการ${rows.length > 400 ? ' (แสดง 400 แรก)' : ''}</p>`;
    $$('#bt [data-t]', pg).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
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
  $('#bprint').onclick = () => { const it = S.products.filter(p => chosen.has(p.id)); if (!it.length) return toast('เลือกสินค้าที่ต้องการพิมพ์ฉลากก่อน', 'bad'); printLabels(it); };
  $('#bxl').onclick = () => xlsxDownload('barcodes', [{ name: 'บาร์โค้ด', rows: list().map(p => ({ 'ชื่อสินค้า': p.name, 'บาร์โค้ด': p.barcode || '', 'SKU': p.sku || '', 'หมวดหมู่': S.categories.find(c => c.id === p.category_id)?.name || '', 'ราคา': num(p.price), 'คงเหลือ': num(p.stock), 'สถานะ': p.barcode ? 'มี' : 'ไม่มี' })) }]);
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
  const aoa = [['คู่มือแม่แบบ Shop POS', '', ''], ['สร้างเมื่อ', dt(new Date()), S.shop.name], [''],
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
  if (sh.name) { document.title = sh.name + ' · POS'; localStorage.setItem('pos_brand', JSON.stringify({ name: sh.name, logo: sh.logo_url || '', color: c || '' })); }
  const lg = $('.side .logo'); if (lg) {
    if (sh.logo_url) { const i = lg.querySelector('i'); if (i) i.innerHTML = `<img src="${esc(sh.logo_url)}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;background:#fff">`; }
    const lt = lg.querySelector('.lt'); if (lt && lt.firstChild?.nodeType === 3) lt.firstChild.textContent = sh.name;
    const sn = lg.querySelector('.shopname'); if (sn) sn.textContent = sh.branch_name || (S.shops.length > 1 ? 'สาขา ' + (sh.branch_code || '') : 'Shop POS');
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
  if (br.logo) { const bm = $('.auth .brandmark'); if (bm) bm.innerHTML = `<img src="${esc(br.logo)}" alt="" style="width:100%;height:100%;object-fit:contain">`; }
  if (br.name) { const h = $('.auth h2'); if (h) h.textContent = br.name; document.title = br.name + ' · POS'; }
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

/* ===================================================================== AUTO UPDATE */
async function checkUpdate(manual) {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
    const v = await r.json();
    if (v.version && v.version !== APP_VERSION) {
      if ($('#updbar')) return;
      document.body.insertAdjacentHTML('beforeend', `<div id="updbar" class="updbar"><span>✨ มีเวอร์ชันใหม่ ${esc(v.version)}${v.notes ? ' — ' + esc(v.notes) : ''}</span><button class="btn sm p" id="updgo">อัปเดตเลย</button><button class="x" id="updx">×</button></div>`);
      $('#updgo').onclick = async () => { const regs = await navigator.serviceWorker?.getRegistrations?.() || []; await Promise.all(regs.map(x => x.update().catch(() => {})));
        if (window.caches) for (const k of await caches.keys()) await caches.delete(k); location.reload(); };
      $('#updx').onclick = () => $('#updbar').remove();
    } else if (manual) toast('ใช้เวอร์ชันล่าสุดแล้ว (' + APP_VERSION + ')', 'ok');
  } catch {}
}
setTimeout(checkUpdate, 8000); setInterval(checkUpdate, 15 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });

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
      <a class="btn" href="${APP_DL}ShopPOS.apk">🤖 Android (.apk)</a>
      <a class="btn" href="${APP_DL}ShopPOS-Setup.exe">🪟 Windows (ติดตั้ง .exe)</a>
      <a class="btn" href="${APP_DL}ShopPOS-Portable.exe">🪟 Windows (ไม่ต้องติดตั้ง)</a>
      <a class="btn" href="${APP_DL}ShopPOS-mac.dmg">🍎 Mac (.dmg)</a>
      <button type="button" class="btn" id="updChk">🔄 ตรวจหาอัปเดต</button></div>
    <p class="muted" style="font-size:13px">iPhone / iPad: เปิดลิงก์ใน Safari → แชร์ → “เพิ่มไปยังหน้าจอโฮม” · Android: ครั้งแรกให้อนุญาต “ติดตั้งแอปที่ไม่รู้จัก” · Windows: ถ้ามีคำเตือนกด “More info → Run anyway” · Mac: คลิกขวาที่แอป → Open</p></div>`);
  $('#updChk').onclick = () => checkUpdate(true);
};
/* ================= start ================= */
updateNet();
boot().then(() => { updateNet(); syncQueue(); }).catch(e => { fail(e); renderAuth(); });
