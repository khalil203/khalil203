/* ================= v4.7 — custom payment QR (upload your own), header branch switcher, full sound settings ================= */

/* ---------- custom payment QR ---------- */
const qrMode = () => (S.shop?.qr_mode === 'custom' && S.shop?.pay_qr_url) ? 'custom' : 'promptpay';
const customQRBlock = total => `<div class="qr cqr"><img src="${esc(S.shop.pay_qr_url)}" alt="QR ชำระเงิน" crossorigin="anonymous">
  ${S.shop.pay_qr_label ? `<div class="cqr-l">${esc(S.shop.pay_qr_label)}</div>` : ''}
  <b style="font-size:22px">${baht(total)}</b><span class="muted">ให้ลูกค้าสแกน QR ของร้าน โอนตามยอดนี้ แล้วกด “ยืนยันชำระเงิน”</span><div class="qrtimer" hidden></div></div>`;

const _payDialog47 = payDialog;
payDialog = function () {
  _payDialog47();
  const m = $$('.mbg').pop(); if (!m) return;
  let lastQR = null;
  const fix = () => {
    const pb = $('#pbody', m); if (!pb) return;
    const qr = $('.qr:not(.cqr)', pb), warn = [...$$('.chip.warn', pb)].find(c => c.textContent.includes('พร้อมเพย์'));
    if (qrMode() === 'custom' && (qr || warn)) {
      const tot = num(String($('.qr b', pb)?.textContent || '').replace(/[^\d.]/g, '')) || num(S._payTotal) || calc().total;
      (qr || warn).outerHTML = customQRBlock(tot);
      bc?.postMessage({ type: 'qr', label: S.shop.pay_qr_label || 'สแกนจ่าย QR', svg: `<img src="${esc(S.shop.pay_qr_url)}" style="width:280px;height:280px;object-fit:contain">`, total: tot });
    }
    const now = $('.qr', pb); if (now && now !== lastQR) { lastQR = now; sfx('qr'); }
  };
  new MutationObserver(fix).observe(m, { childList: true, subtree: true }); fix();
};

/* receipt: optionally print the shop's payment QR at the bottom */
const _receiptHTML47 = receiptHTML;
receiptHTML = function (sale, items, cust) {
  const h = _receiptHTML47(sale, items, cust), sh = S.shop;
  if (!sh.qr_on_receipt) return h;
  const src = sh.pay_qr_url && sh.qr_mode !== 'promptpay_only' ? sh.pay_qr_url : '';
  let img = '';
  if (src) img = `<img src="${esc(src)}" crossorigin="anonymous" style="width:150px;height:150px;object-fit:contain">`;
  else if (sh.promptpay_id) img = `<div style="width:150px;margin:auto">${qrSvg(promptPayPayload(sh.promptpay_id))}</div>`;
  if (!img) return h;
  const blk = `<hr><div class="c rqr">${img}<div>${esc(sh.pay_qr_label || 'สแกนชำระเงิน / โอนเงิน')}</div></div>`;
  const i = h.lastIndexOf('</div>'); return i > 0 ? h.slice(0, i) + blk + h.slice(i) : h + blk;
};

