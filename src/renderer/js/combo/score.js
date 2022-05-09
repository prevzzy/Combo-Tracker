import * as MemoryController from '../game/memory'
import { GAME_CONSTANTS } from '../utils/constants'

export class Score {
  constructor () {
    this.basePoints = 0
    this.multiplier = 0
    this.score = 0
    this.basePointsDataset = []
    this.multiplierDataset = []
    this.scoreDataset = []
    this.revertPenaltyDataset = []
    this.maxRevertPenalty = 0
    this.graffitiTags = 0
  }

  // These getters are only a workaround for a pretty annoying case. Host ending current game (e.g. combo mambo) or host starting a new game, seem to trigger some kind of a double update on registry values, which in 90% of the time results in displaying 0 instead of real combo values.
  // Displaying last registered values in datasets kind of fixes this issue, although it's still a rather bad hack. Datasets are updated only every 1000ms, whereas score, multiplier and basePoints are updated every 16ms. Therefore, if the hack is used, the final displayed (and saved) combo values will almost always be a bit off.
  getScore() {
    if (this.score !== 0 || !this.scoreDataset.length) {
      return this.score
    }

    // Fixing to 0 because math in js
    return parseInt((this.scoreDataset[this.scoreDataset.length - 1] * 1000000).toFixed(0), 10)
  }

  getMultiplier() {
    if (this.multiplier !== 0 || !this.multiplierDataset.length) {
      return this.multiplier
    }

    return this.multiplierDataset[this.multiplierDataset.length - 1]
  }

  getBasePoints() {
    if (this.basePoints !== 0 || !this.basePointsDataset.length) {
      return this.basePoints
    }

    // Fixing to 0 because math in js
    return parseInt((this.basePointsDataset[this.basePointsDataset.length - 1] * 1000).toFixed(0), 10)
  }

  update() {
    this.multiplier = MemoryController.getMultiplier()
    this.basePoints = MemoryController.getBasePoints()
    this.score = this.getCurrentComboScore()
    this.maxRevertPenalty = this.getMaxRevertPenalty()
    this.graffitiTags = MemoryController.getGraffitiTagsCount()
  }

  getMaxRevertPenalty() {
    const currentPenalty = MemoryController.getRevertPenalty() 

    return currentPenalty > this.maxRevertPenalty ? currentPenalty : this.maxRevertPenalty
  }

  updateDatasets() {
    this.basePointsDataset.push((MemoryController.getBasePoints() / 1000).toFixed(3))
    this.multiplierDataset.push(MemoryController.getMultiplier())
    this.scoreDataset.push((this.getCurrentComboScore() / 1000000).toFixed(6))
    this.revertPenaltyDataset.push(MemoryController.getRevertPenalty())
  }

  hasNewComboStartedUnnoticed() {
    // In some cases a new combo can be started without multiplier being 0 for even a single frame (e.g. no comply instead of a manual), so an extra check is needed.

    let currentMultiplier = MemoryController.getMultiplier()
    if (currentMultiplier >= 1 && this.multiplierDataset.length > 0) { 
      return this.multiplierDataset[this.multiplierDataset.length - 1] / currentMultiplier > 2
    }
    return false
  }

  getCurrentComboScore() {
    // In-game score isn't always exactly equal to basePoints * multiplier. Therefore, to match in-game displayed score of combos lower than 2.147+ billion, in-game score is used. calculatedScore is used only for combos over int32 limit, which are not properly displayed in game anyway.
    let calculatedScore = this.basePoints * this.multiplier 
    
    return calculatedScore < GAME_CONSTANTS.MAX_INT32_VALUE ? MemoryController.getGameScore() : calculatedScore
  }

  getFinalScore() {
    if (this.hasNewComboStartedUnnoticed() || this.getCurrentComboScore() === 0) { // score may be 0 if combo ended out of bounds
      return this.getMultiplier() * this.getBasePoints()
    } else {
      return this.getScore()
    } 
  }
}
