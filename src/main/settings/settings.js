import electronSettings from 'electron-settings'
const fs = require('fs')
import { defaultSettings, SETTINGS_STRINGS, SHORTCUT_SETTING_NAMES } from './defaultSettings'
import { settingChangeHandlers } from '../settings/settingChangeHandlers'
import { globalShortcut } from 'electron'
import comboTrackerAutoLauncher from '../autoLaunch/autoLaunch'

electronSettings.configure({
  atomicSave: true,
  prettify: true,
  numSpaces: 2,
})

function isSettingsJsonValid() {
  if (!fs.existsSync(electronSettings.file())) {
    return false
  }
 
  try {
    JSON.parse(fs.readFileSync(electronSettings.file(), 'utf8'))
  } catch (error) {
    return false
  }

  for (const key in defaultSettings) {
    if (!electronSettings.hasSync(key)) {
      return false
    }
  }

  if (!fs.existsSync(electronSettings.getSync(SETTINGS_STRINGS.SCREENSHOTS_PATH))) {
    return false
  }
  // additional naive check for directory permissions - doesn't do it's work anyway
  // else {
  //   try {
  //     const pathToTest = path.join(settings.getSync(SETTINGS_STRINGS.SCREENSHOTS_PATH), `test.txt`)
  //     fs.writeFileSync(pathToTest, 'test')
  //     fs.unlinkSync(pathToTest)
  //   } catch (error) {
  //     console.error(error)
  //     return false
  //   }
  // }

  return true
}

export async function initSettings(mainWindow, toastWindow) {
  try {
    let settings = defaultSettings
    if (!isSettingsJsonValid()) {
      fs.writeFileSync(electronSettings.file(), JSON.stringify(defaultSettings, null, 2))
    } else {
      await syncAutoLaunchValueWithSystem()

      settings = await getSetting()
    }
    
    await runSettingChangeHandlers(mainWindow, settings);
  } catch (error) {
    console.error(error)
  }
}

function createDefaultScreenshotsFolder() {
  try {
    if (!fs.existsSync(defaultSettings[SETTINGS_STRINGS.SCREENSHOTS_PATH])) {
      fs.mkdir(defaultSettings[SETTINGS_STRINGS.SCREENSHOTS_PATH], {}, (err) => {
        if (err) {
          console.error(err)
        }
      })
    }
  } catch(error) {
    console.error(error)
  }
}

export async function runSettingChangeHandlers(mainWindow, settingsToUpdate) {
  const settingKeys = Object.keys(settingsToUpdate)
  const shortcutsToUpdate = settingKeys.filter(key =>
    Object.values(SHORTCUT_SETTING_NAMES).some(shortcutSettingName =>
      shortcutSettingName === key
    )
  )

  if (shortcutsToUpdate) {
    await unregisterShortcuts(shortcutsToUpdate)
  }

  for (const key of settingKeys) {
    const handler = settingChangeHandlers.get(key)

    if (!!handler) {
      try {
        await handler(mainWindow, key, settingsToUpdate[key])
      } catch(error) {
        console.error(error)
      }
    }
  }
}

export async function setSetting(mainWindow, newSettings) {
  await runSettingChangeHandlers(mainWindow, newSettings);
  
  const currentSettings = await electronSettings.get()
  
  await electronSettings.set({
    ...currentSettings,
    ...newSettings
  })
}

async function unregisterShortcuts(shortcutSettingNames) {
  for (const settingKey of shortcutSettingNames) {
    const shortcut = await electronSettings.get(settingKey)
  
    if (shortcut) {
      globalShortcut.unregister(shortcut)
    }
  }
}

export function getSetting(key) {
  const setting = electronSettings.get(key)

  return setting
}

export async function restoreDefaultSettings(mainWindow) {
  await runSettingChangeHandlers(mainWindow, defaultSettings)
  await electronSettings.set(defaultSettings)
}

async function syncAutoLaunchValueWithSystem() {
  try {
    const systemSetting = await comboTrackerAutoLauncher.isEnabled();
    const appSetting = await getSetting(SETTINGS_STRINGS.LAUNCH_AT_STARTUP);

    if (appSetting !== systemSetting) {
      await setSetting(null, systemSetting)
    }
  } catch(error) {
    console.error(error)
  }
}

createDefaultScreenshotsFolder()
