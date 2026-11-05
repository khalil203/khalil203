/* v5.2.9 — receive goods: clear cost block on every line (ต้นทุน/หน่วย · ต้นทุนรวม · ต้นทุนเฉลี่ยใหม่) + same in the quick receive form */
const avgCost = (p, addBase, unitBase) => {
  const s = Math.max(0, num(p.stock)), oc = num(p.cost);
  if (!(addBase > 0) || !(unitBase > 0)) return oc;
  return (s * oc + addBase * unitBase) / (s + addBase);
};

function enhanceRcvLine(row) {
  if (row.dataset.cx) return; row.dataset.cx = 1;
  const nums = $('.rl-nums', row), qi = $('[data-f=qty]', row), ci = $('[data-f=cost]', row), us = $('[data-f=unit]', row);
  if (!nums || !qi || !ci) return;
  const name = $('.rl-prod b', row)?.textContent || '';
  const p = S.products.find(x => x.name === name);
  const unitName = us && us.selectedOptions[0] ? us.selectedOptions[0].textContent.replace(/\s*\(.*$/, '') : (p?.unit || '');
  const qty = num(qi.value), cost = num(ci.value), f = num(us?.value) || 1, tot = qty * cost;
  ci.closest('label').querySelector('small').textContent = `ต้นทุน / ${unitName || 'หน่วย'}`;
  $('.rl-tot', nums)?.remove();
  nums.insertAdjacentHTML('beforeend', `<label class="rl-totin"><small>ต้นทุนรวม (บาท)</small><input class="in" type="number" step="any" inputmode="decimal" data-tot value="${tot ? Math.round(tot * 100) / 100 : ''}" placeholder="0.00"></label>`);
  if (p) {
    const nb = avgCost(p, qty * f, cost / f), oc = num(p.cost), up = nb > oc * 1.0001 && oc > 0, dn = nb < oc * .9999;
    nums.insertAdjacentHTML('afterend', `<div class="rl-avg">
      <div><small>ต้นทุนเดิม</small><b>฿${money(oc)}</b><em>คงเหลือ ${qtyf(Math.max(0, num(p.stock)))} ${esc(p.unit)}</em></div>
      <div><small>รับเข้า</small><b>฿${money(cost / f)}</b><em>+${qtyf(qty * f)} ${esc(p.unit)}</em></div>
      <div class="hl ${up ? 'up' : dn ? 'dn' : ''}"><small>ต้นทุนเฉลี่ยใหม่</small><b>฿${money(nb)}</b><em>ต่อ ${esc(p.unit)}${up ? ' ▲' : dn ? ' ▼' : ''}</em></div></div>`);
  }
  const ti = $('[data-tot]', row);
  ti.onchange = () => { const q2 = num(qi.value); if (!(q2 > 0)) return toast('ใส่จำนวนก่อน', 'bad'); ci.value = Math.round(num(ti.value) / q2 * 10000) / 10000; setTimeout(() => ci.dispatchEvent(new Event('change')), 0); };
  ti.onkeydown = e => { if (e.key === 'Enter') ti.blur(); };
}
new MutationObserver(() => { const rl = document.getElementById('rlines'); if (!rl) return; $$('.rl', rl).forEach(enhanceRcvLine); })
  .observe(document.documentElement, { childList: true, subtree: true });

/* quick receive (stock card → รับเข้า, cashier ⋯ → รับเข้า): qty + cost/unit + total + live average */
const _stockForm529 = stockForm;
stockForm = function (p, kind, after) {
  if (kind !== 'in') return _stockForm529(p, kind, after);
  const m = modal(`รับสินค้าเข้า · ${p.name}`, `
    <div class="qr-in">
      <div class="grid2"><div class="fg"><label class="f">จำนวนที่รับ (${esc(p.unit)}) *</label><input class="in lg" id="qiQ" type="number" step="any" inputmode="decimal" placeholder="0"></div>
        <div class="fg"><label class="f">ต้นทุน / ${esc(p.unit)} (บาท)</label><input class="in lg" id="qiC" type="number" step="any" inputmode="decimal" value="${num(p.cost) || ''}"></div></div>
      <div class="fg"><label class="f">ต้นทุนรวม (บาท) — ใส่ยอดในบิล ระบบจะคิดต้นทุนต่อหน่วยให้</label><input class="in lg" id="qiT" type="number" step="any" inputmode="decimal" placeholder="0.00"></div>
      <div class="rl-avg" id="qiAvg"></div>
      <div class="fg"><label class="f">คู่ค้า</label><select class="in" id="rsupq"><option value="">— ไม่ระบุ —</option>${S.suppliers.map(s => `<option value="${s.id}" ${p.supplier_id === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">หมายเหตุ</label><input class="in" id="qiN"></div></div>`,
    { foot: `<button class="btn" id="qiX">ยกเลิก</button><button class="btn p lg" id="qiOk">✔ รับเข้าสต็อก</button>` });
  const Q = $('#qiQ', m), C = $('#qiC', m), T = $('#qiT', m);
  const paint = () => { const qv = num(Q.value), cv = num(C.value), oc = num(p.cost), nb = avgCost(p, qv, cv), up = nb > oc * 1.0001 && oc > 0, dn = nb < oc * .9999;
    $('#qiAvg', m).innerHTML = `<div><small>ต้นทุนเดิม</small><b>฿${money(oc)}</b><em>คงเหลือ ${qtyf(Math.max(0, num(p.stock)))}</em></div>
      <div><small>ต้นทุนรวมที่รับ</small><b>฿${money(qv * cv)}</b><em>+${qtyf(qv)} ${esc(p.unit)}</em></div>
      <div class="hl ${up ? 'up' : dn ? 'dn' : ''}"><small>ต้นทุนเฉลี่ยใหม่</small><b>฿${money(nb)}</b><em>ต่อ ${esc(p.unit)}${up ? ' ▲' : dn ? ' ▼' : ''}</em></div>`; };
  Q.oninput = () => { if (num(T.value) > 0 && document.activeElement !== C && T.dataset.src === 't') C.value = Math.round(num(T.value) / Math.max(num(Q.value), 1e-9) * 10000) / 10000; else T.value = num(Q.value) * num(C.value) ? Math.round(num(Q.value) * num(C.value) * 100) / 100 : ''; paint(); };
  C.oninput = () => { T.dataset.src = 'c'; T.value = num(Q.value) * num(C.value) ? Math.round(num(Q.value) * num(C.value) * 100) / 100 : ''; paint(); };
  T.oninput = () => { T.dataset.src = 't'; if (num(Q.value) > 0) C.value = Math.round(num(T.value) / num(Q.value) * 10000) / 10000; paint(); };
  paint(); setTimeout(() => Q.focus(), 80);
  try { enhanceSupplierSelect($('#rsupq', m)); } catch {}
  $('#qiX', m).onclick = () => $('.x', m).click();
  $('#qiOk', m).onclick = async () => {
    if (!(num(Q.value) > 0)) return toast('กรุณากรอกจำนวนให้ถูกต้อง', 'bad');
    const b = $('#qiOk', m); b.disabled = true;
    try {
      await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: p.id, p_kind: 'in', p_qty: num(Q.value), p_cost: num(C.value) || null, p_supplier: $('#rsupq', m).value || null, p_note: $('#qiN', m).value || '' }));
      Object.assign(p, await q(sb.from('products').select('*').eq('id', p.id).single()));
      sfx('pay'); toast(`รับเข้า ${qtyf(Q.value)} ${p.unit} · ต้นทุนเฉลี่ยใหม่ ฿${money(p.cost)}`, 'ok'); $('.x', m).click(); after?.();
    } catch (e) { b.disabled = false; fail(e); }
  };
};
