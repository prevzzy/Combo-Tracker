
import url from 'url';
import electron, { BrowserWindow, Menu, MenuItem, globalShortcut } from 'electron';
import { mainWindowConfig, stickyWindowConfig, toastWindowConfig, overlayWindowConfig } from './windowsConfig';
import { startMinimized } from '../autoLaunch/autoLaunch';
import { isAppQuitting } from '../appService/appService';
import { onStickyWindowVisibilityChange } from '../events/ipcEventHandlers';
import { pipeLogsToRenderer } from '../utils/helpers';
import { OverlayController } from 'electron-overlay-window'

let mainWindow
let toastWindow
let stickyWindow
let overlayWindow

export const APP_WINDOW_NAMES = {
  MAIN: 'MAIN',
  TOAST: 'TOAST',
  STICKY: 'STICKY',
  OVERLAY: 'OVERLAY'
}

export function getAppWindow(name) {
  switch (name) {
    case APP_WINDOW_NAMES.MAIN:
      return mainWindow;
    case APP_WINDOW_NAMES.TOAST:
      return toastWindow;
    case APP_WINDOW_NAMES.STICKY:
      return stickyWindow;
    case APP_WINDOW_NAMES.OVERLAY:
      return overlayWindow;
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

  const windowConfig = config.getBrowserWindowConfig(display)

  let win = new BrowserWindow(windowConfig)
  win.loadURL(url.format(config.url))

  if (windowConfig.alwaysOnTop) {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver');
  }

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
  overlayWindow = createBrowserWindow(overlayWindowConfig)

  // TODO: unused for now
  // makeDemoInteractive(overlayWindow)

  setupWindowEventHandlers()
}

export function showMainWindow() {
  if (!mainWindow) {
    return;
  }

  mainWindow.show()
  mainWindow.restore()
  mainWindow.focus()
}

function setupWindowEventHandlers() {
  pipeLogsToRenderer(mainWindow)

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
      hideStickyWindow()
    }
  })

  setupStickyWindowContextMenu()
}

export function hideStickyWindow() {
  stickyWindow.hide();
  onStickyWindowVisibilityChange(false)
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

function makeDemoInteractive(window) {
  const toggleMouseKey = 'CmdOrCtrl + J'
  const toggleShowKey = 'CmdOrCtrl + K'
  let isInteractable = false

  function toggleOverlayState () {
    if (isInteractable) {
      isInteractable = false
      OverlayController.focusTarget()
      window.webContents.send('focus-change', false)
    } else {
      isInteractable = true
      OverlayController.activateOverlay()
      window.webContents.send('focus-change', true)
    }
  }

  window.on('blur', () => {
    isInteractable = false
    window.webContents.send('focus-change', false)
  })

  globalShortcut.register(toggleMouseKey, toggleOverlayState)

  globalShortcut.register(toggleShowKey, () => {
    window.webContents.send('visibility-change', false)
  })
}
