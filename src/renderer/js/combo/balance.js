import { log } from '../debug/debugHelpers'
import { isTrackingRethawed, isTrackingThaw } from '../game/interGameUtils'
import * as MemoryController from '../game/memory'
import { GAME_CONSTANTS } from '../utils/constants'

const BALANCE_PENALTIES = {
  CHEESE: 'CHEESE',
  PIVOT: 'PIVOT',
  CHEESE_AND_PIVOT: 'CHEESE_AND_PIVOT',
  DOUBLE_GRIND: 'DOUBLE_GRIND',
  TAG_LIMIT_1: 'TAG_LIMIT_1',
  TAG_LIMIT_2: 'TAG_LIMIT_2',
  TAG_LIMIT_3: 'TAG_LIMIT_3',
  TAG_LIMIT_1_AND_DOUBLE_GRIND: 'TAG_LIMIT_1_AND_DOUBLE_GRIND',
  TAG_LIMIT_2_AND_DOUBLE_GRIND: 'TAG_LIMIT_2_AND_DOUBLE_GRIND',
  TAG_LIMIT_3_AND_DOUBLE_GRIND: 'TAG_LIMIT_3_AND_DOUBLE_GRIND',
}

class Range {
  constructor(start, end) {
    this.start = start
    this.end = end
  }

  contains(value) {
    return value >= this.start && value < this.end
  }
}

class GrindDataIncrementation {
  constructor(tagLimitAddedTime, doubleGrindsAmount) {
    this.tagLimitAddedTime = tagLimitAddedTime
    this.doubleGrindsAmount = doubleGrindsAmount
  }
}

class ManualDataIncrementation {
  constructor(manualCheeseAmount, pivotsAmount) {
    this.manualCheeseAmount = manualCheeseAmount
    this.pivotsAmount = pivotsAmount
  }
}

const manualBalancePenaltyRanges = {
  CHEESE: new Range(1.999, 2.2),
  PIVOT: new Range(0.999, 1.2),
  CHEESE_AND_PIVOT: new Range (2.999, Number.MAX_SAFE_INTEGER)
}

const grindBalancePenaltyRanges = {
  DOUBLE_GRIND: new Range(1.999, 2.2),
  TAG_LIMIT_1: new Range(1.8, 1.999),
  TAG_LIMIT_2: new Range(3.1, 3.4),
  TAG_LIMIT_3: new Range(4.8, 5.1),
  TAG_LIMIT_1_AND_DOUBLE_GRIND: new Range(3.9, 4.2),
  TAG_LIMIT_2_AND_DOUBLE_GRIND: new Range(5.2, 5.5),
  TAG_LIMIT_3_AND_DOUBLE_GRIND: new Range(6.9, Number.MAX_SAFE_INTEGER)
}

const ManualBalancePenalties = new Map([
  [BALANCE_PENALTIES.CHEESE, new ManualDataIncrementation(1, 0)],
  [BALANCE_PENALTIES.PIVOT, new ManualDataIncrementation(0, 1)],
  [BALANCE_PENALTIES.CHEESE_AND_PIVOT, new ManualDataIncrementation(1, 1)]
])

const GrindBalancePenalties = new Map([
  [BALANCE_PENALTIES.DOUBLE_GRIND, new GrindDataIncrementation(0, 1)],
  [BALANCE_PENALTIES.TAG_LIMIT_1, new GrindDataIncrementation(2, 0)],
  [BALANCE_PENALTIES.TAG_LIMIT_2, new GrindDataIncrementation(3.33, 0)],
  [BALANCE_PENALTIES.TAG_LIMIT_3, new GrindDataIncrementation(5, 0)],
  [BALANCE_PENALTIES.TAG_LIMIT_1_AND_DOUBLE_GRIND, new GrindDataIncrementation(2, 1)],
  [BALANCE_PENALTIES.TAG_LIMIT_2_AND_DOUBLE_GRIND, new GrindDataIncrementation(3.33, 1)],
  [BALANCE_PENALTIES.TAG_LIMIT_3_AND_DOUBLE_GRIND, new GrindDataIncrementation(5, 1)]
])

