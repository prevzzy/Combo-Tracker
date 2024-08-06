import {
  BALANCE_TIME_VALUES,
  ERROR_STRINGS,
  CREATE_A_PARK,
  GAME_PROCESSES,
  GAMES,
} from '../../../utils/constants'
import { 
  formatTimestamp,
  formatScore,
  formatBalancePropertyTime,
  getNumberWithOrdinal,
} from '../../../utils/helpers'
import { colorComboPropertyText, setItemDisplay } from '../../uiHelpers'

const finalScoreElement = document.getElementById('combo-final-score') 
const finalNumbersElement  = document.getElementById('combo-final-numbers')
const mapElement = document.getElementById('combo-map')
const mapDetailsElement = document.getElementById('combo-details-map')
const mapBestScoreElement = document.getElementById('combo-map-best-score')
const generalBestScoreElement = document.getElementById('combo-general-best-score')
const generalBestScoreGameNameElement = document.getElementById('combo-general-best-score-game-name')
const mapTrackedComboElement = document.getElementById('combo-map-tracked-combo')
const generalTrackedComboElement = document.getElementById('combo-general-tracked-combo')
const generalTrackedComboGameNameElement = document.getElementById('combo-general-tracked-combo-game-name')
const comboTrackingSkippedInfo = document.getElementById('combo-tracking-skipped')

const finalTimeElement = document.getElementById('combo-time')
const finalTimeDetailsElement = document.getElementById('combo-details-time')
const grindTimeElement = document.getElementById('combo-grind-time')
const tagLimitElement = document.getElementById('combo-tag-limit')
const tagLimitStatElement = document.getElementById('combo-tag-limit-stat')
const doubleGrindsElement = document.getElementById('combo-double-grinds')
const newGrindsElement = document.getElementById('combo-new-grinds')

const manualTimeElement = document.getElementById('combo-manual-time')
const cheesePenaltyElement = document.getElementById('combo-cheese-penalty')
const pivotPenaltyElement = document.getElementById('combo-pivot-penalty')

const lipTimeElement = document.getElementById('combo-lip-time')
const revertPenaltyElement = document.getElementById('combo-revert-penalty')
const multiplierFromGapsElement = document.getElementById('combo-multi-from-gaps')
const graffitiTagsElement = document.getElementById('combo-graffiti-tags')

function displayComboNumbers({ mainComboData, grindData, manualData, miscData, comboTrackingNumbers }, shouldDisplayDate) { 
  const { game } = mainComboData
  displayFinalNumbers(mainComboData, comboTrackingNumbers, shouldDisplayDate)
  displayGrind(grindData, game)
  displayManual(manualData)
  displayMisc(miscData)
}

function displayFinalNumbers(mainComboData, comboTrackingNumbers, shouldDisplayDate) {
  const {
    score,
    basePoints,
    multiplier,
    comboTime,
    mapName,
    date,
    game,
  } = mainComboData


  finalScoreElement.textContent = formatScore(score)
  finalNumbersElement.textContent = `${formatScore(basePoints)} x ${multiplier}`

  const finalTime = formatTimestamp(comboTime)
  finalTimeElement.textContent = finalTime
  finalTimeDetailsElement.textContent = finalTime
  
  setComboTrackingSkippedInfoElement(comboTrackingNumbers, mapName)

  displayComboTrackingInfo(comboTrackingNumbers, game)
  displayComboDate(shouldDisplayDate && date)

  mapElement.textContent = mapName
  mapDetailsElement.textContent = mapName
}

function displayComboTrackingInfo(comboTrackingNumbers, game) {
  const {
    mapComboNumber,
    mapBestScoreNumber,
    generalComboNumber,
    generalBestScoreNumber,
  } = comboTrackingNumbers

  const trackingNumbersDataArray = [
    { element: generalTrackedComboElement, number: generalComboNumber },
    { element: mapTrackedComboElement, number: mapComboNumber },
    { element: generalBestScoreElement, number: generalBestScoreNumber },
    { element: mapBestScoreElement, number: mapBestScoreNumber },
  ]

  trackingNumbersDataArray.forEach((data) =>
    handleComboTrackingNumberDisplay(data.element, data.number)
  )

  displayGameName(game)
}

