import { getCurrentWebContents, Menu, MenuItem, app } from '@electron/remote';
import { webFrame } from 'electron';

export function isAppInDebugMode() {
  return process.env.APP_MODE === 'DEBUG' || app.getVersion().includes('debug')
}

export function log(...message) {
  if (isAppInDebugMode()) {
    console.log(...message)
  }
}

export function logWithMethod(method, message) {
  if (isAppInDebugMode()) {
    console[method](`${['%c [MAIN PROCESS]:', ...message].join(' ')}`, 'color: lime; background: black');
  }
}

export function enableInspectingHtml() {
  if (!isAppInDebugMode()) {
    return
  }

  let rightClickPosition;
  const contextMenu = new Menu();
  const menuItem = new MenuItem({
    label: 'Inspect Element',
    click: () => {
      let factor = webFrame.getZoomFactor();
      let x = Math.round(rightClickPosition.x * factor);
      let y = Math.round(rightClickPosition.y * factor);
      getCurrentWebContents().inspectElement(x, y);
    }
  });

  contextMenu.append(menuItem);

  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    rightClickPosition = { x: e.x, y: e.y };
    contextMenu.popup();
  }, false);
}

enableInspectingHtml()
