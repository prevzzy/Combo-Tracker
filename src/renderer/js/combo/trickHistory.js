import { log } from '../debug/debugHelpers'
import { getTrickColorClass } from '../ui/lastCombo/tricks/uiTricks'
import * as MemoryController from '../game/memory'
import { isTrackingRethawed, isTrackingThaw } from '../game/interGameUtils'

const TRICK_CONSTANTS = {
  SWITCH: 'Switch',
  GRIND_GARBAGE_SUFFIXES: ['bonk', 'ding', 'tap', 'kiss', 'clip'],
  BONK_TRICKS: [
    'Tapped The Rail',
    'Clipped The Rail',
    'Dinged The Rail',
    'Bonked The Rail',
    'Kissed The Rail'
  ],
  TRANSFERS: [
    'Spine Transfer',
    'Acid Drop',
    'Hip Transfer',
    'Acid Bomb',
    'Bank Drop'
  ],
  FLIPS_AND_ROLLS: [
    'Backflip',
    'Frontflip',
    'FS Roll',
    'BS Roll',
    'Double Roll',
    'Double Backflip',
    'Double Frontflip'
  ]
}

const FLAGS = {
  SWITCH: 4,
  GAP: 16,
  SPECIAL: 32,
}

const spacesRe = /\\_/g // spaces in trick names are represented by \_
const colorsRe = /\\c[\w]/gi // f.e. special and gap trick colors
const allowedNameSymbolsRe = /[a-zA-Z0-9-!().'\s]/g

class Trick {
  constructor(name = '', flags = 0, timesUsed = 0) {
    this.flags = flags
    this.timesUsed = timesUsed
    
    const trickName = this.parseTrickName(name)
    this.id = `${trickName}_${flags}`
    this.name = trickName
  }

  parseTrickName(name) {
    let parsedName = this.isSwitch() && !this.isGap() && !name.startsWith(`${TRICK_CONSTANTS.SWITCH} `)
      ? `${TRICK_CONSTANTS.SWITCH} `
      : ''

    parsedName += name
      .replace(spacesRe, ' ')
      .replace(colorsRe, '')
      .match(allowedNameSymbolsRe).join('')

    return parsedName
  }

  getStancelessTrickName() {
    return `${this.name}`.replace(`${TRICK_CONSTANTS.SWITCH} `, '');
  }

  isSwitch() {
    return this.flags & FLAGS.SWITCH
  }

  isGap() {
    return this.flags & FLAGS.GAP
  }

  isSpecial() {
    // In THUG2 and THAW doing special tricks in combination with transfer or flips/rolls often results in marking the wrong trick as a special.
    if (this.flags & FLAGS.SPECIAL) {
      const nonSpecialTricks = [
        ...TRICK_CONSTANTS.FLIPS_AND_ROLLS,
        ...TRICK_CONSTANTS.TRANSFERS,
        ...TRICK_CONSTANTS.BONK_TRICKS
      ];
      
      const trickName = this.getStancelessTrickName();
      
      return !nonSpecialTricks.some(trick => trick === trickName);
    }

    return false;
  }
  
  incrementTimesUsedCounter() {
    this.timesUsed++
  }

  isTransferTrick() {
    const trickName = this.getStancelessTrickName();
    return TRICK_CONSTANTS.TRANSFERS.some(transferTrickName => transferTrickName === trickName)
  }

  isDegradeable() {
    return !(this.isGap() || this.isNonMultiTrick() || this.isTransferTrick())
  }

  isNonMultiTrick() {
    const trickNameParts = this.name.split(' ')
    const trickSuffix = trickNameParts[trickNameParts.length - 1]

    return (
      TRICK_CONSTANTS.GRIND_GARBAGE_SUFFIXES.some(suffix => suffix === trickSuffix) ||
      TRICK_CONSTANTS.BONK_TRICKS.some(bonkTrick => bonkTrick === this.name)
    )
  }
}

/*
  Explanation on trick reading logic:

  In-game trick history array length is always the same as the trickCount used in this function, so it's easy to get the data of the latest trick. However, if at a single in-game frame, trickCount value changes by more than 1 (e.g. grind to grind gaps), there is a risk of skipping multiple tricks added to the trick history array at that very frame.
  
  Furthermore, there is an in-game 250 trickCount limit. Then, whenever a new trick is done, the in-game trick array moves its entire content a few indexes backward to make space for the latest tricks. Oldest tricks in the array are removed and new ones are appended.
  
  To avoid really complex logic and dealing with many edge cases, TrickHistory class mimicks the in-game trick history array. Given that there is quite a lot of logic based just on observations, saved trick history might not be 100% the same as the in-game trick history, although the differences should be rare and minimal.

  trickCountNoGarbage is needed for failover THAW trick reading. This value tracks trick count differently from "normal" trickCount as it skips "empty" tricks (ollies, sketchy/clean landings and maybe some other stuff). F.e. if in THAW you are doing three tricks in a row mid-air, the "normal" trickCount gets updated after the second trick is made instead of the first one. The trickCountNoGarbage value however gets updated immediately for every trick. This means that the new trick might not always increment trickCount but will still overwrite the last trick in trick history array (always(?) an "empty" trick). Checking this value assures that no tricks are skipped in trick reading. This value can't be used to directly index the trickPointerArray though, as its value can go higher than 250 (the hardcoded in-game trickCount limit). I'm not sure what is this used for in-game, but it resets on combo bail and persists on combo land.
*/
class TrickHistory {
  constructor() {
    this.tricksInCombo = new Map()
    this.comboHistory = []
    this.trickPointerArray = []
    this.trickCount = 0
    this.gapsHit = 0
    this.trickCountNoGarbage = 0
    this.hasHitTrickCountLimit = false
  }

  compareTricks(trickOne = {}, trickTwo = {}) {
    return trickOne.name === trickTwo.name &&
    trickOne.flags === trickTwo.flags
  }

  addTrickToHistory(trickObject) {
    const existingTrickInCombo = this.tricksInCombo.get(trickObject.id)
      
    if (existingTrickInCombo && this.compareTricks(trickObject, existingTrickInCombo)) {
      existingTrickInCombo.incrementTimesUsedCounter()
    } else {
      this.tricksInCombo.set(trickObject.id, trickObject)
      trickObject.incrementTimesUsedCounter()
    }
  }
  
  updateTricksInCombo(newTricksArray) {
    newTricksArray.forEach((trickObject) => {
      if (trickObject.isGap()) {
        this.gapsHit++;
      }

      this.addTrickToHistory(trickObject);
    })
  }

  getTrickPointer(index) {
    try {
      return MemoryController.getTrickDataPointer(index)
    } catch (error) {
      console.error(error)
    }
  }

  update() {
    const currentTrickCount = MemoryController.getTrickCount()
    const currentTrickCountNoGarbage = MemoryController.getTrickCountWithNoGarbage()

    this.handleNewTricks(currentTrickCount, currentTrickCountNoGarbage)

    if (currentTrickCount === 250 && !this.hasHitTrickCountLimit) {
      log('----TRICK LIMIT HIT----')
      this.hasHitTrickCountLimit = true
    }
    
    this.trickCount = currentTrickCount
    this.trickCountNoGarbage = currentTrickCountNoGarbage
  }

  handleNewTricks(currentTrickCount, currentTrickCountNoGarbage) {
    let trickToReadIndex = currentTrickCount - 1
    let trickToReadPointer = this.getTrickPointer(trickToReadIndex)
    const rescanLastTrickPointer = this.shouldRescanLastTrickPointer(currentTrickCount, currentTrickCountNoGarbage, trickToReadPointer)

    if (
      this.trickPointerArray.length !== 0 &&
      this.trickPointerArray[this.trickPointerArray.length - 1] === trickToReadPointer &&
      !rescanLastTrickPointer
    ) {
      return
    }

    this.adjustTrickPointerArrayStart()
    const newTricksArray = this.readNewTricks(trickToReadIndex, trickToReadPointer, rescanLastTrickPointer)
    this.updateTrickHistoryData(newTricksArray)
  }

  shouldRescanLastTrickPointer(currentTrickCount, currentTrickCountNoGarbage, trickToReadPointer) {
    if (
      (!isTrackingRethawed() && !isTrackingThaw()) ||
      this.isNewTrickPointerAfterLimit(trickToReadPointer)
    ) {
      return false
    }

    const immediatelyUpdatedTrickCountDiff = currentTrickCountNoGarbage - this.trickCountNoGarbage
    const trickCountDiff = currentTrickCount - this.trickCount

    return immediatelyUpdatedTrickCountDiff > trickCountDiff
  }

  isNewTrickPointerAfterLimit(trickToReadPointer) {
    // Stupid, arbitrary and naive but does the job. To assure that the app is not rescanning too many "same" pointer after 250 tricks an additional check for latest 15 tricks is made. If the trick pointer is new then it should be scanned.
    return this.hasHitTrickCountLimit &&
      this.trickPointerArray.length > 15 &&
      !this.trickPointerArray
        .slice(this.trickPointerArray.length - 15)
        .find(pointer => pointer === trickToReadPointer)
  }
  
  adjustTrickPointerArrayStart() {
    let firstInGameTrick = this.getTrickPointer(1)

    if (
      this.trickPointerArray.length < 1 ||
      !this.trickPointerArray[1] ||
      this.trickPointerArray[1] === firstInGameTrick
    ) {
      return
    }

    const firstInGameTrickIndex = this.trickPointerArray.findIndex((trickPointer) =>
      trickPointer === firstInGameTrick
    )
      
    if (firstInGameTrickIndex !== -1) {
      this.trickPointerArray.splice(1, firstInGameTrickIndex - 1)
    }
  }

  readNewTricks(firstTrickToReadIndex, firstTrickToReadPointer, rescanLastTrickPointer) {
    let trickToReadIndex = firstTrickToReadIndex
    let trickToReadPointer = firstTrickToReadPointer
    const newTricksArray = []

    while (trickToReadIndex >= 0) {
      if (this.isTrickPointerScanned(trickToReadIndex, trickToReadPointer)) {
        if (!rescanLastTrickPointer) {
          break;
        }

        rescanLastTrickPointer = false
      }

      const newTrick = this.readSingleTrick(trickToReadPointer)
      if (newTrick) {
        newTricksArray.push(newTrick);
      }
      
      this.trickPointerArray[trickToReadIndex] = trickToReadPointer

      trickToReadIndex = trickToReadIndex - 1
      trickToReadPointer = this.getTrickPointer(trickToReadIndex)
    }

    // In rare scenarios this function can randomly add 250 tricks to trick history (reading backwards from 250 to 0). Let's just assume that over 50 new tricks appearing at the same frame has to be a bug and skip all of them completely.
    if (firstTrickToReadIndex - trickToReadIndex > 50) {
      console.error('Most likely fell into a trick reading loop. Skipping.')
      return []
    }

    return newTricksArray
  }

  isTrickPointerScanned(index, pointer) {
    return this.trickPointerArray[index] && this.trickPointerArray[index] === pointer;
  }

  updateTrickHistoryData(newTricksArray) {
    this.comboHistory = [...this.comboHistory, ...newTricksArray]
    this.updateTricksInCombo(newTricksArray)
  }

  readSingleTrick(trickDataPointer) {
    const trickInfo = this.getTrickInformation(trickDataPointer)

    if (!trickInfo) {
      return
    }

    // Perfect/sketchy landing also counts as a trick here so check for namelength. Check its max length too to make sure it's not some garbage data.
    if (
      trickInfo.name &&
      trickInfo.name.length > 0 &&
      trickInfo.name.length <= 64
    ) {
      log(trickInfo)
      return new Trick(trickInfo.name, trickInfo.flags, 0)
    }
  }

  getTrickInformation(trickDataPointer) {
    try {
      const value = MemoryController.getTrickValue(trickDataPointer)
      
      // if there is no value, then there is no point of reading more stuff
      if (value) {
        const name = MemoryController.getTrickName(trickDataPointer)
        const flags = MemoryController.getTrickFlags(trickDataPointer)

        return {
          value,
          flags,
          name,
        }
      }
    } catch(error) {
      console.error(error)
    }
  }

  getTricksInComboArray() {
    return Array.from(this.tricksInCombo.values())
  }

  getComboHistoryAsHTML() {
    let trickStringHTML = ''
    this.comboHistory.forEach((trick, i) => {
      trickStringHTML += `<span class='${getTrickColorClass(trick)}'>${trick.name}</span>`
  
      if (i < this.comboHistory.length - 1) {
        trickStringHTML += ' + '
      }
    })
  
    return trickStringHTML
  }

  fixUnmarkedSpecials() {
    const trickArray = Array.from(this.tricksInCombo.values());

    trickArray.forEach((currentTrick, i) => {
      if (!currentTrick.isSpecial()) {
        return;
      }

      trickArray.find((trickToCheck, j) => {
        if (
          i === j ||
          currentTrick.name !== trickToCheck.name ||
          trickToCheck.isSpecial()
        ) {
          return;
        }
        log('Found unmarked special:', trickToCheck.id)
        
        const markedSpecial = new Trick(
          trickToCheck.name,
          trickToCheck.flags + FLAGS.SPECIAL,
          trickToCheck.timesUsed
        );
        
        const existingTrickInCombo = this.tricksInCombo.get(markedSpecial.id);

        if (existingTrickInCombo) {
          existingTrickInCombo.timesUsed += markedSpecial.timesUsed
        } else {
          this.tricksInCombo.set(markedSpecial.id, markedSpecial)
        }

        this.tricksInCombo.delete(trickToCheck.id)
      })
    })
  }

  finishTrickReading() {
    this.fixUnmarkedSpecials();
  }
}

export {
  TRICK_CONSTANTS,
  Trick,
  TrickHistory,
}
