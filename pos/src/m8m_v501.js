/* ================= v5.0.1 — tidy sell screen (view popover, overflow menu, fewer duplicate buttons),
   tablet-friendly layout, branded loading screen ================= */

/* ---------- loading screen ---------- */
document.documentElement.classList.add('v5');
function hideBoot() { const b = document.getElementById('boot'); if (!b || b.classList.contains('out')) return; b.classList.add('out'); setTimeout(() => b.remove(), 450); }
function bootMsg(t) { const m = document.querySelector('#boot .bt-msg'); if (m) m.textContent = t; }
const _renderAuth501 = renderAuth;
renderAuth = function () { _renderAuth501(); hideBoot(); };
const _boot501 = boot;
boot = async function (...a) { bootMsg('กำลังโหลดข้อมูลร้าน…'); try { return await _boot501(...a); } finally { setTimeout(hideBoot, 150); } };
setTimeout(hideBoot, 9000);

/* ---------- sell screen: one tidy control row ---------- */
const _posView501 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView501(pg);
  const left = $('.pos .left', pg), cats = $('#cats', pg); if (!left || !cats) return;
  // category row + compact controls on the right
  if (!$('.catrow', left)) {
    const row = document.createElement('div'); row.className = 'catrow';
    cats.before(row); row.appendChild(cats);
    row.insertAdjacentHTML('beforeend', `<div class="pv-ctl"><button type="button" class="pv-btn" id="pvBtn" title="มุมมอง: เรียง · ขนาดรูป · รูปแบบ">⚙️<span>มุมมอง</span></button></div>`);
    $('#pvBtn', row).onclick = e => { e.stopPropagation(); viewPop(); };
  }
  // the old toolbar keeps only the search box (phones) — sort / size / layout move into the view popover
  const tb = $('.toolbar', left);
  if (tb) {
    tb.classList.add('tb-slim');
    const keep = document.createElement('div'); keep.id = 'pvStore'; keep.hidden = true; left.appendChild(keep);
    ['#psort', '#viewBtn', '#zctl', '#zpre'].forEach(s => { const el = $(s, left); if (el) keep.appendChild(el); });
  }
  // dock: only actions that are not already on screen
  const cb = $('#cashbar', left);
  if (cb) { ['best', 'recent', 'promo', 'cust'].forEach(k => $(`[data-c="${k}"]`, cb)?.remove());
    const ord = ['scan', 'quick', 'held', 'pu', 'ds', 'print']; ord.forEach(k => { const b = $(`[data-c="${k}"]`, cb); if (b) cb.appendChild(b); }); }
  // top-right actions → one ⋯ menu (shift status stays visible)
  const ta = $('#tact');
  if (ta && !$('#moreAct', ta)) {
    ['#lastBtn', '#dispBtn', '#fsBtn', '#dsBtn'].forEach(s => $(s, ta)?.classList.add('in-menu'));
    ta.insertAdjacentHTML('beforeend', '<button class="btn sm" id="moreAct" title="เมนูเพิ่มเติม">⋯</button>');
    $('#moreAct', ta).onclick = e => { e.stopPropagation(); actMenu(e.currentTarget); };
  }
};
function popAt(anchor, html, cls = '') {
  $('.pop5')?.remove();
  const r = anchor.getBoundingClientRect();
  document.body.insertAdjacentHTML('beforeend', `<div class="pop5 ${cls}">${html}</div>`);
  const p = $('.pop5'), w = p.offsetWidth;
  p.style.top = Math.min(r.bottom + 8, innerHeight - p.offsetHeight - 8) + 'px';
  p.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
  setTimeout(() => document.addEventListener('pointerdown', function off(ev) { if (!p.contains(ev.target)) { p.remove(); document.removeEventListener('pointerdown', off, true); } }, true), 0);
  return p;
}
function viewPop() {
  const store = $('#pvStore'); if (!store) return;
  const p = popAt($('#pvBtn'), `<div class="pv-h">มุมมองรายการสินค้า</div>
    <label class="pv-l">เรียงลำดับ</label><div class="pv-slot" data-s="psort"></div>
    <label class="pv-l">ขนาดรูปสินค้า</label><div class="pv-slot" data-s="zctl"></div><div class="pv-slot" data-s="zpre"></div>
    <button type="button" class="btn pv-more">🎨 ปรับหน้าจอเพิ่มเติม (รูปแบบ สี เสียง)</button>`, 'pv-pop');
  ['psort', 'zctl', 'zpre'].forEach(id => { const el = $('#' + id, store); if (el) $(`[data-s="${id}"]`, p).appendChild(el); });
  const back = () => ['psort', 'zctl', 'zpre'].forEach(id => { const el = $('#' + id, p); if (el) store.appendChild(el); });
  new MutationObserver((_, o) => { if (!document.body.contains(p)) { back(); o.disconnect(); } }).observe(document.body, { childList: true });
  $('.pv-more', p).onclick = () => { back(); p.remove(); viewSettings(); };
}
function actMenu(anchor) {
  const items = [['lastBtn', '🧾', 'พิมพ์บิลล่าสุด'], ['dsBtn', '📊', 'สรุปยอดวันนี้'], ['dispBtn', '🖥️', 'เปิดจอลูกค้า'], ['fsBtn', '⛶', 'เต็มจอ / ออกจากเต็มจอ']].filter(([id]) => $('#' + id));
  const p = popAt(anchor, `${items.map(([id, ic, t]) => `<button type="button" data-mi="${id}"><span>${ic}</span>${t}</button>`).join('')}
    <button type="button" data-mx="snd"><span>🔊</span>ตั้งค่าเสียง</button><button type="button" data-mx="view"><span>🎨</span>ปรับหน้าจอขาย</button><button type="button" data-mx="cmd"><span>⌘</span>ค้นหาคำสั่ง (Ctrl+K)</button>`, 'act-pop');
  $$('[data-mi]', p).forEach(b => b.onclick = () => { p.remove(); $('#' + b.dataset.mi)?.click(); });
  $$('[data-mx]', p).forEach(b => b.onclick = () => { p.remove(); ({ snd: soundSettings, view: viewSettings, cmd: commandPalette })[b.dataset.mx](); });
}

/* ---------- auto icon-rail sidebar on tablets ---------- */
const railMQ = matchMedia('(min-width:861px) and (max-width:1366px)');
const applyRail = () => { const a = $('#app'); if (!a) return; if (railMQ.matches) a.classList.toggle('mini', localStorage.getItem('pos_side') !== 'full'); else a.classList.toggle('mini', localStorage.getItem('pos_side') === 'mini'); };
railMQ.addEventListener?.('change', applyRail); applyRail();
const _renderShell501 = renderShell;
renderShell = function () {
  _renderShell501(); applyRail(); hideBoot();
  const mb = $('#miniBtn'); if (mb) mb.onclick = () => {
    if (railMQ.matches) { localStorage.setItem('pos_side', $('#app').classList.contains('mini') ? 'full' : ''); applyRail(); return; }
    $('#app').classList.toggle('mini'); localStorage.setItem('pos_side', $('#app').classList.contains('mini') ? 'mini' : '');
  };
  if (isNativeApp()) { try { window.Capacitor.Plugins.StatusBar?.setBackgroundColor({ color: '#eef4ff' }); window.Capacitor.Plugins.StatusBar?.setStyle({ style: 'LIGHT' }); } catch {} }
};

/* cart header: proper pause icon for "hold" */
const _drawCart501 = drawCart;
drawCart = function () { _drawCart501(); const hb = $('#cart #holdBtn'); if (hb) hb.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>'; };
