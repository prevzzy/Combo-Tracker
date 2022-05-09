import memoryjs from 'memoryjs'
import { GAME_CONSTANTS } from '../utils/constants'
import { CustomError } from '../utils/customError'
import * as LastComboUI from '../ui/lastCombo/uiLastCombo'
import * as MemoryController from './memory'
import * as ComboTracker from '../combo/tracker'
import { log } from '../debug/debugHelpers'
import { setupGlobalError } from '../ui/globalError'
import { watchActiveMap, setActiveMapData } from '../ui/uiHighscores'

let gameInstanceExists = false

function hasActiveGameInstance() {
  return gameInstanceExists
}

function isGameRunning() {
  try {
    memoryjs.openProcess(GAME_CONSTANTS.THUGPRO_PROCESS_NAME)
    return true
  } catch {
    return false
  }
}

function openProcess(name) {
  memoryjs.openProcess(name, (error, processObject) => {
    if (error) {
      throw new CustomError('Could not find THUGPRO process.', 1)
    } else {
      MemoryController.initAddresses(processObject.handle, processObject.modBaseAddr)
      MemoryController.testInitializedAddresses()

      gameInstanceExists = true
    }
  })
}

async function handleHookingToGameProcess() {
  log('...handleHookingToGameProcess')
  try {
    openProcess(GAME_CONSTANTS.THUGPRO_PROCESS_NAME)

    log('openProcess OK')
    await ComboTracker.resumeComboTracking()
  } catch(error) {
    if (!ComboTracker.isComboTrackingSuspended()) {
      LastComboUI.setLastComboPageInfo(
        true,
        'To see combo details do a combo in-game, or click on one of your saved highscores.',
        3,
        LastComboUI.hasDisplayedComboDetails()
      );
    }

    ComboTracker.shouldSuspendComboTracking(true)
    log('openProcess FAIL')
    console.error(error)
    setupGlobalError(true, error.message, error.status)
  }
}

async function checkMemoryControllerHealth() {
  log('...checkMemoryControllerHealth')
  try {
    MemoryController.testInitializedAddresses();
    log('healthCheck OK')

    if (ComboTracker.isComboTrackingSuspended()) {
      log('resuming ComboTracker')
      await ComboTracker.resumeComboTracking()
    }
  } catch (error) {
    log('healthCheck FAIL - suspending ComboTracker')
    console.error(error);
    setupGlobalError(true, error.message, error.status)
    handleHookingToGameProcess()
    ComboTracker.shouldSuspendComboTracking(true)
  }
}

async function mainLoop() {
  setTimeout(async () => {
    if (isGameRunning() && hasActiveGameInstance()) {
      await checkMemoryControllerHealth()
      watchActiveMap()
    } else {
      gameInstanceExists = false
      handleHookingToGameProcess()
      setActiveMapData()
    }

    await mainLoop()
  }, 5000)
}

export {
  hasActiveGameInstance,
  openProcess,
  mainLoop,
  handleHookingToGameProcess,
}
