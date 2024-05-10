import {
  requestAppMinimize, 
  requestAppFullscreen,
  requestAppExit
} from '../events/outgoingIpcEvents'

const lastComboPage = document.getElementById('last-combo-page')
const highscoresPage = document.getElementById('highscores-page')
const settingsPage = document.getElementById('settings-page')
const aboutPage = document.getElementById('about-page')
const navLastCombo = document.getElementById('navbar-last-combo')
const navHighscores = document.getElementById('navbar-highscores')
const navSettings = document.getElementById('navbar-settings')
const navAbout = document.getElementById('navbar-about')

const pageElementsArray = [lastComboPage, highscoresPage, settingsPage, aboutPage]
const navElementsArray = [navLastCombo, navHighscores, navSettings, navAbout]

function initNavigation(
  navigationElementsArray,
  contentContainersArray,
) {
  navigationElementsArray.forEach((navElement, i) => {

    navElement.addEventListener('click', (e) => {
      changePage(
        contentContainersArray[i],
        e.currentTarget,
        contentContainersArray,
        [...navigationElementsArray]
      )
    })
  })
}

function changePage(page, target, pages, navItems) {
  pages.forEach((pageElement) => {
    setItemDisplay(pageElement, pageElement === page ? 'block': 'none')
  })

  navItems.forEach((navElement) => {
    setActiveNavigationClasses(navElement, target)
  })
}

function setActiveNavigationClasses(navElement, target) {
  navElement === target
    ? navElement.classList.add('active')
    : navElement.classList.remove('active')
}

function adjustTextInputUI(isValid, borderElement, elementToAppendTo, messageElementId, message) {
  const existingMessageElement = document.getElementById(messageElementId)
  addValidityBorder(borderElement, isValid)

  if (existingMessageElement) {
    existingMessageElement.remove()
  }

  if (!isValid) {
    appendInvalidMessageBox(messageElementId, elementToAppendTo, message)
  }
}

function addValidityBorder(input, isValid) {
  if (isValid) {
    input.classList.remove('is-invalid')
    input.classList.add('is-valid')
  } else {
    input.classList.remove('is-valid')
    input.classList.add('is-invalid')
  }
}

function appendInvalidMessageBox(id, elementToAppendTo, message) {
  const div = document.createElement('div')
  div.classList.add('invalid-feedback', 'invalidMessageBox')
  div.id = id
  div.textContent = message
  div.style = "display: block"
  elementToAppendTo.appendChild(div)
}

function createTextElement(desiredElement, classesString, elementToAppendTo, message) {
  const element = document.createElement(desiredElement);

  if (!element) {
    return message
  }

  element.classList.add(...classesString.split(' '))
  element.textContent = message
  elementToAppendTo.appendChild(element)
}

function setItemDisplay(item, display) {
  item.style.display = display;
}

function colorComboPropertyText(element, value, dangerThreshold,  warningThreshold = 1) {
  element.classList.remove('text-danger', 'text-warning', 'text-success')

  if (typeof value !== 'number' || value >= dangerThreshold) {
    element.classList.add('text-danger')
  } else if (value >= warningThreshold) {
    element.classList.add('text-warning')
  } else {
    element.classList.add('text-success')
  }
}

function setupToolbarListeners() {
  document.getElementById('toolbar-minimize-button').addEventListener('click', requestAppMinimize)
  document.getElementById('toolbar-fullscreen-button').addEventListener('click', requestAppFullscreen)
  document.getElementById('toolbar-close-button').addEventListener('click', requestAppExit)
}

function showApp() {
  const spinner = document.getElementById('initial-spinner')
  const page = document.getElementById('app')

  spinner.style.display = 'none'
  page.style.display = 'block'
}

function blockHighscoresPage() {
  setItemDisplay(navHighscores, 'none')
}

initNavigation(navElementsArray, pageElementsArray)

export {
  changePage,
  adjustTextInputUI,
  createTextElement,
  setItemDisplay,
  colorComboPropertyText,
  setupToolbarListeners,
  initNavigation,
  showApp,
  blockHighscoresPage,
}
