import { ipcRenderer } from 'electron';
import { changeToastContentXPosition, displayToast } from '../ui/uiToasts';

export function initToastEvents() {
  ipcRenderer.on('display-toast', (event, arg) => {
    displayToast(arg.toastEventType, arg.payload)
  })

  ipcRenderer.on('hide-toast', (event, offsetXEnd) => {
    changeToastContentXPosition(0, offsetXEnd)
  })
}
