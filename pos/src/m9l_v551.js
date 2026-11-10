/* v5.5.7 — live product lookup in the search bar (product + stock views):
   a camera-scan icon that drops the code in as a live search term, plus an
   instant dropdown of matching products (photo, name, price, stock). */
(function () {
  function liveSearch(pg, sel, onPick) {
    const input = $(sel, pg); if (!input) return;
    const box = input.closest('.sbox') || input.parentElement; if (!box || box._live) return;
    box._live = 1; box.classList.add('livebox');
    const scan = document.createElement('button');
    scan.type = 'button'; scan.className = 'livescan'; scan.title = 'สแกนบาร์โค้ด'; scan.innerHTML = '📷';
    box.appendChild(scan);
    scan.onclick = () => scanBarcode(code => { input.value = code; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); });
    const dd = document.createElement('div'); dd.className = 'livedrop'; dd.hidden = true; box.appendChild(dd);
    const render = () => {
      const v = input.value.trim().toLowerCase();
      if (!v) { dd.hidden = true; dd.innerHTML = ''; return; }
      const list = S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase().includes(v))).slice(0, 8);
      if (!list.length) { dd.innerHTML = `<div class="livempty">ไม่พบสินค้า · กด 📷 เพื่อสแกน</div>`; dd.hidden = false; return; }
      dd.innerHTML = list.map(p => {
        const img = p.image_url ? `style="background-image:url('${esc(p.image_url)}')"` : `style="background:${esc(p.tile_color || catColor(p.category_id))}"`;
        const st = p.track_stock ? `${qtyf(p.stock)} ${esc(p.unit)}` : 'ไม่ตัดสต็อก';
        const sc = !p.track_stock ? '' : p.stock <= 0 ? 'bad' : p.stock <= p.low_stock ? 'warn' : 'ok';
        return `<button type="button" class="liverow" data-id="${p.id}"><i class="liveimg" ${img}>${p.image_url ? '' : esc([...p.name][0] || '?')}</i>
          <span class="livename"><b>${esc(p.name)}</b><small>${p.barcode ? esc(p.barcode) + ' · ' : ''}${esc(catName(p.category_id))}</small></span>
          <span class="liveend"><b>฿${money(p.price)}</b><small class="lv ${sc}">${st}</small></span></button>`;
      }).join('');
      dd.hidden = false;
      $$('.liverow', dd).forEach(b => b.onmousedown = e => { e.preventDefault(); const p = S.products.find(x => x.id === b.dataset.id); dd.hidden = true; if (p) onPick(p); });
    };
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', () => setTimeout(() => { dd.hidden = true; }, 160));
  }
  const _p = VIEWS.products; VIEWS.products = pg => { const r = _p(pg); try { liveSearch(pg, '#ps', p => productForm(p, () => go('products'))); } catch (e) {} return r; };
  const _s = VIEWS.stock; VIEWS.stock = pg => { const r = _s(pg); try { liveSearch(pg, '#sfq', p => stockQuick(p, () => go('stock'))); } catch (e) {} return r; };
})();
