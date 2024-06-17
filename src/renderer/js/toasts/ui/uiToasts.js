import { formatScore } from '../../utils/helpers'
import { APP_CONFIG_VALUES } from '../../utils/constants'
import { getNumberWithOrdinal } from '../../utils/helpers'
import { TOAST_EVENT_TYPES } from '../../../../main/events/toastEventTypes'

const containerElement = document.getElementById('toast-container')
const contentElement = document.getElementById('toast-content')
const titleElement = document.getElementById('toast-title')

const TOAST_WINDOW_WIDTH = 300

function createElementFromTemplate(templateId) {
  const template = document.getElementById(templateId)
  return document.importNode(template.content, true);
}

function setToastTitle(title) {
  titleElement.textContent = title
  titleElement.classList.add('p-3')
}

function clearToastContent() {
  titleElement.innerHTML = ''
  contentElement.innerHTML = ''
  titleElement.classList.remove('p-3')
}

function changeToastContentXPosition(xOffsetStart, xOffsetEnd) {
  containerElement.animate(
    [
      { transform: `translateX(${xOffsetStart}px)` },
      { transform: `translateX(${xOffsetEnd}px)` }
    ],
    {
      duration: 150,
      iterations: 1,
      easing: 'ease-in',
      fill: 'forwards',
    }
  )
}

function displayCurrentMapHighscores(payload) {
  const {
    mapName,
    scores,
    shouldDisplayScoreMapName
  } = payload

  if (!Array.isArray(scores)) {
    return
  }

  let mapNameToDisplay = mapName

  if (mapName.length > APP_CONFIG_VALUES.MAX_MAP_NAME_INPUT_LENGTH) {
    mapNameToDisplay = mapName.slice(0, APP_CONFIG_VALUES.MAX_MAP_NAME_INPUT_LENGTH) + '...'
  }

  setToastTitle(mapNameToDisplay)

  if (scores.length === 0) {
    contentElement.innerHTML = `
      <div class="text-center text-light px-3 pb-3">No highscores yet!</div>
    `
    return
  }
  
  const bestScores = scores.slice(0, 5)
  
  bestScores.forEach((score, i) => {
    const highscoreElement = createElementFromTemplate('toast-highscores-list-template');
    drawHighscoreNumbers(highscoreElement, score, i + 1, shouldDisplayScoreMapName)
    contentElement.appendChild(highscoreElement)
  })
}

function drawHighscoreNumbers(parentElement, score, standing, shouldDisplayScoreMapName) {
  const standingElement = parentElement.querySelectorAll('.toast-highscore-standing')
  const scoreElement = parentElement.querySelectorAll('.toast-highscore-score')
  const baseElement = parentElement.querySelectorAll('.toast-highscore-base')
  const multiplierElement = parentElement.querySelectorAll('.toast-highscore-multiplier')

  if (shouldDisplayScoreMapName) {
    const mapNameElement = parentElement.querySelectorAll('.toast-score-map-name')
    mapNameElement[0].textContent = score.mapName
  }

  standingElement[0].textContent = standing
  scoreElement[0].textContent = formatScore(score.score)
  baseElement[0].textContent = formatScore(score.basePoints)
  multiplierElement[0].textContent = score.multiplier
}

function displayNewHighscoreInfo(payload) {
  const {
    generalBestScoreNumber,
    mapBestScoreNumber,
    mapName,
    game,
    allHighscoresPeekHotkey,
    mapHighscoresPeekHotkey,
  } = payload

  if (!(Number(mapBestScoreNumber) > 0)) {
    return
  }

  setToastTitle('NEW HIGHSCORE!')

  const newHighscoreToast = createElementFromTemplate('toast-new-highscore');
  const generalBestScoreElement = newHighscoreToast.querySelectorAll('.toast-general-best-score')[0]
  const gameNameElement = newHighscoreToast.querySelectorAll('.toast-general-best-score-game-name')[0]
  const mapBestScoreElement = newHighscoreToast.querySelectorAll('.toast-map-best-score')[0]
  
  const bestNumbersData = [
    { element: generalBestScoreElement, number: generalBestScoreNumber },
    { element: mapBestScoreElement, number: mapBestScoreNumber },
  ]

  bestNumbersData.forEach((numberData) => handleComboTrackingNumberDisplay(numberData))
  newHighscoreToast.querySelectorAll('.toast-map-name')[0].textContent = mapName
  newHighscoreToast.querySelectorAll('.all-highscores-peek-hotkey')[0].textContent = allHighscoresPeekHotkey
  newHighscoreToast.querySelectorAll('.map-highscores-peek-hotkey')[0].textContent = mapHighscoresPeekHotkey

  gameNameElement.textContent = game;
  contentElement.appendChild(newHighscoreToast)
}

function handleComboTrackingNumberDisplay({ element, number }) {
  if (Number(number) > 0 && Number(number) < 6) {
    element.textContent = getNumberWithOrdinal(number);
    element.parentElement.style.display = 'block';
  } else {
    element.parentElement.style.display = 'none';
  }
}

function displayNewMapAlert() {
  const newMapElement = createElementFromTemplate('toast-new-map')
  setToastTitle('NEW MAP DETECTED')
  contentElement.appendChild(newMapElement)
}

function displayToast(toastEventType, payload) {
  clearToastContent()

  switch(toastEventType) {
    case TOAST_EVENT_TYPES.MAP_HIGHSCORES:
      displayCurrentMapHighscores(payload)
      break
    case TOAST_EVENT_TYPES.NEW_BEST_SCORE:
      displayNewHighscoreInfo(payload)
      break
    case TOAST_EVENT_TYPES.NEW_MAP_DETECTED:
      displayNewMapAlert(payload)
      break
    default:
      return
  }

  changeToastContentXPosition(TOAST_WINDOW_WIDTH, 0)
}

export {
  changeToastContentXPosition,
  displayToast,
}
