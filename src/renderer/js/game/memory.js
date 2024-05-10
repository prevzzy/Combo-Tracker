import memoryjs from 'memoryjs'
import { log } from '../debug/debugHelpers'
import { CustomError } from '../utils/customError'
import {
  grindTimeAddressData,
  manualTimeAddressData,
  lipTimeAddressData,
  currentMapScriptAddressData,
  basePointsAddressData,
  multiplierAddressData,
  gameScoreAddressData,
  graffitiTagsAddressData,
  stateTypeAddressData,
  revertPenaltyAddressData,
  trickHistoryArrayAddressData,
  trickPropertyOffsets,
  currentTrickNameAddressData,
  trickCountAddressData,
  trickCountWithNoGarbageAddressData,
  currentStanceAddressData,
  specialMeterNumericValueAddressData,
  grindBalanceArrowPositionAddressData,
  manualBalanceArrowPositionAddressData,
  lipBalanceArrowPositionAddressData,
} from './offsets'
import { getActiveGameProcessName } from './gameProcessService'
import { isInMainMenu } from './interGameUtils'

let gameHandle
let processBaseAddress
let grindTimeAddress
let manualTimeAddress
let lipTimeAddress
let grindBalanceArrowPositionAddress
let manualBalanceArrowPositionAddress
let lipBalanceArrowPositionAddress
let currentMapAddress
let basePointsAddress
let multiplierAddress
let gameScoreAddress
let graffitiTagsCountAddress
let stateTypeAddress
let revertPenaltyAddress
let currentTrickNameAddress
let trickCountAddress
let trickCountWithNoGarbageAddress
let currentStanceAddress
let specialMeterNumericValueAddress

function initAddresses (_gameHandle, _processBaseAddress, gameProcessName) {
  gameHandle = _gameHandle
  processBaseAddress = _processBaseAddress

  grindTimeAddress = getAddress(gameHandle, processBaseAddress, grindTimeAddressData[gameProcessName])
  manualTimeAddress = getAddress(gameHandle, processBaseAddress, manualTimeAddressData[gameProcessName])
  lipTimeAddress = getAddress(gameHandle, processBaseAddress, lipTimeAddressData[gameProcessName])
  grindBalanceArrowPositionAddress = getAddress(gameHandle, processBaseAddress, grindBalanceArrowPositionAddressData[gameProcessName])
  manualBalanceArrowPositionAddress = getAddress(gameHandle, processBaseAddress, manualBalanceArrowPositionAddressData[gameProcessName])
  lipBalanceArrowPositionAddress = getAddress(gameHandle, processBaseAddress, lipBalanceArrowPositionAddressData[gameProcessName])
  currentMapAddress = getAddress(gameHandle, processBaseAddress, currentMapScriptAddressData[gameProcessName])
  basePointsAddress = getAddress(gameHandle, processBaseAddress, basePointsAddressData[gameProcessName])
  multiplierAddress = getAddress(gameHandle, processBaseAddress, multiplierAddressData[gameProcessName])
  gameScoreAddress = getAddress(gameHandle, processBaseAddress, gameScoreAddressData[gameProcessName])
  graffitiTagsCountAddress = getAddress(gameHandle, processBaseAddress, graffitiTagsAddressData[gameProcessName])
  stateTypeAddress = getAddress(gameHandle, processBaseAddress, stateTypeAddressData[gameProcessName])
  revertPenaltyAddress = getAddress(gameHandle, processBaseAddress, revertPenaltyAddressData[gameProcessName])
  currentTrickNameAddress = getAddress(gameHandle, processBaseAddress, currentTrickNameAddressData[gameProcessName])
  trickCountAddress = getAddress(gameHandle, processBaseAddress, trickCountAddressData[gameProcessName])
  trickCountWithNoGarbageAddress = getAddress(gameHandle, processBaseAddress, trickCountWithNoGarbageAddressData[gameProcessName])
  currentStanceAddress = getAddress(gameHandle, processBaseAddress, currentStanceAddressData[gameProcessName])
  specialMeterNumericValueAddress = getAddress(gameHandle, processBaseAddress, specialMeterNumericValueAddressData[gameProcessName])
}

