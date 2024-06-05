
import url from 'url';
import electron, { BrowserWindow, Menu, MenuItem } from 'electron';
import { mainWindowConfig, stickyWindowConfig, toastWindowConfig } from './windowsConfig';
import { startMinimized } from '../autoLaunch/autoLaunch';
import { isAppQuitting } from '../appService/appService';
import { onStickyWindowVisibilityChange } from '../events/ipcEventHandlers';

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

export function showMainWindow() {
  mainWindow.show()
  mainWindow.restore()
  mainWindow.focus()
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
      showMainWindow()
    }
  })

  stickyWindow.on('show', () => onStickyWindowVisibilityChange(true))
  stickyWindow.on('restore', () => onStickyWindowVisibilityChange(true))
  stickyWindow.on('minimize', () => onStickyWindowVisibilityChange(false))
  stickyWindow.on('hide', () => onStickyWindowVisibilityChange(false))
  stickyWindow.on('close', (event) => {
    if (!isAppQuitting()) {
      event.preventDefault();
      stickyWindow.hide();
      onStickyWindowVisibilityChange(false)
    }
  })

  setupStickyWindowContextMenu()
}

function setupStickyWindowContextMenu() {
  let rightClickPosition;
  const contextMenu = new Menu();
  const minimizeItem = new MenuItem({
    label: 'Minimize',
    click: () => {    
      if (stickyWindow) {
        stickyWindow.minimize();
      }
    }
  });
  const quitItem = new MenuItem({
    label: 'Quit',
    click: () => {    
      if (stickyWindow) {
        stickyWindow.hide();
      }
    }
  });

  contextMenu.append(minimizeItem);
  contextMenu.append(quitItem);
  
  stickyWindow.webContents.on('context-menu', (event, params) => {
    rightClickPosition = { x: params.x, y: params.y };
    contextMenu.popup({
      window: stickyWindow,
      x: rightClickPosition.x,
      y: rightClickPosition.y
    });
  }, false);
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
