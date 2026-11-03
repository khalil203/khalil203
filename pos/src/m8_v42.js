/* ================= v4.2 — payment confirmation, QR timer, shortcuts, command palette, dashboard strip,
   bulk edit, cash drawer, diagnostics, Android native integration ================= */

/* ---------- payment: confirm money received for non-cash, PromptPay QR countdown ---------- */
const _payDialog42 = payDialog;
payDialog = function () {
  _payDialog42();
  const m = $$('.mbg').pop(); if (!m) return;
  const needConfirm = S.shop.require_pay_confirm !== false;
  const curMethods = () => { const split = $('[data-sm]', m); return split ? $$('[data-sm]', m).map(s => s.value) : [$('.paym button.on', m)?.dataset.m || 'cash']; };
  let confirmed = false, timer = null;
  const decorate = () => {
    const nonCash = curMethods().filter(k => k !== 'cash');
    const pb = $('#pbody', m); if (!pb) return;
    if (needConfirm && nonCash.length && !$('#payok', m)) {
      confirmed = false;
      pb.insertAdjacentHTML('beforeend', `<label class="payok" id="payokw"><input type="checkbox" id="payok"> <span><b>ตรวจสอบแล้ว — ได้รับเงินจริง</b><small>ดูยอดเงินเข้าในแอปธนาคาร / เครื่องรูดบัตร ก่อนกดยืนยัน (${nonCash.map(payName).join(', ')})</small></span></label>`);
      $('#payok', m).onchange = e => { confirmed = e.target.checked; };
    }
    const qr = $('.qr', pb);
    if (qr && !$('.qrtimer', qr)) {
      clearInterval(timer);
      const end = Date.now() + Math.max(1, num(S.shop.qr_timeout_min) || 5) * 60000;
      qr.insertAdjacentHTML('beforeend', '<div class="qrtimer"></div>');
      const tick = () => { const el = $('.qrtimer', qr); if (!el) return clearInterval(timer);
        const left = Math.max(0, end - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
        if (left > 0) el.textContent = `QR ใช้ได้อีก ${mm}:${String(ss).padStart(2, '0')}`;
        else { clearInterval(timer); qr.classList.add('expired'); el.innerHTML = '⌛ QR หมดเวลา <button class="btn sm p" type="button" id="qrnew">สร้าง QR ใหม่</button>';
          $('#qrnew', qr).onclick = () => { const b = $('.paym button.on', m); if (b) b.click(); else { const s = $('[data-sm]', m); s?.dispatchEvent(new Event('change')); } }; } };
      tick(); timer = setInterval(tick, 1000);
    }
  };
  new MutationObserver(decorate).observe(m, { childList: true, subtree: true }); decorate();
  m.addEventListener('click', e => {
    if (e.target.closest('#cfm') && needConfirm && curMethods().some(k => k !== 'cash') && !$('#payok', m)?.checked) {
      e.stopImmediatePropagation(); e.preventDefault(); sfx('error');
      $('#payokw', m)?.classList.add('shake'); setTimeout(() => $('#payokw', m)?.classList.remove('shake'), 500);
      toast('กรุณาตรวจสอบว่าได้รับเงินแล้ว และติ๊ก “ตรวจสอบแล้ว” ก่อนยืนยัน', 'bad');
    }
  }, true);
  const obs = new MutationObserver(() => { if (!document.body.contains(m)) { clearInterval(timer); obs.disconnect(); } }); obs.observe(document.body, { childList: true });
};

/* ---------- keyboard shortcuts: F2 search · F4 pay · F8 hold · F9 resume · Ctrl+K palette ---------- */
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopPropagation(); return commandPalette(); }
  if (!['F2', 'F4', 'F8', 'F9'].includes(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  if ($('.mbg')) return;
  if (e.key === 'F2') { if (S.page !== 'pos') go('pos'); setTimeout(() => ($('#psearch') || $('#gq'))?.focus(), 60); }
  if (S.page !== 'pos') return;
  if (e.key === 'F4') $('#payBtn:not([disabled])')?.click();
  if (e.key === 'F8') $('#holdBtn:not([disabled])')?.click();
  if (e.key === 'F9') showHeld();
}, true);
const _drawCart42 = drawCart;
drawCart = function () { _drawCart42(); const k = $('#payBtn kbd'); if (k) k.textContent = 'F4'; const h = $('#holdBtn'); if (h && !h.title) h.title = 'พักบิล (F8)'; const r = $('#heldBtn'); if (r) r.title = 'บิลที่พักไว้ (F9)'; };

