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
        <div class="card"><b>สรุปรายการขาย (${D.list.length} รายการ)</b><div class="tblwrap" style="max-height:46vh;overflow:auto;margin-top:6px"><table class="tbl"><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ยอด</th></tr>
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
