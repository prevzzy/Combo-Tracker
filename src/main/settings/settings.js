import settings from 'electron-settings'
const fs = require('fs')
import { defaultSettings, SETTINGS_STRINGS } from './defaultSettings'
import { initKeyboardShortcuts } from '../keyboardShortcuts/keyboardShortcuts'

settings.configure({
  atomicSave: true,
  prettify: true,
  numSpaces: 2,
})

function isSettingsJsonValid() {
  if (!fs.existsSync(settings.file())) {
    return false
  }
 
  try {
    JSON.parse(fs.readFileSync(settings.file(), 'utf8'))
  } catch (error) {
    return false
  }

  for (const key in defaultSettings) {
    if (!settings.hasSync(key)) {
      return false
    }
  }

  if (!fs.existsSync(settings.getSync(SETTINGS_STRINGS.SCREENSHOTS_PATH))) {
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
    if (!isSettingsJsonValid()) {
      fs.writeFileSync(settings.file(), JSON.stringify(defaultSettings, null, 2))
    }

    const isShortcutsInitSuccessful = await initKeyboardShortcuts(mainWindow, toastWindow)
    if (!isShortcutsInitSuccessful) {
      throw new Error()
    }
  } catch (error) {
    console.error(error)
  }
}

export async function setSetting(newSettings) {
  const currentSettings = await settings.get()
  await settings.set({
    ...currentSettings,
    ...newSettings
  })
}

export function getSetting(key) {
  const setting = settings.get(key)

  return setting
}

export async function restoreDefaultSettings() {
  await settings.set(defaultSettings)
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

createDefaultScreenshotsFolder()
