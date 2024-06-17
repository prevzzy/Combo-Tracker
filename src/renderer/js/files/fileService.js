const fs = require('fs')
const path = require('path')
import rimraf from 'rimraf'
import { ALL_MAPS, GAME_PROCESSES } from '../utils/constants'
import { maps } from '../utils/maps'
import { correctHighscoresFile } from './highscoresFileValidation'
import { log } from '../debug/debugHelpers'
import * as OverlayUI from '../ui/uiOverlay'
import * as SavedCombosService from '../combo/savedCombosService'
import { isTrackingThugPro } from '../game/interGameUtils'

let highscoresJsonPaths
let savedCombosFolderPaths

function setSavingPaths(paths) {
  const {
    appDataPath,
    appFolderPath
  } = paths

  const folderPathToUse = process.env.APP_MODE === 'DEBUG' ? appFolderPath : appDataPath;

  highscoresJsonPaths = {
    [GAME_PROCESSES.THUGPRO]: path.join(folderPathToUse, 'highscores.json'),
    [GAME_PROCESSES.RETHAWED]: path.join(folderPathToUse, 'highscores-reTHAWed.json'),
  }
  savedCombosFolderPaths = {
    [GAME_PROCESSES.THUGPRO]: path.join(folderPathToUse, 'combos'),
    [GAME_PROCESSES.RETHAWED]: path.join(folderPathToUse, 'combos-reTHAWed')
  }
}

function readAllHighscoreJsons() {
  const promises = Object.keys(highscoresJsonPaths).map((game) => 
    readHighscoresJson(game)
  )

  return Promise.all(promises);
}

function readHighscoresJson(game) {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(highscoresJsonPaths[game])) {
      try {
        log(`no highscores.json for ${game}`)
        await createNewHighscoresJson(game)
      } catch(error) {
        reject(error)
        return
      }
    }

    fs.readFile(highscoresJsonPaths[game], 'utf8', async (error, data) => {
      if (error) {
        reject(error)
        return
      }

      let parsedData = JSON.parse(data);
      try {
        const correctedData = correctHighscoresFile(parsedData, game)
        if (correctedData) {
          log('highscore file needed correcting - overriding')
          parsedData = correctedData;
          await saveHighscoresJson(game, correctedData);
        }
      } catch(error) {
        // It's hard to predict all scenarios that can result in throwing an error here, but having an uncorrected highscores file isn't the end of the world anyway. There is no reason to stop the entire application from running, so just catch the error and move on.
        console.error('an error occured when correcting highscores file', error)
      }

      try {
        SavedCombosService.setSavedCombos(game, parsedData);
        resolve()
      } catch {
        reject(error)
        return;
      }
    })
  })
}

function saveHighscoresJson(game, newSavedCombos) {
  return new Promise((resolve, reject) => {
    fs.writeFile(highscoresJsonPaths[game], JSON.stringify(newSavedCombos), (error) => {
      if (error) {
        OverlayUI.displayOverlay(true, false, `An error occured at ${new Date().toLocaleTimeString()}  while saving your highscores. If the problem persists, please reset your highscores in the settings.`, true)
        
        reject(new Error(error))
      }
      resolve()
    })
  })
}

export function createMapObject(game, mapCategory, mapScriptName) {
  return {
    name: maps[game][mapCategory][mapScriptName],
    combosTracked: 0,
    scores: [],
    timeSpent: 0,
  }
}

function createNewHighscoresJson(game) {
  return new Promise((resolve, reject) => {
    let mapCategoriesJson = {}

    for (const mapCategory in maps[game]) {
      const mapScriptNamesInCategory = Object.keys(maps[game][mapCategory])

      mapScriptNamesInCategory.forEach(mapScriptName => {
        mapCategoriesJson = {
          ...mapCategoriesJson,
          [mapCategory]: {
            ...mapCategoriesJson[mapCategory],
            [mapScriptName]: createMapObject(game, mapCategory, mapScriptName),
          }
        }
      })
    }

    const newJson = {
      [ALL_MAPS]: {
        name: 'ALL MAPS',
        combosTracked: 0,
        scores: [],
        timeSpent: 0,
      },
      mapCategories: {
        ...mapCategoriesJson,
        ...(isTrackingThugPro(game) ? { 'CUSTOM LEVELS': {} } : undefined)
      } 
    }

    saveHighscoresJson(game, newJson)
      .then(() => resolve())
      .catch((error) => reject(error))
  })
}

async function resetHighscores(game) {
  await createNewHighscoresJson(game)
  await readHighscoresJson(game)
  await deleteAllSavedCombos(game)
}

function saveFullComboData(game, comboData, fullDataFileName) {
  if (!fullDataFileName) {
    return
  }

  function saveJson(resolve, reject) {
    fs.writeFile(path.join(savedCombosFolderPaths[game], `${fullDataFileName}.json`), JSON.stringify(comboData), (error) => {
      if (error) {
        OverlayUI.displayOverlay(true, false, `Failed to save detailed combo data.`, true)

        reject(new Error(error))
      }
      resolve()
    })
  }

  return new Promise((resolve, reject) => {
    if (fs.existsSync(savedCombosFolderPaths[game])) {
      saveJson(resolve, reject)
    } else {
      fs.mkdir(savedCombosFolderPaths[game], {}, (err) => {
        if (err) {
          console.error(err)
        } else {
          saveJson(resolve, reject)
        }
      })
    }
  })
}

function isPathWritable(newPath) {
  // TODO: fix
  // try {
  //   const pathToTest = path.join(newPath, `test.txt`)
  //   fs.writeFileSync(pathToTest, 'test')
  //   fs.unlinkSync(pathToTest)
  //   return true
  // } catch (error) {
  //   console.error(error)
  //   return false
  // }

  return true
}

function readSavedComboFile(game, fileName) {
  if (!fileName) {
    return
  }

  return new Promise((resolve, reject) => {
    fs.readFile(path.join(savedCombosFolderPaths[game], `${fileName}.json`), 'utf8', (error, data) => {
      if (error || !data) {
        reject(error)
        return
      }

      resolve(JSON.parse(data))
    })
  })
}

function deleteSavedComboFile(game, fileName) {
  if (!fileName) {
    return
  }

  return new Promise((resolve, reject) => {
    fs.unlink(path.join(savedCombosFolderPaths[game], `${fileName}.json`), (error) => {
      if (error) {
        reject(error)
        return;
      }

      resolve()
    })
  })
}

function deleteAllSavedCombos(game) {
  return new Promise((resolve, reject) => {
    rimraf(savedCombosFolderPaths[game], error => {
      if (error) {
        reject(error)
        return;
      }
      resolve()
    })
  })
}

export {
  setSavingPaths,
  saveHighscoresJson,
  readAllHighscoreJsons,
  resetHighscores,
  saveFullComboData,
  isPathWritable,
  readSavedComboFile,
  deleteSavedComboFile,
  deleteAllSavedCombos,
}
