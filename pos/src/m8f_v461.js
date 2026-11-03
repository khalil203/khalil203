/* ================= v4.6.1 — cashier tools bar on the sell screen (personal use, daily summary, quick sale, held bills) ================= */
const _posView461 = VIEWS.pos;
VIEWS.pos = pg => {
  _posView461(pg);
  ['#puBtn', '#custBtn'].forEach(s => $(s)?.remove()); $('#dsBtn')?.remove();
  const left = pg.querySelector('.pos .left'); if (!left || $('#cashbar')) return;
  const stats = $('#posStats', left);
  (stats || left.firstElementChild).insertAdjacentHTML('afterend', `<div class="cashbar" id="cashbar">
    <button data-c="pu"><span>🙋</span>เบิกใช้ส่วนตัว</button><button data-c="ds"><span>📊</span>สรุปยอดวันนี้</button>
    <button data-c="quick"><span>➕</span>ขายด่วน</button><button data-c="held"><span>📂</span>บิลที่พัก <b id="cbHeld">${S.held.length || ''}</b></button>
    <button data-c="last"><span>🧾</span>บิลล่าสุด</button></div>`);
  $$('#cashbar [data-c]').forEach(b => b.onclick = () => ({ pu: personalUse, ds: () => dailySummary(), quick: customItem, held: showHeld, last: () => $('#lastBtn')?.click() })[b.dataset.c]());
};
const _drawCart461 = drawCart;
drawCart = function () { _drawCart461(); const h = $('#cbHeld'); if (h) h.textContent = S.held.length || ''; };
