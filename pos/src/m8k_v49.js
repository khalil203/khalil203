/* ================= v4.9 — per-product promotion / unit / category setup inside the product form,
   animated & highlighted cashier menu (promo tiles, deal progress, upsell hints, "โปรวันนี้" tab) ================= */

const prodPromos = p => p?.id ? S.promotions.filter(pr => (pr.scope || 'bill') !== 'bill' && promoHits(pr, p)) : [];
const unitPrice = p => num(p.promo_price) > 0 ? num(p.promo_price) : num(p.price);
const dealText = pr => pr.kind === 'bundle' ? `${num(pr.buy_qty) || 2} ชิ้น ฿${money(pr.value).replace(/\.00$/, '')}` : promoLabel(pr);

/* ---------- product form: units chips, category chips, promotions of this product ---------- */
const _productForm49 = productForm;
productForm = function (p = {}, after) {
  const before = new Set(S.products.map(x => x.id));
  const pending = []; // promos to create after a new product is saved
  let formEl = null;
  const after2 = async (...a) => {
    const prod = p?.id ? S.products.find(x => x.id === p.id) : S.products.find(x => !before.has(x.id));
    if (prod && pending.length) {
      try { for (const t of pending) { const r = await q(sb.from('promotions').insert({ ...promoRow(t, prod), shop_id: S.shop.id }).select().single()); S.promotions.push(r); }
        toast(`ตั้งโปรโมชั่น ${pending.length} รายการให้ ${prod.name} แล้ว`, 'ok'); } catch (e) { fail(e); }
    }
    return after?.(...a);
  };
  _productForm49(p, after2);
  const m = $$('.mbg').pop(); if (!m) return;
  formEl = $('form', m) || m;
  const prod = p?.id ? S.products.find(x => x.id === p.id) || p : null;

  // unit chips
  const us = $('[name=unit]', m);
  if (us && !$('.pf-chips.u', m)) {
    us.closest('.fg, label, div')?.insertAdjacentHTML('beforeend', '<div class="pf-chips u"></div>');
    const drawU = () => { const box = $('.pf-chips.u', m); if (!box) return;
      box.innerHTML = UNITS.slice(0, 10).map(u => `<button type="button" data-u="${esc(u)}" class="${us.value === u ? 'on' : ''}">${esc(u)}</button>`).join('');
      $$('[data-u]', box).forEach(b => b.onclick = () => { if (![...us.options].some(o => o.value === b.dataset.u)) us.insertAdjacentHTML('beforeend', `<option>${esc(b.dataset.u)}</option>`); us.value = b.dataset.u; us.dispatchEvent(new Event('change')); drawU(); preview(); }); };
    us.addEventListener('change', drawU); drawU();
    $('#punitm', m)?.addEventListener('click', () => setTimeout(() => { const mm = $$('.mbg').pop(); const o = mm?.close; if (o) mm.close = () => { o(); drawU(); }; }, 0));
  }
  // category chips
  const cs = $('[name=category_id]', m);
  if (cs && !$('.pf-chips.c', m)) {
    cs.closest('.fg, label, div')?.insertAdjacentHTML('beforeend', '<div class="pf-chips c"></div>');
    const drawC = () => { const box = $('.pf-chips.c', m); if (!box) return;
      box.innerHTML = [...S.categories].sort((a, b) => num(a.sort) - num(b.sort)).map(c => `<button type="button" data-c="${c.id}" class="${cs.value === c.id ? 'on' : ''}" style="--cc:${esc(c.color || '#6366f1')}">${c.icon ? esc(c.icon) + ' ' : '<i></i>'}${esc(c.name)}</button>`).join('')
        + '<button type="button" data-c="+" class="add">＋ หมวดใหม่</button>';
      $$('[data-c]', box).forEach(b => b.onclick = () => {
        if (b.dataset.c === '+') return $('#pcatm', m)?.click();
        cs.value = cs.value === b.dataset.c ? '' : b.dataset.c; cs.dispatchEvent(new Event('change')); drawC(); }); };
    cs.addEventListener('change', drawC); drawC();
    new MutationObserver(drawC).observe(cs, { childList: true });
  }

  // promotions section
  if (!canDo('promotions')) return;
  formEl.insertAdjacentHTML('beforeend', `<div class="pf-promo full" id="pfpro">
    <div class="pf-ph"><b>🏷️ โปรโมชั่นของสินค้านี้</b><small class="muted">ตั้งได้หลายขั้น เช่น 3 ชิ้น 100 · 6 ชิ้น 190 — แคชเชียร์คิดให้อัตโนมัติ</small></div>
    <div id="pfexist"></div>
    <div class="pf-new">
      <div class="seg" id="pfk"><button type="button" data-k="bundle" class="on">🛒 ซื้อ X ราคา ฿</button><button type="button" data-k="bxgy">🎁 ซื้อ X แถม Y</button><button type="button" data-k="percent">％ ลด %</button><button type="button" data-k="fixed_price">🏷️ ราคาพิเศษ/ชิ้น</button></div>
      <div class="pf-row">
        <label class="pf-buy">ซื้อ <input class="in" type="number" min="1" step="1" id="pfb" value="3"> ชิ้น</label>
        <label class="pf-get">แถม <input class="in" type="number" min="1" step="1" id="pfg" value="1"> ชิ้น</label>
        <label class="pf-val"><span id="pfvl">ราคา</span> <input class="in" type="number" min="0" step="any" id="pfv" value=""> <span id="pfvu">บาท</span></label>
        <button type="button" class="btn p" id="pfadd">＋ เพิ่มโปร</button></div>
      <div class="pf-more"><label><input type="checkbox" id="pftime"> จำกัดวัน/เวลา</label><span id="pftw" class="hidden"><input class="in" type="date" id="pfs"> ถึง <input class="in" type="date" id="pfe"> <input class="in" type="time" id="pft1"> – <input class="in" type="time" id="pft2"></span></div>
      <div class="pf-prev" id="pfprev"></div></div>
    <div id="pfpend"></div></div>`);
  let kind = 'bundle';
  const priceNow = () => { const pr = num($('[name=promo_price]', m)?.value) || num($('[name=price]', m)?.value) || unitPrice(prod || {}); return pr; };
  const cur = () => ({ kind, buy_qty: num($('#pfb', m).value) || 1, get_qty: num($('#pfg', m).value) || 1, value: num($('#pfv', m).value),
    starts_on: $('#pftime', m).checked ? $('#pfs', m).value || null : null, ends_on: $('#pftime', m).checked ? $('#pfe', m).value || null : null,
    time_from: $('#pftime', m).checked ? $('#pft1', m).value : '', time_to: $('#pftime', m).checked ? $('#pft2', m).value : '' });
  const nameOf = t => { const n = $('[name=name]', m)?.value.trim() || prod?.name || 'สินค้า';
    return `${n} ${t.kind === 'bundle' ? `ซื้อ ${t.buy_qty} ชิ้น ${money(t.value).replace(/\.00$/, '')}` : t.kind === 'bxgy' ? `ซื้อ ${t.buy_qty} แถม ${t.get_qty}` : t.kind === 'percent' ? `ลด ${t.value}%` : `ราคาพิเศษ ${money(t.value)}`}`; };
  function preview() {
    const t = cur(), pr = priceNow(), el = $('#pfprev', m); if (!el) return;
    $('.pf-buy', m).style.display = ['bundle', 'bxgy'].includes(kind) ? '' : 'none';
    $('.pf-get', m).style.display = kind === 'bxgy' ? '' : 'none';
    $('.pf-val', m).style.display = kind === 'bxgy' ? 'none' : '';
    $('#pfvl', m).textContent = kind === 'bundle' ? 'ราคารวม' : kind === 'percent' ? 'ลด' : 'ราคาพิเศษ';
    $('#pfvu', m).textContent = kind === 'percent' ? '%' : kind === 'bundle' ? 'บาท' : 'บาท/ชิ้น';
    if (!pr) { el.innerHTML = '<span class="muted">ใส่ราคาขายก่อนเพื่อดูตัวอย่าง</span>'; return; }
    const qn = kind === 'bundle' ? t.buy_qty : kind === 'bxgy' ? t.buy_qty + t.get_qty : 1;
    const d = promoLineDisc(t, qn, pr), full = qn * pr;
    el.innerHTML = d > 0 ? `ตัวอย่าง: ${qn} ${esc(us?.value || 'ชิ้น')} ปกติ <s>฿${money(full)}</s> → <b>฿${money(full - d)}</b> <span class="pf-save">ประหยัด ฿${money(d)} (${Math.round(d / full * 100)}%)</span>${kind === 'bundle' ? ` · เฉลี่ย ฿${money((full - d) / qn)}/ชิ้น` : ''}`
      : '<span class="pf-warn">⚠️ ราคาโปรนี้ไม่ได้ถูกกว่าราคาปกติ</span>';
  }
  const drawExist = () => {
    const box = $('#pfexist', m), list = prod ? prodPromos(prod) : [];
    box.innerHTML = list.map(pr => `<div class="pf-it ${pr.active ? '' : 'off'}" data-pid="${pr.id}"><span class="pf-badge">${esc(dealText(pr))}</span><span class="pf-n">${esc(pr.name)}<small>${pr.scope === 'category' ? 'ทั้งหมวด' : arr(pr.product_ids).length > 1 ? `ร่วมกับสินค้าอื่น ${arr(pr.product_ids).length - 1} รายการ${pr.mix ? ' (คละได้)' : ''}` : 'เฉพาะสินค้านี้'}${promoLive(pr) ? ' · <b class="ok">ใช้งานอยู่</b>' : pr.active ? ' · รอช่วงเวลา' : ' · ปิดอยู่'}</small></span>
      <label class="sw" title="เปิด/ปิด"><input type="checkbox" data-on ${pr.active ? 'checked' : ''}><i></i></label><button type="button" class="btn sm" data-ed>แก้ไข</button><button type="button" class="btn sm bad" data-rm title="ลบ">✕</button></div>`).join('');
    $$('.pf-it', box).forEach(row => { const pr = S.promotions.find(x => x.id === row.dataset.pid);
      $('[data-on]', row).onchange = async e => { try { Object.assign(pr, await q(sb.from('promotions').update({ active: e.target.checked }).eq('id', pr.id).select().single())); drawExist(); } catch (er) { fail(er); } };
      $('[data-ed]', row).onclick = () => promoForm(pr, drawExist);
      $('[data-rm]', row).onclick = async () => {
        const solo = pr.scope === 'product' && arr(pr.product_ids).length <= 1;
        if (!(await confirmBox(solo ? `ลบโปร “${pr.name}”?` : pr.scope === 'category' ? `โปรนี้ใช้กับทั้งหมวด — ลบโปร “${pr.name}” ทั้งหมด?` : `เอาสินค้านี้ออกจากโปร “${pr.name}”?`))) return;
        try { if (solo || pr.scope === 'category') { await q(sb.from('promotions').delete().eq('id', pr.id)); S.promotions = S.promotions.filter(x => x !== pr); }
          else Object.assign(pr, await q(sb.from('promotions').update({ product_ids: arr(pr.product_ids).filter(i => i !== prod.id) }).eq('id', pr.id).select().single()));
          drawExist(); toast('ลบแล้ว', 'ok'); } catch (er) { fail(er); } };
    });
  };
  const drawPend = () => { $('#pfpend', m).innerHTML = pending.map((t, i) => `<div class="pf-it pend"><span class="pf-badge">${esc(dealText(t))}</span><span class="pf-n">${esc(t.name)}<small>จะบันทึกพร้อมสินค้า</small></span><button type="button" class="btn sm bad" data-px="${i}">✕</button></div>`).join('');
    $$('[data-px]', m).forEach(b => b.onclick = () => { pending.splice(+b.dataset.px, 1); drawPend(); }); };
  $$('#pfk [data-k]', m).forEach(b => b.onclick = () => { kind = b.dataset.k; $$('#pfk [data-k]', m).forEach(x => x.classList.toggle('on', x === b));
    if (kind === 'bundle') { $('#pfb', m).value = 3; $('#pfv', m).value = Math.floor(priceNow() * 3 * 0.9) || ''; } if (kind === 'bxgy') { $('#pfb', m).value = 2; $('#pfg', m).value = 1; }
    if (kind === 'percent') $('#pfv', m).value = 10; if (kind === 'fixed_price') $('#pfv', m).value = Math.floor(priceNow() * 0.9) || ''; preview(); });
  $('#pftime', m).onchange = e => $('#pftw', m).classList.toggle('hidden', !e.target.checked);
  ['#pfb', '#pfg', '#pfv'].forEach(s => $(s, m).oninput = preview);
  ['[name=price]', '[name=promo_price]', '[name=name]'].forEach(s => $(s, m)?.addEventListener('input', preview));
  $('#pfadd', m).onclick = async () => {
    const t = cur();
    if (kind === 'bundle' && (t.buy_qty < 2 || t.value <= 0)) return toast('ใส่จำนวน (2 ขึ้นไป) และราคารวม เช่น 3 ชิ้น 100 บาท', 'bad');
    if (kind === 'percent' && (t.value <= 0 || t.value > 100)) return toast('ส่วนลด % ต้อง 1–100', 'bad');
    if (kind === 'fixed_price' && t.value <= 0) return toast('ใส่ราคาพิเศษต่อชิ้น', 'bad');
    t.name = nameOf(t);
    if (prod?.id) {
      try { const r = await q(sb.from('promotions').insert({ ...promoRow(t, prod), shop_id: S.shop.id }).select().single()); S.promotions.push(r); drawExist(); sfx('ok'); toast('เพิ่มโปรแล้ว ✓', 'ok');
        $('#pfprev', m).classList.remove('flash'); void $('#pfprev', m).offsetWidth; $('#pfprev', m).classList.add('flash'); } catch (e) { fail(e); }
    } else { pending.push(t); drawPend(); sfx('add'); }
  };
  $('#pfpro', m).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#pfadd', m).click(); } });
  if (!$('#pfv', m).value) $('#pfv', m).value = Math.floor(priceNow() * 3 * 0.9) || '';
  drawExist(); preview();
};
function promoRow(t, prod) {
  return { name: t.name, scope: 'product', kind: t.kind, value: num(t.value), buy_qty: num(t.buy_qty) || 1, get_qty: num(t.get_qty) || 1, mix: false, min_total: 0,
    product_ids: [prod.id], category_ids: [], days: [], time_from: t.time_from || '', time_to: t.time_to || '', starts_on: t.starts_on || null, ends_on: t.ends_on || null,
    members_only: false, auto: false, active: true, note: 'ตั้งจากหน้าสินค้า' };
}

