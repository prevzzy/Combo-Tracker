import { getCurrentWebContents, Menu, MenuItem } from '@electron/remote';
import { webFrame } from 'electron';

export function isAppInDebugMode() {
  return process.env.APP_MODE === 'DEBUG'
}

export function log(...message) {
  if (isAppInDebugMode()) {
    console.log(...message)
  }
}

export function enableInspectingHtml() {
  if (isAppInDebugMode()) {

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
}

enableInspectingHtml()
