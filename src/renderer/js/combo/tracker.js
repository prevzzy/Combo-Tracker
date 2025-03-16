import {
  BALANCE_TIME_VALUES,
  APP_CONFIG_VALUES,
  ERROR_STRINGS,
  COMBO_PAGE_INFO_MESSAGES,
} from '../utils/constants'
import { formatTimestamp } from '../utils/helpers'
import { Balance } from './balance'
import { Score } from './score'
import { TrickHistory } from './trickHistory'
import { screenshotLastComboScore } from '../screenshots/screenshots'
import * as ComboSaver from '../combo/comboSaver'
import * as NewMapModalUI from '../ui/uiNewMapModal'
import * as LastComboUI from '../ui/lastCombo/uiLastCombo'
import * as HighscoresUI from '../ui/uiHighscores'
import * as SettingsUI from '../ui/uiSettings'
import * as MemoryController from '../game/memory'
import * as SavedCombosService from '../combo/savedCombosService'
import { log } from '../debug/debugHelpers'
import { setupGlobalError } from '../ui/globalError'
import { getHookedGameProcessName } from '../game/gameProcessService'
import { handleSendingDataToListeners } from './trackerBridge/trackerBridgeEvents'
import { requestCtObserverSendMessage } from '../events/outgoingIpcEvents'
import { shouldSendCtObserverMessage } from '../online/ctObserver'

let finalScore = null
let comboStartTime = 0
let comboTime = 0
let timestampArray = []
let balance = new Balance()
let score = new Score()
let trickHistory = new TrickHistory()
let datasetsUpdatingInterval = null
let sendDataToCtObserverInterval = null
let trackingInterval = null
let mapScriptName = null
let comboTrackingNumbers = {
  mapComboNumber: null,
  mapBestScoreNumber: null,
  generalComboNumber: null,
  generalBestScoreNumber: null,
}
let isSuspended = true
let shouldRunIdleDetector = true
let game = null
let isTrackerRunning = false

function isComboTrackingSuspended() {
  return isSuspended
}

function shouldSuspendComboTracking(value) {
  isSuspended = value
}

function getFinalNumbersData(isLanded) {
  return {
    score: finalScore,
    basePoints: score.calculateFinalBasePoints(isLanded),
    multiplier: score.getMultiplier(),
    comboTime,
    date: new Date().toLocaleString(),
  }
}

function getFinalBalanceData() {
  return {
    grindData: {
      grindTime: balance.grindTime,
      newGrindsSavedTime: balance.newGrindsAmount * BALANCE_TIME_VALUES.NEW_GRIND_TIME_AWARD,
      doubleGrindsAddedTime: balance.doubleGrindsAmount * BALANCE_TIME_VALUES.DOUBLE_GRIND_TIME_PENALTY,
      tagLimitAddedTime: balance.tagLimitAddedTime
    },
    manualData: {
      manualTime: balance.manualTime,
      manualCheeseAddedTime: balance.manualCheeseAmount * BALANCE_TIME_VALUES.MANUAL_CHEESE_TIME_PENALTY,
      pivotsAddedTime: balance.pivotsAmount * BALANCE_TIME_VALUES.PIVOT_TIME_PENALTY
    },
  }
}

function getMiscData() {
  return {
    lipTime: balance.lipTime,
    maxRevertPenalty: score.maxRevertPenalty,
    multiplierFromGaps: trickHistory.gapsHit,
    graffitiTags: score.graffitiTags,
    bonusBasePoints: score.getBonusBasePoints(),
  }
}

function getOverlayComboData() {
  const {
    manualBalanceArrowPosition,
    grindBalanceArrowPosition,
    lipBalanceArrowPosition,
    balanceTrickType,
  } = balance;

  return {
    manualBalanceArrowPosition,
    grindBalanceArrowPosition,
    lipBalanceArrowPosition,
    balanceTrickType,
    multiplier: score.getMultiplier(),
    basePoints: score.getBasePoints(),
    score: score.getFinalScore(),
  }
}

