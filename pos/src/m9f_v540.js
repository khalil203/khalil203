/* v5.4.0 — barcode / label page: big picture cards, grouped by category, swipeable category slider, tap card to select */
function bcCatSlider(cat, tab, v, list) {
  const base = S.products.filter(p => p.active !== false);
  const cnt = id => base.filter(p => (id === '_none' ? !p.category_id : p.category_id === id)).length;
  const cats = S.categories.filter(c => cnt(c.id));
  const none = cnt('_none');
  const chip = (id, label, n, color) => `<button class="bcs-chip ${cat === id ? 'on' : ''}" data-bcc="${id}" style="--cc:${color || 'var(--brand)'}"><i></i><span>${esc(label)}</span><b>${n}</b></button>`;
  return `<div class="bcs-wrap"><div class="bcs">${chip('', 'ทั้งหมด', base.length)}${cats.map(c => chip(c.id, c.name, cnt(c.id), c.color || catColor(c.id))).join('')}${none ? chip('_none', 'ไม่มีหมวด', none, '#94a3b8') : ''}</div></div>`;
}
function bcCard(p, on, isPromo) {
  const bg = p.tile_color || catColor(p.category_id);
  const img = isImg(p) ? `<div class="bcg-img" style="background-image:url('${esc(p.image_url)}')"></div>` : `<div class="bcg-img ph" style="background:${esc(bg)}"><span>${esc((p.name || '?').trim().charAt(0))}</span></div>`;
  const badEan = p.barcode && /^\d{13}$/.test(p.barcode) && !validEAN(p.barcode);
  return `<div class="bcg-card ${on ? 'on' : ''}" data-id="${p.id}">${img}<i class="bcg-ck">✓</i>${isPromo(p) ? '<span class="bcg-promo">🏷️ โปร</span>' : ''}
    <div class="bcg-body"><b class="bcg-nm">${esc(p.name)}</b>
      <div class="bcg-pr">฿${money(p.price)}${p.track_stock ? `<span>เหลือ ${qtyf(p.stock)}</span>` : ''}</div>
      <div class="bcg-code">${p.barcode ? `<code>${esc(p.barcode)}</code>${badEan ? '<span class="chip bad">เลขตรวจผิด</span>' : ''}` : '<span class="chip warn">ไม่มีบาร์โค้ด</span>'}</div>
      <div class="bcg-act"><button class="btn sm" data-ed="${p.id}" title="แก้บาร์โค้ด">✏️</button><button class="btn sm" data-sc="${p.id}" title="สแกนบาร์โค้ด">📷</button>${p.barcode ? '' : `<button class="btn sm p" data-g="${p.id}">สร้าง</button>`}</div></div></div>`;
}
function bcGrid(rows, chosen, isPromo, grouped) {
  if (!rows.length) return '<div class="empty card">ไม่มีสินค้าในรายการนี้</div>';
  if (!grouped) return `<div class="bcg">${rows.map(p => bcCard(p, chosen.has(p.id), isPromo)).join('')}</div>`;
  const groups = new Map();
  rows.forEach(p => { const k = p.category_id || '_none'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
  const order = [...S.categories.map(c => c.id), '_none'].filter(k => groups.has(k));
  return order.map(k => { const c = S.categories.find(x => x.id === k), list = groups.get(k);
    return `<section class="bcg-sec"><h3 class="bcg-h"><i style="background:${esc(c?.color || (c ? catColor(c.id) : '#94a3b8'))}"></i>${esc(c?.name || 'ไม่มีหมวด')}<small>${list.length}</small></h3>
      <div class="bcg">${list.map(p => bcCard(p, chosen.has(p.id), isPromo)).join('')}</div></section>`; }).join('');
}
function bcSelBar(n) {
  let el = $('#bcSel');
  if (!n || S.page !== 'barcodes') { el?.remove(); return; }
  if (!el) { document.body.insertAdjacentHTML('beforeend', '<button id="bcSel" class="bc-selbar"></button>'); el = $('#bcSel'); el.onclick = () => $('#bprint')?.click(); }
  el.innerHTML = `🖨️ พิมพ์ฉลาก <b>${n}</b> รายการที่เลือก`;
}
const _go540 = go; go = function (...a) { if (a[0] !== 'barcodes') $('#bcSel')?.remove(); return _go540.apply(this, a); };
