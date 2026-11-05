/* ================= v4.4 — receive goods (bill OCR, fuzzy product match, cost alerts, price advice), cashier personal use ================= */
PAGES.splice(PAGES.findIndex(p => p.id === 'stock') + 1, 0, { id: 'receive', ic: '📥', name: 'Receive goods', roles: ['owner', 'manager', 'stock'] });
Object.assign(TH, { 'Receive goods': 'รับสินค้าเข้า' });
PAGE_PERM.receive = 'manage_inventory';
PAGE_DESC.receive = 'ถ่ายรูปบิล → ระบบอ่านรายการ จับคู่สินค้า เทียบราคาทุน และแนะนำราคาขาย · หรือเพิ่มรายการเองได้';
ICON.receive = SVG('<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5M12 4v5h4"/>');
Object.assign(AUDIT_L, { cost_increase: 'ราคาทุนเพิ่มขึ้น', price_update: 'ปรับราคาขายตามทุน' });

/* ---------- fuzzy matching ---------- */
const nrm = s => String(s || '').toLowerCase().replace(/[่-์็]/g, '').replace(/[^0-9a-z฀-๿]+/g, '');
const grams = s => { const g = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); g.set(k, (g.get(k) || 0) + 1); } return g; };
function dice(a, b) {
  if (!a || !b) return 0; if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a.includes(b) || b.includes(a) ? .6 : 0;
  const A = grams(a), B = grams(b); let n = 0, ta = 0, tb = 0;
  A.forEach(v => ta += v); B.forEach(v => tb += v); A.forEach((v, k) => { n += Math.min(v, B.get(k) || 0); });
  let s = 2 * n / (ta + tb);
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) s = Math.max(s, .85);
  return s;
}
function matchProducts(name, code) {
  if (code) { const p = S.products.find(x => x.barcode === code || x.sku === code); if (p) return [{ p, score: 1, how: 'barcode' }]; }
  const n = nrm(name); if (n.length < 2) return [];
  return S.products.filter(p => p.active !== false).map(p => ({ p, score: Math.max(dice(n, nrm(p.name)), dice(n, nrm(p.name_en)), p.sku ? dice(n, nrm(p.sku)) : 0), how: 'name' }))
    .filter(x => x.score >= .3).sort((a, b) => b.score - a.score).slice(0, 4);
}

