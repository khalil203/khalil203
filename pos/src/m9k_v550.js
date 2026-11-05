/* v5.5.1 — shared "organized well" grid: category slide bar, grouping by
   category, and an adjustable images-per-row count. Used by the Products
   page and the Stock page so both look and behave the same. */
function catSlideBar(activeId, list) {
  const cnt = id => list.filter(p => p.category_id === id).length;
  const cats = S.categories.filter(c => cnt(c.id));
  const chip = (id, label, n, color) => `<button class="bcs-chip ${activeId === id ? 'on' : ''}" data-cat="${id}" style="--cc:${color || 'var(--brand)'}"><i></i><span>${esc(label)}</span><b>${n}</b></button>`;
  return `<div class="bcs">${chip('', 'ทั้งหมด', list.length)}${cats.map(c => chip(c.id, c.name, cnt(c.id), c.color || catColor(c.id))).join('')}</div>`;
}
function pmColKey(ns) { return 'pos_' + ns + 'cols_' + (innerWidth < 600 ? 'm' : 'd'); }
function pmColDef() { return innerWidth < 600 ? 3 : Math.max(4, Math.min(7, Math.round((innerWidth - 120) / 210))); }
function pmColGet(ns) { const mx = innerWidth < 600 ? 5 : 10; return Math.max(1, Math.min(mx, +localStorage.getItem(pmColKey(ns)) || pmColDef())); }
function pmColStep(ns, d) { const mx = innerWidth < 600 ? 5 : 10; localStorage.setItem(pmColKey(ns), Math.max(1, Math.min(mx, pmColGet(ns) + d))); }
function pmColBar(id) { return `<div class="bcz" id="${id}" title="จำนวนรูปต่อแถว"><button class="btn" type="button" data-z="-1">−</button><b class="colv"></b><button class="btn" type="button" data-z="1">+</button></div>`; }
function pmPxFor(pg, cols) { const w = ($('#pg') || pg)?.clientWidth || innerWidth; return Math.max(110, Math.floor((w - 28 - (cols - 1) * 14) / cols)); }
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
