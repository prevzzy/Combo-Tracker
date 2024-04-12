import {
  requestAppMinimize, 
  requestAppFullscreen,
  requestAppExit
} from '../events/outgoingIpcEvents'
import { setItemDisplay, setActiveNavigationClasses } from './uiHelpers';

const lastComboPage = document.getElementById('last-combo-page')
const highscoresPage = document.getElementById('highscores-page')
const onlinePage = document.getElementById('online-page')
const settingsPage = document.getElementById('settings-page')
const aboutPage = document.getElementById('about-page')

const navLastCombo = document.getElementById('navbar-last-combo')
const navHighscores = document.getElementById('navbar-highscores')
const navOnline = document.getElementById('navbar-online')
const navSettings = document.getElementById('navbar-settings')
const navAbout = document.getElementById('navbar-about')

const pageElementsArray = [lastComboPage, highscoresPage, onlinePage, settingsPage, aboutPage]
const navElementsArray = [navLastCombo, navHighscores, navOnline, navSettings, navAbout]

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
        navigationElementsArray
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
  setupToolbarListeners,
  initNavigation,
  showApp,
  blockHighscoresPage,
  setActiveNavigationClasses,
}
