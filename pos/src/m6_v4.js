/* ================= Shop POS v4 — promotions engine, data center, barcodes, personal use,
   activity log, branding, receipt image, cashier upgrades, auto-update ================= */
const APP_VERSION = '5.6.3';
Object.assign(TH, { 'Data center': 'ศูนย์ข้อมูล', 'Barcodes': 'บาร์โค้ด', 'Branches': 'สาขา' });
PAGES.splice(PAGES.findIndex(p => p.id === 'settings'), 0,
  { id: 'barcodes', ic: '🏷', name: 'Barcodes', roles: ['owner', 'manager', 'stock'] },
  { id: 'data', ic: '🗂️', name: 'Data center', roles: ['owner', 'manager', 'stock'] },
  { id: 'branches', ic: '🏬', name: 'Branches', roles: ['owner'] });
Object.assign(PAGE_PERM, { barcodes: 'edit_products', data: 'edit_products', branches: 'manage_settings' });
Object.assign(PAGE_DESC, {
  barcodes: 'สินค้าที่มี / ไม่มีบาร์โค้ด · สร้างบาร์โค้ดอัตโนมัติ · พิมพ์ฉลากติดสินค้า',
  data: 'แม่แบบ Excel ทุกประเภท · นำเข้า / แก้ไขจำนวนมาก · สำรองและกู้คืนข้อมูลทั้งร้าน',
  branches: 'สาขาทั้งหมดของคุณ · เปรียบเทียบยอดขาย กำไร และสต็อกแต่ละสาขา',
  promotions: 'โปรโมชั่นรายสินค้า / หมวด / ทั้งบิล · ซื้อ X แถม Y · ราคาชุด · ช่วงวัน-เวลา',
});
ICON.data = SVG('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>');
ICON.barcodes = SVG('<path d="M3 5v14M6 5v14M10 5v14M13 5v14M17 5v14M21 5v14M8 5v14"/>');
ICON.branches = SVG('<path d="M3 21h18M5 21V10l4-3 4 3v11M13 21V6l3-2 3 2v15"/><path d="M8 13h2M8 17h2M15.5 10h1M15.5 14h1"/>');
MOVE.personal = ['🙋', 'เบิกใช้ส่วนตัว'];
Object.assign(AUDIT_L, {
  login: 'เข้าสู่ระบบ', logout: 'ออกจากระบบ', stock_in: 'รับสินค้าเข้า', stock_out: 'เบิกสินค้าออก', stock_personal: 'เบิกใช้ส่วนตัว',
  insert_products: 'เพิ่มสินค้า', delete_products: 'ลบสินค้า', insert_categories: 'เพิ่มหมวดหมู่', update_categories: 'แก้ไขหมวดหมู่', delete_categories: 'ลบหมวดหมู่',
  insert_customers: 'เพิ่มลูกค้า', update_customers: 'แก้ไขลูกค้า', delete_customers: 'ลบลูกค้า', insert_suppliers: 'เพิ่มผู้จำหน่าย', update_suppliers: 'แก้ไขผู้จำหน่าย', delete_suppliers: 'ลบผู้จำหน่าย',
  insert_promotions: 'สร้างโปรโมชั่น', update_promotions: 'แก้ไขโปรโมชั่น', delete_promotions: 'ลบโปรโมชั่น', insert_expenses: 'บันทึกค่าใช้จ่าย', update_expenses: 'แก้ไขค่าใช้จ่าย', delete_expenses: 'ลบค่าใช้จ่าย',
  import: 'นำเข้าข้อมูล', restore: 'กู้คืนข้อมูล', backup: 'สำรองข้อมูล', barcode_generate: 'สร้างบาร์โค้ด',
});
const ACT_GROUP = { delete: '🗑️ การลบประวัติ', login: 'เข้า/ออกระบบ', logout: 'เข้า/ออกระบบ', stock: 'สต็อก', product: 'สินค้า', sale: 'การขาย', staff: 'พนักงาน', data: 'ข้อมูล/ตั้งค่า', other: 'อื่นๆ' };
const actGroup = a => a === 'delete_history' ? 'delete' : /^log(in|out)$/.test(a) ? 'login' : /^stock_|transfer|receive_purchase/.test(a) ? 'stock' : /product/.test(a) ? 'product'
  : /sale|refund|payment|tax_invoice|shift|cash_/.test(a) ? 'sale' : /^staff|permissions/.test(a) ? 'staff' : /import|restore|backup|settings|barcode/.test(a) ? 'data' : 'other';