function getComboNumbersData(isIdle, isLanded) {
  const { grindData, manualData } = getFinalBalanceData()
  const miscData = getMiscData()
  const mainComboData = {
    game,
    ...getFinalNumbersData(isLanded),
    isIdle,
    isLanded: isLanded,
    mapName: SavedCombosService.getMapName(game, mapScriptName) || ERROR_STRINGS.UNKNOWN_MAP
  }

  return {
    mainComboData,
    grindData,
    manualData,
    miscData,
    comboTrackingNumbers,
  }
}

function getTricksData() {
  return {
    tricksInCombo: trickHistory.getTricksInComboArray(),
    comboHistoryHtml: trickHistory.getComboHistoryAsHTML(),
  }
}

function getAllDatasets() {
  return {
    scoreDataset: score.scoreDataset,
    basePointsDataset: score.basePointsDataset, 
    multiplierDataset: score.multiplierDataset, 
    revertPenaltyDataset: score.revertPenaltyDataset,
    manualTimeDataset: balance.manualTimeDataset, 
    grindTimeDataset: balance.grindTimeDataset,
    lipTimeDataset: balance.lipTimeDataset
  }
}

function getGraphData() {
  return {
    datasets: {
      ...getAllDatasets(),
    },
    timestampArray,
  }
}

function resetTracker() {
  finalScore = null
  mapScriptName = null
  comboStartTime = 0
  comboTime = 0
  timestampArray = []
  balance = new Balance()
  score = new Score()
  trickHistory = new TrickHistory()
  shouldRunIdleDetector = true
  comboTrackingNumbers = {
    mapComboNumber: null,
    mapBestScoreNumber: null,
    generalComboNumber: null,
    generalBestScoreNumber: null,
  }
  game = null,
  clearInterval(trackingInterval)
  clearInterval(datasetsUpdatingInterval)
  clearInterval(sendDataToCtObserverInterval)
}

async function listenForComboStart() {
  if (isComboTrackingSuspended()) {
    isTrackerRunning = false;
    return
  }

  setTimeout(async () => {
    try {
      // log('base: ', MemoryController.getBasePoints())
      // log('multi: ', MemoryController.getMultiplier())
      // log('grind: ', MemoryController.getGrindTime())
      // log('manual: ', MemoryController.getManualTime())
  
      if (isComboInProgress()) {
        log('start')
        await startTracking(Date.now())
      } else {
        await listenForComboStart()
      }
    } catch(error) {
      console.error(error)
    }
  }, 16)
}

function displayInProgressInfoWithDelay(lastComboStart) {
  setTimeout(() => {
    if (comboStartTime === lastComboStart) {
      LastComboUI.setLastComboPageInfo(true, COMBO_PAGE_INFO_MESSAGES.TRACKER_IN_PROGRESS, 2, false);
      LastComboUI.setNewComboTextDisplay(false)
    }
  }, APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_LENGTH)
}

async function startTracking(startTime = Date.now()) {
  comboStartTime = startTime
  mapScriptName = MemoryController.getCurrentMapScript()
  game = getHookedGameProcessName()

  LastComboUI.setNewComboTextDisplay(true)
  displayInProgressInfoWithDelay(comboStartTime)
  startDatasetUpdating()
  runIdleDetector(null, null, null, null, comboStartTime)
  await track()

  return

  // TODO: unused for now
  sendDataToCtObserver()
}

function sendDataToCtObserver() {
  return

  // TODO: unused for now
  sendDataToCtObserverInterval = setInterval(() => {
    if (!shouldSendCtObserverMessage()) {
      return;
    }

    const {
      grindBalanceArrowPosition,
      lipBalanceArrowPosition,
      manualBalanceArrowPosition,
      balanceTrickType,
      score,
      multiplier,
      basePoints
    } = getOverlayComboData();

    let balancePosition
    switch(balanceTrickType) {
      case 'GRIND':
        balancePosition = grindBalanceArrowPosition
        break;
      case 'MANUAL':
        balancePosition = manualBalanceArrowPosition
        break;
      case 'LIP':
        balancePosition = lipBalanceArrowPosition
        break;
      default:
        break;
    }
  
    requestCtObserverSendMessage({
      score,
      multiplier,
      basePoints,
      balanceTrickType,
      balancePosition
    })
  }, 34)
}

function startDatasetUpdating() {
  datasetsUpdatingInterval = setInterval(() =>  {
    if (isComboInProgress()) {
      updateDatasets()
    } 
  }, 1000)
}

