/* v5.2.6 — sold-out guard: products with no stock cannot go into the cart (tap, scan, +, edit, checkout) */
const stockBlock = () => S.shop && S.shop.allow_negative_stock === false;
const cartUse = (pid, skip) => S.cart.filter(l => l.product_id === pid && l !== skip).reduce((a, l) => a + num(l.qty) * (num(l.factor) || 1), 0);

function soldOutPopup(list) {
  sfx('error'); navigator.vibrate?.([60, 40, 60]);
  $$('.mbg.sold').forEach(m => m.remove());
  const rows = list.map(({ p, left }) => {
    const bg = p.tile_color || catColor(p.category_id);
    const pic = isImg(p) ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(bg)}`;
    return `<div class="so-row"><div class="so-img" style="${pic}"></div><div class="so-tx"><b>${esc(p.name)}</b>
      <span class="${left > 0 ? 'warn' : 'bad'}">${left > 0 ? `${LANG === 'th' ? 'เหลือแค่' : 'Only'} ${qtyf(left)} ${esc(p.unit || '')}` : (cartUse(p.id) > 0 ? (LANG === 'th' ? `มีในตะกร้าครบแล้ว (${qtyf(cartUse(p.id))}) — สินค้าหมด` : `All ${qtyf(cartUse(p.id))} already in cart`) : (LANG === 'th' ? 'สินค้าหมดแล้ว' : 'Sold out'))}</span></div></div>`;
  }).join('');
  const m = modal(LANG === 'th' ? '⛔ สินค้าหมด / สต็อกไม่พอ' : '⛔ Out of stock', `
    <div class="so-box">${rows}<p class="muted" style="margin:10px 0 0">${LANG === 'th' ? 'ไม่สามารถเพิ่มลงตะกร้าได้ — กรุณาเลือกสินค้าอื่น หรือรับสินค้าเข้าก่อน' : 'Cannot add to the cart — choose another product or receive stock first'}</p></div>`,
    { foot: `<button class="btn p lg" id="soOk" style="min-width:140px">${LANG === 'th' ? 'ตกลง' : 'OK'}</button>` });
  m.classList.add('sold');
  const ok = $('#soOk', m); ok.onclick = () => $('.x', m).click(); setTimeout(() => ok.focus(), 50);
  try { say(LANG === 'th' ? (list.length === 1 ? list[0].p.name + ' หมดแล้ว' : 'สินค้าหมด') : 'Out of stock'); } catch {}
}

/* 1) adding to cart (tap, scan, quick menu, unit picker, + button) */
const _addToCart526 = addToCart;
addToCart = function (p, qty = 1, u = null) {
  if (p && stockBlock() && p.track_stock && !(u == null && Array.isArray(p.units) && p.units.length)) {
    const want = cartUse(p.id) + num(qty) * (num(u?.factor) || 1);
    if (want > num(p.stock) + 1e-9) { soldOutPopup([{ p, left: Math.max(0, num(p.stock) - cartUse(p.id)) }]); return; }
  }
  return _addToCart526(p, qty, u);
};

/* no flying animation for sold-out tiles */
const _fly526 = flyToCart;
flyToCart = function (card) {
  const p = card && S.products.find(x => x.id === card.dataset.id);
  if (p && stockBlock() && p.track_stock && num(p.stock) - cartUse(p.id) <= 0) return;
  return _fly526(card);
};

/* sold-out tile badge */
const _pcard526 = productCard;
productCard = function (p) {
  const h = _pcard526(p);
  return stockBlock() && p.track_stock && num(p.stock) <= 0 ? h.replace('class="pcard', 'class="pcard soldout').replace(/(<div class="pcard[^>]*>)/, `$1<i class="so-tag">${LANG === 'th' ? 'สินค้าหมด' : 'SOLD OUT'}</i>`) : h;
};

/* 2) checkout: re-check with the latest stock from the server (another device may have sold it) */
async function cartStockProblems() {
  const ids = [...new Set(S.cart.map(l => l.product_id).filter(id => id && !String(id).startsWith('c_')))];
  if (!ids.length) return [];
  if (navigator.onLine) try {
    const fresh = await q(sb.from('products').select('id,stock').in('id', ids));
    fresh.forEach(f => { const p = S.products.find(x => x.id === f.id); if (p) p.stock = num(f.stock); });
  } catch {}
  return ids.map(id => S.products.find(x => x.id === id)).filter(p => p && p.track_stock && cartUse(p.id) > num(p.stock) + 1e-9)
    .map(p => ({ p, left: Math.max(0, num(p.stock)) }));
}
const _payDialog526 = payDialog;
payDialog = async function (...a) {
  if (stockBlock() && S.cart.length) {
    const bad = await cartStockProblems();
    if (bad.length) {
      // trim the cart to what is really left, drop sold-out lines
      bad.forEach(({ p, left }) => {
        let rest = left;
        S.cart.filter(l => l.product_id === p.id).forEach(l => { const f = num(l.factor) || 1; const can = Math.floor((rest / f) * 1000) / 1000; l.qty = Math.min(num(l.qty), Math.max(0, can)); rest -= l.qty * f; });
        S.cart = S.cart.filter(l => num(l.qty) > 0);
      });
      drawCart(); try { refreshBadges(); drawGrid(); } catch {}
      soldOutPopup(bad);
      return;
    }
  }
  return _payDialog526(...a);
};
