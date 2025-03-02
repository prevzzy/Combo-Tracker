import * as MemoryController from '../game/memory'
import { GAME_CONSTANTS } from '../utils/constants'

export class Score {
  constructor () {
    this.basePoints = 0
    this.multiplier = 0
    this.score = 0
    this.bonusBasePoints = 0
    this.basePointsDataset = []
    this.bonusBasePointsDataset = []
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

    return parseInt((this.basePointsDataset[this.basePointsDataset.length - 1] * 1000).toFixed(0), 10)
  }

  getBonusBasePoints() {
    if (this.bonusBasePoints !== 0 || !this.bonusBasePointsDataset.length) {
      return this.bonusBasePoints
    }

    return parseInt((this.bonusBasePointsDataset[this.bonusBasePointsDataset.length - 1] * 1000).toFixed(0), 10)
  }

  update() {
    this.multiplier = MemoryController.getMultiplier()
    this.basePoints = MemoryController.getBasePoints()
    this.score = this.getComboScore(false)
    this.maxRevertPenalty = this.getMaxRevertPenalty()
    this.graffitiTags = MemoryController.getGraffitiTagsCount()
    this.bonusBasePoints = MemoryController.getBonusBasePoints()
  }

  getMaxRevertPenalty() {
    const currentPenalty = MemoryController.getRevertPenalty() 

    return currentPenalty > this.maxRevertPenalty ? currentPenalty : this.maxRevertPenalty
  }

  formatBasePointsForDataset(value) {
    return (value / 1000).toFixed(3)
  }

  formatScoreForDataset(value) {
    return (value / 1000000).toFixed(6)
  }

  updateDatasets() {
    this.basePointsDataset.push(this.formatBasePointsForDataset(MemoryController.getBasePoints()))
    this.multiplierDataset.push(MemoryController.getMultiplier())
    this.scoreDataset.push(this.formatScoreForDataset(this.getComboScore(false)))
    this.revertPenaltyDataset.push(MemoryController.getRevertPenalty())
    this.bonusBasePointsDataset.push(this.formatBasePointsForDataset(MemoryController.getBonusBasePoints()))
  }

  hasNewComboStartedUnnoticed() {
    // In some cases a new combo can be started without multiplier being 0 for even a single frame (e.g. no comply instead of a manual), so an extra check is needed.

    let currentMultiplier = MemoryController.getMultiplier()
    if (currentMultiplier >= 1 && this.multiplierDataset.length > 0) { 
      return this.multiplierDataset[this.multiplierDataset.length - 1] / currentMultiplier > 2
    }
    return false
  }

  getComboScore(isComboLanded = false) {
    // calculatedScore is used only for combos over int32 limit, which are not properly displayed in game anyway.
    // bonusBasePoints are added to the score pot AFTER the combo is landed. It isn't added when the combo is bailed.
    const basePoints = isComboLanded ? this.bonusBasePoints + this.basePoints : this.basePoints;
    let calculatedScore = basePoints * this.multiplier 
    
    return calculatedScore < GAME_CONSTANTS.MAX_INT32_VALUE ? MemoryController.getGameScore() : calculatedScore
  }

  calculateFinalBasePoints(isComboLanded = false) {
    const basePoints = this.getBasePoints();
    const bonusBasePoints = this.getBonusBasePoints();
    return isComboLanded ? basePoints + bonusBasePoints : basePoints;
  }

  calculateFinalScoreManually(isComboLanded = false) {
    return this.getMultiplier() * this.calculateFinalBasePoints(isComboLanded);
  }

  getFinalScore(isComboLanded = false) {
    let finalScore = this.getComboScore(isComboLanded);

    // score may be 0 if combo ended out of bounds
    if (this.hasNewComboStartedUnnoticed() || finalScore === 0) {
      return this.calculateFinalScoreManually(isComboLanded);
    } else {
      return finalScore || this.getScore() // fallback if finalScore is 0
    }
  }

  finishCombo(isComboLanded = false) {
    const finalScore = this.getFinalScore(isComboLanded);
    this.scoreDataset[this.scoreDataset.length - 1] = this.formatScoreForDataset(finalScore);
    this.basePointsDataset[this.basePointsDataset.length - 1] = this.formatBasePointsForDataset(this.calculateFinalBasePoints(isComboLanded));

    return finalScore;
  }
}
