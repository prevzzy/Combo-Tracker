import * as GlobalUI from '../uiGlobal'
import * as ComboNumbersUI from './numbers/uiComboNumbers'
import * as TricksUI from './tricks/uiTricks'
import * as GraphsUI from './graphs/uiGraphs'
import { APP_CONFIG_VALUES } from '../../utils/constants'
import { readSavedComboFile } from '../../files/fileService'
import { Trick } from '../../combo/trickHistory'
import { setErrorIconByStatus } from '../globalError'

const newComboTextElement = document.getElementById('new-combo-text')
const newComboTextTimerElement = document.getElementById('new-combo-text-timer')
const lastComboPageContent = document.getElementById('last-combo-page-content')
const lastComboPageInfo = document.getElementById('last-combo-page-info');
const infoDismissButton = document.getElementById('last-combo-page-info-dismiss-button')
const allTabsContainer = document.getElementById('combo-details-tabs-container')
const allNavElementsContainer = document.getElementById('combo-details-nav-container')

infoDismissButton.addEventListener('click', dismissInfoPage)
let isPageInfoDismissed = false
let hasComboDetails = false

const tabContentContainersArray = Array.from(allTabsContainer.children)
const navElementsArray = Array.from(allNavElementsContainer.children)

function setNewComboTextDisplay(isVisible) {
  newComboTextElement.style.display = isVisible
    ? 'block'
    : 'none';
}

function updateNewComboTextTime(comboTime) {
  newComboTextTimerElement.textContent = ((APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_LENGTH - comboTime) / 1000).toFixed(0)
}

function setLastComboPageInfo(isVisible, message = 'Something went wrong...', status = 1, isInfoDismissable = false) {
  const iconElement = document.getElementById('last-combo-page-info-icon');
  const infoTextElement = document.getElementById('last-combo-error-text')

  if (isVisible) {
    GlobalUI.setItemDisplay(lastComboPageContent, 'none')
    GlobalUI.setItemDisplay(lastComboPageInfo, 'initial')
    setErrorIconByStatus(iconElement, status)
  } else {
    GlobalUI.setItemDisplay(lastComboPageContent, 'initial')
    GlobalUI.setItemDisplay(lastComboPageInfo, 'none')
  }

  isInfoDismissable
    ? GlobalUI.setItemDisplay(infoDismissButton, 'initial')
    : GlobalUI.setItemDisplay(infoDismissButton, 'none')
    
  infoTextElement.textContent = message
}

function handleLastComboDisplay(
  comboNumbersData,
  tricksData,
  graphData,
  shouldDisplayDate,
) {
  if (
    comboNumbersData &&
    comboNumbersData.mainComboData &&
    comboNumbersData.mainComboData.isIdle
  ) {
    setLastComboPageInfo(true, 'Stopped combo tracking due to idle behaviour. Start a new combo.', 1);
    return
  } else {
    setLastComboPageInfo(false);
  }

  restoreDefaultUI()

  ComboNumbersUI.displayComboNumbers(comboNumbersData, shouldDisplayDate)
  TricksUI.displayTricks(tricksData.tricksInCombo, tricksData.comboHistoryHtml)
  GraphsUI.drawComboCharts(graphData.datasets, graphData.timestampArray)

  setHasDisplayedComboDetails(true)
}

function restoreDefaultUI() {
  const lastComboPage = document.getElementById('last-combo-page')
  lastComboPage.parentElement.replaceChild(lastComboPage, lastComboPage)
  navElementsArray[0].click()
  TricksUI.resetTrickTabsScrollbars()
}

function dismissInfoPage() {
  GlobalUI.setItemDisplay(lastComboPageInfo, 'none')
  GlobalUI.setItemDisplay(infoDismissButton, 'none')
  GlobalUI.setItemDisplay(lastComboPageContent, 'initial')
  isPageInfoDismissed = true
}

function init() {
  GlobalUI.initNavigation(navElementsArray, tabContentContainersArray)
  TricksUI.init()
  GraphsUI.init()
}

async function displayComboFromFile(game, fileName) {
  try {
    setLastComboPageInfo(true, '', 2, false)
    document.getElementById('navbar-last-combo').click()
    const { stats, tricks, graphs } = await readSavedComboFile(game, fileName)

    tricks.tricksInCombo = tricks.tricksInCombo.map(trick =>
      new Trick(trick.name, trick.flags, trick.timesUsed)
    )

    handleLastComboDisplay(stats, tricks, graphs, true)
    setLastComboPageInfo(false);
  } catch (error) {
    console.error(error)
    setLastComboPageInfo(true, 'Failed to read combo data.', 1, hasDisplayedComboDetails());
  }
}

function hasDisplayedComboDetails() {
  return hasComboDetails
}

function setHasDisplayedComboDetails(value) {
  hasComboDetails = value
}

export {
  handleLastComboDisplay,
  setNewComboTextDisplay,
  updateNewComboTextTime,
  setLastComboPageInfo,
  init,
  displayComboFromFile,
  hasDisplayedComboDetails,
  setHasDisplayedComboDetails,
}