/* ---------- bill OCR (free, runs on the device with Tesseract: Thai + English) ---------- */
let TESS_P = null, TESS_W = null;
async function ocrImage(file, onProg) {
  TESS_P ||= loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  await TESS_P;
  if (!TESS_W) TESS_W = await Tesseract.createWorker(['tha', 'eng'], 1, { logger: m => { if (m.status === 'recognizing text') onProg?.('กำลังอ่านบิล', m.progress); else if (/load|init/.test(m.status)) onProg?.('กำลังเตรียมตัวอ่านภาษาไทย (ครั้งแรกจะช้าสักครู่)', m.progress || 0); } });
  const img = await prepImage(file);
  const { data } = await TESS_W.recognize(img);
  return data.text || '';
}
async function prepImage(file) {   // shrink, greyscale and boost contrast: faster and more accurate OCR
  const bmp = await createImageBitmap(file);
  const sc = Math.min(1, 2200 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * sc), h = Math.round(bmp.height * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.drawImage(bmp, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) { let g = .299 * a[i] + .587 * a[i + 1] + .114 * a[i + 2]; g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 140)); a[i] = a[i + 1] = a[i + 2] = g; }
  x.putImageData(d, 0, 0); return c;
}
const UNIT_RE = /(ชิ้น|ขวด|แพ็ค|แพ็ก|แพค|ลัง|กล่อง|ถุง|ซอง|กระป๋อง|โหล|กก\.?|กิโล|kg|pcs|pc|ea|box|pack|ctn|แผง|หวี|ลูก|ผล|มัด|กำ)/i;
function parseBill(text) {
  const out = { items: [], invoice: '', date: '', total: 0, supplier: '' };
  const lines = text.split(/\n+/).map(l => l.replace(/\u0E4D\u0E32/g, '\u0E33').replace(/[|_]/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l.length > 1);
  const tl = l => l.replace(/[\u0E48-\u0E4C\u0E47]/g, '');   // keyword tests ignore tone marks (OCR often drops them)
  const skip = /(รวม|ยอด|ภาษี|vat|total|sub ?total|สวนลด|discount|เงินสด|เงินทอน|change|cash|เลขที|วันที|date|โทร|tel|fax|tax|ใบกำกับ|ใบเสร็จ|ใบสงของ|invoice|receipt|สาขา|หนา ?\d|page|ลงชือ|ผูรับ|ผูสง|ผูขาย|ลูกคา|ทีอยู|เลขประจำ|ธนาคาร|บัญชี|ชำระ|ลำดับ|รายการ|จำนวนเงิน)/i;
  for (const l of lines.slice(0, 6)) { const s = S.suppliers.map(x => ({ x, sc: dice(nrm(l), nrm(x.name)) })).sort((a, b) => b.sc - a.sc)[0]; if (s && s.sc > .6 && !out.supplier) out.supplier = s.x.id; }
  for (const l of lines) {
    const L0 = tl(l);
    const inv = L0.match(/(?:เลขที|no\.?|invoice|บิล)\s*[:#.]?\s*([A-Z]{0,4}[-/]?\d[\dA-Z\-/]{2,})/i); if (inv && !out.invoice) out.invoice = inv[1];
    const dm = l.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/); if (dm && !out.date) { let y = +dm[3]; if (y < 100) y += 2500; if (y > 2400) y -= 543; const d = new Date(y, +dm[2] - 1, +dm[1]); if (!isNaN(d)) out.date = ymd(d); }
    const tm = L0.match(/(รวมทังสิน|ยอดสุทธิ|ยอดรวม|รวมเงิน|grand ?total|net ?total|total)\D*([\d,]+\.\d{2})/i); if (tm) out.total = Math.max(out.total, num(tm[2].replace(/,/g, '')));
    if (skip.test(L0)) continue;
    const bc = (l.match(/\b\d{8,14}\b/) || [])[0] || '';
    const rest = bc ? l.replace(bc, ' ') : l;
    const toks = [...rest.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g)].map(m => ({ v: num(m[0].replace(/,/g, '')), i: m.index, s: m[0] }));
    if (!toks.length) continue;
    let qty = 1, price = 0, total = 0, used = [];
    const T = toks.slice(-3);
    if (T.length === 3 && Math.abs(T[0].v * T[1].v - T[2].v) <= Math.max(.06, T[2].v * .02)) { [qty, price, total] = [T[0].v, T[1].v, T[2].v]; used = T; }
    else if (T.length >= 2 && Math.abs(T[T.length - 2].v * T[T.length - 1].v) && Number.isInteger(T[T.length - 2].v) && T[T.length - 2].v <= 500 && T[T.length - 1].v > T[T.length - 2].v && /\./.test(T[T.length - 1].s)) {
      qty = T[T.length - 2].v; total = T[T.length - 1].v; price = r2(total / qty); used = T.slice(-2); }
    else { price = total = toks[toks.length - 1].v; used = [toks[toks.length - 1]]; }
    if (!(price > 0) || price > 1e6) continue;
    let name = rest.slice(0, used[0].i).replace(/^\s*\d{1,3}[.)]?\s+/, '').replace(UNIT_RE, m => ' ').replace(/[^฀-๿a-zA-Z0-9 .()%\-/]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/[฀-๿a-zA-Z]{2,}/.test(name) && !bc) continue;
    const um = rest.slice(used[0].i).match(UNIT_RE) || rest.match(UNIT_RE);
    out.items.push({ billName: name || bc, code: bc, qty, price, total, unit: um ? um[0] : '' });
  }
  return out;
}

/* ---------- price advice ---------- */
function suggestPrice(p, newCost) {
  const tgt = num(S.shop.target_margin) || 30;
  let m = p.price > 0 && p.cost > 0 && p.price > p.cost ? (p.price - p.cost) / p.price : tgt / 100;
  m = Math.max(.05, Math.min(.9, m));
  const raw = newCost / (1 - m);
  return raw < 100 ? Math.ceil(raw) : Math.ceil(raw / 5) * 5;
}