/* ---------- cashier menu: highlighted, animated tiles ---------- */
const bestTop = () => { const ids = Object.entries(BEST || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]); return new Set(ids); };
const _productCard49 = productCard;
productCard = function (p) {
  let h = _productCard49(p).replace(/<i class="promo-rb">[\s\S]*?<\/i>/, '');
  const prs = itemPromosFor(p), pr = prs[0];
  const cls = [];
  let badges = '';
  if (pr) {
    cls.push('deal');
    badges += `<i class="deal-rb"><span>🔥 ${esc(dealText(pr))}</span>${prs.length > 1 ? `<em>+${prs.length - 1}</em>` : ''}</i>`;
  } else if (num(p.promo_price) > 0 && num(p.price) > num(p.promo_price)) {
    cls.push('deal');
    badges += `<i class="deal-rb off"><span>ลด ${Math.round((1 - p.promo_price / p.price) * 100)}%</span></i>`;
  }
  if (bestTop().has(p.id)) { cls.push('hot'); badges += '<i class="hot-b">🔥 ขายดี</i>'; }
  if (p.created_at && new Date(p.created_at) > new Date('2026-11-04T15:00:00Z') && Date.now() - new Date(p.created_at) < 3 * 864e5) badges += '<i class="new-b">ใหม่</i>';
  const bp = prs.find(x => x.kind === 'bundle' || x.kind === 'bxgy');
  if (bp) badges += `<i class="deal-prog" data-dp="${p.id}"></i>`;
  h = h.replace('<button class="more"', badges + '<button class="more"');
  return cls.length ? h.replace('class="pcard', `class="pcard ${cls.join(' ')}`) : h;
};

