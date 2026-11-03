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