function commandPalette() {
  if ($('#cmdk')) return;
  const acts = [
    ...PAGES.filter(pageOK).map(p => ({ ic: '↪', t: 'ไปที่ ' + t(p.name), k: p.id + ' ' + p.name, run: () => go(p.id) })),
    { ic: '➕', t: 'ขายด่วน (สินค้านอกระบบ)', k: 'custom quick', run: () => { go('pos'); setTimeout(customItem, 200); } },
    { ic: '📂', t: 'บิลที่พักไว้ (F9)', k: 'held resume', run: () => { go('pos'); setTimeout(showHeld, 200); } },
    { ic: '🏷️', t: 'สร้างโปรโมชั่น', k: 'promo', run: () => { go('promotions'); setTimeout(() => promoForm(null, () => go('promotions')), 300); } },
    { ic: '🖨️', t: 'พิมพ์ฉลากบาร์โค้ด', k: 'label barcode', run: () => go('barcodes') },
    { ic: '💾', t: 'สำรองข้อมูล', k: 'backup', run: () => go('data') },
    { ic: '💰', t: 'เปิดลิ้นชักเงิน', k: 'drawer cash', run: () => openDrawer(true) },
    { ic: '🔄', t: 'ตรวจหาอัปเดต', k: 'update', run: () => checkUpdate(true) },
  ];
  document.body.insertAdjacentHTML('beforeend', `<div class="cmdk" id="cmdk"><div class="cmdk-box"><input class="in" id="cmdq" placeholder="พิมพ์คำสั่ง ชื่อหน้า หรือชื่อสินค้า…" autocomplete="off"><div id="cmdl"></div><div class="cmdk-ft">↑↓ เลือก · Enter ทำงาน · Esc ปิด · Ctrl+K เปิด</div></div></div>`);
  const box = $('#cmdk'), inp = $('#cmdq'); let sel = 0, list = [];
  const close = () => box.remove();
  const draw = () => {
    const v = inp.value.trim().toLowerCase();
    const prods = v.length >= 1 ? S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v))).slice(0, 6)
      .map(p => ({ ic: '🛒', t: `${p.name} · ${baht(p.promo_price > 0 ? p.promo_price : p.price)}`, k: '', run: () => { go('pos'); setTimeout(() => addToCart(p, 1), 150); } })) : [];
    list = [...acts.filter(a => !v || (a.t + ' ' + a.k).toLowerCase().includes(v)), ...prods].slice(0, 12); sel = Math.min(sel, Math.max(0, list.length - 1));
    $('#cmdl').innerHTML = list.map((a, i) => `<div class="cmdi ${i === sel ? 'on' : ''}" data-i="${i}"><span>${a.ic}</span>${esc(a.t)}</div>`).join('') || '<div class="muted" style="padding:12px">ไม่พบ</div>';
    $$('#cmdl [data-i]').forEach(d => d.onclick = () => { close(); list[+d.dataset.i].run(); });
  };
  inp.oninput = () => { sel = 0; draw(); };
  inp.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, list.length - 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { const a = list[sel]; close(); a?.run(); } else if (e.key === 'Escape') close(); };
  box.onclick = e => { if (e.target === box) close(); };
  draw(); inp.focus();
}

