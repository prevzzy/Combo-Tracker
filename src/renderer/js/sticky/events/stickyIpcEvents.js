import { ipcRenderer } from 'electron';
import { updateBalanceTimers } from '../ui/uiSticky';

export function initStickyEvents() {
  ipcRenderer.on('update-balance-timers', (event, arg) => {
    updateBalanceTimers(arg)
  })
}
