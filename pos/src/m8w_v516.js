/* ================= v5.1.6 — fix a bill's payment method in one tap, and record everything staff do ================= */
Object.assign(AUDIT_L, { change_payment: '💳 แก้ช่องทางชำระ', cart_clear: '🗑️ ล้างตะกร้า', cart_hold: '⏸️ พักบิล', cart_remove: '➖ ลบสินค้าออกจากตะกร้า',
  drawer_open: '💰 เปิดลิ้นชักเงิน', reprint: '🧾 พิมพ์ใบเสร็จซ้ำ', cash_in: '💵 นำเงินเข้าลิ้นชัก', cash_out: '💸 นำเงินออกลิ้นชัก', insert_shifts: '🟢 เปิดกะ', update_shifts: '🔴 ปิดกะ/แก้ไขกะ', stock_import: '📥 นำเข้าสต็อกจากไฟล์' });
const CP_REASONS = [['cash', 'ลูกค้าจ่ายเงินสด', 'cash'], ['scan', 'ลูกค้าสแกนจ่าย', 'promptpay'], ['transfer', 'ลูกค้าโอนเงิน', 'transfer']];
const PAY_EDIT = ['cash', 'promptpay', 'transfer', 'credit_card', 'debit_card'];
const canEditPay = sale => sale && sale.status !== 'void' && sale.payment_method !== 'store_credit' &&
  (can('owner', 'manager') || (sale.cashier_id === S.user.id && Date.now() - new Date(sale.created_at) < 864e5));
function changePayment(sale, after) {
  if (!canEditPay(sale)) return toast(sale?.status === 'void' ? 'บิลนี้ถูกยกเลิกแล้ว' : 'พนักงานแก้ได้เฉพาะบิลของตัวเองภายใน 24 ชม. — ให้ผู้จัดการแก้ให้', 'bad');
  let pick = sale.payment_method;
  const m = modal('💳 แก้ช่องทางชำระเงิน', `<div class="cp-bill"><b>บิล ${esc(sale.bill_no)}</b><span>${dt(sale.created_at)} · ${esc(sale.cashier_name || '')}</span><b class="cp-tot">${baht(sale.total)}</b></div>
    <p class="muted" style="margin:10px 0 6px">ตอนนี้บันทึกเป็น <b>${payIcon(sale.payment_method)} ${payName(sale.payment_method)}</b> — เลือกช่องทางที่ถูกต้อง</p>
    <div class="cp-grid">${PAY_EDIT.map(k => `<button type="button" data-pm="${k}" class="${k === pick ? 'on cur' : ''}">${payIcon(k)}<span>${payName(k)}</span>${k === sale.payment_method ? '<small>เดิม</small>' : ''}</button>`).join('')}</div>
    <div class="fg" style="margin-top:12px"><label class="f">เหตุผล <b style="color:var(--bad)">* บังคับ</b></label>
      <div class="cp-rs">${CP_REASONS.map(([k, t]) => `<button type="button" data-rs="${k}">${t}</button>`).join('')}</div>
      <input class="in" id="cpr" placeholder="เลือกเหตุผลด้านบน หรือพิมพ์เพิ่มเติม" style="margin-top:8px"></div>
    <p class="muted" style="font-size:12px;margin:0">ระบบจะบันทึกไว้ว่าใครแก้ เมื่อไหร่ จากอะไรเป็นอะไร</p>`,
    { foot: '<button class="btn" data-c>ยกเลิก</button><span style="flex:1"></span><button class="btn p" id="cpok" disabled>✔ บันทึกการแก้ไข</button>' });
  const valid = () => { $('#cpok', m).disabled = pick === sale.payment_method || !$('#cpr', m).value.trim(); };
  const setReason = k => { const r = CP_REASONS.find(x => x[0] === k); $$('[data-rs]', m).forEach(x => x.classList.toggle('on', x.dataset.rs === k)); if (r) $('#cpr', m).value = r[1]; valid(); };
  $$('[data-pm]', m).forEach(b => b.onclick = () => { pick = b.dataset.pm; $$('[data-pm]', m).forEach(x => x.classList.toggle('on', x === b));
    setReason(pick === 'cash' ? 'cash' : pick === 'promptpay' ? 'scan' : pick === 'transfer' ? 'transfer' : ''); });
  $$('[data-rs]', m).forEach(b => b.onclick = () => { setReason(b.dataset.rs); const r = CP_REASONS.find(x => x[0] === b.dataset.rs);
    if (r && r[2] !== pick) { pick = r[2]; $$('[data-pm]', m).forEach(x => x.classList.toggle('on', x.dataset.pm === pick)); } valid(); });
  $('#cpr', m).oninput = () => { $$('[data-rs]', m).forEach(x => x.classList.toggle('on', CP_REASONS.find(r => r[0] === x.dataset.rs)[1] === $('#cpr', m).value.trim())); valid(); };
  $('[data-c]', m).onclick = m.close;
  $('#cpok', m).onclick = async () => {
    if (!$('#cpr', m).value.trim()) { $('#cpr', m).focus(); return toast('กรุณาระบุเหตุผล', 'bad'); }
    const b = $('#cpok', m); b.disabled = true;
    try { await q(sb.rpc('change_sale_payment', { p_sale: sale.id, p_method: pick, p_reason: $('#cpr', m).value.trim() }));
      const old = sale.payment_method; sale.payment_method = pick; if (sale._payments) sale._payments = [{ method: pick, amount: sale.total }];
      sfx('ok'); toast(`แก้แล้ว: ${payName(old)} → ${payName(pick)}`, 'ok'); m.close(); try { loadPosStats(); } catch {} after?.(sale);
    } catch (e) { b.disabled = false; fail(e); }
  };
}
/* bill detail + receipt: button */
const addPayBtn = (sale, after) => { const mf = $$('.mbg').pop()?.querySelector('.mf'); if (!mf || $('#cpb', mf) || !canEditPay(sale)) return;
  mf.insertAdjacentHTML('afterbegin', '<button class="btn" id="cpb">💳 แก้ช่องทางชำระ</button>'); $('#cpb', mf).onclick = () => { $$('.mbg').pop()?.querySelector('.x')?.click(); changePayment(sale, after); }; };
