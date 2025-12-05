import { log } from '../debug/debugHelpers';
import { createNewHighscoresJson, isFileBiggerThan } from './index';

const fs = require('node:fs')
const path = require('node:path')

function getSimplifiedComboDataFromComboFile(comboFileName, comboData) {
  const {
    mainComboData,
    manualData,
    grindData,
    comboTrackingNumbers
  } = comboData.stats

  const {
    score,
    basePoints,
    multiplier,
    comboTime,
    mapName,
    date
  } = mainComboData
  
  const grindTime = grindData.grindTime;
  const manualTime = manualData.manualTime;
  
  const fullDataFileName = comboFileName.replace('.json', '');
  
  const scoreData = {
    score,
    basePoints,
    multiplier,
    comboTime,
    mapName,
    date,
    grindTime,
    manualTime,
    fullDataFileName
  }

  return { scoreData, comboTrackingNumbers };
}

function findMapScriptNameAndCategory(mapName, mapCategoriesObject) {
  for (const mapCategory of Object.keys(mapCategoriesObject)) {
    for (const mapScriptName of Object.keys(mapCategoriesObject[mapCategory])) {
      if (mapCategoriesObject[mapCategory][mapScriptName].name === mapName) {
        return { mapCategory, mapScriptName };
      }
    }
  }
}

function updateHighscoresMapData(mapData, simpleComboData, isAllMaps) {
  const { scoreData, comboTrackingNumbers } = simpleComboData;

  const comboTrackingNumber = isAllMaps
    ? comboTrackingNumbers.generalComboNumber
    : comboTrackingNumbers.mapComboNumber

  if (comboTrackingNumber > mapData.combosTracked) {
    mapData.combosTracked = comboTrackingNumber
  }

  mapData.timeSpent += Math.ceil(scoreData.comboTime / 1000)

  const { scores } = mapData;
  scores.push({ ...scoreData})
  scores.sort((a, b) => {
    if (a.score > b.score) return -1;
    if (a.score < b.score) return 1;
    if (a.score === b.score) return 0;
  });

  let newScores = scores.slice(0, 10);

  mapData.scores = newScores;
}

function updateHighscoresFileContentWithScore(highscoresFileContent, simpleComboData) {
  const { allMaps, mapCategories } = highscoresFileContent;

  const { mapCategory, mapScriptName } = findMapScriptNameAndCategory(
    simpleComboData.scoreData.mapName,
    mapCategories
  );

  const mapData = mapCategories[mapCategory][mapScriptName];

  if (
    !allMaps.scores.length ||
    allMaps.scores[allMaps.scores.length - 1] &&
    allMaps.scores[allMaps.scores.length - 1].score < simpleComboData.scoreData.score
  ) {
    updateHighscoresMapData(allMaps, simpleComboData, true)
  }

  if (mapData) {
    updateHighscoresMapData(mapData, simpleComboData)
  } else {
    console.error('NO MAP DATA FOUND', mapData);
  }
}

function restoreSingleCombo(highscoresFileContent, comboFileName, comboData) {
  const simpleComboData = getSimplifiedComboDataFromComboFile(comboFileName, comboData)

  updateHighscoresFileContentWithScore(highscoresFileContent, simpleComboData)
}

export async function restoreHighscoresFileFromSavedCombos(
  game,
  highscoresPath,
  combosDirectoryPath
) {
  if (fs.existsSync(highscoresPath)) {
    fs.unlinkSync(highscoresPath);
  }

  await createNewHighscoresJson(game);
  const highscoresFileContent = JSON.parse(fs.readFileSync(highscoresPath, 'utf8'));

  const fileNames = fs.readdirSync(combosDirectoryPath);

  for (const fileName of fileNames) {
    const filePath = path.join(combosDirectoryPath, fileName);

    try {
      if (isFileBiggerThan(filePath, 2)) {
        log(`Found file bigger than 2MB ${fileName} - assuming it's corrupted and removing it`)
        fs.unlinkSync(filePath)
      } else {
        const content = fs.readFileSync(filePath, 'utf8');
        restoreSingleCombo(highscoresFileContent, fileName, JSON.parse(content));
      }
    } catch (err) {
      console.error(`Error reading file - ${fileName}. The file will be deleted.`, err);
      fs.unlinkSync(filePath)
    }
  }

  fs.writeFileSync(highscoresPath, JSON.stringify(highscoresFileContent, null, 2));
}
