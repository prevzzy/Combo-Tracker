import { TRICK_FILTERS, TrickFilteringService } from './trickFiltering'
import { initNavigation } from '../../uiNavigation'

let tricksInComboArray = []

let trickHistoryClickListener;
let trickUsageClickListener;

const allTabsContainer = document.getElementById('combo-details-tricks-tabs-container')
const allNavElementsContainer = document.getElementById('combo-details-tricks-nav-container')

const tabContentContainersArray = Array.from(allTabsContainer.children)
const navElementsArray = Array.from(allNavElementsContainer.children)

const trickUsageButtonElement = document.getElementById('combo-details-trick-usage-button')
const trickHistoryButtonElement = document.getElementById('combo-details-trick-history-button')

const trickUsageContainer = document.getElementById('trick-usage-container')
const comboHistoryContainer = document.getElementById('trick-history-container')
const trickSearchInput = document.getElementById('trick-search')
const totalTricksUsedElement = document.getElementById('combo-details-total-tricks-used')

const sortingRadioButtons = document.querySelectorAll('input[name="trick-sorting-radios"]')
const filteringCheckBoxes = document.querySelectorAll('.trick-filtering-checkbox')

const trickFilteringService = new TrickFilteringService(
  Array.from(sortingRadioButtons).find(radio => radio.checked).value,
  Array.from(filteringCheckBoxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value)
)

function resetTrickTabsScrollbars() {
  const trickHistoryContent = document.getElementById('trick-history')
  trickHistoryContent.parentElement.replaceChild(trickHistoryContent, trickHistoryContent)
  trickUsageContainer.parentElement.replaceChild(trickUsageContainer, trickUsageContainer)
}

function initFilters() {
  sortingRadioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      displayTrickUsage(
        trickFilteringService.sortTricks(e.target.value, tricksInComboArray, trickSearchInput.value)
      )
    })
  })

  filteringCheckBoxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      displayTrickUsage(
        trickFilteringService.filterTricks(e.target.value, tricksInComboArray, trickSearchInput.value)
      )
    })
  })

  trickSearchInput.addEventListener('input', (e) => {
    displayTrickUsage(
      trickFilteringService.applyFilters(tricksInComboArray, e.target.value)
    )
  })
}

function getTrickColorClass(trickObject) {
  if (trickObject.isGap()) {
    return 'text-gap'
  }
  if (trickObject.isSpecial()) {
    return 'text-special'
  }
  return 'text-light'
}

function setupDisplayingTricksTotalOnSubPageSwitch(buttonElement, oldListener, tricks) {
  if (oldListener) {
    buttonElement.removeEventListener('click', oldListener);
  }
  
  const newListener = function() {
    displayTricksTotalAmount(tricks)
  }
  buttonElement.addEventListener('click', newListener)

  return newListener;
}

function displayTricks(tricksInCombo, comboHistoryHtml) {
  tricksInComboArray = [...tricksInCombo]
  const filteredTricks = trickFilteringService.filterTricks(undefined, tricksInComboArray);

  displayTrickUsage(filteredTricks)
  displayComboHistory(comboHistoryHtml, tricksInComboArray)
}

function displayTricksTotalAmount(tricksInCombo = []) {
  const totalTricks = tricksInCombo.reduce((currentSum, currentTrick) => {
    if (!currentTrick?.timesUsed) {
      return currentSum;
    }

    return currentSum + currentTrick.timesUsed;
  }, 0)

  totalTricksUsedElement.textContent = totalTricks;
}

function displayTrickUsage(tricksInCombo) {
  trickUsageClickListener = setupDisplayingTricksTotalOnSubPageSwitch(
    trickUsageButtonElement,
    trickUsageClickListener,
    tricksInCombo
  );
  displayTricksTotalAmount(tricksInCombo);

  trickUsageContainer.innerHTML = ''
  const template = document.getElementById('trick-usage-entry-template')
  const shouldColorTrickUsage = trickFilteringService.activeFilters[TRICK_FILTERS.SHOW_SWITCH]

  tricksInCombo && tricksInCombo.forEach((trickObject) => {
    if (trickObject.isNonMultiTrick()) {
      return;
    }

    const trickUsageEntryElement = document.importNode(template.content, true);
    const nameElement = trickUsageEntryElement.querySelector('.trick-usage-entry-name')
    const countElement = trickUsageEntryElement.querySelector('.trick-usage-entry-count')
    
    nameElement.textContent = trickObject.name
    countElement.textContent = trickObject.timesUsed
    nameElement.classList.add(getTrickColorClass(trickObject))

    if (shouldColorTrickUsage && trickObject.isDegradeable()) {
      countElement.classList.add(trickObject.timesUsed > 10 && 'text-danger')
    }

    trickUsageContainer.appendChild(trickUsageEntryElement)
  })
}

function displayComboHistory(comboHistoryHtml, tricksInCombo) {
  comboHistoryContainer.innerHTML = comboHistoryHtml;
  trickHistoryClickListener = setupDisplayingTricksTotalOnSubPageSwitch(
    trickHistoryButtonElement,
    trickHistoryClickListener,
    tricksInCombo
  );
}

function init() {
  initFilters()
  initNavigation(navElementsArray, tabContentContainersArray)
}

export {
  displayTricks,
  init,
  getTrickColorClass,
  resetTrickTabsScrollbars,
}
