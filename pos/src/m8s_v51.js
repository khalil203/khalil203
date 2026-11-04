/* ================= v5.1 — admin-only history deletion ================= */
const isAdmin = () => ['owner', 'admin'].includes(S.role);
const HIST_KINDS = {
  sales: ['🧾', 'ประวัติการขาย (บิล)', 'sales', 'ลบบิลพร้อมรายการสินค้าและการชำระเงิน — ยอดในรายงานจะหายไปด้วย (สต็อกไม่เปลี่ยน)'],
  stock_moves: ['📦', 'ความเคลื่อนไหวสต็อก', 'stock_moves', 'ลบเฉพาะประวัติรับเข้า/เบิก/ปรับ — จำนวนสต็อกปัจจุบันไม่เปลี่ยน'],
  audit_login: ['🔐', 'ประวัติเข้า-ออกระบบ', 'audit_log', 'ลบเฉพาะบันทึกการล็อกอิน / ออกจากระบบ'],
  audit: ['🛡️', 'บันทึกการใช้งานทั้งหมด', 'audit_log', 'ลบบันทึกกิจกรรมทุกประเภท'],
  cash_moves: ['💰', 'เงินเข้า-ออกลิ้นชัก', 'cash_moves', 'ลบรายการนำเงินเข้า/ออกลิ้นชัก'],
};
async function adminDelete(kind, { ids = null, before = null } = {}) {
  if (!isAdmin()) { toast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'bad'); return null; }
  const n = await q(sb.rpc('admin_delete_history', { p_shop: S.shop.id, p_kind: kind, p_ids: ids, p_before: before }));
  toast(`ลบประวัติแล้ว ${n} รายการ`, 'ok'); sfx('remove'); return n;
}
async function typedConfirm(msg) {
  return new Promise(res => {
    const m = modal('ยืนยันการลบประวัติ', `<p style="margin-top:0">${msg}</p><p class="muted" style="font-size:13px">ลบแล้วกู้คืนไม่ได้ — พิมพ์คำว่า <b>ลบ</b> เพื่อยืนยัน</p><input class="in" id="tcf" autocomplete="off" placeholder="พิมพ์ ลบ">`,
      { foot: '<button class="btn" data-n>ยกเลิก</button><button class="btn bad" data-y disabled>🗑️ ลบถาวร</button>' });
    const i = $('#tcf', m), y = $('[data-y]', m);
    i.oninput = () => { y.disabled = i.value.trim() !== 'ลบ'; };
    $('[data-n]', m).onclick = () => { m.close(); res(false); }; $('.x', m).onclick = () => { m.close(); res(false); };
    y.onclick = () => { m.close(); res(true); };
  });
}
function historyCleaner(preset) {
  if (!isAdmin()) return toast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น', 'bad');
  const d30 = ymd(new Date(Date.now() - 30 * 864e5));
  const m = modal('🗑️ ลบประวัติ (เฉพาะ Admin)', `
    <div class="hk-list">${Object.entries(HIST_KINDS).map(([k, [ic, l, , note]]) => `<label class="hk ${k === (preset || 'stock_moves') ? 'on' : ''}"><input type="radio" name="hk" value="${k}" ${k === (preset || 'stock_moves') ? 'checked' : ''}><span>${ic}</span><div><b>${l}</b><small>${note}</small></div></label>`).join('')}</div>
    <div class="fg"><label class="f">ลบรายการที่เก่ากว่าวันที่</label><input class="in" type="date" id="hkb" value="${d30}" max="${ymd(new Date(Date.now() + 864e5))}">
      <div class="pills" style="margin-top:8px">${[[7, '7 วัน'], [30, '30 วัน'], [90, '3 เดือน'], [365, '1 ปี'], [-1, 'ทั้งหมด']].map(([d, l]) => `<button type="button" data-d="${d}">เก่ากว่า ${l}</button>`).join('')}</div></div>
    <div class="hk-prev" id="hkp">กำลังนับ…</div>`,
    { foot: '<button class="btn" data-c>ปิด</button><span style="flex:1"></span><button class="btn bad" id="hkgo">🗑️ ลบประวัติ</button>' });
  const kind = () => $('input[name=hk]:checked', m).value;
  const count = async () => {
    const k = kind(), tbl = HIST_KINDS[k][2], b = $('#hkb', m).value;
    $$('.hk', m).forEach(l => l.classList.toggle('on', $('input', l).checked));
    let qy = sb.from(tbl).select('id', { count: 'exact', head: true }).eq('shop_id', S.shop.id).lt('created_at', b);
    if (k === 'audit_login') qy = qy.in('action', ['login', 'logout']);
    try { const { count: n, error } = await qy; if (error) throw error; $('#hkp', m).innerHTML = n ? `จะลบ <b>${qtyf(n)}</b> รายการ ที่เก่ากว่า ${dOnly(b)}` : 'ไม่มีรายการที่เข้าเงื่อนไข'; $('#hkgo', m).disabled = !n; }
    catch (e) { $('#hkp', m).textContent = 'นับไม่ได้: ' + e.message; }
  };
  $$('input[name=hk]', m).forEach(r => r.onchange = count); $('#hkb', m).onchange = count;
  $$('[data-d]', m).forEach(b => b.onclick = () => { const d = +b.dataset.d; $('#hkb', m).value = d < 0 ? ymd(new Date(Date.now() + 864e5)) : ymd(new Date(Date.now() - d * 864e5)); count(); });
  $('[data-c]', m).onclick = m.close;
  $('#hkgo', m).onclick = async () => {
    const k = kind(), b = $('#hkb', m).value;
    if (!(await typedConfirm(`ลบ “${HIST_KINDS[k][1]}” ที่เก่ากว่า ${dOnly(b)} ทั้งหมด?<br><small class="muted">${HIST_KINDS[k][3]}</small>`))) return;
    try { await adminDelete(k, { before: b }); count(); } catch (e) { fail(e); }
  };
  count();
}