const logAct = (action, entity, id, detail) => sb.rpc('log_action', { p_shop: S.shop.id, p_action: action, p_entity: entity || '', p_id: id || '', p_detail: detail || {} }).then(() => {}, () => {});
let H2C_P = null, JSB_P = null;
const loadH2C = () => (H2C_P ||= loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'));
const loadJsBarcode = () => (JSB_P ||= loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'));
function saveBlob(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
const safeName = s => String(s).replace(/[^\w.\-]+/g, '_');

/* ===================================================================== PROMOTIONS ENGINE */
const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const PKIND = { percent: 'ลด %', amount: 'ลดบาท / ชิ้น', fixed_price: 'ราคาพิเศษ / ชิ้น', bxgy: 'ซื้อ X แถม Y', bundle: 'ซื้อ X ชิ้น ราคาพิเศษ ฿ (เช่น 3 ชิ้น 100)' };
const PSCOPE = { product: 'เฉพาะสินค้าที่เลือก', category: 'ทั้งหมวดหมู่', bill: 'ทั้งบิล' };
const arr = v => Array.isArray(v) ? v : [];
function promoLive(p, now = new Date()) {
  if (!p || !p.active) return false;
  const d = ymd(now);
  if (p.starts_on && p.starts_on > d) return false;
  if (p.ends_on && p.ends_on < d) return false;
  if (arr(p.days).length && !arr(p.days).map(Number).includes(now.getDay())) return false;
  const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  if (p.time_from && hm < p.time_from) return false;
  if (p.time_to && hm > p.time_to) return false;
  if (p.members_only && !S.customer) return false;
  return true;
}
const promoHits = (pr, prod) => prod && (pr.scope === 'product' ? arr(pr.product_ids).includes(prod.id) : pr.scope === 'category' ? arr(pr.category_ids).includes(prod.category_id) : false);
function promoLineDisc(pr, qty, price) {
  const v = num(pr.value), q2 = num(qty), p = num(price);
  switch (pr.kind) {
    case 'percent': return p * q2 * Math.min(100, v) / 100;
    case 'amount': return Math.min(p, v) * q2;
    case 'fixed_price': return Math.max(0, p - v) * q2;
    case 'bxgy': { const b = num(pr.buy_qty) || 1, g = num(pr.get_qty) || 1; return Math.floor(q2 / (b + g)) * g * p; }
    case 'bundle': { const b = num(pr.buy_qty) || 2; return Math.max(0, Math.floor(q2 / b) * (b * p - v)); }
  }
  return 0;
}
const promoLabel = pr => pr.kind === 'percent' ? `ลด ${num(pr.value)}%` : pr.kind === 'amount' ? `ลด ฿${money(pr.value)}` : pr.kind === 'fixed_price' ? `เหลือ ฿${money(pr.value)}`
  : pr.kind === 'bxgy' ? `ซื้อ ${num(pr.buy_qty) || 1} แถม ${num(pr.get_qty) || 1}` : pr.kind === 'bundle' ? `ซื้อ ${num(pr.buy_qty) || 2} ชิ้น ฿${money(pr.value)}${pr.mix ? ' (คละได้)' : ''}` : '';
function itemPromosFor(prod) { return S.promotions.filter(p => (p.scope || 'bill') !== 'bill' && promoLive(p) && promoHits(p, prod)); }
function applyItemPromos() {
  S.cart.forEach(l => {
    l._pd = 0; l._pn = '';
    const prod = S.products.find(x => x.id === l.product_id); if (!prod || l.noPromo) return;
    for (const pr of itemPromosFor(prod)) {
      if (pr.kind === 'bundle' && pr.mix) continue;
      const d = r2(Math.min(promoLineDisc(pr, l.qty, l.price), l.price * l.qty - num(l.discount)));
      if (d > l._pd) { l._pd = d; l._pn = pr.name; }
    }
  });
  // mix & match: "buy X (any items in this promo) for ฿Y" — counted across all matching cart lines
  for (const pr of S.promotions.filter(p => p.kind === 'bundle' && p.mix && (p.scope || 'bill') !== 'bill' && promoLive(p))) {
    const X = num(pr.buy_qty) || 2, Y = num(pr.value);
    const lines = S.cart.filter(l => !l.noPromo && promoHits(pr, S.products.find(x => x.id === l.product_id)));
    const units = []; lines.forEach(l => { for (let i = 0; i < Math.floor(num(l.qty)); i++) units.push(l); });
    const sets = Math.floor(units.length / X); if (!sets) continue;
    units.sort((a, b) => num(b.price) - num(a.price));
    const used = units.slice(0, sets * X), full = used.reduce((a, l) => a + num(l.price), 0), disc = full - sets * Y;
    if (disc <= 0) continue;
    const per = new Map(); used.forEach(l => per.set(l, (per.get(l) || 0) + num(l.price)));
    per.forEach((amt, l) => { const d = r2(Math.min(disc * amt / full, l.price * l.qty - num(l.discount))); if (d > l._pd) { l._pd = d; l._pn = pr.name; } });
  }
}
calc = function () {
  applyItemPromos();
  const sh = S.shop;
  const gross = r2(S.cart.reduce((a, l) => a + l.price * l.qty - num(l.discount), 0));
  const itemPromo = r2(S.cart.reduce((a, l) => a + num(l._pd), 0));
  const subtotal = r2(gross - itemPromo);
  const billDiscOf = p => p.kind === 'percent' ? subtotal * num(p.value) / 100 : num(p.value);
  const okBill = p => p && (p.scope || 'bill') === 'bill' && promoLive(p) && subtotal >= num(p.min_total);
  let pr = S.promo && okBill(S.promo) ? S.promo : null;
  if (!S.promo && !S.promoOff) pr = S.promotions.filter(p => p.auto && okBill(p)).sort((a, b) => billDiscOf(b) - billDiscOf(a))[0] || null;
  const promoDisc = pr ? billDiscOf(pr) : 0;
  S._billPromo = pr && promoDisc > 0 ? pr.name : '';
  const billDisc = S.billDiscPct ? subtotal * num(S.billDisc) / 100 : num(S.billDisc);
  const maxPts = S.customer ? num(S.customer.points) : 0;
  const pointsUse = Math.min(num(S.pointsUse), maxPts);
  const pointsDisc = pointsUse * num(sh.baht_per_point);
  const discount = r2(Math.min(subtotal, promoDisc + billDisc + pointsDisc));
  const after = r2(subtotal - discount);
  const rate = num(sh.vat_rate);
  let vat = 0, total = after;
  if (sh.vat_mode === 'included') vat = r2(after * rate / (100 + rate));
  if (sh.vat_mode === 'excluded') { vat = r2(after * rate / 100); total = r2(after + vat); }
  const pointsEarned = S.customer ? Math.floor(total * num(sh.points_per_baht)) : 0;
  return { gross, itemPromo, subtotal, promoDisc: r2(promoDisc), billDisc: r2(billDisc), pointsUse, pointsDisc: r2(pointsDisc), discount, vat, total, pointsEarned };
};

/* sale payload: item promo → line discount, custom items, promo names */
const _submitSale4 = submitSale;
submitSale = async function (payload) {
  if (!payload._v4) {
    payload._v4 = 1;
    payload.items = (payload.items || []).map((it, i) => {
      const l = S.cart[i], o = { ...it };
      if (l && num(l._pd)) { o.discount = r2(num(o.discount) + num(l._pd)); o.promo = l._pn; }
      if (String(o.product_id || '').startsWith('c_')) { o.product_id = null; o.cost = num(l?.cost); }
      return o;
    });
    const names = [...new Set(S.cart.map(l => l._pn).filter(Boolean))]; if (S._billPromo) names.push(S._billPromo);
    payload.promo = names.join(', ');
    if (S._billPromo && !payload.note) payload.note = 'โปรโมชั่น: ' + S._billPromo;
  }
  const r = await _submitSale4(payload);
  S.cart.forEach(l => { if (num(l._pd)) { l.discount = r2(num(l.discount) + l._pd); l.promo = l._pn; l._pd = 0; l.noPromo = true; } });
  return r;
};

/* cart: promo tags, wholesale mode, custom item */
const _drawCart4 = drawCart;
drawCart = function () {
  _drawCart4();
  const el = $('#cart'); if (!el) return;
  const c = calc();
  $$('#promoSel option', el).forEach(o => { const p = S.promotions.find(x => x.id === o.value); if (p && (p.scope || 'bill') !== 'bill') o.remove(); });
  if (!S.promo && S._billPromo) { const sel = $('#promoSel', el); if (sel) sel.options[0].textContent = '🏷️ อัตโนมัติ: ' + S._billPromo; }
  $$('.citem', el).forEach(row => {
    const i = +($('[data-i]', row)?.dataset.i ?? -1), l = S.cart[i]; if (!l) return;
    if (num(l._pd)) {
      $('.nm', row).insertAdjacentHTML('beforeend', `<small class="ptag">🏷️ ${esc(l._pn)} −${money(l._pd)}</small>`);
      const b = row.querySelector(':scope > b'); if (b) b.innerHTML = `<s class="muted" style="font-size:11px;font-weight:400">${money(l.price * l.qty - num(l.discount))}</s><br>${money(l.price * l.qty - num(l.discount) - l._pd)}`;
    }
    if (String(l.product_id).startsWith('c_')) $('.nm', row).insertAdjacentHTML('beforeend', '<small class="ptag" style="background:var(--infosoft);color:var(--info)">สินค้านอกระบบ</small>');
  });
  const ft = $('.ft', el);
  if (ft && c.itemPromo > 0) ft.insertAdjacentHTML('afterbegin', `<div class="tline" style="color:var(--ok)"><span>🏷️ ประหยัดจากโปรโมชั่นสินค้า</span><span>−${money(c.itemPromo)}</span></div>`);
  const hd = $('.hd', el);
  if (hd && !$('#wsBtn', el)) {
    hd.insertAdjacentHTML('beforeend', `<button class="btn sm ${S.wholesale ? 'p' : ''}" id="wsBtn" title="ราคาส่ง">${S.wholesale ? '📦 ราคาส่ง' : '📦'}</button>`);
    $('#wsBtn', el).onclick = () => { S.wholesale = !S.wholesale; S.cart.forEach(l => repriceLine(l)); toast(S.wholesale ? 'โหมดราคาส่ง — ใช้ราคาส่งกับสินค้าที่ตั้งไว้' : 'กลับเป็นราคาปลีก', 'ok'); drawCart(); };
  }
  if ($('[data-u]', el)) $$('[data-u]', el).forEach(b => { const l = S.cart[+b.dataset.u]; if (l && String(l.product_id).startsWith('c_')) b.onclick = () => { l.qty++; sfx('add'); drawCart(); }; });
};
function repriceLine(l) {
  const p = S.products.find(x => x.id === l.product_id); if (!p || l.unit) return;
  const retail = num(p.promo_price) > 0 ? num(p.promo_price) : num(p.price);
  l.price = S.wholesale && num(p.wholesale_price) > 0 ? num(p.wholesale_price) : retail;
}
const _addToCart4 = addToCart;
addToCart = function (p, qty = 1, u = null) {
  _addToCart4(p, qty, u);
  if (S.wholesale && p && !u) { const l = S.cart.find(x => x.product_id === p.id && !x.unit); if (l) { repriceLine(l); drawCart(); } }
};
const _resetSale4 = resetSale;
resetSale = function () { S.promoOff = false; _resetSale4(); };
function customItem() {
  formModal('สินค้านอกระบบ / ขายด่วน', [
    { k: 'name', label: 'ชื่อสินค้า', req: true, full: true }, { k: 'price', label: 'ราคาขาย / หน่วย', type: 'number', req: true },
    { k: 'qty', label: 'จำนวน', type: 'number', def: 1 }, { k: 'cost', label: 'ต้นทุน / หน่วย (ถ้าทราบ)', type: 'number', def: 0 }], { qty: 1 }, async o => {
    if (!(num(o.price) >= 0) || !o.name) throw new Error('กรุณากรอกชื่อและราคา');
    const id = 'c_' + uid();
    S.cart.push({ product_id: id, id, name: o.name, price: num(o.price), qty: num(o.qty) || 1, discount: 0, unit: '', factor: 1, cost: num(o.cost) });
    sfx('add'); drawCart();
  });
}

/* product card: promo ribbon */
const _productCard4 = productCard;
productCard = function (p) {
  const h = _productCard4(p);
  const pr = itemPromosFor(p)[0];
  return pr ? h.replace('<button class="more"', `<i class="promo-rb">🏷️ ${esc(promoLabel(pr))}</i><button class="more"`) : h;
};

/* ===================================================================== POS screen upgrades */
const _posView4 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView4(pg);
  const vb = $('#viewBtn'); if (!vb || $('#zctl')) return;
  vb.insertAdjacentHTML('afterend', `<div class="zctl" id="zctl" title="ขนาดรูปสินค้า">
      <button type="button" data-z="-20" aria-label="เล็กลง">−</button>
      <input type="range" id="zr" min="100" max="560" step="10" value="${VIEWP.size}" aria-label="ขนาดรูปสินค้า">
      <button type="button" data-z="20" aria-label="ใหญ่ขึ้น">+</button>
      <button type="button" id="zlay" title="ตาราง / รายการ">${VIEWP.layout === 'list' ? '▦' : '☰'}</button></div>
    <button class="btn" id="custBtn" title="สินค้านอกระบบ">➕ <span class="hide-sm">ขายด่วน</span></button>
    <div class="zpre" id="zpre">${[[110, 'S'], [160, 'M'], [220, 'L'], [300, 'XL'], [400, 'XXL'], [520, 'จัมโบ้']].map(([v, l]) => `<button type="button" data-zs="${v}" class="${VIEWP.size === v ? 'on' : ''}">${l}</button>`).join('')}</div>`);
  const setSize = v => { VIEWP.size = Math.max(100, Math.min(560, v)); $$('#zpre [data-zs]').forEach(b => b.classList.toggle('on', +b.dataset.zs === VIEWP.size)); $('#zr').value = VIEWP.size; localStorage.setItem('pos_view', JSON.stringify(VIEWP)); applyView(); };
  $('#zr').oninput = e => setSize(+e.target.value);
  $$('#zctl [data-z]').forEach(b => b.onclick = () => setSize(VIEWP.size + +b.dataset.z));
  $('#zlay').onclick = () => { VIEWP.layout = VIEWP.layout === 'list' ? 'grid' : 'list'; saveView(); $('#zlay').textContent = VIEWP.layout === 'list' ? '▦' : '☰'; };
  $('#custBtn').onclick = customItem;
  $$('#zpre [data-zs]').forEach(b => b.onclick = () => setSize(+b.dataset.zs));
};
drawPreview = function () {
  const box = $('#rprev'); if (!box) return;
  const c = calc(), sh = S.shop;
  box.innerHTML = `<div class="rp-h">ตัวอย่างใบเสร็จ</div><div class="rp-paper">
    ${sh.logo_url ? `<div class="c"><img src="${esc(sh.logo_url)}" alt="" style="max-height:40px;max-width:120px"></div>` : ''}
    <div class="c b">${esc(sh.name)}</div><div class="c muted" style="font-size:11px">${dLong(new Date())} · ${esc(S.shop._name || '')}</div>
    <div class="rp-cust">${S.customer ? `ลูกค้า: <b>${esc(S.customer.name)}</b>` : 'ลูกค้าทั่วไป'}</div>
    ${S.cart.length ? S.cart.map(l => `<div class="rp-l"><span>${esc(l.name)}<small>${qtyf(l.qty)} × ${money(l.price)}${l._pd ? ` · 🏷️ −${money(l._pd)}` : ''}</small></span><b>${money(l.qty * l.price - num(l.discount) - num(l._pd))}</b></div>`).join('') : '<div class="muted c" style="padding:20px 0">ยังไม่มีสินค้า</div>'}
    <div class="rp-t"><span>ยอดรวม</span><span>${money(c.subtotal)}</span></div>${c.discount ? `<div class="rp-t"><span>ส่วนลด${S._billPromo ? ' (' + esc(S._billPromo) + ')' : ''}</span><span>-${money(c.discount)}</span></div>` : ''}
    ${sh.vat_mode !== 'none' ? `<div class="rp-t"><span>VAT ${num(sh.vat_rate)}%</span><span>${money(c.vat)}</span></div>` : ''}<div class="rp-t big"><span>ยอดสุทธิ</span><span>${baht(c.total)}</span></div>
    <div class="rp-bar"></div></div>`;
};

/* ===================================================================== RECEIPT IMAGE (gallery) */
async function receiptImage(sale, { auto = false } = {}) {
  const box = $$('.mbg').pop()?.querySelector('.rcptbox'); if (!box) return;
  try {
    await loadH2C();
    const node = box.firstElementChild || box;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const name = safeName(`receipt_${sale.bill_no || ymd(new Date())}.png`);
    const file = new File([blob], name, { type: 'image/png' });
    if (!auto && navigator.canShare?.({ files: [file] }) && matchMedia('(pointer:coarse)').matches) {
      try { await navigator.share({ files: [file], title: 'ใบเสร็จ ' + (sale.bill_no || '') }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    saveBlob(name, blob);
    toast(auto ? 'บันทึกรูปใบเสร็จอัตโนมัติแล้ว (โฟลเดอร์ดาวน์โหลด / แกลเลอรี)' : 'บันทึกรูปใบเสร็จแล้ว', 'ok');
  } catch (e) { if (!auto) fail(e); }
}
const _showReceipt4 = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceipt4(sale, items, cust, autoPrint);
  const mf = $$('.mbg').pop()?.querySelector('.mf');
  if (mf && !$('#rimg', mf)) { mf.insertAdjacentHTML('afterbegin', '<button class="btn" id="rimg">🖼️ บันทึกเป็นรูป</button>'); $('#rimg', mf).onclick = () => receiptImage(sale); }
  if (S.shop.auto_save_receipt && sale.created_at && Date.now() - new Date(sale.created_at) < 120000) setTimeout(() => receiptImage(sale, { auto: true }), 500);
};

/* ===================================================================== PROMOTIONS PAGE */
VIEWS.promotions = pg => {
  const edit = canDo('promotions');
  $('#tact').innerHTML = edit ? '<button class="btn p" id="npr">+ สร้างโปรโมชั่น</button>' : '';
  const draw = () => {
    const now = new Date();
    const st = p => !p.active ? ['ปิด', ''] : promoLive({ ...p, members_only: false }, now) ? ['ใช้งานอยู่', 'ok'] : (p.ends_on && p.ends_on < ymd(now)) ? ['หมดอายุ', 'bad'] : ['รอเวลา', 'warn'];
    const target = p => p.scope === 'product' ? arr(p.product_ids).map(id => S.products.find(x => x.id === id)?.name).filter(Boolean).slice(0, 3).join(', ') + (arr(p.product_ids).length > 3 ? ` +${arr(p.product_ids).length - 3}` : '')
      : p.scope === 'category' ? arr(p.category_ids).map(id => S.categories.find(x => x.id === id)?.name).filter(Boolean).join(', ') : `ยอดขั้นต่ำ ฿${money(p.min_total)}`;
    pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">ใช้งานอยู่ตอนนี้</div><div class="v">${S.promotions.filter(p => st(p)[1] === 'ok').length}</div></div>
      <div class="stat"><div class="k">โปรสินค้า / หมวด</div><div class="v">${S.promotions.filter(p => (p.scope || 'bill') !== 'bill').length}</div></div>
      <div class="stat"><div class="k">โปรทั้งบิล</div><div class="v">${S.promotions.filter(p => (p.scope || 'bill') === 'bill').length}</div></div></div>
      <p class="muted" style="font-size:13px">โปรสินค้า/หมวดหมู่ ใช้ให้อัตโนมัติเมื่อสินค้าอยู่ในตะกร้า · โปรทั้งบิลเลือกได้ในตะกร้า หรือเปิด “ใช้อัตโนมัติ” · ดูผลโปรในรายงาน “โปรโมชั่น”</p>
      ${S.promotions.length ? `<div class="tblwrap"><table class="tbl"><tr><th>ชื่อ</th><th>ประเภท</th><th>ใช้กับ</th><th>เงื่อนไข</th><th>ช่วงเวลา</th><th>สถานะ</th><th></th></tr>
      ${S.promotions.map(p => { const s = st(p); return `<tr><td><b>${esc(p.name)}</b>${p.members_only ? ' <span class="chip">⭐ สมาชิก</span>' : ''}${p.auto && (p.scope || 'bill') === 'bill' ? ' <span class="chip">อัตโนมัติ</span>' : ''}</td>
        <td>${esc(PKIND[p.kind] || p.kind)}<br><small class="muted">${esc(promoLabel(p))}</small></td><td>${esc(PSCOPE[p.scope || 'bill'])}<br><small class="muted">${esc(target(p))}</small></td>
        <td><small>${num(p.min_total) ? 'ขั้นต่ำ ฿' + money(p.min_total) : '—'}</small></td>
        <td><small>${p.starts_on || p.ends_on ? `${p.starts_on ? dOnly(p.starts_on) : '…'} – ${p.ends_on ? dOnly(p.ends_on) : '…'}` : 'ไม่จำกัดวัน'}<br>${arr(p.days).length ? arr(p.days).map(d => DAYS_TH[d]).join(' ') : 'ทุกวัน'}${p.time_from || p.time_to ? ` · ${p.time_from || '00:00'}–${p.time_to || '23:59'}` : ''}</small></td>
        <td><span class="chip ${s[1]}">${s[0]}</span></td>
        <td class="right" style="white-space:nowrap">${edit ? `<button class="btn sm" data-e="${p.id}">แก้ไข</button> <button class="btn sm" data-t="${p.id}">${p.active ? 'ปิด' : 'เปิด'}</button> <button class="btn sm bad" data-x="${p.id}">ลบ</button>` : ''}</td></tr>`; }).join('')}</table></div>`
      : '<div class="empty">🏷️<br>ยังไม่มีโปรโมชั่น — กด “สร้างโปรโมชั่น”</div>'}`;
    $$('[data-e]', pg).forEach(b => b.onclick = () => promoForm(S.promotions.find(p => p.id === b.dataset.e), draw));
    $$('[data-t]', pg).forEach(b => b.onclick = async () => { const p = S.promotions.find(x => x.id === b.dataset.t);
      try { Object.assign(p, await q(sb.from('promotions').update({ active: !p.active }).eq('id', p.id).select().single())); draw(); } catch (e) { fail(e); } });
    $$('[data-x]', pg).forEach(b => b.onclick = async () => { const p = S.promotions.find(x => x.id === b.dataset.x);
      if (!await confirmBox(`ลบโปรโมชั่น “${p.name}” ?`)) return;
      try { await q(sb.from('promotions').delete().eq('id', p.id)); S.promotions = S.promotions.filter(x => x.id !== p.id); draw(); } catch (e) { fail(e); } });
  };
  if ($('#npr')) $('#npr').onclick = () => promoForm(null, draw);
  draw();
};
function promoForm(p, after) {
  const o = p ? { ...p } : { name: '', scope: 'product', kind: 'percent', value: 10, buy_qty: 1, get_qty: 1, min_total: 0, members_only: false, active: true, auto: false, days: [], product_ids: [], category_ids: [], time_from: '', time_to: '', starts_on: '', ends_on: '', note: '' };
  const sel = new Set(arr(o.product_ids)), cats = new Set(arr(o.category_ids)), days = new Set(arr(o.days).map(Number));
  const m = modal(p ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่น', `<form id="pf">
    <div class="ptpl"><span class="muted">เริ่มเร็ว:</span><button type="button" data-tp="b3">🛒 ซื้อ 3 ราคา 100</button><button type="button" data-tp="b3mix">🧺 คละ 3 ชิ้น 100</button><button type="button" data-tp="bxgy">🎁 ซื้อ 2 แถม 1</button><button type="button" data-tp="pct">％ ลด 10%</button><button type="button" data-tp="fix">🏷️ ราคาพิเศษ/ชิ้น</button></div>
    <div class="fg"><label class="f">ชื่อโปรโมชั่น *</label><input class="in" name="name" required value="${esc(o.name)}" placeholder="เช่น ซื้อ 2 แถม 1 น้ำดื่ม"></div>
    <div class="grid2"><div class="fg"><label class="f">ใช้กับ</label><select class="in" name="scope">${Object.entries(PSCOPE).map(([k, l]) => `<option value="${k}" ${o.scope === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">รูปแบบ</label><select class="in" name="kind"></select></div></div>
    <div class="grid2"><div class="fg" id="fv"><label class="f" id="lv">ค่า</label><input class="in" name="value" type="number" step="any" value="${num(o.value)}"></div>
      <div class="fg" id="fb"><label class="f" id="lb">ซื้อ (ชิ้น)</label><input class="in" name="buy_qty" type="number" step="1" min="1" value="${num(o.buy_qty) || 1}"></div>
      <div class="fg" id="fg"><label class="f">แถม (ชิ้น)</label><input class="in" name="get_qty" type="number" step="1" min="1" value="${num(o.get_qty) || 1}"></div>
      <label class="row fg" id="fmix" style="grid-column:1/-1"><input type="checkbox" name="mix" ${o.mix ? 'checked' : ''}> 🧺 คละสินค้าได้ — นับรวมทุกสินค้าในโปรนี้ (เช่น น้ำ A 1 + น้ำ B 2 = 3 ชิ้น ได้ราคา 100)</label>
      <div class="fg" id="fm"><label class="f">ยอดซื้อขั้นต่ำ (บาท)</label><input class="in" name="min_total" type="number" step="any" value="${num(o.min_total)}"></div></div>
    <div id="pick"></div>
    <div class="fg"><label class="f">วันที่ใช้ได้ (ไม่เลือก = ทุกวัน)</label><div class="pills" id="pd">${DAYS_TH.map((d, i) => `<button type="button" data-d="${i}" class="${days.has(i) ? 'on' : ''}">${d}</button>`).join('')}</div></div>
    <div class="grid2"><div class="fg"><label class="f">เวลาเริ่ม (ไม่ระบุ = ทั้งวัน)</label><input class="in" type="time" name="time_from" value="${esc(o.time_from)}"></div>
      <div class="fg"><label class="f">เวลาสิ้นสุด</label><input class="in" type="time" name="time_to" value="${esc(o.time_to)}"></div>
      <div class="fg"><label class="f">วันเริ่ม</label><input class="in" type="date" name="starts_on" value="${esc(o.starts_on || '')}"></div>
      <div class="fg"><label class="f">วันสิ้นสุด</label><input class="in" type="date" name="ends_on" value="${esc(o.ends_on || '')}"></div></div>
    <label class="row"><input type="checkbox" name="members_only" ${o.members_only ? 'checked' : ''}> เฉพาะสมาชิก</label>
    <label class="row" id="fa"><input type="checkbox" name="auto" ${o.auto ? 'checked' : ''}> ใช้อัตโนมัติเมื่อยอดถึงขั้นต่ำ (โปรทั้งบิล)</label>
    <label class="row"><input type="checkbox" name="active" ${o.active ? 'checked' : ''}> เปิดใช้งาน</label>
    <div class="fg"><label class="f">หมายเหตุ</label><input class="in" name="note" value="${esc(o.note || '')}"></div>
    <div class="card" id="pprev" style="background:var(--brandsoft);margin-top:8px"></div></form>`,
    { wide: true, foot: `<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="psv">💾 บันทึก</button>` });
  const f = $('#pf', m);
  const kinds = () => f.scope.value === 'bill' ? ['percent', 'amount'] : Object.keys(PKIND);
  const fillKinds = () => { const cur = f.kind.value || o.kind; f.kind.innerHTML = kinds().map(k => `<option value="${k}" ${k === cur ? 'selected' : ''}>${f.scope.value === 'bill' && k === 'amount' ? 'ลดเป็นบาท (ทั้งบิล)' : PKIND[k]}</option>`).join(''); };
  const drawPick = () => {
    const sc = f.scope.value, box = $('#pick', m);
    if (sc === 'bill') { box.innerHTML = ''; return; }
    if (sc === 'category') { box.innerHTML = `<div class="fg"><label class="f">เลือกหมวดหมู่ (${cats.size})</label><div class="pills">${S.categories.map(c => `<button type="button" data-cat="${c.id}" class="${cats.has(c.id) ? 'on' : ''}">${esc(c.name)}</button>`).join('') || '<span class="muted">ยังไม่มีหมวดหมู่</span>'}</div></div>`;
      $$('[data-cat]', box).forEach(b => b.onclick = () => { cats.has(b.dataset.cat) ? cats.delete(b.dataset.cat) : cats.add(b.dataset.cat); drawPick(); preview(); }); return; }
    box.innerHTML = `<div class="fg"><label class="f">เลือกสินค้า (${sel.size} รายการ)</label><div class="sbox"><span>🔍</span><input class="in" id="ps" placeholder="ค้นหาชื่อ / บาร์โค้ด"></div>
      <div id="pl" style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:12px;margin-top:6px"></div></div>`;
    const list = () => { const v = $('#ps', box).value.toLowerCase();
      const rows = S.products.filter(p => p.active && (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v))).sort((a, b) => (sel.has(b.id) - sel.has(a.id)) || a.name.localeCompare(b.name, 'th')).slice(0, 150);
      $('#pl', box).innerHTML = rows.map(p => `<label class="row" style="padding:7px 10px;border-bottom:1px solid var(--line);gap:10px"><input type="checkbox" data-pid="${p.id}" ${sel.has(p.id) ? 'checked' : ''}>
        <span style="flex:1">${esc(p.name)}</span><small class="muted">฿${money(p.price)}</small></label>`).join('') || '<div class="muted" style="padding:10px">ไม่พบสินค้า</div>';
      $$('[data-pid]', box).forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.pid) : sel.delete(c.dataset.pid); $('label.f', box).textContent = `เลือกสินค้า (${sel.size} รายการ)`; preview(); }); };
    $('#ps', box).oninput = list; list();
  };
  const preview = () => {
    const k = f.kind.value, sc = f.scope.value;
    $('#fb', m).style.display = ['bxgy', 'bundle'].includes(k) ? '' : 'none';
    $('#fg', m).style.display = k === 'bxgy' ? '' : 'none';
    $('#fv', m).style.display = k === 'bxgy' ? 'none' : '';
    $('#fmix', m).style.display = k === 'bundle' && sc !== 'bill' ? '' : 'none';
    $('#fm', m).style.display = sc === 'bill' ? '' : 'none';
    $('#fa', m).style.display = sc === 'bill' ? '' : 'none';
    $('#lv', m).textContent = { percent: 'ส่วนลด (%)', amount: 'ลด (บาท)', fixed_price: 'ราคาพิเศษ / ชิ้น (บาท)', bundle: 'ราคาพิเศษรวม (บาท) — เช่น 100' }[k] || 'ค่า';
    $('#lb', m).textContent = k === 'bundle' ? 'ซื้อครบ (ชิ้น) — เช่น 3' : 'ซื้อ (ชิ้น)';
    const t0 = { kind: k, value: num(f.value.value), buy_qty: num(f.buy_qty.value), get_qty: num(f.get_qty.value), mix: f.mix.checked };
    const ex = sc === 'bill' ? '' : (() => { const p0 = S.products.find(p => sel.has(p.id)) || S.products.find(p => cats.has(p.category_id)); if (!p0) return '';
      const q0 = k === 'bxgy' ? (t0.buy_qty || 1) + (t0.get_qty || 1) : k === 'bundle' ? (t0.buy_qty || 2) : 1;
      const d = promoLineDisc(t0, q0, num(p0.promo_price) > 0 ? p0.promo_price : p0.price);
      return `<br>ตัวอย่าง: ${esc(p0.name)} × ${q0} = ฿${money(q0 * (num(p0.promo_price) > 0 ? p0.promo_price : p0.price))} → ลด ฿${money(d)} จ่าย <b>฿${money(q0 * (num(p0.promo_price) > 0 ? p0.promo_price : p0.price) - d)}</b>`; })();
    const avg = k === 'bundle' && t0.buy_qty ? `<br>เฉลี่ยชิ้นละ ฿${money(t0.value / t0.buy_qty)} · ซื้อ ${t0.buy_qty * 2} ชิ้น = ฿${money(t0.value * 2)} · ชิ้นที่ไม่ครบชุดคิดราคาปกติ` : '';
    $('#pprev', m).innerHTML = `<b>สรุป:</b> ${esc(promoLabel(t0))} · ${esc(PSCOPE[sc])}${ex}${avg}`;
  };
  f.scope.onchange = () => { fillKinds(); drawPick(); preview(); };
  f.oninput = preview;
  $$('#pd [data-d]', m).forEach(b => b.onclick = () => { const d = +b.dataset.d; days.has(d) ? days.delete(d) : days.add(d); b.classList.toggle('on'); });
  fillKinds(); drawPick(); preview();
  $$('[data-tp]', m).forEach(b => b.onclick = () => {
    const tp = { b3: ['bundle', 100, 3, 1, false, 'ซื้อ 3 ชิ้น 100'], b3mix: ['bundle', 100, 3, 1, true, 'คละ 3 ชิ้น 100'], bxgy: ['bxgy', 0, 2, 1, false, 'ซื้อ 2 แถม 1'], pct: ['percent', 10, 1, 1, false, 'ลด 10%'], fix: ['fixed_price', 0, 1, 1, false, 'ราคาพิเศษ'] }[b.dataset.tp];
    if (f.scope.value === 'bill') { f.scope.value = 'product'; fillKinds(); drawPick(); }
    f.kind.value = tp[0]; if (tp[1]) f.value.value = tp[1]; f.buy_qty.value = tp[2]; f.get_qty.value = tp[3]; f.mix.checked = tp[4];
    if (!f.name.value.trim() || f.dataset.auto) { f.name.value = (f.dataset.pre || '') + tp[5]; f.dataset.auto = tp[0]; }
    $$('[data-tp]', m).forEach(x => x.classList.toggle('on', x === b)); preview(); f.value.focus();
  });
  f.name.addEventListener('input', () => { delete f.dataset.auto; });
  f.addEventListener('input', e => { if (!f.dataset.auto || e.target === f.name || !['value', 'buy_qty', 'get_qty', 'mix'].includes(e.target.name)) return;
    const k = f.kind.value, v = num(f.value.value), b = num(f.buy_qty.value), g = num(f.get_qty.value);
    const nm = k === 'bundle' ? `${f.mix.checked ? 'คละ' : 'ซื้อ'} ${b} ชิ้น ${money(v).replace(/\.00$/, '')}` : k === 'bxgy' ? `ซื้อ ${b} แถม ${g}` : k === 'percent' ? `ลด ${v}%` : k === 'fixed_price' ? `ราคาพิเศษ ${v}` : '';
    if (nm) f.name.value = (f.dataset.pre || '') + nm; });
  $('[data-c]', m).onclick = m.close;
  $('#psv', m).onclick = async () => {
    const sc = f.scope.value, row = { shop_id: S.shop.id, name: f.name.value.trim(), scope: sc, kind: f.kind.value, value: num(f.value.value), buy_qty: num(f.buy_qty.value), get_qty: num(f.get_qty.value),
      min_total: sc === 'bill' ? num(f.min_total.value) : 0, product_ids: sc === 'product' ? [...sel] : [], category_ids: sc === 'category' ? [...cats] : [], days: [...days].sort(),
      time_from: f.time_from.value, time_to: f.time_to.value, starts_on: f.starts_on.value || null, ends_on: f.ends_on.value || null,
      mix: f.kind.value === 'bundle' && sc !== 'bill' && f.mix.checked, members_only: f.members_only.checked, auto: sc === 'bill' && f.auto.checked, active: f.active.checked, note: f.note.value.trim() };
    if (!row.name) return toast('กรุณาตั้งชื่อโปรโมชั่น', 'bad');
    if (sc === 'product' && !sel.size) return toast('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ', 'bad');
    if (sc === 'category' && !cats.size) return toast('กรุณาเลือกหมวดหมู่', 'bad');
    if (row.kind === 'bundle' && (row.buy_qty < 2 || row.value <= 0)) return toast('ใส่จำนวนชิ้น (2 ขึ้นไป) และราคาพิเศษ เช่น ซื้อ 3 ชิ้น ราคา 100', 'bad');
    if (row.kind === 'percent' && (row.value <= 0 || row.value > 100)) return toast('ส่วนลด % ต้องอยู่ระหว่าง 1–100', 'bad');
    try {
      const r = p ? await q(sb.from('promotions').update(row).eq('id', p.id).select().single()) : await q(sb.from('promotions').insert(row).select().single());
      if (p) Object.assign(p, r); else S.promotions.push(r);
      m.close(); toast('บันทึกโปรโมชั่นแล้ว', 'ok'); after?.();
    } catch (e) { fail(e); }
  };
}

/* ===================================================================== PERSONAL USE (stock) */
const _stockForm4 = stockForm;
stockForm = function (p, kind, after) {
  if (kind !== 'personal') return _stockForm4(p, kind, after);
  const me = S.shop._name || S.user.email.split('@')[0];
  formModal(`🙋 เบิกใช้ส่วนตัว · ${p.name}`, [
    { k: 'qty', label: `จำนวน (${p.unit}) — คงเหลือ ${qtyf(p.stock)}`, type: 'number', req: true },
    { k: 'who', label: 'ผู้เบิก', def: me }, { k: 'why', label: 'เหตุผล / ใช้ทำอะไร', full: true }], { who: me }, async o => {
    if (!(num(o.qty) > 0)) throw new Error('กรุณากรอกจำนวนให้ถูกต้อง');
    await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: p.id, p_kind: 'personal', p_qty: num(o.qty), p_cost: null, p_supplier: null, p_note: `ผู้เบิก: ${o.who || me}${o.why ? ' · ' + o.why : ''}` }));
    Object.assign(p, await q(sb.from('products').select('*').eq('id', p.id).single()));
    toast(`บันทึกเบิกใช้ส่วนตัว ${qtyf(o.qty)} ${p.unit} (มูลค่าทุน ฿${money(num(o.qty) * num(p.cost))})`, 'ok');
    after?.();
  });
};
const _stockView4 = VIEWS.stock;
VIEWS.stock = pg => {
  _stockView4(pg);
  /* personal use lives in the cashier screen (🙋 ใช้เอง), not here */
};

