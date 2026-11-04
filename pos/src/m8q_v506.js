/* ================= v5.0.6 — fullscreen that works on phones/tablets/app, organised settings, quick access ================= */

/* ---------- full screen ---------- */
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || document.documentElement.classList.contains('pfs');
async function toggleFullscreen() {
  const d = document.documentElement, SB = window.Capacitor?.Plugins?.StatusBar;
  if (fsOn()) {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch {}
    d.classList.remove('pfs'); try { SB?.show(); } catch {}
    return;
  }
  let ok = false;
  try { if (d.requestFullscreen) { await d.requestFullscreen({ navigationUI: 'hide' }); ok = true; } else if (d.webkitRequestFullscreen) { d.webkitRequestFullscreen(); ok = true; } } catch {}
  if (isNativeApp()) { try { await SB?.hide(); } catch {} }
  // iPhone / browsers without the Fullscreen API: hide the app's own bars instead
  if (!ok || !document.fullscreenElement) d.classList.add('pfs');
  toast('โหมดเต็มจอ — กดปุ่ม ✕ มุมขวาบนเพื่อออก', 'ok');
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.documentElement.classList.remove('pfs'); syncFsBtn(); });
function syncFsBtn() {
  let b = $('#fsExit');
  if (fsOn()) { if (!b) { document.body.insertAdjacentHTML('beforeend', '<button type="button" id="fsExit" title="ออกจากเต็มจอ">✕ ออกจากเต็มจอ</button>'); $('#fsExit').onclick = toggleFullscreen; } }
  else b?.remove();
}
new MutationObserver(syncFsBtn).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
document.addEventListener('click', e => { if (e.target.closest('#fsBtn')) { e.preventDefault(); e.stopImmediatePropagation(); toggleFullscreen(); } }, true);
// customer display: on phones/tablets/app open it in this screen (it has its own ✕ button to come back)
document.addEventListener('click', e => {
  if (!e.target.closest('#dispBtn,#dispT')) return;
  if (isNativeApp() || matchMedia('(max-width:1024px)').matches) { e.preventDefault(); e.stopImmediatePropagation(); location.href = 'display.html'; }
}, true);

