import { globalShortcut } from 'electron'
import { getSetting } from '../settings/settings'
import { shortcutCallbacks } from '../events/ipcEventHandlers'

export async function initKeyboardShortcuts(mainWindow, toastWindow) {
  let isSuccessful = true

  for (const [key, value] of shortcutCallbacks) {
    try {
      const hotkey = await getSetting(key)
      globalShortcut.register(hotkey, () => {
        value(mainWindow)
      })
    } catch (error) {
      isSuccessful = false
    }
  }

  return isSuccessful
}
