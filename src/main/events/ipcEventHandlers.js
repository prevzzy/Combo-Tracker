import { TOASTS_CONFIG } from '../utils/constants'
import { getSetting, setSetting, restoreDefaultSettings } from '../settings/settings'
import { SETTINGS_STRINGS } from '../settings/defaultSettings'
import { isToastTypeSettingsDependant } from './utils'
import { TOAST_EVENT_TYPES } from './toastEventTypes'
import { getPrimaryDisplayId } from '../desktopCapture/desktopCapture'
import { app } from 'electron'
import { APP_WINDOW_NAMES, getAllAppWindowsArray, getAppWindow } from '../browserWindows/browserWindows'

let toastClosingTimeoutId
let currentlyDisplayedHighscores

function hideToastAfterTimeout() {
  toastClosingTimeoutId = setTimeout(() => {
    hideToast()
  }, TOASTS_CONFIG.CLOSE_TIMEOUT)
}

function hideToast() {
  const toastWindow = getAppWindow(APP_WINDOW_NAMES.TOAST)
  toastWindow.webContents.send('hide-toast', toastWindow.getBounds().width)

  setTimeout(() => {
    if (toastWindow.isVisible()) {
      toastWindow.hide()
      currentlyDisplayedHighscores = undefined
    }
  }, 200)
}

export async function onDisplayToastRequest(event, arg) {
  const toastWindow = getAppWindow(APP_WINDOW_NAMES.TOAST)

  if (isToastTypeSettingsDependant(arg.toastEventType)) {
    const shouldShowToast = await getSetting(SETTINGS_STRINGS.ENABLE_TOASTS)

    if (!shouldShowToast) {
      return
    }
  }

  if (arg.toastEventType === TOAST_EVENT_TYPES.NEW_BEST_SCORE) {
    const allHighscoresPeekHotkey = await getSetting(SETTINGS_STRINGS.ALL_TOP_SCORES_HOTKEY)
    const mapHighscoresPeekHotkey = await getSetting(SETTINGS_STRINGS.MAP_TOP_SCORES_HOTKEY)

    arg.payload = {
      ...arg.payload,
      allHighscoresPeekHotkey,
      mapHighscoresPeekHotkey,
    }
  }

  if (!toastWindow.isVisible()) {
    toastWindow.showInactive()
  }

  if (toastClosingTimeoutId) {
    clearTimeout(toastClosingTimeoutId)
  }

  if (
    arg.payload.highscoresPeekType &&
    currentlyDisplayedHighscores === arg.payload.highscoresPeekType
  ) {
    hideToast()
  } else {
    toastWindow.webContents.send('display-toast', arg)
    hideToastAfterTimeout()
    currentlyDisplayedHighscores = arg.payload.highscoresPeekType
  }
}

export async function onGetSettingRequest(event, arg) {
  const { key } = arg.payload
  const settings = await getSetting(key)
  const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)

  mainWindow.webContents.send('settings-request-response', settings)
}

export function onSetSettingRequest(event, arg) {
  const { settingsToUpdate } = arg.payload

  setSetting(settingsToUpdate)
}

export async function onRestartSettingsRequest() {
  await restoreDefaultSettings()
  const settings = await getSetting()
  const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)
  
  mainWindow.webContents.send('settings-request-response', settings)
}

export async function onGetPrimaryDisplayIdRequest() {
  const primaryDisplayId = await getPrimaryDisplayId();
  
  return primaryDisplayId
}

export async function onRequestAppExit(event, arg) {
  const allWindows = getAllAppWindowsArray();
  const shouldQuit = await getSetting(SETTINGS_STRINGS.CLOSE_ON_X_CLICK)

  if (shouldQuit) {
    app.quit();
  } else {
    allWindows.forEach(window => {
      window.hide();
      window.hide();
    })
  }
}
