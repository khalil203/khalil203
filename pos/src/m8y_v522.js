/* ================= v5.2.2 — checkout receipt closes easily (big Done button, auto-close, Enter/Esc/tap outside),
   products & stock grids grouped by category with picture cards first ================= */

/* ---------- receipt after checkout ---------- */
const RCPT_AUTOCLOSE = () => num(localStorage.getItem('pos_rcpt_close') ?? 8);
const _showReceipt522 = showReceipt;
showReceipt = function (sale, items, cust, autoPrint) {
  _showReceipt522(sale, items, cust, autoPrint);
  const m = $$('.mbg').pop(); if (!m || !sale) return;
  const fresh = Date.now() - new Date(sale.created_at || Date.now()) < 60000 && S.page === 'pos';
  if (!fresh) return;
  m.classList.add('rcpt-done');
  const close = () => { if (!document.body.contains(m)) return; clearInterval(timer); document.removeEventListener('keydown', key, true); m.querySelector('.x')?.click(); setTimeout(() => ($('#psearch') || $('#gq'))?.blur(), 50); };
  const mb = $('.mb', m);
  if (!/ชำระเงินสำเร็จ/.test(mb?.textContent || '')) mb?.insertAdjacentHTML('afterbegin', `<div class="rd-ok"><span>✅</span><div><b>ชำระเงินเรียบร้อย</b><small>บิล ${esc(sale.bill_no)} · ${baht(sale.total)} · ${payName(sale.payment_method)}</small></div></div>`);
  const foot = $('.mf', m);
  foot?.insertAdjacentHTML('beforeend', `<button class="btn p lg rd-next" id="rdnext">✔ เสร็จ — ขายบิลถัดไป <span id="rdcd"></span></button>`);
  $('#rdnext', m).onclick = close;
  let left = RCPT_AUTOCLOSE(), timer = null;
  const tick = () => { const c = $('#rdcd', m); if (!c) return clearInterval(timer); if (left <= 0) return close(); c.textContent = `(${left})`; left--; };
  if (left > 0) { tick(); timer = setInterval(tick, 1000); }
  const stop = () => { clearInterval(timer); const c = $('#rdcd', m); if (c) c.textContent = ''; };
  $('.mb', m)?.addEventListener('pointerdown', stop); $$('.mf .btn:not(#rdnext)', m).forEach(b => b.addEventListener('pointerdown', stop));
  m.addEventListener('pointerdown', e => { if (e.target === m) close(); });
  const key = e => { if (!document.body.contains(m)) return document.removeEventListener('keydown', key, true); if ($$('.mbg').pop() !== m) return;
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
};
/* setting: auto-close seconds (sound & display section) */
const _settings522 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings522(pg);
  const host = $('#stf')?.parentElement || pg, v = RCPT_AUTOCLOSE();
  host.insertAdjacentHTML('beforeend', `<div class="card" data-sec="receipt"><h3 style="margin-top:0">🧾 หน้าต่างใบเสร็จหลังชำระเงิน</h3>
    <div class="pills" id="rcac">${[[0, 'ไม่ปิดเอง'], [3, '3 วินาที'], [5, '5 วินาที'], [8, '8 วินาที'], [15, '15 วินาที']].map(([s, l]) => `<button type="button" data-s="${s}" class="${s === v ? 'on' : ''}">${l}</button>`).join('')}</div>
    <p class="muted" style="font-size:12.5px;margin-bottom:0">ปิดเองอัตโนมัติ หรือกดปุ่ม “เสร็จ — ขายบิลถัดไป” / Enter / แตะนอกหน้าต่าง · ตั้งค่าแยกแต่ละเครื่อง</p></div>`);
  $$('#rcac [data-s]', pg).forEach(b => b.onclick = () => { localStorage.setItem('pos_rcpt_close', b.dataset.s); $$('#rcac [data-s]', pg).forEach(x => x.classList.toggle('on', x === b)); toast('บันทึกแล้ว', 'ok'); });
  $('.set-tabs .on', pg)?.click();
};

