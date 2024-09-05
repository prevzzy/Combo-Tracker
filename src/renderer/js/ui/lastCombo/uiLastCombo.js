import * as ComboNumbersUI from './numbers/uiComboNumbers'
import * as TricksUI from './tricks/uiTricks'
import * as GraphsUI from './graphs/uiGraphs'
import { APP_CONFIG_VALUES, COMBO_PAGE_INFO_MESSAGES } from '../../utils/constants'
import * as FileService from '../../files/fileService'
import { Trick } from '../../combo/trickHistory'
import { setErrorIconByStatus } from '../globalError'
import { hasActiveGameInstance } from '../../game/gameProcessService'
import { deleteHighscoreFromAppSavedCombos } from '../../combo/savedCombosService'
import { refreshCurrentlyDisplayedHighscores } from '../uiHighscores'
import { isComboInProgress } from '../../combo/tracker'
import { setItemDisplay } from '../uiHelpers'
import { initNavigation } from '../uiNavigation'
import { requestShowingOverlay } from '../../events/outgoingIpcEvents';

const lastComboPage = document.getElementById('last-combo-page')
const newComboTextElement = document.getElementById('new-combo-text')
const newComboTextTimerElement = document.getElementById('new-combo-text-timer')
const lastComboPageContent = document.getElementById('last-combo-page-content')
const lastComboPageInfo = document.getElementById('last-combo-page-info');
const infoDismissButton = document.getElementById('last-combo-page-info-dismiss-button')
const allTabsContainer = document.getElementById('combo-details-tabs-container')
const allNavElementsContainer = document.getElementById('combo-details-nav-container')
const deleteHighscoreActionsElement = document.getElementById('combo-details-actions-container')
const deleteHighscoreButtonElement = document.getElementById('combo-details-delete-score-button')
const overlayButton = document.getElementById('overlay-window-button')
infoDismissButton.addEventListener('click', dismissInfoPage)

overlayButton.addEventListener('click', requestShowingOverlay)

let hasComboDetails = false
let deleteHighscoreListener;
let comboPageDelayedAction = {
  timeoutId: null,
  callback: null,
};

// todo: replace this and analogous code for globalError with something more generic
let lastDismissedInfo = {
  message: null,
  status: null,
}
let lastDisplayedInfo = {
  message: null,
  status: null,
}


const tabContentContainersArray = Array.from(allTabsContainer.children)
const navElementsArray = Array.from(allNavElementsContainer.children)

function setLastDismissedInfo(message, status) {
  lastDismissedInfo.message = message
  lastDismissedInfo.status = status
}


function setLastDisplayedInfo(message, status) {
  lastDisplayedInfo.message = message
  lastDisplayedInfo.status = status
}

function isInfoSameAsLastDismissed(message, status) {
  return lastDismissedInfo.message === message && lastDismissedInfo.status === status
}

// Clears delayed combo info timeout on page switch
function watchLastPageDisplayChange() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const { timeoutId, callback } = comboPageDelayedAction

        if (timeoutId) {
          clearTimeout(timeoutId)
          comboPageDelayedAction.timeoutId = null;

          if (callback) {
            callback()
            comboPageDelayedAction.callback = null;
          }
        }
      }
    }
  });

  observer.observe(lastComboPage, { attributes: true });
}


function setNewComboTextDisplay(isVisible) {
  newComboTextElement.style.display = isVisible
    ? 'block'
    : 'none';
}

function updateNewComboTextTime(comboTime) {
  newComboTextTimerElement.textContent = ((APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_LENGTH - comboTime) / 1000).toFixed(0)
}

function setLastComboPageInfo(isVisible, message = COMBO_PAGE_INFO_MESSAGES.GENERAL_ERROR, status = 1, isInfoDismissable = false) {
  const iconElement = document.getElementById('last-combo-page-info-icon');
  const infoTextElement = document.getElementById('last-combo-error-text')

  if (isVisible && !isInfoSameAsLastDismissed(message, status)) {
    setItemDisplay(lastComboPageContent, 'none')
    setItemDisplay(lastComboPageInfo, 'initial')
    setErrorIconByStatus(iconElement, status)
    setLastDismissedInfo()
    setLastDisplayedInfo(message, status)
  } else {
    setItemDisplay(lastComboPageContent, 'initial')
    setItemDisplay(lastComboPageInfo, 'none')

    setLastDisplayedInfo()
  }

  isInfoDismissable
    ? setItemDisplay(infoDismissButton, 'initial')
    : setItemDisplay(infoDismissButton, 'none')
    
  infoTextElement.textContent = message
}

function handleLastComboDisplay(
  comboNumbersData,
  tricksData,
  graphData,
  shouldDisplayDate,
  shouldDisplayActions,
) {
  if (
    comboNumbersData &&
    comboNumbersData.mainComboData &&
    comboNumbersData.mainComboData.isIdle
  ) {
    setLastComboPageInfo(true, COMBO_PAGE_INFO_MESSAGES.TRACKER_IDLE, 1);
    return
  } else {
    setLastComboPageInfo(false);
  }

  restoreDefaultUI(shouldDisplayActions)

  ComboNumbersUI.displayComboNumbers(comboNumbersData, shouldDisplayDate)
  TricksUI.displayTricks(tricksData.tricksInCombo, tricksData.comboHistoryHtml)
  GraphsUI.drawComboCharts(graphData.datasets, graphData.timestampArray)

  setHasDisplayedComboDetails(true)
}