// It's hard to predict whether this function will always work. Current checks depend only on relations between incorrectly initialized values that I noticed.
function testInitializedAddresses(gameProcessName) {
  const floatValues = [
    getGrindTime(),
    getManualTime(),
    getLipTime()
  ] // skipping getMultiplier() because for whatever reason it's broken when joining a server with a game in progress. 
  
  const integerValues = [
    getBasePoints(),
    getGameScore(),
    getStateType(),
    getRevertPenalty()
  ]

  function isEveryValueInArrayTheSameAndNot0(array) {
    return array.every(value => {
      return value === array[0] && value !== 0
    })
  }
  
  const currentMapScript = getCurrentMapScript()

  // log(`
  //   gameHandle, ${gameHandle}
  //   processBaseAddress, ${processBaseAddress}
  //   getGrindTime, ${getGrindTime()}
  //   getManualTime, ${getManualTime()}
  //   getLipTime, ${getLipTime()}
  //   getCurrentMapScript, ${getCurrentMapScript()}
  //   getMultiplier,  ${getMultiplier()}
  //   getBasePoints,  ${getBasePoints()}
  //   getGameScore,  ${getGameScore()}
  //   getStateType,  ${getStateType()}
  //   getRevertPenalty,  ${getRevertPenalty()}
  //   getGrindBalanceArrowPosition, ${getGrindBalanceArrowPosition()}
  //   getManualBalanceArrowPosition, ${getManualBalanceArrowPosition()}
  //   getLipBalanceArrowPosition, ${getLipBalanceArrowPosition()}
  //   getGraffitiTagsCount, ${getGraffitiTagsCount()}
  //   getSpecialMeterNumericValue, ${getSpecialMeterNumericValue()}
  //   getTrickCount, ${getTrickCount()}
  //   `
  // )

  // log(`
  //     GrindTimeAddress ${grindTimeAddress.toString(16)}
  //     ManualTimeAddress ${manualTimeAddress.toString(16)}
  //     LipTimeAddress ${lipTimeAddress.toString(16)}
  //     CurrentMapScriptAddress ${getCurrentMapScript()}
  //     MultiplierAddress ${multiplierAddress.toString(16)}
  //     BasePointsAddress ${basePointsAddress.toString(16)}
  //     GameScoreAddress ${gameScoreAddress.toString(16)}
  //     StateTypeAddress ${stateTypeAddress.toString(16)}
  //     RevertPenaltyAddress ${revertPenaltyAddress.toString(16)}
  //   `
  // )

  const currentMultiplier = getMultiplier()
  const currentBasePoints = getBasePoints()
  const gameScore = getGameScore()

  if (currentBasePoints === 0 && currentMultiplier !== 0 && gameScore !== 0) {
    log('basePointsAddress silent update')
    basePointsAddress = getAddress(gameHandle, processBaseAddress, basePointsAddressData[gameProcessName])
  }

  if (currentBasePoints !== 0 && currentMultiplier === 0 && gameScore !== 0) {
    log('multiplierAddress silent update')
    multiplierAddress = getAddress(gameHandle, processBaseAddress, multiplierAddressData[gameProcessName])
  }

  if (currentBasePoints !== 0 && currentMultiplier !== 0 && gameScore === 0) {
    log('gameScoreAddress silent update')
    gameScoreAddress = getAddress(gameHandle, processBaseAddress, gameScoreAddressData[gameProcessName])
  }

  if (
    currentMapScript === '' || 
    isInMainMenu(currentMapScript) &&
    (isEveryValueInArrayTheSameAndNot0(floatValues) &&
    isEveryValueInArrayTheSameAndNot0(integerValues) ||
    lipTimeAddress === lipTimeAddressData[gameProcessName].offsets[0])
  ) {
    throw new CustomError('Game loading...', 2)
  }

  if (currentMultiplier === 0 && isEveryValueInArrayTheSameAndNot0(floatValues)) {
    throw new CustomError('Exit observing mode to start combo tracking.', 1)
  }

  if (
    (
      (currentBasePoints === 0 && currentMultiplier !== 0 && gameScore === 0) ||
      (currentMultiplier % 1 !== 0 && currentMultiplier % 1 !== 0.5)
    ) ||
    (isEveryValueInArrayTheSameAndNot0(floatValues) && isEveryValueInArrayTheSameAndNot0(integerValues))
  ) {
    throw new CustomError('An error occured when reading combo values. Please restart Combo Tracker and THUGPRO.', 1)
  }
}

function getAddress(gameHandle, processBaseAddress, addressData) {
  const { startAddress, offsets } = addressData
  
  const offsetArray = [...offsets]
  
  let address = processBaseAddress + startAddress
  let finalOffset = offsetArray.pop()
  const hasValidFinalOffset = !Number.isNaN(parseInt(finalOffset))

  if (hasValidFinalOffset) {
    address = memoryjs.readMemory(gameHandle, address, memoryjs.PTR)
  }

  if (offsetArray.length) {
    offsetArray.forEach((offset) => {
      address = memoryjs.readMemory(gameHandle, address + offset, memoryjs.PTR)
    })
  }

  if (hasValidFinalOffset) {
    address += finalOffset
  }

  return address
}

