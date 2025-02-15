import { ipcMain, app, globalShortcut } from 'electron'
import {
  onDisplayToastRequest,
  onGetSettingRequest,
  onSetSettingRequest,
  onRestartSettingsRequest,
  onGetPrimaryDisplayIdRequest,
  onRequestAppExit,
  onSendBalanceToStickyTimersRequest,
  onGetLatestUpdateInfoRequest,
  onShowMainWindowRequest,
  onOpenDirectoryDialogRequest,
  onDrawBalanceRequest,
  onDrawScoreNumbersRequest,
  onCtObserverRegisterRequest,
  onCtObserverUnregisterRequest,
  onCtObserverSubscribeRequest,
  onCtObserverUnsubscribeRequest,
  onCtObserverSendMessageRequest,
} from './ipcEventHandlers'
import { APP_WINDOW_NAMES, getAppWindow } from '../browserWindows/browserWindows'
import { OverlayController } from 'electron-overlay-window'

export function initIpcEvents() {
  ipcMain.on('user-data-path-request', () => {
    const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)
    globalShortcut.register('Alt+.', showOverlay)
    globalShortcut.register('Alt+,', focusOverlay)


    mainWindow.webContents.send('user-data-path-request-response', {
      appDataPath: app.getPath('userData'),
      appFolderPath: app.getAppPath(),
    })
  })

  ipcMain.handle('get-latest-update-info', async () => {
    const info = await onGetLatestUpdateInfoRequest()

    return info
  })

  ipcMain.handle('open-directory-dialog', async () => {
    const path = await onOpenDirectoryDialogRequest();
    return path
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

  ipcMain.on('draw-balance-request', (event, arg) => {
    onDrawBalanceRequest(event, arg);
  })

  ipcMain.on('draw-score-numbers-request', (event, arg) => {
    onDrawScoreNumbersRequest(event, arg);
  })

  ipcMain.handle('get-primary-display-id-request', async (event, arg) => {
    const displayId = await onGetPrimaryDisplayIdRequest()
    return displayId
  })

  ipcMain.on('show-overlay-request', () => {
    const overlayWindow = getAppWindow(APP_WINDOW_NAMES.OVERLAY)
    
    // if mainWindow is passed, then mainWindow is displayed - might be useful
    OverlayController.attachByTitle(
      overlayWindow,
      process.platform === 'darwin' ? 'Untitled' : "Tony Hawk's Underground 2",
      { hasTitleBarOnMac: true }
    )
  })

  ipcMain.on('send-balance-to-sticky-timers', (event, arg) => {
    onSendBalanceToStickyTimersRequest(event, arg)
  })

  ipcMain.on('show-main-window-request', () => {
    onShowMainWindowRequest()
  })

  ipcMain.handle('request-ct-observer-register', async (event, arg) => {
    const status = await onCtObserverRegisterRequest(arg)

    return status
  })

  ipcMain.handle('request-ct-observer-unregister', async (event, arg) => {
    const status = await onCtObserverUnregisterRequest()

    return status
  })

  ipcMain.handle('request-ct-observer-subscribe', async (event, arg) => {
    const status = await onCtObserverSubscribeRequest(arg)

    return status;
  })

  ipcMain.handle('request-ct-observer-unsubscribe', async (event, arg) => {
    const status = await onCtObserverUnsubscribeRequest()

    return status;
  })

  ipcMain.on('request-ct-observer-send-message', (event, arg) => {
    onCtObserverSendMessageRequest(arg);
  })
}

function showOverlay() {
  const overlayWindow = getAppWindow(APP_WINDOW_NAMES.OVERLAY)
    
  // if mainWindow is passed, then mainWindow is displayed - might be useful
  OverlayController.attachByTitle(
    overlayWindow,
    process.platform === 'darwin' ? 'Untitled' : "THUG Pro",
    { hasTitleBarOnMac: true }
  )
}

function focusOverlay() {
  OverlayController.focusTarget();
  OverlayController.activateOverlay();
}
