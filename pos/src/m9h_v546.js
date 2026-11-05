/* v5.4.6 — speed: product pictures load only when they come near the screen */
(() => {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const el = e.target; io.unobserve(el);
    if (el.dataset.lbg) { el.style.backgroundImage = el.dataset.lbg; delete el.dataset.lbg; }
  }), { rootMargin: '600px 0px' });
  const IMG = /url\(["']?https:\/\/[^)]*\/storage\/v1\/object\/public\/product-images\//;
  const defer = el => {
    if (el.nodeType !== 1 || el.dataset.lbg || el.closest('.lb,.spp,#scanPop,.so-row')) return;
    const bg = el.style && el.style.backgroundImage;
    if (bg && IMG.test(bg)) { el.dataset.lbg = bg; el.style.backgroundImage = 'none'; io.observe(el); }
    if (el.tagName === 'IMG' && /product-images/.test(el.getAttribute('src') || '') && !el.hasAttribute('loading')) el.setAttribute('loading', 'lazy');
  };
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; defer(n); n.querySelectorAll?.('[style*="background-image"],img').forEach(defer); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
