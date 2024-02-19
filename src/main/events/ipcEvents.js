import { ipcMain, app } from 'electron'
import {
  onDisplayToastRequest,
  onGetSettingRequest,
  onSetSettingRequest,
  onRestartSettingsRequest,
  onHostServerRequest,
  onConnectToServerRequest,
  onSendWsClientMessageRequest,
  onSendWsServerMessageRequest,
  onShutdownServerRequest,
  onDisconnectFromServerRequest,
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

  ipcMain.on('host-server-request', (event, arg) => {
    onHostServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('connect-to-server-request', (event, arg) => {
    console.log('connecting to server')
    onConnectToServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('shutdown-server-request', (event, arg) => {
    onShutdownServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('disconnect-from-server-request', (event, arg) => {
    console.log('disconnecting from server')
    onDisconnectFromServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('send-ws-client-message', (event, arg) => {
    onSendWsClientMessageRequest(event, arg, mainWindow)
  })

  ipcMain.on('send-ws-server-message', (event, arg) => {
    onSendWsServerMessageRequest(event, arg, mainWindow)
  })

  ipcMain.on('request-app-exit', () => {
    app.quit()
  })
}
