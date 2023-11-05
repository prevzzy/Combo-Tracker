import { log } from '../debug/debugHelpers';
import { maps } from '../utils/maps';
import { createMapObject } from './fileService';

const CUSTOM_LEVELS_CATEGORY = 'CUSTOM LEVELS'

function findTargetMapCategoryForMap(mapScriptName) {
  return Object.keys(maps).find(mapCategory => maps[mapCategory] && maps[mapCategory][mapScriptName])
}

function isMapPlacedInCorrectCategory(mapCategoryName, mapScriptName) {
  if (mapCategoryName === CUSTOM_LEVELS_CATEGORY) {
    return !Object.keys(maps).find(_mapCategoryName =>
      Object.keys(maps[_mapCategoryName]).find(_mapScriptName =>
        mapScriptName === _mapScriptName
      )
    )
  }

  return maps[mapCategoryName] && maps[mapCategoryName][mapScriptName]
}

function isMapNameCorrect(mapName, mapCategoryName, mapScriptName) {
  if (mapCategoryName === CUSTOM_LEVELS_CATEGORY) {
    return true
  }

  return maps[mapCategoryName] && mapName === maps[mapCategoryName][mapScriptName]
}

function sortMapCategoryInDefaultOrder(fileData, mapCategoryName) {
  if (!maps[mapCategoryName]) {
    return
  }

  const defaultMapOrder = Object.keys(maps[mapCategoryName])

  const sortedMapData = {}
  for (const mapScriptName of defaultMapOrder) {
    sortedMapData[mapScriptName] = fileData.mapCategories[mapCategoryName][mapScriptName]
  }

  fileData.mapCategories[mapCategoryName] = sortedMapData
}

function moveMapToCorrectCategory(
  fileData,
  mapScriptName,
  oldMapCategory,
  targetMapCategory
) {
  const mapData = fileData.mapCategories[oldMapCategory][mapScriptName]
  fileData.mapCategories[targetMapCategory][mapScriptName] = mapData

  delete fileData.mapCategories[oldMapCategory][mapScriptName];
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

function handleMovingMapToDifferentMapCategory(fileData, fileMapCategory, mapScriptName) {
  const targetMapCategory = findTargetMapCategoryForMap(
    mapScriptName,
    fileMapCategory === CUSTOM_LEVELS_CATEGORY
  )
  log('incorrect category for map:', mapScriptName, 'in category', fileMapCategory, ', should go to:', targetMapCategory)

  if (targetMapCategory) {
    moveMapToCorrectCategory(
      fileData,
      mapScriptName,
      fileMapCategory,
      targetMapCategory,
    )
  }

  return targetMapCategory
}

function correctMapData(fileData, mapCategories, mapCategory, mapScriptName) {
  let isDataCorrected = false;
  let targetMapCategory = mapCategory;
  const mapData = mapCategories[mapCategory][mapScriptName]

  if (!isMapPlacedInCorrectCategory(mapCategory, mapScriptName)) {
    targetMapCategory = handleMovingMapToDifferentMapCategory(fileData, mapCategory, mapScriptName)
    isDataCorrected = true
  }

  if (!isMapNameCorrect(mapData.name, targetMapCategory, mapScriptName)) {
    setCorrectMapName(mapData, fileData.allMaps, maps[targetMapCategory][mapScriptName])
    isDataCorrected = true
  }

  return isDataCorrected
}

function verifyCategoryContents(
  fileData,
  mapCategory,
  fileMapScriptsForCategory,
  allMapScriptsForCategory
) {
  let isDataCorrected = false
  allMapScriptsForCategory.forEach(mapScriptName => {
    if (!fileMapScriptsForCategory.includes(mapScriptName)) {
      log(`missing map in ${mapCategory}:`, mapScriptName)

      fileData.mapCategories[mapCategory] = {
        ...fileData.mapCategories[mapCategory],
        [mapScriptName]: createMapObject(mapCategory, mapScriptName)
      }
      isDataCorrected = true
    }
  })

  return isDataCorrected
}

export function correctHighscoresFile(fileData) {
  let isDataCorrected = false
  const { mapCategories } = fileData
  Object.keys(mapCategories).forEach(mapCategory => {
    let fileMapScripts = Object.keys(mapCategories[mapCategory])
    
    if (mapCategory !== CUSTOM_LEVELS_CATEGORY) {
      isDataCorrected = verifyCategoryContents(
        fileData,
        mapCategory,
        Object.keys(mapCategories[mapCategory]),
        Object.keys(maps[mapCategory])
      )
    }

    fileMapScripts.forEach(mapScriptName => {
      isDataCorrected = correctMapData(fileData, mapCategories, mapCategory, mapScriptName)
    })

    sortMapCategoryInDefaultOrder(fileData, mapCategory)
  })

  if (isDataCorrected) {
    return fileData
  }
}
