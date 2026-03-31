const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, shell } = require('electron');

const isDev = !app.isPackaged;
const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173';
const serverPort = process.env.PORT || '3001';

let mainWindow = null;
let embeddedServer = null;

function getAppIcon() {
  if (isDev) {
    return path.join(__dirname, '..', 'build', 'icon.ico');
  }

  return path.join(app.getAppPath(), 'build', 'icon.ico');
}

function getServerEntry() {
  if (isDev) {
    return path.join(__dirname, '..', 'server', 'index.js');
  }

  return path.join(app.getAppPath(), 'server', 'index.js');
}

async function startEmbeddedServer() {
  if (embeddedServer) return embeddedServer;

  // If something is already listening on our port (e.g. a leftover dev server
  // or a previous instance), skip starting the embedded server and reuse the
  // existing one instead of crashing the whole app with EADDRINUSE.
  const isPortFree = await checkPortAvailable(serverPort);
  if (!isPortFree) {
    console.warn(`Port ${serverPort} already in use — reusing existing server, embedded server not started.`);
    return null;
  }

  const serverEntry = getServerEntry();
  const moduleUrl = pathToFileURL(serverEntry).href;
  const serverModule = await import(moduleUrl);
  embeddedServer = serverModule.startServer(serverPort);
  return embeddedServer;
}

// Returns true if the given TCP port is free to bind, false otherwise.
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = require('net').createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => tester.close(() => resolve(true)));
    tester.listen(port);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 825,
    minWidth: 1200,
    minHeight: 825,
    title: 'GitM',
    icon: getAppIcon(),
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
      spellcheck: false,
    },
  });

  // Open external links in the user's browser, not inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    await mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
}

app.whenReady().then(async () => {
  try {
    await startEmbeddedServer();
  } catch (error) {
    console.error('Failed to start embedded server:', error);
  }
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