/* v5.4.9 — Back button in the top bar + hardware/gesture back steps through pages.
   Layers over go(): forward moves push a history entry, so the device back
   button (and the on-screen ‹) return to the previous screen instead of leaving. */
(function () {
  if (typeof go !== 'function') return;
  const _go = go;
  let started = false;
  const resolveId = page => (PAGES.find(x => x.id === page && pageOK(x)) || PAGES.find(pageOK) || PAGES[1]).id;
  const depthNow = () => (history.state && history.state.depth) || 0;

  go = function (page, fromPop) {
    const target = resolveId(page);
    if (!fromPop) {
      if (!started) { history.replaceState({ page: target, depth: 0 }, '', '#' + target); started = true; }
      else if (target !== S.page) { history.pushState({ page: target, depth: depthNow() + 1 }, '', '#' + target); }
    }
    _go(target);
    renderBack();
  };

  function renderBack() {
    const top = document.querySelector('.top'); if (!top) return;
    let b = document.getElementById('navBack');
    if (depthNow() > 0) {
      if (!b) {
        b = document.createElement('button');
        b.id = 'navBack'; b.className = 'iconbtn navback'; b.type = 'button';
        b.title = 'ย้อนกลับ'; b.setAttribute('aria-label', 'ย้อนกลับ');
        b.innerHTML = '<span>‹</span>';
        top.insertBefore(b, top.firstChild);
        b.onclick = () => history.back();
      }
    } else if (b) { b.remove(); }
  }

  window.addEventListener('popstate', () => {
    if (!S.shop || !document.getElementById('pg')) return;
    go((history.state && history.state.page) || location.hash.slice(1) || 'pos', true);
  });
})();
