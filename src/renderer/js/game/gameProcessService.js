import memoryjs from 'memoryjs'
import { GAME_PROCESSES } from '../utils/constants'
import { CustomError } from '../utils/customError'
import * as LastComboUI from '../ui/lastCombo/uiLastCombo'
import * as MemoryController from './memory'
import * as ComboTracker from '../combo/tracker'
import { log } from '../debug/debugHelpers'
import { setupGlobalError } from '../ui/globalError'
import { updateActiveMapData, setActiveMapData } from '../ui/uiHighscores'

const supportedGames = [
  GAME_PROCESSES.THUGPRO,
  GAME_PROCESSES.RETHAWED
]

let activeGameProcessName

function getActiveGameProcessName() {
  return activeGameProcessName
}

function hasActiveGameInstance() {
  return !!activeGameProcessName
}

function isGameRunning() {
  try {
    // memoryjs.openProcess(Number(process.env.GAME_PROCESS_NAME))
    memoryjs.openProcess(activeGameProcessName)
    return true
  } catch {
    return false
  }
}

function scanProcessesForSupportedGame() {
  const gameProcess = memoryjs.getProcesses().find(process =>
    supportedGames.find(game => game === process.szExeFile)
  );

  if (!gameProcess) {
    log('No active game found.')
  }

  return gameProcess?.szExeFile
}

function openProcess(gameProcessName) {
  return new Promise((resolve, reject) => {
    memoryjs.openProcess(gameProcessName, (error, processObject) => {
      if (error) {
        reject(new CustomError(`Could not find THUG Pro or reTHAWed process.`, 1));
      } else {
        MemoryController.initAddresses(processObject.handle, processObject.modBaseAddr, gameProcessName)
        MemoryController.testInitializedAddresses(gameProcessName)
  
        activeGameProcessName = gameProcessName
        resolve(true);
      }
    })
  })
}

async function handleHookingToGameProcess(gameProcessName) {
  log('...handleHookingToGameProcess')

  try {
    await openProcess(gameProcessName)
    // openProcess(Number(process.env.GAME_PROCESS_NAME))

    log(`openProcess ${gameProcessName} OK`)

    if (ComboTracker.isComboTrackingSuspended()) {
      log('resuming ComboTracker')
      await ComboTracker.resumeComboTracking()
    }

    return gameProcessName;
  } catch (error) {
    if (!ComboTracker.isComboTrackingSuspended()) {
      LastComboUI.displayDefaultComboPageInfo()
    }

    ComboTracker.shouldSuspendComboTracking(true)
    log(`openProcess ${gameProcessName} FAIL`)
    console.error(error)
    setupGlobalError(true, error.message, error.status)
  }
}

async function checkMemoryControllerHealth() {
  log('...checkMemoryControllerHealth')
  try {
    MemoryController.testInitializedAddresses(activeGameProcessName);
    log('healthCheck OK')

    if (ComboTracker.isComboTrackingSuspended()) {
      await ComboTracker.resumeComboTracking()
    }
  } catch (error) {
    log('healthCheck FAIL - suspending ComboTracker')
    console.error(error);
    setupGlobalError(true, error.message, error.status)
    await handleHookingToGameProcess(activeGameProcessName)
    ComboTracker.shouldSuspendComboTracking(true)
  }
}

async function mainLoop() {
  mainLoopLogic()

  setInterval(async () => {
    await mainLoopLogic()
  }, 5000)
}

async function mainLoopLogic() {
  if (hasActiveGameInstance() && isGameRunning()) {
    await checkMemoryControllerHealth()
    updateActiveMapData(activeGameProcessName)
  } else {
    activeGameProcessName = scanProcessesForSupportedGame()

    if (!activeGameProcessName) {
      setupGlobalError(true, 'Could not find THUG Pro or reTHAWed process.', 1);
      setActiveMapData()
    }

    await handleHookingToGameProcess(activeGameProcessName || '')
  }
}

export {
  getActiveGameProcessName,
  hasActiveGameInstance,
  mainLoop,
}
