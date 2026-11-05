/* v5.4.7 — scan auto-fill from our own shared catalog, then public DB.
   Overrides offLookup (defined in m8b): first ask our shared product_catalog
   (barcode -> name/image/unit/brand, contributed automatically by every shop),
   then fall back to Open Food Facts. The catalog NEVER holds price/cost/stock. */
(function () {
  if (typeof offLookup !== 'function') return;
  const _off = offLookup;
  offLookup = async function (code) {
    if (!/^\d{8,14}$/.test(code)) return null;
    // 1) our own shared catalog (fast, Thai names, real product photos)
    try {
      const rows = await q(sb.rpc('catalog_lookup', { p_barcode: code }));
      const c = Array.isArray(rows) ? rows[0] : rows;
      if (c && c.name) return {
        name: c.name || '',
        name_en: c.name_en || '',
        brand: c.brand || '',
        unit: c.unit || '',
        image: c.image_url || '',
        src: 'catalog'
      };
    } catch (e) { /* offline / not a member: just fall through */ }
    // 2) public database fallback
    const r = await _off(code);
    if (r) r.src = 'off';
    return r;
  };
})();
