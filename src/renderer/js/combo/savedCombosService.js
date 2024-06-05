import { isInCreateAPark } from '../game/interGameUtils'
import { CREATE_A_PARK, GAME_PROCESSES } from '../utils/constants'

let savedCombos = {
  [GAME_PROCESSES.THUGPRO]: {},
  [GAME_PROCESSES.RETHAWED]: {}
}

function setSavedCombos(game, newCombos) {
  savedCombos[game] = newCombos
}

function getSavedCombos(game) {
  return savedCombos[game]
}

function getAllMapsData(game) {
  const savedCombos = getSavedCombos(game)

  return savedCombos && savedCombos.allMaps
}

function getAllMapCategoriesData(game) {
  const savedCombos = getSavedCombos(game)

  return savedCombos && savedCombos.mapCategories
}

function getMapCategory(game, mapScriptName) {
  const allMapCategories = getAllMapCategoriesData(game)

  return Object
    .keys(allMapCategories)
    .find(mapCategory => allMapCategories[mapCategory][mapScriptName])
}

function getMapCategoryData(game, mapCategory) {
  const mapCategories = getAllMapCategoriesData(game)

  return mapCategories && mapCategories[mapCategory]
}

function getMapData(game, mapCategory, mapScriptName) {
  const mapCategoryData = getMapCategoryData(game, mapCategory)

  return mapCategoryData && mapCategoryData[mapScriptName]
}

function getMapName(game, mapScriptName) {
  const allMapCategories = getAllMapCategoriesData(game)
  
  if (!allMapCategories) {
    return
  }

  if (isInCreateAPark(mapScriptName)) {
    return CREATE_A_PARK
  }

  for (let mapCategory in allMapCategories) {
    if (allMapCategories[mapCategory][mapScriptName]) {
      return allMapCategories[mapCategory][mapScriptName].name
    }
  }
}

function getMapCategoriesArray(game) {
  const allMapCategories = getAllMapCategoriesData(game)
  return Object.keys(allMapCategories)
}

function deleteHighscoreFromAppSavedCombos(game, highscoreFileName) {
  const savedCombos = getSavedCombos(game)
  const allMapsScores = savedCombos.allMaps.scores
  const oldLowestAllMapsHighscore = allMapsScores[allMapsScores.length - 1]
  let newLowestAllMapsHighscore

  Object.keys(savedCombos.mapCategories).forEach(mapCategory =>
    Object.keys(savedCombos.mapCategories[mapCategory]).forEach(mapScriptName => {
      const { scores } = savedCombos.mapCategories[mapCategory][mapScriptName];

      scores.forEach(scoreData => {
        const { score } = scoreData

        if (
          (!newLowestAllMapsHighscore || score > newLowestAllMapsHighscore.score) &&
          score < oldLowestAllMapsHighscore.score
        ) {
          newLowestAllMapsHighscore = scoreData
        }
      })

      removeScoreFromScoresArrayByFileName(scores, highscoreFileName)
    })
  )

  const hasDeletedScoreFromAllMaps = removeScoreFromScoresArrayByFileName(allMapsScores, highscoreFileName)

  if (hasDeletedScoreFromAllMaps && newLowestAllMapsHighscore) {
    allMapsScores[allMapsScores.length] = newLowestAllMapsHighscore
  }

  return savedCombos
}

function removeScoreFromScoresArrayByFileName(scores, highscoreFileName) {
  const scoreToDeleteIndex = scores.findIndex(score =>
    score.fullDataFileName === highscoreFileName
  )

  if (scoreToDeleteIndex !== -1) {
    scores.splice(scoreToDeleteIndex, 1);
    return true;
  }
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
  deleteHighscoreFromAppSavedCombos,
}
