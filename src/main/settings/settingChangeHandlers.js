import { SETTINGS_STRINGS } from './defaultSettings'
import { globalShortcut } from 'electron'
import comboTrackerAutoLauncher from '../autoLaunch/autoLaunch'

export const settingChangeHandlers = new Map([
  [SETTINGS_STRINGS.LAUNCH_AT_STARTUP, onLaunchAtStartupSettingChange],
  [SETTINGS_STRINGS.MAP_TOP_SCORES_HOTKEY, registerNewShortcut],
  [SETTINGS_STRINGS.ALL_TOP_SCORES_HOTKEY, registerNewShortcut],
])

export const shortcutCallbacks = new Map([
  [SETTINGS_STRINGS.MAP_TOP_SCORES_HOTKEY, onCurrentMapHighscoresShortcut],
  [SETTINGS_STRINGS.ALL_TOP_SCORES_HOTKEY, onAllMapsHighscoresShortcut],
])

async function onLaunchAtStartupSettingChange(mainWindow, settingKey, newValue) {
  try {
    if (!!newValue) {
      comboTrackerAutoLauncher.enable()
    } else {
      comboTrackerAutoLauncher.disable()
    }
  } catch(error) {
    console.error(error);
  }
}

async function registerNewShortcut(mainWindow, settingKey, newShortcut) {
  if (!newShortcut) {
    return;
  }

  try {
    globalShortcut.register(newShortcut, () => {
      shortcutCallbacks.get(settingKey)(mainWindow)
    })
  } catch (error) {
    console.error(error)
  }
}

function onAllMapsHighscoresShortcut(mainWindow) {
  mainWindow.webContents.send('display-all-maps-highscores')
}

function onCurrentMapHighscoresShortcut(mainWindow) {
  mainWindow.webContents.send('display-current-map-highscores')
}
