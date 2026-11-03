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
