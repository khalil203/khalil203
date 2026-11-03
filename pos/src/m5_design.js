/* ================= DESIGN OVERRIDE — Option C (premium retail touchscreen) ================= */
const SVG = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  dashboard: SVG('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  pos: SVG('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.2L21 7.5H6"/>'),
  sales: SVG('<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>'),
  products: SVG('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  stock: SVG('<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>'),
  purchases: SVG('<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v3h16v-3"/>'),
  members: SVG('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>'),
  promotions: SVG('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
  suppliers: SVG('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'),
  expenses: SVG('<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h3"/>'),
  reports: SVG('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
  shifts: SVG('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 12h18M8 4h8"/><circle cx="12" cy="16" r="1.2"/>'),
  staff: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  audit: SVG('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  settings: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  more: SVG('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  bell: SVG('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  scan: SVG('<path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M16 8v8"/>'),
  plus: SVG('<path d="M12 5v14M5 12h14"/>'),
  cash: SVG('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
  qr: SVG('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>'),
  card: SVG('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  user: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  store: SVG('<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'),
};

/* ---------- shell: line icons, global search, branch, notifications, profile ---------- */
const _renderShellC = renderShell;
renderShell = function () {
  _renderShellC();
  $$('[data-p]').forEach(b => { const ic = b.querySelector('.ic'); if (ic && ICON[b.dataset.p]) ic.innerHTML = ICON[b.dataset.p]; });
  const mb = $('#moreBtn .ic'); if (mb) mb.innerHTML = ICON.more;
  const logo = $('.side .logo i'); if (logo) logo.innerHTML = ICON.store;
  const sb2 = $('#shopBtn'); if (sb2) sb2.innerHTML = ICON.store;
  const nm = S.shop._name || S.user.user_metadata?.full_name || S.user.user_metadata?.name || S.user.email.split('@')[0];
  $('#net')?.insertAdjacentHTML('beforebegin', `
    <div class="gsearch">${ICON.search}<input id="gq" placeholder="ค้นหาสินค้า หรือสแกนบาร์โค้ด…" autocomplete="off"><kbd>F2</kbd></div>
    <span class="branch" title="สาขา">${ICON.store}<span>${esc(S.shop.name)}<small>${branchLine(S.shop)}</small></span></span>`);
  $('#net')?.insertAdjacentHTML('afterend', `<button class="iconbtn bellbtn" id="bell" title="การแจ้งเตือน">${ICON.bell}<i id="bellN" class="hidden"></i></button>
    <button class="profile" id="prof"><span class="av">${esc(nm.slice(0, 1).toUpperCase())}</span><span class="pn">${esc(nm)}<small>${ROLE_NAME(S.role)}</small></span></button>`);
  const gq = $('#gq');
  gq.oninput = () => { if (S.page === 'pos') { S.search = gq.value; drawGrid(); } };
  gq.onkeydown = e => {
    if (e.key !== 'Enter') return; const v = gq.value.trim(); if (!v) return;
    let qty = 1, code = v; const mm = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (mm) { qty = num(mm[1]); code = mm[2]; }
    const hit = S.products.find(p => p.active && (p.barcode === code || p.sku === code));
    if (S.page !== 'pos') { go('pos'); setTimeout(() => { if (hit) { sfx('scan'); addToCart(hit, qty); } else { S.search = v; $('#gq').value = v; drawGrid(); } }, 60); if (hit) gq.value = ''; return; }
    const list = filtered();
    if (hit) { sfx('scan'); addToCart(hit, qty); } else if (list.length === 1) addToCart(list[0], qty); else { if (!list.length) { sfx('error'); toast('ไม่พบสินค้าที่ค้นหา', 'bad'); } return; }
    gq.value = ''; S.search = ''; drawGrid();
  };
  $('#bell').onclick = showNotifications;
  $('#prof').onclick = profileMenu;
  refreshBell();
};
async function notifItems() {
  const items = [];
  const out = S.products.filter(p => p.active && p.track_stock && p.stock <= 0), low = S.products.filter(p => p.active && p.track_stock && p.stock > 0 && p.stock <= p.low_stock);
  if (out.length) items.push(['bad', '⛔', `สินค้าหมดสต็อก ${out.length} รายการ`, 'stock']);
  if (low.length) items.push(['warn', '⚠️', `สินค้าใกล้หมด ${low.length} รายการ`, 'stock']);
  const exp = S.products.filter(p => p.expiry_date && new Date(p.expiry_date) - Date.now() < 30 * 864e5);
  if (exp.length) items.push(['warn', '⌛', `สินค้าใกล้หมดอายุ ${exp.length} รายการ`, 'stock']);
  const oq = oqGet().filter(x => x.shop === S.shop.id).length; if (oq) items.push(['warn', '📶', `บิลออฟไลน์รอซิงก์ ${oq} บิล`, 'pos']);
  try { const { count } = await sb.from('sales').select('id', { count: 'exact', head: true }).eq('shop_id', S.shop.id).eq('pay_status', 'pending').neq('status', 'void');
    if (count) items.push(['warn', '⏳', `รอตรวจสอบการชำระเงิน ${count} บิล`, 'sales']); } catch (e) { /* offline */ }
  if (canDo('expenses')) try { const { count } = await sb.from('expenses').select('id', { count: 'exact', head: true }).eq('shop_id', S.shop.id).eq('status', 'pending');
    if (count) items.push(['info', '💸', `ค่าใช้จ่ายรออนุมัติ ${count} รายการ`, 'expenses']); } catch (e) { /* offline */ }
  return items;
}
async function refreshBell() { const n = (await notifItems()).length; const b = $('#bellN'); if (b) { b.textContent = n; b.classList.toggle('hidden', !n); } }
setInterval(() => S.shop && refreshBell(), 60000);
async function showNotifications() {
  const items = await notifItems();
  const m = modal('การแจ้งเตือน', items.length ? items.map(([c, ic, t, pg], i) => `<button class="notif ${c}" data-g="${pg}" style="--i:${i}"><span>${ic}</span><b>${t}</b><span class="muted">›</span></button>`).join('')
    : '<div class="empty">✓ ไม่มีการแจ้งเตือน</div>');
  $$('[data-g]', m).forEach(b => b.onclick = () => { m.close(); go(b.dataset.g); });
}
function profileMenu() {
  const nm = S.shop._name || S.user.user_metadata?.full_name || S.user.email.split('@')[0];
  const m = modal(nm, `<p class="muted" style="margin-top:0">${ROLE_NAME(S.role)} · ${esc(S.shop._username || S.user.email.split('@')[0])} · ${esc(S.shop.name)}</p>
    <div class="moregrid" style="grid-template-columns:repeat(3,1fr)">
      <button data-a="pw"><span>🔑</span>เปลี่ยนรหัสผ่าน</button><button data-a="theme"><span>${document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'}</span>โหมดสี</button>
      ${S.shops.length > 1 ? '<button data-a="shop"><span>🏬</span>สลับสาขา</button>' : ''}<button data-a="out"><span>🚪</span>ออกจากระบบ</button></div>`);
  $$('[data-a]', m).forEach(b => b.onclick = () => { m.close(); const a = b.dataset.a;
    if (a === 'pw') formModal('เปลี่ยนรหัสผ่าน', [{ k: 'p1', label: 'รหัสผ่านใหม่', type: 'password', req: true }, { k: 'p2', label: 'ยืนยันรหัสผ่านใหม่', type: 'password', req: true }], {}, async o => {
      if (o.p1.length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัวอักษร'); if (o.p1 !== o.p2) throw new Error('รหัสผ่านไม่ตรงกัน'); const { error } = await sb.auth.updateUser({ password: o.p1 }); if (error) throw error; });
    if (a === 'theme') setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    if (a === 'shop') go('settings');
    if (a === 'out') logout(); });
}
document.addEventListener('keydown', e => { if (e.key === 'F2' && S.page !== 'pos') { e.preventDefault(); $('#gq')?.focus(); } });

/* ---------- POS screen ---------- */
const _posView = VIEWS.pos;
VIEWS.pos = pg => {
  _posView(pg);
  pg.querySelector('.pos')?.classList.add('optc');
  const gq = $('#gq'); if (gq) { gq.value = S.search || ''; if (matchMedia('(min-width:861px)').matches) setTimeout(() => gq.focus(), 50); }
  const cats = $('#cats'); if (cats) {
    const place = () => { const on = cats.querySelector('.tab.on'); let ind = cats.querySelector('.cat-ind'); if (!ind) { ind = document.createElement('i'); ind.className = 'cat-ind'; cats.prepend(ind); }
      if (on) { ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`; ind.style.height = on.offsetHeight + 'px'; ind.style.top = on.offsetTop + 'px'; on.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' }); } };
    new MutationObserver(place).observe(cats, { childList: true }); requestAnimationFrame(place); window.addEventListener('resize', place);
  }
  if (matchMedia('(min-width:1600px)').matches && !pg.querySelector('.rprev')) pg.querySelector('.pos').insertAdjacentHTML('beforeend', '<aside class="rprev" id="rprev"></aside>');
  drawPreview();
};
const _productCardC = productCard;
productCard = function (p) {
  const h = _productCardC(p);
  const st = p.track_stock ? `<span class="stk ${p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok'}">${p.stock <= 0 ? 'หมด' : 'คงเหลือ ' + qtyf(p.stock)}</span>` : '';
  return h.replace(/<div class="pr">([\s\S]*?)<\/div><\/div>$/, `<div class="pr"><b>${baht(num(p.promo_price) > 0 ? p.promo_price : p.price)}</b>${num(p.promo_price) > 0 ? `<s class="muted">${money(p.price)}</s>` : ''}<button class="qadd" title="เพิ่มลงตะกร้า">${ICON.plus}</button></div>${VIEWP.showStock ? `<div class="stkrow">${st}<small class="muted">${esc(p.unit)}</small></div>` : ''}</div>`);
};

/* ---------- cart ---------- */
const _drawCartC = drawCart;
drawCart = function () {
  _drawCartC();
  const el = $('#cart'); if (!el) return;
  const hds = el.querySelectorAll('.hd');
  if (hds[1] && !el.querySelector('.colhead') && S.cart.length) hds[1].insertAdjacentHTML('afterend', '<div class="colhead"><span>สินค้า</span><span>จำนวน</span><span>ราคา</span></div>');
  // customer card instead of small member button
  const mb = $('#memBtn', el);
  if (mb) { mb.classList.add('custbtn'); mb.innerHTML = S.customer ? `<span class="av sm">${esc(S.customer.name.slice(0, 1))}</span><span><b>${esc(S.customer.name)}</b><small>${qtyf(S.customer.points)} แต้ม${num(S.customer.balance) ? ' · ค้าง ' + money(S.customer.balance) : ''}</small></span>`
    : `<span class="av sm">${ICON.user}</span><span><b>ลูกค้าทั่วไป</b><small>แตะเพื่อเลือกสมาชิก</small></span>`; }
  // animated removal
  $$('[data-d]', el).forEach(b => { const old = b.onclick; b.onclick = () => { const l = S.cart[+b.dataset.d]; if (l && l.qty <= 1) { b.closest('.citem')?.classList.add('out'); setTimeout(old, 170); } else old(); }; });
  // payment quick tiles + big total
  const pay = $('#payBtn', el);
  if (pay && !el.querySelector('.paytiles')) {
    const ms = shopMethods(); const tiles = [['cash', ICON.cash, 'เงินสด'], ['promptpay', ICON.qr, 'พร้อมเพย์'], [ms.includes('credit_card') ? 'credit_card' : 'transfer', ICON.card, ms.includes('credit_card') ? 'บัตร' : 'โอนเงิน']].filter(t => ms.includes(t[0]));
    pay.insertAdjacentHTML('beforebegin', `<div class="paytiles">${tiles.map(([k, ic, l]) => `<button data-q="${k}" ${S.cart.length ? '' : 'disabled'}>${ic}<span>${l}</span></button>`).join('')}</div>`);
    $$('.paytiles [data-q]', el).forEach(b => b.onclick = () => { S._payPreset = b.dataset.q; payDialog(); });
  }
  drawPreview();
};
function drawPreview() {
  const box = $('#rprev'); if (!box) return;
  const c = calc(), sh = S.shop;
  box.innerHTML = `<div class="rp-h">ตัวอย่างใบเสร็จ</div><div class="rp-paper">
    <div class="c b">${esc(sh.name)}</div><div class="c muted" style="font-size:11px">${dLong(new Date())} · ${esc(S.shop._name || '')}</div>
    <div class="rp-cust">${S.customer ? `ลูกค้า: <b>${esc(S.customer.name)}</b>` : 'ลูกค้าทั่วไป'}</div>
    ${S.cart.length ? S.cart.map(l => `<div class="rp-l"><span>${esc(l.name)}<small>${qtyf(l.qty)} × ${money(l.price)}</small></span><b>${money(l.qty * l.price - num(l.discount))}</b></div>`).join('') : '<div class="muted c" style="padding:20px 0">ยังไม่มีสินค้า</div>'}
    <div class="rp-t"><span>ยอดรวม</span><span>${money(c.subtotal)}</span></div>${c.discount ? `<div class="rp-t"><span>ส่วนลด</span><span>-${money(c.discount)}</span></div>` : ''}
    ${sh.vat_mode !== 'none' ? `<div class="rp-t"><span>VAT ${num(sh.vat_rate)}%</span><span>${money(c.vat)}</span></div>` : ''}<div class="rp-t big"><span>ยอดสุทธิ</span><span>${baht(c.total)}</span></div>
    <div class="rp-bar"></div></div>`;
}

/* ---------- payment success feedback ---------- */
const _showReceiptC = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceiptC(sale, items, cust, autoPrint);
  const m = $$('.mbg').pop(); const mb = m?.querySelector('.mb'); if (!mb) return;
  mb.insertAdjacentHTML('afterbegin', `<div class="paid-ok"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg>
    <div><b>${sale.pay_status === 'pending' ? 'บันทึกแล้ว — รอตรวจสอบการชำระ' : 'ชำระเงินสำเร็จ'}</b><span>${esc(sale.bill_no)} · ${baht(sale.total)}${num(sale.change) ? ` · ทอน ${baht(sale.change)}` : ''}</span></div></div>`);
  mb.querySelector('.tline.big')?.remove();
};

const _goC = go;
go = function (page) { _goC(page); $('.top')?.classList.toggle('posmode', S.page === 'pos'); };
