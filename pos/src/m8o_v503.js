/* ================= v5.0.3 — product stock card shows the product's own barcode ================= */
const _stockQuick503 = stockQuick;
stockQuick = async function (p, after) {
  const run = _stockQuick503(p, after);
  const m = $$('.mbg').pop(); const head = m && $('.sq-head', m);
  if (head) {
    const ed = canDo('edit_products');
    head.insertAdjacentHTML('afterend', p.barcode
      ? `<div class="sq-bc"><div class="bcimg" id="sqbc">กำลังสร้างบาร์โค้ด…</div><div class="bcacts"><button type="button" class="btn sm" data-bc="copy">📋 คัดลอกรหัส</button><button type="button" class="btn sm" data-bc="label">🏷️ พิมพ์ฉลาก</button>${ed ? '<button type="button" class="btn sm" data-bc="change">✏️ เปลี่ยนบาร์โค้ด</button>' : ''}</div></div>`
      : `<div class="sq-bc none"><b>สินค้านี้ยังไม่มีบาร์โค้ด</b>${ed ? '<div class="bcacts"><button type="button" class="btn sm p" data-bc="gen">✨ สร้างบาร์โค้ดของร้านให้อัตโนมัติ</button><button type="button" class="btn sm" data-bc="scan">📷 สแกนบาร์โค้ดจากสินค้า</button></div>' : ''}</div>`);
    if (p.barcode) barcodeSVG(p.barcode, { h: 70, w: 2.2, text: true }).then(svg => { const el = $('#sqbc', m); if (el) el.innerHTML = svg; }).catch(() => { const el = $('#sqbc', m); if (el) el.innerHTML = `<code style="font-size:22px">${esc(p.barcode)}</code>`; });
    const save = async code => {
      if (S.products.some(x => x.id !== p.id && x.barcode === code)) return toast('บาร์โค้ดนี้ใช้กับสินค้าอื่นแล้ว', 'bad');
      try { Object.assign(p, await q(sb.from('products').update({ barcode: code }).eq('id', p.id).select().single())); toast('บันทึกบาร์โค้ดแล้ว', 'ok'); m.close(); after?.(); stockQuick(p, after); } catch (e) { fail(e); }
    };
    $$('[data-bc]', m).forEach(b => b.onclick = async () => {
      const k = b.dataset.bc;
      if (k === 'copy') { try { await navigator.clipboard.writeText(p.barcode); toast('คัดลอกแล้ว: ' + p.barcode, 'ok'); } catch { toast(p.barcode); } }
      if (k === 'label') { m.close(); printLabels([p]); }
      if (k === 'gen') save(nextBarcodes(1)[0]);
      if (k === 'scan') scanBarcode(code => save(String(code).trim()));
      if (k === 'change') { const v = prompt('บาร์โค้ดใหม่ (เว้นว่างเพื่อยกเลิก)', p.barcode || ''); if (v && v.trim() && v.trim() !== p.barcode) save(v.trim()); }
    });
  }
  return run;
};
/* light theme is the default look (dark only when chosen with the theme button) */
if (localStorage.getItem('pos_theme_v5') !== '1') { localStorage.setItem('pos_theme_v5', '1'); setTheme('light'); }
