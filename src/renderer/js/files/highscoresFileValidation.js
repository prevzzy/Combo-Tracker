import { log } from '../debug/debugHelpers';
import { maps } from '../utils/maps';
import { createMapObject } from './fileService';

const CUSTOM_LEVELS_CATEGORY = 'CUSTOM LEVELS'

function findTargetMapCategoryForMap(game, mapScriptName) {
  return Object.keys(maps[game]).find(mapCategory => maps[game][mapCategory] && maps[game][mapCategory][mapScriptName])
}

function isMapPlacedInCorrectCategory(game, mapCategoryName, mapScriptName) {
  if (mapCategoryName === CUSTOM_LEVELS_CATEGORY) {
    return !Object.keys(maps[game]).find(_mapCategoryName =>
      Object.keys(maps[game][_mapCategoryName]).find(_mapScriptName =>
        mapScriptName === _mapScriptName
      )
    )
  }

  return maps[game][mapCategoryName] && maps[game][mapCategoryName][mapScriptName]
}

function isMapNameCorrect(game, mapName, mapCategoryName, mapScriptName) {
  if (mapCategoryName === CUSTOM_LEVELS_CATEGORY) {
    return true
  }

    return maps[game][mapCategoryName] && mapName === maps[game][mapCategoryName][mapScriptName]
}

function sortMapCategoryInDefaultOrder(game, gameFileData, mapCategoryName) {
  if (!maps[game][mapCategoryName]) {
    return
  }

  const defaultMapOrder = Object.keys(maps[game][mapCategoryName])

  const sortedMapData = {}
  for (const mapScriptName of defaultMapOrder) {
    sortedMapData[mapScriptName] = gameFileData.mapCategories[mapCategoryName][mapScriptName]
  }

  gameFileData.mapCategories[mapCategoryName] = sortedMapData
}

function moveMapToCorrectCategory(
  gameFileData,
  mapScriptName,
  oldMapCategory,
  targetMapCategory
) {
  const mapData = gameFileData.mapCategories[oldMapCategory][mapScriptName]
  gameFileData.mapCategories[targetMapCategory][mapScriptName] = mapData

  delete gameFileData.mapCategories[oldMapCategory][mapScriptName];
}

function setCorrectMapName(mapData, allMapsData, correctMapName) {
  const oldMapName = mapData.name
  mapData.name = correctMapName

  log('incorrect map name:', oldMapName, ', should be:', correctMapName)

  mapData.scores.forEach(score => score.mapName = correctMapName)
  allMapsData.scores.forEach(score => {
    if (score.mapName === oldMapName) {
      score.mapName = correctMapName
    }
  })
}

function handleMovingMapToDifferentMapCategory(game, gameFileData, fileMapCategory, mapScriptName) {
  const targetMapCategory = findTargetMapCategoryForMap(game, mapScriptName)
  log('incorrect category for map:', mapScriptName, 'in category', fileMapCategory, ', should go to:', targetMapCategory)

  if (targetMapCategory) {
    moveMapToCorrectCategory(
      gameFileData,
      mapScriptName,
      fileMapCategory,
      targetMapCategory,
    )
  }

  return targetMapCategory
}

function correctMapData(game, gameFileData, mapCategories, mapCategory, mapScriptName) {
  let isDataCorrected = false;
  let targetMapCategory = mapCategory;
  const mapData = mapCategories[mapCategory][mapScriptName]

  if (!isMapPlacedInCorrectCategory(game, mapCategory, mapScriptName)) {
    targetMapCategory = handleMovingMapToDifferentMapCategory(game, gameFileData, mapCategory, mapScriptName)
    isDataCorrected = true
  }

  if (!isMapNameCorrect(game, mapData.name, targetMapCategory, mapScriptName)) {
    setCorrectMapName(mapData, gameFileData.allMaps, maps[game][targetMapCategory][mapScriptName])
    isDataCorrected = true
  }

  return isDataCorrected
}

function verifyCategoryContents(
  game,
  gameFileData,
  mapCategory,
  fileMapScriptsForCategory,
  allMapScriptsForCategory
) {
  let isDataCorrected = false
  allMapScriptsForCategory.forEach(mapScriptName => {
    if (!fileMapScriptsForCategory.includes(mapScriptName)) {
      log(`missing map in ${mapCategory}:`, mapScriptName)

      gameFileData.mapCategories[mapCategory] = {
        ...gameFileData.mapCategories[mapCategory],
        [mapScriptName]: createMapObject(game, mapCategory, mapScriptName)
      }
      isDataCorrected = true
    }
  })

  return isDataCorrected
}

export function correctHighscoresFile(gameFileData, game) {
  let isDataCorrected = false
  const { mapCategories } = gameFileData
  Object.keys(mapCategories).forEach(mapCategory => {
    let fileMapScripts = Object.keys(mapCategories[mapCategory])
    
    if (mapCategory !== CUSTOM_LEVELS_CATEGORY) {
      isDataCorrected = verifyCategoryContents(
        game,
        gameFileData,
        mapCategory,
        Object.keys(mapCategories[mapCategory]),
        Object.keys(maps[game][mapCategory])
      ) || isDataCorrected
    }

    fileMapScripts.forEach(mapScriptName => {
      isDataCorrected = correctMapData(game, gameFileData, mapCategories, mapCategory, mapScriptName) || isDataCorrected
    })

    sortMapCategoryInDefaultOrder(game, gameFileData, mapCategory)
  })

  if (isDataCorrected) {
    return gameFileData
  }
}
