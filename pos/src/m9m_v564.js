/* v5.6.4 — UI test fixes: close floating popovers when the page changes, and
   tell the user (instead of doing nothing) when a helper library can't load. */
(function () {
  const _go = go;
  go = function (page) { document.querySelectorAll('.pop5,.livedrop').forEach(p => p.classList.contains('pop5') ? p.remove() : (p.hidden = true)); const r = _go.apply(this, arguments);
    try { if (document.querySelector('.tabbar .tb[data-p].on')) document.getElementById('moreBtn')?.classList.remove('on');
      [['#prof', 'บัญชีผู้ใช้'], ['#bell', 'การแจ้งเตือน'], ['#shopBtn', 'เลือกร้าน'], ['#quickFab', 'ทางลัด']].forEach(([s, l]) => { const b = document.querySelector(s); if (b && !b.getAttribute('aria-label')) b.setAttribute('aria-label', l); }); } catch (e) {}
    return r; };
  /* stock list (table) mode: label the stacked numbers on small screens, and keep a one-tap way back to the picture view */
  let tick = 0;
  const tidy = () => { tick = 0;
    document.querySelectorAll('#sbody table.tbl').forEach(tb => { if (tb._lbl) return; tb._lbl = 1; const heads = [...tb.querySelectorAll('tr:first-child th')].map(h => h.textContent.trim());
      tb.querySelectorAll('tr').forEach(tr => [...tr.children].forEach((td, i) => { if (td.tagName === 'TD' && i > 0 && heads[i] && !td.querySelector('button')) td.dataset.l = heads[i]; })); });
    const tabs = document.querySelector('#stk .tabs'), sw = document.querySelector('#svm [data-m="cards"]');
    if (tabs && sw && !sw.classList.contains('on') && !tabs.querySelector('.tocards')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tocards'; b.textContent = '🖼️ รูปใหญ่'; b.onclick = () => { sw.click(); (document.querySelector('#pg') || document.body).scrollTo({ top: 0 }); }; tabs.prepend(b); } };
  new MutationObserver(() => { if (!tick) tick = setTimeout(tidy, 120); }).observe(document.body, { childList: true, subtree: true });
  let last = 0;
  addEventListener('unhandledrejection', e => {
    if (!e.reason || e.reason.message !== 'LIB_LOAD') return;
    e.preventDefault(); if (Date.now() - last < 4000) return; last = Date.now();
    toast(LANG === 'th' ? 'โหลดไม่สำเร็จ — ตรวจสอบอินเทอร์เน็ตแล้วกดอีกครั้ง' : 'Could not load — check the internet and tap again', 'bad');
  });
})();
