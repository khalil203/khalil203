/* v5.2.8 — receive goods: "เลือกคู่ค้า" popup (search + add + numbered list) instead of a plain dropdown */
function supplierPicker(cur, onPick) {
  const m = modal(LANG === 'th' ? 'เลือกคู่ค้า' : 'Choose supplier', `
    <div class="sp-top"><div class="sbox" style="flex:1"><span>🔍</span><input class="in" id="spq" placeholder="${LANG === 'th' ? 'ค้นหาคู่ค้าด้วยชื่อ' : 'Search supplier'}" autocomplete="off"></div>
      <button class="btn p" id="spAdd">＋ ${LANG === 'th' ? 'เพิ่มคู่ค้า' : 'Add'}</button></div>
    <div class="muted" id="spCnt" style="margin:12px 2px 8px;font-weight:700"></div><div id="spList" class="sp-list"></div>`);
  m.classList.add('sp-modal');
  const draw = () => {
    const k = ($('#spq', m).value || '').trim().toLowerCase();
    const list = S.suppliers.filter(s => !k || (s.name || '').toLowerCase().includes(k));
    $('#spCnt', m).textContent = `${LANG === 'th' ? 'ค้นพบ' : 'Found'} : ${list.length} ${LANG === 'th' ? 'รายชื่อ' : ''}`;
    $('#spList', m).innerHTML = `<button class="sp-item ${!cur ? 'on' : ''}" data-s=""><span class="muted">— ${LANG === 'th' ? 'ไม่ระบุ' : 'None'} —</span></button>` +
      list.map((s, i) => `<button class="sp-item ${cur === s.id ? 'on' : ''}" data-s="${s.id}"><b>${i + 1}.</b> ${esc(s.name)}${cur === s.id ? '<i>✓</i>' : ''}</button>`).join('');
    $$('[data-s]', m).forEach(b => b.onclick = () => { onPick(b.dataset.s); $('.x', m).click(); });
  };
  $('#spq', m).oninput = draw; draw();
  $('#spAdd', m).onclick = () => formModal(LANG === 'th' ? 'เพิ่มคู่ค้า' : 'Add supplier', [
    { k: 'name', label: LANG === 'th' ? 'ชื่อคู่ค้า / ร้าน' : 'Name', req: true, full: true }, { k: 'phone', label: LANG === 'th' ? 'เบอร์โทร' : 'Phone' }],
    { name: $('#spq', m).value.trim() }, async o => {
      if (!o.name?.trim()) throw new Error(LANG === 'th' ? 'กรุณากรอกชื่อ' : 'Name required');
      const r = await q(sb.from('suppliers').insert({ shop_id: S.shop.id, name: o.name.trim(), phone: o.phone || '' }).select().single());
      S.suppliers.push(r); S.suppliers.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      toast(LANG === 'th' ? 'เพิ่มคู่ค้าแล้ว' : 'Supplier added', 'ok'); onPick(r.id); $('.x', m).click();
    });
}

function enhanceSupplierSelect(sel) {
  if (!sel || sel.dataset.sp) return; sel.dataset.sp = 1; sel.style.display = 'none';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sp-btn';
  const paint = () => { const s = S.suppliers.find(x => x.id === sel.value);
    btn.innerHTML = `<span class="sp-ic">🏪</span><span class="sp-nm">${s ? esc(s.name) : `<span class="muted">${LANG === 'th' ? 'แตะเพื่อเลือกคู่ค้า' : 'Tap to choose supplier'}</span>`}</span><span class="sp-ch">›</span>`; };
  paint(); sel.after(btn); const lb = sel.parentElement?.querySelector('label'); if (lb) lb.textContent = LANG === 'th' ? 'คู่ค้า (ร้านที่รับของมา)' : 'Supplier';
  btn.onclick = () => supplierPicker(sel.value, id => {
    if (id && ![...sel.options].some(o => o.value === id)) { const s = S.suppliers.find(x => x.id === id); sel.insertAdjacentHTML('beforeend', `<option value="${id}">${esc(s?.name || '')}</option>`); }
    sel.value = id; sel.dispatchEvent(new Event('change', { bubbles: true })); paint();
  });
}
new MutationObserver(() => { const s = document.getElementById('rsup'); if (s && !s.dataset.sp) enhanceSupplierSelect(s); })
  .observe(document.documentElement, { childList: true, subtree: true });