/* ===================================================================== BARCODES */
const ean13cd = s => { let t = 0; for (let i = 0; i < 12; i++) t += +s[i] * (i % 2 ? 3 : 1); return (10 - t % 10) % 10; };
const validEAN = s => /^\d{13}$/.test(s) && ean13cd(s) === +s[12];
function nextBarcodes(n) {
  const pre = String(S.shop.barcode_prefix || '200').replace(/\D/g, '').slice(0, 5) || '200', len = 12 - pre.length;
  const used = new Set(S.products.map(p => p.barcode).filter(Boolean));
  let seq = Math.max(0, ...S.products.map(p => p.barcode || '').filter(b => b.length === 13 && b.startsWith(pre)).map(b => +b.slice(pre.length, 12)));
  const out = [];
  while (out.length < n) { seq++; const b12 = pre + String(seq).padStart(len, '0'); const code = b12 + ean13cd(b12); if (!used.has(code)) out.push(code); }
  return out;
}
async function barcodeSVG(code, { h = 40, w = 1.6, text = true } = {}) {
  await loadJsBarcode();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try { JsBarcode(svg, code, { format: validEAN(code) ? 'EAN13' : 'CODE128', height: h, width: w, displayValue: text, fontSize: 13, margin: 2 }); }
  catch { JsBarcode(svg, code, { format: 'CODE128', height: h, width: w, displayValue: text, fontSize: 13, margin: 2 }); }
  return svg.outerHTML;
}
async function printLabels(items) {
  const m = modal('พิมพ์ฉลากบาร์โค้ด', `<div class="grid2">
    <div class="fg"><label class="f">ขนาดฉลาก</label><select class="in" id="ls"><option value="s">สติกเกอร์ 40×30 มม. (เครื่องพิมพ์ฉลาก)</option><option value="m">สติกเกอร์ 50×30 มม.</option><option value="a4">กระดาษ A4 (3 × 8 ดวง)</option></select></div>
    <div class="fg"><label class="f">จำนวนดวงต่อสินค้า</label><input class="in" id="lq" type="number" min="1" value="1"></div></div>
    <label class="row"><input type="checkbox" id="lpn" checked> แสดงชื่อสินค้า</label> <label class="row"><input type="checkbox" id="lpp" checked> แสดงราคา</label>
    <p class="muted">${items.length} สินค้า</p>`, { foot: '<button class="btn p" id="lgo">🖨️ พิมพ์</button>' });
  $('#lgo', m).onclick = async () => {
    const sz = $('#ls', m).value, n = Math.max(1, +$('#lq', m).value || 1), sn = $('#lpn', m).checked, sp = $('#lpp', m).checked;
    const dim = { s: ['40mm', '30mm'], m: ['50mm', '30mm'], a4: ['63mm', '33.9mm'] }[sz];
    const cells = [];
    for (const p of items) { if (!p.barcode) continue; const svg = await barcodeSVG(p.barcode, { h: sz === 'a4' ? 34 : 30, w: 1.4 });
      for (let i = 0; i < n; i++) cells.push(`<div class="lbl">${sn ? `<div class="ln">${esc(p.name)}</div>` : ''}${svg}${sp ? `<div class="lp">฿${money(num(p.promo_price) > 0 ? p.promo_price : p.price)}</div>` : ''}</div>`); }
    if (!cells.length) return toast('สินค้าที่เลือกยังไม่มีบาร์โค้ด', 'bad');
    printReceipt(`<style>@page{size:${sz === 'a4' ? 'A4' : dim.join(' ')};margin:${sz === 'a4' ? '10mm 7mm' : '0'}}
      .lbls{display:flex;flex-wrap:wrap;${sz === 'a4' ? 'gap:0 2.5mm' : ''}} .lbl{width:${dim[0]};height:${dim[1]};box-sizing:border-box;padding:1.5mm;text-align:center;overflow:hidden;page-break-inside:avoid;${sz === 'a4' ? '' : 'page-break-after:always'};font-family:sans-serif}
      .lbl svg{max-width:100%;height:auto;max-height:62%} .ln{font-size:9pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2} .lp{font-size:11pt;font-weight:700;line-height:1.1}</style><div class="lbls">${cells.join('')}</div>`);
    m.close();
  };
}
VIEWS.barcodes = pg => {
  let tab = 'all', v = '', cat = '';
  const chosen = new Set();
  const isPromo = p => num(p.promo_price) > 0 || itemPromosFor(p).length > 0;
  $('#tact').innerHTML = `<button class="btn p" id="bprint">🖨️ พิมพ์ / สร้างฉลาก</button><button class="btn" id="bgen">⚙️ สร้างบาร์โค้ดให้สินค้าที่ไม่มี</button><button class="btn" id="bimp">⬆ นำเข้า</button><button class="btn" id="bxl">📗 ส่งออก Excel</button><input type="file" id="bfile" accept=".xlsx,.xls,.csv" hidden>`;
  const list = () => S.products.filter(p => p.active !== false).filter(p => !cat || (cat === '_none' ? !p.category_id : p.category_id === cat)).filter(p => tab === 'all' || (tab === 'promo' ? isPromo(p) : tab === 'nopromo' ? !isPromo(p) : tab === 'has' ? p.barcode : tab === 'none' ? !p.barcode : tab === 'bad' ? p.barcode && /^\d{13}$/.test(p.barcode) && !validEAN(p.barcode) : tab === 'dup' ? p.barcode && S.products.filter(x => x.barcode === p.barcode).length > 1 : true))
    .filter(p => !v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v)).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  const draw = () => {
    const act = S.products.filter(p => p.active !== false), has = act.filter(p => p.barcode).length;
    const dup = act.filter(p => p.barcode && act.filter(x => x.barcode === p.barcode).length > 1).length;
    const rows = list();
    pg.innerHTML = `<div class="stats"><div class="stat"><div class="k">สินค้าทั้งหมด</div><div class="v">${act.length}</div></div><div class="stat"><div class="k">มีบาร์โค้ด</div><div class="v" style="color:var(--ok)">${has}</div></div>
      <div class="stat"><div class="k">ไม่มีบาร์โค้ด</div><div class="v" style="color:var(--warn)">${act.length - has}</div></div><div class="stat"><div class="k">บาร์โค้ดซ้ำ</div><div class="v" style="color:var(--bad)">${dup}</div></div></div>
      <div class="row" style="margin-bottom:10px"><div class="pills" id="bt">${[['all', 'ทั้งหมด'], ['promo', '🏷️ มีโปรโมชั่น'], ['nopromo', 'ราคาปกติ'], ['has', 'มีบาร์โค้ด'], ['none', 'ไม่มีบาร์โค้ด'], ['dup', 'ซ้ำ'], ['bad', 'เลขตรวจสอบผิด']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="sbox bc-search"><span>🔍</span><input class="in" id="bq" value="${esc(v)}" placeholder="ชื่อ / บาร์โค้ด / SKU"></div></div>
      ${bcCatSlider(cat, tab, v, list)}
      <div class="bcg-bar"><button class="btn sm" id="ball">☑️ เลือกทั้งหมด (${rows.length})</button><button class="btn sm" id="bnone">ล้างที่เลือก</button><span class="bcz"><button class="btn sm" id="bczm" title="รูปใหญ่ขึ้น">−</button><b id="bczv"></b><button class="btn sm" id="bczp" title="แสดงมากขึ้น">＋</button></span><span class="muted" id="bsel">เลือกแล้ว ${chosen.size}</span><span class="muted" style="font-size:12px">· แตะการ์ดเพื่อเลือก (ไม่เลือก = พิมพ์ทั้งหมดที่แสดง)</span></div>
      ${bcGrid(rows.slice(0, 600), chosen, isPromo, !cat)}
      <p class="muted">${rows.length} รายการ${rows.length > 400 ? ' (แสดง 400 แรก)' : ''}</p>`;
    $$('#bt [data-t]', pg).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $$('[data-bcc]', pg).forEach(b => b.onclick = () => { cat = b.dataset.bcc; draw(); });
    $('#bcat', pg) && ($('#bcat', pg).onchange = e => { cat = e.target.value; draw(); });
    $('#bq', pg).oninput = e => { v = e.target.value.toLowerCase(); const pos = e.target.selectionStart; draw(); const n = $('#bq', pg); n.focus(); n.setSelectionRange(pos, pos); };
    $('#ball', pg).onclick = () => { rows.forEach(p => chosen.add(p.id)); draw(); };
    $('#bnone', pg).onclick = () => { chosen.clear(); draw(); };
    bcCols(pg, 0); $('#bczm', pg).onclick = () => bcCols(pg, -1); $('#bczp', pg).onclick = () => bcCols(pg, 1);
    $$('.bcg-card', pg).forEach(c => c.onclick = e => { if (e.target.closest('button')) return; const id = c.dataset.id; chosen.has(id) ? chosen.delete(id) : chosen.add(id);
      c.classList.toggle('on', chosen.has(id)); $('#bsel', pg).textContent = `เลือกแล้ว ${chosen.size}`; bcSelBar(chosen.size); });
    bcSelBar(chosen.size);
    const setCode = async (p, code) => {
      if (code && S.products.some(x => x.id !== p.id && x.barcode === code) && !await confirmBox(`บาร์โค้ด ${code} ถูกใช้กับสินค้าอื่นแล้ว ต้องการใช้ซ้ำหรือไม่?`)) return;
      try { Object.assign(p, await q(sb.from('products').update({ barcode: code }).eq('id', p.id).select().single())); toast('บันทึกบาร์โค้ดแล้ว', 'ok'); draw(); } catch (e) { fail(e); } };
    $$('[data-ed]', pg).forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.ed);
      formModal('บาร์โค้ด · ' + p.name, [{ k: 'barcode', label: 'เลขบาร์โค้ด (เว้นว่าง = ลบ)', full: true }], { barcode: p.barcode || '' }, async o => setCode(p, o.barcode.replace(/\s/g, ''))); });
    $$('[data-sc]', pg).forEach(b => b.onclick = () => { const p = S.products.find(x => x.id === b.dataset.sc); scanBarcode(code => setCode(p, code)); });
    $$('[data-g]', pg).forEach(b => b.onclick = () => setCode(S.products.find(x => x.id === b.dataset.g), nextBarcodes(1)[0]));
  };
  $('#bgen').onclick = async () => {
    const targets = (chosen.size ? S.products.filter(p => chosen.has(p.id)) : S.products).filter(p => p.active !== false && !p.barcode);
    if (!targets.length) return toast('ไม่มีสินค้าที่ต้องสร้างบาร์โค้ด', 'ok');
    if (!await confirmBox(`สร้างบาร์โค้ด EAN-13 (ภายในร้าน ขึ้นต้น ${S.shop.barcode_prefix || '200'}) ให้สินค้า ${targets.length} รายการ?`)) return;
    const codes = nextBarcodes(targets.length);
    try { for (let i = 0; i < targets.length; i++) Object.assign(targets[i], await q(sb.from('products').update({ barcode: codes[i] }).eq('id', targets[i].id).select().single()));
      logAct('barcode_generate', 'product', `${targets.length} รายการ`, { count: targets.length });
      toast(`สร้างบาร์โค้ด ${targets.length} รายการแล้ว`, 'ok'); targets.forEach(p => chosen.add(p.id)); tab = 'has'; draw(); } catch (e) { fail(e); draw(); }
  };
  $('#bprint').onclick = () => { const it = chosen.size ? S.products.filter(p => chosen.has(p.id)) : list(); if (!it.length) return toast('ไม่มีสินค้าในรายการ', 'bad'); printLabels(it); };
  $('#bimp').onclick = () => $('#bfile').click();
  $('#bfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importDialog(f); };
  $('#bxl').onclick = () => { toast('แก้บาร์โค้ดในไฟล์ Excel แล้วกด “นำเข้า” เพื่ออัปเดตได้', 'ok'); return xlsxDownload('barcodes', [{ name: 'สินค้า', headers: ['ชื่อสินค้า', 'บาร์โค้ด', 'SKU', 'หมวดหมู่', 'ราคาขาย', 'ราคาโปร', 'ราคาส่ง', 'คงเหลือ', 'โปรโมชั่น'],
    rows: list().map(p => ({ 'ชื่อสินค้า': p.name, 'บาร์โค้ด': p.barcode || '', 'SKU': p.sku || '', 'หมวดหมู่': catName(p.category_id), 'ราคาขาย': num(p.price), 'ราคาโปร': num(p.promo_price) || '', 'ราคาส่ง': num(p.wholesale_price) || '', 'คงเหลือ': num(p.stock), 'โปรโมชั่น': itemPromosFor(p).map(x => x.name + ' (' + promoLabel(x) + ')').join(', ') })) }]); };
  draw();
};

