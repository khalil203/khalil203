/* ================= start ================= */
updateNet();
boot().then(() => { updateNet(); syncQueue(); }).catch(e => { fail(e); renderAuth(); });
