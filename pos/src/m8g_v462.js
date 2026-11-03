/* ================= v4.6.2 — stock count with barcode scanning (keyboard scanner + camera), camera scan in personal use ================= */
stockCountSheet = function (after) {
  const key = 'pos_count_' + S.shop.id;
  let counted = {}; try { counted = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  let filter = Object.keys(counted).length ? 'done' : 'all', lastId = null;
  const list = () => S.products.filter(p => p.track_stock && p.active !== false);
  const m = modal('📋 ตรวจนับสต็อก', `<div class="row" style="gap:8px"><div class="sbox" style="flex:1"><span>${ICON.barcodes}</span><input class="in" id="csq" placeholder="สแกนบาร์โค้ด = +1 · 12*บาร์โค้ด = +12 · หรือพิมพ์ชื่อค้นหา" autocomplete="off"></div>
      <button class="btn p" id="cscam">📷 สแกน</button></div>
      <div class="pills" id="csf" style="margin:10px 0">${[['all', 'ทั้งหมด'], ['done', 'นับแล้ว'], ['todo', 'ยังไม่นับ'], ['diff', 'ยอดไม่ตรง']].map(([k, l]) => `<button data-f="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="cl" class="cslist"></div>
      ${Object.keys(counted).length ? '<p class="muted" style="font-size:12px">มีการนับค้างไว้จากครั้งก่อน — นับต่อได้เลย หรือกด “ล้างยอดนับ”</p>' : ''}`,
    { wide: true, foot: `<span class="muted" id="cn"></span><span style="flex:1"></span><button class="btn" id="csclr">ล้างยอดนับ</button><button class="btn ok" id="csave">✔ บันทึกการตรวจนับ</button>` });
  const save = () => localStorage.setItem(key, JSON.stringify(counted));
  const draw = () => {
    const v = $('#csq', m).value.trim().toLowerCase();
    let L = list().filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v));
    if (filter === 'done') L = L.filter(p => p.id in counted); if (filter === 'todo') L = L.filter(p => !(p.id in counted)); if (filter === 'diff') L = L.filter(p => p.id in counted && counted[p.id] !== num(p.stock));
    if (lastId) L.sort((a, b) => (b.id === lastId) - (a.id === lastId));
    $('#cl', m).innerHTML = L.length ? L.slice(0, 300).map(p => { const c = counted[p.id], d = c === undefined ? null : c - num(p.stock);
      return `<div class="csrow ${p.id === lastId ? 'hit' : ''} ${c !== undefined ? 'done' : ''}"><div class="rl-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}">${p.image_url ? '' : '📦'}</div>
        <div class="csn"><b>${esc(p.name)}</b><small class="muted">${esc(p.barcode || 'ไม่มีบาร์โค้ด')} · ในระบบ ${qtyf(p.stock)} ${esc(p.unit)}</small></div>
        <div class="qty"><button data-m="${p.id}">−</button><input class="in" type="number" step="any" inputmode="decimal" data-c="${p.id}" value="${c ?? ''}" placeholder="—"><button data-p="${p.id}">+</button></div>
        <b class="csd" style="color:${d == null ? 'var(--muted)' : d < 0 ? 'var(--bad)' : d > 0 ? 'var(--ok)' : 'var(--ink)'}">${d == null ? '' : d === 0 ? '✓' : (d > 0 ? '+' : '') + qtyf(d)}</b></div>`; }).join('') : '<div class="empty">ไม่มีรายการ</div>';
    const done = Object.keys(counted).length, diff = Object.keys(counted).filter(id => { const p = S.products.find(x => x.id === id); return p && counted[id] !== num(p.stock); }).length;
    $('#cn', m).textContent = `นับแล้ว ${done}/${list().length} · ยอดไม่ตรง ${diff}`;
    $$('[data-c]', m).forEach(i => i.onchange = () => { if (i.value === '') delete counted[i.dataset.c]; else counted[i.dataset.c] = num(i.value); lastId = i.dataset.c; save(); draw(); });
    $$('[data-p]', m).forEach(b => b.onclick = () => { counted[b.dataset.p] = (counted[b.dataset.p] || 0) + 1; lastId = b.dataset.p; save(); draw(); });
    $$('[data-m]', m).forEach(b => b.onclick = () => { counted[b.dataset.m] = Math.max(0, (counted[b.dataset.m] || 0) - 1); lastId = b.dataset.m; save(); draw(); });
  };
  const scan = raw => { let n = 1, code = String(raw).trim(); const mm = code.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { n = num(mm[1]); code = mm[2].trim(); }
    const p = S.products.find(x => x.barcode === code || x.sku === code);
    if (!p) { if (looksCode(code)) { unknownBarcode(code); } return false; }
    if (!p.track_stock) { toast(`${p.name} ไม่ได้ตัดสต็อก`, 'bad'); return true; }
    counted[p.id] = (counted[p.id] || 0) + n; lastId = p.id; save(); sfx('scan'); if (filter === 'todo') filter = 'all';
    $$('#csf button', m).forEach(b => b.classList.toggle('on', b.dataset.f === filter)); $('#csq', m).value = ''; draw(); return true; };
  const q0 = $('#csq', m);
  q0.oninput = () => draw();
  q0.onkeydown = e => { if (e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation(); if (!scan(q0.value)) { const l = list().filter(p => p.name.toLowerCase().includes(q0.value.trim().toLowerCase())); if (l.length === 1) { q0.value = ''; scan(l[0].barcode || l[0].sku || ''); if (!l[0].barcode && !l[0].sku) { counted[l[0].id] = (counted[l[0].id] || 0) + 1; lastId = l[0].id; save(); draw(); } } } };
  $('#cscam', m).onclick = () => scanBarcode(c => { scan(c); setTimeout(() => { if (document.body.contains(m)) $('#cscam', m)?.click(); }, 700); });
  $$('#csf button', m).forEach(b => b.onclick = () => { filter = b.dataset.f; $$('#csf button', m).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#csclr', m).onclick = async () => { if (await confirmBox('ล้างยอดที่นับไว้ทั้งหมด?')) { counted = {}; lastId = null; save(); draw(); } };
  $('#csave', m).onclick = async () => {
    const ids = Object.keys(counted).filter(id => { const p = S.products.find(x => x.id === id); return p && counted[id] !== num(p.stock); });
    if (!ids.length) { localStorage.removeItem(key); m.close(); return toast('ยอดที่นับตรงกับในระบบทั้งหมด', 'ok'); }
    if (!await confirmBox(`ปรับยอดสต็อก ${ids.length} รายการให้ตรงกับที่นับได้?`)) return;
    const b = $('#csave', m); b.disabled = true;
    try { for (const id of ids) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: id, p_kind: 'adjust', p_qty: counted[id], p_cost: null, p_supplier: null, p_note: 'ตรวจนับสต็อก' })); S.products.find(p => p.id === id).stock = counted[id]; }
      localStorage.removeItem(key); toast(`ปรับยอดแล้ว ${ids.length} รายการ`, 'ok'); m.close(); after?.(); } catch (e) { b.disabled = false; fail(e); }
  };
  draw(); setTimeout(() => q0.focus(), 60);
};
/* one counting screen: the scan-count button opens the same sheet */
scanCount = after => stockCountSheet(after);
const _stock462 = VIEWS.stock;
VIEWS.stock = pg => { _stock462(pg); const b = $('#stkcount', pg); if (b) b.remove(); const c = $('#cnt'); if (c) { c.innerHTML = '📋 ตรวจนับสต็อก (สแกนได้)'; c.onclick = () => stockCountSheet(() => go('stock')); } };
/* personal use: camera scanning button next to the search box */
const _personalUse462 = personalUse;
personalUse = function () {
  _personalUse462();
  const m = $$('.mbg').pop(); if (!m) return;
  const add = () => { const box = $('#puq', m)?.closest('.sbox'); if (!box || $('#pucam', m)) return;
    box.insertAdjacentHTML('afterend', '<button class="btn p pucam" id="pucam">📷 สแกนด้วยกล้อง</button>');
    $('#pucam', m).onclick = () => scanBarcode(c => { const i = $('#puq', m); if (!i) return; i.value = c; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      setTimeout(() => { if (document.body.contains(m) && $('#pucam', m)) $('#pucam', m).click(); }, 700); }); };
  new MutationObserver(add).observe(m, { childList: true, subtree: true }); add();
};
