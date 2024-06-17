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

  // if a map is not found in any category, then it's a user added map and it should be left unchanged
  const correctMapCategory = findTargetMapCategoryForMap(game, mapScriptName)

  return !correctMapCategory || correctMapCategory === mapCategoryName
}

function isMapNameCorrect(game, mapName, mapCategoryName, mapScriptName) {
  if (
    mapCategoryName === CUSTOM_LEVELS_CATEGORY ||
    !findTargetMapCategoryForMap(game, mapScriptName) // don't correct map names for user added maps with no category
  ) {
    return true
  }

  return maps[game][mapCategoryName] && mapName === maps[game][mapCategoryName][mapScriptName]
}

function sortMapCategoryInDefaultOrder(game, highscoresFileData, mapCategoryName) {
  if (!maps[game][mapCategoryName]) {
    return
  }

  const defaultMapOrder = Object.keys(maps[game][mapCategoryName])

  const sortedMapData = {}
  for (const mapScriptName of defaultMapOrder) {
    sortedMapData[mapScriptName] = highscoresFileData.mapCategories[mapCategoryName][mapScriptName]
  }

  highscoresFileData.mapCategories[mapCategoryName] = {
    ...sortedMapData,
    ...highscoresFileData.mapCategories[mapCategoryName]
  }
}

function moveMapToCorrectCategory(
  highscoresFileData,
  mapScriptName,
  oldMapCategory,
  targetMapCategory
) {
  const mapData = highscoresFileData.mapCategories[oldMapCategory][mapScriptName]
  highscoresFileData.mapCategories[targetMapCategory][mapScriptName] = mapData

  delete highscoresFileData.mapCategories[oldMapCategory][mapScriptName];
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

function handleMovingMapToDifferentMapCategory(game, highscoresFileData, fileMapCategory, mapScriptName) {
  const targetMapCategory = findTargetMapCategoryForMap(game, mapScriptName)
  log('incorrect category for map:', mapScriptName, 'in category', fileMapCategory, ', should go to:', targetMapCategory)

  if (targetMapCategory) {
    moveMapToCorrectCategory(
      highscoresFileData,
      mapScriptName,
      fileMapCategory,
      targetMapCategory,
    )
  }

  return targetMapCategory
}

function correctMapData(game, highscoresFileData, mapCategories, mapCategory, mapScriptName) {
  let isDataCorrected = false;
  let targetMapCategory = mapCategory;
  const mapData = highscoresFileData.mapCategories[mapCategory][mapScriptName]

  if (!isMapPlacedInCorrectCategory(game, mapCategory, mapScriptName)) {
    targetMapCategory = handleMovingMapToDifferentMapCategory(game, highscoresFileData, mapCategory, mapScriptName)
    isDataCorrected = true
  }

  if (!isMapNameCorrect(game, mapData.name, targetMapCategory, mapScriptName)) {
    setCorrectMapName(mapData, highscoresFileData.allMaps, maps[game][targetMapCategory][mapScriptName])
    isDataCorrected = true
  }

  return isDataCorrected
}

function verifyCategoryContents(
  game,
  highscoresFileData,
  mapCategory,
  highscoresFileMapScriptsForCategory,
  applicationDefinedMapScriptsForCategory
) {
  let isDataCorrected = false
  applicationDefinedMapScriptsForCategory.forEach(mapScriptName => {
    if (!highscoresFileMapScriptsForCategory.includes(mapScriptName)) {
      log(`missing map in ${mapCategory}:`, mapScriptName)

      highscoresFileData.mapCategories[mapCategory] = {
        ...highscoresFileData.mapCategories[mapCategory],
        [mapScriptName]: createMapObject(game, mapCategory, mapScriptName)
      }
      isDataCorrected = true
    }
  })

  return isDataCorrected
}

function ensureAllMapCategoriesExistInFile(highscoresFileData, game) {
  let hasMissingCategories = false;
  Object.keys(maps[game]).forEach(mapCategory => {
    if (!highscoresFileData.mapCategories[mapCategory]) {
      console.log(`missing map category for ${game}:`, mapCategory)
      highscoresFileData.mapCategories[mapCategory] = {}
      hasMissingCategories = true;
    }
  })

  return hasMissingCategories
}

export function correctHighscoresFile(highscoresFileData, game) {
  let isDataCorrected = false
  const { mapCategories } = highscoresFileData
  isDataCorrected = ensureAllMapCategoriesExistInFile(highscoresFileData, game)

  Object.keys(mapCategories).forEach(mapCategory => {
    let fileMapScripts = Object.keys(mapCategories[mapCategory])
    
    if (mapCategory !== CUSTOM_LEVELS_CATEGORY) {
      isDataCorrected = verifyCategoryContents(
        game,
        highscoresFileData,
        mapCategory,
        Object.keys(mapCategories[mapCategory]),
        Object.keys(maps[game][mapCategory])
      ) || isDataCorrected
    }

    fileMapScripts.forEach(mapScriptName => {
      isDataCorrected = correctMapData(game, highscoresFileData, mapCategories, mapCategory, mapScriptName) || isDataCorrected
    })

    sortMapCategoryInDefaultOrder(game, highscoresFileData, mapCategory)
  })

  if (isDataCorrected) {
    return highscoresFileData
  }
}