/* ---------- dashboard: fixed "today / this month" strip + sales by category ---------- */
const _dash42 = VIEWS.dashboard;
VIEWS.dashboard = pg => {
  _dash42(pg);
  pg.insertAdjacentHTML('afterbegin', `<div class="dstrip" id="dstrip"><div class="skel"><i></i></div></div>`);
  (async () => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); const m0 = new Date(d0.getFullYear(), d0.getMonth(), 1);
    const y0 = new Date(d0 - 864e5);
    const [ms, pays, items] = await Promise.all([
      fetchAll(() => sb.from('sales').select('total,refunded_total,cost_total,vat,created_at').eq('shop_id', S.shop.id).neq('status', 'void').gte('created_at', y0 < m0 ? y0.toISOString() : m0.toISOString())),
      fetchAll(() => sb.from('sale_payments').select('method,amount,created_at,sales!inner(status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('created_at', d0.toISOString())),
      fetchAll(() => sb.from('sale_items').select('product_id,qty,price,discount,refunded_qty,sales!inner(created_at,status)').eq('shop_id', S.shop.id).neq('sales.status', 'void').gte('sales.created_at', m0.toISOString())),
    ]);
    const net = r => num(r.total) - num(r.refunded_total);
    const today = ms.filter(r => new Date(r.created_at) >= d0), yest = ms.filter(r => new Date(r.created_at) >= y0 && new Date(r.created_at) < d0), month = ms.filter(r => new Date(r.created_at) >= m0);
    const sum = a => a.reduce((x, r) => x + net(r), 0);
    const cash = pays.filter(p => p.method === 'cash').reduce((x, p) => x + num(p.amount), 0), other = pays.filter(p => p.method !== 'cash').reduce((x, p) => x + num(p.amount), 0);
    const el = $('#dstrip'); if (!el) return;
    const tile = (k, v, sub = '', cls = '') => `<div class="dtile ${cls}"><small>${k}</small><b data-c="${v}">${baht(v)}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
    el.innerHTML = tile('ยอดขายวันนี้', sum(today), `${today.length} บิล · ${trend(sum(today), sum(yest))} จากเมื่อวาน`, 'hero') + tile('ยอดขายเดือนนี้', sum(month), `${month.length} บิล`)
      + tile('รับเงินสดวันนี้', cash, 'ก่อนหักคืนเงิน') + tile('รับโอน / สแกน / บัตร วันนี้', other, 'ก่อนหักคืนเงิน');
    $$('.dtile b', el).forEach(b => countTo(b, +b.dataset.c, baht));
    const byCat = {};
    items.forEach(i => { const p = S.products.find(x => x.id === i.product_id); const k = p ? catName(p.category_id) || 'ไม่มีหมวด' : 'สินค้านอกระบบ';
      byCat[k] = (byCat[k] || 0) + (num(i.qty) - num(i.refunded_qty)) * num(i.price) - num(i.discount); });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (cats.length) {
      el.insertAdjacentHTML('afterend', `<div class="card" id="dcat" style="margin-bottom:14px"><b>ยอดขายตามหมวดหมู่ (เดือนนี้)</b><div class="chartbox" style="height:240px"><canvas id="cCat"></canvas></div></div>`);
      await loadChart();
      chart('cCat', { type: 'bar', data: { labels: cats.map(c => c[0]), datasets: [{ data: cats.map(c => r2(c[1])), backgroundColor: cats.map((_, i) => `hsl(${220 + i * 23},70%,${50 + (i % 3) * 6}%)`), borderRadius: 8 }] },
        options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => baht(c.raw) } } }, scales: { x: { ticks: { callback: v => money(v) } } } } });
    }
  })().catch(e => { const el = $('#dstrip'); if (el) el.innerHTML = ''; console.warn(e); });
};

/* ---------- bulk product editing ---------- */
const _products42 = VIEWS.products;
VIEWS.products = pg => {
  _products42(pg);
  if (canDo('edit_products') && $('#tact') && !$('#bulkBtn')) { $('#tact').insertAdjacentHTML('afterbegin', '<button class="btn" id="bulkBtn">✏️ แก้ไขหลายรายการ</button>'); $('#bulkBtn').onclick = bulkEdit; }
};
function bulkEdit() {
  const sel = new Set(); let v = '', cat = '';
  const prices = canDo('edit_prices');
  const m = modal('แก้ไขสินค้าหลายรายการพร้อมกัน', `<div class="lbd" style="grid-template-columns:1fr 320px">
    <div><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><div class="sbox" style="flex:1;min-width:180px"><span>🔍</span><input class="in" id="bq"></div>
      <select class="in" id="bc" style="width:auto"><option value="">ทุกหมวด</option>${S.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
      <button class="btn sm" id="ball">เลือกทั้งหมดที่เห็น</button><button class="btn sm" id="bnone">ล้าง</button></div>
      <div id="bl" style="max-height:52vh;overflow:auto;border:1px solid var(--line);border-radius:12px"></div></div>
    <div class="card" style="background:var(--card2)"><b id="bcnt">เลือก 0 รายการ</b>
      <div class="fg"><label class="f">ย้ายไปหมวดหมู่</label><select class="in" id="xcat"><option value="">— ไม่เปลี่ยน —</option><option value="__none">ไม่มีหมวด</option>${S.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      ${prices ? `<div class="fg"><label class="f">ปรับราคาขาย</label><div class="row" style="gap:6px"><select class="in" id="xpm" style="width:auto"><option value="">— ไม่เปลี่ยน —</option><option value="pct">± %</option><option value="add">± บาท</option><option value="set">ตั้งเป็น</option></select><input class="in" id="xpv" type="number" step="any" placeholder="เช่น 10 หรือ -5"></div></div>
      <div class="fg"><label class="f">ราคาโปร (0 = ยกเลิก)</label><input class="in" id="xpp" type="number" step="any" placeholder="— ไม่เปลี่ยน —"></div>` : ''}
      <div class="fg"><label class="f">แจ้งเตือนเมื่อเหลือ</label><input class="in" id="xlow" type="number" step="any" placeholder="— ไม่เปลี่ยน —"></div>
      <div class="grid2"><div class="fg"><label class="f">รายการโปรด</label><select class="in" id="xfav"><option value="">—</option><option value="1">เปิด</option><option value="0">ปิด</option></select></div>
        <div class="fg"><label class="f">สถานะขาย</label><select class="in" id="xact"><option value="">—</option><option value="1">ขายอยู่</option><option value="0">ซ่อน/เลิกขาย</option></select></div></div>
      <div id="bprog" class="muted"></div></div></div>`, { wide: true, foot: '<button class="btn" data-c>ยกเลิก</button><button class="btn p" id="bapply">✔ ใช้กับรายการที่เลือก</button>' });
  m.querySelector('.modal')?.classList.add('xwide');
  const vis = () => S.products.filter(p => (!cat || p.category_id === cat) && (!v || p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v)));
  const draw = () => {
    $('#bl', m).innerHTML = vis().slice(0, 400).map(p => `<label class="row" style="padding:7px 10px;border-bottom:1px solid var(--line);gap:10px"><input type="checkbox" data-p="${p.id}" ${sel.has(p.id) ? 'checked' : ''}>
      <span style="flex:1">${esc(p.name)} ${p.active === false ? '<span class="chip">ซ่อน</span>' : ''}</span><small class="muted">${esc(catName(p.category_id))}</small><b>${money(p.price)}</b></label>`).join('');
    $$('[data-p]', m).forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.p) : sel.delete(c.dataset.p); $('#bcnt', m).textContent = `เลือก ${sel.size} รายการ`; });
    $('#bcnt', m).textContent = `เลือก ${sel.size} รายการ`;
  };
  $('#bq', m).oninput = e => { v = e.target.value.toLowerCase(); draw(); };
  $('#bc', m).onchange = e => { cat = e.target.value; draw(); };
  $('#ball', m).onclick = () => { vis().forEach(p => sel.add(p.id)); draw(); };
  $('#bnone', m).onclick = () => { sel.clear(); draw(); };
  $('[data-c]', m).onclick = m.close;
  $('#bapply', m).onclick = async () => {
    if (!sel.size) return toast('ยังไม่ได้เลือกสินค้า', 'bad');
    const xc = $('#xcat', m).value, pm = $('#xpm', m)?.value, pv = num($('#xpv', m)?.value), pp = $('#xpp', m)?.value, low = $('#xlow', m).value, fav = $('#xfav', m).value, act = $('#xact', m).value;
    if (!xc && !pm && pp === '' && low === '' && !fav && !act) return toast('ยังไม่ได้เลือกสิ่งที่จะเปลี่ยน', 'bad');
    if (!await confirmBox(`แก้ไขสินค้า ${sel.size} รายการ?`)) return;
    let ok = 0;
    for (const id of sel) {
      const p = S.products.find(x => x.id === id); if (!p) continue; const row = {};
      if (xc) row.category_id = xc === '__none' ? null : xc;
      if (pm && $('#xpv', m).value !== '') row.price = r2(Math.max(0, pm === 'pct' ? p.price * (1 + pv / 100) : pm === 'add' ? p.price + pv : pv));
      if (pp !== undefined && pp !== '') row.promo_price = num(pp);
      if (low !== '') row.low_stock = num(low);
      if (fav) row.favorite = fav === '1'; if (act) row.active = act === '1';
      try { Object.assign(p, await q(sb.from('products').update(row).eq('id', id).select().single())); ok++; } catch (e) { fail(e); break; }
      $('#bprog', m).textContent = `บันทึก ${ok}/${sel.size}`;
    }
    toast(`แก้ไขแล้ว ${ok} รายการ`, 'ok'); m.close(); go(S.page);
  };
  draw();
}

/* ---------- hardware: ESC/POS cash drawer over Web Serial, diagnostics ---------- */
let DRAWER_PORT = null;
async function drawerPort(ask) {
  if (!('serial' in navigator)) return null;
  if (DRAWER_PORT) return DRAWER_PORT;
  const ports = await navigator.serial.getPorts(); if (ports[0] && localStorage.getItem('pos_drawer') === '1') return (DRAWER_PORT = ports[0]);
  if (!ask) return null;
  DRAWER_PORT = await navigator.serial.requestPort(); localStorage.setItem('pos_drawer', '1'); return DRAWER_PORT;
}
async function openDrawer(manual) {
  try {
    if (!('serial' in navigator)) { if (manual) toast('อุปกรณ์นี้ไม่รองรับการสั่งลิ้นชักโดยตรง — ใช้ Chrome/Edge บนคอมพิวเตอร์ หรือเปิดผ่านไดรเวอร์เครื่องพิมพ์', 'bad'); return; }
    const port = await drawerPort(manual); if (!port) return;
    if (!port.readable) await port.open({ baudRate: +(localStorage.getItem('pos_drawer_baud') || 9600) });
    const w = port.writable.getWriter(); await w.write(new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa])); w.releaseLock();
    if (manual) toast('ส่งคำสั่งเปิดลิ้นชักแล้ว', 'ok');
    logAct('drawer_open', 'shop', manual ? 'เปิดเอง' : 'หลังขายเงินสด', {});
  } catch (e) { if (manual && e.name !== 'NotFoundError') fail(e); }
}
Object.assign(AUDIT_L, { drawer_open: 'เปิดลิ้นชักเงิน' });
const _showReceipt42 = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceipt42(sale, items, cust, autoPrint);
  const fresh = sale.created_at && Date.now() - new Date(sale.created_at) < 120000;
  if (fresh && localStorage.getItem('pos_drawer_auto') === '1' && /cash|mixed/.test(sale.payment_method || '')) openDrawer(false);
};
function diagnostics() {
  const ok = b => b ? '<span class="chip ok">รองรับ</span>' : '<span class="chip">ไม่รองรับ</span>';
  return `<div class="kv" style="font-size:14px">
    <span>แอปบนเครื่อง (Android)</span><b>${isNativeApp() ? '<span class="chip ok">ใช่</span>' : 'ไม่ใช่ (เว็บ/เดสก์ท็อป)'}</b>
    <span>สแกนเนอร์ USB / Bluetooth (โหมดคีย์บอร์ด)</span><b>${ok(true)}</b>
    <span>กล้องสแกนบาร์โค้ด</span><b>${ok(!!navigator.mediaDevices?.getUserMedia)}</b>
    <span>พิมพ์ผ่านหน้าต่างพิมพ์ (58/80 มม./A4)</span><b>${isNativeApp() ? 'ส่งเป็นรูปไปแอปเครื่องพิมพ์ (เช่น RawBT)' : ok(typeof print === 'function')}</b>
    <span>Web Serial (ลิ้นชัก/เครื่องชั่ง/เครื่องพิมพ์ ESC/POS)</span><b>${ok('serial' in navigator)}</b>
    <span>WebUSB</span><b>${ok('usb' in navigator)}</b><span>Web Bluetooth</span><b>${ok('bluetooth' in navigator)}</b>
    <span>ทำงานออฟไลน์ (Service Worker)</span><b>${ok('serviceWorker' in navigator)}</b>
    <span>อินเทอร์เน็ต</span><b>${navigator.onLine ? '<span class="chip ok">ออนไลน์</span>' : '<span class="chip bad">ออฟไลน์</span>'}</b>
    <span>บิลออฟไลน์รอส่ง</span><b>${oqGet().length}</b>
    <span>หน้าจอ</span><b>${innerWidth} × ${innerHeight} · ${matchMedia('(pointer:coarse)').matches ? 'จอสัมผัส' : 'เมาส์'}</b>
    <span>เวอร์ชันแอป</span><b>${APP_VERSION}</b></div>
    <p class="muted" style="font-size:12px">ข้อมูลนี้ตรวจจากเบราว์เซอร์จริง — สถานะการเชื่อมต่อเครื่องพิมพ์ผ่านหน้าต่างพิมพ์ของระบบไม่สามารถตรวจจากเว็บได้</p>`;
}
const _settings42 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings42(pg);
  const sh = S.shop, edit = canDo('manage_settings'), host = $('#stf')?.parentElement || pg;
  const cm = new Set(shopMethods());
  host.insertAdjacentHTML('beforeend', `<div class="grid2" style="margin-top:16px"><div class="card"><h3 style="margin-top:0">💳 ช่องทางชำระเงินที่หน้าขาย</h3>
      <div class="pills" id="cmx">${PAY_CHOICES.map(k => `<button type="button" data-k="${k}" class="${cm.has(k) ? 'on' : ''}" ${edit ? '' : 'disabled'}>${payIcon(k)} ${payName(k)}</button>`).join('')}</div>
      <label class="row" style="margin-top:10px"><input type="checkbox" id="rpc" ${sh.require_pay_confirm !== false ? 'checked' : ''} ${edit ? '' : 'disabled'}> บังคับติ๊ก “ตรวจสอบแล้ว ได้รับเงินจริง” ก่อนบันทึก (สแกน/โอน/บัตร)</label>
      <div class="fg" style="margin-top:8px"><label class="f">QR พร้อมเพย์หมดเวลา (นาที)</label><input class="in" id="qrt" type="number" min="1" max="60" value="${num(sh.qr_timeout_min) || 5}" ${edit ? '' : 'disabled'}></div>
      <p class="muted" style="font-size:12px">โอนเงิน / บัตร เป็นการบันทึกยอด — ลูกค้าจ่ายผ่านแอปธนาคารหรือเครื่องรูดบัตรของธนาคาร ระบบไม่ตัดเงินเอง และไม่ยืนยันยอดอัตโนมัติ</p>
      ${edit ? '<button type="button" class="btn p" id="cmsave">💾 บันทึกช่องทางชำระเงิน</button>' : ''}</div>
    <div class="card"><h3 style="margin-top:0">🧰 ลิ้นชักเงิน & ตรวจสอบอุปกรณ์</h3>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="dwc">🔌 เชื่อมต่อเครื่องพิมพ์/ลิ้นชัก (USB-Serial)</button><button type="button" class="btn" id="dwt">💰 ทดสอบเปิดลิ้นชัก</button></div>
      <label class="row" style="margin-top:8px"><input type="checkbox" id="dwa" ${localStorage.getItem('pos_drawer_auto') === '1' ? 'checked' : ''}> เปิดลิ้นชักอัตโนมัติหลังขายเงินสด (เครื่องนี้)</label>
      <div class="fg"><label class="f">Baud rate</label><select class="in" id="dwb">${[9600, 19200, 38400, 115200].map(b => `<option ${String(b) === (localStorage.getItem('pos_drawer_baud') || '9600') ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <details style="margin-top:8px"><summary class="b" style="cursor:pointer">ตรวจสอบอุปกรณ์ (Device diagnostics)</summary>${diagnostics()}</details></div></div>`);
  $$('#cmx [data-k]', pg).forEach(b => b.onclick = () => { if (b.dataset.k === 'cash') return toast('ต้องมีเงินสดเสมอ', 'bad'); b.classList.toggle('on'); });
  if ($('#cmsave')) $('#cmsave').onclick = async () => {
    const list = $$('#cmx [data-k].on', pg).map(b => b.dataset.k); if (!list.includes('cash')) list.unshift('cash');
    try { Object.assign(sh, await q(sb.from('shops').update({ checkout_methods: list, require_pay_confirm: $('#rpc').checked, qr_timeout_min: Math.max(1, Math.min(60, num($('#qrt').value) || 5)) }).eq('id', sh.id).select().single()));
      logAct('settings', 'shop', 'ช่องทางชำระเงิน', { methods: list }); toast('บันทึกแล้ว', 'ok'); } catch (e) { fail(e); }
  };
  $('#dwc').onclick = async () => { try { DRAWER_PORT = null; await drawerPort(true); toast('เชื่อมต่อแล้ว', 'ok'); } catch (e) { if (e.name !== 'NotFoundError') fail(e); } };
  $('#dwt').onclick = () => openDrawer(true);
  $('#dwa').onchange = e => localStorage.setItem('pos_drawer_auto', e.target.checked ? '1' : '0');
  $('#dwb').onchange = e => { localStorage.setItem('pos_drawer_baud', e.target.value); DRAWER_PORT = null; };
};

/* ---------- Android app (Capacitor): back button, status bar, splash, printing ---------- */
if (isNativeApp()) {
  const P = window.Capacitor.Plugins;
  try { P.StatusBar?.setBackgroundColor({ color: '#ffffff' }); P.StatusBar?.setStyle({ style: 'LIGHT' }); } catch {}
  setTimeout(() => { try { P.SplashScreen?.hide(); } catch {} }, 600);
  P.App?.addListener('backButton', async () => {
    const top = $$('.mbg').pop(); if (top) return $('.x', top)?.click();
    if ($('#cmdk')) return $('#cmdk').remove();
    if ($('#cart.open')) return $('#cart').classList.remove('open');
    if (S.page && S.page !== 'pos' && S.page !== 'dashboard' && S.shop) return go(PAGES.find(pageOK)?.id === 'dashboard' ? 'dashboard' : 'pos');
    if (await confirmBox('ปิดแอป Yanisa Shop?')) P.App.exitApp();
  });
  P.App?.addListener('appStateChange', st => { if (st.isActive) { checkUpdate(); syncQueue?.(); } });
  /* Android WebView has no window.print(): render the page to an image and share it to a printer app (RawBT, Bluetooth printer apps, PDF) */
  printReceipt = async function (html) {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;background:#fff;width:' + (/class="lbls"/.test(html) ? '800px' : (S.shop.receipt_size === '58' ? '384px' : '576px'));
    host.innerHTML = html.replace(/@page\{[^}]*\}/g, ''); document.body.appendChild(host);
    try { await loadH2C(); const c = await html2canvas(host, { scale: 2, backgroundColor: '#fff', useCORS: true });
      const blob = await new Promise(r => c.toBlob(r, 'image/png')); await nativeSave(`print_${Date.now()}.png`, blob);
      toast('เลือกแอปเครื่องพิมพ์ (เช่น RawBT) เพื่อพิมพ์', 'ok');
    } catch (e) { fail(e); } finally { host.remove(); }
  };
}