/* live tile state after every cart change: in-cart count bounce + deal progress (e.g. 2/3) */
function dealNeed(pr, qtyIn) {
  const X = pr.kind === 'bxgy' ? (num(pr.buy_qty) || 1) + (num(pr.get_qty) || 1) : (num(pr.buy_qty) || 2);
  const r = qtyIn % X; return { X, have: r, need: r ? X - r : 0, sets: Math.floor(qtyIn / X) };
}
function mixQty(pr) { return S.cart.filter(l => !l.noPromo && promoHits(pr, S.products.find(x => x.id === l.product_id))).reduce((a, l) => a + Math.floor(num(l.qty)), 0); }
function refreshTiles() {
  const g = $('#pgrid'); if (!g) return;
  $$('.pcard', g).forEach(c => {
    const id = c.dataset.id, p = S.products.find(x => x.id === id); if (!p) return;
    const qn = S.cart.filter(l => l.product_id === id).reduce((a, l) => a + num(l.qty) * (num(l.factor) || 1), 0);
    const img = $('.img', c); let ic = $('.incart', c);
    if (qn) { if (!ic) { img?.insertAdjacentHTML('beforeend', '<i class="incart"></i>'); ic = $('.incart', c); }
      if (ic.textContent !== qtyf(qn)) { ic.textContent = qtyf(qn); ic.classList.remove('bump2'); void ic.offsetWidth; ic.classList.add('bump2'); } }
    else ic?.remove();
    c.classList.toggle('picked', !!qn);
    const dp = $('.deal-prog', c); if (!dp) return;
    const pr = itemPromosFor(p).find(x => x.kind === 'bundle' || x.kind === 'bxgy'); if (!pr) { dp.innerHTML = ''; return; }
    const tot = pr.mix ? mixQty(pr) : Math.floor(qn), d = dealNeed(pr, tot);
    dp.classList.toggle('show', tot > 0);
    dp.classList.toggle('done', tot > 0 && !d.need);
    dp.innerHTML = tot > 0 ? (d.need ? `<b style="--p:${d.have / d.X}">${d.have}/${d.X}</b><span>อีก ${d.need} ได้โปร!</span>` : `<b style="--p:1">✓</b><span>ได้โปรแล้ว ${d.sets} ชุด</span>`) : '';
  });
}

