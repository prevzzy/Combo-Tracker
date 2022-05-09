const errorContainer = document.getElementById('global-error-container')
const errorCloseButton = document.getElementById('global-error-close-button')

const ERROR_STYLE_BY_STATUS = [
  ['check_circle', ['text-success'], '#28A745'],
  ['error_outline', ['text-danger'], '#FC3939'],
  ['hourglass_empty', ['text-secondary', 'spin'], '#A991D4'],
  ['error_outline', ['text-secondary'], '#A991D4']
]

const lastDisplayedError = {
  message: '',
  status: -1,
}
let lastDismissedError = {}

errorCloseButton.addEventListener('click', () => {
  setLastDismissedError(lastDisplayedError.message, lastDisplayedError.status)
  setupGlobalError(false)
})

function setLastDisplayedError(message, status) {
  lastDisplayedError.message = message
  lastDisplayedError.status = status
}

function setLastDismissedError(message, status) {
  lastDismissedError.message = message
  lastDismissedError.status = status
}

function isNewErrorTheSameAsLastDismissed(message, status) {
  if (!lastDismissedError) {
    return false
  }

  return message === lastDismissedError.message && status === lastDismissedError.status
}

export function setErrorIconByStatus(iconElement, status, borderElement) {
  iconElement.classList.remove('spin', 'text-danger', 'text-warning', 'text-success')

  const errorStyle = ERROR_STYLE_BY_STATUS[status]
  iconElement.textContent = errorStyle[0]
  iconElement.classList.add(...errorStyle[1])

  if (borderElement) {
    borderElement.style.borderColor = errorStyle[2]
  }
}

export function setupGlobalError(isVisible, message = 'Something went wrong...', status = 1) {
  const iconElement = document.getElementById('global-error-info-icon')
  const textElement = document.getElementById('global-error-text')

  if (isVisible) {
    if (isNewErrorTheSameAsLastDismissed(message, status)) {
      return
    }

    textElement.textContent = message
    errorContainer.classList.remove('hidden')
    errorContainer.classList.add('shown')
    setErrorIconByStatus(iconElement, status, errorContainer)
    setLastDisplayedError(message, status)
    setLastDismissedError('', -1)
  } else {
    errorContainer.classList.remove('shown')
    errorContainer.classList.add('hidden')
    setLastDisplayedError('', -1)
    setTimeout(() => {
      textElement.textContent = message
    }, 500)
  }
}