/* ===================================================================== EXCEL helpers */
async function xlsxDownload(base, sheets) {
  await loadXLSX();
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => {
    const ws = s.aoa ? XLSX.utils.aoa_to_sheet(s.aoa) : XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [Object.fromEntries((s.headers || []).map(h => [h, '']))], s.headers ? { header: s.headers } : undefined);
    const hdr = s.headers || (s.rows?.[0] ? Object.keys(s.rows[0]) : []);
    ws['!cols'] = s.widths || hdr.map(h => ({ wch: Math.max(10, Math.min(40, String(h).length + 6)) }));
    XLSX.utils.book_append_sheet(wb, ws, sheetNm(s.name));
  });
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveBlob(safeName(`${base}_${ymd(new Date())}.xlsx`), new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}
const sheetNm = n => String(n).replace(/[:\\/?*\[\]]/g, '-').slice(0, 31);
const yn = v => v === true || /^(y|yes|true|1|ใช่|มี|เปิด|✓|x)$/i.test(String(v ?? '').trim());
const YN = b => b ? 'Y' : 'N';
const catName = id => S.categories.find(c => c.id === id)?.name || '';
const supName = id => S.suppliers.find(s => s.id === id)?.name || '';

/* template definitions: [key, header, example, note, required?] */
const TPL = {
  products: { label: 'สินค้า', icon: '📦', cols: [
    ['barcode', 'บาร์โค้ด', '8851234567890', 'ใช้จับคู่สินค้าเดิม (ถ้าไม่มี ใช้ SKU หรือชื่อ)'], ['sku', 'SKU', 'DRK-001', 'รหัสภายในร้าน'], ['name', 'ชื่อสินค้า', 'น้ำดื่ม 600 มล.', 'จำเป็น', 1],
    ['name_en', 'ชื่ออังกฤษ', 'Drinking water 600ml', ''], ['brand', 'ยี่ห้อ', 'สิงห์', ''], ['category', 'หมวดหมู่', 'เครื่องดื่ม', 'ถ้ายังไม่มีจะสร้างให้อัตโนมัติ'],
    ['unit', 'หน่วย', 'ขวด', 'ชิ้น / ขวด / กก. …'], ['price', 'ราคาขาย', 10, 'จำเป็น', 1], ['promo_price', 'ราคาโปร', '', 'เว้นว่าง = ไม่มี'], ['wholesale_price', 'ราคาส่ง', 8, ''],
    ['cost', 'ต้นทุน', 6.5, ''], ['stock', 'คงเหลือ', 48, 'สินค้าเดิม: ระบบจะบันทึกเป็น “ตรวจนับ/ปรับยอด”'], ['low_stock', 'แจ้งเตือนเมื่อเหลือ', 12, ''], ['max_stock', 'สต็อกสูงสุด', 200, ''],
    ['track_stock', 'ตัดสต็อก (Y/N)', 'Y', ''], ['favorite', 'รายการโปรด (Y/N)', 'N', ''], ['supplier', 'ผู้จำหน่าย', 'บจก. น้ำดื่มไทย', 'ชื่อต้องตรงกับในระบบ'],
    ['expiry_date', 'วันหมดอายุ', '2027-12-31', 'ปปปป-ดด-วว (ค.ศ.)'], ['lot_no', 'เลขล็อต', '', ''], ['image_url', 'ลิงก์รูป', '', 'URL รูปภาพ (ถ้ามี)'], ['active', 'ขายอยู่ (Y/N)', 'Y', 'N = ซ่อน/เลิกขาย']] },
  categories: { label: 'หมวดหมู่', icon: '🗂️', cols: [['name', 'ชื่อหมวดหมู่', 'เครื่องดื่ม', 'จำเป็น', 1], ['color', 'สี', '#2563eb', 'รหัสสี HEX'], ['sort', 'ลำดับ', 1, 'ตัวเลขน้อยแสดงก่อน']] },
  customers: { label: 'ลูกค้า / สมาชิก', icon: '⭐', cols: [['name', 'ชื่อลูกค้า', 'สมชาย ใจดี', 'จำเป็น', 1], ['phone', 'เบอร์โทร', '0812345678', 'ใช้จับคู่ลูกค้าเดิม'], ['points', 'แต้มสะสม', 120, ''],
    ['level', 'ระดับสมาชิก', 'Gold', ''], ['group_name', 'กลุ่ม', 'ขายส่ง', ''], ['discount_pct', 'ส่วนลดสมาชิก %', 5, ''], ['credit_limit', 'วงเงินเครดิต', 5000, ''],
    ['ctype', 'ประเภท (individual/company)', 'individual', ''], ['tax_id', 'เลขผู้เสียภาษี', '', '13 หลัก'], ['tax_branch', 'สาขา', '', ''], ['address', 'ที่อยู่', '', ''], ['note', 'หมายเหตุ', '', '']] },
  suppliers: { label: 'ผู้จำหน่าย', icon: '🚚', cols: [['name', 'ชื่อผู้จำหน่าย', 'บจก. น้ำดื่มไทย', 'จำเป็น', 1], ['contact', 'ผู้ติดต่อ', 'คุณเอ', ''], ['phone', 'เบอร์โทร', '021234567', ''],
    ['tax_id', 'เลขผู้เสียภาษี', '', ''], ['address', 'ที่อยู่', '', ''], ['note', 'หมายเหตุ', '', '']] },
  promotions: { label: 'โปรโมชั่น', icon: '🏷️', cols: [['name', 'ชื่อโปรโมชั่น', 'ซื้อ 2 แถม 1 น้ำดื่ม', 'จำเป็น', 1], ['scope', 'ใช้กับ (product/category/bill)', 'product', 'product=สินค้า category=หมวด bill=ทั้งบิล'],
    ['kind', 'รูปแบบ (percent/amount/fixed_price/bxgy/bundle)', 'bxgy', 'percent=ลด% amount=ลดบาท fixed_price=ราคาพิเศษ bxgy=ซื้อXแถมY bundle=ราคาชุด'], ['value', 'ค่า', 0, '% / บาท / ราคาพิเศษ / ราคาชุด'],
    ['buy_qty', 'ซื้อ (ชิ้น)', 2, 'bxgy / bundle'], ['get_qty', 'แถม (ชิ้น)', 1, 'bxgy'], ['products', 'สินค้า (บาร์โค้ดหรือชื่อ คั่นด้วย ;)', '8851234567890', 'scope=product'],
    ['categories', 'หมวดหมู่ (คั่นด้วย ;)', '', 'scope=category'], ['min_total', 'ยอดขั้นต่ำ', 0, 'scope=bill'], ['days', 'วัน (0=อา … 6=ส คั่นด้วย ,)', '', 'ว่าง = ทุกวัน'],
    ['time_from', 'เวลาเริ่ม', '', 'HH:MM'], ['time_to', 'เวลาสิ้นสุด', '', 'HH:MM'], ['starts_on', 'วันเริ่ม', '', 'ปปปป-ดด-วว'], ['ends_on', 'วันสิ้นสุด', '', 'ปปปป-ดด-วว'],
    ['members_only', 'เฉพาะสมาชิก (Y/N)', 'N', ''], ['auto', 'อัตโนมัติ (Y/N)', 'N', 'เฉพาะโปรทั้งบิล'], ['active', 'เปิดใช้ (Y/N)', 'Y', '']] },
  expenses: { label: 'ค่าใช้จ่าย', icon: '💸', cols: [['spent_on', 'วันที่', '2026-11-01', 'ปปปป-ดด-วว', 1], ['category', 'หมวด', 'ค่าน้ำ/ไฟ', ''], ['amount', 'จำนวนเงิน', 1500, 'จำเป็น', 1],
    ['payment_method', 'จ่ายโดย (cash/transfer)', 'cash', ''], ['note', 'รายละเอียด', 'ค่าไฟเดือน ต.ค.', '']] },
  stockcount: { label: 'ตรวจนับสต็อก', icon: '📋', cols: [['barcode', 'บาร์โค้ด', '8851234567890', 'หรือ SKU / ชื่อ'], ['sku', 'SKU', '', ''], ['name', 'ชื่อสินค้า', 'น้ำดื่ม 600 มล.', ''],
    ['system', 'คงเหลือในระบบ', 48, 'ไม่ต้องแก้ (อ้างอิง)'], ['counted', 'นับได้จริง', 45, 'กรอกเฉพาะที่นับ', 1], ['note', 'หมายเหตุ', '', '']] },
};
function tplRows(type) {
  const T = TPL[type];
  const map = {
    products: () => S.products.map(p => ({ ...p, category: catName(p.category_id), supplier: supName(p.supplier_id), track_stock: YN(p.track_stock), favorite: YN(p.favorite), active: YN(p.active !== false), promo_price: num(p.promo_price) || '' })),
    categories: () => S.categories, customers: () => S.customers, suppliers: () => S.suppliers,
    promotions: () => S.promotions.map(p => ({ ...p, products: arr(p.product_ids).map(id => { const x = S.products.find(y => y.id === id); return x ? (x.barcode || x.name) : ''; }).filter(Boolean).join(';'),
      categories: arr(p.category_ids).map(catName).filter(Boolean).join(';'), days: arr(p.days).join(','), members_only: YN(p.members_only), auto: YN(p.auto), active: YN(p.active) })),
    expenses: () => S.expenses || [],
    stockcount: () => S.products.filter(p => p.track_stock && p.active !== false).map(p => ({ barcode: p.barcode, sku: p.sku, name: p.name, system: num(p.stock), counted: '' })),
  };
  return (map[type]?.() || []).map(r => Object.fromEntries(T.cols.map(([k, h]) => [h, r[k] ?? ''])));
}
function tplSheets(type, withData) {
  const T = TPL[type];
  return [{ name: T.label, headers: T.cols.map(c => c[1]), rows: withData ? tplRows(type) : [Object.fromEntries(T.cols.map(c => [c[1], c[2]]))] }];
}
function guideSheet(types) {
  const aoa = [['คู่มือแม่แบบ Yanisa Shop', '', ''], ['สร้างเมื่อ', dt(new Date()), S.shop.name], [''],
    ['วิธีใช้', '1) กรอก/แก้ไขข้อมูลในแต่ละแผ่นงาน (ห้ามเปลี่ยนชื่อหัวคอลัมน์)  2) บันทึกเป็น .xlsx  3) ไปที่ ศูนย์ข้อมูล → นำเข้า แล้วเลือกไฟล์', ''],
    ['การจับคู่', 'สินค้า: บาร์โค้ด → SKU → ชื่อ · ลูกค้า: เบอร์โทร → ชื่อ · หมวด/ผู้จำหน่าย/โปร: ชื่อ — ถ้าตรงจะ “อัปเดต” ถ้าไม่ตรงจะ “เพิ่มใหม่”', ''], [''],
    ['แผ่นงาน', 'คอลัมน์', 'คำอธิบาย']];
  types.forEach(t => TPL[t].cols.forEach(([, h, , n, req], i) => aoa.push([i ? '' : TPL[t].label, h + (req ? ' *' : ''), n || ''])));
  return { name: 'คู่มือ', aoa, widths: [{ wch: 18 }, { wch: 42 }, { wch: 70 }] };
}

