import { app, globalShortcut } from 'electron'
import { initIpcEvents } from '../events/listeners'
import { initSettings } from '../settings/settings';
import { createAppWindows, APP_WINDOW_NAMES, getAppWindow, getAllAppWindowsArray } from '../browserWindows/browserWindows';
import { initTray } from '../tray/tray';

let isQuitting = false

export function setupApp() {
  // Handle creating/removing shortcuts on Windows when installing/uninstalling.
  if (require('electron-squirrel-startup')) {
    app.quit();
  }

    app.allowRendererProcessReuse = false
    const gotTheLock = app.requestSingleInstanceLock()
      
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', onSecondInstance)
    app.whenReady().then(() => start())
    
    setupAppEventListeners()
  }
}

function onSecondInstance() {
  const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)

  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    mainWindow.show()
    mainWindow.restore()
    mainWindow.focus()
  }
}

async function start() {
  // Create window browsers, load the rest of the app, etc...
  createAppWindows()
  await initSettings()
  initIpcEvents()
  initTray()
}

function setupAppEventListeners() {
  app.on('browser-window-created', (_, window) => {
    require("@electron/remote/main").enable(window.webContents)
  })

  app.on('before-quit', () => {
    setIsQuitting(true);
  })

  app.on('will-quit', () => {
    const windows = getAllAppWindowsArray()

    globalShortcut.unregisterAll()
    windows.forEach(window => window.destroy())
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    
    if (BrowserWindow.getAllWindows().length === 0) {
      createAppWindows();
    }
  });
}

export function setIsQuitting(value) {
  isQuitting = value
}

export function isAppQuitting() {
  return isQuitting
}