function displayGameName(game) {
  const gameElements = [generalBestScoreGameNameElement, generalTrackedComboGameNameElement]

  gameElements.forEach((gameElement) => {
  gameElement.className = ''

    switch(game) {
      case GAME_PROCESSES.RETHAWED:
        gameElement.classList.add('text-rethawed')
        gameElement.textContent = GAMES.RETHAWED
        break;
      case GAME_PROCESSES.THUG2:
        gameElement.classList.add('text-thug2')
        gameElement.textContent = GAMES.THUG2
        break;
      case GAME_PROCESSES.THAW:
        gameElement.classList.add('text-thaw')
        gameElement.textContent = GAMES.THAW
        break;
      default:
        gameElement.classList.add('text-thugpro')
        gameElement.textContent = GAMES.THUGPRO
        break;
    }
  })
}

function getComboTrackingSkippedInfo(
  comboTrackingNumbers,
  mapName,
) {
  if (mapName === ERROR_STRINGS.UNKNOWN_MAP) {
    return 'Combos on unknown maps can\'t be saved.'
  } else if (mapName === CREATE_A_PARK) {
    return 'Combos on Create-A-Parks can\'t be saved.'
  } else if (Object.keys(comboTrackingNumbers).every(key => !comboTrackingNumbers[key])) {
    return 'Final score was too small to save combo data.'
  }
}

function setComboTrackingSkippedInfoElement(
  comboTrackingNumbers,
  mapName,
) {
  const message = getComboTrackingSkippedInfo(comboTrackingNumbers, mapName)

  if (message) {
    comboTrackingSkippedInfo.textContent = message
    setItemDisplay(comboTrackingSkippedInfo, 'inline')
    setItemDisplay(generalTrackedComboGameNameElement, 'none')
  } else {
    setItemDisplay(comboTrackingSkippedInfo, 'none')
    setItemDisplay(generalTrackedComboGameNameElement, 'inline')
  }
}

function handleComboTrackingNumberDisplay(element, number) {
  if (Number(number) > 0) {
    element.textContent = getNumberWithOrdinal(number);
    element.parentElement.style.display = 'block';
  } else {
    element.parentElement.style.display = 'none';
  }
}

function displayComboDate(date) {
  document.getElementById('new-combo-date').textContent = date ? ` Done on ${date}` : ''
}

function displayGrind({ grindTime, newGrindsSavedTime, doubleGrindsAddedTime, tagLimitAddedTime }, game) {
  colorComboPropertyText(tagLimitElement, tagLimitAddedTime, 6)
  colorComboPropertyText(doubleGrindsElement, doubleGrindsAddedTime, 3 * BALANCE_TIME_VALUES.DOUBLE_GRIND_TIME_PENALTY)
  colorComboPropertyText(newGrindsElement, newGrindsSavedTime, 1, -0.0001)

  grindTimeElement.textContent = formatBalancePropertyTime(grindTime)
  newGrindsElement.textContent = formatBalancePropertyTime(newGrindsSavedTime)
  doubleGrindsElement.textContent = formatBalancePropertyTime(doubleGrindsAddedTime, true)
  tagLimitElement.textContent = formatBalancePropertyTime(tagLimitAddedTime.toFixed(2), true)

  setTagLimitStatDisplay(game)
}

function setTagLimitStatDisplay(game) {
  if (game === GAME_PROCESSES.RETHAWED || game === GAME_PROCESSES.THAW) {
    setItemDisplay(tagLimitStatElement, 'none')
  } else {
    setItemDisplay(tagLimitStatElement, 'block')
  }
}

function displayManual({ manualTime, manualCheeseAddedTime, pivotsAddedTime }) {
  colorComboPropertyText(cheesePenaltyElement, manualCheeseAddedTime, 3 * BALANCE_TIME_VALUES.MANUAL_CHEESE_TIME_PENALTY)
  colorComboPropertyText(pivotPenaltyElement, pivotsAddedTime, 5 * BALANCE_TIME_VALUES.PIVOT_TIME_PENALTY)

  manualTimeElement.textContent = formatBalancePropertyTime(manualTime)
  cheesePenaltyElement.textContent = formatBalancePropertyTime(manualCheeseAddedTime, true)
  pivotPenaltyElement.textContent = formatBalancePropertyTime(pivotsAddedTime, true)
}

function displayMisc({ lipTime, maxRevertPenalty, multiplierFromGaps, graffitiTags }) {
  colorComboPropertyText(revertPenaltyElement, maxRevertPenalty, 5, 4)

  lipTimeElement.textContent = formatBalancePropertyTime(lipTime)
  revertPenaltyElement.textContent = maxRevertPenalty
  multiplierFromGapsElement.textContent = multiplierFromGaps
  graffitiTagsElement.textContent = graffitiTags
}

export {
  displayComboNumbers,
}
