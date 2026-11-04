/* ================= v5.2.0 — organised sales history: numbered bills, item names, oldest/newest order, day groups ================= */
let SALES_ORDER = localStorage.getItem('pos_sales_order') || 'old';
const _sales520 = VIEWS.sales;
VIEWS.sales = pg => {
  _sales520(pg);
  const bar = $('#bs', pg)?.closest('.row');
  bar?.insertAdjacentHTML('beforeend', `<div class="seg" id="sord"><button data-o="old" class="${SALES_ORDER === 'old' ? 'on' : ''}">⬆ เก่า→ใหม่</button><button data-o="new" class="${SALES_ORDER === 'new' ? 'on' : ''}">⬇ ใหม่→เก่า</button></div>`);
  $$('#sord [data-o]', pg).forEach(b => b.onclick = () => { SALES_ORDER = b.dataset.o; localStorage.setItem('pos_sales_order', SALES_ORDER); $$('#sord [data-o]', pg).forEach(x => x.classList.toggle('on', x === b)); deco(true); });
  const itemsCache = {};
  let busy = false;
  const deco = async force => {
    const tb = $('#bl table.tbl', pg); if (!tb || busy || (tb.dataset.org && !force)) return;
    busy = true;
    try {
      const rows = $$('tr[data-id]', tb), ids = rows.map(r => r.dataset.id).filter(id => !itemsCache[id]);
      for (let i = 0; i < ids.length; i += 150) {
        const it = await q(sb.from('sale_items').select('sale_id,name,qty').in('sale_id', ids.slice(i, i + 150)));
        ids.slice(i, i + 150).forEach(id => itemsCache[id] = []); it.forEach(x => itemsCache[x.sale_id].push(x));
      }
      // order by bill number and number them per day (void bills are not counted)
      const byNo = rows.slice().sort((a, b) => $('td b', a).textContent.localeCompare($('td b', b).textContent));
      const dayOf = r => $('td b', r).textContent.slice(0, 6);
      const seq = {}; byNo.forEach(r => { const d = dayOf(r), v = r.textContent.includes('ยกเลิก'); r.dataset.n = v ? '' : (seq[d] = (seq[d] || 0) + 1); });
      const ordered = SALES_ORDER === 'old' ? byNo : byNo.slice().reverse();
      const head = $('tr:has(th)', tb); if (head && !$('th.sn', head)) { head.insertAdjacentHTML('afterbegin', '<th class="sn">#</th>'); $$('th', head)[1].insertAdjacentHTML('afterend', '<th>สินค้า</th>'); }
      $$('tr.daysep', tb).forEach(x => x.remove());
      let lastDay = null;
      ordered.forEach(r => {
        const d = dayOf(r);
        if (d !== lastDay) { lastDay = d; const n = byNo.filter(x => dayOf(x) === d && x.dataset.n).length;
          tb.tBodies[0].appendChild(Object.assign(document.createElement('tr'), { className: 'daysep', innerHTML: `<td colspan="9">📅 ${d.slice(4, 6)}/${d.slice(2, 4)}/${2000 + +d.slice(0, 2) + 543} · <b>${n} บิล</b></td>` })); }
        if (!$('td.sn', r)) { const c = [...r.children]; ['sbill', 'sdate', 'scust', 'spay', 'scash', 'stot', 'sst'].forEach((k, i) => c[i]?.classList.add(k));
          r.insertAdjacentHTML('afterbegin', '<td class="sn"></td>'); r.children[1].insertAdjacentHTML('afterend', '<td class="sitems"></td>'); }
        $('td.sn', r).innerHTML = r.dataset.n ? `<span class="sno">${r.dataset.n}</span>` : '<span class="sno void">—</span>';
        const its = itemsCache[r.dataset.id] || [];
        $('td.sitems', r).innerHTML = its.length ? its.slice(0, 3).map(x => `${esc(x.name)}${num(x.qty) !== 1 ? ` <b>×${qtyf(x.qty)}</b>` : ''}`).join(', ') + (its.length > 3 ? ` <small class="muted">+${its.length - 3}</small>` : '') : '';
        const bno = $('td b', r); if (bno && !bno.dataset.f) { bno.dataset.f = 1; const t = bno.textContent; bno.innerHTML = `บิล ${t.slice(-4)}<small class="muted bfull">${t}</small>`; }
        tb.tBodies[0].appendChild(r);
      });
      tb.dataset.org = 1;
    } catch (e) { console.warn(e); }
    busy = false;
  };
  new MutationObserver(() => deco()).observe(pg, { childList: true, subtree: true });
};
