/* ================= v4.1 — organized reports, label designer ================= */

/* ---------- REPORTS: grouped report center ---------- */
const REPORT_GROUPS = [
  ['sell', '💰', 'ยอดขาย', 'ยอดขาย บิล ช่วงเวลา และช่องทางชำระ', ['sales', 'hourly', 'weekday', 'payment', 'vat', 'refund']],
  ['profit', '📈', 'กำไร & ค่าใช้จ่าย', 'กำไรขั้นต้น กำไรสุทธิ และค่าใช้จ่าย', ['profit', 'expense']],
  ['goods', '📦', 'สินค้า & สต็อก', 'สินค้าขายดี หมวดหมู่ คงคลัง และความเคลื่อนไหว', ['product', 'category', 'inventory', 'moves', 'barcode', 'custom']],
  ['loss', '🙋', 'เบิก / ชำรุด / ใช้เอง', 'ของออกจากสต็อกที่ไม่ได้ขาย', ['personal', 'damage']],
  ['promo', '🏷️', 'โปรโมชั่น', 'ผลของโปรโมชั่นแต่ละรายการ', ['promo']],
  ['people', '👥', 'ลูกค้า & ผู้จำหน่าย', 'ลูกค้า และการสั่งซื้อ', ['customer', 'purchase']],
  ['staff', '🧑‍💼', 'พนักงาน & กะ', 'ผลงานแคชเชียร์ กะ และกิจกรรม', ['staff', 'shift', 'activity']],
  ['branch', '🏬', 'สาขา', 'เปรียบเทียบทุกสาขา', ['branch']],
];
const _reportsView41 = VIEWS.reports;
VIEWS.reports = pg => {
  _reportsView41(pg);
  const rk = $('#rk', pg); if (!rk) return;
  const avail = new Set($$('button', rk).map(b => b.dataset.k));
  const groups = REPORT_GROUPS.map(g => [...g.slice(0, 4), g[4].filter(k => avail.has(k))]).filter(g => g[4].length);
  let G = localStorage.getItem('pos_rep_group') || 'sell'; if (!groups.find(g => g[0] === G)) G = groups[0][0];
  rk.style.display = 'none';
  rk.insertAdjacentHTML('beforebegin', `<div class="rgroups" id="rgs">${groups.map(([k, ic, l, d]) => `<button data-g="${k}"><span class="ri">${ic}</span><b>${l}</b><small>${d}</small></button>`).join('')}</div>
    <div class="rsub" id="rsub"></div>`);
  const label = k => REPORTS.find(r => r[0] === k)?.[1] || k;
  const pick = k => { $(`#rk [data-k="${k}"]`, pg)?.click(); $$('#rsub button', pg).forEach(b => b.classList.toggle('on', b.dataset.r === k)); localStorage.setItem('pos_rep_last', k); };
  const drawG = (first) => {
    $$('#rgs [data-g]', pg).forEach(b => b.classList.toggle('on', b.dataset.g === G));
    const g = groups.find(x => x[0] === G);
    $('#rsub', pg).innerHTML = g[4].map(k => `<button data-r="${k}">${esc(label(k))}</button>`).join('');
    $$('#rsub [data-r]', pg).forEach(b => b.onclick = () => pick(b.dataset.r));
    const last = localStorage.getItem('pos_rep_last');
    pick(first && g[4].includes(last) ? last : g[4][0]);
  };
  $$('#rgs [data-g]', pg).forEach(b => b.onclick = () => { G = b.dataset.g; localStorage.setItem('pos_rep_group', G); drawG(); });
  drawG(true);
};

