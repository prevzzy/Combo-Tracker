import { app, Menu, Tray } from 'electron'
import path from 'path'
import { APP_WINDOW_NAMES, getAppWindow } from '../browserWindows/browserWindows';

function getShowHideItem(mainWindow) {
  return mainWindow.isVisible()
    ? { label: 'Hide', click: () => mainWindow.hide() }
    : { label: 'Show', click: () => mainWindow.show() }
}

function getContextMenu(mainWindow) {
  return Menu.buildFromTemplate([
    getShowHideItem(mainWindow),
    { label: 'Quit', click: function() {
      app.quit();
    } }
  ])
}

function setTrayContextMenu(tray, mainWindow) {
  tray.setContextMenu(getContextMenu(mainWindow))
}

function createTray(mainWindow) {
  const iconPath = path.join(__dirname, './combo-tracker-icon.ico');
  const tray = new Tray(iconPath)
  tray.setToolTip('Combo Tracker')
  tray.setIgnoreDoubleClickEvents(true)

  tray.on('click', () => {
    mainWindow.show()
  })

  return tray;
}

export function initTray() {
  const mainWindow = getAppWindow(APP_WINDOW_NAMES.MAIN)

  const tray = createTray(mainWindow)
  const setTray = () => setTrayContextMenu(tray, mainWindow)
  
  mainWindow.on('hide', setTray)
  mainWindow.on('show', setTray)

  setTray()
}
