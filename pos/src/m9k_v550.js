/* v5.5.1 — shared "organized well" grid: category slide bar, grouping by
   category, and an adjustable images-per-row count. Used by the Products
   page and the Stock page so both look and behave the same. */
function catSlideBar(activeId, list, opt) {
  const cnt = id => list.filter(p => id === '_none' ? !psCid(p) : p.category_id === id).length;
  /* chips in exactly the order the category sections appear in the list, so the highlight walks left-to-right as you scroll down */
  const ord = catOrder(), cats = S.categories.filter(c => cnt(c.id)).sort((a, b) => ord[a.id] - ord[b.id]), none = opt && opt.none ? cnt('_none') : 0;
  const chip = (id, label, n, color) => `<button class="bcs-chip ${activeId === id ? 'on' : ''}" data-cat="${id}" style="--cc:${color || 'var(--brand)'}"><i></i><span>${esc(label)}</span><b>${n}</b></button>`;
  return `<div class="bcs">${chip('', 'ทั้งหมด', list.length)}${cats.map(c => chip(c.id, (c.icon ? c.icon + ' ' : '') + c.name, cnt(c.id), c.color || catColor(c.id))).join('')}${none ? chip('_none', 'ไม่มีหมวด', none, '#94a3b8') : ''}${opt && opt.manage ? '<button class="bcs-chip bcs-manage" data-catmanage="1" style="--cc:var(--brand)"><span>🗂 จัดการหมวดหมู่</span></button>' : ''}</div>`;
}
function pmColKey(ns) { return 'pos_' + ns + 'cols_' + (innerWidth < 600 ? 'm' : 'd'); }
function pmColDef() { return innerWidth < 600 ? 3 : Math.max(4, Math.min(7, Math.round((innerWidth - 120) / 210))); }
function pmColGet(ns) { const mx = innerWidth < 600 ? 5 : 10; return Math.max(1, Math.min(mx, +localStorage.getItem(pmColKey(ns)) || pmColDef())); }
function pmColStep(ns, d) { const mx = innerWidth < 600 ? 5 : 10; localStorage.setItem(pmColKey(ns), Math.max(1, Math.min(mx, pmColGet(ns) + d))); }
function pmColBar(id) { return `<div class="bcz" id="${id}" title="จำนวนรูปต่อแถว"><button class="btn" type="button" data-z="-1">−</button><b class="colv"></b><button class="btn" type="button" data-z="1">+</button></div>`; }
function pmPxFor(pg, cols) { const w = ($('#pg') || pg)?.clientWidth || innerWidth; return Math.max(110, Math.floor((w - 28 - (cols - 1) * 14) / cols)); }
function _catLine(pg) { const bar = pg.querySelector('.bcs-wrap'); return (bar ? bar.getBoundingClientRect().bottom : pg.getBoundingClientRect().top) + 8; }
function _catOf(el) { return psCid(S.products.find(p => p.id === el.dataset.id)) || '_none'; }
/* Smooth-scroll so the first card of a category sits just under the slide bar. */
function catScrollTo(pg, gridSel, catId) {
  const g = $(gridSel, pg); if (!g) return;
  const scr = document.querySelector('#pg') || pg;
  if (!catId) { scr.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const el = [...g.querySelectorAll('.pm[data-id]')].find(e => _catOf(e) === catId); if (!el) return;
  const ref = g.querySelector(`.grp-h[data-cat="${catId}"]`) || el;
  scr.scrollBy({ top: ref.getBoundingClientRect().top - _catLine(pg) + 2, behavior: 'smooth' });
}
/* Highlight the chip of whatever category is at the top of the view. */
function catSpy(pg, catsSel, gridSel, fixed) {
  const run = () => {
    const g = $(gridSel, pg), box = $(catsSel, pg); if (!g || !box) return;
    const bar = pg.querySelector('.bcs-wrap'); if (bar) pg.style.setProperty('--catbar', Math.round(bar.getBoundingClientRect().height) + 'px');
    const line = _catLine(pg), cards = [...g.querySelectorAll('.pm[data-id]')];
    let cur = fixed || '';
    if (!fixed) {
      /* follow the category banner that is pinned under the bar, so the lit chip always names the same category as the banner */
      const heads = [...g.querySelectorAll('.grp-h[data-cat]')];
      if (heads.length) { for (const h of heads) { if (h.getBoundingClientRect().top <= line + 6) cur = h.dataset.cat; } }
      else if ((document.querySelector('#pg') || pg).scrollTop > 40) for (const el of cards) { const r = el.getBoundingClientRect(); if (r.bottom > line + 4) { cur = _catOf(el); break; } }
    }
    const chips = [...box.querySelectorAll('.bcs-chip')];
    const on = chips.find(c => (c.dataset.cat || '') === cur) || chips.find(c => (c.dataset.cat || '') === '');
    chips.forEach(c => c.classList.toggle('on', c === on));
    if (on && on !== pg._catOn) { pg._catOn = on; const bcs = box.querySelector('.bcs'); if (bcs) bcs.scrollTo({ left: on.offsetLeft - (bcs.clientWidth - on.clientWidth) / 2, behavior: 'smooth' }); }
  };
  /* the list scrolls inside #pg (the view itself is drawn in a sub-container), so listen there */
  const scr = document.querySelector('#pg') || pg;
  if (scr._catSpy) scr.removeEventListener('scroll', scr._catSpy);
  let raf = 0; scr._catSpy = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; run(); }); };
  scr.addEventListener('scroll', scr._catSpy, { passive: true });
  pg._catOn = null; setTimeout(run, 80); setTimeout(run, 300);
}
/* Render list into one grid, or grouped category sections when grouped=true. */
function pmSections(list, cols, px, cardFn, grouped) {
  const grid = items => `<div class="pmgrid" style="grid-template-columns:repeat(${cols},minmax(0,1fr));--pm:${px}px">${items.map(cardFn).join('')}</div>`;
  if (!grouped) return grid(list);
  const groups = new Map();
  list.forEach(p => { const k = p.category_id || '_none'; (groups.get(k) || groups.set(k, []).get(k)).push(p); });
  const order = [...S.categories.map(c => c.id), '_none'].filter(k => groups.has(k));
  return order.map(k => { const c = S.categories.find(x => x.id === k), items = groups.get(k);
    return `<section class="bcg-sec"><h3 class="bcg-h"><i style="background:${esc(c ? (c.color || catColor(c.id)) : '#94a3b8')}"></i>${esc(c ? c.name : 'ไม่มีหมวด')}<small>${items.length}</small></h3>${grid(items)}</section>`;
  }).join('');
}