async function track() {
  trackingInterval = setInterval(async () => {
    if (isComboInProgress()) {
      updateComboValues()
      handleSendingDataToListeners()
    } else {
      clearInterval(sendDataToCtObserverInterval)
      clearInterval(trackingInterval)
      clearInterval(datasetsUpdatingInterval)
      await finishTrackingCurrentCombo()
    }
  }, 16)
}

async function finishTrackingCurrentCombo(isIdle) {
  // TODO: condition for clearing the combo display; unused for now
  // if (true) {
  //   cleanOverlayComboDisplay();
  // }

  if (isComboLongEnoughToDisplay() && !isComboTrackingSuspended()) {
    handleSendingDataToListeners()
    await handleComboFinish(isIdle)
  } else {
    restart()
  }
}

function cleanOverlayComboDisplay() {
  const { score, multiplier, basePoints } = getOverlayComboData();
  requestCtObserverSendMessage({
    score,
    multiplier,
    basePoints,
    isLanded: isComboLanded()
  })
}

async function handleComboFinish(isIdle) {
  shouldRunIdleDetector = false

  if (!isMapKnown() && !isIdle) {
    await NewMapModalUI.showNewMapModal(
      game,
      MemoryController.getCurrentMapScript(),
      async (shouldSaveCombo) => await handlePostComboLogic(game, isIdle, shouldSaveCombo, false) // shouldSaveCombo means that user submitted new map in modal
    )
  } else {
    handlePostComboLogic(game, isIdle, true, true)
  }
}

function isMapKnown() {
  return SavedCombosService.getMapName(game, mapScriptName) ? true : false
}

async function handlePostComboLogic(game, isIdle, shouldSaveCombo, shouldScreenshotCombo) {
  if (!isComboBigEnoughToDisplay()) {
    LastComboUI.setLastComboPageInfo(true, COMBO_PAGE_INFO_MESSAGES.TRACKER_FAIL, 1);
    restart()
    return
  }

  const isLanded = isComboLanded()
  finalScore = score.finishCombo(isComboLanded())

  const comboData = {
    stats: getComboNumbersData(isIdle, isLanded),
    tricks: getTricksData(),
    graphs: getGraphData()
  }

  if (!isIdle && shouldSaveCombo && isComboBigEnoughToSave()) {
    await handleSavingComboData(game, comboData, shouldScreenshotCombo, isLanded)
  }

  LastComboUI.handleLastComboDisplay(
    comboData.stats,
    comboData.tricks,
    comboData.graphs,
    false
  )

  restart()
}

async function handleSavingComboData(game, comboData, shouldScreenshotCombo, isLanded) {
  const finalNumbersData = getFinalNumbersData(isLanded)

  try {
    let comboSaverResponse = await ComboSaver.saveNewCombo(
      game,
      mapScriptName,
      comboData,
      checkBailedComboCondition()
    )

    comboData.stats.comboTrackingNumbers = { ...comboSaverResponse }

    if (
      shouldScreenshotCombo &&
      checkBailedComboCondition() &&
      checkComboScreenshotCondition(
        finalNumbersData.score,
        comboData.stats.comboTrackingNumbers.mapBestScoreNumber,
        comboData.stats.comboTrackingNumbers.generalBestScoreNumber
      )
    ) {
      screenshotLastComboScore(game, finalScore, comboStartTime, mapScriptName)
    }
  } catch (error) {
    console.error(error)
  }
  
  HighscoresUI.refreshCurrentlyDisplayedHighscores();
}

function restart() {
  log('restart')

  LastComboUI.setNewComboTextDisplay(false)

  resetTracker()
  setTimeout(async () => {
    await listenForComboStart()
  }, 250)
}

function isComboInProgress() {
  // There is an in-game bug where if you do a manual not longer than 0.27s and then get off board, the game won't reset the manual balance timer. Despite being off board with 0 multiplier and 0 base, you will still (kinda) be in a combo. Technically this means that this function may return incorrect value, which can cause combo tracking logic to loop itself. Not a big deal since idle detector will end the combo every 10 seconds anyways.

  if (
    !isComboTrackingSuspended() &&
    (MemoryController.getRevertPenalty() < 10 && MemoryController.getRevertPenalty() >= 0) &&
    (MemoryController.getMultiplier() > 0 ||
    MemoryController.getBasePoints() > 0 ||
    MemoryController.getManualTime() > 0)
  ) {  
    return !score.hasNewComboStartedUnnoticed()
  } 
  return false
}