function restoreDefaultUI(shouldDisplayActions) {
  const lastComboPage = document.getElementById('last-combo-page')
  lastComboPage.parentElement.replaceChild(lastComboPage, lastComboPage)
  navElementsArray[0].click()
  TricksUI.resetTrickTabsScrollbars()

  if (!shouldDisplayActions) {
    setItemDisplay(deleteHighscoreActionsElement, 'none')
  }
}

function dismissInfoPage() {
  setLastDismissedInfo(lastDisplayedInfo.message, lastDisplayedInfo.status)
  setLastDisplayedInfo()

  setItemDisplay(lastComboPageInfo, 'none')
  setItemDisplay(infoDismissButton, 'none')
  setItemDisplay(lastComboPageContent, 'initial')
}

function init() {
  initNavigation(navElementsArray, tabContentContainersArray)
  TricksUI.init()
  GraphsUI.init()
}

async function displayComboFromFile(game, fileName) {
  try {
    setLastComboPageInfo(true, '', 2, false)
    document.getElementById('navbar-last-combo').click()
    const { stats, tricks, graphs } = await FileService.readSavedComboFile(game, fileName)

    tricks.tricksInCombo = tricks.tricksInCombo.map(trick =>
      new Trick(trick.name, trick.flags, trick.timesUsed)
    )

    setupHighscoreActions(game, fileName)
    handleLastComboDisplay(stats, tricks, graphs, true, true)
    setLastComboPageInfo(false);
  } catch (error) {
    console.error(error)
    setLastComboPageInfo(true, COMBO_PAGE_INFO_MESSAGES.READING_FILE_FAILED, 1, hasDisplayedComboDetails());
  }
}

function setupHighscoreActions(game, fileName) {
  setItemDisplay(deleteHighscoreActionsElement, 'block')

  if (deleteHighscoreListener) {
    deleteHighscoreButtonElement.removeEventListener('click', deleteHighscoreListener)
  }
  
  deleteHighscoreListener = function () {
    deleteHighscoreButtonElement.removeEventListener('click', deleteHighscoreListener)
    deleteHighscore(game, fileName)
  }

  deleteHighscoreButtonElement.addEventListener('click', deleteHighscoreListener)
}

async function deleteHighscore(game, fileName) {
  try {
    setLastComboPageInfo(true, '', 2, false)
    
    const newScores = deleteHighscoreFromAppSavedCombos(game, fileName)
    await FileService.deleteSavedComboFile(game, fileName)
    await FileService.saveHighscoresJson(game, newScores)

    refreshCurrentlyDisplayedHighscores()
    setItemDisplay(deleteHighscoreActionsElement, 'none')

    const successMessage = COMBO_PAGE_INFO_MESSAGES.HIGHSCORE_DELETE_SUCCESS
    const messageStatus = 0

    setLastComboPageInfo(true, successMessage, messageStatus, false);
    
    setComboPageDelayedAction(() => {
      displayDefaultComboPageInfo()
    }, 5000)
    setHasDisplayedComboDetails(false)
  } catch (error) {
    console.error(error)
    setLastComboPageInfo(true, COMBO_PAGE_INFO_MESSAGES.HIGHSCORE_DELETE_FAILED, 1, false);
  }
}

function setComboPageDelayedAction(callback, delay) {
  if (comboPageDelayedAction.timeoutId) {
    clearTimeout(comboPageDelayedAction.timeoutId)
  }

  comboPageDelayedAction.callback = callback

  comboPageDelayedAction.timeoutId = setTimeout(() => {
    callback()
    comboPageDelayedAction.callback = null
  }, delay)
}

function displayDefaultComboPageInfo() {
  let message = COMBO_PAGE_INFO_MESSAGES.TRACKER_NOT_READY
  let status = 3;

  if (hasActiveGameInstance()) {
    message = isComboInProgress()
      ?  COMBO_PAGE_INFO_MESSAGES.TRACKER_IN_PROGRESS
      :  COMBO_PAGE_INFO_MESSAGES.TRACKER_READY
    status = 2;
  }
  
  setLastComboPageInfo(
    true,
    message,
    status,
    hasDisplayedComboDetails()
  );
}

function hasDisplayedComboDetails() {
  return hasComboDetails
}

function setHasDisplayedComboDetails(value) {
  hasComboDetails = value
}

watchLastPageDisplayChange()

export {
  handleLastComboDisplay,
  setNewComboTextDisplay,
  updateNewComboTextTime,
  setLastComboPageInfo,
  init,
  displayComboFromFile,
  hasDisplayedComboDetails,
  setHasDisplayedComboDetails,
  displayDefaultComboPageInfo
}