/* settings: admin card (shown only to admins) */
const _settings51 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings51(pg);
  if (!isAdmin()) return;
  const host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="card" data-sec="account"><h3 style="margin-top:0">🛡️ ลบประวัติ (เฉพาะผู้ดูแลระบบ)</h3>
    <p class="muted" style="font-size:13px;margin-top:0">ลบประวัติการขาย ความเคลื่อนไหวสต็อก บันทึกเข้า-ออกระบบ และบันทึกการใช้งาน — พนักงานคนอื่นไม่เห็นปุ่มนี้ และระบบฐานข้อมูลจะไม่ยอมให้คนที่ไม่ใช่ Admin ลบ ทุกการลบจะถูกบันทึกไว้ว่าใครลบ</p>
    <button type="button" class="btn bad" id="hkopen">🗑️ เปิดเครื่องมือลบประวัติ</button></div>`);
  $('#hkopen').onclick = () => historyCleaner();
  $('.set-tabs .on', pg)?.click();
};

/* bill detail: delete this bill from history */
const _billDetail51 = billDetail;
billDetail = async function (sale, reload) {
  const r = await _billDetail51(sale, reload);
  if (!isAdmin() || !sale?.id) return r;
  const m = $$('.mbg').pop(); const foot = m && ($('.mf', m) || $('.mb', m)); if (!foot || $('#bdel', m)) return r;
  foot.insertAdjacentHTML('afterbegin', '<button class="btn bad sm" id="bdel" title="เฉพาะ Admin">🗑️ ลบบิลออกจากประวัติ</button>');
  $('#bdel', m).onclick = async () => {
    if (!(await typedConfirm(`ลบบิล <b>${esc(sale.bill_no || '')}</b> ออกจากประวัติการขาย?<br><small class="muted">${HIST_KINDS.sales[3]}</small>`))) return;
    try { await adminDelete('sales', { ids: [sale.id] }); m.close(); reload?.(); } catch (e) { fail(e); }
  };
  return r;
};

/* product stock card: delete single movement rows */
const _stockQuick51 = stockQuick;
stockQuick = async function (p, after) {
  const run = _stockQuick51(p, after);
  if (!isAdmin()) return run;
  const m = $$('.mbg').pop();
  await run;
  const box = m && $('#sqh', m); if (!box) return;
  const draw = async () => {
    let mv = []; try { mv = await q(sb.from('stock_moves').select('id,kind,qty,note,ref,created_at').eq('shop_id', S.shop.id).eq('product_id', p.id).order('created_at', { ascending: false }).limit(12)); } catch { return; }
    box.innerHTML = mv.length ? `<table class="rtable">${mv.map(r => `<tr><td>${dt(r.created_at)}</td><td>${(MOVE[r.kind] || ['', r.kind]).join(' ')}</td>
      <td class="right b" style="color:${r.qty < 0 ? 'var(--bad)' : 'var(--ok)'}">${r.qty > 0 ? '+' : ''}${qtyf(r.qty)}</td><td><small>${esc([r.ref, r.note].filter(Boolean).join(' · '))}</small></td>
      <td class="right"><button class="btn sm sq-del" data-mid="${r.id}" title="ลบประวัติรายการนี้ (Admin)">🗑️</button></td></tr>`).join('')}</table>
      <button class="btn sm" id="sqclr" style="margin-top:8px">🗑️ ลบประวัติทั้งหมดของสินค้านี้</button>` : 'ยังไม่มีความเคลื่อนไหว';
    $$('[data-mid]', box).forEach(b => b.onclick = async () => { if (!(await confirmBox('ลบประวัติรายการนี้? (จำนวนสต็อกไม่เปลี่ยน)'))) return; try { await adminDelete('stock_moves', { ids: [b.dataset.mid] }); draw(); } catch (e) { fail(e); } });
    $('#sqclr', box)?.addEventListener('click', async () => {
      if (!(await typedConfirm(`ลบประวัติความเคลื่อนไหวทั้งหมดของ <b>${esc(p.name)}</b>? (จำนวนสต็อกไม่เปลี่ยน)`))) return;
      try { const all = await q(sb.from('stock_moves').select('id').eq('shop_id', S.shop.id).eq('product_id', p.id)); await adminDelete('stock_moves', { ids: all.map(x => String(x.id)) }); draw(); } catch (e) { fail(e); } });
  };
  draw();
};

/* activity log page: admin cleaner button */
const _audit51 = VIEWS.audit;
VIEWS.audit = async pg => {
  await _audit51(pg);
  if (!isAdmin()) return;
  const t = $('#tact'); if (t && !$('#audclr', t)) { t.insertAdjacentHTML('beforeend', '<button class="btn bad" id="audclr">🗑️ ลบประวัติ (Admin)</button>'); $('#audclr').onclick = () => historyCleaner('audit_login'); }
};

/* v5.1.1 — show who deleted what: labels in the activity log + recent deletions in the cleaner */
AUDIT_L.delete_history = '🗑️ ลบประวัติ';
const HK_NAME = k => HIST_KINDS[k]?.[1] || k;
async function deletionLog(box) {
  try {
    const rows = await q(sb.from('audit_log').select('user_name,entity,detail,created_at').eq('shop_id', S.shop.id).eq('action', 'delete_history').order('created_at', { ascending: false }).limit(15));
    box.innerHTML = rows.length ? `<table class="rtable">${rows.map(r => `<tr><td>${dt(r.created_at)}</td><td><b>${esc(r.user_name || '-')}</b></td><td>${esc(HK_NAME(r.entity))}</td>
      <td class="right"><b class="bad">${qtyf(r.detail?.count || 0)}</b> รายการ${r.detail?.before ? `<br><small class="muted">ก่อน ${dOnly(r.detail.before)}</small>` : ''}</td></tr>`).join('')}</table>` : '<p class="muted">ยังไม่เคยมีการลบประวัติ</p>';
  } catch (e) { box.textContent = e.message; }
}
const _historyCleaner511 = historyCleaner;
historyCleaner = function (preset) {
  _historyCleaner511(preset);
  const m = $$('.mbg').pop(); if (!m || !isAdmin()) return;
  $('.mb', m)?.insertAdjacentHTML('beforeend', '<details class="hk-log" open><summary>📜 ประวัติการลบล่าสุด (ใครลบ เมื่อไหร่ อะไร)</summary><div id="hklog" class="muted">กำลังโหลด…</div></details>');
  deletionLog($('#hklog', m));
  const go2 = $('#hkgo', m); go2?.addEventListener('click', () => setTimeout(() => { const b = $('#hklog', m); if (b) deletionLog(b); }, 2500));
};
/* the activity log reads the deletion details in Thai */
const _audit511 = VIEWS.audit;
VIEWS.audit = async pg => {
  await _audit511(pg);
  const fix = () => $$('#al tr', pg).forEach(tr => { if (!tr.textContent.includes('ลบประวัติ') || tr.dataset.fx) return; tr.dataset.fx = 1;
    tr.querySelectorAll('small').forEach(sm => { sm.innerHTML = sm.innerHTML.replace(/count: (\d+)/, 'ลบ $1 รายการ').replace(/before: ([\d-]+)/, 'เก่ากว่า $1').replace(/ids: \d+/, '').replace(/before: null|ids: 0/g, ''); }); tr.classList.add('del-row'); });
  new MutationObserver(fix).observe($('#al', pg) || pg, { childList: true, subtree: true }); fix();
};
delete ACT_GROUP.logout;