/* ---------- import ---------- */
async function readSheetFile(file) {
  await loadXLSX();
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const out = {};
  wb.SheetNames.forEach(n => { out[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '', raw: true }); });
  return out;
}
const cellDate = v => v instanceof Date ? ymd(v) : String(v || '').trim() ? (/^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : (() => { const d = new Date(v); return isNaN(d) ? null : ymd(d); })()) : null;
function normRow(type, raw) {
  const T = TPL[type], o = {};
  T.cols.forEach(([k, h]) => { const v = raw[h] ?? raw[h + ' *'] ?? raw[k]; if (v !== undefined) o[k] = typeof v === 'string' ? v.trim() : v; });
  return o;
}
function guessType(sheetName, rows) {
  for (const [k, T] of Object.entries(TPL)) if (sheetName === T.label || sheetName === sheetNm(T.label) || sheetName === k) return k;
  const hs = Object.keys(rows[0] || {});
  let best = null, sc = 0;
  for (const [k, T] of Object.entries(TPL)) { const s = T.cols.filter(c => hs.includes(c[1]) || hs.includes(c[0])).length; if (s > sc) { sc = s; best = k; } }
  return sc >= 2 ? best : null;
}
async function planImport(type, rows) {
  const plan = [];
  const findCat = n => S.categories.find(c => c.name.trim().toLowerCase() === String(n).trim().toLowerCase());
  for (const [i, raw] of rows.entries()) {
    const r = normRow(type, raw); const line = i + 2;
    if (Object.values(r).every(v => v === '' || v == null)) continue;
    let match = null, err = '';
    if (type === 'products') {
      if (!r.name && !r.barcode && !r.sku) err = 'ไม่มีชื่อ/บาร์โค้ด';
      match = (r.barcode && S.products.find(p => p.barcode === String(r.barcode))) || (r.sku && S.products.find(p => p.sku && p.sku === String(r.sku))) || (r.name && S.products.find(p => p.name.trim() === String(r.name).trim()));
      if (!match && !r.name) err = 'สินค้าใหม่ต้องมีชื่อ';
      if (!match && r.price === '') err = 'สินค้าใหม่ต้องมีราคา';
    } else if (type === 'stockcount') {
      match = (r.barcode && S.products.find(p => p.barcode === String(r.barcode))) || (r.sku && S.products.find(p => p.sku === String(r.sku))) || (r.name && S.products.find(p => p.name.trim() === String(r.name).trim()));
      if (r.counted === '' || r.counted == null) continue;
      if (!match) err = 'ไม่พบสินค้า';
    } else if (type === 'customers') {
      if (!r.name) err = 'ไม่มีชื่อ';
      match = (r.phone && S.customers.find(c => c.phone && c.phone.replace(/\D/g, '') === String(r.phone).replace(/\D/g, ''))) || S.customers.find(c => c.name === r.name);
    } else if (type === 'expenses') {
      if (!(num(r.amount) > 0)) err = 'จำนวนเงินไม่ถูกต้อง';
    } else {
      if (!r.name) err = 'ไม่มีชื่อ';
      const list = { categories: S.categories, suppliers: S.suppliers, promotions: S.promotions }[type];
      match = list.find(x => x.name.trim() === String(r.name).trim());
    }
    plan.push({ line, r, match, err, act: err ? 'error' : match ? 'update' : 'new' });
  }
  return plan;
}
async function runImport(type, plan, progress) {
  let ok = 0, bad = 0; const errors = [];
  const shop = S.shop.id;
  const ensureCat = async n => { if (!String(n || '').trim()) return null; let c = S.categories.find(x => x.name.trim().toLowerCase() === String(n).trim().toLowerCase());
    if (!c) { c = await q(sb.from('categories').insert({ shop_id: shop, name: String(n).trim(), sort: S.categories.length + 1 }).select().single()); S.categories.push(c); } return c.id; };
  for (const [i, it] of plan.entries()) {
    progress?.(i + 1, plan.length);
    if (it.act === 'error') { bad++; errors.push(`แถว ${it.line}: ${it.err}`); continue; }
    const r = it.r;
    try {
      if (type === 'products') {
        const row = {};
        ['name', 'name_en', 'brand', 'unit', 'lot_no', 'image_url'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = String(r[k]); });
        ['barcode', 'sku'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = String(r[k]).replace(/\.0$/, ''); });
        ['price', 'wholesale_price', 'cost', 'low_stock', 'max_stock'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = num(r[k]); });
        if (r.promo_price !== undefined) row.promo_price = r.promo_price === '' ? 0 : num(r.promo_price);
        ['track_stock', 'favorite', 'active'].forEach(k => { if (r[k] !== undefined && r[k] !== '') row[k] = yn(r[k]); });
        if (r.category !== undefined && r.category !== '') row.category_id = await ensureCat(r.category);
        if (r.supplier) { const s = S.suppliers.find(x => x.name.trim() === String(r.supplier).trim()); if (s) row.supplier_id = s.id; }
        if (r.expiry_date !== undefined && r.expiry_date !== '') row.expiry_date = cellDate(r.expiry_date);
        if (it.match) {
          const p = it.match;
          if (Object.keys(row).length) Object.assign(p, await q(sb.from('products').update(row).eq('id', p.id).select().single()));
          if (r.stock !== undefined && r.stock !== '' && p.track_stock && num(r.stock) !== num(p.stock)) {
            await q(sb.rpc('stock_move', { p_shop: shop, p_product: p.id, p_kind: 'adjust', p_qty: num(r.stock), p_cost: null, p_supplier: null, p_note: 'นำเข้าจาก Excel' })); p.stock = num(r.stock); }
        } else {
          row.shop_id = shop; row.stock = num(r.stock); row.unit ||= 'ชิ้น'; if (row.track_stock === undefined) row.track_stock = true;
          S.products.push(await q(sb.from('products').insert(row).select().single()));
        }
      } else if (type === 'stockcount') {
        const p = it.match;
        await q(sb.rpc('stock_move', { p_shop: shop, p_product: p.id, p_kind: 'adjust', p_qty: num(r.counted), p_cost: null, p_supplier: null, p_note: 'ตรวจนับจาก Excel' + (r.note ? ' · ' + r.note : '') }));
        p.stock = num(r.counted);
      } else if (type === 'expenses') {
        await q(sb.from('expenses').insert({ shop_id: shop, spent_on: cellDate(r.spent_on) || ymd(new Date()), category: r.category || 'ทั่วไป', amount: num(r.amount), payment_method: r.payment_method || 'cash', note: r.note || '', user_id: S.user.id, user_name: S.shop._name || '' }));
      } else if (type === 'promotions') {
        const ids = String(r.products || '').split(/[;,\n]/).map(s => s.trim()).filter(Boolean).map(s => (S.products.find(p => p.barcode === s) || S.products.find(p => p.name === s))?.id).filter(Boolean);
        const cids = []; for (const n of String(r.categories || '').split(/[;\n]/).map(s => s.trim()).filter(Boolean)) cids.push(await ensureCat(n));
        const row = { name: r.name, scope: ['product', 'category', 'bill'].includes(r.scope) ? r.scope : 'bill', kind: Object.keys(PKIND).includes(r.kind) ? r.kind : 'percent', value: num(r.value),
          buy_qty: num(r.buy_qty), get_qty: num(r.get_qty), product_ids: ids, category_ids: cids, min_total: num(r.min_total),
          days: String(r.days ?? '').split(/[,; ]/).filter(x => x !== '' && !isNaN(x)).map(Number).filter(d => d >= 0 && d <= 6),
          time_from: r.time_from ? String(r.time_from).slice(0, 5) : '', time_to: r.time_to ? String(r.time_to).slice(0, 5) : '', starts_on: cellDate(r.starts_on), ends_on: cellDate(r.ends_on),
          members_only: yn(r.members_only), auto: yn(r.auto), active: r.active === '' || r.active === undefined ? true : yn(r.active) };
        if (row.scope !== 'bill' && ['amount'].includes(row.kind) === false && row.kind === 'percent' && row.value > 100) row.value = 100;
        if (it.match) Object.assign(it.match, await q(sb.from('promotions').update(row).eq('id', it.match.id).select().single()));
        else S.promotions.push(await q(sb.from('promotions').insert({ ...row, shop_id: shop }).select().single()));
      } else {
        const T = TPL[type], row = {};
        T.cols.forEach(([k]) => { if (r[k] !== undefined && r[k] !== '') row[k] = ['points', 'discount_pct', 'credit_limit', 'sort'].includes(k) ? num(r[k]) : String(r[k]); });
        const list = { categories: S.categories, suppliers: S.suppliers, customers: S.customers }[type];
        if (it.match) Object.assign(it.match, await q(sb.from(type).update(row).eq('id', it.match.id).select().single()));
        else list.push(await q(sb.from(type).insert({ ...row, shop_id: shop }).select().single()));
      }
      ok++;
    } catch (e) { bad++; errors.push(`แถว ${it.line}: ${e.message}`); }
  }
  logAct('import', type, TPL[type].label, { ok, failed: bad });
  return { ok, bad, errors };
}
function importDialog(file) {
  (async () => {
    let sheets;
    try { sheets = await readSheetFile(file); } catch (e) { return fail(new Error('อ่านไฟล์ไม่ได้ — ต้องเป็น .xlsx หรือ .csv')); }
    const jobs = Object.entries(sheets).filter(([n, rows]) => rows.length && n !== 'คู่มือ').map(([n, rows]) => ({ n, rows, type: guessType(n, rows) })).filter(j => j.type);
    if (!jobs.length) return toast('ไม่พบแผ่นงานที่ตรงกับแม่แบบ — ดาวน์โหลดแม่แบบก่อน', 'bad');
    const plans = []; for (const j of jobs) plans.push({ ...j, plan: await planImport(j.type, j.rows) });
    const m = modal('นำเข้าข้อมูล — ตรวจสอบก่อนบันทึก', `<p class="muted" style="margin-top:0">ไฟล์: <b>${esc(file.name)}</b></p>
      <div class="tblwrap"><table class="tbl"><tr><th></th><th>ข้อมูล</th><th class="right">เพิ่มใหม่</th><th class="right">อัปเดต</th><th class="right">ผิดพลาด</th></tr>
      ${plans.map((p, i) => `<tr><td><input type="checkbox" data-j="${i}" checked></td><td>${TPL[p.type].icon} ${TPL[p.type].label}<br><small class="muted">แผ่นงาน “${esc(p.n)}”</small></td>
        <td class="right" style="color:var(--ok)">${p.plan.filter(x => x.act === 'new').length}</td><td class="right">${p.plan.filter(x => x.act === 'update').length}</td>
        <td class="right" style="color:var(--bad)">${p.plan.filter(x => x.act === 'error').length}</td></tr>`).join('')}</table></div>
      ${plans.some(p => p.plan.some(x => x.err)) ? `<details><summary>ดูรายการผิดพลาด</summary><small>${plans.flatMap(p => p.plan.filter(x => x.err).map(x => `${TPL[p.type].label} แถว ${x.line}: ${esc(x.err)}`)).slice(0, 100).join('<br>')}</small></details>` : ''}
      <p class="muted" style="font-size:13px">ระบบจะบันทึกประวัติการนำเข้าไว้ใน “บันทึกการใช้งาน” · สต็อกที่เปลี่ยนจะบันทึกเป็นการตรวจนับ</p>
      <div id="iprog"></div>`, { wide: true, foot: '<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="igo">⬆ นำเข้าเลย</button>' });
    $('[data-c]', m).onclick = m.close;
    $('#igo', m).onclick = async () => {
      $('#igo', m).disabled = true; const res = [];
      const order = ['categories', 'suppliers', 'products', 'customers', 'promotions', 'stockcount', 'expenses'];
      const sel = plans.filter((p, i) => $(`[data-j="${i}"]`, m).checked).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
      for (const p of sel) {
        const r = await runImport(p.type, p.plan, (a, b) => { $('#iprog', m).innerHTML = `<div class="muted">${TPL[p.type].label}: ${a}/${b}</div><div class="bar"><i style="width:${a / b * 100}%"></i></div>`; });
        res.push(`${TPL[p.type].icon} ${TPL[p.type].label}: สำเร็จ ${r.ok}${r.bad ? ` · ผิดพลาด ${r.bad}` : ''}`);
        if (r.errors.length) res.push(`<small class="muted">${r.errors.slice(0, 20).map(esc).join('<br>')}</small>`);
      }
      $('#iprog', m).innerHTML = `<div class="card" style="background:var(--oksoft)">${res.join('<br>')}</div>`;
      $('.mf', m).innerHTML = '<button class="btn p" data-c>เสร็จสิ้น</button>'; $('[data-c]', m).onclick = () => { m.close(); go(S.page); };
      toast('นำเข้าข้อมูลเรียบร้อย', 'ok');
    };
  })();
}

