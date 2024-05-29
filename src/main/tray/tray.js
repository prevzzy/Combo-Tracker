import { app, Menu, Tray } from 'electron'
import path from 'path'

function getShowHideItem(mainWindow) {
  return mainWindow.isVisible()
    ? { label: 'Hide', click: () => mainWindow.hide() }
    : { label: 'Show', click: () => mainWindow.show() }
}

function getContextMenu(mainWindow, toastWindow) {
  return Menu.buildFromTemplate([
    getShowHideItem(mainWindow),
    { label: 'Quit', click: function() {
      app.quit();
    } }
  ])
}

function setTrayContextMenu(tray, mainWindow, toastWindow) {
  tray.setContextMenu(getContextMenu(mainWindow, toastWindow))
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

export function initTray(mainWindow, toastWindow) {
  const tray = createTray(mainWindow)
  const setTray = () => setTrayContextMenu(tray, mainWindow, toastWindow)
  
  mainWindow.on('hide', setTray)
  mainWindow.on('show', setTray)

  setTray()
}
