
import url from 'url';
import electron, { BrowserWindow } from 'electron';
import { mainWindowConfig, stickyWindowConfig, toastWindowConfig } from './windowsConfig';
import { startMinimized } from '../autoLaunch/autoLaunch';
import { isAppQuitting } from '../appService/appService';

let mainWindow
let toastWindow
let stickyWindow

export const APP_WINDOW_NAMES = {
  MAIN: 'MAIN',
  TOAST: 'TOAST',
  STICKY: 'STICKY'
}

export function getAppWindow(name) {
  switch (name) {
    case APP_WINDOW_NAMES.MAIN:
      return mainWindow;
    case APP_WINDOW_NAMES.TOAST:
      return toastWindow;
    case APP_WINDOW_NAMES.STICKY:
      return stickyWindow;
    default: 
      console.error(`Could not find '${name}' window`)
      return;
  }
}

export function getAllAppWindowsArray() {
  return BrowserWindow.getAllWindows()
}

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
  mainWindow = createBrowserWindow(mainWindowConfig)
  toastWindow = createBrowserWindow(toastWindowConfig)
  stickyWindow = createBrowserWindow(stickyWindowConfig)
  // const overlayWindow = createBrowserWindow(overlayWindowConfig)

  
  // makeDemoInteractive(overlayWindow)
  setupWindowEventHandlers()
}

function setupWindowEventHandlers() {
  mainWindow.on('close', (event) => {
    if (!isAppQuitting()) {
      event.preventDefault();
      mainWindow.hide();
      toastWindow.hide()
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (!startMinimized()) {
      mainWindow.show()
      mainWindow.restore()
      mainWindow.focus()
    }
  })
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