/* ---------- LABEL DESIGNER: templates × sizes × price modes ---------- */
let JSPDF_P = null;
function a4Layout(z) {
  const cols = z.a4 || 1, gap = cols > 1 ? Math.max(0, Math.min(3, (200 - cols * z.w) / (cols - 1))) : 0;
  const rows = Math.max(1, Math.floor(297 / z.h)), mx = Math.max(0, (210 - cols * z.w - (cols - 1) * gap) / 2), my = Math.max(0, (297 - rows * z.h) / 2);
  return { cols, rows, gap, mx, my };
}
const LBL_SIZES = {
  's30x20': { w: 30, h: 20, n: '30 × 20 มม. (เล็กมาก)' }, 's40x25': { w: 40, h: 25, n: '40 × 25 มม.' }, 's40x30': { w: 40, h: 30, n: '40 × 30 มม. (ยอดนิยม)' },
  's50x30': { w: 50, h: 30, n: '50 × 30 มม.' }, 's50x40': { w: 50, h: 40, n: '50 × 40 มม.' }, 's58x40': { w: 58, h: 40, n: '58 × 40 มม.' },
  's70x50': { w: 70, h: 50, n: '70 × 50 มม. (ป้ายราคา)' }, 's100x50': { w: 100, h: 50, n: '100 × 50 มม. (ป้ายใหญ่)' }, 's100x150': { w: 100, h: 150, n: '100 × 150 มม. (ป้ายโปรตั้งโต๊ะ)' },
  'a4-65': { w: 38.1, h: 21.2, a4: 5, n: 'A4 · 65 ดวง (5 × 13)' }, 'a4-40': { w: 52.5, h: 29.7, a4: 4, n: 'A4 · 40 ดวง (4 × 10)' }, 'a4-24': { w: 70, h: 37, a4: 3, n: 'A4 · 24 ดวง (3 × 8)' },
  'a4-14': { w: 99, h: 38, a4: 2, n: 'A4 · 14 ดวง ป้ายชั้นวาง (2 × 7)' }, 'a4-8': { w: 105, h: 74, a4: 2, n: 'A4 · 8 ดวง ป้ายโปร (2 × 4)' }, 'a4-1': { w: 190, h: 270, a4: 1, n: 'A4 · 1 แผ่น โปสเตอร์โปร' },
};
const LBL_TPL = {
  classic: 'มาตรฐาน — ชื่อ + บาร์โค้ด + ราคา', bigprice: 'ราคาตัวใหญ่', shelf: 'ป้ายชั้นวาง (ชื่อใหญ่ + ราคา)', promo: 'ป้ายโปรโมชั่น — ราคาเดิมขีดฆ่า',
  burst: 'ป้ายโปรสีสด (ลดกี่ %)', mini: 'บาร์โค้ดอย่างเดียว', qr: 'QR โค้ด + ชื่อ + ราคา', dark: 'โทนเข้ม พรีเมียม',
};
const LBL_PRICE = { auto: 'อัตโนมัติ (ใช้ราคาโปรถ้ามี)', retail: 'ราคาขายปกติ', promo: 'ราคาโปร / โปรโมชั่น', wholesale: 'ราคาส่ง', none: 'ไม่แสดงราคา' };
let LBL_OPT = { tpl: 'classic', size: 's40x30', price: 'auto', copies: 1, byStock: false, name: true, code: true, shop: false, unit: false, color: '#1d4ed8', only: false };
try { Object.assign(LBL_OPT, JSON.parse(localStorage.getItem('pos_label_opt') || '{}')); } catch {}
function lblPrices(p, mode) {
  const retail = num(p.price), pp = num(p.promo_price) > 0 ? num(p.promo_price) : 0, ws = num(p.wholesale_price);
  const pr = itemPromosFor(p)[0];
  let promoPrice = pp, tag = '';
  if (pr) { tag = promoLabel(pr);
    if (['percent', 'amount', 'fixed_price'].includes(pr.kind)) promoPrice = r2(Math.max(0, (pp || retail) - promoLineDisc(pr, 1, pp || retail))); }
  const hasPromo = (promoPrice > 0 && promoPrice < retail) || !!tag;
  const now = mode === 'retail' ? retail : mode === 'wholesale' ? (ws || retail) : mode === 'none' ? null : (mode === 'promo' || mode === 'auto') && promoPrice > 0 ? promoPrice : retail;
  const old = (mode === 'auto' || mode === 'promo') && promoPrice > 0 && promoPrice < retail ? retail : null;
  const pct = old ? Math.round((1 - now / old) * 100) : (pr?.kind === 'percent' ? num(pr.value) : 0);
  return { now, old, tag, pct, hasPromo };
}
const BC_CACHE = new Map(), QR_CACHE = new Map();
async function barcodeImg(code) {
  if (BC_CACHE.has(code)) return BC_CACHE.get(code);
  await loadJsBarcode();
  const c = document.createElement('canvas');
  const opt = { height: 120, width: 3, displayValue: false, margin: 4 };
  try { JsBarcode(c, code, { ...opt, format: validEAN(code) ? 'EAN13' : 'CODE128' }); } catch { JsBarcode(c, code, { ...opt, format: 'CODE128' }); }
  const url = c.toDataURL('image/png'); BC_CACHE.set(code, url); return url;
}
function qrImg(text) {
  if (!QR_CACHE.has(text)) QR_CACHE.set(text, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg(text)));
  return QR_CACHE.get(text);
}
const yieldUI = () => new Promise(r => setTimeout(r, 0));
function lblCSS(o) { return lblCSS0(o).replace(/ svg\{/g, ' :is(svg,img){').replace(/\.lb \.bc :is\(svg,img\)\{/, '.lb .bc :is(svg,img){object-fit:fill;display:block;'); }
function lblCSS0(o) {
  const z = LBL_SIZES[o.size], W = z.w, H = z.h, u = Math.min(W, H * 1.6);
  const L = a4Layout(z), pageCSS = z.a4 ? `@page{size:A4;margin:${L.my.toFixed(2)}mm ${L.mx.toFixed(2)}mm}` : `@page{size:${W}mm ${H}mm;margin:0}`;
  return `${pageCSS}
  .lbls{display:${z.a4 ? 'grid' : 'block'};${z.a4 ? `grid-template-columns:repeat(${z.a4},${W}mm);gap:0 ${L.gap.toFixed(2)}mm;` : ''}}
  .lb{width:${W}mm;height:${H}mm;box-sizing:border-box;padding:${(H * .05).toFixed(2)}mm ${(W * .04).toFixed(2)}mm;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
    text-align:center;font-family:'Prompt','IBM Plex Sans Thai',sans-serif;color:#111;background:#fff;page-break-inside:avoid;break-inside:avoid;${z.a4 ? '' : 'page-break-after:always;break-after:page;'}}
  .lb .ln{font-size:${(H * .12).toFixed(2)}mm;font-weight:600;line-height:1.15;width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .lb .bc{width:100%;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .lb .bc svg{width:96%;height:100%;max-height:${(H * .42).toFixed(2)}mm}
  .lb .cd{font-size:${(H * .075).toFixed(2)}mm;letter-spacing:.06em;line-height:1}
  .lb .pp{font-size:${(H * .17).toFixed(2)}mm;font-weight:800;line-height:1.05;color:${o.color}}
  .lb .od{font-size:${(H * .09).toFixed(2)}mm;color:#777;text-decoration:line-through}
  .lb .sh{font-size:${(H * .07).toFixed(2)}mm;color:#666;line-height:1}
  .lb .un{font-size:${(H * .08).toFixed(2)}mm;color:#555}
  .lb .tg{position:absolute;top:0;right:0;background:#e5384f;color:#fff;font-weight:800;font-size:${(H * .085).toFixed(2)}mm;padding:.4mm 1.4mm;border-bottom-left-radius:2mm;max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lb.t-bigprice .pp{font-size:${(H * .3).toFixed(2)}mm}.lb.t-bigprice .bc svg{max-height:${(H * .28).toFixed(2)}mm}
  .lb.t-shelf{align-items:stretch;text-align:left;border-left:${(W * .03).toFixed(2)}mm solid ${o.color}}
  .lb.t-shelf .ln{font-size:${(H * .16).toFixed(2)}mm;font-weight:800}.lb.t-shelf .row2{display:flex;align-items:flex-end;justify-content:space-between;gap:1mm;width:100%}
  .lb.t-shelf .pp{font-size:${(H * .3).toFixed(2)}mm}.lb.t-shelf .bc{flex:0 0 auto;width:45%;align-items:flex-start}.lb.t-shelf .bc svg{max-height:${(H * .3).toFixed(2)}mm}
  .lb.t-promo{border:${(u * .025).toFixed(2)}mm solid #e5384f}.lb.t-promo .pp{color:#e5384f;font-size:${(H * .26).toFixed(2)}mm}
  .lb.t-burst{background:linear-gradient(160deg,#ffe14d,#ffb703);}.lb.t-burst .pct{background:#e5384f;color:#fff;border-radius:50%;width:${(u * .34).toFixed(2)}mm;height:${(u * .34).toFixed(2)}mm;display:grid;place-items:center;
    font-weight:900;font-size:${(u * .1).toFixed(2)}mm;line-height:1;position:absolute;top:${(H * .04).toFixed(2)}mm;right:${(W * .03).toFixed(2)}mm;transform:rotate(-12deg)}
  .lb.t-burst .pp{color:#b00020;font-size:${(H * .28).toFixed(2)}mm}.lb.t-burst .ln{font-weight:800;padding-right:${(u * .3).toFixed(2)}mm}
  .lb.t-mini .bc svg{max-height:${(H * .72).toFixed(2)}mm}
  .lb.t-qr{flex-direction:row;gap:1.5mm;text-align:left}.lb.t-qr .qrb{height:100%;aspect-ratio:1/1;flex:0 0 auto}.lb.t-qr .qrb svg{width:100%;height:100%}
  .lb.t-qr .txt{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.6mm;min-width:0}
  .lb.t-dark{background:#0f172a;color:#fff}.lb.t-dark .pp{color:#facc15}.lb.t-dark .bc{background:#fff;border-radius:1mm;padding:.5mm}.lb.t-dark .sh,.lb.t-dark .un{color:#cbd5e1}`;
}
async function lblHTML(p, o) {
  const pr = lblPrices(p, o.price), money2 = v => '฿' + money(v);
  const code = p.barcode || p.sku || '';
  const svg = code && o.tpl !== 'qr' ? `<img src="${await barcodeImg(code)}" alt="">` : '';
  const nm = o.name ? `<div class="ln">${esc(p.name)}</div>` : '';
  const price = pr.now == null ? '' : `<div>${pr.old ? `<span class="od">${money2(pr.old)}</span> ` : ''}<span class="pp">${money2(pr.now)}</span>${o.unit && p.unit ? `<span class="un"> / ${esc(p.unit)}</span>` : ''}</div>`;
  const bc = code ? `<div class="bc">${svg}${o.code ? `<div class="cd">${esc(code)}</div>` : ''}</div>` : '<div class="bc"><small style="color:#c00">ไม่มีบาร์โค้ด</small></div>';
  const shop = o.shop ? `<div class="sh">${esc(S.shop.name)}</div>` : '';
  const tag = pr.tag && o.price !== 'none' && !['burst', 'mini'].includes(o.tpl) ? `<div class="tg">${esc(pr.tag)}</div>` : '';
  let inner;
  switch (o.tpl) {
    case 'mini': inner = bc; break;
    case 'bigprice': inner = nm + price + bc; break;
    case 'shelf': inner = `${shop}${nm}<div class="row2">${bc}${price}</div>`; break;
    case 'promo': inner = `${tag}${nm}${price}${bc}`; break;
    case 'burst': inner = `${pr.pct || pr.tag ? `<div class="pct">${pr.pct ? '-' + pr.pct + '%' : esc(pr.tag).slice(0, 12)}</div>` : ''}${nm}${price}${bc}`; break;
    case 'qr': inner = `<div class="qrb"><img src="${qrImg(code || p.name)}" alt=""></div><div class="txt">${shop}${nm}${price}${o.code && code ? `<div class="cd">${esc(code)}</div>` : ''}</div>`; break;
    default: inner = `${tag}${shop}${nm}${bc}${price}`;
  }
  return `<div class="lb t-${o.tpl}">${inner}</div>`;
}
printLabels = async function (items) {
  const o = { ...LBL_OPT };
  const m = modal(`🏷️ สร้าง / พิมพ์ฉลาก — ${items.length} สินค้า`, `<div class="lbd">
    <div class="lbd-opt">
      <div class="fg"><label class="f">รูปแบบ (Template)</label><div class="tplgrid">${Object.entries(LBL_TPL).map(([k, l]) => `<button type="button" data-t="${k}" class="${o.tpl === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="fg"><label class="f">ขนาดฉลาก</label><select class="in" id="ls">${Object.entries(LBL_SIZES).map(([k, z]) => `<option value="${k}" ${o.size === k ? 'selected' : ''}>${z.n}</option>`).join('')}</select></div>
      <div class="fg"><label class="f">ราคาที่แสดง</label><select class="in" id="lpr">${Object.entries(LBL_PRICE).map(([k, l]) => `<option value="${k}" ${o.price === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="grid2"><div class="fg"><label class="f">จำนวนดวง / สินค้า</label><input class="in" id="lq" type="number" min="1" value="${o.copies}"></div>
        <div class="fg"><label class="f">สีหลัก</label><input class="in" id="lc" type="color" value="${o.color}" style="padding:3px;height:42px"></div></div>
      <label class="row"><input type="checkbox" id="lbs" ${o.byStock ? 'checked' : ''}> พิมพ์ตามจำนวนสต็อก</label>
      <label class="row"><input type="checkbox" id="lonly" ${o.only ? 'checked' : ''}> เฉพาะสินค้าที่มีโปรโมชั่น</label>
      <label class="row"><input type="checkbox" id="lpn" ${o.name ? 'checked' : ''}> ชื่อสินค้า</label>
      <label class="row"><input type="checkbox" id="lcd" ${o.code ? 'checked' : ''}> ตัวเลขบาร์โค้ด</label>
      <label class="row"><input type="checkbox" id="lun" ${o.unit ? 'checked' : ''}> หน่วย (/ชิ้น)</label>
      <label class="row"><input type="checkbox" id="lsh" ${o.shop ? 'checked' : ''}> ชื่อร้าน</label>
    </div>
    <div class="lbd-prev"><div class="muted" id="lcount"></div><div id="lprev" class="lprev"></div></div></div>`,
    { wide: true, foot: `<button class="btn" id="lpdf">⬇ ดาวน์โหลด PDF</button><button class="btn" id="lxl">📗 ส่งออกรายการ</button><button class="btn p" id="lgo">🖨️ พิมพ์</button>` });
  m.querySelector('.modal')?.classList.add('xwide');
  const read = () => Object.assign(o, { size: $('#ls', m).value, price: $('#lpr', m).value, copies: Math.max(1, +$('#lq', m).value || 1), color: $('#lc', m).value,
    byStock: $('#lbs', m).checked, only: $('#lonly', m).checked, name: $('#lpn', m).checked, code: $('#lcd', m).checked, unit: $('#lun', m).checked, shop: $('#lsh', m).checked });
  const targets = () => items.filter(p => !o.only || lblPrices(p, 'auto').hasPromo);
  const count = () => targets().reduce((a, p) => a + (o.byStock ? Math.max(0, Math.floor(num(p.stock))) : o.copies), 0);
  let tmr;
  const prev2 = async () => {
    read(); localStorage.setItem('pos_label_opt', JSON.stringify(o));
    const z = LBL_SIZES[o.size], tg = targets();
    $('#lcount', m).textContent = `ตัวอย่าง · ${tg.length} สินค้า · รวม ${count()} ดวง · ${z.n}`;
    const scale = Math.min(1.7, 250 / (z.w * 3.78));
    const cells = await Promise.all(tg.slice(0, 8).map(async p => `<div class="lcell" style="width:${(z.w * scale).toFixed(1)}mm;height:${(z.h * scale).toFixed(1)}mm"><div style="transform:scale(${scale});transform-origin:0 0">${await lblHTML(p, o)}</div></div>`));
    $('#lprev', m).innerHTML = `<style>${lblCSS(o).replace(/@page\{[^}]*\}/, '')}</style>${cells.join('') || '<div class="muted">ไม่มีสินค้าตามเงื่อนไข</div>'}`;
  };
  const go2 = () => { clearTimeout(tmr); tmr = setTimeout(() => prev2().catch(fail), 120); };
  $$('[data-t]', m).forEach(b => b.onclick = () => { o.tpl = b.dataset.t; LBL_OPT.tpl = o.tpl; $$('[data-t]', m).forEach(x => x.classList.toggle('on', x === b));
    if (['promo', 'burst'].includes(o.tpl) && o.price === 'retail') $('#lpr', m).value = 'auto'; go2(); });
  $('.lbd-opt', m).addEventListener('input', go2); $('.lbd-opt', m).addEventListener('change', go2);
  const progress = (txt, f) => { let el = $('#lprog', m); if (!el) { $('.lbd-prev', m).insertAdjacentHTML('afterbegin', '<div id="lprog" class="lprog"><span></span><div class="bar"><i></i></div></div>'); el = $('#lprog', m); }
    if (f == null) { el.remove(); return; } el.querySelector('span').textContent = txt; el.querySelector('i').style.width = Math.round(f * 100) + '%'; };
  let busy = false;
  const setBusy = b => { busy = b; $$('.mf .btn', m).forEach(x => x.disabled = b); };
  const plan = async () => {
    read(); const tg = targets(); if (!tg.length) { toast('ไม่มีสินค้าตามเงื่อนไข', 'bad'); return null; }
    const n = count(); if (n > 3000 && !await confirmBox(`จะสร้าง ${n} ดวง ต้องการดำเนินการต่อหรือไม่?`)) return null;
    const items = [];
    for (const [i, p] of tg.entries()) { items.push({ p, html: await lblHTML(p, o), k: o.byStock ? Math.max(0, Math.floor(num(p.stock))) : o.copies });
      if (i % 15 === 0) { progress(`กำลังเตรียมฉลาก ${i + 1}/${tg.length}`, (i + 1) / tg.length * .3); await yieldUI(); } }
    return items;
  };
  const build = async () => {
    const items = await plan(); if (!items) return null;
    const cells = []; items.forEach(it => { for (let i = 0; i < it.k; i++) cells.push(it.html); });
    return `<style>${lblCSS(o)}</style><div class="lbls">${cells.join('')}</div>`;
  };
  /* PDF: each different label is rendered once to an image, then placed as many times as needed */
  const makePDF = async () => {
    const items = await plan(); if (!items) return null;
    await Promise.all([loadH2C(), JSPDF_P ||= loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')]);
    const z = LBL_SIZES[o.size], { jsPDF } = window.jspdf;
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-20000px;top:0;background:#fff';
    host.innerHTML = `<style>${lblCSS(o).replace(/@page\{[^}]*\}/, '')}</style><div id="lhost"></div>`; document.body.appendChild(host);
    const imgs = [];
    try {
      for (const [i, it] of items.entries()) {
        if (!it.k) continue;
        $('#lhost', host).innerHTML = it.html; const el = $('#lhost .lb', host);
        const cv = await html2canvas(el, { scale: z.w > 90 ? 2.5 : 4, backgroundColor: o.tpl === 'dark' ? '#0f172a' : '#ffffff', logging: false });
        imgs.push({ url: cv.toDataURL('image/jpeg', 0.92), k: it.k, id: 'L' + imgs.length });
        progress(`กำลังสร้าง PDF ${i + 1}/${items.length}`, .3 + (i + 1) / items.length * .6); await yieldUI();
      }
    } finally { host.remove(); }
    const pdf = z.a4 ? new jsPDF({ unit: 'mm', format: 'a4' }) : new jsPDF({ unit: 'mm', format: [z.w, z.h], orientation: z.w > z.h ? 'l' : 'p' });
    const { mx, my, cols, gap, rows } = a4Layout(z);
    let slot = 0, first = true;
    for (const im of imgs) for (let c = 0; c < im.k; c++) {
      if (z.a4) { if (slot === cols * rows) { pdf.addPage('a4'); slot = 0; } const col = slot % cols, row = Math.floor(slot / cols);
        pdf.addImage(im.url, 'JPEG', mx + col * (z.w + gap), my + row * z.h, z.w, z.h, im.id, 'FAST'); slot++; }
      else { if (!first) pdf.addPage([z.w, z.h], z.w > z.h ? 'l' : 'p'); pdf.addImage(im.url, 'JPEG', 0, 0, z.w, z.h, im.id, 'FAST'); }
      first = false;
    }
    progress('', null);
    return pdf.output('blob');
  };
  const downloadPDF = async () => {
    if (busy) return; setBusy(true);
    try { const blob = await makePDF(); if (!blob) return;
      const name = safeName(`labels_${o.size}_${ymd(new Date())}.pdf`);
      if (isNativeApp()) await nativeSave(name, blob); else saveBlob(name, blob);
      toast('ดาวน์โหลด PDF ฉลากแล้ว — เปิดไฟล์แล้วสั่งพิมพ์ได้เลย', 'ok');
      logAct('labels_print', 'product', `${targets().length} สินค้า (PDF)`, { template: o.tpl, size: o.size, labels: count() });
    } catch (e) { progress('', null); fail(e); } finally { setBusy(false); }
  };
  $('#lgo', m).onclick = async () => {
    if (isNativeApp()) return downloadPDF();
    if (busy) return; setBusy(true);
    try { const h = await build(); progress('', null); if (h) { printReceipt(h); logAct('labels_print', 'product', `${targets().length} สินค้า`, { template: o.tpl, size: o.size, labels: count() }); } }
    catch (e) { progress('', null); fail(e); } finally { setBusy(false); }
  };
  $('#lpdf', m).onclick = downloadPDF;
  $('#lxl', m).onclick = () => xlsxDownload('labels', [{ name: 'ฉลาก', rows: targets().map(p => { const pr = lblPrices(p, o.price); return { 'ชื่อสินค้า': p.name, 'บาร์โค้ด': p.barcode || '', 'SKU': p.sku || '', 'ราคาบนฉลาก': pr.now ?? '', 'ราคาเดิม': pr.old ?? '', 'โปรโมชั่น': pr.tag, 'จำนวนดวง': o.byStock ? Math.max(0, Math.floor(num(p.stock))) : o.copies }; }) }]);
  go2();
};
Object.assign(AUDIT_L, { labels_print: 'พิมพ์ฉลากบาร์โค้ด' });
