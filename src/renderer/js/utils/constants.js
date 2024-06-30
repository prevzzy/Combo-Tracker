import { isAppInDebugMode } from "../debug/debugHelpers"

export const GAME_PROCESSES = {
  THUGPRO: 'THUGPro.exe',
  RETHAWED: 'reTHAWed.exe',
  THUG2: 'THUG2.exe',
  THAW: 'THAW.exe',
}

export const GAMES = {
  THUGPRO: 'THUG Pro',
  RETHAWED: 'reTHAWed',
  THUG2: 'THUG2',
  THAW: 'THAW',
}

export const GAMES_BY_PROCESS_NAME = {
  [GAME_PROCESSES.THUGPRO]: GAMES.THUGPRO,
  [GAME_PROCESSES.RETHAWED]: GAMES.RETHAWED,
  [GAME_PROCESSES.THUG2]: GAMES.THUG2,
  [GAME_PROCESSES.THAW]: GAMES.THAW,
}

export const GAME_CONSTANTS = {
  MAX_INT32_VALUE: 2147483647,
  THUGPRO_CAP_SCRIPT: 'sk5ed',
  THUGPRO_MAIN_MENU_SCRIPT: 'skateshop',
  RETHAWED_CAP_SCRIPT: '5ed',
  RETHAWED_MAIN_MENU_SCRIPT: 'mainmenu'
}

export const BALANCE_TIME_VALUES = {
  NEW_GRIND_TIME_AWARD: -0.0858,
  DOUBLE_GRIND_TIME_PENALTY: 2,
  MANUAL_CHEESE_TIME_PENALTY: 2,
  PIVOT_TIME_PENALTY: 1
}

export const APP_CONFIG_VALUES = {
  HIDE_NEW_MAP_MODAL_TIMELEFT: 300000,
  MINIMAL_SAVEABLE_COMBO_LENGTH: isAppInDebugMode() ? 2000 : 15000,
  MINIMAL_SAVEABLE_COMBO_SCORE: 10000,
  MAX_SCORES_PER_MAP: 10,
  MAX_MAP_NAME_INPUT_LENGTH: 25,
}

export const ERROR_STRINGS = {
  UNKNOWN_MAP: 'UNKNOWN MAP',
  STANDARD_ERROR_TEXT: '???'
}

export const COMBO_PAGE_INFO_MESSAGES = {
  HIGHSCORE_DELETE_SUCCESS: 'Highscore deleted.',
  HIGHSCORE_DELETE_FAILED: 'An error occured deleting your highscore.',
  TRACKER_IN_PROGRESS: 'Combo in progress...',
  TRACKER_FAIL: 'Something went wrong. Start a new combo.',
  TRACKER_READY: `Combo tracking ready. Waiting for combo longer than ${APP_CONFIG_VALUES.MINIMAL_SAVEABLE_COMBO_LENGTH / 1000} seconds...`,
  TRACKER_NOT_READY: 'To see combo details do a combo in-game, or click on one of your saved highscores.',
  TRACKER_IDLE: 'Stopped combo tracking due to idle behaviour. Start a new combo.',
  SAVING_LAST_COMBO: 'Saving last combo...',
  GENERAL_ERROR: 'Something went wrong...',
  READING_FILE_FAILED: 'Failed to read combo data.',
  TRACKER_UNAVAILABLE: 'Combo tracking unavailable.'
}

export const ALL_MAPS = 'allMaps'
export const CREATE_A_PARK = 'CREATE-A-PARK'
