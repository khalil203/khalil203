/* ---------------- helpers ---------------- */
let CHART_P = null;
const loadChart = () => loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
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
    if (!$('#db')) return; // page was left while loading
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
