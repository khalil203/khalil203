/* v5.7.0 — Products and Stock are ONE page: one grid, one category bar, and every
   card does both jobs (➕ receive, ➖ remove, ✏️ edit; tap = full card with count,
   damaged, expired, picture, label, history). Replaces the two-tab shell. */
async function stockHistory() {
  const m = modal('📜 ประวัติสต็อก (เข้า / ออก / ปรับ)', '<div id="shb" class="muted">กำลังโหลด…</div>', { wide: true });
  try {
    const mv = await q(sb.from('stock_moves').select('*').eq('shop_id', S.shop.id).order('created_at', { ascending: false }).limit(300));
    const box = $('#shb', m); if (!box) return;
    box.classList.remove('muted');
    box.innerHTML = mv.length ? `<div class="sbox" style="margin-bottom:10px"><span>🔍</span><input class="in" id="shq" placeholder="ค้นหาชื่อสินค้า"></div><div class="tblwrap"><table class="tbl" id="sht"><tr><th>วันเวลา</th><th>สินค้า</th><th>ประเภท</th><th class="right">จำนวน</th><th>หมายเหตุ</th></tr>
      ${mv.map(r => `<tr data-n="${esc((r.product_name || '').toLowerCase())}"><td>${dt(r.created_at)}</td><td><b>${esc(r.product_name || '')}</b></td><td>${(MOVE[r.kind] || ['', r.kind]).join(' ')}</td>
        <td class="right b" style="color:${r.qty < 0 ? 'var(--bad)' : 'var(--ok)'}">${r.qty > 0 ? '+' : ''}${qtyf(r.qty)}</td><td><small>${esc([r.ref, r.note].filter(Boolean).join(' · '))}</small></td></tr>`).join('')}</table></div>` : '<div class="empty">ยังไม่มีความเคลื่อนไหว</div>';
    const qi = $('#shq', m); if (qi) qi.oninput = () => { const v = qi.value.toLowerCase(); $$('#sht tr[data-n]', m).forEach(tr => tr.style.display = !v || tr.dataset.n.includes(v) ? '' : 'none'); };
  } catch (e) { const box = $('#shb', m); if (box) box.textContent = 'โหลดประวัติไม่สำเร็จ — ลองอีกครั้ง'; }
}
function psShell(pg) {
  if (!pgOK('products')) return _vStock5(pg);          // stock-only staff keep the stock screen
  const ttl = $('#ttl'); if (ttl) ttl.textContent = 'สินค้า & สต็อก';
  $$('[data-p="products"]').forEach(b => b.classList.add('on')); $$('[data-p="stock"]').forEach(b => b.classList.remove('on'));
  const inv = canDo('manage_inventory'), act = S.products.filter(p => p.active !== false), tr = act.filter(p => p.track_stock);
  const n = f => act.filter(p => psStatusOK(p, f)).length;
  const st = [['', '📦', 'สินค้าทั้งหมด', act.length, '']];
  if (inv) st.push(['low', '⚠️', 'ใกล้หมด', n('low'), 'warn'], ['out', '⛔', 'หมดสต็อก', n('out'), 'bad'], ['exp', '⌛', 'ใกล้หมดอายุ', n('exp'), 'warn']);
  if (inv && canDo('view_profit')) st.push([null, '💰', 'มูลค่าสต็อก (ทุน)', baht(tr.reduce((a, p) => a + Math.max(0, num(p.stock)) * num(p.cost), 0)), '']);
  pg.innerHTML = `<div class="ustats">${st.map(([k, ic, l, v, c]) => `<button type="button" class="ustat ${c} ${k !== null && PSF.f === k ? 'on' : ''}" ${k === null ? 'disabled' : `data-us="${k}"`}><span>${ic}</span><small>${l}</small><b>${v}</b></button>`).join('')}</div><div id="psub"></div>`;
  const r = _vProducts5($('#psub', pg));
  $$('[data-us]', pg).forEach(b => b.onclick = () => { PSF.f = b.dataset.us; $$('[data-us]', pg).forEach(x => x.classList.toggle('on', x === b)); $('#pf', pg)?.dispatchEvent(new Event('change')); });
  const ta = $('#tact'), add = $('#addBtn');
  if (ta && inv && !$('#uRcv')) {
    (add || ta).insertAdjacentHTML(add ? 'afterend' : 'afterbegin', `<button class="btn ok" id="uRcv">📥 รับสินค้าเข้า</button><button class="btn" id="uCnt">📋 ตรวจนับสต็อก</button><button class="btn" id="uHist">📜 ประวัติสต็อก</button>${S.shops.length > 1 ? '<button class="btn" id="uTrf">🔁 โอนระหว่างสาขา</button>' : ''}`);
    $('#uRcv').onclick = () => go('receive'); $('#uCnt').onclick = () => stockCountSheet(() => go('products')); $('#uHist').onclick = stockHistory;
    if ($('#uTrf')) $('#uTrf').onclick = () => transferDialog(() => go('products'));
  }
  return r;
}
(function () {
  const _stockOld = VIEWS.stock;
  VIEWS.stock = pg => pgOK('products') ? VIEWS.products(pg) : _stockOld(pg);
})();
