import * as GlobalUI from './uiGlobal'

let overlayErrorDisplayTimeoutId = null
const overlayElement = document.getElementById('overlay')

overlayElement.querySelector('#overlay-button').addEventListener('click', () => {
  displayOverlay(false)
  clearErrorOverlayDisplayTimeout()
})

function displayOverlay(isOverlayVisible, isSpinnerVisible, message, isButtonVisible) {
  clearErrorOverlayDisplayTimeout()

  const spinner = overlayElement.querySelector('#overlay-spinner')
  const text = overlayElement.querySelector('#overlay-text')
  const button = overlayElement.querySelector('#overlay-button')

  if (isOverlayVisible) {
    GlobalUI.setItemDisplay(overlayElement, 'flex')
    if (!isButtonVisible && isSpinnerVisible) {
      setErrorOverlayDisplayTimeout()
    }
  } else {
    GlobalUI.setItemDisplay(overlayElement, 'none')
  }

  isSpinnerVisible
    ? GlobalUI.setItemDisplay(spinner, 'initial')
    : GlobalUI.setItemDisplay(spinner, 'none')

  isButtonVisible
    ? GlobalUI.setItemDisplay(button, 'initial')
    : GlobalUI.setItemDisplay(button, 'none')
  
  if (message) {
    text.textContent = message
    GlobalUI.setItemDisplay(text, 'initial')
  } else {
    text.textContent = ''
    GlobalUI.setItemDisplay(text, 'none')
  }
}

function setErrorOverlayDisplayTimeout() {
  clearErrorOverlayDisplayTimeout()

  overlayErrorDisplayTimeoutId = setTimeout(() => {
    displayOverlay(true, true, 'This is taking longer than usual...', true)
  }, 15000)
}

function clearErrorOverlayDisplayTimeout() {
  if (overlayErrorDisplayTimeoutId) {
    clearTimeout(overlayErrorDisplayTimeoutId);
    overlayErrorDisplayTimeoutId = null;
  }
}

export {
  displayOverlay,
  setErrorOverlayDisplayTimeout,
  clearErrorOverlayDisplayTimeout,
}
