/* ================= v5.1.3 — receive goods: clear "manual" mode (no bill) with category browser + camera scan ================= */
const _receive513 = VIEWS.receive;
VIEWS.receive = async pg => {
  await _receive513(pg);
  let mode = localStorage.getItem('pos_rcv_mode') || 'manual', cat = '';
  const addProd = p => {
    const add = $('#radd', pg); if (!add || !p) return;
    const ex = $$('.rl:not(.skip)', pg).find(r => $('.rl-prod b', r)?.textContent === p.name && !$('.rl-main > small', r));
    if (ex) { const qi = $('[data-f=qty]', ex); qi.value = num(qi.value) + 1; qi.dispatchEvent(new Event('change')); sfx('add'); return; }
    add.value = p.name; add.dispatchEvent(new Event('input'));
    const b = $(`#rsug [data-p="${p.id}"]`, pg);
    if (b) b.click(); else { add.value = p.barcode || p.sku || p.name; add.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); }
    const t = $(`.rb-tile[data-id="${p.id}"]`, pg); t?.classList.add('pop');
  };
  const browser = () => {
    const list = S.products.filter(p => p.active !== false && (!cat || (cat === '_none' ? !p.category_id : p.category_id === cat)))
      .sort((a, b) => (b.track_stock && b.stock <= b.low_stock) - (a.track_stock && a.stock <= a.low_stock) || a.name.localeCompare(b.name, 'th')).slice(0, 600);
    const inRcv = id => $$('.rl', pg).length ? null : null;
    return `<div class="card rb-box"><div class="rb-h"><b>👆 แตะสินค้าเพื่อเพิ่มเข้ารายการรับ</b><small class="muted">สินค้าใกล้หมดขึ้นก่อน</small></div>
      <div class="cs-cats" id="rbcat"><button type="button" data-rc="" class="${!cat ? 'on' : ''}">🗂️ ทั้งหมด</button>${[...S.categories].sort((a, b) => num(a.sort) - num(b.sort)).filter(c => S.products.some(p => p.active !== false && p.category_id === c.id)).map(c => `<button type="button" data-rc="${c.id}" class="${cat === c.id ? 'on' : ''}">${c.icon ? esc(c.icon) + ' ' : '<i style="--cc:' + esc(c.color || '#6366f1') + '"></i>'}${esc(c.name)}</button>`).join('')}${S.products.some(p => p.active !== false && !p.category_id) ? `<button type="button" data-rc="_none" class="${cat === '_none' ? 'on' : ''}">ไม่มีหมวด</button>` : ''}</div>
      <div class="rb-grid">${(() => { const tile = p => { const low = p.track_stock && p.stock <= p.low_stock;
        return `<button type="button" class="rb-tile ${low ? 'low' : ''}" data-id="${p.id}"><span class="rb-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(p.tile_color || catColor(p.category_id))}`}">${p.image_url ? '' : esc([...p.name].slice(0, 1).join(''))}</span>
          <span class="rb-n">${esc(p.name)}</span><small>${p.track_stock ? `เหลือ ${qtyf(p.stock)} ${esc(p.unit || '')}` : 'ไม่ตัดสต็อก'}</small></button>`; };
        /* grouped under a category name banner, categories in their set order */
        const groups = new Map(); list.forEach(p => { const k = p.category_id || '_none'; (groups.get(k) || groups.set(k, []).get(k)).push(p); });
        const order = [...[...S.categories].sort((a, b) => num(a.sort) - num(b.sort)).map(c => c.id), '_none'].filter(k => groups.has(k));
        return order.map(k => { const c = S.categories.find(x => x.id === k);
          return `<div class="rb-gh"><i style="background:${esc(c ? (c.color || catColor(c.id)) : '#94a3b8')}"></i>${c && c.icon ? esc(c.icon) + ' ' : ''}${esc(c ? c.name : 'ไม่มีหมวด')}<small>${groups.get(k).length}</small></div>` + groups.get(k).map(tile).join(''); }).join('')
          || '<div class="muted" style="padding:12px">ไม่มีสินค้าในหมวดนี้</div>'; })()}</div></div>`;
  };
  const deco = () => {
    const rcv = $('.rcv', pg); if (!rcv || rcv.dataset.d) return; rcv.dataset.d = 1;
    rcv.classList.toggle('manual', mode === 'manual');
    rcv.insertAdjacentHTML('afterbegin', `<div class="rcv-mode"><button type="button" data-md="manual" class="${mode === 'manual' ? 'on' : ''}">✍️ รับสินค้าเอง <small>ไม่มีบิล</small></button><button type="button" data-md="bill" class="${mode === 'bill' ? 'on' : ''}">📷 จากรูปบิล <small>อ่านบิลอัตโนมัติ</small></button></div>`);
    $$('[data-md]', rcv).forEach(b => b.onclick = () => { mode = b.dataset.md; localStorage.setItem('pos_rcv_mode', mode); rcv.classList.toggle('manual', mode === 'manual'); $$('[data-md]', rcv).forEach(x => x.classList.toggle('on', x === b)); $('.rb-box', rcv)?.classList.toggle('hidden', mode !== 'manual'); });
    const sb = $('#radd', rcv)?.closest('.sbox');
    if (sb) {
      sb.insertAdjacentHTML('afterend', `<div class="rcv-tools"><button type="button" class="btn p" id="rcam">📷 สแกนบาร์โค้ด</button>${canDo('edit_products') ? '<button type="button" class="btn" id="rnew">＋ สินค้าใหม่</button>' : ''}</div>`);
      $('#rcam', rcv).onclick = () => scanBarcode(code => { const add = $('#radd', pg); if (!add) return; add.value = String(code).trim(); add.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        setTimeout(() => { if (S.page === 'receive' && !$('.mbg')) $('#rcam', pg)?.click(); }, 700); });
      $('#rnew', rcv) && ($('#rnew', rcv).onclick = () => { const add = $('#radd', pg); add.value = '__new__'; const before = new Set(S.products.map(p => p.id));
        productForm({ unit: 'ชิ้น', track_stock: true, active: true }, () => { const np = S.products.find(p => !before.has(p.id)); add.value = ''; if (np) addProd(np); }); });
    }
    const lines = $('#rlines', rcv);
    lines?.insertAdjacentHTML('beforebegin', browser());
    $('.rb-box', rcv)?.classList.toggle('hidden', mode !== 'manual');
    const wireB = () => {
      $$('[data-rc]', rcv).forEach(b => b.onclick = () => { cat = b.dataset.rc; const box = $('.rb-box', rcv); box.outerHTML = browser(); wireB(); });
      $$('.rb-tile', rcv).forEach(t => t.onclick = () => addProd(S.products.find(p => p.id === t.dataset.id)));
    };
    wireB();
    const emp = $('#rlines .empty', rcv); if (emp && mode === 'manual') emp.innerHTML = '✍️<br>แตะสินค้าด้านบน สแกนบาร์โค้ด หรือพิมพ์ชื่อ เพื่อเพิ่มรายการรับเข้า<br><small>ใส่จำนวนและราคาทุน แล้วกด “รับสินค้าเข้าสต็อก”</small>';
  };
  new MutationObserver(deco).observe(pg, { childList: true }); deco();
};
