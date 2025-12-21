import { Trick } from '../combo/trickHistory';
import { savedCombosFolderPaths } from './index';
import path from 'path';
import fs from 'fs';

function fixGapsInCombo(filePath, comboData) {
  const {
    multiplierFromGaps,
  } = comboData.stats.miscData;

  const {
    tricksInCombo,
  } = comboData.tricks;


  const gaps = tricksInCombo
    .map(trick => new Trick(
      trick.name,
      trick.flags,
      trick.timesUsed,
    ))
    .filter(trick => trick.isGap());

  const actualMultiplierFromGaps = gaps.reduce((gapSum, currentGap) => {
    if (!currentGap?.timesUsed) {
      return gapSum;
    }

    return gapSum + currentGap.timesUsed;
  }, 0);

  if (multiplierFromGaps !== actualMultiplierFromGaps) {
    comboData.stats.miscData.multiplierFromGaps = actualMultiplierFromGaps;
    console.log('GAPS MISMATCH', filePath, multiplierFromGaps, actualMultiplierFromGaps);
    fs.writeFileSync(filePath, JSON.stringify(comboData, null, 2));
  }
}

async function fixGapsForCombosDirectory(dirPath) {
  const tempBackupFilepath = dirPath + '-backup';
  let hasErrors = false;

  try {
    if (fs.existsSync(tempBackupFilepath)) {
      fs.rmSync(tempBackupFilepath, { recursive: true, force: true });
    }

    fs.cpSync(dirPath, tempBackupFilepath, { recursive: true });
    const fileNames = fs.readdirSync(dirPath);

    for (const fileName of fileNames) {
      const filePath = path.join(dirPath, fileName);
  
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        fixGapsInCombo(filePath, JSON.parse(content));
      } catch (err) {
        console.error(`One time gaps fix error - ${fileName}`, err);
      }
    }
  } catch(error) {
    console.error('Failed to fix gaps in directory -', dirPath, error)
    hasErrors = true;
  }

  if (hasErrors) {
    throw new Error('Failed to perform one time gap fix.')
  } else {
    fs.rmSync(tempBackupFilepath, { recursive: true, force: true });
  }
}

export async function fixIncorrectGapsAmountInSavedCombos() {
  if (localStorage.getItem('ran-gaps-fix')) {
    return;
  }

  try {
    const promises = Object.keys(savedCombosFolderPaths).map((game) => 
      fixGapsForCombosDirectory(savedCombosFolderPaths[game])
    );

    await Promise.all(promises);
    localStorage.setItem('ran-gaps-fix', true)
  } catch(error) {
    console.error(error)
  }
}
