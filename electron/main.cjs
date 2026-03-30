const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow } = require('electron');

const isDev = !app.isPackaged;
const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173';
const serverPort = process.env.PORT || '3001';

let mainWindow = null;
let embeddedServer = null;

function getServerEntry() {
  if (isDev) {
    return path.join(__dirname, '..', 'server', 'index.js');
  }

  return path.join(app.getAppPath(), 'server', 'index.js');
}

async function startEmbeddedServer() {
  if (embeddedServer) return embeddedServer;

  const serverEntry = getServerEntry();
  const moduleUrl = pathToFileURL(serverEntry).href;
  const serverModule = await import(moduleUrl);
  embeddedServer = serverModule.startServer(serverPort);
  return embeddedServer;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 825,
    minWidth: 1200,
    minHeight: 825,
    title: 'GitM',
    backgroundColor: '#0c141d',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#8fa1b3',
      height: 48,
    },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    await mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
}

app.whenReady().then(async () => {
  await startEmbeddedServer();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (embeddedServer) {
    embeddedServer.close();
    embeddedServer = null;
  }
});
