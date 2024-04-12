import { OVERLAY_WINDOW_OPTS } from "electron-overlay-window"

export const mainWindowConfig = {
  getBrowserWindowConfig(display) {
    return {
      width: 1280,
      height: 768,
      minWidth: 600,
      minHeight: 500,
      frame: process.env.APP_MODE === 'DEBUG',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        backgroundThrottling: false,
      },
    }
  },
  url: {
    pathname: MAIN_WINDOW_WEBPACK_ENTRY,
  },
  showOnAppLaunch: true,
  preventMultiple: true,
}

export const toastWindowConfig = {
  getBrowserWindowConfig(display) {
    return {
      height: 700,
      width: 300,
      x: display.bounds.width - 300,
      y: 150,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      movable: false,
      show: false,
      skipTaskbar: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        preload: TOAST_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    }
  },
  url: {
    pathname: TOAST_WINDOW_WEBPACK_ENTRY,
  },
  preventMultiple: true,
}

export const overlayWindowConfig = {
  getBrowserWindowConfig(display) {
    return {
      height: 400,
      width: 300,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        preload: OVERLAY_PRELOAD_WEBPACK_ENTRY,
      },
      ...OVERLAY_WINDOW_OPTS,
    }
  },
  url: {
    pathname: OVERLAY_WEBPACK_ENTRY,
  },
  preventMultiple: true,
}