/* cart: upsell hint per line ("add 1 more to get 3 for ฿100") + celebrate when a deal kicks in */
const _pdSeen = new WeakMap();
const _drawCart49 = drawCart;
drawCart = function () {
  _drawCart49();
  const el = $('#cart'); if (!el) return refreshTiles();
  $$('.citem', el).forEach(row => {
    const i = +($('[data-i]', row)?.dataset.i ?? -1), l = S.cart[i]; if (!l) return;
    const p = S.products.find(x => x.id === l.product_id); if (!p || l.noPromo) return;
    const pr = itemPromosFor(p).find(x => x.kind === 'bundle' || x.kind === 'bxgy');
    if (pr) {
      const tot = pr.mix ? mixQty(pr) : Math.floor(num(l.qty)), d = dealNeed(pr, tot);
      if (d.need && d.need <= Math.max(2, d.X - 1)) {
        $('.nm', row).insertAdjacentHTML('beforeend', `<button type="button" class="upsell" data-ups="${i}" data-n="${d.need}">🔥 ＋${d.need} ${pr.kind === 'bxgy' ? 'รับของแถม' : `ได้ ${dealText(pr)}`}</button>`);
      }
    }
    const prev = _pdSeen.get(l) || 0;
    if (num(l._pd) > prev + 0.001) { row.classList.add('dealhit'); if (prev === 0) sfx('ok'); setTimeout(() => row.classList.remove('dealhit'), 1200); }
    _pdSeen.set(l, num(l._pd));
  });
  $$('[data-ups]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const l = S.cart[+b.dataset.ups]; if (!l) return;
    const pr = itemPromosFor(S.products.find(x => x.id === l.product_id))?.find(x => x.kind === 'bundle' || x.kind === 'bxgy');
    if (pr?.mix) { addToCart(S.products.find(x => x.id === l.product_id), +b.dataset.n); } else { l.qty = num(l.qty) + (+b.dataset.n); sfx('add'); drawCart(); } });
  refreshTiles();
};