function getTrickHistoryArrayAddress() {
  if (!processBaseAddress) {
    throw new Error('Can\'t read memory without processBaseAddress.')
  }
  if (!gameHandle) {
    throw new Error('Can\'t read memory without gameHandle.')
  }

  const trickHistoryArrayAddress = getAddress(gameHandle, processBaseAddress, trickHistoryArrayAddressData[getActiveGameProcessName()])

  return trickHistoryArrayAddress
}

function getTrickDataPointer(index) {
  if (!gameHandle) {
    throw new Error('Can\'t read memory without gameHandle.')
  }

  const activeTrickHistoryAddress = getTrickHistoryArrayAddress()

  if (!activeTrickHistoryAddress) {
    throw new Error('Can\'t read trick data without trick history address specified.')
  }

  return memoryjs.readMemory(gameHandle, activeTrickHistoryAddress + 0x4 * (index), memoryjs.PTR);
}

function getTrickValue(trickDataPointer) {
  return memoryjs.readMemory(gameHandle, trickDataPointer + trickPropertyOffsets[getActiveGameProcessName()].value, memoryjs.INT)
}

function getTrickName(trickDataPointer) {
  return memoryjs.readMemory(gameHandle, trickDataPointer + trickPropertyOffsets[getActiveGameProcessName()].name, memoryjs.STRING);
}

function getTrickFlags(trickDataPointer) {
  return memoryjs.readMemory(gameHandle, trickDataPointer + trickPropertyOffsets[getActiveGameProcessName()].flags, memoryjs.INT);
}

function getGrindTime() {
  return memoryjs.readMemory(gameHandle, grindTimeAddress, memoryjs.FLOAT)
}

function getManualTime() {
  return memoryjs.readMemory(gameHandle, manualTimeAddress, memoryjs.FLOAT)
}

function getLipTime() {
  return memoryjs.readMemory(gameHandle, lipTimeAddress, memoryjs.FLOAT)
}

function getCurrentMapScript() {
  return memoryjs.readMemory(gameHandle, currentMapAddress, memoryjs.STRING)
}

function getMultiplier() {
  return memoryjs.readMemory(gameHandle, multiplierAddress, memoryjs.FLOAT)
}

function getBasePoints() {
  return memoryjs.readMemory(gameHandle, basePointsAddress, memoryjs.INT)
}

function getGameScore() {
  return memoryjs.readMemory(gameHandle, gameScoreAddress, memoryjs.INT)
}

function getGraffitiTagsCount() {
  return memoryjs.readMemory(gameHandle, graffitiTagsCountAddress, memoryjs.INT)
}

function getStateType() {
  return memoryjs.readMemory(gameHandle, stateTypeAddress, memoryjs.INT)
}

function getRevertPenalty() {
  return memoryjs.readMemory(gameHandle, revertPenaltyAddress, memoryjs.INT)
}

function getCurrentTrickName() {
  return memoryjs.readMemory(gameHandle, currentTrickNameAddress, memoryjs.STRING)
}

function getTrickCount() {
  return memoryjs.readMemory(gameHandle, trickCountAddress, memoryjs.INT)
}

function getTrickCountWithNoGarbage() {
  return memoryjs.readMemory(gameHandle, trickCountWithNoGarbageAddress, memoryjs.INT)
}

function getCurrentStance() {
  return memoryjs.readMemory(gameHandle, currentStanceAddress, memoryjs.INT)
}

function getSpecialMeterNumericValue() {
  return memoryjs.readMemory(gameHandle, specialMeterNumericValueAddress, memoryjs.INT)
}

function getGrindBalanceArrowPosition() {
  return memoryjs.readMemory(gameHandle, grindBalanceArrowPositionAddress, memoryjs.FLOAT)
}

function getManualBalanceArrowPosition() {
  return memoryjs.readMemory(gameHandle, manualBalanceArrowPositionAddress, memoryjs.FLOAT)
}

function getLipBalanceArrowPosition() {
  return memoryjs.readMemory(gameHandle, lipBalanceArrowPositionAddress, memoryjs.FLOAT)
}

export {
  initAddresses,
  testInitializedAddresses,
  getGrindTime,
  getManualTime,
  getLipTime,
  getCurrentMapScript,
  getMultiplier,
  getBasePoints,
  getGameScore,
  getGraffitiTagsCount,
  getStateType,
  getRevertPenalty,
  getCurrentTrickName,
  getTrickCount,
  getTrickCountWithNoGarbage,
  getCurrentStance,
  getTrickHistoryArrayAddress,
  getTrickDataPointer,
  getTrickValue,
  getTrickName,
  getTrickFlags,
  getSpecialMeterNumericValue,
}
