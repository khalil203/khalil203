/* ================= v5.2.5 — every device sees every bill, live sync between devices ================= */
let SYNC_LAST = null;
async function syncTick() {
  if (!S.shop || document.hidden || !navigator.onLine) return;
  try {
    const r = await q(sb.from('sales').select('id,created_at,payment_method,status').eq('shop_id', S.shop.id).order('created_at', { ascending: false }).limit(1));
    const sig = r[0] ? r[0].id + r[0].payment_method + r[0].status : '';
    // also catch edits (payment changes / voids) on today's bills
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const c = await q(sb.from('sales').select('payment_method,status').eq('shop_id', S.shop.id).gte('created_at', t0.toISOString()));
    const full = sig + '|' + c.length + '|' + c.filter(x => x.status === 'void').length + '|' + c.filter(x => x.payment_method === 'cash').length;
    if (SYNC_LAST !== null && full !== SYNC_LAST) {
      // fresh stock numbers
      try { const ps = await q(sb.from('products').select('id,stock').eq('shop_id', S.shop.id)); const m = new Map(ps.map(p => [p.id, p.stock])); S.products.forEach(p => { if (m.has(p.id)) p.stock = m.get(p.id); }); } catch {}
      const busy = $('.mbg') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
      if (S.page === 'pos') { try { await loadPosStats(); } catch {} if (!busy && !S.cart.length) try { drawGrid(); } catch {} }
      else if (!busy && ['sales', 'dashboard', 'stock', 'products'].includes(S.page)) go(S.page);
    }
    SYNC_LAST = full;
  } catch {}
}
setInterval(syncTick, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncTick(); });
const _renderShell525 = renderShell;
renderShell = function () { _renderShell525(); SYNC_LAST = null; setTimeout(syncTick, 3000); };
