/* ================= v4.3 — unknown-barcode flow, big-picture product manager, logo avatar ================= */
{ const b = PAGES.find(p => p.id === 'barcodes'); if (b) b.ic = '🏷️'; }

/* ---------- account / shop icons show the shop logo ---------- */
const _renderShell43 = renderShell;
renderShell = function () {
  _renderShell43();
  const logo = esc(S.shop?.logo_url || 'logo-round.png');
  const av = $('#prof .av'); if (av) { av.classList.add('logo'); av.innerHTML = `<img src="${logo}" alt="">`; }
  const sb2 = $('#shopBtn'); if (sb2) { sb2.classList.add('logo'); sb2.innerHTML = `<img src="${logo}" alt="">`; }
};

/* ---------- scanning a barcode that is not in the system ---------- */
const looksCode = c => /^\d{6,14}$/.test(c) || (/^[A-Za-z0-9._-]{6,}$/.test(c) && /\d/.test(c));
const findByCode = code => S.products.find(p => p.active !== false && (p.barcode === code || p.sku === code));
async function offLookup(code) {
  if (!/^\d{8,14}$/.test(code)) return null;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_th,product_name_en,brands,image_front_url`, { signal: ctl.signal });
    const j = await r.json(); if (j.status !== 1) return null;
    const p = j.product || {};
    return { name: p.product_name_th || p.product_name || p.product_name_en || '', name_en: p.product_name_en || '', brand: (p.brands || '').split(',')[0].trim(), image: p.image_front_url || '' };
  } catch { return null; }
}
function unknownBarcode(code, qty = 1) {
  sfx('error');
  const edit = canDo('edit_products');
  const off = S.products.find(p => p.active === false && (p.barcode === code || p.sku === code));
  const m = modal('ไม่พบสินค้าบาร์โค้ดนี้', `<div class="ub-code">${ICON.barcodes}<b>${esc(code)}</b></div><div id="ubinfo" class="muted" style="text-align:center;min-height:20px">${/^\d{8,14}$/.test(code) ? 'กำลังค้นหาข้อมูลสินค้าจากฐานข้อมูลสาธารณะ…' : ''}</div>
    <div class="ub-grid">
      ${off ? `<button class="ub" data-a="on"><span>♻️</span><b>เปิดขาย “${esc(off.name)}” อีกครั้ง</b><small>สินค้านี้ถูกปิดการขายไว้</small></button>` : ''}
      ${edit ? `<button class="ub p" data-a="new"><span>➕</span><b>เพิ่มเป็นสินค้าใหม่</b><small>ใช้บาร์โค้ดนี้ ตั้งชื่อ ราคา รูป แล้วขายต่อได้ทันที</small></button>
      <button class="ub" data-a="link"><span>🔗</span><b>ผูกกับสินค้าที่มีอยู่</b><small>สินค้าเดิมที่ยังไม่มีบาร์โค้ด หรือเปลี่ยนบาร์โค้ดใหม่</small></button>` : ''}
      ${S.page === 'pos' ? `<button class="ub" data-a="quick"><span>⚡</span><b>ขายครั้งเดียว</b><small>ขายแบบสินค้านอกระบบ ไม่บันทึกเป็นสินค้า</small></button>` : ''}
    </div>${edit ? '' : '<p class="muted" style="font-size:13px">ให้ผู้จัดการหรือเจ้าของร้านเพิ่มสินค้านี้ในระบบ</p>'}`);
  let info = null;
  offLookup(code).then(r => { info = r; const el = $('#ubinfo', m); if (!el) return;
    el.innerHTML = r && r.name ? `<div class="ub-found">${r.image ? `<img src="${esc(r.image)}" alt="">` : ''}<div><small>พบข้อมูลสินค้าอัตโนมัติ</small><b>${esc(r.name)}</b>${r.brand ? `<span>${esc(r.brand)}</span>` : ''}<em>กด “เพิ่มเป็นสินค้าใหม่” — ชื่อและรูปจะเติมให้เอง</em></div></div>` : (/^\d{8,14}$/.test(code) ? 'ไม่พบข้อมูลสาธารณะ — กรอกเองได้' : ''); });
  const sellAfter = p => { if (S.page === 'pos' && p) { addToCart(p, qty); } };
  $$('[data-a]', m).forEach(b => b.onclick = async () => {
    const a = b.dataset.a; m.close();
    if (a === 'on') { try { Object.assign(off, await q(sb.from('products').update({ active: true }).eq('id', off.id).select().single())); toast('เปิดขายแล้ว', 'ok'); sellAfter(off); } catch (e) { fail(e); } }
    if (a === 'new') {
      const before = new Set(S.products.map(p => p.id));
      productForm({ barcode: code, name: info?.name || '', name_en: info?.name_en || '', brand: info?.brand || '', unit: info?.unit || 'ชิ้น', track_stock: true, active: true }, () => {
        const np = S.products.find(p => !before.has(p.id)) || findByCode(code);
        if (np && info?.image && !np.image_url) savePicFromUrl(np, info.image);
        sellAfter(np); if (S.page === 'products') go('products');
      });
    }
    if (a === 'link') productPicker('ผูกบาร์โค้ด ' + code + ' กับสินค้า', async p => {
      if (p.barcode && p.barcode !== code && !await confirmBox(`“${p.name}” มีบาร์โค้ด ${p.barcode} อยู่แล้ว\nเปลี่ยนเป็น ${code} หรือไม่?`)) return;
      try { Object.assign(p, await q(sb.from('products').update({ barcode: code }).eq('id', p.id).select().single())); toast('ผูกบาร์โค้ดแล้ว', 'ok'); sellAfter(p); } catch (e) { fail(e); }
    }, p => p.active !== false);
    if (a === 'quick') { customItem(); setTimeout(() => { const f = $$('.mbg').pop(); if (f) { const n = f.querySelector('[name=name]'); if (n) n.value = info?.name || ('สินค้า ' + code); f.querySelector('[name=qty]').value = qty; f.querySelector('[name=price]')?.focus(); } }, 80); }
  });
}
async function savePicFromUrl(p, url) {
  try { const r = await fetch(url); if (!r.ok) return; const blob = await r.blob();
    const path = `${S.shop.id}/${p.id}_${Date.now()}.jpg`;
    const { error } = await sb.storage.from('product-images').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' }); if (error) return;
    const pub = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    Object.assign(p, await q(sb.from('products').update({ image_url: pub }).eq('id', p.id).select().single()));
    if (S.page === 'pos') drawGrid();
  } catch {}
}
window.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target || !['psearch', 'gq'].includes(e.target.id)) return;
  const el = e.target, v = el.value.trim(); if (!v) return;
  let qty = 1, code = v; const mm = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qty = num(mm[1]); code = mm[2].trim(); }
  if (!looksCode(code) || findByCode(code)) return;
  if (S.page === 'pos' && typeof filtered === 'function' && filtered().length === 1) return;
  e.preventDefault(); e.stopImmediatePropagation();
  el.value = ''; S.search = ''; if (S.page === 'pos') drawGrid();
  unknownBarcode(code, qty);
}, true);
const _posView43 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView43(pg);
  const sbtn = $('#scanBtn'); if (sbtn) sbtn.onclick = () => scanBarcode(code => { const hit = findByCode(code); if (hit) { sfx('scan'); addToCart(hit); } else unknownBarcode(code); });
};

/* ---------- PRODUCTS: big-picture card manager (default) + table view ---------- */
let PVIEW = { mode: localStorage.getItem('pos_pview') || 'cards' };
const _products43 = VIEWS.products;
VIEWS.products = pg => {
  _products43(pg);
  const bar = $('#ps', pg)?.closest('.row'); if (!bar) return;
  bar.style.flexWrap = 'wrap';
  bar.insertAdjacentHTML('beforeend', `<div class="seg" id="pvm"><button data-m="cards">🖼️ รูปใหญ่</button><button data-m="table">☰ ตาราง</button></div>${pmColBar('pzs')}`);
  ['#pc', '#pf'].forEach(s => { if ($(s, pg)) $(s, pg).style.display = 'none'; });
  bar.insertAdjacentHTML('afterend', '<div class="pills" id="upills"></div>');
  pg.insertAdjacentHTML('beforeend', '<div class="bcs-wrap" id="pcats"></div><div class="pmgrid" id="pmg"></div>');
  const redraw = () => $('#pf', pg).dispatchEvent(new Event('change'));   // list mode and card mode both listen
  const FL = [['', 'ทั้งหมด'], ['low', '⚠️ ใกล้หมด'], ['out', '⛔ หมด'], ['exp', '⌛ ใกล้หมดอายุ'], ['nopic', '🖼️ ไม่มีรูป'], ['nobc', '🏷️ ไม่มีบาร์โค้ด'], ['off', '🚫 ปิดขาย']];
  const hint = pg.querySelector('p.muted');
  const draw = () => {
    const cards = PVIEW.mode === 'cards';
    $$('#pvm button', pg).forEach(b => b.classList.toggle('on', b.dataset.m === PVIEW.mode));
    const sv = $('#ps', pg).value.toLowerCase(), inS = S.products.filter(p => (!sv || p.name.toLowerCase().includes(sv) || (p.barcode || '').includes(sv) || (p.sku || '').toLowerCase().includes(sv)) && psCatOK(p, PSF.cat));
    $('#upills', pg).innerHTML = FL.map(([k, l]) => { const n = inS.filter(p => psStatusOK(p, k) && (k === 'off' || k === '' || p.active !== false)).length; return n || !k || PSF.f === k ? `<button data-uf="${k}" class="${PSF.f === k ? 'on' : ''}">${l} <small>${n}</small></button>` : ''; }).join('');
    $$('#upills [data-uf]', pg).forEach(b => b.onclick = () => { PSF.f = b.dataset.uf; redraw(); });
    $$('.ustat[data-us]').forEach(x => x.classList.toggle('on', !!PSF.f && x.dataset.us === PSF.f));
    $('#plist', pg).style.display = cards ? 'none' : ''; $('#pzs', pg).style.display = $('#pcats', pg).style.display = cards ? '' : 'none'; if (hint) hint.style.display = cards ? 'none' : '';
    const g = $('#pmg', pg); g.style.display = cards ? '' : 'none'; if (!cards) return;
    const cols = pmColGet('p'), px = pmPxFor(pg, cols); const cv = $('#pzs .colv', pg); if (cv) cv.textContent = cols + ' / แถว';
    g.style.gridTemplateColumns = `repeat(${cols},minmax(0,1fr))`; g.style.setProperty('--pm', px + 'px');
    const v = sv, c = PSF.cat, f = PSF.f;
    const list = S.products.filter(p => (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)) && psCatOK(p, c) && psStatusOK(p, f) && (f === 'off' || p.active !== false || !f)).sort((a, b) => (a.active === false) - (b.active === false) || a.name.localeCompare(b.name, 'th'));
    const card = p => { const st = !p.track_stock ? '' : p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'; const pr = itemPromosFor(p)[0];
      return `<div class="pm ${p.active === false ? 'off' : ''}" data-id="${p.id}">
        <div class="pm-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : `background:linear-gradient(135deg,${esc(p.tile_color || catColor(p.category_id))},${esc(p.tile_color || catColor(p.category_id))}aa)`}">
          ${p.image_url ? '' : `<span>${esc([...p.name].slice(0, 2).join(''))}</span>`}
          ${p.favorite ? '<i class="pm-fav">★</i>' : ''}${pr || num(p.promo_price) > 0 ? `<i class="pm-promo">🏷️ ${esc(pr ? promoLabel(pr) : 'โปร ฿' + money(p.promo_price))}</i>` : ''}${p.active === false ? '<i class="pm-off">ปิดขาย</i>' : ''}
          <div class="pm-acts">${canDo('manage_inventory') && p.track_stock ? '<button data-act="in" title="รับเข้า">➕</button><button data-act="out" title="เบิกออก">➖</button>' : ''}<button data-act="edit" title="แก้ไขสินค้า">✏️</button></div></div>
        <div class="pm-body"><b class="pm-name">${esc(p.name)}</b>
          <div class="pm-row"><span class="pm-price">${baht(num(p.promo_price) > 0 ? p.promo_price : p.price)}</span>${num(p.promo_price) > 0 ? `<s class="muted">${money(p.price)}</s>` : ''}<span class="sp"></span>${p.track_stock ? `<span class="chip ${st}">${qtyf(p.stock)} ${esc(p.unit)}</span>` : ''}</div>
          <div class="pm-meta">${p.barcode ? `<code>${esc(p.barcode)}</code>` : '<span class="chip warn">ไม่มีบาร์โค้ด</span>'}<span>${esc(catName(p.category_id))}</span></div></div></div>`; };
    const catList = S.products.filter(p => (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)));
    $('#pcats', pg).innerHTML = catSlideBar(c, catList.filter(p => psStatusOK(p, f) && (f === 'off' || p.active !== false || !f)), { none: true, manage: canDo('edit_products') });
    $$('#pcats [data-cat]', pg).forEach(b => b.onclick = () => { PSF.cat = b.dataset.cat; redraw(); ($('#pg') || pg).scrollTo({ top: 0, behavior: 'smooth' }); });
    const cm = $('#pcats [data-catmanage]', pg); if (cm) cm.onclick = () => $('#catBtn')?.click();
    catSpy(pg, '#pcats', '#pmg', c);
    g.innerHTML = list.slice(0, 600).map(card).join('')
      + (list.length ? '' : '<div class="empty" style="grid-column:1/-1">ไม่พบสินค้า</div>');
    $('#pcount', pg).textContent = `${list.length} รายการ${list.length > 600 ? ' (แสดง 600 แรก)' : ''}`;
  };
  $('#pmg', pg).onclick = e => {
    if (e.target.closest('#pmAdd')) return productForm({ unit: 'ชิ้น', track_stock: true, active: true }, draw);
    const el = e.target.closest('.pm[data-id]'); if (!el) return; const p = S.products.find(x => x.id === el.dataset.id); if (!p) return;
    const act = e.target.closest('[data-act]')?.dataset.act;
    const again = () => go('products');
    if (act === 'in' || act === 'out') return stockForm(p, act, again);
    if (act === 'edit' || !canDo('manage_inventory')) return productForm(p, again);
    stockQuick(p, again);   // one card for everything: receive, remove, count, damaged, expired, edit, picture, label, history
  };
  $$('#pvm button', pg).forEach(b => b.onclick = () => { PVIEW.mode = b.dataset.m; localStorage.setItem('pos_pview', PVIEW.mode); draw(); });
  $$('#pzs [data-z]', pg).forEach(b => b.onclick = () => { pmColStep('p', +b.dataset.z); draw(); });
  ['#ps', '#pc', '#pf'].forEach(s => $(s, pg)?.addEventListener(s === '#ps' ? 'input' : 'change', draw));
  /* scanning in the product search: open that product, or offer to add it */
  $('#ps', pg)?.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const code = e.target.value.trim(); if (!looksCode(code)) return;
    const hit = S.products.find(p => p.barcode === code || p.sku === code); e.target.value = ''; draw();
    if (hit) productForm(hit, draw); else unknownBarcode(code); });
  draw();
};