async function runIdleDetector(
  prevBasePoints,
  prevMultiplier,
  prevGrindTime,
  prevManualTime,
  prevComboStartTime
) {
  if (shouldRunIdleDetector && isComboInProgress() && prevComboStartTime === comboStartTime) {
    const basePoints = score.basePoints
    const multiplier = score.multiplier
    const grindTime = balance.grindTime
    const manualTime = balance.manualTime

    // log("PREV: ", prevBasePoints, prevMultiplier, prevGrindTime, prevManualTime, prevComboStartTime)
    // log("CURRENT: ", basePoints, multiplier, grindTime, manualTime, comboStartTime)

    if (
      prevBasePoints === basePoints &&
      prevMultiplier === multiplier &&
      prevGrindTime === grindTime &&
      prevManualTime === manualTime
    ) {
      await finishTrackingCurrentCombo(true)
      log('IDLE')
    } else {
      setTimeout(() => {
        runIdleDetector(basePoints, multiplier, grindTime, manualTime, prevComboStartTime)
      }, 5000)
    }
  }
}

function updateDatasets() {
  balance.updateDatasets()
  score.updateDatasets()

  timestampArray.push(formatTimestamp(comboTime))
}

function isComboLongEnoughToDisplay() {
  // Display combos only longer than 15 seconds. This avoids possibility of losing data of a good combo, because of some random gap or kissed the rail right after the previous combo has ended. 

  return Date.now() - comboStartTime > APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_LENGTH
}

function isComboBigEnoughToSave() {
  // value of MINIMAL_SAVEABLE_COMBO_SCORE is completely arbitrary
  return score.getScore() >= APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_SCORE
}

function isComboBigEnoughToDisplay() {
  return score.getScore() > 0 && score.getBasePoints() > 0 && score.getMultiplier() > 0
}

function isComboLanded() {
  // Note that this won't always work with 'Always special' cheat turned on (although it still works most of the time, because bailing a combo resets special combo meter for a few frames anyway)
  const specialMeterNumericValue = MemoryController.getSpecialMeterNumericValue()
  
  return specialMeterNumericValue > 0 && specialMeterNumericValue <= 3000
}

function checkBailedComboCondition() {
  const isBailedComboAllowed = SettingsUI.getSettingValue('allow-bailed-combos')
  return isBailedComboAllowed || !isBailedComboAllowed && isComboLanded()
}

function checkComboScreenshotCondition(score, mapBestScoreNumber, generalBestScoreNumber) {
  const isScreenshottingEnabled = SettingsUI.getSettingValue('enable-screenshots')
  const minimalScore = Number(SettingsUI.getSettingValue('screenshots-minimal-score'))

  return isScreenshottingEnabled &&
    minimalScore &&
    !Number.isNaN(minimalScore) &&
    score > minimalScore && (
    mapBestScoreNumber === 1 ||
    generalBestScoreNumber <= 5 && generalBestScoreNumber > 0
  )
}

function updateComboValues() {
  score.update()
  balance.update(score)
  trickHistory.update()

  updateComboTime(Date.now())
}

function updateComboTime(timestamp) {
  comboTime = timestamp - comboStartTime

  if (comboTime <= APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_LENGTH) {
    LastComboUI.updateNewComboTextTime(comboTime)
  }
}

async function resumeComboTracking() {
  if (!isSuspended || isTrackerRunning) {
    return
  }

  log('resuming ComboTracker')

  shouldSuspendComboTracking(false)
  await listenForComboStart()
  setupGlobalError(false)
  LastComboUI.displayDefaultComboPageInfo()
  isTrackerRunning = true;
}

export function getBalance() {
  return balance;
}

export {
  listenForComboStart,
  shouldSuspendComboTracking,
  isComboTrackingSuspended,
  resumeComboTracking,
  isComboInProgress,
}