/* ---------- products & stock: group picture cards by category ---------- */
const catOrder = () => { const o = {}; [...S.categories].sort((a, b) => num(a.sort) - num(b.sort) || a.name.localeCompare(b.name, 'th')).forEach((c, i) => o[c.id] = i); return o; };
let GROUP_ON = localStorage.getItem('pos_grid_group') !== '0';
function groupGrid(g) {
  if (!g || g._grouping) return;
  const cards = $$(':scope > .pm[data-id]', g); if (!cards.length) return;
  g._grouping = true;
  try {
    $$(':scope > .grp-h', g).forEach(h => h.remove());
    if (!GROUP_ON) return;
    const ord = catOrder(), prod = id => S.products.find(p => p.id === id);
    const groups = new Map();
    cards.forEach(c => { const cid = prod(c.dataset.id)?.category_id || ''; if (!groups.has(cid)) groups.set(cid, []); groups.get(cid).push(c); });
    const keys = [...groups.keys()].sort((a, b) => (a === '' ? 1e6 : ord[a] ?? 1e5) - (b === '' ? 1e6 : ord[b] ?? 1e5));
    if (keys.length < 2 && keys[0] !== '') { /* single category view: no header needed */ return; }
    keys.forEach(k => {
      const c = S.categories.find(x => x.id === k), list = groups.get(k);
      const low = list.filter(el => { const p = prod(el.dataset.id); return p?.track_stock && p.stock <= p.low_stock; }).length;
      const h = document.createElement('div'); h.className = 'grp-h'; h.dataset.cat = k || '_none'; h.style.setProperty('--cc', c?.color || '#94a3b8');
      h.innerHTML = `<span class="gi">${c?.icon ? esc(c.icon) : '<i></i>'}</span><b>${esc(c?.name || 'ไม่มีหมวด')}</b><em>${list.length} รายการ</em>${low ? `<em class="w">⚠️ ใกล้หมด/หมด ${low}</em>` : ''}`;
      g.appendChild(h); list.forEach(el => g.appendChild(el));
    });
  } finally { setTimeout(() => { g._grouping = false; }, 0); }
}
function watchGrid(pg, sel) {
  const hook = () => { const g = $(sel, pg); if (!g || g._gw) return; g._gw = true;
    new MutationObserver(() => { if (!g._grouping) groupGrid(g); }).observe(g, { childList: true }); groupGrid(g); };
  new MutationObserver(hook).observe(pg, { childList: true, subtree: true }); hook();
  // group toggle next to the size controls
  const add = () => { const zs = $('#pzs', pg) || $('#szp', pg); if (!zs || $('#grpT', pg)) return;
    zs.insertAdjacentHTML('afterend', `<button type="button" class="btn sm grpT ${GROUP_ON ? 'on' : ''}" id="grpT" title="แบ่งตามหมวดหมู่">🗂️ แบ่งตามหมวด</button>`);
    $('#grpT', pg).onclick = e => { GROUP_ON = !GROUP_ON; localStorage.setItem('pos_grid_group', GROUP_ON ? '1' : '0'); e.currentTarget.classList.toggle('on', GROUP_ON); const g = $(sel, pg); if (g) { g._gw = false; go(S.page); } }; };
  new MutationObserver(add).observe(pg, { childList: true, subtree: true }); add();
}
const _products522 = VIEWS.products, _stock522 = VIEWS.stock;
VIEWS.products = pg => { const r = _products522(pg); watchGrid(pg, '#pmg'); pg.classList.add('ps-compact'); return r; };
VIEWS.stock = pg => { const r = _stock522(pg); watchGrid(pg, '#stkg'); pg.classList.add('ps-compact'); return r; };

/* v5.2.4 — stock page always opens with big picture cards; filters above the list */
if (localStorage.getItem('pos_sview_v524') !== '1') {
  localStorage.setItem('pos_sview_v524', '1'); localStorage.setItem('pos_sview', 'cards');
  if (num(localStorage.getItem('pos_ssize')) < 200) localStorage.setItem('pos_ssize', innerWidth < 600 ? '170' : '240');
  try { SVIEW.mode = 'cards'; SVIEW.size = num(localStorage.getItem('pos_ssize')); } catch {}
  if (num(localStorage.getItem('pos_psize') || 0) && num(localStorage.getItem('pos_psize')) < 200) localStorage.setItem('pos_psize', '230');
}
const _stock524 = VIEWS.stock;
VIEWS.stock = pg => { const r = _stock524(pg);
  const fix = () => { const scan = $('.stk-scan', pg), f = $('#stkf', pg), stk = $('#stk', pg); if (!scan || !f) return;
    if (scan.nextElementSibling !== f && !(stk && scan.nextElementSibling === stk && stk.nextElementSibling === f)) { (stk || scan).after(f); }
    const sc = $('#scats', pg); let a = f;
    if (sc) { if (a.nextElementSibling !== sc) a.after(sc); a = sc; }
    const g = $('#stkg', pg); if (g && a.nextElementSibling !== g) a.after(g); };
  fix(); new MutationObserver(fix).observe(pg, { childList: true }); return r; };