const _billDetail516 = billDetail;
billDetail = async function (sale, reload) { const r = await _billDetail516(sale, reload); addPayBtn(sale, () => reload?.()); return r; };
const _showReceipt516 = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) { _showReceipt516(sale, items, cust, autoPrint); addPayBtn(sale, s => { if (S.page === 'sales') go('sales'); }); };
/* sales list: ✏️ next to the payment method */
const _sales516 = VIEWS.sales;
VIEWS.sales = pg => {
  _sales516(pg);
  const deco = () => $$('#bl tr[data-id]', pg).forEach(tr => { const td = tr.children[3]; if (!td || $('.cpe', td)) return;
    td.insertAdjacentHTML('beforeend', ' <button class="btn sm cpe" title="แก้ช่องทางชำระ">✏️</button>');
    $('.cpe', td).onclick = async e => { e.stopPropagation();
      try { const s = await q(sb.from('sales').select('*').eq('id', tr.dataset.id).single()); changePayment(s, () => go('sales')); } catch (er) { fail(er); } }; });
  new MutationObserver(deco).observe(pg, { childList: true, subtree: true });
};

/* ---------- record what staff do at the cashier ---------- */
const cartSum = () => ({ items: S.cart.length, value: r2(S.cart.reduce((a, l) => a + num(l.price) * num(l.qty) - num(l.discount), 0)), list: S.cart.slice(0, 20).map(l => `${l.name} x${qtyf(l.qty)}`).join(', ') });
document.addEventListener('click', e => {
  if (e.target.closest('#clrBtn:not([disabled])') && S.cart.length) logAct('cart_clear', 'cart', '', cartSum());
  if (e.target.closest('#holdBtn:not([disabled])') && S.cart.length) logAct('cart_hold', 'cart', '', cartSum());
  const cx = e.target.closest('[data-cx]'); if (cx) { const l = S.cart[+cx.dataset.cx]; if (l) logAct('cart_remove', 'cart', l.name, { qty: l.qty, value: r2(num(l.price) * num(l.qty)) }); }
  if (e.target.closest('#lastBtn,[data-c="print"],[data-mi="lastBtn"]')) logAct('reprint', 'sale', '', {});
}, true);
const _openDrawer516 = openDrawer;
openDrawer = function (...a) { logAct('drawer_open', 'cash', a[0] ? 'เปิดเอง' : 'หลังขาย', {}); return _openDrawer516(...a); };
/* activity log: Thai words for the new details */
const _audit516 = VIEWS.audit;
VIEWS.audit = async pg => {
  await _audit516(pg);
  const W = { 'list:': 'รายการ:', 'items:': 'จำนวนรายการ:', 'method:': 'ช่องทาง:', 'qty:': 'จำนวน:', 'cashier:': 'พนักงานขาย:', 'หลัง: ': 'เป็น: ', 'ก่อน: ': 'จาก: ' };
  const fix = () => $$('#al small', pg).forEach(s => { if (s.dataset.t) return; s.dataset.t = 1; let h = s.innerHTML;
    Object.entries(W).forEach(([a, b]) => { h = h.split(a).join(b); });
    h = h.replace(/\b(cash|promptpay|transfer|credit_card|debit_card|store_credit)\b/g, k => payName(k)); s.innerHTML = h; });
  new MutationObserver(fix).observe($('#al', pg) || pg, { childList: true, subtree: true }); fix();
};
