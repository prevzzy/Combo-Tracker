const fs = require('fs')
const path = require('path')
import rimraf from 'rimraf'
import { ALL_MAPS } from '../utils/constants'
import { maps } from '../utils/maps'
import * as OverlayUI from '../ui/uiOverlay'
import * as SavedCombosService from '../combo/savedCombosService'

let highscoresJsonPath
let savedCombosFolderPath

function setSavingPaths(paths) {
  const {
    appDataPath,
    appFolderPath
  } = paths

  highscoresJsonPath = path.join(appDataPath, 'highscores.json')
  savedCombosFolderPath = path.join(appDataPath, 'combos')
}

function readHighscoresJson() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(highscoresJsonPath)) {
        createNewHighscoresJson()
          .catch((error) => {
            reject(error)
          })
      }
  
      fs.readFile(highscoresJsonPath, 'utf8', (error, data) => {
        if (error) {
          reject(error)
        }
  
        try {
          SavedCombosService.setSavedCombos(JSON.parse(data));
          resolve()
        } catch {
          reject(error)
        }
      })
    } catch (error) {
      throw new Error(error)
    }
  })
}

function saveHighscoresJson(newSavedCombos) {
  return new Promise((resolve, reject) => {
    fs.writeFile(highscoresJsonPath, JSON.stringify(newSavedCombos), (error) => {
      if (error) {
        OverlayUI.displayOverlay(true, false, `An error occured at ${new Date().toLocaleTimeString()}  while saving your highscores. If the problem persists, please reset your highscores in the settings.`, true)
        
        reject(new Error(error))
      }
      resolve()
    })
  })
}

function createNewHighscoresJson() {
  return new Promise((resolve, reject) => {
    let mapCategoriesJson = {}

    for (const mapCategory in maps) {
      const mapScriptNamesInCategory = Object.keys(maps[mapCategory])

      mapScriptNamesInCategory.forEach(mapScriptName => {
        mapCategoriesJson = {
          ...mapCategoriesJson,
          [mapCategory]: {
            ...mapCategoriesJson[mapCategory],
            [mapScriptName]: {
              name: maps[mapCategory][mapScriptName],
              combosTracked: 0,
              scores: [],
              timeSpent: 0,
            }
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
        'CUSTOM LEVELS': {}
      } 
    }

    saveHighscoresJson(newJson)
      .then(() => resolve())
      .catch((error) => reject(error))
  })
}

async function resetHighscores() {
  await createNewHighscoresJson()
  await readHighscoresJson()
  await deleteAllSavedCombos()
}

function saveFullComboData(comboData, fullDataFileName) {
  if (!fullDataFileName) {
    return
  }

  function saveJson(resolve, reject) {
    fs.writeFile(path.join(savedCombosFolderPath, `${fullDataFileName}.json`), JSON.stringify(comboData), (error) => {
      if (error) {
        OverlayUI.displayOverlay(true, false, `Failed to save detailed combo data.`, true)

        reject(new Error(error))
      }
      resolve()
    })
  }

  return new Promise((resolve, reject) => {
    if (fs.existsSync(savedCombosFolderPath)) {
      saveJson(resolve, reject)
    } else {
      fs.mkdir(savedCombosFolderPath, {}, (err) => {
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

function readSavedComboFile(fileName) {
  if (!fileName) {
    return
  }

  return new Promise((resolve, reject) => {
    fs.readFile(path.join(savedCombosFolderPath, `${fileName}.json`), 'utf8', (error, data) => {
      if (error) {
        reject(error)
      }

      resolve(JSON.parse(data))
    })
  })
}

function deleteSavedComboFile(fileName) {
  if (!fileName) {
    return
  }

  return new Promise((resolve, reject) => {
    fs.unlink(path.join(savedCombosFolderPath, `${fileName}.json`), (error) => {
      if (error) {
        reject(error)
      }

      resolve()
    })
  })
}

function deleteAllSavedCombos() {
  return new Promise((resolve, reject) => {
    rimraf(savedCombosFolderPath, error => {
      if (error) {
        reject(error)
      }
      resolve()
    })
  })
}

export {
  setSavingPaths,
  saveHighscoresJson,
  readHighscoresJson,
  resetHighscores,
  saveFullComboData,
  isPathWritable,
  readSavedComboFile,
  deleteSavedComboFile,
  deleteAllSavedCombos,
}