/* ---------- settings: sections with a menu + search ---------- */
const SET_SECTIONS = [
  ['shop', '🏪', 'ร้าน & แบรนด์', /แบรนด์ร้าน|ข้อมูลร้าน|ภาษีและสาขา|ร้าน \/ สาขา/],
  ['pay', '💳', 'การชำระเงิน', /การชำระเงิน|ช่องทางชำระเงิน|QR รับชำระ/],
  ['receipt', '🧾', 'ใบเสร็จ & อุปกรณ์', /ใบเสร็จ|ฮาร์ดแวร์|ลิ้นชักเงิน/],
  ['product', '📦', 'สินค้า & สต็อก', /สต็อกและสมาชิก|หมวดหมู่ ·|หน่วยนับ/],
  ['screen', '🔊', 'เสียง & หน้าจอ', /เสียงทั้งหมด|ภาษาและรูปแบบ|หน้าจอ/],
  ['account', '👤', 'บัญชี & แอป', /บัญชีผู้ใช้|ดาวน์โหลดแอป|อัปเดต/],
];
const _settings506 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings506(pg);
  const cards = $$('.card', pg).filter(c => !c.parentElement.closest('.card'));
  cards.forEach(c => { const h = $('h3', c)?.textContent || ''; c.dataset.sec = (SET_SECTIONS.find(s => s[3].test(h)) || ['account'])[0]; });
  // quick screen tools card
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="card" data-sec="screen"><h3 style="margin-top:0">🖥️ หน้าจอขาย & ธีม</h3>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="s_view">🎨 ปรับหน้าจอขาย (ขนาดรูป รูปแบบ)</button><button type="button" class="btn" id="s_theme">${document.documentElement.dataset.theme === 'dark' ? '☀️ ธีมสว่าง' : '🌙 ธีมมืด'}</button><button type="button" class="btn" id="s_fs">⛶ เต็มจอ</button><button type="button" class="btn" id="s_disp">🖥️ จอลูกค้า</button></div></div>`);
  $('#s_view').onclick = viewSettings; $('#s_fs').onclick = toggleFullscreen; $('#s_disp').onclick = () => { if (isNativeApp() || matchMedia('(max-width:1024px)').matches) location.href = 'display.html'; else window.open('display.html', 'posdisplay', 'width=900,height=600'); };
  $('#s_theme').onclick = () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); go('settings'); };
  const count = k => $$(`.card[data-sec="${k}"]`, pg).length;
  pg.insertAdjacentHTML('afterbegin', `<div class="set-nav"><div class="set-search"><span>🔍</span><input class="in" id="setq" placeholder="ค้นหาการตั้งค่า เช่น QR, ใบเสร็จ, เสียง, ภาษี…"></div>
    <div class="set-tabs">${SET_SECTIONS.filter(s => count(s[0])).map(s => `<button type="button" data-st="${s[0]}"><span>${s[1]}</span>${s[2]}</button>`).join('')}</div></div>`);
  const saveRow = $('#stf > .row', pg);
  const show = (sec, qv = '') => {
    const v = qv.trim().toLowerCase();
    $$('.card[data-sec]', pg).forEach(c => { c.hidden = v ? !c.textContent.toLowerCase().includes(v) : c.dataset.sec !== sec; });
    // hide empty layout wrappers
    $$('.grid2, #stf .grid2 > div', pg).filter(g => !g.closest('.card') && $$('.card[data-sec]', g).length).forEach(g => { g.hidden = !$$('.card[data-sec]', g).some(c => !c.hidden); });
    const formVisible = $$('#stf .card[data-sec]', pg).some(c => !c.hidden);
    if (saveRow) saveRow.hidden = !formVisible;
    $$('[data-st]', pg).forEach(b => b.classList.toggle('on', !v && b.dataset.st === sec));
    if (!v) localStorage.setItem('pos_setsec', sec);
  };
  let cur = localStorage.getItem('pos_setsec'); if (!SET_SECTIONS.some(s => s[0] === cur && count(cur))) cur = SET_SECTIONS.find(s => count(s[0]))?.[0];
  $$('[data-st]', pg).forEach(b => b.onclick = () => { $('#setq', pg).value = ''; cur = b.dataset.st; show(cur); pg.scrollTo?.({ top: 0, behavior: 'smooth' }); });
  $('#setq', pg).oninput = e => show(cur, e.target.value);
  show(cur);
};

/* ---------- quicker access: settings in the ⋯ menu, profile menu and a gear in the top bar ---------- */
const _actMenu506 = actMenu;
actMenu = function (anchor) {
  _actMenu506(anchor);
  const p = $('.pop5.act-pop'); if (!p || $('[data-mx="set"]', p)) return;
  p.insertAdjacentHTML('afterbegin', '<button type="button" data-mx="set"><span>⚙️</span>ตั้งค่าทั้งหมด</button>');
  $('[data-mx="set"]', p).onclick = () => { p.remove(); go('settings'); };
};
const _profileMenu506 = profileMenu;
profileMenu = function () {
  _profileMenu506();
  const m = $$('.mbg').pop(), g = m && $('.moregrid', m); if (!g) return;
  g.insertAdjacentHTML('afterbegin', '<button data-a2="set"><span>⚙️</span>ตั้งค่า</button><button data-a2="snd"><span>🔊</span>เสียง</button><button data-a2="fs"><span>⛶</span>เต็มจอ</button>');
  $$('[data-a2]', g).forEach(b => b.onclick = () => { m.close(); ({ set: () => go('settings'), snd: soundSettings, fs: toggleFullscreen })[b.dataset.a2](); });
};
const _renderShell506 = renderShell;
renderShell = function () {
  _renderShell506();
  const bell = $('#bell'); if (bell && !$('#setBtn') && pgOK('settings')) {
    bell.insertAdjacentHTML('beforebegin', `<button class="iconbtn bellbtn" id="setBtn" title="ตั้งค่า"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>`);
    $('#setBtn').onclick = () => go('settings');
  }
};
