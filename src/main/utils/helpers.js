import { app } from "electron";

export function isAppInDebugMode() {
  return process.env.APP_MODE === 'DEBUG' || app.getVersion().includes('debug')
}

export function pipeLogsToRenderer(mainWindow) {
  if (!isAppInDebugMode()) {
    return;
  }

  ['log', 'warn', 'error'].forEach((method) => {
    const original = console[method];
    console[method] = (...args) => {
      mainWindow.webContents.send('console-message', { method, args });
      original.apply(console, args);
    };
  });
}
