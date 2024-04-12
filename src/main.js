import { app, globalShortcut } from 'electron'
import { initIpcEvents } from './main/events/ipcEvents'
import { createAppWindows } from './main/browserWindows/browserWindows'
import { initSettings } from './main/settings/settings'
import { shutdownServer } from './main/onlineCT/wsServer/wsServer'
import { initialize } from '@electron/remote/main';

initialize()

let mainWindow
let toastWindow
let overlayWindow

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// app.allowRendererProcessReuse = false
// const gotTheLock = app.requestSingleInstanceLock()
    
// if (!gotTheLock) {
//   app.quit()
// } else {
//   app.on('second-instance', (event, commandLine, workingDirectory) => {
//     // Someone tried to run a second instance, we should focus our window.
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) {
//         mainWindow.restore()
//       }
//       mainWindow.focus()
//     }
//   })
  
  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(async () => {
    ({
      mainWindow,
      toastWindow,
      overlayWindow,
    } = createAppWindows())

    await initSettings(mainWindow, toastWindow)
    initIpcEvents(mainWindow, toastWindow, overlayWindow)

    mainWindow.on('close', () => {
      toastWindow.close()
      overlayWindow.close()
    })
  })
// }

app.on('browser-window-created', (_, window) => {
  require("@electron/remote/main").enable(window.webContents)
})

app.on('will-quit', () => {
  shutdownServer();
  globalShortcut.unregisterAll()
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
    createWindow();
  }
});
