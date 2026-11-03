/* ================= v4.8 — units manager, category manager, quick "buy X for ฿Y" promotion ================= */

const UNITS_DEF = [...UNITS];
const syncUnits = () => { const u = Array.isArray(S.shop?.units) && S.shop.units.length ? S.shop.units : UNITS_DEF; UNITS.splice(0, UNITS.length, ...u); };
const _renderShell48 = renderShell;
renderShell = function () { _renderShell48(); syncUnits(); };
const unitUse = u => S.products.filter(p => p.unit === u || arr(p.units).some(x => x.unit === u)).length;

/* ---------- units ---------- */
function unitManager(after) {
  syncUnits();
  const edit = canDo('edit_products');
  let rows = UNITS.map(u => ({ name: u, orig: u }));
  const m = modal('📏 หน่วยนับ', `
    <p class="muted" style="margin-top:0;font-size:13px">หน่วยที่ใช้เลือกในหน้าเพิ่ม/แก้ไขสินค้า และหน่วยขายแบบแพ็ก/ลัง — เปลี่ยนชื่อหน่วยแล้วสินค้าที่ใช้หน่วยนั้นจะเปลี่ยนตามอัตโนมัติ</p>
    ${edit ? `<div class="um-add"><input class="in" id="unew" placeholder="เพิ่มหน่วยใหม่ เช่น แพ็ก 6, ลัง, ถาด, หวี, กำ…"><button type="button" class="btn p" id="uadd">＋ เพิ่ม</button></div>
      <div class="pills um-sug" id="usug"></div>` : ''}
    <div class="um-list" id="ulist"></div>`,
    { foot: `${edit ? '<button type="button" class="btn" id="usort">ก-ฮ เรียงตามชื่อ</button><button type="button" class="btn" id="udef">ค่าเริ่มต้น</button>' : ''}<span style="flex:1"></span><button type="button" class="btn" data-c>ปิด</button>${edit ? '<button type="button" class="btn p" id="usave">💾 บันทึก</button>' : ''}` });
  const SUG = ['ชิ้น', 'อัน', 'ขวด', 'กระป๋อง', 'แพ็ก', 'กล่อง', 'ลัง', 'ถุง', 'ซอง', 'ห่อ', 'โหล', 'กิโลกรัม', 'ขีด', 'กรัม', 'ลิตร', 'มิลลิลิตร', 'แก้ว', 'จาน', 'ชาม', 'ถ้วย', 'ชุด', 'คู่', 'ม้วน', 'แผ่น', 'ถาด', 'หวี', 'ลูก', 'ผล', 'ตัว', 'ไม้', 'กำ', 'มัด', 'แท่ง', 'หลอด', 'เม็ด'];
  const draw = () => {
    $('#ulist', m).innerHTML = rows.map((r, i) => { const n = unitUse(r.orig || r.name); return `<div class="um-row" data-i="${i}">
      <span class="um-n">${i + 1}</span><input class="in" data-un value="${esc(r.name)}" ${edit ? '' : 'disabled'}>
      <small class="muted um-c">${n ? `${n} สินค้า` : 'ยังไม่ใช้'}</small>
      ${edit ? `<button type="button" class="btn sm" data-up ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn sm" data-dn ${i < rows.length - 1 ? '' : 'disabled'}>↓</button><button type="button" class="btn sm bad" data-del>✕</button>` : ''}</div>`; }).join('') || '<p class="muted">ยังไม่มีหน่วย</p>';
    if ($('#usug', m)) $('#usug', m).innerHTML = SUG.filter(s => !rows.some(r => r.name === s)).slice(0, 14).map(s => `<button type="button" data-sg="${esc(s)}">＋ ${esc(s)}</button>`).join('');
    $$('.um-row', m).forEach(el => { const i = +el.dataset.i;
      $('[data-un]', el).oninput = e => { rows[i].name = e.target.value; };
      if (!edit) return;
      $('[data-up]', el).onclick = () => { [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; draw(); };
      $('[data-dn]', el).onclick = () => { [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; draw(); };
      $('[data-del]', el).onclick = async () => { const n = unitUse(rows[i].orig || rows[i].name);
        if (n && !(await confirmBox(`หน่วย “${rows[i].name}” ใช้อยู่ ${n} สินค้า — ลบออกจากรายการ? (สินค้าเดิมยังใช้หน่วยนี้ได้)`))) return;
        rows.splice(i, 1); draw(); };
    });
    $$('[data-sg]', m).forEach(b => b.onclick = () => { rows.push({ name: b.dataset.sg }); draw(); });
  };
  const add = () => { const v = $('#unew', m).value.trim(); if (!v) return; if (rows.some(r => r.name === v)) return toast('มีหน่วยนี้แล้ว', 'bad'); rows.push({ name: v }); $('#unew', m).value = ''; draw(); $('#unew', m).focus(); };
  if (edit) {
    $('#uadd', m).onclick = add; $('#unew', m).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    $('#usort', m).onclick = () => { rows.sort((a, b) => a.name.localeCompare(b.name, 'th')); draw(); };
    $('#udef', m).onclick = () => { rows = UNITS_DEF.map(u => ({ name: u, orig: rows.find(r => r.orig === u)?.orig })); draw(); };
    $('#usave', m).onclick = async () => {
      const list = rows.map(r => r.name.trim()).filter(Boolean);
      if (new Set(list).size !== list.length) return toast('มีชื่อหน่วยซ้ำกัน', 'bad');
      try {
        for (const r of rows) {
          const nn = r.name.trim(); if (!r.orig || !nn || r.orig === nn) continue;
          const hit = S.products.filter(p => p.unit === r.orig);
          if (hit.length) { await q(sb.from('products').update({ unit: nn }).eq('shop_id', S.shop.id).eq('unit', r.orig)); hit.forEach(p => p.unit = nn); }
          for (const p of S.products.filter(p => arr(p.units).some(x => x.unit === r.orig))) {
            const units = p.units.map(x => x.unit === r.orig ? { ...x, unit: nn } : x);
            await q(sb.from('products').update({ units }).eq('id', p.id)); p.units = units;
          }
        }
        Object.assign(S.shop, await q(sb.from('shops').update({ units: list }).eq('id', S.shop.id).select().single()));
        syncUnits(); logAct('settings', 'shop', 'หน่วยนับ', { units: list }); toast('บันทึกหน่วยนับแล้ว', 'ok'); m.close(); after?.();
      } catch (e) { fail(e); }
    };
  }
  $('[data-c]', m).onclick = () => { m.close(); };
  draw();
}

/* ---------- categories ---------- */
const CAT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#78716c', '#64748b'];
const CAT_ICONS = ['🥩', '🐷', '🍗', '🐟', '🦐', '🥚', '🥬', '🍎', '🍌', '🍉', '🍚', '🍜', '🍞', '🧀', '🥫', '🧂', '🌶️', '🥤', '🧃', '🍺', '☕', '🧊', '🍬', '🍪', '🍦', '🧴', '🧻', '🧼', '🚬', '💊', '🔋', '🛒', '📦', '⭐'];
categoryManager = function (after) {
  const edit = canDo('edit_products');
  let newIcon = '', newColor = CAT_COLORS[S.categories.length % CAT_COLORS.length];
  const m = modal('🗂️ หมวดหมู่สินค้า', `
    ${edit ? `<div class="cm-add"><button type="button" class="cm-ic" id="cnic" title="เลือกไอคอน">＋</button><input class="in" id="cnn" placeholder="ชื่อหมวดใหม่ เช่น หมูสด, เครื่องดื่ม, ผักผลไม้…"><input type="color" id="cnc" value="${newColor}" title="สี"><button type="button" class="btn p" id="cna">＋ เพิ่ม</button></div>` : ''}
    <div class="cm-list" id="cml"></div>`, { wide: true, foot: `${edit ? '<button type="button" class="btn" id="cmsort">ก-ฮ เรียงตามชื่อ</button>' : ''}<span style="flex:1"></span><button type="button" class="btn p" data-c>เสร็จ</button>` });
  const cnt = id => S.products.filter(p => p.category_id === id).length;
  const save = async (c, o) => { try { Object.assign(c, await q(sb.from('categories').update(o).eq('id', c.id).select().single())); } catch (e) { fail(e); } };
  const iconPick = (anchor, cb) => {
    $('.cm-pop')?.remove();
    const r = anchor.getBoundingClientRect();
    m.insertAdjacentHTML('beforeend', `<div class="cm-pop" style="top:${r.bottom + 4}px;left:${Math.max(8, Math.min(r.left, innerWidth - 290))}px">${CAT_ICONS.map(i => `<button type="button" data-ic="${i}">${i}</button>`).join('')}<button type="button" data-ic="" title="ไม่ใช้ไอคอน">✕</button>
      <input class="in" placeholder="หรือพิมพ์อีโมจิ" maxlength="4"></div>`);
    const pop = $('.cm-pop', m);
    $$('[data-ic]', pop).forEach(b => b.onclick = () => { cb(b.dataset.ic); pop.remove(); });
    $('input', pop).onchange = e => { cb(e.target.value.trim()); pop.remove(); };
    setTimeout(() => document.addEventListener('click', function off(ev) { if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', off, true); } }, true), 0);
  };
  const draw = () => {
    const list = [...S.categories].sort((a, b) => num(a.sort) - num(b.sort) || a.name.localeCompare(b.name, 'th'));
    $('#cml', m).innerHTML = list.map((c, i) => `<div class="cm-row" data-id="${c.id}" style="--cc:${esc(c.color || '#6366f1')}">
      <button type="button" class="cm-ic" data-ic2 ${edit ? '' : 'disabled'}>${esc(c.icon || '') || '<span style="opacity:.4">＋</span>'}</button>
      <input class="in" data-nm value="${esc(c.name)}" ${edit ? '' : 'disabled'}>
      <input type="color" data-cl value="${esc(c.color || '#6366f1')}" ${edit ? '' : 'disabled'}>
      <button type="button" class="btn sm cm-cnt" data-see title="ดูสินค้าในหมวด">${cnt(c.id)} สินค้า</button>
      ${edit ? `<button type="button" class="btn sm" data-up ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn sm" data-dn ${i < list.length - 1 ? '' : 'disabled'}>↓</button><button type="button" class="btn sm bad" data-del>✕</button>` : ''}</div>`).join('')
      || '<div class="brempty">ยังไม่มีหมวดหมู่ — เพิ่มด้านบนได้เลย</div>';
    $$('.cm-row', m).forEach(el => {
      const c = S.categories.find(x => x.id === el.dataset.id), i = list.indexOf(c);
      $('[data-see]', el).onclick = () => { m.close(); go('products'); setTimeout(() => { const s = $('#pc'); if (s) { s.value = c.id; s.dispatchEvent(new Event('change')); s.dispatchEvent(new Event('input')); } }, 400); };
      if (!edit) return;
      $('[data-nm]', el).onchange = e => { const v = e.target.value.trim(); if (!v) return draw(); if (S.categories.some(x => x !== c && x.name === v)) { toast('มีชื่อหมวดนี้แล้ว', 'bad'); return draw(); } save(c, { name: v }); };
      $('[data-cl]', el).onchange = e => { el.style.setProperty('--cc', e.target.value); save(c, { color: e.target.value }); };
      $('[data-ic2]', el).onclick = ev => { ev.stopPropagation(); iconPick(ev.currentTarget, async v => { await save(c, { icon: v || null }); draw(); }); };
      const move = async d => { const o = list[i + d]; if (!o) return; list.splice(i, 1); list.splice(i + d, 0, c);
        await Promise.all(list.map((x, k) => num(x.sort) === k ? null : save(x, { sort: k }))); draw(); };
      $('[data-up]', el).onclick = () => move(-1); $('[data-dn]', el).onclick = () => move(1);
      $('[data-del]', el).onclick = async () => {
        const n = cnt(c.id);
        if (!(await confirmBox(n ? `ลบหมวด “${c.name}”? สินค้า ${n} รายการจะเป็น “ไม่มีหมวด”` : `ลบหมวด “${c.name}”?`))) return;
        try { if (n) await q(sb.from('products').update({ category_id: null }).eq('shop_id', S.shop.id).eq('category_id', c.id));
          await q(sb.from('categories').delete().eq('id', c.id));
          S.products.forEach(p => { if (p.category_id === c.id) p.category_id = null; }); S.categories = S.categories.filter(x => x !== c); draw(); toast('ลบแล้ว', 'ok'); } catch (e) { fail(e); }
      };
    });
  };
  if (edit) {
    $('#cnic', m).onclick = ev => { ev.stopPropagation(); iconPick(ev.currentTarget, v => { newIcon = v; $('#cnic', m).textContent = v || '＋'; }); };
    const add = async () => {
      const name = $('#cnn', m).value.trim(); if (!name) return $('#cnn', m).focus();
      if (S.categories.some(x => x.name === name)) return toast('มีชื่อหมวดนี้แล้ว', 'bad');
      try { S.categories.push(await q(sb.from('categories').insert({ shop_id: S.shop.id, name, color: $('#cnc', m).value, icon: newIcon || null, sort: S.categories.length }).select().single()));
        $('#cnn', m).value = ''; newIcon = ''; $('#cnic', m).textContent = '＋'; $('#cnc', m).value = CAT_COLORS[S.categories.length % CAT_COLORS.length]; draw(); toast('เพิ่มหมวดแล้ว', 'ok'); } catch (e) { fail(e); }
    };
    $('#cna', m).onclick = add; $('#cnn', m).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    $('#cmsort', m).onclick = async () => { const l = [...S.categories].sort((a, b) => a.name.localeCompare(b.name, 'th')); await Promise.all(l.map((x, k) => save(x, { sort: k }))); draw(); };
  }
  const oc = m.close; m.close = () => { oc(); after?.(); }; $('.x', m).onclick = m.close; $('[data-c]', m).onclick = m.close;
  draw();
};

/* product form: manage buttons refresh the selects in place */
const _productForm48 = productForm;
productForm = function (p, after) {
  _productForm48(p, after);
  const m = $$('.mbg').pop(); if (!m) return;
  const cs = $('[name=category_id]', m), us = $('[name=unit]', m);
  $('#pcatm', m)?.addEventListener('click', () => categoryManager(() => {
    const v = cs.value; cs.innerHTML = `<option value="">—</option>` + [...S.categories].sort((a, b) => num(a.sort) - num(b.sort)).map(c => `<option value="${c.id}">${esc((c.icon ? c.icon + ' ' : '') + c.name)}</option>`).join(''); cs.value = v; }));
  $('#punitm', m)?.addEventListener('click', () => unitManager(() => {
    const v = us.value; us.innerHTML = [...new Set([v, ...UNITS])].filter(Boolean).map(u => `<option>${esc(u)}</option>`).join(''); us.value = UNITS.includes(v) ? v : v; }));
};

/* products page: units button + quick promo on each card */
const _products48 = VIEWS.products;
VIEWS.products = pg => {
  _products48(pg);
  const cb = $('#catBtn'); if (cb) { cb.innerHTML = '🗂️ หมวดหมู่'; cb.onclick = () => categoryManager(() => go('products')); }
  if (cb && !$('#unitBtn')) cb.insertAdjacentHTML('afterend', '<button class="btn" id="unitBtn">📏 หน่วยนับ</button>');
  if ($('#unitBtn')) $('#unitBtn').onclick = () => unitManager(() => go('products'));
  if (!canDo('promotions')) return;
  const g = $('#pmg', pg); if (!g) return;
  const deco = () => $$('.pm .pm-acts', g).forEach(a => { if (!$('[data-act=promo]', a)) a.insertAdjacentHTML('afterbegin', '<button data-act="promo" title="ตั้งโปร ซื้อ X ราคา ฿">🏷️</button>'); });
  new MutationObserver(deco).observe(g, { childList: true }); deco();
  g.addEventListener('click', e => { const b = e.target.closest('[data-act=promo]'); if (!b) return; e.stopPropagation(); e.preventDefault();
    const p = S.products.find(x => x.id === b.closest('.pm').dataset.id); if (p) quickPromo(p, () => go('products')); }, true);
};

/* open the promotion form preset to "buy 3 for ฿…" for one product */
function quickPromo(p, after) {
  promoForm(null, after);
  const m = $$('.mbg').pop(); if (!m) return;
  const f = $('#pf', m); f.scope.value = 'product'; f.scope.dispatchEvent(new Event('change'));
  const ps = $('#ps', m); ps.value = p.barcode || p.name; ps.dispatchEvent(new Event('input'));
  const cbx = $(`[data-pid="${p.id}"]`, m); if (cbx && !cbx.checked) { cbx.checked = true; cbx.dispatchEvent(new Event('change')); }
  f.dataset.pre = p.name + ' '; f.name.value = '';
  $('[data-tp=b3]', m)?.click();
  f.value.value = Math.max(1, Math.floor(num(p.price) * 3 * 0.9)); f.value.dispatchEvent(new Event('input', { bubbles: true })); f.value.select();
}

/* settings: shortcuts */
const _settings48 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings48(pg);
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:16px"><h3 style="margin-top:0">🗂️ หมวดหมู่ · 📏 หน่วยนับ · 🏷️ โปรโมชั่น</h3>
    <p class="muted" style="font-size:13px;margin-top:0">หมวดหมู่ ${S.categories.length} หมวด · หน่วยนับ ${UNITS.length} หน่วย · โปรโมชั่น ${S.promotions.length} รายการ</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="s_cat">🗂️ จัดการหมวดหมู่</button><button type="button" class="btn" id="s_unit">📏 จัดการหน่วยนับ</button><button type="button" class="btn" id="s_pro">🏷️ สร้างโปร “ซื้อ X ราคา ฿”</button></div></div>`);
  $('#s_cat').onclick = () => categoryManager();
  $('#s_unit').onclick = () => unitManager();
  $('#s_pro').onclick = () => { go('promotions'); setTimeout(() => { promoForm(null, () => go('promotions')); setTimeout(() => $$('.mbg').pop()?.querySelector('[data-tp=b3]')?.click(), 50); }, 300); };
};