/* ---------- full backup / restore ---------- */
const BK_TABLES = ['categories', 'suppliers', 'products', 'customers', 'promotions', 'expenses', 'shifts', 'sales', 'sale_items', 'sale_payments', 'refunds', 'refund_items', 'stock_moves', 'purchases', 'purchase_items', 'cash_moves', 'customer_payments', 'supplier_payments', 'audit_log'];
async function collectBackup(progress) {
  const id = S.shop.id, out = { app: 'shop-pos', version: APP_VERSION, exported_at: new Date().toISOString(), shop: { ...S.shop }, tables: {} };
  Object.keys(out.shop).filter(k => k.startsWith('_')).forEach(k => delete out.shop[k]);
  for (const [i, tb] of BK_TABLES.entries()) { progress?.(i + 1, BK_TABLES.length, tb);
    try { out.tables[tb] = await fetchAll(() => sb.from(tb).select('*').eq('shop_id', id)); } catch { out.tables[tb] = []; } }
  return out;
}
async function backupJSON(prog) {
  const b = await collectBackup(prog);
  saveBlob(safeName(`backup_${S.shop.name}_${ymd(new Date())}.json`), new Blob([JSON.stringify(b)], { type: 'application/json' }));
  localStorage.setItem('pos_last_backup_' + S.shop.id, new Date().toISOString()); logAct('backup', 'shop', 'JSON', { rows: Object.values(b.tables).reduce((a, x) => a + x.length, 0) });
}
async function backupExcel(prog) {
  const b = await collectBackup(prog);
  const types = ['products', 'categories', 'customers', 'suppliers', 'promotions', 'expenses'];
  S.expenses = b.tables.expenses;
  const sheets = [guideSheet(types), ...types.flatMap(t => tplSheets(t, true))];
  const ex = { sales: 'บิลขาย', sale_items: 'รายการขาย', stock_moves: 'ความเคลื่อนไหวสต็อก', purchases: 'ใบสั่งซื้อ', refunds: 'คืนเงิน', shifts: 'กะ', audit_log: 'บันทึกการใช้งาน' };
  Object.entries(ex).forEach(([tb, nm]) => sheets.push({ name: nm, rows: (b.tables[tb] || []).map(r => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'shop_id').map(([k, v]) => [k, v && typeof v === 'object' ? JSON.stringify(v) : v]))) }));
  await xlsxDownload(`backup_${S.shop.name}`, sheets);
  localStorage.setItem('pos_last_backup_' + S.shop.id, new Date().toISOString()); logAct('backup', 'shop', 'Excel', {});
}
async function restoreJSON(file) {
  let b; try { b = JSON.parse(await file.text()); } catch { return toast('ไฟล์สำรองไม่ถูกต้อง', 'bad'); }
  const T = b.tables || b; // v3 backups stored tables at top level
  if (!T.products && !T.categories) return toast('ไม่พบข้อมูลสินค้าในไฟล์สำรอง', 'bad');
  const same = b.shop?.id === S.shop.id;
  const cnt = k => (T[k] || []).length;
  if (!await confirmBox(`กู้คืนจากไฟล์ “${file.name}”\nสำรองเมื่อ ${b.exported_at ? dt(b.exported_at) : '-'} · ร้าน ${b.shop?.name || '-'}\n\nหมวด ${cnt('categories')} · ผู้จำหน่าย ${cnt('suppliers')} · สินค้า ${cnt('products')} · ลูกค้า ${cnt('customers')} · โปรโมชั่น ${cnt('promotions')}\n\n${same ? 'ข้อมูลเดิมที่ตรงกันจะถูกเขียนทับด้วยค่าจากไฟล์ (ประวัติการขายไม่ถูกลบ)' : 'ไฟล์มาจากร้าน/สาขาอื่น — จะคัดลอกข้อมูลหลักเข้าร้านนี้เป็นรายการใหม่'}\nดำเนินการต่อหรือไม่?`)) return;
  const m = modal('กำลังกู้คืน…', '<div id="rp"></div>');
  const shop = S.shop.id, idMap = {};
  const strip = (r, keep = []) => { const o = { ...r }; ['created_at', 'shop_id'].forEach(k => delete o[k]); if (!same) delete o.id; Object.keys(o).forEach(k => { if (k.startsWith('_') && !keep.includes(k)) delete o[k]; }); return { ...o, shop_id: shop }; };
  const step = async (tb, fix) => {
    const rows = T[tb] || []; let n = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map(r => { const o = strip(r); fix?.(o, r); return o; });
      if (same) await q(sb.from(tb).upsert(chunk, { onConflict: 'id' }));
      else { const ins = await q(sb.from(tb).insert(chunk).select('id')); ins.forEach((x, j) => { idMap[rows[i + j].id] = x.id; }); }
      n += chunk.length; $('#rp', m).innerHTML += `<div>✓ ${tb}: ${n}/${rows.length}</div>`;
    }
  };
  try {
    await step('categories'); await step('suppliers');
    await step('products', (o, r) => { if (!same) { o.category_id = idMap[r.category_id] || null; o.supplier_id = idMap[r.supplier_id] || null; } });
    await step('customers', o => { if (!same) { o.points = num(o.points); o.balance = 0; } });
    await step('promotions', o => { if (!same) { o.product_ids = arr(o.product_ids).map(x => idMap[x]).filter(Boolean); o.category_ids = arr(o.category_ids).map(x => idMap[x]).filter(Boolean); } });
    if (same && b.shop && can('owner')) { const keep = ['name', 'address', 'phone', 'tax_id', 'vat_mode', 'vat_rate', 'promptpay_id', 'receipt_header', 'receipt_footer', 'points_per_baht', 'baht_per_point', 'branch_code', 'branch_name', 'logo_url', 'receipt_size', 'brand_color', 'barcode_prefix'];
      await q(sb.from('shops').update(Object.fromEntries(keep.filter(k => k in b.shop).map(k => [k, b.shop[k]]))).eq('id', shop)); }
    logAct('restore', 'shop', file.name, { same, products: cnt('products') });
    m.close(); toast('กู้คืนข้อมูลเรียบร้อย — กำลังโหลดใหม่', 'ok'); setTimeout(() => location.reload(), 900);
  } catch (e) { fail(e); $('#rp', m).innerHTML += `<div style="color:var(--bad)">หยุดที่: ${esc(e.message)}</div>`; }
}

