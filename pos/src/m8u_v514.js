/* ================= v5.1.4 — stock count history: who counted, when, which items, system vs counted ================= */
AUDIT_L.stock_count = '📋 ตรวจนับสต็อก';
const _countSheet514 = stockCountSheet;
stockCountSheet = function (after) {
  _countSheet514(after);
  const m = $$('.mbg').pop(); if (!m) return;
  const key = 'pos_count_' + S.shop.id;
  const foot = $('.mf', m);
  foot?.insertAdjacentHTML('afterbegin', '<button class="btn" id="cshist">📜 ประวัติตรวจนับ</button>');
  $('#cshist', m).onclick = () => countHistory();
  $('#csave', m).addEventListener('click', () => {
    let counted = {}; try { counted = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
    const ids = Object.keys(counted); if (!ids.length) return;
    const items = ids.map(id => { const p = S.products.find(x => x.id === id); return p ? { id, n: p.name, u: p.unit || '', sys: num(p.stock), cnt: num(counted[id]) } : null; }).filter(Boolean);
    const catId = localStorage.getItem('pos_count_cat') || '';
    const t0 = Date.now();
    const wait = setInterval(() => {
      if (localStorage.getItem(key) === null) { // saved
        clearInterval(wait);
        const diff = items.filter(i => i.cnt !== i.sys);
        logAct('stock_count', 'stock', catId ? (S.categories.find(c => c.id === catId)?.name || 'ไม่มีหมวด') : 'ทุกหมวด',
          { counted: items.length, match: items.length - diff.length, diff: diff.length, items: items.slice(0, 400) });
      } else if (Date.now() - t0 > 120000 || !document.body.contains(m) && localStorage.getItem(key) !== null) clearInterval(wait);
    }, 400);
  }, true);
};
async function countHistory() {
  const m = modal('📜 ประวัติการตรวจนับสต็อก', '<div id="chl" class="muted">กำลังโหลด…</div>', { wide: true });
  let rows = [];
  try { rows = await q(sb.from('audit_log').select('id,user_name,entity_id,detail,created_at').eq('shop_id', S.shop.id).eq('action', 'stock_count').order('created_at', { ascending: false }).limit(60)); } catch (e) { $('#chl', m).textContent = e.message; return; }
  // older counts (before this version) only exist as stock adjustments
  let old = [];
  try { old = await q(sb.from('stock_moves').select('product_name,qty,note,user_id,created_at').eq('shop_id', S.shop.id).eq('kind', 'adjust').order('created_at', { ascending: false }).limit(200)); } catch {}
  let names = {}; try { (await q(sb.from('shop_members').select('user_id,display_name,username').eq('shop_id', S.shop.id))).forEach(x => names[x.user_id] = x.display_name || x.username); } catch {}
  const sess = rows.map(r => `<details class="ch-s"><summary><span class="ch-d">${dt(r.created_at)}</span><b>👤 ${esc(r.user_name || '-')}</b><span class="chip">${esc(r.entity_id || 'ทุกหมวด')}</span>
      <span>นับ ${qtyf(r.detail?.counted || 0)} รายการ</span><span class="chip ok">ตรง ${qtyf(r.detail?.match || 0)}</span>${r.detail?.diff ? `<span class="chip bad">ไม่ตรง ${qtyf(r.detail.diff)}</span>` : ''}</summary>
      <table class="rtable"><tr><th>สินค้า</th><th class="right">ในระบบ</th><th class="right">นับได้</th><th class="right">ต่าง</th></tr>${(r.detail?.items || []).sort((a, b) => Math.abs(b.cnt - b.sys) - Math.abs(a.cnt - a.sys)).map(i => { const d = i.cnt - i.sys;
        return `<tr><td>${esc(i.n)}</td><td class="right">${qtyf(i.sys)}</td><td class="right"><b>${qtyf(i.cnt)}</b></td><td class="right" style="color:${d < 0 ? 'var(--bad)' : d > 0 ? 'var(--ok)' : 'var(--muted)'}">${d === 0 ? '✓' : (d > 0 ? '+' : '') + qtyf(d)}</td></tr>`; }).join('')}</table></details>`).join('');
  const oldHtml = old.length ? `<details class="ch-s"><summary><b>🗂️ การปรับยอดสต็อกก่อนหน้า</b><span class="muted">(${old.length} รายการ — ผลต่างที่ถูกปรับ)</span></summary><table class="rtable"><tr><th>วันเวลา</th><th>ผู้นับ</th><th>สินค้า</th><th class="right">ปรับ</th><th>หมายเหตุ</th></tr>
      ${old.map(o => `<tr><td>${dt(o.created_at)}</td><td>${esc(names[o.user_id] || '-')}</td><td>${esc(o.product_name || '')}</td><td class="right" style="color:${o.qty < 0 ? 'var(--bad)' : 'var(--ok)'}">${o.qty > 0 ? '+' : ''}${qtyf(o.qty)}</td><td><small>${esc(o.note || '')}</small></td></tr>`).join('')}</table></details>` : '';
  $('#chl', m).outerHTML = `<div>${sess || '<p class="muted">ยังไม่มีรอบตรวจนับที่บันทึกแบบละเอียด — รอบต่อไปที่กด “บันทึกการตรวจนับ” จะขึ้นที่นี่</p>'}${oldHtml}</div>`;
}
const _stock514 = VIEWS.stock;
VIEWS.stock = pg => { _stock514(pg); const c = $('#cnt'); if (c && !$('#cnthist')) { c.insertAdjacentHTML('afterend', '<button class="btn" id="cnthist">📜 ประวัติตรวจนับ</button>'); $('#cnthist').onclick = countHistory; } };
