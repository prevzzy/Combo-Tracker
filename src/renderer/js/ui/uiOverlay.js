import { setItemDisplay } from './uiHelpers'

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
    setItemDisplay(overlayElement, 'flex')
    if (!isButtonVisible && isSpinnerVisible) {
      setErrorOverlayDisplayTimeout()
    }
  } else {
    setItemDisplay(overlayElement, 'none')
  }

  isSpinnerVisible
    ? setItemDisplay(spinner, 'initial')
    : setItemDisplay(spinner, 'none')

  isButtonVisible
    ? setItemDisplay(button, 'initial')
    : setItemDisplay(button, 'none')
  
  if (message) {
    text.textContent = message
    setItemDisplay(text, 'initial')
  } else {
    text.textContent = ''
    setItemDisplay(text, 'none')
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
