/* ================= v5.1.5 — every staff member can change product pictures from the cashier ================= */
AUDIT_L.product_picture = '🖼️ เปลี่ยนรูปสินค้า';
const setImg515 = async (p, url) => { await q(sb.rpc('set_product_image', { p_shop: S.shop.id, p_product: p.id, p_url: url || '' })); p.image_url = url || ''; };
savePng = async function (p, png) {
  const path = `${S.shop.id}/${p.id}-${Date.now()}.png`;
  const { error } = await sb.storage.from('product-images').upload(path, png, { contentType: 'image/png' });
  if (error) throw error;
  const url = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  await setImg515(p, url); return url;
};
uploadProductImage = async function (p, file) {
  toast('กำลังอัปโหลดรูป…');
  try { await savePng(p, await toPng(file)); toast(t('Saved'), 'ok'); drawGrid(); } catch (e) { fail(e); }
};
const _pictureMenu515 = pictureMenu;
pictureMenu = function (p, after) {
  _pictureMenu515(p, after);
  const m = $$('.mbg').pop(), del = m && $('#pmDel', m);
  if (del) del.onclick = async () => { try { await setImg515(p, ''); m.close(); after?.(); drawGrid(); toast('ลบรูปแล้ว', 'ok'); } catch (e) { fail(e); } };
};
const _quickMenu515 = quickMenu;
quickMenu = function (id) {
  _quickMenu515(id);
  const p = S.products.find(x => x.id === id), m = $$('.mbg').pop(); if (!p || !m || $('#qmPic', m)) return;
  $('.qm-grid', m)?.insertAdjacentHTML('beforeend', '<button class="btn" id="qmPic">🖼️ เปลี่ยนรูป / ค้นหาจากเว็บ</button><button class="btn" id="qmCam">📸 ถ่ายรูปสินค้า</button>');
  $('#qmPic', m).onclick = () => { m.close(); pictureMenu(p, () => drawGrid()); };
  $('#qmCam', m).onclick = async () => { const f = await pickImage(true); if (!f) return; m.close(); uploadProductImage(p, f); };
};
