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

function isScreenshotPathValid() {
  return fs.existsSync(electronSettings.getSync(SETTINGS_STRINGS.SCREENSHOTS_PATH))
}

async function setDefaultValuesToSettingsMissingInJson() {
  const missingSettings = {}

  for (const key in defaultSettings) {
    if (
      !electronSettings.hasSync(key) ||
      key === SETTINGS_STRINGS.SCREENSHOTS_PATH && !isScreenshotPathValid()
    ) {
      missingSettings[key] = defaultSettings[key]
    }
  }

  if (Object.keys(missingSettings).length !== 0) {
    await setSettings(missingSettings)
  }
}

function isSettingsJsonValid() {
  if (!fs.existsSync(electronSettings.file())) {
    return false
  }
 
  try {
    JSON.parse(fs.readFileSync(electronSettings.file(), 'utf8'))
  } catch (error) {
    return false
  }

  return true
}

export async function initSettings() {
  try {
    let settings = defaultSettings
    
    if (!isSettingsJsonValid()) {
      fs.writeFileSync(electronSettings.file(), JSON.stringify(defaultSettings, null, 2))
    }
    
    await setDefaultValuesToSettingsMissingInJson()
    await syncAutoLaunchValueWithSystem()
    settings = await getSetting()
  
    await runSettingChangeHandlers(settings);
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

export async function runSettingChangeHandlers(settingsToUpdate, params = {}) {
  const settingKeys = Object.keys(settingsToUpdate)
  const shortcutsToUpdate = settingKeys.filter(key =>
    Object.values(SHORTCUT_SETTING_NAMES).some(shortcutSettingName =>
      shortcutSettingName === key
    )
  )

  const { skipRegisteringShortcuts } = params;

  if (shortcutsToUpdate && !skipRegisteringShortcuts) {
    await unregisterShortcuts(shortcutsToUpdate)
  }

  for (const key of settingKeys) {
    const isShortcutSetting = Object.values(SHORTCUT_SETTING_NAMES).find(shortcutKey => shortcutKey === key);

    if (isShortcutSetting && skipRegisteringShortcuts) {
      continue;
    }

    const handler = settingChangeHandlers.get(key)

    if (!!handler) {
      try {
        await handler(key, settingsToUpdate[key])
      } catch(error) {
        console.error(error)
      }
    }
  }
}

export async function setSettings(newSettings, params) {
  await runSettingChangeHandlers(newSettings, params);
  
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

export async function restoreDefaultSettings() {
  await runSettingChangeHandlers(defaultSettings)
  await electronSettings.set(defaultSettings)
}

async function syncAutoLaunchValueWithSystem() {
  try {
    const systemSetting = await comboTrackerAutoLauncher.isEnabled();
    const appSetting = await getSetting(SETTINGS_STRINGS.LAUNCH_AT_STARTUP);

    if (appSetting !== systemSetting) {
      await setSettings(systemSetting)
    }
  } catch(error) {
    console.error(error)
  }
}

export async function unregisterAllShortcuts() {
  await unregisterShortcuts(Object.values(SHORTCUT_SETTING_NAMES));
}

export async function registerAllShortcuts() {
  const shortcutSettings = {}

  for (const shortcutName of Object.values(SHORTCUT_SETTING_NAMES)) {
    const shortcut = await getSetting(shortcutName);

    shortcutSettings[shortcutName] = shortcut;
  }

  await setSettings(shortcutSettings);
}

createDefaultScreenshotsFolder()
