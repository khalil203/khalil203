/* ================= v5.0.5 — no surprise keyboard on touch screens ================= */
(() => {
  const touch = matchMedia('(hover:none) and (pointer:coarse)').matches || (navigator.maxTouchPoints > 0 && matchMedia('(max-width:1366px)').matches);
  if (!touch) return;
  let tapEl = null, tapAt = 0, keyAt = 0;
  addEventListener('pointerdown', e => { tapEl = e.target; tapAt = Date.now(); }, true);
  addEventListener('keydown', () => { keyAt = Date.now(); }, true);
  const TYPING = 'input:not([data-scan]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]):not([type=file]):not([type=date]):not([type=time]),textarea,[contenteditable=true]';
  const of = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (o) {
    if (this.matches?.(TYPING)) {
      const tappedIt = tapEl && (tapEl === this || this.contains(tapEl) || tapEl.closest?.('label')?.control === this) && Date.now() - tapAt < 1500;
      const typing = Date.now() - keyAt < 1500; // hardware keyboard / barcode scanner
      if (!tappedIt && !typing) return; // the user did not ask for the keyboard
    }
    return of.call(this, o);
  };
  // strip autofocus from anything that appears later (dialogs, pages)
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.hasAttribute?.('autofocus')) n.removeAttribute('autofocus'); n.querySelectorAll?.('[autofocus]').forEach(x => x.removeAttribute('autofocus')); })))
    .observe(document.documentElement, { childList: true, subtree: true });
})();