/* ---------- data center page ---------- */
VIEWS.data = async pg => {
  const admin = can('owner') || S.role === 'admin', allowed = t => t === 'expenses' ? canDo('expenses') : t === 'customers' ? canDo('customers') : t === 'promotions' ? canDo('promotions') : canDo('edit_products');
  if (!S.expenses && canDo('expenses')) S.expenses = await fetchAll(() => sb.from('expenses').select('*').eq('shop_id', S.shop.id)).catch(() => []);
  const types = Object.keys(TPL).filter(allowed);
  const last = localStorage.getItem('pos_last_backup_' + S.shop.id);
  pg.innerHTML = `<div class="grid2">
    <div class="card"><h3 style="margin-top:0">📗 แม่แบบ Excel (Template)</h3>
      <p class="muted" style="margin-top:0">ดาวน์โหลด → แก้ไขใน Excel / Google Sheets → นำเข้ากลับ ระบบจะอัปเดตรายการเดิมและเพิ่มรายการใหม่ให้อัตโนมัติ</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px"><button class="btn p" id="tAll">⬇ แม่แบบทั้งหมด (ว่าง + ตัวอย่าง)</button><button class="btn" id="tAllD">⬇ ข้อมูลปัจจุบันทั้งหมด (แก้ไขแล้วนำเข้าได้)</button></div>
      <div class="tblwrap"><table class="tbl">${types.map(t => `<tr><td>${TPL[t].icon} <b>${TPL[t].label}</b><br><small class="muted">${TPL[t].cols.length} คอลัมน์</small></td>
        <td class="right" style="white-space:nowrap"><button class="btn sm" data-tp="${t}">แม่แบบ</button> <button class="btn sm" data-td="${t}">ข้อมูลปัจจุบัน</button></td></tr>`).join('')}</table></div></div>
    <div class="card"><h3 style="margin-top:0">⬆ นำเข้าข้อมูล (Import)</h3>
      <label class="dropzone" id="dz"><input type="file" id="ifile" accept=".xlsx,.xls,.csv" hidden><b>แตะเพื่อเลือกไฟล์</b> หรือ ลากไฟล์ .xlsx / .csv มาวางที่นี่<br><small class="muted">รองรับไฟล์ที่มีหลายแผ่นงานในครั้งเดียว · ตรวจสอบก่อนบันทึกทุกครั้ง</small></label>
      <h3>💾 สำรองข้อมูลทั้งร้าน (Backup)</h3>
      <p class="muted" style="margin-top:0">สำรองล่าสุดจากเครื่องนี้: <b>${last ? dt(last) : 'ยังไม่เคย'}</b>${last && Date.now() - new Date(last) > 7 * 864e5 ? ' <span class="chip warn">ควรสำรองใหม่</span>' : ''}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn p" id="bkj">💾 สำรองไฟล์ JSON (กู้คืนได้)</button><button class="btn" id="bkx">📗 สำรองเป็น Excel (อ่าน/แก้ไขได้)</button></div>
      <div id="bkp" class="muted" style="margin-top:8px"></div>
      ${admin ? `<h3>♻️ กู้คืนข้อมูล (Restore)</h3><p class="muted" style="margin-top:0">ใช้ไฟล์ JSON ที่สำรองไว้ — กู้คืน สินค้า หมวดหมู่ ลูกค้า ผู้จำหน่าย โปรโมชั่น และตั้งค่าร้าน · ประวัติการขายเก็บไว้ในระบบคลาวด์เสมอ ไม่ถูกลบ</p>
        <label class="btn"><input type="file" id="rfile" accept=".json,application/json" hidden>♻️ เลือกไฟล์สำรองเพื่อกู้คืน</label>` : ''}
    </div></div>`;
  const prog = (a, b, tb) => { $('#bkp').textContent = `กำลังรวบรวม ${tb} (${a}/${b})…`; };
  $('#tAll').onclick = () => xlsxDownload('template_shop_pos', [guideSheet(types), ...types.flatMap(t => tplSheets(t, false))]);
  $('#tAllD').onclick = () => xlsxDownload(`data_${S.shop.name}`, [guideSheet(types), ...types.flatMap(t => tplSheets(t, true))]);
  $$('[data-tp]', pg).forEach(b => b.onclick = () => xlsxDownload('template_' + b.dataset.tp, [guideSheet([b.dataset.tp]), ...tplSheets(b.dataset.tp, false)]));
  $$('[data-td]', pg).forEach(b => b.onclick = () => xlsxDownload(`${b.dataset.td}_${S.shop.name}`, [guideSheet([b.dataset.td]), ...tplSheets(b.dataset.td, true)]));
  $('#ifile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importDialog(f); };
  const dz = $('#dz'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); const f = e.dataTransfer.files[0]; if (f) importDialog(f); };
  $('#bkj').onclick = async () => { try { await backupJSON(prog); $('#bkp').textContent = '✓ สำรองเรียบร้อย'; } catch (e) { fail(e); } };
  $('#bkx').onclick = async () => { try { await backupExcel(prog); $('#bkp').textContent = '✓ สำรองเรียบร้อย'; } catch (e) { fail(e); } };
  if ($('#rfile')) $('#rfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) restoreJSON(f); };
};

/* ===================================================================== ACTIVITY LOG */
VIEWS.audit = async pg => {
  let A, B, rows = [], members = [];
  try { members = await q(sb.from('shop_members').select('user_id, display_name, username, role').eq('shop_id', S.shop.id)); } catch {}
  pg.innerHTML = `<div id="ar"></div>
    <div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px"><div class="sbox" style="max-width:260px"><span>🔍</span><input class="in" id="aq" placeholder="ค้นหา สินค้า / รายละเอียด"></div>
      <select class="in" id="au" style="width:auto"><option value="">พนักงานทุกคน</option>${members.map(m => `<option value="${m.user_id}">${esc(m.display_name || m.username)}</option>`).join('')}</select>
      <select class="in" id="ag" style="width:auto"><option value="">ทุกประเภท</option>${Object.entries(ACT_GROUP).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
      <span class="sp"></span><button class="btn" id="axl">📗 Excel</button></div>
    <div class="pills" id="atab" style="margin-bottom:10px"><button data-v="log" class="on">บันทึกทั้งหมด</button><button data-v="att">เวลาเข้างาน (ล็อกอิน)</button><button data-v="sum">สรุปตามพนักงาน</button></div>
    <div id="al"></div>`;
  let view = 'log';
  const fdet = r => esc(Object.entries(r.detail || {}).map(([k, x]) => `${{ change: 'เปลี่ยน', before: 'ก่อน', after: 'หลัง', note: 'หมายเหตุ', value: 'มูลค่า', changed: 'แก้ไข' }[k] || k}: ${Array.isArray(x) ? x.join(' → ') : x && typeof x === 'object' ? Object.entries(x).map(([a, b]) => `${a}=${typeof b === 'object' ? JSON.stringify(b) : b}`).join(', ') : x}`).join(' · ')).slice(0, 260);
  const filt = () => { const v = $('#aq').value.toLowerCase(), u = $('#au').value, g = $('#ag').value;
    return rows.filter(r => (!u || r.user_id === u) && (!g || actGroup(r.action) === g) && (!v || JSON.stringify(r).toLowerCase().includes(v))); };
  const draw = () => {
    const list = filt();
    if (view === 'log') $('#al').innerHTML = list.length ? `<div class="tblwrap"><table class="tbl"><tr><th>วัน-เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th><th>รายละเอียด</th></tr>${list.slice(0, 1000).map(r => `<tr><td style="white-space:nowrap">${dt(r.created_at)}</td><td>${esc(r.user_name)}</td>
      <td><span class="chip ${/delete|void|personal|remove|disable/.test(r.action) ? 'bad' : /login|insert|in$|create/.test(r.action) ? 'ok' : ''}">${AUDIT_L[r.action] || esc(r.action)}</span></td><td>${esc(r.entity_id)}</td><td><small class="muted">${fdet(r)}</small></td></tr>`).join('')}</table></div>
      <p class="muted">${list.length} รายการ</p>` : '<div class="empty">ไม่มีบันทึกในช่วงนี้</div>';
    if (view === 'att') { const g = {}; list.forEach(r => { const k = r.user_name + '|' + ymd(r.created_at); const o = g[k] ||= { u: r.user_name, d: ymd(r.created_at), first: r.created_at, last: r.created_at, logins: 0, acts: 0, out: '' };
        if (r.created_at < o.first) o.first = r.created_at; if (r.created_at > o.last) o.last = r.created_at; if (r.action === 'login') o.logins++; else o.acts++; if (r.action === 'logout' && r.created_at >= (o.out || '')) o.out = r.created_at; });
      const L = Object.values(g).sort((a, b) => b.d.localeCompare(a.d) || a.u.localeCompare(b.u));
      const tm = x => new Date(x).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
      $('#al').innerHTML = `<div class="tblwrap"><table class="tbl"><tr><th>วันที่</th><th>พนักงาน</th><th>เข้าระบบครั้งแรก</th><th>กิจกรรมล่าสุด</th><th>ออกจากระบบ</th><th class="right">ชั่วโมง (ประมาณ)</th><th class="right">ครั้งที่เข้า</th><th class="right">กิจกรรม</th></tr>
        ${L.map(o => `<tr><td>${dOnly(o.d)}</td><td><b>${esc(o.u)}</b></td><td>${tm(o.first)}</td><td>${tm(o.last)}</td><td>${o.out ? tm(o.out) : '—'}</td><td class="right">${((new Date(o.out || o.last) - new Date(o.first)) / 36e5).toFixed(1)}</td><td class="right">${o.logins}</td><td class="right">${o.acts}</td></tr>`).join('')}</table></div>
        <p class="muted" style="font-size:13px">คำนวณจากเวลาเข้าระบบครั้งแรกถึงกิจกรรม/ออกจากระบบครั้งสุดท้ายของแต่ละวัน</p>`; }
    if (view === 'sum') { const g = {}; list.forEach(r => { const o = g[r.user_name] ||= { u: r.user_name, n: 0, login: 0, stock: 0, product: 0, sale: 0, other: 0, last: r.created_at }; o.n++; const k = actGroup(r.action); o[k in o ? k : 'other']++; if (r.created_at > o.last) o.last = r.created_at; });
      $('#al').innerHTML = `<div class="tblwrap"><table class="tbl"><tr><th>พนักงาน</th><th class="right">เข้าระบบ</th><th class="right">สต็อก</th><th class="right">สินค้า</th><th class="right">ขาย/เงิน</th><th class="right">อื่นๆ</th><th class="right">รวม</th><th>ล่าสุด</th></tr>
        ${Object.values(g).sort((a, b) => b.n - a.n).map(o => `<tr><td><b>${esc(o.u)}</b></td><td class="right">${o.login}</td><td class="right">${o.stock}</td><td class="right">${o.product}</td><td class="right">${o.sale}</td><td class="right">${o.other + (o.staff || 0) + (o.data || 0)}</td><td class="right b">${o.n}</td><td>${dt(o.last)}</td></tr>`).join('')}</table></div>`; }
  };
  const load = async () => { $('#al').innerHTML = '<div class="skel"><i></i><i></i></div>';
    try { rows = await fetchAll(() => sb.from('audit_log').select('*').eq('shop_id', S.shop.id).gte('created_at', iso(A)).lte('created_at', iso(B)).order('created_at', { ascending: false })); rows.forEach(r => { r.user_name ||= 'ระบบ'; }); draw(); } catch (e) { fail(e); } };
  $('#aq').oninput = $('#au').onchange = $('#ag').onchange = draw;
  $$('#atab button').forEach(b => b.onclick = () => { view = b.dataset.v; $$('#atab button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#axl').onclick = () => xlsxDownload('activity_log', [{ name: 'บันทึกการใช้งาน', rows: filt().map(r => ({ 'วันเวลา': dt(r.created_at), 'ผู้ใช้': r.user_name, 'การกระทำ': AUDIT_L[r.action] || r.action, 'ประเภท': ACT_GROUP[actGroup(r.action)], 'รายการ': r.entity_id, 'รายละเอียด': JSON.stringify(r.detail || {}) })) }]);
  rangeBar($('#ar'), (a, b) => { A = a; B = b; load(); }, 'd7');
};
/* login / logout logging */
const _boot4 = boot;
boot = async function () {
  await _boot4();
  if (S.shop && S.user) { const k = 'pos_login_' + S.shop.id + '_' + S.user.id;
    if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); logAct('login', 'user', S.shop._name || S.user.email.split('@')[0], { device: /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS' : /Windows/i.test(navigator.userAgent) ? 'Windows' : /Mac/i.test(navigator.userAgent) ? 'Mac' : 'อื่นๆ', app: matchMedia('(display-mode: standalone)').matches || /Electron|ShopPOSApp/.test(navigator.userAgent) ? 'แอป' : 'เว็บ' }); } }
};
const _logout4 = logout;
logout = async function () {
  if (S.shop) { try { await Promise.race([logAct('logout', 'user', S.shop._name || '', {}), new Promise(r => setTimeout(r, 1500))]); } catch {} sessionStorage.clear(); }
  return _logout4();
};

/* ===================================================================== REPORTS (extra) */
REPORTS.push(['promo', 'โปรโมชั่น'], ['personal', 'เบิกใช้ส่วนตัว'], ['damage', 'ชำรุด / หมดอายุ / เบิก'], ['hourly', 'ยอดขายรายชั่วโมง'], ['weekday', 'ยอดขายตามวัน'],
  ['barcode', 'สินค้าและบาร์โค้ด'], ['custom', 'สินค้านอกระบบ'], ['activity', 'กิจกรรมพนักงาน'], ['branch', 'เปรียบเทียบสาขา']);
async function memberNames() { try { const m = await q(sb.from('shop_members').select('user_id, display_name, username').eq('shop_id', S.shop.id)); return Object.fromEntries(m.map(x => [x.user_id, x.display_name || x.username])); } catch { return {}; } }
const movesIn = (a, b, kinds) => fetchAll(() => sb.from('stock_moves').select('*').eq('shop_id', S.shop.id).in('kind', kinds).gte('created_at', iso(a)).lte('created_at', iso(b)).order('created_at', { ascending: false }));
Object.assign(REPORT_FN, {
  async promo(a, b) {
    const it = await fetchAll(() => sb.from('sale_items').select('name,qty,price,discount,promo,sales!inner(created_at,status,bill_no)').eq('shop_id', S.shop.id).neq('promo', '').neq('sales.status', 'void').gte('sales.created_at', iso(a)).lte('sales.created_at', iso(b)));
    const bills = await fetchAll(() => sb.from('sales').select('promo,discount,total,created_at').eq('shop_id', S.shop.id).neq('promo', '').neq('status', 'void').gte('created_at', iso(a)).lte('created_at', iso(b)));
    const g = {};
    it.forEach(r => { const o = g[r.promo] ||= { promo: r.promo, bills: new Set(), qty: 0, gross: 0, disc: 0 }; o.bills.add(r.sales.bill_no); o.qty += num(r.qty); o.gross += num(r.qty) * num(r.price); o.disc += num(r.discount); });
    const rows = Object.values(g).map(o => ({ promo: o.promo, type: 'สินค้า/หมวด', bills: o.bills.size, qty: o.qty, gross: o.gross, disc: o.disc, net: o.gross - o.disc }));
    const itemNames = new Set(Object.keys(g));
    bills.forEach(s => s.promo.split(', ').filter(n => !itemNames.has(n)).forEach(n => { let o = rows.find(r => r.promo === n && r.type === 'ทั้งบิล'); if (!o) rows.push(o = { promo: n, type: 'ทั้งบิล', bills: 0, qty: 0, gross: 0, disc: 0, net: 0 }); o.bills++; o.gross += num(s.total) + num(s.discount); o.disc += num(s.discount); o.net += num(s.total); }));
    return { summary: [['ส่วนลดโปรรวม', baht(rows.reduce((x, r) => x + r.disc, 0))], ['บิลที่ใช้โปร', bills.length]], note: 'ส่วนลดสินค้า = ส่วนลดรายการทั้งหมดในบรรทัดที่มีโปร (รวมส่วนลดที่ให้เอง)',
      cols: [['promo', 'โปรโมชั่น'], ['type', 'ประเภท'], ['bills', 'จำนวนบิล', 'n'], ['qty', 'ชิ้นที่ขาย', 'n'], ['gross', 'ยอดก่อนลด', 'm'], ['disc', 'ส่วนลด', 'm'], ['net', 'ยอดหลังลด', 'm']], rows };
  },
  async personal(a, b) {
    const mv = await movesIn(a, b, ['personal']), names = await memberNames();
    const rows = mv.map(r => ({ at: r.created_at, product: r.product_name, qty: -num(r.qty), cost: num(r.cost), value: -num(r.qty) * num(r.cost), user: names[r.user_id] || '', note: r.note }));
    return { summary: [['จำนวนครั้ง', rows.length], ['มูลค่าทุนรวม', baht(rows.reduce((x, r) => x + r.value, 0))]],
      cols: [['at', 'วันเวลา', 'dt'], ['product', 'สินค้า'], ['qty', 'จำนวน', 'n'], ['cost', 'ทุน/หน่วย', 'm'], ['value', 'มูลค่าทุน', 'm'], ['user', 'ผู้บันทึก'], ['note', 'ผู้เบิก / เหตุผล']], rows };
  },
  async damage(a, b) {
    const mv = await movesIn(a, b, ['damaged', 'expired', 'out', 'personal']), names = await memberNames();
    const rows = mv.map(r => ({ at: r.created_at, kind: (MOVE[r.kind] || ['', r.kind])[1], product: r.product_name, qty: -num(r.qty), value: -num(r.qty) * num(r.cost), user: names[r.user_id] || '', note: r.note }));
    const by = k => baht(rows.filter(r => r.kind === MOVE[k][1]).reduce((x, r) => x + r.value, 0));
    return { summary: [['ชำรุด', by('damaged')], ['หมดอายุ', by('expired')], ['เบิกออก', by('out')], ['ใช้ส่วนตัว', by('personal')]],
      cols: [['at', 'วันเวลา', 'dt'], ['kind', 'ประเภท'], ['product', 'สินค้า'], ['qty', 'จำนวน', 'n'], ['value', 'มูลค่าทุน', 'm'], ['user', 'ผู้บันทึก'], ['note', 'หมายเหตุ']], rows };
  },
  async hourly(a, b) {
    const s = await salesIn(a, b); const rows = Array.from({ length: 24 }, (_, h) => ({ h: String(h).padStart(2, '0') + ':00', bills: 0, total: 0 }));
    s.forEach(r => { const h = new Date(r.created_at).getHours(); rows[h].bills++; rows[h].total += num(r.total) - num(r.refunded_total); });
    rows.forEach(r => r.avg = r.bills ? r.total / r.bills : 0);
    const top = [...rows].sort((x, y) => y.total - x.total)[0];
    return { summary: [['ชั่วโมงขายดีที่สุด', top.total ? top.h : '—']], cols: [['h', 'ชั่วโมง'], ['bills', 'บิล', 'n'], ['total', 'ยอดขาย', 'm'], ['avg', 'เฉลี่ย/บิล', 'm']], rows: rows.filter(r => r.bills) };
  },
  async weekday(a, b) {
    const s = await salesIn(a, b); const nm = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const rows = nm.map(d => ({ d, bills: 0, total: 0 })); s.forEach(r => { const o = rows[new Date(r.created_at).getDay()]; o.bills++; o.total += num(r.total) - num(r.refunded_total); });
    rows.forEach(r => r.avg = r.bills ? r.total / r.bills : 0);
    return { cols: [['d', 'วัน'], ['bills', 'บิล', 'n'], ['total', 'ยอดขาย', 'm'], ['avg', 'เฉลี่ย/บิล', 'm']], rows };
  },
  async barcode() {
    const rows = S.products.filter(p => p.active !== false).map(p => ({ name: p.name, barcode: p.barcode || '', sku: p.sku || '', cat: catName(p.category_id), price: num(p.price), stock: num(p.stock), st: p.barcode ? 'มี' : 'ไม่มี' }));
    return { summary: [['มีบาร์โค้ด', rows.filter(r => r.barcode).length], ['ไม่มีบาร์โค้ด', rows.filter(r => !r.barcode).length]], note: 'ช่วงวันที่ไม่มีผลกับรายงานนี้ · สร้าง/พิมพ์บาร์โค้ดได้ที่เมนู “บาร์โค้ด”',
      cols: [['name', 'สินค้า'], ['barcode', 'บาร์โค้ด'], ['sku', 'SKU'], ['cat', 'หมวดหมู่'], ['price', 'ราคา', 'm'], ['stock', 'คงเหลือ', 'n'], ['st', 'สถานะ']], rows };
  },
  async custom(a, b) {
    const it = await fetchAll(() => sb.from('sale_items').select('name,qty,price,discount,cost,sales!inner(created_at,status,bill_no,cashier_name)').eq('shop_id', S.shop.id).is('product_id', null).neq('sales.status', 'void').gte('sales.created_at', iso(a)).lte('sales.created_at', iso(b)));
    const rows = it.map(r => ({ at: r.sales.created_at, bill: r.sales.bill_no, name: r.name, qty: num(r.qty), total: num(r.qty) * num(r.price) - num(r.discount), by: r.sales.cashier_name }));
    return { note: 'สินค้าที่ขายผ่านปุ่ม “ขายด่วน” (ไม่มีในระบบ) — ควรเพิ่มเป็นสินค้าจริงถ้าขายบ่อย', cols: [['at', 'วันเวลา', 'dt'], ['bill', 'บิล'], ['name', 'สินค้า'], ['qty', 'จำนวน', 'n'], ['total', 'ยอด', 'm'], ['by', 'แคชเชียร์']], rows };
  },
  async activity(a, b) {
    const rows0 = await fetchAll(() => sb.from('audit_log').select('user_name,action,created_at').eq('shop_id', S.shop.id).gte('created_at', iso(a)).lte('created_at', iso(b)));
    const g = {}; rows0.forEach(r => { const o = g[r.user_name] ||= { u: r.user_name, login: 0, stock: 0, product: 0, sale: 0, other: 0, n: 0, last: r.created_at }; const k = actGroup(r.action); o[k in o ? k : 'other']++; o.n++; if (r.created_at > o.last) o.last = r.created_at; });
    return { cols: [['u', 'พนักงาน'], ['login', 'เข้าระบบ', 'n'], ['stock', 'สต็อก', 'n'], ['product', 'สินค้า', 'n'], ['sale', 'ขาย/เงิน', 'n'], ['other', 'อื่นๆ', 'n'], ['n', 'รวม', 'n'], ['last', 'ล่าสุด', 'dt']], rows: Object.values(g) };
  },
  async branch(a, b) { return { cols: BR_COLS, rows: await branchStats(a, b), note: 'เฉพาะสาขาที่บัญชีนี้มีสิทธิ์ดูรายงาน' }; },
});
const BR_COLS = [['name', 'สาขา'], ['bills', 'บิล', 'n'], ['total', 'ยอดขายสุทธิ', 'm'], ['avg', 'เฉลี่ย/บิล', 'm'], ['gp', 'กำไรขั้นต้น', 'm'], ['exp', 'ค่าใช้จ่าย', 'm'], ['stockv', 'มูลค่าสต็อก (ทุน)', 'm'], ['low', 'สินค้าใกล้หมด', 'n']];
async function branchStats(a, b) {
  const out = [];
  for (const sh of S.shops.filter(s => ['owner', 'admin', 'manager', 'accountant'].includes(s._role))) {
    try {
      const s = await fetchAll(() => sb.from('sales').select('total,cost_total,vat,refunded_total,status').eq('shop_id', sh.id).neq('status', 'void').gte('created_at', iso(a)).lte('created_at', iso(b)));
      const ex = await fetchAll(() => sb.from('expenses').select('amount,status').eq('shop_id', sh.id).gte('spent_on', ymd(a)).lte('spent_on', ymd(b))).catch(() => []);
      const pr = await fetchAll(() => sb.from('products').select('stock,cost,low_stock,track_stock,active').eq('shop_id', sh.id));
      const total = s.reduce((x, r) => x + num(r.total) - num(r.refunded_total), 0);
      out.push({ id: sh.id, name: sh.name + (sh.branch_name ? ' · ' + sh.branch_name : ''), bills: s.length, total, avg: s.length ? total / s.length : 0,
        gp: s.reduce((x, r) => x + num(r.total) - num(r.refunded_total) - num(r.vat) - num(r.cost_total), 0), exp: ex.filter(e => e.status !== 'pending').reduce((x, e) => x + num(e.amount), 0),
        stockv: pr.filter(p => p.track_stock && p.active !== false).reduce((x, p) => x + Math.max(0, num(p.stock)) * num(p.cost), 0), low: pr.filter(p => p.track_stock && p.active !== false && num(p.stock) <= num(p.low_stock)).length });
    } catch (e) { out.push({ name: sh.name + ' (โหลดไม่ได้)', bills: 0, total: 0, avg: 0, gp: 0, exp: 0, stockv: 0, low: 0 }); }
  }
  return out;
}

/* ===================================================================== BRANCHES PAGE */
VIEWS.branches = pg => {
  let A, B;
  $('#tact').innerHTML = can('owner') ? '<button class="btn p" id="nbr">+ เพิ่มสาขา</button>' : '';
  pg.innerHTML = `<div id="brr"></div><div id="brb"><div class="skel"><i></i><i></i></div></div>`;
  const load = async () => {
    const rows = await branchStats(A, B), tot = rows.reduce((x, r) => x + r.total, 0);
    $('#brb').innerHTML = `<div class="stats"><div class="stat"><div class="k">จำนวนสาขา</div><div class="v">${S.shops.length}</div></div><div class="stat"><div class="k">ยอดขายรวมทุกสาขา</div><div class="v">${baht(tot)}</div></div>
      <div class="stat"><div class="k">บิลรวม</div><div class="v">${rows.reduce((x, r) => x + r.bills, 0)}</div></div></div>
      <div class="brgrid">${rows.map(r => `<div class="card brcard ${r.id === S.shop.id ? 'cur' : ''}"><div class="row"><b style="flex:1;font-size:17px">🏬 ${esc(r.name)}</b>${r.id === S.shop.id ? '<span class="chip ok">กำลังใช้งาน</span>' : `<button class="btn sm" data-sw="${r.id}">สลับไปสาขานี้</button>`}</div>
        <div class="bbar"><i style="width:${tot ? r.total / tot * 100 : 0}%"></i></div>
        <div class="grid2" style="gap:6px;margin-top:8px"><div><small class="muted">ยอดขาย</small><div class="b">${baht(r.total)}</div></div><div><small class="muted">บิล</small><div class="b">${r.bills}</div></div>
          <div><small class="muted">กำไรขั้นต้น</small><div class="b">${canDo('view_profit') ? baht(r.gp) : '—'}</div></div><div><small class="muted">ค่าใช้จ่าย</small><div class="b">${baht(r.exp)}</div></div>
          <div><small class="muted">มูลค่าสต็อก</small><div class="b">${canDo('view_profit') ? baht(r.stockv) : '—'}</div></div><div><small class="muted">ใกล้หมด</small><div class="b" style="color:${r.low ? 'var(--warn)' : ''}">${r.low}</div></div></div></div>`).join('')}</div>`;
    $$('[data-sw]', pg).forEach(b => b.onclick = () => { localStorage.setItem('pos_shop', b.dataset.sw); location.hash = 'dashboard'; location.reload(); });
  };
  if ($('#nbr')) $('#nbr').onclick = () => formModal('เพิ่มสาขาใหม่', [{ k: 'name', label: 'ชื่อร้าน / สาขา', req: true, full: true }, { k: 'branch_name', label: 'ชื่อสาขา' }, { k: 'branch_code', label: 'รหัสสาขา', def: '00001' },
    { k: 'copy', label: 'คัดลอกสินค้าและหมวดหมู่จากสาขานี้ (สต็อกเริ่มที่ 0)', type: 'check', def: true }], { name: S.shop.name, branch_code: String(S.shops.length).padStart(5, '0') }, async o => {
    const shop = await q(sb.from('shops').insert({ name: o.name, owner_id: S.user.id }).select().single()); const sid = shop.id;
    const keep = ['address', 'phone', 'tax_id', 'vat_mode', 'vat_rate', 'promptpay_id', 'receipt_header', 'receipt_footer', 'points_per_baht', 'baht_per_point', 'logo_url', 'receipt_size', 'brand_color', 'era', 'decimals', 'business_type'];
    await sb.from('shops').update({ ...Object.fromEntries(keep.map(k => [k, S.shop[k]])), branch_name: o.branch_name || '', branch_code: o.branch_code || '' }).eq('id', sid);
    if (o.copy) { const map = {};
      for (const c of S.categories) { const n = await q(sb.from('categories').insert({ shop_id: sid, name: c.name, color: c.color, sort: c.sort }).select('id').single()); map[c.id] = n.id; }
      const rows = S.products.filter(p => p.active !== false).map(p => { const r = { ...p }; delete r.id; delete r.created_at; return { ...r, shop_id: sid, stock: 0, category_id: map[p.category_id] || null, supplier_id: null }; });
      for (let i = 0; i < rows.length; i += 200) await q(sb.from('products').insert(rows.slice(i, i + 200))); }
    toast('สร้างสาขาแล้ว — กำลังโหลดใหม่', 'ok'); setTimeout(() => location.reload(), 800);
  });
  rangeBar($('#brr'), (a, b) => { A = a; B = b; load().catch(fail); }, 'month');
};

/* ===================================================================== BRANDING */
function applyBrand() {
  const sh = S.shop || {}; const c = sh.brand_color;
  const root = document.documentElement.style;
  if (c && /^#[0-9a-f]{6}$/i.test(c)) { root.setProperty('--brand', c); root.setProperty('--brand2', c); root.setProperty('--grad', c); }
  else ['--brand', '--brand2', '--grad'].forEach(k => root.removeProperty(k));
  if (sh.name) { document.title = sh.name + ' · Yanisa Shop'; localStorage.setItem('pos_brand', JSON.stringify({ name: sh.name, logo: sh.logo_url || '', color: c || '' })); }
  const lg = $('.side .logo'); if (lg) {
    { const i = lg.querySelector('i'); if (i) { i.style.background = 'transparent'; i.style.boxShadow = 'none'; i.innerHTML = `<img src="${esc(sh.logo_url || 'logo-round.png')}" alt="" style="width:100%;height:100%;object-fit:contain">`; } }
    const lt = lg.querySelector('.lt'); if (lt && lt.firstChild?.nodeType === 3) lt.firstChild.textContent = sh.name;
    const sn = lg.querySelector('.shopname'); if (sn) sn.textContent = sh.branch_name || (S.shops.length > 1 ? 'สาขา ' + (sh.branch_code || '') : 'Yanisa Shop');
  }
  const meta = document.querySelector('meta[name=theme-color]'); if (meta && c) meta.content = c;
}
const _renderShell4 = renderShell;
renderShell = function () { _renderShell4(); applyBrand(); };
const _renderAuth4 = renderAuth;
renderAuth = function () {
  _renderAuth4();
  let br = {}; try { br = JSON.parse(localStorage.getItem('pos_brand') || '{}'); } catch {}
  if (br.color) document.documentElement.style.setProperty('--brand', br.color);
  const bm = $('.auth .brandmark'); if (bm) bm.outerHTML = '<span style="flex:1"></span>';
  $('.auth .card .row')?.insertAdjacentHTML('afterend', '<img class="authlogo" src="logo-round.png" alt="Yanisa Shop">');
  document.title = 'Yanisa Shop';
  $('.auth .card')?.insertAdjacentHTML('beforeend', `<p class="muted" style="font-size:11px;text-align:center;margin:10px 0 0">v${APP_VERSION}</p>`);
};

/* settings: brand & receipt-image & barcode card */
const _settings4 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings4(pg);
  const sh = S.shop, edit = canDo('manage_settings');
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('afterbegin', `<div class="card" style="margin-bottom:16px"><h3 style="margin-top:0">🎨 แบรนด์ร้าน · ใบเสร็จรูปภาพ · บาร์โค้ด</h3>
    <div class="grid2"><div class="fg"><label class="f">สีหลักของแอป</label><div class="row"><input type="color" class="in" id="bcol" value="${esc(sh.brand_color || '#1d4ed8')}" style="width:64px;padding:4px" ${edit ? '' : 'disabled'}>
      ${['#1d4ed8', '#0f766e', '#7c3aed', '#be123c', '#c2410c', '#15803d', '#0f172a'].map(c => `<button type="button" class="swatch" data-col="${c}" style="background:${c}" ${edit ? '' : 'disabled'}></button>`).join('')}
      <button type="button" class="btn sm" id="bcolx" ${edit ? '' : 'disabled'}>ค่าเริ่มต้น</button></div></div>
      <div class="fg"><label class="f">เลขนำหน้าบาร์โค้ดภายในร้าน (200–299)</label><input class="in" id="bpre" value="${esc(sh.barcode_prefix || '200')}" maxlength="5" inputmode="numeric" ${edit ? '' : 'disabled'}></div></div>
    <label class="row"><input type="checkbox" id="basr" ${sh.auto_save_receipt ? 'checked' : ''} ${edit ? '' : 'disabled'}> บันทึกรูปใบเสร็จลงเครื่องอัตโนมัติหลังชำระเงินทุกบิล (แกลเลอรี / โฟลเดอร์ดาวน์โหลด)</label>
    <p class="muted" style="font-size:13px">ชื่อร้านและโลโก้ (ตั้งค่าในหัวข้อ “ข้อมูลร้าน”) จะแสดงที่หน้าเข้าสู่ระบบ แถบเมนู ชื่อแท็บ และใบเสร็จ · เวอร์ชันแอป ${APP_VERSION}</p>
    ${edit ? '<button type="button" class="btn p" id="bsave">💾 บันทึกแบรนด์</button>' : ''}</div>`);
  $$('[data-col]', pg).forEach(b => b.onclick = () => { $('#bcol').value = b.dataset.col; document.documentElement.style.setProperty('--brand', b.dataset.col); });
  $('#bcol').oninput = e => document.documentElement.style.setProperty('--brand', e.target.value);
  if ($('#bcolx')) $('#bcolx').onclick = () => { $('#bcol').value = '#1d4ed8'; $('#bcol').dataset.reset = '1'; };
  if ($('#bsave')) $('#bsave').onclick = async () => {
    const pre = $('#bpre').value.replace(/\D/g, '');
    if (!/^2\d{2,4}$/.test(pre)) return toast('เลขนำหน้าควรขึ้นต้นด้วย 2 (สำหรับใช้ภายในร้าน) และยาว 3–5 หลัก', 'bad');
    try { Object.assign(sh, await q(sb.from('shops').update({ brand_color: $('#bcol').dataset.reset ? '' : $('#bcol').value, barcode_prefix: pre, auto_save_receipt: $('#basr').checked }).eq('id', sh.id).select().single()));
      logAct('settings', 'shop', 'แบรนด์', {}); applyBrand(); toast('บันทึกแล้ว', 'ok'); } catch (e) { fail(e); }
  };
};

/* ===================================================================== AUTO UPDATE (silent) */
const canAutoReload = () => { const a = document.activeElement; return !(S.cart && S.cart.length) && !document.querySelector('.mbg, .cmdk') && !(a?.matches?.('input,textarea,select') && a.value); };
let UPD = null;
const updTries = ver => +(sessionStorage.getItem('pos_upd_try_' + ver) || 0);
async function applyUpdate(ver) {
  if (updTries(ver) >= 2) { UPD = null; $('#updchip')?.remove(); return; }   // never loop: at most 2 reloads per new version
  sessionStorage.setItem('pos_upd_try_' + ver, updTries(ver) + 1);
  try { const regs = await navigator.serviceWorker?.getRegistrations?.() || []; await Promise.all(regs.map(x => x.update().catch(() => {})));
    if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch {}
  sessionStorage.setItem('pos_updated_to', ver); location.reload();
}
async function checkUpdate(manual) {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
    const v = await r.json();
    if (v.version && v.version !== APP_VERSION) {
      if (updTries(v.version) >= 2 && !manual) return;
      UPD = v.version;
      if (canAutoReload() || manual) return applyUpdate(v.version);
      if (!$('#updchip')) document.body.insertAdjacentHTML('beforeend', `<div id="updchip" class="updchip">✨ เวอร์ชันใหม่ ${esc(v.version)} — จะอัปเดตเองหลังจบบิลนี้</div>`);
    } else if (manual) toast('ใช้เวอร์ชันล่าสุดแล้ว (' + APP_VERSION + ')', 'ok');
  } catch {}
}
setInterval(() => { if (UPD && canAutoReload()) applyUpdate(UPD); }, 4000);
setTimeout(() => checkUpdate(), 2500); setInterval(() => checkUpdate(), 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
window.addEventListener('online', () => checkUpdate());
{ const u = sessionStorage.getItem('pos_updated_to'); if (u) { sessionStorage.removeItem('pos_updated_to'); if (u === APP_VERSION) setTimeout(() => toast(`อัปเดตเป็นเวอร์ชัน ${u} แล้ว ✨`, 'ok'), 1500); } }

/* ===================================================================== NATIVE APP (Android Capacitor / desktop) */
const isNativeApp = () => !!window.Capacitor?.isNativePlatform?.();
async function nativeSave(name, blob) {
  try {
    const { Filesystem, Share } = window.Capacitor.Plugins;
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
    const { uri } = await Filesystem.writeFile({ path: name, data: b64, directory: 'CACHE' });
    await Share.share({ title: name, url: uri, dialogTitle: 'บันทึก / ส่งไฟล์' });
  } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('บันทึกไฟล์ไม่สำเร็จ: ' + (e?.message || e), 'bad'); }
}
if (isNativeApp()) {
  const _aclick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download && /^(blob|data):/.test(this.href)) { const n = this.download; fetch(this.href).then(r => r.blob()).then(b => nativeSave(n, b)); return; }
    return _aclick.call(this);
  };
}
const APP_DL = 'https://github.com/khalil203/khalil203/releases/latest/download/';
const _settings4b = VIEWS.settings;
VIEWS.settings = pg => {
  _settings4b(pg);
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:16px"><h3 style="margin-top:0">📲 ดาวน์โหลดแอป · อัปเดต</h3>
    <p class="muted" style="margin-top:0">แอปทุกตัวเปิดระบบเดียวกันนี้และอัปเดตอัตโนมัติ — ข้อมูลเหมือนกันทุกเครื่อง · เวอร์ชันปัจจุบัน <b>${APP_VERSION}</b></p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <a class="btn" href="${APP_DL}YanisaShop.apk">🤖 Android (.apk)</a>
      <a class="btn" href="${APP_DL}YanisaShop-Setup.exe">🪟 Windows (ติดตั้ง .exe)</a>
      <a class="btn" href="${APP_DL}YanisaShop-Portable.exe">🪟 Windows (ไม่ต้องติดตั้ง)</a>
      <a class="btn" href="${APP_DL}YanisaShop-mac.dmg">🍎 Mac (.dmg)</a>
      <button type="button" class="btn" id="updChk">🔄 ตรวจหาอัปเดต</button></div>
    <p class="muted" style="font-size:13px">iPhone / iPad: เปิดลิงก์ใน Safari → แชร์ → “เพิ่มไปยังหน้าจอโฮม” · Android: ครั้งแรกให้อนุญาต “ติดตั้งแอปที่ไม่รู้จัก” · Windows: ถ้ามีคำเตือนกด “More info → Run anyway” · Mac: คลิกขวาที่แอป → Open</p></div>`);
  $('#updChk').onclick = () => checkUpdate(true);
};
