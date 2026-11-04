/* ================= v5.0.2 — phone sizing pass + ignore stale-page DOM errors ================= */
fail = function (e) {
  const msg = e?.message || String(e);
  // a page that was still loading when the user navigated away tries to write into removed elements — harmless
  if (/of null \(|is null|reading 'innerHTML'|setting 'innerHTML'/.test(msg)) { console.warn('stale view update ignored:', msg); return; }
  console.error(e); toast(msg, 'bad');
};
