import { GAME_CONSTANTS, CREATE_A_PARK } from '../utils/constants'

let savedCombos

function setSavedCombos(newCombos) {
  savedCombos = newCombos
}

function getSavedCombos() {
  return savedCombos
}

function getAllMapsData() {
  const savedCombos = getSavedCombos()

  return savedCombos && savedCombos.allMaps
}

function getAllMapCategoriesData() {
  const savedCombos = getSavedCombos()

  return savedCombos && savedCombos.mapCategories
}

function getMapCategory(mapScriptName) {
  const allMapCategories = getAllMapCategoriesData()

  return Object
    .keys(allMapCategories)
    .find(mapCategory => allMapCategories[mapCategory][mapScriptName])
}

function getMapCategoryData(mapCategory) {
  const mapCategories = getAllMapCategoriesData()

  return mapCategories && mapCategories[mapCategory]
}

function getMapData(mapCategory, mapScriptName) {
  const mapCategoryData = getMapCategoryData(mapCategory)

  return mapCategoryData && mapCategoryData[mapScriptName]
}

function getMapName(mapScriptName) {
  const allMapCategories = getAllMapCategoriesData()
  
  if (!allMapCategories) {
    return
  }

  if (mapScriptName === GAME_CONSTANTS.CREATE_A_PARK_MAP_SCRIPT_NAME) {
    return CREATE_A_PARK
  }

  for (let mapCategory in allMapCategories) {
    if (allMapCategories[mapCategory][mapScriptName]) {
      return allMapCategories[mapCategory][mapScriptName].name
    }
  }
}

function getMapCategoriesArray() {
  const allMapCategories = getAllMapCategoriesData()
  return Object.keys(allMapCategories)
}

export {
  setSavedCombos,
  getSavedCombos,
  getAllMapsData,
  getMapCategoryData,
  getMapData,
  getAllMapCategoriesData,
  getMapName,
  getMapCategoriesArray,
  getMapCategory,
}
