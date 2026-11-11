/* ================= v4.6.3 — stock page: big-picture cards, grouped by category,
   category slide bar, adjustable images-per-row (like the barcode page) ================= */
let SVIEW = { mode: localStorage.getItem('pos_sview') || 'cards', f: 'all', cat: '', sort: 'name', q: '' };
const _stock463 = VIEWS.stock;
VIEWS.stock = pg => {
  _stock463(pg);
  const scan = $('.stk-scan', pg); if (!scan) return;
  const dayMs = 864e5, now = Date.now();
  const F = {
    all: ['ทั้งหมด', p => true], low: ['⚠️ ใกล้หมด', p => p.track_stock && p.stock > 0 && p.stock <= p.low_stock], out: ['⛔ หมด', p => p.track_stock && p.stock <= 0],
    exp: ['⌛ ใกล้หมดอายุ', p => p.expiry_date && new Date(p.expiry_date) - now < 30 * dayMs], over: ['📈 เกินสูงสุด', p => num(p.max_stock) > 0 && p.stock > p.max_stock],
    nobc: ['🏷️ ไม่มีบาร์โค้ด', p => !p.barcode], fav: ['★ รายการโปรด', p => p.favorite], off: ['🚫 ปิดขาย', p => p.active === false],
  };
  const SORT = { name: ['ชื่อ ก-ฮ', (a, b) => a.name.localeCompare(b.name, 'th')], low: ['สต็อกน้อย → มาก', (a, b) => num(a.stock) - num(b.stock)], high: ['สต็อกมาก → น้อย', (a, b) => num(b.stock) - num(a.stock)],
    value: ['มูลค่าสต็อกสูงสุด', (a, b) => Math.max(0, b.stock) * b.cost - Math.max(0, a.stock) * a.cost], exp: ['หมดอายุก่อน', (a, b) => (a.expiry_date || '9999').localeCompare(b.expiry_date || '9999')] };
  scan.insertAdjacentHTML('afterend', `<div class="card stk-filter" id="stkf">
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <div class="seg" id="svm"><button data-m="cards">🖼️ รูปใหญ่</button><button data-m="table">☰ ตาราง / ประวัติ</button></div>
        <div class="sbox" style="flex:1;min-width:160px"><span>🔍</span><input class="in" id="sfq" placeholder="กรองชื่อ / บาร์โค้ด" value="${esc(SVIEW.q)}"></div>
        <select class="in" id="sfs" style="width:auto">${Object.entries(SORT).map(([k, [l]]) => `<option value="${k}" ${SVIEW.sort === k ? 'selected' : ''}>เรียง: ${l}</option>`).join('')}</select>
        ${pmColBar('szc')}</div>
      <div class="bcs-wrap" id="scats" style="margin-top:8px"></div>
      <div class="pills" id="sff" style="margin-top:8px"></div></div>
    <div class="pmgrid" id="stkg"></div>`);
  const placeStats = () => { const stk = $('#stk', pg); if (stk && stk.previousElementSibling !== scan) scan.after(stk); };
  placeStats(); new MutationObserver(placeStats).observe(pg, { childList: true });
  const searched = () => S.products.filter(p => p.active !== false &&
    (!SVIEW.q || p.name.toLowerCase().includes(SVIEW.q.toLowerCase()) || (p.barcode || '').includes(SVIEW.q) || (p.sku || '').toLowerCase().includes(SVIEW.q.toLowerCase())));
  const base = () => S.products.filter(p => (!SVIEW.cat || p.category_id === SVIEW.cat) &&
    (!SVIEW.q || p.name.toLowerCase().includes(SVIEW.q.toLowerCase()) || (p.barcode || '').includes(SVIEW.q) || (p.sku || '').toLowerCase().includes(SVIEW.q.toLowerCase())));
  const draw = () => {
    const cards = SVIEW.mode === 'cards';
    pg.classList.toggle('stkcards', cards);
    $$('#svm button', pg).forEach(b => b.classList.toggle('on', b.dataset.m === SVIEW.mode));
    $('#szc', pg).style.display = $('#scats', pg).style.display = cards ? '' : 'none';
    $('#scats', pg).innerHTML = catSlideBar(SVIEW.cat, searched());
    $$('#scats [data-cat]', pg).forEach(b => b.onclick = () => { SVIEW.cat = b.dataset.cat; draw(); pg.scrollTo({ top: 0, behavior: 'smooth' }); });
    catSpy(pg, '#scats', '#stkg');
    const b0 = base();
    $('#sff', pg).innerHTML = Object.entries(F).map(([k, [l, fn]]) => { const n = b0.filter(p => (k === 'all' ? (p.track_stock && p.active !== false) : k === 'off' ? p.active === false : p.active !== false && fn(p))).length;
      return `<button data-f="${k}" class="${SVIEW.f === k ? 'on' : ''}">${l} <small>${n}</small></button>`; }).join('');
    $$('#sff [data-f]', pg).forEach(b => b.onclick = () => { SVIEW.f = b.dataset.f; draw(); });
    const g = $('#stkg', pg); g.style.display = cards ? '' : 'none'; if (!cards) return;
    const cols = pmColGet('s'), px = pmPxFor(pg, cols); const cv = $('#szc .colv', pg); if (cv) cv.textContent = cols + ' / แถว';
    g.style.gridTemplateColumns = `repeat(${cols},minmax(0,1fr))`; g.style.setProperty('--pm', px + 'px');
    const list = b0.filter(p => SVIEW.f === 'all' ? p.track_stock && p.active !== false : SVIEW.f === 'off' ? p.active === false : p.active !== false && F[SVIEW.f][1](p)).sort(SORT[SVIEW.sort][1]);
    const prof = canDo('view_profit');
    const card = p => { const st = !p.track_stock ? '' : p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok';
      const exp = p.expiry_date ? Math.ceil((new Date(p.expiry_date) - now) / dayMs) : null;
      return `<div class="pm sk" data-id="${p.id}">
        <div class="pm-img" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : `background:linear-gradient(135deg,${esc(p.tile_color || catColor(p.category_id))},${esc(p.tile_color || catColor(p.category_id))}aa)`}">
          ${p.image_url ? '' : `<span>${esc([...p.name].slice(0, 2).join(''))}</span>`}
          ${p.favorite ? '<i class="pm-fav">★</i>' : ''}
          ${exp != null && exp <= 30 ? `<i class="pm-promo" style="background:${exp < 0 ? '#e5384f' : '#e38a06'}">⌛ ${exp < 0 ? 'หมดอายุ' : 'อีก ' + exp + ' วัน'}</i>` : ''}
          ${canDo('manage_inventory') ? `<div class="pm-acts"><button data-k="in" title="รับเข้า">➕</button><button data-k="out" title="เบิกออก">➖</button><button data-k="adjust" title="ตรวจนับ">⚖️</button></div>` : ''}</div>
        <div class="pm-body"><b class="pm-name">${esc(p.name)}</b>
          <div class="pm-row"><span class="pm-price">${baht(p.price)}</span><span class="sp"></span>${p.track_stock ? `<span class="chip ${st}">${qtyf(p.stock)} ${esc(p.unit)}</span>` : '<span class="chip">ไม่ตัดสต็อก</span>'}</div>
          <div class="pm-meta">${p.barcode ? `<code>${esc(p.barcode)}</code>` : '<span class="chip warn">ไม่มีบาร์โค้ด</span>'}<span>${esc(catName(p.category_id))}</span></div></div></div>`; };
    g.innerHTML = list.length ? list.slice(0, 600).map(card).join('') : '<div class="empty" style="grid-column:1/-1">ไม่มีสินค้าตามตัวกรองนี้</div>';
  };
  $('#stkg', pg).onclick = e => { const el = e.target.closest('.pm[data-id]'); if (!el) return; const p = S.products.find(x => x.id === el.dataset.id); if (!p) return;
    const k = e.target.closest('[data-k]')?.dataset.k; if (k) return stockForm(p, k, () => go('stock')); stockQuick(p, () => go('stock')); };
  $$('#svm button', pg).forEach(b => b.onclick = () => { SVIEW.mode = b.dataset.m; localStorage.setItem('pos_sview', SVIEW.mode); draw(); });
  $('#sfq', pg).oninput = e => { SVIEW.q = e.target.value; draw(); };
  $('#sfs', pg).onchange = e => { SVIEW.sort = e.target.value; draw(); };
  $$('#szc [data-z]', pg).forEach(b => b.onclick = () => { pmColStep('s', +b.dataset.z); draw(); });
  draw();
};
