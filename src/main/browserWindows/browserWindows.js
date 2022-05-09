
import url from 'url'
import electron from 'electron'
import { BrowserWindow } from 'electron'
import { mainWindowConfig, toastWindowConfig } from './windowsConfig'

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

  return {
    mainWindow,
    toastWindow,
  }
}