/* ---------- RECEIVE GOODS page ---------- */
VIEWS.receive = async pg => {
  const R = { lines: [], supplier: '', invoice: '', date: ymd(new Date()), billFile: null, billPreview: '', ocrTotal: 0, paid: true };
  let tab = 'new';
  $('#tact').innerHTML = `<div class="seg" id="rtab"><button data-t="new" class="on">➕ รับสินค้า</button><button data-t="hist">🗂 ประวัติการรับ</button></div>`;
  $$('#rtab button').forEach(b => b.onclick = () => { tab = b.dataset.t; $$('#rtab button').forEach(x => x.classList.toggle('on', x === b)); tab === 'new' ? draw() : hist(); });
  const unitsOf = p => [{ unit: p.unit || 'ชิ้น', factor: 1 }, ...arr(p.units).map(u => ({ unit: u.unit, factor: num(u.factor) || 1 }))];
  const mkLine = (p, o = {}) => {
    const L = { id: uid(), p, billName: o.billName || '', code: o.code || '', qty: num(o.qty) || 1, cost: num(o.price) || (p ? num(p.cost) : 0), factor: 1, unit: '', skip: false, cands: o.cands || [], score: o.score ?? (p ? 1 : 0), how: o.how || '', setPrice: false, newPrice: 0 };
    if (p && o.unit) { const u = unitsOf(p).find(u => nrm(u.unit) === nrm(o.unit)); if (u) { L.factor = u.factor; L.unit = u.unit; } }
    if (p) L.unit ||= p.unit || 'ชิ้น';
    advise(L); return L;
  };
  const baseCost = L => L.factor ? num(L.cost) / L.factor : num(L.cost);
  const advise = L => { if (!L.p) return; const bc = baseCost(L), up = bc > num(L.p.cost) * 1.0001 && num(L.p.cost) > 0;
    L.newPrice = suggestPrice(L.p, bc); L.setPrice = num(L.p.price) <= bc && L.newPrice > num(L.p.price) && canDo('edit_prices'); L.suggest = (up || num(L.p.price) <= bc) && L.newPrice > num(L.p.price); };
  const draw = () => {
    const tot = R.lines.filter(l => !l.skip).reduce((a, l) => a + num(l.qty) * num(l.cost), 0);
    const ups = R.lines.filter(l => l.p && !l.skip && num(l.p.cost) > 0 && baseCost(l) > num(l.p.cost) * 1.0001);
    pg.innerHTML = `<div class="rcv">
      <div class="card rcv-head">
        <div class="rcv-bill">${R.billPreview ? `<img src="${R.billPreview}" alt="บิล" id="rbimg">` : `<div class="rcv-ph">🧾<small>ยังไม่มีรูปบิล</small></div>`}
          <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center"><label class="btn p">📷 ถ่ายรูปบิล<input type="file" accept="image/*" capture="environment" id="rbcam" hidden></label>
            <label class="btn">🖼️ เลือกรูป<input type="file" accept="image/*" id="rbfile" hidden></label></div>
          <div id="rocr" class="muted" style="font-size:13px;text-align:center"></div></div>
        <div class="rcv-meta">
          <div class="fg"><label class="f">ผู้จำหน่าย</label><select class="in" id="rsup"><option value="">— ไม่ระบุ —</option>${S.suppliers.map(s => `<option value="${s.id}" ${R.supplier === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
          <div class="grid2"><div class="fg"><label class="f">เลขที่บิล</label><input class="in" id="rinv" value="${esc(R.invoice)}"></div><div class="fg"><label class="f">วันที่บิล</label><input class="in" type="date" id="rdate" value="${esc(R.date)}"></div></div>
          <div class="sbox"><span>🔍</span><input class="in" id="radd" placeholder="สแกน / พิมพ์ชื่อสินค้าเพื่อเพิ่มรายการ (ไม่มีบิลก็เพิ่มเองได้)" autocomplete="off"></div><div id="rsug" class="rsug"></div>
          ${ups.length ? `<div class="rcv-alert">⚠️ ราคาทุนเพิ่มขึ้น ${ups.length} รายการ: ${ups.slice(0, 4).map(l => `${esc(l.p.name)} <b>+${((baseCost(l) / num(l.p.cost) - 1) * 100).toFixed(0)}%</b>`).join(' · ')}${ups.length > 4 ? ' …' : ''}</div>` : ''}
        </div></div>
      <div id="rlines" class="rlines">${R.lines.length ? R.lines.map(lineHTML).join('') : '<div class="empty">📦<br>ถ่ายรูปบิลเพื่อให้ระบบอ่านรายการให้ หรือสแกน/ค้นหาสินค้าเพื่อเพิ่มเอง</div>'}</div>
      ${R.lines.length ? `<div class="card rcv-foot"><div><small class="muted">ต้นทุนรวม · ${R.lines.filter(l => !l.skip).length} รายการ</small><div class="b" style="font-size:22px">${baht(tot)}</div>
          ${R.ocrTotal ? `<small style="color:${Math.abs(R.ocrTotal - tot) < 1 ? 'var(--ok)' : 'var(--warn)'}">ยอดในบิล ${baht(R.ocrTotal)}${Math.abs(R.ocrTotal - tot) < 1 ? ' ✓ ตรงกัน' : ' — ตรวจสอบอีกครั้ง'}</small>` : ''}</div>
        <label class="row"><input type="checkbox" id="rpaid" ${R.paid ? 'checked' : ''}> จ่ายเงินผู้จำหน่ายแล้ว</label>
        <button class="btn" id="rclear">ล้าง</button><button class="btn ok lg" id="rsave">✔ รับสินค้าเข้าสต็อก</button></div>` : ''}</div>`;
    wire();
  };
  const lineHTML = (L, i) => {
    const p = L.p, bc = baseCost(L), oc = p ? num(p.cost) : 0, diff = oc > 0 ? (bc / oc - 1) * 100 : 0;
    const chg = !p ? '' : oc <= 0 ? '<span class="chip">ทุนใหม่</span>' : Math.abs(diff) < .05 ? '<span class="chip">ทุนเท่าเดิม</span>' : diff > 0 ? `<span class="chip bad">▲ ทุนขึ้น ${diff.toFixed(1)}%</span>` : `<span class="chip ok">▼ ทุนลง ${Math.abs(diff).toFixed(1)}%</span>`;
    const loss = p && num(p.price) <= bc ? '<span class="chip bad">ขายขาดทุน!</span>' : '';
    return `<div class="rl ${L.skip ? 'skip' : ''} ${!p && !L.skip ? 'nomatch' : ''}" data-i="${i}">
      <div class="rl-img" style="${p?.image_url ? `background-image:url('${esc(p.image_url)}')` : ''}">${p?.image_url ? '' : '📦'}</div>
      <div class="rl-main">
        ${L.billName || L.code ? `<small class="muted">ในบิล: ${esc(L.billName)}${L.code ? ' · ' + esc(L.code) : ''}</small>` : ''}
        <div class="rl-prod">${p ? `<b>${esc(p.name)}</b> ${L.how === 'barcode' ? '<span class="chip ok">✓ บาร์โค้ดตรง</span>' : L.score < .999 ? `<span class="chip ${L.score >= .7 ? 'ok' : 'warn'}">≈ ${Math.round(L.score * 100)}% ตรวจสอบ</span>` : ''}` : '<b style="color:var(--bad)">ยังไม่จับคู่สินค้า</b>'}
          <button class="btn sm" data-a="pick">${p ? 'เปลี่ยน' : 'เลือกสินค้า'}</button>${!p && canDo('edit_products') ? '<button class="btn sm p" data-a="new">＋ สร้างสินค้าใหม่</button>' : ''}</div>
        ${L.cands.some(c => c.p.id !== p?.id) ? `<div class="rl-cands">${p ? '' : '<small class="muted">ใกล้เคียง:</small> '}${L.cands.filter(c => c.p.id !== p?.id).slice(0, 3).map(c => `<button class="chip" data-c="${c.p.id}">${esc(c.p.name)} ${Math.round(c.score * 100)}%</button>`).join('')}</div>` : ''}
        <div class="rl-nums">
          <label><small>จำนวน</small><input class="in" type="number" step="any" inputmode="decimal" data-f="qty" value="${L.qty}"></label>
          <label><small>หน่วย</small><select class="in" data-f="unit" ${p ? '' : 'disabled'}>${p ? unitsOf(p).map(u => `<option value="${u.factor}" ${u.factor === L.factor ? 'selected' : ''}>${esc(u.unit)}${u.factor !== 1 ? ` (${u.factor})` : ''}</option>`).join('') : '<option>—</option>'}</select></label>
          <label><small>ทุน / หน่วย</small><input class="in" type="number" step="any" inputmode="decimal" data-f="cost" value="${num(L.cost)}"></label>
          <div class="rl-tot"><small>รวม</small><b>${money(num(L.qty) * num(L.cost))}</b></div></div>
        ${p ? `<div class="rl-price">${chg}${loss}<span class="muted">ทุนเดิม ${money(oc)} → ${money(bc)} / ${esc(p.unit)} · ขาย ${money(p.price)} · กำไร ${num(p.price) > 0 ? ((num(p.price) - bc) / num(p.price) * 100).toFixed(0) : 0}%</span>
          ${L.suggest ? `<span class="chip warn">💡 แนะนำราคาขาย ฿${money(L.newPrice)} (กำไรเท่าเดิม)</span>` : ''}
          ${canDo('edit_prices') ? `<label class="row rl-set"><input type="checkbox" data-f="setPrice" ${L.setPrice ? 'checked' : ''}> ปรับราคาขายเป็น ฿<input class="in" type="number" step="any" data-f="newPrice" value="${L.newPrice}" style="width:90px"></label>` : ''}</div>` : ''}
      </div>
      <div class="rl-x"><button class="x" data-a="del" title="ลบ">×</button><button class="btn sm" data-a="skip">${L.skip ? 'รวมรายการ' : 'ข้าม'}</button></div></div>`;
  };
  const wire = () => {
    const onFile = async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await readBill(f); };
    $('#rbcam').onchange = onFile; $('#rbfile').onchange = onFile;
    $('#rbimg')?.addEventListener('click', () => modal('รูปบิล', `<img src="${R.billPreview}" style="width:100%;border-radius:12px">`, { wide: true }));
    $('#rsup').onchange = e => R.supplier = e.target.value; $('#rinv').oninput = e => R.invoice = e.target.value; $('#rdate').onchange = e => R.date = e.target.value;
    const add = $('#radd'), sug = $('#rsug');
    add.oninput = () => { const v = add.value.trim(); if (!v) return sug.innerHTML = '';
      const hits = S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v.toLowerCase()) || (p.barcode || '').includes(v) || (p.sku || '').toLowerCase() === v.toLowerCase())).slice(0, 8);
      sug.innerHTML = hits.map(p => `<button data-p="${p.id}">${esc(p.name)} <small class="muted">${esc(p.barcode || '')} · ทุน ${money(p.cost)}</small></button>`).join('') || `<div class="muted" style="padding:8px">ไม่พบ — กด Enter เพื่อสร้างสินค้าใหม่</div>`;
      $$('[data-p]', sug).forEach(b => b.onclick = () => { R.lines.unshift(mkLine(S.products.find(x => x.id === b.dataset.p))); sfx('add'); draw(); setTimeout(() => $('#radd')?.focus(), 30); }); };
    add.onkeydown = e => { if (e.key !== 'Enter') return; const v = add.value.trim(); if (!v) return;
      const hit = S.products.find(p => p.barcode === v || p.sku === v) || (S.products.filter(p => p.name.toLowerCase().includes(v.toLowerCase())).length === 1 ? S.products.find(p => p.name.toLowerCase().includes(v.toLowerCase())) : null);
      if (hit) { const ex = R.lines.find(l => l.p?.id === hit.id); if (ex) ex.qty++; else R.lines.unshift(mkLine(hit)); sfx('scan'); draw(); setTimeout(() => $('#radd')?.focus(), 30); }
      else if (canDo('edit_products')) { const before = new Set(S.products.map(p => p.id)); const isCode = looksCode(v);
        productForm({ name: isCode ? '' : v, barcode: isCode ? v : '', unit: 'ชิ้น', track_stock: true, active: true }, () => { const np = S.products.find(p => !before.has(p.id)); if (np) { R.lines.unshift(mkLine(np, { qty: 1, price: np.cost })); draw(); } }); } };
    $$('.rl', pg).forEach(row => {
      const L = R.lines[+row.dataset.i];
      $$('[data-f]', row).forEach(inp => inp.onchange = () => { const f = inp.dataset.f;
        if (f === 'unit') L.factor = num(inp.value) || 1, L.unit = inp.selectedOptions[0].textContent.replace(/\s*\(.*$/, '');
        else if (f === 'setPrice') L.setPrice = inp.checked; else L[f] = num(inp.value);
        if (['qty', 'cost', 'unit'].includes(f)) advise(L); draw(); });
      $$('[data-c]', row).forEach(b => b.onclick = () => { const c = L.cands.find(x => x.p.id === b.dataset.c); L.p = c.p; L.score = c.score; L.how = c.how; L.unit = ''; L.factor = 1; L.unit = c.p.unit; advise(L); draw(); });
      $$('[data-a]', row).forEach(b => b.onclick = () => { const a = b.dataset.a;
        if (a === 'del') { R.lines.splice(+row.dataset.i, 1); draw(); }
        if (a === 'skip') { L.skip = !L.skip; draw(); }
        if (a === 'pick') productPicker('เลือกสินค้าสำหรับ: ' + (L.billName || ''), p => { L.p = p; L.score = 1; L.how = 'manual'; L.factor = 1; L.unit = p.unit; advise(L); draw(); }, p => p.active !== false);
        if (a === 'new') { const before = new Set(S.products.map(p => p.id));
          productForm({ name: L.billName, barcode: L.code, cost: r2(baseCost(L)), unit: L.unit || 'ชิ้น', track_stock: true, active: true }, () => { const np = S.products.find(p => !before.has(p.id)); if (np) { L.p = np; L.score = 1; L.how = 'manual'; L.factor = 1; L.unit = np.unit; advise(L); draw(); } }); } }); });
    $('#rpaid') && ($('#rpaid').onchange = e => R.paid = e.target.checked);
    $('#rclear') && ($('#rclear').onclick = async () => { if (await confirmBox('ล้างรายการทั้งหมด?')) { Object.assign(R, { lines: [], billFile: null, billPreview: '', ocrTotal: 0, invoice: '' }); draw(); } });
    $('#rsave') && ($('#rsave').onclick = save);
  };
  const readBill = async f => {
    R.billFile = f; R.billPreview = URL.createObjectURL(f); draw();
    const st = (t, p) => { const el = $('#rocr'); if (el) el.innerHTML = `${esc(t)}${p != null ? `<div class="bar"><i style="width:${Math.round(p * 100)}%"></i></div>` : ''}`; };
    st('กำลังเตรียมตัวอ่านบิล…', 0);
    try {
      const text = await ocrImage(f, st);
      const b = parseBill(text);
      if (b.supplier) R.supplier = b.supplier; if (b.invoice) R.invoice = b.invoice; if (b.date) R.date = b.date; R.ocrTotal = b.total;
      let n = 0;
      for (const it of b.items) { const c = matchProducts(it.billName, it.code); const top = c[0];
        const good = top && (top.how === 'barcode' || top.score >= .55);
        R.lines.push(mkLine(good ? top.p : null, { ...it, cands: c, score: top?.score || 0, how: top?.how || '' })); n++; }
      draw();
      st(n ? `อ่านได้ ${n} รายการ — ตรวจสอบจำนวนและราคาก่อนบันทึก (ช่องสีส้ม = ไม่แน่ใจ)` : 'อ่านรายการจากบิลไม่ได้ — ลองถ่ายให้ตรงและชัดขึ้น หรือเพิ่มรายการเอง', null);
      if (!n) modal('ข้อความที่อ่านได้จากบิล', `<pre style="white-space:pre-wrap;font-size:12px;max-height:50vh;overflow:auto">${esc(text) || '(ว่าง)'}</pre>`);
    } catch (e) { st('อ่านบิลไม่สำเร็จ: ' + e.message, null); }
  };
  const save = async () => {
    const L = R.lines.filter(l => !l.skip);
    if (!L.length) return toast('ไม่มีรายการ', 'bad');
    if (L.some(l => !l.p)) return toast('ยังมีรายการที่ไม่ได้จับคู่สินค้า — เลือกสินค้า สร้างใหม่ หรือกด “ข้าม”', 'bad');
    if (L.some(l => !(num(l.qty) > 0))) return toast('จำนวนต้องมากกว่า 0', 'bad');
    const b = $('#rsave'); b.disabled = true; b.textContent = 'กำลังบันทึก…';
    try {
      let bill_url = '';
      if (R.billFile) { const path = `${S.shop.id}/bills/${Date.now()}.jpg`; const blob = await new Promise(r => prepImageColor(R.billFile).then(c => c.toBlob(r, 'image/jpeg', .8)));
        const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg' }); if (!error) bill_url = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl; }
      const total = r2(L.reduce((a, l) => a + num(l.qty) * num(l.cost), 0));
      const no = await q(sb.rpc('doc_no', { p_shop: S.shop.id, p_prefix: 'RC', p_table: 'purchases' }));
      const po = await q(sb.from('purchases').insert({ shop_id: S.shop.id, po_no: no, supplier_id: R.supplier || null, invoice_no: R.invoice, status: 'ordered', source: 'receive', bill_url, total, paid: R.paid ? total : 0,
        note: R.date ? 'วันที่บิล ' + R.date : '', user_id: S.user.id, user_name: S.shop._name || '' }).select().single());
      await q(sb.from('purchase_items').insert(L.map(l => ({ purchase_id: po.id, shop_id: S.shop.id, product_id: l.p.id, name: l.p.name, qty: r2(num(l.qty) * l.factor), cost: r2(baseCost(l)),
        bill_name: l.billName, bill_qty: num(l.qty), bill_unit: l.unit, old_cost: num(l.p.cost), old_price: num(l.p.price), new_price: l.setPrice ? num(l.newPrice) : null }))));
      await q(sb.rpc('receive_purchase', { p_purchase: po.id }));
      let changed = 0;
      for (const l of L) {
        if (num(l.p.cost) > 0 && baseCost(l) > num(l.p.cost) * 1.0001) logAct('cost_increase', 'product', l.p.name, { before: num(l.p.cost), after: r2(baseCost(l)), pct: r2((baseCost(l) / num(l.p.cost) - 1) * 100), bill: no });
        if (l.setPrice && num(l.newPrice) > 0 && num(l.newPrice) !== num(l.p.price)) { await q(sb.from('products').update({ price: num(l.newPrice) }).eq('id', l.p.id)); logAct('price_update', 'product', l.p.name, { before: num(l.p.price), after: num(l.newPrice), bill: no }); changed++; }
      }
      const ids = L.map(l => l.p.id); const fresh = await q(sb.from('products').select('*').in('id', ids)); fresh.forEach(f => Object.assign(S.products.find(p => p.id === f.id) || {}, f));
      sfx('pay'); toast(`รับสินค้าแล้ว ${L.length} รายการ (${no})${changed ? ` · ปรับราคาขาย ${changed} รายการ` : ''}`, 'ok');
      Object.assign(R, { lines: [], billFile: null, billPreview: '', ocrTotal: 0, invoice: '' }); draw();
    } catch (e) { fail(e); b.disabled = false; b.textContent = '✔ รับสินค้าเข้าสต็อก'; }
  };
  const hist = async () => {
    pg.innerHTML = '<div class="skel"><i></i><i></i></div>';
    const rows = await q(sb.from('purchases').select('*, supplier:suppliers(name), items:purchase_items(*)').eq('shop_id', S.shop.id).eq('status', 'received').order('received_at', { ascending: false }).limit(100));
    pg.innerHTML = rows.length ? `<div class="rhist">${rows.map(r => { const ups = r.items.filter(i => num(i.old_cost) > 0 && num(i.cost) > num(i.old_cost) * 1.0001);
      return `<div class="card rh" data-id="${r.id}"><div class="row"><b style="flex:1">${esc(r.po_no)} ${r.invoice_no ? `· บิล ${esc(r.invoice_no)}` : ''}</b><b>${baht(r.total)}</b></div>
        <div class="muted" style="font-size:13px">${dt(r.received_at)} · ${esc(r.supplier?.name || 'ไม่ระบุผู้จำหน่าย')} · ${r.items.length} รายการ · โดย ${esc(r.user_name || '')} ${r.bill_url ? '· 🧾 มีรูปบิล' : ''}</div>
        ${ups.length ? `<div style="margin-top:4px"><span class="chip bad">▲ ทุนขึ้น ${ups.length} รายการ</span></div>` : ''}</div>`; }).join('')}</div>` : '<div class="empty">ยังไม่มีประวัติการรับสินค้า</div>';
    $$('.rh', pg).forEach(c => c.onclick = () => { const r = rows.find(x => x.id === c.dataset.id);
      modal(`${r.po_no} — ${baht(r.total)}`, `${r.bill_url ? `<a href="${esc(r.bill_url)}" target="_blank"><img src="${esc(r.bill_url)}" style="max-width:100%;max-height:260px;border-radius:12px;display:block;margin:0 auto 10px"></a>` : ''}
        <div class="tblwrap"><table class="tbl"><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ทุน/หน่วย</th><th class="right">ทุนเดิม</th><th class="right">ราคาขาย</th></tr>
        ${r.items.map(i => { const up = num(i.old_cost) > 0 && num(i.cost) > num(i.old_cost) * 1.0001; return `<tr><td>${esc(i.name)}${i.bill_name && i.bill_name !== i.name ? `<br><small class="muted">ในบิล: ${esc(i.bill_name)}</small>` : ''}</td><td class="right">${qtyf(i.qty)}</td>
          <td class="right" style="color:${up ? 'var(--bad)' : ''}">${money(i.cost)}${up ? ` ▲${((i.cost / i.old_cost - 1) * 100).toFixed(0)}%` : ''}</td><td class="right">${i.old_cost != null ? money(i.old_cost) : '—'}</td>
          <td class="right">${i.new_price ? `${money(i.old_price)} → <b>${money(i.new_price)}</b>` : i.old_price != null ? money(i.old_price) : '—'}</td></tr>`; }).join('')}</table></div>`, { wide: true }); });
  };
  draw();
};
async function prepImageColor(file) { const bmp = await createImageBitmap(file); const sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)); const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c; }
/* stock page: "+ รับสินค้าเข้า" opens the receive screen */
const _stock44 = VIEWS.stock;
VIEWS.stock = pg => { _stock44(pg); const b = $('#rcv'); if (b) b.onclick = () => go('receive'); };

/* ---------- CASHIER: personal use (no price, just take out of stock) ---------- */
function personalUse() {
  const lines = []; let view = 'take';
  const me = S.shop._name || S.user.email.split('@')[0];
  const m = modal('🙋 เบิกใช้ส่วนตัว', `<div class="seg" id="puTab" style="margin-bottom:10px"><button data-v="take" class="on">เบิกสินค้า</button><button data-v="hist">ประวัติการเบิก</button></div><div id="puBody"></div>`, { wide: true });
  const body = () => $('#puBody', m);
  const drawTake = () => {
    body().innerHTML = `<div class="sbox"><span>🔍</span><input class="in" id="puq" placeholder="สแกนบาร์โค้ด หรือพิมพ์ชื่อสินค้า" autocomplete="off"></div><div id="pusug" class="rsug"></div>
      <div class="pulist">${lines.length ? lines.map((l, i) => `<div class="puline"><div class="rl-img" style="${l.p.image_url ? `background-image:url('${esc(l.p.image_url)}')` : ''}">${l.p.image_url ? '' : '📦'}</div>
        <b style="flex:1">${esc(l.p.name)}<br><small class="muted">คงเหลือ ${qtyf(l.p.stock)} ${esc(l.p.unit)}</small></b>
        <div class="qty"><button data-d="${i}">−</button><span>${qtyf(l.qty)}</span><button data-u="${i}">+</button></div><button class="x" data-x="${i}">×</button></div>`).join('') : '<div class="empty" style="padding:18px">ยังไม่มีสินค้า — สแกนหรือค้นหาด้านบน</div>'}</div>
      <div class="grid2"><div class="fg"><label class="f">ผู้เบิก</label><input class="in" id="puwho" value="${esc(me)}"></div><div class="fg"><label class="f">หมายเหตุ</label><input class="in" id="punote" placeholder="เช่น ทำอาหารกลางวัน / ใช้ในร้าน"></div></div>
      <button class="btn ok lg" id="pusave" style="width:100%" ${lines.length ? '' : 'disabled'}>✔ ตัดออกจากสต็อก (${lines.reduce((a, l) => a + l.qty, 0)} ชิ้น)</button>`;
    const q0 = $('#puq', m), sug = $('#pusug', m);
    const add = p => { const ex = lines.find(l => l.p.id === p.id); if (ex) ex.qty++; else lines.push({ p, qty: 1 }); sfx('add'); drawTake(); setTimeout(() => $('#puq', m)?.focus(), 30); };
    q0.oninput = () => { const v = q0.value.trim().toLowerCase(); if (!v) return sug.innerHTML = '';
      sug.innerHTML = S.products.filter(p => p.active !== false && (p.name.toLowerCase().includes(v) || (p.barcode || '').includes(v))).slice(0, 8).map(p => `<button data-p="${p.id}">${esc(p.name)} <small class="muted">${qtyf(p.stock)} ${esc(p.unit)}</small></button>`).join('');
      $$('[data-p]', sug).forEach(b => b.onclick = () => add(S.products.find(x => x.id === b.dataset.p))); };
    q0.onkeydown = e => { if (e.key !== 'Enter') return; const v = q0.value.trim(); const hit = S.products.find(p => p.barcode === v || p.sku === v); if (hit) add(hit); else { const l = S.products.filter(p => p.name.toLowerCase().includes(v.toLowerCase())); if (l.length === 1) add(l[0]); } };
    $$('[data-u]', m).forEach(b => b.onclick = () => { lines[+b.dataset.u].qty++; drawTake(); });
    $$('[data-d]', m).forEach(b => b.onclick = () => { const l = lines[+b.dataset.d]; l.qty--; if (l.qty <= 0) lines.splice(+b.dataset.d, 1); drawTake(); });
    $$('[data-x]', m).forEach(b => b.onclick = () => { lines.splice(+b.dataset.x, 1); drawTake(); });
    $('#pusave', m).onclick = async () => {
      const who = $('#puwho', m).value.trim() || me, note = $('#punote', m).value.trim(), btn = $('#pusave', m); btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
      try { for (const l of lines) { await q(sb.rpc('stock_move', { p_shop: S.shop.id, p_product: l.p.id, p_kind: 'personal', p_qty: l.qty, p_cost: null, p_supplier: null, p_note: `ผู้เบิก: ${who}${note ? ' · ' + note : ''}` })); l.p.stock = num(l.p.stock) - l.qty; }
        toast(`ตัดสต็อกใช้ส่วนตัว ${lines.length} รายการแล้ว`, 'ok'); sfx('pay'); lines.length = 0; if (S.page === 'pos') drawGrid(); view = 'hist'; setTab(); }
      catch (e) { fail(e); btn.disabled = false; btn.textContent = '✔ ตัดออกจากสต็อก'; }
    };
    setTimeout(() => q0.focus(), 50);
  };
  const drawHist = async () => {
    body().innerHTML = '<div class="skel"><i></i></div>';
    const rows = await q(sb.from('stock_moves').select('product_name,qty,cost,note,created_at,user_id').eq('shop_id', S.shop.id).eq('kind', 'personal').order('created_at', { ascending: false }).limit(200));
    const g = []; rows.forEach(r => { const k = r.created_at.slice(0, 16) + '|' + r.note; let o = g.find(x => x.k === k); if (!o) g.push(o = { k, at: r.created_at, note: r.note, items: [] }); o.items.push(r); });
    const val = rows.reduce((a, r) => a + Math.abs(num(r.qty)) * num(r.cost), 0);
    body().innerHTML = rows.length ? `<p class="muted" style="margin-top:0">${g.length} ครั้งล่าสุด · มูลค่าทุนรวม ${baht(val)}</p><div class="puhist">${g.map(o => `<div class="puh"><div class="row"><b style="flex:1">${esc(o.note.replace(/^ผู้เบิก:\s*/, '').split(' · ')[0] || '-')}</b><small class="muted">${dt(o.at)}</small></div>
      ${o.note.includes(' · ') ? `<div class="muted" style="font-size:13px">📝 ${esc(o.note.split(' · ').slice(1).join(' · '))}</div>` : ''}
      <div class="puitems">${o.items.map(i => `<span class="chip">${esc(i.product_name)} × ${qtyf(Math.abs(i.qty))}</span>`).join('')}</div></div>`).join('')}</div>` : '<div class="empty">ยังไม่มีการเบิกใช้ส่วนตัว</div>';
  };
  const setTab = () => { $$('#puTab button', m).forEach(b => b.classList.toggle('on', b.dataset.v === view)); view === 'take' ? drawTake() : drawHist().catch(fail); };
  $$('#puTab button', m).forEach(b => b.onclick = () => { view = b.dataset.v; setTab(); });
  setTab();
}
const _posView44 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView44(pg);
  const anchor = $('#custBtn'); if (anchor && !$('#puBtn')) { anchor.insertAdjacentHTML('afterend', '<button class="btn" id="puBtn" title="เบิกใช้ส่วนตัว">🙋 <span class="hide-sm">ใช้เอง</span></button>'); $('#puBtn').onclick = personalUse; }
};
