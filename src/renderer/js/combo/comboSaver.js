import bs from 'binary-search'
import { APP_CONFIG_VALUES, CREATE_A_PARK } from '../utils/constants'
import { requestNewBestScoreToast } from '../events/outgoingIpcEvents'
import * as FileService from '../files/fileService'
import * as LastComboUI from '../ui/lastCombo/uiLastCombo'
import * as SavedCombosService from '../combo/savedCombosService'
import { getUniqueComboId } from '../utils/helpers'

async function saveNewCombo(mapScriptName, comboData, hasPassedBailedComboCondition) {
  const savedCombos = SavedCombosService.getSavedCombos()
  if (!(savedCombos && savedCombos.mapCategories)) {
    return
  }

  let fullDataFileName
  let mapComboNumber
  let mapBestScoreNumber
  let generalComboNumber
  let generalBestScoreNumber
  const mapName = SavedCombosService.getMapName(mapScriptName)

  if (mapName === CREATE_A_PARK) {
    return {
      mapComboNumber,
      generalComboNumber,
      mapBestScoreNumber,
      generalBestScoreNumber,
    }
  }

  for (const mapCategory in savedCombos.mapCategories) {
    if (savedCombos.mapCategories[mapCategory][mapScriptName]) {
      const map = savedCombos.mapCategories[mapCategory][mapScriptName]

      if (!map.scores) {
        map.scores = []
      }

      ;({
        fullDataFileName,
        comboNumber: generalComboNumber,
        bestScoreNumber: generalBestScoreNumber,
      } = handleComboSavingLogic(savedCombos.allMaps, comboData, hasPassedBailedComboCondition, false))
      ;({
        fullDataFileName,
        comboNumber: mapComboNumber,
        bestScoreNumber: mapBestScoreNumber,
      } = handleComboSavingLogic(map, comboData, hasPassedBailedComboCondition, true))

      if (comboData.stats) {
        comboData.stats.comboTrackingNumbers = {
          mapComboNumber,
          generalComboNumber,
        }
      }

      break
    }
  }

  if (Number(mapBestScoreNumber) > 0 && Number(mapBestScoreNumber) < 6) {
    requestNewBestScoreToast(
      generalBestScoreNumber,
      mapBestScoreNumber,
      mapName,
    )
  }

  LastComboUI.setLastComboPageInfo(true, 'Saving last combo...', 2, false)
  if (fullDataFileName) {
    await FileService.saveFullComboData(comboData, fullDataFileName)
  }
  await FileService.saveHighscoresJson(savedCombos)
  LastComboUI.setLastComboPageInfo()


  return {
    mapComboNumber,
    generalComboNumber,
    mapBestScoreNumber,
    generalBestScoreNumber,
  }
}

function handleComboSavingLogic(
  mapData,
  comboData,
  hasPassedBailedComboCondition,
  shouldRemoveOldScoreFile
) {
  let fullDataFileName
  const score = comboData.stats.mainComboData.score
  const comboNumber = getCombosTrackedValue(mapData)
  const bestScoreNumber = hasPassedBailedComboCondition && getBestScoreNumber(mapData.scores, comboData)
  mapData.combosTracked = comboNumber
  mapData.timeSpent = getTimeSpentValue(mapData, comboData.stats.mainComboData.comboTime)

  if (hasPassedBailedComboCondition && isNewScoreWorthSaving(mapData.scores, score)) {
    fullDataFileName = getUniqueComboId(score, comboData.stats.mainComboData.mapName)
    mapData.scores = saveNewComboToScoresArray(
      [...mapData.scores], comboData, fullDataFileName, shouldRemoveOldScoreFile
    )
  }

  return { fullDataFileName, comboNumber, bestScoreNumber }
}

function getCombosTrackedValue(obj) {
  return Number.isInteger(obj.combosTracked)
    ? obj.combosTracked + 1
    : 1
}

function getTimeSpentValue(obj, timeToAdd) {
  return Number.isInteger(obj.timeSpent)
    ? obj.timeSpent + Math.ceil(timeToAdd / 1000)
    : Math.ceil(timeToAdd / 1000)
}

function getBestScoreNumber(scores, comboData) {
  const bestScoreNumber = getIndexToInsertAtNewItemInSortedArray(scores, comboData.stats.mainComboData, 'score') + 1

  if (bestScoreNumber > APP_CONFIG_VALUES.MAX_SCORES_PER_MAP) {
    return undefined
  }
  return bestScoreNumber
}

function saveNewComboToScoresArray(scores, comboData, fullDataFileName, shouldRemoveOldScoreFile) {
  const {
    stats: {
      mainComboData,
      grindData,
      manualData,
    }
  } = comboData

  const scoreToSave = {
    score: mainComboData.score,
    basePoints: mainComboData.basePoints,
    multiplier: mainComboData.multiplier,
    comboTime: mainComboData.comboTime,
    mapName: mainComboData.mapName,
    date: mainComboData.date,
    grindTime: grindData.grindTime,
    manualTime: manualData.manualTime,
    fullDataFileName,
  }

  const insertAt = getIndexToInsertAtNewItemInSortedArray(
    scores,
    mainComboData,
    'score',
  )

  scores.splice(insertAt, 0, scoreToSave)

  if (scores.length > APP_CONFIG_VALUES.MAX_SCORES_PER_MAP) {
    const { fullDataFileName } = scores.pop()
    if (fullDataFileName && shouldRemoveOldScoreFile) {
      FileService.deleteSavedComboFile(fullDataFileName)
    }
  }

  return scores
}

function getIndexToInsertAtNewItemInSortedArray(array, newItem, comparedProperty) {
  // Instead of sorting the array every time the score is added, add it with maintaning the correct order.
  const isComparedPropertyValid = comparedProperty && typeof comparedProperty === 'string'

  let comparator = isComparedPropertyValid
    ? (a, b) => {
        if (a[comparedProperty] < b[comparedProperty]) return 1
        if (a[comparedProperty] > b[comparedProperty]) return -1
        if (a[comparedProperty] === b[comparedProperty]) return 0
      }
    : (a, b) => a - b

  let insertAt = bs(
    array,
    newItem,
    comparator,
  )

  // bs returns -(index + 1) if the item is found. Do a simple calculation to get the desired index. indexAt will be positive if the value exists in the array already, so in this case, return decremented index of the old value.
  if (insertAt < 0) { 
    insertAt = insertAt * -1 - 1
  }

  return insertAt
}  

function isNewScoreWorthSaving(scores, newScore) {
  if (scores.length < APP_CONFIG_VALUES.MAX_SCORES_PER_MAP) {
    return true
  }

  const lowestSavedScore = scores[APP_CONFIG_VALUES.MAX_SCORES_PER_MAP - 1] //  lowest score will always be last in this array

  if (lowestSavedScore && lowestSavedScore.score) {
    return newScore > lowestSavedScore.score
  }

  return false
}

export {
  saveNewCombo,
  getIndexToInsertAtNewItemInSortedArray,
  isNewScoreWorthSaving,
}