async function uploadQRFile(file) {
  const raw = file.size < 1500000 && /image\/(png|jpe?g|webp)/.test(file.type);
  const blob = raw ? file : await resizeImage(file);
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const path = `${S.shop.id}/qr/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

const _settings47 = VIEWS.settings;
VIEWS.settings = pg => {
  _settings47(pg);
  const sh = S.shop, edit = canDo('manage_settings'), host = $('#stf')?.parentElement || pg;
  host.insertAdjacentHTML('beforeend', `<div class="grid2" style="margin-top:16px"><div class="card" id="qrcard"><h3 style="margin-top:0">📱 QR รับชำระเงินของร้าน</h3>
    <p class="muted" style="font-size:13px;margin-top:0">อัปโหลดรูป QR ของคุณเอง (QR แม่มณี / QR บัญชีธนาคาร / QR ร้านค้า) เพื่อแสดงที่หน้าแคชเชียร์ จอลูกค้า และพิมพ์บนบิล</p>
    <div class="cqr-set"><div class="cqr-pv" id="qrpv">${sh.pay_qr_url ? `<img src="${esc(sh.pay_qr_url)}" alt="">` : '<span class="muted">ยังไม่มี QR</span>'}</div>
      <div style="flex:1;min-width:180px">${edit ? `<label class="btn" style="cursor:pointer">📤 อัปโหลดรูป QR<input type="file" id="qrf" accept="image/*" hidden></label>
        ${sh.pay_qr_url ? '<button type="button" class="btn" id="qrdel">🗑 ลบ QR</button>' : ''}` : ''}
        <div class="fg" style="margin-top:8px"><label class="f">ข้อความใต้ QR (เช่น ชื่อบัญชี / ธนาคาร)</label><input class="in" id="qrl" value="${esc(sh.pay_qr_label || '')}" placeholder="เช่น ร้านหมูคุณยาย · กสิกรไทย" ${edit ? '' : 'disabled'}></div></div></div>
    <div class="fg"><label class="f">QR ที่ใช้ตอนลูกค้าเลือก “พร้อมเพย์ / QR”</label>
      <div class="pills" id="qrm"><button type="button" data-q="custom" class="${qrMode() === 'custom' ? 'on' : ''}" ${edit ? '' : 'disabled'}>📱 QR ของร้าน (ที่อัปโหลด)</button><button type="button" data-q="promptpay" class="${qrMode() === 'custom' ? '' : 'on'}" ${edit ? '' : 'disabled'}>⚡ พร้อมเพย์อัตโนมัติ (ใส่ยอดให้)</button></div></div>
    <label class="row"><input type="checkbox" id="qrr" ${sh.qr_on_receipt ? 'checked' : ''} ${edit ? '' : 'disabled'}> พิมพ์ QR ท้ายใบเสร็จ (ลูกค้าสแกนโอนได้ภายหลัง)</label>
    ${edit ? '<button type="button" class="btn p" id="qrsave" style="margin-top:10px">💾 บันทึก QR</button>' : ''}</div>
    <div class="card"><h3 style="margin-top:0">🔊 เสียงทั้งหมด</h3><p class="muted" style="font-size:13px;margin-top:0">เปิด/ปิด เลือกเสียง หรืออัปโหลดเสียงของคุณเองแยกทุกเหตุการณ์ (เพิ่มสินค้า สแกน ลบ ชำระเงิน แจ้งเตือน ฯลฯ) และเสียงพูดยอดเงิน — ตั้งค่าแยกแต่ละเครื่อง</p>
      <button type="button" class="btn p" id="sndopen">🎚️ ตั้งค่าเสียง</button></div></div>`);
  let newUrl = sh.pay_qr_url || '';
  $('#sndopen').onclick = soundSettings;
  if (!edit) return;
  $$('#qrm [data-q]').forEach(b => b.onclick = () => { $$('#qrm [data-q]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#qrf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { $('#qrpv').innerHTML = '<span class="muted">กำลังอัปโหลด…</span>'; newUrl = await uploadQRFile(f);
      $('#qrpv').innerHTML = `<img src="${esc(newUrl)}" alt="">`; $$('#qrm [data-q]').forEach(x => x.classList.toggle('on', x.dataset.q === 'custom'));
      toast('อัปโหลดแล้ว — กด “บันทึก QR”', 'ok'); } catch (er) { fail(er); }
  };
  if ($('#qrdel')) $('#qrdel').onclick = () => { newUrl = ''; $('#qrpv').innerHTML = '<span class="muted">ยังไม่มี QR</span>'; $$('#qrm [data-q]').forEach(x => x.classList.toggle('on', x.dataset.q === 'promptpay')); };
  $('#qrsave').onclick = async () => {
    const mode = $('#qrm [data-q].on')?.dataset.q || 'promptpay';
    if (mode === 'custom' && !newUrl) return toast('กรุณาอัปโหลดรูป QR ก่อน', 'bad');
    try { Object.assign(sh, await q(sb.from('shops').update({ pay_qr_url: newUrl || null, pay_qr_label: $('#qrl').value.trim() || null, qr_mode: mode, qr_on_receipt: $('#qrr').checked }).eq('id', sh.id).select().single()));
      logAct('settings', 'shop', 'QR รับชำระเงิน', { mode }); toast('บันทึก QR แล้ว', 'ok'); } catch (e) { fail(e); }
  };
};

/* ---------- header: branch / shop switcher (v4.7.1 — keeps the page title, rich switcher sheet) ---------- */
const brLogo = s => esc(s?.logo_url || 'logo-round.png');
const brSub = s => esc(s.branch_name || branchLine(s));
const _renderShell47 = renderShell;
renderShell = function () {
  _renderShell47();
  if (!S.shop) return;
  // wide screens: compact pill in the top bar (hidden on smaller screens so the page title always stays visible)
  const br = $('.branch');
  if (br) br.outerHTML = `<button type="button" class="brsw" id="brsw" data-brsw title="สลับสาขา (Alt+B)"><img src="${brLogo(S.shop)}" alt=""><span><b>${esc(S.shop.name)}</b><small>${brSub(S.shop)} · ${ROLE_NAME(S.role)}</small></span><i>▾</i></button>`;
  // phones/tablets: the shop-name line under the page title becomes the switcher
  const sm = $('.top .tt small.mob');
  if (sm) sm.outerHTML = `<button type="button" class="ttsw mob" data-brsw><span>${esc(S.shop.name)}</span>${S.shops.length > 1 ? `<em>${S.shops.length} สาขา</em>` : ''}<i>▾</i></button>`;
  // desktop sidebar: shop name block
  const lg = $('.side .logo'); if (lg) { lg.setAttribute('data-brsw', ''); lg.classList.add('brside'); lg.title = 'สลับสาขา / โปรไฟล์ร้าน'; if (!$('.brcaret', lg)) lg.insertAdjacentHTML('beforeend', '<i class="brcaret">▾</i>'); }
  const sb2 = $('#shopBtn'); if (sb2) sb2.setAttribute('data-brsw', '');
  $$('[data-brsw]').forEach(el => el.onclick = e => { e.preventDefault(); e.stopPropagation(); branchSwitcher(); });
};
window.addEventListener('keydown', e => { if (e.altKey && e.key.toLowerCase() === 'b' && S.shop && !$('.mbg')) { e.preventDefault(); branchSwitcher(); } });
function branchMenu() { branchSwitcher(); }

const recentShops = () => { try { return JSON.parse(localStorage.getItem('pos_shop_recent') || '[]'); } catch { return []; } };
function branchSwitcher() {
  if ($('.mbg.brsheet')) return;
  const cur = S.shop, rec = recentShops();
  const others = S.shops.filter(s => s.id !== cur.id).sort((a, b) => ((rec.indexOf(a.id) + 1 || 99) - (rec.indexOf(b.id) + 1 || 99)) || a.name.localeCompare(b.name, 'th'));
  const card = (s, isCur) => `<div class="brc ${isCur ? 'cur' : ''}" data-sid="${s.id}" data-k="${esc((s.name + ' ' + (s.branch_name || '') + ' ' + (s.branch_code || '') + ' ' + (s.address || '')).toLowerCase())}">
      <img src="${brLogo(s)}" alt=""><div class="brc-b"><b>${esc(s.name)}</b><small>${brSub(s)}${s.branch_code ? ' · รหัส ' + esc(s.branch_code) : ''}</small>
      <div class="brc-m"><span class="chip">${ROLE_NAME(s._role)}</span>${s.phone ? `<span>☎ ${esc(s.phone)}</span>` : ''}</div>
      <div class="brc-s" data-st="${s.id}"><span class="muted">กำลังโหลดยอดวันนี้…</span></div></div>
      ${isCur ? '<span class="brc-on">✓ ใช้งานอยู่</span>' : `<button type="button" class="btn p sm" data-go="${s.id}">สลับ →</button>`}</div>`;
  const m = modal('🏬 สาขา / โปรไฟล์ร้าน', `
    <div class="brsec">ร้านที่ใช้งานอยู่</div>${card(cur, true)}
    ${others.length ? `<div class="brsec">สลับไปสาขาอื่น <small class="muted">(${others.length})</small></div>
      ${others.length > 3 ? '<input class="in" id="brq" placeholder="🔍 ค้นหาสาขา ชื่อ รหัส หรือที่อยู่…" style="margin-bottom:8px">' : ''}
      <div class="brlist">${others.map(s => card(s, false)).join('')}</div>`
      : `<div class="brempty">มีร้านเดียวในบัญชีนี้${can('owner') ? ' — เพิ่มสาขาใหม่ได้ที่ปุ่มด้านล่าง' : ''}</div>`}
    ${S.cart?.length ? `<p class="chip warn" style="margin-top:10px">🛒 มีสินค้าในตะกร้า ${S.cart.length} รายการ — ขายให้เสร็จหรือพักบิลก่อนสลับสาขา</p>` : ''}`,
    { sheet: innerWidth < 700, foot: `${pageOK(PAGES.find(p => p.id === 'branches') || {}) ? '<button type="button" class="btn" id="brman">📊 ทุกสาขา</button>' : ''}${can('owner') ? '<button type="button" class="btn" id="bradd">＋ เพิ่มสาขา</button>' : ''}<span style="flex:1"></span><button type="button" class="btn" data-x2>ปิด</button>` });
  m.classList.add('brsheet');
  $('[data-x2]', m).onclick = () => m.close();
  if ($('#brman', m)) $('#brman', m).onclick = () => { m.close(); go('branches'); };
  if ($('#bradd', m)) $('#bradd', m).onclick = () => { m.close(); go('branches'); setTimeout(() => $('#nb')?.click(), 600); };
  if ($('#brq', m)) $('#brq', m).oninput = e => { const v = e.target.value.trim().toLowerCase(); $$('.brlist .brc', m).forEach(c => c.classList.toggle('hidden', !!v && !c.dataset.k.includes(v))); };
  $$('[data-go]', m).forEach(b => b.onclick = () => { m.close(); switchShop(b.dataset.go); });
  $$('.brlist .brc', m).forEach(c => c.ondblclick = () => { m.close(); switchShop(c.dataset.sid); });
  // today's numbers per branch (only what this account is allowed to see)
  (async () => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    let rows = [];
    try { rows = await q(sb.from('sales').select('shop_id,total,status').in('shop_id', S.shops.map(s => s.id)).gte('created_at', d0.toISOString()).limit(5000)); } catch { rows = null; }
    S.shops.forEach(s => {
      const el = $(`[data-st="${s.id}"]`, m); if (!el) return;
      if (!rows) { el.innerHTML = ''; return; }
      const mine = rows.filter(r => r.shop_id === s.id && r.status !== 'void');
      el.innerHTML = `<span>วันนี้ <b>${baht(mine.reduce((a, r) => a + num(r.total), 0))}</b></span><span>${mine.length} บิล</span>`;
    });
  })();
}
async function switchShop(id) {
  const to = S.shops.find(s => s.id === id); if (!to || id === S.shop.id) return;
  if (S.cart?.length && !(await confirmBox(`มีสินค้าในตะกร้า ${S.cart.length} รายการ — สลับไป “${to.name}” แล้วตะกร้าจะถูกล้าง ดำเนินการต่อ?`))) return;
  const rec = [id, ...recentShops().filter(x => x !== id)].slice(0, 10); localStorage.setItem('pos_shop_recent', JSON.stringify(rec));
  document.body.insertAdjacentHTML('beforeend', `<div class="brswitching"><div><img src="${brLogo(to)}" alt=""><b>กำลังสลับไป</b><span>${esc(to.name)}</span><small>${brSub(to)}</small><i></i></div></div>`);
  sfx('ok'); localStorage.setItem('pos_shop', id); S.cart = []; S.customer = null;
  const page = S.page;
  try { await boot(); if (page && PAGES.find(p => p.id === page && pageOK(p))) go(page); toast('✓ ใช้งาน ' + to.name, 'ok'); }
  finally { setTimeout(() => $('.brswitching')?.remove(), 350); }
}

/* ---------- sound settings: every event, tone choice, custom sound files, voice ---------- */
const SND_EVENTS = [
  ['add', '➕ เพิ่มสินค้าลงตะกร้า', 'beep'], ['scan', '📷 สแกนบาร์โค้ด', 'scanner'], ['remove', '➖ ลบ / ลดจำนวน', 'low'],
  ['error', '⚠️ ผิดพลาด / ไม่พบสินค้า', 'buzz'], ['ok', '✅ บันทึกสำเร็จ', 'chime'], ['pay', '💰 ชำระเงินเสร็จ', 'register'],
  ['qr', '📱 แสดง QR ให้ลูกค้าสแกน', 'ding'], ['hold', '⏸️ พักบิล', 'pop'], ['notify', '🔔 แจ้งเตือน / ข้อความ', 'bell']];
const SND_TONES = { beep: 'บี๊บ', scanner: 'เครื่องสแกน', low: 'ต่ำสั้น', buzz: 'เตือน (หึ่ง)', chime: 'ติ๊ง-ต่อง', register: 'ลิ้นชักเก็บเงิน + เหรียญ',
  ding: 'ดิ๊ง', pop: 'ป๊อป', bell: 'กระดิ่ง', click: 'คลิก', coin: 'เหรียญ', soft: 'นุ่ม ๆ', double: 'บี๊บคู่', success: 'สำเร็จ (3 โน้ต)', custom: '🎵 ไฟล์เสียงของฉัน' };
const SND_DEF = { events: {}, voice: { total: true, change: true, thanks: true, thanksText: 'ขอบคุณค่ะ', rate: 1, pitch: 1, name: '' } };
let SND = (() => { try { return { ...SND_DEF, ...JSON.parse(localStorage.getItem('pos_sound') || '{}') }; } catch { return { ...SND_DEF }; } })();
SND.voice = { ...SND_DEF.voice, ...(SND.voice || {}) };
const sndEv = k => ({ on: true, tone: SND_EVENTS.find(e => e[0] === k)?.[2] || 'beep', vol: 1, ...(SND.events[k] || {}) });
const saveSnd = () => { try { localStorage.setItem('pos_sound', JSON.stringify(SND)); } catch { toast('ไฟล์เสียงใหญ่เกินไป — ใช้ไฟล์สั้นกว่านี้', 'bad'); } };
const SND_FILES = {}; // event -> data URL (stored separately)
const sndFile = k => SND_FILES[k] ??= localStorage.getItem('pos_sound_file_' + k) || '';

function playTone(name, vol) {
  AC ||= new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
  const t0 = AC.currentTime;
  const tone = (f, s, d, type = 'sine', g = 0.25) => { const o = AC.createOscillator(), a = AC.createGain(); o.type = type; o.frequency.value = f;
    a.gain.setValueAtTime(0, t0 + s); a.gain.linearRampToValueAtTime(g * vol, t0 + s + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d); o.connect(a).connect(AC.destination); o.start(t0 + s); o.stop(t0 + s + d + 0.05); };
  switch (name) {
    case 'beep': tone(1046, 0, 0.09, 'triangle'); break;
    case 'scanner': tone(1568, 0, 0.12, 'square', 0.12); break;
    case 'low': tone(523, 0, 0.1, 'triangle'); break;
    case 'buzz': tone(220, 0, 0.18, 'sawtooth', 0.15); tone(180, 0.16, 0.25, 'sawtooth', 0.15); break;
    case 'chime': tone(880, 0, 0.1); tone(1318, 0.08, 0.18); break;
    case 'register': tone(2093, 0, 0.5, 'sine', 0.3); tone(2637, 0.06, 0.6, 'sine', 0.22); tone(3136, 0.12, 0.7, 'sine', 0.15);
      for (let k = 0; k < 5; k++) tone(4000 + Math.random() * 2000, 0.25 + k * 0.05, 0.05, 'square', 0.04); break;
    case 'ding': tone(1760, 0, 0.5, 'sine', 0.3); break;
    case 'pop': tone(600, 0, 0.06, 'sine', 0.35); tone(900, 0.03, 0.05, 'sine', 0.2); break;
    case 'bell': tone(1318, 0, 0.6, 'sine', 0.25); tone(1976, 0, 0.5, 'sine', 0.12); tone(1318, 0.25, 0.6, 'sine', 0.2); break;
    case 'click': tone(3000, 0, 0.02, 'square', 0.15); break;
    case 'coin': tone(1976, 0, 0.08, 'square', 0.12); tone(2637, 0.08, 0.3, 'square', 0.12); break;
    case 'soft': tone(660, 0, 0.25, 'sine', 0.18); break;
    case 'double': tone(1200, 0, 0.07, 'square', 0.12); tone(1200, 0.12, 0.07, 'square', 0.12); break;
    case 'success': tone(784, 0, 0.12); tone(988, 0.1, 0.12); tone(1318, 0.2, 0.25); break;
  }
}
sfx = function (kind, force) {
  if (!VIEWP.sound && !force) return;
  const ev = sndEv(kind); if (!ev.on && !force) return;
  const vol = (VIEWP.vol ?? 0.6) * (ev.vol ?? 1);
  try {
    if (ev.tone === 'custom' && sndFile(kind)) { const a = new Audio(sndFile(kind)); a.volume = Math.min(1, vol); a.play().catch(() => {}); return; }
    playTone(ev.tone === 'custom' ? 'beep' : ev.tone, vol);
  } catch (e) { /* audio not available */ }
};
say = function (text, force) {
  if ((!VIEWP.voice && !force) || !('speechSynthesis' in window)) return;
  const v = SND.voice, s = String(text);
  const kind = /^(ยอดชำระ|Total)/.test(s) ? 'total' : /^(เงินทอน|Change)/.test(s) ? 'change' : 'thanks';
  if (!force && v[kind] === false) return;
  if (kind === 'thanks' && /^(ขอบคุณค่ะ|Thank you)/.test(s) && v.thanksText) text = v.thanksText;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG === 'th' ? 'th-TH' : 'en-US'; u.rate = v.rate || 1; u.pitch = v.pitch || 1; u.volume = VIEWP.vol ?? 0.6;
    const vs = speechSynthesis.getVoices(); const vv = (v.name && vs.find(x => x.name === v.name)) || vs.find(x => x.lang.startsWith(LANG === 'th' ? 'th' : 'en')); if (vv) u.voice = vv;
    speechSynthesis.speak(u);
    if (kind === 'change' && v.thanks && v.thanksAfterChange) { const u2 = new SpeechSynthesisUtterance(v.thanksText || 'ขอบคุณค่ะ'); Object.assign(u2, { lang: u.lang, rate: u.rate, pitch: u.pitch, volume: u.volume, voice: u.voice }); speechSynthesis.speak(u2); }
  } catch (e) { /* no voice */ }
};
// extra events: hold bill, notifications bell
document.addEventListener('click', e => { if (e.target.closest('#holdBtn:not([disabled])')) sfx('hold'); }, true);
{ const _refreshBell47 = refreshBell; let lastN = null;
  refreshBell = async function () { await _refreshBell47(); const n = num($('#bellN')?.textContent); if (lastN !== null && n > lastN) sfx('notify'); lastN = n; }; }

function soundSettings() {
  const vs = ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter(v => /^(th|en)/.test(v.lang)) : [];
  const v = SND.voice;
  const m = modal('🔊 ตั้งค่าเสียงทั้งหมด', `
    <div class="snd-top"><label class="row"><input type="checkbox" id="sdon" ${VIEWP.sound ? 'checked' : ''}> <b>เปิดเสียงเอฟเฟกต์</b></label>
      <label class="row"><input type="checkbox" id="svon" ${VIEWP.voice ? 'checked' : ''}> <b>🗣️ เปิดเสียงพูด</b></label>
      <div class="snd-vol"><span>🔈</span><input type="range" id="sdvol" min="0" max="1" step="0.05" value="${VIEWP.vol ?? 0.6}"><span>🔊</span><b id="sdvv">${Math.round((VIEWP.vol ?? 0.6) * 100)}%</b></div></div>
    <h4 style="margin:14px 0 6px">เสียงแต่ละเหตุการณ์</h4>
    <div class="snd-list">${SND_EVENTS.map(([k, label]) => { const ev = sndEv(k); return `<div class="snd-row" data-ev="${k}">
      <label class="row snd-n"><input type="checkbox" data-on ${ev.on ? 'checked' : ''}> ${label}</label>
      <select class="in" data-tone>${Object.entries(SND_TONES).map(([t, n]) => `<option value="${t}" ${ev.tone === t ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <input type="range" data-vol min="0" max="1.5" step="0.1" value="${ev.vol ?? 1}" title="ความดังเฉพาะเสียงนี้">
      <label class="btn sm snd-up ${ev.tone === 'custom' ? '' : 'hidden'}" title="อัปโหลดไฟล์เสียง (mp3/wav/ogg ไม่เกิน 300KB)">📤<input type="file" accept="audio/*" data-file hidden></label>
      <button type="button" class="btn sm" data-play>▶</button></div>`; }).join('')}</div>
    <h4 style="margin:16px 0 6px">🗣️ เสียงพูด</h4>
    <div class="snd-voice">
      <label class="row"><input type="checkbox" id="sv_total" ${v.total ? 'checked' : ''}> พูดยอดชำระ</label>
      <label class="row"><input type="checkbox" id="sv_change" ${v.change ? 'checked' : ''}> พูดเงินทอน</label>
      <label class="row"><input type="checkbox" id="sv_thanks" ${v.thanks ? 'checked' : ''}> พูดขอบคุณ</label>
      <label class="row"><input type="checkbox" id="sv_tac" ${v.thanksAfterChange ? 'checked' : ''}> พูดขอบคุณต่อท้ายเงินทอน</label></div>
    <div class="grid2"><div class="fg"><label class="f">คำขอบคุณ</label><input class="in" id="sv_text" value="${esc(v.thanksText || '')}" placeholder="ขอบคุณค่ะ"></div>
      <div class="fg"><label class="f">เสียงผู้พูด</label><select class="in" id="sv_name"><option value="">อัตโนมัติ</option>${vs.map(x => `<option value="${esc(x.name)}" ${x.name === v.name ? 'selected' : ''}>${esc(x.name)} (${x.lang})</option>`).join('')}</select></div>
      <div class="fg"><label class="f">ความเร็วพูด: <b id="svrv">${v.rate}</b></label><input type="range" id="sv_rate" min="0.5" max="1.8" step="0.1" value="${v.rate}" style="width:100%"></div>
      <div class="fg"><label class="f">ระดับเสียง (สูง/ต่ำ): <b id="svpv">${v.pitch}</b></label><input type="range" id="sv_pitch" min="0.5" max="1.8" step="0.1" value="${v.pitch}" style="width:100%"></div></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="svt1">▶ ทดสอบยอดชำระ</button><button type="button" class="btn sm" id="svt2">▶ ทดสอบเงินทอน</button><button type="button" class="btn sm" id="svt3">▶ ทดสอบขอบคุณ</button></div>
    <p class="muted" style="font-size:12px">การตั้งค่าเสียงบันทึกไว้ในเครื่องนี้ (แต่ละเครื่อง/แคชเชียร์ตั้งต่างกันได้)</p>`,
    { foot: `<button type="button" class="btn" id="sdreset">ค่าเริ่มต้น</button><span style="flex:1"></span><button type="button" class="btn p" data-ok>เสร็จ</button>` });
  m.classList?.add('snd-modal');
  const upd = () => {
    VIEWP.sound = $('#sdon', m).checked; VIEWP.voice = $('#svon', m).checked; VIEWP.vol = +$('#sdvol', m).value;
    localStorage.setItem('pos_view', JSON.stringify(VIEWP)); $('#sdvv', m).textContent = Math.round(VIEWP.vol * 100) + '%';
    $$('.snd-row', m).forEach(r => { const k = r.dataset.ev, tone = $('[data-tone]', r).value;
      SND.events[k] = { on: $('[data-on]', r).checked, tone, vol: +$('[data-vol]', r).value }; $('.snd-up', r).classList.toggle('hidden', tone !== 'custom'); });
    Object.assign(SND.voice, { total: $('#sv_total', m).checked, change: $('#sv_change', m).checked, thanks: $('#sv_thanks', m).checked, thanksAfterChange: $('#sv_tac', m).checked,
      thanksText: $('#sv_text', m).value.trim(), name: $('#sv_name', m).value, rate: +$('#sv_rate', m).value, pitch: +$('#sv_pitch', m).value });
    $('#svrv', m).textContent = SND.voice.rate; $('#svpv', m).textContent = SND.voice.pitch; saveSnd();
  };
  $$('input:not([type=file]),select', m).forEach(el => el.oninput = el.onchange = upd);
  $$('.snd-row', m).forEach(r => {
    const k = r.dataset.ev;
    $('[data-play]', r).onclick = () => { upd(); sfx(k, true); };
    $('[data-tone]', r).addEventListener('change', () => { if ($('[data-tone]', r).value !== 'custom') sfx(k, true); else if (!sndFile(k)) $('[data-file]', r).click(); });
    $('[data-file]', r).onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 300000) return toast('ไฟล์เสียงต้องไม่เกิน 300KB (ตัดให้สั้น 1–3 วินาที)', 'bad');
      const rd = new FileReader(); rd.onload = () => {
        try { localStorage.setItem('pos_sound_file_' + k, rd.result); SND_FILES[k] = rd.result; upd(); sfx(k, true); toast('ใช้เสียงของคุณแล้ว', 'ok'); }
        catch { toast('พื้นที่เก็บเสียงเต็ม — ลบเสียงอื่นหรือใช้ไฟล์เล็กลง', 'bad'); } };
      rd.readAsDataURL(f);
    };
  });
  $('#svt1', m).onclick = () => { upd(); say('ยอดชำระ ' + bahtWords(125), true); };
  $('#svt2', m).onclick = () => { upd(); say('เงินทอน ' + bahtWords(75), true); };
  $('#svt3', m).onclick = () => { upd(); say('ขอบคุณค่ะ', true); };
  $('#sdreset', m).onclick = async () => {
    if (!(await confirmBox('คืนค่าเสียงทั้งหมดเป็นค่าเริ่มต้น?'))) return;
    SND = JSON.parse(JSON.stringify(SND_DEF)); SND_EVENTS.forEach(([k]) => { localStorage.removeItem('pos_sound_file_' + k); delete SND_FILES[k]; });
    saveSnd(); m.close(); soundSettings();
  };
  $('[data-ok]', m).onclick = m.close;
}
// voices load asynchronously in some browsers
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

/* the sell-screen display settings get a shortcut to the full sound settings */
const _viewSettings47 = viewSettings;
viewSettings = function () {
  _viewSettings47();
  const t = $('#vtest'); if (t && !$('#vsadv')) t.insertAdjacentHTML('afterend', '<button class="btn sm p" id="vsadv" type="button">🎚️ ตั้งค่าเสียงแบบละเอียด</button>');
  if ($('#vsadv')) $('#vsadv').onclick = () => { $$('.mbg').pop()?.querySelector('[data-ok]')?.click(); soundSettings(); };
};
