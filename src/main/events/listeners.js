import { ipcMain, app } from 'electron'
import {
  onDisplayToastRequest,
  onGetSettingRequest,
  onSetSettingRequest,
  onRestartSettingsRequest,
  onGetPrimaryDisplayIdRequest,
  onRequestAppExit,
  onSendBalanceToStickyTimersRequest,
  onGetLatestUpdateInfoRequest,
  onShowMainWindowRequest
} from './ipcEventHandlers'
import { APP_WINDOW_NAMES, getAppWindow } from '../browserWindows/browserWindows'
// import { OverlayController } from 'electron-overlay-window'

export function initIpcEvents() {
  ipcMain.on('user-data-path-request', () => {
    const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)

    mainWindow.webContents.send('user-data-path-request-response', {
      appDataPath: app.getPath('userData'),
      appFolderPath: app.getAppPath(),
    })
  })

  ipcMain.handle('get-latest-update-info', async () => {
    const info = await onGetLatestUpdateInfoRequest()

    return info
  })

  ipcMain.on('display-toast-request', async (event, arg) => {
    await onDisplayToastRequest(event, arg)
  })

  ipcMain.on('get-setting-request', async (event, arg) => {
    await onGetSettingRequest(event, arg)
  })

  ipcMain.on('set-setting-request', async (event, arg) => {
    onSetSettingRequest(event, arg)
  })

  ipcMain.on('request-settings-restart', async () => {
    await onRestartSettingsRequest()
  })

  ipcMain.on('request-app-minimize', () => {
    const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)
    mainWindow.minimize()
  })

  ipcMain.on('request-app-fullscreen', () => {
    const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  })

  ipcMain.on('request-app-exit', (event, arg) => {
    onRequestAppExit(event, arg)
  })

  ipcMain.handle('get-primary-display-id-request', async (event, arg) => {
    const displayId = await onGetPrimaryDisplayIdRequest()
    return displayId
  })

  ipcMain.on('host-server-request', (event, arg) => {
    // onHostServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('connect-to-server-request', (event, arg) => {
    console.log('connecting to server')
    // onConnectToServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('shutdown-server-request', (event, arg) => {
    // onShutdownServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('disconnect-from-server-request', (event, arg) => {
    console.log('disconnecting from server')
    // onDisconnectFromServerRequest(event, arg, mainWindow);
  });

  ipcMain.on('send-ws-client-message', (event, arg) => {
    // onSendWsClientMessageRequest(event, arg, mainWindow)
  })

  ipcMain.on('send-ws-server-message', (event, arg) => {
    // onSendWsServerMessageRequest(event, arg, mainWindow)
  })

  // ipcMain.on('show-overlay-request', () => {
  //   OverlayController.attachByTitle(
  //     overlayWindow,
  //     process.platform === 'darwin' ? 'Untitled' : 'THUG Pro',
  //     { hasTitleBarOnMac: true }
  //   )
  // })

  ipcMain.on('send-balance-to-sticky-timers', (event, arg) => {
    onSendBalanceToStickyTimersRequest(event, arg)
  })

  ipcMain.on('show-main-window-request', () => {
    onShowMainWindowRequest()
  })
}
