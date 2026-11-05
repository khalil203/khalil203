/* v5.3.9 — labels always fit: every text is measured with the real font and sized to the space of each label size / template */
const _lblHTML539 = lblHTML;
const _lblCSS539 = lblCSS;
let LBL_FONTS_OK = null;
const lblFonts = () => LBL_FONTS_OK ||= Promise.all(['400', '600', '800'].map(w => document.fonts?.load?.(`${w} 20px Prompt`).catch(() => {}))).catch(() => {});
const LBL_CTX = document.createElement('canvas').getContext('2d');
const tw = (txt, wt, fs) => { LBL_CTX.font = `${wt} 100px Prompt, 'IBM Plex Sans Thai', sans-serif`; return LBL_CTX.measureText(String(txt)).width / 100 * fs; }; // mm
const fitFs = (txt, wt, maxFs, width, minFs = 1.2, extraPerChar = 0) => {
  const w1 = tw(txt, wt, 1) + String(txt).length * extraPerChar; return Math.max(minFs, Math.min(maxFs, width / Math.max(.01, w1) * .97)); };
const linesFor = (txt, wt, fs, width) => Math.ceil(tw(txt, wt, fs) / width * 1.08);

lblHTML = async function (p, o) {
  await lblFonts();
  let h = await _lblHTML539(p, o);
  const z = LBL_SIZES[o.size]; if (!z) return h;
  const W = z.w, H = z.h, t = o.tpl;
  const padX = W * .04, padY = H * .05, inner = W - padX * 2 - (t === 'shelf' ? W * .03 : 0);
  const get = re => (h.match(re) || [])[1];
  const set = (cls, css) => { h = h.replace(new RegExp(`class="${cls}"`), `class="${cls}" style="${css}"`); };
  const name = get(/<div class="ln">([^<]*)<\/div>/), price = get(/<span class="pp">([^<]*)<\/span>/), old = get(/<span class="od">([^<]*)<\/span>/),
    unit = get(/<span class="un">([^<]*)<\/span>/), code = get(/<div class="cd">([^<]*)<\/div>/), shop = get(/<div class="sh">([^<]*)<\/div>/);
  const hasImg = /<div class="bc"><img/.test(h);
  const shopH = shop ? H * .07 * 1.15 : 0;

  if (t === 'qr') {
    const q = Math.min(H - padY * 2, W * .5), txtW = W - padX * 2 - q - 1.5;
    h = h.replace('<div class="qrb">', `<div class="qrb" style="width:${q.toFixed(2)}mm;height:${q.toFixed(2)}mm;align-self:center">`);
    if (name) { let fs = H * .12; while (fs > H * .07 && linesFor(name, 600, fs, txtW) > 2) fs *= .92; set('ln', `font-size:${fs.toFixed(2)}mm`); }
    if (price) set('pp', `font-size:${fitFs(price + (unit || ''), 800, H * .17, txtW, H * .08).toFixed(2)}mm`);
    if (code) set('cd', `font-size:${fitFs(code, 400, H * .075, txtW, 1.2, .06).toFixed(2)}mm;letter-spacing:.06em`);
    if (shop) set('sh', `font-size:${fitFs(shop, 400, H * .07, txtW, 1.4).toFixed(2)}mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`);
    return h;
  }
  if (shop) set('sh', `font-size:${fitFs(shop, 400, H * .07, inner, 1.4).toFixed(2)}mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%`);

  if (t === 'shelf') {
    const bcW = inner * .44, prW = inner - bcW - 1;
    let pfs = price ? fitFs(price, 800, H * .3, prW - (unit ? tw(unit, 400, H * .08) : 0), H * .1) : 0;
    const cfs = code ? fitFs(code, 400, H * .075, bcW, 1.1, .06) : 0;
    let nfs = H * .16; const avail = H - padY * 2 - shopH;
    let bcH = H * .3;
    const fits = () => (name ? Math.min(2, linesFor(name, 800, nfs, inner)) * nfs * 1.15 : 0) + Math.max(pfs * 1.05, (hasImg ? bcH : 0) + cfs * 1.15) <= avail;
    for (let i = 0; i < 40 && !fits(); i++) { if (nfs > H * .09) nfs *= .94; else if (bcH > H * .16) bcH *= .92; else pfs *= .95; }
    if (name) set('ln', `font-size:${nfs.toFixed(2)}mm`);
    if (price) set('pp', `font-size:${pfs.toFixed(2)}mm`);
    if (code) set('cd', `font-size:${cfs.toFixed(2)}mm;letter-spacing:.06em`);
    h = h.replace('<div class="bc"><img', `<div class="bc" style="flex:0 0 ${bcW.toFixed(2)}mm;width:${bcW.toFixed(2)}mm"><img style="height:${bcH.toFixed(2)}mm;max-height:none;width:100%"`);
    return h;
  }
  // stacked templates: classic, bigprice, promo, burst, dark, mini
  const baseP = { bigprice: .3, promo: .26, burst: .28 }[t] ?? .17;
  const prLine = (price || '') + (old ? ' ' + old : '') + (unit || '');
  let pfs = price ? fitFs(prLine, 800, H * baseP, inner * (t === 'burst' ? .95 : 1), H * .09) : 0;
  const cfs = code ? fitFs(code, 400, H * .075, inner * .96, 1.1, .06) : 0;
  const nameW = t === 'burst' ? inner - Math.min(W, H * 1.6) * .3 : inner;
  let nfs = H * (t === 'burst' ? .12 : .12);
  const maxBc = t === 'mini' ? H * .72 : t === 'bigprice' ? H * .28 : H * .42, minBc = H * .14;
  const avail = H - padY * 2 - shopH;
  const nameH = () => name ? Math.min(2, linesFor(name, 600, nfs, nameW)) * nfs * 1.15 : 0;
  let bcH = Math.min(maxBc, avail - nameH() - pfs * 1.1 - cfs * 1.15 - .6);
  for (let i = 0; i < 40 && bcH < minBc; i++) { if (nfs > H * .075) nfs *= .93; else pfs *= .95; bcH = Math.min(maxBc, avail - nameH() - pfs * 1.1 - cfs * 1.15 - .6); }
  if (name) set('ln', `font-size:${nfs.toFixed(2)}mm`);
  if (price) set('pp', `font-size:${pfs.toFixed(2)}mm`);
  if (old) set('od', `font-size:${Math.min(H * .09, pfs * .55).toFixed(2)}mm`);
  if (unit) set('un', `font-size:${Math.min(H * .08, pfs * .5).toFixed(2)}mm`);
  if (code) set('cd', `font-size:${cfs.toFixed(2)}mm;letter-spacing:.06em`);
  if (hasImg) h = h.replace('<div class="bc"><img', `<div class="bc" style="flex:0 0 auto"><img style="height:${Math.max(minBc * .8, bcH).toFixed(2)}mm;max-height:none;width:96%"`);
  return h;
};
lblCSS = function (o) {
  return _lblCSS539(o) + `
  .lb .pp,.lb .od,.lb .un,.lb .cd{white-space:nowrap}
  .lb>div{max-width:100%}
  .lb.t-shelf .row2{align-items:flex-end;min-width:0;gap:1mm}
  .lb.t-shelf .row2>div:last-child{flex:1 1 auto;min-width:0;text-align:right}
  .lb .bc .cd{max-width:100%;overflow:hidden;line-height:1.1}
  .lb.t-qr .txt{overflow:hidden}`;
};