class Balance {
  constructor() { 
    this.grindTime = 0
    this.manualTime = 0
    this.lipTime = 0
    this.doubleGrindsAmount = 0
    this.tagLimitAddedTime = 0
    this.newGrindsAmount = 0
    this.manualCheeseAmount = 0
    this.pivotsAmount = 0
    this.stateType = null
    this.manualTimeDataset = []
    this.grindTimeDataset = []
    this.lipTimeDataset = []
    this.score = null
  }

  assumePenaltyRange(balancePenaltyRangeObject, timeDiff) {
    for (let key in balancePenaltyRangeObject) {
      if (balancePenaltyRangeObject[key].contains(timeDiff)) {
        log(key)
        return key
      }
    }
  }

  update(scoreObject) {
    this.score = scoreObject
    this.updateGrindTime()
    this.updateManualTime()
    this.lipTime = MemoryController.getLipTime()
    this.stateType = MemoryController.getStateType()
  }

  updateDatasets() {
    this.manualTimeDataset.push(MemoryController.getManualTime().toFixed(2) * 1)
    this.grindTimeDataset.push(MemoryController.getGrindTime().toFixed(2) * 1)
    this.lipTimeDataset.push(MemoryController.getLipTime().toFixed(2) * 1)
  }

  updateGrindTime() {
    const updatedGrindTime = MemoryController.getGrindTime()
    const grindTimeDiff = updatedGrindTime - this.grindTime 

    this.handleAdditionalGrindTimeLogic(grindTimeDiff)

    this.grindTime = updatedGrindTime
  }

  updateManualTime() {
    const updatedManualTime = MemoryController.getManualTime()
    const manualTimeDiff = updatedManualTime - this.manualTime

    if (this.manualTime !== 0) {
      this.handleAdditionalManualTimeLogic(manualTimeDiff)
    }

    this.manualTime = updatedManualTime
  }

  handleAdditionalGrindTimeLogic(grindTimeDiff) {
    const penalty = this.assumePenaltyRange(grindBalancePenaltyRanges, grindTimeDiff)
    let isDoubleGrindHit = false

    if (penalty) {
      log("grindTimeDiff: ", grindTimeDiff)
      const incrementation = GrindBalancePenalties.get(penalty)

      this.tagLimitAddedTime += incrementation.tagLimitAddedTime
      if (incrementation.doubleGrindsAmount > 0) {
        isDoubleGrindHit = true
      }
      this.doubleGrindsAmount += incrementation.doubleGrindsAmount
    } 

    if (!isDoubleGrindHit) {
      this.updateNewGrindsAmount()
    }
  }

  handleAdditionalManualTimeLogic(manualTimeDiff) {
    const penalty = this.assumePenaltyRange(manualBalancePenaltyRanges, manualTimeDiff)

    if (penalty) {
      log("manualTimeDiff: ", manualTimeDiff)
      const incrementation = ManualBalancePenalties.get(penalty)

      this.manualCheeseAmount += incrementation.manualCheeseAmount
      this.pivotsAmount += incrementation.pivotsAmount
    }
  }

  updateNewGrindsAmount() {
    if (!this.isNewGrindStarted()) {
      return
    }

    if (
      this.score &&
      (isTrackingThaw() || isTrackingRethawed()) && 
      this.score.getCurrentComboScore() > GAME_CONSTANTS.MAX_INT32_VALUE
    ) {
      // in THAW and reTHAWed new grinds don't subtract time after MAX_INT32_VALUE, so simply stop incrementing them
      return
    }
  
    log('-------- NEW GRIND ---------')
    this.newGrindsAmount++
  }

  isNewGrindStarted() {
    return this.grindTime !== 0 && this.stateType !== 4 && MemoryController.getStateType() === 4 // 4 means rail, anything else is not rail
  }
}

export {
  Balance
}
