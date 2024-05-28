import { TOASTS_CONFIG } from '../utils/constants'
import { getSetting, setSetting, restoreDefaultSettings } from '../settings/settings'
import { SETTINGS_STRINGS } from '../settings/defaultSettings'
import { isToastTypeSettingsDependant } from './utils'
import { TOAST_EVENT_TYPES } from './toastEventTypes'
import { getPrimaryDisplayId } from '../desktopCapture/desktopCapture'

let toastClosingTimeoutId
let currentlyDisplayedHighscores

function hideToastAfterTimeout(toastWindow) {
  toastClosingTimeoutId = setTimeout(() => {
    hideToast(toastWindow)
  }, TOASTS_CONFIG.CLOSE_TIMEOUT)
}

function hideToast(toastWindow) {
  toastWindow.webContents.send('hide-toast', toastWindow.getBounds().width)

  setTimeout(() => {
    if (toastWindow.isVisible()) {
      toastWindow.hide()
      currentlyDisplayedHighscores = undefined
    }
  }, 200)
}

export async function onDisplayToastRequest(event, arg, toastWindow) {
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
    hideToast(toastWindow)
  } else {
    toastWindow.webContents.send('display-toast', arg)
    hideToastAfterTimeout(toastWindow)
    currentlyDisplayedHighscores = arg.payload.highscoresPeekType
  }
}

export async function onGetSettingRequest(event, arg, mainWindow) {
  const { key } = arg.payload
  const settings = await getSetting(key)

  mainWindow.webContents.send('settings-request-response', settings)
}

export function onSetSettingRequest(event, arg, mainWindow) {
  const { settingsToUpdate } = arg.payload

  setSetting(mainWindow, settingsToUpdate)
}

export async function onRestartSettingsRequest(mainWindow) {
  await restoreDefaultSettings(mainWindow)
  const settings = await getSetting()

  mainWindow.webContents.send('settings-request-response', settings)
}

export async function onGetPrimaryDisplayIdRequest() {
  const primaryDisplayId = await getPrimaryDisplayId();
  
  return primaryDisplayId
}
