import { GAME_PROCESSES, GAME_CONSTANTS } from '../utils/constants';
import { getHookedGameProcessName } from './gameProcessService';
import * as MemoryController from './memory';

export function isTrackingThugPro(game) {
  if (!game) {
    game = getHookedGameProcessName()
  }

  return game === GAME_PROCESSES.THUGPRO
}

export function isTrackingRethawed(game) {
  if (!game) {
    game = getHookedGameProcessName()
  }

  return game === GAME_PROCESSES.RETHAWED
}

export function isTrackingThug2(game) {
  if (!game) {
    game = getHookedGameProcessName()
  }

  return game === GAME_PROCESSES.THUG2
}

export function isTrackingThaw(game) {
  if (!game) {
    game = getHookedGameProcessName()
  }

  return game === GAME_PROCESSES.THAW
}

export function isInMainMenu(currentMapScript) {
  if (!currentMapScript) {
    currentMapScript = MemoryController.getCurrentMapScript()
  }

  const mainMenuScripts = [GAME_CONSTANTS.THUGPRO_MAIN_MENU_SCRIPT, GAME_CONSTANTS.RETHAWED_MAIN_MENU_SCRIPT]

  return !!mainMenuScripts.find(script => script === currentMapScript)
}

export function isInCreateAPark(currentMapScript) {
  if (!currentMapScript) {
    currentMapScript = MemoryController.getCurrentMapScript()
  }

  const scripts = [GAME_CONSTANTS.THUGPRO_CAP_SCRIPT, GAME_CONSTANTS.RETHAWED_CAP_SCRIPT]

  return !!scripts.find(script => script === currentMapScript)
}