/* "โปรวันนี้" tab on the sell screen */
const _filtered49 = filtered;
filtered = function () {
  if (S.cat !== 'promo') return _filtered49();
  S.cat = 'all'; try { return _filtered49().filter(p => itemPromosFor(p).length || num(p.promo_price) > 0); } finally { S.cat = 'promo'; }
};
const promoCount = () => S.products.filter(p => p.active && (itemPromosFor(p).length || num(p.promo_price) > 0)).length;
let _pcT = 0, _pcN = 0;
new MutationObserver(() => {
  const cats = $('#cats'); if (!cats || $('[data-c=promo]', cats)) return;
  if (Date.now() - _pcT > 3000) { _pcT = Date.now(); _pcN = promoCount(); }
  const n = _pcN; if (!n) return;
  const all = $('[data-c=all]', cats);
  (all || cats.firstChild)?.insertAdjacentHTML(all ? 'afterend' : 'beforebegin', `<button class="tab promo-tab ${S.cat === 'promo' ? 'on' : ''}" data-c="promo">🔥 โปรวันนี้ <small>${n}</small></button>`);
  $('[data-c=promo]', cats).onclick = () => { S.cat = 'promo'; $$('#cats .tab').forEach(t => t.classList.toggle('on', t.dataset.c === 'promo')); drawGrid(); };
}).observe(document.body, { childList: true, subtree: true });

/* grid re-render also refreshes the live tile state */
const _drawGrid49 = drawGrid;
drawGrid = function () { _drawGrid49(); refreshTiles(); };
const _moreTiles49 = moreTiles;
moreTiles = function (g) { _moreTiles49(g); refreshTiles(); };

/* "+1" float on tap */
document.addEventListener('click', e => {
  const c = e.target.closest('#pgrid .pcard'); if (!c || e.target.closest('.more') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = c.getBoundingClientRect(), f = document.createElement('div'); f.className = 'plus1'; f.textContent = '+1';
  f.style.left = (e.clientX || r.left + r.width / 2) + 'px'; f.style.top = (e.clientY || r.top + 30) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 700);
}, true);
