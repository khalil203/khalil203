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