/* final pass: put the label in the page at its real size and shrink whatever still sticks out (handles Thai line heights, long names, any font) */
const _lblHTML539b = lblHTML;
let LBL_FIT_HOST = null;
lblHTML = async function (p, o) {
  const h0 = await _lblHTML539b(p, o);
  const z = LBL_SIZES[o.size]; if (!z) return h0;
  try { await document.fonts?.load?.('800 20px Prompt', 'กขคงฤๅ฿0123456789'); await document.fonts?.load?.('600 20px Prompt', 'กขคงฤๅ'); } catch {}
  if (!LBL_FIT_HOST) { LBL_FIT_HOST = document.createElement('div'); LBL_FIT_HOST.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;z-index:-1'; document.body.append(LBL_FIT_HOST); }
  LBL_FIT_HOST.innerHTML = `<style>${lblCSS(o).replace(/@page\{[^}]*\}/, '')}</style>${h0}`;
  const lb = LBL_FIT_HOST.querySelector('.lb'); if (!lb) return h0;
  const H = z.h, mm = lb.getBoundingClientRect().height / H; // px per mm
  const fsOf = el => parseFloat(getComputedStyle(el).fontSize) / mm;
  const setFs = (el, v) => { el.style.fontSize = v.toFixed(2) + 'mm'; };
  const box = () => { const r = lb.getBoundingClientRect(), cs = getComputedStyle(lb); return { l: r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), r: r.right - parseFloat(cs.paddingRight) + .5, b: r.bottom + .5, t: r.top - .5 }; };
  // 1) horizontal: single-line things must fit their own column
  for (const sel of ['.pp', '.cd', '.sh', '.od', '.un']) for (const el of lb.querySelectorAll(sel)) {
    for (let i = 0; i < 25; i++) { const B = box(), r = el.getBoundingClientRect(), par = el.closest('.bc,.row2>div:last-child,.txt') || lb, pr = par.getBoundingClientRect();
      const right = Math.min(B.r, par === lb ? B.r : pr.right + .5); const clip = el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1; if (!clip && r.right <= right && r.left >= B.l - .5) break; setFs(el, fsOf(el) * .93); } }
  // 2) vertical: shrink name → barcode → price until everything is inside
  const nameEl = $('.ln', lb), img = $('.bc img', lb), pp = $('.pp', lb), cd = $('.cd', lb);
  const over = () => { const B = box(); return [...lb.querySelectorAll('.ln,.bc,.pp,.cd,.sh,.row2,.txt')].some(e => { const r = e.getBoundingClientRect(); return r.height && (r.bottom > B.b || r.top < B.t); }) || lb.scrollHeight > lb.clientHeight + 1 || (nameEl && nameEl.scrollHeight > nameEl.clientHeight + 2); };
  for (let i = 0; i < 60 && over(); i++) {
    const k = i % 3;
    if (k === 0 && nameEl && fsOf(nameEl) > H * .065) setFs(nameEl, fsOf(nameEl) * .92);
    else if (k === 1 && img && img.getBoundingClientRect().height / mm > H * .13) img.style.height = (img.getBoundingClientRect().height / mm * .9).toFixed(2) + 'mm';
    else if (pp && fsOf(pp) > H * .08) { setFs(pp, fsOf(pp) * .93); }
    else if (cd && fsOf(cd) > 1.1) setFs(cd, fsOf(cd) * .93);
    else if (nameEl && fsOf(nameEl) > H * .05) setFs(nameEl, fsOf(nameEl) * .92);
    else break;
  }
  const out = lb.outerHTML; LBL_FIT_HOST.innerHTML = ''; return out;
};
