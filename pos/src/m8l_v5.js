/* ================= v5.0 — reliable voice, products + stock in one page, new look (navy sidebar, KPI cards, dock) ================= */

/* ---------- voice: native TTS in the Android app, browser voices, online Thai voice as a fallback ---------- */
if (localStorage.getItem('pos_voice_v5') !== '1') { localStorage.setItem('pos_voice_v5', '1'); if (VIEWP.voice === false) { VIEWP.voice = true; localStorage.setItem('pos_view', JSON.stringify(VIEWP)); } }
let VOICES = [];
const loadVoices = () => new Promise(res => {
  if (!('speechSynthesis' in window)) return res([]);
  const v = speechSynthesis.getVoices(); if (v.length) return res(VOICES = v);
  let done = false; const fin = () => { if (done) return; done = true; res(VOICES = speechSynthesis.getVoices()); };
  speechSynthesis.addEventListener?.('voiceschanged', fin, { once: true }); setTimeout(fin, 1200);
});
loadVoices();
let TTS_AUDIO = null;
async function speakText(text, { rate = 1, pitch = 1, volume = 0.8, name = '' } = {}) {
  const th = LANG === 'th', lang = th ? 'th-TH' : 'en-US';
  // 1) Android app: native text-to-speech (works offline, Thai supported by Google TTS)
  const N = window.Capacitor?.Plugins?.TextToSpeech;
  if (N && isNativeApp()) {
    try { await N.stop().catch(() => {}); await N.speak({ text, lang, rate, pitch, volume, category: 'playback' }); return 'native'; } catch (e) { /* fall through */ }
  }
  // 2) browser voice
  if ('speechSynthesis' in window) {
    const vs = VOICES.length ? VOICES : await loadVoices();
    const v = (name && vs.find(x => x.name === name)) || vs.find(x => x.lang?.replace('_', '-').toLowerCase().startsWith(th ? 'th' : 'en'));
    if (v || !th) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = volume; if (v) u.voice = v;
        await new Promise(r => setTimeout(r, 60)); // Chrome drops speak() right after cancel()
        speechSynthesis.resume(); speechSynthesis.speak(u);
        return 'browser';
      } catch (e) { /* fall through */ }
    }
  }
  // 3) no Thai voice on this device → online voice
  try {
    TTS_AUDIO?.pause();
    TTS_AUDIO = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${th ? 'th' : 'en'}&q=${encodeURIComponent(text.slice(0, 190))}`);
    TTS_AUDIO.volume = Math.min(1, volume); TTS_AUDIO.playbackRate = Math.max(0.5, Math.min(2, rate));
    await TTS_AUDIO.play(); return 'online';
  } catch (e) { return 'none'; }
}
say = function (text, force) {
  if (!VIEWP.voice && !force) return;
  const v = SND.voice, s = String(text);
  const kind = /^(ยอดชำระ|Total)/.test(s) ? 'total' : /^(เงินทอน|Change)/.test(s) ? 'change' : 'thanks';
  if (!force && v[kind] === false) return;
  if (kind === 'thanks' && /^(ขอบคุณค่ะ|Thank you)/.test(s) && v.thanksText) text = v.thanksText;
  if (kind === 'change' && v.thanks && v.thanksAfterChange) text += ' ' + (v.thanksText || 'ขอบคุณค่ะ');
  return speakText(text, { rate: v.rate || 1, pitch: v.pitch || 1, volume: VIEWP.vol ?? 0.8, name: v.name });
};
// unlock audio/speech on the first tap (iOS/Android browsers need a user gesture)
document.addEventListener('pointerdown', function unlock() {
  document.removeEventListener('pointerdown', unlock, true);
  try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch {}
  try { AC ||= new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch {}
}, true);
// show which voice engine is used in the sound settings
const _soundSettings5 = soundSettings;
soundSettings = function () {
  _soundSettings5();
  const m = $$('.mbg').pop(); if (!m) return;
  const box = $('#svt1', m)?.parentElement; if (!box) return;
  const th = VOICES.some(v => v.lang?.toLowerCase().startsWith('th'));
  box.insertAdjacentHTML('afterend', `<p class="vstat">${isNativeApp() && window.Capacitor?.Plugins?.TextToSpeech ? '✅ ใช้เสียงพูดของแอป Android (ไม่ต้องใช้อินเทอร์เน็ต)' : th ? '✅ เครื่องนี้มีเสียงพูดภาษาไทย' : '🌐 เครื่องนี้ไม่มีเสียงไทยในตัว — ใช้เสียงไทยออนไลน์แทน (ต้องต่ออินเทอร์เน็ต)'}</p>`);
  $$('#svt1,#svt2,#svt3', m).forEach(b => b.addEventListener('click', () => { if (!$('#svon', m).checked) { $('#svon', m).checked = true; $('#svon', m).dispatchEvent(new Event('change')); } }));
};

/* ---------- products + stock in one page ---------- */
{ const pp = PAGES.find(p => p.id === 'products'); if (pp) { pp.name = 'สินค้า & สต็อก'; } }
const _vProducts5 = VIEWS.products, _vStock5 = VIEWS.stock;
const pgOK = id => { const p = PAGES.find(x => x.id === id); return !!p && pageOK(p); };
function psShell(pg, tab) {
  const canP = pgOK('products'), canS = pgOK('stock');
  if (tab === 'products' && !canP) tab = 'stock'; if (tab === 'stock' && !canS) tab = 'products';
  localStorage.setItem('pos_pstab', tab);
  const ttl = $('#ttl'); if (ttl) ttl.textContent = 'สินค้า & สต็อก';
  $$('[data-p="products"]').forEach(b => b.classList.add('on')); $$('[data-p="stock"]').forEach(b => b.classList.remove('on'));
  const act = S.products.filter(p => p.active !== false), low = act.filter(p => p.track_stock && p.stock > 0 && p.stock <= p.low_stock).length, out = act.filter(p => p.track_stock && p.stock <= 0).length;
  pg.innerHTML = `<div class="ps-tabs">${canP ? `<button data-pt="products" class="${tab === 'products' ? 'on' : ''}">🛍️ <span>สินค้า</span><em>${act.length}</em></button>` : ''}
      ${canS ? `<button data-pt="stock" class="${tab === 'stock' ? 'on' : ''}">📦 <span>สต็อก</span>${low + out ? `<em class="w">⚠️ ${low + out}</em>` : '<em>✓</em>'}</button>` : ''}
      <span class="ps-sum">${out ? `<b class="bad">หมด ${out}</b>` : ''}${low ? `<b class="warn">ใกล้หมด ${low}</b>` : ''}<b>ติดตามสต็อก ${act.filter(p => p.track_stock).length}</b></span></div><div id="psub"></div>`;
  $$('[data-pt]', pg).forEach(b => b.onclick = () => { if (b.dataset.pt !== tab) go(b.dataset.pt); });
  const sub = $('#psub', pg);
  return (tab === 'stock' ? _vStock5 : _vProducts5)(sub);
}
VIEWS.products = pg => psShell(pg, 'products');
VIEWS.stock = pg => psShell(pg, 'stock');

/* ---------- new look: sidebar, top bar ---------- */
const SVG5 = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3h2.6l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6"/></svg>',
  bill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
const thDate = d => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
const thTime = d => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
const _renderShell5 = renderShell;
renderShell = function () {
  _renderShell5();
  document.documentElement.classList.add('v5');
  if (!S.shop) return;
  const side = $('.side'), navs = $('.side .navs');
  if (side && navs && !$('.sb-head', side)) {
    navs.insertAdjacentHTML('beforebegin', `<div class="sb-head"><div class="sb-brand"><img src="${esc(S.shop.logo_url || 'logo-round.png')}" alt=""><b>Yanisa Shop<span>POS</span></b></div>
      <button type="button" class="sb-branch" data-brsw><i>${ICON.store}</i><span><b>${esc(S.shop.name)}</b><small>${esc(S.shop.branch_name || branchLine(S.shop))}</small></span><em>▾</em></button></div>`);
    $('.sb-branch', side).onclick = e => { e.stopPropagation(); branchSwitcher(); };
    const me = $('.me', side);
    if (me) {
      const av = $('.av', me); if (av) { av.classList.add('logo'); av.innerHTML = `<img src="${esc(S.shop.logo_url || 'logo-round.png')}" alt="">`; }
      me.insertAdjacentHTML('beforeend', `<button type="button" class="sb-out" title="ออกจากระบบ">${SVG5.out}</button>`);
      $('.sb-out', me).onclick = async () => { if (await confirmBox('ออกจากระบบ?')) logout(); };
    }
  }
  // hide the separate stock entry (it lives inside "สินค้า & สต็อก" now) when both are allowed
  if (pgOK('products') && pgOK('stock')) $$('[data-p="stock"]').forEach(b => b.remove());
  // search box: barcode button
  const gs = $('.gsearch'); if (gs && !$('.gs-scan', gs)) {
    gs.insertAdjacentHTML('beforeend', `<button type="button" class="gs-scan" title="สแกนบาร์โค้ดด้วยกล้อง">${SVG5.scan}</button>`);
    $('.gs-scan', gs).onclick = () => { if (S.page !== 'pos') go('pos'); setTimeout(() => $('#scanBtn')?.click(), S.page === 'pos' ? 0 : 400); };
    const gq = $('#gq'); if (gq) gq.placeholder = 'ค้นหาสินค้า ชื่อสินค้า, รหัสสินค้า หรือบาร์โค้ด…';
  }
  // date / time chip
  const bell = $('#bell'); if (bell && !$('#dtchip')) {
    bell.insertAdjacentHTML('beforebegin', `<div class="dtchip" id="dtchip"><i>${SVG5.cal}</i><span><b></b><small></small></span></div>`);
    const tick = () => { const c = $('#dtchip'); if (!c) return; const d = new Date(); $('b', c).textContent = thDate(d); $('small', c).textContent = thTime(d); };
    tick(); clearInterval(window._dtT); window._dtT = setInterval(tick, 15000);
  }
};
const _go5 = go;
go = function (page) { _go5(page); if (S.page === 'stock') { $$('[data-p="products"]').forEach(b => b.classList.add('on')); } };

/* ---------- KPI cards with trend + sparkline ---------- */
let KPI = null;
const _loadPosStats5 = loadPosStats;
loadPosStats = async function () {
  await _loadPosStats5();
  try {
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const y0 = new Date(t0 - 864e5);
    const rows = await q(sb.from('sales').select('total,cost_total,created_at').eq('shop_id', S.shop.id).eq('status', 'paid').gte('created_at', y0.toISOString()).limit(5000));
    const now = new Date(), cut = new Date(now - 864e5);
    const today = rows.filter(r => new Date(r.created_at) >= t0), yday = rows.filter(r => { const d = new Date(r.created_at); return d < t0 && d <= cut; });
    const hours = Array.from({ length: Math.max(2, now.getHours() + 1) }, () => ({ s: 0, n: 0, p: 0 }));
    today.forEach(r => { const h = hours[new Date(r.created_at).getHours()]; if (h) { h.s += num(r.total); h.n++; h.p += num(r.total) - num(r.cost_total); } });
    const cum = k => { let a = 0; return hours.map(h => (a += h[k])); };
    const sum = (a, f) => a.reduce((x, r) => x + f(r), 0);
    KPI = { sales: cum('s'), bills: cum('n'), profit: cum('p'),
      y: { s: sum(yday, r => num(r.total)), n: yday.length, p: sum(yday, r => num(r.total) - num(r.cost_total)) } };
  } catch { KPI = null; }
  drawStats();
};
const spark = (arr, kind) => {
  if (!arr || arr.length < 2) arr = [0, 0];
  const mx = Math.max(...arr, 1), w = 90, h = 34, st = w / (arr.length - 1);
  if (kind === 'bars') return `<svg class="spk" viewBox="0 0 ${w} ${h}">${arr.slice(-6).map((v, i, a) => `<rect x="${i * (w / a.length) + 3}" y="${h - Math.max(3, v / mx * h)}" width="${w / a.length - 6}" height="${Math.max(3, v / mx * h)}" rx="2"/>`).join('')}</svg>`;
  const pts = arr.map((v, i) => `${(i * st).toFixed(1)},${(h - 2 - v / mx * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg class="spk" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="0,${h} ${pts} ${w},${h}" class="ar"/><polyline points="${pts}"/></svg>`;
};
const trendTag = (now, prev) => { if (!prev) return now ? '<em class="up">▲ ใหม่วันนี้</em>' : '<em>เทียบเมื่อวาน</em>'; const p = (now - prev) / prev * 100; return `<em class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(1)}%</em>`; };
drawStats = function () {
  const el = $('#posStats'); if (!el || !TODAY) return;
  const act = S.products.filter(p => p.active !== false && p.track_stock);
  const units = act.reduce((a, p) => a + Math.max(0, num(p.stock)), 0), low = act.filter(p => p.stock <= p.low_stock).length;
  const prof = can('owner', 'manager');
  const cards = [
    ['blue', SVG5.cart, 'ยอดขายวันนี้', baht(TODAY.total), trendTag(TODAY.total, KPI?.y.s), spark(KPI?.sales)],
    ['green', SVG5.bill, 'จำนวนบิล', qtyf(TODAY.bills), trendTag(TODAY.bills, KPI?.y.n), spark(KPI?.bills, 'bars')],
    prof ? ['purple', SVG5.trend, 'กำไรขั้นต้น', baht(TODAY.profit), trendTag(TODAY.profit, KPI?.y.p), spark(KPI?.profit, 'bars')]
      : ['purple', SVG5.trend, 'ยอดของฉัน', baht(TODAY.mine), `<em>${qtyf(TODAY.mineBills)} บิล</em>`, spark(KPI?.sales)],
    ['orange', SVG5.box, 'สินค้าคงเหลือ', qtyf(units), `<em class="${low ? 'dn' : 'up'}">${low ? `⚠️ ใกล้หมด ${low} รายการ` : `${act.length} รายการ`}</em>`, '<span class="kbox">📦</span>'],
  ];
  el.innerHTML = cards.map(([c, ic, k, v, tr, sp], i) => `<div class="kpi ${c}" style="--i:${i}" ${i === 3 ? 'data-go="products"' : i === 0 ? 'data-ds' : ''}><i class="kic">${ic}</i><div class="kb"><small>${k}</small><b>${v}</b>${tr}</div>${sp}</div>`).join('');
  $('[data-go]', el)?.addEventListener('click', () => go('stock'));
  $('[data-ds]', el)?.addEventListener('click', () => dailySummary());
};

/* ---------- product tiles: stock pill on the picture, red price, "+ เพิ่ม" ---------- */
const _productCard5 = productCard;
productCard = function (p) {
  let h = _productCard5(p);
  const st = p.track_stock ? (p.stock <= 0 ? ['bad', 'หมด'] : p.stock <= p.low_stock ? ['warn', 'เหลือ ' + qtyf(p.stock)] : ['ok', 'เหลือ ' + qtyf(p.stock)]) : null;
  if (st) h = h.replace('<button class="more"', `<i class="stkp ${st[0]}">${st[1]}</i><button class="more"`);
  return h.replace(/<button class="qadd"([^>]*)>([\s\S]*?)<\/button>/, `<button class="qadd"$1>＋ <span>เพิ่ม</span></button>`);
};

/* ---------- cart: blue header, thumbnails, remove ✕, pay button ---------- */
const _drawCart5 = drawCart;
drawCart = function () {
  _drawCart5();
  const el = $('#cart'); if (!el) return;
  const hd = $('.hd', el), n = S.cart.length;
  if (hd) {
    hd.classList.add('ch');
    const t = $(':scope > b', hd); if (t) t.outerHTML = `<b class="ch-t">${SVG5.cart}<span>ตะกร้าสินค้า</span>${n ? `<i class="ch-n">${n}</i>` : ''}</b>`;
    const clr = $('#clrBtn', hd); if (clr) { clr.innerHTML = SVG5.trash; clr.title = 'ล้างตะกร้า'; }
    const hb = $('#holdBtn', hd); if (hb) { hb.textContent = '⏸'; hb.title = 'พักบิล (F8)'; }
  }
  $$('.citem', el).forEach(row => {
    const i = +($('[data-i]', row)?.dataset.i ?? -1), l = S.cart[i]; if (!l) return;
    const p = S.products.find(x => x.id === l.product_id);
    const bg = p?.tile_color || catColor(p?.category_id);
    row.insertAdjacentHTML('afterbegin', `<div class="cthumb" style="${p && isImg(p) ? `background-image:url('${esc(p.image_url)}')` : `background:${esc(bg || '#e0e7ff')}`}">${p && isImg(p) ? '' : esc([...(l.name || '?')].slice(0, 1).join(''))}</div>`);
    row.insertAdjacentHTML('beforeend', `<button type="button" class="cx" data-cx="${i}" title="ลบรายการ">✕</button>`);
  });
  $$('[data-cx]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.cx; const row = b.closest('.citem'); row?.classList.add('gone'); sfx('remove');
    setTimeout(() => { S.cart.splice(i, 1); drawCart(); }, 180); });
  const sum = $$('.ft .tline', el).find(x => x.textContent.trim().startsWith('ยอดรวม'));
  if (sum) $('span', sum).textContent = `รวมสินค้า ${qtyf(S.cart.reduce((a, l) => a + num(l.qty), 0))} ชิ้น (${n} รายการ)`;
  const big = $('.ft .tline.big span', el); if (big) big.textContent = 'ยอดรวมทั้งหมด';
  const pb = $('#payBtn', el); if (pb && !$('.arr', pb)) pb.insertAdjacentHTML('beforeend', `<i class="arr">${SVG5.arrow}</i>`);
};

/* ---------- sell screen: quick-action dock ---------- */
const _posView5 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView5(pg);
  const cb = $('#cashbar', pg); if (!cb || $('[data-c="scan"]', cb)) return;
  cb.classList.add('dock');
  cb.insertAdjacentHTML('afterbegin', `<button data-c="scan" class="pri"><span>${SVG5.scan}</span><div>สแกนบาร์โค้ด<small>(F2)</small></div></button>
    <button data-c="best"><span>⭐</span>สินค้าขายดี</button><button data-c="recent"><span>🕘</span>สินค้าล่าสุด</button><button data-c="promo"><span>🏷️</span>โปรโมชั่น</button>
    <button data-c="cust"><span>👤</span>ลูกค้า</button><button data-c="print"><span>🖨️</span>พิมพ์ใบเสร็จ</button>`);
  $('[data-c="last"]', cb)?.remove();
  const cat = c => { S.cat = c; $$('#cats .tab').forEach(t => t.classList.toggle('on', t.dataset.c === c)); drawGrid(); };
  const acts = { scan: () => { const i = $('#psearch') || $('#gq'); if (matchMedia('(hover:none)').matches) $('#scanBtn')?.click(); else i?.focus(); },
    best: () => cat('best'), recent: () => cat('recent'), promo: () => cat('promo'), cust: () => $('#memBtn')?.click(), print: () => $('#lastBtn')?.click() };
  $$('[data-c]', cb).forEach(b => { if (acts[b.dataset.c]) b.onclick = acts[b.dataset.c]; });
};
