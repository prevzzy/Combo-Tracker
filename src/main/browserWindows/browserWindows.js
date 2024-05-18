
import url from 'url';
import electron, { BrowserWindow, globalShortcut } from 'electron';
import { mainWindowConfig, toastWindowConfig } from './windowsConfig';

function createBrowserWindow(config) {
  // needed for relative window position
  const display = electron.screen.getPrimaryDisplay()

  let win = new BrowserWindow(config.getBrowserWindowConfig(display))
  win.loadURL(url.format(config.url))

  if (config.showOnAppLaunch) {
    win.once('ready-to-show', () => {
      win.show()
    })
  }

  if (config.preventMultiple) {
    win.webContents.on('new-window', (event, url) => {
      event.preventDefault()
    })
  }

  return win
}

export function createAppWindows() {
  const mainWindow = createBrowserWindow(mainWindowConfig)
  const toastWindow = createBrowserWindow(toastWindowConfig)
  // const overlayWindow = createBrowserWindow(overlayWindowConfig)

  // makeDemoInteractive(overlayWindow)

  return {
    mainWindow,
    toastWindow,
    // overlayWindow,
  }
}

// function makeDemoInteractive(window) {
//   const toggleMouseKey = 'CmdOrCtrl + J'
//   const toggleShowKey = 'CmdOrCtrl + K'
//   let isInteractable = false

//   function toggleOverlayState () {
//     if (isInteractable) {
//       isInteractable = false
//       OverlayController.focusTarget()
//       window.webContents.send('focus-change', false)
//     } else {
//       isInteractable = true
//       OverlayController.activateOverlay()
//       window.webContents.send('focus-change', true)
//     }
//   }

//   window.on('blur', () => {
//     isInteractable = false
//     window.webContents.send('focus-change', false)
//   })

//   globalShortcut.register(toggleMouseKey, toggleOverlayState)

//   globalShortcut.register(toggleShowKey, () => {
//     window.webContents.send('visibility-change', false)
//   })
// }