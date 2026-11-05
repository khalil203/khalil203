/* v5.4.4 — เบิกใช้ส่วนตัว made easy: tap picture tiles (by category) or scan, tap-to-pick who & why, one button to save */
personalUse = function () {
  const lines = []; let view = 'take', cat = '', who = '', why = '', search = '';
  const me = S.shop._name || S.user.email.split('@')[0];
  const WHY = ['ทำอาหาร / กินเอง', 'ใช้ในร้าน', 'ของเสีย / หมดอายุ', 'แจก / ให้ลูกค้าชิม'];
  let WHO = [me];
  const m = modal('🙋 เบิกใช้ส่วนตัว', `<div class="seg" id="puTab" style="margin-bottom:10px"><button data-v="take" class="on">เบิกสินค้า</button><button data-v="hist">ประวัติการเบิก</button></div><div id="puBody"></div>`,
    { wide: true, foot: `<div class="pu-foot" id="puFoot"></div>` });
  m.classList.add('pu-modal');
  // staff names used before → quick chips
  q(sb.from('stock_moves').select('note').eq('shop_id', S.shop.id).eq('kind', 'personal').order('created_at', { ascending: false }).limit(150))
    .then(r => { r.forEach(x => { const n = (x.note || '').replace(/^ผู้เบิก:\s*/, '').split(' · ')[0].trim(); if (n && !WHO.includes(n)) WHO.push(n); }); WHO = WHO.slice(0, 8); if (view === 'take') drawFoot(); }).catch(() => {});
  const body = () => $('#puBody', m), total = () => lines.reduce((a, l) => a + l.qty, 0);
  const inBasket = id => lines.find(l => l.p.id === id)?.qty || 0;
  const add = (p, n = 1) => {
    if (!p) return;
    const left = num(p.stock) - inBasket(p.id);
    if (p.track_stock && S.shop.allow_negative_stock === false && left < n) { sfx('error'); return toast(`${p.name} — สต็อกไม่พอ (เหลือ ${qtyf(num(p.stock))})`, 'bad'); }
    const ex = lines.find(l => l.p.id === p.id); if (ex) ex.qty += n; else lines.unshift({ p, qty: n });
    sfx('add'); drawGrid(); drawFoot();
    const t = $(`.pu-tile[data-p="${p.id}"]`, m); if (t) { t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
  };
  const products = () => S.products.filter(p => p.active !== false)
    .filter(p => !cat || (cat === '_none' ? !p.category_id : p.category_id === cat))
    .filter(p => !search || p.name.toLowerCase().includes(search) || (p.barcode || '').includes(search) || (p.sku || '').toLowerCase().includes(search));
  const drawTake = () => {
    const cats = S.categories.filter(c => S.products.some(p => p.active !== false && p.category_id === c.id));
    const chip = (id, label, color) => `<button class="bcs-chip ${cat === id ? 'on' : ''}" data-pc="${id}" style="--cc:${color || 'var(--brand)'}"><i></i><span>${esc(label)}</span></button>`;
    body().innerHTML = `<div class="pu-top"><div class="sbox" style="flex:1"><span>🔍</span><input class="in" id="puq" placeholder="ค้นหา / สแกนบาร์โค้ด" autocomplete="off" inputmode="none"></div>
        <button class="btn p" id="pucam">📷 สแกน</button></div>
      <div class="bcs pu-cats">${chip('', 'ทั้งหมด')}${cats.map(c => chip(c.id, c.name, c.color || catColor(c.id))).join('')}${S.products.some(p => !p.category_id) ? chip('_none', 'ไม่มีหมวด', '#94a3b8') : ''}</div>
      <div class="pu-grid" id="puGrid"></div>`;
    const q0 = $('#puq', m);
    q0.addEventListener('pointerdown', () => q0.setAttribute('inputmode', 'search'));
    q0.oninput = () => { search = q0.value.trim().toLowerCase(); drawGrid(); };
    q0.onkeydown = e => { if (e.key !== 'Enter') return; const v = q0.value.trim(); let n = 1, code = v; const mm = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { n = num(mm[1]); code = mm[2]; }
      const hit = S.products.find(p => p.barcode === code || p.sku === code || (p.units || []).some(u => u.barcode === code));
      if (hit) { add(hit, n); q0.value = ''; search = ''; drawGrid(); } else { const l = products(); if (l.length === 1) { add(l[0], n); q0.value = ''; search = ''; drawGrid(); } else if (/^\d{6,}$/.test(code)) { sfx('error'); toast(`ไม่พบบาร์โค้ด ${code}`, 'bad'); } } };
    $('#pucam', m).onclick = () => scanBarcode(c => { q0.value = c; q0.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); });
    $$('[data-pc]', m).forEach(b => b.onclick = () => { cat = b.dataset.pc; $$('[data-pc]', m).forEach(x => x.classList.toggle('on', x === b)); drawGrid(); });
    drawGrid(); drawFoot();
  };
  const drawGrid = () => {
    const g = $('#puGrid', m); if (!g) return;
    const list = products().slice(0, 300);
    g.innerHTML = list.length ? list.map(p => { const n = inBasket(p.id), bg = p.tile_color || catColor(p.category_id), out = p.track_stock && num(p.stock) <= 0;
      return `<button class="pu-tile ${n ? 'on' : ''} ${out ? 'out' : ''}" data-p="${p.id}">
        <div class="pu-img" style="${isImg(p) ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(bg)}`}">${isImg(p) ? '' : `<span>${esc(p.name.trim().charAt(0))}</span>`}</div>
        ${n ? `<i class="pu-n">${qtyf(n)}</i>` : ''}<b>${esc(p.name)}</b><small>${p.track_stock ? `เหลือ ${qtyf(num(p.stock) - n)} ${esc(p.unit || '')}` : esc(p.unit || '')}</small></button>`; }).join('')
      : '<div class="empty" style="grid-column:1/-1;padding:24px">ไม่พบสินค้า</div>';
    $$('.pu-tile', g).forEach(b => b.onclick = () => add(S.products.find(x => x.id === b.dataset.p)));
  };
  const drawFoot = () => {
    const f = $('#puFoot', m); if (!f) return;
    if (view !== 'take') { f.innerHTML = ''; f.parentElement.style.display = 'none'; return; }
    f.parentElement.style.display = '';
    who ||= me;
    f.innerHTML = `${lines.length ? `<div class="pu-basket">${lines.map((l, i) => `<span class="pu-bi"><b>${esc(l.p.name)}</b><button data-d="${i}">−</button><em>${qtyf(l.qty)}</em><button data-u="${i}">＋</button></span>`).join('')}</div>`
        : '<div class="muted pu-hint">👆 แตะรูปสินค้า หรือสแกนบาร์โค้ด เพื่อเลือก</div>'}
      <div class="pu-row"><span class="pu-lab">ใครเบิก</span>${WHO.map(n => `<button class="pu-chip ${who === n ? 'on' : ''}" data-who="${esc(n)}">${esc(n)}</button>`).join('')}<button class="pu-chip" data-who="_other">＋ ชื่ออื่น</button></div>
      <div class="pu-row"><span class="pu-lab">เหตุผล</span>${WHY.map(n => `<button class="pu-chip ${why === n ? 'on' : ''}" data-why="${esc(n)}">${esc(n)}</button>`).join('')}<button class="pu-chip ${why && !WHY.includes(why) ? 'on' : ''}" data-why="_other">${why && !WHY.includes(why) ? '📝 ' + esc(why) : '📝 อื่นๆ'}</button></div>
      <button class="btn ok lg pu-save" id="pusave" ${lines.length ? '' : 'disabled'}>✔ ตัดออกจากสต็อก${lines.length ? ` · ${lines.length} รายการ (${qtyf(total())} ชิ้น)` : ''}</button>`;
    $$('[data-u]', f).forEach(b => b.onclick = () => { lines[+b.dataset.u].qty++; drawGrid(); drawFoot(); });
    $$('[data-d]', f).forEach(b => b.onclick = () => { const l = lines[+b.dataset.d]; l.qty--; if (l.qty <= 0) lines.splice(+b.dataset.d, 1); drawGrid(); drawFoot(); });
    $$('[data-who]', f).forEach(b => b.onclick = async () => { if (b.dataset.who === '_other') { const n = (prompt('ชื่อผู้เบิก') || '').trim(); if (!n) return; if (!WHO.includes(n)) WHO.push(n); who = n; } else who = b.dataset.who; drawFoot(); });
    $$('[data-why]', f).forEach(b => b.onclick = () => { if (b.dataset.why === '_other') { const n = (prompt('เหตุผล / หมายเหตุ', WHY.includes(why) ? '' : why) || '').trim(); why = n; } else why = why === b.dataset.why ? '' : b.dataset.why; drawFoot(); });
    $('#pusave', f).onclick = async () => {
      const btn = $('#pusave', f); btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
      try { for (const l of lines) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: l.p.id, p_kind: 'personal', p_qty: l.qty, p_cost: null, p_supplier: null, p_note: `ผู้เบิก: ${who}${why ? ' · ' + why : ''}` })); l.p.stock = num(l.p.stock) - l.qty; }
        toast(`✔ เบิกใช้ส่วนตัว ${lines.length} รายการแล้ว`, 'ok'); sfx('pay'); lines.length = 0; why = ''; if (S.page === 'pos') try { window.drawGrid?.(); } catch {} view = 'hist'; setTab(); }
      catch (e) { fail(e); btn.disabled = false; drawFoot(); }
    };
  };
  const drawHist = async () => {
    body().innerHTML = '<div class="skel"><i></i></div>';
    const rows = await q(sb.from('stock_moves').select('product_name,qty,cost,note,created_at').eq('shop_id', S.shop.id).eq('kind', 'personal').order('created_at', { ascending: false }).limit(200));
    const g = []; rows.forEach(r => { const k = r.created_at.slice(0, 16) + '|' + r.note; let o = g.find(x => x.k === k); if (!o) g.push(o = { k, at: r.created_at, note: r.note || '', items: [] }); o.items.push(r); });
    const val = rows.reduce((a, r) => a + Math.abs(num(r.qty)) * num(r.cost), 0);
    body().innerHTML = rows.length ? `<p class="muted" style="margin-top:0">${g.length} ครั้งล่าสุด · มูลค่าทุนรวม ${baht(val)}</p><div class="puhist">${g.map(o => `<div class="puh"><div class="row"><b style="flex:1">🙋 ${esc(o.note.replace(/^ผู้เบิก:\s*/, '').split(' · ')[0] || '-')}</b><small class="muted">${dt(o.at)}</small></div>
      ${o.note.includes(' · ') ? `<div class="muted" style="font-size:13px">📝 ${esc(o.note.split(' · ').slice(1).join(' · '))}</div>` : ''}
      <div class="puitems">${o.items.map(i => `<span class="chip">${esc(i.product_name)} × ${qtyf(Math.abs(i.qty))}</span>`).join('')}</div></div>`).join('')}</div>` : '<div class="empty">ยังไม่มีการเบิกใช้ส่วนตัว</div>';
  };
  const setTab = () => { $$('#puTab button', m).forEach(b => b.classList.toggle('on', b.dataset.v === view)); drawFoot(); view === 'take' ? drawTake() : drawHist().catch(fail); };
  $$('#puTab button', m).forEach(b => b.onclick = () => { view = b.dataset.v; setTab(); });
  setTab();
};
