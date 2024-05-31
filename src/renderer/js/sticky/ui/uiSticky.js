import { formatBalancePropertyTime } from '../../utils/helpers';
import { BrowserWindow } from '@electron/remote';

const manualTimer = document.getElementById('manual-timer');
const grindTimer = document.getElementById('grind-timer');

export function updateBalanceTimers({ grindTime, manualTime }) {
  manualTimer.textContent = formatBalancePropertyTime(manualTime);
  grindTimer.textContent = formatBalancePropertyTime(grindTime);
}

export function setupDragging() {
  const stickyBodyElement = document.getElementById('sticky-body');

  let dragging = false;

  stickyBodyElement.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Only start drag on left click
      dragging = true;
      stickyBodyElement.requestPointerLock({ unadjustedMovement: true, });
    }
  })

  stickyBodyElement.addEventListener('mousemove', (e) => {
    if (!dragging) {
      return
    }

    e.stopPropagation();
    e.preventDefault();
    
    const win = BrowserWindow.getFocusedWindow();
    if (win && document.pointerLockElement === stickyBodyElement) {
      const newWinX = win.getBounds().x + e.movementX;
      const newWinY = win.getBounds().y + e.movementY;
      win.setPosition(newWinX, newWinY);
    }
  });

  stickyBodyElement.addEventListener('mouseup', (e) => {
    dragging = false;
    document.exitPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== stickyBodyElement && dragging) {
      dragging = false;
    }
  });

  // Handle unexpected pointer lock errors
  document.addEventListener('pointerlockerror', () => {
    if (dragging) {
      dragging = false;
      document.exitPointerLock();
    }
  });
}
