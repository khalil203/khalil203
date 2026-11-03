// Shop POS desktop wrapper: opens the live web app, so every update on GitHub Pages reaches the app automatically.
const { app, BrowserWindow, shell, Menu, session } = require('electron');
const APP_URL = 'https://khalil203.github.io/khalil203/pos/';
const ORIGIN = new URL(APP_URL).origin;

if (!app.requestSingleInstanceLock()) app.quit();

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 360, minHeight: 560, backgroundColor: '#f3f4fa', title: 'Yanisa Shop', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  win.webContents.setUserAgent(win.webContents.getUserAgent() + ' ShopPOSApp/' + app.getVersion());
  // camera for barcode scanning, serial for scales, notifications
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(['media', 'notifications', 'clipboard-sanitized-write', 'fullscreen', 'serial'].includes(perm)));
  session.defaultSession.setDevicePermissionHandler(() => true);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(ORIGIN)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } }; // customer display window
    shell.openExternal(url); return { action: 'deny' };
  });
  win.webContents.on('did-fail-load', () => setTimeout(() => win.loadURL(APP_URL), 4000)); // offline at start: retry
  win.loadURL(APP_URL);
  return win;
}

const template = [
  { label: 'Yanisa Shop', submenu: [
    { label: 'Reload / update', accelerator: 'CmdOrCtrl+R', click: (_, w) => w && w.webContents.reloadIgnoringCache() },
    { role: 'togglefullscreen' }, { type: 'separator' },
    { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }, { type: 'separator' },
    { role: 'toggleDevTools' }, { role: 'quit' }] },
  { role: 'editMenu' },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
