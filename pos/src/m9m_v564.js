/* v5.6.4 — UI test fixes: close floating popovers when the page changes, and
   tell the user (instead of doing nothing) when a helper library can't load. */
(function () {
  const _go = go;
  const PS = ['products', 'stock'];
  go = function (page) { document.querySelectorAll('.pop5,.livedrop').forEach(p => p.classList.contains('pop5') ? p.remove() : (p.hidden = true));
    /* redrawing the page you are already on (after a save, or the background data refresh) must not throw you back to the top or clear your search */
    const sc0 = document.querySelector('#pg'), same = sc0 && (S.page === page || (PS.includes(S.page) && PS.includes(page))) && sc0.children.length;
    const keep = same ? { y: sc0.scrollTop, q: document.querySelector('#ps')?.value || '' } : null; if (keep && keep.q) document.querySelector('#ps').value = '';
    const r = _go.apply(this, arguments);
    if (keep && (keep.y > 0 || keep.q)) { try {
      const old = document.querySelector('#ps');
      const set = () => { const p = document.querySelector('#pg'); if (!p || S.page !== page) return;
        const i = document.querySelector('#ps'); if (i && keep.q && !i.value && i !== old) { i.value = keep.q; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelectorAll('.livedrop').forEach(d => d.hidden = true); }
        p.scrollTop = keep.y; };
      set(); requestAnimationFrame(set); setTimeout(set, 180);
    } catch (e) {} }
    try { if (document.querySelector('.tabbar .tb[data-p].on')) document.getElementById('moreBtn')?.classList.remove('on');
      [['#prof', 'บัญชีผู้ใช้'], ['#bell', 'การแจ้งเตือน'], ['#shopBtn', 'เลือกร้าน'], ['#quickFab', 'ทางลัด']].forEach(([s, l]) => { const b = document.querySelector(s); if (b && !b.getAttribute('aria-label')) b.setAttribute('aria-label', l); }); } catch (e) {}
    return r; };
  /* stock list (table) mode: label the stacked numbers on small screens, and keep a one-tap way back to the picture view */
  let tick = 0;
  const tidy = () => { tick = 0;
    document.querySelectorAll('#sbody table.tbl').forEach(tb => { if (tb._lbl) return; tb._lbl = 1; const heads = [...tb.querySelectorAll('tr:first-child th')].map(h => h.textContent.trim());
      tb.querySelectorAll('tr').forEach(tr => [...tr.children].forEach((td, i) => { if (td.tagName === 'TD' && i > 0 && heads[i] && !td.querySelector('button')) td.dataset.l = heads[i]; })); });
    /* a category row that was just redrawn starts at the far left — bring the selected category back into view */
    document.querySelectorAll('.cs-cats,.bcs').forEach(row => { if (row.scrollLeft > 0) return; const on = row.querySelector('.on'); if (!on) return;
      const rr = row.getBoundingClientRect(), r = on.getBoundingClientRect(); if (rr.width && r.right > rr.right - 4) row.scrollLeft += r.left - rr.left - (rr.width - r.width) / 2; });
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
