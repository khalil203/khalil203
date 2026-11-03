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

