import { ipcMain, app } from 'electron'
import {
  onDisplayToastRequest,
  onGetSettingRequest,
  onSetSettingRequest,
  onRestartSettingsRequest,
} from './ipcEventHandlers'

export function initIpcEvents(mainWindow, toastWindow) {
  ipcMain.on('user-data-path-request', () => {
    mainWindow.webContents.send('user-data-path-request-response', {
      appDataPath: app.getPath('userData'),
      appFolderPath: app.getAppPath(),
    })
  })

  ipcMain.on('display-toast-request', async (event, arg) => {
    await onDisplayToastRequest(event, arg, toastWindow)
  })

  ipcMain.on('get-setting-request', async (event, arg) => {
    await onGetSettingRequest(event, arg, mainWindow)
  })

  ipcMain.on('set-setting-request', async (event, arg) => {
    await onSetSettingRequest(event, arg, mainWindow)
  })

  ipcMain.on('request-settings-restart', async () => {
    await onRestartSettingsRequest(mainWindow)
  })

  ipcMain.on('request-app-minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('request-app-fullscreen', () => {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  })

  ipcMain.on('request-app-exit', () => {
    app.quit()
  })
}
